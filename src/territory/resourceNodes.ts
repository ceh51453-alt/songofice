/**
 * resourceNodes — ĐIỂM TÀI NGUYÊN TRÊN LƯỚI TẦNG 1 (M18).
 *
 * Ba câu hỏi cần trả lời dứt khoát, và đây là câu trả lời:
 *
 * 1. "Điểm tài nguyên do AI bịa hay do thuật toán?" — THUẬT TOÁN. Mỗi loại địa
 *    hình có một bảng XÁC SUẤT riêng (rừng ra gỗ, đồi ra quặng/than/đá, đầm lầy
 *    ra thảo dược và than bùn). Gieo bằng hạt giống địa hình nên cùng một lãnh
 *    địa luôn cho cùng một bản đồ mỏ.
 *
 * 2. "Có lưu vào biến để AI quản lý không?" — CÓ. Sau khi sinh, điểm được GHI
 *    THẲNG vào stat_data."Lãnh Địa"[id]."Điểm Tài Nguyên". Từ đó nó là dữ liệu
 *    thật: AI đọc được để kể, ghi được để thêm mỏ mới, và save giữ nguyên.
 *
 * 3. "Lời kể và bản đồ có khớp nhau không?" — CÓ, nhờ "Gợi Ý Địa Thế". Khi lời
 *    kể nói "dựng thành bên sông" hay "vùng đất lắm sắt", engine ghi gợi ý vào
 *    holding; bộ sinh địa hình bắt buộc chừa một dòng sông, và hàm dưới đây bắt
 *    buộc gieo đủ điểm tài nguyên đã được nhắc tên.
 *
 * Công trình khai thác phải dựng ĐÈ lên điểm — sản lượng nhân theo BẬC trữ
 * lượng, và mỗi tháng khai thác lại rút bớt đi. Mỏ nào cũng có ngày cạn.
 */
import type { StatData, ResourceNode, WallLine } from "../mvu/schema";
import type { LocalTerrain } from "../content/westeros/terrain";
import { isWater } from "../content/westeros/terrain";
import { LOCAL_GRID_CELLS, LOCAL_BLOCK_CELLS, LOCAL_CENTER_CELL } from "../content/westeros/mapScale";
import { terrainAtCell, type LocalTerrainMap } from "./localTerrain";

type Holding = StatData["Lãnh Địa"][string];

/** BẬC trữ lượng: 0 cạn · 1 nghèo · 2 khá · 3 giàu. */
export const NODE_GRADE_LABEL: Record<number, string> = {
  0: "Cạn Kiệt",
  1: "Nghèo",
  2: "Khá",
  3: "Giàu",
};

/** Hệ số sản lượng theo bậc — bậc 0 thì công trình đứng không. */
export const NODE_GRADE_MULT: Record<number, number> = { 0: 0, 1: 0.55, 2: 1, 3: 1.5 };

/**
 * Bán kính mục tiêu của vùng tài nguyên. Một vùng giàu có thể trải rộng khoảng
 * 10 km² nếu địa hình phù hợp liền mạch; biên thật vẫn bị cắt theo địa hình.
 */
export const NODE_GRADE_RADIUS: Record<number, number> = { 0: 24, 1: 80, 2: 180, 3: 360 };

/** Tỉ lệ bậc trữ lượng khi sinh mới: phần lớn là mạch nghèo, mạch giàu hiếm. */
export const NODE_GRADE_CHANCE = { 1: 0.55, 2: 0.30, 3: 0.15 } as const;

/**
 * Lõi thành: Lâu Đài nằm ở ô 750,750. Không được gieo mỏ/ruộng/điểm cá vào
 * sân thành hoặc ngay sát tường trong; công trình khai thác có thể phủ lên
 * điểm tài nguyên của nó, nhưng bản thân điểm tài nguyên không bao giờ được
 * chồng lên thành trì.
 */
export const KEEP_RESOURCE_CLEARANCE = 72;

/**
 * Hành lang trống hai bên một tuyến tường (ô lưới).  Điểm tài nguyên được vẽ
 * bằng một vòng tròn có bán kính riêng, nên chỉ tránh đúng nét tường là chưa
 * đủ: tâm mỏ vẫn có thể nằm trên góc/đỉnh tường.  Khoảng này là phần đệm từ
 * mép tường tới mép biểu tượng tài nguyên.
 */
export const WALL_RESOURCE_CLEARANCE = 18;

/**
 * Mật độ nền của một lãnh địa. Các điểm được lấy mẫu trải đều quanh thành,
 * không cắt theo thứ tự quét từ bắc xuống nam.
 */
export const RESOURCE_NODE_LIMIT = 80;

export function overlapsKeepReserve(x: number, y: number, size = 0): boolean {
  return Math.hypot(x - LOCAL_CENTER_CELL, y - LOCAL_CENTER_CELL) <= KEEP_RESOURCE_CLEARANCE + size;
}

function distanceToSegment(x: number, y: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(x - a.x, y - a.y);
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSquared));
  return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
}

