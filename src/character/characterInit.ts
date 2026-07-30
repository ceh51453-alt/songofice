/**
 * Khởi tạo nhân vật (8.5/8.6/8.6b) — dựng StatData đầy đủ từ wizard hoặc canon:
 * point-buy + bonus xuất thân → thiên phú (parseEffect cộng cốt lõi, chỉ phần
 * VÔ ĐIỀU KIỆN — C1) → kỹ năng (gói xuất thân + phân bổ + grant thiên phú) →
 * trang bị/tài sản → engine tính phái sinh → HP/Thể Lực = trần.
 * Kèm: lore entry khởi tạo (constant) + tin nhắn mở đầu + tự trigger AI.
 */
import { makeDefaultState, DRAGON_SIZE_HP, DRAGON_STATS, DRAGON_SKILLS, type StatData, type DragonStat, type DragonSkill, type DragonSize, type WallLine, PATRON_GODS, BLOODLINES } from "../mvu/schema";
import { NpcSchema, lifeStage, type Npc } from "../mvu/npcSchema";
import { parseEffect, recomputeDerived } from "../mvu/effects";
import { clamp } from "../mvu/helpers";
import { newRootSeed } from "../probability/rng";
import { EXCHANGE_RATES } from "../economy/currency";

/**
 * Đơn vị tiền: MỌI bảng nội dung (origins.assets.vang, canon character.gold,
 * giá trang bị) viết theo RỒNG VÀNG cho người đọc dễ hình dung, còn state lưu
 * theo ĐỒNG ĐỎ. Quy đổi đúng MỘT LẦN ở chỗ ghi vào state — trước đây thiếu
 * bước này nên một lãnh chúa "5000 Vàng" thật ra khởi đầu với 0.42 Rồng Vàng
 * và không xây nổi bất cứ công trình nào.
 */
const G = EXCHANGE_RATES.GOLD_TO_COPPER;
import { ORIGINS_BY_ID, type EquipGrant, type OriginDef } from "../content/westeros/origins";
import { CULTURES_BY_ID } from "../content/westeros/cultures";
import { TALENTS_BY_ID, type TalentDef } from "../content/westeros/talents";
import { SKILLS_BY_ID, STARTING_SKILLS_BY_ORIGIN } from "../content/westeros/skills";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { ERAS_BY_ID, parseHookYear, type CanonCharacter, type EraData, type StartingHook } from "../content/westeros/eras";
import { LORE_EQUIPMENT_BY_ID } from "../content/westeros/equipment";
import { STARTING_CRISES } from "../content/westeros/startingCrises";
import { COMPANIONS_BY_ID } from "../content/westeros/companions";
import { MAP_MARKERS } from "../content/westeros/mapMarkers";
import { REGIONS } from "../content/westeros/regions";
import { seedRegionControl, toHouseId, normalizeHouseIds, seedMissingTerrain, repairPlayerSovereignty } from "../territory/territoryEngine";
import { newUnit } from "../strategy/army";
import { newDragon } from "../strategy/dragons";
import { seedVassals } from "../strategy/muster";
import { seedDiplomacy } from "../strategy/diplomacy";
import { seedSellswordMarket } from "../strategy/sellswords";
import { layoutHolding, repairAllHoldings, type BuildPlanItem } from "../territory/localMap";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { loreSeatFor } from "../content/westeros/loreSeats";
import { defaultJobSplit } from "../content/westeros/buildings";
import type { CoreStat } from "../content/westeros/skills";
import type { LoreEntry } from "../lorebook/loreSchema";

export const CORE_STATS: CoreStat[] = ["Sức Mạnh", "Nhanh Nhẹn", "Thể Chất", "Trí Tuệ", "Tinh Tường", "Uy Tín"];

export type Difficulty = "Nhàn Hạ" | "Cân Bằng" | "Chân Thực";

/** Quỹ điểm co giãn theo Độ Khó (8.5). */
export const BUDGETS: Record<Difficulty, { pointBuy: number; skillPoints: number; talentSlots: number }> = {
  "Nhàn Hạ": { pointBuy: 16, skillPoints: 18, talentSlots: 3 },
  "Cân Bằng": { pointBuy: 12, skillPoints: 15, talentSlots: 2 },
  "Chân Thực": { pointBuy: 8, skillPoints: 12, talentSlots: 2 },
};

export function getBudgetMultiplier(age: number): number {
  if (age < 12) return 0.5;
  if (age < 18) return 0.8;
  return 1.0;
}

export function getCalculatedBudgets(difficulty: Difficulty, age: number) {
  const base = BUDGETS[difficulty];
  const mult = getBudgetMultiplier(age);
  return {
    pointBuy: Math.floor(base.pointBuy * mult),
    skillPoints: Math.floor(base.skillPoints * mult),
    talentSlots: base.talentSlots, // Giữ nguyên số slot thiên phú bẩm sinh
  };
}

export const STAT_BASE = 8;
export const STAT_MIN_CREATE = 6;
export const STAT_MAX_CREATE = 15;
export const SKILL_MAX_CREATE = 5;

/** Kỹ năng khởi điểm cộng thêm từ thiên phú (narrative bank ghi rõ — engine áp lúc tạo). */
const TALENT_SKILL_GRANTS: Record<string, Record<string, number>> = {
  "born-swordsman": { "sword-shield": 2 },
  "schemer": { "cunning": 2 },
  "learned": { "lore": 2 },
  "commander-instinct": { "command": 2 },
};

/** Offset Hảo Cảm NPC khởi đầu từ thiên phú (Duyên Quý Nhân +10, Tiếng Xấu −10). */
export function npcAffinityOffset(talentIds: string[]): number {
  let offset = 0;
  if (talentIds.includes("highborn-charm")) offset += 10;
  if (talentIds.includes("ill-reputed")) offset -= 10;
  return offset;
}

// ---------------------------------------------------------------------------
// Point-buy (8.5 Bước 2): 6 chỉ số từ 8, quỹ cố định, hạ tối thiểu 6 lấy điểm,
// trần 15 lúc tạo. Tuyến tính 1 điểm = +1. Khiếm khuyết hoàn |cost| điểm.
// ---------------------------------------------------------------------------
export function pointBuySpent(alloc: Record<CoreStat, number>, loreEquipmentIds: string[] = []): number {
  let spent = 0;
  for (const stat of CORE_STATS) {
    spent += (alloc[stat] ?? STAT_BASE) - STAT_BASE; // âm khi hạ dưới 8 (hoàn điểm)
  }
  for (const eqId of loreEquipmentIds) {
    const eq = LORE_EQUIPMENT_BY_ID[eqId];
    if (eq && eq.pointCost) spent += eq.pointCost;
  }
  return spent;
}

/** Điểm hoàn từ khiếm khuyết đã chọn (cost âm → +|cost| điểm point-buy). */
export function flawRefund(talentIds: string[]): number {
  let refund = 0;
  for (const id of talentIds) {
    const t = TALENTS_BY_ID[id];
    if (t && t.category === "Khiếm Khuyết" && (t.cost ?? 0) < 0) refund += -(t.cost ?? 0);
  }
  return refund;
}

export function validatePointBuy(
  alloc: Record<CoreStat, number>,
  difficulty: Difficulty,
  talentIds: string[],
  age: number,
  loreEquipmentIds: string[] = []
): { ok: boolean; spent: number; budget: number; error?: string } {
  const budget = getCalculatedBudgets(difficulty, age).pointBuy + flawRefund(talentIds);
  for (const stat of CORE_STATS) {
    const v = alloc[stat] ?? STAT_BASE;
    if (v < STAT_MIN_CREATE || v > STAT_MAX_CREATE) return { ok: false, spent: 0, budget, error: `Chỉ số ${stat} ngoài giới hạn.` };
  }
  const spent = pointBuySpent(alloc, loreEquipmentIds);
  if (spent > budget) return { ok: false, spent, budget, error: `Vượt quỹ point-buy (${spent}/${budget}).` };
  return { ok: true, spent, budget };
}

/**
 * Dựng sẵn thành trì trên LƯỚI TẦNG 1 thật (1 ô = 5 m). Bố cục đi qua
 * localMap.layoutHolding nên tôn trọng địa hình của vùng, khuôn viên thật của
 * từng loại công trình và không có hai công trình chồng lên nhau — thay cho
 * cách rải ngẫu nhiên quanh ô 750 của hệ lưới cũ.
 */
export const autoBuildCity = (level: number, holdingId = "holding", regionId = "") => {
  const region = REGIONS_BY_ID[regionId];
  const lore = loreSeatFor(holdingId);
  const plan: BuildPlanItem[] = [
    { type: "Lâu Đài", count: 1, level },
    { type: "Nông Trại", count: level * 2, level: Math.max(1, level - 1) },
    { type: "Chợ", count: level, level: Math.max(1, level - 1) },
    { type: "Doanh Trại", count: level, level: Math.max(1, level - 1) },
  ];
  // Tường thành: toà thành trong lore lấy đúng cấp tường của nó (Storm's End
  // và Winterfell dày hơn hẳn, Castle Black thì không có tường bao); thành
  // thường có tường từ cấp 2 trở lên.
  const wallLevel = lore ? lore.wallLevel : level >= 2 ? Math.max(1, level - 1) : 0;
  if (wallLevel > 0) plan.push({ type: "Tường Thành", count: 1, level: wallLevel });
  if (level >= 2) plan.push({ type: "Sept/Rừng Thần", count: 1, level: Math.max(1, level - 1) });
  if (level >= 4) plan.push({ type: "Học Viện Nhỏ", count: 1, level: Math.max(1, level - 1) });

  return layoutHolding(
    holdingId,
    { terrain: region?.terrain, coastal: region?.coastal, region, lore },
    plan,
  );
};

/**
 * Tường thành có sẵn của một thành trì lúc khởi tạo ván — dựng thành MỘT TUYẾN
 * khép kín theo hệ tường vạch tay (M18). Đa giác 12 cạnh trông tự nhiên hơn hình
 * vuông, và vì nó là dữ liệu riêng nên nâng cấp Lâu Đài về sau không xoá mất nó.
 */
export const autoBuildWalls = (level: number): WallLine[] => {
  if (level < 2) return [];
  const c = 750; // tâm lưới Tầng 1
  const r = 60 + level * 30;
  const sides = 12;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= sides; i++) {
    const th = (i / sides) * Math.PI * 2;
    // bán kính nhấp nhô nhẹ để tường không tròn trịa như compa
    const rr = r * (0.92 + 0.16 * Math.abs(Math.sin(th * 2.5)));
    points.push({ x: Math.round(c + Math.cos(th) * rr), y: Math.round(c + Math.sin(th) * rr) });
  }
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return [{
    "Mã": "wall-keep",
    "Tên": "Tường Thành Cũ",
    "Cấp": Math.max(1, Math.min(4, level - 1)),
    "Vật Liệu": "Đá",
    "Điểm": points,
    "Chiều Dài": Math.round(length),
    "Đang Xây": false,
    "Ngày Xây Còn Lại": 0,
    "Nguyên Vẹn": 100,
  }];
};


