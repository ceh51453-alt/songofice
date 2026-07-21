/**
 * naval (7.8) — hải chiến + đổ bộ + phong toả, dùng CHUNG lõi Battle Resolver
 * (7.9) nhưng thay địa hình bằng ĐIỀU KIỆN BIỂN + tương khắc LOẠI HẠM:
 * - Thuyền Dài Greyjoy: nhanh + áp mạn (mạnh khi Sóng Lớn),
 * - Hạm Đội Hoả Công: khắc cụm thuyền lớn (kiểu Blackwater) nhưng vô dụng Sóng Lớn,
 * - Bão gây thương vong ngẫu nhiên CẢ 2 phe; Sương Mù giảm lợi thế số đông.
 * Đổ bộ: hạm đội chở bộ binh → mở vây thành ven biển (bỏ qua phòng thủ đường bộ).
 * Phong toả cảng: cắt tiếp tế đường biển (supplyLine "Bị Cắt Đứt").
 * Hàm thuần, cùng seed cùng kết quả.
 */
import type { StatData, Fleet } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { makeRng } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import { resolveBattle, type BattleSideInput, type BattleResult, type Difficulty } from "./battleResolver";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { playerHouseId } from "../territory/territoryEngine";

export type SeaCondition = (typeof import("../mvu/schema").SEA_CONDITIONS)[number];
export type FleetType = Fleet["Loại Hạm"];

export interface FleetSideInput {
  name: string;
  ships: number;
  type: FleetType;
  status: Fleet["Tình Trạng"];
  house?: string;
  admiral?: { name: string; command: number; cunning: number; traits: string[] };
}

// chất lượng nền theo loại hạm (0-100) — training/equipment cho Battle Resolver.
const FLEET_QUALITY: Record<FleetType, { train: number; equip: number }> = {
  "Thuyền Dài (Greyjoy)": { train: 75, equip: 60 },
  "Chiến Thuyền Nặng": { train: 65, equip: 78 },
  "Thuyền Buôn Vũ Trang": { train: 42, equip: 45 },
  "Hạm Đội Hoả Công": { train: 60, equip: 72 },
};
const STATUS_MULT: Record<Fleet["Tình Trạng"], number> = { "Sẵn Sàng": 1.0, "Hư Hại": 0.7, "Đang Sửa": 0.4 };

// tương khắc loại hạm (giá trị = ta hiệu quả thế nào khi gặp loại địch).
const FLEET_COUNTER: Record<FleetType, Record<FleetType, number>> = {
  "Thuyền Dài (Greyjoy)": { "Thuyền Dài (Greyjoy)": 1.0, "Chiến Thuyền Nặng": 1.1, "Thuyền Buôn Vũ Trang": 1.2, "Hạm Đội Hoả Công": 1.15 },
  "Chiến Thuyền Nặng": { "Thuyền Dài (Greyjoy)": 0.9, "Chiến Thuyền Nặng": 1.0, "Thuyền Buôn Vũ Trang": 1.2, "Hạm Đội Hoả Công": 0.85 },
  "Thuyền Buôn Vũ Trang": { "Thuyền Dài (Greyjoy)": 0.75, "Chiến Thuyền Nặng": 0.8, "Thuyền Buôn Vũ Trang": 1.0, "Hạm Đội Hoả Công": 0.8 },
  "Hạm Đội Hoả Công": { "Thuyền Dài (Greyjoy)": 0.85, "Chiến Thuyền Nặng": 1.25, "Thuyền Buôn Vũ Trang": 1.15, "Hạm Đội Hoả Công": 1.0 },
};

/** Điều kiện biển điều chỉnh loại hạm (7.8). */
function seaConditionMult(type: FleetType, condition: SeaCondition): number {
  if (condition === "Sóng Lớn") {
    if (type === "Thuyền Dài (Greyjoy)") return 1.12; // nhẹ, áp mạn tốt khi sóng
    if (type === "Hạm Đội Hoả Công") return 0.8; // lửa vô dụng khi sóng lớn
    return 0.95;
  }
  if (condition === "Biển Lặng" && type === "Hạm Đội Hoả Công") return 1.1; // cụm thuyền đứng yên → hoả công lợi
  return 1.0;
}

