/**
 * walls — TƯỜNG THÀNH VẠCH TAY (M18).
 *
 * Cơ chế cũ có hai chỗ sai mà file này sửa hẳn:
 *   1. Tường là một "công trình vành đai" tự sinh quanh trọng trấn theo BÁN KÍNH
 *      QUY HOẠCH. Nâng cấp Lâu Đài là bán kính đổi, tường vẽ lại từ đầu — nhìn
 *      như mất trắng bức tường vừa xây. Giờ tường là DỮ LIỆU RIÊNG trong state,
 *      không dính gì tới cấp Lâu Đài: xây rồi là nằm đó cho tới khi bị phá.
 *   2. Người chơi không chọn được tường chạy ở đâu. Giờ vạch từng điểm một —
 *      bấm điểm đầu, bấm điểm tiếp, bấm tiếp nữa, xong thì đồng ý. Chi phí và
 *      thời gian tính theo CẤP và ĐỘ DÀI thật của tuyến vừa vạch.
 *
 * Một lãnh địa có bao nhiêu tuyến tường cũng được: luỹ ngoài, thành trong, một
 * đoạn chắn hẻm núi. Mỗi tuyến có cấp và vật liệu riêng.
 */
import type { StatData, WallLine, WallMaterial } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import type { BuildResult } from "./construction";
import { labourInUse } from "./construction";
import { analysePopulation } from "./population";
import { LABOUR_LIST, type LabourKey, type ResourceKey } from "../content/westeros/buildings";
import { LOCAL_GRID_CELLS, LOCAL_CELL_M } from "../content/westeros/mapScale";
import { isWater } from "../content/westeros/terrain";
import { terrainAtCell, type LocalTerrainMap } from "./localTerrain";
import { holdingOwnedByPlayer } from "./territoryEngine";
import { EXCHANGE_RATES } from "../economy/currency";

type Holding = StatData["Lãnh Địa"][string];

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

/** Chiều dài tối đa một tuyến (ô) — 4000 ô = 20 km, quá đủ cho một lãnh địa. */
export const MAX_WALL_CELLS = 4000;

export interface WallMaterialDef {
  id: WallMaterial;
  label: string;
  desc: string;
  /** vật tư cho MỖI Ô chiều dài, ở cấp 1. */
  perCell: Partial<Record<ResourceKey, number>>;
  /** điểm phòng thủ nền của một tuyến khép kín ở cấp 1. */
  defense: number;
  /** số ô dựng được mỗi ngày ở cấp 1 (cấp cao thì chậm hơn). */
  cellsPerDay: number;
  /** cấp tối đa vật liệu này chịu được. */
  maxLevel: number;
}

export const WALL_MATERIALS_DEF: WallMaterialDef[] = [
  {
    id: "Gỗ", label: "Luỹ Gỗ",
    desc: "Hàng cọc gỗ vót nhọn và hào đất — dựng trong một mùa, cháy trong một đêm.",
    perCell: { "Gỗ": 2.4, "Ngân Khố": 0.3 * G },
    defense: 6, cellsPerDay: 26, maxLevel: 2,
  },
  {
    id: "Đá", label: "Tường Đá",
    desc: "Đá xếp có vữa — bức tường tiêu chuẩn của mọi thành trì Westeros.",
    perCell: { "Đá": 2.6, "Gỗ": 0.5, "Ngân Khố": 0.7 * G },
    defense: 14, cellsPerDay: 16, maxLevel: 4,
  },
  {
    id: "Đá Khối", label: "Tường Đá Khối",
    desc: "Đá tảng đẽo vuông, mạch khít không lách nổi lưỡi dao — công thành phải mất nhiều tháng.",
    perCell: { "Đá": 4.2, "Thép": 0.18, "Ngân Khố": 1.5 * G },
    defense: 24, cellsPerDay: 10, maxLevel: 5,
  },
  {
    id: "Đá Đen", label: "Tường Đá Đen",
    desc: "Đá đen bóng dầu kiểu cổ — đắt tới mức chỉ vài toà thành trong lịch sử dám dựng.",
    perCell: { "Đá": 5.6, "Thép": 0.45, "Ngân Khố": 3.2 * G },
    defense: 38, cellsPerDay: 6, maxLevel: 6,
  },
];

export const WALL_MATERIAL_BY_ID: Record<string, WallMaterialDef> =
  Object.fromEntries(WALL_MATERIALS_DEF.map((m) => [m.id, m]));

