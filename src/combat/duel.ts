/**
 * ĐẤU TAY ĐÔI (M22) — turn-based d20, nhưng sâu hơn hẳn bản trước.
 *
 * Bản cũ chỉ có: gieo d20, so với Phòng Thủ, trừ máu. Ai có chỉ số cao hơn thì
 * thắng, và mọi trận đều diễn ra y hệt nhau. Bản này thêm bốn trục quyết định
 * mà người chơi thật sự phải cân:
 *
 *   1. CỰ LY ba dải (Áp Sát / Cận Chiến / Tầm Xa). Mỗi vũ khí mạnh ở đúng một
 *      dải: giáo dài vô dụng khi bị ôm sát, dao găm vô dụng khi cách mười bước.
 *      Nửa số quyết định trong một trận là "mình muốn đánh ở cự ly nào".
 *   2. THĂNG BẰNG — thanh thứ hai bên cạnh máu. Đòn nặng không giết ngay nhưng
 *      đánh sập thăng bằng, và kẻ mất thăng bằng thì đòn kế tiếp ăn trọn.
 *   3. THẾ CHỦ ĐỘNG — trúng liên tiếp thì dồn được thế, trượt thì mất. Thưởng
 *      cho kẻ ép được nhịp trận đấu thay vì kẻ chỉ có chỉ số to.
 *   4. NHẮM BỘ PHẬN — nhắm đầu khó trúng nhưng nhân ba sát thương giải phẫu,
 *      nhắm tay có thể làm gãy tay đối thủ, nhắm chân đánh sập thăng bằng.
 *
 * Chiêu thức nằm ở content/westeros/combatArts.ts (chia theo trường phái/loại/
 * bậc), trạng thái nằm ở combat/statusEffects.ts. File này chỉ là LUẬT.
 *
 * Cùng input + cùng seed LUÔN ra cùng kết quả — reroll lời kể không đổi số.
 */
import { makeRng, rollDiceNotation, type RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import { applyDamage } from "../character/injuryEngine";
import {
  ARTS_BY_ID, AIM_ZONES, artBands, artUsableAt,
  type AimZone, type CombatArt, type DuelBand,
} from "../content/westeros/combatArts";
import {
  applyStatus, statusModifiers, statusStacks, tickStatuses, STATUS_DEFS,
} from "./statusEffects";
import { resolveWeapon, wearOf, applyWear } from "../character/gearEngine";

/** Mòn một món đồ theo đúng chất liệu và phẩm chất của nó. */
function wearGear(item: unknown, hits: number): void {
  if (!item || typeof item !== "object") return;
  const profile = resolveWeapon(item as never);
  applyWear(item as never, wearOf(profile, hits));
}

export type { CombatArt, AimZone, DuelBand };

/** Giữ tên cũ để code/save trước M22 vẫn biên dịch được. */
export type ActiveSkill = CombatArt;

export interface PassiveSkill {
  id: string;
  name: string;
  description: string;
}

export type DuelAction =
  | { type: "skill"; skillId: string; zone?: AimZone }
  | { type: "item"; itemId: string };

// ── SÂN ĐẤU ─────────────────────────────────────────────────────────────────

export type DuelGround = "Bằng Phẳng" | "Bùn Lầy" | "Dốc Đá" | "Sàn Hẹp" | "Tuyết Dày" | "Cát Lún";
export type DuelLight = "Ban Ngày" | "Chạng Vạng" | "Đêm Tối";

export interface GroundDef {
  id: DuelGround;
  desc: string;
  /** cộng vào Thăng Bằng hồi mỗi vòng. */
  poiseRegen: number;
  /** cộng vào chỉ số đánh trúng của cả hai bên. */
  hitMod: number;
  /** thêm Thể Lực mỗi lần đổi cự ly. */
  moveCost: number;
  /** cấm dải cự ly này (sàn hẹp thì không lùi ra xa được). */
  banBand?: DuelBand;
}

export const DUEL_GROUNDS: Record<DuelGround, GroundDef> = {
  "Bằng Phẳng": { id: "Bằng Phẳng", desc: "Sân tập lát đá hoặc đồng cỏ khô — không ai được lợi, không ai bị thiệt.", poiseRegen: 0, hitMod: 0, moveCost: 0 },
  "Bùn Lầy": { id: "Bùn Lầy", desc: "Bùn ngập tới mắt cá. Chân không bám được, mỗi bước di chuyển tốn gấp đôi sức.", poiseRegen: -4, hitMod: -1, moveCost: 4 },
  "Dốc Đá": { id: "Dốc Đá", desc: "Đá vụn trên sườn dốc. Rất dễ mất thăng bằng, nhưng tầm nhìn thoáng.", poiseRegen: -5, hitMod: 0, moveCost: 2 },
  "Sàn Hẹp": { id: "Sàn Hẹp", desc: "Cầu thang xoắn, hành lang, boong thuyền — không có chỗ mà lùi ra xa.", poiseRegen: -2, hitMod: 1, moveCost: 0, banBand: "Tầm Xa" },
  "Tuyết Dày": { id: "Tuyết Dày", desc: "Tuyết ngập gối. Di chuyển chậm và lạnh ăn dần vào các ngón tay.", poiseRegen: -3, hitMod: -1, moveCost: 5 },
  "Cát Lún": { id: "Cát Lún", desc: "Cát khô của Dorne. Bước hụt liên tục, và cát thì lúc nào cũng sẵn để hất vào mắt.", poiseRegen: -3, hitMod: -1, moveCost: 3 },
};

export interface LightDef {
  id: DuelLight;
  desc: string;
  hitMod: number;
  /** phạt riêng cho đòn tầm xa. */
  rangedMod: number;
}

export const DUEL_LIGHTS: Record<DuelLight, LightDef> = {
  "Ban Ngày": { id: "Ban Ngày", desc: "Sáng rõ — không ai có cớ đổ tại ánh sáng.", hitMod: 0, rangedMod: 0 },
  "Chạng Vạng": { id: "Chạng Vạng", desc: "Nhá nhem. Đường vũ khí khó đọc hơn một nhịp.", hitMod: -1, rangedMod: -2 },
  "Đêm Tối": { id: "Đêm Tối", desc: "Chỉ có đuốc và trăng. Bắn tên gần như là đoán mò.", hitMod: -2, rangedMod: -5 },
};

// ── ĐẤU SĨ ──────────────────────────────────────────────────────────────────

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
  skills: CombatArt[];
  passives?: PassiveSkill[];
  inventory: string[];
  body: Record<string, any>;
  equipped: Record<string, any>;

  // ── M22 ──
  /** số tầng của từng trạng thái đang mang. */
  stacks?: Record<string, number>;
  /** Thăng Bằng hiện tại — về 0 là loạng choạng. */
  poise?: number;
  maxPoise?: number;
  /** Thế Chủ Động −3..+3. */
  momentum?: number;
  /** id chiêu → số vòng còn phải chờ. */
  cooldowns?: Record<string, number>;
  /** đang trên lưng ngựa (mở khoá trường phái Kỵ Chiến). */
  mounted?: boolean;
  /** giáp phụ theo vùng cơ thể (mũ giáp che đầu, giáp thân che thân...). */
  armorZones?: Partial<Record<AimZone, number>>;
  /** M23 — xuyên giáp NỀN của vũ khí đang cầm (chuỳ và nỏ xuyên hơn kiếm). */
  weaponPierce?: number;
  /** M23 — sát thương Thăng Bằng nền của vũ khí (búa tạ quật ngã, dao găm thì không). */
  weaponPoise?: number;
  /** M23 — giáp nặng bào Thăng Bằng hồi mỗi vòng. */
  poiseDrain?: number;
  /** M23 — cơ thể không cho cầm vũ khí hai tay nữa. */
  bodyBlocksTwoHand?: boolean;
  /** M23 — cơ thể không cầm nổi vũ khí nào. */
  bodyBlocksWeapon?: boolean;
  /** Thể Chất — dùng cho hồi Thể Lực và kiểm định chống trạng thái. */
  endurance?: number;
  /** tính cách điều khiển AI. */
  temperament?: DuelTemperament;
}