/** Một nút không được chạm thân, góc hay đỉnh của bất kỳ tường thành nào. */
export function overlapsWallReserve(walls: WallLine[] | undefined, x: number, y: number, size = 0): boolean {
  for (const wall of walls ?? []) {
    const points = wall["Điểm"];
    // Khớp với độ dày khi canvas vẽ tường, rồi cộng hành lang an toàn và bán
    // kính của chính điểm tài nguyên.
    const wallHalfWidth = 1.5 + wall["Cấp"] * 0.7;
    const clearance = WALL_RESOURCE_CLEARANCE + wallHalfWidth + size;
    for (let i = 0; i < points.length - 1; i++) {
      if (distanceToSegment(x, y, points[i], points[i + 1]) <= clearance) return true;
    }
  }
  return false;
}

function overlapsReservedGround(walls: WallLine[] | undefined, x: number, y: number, size = 0): boolean {
  return overlapsKeepReserve(x, y, size) || overlapsWallReserve(walls, x, y, size);
}

/** Trữ lượng còn lại (đơn vị sản phẩm) khi một điểm đang ở bậc `grade`. */
export function gradeReserve(grade: number): number {
  return ({ 0: 0, 1: 8_000, 2: 26_000, 3: 70_000 } as Record<number, number>)[grade] ?? 0;
}

/** Một dòng trong bảng xác suất: gặp địa hình này thì có `p` cơ hội ra `res`. */
export interface NodeChance {
  res: string;
  /** Xác suất tuyệt đối trên một khu vực lấy mẫu; tổng <= 1. */
  p: number;
}

export const RESOURCE_ZONE_TYPES = ["Rừng Rậm", "Khoáng Sản", "Sông Hồ", "Biển Cả"] as const;
export type ResourceZoneType = typeof RESOURCE_ZONE_TYPES[number];

/** Thành phần chuẩn; tổng mỗi vùng bằng 100%. */
export const RESOURCE_ZONE_COMPOSITION: Record<ResourceZoneType, Record<string, number>> = {
  "Rừng Rậm": { "Gỗ": 0.5, "Da Thú": 0.16, "Sáp Ong": 0.1, "Thảo Dược": 0.16, "Lanh": 0.08 },
  "Khoáng Sản": { "Quặng Sắt": 0.25, "Than Đá": 0.17, "Đồng": 0.1, "Thiếc": 0.08, "Đá": 0.3, "Hắc Diện Thạch": 0.1 },
  "Sông Hồ": { "Cá Nước Ngọt": 0.55, "Thủy Sản Nước Ngọt": 0.25, "Rong Nước Ngọt": 0.1, "Dược Liệu Thủy Sinh": 0.1 },
  "Biển Cả": { "Cá Nước Mặn": 0.45, "Hải Sản": 0.3, "Rong Biển": 0.1, "Muối": 0.1, "Ngọc Trai": 0.05 },
};

export function isResourceZone(value: string): value is ResourceZoneType {
  return (RESOURCE_ZONE_TYPES as readonly string[]).includes(value);
}

/** Đưa tên hàng hóa cũ / gợi ý từ lời kể về một trong bốn vùng chính. */
export function zoneForResource(resource: string): ResourceZoneType {
  if (isResourceZone(resource)) return resource;
  for (const zone of RESOURCE_ZONE_TYPES) {
    if (resource in RESOURCE_ZONE_COMPOSITION[zone]) return zone;
  }
  if (["Cá Khô", "Cá", "Thủy Sản"].includes(resource)) return "Sông Hồ";
  if (["Hải Sản", "Cá Biển"].includes(resource)) return "Biển Cả";
  if (["Gỗ", "Da Thú", "Sáp Ong", "Thảo Dược", "Lanh"].includes(resource)) return "Rừng Rậm";
  return "Khoáng Sản";
}

export function nodeResources(node: ResourceNode): Record<string, number> {
  const stored = node["Thành Phần"] ?? {};
  if (Object.keys(stored).length > 0) return stored;
  return RESOURCE_ZONE_COMPOSITION[zoneForResource(node["Tài Nguyên"])];
}

export function nodeContainsResource(node: ResourceNode, resource: string): boolean {
  if (node["Tài Nguyên"] === resource) return true;
  if (isResourceZone(resource)) return zoneForResource(node["Tài Nguyên"]) === resource;
  if (resource === "Cá Khô") return ["Sông Hồ", "Biển Cả"].includes(zoneForResource(node["Tài Nguyên"]));
  return (nodeResources(node)[resource] ?? 0) > 0;
}

/** Tỷ lệ tốt nhất trong nhóm nguyên liệu mà một công trình chấp nhận. */
export function nodeResourceShare(node: ResourceNode | null, wanted: string[]): number {
  if (!node) return 1;
  if (wanted.some(isResourceZone)) return 1;
  return Math.max(0, ...wanted.map((resource) => {
    if (resource === "Cá Khô" && ["Sông Hồ", "Biển Cả"].includes(zoneForResource(node["Tài Nguyên"]))) return 0.2;
    return nodeResources(node)[resource] ?? 0;
  }));
}

/**
 * BẢNG XÁC SUẤT SINH ĐIỂM THEO ĐỊA HÌNH. Tổng p của mỗi địa hình chính là xác
 * suất một khoảnh đất loại đó có mỏ; phần còn lại là đất trống.
 */
