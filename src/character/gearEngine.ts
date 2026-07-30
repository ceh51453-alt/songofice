/**
 * ENGINE TRANG BỊ (M23) — quy một món đồ trong túi thành HỒ SƠ CƠ HỌC mà engine
 * chiến đấu dùng được.
 *
 * Đây là cầu duy nhất giữa `Trang Bị Đang Mặc` (dữ liệu tự do do AI ghi) và các
 * con số thật trong trận: xúc xắc sát thương, xuyên giáp, tầm với, giảm sát
 * thương theo TỪNG VÙNG cơ thể, và trọng lượng đè lên sự nhanh nhẹn.
 *
 * Bốn nguồn nhân vào nhau, không cái nào bị bỏ qua như trước M23:
 *   LỚP VŨ KHÍ (kiếm/rìu/cung…) × VẬT LIỆU (thép/Valyria/obsidian)
 *   × PHẨM CHẤT (Thô Kệch→Vô Giá) × ĐỘ BỀN (nguyên vẹn→đã gãy)
 *
 * Hàm thuần.
 */
import type { EquipItem, StatData } from "../mvu/schema";
import { clamp } from "../mvu/helpers";
import {
  classifyWeapon, classifyArmor, classifyMaterial, durabilityBand,
  QUALITY_TIERS, WEAPON_CLASSES,
  type WeaponClass, type ArmorClass, type MaterialDef, type QualityDef, type QualityTier,
} from "../content/westeros/gear";
import type { AimZone, DuelBand } from "../content/westeros/combatArts";

/** Mọi từ khoá tra được từ một món đồ (tên, đặc tính, chất liệu, visual class). */
export function gearWords(item: EquipItem | undefined): string[] {
  if (!item) return [];
  return [
    ...(item["Đặc Tính"] ?? []),
    item["Tên"] ?? "",
    item["Chất Liệu"] ?? "",
    item["VisualClass"] ?? "",
    item["Phẩm Chất"] ?? "",
  ].filter(Boolean).map((s) => String(s).toLowerCase());
}

// ── VŨ KHÍ ──────────────────────────────────────────────────────────────────

export interface WeaponProfile {
  /** món đồ gốc (undefined = tay không). */
  item?: EquipItem;
  cls: WeaponClass;
  material: MaterialDef;
  quality: QualityDef;
  durability: number;
  durabilityLabel: string;

  /** xúc xắc sát thương cuối cùng. */
  dice: string;
  /** cộng thẳng vào sát thương. */
  damageBonus: number;
  /** cộng vào chỉ số đánh trúng. */
  accuracy: number;
  /** tổng xuyên giáp. */
  armorPierce: number;
  /** sát thương lên Thăng Bằng. */
  poise: number;
  /** dải cự ly dùng được. */
  bands: DuelBand[];
  twoHanded: boolean;
  /** cắt qua giáp như thép Valyria / obsidian. */
  cutsThroughArmor: boolean;
  /** giết được Others và Người Chết. */
  slaysSupernatural: boolean;
  /** trường phái chiêu thức món vũ khí này mở. */
  school: string;
  /** đã gãy — đánh như tay không. */
  broken: boolean;
  /** dòng giải thích cho UI. */
  lines: string[];
}

/** Nhân xúc xắc lên theo hệ số sức mạnh: "1d8" ×1.5 → "1d12". */
function scaleDice(dice: string, factor: number): string {
  const m = dice.match(/^(\d*)d(\d+)$/i);
  if (!m) return dice;
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const scaled = Math.round(sides * factor);
  // ép về các mặt xúc xắc quen thuộc để bảng số đọc vẫn ra dáng D&D
  const ladder = [3, 4, 6, 8, 10, 12, 20];
  const nearest = ladder.reduce((a, b) => (Math.abs(b - scaled) < Math.abs(a - scaled) ? b : a), ladder[0]);
  return `${count}d${nearest}`;
}

