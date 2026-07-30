/**
 * localTerrain — ĐỊA HÌNH TẦNG 1, sinh TẤT ĐỊNH từ dữ liệu Tầng 2/3.
 *
 * "Địa hình vi mô là hình chiếu của địa hình vĩ mô": địa thế một lãnh địa được
 * suy ra từ (a) địa hình chủ đạo của VÙNG, (b) vùng đó có ven biển không,
 * (c) một HẠT GIỐNG gieo lúc lãnh địa về tay ai đó. Cùng hạt giống → luôn cùng
 * kết quả, nên không cần lưu bản đồ vào save; đổi chủ/được phong thì gieo hạt
 * mới → địa thế khác nhưng vẫn đúng chất của vùng.
 *
 * KHÔNG dùng lưới ô vuông để phân loại: mọi thứ là TRƯỜNG liên tục (độ cao, độ
 * ẩm, biển, sông) sinh bằng nhiễu fBm có bóp méo miền (domain warping). Ranh
 * giới giữa các loại đất vì thế là đường lượn sóng tự nhiên, không có góc vuông
 * hay bậc thang; núi loang ra thành cụm rìa lởm chởm, rừng thưa dần rồi tan vào
 * đồng bằng, sông uốn khúc và đổi bề rộng theo dòng.
 *
 * Địa hình là THỀM ĐỠ: quyết định ô nào đặt được công trình, ô nào mọc điểm
 * tài nguyên — xem localMap.ts.
 */
import type { Terrain } from "../mvu/schema";
import type { MapRegion } from "../content/westeros/regions";
import type { LoreSeat } from "../content/westeros/loreSeats";
import { seatProfileFor, type SeatShape } from "../content/westeros/seatProfiles";
import {
  ARABLE_SHARE, TERRAIN_TRAITS, TERRAIN_PROFILE, isWater,
  type LocalTerrain, type TerrainProfile,
} from "../content/westeros/terrain";
import {
  LOCAL_BLOCKS, LOCAL_BLOCK_CELLS, LOCAL_GRID_CELLS, LOCAL_CENTER_CELL,
} from "../content/westeros/mapScale";

// ── Nhiễu tất định ──────────────────────────────────────────────────────────

function hash2(x: number, y: number, seed: number): number {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Quintic smoothstep — đạo hàm liên tục nên trường không có "nếp gấp". */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * fx;
  const bot = c + (d - c) * fx;
  return top + (bot - top) * fy;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * f, y * f, seed + i * 1013);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return v / norm;
}

