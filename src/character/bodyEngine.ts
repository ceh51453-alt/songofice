/**
 * HỆ CƠ THỂ (M23) — bộ phận cơ thể có CHỨC NĂNG, không chỉ có một thanh máu.
 *
 * Trước M23, `Cơ Thể` là hai mươi ô, mỗi ô một con số "Tình Trạng" và một mảng
 * triệu chứng. Bị chặt đứt bàn tay phải và bị xước đầu gối trái ảnh hưởng tới
 * trận đấu y hệt nhau: không gì cả. Triệu chứng "Mù Loà" không làm ai mù, "Đứt
 * Lìa" không làm ai mất tay.
 *
 * File này gắn mỗi bộ phận vào NĂM NĂNG LỰC, và năng lực mới là thứ engine
 * chiến đấu đọc:
 *
 *   • CẦM NẮM (tay)    — cầm được vũ khí hay không, đánh trúng bao nhiêu
 *   • DI CHUYỂN (chân) — né, đổi cự ly, giữ thăng bằng
 *   • NHÌN (đầu)       — độ chính xác, phát hiện đòn tới
 *   • HÔ HẤP (ngực/cổ) — Thể Lực tối đa và tốc hồi
 *   • TRỤ VỮNG (thân)  — chịu đòn, không gục vì sốc
 *
 * Thêm hai thứ mà cơ thể thật có còn bản cũ thì không: MẤT MÁU cộng dồn dẫn tới
 * ngất, và NHIỄM TRÙNG tiến triển theo ngày nếu không ai chữa.
 *
 * Hàm thuần.
 */
import type { StatData } from "../mvu/schema";
import { WOUND_TYPES } from "../mvu/schema";
import { clamp } from "../mvu/helpers";

type BodyData = StatData["Cơ Thể"];
type WoundType = (typeof WOUND_TYPES)[number];

// ── NĂNG LỰC ────────────────────────────────────────────────────────────────

export type Capability = "Cầm Nắm" | "Di Chuyển" | "Nhìn" | "Hô Hấp" | "Trụ Vững";

export const CAPABILITY_INTRO: Record<Capability, string> = {
  "Cầm Nắm": "Tay và vai. Quyết định có cầm nổi vũ khí không, và mỗi nhát đánh còn bao nhiêu lực. Mất hẳn thì không dùng được vũ khí hai tay, rồi tới không dùng được vũ khí nào.",
  "Di Chuyển": "Chân và đầu gối. Quyết định né được bao nhiêu, đổi cự ly được không, và giữ thăng bằng tới đâu. Mất hẳn thì nằm một chỗ mà đánh.",
  "Nhìn": "Mắt và đầu. Quyết định độ chính xác và khả năng đọc đòn tới. Mù thì mọi đòn đều là đoán mò.",
  "Hô Hấp": "Ngực, sườn và cổ. Quyết định Thể Lực tối đa và tốc độ hồi sức. Gãy sườn thì đánh ba vòng đã hết hơi.",
  "Trụ Vững": "Thân mình và cột sống. Quyết định chịu được bao nhiêu đòn trước khi cơ thể tự sụp xuống vì sốc.",
};

