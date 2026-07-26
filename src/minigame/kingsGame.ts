/**
 * kingsGame V3 — Engine game bài "Cuộc Chiến Vương Giả":
 *
 * V3 mới:
 * - 3 loại bài: creature (đấu), trap (đặt úp), spell (dùng tức thì)
 * - Nghĩa Địa (Graveyard): creature chết vào đây, có thể hồi sinh
 * - Bẫy: đặt úp, tự động kích hoạt khi đúng điều kiện
 * - Ma Pháp: hiệu ứng mạnh dùng 1 lần
 * - AI nâng cấp: biết dùng trap/spell
 */
import {
  type GameCard,
  BASE_DECK, HOUSE_COMBO_BONUS,
} from "./cardData";
import { makeRng, type RNG } from "../probability/rng";

// ═══════════════════════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ActiveBuff {
  type: "atk-bonus" | "atk-penalty" | "def-penalty" | "ward" | "fire-boost" | "swap-stats" | "copied-special";
  value: number;
  /** Số lượt còn lại. */
  turnsLeft: number;
  /** Special copy (cho trap Gương Mặt). */
  copiedSpecial?: GameCard["special"];
}

/** Bẫy đã đặt — mặt sau, chờ kích hoạt. */
export interface SetTrap {
  card: GameCard;
  /** Đã kích hoạt chưa. */
  triggered: boolean;
}

/** Thông tin spell đã xem tay đối thủ. */
export interface RevealedCards {
  cards: GameCard[];
  turnsLeft: number;
}

export interface KingsGameState {
  playerHand: GameCard[];
  aiHand: GameCard[];
  rounds: KingsRound[];
  currentRound: number;
  totalRounds: number;
  playerPick: GameCard | null;
  /** Buff carry-over. */
  playerAtkBonus: number;
  aiAtkBonus: number;
  /** Debuff (burn). */
  playerAtkPenalty: number;
  aiAtkPenalty: number;
  playerBonusPoints: number;
  aiBonusPoints: number;
  /** Lá hồi sinh (resurrect) đang chờ. */
  playerResurrect: GameCard | null;
  aiResurrect: GameCard | null;
  /** Nhà của lá trước (cho combo check). */
  playerLastHouse: string | null;
  aiLastHouse: string | null;

  // ── V3: Nghĩa Địa, Bẫy, Ma Pháp ──
  /** Nghĩa Địa — creature đã sử dụng/chết. */
  playerGraveyard: GameCard[];
  aiGraveyard: GameCard[];
  /** Bẫy đặt úp (tối đa 2). */
  playerTraps: SetTrap[];
  aiTraps: SetTrap[];
  /** Buffs/debuffs đang hoạt động. */
  playerBuffs: ActiveBuff[];
  aiBuffs: ActiveBuff[];
  /** Lá bài đối thủ đã tiết lộ (spell Phép Nhìn Ba Mắt). */
  revealedAiCards: RevealedCards | null;
  /** Log sự kiện bẫy/spell kích hoạt. */
  eventLog: string[];

  phase: "picking" | "reveal" | "done";
  result: "win" | "lose" | "draw" | null;
}

export interface KingsRound {
  playerCard: GameCard;
  aiCard: GameCard;
  playerEffAtk: number;
  aiEffAtk: number;
  playerEffDef: number;
  aiEffDef: number;
  winner: "player" | "ai" | "draw";
  narration: string;
  /** Combo kích hoạt. */
  playerCombo: string | null;
  aiCombo: string | null;
  /** Bẫy đã kích hoạt lượt này. */
  triggeredTraps: string[];
  /** Spell đã dùng lượt này. */
  usedSpells: string[];
}

// ═══════════════════════════════════════════════════════════════
//  DEAL & CREATE
// ═══════════════════════════════════════════════════════════════

/** Chia bài: shuffle 60 lá, chia 9 mỗi bên. */
function dealHands(rng: RNG): { playerHand: GameCard[]; aiHand: GameCard[] } {
  const deck = [...BASE_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    playerHand: deck.slice(0, 9),
    aiHand: deck.slice(9, 18),
  };
}

export function createKingsGame(seed: number): KingsGameState {
  const rng = makeRng(seed);
  const { playerHand, aiHand } = dealHands(rng);
  return {
    playerHand,
    aiHand,
    rounds: [],
    currentRound: 0,
    totalRounds: 6,
    playerPick: null,
    playerAtkBonus: 0,
    aiAtkBonus: 0,
    playerAtkPenalty: 0,
    aiAtkPenalty: 0,
    playerBonusPoints: 0,
    aiBonusPoints: 0,
    playerResurrect: null,
    aiResurrect: null,
    playerLastHouse: null,
    aiLastHouse: null,
    // V3
    playerGraveyard: [],
    aiGraveyard: [],
    playerTraps: [],
    aiTraps: [],
    playerBuffs: [],
    aiBuffs: [],
    revealedAiCards: null,
    eventLog: [],
    phase: "picking",
    result: null,
  };
}

// ═══════════════════════════════════════════════════════════════
//  TRAP LOGIC
// ═══════════════════════════════════════════════════════════════

