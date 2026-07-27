/**
 * army (11.3-11.4) — tuyển quân + di chuyển + turn-advance loop cho quân.
 * - recruitUnit: chỉ tại lãnh địa có Doanh Trại + binh chủng thuộc Era (11.2b);
 *   trừ Vàng (ngân khố) + Lương Thực (kho vùng); huấn luyện vài turn mới sẵn sàng.
 * - moveArmy: quy px khoảng cách 2 vùng ra số turn; tick cập nhật vị trí.
 * - checkSellswordDefection: Lính Đánh Thuê không được trả lương → roll đổi phe.
 * Engine giữ số; AI KHÔNG tự quyết. Trả PatchOp[] cho engine áp (đường territoryStore).
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerTurnListener } from "../mvu/effects";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { recruitableTroopsForEra, type TroopTypeAll, troopMeta } from "../content/westeros/troopTypes";
import { canControlHolding } from "../character/roleplay";
import { MORALE_SCORE } from "../combat/scales";
import { eventSeed, makeRng } from "../probability/rng";

export interface RecruitResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  unitName?: string;
}

/** Sức tuyển tối đa/turn theo cấp Doanh Trại + Dân Số (11.3). */
export function maxRecruitPerTurn(state: StatData, territoryId: string): number {
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return 0;
  const barracks = terr["Công Trình"]["Doanh Trại"];
  if (!barracks || barracks["Đang Xây"]) return 0;
  return barracks["Cấp Độ"] * 800 + Math.floor(terr["Dân Số"] / 25);
}

/** Có Doanh Trại đã xây xong không (11.3). */
export function hasBarracks(state: StatData, territoryId: string): boolean {
  const terr = state["Lãnh Địa"][territoryId];
  return !!terr && Object.values(terr["Công Trình"]).some((b) => b["Loại"] === "Doanh Trại" && !b["Đang Xây"]);
}

/**
 * Tuyển 1 đơn vị tại lãnh địa (11.3). Trả ops trừ tài nguyên + tạo đơn vị đang
 * huấn luyện (Turn Huấn Luyện > 0 — chưa chiến đấu được).
 */
export function recruitUnit(
  state: StatData,
  territoryId: string,
  troopType: TroopTypeAll,
  count: number,
  unitName?: string,
): RecruitResult {
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!canControlHolding(state, territoryId)) return { ok: false, error: "Bạn không có quyền kiểm soát lãnh địa này", ops: [] };
  if (!hasBarracks(state, territoryId)) return { ok: false, error: "Cần Doanh Trại để tuyển quân", ops: [] };

  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  if (!recruitableTroopsForEra(eraId).includes(troopType)) {
    return { ok: false, error: `${troopType} không tuyển được ở thời kỳ này`, ops: [] };
  }
  if (count <= 0) return { ok: false, error: "Số lượng không hợp lệ", ops: [] };
  const cap = maxRecruitPerTurn(state, territoryId);
  if (count > cap) return { ok: false, error: `Vượt sức tuyển/turn (tối đa ${cap})`, ops: [] };

  const meta = troopMeta(troopType);
  const goldCost = Math.round((meta.costPer100["Ngân Khố"] * count) / 100);
  const foodCost = Math.round((meta.costPer100["Lương Thực"] * count) / 100);
  if (goldCost > state["Thông Tin Nhân Vật"]["Ngân Khố"]) return { ok: false, error: "Thiếu Vàng", ops: [] };
  if (foodCost > terr["Tài Nguyên"]["Lương Thực"]) return { ok: false, error: "Thiếu Lương Thực", ops: [] };
  if (count > (terr["Dân Số Chi Tiết"]["Nông Dân"] || 0)) return { ok: false, error: "Thiếu Nông Dân", ops: [] };

  const name = unitName?.trim() || `${troopType} ${REGIONS_BY_ID[territoryId]?.name ?? territoryId}`;
  const ops: PatchOp[] = [
    { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: -goldCost },
    { op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.Lương Thực`, value: -foodCost },
    { op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Dân Số`, value: -count },
    { op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Dân Số Chi Tiết.Nông Dân`, value: -count },
    {
      op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}`,
      value: {
        "Tướng Chỉ Huy": "Tạm Khuyết",
        "Số Lượng": count,
        "Loại Quân": troopType,
        "Huấn Luyện": meta.special ? "Thành Thạo" : "Mới Lập Đội",
        "Sĩ Khí": "Ổn Định",
        "Lãnh Địa Đồn Trú": territoryId,
        "Turn Huấn Luyện": meta.trainTurns,
      },
    },
  ];
  return { ok: true, ops, unitName: name };
}

// ── Di chuyển (11.4) ─────────────────────────────────────────────────────────
const PX_PER_TURN = 260; // quãng đường 1 turn hành quân (px ảnh gốc)

/** Khoảng cách 2 vùng theo px trọng trấn (9.2) → dùng quy ra số turn. */
export function calcMapDistance(fromId: string, toId: string): number {
  const a = REGIONS_BY_ID[fromId];
  const b = REGIONS_BY_ID[toId];
  if (!a || !b) return 3;
  return Math.hypot(a.seatXY[0] - b.seatXY[0], a.seatXY[1] - b.seatXY[1]);
}

