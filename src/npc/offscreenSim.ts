/**
 * offscreenSim (16.3 + GĐ1) — Mô phỏng NPC tự chủ khi vắng người chơi.
 * GĐ1 upgrade: lọc NPC 3 tầng ưu tiên (tham khảo Tavern Helper "角色筛选"),
 * hard reject, tích hợp interactionPreview, AI-driven sim qua extra model
 * với rule-based fallback.
 * Đăng ký vào registerDailyListener, đếm ngày tích luỹ.
 */
import type { StatData } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";
import { registerDailyListener } from "../mvu/effects";
import { absoluteDay } from "../mvu/calendar";
import { previewInteractions } from "./interactionPreview";
import { buildOffscreenMessages, parseOffscreenResult, type OffscreenAiResult } from "./offscreenPrompt";
import { addMemory } from "./memoryEngine";
import { isWorkflowHandlerEnabled, useWorkflowStore } from "../state/workflowStore";
import { useWorldNewsStore } from "../state/worldNewsStore";
import { createLogger } from "../lib/log";

const log = createLogger("npc/offscreen");

/** Số NPC tối đa được sim mỗi lần (nâng từ 3 → 5). */
const MAX_SIM_NPCS = 5;
/** Chỉ thêm ký ức cho một nhịp quan trọng, tránh làm đầy lịch sử bằng việc vặt. */
const MEMORY_BEAT_INTERVAL = 7;

let daysSinceAiReport = 0;

// ── Priority Tiers (tham khảo Tavern Helper 驱动力校验) ──────────────────────

export type NpcPriority = "A" | "B" | "C" | "none";

export interface ScoredNpc {
  name: string;
  npc: Npc;
  priority: NpcPriority;
  score: number;        // điểm xếp hạng trong tier
  reason: string;       // giải thích vì sao chọn
}

/**
 * Phân loại ưu tiên NPC (tham khảo Tavern Helper "驱动力 A/B/C"):
 * - **A**: Mối duyên lành/nghiệp (|Hảo Cảm| ≥ 50 HOẶC Loại Quan Hệ đặc biệt)
 * - **B**: Liên quan quest/tình tiết đang hoạt động (có Mục Tiêu Cá Nhân cụ thể)
 * - **C**: Liên quan tình hình thế giới (vị trí ở vùng nóng, có chức vụ quan trọng)
 * - **none**: Không có động lực → bỏ qua
 */
function classifyPriority(_name: string, npc: Npc, _stat: StatData): { priority: NpcPriority; score: number; reason: string } {
  // Tier A: "Mối duyên lành" — quan hệ sâu
  const absAffinity = Math.abs(npc["Độ Hảo Cảm"]);
  const specialRelations = ["Đồng Minh", "Kẻ Thù", "Vợ/Chồng", "Hôn Ước", "Tình Nhân", "Thiếp"];
  const hasSpecialRelation = npc["Loại Quan Hệ"].some((r) => specialRelations.includes(r));

  if (absAffinity >= 50 || hasSpecialRelation) {
    return {
      priority: "A",
      score: absAffinity + (hasSpecialRelation ? 20 : 0),
      reason: hasSpecialRelation
        ? `Quan hệ đặc biệt (${npc["Loại Quan Hệ"].filter((r) => specialRelations.includes(r)).join(", ")})`
        : `Hảo cảm cao (${npc["Độ Hảo Cảm"]})`,
    };
  }

  // Tier B: "Liên quan quest" — có mục tiêu cá nhân cụ thể
  if (npc["Mục Tiêu Cá Nhân"]) {
    const goalWeight = npc["Mục Tiêu Cá Nhân"].length > 10 ? 30 : 15; // mục tiêu cụ thể > mơ hồ
    return {
      priority: "B",
      score: goalWeight + absAffinity * 0.3,
      reason: `Mục tiêu: "${npc["Mục Tiêu Cá Nhân"]}"`,
    };
  }

  // Tier C: "Liên quan tình hình" — vị trí/chức vụ quan trọng
  const importantTitles = ["Lãnh Chúa", "Thủ", "Vua", "Nữ Hoàng", "Tể Tướng", "Thống Lĩnh", "Khaleesi", "Khal"];
  const hasImportantTitle = importantTitles.some((t) => (npc["Chức Vụ"] ?? "").includes(t));
  if (hasImportantTitle) {
    return {
      priority: "C",
      score: 20 + absAffinity * 0.2,
      reason: `Chức vụ quan trọng: ${npc["Chức Vụ"]}`,
    };
  }

  return { priority: "none", score: 0, reason: "Không có động lực" };
}