/** Kiểm tra xem bẫy có kích hoạt không. */
function checkTrapCondition(
  trap: GameCard,
  opponentCard: GameCard,
  lastRoundWinner: "player" | "ai" | "draw" | null,
  ownLostLastRound: boolean,
  opponentHandSize: number,
): boolean {
  switch (trap.trapCondition) {
    case "high-atk": return opponentCard.atk >= 7;
    case "warrior": return opponentCard.group === "warrior";
    case "legendary": return opponentCard.rarity === "legendary";
    case "has-special": return !!opponentCard.special;
    case "opponent-won": return lastRoundWinner !== null && !ownLostLastRound;
    case "after-loss": return ownLostLastRound;
    case "many-cards": return opponentHandSize >= 3;
    case "always": return true;
    case "house-match": return opponentCard.house === trap.house;
    default: return false;
  }
}

/** Áp hiệu ứng bẫy lên state. Trả narration string. */
function applyTrapEffect(
  trap: GameCard,
  opponentCard: GameCard,
  opponentHand: GameCard[],
  _rng: RNG,
): {
  atkMod: number;
  defMod: number;
  destroyCard: boolean;
  newBuffs: ActiveBuff[];
  narration: string;
  /** Thay card đối thủ (cho Lưới Nhện). */
  replacementCard: GameCard | null;
  /** Mất 1 lá tay (Rìu Máu). */
  discardFromHand: boolean;
  /** Score penalty cho đối thủ (Cửa Sập). */
  scorePenalty: number;
  /** Vô hiệu special (Hào Nước). */
  nullifySpecial: boolean;
} {
  const base = { atkMod: 0, defMod: 0, destroyCard: false, newBuffs: [] as ActiveBuff[], narration: "", replacementCard: null as GameCard | null, discardFromHand: false, scorePenalty: 0, nullifySpecial: false };

  switch (trap.id) {
    case "t01": // Lửa Rừng Hoang: -4 ATK
      return { ...base, atkMod: -4, narration: `Bẫy [${trap.name}] kích hoạt! Đối thủ -4 ATK!` };
    case "t02": // Bão Tuyết: -3 ATK -3 DEF
      return { ...base, atkMod: -3, defMod: -3, narration: `Bẫy [${trap.name}] kích hoạt! Bão tuyết cuốn đối thủ: -3 ATK, -3 DEF!` };
    case "t03": { // Lưới Nhện: đổi lá yếu nhất
      const weakest = [...opponentHand].sort((a, b) => (a.atk + a.def) - (b.atk + b.def))[0];
      if (weakest && (weakest.atk + weakest.def) < (opponentCard.atk + opponentCard.def)) {
        return { ...base, replacementCard: weakest, narration: `Bẫy [${trap.name}] kích hoạt! Đối thủ buộc đổi ${opponentCard.name} thành ${weakest.name}!` };
      }
      return { ...base, narration: `Bẫy [${trap.name}] kích hoạt nhưng không hiệu quả.` };
    }
    case "t04": // Lời Nguyền Máu: -2 ATK 2 lượt
      return { ...base, newBuffs: [{ type: "atk-penalty", value: 2, turnsLeft: 2 }], narration: `Bẫy [${trap.name}] kích hoạt! Lời nguyền: -2 ATK trong 2 lượt!` };
    case "t05": // Cửa Sập Crossbow: -1 điểm
      return { ...base, scorePenalty: 1, narration: `Bẫy [${trap.name}] kích hoạt! Mũi tên nỏ: đối thủ mất 1 điểm!` };
    case "t06": // Lửa Valyria: phá hủy lá
      return { ...base, destroyCard: true, narration: `Bẫy [${trap.name}] kích hoạt! Lửa Valyria thiêu rụi ${opponentCard.name}!` };
    case "t07": // Phản Bội: nullify special + đảo ATK/DEF
      return { ...base, nullifySpecial: true, narration: `Bẫy [${trap.name}] kích hoạt! Phản bội: vô hiệu hóa đặc tính và đảo ATK/DEF!` };
    case "t08": // Sương Mù: narration only (AI logic handles this)
      return { ...base, narration: `Bẫy [${trap.name}] kích hoạt! Sương mù che mắt — đối thủ chọn bài hỗn loạn!` };
    case "t09": // Cung Thủ Ẩn: +5 ATK lá kế
      return { ...base, newBuffs: [{ type: "atk-bonus", value: 5, turnsLeft: 1 }], narration: `Bẫy [${trap.name}] kích hoạt! Mũi tên trợ lực: +5 ATK lá kế!` };
    case "t10": // Hào Nước: nullify special
      return { ...base, nullifySpecial: true, narration: `Bẫy [${trap.name}] kích hoạt! Hào nước sâu vô hiệu hóa đặc tính ${opponentCard.name}!` };
    case "t11": { // Rìu Máu: mất 1 lá tay
      return { ...base, discardFromHand: true, narration: `Bẫy [${trap.name}] kích hoạt! Rìu máu chém — đối thủ mất 1 lá!` };
    }
    case "t12": { // Gương Mặt: copy special
      if (opponentCard.special) {
        return { ...base, newBuffs: [{ type: "copied-special", value: 0, turnsLeft: 1, copiedSpecial: opponentCard.special }], narration: `Bẫy [${trap.name}] kích hoạt! Sao chép đặc tính [${opponentCard.special}]!` };
      }
      return { ...base, narration: `Bẫy [${trap.name}] kích hoạt nhưng không có gì để sao chép.` };
    }
    default:
      return { ...base, narration: `Bẫy [${trap.name}] kích hoạt!` };
  }
}

