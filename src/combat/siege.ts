/**
 * VÂY THÀNH (M22) — engine riêng cho công thành và thủ thành.
 *
 * Bản trước coi cả toà thành là MỘT thanh máu tên "wallHp": bắn phá thì trừ,
 * về 0 thì vỡ. Không có cổng, không có tháp, không có lương thực, và một cuộc
 * vây thành ba năm của Storm's End rút lại thành bốn lần bấm nút.
 *
 * Bản này mô hình đúng những thứ quyết định một cuộc vây thành thật:
 *
 *   • TƯỜNG CHIA ĐOẠN — cổng, các mặt tường, tháp canh. Mỗi đoạn có máu, độ dày
 *     và trạng thái riêng; phá thủng MỘT đoạn là đủ để tràn vào, nhưng đoạn nào
 *     thì quyết định trận đánh trong thành diễn ra thế nào.
 *   • MÁY CÔNG THÀNH PHẢI DỰNG — không ai kéo máy bắn đá theo suốt đường hành
 *     quân. Vòng đầu phe công gần như không làm gì được ngoài chặt gỗ.
 *   • LƯƠNG THỰC VÀ THỜI GIAN — phe thủ có kho lương tính bằng ngày. Cắt khẩu
 *     phần thì cầm cự lâu hơn nhưng sĩ khí tụt; hết lương là mở cổng. Phần lớn
 *     thành trì Westeros thất thủ vì đói chứ không vì tường vỡ.
 *   • ĐÀO HẦM VÀ PHẢN HẦM — cuộc chiến ngầm dưới chân tường.
 *   • DỊCH BỆNH — trại vây đông người, nước bẩn. Bệnh giết cả hai phe.
 *   • ĐỘT PHÁ RỒI ĐÁNH TRONG THÀNH — vỡ tường mới là nửa đầu.
 *
 * Hàm thuần, tất định theo seed.
 */
