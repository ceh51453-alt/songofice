/**
 * Giao Tranh (7.13) — tầng giữa 1-người ↔ đội-quân (phục kích, đột kích trại,
 * ẩu đả trong sảnh): nhân vật then chốt đóng góp sát thương cá nhân, lính vô
 * danh gộp thành POOL; phe cạn pool trước tan/rút. Seed tái lập.
 */
import { makeRng } from "../probability/rng";

export type SkirmishQuality = "Tinh Nhuệ" | "Thường" | "Ô Hợp";

const QUALITY_FACTOR: Record<SkirmishQuality, number> = { "Tinh Nhuệ": 1.5, "Thường": 1.0, "Ô Hợp": 0.6 };

export interface SkirmishSide {
  name: string;
  troops: number; // 5-50
  quality: SkirmishQuality;
  /** nhân vật then chốt: sát thương cá nhân/vòng (từ stat 7.1). */
  keyFighters: { name: string; damagePerRound: number }[];
  /** phe phục kích đánh trước 1 vòng miễn phản đòn (7.13). */
  ambusher?: boolean;
}

/** Chỉ đạo của người chơi — dồn hướng, không roll suông (7.13). */
export type SkirmishDirective = "Đánh Thẳng" | "Bảo Vệ Nhân Vật Then Chốt" | "Hạ Chỉ Huy Địch" | "Mở Đường Tháo Chạy";

export interface SkirmishResult {
  winner: "player" | "enemy" | "escaped";
  rounds: number;
  playerLosses: number;
  enemyLosses: number;
  keyFighterInjured: string | null; // nhân vật then chốt phe ta bị thương (nếu có)
  log: string[];
}

export function resolveSkirmish(
  player: SkirmishSide,
  enemy: SkirmishSide,
  directive: SkirmishDirective,
  seed: number,
): SkirmishResult {
  const rng = makeRng(seed);
  const log: string[] = [];

  // pool HP: mỗi lính ~10 HP × hệ số chất lượng
  let poolP = player.troops * 10 * QUALITY_FACTOR[player.quality];
  let poolE = enemy.troops * 10 * QUALITY_FACTOR[enemy.quality];
  const dmgOf = (s: SkirmishSide, pool: number) => {
    const troopsAlive = Math.max(0, pool) / (10 * QUALITY_FACTOR[s.quality]);
    const troopDmg = troopsAlive * 2.2 * QUALITY_FACTOR[s.quality];
    const keyDmg = s.keyFighters.reduce((x, f) => x + f.damagePerRound, 0);
    return troopDmg + keyDmg;
  };

  // hệ số theo chỉ đạo
  let playerAtk = 1.0;
  let playerDef = 1.0;
  let enemyLeaderPenalty = 1.0;
  let escapeAfter = Infinity;
  switch (directive) {
    case "Đánh Thẳng": playerAtk = 1.1; break;
    case "Bảo Vệ Nhân Vật Then Chốt": playerDef = 1.25; playerAtk = 0.9; break;
    case "Hạ Chỉ Huy Địch": playerAtk = 0.95; enemyLeaderPenalty = 0.8; break; // địch mất nhịp khi chỉ huy bị nhắm
    case "Mở Đường Tháo Chạy": playerDef = 1.15; playerAtk = 0.7; escapeAfter = 3; break;
  }
  log.push(`Chỉ đạo: ${directive}`);

  // phục kích: đánh trước 1 vòng miễn phản đòn
  if (player.ambusher && !enemy.ambusher) {
    const d = dmgOf(player, poolP) * playerAtk * (1 + rng() * 0.3);
    poolE -= d;
    log.push(`Phục kích! Phe ta đánh trước, địch tổn ${Math.round(d / 10)} người`);
  } else if (enemy.ambusher && !player.ambusher) {
    const d = dmgOf(enemy, poolE) * (1 + rng() * 0.3);
    poolP -= d / playerDef;
    log.push(`Trúng mai phục! Ta tổn ${Math.round(d / playerDef / 10)} người ngay loạt đầu`);
  }

  let rounds = 0;
  let winner: SkirmishResult["winner"] | null = null;
  while (rounds < 20 && winner === null) {
    rounds++;
    const dP = dmgOf(player, poolP) * playerAtk * (0.85 + rng() * 0.3);
    const dE = dmgOf(enemy, poolE) * enemyLeaderPenalty * (0.85 + rng() * 0.3);
    poolE -= dP;
    poolP -= dE / playerDef;
    log.push(`Vòng ${rounds}: ta gây ${Math.round(dP)}, chịu ${Math.round(dE / playerDef)}`);
    if (rounds >= escapeAfter) { winner = "escaped"; log.push("Phe ta mở được đường máu rút lui"); break; }
    if (poolE <= 0 && poolP <= 0) { winner = poolP >= poolE ? "player" : "enemy"; }
    else if (poolE <= 0) winner = "player";
    else if (poolP <= 0) winner = "enemy";
  }
  if (winner === null) winner = poolP >= poolE ? "player" : "enemy";

  const playerLosses = Math.min(player.troops, Math.max(0, Math.round(player.troops - Math.max(0, poolP) / (10 * QUALITY_FACTOR[player.quality]))));
  const enemyLosses = Math.min(enemy.troops, Math.max(0, Math.round(enemy.troops - Math.max(0, poolE) / (10 * QUALITY_FACTOR[enemy.quality]))));

  // nhân vật then chốt bị thương nếu thua/hoặc pool ta tụt sâu (trừ khi được bảo vệ)
  let keyFighterInjured: string | null = null;
  if (player.keyFighters.length > 0 && directive !== "Bảo Vệ Nhân Vật Then Chốt") {
    const risk = winner === "enemy" ? 0.5 : poolP < player.troops * 4 ? 0.25 : 0.08;
    if (rng() < risk) {
      keyFighterInjured = player.keyFighters[Math.floor(rng() * player.keyFighters.length)].name;
      log.push(`${keyFighterInjured} bị thương trong loạn chiến`);
    }
  }

  log.push(`Kết cục: ${winner === "player" ? "ta thắng" : winner === "enemy" ? "ta bại" : "rút lui thành công"} — tổn thất ta ${playerLosses}/${player.troops}, địch ${enemyLosses}/${enemy.troops}`);
  return { winner, rounds, playerLosses, enemyLosses, keyFighterInjured, log };
}
