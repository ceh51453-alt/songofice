/**
 * localMap — ENGINE TẦNG 1 (Bản Đồ Lãnh Địa, lưới 5 m).
 *
 * Tầng 1 là tầng dữ liệu GỐC của hệ đa tầng: mọi công trình/dân cư/tài nguyên
 * đều được đặt ở đây, Tầng 2 và Tầng 3 chỉ là bản tổng hợp (mapAggregate.ts).
 * File này giữ 3 việc thuần hàm:
 *   1. neo lãnh địa vào toạ độ px thế giới (bảo toàn toạ độ giữa các tầng),
 *   2. kiểm tra một công trình có ĐẶT ĐƯỢC xuống ô lưới không (biên quy hoạch,
 *      chồng lấn, địa hình đỡ bên dưới, kề nước),
 *   3. phát PatchOp khởi công — đi CHUNG một đường ống với construction.ts nên
 *      không có hai hệ xây dựng song song nữa.
 */
import type { StatData } from "../mvu/schema";
import type { BuildResult } from "./construction";
import { startConstruction, castleLevel, planningRadiusCells } from "./construction";
import { BUILDING_CATALOG, type BuildingType } from "../content/westeros/buildings";
import { isBuildable, isWater, type LocalTerrain } from "../content/westeros/terrain";
import { ensureResourceNodes, generateNodes, bestNodeFor, NODE_GRADE_LABEL } from "./resourceNodes";
import type { ResourceNode, CustomBuilding } from "../mvu/schema";
import { REGIONS_BY_ID, type MapRegion } from "../content/westeros/regions";
import { loreSeatFor, type LoreSeat } from "../content/westeros/loreSeats";
import { seatConstructionPlan, seatProfileFor, seatWallsFor } from "../content/westeros/seatProfiles";
import { MAP_MARKERS } from "../content/westeros/mapMarkers";
import {
  LOCAL_CENTER_CELL, LOCAL_GRID_CELLS, LOCAL_CELL_M, buildableRadiusCells,
} from "../content/westeros/mapScale";
import {
  localTerrainMap, terrainsUnder, waterNearby, type LocalTerrainMap,
} from "./localTerrain";

type Holding = StatData["Lãnh Địa"][string];

export { buildableRadiusCells, castleLevel, planningRadiusCells };

// ── Neo toạ độ: Tầng 1 ↔ Tầng 2/3 ───────────────────────────────────────────

/**
 * Điểm px trên bản đồ thế giới mà lãnh địa này toạ lạc. Ưu tiên toạ độ đã ghim
 * trong state, rồi tới địa danh cùng id/tên, rồi trọng trấn vùng, cuối cùng là
 * tâm vùng lệch đi một chút (tất định theo id) để nhiều lãnh địa không chồng nhau.
 */
export function holdingAnchor(holdingId: string, holding: Holding | undefined, region?: MapRegion | null): [number, number] {
  const pinned = holding?.["Neo Thế Giới"];
  if (pinned && (pinned.X || pinned.Y)) return [pinned.X, pinned.Y];

  const marker = MAP_MARKERS.find((m) => m.id === holdingId);
  if (marker) return [marker.x, marker.y];

  const reg = region ?? REGIONS_BY_ID[holding?.["Thuộc Vùng"] ?? ""] ?? null;
  if (reg) {
    if (holdingId === `${reg.id}-seat`) return reg.seatXY;
    const byName = MAP_MARKERS.find((m) => m.name === reg.seat);
    if (byName && holdingId === byName.id) return [byName.x, byName.y];

    // lệch tất định quanh trọng trấn
    let h = 0;
    for (let i = 0; i < holdingId.length; i++) h = (h * 31 + holdingId.charCodeAt(i)) >>> 0;
    const ang = ((h % 360) * Math.PI) / 180;
    const dist = 18 + (h % 26);
    return [reg.seatXY[0] + Math.cos(ang) * dist, reg.seatXY[1] + Math.sin(ang) * dist];
  }
  return [0, 0];
}

/**
 * Bản đồ địa hình Tầng 1 của 1 lãnh địa. Toà thành có trong tiểu thuyết thì
 * lấy địa thế CỐ ĐỊNH theo lore; còn lại tất định theo hạt giống đã gieo.
 */
