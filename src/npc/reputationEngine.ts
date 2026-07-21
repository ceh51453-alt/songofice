/**
 * reputationEngine (16.4) — Danh tiếng đa chiều + Bậc Danh Vọng (Renown tier).
 *
 * 4 trục: Vinh Dự, Nhân Từ, Uy Dũng, Xảo Quyệt.
 * Engine dẫn xuất Bậc Danh Vọng (Vinh 1-5 / Nhục 1-5 / Vô Danh 0) từ tổng
 * có trọng số + chiến công + quy mô lãnh thổ. Mỗi Nhà lớn trọng trục khác nhau.
 */
import type { StatData } from "../mvu/schema";

// ── Renown Tier Table ────────────────────────────────────────────────────────

export interface RenownInfo {
  /** Bậc: dương = Vinh, âm = Nhục, 0 = Vô Danh. */
  tier: number;
  /** Nhãn gợi hình tiếng Việt. */
  label: string;
  /** Mô tả ngắn cho AI. */
  description: string;
}

const RENOWN_TABLE: { min: number; tier: number; label: string; description: string }[] = [
  { min:  150, tier:  5, label: "Huyền Thoại Sống",      description: "Tên tuổi khắc vào sử xanh Bảy Phủ, ngâm trong ca dao" },
  { min:  100, tier:  4, label: "Danh Chấn Thất Quốc",   description: "Cả lục địa biết tiếng, lãnh chúa lớn phải nể" },
  { min:   60, tier:  3, label: "Lừng Danh Một Cõi",     description: "Nổi tiếng khắp một vùng, hào tộc kính trọng" },
  { min:   30, tier:  2, label: "Có Tiếng Tốt",          description: "Được chư hầu gần khen ngợi, danh dự vững" },
  { min:   10, tier:  1, label: "Kẻ Đáng Kính",          description: "Tiếng thơm cơ bản trong giới thân cận" },
  { min:  -10, tier:  0, label: "Vô Danh Tiểu Tốt",     description: "Chưa ai biết đến" },
  { min:  -30, tier: -1, label: "Bị Gièm Pha",           description: "Bị nói xấu trong thanh nghị" },
  { min:  -60, tier: -2, label: "Ô Danh Gia Tộc",       description: "Hành vi bất chính khiến cả Nhà mang tiếng" },
  { min: -100, tier: -3, label: "Kẻ Phản Bội",           description: "Bội thề, giết chủ — mất hết danh dự" },
  { min: -150, tier: -4, label: "Quái Vật Bị Nguyền",    description: "Ác danh vang khắp lục địa, ngàn người chỉ trích" },
];
const WORST_TIER: RenownInfo = { tier: -5, label: "Lưu Xú Muôn Đời", description: "Cái tên trở thành lời nguyền rủa trong sử sách" };

// ── House Preferences ────────────────────────────────────────────────────────

/** Mỗi Nhà lớn trọng trục Danh Vọng nào (trọng số cao hơn khi đánh giá NPC phản ứng). */
export interface HousePreference {
  primary: keyof ReputationAxes;
  secondary: keyof ReputationAxes;
  weight: { primary: number; secondary: number };
}

export interface ReputationAxes {
  "Vinh Dự": number;
  "Nhân Từ": number;
  "Uy Dũng": number;
  "Xảo Quyệt": number;
}

