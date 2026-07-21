/**
 * Đấu tay đôi (7.1-7.3 + 7.14): turn-based, initiative d20 + mod(Nhanh Nhẹn),
 * toHit d20 vs AC, crit nat-20 ×2, 4 THẾ ĐỨNG mỗi vòng, THỂ LỰC cho đòn đặc
 * biệt, thép Valyria/obsidian bỏ qua phần lớn damageReduction.
 * Engine giữ số — AI chỉ nhận DuelResult/round events để tường thuật.
 */
import { makeRng, rollDiceNotation, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";

export type Stance = "Tấn Công Liều" | "Cân Bằng" | "Phòng Thủ" | "Nhắm Chí Mạng";

export interface Duelist {
  name: string;
  hp: number;
  maxHp: number;
  /** _Phòng Thủ (5.1f-B). */
  armorClass: number;
  /** mod đòn = mod(chỉ số hợp đòn) + cấp kỹ năng vũ khí (7.2). */
  attackMod: number;
  damageBonus: number;
  weaponDice: string; // "1d8"
  damageReduction: number;
  /** mod(Nhanh Nhẹn) cho initiative. */
  agilityMod: number;
  stamina: number;
  maxStamina: number;
  /** vũ khí valyrian/obsidian — bỏ qua phần lớn DR + điều kiện diệt siêu nhiên (7.14). */
  valyrianOrObsidian?: boolean;
}

export interface StanceEffect {
  toHit: number;
  damage: number;
  ac: number;
  critFrom: number; // nat roll ≥ ngưỡng này = crit
}

export const STANCES: Record<Stance, StanceEffect> = {
  "Tấn Công Liều": { toHit: 2, damage: 3, ac: -3, critFrom: 20 },
  "Cân Bằng": { toHit: 0, damage: 0, ac: 0, critFrom: 20 },
  "Phòng Thủ": { toHit: -2, damage: 0, ac: 3, critFrom: 20 },
  "Nhắm Chí Mạng": { toHit: -5, damage: 0, ac: 0, critFrom: 19 }, // crit 19-20 (7.14)
};

/** Thể lực tiêu cho đòn theo thế (7.14): hết Thể Lực → ép Cân Bằng, dễ Stun. */
const STAMINA_COST: Record<Stance, number> = {
  "Tấn Công Liều": 12,
  "Cân Bằng": 4,
  "Phòng Thủ": 6,
  "Nhắm Chí Mạng": 15,
};

export interface AttackEvent {
  attacker: string;
  defender: string;
  stance: Stance;
  natRoll: number;
  toHit: number;
  targetAc: number;
  hit: boolean;
  crit: boolean;
  damage: number;
  defenderHpAfter: number;
  exhausted: boolean; // hết thể lực — đòn yếu
}

export interface DuelState {
  a: Duelist;
  b: Duelist;
  round: number;
  /** thứ tự hành động vòng này (initiative 7.1). */
  order: [string, string];
  finished: boolean;
  winner: string | null;
  log: string[];
}

export function startDuel(a: Duelist, b: Duelist, seed: number): DuelState {
  const rng = makeRng(seed);
  const initA = 1 + Math.floor(rng() * 20) + a.agilityMod;
  const initB = 1 + Math.floor(rng() * 20) + b.agilityMod;
  const order: [string, string] = initA >= initB ? [a.name, b.name] : [b.name, a.name];
  return {
    a: { ...a },
    b: { ...b },
    round: 0,
    order,
    finished: false,
    winner: null,
    log: [`Initiative: ${a.name} ${initA} vs ${b.name} ${initB} — ${order[0]} ra đòn trước`],
  };
}

function attack(rng: RNG, attacker: Duelist, defender: Duelist, stance: Stance, defenderStance: Stance): AttackEvent {
  const exhausted = attacker.stamina <= 0;
  const effStance: Stance = exhausted ? "Cân Bằng" : stance;
  const se = STANCES[effStance];
  const de = STANCES[defenderStance];
  attacker.stamina = clamp(attacker.stamina - STAMINA_COST[effStance], 0, attacker.maxStamina);

  const natRoll = 1 + Math.floor(rng() * 20);
  const toHit = natRoll + attacker.attackMod + se.toHit - (exhausted ? 2 : 0);
  const targetAc = defender.armorClass + de.ac;
  const hit = natRoll === 20 || (natRoll !== 1 && toHit >= targetAc);
  const crit = hit && natRoll >= se.critFrom;

  let damage = 0;
  if (hit) {
    damage = rollDiceNotation(attacker.weaponDice, rng) + attacker.damageBonus + se.damage - (exhausted ? 2 : 0);
    if (crit) damage *= 2;
    // thép Valyria/obsidian bỏ qua phần lớn DR (7.14): chỉ chịu 25% DR
    const dr = attacker.valyrianOrObsidian ? Math.floor(defender.damageReduction * 0.25) : defender.damageReduction;
    damage = Math.max(1, damage - dr);
    defender.hp = Math.max(0, defender.hp - damage);
  }

  return {
    attacker: attacker.name, defender: defender.name, stance: effStance,
    natRoll, toHit, targetAc, hit, crit, damage, defenderHpAfter: defender.hp, exhausted,
  };
}

/**
 * Chạy 1 vòng: 2 đòn theo initiative. rng dẫn xuất từ seed trận + số vòng
 * (reroll cùng trận cho cùng chuỗi — 5bis.1).
 */
export function runDuelRound(state: DuelState, stanceA: Stance, stanceB: Stance, battleSeed: number): { state: DuelState; events: AttackEvent[] } {
  if (state.finished) return { state, events: [] };
  const next = { ...state, a: { ...state.a }, b: { ...state.b }, log: [...state.log], round: state.round + 1 };
  const rng = makeRng((battleSeed ^ (next.round * 0x9e3779b9)) >>> 0);
  const events: AttackEvent[] = [];

  const duelists: Record<string, Duelist> = { [next.a.name]: next.a, [next.b.name]: next.b };
  const stances: Record<string, Stance> = { [next.a.name]: stanceA, [next.b.name]: stanceB };

  for (const actorName of next.order) {
    const actor = duelists[actorName];
    const target = actorName === next.a.name ? next.b : next.a;
    if (actor.hp <= 0 || target.hp <= 0) break;
    const ev = attack(rng, actor, target, stances[actorName], stances[target.name]);
    events.push(ev);
    next.log.push(
      `V${next.round} ${ev.attacker} [${ev.stance}] d20=${ev.natRoll} toHit ${ev.toHit} vs AC ${ev.targetAc}: ` +
        (ev.hit ? `${ev.crit ? "CHÍ MẠNG " : "TRÚNG"} −${ev.damage} HP (${ev.defender} còn ${ev.defenderHpAfter})` : "TRƯỢT"),
    );
    if (target.hp <= 0) {
      next.finished = true;
      next.winner = actor.name;
      next.log.push(`${target.name} gục ngã — ${actor.name} thắng sau ${next.round} vòng`);
      break;
    }
  }
  // hồi nhẹ thể lực cuối vòng
  next.a.stamina = clamp(next.a.stamina + 3, 0, next.a.maxStamina);
  next.b.stamina = clamp(next.b.stamina + 3, 0, next.b.maxStamina);
  return { state: next, events };
}

export interface DuelResult {
  winner: string;
  loser: string;
  rounds: number;
  hpLeftWinner: number;
  log: string[];
}

/** Auto-resolve toàn trận (AI địch chọn thế theo heuristic đơn giản, seed cố định). */
export function autoDuel(a: Duelist, b: Duelist, seed: number, maxRounds = 30): DuelResult {
  let state = startDuel(a, b, seed);
  const rng = makeRng(seed ^ 0x51ed270b);
  while (!state.finished && state.round < maxRounds) {
    const pick = (d: Duelist, opp: Duelist): Stance => {
      if (d.stamina < 10) return "Cân Bằng";
      if (d.hp < d.maxHp * 0.3) return "Phòng Thủ";
      if (opp.hp < opp.maxHp * 0.25) return "Tấn Công Liều";
      return rng() < 0.25 ? "Nhắm Chí Mạng" : "Cân Bằng";
    };
    state = runDuelRound(state, pick(state.a, state.b), pick(state.b, state.a), seed).state;
  }
  if (!state.finished) {
    // hoà thể lực — ai còn nhiều HP% hơn thắng sát nút
    const winner = state.a.hp / state.a.maxHp >= state.b.hp / state.b.maxHp ? state.a : state.b;
    state.winner = winner.name;
    state.log.push(`Hai bên kiệt sức sau ${state.round} vòng — ${winner.name} chiếm thượng phong`);
  }
  const winner = state.winner === state.a.name ? state.a : state.b;
  const loser = state.winner === state.a.name ? state.b : state.a;
  return { winner: winner.name, loser: loser.name, rounds: state.round, hpLeftWinner: winner.hp, log: state.log };
}
