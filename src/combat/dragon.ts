/**
 * dragon (7.15) — lớp đặc trưng ASOIAF, gate theo Era. Rồng cho hệ số PHI ĐỐI
 * XỨNG vào chiến lực phe sở hữu + đốt cổng thành (bỏ qua biến tường thành khi
 * vây). KHÔNG bất khả chiến bại: scorpion/địa hình/rồng-đối-rồng có thể hạ hoặc
 * làm bị thương (seed roll, xác suất thấp nhưng ≠ 0). Rồng Bị Thương/Kiệt Sức
 * mất phần lớn hệ số → cửa cho phe yếu. Hàm thuần, cùng seed cùng kết quả.
 */
import type { Dragon } from "../mvu/schema";
import type { RNG } from "../probability/rng";

const SIZE_POWER: Record<Dragon["Kích Cỡ"], number> = {
  "Non": 0.15,
  "Trưởng Thành": 0.55,
  "Khổng Lồ (Balerion-class)": 1.1,
};
const STATUS_MULT: Record<Dragon["Tình Trạng"], number> = { "Khỏe": 1.0, "Bị Thương": 0.4, "Kiệt Sức": 0.2, "Đang Hồi Phục": 0.1 };

/** Hệ số rồng cho 1 phe (≥1.0). Cộng dồn theo kích cỡ×tình trạng, clamp phi đối xứng. */
export function dragonSideFactor(dragons: Dragon[]): number {
  let bonus = 0;
  for (const d of dragons) {
    if (d["_HP"] <= 0) continue;
    bonus += SIZE_POWER[d["Kích Cỡ"]] * STATUS_MULT[d["Tình Trạng"]];
  }
  return 1 + Math.min(bonus, 2.3); // tối đa ~×3.3 (mạnh nhưng không vô hạn)
}

/** Rồng khoẻ đủ lớn → đốt cổng thành, bỏ qua biến tường thành khi vây (7.15/12.2). */
export function dragonBurnsGate(dragons: Dragon[]): boolean {
  return dragons.some((d) => d["_HP"] > 0 && d["Tình Trạng"] === "Khỏe" && d["Kích Cỡ"] !== "Non");
}

export interface DragonDuelResult {
  /** tên rồng bị hạ (mỗi phe). */
  playerDown: string[];
  enemyDown: string[];
  /** tên rồng bị thương. */
  playerHurt: string[];
  enemyHurt: string[];
  log: string[];
}

/**
 * Rồng đối rồng (7.15) — chỉ khi CẢ 2 phe có rồng. Mỗi cặp roll: xác suất thấp
 * hạ (chết) hoặc làm bị thương. Luôn chừa bất ngờ (≠ 0). Bên yếu hơn dễ mất hơn.
 */
export function resolveDragonDuel(
  rng: RNG,
  playerDragons: { name: string; power: number }[],
  enemyDragons: { name: string; power: number }[],
): DragonDuelResult {
  const res: DragonDuelResult = { playerDown: [], enemyDown: [], playerHurt: [], enemyHurt: [], log: [] };
  if (playerDragons.length === 0 || enemyDragons.length === 0) return res;

  const pairs = Math.min(playerDragons.length, enemyDragons.length);
  for (let i = 0; i < pairs; i++) {
    const a = playerDragons[i];
    const b = enemyDragons[i];
    const ratio = a.power / (a.power + b.power); // 0..1, cao = rồng ta mạnh hơn
    const roll = rng();
    // rồng yếu hơn dễ bị hạ/thương; luôn có cửa lật (xác suất nền)
    const enemyDownChance = 0.06 + ratio * 0.12;
    const playerDownChance = 0.06 + (1 - ratio) * 0.12;
    if (roll < enemyDownChance) { res.enemyDown.push(b.name); res.log.push(`Rồng ${a.name} hạ được ${b.name}!`); }
    else if (roll < enemyDownChance + 0.15) { res.enemyHurt.push(b.name); res.log.push(`${b.name} trúng đòn, bị thương.`); }
    else if (roll > 1 - playerDownChance) { res.playerDown.push(a.name); res.log.push(`${a.name} bị ${b.name} quật hạ!`); }
    else if (roll > 1 - playerDownChance - 0.15) { res.playerHurt.push(a.name); res.log.push(`${a.name} trúng đòn, bị thương.`); }
  }
  return res;
}

/** Quy 1 rồng thành "power" cho duel (kích cỡ×tình trạng). */
export function dragonDuelPower(d: Dragon): number {
  return SIZE_POWER[d["Kích Cỡ"]] * STATUS_MULT[d["Tình Trạng"]];
}
