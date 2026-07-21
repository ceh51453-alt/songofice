/**
 * Khởi tạo nhân vật (8.5/8.6/8.6b) — dựng StatData đầy đủ từ wizard hoặc canon:
 * point-buy + bonus xuất thân → thiên phú (parseEffect cộng cốt lõi, chỉ phần
 * VÔ ĐIỀU KIỆN — C1) → kỹ năng (gói xuất thân + phân bổ + grant thiên phú) →
 * trang bị/tài sản → engine tính phái sinh → HP/Thể Lực = trần.
 * Kèm: lore entry khởi tạo (constant) + tin nhắn mở đầu + tự trigger AI.
 */
import { makeDefaultState, DRAGON_SIZE_HP, DRAGON_STATS, DRAGON_SKILLS, type StatData, type DragonStat, type DragonSkill, type DragonSize, PATRON_GODS, BLOODLINES } from "../mvu/schema";
import { NpcSchema, lifeStage, type Npc } from "../mvu/npcSchema";
import { parseEffect, recomputeDerived } from "../mvu/effects";
import { clamp } from "../mvu/helpers";
import { newRootSeed } from "../probability/rng";
import { ORIGINS_BY_ID, type EquipGrant, type OriginDef } from "../content/westeros/origins";
import { TALENTS_BY_ID, type TalentDef } from "../content/westeros/talents";
import { SKILLS_BY_ID, STARTING_SKILLS_BY_ORIGIN } from "../content/westeros/skills";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { ERAS_BY_ID, parseHookYear, type CanonCharacter, type EraData, type StartingHook } from "../content/westeros/eras";
import { STARTING_CRISES } from "../content/westeros/startingCrises";
import { COMPANIONS_BY_ID } from "../content/westeros/companions";
import { seedRegionControl } from "../territory/territoryEngine";
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
export function pointBuySpent(alloc: Record<CoreStat, number>): number {
  let spent = 0;
  for (const stat of CORE_STATS) {
    spent += (alloc[stat] ?? STAT_BASE) - STAT_BASE; // âm khi hạ dưới 8 (hoàn điểm)
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
): { ok: boolean; spent: number; budget: number; error?: string } {
  const budget = BUDGETS[difficulty].pointBuy + flawRefund(talentIds);
  for (const stat of CORE_STATS) {
    const v = alloc[stat] ?? STAT_BASE;
    if (v < STAT_MIN_CREATE || v > STAT_MAX_CREATE) {
      return { ok: false, spent: 0, budget, error: `${stat} phải trong ${STAT_MIN_CREATE}–${STAT_MAX_CREATE}` };
    }
  }
  const spent = pointBuySpent(alloc);
  if (spent > budget) return { ok: false, spent, budget, error: `Vượt quỹ điểm (${spent}/${budget})` };
  return { ok: true, spent, budget };
}

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
  originId: string;
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
    npcs: { id: string; name: string; role: string; statPreset: string }[];
    units: { id: string; type: string; count: number; commander: string }[];
  };
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
  hookId: string;
  /** null = không có rồng (era không hỗ trợ hoặc người chơi không chọn). */
  dragon: DragonWizardData | null;
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

function buildCompanion(archetypeId: string, name: string | undefined, affinityOffset: number): [string, Npc] | null {
  const arch = COMPANIONS_BY_ID[archetypeId];
  if (!arch) return null;
  const npcName = name?.trim() || arch.name;
  const npc = NpcSchema.parse({
    "Họ Tên": npcName,
    "Chức Vụ": arch.chucVu,
    "Tuổi": arch.tuoi,
    "Độ Hảo Cảm": clamp(arch.haoCam + affinityOffset, -100, 100),
    "Tin Cậy": arch.tinCay,
    "Loại Quan Hệ": arch.loaiQuanHe,
    "Đánh Giá": arch.desc,
    "Năng Lực": {
      "Võ Lực": arch.nangLuc.voLuc,
      "Thống Soái": arch.nangLuc.thongSoai,
      "Trí Mưu": arch.nangLuc.triMuu,
      "Ngoại Giao": arch.nangLuc.ngoaiGiao,
    },
    "Nét Tính Cách": arch.netTinhCach,
  });
  return [npcName, npc];
}

/** Áp phần chung: era/settings/world/seed. actualStartYear cho phép hook override. */
function applyBase(state: StatData, era: EraData, d: Pick<WizardData, "narrativeMode" | "scenarioMode" | "difficulty">, actualStartYear?: number): void {
  state["Cài Đặt Ván"]["Thời Kỳ"] = era.id;
  state["Cài Đặt Ván"]["Chế Độ Tường Thuật"] = d.narrativeMode;
  state["Cài Đặt Ván"]["Hướng Kịch Bản"] = d.scenarioMode;
  state["Cài Đặt Ván"]["Độ Khó Chiến Đấu"] = d.difficulty;
  state["Thế Giới"]["Năm"] = actualStartYear ?? era.startYear;
  state["Thế Giới"]["Mùa"] = era.startSeason;
  state["Thế Giới"]["Vị Trí"] = era.startLocation;
  state["_engineMeta"]["_Seed Gốc"] = newRootSeed();
}