export function resolveWeapon(item: EquipItem | undefined): WeaponProfile {
  const words = gearWords(item);
  const cls = item ? classifyWeapon(words) : WEAPON_CLASSES["tay-khong"];
  const material = item ? classifyMaterial(words) : { ...classifyMaterial([]), power: 1, pierce: 0, durability: 1, weight: 1 };
  const qualityId = (item?.["Phẩm Chất"] ?? "Thường") as QualityTier;
  const quality = QUALITY_TIERS[qualityId] ?? QUALITY_TIERS["Thường"];
  const durability = item?.["Độ Bền"] ?? 100;
  const band = durabilityBand(durability);
  const broken = durability <= 0;

  const power = material.power * quality.power * band.power;
  const enhance = item?.["Cấp Cường Hóa"] ?? 0;

  const lines = [
    `${cls.name} — ${cls.desc}`,
    `Vật liệu ${material.name}: ${material.desc}`,
    `Phẩm chất ${qualityId}: ${quality.desc}`,
    `Độ bền ${Math.round(durability)} (${band.label}) — ${band.desc}`,
  ];

  return {
    item,
    cls, material, quality,
    durability, durabilityLabel: band.label,
    dice: broken ? WEAPON_CLASSES["tay-khong"].dice : scaleDice(cls.dice, power),
    damageBonus: Math.round((item?.["Thuộc Tính"]?.["Sát Thương Cận"] ?? 0) * power) + enhance,
    accuracy: cls.speed + quality.accuracy + band.accuracy + Math.floor(enhance / 2),
    armorPierce: Math.round(cls.armorPierce + material.pierce + (item?.["Thuộc Tính"]?.["Xuyên Giáp"] ?? 0)),
    poise: Math.round(cls.poise * power),
    bands: broken ? WEAPON_CLASSES["tay-khong"].bands : cls.bands,
    twoHanded: cls.twoHanded,
    cutsThroughArmor: !!material.cutsThroughArmor,
    slaysSupernatural: !!material.slaysSupernatural,
    school: broken ? "bac-thu" : cls.school,
    broken,
    lines,
  };
}

// ── GIÁP ────────────────────────────────────────────────────────────────────

export interface ArmorProfile {
  cls: ArmorClass;
  material: MaterialDef;
  quality: QualityDef;
  /** giảm sát thương THEO VÙNG cơ thể. */
  zones: Record<AimZone, number>;
  /** trọng lượng tổng — trừ Nhanh Nhẹn và Thăng Bằng. */
  weight: number;
  /** phạt Nhanh Nhẹn do giáp nặng. */
  agilityPenalty: number;
  /** phạt Thăng Bằng hồi mỗi vòng. */
  poisePenalty: number;
  /** có mũ giáp che đầu không. */
  helm: boolean;
  shield: boolean;
  lines: string[];
}

const ZERO_ZONES: Record<AimZone, number> = { "Ngẫu Nhiên": 0, "Đầu": 0, "Thân": 0, "Tay": 0, "Chân": 0 };

/**
 * Giáp che THEO VÙNG. Đây là thứ khiến việc "nhắm vào đâu" trong đấu tay đôi
 * trở thành quyết định thật: một hiệp sĩ giáp tấm gần như không thể bổ vào ngực,
 * nhưng khoeo chân và nách thì vẫn hở.
 */