import { makeRng, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import type { StatData } from "../mvu/schema";
import type { WeatherCondition } from "./battleResolver";
import { troopMeta } from "../content/westeros/troopTypes";
import {
  dragonBreath, scorpionVolley, airClash, tickDragons, dragonActive, describeAir,
  type BattleDragon,
} from "./dragonBattle";

// ── ĐOẠN TƯỜNG ──────────────────────────────────────────────────────────────

export type SectionKind = "Cổng" | "Tường" | "Tháp";

export interface WallSection {
  id: string;
  name: string;
  kind: SectionKind;
  hp: number;
  maxHp: number;
  breached: boolean;
  /** độ dày: giảm sát thương mỗi lần bị đánh (đá khối chịu đòn khác luỹ gỗ). */
  thickness: number;
  /** tiến độ đào hầm dưới chân đoạn này, 0-100. Đủ 100 là sập. */
  mine: number;
  /** phe thủ đứng được bao nhiêu quân trên đoạn này (ảnh hưởng sát thương trả đũa). */
  garrisonShare: number;
}

export const SECTION_INTRO: Record<SectionKind, string> = {
  "Cổng": "Điểm yếu cố hữu của mọi toà thành: gỗ bọc sắt, có thể húc, có thể đốt, và là nơi rồng luôn nhắm tới. Bù lại thường có cổng lật và hào bảo vệ.",
  "Tường": "Mặt tường dài. Dày nhất, tốn nhiều tháng bắn phá nhất, nhưng cũng là nơi dễ bắc thang và đào hầm nhất.",
  "Tháp": "Tháp canh. Ít máu hơn tường nhưng phá được tháp là phe thủ mất mắt và mất chỗ đặt cung thủ — sát thương trả đũa tụt hẳn.",
};

// ── HAI PHE ─────────────────────────────────────────────────────────────────

export interface SiegeSideState {
  name: string;
  troops: number;
  morale: number;
  /** mệt mỏi 0-100 — trại vây dầm mưa cả tháng thì lính không còn sức leo thang. */
  fatigue: number;
  /** chất lượng quân 0-100 (huấn luyện). */
  training: number;
  equipment: number;
  /** khả năng công thành trung bình của đội hình (0-100, từ TROOP_META). */
  siegeSkill: number;
  house?: string;
  general?: { name: string; command: number; cunning: number; traits: string[] };
}

// ── MÁY CÔNG THÀNH ──────────────────────────────────────────────────────────

export type SiegeEngineId = "Máy Bắn Đá" | "Xe Húc" | "Tháp Công Thành" | "Thang Mây";

export interface SiegeEngineDef {
  id: SiegeEngineId;
  desc: string;
  /** số ngày-công để dựng một cỗ (chia cho số quân công thành). */
  buildCost: number;
  /** sát thương lên tường mỗi cỗ mỗi vòng. */
  wallDamage: number;
  /** cộng vào hiệu quả xung phong (leo tường). */
  assaultBonus: number;
  /** chỉ đánh được đúng loại đoạn này. */
  target?: SectionKind;
}

export const SIEGE_ENGINES: Record<SiegeEngineId, SiegeEngineDef> = {
  "Máy Bắn Đá": {
    id: "Máy Bắn Đá", buildCost: 60, wallDamage: 145, assaultBonus: 0,
    desc: "Trebuchet: ném đá nặng nửa tấn theo đường vòng cung. Vũ khí phá tường thật sự — nhưng dựng mất hàng tuần và cần thợ mộc giỏi.",
  },
  "Xe Húc": {
    id: "Xe Húc", buildCost: 30, wallDamage: 240, assaultBonus: 0, target: "Cổng",
    desc: "Thân cây bọc đầu sắt dưới mái che da ướt. Chỉ húc được cổng, nhưng húc cổng thì không gì nhanh bằng.",
  },
  "Tháp Công Thành": {
    id: "Tháp Công Thành", buildCost: 90, wallDamage: 0, assaultBonus: 0.55,
    desc: "Tháp gỗ cao ngang tường, đẩy sát vào rồi hạ cầu. Đưa lính lên mặt tường mà không phải leo thang — cách ít đổ máu nhất để chiếm tường, nếu nó không bị đốt trên đường tới.",
  },
  "Thang Mây": {
    id: "Thang Mây", buildCost: 8, wallDamage: 0, assaultBonus: 0.2,
    desc: "Thang dài. Rẻ, dựng trong một buổi, và là cách chết nhanh nhất được biết đến ở Westeros.",
  },
};

// ── CHIẾN THUẬT ─────────────────────────────────────────────────────────────

export type SiegeAttackerTactic =
  | "siege_build" | "siege_bombard" | "siege_ram" | "siege_tunnel"
  | "siege_assault" | "siege_starve" | "siege_parley" | "siege_dracarys";

export type SiegeDefenderTactic =
  | "defend_hold" | "defend_oil" | "defend_volley" | "defend_sortie"
  | "defend_repair" | "defend_countermine" | "defend_ration" | "defend_signal";

export type SiegeTacticId = SiegeAttackerTactic | SiegeDefenderTactic;

export interface SiegeTacticDef {
  id: SiegeTacticId;
  name: string;
  side: "attacker" | "defender";
  desc: string;
  /** một câu cho AI kể. */
  flavor: string;
  /** số NGÀY một vòng chiến thuật này chiếm — vây thành đo bằng tuần, không phải phút. */
  days: number;
}

export const SIEGE_TACTICS: Record<SiegeTacticId, SiegeTacticDef> = {
  siege_build: {
    id: "siege_build", name: "Chế Tạo Máy", side: "attacker", days: 7,
    desc: "Chặt gỗ, dựng máy bắn đá, đóng thang và xe húc. Không đánh gì cả trong tuần này — nhưng không có máy thì tường không bao giờ vỡ.",
    flavor: "Cả cánh rừng phía nam bị hạ trong sáu ngày; tiếng rìu vọng tới tận mặt tường.",
  },
  siege_bombard: {
    id: "siege_bombard", name: "Bắn Phá", side: "attacker", days: 7,
    desc: "Máy bắn đá dội vào một đoạn tường đã chọn. Sát thương phụ thuộc SỐ MÁY đang có, không phụ thuộc quân số.",
    flavor: "Mỗi tảng đá rơi xuống làm cả mặt đất trong thành rung lên một nhịp.",
  },
  siege_ram: {
    id: "siege_ram", name: "Húc Cổng", side: "attacker", days: 3,
    desc: "Đẩy xe húc vào cổng dưới mưa tên. Nhanh và hiệu quả nhất trên cổng — nhưng đội húc đứng ngay dưới chân tường, chỗ dầu sôi rơi xuống.",
    flavor: "Nhịp húc đều như tiếng tim đập, và mỗi nhịp có người ngã xuống.",
  },
  siege_tunnel: {
    id: "siege_tunnel", name: "Đào Hầm", side: "attacker", days: 10,
    desc: "Đào hầm dưới móng tường, chống bằng cột gỗ rồi đốt. Chậm, gần như không tổn thất, và khi hầm sập thì cả đoạn tường sập theo.",
    flavor: "Dưới lòng đất, trong bóng tối, mấy chục người đang đào về phía móng đá.",
  },
  siege_assault: {
    id: "siege_assault", name: "Xung Phong", side: "attacker", days: 1,
    desc: "Tràn lên tường. Nếu đoạn đã vỡ thì đây là đòn kết liễu; nếu tường còn nguyên thì đây là cách nướng quân nhanh nhất.",
    flavor: "Kèn thúc, thang dựng lên, và làn sóng người đầu tiên chạm chân tường.",
  },
  siege_starve: {
    id: "siege_starve", name: "Bao Vây Bỏ Đói", side: "attacker", days: 30,
    desc: "Cắt mọi đường tiếp tế và chờ. Đốt một tháng lương của phe thủ, hạ sĩ khí trong thành — đổi lại trại vây cũng sinh bệnh và hao sĩ khí.",
    flavor: "Không có gì xảy ra suốt ba mươi ngày. Đó chính là vũ khí.",
  },
  siege_parley: {
    id: "siege_parley", name: "Chiêu Hàng", side: "attacker", days: 2,
    desc: "Cắm cờ, mời chủ thành ra nói chuyện. Thành sắp hết lương hoặc tường sắp sập thì có thể mở cổng — không mất một mũi tên nào.",
    flavor: "Hai kỵ sĩ gặp nhau giữa bãi trống, không ai xuống ngựa.",
  },
  siege_dracarys: {
    id: "siege_dracarys", name: "Dracarys", side: "attacker", days: 1,
    desc: "Lửa rồng. Cổng gỗ và tháp canh bốc cháy trong một lượt bay; tường đá thì không sập nhưng người trên tường thì cháy.",
    flavor: "Harrenhal đã dạy Westeros rằng đá không cháy — nhưng người bên trong đá thì có.",
  },

  defend_hold: {
    id: "defend_hold", name: "Tử Thủ", side: "defender", days: 1,
    desc: "Dồn hết quân lên mặt tường. Sát thương trả đũa cao nhất và giữ được tường lâu nhất, đổi lại quân trên tường hứng trọn đá bắn phá.",
    flavor: "Không ai nói gì. Mọi người chỉ siết chặt tay vào giáo và nhìn xuống.",
  },
  defend_oil: {
    id: "defend_oil", name: "Đổ Dầu Sôi", side: "defender", days: 1,
    desc: "Dầu và nhựa đun sôi dội xuống chân tường. Tàn sát đội xung phong và đội húc cổng — nhưng vô dụng nếu địch không áp sát.",
    flavor: "Tiếng thét từ dưới chân tường không giống bất cứ tiếng nào khác trong chiến tranh.",
  },
  defend_volley: {
    id: "defend_volley", name: "Bắn Trả", side: "defender", days: 1,
    desc: "Cung thủ trên tường và nỏ trong lỗ châu mai nhắm vào đội máy bắn đá. Cách duy nhất phá được máy công thành của địch.",
    flavor: "Từ trên cao bắn xuống, mỗi mũi tên đi xa hơn và ăn sâu hơn.",
  },
  defend_sortie: {
    id: "defend_sortie", name: "Xuất Kích", side: "defender", days: 1,
    desc: "Mở cổng, xông ra đốt máy công thành rồi rút. Rủi ro cực lớn — nhưng phá được máy thì cuộc vây lùi lại hàng tháng.",
    flavor: "Cổng lật kéo lên vừa đủ cho một trăm kỵ sĩ phóng ra trong đêm.",
  },
  defend_repair: {
    id: "defend_repair", name: "Sửa Chữa", side: "defender", days: 3,
    desc: "Vá đá, chèn xà, dựng vách gỗ sau chỗ nứt. Hồi máu cho đoạn tường yếu nhất — nhưng thợ trên tường thì không cầm giáo được.",
    flavor: "Vữa trộn trong đêm, đá kéo lên bằng ròng rọc, và người thì làm việc dưới mưa tên.",
  },
  defend_countermine: {
    id: "defend_countermine", name: "Phản Hầm", side: "defender", days: 7,
    desc: "Đào hầm ngược ra để chặn hầm địch. Cuộc chiến trong bóng tối bằng dao và khói — cách duy nhất ngăn tường bị đánh sập từ dưới.",
    flavor: "Người ta chết dưới đó mà bên trên không ai nghe thấy gì.",
  },
  defend_ration: {
    id: "defend_ration", name: "Cắt Khẩu Phần", side: "defender", days: 7,
    desc: "Chia lại lương thực: kéo dài thời gian cầm cự lên gấp rưỡi, đổi lại sĩ khí quân và dân tụt đều mỗi tuần.",
    flavor: "Nửa ổ bánh một ngày, rồi một phần tư, rồi người ta bắt đầu nhìn về phía chuồng ngựa.",
  },
  defend_signal: {
    id: "defend_signal", name: "Đốt Lửa Hiệu", side: "defender", days: 2,
    desc: "Đốt lửa hiệu, thả quạ cầu viện. Không đánh được ai, nhưng nâng sĩ khí và mở đường cho viện binh tới giải vây.",
    flavor: "Ngọn lửa trên đỉnh tháp cháy suốt đêm, và ai đó ngoài kia sẽ thấy nó.",
  },
};

export const SIEGE_ATTACKER_TACTIC_LIST: SiegeAttackerTactic[] = [
  "siege_build", "siege_bombard", "siege_ram", "siege_tunnel",
  "siege_assault", "siege_starve", "siege_parley", "siege_dracarys",
];
export const SIEGE_DEFENDER_TACTIC_LIST: SiegeDefenderTactic[] = [
  "defend_hold", "defend_oil", "defend_volley", "defend_sortie",
  "defend_repair", "defend_countermine", "defend_ration", "defend_signal",
];

// ── TRẠNG THÁI ──────────────────────────────────────────────────────────────

export type SiegePhase = "Bao Vây" | "Công Phá" | "Đột Phá" | "Đánh Trong Thành" | "Kết Thúc";

export const SIEGE_PHASE_INTRO: Record<SiegePhase, string> = {
  "Bao Vây": "Trại vây vừa dựng. Chưa có máy, chưa có hầm — tuần này quyết định cả cuộc vây sẽ dài bao lâu.",
  "Công Phá": "Máy đã dựng xong và đá bắt đầu bay. Cuộc đọ sức giữa đá và vữa.",
  "Đột Phá": "Một đoạn tường đã thủng. Bây giờ là chuyện ai giữ được cái lỗ đó.",
  "Đánh Trong Thành": "Quân công đã vào trong. Đánh nhau từng con phố, từng sân, từng bậc thang.",
  "Kết Thúc": "Xong.",
};

export type SiegeOutcome = "attacker" | "defender" | null;

export interface SiegeState {
  seed: number;
  round: number;
  /** số ngày đã trôi qua kể từ khi trại vây dựng lên. */
  days: number;
  phase: SiegePhase;
  weather: WeatherCondition;

  attacker: SiegeSideState;
  defender: SiegeSideState;
  sections: WallSection[];

  /** số máy công thành phe công đang có. */
  engines: Record<SiegeEngineId, number>;
  /** công sức đã đổ vào việc dựng máy (ngày-công tích luỹ). */
  buildProgress: number;

  /** kho lương phe thủ, quy ra số NGÀY còn cầm cự được. */
  supplyDays: number;
  rations: "Đầy Đủ" | "Cắt Giảm" | "Đói";
  /** dân thường trong thành — ăn lương và ảnh hưởng sĩ khí. */
  civilians: number;
  /** dịch bệnh trong thành và trong trại vây, 0-100. */
  diseaseInside: number;
  diseaseOutside: number;

  /** tiến độ hầm của phe công / phản hầm của phe thủ, 0-100. */
  sap: number;
  counterSap: number;
  /** đoạn tường đang bị đào. */
  sapTarget: string | null;

  /** phe thủ đã cầu viện thành công chưa. */
  reliefCalled: boolean;
  reliefEta: number;

  // ── M23: TẦNG KHÔNG ──
  /** rồng hai phe. Rồng phe công đốt cổng và tháp; rồng phe thủ đốt máy công thành. */
  air: { attacker: BattleDragon[]; defender: BattleDragon[] };
  /** ụ nỏ bắn rồng — phe thủ có sẵn trên tường, phe công phải kéo theo. */
  scorpions: { attacker: number; defender: number };
  ridersLost: string[];

  log: string[];
  finished: boolean;
  winner: SiegeOutcome;
  /** thành mở cổng đầu hàng thay vì bị đánh chiếm. */
  surrendered: boolean;
}

// ── DỰNG TRẠNG THÁI ─────────────────────────────────────────────────────────

export interface SiegeSetup {
  attacker: SiegeSideState;
  defender: SiegeSideState;
  sections?: WallSection[];
  /** tổng máu tường nếu không truyền sections (chia tự động). */
  wallTotalHp?: number;
  supplyDays?: number;
  civilians?: number;
  engines?: Partial<Record<SiegeEngineId, number>>;
  weather?: WeatherCondition;
  seed: number;
  /** M23 — rồng hai phe và ụ nỏ bắn rồng. */
  air?: { attacker?: BattleDragon[]; defender?: BattleDragon[] };
  scorpions?: { attacker?: number; defender?: number };
}

/** Chia một toà thành thành cổng + 2 mặt tường + tháp canh theo tổng máu. */
export function defaultSections(totalHp: number): WallSection[] {
  const gate = Math.round(totalHp * 0.18);
  const tower = Math.round(totalHp * 0.14);
  const wall = Math.round((totalHp - gate - tower) / 2);
  return [
    { id: "gate", name: "Cổng Chính", kind: "Cổng", hp: gate, maxHp: gate, breached: false, thickness: 6, mine: 0, garrisonShare: 0.25 },
    { id: "wall-n", name: "Tường Bắc", kind: "Tường", hp: wall, maxHp: wall, breached: false, thickness: 14, mine: 0, garrisonShare: 0.28 },
    { id: "wall-s", name: "Tường Nam", kind: "Tường", hp: wall, maxHp: wall, breached: false, thickness: 14, mine: 0, garrisonShare: 0.28 },
    { id: "tower", name: "Tháp Canh", kind: "Tháp", hp: tower, maxHp: tower, breached: false, thickness: 9, mine: 0, garrisonShare: 0.19 },
  ];
}

export function initSiege(setup: SiegeSetup): SiegeState {
  const sections = setup.sections?.length ? setup.sections.map((s) => ({ ...s })) : defaultSections(setup.wallTotalHp ?? 3000);
  return {
    seed: setup.seed,
    round: 1,
    days: 0,
    phase: "Bao Vây",
    weather: setup.weather ?? "Trời Quang",
    attacker: { ...setup.attacker },
    defender: { ...setup.defender },
    sections,
    engines: {
      "Máy Bắn Đá": setup.engines?.["Máy Bắn Đá"] ?? 0,
      "Xe Húc": setup.engines?.["Xe Húc"] ?? 0,
      "Tháp Công Thành": setup.engines?.["Tháp Công Thành"] ?? 0,
      "Thang Mây": setup.engines?.["Thang Mây"] ?? 0,
    },
    buildProgress: 0,
    supplyDays: setup.supplyDays ?? 120,
    rations: "Đầy Đủ",
    civilians: setup.civilians ?? 0,
    diseaseInside: 0,
    diseaseOutside: 0,
    sap: 0,
    counterSap: 0,
    sapTarget: null,
    reliefCalled: false,
    reliefEta: 0,
    air: {
      attacker: (setup.air?.attacker ?? []).map((d) => ({ ...d })),
      defender: (setup.air?.defender ?? []).map((d) => ({ ...d })),
    },
    scorpions: {
      attacker: setup.scorpions?.attacker ?? 0,
      defender: setup.scorpions?.defender ?? 0,
    },
    ridersLost: [],
    log: [],
    finished: false,
    winner: null,
    surrendered: false,
  };
}

/** Tổng máu tường còn lại — tương thích với thanh "wallHp" của bản trước. */
export function totalWallHp(s: SiegeState): number {
  return s.sections.reduce((sum, x) => sum + Math.max(0, x.hp), 0);
}
export function totalWallMaxHp(s: SiegeState): number {
  return s.sections.reduce((sum, x) => sum + x.maxHp, 0);
}
export function anyBreached(s: SiegeState): boolean {
  return s.sections.some((x) => x.breached);
}

// ── HÀNH ĐỘNG ───────────────────────────────────────────────────────────────

export interface SiegeOrders {
  attacker: SiegeAttackerTactic;
  defender: SiegeDefenderTactic;
  /** đoạn tường phe công nhắm vào (bắn phá / húc / đào / xung phong). */
  targetSection?: string;
}

/** Chỉ số công thành trung bình của một phe (0-100) từ thành phần binh chủng. */
export function siegeSkillOf(composition: Record<string, number>): number {
  const entries = Object.entries(composition).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return 25;
  return entries.reduce((s, [t, v]) => s + troopMeta(t).stats["Công Thành"] * v, 0) / total;
}

function pickSection(s: SiegeState, id?: string, prefer?: SectionKind): WallSection {
  const alive = s.sections.filter((x) => !x.breached);
  const pool = alive.length > 0 ? alive : s.sections;
  if (id) {
    const found = pool.find((x) => x.id === id);
    if (found) return found;
  }
  if (prefer) {
    const found = pool.find((x) => x.kind === prefer);
    if (found) return found;
  }
  // mặc định: đoạn yếu nhất — chỉ huy nào cũng nhắm chỗ nứt sẵn
  return pool.reduce((weak, x) => (x.hp / x.maxHp < weak.hp / weak.maxHp ? x : weak), pool[0]);
}

function damageSection(sec: WallSection, raw: number, log: string[]): void {
  if (sec.breached) return;
  const dealt = Math.max(0, raw - sec.thickness * 4);
  if (dealt <= 0) {
    log.push(`Đá dội vào ${sec.name} mà không để lại gì ngoài vết sứt — tường quá dày.`);
    return;
  }
  sec.hp = Math.max(0, sec.hp - dealt);
  if (sec.hp <= 0) {
    sec.breached = true;
    log.push(`⚠️ ${sec.name} ĐÃ VỠ! Một khoảng trống mở ra giữa lớp phòng thủ.`);
  } else {
    log.push(`${sec.name} chịu ${Math.round(dealt)} sát thương — còn ${Math.round(sec.hp)}/${sec.maxHp}.`);
  }
}

/** Sức trả đũa của phe thủ, tuỳ theo còn bao nhiêu mặt tường và bao nhiêu quân. */
function defenderFirepower(s: SiegeState): number {
  const intact = s.sections.filter((x) => !x.breached);
  const share = intact.reduce((sum, x) => sum + x.garrisonShare, 0);
  const fatigueF = 1 - s.defender.fatigue / 200;
  return s.defender.troops * (0.35 + s.defender.training / 200) * Math.max(0.25, share) * fatigueF;
}

const WEATHER_SIEGE: Record<WeatherCondition, { bombard: number; assault: number; disease: number; note: string }> = {
  "Trời Quang": { bombard: 1.0, assault: 1.0, disease: 0, note: "" },
  "Mưa Lớn": { bombard: 0.75, assault: 0.7, disease: 3, note: "Mưa xối làm dây máy bắn đá chùng và thang trơn như mỡ." },
  "Bão Tuyết": { bombard: 0.6, assault: 0.5, disease: 4, note: "Bão tuyết: quân công thành chết cóng nhiều hơn chết vì tên." },
  "Sương Mù": { bombard: 0.7, assault: 1.15, disease: 1, note: "Sương mù che kín đội xung phong tới tận chân tường." },
};

/**
 * Chạy MỘT vòng vây thành. Một vòng không phải một phút mà là số ngày tuỳ theo
 * chiến thuật hai bên chọn — bỏ đói thì một vòng là một tháng, xung phong thì
 * một vòng là một ngày.
 */
export function playSiegeRound(state: SiegeState, orders: SiegeOrders): SiegeState {
  if (state.finished) return state;

  const s: SiegeState = {
    ...state,
    attacker: { ...state.attacker },
    defender: { ...state.defender },
    sections: state.sections.map((x) => ({ ...x })),
    engines: { ...state.engines },
    air: {
      attacker: state.air.attacker.map((d) => ({ ...d })),
      defender: state.air.defender.map((d) => ({ ...d })),
    },
    scorpions: { ...state.scorpions },
    ridersLost: [...state.ridersLost],
    log: [...state.log],
  };
  const rng = makeRng((s.seed ^ (s.round * 0x2545f491)) >>> 0);
  const atk = SIEGE_TACTICS[orders.attacker];
  const def = SIEGE_TACTICS[orders.defender];
  const wx = WEATHER_SIEGE[s.weather] ?? WEATHER_SIEGE["Trời Quang"];

  const days = Math.max(atk.days, def.days);
  s.days += days;

  s.log.push(`\n── Vòng ${s.round} · ngày thứ ${s.days} · ${s.phase} ──`);
  s.log.push(`Phe công: [${atk.name}] · Phe thủ: [${def.name}]`);
  if (wx.note) s.log.push(wx.note);

  let attackerLoss = 0;
  let defenderLoss = 0;

  // ── PHE CÔNG ──
  const target = pickSection(s, orders.targetSection, orders.attacker === "siege_ram" ? "Cổng" : undefined);
  const skillF = 0.6 + s.attacker.siegeSkill / 150;

  switch (orders.attacker) {
    case "siege_build": {
      const workers = s.attacker.troops * skillF * 0.02 * days;
      s.buildProgress += workers;
      const built: string[] = [];
      const order: SiegeEngineId[] = ["Thang Mây", "Xe Húc", "Máy Bắn Đá", "Tháp Công Thành"];
      for (const id of order) {
        const cost = SIEGE_ENGINES[id].buildCost;
        while (s.buildProgress >= cost && (s.engines[id] ?? 0) < 6) {
          s.buildProgress -= cost;
          s.engines[id] = (s.engines[id] ?? 0) + 1;
          built.push(id);
        }
      }
      s.log.push(built.length > 0
        ? `Xưởng trại dựng xong: ${built.join(", ")}.`
        : `Thợ mộc còn đang hạ cây — chưa cỗ máy nào hoàn thành (tiến độ ${Math.round(s.buildProgress)}).`);
      s.attacker.fatigue = clamp(s.attacker.fatigue + 4, 0, 100);
      break;
    }

    case "siege_bombard": {
      const engines = s.engines["Máy Bắn Đá"] ?? 0;
      if (engines <= 0) {
        s.log.push("Không có cỗ máy bắn đá nào — quân công chỉ biết đứng nhìn tường.");
        break;
      }
      const raw = engines * SIEGE_ENGINES["Máy Bắn Đá"].wallDamage * wx.bombard * (0.85 + rng() * 0.3) * (days / 7);
      damageSection(target, raw, s.log);
      // đá rơi trúng cả người trên tường
      defenderLoss += Math.round(engines * 4 * (orders.defender === "defend_hold" ? 1.8 : 1));
      break;
    }

    case "siege_ram": {
      const rams = s.engines["Xe Húc"] ?? 0;
      if (rams <= 0) {
        s.log.push("Chưa đóng được xe húc nào — không ai định lấy vai mà húc cổng sắt.");
        break;
      }
      const gate = pickSection(s, orders.targetSection, "Cổng");
      const raw = rams * SIEGE_ENGINES["Xe Húc"].wallDamage * (0.85 + rng() * 0.3) * (days / 3);
      damageSection(gate, gate.kind === "Cổng" ? raw : raw * 0.3, s.log);
      // đội húc đứng ngay dưới chân tường
      attackerLoss += Math.round(defenderFirepower(s) * 0.05 * (orders.defender === "defend_oil" ? 3.2 : 1));
      break;
    }

    case "siege_tunnel": {
      const dig = (6 + s.attacker.siegeSkill * 0.12) * (days / 10) * (0.8 + rng() * 0.4);
      s.sapTarget = target.id;
      s.sap = clamp(s.sap + dig, 0, 100);
      s.log.push(`Hầm dưới ${target.name} tiến thêm — tiến độ ${Math.round(s.sap)}/100.`);
      if (s.sap >= 100) {
        s.log.push(`💥 Cột chống trong hầm được đốt. Móng ${target.name} sụt xuống!`);
        target.hp = 0;
        target.breached = true;
        s.sap = 0;
        s.counterSap = 0;
        s.sapTarget = null;
      }
      break;
    }

    case "siege_assault": {
      const breachedNow = anyBreached(s);
      const ladders = (s.engines["Thang Mây"] ?? 0) * SIEGE_ENGINES["Thang Mây"].assaultBonus;
      const towers = (s.engines["Tháp Công Thành"] ?? 0) * SIEGE_ENGINES["Tháp Công Thành"].assaultBonus;
      const gearF = 1 + Math.min(1.4, ladders + towers);
      const push = s.attacker.troops * (0.25 + s.attacker.training / 220) * gearF * wx.assault * (0.85 + rng() * 0.3);
      const hold = defenderFirepower(s) * (orders.defender === "defend_hold" ? 2.0 : orders.defender === "defend_oil" ? 1.6 : 1.0);

      if (breachedNow) {
        s.log.push("Quân công dồn vào chỗ tường vỡ — hai bên chen nhau trong một khoảng rộng chưa tới mười bước.");
        attackerLoss += Math.round(hold * 0.22);
        defenderLoss += Math.round(push * 0.16);
        if (push > hold * 1.15) {
          s.phase = "Đánh Trong Thành";
          s.log.push("Phe công giữ được chỗ vỡ và tràn vào trong thành!");
        }
      } else {
        s.log.push("Thang dựng lên tường còn nguyên vẹn — cách nướng quân nhanh nhất trong chiến tranh.");
        attackerLoss += Math.round(hold * 0.55 * (orders.defender === "defend_oil" ? 1.5 : 1));
        defenderLoss += Math.round(push * 0.05);
        // leo được lên mặt tường thì cũng làm hư hại đoạn đó
        damageSection(target, push * 0.15, s.log);
      }
      s.attacker.fatigue = clamp(s.attacker.fatigue + 12, 0, 100);
      s.defender.fatigue = clamp(s.defender.fatigue + 8, 0, 100);
      break;
    }

    case "siege_starve": {
      const eaten = days * (1 + s.civilians / Math.max(1, s.defender.troops * 4));
      s.supplyDays = Math.max(0, s.supplyDays - eaten);
      s.defender.morale = clamp(s.defender.morale - 6, 0, 100);
      s.diseaseInside = clamp(s.diseaseInside + 3 + wx.disease, 0, 100);
      s.diseaseOutside = clamp(s.diseaseOutside + 4 + wx.disease, 0, 100);
      s.attacker.morale = clamp(s.attacker.morale - 3, 0, 100);
      s.log.push(`Vòng vây siết chặt: kho lương trong thành còn ${Math.round(s.supplyDays)} ngày.`);
      break;
    }

    case "siege_parley": {
      // Một toà thành còn nguyên tường, đầy kho và quân chưa nao núng thì KHÔNG
      // bao giờ mở cổng, dù có gieo bao nhiêu lần. Phải có sức ép thật — đói,
      // tường vỡ, dịch bệnh, hoặc sĩ khí đã xuống dưới nửa — mới có cửa nói chuyện.
      const pressure =
        (s.supplyDays < 20 ? 30 : s.supplyDays < 45 ? 18 : s.supplyDays < 75 ? 6 : 0) +
        (anyBreached(s) ? 25 : 0) +
        (s.diseaseInside > 40 ? 15 : 0) +
        Math.max(0, 50 - s.defender.morale) * 0.6;
      const desperation = pressure <= 0 ? 0 : pressure - (s.reliefCalled ? 25 : 0);
      const roll = rng() * 100;
      s.log.push(`Sứ giả tới dưới chân tường. (khát vọng đầu hàng ${Math.round(desperation)} vs gieo ${Math.round(roll)})`);
      if (roll < desperation) {
        s.finished = true;
        s.surrendered = true;
        s.winner = "attacker";
        s.phase = "Kết Thúc";
        s.log.push("Cổng thành mở ra. Chủ thành bước ra trao kiếm — không một mũi tên nào phải bay.");
        return finishSiege(s);
      }
      s.log.push("Câu trả lời từ trên tường ngắn gọn và không lịch sự.");
      break;
    }

    case "siege_dracarys": {
      const flyers = s.air.attacker.filter(dragonActive);
      s.log.push("🔥 Bóng rồng phủ qua mặt tường, và lửa đổ xuống như mưa.");
      // M23: rồng phải SÀ THẤP mới đốt trúng cổng — và đó chính là lúc nỏ bắn
      // rồng trên tường có cửa. Đây là đánh đổi thật, không còn là nút bấm miễn phí.
      for (const d of flyers) d.altitude = "Thấp";
      let burned = 0;
      for (const d of flyers) {
        const strike = dragonBreath(rng, d, s.weather, { vsWall: true });
        s.log.push(strike.log);
        if (strike.fizzled) continue;
        burned += strike.damage;
      }
      // không khai rồng cụ thể thì giữ hành vi cũ (AI chỉ nói "địch có rồng")
      const power = flyers.length > 0 ? burned : 99999;
      for (const sec of s.sections) {
        if (sec.kind === "Cổng" || sec.kind === "Tháp") {
          // gỗ và mái tháp cháy; đá thì không
          sec.hp = Math.max(0, sec.hp - Math.max(sec.maxHp, power));
          if (sec.hp <= 0) sec.breached = true;
        } else {
          sec.hp = Math.max(0, sec.hp - Math.min(sec.maxHp * 0.35, power * 0.25));
          if (sec.hp <= 0) sec.breached = true;
        }
      }
      defenderLoss += Math.round(s.defender.troops * 0.22);
      s.defender.morale = clamp(s.defender.morale - 30, 0, 100);
      s.log.push("Cổng và tháp canh cháy rụi; quân trên tường tan tác.");
      break;
    }
  }

  // ── PHE THỦ ──
  switch (orders.defender) {
    case "defend_hold": {
      if (orders.attacker !== "siege_assault" && orders.attacker !== "siege_ram") {
        s.log.push("Quân thủ đứng chật mặt tường, nhưng địch chưa áp sát — chỉ tổ mỏi chân và hứng đá.");
      }
      s.defender.fatigue = clamp(s.defender.fatigue + 5, 0, 100);
      break;
    }
    case "defend_oil": {
      if (orders.attacker === "siege_assault" || orders.attacker === "siege_ram") {
        s.log.push("Dầu sôi dội xuống chân tường — tiếng thét vọng lên tận vọng lâu.");
      } else {
        s.log.push("Vạc dầu đun suốt ngày mà chẳng có ai dưới chân tường để dội.");
      }
      break;
    }
    case "defend_volley": {
      const shots = defenderFirepower(s) * 0.12 * (s.weather === "Mưa Lớn" || s.weather === "Bão Tuyết" ? 0.4 : 1);
      attackerLoss += Math.round(shots);
      // nhắm vào máy công thành
      if ((s.engines["Máy Bắn Đá"] ?? 0) > 0 && rng() < 0.25) {
        s.engines["Máy Bắn Đá"] = Math.max(0, (s.engines["Máy Bắn Đá"] ?? 0) - 1);
        s.log.push("Một cỗ máy bắn đá trúng tên lửa và bốc cháy!");
      }
      break;
    }
    case "defend_sortie": {
      // Chỉ ĐỘI XUẤT KÍCH ra khỏi cổng, và chỉ phần trại gần cổng kịp phản ứng —
      // một đạo quân vây mười vạn không thể cùng lúc đánh vào trăm kỵ sĩ vừa
      // phóng ra trong đêm. Tính phản đòn theo cả đạo quân thì đội xuất kích
      // "mất" nhiều quân hơn số quân cả toà thành có.
      const party = s.defender.troops * 0.3;
      const strike = party * (0.6 + s.defender.training / 150) * (0.7 + rng() * 0.6);
      const reacting = Math.min(s.attacker.troops * 0.12, party * 3);
      const backlash = reacting * 0.25 * (0.8 + rng() * 0.4);
      attackerLoss += Math.round(strike * 0.35);
      defenderLoss += Math.round(Math.min(party, backlash));
      const burned: SiegeEngineId[] = [];
      for (const id of ["Máy Bắn Đá", "Xe Húc", "Tháp Công Thành"] as SiegeEngineId[]) {
        if ((s.engines[id] ?? 0) > 0 && rng() < 0.4) {
          s.engines[id] = Math.max(0, (s.engines[id] ?? 0) - 1);
          burned.push(id);
        }
      }
      s.log.push(burned.length > 0
        ? `Đội xuất kích đốt được: ${burned.join(", ")} rồi rút vào cổng.`
        : "Đội xuất kích chạm trán vọng gác địch và phải rút về tay không.");
      s.defender.morale = clamp(s.defender.morale + (burned.length > 0 ? 6 : -4), 0, 100);
      break;
    }
    case "defend_repair": {
      const weakest = s.sections
        .filter((x) => !x.breached && x.hp < x.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (weakest) {
        const fix = Math.min(weakest.maxHp - weakest.hp, weakest.maxHp * 0.12 * (days / 3));
        weakest.hp += fix;
        s.log.push(`Thợ đá vá ${weakest.name} (+${Math.round(fix)} — còn ${Math.round(weakest.hp)}/${weakest.maxHp}).`);
      } else {
        // không có gì để vá thì dựng vách chắn sau chỗ đã vỡ
        const broken = s.sections.find((x) => x.breached);
        if (broken) {
          broken.breached = false;
          broken.hp = Math.round(broken.maxHp * 0.15);
          s.log.push(`Phe thủ dựng vách gỗ và đá vụn bịt lại ${broken.name} — tạm thời.`);
        } else {
          s.log.push("Tường còn nguyên vẹn, thợ đá quay ra mài đá cho máy bắn.");
        }
      }
      s.defender.fatigue = clamp(s.defender.fatigue + 6, 0, 100);
      break;
    }
    case "defend_countermine": {
      const dig = (7 + s.defender.training * 0.08) * (days / 7) * (0.8 + rng() * 0.4);
      s.counterSap += dig;
      if (s.sap > 0 && s.counterSap >= s.sap) {
        s.log.push("Hai đường hầm gặp nhau dưới lòng đất. Khói, dao và bóng tối — hầm của địch bị đánh sập.");
        s.sap = 0;
        s.counterSap = 0;
        s.sapTarget = null;
        attackerLoss += Math.round(30 + rng() * 40);
        defenderLoss += Math.round(20 + rng() * 30);
      } else {
        s.log.push(`Phản hầm đào được ${Math.round(s.counterSap)} — vẫn chưa chạm tới hầm địch.`);
      }
      break;
    }
    case "defend_ration": {
      if (s.rations === "Đầy Đủ") s.rations = "Cắt Giảm";
      else s.rations = "Đói";
      s.supplyDays = Math.round(s.supplyDays * (s.rations === "Cắt Giảm" ? 1.5 : 1.35));
      s.defender.morale = clamp(s.defender.morale - (s.rations === "Đói" ? 12 : 6), 0, 100);
      s.log.push(`Khẩu phần hạ xuống mức ${s.rations} — cầm cự thêm được, nhưng người trong thành biết rõ điều đó nghĩa là gì.`);
      break;
    }
    case "defend_signal": {
      s.reliefCalled = true;
      s.reliefEta = Math.max(1, s.reliefEta || Math.round(18 + rng() * 30));
      s.defender.morale = clamp(s.defender.morale + 10, 0, 100);
      s.log.push(`Lửa hiệu cháy trên đỉnh tháp và quạ bay đi. Nếu viện binh tới, còn khoảng ${s.reliefEta} ngày nữa.`);
      break;
    }
  }

  // ══ TẦNG KHÔNG (M23) ══════════════════════════════════════════════════════
  // Rồng phe THỦ đốt trại vây và máy công thành; nỏ bắn rồng trên tường trả lời
  // rồng phe công. Một cuộc vây thành có rồng hai bên là chuyện của bầu trời
  // trước, rồi mới tới chuyện của tường.
  tickDragons(s.air.attacker);
  tickDragons(s.air.defender);
  const atkFlyers = s.air.attacker.filter(dragonActive);
  const defFlyers = s.air.defender.filter(dragonActive);

  if (atkFlyers.length > 0 && defFlyers.length > 0) {
    const clash = airClash(rng, s.air.attacker, s.air.defender);
    s.log.push(...clash.log);
  }

  // rồng giữ thành đốt máy công thành — thứ đắt nhất và dễ cháy nhất của phe công
  for (const d of defFlyers) {
    if (d.breathCooldown > 0) continue;
    d.altitude = "Thấp";
    const strike = dragonBreath(rng, d, s.weather);
    if (strike.fizzled) continue;
    s.log.push(`[Rồng giữ thành] ${strike.log}`);
    attackerLoss += Math.round(strike.damage * 0.6);
    s.attacker.morale = clamp(s.attacker.morale - strike.moraleShock * 0.5, 0, 100);
    for (const id of ["Máy Bắn Đá", "Tháp Công Thành", "Xe Húc"] as SiegeEngineId[]) {
      if ((s.engines[id] ?? 0) > 0 && rng() < 0.5) {
        s.engines[id] = Math.max(0, (s.engines[id] ?? 0) - 1);
        s.log.push(`Lửa rồng thiêu rụi một cỗ ${id}.`);
      }
    }
  }

  // nỏ trên tường bắn rồng phe công
  if (s.scorpions.defender > 0 && atkFlyers.length > 0) {
    const volley = scorpionVolley(rng, s.scorpions.defender, s.air.attacker, s.weather);
    s.log.push(...volley.log.map((l) => `[Nỏ trên tường] ${l}`));
    s.ridersLost.push(...volley.ridersLost);
  }
  // nỏ phe công kéo theo bắn rồng giữ thành
  if (s.scorpions.attacker > 0 && defFlyers.length > 0) {
    const volley = scorpionVolley(rng, s.scorpions.attacker, s.air.defender, s.weather);
    s.log.push(...volley.log.map((l) => `[Nỏ trại vây] ${l}`));
    s.ridersLost.push(...volley.ridersLost);
  }

  // ── HAO MÒN THEO THỜI GIAN ──
  s.supplyDays = Math.max(0, s.supplyDays - days * (s.rations === "Đầy Đủ" ? 1 : s.rations === "Cắt Giảm" ? 0.7 : 0.5));
  if (days >= 7) {
    s.diseaseOutside = clamp(s.diseaseOutside + Math.round(days / 7) * (2 + wx.disease), 0, 100);
    s.diseaseInside = clamp(s.diseaseInside + Math.round(days / 7) * (1 + wx.disease), 0, 100);
  }
  if (s.diseaseOutside > 25) {
    const sick = Math.round(s.attacker.troops * (s.diseaseOutside / 100) * 0.015 * (days / 7));
    attackerLoss += sick;
    if (sick > 0) s.log.push(`Kiết lỵ trong trại vây cướp đi ${sick} quân công.`);
  }
  if (s.diseaseInside > 25) {
    const sick = Math.round(s.defender.troops * (s.diseaseInside / 100) * 0.012 * (days / 7));
    defenderLoss += sick;
    if (sick > 0) s.log.push(`Bệnh dịch trong thành cướp đi ${sick} người giữ tường.`);
  }
  if (s.supplyDays <= 0) {
    s.defender.morale = clamp(s.defender.morale - 18, 0, 100);
    defenderLoss += Math.round(s.defender.troops * 0.04);
    s.log.push("Kho lương cạn sạch. Người ta bắt đầu ăn ngựa, rồi ăn chuột.");
  }

  // ── ÁP THƯƠNG VONG ──
  // Chặn trần theo quân số THẬT trước khi ghi log: không phe nào mất nhiều
  // người hơn số người họ có, và con số kể lại phải là con số đã trừ.
  attackerLoss = Math.round(Math.min(attackerLoss, s.attacker.troops));
  defenderLoss = Math.round(Math.min(defenderLoss, s.defender.troops));
  s.attacker.troops = Math.max(0, s.attacker.troops - attackerLoss);
  s.defender.troops = Math.max(0, s.defender.troops - defenderLoss);
  if (attackerLoss > 0) s.log.push(`Phe công mất ${attackerLoss} quân.`);
  if (defenderLoss > 0) s.log.push(`Phe thủ mất ${defenderLoss} quân.`);

  const atkMoraleHit = attackerLoss / Math.max(1, s.attacker.troops + attackerLoss) * 100;
  const defMoraleHit = defenderLoss / Math.max(1, s.defender.troops + defenderLoss) * 100;
  s.attacker.morale = clamp(s.attacker.morale - atkMoraleHit * 0.6, 0, 100);
  s.defender.morale = clamp(s.defender.morale - defMoraleHit * 0.5, 0, 100);

  // ── SỰ KIỆN ──
  applySiegeEvent(s, rng, days);

  // ── GIAI ĐOẠN ──
  if (s.phase !== "Đánh Trong Thành") {
    if (anyBreached(s)) s.phase = "Đột Phá";
    else if ((s.engines["Máy Bắn Đá"] ?? 0) > 0 || s.sap > 0) s.phase = "Công Phá";
  }

  // ── VIỆN BINH ──
  if (s.reliefCalled && s.reliefEta > 0) {
    s.reliefEta -= days;
    if (s.reliefEta <= 0) {
      s.log.push("🏳️ Cờ hiệu xuất hiện ở đường chân trời phía đông — viện binh đã tới, vòng vây bị phá!");
      s.finished = true;
      s.winner = "defender";
      s.phase = "Kết Thúc";
      return finishSiege(s);
    }
  }

  // ── KẾT THÚC ──
  if (s.defender.troops <= 0 || (s.phase === "Đánh Trong Thành" && s.defender.troops < s.attacker.troops * 0.15)) {
    s.finished = true;
    s.winner = "attacker";
    s.log.push("Đội quân giữ thành cuối cùng bị dồn vào sân trong và buông vũ khí. Thành thất thủ.");
  } else if (s.defender.morale <= 0) {
    s.finished = true;
    s.winner = "attacker";
    s.surrendered = true;
    s.log.push("Quân giữ thành mở cổng từ bên trong — không ai còn muốn chết cho bức tường này nữa.");
  } else if (s.attacker.troops <= 0 || s.attacker.morale <= 0) {
    s.finished = true;
    s.winner = "defender";
    s.log.push("Trại vây rã đám. Quân công nhổ cọc rút về trong đêm.");
  }

  if (s.finished) s.phase = "Kết Thúc";
  s.round++;
  return finishSiege(s);
}

function finishSiege(s: SiegeState): SiegeState {
  return s;
}

// ── SỰ KIỆN VÂY THÀNH ───────────────────────────────────────────────────────

interface SiegeEvent {
  id: string;
  weight: number;
  when: (s: SiegeState) => boolean;
  apply: (s: SiegeState, rng: RNG) => string;
}

const SIEGE_EVENTS: SiegeEvent[] = [
  {
    id: "phan-boi-mo-cong", weight: 2,
    when: (s) => s.defender.morale < 40 && s.supplyDays < 40,
    apply: (s) => {
      const sec = s.sections.find((x) => x.kind === "Cổng");
      if (sec && !sec.breached) {
        sec.hp = 0;
        sec.breached = true;
        return "[PHẢN BỘI] Ai đó trong thành cắt dây cổng lật giữa đêm. Cổng chính mở toang.";
      }
      s.defender.morale = clamp(s.defender.morale - 10, 0, 100);
      return "[PHẢN BỘI] Một toán lính gác bỏ vị trí và trốn qua cổng phụ.";
    },
  },
  {
    id: "kho-luong-chay", weight: 2,
    when: (s) => s.supplyDays > 25,
    apply: (s) => {
      s.supplyDays = Math.round(s.supplyDays * 0.6);
      return `[HOẢ HOẠN] Một kho lương trong thành bốc cháy — chỉ còn ${Math.round(s.supplyDays)} ngày lương.`;
    },
  },
  {
    id: "may-hong", weight: 2,
    when: (s) => (s.engines["Máy Bắn Đá"] ?? 0) > 0,
    apply: (s) => {
      s.engines["Máy Bắn Đá"] = Math.max(0, (s.engines["Máy Bắn Đá"] ?? 0) - 1);
      return "[SỰ CỐ] Cánh tay đòn của một cỗ máy bắn đá gãy đôi khi đang lên dây.";
    },
  },
  {
    id: "gieng-nhiem", weight: 2,
    when: (s) => s.days > 20,
    apply: (s) => {
      s.diseaseInside = clamp(s.diseaseInside + 20, 0, 100);
      return "[DỊCH BỆNH] Xác ngựa chết được ném vào giếng nước — nước trong thành bắt đầu bốc mùi.";
    },
  },
  {
    id: "mua-dam", weight: 3,
    when: () => true,
    apply: (s) => {
      s.attacker.fatigue = clamp(s.attacker.fatigue + 12, 0, 100);
      s.diseaseOutside = clamp(s.diseaseOutside + 8, 0, 100);
      return "[THỜI TIẾT] Mưa dầm một tuần liền. Trại vây ngập bùn, chăn ướt, và ho bắt đầu lan.";
    },
  },
  {
    id: "tiep-te-len", weight: 2,
    when: (s) => s.supplyDays < 60 && !s.sections.every((x) => x.breached),
    apply: (s) => {
      s.supplyDays += 25;
      s.defender.morale = clamp(s.defender.morale + 8, 0, 100);
      return "[TIẾP TẾ] Một đoàn thuyền nhỏ lách qua vòng vây trong đêm, đưa được lương vào thành.";
    },
  },
  {
    id: "tuong-cong-tu-tran", weight: 1,
    when: (s) => !!s.attacker.general,
    apply: (s) => {
      s.attacker.morale = clamp(s.attacker.morale - 22, 0, 100);
      return `[TỔN THẤT] Một mũi nỏ từ lỗ châu mai hạ ${s.attacker.general!.name} ngay giữa trại. Phe công rúng động.`;
    },
  },
  {
    id: "linh-danh-thue-doi-phe", weight: 1,
    when: (s) => s.attacker.morale < 45,
    apply: (s) => {
      const gone = Math.round(s.attacker.troops * 0.08);
      s.attacker.troops = Math.max(0, s.attacker.troops - gone);
      return `[ĐÀO NGŨ] ${gone} lính đánh thuê nhổ trại đi trong đêm — không ai trả lương cho một cuộc vây vô vọng.`;
    },
  },
];

function applySiegeEvent(s: SiegeState, rng: RNG, days: number): void {
  // vòng càng dài thì càng dễ có chuyện xảy ra
  const chance = clamp(0.08 + days * 0.012, 0, 0.55);
  if (rng() > chance) return;
  const pool = SIEGE_EVENTS.filter((e) => e.when(s));
  if (pool.length === 0) return;
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) {
      s.log.push(e.apply(s, rng));
      return;
    }
  }
}