export function terrainOf(holdingId: string, holding: Holding | undefined): LocalTerrainMap {
  const region = REGIONS_BY_ID[holding?.["Thuộc Vùng"] ?? ""] ?? null;
  const hint = holding?.["Gợi Ý Địa Thế"];
  return localTerrainMap(holdingId, {
    terrain: holding?.["Địa Hình"] ?? region?.terrain,
    coastal: holding?.["Ven Biển"] ?? region?.coastal,
    seed: holding?.["Hạt Giống Địa Hình"],
    lore: loreSeatFor(holdingId, holding?.["Mô Tả"]),
    region,
    hints: hint
      ? { river: hint["Gần Sông"], sea: hint["Gần Biển"], mountain: hint["Trên Núi"] }
      : undefined,
  });
}

/**
 * Bảng điểm tài nguyên của lãnh địa, đã ghi vào state (sinh lần đầu nếu chưa
 * có). Đây là nguồn chân lý DUY NHẤT cho cả bản đồ lẫn engine khai thác.
 */
export function nodesOf(holdingId: string, holding: Holding | undefined): ResourceNode[] {
  if (!holding) return [];
  return ensureResourceNodes(holding, terrainOf(holdingId, holding));
}

/** Toà thành trong lore ứng với lãnh địa này (null = thành thường). */
export function loreOf(holdingId: string, holding: Holding | undefined): LoreSeat | null {
  return loreSeatFor(holdingId, holding?.["Mô Tả"]);
}

// ── Đặt công trình ──────────────────────────────────────────────────────────

export interface PlacementCheck {
  ok: boolean;
  error?: string;
  /** địa hình dưới khuôn viên (cho UI hiện lý do). */
  terrains?: LocalTerrain[];
  /** điểm tài nguyên mà công trình sẽ bám vào (mỏ, xưởng cưa). */
  node?: ResourceNode;
}

/** 1 khuôn viên đã chiếm chỗ trên lưới. */
export interface PlacedRect {
  name: string;
  x: number;
  y: number;
  size: number;
  /** Vùng đệm quy hoạch giữa hai khuôn viên, tính theo ô 5 m. */
  clearance: number;
}

function overlaps(ax: number, ay: number, aSize: number, bx: number, by: number, bSize: number): boolean {
  return ax < bx + bSize && bx < ax + aSize && ay < by + bSize && by < ay + aSize;
}

const BUILDING_CLEARANCE_CELLS = 8;
const LANDMARK_CLEARANCE_CELLS = 10;

/**
 * Kỳ quan dùng silhouette lớn hơn footprint logic trên canvas. Khuôn quy hoạch
 * phải tính cả phần vẽ đó và khoảng thở, nếu không hai công trình "không chạm
 * ô" vẫn nhìn như đang đè lên nhau.
 */
function planningRect(type: BuildingType, x: number, y: number, landmark = type === "Công Trình Tuỳ Chỉnh"): Omit<PlacedRect, "name"> {
  const footprint = BUILDING_CATALOG[type].footprint;
  if (!landmark) return { x, y, size: footprint, clearance: BUILDING_CLEARANCE_CELLS };
  const rendered = Math.ceil(footprint * 2.45 * 1.12);
  const offset = Math.floor((rendered - footprint) / 2);
  return { x: x - offset, y: y - offset, size: rendered, clearance: LANDMARK_CLEARANCE_CELLS };
}

function rectsTooClose(candidate: Omit<PlacedRect, "name">, taken: PlacedRect): boolean {
  return overlaps(
    candidate.x - candidate.clearance,
    candidate.y - candidate.clearance,
    candidate.size + candidate.clearance * 2,
    taken.x - taken.clearance,
    taken.y - taken.clearance,
    taken.size + taken.clearance * 2,
  );
}

/** Các khuôn viên đang chiếm chỗ của 1 lãnh địa (bỏ qua công trình vành đai). */
export function occupiedRects(holding: Holding | undefined, exclude?: string): PlacedRect[] {
  const out: PlacedRect[] = [];
  for (const [name, b] of Object.entries(holding?.["Công Trình"] ?? {})) {
    if (name === exclude) continue;
    const def = BUILDING_CATALOG[b["Loại"]];
    if (def?.ring) continue;
    const rect = planningRect(b["Loại"], b["Tọa Độ X"], b["Tọa Độ Y"], !!b["Tuỳ Chỉnh"]?.["Tên"]);
    out.push({ name, ...rect });
  }
  return out;
}

