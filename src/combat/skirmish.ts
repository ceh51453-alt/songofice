/**
 * Giao Tranh (7.13) — tầng giữa 1-người ↔ đội-quân (phục kích, đột kích trại,
 * ẩu đả trong sảnh): nhân vật then chốt đóng góp sát thương cá nhân, lính vô
 * danh gộp thành POOL.
 * Epic Update: Giờ đây chịu ảnh hưởng của Sĩ Khí (Morale), Hậu Cần (Logistics)
 * và Binh chủng (Troop Matchup). Quân sẽ Vỡ Trận (Rout) khi Sĩ khí tụt, không cần đánh đến chết hết.
 */
import { makeRng } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import { type TroopType, terrainMultiplier } from "./terrain";

export type SkirmishQuality = "Tinh Nhuệ" | "Thường" | "Ô Hợp";

const QUALITY_FACTOR: Record<SkirmishQuality, number> = { "Tinh Nhuệ": 1.5, "Thường": 1.0, "Ô Hợp": 0.6 };
const LOGISTICS_HP_MOD = { "Đầy Đủ": 1.1, "Tạm Được": 1.0, "Thiếu Hụt": 0.8, "Bị Cắt Đứt": 0.6 };

export interface SkirmishSide {
  name: string;
  troops: number; // 5-50
  quality: SkirmishQuality;
  morale: number; // 0-100
  logistics: "Đầy Đủ" | "Tạm Được" | "Thiếu Hụt" | "Bị Cắt Đứt";
  troopType: TroopType;
  keyFighters: { name: string; damagePerRound: number }[];
  ambusher?: boolean;
}

export type SkirmishDirective = "Đánh Thẳng" | "Bảo Vệ Nhân Vật Then Chốt" | "Hạ Chỉ Huy Địch" | "Mở Đường Tháo Chạy";

export interface SkirmishResult {
  winner: "player" | "enemy" | "escaped" | "routed";
  rounds: number;
  playerLosses: number;
  enemyLosses: number;
  keyFighterInjured: string | null;
  log: string[];
}

// Bảng khắc hệ đơn giản hoá cho Skirmish
function getMatchupMult(atk: TroopType, def: TroopType): number {
  if (atk === "Kỵ Binh" && def === "Cung Binh") return 1.3;
  if (atk === "Lính Giáo" && def === "Kỵ Binh") return 1.4;
  if (atk === "Cung Binh" && def === "Bộ Binh Nặng") return 1.2;
  if (atk === "Bộ Binh Nặng" && def === "Lính Giáo") return 1.3;
  return 1.0; // Mặc định
}

