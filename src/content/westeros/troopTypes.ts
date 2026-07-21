// content/westeros/troopTypes.ts
// ============================================================================
// DANH MỤC BINH CHỦNG (11.2b) — metadata cho mọi loại trong TROOP_TYPES_ALL:
// - class kỵ/bộ/cung (tra bảng địa hình 7.6),
// - counterType (ánh xạ về 1 trong 6 loại nền cho ma trận tương khắc 7.9.2b Lớp 1),
// - gate theo Era (Rồng/Voi/Unsullied... chỉ hiện đúng thời — 11.2b),
// - chi phí tuyển + thời gian huấn luyện (11.3),
// - cờ đặc biệt cho rule Lớp 4 (7.9.2b) + sĩ khí Unsullied + phản trắc Lính Đánh Thuê.
// Thêm binh chủng = thêm 1 dòng, engine không đổi.
// ============================================================================
import { TROOP_TYPES, TROOP_TYPES_ALL } from "../../mvu/schema";

export type TroopTypeAll = (typeof TROOP_TYPES_ALL)[number];
export type BaseTroop = (typeof TROOP_TYPES)[number];
export type TroopClass = "kỵ" | "bộ" | "cung";

export interface TroopMeta {
  class: TroopClass;
  /** ánh xạ về 1 trong 6 loại nền cho ma trận COUNTER (Lớp 1). */
  counterType: BaseTroop;
  special: boolean; // binh chủng đặc biệt theo vùng/Nhà
  supernatural: boolean; // Rồng / Người Chết / Others (gate Era 7.15)
  /** tuyển được tại Doanh Trại (11.3). Binh chủng đặc biệt/siêu nhiên: false (đến qua cốt truyện). */
  recruitable: boolean;
  /** chi phí tuyển / 100 quân: Vàng + Lương Thực (11.3). */
  costPer100: { "Vàng": number; "Lương Thực": number };
  /** số turn huấn luyện trước khi sẵn sàng chiến đấu (11.3). */
  trainTurns: number;
  /** sĩ khí không sụp (Unsullied — rule Lớp 4). */
  fearless?: boolean;
  /** trung thành theo Vàng — roll đổi phe khi không trả lương (Lính Đánh Thuê 7.7). */
  mercenary?: boolean;
}

const M = (
  cls: TroopClass, counterType: BaseTroop, vang: number, luong: number, trainTurns: number,
  opts?: Partial<TroopMeta>,
): TroopMeta => ({
  class: cls, counterType, special: false, supernatural: false, recruitable: false,
  costPer100: { "Vàng": vang, "Lương Thực": luong }, trainTurns, ...opts,
});

export const TROOP_META: Record<TroopTypeAll, TroopMeta> = {
  // ── binh chủng thường (tuyển được) ──
  "Bộ Binh": M("bộ", "Bộ Binh", 100, 50, 2, { recruitable: true }),
  "Trường Thương": M("bộ", "Trường Thương", 120, 50, 2, { recruitable: true }),
  "Kỵ Binh": M("kỵ", "Kỵ Binh", 250, 80, 3, { recruitable: true }),
  "Kỵ Binh Nhẹ": M("kỵ", "Kỵ Binh Nhẹ", 180, 60, 2, { recruitable: true }),
  "Cung Thủ": M("cung", "Cung Thủ", 150, 40, 2, { recruitable: true }),
  "Công Thành": M("bộ", "Công Thành", 400, 30, 3, { recruitable: true }),
  // ── binh chủng đặc biệt (đến qua cốt truyện/liên minh) ──
  "Kỵ Sĩ Dothraki": M("kỵ", "Kỵ Binh Nhẹ", 0, 0, 0, { special: true }),
  "Unsullied": M("bộ", "Trường Thương", 0, 0, 0, { special: true, fearless: true }),
  "Người Sắt (Ironborn)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true }),
  "Bọn Man Tộc (Free Folk)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true }),
  "Dân Sơn Cước (Vale Mountain Clans)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true }),
  "Lính Đánh Thuê": M("bộ", "Bộ Binh", 300, 40, 1, { special: true, recruitable: true, mercenary: true }),
  "Nồi Đất (Braavosi)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true }),
  // ── siêu nhiên (gate Era 7.15) ──
  "Rồng": M("cung", "Kỵ Binh", 0, 0, 0, { special: true, supernatural: true }),
  "Voi Chiến": M("bộ", "Kỵ Binh", 0, 0, 0, { special: true, supernatural: false }),
  "Người Chết (Wight)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true, supernatural: true, fearless: true }),
  "Others (White Walker)": M("bộ", "Bộ Binh", 0, 0, 0, { special: true, supernatural: true, fearless: true }),
};

export function troopMeta(type: string): TroopMeta {
  return TROOP_META[type as TroopTypeAll] ?? TROOP_META["Bộ Binh"];
}
export function troopClassOf(type: string): TroopClass {
  return troopMeta(type).class;
}
export function counterTypeOf(type: string): BaseTroop {
  return troopMeta(type).counterType;
}

// ── Gate theo Era (11.2b) ────────────────────────────────────────────────────
const BASE6: TroopTypeAll[] = [...TROOP_TYPES];
const COMMON_SPECIAL: TroopTypeAll[] = [
  "Kỵ Sĩ Dothraki", "Người Sắt (Ironborn)", "Bọn Man Tộc (Free Folk)",
  "Dân Sơn Cước (Vale Mountain Clans)", "Lính Đánh Thuê", "Nồi Đất (Braavosi)",
];

/** Binh chủng khả dụng mỗi Era. Aegon: có Rồng, chưa Voi/Unsullied. Robert: có
 * Voi (hậu Vũ Điệu), KHÔNG Rồng (tuyệt chủng). Ngũ Vương: + Unsullied, Rồng non
 * chưa chiến đấu (loại). Sandbox: tất cả. */
export const ERA_TROOPS: Record<string, TroopTypeAll[]> = {
  "long-night": [...BASE6, "Bọn Man Tộc (Free Folk)", "Người Chết (Wight)", "Others (White Walker)"],
  "aegon-conquest": [...BASE6, ...COMMON_SPECIAL, "Rồng"],
  "dance-of-dragons": [...BASE6, ...COMMON_SPECIAL, "Rồng"],
  "blackfyre-rebellion": [...BASE6, ...COMMON_SPECIAL, "Voi Chiến"],
  "dunk-and-egg": [...BASE6, ...COMMON_SPECIAL, "Voi Chiến"],
  "roberts-rebellion": [...BASE6, ...COMMON_SPECIAL, "Voi Chiến"],
  "greyjoy-rebellion": [...BASE6, ...COMMON_SPECIAL, "Voi Chiến"],
  "war-of-five-kings": [...BASE6, ...COMMON_SPECIAL, "Voi Chiến", "Unsullied"],
  "sandbox": [...TROOP_TYPES_ALL],
};

export function availableTroopsForEra(eraId: string): TroopTypeAll[] {
  return ERA_TROOPS[eraId] ?? BASE6;
}

/** Binh chủng TUYỂN được tại Doanh Trại trong Era này (11.3 + gate 11.2b). */
export function recruitableTroopsForEra(eraId: string): TroopTypeAll[] {
  const avail = new Set(availableTroopsForEra(eraId));
  return TROOP_TYPES_ALL.filter((t) => avail.has(t) && TROOP_META[t].recruitable);
}