const HOUSE_PREFS: Record<string, HousePreference> = {
  Stark:      { primary: "Vinh Dự",   secondary: "Nhân Từ",   weight: { primary: 2.0, secondary: 1.5 } },
  Lannister:  { primary: "Xảo Quyệt", secondary: "Uy Dũng",  weight: { primary: 2.0, secondary: 1.5 } },
  Targaryen:  { primary: "Uy Dũng",   secondary: "Vinh Dự",   weight: { primary: 2.0, secondary: 1.0 } },
  Baratheon:  { primary: "Uy Dũng",   secondary: "Vinh Dự",   weight: { primary: 1.8, secondary: 1.2 } },
  Greyjoy:    { primary: "Uy Dũng",   secondary: "Xảo Quyệt", weight: { primary: 2.0, secondary: 1.0 } },
  Tyrell:     { primary: "Nhân Từ",   secondary: "Xảo Quyệt", weight: { primary: 1.5, secondary: 1.5 } },
  Martell:    { primary: "Xảo Quyệt", secondary: "Nhân Từ",   weight: { primary: 1.5, secondary: 1.5 } },
  Arryn:      { primary: "Vinh Dự",   secondary: "Uy Dũng",   weight: { primary: 2.0, secondary: 1.0 } },
  Tully:      { primary: "Vinh Dự",   secondary: "Nhân Từ",   weight: { primary: 1.5, secondary: 1.5 } },
};

const DEFAULT_PREF: HousePreference = {
  primary: "Vinh Dự", secondary: "Uy Dũng", weight: { primary: 1.0, secondary: 1.0 },
};

// ── Public API ───────────────────────────────────────────────────────────────

/** Lấy trọng số trục Danh Vọng của một Nhà. */
export function houseReputationPreference(house: string): HousePreference {
  return HOUSE_PREFS[house] ?? DEFAULT_PREF;
}

/** Tính tổng Danh Vọng có trọng số, bao gồm bonus lãnh thổ. */
export function computeRenownScore(stat: StatData): number {
  const rep = stat["Danh Vọng"];
  // Trung bình 4 trục, lấy cả dấu (có thể âm)
  const axisAvg = (rep["Vinh Dự"] + rep["Nhân Từ"] + rep["Uy Dũng"] + rep["Xảo Quyệt"]) / 4;
  // Bonus lãnh thổ: mỗi vùng sở hữu +5
  const territories = Object.keys(stat["Lãnh Địa"]).length;
  // Bonus cấp độ nhân vật
  const level = stat["Thông Tin Nhân Vật"]["Cấp Độ"];
  return axisAvg + territories * 5 + level * 2;
}

/** Dẫn xuất Bậc Danh Vọng từ tổng score. */
export function renownTier(score: number): RenownInfo {
  for (const row of RENOWN_TABLE) {
    if (score >= row.min) return { tier: row.tier, label: row.label, description: row.description };
  }
  return WORST_TIER;
}

/** Tiện ích: lấy RenownInfo thẳng từ stat. */
export function computeRenown(stat: StatData): RenownInfo {
  return renownTier(computeRenownScore(stat));
}

/**
 * Modifier hảo cảm NPC lạ dựa trên danh tiếng + sở thích Nhà.
 * Trả về bonus/penalty (-20..+20) cho lần gặp đầu.
 */
export function npcReactionModifier(
  npcHouse: string | undefined,
  playerRep: ReputationAxes,
): number {
  const pref = houseReputationPreference(npcHouse ?? "");
  const primaryVal = playerRep[pref.primary];
  const secondaryVal = playerRep[pref.secondary];
  // Weighted average, scaled to -20..+20
  const raw = (primaryVal * pref.weight.primary + secondaryVal * pref.weight.secondary)
            / (pref.weight.primary + pref.weight.secondary);
  return Math.round(Math.max(-20, Math.min(20, raw / 5)));
}

/**
 * Render Danh Vọng + Bậc cho prompt AI.
 */
export function renderReputationForAI(stat: StatData): string {
  const rep = stat["Danh Vọng"];
  const info = computeRenown(stat);
  const lines = [
    `Danh Vọng: Vinh Dự ${rep["Vinh Dự"]} · Nhân Từ ${rep["Nhân Từ"]} · Uy Dũng ${rep["Uy Dũng"]} · Xảo Quyệt ${rep["Xảo Quyệt"]}.`,
    `Bậc: ${info.label} (${info.description}).`,
  ];
  return lines.join(" ");
}
