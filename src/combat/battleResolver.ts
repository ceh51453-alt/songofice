/**
 * Battle Resolver (7.9) — hàm THUẦN phán định mọi quy mô ≥ Giao Tranh:
 * chiếnLực = quânSố × chấtLượng × tướng × thếTrận; fog 2D6; thang 7 bậc;
 * thương vong + sĩ khí + số phận tướng; 3 độ khó chỉ nhân/dịch hệ số.
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

const OUTCOME_ORDER: BattleOutcome[] = ["Đại Bại", "Bại", "Tiểu Bại", "Giằng Co", "Tiểu Thắng", "Thắng", "Đại Thắng"];

export interface BattleSideInput extends AggregatedSide {
  name: string;
  /** loại quân chủ đạo (M8 mở rộng thành phần hỗn hợp đầy đủ). */
  troopType: TroopType;
  house?: string;
  general?: {
    name: string;
    command: number; // Thống Soái 0-100
    cunning: number; // Trí Mưu 0-100
    traits: string[];
  };
  /** phe thủ thành (hệ số 1.3-1.5) / phe công (0.6-0.8) — 7.9.2. */
  siegeRole?: "attacker" | "defender";
  /** tiếp tế chiến dịch (KHÁC Hậu Cần chất lượng): "Đầy Đủ"|"Tạm Được"|"Thiếu Hụt"|"Bị Cắt Đứt". */
  supplyLine?: "Đầy Đủ" | "Tạm Được" | "Thiếu Hụt" | "Bị Cắt Đứt";
  /** hệ số ưu khuyết binh chủng từ troopMatchup (M8) — mặc định 1.0. */
  matchupFactor?: number;
  /** hệ số phi đối xứng của rồng/siêu nhiên (M9 — 7.15), mặc định 1.0. */
  dragonFactor?: number;
}

export interface BattleInput {
  /** phe NGƯỜI CHƠI. */
  player: BattleSideInput;
  enemy: BattleSideInput;
  terrain?: Terrain;
  seed: number;
  difficulty: Difficulty;
}

export interface GeneralFate {
  general: string;
  side: "player" | "enemy";
  fate: "tử trận" | "bị bắt" | "thoát được";
}

