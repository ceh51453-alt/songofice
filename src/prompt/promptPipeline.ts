/**
 * Pipeline ghép prompt cấp app — cầu nối giữa stores và buildFromPreset:
 * - Lore engine chạy TRƯỚC (trigger + EJS async, mục 4/5.5b) → điền marker
 *   worldInfoBefore/After + injection atDepth.
 * - Có preset active → dựng theo prompt_order (3.1b.4) + merge sampling preset.
 * - Không preset → fallback: lore before/after làm system message + history
 *   cắt theo ngân sách.
 * Dùng bởi chatStore (gửi thật) và Prompt Inspector (dry-run). ASYNC vì EJS.
 */
import type { ApiChatMessage, ConnectionProfile, ModelParams } from "../types/connection";
import { buildFromPreset, injectIntoHistory, type BuildResult, type BlockTrace } from "../preset/buildFromPreset";
import { mergePresetParams } from "../preset/mergeParams";
import { emptyMarkerSources } from "../preset/markers";
import { getLoreForBuild } from "../lorebook/loreProvider";
import { makeEmptyMacroContext, type MacroContext } from "./macroContext";
import { registerBuiltinMacros } from "./macros";
import { useVariablesStore, addValues } from "../state/variablesStore";
import { usePresetStore } from "../state/presetStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore, currentSeedInfo } from "../state/mvuStore";
import { useCombatStore } from "../state/combatStore";
import { renderStateForAI } from "../mvu/stateRenderer";
import { renderTablesForAI } from "../mvu/tableBridge";
import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT } from "../mvu/mvuPrompt";
import { useExtraModelStore } from "../state/extraModelStore";
import { streamRng } from "../probability/rng";
import { countTokens } from "./tokenizer";

/**
 * Bridge biến 2 tầng (3.1b.3 — "biến preset và stat_data là CÙNG MỘT store"):
 * key bắt đầu "stat_data." → đọc/ghi MVU store; còn lại → variables store.
 */
function makeAppMacroContext(history: ApiChatMessage[]): MacroContext {
  registerBuiltinMacros();
  const vars = useVariablesStore.getState();
  const mvu = useMvuStore.getState();
  const { rootSeed, turnCount } = currentSeedInfo();
  const playerName = mvu.stat["Thông Tin Nhân Vật"]["Họ Tên"];

  const getChat = (key: string): string => {
    if (key.startsWith("stat_data.")) {
      const v = mvu.getByPath(key);
      return v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    }
    return vars.getChat(key);
  };
  const setChat = (key: string, value: string): void => {
    if (key.startsWith("stat_data.")) {
      mvu.setByPath(key, value);
      return;
    }
    vars.setChat(key, value);
  };

  return makeEmptyMacroContext({
    // char/description/scenario... — M5 (character card) sẽ điền
    user: playerName !== "Vô Danh" ? playerName : "Người Chơi",
    lastMessage: history.length > 0 ? history[history.length - 1].content : "",
    // RNG seedable (5bis.1): stream "macro", tái lập theo (seed gốc, turn)
    rng: streamRng(rootSeed, turnCount, "macro"),
    vars: {
      getChat,
      setChat,
      addChat: (key, delta) => {
        if (key.startsWith("stat_data.")) {
          setChat(key, addValues(getChat(key), delta));
          return;
        }
        vars.addChat(key, delta);
      },
      getGlobal: vars.getGlobal,
      setGlobal: vars.setGlobal,
      addGlobal: vars.addGlobal,
    },
  });
}

/** Lớp prompt riêng của app (3.1b.5) — ghép CÙNG pipeline, KHÔNG sửa preset người dùng. */
function appLayerMessages(): ApiChatMessage[] {
  const stat = useMvuStore.getState().stat;
  const engine = useExtraModelStore.getState().stateEngine;
  const updatePrompt = engine === "auto-database" ? SQL_UPDATE_PROMPT : MVU_UPDATE_PROMPT;
  const stateBlock = engine === "auto-database" ? renderTablesForAI(stat) : renderStateForAI(stat);
  const msgs: ApiChatMessage[] = [
    { role: "system", content: updatePrompt },
    { role: "system", content: NARRATIVE_TAGS_PROMPT },
    { role: "system", content: DICE_ROLL_PROMPT },
    { role: "system", content: stateBlock },
  ];
  // trận vừa phân giải xong → bút pháp 7.11 + khối báo cáo engine điền (7.10)
  const reportBlock = useCombatStore.getState().reportBlock;
  if (reportBlock) {
    msgs.push({ role: "system", content: `${BATTLE_NARRATION_PROMPT}\n\n## KHỐI BÁO CÁO ĐÃ CHỐT (chèn nguyên văn):\n${reportBlock}` });
  }
  return msgs;
}

export interface PipelineResult extends BuildResult {
  /** Params sau khi merge sampling preset (nếu có). */
  params: ModelParams;
  usingPreset: boolean;
  presetName: string | null;
}

