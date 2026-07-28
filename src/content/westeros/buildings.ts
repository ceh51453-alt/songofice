// content/westeros/buildings.ts
// ============================================================================
// DANH MỤC CÔNG TRÌNH (10.2) + bảng chi phí/thời gian (10.3). Data thuần —
// thêm loại công trình = thêm 1 entry (đã có enum trong schema BUILDING_TYPES),
// KHÔNG đổi cấu trúc. Engine (construction.ts) chỉ đọc bảng này.
// ============================================================================
import type { BUILDING_TYPES } from '../../mvu/schema';
import { EXCHANGE_RATES } from '../../economy/currency';
import { turnsToDays } from '../../mvu/calendar';

export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Tài nguyên tiêu hao/sản xuất (Vàng đi vào ngân khố thống nhất — 15 note). */
export type ResourceKey = "Ngân Khố" | "Lương Thực" | "Gỗ" | "Đá" | "Quặng Sắt";

export interface BuildingDef {
  type: BuildingType;
  desc: string;
  /** tóm tắt hiệu ứng cho thẻ UI ("+200 Lương Thực/tháng"). */
  effectSummary: string;
  /** chi phí CẤP 1 (cấp n = ×n). Vàng trừ ngân khố người chơi; còn lại trừ kho vùng. */
  cost: Partial<Record<ResourceKey, number>>;
  /** số THÁNG xây CẤP 1 (cấp n = +50% mỗi cấp). Quy ra ngày qua buildingDays(). */
  buildMonths: number;
  /** thu mỗi THÁNG khi đã xây xong (×Cấp Độ). Vàng → ngân khố; còn lại → kho vùng. */
  yield?: Partial<Record<ResourceKey, number>>;
  /** chỉ xây được ở lãnh địa ven biển (10.2). */
  requiresCoastal?: boolean;
  /** cờ hiệu ứng cho engine/UI (phòng thủ, tuyển quân, lòng dân...). */
  flags?: {
    defense?: number;
    recruit?: boolean;
    port?: boolean;
    loyaltyPerMonth?: number;
    adminSpeedup?: number; // giảm % thời gian xây các công trình khác
  };
}

export const BUILDING_CATALOG: Record<BuildingType, BuildingDef> = {
  "Lâu Đài": {
    type: "Lâu Đài", desc: "Toà thành chính — phòng thủ và giới hạn quân đồn trú.",
    effectSummary: "+Phòng thủ, +giới hạn quân đồn trú",
    cost: { "Ngân Khố": 800 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 200, "Đá": 400, "Quặng Sắt": 100 }, buildMonths: 8,
    flags: { defense: 20 },
  },
  "Nông Trại": {
    type: "Nông Trại", desc: "Đồng ruộng nuôi dân và quân.",
    effectSummary: "+200 Lương Thực/tháng",
    cost: { "Ngân Khố": 150 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 80, "Đá": 20 }, buildMonths: 3,
    yield: { "Lương Thực": 200 },
  },
  "Chợ": {
    type: "Chợ", desc: "Trung tâm mua bán — dòng vàng đều đặn.",
    effectSummary: "+120 Vàng/tháng",
    cost: { "Ngân Khố": 300 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 60, "Đá": 40 }, buildMonths: 4,
    yield: { "Ngân Khố": 120 * EXCHANGE_RATES.GOLD_TO_COPPER },
  },
  "Doanh Trại": {
    type: "Doanh Trại", desc: "Nơi tuyển mộ và huấn luyện binh sĩ (mục 11).",
    effectSummary: "Mở tuyển quân, +tốc độ tuyển",
    cost: { "Ngân Khố": 400 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 150, "Đá": 100, "Quặng Sắt": 80 }, buildMonths: 5,
    flags: { recruit: true },
  },
  "Tường Thành": {
    type: "Tường Thành", desc: "Luỹ đá kiên cố — cực mạnh khi bị vây (mục 12).",
    effectSummary: "+Phòng thủ khi bị vây",
    cost: { "Ngân Khố": 500 * EXCHANGE_RATES.GOLD_TO_COPPER, "Đá": 600, "Gỗ": 50 }, buildMonths: 7,
    flags: { defense: 15 },
  },
  "Bến Cảng": {
    type: "Bến Cảng", desc: "Cảng biển — hạm đội và giao thương (chỉ lãnh địa ven biển).",
    effectSummary: "+Hạm đội, +80 Vàng/tháng",
    cost: { "Ngân Khố": 350 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 250, "Đá": 80 }, buildMonths: 5,
    yield: { "Ngân Khố": 80 * EXCHANGE_RATES.GOLD_TO_COPPER }, requiresCoastal: true, flags: { port: true },
  },
  "Sept/Rừng Thần": {
    type: "Sept/Rừng Thần", desc: "Nơi thờ phụng — an lòng dân theo tôn giáo vùng.",
    effectSummary: "+2 Lòng Dân/tháng",
    cost: { "Ngân Khố": 250 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 100, "Đá": 150 }, buildMonths: 4,
    flags: { loyaltyPerMonth: 2 },
  },
  "Học Viện Nhỏ": {
    type: "Học Viện Nhỏ", desc: "Học viện quản lý — giảm thời gian xây, +tình báo.",
    effectSummary: "−20% thời gian xây, +hiệu quả quản lý",
    cost: { "Ngân Khố": 700 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 150, "Đá": 200, "Quặng Sắt": 50 }, buildMonths: 8,
    flags: { adminSpeedup: 0.2 },
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_CATALOG);

/** Chi phí xây/nâng lên CẤP `level` (tuyến tính theo cấp — 10.3). */
export function buildingCost(type: BuildingType, level: number): Partial<Record<ResourceKey, number>> {
  const base = BUILDING_CATALOG[type].cost;
  const out: Partial<Record<ResourceKey, number>> = {};
  for (const [k, v] of Object.entries(base)) out[k as ResourceKey] = Math.round((v ?? 0) * level);
  return out;
}

/** Số NGÀY xây lên CẤP `level` (mỗi cấp thêm 50% thời gian nền). */
export function buildingDays(type: BuildingType, level: number, adminSpeedup = 0): number {
  const baseMonths = BUILDING_CATALOG[type].buildMonths * (1 + (level - 1) * 0.5);
  return Math.max(1, Math.round(turnsToDays(baseMonths) * (1 - adminSpeedup)));
}
