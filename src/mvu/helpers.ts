/**
 * 3 pattern nền tảng của schema MVU-ZOD (mục 5.1) — áp dụng nhất quán
 * cho TOÀN BỘ schema, kể cả các hệ mở rộng mục 10-17 sau này.
 */
import { z } from "zod";

/** a) safeString — chặn lỗi khi AI trả object/number ở field lẽ ra là string. */
export const safeString = () =>
  z.preprocess((val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }, z.string());

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** b) clampedStat — stat số có khoảng cố định, chặn AI trả số âm/vượt trần. */
export const clampedStat = (min: number, max: number, def: number) =>
  z.coerce
    .number()
    .catch(def) // AI trả rác không ép số được → về mặc định thay vì fail
    .transform((v) => clamp(v, min, max))
    .prefault(def);

/** Số nguyên không âm an toàn. */
export const safeInt = (def: number, min = 0) =>
  z.coerce
    .number()
    .catch(def)
    .transform((v) => Math.max(min, Math.round(v)))
    .prefault(def);