export function distanceToTurns(px: number): number {
  return Math.max(1, Math.round(px / PX_PER_TURN));
}

export interface MoveResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  turns?: number;
}

export function moveArmy(state: StatData, unitName: string, targetTerritoryId: string): MoveResult {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị", ops: [] };
  if (unit["Turn Huấn Luyện"] > 0) return { ok: false, error: "Đơn vị đang huấn luyện", ops: [] };
  if (!REGIONS_BY_ID[targetTerritoryId]) return { ok: false, error: "Đích không hợp lệ", ops: [] };
  const from = unit["Lãnh Địa Đồn Trú"] || (unit["Đang Di Chuyển Đến"] ?? "");
  if (from === targetTerritoryId && !unit["Đang Di Chuyển Đến"]) return { ok: false, error: "Đơn vị đã ở đó", ops: [] };
  const turns = distanceToTurns(calcMapDistance(from, targetTerritoryId));
  return {
    ok: true, turns,
    ops: [
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Đang Di Chuyển Đến`, value: targetTerritoryId },
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Turn Di Chuyển Còn Lại`, value: turns },
    ],
  };
}

/** Vị trí marker quân trên bản đồ theo % tiến trình di chuyển (9.3/11.4). */
export function armyMarkerPosition(unit: StatData["Biên Chế Quân Sự"][string]): [number, number] | null {
  const fromId = unit["Lãnh Địa Đồn Trú"];
  const from = REGIONS_BY_ID[fromId];
  const toId = unit["Đang Di Chuyển Đến"];
  if (!toId) return from ? from.seatXY : null;
  const to = REGIONS_BY_ID[toId];
  if (!from || !to) return to?.seatXY ?? from?.seatXY ?? null;
  const totalTurns = Math.max(1, distanceToTurns(calcMapDistance(fromId, toId)));
  const progress = clampFrac(1 - unit["Turn Di Chuyển Còn Lại"] / totalTurns);
  return [from.seatXY[0] + (to.seatXY[0] - from.seatXY[0]) * progress, from.seatXY[1] + (to.seatXY[1] - from.seatXY[1]) * progress];
}
function clampFrac(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── Lính Đánh Thuê phản trắc (7.7) ──────────────────────────────────────────
export function sellswordWage(unit: StatData["Biên Chế Quân Sự"][string]): number {
  return troopMeta(unit["Loại Quân"]).mercenary ? unit["Số Lượng"] * 3 : 0;
}

/** Roll đổi phe: xác suất cao khi sĩ khí thấp. Seed → tái lập được (test). */
export function checkSellswordDefection(rng: () => number, moraleScore: number): boolean {
  const chance = 0.4 + (1 - moraleScore / 100) * 0.4; // 0.4..0.8
  return rng() < chance;
}

// ── turn-advance loop cho quân (11.4) ────────────────────────────────────────
export function tickArmy(state: StatData): void {
  const turn = state["_engineMeta"]["turnCount"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  let unpaidWages = 0;
  const mercenaries: string[] = [];

  for (const [name, unit] of Object.entries(state["Biên Chế Quân Sự"])) {
    if (unit["Số Lượng"] <= 0) continue;
    // huấn luyện xong → sẵn sàng
    if (unit["Turn Huấn Luyện"] > 0) {
      unit["Turn Huấn Luyện"] = Math.max(0, unit["Turn Huấn Luyện"] - 1);
    }
    // hành quân
    if (unit["Đang Di Chuyển Đến"]) {
      unit["Turn Di Chuyển Còn Lại"] = Math.max(0, unit["Turn Di Chuyển Còn Lại"] - 1);
      if (unit["Turn Di Chuyển Còn Lại"] <= 0) {
        unit["Lãnh Địa Đồn Trú"] = unit["Đang Di Chuyển Đến"];
        unit["Đang Di Chuyển Đến"] = undefined;
      }
    }
    if (troopMeta(unit["Loại Quân"]).mercenary) {
      unpaidWages += sellswordWage(unit);
      mercenaries.push(name);
    }
  }

  // trả lương Lính Đánh Thuê; không đủ Vàng → roll đổi phe (7.7)
  if (mercenaries.length > 0) {
    const gold = state["Thông Tin Nhân Vật"]["Ngân Khố"];
    if (gold >= unpaidWages) {
      state["Thông Tin Nhân Vật"]["Ngân Khố"] = gold - unpaidWages;
    } else {
      for (const name of mercenaries) {
        const unit = state["Biên Chế Quân Sự"][name];
        if (!unit) continue;
        const rng = makeRng(eventSeed(rootSeed, turn, `defect-${name}`));
        if (checkSellswordDefection(rng, MORALE_SCORE[unit["Sĩ Khí"]])) {
          delete state["Biên Chế Quân Sự"][name]; // đội đánh thuê bỏ đi
        }
      }
    }
  }
}

let registered = false;
export function registerArmyLoop(): void {
  if (registered) return;
  registerTurnListener("army", tickArmy);
  registered = true;
}