// ═══════════════════════════════════════════════════════════════
//  SPELL LOGIC
// ═══════════════════════════════════════════════════════════════

/** Xử lý spell. Trả state thay đổi + narration. */
function applySpellEffect(
  spell: GameCard,
  state: KingsGameState,
  isPlayer: boolean,
  _rng: RNG,
): { stateChanges: Partial<KingsGameState>; narration: string } {
  const hand = isPlayer ? state.playerHand : state.aiHand;
  const graveyard = isPlayer ? state.playerGraveyard : state.aiGraveyard;
  const buffsKey = isPlayer ? "playerBuffs" : "aiBuffs";
  const oppBuffsKey = isPlayer ? "aiBuffs" : "playerBuffs";
  const handKey = isPlayer ? "playerHand" : "aiHand";

  switch (spell.spellEffect) {
    case "resurrect-grave": {
      if (graveyard.length === 0) return { stateChanges: {}, narration: `[${spell.name}]: Nghĩa Địa trống!` };
      const best = [...graveyard].sort((a, b) => (b.atk + b.def) - (a.atk + a.def))[0];
      const newGrave = graveyard.filter((c) => c.id !== best.id);
      const graveKey = isPlayer ? "playerGraveyard" : "aiGraveyard";
      return {
        stateChanges: { [handKey]: [...hand.filter((c) => c.id !== spell.id), best], [graveKey]: newGrave },
        narration: `[${spell.name}]: ${best.name} hồi sinh từ Nghĩa Địa!`,
      };
    }
    case "fire-boost":
      return {
        stateChanges: { [buffsKey]: [...(isPlayer ? state.playerBuffs : state.aiBuffs), { type: "fire-boost" as const, value: 6, turnsLeft: 1 }] },
        narration: `[${spell.name}]: Lửa thiêng! +6 ATK lá kế — nhưng lá đó sẽ bị thiêu!`,
      };
    case "reveal-hand": {
      const oppHand = isPlayer ? state.aiHand : state.playerHand;
      const revealed = oppHand.slice(0, 3);
      if (isPlayer) {
        return { stateChanges: { revealedAiCards: { cards: revealed, turnsLeft: 2 } }, narration: `[${spell.name}]: Nhìn thấu tay đối thủ: ${revealed.map((c) => c.name).join(", ")}!` };
      }
      return { stateChanges: {}, narration: `[${spell.name}]: Đối thủ nhìn thấu tay ngươi!` };
    }
    case "ward":
      return {
        stateChanges: { [buffsKey]: [...(isPlayer ? state.playerBuffs : state.aiBuffs), { type: "ward" as const, value: 0, turnsLeft: 1 }] },
        narration: `[${spell.name}]: Bùa hộ mệnh! Lá kế miễn nhiễm mọi debuff!`,
      };
    case "summon-ghost": {
      const ghost: GameCard = {
        id: `ghost-${Date.now()}`, name: "Bóng Ma Triệu Hồi", house: "Night King",
        atk: 8, def: 2, group: "warrior", rarity: "rare", cost: 0, type: "creature",
        desc: "Linh hồn phục vụ tạm thời.", special: "ambush",
      };
      return {
        stateChanges: { [handKey]: [...hand.filter((c) => c.id !== spell.id), ghost] },
        narration: `[${spell.name}]: Một bóng ma xuất hiện từ hư vô!`,
      };
    }
    case "long-night":
      return {
        stateChanges: { [oppBuffsKey]: [...(isPlayer ? state.aiBuffs : state.playerBuffs), { type: "def-penalty" as const, value: 3, turnsLeft: 3 }] },
        narration: `[${spell.name}]: Lời nguyền đêm dài! Đối thủ -3 DEF trong 3 lượt!`,
      };
    case "dragon-fire": {
      const maxAtk = graveyard.reduce((max, c) => Math.max(max, c.atk), 0);
      if (maxAtk === 0) return { stateChanges: {}, narration: `[${spell.name}]: Nghĩa Địa trống!` };
      const oppBonusKey = isPlayer ? "aiBonusPoints" : "playerBonusPoints";
      const penalty = Math.max(0, Math.floor(maxAtk / 3));
      return {
        stateChanges: { [oppBonusKey]: Math.max(0, (isPlayer ? state.aiBonusPoints : state.playerBonusPoints) - penalty) },
        narration: `[${spell.name}]: Long Lửa! Gây ${maxAtk} sát thương (đối thủ -${penalty} điểm)!`,
      };
    }
    case "swap-stats":
      return {
        stateChanges: { [buffsKey]: [...(isPlayer ? state.playerBuffs : state.aiBuffs), { type: "swap-stats" as const, value: 0, turnsLeft: 1 }] },
        narration: `[${spell.name}]: Hoán đổi vận mệnh! Lá kế sẽ đổi ATK↔DEF!`,
      };
    default:
      return { stateChanges: {}, narration: `[${spell.name}] kích hoạt!` };
  }
}

// ═══════════════════════════════════════════════════════════════
//  AI LOGIC
// ═══════════════════════════════════════════════════════════════

