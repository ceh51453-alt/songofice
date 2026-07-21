/**
 * weightedPick (5bis.7) — chọn ngẫu nhiên có trọng số + điều kiện, dùng cho
 * pool sự kiện, bảng rơi đồ, khủng hoảng, thời tiết... Trọng số có thể ĐỘNG
 * theo state (truyền hàm weight thay số).
 */
import type { RNG } from "./rng";

export interface WeightedItem<T> {
  value: T;
  /** số cố định hoặc hàm tính theo state hiện tại (trọng số động). */
  weight: number | (() => number);
  condition?: () => boolean;
}

/** Trả phần tử được chọn, hoặc null nếu pool rỗng sau khi lọc điều kiện. */
export function weightedPick<T>(items: WeightedItem<T>[], rng: RNG): T | null {
  const pool = items
    .filter((i) => !i.condition || i.condition())
    .map((i) => ({ value: i.value, w: Math.max(0, typeof i.weight === "function" ? i.weight() : i.weight) }))
    .filter((i) => i.w > 0);
  if (pool.length === 0) return null;

  const total = pool.reduce((s, i) => s + i.w, 0);
  let ticket = rng() * total;
  for (const item of pool) {
    ticket -= item.w;
    if (ticket < 0) return item.value;
  }
  return pool[pool.length - 1].value; // sai số float — trả phần tử cuối
}