export type DuelTemperament = "Thận Trọng" | "Cân Bằng" | "Hung Hãn" | "Xảo Quyệt";

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
  hitBodyPart?: string;

  // ── M22 ──
  /** vùng người đánh chọn nhắm. */
  zone?: AimZone;
  /** số nhát trúng / tổng số nhát của chiêu. */
  hits?: [number, number];
  /** Thăng Bằng đối thủ sau đòn. */
  defenderPoiseAfter?: number;
  /** đối thủ vừa bị đánh gãy thăng bằng trong đòn này. */
  staggered?: boolean;
  /** Thế Chủ Động của người đánh sau đòn. */
  momentumAfter?: number;
  /** trạng thái vừa gieo được. */
  statusesApplied?: string[];
  /** chiêu ngoài tầm ở cự ly hiện tại. */
  outOfRange?: boolean;
}

export interface DuelState {
  a: Duelist;
  b: Duelist;
  distance: DuelBand;
  round: number;
  order: [string, string];
  finished: boolean;
  winner: string | null;
  log: string[];

  // ── M22 ──
  ground: DuelGround;
  light: DuelLight;
}

export interface DuelOptions {
  ground?: DuelGround;
  light?: DuelLight;
  distance?: DuelBand;
}

// ── BỊ ĐỘNG ─────────────────────────────────────────────────────────────────

export const BASIC_PASSIVES: Record<string, PassiveSkill> = {
  "giap_tru": { id: "giap_tru", name: "Giáp Trụ", description: "Bị động: Giáp Nặng giảm chịu sát thương nhưng hao tổn thêm 2 Thể Lực mỗi chiêu thức." },
  "mau_lanh": { id: "mau_lanh", name: "Máu Lạnh", description: "Bị động: Hạ ngưỡng chí mạng 2 điểm khi tấn công kẻ địch đang Chảy Máu." },
  "phan_don": { id: "phan_don", name: "Phản Đòn", description: "Bị động: Tự động phản công nếu đối thủ trượt mục tiêu với biên độ > 5." },
  "chan_nhu_da": { id: "chan_nhu_da", name: "Chân Như Đá", description: "Bị động: Thăng Bằng tối đa +25 và hồi thêm 4 mỗi vòng — rất khó bị đánh cho loạng choạng." },
  "doc_hanh": { id: "doc_hanh", name: "Độc Hành", description: "Bị động: Khi HP dưới 30%, mọi đòn tấn công +2 sát thương — kẻ bị dồn vào chân tường đánh dữ hơn." },
};

export const EXCLUSIVE_PASSIVES: Record<string, PassiveSkill> = {
  "mau_tien_nhan": { id: "mau_tien_nhan", name: "Máu Tiền Nhân", description: "Bị động: Dòng máu First Men mang lại sức sống mãnh liệt. Hồi 2 Thể Lực mỗi đầu hiệp." },
  "chat_sat": { id: "chat_sat", name: "Chất Sắt", description: "Bị động: Bản tính Ironborn. Gây thêm 3 sát thương khi HP của địch ở dưới 50%." },
  "mat_dieu_hau": { id: "mat_dieu_hau", name: "Mắt Diều Hâu", description: "Bị động: Không bị phạt bóng tối khi bắn, và +1 đánh trúng ở dải Tầm Xa." },
};

// ── CHIÊU THỨC LEGACY ───────────────────────────────────────────────────────
// Giữ đúng 10 id cũ để state/save/enemy-builder trước M22 không vỡ. Nội dung
// thật nằm trong ngân hàng chiêu thức; ở đây chỉ là bảng tra.

const LEGACY_BASIC = [
  "tan_cong_thuong", "danh_lieu", "phong_thu", "nham_chi_mang", "pha_giap",
  "nem_cat", "lao_toi", "rut_lui", "ban_ten", "ban_tia",
] as const;

const LEGACY_EXCLUSIVE = ["vu_dieu_nuoc", "mua_mui_ten", "nhat_chem_cuong_no", "khe_lua"] as const;

export const BASIC_SKILLS: Record<string, CombatArt> =
  Object.fromEntries(LEGACY_BASIC.map((id) => [id, ARTS_BY_ID[id]]));

export const EXCLUSIVE_SKILLS: Record<string, CombatArt> =
  Object.fromEntries(LEGACY_EXCLUSIVE.map((id) => [id, ARTS_BY_ID[id]]));

// ── TIỆN ÍCH ────────────────────────────────────────────────────────────────

const BAND_ORDER: DuelBand[] = ["Áp Sát", "Cận Chiến", "Tầm Xa"];

function stepBand(from: DuelBand, dir: -1 | 1, ground: DuelGround): DuelBand {
  const banned = DUEL_GROUNDS[ground].banBand;
  const idx = clamp(BAND_ORDER.indexOf(from) + dir, 0, BAND_ORDER.length - 1);
  const next = BAND_ORDER[idx];
  return next === banned ? from : next;
}

