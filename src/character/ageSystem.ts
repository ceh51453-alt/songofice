/**
 * ageSystem.ts — Hệ thống tuổi tác ảnh hưởng gameplay.
 *
 * Player/NPC: tuổi → modifier chỉ số cốt lõi + % HP.
 * Dragon:     tuổi → modifier chỉ số rồng + % HP.
 *
 * Modifier CỘNG vào derived (không sửa base cốt lõi) — ngoại trừ khi tạo
 * nhân vật canon, modifier áp lên base để phản ánh "thật sự là trẻ con".
 */
import type { CoreStat } from "../content/westeros/skills";
import type { DragonStat } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";

// ── Player / NPC Age Brackets ──

export interface HumanAgeMod {
  /** % modifier HP Tối Đa (vd: -30 = giảm 30%). */
  hpPercent: number;
  /** Modifier cộng thêm vào chỉ số cốt lõi khi tính derived. */
  stats: Record<CoreStat, number>;
  /** Mô tả ngắn cho UI/AI. */
  label: string;
}

const HUMAN_AGE_TABLE: { maxAge: number; mod: HumanAgeMod }[] = [
  {
    maxAge: 5,
    mod: {
      hpPercent: -60,
      stats: { "Sức Mạnh": -6, "Nhanh Nhẹn": -4, "Thể Chất": -6, "Trí Tuệ": -4, "Tinh Tường": -2, "Uy Tín": -4 },
      label: "Ấu Nhi — cơ thể yếu ớt, không thể chiến đấu",
    },
  },
  {
    maxAge: 12,
    mod: {
      hpPercent: -30,
      stats: { "Sức Mạnh": -3, "Nhanh Nhẹn": 0, "Thể Chất": -3, "Trí Tuệ": -1, "Tinh Tường": 0, "Uy Tín": -3 },
      label: "Thiếu Niên — đang lớn, nhanh nhẹn nhưng chưa mạnh",
    },
  },
  {
    maxAge: 17,
    mod: {
      hpPercent: -10,
      stats: { "Sức Mạnh": -1, "Nhanh Nhẹn": 1, "Thể Chất": -1, "Trí Tuệ": 0, "Tinh Tường": 1, "Uy Tín": -2 },
      label: "Thiếu Niên Lớn — gần trưởng thành, linh hoạt",
    },
  },
  {
    maxAge: 39,
    mod: {
      hpPercent: 0,
      stats: { "Sức Mạnh": 0, "Nhanh Nhẹn": 0, "Thể Chất": 0, "Trí Tuệ": 0, "Tinh Tường": 0, "Uy Tín": 0 },
      label: "Trưởng Thành — đỉnh cao thể chất và tinh thần",
    },
  },
  {
    maxAge: 59,
    mod: {
      hpPercent: -5,
      stats: { "Sức Mạnh": -1, "Nhanh Nhẹn": -1, "Thể Chất": -1, "Trí Tuệ": 2, "Tinh Tường": 2, "Uy Tín": 3 },
      label: "Trung Niên — kinh nghiệm bù thể lực, uy tín cao",
    },
  },
  {
    maxAge: Infinity,
    mod: {
      hpPercent: -20,
      stats: { "Sức Mạnh": -4, "Nhanh Nhẹn": -3, "Thể Chất": -4, "Trí Tuệ": 3, "Tinh Tường": 3, "Uy Tín": 4 },
      label: "Lão Niên — già cả, thể lực suy giảm nhưng uyên bác",
    },
  },
];

/** Tra modifier tuổi cho player/NPC. */
export function humanAgeMod(age: number): HumanAgeMod {
  for (const row of HUMAN_AGE_TABLE) {
    if (age <= row.maxAge) return row.mod;
  }
  return HUMAN_AGE_TABLE[HUMAN_AGE_TABLE.length - 1].mod;
}

/** Mô tả ngắn cho UI tooltip. */
export function humanAgeLabel(age: number): string {
  return humanAgeMod(age).label;
}

// ── Dragon Age Brackets ──

export interface DragonAgeMod {
  hpPercent: number;
  stats: Record<DragonStat, number>;
  label: string;
}

const DRAGON_AGE_TABLE: { maxAge: number; mod: DragonAgeMod }[] = [
  {
    maxAge: 5,
    mod: {
      hpPercent: -50,
      stats: { "Sức Lửa": -3, "Sức Bay": -2, "Giáp Vảy": -3, "Hung Dữ": -1, "Trung Thành": 3 },
      label: "Non Nớt — nhỏ bé, dễ thuần, lửa yếu",
    },
  },
  {
    maxAge: 20,
    mod: {
      hpPercent: 0,
      stats: { "Sức Lửa": 0, "Sức Bay": 0, "Giáp Vảy": 0, "Hung Dữ": 0, "Trung Thành": 1 },
      label: "Non — đang phát triển, lửa vừa phải",
    },
  },
  {
    maxAge: 100,
    mod: {
      hpPercent: 0,
      stats: { "Sức Lửa": 2, "Sức Bay": 1, "Giáp Vảy": 2, "Hung Dữ": 1, "Trung Thành": 0 },
      label: "Trưởng Thành — mạnh mẽ, lửa nóng, vảy dày",
    },
  },
  {
    maxAge: Infinity,
    mod: {
      hpPercent: 20,
      stats: { "Sức Lửa": 4, "Sức Bay": 2, "Giáp Vảy": 5, "Hung Dữ": 3, "Trung Thành": -2 },
      label: "Khổng Lồ — vảy như thép, lửa thiêu thành, khó kiểm soát",
    },
  },
];

/** Tra modifier tuổi cho rồng. */
export function dragonAgeMod(age: number): DragonAgeMod {
  for (const row of DRAGON_AGE_TABLE) {
    if (age <= row.maxAge) return row.mod;
  }
  return DRAGON_AGE_TABLE[DRAGON_AGE_TABLE.length - 1].mod;
}

/** Mô tả ngắn rồng cho UI. */
export function dragonAgeLabel(age: number): string {
  return dragonAgeMod(age).label;
}

// ── NPC Age Command Modifier ──

/** NPC tướng già kinh nghiệm hơn nhưng chậm hơn. */
export function npcCommandMod(npc: Npc): { commandBonus: number; loyaltyMod: number } {
  const age = npc["Tuổi"];
  if (age <= 17) return { commandBonus: -2, loyaltyMod: 0 };
  if (age <= 39) return { commandBonus: 0, loyaltyMod: 0 };
  if (age <= 59) return { commandBonus: 2, loyaltyMod: 1 };
  return { commandBonus: 3, loyaltyMod: -1 }; // lão tướng: giỏi chỉ huy nhưng sắp chết
}