export const NODE_TABLE: Partial<Record<LocalTerrain, NodeChance[]>> = {
  "Rừng Rậm": [
    { res: "Rừng Rậm", p: 0.8 },
  ],
  "Đồi Núi": [
    { res: "Khoáng Sản", p: 0.72 },
  ],
  "Hẻm Núi": [
    { res: "Khoáng Sản", p: 0.68 },
  ],
  "Đầm Lầy": [],
  "Đồng Bằng": [],
  "Sa Mạc": [
    { res: "Khoáng Sản", p: 0.3 },
  ],
  "Tuyết/Băng Giá": [
    { res: "Khoáng Sản", p: 0.12 },
  ],
  "Thành Trì (thủ)": [],
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gieo bậc trữ lượng: giàu thì hiếm, nghèo thì đầy — như mọi mỏ ngoài đời. */
function rollGrade(r: number): number {
  if (r < NODE_GRADE_CHANCE[3]) return 3;
  if (r < NODE_GRADE_CHANCE[3] + NODE_GRADE_CHANCE[2]) return 2;
  return 1;
}

/** Loại địa hình mà một tài nguyên được phép bao phủ. */
function resourceTerrains(res: string): Set<LocalTerrain> {
  const zone = zoneForResource(res);
  const rows: Record<ResourceZoneType, LocalTerrain[]> = {
    "Rừng Rậm": ["Rừng Rậm"],
    "Khoáng Sản": ["Đồi Núi", "Hẻm Núi", "Sa Mạc", "Tuyết/Băng Giá"],
    "Sông Hồ": ["Sông/Lối Vượt Sông", "Đầm Lầy"],
    "Biển Cả": ["Biển"],
  };
  return new Set(rows[zone]);
}

/**
 * Dựng biên phân vùng theo tia, dừng ngay khi gặp địa hình không phù hợp, nước,
 * sân thành hoặc mép lưới. Kết quả là một đa giác địa mạo thay vì hình tròn.
 */
export function resourceCoverage(
  map: LocalTerrainMap,
  res: string,
  x: number,
  y: number,
  radius: number,
  salt = 0,
  walls?: WallLine[],
): Array<{ x: number; y: number }> {
  const allowed = resourceTerrains(res);
  const waterZone = ["Sông Hồ", "Biển Cả"].includes(zoneForResource(res));
  const centreTerrain = terrainAtCell(map, x, y);
  if (allowed.size === 0) allowed.add(centreTerrain);
  const points: Array<{ x: number; y: number }> = [];
  const rays = 36;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const wobble = 0.84 + 0.16 * Math.sin(i * 2.37 + salt * 0.017)
      + 0.08 * Math.cos(i * 4.11 + salt * 0.031);
    const target = Math.max(LOCAL_BLOCK_CELLS * 0.45, radius * wobble);
    // Nếu ngay mẫu đầu đã chạm sân thành/tường thì tia co về đúng tâm, tuyệt
    // đối không đẩy một đỉnh mặc định xuyên qua vùng cấm.
    let last = 0;
    const firstSample = waterZone ? 3 : LOCAL_BLOCK_CELLS * 0.35;
    const sampleStep = waterZone ? 3 : LOCAL_BLOCK_CELLS / 4;
    for (let d = firstSample; d <= target; d += sampleStep) {
      const px = x + Math.cos(angle) * d;
      const py = y + Math.sin(angle) * d;
      if (px < 4 || py < 4 || px >= LOCAL_GRID_CELLS - 4 || py >= LOCAL_GRID_CELLS - 4) break;
      if (overlapsKeepReserve(px, py, 5) || overlapsWallReserve(walls, px, py, 5)) break;
      if (!waterZone && isWater(terrainAtCell(map, px, py))) break;
      if (!allowed.has(terrainAtCell(map, px, py))) break;
      last = d;
    }
    points.push({ x: Math.round(x + Math.cos(angle) * last), y: Math.round(y + Math.sin(angle) * last) });
  }
  return points;
}

function makeNode(
  id: string,
  res: string,
  x: number,
  y: number,
  grade: number,
  size: number,
  coverage: Array<{ x: number; y: number }> = [],
): ResourceNode {
  const zone = zoneForResource(res);
  return {
    "Mã": id,
    "Tài Nguyên": zone,
    "Thành Phần": { ...RESOURCE_ZONE_COMPOSITION[zone] },
    "Trữ Lượng": grade,
    "Còn Lại": gradeReserve(grade),
    "Tọa Độ X": Math.round(x),
    "Tọa Độ Y": Math.round(y),
    "Kích Thước": size,
    "Vùng Bao Phủ": coverage,
    "Đã Khám Phá": true,
    "Công Trình": "",
    "Công Trình Khai Thác": [],
    "Mô Tả": `${NODE_GRADE_LABEL[grade]} — vùng ${zone}`,
  };
}

/** Chọn loại tài nguyên theo trọng số địa hình; mỗi ô đất có một điểm tiềm năng. */
function pickResource(table: NodeChance[], rnd: () => number): string | null {
  let roll = rnd();
  for (const row of table) {
    if (roll < row.p) return row.res;
    roll -= row.p;
  }
  return null;
}

/**
 * Chọn cố định theo seed từ toàn bộ ứng viên thay vì lấy `slice` đầu danh sách.
 * Nhờ vậy 200 điểm còn lại rải khắp bốn phía thành, không dồn vào các hàng bắc.
 */
function spreadAcrossMap(nodes: ResourceNode[], limit: number, seed: number): ResourceNode[] {
  if (nodes.length <= limit) return nodes;
  const rnd = mulberry32(seed ^ 0x6a09e667);
  const ranked = nodes.map((node) => ({ node, rank: rnd() })).sort((a, b) => a.rank - b.rank);
  const selected = new Set(ranked.slice(0, limit).map(({ node }) => node["Mã"]));
  return nodes.filter((node) => selected.has(node["Mã"]));
}