/** Bóp méo miền — biến đường viền tròn trịa của nhiễu thành rìa lởm chởm thật. */
function warp(x: number, y: number, seed: number, amount: number): [number, number] {
  const wx = x + amount * (fbm(x * 0.6 + 11.3, y * 0.6 + 3.1, seed + 7717, 3) - 0.5);
  const wy = y + amount * (fbm(x * 0.6 - 5.7, y * 0.6 + 9.4, seed + 9133, 3) - 0.5);
  return [wx, wy];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function terrainSeedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Kiểu dữ liệu ────────────────────────────────────────────────────────────

/** Một điểm trên tim sông (toạ độ Ô lưới) — bề rộng đổi dọc theo dòng. */
export interface RiverPoint {
  x: number;
  y: number;
  w: number;
}

/** Thứ tự mã hoá địa hình trong mảng `kind`. */
export const TERRAIN_ORDER: LocalTerrain[] = [
  "Đồng Bằng", "Rừng Rậm", "Đồi Núi", "Đầm Lầy", "Sông/Lối Vượt Sông",
  "Tuyết/Băng Giá", "Sa Mạc", "Hẻm Núi", "Thành Trì (thủ)", "Biển",
];
const TERRAIN_INDEX: Record<string, number> = Object.fromEntries(TERRAIN_ORDER.map((t, i) => [t, i]));

/** Độ phân giải TRƯỜNG (dùng cho phân loại + kiểm tra đặt công trình). */
export const FIELD_RES = 192; // ≈ 39 m mỗi mẫu

export interface LocalTerrainMap {
  seed: number;
  dominant: Terrain;
  coastal: boolean;
  /** giữ tương thích với phần tổng hợp sản lượng — lưới khối thô. */
  blocks: number;
  blockCells: number;
  grid: LocalTerrain[];

  /** trường liên tục, FIELD_RES × FIELD_RES. */
  res: number;
  kind: Uint8Array;
  /** 0..1 — cao dần vào lõi núi, dùng để đổ bóng "cao dần lên". */
  elev: Float32Array;
  moist: Float32Array;
  /** >0 = trong lòng sông (1 ở tim dòng, tắt dần ra bờ). */
  riverF: Float32Array;
  /** >0 = ngoài biển. */
  seaF: Float32Array;
  /** tim sông theo toạ độ ô lưới (vẽ cầu, kiểm tra đường cắt sông). */
  river: RiverPoint[];
  /** Nhánh sông lore bổ sung; không nối giả với tim sông chính. */
  extraRivers?: RiverPoint[][];
}

// ── Sinh bản đồ ─────────────────────────────────────────────────────────────

const cache = new Map<string, LocalTerrainMap>();

export interface TerrainOpts {
  terrain?: Terrain;
  coastal?: boolean;
  region?: MapRegion | null;
  /** hạt giống gieo lúc lãnh địa đổi chủ; bỏ trống = suy từ id. */
  seed?: number;
  /**
   * Toà thành có tên trong tiểu thuyết — GHIM địa thế: hạt giống cố định, địa
   * hình và chất đất lấy theo mô tả gốc thay vì theo vùng. Winterfell luôn ra
   * Winterfell, ván nào cũng vậy.
   */
  lore?: LoreSeat | null;
  /**
   * GỢI Ý TỪ LỜI KỂ (M18) — khi input/output của AI nói "toà thành dựng bên
   * sông" hay "dưới chân núi", bản đồ BẮT BUỘC phải chiều theo. Đây là cầu nối
   * hai chiều giữa văn bản và dữ liệu bản đồ: kể sao thì đất phải vậy.
   */
  hints?: { river?: boolean; sea?: boolean; mountain?: boolean };
}

export function localTerrainMap(holdingId: string, opts: TerrainOpts): LocalTerrainMap {
  const lore = opts.lore ?? null;
  const dominant: Terrain = lore?.terrain ?? opts.terrain ?? opts.region?.terrain ?? "Đồng Bằng";
  const hints = opts.hints ?? {};
  const coastal = hints.sea === true
    ? true
    : lore ? lore.coastal : (opts.coastal ?? opts.region?.coastal ?? false);
  const seed = (lore?.seed ?? opts.seed ?? terrainSeedFromId(holdingId)) >>> 0;

  // Lời kể thắng bảng tính cách vùng: đã nói có sông thì riverChance = 1, đã nói
  // dưới chân núi thì nền đất phải dựng lên và cho phép sinh vách đá.
  const override: Partial<TerrainProfile> = { ...(lore?.profile ?? {}) };
  if (hints.river) override.riverChance = 1;
  if (hints.mountain) {
    override.elevBias = Math.max(override.elevBias ?? TERRAIN_PROFILE[dominant]?.elevBias ?? 0, 0.16);
    override.relief = Math.max(override.relief ?? TERRAIN_PROFILE[dominant]?.relief ?? 1, 1.3);
    override.cliffs = true;
  }

  const hintKey = `${hints.river ? "r" : ""}${hints.sea ? "s" : ""}${hints.mountain ? "m" : ""}`;
  const key = `${seed}|${dominant}|${coastal ? 1 : 0}|${lore?.name ?? ""}|${hintKey}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const shape = seatProfileFor(holdingId)?.shape;
  const map = generate(seed, dominant, coastal, override, shape);
  cache.set(key, map);
  if (cache.size > 24) cache.delete(cache.keys().next().value as string);
  return map;
}

const R = FIELD_RES;
const CELLS_PER_SAMPLE = LOCAL_GRID_CELLS / R;

/** Dòng nước định hình các thành nổi tiếng: không để Riverrun hay Song Sinh đổi sông theo seed. */
function loreRiversFor(shape: SeatShape | undefined): RiverPoint[][] | null {
  const path = (points: Array<[number, number, number]>): RiverPoint[] => points.map(([x, y, w]) => ({ x, y, w }));
  if (shape === "capital-three-hills") return [path([
    [640, 1500, 88], [760, 1390, 94], [900, 1260, 104], [1030, 1100, 120], [1150, 900, 138], [1240, 720, 160],
  ])];
  if (shape === "river-triangle") return [
    path([[1040, 0, 100], [1020, 280, 108], [1000, 580, 120], [980, 900, 132], [940, 1220, 144], [900, 1500, 158]]),
    path([[80, 250, 92], [270, 450, 102], [470, 650, 114], [650, 880, 126], [820, 1160, 140], [900, 1500, 158]]),
  ];
  if (shape === "river-twins") return [path([
    [760, 0, 120], [750, 260, 130], [758, 540, 146], [748, 820, 154], [755, 1110, 164], [750, 1500, 174],
  ])];
  if (shape === "harbor-city") return [path([
    [400, 0, 70], [520, 270, 82], [650, 510, 96], [790, 720, 112], [950, 900, 130], [1130, 1050, 150],
  ])];
  return null;
}

function generate(
  seed: number,
  dominant: Terrain,
  coastal: boolean,
  profileOverride: Partial<TerrainProfile> = {},
  shape?: SeatShape,
): LocalTerrainMap {
  const prof: TerrainProfile = { ...(TERRAIN_PROFILE[dominant] ?? TERRAIN_PROFILE["Đồng Bằng"]), ...profileOverride };
  const rnd = mulberry32(seed);

  const elev = new Float32Array(R * R);
  const moist = new Float32Array(R * R);
  const seaF = new Float32Array(R * R);
  const riverF = new Float32Array(R * R);
  const kind = new Uint8Array(R * R);

  // ---- bờ biển: một nửa mặt phẳng có mép lượn sóng, không phải cạnh thẳng ----
  // Thành cảng có tên phải giữ hướng nước ổn định; King's Landing nhìn ra Vịnh
  // Blackwater ở phía đông, thay vì đổi bờ theo một hạt ngẫu nhiên.
  const coastAngle = shape === "capital-three-hills" || shape === "harbor-city" || shape === "cliff-rock"
    ? 0
    : rnd() * Math.PI * 2;
  const cdx = Math.cos(coastAngle);
  const cdy = Math.sin(coastAngle);
  const coastOffset = 0.30 + rnd() * 0.14; // biển ăn vào bao nhiêu phần lưới

  // ---- độ cao & độ ẩm ----
  const eFreq = 2.1 + rnd() * 0.8;
  const mFreq = 2.6 + rnd() * 1.0;
  const raw = new Float32Array(R * R);
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < R; i++) {
      const u = i / R;
      const v = j / R;
      const [wx, wy] = warp(u * eFreq, v * eFreq, seed, 0.55);
      // nền mềm + một chút sống núi mảnh (ridged) cho rìa cụm núi lởm chởm
      const base = fbm(wx, wy, seed + 101, 5);
      const ridge = 1 - Math.abs(2 * fbm(wx * 1.7 + 4.2, wy * 1.7 - 2.6, seed + 233, 4) - 1);
      raw[j * R + i] = base * 0.74 + ridge * 0.26;

      // biển: càng ra khơi càng thấp, mép bờ được nhiễu làm cong queo
      const along = (u - 0.5) * cdx + (v - 0.5) * cdy;
      const wig = (fbm(u * 3.4 + 17.1, v * 3.4 - 8.3, seed + 401, 4) - 0.5) * 0.22;
      seaF[j * R + i] = coastal ? along - (coastOffset + wig) : -1;

      const [mx, my] = warp(u * mFreq + 31.7, v * mFreq + 12.9, seed + 555, 0.7);
      moist[j * R + i] = fbm(mx, my, seed + 677, 4) + prof.wet;
    }
  }

  // Chuẩn hoá độ cao về [0,1] theo phân vị của CHÍNH bản đồ này, rồi mới áp
  // tính cách của vùng. Nhờ vậy ngưỡng đồi/vách luôn nghĩa như nhau, không phụ
  // thuộc việc nhiễu lần này rơi vào dải cao hay thấp.
  const sample: number[] = [];
  for (let k = 0; k < raw.length; k += 5) sample.push(raw[k]);
  sample.sort((a, b) => a - b);
  const lo = sample[Math.floor(sample.length * 0.04)];
  const hi = sample[Math.floor(sample.length * 0.96)];
  const span = Math.max(1e-4, hi - lo);

  for (let k = 0; k < raw.length; k++) {
    const n = Math.max(0, Math.min(1, (raw[k] - lo) / span));
    let e = 0.5 + (n - 0.5) * prof.relief + prof.elevBias;
    if (coastal && seaF[k] > -0.12) e -= (seaF[k] + 0.12) * 2.4; // thoải dần xuống mép nước
    elev[k] = e;
  }

  // Ba đồi Aegon, Visenya và Rhaenys là cấu trúc địa hình, không phải ba biểu
  // tượng công trình. Chúng được dập vào height field trước khi phân loại ô đất.
  if (shape === "capital-three-hills") {
    const hills: Array<[number, number, number]> = [
      [0.66, 0.59, 0.34], // Aegon's High Hill, sát vịnh
      [0.39, 0.61, 0.28], // Visenya's Hill
      [0.40, 0.32, 0.25], // Rhaenys's Hill
    ];
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const k = j * R + i;
      if (coastal && seaF[k] > 0) continue;
      const u = i / R;
      const v = j / R;
      for (const [hx, hy, height] of hills) {
        const d2 = (u - hx) ** 2 + (v - hy) ** 2;
        elev[k] += height * Math.exp(-d2 / 0.008);
      }
    }
  }

  // Các địa hình còn lại cũng có "xương sống" riêng để silhouette thành và đất
  // đỡ nó không còn là một bản đồ ngẫu nhiên cùng màu.
  const addMound = (hx: number, hy: number, height: number, spread: number) => {
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const k = j * R + i;
      if (coastal && seaF[k] > 0) continue;
      const d2 = (i / R - hx) ** 2 + (j / R - hy) ** 2;
      elev[k] += height * Math.exp(-d2 / spread);
    }
  };
  if (shape === "cliff-rock") addMound(0.63, 0.55, 0.62, 0.018);
  if (shape === "mountain-terrace") {
    addMound(0.52, 0.48, 0.55, 0.020);
    addMound(0.38, 0.66, 0.24, 0.013);
  }
  if (shape === "hill-garden") addMound(0.52, 0.53, 0.24, 0.055);
  if (shape === "cliff-crescent") addMound(0.50, 0.42, 0.42, 0.036);
  if (shape === "volcanic-keep") addMound(0.52, 0.51, 0.68, 0.025);
  if (shape === "sea-stacks") {
    addMound(0.35, 0.52, 0.62, 0.009);
    addMound(0.58, 0.43, 0.58, 0.010);
    addMound(0.70, 0.65, 0.48, 0.009);
  }

  // ---- sông: đường uốn khúc chảy về chỗ trũng, bề rộng đổi dọc dòng ----
  let river = prof.riverChance > rnd() ? carveRiver(seed, elev, seaF, coastal, rnd) : [];
  let extraRivers: RiverPoint[][] | undefined;
  const prescribedRivers = loreRiversFor(shape);
  if (prescribedRivers) {
    river = prescribedRivers[0] ?? [];
    extraRivers = prescribedRivers.slice(1);
    riverF.fill(0);
    for (const branch of prescribedRivers) stampRiver(riverF, branch);
  } else if (river.length > 0) stampRiver(riverF, river);

  // ---- mảng ruộng quanh trọng trấn: đĩa tròn bị bóp méo, không phải hình tròn ----
  const arableShare = ARABLE_SHARE[dominant] ?? 0.3;
  const arableR = 0.16 + arableShare * 0.62; // bán kính chuẩn hoá
  const keepR = 0.055; // nền thành

  for (let j = 0; j < R; j++) {
    for (let i = 0; i < R; i++) {
      const k = j * R + i;
      const u = i / R;
      const v = j / R;
      const dx = u - 0.5;
      const dy = v - 0.5;
      const ang = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      // méo bán kính theo góc → rìa ruộng/nền thành lượn sóng
      const lobe = 0.72 + 0.56 * fbm(Math.cos(ang) * 1.6 + 40, Math.sin(ang) * 1.6 + 40, seed + 811, 3);

      let t: LocalTerrain;
      if (coastal && seaF[k] > 0) t = "Biển";
      else if (riverF[k] > 0.5) t = "Sông/Lối Vượt Sông";
      else if (dist < keepR * lobe) t = "Thành Trì (thủ)";
      else if (prof.cliffs && elev[k] > 0.95) t = "Hẻm Núi"; // vách đá chỉ ở lõi cao nhất
      else if (elev[k] > 0.70) t = "Đồi Núi";
      else if (dist < arableR * lobe && elev[k] < 0.66) t = "Đồng Bằng";
      else if (moist[k] + prof.forest > 0.78 && elev[k] < 0.72) t = "Rừng Rậm";
      else if (prof.wet > 0.25 && moist[k] > 0.5) t = "Đầm Lầy";
      else t = dominant;
      kind[k] = TERRAIN_INDEX[t] ?? 0;
    }
  }

  const map: LocalTerrainMap = {
    seed, dominant, coastal,
    blocks: LOCAL_BLOCKS, blockCells: LOCAL_BLOCK_CELLS,
    grid: [],
    res: R, kind, elev, moist, riverF, seaF, river, extraRivers,
  };
  map.grid = coarseGrid(map);
  return map;
}

/** Lưới khối thô (giữ cho phần tính sản lượng đất đai theo khối). */
function coarseGrid(map: LocalTerrainMap): LocalTerrain[] {
  const out: LocalTerrain[] = new Array(LOCAL_BLOCKS * LOCAL_BLOCKS);
  for (let by = 0; by < LOCAL_BLOCKS; by++) {
    for (let bx = 0; bx < LOCAL_BLOCKS; bx++) {
      const cx = bx * LOCAL_BLOCK_CELLS + LOCAL_BLOCK_CELLS / 2;
      const cy = by * LOCAL_BLOCK_CELLS + LOCAL_BLOCK_CELLS / 2;
      out[by * LOCAL_BLOCKS + bx] = terrainAtCell(map, cx, cy);
    }
  }
  return out;
}

// ── Sông ────────────────────────────────────────────────────────────────────

/**
 * Dòng chảy sinh bằng bước đi có quán tính: hướng đổi từ từ theo nhiễu tần
 * thấp (khúc cong nhiều ít khác nhau) CỘNG lực kéo về phía đất thấp — nên sông
 * len theo thung lũng, không cắt ngang đỉnh. Không có đoạn thẳng, không góc vuông.
 */
function carveRiver(seed: number, elev: Float32Array, seaF: Float32Array, coastal: boolean, rnd: () => number): RiverPoint[] {
  const sampleElev = (u: number, v: number): number => {
    const i = Math.max(0, Math.min(R - 1, Math.round(u * R)));
    const j = Math.max(0, Math.min(R - 1, Math.round(v * R)));
    return elev[j * R + i];
  };
  const inSea = (u: number, v: number): boolean => {
    if (!coastal) return false;
    const i = Math.max(0, Math.min(R - 1, Math.round(u * R)));
    const j = Math.max(0, Math.min(R - 1, Math.round(v * R)));
    return seaF[j * R + i] > 0.02;
  };

  // Vào lưới từ một cạnh KHÔNG phải mặt biển (nếu không dòng chết ngay khi sinh),
  // hướng ban đầu chếch vào trong.
  let u = 0.5;
  let v = 0;
  let found = false;
  for (let attempt = 0; attempt < 12 && !found; attempt++) {
    const edge = Math.floor(rnd() * 4);
    const t0 = 0.18 + rnd() * 0.64;
    u = edge === 0 ? t0 : edge === 1 ? 0.98 : edge === 2 ? t0 : 0.02;
    v = edge === 0 ? 0.02 : edge === 1 ? t0 : edge === 2 ? 0.98 : t0;
    if (!inSea(u, v)) found = true;
  }
  if (!found) return [];
  // chảy về phía tâm lãnh địa, lệch đi một chút
  let ang = Math.atan2(0.5 - v, 0.5 - u) + (rnd() - 0.5) * 0.7;

  const step = 0.012; // ~18 ô mỗi bước
  const baseW = 9 + rnd() * 9; // ô (45-90 m)
  const out: RiverPoint[] = [];

  for (let i = 0; i < 260; i++) {
    if (i > 4 && (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05)) break;
    if (i > 6 && inSea(u, v)) { // đổ ra biển thì dừng — cửa sông
      out.push({ x: u * LOCAL_GRID_CELLS, y: v * LOCAL_GRID_CELLS, w: baseW * 1.35 });
      break;
    }

    // khúc uốn: nhiễu tần thấp dọc theo chiều dài dòng
    const meander = (fbm(i * 0.035, 3.3, seed + 1301, 3) - 0.5) * 1.9;
    // dò 2 bên, lệch về phía thấp hơn
    const probe = 0.05;
    const left = sampleElev(u + Math.cos(ang - 0.7) * probe, v + Math.sin(ang - 0.7) * probe);
    const right = sampleElev(u + Math.cos(ang + 0.7) * probe, v + Math.sin(ang + 0.7) * probe);
    const descent = (left - right) * 1.6; // dương → rẽ phải (bên phải thấp hơn)

    // những bước đầu kéo dòng vào trong lưới, sau đó thả cho uốn tự do
    let pull = 0;
    if (i < 30) {
      let d = Math.atan2(0.5 - v, 0.5 - u) - ang;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      pull = d * (0.24 * (1 - i / 30));
    }
    // hạn góc bẻ mỗi bước → dòng luôn cong mềm, không bao giờ gãy thành góc nhọn
    ang += Math.max(-0.3, Math.min(0.3, meander * 0.16 + descent * 0.5 + pull));

    u += Math.cos(ang) * step;
    v += Math.sin(ang) * step;

    // bề rộng: hai nhịp nhiễu chồng nhau → có khúc thắt lại, có khúc loe ra
    // thành vũng, cộng xu hướng phình dần về hạ lưu.
    // nới tương phản của nhiễu (giá trị nhiễu hay dồn quanh 0.5) để khúc thắt
    // và khúc loe khác nhau rõ rệt, vẫn đổi từ từ chứ không giật cục
    const spread = (n: number): number => Math.max(0, Math.min(1, (n - 0.5) * 1.9 + 0.5));
    const wFast = spread(fbm(i * 0.16 + 9.1, 1.7, seed + 1601, 2));
    const wSlow = spread(fbm(i * 0.05 + 2.3, 5.5, seed + 1783, 2));
    const w = baseW * (0.4 + 1.2 * wFast) * (0.65 + 0.7 * wSlow) * (0.75 + (i / 260) * 0.7);
    out.push({ x: u * LOCAL_GRID_CELLS, y: v * LOCAL_GRID_CELLS, w });
  }
  return out.length > 12 ? out : [];
}

/** In dòng sông vào trường riverF — tắt dần ra hai bờ nên mép nước mềm. */
function stampRiver(riverF: Float32Array, river: RiverPoint[]): void {
  for (let s = 0; s < river.length - 1; s++) {
    const a = river[s];
    const b = river[s + 1];
    const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELLS_PER_SAMPLE * 0.6)));
    for (let t = 0; t <= steps; t++) {
      const f = t / steps;
      const cx = a.x + (b.x - a.x) * f;
      const cy = a.y + (b.y - a.y) * f;
      const w = a.w + (b.w - a.w) * f;
      const rad = (w / 2 + CELLS_PER_SAMPLE) / CELLS_PER_SAMPLE;
      const si = cx / CELLS_PER_SAMPLE;
      const sj = cy / CELLS_PER_SAMPLE;
      const i0 = Math.max(0, Math.floor(si - rad));
      const i1 = Math.min(R - 1, Math.ceil(si + rad));
      const j0 = Math.max(0, Math.floor(sj - rad));
      const j1 = Math.min(R - 1, Math.ceil(sj + rad));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const d = Math.hypot(i - si, j - sj) / rad;
          if (d > 1) continue;
          const val = 1 - d * d;
          const k = j * R + i;
          if (val > riverF[k]) riverF[k] = val;
        }
      }
    }
  }
}

// ── Truy vấn ────────────────────────────────────────────────────────────────

function clampIdx(n: number): number {
  return n < 0 ? 0 : n > R - 1 ? R - 1 : n;
}

/** Địa hình tại 1 Ô lưới. */
export function terrainAtCell(map: LocalTerrainMap, x: number, y: number): LocalTerrain {
  if (x < 0 || y < 0 || x >= LOCAL_GRID_CELLS || y >= LOCAL_GRID_CELLS) return "Biển";
  const i = clampIdx(Math.round(x / CELLS_PER_SAMPLE));
  const j = clampIdx(Math.round(y / CELLS_PER_SAMPLE));
  return TERRAIN_ORDER[map.kind[j * map.res + i]] ?? map.dominant;
}

/** Nội suy song tuyến 1 trường tại toạ độ Ô — dùng khi vẽ để mép mượt. */
export function sampleField(_map: LocalTerrainMap, field: Float32Array, x: number, y: number): number {
  const fx = Math.max(0, Math.min(R - 1.001, x / CELLS_PER_SAMPLE));
  const fy = Math.max(0, Math.min(R - 1.001, y / CELLS_PER_SAMPLE));
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const tx = fx - i;
  const ty = fy - j;
  const a = field[j * R + i];
  const b = field[j * R + i + 1];
  const c = field[(j + 1) * R + i];
  const d = field[(j + 1) * R + i + 1];
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}

/** Các loại địa hình nằm dưới một khoảnh đất [x, y, size] (ô). */
export function terrainsUnder(map: LocalTerrainMap, x: number, y: number, size: number): LocalTerrain[] {
  const found = new Set<LocalTerrain>();
  const step = Math.max(1, Math.floor(CELLS_PER_SAMPLE));
  for (let dy = 0; dy < size; dy += step) {
    for (let dx = 0; dx < size; dx += step) {
      found.add(terrainAtCell(map, x + dx, y + dy));
    }
  }
  found.add(terrainAtCell(map, x + size - 1, y + size - 1));
  found.add(terrainAtCell(map, x + size - 1, y));
  found.add(terrainAtCell(map, x, y + size - 1));
  return [...found];
}

/** Có mặt nước trong bán kính `radius` ô quanh khoảnh đất không (Bến Cảng). */
export function waterNearby(map: LocalTerrainMap, x: number, y: number, size: number, radius: number): boolean {
  const step = Math.max(1, Math.floor(CELLS_PER_SAMPLE));
  for (let dy = -radius; dy <= size + radius; dy += step) {
    for (let dx = -radius; dx <= size + radius; dx += step) {
      if (isWater(terrainAtCell(map, x + dx, y + dy))) return true;
    }
  }
  return false;
}

// ── Ảnh nền cho bản đồ Tầng 1 ───────────────────────────────────────────────

/** Độ phân giải ảnh nền (nội suy lên từ trường → ranh giới mềm, không bậc thang). */
export const RASTER_RES = 384;

const rasterCache = new Map<string, Uint8ClampedArray>();

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Ảnh RGBA của địa thế. Màu KHÔNG phẳng lì: mỗi loại đất được pha theo độ cao
 * (vào sâu vùng núi thì tối và đậm dần) cộng một lớp lốm đốm tần cao, nên đồng
 * cỏ có chỗ xanh đậm chỗ xanh nhạt như thật. Ranh giới lấy từ trường nội suy
 * nên là đường lượn, không phải cạnh khối.
 */
export function terrainRasterRGBA(map: LocalTerrainMap): Uint8ClampedArray {
  const key = `${map.seed}|${map.dominant}|${map.coastal ? 1 : 0}`;
  const hit = rasterCache.get(key);
  if (hit) return hit;

  const N = RASTER_RES;
  const data = new Uint8ClampedArray(N * N * 4);
  const palette = new Map<LocalTerrain, [number, number, number]>();
  for (const t of TERRAIN_ORDER) palette.set(t, hexToRgb(TERRAIN_TRAITS[t].fill));

  const cellPerPx = LOCAL_GRID_CELLS / N;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const cx = (i + 0.5) * cellPerPx;
      const cy = (j + 0.5) * cellPerPx;
      const t = terrainAtCell(map, cx, cy);
      const [r0, g0, b0] = palette.get(t) ?? [80, 80, 80];

      // 1. đổ bóng theo độ cao — lõi núi tối & đậm hơn rìa
      const e = sampleField(map, map.elev, cx, cy);
      let shade = 1;
      if (t === "Đồi Núi" || t === "Hẻm Núi") shade = 1.18 - Math.min(0.5, (e - 0.6) * 1.35);
      else if (t === "Biển") shade = 0.85 + Math.min(0.3, Math.max(0, -sampleField(map, map.seaF, cx, cy)) * 1.2);
      else if (t === "Sông/Lối Vượt Sông") shade = 0.85 + 0.3 * (1 - Math.min(1, sampleField(map, map.riverF, cx, cy)));
      else shade = 0.92 + e * 0.22;

      // 2. lốm đốm tần cao — cỏ chỗ đậm chỗ nhạt, rừng lỗ chỗ tán cây
      const grain = fbm(i * 0.16, j * 0.16, map.seed + 2801, 3) - 0.5;
      const patch = fbm(i * 0.045, j * 0.045, map.seed + 3301, 3) - 0.5;
      const amp = t === "Rừng Rậm" ? 0.3 : t === "Đồng Bằng" ? 0.2 : t === "Biển" ? 0.1 : 0.22;
      const mod = shade * (1 + grain * amp * 0.55 + patch * amp);

      const k = (j * N + i) * 4;
      data[k] = r0 * mod;
      data[k + 1] = g0 * mod;
      data[k + 2] = b0 * mod;
      data[k + 3] = 255;
    }
  }
  rasterCache.set(key, data);
  if (rasterCache.size > 8) rasterCache.delete(rasterCache.keys().next().value as string);
  return data;
}

/** Xoá cache — chỉ dùng trong test. */
export function _clearTerrainCache(): void {
  cache.clear();
  rasterCache.clear();
}

export { LOCAL_CENTER_CELL };
