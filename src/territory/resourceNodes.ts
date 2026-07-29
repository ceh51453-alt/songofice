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
import type { StatData, ResourceNode } from "../mvu/schema";
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
      const t = terrainAtCell(map, x, y);
      if (isWater(t)) continue;

      const table = NODE_TABLE[t];
      if (!table || table.length === 0) continue;

      // một lần gieo, chọn theo dải xác suất cộng dồn
      let roll = rnd();
      let picked: string | null = null;
      for (const row of table) {
        if (roll < row.p) { picked = row.res; break; }
        roll -= row.p;
      }
      if (!picked) continue;

      const grade = rollGrade(rnd());
      const size = 8 + Math.floor(rnd() * 6) + grade * 2;
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
      out.push(makeNode(`nd-river-${i}`, "Cá Khô", x, y, 2, 9));
      break;
    }
  }

  return out;
}

/** Có chỗ trống cho một điểm mới quanh đây không (không đè lên điểm sẵn có). */
function farEnough(nodes: ResourceNode[], x: number, y: number, gap = 45): boolean {
  return !nodes.some((n) => Math.hypot(n["Tọa Độ X"] - x, n["Tọa Độ Y"] - y) < gap);
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
      const t = terrainAtCell(map, x, y);
      if (isWater(t)) continue;
      if (!farEnough(out, x, y)) continue;
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
export function ensureResourceNodes(holding: Holding, map: LocalTerrainMap): ResourceNode[] {
  const existing = holding["Điểm Tài Nguyên"] ?? [];
  const hints = holding["Gợi Ý Địa Thế"]?.["Tài Nguyên Sẵn Có"] ?? [];

  let nodes = existing.length > 0 ? existing : generateNodes(map);
  nodes = honourTerrainHints(nodes, map, hints);

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
