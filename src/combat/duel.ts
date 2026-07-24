/**
 * Đấu tay đôi (7.1-7.3 + 7.14): turn-based, initiative d20 + mod(Nhanh Nhẹn),
 * toHit d20 vs AC, crit nat-20 ×2, 4 THẾ ĐỨNG mỗi vòng, THỂ LỰC cho đòn đặc
 * biệt, thép Valyria/obsidian bỏ qua phần lớn damageReduction.
 * Epic Update: Thêm Traits (đặc trưng), Wounds (chấn thương), Dynamic Events, và Fatality.
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
  /** Các trait đặc biệt: poisoned_blade, riposte, brute_force, agile_dancer, second_wind */
  traits?: string[];
  /** Các vết thương đang chịu: Chấn Thương Tay, Chấn Thương Chân, Chảy Máu, Trúng Độc */
  wounds?: string[];
  /** Buff đang có (tên -> số hiệp còn lại) */
  buffs?: Record<string, number>;
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
  woundsInflicted?: string[];
  fatality?: string; // Nhát chém sử thi
  riposte?: boolean; // Có phải đòn phản công không
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
  // Copy to avoid mutating original and initialize optional fields
  const duelistA: Duelist = { ...a, traits: a.traits || [], wounds: [], buffs: {} };
  const duelistB: Duelist = { ...b, traits: b.traits || [], wounds: [], buffs: {} };

  const initA = 1 + Math.floor(rng() * 20) + duelistA.agilityMod;
  const initB = 1 + Math.floor(rng() * 20) + duelistB.agilityMod;
  const order: [string, string] = initA >= initB ? [duelistA.name, duelistB.name] : [duelistB.name, duelistA.name];
  
  return {
    a: duelistA,
    b: duelistB,
    round: 0,
    order,
    finished: false,
    winner: null,
    log: [`Initiative: ${duelistA.name} ${initA} vs ${duelistB.name} ${initB} — ${order[0]} ra đòn trước`],
  };
}

function attack(rng: RNG, attacker: Duelist, defender: Duelist, stance: Stance, defenderStance: Stance, isRiposte = false): AttackEvent {
  const exhausted = attacker.stamina <= 0;
  const effStance: Stance = exhausted ? "Cân Bằng" : stance;
  const se = STANCES[effStance];
  const de = STANCES[defenderStance];
  
  let stamCost = STAMINA_COST[effStance];
  if (attacker.traits?.includes("agile_dancer") && (effStance === "Nhắm Chí Mạng" || effStance === "Phòng Thủ")) {
    stamCost = Math.floor(stamCost / 2);
  }
  if (attacker.traits?.includes("brute_force")) stamCost += 2;
  if (isRiposte) stamCost = 0; // Riposte không tốn thể lực

  attacker.stamina = clamp(attacker.stamina - stamCost, 0, attacker.maxStamina);

  const natRoll = 1 + Math.floor(rng() * 20);
  
  let attackMod = attacker.attackMod + se.toHit - (exhausted ? 2 : 0);
  if (attacker.wounds?.includes("Chấn Thương Tay")) attackMod -= 2;
  if (attacker.buffs?.["second_wind"] && attacker.buffs["second_wind"] > 0) attackMod += 2;
  
  const toHit = natRoll + attackMod;
  
  let targetAc = defender.armorClass + de.ac;
  if (attacker.traits?.includes("brute_force")) targetAc -= 2; // Brute force bỏ qua một phần AC

  const hit = natRoll === 20 || (natRoll !== 1 && toHit >= targetAc);
  const crit = hit && natRoll >= se.critFrom;

  let damage = 0;
  const woundsInflicted: string[] = [];
  let fatality: string | undefined;

  if (hit) {
    damage = rollDiceNotation(attacker.weaponDice, rng) + attacker.damageBonus + se.damage - (exhausted ? 2 : 0);
    if (attacker.wounds?.includes("Chấn Thương Tay")) damage = Math.max(1, damage - 2);
    if (isRiposte) damage = Math.max(1, Math.floor(damage / 2)); // Riposte damage nhẹ hơn
    
    if (crit) damage *= 2;
    // thép Valyria/obsidian bỏ qua phần lớn DR (7.14): chỉ chịu 25% DR
    const dr = attacker.valyrianOrObsidian ? Math.floor(defender.damageReduction * 0.25) : defender.damageReduction;
    damage = Math.max(1, damage - dr);
    
    defender.hp = Math.max(0, defender.hp - damage);

    // Wounds
    if (defender.hp > 0 && !isRiposte) {
      if (crit || damage >= defender.maxHp * 0.3) {
        const woundRoll = rng();
        const wound = woundRoll < 0.33 ? "Chấn Thương Tay" : woundRoll < 0.66 ? "Chấn Thương Chân" : "Chảy Máu";
        if (!defender.wounds?.includes(wound)) {
          defender.wounds?.push(wound);
          woundsInflicted.push(wound);
        }
      }
      if (attacker.traits?.includes("poisoned_blade") && rng() < 0.3 && !defender.wounds?.includes("Trúng Độc")) {
        defender.wounds?.push("Trúng Độc");
        woundsInflicted.push("Trúng Độc");
      }
    }

    // Second Wind trigger
    if (defender.traits?.includes("second_wind") && defender.hp > 0 && defender.hp < defender.maxHp * 0.2 && !defender.buffs?.["second_wind_used"]) {
      defender.buffs = defender.buffs || {};
      defender.buffs["second_wind_used"] = 1; // Mark as used
      defender.buffs["second_wind"] = 2; // Active for 2 rounds
      defender.stamina = clamp(defender.stamina + Math.floor(defender.maxStamina * 0.3), 0, defender.maxStamina);
      woundsInflicted.push("Second Wind Triggered");
    }

    // Epic Finisher
    if (defender.hp <= 0 && crit) {
      fatality = rng() > 0.5 ? "Bổ đôi khiên và vỡ sọ đối thủ" : "Lưỡi kiếm đâm xuyên qua tim tàn nhẫn";
    }
  }

  return {
    attacker: attacker.name, defender: defender.name, stance: effStance,
    natRoll, toHit, targetAc, hit, crit, damage, defenderHpAfter: defender.hp, exhausted,
    woundsInflicted, fatality, riposte: isRiposte
  };
}

