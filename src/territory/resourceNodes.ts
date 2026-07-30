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
export const RESOURCE_NODE_LIMIT = 200;

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
  return Math.max(0, grade) * 5200 + (grade > 0 ? 1800 : 0);
}

/** Một dòng trong bảng xác suất: gặp địa hình này thì có `p` cơ hội ra `res`. */
interface NodeChance {
  res: string;
  p: number;
}

/**
 * BẢNG XÁC SUẤT SINH ĐIỂM THEO ĐỊA HÌNH. Tổng p của mỗi địa hình chính là xác
 * suất một khoảnh đất loại đó có mỏ; phần còn lại là đất trống.
 */
export const NODE_TABLE: Partial<Record<LocalTerrain, NodeChance[]>> = {
  "Rừng Rậm": [
    { res: "Gỗ", p: 0.5 },
    { res: "Thảo Dược", p: 0.08 },
    { res: "Da Thú", p: 0.07 },
    { res: "Sáp Ong", p: 0.04 },
  ],
  "Đồi Núi": [
    { res: "Đá", p: 0.26 },
    { res: "Quặng Sắt", p: 0.2 },
    { res: "Than Đá", p: 0.14 },
    { res: "Đồng", p: 0.06 },
    { res: "Thiếc", p: 0.035 },
  ],
  "Hẻm Núi": [
    { res: "Đá", p: 0.26 },
    { res: "Quặng Sắt", p: 0.16 },
    { res: "Than Đá", p: 0.09 },
    { res: "Hắc Diện Thạch", p: 0.025 },
  ],
  "Đầm Lầy": [
    { res: "Thảo Dược", p: 0.14 },
    { res: "Lanh", p: 0.1 },
    { res: "Than Đá", p: 0.07 },
  ],
  "Đồng Bằng": [
    { res: "Lương Thực", p: 0.16 },
    { res: "Lanh", p: 0.07 },
    { res: "Đá", p: 0.04 },
  ],
  "Sa Mạc": [
    { res: "Muối", p: 0.16 },
    { res: "Đồng", p: 0.06 },
    { res: "Đá", p: 0.05 },
  ],
  "Tuyết/Băng Giá": [
    { res: "Da Thú", p: 0.13 },
    { res: "Gỗ", p: 0.11 },
    { res: "Quặng Sắt", p: 0.06 },
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
  if (r < 0.14) return 3;
  if (r < 0.58) return 2;
  return 1;
}

function makeNode(id: string, res: string, x: number, y: number, grade: number, size: number): ResourceNode {
  return {
    "Mã": id,
    "Tài Nguyên": res,
    "Trữ Lượng": grade,
    "Còn Lại": gradeReserve(grade),
    "Tọa Độ X": Math.round(x),
    "Tọa Độ Y": Math.round(y),
    "Kích Thước": size,
    "Đã Khám Phá": true,
    "Công Trình": "",
    "Mô Tả": `${NODE_GRADE_LABEL[grade]} — ${res}`,
  };
}

/** Chọn loại tài nguyên theo trọng số địa hình; mỗi ô đất có một điểm tiềm năng. */
function pickResource(table: NodeChance[], rnd: () => number): string {
  const total = table.reduce((sum, row) => sum + row.p, 0);
  let roll = rnd() * total;
  for (const row of table) {
    if (roll < row.p) return row.res;
    roll -= row.p;
  }
  return table[table.length - 1].res;
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

/**
 * SINH toàn bộ điểm tài nguyên của một lãnh địa từ bản đồ địa hình. Tất định
 * theo hạt giống: cùng lãnh địa → cùng bản đồ mỏ, ván nào cũng vậy.
 */
export function generateNodes(map: LocalTerrainMap): ResourceNode[] {
  const rnd = mulberry32(map.seed ^ 0x9e3779b9);
  const out: ResourceNode[] = [];
  const step = LOCAL_BLOCK_CELLS;
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
      const grade = rollGrade(rnd());
      const size = 6 + Math.floor(rnd() * 5) + grade * 2;
      out.push(makeNode(`nd-${sx}-${sy}`, picked, x, y, grade, size));
    }
  }

  // Bờ biển và bờ sông: ruộng muối và bãi cá — bám mép nước chứ không giữa lòng.
  if (map.coastal) {
    let placed = 0;
    for (let a = 0; a < 24 && placed < 2; a++) {
      const ang = (a / 24) * Math.PI * 2;
      for (let d = LOCAL_CENTER_CELL * 0.3; d < LOCAL_CENTER_CELL * 0.95; d += 24) {
        const x = LOCAL_CENTER_CELL + Math.cos(ang) * d;
        const y = LOCAL_CENTER_CELL + Math.sin(ang) * d;
        if (x < 0 || y < 0 || x >= LOCAL_GRID_CELLS || y >= LOCAL_GRID_CELLS) break;
        if (terrainAtCell(map, x, y) !== "Biển") continue;
        // lùi vào bờ một chút
        const bx = LOCAL_CENTER_CELL + Math.cos(ang) * (d - 26);
        const by = LOCAL_CENTER_CELL + Math.sin(ang) * (d - 26);
        if (isWater(terrainAtCell(map, bx, by))) break;
        if (overlapsKeepReserve(bx, by, 10)) continue;
        out.push(makeNode(`nd-sea-${a}`, placed === 0 ? "Muối" : "Cá Khô", bx, by, 2, 10));
        placed++;
        break;
      }
    }
  }
  for (let i = 24; i < map.river.length - 1; i += 70) {
    const p = map.river[i];
    const q = map.river[i + 1];
    const ang = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
    const off = p.w / 2 + 14;
    for (const side of [1, -1]) {
      const x = Math.round(p.x + Math.cos(ang) * off * side);
      const y = Math.round(p.y + Math.sin(ang) * off * side);
      if (x < 0 || y < 0 || x >= LOCAL_GRID_CELLS || y >= LOCAL_GRID_CELLS) continue;
      if (isWater(terrainAtCell(map, x, y))) continue;
      if (overlapsKeepReserve(x, y, 9)) continue;
      out.push(makeNode(`nd-river-${i}`, "Cá Khô", x, y, 2, 9));
      break;
    }
  }

  return spreadAcrossMap(out, RESOURCE_NODE_LIMIT, map.seed);
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
  if (!overlapsReservedGround(walls, node["Tọa Độ X"], node["Tọa Độ Y"], node["Kích Thước"])) return node;

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
      if (isWater(terrainAtCell(map, x, y)) || !farEnough(occupied, x, y, 36, walls)) continue;
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
    if (out.some((n) => n["Tài Nguyên"] === res)) continue;

    // ưu tiên khoảnh đất mà loại tài nguyên này VỐN mọc được; không có thì lấy
    // bất cứ chỗ khô ráo nào — lời kể đã nói là có thì phải có.
    let best: [number, number] | null = null;
    let fallback: [number, number] | null = null;
    for (let attempt = 0; attempt < 400 && !best; attempt++) {
      const ang = rnd() * Math.PI * 2;
      const dist = 120 + rnd() * (LOCAL_CENTER_CELL * 0.8);
      const x = LOCAL_CENTER_CELL + Math.cos(ang) * dist;
      const y = LOCAL_CENTER_CELL + Math.sin(ang) * dist;
      if (x < 20 || y < 20 || x >= LOCAL_GRID_CELLS - 20 || y >= LOCAL_GRID_CELLS - 20) continue;
      if (overlapsReservedGround(walls, x, y, 10)) continue;
      const t = terrainAtCell(map, x, y);
      if (isWater(t)) continue;
      if (!farEnough(out, x, y, 45, walls)) continue;
      if (!fallback) fallback = [x, y];
      if (NODE_TABLE[t]?.some((row) => row.res === res)) best = [x, y];
    }
    const spot = best ?? fallback;
    if (!spot) continue;
    out.push(makeNode(`nd-lore-${res}-${out.length}`, res, spot[0], spot[1], best ? 2 : 1, 10));
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

/** Mạch đã xây, đã khai thác, hoặc do lore bổ sung phải giữ nguyên khi tái cân bằng. */
function mustPreserveNode(node: ResourceNode): boolean {
  return node["Trữ Lượng"] <= 0
    || !!node["Công Trình"]
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
  for (const node of nodes) repaired.push(relocateOutsideReserve(node, map, repaired, walls));
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
    if (!n["Kích Thước"] || n["Kích Thước"] < 3) n["Kích Thước"] = 8;
    if (n["Còn Lại"] <= 0 && n["Trữ Lượng"] > 0) n["Còn Lại"] = gradeReserve(n["Trữ Lượng"]);
  }

  holding["Điểm Tài Nguyên"] = nodes;
  return nodes;
}

