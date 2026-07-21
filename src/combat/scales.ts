/**
 * Thang chuẩn hoá 0-100 (7.9.1): map enum MilitaryUnitSchema → điểm số để
 * công thức đồng nhất; thang mô tả 7 bậc cho AI kể đúng mà không bịa số.
 */
import type { MilitaryUnit } from "../mvu/schema";

export function qualityBand(v: number): string {
  if (v <= 20) return "Rệu Rã";
  if (v <= 40) return "Non Kém";
  if (v <= 60) return "Tạm Dùng";
  if (v <= 75) return "Thiện Chiến";
  if (v <= 85) return "Tinh Nhuệ";
  if (v <= 95) return "Danh Quân";
  return "Huyền Thoại";
}

export const MORALE_SCORE: Record<MilitaryUnit["Sĩ Khí"], number> = {
  "Hăng Hái": 85, "Ổn Định": 65, "Dao Động": 40, "Sắp Binh Biến": 15,
};
export const TRAIN_SCORE: Record<MilitaryUnit["Huấn Luyện"], number> = {
  "Tinh Nhuệ": 85, "Thành Thạo": 65, "Mới Lập Đội": 45, "Rời Rạc": 25,
};
export const LOGI_SCORE: Record<MilitaryUnit["Hậu Cần"], number> = {
  "Dồi Dào": 85, "Cầm Cự Được": 60, "Cực Kỳ Thiếu Thốn": 30,
};
export const EQUIP_SCORE: Record<MilitaryUnit["Trang Bị"], number> = {
  "Trọng Giáp Tinh Nhuệ": 85, "Đồng Bộ Chỉnh Tề": 60, "Thô Sơ": 30,
};

/** Map ngược điểm sĩ khí 0-100 → enum (sau biến động 7.9.5). */
export function moraleEnumFromScore(v: number): MilitaryUnit["Sĩ Khí"] {
  if (v >= 75) return "Hăng Hái";
  if (v >= 50) return "Ổn Định";
  if (v >= 25) return "Dao Động";
  return "Sắp Binh Biến";
}

/** Gộp nhiều đơn vị 1 phe: trung bình GIA QUYỀN theo Số Lượng (7.9.1). */
export interface AggregatedSide {
  totalTroops: number;
  morale: number;
  training: number;
  logistics: number;
  equipment: number;
}

export function aggregateUnits(units: MilitaryUnit[]): AggregatedSide {
  const alive = units.filter((u) => u["Số Lượng"] > 0);
  const total = alive.reduce((s, u) => s + u["Số Lượng"], 0);
  if (total === 0) return { totalTroops: 0, morale: 50, training: 45, logistics: 60, equipment: 60 };
  const w = (f: (u: MilitaryUnit) => number) => alive.reduce((s, u) => s + f(u) * u["Số Lượng"], 0) / total;
  return {
    totalTroops: total,
    morale: w((u) => MORALE_SCORE[u["Sĩ Khí"]]),
    training: w((u) => TRAIN_SCORE[u["Huấn Luyện"]]),
    logistics: w((u) => LOGI_SCORE[u["Hậu Cần"]]),
    equipment: w((u) => EQUIP_SCORE[u["Trang Bị"]]),
  };
}