export interface WallPoint { x: number; y: number }

export interface WallPlan {
  ok: boolean;
  error?: string;
  /** chiều dài tổng theo ô lưới. */
  length: number;
  /** chiều dài quy ra mét. */
  meters: number;
  /** số ô phải bắc qua mặt nước (đắt gấp bội). */
  waterCells: number;
  /** tuyến khép kín (điểm cuối chạm điểm đầu) → phòng thủ đầy đủ. */
  closed: boolean;
  cost: Partial<Record<ResourceKey, number>>;
  labour: Partial<Record<LabourKey, number>>;
  days: number;
  defense: number;
}

function segLength(a: WallPoint, b: WallPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Tổng chiều dài của một chuỗi điểm (ô lưới). */
export function wallLength(points: WallPoint[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += segLength(points[i], points[i + 1]);
  return total;
}

/** Đếm số ô tuyến đi ngang mặt nước — bắc tường qua sông đắt hơn nhiều. */
function countWaterCells(points: WallPoint[], map?: LocalTerrainMap): number {
  if (!map) return 0;
  let wet = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(1, Math.ceil(segLength(a, b) / 6));
    for (let s = 0; s <= steps; s++) {
      const f = s / steps;
      const t = terrainAtCell(map, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
      if (isWater(t)) wet += 6;
    }
  }
  return wet;
}

/**
 * TÍNH TOÁN một tuyến tường trước khi khởi công: dài bao nhiêu, tốn gì, mất bao
 * lâu, được bao nhiêu phòng thủ. UI gọi hàm này mỗi lần người chơi bấm thêm một
 * điểm, nên con số hiện trên màn hình luôn là con số sẽ bị trừ thật.
 */
export function planWall(
  points: WallPoint[],
  level: number,
  material: WallMaterial,
  map?: LocalTerrainMap,
): WallPlan {
  const mat = WALL_MATERIAL_BY_ID[material] ?? WALL_MATERIAL_BY_ID["Đá"];
  const lvl = Math.max(1, Math.min(mat.maxLevel, Math.round(level)));
  const empty: WallPlan = {
    ok: false, length: 0, meters: 0, waterCells: 0, closed: false,
    cost: {}, labour: {}, days: 0, defense: 0,
  };

  if (points.length < 2) return { ...empty, error: "Cần ít nhất 2 điểm để vạch một tuyến tường" };
  for (const p of points) {
    if (p.x < 0 || p.y < 0 || p.x >= LOCAL_GRID_CELLS || p.y >= LOCAL_GRID_CELLS) {
      return { ...empty, error: "Có điểm nằm ngoài lưới lãnh địa" };
    }
  }

  const length = wallLength(points);
  if (length < 8) return { ...empty, error: "Tuyến quá ngắn — chưa đủ một đoạn tường" };
  if (length > MAX_WALL_CELLS) {
    return { ...empty, error: `Tuyến dài ${Math.round(length)} ô, vượt giới hạn ${MAX_WALL_CELLS} ô` };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const closed = points.length >= 4 && segLength(first, last) < 30;

  const waterCells = countWaterCells(points, map);
  // đá bắc qua nước phải đóng cọc móng — đội chi phí đoạn đó lên 2.5 lần
  const effective = length + waterCells * 1.5;

  const cost: Partial<Record<ResourceKey, number>> = {};
  for (const [k, v] of Object.entries(mat.perCell)) {
    cost[k] = Math.round((v ?? 0) * effective * lvl);
  }

  const labour: Partial<Record<LabourKey, number>> = {
    "Dân Phu": Math.round(length * 0.45 * lvl),
    "Thợ Đá": material === "Gỗ" ? 0 : Math.round(length * 0.13 * lvl),
    "Thợ Mộc": material === "Gỗ" ? Math.round(length * 0.16 * lvl) : Math.round(length * 0.03 * lvl),
    "Kỹ Sư": Math.max(1, Math.ceil((length / 220) * lvl)),
  };
  for (const k of LABOUR_LIST) if (!labour[k]) delete labour[k];

  const days = Math.max(3, Math.round((effective / mat.cellsPerDay) * (1 + (lvl - 1) * 0.45)));
  // tuyến hở chỉ chắn được một hướng — giá trị phòng thủ bằng hơn nửa
  const defense = Math.round(mat.defense * lvl * (closed ? 1 : 0.55));

  return {
    ok: true, length: Math.round(length), meters: Math.round(length * LOCAL_CELL_M),
    waterCells, closed, cost, labour, days, defense,
  };
}

/**
 * KHỞI CÔNG một tuyến tường. Trả PatchOp[] — trừ vật tư ngay, xếp tuyến vào
 * hàng đợi ngày (tickConstruction hạ dần "Ngày Xây Còn Lại" y như công trình).
 */
export function buildWall(
  state: StatData,
  territoryId: string,
  points: WallPoint[],
  opts: { level?: number; material?: WallMaterial; name?: string; map?: LocalTerrainMap } = {},
): BuildResult {
  const territory = state["Lãnh Địa"][territoryId];
  if (!territory) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!holdingOwnedByPlayer(state, territoryId)) {
    return { ok: false, error: "Ngươi không có quyền dựng tường ở đây", ops: [] };
  }

  const material = opts.material ?? "Đá";
  const level = opts.level ?? 1;
  const plan = planWall(points, level, material, opts.map);
  if (!plan.ok) return { ok: false, error: plan.error, ops: [] };

  // vật tư
  const stock = territory["Tài Nguyên"];
  const missing: string[] = [];
  if ((plan.cost["Ngân Khố"] ?? 0) > state["Thông Tin Nhân Vật"]["Ngân Khố"]) missing.push("Ngân Khố");
  for (const [k, v] of Object.entries(plan.cost)) {
    if (k === "Ngân Khố") continue;
    if ((v ?? 0) > (stock[k] ?? 0)) missing.push(k);
  }
  if (missing.length > 0) return { ok: false, error: `Thiếu vật tư: ${missing.join(", ")}`, ops: [] };

  // nhân lực — tường dài là công trường lớn nhất một lãnh chúa từng mở
  const free = analysePopulation(territory).freelance;
  const used = labourInUse(territory);
  const wallsInProgress = (territory["Tường Thành"] ?? []).filter((w) => w["Đang Xây"]);
  for (const w of wallsInProgress) {
    const p = planWall(w["Điểm"], w["Cấp"], w["Vật Liệu"]);
    for (const k of LABOUR_LIST) used[k] += p.labour[k] ?? 0;
  }
  const short = LABOUR_LIST
    .filter((k) => (plan.labour[k] ?? 0) > Math.max(0, (free[k] ?? 0) - used[k]))
    .map((k) => `${k} (cần ${plan.labour[k]}, còn ${Math.max(0, (free[k] ?? 0) - used[k])})`);
  if (short.length > 0) return { ok: false, error: `Thiếu nhân lực: ${short.join(", ")}`, ops: [] };

  const existing = territory["Tường Thành"] ?? [];
  const id = `wall-${existing.length + 1}-${Math.round(points[0].x)}-${Math.round(points[0].y)}`;
  const line: WallLine = {
    "Mã": id,
    "Tên": opts.name?.trim() || `${WALL_MATERIAL_BY_ID[material].label} ${existing.length + 1}`,
    "Cấp": Math.max(1, Math.min(WALL_MATERIAL_BY_ID[material].maxLevel, Math.round(level))),
    "Vật Liệu": material,
    "Điểm": points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    "Chiều Dài": plan.length,
    "Đang Xây": true,
    "Ngày Xây Còn Lại": plan.days,
    "Nguyên Vẹn": 100,
  };

  const ops: PatchOp[] = [];
  if (plan.cost["Ngân Khố"]) {
    ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -(plan.cost["Ngân Khố"] ?? 0) });
  }
  for (const [k, v] of Object.entries(plan.cost)) {
    if (k === "Ngân Khố" || !v) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: -v });
  }
  ops.push({
    op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Tường Thành`,
    value: [...existing, line],
  });
  return { ok: true, ops };
}

/**
 * NÂNG CẤP một tuyến sẵn có — chỉ trả phần chênh vật liệu, không phải xây lại
 * từ đầu. Đây là lý do bức tường cũ không bao giờ "biến mất" nữa.
 */
export function upgradeWall(state: StatData, territoryId: string, wallId: string): BuildResult {
  const territory = state["Lãnh Địa"][territoryId];
  const lines = territory?.["Tường Thành"] ?? [];
  const idx = lines.findIndex((w) => w["Mã"] === wallId);
  if (idx < 0) return { ok: false, error: "Không tìm thấy tuyến tường", ops: [] };
  if (!holdingOwnedByPlayer(state, territoryId)) {
    return { ok: false, error: "Ngươi không có quyền động vào tường ở đây", ops: [] };
  }

  const line = lines[idx];
  if (line["Đang Xây"]) return { ok: false, error: `${line["Tên"]} đang thi công`, ops: [] };
  const mat = WALL_MATERIAL_BY_ID[line["Vật Liệu"]];
  if (line["Cấp"] >= mat.maxLevel) {
    return { ok: false, error: `${mat.label} không nâng quá cấp ${mat.maxLevel} được`, ops: [] };
  }

  const now = planWall(line["Điểm"], line["Cấp"], line["Vật Liệu"]);
  const next = planWall(line["Điểm"], line["Cấp"] + 1, line["Vật Liệu"]);
  const delta: Partial<Record<ResourceKey, number>> = {};
  for (const k of Object.keys(next.cost)) {
    delta[k] = Math.max(0, (next.cost[k] ?? 0) - (now.cost[k] ?? 0));
  }

  const stock = territory["Tài Nguyên"];
  const missing: string[] = [];
  if ((delta["Ngân Khố"] ?? 0) > state["Thông Tin Nhân Vật"]["Ngân Khố"]) missing.push("Ngân Khố");
  for (const [k, v] of Object.entries(delta)) {
    if (k === "Ngân Khố") continue;
    if ((v ?? 0) > (stock[k] ?? 0)) missing.push(k);
  }
  if (missing.length > 0) return { ok: false, error: `Thiếu vật tư: ${missing.join(", ")}`, ops: [] };

  const ops: PatchOp[] = [];
  if (delta["Ngân Khố"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -(delta["Ngân Khố"] ?? 0) });
  for (const [k, v] of Object.entries(delta)) {
    if (k === "Ngân Khố" || !v) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: -v });
  }
  const updated = lines.map((w, i) => i === idx
    ? { ...w, "Cấp": w["Cấp"] + 1, "Đang Xây": true, "Ngày Xây Còn Lại": Math.max(3, next.days - now.days) }
    : w);
  ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Tường Thành`, value: updated });
  return { ok: true, ops };
}