// ── Truy vấn & khai thác ────────────────────────────────────────────────────

/** Điểm tài nguyên nằm dưới khuôn viên [x, y, size] (ô lưới). */
export function nodesUnder(nodes: ResourceNode[], x: number, y: number, size: number): ResourceNode[] {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const reach = size / 2;
  return nodes.filter((n) => {
    const d = Math.hypot(n["Tọa Độ X"] - cx, n["Tọa Độ Y"] - cy);
    return d <= reach + n["Kích Thước"];
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
    .filter((n) => wanted.includes(n["Tài Nguyên"]) && n["Đã Khám Phá"]);
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
    node["Trữ Lượng"] = Math.max(0, node["Trữ Lượng"] - 1);
    node["Còn Lại"] = gradeReserve(node["Trữ Lượng"]);
    node["Mô Tả"] = `${NODE_GRADE_LABEL[node["Trữ Lượng"]]} — ${node["Tài Nguyên"]}`;
  }
}

/** Gắn/nhả công trình vào điểm — giữ cờ hai chiều để UI hiện đúng. */
export function bindNode(holding: Holding, buildingName: string, nodeId: string): void {
  const nodes = holding["Điểm Tài Nguyên"] ?? [];
  for (const n of nodes) {
    if (n["Công Trình"] === buildingName) n["Công Trình"] = "";
  }
  const node = nodeById(nodes, nodeId);
  if (node) node["Công Trình"] = buildingName;
  const b = holding["Công Trình"]?.[buildingName];
  if (b) b["Điểm Tài Nguyên"] = node ? nodeId : "";
}

/** Tóm tắt một dòng cho AI đọc / UI hiện. */
export function describeNode(n: ResourceNode): string {
  const state = n["Trữ Lượng"] <= 0 ? "đã cạn" : NODE_GRADE_LABEL[n["Trữ Lượng"]].toLowerCase();
  const worked = n["Công Trình"] ? `, đang khai thác bởi ${n["Công Trình"]}` : ", chưa ai động tới";
  return `${n["Tài Nguyên"]} (${state}) tại ô (${n["Tọa Độ X"]}, ${n["Tọa Độ Y"]})${worked}`;
}
