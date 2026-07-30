/**
 * ĐẠI CHIẾN TƯƠNG TÁC (M22) — trận đánh dàn quân, chơi theo vòng.
 *
 * Bản trước là hai thanh máu đấu nhau: mỗi vòng chọn một chiến thuật, nhân vài
 * hệ số, trừ quân. Không có cánh trái cánh phải, không có hậu bị, không có mệt
 * mỏi, và một trận đánh mười vạn quân diễn ra y hệt một trận đánh trăm quân.
 *
 * Bản này dựng lại theo cách một trận đánh trung cổ thật sự vận hành:
 *
 *   • BA CÁNH QUÂN — Cánh Trái / Trung Quân / Cánh Phải, mỗi cánh có quân số,
 *     sĩ khí, GẮN KẾT và MỆT MỎI riêng. Cánh trái của ta đối đầu cánh phải của
 *     địch. Một cánh vỡ là cánh bên cạnh hở sườn và vỡ theo — hiệu ứng dây
 *     chuyền chính là thứ quyết định phần lớn trận đánh trong lịch sử.
 *   • HẬU BỊ — quân giữ lại phía sau. Tung đúng lúc thì cứu được một cánh sắp
 *     vỡ hoặc dứt điểm trận đánh; tung sớm thì không còn gì để cứu.
 *   • ĐIỂM CHỈ HUY — tướng giỏi mới ra được nhiều mệnh lệnh đặc biệt trong một
 *     trận. Bọc hậu, nghi binh, tung hậu bị đều tốn điểm.
 *   • CÁC GIAI ĐOẠN — Dàn Trận → Xạ Kích → Giao Phong → Hỗn Chiến → Truy Kích.
 *     Mỗi giai đoạn đề cao một loại binh chủng khác nhau: cung thủ định đoạt
 *     giai đoạn xạ kích, kỵ binh định đoạt truy kích.
 *   • MỆT MỎI VÀ GẮN KẾT — đánh lâu thì đội hình rã ra. Không quân đội nào giữ
 *     được hàng ngũ sau mười vòng giáp lá cà.
 *   • SỰ KIỆN CHIẾN TRƯỜNG — tướng trúng tên, kỵ binh sa lầy, viện quân tới,
 *     chư hầu đổi cờ giữa trận.
 *
 * Vây thành có engine riêng (combat/siege.ts); file này chỉ điều phối.
 * Mọi thứ tất định theo seed.
 */
