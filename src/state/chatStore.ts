/**
 * useChatStore — vòng đời lượt chơi (6.2) + reroll/swipe (19.1):
 * gửi → pipeline (lore + preset + state render) → streaming → EXTRACT ops
 * (5.4c) → SNAPSHOT trước khi áp (5.3) → applyPatch + hiệu ứng lan toả →
 * lượt kế state mới vào prompt (vòng khép kín 5.7.6).
 * Reroll: ROLLBACK snapshot → sinh bản mới → áp ops mới (không cộng dồn).
 * Swipe: đổi bản active → khôi phục snapshot → áp ops của bản đó.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "../lib/id";
import { streamChat } from "../api/client";
import { friendlyMessage, toApiError } from "../api/errors";
import { useConnectionStore } from "./connectionStore";
import { useMvuStore, currentDay } from "./mvuStore";
import { useCombatStore } from "./combatStore";
import { useTerritoryStore } from "./territoryStore";
import { useMilitaryStore } from "./militaryStore";
import { useDiplomacyStore } from "./diplomacyStore";
import { useIntrigueStore } from "./intrigueStore";
import { buildPipeline } from "../prompt/promptPipeline";
import { extractUpdates } from "../mvu/extractor";
import { extractSqlUpdates } from "../mvu/sqlExtractor";
import { findCombatTrigger, findTerritoryChanges, findTavernGameTrigger, findTourneyTrigger, findMilitaryTags, findDiplomacyTags, findIntrigueTags } from "../ui/tags/parseNarrative";
import type { StatData } from "../mvu/schema";
import type { ApiChatMessage } from "../types/connection";
import { callExtraModel, callOffscreenModel } from "../mvu/extraModelCaller";
import { useExtraModelStore } from "../state/extraModelStore";
import { runOffscreenSimAI } from "../npc/offscreenSim";
import { getActiveWorkflowTasks, useWorkflowStore } from "../state/workflowStore";
import { useWorldNewsStore } from "../state/worldNewsStore";
import { marketHeadlines } from "../economy/market";
import { createLogger } from "../lib/log";

const log = createLogger("chat");

export interface MessageVariant {
  /** raw đầy đủ (giữ trong DB — 5.5), gồm cả khối UpdateVariable. */
  raw: string;
  /** text hiển thị (đã cắt khối kỹ thuật). */
  display: string;
  reasoning?: string;
  /** bị người chơi dừng giữa chừng (nội dung chưa trọn). */
  stopped?: boolean;
}

export interface UiChatMessage {
  id: string;
  role: "user" | "assistant";
  /** content của bản active (assistant) hoặc text người chơi (user). */
  content: string;
  createdAt: number;
  stopped?: boolean;
  /** tin hệ thống (vd yêu cầu tường thuật trận) — AI thấy trong history, UI ẩn. */
  hidden?: boolean;
  /** assistant: các bản reroll (19.1). */
  variants?: MessageVariant[];
  activeVariant?: number;
  /** snapshot state TRƯỚC khi áp patch của lượt này — rollback khi reroll/swipe. */
  stateBefore?: StatData;
  /** GĐ3: danh sách path đã thay đổi (để VariableUpdateCard hiển thị). */
  changedPaths?: string[];
  /** GĐ3: tin NPC off-screen (nếu workflow chạy). */
  offscreenNews?: import("../npc/offscreenSim").OffscreenAction[];
}

export interface RetryUiState {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  reason: string;
}

export type ChatStatus = "idle" | "waiting" | "streaming" | "retrying";

interface ChatState {
  messages: UiChatMessage[];
  status: ChatStatus;
  draft: string;
  draftReasoning: string;
  retryInfo: RetryUiState | null;
  error: string | null;

  send: (text: string, opts?: { hidden?: boolean }) => Promise<void>;
  retryLast: () => Promise<void>;
  /** Reroll tin nhắn AI cuối (19.1) — rollback state + sinh bản mới. */
  reroll: () => Promise<void>;
  /** Đổi bản active của tin nhắn AI cuối (swipe ‹ ›) — khôi phục state đúng bản. */
  swipeVariant: (dir: 1 | -1) => void;
  cancel: () => void;
  clearChat: () => void;
  /** Sửa tin nhắn user rồi sinh lại phản hồi AI (edit & reroll). */
  editAndReroll: (index: number, newText: string) => Promise<void>;
  /** Gọi extra model thủ công cho tin nhắn AI cụ thể. */
  triggerExtraForMessage: (messageId: string) => Promise<void>;
}