/** Số slot thiên phú tích cực: cơ bản theo Độ Khó + 1 slot mỗi khiếm khuyết nhận (8.5 Bước 3). */
export function talentSlots(difficulty: Difficulty, talentIds: string[]): { used: number; max: number } {
  const flaws = talentIds.filter((id) => TALENTS_BY_ID[id]?.category === "Khiếm Khuyết").length;
  const positives = talentIds.filter((id) => TALENTS_BY_ID[id] && TALENTS_BY_ID[id].category !== "Khiếm Khuyết").length;
  return { used: positives, max: BUDGETS[difficulty].talentSlots + flaws };
}

// ---------------------------------------------------------------------------
// Dựng state
// ---------------------------------------------------------------------------
/** Dữ liệu rồng từ wizard — null = không có rồng. */
export interface DragonWizardData {
  name: string;
  color: string;
  size: DragonSize;
  stats: Record<DragonStat, number>;
  skillAllocations: Record<DragonSkill, number>;
  description: string;
}

/** Quỹ điểm rồng lúc tạo. */
export const DRAGON_STAT_BASE = 3;
export const DRAGON_STAT_BUDGET = 8;
export const DRAGON_SKILL_BUDGET = 5;
export const DRAGON_STAT_MAX_CREATE = 12;
export const DRAGON_STAT_MIN_CREATE = 1;
export const DRAGON_SKILL_MAX_CREATE = 3;

export interface WizardData {
  eraId: string;
  houseId: string | null;
  /** Vị thế trong Nhà (Trực hệ, Nhánh phụ, Bề tôi, Kẻ đánh thuê) */
  houseRole?: "Trực hệ" | "Nhánh phụ" | "Bề tôi" | "Kẻ đánh thuê";
  originId: string;
  customOrigin?: OriginDef;
  narrativeMode: "Theo Sát Nguyên Tác" | "Diễn Giải Tự Do";
  scenarioMode: "Người Chơi Là Trung Tâm" | "Người Chơi Là Bối Cảnh";
  difficulty: Difficulty;
  name: string;
  nickname?: string;
  continent: "Westeros" | "Essos";
  culture: string;
  religion: string;
  patronGod: string;
  bloodline: string;
  startingLocation: string;
  customHouseName?: string;
  customHouseWords?: string;
  customHouseSigilKey?: string;
  customForce?: {
    npcs: { 
      id: string; 
      name: string; 
      role: string; 
      statPreset: string;
      nangLuc: { voLuc: number; thongSoai: number; triMuu: number; ngoaiGiao: number };
      tuoi: number;
      netTinhCach: string;
      gioiTinh?: string;
      loai?: string;
      thanHinh?: string;
      nsfw?: string;
      avatarUrl?: string;
    }[];
    units: { id: string; type: string; count: number; commander: string }[];
  };
  /** Danh sách thành viên gia đình được tạo chi tiết */
  familyMembers?: {
    id: string;
    name: string;
    relation: string;
    age: number;
    gioiTinh?: string;
    loai?: string;
    nsfw?: string;
    avatarUrl?: string;
    nangLuc?: { voLuc: number; thongSoai: number; triMuu: number; ngoaiGiao: number };
    persona: {
      ngoaiHinh: string;
      tinhCach: string;
    };
  }[];
  /** Tuổi nhân vật khi bắt đầu (default 25). */
  age: number;
  /** giá trị 6 chỉ số SAU point-buy, TRƯỚC bonus xuất thân. */
  pointBuy: Record<CoreStat, number>;
  /** thiên phú người chơi chọn (không gồm quà xuất thân). */
  talentIds: string[];
  /** phân bổ điểm kỹ năng {skillId: điểm} (trần 5). */
  skillAllocations: Record<string, number>;
  persona: {
    ngoaiHinh: string;
    tinhCach: string;
    tieuSu: string;
    mauMat: string;
    mauToc: string;
    chieuCao: string;
  };
  portraitKey?: string;
  /** null = yên bình; "ai-random" = để AI gieo. */
  crisisId: string | null;
  companionId: string | null;
  companionName?: string;
  companionOverrides?: {
    nangLuc?: { voLuc: number; thongSoai: number; triMuu: number; ngoaiGiao: number };
    tuoi?: number;
    netTinhCach?: string;
    gioiTinh?: string;
    loai?: string;
    thanHinh?: string;
    nsfw?: string;
    avatarUrl?: string;
  };
  hookId: string;
  /** null = không có rồng (era không hỗ trợ hoặc người chơi không chọn). */
  dragon: DragonWizardData | null;
  /** Quan hệ với nhân vật nguyên tác (tuỳ chọn) */
  canonRelation?: {
    characterId: string;
    relation: string;
  };
  /** Danh sách ID trang bị Lore đã chọn */
  loreEquipmentIds?: string[];
  /** Danh sách trang bị tự rèn/đặt rèn */
  customEquipments?: CraftingRequest[];
  /** Tuỳ chỉnh Lãnh Địa khởi điểm */
  hasCustomTerritory?: boolean;
  customTerritoryLevel?: number;
  customTerritoryName?: string;
  customTuocVi?: string;
}

export interface CraftingRequest {
  name: string;
  slot: "Vũ Khí Chính" | "Vũ Khí Phụ" | "Giáp Thân" | "Khiên" | "Vật Phẩm Đặc Biệt";
  material: "Thép Thường" | "Thép Tinh Luyện" | "Thép Valyria" | "Da Thú" | "Sắt Đen";
  crafter: "Bản thân" | "Thợ rèn Qohor" | "Thợ rèn Lâu Đài";
}

function talentToStateEntry(t: TalentDef): Record<string, unknown> {
  return {
    "Loại": t.category,
    "Mô Tả": t.narrative,
    "Hiệu Ứng": t.effect,
    ...(t.condition ? { "Điều Kiện": t.condition } : {}),
    "Ẩn": t.hidden ?? false,
  };
}

function applyEquipment(state: StatData, grants: { slot: EquipGrant["slot"]; ten: string; phamChat: string; thuocTinh: Record<string, number>; dacTinh?: string[]; moTa: string }[]): void {
  for (const g of grants) {
    (state["Trang Bị Đang Mặc"] as Record<string, unknown>)[g.slot] = {
      "Tên": g.ten,
      "Phẩm Chất": g.phamChat,
      "Thuộc Tính": g.thuocTinh,
      "Đặc Tính": g.dacTinh ?? [],
      "Mô Tả": g.moTa,
    };
  }
}

function buildCompanion(archetypeId: string, name: string | undefined, affinityOffset: number, overrides?: { nangLuc?: { voLuc: number; thongSoai: number; triMuu: number; ngoaiGiao: number }; tuoi?: number; netTinhCach?: string; gioiTinh?: string; loai?: string; thanHinh?: string; nsfw?: string }): [string, Npc] | null {
  const arch = COMPANIONS_BY_ID[archetypeId];
  if (!arch) return null;
  const npcName = name?.trim() || arch.name;
  const npc = NpcSchema.parse({
    "Họ Tên": npcName,
    "Chức Vụ": arch.chucVu,
    "Tuổi": overrides?.tuoi ?? arch.tuoi,
    "Độ Hảo Cảm": clamp(arch.haoCam + affinityOffset, -100, 100),
    "Tin Cậy": arch.tinCay,
    "Loại Quan Hệ": arch.loaiQuanHe,
    "Đánh Giá": arch.desc,
    "Giới Tính": overrides?.gioiTinh ?? "Nam",
    "Chủng Tộc": overrides?.loai,
    "Ngoại Hình": overrides?.thanHinh,
    "$NSFW": overrides?.nsfw,
    "Năng Lực": {
      "Võ Lực": overrides?.nangLuc?.voLuc ?? arch.nangLuc.voLuc,
      "Thống Soái": overrides?.nangLuc?.thongSoai ?? arch.nangLuc.thongSoai,
      "Trí Mưu": overrides?.nangLuc?.triMuu ?? arch.nangLuc.triMuu,
      "Ngoại Giao": overrides?.nangLuc?.ngoaiGiao ?? arch.nangLuc.ngoaiGiao,
    },
    "Nét Tính Cách": overrides?.netTinhCach ? overrides.netTinhCach.split(",").map(s => s.trim()) : arch.netTinhCach,
    "Ngân Khố": 2000,
    "Túi Đồ": {},
  });
  return [npcName, npc];
}

/** Áp phần chung: era/settings/world/seed. actualStartYear cho phép hook override. */
function applyBase(state: StatData, era: EraData, d: Pick<WizardData, "narrativeMode" | "scenarioMode" | "difficulty">, actualStartYear?: number): void {
  state["Cài Đặt Ván"]["Thời Kỳ"] = era.id;
  state["Cài Đặt Ván"]["Chế Độ Tường Thuật"] = d.narrativeMode;
  state["Cài Đặt Ván"]["Hướng Kịch Bản"] = d.scenarioMode;
  state["Cài Đặt Ván"]["Độ Khó Chiến Đấu"] = d.difficulty;
  state["Cài Đặt Ván"]["$Bối Cảnh Ẩn"] = era.loreNotes || "";
  state["Thế Giới"]["Năm"] = actualStartYear ?? era.startYear;
  state["Thế Giới"]["Mùa"] = era.startSeason;
  state["Thế Giới"]["Vị Trí"] = era.startLocation;
  state["_engineMeta"]["_Seed Gốc"] = newRootSeed();
}

