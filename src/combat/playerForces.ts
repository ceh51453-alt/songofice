/**
 * Dựng input chiến đấu từ StatData: phe người chơi (gộp Biên Chế Quân Sự +
 * tướng), Duelist từ chỉ số phái sinh 5.1f, và phe địch từ attrs thẻ
 * combat_trigger (AI cung cấp ƯỚC LƯỢNG làm INPUT — 7.9.1, không phải kết quả).
 */
import type { StatData, MilitaryUnit } from "../mvu/schema";
import { aggregateUnits, TRAIN_SCORE, MORALE_SCORE, EQUIP_SCORE, LOGI_SCORE } from "./scales";
import type { BattleSideInput } from "./battleResolver";
import type { Duelist } from "./duel";
import type { TroopType } from "./terrain";

function mod(stat: number): number {
  return Math.floor((stat - 10) / 2); // quy đổi 1-20 → bonus kiểu D&D (7.1)
}

export function playerDuelist(state: StatData): Duelist {
  const core = state["Chỉ Số Cốt Lõi"];
  const derived = state["Chỉ Số Phái Sinh"];
  const vitals = state["Chỉ Số Sinh Tồn"];
  const equipped = state["Trang Bị Đang Mặc"];
  const weapon = equipped["Vũ Khí Chính"];
  const armor = equipped["Giáp Thân"];
  
  // cấp kỹ năng vũ khí cao nhất nhóm Chiến Đấu (trừ Chỉ Huy)
  const weaponSkill = Math.max(
    0,
    ...Object.entries(state["Kỹ Năng"])
      .filter(([name, s]) => s["Nhóm"] === "Chiến Đấu" && name !== "Chỉ Huy Quân")
      .map(([, s]) => s["Cấp"]),
  );

  // Aggregate traits from all equipped items
  const equipmentTraits = new Set<string>();
  for (const item of Object.values(equipped)) {
    if (item && item["Đặc Tính"]) {
      for (const t of item["Đặc Tính"]) {
        equipmentTraits.add(t);
      }
    }
  }

  let agilityMod = mod(core["Nhanh Nhẹn"]);
  if (equipmentTraits.has("giáp_nặng") || (armor?.["Đặc Tính"]?.includes("Giáp Nặng"))) {
    agilityMod -= 2;
  }

  // Also convert equipment traits to camel/snake case if needed, or just keep them as is. 
  // Our system expects "poisoned_blade", "riposte", "brute_force", "agile_dancer", "second_wind"
  const traits = Array.from(equipmentTraits);

  return {
    name: state["Thông Tin Nhân Vật"]["Họ Tên"],
    hp: vitals["HP"],
    maxHp: derived["_HP Tối Đa"],
    armorClass: derived["_Phòng Thủ"],
    attackMod: mod(core["Sức Mạnh"]) + weaponSkill,
    damageBonus: derived["_Sát Thương Cận"],
    weaponDice: "1d8", // In the future, this can be parsed from weapon properties
    damageReduction: 2, // In the future, this can be derived from armor properties
    agilityMod,
    stamina: vitals["Thể Lực"],
    maxStamina: derived["_Thể Lực Tối Đa"],
    valyrianOrObsidian:
      equipmentTraits.has("valyrian") || equipmentTraits.has("obsidian"),
    traits
  };
}

/** Duelist ĐỊCH từ attrs combat_trigger (AI ước lượng — input cho engine). */
export function enemyDuelistFromAttrs(attrs: Record<string, string>): Duelist {
  const num = (k: string, def: number) => {
    const v = Number(attrs[k]);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  return {
    name: attrs.enemy || "Đối thủ",
    hp: num("enemy_hp", 60),
    maxHp: num("enemy_hp", 60),
    armorClass: num("enemy_ac", 13),
    attackMod: num("enemy_atk", 4),
    damageBonus: num("enemy_dmgbonus", 2),
    weaponDice: attrs.enemy_dmg && /^\d*d\d+([+-]\d+)?$/i.test(attrs.enemy_dmg) ? attrs.enemy_dmg : "1d8",
    damageReduction: num("enemy_dr", 2),
    agilityMod: num("enemy_agi", 1),
    stamina: 80,
    maxStamina: 80,
    valyrianOrObsidian: attrs.enemy_valyrian === "true",
  };
}

/** Phe người chơi cho Battle Resolver: gộp mọi đơn vị Biên Chế (7.9.1). */
export function playerBattleSide(state: StatData): BattleSideInput {
  const units = Object.values(state["Biên Chế Quân Sự"]);
  const agg = aggregateUnits(units);
  // không có quân → đội hộ vệ nhỏ mặc định (AI không nên trigger Đại Chiến khi trắng quân)
  if (agg.totalTroops === 0) {
    agg.totalTroops = 50;
  }
  // tướng: chọn tướng còn sống có Thống Soái cao nhất (hoặc chính người chơi)
  const generals = Object.entries(state["Tướng Lĩnh"]).filter(([, g]) => g["Còn Sống"]);
  const best = generals.sort((a, b) => b[1]["Chỉ Số Thống Soái"] - a[1]["Chỉ Số Thống Soái"])[0];
  const commandSkill = state["Kỹ Năng"]["Chỉ Huy Quân"]?.["Cấp"] ?? 0;
  const playerAsGeneral = {
    name: state["Thông Tin Nhân Vật"]["Họ Tên"],
    command: Math.min(100, 30 + commandSkill * 7 + state["Chỉ Số Cốt Lõi"]["Uy Tín"] * 1.5),
    cunning: Math.min(100, state["Chỉ Số Cốt Lõi"]["Trí Tuệ"] * 4),
    traits: [] as string[],
  };
  const mainType = (units.sort((a, b) => b["Số Lượng"] - a["Số Lượng"])[0]?.["Loại Quân"] ?? "Bộ Binh") as TroopType;
  return {
    name: "Quân ta",
    ...agg,
    troopType: mainType,
    house: state["Thông Tin Nhân Vật"]["Nhà"],
    general: best
      ? { name: best[0], command: best[1]["Chỉ Số Thống Soái"], cunning: best[1]["Chỉ Số Trí Mưu"], traits: best[1]["Đặc Tính"] }
      : playerAsGeneral,
  };
}

/** Phe địch từ attrs combat_trigger. */
export function enemyBattleSideFromAttrs(attrs: Record<string, string>): BattleSideInput {
  const size = Number(attrs.enemy_size);
  const quality = (attrs.enemy_quality ?? "Thành Thạo") as MilitaryUnit["Huấn Luyện"];
  const train = TRAIN_SCORE[quality] ?? 65;
  return {
    name: attrs.enemy || "Quân địch",
    totalTroops: Number.isFinite(size) && size > 0 ? size : 1000,
    morale: MORALE_SCORE[(attrs.enemy_morale as MilitaryUnit["Sĩ Khí"]) ?? "Ổn Định"] ?? 65,
    training: train,
    logistics: LOGI_SCORE[(attrs.enemy_logistics as MilitaryUnit["Hậu Cần"]) ?? "Cầm Cự Được"] ?? 60,
    equipment: EQUIP_SCORE[(attrs.enemy_equipment as MilitaryUnit["Trang Bị"]) ?? "Đồng Bộ Chỉnh Tề"] ?? 60,
    troopType: (attrs.enemy_troop_type as TroopType) ?? "Bộ Binh",
    house: attrs.enemy_house,
    general: attrs.enemy_general
      ? {
          name: attrs.enemy_general,
          command: Number(attrs.enemy_general_command) || 60,
          cunning: Number(attrs.enemy_general_cunning) || 50,
          traits: [],
        }
      : undefined,
  };
}
