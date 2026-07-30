/**
 * Dựng input chiến đấu từ StatData: phe người chơi (gộp Biên Chế Quân Sự +
 * tướng), Duelist từ chỉ số phái sinh 5.1f, và phe địch từ attrs thẻ
 * combat_trigger (AI cung cấp ƯỚC LƯỢNG làm INPUT — 7.9.1, không phải kết quả).
 */
import type { StatData, MilitaryUnit } from "../mvu/schema";
import { aggregateUnits, TRAIN_SCORE, MORALE_SCORE, EQUIP_SCORE, LOGI_SCORE } from "./scales";
import type { BattleSideInput } from "./battleResolver";
import { type Duelist, BASIC_SKILLS, BASIC_PASSIVES, EXCLUSIVE_SKILLS, EXCLUSIVE_PASSIVES } from "./duel";
import type { TroopType } from "./terrain";
import { INJURY_SEVERITY } from "../character/injuryEngine";

function mod(stat: number): number {
  return Math.floor((stat - 10) / 2); // quy đổi 1-20 → bonus kiểu D&D (7.1)
}

export function playerDuelist(state: StatData): Duelist {
  const core = state["Chỉ Số Cốt Lõi"];
  const derived = state["Chỉ Số Phái Sinh"];
  const vitals = state["Chỉ Số Sinh Tồn"];
  const equipped = state["Trang Bị Đang Mặc"];
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

  const passives = [];
  if (traits.includes("giáp_nặng") || (armor?.["Đặc Tính"]?.includes("Giáp Nặng"))) {
    passives.push(BASIC_PASSIVES["giap_tru"]);
  }
  if (traits.includes("riposte")) passives.push(BASIC_PASSIVES["phan_don"]);
  if (traits.includes("bloodlust") || state["Kỹ Năng"]["Chiến Đấu"]?.["Cấp"] > 3) passives.push(BASIC_PASSIVES["mau_lanh"]);

  // RPG: Exclusive Passives
  const bloodline = state["Thông Tin Nhân Vật"]["Huyết Mạch"];
  if (bloodline?.includes("Tiền Nhân")) passives.push(EXCLUSIVE_PASSIVES["mau_tien_nhan"]);
  if (bloodline?.includes("Ironborn")) passives.push(EXCLUSIVE_PASSIVES["chat_sat"]);

  // RPG: Exclusive Skills
  const skills = Object.values(BASIC_SKILLS);
  const mainWeapon = equipped["Vũ Khí Chính"];
  const weaponTraits = mainWeapon?.["Đặc Tính"] || [];
  const weaponName = mainWeapon?.["Tên"]?.toLowerCase() || "";
  const origin = state["Thông Tin Nhân Vật"]["Xuất Thân"];
  
  if ((weaponTraits.includes("Kiếm Nhẹ") || weaponName.includes("kiếm")) && (origin?.includes("Braavos") || state["Thiên Phú"]?.["Vũ Điệu Nước"])) {
    skills.push(EXCLUSIVE_SKILLS["vu_dieu_nuoc"]);
  }
  if ((weaponTraits.includes("Cung") || weaponName.includes("cung")) && (core["Tinh Tường"] >= 14 || state["Thiên Phú"]?.["Thiện Xạ"])) {
    skills.push(EXCLUSIVE_SKILLS["mua_mui_ten"]);
  }
  if ((weaponTraits.includes("Rìu") || weaponTraits.includes("Trọng Kiếm") || weaponName.includes("rìu") || weaponName.includes("búa")) && core["Sức Mạnh"] >= 15) {
    skills.push(EXCLUSIVE_SKILLS["nhat_chem_cuong_no"]);
  }
  if (bloodline?.includes("Valyria")) {
    skills.push(EXCLUSIVE_SKILLS["khe_lua"]);
  }

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
    strength: core["Sức Mạnh"],
    intellect: core["Trí Tuệ"],
    perception: core["Tinh Tường"],
    stamina: vitals["Thể Lực"],
    maxStamina: derived["_Thể Lực Tối Đa"],
    valyrianOrObsidian:
      equipmentTraits.has("valyrian") || equipmentTraits.has("obsidian"),
    traits,
    skills,
    passives,
    inventory: Object.entries(state["Túi Đồ"] || {})
      .filter(([, item]: [string, any]) => item["Số Lượng"] > 0)
      .map(([name]) => name),
    body: JSON.parse(JSON.stringify(state["Cơ Thể"] || {})),
    equipped: JSON.parse(JSON.stringify(equipped || {})),
  };
}

