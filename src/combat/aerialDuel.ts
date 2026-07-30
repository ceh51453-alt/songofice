/**
 * KHÔNG CHIẾN (M23) — minigame lớn cho kỵ sĩ cưỡi rồng đánh nhau.
 *
 * Vũ Điệu Rồng không được quyết ở dưới đất. Nó được quyết ở trên trời, giữa
 * những con thú to bằng toà nhà và những người ngồi trên lưng chúng. Engine này
 * dựng riêng cho khoảnh khắc đó, và nó KHÔNG phải bản sao của đấu tay đôi:
 *
 *   • NHIỀU PHE, KHÔNG CHỈ HAI. Một trận có thể là 1v1, 2v2, hoặc 1v2v3 —
 *     mỗi phe một mục tiêu riêng, và ai cũng có thể đổi mục tiêu giữa chừng.
 *     Phe yếu thường để hai phe mạnh cắn nhau trước.
 *   • BA TẦNG ĐỘ CAO. Trên cao là chỗ của kẻ chiếm được THẾ TRÊN — bổ nhào từ
 *     đó gần như không tránh được. Sà thấp thì lửa quét trúng mục tiêu dưới đất
 *     nhưng phơi bụng cho mọi con rồng phía trên.
 *   • HAI THỰC THỂ MỖI ĐƠN VỊ. Rồng có máu, có hơi lửa phải nạp; KỴ SĨ ngồi
 *     trên lưng có máu riêng, có thể trúng tên, có thể bị hất khỏi yên. Rồng
 *     mất kỵ sĩ thì hoá hoang; kỵ sĩ mất rồng thì rơi.
 *   • GẮN BÓ (Mức Độ Thuần Hoá) là tài nguyên thật: chiêu càng nguy hiểm càng
 *     đòi con rồng tin người trên lưng nó tới mức nào.
 *
 * Hàm thuần, tất định theo seed.
 */
