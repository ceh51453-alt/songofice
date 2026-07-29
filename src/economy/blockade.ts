/**
 * blockade — phong toả cảng (7.8 → 15.2).
 *
 * Tách riêng khỏi economyEngine để cả budget.ts lẫn engine đều dùng được mà
 * không tạo vòng import.
 */
import type { StatData } from "../mvu/schema";

/** Vùng này có đang bị hạm đội nào phong toả cảng không. */
export function isBlockaded(state: StatData, regionId: string): boolean {
  if (!regionId) return false;
  for (const fleet of Object.values(state["Hạm Đội"] ?? {})) {
    if (fleet["Đang Phong Toả"] === regionId) return true;
  }
  return false;
}
