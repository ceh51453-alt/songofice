/**
 * troopMatchup (7.9.2b) — lượng hoá `ưuKhuyếtBinhChủng` thành CÔNG THỨC SỐ chạy
 * được (engine tính, AI không đụng). 4 lớp nhân lại rồi clamp 0.7–1.3:
 *   Lớp 1 tương khắc binh chủng (COUNTER gia quyền theo thành phần),
 *   Lớp 2 địa hình × binh chủng (bảng 7.6 + miễn phạt Nhà quen địa hình),
 *   Lớp 3 chất lượng thực thi (khắc chế chỉ hiệu quả nếu quân đủ trình),
 *   Lớp 4 khắc chế đặc biệt (binh chủng đặc biệt/siêu nhiên 11.2b).
 * Hàm THUẦN — cùng input luôn cùng kết quả (test được).
 */
import type { Terrain, MilitaryUnit } from "../mvu/schema";
import { clamp } from "../mvu/helpers";
import { terrainMultiplier } from "./terrain";
import { counterTypeOf, troopMeta, type BaseTroop } from "../content/westeros/troopTypes";

export type Composition = Record<string, number>; // {loạiQuân: tỷ lệ 0-1}

export interface MatchupSide {
  composition: Composition;
  /** huấn luyện trung bình 0-100 (7.9.1). */
  training: number;
  house?: string;
}

// ── Lớp 1: ma trận tương khắc 6 binh chủng nền (spec 7.9.2b) ──────────────────
const COUNTER: Record<BaseTroop, Record<BaseTroop, number>> = {
  "Bộ Binh": { "Bộ Binh": 1.0, "Trường Thương": 0.9, "Kỵ Binh": 0.85, "Kỵ Binh Nhẹ": 1.05, "Cung Thủ": 1.15, "Công Thành": 1.1 },
  "Trường Thương": { "Bộ Binh": 1.1, "Trường Thương": 1.0, "Kỵ Binh": 1.35, "Kỵ Binh Nhẹ": 1.25, "Cung Thủ": 0.85, "Công Thành": 1.0 },
  "Kỵ Binh": { "Bộ Binh": 1.2, "Trường Thương": 0.65, "Kỵ Binh": 1.0, "Kỵ Binh Nhẹ": 1.15, "Cung Thủ": 1.4, "Công Thành": 0.7 },
  "Kỵ Binh Nhẹ": { "Bộ Binh": 0.95, "Trường Thương": 0.75, "Kỵ Binh": 0.85, "Kỵ Binh Nhẹ": 1.0, "Cung Thủ": 1.3, "Công Thành": 0.6 },
  "Cung Thủ": { "Bộ Binh": 0.85, "Trường Thương": 1.15, "Kỵ Binh": 0.6, "Kỵ Binh Nhẹ": 0.7, "Cung Thủ": 1.0, "Công Thành": 0.9 },
  "Công Thành": { "Bộ Binh": 0.9, "Trường Thương": 1.0, "Kỵ Binh": 1.3, "Kỵ Binh Nhẹ": 1.4, "Cung Thủ": 1.1, "Công Thành": 1.0 },
};

// ── tiện ích thành phần ──────────────────────────────────────────────────────
export function normalizeComposition(comp: Composition): Composition {
  const total = Object.values(comp).reduce((s, v) => s + Math.max(0, v), 0);
  if (total <= 0) return { "Bộ Binh": 1 };
  const out: Composition = {};
  for (const [k, v] of Object.entries(comp)) if (v > 0) out[k] = v / total;
  return out;
}

/** Thành phần 1 đơn vị: dùng "Thành Phần" nếu có, không thì thuần "Loại Quân". */
export function compositionFromUnit(unit: MilitaryUnit): Composition {
  const mix = unit["Thành Phần"];
  if (mix && Object.keys(mix).length > 0) return normalizeComposition(mix);
  return { [unit["Loại Quân"]]: 1 };
}

/** Gộp thành phần nhiều đơn vị (gia quyền theo Số Lượng). */
export function compositionFromUnits(units: MilitaryUnit[]): Composition {
  const acc: Composition = {};
  let total = 0;
  for (const u of units) {
    if (u["Số Lượng"] <= 0) continue;
    total += u["Số Lượng"];
    for (const [type, frac] of Object.entries(compositionFromUnit(u))) {
      acc[type] = (acc[type] ?? 0) + frac * u["Số Lượng"];
    }
  }
  if (total === 0) return { "Bộ Binh": 1 };
  return normalizeComposition(acc);
}

// ── Lớp 1 ────────────────────────────────────────────────────────────────────
function layer1Counter(ta: Composition, dich: Composition): number {
  let s = 0;
  for (const [taType, taW] of Object.entries(ta)) {
    const ct = counterTypeOf(taType);
    for (const [dichType, dichW] of Object.entries(dich)) {
      s += COUNTER[ct][counterTypeOf(dichType)] * taW * dichW;
    }
  }
  return s;
}