/** Bộ phận nào góp vào năng lực nào, và góp bao nhiêu (tổng mỗi năng lực = 1). */
const PART_ROLES: Record<string, Partial<Record<Capability, number>>> = {
  "Đầu": { "Nhìn": 0.7, "Trụ Vững": 0.15 },
  "Cổ": { "Hô Hấp": 0.3, "Nhìn": 0.15, "Trụ Vững": 0.1 },
  "Ngực": { "Hô Hấp": 0.4, "Trụ Vững": 0.3 },
  "Bụng": { "Trụ Vững": 0.3, "Hô Hấp": 0.1 },
  "Sườn Trái": { "Hô Hấp": 0.1 },
  "Sườn Phải": { "Hô Hấp": 0.1 },
  "Vai Trái": { "Cầm Nắm": 0.1 },
  "Vai Phải": { "Cầm Nắm": 0.15 },
  "Bắp Tay Trái": { "Cầm Nắm": 0.1 },
  "Bắp Tay Phải": { "Cầm Nắm": 0.15 },
  "Cẳng Tay Trái": { "Cầm Nắm": 0.08 },
  "Cẳng Tay Phải": { "Cầm Nắm": 0.12 },
  "Bàn Tay Trái": { "Cầm Nắm": 0.1 },
  "Bàn Tay Phải": { "Cầm Nắm": 0.2 },
  "Đùi Trái": { "Di Chuyển": 0.15, "Trụ Vững": 0.05 },
  "Đùi Phải": { "Di Chuyển": 0.15, "Trụ Vững": 0.05 },
  "Đầu Gối Trái": { "Di Chuyển": 0.15 },
  "Đầu Gối Phải": { "Di Chuyển": 0.15 },
  "Bắp Chân Trái": { "Di Chuyển": 0.1 },
  "Bắp Chân Phải": { "Di Chuyển": 0.1 },
  "Bàn Chân Trái": { "Di Chuyển": 0.1 },
  "Bàn Chân Phải": { "Di Chuyển": 0.1 },
};

// ── TRIỆU CHỨNG ─────────────────────────────────────────────────────────────

export interface SymptomDef {
  id: WoundType;
  desc: string;
  /** nhân vào phần đóng góp của bộ phận (0 = bộ phận coi như mất hẳn). */
  functionMult: number;
  /** máu mất mỗi ngày. */
  bleedPerDay: number;
  /** tiến triển thành triệu chứng nặng hơn nếu không chữa. */
  worsensTo?: WoundType;
  /** số ngày trước khi tiến triển. */
  worsenDays?: number;
  /** không bao giờ lành lại. */
  permanent?: boolean;
}

export const SYMPTOMS: Record<string, SymptomDef> = {
  "Bình Thường": { id: "Bình Thường", desc: "Lành lặn.", functionMult: 1, bleedPerDay: 0 },
  "Trầy Xước": { id: "Trầy Xước", desc: "Vết xước ngoài da. Rát chứ không cản trở gì.", functionMult: 0.97, bleedPerDay: 0 },
  "Xuất Huyết": {
    id: "Xuất Huyết", desc: "Máu chảy không cầm được. Không băng thì mất máu tới ngất, rồi tới chết.",
    functionMult: 0.85, bleedPerDay: 6, worsensTo: "Nhiễm Trùng", worsenDays: 3,
  },
  "Gãy Xương": {
    id: "Gãy Xương", desc: "Xương gãy. Bộ phận này gần như mất tác dụng cho tới khi nẹp và liền lại — hàng tháng chứ không phải hàng ngày.",
    functionMult: 0.25, bleedPerDay: 1,
  },
  "Nhiễm Độc": {
    id: "Nhiễm Độc", desc: "Độc chạy theo mạch máu. Lan ra toàn thân nếu không có thuốc giải.",
    functionMult: 0.7, bleedPerDay: 4, worsensTo: "Hoại Tử", worsenDays: 5,
  },
  "Nhiễm Trùng": {
    id: "Nhiễm Trùng", desc: "Vết thương mưng mủ và nóng lên. Đây mới là thứ giết phần lớn người bị thương ở Westeros, không phải nhát chém.",
    functionMult: 0.6, bleedPerDay: 3, worsensTo: "Hoại Tử", worsenDays: 6,
  },
  "Hoại Tử": {
    id: "Hoại Tử", desc: "Thịt đã chết và đang thối. Chỉ còn một cách: cắt bỏ.",
    functionMult: 0.15, bleedPerDay: 5, worsensTo: "Đứt Lìa", worsenDays: 8,
  },
  "Bỏng": { id: "Bỏng", desc: "Da cháy. Đau tới mức khó tập trung, và rất dễ nhiễm trùng.", functionMult: 0.7, bleedPerDay: 2, worsensTo: "Nhiễm Trùng", worsenDays: 4 },
  "Đứt Lìa": { id: "Đứt Lìa", desc: "Bộ phận này không còn nữa. Vĩnh viễn.", functionMult: 0, bleedPerDay: 8, permanent: true },
  "Tàn Phế": { id: "Tàn Phế", desc: "Còn đó nhưng không cử động được nữa. Vĩnh viễn.", functionMult: 0.1, bleedPerDay: 0, permanent: true },
  "Hôn Mê": { id: "Hôn Mê", desc: "Bất tỉnh. Không làm được gì cho tới khi tỉnh lại — nếu tỉnh lại.", functionMult: 0.1, bleedPerDay: 0 },
  "Mù Loà": { id: "Mù Loà", desc: "Mất thị lực. Vĩnh viễn nếu cả hai mắt.", functionMult: 0, bleedPerDay: 0, permanent: true },
  "Khó Thở": { id: "Khó Thở", desc: "Mỗi hơi thở là một cơn đau nhói. Sức bền tụt thảm hại.", functionMult: 0.5, bleedPerDay: 0 },
  "Mất Huyết Áp": { id: "Mất Huyết Áp", desc: "Mất máu quá nhiều, tim đập nhanh và yếu. Sắp ngất.", functionMult: 0.4, bleedPerDay: 4 },
};