/** AI chiến lược V3: xét trap/spell + creature. */
function aiPickCard(hand: GameCard[], rng: RNG, _penalty: number, lastHouse: string | null, hasFogTrap: boolean): GameCard {
  if (hand.length === 0) throw new Error("AI hand empty");

  // Nếu bị Sương Mù → random
  if (hasFogTrap) {
    return hand[Math.floor(rng() * hand.length)];
  }

  // 15% chance dùng spell nếu có
  const spells = hand.filter((c) => c.type === "spell");
  if (spells.length > 0 && rng() < 0.15) {
    return spells[Math.floor(rng() * spells.length)];
  }

  // 15% chance đặt trap nếu có
  const traps = hand.filter((c) => c.type === "trap");
  if (traps.length > 0 && rng() < 0.15) {
    return traps[Math.floor(rng() * traps.length)];
  }

  // Lấy creature
  const creatures = hand.filter((c) => c.type === "creature");
  if (creatures.length === 0) {
    // Không còn creature → dùng gì có
    return hand[Math.floor(rng() * hand.length)];
  }

  // 20% random
  if (rng() < 0.2) {
    return creatures[Math.floor(rng() * creatures.length)];
  }

  // Ưu tiên combo
  if (lastHouse) {
    const comboCards = creatures.filter((c) => c.house === lastHouse);
    if (comboCards.length > 0 && rng() < 0.6) {
      return comboCards.reduce((best, c) => c.atk + c.def > best.atk + best.def ? c : best, comboCards[0]);
    }
  }

  // 50% tổng cao nhất, 50% ATK cao nhất
  if (rng() < 0.5) {
    return creatures.reduce((best, c) => (c.atk + c.def) > (best.atk + best.def) ? c : best, creatures[0]);
  }
  return creatures.reduce((best, c) => c.atk > best.atk ? c : best, creatures[0]);
}

// ═══════════════════════════════════════════════════════════════
//  RESOLVE ROUND
// ═══════════════════════════════════════════════════════════════

/** Tổng ATK/DEF buff active. */
function sumBuffs(buffs: ActiveBuff[], type: ActiveBuff["type"]): number {
  return buffs.filter((b) => b.type === type).reduce((sum, b) => sum + b.value, 0);
}

function hasWard(buffs: ActiveBuff[]): boolean {
  return buffs.some((b) => b.type === "ward" && b.turnsLeft > 0);
}

function hasFireBoost(buffs: ActiveBuff[]): boolean {
  return buffs.some((b) => b.type === "fire-boost" && b.turnsLeft > 0);
}

function hasSwapStats(buffs: ActiveBuff[]): boolean {
  return buffs.some((b) => b.type === "swap-stats" && b.turnsLeft > 0);
}

/** Tick buffs — giảm turnsLeft, loại bỏ hết hạn. */
function tickBuffs(buffs: ActiveBuff[]): ActiveBuff[] {
  return buffs
    .map((b) => ({ ...b, turnsLeft: b.turnsLeft - 1 }))
    .filter((b) => b.turnsLeft > 0);
}

