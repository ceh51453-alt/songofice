// content/westeros/mapScale.ts
// ============================================================================
// TỈ LỆ & TẦNG BẢN ĐỒ (hệ Đa Tầng) — MỘT nguồn chân lý về không gian cho cả 3
// tầng. Mọi tầng dùng CHUNG hệ toạ độ px-ảnh-gốc (MAP_W × MAP_H); zoom chỉ đổi
// mức chi tiết (LOD), KHÔNG đổi toạ độ vật lý.
//
//   Tầng 1 — Lãnh Địa (local) : lưới ô 5 × 5 m, quản lý VI MÔ (công trình, tài
//                               nguyên, chiến thuật). Neo vào 1 điểm px thế giới.
//   Tầng 2 — Lãnh Thổ (region): bỏ lưới, gom cụm khu dân cư, quản lý TẦM TRUNG
//                               (hành chính, điều quân, giao thương).
//   Tầng 3 — Thế Giới (world) : bỏ chi tiết lẻ, địa chính trị VĨ MÔ.
//
// Quy đổi vật lý (giữ 3 tầng nhất quán):
//   1 ô lưới          = 5 m
//   1 lưới lãnh địa   = 1500 ô = 7.5 km mỗi cạnh
//   1 px ảnh thế giới = WORLD_KM_PER_PX km (suy từ chiều dài Westeros)
// → toàn bộ lưới 1 lãnh địa ≈ 2.3 px trên bản đồ thế giới: đúng bản chất "một
//   chấm" ở Tầng 3, và là cả một vùng quy hoạch ở Tầng 1.
// ============================================================================
/** 3 tầng bản đồ. Tầng nào cũng đọc cùng 1 nguồn dữ liệu (stat_data). */
export type MapTier = "world" | "region" | "local";

export const MAP_TIERS: MapTier[] = ["world", "region", "local"];

export const TIER_LABEL: Record<MapTier, string> = {
  world: "Thế Giới",
  region: "Lãnh Thổ",
  local: "Lãnh Địa",
};

export const TIER_HINT: Record<MapTier, string> = {
  world: "Địa chính trị — châu lục, biên giới, cán cân quyền lực",
  region: "Hành chính — vùng, khu dân cư, hành quân, giao thương",
  local: "Quy hoạch — lưới 5 m, công trình, địa hình, tài nguyên",
};

// ── Tầng 1: lưới lãnh địa ───────────────────────────────────────────────────

/** Cạnh 1 ô lưới Tầng 1 (mét). */
export const LOCAL_CELL_M = 5;
/** Số ô mỗi cạnh của lưới 1 lãnh địa. */
export const LOCAL_GRID_CELLS = 1500;
/** Tâm lưới (trọng trấn/lâu đài đứng ở đây). */
export const LOCAL_CENTER_CELL = LOCAL_GRID_CELLS / 2;
/**
 * Cạnh 1 KHỐI địa hình (ô). Địa hình lưu theo khối chứ không theo từng ô:
 * 60 ô = 300 m — đủ mịn để "đỡ" công trình, đủ thô để render 25×25 khối.
 */
export const LOCAL_BLOCK_CELLS = 60;
export const LOCAL_BLOCKS = LOCAL_GRID_CELLS / LOCAL_BLOCK_CELLS; // 25
/** Bề rộng thực tế của toàn lưới (mét). */
export const LOCAL_SPAN_M = LOCAL_GRID_CELLS * LOCAL_CELL_M; // 7 500 m

// ── Tầng 2/3: px ảnh thế giới ───────────────────────────────────────────────

/** Chiều dài Westeros từ Tường Thành tới mũi Dorne (km, canon ≈ 3000 dặm). */
export const WESTEROS_LENGTH_KM = 4800;
/** 1 px ảnh gốc = bao nhiêu km thật. */
/** Stable Westeros height reference; expanding the world canvas must not rescale travel. */
export const WESTEROS_REFERENCE_HEIGHT_PX = 1500;
export const WORLD_KM_PER_PX = WESTEROS_LENGTH_KM / WESTEROS_REFERENCE_HEIGHT_PX;
/** Bề rộng 1 lưới lãnh địa quy ra px thế giới (≈ 2.3 px). */
export const LOCAL_SPAN_WORLD_PX = LOCAL_SPAN_M / 1000 / WORLD_KM_PER_PX;

