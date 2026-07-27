/**
 * Đấu tay đôi Tactical RPG: turn-based, d20 system, skills, inventory.
 */
import { makeRng, rollDiceNotation, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";

export interface ActiveSkill {
  id: string;
  name: string;
  type: "attack" | "debuff" | "buff" | "heal";
  staminaCost: number;
  damageMod: number; // e.g. +3 damage
  hitMod: number; // e.g. +2 to hit
  acMod: number; // self AC change
  critFrom: number; // e.g. 20
  effect?: string; // e.g. "Chảy Máu", "Chói Mắt", "Phá Giáp", "Riposte Stance"
  range: "melee" | "ranged" | "any";
  description: string;
}

export interface PassiveSkill {
  id: string;
  name: string;
  description: string;
  // e.g. "Giáp Trụ", "Máu Lạnh", "Phản Đòn"
}

export type DuelAction = 
  | { type: "skill"; skillId: string }
  | { type: "item"; itemId: string };

export interface Duelist {
  name: string;
  hp: number;
  maxHp: number;
  armorClass: number;
  attackMod: number;
  damageBonus: number;
  weaponDice: string;
  damageReduction: number;
  agilityMod: number;
  strength: number;
  intellect: number;
  perception: number;
  stamina: number;
  maxStamina: number;
  valyrianOrObsidian?: boolean;
  traits?: string[];
  wounds?: string[];
  buffs?: Record<string, number>;
  skills: ActiveSkill[];
  passives?: PassiveSkill[];
  inventory: string[]; 
}

export interface AttackEvent {
  attacker: string;
  defender: string;
  actionUsed: string;
  natRoll: number;
  toHit: number;
  targetAc: number;
  hit: boolean;
  crit: boolean;
  damage: number;
  defenderHpAfter: number;
  exhausted: boolean;
  woundsInflicted?: string[];
  fatality?: string;
  riposte?: boolean;
}

export interface DuelState {
  a: Duelist;
  b: Duelist;
  distance: "Cận Chiến" | "Tầm Xa";
  round: number;
  order: [string, string];
  finished: boolean;
  winner: string | null;
  log: string[];
}

// Basic passives
export const BASIC_PASSIVES: Record<string, PassiveSkill> = {
  "giap_tru": { id: "giap_tru", name: "Giáp Trụ", description: "Bị động: Giáp Nặng giảm chịu sát thương nhưng hao tổn thêm 2 Thể Lực mỗi kỹ năng." },
  "mau_lanh": { id: "mau_lanh", name: "Máu Lạnh", description: "Bị động: Tăng 10% Tỉ lệ Chí mạng khi tấn công kẻ địch đang Chảy Máu." },
  "phan_don": { id: "phan_don", name: "Phản Đòn", description: "Bị động: Tự động phản công nếu đối thủ trượt mục tiêu với biên độ > 5." }
};

// Basic default skills for AI or fallback
export const BASIC_SKILLS: Record<string, ActiveSkill> = {
  "tan_cong_thuong": { id: "tan_cong_thuong", name: "Tấn Công Thường", type: "attack", staminaCost: 4, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, range: "melee", description: "Đánh cơ bản, cân bằng." },
  "danh_lieu": { id: "danh_lieu", name: "Đánh Liều", type: "attack", staminaCost: 12, damageMod: 3, hitMod: 2, acMod: -3, critFrom: 20, range: "melee", description: "Dồn lực đánh mạnh nhưng hở sườn." },
  "phong_thu": { id: "phong_thu", name: "Phòng Thủ", type: "buff", staminaCost: 6, damageMod: 0, hitMod: -2, acMod: 3, critFrom: 20, range: "any", description: "Đỡ gạt chủ yếu." },
  "nham_chi_mang": { id: "nham_chi_mang", name: "Nhắm Chí Mạng", type: "attack", staminaCost: 15, damageMod: 0, hitMod: -5, acMod: 0, critFrom: 19, range: "melee", description: "Tìm kẽ hở chí mạng." },
  "pha_giap": { id: "pha_giap", name: "Phá Giáp", type: "debuff", staminaCost: 10, damageMod: -2, hitMod: 0, acMod: 0, critFrom: 20, effect: "Phá Giáp", range: "melee", description: "Làm hỏng giáp đối phương." },
  "nem_cat": { id: "nem_cat", name: "Ném Cát", type: "debuff", staminaCost: 5, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Mù Lòa", range: "any", description: "Làm mù tạm thời đối thủ." },
  "lao_toi": { id: "lao_toi", name: "Lao Tới", type: "buff", staminaCost: 8, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Lao Tới", range: "any", description: "Tiếp cận đối thủ đưa về Cận Chiến." },
  "rut_lui": { id: "rut_lui", name: "Rút Lui", type: "buff", staminaCost: 8, damageMod: 0, hitMod: 0, acMod: 2, critFrom: 20, effect: "Rút Lui", range: "any", description: "Tạo khoảng cách đưa về Tầm Xa." },
  "ban_ten": { id: "ban_ten", name: "Bắn Tên", type: "attack", staminaCost: 5, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, range: "ranged", description: "Tấn công từ xa." },
  "ban_tia": { id: "ban_tia", name: "Bắn Tỉa", type: "attack", staminaCost: 12, damageMod: 4, hitMod: 1, acMod: 0, critFrom: 19, range: "ranged", description: "Ngắm bắn chuẩn xác từ xa." },
};

// RPG-style Exclusive Passives
export const EXCLUSIVE_PASSIVES: Record<string, PassiveSkill> = {
  "mau_tien_nhan": { id: "mau_tien_nhan", name: "Máu Tiền Nhân", description: "Bị động: Dòng máu First Men mang lại sức sống mãnh liệt. Hồi phục 2 Thể Lực mỗi đầu hiệp." },
  "chat_sat": { id: "chat_sat", name: "Chất Sắt", description: "Bị động: Bản tính Ironborn. Gây thêm sát thương khi HP của địch ở dưới 50%." },
};

// RPG-style Exclusive Skills
export const EXCLUSIVE_SKILLS: Record<string, ActiveSkill> = {
  "vu_dieu_nuoc": { id: "vu_dieu_nuoc", name: "Vũ Điệu Nước", type: "buff", staminaCost: 10, damageMod: 0, hitMod: 2, acMod: 5, critFrom: 20, effect: "Vũ Điệu Nước", range: "melee", description: "Braavos: Thân thủ như dòng chảy. Tăng mạnh Né Tránh và Khả năng chính xác." },
  "mua_mui_ten": { id: "mua_mui_ten", name: "Mưa Mũi Tên", type: "attack", staminaCost: 15, damageMod: 6, hitMod: -2, acMod: 0, critFrom: 20, range: "ranged", description: "Bắn liên tiếp tạo trận mưa tên. Độ trúng giảm nhưng sát thương cực mạnh." },
  "nhat_chem_cuong_no": { id: "nhat_chem_cuong_no", name: "Nhát Chém Cuồng Nộ", type: "attack", staminaCost: 16, damageMod: 8, hitMod: 0, acMod: -5, critFrom: 20, effect: "Phá Giáp", range: "melee", description: "Dùng vũ khí hạng nặng bổ xuống cự lực. Xuyên giáp nhưng hở sườn nghiêm trọng." },
  "khe_lua": { id: "khe_lua", name: "Khè Lửa", type: "buff", staminaCost: 20, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Cơn Thịnh Nộ Rồng", range: "any", description: "Đánh thức huyết mạch Valyria. Tăng mạnh sức mạnh trong các vòng tới nhưng tốn nhiều Thể Lực." }
};

export function startDuel(a: Duelist, b: Duelist, seed: number): DuelState {
  const rng = makeRng(seed);
  const duelistA: Duelist = { ...a, traits: a.traits || [], wounds: [], buffs: {} };
  const duelistB: Duelist = { ...b, traits: b.traits || [], wounds: [], buffs: {} };

  const initA = 1 + Math.floor(rng() * 20) + duelistA.agilityMod;
  const initB = 1 + Math.floor(rng() * 20) + duelistB.agilityMod;
  const order: [string, string] = initA >= initB ? [duelistA.name, duelistB.name] : [duelistB.name, duelistA.name];
  
  return {
    a: duelistA,
    b: duelistB,
    distance: "Cận Chiến", // Default distance is Cận Chiến for duels
    round: 0,
    order,
    finished: false,
    winner: null,
    log: [`Initiative: ${duelistA.name} ${initA} vs ${duelistB.name} ${initB} — ${order[0]} ra đòn trước`, `[KHOẢNG CÁCH BAN ĐẦU: Cận Chiến]`],
  };
}

function processSkill(rng: RNG, attacker: Duelist, defender: Duelist, skill: ActiveSkill, currentDistance: "Cận Chiến" | "Tầm Xa", isRiposte = false): AttackEvent {
  const exhausted = attacker.stamina <= 0;
  let effSkill = exhausted ? BASIC_SKILLS["tan_cong_thuong"] : skill;
  
  let stamCost = effSkill.staminaCost;
  if (attacker.traits?.includes("agile_dancer") && (effSkill.name === "Nhắm Chí Mạng" || effSkill.name === "Phòng Thủ")) {
    stamCost = Math.floor(stamCost / 2);
  }
  if (attacker.traits?.includes("brute_force")) stamCost += 2;
  if (isRiposte) stamCost = 0;

  if (attacker.passives?.some(p => p.id === "giap_tru")) stamCost += 2;
  
  if (attacker.passives?.some(p => p.id === "mau_lanh") && defender.wounds?.includes("Chảy Máu")) {
    effSkill = { ...effSkill, critFrom: Math.max(1, effSkill.critFrom - 2) };
  }

  attacker.stamina = clamp(attacker.stamina - stamCost, 0, attacker.maxStamina);

  // Remove Tự Vệ logic, AC_MOD is applied in runDuelRound

  const natRoll = 1 + Math.floor(rng() * 20);
  
  let attackMod = attacker.attackMod + effSkill.hitMod - (exhausted ? 2 : 0);
  if (attacker.wounds?.includes("Chấn Thương Tay")) attackMod -= 2;
  if (attacker.buffs?.["second_wind"] && attacker.buffs["second_wind"] > 0) attackMod += 2;
  if (attacker.buffs?.["Mù Lòa"]) attackMod -= 4; // Debuff from Ném Cát
  
  let toHit = natRoll + attackMod;
  let targetAc = defender.armorClass;

  // Range penalty/restrictions
  if (effSkill.range === "melee" && currentDistance === "Tầm Xa") {
    // Cannot hit melee at range
    return { attacker: attacker.name, defender: defender.name, actionUsed: effSkill.name, natRoll, toHit: 0, targetAc: 0, hit: false, crit: false, damage: 0, defenderHpAfter: defender.hp, exhausted, woundsInflicted: ["Trượt do ngoài tầm đánh"] };
  }
  if (effSkill.range === "ranged" && currentDistance === "Cận Chiến") {
    toHit -= 5; // Penalty for using ranged in melee
  }
  
  if (defender.buffs?.["ROUND_AC_MOD"]) targetAc += defender.buffs["ROUND_AC_MOD"];
  if (defender.buffs?.["Phá Giáp"]) targetAc -= 3;
  if (attacker.traits?.includes("brute_force")) targetAc -= 2;

  const hit = natRoll === 20 || (natRoll !== 1 && toHit >= targetAc);
  const crit = hit && natRoll >= effSkill.critFrom;

  let damage = 0;
  const woundsInflicted: string[] = [];
  let fatality: string | undefined;

  if (hit) {
    if (effSkill.type === "attack" || effSkill.type === "debuff") {
      damage = rollDiceNotation(attacker.weaponDice, rng) + attacker.damageBonus + effSkill.damageMod - (exhausted ? 2 : 0);
      if (attacker.wounds?.includes("Chấn Thương Tay")) damage = Math.max(1, damage - 2);
      if (isRiposte) damage = Math.max(1, Math.floor(damage / 2));
      
      if (crit) damage *= 2;
      
      // Ironborn passive
      if (attacker.passives?.some(p => p.id === "chat_sat") && defender.hp < defender.maxHp * 0.5) {
        damage += 3;
      }

      // Khè Lửa buff
      if (attacker.buffs?.["Cơn Thịnh Nộ Rồng"]) {
        damage += 5;
      }

      const dr = attacker.valyrianOrObsidian ? Math.floor(defender.damageReduction * 0.25) : defender.damageReduction;
      damage = Math.max(1, damage - dr);
      
      defender.hp = Math.max(0, defender.hp - damage);
    }

    // Apply Effects
    if (effSkill.effect && !isRiposte) {
      if (effSkill.effect === "Phá Giáp") {
        defender.buffs = defender.buffs || {};
        defender.buffs["Phá Giáp"] = 2; // Lasts 2 rounds
        woundsInflicted.push("Phá Giáp");
      }
      if (effSkill.effect === "Mù Lòa") {
        // Save roll against Blind (Intellect/Perception save)
        const saveRoll = 1 + Math.floor(rng() * 20) + (defender.perception || 0);
        if (saveRoll < 15) {
          defender.buffs = defender.buffs || {};
          defender.buffs["Mù Lòa"] = 1;
          woundsInflicted.push("Mù Lòa");
        }
      }
    }

    // Wounds
    if (defender.hp > 0 && !isRiposte && damage > 0) {
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
      defender.buffs["second_wind_used"] = 1;
      defender.buffs["second_wind"] = 2;
      defender.stamina = clamp(defender.stamina + Math.floor(defender.maxStamina * 0.3), 0, defender.maxStamina);
      woundsInflicted.push("Second Wind Triggered");
    }

    // Epic Finisher
    if (defender.hp <= 0 && crit) {
      fatality = rng() > 0.5 ? "Bổ đôi khiên và vỡ sọ đối thủ" : "Lưỡi kiếm đâm xuyên qua tim tàn nhẫn";
    }
  }

  return {
    attacker: attacker.name, defender: defender.name, actionUsed: effSkill.name,
    natRoll, toHit, targetAc, hit, crit, damage, defenderHpAfter: defender.hp, exhausted,
    woundsInflicted, fatality, riposte: isRiposte
  };
}

function useItem(actor: Duelist, itemId: string, log: string[]) {
  // Mock item usage
  const itemIndex = actor.inventory.indexOf(itemId);
  if (itemIndex > -1) {
    actor.inventory.splice(itemIndex, 1);
    if (itemId === "Bình Máu") {
      actor.hp = Math.min(actor.maxHp, actor.hp + 20);
      log.push(`${actor.name} uống Bình Máu, hồi 20 HP.`);
    } else if (itemId === "Bình Thể Lực") {
      actor.stamina = Math.min(actor.maxStamina, actor.stamina + 40);
      log.push(`${actor.name} uống Bình Thể Lực, hồi 40 Thể lực.`);
    } else {
      log.push(`${actor.name} sử dụng ${itemId}.`);
    }
  }
}

export function runDuelRound(state: DuelState, actionA: DuelAction, actionB: DuelAction, battleSeed: number): { state: DuelState; events: AttackEvent[] } {
  if (state.finished) return { state, events: [] };
  const next = { 
    ...state, 
    a: { ...state.a, wounds: [...(state.a.wounds || [])], buffs: { ...(state.a.buffs || {}) }, inventory: [...state.a.inventory] }, 
    b: { ...state.b, wounds: [...(state.b.wounds || [])], buffs: { ...(state.b.buffs || {}) }, inventory: [...state.b.inventory] }, 
    log: [...state.log], round: state.round + 1 
  };
  const rng = makeRng((battleSeed ^ (next.round * 0x9e3779b9)) >>> 0);
  const events: AttackEvent[] = [];

  const duelists: Record<string, Duelist> = { [next.a.name]: next.a, [next.b.name]: next.b };
  const actions: Record<string, DuelAction> = { [next.a.name]: actionA, [next.b.name]: actionB };

  // Xác định trước AC Modifiers của các kỹ năng được chọn để áp dụng cho cả round
  for (const dName of next.order) {
    const d = duelists[dName];
    const action = actions[dName];
    if (action.type === "skill") {
      const skill = d.skills.find(s => s.id === action.skillId) || BASIC_SKILLS["tan_cong_thuong"];
      const effSkill = d.stamina <= 0 ? BASIC_SKILLS["tan_cong_thuong"] : skill;
      if (effSkill.acMod !== 0) {
        d.buffs = d.buffs || {};
        d.buffs["ROUND_AC_MOD"] = effSkill.acMod;
      }
    }
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
    // Máu Tiền Nhân passive
    if (d.passives?.some(p => p.id === "mau_tien_nhan")) {
      d.stamina = Math.min(d.maxStamina, d.stamina + 2);
    }
    for (const b in d.buffs) {
      if (b !== "second_wind_used" && b !== "ROUND_AC_MOD" && d.buffs[b] > 0) d.buffs[b]--;
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

    const action = actions[actorName];
    if (action.type === "item") {
      useItem(actor, action.itemId, next.log);
      events.push({ attacker: actor.name, defender: target.name, actionUsed: `Item: ${action.itemId}`, natRoll: 0, toHit: 0, targetAc: 0, hit: true, crit: false, damage: 0, defenderHpAfter: target.hp, exhausted: false });
    } else {
      const skill = actor.skills.find(s => s.id === action.skillId) || BASIC_SKILLS["tan_cong_thuong"];
      const ev = processSkill(rng, actor, target, skill, next.distance);
      
      // Update distance if movement skill used
      if (ev.actionUsed === "Lao Tới" || skill.effect === "Lao Tới") {
        next.distance = "Cận Chiến";
        next.log.push(`${actor.name} lao tới! Khoảng cách hiện tại: Cận Chiến`);
      } else if (ev.actionUsed === "Rút Lui" || skill.effect === "Rút Lui") {
        next.distance = "Tầm Xa";
        next.log.push(`${actor.name} lùi lại! Khoảng cách hiện tại: Tầm Xa`);
      }

      events.push(ev);

      let logMsg = `V${next.round} ${ev.attacker} [${ev.actionUsed}] d20=${ev.natRoll} toHit ${ev.toHit} vs AC ${ev.targetAc}: ` +
          (ev.hit ? `${ev.crit ? "CHÍ MẠNG " : "TRÚNG"}${ev.damage > 0 ? ` −${ev.damage} HP (${ev.defender} còn ${ev.defenderHpAfter})` : ""}` : "TRƯỢT");
      
      if (ev.woundsInflicted?.length) logMsg += ` -> Gây thêm: ${ev.woundsInflicted.join(", ")}`;
      if (ev.fatality) logMsg += `\n[FATALITY] ${ev.fatality}!`;
      next.log.push(logMsg);

      if (target.hp <= 0) {
        next.finished = true;
        next.winner = actor.name;
        next.log.push(`${target.name} gục ngã — ${actor.name} thắng sau ${next.round} vòng`);
        break;
      }

      // Riposte check (Missed by > 5)
      if (!ev.hit && (ev.targetAc - ev.toHit) > 5 && target.traits?.includes("riposte") && !target.wounds?.includes("Chấn Thương Tay")) {
        const repEv = processSkill(rng, target, actor, BASIC_SKILLS["tan_cong_thuong"], next.distance, true);
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
  }
  
  const recA = next.a.wounds?.includes("Chấn Thương Chân") ? 1 : 3;
  const recB = next.b.wounds?.includes("Chấn Thương Chân") ? 1 : 3;
  next.a.stamina = clamp(next.a.stamina + recA, 0, next.a.maxStamina);
  next.b.stamina = clamp(next.b.stamina + recB, 0, next.b.maxStamina);
  
  // Clear ROUND_AC_MOD
  delete next.a.buffs?.["ROUND_AC_MOD"];
  delete next.b.buffs?.["ROUND_AC_MOD"];

  return { state: next, events };
}

export interface DuelResult {
  winner: string;
  loser: string;
  rounds: number;
  hpLeftWinner: number;
  log: string[];
}

export function autoDuel(a: Duelist, b: Duelist, seed: number, maxRounds = 30): DuelResult {
  let state = startDuel(a, b, seed);
  const rng = makeRng(seed ^ 0x51ed270b);
  while (!state.finished && state.round < maxRounds) {
    const pick = (d: Duelist, _opp: Duelist): DuelAction => {
      // Very basic AI
      if (d.hp < d.maxHp * 0.3 && d.inventory.includes("Bình Máu")) return { type: "item", itemId: "Bình Máu" };
      const availableSkills = d.skills.filter(s => s.staminaCost <= d.stamina);
      // Lọc skill theo khoảng cách
      let validSkills = availableSkills.filter(s => s.range === "any" || (state.distance === "Cận Chiến" ? s.range !== "ranged" : s.range !== "melee"));
      if (validSkills.length === 0) validSkills = availableSkills; // Fallback
      if (validSkills.length === 0) return { type: "skill", skillId: "tan_cong_thuong" }; // Fallback

      // Ưu tiên Rút Lui nếu là cung thủ đang bị áp sát
      if (state.distance === "Cận Chiến" && d.skills.some(s => s.range === "ranged") && validSkills.some(s => s.effect === "Rút Lui")) {
        const rutLui = validSkills.find(s => s.effect === "Rút Lui");
        if (rutLui && rng() < 0.7) return { type: "skill", skillId: rutLui.id };
      }
      // Ưu tiên Lao Tới nếu là cận chiến đang ở xa
      if (state.distance === "Tầm Xa" && !d.skills.some(s => s.range === "ranged") && validSkills.some(s => s.effect === "Lao Tới")) {
        const laoToi = validSkills.find(s => s.effect === "Lao Tới");
        if (laoToi && rng() < 0.7) return { type: "skill", skillId: laoToi.id };
      }

      const skill = validSkills[Math.floor(rng() * validSkills.length)];
      return { type: "skill", skillId: skill.id };
    };
    state = runDuelRound(state, pick(state.a, state.b), pick(state.b, state.a), seed).state;
  }
  if (!state.finished) {
    const winner = state.a.hp / state.a.maxHp >= state.b.hp / state.b.maxHp ? state.a : state.b;
    state.winner = winner.name;
    state.log.push(`Hai bên kiệt sức sau ${state.round} vòng — ${winner.name} chiếm thượng phong`);
  }
  const winner = state.winner === state.a.name ? state.a : state.b;
  const loser = state.winner === state.a.name ? state.b : state.a;
  return { winner: winner.name, loser: loser.name, rounds: state.round, hpLeftWinner: winner.hp, log: state.log };
}