/**
 * LÕI kiểm tra quy hoạch — thuần hình học + địa hình, không cần StatData nên
 * dùng được cả lúc đặt tay, lúc tự bố trí thành trì, lẫn lúc sửa save cũ.
 * Ô (x, y) là góc TRÊN-TRÁI của khuôn viên.
 */
export function checkSpot(
  map: LocalTerrainMap,
  type: BuildingType,
  x: number,
  y: number,
  taken: PlacedRect[],
  radius: number,
  nodes: ResourceNode[] = [],
  landmark = type === "Công Trình Tuỳ Chỉnh",
): PlacementCheck {
  const def = BUILDING_CATALOG[type];
  if (def.ring) return { ok: false, error: `${type} là vành đai quanh trọng trấn — không đặt lên lưới` };
  const size = def.footprint;

  // 1. biên quy hoạch — trong bán kính cho phép của Lâu Đài, và trong lưới
  const lo = LOCAL_CENTER_CELL - radius;
  const hi = LOCAL_CENTER_CELL + radius;
  if (x < lo || y < lo || x + size > hi || y + size > hi) {
    return { ok: false, error: `Ngoài vùng quy hoạch (bán kính ${radius} ô ≈ ${((radius * LOCAL_CELL_M) / 1000).toFixed(2)} km)` };
  }
  if (x < 0 || y < 0 || x + size > LOCAL_GRID_CELLS || y + size > LOCAL_GRID_CELLS) {
    return { ok: false, error: "Ngoài lưới lãnh địa" };
  }

  // 2. chồng lấn công trình sẵn có
  const candidate = planningRect(type, x, y, landmark);
  for (const r of taken) {
    if (rectsTooClose(candidate, r)) return { ok: false, error: `Chồng lên hoặc quá gần ${r.name} — cần chừa lối và khoảng trống` };
  }

  // 3. thềm địa hình bên dưới. CÔNG TRÌNH ĐẶC BIỆT (nhà sàn, đê chắn sóng,
  //    pháo đài vách đá, cầu đá) được miễn luật này ĐÚNG trên những loại đất mà
  //    chúng khai trong `overrideTerrain` — đó là cả lý do tồn tại của chúng.
  const terrains = terrainsUnder(map, x, y, size);
  const allowed = (t: LocalTerrain) => !!def.overrideTerrain?.includes(t);

  const wet = terrains.find((t) => isWater(t) && !allowed(t));
  if (wet) return { ok: false, error: `Không xây được trên ${wet === "Biển" ? "mặt biển" : "lòng sông"}`, terrains };
  const blocked = terrains.find((t) => !isBuildable(t) && !allowed(t));
  if (blocked) return { ok: false, error: `Địa hình ${blocked} không chịu được công trình`, terrains };
  if (def.terrain) {
    const bad = terrains.find((t) => !def.terrain!.includes(t));
    if (bad) return { ok: false, error: `${type} cần ${def.terrain.join(" / ")} — ô này là ${bad}`, terrains };
  }
  // công trình đặc biệt PHẢI dùng đúng chỗ khó — dựng nhà sàn giữa đồng bằng
  // thì chỉ là căn nhà đắt tiền vô nghĩa
  if (def.overrideTerrain && !terrains.some((t) => allowed(t))) {
    return { ok: false, error: `${type} chỉ có nghĩa khi dựng trên ${def.overrideTerrain.join(" / ")}`, terrains };
  }

  // 4. kề mặt nước (bến cảng)
  if (def.nearWater && !waterNearby(map, x, y, size, 30)) {
    return { ok: false, error: `${type} phải dựng sát mép nước`, terrains };
  }

  // 5. ĐIỂM TÀI NGUYÊN: mỏ phải nằm trên mạch. Không có mạch thì đào ra đá vụn.
  if (def.requiresNode) {
    const node = bestNodeFor(nodes, def.requiresNode, x, y, size);
    if (!node) {
      return {
        ok: false,
        error: `${type} phải dựng đè lên điểm ${def.requiresNode.join(" / ")} — chỗ này không có mạch nào`,
        terrains,
      };
    }
    if (node["Trữ Lượng"] <= 0) {
      return { ok: false, error: `Mạch ${node["Tài Nguyên"]} ở đây đã cạn kiệt`, terrains };
    }
    return { ok: true, terrains, node };
  }

  return { ok: true, terrains };
}