/** Fallback không preset: lore bọc quanh + history cắt theo max_context (3.3 bước 4). */
function buildBare(
  params: ModelParams,
  lore: { before: string; after: string; injected: ApiChatMessage[] },
): BuildResult {
  const traces: BlockTrace[] = [];
  const head: ApiChatMessage[] = [];
  if (lore.before.trim()) head.push({ role: "system", content: lore.before });
  if (lore.after.trim()) head.push({ role: "system", content: lore.after });
  const headTokens = head.reduce((s, m) => s + countTokens(m.content) + 4, 0);

  const budgetMax = params.max_context - params.max_tokens - headTokens;
  const included: ApiChatMessage[] = [];
  let used = 0;
  let dropped = 0;
  for (let i = lore.injected.length - 1; i >= 0; i--) {
    const cost = countTokens(lore.injected[i].content) + 4;
    if (used + cost <= budgetMax || included.length === 0) {
      included.unshift(lore.injected[i]);
      used += cost;
    } else {
      dropped = i + 1;
      break;
    }
  }
  const warnings = dropped > 0 ? [`Ngân sách context: đã cắt ${dropped} tin nhắn cũ nhất`] : [];
  if (head.length > 0) {
    traces.push({
      identifier: "lore", name: "Lore (không preset)", role: "system", kind: "marker",
      tokens: headTokens, content: [lore.before, lore.after].filter(Boolean).join("\n---\n"), messageIndex: 0,
    });
  }
  traces.push({
    identifier: "chatHistory", name: "Chat History (không preset)", role: "system", kind: "history",
    tokens: used, content: `${included.length} tin nhắn (bỏ ${dropped})`, messageIndex: head.length,
  });
  return {
    messages: [...head, ...included],
    traces,
    warnings,
    totalTokens: headTokens + used,
    historyIncluded: included.length,
    historyDropped: dropped,
    overBudget: used > budgetMax,
  };
}

/**
 * Dựng messages + params cho một lần gọi AI (hoặc dry-run cho Inspector).
 * Side-effect duy nhất: macro setvar ghi biến (đúng thiết kế 3.1b.3).
 */
export async function buildPipeline(history: ApiChatMessage[]): Promise<PipelineResult> {
  const profile: ConnectionProfile = useConnectionStore.getState().activeProfile();
  const presetState = usePresetStore.getState();
  const preset = presetState.activePreset;
  const params = preset ? mergePresetParams(profile.params, preset) : profile.params;

  // ---- Lore engine (mục 4): trigger + EJS — chạy trước khi ghép prompt ----
  const lore = await getLoreForBuild(history, params.max_context);

  // lớp engine của app: luật cập nhật bảng (5.4b) + thẻ (5.6) + STATE render (5.7.3)
  // + báo cáo trận (7.10/7.11) nếu vừa phân giải
  const APP_LAYER_LABELS = [
    ["(app) mvu_update", "Luật cập nhật bảng (5.4b)"],
    ["(app) narrative_tags", "Thẻ ngữ nghĩa (5.6)"],
    ["(app) state_render", "Bảng Trạng Thái render (5.7.3)"],
    ["(app) battle_report", "Báo cáo trận + bút pháp (7.10/7.11)"],
  ];
  const appLayer = appLayerMessages();
  const appTraces: BlockTrace[] = appLayer.map((m, i) => ({
    identifier: APP_LAYER_LABELS[i]?.[0] ?? `(app) block_${i}`,
    name: APP_LAYER_LABELS[i]?.[1] ?? `Khối app ${i}`,
    role: "system", kind: "prompt", tokens: countTokens(m.content), content: m.content, messageIndex: i,
  }));

  if (!preset) {
    const injected = injectIntoHistory(history, lore.depthInjections);
    const bare = buildBare(params, { before: lore.before, after: lore.after, injected });
    bare.warnings.push(...lore.warnings);
    const messages = [...appLayer, ...bare.messages];
    bare.traces.forEach((t) => {
      if (t.messageIndex !== null) t.messageIndex += appLayer.length;
    });
    return {
      ...bare,
      messages,
      traces: [...appTraces, ...bare.traces],
      totalTokens: bare.totalTokens + appTraces.reduce((s, t) => s + t.tokens, 0),
      params,
      usingPreset: false,
      presetName: null,
    };
  }

  const ctx = makeAppMacroContext(history);
  const appTokens = appTraces.reduce((s, t) => s + t.tokens, 0);
  const result = buildFromPreset(preset, {
    ctx,
    sources: emptyMarkerSources({
      worldInfoBefore: () => lore.before,
      worldInfoAfter: () => lore.after,
      // charDescription/persona/scenario... — M5 (character card) cắm vào đây
    }),
    history,
    maxContext: params.max_context - appTokens, // chừa chỗ cho lớp app
    maxOutputTokens: params.max_tokens,
    extraInjections: lore.depthInjections,
  });
  result.warnings.push(...lore.warnings);
  const messages = [...appLayer, ...result.messages];
  result.traces.forEach((t) => {
    if (t.messageIndex !== null) t.messageIndex += appLayer.length;
  });
  const activeRecord = presetState.records.find((r) => r.id === presetState.activePresetId);
  return {
    ...result,
    messages,
    traces: [...appTraces, ...result.traces],
    totalTokens: result.totalTokens + appTokens,
    params,
    usingPreset: true,
    presetName: activeRecord?.name ?? "(preset)",
  };
}