type CoveragePoint = { x: number; y: number };

/** Cắt một đa giác theo nửa mặt phẳng thuộc về tâm `owner` trong ô Voronoi. */
function clipCoverageToNearestCentre(
  polygon: CoveragePoint[],
  owner: ResourceNode,
  other: ResourceNode,
  gap: number,
): CoveragePoint[] {
  if (polygon.length < 3) return polygon;
  const ax = owner["Tọa Độ X"];
  const ay = owner["Tọa Độ Y"];
  const bx = other["Tọa Độ X"];
  const by = other["Tọa Độ Y"];
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.001) return [];

  const nx = dx / distance;
  const ny = dy / distance;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  // Mỗi phía lùi nửa khe khỏi trung tuyến nên hai vùng không chỉ hết chồng mà
  // còn có một dải địa hình tự nhiên rất nhỏ nằm giữa chúng.
  const limit = -gap / 2;
  const signed = (point: CoveragePoint) => (point.x - mx) * nx + (point.y - my) * ny;
  const inside = (point: CoveragePoint) => signed(point) <= limit + 1e-7;
  const output: CoveragePoint[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const startInside = inside(start);
    const endInside = inside(end);
    if (startInside && endInside) {
      output.push(end);
      continue;
    }
    if (startInside === endInside) continue;
    const startSigned = signed(start);
    const endSigned = signed(end);
    const denominator = endSigned - startSigned;
    const t = Math.abs(denominator) < 1e-9 ? 0 : (limit - startSigned) / denominator;
    const intersection = {
      x: start.x + (end.x - start.x) * Math.max(0, Math.min(1, t)),
      y: start.y + (end.y - start.y) * Math.max(0, Math.min(1, t)),
    };
    if (startInside) output.push(intersection);
    else output.push(intersection, end);
  }
  return output;
}

/**
 * Phân vùng bao phủ theo mô hình Voronoi có khe: mỗi điểm trên đa giác chỉ
 * thuộc vùng có tâm gần nhất. Vì vậy hai vùng không thể đè lên nhau, kể cả khi
 * đều là vùng cấp 3 có bán kính mục tiêu rất lớn.
 */
export function partitionResourceCoverages(nodes: ResourceNode[], gap = 8): ResourceNode[] {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let polygon = [...(node["Vùng Bao Phủ"] ?? [])];
    for (let j = 0; j < nodes.length && polygon.length >= 3; j++) {
      if (i === j) continue;
      const other = nodes[j];
      const centreDistance = Math.hypot(
        other["Tọa Độ X"] - node["Tọa Độ X"],
        other["Tọa Độ Y"] - node["Tọa Độ Y"],
      );
      if (centreDistance > node["Kích Thước"] * 2 + other["Kích Thước"] * 2 + gap) continue;
      polygon = clipCoverageToNearestCentre(polygon, node, other, gap);
    }
    const rounded = polygon.map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) }));
    // Ba điểm trùng nhau giữ renderer ở chế độ đa giác rỗng, tránh fallback về
    // vòng tròn lớn có thể chồng lên vùng bên cạnh.
    node["Vùng Bao Phủ"] = rounded.length >= 3
      ? rounded
      : Array.from({ length: 3 }, () => ({ x: node["Tọa Độ X"], y: node["Tọa Độ Y"] }));
  }
  return nodes;
}

/**
 * SINH toàn bộ điểm tài nguyên của một lãnh địa từ bản đồ địa hình. Tất định
 * theo hạt giống: cùng lãnh địa → cùng bản đồ mỏ, ván nào cũng vậy.
 */
