/**
 * timelineEngine.ts (17.3) — Engine cột mốc lịch sử canon.
 * Kiểm tra năm game vs năm beat, trigger khi chạm.
 * Hai chế độ: "Theo Sát Nguyên Tác" (tự động) và "Diễn Giải Tự Do" (gợi ý mềm).
 */
import type { StatData } from "../mvu/schema";
import type { TimelineBeat } from "../content/westeros/events/timelineBeats";
import { addJournalEntry } from "./questEngine";
import { applyPatch } from "../mvu/patchEngine";
import { createLogger } from "../lib/log";

const log = createLogger("event/timelineEngine");

export interface TriggeredBeat {
  beat: TimelineBeat;
  /** true = beat xảy ra như canon; false = bị người chơi thay đổi. */
  canonical: boolean;
}

/**
 * Kiểm tra các beat chưa xảy ra mà năm game đã chạm/vượt.
 * Chế độ "Theo Sát Nguyên Tác": beat trigger tự động.
 * Chế độ "Diễn Giải Tự Do": beat chỉ trả về để AI biết, không tự động áp.
 */
export function checkTimelineBeats(
  state: StatData,
  beats: TimelineBeat[],
): TriggeredBeat[] {
  const currentYear = state["Thế Giới"]["Năm"];
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const mode = state["Cài Đặt Ván"]["Chế Độ Tường Thuật"];
  const strict = mode === "Theo Sát Nguyên Tác";

  const triggered: TriggeredBeat[] = [];

  for (const beat of beats) {
    // Chỉ xét beats của era đang chơi
    if (beat.eraId !== eraId) continue;

    // Đã xảy ra rồi → bỏ qua
    const existing = state["Cột Mốc Lịch Sử"][beat.id];
    if (existing?.["Đã Xảy Ra"]) continue;

    // Chưa tới năm → bỏ qua
    if (currentYear < beat.year) continue;

    // Beat đủ điều kiện trigger
    if (strict) {
      // Chế độ Theo Sát Nguyên Tác: tự động trigger
      triggered.push({ beat, canonical: true });
    } else {
      // Chế độ Diễn Giải Tự Do: chỉ báo AI biết, không áp tự động
      triggered.push({ beat, canonical: false });
    }
  }

  return triggered;
}

/**
 * Áp 1 beat: đánh dấu Đã Xảy Ra, ghi Nhật Ký, áp autoPatch (nếu có).
 */
export function applyBeat(
  state: StatData,
  beat: TimelineBeat,
  altered: boolean = false,
): void {
  // Đánh dấu trong state
  state["Cột Mốc Lịch Sử"][beat.id] = {
    "Đã Xảy Ra": true,
    "Bị Thay Đổi": altered,
    "Năm Xảy Ra": state["Thế Giới"]["Năm"],
  };

  // Ghi Nhật Ký
  addJournalEntry(state, {
    Turn: state["_engineMeta"]["turnCount"],
    "Năm": state["Thế Giới"]["Năm"],
    "Loại": "Cột Mốc",
    "Mô Tả": altered
      ? `${beat.title} — LỊCH SỬ BỊ THAY ĐỔI bởi người chơi!`
      : `${beat.title} — ${beat.description}`,
  });

  // Áp autoPatch nếu có
  if (beat.autoPatch && beat.autoPatch.length > 0) {
    try {
      applyPatch(state, beat.autoPatch);
    } catch (e) {
      log.error(`AutoPatch lỗi cho beat ${beat.id}`, e);
    }
  }

  log.info(`Cột mốc: ${beat.title} (${altered ? "ĐÃ THAY ĐỔI" : "canon"})`);
}

/**
 * Đánh dấu beat là "bị người chơi thay đổi" — vd người chơi cứu Ned Stark
 * không cho xử tử → beat "Ned bị xử" bị altered.
 */
export function markBeatAltered(state: StatData, beatId: string): void {
  const existing = state["Cột Mốc Lịch Sử"][beatId];
  if (existing) {
    existing["Bị Thay Đổi"] = true;
  } else {
    state["Cột Mốc Lịch Sử"][beatId] = {
      "Đã Xảy Ra": true,
      "Bị Thay Đổi": true,
      "Năm Xảy Ra": state["Thế Giới"]["Năm"],
    };
  }
  log.info(`Cột mốc ${beatId} bị thay đổi bởi người chơi`);
}

/**
 * Lấy danh sách cột mốc sắp tới (chưa xảy ra, năm > năm hiện tại).
 * Dùng cho UI Đồng Thời Gian.
 */
export function getUpcomingBeats(
  state: StatData,
  beats: TimelineBeat[],
  limit: number = 5,
): TimelineBeat[] {
  const currentYear = state["Thế Giới"]["Năm"];
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";

  return beats
    .filter((b) => {
      if (b.eraId !== eraId) return false;
      const existing = state["Cột Mốc Lịch Sử"][b.id];
      if (existing?.["Đã Xảy Ra"]) return false;
      return b.year > currentYear;
    })
    .sort((a, b) => a.year - b.year)
    .slice(0, limit);
}

/**
 * Lấy danh sách cột mốc đã xảy ra.
 */
export function getPastBeats(
  state: StatData,
  beats: TimelineBeat[],
): (TimelineBeat & { altered: boolean; yearOccurred: number })[] {
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";

  return beats
    .filter((b) => {
      if (b.eraId !== eraId) return false;
      return state["Cột Mốc Lịch Sử"][b.id]?.["Đã Xảy Ra"] === true;
    })
    .map((b) => ({
      ...b,
      altered: state["Cột Mốc Lịch Sử"][b.id]["Bị Thay Đổi"],
      yearOccurred: state["Cột Mốc Lịch Sử"][b.id]["Năm Xảy Ra"],
    }))
    .sort((a, b) => a.yearOccurred - b.yearOccurred);
}
