// content/westeros/gear.ts
// ============================================================================
// PHÂN LOẠI TRANG BỊ (M23) — vũ khí, giáp, vật liệu và phẩm chất trở thành DỮ
// LIỆU CƠ HỌC thay vì mấy chuỗi mô tả.
//
// Trước M23, một EquipItem chỉ có tên, "Phẩm Chất" và một mảng "Đặc Tính" tự do.
// Engine chiến đấu đoán loại vũ khí bằng cách dò chữ trong tên ("có chữ kiếm thì
// là kiếm"), xúc xắc sát thương gán cứng 1d8, và "Phẩm Chất" từ Thô Kệch tới Vô
// Giá không đổi lấy một điểm nào. Người chơi cầm Ice hay cầm cây gậy đều đánh
// như nhau.
//
// File này khai bốn bảng:
//   • WEAPON_CLASSES  — xúc xắc, tầm với, tốc độ, xuyên giáp, hai tay hay một tay
//   • ARMOR_CLASSES   — che vùng nào, dày bao nhiêu, nặng bao nhiêu
//   • MATERIALS       — thép, thép Valyria, obsidian, xương rồng… mỗi thứ một chất
//   • QUALITY_TIERS   — Thô Kệch → Vô Giá, nhân vào mọi chỉ số và độ bền
//
// Thêm một loại vũ khí = thêm một dòng. Engine (character/gearEngine.ts) đọc
// bảng này và KHÔNG dò chữ nữa.
// ============================================================================

import type { AimZone, DuelBand } from "./combatArts";

// ── VŨ KHÍ ──────────────────────────────────────────────────────────────────

export type WeaponClassId =
  | "dao-gam" | "kiem-ngan" | "kiem-dai" | "trong-kiem" | "kiem-lai"
  | "riu-mot-tay" | "riu-chien" | "chuy" | "bua-chien"
  | "giao" | "truong-thuong" | "kich"
  | "cung-dai" | "cung-ngan" | "no"
  | "tay-khong";

export interface WeaponClass {
  id: WeaponClassId;
  name: string;
  desc: string;
  /** xúc xắc sát thương nền. */
  dice: string;
  /** dải cự ly vũ khí này phát huy. */
  bands: DuelBand[];
  /** cầm hai tay → không mang khiên được. */
  twoHanded: boolean;
  /** xuyên giáp nền. */
  armorPierce: number;
  /** tốc độ: cộng/trừ chỉ số đánh trúng. Dao nhanh, búa tạ chậm. */
  speed: number;
  /** sát thương lên Thăng Bằng đối thủ. */
  poise: number;
  /** trường phái chiêu thức mà vũ khí này mở khoá (khớp ART_SCHOOLS). */
  school: string;
  /** từ khoá để nhận diện từ tên/đặc tính của món đồ trong save cũ. */
  keywords: string[];
}

const W = (
  id: WeaponClassId, name: string, dice: string, bands: DuelBand[],
  opts: Partial<WeaponClass> & { school: string; keywords: string[]; desc: string },
): WeaponClass => ({
  id, name, dice, bands, twoHanded: false, armorPierce: 0, speed: 0, poise: 8, ...opts,
});