// ── AI PHE ĐỐI DIỆN ─────────────────────────────────────────────────────────

export function autoPickSiegeAttacker(s: SiegeState, rng: RNG): SiegeAttackerTactic {
  if (s.attacker.troops > 0 && anyBreached(s)) return "siege_assault";
  const engines = s.engines["Máy Bắn Đá"] ?? 0;
  const rams = s.engines["Xe Húc"] ?? 0;
  if (engines === 0 && rams === 0) return "siege_build";
  if (s.supplyDays < 25 && rng() < 0.5) return "siege_parley";
  if (s.sap > 40) return "siege_tunnel";
  const roll = rng();
  if (roll < 0.42) return "siege_bombard";
  if (roll < 0.6 && rams > 0) return "siege_ram";
  if (roll < 0.78) return "siege_tunnel";
  return "siege_starve";
}

export function autoPickSiegeDefender(s: SiegeState, rng: RNG, incoming: SiegeAttackerTactic): SiegeDefenderTactic {
  if (incoming === "siege_assault" || incoming === "siege_ram") {
    return rng() < 0.55 ? "defend_oil" : "defend_hold";
  }
  if (incoming === "siege_tunnel" && s.sap > s.counterSap) return "defend_countermine";
  if (s.supplyDays < 40 && s.rations === "Đầy Đủ") return "defend_ration";
  if (!s.reliefCalled && rng() < 0.3) return "defend_signal";
  const weak = s.sections.some((x) => !x.breached && x.hp < x.maxHp * 0.5);
  if (weak && rng() < 0.45) return "defend_repair";
  if ((s.engines["Máy Bắn Đá"] ?? 0) > 1 && rng() < 0.4) return "defend_sortie";
  return rng() < 0.5 ? "defend_volley" : "defend_hold";
}