export function generateNodes(map: LocalTerrainMap): ResourceNode[] {
  const rnd = mulberry32(map.seed ^ 0x9e3779b9);
  const out: ResourceNode[] = [];
  // Mỗi điểm đại diện một VÙNG địa mạo, không phải một chấm trên từng khối 300 m.
  const step = LOCAL_BLOCK_CELLS * 2;
  const slots = Math.floor(LOCAL_GRID_CELLS / step);

  for (let sy = 0; sy < slots; sy++) {
    for (let sx = 0; sx < slots; sx++) {
      // rải kiểu jitter grid → phân bố đều mà không thành hàng lối
      const x = Math.floor((sx + 0.18 + rnd() * 0.64) * step);
      const y = Math.floor((sy + 0.18 + rnd() * 0.64) * step);
      if (overlapsKeepReserve(x, y, 16)) continue;
      const t = terrainAtCell(map, x, y);
      if (isWater(t)) continue;

      const table = NODE_TABLE[t];
      if (!table || table.length === 0) continue;

      // một lần gieo, chọn theo dải xác suất cộng dồn
      const picked = pickResource(table, rnd);
      if (!picked) continue;
      const grade = rollGrade(rnd());
      const size = Math.round(NODE_GRADE_RADIUS[grade] * (0.9 + rnd() * 0.2));
      out.push(makeNode(
        `nd-${sx}-${sy}`, picked, x, y, grade, size,
        resourceCoverage(map, picked, x, y, size, map.seed + sx * 31 + sy * 67),
      ));
    }
  }

  // Biển và sông là vùng tài nguyên thực nằm trên mặt nước; công trình khai thác
  // chỉ cần đặt ở bờ, sát biên vùng.
  if (map.coastal) {
    let placed = 0;
    for (let a = 0; a < 24 && placed < 2; a++) {
      const ang = (a / 24) * Math.PI * 2;
      for (let d = LOCAL_CENTER_CELL * 0.3; d < LOCAL_CENTER_CELL * 0.95; d += 24) {
        const x = LOCAL_CENTER_CELL + Math.cos(ang) * d;
        const y = LOCAL_CENTER_CELL + Math.sin(ang) * d;
        if (x < 0 || y < 0 || x >= LOCAL_GRID_CELLS || y >= LOCAL_GRID_CELLS) break;
        if (terrainAtCell(map, x, y) !== "Biển") continue;
        // xác nhận đây thực sự là đường bờ, rồi giữ tâm vùng ở phía biển
        const bx = LOCAL_CENTER_CELL + Math.cos(ang) * (d - 26);
        const by = LOCAL_CENTER_CELL + Math.sin(ang) * (d - 26);
        if (isWater(terrainAtCell(map, bx, by))) break;
        if (overlapsKeepReserve(bx, by, 10)) continue;
        const grade = rollGrade(rnd());
        const size = NODE_GRADE_RADIUS[grade];
        out.push(makeNode(`nd-sea-${a}`, "Biển Cả", x, y, grade, size, resourceCoverage(map, "Biển Cả", x, y, size, a)));
        placed++;
        break;
      }
    }
  }
  for (let i = 24; i < map.river.length - 1; i += 70) {
    const p = map.river[i];
    if (overlapsKeepReserve(p.x, p.y, 9)) continue;
    const grade = rollGrade(rnd());
    const size = NODE_GRADE_RADIUS[grade];
    out.push(makeNode(
      `nd-river-${i}`, "Sông Hồ", p.x, p.y, grade, size,
      resourceCoverage(map, "Sông Hồ", p.x, p.y, size, i),
    ));
  }

  return partitionResourceCoverages(spreadAcrossMap(out, RESOURCE_NODE_LIMIT, map.seed));
}

/** Có chỗ trống cho một điểm mới quanh đây không (không đè lên điểm sẵn có). */
function farEnough(nodes: ResourceNode[], x: number, y: number, gap = 45, walls?: WallLine[]): boolean {
  return !overlapsReservedGround(walls, x, y, 10)
    && !nodes.some((n) => Math.hypot(n["Tọa Độ X"] - x, n["Tọa Độ Y"] - y) < gap);
}

/** Đẩy một điểm mỏ cũ ra khỏi sân thành hoặc hành lang tường, giữ nguyên mã và trữ lượng của nó. */
function relocateOutsideReserve(
  node: ResourceNode,
  map: LocalTerrainMap,
  occupied: ResourceNode[],
  walls?: WallLine[],
): ResourceNode {
  if (!overlapsReservedGround(walls, node["Tọa Độ X"], node["Tọa Độ Y"], 10)) return node;
  const waterZone = ["Sông Hồ", "Biển Cả"].includes(zoneForResource(node["Tài Nguyên"]));

  let hash = 0;
  for (let i = 0; i < node["Mã"].length; i++) hash = (hash * 31 + node["Mã"].charCodeAt(i)) >>> 0;
  const baseAngle = ((hash % 360) * Math.PI) / 180;
  // Bắt đầu từ vị trí cũ để một mỏ bị tuyến tường mới cắt qua chỉ lùi ra cạnh
  // gần nhất, thay vì nhảy vô cớ sang nửa kia lãnh địa.
  for (let radius = 24; radius < LOCAL_CENTER_CELL * 0.8; radius += 24) {
    for (let turn = 0; turn < 16; turn++) {
      const angle = baseAngle + (turn / 16) * Math.PI * 2;
      const x = Math.round(node["Tọa Độ X"] + Math.cos(angle) * radius);
      const y = Math.round(node["Tọa Độ Y"] + Math.sin(angle) * radius);
      if (x < 20 || y < 20 || x >= LOCAL_GRID_CELLS - 20 || y >= LOCAL_GRID_CELLS - 20) continue;
      if (isWater(terrainAtCell(map, x, y)) !== waterZone || !farEnough(occupied, x, y, 36, walls)) continue;
      return { ...node, "Tọa Độ X": x, "Tọa Độ Y": y };
    }
  }
  // Không có chỗ an toàn thì bỏ điểm khỏi tâm thành thay vì để hai thực thể đè nhau.
  return { ...node, "Tọa Độ X": 0, "Tọa Độ Y": 0, "Trữ Lượng": 0, "Còn Lại": 0, "Mô Tả": "Cạn kiệt — vị trí cũ nằm trong sân thành" };
}

/**
 * BẢO ĐẢM LỜI KỂ ĐÚNG VỚI BẢN ĐỒ: mỗi tài nguyên được nhắc tên trong
 * "Gợi Ý Địa Thế" phải có ít nhất một điểm trên lưới. Nếu thuật toán chưa gieo
 * ra thì cắm thêm một điểm ở khoảnh đất hợp lý gần nhất.
 */