export const WEAPON_CLASSES: Record<WeaponClassId, WeaponClass> = {
  "tay-khong": W("tay-khong", "Tay Không", "1d3", ["Áp Sát"], {
    school: "bac-thu", keywords: [], speed: 2, poise: 6,
    desc: "Nắm đấm, khuỷu tay, đầu gối. Không ai chọn đánh tay không — nhưng vũ khí thì rơi được, còn tay thì không.",
  }),
  "dao-gam": W("dao-gam", "Dao Găm", "1d4", ["Áp Sát", "Cận Chiến"], {
    school: "am-thuat", keywords: ["dao", "găm", "dagger", "chuỷ thủ"], speed: 3, armorPierce: 1, poise: 4,
    desc: "Ngắn, nhanh, giấu được trong ống tay áo. Vô dụng khi đối mặt một hàng giáo — chí tử khi kề sát lưng ai đó.",
  }),
  "kiem-ngan": W("kiem-ngan", "Kiếm Ngắn", "1d6", ["Áp Sát", "Cận Chiến"], {
    school: "song-kiem", keywords: ["kiếm ngắn", "kiếm mảnh", "shortsword", "rapier"], speed: 2, poise: 6,
    desc: "Lưỡi mảnh dưới ba gang. Nhanh và linh hoạt, hợp với lối đánh hai tay hai lưỡi của Braavos.",
  }),
  "kiem-dai": W("kiem-dai", "Kiếm Dài", "1d8", ["Cận Chiến"], {
    school: "kiem-khien", keywords: ["kiếm", "sword", "longsword", "trường kiếm"], speed: 1, poise: 8,
    desc: "Thanh kiếm một tay tiêu chuẩn của hiệp sĩ Westeros. Không giỏi nhất việc gì, nhưng không dở việc gì.",
  }),
  "kiem-lai": W("kiem-lai", "Kiếm Lai", "1d10", ["Cận Chiến"], {
    school: "kiem-khien", keywords: ["kiếm lai", "bastard", "hand-and-a-half"], speed: 0, poise: 11,
    desc: "Chuôi dài đủ cho tay rưỡi. Cầm một tay khi có khiên, hai tay khi cần chặt đứt thứ gì đó.",
  }),
  "trong-kiem": W("trong-kiem", "Trọng Kiếm", "2d6", ["Cận Chiến"], {
    school: "trong-binh", keywords: ["trọng kiếm", "greatsword", "đại kiếm"], twoHanded: true, speed: -2, poise: 18, armorPierce: 1,
    desc: "Kiếm hai tay cao ngang vai người. Mỗi nhát là một quyết định — vung rồi thì không rút lại được.",
  }),
  "riu-mot-tay": W("riu-mot-tay", "Rìu Một Tay", "1d8", ["Cận Chiến"], {
    school: "trong-binh", keywords: ["rìu", "axe", "phủ"], speed: 0, poise: 12, armorPierce: 2,
    desc: "Lưỡi rìu dồn hết trọng lượng vào một điểm. Bổ móp giáp xích chỗ mà kiếm chỉ trượt qua.",
  }),
  "riu-chien": W("riu-chien", "Rìu Chiến", "1d12", ["Cận Chiến"], {
    school: "trong-binh", keywords: ["rìu chiến", "đại phủ", "battleaxe"], twoHanded: true, speed: -2, poise: 20, armorPierce: 3,
    desc: "Rìu hai tay của Người Sắt và dân Bắc. Không có gì tinh tế ở đây cả.",
  }),
  "chuy": W("chuy", "Chuỳ Gai", "1d8", ["Cận Chiến"], {
    school: "trong-binh", keywords: ["chuỳ", "mace", "gậy sắt"], speed: -1, poise: 16, armorPierce: 4,
    desc: "Không cần sắc. Giáp tấm không bị cắt — nhưng xương bên dưới vẫn gãy.",
  }),
  "bua-chien": W("bua-chien", "Búa Chiến", "1d12", ["Cận Chiến"], {
    school: "trong-binh", keywords: ["búa", "hammer", "warhammer", "búa chiến"], twoHanded: true, speed: -3, poise: 24, armorPierce: 6,
    desc: "Thứ Robert Baratheon dùng ở Trident. Nó không đâm, không chém — nó chỉ làm mọi thứ bên trong bộ giáp vỡ ra.",
  }),
  "giao": W("giao", "Giáo", "1d8", ["Cận Chiến", "Tầm Xa"], {
    school: "truong-thuong", keywords: ["giáo", "spear", "lao"], speed: 1, poise: 9, armorPierce: 1,
    desc: "Vũ khí phổ biến nhất mọi cuộc chiến từng có. Rẻ, dễ học, và giữ được kẻ địch ở đúng khoảng cách ngươi muốn.",
  }),
  "truong-thuong": W("truong-thuong", "Trường Thương", "1d10", ["Tầm Xa"], {
    school: "truong-thuong", keywords: ["trường thương", "thương", "pike"], twoHanded: true, speed: -1, poise: 12, armorPierce: 2,
    desc: "Bốn thước gỗ tần bì và một mũi thép. Bất khả xâm phạm trước kỵ binh — thảm hoạ khi có kẻ lách được vào trong.",
  }),
  "kich": W("kich", "Kích", "1d10", ["Cận Chiến", "Tầm Xa"], {
    school: "truong-thuong", keywords: ["kích", "halberd", "bardiche"], twoHanded: true, speed: -1, poise: 16, armorPierce: 3,
    desc: "Giáo, rìu và móc trên cùng một cán. Móc được hiệp sĩ xuống khỏi ngựa rồi bổ khi hắn còn nằm.",
  }),
  "cung-dai": W("cung-dai", "Cung Dài", "1d8", ["Tầm Xa"], {
    school: "xa-thuat", keywords: ["cung dài", "cung", "bow", "longbow"], twoHanded: true, speed: 0, poise: 5, armorPierce: 1,
    desc: "Cung gỗ thuỷ tùng cao bằng người bắn. Cần cả đời để luyện — bù lại bắn nhanh gấp ba lần nỏ.",
  }),
  "cung-ngan": W("cung-ngan", "Cung Ngắn", "1d6", ["Cận Chiến", "Tầm Xa"], {
    school: "xa-thuat", keywords: ["cung ngắn", "cung ngựa", "shortbow"], speed: 2, poise: 4,
    desc: "Cung sừng ngắn của kỵ sĩ Dothraki. Bắn được từ trên lưng ngựa đang phi.",
  }),
  "no": W("no", "Nỏ", "1d10", ["Tầm Xa"], {
    school: "xa-thuat", keywords: ["nỏ", "crossbow"], twoHanded: true, speed: -2, poise: 7, armorPierce: 4,
    desc: "Nạp bằng tay quay, chậm tới mức đáng giận. Nhưng một mũi nỏ xuyên qua giáp tấm ở tầm gần, và một đứa trẻ tập một ngày là bắn được.",
  }),
};