// ── Hard Reject (một phiếu phủ quyết) ────────────────────────────────────────

/**
 * Kiểm tra NPC có bị loại cứng không:
 * - Đã chết / hôn mê
 * - Đang bị giam / mất tích (không thể hành động)
 * - Đang "tại scene" với người chơi (tham khảo Tavern Helper "排除在场角色")
 */
function hardReject(npc: Npc, playerLocation?: string): { rejected: boolean; reason: string } {
  if (!npc["Còn Sống"]) {
    return { rejected: true, reason: "Đã chết" };
  }

  const blockedStates: string[] = ["Bị Giam", "Mất Tích"];
  if (blockedStates.includes(npc["Tình Trạng"])) {
    return { rejected: true, reason: `Tình trạng: ${npc["Tình Trạng"]}` };
  }

  // NPC ở cùng vị trí với player → đang "tại scene", không phải off-screen
  if (playerLocation && npc["Vị Trí Hiện Tại"]) {
    const npcLoc = npc["Vị Trí Hiện Tại"].toLowerCase().trim();
    const playerLoc = playerLocation.toLowerCase().trim();
    if (npcLoc === playerLoc) {
      return { rejected: true, reason: `Đang cùng vị trí người chơi (${playerLocation})` };
    }
  }

  return { rejected: false, reason: "" };
}

/**
 * Toàn bộ NPC có thể tiếp tục sống ngoài cảnh, không phụ thuộc việc renderer
 * có đủ chỗ để đưa họ vào prompt/phản hồi. Khác với selectKeyNpcs (chỉ lấy
 * vài nhân vật đáng chú ý cho AI), danh sách này được engine xử lý hằng ngày.
 */
function eligibleOffscreenNpcs(stat: StatData): [string, Npc][] {
  const playerLocation = stat["Thế Giới"]["Vị Trí"];
  const allNpcs: [string, Npc][] = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];

  return allNpcs
    .filter(([, npc]) => !hardReject(npc, playerLocation).rejected)
    .sort(([a], [b]) => a.localeCompare(b, "vi"));
}

// ── Enhanced Selection ───────────────────────────────────────────────────────

/**
 * Chọn NPC then chốt để sim — phiên bản nâng cấp với 3 tầng ưu tiên + hard reject.
 * Ưu tiên: A > B > C; trong cùng tier → sắp theo score giảm dần.
 */
export function selectKeyNpcs(stat: StatData): [string, Npc][] {
  const scored: ScoredNpc[] = [];
  for (const [name, npc] of eligibleOffscreenNpcs(stat)) {
    // Phân loại ưu tiên
    const { priority, score, reason } = classifyPriority(name, npc, stat);
    if (priority === "none") continue;

    scored.push({ name, npc, priority, score, reason });
  }

  // Sắp xếp: A > B > C, trong cùng tier theo score giảm dần
  const tierOrder: Record<NpcPriority, number> = { A: 0, B: 1, C: 2, none: 3 };
  scored.sort((a, b) => {
    const tierDiff = tierOrder[a.priority] - tierOrder[b.priority];
    if (tierDiff !== 0) return tierDiff;
    return b.score - a.score;
  });

  const selected = scored.slice(0, MAX_SIM_NPCS);
  if (selected.length > 0) {
    log.info(`Offscreen NPC selection: ${selected.map((s) => `${s.name}[${s.priority}]`).join(", ")}`);
  }

  return selected.map((s) => [s.name, s.npc]);
}

// ── Rule-based Fallback Simulation ───────────────────────────────────────────

export interface OffscreenAction {
  npcName: string;
  action: string;    // mô tả hành động
  newsText: string;  // tin tức cho người chơi / AI
}

/**
 * Sinh hành động off-screen cho 1 NPC dựa trên mục tiêu + tính cách (rule-based).
 * Dùng làm FALLBACK khi extra model không khả dụng hoặc gặp lỗi.
 */
