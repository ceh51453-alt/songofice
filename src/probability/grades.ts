/**
 * Thang Độ Khó chuẩn (5bis.3) + Bậc Kết Quả chuẩn (5bis.4) — dùng chung toàn app.
 */

/** Bậc độ khó → DC (trừ vào target). */
export const DIFFICULTY_DC = {
  "Dễ Ợt": 0,
  "Dễ": 10,
  "Thường": 20,
  "Khó": 35,
  "Rất Khó": 50,
  "Nan Giải": 65,
  "Gần Như Bất Khả": 80,
} as const;

export type DifficultyLabel = keyof typeof DIFFICULTY_DC;

/** 5 bậc kết quả (5bis.4). */
export type ResultGrade = "Đại Thành Công" | "Thành Công" | "Thành Công Nửa Vời" | "Thất Bại" | "Đại Thất Bại";

/**
 * Phân bậc theo khoảng cách roll vs target (5bis.4):
 * - roll ≤ 5 LUÔN ít nhất Đại Thành Công; roll ≥ 96 LUÔN Đại Thất Bại
 *   (không bao giờ chắc chắn 100% — người mạnh vẫn vấp, kẻ yếu vẫn có hy vọng).
 */
export function gradeResult(roll: number, target: number): ResultGrade {
  if (roll <= 5) return "Đại Thành Công";
  if (roll >= 96) return "Đại Thất Bại";
  if (roll <= target - 30) return "Đại Thành Công";
  if (roll <= target) return "Thành Công";
  if (roll <= target + 15) return "Thành Công Nửa Vời";
  if (roll >= target + 30) return "Đại Thất Bại";
  return "Thất Bại";
}

/** Bậc kết quả có "thành công" không (kể cả nửa vời)? — tiện cho engine con. */
export function isSuccess(grade: ResultGrade): boolean {
  return grade === "Đại Thành Công" || grade === "Thành Công" || grade === "Thành Công Nửa Vời";
}