/**
 * Chạy 1 vòng: 2 đòn theo initiative. rng dẫn xuất từ seed trận + số vòng
 * (reroll cùng trận cho cùng chuỗi — 5bis.1).
 */
export function runDuelRound(state: DuelState, stanceA: Stance, stanceB: Stance, battleSeed: number): { state: DuelState; events: AttackEvent[] } {
  if (state.finished) return { state, events: [] };
  const next = { 
    ...state, 
    a: { ...state.a, wounds: [...(state.a.wounds || [])], buffs: { ...(state.a.buffs || {}) } }, 
    b: { ...state.b, wounds: [...(state.b.wounds || [])], buffs: { ...(state.b.buffs || {}) } }, 
    log: [...state.log], round: state.round + 1 
  };
  const rng = makeRng((battleSeed ^ (next.round * 0x9e3779b9)) >>> 0);
  const events: AttackEvent[] = [];

  const duelists: Record<string, Duelist> = { [next.a.name]: next.a, [next.b.name]: next.b };
  const stances: Record<string, Stance> = { [next.a.name]: stanceA, [next.b.name]: stanceB };

  // Dynamic Event
  const dynRoll = rng();
  if (dynRoll < 0.15) { // 15% chance
    const targetName = dynRoll < 0.075 ? next.a.name : next.b.name;
    const isBuff = rng() > 0.5;
    const eventName = isBuff ? "Khoảng trống bất ngờ" : (rng() > 0.5 ? "Sẩy chân" : "Chói mắt");
    next.log.push(`[Đột Biến] ${targetName} gặp tình huống: ${eventName}`);
    duelists[targetName].buffs![eventName] = 1; // Lasts 1 round
  }

  // Tiền xử lý DoT (Độc, Chảy máu) và giảm hồi chiêu Buffs
  for (const dName of next.order) {
    const d = duelists[dName];
    if (d.wounds?.includes("Chảy Máu")) {
      d.hp = Math.max(0, d.hp - 2);
      next.log.push(`${dName} mất 2 HP vì Chảy Máu`);
    }
    if (d.wounds?.includes("Trúng Độc")) {
      d.hp = Math.max(0, d.hp - 3);
      next.log.push(`${dName} mất 3 HP vì Trúng Độc`);
    }
    for (const b in d.buffs) {
      if (b !== "second_wind_used" && d.buffs[b] > 0) d.buffs[b]--;
    }
  }
  
  if (next.a.hp <= 0 || next.b.hp <= 0) {
    const winner = next.a.hp > 0 ? next.a : next.b.hp > 0 ? next.b : next.a;
    const loser = winner === next.a ? next.b : next.a;
    next.finished = true;
    next.winner = winner.name;
    next.log.push(`${loser.name} gục ngã vì vết thương trước khi kịp ra đòn!`);
    return { state: next, events };
  }

  for (const actorName of next.order) {
    const actor = duelists[actorName];
    const target = actorName === next.a.name ? next.b : next.a;
    if (actor.hp <= 0 || target.hp <= 0) break;

    // Apply Dynamic Event modifiers temporarily
    let tempAttackMod = 0;
    let tempTargetAcMod = 0;
    if (actor.buffs?.["Sẩy chân"] && actor.buffs["Sẩy chân"] > 0) tempAttackMod -= 2;
    if (actor.buffs?.["Khoảng trống bất ngờ"] && actor.buffs["Khoảng trống bất ngờ"] > 0) tempAttackMod += 5; // Tăng khả năng trúng để tạo cơ hội crit
    if (target.buffs?.["Chói mắt"] && target.buffs["Chói mắt"] > 0) tempTargetAcMod -= 2;
    
    actor.attackMod += tempAttackMod;
    target.armorClass += tempTargetAcMod;
    
    const ev = attack(rng, actor, target, stances[actorName], stances[target.name]);
    
    // Remove temp mods
    actor.attackMod -= tempAttackMod;
    target.armorClass -= tempTargetAcMod;

    events.push(ev);
    let logMsg = `V${next.round} ${ev.attacker} [${ev.stance}] d20=${ev.natRoll} toHit ${ev.toHit} vs AC ${ev.targetAc}: ` +
        (ev.hit ? `${ev.crit ? "CHÍ MẠNG " : "TRÚNG"} −${ev.damage} HP (${ev.defender} còn ${ev.defenderHpAfter})` : "TRƯỢT");
    
    if (ev.woundsInflicted?.length) {
      logMsg += ` -> Gây thêm: ${ev.woundsInflicted.join(", ")}`;
    }
    if (ev.fatality) {
      logMsg += `\n[FATALITY] ${ev.fatality}!`;
    }
    next.log.push(logMsg);

    if (target.hp <= 0) {
      next.finished = true;
      next.winner = actor.name;
      next.log.push(`${target.name} gục ngã — ${actor.name} thắng sau ${next.round} vòng`);
      break;
    }

    // Riposte check (Missed by > 5)
    if (!ev.hit && (ev.targetAc - ev.toHit) > 5 && target.traits?.includes("riposte") && !target.wounds?.includes("Chấn Thương Tay")) {
      const repEv = attack(rng, target, actor, stances[target.name], stances[actor.name], true);
      events.push(repEv);
      next.log.push(`[PHẢN ĐÒN] ${repEv.attacker} chớp thời cơ: d20=${repEv.natRoll} ` + 
          (repEv.hit ? `TRÚNG −${repEv.damage} HP (${repEv.defender} còn ${repEv.defenderHpAfter})` : "TRƯỢT"));
      if (actor.hp <= 0) {
        next.finished = true;
        next.winner = target.name;
        next.log.push(`${actor.name} gục ngã vì đòn phản công — ${target.name} thắng`);
        break;
      }
    }
  }
  
  // hồi nhẹ thể lực cuối vòng, giảm hồi nếu đau chân
  const recA = next.a.wounds?.includes("Chấn Thương Chân") ? 1 : 3;
  const recB = next.b.wounds?.includes("Chấn Thương Chân") ? 1 : 3;
  next.a.stamina = clamp(next.a.stamina + recA, 0, next.a.maxStamina);
  next.b.stamina = clamp(next.b.stamina + recB, 0, next.b.maxStamina);
  
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
      if (opp.hp < opp.maxHp * 0.25 || d.traits?.includes("poisoned_blade")) return "Tấn Công Liều";
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
