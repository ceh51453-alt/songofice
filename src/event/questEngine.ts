/**
 * questEngine.ts (17.2) — Hệ thống quest: deadline, complete, fail, journal.
 * Tick mỗi ngày qua registerTurnListener.
 */
import type { StatData } from "../mvu/schema";
import { registerTurnListener, type EffectEvent } from "../mvu/effects";
import { createLogger } from "../lib/log";

const log = createLogger("event/questEngine");

// ── Journal entry types ──

export type JournalType =
  | "Chiến Thắng" | "Thất Bại" | "Liên Minh" | "Phản Bội"
  | "Chiếm Đất" | "Mất Đất" | "Hôn Nhân" | "Chết"
  | "Sự Kiện" | "Quest" | "Cột Mốc" | "Khác";

export interface JournalEntry {
  "Turn": number;
  "Năm": number;
  "Loại": JournalType;
  "Mô Tả": string;
}

// ── Journal ──

export function addJournalEntry(state: StatData, entry: JournalEntry): void {
  state["Nhật Ký"].push(entry);
  log.info(`Nhật ký: [${entry["Loại"]}] ${entry["Mô Tả"]}`);
}

// ── Quest helpers ──

/** Kiểm tra quest quá hạn và chuyển sang Thất Bại. */
export function advanceQuests(state: StatData): EffectEvent[] {
  const events: EffectEvent[] = [];
  const turn = state["_engineMeta"]["turnCount"];

  for (const [id, quest] of Object.entries(state["Nhiệm Vụ"])) {
    if (quest["Trạng Thái"] !== "Đang Làm") continue;

    // Kiểm tra deadline
    const deadline = quest["Hạn Chót Turn"];
    if (deadline !== undefined && turn >= deadline) {
      quest["Trạng Thái"] = "Thất Bại";
      events.push({
        kind: "stage_down",
        text: `Nhiệm vụ thất bại (quá hạn): ${quest["Tiêu Đề"]}`,
      });
      addJournalEntry(state, {
        Turn: turn,
        "Năm": state["Thế Giới"]["Năm"],
        "Loại": "Quest",
        "Mô Tả": `Nhiệm vụ "${quest["Tiêu Đề"]}" đã thất bại do quá hạn chót.`,
      });
      log.info(`Quest ${id} thất bại (quá hạn turn ${deadline})`);
    }
  }

  return events;
}

/** Đánh dấu mục tiêu con xong. Nếu tất cả xong → quest Hoàn Thành. */
export function completeObjective(
  state: StatData,
  questId: string,
  objectiveIndex: number,
): EffectEvent[] {
  const events: EffectEvent[] = [];
  const quest = state["Nhiệm Vụ"][questId];
  if (!quest || quest["Trạng Thái"] !== "Đang Làm") return events;

  const objectives = quest["Mục Tiêu"];
  if (objectiveIndex < 0 || objectiveIndex >= objectives.length) return events;

  objectives[objectiveIndex]["Xong"] = true;

  // Kiểm tra tất cả mục tiêu đã xong chưa
  const allDone = objectives.every((o) => o["Xong"]);
  if (allDone) {
    quest["Trạng Thái"] = "Hoàn Thành";
    events.push({
      kind: "stage_up",
      text: `Nhiệm vụ hoàn thành: ${quest["Tiêu Đề"]}`,
    });
    addJournalEntry(state, {
      Turn: state["_engineMeta"]["turnCount"],
      "Năm": state["Thế Giới"]["Năm"],
      "Loại": "Quest",
      "Mô Tả": `Nhiệm vụ "${quest["Tiêu Đề"]}" đã hoàn thành!`,
    });
    log.info(`Quest ${questId} hoàn thành`);
  }

  return events;
}

/** Đánh dấu quest thất bại thủ công. */
export function failQuest(state: StatData, questId: string): EffectEvent[] {
  const events: EffectEvent[] = [];
  const quest = state["Nhiệm Vụ"][questId];
  if (!quest || quest["Trạng Thái"] !== "Đang Làm") return events;

  quest["Trạng Thái"] = "Thất Bại";
  events.push({
    kind: "stage_down",
    text: `Nhiệm vụ thất bại: ${quest["Tiêu Đề"]}`,
  });
  addJournalEntry(state, {
    Turn: state["_engineMeta"]["turnCount"],
    "Năm": state["Thế Giới"]["Năm"],
    "Loại": "Quest",
    "Mô Tả": `Nhiệm vụ "${quest["Tiêu Đề"]}" đã thất bại.`,
  });

  return events;
}

/** Tạo quest mới. */
export function addQuest(
  state: StatData,
  questId: string,
  data: {
    title: string;
    type: "Cốt Truyện Chính" | "Phụ" | "Gia Tộc" | "Chính Trị" | "Quân Sự";
    objectives: string[];
    reward?: string;
    deadlineTurn?: number;
    description?: string;
  },
): void {
  state["Nhiệm Vụ"][questId] = {
    "Tiêu Đề": data.title,
    "Loại": data.type,
    "Trạng Thái": "Đang Làm",
    "Mục Tiêu": data.objectives.map((d) => ({ "Mô Tả": d, "Xong": false })),
    "Phần Thưởng": data.reward ?? "",
    ...(data.deadlineTurn !== undefined ? { "Hạn Chót Turn": data.deadlineTurn } : {}),
    "Mô Tả": data.description ?? "",
  };
  addJournalEntry(state, {
    Turn: state["_engineMeta"]["turnCount"],
    "Năm": state["Thế Giới"]["Năm"],
    "Loại": "Quest",
    "Mô Tả": `Nhiệm vụ mới: "${data.title}"`,
  });
  log.info(`Quest ${questId} được tạo`);
}

/** Đếm quest theo trạng thái. */
export function countQuests(state: StatData): { active: number; completed: number; failed: number } {
  let active = 0, completed = 0, failed = 0;
  for (const q of Object.values(state["Nhiệm Vụ"])) {
    if (q["Trạng Thái"] === "Đang Làm") active++;
    else if (q["Trạng Thái"] === "Hoàn Thành") completed++;
    else if (q["Trạng Thái"] === "Thất Bại") failed++;
  }
  return { active, completed, failed };
}

// ── Turn listener ──

let registered = false;

export function registerQuestListener(): void {
  if (registered) return;
  registered = true;
  registerTurnListener("quest-engine", (state) => {
    advanceQuests(state);
  });
}