// ── NỐI VỚI LÃNH ĐỊA ────────────────────────────────────────────────────────

/**
 * Dựng các đoạn tường từ TƯỜNG THẬT mà người chơi đã xây trong lãnh địa
 * (territory/walls.ts) cộng với cấp Lâu Đài. Nếu chưa xây tường nào thì chỉ có
 * bức tường sân trong của lâu đài — và người chơi sẽ hiểu ngay tại sao nên xây.
 */
export function sectionsFromHolding(stat: StatData, territoryId?: string): WallSection[] | null {
  const holdings = stat["Lãnh Địa"] ?? {};
  const holding = territoryId ? holdings[territoryId] : Object.values(holdings)[0];
  if (!holding) return null;

  // "Công Trình" là RECORD tên→công trình, không phải mảng
  const castle = Object.values(holding["Công Trình"] ?? {}).find((b) => b["Loại"] === "Lâu Đài");
  const castleLevel = castle?.["Cấp Độ"] ?? 1;
  const sections: WallSection[] = [];

  const keepHp = 900 + castleLevel * 900;
  sections.push({
    id: "keep", name: `Lâu Đài (cấp ${castleLevel})`, kind: "Tháp",
    hp: keepHp, maxHp: keepHp, breached: false, thickness: 8 + castleLevel * 2, mine: 0, garrisonShare: 0.2,
  });
  sections.push({
    id: "gate", name: "Cổng Chính", kind: "Cổng",
    hp: 500 + castleLevel * 400, maxHp: 500 + castleLevel * 400, breached: false,
    thickness: 5 + castleLevel, mine: 0, garrisonShare: 0.2,
  });

  const lines = (holding["Tường Thành"] ?? []).filter((w: any) => !w["Đang Xây"]);
  for (const w of lines) {
    const level = w["Cấp"] ?? 1;
    const length = w["Chiều Dài"] ?? 50;
    const intact = (w["Nguyên Vẹn"] ?? 100) / 100;
    const material = w["Vật Liệu"] ?? "Đá";
    const perCell = material === "Gỗ" ? 9 : material === "Đá Đen" ? 42 : material === "Đá Khối" ? 30 : 18;
    const thickness = material === "Gỗ" ? 3 : material === "Đá Đen" ? 20 : material === "Đá Khối" ? 16 : 11;
    const maxHp = Math.max(300, Math.round(length * perCell * level));
    sections.push({
      id: w["Mã"] ?? `wall-${sections.length}`,
      name: w["Tên"] ?? "Tường Thành",
      kind: "Tường",
      hp: Math.round(maxHp * intact), maxHp, breached: false,
      thickness: thickness + level, mine: 0, garrisonShare: 0.3,
    });
  }

  // chuẩn hoá tỷ lệ quân trên mỗi đoạn
  const total = sections.reduce((s, x) => s + x.garrisonShare, 0);
  for (const sec of sections) sec.garrisonShare = sec.garrisonShare / total;
  return sections;
}