let abortController: AbortController | null = null;

/** History gửi cho AI: text hiển thị (đã sạch khối kỹ thuật) của bản active. */
function toHistory(messages: UiChatMessage[]): ApiChatMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      /** Sinh 1 phản hồi AI cho history đã cho; trả variant + ops đã áp. */
      async function generate(history: ApiChatMessage[], opts?: { freshSeed?: boolean }): Promise<MessageVariant | null> {
        const profile = useConnectionStore.getState().activeProfile();
        if (!profile.baseUrl || !profile.model) {
          set({ error: "Chưa cấu hình kết nối — mở Cài đặt, nhập Base URL, API key và chọn model." });
          return null;
        }

        abortController = new AbortController();
        set({ status: "waiting", draft: "", draftReasoning: "", retryInfo: null, error: null });

        const built = await buildPipeline(history);
        // reroll với seed API cố định sẽ trả y hệt — tự bỏ seed cho lần tạo lại (19.1)
        const params = opts?.freshSeed && built.params.seed !== undefined ? { ...built.params, seed: undefined } : built.params;
        const effectiveProfile = { ...profile, params };

        try {
          const result = await streamChat(
            effectiveProfile,
            built.messages,
            {
              onText: (t) => set({ status: "streaming", retryInfo: null, draft: get().draft + t }),
              onReasoning: (t) => set({ status: "streaming", draftReasoning: get().draftReasoning + t }),
              onRetry: (info) =>
                set({
                  status: "retrying", draft: "", draftReasoning: "",
                  retryInfo: { attempt: info.attempt, maxRetries: info.maxRetries, delayMs: info.delayMs, reason: friendlyMessage(info.error) },
                }),
            },
            abortController.signal,
          );
          const engine = useExtraModelStore.getState().stateEngine;
          const extract = engine === "auto-database"
            ? extractSqlUpdates(result.text)
            : extractUpdates(result.text);

          // Extra model fallback: nếu main không trả update VÀ extra model bật auto
          const extraStore = useExtraModelStore.getState();
          if (!extract.found && extraStore.enabled && extraStore.autoTrigger) {
            log.info("Main model không trả UpdateVariable — gọi extra model");
            try {
              const extra = await callExtraModel(result.text, abortController?.signal);
              if (extra.ops.length > 0) {
                extract.ops.push(...extra.ops);
                extract.found = true;
                log.info(`Extra model trả ${extra.ops.length} ops`);
              }
            } catch (err) {
              log.warn("Extra model lỗi:", err instanceof Error ? err.message : err);
            }
          }

          const variant: MessageVariant = {
            raw: result.text,
            display: extract.displayText,
            ...(result.reasoning ? { reasoning: result.reasoning } : {}),
          };
          set({ status: "idle", draft: "", draftReasoning: "", retryInfo: null });
          return variant;
        } catch (err) {
          const apiErr = toApiError(err);
          if (apiErr.kind === "aborted") {
            const partial = get().draft;
            set({ status: "idle", draft: "", draftReasoning: "", retryInfo: null, error: null });
            return partial ? { raw: partial, display: partial, stopped: true } : null;
          }
          set({
            status: "idle", draft: "", draftReasoning: "", retryInfo: null,
            error: `Đã thử ${profile.maxRetries + 1} lần vẫn lỗi — ${friendlyMessage(apiErr)}`,
          });
          return null;
        } finally {
          abortController = null;
        }
      }

      /** Áp ops của 1 variant vào state (sau khi đã đứng ở stateBefore). */
      function applyVariant(variant: MessageVariant): void {
        const engine = useExtraModelStore.getState().stateEngine;
        const { ops } = engine === "auto-database"
          ? extractSqlUpdates(variant.raw)
          : extractUpdates(variant.raw);

        // Mệnh lệnh trong lời kể phải được xếp TRƯỚC khi thời gian của chính lượt đó
        // trôi qua. Nhờ vậy hành quân, dựng trại và vây hãm tự tiến triển theo số ngày
        // AI đã báo, thay vì tới cuối lượt mới bắt đầu nhận lệnh.
        const milTags = findMilitaryTags(variant.display);
        if (milTags.length > 0) {
          useMilitaryStore.getState().applyMilitaryTags(milTags);
        }
        useMvuStore.getState().applyAiOps(ops);
        // AI kể tới giao chiến → mở hệ thống chiến đấu (6.2 lượt N, mục 7)
        const trigger = findCombatTrigger(variant.display);
        if (trigger) {
          useCombatStore.getState().startFromTrigger(trigger.attrs, trigger.content);
        }
        // AI kể vùng đổi chủ (chiếm/liên minh/thừa kế) → engine đồng bộ + bản đồ đổi màu (9.5.1)
        for (const tc of findTerritoryChanges(variant.display)) {
          useTerritoryStore.getState().captureRegion(tc.regionId, tc.houseId);
        }
        // AI kể chuyện binh đao (M19): tuyển quân, hiệu triệu chư hầu, đoàn đánh
        // thuê tới chào giá, điều quân, điều rồng — đi qua ĐÚNG luật engine
        // AI kể chuyện ngoại giao (M20): đổi trạng thái, ký/xé hiệp ước, cử sứ,
        // ghi ân oán, đặt lời đề nghị lên bàn
        const dipTags = findDiplomacyTags(variant.display);
        if (dipTags.length > 0) {
          useDiplomacyStore.getState().applyDiplomacyTags(dipTags);
        }
        // AI kể chuyện trong bóng tối (M20): tai mắt, bí mật, âm mưu, con tin
        const intrigueTags = findIntrigueTags(variant.display);
        if (intrigueTags.length > 0) {
          useIntrigueStore.getState().applyIntrigueTags(intrigueTags);
        }
        // AI kể tới quán rượu/thách đấu → chuẩn bị menu mini-game (tavern_game tag)
        const tavernTrigger = findTavernGameTrigger(variant.display);
        if (tavernTrigger) {
          const opponent = tavernTrigger.attrs.opponent ?? "Kẻ lạ mặt";
          const tavern = tavernTrigger.attrs.tavern ?? "Quán rượu";
          // Không tự mở — chỉ đánh dấu; người chơi bấm nút trong TavernGameCard để vào
          log.info(`Phát hiện tavern_game: ${tavern}, đối thủ: ${opponent}`);
        }
        // AI kể về đại hội đấu (tourney tag) → ghi nhận, TourneyCard render inline
        const tourneyTrigger = findTourneyTrigger(variant.display);
        if (tourneyTrigger) {
          const tourneyId = tourneyTrigger.attrs["tourney-id"] ?? "";
          const location = tourneyTrigger.attrs.location ?? "";
          log.info(`Phát hiện tourney: ${tourneyId} tại ${location}`);
        }
      }

      /**
       * GĐ5: Chạy workflow pipeline sau khi AI trả lời.
       * Tasks chạy tuần tự theo stage.
       */
      async function runWorkflowPipeline(): Promise<{
        changedPaths: string[];
        offscreenNews: import("../npc/offscreenSim").OffscreenAction[];
      }> {
        const tasks = getActiveWorkflowTasks();
        if (tasks.length === 0) return { changedPaths: [], offscreenNews: [] };

        const wfStore = useWorkflowStore.getState();
        const collectedPaths: string[] = [];
        const collectedNews: import("../npc/offscreenSim").OffscreenAction[] = [];
        let lastError: string | null = null;

        for (const task of tasks) {
          wfStore.setStatus("running", task.id);
          const start = Date.now();
          try {
            let message = "Hoàn tất";
            if (task.handlerKey === "offscreen-sim") {
              const stat = useMvuStore.getState().stat;
              const result = await runOffscreenSimAI(stat, callOffscreenModel);
              if (result.aiResult && result.aiResult.actions.length > 0) {
                for (const a of result.aiResult.actions) {
                  collectedNews.push({ npcName: a.npcName, action: a.action, newsText: a.newsText });
                  useWorldNewsStore.getState().addHeadline({
                    day: currentDay(),
                    text: a.newsText,
                    source: "offscreen",
                  });
                  if (a.stateChanges) {
                    for (const sc of a.stateChanges) {
                      collectedPaths.push(sc.path);
                    }
                    useMvuStore.getState().applyAiOps(
                      a.stateChanges.map((sc) => ({ op: sc.op as "replace" | "delta", path: sc.path, value: sc.value })),
                    );
                  }
                }
              } else if (result.fallbackActions.length > 0) {
                for (const a of result.fallbackActions) {
                  collectedNews.push(a);
                  useWorldNewsStore.getState().addHeadline({
                    day: currentDay(),
                    text: a.newsText,
                    source: "offscreen",
                  });
                }
              }
              message = result.aiResult ? `${result.aiResult.actions.length} hành động NPC` : `${result.fallbackActions.length} hành động theo luật`;
            } else if (task.handlerKey === "world-news") {
              const stat = useMvuStore.getState().stat;
              const newsStore = useWorldNewsStore.getState();
              const day = currentDay();
              let published = 0;
              for (const [region, market] of Object.entries(stat["Thị Trường Khu Vực"] ?? {})) {
                for (const summary of marketHeadlines(market, 2)) {
                  const text = `Chợ ${region}: ${summary}.`;
                  const alreadyPublished = newsStore.headlines.some((headline) =>
                    headline.day === day && headline.region === region && headline.text === text,
                  );
                  if (alreadyPublished) continue;
                  newsStore.addHeadline({ day, text, region, source: "event" });
                  published++;
                }
              }
              message = published > 0 ? `${published} bản tin thị trường` : "Thị trường không có biến động đáng kể";
            } else {
              throw new Error(`Workflow chưa có handler: ${task.handlerKey}`);
            }

            wfStore.recordResult({
              taskId: task.id, taskName: task.name,
              status: "success", message, durationMs: Date.now() - start,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            lastError = msg;
            log.warn(`Workflow task ${task.name} lỗi:`, msg);
            wfStore.recordResult({
              taskId: task.id, taskName: task.name,
              status: "error", message: msg, durationMs: Date.now() - start,
            });
          }
        }

        wfStore.setStatus(lastError ? "error" : "success", undefined, lastError ?? undefined);
        return { changedPaths: collectedPaths, offscreenNews: collectedNews };
      }

      return {
        messages: [],
        status: "idle",
        draft: "",
        draftReasoning: "",
        retryInfo: null,
        error: null,

        send: async (text, opts) => {
          if (get().status !== "idle") return;
          const trimmed = text.trim();
          if (!trimmed) return;
          // báo cáo trận đã ĐƯỢC tường thuật xong → dùng hết khi người chơi mở lượt mới
          // (giữ qua reroll để lời kể lại vẫn đúng kết quả đã chốt — 19.1)
          const combat = useCombatStore.getState();
          if (!opts?.hidden && combat.reportBlock && combat.reportNarrated) {
            combat.clearReport();
          }
          const userMsg: UiChatMessage = {
            id: genId("msg"), role: "user", content: trimmed, createdAt: Date.now(),
            ...(opts?.hidden ? { hidden: true } : {}),
          };
          set({ messages: [...get().messages, userMsg], error: null });

          const stateBefore = useMvuStore.getState().getSnapshot();
          const variant = await generate(toHistory(get().messages));
          if (!variant) return; // lỗi — user msg giữ lại, nút Thử lại dùng retryLast

          applyVariant(variant);
          if (useCombatStore.getState().reportBlock) useCombatStore.getState().markNarrated();

          // GĐ5: chạy workflow pipeline (offscreen sim, world news, etc.)
          const wfResult = await runWorkflowPipeline();

          const msg: UiChatMessage = {
            id: genId("msg"), role: "assistant", content: variant.display, createdAt: Date.now(),
            variants: [variant], activeVariant: 0, stateBefore,
            changedPaths: wfResult.changedPaths.length > 0 ? wfResult.changedPaths : undefined,
            offscreenNews: wfResult.offscreenNews.length > 0 ? wfResult.offscreenNews : undefined,
          };
          set({ messages: [...get().messages, msg] });
        },

        retryLast: async () => {
          if (get().status !== "idle") return;
          const msgs = get().messages;
          if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return;
          const stateBefore = useMvuStore.getState().getSnapshot();
          const variant = await generate(toHistory(msgs));
          if (!variant) return;
          applyVariant(variant);
          const msg: UiChatMessage = {
            id: genId("msg"), role: "assistant", content: variant.display, createdAt: Date.now(),
            variants: [variant], activeVariant: 0, stateBefore,
          };
          set({ messages: [...get().messages, msg] });
        },

        reroll: async () => {
          if (get().status !== "idle") return;
          const msgs = get().messages;
          const last = msgs[msgs.length - 1];
          if (!last || last.role !== "assistant" || !last.variants || !last.stateBefore) return;

          // 1. ROLLBACK state về trước lượt (19.1 — chống cộng dồn)
          useMvuStore.getState().restoreSnapshot(last.stateBefore);

          // 2. sinh bản mới với CÙNG ngữ cảnh (history không gồm tin nhắn này)
          const history = toHistory(msgs.slice(0, -1));
          const variant = await generate(history, { freshSeed: true });
          if (!variant) {
            // lỗi/huỷ không ra bản mới → áp lại bản active cũ, state quay về như cũ
            applyVariant(last.variants[last.activeVariant ?? 0]);
            return;
          }

          // 3. áp ops bản mới + thêm variant
          applyVariant(variant);
          const updated: UiChatMessage = {
            ...last,
            variants: [...last.variants, variant],
            activeVariant: last.variants.length,
            content: variant.display,
          };
          set({ messages: [...msgs.slice(0, -1), updated] });
          log.info(`Reroll: bản ${updated.variants!.length}`);
        },

        swipeVariant: (dir) => {
          if (get().status !== "idle") return;
          const msgs = get().messages;
          const last = msgs[msgs.length - 1];
          if (!last || last.role !== "assistant" || !last.variants || !last.stateBefore) return;
          const count = last.variants.length;
          if (count <= 1) return;
          const next = ((last.activeVariant ?? 0) + dir + count) % count;
          if (next === last.activeVariant) return;

          // khôi phục snapshot → áp ops của bản được chọn (19.1)
          useMvuStore.getState().restoreSnapshot(last.stateBefore);
          const variant = last.variants[next];
          applyVariant(variant);
          const updated: UiChatMessage = { ...last, activeVariant: next, content: variant.display };
          set({ messages: [...msgs.slice(0, -1), updated] });
        },

        cancel: () => {
          abortController?.abort();
        },

        clearChat: () => {
          abortController?.abort();
          set({ messages: [], status: "idle", draft: "", draftReasoning: "", retryInfo: null, error: null });
        },

        editAndReroll: async (idx, newText) => {
          if (get().status !== "idle") return;
          const msgs = get().messages;
          if (idx < 0 || idx >= msgs.length || msgs[idx].role !== "user") return;
          const trimmed = newText.trim();
          if (!trimmed) return;

          // Tìm tin AI ngay sau tin user này để lấy stateBefore (snapshot trước lượt)
          const aiAfter = idx + 1 < msgs.length && msgs[idx + 1].role === "assistant" ? msgs[idx + 1] : null;

          // Rollback state về TRƯỚC lượt đó
          if (aiAfter?.stateBefore) {
            useMvuStore.getState().restoreSnapshot(aiAfter.stateBefore);
          }

          // Sửa tin user + cắt mọi tin nhắn sau nó
          const editedMsg: UiChatMessage = { ...msgs[idx], content: trimmed };
          const truncated = [...msgs.slice(0, idx), editedMsg];
          set({ messages: truncated, error: null });

          // Sinh lại phản hồi AI
          const stateBefore = useMvuStore.getState().getSnapshot();
          const variant = await generate(toHistory(truncated), { freshSeed: true });
          if (!variant) return;

          applyVariant(variant);
          const wfResult = await runWorkflowPipeline();

          const aiMsg: UiChatMessage = {
            id: genId("msg"), role: "assistant", content: variant.display, createdAt: Date.now(),
            variants: [variant], activeVariant: 0, stateBefore,
            changedPaths: wfResult.changedPaths.length > 0 ? wfResult.changedPaths : undefined,
            offscreenNews: wfResult.offscreenNews.length > 0 ? wfResult.offscreenNews : undefined,
          };
          set({ messages: [...get().messages, aiMsg] });
          log.info(`Edit & reroll: sửa tin tại index ${idx}, sinh lại AI`);
        },

        triggerExtraForMessage: async (messageId) => {
          if (get().status !== "idle") return;
          const msg = get().messages.find((m) => m.id === messageId);
          if (!msg || msg.role !== "assistant" || !msg.variants) return;
          const variant = msg.variants[msg.activeVariant ?? 0];
          if (!variant) return;

          const extraStore = useExtraModelStore.getState();
          if (!extraStore.enabled || !extraStore.baseUrl || !extraStore.model) return;

          try {
            const result = await callExtraModel(variant.raw);
            if (result.ops.length > 0) {
              useMvuStore.getState().applyAiOps(result.ops);
              log.info(`Đã áp ${result.ops.length} ops từ extra model (thủ công)`);
            }
          } catch (err) {
            log.warn("Extra model thủ công lỗi:", err instanceof Error ? err.message : err);
          }
        },
      };
    },
    {
      name: "asoiaf-chat-m1",
      version: 2,
      partialize: (s) => ({ messages: s.messages }),
    },
  ),
);