export function honourTerrainHints(
  nodes: ResourceNode[],
  map: LocalTerrainMap,
  wanted: string[],
  walls?: WallLine[],
): ResourceNode[] {
  if (wanted.length === 0) return nodes;
  const out = [...nodes];
  const rnd = mulberry32(map.seed ^ 0x51ed270b);

  for (const res of wanted) {
    if (!res) continue;
    if (out.some((n) => nodeContainsResource(n, res))) continue;

    const zone = zoneForResource(res);
    const wantsWater = ["Sông Hồ", "Biển Cả"].includes(zone);

    // Chỉ nhận đúng địa hình mà loại vùng này vốn tồn tại. Không ép một khu
    // rừng lên đồng bằng hay một mỏ khoáng giữa đất canh tác chỉ để chiều lời kể.
    let best: [number, number] | null = null;
    for (let attempt = 0; attempt < 400 && !best; attempt++) {
      const ang = rnd() * Math.PI * 2;
      const dist = 120 + rnd() * (LOCAL_CENTER_CELL * 0.8);
      const x = LOCAL_CENTER_CELL + Math.cos(ang) * dist;
      const y = LOCAL_CENTER_CELL + Math.sin(ang) * dist;
      if (x < 20 || y < 20 || x >= LOCAL_GRID_CELLS - 20 || y >= LOCAL_GRID_CELLS - 20) continue;
      if (overlapsReservedGround(walls, x, y, 10)) continue;
      const t = terrainAtCell(map, x, y);
      if (isWater(t) !== wantsWater) continue;
      if (!farEnough(out, x, y, 45, walls)) continue;
      if (resourceTerrains(zone).has(t)) best = [x, y];
    }
    const spot = best;
    if (!spot) continue;
    const grade = best ? 2 : 1;
    const size = NODE_GRADE_RADIUS[grade];
    out.push(makeNode(
      `nd-lore-${res}-${out.length}`, zone, spot[0], spot[1], grade, size,
      resourceCoverage(map, zone, spot[0], spot[1], size, out.length, walls),
    ));
  }
  return out;
}

/**
 * Bảo đảm lãnh địa đã có bảng điểm tài nguyên TRONG STATE. Idempotent: chạy lại
 * không sinh trùng. Gọi lúc tạo ván, lúc nạp save cũ, và mỗi khi mở Tầng 1.
 * MUTATE holding.
 */
/** Giữ mạch đang được khai thác, rồi giữ tối đa số điểm đại diện còn lại. */
function capResourceNodes(nodes: ResourceNode[]): ResourceNode[] {
  if (nodes.length <= RESOURCE_NODE_LIMIT) return nodes;
  // Mạch do lore/AI yêu cầu cũng quan trọng như mạch đã khai thác: nếu cắt nó
  // ngay sau honourTerrainHints thì lời kể vừa được chấp nhận sẽ không bao giờ
  // xuất hiện trên bản đồ. Giữ toàn bộ các mạch có trạng thái thật trước rồi
  // mới lấy mẫu nền còn lại.
  const preserved = nodes.filter(mustPreserveNode);
  const dormant = nodes.filter((node) => !mustPreserveNode(node));
  return [...preserved, ...dormant].slice(0, Math.max(RESOURCE_NODE_LIMIT, preserved.length));
}

/**
 * Save cũ có thể đặt vùng Rừng Rậm giữa Đồng Bằng vì bảng sinh đời trước cho
 * phép hai loại này trộn nhau. Dời vùng chưa khai thác tới mảng địa hình đúng
 * gần nhất; nếu bản đồ hoàn toàn không có địa hình đó thì bỏ vùng sai thay vì
 * để lại một tài nguyên không thể xây công trình.
 */
function relocateToSuitableTerrain(
  node: ResourceNode,
  map: LocalTerrainMap,
  occupied: ResourceNode[],
  walls?: WallLine[],
): ResourceNode | null {
  const allowed = resourceTerrains(node["Tài Nguyên"]);
  if (allowed.has(terrainAtCell(map, node["Tọa Độ X"], node["Tọa Độ Y"]))) return node;
  if (nodeWorkers(node).length > 0) return node;

  let best: { x: number; y: number; distance: number } | null = null;
  const step = Math.max(12, Math.round(LOCAL_BLOCK_CELLS / 3));
  for (let y = 20; y < LOCAL_GRID_CELLS - 20; y += step) {
    for (let x = 20; x < LOCAL_GRID_CELLS - 20; x += step) {
      if (!allowed.has(terrainAtCell(map, x, y))) continue;
      if (!farEnough(occupied, x, y, 28, walls)) continue;
      const distance = Math.hypot(x - node["Tọa Độ X"], y - node["Tọa Độ Y"]);
      if (!best || distance < best.distance) best = { x, y, distance };
    }
  }
  return best ? { ...node, "Tọa Độ X": best.x, "Tọa Độ Y": best.y } : null;
}

/** Mạch đã xây, đã khai thác, hoặc do lore bổ sung phải giữ nguyên khi tái cân bằng. */
function mustPreserveNode(node: ResourceNode): boolean {
  return node["Trữ Lượng"] <= 0
    || nodeWorkers(node).length > 0
    || node["Còn Lại"] < gradeReserve(node["Trữ Lượng"])
    || node["Mã"].startsWith("nd-lore-");
}