/** Kiểm tra đặt công trình cho 1 lãnh địa trong state. */
export function canPlace(
  state: StatData,
  territoryId: string,
  type: BuildingType,
  x: number,
  y: number,
): PlacementCheck {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding) return { ok: false, error: "Lãnh địa không tồn tại" };
  return checkSpot(
    terrainOf(territoryId, holding),
    type, x, y,
    occupiedRects(holding),
    planningRadiusCells(holding),
    nodesOf(territoryId, holding),
  );
}

/**
 * Tìm chỗ hợp lệ gần trọng trấn nhất cho 1 công trình — quét theo vòng tròn
 * loang dần ra. Tất định (góc xuất phát suy từ seed) nên bố cục thành trì không
 * đổi mỗi lần mở lại ván.
 */
export function findSpot(
  map: LocalTerrainMap,
  type: BuildingType,
  taken: PlacedRect[],
  radius: number,
  seed = 0,
  nodes: ResourceNode[] = [],
  landmark = type === "Công Trình Tuỳ Chỉnh",
): [number, number] | null {
  const def = BUILDING_CATALOG[type];
  const size = def.footprint;

  // Mỏ thì không quét vòng tròn: đi thẳng tới các mạch đã biết trong vùng quy
  // hoạch, giàu trước nghèo sau.
  if (def.requiresNode) {
    const candidates = nodes
      .filter((n) => def.requiresNode!.includes(n["Tài Nguyên"]) && n["Trữ Lượng"] > 0)
      .sort((a, b) => b["Trữ Lượng"] - a["Trữ Lượng"]);
    for (const n of candidates) {
      const x = Math.round(n["Tọa Độ X"] - size / 2);
      const y = Math.round(n["Tọa Độ Y"] - size / 2);
      if (checkSpot(map, type, x, y, taken, radius, nodes, landmark).ok) return [x, y];
    }
    return null;
  }

  const step = Math.max(6, Math.round(size / 2));
  for (let r = Math.max(size, 20); r <= radius; r += step) {
    const slots = Math.max(8, Math.round((2 * Math.PI * r) / step));
    for (let i = 0; i < slots; i++) {
      const ang = ((i + (seed % slots)) / slots) * Math.PI * 2;
      const x = Math.round(LOCAL_CENTER_CELL + Math.cos(ang) * r - size / 2);
      const y = Math.round(LOCAL_CENTER_CELL + Math.sin(ang) * r - size / 2);
      if (checkSpot(map, type, x, y, taken, radius, nodes, landmark).ok) return [x, y];
    }
  }
  return null;
}

/** Tên công trình kế tiếp cho loại này ("Nông Trại 2", "Nông Trại 3"...). */
export function nextBuildingName(holding: Holding | undefined, type: BuildingType): string {
  if (BUILDING_CATALOG[type].unique) return type;
  const existing = holding?.["Công Trình"] ?? {};
  if (!existing[type]) return type;
  for (let n = 2; n < 999; n++) {
    const name = `${type} ${n}`;
    if (!existing[name]) return name;
  }
  return `${type} ${Date.now()}`;
}

/**
 * Khởi công 1 công trình TẠI Ô (x, y). Kiểm quy hoạch trước, rồi đi qua
 * startConstruction (trừ tài nguyên + hàng đợi ngày) — một đường ống duy nhất.
 */