export function maxPoiseOf(d: Duelist): number {
  if (d.maxPoise && d.maxPoise > 0) return d.maxPoise;
  const base = 50 + d.agilityMod * 3 + Math.floor((d.strength ?? 10) / 2);
  const stone = d.passives?.some((p) => p.id === "chan_nhu_da") ? 25 : 0;
  return Math.max(20, base + stone);
}

function poiseOf(d: Duelist): number {
  return d.poise ?? maxPoiseOf(d);
}

/** Vũ khí gãy/hỏng nặng thì đánh như tay không (Độ Bền chạm 0). */
function weaponBroken(d: Duelist): boolean {
  const w = d.equipped?.["Vũ Khí Chính"];
  return !!w && typeof w["Độ Bền"] === "number" && w["Độ Bền"] <= 0;
}

/** Kiểm định chống trạng thái: d20 + mod chỉ số ≥ DC thì thoát. */
function savesAgainst(rng: RNG, target: Duelist, save: { stat: string; dc: number }): boolean {
  const raw =
    save.stat === "Thể Chất" ? (target.endurance ?? 10) :
    save.stat === "Nhanh Nhẹn" ? 10 + target.agilityMod * 2 :
    save.stat === "Tinh Tường" ? target.perception :
    save.stat === "Trí Tuệ" ? target.intellect :
    target.strength;
  const mod = Math.floor((raw - 10) / 2);
  return 1 + Math.floor(rng() * 20) + mod >= save.dc;
}

/** Kẻ đang mất khả năng tự vệ — mở khoá những đòn chỉ dùng được lúc này. */
function isVulnerable(d: Duelist): boolean {
  return ["Mất Thăng Bằng", "Choáng", "Mù Lòa", "Bị Ghì"].some((s) => statusStacks(d, s) > 0);
}

function cloneDuelist(d: Duelist): Duelist {
  return {
    ...d,
    traits: [...(d.traits ?? [])],
    wounds: [...(d.wounds ?? [])],
    buffs: { ...(d.buffs ?? {}) },
    stacks: { ...(d.stacks ?? {}) },
    cooldowns: { ...(d.cooldowns ?? {}) },
    inventory: [...d.inventory],
    body: JSON.parse(JSON.stringify(d.body || {})),
    equipped: JSON.parse(JSON.stringify(d.equipped || {})),
  };
}

// ── KHỞI TRẬN ───────────────────────────────────────────────────────────────

export function startDuel(a: Duelist, b: Duelist, seed: number, opts: DuelOptions = {}): DuelState {
  const rng = makeRng(seed);

  const prep = (d: Duelist): Duelist => {
    const c = cloneDuelist(d);
    c.wounds = [];
    c.buffs = {};
    c.stacks = {};
    c.cooldowns = {};
    c.maxPoise = maxPoiseOf(d);
    c.poise = c.maxPoise;
    c.momentum = 0;
    return c;
  };
  const duelistA = prep(a);
  const duelistB = prep(b);

  // Sân đấu bốc từ một luồng RNG RIÊNG để không xê dịch chuỗi roll của trận đấu.
  const envRng = makeRng((seed ^ 0x5bf03635) >>> 0);
  const ground = opts.ground ?? "Bằng Phẳng";
  const light = opts.light ?? (envRng() > 0.85 ? "Chạng Vạng" : "Ban Ngày");
  const distance = opts.distance ?? "Cận Chiến";

  const initA = 1 + Math.floor(rng() * 20) + duelistA.agilityMod;
  const initB = 1 + Math.floor(rng() * 20) + duelistB.agilityMod;
  const order: [string, string] = initA >= initB ? [duelistA.name, duelistB.name] : [duelistB.name, duelistA.name];

  return {
    a: duelistA,
    b: duelistB,
    distance,
    round: 0,
    order,
    finished: false,
    winner: null,
    ground,
    light,
    log: [
      `Initiative: ${duelistA.name} ${initA} vs ${duelistB.name} ${initB} — ${order[0]} ra đòn trước`,
      `[KHOẢNG CÁCH BAN ĐẦU: ${distance}]`,
      `[SÂN ĐẤU: ${ground} · ${light}] ${DUEL_GROUNDS[ground].desc}`,
    ],
  };
}

// ── XỬ LÝ MỘT CHIÊU ─────────────────────────────────────────────────────────

interface ArtContext {
  band: DuelBand;
  ground: DuelGround;
  light: DuelLight;
  isRiposte?: boolean;
  zone?: AimZone;
  /** trạng thái tự thân của chiêu đã được dựng ở đầu vòng (thế thủ). */
  stancePreApplied?: boolean;
}