/** Duelist ĐỊCH từ attrs combat_trigger (AI ước lượng — input cho engine). */
export function enemyDuelistFromAttrs(attrs: Record<string, string>): Duelist {
  const num = (k: string, def: number) => {
    const v = Number(attrs[k]);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  const eClass = attrs.enemy_class || "chien_binh";
  let skills = [BASIC_SKILLS["tan_cong_thuong"], BASIC_SKILLS["phong_thu"]];
  let passives = [];
  let traits = [];

  if (eClass === "cung_thu" || attrs.enemy_weapon?.includes("Cung")) {
    skills.push(BASIC_SKILLS["ban_ten"], BASIC_SKILLS["ban_tia"], BASIC_SKILLS["rut_lui"], BASIC_SKILLS["nem_cat"]);
  } else if (eClass === "ky_si" || eClass === "giap_nang") {
    skills.push(BASIC_SKILLS["lao_toi"], BASIC_SKILLS["pha_giap"], BASIC_SKILLS["danh_lieu"]);
    passives.push(BASIC_PASSIVES["giap_tru"]);
  } else if (eClass === "sat_thu") {
    skills.push(BASIC_SKILLS["nham_chi_mang"], BASIC_SKILLS["rut_lui"], BASIC_SKILLS["nem_cat"]);
    passives.push(BASIC_PASSIVES["mau_lanh"]);
  } else {
    // chien_binh
    skills.push(BASIC_SKILLS["danh_lieu"], BASIC_SKILLS["pha_giap"], BASIC_SKILLS["lao_toi"]);
    passives.push(BASIC_PASSIVES["phan_don"]);
    traits.push("riposte");
  }

  // Khai thác thêm thông tin từ attrs để cấp Exclusive Skills/Passives
  const enemyWeapon = (attrs.enemy_weapon || "").toLowerCase();
  const enemyOrigin = attrs.enemy_origin || "";
  const enemyBloodline = attrs.enemy_bloodline || "";
  const enemyTraits = attrs.enemy_traits || "";
  const perception = num("enemy_perception", 10);
  const strength = num("enemy_strength", 10);

  if (enemyBloodline.includes("Tiền Nhân")) passives.push(EXCLUSIVE_PASSIVES["mau_tien_nhan"]);
  if (enemyBloodline.includes("Ironborn")) passives.push(EXCLUSIVE_PASSIVES["chat_sat"]);

  if (enemyWeapon.includes("kiếm") && (enemyOrigin.includes("Braavos") || enemyTraits.includes("Vũ Điệu Nước"))) {
    skills.push(EXCLUSIVE_SKILLS["vu_dieu_nuoc"]);
  }
  if (enemyWeapon.includes("cung") && (perception >= 14 || enemyTraits.includes("Thiện Xạ"))) {
    skills.push(EXCLUSIVE_SKILLS["mua_mui_ten"]);
  }
  if ((enemyWeapon.includes("rìu") || enemyWeapon.includes("búa") || enemyWeapon.includes("trọng kiếm")) && strength >= 15) {
    skills.push(EXCLUSIVE_SKILLS["nhat_chem_cuong_no"]);
  }
  if (enemyBloodline.includes("Valyria")) {
    skills.push(EXCLUSIVE_SKILLS["khe_lua"]);
  }

  const enemyBody: Record<string, any> = {};
  for (const part of Object.keys(INJURY_SEVERITY)) {
    enemyBody[part] = { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 };
  }

  return {
    name: attrs.enemy_name || attrs.enemy || "Kẻ Địch Bí Ẩn",
    hp: num("enemy_hp", 150),
    maxHp: num("enemy_max_hp", 150),
    armorClass: num("enemy_ac", 12),
    attackMod: num("enemy_attack_mod", 3),
    damageBonus: num("enemy_damage_bonus", 2),
    weaponDice: attrs.enemy_weapon_dice || "1d8",
    damageReduction: num("enemy_dr", 1),
    agilityMod: num("enemy_agility_mod", 2),
    strength,
    intellect: num("enemy_intellect", 10),
    perception,
    stamina: num("enemy_stamina", 80),
    maxStamina: num("enemy_max_stamina", 80),
    valyrianOrObsidian: attrs.enemy_valyrian === "true",
    traits,
    skills,
    passives,
    inventory: attrs.enemy_inventory ? attrs.enemy_inventory.split(",") : [],
    body: enemyBody,
    equipped: {} // AI equipment durability not fully simulated yet
  };
}

/** Phe người chơi cho Battle Resolver: gộp mọi đơn vị Biên Chế (7.9.1). */
export function playerBattleSide(state: StatData): BattleSideInput {
  // M19: quân đang TẬP HỢP hoặc đang HUẤN LUYỆN không ra trận được — nếu tính
  // vào chiến lực thì người chơi cứ bấm tuyển là mạnh lên tức thì, mất sạch ý
  // nghĩa của thời gian trong một cuộc chiến trung cổ.
  const units = Object.values(state["Biên Chế Quân Sự"]).filter(
    (u) => (u["Ngày Tập Hợp Còn Lại"] ?? 0) <= 0 && (u["Ngày Huấn Luyện"] ?? 0) <= 0,
  );
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