export interface BattleResult {
  outcome: BattleOutcome; // từ góc nhìn NGƯỜI CHƠI
  powerPlayer: number;
  powerEnemy: number;
  ratio: number; // đã cộng fog
  fog: { dice: [number, number]; mod: number };
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

// ---------------------------------------------------------------------------

const SUPPLY_FACTOR = { "Đầy Đủ": 1.0, "Tạm Được": 0.85, "Thiếu Hụt": 0.7, "Bị Cắt Đứt": 0.5 } as const;

function generalFactor(side: BattleSideInput, context: { terrain?: Terrain; siege: boolean }): number {
  const g = side.general;
  if (!g) return 0.85; // không tướng → phạt nhẹ (7.7)
  let m = 1 + (g.command * 0.6 + g.cunning * 0.4) / 200; // 1.0..1.3
  // đặc tính khớp bối cảnh (+0.05–0.1)
  if (g.traits.includes("Kỵ Binh Đại Sư") && (side.troopType === "Kỵ Binh" || side.troopType === "Kỵ Binh Nhẹ")) m += 0.08;
  if (g.traits.includes("Bậc Thầy Công Thành") && context.siege && side.siegeRole === "attacker") m += 0.1;
  if (g.traits.includes("Phòng Thủ Kiên Cường") && side.siegeRole === "defender") m += 0.08;
  if (g.traits.includes("Táo Bạo")) m += 0.05; // +power (đổi lại +thương vong — áp ở casualty)
  if (g.traits.includes("Thận Trọng")) m -= 0.04;
  return clamp(m, 0.8, 1.5);
}

function postureFactor(side: BattleSideInput, opp: BattleSideInput, terrain: Terrain | undefined): number {
  const matchup = clamp(side.matchupFactor ?? 1.0, 0.7, 1.3);
  const terrainF = terrainMultiplier(side.troopType, terrain, side.house);
  const supply = SUPPLY_FACTOR[side.supplyLine ?? "Đầy Đủ"];
  // trang bị-khoa kỹ (7.9.2): mỗi bậc chênh (~27.5đ) ±0.06, clamp 0.85-1.15
  const equipDelta = (side.equipment - opp.equipment) / 27.5;
  const equipTech = clamp(1 + equipDelta * 0.06, 0.85, 1.15);
  // công/thủ thành
  const siege = side.siegeRole === "defender" ? 1.4 : side.siegeRole === "attacker" ? 0.7 : 1.0;
  return matchup * terrainF * supply * equipTech * siege;
}

export function battlePower(side: BattleSideInput, opp: BattleSideInput, terrain: Terrain | undefined): number {
  const soLuong = side.totalTroops / 100;
  const chatLuong = (side.morale + side.training + side.logistics) / 3 / 100;
  const siege = side.siegeRole !== undefined || opp.siegeRole !== undefined;
  const tuong = generalFactor(side, { terrain, siege });
  const theTran = postureFactor(side, opp, terrain);
  const dragon = clamp(side.dragonFactor ?? 1.0, 0.5, 3.5); // hệ số phi đối xứng rồng (7.15)
  return Math.round(soLuong * chatLuong * tuong * theTran * dragon * 100) / 100;
}

/** Nhiễu loạn 2D6 (7.9.3) — engine đổ, ghi cả xúc xắc vào log. */
export function fogRoll(rng: RNG): { dice: [number, number]; mod: number } {
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  const MOD: Record<number, number> = { 2: -25, 3: -12, 4: -12, 5: -5, 6: -5, 7: 0, 8: 5, 9: 5, 10: 12, 11: 12, 12: 25 };
  return { dice: [d1, d2], mod: MOD[d1 + d2] };
}

/** Thang 7 bậc theo tỷ lệ (7.9.4) — từ góc nhìn phe có ratio là "ta/địch". */
export function gradeBattle(ratio: number): BattleOutcome {
  if (ratio >= 2.0) return "Đại Thắng";
  if (ratio >= 1.5) return "Thắng";
  if (ratio >= 1.2) return "Tiểu Thắng";
  if (ratio >= 0.9) return "Giằng Co";
  if (ratio >= 0.6) return "Tiểu Bại";
  if (ratio >= 0.3) return "Bại";
  return "Đại Bại";
}

/** Khoảng thương vong % theo bậc (7.9.5) — [thắng%, bại%]. */
const CASUALTY_RANGES: Record<BattleOutcome, { win: [number, number]; lose: [number, number] }> = {
  "Đại Thắng": { win: [1, 3], lose: [25, 50] },
  "Thắng": { win: [3, 8], lose: [15, 30] },
  "Tiểu Thắng": { win: [5, 12], lose: [10, 20] },
  "Giằng Co": { win: [8, 15], lose: [8, 15] },
  "Tiểu Bại": { win: [10, 20], lose: [5, 12] }, // "win" = phe ta (đang bại), "lose" = địch
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
  "chủ tướng địch trúng tên, hàng ngũ địch rối loạn",
  "mưa bất chợt làm cung địch ướt dây, thế trận xoay chiều",
];
const KEY_EVENTS_BAD = [
  "một cánh quân ta vỡ trận bất ngờ, địch thừa cơ đánh thốc",
  "tin sai khiến quân ta dàn trận lệch hướng",
  "địch phục sẵn ở sườn đồi, quân ta trúng mai phục",
  "sương mù che khuất hiệu cờ, các cánh quân ta lạc nhau",
];
const KEY_EVENTS_NEUTRAL = [
  "hai bên giằng co từng thước đất tới khi trời sập tối",
  "cả hai chủ tướng đều thận trọng, không bên nào dám dốc toàn lực",
];

/**
 * Phán định trận (mọi quy mô ≥ Giao Tranh dùng chung).
 * Độ khó (7.9.6): chỉ nhân/dịch hệ số — không nhánh công thức riêng.
 */
export function resolveBattle(input: BattleInput): BattleResult {
  const rng = makeRng(input.seed);
  const log: string[] = [];

  // ---- độ khó: điều chỉnh ĐỊCH trước khi tính (7.9.6) ----
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

  const powerPlayer = battlePower(input.player, enemy, input.terrain);
  const powerEnemy = battlePower(enemy, input.player, input.terrain);
  log.push(`Chiến lực: ta ${powerPlayer} (${qualityBand(input.player.training)}) | địch ${powerEnemy} (${qualityBand(input.enemy.training)})`);

  // ---- fog 2D6: cộng vào tỷ lệ (dương = nghiêng về ta) ----
  const fog = fogRoll(rng);
  const rawRatio = powerEnemy > 0 ? powerPlayer / powerEnemy : 99;
  let ratio = rawRatio + fog.mod / 100;
  if (input.difficulty === "Chân Thực") {
    ratio = Math.floor(ratio * 10) / 10; // làm tròn XUỐNG (7.9.6)
  }
  log.push(`Xúc xắc 2D6 = ${fog.dice[0]}+${fog.dice[1]} → nhiễu loạn ${fog.mod >= 0 ? "+" : ""}${fog.mod}`);
  log.push(`Tỷ lệ chiến lực (đã cộng nhiễu): ${ratio.toFixed(2)}`);

  let outcome = gradeBattle(ratio);
  if (input.difficulty === "Nhàn Hạ") {
    // nâng kết quả người chơi 1 bậc
    const idx = OUTCOME_ORDER.indexOf(outcome);
    outcome = OUTCOME_ORDER[Math.min(OUTCOME_ORDER.length - 1, idx + 1)];
  }
  log.push(`Phán định: ${outcome}`);

  // ---- thương vong (7.9.5) — độ khó lệch cận (Nhàn Hạ ta cận dưới, Chân Thực trung-cao) ----
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
  // tướng Táo Bạo: +thương vong bên mình (7.7)
  if (input.player.general?.traits.includes("Táo Bạo")) pctPlayer *= 1.2;
  if (input.player.general?.traits.includes("Thận Trọng")) pctPlayer *= 0.85;

  const casualtiesPlayer = Math.max(1, Math.round((input.player.totalTroops * pctPlayer) / 100));
  const casualtiesEnemy = Math.max(1, Math.round((input.enemy.totalTroops * pctEnemy) / 100));

  // ---- sĩ khí ----
  const ms = MORALE_SHIFT[outcome];
  const moraleShiftPlayer = Math.round(rollIn(rng, ms.win));
  const moraleShiftEnemy = Math.round(rollIn(rng, ms.lose));
  const newMoralePlayer = moraleEnumFromScore(clamp(input.player.morale + moraleShiftPlayer, 0, 100));
  const newMoraleEnemy = moraleEnumFromScore(clamp(input.enemy.morale + moraleShiftEnemy, 0, 100));

  // ---- số phận tướng bên bại (7.9.5/7.7) ----
  let generalFate: GeneralFate | null = null;
  const loserSide = playerWon ? "enemy" : OUTCOME_ORDER.indexOf(outcome) < OUTCOME_ORDER.indexOf("Giằng Co") ? "player" : null;
  if (loserSide) {
    const loser = loserSide === "player" ? input.player : input.enemy;
    if (loser.general) {
      const defeatDepth = Math.abs(OUTCOME_ORDER.indexOf(outcome) - OUTCOME_ORDER.indexOf("Giằng Co")); // 1..3
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

  // ---- diễn biến then chốt (nguyên liệu AI kể — chọn theo fog + kết quả) ----
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