/** Dựng StatData từ wizard (8.6b). */
export function buildStateFromWizard(d: WizardData): StatData {
  const era = ERAS_BY_ID[d.eraId];
  const origin: OriginDef = ORIGINS_BY_ID[d.originId];
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
  state["Persona"]["Tiểu Sử"] = d.persona.tieuSu;
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
  for (const stat of CORE_STATS) {
    core[stat] = clamp((d.pointBuy[stat] ?? STAT_BASE) + (origin.statBonus[stat] ?? 0) + (extraBuffs[stat] ?? 0), 1, 20);
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
        // key phái sinh (Sát Thương Cận, Tải Trọng...) do recomputeDerived cộng qua talentBonusFor
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
  info["Vàng"] = origin.assets.vang;
  // luongThuc: đẩy vào kho Tài Nguyên lãnh địa (nếu có); nếu không có lãnh địa, bỏ qua
  // thuNhapKy / chiPhiKy: giờ do economy engine tính động (M12), không ghi tĩnh nữa
  if (origin.assets.lanhDia) {
    (state["Lãnh Địa"] as Record<string, unknown>)[origin.assets.lanhDia.ten] = {
      "Mô Tả": origin.assets.lanhDia.moTa,
      "Dân Số": origin.assets.lanhDia.danSo,
      "Trung Thành": origin.assets.lanhDia.trungThanh,
      "Tài Nguyên": { "Vàng": 0, "Lương Thực": origin.assets.luongThuc, "Gỗ": 300, "Đá": 300, "Quặng Sắt": 150 },
      "Khủng Hoảng": [],
    };
  }

  // ---- danh vọng khởi điểm (Bước 7 / 16.4) ----
  const rep = state["Danh Vọng"];
  rep["Vinh Dự"] = origin.reputation.vinhDu ?? 0;
  rep["Nhân Từ"] = origin.reputation.nhanTu ?? 0;
  rep["Uy Dũng"] = origin.reputation.uyDung ?? 0;
  rep["Xảo Quyệt"] = origin.reputation.xaoQuyet ?? 0;

  // ---- tâm phúc (Bước 8) ----
  if (d.companionId) {
    const comp = buildCompanion(d.companionId, d.companionName, npcAffinityOffset(allTalentIds));
    if (comp) (state["Mối Quan Hệ"]["NPC Chính"] as Record<string, Npc>)[comp[0]] = comp[1];
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
    (state["Rồng"] as Record<string, unknown>)[drg.name || "Rồng Vô Danh"] = {
      "Tên": drg.name || "Rồng Vô Danh",
      "Kích Cỡ": drg.size,
      "Kỵ Sĩ": d.name.trim() || "Vô Danh",
      "Tình Trạng": "Khỏe",
      "_HP": hpMax,
      "_HP Tối Đa": hpMax,
      "Màu Sắc": drg.color || "Đen",
      "Tuổi": drg.size === "Non" ? 1 : drg.size === "Trưởng Thành" ? 30 : 100,
      "Chỉ Số": Object.fromEntries(DRAGON_STATS.map((s) => [s, clamp(drg.stats[s] ?? DRAGON_STAT_BASE, 1, 20)])),
      "Kỹ Năng": skillRecord,
      "Mô Tả": drg.description || "",
    };
  }

  // ---- chủ quyền lãnh thổ theo Era (9.6.1); migrate holding gói xuất thân ----
  seedRegionControl(state, era.id, { createIfMissing: false });

  // ---- Tùy chỉnh thế lực: Quân số & NPC ----
  if (d.houseId === "custom" && d.customForce) {
    for (const u of d.customForce.units) {
      (state["Biên Chế Quân Sự"] as Record<string, unknown>)[u.id] = {
        "Tướng Chỉ Huy": u.commander?.trim() || "Tạm Khuyết",
        "Số Lượng": u.count,
        "Loại Quân": u.type,
        "Thành Phần": {},
        "Hậu Cần": "Cầm Cự Được",
        "Sĩ Khí": "Ổn Định",
        "Trang Bị": "Đồng Bộ Chỉnh Tề",
        "Huấn Luyện": "Thành Thạo",
        "Lãnh Địa Đồn Trú": d.startingLocation || state["Thế Giới"]["Vị Trí"],
        "Turn Di Chuyển Còn Lại": 0,
        "Turn Huấn Luyện": 0,
      };
    }
    for (const n of d.customForce.npcs) {
      (state["Tướng Lĩnh"] as Record<string, unknown>)[n.id] = {
        "Họ Tên": n.name?.trim() || "Vô Danh",
        "Chức Vụ": n.role,
        "Tuổi": 30,
        "Độ Hảo Cảm": 50,
        "Tin Cậy": true,
        "Loại Quan Hệ": "Gia Thần",
        "Đánh Giá": "Được tuyển mộ từ lúc khởi nghiệp",
        "Năng Lực": getStatsForRole(n.role),
        "Nét Tính Cách": ["Trung Thành"],
      };
    }
  }

  function getStatsForRole(role: string) {
    switch (role) {
      case "Tướng Quân": return { "Võ Lực": 14, "Thống Soái": 16, "Trí Mưu": 12, "Ngoại Giao": 10 };
      case "Hiệp Sĩ": return { "Võ Lực": 18, "Thống Soái": 10, "Trí Mưu": 8, "Ngoại Giao": 8 };
      case "Cố Vấn": return { "Võ Lực": 6, "Thống Soái": 8, "Trí Mưu": 18, "Ngoại Giao": 16 };
      case "Thị Vệ": return { "Võ Lực": 16, "Thống Soái": 8, "Trí Mưu": 8, "Ngoại Giao": 6 };
      default: return { "Võ Lực": 10, "Thống Soái": 10, "Trí Mưu": 10, "Ngoại Giao": 10 };
    }
  }

  // ---- phái sinh + đầy sinh tồn (8.6b bước 5) ----
  recomputeDerived(state);
  state["Chỉ Số Sinh Tồn"]["HP"] = state["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  state["Chỉ Số Sinh Tồn"]["Thể Lực"] = state["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"];
  return state;
}

/** Dựng StatData từ nhân vật canon (8.4b) — chỉ số khoá theo nguyên tác. */
export function buildStateFromCanon(
  c: CanonCharacter,
  era: EraData,
  modes: Pick<WizardData, "narrativeMode" | "scenarioMode" | "difficulty">,
  extras?: { persona?: WizardData["persona"]; portraitKey?: string; hookId?: string },
): StatData {
  const hook = extras?.hookId ? era.startingHooks.find((h) => h.id === extras.hookId) : undefined;
  const actualStartYear = parseHookYear(hook, era.startYear);
  const state = makeDefaultState();
  applyBase(state, era, modes, actualStartYear);

  // Tuổi tính theo năm bắt đầu thực (hook year)
  const canonAge = c.birthYear !== undefined
    ? Math.max(0, actualStartYear - c.birthYear)
    : c.age;

  const info = state["Thông Tin Nhân Vật"];
  info["Họ Tên"] = c.name;
  info["Nhà"] = c.house as typeof info["Nhà"];
  info["Xuất Thân"] = c.role;
  info["Lục Địa"] = "Westeros";
  info["Văn Hoá"] = "First Men";
  info["Tôn Giáo"] = c.religion || "Thất Diện Thần";
  info["Thần Bảo Hộ"] = "";
  info["Đức Tin"] = 30;
  info["Ân Sủng"] = 10;
  if (info["Tôn Giáo"] && PATRON_GODS[info["Tôn Giáo"]]) {
    info["Thần Bảo Hộ"] = PATRON_GODS[info["Tôn Giáo"]][0]?.name || "";
  }
  info["Vàng"] = c.gold;
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
    state["Persona"]["Tiểu Sử"] = c.blurb;
  }

  const core = state["Chỉ Số Cốt Lõi"];
  for (const stat of CORE_STATS) core[stat] = clamp(c.coreStats[stat], 1, 20);
  // canon: chỉ số đã là con số CUỐI đúng nguyên tác — thiên phú chỉ thêm nhãn/narrative,
  // KHÔNG cộng effect vào cốt lõi lần nữa (tránh double-count)
  for (const id of c.talentIds) {
    const t = TALENTS_BY_ID[id];
    if (t) (state["Thiên Phú"] as Record<string, unknown>)[t.name] = talentToStateEntry(t);
  }
  for (const [skillId, lv] of Object.entries(c.skills)) {
    const def = SKILLS_BY_ID[skillId];
    if (!def) continue;
    (state["Kỹ Năng"] as Record<string, unknown>)[def.name] = { "Cấp": clamp(lv, 0, 10), "Kinh Nghiệm": 0, "Nhóm": def.group };
  }
  applyEquipment(state, c.equipment);
  for (const item of c.items) {
    (state["Túi Đồ"] as Record<string, unknown>)[item.ten] = { "Số Lượng": item.soLuong, "Mô Tả": item.moTa };
  }

  // ---- rồng canon (nếu có) ----
  if (c.dragon) {
    const drg = c.dragon;
    const hpMax = DRAGON_SIZE_HP[drg.size] + (drg.stats["Giáp Vảy"] ?? 3) * 20;
    (state["Rồng"] as Record<string, unknown>)[drg.name] = {
      "Tên": drg.name,
      "Kích Cỡ": drg.size,
      "Kỵ Sĩ": c.name,
      "Tình Trạng": "Khỏe",
      "_HP": hpMax,
      "_HP Tối Đa": hpMax,
      "Màu Sắc": drg.color,
      "Tuổi": drg.age,
      "Chỉ Số": { ...drg.stats },
      "Kỹ Năng": { ...drg.skills },
      "Mô Tả": drg.description,
    };
  }

  // canon: lãnh chúa cai quản vùng quê → mở holding nếu kiểm soát (9.6.1/10.1)
  seedRegionControl(state, era.id, { createIfMissing: true });

  recomputeDerived(state);
  state["Chỉ Số Sinh Tồn"]["HP"] = state["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  state["Chỉ Số Sinh Tồn"]["Thể Lực"] = state["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"];
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