import { makeRng, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import type { Dragon } from "../mvu/schema";
import { dragonQuality } from "./dragon";
import type { WeatherCondition } from "./battleResolver";

// ── ĐỘ CAO ──────────────────────────────────────────────────────────────────

export type AirLevel = "Tầng Cao" | "Tầng Giữa" | "Tầng Thấp";
export const AIR_LEVELS: AirLevel[] = ["Tầng Cao", "Tầng Giữa", "Tầng Thấp"];

export const AIR_LEVEL_INTRO: Record<AirLevel, string> = {
  "Tầng Cao": "Trên mây, trong nắng chói. Chiếm được tầng này là chiếm THẾ TRÊN: mọi cú bổ nhào xuống đều mạnh gấp bội và rất khó né. Đổi lại, không khí loãng làm rồng mau đuối.",
  "Tầng Giữa": "Tầng quần nhau. Không ai có lợi thế độ cao, mọi thứ quyết bằng bộ cánh và gan người cưỡi.",
  "Tầng Thấp": "Sát ngọn cây và mặt nước. Đốt được mục tiêu dưới đất, có chỗ nấp sau đồi và cột khói — nhưng con rồng nào ở trên cũng nhìn thấy lưng ngươi.",
};

/** Chênh lệch tầng: dương = ta ở trên đối thủ. */
function heightEdge(a: AirLevel, b: AirLevel): number {
  return AIR_LEVELS.indexOf(b) - AIR_LEVELS.indexOf(a);
}

// ── ĐƠN VỊ BAY ──────────────────────────────────────────────────────────────

export interface AerialUnit {
  id: string;
  /** phe — cùng `side` là đồng minh. */
  side: string;
  dragonName: string;
  riderName?: string;
  /** khoá trong bảng "Rồng" của state (để ghi ngược sau trận). */
  dragonKey?: string;

  dragonHp: number;
  dragonMaxHp: number;
  /** sức bền bay — hết thì rồng phải hạ độ cao và không bổ nhào được. */
  stamina: number;
  maxStamina: number;
  /** máu của NGƯỜI trên lưng. Kỵ sĩ chết thì rồng hoá hoang giữa trận. */
  riderHp: number;
  riderMaxHp: number;

  level: AirLevel;
  /** vòng còn phải chờ mới phun lửa tiếp. */
  breathCooldown: number;
  /** mức gắn bó rồng–kỵ sĩ 0-100; chiêu nguy hiểm đòi cao. */
  bond: number;
  /** phẩm chất rồng (combat/dragon.dragonQuality). */
  quality: number;
  size: Dragon["Kích Cỡ"];

  downed: boolean;
  fled: boolean;
  /** kỵ sĩ đã bị hất khỏi yên (rồng vẫn bay nhưng không ai điều khiển). */
  unhorsed: boolean;
  /** id mục tiêu đang bám. */
  target?: string;
  cooldowns: Record<string, number>;
}

export function unitAlive(u: AerialUnit): boolean {
  return !u.downed && !u.fled && u.dragonHp > 0;
}

/** Rồng không còn ai điều khiển thì đánh theo bản năng, yếu và bất trị. */
export function unitControlled(u: AerialUnit): boolean {
  return unitAlive(u) && !u.unhorsed && u.riderHp > 0;
}

const SIZE_HP: Record<Dragon["Kích Cỡ"], number> = {
  "Non": 420,
  "Trưởng Thành": 1000,
  "Khổng Lồ (Balerion-class)": 1800,
};

/** Dựng một đơn vị bay từ con rồng trong state. */
export function makeAerialUnit(opts: {
  id: string;
  side: string;
  dragon: Dragon;
  dragonKey?: string;
  riderName?: string;
  riderHp?: number;
  level?: AirLevel;
}): AerialUnit {
  const d = opts.dragon;
  const maxHp = Math.max(1, d["_HP Tối Đa"] || SIZE_HP[d["Kích Cỡ"]]);
  const rider = opts.riderName ?? d["Kỵ Sĩ"] ?? undefined;
  const stat = d["Chỉ Số"];
  return {
    id: opts.id,
    side: opts.side,
    dragonName: d["Tên"] || opts.id,
    riderName: rider,
    dragonKey: opts.dragonKey,
    dragonHp: Math.min(d["_HP"] || maxHp, maxHp),
    dragonMaxHp: maxHp,
    stamina: 60 + (stat?.["Sức Bay"] ?? 5) * 4,
    maxStamina: 60 + (stat?.["Sức Bay"] ?? 5) * 4,
    riderHp: opts.riderHp ?? (rider ? 100 : 0),
    riderMaxHp: opts.riderHp ?? (rider ? 100 : 0),
    level: opts.level ?? "Tầng Giữa",
    breathCooldown: 0,
    bond: rider ? Math.max(50, d["Mức Độ Thuần Hóa"] ?? 0) : (d["Mức Độ Thuần Hóa"] ?? 0),
    quality: dragonQuality(d),
    size: d["Kích Cỡ"],
    downed: false,
    fled: false,
    unhorsed: !rider,
    cooldowns: {},
  };
}

// ── CHIÊU KHÔNG CHIẾN ───────────────────────────────────────────────────────

export type AerialActor = "Rồng" | "Kỵ Sĩ";
export type AerialKind = "Đòn Lửa" | "Cận Chiến" | "Cơ Động" | "Kỵ Sĩ" | "Hồi Phục";

export interface AerialMove {
  id: string;
  name: string;
  actor: AerialActor;
  kind: AerialKind;
  desc: string;
  flavor: string;
  /** sức bền rồng tiêu tốn. */
  stamina: number;
  /** cần mức gắn bó tối thiểu — rồng chưa tin thì không làm theo. */
  bond?: number;
  /** chỉ dùng được ở các tầng này. */
  levels?: AirLevel[];
  /** cần đang ở CAO HƠN mục tiêu. */
  requiresHigher?: boolean;
  /** số vòng chờ. */
  cooldown?: number;
  /** sát thương nền lên rồng địch. */
  dragonDamage?: number;
  /** sát thương nền lên KỴ SĨ địch (xuyên qua vảy rồng). */
  riderDamage?: number;
  /** cơ hội hất kỵ sĩ khỏi yên. */
  unhorseChance?: number;
  /** đổi tầng: -1 lên cao, +1 xuống thấp. */
  levelShift?: -1 | 1;
  /** dùng hơi lửa (đặt hồi chiêu lửa). */
  usesBreath?: boolean;
  /** hồi sức bền. */
  recover?: number;
  /** hồi máu kỵ sĩ. */
  healRider?: number;
  /** né: cộng vào khả năng tránh đòn vòng này. */
  evade?: number;
  /** kỵ sĩ tự cột dây an toàn — miễn bị hất. */
  secure?: boolean;
  /**
   * Cộng vào khả năng đánh trúng. Đòn quét cả một tầng trời thì không "né" theo
   * nghĩa thông thường được — muốn thoát phải đổi độ cao.
   */
  accuracyBonus?: number;
}

export const AERIAL_MOVES: AerialMove[] = [
  // ── RỒNG: ĐÒN LỬA ──
  {
    id: "phun_lua", name: "Phun Lửa", actor: "Rồng", kind: "Đòn Lửa",
    desc: "Một luồng lửa thẳng vào con rồng trước mặt. Cần nạp lại hai vòng — rồng không phải cái đèn khò.",
    flavor: "Cổ họng nó sáng lên từ bên trong trước khi luồng lửa thoát ra.",
    stamina: 14, dragonDamage: 120, riderDamage: 18, usesBreath: true, cooldown: 2,
  },
  {
    id: "bien_lua", name: "Biển Lửa", actor: "Rồng", kind: "Đòn Lửa",
    desc: "Quét một vòng lửa rộng trúng MỌI đối thủ cùng tầng, kể cả đồng minh đứng sai chỗ. Tốn kinh khủng.",
    flavor: "Không ai nhắm ai cả. Cả một tầng trời biến thành lò.",
    stamina: 30, dragonDamage: 85, riderDamage: 22, usesBreath: true, cooldown: 4, bond: 70,
    accuracyBonus: 12,
  },
  // ── RỒNG: CẬN CHIẾN ──
  {
    id: "bo_nhao", name: "Bổ Nhào", actor: "Rồng", kind: "Cận Chiến",
    desc: "Gập cánh lao thẳng xuống từ trên cao. CHỈ dùng được khi đang ở tầng cao hơn mục tiêu — và khi đó thì gần như không trượt.",
    flavor: "Không có tiếng gầm. Chỉ có tiếng gió rít, mỗi lúc một to.",
    stamina: 22, dragonDamage: 190, requiresHigher: true, unhorseChance: 0.25, cooldown: 1,
  },
  {
    id: "vuot_cao", name: "Vuốt Cào", actor: "Rồng", kind: "Cận Chiến",
    desc: "Vuốt sau móc vào sườn đối thủ khi lướt qua. Rẻ, chắc ăn, không đòi độ cao.",
    flavor: "Bốn đường rách song song mở ra trên lớp vảy.",
    stamina: 10, dragonDamage: 75,
  },
  {
    id: "khoa_co_rong", name: "Khoá Cổ", actor: "Rồng", kind: "Cận Chiến",
    desc: "Ngoạm cổ đối thủ và cùng rơi xoáy. Sát thương khủng khiếp cho CẢ HAI — nước đi của kẻ đã quyết ăn thua đủ.",
    flavor: "Hai con rồng khoá vào nhau thành một khối, xoay tròn và mất độ cao rất nhanh.",
    stamina: 34, dragonDamage: 260, bond: 80, cooldown: 3, levelShift: 1,
  },
  {
    id: "quat_duoi", name: "Quật Đuôi", actor: "Rồng", kind: "Cận Chiến",
    desc: "Cú quật ngang bằng cả chiều dài đuôi. Ít sát thương lên vảy nhưng rất dễ hất người trên lưng bay khỏi yên.",
    flavor: "Cái đuôi đi qua như một cây cột thành đổ.",
    stamina: 16, dragonDamage: 45, unhorseChance: 0.4,
  },
  // ── RỒNG: CƠ ĐỘNG ──
  {
    id: "vut_len", name: "Vút Lên", actor: "Rồng", kind: "Cơ Động",
    desc: "Đập cánh lấy độ cao. Chiếm được tầng trên là chiếm quyền quyết định trận đánh.",
    flavor: "Mỗi nhịp cánh đẩy cả khối thịt ấy lên cao thêm một tầm tên bắn.",
    stamina: 18, levelShift: -1, evade: 2,
  },
  {
    id: "ha_thap", name: "Hạ Thấp", actor: "Rồng", kind: "Cơ Động",
    desc: "Lượn xuống thấp — nấp sau đồi, sau cột khói, và đốt được thứ dưới đất.",
    flavor: "Bóng nó lướt qua ngọn cây, gần tới mức lá cháy sém.",
    stamina: 6, levelShift: 1, evade: 1, recover: 8,
  },
  {
    id: "luon_xoay", name: "Lượn Xoáy", actor: "Rồng", kind: "Cơ Động",
    desc: "Xoáy tròn liên tục để không ai ngắm được. Không đánh ai, nhưng rất khó bị đánh.",
    flavor: "Chân trời quay vòng vòng; người trên lưng chỉ biết bám chặt.",
    stamina: 12, evade: 6, recover: 6,
  },
  {
    id: "lay_hoi_rong", name: "Lượn Nghỉ", actor: "Rồng", kind: "Hồi Phục",
    desc: "Dang cánh cưỡi luồng khí nóng, không đập cánh. Hồi sức bền và nạp lại hơi lửa nhanh hơn.",
    flavor: "Nó ngừng đập cánh và để dòng khí nâng mình lên.",
    stamina: 0, recover: 30, evade: 1,
  },
  // ── KỴ SĨ ──
  {
    id: "ban_no", name: "Bắn Nỏ Yên Ngựa", actor: "Kỵ Sĩ", kind: "Kỵ Sĩ",
    desc: "Kỵ sĩ tự bắn nỏ sang lưng rồng địch. Không xuyên nổi vảy — nhưng người ngồi trên đó thì không có vảy.",
    flavor: "Một mũi nỏ đi ngang giữa hai con rồng, tìm thứ mềm hơn.",
    stamina: 4, riderDamage: 34,
  },
  {
    id: "cot_day", name: "Cột Dây An Toàn", actor: "Kỵ Sĩ", kind: "Kỵ Sĩ",
    desc: "Xích mình vào yên. Không bị hất khỏi lưng nữa — nhưng nếu con rồng rơi thì ngươi rơi theo, không có đường thoát.",
    flavor: "Sợi xích khoá lại đánh cạch một tiếng. Từ giờ hai số phận là một.",
    stamina: 2, secure: true, cooldown: 3,
  },
  {
    id: "vuot_qua", name: "Nhảy Sang Lưng Địch", actor: "Kỵ Sĩ", kind: "Kỵ Sĩ",
    desc: "Chỉ có trong những bài hát: nhảy từ lưng rồng này sang lưng rồng kia để giết kỵ sĩ đối phương bằng dao. Cần hai con rồng đang khoá nhau ở cùng tầng.",
    flavor: "Người ta hát về nó suốt trăm năm, và phần lớn những kẻ thử đều không có ai hát cho.",
    stamina: 20, riderDamage: 90, bond: 85, cooldown: 4, levels: ["Tầng Giữa", "Tầng Thấp"],
  },
  {
    id: "vo_ve", name: "Vỗ Về Rồng", actor: "Kỵ Sĩ", kind: "Hồi Phục",
    desc: "Hét lệnh bằng tiếng Valyria cổ và vỗ vào cổ nó. Trấn tĩnh con thú, hồi sức bền và kéo gắn bó lên.",
    flavor: "Dracarys không phải từ duy nhất chúng hiểu.",
    stamina: 0, recover: 18, healRider: 6,
  },
];

export const MOVES_BY_ID: Record<string, AerialMove> =
  Object.fromEntries(AERIAL_MOVES.map((m) => [m.id, m]));

/** Chiêu dùng được lúc này: đủ sức bền, đủ gắn bó, đúng tầng, hết hồi chiêu. */
export function usableMoves(u: AerialUnit, target?: AerialUnit): AerialMove[] {
  return AERIAL_MOVES.filter((m) => {
    if (m.stamina > u.stamina) return false;
    if ((u.cooldowns[m.id] ?? 0) > 0) return false;
    if (m.bond && u.bond < m.bond) return false;
    if (m.levels && !m.levels.includes(u.level)) return false;
    if (m.actor === "Kỵ Sĩ" && !unitControlled(u)) return false;
    if (m.usesBreath && u.breathCooldown > 0) return false;
    if (m.requiresHigher && (!target || heightEdge(u.level, target.level) <= 0)) return false;
    if (m.levelShift === -1 && u.level === "Tầng Cao") return false;
    if (m.levelShift === 1 && u.level === "Tầng Thấp") return false;
    return true;
  });
}

// ── TRẠNG THÁI TRẬN ─────────────────────────────────────────────────────────

export interface AerialSide {
  id: string;
  name: string;
  /** phe này coi phe nào là địch (rỗng = địch với tất cả). */
  hostileTo?: string[];
}

export interface AerialDuelState {
  seed: number;
  round: number;
  weather: WeatherCondition;
  sides: AerialSide[];
  units: AerialUnit[];
  log: string[];
  finished: boolean;
  /** phe còn đứng vững cuối cùng. */
  winner: string | null;
  /** kỵ sĩ đã chết trong trận. */
  ridersDead: string[];
}

export interface AerialSetup {
  seed: number;
  weather?: WeatherCondition;
  sides: AerialSide[];
  units: AerialUnit[];
}

export function initAerialDuel(setup: AerialSetup): AerialDuelState {
  const sides = setup.sides;
  return {
    seed: setup.seed,
    round: 1,
    weather: setup.weather ?? "Trời Quang",
    sides,
    units: setup.units.map((u) => ({ ...u, cooldowns: { ...u.cooldowns } })),
    finished: false,
    winner: null,
    ridersDead: [],
    log: [
      `Không chiến ${sides.length} phe: ${sides.map((s) => s.name).join(" vs ")}.`,
      ...setup.units.map((u) => `${u.dragonName}${u.riderName ? ` (${u.riderName})` : " (không kỵ sĩ)"} — phe ${u.side}, ${u.level}`),
    ],
  };
}

/** Hai đơn vị có phải là địch của nhau không. */
export function isHostile(state: AerialDuelState, a: AerialUnit, b: AerialUnit): boolean {
  if (a.side === b.side) return false;
  const side = state.sides.find((s) => s.id === a.side);
  if (!side?.hostileTo || side.hostileTo.length === 0) return true; // hỗn chiến: địch với tất cả
  return side.hostileTo.includes(b.side);
}

export function enemiesOf(state: AerialDuelState, u: AerialUnit): AerialUnit[] {
  return state.units.filter((x) => unitAlive(x) && isHostile(state, u, x));
}

// ── MỘT VÒNG ────────────────────────────────────────────────────────────────

export interface AerialAction {
  unitId: string;
  moveId: string;
  targetId?: string;
}

const WEATHER_AIR: Record<WeatherCondition, { fire: number; evade: number; note: string }> = {
  "Trời Quang": { fire: 1, evade: 0, note: "" },
  "Mưa Lớn": { fire: 0.6, evade: 2, note: "Mưa xối làm lửa tắt sớm và cánh nặng nước." },
  "Bão Tuyết": { fire: 0.5, evade: 3, note: "Gió giật từng cơn; giữ được đường bay đã là giỏi." },
  "Sương Mù": { fire: 0.8, evade: 4, note: "Mây mù đặc — nhiều lúc không thấy đối thủ ở đâu." },
};

function shiftLevel(u: AerialUnit, dir: -1 | 1): void {
  const idx = AIR_LEVELS.indexOf(u.level);
  u.level = AIR_LEVELS[clamp(idx + dir, 0, AIR_LEVELS.length - 1)];
}

/** Một đơn vị thực hiện một nước đi. */
function resolveMove(
  rng: RNG,
  state: AerialDuelState,
  actor: AerialUnit,
  move: AerialMove,
  target: AerialUnit | undefined,
  evasion: Map<string, number>,
): void {
  const wx = WEATHER_AIR[state.weather] ?? WEATHER_AIR["Trời Quang"];
  actor.stamina = clamp(actor.stamina - move.stamina, 0, actor.maxStamina);

  // rồng không có kỵ sĩ đánh theo bản năng — yếu và hay bỏ lỡ
  const feral = !unitControlled(actor);
  const skill = actor.quality * (feral ? 0.6 : 1) * (0.65 + actor.bond / 300);

  if (move.recover) {
    actor.stamina = clamp(actor.stamina + move.recover, 0, actor.maxStamina);
    if (move.id === "lay_hoi_rong") actor.breathCooldown = Math.max(0, actor.breathCooldown - 1);
  }
  if (move.healRider && actor.riderHp > 0) {
    actor.riderHp = clamp(actor.riderHp + move.healRider, 0, actor.riderMaxHp);
    actor.bond = clamp(actor.bond + 3, 0, 100);
  }
  if (move.secure) {
    actor.cooldowns["__secured"] = 2;
  }
  if (move.evade) evasion.set(actor.id, (evasion.get(actor.id) ?? 0) + move.evade);
  if (move.levelShift) shiftLevel(actor, move.levelShift);
  if (move.usesBreath) actor.breathCooldown = actor.size === "Non" ? 1 : 2;
  if (move.cooldown) actor.cooldowns[move.id] = move.cooldown;

  const targets: AerialUnit[] = move.id === "bien_lua"
    ? state.units.filter((x) => unitAlive(x) && x.id !== actor.id && x.level === actor.level)
    : target && unitAlive(target) ? [target] : [];

  if (targets.length === 0) {
    if (move.dragonDamage || move.riderDamage) {
      state.log.push(`${actor.dragonName} tung [${move.name}] vào khoảng không — không có ai ở đó.`);
    } else {
      state.log.push(`${actor.dragonName} [${move.name}].`);
    }
    return;
  }

  for (const t of targets) {
    // né: sức bay + chiêu né + thời tiết; thế trên áp đảo mọi thứ khác
    const edge = heightEdge(actor.level, t.level);
    const dodge = (evasion.get(t.id) ?? 0) + wx.evade + (unitControlled(t) ? 2 : 0);
    const accuracy = 10 + skill * 6 + edge * 5 + (move.accuracyBonus ?? 0) - dodge;
    const roll = rng() * 20;
    if (roll > accuracy && !move.requiresHigher) {
      state.log.push(`${actor.dragonName} [${move.name}] → ${t.dragonName}: TRƯỢT (nó lách sang một bên).`);
      continue;
    }

    let dmg = (move.dragonDamage ?? 0) * skill * (0.8 + rng() * 0.4);
    if (move.usesBreath) dmg *= wx.fire;
    if (edge > 0) dmg *= 1 + edge * 0.35;
    // vảy dày chặn bớt
    dmg *= t.size === "Khổng Lồ (Balerion-class)" ? 0.75 : t.size === "Non" ? 1.25 : 1;
    const dragonDmg = Math.round(dmg);

    if (dragonDmg > 0) {
      t.dragonHp = Math.max(0, t.dragonHp - dragonDmg);
      state.log.push(
        `${actor.dragonName} [${move.name}] → ${t.dragonName}: −${dragonDmg} (còn ${t.dragonHp}/${t.dragonMaxHp}).`,
      );
    }

    // sát thương lên NGƯỜI
    if (move.riderDamage && t.riderHp > 0 && !t.unhorsed) {
      const rd = Math.round(move.riderDamage * (0.7 + rng() * 0.6) * (move.usesBreath ? wx.fire : 1));
      t.riderHp = Math.max(0, t.riderHp - rd);
      state.log.push(`  ↳ Kỵ sĩ ${t.riderName} trúng đòn −${rd} (còn ${t.riderHp}).`);
      if (t.riderHp <= 0) {
        state.ridersDead.push(t.riderName!);
        t.unhorsed = true;
        t.bond = Math.max(0, t.bond - 40);
        state.log.push(`  ↳ ${t.riderName} gục trên yên. ${t.dragonName} không còn ai điều khiển — nó bắt đầu đánh theo bản năng.`);
      }
    }

    // hất khỏi yên
    if (move.unhorseChance && unitControlled(t) && (t.cooldowns["__secured"] ?? 0) <= 0) {
      const grip = 0.35 + t.bond / 250;
      if (rng() < move.unhorseChance && rng() > grip) {
        t.unhorsed = true;
        state.log.push(`  ↳ ${t.riderName} bị hất khỏi yên và rơi xuống!`);
        state.ridersDead.push(t.riderName!);
        t.bond = Math.max(0, t.bond - 50);
      }
    }

    // khoá cổ: cả hai cùng rơi
    if (move.id === "khoa_co_rong") {
      const selfDmg = Math.round((move.dragonDamage ?? 0) * 0.45);
      actor.dragonHp = Math.max(0, actor.dragonHp - selfDmg);
      shiftLevel(t, 1);
      state.log.push(`  ↳ Cả hai xoáy xuống một tầng; ${actor.dragonName} cũng chịu −${selfDmg}.`);
    }

    if (t.dragonHp <= 0) {
      t.downed = true;
      state.log.push(`💀 ${t.dragonName} gập cánh và rơi khỏi bầu trời.`);
      if (t.riderName && !t.unhorsed) {
        if (rng() < 0.7) {
          state.ridersDead.push(t.riderName);
          state.log.push(`   ${t.riderName} rơi theo con rồng của mình.`);
        } else {
          state.log.push(`   ${t.riderName} sống sót sau cú rơi — không ai hiểu bằng cách nào.`);
        }
      }
    }
  }
}

export function playAerialRound(state: AerialDuelState, actions: AerialAction[]): AerialDuelState {
  if (state.finished) return state;
  const next: AerialDuelState = {
    ...state,
    units: state.units.map((u) => ({ ...u, cooldowns: { ...u.cooldowns } })),
    log: [...state.log],
    ridersDead: [...state.ridersDead],
    round: state.round + 1,
  };
  const rng = makeRng((state.seed ^ (state.round * 0x7f4a7c15)) >>> 0);
  const wx = WEATHER_AIR[next.weather] ?? WEATHER_AIR["Trời Quang"];

  next.log.push(`\n── Vòng ${state.round} ──`);
  if (wx.note && state.round === 1) next.log.push(wx.note);

  // đầu vòng: hạ hồi chiêu, hao sức khi ở tầng cao
  for (const u of next.units) {
    if (!unitAlive(u)) continue;
    if (u.breathCooldown > 0) u.breathCooldown--;
    for (const k of Object.keys(u.cooldowns)) {
      u.cooldowns[k] = Math.max(0, u.cooldowns[k] - 1);
      if (u.cooldowns[k] === 0) delete u.cooldowns[k];
    }
    // không khí loãng trên cao bào sức
    if (u.level === "Tầng Cao") u.stamina = clamp(u.stamina - 6, 0, u.maxStamina);
    else u.stamina = clamp(u.stamina + 4, 0, u.maxStamina);
    // rồng kiệt sức thì tự hạ độ cao
    if (u.stamina <= 0 && u.level !== "Tầng Thấp") {
      shiftLevel(u, 1);
      next.log.push(`${u.dragonName} đuối sức và tụt xuống ${u.level}.`);
    }
    // rồng mất kỵ sĩ có thể bỏ đi
    if (!unitControlled(u) && rng() < 0.15) {
      u.fled = true;
      next.log.push(`${u.dragonName} không còn ai trên lưng — nó vọt lên trời và biến mất về phía biển.`);
    }
  }

  // thứ tự hành động: rồng nhanh nhẹn đi trước
  const order = [...next.units]
    .filter(unitAlive)
    .sort((a, b) => b.quality * (b.stamina / Math.max(1, b.maxStamina)) - a.quality * (a.stamina / Math.max(1, a.maxStamina)));

  const evasion = new Map<string, number>();
  // né phải được khai báo TRƯỚC khi ai kịp ra đòn, không thì đi sau là mất tác dụng
  for (const u of order) {
    const act = actions.find((a) => a.unitId === u.id);
    const move = act ? MOVES_BY_ID[act.moveId] : undefined;
    if (move?.evade) evasion.set(u.id, (evasion.get(u.id) ?? 0) + move.evade);
  }

  for (const u of order) {
    if (!unitAlive(u)) continue;
    const act = actions.find((a) => a.unitId === u.id);
    const move = act ? MOVES_BY_ID[act.moveId] : undefined;
    if (!move) {
      next.log.push(`${u.dragonName} lượn vòng chờ thời.`);
      u.stamina = clamp(u.stamina + 10, 0, u.maxStamina);
      continue;
    }
    const target = act?.targetId ? next.units.find((x) => x.id === act.targetId) : undefined;
    // đã khai né ở trên rồi thì không cộng lần nữa
    const moveNoDoubleEvade = move.evade ? { ...move, evade: 0 } : move;
    resolveMove(rng, next, u, moveNoDoubleEvade, target, evasion);
  }

  // ── kết thúc ──
  const standing = new Set(next.units.filter(unitAlive).map((u) => u.side));
  if (standing.size <= 1) {
    next.finished = true;
    next.winner = [...standing][0] ?? null;
    next.log.push(
      next.winner
        ? `Bầu trời còn lại một mình phe ${next.sides.find((s) => s.id === next.winner)?.name ?? next.winner}.`
        : "Không con rồng nào còn bay. Cả bầu trời trống rỗng.",
    );
  }
  return next;
}

// ── AI ──────────────────────────────────────────────────────────────────────

/**
 * AI chọn nước đi: ưu tiên chiếm thế trên, bổ nhào khi đã có thế, hạ gục kỵ sĩ
 * khi con rồng quá dày vảy, và rút lên cao khi sắp chết. Phe yếu nhất trong
 * trận nhiều phe sẽ nhắm vào phe MẠNH NHÌ chứ không lao vào phe mạnh nhất.
 */
export function pickAerialAction(state: AerialDuelState, u: AerialUnit, rng: RNG): AerialAction {
  const foes = enemiesOf(state, u).filter((f) => f.id !== u.id);
  if (foes.length === 0) return { unitId: u.id, moveId: "lay_hoi_rong" };

  // chọn mục tiêu: kẻ yếu máu nhất, nhưng tránh lao vào con khoẻ nhất khi mình yếu
  const myStrength = u.dragonHp * u.quality;
  const scored = foes.map((f) => {
    const hpFrac = f.dragonHp / f.dragonMaxHp;
    let s = (1 - hpFrac) * 10;
    if (heightEdge(u.level, f.level) > 0) s += 6; // đang ở trên nó
    if (!unitControlled(f)) s += 3;               // rồng hoang dễ xơi
    if (f.dragonHp * f.quality > myStrength * 1.6) s -= 7; // quá mạnh, tránh ra
    return { f, s: s + rng() * 3 };
  });
  const target = scored.sort((a, b) => b.s - a.s)[0].f;

  const pool = usableMoves(u, target);
  if (pool.length === 0) return { unitId: u.id, moveId: "lay_hoi_rong", targetId: target.id };

  const hpFrac = u.dragonHp / u.dragonMaxHp;
  const stamFrac = u.stamina / Math.max(1, u.maxStamina);

  const edge = heightEdge(u.level, target.level);

  const score = (m: AerialMove): number => {
    let s = 0;
    if (m.dragonDamage) s += m.dragonDamage / 12;
    if (m.riderDamage && unitControlled(target)) s += m.riderDamage / 8;
    if (m.unhorseChance && unitControlled(target)) s += m.unhorseChance * 12;
    if (m.requiresHigher) s += 10; // đã đủ điều kiện thì đây là đòn tốt nhất
    // chiếm thế trên khi chưa có
    if (m.levelShift === -1 && edge <= 0) s += 9;
    if (m.levelShift === 1 && edge > 0) s -= 8;
    // Đánh NGƯỢC LÊN TRÊN là dở: mọi cú đánh đều bị phạt độ cao, và đối thủ ở
    // trên có thể bổ nhào bất cứ lúc nào. Phi công nào cũng biết leo trước đã.
    if (edge < 0) {
      if (m.levelShift === -1) s += 14;
      if (m.dragonDamage) s -= 10;
    }
    // sắp chết thì né và hồi
    if (hpFrac < 0.35) {
      if (m.kind === "Hồi Phục") s += 12;
      if (m.evade) s += 8;
      if (m.id === "khoa_co_rong") s -= 15;
    }
    // hết sức thì chiêu rẻ
    if (stamFrac < 0.3) s += (20 - m.stamina) * 0.5;
    // vảy quá dày thì chuyển sang giết người
    if (target.size === "Khổng Lồ (Balerion-class)" && m.riderDamage) s += 6;
    // kỵ sĩ chưa cột dây mà mình có đòn hất
    if (!unitControlled(u) && m.actor === "Kỵ Sĩ") s -= 100;
    return s + rng() * 4;
  };

  const best = pool.reduce((a, b) => (score(b) > score(a) ? b : a), pool[0]);
  return { unitId: u.id, moveId: best.id, targetId: target.id };
}

/** Tự phân giải trọn trận — cho "đánh nhanh" và cho test. */
export function autoAerialDuel(setup: AerialSetup, maxRounds = 30): AerialDuelState {
  let state = initAerialDuel(setup);
  const rng = makeRng((setup.seed ^ 0x1b873593) >>> 0);
  while (!state.finished && state.round <= maxRounds) {
    const actions = state.units.filter(unitAlive).map((u) => pickAerialAction(state, u, rng));
    state = playAerialRound(state, actions);
  }
  if (!state.finished) {
    // hết giờ: phe còn nhiều máu nhất chiếm ưu thế
    const bySide = new Map<string, number>();
    for (const u of state.units.filter(unitAlive)) {
      bySide.set(u.side, (bySide.get(u.side) ?? 0) + u.dragonHp);
    }
    const top = [...bySide.entries()].sort((a, b) => b[1] - a[1])[0];
    state = { ...state, finished: true, winner: top?.[0] ?? null, log: [...state.log, "Cả hai bên kiệt sức, đàn rồng tản ra."] };
  }
  return state;
}

/** Tóm tắt cho UI và cho AI kể lại. */
export function describeAerial(state: AerialDuelState): string {
  const lines = state.sides.map((s) => {
    const mine = state.units.filter((u) => u.side === s.id);
    return `${s.name}: ` + mine.map((u) => {
      if (u.downed) return `${u.dragonName} ĐÃ RƠI`;
      if (u.fled) return `${u.dragonName} bỏ đi`;
      return `${u.dragonName} ${u.dragonHp}/${u.dragonMaxHp} · ${u.level}` +
        (u.riderName ? ` · ${u.riderName} ${u.riderHp}${u.unhorsed ? " (mất yên)" : ""}` : " (hoang)");
    }).join(" | ");
  });
  return [`Không chiến vòng ${state.round}`, ...lines].join("\n");
}