import { makeRng, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import type { BattleSideInput, WeatherCondition } from "./battleResolver";
import type { Terrain } from "../mvu/schema";
import { terrainMultiplier } from "./terrain";
import { troopMeta } from "../content/westeros/troopTypes";
import {
  makeBattleDragon, dragonBreath, scorpionVolley, airClash, tickDragons, dragonActive,
  type BattleDragon, type DragonAltitude,
} from "./dragonBattle";
import {
  initSiege, playSiegeRound, defaultSections, totalWallHp, totalWallMaxHp, anyBreached,
  siegeSkillOf, autoPickSiegeAttacker, autoPickSiegeDefender,
  SIEGE_TACTICS, SIEGE_ATTACKER_TACTIC_LIST, SIEGE_DEFENDER_TACTIC_LIST,
  type SiegeState, type SiegeTacticId, type SiegeAttackerTactic, type SiegeDefenderTactic,
} from "./siege";

export type {
  SiegeState, SiegeTacticId, SiegeAttackerTactic, SiegeDefenderTactic,
} from "./siege";
export type { BattleDragon, DragonAltitude } from "./dragonBattle";
export { ALTITUDE_INTRO, describeAir } from "./dragonBattle";
export { SIEGE_TACTICS, SIEGE_ENGINES, describeSiege, sectionsFromHolding, supplyDaysFromHolding } from "./siege";

// ── CÁNH QUÂN ───────────────────────────────────────────────────────────────

export type SectorId = "Cánh Trái" | "Trung Quân" | "Cánh Phải";
export const SECTOR_IDS: SectorId[] = ["Cánh Trái", "Trung Quân", "Cánh Phải"];

/** Cánh trái của ta đối đầu cánh phải của địch — hai đạo quân quay mặt vào nhau. */
export const SECTOR_FACING: Record<SectorId, SectorId> = {
  "Cánh Trái": "Cánh Phải",
  "Trung Quân": "Trung Quân",
  "Cánh Phải": "Cánh Trái",
};

export const SECTOR_INTRO: Record<SectorId, string> = {
  "Cánh Trái": "Cánh cơ động. Kỵ binh thường đứng đây để vòng ra đánh sườn — và cũng là chỗ dễ bị đánh sườn nhất.",
  "Trung Quân": "Xương sống đội hình: bộ binh và trường thương giữ hàng, cờ soái cắm ở đây. Trung quân vỡ là cả trận vỡ.",
  "Cánh Phải": "Cánh còn lại. Trong đội hình phong kiến Westeros đây thường là chỗ của chư hầu — cũng là chỗ dễ đổi cờ nhất.",
};

export interface BattleSector {
  id: SectorId;
  troops: number;
  startTroops: number;
  /** sĩ khí riêng của cánh này 0-100. */
  morale: number;
  /** gắn kết đội hình 0-100 — hàng ngũ còn giữ được hay đã rã thành đám đông. */
  cohesion: number;
  /** mệt mỏi 0-100. */
  fatigue: number;
  routed: boolean;
  /** binh chủng chủ đạo của cánh. */
  troopType: string;
}

export interface BattleForce extends BattleSideInput {
  currentTroops: number;
  currentMorale: number;
  sectors: Record<SectorId, BattleSector>;
  /** quân giữ lại phía sau, chưa vào trận. */
  reserve: number;
  /** mệnh lệnh đặc biệt còn ra được trong trận này. */
  commandPoints: number;
}

// ── GIAI ĐOẠN ───────────────────────────────────────────────────────────────

export type BattlePhase = "Dàn Trận" | "Xạ Kích" | "Giao Phong" | "Hỗn Chiến" | "Truy Kích";

export interface PhaseDef {
  id: BattlePhase;
  intro: string;
  /** hệ số thương vong của giai đoạn. */
  damage: number;
  /** chỉ số binh chủng được đề cao trong giai đoạn này. */
  keyStat: "Xạ Kích" | "Xung Phong" | "Cận Chiến" | "Kỷ Luật";
  /** mệt mỏi cộng thêm mỗi vòng. */
  fatigue: number;
}

export const BATTLE_PHASES: Record<BattlePhase, PhaseDef> = {
  "Dàn Trận": {
    id: "Dàn Trận", damage: 0.4, keyStat: "Kỷ Luật", fatigue: 3,
    intro: "Hai bên còn đang dàn hàng. Lính do thám chạm nhau ở giữa đồng, kèn hiệu vang từ hai phía. Ai chọn được thế đất lúc này thì cầm nửa phần thắng.",
  },
  "Xạ Kích": {
    id: "Xạ Kích", damage: 0.75, keyStat: "Xạ Kích", fatigue: 5,
    intro: "Mưa tên bắt đầu. Cung thủ và nỏ định đoạt giai đoạn này; bộ binh chỉ biết nâng khiên và chịu đựng.",
  },
  "Giao Phong": {
    id: "Giao Phong", damage: 1.15, keyStat: "Xung Phong", fatigue: 9,
    intro: "Hai hàng quân chạm nhau. Cú xung phong đầu tiên quyết định cánh nào lùi trước.",
  },
  "Hỗn Chiến": {
    id: "Hỗn Chiến", damage: 1.0, keyStat: "Cận Chiến", fatigue: 12,
    intro: "Không còn hàng ngũ, chỉ còn từng đám người chém nhau trong bụi và tiếng gào. Từ đây trở đi, thắng thua là chuyện của sức bền.",
  },
  "Truy Kích": {
    id: "Truy Kích", damage: 2.4, keyStat: "Xung Phong", fatigue: 6,
    intro: "Một bên đã vỡ. Phần lớn xác nằm lại trên chiến trường là ở giai đoạn này, không phải lúc giáp lá cà.",
  },
};

// ── CHIẾN THUẬT ─────────────────────────────────────────────────────────────

export type ArmyTacticId =
  | "tan_cong_tong_luc" | "phong_thu_kien_cuong" | "dot_kich_suon" | "mua_mui_ten"
  | "dracarys" | "danh_boc_hau" | "rut_lui"
  | "tung_hau_bi" | "nghi_binh" | "xung_phong" | "doi_hinh_vong_tron";

export type TacticId = ArmyTacticId | SiegeTacticId;

export interface BattleTactic {
  id: TacticId;
  name: string;
  description: string;
  /** một câu cho AI mượn giọng khi kể. */
  flavor?: string;
  costStamina?: number;
  condition?: (side: BattleSideInput, weather: WeatherCondition) => boolean;

  baseDamageMod: number;
  baseDefenseMod: number;
  moraleDamage: number;

  advantageAgainst?: TacticId[];
  disadvantageAgainst?: TacticId[];

  // ── M22 ──
  /** tốn bao nhiêu Điểm Chỉ Huy. */
  commandCost?: number;
  /** cộng vào gắn kết đội hình của chính mình mỗi vòng. */
  cohesionMod?: number;
  /** cộng vào mệt mỏi của chính mình mỗi vòng. */
  fatigueMod?: number;
  /** nhân sát thương dồn vào ĐÚNG cánh được chọn làm mũi nhọn. */
  focusMultiplier?: number;
  /** giai đoạn mà chiến thuật này phát huy (×1.35 sát thương). */
  bestPhase?: BattlePhase;
}

export const ARMY_TACTICS: Record<string, BattleTactic> = {
  tan_cong_tong_luc: {
    id: "tan_cong_tong_luc", name: "Tấn Công Tổng Lực",
    description: "Dồn toàn quân xông lên. Sát thương cao nhất, nhưng đội hình rã nhanh và thương vong nặng.",
    flavor: "Kèn dài một hồi, và cả cánh đồng chuyển động về phía trước cùng lúc.",
    baseDamageMod: 1.5, baseDefenseMod: 0.7, moraleDamage: 5,
    advantageAgainst: ["dot_kich_suon"], disadvantageAgainst: ["phong_thu_kien_cuong", "mua_mui_ten", "doi_hinh_vong_tron"],
    cohesionMod: -8, fatigueMod: 6, focusMultiplier: 1.25, bestPhase: "Hỗn Chiến",
  },
  phong_thu_kien_cuong: {
    id: "phong_thu_kien_cuong", name: "Phòng Thủ Kiên Cường",
    description: "Tường khiên, hàng giáo dựng đứng, không tiến một bước. Giảm mạnh thương vong và giữ được gắn kết.",
    flavor: "Khiên chồng lên khiên tới khi cả hàng quân trông như một bức tường gỗ.",
    baseDamageMod: 0.6, baseDefenseMod: 1.6, moraleDamage: 2,
    advantageAgainst: ["tan_cong_tong_luc", "xung_phong"], disadvantageAgainst: ["dracarys", "danh_boc_hau", "mua_mui_ten"],
    cohesionMod: 6, fatigueMod: -2, bestPhase: "Giao Phong",
  },
  dot_kich_suon: {
    id: "dot_kich_suon", name: "Đột Kích Sườn",
    description: "Lực lượng cơ động đánh vào sườn hở. Sát thương sĩ khí rất lớn — cánh bị đánh sườn dễ vỡ hơn hẳn.",
    flavor: "Họ không đánh vào mặt trước. Họ đi vòng, và xuất hiện ở chỗ không ai cầm khiên.",
    condition: (side) => side.troopType === "Kỵ Binh" || side.troopType === "Kỵ Binh Nhẹ" || (side.general?.cunning ?? 0) >= 60,
    baseDamageMod: 1.2, baseDefenseMod: 0.9, moraleDamage: 12,
    advantageAgainst: ["phong_thu_kien_cuong", "mua_mui_ten"], disadvantageAgainst: ["tan_cong_tong_luc", "doi_hinh_vong_tron"],
    focusMultiplier: 1.5, fatigueMod: 4, bestPhase: "Giao Phong",
  },
  mua_mui_ten: {
    id: "mua_mui_ten", name: "Mưa Mũi Tên",
    description: "Bắn phủ đầu để tiêu hao trước khi giáp lá cà. Vô dụng dưới mưa lớn hoặc sương mù.",
    flavor: "Bầu trời tối lại một nhịp, rồi tiếng va chạm của thép vào khiên nghe như mưa đá.",
    condition: (side, weather) => side.troopType === "Cung Thủ" && weather !== "Mưa Lớn" && weather !== "Sương Mù",
    baseDamageMod: 1.0, baseDefenseMod: 1.1, moraleDamage: 4,
    advantageAgainst: ["tan_cong_tong_luc", "phong_thu_kien_cuong"], disadvantageAgainst: ["dot_kich_suon", "xung_phong"],
    cohesionMod: 2, bestPhase: "Xạ Kích",
  },
  dracarys: {
    id: "dracarys", name: "Dracarys!",
    description: "Rồng khạc lửa dọc theo hàng quân. Huỷ diệt diện rộng và làm sụp sĩ khí toàn quân địch.",
    flavor: "Cái bóng lướt qua trước, rồi mới tới hơi nóng.",
    condition: (side) => !!side.dragon && side.dragon.isRidden,
    baseDamageMod: 3.0, baseDefenseMod: 1.0, moraleDamage: 25,
    advantageAgainst: ["phong_thu_kien_cuong", "tan_cong_tong_luc", "dot_kich_suon", "mua_mui_ten", "doi_hinh_vong_tron"],
    commandCost: 1, focusMultiplier: 1.6,
  },
  danh_boc_hau: {
    id: "danh_boc_hau", name: "Đánh Bọc Hậu",
    description: "Một đạo tinh nhuệ vòng hẳn ra sau lưng địch. Cần tướng Trí Mưu cao và một Điểm Chỉ Huy.",
    flavor: "Không ai thấy họ đi. Người ta chỉ thấy hàng cuối của địch bỗng quay đầu lại.",
    condition: (side) => (side.general?.cunning ?? 0) >= 75,
    baseDamageMod: 1.4, baseDefenseMod: 1.0, moraleDamage: 15,
    advantageAgainst: ["phong_thu_kien_cuong", "doi_hinh_vong_tron"], disadvantageAgainst: ["dot_kich_suon"],
    commandCost: 1, focusMultiplier: 1.4,
  },
  rut_lui: {
    id: "rut_lui", name: "Rút Lui Có Trật Tự",
    description: "Bỏ chiến trường để bảo toàn lực lượng. Vẫn mất quân trên đường rút, nhưng còn quân là còn cửa.",
    flavor: "Hàng sau quay trước, hàng trước lùi từng bước, giáo vẫn chĩa về phía địch.",
    baseDamageMod: 0.2, baseDefenseMod: 1.5, moraleDamage: 0,
  },

  // ── M22: bốn mệnh lệnh mới ──
  tung_hau_bi: {
    id: "tung_hau_bi", name: "Tung Hậu Bị",
    description: "Đưa toàn bộ quân dự bị vào cánh đang chọn: bù quân, hồi gắn kết và nâng sĩ khí cả đạo quân. Chỉ tung được một lần.",
    flavor: "Lá cờ dự bị hạ xuống, và hàng quân đứng chờ cả buổi sáng bắt đầu chạy.",
    condition: (side) => ((side as BattleForce).reserve ?? 0) > 0,
    baseDamageMod: 1.1, baseDefenseMod: 1.25, moraleDamage: 6,
    commandCost: 1, cohesionMod: 15, focusMultiplier: 1.3,
  },
  nghi_binh: {
    id: "nghi_binh", name: "Nghi Binh",
    description: "Giả vờ vỡ trận để dụ địch đuổi theo rồi khép lại. Giảm mạnh sát thương phải chịu và làm rối đội hình địch.",
    flavor: "Hàng đầu quay lưng bỏ chạy — thật đến mức chính quân mình cũng tưởng là thật.",
    condition: (side) => (side.general?.cunning ?? 0) >= 55,
    baseDamageMod: 0.7, baseDefenseMod: 1.9, moraleDamage: 8,
    advantageAgainst: ["tan_cong_tong_luc", "xung_phong", "dot_kich_suon"], disadvantageAgainst: ["phong_thu_kien_cuong", "mua_mui_ten"],
    commandCost: 1, cohesionMod: 4,
  },
  xung_phong: {
    id: "xung_phong", name: "Kỵ Binh Xung Phong",
    description: "Trọng kỵ dồn thành mũi nhọn húc thẳng vào một cánh. Sát thương khủng khiếp ở giai đoạn Giao Phong, nhưng vô dụng trước rừng giáo.",
    flavor: "Mặt đất rung lên trước khi ai kịp nhìn thấy họ.",
    condition: (side) => troopMeta(side.troopType).class === "kỵ" && side.training >= 60,
    baseDamageMod: 1.8, baseDefenseMod: 0.85, moraleDamage: 14,
    advantageAgainst: ["mua_mui_ten", "nghi_binh"], disadvantageAgainst: ["doi_hinh_vong_tron", "phong_thu_kien_cuong"],
    focusMultiplier: 1.7, fatigueMod: 8, bestPhase: "Giao Phong",
  },
  doi_hinh_vong_tron: {
    id: "doi_hinh_vong_tron", name: "Đội Hình Vòng Tròn",
    description: "Khép quân thành vòng, giáo chĩa ra mọi hướng. Khắc chế hoàn toàn kỵ binh và đòn bọc hậu, nhưng không đuổi ai được.",
    flavor: "Không còn sườn để mà đánh. Chỉ còn một vòng thép quay mặt ra ngoài.",
    condition: (side) => troopMeta(side.troopType).class === "bộ",
    baseDamageMod: 0.5, baseDefenseMod: 1.8, moraleDamage: 1,
    advantageAgainst: ["xung_phong", "dot_kich_suon", "danh_boc_hau"], disadvantageAgainst: ["mua_mui_ten", "dracarys"],
    cohesionMod: 10, fatigueMod: -3,
  },
};

/** Bảng chiến thuật vây thành hiển thị chung khung với chiến thuật dã chiến. */
function siegeTacticAsBattleTactic(id: SiegeTacticId): BattleTactic {
  const t = SIEGE_TACTICS[id];
  return {
    id, name: t.name, description: t.desc, flavor: t.flavor,
    baseDamageMod: 1, baseDefenseMod: 1, moraleDamage: 0,
  };
}

export const SIEGE_ATTACKER_TACTICS: Record<string, BattleTactic> =
  Object.fromEntries(SIEGE_ATTACKER_TACTIC_LIST.map((id) => [id, siegeTacticAsBattleTactic(id)]));
export const SIEGE_DEFENDER_TACTICS: Record<string, BattleTactic> =
  Object.fromEntries(SIEGE_DEFENDER_TACTIC_LIST.map((id) => [id, siegeTacticAsBattleTactic(id)]));

export const ALL_TACTICS: Record<string, BattleTactic> = {
  ...ARMY_TACTICS,
  ...SIEGE_ATTACKER_TACTICS,
  ...SIEGE_DEFENDER_TACTICS,
};

// ── TRẠNG THÁI TRẬN ─────────────────────────────────────────────────────────

export interface InteractiveBattleState {
  player: BattleForce;
  enemy: BattleForce;
  terrain: Terrain;
  weather: WeatherCondition;
  seed: number;
  round: number;
  log: string[];
  finished: boolean;
  winner: "player" | "enemy" | "draw" | null;

  /** giai đoạn hiện tại của trận đánh. */
  phase: BattlePhase;

  /**
   * M23 — TẦNG KHÔNG. Rồng không còn là hệ số nhân mà là thực thể có máu, có
   * hồi chiêu lửa, có độ cao, và có thể bị nỏ bắn rơi.
   */
  air: { player: BattleDragon[]; enemy: BattleDragon[] };
  /** số ụ nỏ bắn rồng mỗi phe mang ra trận. */
  scorpions: { player: number; enemy: number };
  /** kỵ sĩ rơi khỏi lưng rồng trong trận này — engine ghi ngược vào state. */
  ridersLost: string[];

  // ── vây thành ──
  isSiege?: boolean;
  /** trạng thái vây thành đầy đủ (combat/siege.ts). */
  siege?: SiegeState;
  /** tổng máu tường — gương của siege.sections, giữ cho UI/save cũ. */
  wallHp?: number;
  wallMaxHp?: number;
  wallBreached?: boolean;
}

export interface RoundOptions {
  /** cánh quân người chơi dồn mũi nhọn vào. */
  focus?: SectorId;
  /** đoạn tường nhắm vào (vây thành). */
  siegeTarget?: string;
  /** độ cao đàn rồng của người chơi bay vòng này (M23). */
  altitude?: DragonAltitude;
}

// ── DỰNG TRẬN ───────────────────────────────────────────────────────────────

/** Chia quân ra ba cánh: kỵ binh dạt ra hai cánh, bộ binh giữ trung quân. */
function deploySectors(side: BattleSideInput, troops: number, morale: number): Record<SectorId, BattleSector> {
  const comp = side.composition ?? { [side.troopType]: 1 };
  const entries = Object.entries(comp).filter(([, v]) => v > 0);

  // binh chủng cơ động nhất ra cánh, binh chủng giữ hàng vào giữa
  const ranked = entries
    .map(([type, w]) => ({ type, w, mobility: troopMeta(type).speed, hold: troopMeta(type).stats["Phòng Ngự"] }))
    .sort((a, b) => b.mobility - a.mobility);
  const flankType = ranked[0]?.type ?? side.troopType;
  const centerType = [...ranked].sort((a, b) => b.hold - a.hold)[0]?.type ?? side.troopType;

  const share: Record<SectorId, number> = { "Cánh Trái": 0.28, "Trung Quân": 0.44, "Cánh Phải": 0.28 };
  const cohesionBase = clamp(40 + side.training * 0.5, 20, 95);

  const mk = (id: SectorId, type: string): BattleSector => ({
    id,
    troops: Math.max(0, Math.round(troops * share[id])),
    startTroops: Math.max(0, Math.round(troops * share[id])),
    morale,
    cohesion: cohesionBase,
    fatigue: 0,
    routed: false,
    troopType: type,
  });

  return {
    "Cánh Trái": mk("Cánh Trái", flankType),
    "Trung Quân": mk("Trung Quân", centerType),
    "Cánh Phải": mk("Cánh Phải", flankType),
  };
}

function makeForce(side: BattleSideInput): BattleForce {
  // 15% quân giữ lại làm hậu bị — không tướng nào tung hết quân ngay từ đầu
  const reserve = Math.round(side.totalTroops * 0.15);
  const front = side.totalTroops - reserve;
  const cmd = side.general?.command ?? 45;
  return {
    ...side,
    currentTroops: side.totalTroops,
    currentMorale: side.morale,
    sectors: deploySectors(side, front, side.morale),
    reserve,
    commandPoints: clamp(1 + Math.floor(cmd / 30), 1, 4),
  };
}

export function initInteractiveBattle(
  player: BattleSideInput,
  enemy: BattleSideInput,
  terrain: Terrain = "Đồng Bằng",
  weather: WeatherCondition = "Trời Quang",
  seed: number,
): InteractiveBattleState {
  const p = makeForce(player);
  const e = makeForce(enemy);
  const air = {
    player: (player.dragons ?? []).map((d, i) => makeBattleDragon(d.key ?? `p${i}`, d.dragon)),
    enemy: (enemy.dragons ?? []).map((d, i) => makeBattleDragon(d.key ?? `e${i}`, d.dragon)),
  };
  return {
    air,
    scorpions: { player: player.scorpions ?? 0, enemy: enemy.scorpions ?? 0 },
    ridersLost: [],
    player: p,
    enemy: e,
    terrain,
    weather,
    seed,
    round: 1,
    phase: "Dàn Trận",
    log: [
      "Hai đại quân đã dàn trận, tiếng kèn xung trận vang vọng khắp chiến trường...",
      BATTLE_PHASES["Dàn Trận"].intro,
      `Đội hình ta: ${SECTOR_IDS.map((s) => `${s} ${p.sectors[s].troops} (${p.sectors[s].troopType})`).join(" · ")} · hậu bị ${p.reserve}`,
      `Đội hình địch: ${SECTOR_IDS.map((s) => `${s} ${e.sectors[s].troops}`).join(" · ")} · hậu bị ${e.reserve}`,
    ],
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
  wallMaxHp: number = 3000,
  opts: { sections?: SiegeState["sections"]; supplyDays?: number; civilians?: number } = {},
): InteractiveBattleState {
  const state = initInteractiveBattle(player, enemy, terrain, weather, seed);
  const playerIsAttacker = player.siegeRole === "attacker";
  const atkSide = playerIsAttacker ? player : enemy;
  const defSide = playerIsAttacker ? enemy : player;

  const siegeSide = (s: BattleSideInput) => ({
    name: s.name,
    troops: s.totalTroops,
    morale: s.morale,
    fatigue: 0,
    training: s.training,
    equipment: s.equipment,
    siegeSkill: siegeSkillOf(s.composition ?? { [s.troopType]: 1 }),
    house: s.house,
    general: s.general,
  });

  // Quân công tới nơi đã mang theo thang và vài cỗ máy tháo rời — nhưng máy bắn
  // đá thật sự thì vẫn phải dựng tại chỗ.
  const startEngines = {
    "Thang Mây": clamp(Math.floor(atkSide.totalTroops / 250), 1, 6),
    "Máy Bắn Đá": clamp(Math.floor(atkSide.totalTroops / 500), 0, 3),
    "Xe Húc": atkSide.totalTroops >= 800 ? 1 : 0,
    "Tháp Công Thành": 0,
  } as const;

  state.isSiege = true;
  state.siege = initSiege({
    seed,
    weather,
    attacker: siegeSide(atkSide),
    defender: siegeSide(defSide),
    sections: opts.sections ?? defaultSections(wallMaxHp),
    supplyDays: opts.supplyDays ?? 120,
    civilians: opts.civilians ?? 0,
    engines: { ...startEngines },
    // M23 — rồng hai phe và ụ nỏ bắn rồng đi vào cuộc vây
    air: {
      attacker: (atkSide.dragons ?? []).map((d, i) => makeBattleDragon(d.key ?? `atk${i}`, d.dragon)),
      defender: (defSide.dragons ?? []).map((d, i) => makeBattleDragon(d.key ?? `def${i}`, d.dragon)),
    },
    scorpions: { attacker: atkSide.scorpions ?? 0, defender: defSide.scorpions ?? 0 },
  });
  syncSiegeMirror(state);
  state.log = [
    "Quân công thành đã áp sát. Tiếng còi báo động rền vang trên mặt tường...",
    `Tường thành: ${state.siege.sections.map((s) => `${s.name} ${s.maxHp}`).join(" · ")}`,
    `Kho lương phe thủ đủ cho ${Math.round(state.siege.supplyDays)} ngày.`,
  ];
  return state;
}

function syncSiegeMirror(state: InteractiveBattleState): void {
  if (!state.siege) return;
  state.wallHp = totalWallHp(state.siege);
  state.wallMaxHp = totalWallMaxHp(state.siege);
  state.wallBreached = anyBreached(state.siege);
}

// ── SỨC CHIẾN CỦA MỘT CÁNH ──────────────────────────────────────────────────

function sectorPower(
  sec: BattleSector,
  side: BattleForce,
  phase: BattlePhase,
  terrain: Terrain,
  weather: WeatherCondition,
): number {
  if (sec.routed || sec.troops <= 0) return 0;
  const meta = troopMeta(sec.troopType);
  const phaseDef = BATTLE_PHASES[phase];

  const quality = 0.4 + (side.training + side.equipment) / 400;
  const cohesionF = 0.55 + sec.cohesion / 220;
  const fatigueF = Math.max(0.4, 1 - sec.fatigue / 250);
  const moraleF = 0.6 + sec.morale / 250;
  // chỉ số binh chủng đúng với giai đoạn: cung thủ toả sáng lúc xạ kích,
  // kỵ binh lúc xung phong và truy kích, bộ binh lì lúc hỗn chiến
  const statF = 0.55 + meta.stats[phaseDef.keyStat] / 120;
  const armourF = 0.85 + meta.stats["Giáp Trụ"] / 400;
  const terrainF = terrainMultiplier(sec.troopType, terrain, side.house);
  const matchupF = clamp(side.matchupFactor ?? 1, 0.7, 1.4);

  let weatherF = 1;
  if (meta.class === "cung" && (weather === "Mưa Lớn" || weather === "Bão Tuyết")) weatherF = 0.5;
  if (meta.class === "kỵ" && weather === "Sương Mù") weatherF = 0.8;

  let dragonF = 1;
  if (side.dragon?.isRidden) dragonF = 1 + clamp(side.dragon.power, 0, 4) * 0.12;

  return sec.troops * quality * cohesionF * fatigueF * moraleF * statF * armourF * terrainF * matchupF * weatherF * dragonF;
}

function generalMultiplier(side: BattleForce): number {
  const g = side.general;
  if (!g) return 0.92;
  return clamp(1 + (g.command * 0.6 + g.cunning * 0.4) / 220, 0.9, 1.45);
}

/** Cánh bên cạnh đã vỡ → cánh này hở sườn, chịu đòn nặng hơn hẳn. */
function flankExposure(sectors: Record<SectorId, BattleSector>, id: SectorId): number {
  const neighbours: SectorId[] =
    id === "Trung Quân" ? ["Cánh Trái", "Cánh Phải"] : ["Trung Quân"];
  const broken = neighbours.filter((n) => sectors[n].routed).length;
  return 1 + broken * 0.45;
}

const CASUALTY_SCALE = 0.085;

// ── MỘT VÒNG DÃ CHIẾN ───────────────────────────────────────────────────────

function playFieldRound(
  state: InteractiveBattleState,
  playerTacticId: TacticId,
  enemyTacticId: TacticId,
  opts: RoundOptions,
): InteractiveBattleState {
  const next: InteractiveBattleState = {
    ...state,
    player: { ...state.player, sectors: { ...state.player.sectors } },
    enemy: { ...state.enemy, sectors: { ...state.enemy.sectors } },
    log: [...state.log],
  };
  for (const id of SECTOR_IDS) {
    next.player.sectors[id] = { ...next.player.sectors[id] };
    next.enemy.sectors[id] = { ...next.enemy.sectors[id] };
  }

  const rng = makeRng(state.seed + state.round * 7919);
  const pTac = ALL_TACTICS[playerTacticId] ?? ARMY_TACTICS["tan_cong_tong_luc"];
  const eTac = ALL_TACTICS[enemyTacticId] ?? ARMY_TACTICS["tan_cong_tong_luc"];
  const phaseDef = BATTLE_PHASES[next.phase];

  next.log.push(`\n** Vòng ${next.round} — ${next.phase} **`);
  next.log.push(`Phe ta sử dụng [${pTac.name}] - Địch sử dụng [${eTac.name}]`);

  // ── Điểm Chỉ Huy ──
  const spend = (force: BattleForce, tac: BattleTactic, who: string): boolean => {
    const cost = tac.commandCost ?? 0;
    if (cost <= 0) return true;
    if (force.commandPoints < cost) {
      next.log.push(`${who} không còn đủ Điểm Chỉ Huy để ra mệnh lệnh [${tac.name}] — quân sĩ làm theo lệnh cũ.`);
      return false;
    }
    force.commandPoints -= cost;
    return true;
  };
  const pOk = spend(next.player, pTac, "Phe ta");
  const eOk = spend(next.enemy, eTac, "Địch");
  const pEff = pOk ? pTac : ARMY_TACTICS["phong_thu_kien_cuong"];
  const eEff = eOk ? eTac : ARMY_TACTICS["phong_thu_kien_cuong"];

  // ── khắc chế ──
  let pAdv = 1.0;
  let eAdv = 1.0;
  if (pEff.advantageAgainst?.includes(eEff.id)) { pAdv = 1.5; next.log.push("Phe ta khắc chế chiến thuật của địch!"); }
  if (eEff.advantageAgainst?.includes(pEff.id)) { eAdv = 1.5; next.log.push("Địch khắc chế chiến thuật của phe ta!"); }
  if (pEff.disadvantageAgainst?.includes(eEff.id)) pAdv *= 0.75;
  if (eEff.disadvantageAgainst?.includes(pEff.id)) eAdv *= 0.75;
  if (pEff.bestPhase === next.phase) { pAdv *= 1.35; next.log.push(`[${pEff.name}] phát huy đúng lúc ở giai đoạn ${next.phase}.`); }
  if (eEff.bestPhase === next.phase) eAdv *= 1.35;

  // ── tung hậu bị ──
  const commitReserve = (force: BattleForce, tac: BattleTactic, focus: SectorId, who: string) => {
    if (tac.id !== "tung_hau_bi" || force.reserve <= 0) return;
    const target = force.sectors[focus].routed
      ? SECTOR_IDS.find((s) => !force.sectors[s].routed) ?? focus
      : focus;
    force.sectors[target] = {
      ...force.sectors[target],
      troops: force.sectors[target].troops + force.reserve,
      cohesion: clamp(force.sectors[target].cohesion + 20, 0, 100),
      morale: clamp(force.sectors[target].morale + 12, 0, 100),
      fatigue: Math.max(0, force.sectors[target].fatigue - 15),
    };
    next.log.push(`${who} tung ${force.reserve} quân hậu bị vào ${target} — hàng ngũ được vá lại.`);
    force.reserve = 0;
    for (const id of SECTOR_IDS) {
      force.sectors[id] = { ...force.sectors[id], morale: clamp(force.sectors[id].morale + 6, 0, 100) };
    }
  };
  const pFocus = opts.focus ?? "Trung Quân";
  const eFocus = SECTOR_IDS[Math.floor(rng() * 3)];
  commitReserve(next.player, pEff, pFocus, "Phe ta");
  commitReserve(next.enemy, eEff, eFocus, "Địch");

  // ── rút lui ──
  const pRetreat = pEff.id === "rut_lui";
  const eRetreat = eEff.id === "rut_lui";

  // ══ TẦNG KHÔNG (M23) ══════════════════════════════════════════════════════
  // Rồng đánh TRƯỚC bộ binh: chúng bay nhanh hơn, và nếu cả hai phe có rồng thì
  // chúng bận đánh nhau chứ không rảnh đốt hàng quân bên dưới.
  next.air = { player: next.air.player.map((d) => ({ ...d })), enemy: next.air.enemy.map((d) => ({ ...d })) };
  next.ridersLost = [...next.ridersLost];
  tickDragons(next.air.player);
  tickDragons(next.air.enemy);

  if (opts.altitude) {
    for (const d of next.air.player) d.altitude = opts.altitude;
  }
  // AI địch: sà thấp khi muốn dứt điểm, bay cao khi ta có nhiều ụ nỏ
  const enemyLow = next.scorpions.player <= 1 || eEff.id === "dracarys" || rng() < 0.4;
  for (const d of next.air.enemy) d.altitude = enemyLow ? "Thấp" : "Cao";

  const pAir = next.air.player.filter(dragonActive);
  const eAir = next.air.enemy.filter(dragonActive);

  if (pAir.length > 0 && eAir.length > 0) {
    const clash = airClash(rng, next.air.player, next.air.enemy);
    next.log.push(...clash.log);
  }

  /** một phe cho rồng khạc lửa xuống cánh quân đối diện. */
  const breatheOn = (
    dragons: BattleDragon[], foe: BattleForce, focusSector: SectorId, who: string, committed: boolean,
  ): number => {
    let burned = 0;
    for (const d of dragons) {
      if (!dragonActive(d)) continue;
      // không bấm Dracarys thì rồng chỉ lượn doạ, thỉnh thoảng mới nhả lửa
      if (!committed && (d.breathCooldown > 0 || rng() > 0.35)) continue;
      const strike = dragonBreath(rng, d, next.weather);
      next.log.push(`${who}: ${strike.log}`);
      if (strike.fizzled || strike.damage <= 0) continue;
      const target = foe.sectors[focusSector].routed
        ? SECTOR_IDS.find((x) => !foe.sectors[x].routed) ?? focusSector
        : focusSector;
      const sec = foe.sectors[target];
      const killed = Math.min(sec.troops, strike.damage);
      sec.troops -= killed;
      burned += killed;
      sec.morale = clamp(sec.morale - strike.moraleShock, 0, 100);
      sec.cohesion = clamp(sec.cohesion - strike.moraleShock * 0.6, 0, 100);
      for (const other of SECTOR_IDS) {
        if (other !== target) foe.sectors[other].morale = clamp(foe.sectors[other].morale - 6, 0, 100);
      }
    }
    return burned;
  };

  const burnedByPlayer = breatheOn(next.air.player, next.enemy, SECTOR_FACING[pFocus], "Rồng ta", pEff.id === "dracarys");
  const burnedByEnemy = breatheOn(next.air.enemy, next.player, eFocus, "Rồng địch", eEff.id === "dracarys");

  // ── nỏ bắn rồng trả lời từ mặt đất ──
  if (next.scorpions.enemy > 0 && pAir.length > 0) {
    const volley = scorpionVolley(rng, next.scorpions.enemy, next.air.player, next.weather);
    next.log.push(...volley.log.map((l) => `[Nỏ địch] ${l}`));
    next.ridersLost.push(...volley.ridersLost);
  }
  if (next.scorpions.player > 0 && eAir.length > 0) {
    const volley = scorpionVolley(rng, next.scorpions.player, next.air.enemy, next.weather);
    next.log.push(...volley.log.map((l) => `[Nỏ ta] ${l}`));
  }

  // ── đánh nhau theo từng cặp cánh ──
  const pGeneral = generalMultiplier(next.player);
  const eGeneral = generalMultiplier(next.enemy);
  const pRoll = 0.9 + rng() * 0.2;
  const eRoll = 0.9 + rng() * 0.2;

  let pLossTotal = burnedByEnemy;
  let eLossTotal = burnedByPlayer;

  for (const id of SECTOR_IDS) {
    const pSec = next.player.sectors[id];
    const eSec = next.enemy.sectors[SECTOR_FACING[id]];

    const pPow = sectorPower(pSec, next.player, next.phase, next.terrain, next.weather) * pGeneral;
    const ePow = sectorPower(eSec, next.enemy, next.phase, next.terrain, next.weather) * eGeneral;

    const pFocusMul = id === pFocus ? (pEff.focusMultiplier ?? 1) : 1;
    const eFocusMul = SECTOR_FACING[id] === eFocus ? (eEff.focusMultiplier ?? 1) : 1;

    let pDmg = pPow * pEff.baseDamageMod * pAdv * pFocusMul / eEff.baseDefenseMod * pRoll * phaseDef.damage * CASUALTY_SCALE;
    let eDmg = ePow * eEff.baseDamageMod * eAdv * eFocusMul / pEff.baseDefenseMod * eRoll * phaseDef.damage * CASUALTY_SCALE;

    pDmg *= flankExposure(next.enemy.sectors, SECTOR_FACING[id]);
    eDmg *= flankExposure(next.player.sectors, id);

    if (pRetreat) pDmg = 0;
    if (eRetreat) eDmg = 0;
    if (pRetreat) eDmg *= 1.5;
    if (eRetreat) pDmg *= 1.5;

    const eLoss = Math.min(eSec.troops, Math.round(pDmg));
    const pLoss = Math.min(pSec.troops, Math.round(eDmg));
    eSec.troops -= eLoss;
    pSec.troops -= pLoss;
    eLossTotal += eLoss;
    pLossTotal += pLoss;

    // sĩ khí, gắn kết, mệt mỏi của riêng cánh này
    const hurt = (sec: BattleSector, loss: number, foeTac: BattleTactic, ownTac: BattleTactic) => {
      const pct = loss / Math.max(1, sec.startTroops);
      sec.morale = clamp(sec.morale - (foeTac.moraleDamage * 0.6 + pct * 140), 0, 100);
      sec.cohesion = clamp(sec.cohesion - pct * 120 + (ownTac.cohesionMod ?? 0), 0, 100);
      sec.fatigue = clamp(sec.fatigue + phaseDef.fatigue + (ownTac.fatigueMod ?? 0), 0, 100);
    };
    hurt(pSec, pLoss, eEff, pEff);
    hurt(eSec, eLoss, pEff, eEff);

    // ── vỡ cánh ──
    const breakCheck = (sec: BattleSector, force: BattleForce, who: string) => {
      if (sec.routed || sec.troops <= 0) return;
      const fearless = troopMeta(sec.troopType).fearless;
      if (fearless) return;
      if (sec.morale <= 12 || (sec.cohesion <= 8 && sec.troops < sec.startTroops * 0.45)) {
        sec.routed = true;
        const fled = Math.round(sec.troops * 0.3);
        sec.troops -= fled;
        next.log.push(`💀 ${who} — ${sec.id} VỠ TRẬN! ${fled} lính vứt giáo bỏ chạy, sườn cánh bên cạnh phơi ra.`);
        for (const other of SECTOR_IDS) {
          if (other !== sec.id) force.sectors[other].morale = clamp(force.sectors[other].morale - 14, 0, 100);
        }
      }
    };
    breakCheck(pSec, next.player, "Phe ta");
    breakCheck(eSec, next.enemy, "Địch");
  }

  // ── tổng hợp ──
  const sum = (f: BattleForce) => SECTOR_IDS.reduce((s, id) => s + Math.max(0, f.sectors[id].troops), 0) + f.reserve;
  const avgMorale = (f: BattleForce) => {
    const live = SECTOR_IDS.filter((id) => !f.sectors[id].routed);
    if (live.length === 0) return 0;
    return live.reduce((s, id) => s + f.sectors[id].morale, 0) / live.length;
  };
  next.player.currentTroops = sum(next.player);
  next.enemy.currentTroops = sum(next.enemy);
  next.player.currentMorale = Math.round(avgMorale(next.player));
  next.enemy.currentMorale = Math.round(avgMorale(next.enemy));

  if (pLossTotal > 0) next.log.push(`Phe ta mất ${pLossTotal} quân.`);
  if (eLossTotal > 0) next.log.push(`Địch mất ${eLossTotal} quân.`);
  next.log.push(
    `Đội hình ta: ${SECTOR_IDS.map((s) => `${s} ${next.player.sectors[s].troops}${next.player.sectors[s].routed ? " (VỠ)" : ""}`).join(" · ")}`,
  );

  // ── sự kiện chiến trường ──
  applyFieldEvent(next, rng);

  // ── kết thúc ──
  const routed = (f: BattleForce) => SECTOR_IDS.filter((id) => f.sectors[id].routed).length;
  if (pRetreat) {
    next.finished = true;
    next.winner = "enemy";
    next.log.push("Phe ta quyết định rút lui để bảo toàn lực lượng.");
  } else if (eRetreat) {
    next.finished = true;
    next.winner = "player";
    next.log.push("Địch quân vỡ trận và tìm cách rút lui!");
  } else if (next.player.currentTroops <= 0 || routed(next.player) >= 2 || next.player.currentMorale <= 0) {
    next.finished = true;
    next.winner = "enemy";
    next.phase = "Truy Kích";
    next.log.push("Phe ta đã hoàn toàn tan vỡ! Địch tràn lên truy kích.");
  } else if (next.enemy.currentTroops <= 0 || routed(next.enemy) >= 2 || next.enemy.currentMorale <= 0) {
    next.finished = true;
    next.winner = "player";
    next.phase = "Truy Kích";
    next.log.push("Địch quân đã sụp đổ hoàn toàn! Quân ta thừa thắng truy kích.");
  }

  // thương vong truy kích: phần lớn xác nằm lại là ở đây
  if (next.finished && next.winner && next.winner !== "draw" && !pRetreat && !eRetreat) {
    const loser = next.winner === "player" ? next.enemy : next.player;
    const chased = Math.round(loser.currentTroops * (0.25 + rng() * 0.2));
    loser.currentTroops = Math.max(0, loser.currentTroops - chased);
    for (const id of SECTOR_IDS) {
      loser.sectors[id].troops = Math.max(0, Math.round(loser.sectors[id].troops * 0.65));
    }
    next.log.push(`Truy kích: thêm ${chased} quân bên bại bị bắt hoặc chém trên đường tháo chạy.`);
  }

  // ── sang giai đoạn mới ──
  if (!next.finished) {
    const order: BattlePhase[] = ["Dàn Trận", "Xạ Kích", "Giao Phong", "Hỗn Chiến"];
    const idx = order.indexOf(next.phase);
    if (idx >= 0 && idx < order.length - 1) {
      next.phase = order[idx + 1];
      next.log.push(`— Chuyển sang giai đoạn ${next.phase}: ${BATTLE_PHASES[next.phase].intro}`);
    }
  }

  next.round++;
  return next;
}

// ── SỰ KIỆN CHIẾN TRƯỜNG ────────────────────────────────────────────────────

interface FieldEvent {
  id: string;
  weight: number;
  when: (s: InteractiveBattleState) => boolean;
  apply: (s: InteractiveBattleState, rng: RNG) => string;
}

const FIELD_EVENTS: FieldEvent[] = [
  {
    id: "tuong-trung-ten", weight: 2,
    when: (s) => !!s.enemy.general && s.round >= 2,
    apply: (s) => {
      for (const id of SECTOR_IDS) s.enemy.sectors[id].morale = clamp(s.enemy.sectors[id].morale - 18, 0, 100);
      return `[BIẾN CỐ] ${s.enemy.general!.name} trúng tên lạc và được khiêng khỏi trận — cờ soái địch chao đảo.`;
    },
  },
  {
    id: "ky-binh-sa-lay", weight: 2,
    when: (s) => s.terrain === "Đầm Lầy" || s.terrain === "Sông/Lối Vượt Sông" || s.weather === "Mưa Lớn",
    apply: (s) => {
      const target = SECTOR_IDS.find((id) => troopMeta(s.player.sectors[id].troopType).class === "kỵ");
      if (!target) return "[BIẾN CỐ] Đất nhão tới mức cả hai bên phải chậm lại, trận đánh giậm chân tại chỗ.";
      s.player.sectors[target].fatigue = clamp(s.player.sectors[target].fatigue + 25, 0, 100);
      s.player.sectors[target].cohesion = clamp(s.player.sectors[target].cohesion - 18, 0, 100);
      return `[BIẾN CỐ] Kỵ binh ${target} sa vào vũng lầy, ngựa chìm tới bụng — cả cánh rối loạn.`;
    },
  },
  {
    id: "vien-quan", weight: 1,
    when: (s) => s.round >= 4,
    apply: (s, rng) => {
      const forPlayer = rng() < 0.5;
      const force = forPlayer ? s.player : s.enemy;
      const add = Math.round(force.currentTroops * 0.12);
      force.sectors["Trung Quân"].troops += add;
      for (const id of SECTOR_IDS) force.sectors[id].morale = clamp(force.sectors[id].morale + 14, 0, 100);
      return `[VIỆN QUÂN] Cờ hiệu lạ xuất hiện ở rìa chiến trường — ${add} quân tiếp viện nhập vào ${forPlayer ? "phe ta" : "phe địch"}.`;
    },
  },
  {
    id: "chu-hau-doi-co", weight: 1,
    when: (s) => s.round >= 3 && s.enemy.currentMorale < 45,
    apply: (s) => {
      const sec = s.enemy.sectors["Cánh Phải"];
      const defect = Math.round(sec.troops * 0.25);
      sec.troops = Math.max(0, sec.troops - defect);
      sec.cohesion = clamp(sec.cohesion - 25, 0, 100);
      return `[PHẢN TRẮC] Một nhà chư hầu ở cánh phải địch hạ cờ và kéo ${defect} quân rời trận.`;
    },
  },
  {
    id: "mat-troi-choi", weight: 2,
    when: (s) => s.weather === "Trời Quang",
    apply: (s) => {
      const side = s.enemy;
      for (const id of SECTOR_IDS) side.sectors[id].cohesion = clamp(side.sectors[id].cohesion - 8, 0, 100);
      return "[ĐỊA LỢI] Mặt trời chếch xuống đúng hướng địch — cả hàng quân phải nheo mắt mà đánh.";
    },
  },
  {
    id: "co-soai-do", weight: 1,
    when: (s) => s.round >= 3,
    apply: (s, rng) => {
      const forPlayer = rng() < 0.5;
      const force = forPlayer ? s.player : s.enemy;
      for (const id of SECTOR_IDS) force.sectors[id].morale = clamp(force.sectors[id].morale - 16, 0, 100);
      return `[BIẾN CỐ] Lá cờ soái ${forPlayer ? "phe ta" : "phe địch"} đổ xuống. Tin đồn chủ tướng đã chết lan đi nhanh hơn sự thật.`;
    },
  },
  {
    id: "hang-ngu-siet-lai", weight: 2,
    when: (s) => s.round >= 2,
    apply: (s, rng) => {
      const forPlayer = rng() < 0.5;
      const force = forPlayer ? s.player : s.enemy;
      const sec = SECTOR_IDS[Math.floor(rng() * 3)];
      force.sectors[sec].cohesion = clamp(force.sectors[sec].cohesion + 18, 0, 100);
      force.sectors[sec].morale = clamp(force.sectors[sec].morale + 10, 0, 100);
      return `[KHOẢNH KHẮC] Một hiệp sĩ vô danh giương cờ nhà giữa ${sec} ${forPlayer ? "phe ta" : "phe địch"} — hàng ngũ siết lại quanh anh ta.`;
    },
  },
];

function applyFieldEvent(state: InteractiveBattleState, rng: RNG): void {
  if (rng() > 0.28) return;
  const pool = FIELD_EVENTS.filter((e) => e.when(state));
  if (pool.length === 0) return;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) {
      state.log.push(e.apply(state, rng));
      return;
    }
  }
}