export function generateOffscreenAction(name: string, npc: Npc): OffscreenAction | null {
  const goal = npc["Mục Tiêu Cá Nhân"];
  if (!goal) return null;

  // Xác định xu hướng hành động từ tính cách
  const personality = npc["Tính Cách"];
  const isAmbitious = personality["Trục Thiện-Ác"] < 0 || personality["Trục Can Đảm-Hèn Nhát"] > 30;
  const isCautious = personality["Trục Can Đảm-Hèn Nhát"] < -20;
  const isLoyal = personality["Trục Trung Thành-Phản Trắc"] > 30;

  // Sinh hành động theo mục tiêu + tính cách
  let action: string;
  let newsText: string;

  if (goal.includes("quyền lực") || goal.includes("ngai") || goal.includes("chiếm")) {
    if (isAmbitious) {
      action = `${name} âm thầm xây dựng liên minh để thực hiện: "${goal}"`;
      newsText = `Có tin đồn ${name} đang vận động các lãnh chúa ủng hộ mình.`;
    } else if (isCautious) {
      action = `${name} thận trọng thăm dò tình hình liên quan đến: "${goal}"`;
      newsText = `${name} được thấy xuất hiện tại một số hội đàm kín.`;
    } else {
      action = `${name} công khai tuyên bố ý định: "${goal}"`;
      newsText = `${name} đã công khai lập trường về ${goal}.`;
    }
  } else if (goal.includes("trả thù") || goal.includes("tiêu diệt")) {
    action = `${name} lặng lẽ chuẩn bị cho kế hoạch: "${goal}"`;
    newsText = `${name} đã tuyển thêm người, mục đích chưa rõ.`;
  } else if (goal.includes("bảo vệ") || goal.includes("an toàn")) {
    if (isLoyal) {
      action = `${name} tăng cường phòng thủ để: "${goal}"`;
      newsText = `${name} ra lệnh củng cố thành trì.`;
    } else {
      action = `${name} tìm kiếm đồng minh mới để: "${goal}"`;
      newsText = `${name} gửi sứ giả tới nhiều Nhà lớn.`;
    }
  } else {
    // Mục tiêu chung
    action = `${name} tiếp tục theo đuổi: "${goal}"`;
    newsText = `Tin tức về hoạt động của ${name} lan truyền khắp vùng.`;
  }

  return { npcName: name, action, newsText };
}

/**
 * Chạy sim rule-based cho tất cả NPC then chốt (fallback).
 */
export function runOffscreenSim(stat: StatData): OffscreenAction[] {
  const keyNpcs = selectKeyNpcs(stat);
  const actions: OffscreenAction[] = [];

  for (const [name, npc] of keyNpcs) {
    const result = generateOffscreenAction(name, npc);
    if (result) {
      actions.push(result);
      log.info(`Off-screen (rule): ${result.action}`);
    }
  }

  return actions;
}

// ── Persistent Engine Simulation ────────────────────────────────────────────

export interface OffscreenEngineResult {
  /** Hoạt động đã được ghi vào state trong nhịp ngày này. */
  actions: OffscreenAction[];
  /** Một phần nhỏ đủ đáng chú ý để đưa vào mục tin tức ngoài cảnh. */
  notableActions: OffscreenAction[];
}