/** Dựng StatData từ wizard (8.6b). */
export function buildStateFromWizard(d: WizardData): StatData {
  const era = ERAS_BY_ID[d.eraId];
  const origin: OriginDef = d.originId === "custom" && d.customOrigin ? d.customOrigin : ORIGINS_BY_ID[d.originId];
  const cultureDef = CULTURES_BY_ID[d.culture];
  if (!era || !origin) throw new Error(`Era/Xuất thân không hợp lệ: ${d.eraId}/${d.originId}`);
  const hook = era.startingHooks.find((h) => h.id === d.hookId);
  const actualStartYear = parseHookYear(hook, era.startYear);
  const state = makeDefaultState();
  applyBase(state, era, d, actualStartYear);

  // ---- danh tính ----
  const info = state["Thông Tin Nhân Vật"];
  
  if (d.startingLocation) {
    state["Thế Giới"]["Vị Trí"] = d.startingLocation;
  }
  
  info["Họ Tên"] = d.name.trim() || "Vô Danh";
  info["Xuất Thân"] = origin.name;
  info["Tước Vị"] = (d.customTuocVi || origin.tuocVi) as typeof info["Tước Vị"];
  info["Lục Địa"] = d.continent;
  info["Văn Hoá"] = d.culture || "Chưa Rõ";
  info["Tôn Giáo"] = d.religion || "Chưa Rõ";
  info["Thần Bảo Hộ"] = d.patronGod || "";
  info["Huyết Mạch"] = d.bloodline !== "none" ? BLOODLINES.find((b: any) => b.id === d.bloodline)?.name || "Chưa Rõ" : "Không";
  info["Đức Tin"] = 30;
  info["Ân Sủng"] = 10;

  if (d.nickname?.trim()) info["Biệt Danh"] = d.nickname.trim();
  if (d.portraitKey) info["Ảnh Chân Dung"] = d.portraitKey;
  
  if (d.houseId === "custom") {
    info["Nhà"] = "Tùy Chỉnh";
    info["Tên Gia Tộc Tùy Chỉnh"] = d.customHouseName?.trim() || "Gia Tộc Mới";
    info["Khẩu Hiệu"] = d.customHouseWords?.trim();
    if (d.customHouseSigilKey) info["Ảnh Gia Huy"] = d.customHouseSigilKey;
  } else {
    info["Nhà"] = (d.houseId ? (HOUSES_BY_ID[d.houseId]?.schemaName as typeof info["Nhà"]) : "Không Nhà") ?? "Không Nhà";
  }

  state["Persona"]["Ngoại Hình"] = d.persona.ngoaiHinh;
  state["Persona"]["Tính Cách"] = d.persona.tinhCach;
  let tieuSu = d.persona.tieuSu;
  if (d.canonRelation) {
    const canonChar = era.canonCharacters.find(c => c.id === d.canonRelation?.characterId);
    if (canonChar) {
      tieuSu += `\n\n[Quan hệ đặc biệt: Là ${d.canonRelation.relation} của ${canonChar.name}]`;
    }
  }
  state["Persona"]["Tiểu Sử"] = tieuSu;
  state["Persona"]["Đặc Điểm"] = {
    "Màu Mắt": d.persona.mauMat,
    "Màu Tóc": d.persona.mauToc,
    "Chiều Cao": d.persona.chieuCao,
  };

  // ---- tuổi tác ----
  info["Tuổi"] = d.age;
  info["Năm Sinh"] = actualStartYear - d.age;
  info["Giai Đoạn Đời"] = lifeStage(d.age);

  // ---- chỉ số cốt lõi: point-buy + bonus xuất thân (cộng SAU — 8.5 Bước 2) ----
  const core = state["Chỉ Số Cốt Lõi"];
  
  // Buffs khác (tôn giáo/huyết mạch)
  let extraBuffs: Record<string, number> = {};
  if (d.religion && PATRON_GODS[d.religion] && d.patronGod) {
    const god = PATRON_GODS[d.religion].find(g => g.name === d.patronGod);
    if (god && god.buffs) {
      for (const [k, v] of Object.entries(god.buffs)) extraBuffs[k] = (extraBuffs[k] || 0) + (v as number);
    }
  }
  if (d.bloodline && d.bloodline !== "none") {
    const b = BLOODLINES.find((b: any) => b.id === d.bloodline);
    if (b && b.buffs) {
      for (const [k, v] of Object.entries(b.buffs)) extraBuffs[k] = (extraBuffs[k] || 0) + (v as number);
    }
  }

  // Tính tổng chỉ số cốt lõi
  for (const stat of CORE_STATS) {
    const pbBase = d.pointBuy[stat] ?? STAT_BASE;
    const originBonus = origin?.statBonus?.[stat] ?? 0;
    const cultureBonus = cultureDef?.statBonus?.[stat] ?? 0;
    const extraBonus = extraBuffs[stat] ?? 0;
    core[stat] = clamp(pbBase + originBonus + cultureBonus + extraBonus, 1, 20);
  }

  // ---- thiên phú: quà xuất thân + chọn; effect VÔ ĐIỀU KIỆN cộng cốt lõi (C1) ----
  const allTalentIds = [...new Set([...origin.giftTalentIds, ...d.talentIds])];
  for (const id of allTalentIds) {
    const t = TALENTS_BY_ID[id];
    if (!t) continue;
    (state["Thiên Phú"] as Record<string, unknown>)[t.name] = talentToStateEntry(t);
    if (!t.condition && !t.hidden) {
      for (const eff of parseEffect(t.effect)) {
        if ((CORE_STATS as string[]).includes(eff.key)) {
          core[eff.key as CoreStat] = clamp(core[eff.key as CoreStat] + eff.delta, 1, 20);
        }
      }
    }
  }

  // ---- kỹ năng: gói xuất thân + phân bổ (trần 5) + grant thiên phú ----
  const skillLevels: Record<string, number> = {};
  for (const [skillId, lv] of Object.entries(STARTING_SKILLS_BY_ORIGIN[origin.id] ?? {})) {
    skillLevels[skillId] = (skillLevels[skillId] ?? 0) + lv;
  }
  for (const [skillId, pts] of Object.entries(d.skillAllocations)) {
    skillLevels[skillId] = (skillLevels[skillId] ?? 0) + Math.min(pts, SKILL_MAX_CREATE);
  }
  for (const id of allTalentIds) {
    for (const [skillId, lv] of Object.entries(TALENT_SKILL_GRANTS[id] ?? {})) {
      skillLevels[skillId] = (skillLevels[skillId] ?? 0) + lv;
    }
  }
  for (const [skillId, lv] of Object.entries(skillLevels)) {
    const def = SKILLS_BY_ID[skillId];
    if (!def || lv <= 0) continue;
    (state["Kỹ Năng"] as Record<string, unknown>)[def.name] = {
      "Cấp": clamp(lv, 0, 10),
      "Kinh Nghiệm": 0,
      "Nhóm": def.group,
    };
  }

  // ---- trang bị + túi đồ + tài sản (gói xuất thân — ánh xạ state 8.5 Bước 1) ----
  applyEquipment(state, origin.equipment);
  for (const item of origin.items) {
    (state["Túi Đồ"] as Record<string, unknown>)[item.ten] = { "Số Lượng": item.soLuong, "Mô Tả": item.moTa };
  }
  
  let startingGold = origin.assets.vang;

  // Áp dụng trang bị Lore
  if (d.loreEquipmentIds) {
    for (const loreId of d.loreEquipmentIds) {
      const loreDef = LORE_EQUIPMENT_BY_ID[loreId];
      if (loreDef) {
        if (loreDef.goldCost) startingGold = Math.max(0, startingGold - loreDef.goldCost);
        (state["Trang Bị Đang Mặc"] as Record<string, unknown>)[loreDef.slot] = { ...loreDef.itemData };
      }
    }
  }

  // Áp dụng trang bị Tự Rèn
  if (d.customEquipments) {
    for (const custom of d.customEquipments) {
      let cost = 100;
      let phamChat = "Thường";
      let dmg = 2;
      let def = 2;
      let traits = ["tự rèn"];
      
      if (custom.material === "Thép Tinh Luyện") { cost += 300; phamChat = "Tinh Xảo"; dmg += 2; def += 2; }
      else if (custom.material === "Thép Valyria") { cost += 2000; phamChat = "Thép Valyria"; dmg += 4; def += 4; traits.push("valyrian"); }
      
      if (custom.crafter === "Thợ rèn Qohor") { cost += 500; phamChat = phamChat === "Thường" ? "Tinh Xảo" : "Thượng Hạng"; dmg += 1; def += 1; traits.push("chế tác hoàn mỹ"); }
      
      startingGold = Math.max(0, startingGold - cost);
      
      (state["Trang Bị Đang Mặc"] as Record<string, unknown>)[custom.slot] = {
        "Tên": custom.name,
        "Phẩm Chất": phamChat,
        "Chất Liệu": custom.material,
        "Người Rèn": custom.crafter,
        "Thuộc Tính": custom.slot.includes("Vũ Khí") ? { "Sát Thương Cận": dmg } : { "Phòng Thủ": def },
        "Đặc Tính": traits,
        "Mô Tả": `Một món đồ được đặt làm riêng bởi ${custom.crafter}.`,
        "VisualClass": custom.slot.includes("Vũ Khí") ? "sword" : custom.slot === "Giáp Thân" ? "heavy-armor" : custom.slot === "Khiên" ? "cape" : "default",
        "VisualColor": custom.material === "Thép Valyria" ? "#222" : custom.material === "Thép Tinh Luyện" ? "#aaa" : custom.material === "Da Thú" ? "#8B4513" : "#777"
      };
    }
  }

  info["Ngân Khố"] = startingGold * G; // bảng ghi Rồng Vàng → state giữ Đồng Đỏ
  
  if (d.hasCustomTerritory && d.customTerritoryName) {
    const lvl = d.customTerritoryLevel || 1;
    const basePop = 5000;
    const pop = basePop * lvl;
    const factor = lvl;
    const cost = lvl === 3 ? 3000 : lvl === 2 ? 1000 : 0;
    info["Ngân Khố"] = Math.max(0, (info["Ngân Khố"] as number) - cost * G);
    
    (state["Lãnh Địa"] as Record<string, unknown>)[d.customTerritoryName] = {
      "Nhà Kiểm Soát": toHouseId(d.houseId || d.customHouseName || "Vô Danh"),
      "Người Kiểm Soát": d.name,
      "Tình Trạng": "Ổn Định",
      "Mô Tả": `Thành trì của ${d.name}`,
      "Dân Số": pop,
      "Dân Số Chi Tiết": defaultJobSplit(pop),
      "Lòng Dân": 80,
      "Trung Thành": 80,
      "Dự Trữ Lương Thực": 1000 * factor,
      "Thu Nhập Bình Quân": 10 * factor,
      "Sự Kiện Đặc Biệt": [],
      "Tài Nguyên": { 
          "Vàng": 1000 * factor, 
          "Lương Thực": 5000 * factor, 
          "Gỗ": 1000 * factor, 
          "Đá": 1000 * factor, 
          "Quặng Sắt": 500 * factor 
      },
      "Vật Phẩm": {},
      "Điểm Khám Phá": [],
      "Pháp Lệnh": {},
      "Tường Thành": [],
      "Đường Đi": [],
      "Khủng Hoảng": [],
      "Thuộc Vùng": d.startingLocation || state["Thế Giới"]["Vị Trí"],
      "Ven Biển": REGIONS_BY_ID[d.startingLocation || state["Thế Giới"]["Vị Trí"]]?.coastal ?? false,
      "Công Trình": autoBuildCity(lvl, d.customTerritoryName, d.startingLocation || state["Thế Giới"]["Vị Trí"]),
    };
    
    // Đăng ký vùng này thuộc về người chơi
    if (!state["Chủ Quyền Lãnh Thổ"]) state["Chủ Quyền Lãnh Thổ"] = {};
    const regionId = d.startingLocation || state["Thế Giới"]["Vị Trí"];
    if (!state["Chủ Quyền Lãnh Thổ"][regionId]) {
      state["Chủ Quyền Lãnh Thổ"][regionId] = { "Nhà Kiểm Soát": "Không Rõ", "Người Kiểm Soát": "Không Rõ", "Tình Trạng": "Ổn Định", "Là Của Người Chơi": true, "_Ngày Đổi Chủ": 0 };
    }
    state["Chủ Quyền Lãnh Thổ"][regionId]["Nhà Kiểm Soát"] = toHouseId(d.houseId || d.customHouseName || "Vô Danh");
    state["Chủ Quyền Lãnh Thổ"][regionId]["Là Của Người Chơi"] = true;
  } else if (origin.assets.lanhDia) {
    const regionId = d.startingLocation || state["Thế Giới"]["Vị Trí"];
    (state["Lãnh Địa"] as Record<string, unknown>)[origin.assets.lanhDia.ten] = {
      "Mô Tả": origin.assets.lanhDia.moTa,
      "Dân Số": origin.assets.lanhDia.danSo,
      "Trung Thành": origin.assets.lanhDia.trungThanh,
      "Tài Nguyên": { "Ngân Khố": 0, "Lương Thực": origin.assets.luongThuc, "Gỗ": 300, "Đá": 300, "Quặng Sắt": 150 },
      "Khủng Hoảng": [],
      "Thuộc Vùng": regionId,
      "Ven Biển": REGIONS_BY_ID[regionId]?.coastal ?? false,
      "Người Kiểm Soát": d.name,
      "Công Trình": autoBuildCity(3, origin.assets.lanhDia.ten, regionId),
    };

    if (!state["Chủ Quyền Lãnh Thổ"]) state["Chủ Quyền Lãnh Thổ"] = {};
    if (!state["Chủ Quyền Lãnh Thổ"][regionId]) {
      state["Chủ Quyền Lãnh Thổ"][regionId] = { "Nhà Kiểm Soát": "Không Rõ", "Người Kiểm Soát": "Không Rõ", "Tình Trạng": "Ổn Định", "Là Của Người Chơi": true, "_Ngày Đổi Chủ": 0 };
    }
    state["Chủ Quyền Lãnh Thổ"][regionId]["Nhà Kiểm Soát"] = toHouseId(d.houseId || d.customHouseName || "Vô Danh");
    state["Chủ Quyền Lãnh Thổ"][regionId]["Là Của Người Chơi"] = true;
    state["Chủ Quyền Lãnh Thổ"][regionId]["Người Kiểm Soát"] = d.name;
  }

  // ---- danh vọng khởi điểm (Bước 7 / 16.4) ----
  const rep = state["Danh Vọng"];
  rep["Vinh Dự"] = origin.reputation.vinhDu ?? 0;
  rep["Nhân Từ"] = origin.reputation.nhanTu ?? 0;
  rep["Uy Dũng"] = origin.reputation.uyDung ?? 0;
  rep["Xảo Quyệt"] = origin.reputation.xaoQuyet ?? 0;
  
  if (cultureDef && cultureDef.reputationBonus) {
    if (cultureDef.reputationBonus.vinhDu) rep["Vinh Dự"] += cultureDef.reputationBonus.vinhDu;
    if (cultureDef.reputationBonus.nhanTu) rep["Nhân Từ"] += cultureDef.reputationBonus.nhanTu;
    if (cultureDef.reputationBonus.uyDung) rep["Uy Dũng"] += cultureDef.reputationBonus.uyDung;
    if (cultureDef.reputationBonus.xaoQuyet) rep["Xảo Quyệt"] += cultureDef.reputationBonus.xaoQuyet;
  }

  // ---- tâm phúc (Bước 8) ----
  if (d.companionId) {
    const comp = buildCompanion(d.companionId, d.companionName, npcAffinityOffset(allTalentIds), d.companionOverrides);
    if (comp) {
      if (d.companionOverrides?.avatarUrl) {
        comp[1]["Ảnh Chân Dung"] = d.companionOverrides.avatarUrl;
      }
      (state["Mối Quan Hệ"]["NPC Chính"] as Record<string, Npc>)[comp[0]] = comp[1];
    }
  }

  // ---- rồng (nếu có — gate theo Era hasMagic) ----
  if (d.dragon) {
    const drg = d.dragon;
    const hpMax = DRAGON_SIZE_HP[drg.size] + (drg.stats["Giáp Vảy"] ?? DRAGON_STAT_BASE) * 20;
    const skillRecord: Record<string, number> = {};
    for (const sk of DRAGON_SKILLS) {
      const lv = drg.skillAllocations[sk] ?? 0;
      if (lv > 0) skillRecord[sk] = clamp(lv, 0, 10);
    }
    const riderName = d.name.trim() || "Vô Danh";
    (state["Rồng"] as Record<string, unknown>)[drg.name || "Rồng Vô Danh"] = newDragon({
      "Tên": drg.name || "Rồng Vô Danh",
      "Kích Cỡ": drg.size,
      "Kỵ Sĩ": riderName,
      "Tình Trạng": "Khỏe",
      "_HP": hpMax,
      "_HP Tối Đa": hpMax,
      "Màu Sắc": drg.color || "Đen",
      "Tuổi": drg.size === "Non" ? 1 : drg.size === "Trưởng Thành" ? 30 : 100,
      "Chỉ Số": Object.fromEntries(DRAGON_STATS.map((s) => [s, clamp(drg.stats[s] ?? DRAGON_STAT_BASE, 1, 20)])) as never,
      "Kỹ Năng": skillRecord,
      "Mô Tả": drg.description || "",
      "Nhà": state["Thông Tin Nhân Vật"]["Nhà"] ?? "",
      "Đồn Trú": d.startingLocation || "",
      "Trạng Thái Thu Phục": "Đã Có Chủ",
      "Mức Độ Thuần Hóa": 85,
      "Độ Hảo Cảm": { [riderName]: 70 },
    });
  }

  // ---- chủ quyền lãnh thổ theo Era (9.6.1); migrate holding gói xuất thân ----
  seedRegionControl(state, era.id, { createIfMissing: false });

  // ---- Tùy chỉnh thế lực: Quân số & NPC ----
  if (d.houseId === "custom" && d.customForce) {
    for (const u of d.customForce.units) {
      (state["Biên Chế Quân Sự"] as Record<string, unknown>)[u.id] = newUnit(u.type as never, u.count, "Chính Quy", {
        "Tướng Chỉ Huy": u.commander?.trim() || "Tạm Khuyết",
        "Nhà": state["Thông Tin Nhân Vật"]["Nhà"] ?? "",
        "Huấn Luyện": "Thành Thạo",
        "Kinh Nghiệm": 45,
        "Lãnh Địa Đồn Trú": d.startingLocation || state["Thế Giới"]["Vị Trí"],
      });
    }
    for (const n of d.customForce.npcs) {
      (state["Tướng Lĩnh"] as Record<string, unknown>)[n.id] = {
        "Họ Tên": n.name?.trim() || "Vô Danh",
        "Chức Vụ": n.role,
        "Tuổi": n.tuoi || 30,
        "Giới Tính": n.gioiTinh || "Nam",
        "Chủng Tộc": n.loai,
        "Ngoại Hình": n.thanHinh,
        "$NSFW": n.nsfw,
        "Ảnh Chân Dung": n.avatarUrl,
        "Độ Hảo Cảm": 50,
        "Tin Cậy": true,
        "Loại Quan Hệ": "Gia Thần",
        "Đánh Giá": "Được tuyển mộ từ lúc khởi nghiệp",
        "Năng Lực": {
          "Võ Lực": n.nangLuc?.voLuc ?? 10,
          "Thống Soái": n.nangLuc?.thongSoai ?? 10,
          "Trí Mưu": n.nangLuc?.triMuu ?? 10,
          "Ngoại Giao": n.nangLuc?.ngoaiGiao ?? 10,
        },
        "Nét Tính Cách": n.netTinhCach ? n.netTinhCach.split(",").map(s => s.trim()) : ["Trung Thành"],
      };
    }
  }

  // ---- Gia đình (Bước 2 mới) ----
  if (d.familyMembers && d.familyMembers.length > 0) {
    if (!state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]) {
      state["Mối Quan Hệ"]["Thành Viên Gia Tộc"] = {};
    }
    let familyLore = "\n\n[Gia đình & Tông tộc]:\n";
    let hiddenFamilyNotes = `\n\nGia phả nhân vật chính (${d.name}):\n`;
    for (const member of d.familyMembers) {
      const npcName = member.name.trim() || "Người thân vô danh";
      familyLore += `- ${member.relation}: ${npcName} (${member.age} tuổi). Ngoại hình: ${member.persona.ngoaiHinh || 'Bình thường'}. Tính cách: ${member.persona.tinhCach || 'Chưa rõ'}.\n`;
      hiddenFamilyNotes += `- ${npcName}: ${member.relation} của ${d.name} (${d.houseId ? HOUSES_BY_ID[d.houseId]?.name : 'Không Nhà'}).\n`;
      (state["Mối Quan Hệ"]["Thành Viên Gia Tộc"] as Record<string, unknown>)[member.id] = {
        "Họ Tên": npcName,
        "Tuổi": member.age,
        "Giới Tính": member.gioiTinh || "Nam",
        "Chủng Tộc": member.loai,
        "Loại Quan Hệ": member.relation,
        "Ngoại Hình": member.persona.ngoaiHinh,
        "Tính Cách": member.persona.tinhCach,
        "$NSFW": member.nsfw,
        "Ảnh Chân Dung": member.avatarUrl,
        "Năng Lực": member.nangLuc ? {
          "Võ Lực": member.nangLuc.voLuc,
          "Thống Soái": member.nangLuc.thongSoai,
          "Trí Mưu": member.nangLuc.triMuu,
          "Ngoại Giao": member.nangLuc.ngoaiGiao,
        } : undefined,
        "Độ Hảo Cảm": 80,
        "Tin Cậy": true,
      };
    }
    state["Persona"]["Tiểu Sử"] += familyLore;
    state["Cài Đặt Ván"]["$Bối Cảnh Ẩn"] += hiddenFamilyNotes;
  }



  // ---- phái sinh + đầy sinh tồn (8.6b bước 5) ----
  recomputeDerived(state);
  state["Chỉ Số Sinh Tồn"]["HP"] = state["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  state["Chỉ Số Sinh Tồn"]["Thể Lực"] = state["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"];
  // Chuẩn hoá dữ liệu bản đồ đa tầng: khoá Nhà đúng định dạng, GIEO địa thế cho
  // từng lãnh địa (mỗi ván một vùng đất khác nhưng vẫn đúng chất của vùng), rồi
  // bố trí lại công trình cho hợp địa hình và không chồng lấn.
  normalizeHouseIds(state);
  // cờ "vùng này của ta" phải chốt SAU khi đã biết Nhà của nhân vật (M20)
  repairPlayerSovereignty(state);
  seedMissingTerrain(state);
  repairAllHoldings(state);
  // Quân sự phong kiến (M19): bảng chư hầu của các vùng ta nắm + chợ lính quanh đây
  seedVassals(state);
  seedSellswordMarket(state);
  // Bản đồ chính trị (M20): mở quan hệ ngoại giao với mọi Nhà đã có thái độ
  seedDiplomacy(state);

  return state;
}