export const WEAPON_LIST = Object.values(WEAPON_CLASSES);

// ── GIÁP ────────────────────────────────────────────────────────────────────

export type ArmorClassId = "khong" | "vai-day" | "da-thuoc" | "giap-xich" | "giap-vay" | "giap-tam" | "giap-nghi-le";

export interface ArmorClass {
  id: ArmorClassId;
  name: string;
  desc: string;
  /** giảm sát thương nền ở thân mình. */
  dr: number;
  /** che các vùng này (vùng không che chỉ được nửa giá trị). */
  covers: AimZone[];
  /** nặng: trừ Nhanh Nhẹn và Thăng Bằng hồi mỗi vòng. */
  weight: number;
  keywords: string[];
}

export const ARMOR_CLASSES: Record<ArmorClassId, ArmorClass> = {
  "khong": {
    id: "khong", name: "Không Giáp", dr: 0, covers: [], weight: 0, keywords: [],
    desc: "Áo vải. Nhanh nhẹn tuyệt đối và chết cũng tuyệt đối nhanh.",
  },
  "vai-day": {
    id: "vai-day", name: "Áo Chần Bông", dr: 2, covers: ["Thân"], weight: 1, keywords: ["chần bông", "gambeson", "áo độn", "vải dày"],
    desc: "Nhiều lớp vải khâu chần. Chặn được vết cắt nông và cú đấm — nhưng mũi tên thì đi thẳng qua.",
  },
  "da-thuoc": {
    id: "da-thuoc", name: "Giáp Da", dr: 3, covers: ["Thân", "Tay"], weight: 2, keywords: ["giáp da", "da thuộc", "leather", "giáp nhẹ"],
    desc: "Da luộc cứng lại, đóng đinh tán. Giáp của thợ săn, trinh sát và kẻ phải chạy nhiều hơn phải đứng.",
  },
  "giap-xich": {
    id: "giap-xich", name: "Giáp Xích", dr: 6, covers: ["Thân", "Tay", "Chân"], weight: 5, keywords: ["giáp xích", "mail", "lưới sắt", "áo giáp"],
    desc: "Hàng vạn khoen sắt bấm vào nhau. Chặn gần như mọi nhát chém — nhưng chuỳ và búa thì truyền lực qua nó nguyên vẹn.",
  },
  "giap-vay": {
    id: "giap-vay", name: "Giáp Vảy", dr: 8, covers: ["Thân", "Tay", "Chân"], weight: 6, keywords: ["giáp vảy", "scale", "vảy sắt"],
    desc: "Vảy kim loại khâu chồng lên nền da. Nặng hơn giáp xích, chặn đâm tốt hơn hẳn.",
  },
  "giap-tam": {
    id: "giap-tam", name: "Giáp Tấm", dr: 11, covers: ["Đầu", "Thân", "Tay", "Chân"], weight: 9, keywords: ["giáp tấm", "trọng giáp", "plate", "giáp nặng"],
    desc: "Tấm thép rèn ôm theo thân người. Gần như không thể xuyên bằng lưỡi thép — kẻ mặc nó chỉ chết vì bị đánh ngã rồi đâm qua khe hở, hoặc vì kiệt sức.",
  },
  "giap-nghi-le": {
    id: "giap-nghi-le", name: "Giáp Nghi Lễ", dr: 4, covers: ["Thân"], weight: 4, keywords: ["nghi lễ", "mạ vàng", "ceremonial", "trang trí"],
    desc: "Đẹp tới mức người ta quên mất nó là giáp. Nặng như thật, chắc bằng nửa — dùng để đứng trong sảnh, không phải để đứng trong trận.",
  },
};