/** Việc thường nhật cho NPC không có mục tiêu cá nhân rõ ràng. */
function generateRoutineAction(name: string, npc: Npc): OffscreenAction {
  const title = (npc["Chức Vụ"] ?? "").toLowerCase();
  const traits = npc["Nét Tính Cách"].join(" ").toLowerCase();
  let action: string;
  let newsText: string;

  if (npc["Tình Trạng"] === "Bị Thương" || npc["Tình Trạng"] === "Lâm Bệnh") {
    action = `${name} nghỉ ngơi và sắp xếp người thay mình xử lý công việc trong lúc hồi phục`;
    newsText = `${name} tạm giảm xuất hiện vì đang hồi phục.`;
  } else if (title.includes("tướng") || title.includes("chỉ huy") || title.includes("kỵ sĩ")) {
    action = `${name} kiểm tra quân sĩ, luyện tập và rà soát kỷ luật của người dưới quyền`;
    newsText = `${name} dành thời gian với quân sĩ và thuộc hạ.`;
  } else if (title.includes("lãnh chúa") || title.includes("vua") || title.includes("nữ hoàng") || title.includes("thủ")) {
    action = `${name} xử lý thỉnh nguyện, thư từ và những việc cai quản thường ngày`;
    newsText = `${name} vẫn bận rộn điều hành phần việc của mình.`;
  } else if (title.includes("thương") || traits.includes("thương nhân")) {
    action = `${name} gặp gỡ đối tác và kiểm tra các chuyến hàng đang chờ`;
    newsText = `${name} đang lo liệu việc buôn bán.`;
  } else if (npc["Tính Cách"]["Trục Nóng Nảy-Điềm Tĩnh"] > 30) {
    action = `${name} chủ động gặp gỡ những người có thể giúp ích cho tương lai của mình`;
    newsText = `${name} xuất hiện trong vài cuộc gặp không chính thức.`;
  } else {
    action = `${name} chăm lo việc riêng, thu thập tin tức và duy trì các mối quan hệ quanh mình`;
    newsText = `${name} tiếp tục sinh hoạt và giữ liên lạc với người quen.`;
  }

  return { npcName: name, action, newsText };
}

function activityEmotion(npc: Npc): Npc["Ký Ức"][number]["Cảm Xúc"] {
  const goal = (npc["Mục Tiêu Cá Nhân"] ?? "").toLowerCase();
  if (goal.includes("trả thù") || goal.includes("tiêu diệt")) return "Oán Hận";
  if (npc["Tính Cách"]["Trục Trung Thành-Phản Trắc"] >= 40) return "Biết Ơn";
  if (npc["Tính Cách"]["Trục Thiện-Ác"] <= -40) return "Ghen Tị";
  return "Trung Lập";
}

function appendOffscreenNews(existing: string | undefined, actions: OffscreenAction[]): string | undefined {
  const latest = actions.slice(0, 3).map((action) => action.newsText).join(" ");
  if (!latest) return existing;
  if (existing?.includes(latest)) return existing;
  const combined = [existing, latest].filter(Boolean).join(" ");
  // Giữ đủ vài nhịp gần đây cho prompt nhưng không để state phình vô hạn.
  return combined.length > 1_600 ? combined.slice(-1_600) : combined;
}

/**
 * Ghi nhịp sống nền cho MỌI NPC hợp lệ. Hàm này chỉ dùng engine và mutate
 * state trong cascade theo ngày, vì vậy không phụ thuộc AI chính có nhắc tới
 * NPC hay không, cũng không cần Extra Model hoạt động.
 */
export function tickOffscreenNpcEngine(state: StatData): OffscreenEngineResult {
  const day = absoluteDay(state["Thế Giới"]);
  const actions: OffscreenAction[] = [];

  for (const [name, npc] of eligibleOffscreenNpcs(state)) {
    const previous = npc["_Hoạt Động Ngoài Cảnh"];
    // Một lần gọi cascade có thể tick nhiều ngày; cùng một ngày chỉ ghi một nhịp.
    if (previous?.["Ngày Tuyệt Đối"] === day) continue;

    const action = generateOffscreenAction(name, npc) ?? generateRoutineAction(name, npc);
    const count = (previous?.["Số Lần"] ?? 0) + 1;
    npc["_Hoạt Động Ngoài Cảnh"] = {
      "Ngày Tuyệt Đối": day,
      "Mô Tả": action.action,
      "Số Lần": count,
    };

    // Chỉ diễn biến có mục tiêu mới thành ký ức định kỳ; nhờ đó các lượt AI
    // sau có thể kế thừa hậu quả mà không biến mọi việc vặt thành lore.
    if (npc["Mục Tiêu Cá Nhân"] && (count === 1 || count % MEMORY_BEAT_INTERVAL === 0)) {
      addMemory(npc, {
        day: state["Thế Giới"]["Ngày"],
        month: state["Thế Giới"]["Tháng"],
        year: state["Thế Giới"]["Năm"],
        event: `Ngoài cảnh: ${action.action}`,
        emotion: activityEmotion(npc),
        weight: 28,
      });
    }
    actions.push(action);
  }

  // Tin tức chỉ nêu các nhân vật then chốt; những NPC còn lại vẫn có bản ghi
  // riêng trong state và sẽ được prompt nhìn thấy khi họ trở nên liên quan.
  const keyNames = new Set(selectKeyNpcs(state).map(([name]) => name));
  const notableActions = actions.filter((action) => keyNames.has(action.npcName));
  const world = state["Thế Giới"];
  world["_Tin Nóng Off-screen"] = appendOffscreenNews(world["_Tin Nóng Off-screen"], notableActions);

  return { actions, notableActions };
}