export function symptomDef(id: string): SymptomDef {
  return SYMPTOMS[id] ?? SYMPTOMS["Bình Thường"];
}

// ── TÍNH NĂNG LỰC ───────────────────────────────────────────────────────────

export interface BodyProfile {
  /** mỗi năng lực 0..1. */
  capabilities: Record<Capability, number>;
  /** tổng máu mất mỗi ngày do các vết thương đang hở. */
  bleedPerDay: number;
  /** bộ phận đã mất hẳn (đứt lìa / tàn phế). */
  crippled: string[];
  /** đang bất tỉnh. */
  unconscious: boolean;
  /** mù hẳn. */
  blind: boolean;
  /** không cầm nổi vũ khí hai tay. */
  cannotTwoHand: boolean;
  /** không cầm nổi vũ khí nào. */
  cannotHoldWeapon: boolean;
  /** dòng cảnh báo cho UI. */
  lines: string[];
}

const FULL: Record<Capability, number> = {
  "Cầm Nắm": 1, "Di Chuyển": 1, "Nhìn": 1, "Hô Hấp": 1, "Trụ Vững": 1,
};

/**
 * Quy toàn bộ bảng `Cơ Thể` thành năm năng lực. Một bộ phận đóng góp phần của
 * nó nhân với (tình trạng còn lại × hệ số triệu chứng nặng nhất đang mang).
 */