export function resolveArmor(equipped: StatData["Trang Bị Đang Mặc"]): ArmorProfile {
  const body = equipped["Giáp Thân"];
  const helmItem = equipped["Mũ/Nón"];
  const shieldItem = equipped["Khiên"];

  const words = gearWords(body);
  const cls = classifyArmor(words);
  const material = classifyMaterial(words);
  const qualityId = (body?.["Phẩm Chất"] ?? "Thường") as QualityTier;
  const quality = QUALITY_TIERS[qualityId] ?? QUALITY_TIERS["Thường"];
  const durability = body?.["Độ Bền"] ?? 100;
  const band = durabilityBand(durability);

  const power = material.power * quality.power * band.power;
  const baseDr = (cls.dr + (body?.["Thuộc Tính"]?.["Phòng Thủ"] ?? 0) * 0.25) * power;

  const zones: Record<AimZone, number> = { ...ZERO_ZONES };
  for (const zone of ["Đầu", "Thân", "Tay", "Chân"] as AimZone[]) {
    // vùng giáp không phủ vẫn được chút ít nhờ áo lót và may mắn
    zones[zone] = Math.round(cls.covers.includes(zone) ? baseDr : baseDr * 0.3);
  }

  // mũ giáp riêng: đây là thứ duy nhất cứu được cái đầu
  const helmProfile = helmItem ? classifyArmor(gearWords(helmItem)) : null;
  if (helmItem) {
    const helmQ = QUALITY_TIERS[(helmItem["Phẩm Chất"] ?? "Thường") as QualityTier] ?? QUALITY_TIERS["Thường"];
    zones["Đầu"] += Math.round((3 + (helmProfile?.dr ?? 0) * 0.4 + (helmItem["Thuộc Tính"]?.["Phòng Thủ"] ?? 0) * 0.3) * helmQ.power);
  }

  // khiên che thân và tay bên cầm khiên
  if (shieldItem) {
    const shQ = QUALITY_TIERS[(shieldItem["Phẩm Chất"] ?? "Thường") as QualityTier] ?? QUALITY_TIERS["Thường"];
    const shDr = Math.round((2 + (shieldItem["Thuộc Tính"]?.["Phòng Thủ"] ?? 0) * 0.3) * shQ.power);
    zones["Thân"] += shDr;
    zones["Tay"] += Math.round(shDr * 0.5);
  }

  zones["Ngẫu Nhiên"] = Math.round((zones["Đầu"] * 0.1 + zones["Thân"] * 0.55 + zones["Tay"] * 0.2 + zones["Chân"] * 0.15));

  const weight = cls.weight * material.weight + (shieldItem ? 1.5 : 0) + (helmItem ? 1 : 0);

  const lines = [
    `${cls.name} — ${cls.desc}`,
    body ? `Vật liệu ${material.name} · phẩm chất ${qualityId} · độ bền ${Math.round(durability)} (${band.label})` : "Không mặc giáp thân",
    `Che chắn: đầu ${zones["Đầu"]} · thân ${zones["Thân"]} · tay ${zones["Tay"]} · chân ${zones["Chân"]}`,
  ];

  return {
    cls, material, quality, zones, weight,
    agilityPenalty: Math.floor(weight / 3),
    poisePenalty: Math.floor(weight / 2),
    helm: !!helmItem,
    shield: !!shieldItem,
    lines,
  };
}

// ── HAO MÒN ─────────────────────────────────────────────────────────────────

/**
 * Mòn dần sau mỗi đòn. Đồ tốt và vật liệu tốt mòn chậm hơn nhiều — thép Valyria
 * gần như không bao giờ cùn, còn obsidian thì vỡ sau vài nhát.
 */
export function wearOf(profile: { material: MaterialDef; quality: QualityDef }, hits = 1): number {
  const resist = Math.max(0.15, profile.material.durability * profile.quality.durability);
  return hits / resist;
}

/** Trừ độ bền tại chỗ (engine chiến đấu gọi trực tiếp trên bản sao trang bị). */
export function applyWear(item: EquipItem | undefined, amount: number): void {
  if (!item) return;
  item["Độ Bền"] = clamp(Math.round((item["Độ Bền"] ?? 100) - amount), 0, 100);
}

// ── SỬA CHỮA ────────────────────────────────────────────────────────────────

export interface RepairQuote {
  ok: boolean;
  /** chi phí tính bằng ĐỒNG ĐỎ. */
  cost: number;
  /** lượng độ bền hồi được (thợ giỏi hơn thì hồi nhiều hơn). */
  restored: number;
  /** vật liệu quý cần có; rỗng = chỉ cần vàng. */
  material?: string;
  reason?: string;
}

/**
 * Báo giá sửa một món đồ. Cấp Rèn Đúc của người sửa quyết định hồi được bao
 * nhiêu — và có những thứ không thợ rèn phàm nào chạm vào được.
 */