// ── AI-Driven Simulation ─────────────────────────────────────────────────────

/**
 * Chạy sim AI-driven cho NPC off-screen (dùng extra model).
 * Nếu extra model không khả dụng → fallback về rule-based.
 * Trả kết quả AI hoặc null (nếu dùng fallback).
 */
export async function runOffscreenSimAI(
  stat: StatData,
  callModel: (messages: { role: string; content: string }[], signal?: AbortSignal) => Promise<string>,
  signal?: AbortSignal,
): Promise<{ aiResult: OffscreenAiResult | null; fallbackActions: OffscreenAction[] }> {
  const keyNpcs = selectKeyNpcs(stat);
  if (keyNpcs.length === 0) {
    return { aiResult: null, fallbackActions: [] };
  }

  // Tính interaction candidates
  const interactions = previewInteractions(keyNpcs);
  const messages = buildOffscreenMessages(stat, keyNpcs, interactions, Math.max(1, daysSinceAiReport));

  try {
    const responseText = await callModel(messages, signal);
    const aiResult = parseOffscreenResult(responseText);

    if (aiResult.found && aiResult.actions.length > 0) {
      log.info(`Off-screen (AI): ${aiResult.actions.length} hành động, ${aiResult.interactions.length} tương tác`);
      daysSinceAiReport = 0;
      return { aiResult, fallbackActions: [] };
    }

    // AI không trả kết quả → fallback
    log.warn("Off-screen AI không trả OffscreenResult → fallback rule-based");
  } catch (err) {
    log.warn("Off-screen AI lỗi → fallback rule-based:", err instanceof Error ? err.message : err);
  }

  // Fallback
  const fallbackActions = runOffscreenSim(stat);
  daysSinceAiReport = 0;
  return { aiResult: null, fallbackActions };
}

// ── Turn Listener ────────────────────────────────────────────────────────────

/** Đăng ký nhịp sống NPC vào loop ngày truyện. */
export function registerOffscreenLoop(): void {
  registerDailyListener("offscreen-sim", (state) => {
    daysSinceAiReport++;
    if (!isWorkflowHandlerEnabled("offscreen-engine", "daily")) return;

    const startedAt = Date.now();
    const result = tickOffscreenNpcEngine(state);
    if (result.actions.length === 0) return;

    const day = absoluteDay(state["Thế Giới"]);
    const newsStore = useWorldNewsStore.getState();
    for (const action of result.notableActions) {
      const alreadyPublished = newsStore.headlines.some((headline) =>
        headline.day === day && headline.source === "offscreen" && headline.text === action.newsText,
      );
      if (!alreadyPublished) newsStore.addHeadline({ day, text: action.newsText, source: "offscreen" });
    }

    const task = useWorkflowStore.getState().tasks.find((item) => item.handlerKey === "offscreen-engine");
    if (task) {
      useWorkflowStore.getState().recordResult({
        taskId: task.id,
        taskName: task.name,
        status: "success",
        message: `${result.actions.length} NPC tiếp tục hoạt động nền${result.notableActions.length > 0 ? `; ${result.notableActions.length} diễn biến đáng chú ý` : ""}`,
        durationMs: Date.now() - startedAt,
      });
    }
  });
}

/** Reset dayCounter (test helper). */
export function resetDayCounter(): void {
  daysSinceAiReport = 0;
}

/** Lấy dayCounter hiện tại (cho AI-driven sim biết đã trôi bao nhiêu ngày). */
export function getDayCounter(): number {
  return daysSinceAiReport;
}