/** Áp đặc tính đặc biệt V3 và tính kết quả 1 lượt creature vs creature. */
function resolveCreatureRound(
  playerCard: GameCard,
  aiCard: GameCard,
  state: KingsGameState,
  trapNarrations: string[],
  trapAtkMod: number,
  trapDefMod: number,
  aiTrapAtkMod: number,
  aiTrapDefMod: number,
  nullifyPlayerSpecial: boolean,
  nullifyAiSpecial: boolean,
): {
  round: KingsRound;
  nextPlayerBonus: number;
  nextAiBonus: number;
  nextPlayerPenalty: number;
  nextAiPenalty: number;
  playerDrainPts: number;
  aiDrainPts: number;
  playerResurrect: GameCard | null;
  aiResurrect: GameCard | null;
  playerCardDies: boolean;
  aiCardDies: boolean;
  triggeredTraps: string[];
  usedSpells: string[];
} {
  // Áp buffs
  const pBuffAtk = sumBuffs(state.playerBuffs, "atk-bonus");
  const pDebufAtk = sumBuffs(state.playerBuffs, "atk-penalty");
  const aBuffAtk = sumBuffs(state.aiBuffs, "atk-bonus");
  const aDebufAtk = sumBuffs(state.aiBuffs, "atk-penalty");
  const pDebufDef = sumBuffs(state.playerBuffs, "def-penalty");
  const aDebufDef = sumBuffs(state.aiBuffs, "def-penalty");

  // Swap stats nếu có buff
  let pBaseAtk = playerCard.atk;
  let pBaseDef = playerCard.def;
  let aBaseAtk = aiCard.atk;
  let aBaseDef = aiCard.def;
  if (hasSwapStats(state.playerBuffs)) { [pBaseAtk, pBaseDef] = [pBaseDef, pBaseAtk]; }
  if (hasSwapStats(state.aiBuffs)) { [aBaseAtk, aBaseDef] = [aBaseDef, aBaseAtk]; }

  // Fire boost
  const pFireBoost = hasFireBoost(state.playerBuffs) ? 6 : 0;
  const aFireBoost = hasFireBoost(state.aiBuffs) ? 6 : 0;
  const playerCardDies = pFireBoost > 0; // Lá bị thiêu sau khi đánh
  const aiCardDies = aFireBoost > 0;

  let pAtk = Math.max(0, pBaseAtk + state.playerAtkBonus + pBuffAtk + pFireBoost - state.playerAtkPenalty - pDebufAtk + trapAtkMod);
  let pDef = Math.max(0, pBaseDef - pDebufDef + trapDefMod);
  let aAtk = Math.max(0, aBaseAtk + state.aiAtkBonus + aBuffAtk + aFireBoost - state.aiAtkPenalty - aDebufAtk + aiTrapAtkMod);
  let aDef = Math.max(0, aBaseDef - aDebufDef + aiTrapDefMod);

  let nextPlayerBonus = 0;
  let nextAiBonus = 0;
  let nextPlayerPenalty = 0;
  let nextAiPenalty = 0;
  let playerDrainPts = 0;
  let aiDrainPts = 0;
  let playerResurrectCard: GameCard | null = null;
  let aiResurrectCard: GameCard | null = null;
  const narrations: string[] = [...trapNarrations];
  let playerCombo: string | null = null;
  let aiCombo: string | null = null;

  // Effective specials (có thể bị nullify)
  const pSpecial = nullifyPlayerSpecial ? undefined : playerCard.special;
  const aSpecial = nullifyAiSpecial ? undefined : aiCard.special;

  // Combo check
  if (state.playerLastHouse && playerCard.house === state.playerLastHouse) {
    const combo = HOUSE_COMBO_BONUS[playerCard.house];
    if (combo) { pAtk += combo.atkBonus; pDef += combo.defBonus; playerCombo = combo.name; narrations.push(`Combo ${combo.name}!`); }
  }
  if (state.aiLastHouse && aiCard.house === state.aiLastHouse) {
    const combo = HOUSE_COMBO_BONUS[aiCard.house];
    if (combo) { aAtk += combo.atkBonus; aDef += combo.defBonus; aiCombo = combo.name; narrations.push(`Đối thủ combo ${combo.name}!`); }
  }

  // Shield
  const playerShielded = pSpecial === "shield";
  const aiShielded = aSpecial === "shield";
  const playerWarded = hasWard(state.playerBuffs);

  // Player specials
  if (pSpecial === "pierce" && !aiShielded) { aDef = Math.floor(aDef * 0.5); narrations.push(`${playerCard.name} xuyên giáp!`); }
  if (pSpecial === "fortress") { pDef = Math.floor(pDef * 1.5); narrations.push(`${playerCard.name} phòng thủ tuyệt đối!`); }
  if (pSpecial === "ambush" && !aiShielded) { pAtk = Math.floor(pAtk * 1.5); narrations.push(`${playerCard.name} phục kích!`); }
  if (pSpecial === "inspire") { nextPlayerBonus = 2; narrations.push(`${playerCard.name} cổ vũ: lá kế +2 ATK!`); }
  if (pSpecial === "burn" && !playerWarded) { nextAiPenalty = 3; narrations.push(`${playerCard.name} thiêu đốt! Đối thủ -3 ATK lượt sau!`); }

  // AI specials
  if (aSpecial === "pierce" && !playerShielded) { pDef = Math.floor(pDef * 0.5); narrations.push(`${aiCard.name} xuyên giáp!`); }
  if (aSpecial === "fortress") { aDef = Math.floor(aDef * 1.5); narrations.push(`${aiCard.name} phòng thủ tuyệt đối!`); }
  if (aSpecial === "ambush" && !playerShielded) { aAtk = Math.floor(aAtk * 1.5); narrations.push(`${aiCard.name} phục kích!`); }
  if (aSpecial === "inspire") { nextAiBonus = 2; narrations.push(`${aiCard.name} cổ vũ: lá kế +2 ATK!`); }
  if (aSpecial === "burn") { nextPlayerPenalty = 3; narrations.push(`${aiCard.name} thiêu đốt! Ngươi -3 ATK lượt sau!`); }

  // Execute
  let executeOverride: "player" | "ai" | null = null;
  if (pSpecial === "execute" && pAtk > aDef * 2) { executeOverride = "player"; playerDrainPts = 2; narrations.push(`${playerCard.name} HÀNH QUYẾT!`); }
  if (aSpecial === "execute" && aAtk > pDef * 2 && !executeOverride) { executeOverride = "ai"; aiDrainPts = 2; narrations.push(`${aiCard.name} HÀNH QUYẾT!`); }

  // So sánh
  let winner: "player" | "ai" | "draw";
  if (executeOverride) { winner = executeOverride; }
  else {
    const playerDmg = Math.max(0, pAtk - aDef);
    const aiDmg = Math.max(0, aAtk - pDef);
    winner = playerDmg > aiDmg ? "player" : aiDmg > playerDmg ? "ai" : "draw";
  }

  if (winner === "player") narrations.push(`${playerCard.name} áp đảo!`);
  else if (winner === "ai") narrations.push(`${aiCard.name} giành thế!`);
  else narrations.push("Hoà!");

  // Counter
  if (pSpecial === "counter" && winner === "ai") { winner = "draw"; narrations.push(`${playerCard.name} phản đòn!`); }
  if (aSpecial === "counter" && winner === "player") { winner = "draw"; narrations.push(`${aiCard.name} phản đòn!`); }

  // Drain
  if (pSpecial === "drain" && winner === "player") { playerDrainPts += 1; narrations.push(`${playerCard.name} hút máu: +1 điểm!`); }
  if (aSpecial === "drain" && winner === "ai") { aiDrainPts += 1; narrations.push(`${aiCard.name} hút máu!`); }

  // Resurrect
  if (pSpecial === "resurrect" && winner === "ai") { playerResurrectCard = playerCard; narrations.push(`${playerCard.name} hồi sinh!`); }
  if (aSpecial === "resurrect" && winner === "player") { aiResurrectCard = aiCard; narrations.push(`${aiCard.name} hồi sinh!`); }

  return {
    round: {
      playerCard, aiCard,
      playerEffAtk: pAtk, aiEffAtk: aAtk,
      playerEffDef: pDef, aiEffDef: aDef,
      winner, narration: narrations.join(" "),
      playerCombo, aiCombo,
      triggeredTraps: [], usedSpells: [],
    },
    nextPlayerBonus, nextAiBonus,
    nextPlayerPenalty, nextAiPenalty,
    playerDrainPts, aiDrainPts,
    playerResurrect: playerResurrectCard,
    aiResurrect: aiResurrectCard,
    playerCardDies, aiCardDies,
    triggeredTraps: [], usedSpells: [],
  };
}