export function placeBuilding(
  state: StatData,
  territoryId: string,
  type: BuildingType,
  x: number,
  y: number,
  opts?: { name?: string; custom?: CustomBuilding },
): BuildResult {
  const check = canPlace(state, territoryId, type, x, y);
  if (!check.ok) return { ok: false, error: check.error, ops: [] };
  const holding = state["Lãnh Địa"][territoryId];
  const name = opts?.name?.trim() || nextBuildingName(holding, type);
  if (holding?.["Công Trình"]?.[name]) {
    return { ok: false, error: `Đã có công trình tên "${name}" ở đây`, ops: [] };
  }
  const result = startConstruction(state, territoryId, type, name, {
    x, y, nodeId: check.node?.["Mã"], custom: opts?.custom,
  });
  // ghi cờ hai chiều điểm ↔ công trình ngay sau khi ops được áp
  if (result.ok && check.node) {
    result.ops.push({
      op: "replace",
      path: `stat_data.Lãnh Địa.${territoryId}.Điểm Tài Nguyên`,
      value: (holding["Điểm Tài Nguyên"] ?? []).map((n) =>
        n["Mã"] === check.node!["Mã"] ? { ...n, "Công Trình": name } : n),
    });
  }
  return result;
}

/** Mô tả ngắn điểm tài nguyên dưới một ô — cho tooltip khi rê chuột. */
export function nodeHintAt(nodes: ResourceNode[], x: number, y: number): string | null {
  const hit = nodes.find(
    (n) => Math.hypot(n["Tọa Độ X"] - x, n["Tọa Độ Y"] - y) <= n["Kích Thước"],
  );
  if (!hit) return null;
  return `${hit["Tài Nguyên"]} · ${NODE_GRADE_LABEL[hit["Trữ Lượng"]]}`;
}

/**
 * Dựng công trình dạng vành đai (Tường Thành) — bám bán kính quy hoạch, không
 * chiếm ô lưới nào.
 */
export function placeRing(state: StatData, territoryId: string, type: BuildingType): BuildResult {
  const def = BUILDING_CATALOG[type];
  if (!def.ring) return { ok: false, error: `${type} không phải công trình vành đai`, ops: [] };
  return startConstruction(state, territoryId, type, type, { x: LOCAL_CENTER_CELL, y: LOCAL_CENTER_CELL });
}

// ── Bố trí sẵn & sửa chữa bố cục ────────────────────────────────────────────

/** Một dòng "xây sẵn n cái loại X" khi dựng thành trì lúc khởi tạo ván. */
export interface BuildPlanItem {
  type: BuildingType;
  count: number;
  level?: number;
  /** Tên lore (Red Keep, Hightower...) thay cho nhãn loại công trình chung. */
  name?: string;
  /** Đặc tả cho kỳ quan/khu dân cư/công trình không có trong catalogue gốc. */
  custom?: CustomBuilding;
  /** Vị trí quy hoạch cố định cho công trình trọng yếu, tính theo góc trên-trái. */
  at?: [number, number];
  /** Công trình tên riêng theo lore; dùng để bổ sung an toàn vào save cũ. */
  lore?: boolean;
}

/**
 * Dựng sẵn bố cục một thành trì trên lưới Tầng 1 — dùng khi tạo nhân vật canon.
 * Lâu Đài đứng giữa nền thành, phần còn lại loang ra theo địa hình cho phép.
 * Loại nào không tìm được chỗ (nông trại ở lãnh địa toàn đá) thì BỎ QUA, chứ
 * không nhét bừa lên vách núi.
 */
