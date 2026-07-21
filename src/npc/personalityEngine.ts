/**
 * personalityEngine (16.2) — Tính cách NPC động 4 trục:
 * - Dịch chuyển theo sự kiện (phản bội → Trung Thành tụt, chiến thắng → Can Đảm tăng)
 * - Nhãn mô tả tự nhiên cho AI
 * - Modifier tốc độ đổi hảo cảm (NPC đa nghi → chậm hơn)
 * - Render cho prompt
 */
import type { Npc } from "../mvu/npcSchema";

// ── Types ────────────────────────────────────────────────────────────────────

export type PersonalityAxis = keyof Npc["Tính Cách"];

export type PersonalityEventType =
  | "betrayal_received"   // bị phản bội
  | "betrayal_committed"  // phản bội người khác
  | "battle_won"          // thắng trận
  | "battle_lost"         // thua trận
  | "kindness_received"   // được đối xử tốt
  | "cruelty_witnessed"   // chứng kiến tàn ác
  | "loyalty_tested"      // trung thành bị thử thách nhưng giữ vững
  | "fear_experienced"    // trải nghiệm sợ hãi
  | "calm_resolution"     // giải quyết bình tĩnh
  | "rage_outburst";      // bùng nổ giận dữ

// ── Event → Axis Shift Mapping ──────────────────────────────────────────────

interface AxisShift {
  axis: PersonalityAxis;
  delta: number; // dương = hướng tích cực (thiện/can đảm/trung thành/điềm tĩnh)
}

const EVENT_SHIFTS: Record<PersonalityEventType, AxisShift[]> = {
  betrayal_received:   [{ axis: "Trục Trung Thành-Phản Trắc", delta: -8 }, { axis: "Trục Nóng Nảy-Điềm Tĩnh", delta: -3 }],
  betrayal_committed:  [{ axis: "Trục Trung Thành-Phản Trắc", delta: -12 }, { axis: "Trục Thiện-Ác", delta: -5 }],
  battle_won:          [{ axis: "Trục Can Đảm-Hèn Nhát", delta: 6 }],
  battle_lost:         [{ axis: "Trục Can Đảm-Hèn Nhát", delta: -4 }],
  kindness_received:   [{ axis: "Trục Thiện-Ác", delta: 5 }, { axis: "Trục Trung Thành-Phản Trắc", delta: 3 }],
  cruelty_witnessed:   [{ axis: "Trục Thiện-Ác", delta: -3 }, { axis: "Trục Nóng Nảy-Điềm Tĩnh", delta: -2 }],
  loyalty_tested:      [{ axis: "Trục Trung Thành-Phản Trắc", delta: 8 }],
  fear_experienced:    [{ axis: "Trục Can Đảm-Hèn Nhát", delta: -5 }, { axis: "Trục Nóng Nảy-Điềm Tĩnh", delta: -3 }],
  calm_resolution:     [{ axis: "Trục Nóng Nảy-Điềm Tĩnh", delta: 6 }],
  rage_outburst:       [{ axis: "Trục Nóng Nảy-Điềm Tĩnh", delta: -8 }],
};

// ── Shift ────────────────────────────────────────────────────────────────────

/**
 * Dịch chuyển tính cách NPC theo sự kiện. Mutate trực tiếp.
 * @param magnitude — hệ số nhân (1.0 = bình thường, 0.5 = nhẹ, 2.0 = mạnh).
 */
export function shiftPersonality(npc: Npc, eventType: PersonalityEventType, magnitude = 1.0): void {
  const shifts = EVENT_SHIFTS[eventType];
  if (!shifts) return;
  for (const { axis, delta } of shifts) {
    const current = npc["Tính Cách"][axis];
    npc["Tính Cách"][axis] = Math.max(-100, Math.min(100, current + Math.round(delta * magnitude)));
  }
}

// ── Labels ───────────────────────────────────────────────────────────────────

interface AxisLabel {
  positive: string;  // giá trị dương
  negative: string;  // giá trị âm
}

const AXIS_LABELS: Record<PersonalityAxis, AxisLabel> = {
  "Trục Thiện-Ác":              { positive: "thiện lương", negative: "tàn nhẫn" },
  "Trục Can Đảm-Hèn Nhát":     { positive: "can đảm", negative: "hèn nhát" },
  "Trục Trung Thành-Phản Trắc": { positive: "trung thành", negative: "phản trắc" },
  "Trục Nóng Nảy-Điềm Tĩnh":   { positive: "điềm tĩnh", negative: "nóng nảy" },
};

/** Nhãn mô tả cho 1 trục. */
export function personalityLabel(axis: PersonalityAxis, value: number): string {
  const labels = AXIS_LABELS[axis];
  const abs = Math.abs(value);
  const intensity = abs >= 70 ? "rất" : abs >= 40 ? "khá" : abs >= 15 ? "hơi" : "";
  const label = value >= 0 ? labels.positive : labels.negative;
  return intensity ? `${intensity} ${label}` : "trung tính";
}

/** Render 4 trục thành dòng mô tả tự nhiên cho AI. */
export function formatPersonalityForPrompt(npc: Npc): string {
  const axes = Object.entries(npc["Tính Cách"]) as [PersonalityAxis, number][];
  const descriptions = axes
    .map(([axis, value]) => personalityLabel(axis, value))
    .filter((d) => d !== "trung tính");

  const traits = npc["Nét Tính Cách"];
  const parts: string[] = [];
  if (descriptions.length > 0) parts.push(`Tính cách: ${descriptions.join(", ")}`);
  if (traits.length > 0) parts.push(`Nét nổi bật: ${traits.join(", ")}`);
  if (npc["Cung Bậc Phát Triển"]) parts.push(`Arc: ${npc["Cung Bậc Phát Triển"]}`);
  return parts.join(". ") + (parts.length > 0 ? "." : "");
}

// ── Modifier ─────────────────────────────────────────────────────────────────

/**
 * Hệ số điều tiết tốc độ đổi Hảo Cảm dựa trên tính cách NPC.
 * NPC đa nghi (Trung Thành âm) → chậm tăng hảo cảm.
 * NPC trung thành (Trung Thành dương cao) → chậm giảm.
 * Trả về multiplier (0.4 .. 1.6).
 */
export function personalityModifier(npc: Npc, isPositiveEvent: boolean): number {
  const loyalty = npc["Tính Cách"]["Trục Trung Thành-Phản Trắc"];
  const temperament = npc["Tính Cách"]["Trục Nóng Nảy-Điềm Tĩnh"];

  if (isPositiveEvent) {
    // NPC đa nghi (loyalty âm) → khó tăng hảo cảm
    // NPC trung thành (loyalty dương) → dễ tăng
    const factor = 1.0 + (loyalty / 200); // -100→0.5, 0→1.0, +100→1.5
    return Math.max(0.4, Math.min(1.6, factor));
  } else {
    // Sự kiện xấu: NPC trung thành → chậm giảm; NPC phản trắc → nhanh giảm
    // NPC nóng nảy (temperament âm) → phản ứng mạnh hơn
    const loyaltyFactor = 1.0 - (loyalty / 200); // +100→0.5, 0→1.0, -100→1.5
    const tempFactor = 1.0 - (temperament / 400); // -100→1.25, 0→1.0, +100→0.75
    return Math.max(0.4, Math.min(1.6, loyaltyFactor * tempFactor));
  }
}
