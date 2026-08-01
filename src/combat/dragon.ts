/**
 * dragon (7.15 + M19) — lớp đặc trưng ASOIAF, gate theo Era. Rồng cho hệ số PHI
 * ĐỐI XỨNG vào chiến lực phe sở hữu + đốt cổng thành (bỏ qua biến tường thành
 * khi vây). KHÔNG bất khả chiến bại: scorpion/địa hình/rồng-đối-rồng có thể hạ
 * hoặc làm bị thương (seed roll, xác suất thấp nhưng ≠ 0).
 *
 * M19: sức rồng không còn chỉ nhìn KÍCH CỠ nữa. Một con Trưởng Thành có Sức Lửa
 * 18, đã qua chục trận, được kỵ sĩ nó thương, khác hẳn một con cùng cỡ vừa mới
 * chịu để người leo lên lưng. Công thức đọc đủ: kích cỡ × tình trạng × chỉ số ×
 * kỹ năng × kinh nghiệm × mức gắn bó với kỵ sĩ.
 *
 * Hàm thuần, cùng seed cùng kết quả.
 */
import type { Dragon } from "../mvu/schema";
import type { RNG } from "../probability/rng";

const SIZE_POWER: Record<Dragon["Kích Cỡ"], number> = {
  "Mới Nở": 0.02,
  "Ấu Long": 0.07,
  "Non": 0.15,
  "Trưởng Thành": 0.55,
  "Cổ Long": 0.82,
  "Khổng Lồ (Balerion-class)": 1.1,
};
const STATUS_MULT: Record<Dragon["Tình Trạng"], number> = { "Khỏe": 1.0, "Bị Thương": 0.4, "Kiệt Sức": 0.2, "Đang Hồi Phục": 0.1 };

/**
 * Hệ số phẩm chất của MỘT con rồng (≈0.4..1.9) — nhân vào sức nền theo kích cỡ.
 * Chỉ số thang 1-20, kỹ năng thang 0-10, kinh nghiệm 0-100.
 */
export function dragonQuality(d: Dragon): number {
  const st = d["Chỉ Số"] ?? { "Sức Lửa": 5, "Sức Bay": 5, "Giáp Vảy": 3, "Hung Dữ": 5, "Trung Thành": 3 };
  // lửa và sự hung dữ là thứ giết quân; giáp vảy giữ nó sống; sức bay quyết định
  // nó chọn được góc bổ nhào hay bị lao xiên cánh
  const raw = st["Sức Lửa"] * 0.4 + st["Hung Dữ"] * 0.25 + st["Giáp Vảy"] * 0.2 + st["Sức Bay"] * 0.15;
  let q = 0.45 + raw / 14; // chỉ số toàn 5 → ≈0.79; toàn 20 → ≈1.88

  // kỹ năng chiến đấu thực chiến
  const skills = d["Kỹ Năng"] ?? {};
  const combatSkill = (skills["Phun Lửa"] ?? 0) + (skills["Bổ Nhào"] ?? 0) + (skills["Chiến Đấu Trên Không"] ?? 0);
  q += Math.min(0.3, combatSkill * 0.02);

  // trận mạc dạy rồng né lao và chọn hướng gió
  q += Math.min(0.2, (d["Kinh Nghiệm"] ?? 0) / 500);

  // rồng không nghe lời thì mạnh mấy cũng không dùng được vào trận
  const bond = d["Kỵ Sĩ"] ? Math.max(d["Mức Độ Thuần Hóa"] ?? 0, 60) : (d["Mức Độ Thuần Hóa"] ?? 0);
  q *= 0.55 + Math.min(100, bond) / 222; // thuần 0 → ×0.55; thuần 100 → ×1.0

  // đói cồn cào thì bất trị
  if ((d["Độ Đói"] ?? 0) >= 80) q *= 0.75;
  // Nhiều đầu cho phép quan sát và tấn công nhiều hướng, nhưng được giữ ở mức
  // vừa phải để rồng ba đầu không tự động thắng mọi cuộc không chiến.
  q *= 1 + (Math.max(1, d["Số Đầu"] ?? 1) - 1) * 0.16;
  const powerBonus: Partial<Record<NonNullable<Dragon["Năng Lực Đặc Biệt"]>, number>> = {
    "Hỏa Ngục": 0.18, "Băng Diệm": 0.13, "Lôi Tức": 0.15, "Độc Vụ": 0.1,
    "Ảnh Diệm": 0.08, "Long Uy": 0.12, "Tái Sinh": 0.08,
  };
  q *= 1 + (d["Năng Lực Đặc Biệt"] ? powerBonus[d["Năng Lực Đặc Biệt"]] ?? 0 : 0);
  return Math.max(0.15, q);
}

/** Sức chiến đấu quy đổi của một con rồng (dùng cho hệ số phe + duel). */
export function dragonPower(d: Dragon): number {
  if (d["_HP"] <= 0) return 0;
  if (d["Đang Bị Xích"]) return 0; // xích trong hầm thì không ra trận được
  const hpFrac = d["_HP Tối Đa"] > 0 ? Math.max(0.3, d["_HP"] / d["_HP Tối Đa"]) : 1;
  return SIZE_POWER[d["Kích Cỡ"]] * STATUS_MULT[d["Tình Trạng"]] * dragonQuality(d) * hpFrac;
}

/** Hệ số rồng cho 1 phe (≥1.0). Cộng dồn theo sức từng con, clamp phi đối xứng. */
export function dragonSideFactor(dragons: Dragon[]): number {
  let bonus = 0;
  for (const d of dragons) bonus += dragonPower(d);
  return 1 + Math.min(bonus, 2.3); // tối đa ~×3.3 (mạnh nhưng không vô hạn)
}

/** Rồng khoẻ đủ lớn → đốt cổng thành, bỏ qua biến tường thành khi vây (7.15/12.2). */
export function dragonBurnsGate(dragons: Dragon[]): boolean {
  return dragons.some(
    (d) => d["_HP"] > 0 && d["Tình Trạng"] === "Khỏe" &&
      ["Trưởng Thành", "Cổ Long", "Khổng Lồ (Balerion-class)"].includes(d["Kích Cỡ"]) && !d["Đang Bị Xích"],
  );
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

/** Quy 1 rồng thành "power" cho duel (kích cỡ×tình trạng×phẩm chất). */
export function dragonDuelPower(d: Dragon): number {
  return dragonPower(d);
}