// ── MỘT VÒNG VÂY THÀNH ──────────────────────────────────────────────────────

function playSiegeRoundWrapper(
  state: InteractiveBattleState,
  playerTacticId: TacticId,
  enemyTacticId: TacticId,
  opts: RoundOptions,
): InteractiveBattleState {
  const siege = state.siege;
  if (!siege) return state;

  const playerIsAttacker = state.player.siegeRole === "attacker";
  const attackerTactic = (playerIsAttacker ? playerTacticId : enemyTacticId) as SiegeAttackerTactic;
  const defenderTactic = (playerIsAttacker ? enemyTacticId : playerTacticId) as SiegeDefenderTactic;

  const nextSiege = playSiegeRound(siege, {
    attacker: SIEGE_ATTACKER_TACTIC_LIST.includes(attackerTactic) ? attackerTactic : "siege_bombard",
    defender: SIEGE_DEFENDER_TACTIC_LIST.includes(defenderTactic) ? defenderTactic : "defend_hold",
    targetSection: opts.siegeTarget,
  });

  const next: InteractiveBattleState = {
    ...state,
    player: { ...state.player },
    enemy: { ...state.enemy },
    siege: nextSiege,
    log: [...state.log, ...nextSiege.log.slice(siege.log.length)],
    round: state.round + 1,
  };

  const atk = nextSiege.attacker;
  const def = nextSiege.defender;
  const pSide = playerIsAttacker ? atk : def;
  const eSide = playerIsAttacker ? def : atk;
  next.player.currentTroops = pSide.troops;
  next.player.currentMorale = Math.round(pSide.morale);
  next.enemy.currentTroops = eSide.troops;
  next.enemy.currentMorale = Math.round(eSide.morale);

  syncSiegeMirror(next);

  if (nextSiege.finished) {
    next.finished = true;
    next.winner =
      nextSiege.winner === null ? "draw"
      : (nextSiege.winner === "attacker") === playerIsAttacker ? "player" : "enemy";
  }
  return next;
}