/** Số ngày kho lương của lãnh địa nuôi được đám người đang cố thủ trong thành. */
export function supplyDaysFromHolding(stat: StatData, mouths: number, territoryId?: string): number {
  const holdings = stat["Lãnh Địa"] ?? {};
  const holding = territoryId ? holdings[territoryId] : Object.values(holdings)[0];
  const food = holding?.["Tài Nguyên"]?.["Lương Thực"] ?? 0;
  if (mouths <= 0) return 365;
  // một người ăn hết ~0.03 đơn vị lương mỗi ngày trong kho lãnh địa
  return clamp(Math.round(food / Math.max(1, mouths * 0.03)), 5, 720);
}

/** Mô tả gọn tình hình vây thành cho AI kể lại. */
export function describeSiege(s: SiegeState): string {
  const walls = s.sections
    .map((x) => `${x.name} ${x.breached ? "ĐÃ VỠ" : `${Math.round((x.hp / x.maxHp) * 100)}%`}`)
    .join(", ");
  const engines = Object.entries(s.engines).filter(([, n]) => n > 0).map(([k, n]) => `${k}×${n}`).join(", ");
  return [
    `Vây thành ngày ${s.days} · ${s.phase}`,
    `Tường: ${walls}`,
    `Phe công ${s.attacker.troops} quân (sĩ khí ${Math.round(s.attacker.morale)}${engines ? `, máy: ${engines}` : ", chưa có máy công thành"})`,
    `Phe thủ ${s.defender.troops} quân (sĩ khí ${Math.round(s.defender.morale)}, lương còn ${Math.round(s.supplyDays)} ngày, khẩu phần ${s.rations})`,
    s.sap > 0 ? `Hầm địch đào được ${Math.round(s.sap)}/100` : "",
    s.diseaseInside > 20 || s.diseaseOutside > 20 ? `Dịch bệnh: trong thành ${Math.round(s.diseaseInside)}, trại vây ${Math.round(s.diseaseOutside)}` : "",
    s.air.attacker.length + s.air.defender.length > 0 ? describeAir(s.air.attacker, s.air.defender) : "",
    s.scorpions.defender > 0 ? `Nỏ bắn rồng trên tường: ${s.scorpions.defender}` : "",
  ].filter(Boolean).join("\n");
}
