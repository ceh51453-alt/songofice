/**
 * calendar.ts — LỊCH WESTEROS, nguồn chân lý duy nhất cho thời gian trong game.
 *
 * Thay thế hoàn toàn hệ thống "turn" cũ. Quy ước chuyển đổi:
 *   1 turn (thiết kế cũ)  ≡  1 tháng  ≡  30 ngày
 *
 * Lịch: 12 tháng × 30 ngày = 360 ngày/năm (8.7). Westeros không có tên tháng
 * canon nên dùng số thứ tự ("ngày 12 tháng 3, năm 298 AC").
 *
 * Mọi thời lượng trong game lưu bằng NGÀY (tick mượt, hiển thị "X tháng Y ngày");
 * mọi dòng tiền định kỳ tính theo THÁNG (thuế, lãi, lợi nhuận, quân lương).
 */

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR; // 360

/** Hình dạng tối thiểu của "Thế Giới" mà các hàm dưới cần. */
export interface CalendarLike {
  "Năm": number;
  "Tháng": number;
  "Ngày": number;
}

/**
 * Số ngày tuyệt đối tính từ mốc 0 AC — dùng cho MỌI phép so sánh/hiệu thời gian
 * (hạn chót, ngày bắt giam, ngày đổi chủ...). Đơn điệu tăng, an toàn khi trừ.
 */
export function absoluteDay(c: CalendarLike): number {
  return c["Năm"] * DAYS_PER_YEAR + (c["Tháng"] - 1) * DAYS_PER_MONTH + c["Ngày"];
}

/** Số tháng tuyệt đối — mốc chốt sổ kinh tế. */
export function absoluteMonth(c: CalendarLike): number {
  return c["Năm"] * MONTHS_PER_YEAR + (c["Tháng"] - 1);
}

/**
 * Chuẩn hoá lịch sau khi AI cộng delta: tràn Ngày → Tháng → Năm, và xử lý cả
 * delta ÂM (lùi thời gian) lẫn save cũ có Ngày 1-360 (khi Tháng còn = 1).
 * MUTATE tại chỗ.
 */
export function normalizeCalendar(c: CalendarLike): void {
  // gộp tất cả về ngày tuyệt đối rồi trải lại — xử lý mọi mức tràn trong 1 bước
  let total = (c["Năm"] * MONTHS_PER_YEAR + (c["Tháng"] - 1)) * DAYS_PER_MONTH + (c["Ngày"] - 1);
  if (!Number.isFinite(total)) total = 0;
  if (total < 0) total = 0;

  c["Năm"] = Math.floor(total / DAYS_PER_YEAR);
  const rem = total - c["Năm"] * DAYS_PER_YEAR;
  c["Tháng"] = Math.floor(rem / DAYS_PER_MONTH) + 1;
  c["Ngày"] = (rem % DAYS_PER_MONTH) + 1;
}

/** Cộng n ngày (n có thể âm). MUTATE tại chỗ. */
export function addDays(c: CalendarLike, n: number): void {
  c["Ngày"] += n;
  normalizeCalendar(c);
}

/** Ngày thứ mấy trong năm (1-360) — dùng cho lịch đại hội đấu, mùa vụ. */
export function dayOfYear(c: CalendarLike): number {
  return (c["Tháng"] - 1) * DAYS_PER_MONTH + c["Ngày"];
}

/** Ngược lại: 1-360 → {Tháng, Ngày}. Dùng khi migrate save cũ. */
export function fromDayOfYear(doy: number): { "Tháng": number; "Ngày": number } {
  const clamped = Math.max(1, Math.min(DAYS_PER_YEAR, Math.round(doy)));
  return {
    "Tháng": Math.floor((clamped - 1) / DAYS_PER_MONTH) + 1,
    "Ngày": ((clamped - 1) % DAYS_PER_MONTH) + 1,
  };
}

/** Ngược của absoluteDay: số ngày tuyệt đối → {Năm, Tháng, Ngày}. */
export function fromAbsoluteDay(abs: number): CalendarLike {
  const c: CalendarLike = { "Năm": 0, "Tháng": 1, "Ngày": Math.max(1, Math.round(abs)) };
  normalizeCalendar(c);
  return c;
}

/** "ngày 12 tháng 3, năm 298 AC" */
export function formatDate(c: CalendarLike): string {
  return `ngày ${c["Ngày"]} tháng ${c["Tháng"]}, năm ${c["Năm"]} AC`;
}

/** "12/3/298 AC" — bản ngắn cho bảng, thẻ, tooltip. */
export function formatDateShort(c: CalendarLike): string {
  return `${c["Ngày"]}/${c["Tháng"]}/${c["Năm"]} AC`;
}

/**
 * Thời lượng dạng người đọc: 0 → "xong", 45 → "1 tháng 15 ngày", 30 → "1 tháng".
 * Dùng cho tiến độ xây, huấn luyện, hành quân, hạn chót quest.
 */
export function formatDuration(days: number): string {
  const d = Math.max(0, Math.round(days));
  if (d === 0) return "xong";
  if (d < DAYS_PER_MONTH) return `${d} ngày`;

  const years = Math.floor(d / DAYS_PER_YEAR);
  const months = Math.floor((d % DAYS_PER_YEAR) / DAYS_PER_MONTH);
  const rest = d % DAYS_PER_MONTH;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} năm`);
  if (months > 0) parts.push(`${months} tháng`);
  if (rest > 0) parts.push(`${rest} ngày`);
  return parts.join(" ");
}

/** Số ngày giữa hai mốc lịch (b − a). */
export function daysBetween(a: CalendarLike, b: CalendarLike): number {
  return absoluteDay(b) - absoluteDay(a);
}

/** Quy đổi thời lượng thiết kế cũ (turn) sang ngày. 1 turn = 1 tháng. */
export function turnsToDays(turns: number): number {
  return Math.max(0, Math.round(turns * DAYS_PER_MONTH));
}