function processArt(
  rng: RNG,
  attacker: Duelist,
  defender: Duelist,
  art: CombatArt,
  ctx: ArtContext,
): AttackEvent {
  const isRiposte = ctx.isRiposte ?? false;
  const exhausted = attacker.stamina <= 0;
  let effArt = exhausted ? BASIC_SKILLS["tan_cong_thuong"] : art;

  // ── giá Thể Lực ──
  let stamCost = effArt.staminaCost;
  if (attacker.traits?.includes("agile_dancer") && (effArt.name === "Nhắm Chí Mạng" || effArt.name === "Phòng Thủ")) {
    stamCost = Math.floor(stamCost / 2);
  }
  if (attacker.traits?.includes("brute_force")) stamCost += 2;
  if (isRiposte) stamCost = 0;
  if (attacker.passives?.some((p) => p.id === "giap_tru")) stamCost += 2;
  attacker.stamina = clamp(attacker.stamina - stamCost, 0, attacker.maxStamina);

  const atkMods = statusModifiers(attacker);
  const defMods = statusModifiers(defender);

  // Máu Lạnh: dễ chí mạng hơn khi địch đang chảy máu
  if (attacker.passives?.some((p) => p.id === "mau_lanh") && statusStacks(defender, "Chảy Máu") > 0) {
    effArt = { ...effArt, critFrom: Math.max(1, effArt.critFrom - 2) };
  }

  const zone: AimZone = effArt.zoneBias ?? ctx.zone ?? "Ngẫu Nhiên";
  const zoneDef = AIM_ZONES[zone] ?? AIM_ZONES["Ngẫu Nhiên"];

  const base = (): AttackEvent => ({
    attacker: attacker.name, defender: defender.name, actionUsed: effArt.name,
    natRoll: 0, toHit: 0, targetAc: 0, hit: false, crit: false, damage: 0,
    defenderHpAfter: defender.hp, exhausted, zone,
    defenderPoiseAfter: poiseOf(defender), momentumAfter: attacker.momentum ?? 0,
  });

  // ── ngoài tầm ──
  if (!artUsableAt(effArt, ctx.band)) {
    return {
      ...base(),
      outOfRange: true,
      woundsInflicted: [`Ngoài tầm — ${effArt.name} chỉ dùng được ở ${artBands(effArt).join("/")}`],
    };
  }

  const natRoll = 1 + Math.floor(rng() * 20);

  // ── chỉ số đánh trúng ──
  const momentum = clamp(attacker.momentum ?? 0, -3, 3);
  const fatigueRatio = attacker.maxStamina > 0 ? attacker.stamina / attacker.maxStamina : 1;
  const fatiguePenalty = exhausted ? 2 : fatigueRatio < 0.25 ? 1 : 0;

  let attackMod = attacker.attackMod + effArt.hitMod + atkMods.hit + zoneDef.hitMod - fatiguePenalty;
  attackMod += clamp(momentum, -2, 2);
  attackMod += DUEL_GROUNDS[ctx.ground].hitMod;
  if (effArt.range === "ranged") {
    const dark = DUEL_LIGHTS[ctx.light].rangedMod;
    attackMod += attacker.passives?.some((p) => p.id === "mat_dieu_hau") ? 0 : dark;
    if (attacker.passives?.some((p) => p.id === "mat_dieu_hau") && ctx.band === "Tầm Xa") attackMod += 1;
  } else {
    attackMod += DUEL_LIGHTS[ctx.light].hitMod;
  }
  if (attacker.wounds?.some((w) => ["Tàn Phế", "Gãy Xương", "Đứt Lìa"].includes(w))) attackMod -= 2;
  if (weaponBroken(attacker) && effArt.school !== "bac-thu") attackMod -= 3;

  const toHit = natRoll + attackMod;

  // ── Phòng Thủ mục tiêu ──
  let targetAc = defender.armorClass + defMods.ac;
  if (defender.buffs?.["ROUND_AC_MOD"]) targetAc += defender.buffs["ROUND_AC_MOD"];
  if (attacker.traits?.includes("brute_force")) targetAc -= 2;

  const hitOnce = (roll: number) => roll === 20 || (roll !== 1 && roll + attackMod >= targetAc);
  const hit = hitOnce(natRoll);
  const critFrom = Math.max(2, effArt.critFrom - atkMods.critBonus - (isVulnerable(defender) ? 1 : 0));
  const crit = hit && natRoll >= critFrom;

  const ev = base();
  ev.natRoll = natRoll;
  ev.toHit = toHit;
  ev.targetAc = targetAc;
  ev.hit = hit;
  ev.crit = crit;

  const woundsInflicted: string[] = [];
  const statusesApplied: string[] = [];
  let totalDamage = 0;
  let landed = hit ? 1 : 0;
  const swings = Math.max(1, effArt.hits ?? 1);

  // ── sát thương ──
  const dealOneHit = (isCrit: boolean) => {
    const dice = effArt.damageDice ?? attacker.weaponDice;
    let dmg = rollDiceNotation(dice, rng) + attacker.damageBonus + effArt.damageMod + atkMods.damage;
    if (attacker.wounds?.some((w) => ["Tàn Phế", "Gãy Xương", "Đứt Lìa"].includes(w))) dmg = Math.max(1, dmg - 2);
    if (exhausted) dmg -= 2;
    if (isRiposte) dmg = Math.max(1, Math.floor(dmg / 2));
    if (isCrit) dmg *= 2;

    if (attacker.passives?.some((p) => p.id === "chat_sat") && defender.hp < defender.maxHp * 0.5) dmg += 3;
    if (attacker.passives?.some((p) => p.id === "doc_hanh") && attacker.hp < attacker.maxHp * 0.3) dmg += 2;
    // đòn "chỉ đánh được kẻ đang hở" (Đâm Lén) nhân đôi khi đúng thời điểm
    if (effArt.id === "dam_len" && isVulnerable(defender)) dmg *= 2;

    // giáp: giáp thân + giáp riêng của vùng bị nhắm, trừ đi phần chiêu xuyên được
    // M23: giáp tính theo ĐÚNG VÙNG bị nhắm (gearEngine dựng bảng này), và
    // xuyên giáp cộng cả phần NỀN của vũ khí — chuỳ gai xuyên hơn kiếm dài dù
    // dùng cùng một chiêu.
    const zoneArmor = defender.armorZones?.[zone] ?? defender.damageReduction;
    const rawDr = Math.max(0, zoneArmor + defMods.dr);
    const pierced = Math.max(0, rawDr - (effArt.armorPierce ?? 0) - (attacker.weaponPierce ?? 0));
    const dr = attacker.valyrianOrObsidian ? Math.floor(pierced * 0.25) : pierced;
    return Math.max(1, dmg - dr);
  };

  if (hit) {
    if (effArt.type === "attack" || effArt.type === "debuff") {
      totalDamage += dealOneHit(crit);
      // nhát thứ hai trở đi gieo riêng — chiêu liên hoàn có thể trúng một hụt một
      for (let i = 1; i < swings; i++) {
        const roll = 1 + Math.floor(rng() * 20);
        if (hitOnce(roll)) {
          landed++;
          totalDamage += dealOneHit(roll >= critFrom);
        }
      }
      defender.hp = Math.max(0, defender.hp - totalDamage);

      // hao mòn trang bị
      // M23: mòn theo VẬT LIỆU và PHẨM CHẤT — thép Valyria gần như không cùn,
      // obsidian thì vỡ sau vài nhát.
      wearGear(attacker.equipped?.["Vũ Khí Chính"], landed);
      wearGear(defender.equipped?.["Giáp Thân"], landed * 2);

      // vết thương giải phẫu
      const parts = zoneDef.parts;
      const hitBodyPart = parts[Math.floor(rng() * parts.length)];
      ev.hitBodyPart = hitBodyPart;
      const { died, newSymptoms } = applyDamage(defender.body, hitBodyPart, totalDamage, undefined, rng);
      if (died) {
        ev.fatality =
          hitBodyPart === "Đầu" ? "Bị chém đứt đầu ngay tại chỗ" :
          hitBodyPart === "Ngực" ? "Bị đâm xuyên tim" :
          hitBodyPart === "Cổ" ? "Bị cắt đứt cuống họng" :
          "Gục ngã do vết thương chí mạng";
        defender.hp = 0;
      } else if (newSymptoms.length > 0) {
        woundsInflicted.push(...newSymptoms);
        for (const sym of newSymptoms) {
          if (!defender.wounds?.includes(sym)) defender.wounds?.push(sym);
        }
      }
    }

    // ── Thăng Bằng ──
    // vũ khí nặng quật ngã người ta kể cả khi chiêu không nhắm vào thăng bằng
    const weaponPoise = effArt.poiseDamage ? 0 : Math.round((attacker.weaponPoise ?? 0) * 0.6);
    const poiseHit = (effArt.poiseDamage ?? 0) + weaponPoise + (crit ? 10 : 0) + Math.floor(totalDamage / 3);
    if (poiseHit > 0 && !isRiposte) {
      const before = poiseOf(defender);
      const after = before - poiseHit;
      if (after <= 0) {
        defender.poise = Math.round(maxPoiseOf(defender) * 0.5);
        if (applyStatus(defender, "Mất Thăng Bằng", { duration: 1 })) {
          ev.staggered = true;
          statusesApplied.push("Mất Thăng Bằng");
        }
      } else {
        defender.poise = after;
      }
    }

    // ── trạng thái gieo lên đối thủ ──
    if (!isRiposte) {
      for (const s of effArt.onHit ?? []) {
        if (s.chance !== undefined && rng() >= s.chance) continue;
        if (s.save && savesAgainst(rng, defender, s.save)) continue;
        if (applyStatus(defender, s.id, { stacks: s.stacks, duration: s.duration })) {
          statusesApplied.push(s.id);
          woundsInflicted.push(s.id);
        }
      }
      // đòn tẩm độc từ đặc tính trang bị (giữ từ bản cũ)
      if (attacker.traits?.includes("poisoned_blade") && totalDamage > 0 && rng() < 0.3) {
        if (applyStatus(defender, "Trúng Độc", { stacks: 1, duration: 5 })) {
          statusesApplied.push("Trúng Độc");
          woundsInflicted.push("Trúng Độc");
        }
      }
    }

    // hơi thở thứ hai
    if (defender.traits?.includes("second_wind") && defender.hp > 0 && defender.hp < defender.maxHp * 0.2 && !defender.buffs?.["second_wind_used"]) {
      defender.buffs = defender.buffs || {};
      defender.buffs["second_wind_used"] = 99;
      applyStatus(defender, "second_wind", { duration: 2 });
      defender.stamina = clamp(defender.stamina + Math.floor(defender.maxStamina * 0.3), 0, defender.maxStamina);
      woundsInflicted.push("Second Wind Triggered");
    }

    if (defender.hp <= 0 && crit && !ev.fatality) {
      ev.fatality = rng() > 0.5 ? "Bổ đôi khiên và vỡ sọ đối thủ" : "Lưỡi kiếm đâm xuyên qua tim tàn nhẫn";
    }
  }

  // ── trạng thái tự khoác + hồi phục (chạy cả khi trượt: đây là chiêu tự thân) ──
  if (!isRiposte) {
    if (!ctx.stancePreApplied) {
      for (const s of effArt.onSelf ?? []) {
        if (s.chance !== undefined && rng() >= s.chance) continue;
        if (applyStatus(attacker, s.id, { stacks: s.stacks, duration: s.duration })) {
          statusesApplied.push(`${attacker.name}: ${s.id}`);
        }
      }
    }
    if (effArt.recoverStamina) {
      attacker.stamina = clamp(attacker.stamina + effArt.recoverStamina, 0, attacker.maxStamina);
    }
    if (effArt.healHp) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + effArt.healHp);
    }
    // poiseCost âm = chiêu LẤY LẠI thăng bằng (Phòng Thủ, Lấy Hơi)
    if (effArt.poiseCost) {
      attacker.poise = clamp(poiseOf(attacker) - effArt.poiseCost, 0, maxPoiseOf(attacker));
      if (attacker.poise <= 0) {
        attacker.poise = Math.round(maxPoiseOf(attacker) * 0.5);
        applyStatus(attacker, "Mất Thăng Bằng", { duration: 1 });
      }
    }
    // trả giá khi chiêu nặng đi hụt
    if (effArt.backfire && !hit && rng() < effArt.backfire.chance) {
      applyStatus(attacker, effArt.backfire.status, {});
      woundsInflicted.push(`${attacker.name} ${effArt.backfire.desc}`);
    }
    if (effArt.cooldown) {
      attacker.cooldowns = attacker.cooldowns ?? {};
      attacker.cooldowns[effArt.id] = effArt.cooldown;
    }
  }

  // ── Thế Chủ Động ──
  if (!isRiposte && (effArt.type === "attack" || effArt.type === "debuff")) {
    const gain = hit ? (effArt.momentum ?? 1) : -1;
    attacker.momentum = clamp((attacker.momentum ?? 0) + gain, -3, 3);
    if (hit) defender.momentum = clamp((defender.momentum ?? 0) - 1, -3, 3);
  }

  ev.damage = totalDamage;
  ev.defenderHpAfter = defender.hp;
  ev.defenderPoiseAfter = poiseOf(defender);
  ev.momentumAfter = attacker.momentum ?? 0;
  ev.hits = [landed, swings];
  ev.woundsInflicted = woundsInflicted;
  ev.statusesApplied = statusesApplied;
  return ev;
}