export function bodyProfile(body: BodyData | undefined): BodyProfile {
  const cap: Record<Capability, number> = { ...FULL };
  const crippled: string[] = [];
  const lines: string[] = [];
  let bleed = 0;
  let unconscious = false;
  let blind = false;

  if (!body || Object.keys(body).length === 0) {
    return {
      capabilities: cap, bleedPerDay: 0, crippled: [], unconscious: false, blind: false,
      cannotTwoHand: false, cannotHoldWeapon: false, lines: [],
    };
  }

  // trừ dần từ 1.0 theo phần đóng góp bị hỏng của từng bộ phận
  for (const [partName, part] of Object.entries(body)) {
    const roles = PART_ROLES[partName];
    if (!roles || !part) continue;

    const condition = clamp((part["Tình Trạng"] ?? 100) / 100, 0, 1);
    const symptoms = (part["Triệu Chứng"] ?? []).filter((s) => s !== "Bình Thường");
    // triệu chứng NẶNG NHẤT quyết định, không cộng dồn nhân
    let worst = 1;
    for (const s of symptoms) {
      const def = symptomDef(s);
      worst = Math.min(worst, def.functionMult);
      bleed += def.bleedPerDay;
      if (s === "Hôn Mê") unconscious = true;
      if (def.permanent && !crippled.includes(partName)) crippled.push(partName);
    }
    if (symptoms.includes("Mù Loà")) blind = true;

    const health = condition * worst;
    for (const [capName, share] of Object.entries(roles)) {
      cap[capName as Capability] -= (share ?? 0) * (1 - health);
    }
    if (health < 0.5) {
      lines.push(`${partName}: ${symptoms.length > 0 ? symptoms.join(", ") : `hư hại ${Math.round(condition * 100)}%`}`);
    }
  }

  for (const k of Object.keys(cap) as Capability[]) cap[k] = clamp(cap[k], 0, 1);
  if (blind) cap["Nhìn"] = 0;

  // tay: mất một bàn tay là không cầm hai tay được; mất cả hai là hết cầm vũ khí
  const handsGone = ["Bàn Tay Trái", "Bàn Tay Phải"].filter((h) => crippled.includes(h));
  const cannotTwoHand = handsGone.length >= 1 || cap["Cầm Nắm"] < 0.45;
  const cannotHoldWeapon = handsGone.length >= 2 || cap["Cầm Nắm"] < 0.15;

  if (cannotHoldWeapon) lines.push("Không còn cầm nổi vũ khí nào.");
  else if (cannotTwoHand) lines.push("Không cầm được vũ khí hai tay nữa.");
  if (blind) lines.push("Đã mù — mọi đòn đánh đều là đoán mò.");
  if (unconscious) lines.push("Đang bất tỉnh.");

  return {
    capabilities: cap, bleedPerDay: bleed, crippled, unconscious, blind,
    cannotTwoHand, cannotHoldWeapon, lines,
  };
}

// ── ẢNH HƯỞNG LÊN CHIẾN ĐẤU ─────────────────────────────────────────────────

export interface BodyCombatMods {
  /** cộng vào chỉ số đánh trúng. */
  hit: number;
  /** cộng vào Phòng Thủ. */
  ac: number;
  /** nhân vào sát thương gây ra. */
  damageMult: number;
  /** nhân vào Thể Lực tối đa. */
  staminaMult: number;
  /** cộng vào Thể Lực hồi mỗi vòng. */
  staminaRegen: number;
  /** cộng vào Thăng Bằng hồi mỗi vòng. */
  poiseRegen: number;
  /** nhân vào Nhanh Nhẹn. */
  agilityMult: number;
  /** không hành động được. */
  incapacitated: boolean;
}

/**
 * Đổi năng lực thành hệ số chiến đấu. Đây là chỗ mà "gãy tay phải" cuối cùng
 * cũng có nghĩa: −4 đánh trúng và mất một phần ba sát thương, chứ không phải
 * một dòng chữ đỏ trang trí như trước.
 */
export function bodyCombatMods(profile: BodyProfile): BodyCombatMods {
  const c = profile.capabilities;
  return {
    hit: Math.round((c["Cầm Nắm"] - 1) * 8 + (c["Nhìn"] - 1) * 6),
    ac: Math.round((c["Di Chuyển"] - 1) * 5 + (c["Nhìn"] - 1) * 3),
    damageMult: 0.4 + c["Cầm Nắm"] * 0.6,
    staminaMult: 0.35 + c["Hô Hấp"] * 0.65,
    staminaRegen: Math.round((c["Hô Hấp"] - 1) * 4),
    poiseRegen: Math.round((c["Di Chuyển"] - 1) * 8 + (c["Trụ Vững"] - 1) * 4),
    agilityMult: 0.3 + c["Di Chuyển"] * 0.7,
    incapacitated: profile.unconscious || c["Trụ Vững"] <= 0.05,
  };
}

// ── MẤT MÁU ─────────────────────────────────────────────────────────────────