// ═══════════════════════════════════════════════════════════════
//  PLAY ROUND (V3)
// ═══════════════════════════════════════════════════════════════

/** Người chơi chọn lá → xử lý trap/spell/creature → trả state mới. */
export function playKingsRound(
  state: KingsGameState,
  playerCardId: string,
  roundSeed: number,
): KingsGameState {
  if (state.phase !== "picking" || state.currentRound >= state.totalRounds) return state;

  const playerCard = state.playerHand.find((c) => c.id === playerCardId);
  if (!playerCard) return state;

  const rng = makeRng(roundSeed);
  const eventLog: string[] = [];
  let currentState = { ...state };

  // ── 1. Xử lý SPELL (nếu người chơi chọn spell) ──
  if (playerCard.type === "spell") {
    const { stateChanges, narration } = applySpellEffect(playerCard, currentState, true, rng);
    eventLog.push(narration);
    const newHand = currentState.playerHand.filter((c) => c.id !== playerCard.id);
    const newGrave = [...currentState.playerGraveyard, playerCard];
    currentState = {
      ...currentState,
      ...stateChanges,
      playerHand: stateChanges.playerHand as GameCard[] ?? newHand,
      playerGraveyard: stateChanges.playerGraveyard as GameCard[] ?? newGrave,
      eventLog: [...currentState.eventLog, ...eventLog],
    };
    // Spell không tốn lượt đấu — chuyển sang picking lại
    return { ...currentState, phase: "picking" };
  }

  // ── 2. Xử lý TRAP (nếu người chơi chọn trap) ──
  if (playerCard.type === "trap") {
    if (currentState.playerTraps.length >= 2) {
      // Đã đặt 2 bẫy — không cho đặt thêm
      return state;
    }
    const newHand = currentState.playerHand.filter((c) => c.id !== playerCard.id);
    eventLog.push(`Đặt bẫy [${playerCard.name}] úp!`);
    return {
      ...currentState,
      playerHand: newHand,
      playerTraps: [...currentState.playerTraps, { card: playerCard, triggered: false }],
      eventLog: [...currentState.eventLog, ...eventLog],
      phase: "picking",
    };
  }

  // ── 3. CREATURE ROUND ──

  // AI chọn bài
  const hasFogTrap = currentState.playerTraps.some((t) => t.card.id === "t08" && !t.triggered);
  const aiCard = aiPickCard(currentState.aiHand, rng, currentState.aiAtkPenalty, currentState.aiLastHouse, hasFogTrap);

  // AI có thể chọn spell/trap thay vì creature
  if (aiCard.type === "spell") {
    const { stateChanges, narration } = applySpellEffect(aiCard, currentState, false, rng);
    eventLog.push(narration);
    const newAiHand = currentState.aiHand.filter((c) => c.id !== aiCard.id);
    const newAiGrave = [...currentState.aiGraveyard, aiCard];
    currentState = {
      ...currentState,
      ...stateChanges,
      aiHand: stateChanges.aiHand as GameCard[] ?? newAiHand,
      aiGraveyard: stateChanges.aiGraveyard as GameCard[] ?? newAiGrave,
    };
    // AI dùng spell → người chơi creature vẫn phải đấu → AI chọn lại creature
    const aiCreatures = currentState.aiHand.filter((c) => c.type === "creature");
    if (aiCreatures.length === 0) {
      // AI hết creature → người chơi thắng lượt
      const dummyRound: KingsRound = {
        playerCard, aiCard: aiCard, playerEffAtk: playerCard.atk, aiEffAtk: 0,
        playerEffDef: playerCard.def, aiEffDef: 0, winner: "player",
        narration: eventLog.join(" ") + " Đối thủ hết lá creature!",
        playerCombo: null, aiCombo: null, triggeredTraps: [], usedSpells: [aiCard.name],
      };
      const newRounds = [...currentState.rounds, dummyRound];
      const nextRound = currentState.currentRound + 1;
      if (nextRound >= currentState.totalRounds) {
        const pw = newRounds.filter((r) => r.winner === "player").length + currentState.playerBonusPoints;
        const aw = newRounds.filter((r) => r.winner === "ai").length + currentState.aiBonusPoints;
        return { ...currentState, rounds: newRounds, currentRound: nextRound, playerHand: currentState.playerHand.filter((c) => c.id !== playerCard.id), playerGraveyard: [...currentState.playerGraveyard, playerCard], eventLog: [...currentState.eventLog, ...eventLog], phase: "done", result: pw > aw ? "win" : aw > pw ? "lose" : "draw" };
      }
      return { ...currentState, rounds: newRounds, currentRound: nextRound, playerHand: currentState.playerHand.filter((c) => c.id !== playerCard.id), playerGraveyard: [...currentState.playerGraveyard, playerCard], eventLog: [...currentState.eventLog, ...eventLog], phase: "picking" };
    }
  }

  if (aiCard.type === "trap") {
    if (currentState.aiTraps.length < 2) {
      eventLog.push(`Đối thủ đặt 1 bẫy úp!`);
      currentState = {
        ...currentState,
        aiHand: currentState.aiHand.filter((c) => c.id !== aiCard.id),
        aiTraps: [...currentState.aiTraps, { card: aiCard, triggered: false }],
      };
    }
    // AI đặt trap → phải chọn lại creature
    const aiCreatures2 = currentState.aiHand.filter((c) => c.type === "creature");
    if (aiCreatures2.length === 0) {
      return { ...currentState, eventLog: [...currentState.eventLog, ...eventLog], phase: "picking" };
    }
  }

  // Re-pick AI creature nếu cần
  let finalAiCard = aiCard;
  if (finalAiCard.type !== "creature") {
    const aiCreatures = currentState.aiHand.filter((c) => c.type === "creature");
    if (aiCreatures.length === 0) {
      // Edge case: AI hết creature
      const newPlayerHand = currentState.playerHand.filter((c) => c.id !== playerCard.id);
      return { ...currentState, playerHand: newPlayerHand, playerGraveyard: [...currentState.playerGraveyard, playerCard], currentRound: currentState.currentRound + 1, eventLog: [...currentState.eventLog, ...eventLog], phase: "picking" };
    }
    finalAiCard = aiPickCard(aiCreatures, rng, currentState.aiAtkPenalty, currentState.aiLastHouse, false);
  }

  // ── 4. Kiểm tra bẫy ──
  const lastWinner = currentState.rounds.length > 0 ? currentState.rounds[currentState.rounds.length - 1].winner : null;
  let trapAtkMod = 0, trapDefMod = 0, aiTrapAtkMod = 0, aiTrapDefMod = 0;
  let nullifyPlayerSpecial = false, nullifyAiSpecial = false;
  const trapNarrations: string[] = [];
  const triggeredTrapNames: string[] = [];

  // Player traps trigger vs AI card
  for (const trap of currentState.playerTraps) {
    if (trap.triggered) continue;
    const playerLostLast = lastWinner === "ai";
    if (checkTrapCondition(trap.card, finalAiCard, lastWinner, playerLostLast, currentState.aiHand.length)) {
      trap.triggered = true;
      const effect = applyTrapEffect(trap.card, finalAiCard, currentState.aiHand, rng);
      trapNarrations.push(effect.narration);
      triggeredTrapNames.push(trap.card.name);

      // Swap card (Lưới Nhện)
      if (effect.replacementCard) {
        currentState = { ...currentState, aiHand: currentState.aiHand.filter((c) => c.id !== effect.replacementCard!.id) };
        finalAiCard = effect.replacementCard;
      }
      // Destroy (Lửa Valyria)
      if (effect.destroyCard) {
        currentState = { ...currentState, aiGraveyard: [...currentState.aiGraveyard, finalAiCard], aiHand: currentState.aiHand.filter((c) => c.id !== finalAiCard.id) };
        // Lá bị phá → tạo lá rỗng
        finalAiCard = { ...finalAiCard, atk: 0, def: 0, special: undefined };
      }
      aiTrapAtkMod += effect.atkMod;
      aiTrapDefMod += effect.defMod;
      if (effect.nullifySpecial) nullifyAiSpecial = true;
      if (effect.scorePenalty > 0) {
        currentState = { ...currentState, aiBonusPoints: currentState.aiBonusPoints - effect.scorePenalty };
      }
      if (effect.discardFromHand && currentState.aiHand.length > 0) {
        const discardIdx = Math.floor(rng() * currentState.aiHand.length);
        const discarded = currentState.aiHand[discardIdx];
        currentState = {
          ...currentState,
          aiHand: currentState.aiHand.filter((_, i) => i !== discardIdx),
          aiGraveyard: [...currentState.aiGraveyard, discarded],
        };
        trapNarrations.push(`${discarded.name} bị loại khỏi tay đối thủ!`);
      }
      for (const b of effect.newBuffs) {
        currentState = { ...currentState, playerBuffs: [...currentState.playerBuffs, b] };
      }
      // Phản Bội: đảo ATK/DEF
      if (trap.card.id === "t07") {
        const tmp = finalAiCard.atk;
        finalAiCard = { ...finalAiCard, atk: finalAiCard.def, def: tmp };
      }
    }
  }

  // AI traps trigger vs Player card
  for (const trap of currentState.aiTraps) {
    if (trap.triggered) continue;
    const aiLostLast = lastWinner === "player";
    if (checkTrapCondition(trap.card, playerCard, lastWinner, aiLostLast, currentState.playerHand.length)) {
      trap.triggered = true;
      const effect = applyTrapEffect(trap.card, playerCard, currentState.playerHand, rng);
      trapNarrations.push(`[Đối thủ] ${effect.narration}`);
      triggeredTrapNames.push(`[Đối thủ] ${trap.card.name}`);

      trapAtkMod += effect.atkMod;
      trapDefMod += effect.defMod;
      if (effect.nullifySpecial) nullifyPlayerSpecial = true;
      if (effect.scorePenalty > 0) {
        currentState = { ...currentState, playerBonusPoints: currentState.playerBonusPoints - effect.scorePenalty };
      }
      for (const b of effect.newBuffs) {
        currentState = { ...currentState, aiBuffs: [...currentState.aiBuffs, b] };
      }
    }
  }

  // ── 5. Resolve creature combat ──
  const result = resolveCreatureRound(
    playerCard, finalAiCard, currentState,
    trapNarrations, trapAtkMod, trapDefMod, aiTrapAtkMod, aiTrapDefMod,
    nullifyPlayerSpecial, nullifyAiSpecial,
  );

  result.round.triggeredTraps = triggeredTrapNames;

  // ── 6. Update state ──
  let newPlayerHand = currentState.playerHand.filter((c) => c.id !== playerCard.id);
  let newAiHand = currentState.aiHand.filter((c) => c.id !== finalAiCard.id);

  // Graveyard: creature cards go to graveyard after use
  let newPlayerGrave = [...currentState.playerGraveyard, playerCard];
  let newAiGrave = [...currentState.aiGraveyard, finalAiCard];

  // Resurrect từ lượt trước
  if (currentState.playerResurrect) {
    newPlayerHand = [...newPlayerHand, currentState.playerResurrect];
    newPlayerGrave = newPlayerGrave.filter((c) => c.id !== currentState.playerResurrect!.id);
  }
  if (currentState.aiResurrect) {
    newAiHand = [...newAiHand, currentState.aiResurrect];
    newAiGrave = newAiGrave.filter((c) => c.id !== currentState.aiResurrect!.id);
  }

  // Loại bỏ trap đã kích hoạt
  const newPlayerTraps = currentState.playerTraps.filter((t) => !t.triggered);
  const newAiTraps = currentState.aiTraps.filter((t) => !t.triggered);

  // Tick buffs
  const newPlayerBuffs = tickBuffs(currentState.playerBuffs);
  const newAiBuffs = tickBuffs(currentState.aiBuffs);

  // Revealed cards tick
  let newRevealed = currentState.revealedAiCards;
  if (newRevealed) {
    newRevealed = { ...newRevealed, turnsLeft: newRevealed.turnsLeft - 1 };
    if (newRevealed.turnsLeft <= 0) newRevealed = null;
  }

  const newRounds = [...currentState.rounds, result.round];
  const nextRound = currentState.currentRound + 1;
  const newPlayerBonusPts = currentState.playerBonusPoints + result.playerDrainPts;
  const newAiBonusPts = currentState.aiBonusPoints + result.aiDrainPts;

  const baseUpdate: Partial<KingsGameState> = {
    playerHand: newPlayerHand,
    aiHand: newAiHand,
    rounds: newRounds,
    currentRound: nextRound,
    playerPick: null,
    playerAtkBonus: result.nextPlayerBonus,
    aiAtkBonus: result.nextAiBonus,
    playerAtkPenalty: result.nextPlayerPenalty,
    aiAtkPenalty: result.nextAiPenalty,
    playerBonusPoints: newPlayerBonusPts,
    aiBonusPoints: newAiBonusPts,
    playerResurrect: result.playerResurrect,
    aiResurrect: result.aiResurrect,
    playerLastHouse: playerCard.house,
    aiLastHouse: finalAiCard.house,
    playerGraveyard: newPlayerGrave,
    aiGraveyard: newAiGrave,
    playerTraps: newPlayerTraps,
    aiTraps: newAiTraps,
    playerBuffs: newPlayerBuffs,
    aiBuffs: newAiBuffs,
    revealedAiCards: newRevealed,
    eventLog: [...currentState.eventLog, ...eventLog, ...trapNarrations],
  };

  // Hết lượt hoặc hết creature → kết thúc
  const playerCreatures = newPlayerHand.filter((c) => c.type === "creature");
  const aiCreatures = newAiHand.filter((c) => c.type === "creature");
  if (nextRound >= state.totalRounds || playerCreatures.length === 0 || aiCreatures.length === 0) {
    const playerWins = newRounds.filter((r) => r.winner === "player").length + newPlayerBonusPts;
    const aiWins = newRounds.filter((r) => r.winner === "ai").length + newAiBonusPts;
    const finalResult: "win" | "lose" | "draw" = playerWins > aiWins ? "win" : aiWins > playerWins ? "lose" : "draw";
    return { ...currentState, ...baseUpdate, phase: "done", result: finalResult };
  }

  return { ...currentState, ...baseUpdate, phase: "picking", result: null };
}
