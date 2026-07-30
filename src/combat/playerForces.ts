/**
 * Dựng input chiến đấu từ StatData: phe người chơi (gộp Biên Chế Quân Sự +
 * tướng), Duelist từ chỉ số phái sinh 5.1f, và phe địch từ attrs thẻ
 * combat_trigger (AI cung cấp ƯỚC LƯỢNG làm INPUT — 7.9.1, không phải kết quả).
 */
import type { StatData, MilitaryUnit } from "../mvu/schema";
import { aggregateUnits, TRAIN_SCORE, MORALE_SCORE, EQUIP_SCORE, LOGI_SCORE } from "./scales";
import type { BattleSideInput } from "./battleResolver";
import { type Duelist, type DuelTemperament, BASIC_PASSIVES, EXCLUSIVE_PASSIVES } from "./duel";
import type { TroopType } from "./terrain";
import { INJURY_SEVERITY } from "../character/injuryEngine";
import { compositionFromUnits } from "./troopMatchup";
import { gearWords, resolveWeapon, resolveArmor } from "../character/gearEngine";
import { bodyProfile, bodyCombatMods } from "../character/bodyEngine";
import {
  mobilizeAt, homeSupportAt, applyHomeSupport, cavalryQualityBonus, battleLocation,
  type MobilizationReport, type HomeSupport,
} from "./mobilization";
import {
  artsForHolder, lockedArtsForHolder, emptyHolder,
  type ArtHolder, type CombatArt,
} from "../content/westeros/combatArts";

function mod(stat: number): number {
  return Math.floor((stat - 10) / 2); // quy đổi 1-20 → bonus kiểu D&D (7.1)
}

/** Mọi từ khoá tra được từ một món đồ — nay dùng chung với gearEngine. */
const weaponWordsOf = gearWords;

/** Hồ sơ mở khoá chiêu thức của NHÂN VẬT NGƯỜI CHƠI. */
export function playerArtHolder(state: StatData, opts: { mounted?: boolean } = {}): ArtHolder {
  const core = state["Chỉ Số Cốt Lõi"];
  const info = state["Thông Tin Nhân Vật"];
  const equipped = state["Trang Bị Đang Mặc"];
  const words = [...weaponWordsOf(equipped["Vũ Khí Chính"]), ...weaponWordsOf(equipped["Vũ Khí Phụ"])];
  if (equipped["Khiên"]) words.push("khiên");

  const talents = Object.entries(state["Thiên Phú"] ?? {}).map(([name]) => name);
  const armourWords = weaponWordsOf(equipped["Giáp Thân"]).join(" ");

  return {
    skills: Object.fromEntries(Object.entries(state["Kỹ Năng"] ?? {}).map(([name, s]) => [name, s["Cấp"]])),
    stats: {
      "Sức Mạnh": core["Sức Mạnh"], "Nhanh Nhẹn": core["Nhanh Nhẹn"], "Thể Chất": core["Thể Chất"],
      "Trí Tuệ": core["Trí Tuệ"], "Tinh Tường": core["Tinh Tường"], "Uy Tín": core["Uy Tín"],
    },
    weaponWords: words,
    hasShield: !!equipped["Khiên"],
    hasOffhand: !!equipped["Vũ Khí Phụ"] && !equipped["Khiên"],
    heavyArmor: /trọng giáp|giáp nặng|giáp tấm|plate/.test(armourWords),
    bloodline: info["Huyết Mạch"] ?? "",
    origin: info["Xuất Thân"] ?? "",
    culture: `${info["Văn Hoá"] ?? ""} ${info["Nhà"] ?? ""} ${info["Huyết Mạch"] ?? ""}`,
    talents,
    mounted: opts.mounted ?? false,
  };
}

/** Chiêu chưa mở kèm lý do — cho sổ chiêu thức trong UI biết phải luyện gì. */
export function playerLockedArts(state: StatData, opts: { mounted?: boolean } = {}) {
  return lockedArtsForHolder(playerArtHolder(state, opts));
}