// ── Lớp 2 ────────────────────────────────────────────────────────────────────
function weatherMultiplier(troopType: string, weather?: string): number {
  if (!weather) return 1.0;
  const w = weather.toLowerCase();
  const cls = troopMeta(troopType).class;
  if ((w.includes("mưa") || w.includes("bão")) && cls === "cung") return 0.85; // dây cung ướt
  if (w.includes("sương") && cls === "kỵ") return 0.92; // sương mù khó xung phong
  return 1.0;
}

function layer2Terrain(side: MatchupSide, terrain: Terrain | undefined, weather?: string): number {
  let h = 0;
  let total = 0;
  for (const [type, w] of Object.entries(side.composition)) {
    if (w <= 0) continue;
    const f = terrainMultiplier(type, terrain, side.house) * weatherMultiplier(type, weather);
    h += f * w;
    total += w;
  }
  return total > 0 ? h / total : 1.0;
}

// ── Lớp 3 ────────────────────────────────────────────────────────────────────
function layer3Quality(taTrain: number, dichTrain: number): number {
  const d = (taTrain - dichTrain) / 100; // −1..+1
  return clamp(1 + d * 0.25, 0.85, 1.15);
}

// ── Lớp 4: khắc chế đặc biệt (11.2b) ─────────────────────────────────────────
function has(comp: Composition, type: string): number {
  return comp[type] ?? 0;
}
function classShare(comp: Composition, counter: BaseTroop): number {
  let s = 0;
  for (const [type, w] of Object.entries(comp)) if (counterTypeOf(type) === counter) s += w;
  return s;
}

function layer4Special(ta: MatchupSide, dich: MatchupSide, terrain: Terrain | undefined, siege: boolean): number {
  let m = 1.0;
  const taC = ta.composition;
  const dichCavShare = classShare(dich.composition, "Kỵ Binh") + classShare(dich.composition, "Kỵ Binh Nhẹ");

  // Kỵ Sĩ Dothraki: cực mạnh Đồng Bằng, vô dụng công thành
  if (has(taC, "Kỵ Sĩ Dothraki") > 0.2) {
    if (terrain === "Đồng Bằng") m *= 1.15;
    if (siege) m *= 0.8;
  }
  // Voi Chiến: ngựa sợ voi → phá kỵ binh
  if (has(taC, "Voi Chiến") > 0.15 && dichCavShare > 0.4) m *= 1.12;
  // Bọn Man Tộc: giỏi Tuyết/Rừng
  if (has(taC, "Bọn Man Tộc (Free Folk)") > 0.2 && (terrain === "Tuyết/Băng Giá" || terrain === "Rừng Rậm")) m *= 1.15;
  // Dân Sơn Cước: phục kích Hẻm Núi
  if (has(taC, "Dân Sơn Cước (Vale Mountain Clans)") > 0.2 && terrain === "Hẻm Núi") m *= 1.2;
  // Người Sắt: đổ bộ/ven biển (đầy đủ ở M9) — trận bộ đất liền hơi yếu
  if (has(taC, "Người Sắt (Ironborn)") > 0.4 && !siege && terrain !== undefined && terrain !== "Đồng Bằng") m *= 0.95;
  // Rồng: hệ số siêu nhiên (đầy đủ 7.15 ở M9) — ở đây chỉ chạm trần Lớp 4
  if (has(taC, "Rồng") > 0) m *= 1.15;
  // Unsullied thủ đội hình
  if (has(taC, "Unsullied") > 0.3) m *= 1.05;

  return clamp(m, 0.85, 1.15);
}

/**
 * ưuKhuyếtBinhChủng(pheTa, pheĐịch, địaHình, thờiTiết) — 4 lớp nhân, clamp 0.7–1.3.
 * siege = trận Vây Thành (Dothraki vô dụng công thành...).
 */
export function troopMatchup(
  ta: MatchupSide,
  dich: MatchupSide,
  opts?: { terrain?: Terrain; weather?: string; siege?: boolean },
): number {
  const taC = normalizeComposition(ta.composition);
  const dichC = normalizeComposition(dich.composition);
  const l1 = layer1Counter(taC, dichC);
  const l2 = layer2Terrain({ ...ta, composition: taC }, opts?.terrain, opts?.weather);
  const l3 = layer3Quality(ta.training, dich.training);
  const l4 = layer4Special({ ...ta, composition: taC }, { ...dich, composition: dichC }, opts?.terrain, opts?.siege ?? false);
  return clamp(l1 * l2 * l3 * l4, 0.7, 1.3);
}

/** Sĩ khí không sụp (Unsullied/Wight fearless — rule Lớp 4): sàn sĩ khí "Ổn Định". */
export function fearlessMoraleFloor(units: MilitaryUnit[], moraleScore: number): number {
  const hasFearless = units.some((u) => u["Số Lượng"] > 0 && troopMeta(u["Loại Quân"]).fearless);
  return hasFearless ? Math.max(moraleScore, 50) : moraleScore;
}