export function layoutHolding(
  holdingId: string,
  opts: Parameters<typeof localTerrainMap>[1],
  plan: BuildPlanItem[],
): Holding["Công Trình"] {
  const map = localTerrainMap(holdingId, opts);
  const nodes = generateNodes(map);
  const out: Holding["Công Trình"] = {};
  const taken: PlacedRect[] = [];
  let seed = 0;

  const put = (item: BuildPlanItem, level: number, x: number, y: number, index: number) => {
    const { type } = item;
    const def = BUILDING_CATALOG[type];
    const baseName = item.name ?? type;
    const name = index === 0 ? baseName : `${baseName} ${index + 1}`;
    // mỏ dựng sẵn thì bám luôn vào mạch nằm dưới nó
    const node = def.requiresNode ? bestNodeFor(nodes, def.requiresNode, x, y, def.footprint) : null;
    if (node) node["Công Trình"] = name;
    out[name] = {
      "Loại": type, "Cấp Độ": Math.max(1, level), "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Đang Phá": false, "Ngày Phá Còn Lại": 0,
      "Tọa Độ X": x, "Tọa Độ Y": y, "Kích Thước": def.footprint,
      "Điểm Tài Nguyên": node?.["Mã"] ?? "", "Nhân Lực": {}, "Vận Hành": 1,
    };
    if (item.custom) out[name]["Tuỳ Chỉnh"] = item.custom;
    if (!def.ring) taken.push({ name, ...planningRect(type, x, y, !!item.custom?.["Tên"]) });
  };

  for (const item of plan) {
    const def = BUILDING_CATALOG[item.type];
    const level = item.level ?? 1;
    for (let i = 0; i < item.count; i++) {
      if (def.ring) {
        put(item, level, LOCAL_CENTER_CELL, LOCAL_CENTER_CELL, i);
        continue;
      }
      if (item.at) {
        const [x, y] = item.at;
        if (checkSpot(map, item.type, x, y, taken, buildableRadiusCells(Math.max(level, 5)), nodes, !!item.custom?.["Tên"]).ok) {
          put(item, level, x, y, i);
          continue;
        }
      }
      if (item.type === "Lâu Đài") {
        // toà thành chính luôn ngự giữa nền thành
        const half = Math.floor(def.footprint / 2);
        put(item, level, LOCAL_CENTER_CELL - half, LOCAL_CENTER_CELL - half, i);
        continue;
      }
      const radius = buildableRadiusCells(level);
      const spot = findSpot(map, item.type, taken, radius, (seed += 7), nodes, !!item.custom?.["Tên"]);
      if (spot) put(item, level, spot[0], spot[1], i);
    }
  }
  return out;
}

/**
 * SỬA BỐ CỤC cho ván cũ / dữ liệu cốt truyện dựng theo hệ lưới trước đây: công
 * trình nằm chồng nhau, lọt ra ngoài vùng quy hoạch, hay ngồi trên mặt nước sẽ
 * được dời tới ô hợp lệ gần nhất. MUTATE state. Idempotent — chạy lại không đổi.
 */
export function repairHoldingLayout(holding: Holding, holdingId: string): number {
  const buildings = holding["Công Trình"] ?? {};
  const entries = Object.entries(buildings);
  if (entries.length === 0) return 0;

  const map = terrainOf(holdingId, holding);
  const nodes = ensureResourceNodes(holding, map);
  const radius = planningRadiusCells(holding);
  const taken: PlacedRect[] = [];
  let moved = 0;

  // Lâu Đài trước (giữ tâm), tiếp đó là kỳ quan/tên riêng đã ghim theo lore;
  // phần công trình sinh tự động sẽ tự tìm chỗ còn lại, không đẩy landmark đi.
  const ordered = entries.sort((a, b) => {
    const rank = (building: Holding["Công Trình"][string]) => (
      building["Loại"] === "Lâu Đài" ? 0 : building["Tuỳ Chỉnh"]?.["Tên"] ? 1 : 2
    );
    const ra = rank(a[1]);
    const rb = rank(b[1]);
    if (ra !== rb) return ra - rb;
    return (BUILDING_CATALOG[b[1]["Loại"]]?.footprint ?? 0) - (BUILDING_CATALOG[a[1]["Loại"]]?.footprint ?? 0);
  });

  let seed = 0;
  for (const [name, b] of ordered) {
    const def = BUILDING_CATALOG[b["Loại"]];
    if (!def) continue;
    b["Kích Thước"] = def.footprint;
    if (def.ring) {
      b["Tọa Độ X"] = LOCAL_CENTER_CELL;
      b["Tọa Độ Y"] = LOCAL_CENTER_CELL;
      continue;
    }
    if (b["Loại"] === "Lâu Đài") {
      const half = Math.floor(def.footprint / 2);
      if (b["Tọa Độ X"] !== LOCAL_CENTER_CELL - half) moved++;
      b["Tọa Độ X"] = LOCAL_CENTER_CELL - half;
      b["Tọa Độ Y"] = LOCAL_CENTER_CELL - half;
      taken.push({ name, ...planningRect(b["Loại"], b["Tọa Độ X"], b["Tọa Độ Y"], !!b["Tuỳ Chỉnh"]?.["Tên"]) });
      continue;
    }
    const landmark = !!b["Tuỳ Chỉnh"]?.["Tên"];
    if (checkSpot(map, b["Loại"], b["Tọa Độ X"], b["Tọa Độ Y"], taken, radius, nodes, landmark).ok) {
      taken.push({ name, ...planningRect(b["Loại"], b["Tọa Độ X"], b["Tọa Độ Y"], landmark) });
      continue;
    }
    const spot = findSpot(map, b["Loại"], taken, radius, (seed += 11), nodes, landmark);
    if (!spot) continue; // không còn chỗ hợp lệ → để nguyên, UI vẫn vẽ được
    b["Tọa Độ X"] = spot[0];
    b["Tọa Độ Y"] = spot[1];
    taken.push({ name, ...planningRect(b["Loại"], spot[0], spot[1], landmark) });
    moved++;
  }

  // Điểm tài nguyên có thể đã bị đẩy ra khỏi sân thành khi nâng cấp dữ liệu cũ.
  // Ràng buộc mỏ ↔ công trình phải được dựng lại từ vị trí thực tế, nếu không UI
  // sẽ chỉ vào một mạch đã không còn nằm dưới khu khai thác.
  for (const node of nodes) node["Công Trình"] = "";
  for (const [name, b] of Object.entries(buildings)) {
    const def = BUILDING_CATALOG[b["Loại"]];
    if (!def?.requiresNode) continue;
    const node = bestNodeFor(nodes, def.requiresNode, b["Tọa Độ X"], b["Tọa Độ Y"], def.footprint);
    const nextId = node?.["Mã"] ?? "";
    if (b["Điểm Tài Nguyên"] !== nextId) {
      b["Điểm Tài Nguyên"] = nextId;
      moved++;
    }
    if (node) node["Công Trình"] = name;
  }
  return moved;
}