function adjustCanonCharacterByAge(original: CanonCharacter, targetAge: number, actualStartYear: number): CanonCharacter {
  const c = JSON.parse(JSON.stringify(original)) as CanonCharacter;
  
  // Normalize core stats keys to Vietnamese for easier processing
  const statMap: Record<string, CoreStat> = { 'STR': 'Sức Mạnh', 'AGI': 'Nhanh Nhẹn', 'END': 'Thể Chất', 'INT': 'Trí Tuệ', 'WIL': 'Tinh Tường', 'CHA': 'Uy Tín' };
  for (const [en, vn] of Object.entries(statMap)) {
    if ((c.coreStats as Record<string, number>)[en] !== undefined) {
      (c.coreStats as Record<string, number>)[vn] = (c.coreStats as Record<string, number>)[en];
      delete (c.coreStats as Record<string, number>)[en];
    }
  }

  // 1. Core stats scaling
  if (targetAge < 18) {
    const physMult = Math.max(0.1, targetAge / 18);
    const mentMult = Math.max(0.1, Math.min(1, targetAge / 14));
    for (const stat of (['Sức Mạnh', 'Nhanh Nhẹn', 'Thể Chất'] as CoreStat[])) {
      c.coreStats[stat] = Math.max(1, Math.floor((c.coreStats[stat] || 10) * physMult));
    }
    for (const stat of (['Trí Tuệ', 'Tinh Tường', 'Uy Tín'] as CoreStat[])) {
      c.coreStats[stat] = Math.max(1, Math.floor((c.coreStats[stat] || 10) * mentMult));
    }
    if (targetAge < 8) {
      for (const stat of (Object.keys(c.coreStats) as CoreStat[])) {
        c.coreStats[stat] = Math.min(c.coreStats[stat] as number, 6);
      }
    }
  } else if (targetAge > original.age + 15 && targetAge > 50) {
    const ageDiff = targetAge - Math.max(50, original.age);
    const drop = Math.floor(ageDiff / 10);
    if (drop > 0) {
      for (const stat of (['Sức Mạnh', 'Nhanh Nhẹn', 'Thể Chất'] as CoreStat[])) {
        c.coreStats[stat] = Math.max(1, (c.coreStats[stat] as number || 10) - drop);
      }
      for (const stat of (['Trí Tuệ', 'Tinh Tường'] as CoreStat[])) {
        c.coreStats[stat] = Math.min(20, (c.coreStats[stat] as number || 10) + Math.floor(drop / 2));
      }
    }
  }

  // 2. Skills scaling
  let skillCap = 20;
  if (targetAge < 10) skillCap = 2;
  else if (targetAge < 14) skillCap = 8;
  else if (targetAge < 18) skillCap = 14;

  for (const sk in c.skills) {
    c.skills[sk] = Math.min(c.skills[sk], skillCap);
    if (c.skills[sk] <= 0) delete c.skills[sk];
  }

  // 3. Holdings, Army, Equipment, Gold
  if (targetAge < 16) {
    c.startArmy = undefined;
    c.startHoldings = undefined;
    c.startRegions = undefined;
    
    c.gold = Math.max(0, Math.floor(c.gold * (targetAge / 25)));

    c.equipment = c.equipment.filter(eq => {
      const isValyrian = eq.phamChat === 'Thép Valyria' || (eq.dacTinh && eq.dacTinh.includes('valyrian'));
      return !isValyrian;
    });

    if (c.tuocVi === 'Lãnh Chúa' || c.tuocVi === 'Vua') {
      c.tuocVi = 'Người Thừa Kế';
    }
  }

  // 4. Dragon scaling
  if (c.dragon && original.birthYear !== undefined) {
    const yearDiff = actualStartYear - original.birthYear - original.age;
    c.dragon.age += yearDiff;
    
    if (c.dragon.age <= 0) {
      c.dragon = undefined;
      c.items.push({ ten: 'Trứng Rồng', soLuong: 1, moTa: 'Một quả trứng rồng chưa nở.' });
    } else {
      if (c.dragon.age < 5) c.dragon.size = 'Non';
      else if (c.dragon.age < 20) c.dragon.size = 'Trưởng Thành';
      else c.dragon.size = 'Khổng Lồ (Balerion-class)';
      
      const dragonMult = c.dragon.age / (original.dragon?.age || 1);
      if (dragonMult < 1) {
        for (const stat in c.dragon.stats) {
          c.dragon.stats[stat as DragonStat] = Math.max(1, Math.floor((c.dragon.stats[stat as DragonStat] || 10) * dragonMult));
        }
      } else {
        for (const stat in c.dragon.stats) {
          c.dragon.stats[stat as DragonStat] = Math.min(20, (c.dragon.stats[stat as DragonStat] || 10) + Math.floor((c.dragon.age - (original.dragon?.age || 0)) / 20));
        }
      }
    }
  }

  return c;
}