// ── ĐIỀU PHỐI ───────────────────────────────────────────────────────────────

export function playArmyRound(
  state: InteractiveBattleState,
  playerTacticId: TacticId,
  enemyTacticId: TacticId,
  opts: RoundOptions = {},
): InteractiveBattleState {
  if (state.finished) return state;
  if (state.isSiege && state.siege) return playSiegeRoundWrapper(state, playerTacticId, enemyTacticId, opts);
  return playFieldRound(state, playerTacticId, enemyTacticId, opts);
}

// ── AI ──────────────────────────────────────────────────────────────────────

/** Chiến thuật khả dụng cho một phe lúc này (đủ điều kiện + đủ Điểm Chỉ Huy). */
export function availableTactics(side: BattleSideInput, weather: WeatherCondition, isSiege?: boolean): BattleTactic[] {
  if (isSiege) {
    const pool = side.siegeRole === "attacker" ? SIEGE_ATTACKER_TACTICS : SIEGE_DEFENDER_TACTICS;
    return Object.values(pool);
  }
  const cp = (side as BattleForce).commandPoints;
  return Object.values(ARMY_TACTICS).filter((t) => {
    if (t.condition && !t.condition(side, weather)) return false;
    if (t.commandCost && cp !== undefined && cp < t.commandCost) return false;
    return true;
  });
}