export type ShockLevel = "Ổn" | "Choáng Nhẹ" | "Sốc" | "Nguy Kịch";

export const SHOCK_INTRO: Record<ShockLevel, string> = {
  "Ổn": "Còn tỉnh táo và đứng vững.",
  "Choáng Nhẹ": "Tai ù, tay lạnh. Bắt đầu khó tập trung.",
  "Sốc": "Mạch nhanh và yếu, mắt mờ đi từng đợt. Một cú đánh nữa là ngã.",
  "Nguy Kịch": "Mất quá nhiều máu. Không băng lại ngay thì không có ngày mai.",
};

/**
 * Mức sốc do mất máu — tính từ HP còn lại và tổng vết thương đang hở. Đây là
 * thứ khiến một người bị năm vết cắt nông vẫn nguy hiểm hơn một người bị một
 * vết sâu đã băng.
 */
export function shockLevel(hp: number, maxHp: number, bleedPerDay: number): ShockLevel {
  const frac = maxHp > 0 ? hp / maxHp : 1;
  const score = (1 - frac) * 100 + bleedPerDay * 3;
  if (score >= 85) return "Nguy Kịch";
  if (score >= 60) return "Sốc";
  if (score >= 35) return "Choáng Nhẹ";
  return "Ổn";
}

// ── CHỮA TRỊ ────────────────────────────────────────────────────────────────

export type CareQuality = "Bỏ Mặc" | "Sơ Cứu" | "Thầy Lang" | "Học Sĩ" | "Học Sĩ Xích Vàng";

export interface CareDef {
  id: CareQuality;
  desc: string;
  /** nhân vào tốc độ lành. */
  healRate: number;
  /** xác suất mỗi ngày CHẶN được một triệu chứng tiến triển nặng thêm. */
  stopWorsening: number;
  /** cầm được máu (đưa bleed về 0 cho vết Xuất Huyết). */
  stopsBleeding: boolean;
}

export const CARE_LEVELS: Record<CareQuality, CareDef> = {
  "Bỏ Mặc": { id: "Bỏ Mặc", healRate: 0.4, stopWorsening: 0, stopsBleeding: false,
    desc: "Không ai chăm. Vết thương tự lo lấy thân — và phần lớn thì không lo nổi." },
  "Sơ Cứu": { id: "Sơ Cứu", healRate: 0.8, stopWorsening: 0.35, stopsBleeding: true,
    desc: "Băng bó tại chỗ, rượu rửa vết thương. Cầm được máu, còn nhiễm trùng thì hên xui." },
  "Thầy Lang": { id: "Thầy Lang", healRate: 1.1, stopWorsening: 0.55, stopsBleeding: true,
    desc: "Bà lang trong làng với thảo dược và kim chỉ. Tốt hơn nhiều so với không có gì." },
  "Học Sĩ": { id: "Học Sĩ", healRate: 1.5, stopWorsening: 0.8, stopsBleeding: true,
    desc: "Học sĩ đeo xích với sữa anh túc, nẹp gỗ và dao mổ đã hơ lửa." },
  "Học Sĩ Xích Vàng": { id: "Học Sĩ Xích Vàng", healRate: 1.9, stopWorsening: 0.93, stopsBleeding: true,
    desc: "Bậc thầy y thuật của Citadel. Cắt được chi hoại tử và giữ người ta sống qua điều đó." },
};

/** Cấp chăm sóc suy từ kỹ năng Y Thuật của người chữa và nơi đang nằm. */
export function careFromSkill(medicineLevel: number, hasMaester: boolean): CareQuality {
  if (hasMaester && medicineLevel >= 8) return "Học Sĩ Xích Vàng";
  if (hasMaester) return "Học Sĩ";
  if (medicineLevel >= 5) return "Thầy Lang";
  if (medicineLevel >= 1) return "Sơ Cứu";
  return "Bỏ Mặc";
}

