/**
 * Địa hình (7.6): bảng hệ số terrainMultiplier(loạiQuân, terrain) +
 * miễn phạt "Nhà quen địa hình" (Stark↔tuyết, Martell↔sa mạc...).
 */
import type { Terrain } from "../mvu/schema";
import { TROOP_TYPES } from "../mvu/schema";
import { troopClassOf } from "../content/westeros/troopTypes";

export type TroopType = (typeof TROOP_TYPES)[number];

/** Nhóm gọn để tra bảng 7.6 (Kỵ/Bộ/Cung) — phủ cả binh chủng đặc biệt (11.2b). */
function troopClass(t: string): "kỵ" | "bộ" | "cung" {
  return troopClassOf(t);
}

const TERRAIN_TABLE: Record<Terrain, { kỵ: number; bộ: number; cung: number }> = {
  "Đồng Bằng": { kỵ: 1.3, bộ: 1.0, cung: 1.0 },
  "Rừng Rậm": { kỵ: 0.6, bộ: 1.1, cung: 1.2 },
  "Đồi Núi": { kỵ: 0.7, bộ: 1.2, cung: 1.1 },
  "Đầm Lầy": { kỵ: 0.4, bộ: 0.9, cung: 0.8 },
  "Sông/Lối Vượt Sông": { kỵ: 0.6, bộ: 0.8, cung: 1.3 },
  "Tuyết/Băng Giá": { kỵ: 0.7, bộ: 0.85, cung: 0.9 },
  "Sa Mạc": { kỵ: 0.8, bộ: 0.8, cung: 0.9 },
  "Thành Trì (thủ)": { kỵ: 0.6, bộ: 1.0, cung: 1.2 },
  "Hẻm Núi": { kỵ: 0.5, bộ: 1.3, cung: 1.4 },
};

/** Nhà quen địa hình — miễn hệ số PHẠT (content/westeros/terrainAffinity). */
export const TERRAIN_AFFINITY: Record<string, Terrain[]> = {
  Stark: ["Tuyết/Băng Giá"],
  Martell: ["Sa Mạc"],
  Greyjoy: [], // biển — áp ở hải chiến (M9)
};

export function terrainMultiplier(troopType: string, terrain: Terrain | undefined, house?: string): number {
  if (!terrain) return 1.0;
  const m = TERRAIN_TABLE[terrain][troopClass(troopType)];
  // Nhà quen địa hình: miễn phạt (hệ số <1 nâng về 1.0), không cộng thưởng
  if (m < 1 && house && TERRAIN_AFFINITY[house]?.includes(terrain)) return 1.0;
  return m;
}
