/**
 * resolveCheck (5bis.2) — kiểm định thống nhất d100, xương sống MỌI hành động
 * có rủi ro phi chiến đấu. AI KHÔNG tự quyết thành/bại — engine roll, AI kể.
 *
 * target = 50 + (chỉSốChính−10)×3 + kỹNăng×4 + (chỉSốPhụ−10)×1.5
 *        + thiênPhú + hoànCảnh − DC   → clamp 5..95
 * roll d100 → gradeResult (5bis.4). Breakdown minh bạch cho UI (5bis.5).
 */
import { makeRng } from "./rng";
import { gradeResult, DIFFICULTY_DC, type DifficultyLabel, type ResultGrade } from "./grades";
import { findCheck, type CheckDef, type CoreStatName } from "./checkMap";

/** Chủ thể kiểm định — engine đọc từ stat_data, test truyền tay. */
export interface CheckActor {
  /** Chỉ Số Cốt Lõi 1-20 (5.1f-A). */
  stats: Partial<Record<CoreStatName, number>>;
  /** Kỹ năng → cấp 0-10 (5.1f-D). Không có key = cấp 0 (vẫn check được). */
  skills: Record<string, number>;
}

export interface CheckInput {
  checkId: string;
  actor: CheckActor;
  /** DC: nhãn bậc hoặc số trực tiếp. Bỏ qua nếu opposed + có target actor. */
  difficulty?: DifficultyLabel | number;
  /** Đối phương (opposed check) — DC động từ chỉ số + kỹ năng của họ. */
  opponent?: CheckActor;
  /** Bonus thiên phú (đã parse từ 5.1f-C1) — engine truyền số cộng sẵn. */
  talentBonus?: number;
  /** Hoàn cảnh -30..+30 (địa lợi, đồng minh, đòn bẩy...). */
  circumstance?: number;
  /** Modifier độ khó ván (7.9.6) — Nhàn Hạ +5, Cân Bằng 0, Chân Thực -3. */
  gameDifficultyMod?: number;
  seed: number;
}

export interface CheckBreakdownItem {
  label: string;
  value: number;
}

export interface CheckResult {
  checkId: string;
  /** def tra được (null = fallback chỉ số trần). */
  def: CheckDef | null;
  target: number;
  roll: number;
  grade: ResultGrade;
  /** các mảnh cộng/trừ minh bạch — UI hiện "vì sao 68%" (5bis.5). */
  breakdown: CheckBreakdownItem[];
}

const BASE = 50;
const STAT_DEFAULT = 8;

function statOf(actor: CheckActor, name: CoreStatName): number {
  return actor.stats[name] ?? STAT_DEFAULT;
}

function skillOf(actor: CheckActor, name: string): number {
  if (!name) return 0;
  return actor.skills[name] ?? 0;
}

/** DC động cho opposed check: dẫn từ chỉ số + kỹ năng đối phương (5bis.2b). */
export function opposedDc(def: CheckDef, opponent: CheckActor): number {
  if (!def.opposed) return DIFFICULTY_DC["Thường"];
  const stat = statOf(opponent, def.opposed.chinh);
  const skill = skillOf(opponent, def.opposed.kyNang);
  // thang tương đương: người thường (stat 8, skill 0) ≈ DC 14; cao thủ (18, 8) ≈ DC 56
  return Math.round(20 + (stat - 10) * 3 + skill * 4);
}

export function resolveCheck(input: CheckInput): CheckResult {
  const def = findCheck(input.checkId);
  const breakdown: CheckBreakdownItem[] = [{ label: "nền", value: BASE }];
  let target = BASE;

  if (def) {
    const main = statOf(input.actor, def.chinh);
    const mainPart = (main - 10) * 3;
    target += mainPart;
    breakdown.push({ label: `${def.chinh} (${main})`, value: mainPart });

    const skill = skillOf(input.actor, def.kyNang);
    if (def.kyNang) {
      target += skill * 4;
      breakdown.push({ label: `kỹ năng ${def.kyNang} (${skill})`, value: skill * 4 });
    }

    if (def.phu) {
      const sub = statOf(input.actor, def.phu);
      const subPart = Math.round((sub - 10) * 1.5);
      target += subPart;
      breakdown.push({ label: `phụ ${def.phu} (${sub})`, value: subPart });
    }
  } else {
    // fallback việc lạ (5bis.2b): chỉ số trần mạnh nhất, không kỹ năng — không bao giờ kẹt
    const best = Math.max(...Object.values(input.actor.stats).filter((v): v is number => v !== undefined), STAT_DEFAULT);
    const part = (best - 10) * 3;
    target += part;
    breakdown.push({ label: `chỉ số trần (${best})`, value: part });
  }

  if (input.talentBonus) {
    target += input.talentBonus;
    breakdown.push({ label: "thiên phú", value: input.talentBonus });
  }
  if (input.circumstance) {
    target += input.circumstance;
    breakdown.push({ label: "hoàn cảnh", value: input.circumstance });
  }
  if (input.gameDifficultyMod) {
    target += input.gameDifficultyMod;
    breakdown.push({ label: "độ khó ván", value: input.gameDifficultyMod });
  }

  // DC: opposed động > số trực tiếp > nhãn bậc > mặc định Thường
  let dc: number;
  if (def?.opposed && input.opponent) {
    dc = opposedDc(def, input.opponent);
    breakdown.push({ label: "độ khó (đối phương)", value: -dc });
  } else if (typeof input.difficulty === "number") {
    dc = input.difficulty;
    breakdown.push({ label: "độ khó", value: -dc });
  } else if (input.difficulty) {
    dc = DIFFICULTY_DC[input.difficulty];
    breakdown.push({ label: `độ khó (${input.difficulty})`, value: -dc });
  } else {
    dc = DIFFICULTY_DC["Thường"];
    breakdown.push({ label: "độ khó (Thường)", value: -dc });
  }
  target -= dc;

  // luôn chừa 5% hai đầu (5bis.2)
  target = Math.min(95, Math.max(5, Math.round(target)));

  const rng = makeRng(input.seed);
  const roll = 1 + Math.floor(rng() * 100);

  return { checkId: input.checkId, def, target, roll, grade: gradeResult(roll, target), breakdown };
}