export interface HealTickResult {
  /** HP mất do chảy máu trong khoảng thời gian này. */
  hpLost: number;
  /** triệu chứng vừa tiến triển nặng thêm. */
  worsened: { part: string; from: string; to: string }[];
  /** triệu chứng vừa khỏi. */
  healed: { part: string; symptom: string }[];
  lines: string[];
}

/**
 * Tick chữa lành theo NGÀY (không phải theo giây như bản cũ) — vết thương trong
 * một thế giới trung cổ đo bằng tuần, và chất lượng chăm sóc là thứ quyết định
 * ai sống ai chết.
 *
 * Sửa TẠI CHỖ trên `body` (engine gọi trên bản sao).
 */
export function tickBodyDays(
  body: BodyData,
  days: number,
  care: CareQuality,
  rng: () => number,
): HealTickResult {
  const def = CARE_LEVELS[care] ?? CARE_LEVELS["Bỏ Mặc"];
  const out: HealTickResult = { hpLost: 0, worsened: [], healed: [], lines: [] };

  for (const [partName, part] of Object.entries(body)) {
    if (!part) continue;
    const symptoms: string[] = [...(part["Triệu Chứng"] ?? [])].filter((s) => s !== "Bình Thường");

    for (const s of [...symptoms]) {
      const sd = symptomDef(s);

      // ── mất máu ──
      let bleed = sd.bleedPerDay * days;
      if (def.stopsBleeding && (s === "Xuất Huyết" || s === "Mất Huyết Áp")) bleed = 0;
      out.hpLost += bleed;

      // ── tiến triển nặng thêm ──
      if (sd.worsensTo && days >= (sd.worsenDays ?? 99)) {
        if (rng() > def.stopWorsening) {
          const idx = symptoms.indexOf(s);
          if (idx >= 0) symptoms.splice(idx, 1);
          if (!symptoms.includes(sd.worsensTo)) symptoms.push(sd.worsensTo);
          out.worsened.push({ part: partName, from: s, to: sd.worsensTo });
          out.lines.push(`${partName}: ${s} chuyển thành ${sd.worsensTo}.`);
          continue;
        }
        out.lines.push(`${partName}: ${s} được giữ không nặng thêm nhờ ${care}.`);
      }

      // ── lành ──
      if (!sd.permanent) {
        const healChance = clamp(def.healRate * days * 0.06, 0, 0.9);
        if (rng() < healChance) {
          const idx = symptoms.indexOf(s);
          if (idx >= 0) symptoms.splice(idx, 1);
          out.healed.push({ part: partName, symptom: s });
          out.lines.push(`${partName}: ${s} đã lành.`);
        }
      }
    }

    // ── hồi tình trạng bộ phận ──
    const permanent = symptoms.some((s) => symptomDef(s).permanent);
    if (!permanent) {
      const rate = def.healRate * days * 1.6;
      part["Tình Trạng"] = clamp((part["Tình Trạng"] ?? 100) + rate, -200, 100);
    }
    part["Triệu Chứng"] = (symptoms.length > 0 ? symptoms : ["Bình Thường"]) as WoundType[];
    // giữ tương thích với đồng hồ giây của bản cũ
    part["Thời Gian Lành Còn (giây)"] = Math.max(0, (part["Thời Gian Lành Còn (giây)"] ?? 0) - days * 86400);
  }

  return out;
}

// ── TÓM TẮT ─────────────────────────────────────────────────────────────────

export function describeBody(body: BodyData | undefined, hp: number, maxHp: number): string {
  const p = bodyProfile(body);
  const shock = shockLevel(hp, maxHp, p.bleedPerDay);
  const caps = (Object.entries(p.capabilities) as [Capability, number][])
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(" · ");
  return [
    `Thể trạng: ${shock} — ${SHOCK_INTRO[shock]}`,
    caps,
    p.bleedPerDay > 0 ? `Đang mất ${p.bleedPerDay} máu mỗi ngày.` : "",
    ...p.lines,
  ].filter(Boolean).join("\n");
}
