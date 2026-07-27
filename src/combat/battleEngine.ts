import { makeRng, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import type { BattleSideInput, WeatherCondition } from "./battleResolver";
import type { Terrain } from "../mvu/schema";

export type TacticId =
  | "tan_cong_tong_luc"
  | "phong_thu_kien_cuong"
  | "dot_kich_suon"
  | "mua_mui_ten"
  | "dracarys"
  | "danh_boc_hau"
  | "rut_lui"
  | "siege_bombard"
  | "siege_assault"
  | "siege_tunnel"
  | "siege_starve"
  | "siege_dracarys"
  | "defend_hold"
  | "defend_oil"
  | "defend_volley"
  | "defend_sortie"
  | "defend_repair";

export interface BattleTactic {
  id: TacticId;
  name: string;
  description: string;
  costStamina?: number; // Might use later if armies have fatigue
  condition?: (side: BattleSideInput, weather: WeatherCondition) => boolean;
  
  // Tactical rock-paper-scissors & buffs
  baseDamageMod: number;
  baseDefenseMod: number;
  moraleDamage: number;
  
  // Advantage against other tactics (multiplier)
  advantageAgainst?: TacticId[];
  disadvantageAgainst?: TacticId[];
}

export const ARMY_TACTICS: Record<string, BattleTactic> = {
  tan_cong_tong_luc: {
    id: "tan_cong_tong_luc",
    name: "Tấn Công Tổng Lực",
    description: "Dồn toàn quân xông lên. Sát thương cao nhưng dễ tổn thất nặng.",
    baseDamageMod: 1.5,
    baseDefenseMod: 0.7,
    moraleDamage: 5,
    advantageAgainst: ["dot_kich_suon"],
    disadvantageAgainst: ["phong_thu_kien_cuong", "mua_mui_ten"],
  },
  phong_thu_kien_cuong: {
    id: "phong_thu_kien_cuong",
    name: "Phòng Thủ Kiên Cường",
    description: "Lập đội hình phalanx, khiên tường hoặc cố thủ. Giảm thương vong đáng kể.",
    baseDamageMod: 0.6,
    baseDefenseMod: 1.6,
    moraleDamage: 2,
    advantageAgainst: ["tan_cong_tong_luc"],
    disadvantageAgainst: ["dracarys", "danh_boc_hau"],
  },
  dot_kich_suon: {
    id: "dot_kich_suon",
    name: "Đột Kích Sườn",
    description: "Sử dụng lực lượng cơ động tấn công vào sườn hở của địch. Gây sát thương sĩ khí lớn.",
    condition: (side) => side.troopType === "Kỵ Binh" || side.troopType === "Kỵ Binh Nhẹ" || (side.general?.cunning ?? 0) >= 60,
    baseDamageMod: 1.2,
    baseDefenseMod: 0.9,
    moraleDamage: 12, // Đánh sườn làm giảm sĩ khí nhanh
    advantageAgainst: ["phong_thu_kien_cuong", "mua_mui_ten"],
    disadvantageAgainst: ["tan_cong_tong_luc"],
  },
  mua_mui_ten: {
    id: "mua_mui_ten",
    name: "Mưa Mũi Tên",
    description: "Bắn yểm trợ từ xa, làm tiêu hao sinh lực địch trước khi giáp lá cà.",
    condition: (side, weather) => side.troopType === "Cung Thủ" && weather !== "Mưa Lớn" && weather !== "Sương Mù",
    baseDamageMod: 1.0,
    baseDefenseMod: 1.1,
    moraleDamage: 4,
    advantageAgainst: ["tan_cong_tong_luc"],
    disadvantageAgainst: ["phong_thu_kien_cuong"],
  },
  dracarys: {
    id: "dracarys",
    name: "Dracarys!",
    description: "Triệu hồi rồng khạc lửa. Hủy diệt trên diện rộng và làm suy sụp tinh thần địch.",
    condition: (side) => !!side.dragon && side.dragon.isRidden,
    baseDamageMod: 3.0,
    baseDefenseMod: 1.0,
    moraleDamage: 25,
    advantageAgainst: ["phong_thu_kien_cuong", "tan_cong_tong_luc", "dot_kich_suon", "mua_mui_ten"],
  },
  danh_boc_hau: {
    id: "danh_boc_hau",
    name: "Đánh Bọc Hậu",
    description: "Một đạo quân tinh nhuệ vòng ra sau lưng địch. Cần tướng Trí Mưu cao.",
    condition: (side) => (side.general?.cunning ?? 0) >= 75,
    baseDamageMod: 1.4,
    baseDefenseMod: 1.0,
    moraleDamage: 15,
    advantageAgainst: ["phong_thu_kien_cuong"],
    disadvantageAgainst: ["dot_kich_suon"],
  },
  rut_lui: {
    id: "rut_lui",
    name: "Rút Lui Có Trật Tự",
    description: "Bảo toàn lực lượng và rời khỏi chiến trường.",
    baseDamageMod: 0.2,
    baseDefenseMod: 1.5,
    moraleDamage: 0,
  }
};

export const SIEGE_ATTACKER_TACTICS: Record<string, BattleTactic> = {
  siege_bombard: {
    id: "siege_bombard", name: "Bắn Phá", description: "Dùng máy bắn đá phá hủy tường thành.",
    baseDamageMod: 0.1, baseDefenseMod: 1.0, moraleDamage: 2, advantageAgainst: ["defend_repair"],
  },
  siege_assault: {
    id: "siege_assault", name: "Xung Phong", description: "Leo thang tấn công trực diện. Thương vong vô cùng nặng nề nếu tường chưa vỡ.",
    baseDamageMod: 1.5, baseDefenseMod: 0.5, moraleDamage: 5, disadvantageAgainst: ["defend_hold", "defend_oil"],
  },
  siege_tunnel: {
    id: "siege_tunnel", name: "Đào Hầm", description: "Đào hầm đánh sập tường thành. Chậm nhưng chắc chắn.",
    baseDamageMod: 0.2, baseDefenseMod: 1.0, moraleDamage: 3, disadvantageAgainst: ["defend_oil"],
  },
  siege_starve: {
    id: "siege_starve", name: "Bao Vây", description: "Cắt lương thực, làm tiêu hao nhuệ khí phe thủ.",
    baseDamageMod: 0, baseDefenseMod: 1.5, moraleDamage: 8, disadvantageAgainst: ["defend_sortie"],
  },
  siege_dracarys: {
    id: "siege_dracarys", name: "Dracarys (Phá Cổng)", description: "Dùng rồng thiêu rụi cổng thành lập tức.",
    condition: (side) => !!side.dragon && side.dragon.isRidden,
    baseDamageMod: 3.0, baseDefenseMod: 1.0, moraleDamage: 20, advantageAgainst: ["defend_hold", "defend_oil", "defend_volley", "defend_repair"],
  },
};

export const SIEGE_DEFENDER_TACTICS: Record<string, BattleTactic> = {
  defend_hold: {
    id: "defend_hold", name: "Tử Thủ", description: "Bám trụ tường thành. Sát thương trả đũa cao.",
    baseDamageMod: 1.0, baseDefenseMod: 2.0, moraleDamage: 2, advantageAgainst: ["siege_assault"],
  },
  defend_oil: {
    id: "defend_oil", name: "Đổ Dầu Sôi", description: "Sát thương lớn lên những kẻ áp sát chân tường.",
    baseDamageMod: 1.8, baseDefenseMod: 1.2, moraleDamage: 6, advantageAgainst: ["siege_assault", "siege_tunnel"],
  },
  defend_volley: {
    id: "defend_volley", name: "Mưa Mũi Tên", description: "Cấu rỉa quân công thành từ xa.",
    condition: (side, weather) => side.troopType === "Cung Thủ" && weather !== "Mưa Lớn" && weather !== "Sương Mù",
    baseDamageMod: 1.0, baseDefenseMod: 1.5, moraleDamage: 4, advantageAgainst: ["siege_bombard"],
  },
  defend_sortie: {
    id: "defend_sortie", name: "Đột Kích", description: "Cử kỵ binh xông ra ngoài phá trại địch.",
    condition: (side) => side.troopType === "Kỵ Binh" || side.troopType === "Kỵ Binh Nhẹ",
    baseDamageMod: 1.2, baseDefenseMod: 0.8, moraleDamage: 5, advantageAgainst: ["siege_starve", "siege_bombard"],
  },
  defend_repair: {
    id: "defend_repair", name: "Sửa Chữa", description: "Gia cố tường thành.",
    baseDamageMod: 0, baseDefenseMod: 1.5, moraleDamage: 0, disadvantageAgainst: ["siege_bombard", "siege_dracarys"],
  },
};

export const ALL_TACTICS: Record<TacticId, BattleTactic> = {
  ...ARMY_TACTICS,
  ...SIEGE_ATTACKER_TACTICS as any,
  ...SIEGE_DEFENDER_TACTICS as any,
};

export interface InteractiveBattleState {
  player: BattleSideInput & { currentTroops: number; currentMorale: number };
  enemy: BattleSideInput & { currentTroops: number; currentMorale: number };
  terrain: Terrain;
  weather: WeatherCondition;
  seed: number;
  round: number;
  log: string[];
  finished: boolean;
  winner: "player" | "enemy" | "draw" | null;
  
  isSiege?: boolean;
  wallHp?: number;
  wallMaxHp?: number;
  wallBreached?: boolean;
}

export function initInteractiveBattle(
  player: BattleSideInput,
  enemy: BattleSideInput,
  terrain: Terrain = "Đồng Bằng",
  weather: WeatherCondition = "Trời Quang",
  seed: number
): InteractiveBattleState {
  return {
    player: { ...player, currentTroops: player.totalTroops, currentMorale: player.morale },
    enemy: { ...enemy, currentTroops: enemy.totalTroops, currentMorale: enemy.morale },
    terrain,
    weather,
    seed,
    round: 1,
    log: ["Hai đại quân đã dàn trận, tiếng kèn xung trận vang vọng khắp chiến trường..."],
    finished: false,
    winner: null,
  };
}

export function initSiegeBattle(
  player: BattleSideInput,
  enemy: BattleSideInput,
  terrain: Terrain = "Thành Trì (thủ)",
  weather: WeatherCondition = "Trời Quang",
  seed: number,
  wallMaxHp: number = 3000
): InteractiveBattleState {
  const state = initInteractiveBattle(player, enemy, terrain, weather, seed);
  state.isSiege = true;
  state.wallMaxHp = wallMaxHp;
  state.wallHp = wallMaxHp;
  state.wallBreached = false;
  state.log = ["Quân công thành đã áp sát. Tiếng còi báo động rền vang..."];
  return state;
}

export function playArmyRound(
  state: InteractiveBattleState,
  playerTacticId: TacticId,
  enemyTacticId: TacticId
): InteractiveBattleState {
  const next = { ...state, log: [...state.log] };
  const rng = makeRng(state.seed + state.round);
  
  const pTac = ALL_TACTICS[playerTacticId];
  const eTac = ALL_TACTICS[enemyTacticId];
  
  next.log.push(`\\n** Vòng ${next.round} **`);
  next.log.push(`Phe ta sử dụng [${pTac.name}] - Địch sử dụng [${eTac.name}]`);

  // Check advantage
  let pAdv = 1.0;
  let eAdv = 1.0;
  if (pTac.advantageAgainst?.includes(eTac.id)) {
    pAdv = 1.5;
    next.log.push(`Phe ta khắc chế chiến thuật của địch!`);
  }
  if (eTac.advantageAgainst?.includes(pTac.id)) {
    eAdv = 1.5;
    next.log.push(`Địch khắc chế chiến thuật của phe ta!`);
  }

  // Base damage is proportional to troop count, training, equipment, and general
  const calcBaseDmg = (attacker: typeof state.player) => {
    let power = attacker.currentTroops * ((attacker.training + attacker.equipment) / 200);
    if (attacker.general) {
      power *= (1 + (attacker.general.command * 0.6 + attacker.general.cunning * 0.4) / 200);
    }
    // Ưu khuyết binh chủng, địa hình, thời tiết
    power *= (attacker.matchupFactor ?? 1.0);
    // Dragon
    if (attacker.dragon?.isRidden) {
      power += attacker.dragon.power * 20;
    }
    return Math.max(power * 0.05, 10); // scale down to reasonable casualties per round
  };

  const pBaseDmg = calcBaseDmg(next.player);
  const eBaseDmg = calcBaseDmg(next.enemy);

  // Apply tactic modifiers and RNG
  const pRoll = 0.8 + Math.floor(rng() * 41) / 100; // 0.8 to 1.2
  const eRoll = 0.8 + Math.floor(rng() * 41) / 100;

  let pDmgDealt = pBaseDmg * pTac.baseDamageMod * pAdv * (1 / eTac.baseDefenseMod) * pRoll;
  let eDmgDealt = eBaseDmg * eTac.baseDamageMod * eAdv * (1 / pTac.baseDefenseMod) * eRoll;

  // Retreat logic
  if (playerTacticId === "rut_lui") {
    next.log.push(`Phe ta quyết định rút lui để bảo toàn lực lượng.`);
    next.finished = true;
    next.winner = "enemy";
    pDmgDealt = 0;
    eDmgDealt *= 1.5;
  } else if (enemyTacticId === "rut_lui") {
    next.log.push(`Địch quân vỡ trận và tìm cách rút lui!`);
    next.finished = true;
    next.winner = "player";
    eDmgDealt = 0;
    pDmgDealt *= 1.5;
  }

  // Apply casualties and Siege Rules
  let pLoss = Math.round(eDmgDealt);
  let eLoss = Math.round(pDmgDealt);

  if (next.isSiege && !next.wallBreached && next.wallHp !== undefined) {
    // Xác định phe công và phe thủ
    const pIsAttacker = next.player.siegeRole === "attacker";
    const eIsAttacker = next.enemy.siegeRole === "attacker";
    
    // Nếu chưa vỡ thành, sát thương của phe công chủ yếu đánh vào tường
    if (pIsAttacker) {
      if (playerTacticId === "siege_dracarys") {
        next.wallHp = 0;
        next.log.push(`🔥 Lửa rồng đã thiêu rụi cổng thành!`);
      } else if (playerTacticId === "siege_assault") {
        next.log.push(`Phe công leo tường xông lên, chịu thương vong cực nặng!`);
        pLoss = Math.round(pLoss * 1.5); // Attacker takes more damage
      } else if (playerTacticId === "siege_tunnel") {
        next.wallHp = Math.max(0, next.wallHp - eLoss * 3);
        eLoss = Math.round(eLoss * 0.1); // Rất ít sát thương lên lính
      } else if (playerTacticId === "siege_bombard") {
        next.wallHp = Math.max(0, next.wallHp - eLoss * 5);
        eLoss = Math.round(eLoss * 0.2); // Tường gánh sát thương
      } else if (playerTacticId === "siege_starve") {
        eLoss = 0;
      } else {
        eLoss = Math.round(eLoss * 0.2);
      }
      
      if (enemyTacticId === "defend_repair") {
        next.wallHp = Math.min(next.wallMaxHp ?? 3000, next.wallHp + 500);
        next.log.push(`Phe thủ gia cố tường thành (+500 HP).`);
      }
    } else if (eIsAttacker) {
      if (enemyTacticId === "siege_dracarys") {
        next.wallHp = 0;
        next.log.push(`🔥 Lửa rồng địch đã thiêu rụi cổng thành!`);
      } else if (enemyTacticId === "siege_assault") {
        next.log.push(`Địch quân leo tường xông lên, chịu thương vong cực nặng!`);
        eLoss = Math.round(eLoss * 1.5);
      } else if (enemyTacticId === "siege_tunnel") {
        next.wallHp = Math.max(0, next.wallHp - pLoss * 3);
        pLoss = Math.round(pLoss * 0.1);
      } else if (enemyTacticId === "siege_bombard") {
        next.wallHp = Math.max(0, next.wallHp - pLoss * 5);
        pLoss = Math.round(pLoss * 0.2);
      } else if (enemyTacticId === "siege_starve") {
        pLoss = 0;
      } else {
        pLoss = Math.round(pLoss * 0.2);
      }

      if (playerTacticId === "defend_repair") {
        next.wallHp = Math.min(next.wallMaxHp ?? 3000, next.wallHp + 500);
        next.log.push(`Phe ta gia cố tường thành (+500 HP).`);
      }
    }
    
    if (next.wallHp <= 0 && !next.wallBreached) {
      next.wallHp = 0;
      next.wallBreached = true;
      next.log.push(`⚠️ TƯỜNG THÀNH ĐÃ VỠ! Binh lính giáp lá cà!`);
    } else if (!next.wallBreached) {
      next.log.push(`🛡️ Tường thành còn: ${Math.round(next.wallHp)}/${next.wallMaxHp} HP.`);
    }
  }

  next.player.currentTroops = Math.max(0, next.player.currentTroops - pLoss);
  next.enemy.currentTroops = Math.max(0, next.enemy.currentTroops - eLoss);

  if (pLoss > 0 || eLoss > 0) {
    if (playerTacticId !== "rut_lui") next.log.push(`Phe ta mất ${pLoss} quân.`);
    if (enemyTacticId !== "rut_lui") next.log.push(`Địch mất ${eLoss} quân.`);
  }

  // Apply morale damage
  const pMoraleLoss = eTac.moraleDamage * eAdv + (pLoss / Math.max(1, next.player.totalTroops)) * 100;
  const eMoraleLoss = pTac.moraleDamage * pAdv + (eLoss / Math.max(1, next.enemy.totalTroops)) * 100;

  next.player.currentMorale = clamp(next.player.currentMorale - Math.round(pMoraleLoss), 0, 100);
  next.enemy.currentMorale = clamp(next.enemy.currentMorale - Math.round(eMoraleLoss), 0, 100);

  // Check end conditions
  if (!next.finished) {
    if (next.player.currentTroops <= 0 || next.player.currentMorale <= 0) {
      next.finished = true;
      next.winner = "enemy";
      next.log.push(`Phe ta đã hoàn toàn tan vỡ!`);
    } else if (next.enemy.currentTroops <= 0 || next.enemy.currentMorale <= 0) {
      next.finished = true;
      next.winner = "player";
      next.log.push(`Địch quân đã sụp đổ hoàn toàn!`);
    }
  }

  next.round++;
  return next;
}

export function autoPickArmyTactic(side: BattleSideInput, weather: WeatherCondition, rng: RNG, isSiege?: boolean): TacticId {
  let pool = Object.values(ARMY_TACTICS);
  if (isSiege) {
    if (side.siegeRole === "attacker") {
      pool = Object.values(SIEGE_ATTACKER_TACTICS);
    } else {
      pool = Object.values(SIEGE_DEFENDER_TACTICS);
    }
  }

  const available = pool.filter(t => !t.condition || t.condition(side, weather));
  if (available.length === 0) return pool[0].id as TacticId; // Fallback
  
  const hasDragon = available.find(t => t.id === "dracarys" || t.id === "siege_dracarys");
  if (hasDragon && Math.floor(rng() * 100) < 50) return hasDragon.id as TacticId;
  
  const idx = Math.floor(rng() * available.length);
  return available[idx].id as TacticId;
}