export function quoteRepair(item: EquipItem | undefined, smithingLevel: number): RepairQuote {
  if (!item) return { ok: false, cost: 0, restored: 0, reason: "Không có món đồ nào ở ô này." };
  const dur = item["Độ Bền"] ?? 100;
  if (dur >= 100) return { ok: false, cost: 0, restored: 0, reason: "Món đồ vẫn còn nguyên vẹn." };

  const words = gearWords(item);
  const material = classifyMaterial(words);
  const quality = QUALITY_TIERS[(item["Phẩm Chất"] ?? "Thường") as QualityTier] ?? QUALITY_TIERS["Thường"];

  if (material.cutsThroughArmor && material.id === "Thép Valyria") {
    return {
      ok: false, cost: 0, restored: 0,
      reason: "Không thợ rèn nào còn sống biết cách rèn lại thép Valyria. Chỉ lửa rồng và bí thuật đã thất truyền mới làm được.",
    };
  }
  if (material.id === "Obsidian") {
    return {
      ok: false, cost: 0, restored: 0,
      reason: "Hắc diện thạch không sửa được — vỡ rồi thì chỉ còn cách đẽo một lưỡi mới.",
    };
  }

  const missing = 100 - dur;
  // thợ vụng chỉ vá tạm; bậc thầy trả lại gần như nguyên trạng
  const restored = Math.round(missing * clamp(0.35 + smithingLevel * 0.07, 0.35, 1));
  const cost = Math.round(missing * 12 * quality.power * material.power);
  return { ok: true, cost, restored, material: material.id === "Thép" ? undefined : material.id };
}

// ── TÓM TẮT CHO UI ──────────────────────────────────────────────────────────

export interface GearSummary {
  weapon: WeaponProfile;
  offhand: WeaponProfile | undefined;
  armor: ArmorProfile;
  /** cảnh báo cần hiện đỏ trên bảng trang bị. */
  warnings: string[];
}

export function summarizeGear(equipped: StatData["Trang Bị Đang Mặc"]): GearSummary {
  const weapon = resolveWeapon(equipped["Vũ Khí Chính"]);
  const offhandItem = equipped["Vũ Khí Phụ"];
  const offhand = offhandItem ? resolveWeapon(offhandItem) : undefined;
  const armor = resolveArmor(equipped);

  const warnings: string[] = [];
  if (weapon.broken) warnings.push(`${weapon.item?.["Tên"] ?? "Vũ khí chính"} đã GÃY — đang đánh như tay không.`);
  else if (weapon.durability < 30) warnings.push(`${weapon.item?.["Tên"] ?? "Vũ khí"} sắp hỏng (${Math.round(weapon.durability)}%).`);
  if (weapon.twoHanded && equipped["Khiên"]) {
    warnings.push(`${weapon.cls.name} phải cầm hai tay — không dùng khiên cùng lúc được.`);
  }
  if (weapon.twoHanded && offhandItem) {
    warnings.push(`${weapon.cls.name} chiếm cả hai tay — vũ khí phụ không dùng được.`);
  }
  if (!armor.helm) warnings.push("Không đội mũ giáp — mọi đòn nhắm vào đầu gần như không bị chặn.");
  if (armor.weight >= 8) warnings.push(`Giáp rất nặng (−${armor.agilityPenalty} Nhanh Nhẹn, −${armor.poisePenalty} hồi Thăng Bằng mỗi vòng).`);

  return { weapon, offhand, armor, warnings };
}

/** Dòng mô tả đầy đủ một món đồ cho tooltip. */
export function describeGear(item: EquipItem | undefined): string {
  if (!item) return "Trống";
  const p = resolveWeapon(item);
  const armor = classifyArmor(gearWords(item));
  // giáp thì mô tả theo lớp giáp, vũ khí thì theo lớp vũ khí
  if (armor.id !== "khong" && p.cls.id === "tay-khong") {
    return [`${item["Tên"]} — ${armor.name}`, armor.desc, `Giảm sát thương nền ${armor.dr}`].join("\n");
  }
  return [
    `${item["Tên"]} — ${p.cls.name}`,
    `${p.dice} sát thương · ${p.accuracy >= 0 ? "+" : ""}${p.accuracy} đánh trúng · xuyên ${p.armorPierce} giáp`,
    `Tầm: ${p.bands.join("/")}${p.twoHanded ? " · hai tay" : ""}`,
    ...p.lines,
  ].join("\n");
}