// ── VẬT PHẨM ────────────────────────────────────────────────────────────────

function useItem(actor: Duelist, itemId: string, log: string[]) {
  const itemIndex = actor.inventory.indexOf(itemId);
  if (itemIndex < 0) return;
  actor.inventory.splice(itemIndex, 1);
  if (itemId === "Bình Máu") {
    actor.hp = Math.min(actor.maxHp, actor.hp + 20);
    log.push(`${actor.name} uống Bình Máu, hồi 20 HP.`);
  } else if (itemId === "Bình Thể Lực") {
    actor.stamina = Math.min(actor.maxStamina, actor.stamina + 40);
    log.push(`${actor.name} uống Bình Thể Lực, hồi 40 Thể lực.`);
  } else if (itemId === "Thuốc Giải Độc") {
    if (actor.buffs) delete actor.buffs["Trúng Độc"];
    if (actor.stacks) delete actor.stacks["Trúng Độc"];
    actor.wounds = (actor.wounds ?? []).filter((w) => w !== "Trúng Độc");
    log.push(`${actor.name} uống Thuốc Giải Độc, gỡ sạch Trúng Độc.`);
  } else if (itemId === "Băng Gạc") {
    if (actor.buffs) delete actor.buffs["Chảy Máu"];
    if (actor.stacks) delete actor.stacks["Chảy Máu"];
    actor.wounds = (actor.wounds ?? []).filter((w) => w !== "Chảy Máu");
    log.push(`${actor.name} băng vết thương, cầm được máu.`);
  } else {
    log.push(`${actor.name} sử dụng ${itemId}.`);
  }
}