/**
 * Chuẩn hoá TOÀN BỘ lãnh địa trong state: gắn địa hình/ven biển theo vùng rồi
 * sửa bố cục Tầng 1. Gọi lúc tạo ván và lúc nạp save cũ. MUTATE state.
 */
export function repairAllHoldings(state: StatData): number {
  let moved = 0;
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"];
  for (const [id, holding] of Object.entries(state["Lãnh Địa"])) {
    const lore = loreSeatFor(id, holding["Mô Tả"]);
    const region = REGIONS_BY_ID[holding["Thuộc Vùng"] ?? ""];
    if (lore) {
      const profile = seatProfileFor(id, eraId);
      // Toà thành trong tiểu thuyết: lấy đúng mô tả gốc. Winterfell nằm sâu
      // trong đất liền dù Phương Bắc là vùng ven biển — cờ trong state phải
      // khớp bản đồ, không thì bảng xây dựng lại mời dựng Bến Cảng.
      holding["Địa Hình"] = lore.terrain;
      holding["Ven Biển"] = lore.coastal;
      // Cấp lore là sàn cho các save cũ. Không hạ cấp thành mà người chơi đã
      // tự nâng cao hơn, nhưng mọi đại thành canon sẽ không còn bị sinh ở cấp 3
      // giống hệt một lâu đài địa phương.
      const keep = Object.values(holding["Công Trình"] ?? {}).find((b) => b["Loại"] === "Lâu Đài");
      const minimumKeepLevel = profile?.level ?? lore.level;
      if (keep && keep["Cấp Độ"] < minimumKeepLevel) {
        keep["Cấp Độ"] = minimumKeepLevel;
        moved++;
      }
      const legacyWall = Object.values(holding["Công Trình"] ?? {}).find((b) => b["Loại"] === "Tường Thành");
      const wallLevel = profile?.wallLevel ?? lore.wallLevel;
      if (legacyWall && legacyWall["Cấp Độ"] !== wallLevel) {
        legacyWall["Cấp Độ"] = wallLevel;
        moved++;
      }
      // Chỉ thay vòng tường "wall-keep" do phiên bản cũ sinh tự động. Mọi tuyến
      // người chơi đã vạch tay đều được giữ nguyên.
      const walls = holding["Tường Thành"] ?? [];
      if (profile && walls.length === 1 && walls[0]["Mã"] === "wall-keep") {
        holding["Tường Thành"] = seatWallsFor(id, eraId, Math.max(minimumKeepLevel, keep?.["Cấp Độ"] ?? 1));
        moved++;
      }
      // Save cũ được thêm các công trình lore còn thiếu, nhưng tuyệt đối không
      // đụng vào công trình có tên sẵn của người chơi.
      if (profile) {
        const allLoreSites = seatConstructionPlan(profile, lore.coastal)
          .filter((item) => !!item.lore && !!item.name);
        // Red Keep, Dragonstone, Storm's End... là chính toà thành trung tâm.
        // Bản cũ từng tạo một marker tuỳ chỉnh thứ hai cạnh Lâu Đài, vừa chồng
        // hình vừa cộng hiệu ứng hai lần. Gộp marker đó vào Lâu Đài thật.
        const corePlan = allLoreSites.find((item) => item.type === "Lâu Đài" && !!item.name && !!item.custom);
        if (corePlan?.name && corePlan.custom) {
          const legacyMarker = holding["Công Trình"][corePlan.name];
          if (legacyMarker?.["Loại"] === "Công Trình Tuỳ Chỉnh") {
            delete holding["Công Trình"][corePlan.name];
            moved++;
          }
          const currentKeep = Object.entries(holding["Công Trình"])
            .find(([, building]) => building["Loại"] === "Lâu Đài");
          if (currentKeep) {
            const [oldName, building] = currentKeep;
            const next = { ...building, "Tuỳ Chỉnh": corePlan.custom };
            if (oldName !== corePlan.name) {
              delete holding["Công Trình"][oldName];
              holding["Công Trình"][corePlan.name] = next;
              moved++;
            } else if (JSON.stringify(building["Tuỳ Chỉnh"]) !== JSON.stringify(corePlan.custom)) {
              building["Tuỳ Chỉnh"] = corePlan.custom;
              moved++;
            }
          }
        }
        // Các tên này là kỳ quan hay vệ tinh canon, không phải công trình tuỳ
        // chỉnh do người chơi đặt. Save cũ được đồng bộ hiệu ứng mới nhưng
        // không đụng các công trình vô danh/tự xây của người chơi.
        for (const item of allLoreSites) {
          const existing = item.name ? holding["Công Trình"][item.name] : undefined;
          if (!existing || existing["Loại"] !== item.type || !item.custom) continue;
          const current = existing["Tuỳ Chỉnh"];
          const next = { ...current, ...item.custom };
          if (JSON.stringify(current) !== JSON.stringify(next)) {
            existing["Tuỳ Chỉnh"] = next;
            moved++;
          }
        }
        const specialPlan = allLoreSites.filter((item) => !!item.name && !holding["Công Trình"][item.name]);
        if (specialPlan.length > 0) {
          const additions = layoutHolding(id, { terrain: lore.terrain, coastal: lore.coastal, region, lore }, specialPlan);
          Object.assign(holding["Công Trình"], additions);
          moved += Object.keys(additions).length;
        }
      }
    } else if (region) {
      if (!holding["Địa Hình"]) holding["Địa Hình"] = region.terrain;
      // ven biển là dữ kiện ĐỊA LÝ của vùng, không phải cờ đặt tay: lãnh địa
      // trong vùng giáp biển thì lưới Tầng 1 của nó cũng có mép nước.
      if (!holding["Ven Biển"] && region.coastal) holding["Ven Biển"] = true;
    }
    moved += repairHoldingLayout(holding, id);
  }
  return moved;
}

/** Công trình tại 1 ô (dùng cho click chọn trên bản đồ Tầng 1). */
export function buildingAt(holding: Holding | undefined, x: number, y: number): [string, Holding["Công Trình"][string]] | null {
  for (const entry of Object.entries(holding?.["Công Trình"] ?? {})) {
    const [, b] = entry;
    const def = BUILDING_CATALOG[b["Loại"]];
    if (def?.ring) continue;
    const size = def?.footprint ?? b["Kích Thước"] ?? 1;
    if (x >= b["Tọa Độ X"] && x < b["Tọa Độ X"] + size && y >= b["Tọa Độ Y"] && y < b["Tọa Độ Y"] + size) {
      return entry;
    }
  }
  return null;
}