export const ARMOR_LIST = Object.values(ARMOR_CLASSES);

// ── VẬT LIỆU ────────────────────────────────────────────────────────────────

export interface MaterialDef {
  id: string;
  name: string;
  desc: string;
  /** nhân vào sát thương vũ khí / giảm sát thương của giáp. */
  power: number;
  /** cộng xuyên giáp. */
  pierce: number;
  /** nhân vào độ bền — thứ nào mòn nhanh, thứ nào không bao giờ mòn. */
  durability: number;
  /** nhân vào trọng lượng giáp. */
  weight: number;
  /** bỏ qua phần lớn giáp (Valyria/obsidian). */
  cutsThroughArmor?: boolean;
  /** giết được thứ siêu nhiên. */
  slaysSupernatural?: boolean;
  keywords: string[];
}

export const MATERIALS: Record<string, MaterialDef> = {
  "Gỗ": {
    id: "Gỗ", name: "Gỗ", power: 0.6, pierce: 0, durability: 0.5, weight: 0.7, keywords: ["gỗ", "wood"],
    desc: "Gậy và chĩa của dân binh. Gãy sau vài trận, nhưng ai cũng kiếm được.",
  },
  "Đồng": {
    id: "Đồng", name: "Đồng", power: 0.8, pierce: 0, durability: 0.7, weight: 1.1, keywords: ["đồng", "bronze"],
    desc: "Thứ Người Tiền Nhân dùng trước khi Andal mang thép tới. Mềm, nặng, và vẫn giết người được.",
  },
  "Sắt": {
    id: "Sắt", name: "Sắt", power: 0.9, pierce: 0, durability: 0.85, weight: 1, keywords: ["sắt", "iron"],
    desc: "Sắt rèn thô. Rẻ và có mặt khắp nơi.",
  },
  "Thép": {
    id: "Thép", name: "Thép", power: 1.0, pierce: 0, durability: 1, weight: 1, keywords: ["thép", "steel"],
    desc: "Tiêu chuẩn của Westeros. Không có gì đặc biệt, và đó chính là điều tốt.",
  },
  "Thép Castle-forged": {
    id: "Thép Castle-forged", name: "Thép Lâu Đài", power: 1.15, pierce: 1, durability: 1.3, weight: 0.95,
    keywords: ["castle-forged", "thép lâu đài", "thép tinh luyện"],
    desc: "Thép do thợ rèn lâu đài luyện nhiều lượt. Giữ lưỡi lâu hơn hẳn thép chợ.",
  },
  "Thép Valyria": {
    id: "Thép Valyria", name: "Thép Valyria", power: 1.5, pierce: 6, durability: 3, weight: 0.55,
    cutsThroughArmor: true, slaysSupernatural: true, keywords: ["valyrian", "valyria", "thép valyria"],
    desc: "Rèn bằng bí thuật và có lẽ cả lửa rồng. Nhẹ hơn, sắc hơn, không bao giờ cùn — và không ai còn biết cách làm ra nó nữa.",
  },
  "Obsidian": {
    id: "Obsidian", name: "Hắc Diện Thạch", power: 0.85, pierce: 4, durability: 0.3,
    weight: 0.6, cutsThroughArmor: true, slaysSupernatural: true, keywords: ["obsidian", "hắc diện thạch", "dragonglass", "kính rồng"],
    desc: "Thuỷ tinh núi lửa, sắc hơn mọi lưỡi thép và giòn như băng. Vỡ sau vài nhát — nhưng nó giết được thứ mà thép không giết được.",
  },
  "Xương Rồng": {
    id: "Xương Rồng", name: "Xương Rồng", power: 1.1, pierce: 2, durability: 1.6, weight: 0.5,
    keywords: ["xương rồng", "dragonbone"],
    desc: "Đen như hắc ngọc, nhẹ hơn gỗ và cứng hơn thép. Cung làm bằng xương rồng bắn xa gấp rưỡi.",
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

// ── PHẨM CHẤT ───────────────────────────────────────────────────────────────

export type QualityTier =
  "Thô Kệch" | "Thường" | "Tinh Xảo" | "Thượng Hạng" | "Thép Valyria" | "Huyền Thoại" | "Độc Nhất" | "Vô Giá";

export interface QualityDef {
  id: QualityTier;
  desc: string;
  /** nhân vào sát thương / giảm sát thương. */
  power: number;
  /** cộng thẳng vào chỉ số đánh trúng (đồ cân tay tốt thì trúng dễ hơn). */
  accuracy: number;
  /** nhân vào tốc mòn độ bền — đồ tốt bền hơn. */
  durability: number;
}

export const QUALITY_TIERS: Record<QualityTier, QualityDef> = {
  "Thô Kệch": { id: "Thô Kệch", power: 0.75, accuracy: -2, durability: 0.6, desc: "Thợ làng gò vội. Lưỡi lệch, chuôi lỏng, và ai cũng thấy điều đó." },
  "Thường": { id: "Thường", power: 1.0, accuracy: 0, durability: 1, desc: "Đồ quân nhu tiêu chuẩn. Làm đúng việc của nó." },
  "Tinh Xảo": { id: "Tinh Xảo", power: 1.12, accuracy: 1, durability: 1.3, desc: "Thợ giỏi làm cẩn thận. Cầm lên là thấy khác ngay ở trọng tâm." },
  "Thượng Hạng": { id: "Thượng Hạng", power: 1.25, accuracy: 2, durability: 1.6, desc: "Đặt riêng, cân theo tay chủ nhân. Của một lãnh chúa, không phải của một người lính." },
  "Thép Valyria": { id: "Thép Valyria", power: 1.5, accuracy: 3, durability: 3, desc: "Vân khói chạy dọc lưỡi. Cả Westeros còn chưa tới hai trăm thanh." },
  "Huyền Thoại": { id: "Huyền Thoại", power: 1.6, accuracy: 3, durability: 3.5, desc: "Có tên riêng, có bài hát riêng, và có một danh sách những người đã chết vì nó." },
  "Độc Nhất": { id: "Độc Nhất", power: 1.45, accuracy: 2, durability: 2.5, desc: "Chỉ có một cái trên đời, làm cho đúng một người." },
  "Vô Giá": { id: "Vô Giá", power: 1.7, accuracy: 4, durability: 4, desc: "Thứ mà các vương triều đổi cả một lãnh địa để lấy." },
};

// ── ĐỘ BỀN ──────────────────────────────────────────────────────────────────

export interface DurabilityBand {
  min: number;
  label: string;
  desc: string;
  /** nhân vào sát thương/giảm sát thương của món đồ. */
  power: number;
  /** cộng vào chỉ số đánh trúng. */
  accuracy: number;
}

/**
 * Độ bền không còn chỉ là một con số trang trí: đồ mẻ thì đánh dở đi thấy rõ,
 * và về 0 là gãy hẳn giữa trận.
 */
export const DURABILITY_BANDS: DurabilityBand[] = [
  { min: 80, label: "Nguyên Vẹn", power: 1.0, accuracy: 0, desc: "Còn như mới ra khỏi lò." },
  { min: 55, label: "Sứt Mẻ", power: 0.92, accuracy: 0, desc: "Vài vết mẻ trên lưỡi, vài mắt xích đứt. Chưa ảnh hưởng nhiều." },
  { min: 30, label: "Hư Hại", power: 0.78, accuracy: -1, desc: "Lưỡi cong, chuôi lung lay. Mỗi nhát đánh đều mất một phần lực." },
  { min: 10, label: "Sắp Hỏng", power: 0.55, accuracy: -3, desc: "Sắp gãy tới nơi. Đánh mạnh một nhát nữa là mất luôn vũ khí." },
  { min: 0, label: "Đã Hỏng", power: 0.25, accuracy: -6, desc: "Gãy. Coi như đang cầm một khúc kim loại vô dụng." },
];

export function durabilityBand(dur: number): DurabilityBand {
  return DURABILITY_BANDS.find((b) => dur >= b.min) ?? DURABILITY_BANDS[DURABILITY_BANDS.length - 1];
}

// ── NHẬN DIỆN TỪ MÓN ĐỒ CŨ ──────────────────────────────────────────────────

/**
 * Độ dài của từ khoá DÀI NHẤT khớp được — 0 nếu không khớp gì.
 *
 * Phải so bằng ĐỘ DÀI KHỚP THẬT chứ không phải "lớp nào có từ khoá dài nhất":
 * "trọng kiếm" chứa "kiếm", nên nếu chỉ duyệt theo thứ tự thì Trọng Kiếm luôn
 * bị Kiếm Dài nuốt mất, và "Thép Valyria" luôn bị "Thép" nuốt mất.
 */
function matchScore(words: string[], keywords: string[]): number {
  let best = 0;
  for (const k of keywords) {
    const key = k.toLowerCase();
    for (const w of words) {
      if (w.includes(key) && key.length > best) best = key.length;
    }
  }
  return best;
}

function pickBest<T extends { keywords: string[] }>(words: string[], list: T[], fallback: T): T {
  let best = fallback;
  let bestScore = 0;
  for (const entry of list) {
    const score = matchScore(words, entry.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}

/** Đoán lớp vũ khí từ tên + đặc tính + chất liệu của một EquipItem. */
export function classifyWeapon(words: string[]): WeaponClass {
  return pickBest(words.map((w) => w.toLowerCase()), WEAPON_LIST, WEAPON_CLASSES["tay-khong"]);
}

/** Đoán lớp giáp từ tên + đặc tính. */
export function classifyArmor(words: string[]): ArmorClass {
  return pickBest(words.map((w) => w.toLowerCase()), ARMOR_LIST, ARMOR_CLASSES["khong"]);
}

/** Đoán vật liệu từ tên + đặc tính + trường "Chất Liệu". */
export function classifyMaterial(words: string[]): MaterialDef {
  return pickBest(words.map((w) => w.toLowerCase()), MATERIAL_LIST, MATERIALS["Thép"]);
}