export function resolveSkirmish(
  player: SkirmishSide,
  enemy: SkirmishSide,
  directive: SkirmishDirective,
  seed: number,
): SkirmishResult {
  const rng = makeRng(seed);
  const log: string[] = [];

  const pMatchup = getMatchupMult(player.troopType, enemy.troopType);
  const eMatchup = getMatchupMult(enemy.troopType, player.troopType);
  log.push(`Khắc hệ: ${player.troopType} vs ${enemy.troopType} (Hệ số Ta: ${pMatchup}, Địch: ${eMatchup})`);

  // Pool HP bị ảnh hưởng bởi hậu cần
  let poolP = player.troops * 10 * QUALITY_FACTOR[player.quality] * LOGISTICS_HP_MOD[player.logistics];
  let poolE = enemy.troops * 10 * QUALITY_FACTOR[enemy.quality] * LOGISTICS_HP_MOD[enemy.logistics];
  
  let moraleP = player.morale;
  let moraleE = enemy.morale;

  const dmgOf = (s: SkirmishSide, pool: number, matchup: number) => {
    const troopsAlive = Math.max(0, pool) / (10 * QUALITY_FACTOR[s.quality] * LOGISTICS_HP_MOD[s.logistics]);
    const troopDmg = troopsAlive * 2.2 * QUALITY_FACTOR[s.quality] * matchup;
    const keyDmg = s.keyFighters.reduce((x, f) => x + f.damagePerRound, 0);
    return troopDmg + keyDmg;
  };

  let playerAtk = 1.0;
  let playerDef = 1.0;
  let enemyLeaderPenalty = 1.0;
  let escapeAfter = Infinity;
  switch (directive) {
    case "Đánh Thẳng": playerAtk = 1.1; break;
    case "Bảo Vệ Nhân Vật Then Chốt": playerDef = 1.25; playerAtk = 0.9; break;
    case "Hạ Chỉ Huy Địch": playerAtk = 0.95; enemyLeaderPenalty = 0.8; break; 
    case "Mở Đường Tháo Chạy": playerDef = 1.15; playerAtk = 0.7; escapeAfter = 3; break;
  }
  log.push(`Chỉ đạo: ${directive}`);

  if (player.ambusher && !enemy.ambusher) {
    const d = dmgOf(player, poolP, pMatchup) * playerAtk * (1 + rng() * 0.3);
    poolE -= d;
    moraleE -= 15; // Bị phục kích giảm mạnh sĩ khí
    log.push(`Phục kích! Phe ta đánh trước, địch tổn ${Math.round(d / 10)} người và hoảng loạn`);
  } else if (enemy.ambusher && !player.ambusher) {
    const d = dmgOf(enemy, poolE, eMatchup) * (1 + rng() * 0.3);
    poolP -= d / playerDef;
    moraleP -= 15;
    log.push(`Trúng mai phục! Ta tổn ${Math.round(d / playerDef / 10)} người ngay loạt đầu`);
  }

  let rounds = 0;
  let winner: SkirmishResult["winner"] | null = null;
  
  // Vòng lặp giao tranh
  while (rounds < 20 && winner === null) {
    rounds++;
    const dP = dmgOf(player, poolP, pMatchup) * playerAtk * (0.85 + rng() * 0.3);
    const dE = dmgOf(enemy, poolE, eMatchup) * enemyLeaderPenalty * (0.85 + rng() * 0.3);
    
    poolE -= dP;
    poolP -= dE / playerDef;
    
    // Thương vong làm giảm sĩ khí
    if (dP > dE * 1.5) moraleE -= rng() * 5 + 2;
    if (dE > dP * 1.5) moraleP -= rng() * 5 + 2;

    log.push(`Vòng ${rounds}: ta gây ${Math.round(dP)}, chịu ${Math.round(dE / playerDef)}. (Sĩ khí: Ta ${Math.round(moraleP)}, Địch ${Math.round(moraleE)})`);
    
    if (rounds >= escapeAfter) { winner = "escaped"; log.push("Phe ta mở được đường máu rút lui"); break; }
    
    // Kiểm tra Vỡ Trận (Rout) do sĩ khí quá thấp (<20)
    if (moraleE < 20 && moraleP >= 20) {
      winner = "player";
      log.push("Địch vỡ trận bỏ chạy do sĩ khí quá thấp!");
      break;
    } else if (moraleP < 20 && moraleE >= 20) {
      winner = "enemy";
      log.push("Quân ta vỡ trận bỏ chạy do sĩ khí quá thấp!");
      break;
    }

    if (poolE <= 0 && poolP <= 0) { winner = poolP >= poolE ? "player" : "enemy"; }
    else if (poolE <= 0) winner = "player";
    else if (poolP <= 0) winner = "enemy";
  }
  if (winner === null) winner = poolP >= poolE ? "player" : "enemy";

  const pUnitHp = 10 * QUALITY_FACTOR[player.quality] * LOGISTICS_HP_MOD[player.logistics];
  const eUnitHp = 10 * QUALITY_FACTOR[enemy.quality] * LOGISTICS_HP_MOD[enemy.logistics];

  const playerLosses = Math.min(player.troops, Math.max(0, Math.round(player.troops - Math.max(0, poolP) / pUnitHp)));
  const enemyLosses = Math.min(enemy.troops, Math.max(0, Math.round(enemy.troops - Math.max(0, poolE) / eUnitHp)));

  let keyFighterInjured: string | null = null;
  if (player.keyFighters.length > 0 && directive !== "Bảo Vệ Nhân Vật Then Chốt") {
    const risk = winner === "enemy" ? 0.5 : poolP < (player.troops * pUnitHp * 0.4) ? 0.25 : 0.08;
    if (rng() < risk) {
      keyFighterInjured = player.keyFighters[Math.floor(rng() * player.keyFighters.length)].name;
      log.push(`${keyFighterInjured} bị thương trong loạn chiến`);
    }
  }

  log.push(`Kết cục: ${winner === "player" ? "ta thắng" : winner === "enemy" ? "ta bại" : "rút lui thành công"} — tổn thất ta ${playerLosses}/${player.troops}, địch ${enemyLosses}/${enemy.troops}`);
  return { winner, rounds, playerLosses, enemyLosses, keyFighterInjured, log };
}
