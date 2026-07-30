/**
 * wages (M19) — NGUỒN CHÂN LÝ DUY NHẤT của lương lính, để sổ thu chi
 * (economy/budget) và cỗ máy quân sự (strategy/army) không bao giờ lệch nhau.
 *
 * Quy tắc: quân đắt tuyển thì cũng đắt nuôi; ngạch quyết định phần còn lại —
 * thân binh ăn lương đủ, dân phục dịch chỉ được nuôi cơm, quân chư hầu do chủ
 * cũ của họ trả phần lớn, lính đánh thuê đòi gấp mấy lần.
 */
import type { MilitaryUnit } from "../mvu/schema";
import { EXCHANGE_RATES } from "./currency";
import { TROOP_META } from "../content/westeros/troopTypes";
import { branchMeta } from "../content/westeros/armyBranches";

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

/** Lương NỀN một người lính mỗi tháng theo binh chủng (Đồng Đỏ). */
export function troopWage(troopType: string): number {
  const meta = TROOP_META[troopType as keyof typeof TROOP_META];
  if (!meta) return 588;
  // lương tháng suy từ chính chi phí tuyển. Bộ binh thường ≈ 588 Đồng Đỏ ≈ 10 Hươu Bạc.
  const base = meta.costPer100["Ngân Khố"] / 100; // Rồng Vàng mỗi lính
  const wage = base * 0.05 * G;
  return Math.max(120, Math.round(meta.mercenary ? wage * 2.6 : wage));
}

/** Lương tháng của CẢ đơn vị (Đồng Đỏ) — đã tính ngạch. */
export function unitMonthlyWage(unit: MilitaryUnit): number {
  const n = unit["Số Lượng"] || 0;
  if (n <= 0) return 0;
  return Math.round(troopWage(unit["Loại Quân"]) * branchMeta(unit["Ngạch"]).wageMult * n);
}
