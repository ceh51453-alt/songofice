/**
 * Battle Resolver (7.9) — hàm THUẦN phán định mọi quy mô ≥ Giao Tranh:
 * chiếnLực = quânSố × chấtLượng × tướng × thếTrận; fog 2D6; thang 7 bậc;
 * thương vong + sĩ khí + số phận tướng; 3 độ khó chỉ nhân/dịch hệ số.
 * Epic Update: Thêm Thời tiết, Cơ chế Rồng hoang/có kỵ sĩ, và Sự kiện đột biến (Mưu kế).
 * Cùng input + cùng seed LUÔN cùng kết quả (reroll không đổi kết quả đã chốt).
 * AI KHÔNG đụng vào bất kỳ công thức nào ở đây — chỉ nhận BattleResult để kể.
 */
import { makeRng, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import { moraleEnumFromScore, qualityBand, type AggregatedSide } from "./scales";
import { terrainMultiplier, type TroopType } from "./terrain";
import type { Terrain } from "../mvu/schema";

export type Difficulty = "Nhàn Hạ" | "Cân Bằng" | "Chân Thực";
export type BattleOutcome = "Đại Thắng" | "Thắng" | "Tiểu Thắng" | "Giằng Co" | "Tiểu Bại" | "Bại" | "Đại Bại";
export type WeatherCondition = "Trời Quang" | "Mưa Lớn" | "Bão Tuyết" | "Sương Mù";

const OUTCOME_ORDER: BattleOutcome[] = ["Đại Bại", "Bại", "Tiểu Bại", "Giằng Co", "Tiểu Thắng", "Thắng", "Đại Thắng"];

export interface BattleDragonInfo {
  name: string;
  isRidden: boolean;
  power: number; // sức mạnh tổng hợp (Sức Lửa + Sức Bay + Hung Dữ)
  loyalty: number; // thang 1-20
}

export interface BattleSideInput extends AggregatedSide {
  name: string;
  troopType: TroopType;
  house?: string;
  general?: {
    name: string;
    command: number; // Thống Soái 0-100
    cunning: number; // Trí Mưu 0-100
    traits: string[];
  };
  siegeRole?: "attacker" | "defender";
  supplyLine?: "Đầy Đủ" | "Tạm Được" | "Thiếu Hụt" | "Bị Cắt Đứt";
  matchupFactor?: number;
  dragon?: BattleDragonInfo;
}

export interface BattleInput {
  player: BattleSideInput;
  enemy: BattleSideInput;
  terrain?: Terrain;
  weather?: WeatherCondition;
  seed: number;
  difficulty: Difficulty;
}

export interface GeneralFate {
  general: string;
  side: "player" | "enemy";
  fate: "tử trận" | "bị bắt" | "thoát được";
}

export interface BattleResult {
  outcome: BattleOutcome;
  powerPlayer: number;
  powerEnemy: number;
  ratio: number;
  fog: { dice: [number, number]; mod: number };
  weather: WeatherCondition;
  casualtiesPlayer: number;
  casualtiesEnemy: number;
  casualtyPctPlayer: number;
  casualtyPctEnemy: number;
  moraleShiftPlayer: number;
  moraleShiftEnemy: number;
  newMoralePlayer: ReturnType<typeof moraleEnumFromScore>;
  newMoraleEnemy: ReturnType<typeof moraleEnumFromScore>;
  generalFate: GeneralFate | null;
  keyEvent: string;
  log: string[];
}

const SUPPLY_FACTOR = { "Đầy Đủ": 1.0, "Tạm Được": 0.85, "Thiếu Hụt": 0.7, "Bị Cắt Đứt": 0.5 } as const;

function generalFactor(side: BattleSideInput, context: { terrain?: Terrain; siege: boolean; weather: WeatherCondition }): number {
  const g = side.general;
  if (!g) return 0.85;
  let m = 1 + (g.command * 0.6 + g.cunning * 0.4) / 200;
  
  if (g.traits.includes("Kỵ Binh Đại Sư") && (side.troopType === "Kỵ Binh" || side.troopType === "Kỵ Binh Nhẹ")) m += 0.08;
  if (g.traits.includes("Bậc Thầy Công Thành") && context.siege && side.siegeRole === "attacker") m += 0.1;
  if (g.traits.includes("Phòng Thủ Kiên Cường") && side.siegeRole === "defender") m += 0.08;
  if (g.traits.includes("Táo Bạo")) m += 0.05;
  if (g.traits.includes("Thận Trọng")) m -= 0.04;

  // Sương mù làm giảm khả năng chỉ huy tổng thể
  if (context.weather === "Sương Mù") m *= 0.9;
  
  return clamp(m, 0.8, 1.5);
}

function postureFactor(side: BattleSideInput, opp: BattleSideInput, terrain: Terrain | undefined, weather: WeatherCondition): number {
  const matchup = clamp(side.matchupFactor ?? 1.0, 0.7, 1.3);
  const terrainF = terrainMultiplier(side.troopType, terrain, side.house);
  const supply = SUPPLY_FACTOR[side.supplyLine ?? "Đầy Đủ"];
  
  const equipDelta = (side.equipment - opp.equipment) / 27.5;
  const equipTech = clamp(1 + equipDelta * 0.06, 0.85, 1.15);
  
  const siege = side.siegeRole === "defender" ? 1.4 : side.siegeRole === "attacker" ? 0.7 : 1.0;

  // Weather modifiers
  let weatherMod = 1.0;
  if (side.troopType === "Cung Binh" && (weather === "Mưa Lớn" || weather === "Bão Tuyết")) {
    weatherMod = 0.5; // Cung ướt vô dụng
  }
  if (side.troopType === "Kỵ Binh" && weather === "Sương Mù") {
    weatherMod = 0.8; // Khó charge
  }

  return matchup * terrainF * supply * equipTech * siege * weatherMod;
}

export function battlePower(side: BattleSideInput, opp: BattleSideInput, terrain: Terrain | undefined, weather: WeatherCondition): number {
  const soLuong = side.totalTroops / 100;
  const chatLuong = (side.morale + side.training + side.logistics) / 3 / 100;
  const siege = side.siegeRole !== undefined || opp.siegeRole !== undefined;
  const tuong = generalFactor(side, { terrain, siege, weather });
  const theTran = postureFactor(side, opp, terrain, weather);
  
  // Dragon logic
  let dragonMult = 1.0;
  if (side.dragon) {
    let dPower = side.dragon.power; // base around 1.5 - 3.5 normally
    if (side.dragon.isRidden) {
      dPower *= 1.3; // Kỵ sĩ buff
    } else {
      if (side.dragon.loyalty < 10) dPower *= 0.8; // Rồng hoang khó kiểm soát
    }
    if (weather === "Mưa Lớn" || weather === "Bão Tuyết") {
      dPower *= 0.7; // Lửa rồng bị khắc chế
    }
    dragonMult = clamp(dPower, 1.0, 4.0);
  }

  return Math.round(soLuong * chatLuong * tuong * theTran * dragonMult * 100) / 100;
}

export function fogRoll(rng: RNG, weather: WeatherCondition): { dice: [number, number]; mod: number } {
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  const MOD: Record<number, number> = { 2: -25, 3: -12, 4: -12, 5: -5, 6: -5, 7: 0, 8: 5, 9: 5, 10: 12, 11: 12, 12: 25 };
  let mod = MOD[d1 + d2];
  if (weather === "Sương Mù") mod *= 1.5; // Nhiễu loạn tăng mạnh
  return { dice: [d1, d2], mod: Math.round(mod) };
}

export function gradeBattle(ratio: number): BattleOutcome {
  if (ratio >= 2.0) return "Đại Thắng";
  if (ratio >= 1.5) return "Thắng";
  if (ratio >= 1.2) return "Tiểu Thắng";
  if (ratio >= 0.9) return "Giằng Co";
  if (ratio >= 0.6) return "Tiểu Bại";
  if (ratio >= 0.3) return "Bại";
  return "Đại Bại";
}

const CASUALTY_RANGES: Record<BattleOutcome, { win: [number, number]; lose: [number, number] }> = {
  "Đại Thắng": { win: [1, 3], lose: [25, 50] },
  "Thắng": { win: [3, 8], lose: [15, 30] },
  "Tiểu Thắng": { win: [5, 12], lose: [10, 20] },
  "Giằng Co": { win: [8, 15], lose: [8, 15] },
  "Tiểu Bại": { win: [10, 20], lose: [5, 12] },
  "Bại": { win: [15, 30], lose: [3, 8] },
  "Đại Bại": { win: [25, 50], lose: [1, 3] },
};

const MORALE_SHIFT: Record<BattleOutcome, { win: [number, number]; lose: [number, number] }> = {
  "Đại Thắng": { win: [6, 8], lose: [-15, -11] },
  "Thắng": { win: [3, 5], lose: [-10, -6] },
  "Tiểu Thắng": { win: [1, 3], lose: [-5, -1] },
  "Giằng Co": { win: [-2, 2], lose: [-2, 2] },
  "Tiểu Bại": { win: [-5, -1], lose: [1, 3] },
  "Bại": { win: [-10, -6], lose: [3, 5] },
  "Đại Bại": { win: [-15, -11], lose: [6, 8] },
};

function rollIn(rng: RNG, [min, max]: [number, number]): number {
  return min + rng() * (max - min);
}

const KEY_EVENTS_GOOD = [
  "cánh phải địch vỡ trước, quân ta thừa thế truy kích",
  "viện quân ta tới đúng khoảnh khắc quyết định",
  "chủ tướng địch mất bình tĩnh, hàng ngũ địch rối loạn",
];
const KEY_EVENTS_BAD = [
  "một cánh quân ta vỡ trận bất ngờ, địch thừa cơ đánh thốc",
  "tin sai khiến quân ta dàn trận lệch hướng",
  "địch phục sẵn ở sườn đồi, quân ta trúng mai phục",
];
const KEY_EVENTS_NEUTRAL = [
  "hai bên giằng co từng thước đất tới khi trời sập tối",
  "cả hai chủ tướng đều thận trọng, không bên nào dám dốc toàn lực",
];

export function resolveBattle(input: BattleInput): BattleResult {
  const rng = makeRng(input.seed);
  const log: string[] = [];

  // Generate weather if not provided
  let weather = input.weather;
  if (!weather) {
    const wRoll = rng();
    if (input.terrain === "Tuyết") {
      weather = wRoll > 0.6 ? "Bão Tuyết" : (wRoll > 0.4 ? "Sương Mù" : "Trời Quang");
    } else {
      weather = wRoll > 0.8 ? "Mưa Lớn" : (wRoll > 0.6 ? "Sương Mù" : "Trời Quang");
    }
  }
  log.push(`Thời tiết: ${weather}`);

  let player = { ...input.player };
  let enemy = { ...input.enemy };

  if (input.difficulty === "Nhàn Hạ") {
    enemy = {
      ...enemy,
      morale: enemy.morale * 0.7,
      training: enemy.training * 0.7,
      logistics: enemy.logistics * 0.7,
      equipment: enemy.equipment * 0.8,
      general: enemy.general ? { ...enemy.general, command: enemy.general.command * 0.7, cunning: enemy.general.cunning * 0.7 } : undefined,
    };
  }

  // --- Dynamic Events (Mưu kế & Rồng hoang) ---
  if (player.general && enemy.general) {
    const pCunning = player.general.cunning;
    const eCunning = enemy.general.cunning;
    if (rng() < 0.1) { // 10% chance for a plot event
      if (pCunning > eCunning + 15 && rng() > 0.5) {
        log.push(`[Mưu Kế] Tướng ${player.general.name} cho người lẻn ra sau đốt trại lương của địch!`);
        enemy.logistics *= 0.5;
        enemy.supplyLine = "Thiếu Hụt";
      } else if (eCunning > pCunning + 15 && rng() > 0.5) {
        log.push(`[Mưu Kế] Tướng ${enemy.general.name} phục kích đội hậu cần của ta!`);
        player.logistics *= 0.5;
        player.supplyLine = "Thiếu Hụt";
      }
    }
    
    // Đấu Tướng Giữa Trận
    if (rng() < 0.05) {
      log.push(`[Đột Biến] Tướng ${player.general.name} và ${enemy.general.name} chạm trán nhau giữa vòng vây!`);
      const pRoll = rng() * 20 + player.general.command;
      const eRoll = rng() * 20 + enemy.general.command;
      if (pRoll > eRoll + 5) {
        log.push(`[Kết Quả] ${enemy.general.name} trúng thương phải lui về, phe địch đại loạn giảm sĩ khí!`);
        enemy.morale -= 20;
      } else if (eRoll > pRoll + 5) {
        log.push(`[Kết Quả] ${player.general.name} trúng đòn hiểm, quân ta mất tinh thần!`);
        player.morale -= 20;
      } else {
        log.push(`[Kết Quả] Bất phân thắng bại, cận vệ ập tới giải vây.`);
      }
    }
  }

  // Rồng hoang bỏ chạy
  if (player.dragon && !player.dragon.isRidden && player.dragon.loyalty < 8 && rng() < 0.2) {
    log.push(`[Đột Biến] Rồng hoang ${player.dragon.name} nổi điên tấn công bừa bãi rồi bay mất!`);
    player.dragon = undefined;
    player.casualtiesPlayer = (player.casualtiesPlayer || 0) + 100; // takes some casualties
  }

  const powerPlayer = battlePower(player, enemy, input.terrain, weather);
  const powerEnemy = battlePower(enemy, player, input.terrain, weather);
  log.push(`Chiến lực: ta ${powerPlayer} (${qualityBand(player.training)}) | địch ${powerEnemy} (${qualityBand(enemy.training)})`);

  const fog = fogRoll(rng, weather);
  const rawRatio = powerEnemy > 0 ? powerPlayer / powerEnemy : 99;
  let ratio = rawRatio + fog.mod / 100;
  if (input.difficulty === "Chân Thực") {
    ratio = Math.floor(ratio * 10) / 10;
  }
  log.push(`Xúc xắc 2D6 = ${fog.dice[0]}+${fog.dice[1]} → nhiễu loạn ${fog.mod >= 0 ? "+" : ""}${fog.mod}`);
  log.push(`Tỷ lệ chiến lực (đã cộng nhiễu): ${ratio.toFixed(2)}`);

  let outcome = gradeBattle(ratio);
  if (input.difficulty === "Nhàn Hạ") {
    const idx = OUTCOME_ORDER.indexOf(outcome);
    outcome = OUTCOME_ORDER[Math.min(OUTCOME_ORDER.length - 1, idx + 1)];
  }
  log.push(`Phán định: ${outcome}`);

  const playerWon = OUTCOME_ORDER.indexOf(outcome) > OUTCOME_ORDER.indexOf("Giằng Co");
  const ranges = CASUALTY_RANGES[outcome];
  let pctPlayer = rollIn(rng, ranges.win);
  let pctEnemy = rollIn(rng, ranges.lose);
  
  if (input.difficulty === "Nhàn Hạ") {
    pctPlayer = ranges.win[0];
    pctEnemy = ranges.lose[1];
  } else if (input.difficulty === "Chân Thực") {
    pctPlayer = Math.max(pctPlayer, (ranges.win[0] + ranges.win[1]) / 2);
  }
  
  if (player.general?.traits.includes("Táo Bạo")) pctPlayer *= 1.2;
  if (player.general?.traits.includes("Thận Trọng")) pctPlayer *= 0.85;

  const casualtiesPlayer = Math.max(1, Math.round((player.totalTroops * pctPlayer) / 100)) + (player.casualtiesPlayer || 0);
  const casualtiesEnemy = Math.max(1, Math.round((enemy.totalTroops * pctEnemy) / 100));

  const ms = MORALE_SHIFT[outcome];
  const moraleShiftPlayer = Math.round(rollIn(rng, ms.win));
  const moraleShiftEnemy = Math.round(rollIn(rng, ms.lose));
  const newMoralePlayer = moraleEnumFromScore(clamp(player.morale + moraleShiftPlayer, 0, 100));
  const newMoraleEnemy = moraleEnumFromScore(clamp(enemy.morale + moraleShiftEnemy, 0, 100));

  let generalFate: GeneralFate | null = null;
  const loserSide = playerWon ? "enemy" : OUTCOME_ORDER.indexOf(outcome) < OUTCOME_ORDER.indexOf("Giằng Co") ? "player" : null;
  if (loserSide) {
    const loser = loserSide === "player" ? player : enemy;
    if (loser.general) {
      const defeatDepth = Math.abs(OUTCOME_ORDER.indexOf(outcome) - OUTCOME_ORDER.indexOf("Giằng Co")); 
      let riskDeath = 0.05 * defeatDepth;
      let riskCapture = 0.08 * defeatDepth;
      if (loser.general.traits.includes("Táo Bạo")) { riskDeath *= 1.6; riskCapture *= 1.3; }
      if (loser.general.traits.includes("Thận Trọng")) { riskDeath *= 0.5; riskCapture *= 0.7; }
      if (input.difficulty === "Nhàn Hạ" && loserSide === "player") { riskDeath *= 0.2; riskCapture *= 0.5; }
      const roll = rng();
      const fate = roll < riskDeath ? "tử trận" : roll < riskDeath + riskCapture ? "bị bắt" : "thoát được";
      generalFate = { general: loser.general.name, side: loserSide, fate };
      log.push(`Số phận tướng ${loser.general.name} (${loserSide === "player" ? "ta" : "địch"}): ${fate} (roll ${roll.toFixed(3)})`);
    }
  }

  const pool = playerWon ? KEY_EVENTS_GOOD : loserSide === "player" ? KEY_EVENTS_BAD : KEY_EVENTS_NEUTRAL;
  const keyEvent = pool[Math.floor(rng() * pool.length)];
  log.push(`Diễn biến then chốt: ${keyEvent}`);
  log.push(`Thương vong: ta ${casualtiesPlayer} (${pctPlayer.toFixed(1)}%) | địch ${casualtiesEnemy} (${pctEnemy.toFixed(1)}%)`);

  return {
    outcome,
    powerPlayer,
    powerEnemy,
    ratio: Math.round(ratio * 100) / 100,
    fog,
    weather,
    casualtiesPlayer,
    casualtiesEnemy,
    casualtyPctPlayer: Math.round(pctPlayer * 10) / 10,
    casualtyPctEnemy: Math.round(pctEnemy * 10) / 10,
    moraleShiftPlayer,
    moraleShiftEnemy,
    newMoralePlayer,
    newMoraleEnemy,
    generalFate,
    keyEvent,
    log,
  };
}