// ── Quy đổi ─────────────────────────────────────────────────────────────────

export function cellsToMeters(cells: number): number {
  return cells * LOCAL_CELL_M;
}
export function metersToCells(m: number): number {
  return Math.round(m / LOCAL_CELL_M);
}
export function worldPxToKm(px: number): number {
  return px * WORLD_KM_PER_PX;
}
export function kmToWorldPx(km: number): number {
  return km / WORLD_KM_PER_PX;
}

/** Ô lưới Tầng 1 → px thế giới (Tầng 2/3), quanh điểm neo của lãnh địa. */
export function localCellToWorldPx(anchor: [number, number], cellX: number, cellY: number): [number, number] {
  const half = LOCAL_GRID_CELLS / 2;
  const pxPerCell = LOCAL_SPAN_WORLD_PX / LOCAL_GRID_CELLS;
  return [anchor[0] + (cellX - half) * pxPerCell, anchor[1] + (cellY - half) * pxPerCell];
}

/** px thế giới → ô lưới Tầng 1 (nghịch đảo localCellToWorldPx). */
export function worldPxToLocalCell(anchor: [number, number], x: number, y: number): [number, number] {
  const half = LOCAL_GRID_CELLS / 2;
  const pxPerCell = LOCAL_SPAN_WORLD_PX / LOCAL_GRID_CELLS;
  return [Math.round(half + (x - anchor[0]) / pxPerCell), Math.round(half + (y - anchor[1]) / pxPerCell)];
}

/** Khoảng cách thật (km) giữa 2 điểm px thế giới — dùng cho hành quân/giao thương. */
export function worldDistanceKm(a: [number, number], b: [number, number]): number {
  return worldPxToKm(Math.hypot(a[0] - b[0], a[1] - b[1]));
}

/**
 * Bán kính vùng quy hoạch (ô) quanh trọng trấn theo cấp Lâu Đài —
 * cấp 1 ≈ 800 m, cấp 5 ≈ 2 km. Vượt ra ngoài là đất hoang chưa khai phá.
 */
export function buildableRadiusCells(castleLevel: number): number {
  return Math.min(LOCAL_CENTER_CELL - 20, 100 + Math.max(0, castleLevel) * 60);
}

// ── Semantic zoom (LOD) ─────────────────────────────────────────────────────

/**
 * Ngưỡng zoom đổi tầng. Zoom xa → gom cụm (Tầng 3); zoom gần → bóc tách chi
 * tiết (Tầng 2 → mời vào Tầng 1). Tầng 1 KHÔNG tự bật theo zoom vì cần biết
 * "lãnh địa nào" — người chơi chọn 1 khu dân cư để vào.
 */
export const TIER_ZOOM = {
  /** dưới ngưỡng này → hiển thị bức tranh Tầng 3. */
  worldMax: 0.55,
  /** trên ngưỡng này → Tầng 2 đã đủ gần để mời vào Tầng 1. */
  localHint: 2.6,
} as const;

export function tierForZoom(z: number): Exclude<MapTier, "local"> {
  return z < TIER_ZOOM.worldMax ? "world" : "region";
}

/**
 * Bộ lọc hiển thị theo zoom ở Tầng 2 (chống rác hình ảnh — chỉ render thứ hợp
 * với mức chi tiết hiện tại).
 */
export interface RegionLod {
  /** tên vùng + biên giới. */
  regionLabels: boolean;
  /** trọng trấn (thủ phủ vùng). */
  seats: boolean;
  /** thành phố/thị trấn phụ. */
  towns: boolean;
  /** làng mạc + địa danh nhỏ. */
  villages: boolean;
  /** nhãn chữ cho khu dân cư. */
  settlementLabels: boolean;
  /** tuyến đường/giao thương. */
  roads: boolean;
}

export function regionLod(z: number): RegionLod {
  return {
    regionLabels: true,
    seats: true,
    towns: z >= 0.85,
    villages: z >= 1.6,
    settlementLabels: z >= 1.1,
    roads: z >= 0.7,
  };
}
