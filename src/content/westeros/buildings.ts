// content/westeros/buildings.ts
// ============================================================================
// DANH MỤC CÔNG TRÌNH (10.2) + bảng chi phí/thời gian (10.3). Data thuần —
// thêm loại công trình = thêm 1 entry (đã có enum trong schema BUILDING_TYPES),
// KHÔNG đổi cấu trúc. Engine (construction.ts) chỉ đọc bảng này.
// ============================================================================
import type { BUILDING_TYPES } from "../../mvu/schema";

export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Tài nguyên tiêu hao/sản xuất (Vàng đi vào ngân khố thống nhất — 15 note). */
export type ResourceKey = "Vàng" | "Lương Thực" | "Gỗ" | "Đá" | "Quặng Sắt";

export interface BuildingDef {
  type: BuildingType;
  desc: string;
  /** tóm tắt hiệu ứng cho thẻ UI ("+200 Lương Thực/turn"). */
  effectSummary: string;
  /** chi phí CẤP 1 (cấp n = ×n). Vàng trừ ngân khố người chơi; còn lại trừ kho vùng. */
  cost: Partial<Record<ResourceKey, number>>;
  /** số turn (ngày) xây CẤP 1 (cấp n = +? mỗi cấp). */
  buildTurns: number;
  /** thu mỗi turn khi đã xây xong (×Cấp Độ). Vàng → ngân khố; còn lại → kho vùng. */
  yield?: Partial<Record<ResourceKey, number>>;
  /** chỉ xây được ở lãnh địa ven biển (10.2). */
  requiresCoastal?: boolean;
  /** cờ hiệu ứng cho engine/UI (phòng thủ, tuyển quân, lòng dân...). */
  flags?: {
    defense?: number;
    recruit?: boolean;
    port?: boolean;
    loyaltyPerTurn?: number;
    adminSpeedup?: number; // giảm % thời gian xây các công trình khác
  };
}

export const BUILDING_CATALOG: Record<BuildingType, BuildingDef> = {
  "Lâu Đài": {
    type: "Lâu Đài", desc: "Toà thành chính — phòng thủ và giới hạn quân đồn trú.",
    effectSummary: "+Phòng thủ, +giới hạn quân đồn trú",
    cost: { "Vàng": 800, "Gỗ": 200, "Đá": 400, "Quặng Sắt": 100 }, buildTurns: 8,
    flags: { defense: 20 },
  },
  "Nông Trại": {
    type: "Nông Trại", desc: "Đồng ruộng nuôi dân và quân.",
    effectSummary: "+200 Lương Thực/turn",
    cost: { "Vàng": 150, "Gỗ": 80, "Đá": 20 }, buildTurns: 3,
    yield: { "Lương Thực": 200 },
  },
  "Chợ": {
    type: "Chợ", desc: "Trung tâm mua bán — dòng vàng đều đặn.",
    effectSummary: "+120 Vàng/turn",
    cost: { "Vàng": 300, "Gỗ": 60, "Đá": 40 }, buildTurns: 4,
    yield: { "Vàng": 120 },
  },
  "Doanh Trại": {
    type: "Doanh Trại", desc: "Nơi tuyển mộ và huấn luyện binh sĩ (mục 11).",
    effectSummary: "Mở tuyển quân, +tốc độ tuyển",
    cost: { "Vàng": 400, "Gỗ": 150, "Đá": 100, "Quặng Sắt": 80 }, buildTurns: 5,
    flags: { recruit: true },
  },
  "Tường Thành": {
    type: "Tường Thành", desc: "Luỹ đá kiên cố — cực mạnh khi bị vây (mục 12).",
    effectSummary: "+Phòng thủ khi bị vây",
    cost: { "Vàng": 500, "Đá": 600, "Gỗ": 50 }, buildTurns: 7,
    flags: { defense: 15 },
  },
  "Bến Cảng": {
    type: "Bến Cảng", desc: "Cảng biển — hạm đội và giao thương (chỉ lãnh địa ven biển).",
    effectSummary: "+Hạm đội, +80 Vàng/turn",
    cost: { "Vàng": 350, "Gỗ": 250, "Đá": 80 }, buildTurns: 5,
    yield: { "Vàng": 80 }, requiresCoastal: true, flags: { port: true },
  },
  "Sept/Rừng Thần": {
    type: "Sept/Rừng Thần", desc: "Nơi thờ phụng — an lòng dân theo tôn giáo vùng.",
    effectSummary: "+2 Lòng Dân/turn",
    cost: { "Vàng": 250, "Gỗ": 100, "Đá": 150 }, buildTurns: 4,
    flags: { loyaltyPerTurn: 2 },
  },
  "Học Viện Nhỏ": {
    type: "Học Viện Nhỏ", desc: "Học viện quản lý — giảm thời gian xây, +tình báo.",
    effectSummary: "−20% thời gian xây, +hiệu quả quản lý",
    cost: { "Vàng": 700, "Gỗ": 150, "Đá": 200, "Quặng Sắt": 50 }, buildTurns: 8,
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

/** Số turn xây lên CẤP `level` (mỗi cấp thêm 50% thời gian nền). */
export function buildingTurns(type: BuildingType, level: number, adminSpeedup = 0): number {
  const base = BUILDING_CATALOG[type].buildTurns * (1 + (level - 1) * 0.5);
  return Math.max(1, Math.round(base * (1 - adminSpeedup)));
}