export function fleetMatchup(ta: FleetSideInput, dich: FleetSideInput, condition: SeaCondition): number {
  return clamp(FLEET_COUNTER[ta.type][dich.type] * seaConditionMult(ta.type, condition), 0.7, 1.3);
}

function fleetToSide(f: FleetSideInput, opp: FleetSideInput, condition: SeaCondition): BattleSideInput {
  const q = FLEET_QUALITY[f.type];
  const s = STATUS_MULT[f.status];
  return {
    name: f.name,
    totalTroops: Math.max(1, f.ships),
    morale: 65,
    training: q.train * s,
    logistics: 60,
    equipment: q.equip * s,
    troopType: "Bộ Binh", // không dùng (matchup override)
    house: f.house,
    matchupFactor: fleetMatchup(f, opp, condition),
    general: f.admiral,
  };
}

export interface NavalInput {
  playerFleet: FleetSideInput;
  enemyFleet: FleetSideInput;
  condition: SeaCondition;
  seed: number;
  difficulty: Difficulty;
}

export interface NavalResult extends BattleResult {
  shipsLostPlayer: number;
  shipsLostEnemy: number;
  condition: SeaCondition;
}

/** Hải chiến (7.8) — reuse Battle Resolver; thương vong = số thuyền chìm. */
export function resolveNaval(input: NavalInput): NavalResult {
  const player = fleetToSide(input.playerFleet, input.enemyFleet, input.condition);
  const enemy = fleetToSide(input.enemyFleet, input.playerFleet, input.condition);

  // Sương Mù giảm lợi thế số đông: kéo bên đông về gần parity
  if (input.condition === "Sương Mù") {
    if (player.totalTroops > enemy.totalTroops) player.matchupFactor = (player.matchupFactor ?? 1) * 0.95;
    else if (enemy.totalTroops > player.totalTroops) enemy.matchupFactor = (enemy.matchupFactor ?? 1) * 0.95;
  }

  const base = resolveBattle({ player, enemy, terrain: undefined, seed: input.seed, difficulty: input.difficulty });
  let shipsLostPlayer = base.casualtiesPlayer;
  let shipsLostEnemy = base.casualtiesEnemy;

  // Bão: thương vong ngẫu nhiên CẢ 2 phe (7.8)
  if (input.condition === "Bão") {
    const rng = makeRng(input.seed ^ 0x5701);
    shipsLostPlayer += Math.round(input.playerFleet.ships * (0.05 + rng() * 0.1));
    shipsLostEnemy += Math.round(input.enemyFleet.ships * (0.05 + rng() * 0.1));
    base.log.push(`Bão biển: thêm thương vong ngẫu nhiên cả 2 phe (ta ${shipsLostPlayer}, địch ${shipsLostEnemy} thuyền)`);
  }
  shipsLostPlayer = Math.min(shipsLostPlayer, input.playerFleet.ships);
  shipsLostEnemy = Math.min(shipsLostEnemy, input.enemyFleet.ships);

  return { ...base, shipsLostPlayer, shipsLostEnemy, condition: input.condition };
}

// ── Dựng phe từ state / attrs ────────────────────────────────────────────────
export function playerFleetSide(state: StatData): FleetSideInput | null {
  const fleets = Object.entries(state["Hạm Đội"]).filter(([, f]) => f["Số Chiến Thuyền"] > 0);
  if (fleets.length === 0) return null;
  const [name, main] = fleets.sort((a, b) => b[1]["Số Chiến Thuyền"] - a[1]["Số Chiến Thuyền"])[0];
  const totalShips = fleets.reduce((s, [, f]) => s + f["Số Chiến Thuyền"], 0);
  return {
    name, ships: totalShips, type: main["Loại Hạm"], status: main["Tình Trạng"],
    house: state["Thông Tin Nhân Vật"]["Nhà"],
  };
}

export function enemyFleetFromAttrs(attrs: Record<string, string>): FleetSideInput {
  const ships = Number(attrs.enemy_ships ?? attrs.enemy_size);
  const type = (attrs.enemy_fleet_type as FleetType) ?? "Chiến Thuyền Nặng";
  return {
    name: attrs.enemy || "Hạm đội địch",
    ships: Number.isFinite(ships) && ships > 0 ? ships : 50,
    type: (["Thuyền Dài (Greyjoy)", "Chiến Thuyền Nặng", "Thuyền Buôn Vũ Trang", "Hạm Đội Hoả Công"] as FleetType[]).includes(type) ? type : "Chiến Thuyền Nặng",
    status: "Sẵn Sàng",
    house: attrs.enemy_house,
  };
}