export function ensureResourceNodes(holding: Holding, map: LocalTerrainMap): ResourceNode[] {
  const existing = holding["Điểm Tài Nguyên"] ?? [];
  const hints = holding["Gợi Ý Địa Thế"]?.["Tài Nguyên Sẵn Có"] ?? [];
  const walls = holding["Tường Thành"];
  const baseline = generateNodes(map);

  // Những save có ít hơn mật độ mới thường chứa các điểm nguyên vẹn bị cắt ở
  // các hàng phía bắc. Thay chúng bằng mẫu toàn bản đồ; chỉ giữ mạch đã có
  // trạng thái chơi thật để không mất công trình hay trữ lượng đã khai thác.
  let nodes = existing.length > 0 && existing.length < RESOURCE_NODE_LIMIT
    ? existing.filter(mustPreserveNode)
    : (existing.length > 0 ? existing : baseline);
  const repaired: ResourceNode[] = [];
  for (const node of nodes) {
    // Di trú save cũ: giữ mã, trữ lượng và công trình, chỉ gom loại hàng hóa
    // đơn lẻ vào vùng chính tương ứng.
    const zone = zoneForResource(node["Tài Nguyên"]);
    node["Tài Nguyên"] = zone;
    node["Thành Phần"] = { ...RESOURCE_ZONE_COMPOSITION[zone] };
    const matched = relocateToSuitableTerrain(node, map, repaired, walls);
    if (matched) repaired.push(relocateOutsideReserve(matched, map, repaired, walls));
  }
  nodes = repaired;

  // Save cũ từng bị giới hạn ít mạch. Bổ sung lại các điểm nền cố định theo
  // seed, nhưng không thay/khôi phục một mạch người chơi đã khai thác cạn.
  // Kiểm tra khoảng cách sau khi đã dời mạch cũ để điểm mới cũng không đè tường.
  if (nodes.length < RESOURCE_NODE_LIMIT) {
    const known = new Set(nodes.map((node) => node["Mã"]));
    for (const candidate of baseline) {
      if (nodes.length >= RESOURCE_NODE_LIMIT) break;
      if (known.has(candidate["Mã"])) continue;
      // 200 điểm cần khoảng cách nhỏ hơn lưới cũ, nhưng vẫn lớn hơn đường kính
      // biểu tượng và luôn giữ nguyên vùng cấm của thành/tường.
      if (!farEnough(nodes, candidate["Tọa Độ X"], candidate["Tọa Độ Y"], 22, walls)) continue;
      nodes.push(candidate);
      known.add(candidate["Mã"]);
    }
  }
  nodes = honourTerrainHints(nodes, map, hints, walls);
  nodes = capResourceNodes(nodes);

  // vá dữ liệu cũ / do AI ghi thiếu
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n["Mã"]) n["Mã"] = `nd-fix-${i}`;
    const expectedRadius = NODE_GRADE_RADIUS[n["Trữ Lượng"]] ?? NODE_GRADE_RADIUS[1];
    // Save cũ dùng một biểu tượng 6–14 ô. Nâng nó thành vùng địa mạo đúng bậc.
    if (!n["Kích Thước"] || n["Kích Thước"] < expectedRadius * 0.55) n["Kích Thước"] = expectedRadius;
    n["Vùng Bao Phủ"] = resourceCoverage(
      map, n["Tài Nguyên"], n["Tọa Độ X"], n["Tọa Độ Y"], n["Kích Thước"], map.seed + i * 97, walls,
    );
    const workers = nodeWorkers(n);
    n["Công Trình Khai Thác"] = workers;
    n["Công Trình"] = workers[0] ?? "";
    if (n["Còn Lại"] <= 0 && n["Trữ Lượng"] > 0) n["Còn Lại"] = gradeReserve(n["Trữ Lượng"]);
  }

  partitionResourceCoverages(nodes);

  holding["Điểm Tài Nguyên"] = nodes;
  return nodes;
}

// ── Truy vấn & khai thác ────────────────────────────────────────────────────

/** Danh sách công trình của cả save mới lẫn save cũ, không trùng tên. */
export function nodeWorkers(node: ResourceNode): string[] {
  return [...new Set([...(node["Công Trình Khai Thác"] ?? []), node["Công Trình"]].filter(Boolean))];
}

/** Vùng bậc N nhận tối đa N công trình khai thác đồng thời. */
export function nodeCapacity(node: ResourceNode): number {
  return Math.max(0, Math.min(3, node["Trữ Lượng"]));
}

export function pointInResourceCoverage(node: ResourceNode, x: number, y: number): boolean {
  const polygon = node["Vùng Bao Phủ"] ?? [];
  if (polygon.length < 3) {
    return Math.hypot(node["Tọa Độ X"] - x, node["Tọa Độ Y"] - y) <= node["Kích Thước"];
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crossed = (a.y > y) !== (b.y > y)
      && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1) + a.x;
    if (crossed) inside = !inside;
  }
  return inside;
}

/** Diện tích bao phủ thực theo km², dùng cho sổ mạch. */
export function nodeAreaKm2(node: ResourceNode): number {
  const polygon = node["Vùng Bao Phủ"] ?? [];
  if (polygon.length < 3) {
    const radiusKm = node["Kích Thước"] * 0.005;
    return Math.PI * radiusKm * radiusKm;
  }
  let twiceArea = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twiceArea) * 25 / 2_000_000;
}