export function playerDuelist(state: StatData, opts: { mounted?: boolean } = {}): Duelist {
  const core = state["Chỉ Số Cốt Lõi"];
  const derived = state["Chỉ Số Phái Sinh"];
  const vitals = state["Chỉ Số Sinh Tồn"];
  const equipped = state["Trang Bị Đang Mặc"];

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
        equipmentTraits.add(t.toLowerCase());
      }
    }
  }

  const heavyArmor = resolveArmor(equipped).weight >= 5;

  let agilityMod = mod(core["Nhanh Nhẹn"]);

  const traits = Array.from(equipmentTraits);

  const passives = [];
  if (heavyArmor) passives.push(BASIC_PASSIVES["giap_tru"]);
  if (traits.includes("riposte")) passives.push(BASIC_PASSIVES["phan_don"]);
  if (traits.includes("bloodlust") || (state["Kỹ Năng"]["Chiến Đấu"]?.["Cấp"] ?? 0) > 3) passives.push(BASIC_PASSIVES["mau_lanh"]);
  if (core["Thể Chất"] >= 15) passives.push(BASIC_PASSIVES["chan_nhu_da"]);
  if ((state["Kỹ Năng"]["Cung & Nỏ"]?.["Cấp"] ?? 0) >= 5) passives.push(BASIC_PASSIVES["mat_dieu_hau"]);

  const bloodline = state["Thông Tin Nhân Vật"]["Huyết Mạch"];
  if (bloodline?.includes("Tiền Nhân")) passives.push(EXCLUSIVE_PASSIVES["mau_tien_nhan"]);
  if (bloodline?.includes("Ironborn")) passives.push(EXCLUSIVE_PASSIVES["chat_sat"]);

  // M22 — bộ chiêu thức mở ra từ CHÍNH nhân vật: cấp kỹ năng, chỉ số, thiên phú,
  // huyết mạch, xuất thân, văn hoá và vũ khí đang cầm.
  let skills: CombatArt[] = artsForHolder(playerArtHolder(state, opts));

  // M23 — vũ khí và giáp đi qua gearEngine: lớp vũ khí × vật liệu × phẩm chất ×
  // độ bền quyết định xúc xắc, xuyên giáp, tầm với và che chắn từng vùng.
  const weapon = resolveWeapon(equipped["Vũ Khí Chính"]);
  const armorProfile = resolveArmor(equipped);
  agilityMod -= armorProfile.agilityPenalty;

  // M23 — CƠ THỂ quyết định thật: gãy tay thì đánh yếu và trượt nhiều, gãy sườn
  // thì ba vòng đã hết hơi, mù thì mọi nhát đều là đoán mò.
  const bodyState = bodyProfile(state["Cơ Thể"]);
  const bodyMods = bodyCombatMods(bodyState);
  agilityMod = Math.round(agilityMod * bodyMods.agilityMult);
  skills = artsAllowedByBody(skills, bodyState);

  return {
    name: state["Thông Tin Nhân Vật"]["Họ Tên"],
    hp: vitals["HP"],
    maxHp: derived["_HP Tối Đa"],
    armorClass: derived["_Phòng Thủ"],
    attackMod: mod(core["Sức Mạnh"]) + weaponSkill + weapon.accuracy + bodyMods.hit,
    damageBonus: Math.round((derived["_Sát Thương Cận"] + weapon.damageBonus) * bodyMods.damageMult),
    weaponDice: weapon.dice,
    damageReduction: Math.max(0, armorProfile.zones["Thân"]),
    agilityMod,
    strength: core["Sức Mạnh"],
    intellect: core["Trí Tuệ"],
    perception: core["Tinh Tường"],
    endurance: core["Thể Chất"],
    stamina: Math.round(vitals["Thể Lực"] * bodyMods.staminaMult),
    maxStamina: Math.max(1, Math.round(derived["_Thể Lực Tối Đa"] * bodyMods.staminaMult)),
    mounted: opts.mounted ?? false,
    armorZones: armorProfile.zones,
    weaponPierce: weapon.armorPierce,
    weaponPoise: weapon.poise,
    poiseDrain: armorProfile.poisePenalty - bodyMods.poiseRegen,
    bodyBlocksTwoHand: bodyState.cannotTwoHand,
    bodyBlocksWeapon: bodyState.cannotHoldWeapon,
    valyrianOrObsidian: weapon.cutsThroughArmor,
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

/**
 * Lọc bộ chiêu theo những gì CƠ THỂ còn làm được. Mất một bàn tay thì mọi chiêu
 * đòi vũ khí hai tay biến mất khỏi bảng; mất cả hai thì chỉ còn Bác Thủ.
 */
export function artsAllowedByBody(arts: CombatArt[], body: ReturnType<typeof bodyProfile>): CombatArt[] {
  if (body.cannotHoldWeapon) {
    const bare = arts.filter((a) => a.school === "bac-thu" || a.school === "pho-thong");
    return bare.length > 0 ? bare : arts;
  }
  if (body.cannotTwoHand) {
    return arts.filter((a) => !TWO_HAND_SCHOOLS.has(a.school) || a.school === "pho-thong");
  }
  return arts;
}

/** Trường phái đòi cả hai tay — mất một bàn tay là mất luôn bộ chiêu này. */
const TWO_HAND_SCHOOLS = new Set(["trong-binh", "truong-thuong", "xa-thuat", "song-kiem"]);

/**
 * Nghề của kẻ địch → cấp kỹ năng ngầm cho từng trường phái. Nhờ vậy một "sát
 * thủ" mở đúng bộ chiêu ám thuật còn một "hiệp sĩ" mở bộ kiếm khiên, thay vì cả
 * hai cùng có một danh sách y hệt như bản trước.
 */
const ENEMY_CLASS_SKILLS: Record<string, Record<string, number>> = {
  chien_binh: { "Kiếm & Khiên": 4, "Rìu & Chuỳ": 3, "Chiến Đấu Tay Không": 2 },
  ky_si: { "Kiếm & Khiên": 6, "Cưỡi Ngựa Chiến": 5, "Trường Thương": 4 },
  giap_nang: { "Rìu & Chuỳ": 6, "Kiếm & Khiên": 4, "Chiến Đấu Tay Không": 3 },
  cung_thu: { "Cung & Nỏ": 6, "Ẩn Nấp": 3 },
  sat_thu: { "Ẩn Nấp": 7, "Song Kiếm": 5, "Chiến Đấu Tay Không": 4 },
  linh_thuong: { "Trường Thương": 6, "Kiếm & Khiên": 2 },
  do_vat: { "Chiến Đấu Tay Không": 7 },
  ky_su_bien: { "Rìu & Chuỳ": 5, "Chiến Đấu Tay Không": 4 },
};

const ENEMY_CLASS_TEMPER: Record<string, DuelTemperament> = {
  chien_binh: "Cân Bằng", ky_si: "Cân Bằng", giap_nang: "Hung Hãn",
  cung_thu: "Thận Trọng", sat_thu: "Xảo Quyệt", linh_thuong: "Thận Trọng",
  do_vat: "Hung Hãn", ky_su_bien: "Hung Hãn",
};

/** Duelist ĐỊCH từ attrs combat_trigger (AI ước lượng — input cho engine). */
export function enemyDuelistFromAttrs(attrs: Record<string, string>): Duelist {
  const num = (k: string, def: number) => {
    const v = Number(attrs[k]);
    return Number.isFinite(v) && v > 0 ? v : def;
  };
  const eClass = attrs.enemy_class || "chien_binh";
  const perception = num("enemy_perception", 10);
  const strength = num("enemy_strength", 10);
  const endurance = num("enemy_endurance", 10);
  const agility = num("enemy_agility", 10);
  const enemyWeapon = (attrs.enemy_weapon || "").toLowerCase();
  const enemyBloodline = attrs.enemy_bloodline || "";
  const enemyTraits = attrs.enemy_traits || "";

  // vũ khí mặc định theo nghề để bộ chiêu không rỗng khi AI khai thiếu
  const defaultWeapon =
    eClass === "cung_thu" ? "cung dài" :
    eClass === "sat_thu" ? "dao găm" :
    eClass === "giap_nang" ? "rìu chiến" :
    eClass === "linh_thuong" ? "trường thương" :
    eClass === "do_vat" ? "" : "kiếm";

  const holder: ArtHolder = {
    ...emptyHolder(),
    skills: ENEMY_CLASS_SKILLS[eClass] ?? ENEMY_CLASS_SKILLS.chien_binh,
    stats: {
      "Sức Mạnh": strength, "Nhanh Nhẹn": agility, "Thể Chất": endurance,
      "Trí Tuệ": num("enemy_intellect", 10), "Tinh Tường": perception, "Uy Tín": 10,
    },
    weaponWords: [enemyWeapon || defaultWeapon, ...(attrs.enemy_shield === "true" ? ["khiên"] : [])],
    hasShield: attrs.enemy_shield === "true" || eClass === "ky_si",
    hasOffhand: attrs.enemy_offhand === "true" || eClass === "sat_thu",
    heavyArmor: eClass === "giap_nang",
    bloodline: enemyBloodline,
    origin: attrs.enemy_origin || "",
    culture: `${attrs.enemy_culture || ""} ${attrs.enemy_house || ""} ${enemyBloodline}`,
    talents: enemyTraits.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
    mounted: attrs.enemy_mounted === "true",
  };

  const skills: CombatArt[] = artsForHolder(holder);

  const passives = [];
  const traits: string[] = [];
  if (eClass === "ky_si" || eClass === "giap_nang") passives.push(BASIC_PASSIVES["giap_tru"]);
  if (eClass === "sat_thu") passives.push(BASIC_PASSIVES["mau_lanh"]);
  if (eClass === "chien_binh") { passives.push(BASIC_PASSIVES["phan_don"]); traits.push("riposte"); }
  if (eClass === "do_vat" || endurance >= 15) passives.push(BASIC_PASSIVES["chan_nhu_da"]);
  if (eClass === "cung_thu" && perception >= 14) passives.push(EXCLUSIVE_PASSIVES["mat_dieu_hau"]);
  if (enemyBloodline.includes("Tiền Nhân")) passives.push(EXCLUSIVE_PASSIVES["mau_tien_nhan"]);
  if (enemyBloodline.includes("Ironborn")) passives.push(EXCLUSIVE_PASSIVES["chat_sat"]);
  if (enemyTraits.toLowerCase().includes("độc")) traits.push("poisoned_blade");

  const enemyBody: Record<string, any> = {};
  for (const part of Object.keys(INJURY_SEVERITY)) {
    enemyBody[part] = { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 };
  }

  const armour = num("enemy_dr", eClass === "giap_nang" ? 6 : eClass === "ky_si" ? 4 : 1);
  return {
    name: attrs.enemy_name || attrs.enemy || "Kẻ Địch Bí Ẩn",
    hp: num("enemy_hp", 150),
    maxHp: num("enemy_max_hp", 150),
    armorClass: num("enemy_ac", 12),
    attackMod: num("enemy_attack_mod", 3),
    damageBonus: num("enemy_damage_bonus", 2),
    weaponDice: attrs.enemy_weapon_dice || "1d8",
    damageReduction: armour,
    agilityMod: num("enemy_agility_mod", 2),
    strength,
    intellect: num("enemy_intellect", 10),
    perception,
    endurance,
    stamina: num("enemy_stamina", 80),
    maxStamina: num("enemy_max_stamina", 80),
    mounted: holder.mounted,
    armorZones: {
      "Đầu": eClass === "giap_nang" ? 4 : eClass === "ky_si" ? 3 : 1,
      "Thân": armour,
      "Tay": Math.floor(armour / 2),
      "Chân": Math.floor(armour / 2),
      "Ngẫu Nhiên": Math.floor(armour * 0.6),
    },
    temperament: ENEMY_CLASS_TEMPER[eClass] ?? "Cân Bằng",
    valyrianOrObsidian: attrs.enemy_valyrian === "true",
    traits,
    skills,
    passives,
    inventory: attrs.enemy_inventory ? attrs.enemy_inventory.split(",") : [],
    body: enemyBody,
    equipped: {}, // AI equipment durability not fully simulated yet
  };
}

export interface PlayerSideOptions {
  /** địa điểm giao chiến — chỉ quân ĐANG Ở ĐÂY mới ra trận (M23). */
  location?: string;
}

/** Phe người chơi cho Battle Resolver, kèm bản kê ai có mặt ai vắng (M23). */
export interface PlayerSideResult {
  side: BattleSideInput;
  mobilization: MobilizationReport;
  support: HomeSupport;
}

/**
 * Phe người chơi cho Battle Resolver: gộp đơn vị Biên Chế CÓ MẶT tại chiến
 * trường (7.9.1 + M23).
 *
 * M19 đã loại quân đang tập hợp/huấn luyện. M23 đi tiếp một bước quan trọng
 * hơn: quân phải Ở ĐÚNG CHỖ. Trước đây một đạo quân đóng ở Casterly Rock vẫn
 * được cộng vào trận đánh ngoài Winterfell, khiến ô "Lãnh Địa Đồn Trú" và toàn
 * bộ hệ hành quân thành vô nghĩa.
 */
export function playerBattleSideDetailed(state: StatData, opts: PlayerSideOptions = {}): PlayerSideResult {
  const location = opts.location ?? battleLocation(state);
  const mobilization = mobilizeAt(state, location);
  const units = mobilization.fielded.map(([, u]) => u);

  const agg = aggregateUnits(units);
  // không có quân tại chỗ → chỉ còn đội hộ vệ thân cận đi theo lãnh chúa
  if (agg.totalTroops === 0) {
    agg.totalTroops = 50;
  }

  // lãnh địa đứng sau lưng: công trình, kho lương, lòng dân
  const support = homeSupportAt(state, location);
  const boosted = applyHomeSupport(agg, support);
  Object.assign(agg, boosted);
  if (support.cavalry > 0 && units.length > 0) {
    agg.troopQuality = Math.min(1, (agg.troopQuality ?? 0.5) * cavalryQualityBonus(support, compositionFromUnits(units)));
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
  const mainType = ([...units].sort((a, b) => b["Số Lượng"] - a["Số Lượng"])[0]?.["Loại Quân"] ?? "Bộ Binh") as TroopType;
  const side: BattleSideInput = {
    name: "Quân ta",
    ...agg,
    troopType: mainType,
    // M22: engine đại chiến dùng thành phần binh chủng để dàn ba cánh quân
    composition: units.length > 0 ? compositionFromUnits(units) : { [mainType]: 1 },
    house: state["Thông Tin Nhân Vật"]["Nhà"],
    general: best
      ? { name: best[0], command: best[1]["Chỉ Số Thống Soái"], cunning: best[1]["Chỉ Số Trí Mưu"], traits: best[1]["Đặc Tính"] }
      : playerAsGeneral,
    // M23: ụ nỏ bắn rồng của lãnh địa — thứ duy nhất hạ được rồng từ mặt đất
    scorpions: support.scorpions,
  };
  return { side, mobilization, support };
}

/** Bản gọn giữ nguyên chữ ký cũ cho code chỉ cần phe, không cần bản kê. */
export function playerBattleSide(state: StatData, opts: PlayerSideOptions = {}): BattleSideInput {
  return playerBattleSideDetailed(state, opts).side;
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