export function seaConditionFromAttrs(attrs: Record<string, string>): SeaCondition {
  const c = attrs.sea_condition ?? attrs.condition;
  return (["Biển Lặng", "Sóng Lớn", "Sương Mù", "Bão"] as SeaCondition[]).includes(c as SeaCondition) ? (c as SeaCondition) : "Biển Lặng";
}

// ── Đổ bộ (7.8) ──────────────────────────────────────────────────────────────
/**
 * Đổ bộ: hạm đội chở "Bộ Binh Trên Thuyền" tới lãnh địa ven biển địch → tạo
 * đơn vị bộ binh tại đó (bỏ qua phòng thủ đường bộ), sẵn sàng mở vây (12.2).
 */
export function amphibiousLandingOps(state: StatData, fleetName: string, targetRegionId: string): { ok: boolean; error?: string; ops: PatchOp[]; landingUnit?: string } {
  const fleet = state["Hạm Đội"][fleetName];
  if (!fleet) return { ok: false, error: "Không tìm thấy hạm đội", ops: [] };
  const region = REGIONS_BY_ID[targetRegionId];
  if (!region) return { ok: false, error: "Vùng không tồn tại", ops: [] };
  if (!region.coastal) return { ok: false, error: "Lãnh địa không giáp biển — không đổ bộ được", ops: [] };
  const troops = fleet["Bộ Binh Trên Thuyền"];
  if (troops <= 0) return { ok: false, error: "Hạm đội không chở bộ binh", ops: [] };
  const pHouse = playerHouseId(state);
  if (state["Chủ Quyền Lãnh Thổ"][targetRegionId]?.["Nhà Kiểm Soát"] === pHouse) {
    return { ok: false, error: "Không cần đổ bộ vào lãnh thổ của mình", ops: [] };
  }

  const landingUnit = `Quân đổ bộ ${region.name}`;
  return {
    ok: true, landingUnit,
    ops: [
      {
        op: "replace", path: `stat_data.Biên Chế Quân Sự.${landingUnit}`,
        value: { "Số Lượng": troops, "Loại Quân": "Bộ Binh", "Sĩ Khí": "Ổn Định", "Huấn Luyện": "Thành Thạo", "Lãnh Địa Đồn Trú": targetRegionId, "Turn Huấn Luyện": 0 },
      },
      { op: "replace", path: `stat_data.Hạm Đội.${fleetName}.Bộ Binh Trên Thuyền`, value: 0 },
      { op: "replace", path: `stat_data.Hạm Đội.${fleetName}.Lãnh Địa Neo Đậu`, value: targetRegionId },
    ],
  };
}

/** Phong toả cảng địch (7.8) — cắt tiếp tế/giao thương đường biển. */
export function blockadeOps(state: StatData, fleetName: string, targetRegionId: string): { ok: boolean; error?: string; ops: PatchOp[] } {
  const fleet = state["Hạm Đội"][fleetName];
  if (!fleet) return { ok: false, error: "Không tìm thấy hạm đội", ops: [] };
  if (!REGIONS_BY_ID[targetRegionId]?.coastal) return { ok: false, error: "Chỉ phong toả được cảng ven biển", ops: [] };
  return {
    ok: true,
    ops: [
      { op: "replace", path: `stat_data.Hạm Đội.${fleetName}.Đang Phong Toả`, value: targetRegionId },
      { op: "replace", path: `stat_data.Hạm Đội.${fleetName}.Lãnh Địa Neo Đậu`, value: targetRegionId },
    ],
  };
}

/** Cảng có đang bị phong toả không (dùng cho hệSốHậuCần "Bị Cắt Đứt" khi vây — 7.9.2). */
export function isPortBlockaded(state: StatData, regionId: string): boolean {
  return Object.values(state["Hạm Đội"]).some((f) => f["Đang Phong Toả"] === regionId && f["Số Chiến Thuyền"] > 0);
}