/** Điểm tài nguyên nằm dưới khuôn viên [x, y, size] (ô lưới). */
export function nodesUnder(nodes: ResourceNode[], x: number, y: number, size: number): ResourceNode[] {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const probes = [
    [cx, cy], [x, y], [x + size, y], [x, y + size], [x + size, y + size],
  ];
  return nodes.filter((n) => {
    if (probes.some(([px, py]) => pointInResourceCoverage(n, px, py))) return true;
    if (!["Sông Hồ", "Biển Cả"].includes(zoneForResource(n["Tài Nguyên"]))) return false;
    // Bến cá/ruộng muối đứng trên bờ vẫn được xem là chạm vùng nước.
    const polygon = n["Vùng Bao Phủ"] ?? [];
    return probes.some(([px, py]) => polygon.some((point, index) => (
      distanceToSegment(px, py, point, polygon[(index + 1) % polygon.length] ?? point) <= 28
    )));
  });
}

/** Điểm phù hợp nhất cho một công trình cần loại tài nguyên nào đó. */
export function bestNodeFor(
  nodes: ResourceNode[],
  wanted: string[],
  x: number,
  y: number,
  size: number,
): ResourceNode | null {
  const under = nodesUnder(nodes, x, y, size)
    .filter((n) => wanted.some((resource) => nodeContainsResource(n, resource))
      && n["Đã Khám Phá"]
      && n["Trữ Lượng"] > 0
      && nodeWorkers(n).length < nodeCapacity(n));
  if (under.length === 0) return null;
  return under.sort((a, b) => b["Trữ Lượng"] - a["Trữ Lượng"])[0];
}

/** Tìm điểm theo mã. */
export function nodeById(nodes: ResourceNode[], id: string): ResourceNode | null {
  if (!id) return null;
  return nodes.find((n) => n["Mã"] === id) ?? null;
}

/** Hệ số sản lượng của một công trình theo điểm nó đang bám. */
export function nodeMultiplier(node: ResourceNode | null): number {
  if (!node) return 1;
  return NODE_GRADE_MULT[node["Trữ Lượng"]] ?? 0;
}

/**
 * Rút trữ lượng sau một tháng khai thác. Hết trữ lượng của bậc hiện tại thì
 * TỤT một bậc — mỏ giàu thành mỏ khá, mỏ nghèo thành mỏ cạn. MUTATE node.
 */
export function depleteNode(node: ResourceNode, amount: number): void {
  if (amount <= 0 || node["Trữ Lượng"] <= 0) return;
  node["Còn Lại"] = Math.max(0, node["Còn Lại"] - amount);
  if (node["Còn Lại"] <= 0) {
    const oldGrade = node["Trữ Lượng"];
    node["Trữ Lượng"] = Math.max(0, node["Trữ Lượng"] - 1);
    node["Còn Lại"] = gradeReserve(node["Trữ Lượng"]);
    const oldRadius = NODE_GRADE_RADIUS[oldGrade] || 1;
    const newRadius = NODE_GRADE_RADIUS[node["Trữ Lượng"]] ?? NODE_GRADE_RADIUS[0];
    const ratio = Math.max(0.08, newRadius / oldRadius);
    node["Kích Thước"] = Math.max(NODE_GRADE_RADIUS[0], Math.round(node["Kích Thước"] * ratio));
    node["Vùng Bao Phủ"] = (node["Vùng Bao Phủ"] ?? []).map((point) => ({
      x: Math.round(node["Tọa Độ X"] + (point.x - node["Tọa Độ X"]) * ratio),
      y: Math.round(node["Tọa Độ Y"] + (point.y - node["Tọa Độ Y"]) * ratio),
    }));
    node["Mô Tả"] = `${NODE_GRADE_LABEL[node["Trữ Lượng"]]} — ${node["Tài Nguyên"]}`;
  }
}

/** Gắn/nhả công trình vào điểm — giữ cờ hai chiều để UI hiện đúng. */
export function bindNode(holding: Holding, buildingName: string, nodeId: string): void {
  const nodes = holding["Điểm Tài Nguyên"] ?? [];
  for (const n of nodes) {
    const workers = nodeWorkers(n).filter((name) => name !== buildingName);
    n["Công Trình Khai Thác"] = workers;
    n["Công Trình"] = workers[0] ?? "";
  }
  const node = nodeById(nodes, nodeId);
  if (node && nodeWorkers(node).length < nodeCapacity(node)) {
    const workers = [...nodeWorkers(node), buildingName];
    node["Công Trình Khai Thác"] = workers;
    node["Công Trình"] = workers[0] ?? "";
  }
  const b = holding["Công Trình"]?.[buildingName];
  if (b) b["Điểm Tài Nguyên"] = node && nodeWorkers(node).includes(buildingName) ? nodeId : "";
}

/** Tóm tắt một dòng cho AI đọc / UI hiện. */
export function describeNode(n: ResourceNode): string {
  const state = n["Trữ Lượng"] <= 0 ? "đã cạn" : NODE_GRADE_LABEL[n["Trữ Lượng"]].toLowerCase();
  const workers = nodeWorkers(n);
  const worked = workers.length > 0 ? `, đang khai thác bởi ${workers.join(", ")}` : ", chưa ai động tới";
  return `${n["Tài Nguyên"]} (${state}, ${nodeAreaKm2(n).toFixed(2)} km²) tại ô (${n["Tọa Độ X"]}, ${n["Tọa Độ Y"]})${worked}`;
}