/** Dựng StatData từ nhân vật canon (8.4b) — chỉ số khoá theo nguyên tác. */

function autoAssignBloodlineAndCulture(house: string, name: string): { bloodline: string, culture: string } {
  const h = (house || "").trim();
  if (["Targaryen", "Velaryon", "Celtigar", "Blackfyre"].includes(h) || name.includes("Targaryen")) return { bloodline: "Máu Valyria Cổ Đại", culture: "Valyrian" };
  if (["Stark", "Bolton", "Umber", "Karstark", "Mormont", "Glover", "Dustin", "Reed", "Tallhart", "Ryswell", "Blackwood", "Royce", "Dayne"].includes(h) || name.includes("Stark")) return { bloodline: "Máu Tiền Nhân", culture: "First Men" };
  if (["Greyjoy", "Harlaw", "Goodbrother", "Drumm", "Botley", "Blacktyde"].includes(h)) return { bloodline: "Máu Ironborn", culture: "Ironborn" };
  if (["Martell", "Yronwood", "Fowler", "Manwoody", "Gargalen", "Uller", "Qorgyle", "Toland"].includes(h)) return { bloodline: "Máu Rhoynar", culture: "Dornish" };
  if (!h || h === "Không Rõ") return { bloodline: "Không Rõ Huyết Mạch", culture: "Thường Dân" };
  return { bloodline: "Máu Andal", culture: "Andal" };
}