/** Phá bỏ một tuyến — thu hồi 30% đá. */
export function demolishWall(state: StatData, territoryId: string, wallId: string): PatchOp[] {
  const territory = state["Lãnh Địa"][territoryId];
  const lines = territory?.["Tường Thành"] ?? [];
  const line = lines.find((w) => w["Mã"] === wallId);
  if (!line || !holdingOwnedByPlayer(state, territoryId)) return [];

  const plan = planWall(line["Điểm"], line["Cấp"], line["Vật Liệu"]);
  const ops: PatchOp[] = [];
  for (const [k, v] of Object.entries(plan.cost)) {
    if (k === "Ngân Khố" || !v) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: Math.round(v * 0.3) });
  }
  ops.push({
    op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Tường Thành`,
    value: lines.filter((w) => w["Mã"] !== wallId),
  });
  return ops;
}

/** Tổng điểm phòng thủ do tường mang lại (chỉ tính tuyến đã xây xong). */
export function wallDefense(holding: Holding | undefined): number {
  let total = 0;
  for (const w of holding?.["Tường Thành"] ?? []) {
    if (w["Đang Xây"]) continue;
    const plan = planWall(w["Điểm"], w["Cấp"], w["Vật Liệu"]);
    total += Math.round(plan.defense * (w["Nguyên Vẹn"] / 100));
  }
  return total;
}

/** Phí bảo trì tường mỗi tháng (Đồng Đỏ) — tường dài là gánh nặng thật. */
export function wallUpkeep(holding: Holding | undefined): number {
  let total = 0;
  for (const w of holding?.["Tường Thành"] ?? []) {
    if (w["Đang Xây"]) continue;
    total += Math.round(w["Chiều Dài"] * 0.02 * w["Cấp"] * G);
  }
  return total;
}

/** Mô tả một dòng cho AI đọc. */
export function describeWall(w: WallLine): string {
  const state = w["Đang Xây"] ? `đang thi công, còn ${w["Ngày Xây Còn Lại"]} ngày` : `nguyên vẹn ${w["Nguyên Vẹn"]}%`;
  return `${w["Tên"]} — ${w["Vật Liệu"]} cấp ${w["Cấp"]}, dài ${Math.round(w["Chiều Dài"] * LOCAL_CELL_M)} m (${state})`;
}
