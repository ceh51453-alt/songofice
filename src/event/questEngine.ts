/**
 * questEngine.ts (17.2) — Hệ thống quest: deadline, complete, fail, journal.
 * Tick mỗi ngày qua registerDailyListener.
 */
import type { StatData } from "../mvu/schema";
import { registerDailyListener, type EffectEvent } from "../mvu/effects";
import { absoluteDay } from "../mvu/calendar";
import { createLogger } from "../lib/log";

const log = createLogger("event/questEngine");

// ── Journal entry types ──

export type JournalType =
  | "Chiến Thắng" | "Thất Bại" | "Liên Minh" | "Phản Bội"
  | "Chiếm Đất" | "Mất Đất" | "Hôn Nhân" | "Chết"
  | "Sự Kiện" | "Quest" | "Cột Mốc" | "Khác";

export interface JournalEntry {
  "Ngày": number;
  "Tháng": number;
  "Năm": number;
  "Loại": JournalType;
  "Mô Tả": string;
}

// ── Journal ──

/** Dấu thời gian hiện tại cho 1 mục nhật ký — dùng chung mọi engine. */
export function journalStamp(state: StatData): Pick<JournalEntry, "Ngày" | "Tháng" | "Năm"> {
  const w = state["Thế Giới"];
  return { "Ngày": w["Ngày"], "Tháng": w["Tháng"], "Năm": w["Năm"] };
}

export function addJournalEntry(state: StatData, entry: JournalEntry): void {
  state["Nhật Ký"].push(entry);
  log.info(`Nhật ký: [${entry["Loại"]}] ${entry["Mô Tả"]}`);
}

// ── Quest helpers ──

/** Kiểm tra quest quá hạn và chuyển sang Thất Bại. */
export function advanceQuests(state: StatData): EffectEvent[] {
  const events: EffectEvent[] = [];
  const today = absoluteDay(state["Thế Giới"]);

  for (const [id, quest] of Object.entries(state["Nhiệm Vụ"])) {
    if (quest["Trạng Thái"] !== "Đang Làm") continue;

    // Kiểm tra deadline
    const deadline = quest["Hạn Chót Ngày"];
    if (deadline !== undefined && today >= deadline) {
      quest["Trạng Thái"] = "Thất Bại";
      events.push({
        kind: "stage_down",
        text: `Nhiệm vụ thất bại (quá hạn): ${quest["Tiêu Đề"]}`,
      });
      addJournalEntry(state, {
        ...journalStamp(state),
        "Loại": "Quest",
        "Mô Tả": `Nhiệm vụ "${quest["Tiêu Đề"]}" đã thất bại do quá hạn chót.`,
      });
      log.info(`Quest ${id} thất bại (quá hạn ngày ${deadline})`);
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
      ...journalStamp(state),
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
    ...journalStamp(state),
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
    /** hạn chót dạng NGÀY TUYỆT ĐỐI (calendar.absoluteDay). */
    deadlineDay?: number;
    description?: string;
  },
): void {
  state["Nhiệm Vụ"][questId] = {
    "Tiêu Đề": data.title,
    "Loại": data.type,
    "Trạng Thái": "Đang Làm",
    "Mục Tiêu": data.objectives.map((d) => ({ "Mô Tả": d, "Xong": false })),
    "Phần Thưởng": data.reward ?? "",
    ...(data.deadlineDay !== undefined ? { "Hạn Chót Ngày": data.deadlineDay } : {}),
    "Mô Tả": data.description ?? "",
  };
  addJournalEntry(state, {
    ...journalStamp(state),
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

// ── Daily listener ──

let registered = false;

export function registerQuestListener(): void {
  if (registered) return;
  registered = true;
  registerDailyListener("quest-engine", (state) => {
    advanceQuests(state);
  });
}