export function buildStateFromCanon(
  c: CanonCharacter,
  era: EraData,
  modes: Pick<WizardData, "narrativeMode" | "scenarioMode" | "difficulty">,
  extras?: { persona?: WizardData["persona"]; portraitKey?: string; hookId?: string; customStartYear?: number },
): StatData {
  const hook = extras?.hookId ? (era.startingHooks.find((h) => h.id === extras.hookId) || c.personalHooks?.find((h) => h.id === extras.hookId)) : undefined;
  const actualStartYear = extras?.customStartYear ?? parseHookYear(hook, era.startYear);
  const state = makeDefaultState();
  applyBase(state, era, modes, actualStartYear);

  // Tuổi tính theo năm bắt đầu thực (hook year)
  const canonAge = c.birthYear !== undefined
    ? Math.max(0, actualStartYear - c.birthYear)
    : c.age;

  // Điểu chỉnh nhân vật (thay đổi c) dựa theo năm
  const adjustedC = adjustCanonCharacterByAge(c, canonAge, actualStartYear);

  const info = state["Thông Tin Nhân Vật"];
  info["Họ Tên"] = adjustedC.name;
  info["Nhà"] = adjustedC.house as typeof info["Nhà"];
  info["Xuất Thân"] = adjustedC.role;
  info["Tước Vị"] = (adjustedC.tuocVi as any) || "Thường Dân";
  info["Lục Địa"] = "Westeros";
  const bc = autoAssignBloodlineAndCulture(adjustedC.house as string, adjustedC.name);
  info["Văn Hoá"] = (adjustedC as any).culture || bc.culture;
  info["Huyết Mạch"] = (adjustedC as any).bloodline || bc.bloodline;
  info["Tôn Giáo"] = c.religion || "Thất Diện Thần";
  info["Thần Bảo Hộ"] = "";
  info["Đức Tin"] = 30;
  info["Ân Sủng"] = 10;
  if (info["Tôn Giáo"] && PATRON_GODS[info["Tôn Giáo"]]) {
    info["Thần Bảo Hộ"] = PATRON_GODS[info["Tôn Giáo"]][0]?.name || "";
  }
  info["Ngân Khố"] = c.gold * G; // canon character.gold viết theo Rồng Vàng
  
  if (c.startResources) {
    info["Tài Nguyên Gia Tộc"] = { 
      "Gỗ": c.startResources["Gỗ"] || 0,
      "Quặng Sắt": c.startResources["Quặng Sắt"] || 0,
      "Đá": c.startResources["Đá"] || 0,
      "Lương Thực": c.startResources["Lương Thực"] || 0,
      "Ngựa": c.startResources["Ngựa"] || 0,
      "Thép Valyria": c.startResources["Thép Valyria"] || 0
    };
  } else {
    // Nếu chưa có, gán mặc định để tránh lỗi undefined
    info["Tài Nguyên Gia Tộc"] = {
      "Gỗ": 0, "Quặng Sắt": 0, "Đá": 0, "Lương Thực": 0, "Ngựa": 0, "Thép Valyria": 0
    };
  }
  
  if (c.startDebts) {
    for (const [creditor, debtInfo] of Object.entries(c.startDebts)) {
      state["Các Khoản Nợ"][creditor] = {
        "Nợ Gốc": debtInfo.amount,
        "Lãi/Tháng": debtInfo.interest,
        "Tháng Còn Lại": debtInfo.duration,
        "Đang Quỵt": false
      };
    }
  }

  // ---- tuổi tác ----
  info["Tuổi"] = canonAge;
  if (c.birthYear !== undefined) info["Năm Sinh"] = c.birthYear;
  info["Giai Đoạn Đời"] = lifeStage(canonAge);
  if (extras?.portraitKey) info["Ảnh Chân Dung"] = extras.portraitKey;
  if (extras?.persona) {
    state["Persona"]["Ngoại Hình"] = extras.persona.ngoaiHinh;
    state["Persona"]["Tính Cách"] = extras.persona.tinhCach;
    state["Persona"]["Tiểu Sử"] = extras.persona.tieuSu;
  } else {
    state["Persona"]["Tiểu Sử"] = adjustedC.blurb;
  }

  const core = state["Chỉ Số Cốt Lõi"];
  for (const stat of CORE_STATS) core[stat] = clamp(adjustedC.coreStats[stat] as number || 10, 1, 20);
  // canon: chỉ số đã là con số CUỐI đúng nguyên tác — thiên phú chỉ thêm nhãn/narrative,
  // KHÔNG cộng effect vào cốt lõi lần nữa (tránh double-count)
  for (const id of adjustedC.talentIds) {
    const t = TALENTS_BY_ID[id];
    if (t) (state["Thiên Phú"] as Record<string, unknown>)[t.name] = talentToStateEntry(t);
  }
  for (const [skillId, lv] of Object.entries(adjustedC.skills)) {
    const def = SKILLS_BY_ID[skillId];
    if (!def) continue;
    (state["Kỹ Năng"] as Record<string, unknown>)[def.name] = { "Cấp": clamp(lv, 0, 10), "Kinh Nghiệm": 0, "Nhóm": def.group };
  }
  applyEquipment(state, adjustedC.equipment);
  for (const item of adjustedC.items) {
    (state["Túi Đồ"] as Record<string, unknown>)[item.ten] = { "Số Lượng": item.soLuong, "Mô Tả": item.moTa };
  }

  // ---- rồng canon (nếu có) ----
  if (adjustedC.dragon) {
    const drg = adjustedC.dragon;
    const hpMax = DRAGON_SIZE_HP[drg.size] + (drg.stats["Giáp Vảy"] ?? 3) * 20;
    let loc = "dragonstone";
    if (adjustedC.startHoldings?.[0]) loc = adjustedC.startHoldings[0];
    else if (adjustedC.startRegions?.[0]) loc = `${adjustedC.startRegions[0]}-seat`;

    // RỒNG LÀ BINH CHỦNG RIÊNG (M19): chỉ ghi vào bảng "Rồng", KHÔNG nhét thêm
    // một bản sao vào "Biên Chế Quân Sự" — làm vậy thì chiến lực đếm rồng hai
    // lần mà tab Rồng vẫn trống.
    (state["Rồng"] as Record<string, unknown>)[drg.name] = newDragon({
      "Tên": drg.name,
      "Kích Cỡ": drg.size,
      "Kỵ Sĩ": adjustedC.name,
      "Tình Trạng": "Khỏe",
      "_HP": hpMax,
      "_HP Tối Đa": hpMax,
      "Màu Sắc": drg.color,
      "Tuổi": drg.age,
      "Chỉ Số": { ...drg.stats },
      "Kỹ Năng": { ...drg.skills },
      "Mô Tả": drg.description,
      "Nhà": adjustedC.house,
      "Đồn Trú": loc,
      "Nơi Ổ": loc,
      "Trạng Thái Thu Phục": "Đã Có Chủ",
      "Mức Độ Thuần Hóa": 85,
      "Độ Hảo Cảm": { [adjustedC.name]: 70 },
    });
  }

  // ---- thiết lập Triều Đình nguyên tác ----
  if (["Quốc Vương", "Vua", "Vua Bảy Vương Quốc", "Hoàng Đế"].includes(adjustedC.tuocVi)) {
    state["Triều Đình"]["Có Liên Quan"] = true;
    state["Triều Đình"]["Quyền Bổ Nhiệm"] = true;
    state["Triều Đình"]["Triều Đình Của"] = adjustedC.name;
    
    // Quét các nhân vật trong Era có liege là nhân vật này
    for (const npc of era.canonCharacters) {
      if (npc.liege === c.id) {
        // Thêm vào Tướng Lĩnh
        (state["Tướng Lĩnh"] as Record<string, unknown>)[npc.id] = {
          "Họ Tên": npc.name,
          "Chức Vụ": npc.role,
          "Tuổi": npc.age,
          "Độ Hảo Cảm": 80,
          "Tin Cậy": true,
          "Loại Quan Hệ": "Gia Thần",
          "Đánh Giá": npc.blurb,
          "Năng Lực": npc.năngLực || {
             "Võ Lực": npc.coreStats["Sức Mạnh"] ?? 30,
             "Thống Soái": npc.coreStats["Uy Tín"] ?? 30,
             "Trí Mưu": npc.coreStats["Trí Tuệ"] ?? 30,
             "Ngoại Giao": npc.coreStats["Tinh Tường"] ?? 30
          },
          "Chỉ Số Cốt Lõi": npc.coreStats,
          "Kỹ Năng": npc.skills || {},
          "Thiên Phú": npc.talentIds || [],
          "Nét Tính Cách": ["Trung Thành"],
        };
        // Gán vào Tiểu Hội Đồng nếu có chức vụ
        if (npc.courtPosition && (npc.courtPosition in state["Triều Đình"]["Tiểu Hội Đồng"])) {
          (state["Triều Đình"]["Tiểu Hội Đồng"] as any)[npc.courtPosition]["Người Giữ Chức"] = npc.name;
        }
      }
    }
  } else if (adjustedC.liege) {
    const liegeChar = era.canonCharacters.find(ch => ch.id === adjustedC.liege);
    if (liegeChar) {
      state["Triều Đình"]["Có Liên Quan"] = true;
      state["Triều Đình"]["Triều Đình Của"] = liegeChar.name;
      if (adjustedC.courtPosition) {
        state["Triều Đình"]["Chức Vụ Người Chơi"] = adjustedC.courtPosition;
        if (adjustedC.courtPosition in state["Triều Đình"]["Tiểu Hội Đồng"]) {
          (state["Triều Đình"]["Tiểu Hội Đồng"] as any)[adjustedC.courtPosition]["Người Giữ Chức"] = adjustedC.name;
        }
      }
    }
  }

  // canon: lãnh chúa cai quản vùng quê → mở holding nếu kiểm soát (9.6.1/10.1)
  seedRegionControl(state, era.id, { createIfMissing: true });

  // ---- Cập nhật tài sản khởi điểm tuỳ chỉnh của nhân vật (nếu có) ----
  const allCharacters = [adjustedC, ...era.canonCharacters.filter(ch => ch.id !== c.id)];

  for (const char of allCharacters) {
    const isPlayer = char.id === adjustedC.id;

    if (char.startRegions) {
      for (const rid of char.startRegions) {
        if (state["Chủ Quyền Lãnh Thổ"][rid]) {
          state["Chủ Quyền Lãnh Thổ"][rid]["Nhà Kiểm Soát"] = toHouseId(char.house);
          state["Chủ Quyền Lãnh Thổ"][rid]["Người Kiểm Soát"] = char.name;
          if (isPlayer) {
            state["Chủ Quyền Lãnh Thổ"][rid]["Là Của Người Chơi"] = true;
          }
        }
      }
    }

    if (char.startHoldings) {
      for (const sid of char.startHoldings) {
        // Thành trì đã được trao cho NGƯỜI CHƠI (seedRegionControl mở trọng trấn
        // vùng quê) thì nhân vật canon khác không được giành lấy — nếu không,
        // lãnh chúa do người chơi đóng lại thành kẻ không tấc đất trong chính
        // toà thành của mình.
        if (!isPlayer && state["Lãnh Địa"][sid]?.["Người Kiểm Soát"] === adjustedC.name) continue;
        const marker = MAP_MARKERS.find(m => m.id === sid);
        const regionSeat = REGIONS.find(r => r.id + "-seat" === sid || r.seat === marker?.name);
        
        let basePop = 5000;
        if (regionSeat && regionSeat.seatPopulation) {
             basePop = regionSeat.seatPopulation;
        } else if (marker && marker.population) {
             basePop = marker.population;
        }
        
        const lvl = char.holdingsLevel?.[sid] || 1;
        const pop = basePop * lvl;
        const factor = lvl;
        const popMulti = Math.max(1, Math.floor(pop / 5000));
        
        let regionId = "the-crownlands"; // default fallback
        if (regionSeat) {
          regionId = regionSeat.id;
        } else if (marker && marker.regionId) {
          regionId = marker.regionId;
        } else if (sid.endsWith("-seat")) {
          regionId = sid.replace("-seat", "");
        }
        
        const REGION_RESOURCE_MODIFIERS: Record<string, { gold: number, food: number, wood: number, stone: number, iron: number }> = {
          "the-north": { gold: 0.5, food: 0.8, wood: 1.5, stone: 1.2, iron: 1.0 },
          "the-westerlands": { gold: 3.0, food: 1.0, wood: 0.8, stone: 1.2, iron: 1.5 },
          "the-reach": { gold: 1.5, food: 2.0, wood: 1.0, stone: 1.0, iron: 0.8 },
          "the-vale": { gold: 1.0, food: 1.0, wood: 0.8, stone: 2.0, iron: 1.0 },
          "the-riverlands": { gold: 1.0, food: 1.5, wood: 1.2, stone: 0.8, iron: 0.8 },
          "the-iron-islands": { gold: 0.5, food: 0.5, wood: 0.2, stone: 1.5, iron: 2.0 },
          "the-stormlands": { gold: 0.8, food: 1.0, wood: 1.5, stone: 1.5, iron: 1.0 },
          "the-crownlands": { gold: 1.2, food: 1.0, wood: 0.8, stone: 1.0, iron: 0.8 },
          "dorne": { gold: 1.2, food: 0.8, wood: 0.5, stone: 1.2, iron: 0.8 },
        };
        const rMod = REGION_RESOURCE_MODIFIERS[regionId] || { gold: 1, food: 1, wood: 1, stone: 1, iron: 1 };
        
        state["Lãnh Địa"][sid] = {
          "Thuộc Vùng": regionId,
          "Nhà Kiểm Soát": toHouseId(char.house),
          "Người Kiểm Soát": char.name,
          "Tình Trạng": "Ổn Định",
          "Mô Tả": marker?.name || (regionSeat?.seat) || sid,
          "Dân Số": pop,
          "Dân Số Chi Tiết": defaultJobSplit(pop),
          "Lòng Dân": 80,
          "Trung Thành": 80,
          "Dự Trữ Lương Thực": Math.floor(1000 * popMulti * rMod.food),
          "Thu Nhập Bình Quân": 10 * factor,
          "Sự Kiện Đặc Biệt": [],
          "Tài Nguyên": {
              "Ngân Khố": Math.floor(1000 * popMulti * rMod.gold) * G,
              "Lương Thực": Math.floor(5000 * popMulti * rMod.food),
              "Gỗ": Math.floor(1000 * popMulti * rMod.wood),
              "Đá": Math.floor(1000 * popMulti * rMod.stone),
              "Quặng Sắt": Math.floor(500 * popMulti * rMod.iron),
              "Than Đá": Math.floor(300 * popMulti * rMod.iron),
              "Thép": Math.floor(120 * popMulti * rMod.iron),
              "Vải Vóc": Math.floor(250 * popMulti),
              "Ngựa": Math.floor(40 * popMulti),
              "Muối": Math.floor(200 * popMulti * rMod.food),
          },
          "Vật Phẩm": {},
          "Điểm Khám Phá": [],
          // điểm tài nguyên để rỗng: engine gieo bằng thuật toán theo địa hình
          // ngay lần đầu mở lãnh địa, rồi ghi lại vào save (resourceNodes.ts)
          "Điểm Tài Nguyên": [],
          "Gợi Ý Địa Thế": {
            "Gần Sông": false, "Gần Biển": REGIONS_BY_ID[regionId]?.coastal ?? false,
            "Trên Núi": false, "Tài Nguyên Sẵn Có": [], "Ghi Chú": "",
          },
          "Nhà Ở Sẵn Có": 0, // engine ghim ≈95% dân số ở lần chốt sổ đầu tiên
          "Sức Chứa Dân Cư": 0,
          "Vô Gia Cư": 0,
          "Pháp Lệnh": {},
          "Tường Thành": autoBuildWalls(lvl),
          "Đường Đi": [],
          "Khủng Hoảng": [],
          "Ven Biển": REGIONS_BY_ID[regionId]?.coastal ?? false,
          "Địa Hình": REGIONS_BY_ID[regionId]?.terrain,
          "Công Trình": autoBuildCity(lvl, sid, regionId),
        };
      }
    }
  }

  const createRichArmies = (chId: string, name: string, house: string, totalSize: number, quality: string, loc: string, canonChar?: CanonCharacter) => {
    if (canonChar?.startArmies || canonChar?.startFleets) {
      if (canonChar.startArmies) {
        for (const a of canonChar.startArmies) {
          state["Biên Chế Quân Sự"][a.name] = newUnit(a.type as any, a.size, "Chính Quy", {
            "Tướng Chỉ Huy": name,
            "Nhà": house,
            "Hậu Cần": "Dồi Dào",
            "Sĩ Khí": "Hăng Hái",
            "Huấn Luyện": a.quality as any,
            "Lãnh Địa Đồn Trú": loc,
            // quân nguyên tác đã đứng dưới cờ từ lâu — có kinh nghiệm sẵn
            "Kinh Nghiệm": a.quality === "Tinh Nhuệ" ? 80 : a.quality === "Thành Thạo" ? 45 : 15,
          });
        }
      }
      if (canonChar.startFleets) {
        for (const f of canonChar.startFleets) {
          state["Hạm Đội"][f.name] = {
            "Đô Đốc": name,
            "Nhà": house as any,
            "Số Chiến Thuyền": f.size,
            "Loại Hạm": (f.type || (house === "Greyjoy" ? "Thuyền Dài (Greyjoy)" : "Chiến Thuyền Nặng")) as any,
            "Tình Trạng": "Sẵn Sàng",
            "Lãnh Địa Neo Đậu": loc,
            "Bộ Binh Trên Thuyền": 0,
            "Đang Phong Toả": undefined
          };
        }
      }
      return;
    }

    let armyCount = 0;
    const addArmy = (type: string, fraction: number) => {
      if (fraction <= 0) return;
      const size = Math.max(1, Math.floor(totalSize * fraction));
      if (size === 0) return;
      armyCount++;
      // quân thường trực của một Nhà lớn: phần lõi là chính quy, phần đông đảo
      // phía sau vẫn là dân phục dịch — đúng cách Westeros ra trận
      const branch = armyCount === 1 ? "Chính Quy" : "Phục Dịch";
      state["Biên Chế Quân Sự"][`army_${chId}_${armyCount}`] = newUnit(type as any, size, branch, {
        "Tướng Chỉ Huy": name,
        "Nhà": house,
        "Hậu Cần": "Dồi Dào",
        "Sĩ Khí": "Hăng Hái",
        "Huấn Luyện": quality as any,
        "Lãnh Địa Đồn Trú": loc,
        "Kinh Nghiệm": quality === "Tinh Nhuệ" ? 80 : quality === "Thành Thạo" ? 45 : 15,
        // dân đã đứng dưới cờ từ trước khi ván bắt đầu — cho một kỳ nghĩa vụ dài
        // để người chơi kịp hiểu luật trước khi phải trả họ về ruộng
        ...(branch === "Phục Dịch" ? { "Hạn Phục Dịch Còn Lại": 180 } : {}),
      });
    };

    const addFleet = (size: number) => {
      if (size <= 0) return;
      state["Hạm Đội"][`fleet_${chId}`] = {
        "Đô Đốc": name,
        "Nhà": house as any,
        "Số Chiến Thuyền": size,
        "Loại Hạm": house === "Greyjoy" ? "Thuyền Dài (Greyjoy)" : "Chiến Thuyền Nặng",
        "Tình Trạng": "Sẵn Sàng",
        "Lãnh Địa Neo Đậu": loc,
        "Bộ Binh Trên Thuyền": 0,
        "Đang Phong Toả": undefined
      };
    };

    if (house === "Lannister") {
      addArmy("Bộ Binh", 0.7);
      addArmy("Kỵ Binh", 0.2);
      addArmy("Trường Thương", 0.1);
      addFleet(20);
    } else if (house === "Stark") {
      addArmy("Bộ Binh", 0.8);
      addArmy("Kỵ Binh Nhẹ", 0.2);
    } else if (house === "Greyjoy") {
      addArmy("Người Sắt (Ironborn)", 1.0);
      addFleet(150);
    } else if (house === "Tyrell") {
      addArmy("Bộ Binh", 0.6);
      addArmy("Kỵ Binh", 0.4);
      addFleet(80);
    } else if (house === "Martell") {
      addArmy("Trường Thương", 0.7);
      addArmy("Kỵ Binh Nhẹ", 0.3);
    } else if (house === "Targaryen") {
      addArmy("Bộ Binh", 0.7);
      addArmy("Kỵ Binh", 0.3);
      addFleet(50);
    } else if (house === "Arryn") {
      addArmy("Bộ Binh", 0.6);
      addArmy("Kỵ Binh", 0.4);
    } else if (house === "Baratheon") {
      addArmy("Bộ Binh", 0.7);
      addArmy("Kỵ Binh", 0.3);
      addFleet(60);
    } else if (house === "Velaryon") {
      addArmy("Bộ Binh", 0.7);
      addFleet(Math.floor(totalSize / 50));
    } else if (house === "Redwyne") {
      addArmy("Bộ Binh", 0.6);
      addFleet(Math.floor(totalSize / 40));
    } else if (house === "Hightower") {
      addArmy("Bộ Binh", 0.7);
      addArmy("Kỵ Binh", 0.3);
      addFleet(Math.floor(totalSize / 200));
    } else if (house === "Manderly") {
      addArmy("Bộ Binh", 0.8);
      addArmy("Kỵ Binh", 0.2);
      addFleet(Math.floor(totalSize / 100));
    } else {
      addArmy("Bộ Binh", 1.0);
    }
  };

  if (adjustedC.startHoldings && adjustedC.startHoldings.length > 0) {
    const totalSize = adjustedC.startArmy?.size || 0;
    const quality = adjustedC.startArmy?.quality || "Thành Thạo";
    createRichArmies(adjustedC.id, adjustedC.name, adjustedC.house as string, totalSize, quality, adjustedC.startHoldings[0], adjustedC);
  }

  // ---- TỰ ĐỘNG KHỞI TẠO QUÂN ĐỘI VÀ LÃNH ĐỊA LORE CHO TẤT CẢ PHE PHÁI ----
  // Dựa trên nguyên tác, các Đại Lãnh Chúa luôn có quân đội và lãnh thổ cụ thể, dù họ không phải là người chơi.
  const factionLoreDefaults: Record<string, { size: number, quality: string, seat: string, region: string }> = {
    "Stark": { size: 30000, quality: "Thành Thạo", seat: "the-north-seat", region: "the-north" },
    "Lannister": { size: 40000, quality: "Tinh Nhuệ", seat: "the-westerlands-seat", region: "the-westerlands" },
    "Tyrell": { size: 80000, quality: "Đồng Bộ Chỉnh Tề", seat: "the-reach-seat", region: "the-reach" },
    "Baratheon": { size: 25000, quality: "Thành Thạo", seat: "the-stormlands-seat", region: "the-stormlands" },
    "Martell": { size: 30000, quality: "Thành Thạo", seat: "dorne-seat", region: "dorne" },
    "Arryn": { size: 35000, quality: "Thành Thạo", seat: "the-vale-seat", region: "the-vale" },
    "Tully": { size: 20000, quality: "Mới Lập Đội", seat: "the-riverlands-seat", region: "the-riverlands" },
    "Greyjoy": { size: 15000, quality: "Thành Thạo", seat: "the-iron-islands-seat", region: "the-iron-islands" },
    "Targaryen": { size: 10000, quality: "Tinh Nhuệ", seat: "the-crownlands-seat", region: "the-crownlands" },
    "Hoare": { size: 18000, quality: "Thành Thạo", seat: "the-riverlands-seat", region: "the-riverlands" },
    "Durrandon": { size: 25000, quality: "Thành Thạo", seat: "the-stormlands-seat", region: "the-stormlands" },
    "Gardener": { size: 70000, quality: "Đồng Bộ Chỉnh Tề", seat: "the-reach-seat", region: "the-reach" }
  };

  for (const ch of era.canonCharacters) {
    if (ch.id === c.id) continue; // Bỏ qua người chơi vì đã được xử lý
    
    // Chỉ cấp quân cho Đại Lãnh Chúa, Quốc Vương, Vua, hoặc Lãnh Chúa (tuỳ thời kỳ)
    if (["Đại Lãnh Chúa", "Quốc Vương", "Vua", "Vua Bảy Vương Quốc", "Hoàng Đế"].includes(ch.tuocVi)) {
      const def = factionLoreDefaults[ch.house];
      if (def) {
        // Cấp chủ quyền
        state["Chủ Quyền Lãnh Thổ"][def.region] = {
          "Nhà Kiểm Soát": ch.house,
          "Người Kiểm Soát": ch.name,
          "Là Của Người Chơi": false,
          "Tình Trạng": "Ổn Định",
          "_Ngày Đổi Chủ": 0
        };
        
        const loc = ch.startHoldings?.[0] || def.seat;
        const totalSize = ch.startArmy?.size || def.size;
        const quality = ch.startArmy?.quality || def.quality;
        createRichArmies(ch.id, ch.name, ch.house, totalSize, quality, loc, ch);
      }
    }
  }

  // (Thu nhập baseIncome được ẩn ý qua Lãnh Địa hoặc engine tính sau)

  // ---- Xử lý gia phả và các mối quan hệ lore ----
  const familyList = [
    adjustedC.father, adjustedC.mother, adjustedC.spouse,
    ...(adjustedC.children || []), ...(adjustedC.siblings || [])
  ].filter(Boolean) as string[];

  // Nếu người chơi có quan hệ gia đình, chúng ta tạo NpcSchema cho họ nếu họ chưa có
  for (const relId of familyList) {
    const relChar = era.canonCharacters.find(ch => ch.id === relId);
    let name = relChar ? relChar.name : relId;
    let house = relChar ? relChar.house : adjustedC.house;
    (state["Mối Quan Hệ"]["Thành Viên Gia Tộc"] as Record<string, unknown>)[name] = {
      "Họ Tên": name,
      "Nhà": house,
      "Tuổi": relChar?.age ?? 30,
      "Độ Hảo Cảm": 60,
      "Tin Cậy": 50,
      "Loại Quan Hệ": ["Người Thân"],
      "Còn Sống": true,
      "Đánh Giá": relChar?.blurb || "Thành viên gia tộc.",
      "Ngân Khố": relChar?.gold != null ? relChar.gold * G : 5000 * G,
      "Túi Đồ": {},
      "Huyết Thống Thật Sự": {
        "Cha/Mẹ": [relChar?.secretBiologicalFather, relChar?.secretBiologicalMother].filter(Boolean) as string[],
        "Con Cái": []
      },
      "Năng Lực": relChar?.năngLực || {
        "Võ Lực": relChar?.coreStats?.["Sức Mạnh"] ?? 30,
        "Thống Soái": relChar?.coreStats?.["Uy Tín"] ?? 30,
        "Trí Mưu": relChar?.coreStats?.["Trí Tuệ"] ?? 30,
        "Ngoại Giao": relChar?.coreStats?.["Tinh Tường"] ?? 30
      },
      "Chỉ Số Cốt Lõi": relChar?.coreStats || { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
      "Kỹ Năng": relChar?.skills || {},
      "Thiên Phú": relChar?.talentIds || [],
      "Mạng Lưới Quan Hệ": relChar?.relationshipDetails ? 
        Object.fromEntries(
          Object.entries(relChar.relationshipDetails).map(([k, v]) => [k, {
            "Loại Quan Hệ": v.type || "Khác",
            "Độ Hảo Cảm": v.affinity ?? 0,
            "Độ Tin Cậy": v.trust ?? 0,
            "Công Khai": !v.type?.includes("(Bí mật)"),
            "Chi Tiết": v.detail
          }])
        ) : {}
    };
  }
  
  if (adjustedC.allies) {
    for (const relId of adjustedC.allies) {
      const relChar = era.canonCharacters.find(ch => ch.id === relId);
      let name = relChar ? relChar.name : relId;
      (state["Mối Quan Hệ"]["NPC Chính"] as Record<string, unknown>)[name] = {
        "Họ Tên": name,
        "Tuổi": relChar?.age ?? 30,
        "Độ Hảo Cảm": 80,
        "Tin Cậy": 80,
        "Loại Quan Hệ": ["Đồng Minh", "Bằng Hữu"],
        "Còn Sống": true,
        "Đánh Giá": relChar?.blurb || "Đồng minh thân cận.",
        "Ngân Khố": relChar?.gold != null ? relChar.gold * G : 5000 * G,
        "Túi Đồ": {},
        "Huyết Thống Thật Sự": {
          "Cha/Mẹ": [relChar?.secretBiologicalFather, relChar?.secretBiologicalMother].filter(Boolean) as string[],
          "Con Cái": []
        },
        "Năng Lực": relChar?.năngLực || {
          "Võ Lực": relChar?.coreStats?.["Sức Mạnh"] ?? 30,
          "Thống Soái": relChar?.coreStats?.["Uy Tín"] ?? 30,
          "Trí Mưu": relChar?.coreStats?.["Trí Tuệ"] ?? 30,
          "Ngoại Giao": relChar?.coreStats?.["Tinh Tường"] ?? 30
        },
        "Chỉ Số Cốt Lõi": relChar?.coreStats || { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
        "Kỹ Năng": relChar?.skills || {},
        "Thiên Phú": relChar?.talentIds || [],
        "Mạng Lưới Quan Hệ": relChar?.relationshipDetails ? 
          Object.fromEntries(
            Object.entries(relChar.relationshipDetails).map(([k, v]) => [k, {
              "Loại Quan Hệ": v.type || "Khác",
              "Độ Hảo Cảm": v.affinity ?? 0,
              "Độ Tin Cậy": v.trust ?? 0,
              "Công Khai": !v.type?.includes("(Bí mật)"),
              "Chi Tiết": v.detail
            }])
          ) : {}
      };
    }
  }

  if (adjustedC.rivals) {
    for (const relId of adjustedC.rivals) {
      const relChar = era.canonCharacters.find(ch => ch.id === relId);
      let name = relChar ? relChar.name : relId;
      (state["Mối Quan Hệ"]["NPC Chính"] as Record<string, unknown>)[name] = {
        "Họ Tên": name,
        "Tuổi": relChar?.age ?? 30,
        "Độ Hảo Cảm": -80,
        "Tin Cậy": -80,
        "Loại Quan Hệ": ["Kẻ Thù", "Đối Thủ"],
        "Còn Sống": true,
        "Đánh Giá": relChar?.blurb || "Kẻ thù không đội trời chung.",
        "Ngân Khố": relChar?.gold != null ? relChar.gold * G : 5000 * G,
        "Túi Đồ": {},
        "Huyết Thống Thật Sự": {
          "Cha/Mẹ": [relChar?.secretBiologicalFather, relChar?.secretBiologicalMother].filter(Boolean) as string[],
          "Con Cái": []
        },
        "Mạng Lưới Quan Hệ": relChar?.relationshipDetails ? 
          Object.fromEntries(
            Object.entries(relChar.relationshipDetails).map(([k, v]) => [k, {
              "Loại Quan Hệ": v.type || "Khác",
              "Độ Hảo Cảm": v.affinity ?? 0,
              "Độ Tin Cậy": v.trust ?? 0,
              "Công Khai": !v.type?.includes("(Bí mật)"),
              "Chi Tiết": v.detail
            }])
          ) : {}
      };
    }
  }


  recomputeDerived(state);
  state["Chỉ Số Sinh Tồn"]["HP"] = state["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  state["Chỉ Số Sinh Tồn"]["Thể Lực"] = state["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"];
  // Chuẩn hoá dữ liệu bản đồ đa tầng: khoá Nhà đúng định dạng, GIEO địa thế cho
  // từng lãnh địa (mỗi ván một vùng đất khác nhưng vẫn đúng chất của vùng), rồi
  // bố trí lại công trình cho hợp địa hình và không chồng lấn.
  normalizeHouseIds(state);
  // cờ "vùng này của ta" phải chốt SAU khi đã biết Nhà của nhân vật (M20)
  repairPlayerSovereignty(state);
  seedMissingTerrain(state);
  repairAllHoldings(state);
  // Quân sự phong kiến (M19): bảng chư hầu của các vùng ta nắm + chợ lính quanh đây
  seedVassals(state);
  seedSellswordMarket(state);
  // Bản đồ chính trị (M20): mở quan hệ ngoại giao với mọi Nhà đã có thái độ
  seedDiplomacy(state);

  return state;
}

// ---------------------------------------------------------------------------
// Lore khởi tạo + tin nhắn mở đầu (8.6)
// ---------------------------------------------------------------------------
export function buildInitLoreEntry(state: StatData, era: EraData, hook: StartingHook | null, crisisDesc: string | null): LoreEntry {
  const info = state["Thông Tin Nhân Vật"];
  const persona = state["Persona"];
  const lines = [
    `[Bối cảnh ván chơi — luôn ghi nhớ]`,
    `Thời Kỳ: ${era.name} (${era.yearRange}). ${era.blurb}`,
    `Nhân vật chính: ${info["Họ Tên"]}${info["Biệt Danh"] ? ` "${info["Biệt Danh"]}"` : ""}, Nhà ${info["Nhà"]}, xuất thân ${info["Xuất Thân"]}.`,
    `${info["Lục Địa"] === "Essos" ? `Lục địa: Essos` : `Lục địa: Westeros`}`,
    `Văn hoá: ${info["Văn Hoá"]}, Tôn giáo: ${info["Tôn Giáo"]}`,
    `Ngoại hình: ${persona["Ngoại Hình"]}, Tính cách: ${persona["Tính Cách"]}, Tiểu sử: ${persona["Tiểu Sử"]}.`,
    `Đặc điểm chi tiết: Màu mắt (${persona["Đặc Điểm"]?.["Màu Mắt"] || "không rõ"}), Màu tóc (${persona["Đặc Điểm"]?.["Màu Tóc"] || "không rõ"}), Chiều cao (${persona["Đặc Điểm"]?.["Chiều Cao"] || "không rõ"}).`,
    ...Object.entries(state["Rồng"]).map(([, drg]) =>
      `Rồng: ${drg["Tên"]} (${drg["Kích Cỡ"]}, màu ${drg["Màu Sắc"]}, ${drg["Tuổi"]} tuổi). HP ${drg["_HP"]}/${drg["_HP Tối Đa"]}. ` +
      `Chỉ số: ${DRAGON_STATS.map((s) => `${s} ${drg["Chỉ Số"][s]}`).join(", ")}.`),
    hook ? `Điểm bắt đầu: ${hook.title} (${hook.year}) — ${hook.desc}` : "",
    crisisDesc ? `KHỦNG HOẢNG HIỆN TẠI (khai triển ngay từ lượt đầu): ${crisisDesc}` : "",
    `Chế độ tường thuật: ${state["Cài Đặt Ván"]["Chế Độ Tường Thuật"]}. Hướng kịch bản: ${state["Cài Đặt Ván"]["Hướng Kịch Bản"]}.`,
    "",
    `⚠️ LUẬT THỜI KỲ — TUYỆT ĐỐI KHÔNG VI PHẠM:`,
    `• Ngươi KHÔNG BIẾT bất kỳ sự kiện nào xảy ra SAU năm ${state["Thế Giới"]["Năm"]} AC.`,
    `• Ngươi KHÔNG BIẾT nhân vật chưa sinh hoặc chưa nổi danh trong thời kỳ này.`,
    `• Ngươi KHÔNG ĐƯỢC nhắc đến, ám chỉ, hay tiên tri về sự kiện tương lai dưới bất kỳ hình thức nào.`,
    `• Kiến thức của mọi nhân vật chỉ giới hạn trong: sự kiện đã xảy ra + tin đồn + truyền thuyết PHÙ HỢP thời kỳ ${era.name}.`,
    `• Nếu người chơi hỏi về sự kiện chưa xảy ra, nhân vật trả lời "không ai biết được" hoặc đưa ra suy đoán hợp lý dựa trên bối cảnh hiện tại.`,
  ].filter(Boolean);

  return {
    uid: "session#init",
    sourceId: "session",
    sourceName: "Khởi tạo ván",
    keys: [],
    secondaryKeys: [],
    content: lines.join("\n"),
    comment: "Bối cảnh khởi tạo ván chơi",
    constant: true,
    selective: false,
    selectiveLogic: "AND_ANY",
    order: 0,
    position: "before",
    depth: 4,
    role: "system",
    disabled: false,
    probability: 100,
    excludeRecursion: false,
    preventRecursion: true,
    delayUntilRecursion: false,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    ignoreBudget: true,
  };
}

export function buildOpeningMessage(state: StatData, era: EraData, hook: StartingHook | null, crisisDesc: string | null): string {
  const info = state["Thông Tin Nhân Vật"];
  const parts = [
    `[Bắt đầu ván chơi] Ta là ${info["Họ Tên"]}${info["Biệt Danh"] ? ` "${info["Biệt Danh"]}"` : ""}, ${info["Xuất Thân"]}${info["Nhà"] !== "Không Nhà" ? ` của Nhà ${info["Nhà"]}` : ""}.`,
    `Bối cảnh: ${era.name}, năm ${state["Thế Giới"]["Năm"]} AC, tại ${state["Thế Giới"]["Vị Trí"]}.`,
    ...Object.entries(state["Rồng"]).map(([, drg]) => `Ta có rồng tên ${drg["Tên"]} — ${drg["Kích Cỡ"]}, màu ${drg["Màu Sắc"]}.`),
    hook ? `Tình huống mở màn: ${hook.desc}` : "",
    crisisDesc ? `Tình thế của ta: ${crisisDesc}` : "",
    `Hãy mở đầu câu chuyện — dựng cảnh, đưa ta vào khoảnh khắc này, và để diễn biến bắt đầu.`,
  ].filter(Boolean);
  return parts.join("\n");
}

export function resolveCrisisDesc(crisisId: string | null): string | null {
  if (!crisisId) return null;
  if (crisisId === "ai-random") return "Hãy tự gieo một biến cố khởi đầu kịch tính phù hợp với hồ sơ nhân vật.";
  return STARTING_CRISES.find((c) => c.id === crisisId)?.desc ?? null;
}