// ── MỘT VÒNG ────────────────────────────────────────────────────────────────

export function runDuelRound(
  state: DuelState,
  actionA: DuelAction,
  actionB: DuelAction,
  battleSeed: number,
): { state: DuelState; events: AttackEvent[] } {
  if (state.finished) return { state, events: [] };

  const next: DuelState = {
    ...state,
    a: { ...state.a, wounds: [...(state.a.wounds ?? [])], buffs: { ...(state.a.buffs ?? {}) }, stacks: { ...(state.a.stacks ?? {}) }, cooldowns: { ...(state.a.cooldowns ?? {}) }, inventory: [...state.a.inventory] },
    b: { ...state.b, wounds: [...(state.b.wounds ?? [])], buffs: { ...(state.b.buffs ?? {}) }, stacks: { ...(state.b.stacks ?? {}) }, cooldowns: { ...(state.b.cooldowns ?? {}) }, inventory: [...state.b.inventory] },
    log: [...state.log],
    round: state.round + 1,
  };
  const rng = makeRng((battleSeed ^ (next.round * 0x9e3779b9)) >>> 0);
  const events: AttackEvent[] = [];

  const duelists: Record<string, Duelist> = { [next.a.name]: next.a, [next.b.name]: next.b };
  const actions: Record<string, DuelAction> = { [next.a.name]: actionA, [next.b.name]: actionB };

  const artOf = (d: Duelist, action: DuelAction): CombatArt => {
    if (action.type !== "skill") return BASIC_SKILLS["tan_cong_thuong"];
    return d.skills.find((s) => s.id === action.skillId) ?? ARTS_BY_ID[action.skillId] ?? BASIC_SKILLS["tan_cong_thuong"];
  };

  // ── đầu vòng: trạng thái rỉ máu, hồi Thăng Bằng, hạ hồi chiêu ──
  for (const dName of next.order) {
    const d = duelists[dName];
    if (d.passives?.some((p) => p.id === "mau_tien_nhan")) {
      d.stamina = Math.min(d.maxStamina, d.stamina + 2);
    }

    const tick = tickStatuses(d, dName);
    if (tick.hpLoss > 0) d.hp = Math.max(0, d.hp - tick.hpLoss);
    if (tick.staminaLoss > 0) d.stamina = clamp(d.stamina - tick.staminaLoss, 0, d.maxStamina);
    next.log.push(...tick.lines);

    const mods = statusModifiers(d);
    const regen = 8 + DUEL_GROUNDS[next.ground].poiseRegen + mods.poiseRegen
      - (d.poiseDrain ?? 0)
      + (d.passives?.some((p) => p.id === "chan_nhu_da") ? 4 : 0);
    d.poise = clamp(poiseOf(d) + regen, 0, maxPoiseOf(d));

    for (const id of Object.keys(d.cooldowns ?? {})) {
      d.cooldowns![id] = Math.max(0, d.cooldowns![id] - 1);
      if (d.cooldowns![id] === 0) delete d.cooldowns![id];
    }

    // kiệt sức: cạn Thể Lực là dính trạng thái thật, không chỉ là một cờ boolean
    if (d.stamina <= 0) applyStatus(d, "Kiệt Sức", { duration: 2 });
  }

  // Thế thủ được DỰNG TRƯỚC khi ai kịp ra đòn: người chọn đỡ gạt không đáng bị
  // phạt chỉ vì thua initiative. Phòng Thủ tạm thời và mọi trạng thái của chiêu
  // loại "Thế Thủ" đều có hiệu lực cả vòng, kể cả khi bị đánh trước lượt mình.
  // Phải chạy SAU vòng đếm ngược ở trên, không thì trạng thái vừa dựng bị trừ
  // ngay một vòng và biến mất trước khi ai kịp dùng.
  const stanceApplied = new Set<string>();
  for (const dName of next.order) {
    const d = duelists[dName];
    const action = actions[dName];
    if (action.type !== "skill") continue;
    const effArt = d.stamina <= 0 ? BASIC_SKILLS["tan_cong_thuong"] : artOf(d, action);
    if (effArt.acMod !== 0) {
      d.buffs = d.buffs ?? {};
      d.buffs["ROUND_AC_MOD"] = effArt.acMod;
    }
    if (effArt.kind === "Thế Thủ" && effArt.onSelf?.length) {
      for (const s of effArt.onSelf) applyStatus(d, s.id, { stacks: s.stacks, duration: s.duration });
      stanceApplied.add(dName);
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

    // Choáng: mất trọn lượt
    if (statusModifiers(actor).skipAction) {
      next.log.push(`V${next.round} ${actor.name} còn choáng váng, mất lượt!`);
      continue;
    }

    const action = actions[actorName];
    if (action.type === "item") {
      useItem(actor, action.itemId, next.log);
      events.push({
        attacker: actor.name, defender: target.name, actionUsed: `Item: ${action.itemId}`,
        natRoll: 0, toHit: 0, targetAc: 0, hit: true, crit: false, damage: 0,
        defenderHpAfter: target.hp, exhausted: false,
      });
      continue;
    }

    const art = artOf(actor, action);
    const ev = processArt(rng, actor, target, art, {
      band: next.distance, ground: next.ground, light: next.light, zone: action.zone,
      stancePreApplied: stanceApplied.has(actorName),
    });
    events.push(ev);

    // ── đổi cự ly ──
    const effName = ev.actionUsed;
    const moved = !ev.outOfRange && (art.effect === "Lao Tới" || art.effect === "Rút Lui") && actor.stamina >= 0;
    if (moved && effName === art.name) {
      const blocked = statusModifiers(actor).blocksMove;
      const enemyHolds = statusStacks(target, "Giữ Tầm") > 0;
      if (blocked) {
        next.log.push(`${actor.name} bị ghì chặt, không thoát ra được!`);
      } else if (art.effect === "Lao Tới" && enemyHolds) {
        next.log.push(`${target.name} chống giáo giữ tầm — ${actor.name} không áp sát nổi!`);
      } else {
        const before = next.distance;
        next.distance = stepBand(next.distance, art.effect === "Lao Tới" ? -1 : 1, next.ground);
        const extra = DUEL_GROUNDS[next.ground].moveCost;
        if (extra > 0) actor.stamina = clamp(actor.stamina - extra, 0, actor.maxStamina);
        next.log.push(
          before === next.distance
            ? `${actor.name} không đổi được cự ly (${next.distance}).`
            : `${actor.name} ${art.effect === "Lao Tới" ? "lao tới" : "lùi lại"} — cự ly: ${next.distance}`,
        );
      }
    }

    // ── log ──
    let logMsg = `V${next.round} ${ev.attacker} [${ev.actionUsed}${ev.zone && ev.zone !== "Ngẫu Nhiên" ? ` → ${ev.zone}` : ""}] d20=${ev.natRoll} toHit ${ev.toHit} vs AC ${ev.targetAc}: `;
    if (ev.outOfRange) {
      logMsg += "NGOÀI TẦM";
    } else if (ev.hit) {
      logMsg += `${ev.crit ? "CHÍ MẠNG " : "TRÚNG"}`;
      if (ev.hits && ev.hits[1] > 1) logMsg += ` (${ev.hits[0]}/${ev.hits[1]} nhát)`;
      if (ev.damage > 0) logMsg += ` −${ev.damage} HP (${ev.defender} còn ${ev.defenderHpAfter})`;
    } else {
      logMsg += "TRƯỢT";
    }
    if (ev.staggered) logMsg += " → ĐÁNH GÃY THĂNG BẰNG";
    if (ev.woundsInflicted?.length) logMsg += ` -> Gây thêm: ${ev.woundsInflicted.join(", ")}`;
    if (ev.fatality) logMsg += `\n[FATALITY] ${ev.fatality}!`;
    next.log.push(logMsg);

    if (target.hp <= 0) {
      next.finished = true;
      next.winner = actor.name;
      next.log.push(`${target.name} gục ngã — ${actor.name} thắng sau ${next.round} vòng`);
      break;
    }

    // ── phản đòn ──
    const targetArt = actions[target.name]?.type === "skill" ? artOf(target, actions[target.name]) : null;
    const stanceRiposte = targetArt?.effect === "Phản Kiếm";
    const traitRiposte = target.traits?.includes("riposte") || target.passives?.some((p) => p.id === "phan_don");
    const canRiposte =
      !ev.hit && !ev.outOfRange &&
      (stanceRiposte || (traitRiposte && ev.targetAc - ev.toHit > 5)) &&
      !target.wounds?.some((w) => ["Tàn Phế", "Gãy Xương", "Đứt Lìa"].includes(w)) &&
      !statusModifiers(target).skipAction;

    if (canRiposte) {
      const repEv = processArt(rng, target, actor, BASIC_SKILLS["tan_cong_thuong"], {
        band: next.distance, ground: next.ground, light: next.light, isRiposte: true,
      });
      events.push(repEv);
      next.log.push(
        `[PHẢN ĐÒN] ${repEv.attacker} chớp thời cơ: d20=${repEv.natRoll} ` +
        (repEv.hit ? `TRÚNG −${repEv.damage} HP (${repEv.defender} còn ${repEv.defenderHpAfter})` : "TRƯỢT"),
      );
      if (actor.hp <= 0) {
        next.finished = true;
        next.winner = target.name;
        next.log.push(`${actor.name} gục ngã vì đòn phản công — ${target.name} thắng`);
        break;
      }
    }
  }

  // ── cuối vòng: hồi Thể Lực ──
  const recover = (d: Duelist) => {
    const hurt = d.wounds?.some((w) => ["Tàn Phế", "Gãy Xương", "Đứt Lìa"].includes(w));
    const endBonus = d.endurance ? Math.floor((d.endurance - 10) / 4) : 0;
    return Math.max(1, (hurt ? 1 : 3) + endBonus);
  };
  next.a.stamina = clamp(next.a.stamina + recover(next.a), 0, next.a.maxStamina);
  next.b.stamina = clamp(next.b.stamina + recover(next.b), 0, next.b.maxStamina);

  delete next.a.buffs?.["ROUND_AC_MOD"];
  delete next.b.buffs?.["ROUND_AC_MOD"];

  return { state: next, events };
}

// ── AI ĐẤU SĨ ───────────────────────────────────────────────────────────────

const TEMPER_WEIGHTS: Record<DuelTemperament, { aggression: number; caution: number; guile: number }> = {
  "Thận Trọng": { aggression: 0.6, caution: 1.6, guile: 0.9 },
  "Cân Bằng": { aggression: 1.0, caution: 1.0, guile: 1.0 },
  "Hung Hãn": { aggression: 1.6, caution: 0.5, guile: 0.7 },
  "Xảo Quyệt": { aggression: 0.9, caution: 1.0, guile: 1.8 },
};

/** Chiêu đang dùng được lúc này (đủ Thể Lực, hết hồi chiêu, đúng cự ly). */
export function usableArts(d: Duelist, band: DuelBand): CombatArt[] {
  return d.skills.filter(
    (s) => s.staminaCost <= d.stamina && (d.cooldowns?.[s.id] ?? 0) <= 0 && artUsableAt(s, band),
  );
}

/**
 * AI chọn nước đi bằng cách CHẤM ĐIỂM từng chiêu theo tình thế, không bốc bừa:
 * sắp hết máu thì tìm đường thủ và uống thuốc, đối thủ loạng choạng thì dồn đòn
 * nặng, bị cung thủ ghìm ở xa thì lao vào. Vẫn có nhiễu ngẫu nhiên để hai trận
 * cùng cấu hình không giống hệt nhau.
 */
export function pickDuelAction(
  self: Duelist,
  foe: Duelist,
  band: DuelBand,
  rng: RNG,
): DuelAction {
  const w = TEMPER_WEIGHTS[self.temperament ?? "Cân Bằng"];
  const hpRatio = self.maxHp > 0 ? self.hp / self.maxHp : 1;
  const stamRatio = self.maxStamina > 0 ? self.stamina / self.maxStamina : 1;
  const foeHpRatio = foe.maxHp > 0 ? foe.hp / foe.maxHp : 1;
  const foeOpen = isVulnerable(foe);

  if (hpRatio < 0.3 && self.inventory.includes("Bình Máu")) return { type: "item", itemId: "Bình Máu" };
  if (stamRatio < 0.15 && self.inventory.includes("Bình Thể Lực")) return { type: "item", itemId: "Bình Thể Lực" };
  if (statusStacks(self, "Trúng Độc") >= 2 && self.inventory.includes("Thuốc Giải Độc")) {
    return { type: "item", itemId: "Thuốc Giải Độc" };
  }

  const pool = usableArts(self, band);
  if (pool.length === 0) {
    // không chiêu nào dùng được ở cự ly này → tìm đường đổi cự ly, cùng lắm thì đánh thường
    const mover = self.skills.find((s) => (s.effect === "Lao Tới" || s.effect === "Rút Lui") && s.staminaCost <= self.stamina);
    return { type: "skill", skillId: mover?.id ?? "tan_cong_thuong" };
  }

  // Cự ly nào có lợi cho mình: cộng GIÁ TRỊ CHIẾN ĐẤU của các chiêu dùng được ở
  // từng dải. Không đếm chiêu Cơ Động — nếu đếm thì một cung thủ bị áp sát sẽ
  // thấy cự ly hiện tại "có 1 chiêu dùng được" và đứng yên chịu chém.
  const reachScore = (b: DuelBand) =>
    self.skills
      .filter((s) => s.kind !== "Cơ Động" && artUsableAt(s, b))
      .reduce((sum, s) => sum + 3 + Math.max(0, s.damageMod) + (s.hits ?? 1) * 2
        + (s.tier === "Tuyệt Kỹ" ? 6 : s.tier === "Cao Thủ" ? 4 : 0), 0);
  const bestBand = BAND_ORDER.reduce((best, b) => (reachScore(b) > reachScore(best) ? b : best), band);

  const score = (art: CombatArt): number => {
    let s = 0;
    switch (art.kind) {
      case "Đòn Đánh": s = 10 * w.aggression; break;
      case "Bí Kỹ": s = 12 * w.aggression; break;
      case "Trấn Áp": s = 9 * w.guile; break;
      case "Thế Thủ": s = 7 * w.caution; break;
      case "Cơ Động": s = 5; break;
      case "Hồi Sức": s = 4; break;
    }
    // giá trị sát thương thô
    s += (art.damageMod + (art.hits ?? 1) * 2 + (art.armorPierce ?? 0) * 0.4) * 0.6 * w.aggression;

    // đối thủ đang hở → dồn đòn nặng
    if (foeOpen && (art.kind === "Bí Kỹ" || art.damageMod >= 3)) s += 9;
    if (foeOpen && art.id === "dam_len") s += 14;
    // đối thủ còn khoẻ → ưu tiên bào mòn bằng trạng thái
    if (foeHpRatio > 0.6 && art.onHit?.length) s += 5 * w.guile;
    // sắp chết → thủ và hồi
    if (hpRatio < 0.35) {
      if (art.kind === "Thế Thủ") s += 10 * w.caution;
      if (art.kind === "Hồi Sức") s += 8;
      if (art.acMod < 0) s -= 8 * w.caution;
    }
    // hết hơi → chiêu rẻ
    if (stamRatio < 0.3) {
      s += (12 - art.staminaCost) * 0.8;
      if (art.kind === "Hồi Sức") s += 12;
    }
    // thăng bằng địch sắp vỡ → đòn phá thăng bằng
    const foePoiseRatio = poiseOf(foe) / maxPoiseOf(foe);
    if (foePoiseRatio < 0.45) s += (art.poiseDamage ?? 0) * 0.35;
    // mình sắp mất thăng bằng → tránh chiêu tốn thăng bằng
    if (poiseOf(self) / maxPoiseOf(self) < 0.35) s -= (art.poiseCost ?? 0) * 0.3;
    // cự ly: chiêu kéo về dải có lợi được cộng điểm
    if (art.effect === "Lao Tới" && BAND_ORDER.indexOf(bestBand) < BAND_ORDER.indexOf(band)) s += 12;
    if (art.effect === "Rút Lui" && BAND_ORDER.indexOf(bestBand) > BAND_ORDER.indexOf(band)) s += 12;
    if ((art.effect === "Lao Tới" || art.effect === "Rút Lui") && bestBand === band) s -= 6;
    // đã đủ buff rồi thì thôi
    if (art.onSelf?.every((x) => statusStacks(self, x.id) > 0)) s -= 10;

    return s + rng() * 6;
  };

  let best = pool[0];
  let bestScore = -Infinity;
  for (const art of pool) {
    const sc = score(art);
    if (sc > bestScore) { bestScore = sc; best = art; }
  }

  // nhắm bộ phận: kẻ xảo quyệt nhắm tay, kẻ hung hãn nhắm đầu khi địch đã hở
  let zone: AimZone = "Ngẫu Nhiên";
  if (!best.zoneBias && (best.type === "attack" || best.type === "debuff")) {
    if (foeOpen && rng() < 0.45 * w.aggression) zone = "Đầu";
    else if (rng() < 0.25 * w.guile) zone = "Tay";
    else if (foeHpRatio > 0.7 && rng() < 0.2 * w.guile) zone = "Chân";
  }
  return { type: "skill", skillId: best.id, zone };
}

// ── TỰ PHÂN GIẢI ────────────────────────────────────────────────────────────

export interface DuelResult {
  winner: string;
  loser: string;
  rounds: number;
  hpLeftWinner: number;
  log: string[];
}

export function autoDuel(a: Duelist, b: Duelist, seed: number, maxRounds = 30, opts: DuelOptions = {}): DuelResult {
  let state = startDuel(a, b, seed, opts);
  const rng = makeRng((seed ^ 0x51ed270b) >>> 0);
  while (!state.finished && state.round < maxRounds) {
    const actA = pickDuelAction(state.a, state.b, state.distance, rng);
    const actB = pickDuelAction(state.b, state.a, state.distance, rng);
    state = runDuelRound(state, actA, actB, seed).state;
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

/** Tóm tắt trạng thái một đấu sĩ cho UI/AI đọc. */
export function describeDuelist(d: Duelist): string {
  const st = Object.entries(d.buffs ?? {})
    .filter(([id, v]) => v > 0 && STATUS_DEFS[id])
    .map(([id]) => (statusStacks(d, id) > 1 ? `${id} ×${statusStacks(d, id)}` : id));
  return `${d.name}: ${d.hp}/${d.maxHp} HP · ${d.stamina}/${d.maxStamina} Thể Lực · Thăng Bằng ${poiseOf(d)}/${maxPoiseOf(d)}${st.length ? ` · ${st.join(", ")}` : ""}`;
}