export function autoPickArmyTactic(
  side: BattleSideInput,
  weather: WeatherCondition,
  rng: RNG,
  isSiege?: boolean,
  state?: InteractiveBattleState,
): TacticId {
  if (isSiege) {
    const siege = state?.siege;
    if (siege) {
      return side.siegeRole === "attacker"
        ? autoPickSiegeAttacker(siege, rng)
        : autoPickSiegeDefender(siege, rng, "siege_bombard");
    }
    return side.siegeRole === "attacker" ? "siege_bombard" : "defend_hold";
  }

  const available = availableTactics(side, weather, false);
  if (available.length === 0) return "phong_thu_kien_cuong";

  const dragon = available.find((t) => t.id === "dracarys");
  if (dragon && rng() < 0.5) return dragon.id;

  const force = side as BattleForce;
  // sắp vỡ → tung hậu bị hoặc rút
  if (force.currentMorale !== undefined && force.currentMorale < 25) {
    const reserve = available.find((t) => t.id === "tung_hau_bi");
    if (reserve && force.reserve > 0) return reserve.id;
    if (rng() < 0.45) return "rut_lui";
  }
  // đúng giai đoạn thì ưu tiên chiến thuật hợp giai đoạn
  const phase = state?.phase;
  if (phase) {
    const fit = available.filter((t) => t.bestPhase === phase);
    if (fit.length > 0 && rng() < 0.6) return fit[Math.floor(rng() * fit.length)].id;
  }
  // không dùng rút lui khi chưa nguy
  const pool = available.filter((t) => t.id !== "rut_lui" || rng() < 0.15);
  const list = pool.length > 0 ? pool : available;
  return list[Math.floor(rng() * list.length)].id;
}

/** Tóm tắt trận đánh cho AI kể lại. */
export function describeBattle(s: InteractiveBattleState): string {
  if (s.isSiege && s.siege) {
    return `Vây thành vòng ${s.round}: tường ${Math.round(s.wallHp ?? 0)}/${s.wallMaxHp ?? 0}${s.wallBreached ? " (ĐÃ VỠ)" : ""}`;
  }
  const line = (f: BattleForce, who: string) =>
    `${who}: ${f.currentTroops} quân, sĩ khí ${f.currentMorale}, hậu bị ${f.reserve}, chỉ huy ${f.commandPoints} điểm — ` +
    SECTOR_IDS.map((id) => `${id} ${f.sectors[id].troops}${f.sectors[id].routed ? " VỠ" : ""}`).join(", ");
  return [`Giai đoạn ${s.phase} (vòng ${s.round})`, line(s.player, "Ta"), line(s.enemy, "Địch")].join("\n");
}
