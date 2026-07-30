// content/westeros/combatArts.ts
// ============================================================================
// NGÂN HÀNG CHIÊU THỨC (Combat Arts — M22) — dữ liệu thuần cho đấu tay đôi.
//
// Trước M22 chỉ có 10 "kỹ năng" chung chung nằm thẳng trong engine: ai cũng có
// đủ, không ai biết chúng khác nhau chỗ nào, và học kiếm mười năm cũng đánh
// giống một tên cướp đường. File này chia lại toàn bộ theo BA TRỤC:
//
//   1. TRƯỜNG PHÁI (school) — "loài" của chiêu thức. Mỗi trường phái buộc vào
//      một kỹ năng trong content/westeros/skills.ts, nên muốn có chiêu của
//      trường phái nào thì phải luyện đúng kỹ năng đó.
//   2. LOẠI ĐÒN (kind)      — Đòn Đánh / Thế Thủ / Cơ Động / Trấn Áp / Bí Kỹ /
//      Hồi Sức. Quyết định chiêu làm gì trong một vòng.
//   3. BẬC (tier)           — Nhập Môn → Thành Thạo → Cao Thủ → Tuyệt Kỹ, gắn
//      với cấp kỹ năng tối thiểu. Tuyệt kỹ đòi cấp 8-9: cả ván có khi chỉ mở
//      được hai ba chiêu.
//
// Điều kiện mở khoá (`req`) nối thẳng vào phần còn lại của game: cấp Kỹ Năng,
// Chỉ Số Cốt Lõi, Thiên Phú, Huyết Mạch, Xuất Thân, Văn Hoá, và ĐẶC TÍNH của
// vũ khí đang cầm. Đổi kiếm sang rìu là bộ chiêu đổi theo.
//
// Chỉnh file này = đổi ngân hàng chiêu thức, KHÔNG đụng engine.
// ============================================================================

import type { CoreStat } from "./skills";

// ── TRỤC 1: TRƯỜNG PHÁI ─────────────────────────────────────────────────────

export type ArtSchoolId =
  | "pho-thong"    // ai cũng biết
  | "kiem-khien"
  | "song-kiem"
  | "truong-thuong"
  | "trong-binh"
  | "xa-thuat"
  | "bac-thu"
  | "ky-chien"
  | "am-thuat"
  | "da-chien"
  | "huyet-thuat";

export interface ArtSchool {
  id: ArtSchoolId;
  name: string;
  /** kỹ năng trong skills.ts quyết định cấp bậc của trường phái này (rỗng = không đòi). */
  skillName: string;
  /** giới thiệu trường phái — hiện ở đầu danh mục chiêu thức. */
  intro: string;
  /** một câu tả chất riêng, cho AI mượn giọng khi kể. */
  flavor: string;
}

export const ART_SCHOOLS: Record<ArtSchoolId, ArtSchool> = {
  "pho-thong": {
    id: "pho-thong", name: "Phổ Thông", skillName: "",
    intro: "Những miếng đánh mà bất cứ ai từng cầm vũ khí đều biết: đâm một nhát, đỡ một đòn, tiến lên hoặc lùi lại. Không đẹp, nhưng cứu mạng nhiều hơn mọi tuyệt kỹ cộng lại.",
    flavor: "Không có trường phái nào cả — chỉ có bản năng của kẻ muốn sống thêm một hiệp.",
  },
  "kiem-khien": {
    id: "kiem-khien", name: "Kiếm & Khiên", skillName: "Kiếm & Khiên",
    intro: "Lối đánh chuẩn mực của hiệp sĩ Westeros: kiếm một tay, khiên tròn hoặc khiên hình giọt nước, trọng tâm thấp. Mạnh ở chỗ bền — người dùng kiếm khiên hiếm khi thắng nhanh, nhưng cũng hiếm khi chết sớm.",
    flavor: "Khiên nâng ngang mắt, mũi kiếm chờ sau vành gỗ, đợi đối thủ phạm sai lầm đầu tiên.",
  },
  "song-kiem": {
    id: "song-kiem", name: "Song Kiếm", skillName: "Song Kiếm",
    intro: "Hai lưỡi thép, không khiên. Ép đối thủ chịu nhiều nhát mỗi vòng và cắt cho họ chảy máu tới chết, đổi lại thân trên gần như phơi ra. Lối đánh của kẻ tin vào tốc độ hơn vào giáp.",
    flavor: "Hai lưỡi vẽ hai vòng cung cắt nhau, không có nhịp nào để thở.",
  },
  "truong-thuong": {
    id: "truong-thuong", name: "Thương Pháp", skillName: "Trường Thương",
    intro: "Giáo, kích, thương dài bốn thước. Cả trường phái xây quanh MỘT nguyên tắc: giữ đối thủ ở đúng cái tầm mà họ chạm không tới mình. Áp sát được vào trong tầm giáo là thế cờ lật ngược.",
    flavor: "Mũi giáo giữ nguyên một điểm trong không khí, buộc đối thủ phải bước vào hoặc bước ra.",
  },
  "trong-binh": {
    id: "trong-binh", name: "Trọng Binh", skillName: "Rìu & Chuỳ",
    intro: "Rìu chiến, chuỳ gai, búa tạ, trọng kiếm hai tay. Không tìm kẽ hở — tự tạo ra kẽ hở bằng cách đập cho giáp móp và xương gãy. Chậm, tốn sức, và không ai muốn ăn trọn một nhát.",
    flavor: "Không có nhát nào là nhát thăm dò. Mỗi cú vung đều định kết thúc trận đấu.",
  },
  "xa-thuat": {
    id: "xa-thuat", name: "Xạ Thuật", skillName: "Cung & Nỏ",
    intro: "Cung dài Dorne, cung sừng, nỏ thép nạp bằng tay quay. Thắng bằng khoảng cách: giữ được tầm xa thì bất khả xâm phạm, để bị áp sát thì thành mồi ngon.",
    flavor: "Ba nhịp thở, dây cung căng tới mang tai, rồi thả.",
  },
  "bac-thu": {
    id: "bac-thu", name: "Bác Thủ", skillName: "Chiến Đấu Tay Không",
    intro: "Đấm, vật, khoá, bẻ. Trường phái duy nhất mạnh lên khi mất vũ khí. Ở cự ly áp sát, một đô vật tay không nguy hiểm hơn một hiệp sĩ cầm trường kiếm.",
    flavor: "Khi thép đã rơi khỏi tay, chỉ còn xương, gân và ý chí.",
  },
  "ky-chien": {
    id: "ky-chien", name: "Kỵ Chiến", skillName: "Cưỡi Ngựa Chiến",
    intro: "Đánh trên lưng ngựa: xung phong bằng thương gỗ tần bì, chém lướt rồi vòng lại. Chiêu của trường phái này chỉ dùng được khi còn ngồi trên yên — ngã ngựa là mất sạch.",
    flavor: "Tám trăm cân thịt và thép lao tới với vận tốc của một cơn lở đá.",
  },
  "am-thuat": {
    id: "am-thuat", name: "Ám Thuật", skillName: "Ẩn Nấp",
    intro: "Cát ném vào mắt, dao tẩm độc, nhát đâm vào sau gáy. Không có gì vinh dự ở đây, chỉ có hiệu quả. Bị bắt gặp dùng những miếng này giữa sân đấu là mất danh tiếng ngay lập tức.",
    flavor: "Kẻ đánh sòng phẳng chết trước kẻ đánh đúng chỗ.",
  },
  "da-chien": {
    id: "da-chien", name: "Dã Chiến", skillName: "",
    intro: "Lối đánh của những dân tộc không học kiếm trong sân tập: Ironborn đổ bộ, Free Folk bên kia Tường, kỵ sĩ Dothraki trên thảo nguyên. Không đội hình, không lễ nghi — chỉ có sự hung bạo được rèn từ nhỏ.",
    flavor: "Họ không gầm lên để doạ ai. Họ gầm lên vì đó là cách họ thở khi đánh nhau.",
  },
  "huyet-thuat": {
    id: "huyet-thuat", name: "Huyết Thuật", skillName: "",
    intro: "Không phải chiêu thức mà là thứ chảy sẵn trong máu: lửa Valyria, cơn lạnh phương Bắc, những thứ Đức Tin gọi là dị giáo. Cực mạnh, cực tốn, và luôn có giá phải trả.",
    flavor: "Có những dòng máu không quên được nơi chúng đã đến.",
  },
};

// ── TRỤC 2: LOẠI ĐÒN ────────────────────────────────────────────────────────

export type ArtKind =
  | "Đòn Đánh"   // gây sát thương
  | "Thế Thủ"    // tăng phòng ngự / thăng bằng
  | "Cơ Động"    // đổi khoảng cách
  | "Trấn Áp"    // gây trạng thái xấu cho địch
  | "Bí Kỹ"      // đòn quyết định, tốn nặng
  | "Hồi Sức";   // lấy lại thể lực / máu

export const ART_KIND_INTRO: Record<ArtKind, string> = {
  "Đòn Đánh": "Miếng tấn công thuần: đổi Thể Lực lấy máu đối thủ.",
  "Thế Thủ": "Không gây sát thương mà mua thời gian — nâng Phòng Thủ, giữ Thăng Bằng, đợi địch hụt hơi.",
  "Cơ Động": "Kéo hoặc đẩy khoảng cách. Ai chọn được cự ly thì người đó chọn luôn cách trận đấu diễn ra.",
  "Trấn Áp": "Không nhắm vào máu mà nhắm vào khả năng chiến đấu: làm mù, phá giáp, đánh gãy thăng bằng.",
  "Bí Kỹ": "Đòn kết liễu. Tốn Thể Lực nặng, thường hở sườn nghiêm trọng, nhưng trúng thì đổi cả cục diện.",
  "Hồi Sức": "Lấy lại hơi. Bỏ một vòng tấn công để không gục vì kiệt sức ở vòng thứ mười.",
};

// ── TRỤC 3: BẬC ─────────────────────────────────────────────────────────────

export type ArtTier = "Nhập Môn" | "Thành Thạo" | "Cao Thủ" | "Tuyệt Kỹ";

/** Cấp kỹ năng tối thiểu ứng với mỗi bậc (0-10 theo thang skills.ts). */
export const TIER_MIN_LEVEL: Record<ArtTier, number> = {
  "Nhập Môn": 0, "Thành Thạo": 3, "Cao Thủ": 6, "Tuyệt Kỹ": 8,
};

export const TIER_INTRO: Record<ArtTier, string> = {
  "Nhập Môn": "Học trong vài tuần ở sân tập. Ai cũng làm được.",
  "Thành Thạo": "Cần vài năm cầm vũ khí thật mới ra được miếng này cho gọn.",
  "Cao Thủ": "Chỉ những kẻ sống sót qua nhiều trận mới có. Đủ để thành danh trong vùng.",
  "Tuyệt Kỹ": "Mỗi thế hệ Westeros có vài người làm được. Người ta hát về họ.",
};

// ── DẢI KHOẢNG CÁCH ─────────────────────────────────────────────────────────

/** Ba dải cự ly của một trận đấu tay đôi (M22 tách "Áp Sát" khỏi "Cận Chiến"). */
export type DuelBand = "Áp Sát" | "Cận Chiến" | "Tầm Xa";

export const DUEL_BANDS: DuelBand[] = ["Áp Sát", "Cận Chiến", "Tầm Xa"];

export const BAND_INTRO: Record<DuelBand, string> = {
  "Áp Sát": "Sát mặt nhau, đủ gần để ngửi thấy hơi thở. Dao găm và đòn vật thống trị; giáo dài và cung gần như vô dụng.",
  "Cận Chiến": "Tầm của kiếm, rìu, chuỳ — cự ly mà phần lớn trận đấu diễn ra.",
  "Tầm Xa": "Cách nhau chục bước. Cung nỏ và giáo dài làm chủ; kẻ cầm dao chỉ còn cách chạy tới.",
};

// ── VÙNG NHẮM ───────────────────────────────────────────────────────────────

/** Vùng cơ thể người chơi chọn nhắm — nối thẳng vào hệ giải phẫu injuryEngine. */
export type AimZone = "Ngẫu Nhiên" | "Đầu" | "Thân" | "Tay" | "Chân";

export interface AimZoneDef {
  id: AimZone;
  name: string;
  desc: string;
  /** cộng vào chỉ số đánh trúng khi nhắm vùng này (âm = khó trúng hơn). */
  hitMod: number;
  /** các bộ phận trong Cơ Thể có thể trúng. */
  parts: string[];
}

export const AIM_ZONES: Record<AimZone, AimZoneDef> = {
  "Ngẫu Nhiên": {
    id: "Ngẫu Nhiên", name: "Không Nhắm", hitMod: 0,
    desc: "Đánh vào chỗ nào hở ra thì đánh. Dễ trúng nhất, nhưng phần lớn nhát rơi vào thân mình có giáp.",
    parts: ["Ngực", "Ngực", "Ngực", "Bụng", "Bụng", "Vai Trái", "Vai Phải", "Sườn Trái", "Sườn Phải", "Bắp Tay Trái", "Bắp Tay Phải", "Đùi Trái", "Đùi Phải", "Đầu"],
  },
  "Đầu": {
    id: "Đầu", name: "Nhắm Đầu", hitMod: -5,
    desc: "Khó trúng nhất và thường bị mũ giáp chặn — nhưng vết thương ở đầu và cổ nhân ba lần sát thương, và có thể kết liễu tại chỗ.",
    parts: ["Đầu", "Đầu", "Cổ"],
  },
  "Thân": {
    id: "Thân", name: "Nhắm Thân", hitMod: 1,
    desc: "Mục tiêu lớn nhất, dễ trúng nhất, cũng là chỗ được che kỹ nhất. Lựa chọn an toàn khi cần chắc ăn.",
    parts: ["Ngực", "Ngực", "Bụng", "Sườn Trái", "Sườn Phải"],
  },
  "Tay": {
    id: "Tay", name: "Nhắm Tay Cầm Vũ Khí", hitMod: -3,
    desc: "Đánh vào cánh tay cầm vũ khí. Sát thương thấp nhưng có cơ hội làm gãy tay — đối thủ mất gần hết uy lực suốt phần còn lại của trận.",
    parts: ["Bắp Tay Phải", "Cẳng Tay Phải", "Bàn Tay Phải", "Vai Phải"],
  },
  "Chân": {
    id: "Chân", name: "Nhắm Chân", hitMod: -2,
    desc: "Chặt vào đùi và khoeo. Ít khi giết được, nhưng đánh sập Thăng Bằng và khiến đối thủ không rút lui nổi.",
    parts: ["Đùi Trái", "Đùi Phải", "Đầu Gối Trái", "Đầu Gối Phải", "Bắp Chân Trái", "Bắp Chân Phải"],
  },
};

// ── ĐỊNH NGHĨA MỘT CHIÊU ────────────────────────────────────────────────────

export interface ArtStatusApply {
  /** id trong statusEffects.STATUS_DEFS. */
  id: string;
  stacks?: number;
  duration?: number;
  /** xác suất dính (1 = luôn luôn). */
  chance?: number;
  /** đối thủ được cứu bằng kiểm định chỉ số này vs DC. */
  save?: { stat: "Thể Chất" | "Nhanh Nhẹn" | "Tinh Tường" | "Trí Tuệ" | "Sức Mạnh"; dc: number };
}

export interface ArtRequirement {
  /** cấp kỹ năng của trường phái (mặc định lấy theo bậc). */
  skillLevel?: number;
  /** chỉ số cốt lõi tối thiểu. */
  stat?: Partial<Record<CoreStat, number>>;
  /** vũ khí đang cầm phải khớp MỘT trong các từ khoá (đặc tính hoặc tên). */
  weaponAny?: string[];
  /** cấm dùng nếu vũ khí khớp từ khoá nào trong đây. */
  weaponNone?: string[];
  /** phải đang cầm khiên. */
  shield?: boolean;
  /** phải đang cầm vũ khí ở tay phụ (song kiếm, dao găm tay trái). */
  offhand?: boolean;
  /** không dùng được khi mặc giáp nặng. */
  noHeavyArmor?: boolean;
  /** huyết mạch phải chứa một trong các chuỗi này. */
  bloodline?: string[];
  /** xuất thân phải chứa một trong các chuỗi này. */
  origin?: string[];
  /** văn hoá/vùng miền phải chứa một trong các chuỗi này. */
  culture?: string[];
  /** phải có một trong các thiên phú (id hoặc tên). */
  talent?: string[];
  /** phải đang trên lưng ngựa. */
  mounted?: boolean;
}

/**
 * Một chiêu thức. Các trường `type/staminaCost/damageMod/hitMod/acMod/critFrom/
 * effect/range/description` giữ nguyên tên từ bản trước để engine cũ và save cũ
 * đọc được; phần còn lại là chiều sâu M22 thêm vào.
 */
export interface CombatArt {
  id: string;
  name: string;
  type: "attack" | "debuff" | "buff" | "heal";
  staminaCost: number;
  damageMod: number;
  hitMod: number;
  acMod: number;
  critFrom: number;
  effect?: string;
  range: "melee" | "ranged" | "any";
  description: string;

  // ── M22 ──
  school: ArtSchoolId;
  kind: ArtKind;
  tier: ArtTier;
  /** câu giới thiệu có màu, cho tooltip và cho AI kể. */
  flavor: string;
  /** dải cự ly dùng được (mặc định suy từ `range`). */
  bands?: DuelBand[];
  /** số nhát đánh trong một lượt (mỗi nhát một lần gieo trúng). */
  hits?: number;
  /** thay xúc xắc vũ khí (chiêu quật, đá, cắn... không dùng lưỡi kiếm). */
  damageDice?: string;
  /** bỏ qua bấy nhiêu điểm Giảm Sát Thương của giáp. */
  armorPierce?: number;
  /** Thăng Bằng đánh vào đối thủ (vỡ thanh này là địch loạng choạng). */
  poiseDamage?: number;
  /** Thăng Bằng chính mình mất khi ra chiêu (số ÂM = chiêu lấy lại thăng bằng). */
  poiseCost?: number;
  /** cộng Thế Chủ Động khi trúng. */
  momentum?: number;
  /** vùng cơ thể chiêu này tự nhắm (ghi đè lựa chọn của người chơi). */
  zoneBias?: AimZone;
  /** số vòng phải chờ trước khi dùng lại. */
  cooldown?: number;
  /** trạng thái gieo lên đối thủ khi trúng. */
  onHit?: ArtStatusApply[];
  /** trạng thái tự khoác lên mình khi ra chiêu. */
  onSelf?: ArtStatusApply[];
  /** hồi Thể Lực (số dương). */
  recoverStamina?: number;
  /** hồi HP (số dương). */
  healHp?: number;
  /** trả giá khi chiêu hỏng: xác suất + trạng thái tự dính. */
  backfire?: { chance: number; status: string; desc: string };
  /** điều kiện mở khoá. */
  req?: ArtRequirement;
}

// Rút gọn khai báo — phần lớn chiêu chỉ khác nhau vài trường.
const A = (art: CombatArt): CombatArt => art;

// ============================================================================
// PHỔ THÔNG — ai cũng có, kể cả nông dân cầm chĩa
// ============================================================================
const PHO_THONG: CombatArt[] = [
  A({
    id: "tan_cong_thuong", name: "Tấn Công Thường", school: "pho-thong", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 4, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, range: "melee",
    description: "Một nhát cơ bản, cân bằng giữa lực và thế đứng. Rẻ Thể Lực nhất — miếng để cầm cự khi đã hụt hơi.",
    flavor: "Không hoa mỹ, không rủi ro. Chỉ là thép đi tìm thịt.",
    bands: ["Áp Sát", "Cận Chiến"], poiseDamage: 4, momentum: 1,
  }),
  A({
    id: "danh_lieu", name: "Đánh Liều", school: "pho-thong", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 12, damageMod: 3, hitMod: 2, acMod: -3, critFrom: 20, range: "melee",
    description: "Dồn cả người vào nhát chém: +3 sát thương, +2 đánh trúng, đổi lại −3 Phòng Thủ suốt vòng.",
    flavor: "Bỏ hết phòng thủ vào một nhát, và cầu cho nó đủ.",
    bands: ["Áp Sát", "Cận Chiến"], poiseDamage: 12, poiseCost: 8, momentum: 2,
  }),
  A({
    id: "phong_thu", name: "Phòng Thủ", school: "pho-thong", kind: "Thế Thủ", tier: "Nhập Môn",
    type: "buff", staminaCost: 6, damageMod: 0, hitMod: -2, acMod: 3, critFrom: 20, range: "any",
    description: "Hạ trọng tâm, thu người sau vũ khí: +3 Phòng Thủ và hồi lại Thăng Bằng, nhưng đòn phản lại yếu.",
    flavor: "Không thắng được bằng cách này. Nhưng cũng không thua được.",
    bands: ["Áp Sát", "Cận Chiến", "Tầm Xa"], poiseCost: -20,
  }),
  A({
    id: "lao_toi", name: "Lao Tới", school: "pho-thong", kind: "Cơ Động", tier: "Nhập Môn",
    type: "buff", staminaCost: 8, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Lao Tới", range: "any",
    description: "Rút ngắn cự ly một bậc. Cách duy nhất để kẻ cầm dao tiếp cận được một cung thủ.",
    flavor: "Ba bước dài, và khoảng an toàn của đối thủ biến mất.",
    bands: ["Cận Chiến", "Tầm Xa"], poiseCost: 5,
  }),
  A({
    id: "rut_lui", name: "Rút Lui", school: "pho-thong", kind: "Cơ Động", tier: "Nhập Môn",
    type: "buff", staminaCost: 8, damageMod: 0, hitMod: 0, acMod: 2, critFrom: 20, effect: "Rút Lui", range: "any",
    description: "Giãn cự ly một bậc và +2 Phòng Thủ khi lùi. Không dùng được khi đang bị ghì.",
    flavor: "Lùi không phải là thua — lùi là chọn lại chỗ đứng.",
    bands: ["Áp Sát", "Cận Chiến"],
  }),
  A({
    id: "lay_hoi", name: "Lấy Hơi", school: "pho-thong", kind: "Hồi Sức", tier: "Nhập Môn",
    type: "heal", staminaCost: 0, damageMod: 0, hitMod: 0, acMod: 1, critFrom: 20, range: "any",
    description: "Bỏ một vòng để thở: hồi 14 Thể Lực và toàn bộ Thăng Bằng. Cả trận dài thắng thua thường nằm ở chỗ ai biết dừng đúng lúc.",
    flavor: "Hai bàn tay chống gối, mắt vẫn không rời đối thủ.",
    bands: ["Áp Sát", "Cận Chiến", "Tầm Xa"], recoverStamina: 14,
    onSelf: [{ id: "Thủ Thế", stacks: 1, duration: 1 }],
  }),
];

// ============================================================================
// KIẾM & KHIÊN
// ============================================================================
const KIEM_KHIEN: CombatArt[] = [
  A({
    id: "gat_kiem", name: "Gạt Kiếm", school: "kiem-khien", kind: "Thế Thủ", tier: "Nhập Môn",
    type: "buff", staminaCost: 5, damageMod: 0, hitMod: 0, acMod: 4, critFrom: 20, range: "melee",
    description: "Dùng thân kiếm gạt đường vào: +4 Phòng Thủ và giữ vững Thăng Bằng. Nền của mọi thứ khác trong trường phái.",
    flavor: "Thép chạm thép, trượt đi, và nhát chém rơi vào khoảng không.",
    bands: ["Cận Chiến"], onSelf: [{ id: "Thủ Thế", stacks: 1, duration: 2 }],
    req: { weaponAny: ["kiếm"] },
  }),
  A({
    id: "thuc_khien", name: "Thúc Khiên", school: "kiem-khien", kind: "Trấn Áp", tier: "Nhập Môn",
    type: "debuff", staminaCost: 7, damageMod: -2, hitMod: 1, acMod: 0, critFrom: 20, range: "melee",
    description: "Đâm cạnh khiên vào mặt đối thủ. Sát thương thấp nhưng đánh mạnh vào Thăng Bằng và có thể gây Chóng Mặt.",
    flavor: "Vành khiên bọc sắt đập vào sống mũi — không đẹp, nhưng hiệu quả kinh khủng.",
    bands: ["Áp Sát", "Cận Chiến"], poiseDamage: 22, damageDice: "1d4", zoneBias: "Đầu",
    onHit: [{ id: "Chóng Mặt", chance: 0.45, save: { stat: "Thể Chất", dc: 12 } }],
    req: { shield: true },
  }),
  A({
    id: "don_chem_ngang", name: "Đòn Chém Ngang", school: "kiem-khien", kind: "Đòn Đánh", tier: "Thành Thạo",
    type: "attack", staminaCost: 9, damageMod: 2, hitMod: 1, acMod: 0, critFrom: 20, range: "melee",
    description: "Chém ngang thân người từ sau vành khiên — an toàn hơn Đánh Liều mà vẫn ra sát thương thật.",
    flavor: "Kiếm ra khỏi bóng khiên đúng một nhịp, rồi lại rút về.",
    bands: ["Cận Chiến"], poiseDamage: 10, momentum: 1, zoneBias: "Thân",
    req: { weaponAny: ["kiếm"], skillLevel: 3 },
  }),
  A({
    id: "phan_kiem", name: "Phản Kiếm", school: "kiem-khien", kind: "Thế Thủ", tier: "Cao Thủ",
    type: "buff", staminaCost: 11, damageMod: 0, hitMod: 0, acMod: 5, critFrom: 20, effect: "Phản Kiếm", range: "melee",
    description: "Thế đỡ chờ phản: +5 Phòng Thủ, và nếu đối thủ đánh trượt trong vòng này thì tự động phản một đòn không tốn Thể Lực.",
    flavor: "Đợi. Đợi. Rồi lưỡi kiếm đi vào đúng khoảng hở mà nhát chém vừa để lại.",
    bands: ["Cận Chiến"], onSelf: [{ id: "Thủ Thế", stacks: 1, duration: 1 }],
    req: { weaponAny: ["kiếm"], skillLevel: 6 },
  }),
  A({
    id: "nhat_kiem_thanh_danh", name: "Nhất Kiếm Thành Danh", school: "kiem-khien", kind: "Bí Kỹ", tier: "Tuyệt Kỹ",
    type: "attack", staminaCost: 22, damageMod: 6, hitMod: 3, acMod: -2, critFrom: 17, range: "melee",
    description: "Một nhát duy nhất nhắm vào khe hở giữa mũ và gối giáp. Ngưỡng chí mạng hạ xuống 17 và bỏ qua 4 điểm giáp.",
    flavor: "Người ta kể lại nhát kiếm ấy trong quán rượu suốt ba mươi năm sau.",
    bands: ["Cận Chiến"], armorPierce: 4, poiseDamage: 18, momentum: 3, cooldown: 3, zoneBias: "Đầu",
    req: { weaponAny: ["kiếm"], skillLevel: 8, stat: { "Nhanh Nhẹn": 13 } },
  }),
];

// ============================================================================
// SONG KIẾM
// ============================================================================
const SONG_KIEM: CombatArt[] = [
  A({
    id: "loat_chem_doi", name: "Loạt Chém Đôi", school: "song-kiem", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 10, damageMod: -1, hitMod: 0, acMod: -1, critFrom: 20, range: "melee",
    description: "Hai nhát trong một vòng, mỗi nhát gieo trúng riêng. Tổng sát thương cao nhưng từng nhát nhẹ nên giáp dày chặn tốt.",
    flavor: "Trái rồi phải, không có khoảng nghỉ giữa hai lưỡi.",
    bands: ["Áp Sát", "Cận Chiến"], hits: 2, damageDice: "1d6", poiseDamage: 6, momentum: 1,
    req: { skillLevel: 2, offhand: true, weaponNone: ["khiên"] },
  }),
  A({
    id: "cat_gan", name: "Cắt Gân", school: "song-kiem", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 9, damageMod: -1, hitMod: 1, acMod: 0, critFrom: 19, range: "melee",
    description: "Rạch vào chỗ mạch máu nông. Gieo Chảy Máu chồng tầng — mỗi tầng rút thêm 2 HP mỗi vòng.",
    flavor: "Không cần giết ngay. Chỉ cần mở đủ nhiều đường cho máu tìm lối ra.",
    bands: ["Áp Sát", "Cận Chiến"], damageDice: "1d6", zoneBias: "Tay",
    onHit: [{ id: "Chảy Máu", stacks: 1, duration: 5, chance: 0.85 }],
    req: { skillLevel: 3, offhand: true, weaponNone: ["khiên"] },
  }),
  A({
    id: "xoay_nguoi_chem", name: "Xoay Người Chém", school: "song-kiem", kind: "Đòn Đánh", tier: "Cao Thủ",
    type: "attack", staminaCost: 15, damageMod: 1, hitMod: -1, acMod: -2, critFrom: 19, range: "melee",
    description: "Ba nhát liên tiếp theo đà xoay người. Rất mạnh trước kẻ đã Mất Thăng Bằng, rất dở nếu trượt.",
    flavor: "Thân người quay như bánh xe, hai lưỡi vẽ thành một vòng thép kín.",
    bands: ["Cận Chiến"], hits: 3, damageDice: "1d6", poiseCost: 12, poiseDamage: 6, momentum: 2, cooldown: 2,
    req: { skillLevel: 6, offhand: true, stat: { "Nhanh Nhẹn": 14 }, weaponNone: ["khiên"] },
  }),
  A({
    id: "vu_dieu_nuoc", name: "Vũ Điệu Nước", school: "song-kiem", kind: "Thế Thủ", tier: "Cao Thủ",
    type: "buff", staminaCost: 10, damageMod: 0, hitMod: 2, acMod: 5, critFrom: 20, effect: "Vũ Điệu Nước", range: "melee",
    description: "Bộ pháp Braavos: +5 Phòng Thủ, +2 đánh trúng và Thăng Bằng hồi nhanh trong hai vòng. Không dùng được khi mặc giáp nặng.",
    flavor: "Thầy dạy kiếm Braavos gọi đó là nhảy múa. Kẻ đối diện gọi đó là không tài nào chạm tới được.",
    bands: ["Cận Chiến"], onSelf: [{ id: "Vũ Điệu Nước", duration: 2 }],
    req: { weaponAny: ["kiếm"], noHeavyArmor: true, origin: ["Braavos"], talent: ["water-dancer", "Vũ Điệu Nước"], skillLevel: 5 },
  }),
];

// ============================================================================
// THƯƠNG PHÁP
// ============================================================================
const TRUONG_THUONG: CombatArt[] = [
  A({
    id: "giu_tam", name: "Giữ Tầm", school: "truong-thuong", kind: "Thế Thủ", tier: "Nhập Môn",
    type: "buff", staminaCost: 6, damageMod: 0, hitMod: 0, acMod: 3, critFrom: 20, effect: "Giữ Tầm", range: "melee",
    description: "Chống đuôi giáo xuống đất, mũi chĩa thẳng: +3 Phòng Thủ và chặn đối thủ áp sát trong vòng này.",
    flavor: "Muốn vào thì phải đi qua mũi giáo trước.",
    bands: ["Cận Chiến", "Tầm Xa"], onSelf: [{ id: "Thủ Thế", stacks: 1, duration: 1 }, { id: "Giữ Tầm", duration: 1 }],
    req: { weaponAny: ["thương", "giáo", "kích", "trường thương"] },
  }),
  A({
    id: "dam_xuyen", name: "Đâm Xuyên", school: "truong-thuong", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 8, damageMod: 1, hitMod: 2, acMod: 0, critFrom: 20, range: "melee",
    description: "Nhát đâm thẳng từ cự ly mà đối thủ chưa chạm tới được: +2 đánh trúng, xuyên 2 điểm giáp.",
    flavor: "Mũi thép tìm chỗ nối giữa hai tấm giáp và ở lại đó.",
    bands: ["Cận Chiến", "Tầm Xa"], armorPierce: 2, poiseDamage: 8, momentum: 1, zoneBias: "Thân",
    req: { weaponAny: ["thương", "giáo", "kích", "trường thương"] },
  }),
  A({
    id: "quet_chan", name: "Quét Chân", school: "truong-thuong", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 10, damageMod: -2, hitMod: 0, acMod: 0, critFrom: 20, range: "melee",
    description: "Quét cán giáo vào khoeo chân. Đánh gãy Thăng Bằng đối thủ mạnh nhất trong cả ngân hàng chiêu thức.",
    flavor: "Cán gỗ móc vào mắt cá, và cả người đổ xuống như cây bị đốn.",
    bands: ["Cận Chiến"], damageDice: "1d4", poiseDamage: 32, zoneBias: "Chân",
    req: { weaponAny: ["thương", "giáo", "kích", "trường thương"], skillLevel: 3 },
  }),
  A({
    id: "day_lui", name: "Đẩy Lui", school: "truong-thuong", kind: "Cơ Động", tier: "Thành Thạo",
    type: "debuff", staminaCost: 9, damageMod: -1, hitMod: 1, acMod: 1, critFrom: 20, effect: "Rút Lui", range: "melee",
    description: "Đâm rồi đẩy để giãn cự ly ra Tầm Xa — nơi cây giáo dài làm chủ trận đấu.",
    flavor: "Không cần thắng ở cự ly của hắn. Chỉ cần kéo hắn về cự ly của mình.",
    bands: ["Áp Sát", "Cận Chiến"], damageDice: "1d6", poiseDamage: 14,
    req: { weaponAny: ["thương", "giáo", "kích", "trường thương"], skillLevel: 3 },
  }),
  A({
    id: "xuyen_giap_kich", name: "Xuyên Giáp Kích", school: "truong-thuong", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 18, damageMod: 5, hitMod: 1, acMod: -3, critFrom: 19, range: "melee",
    description: "Dồn cả trọng lượng cơ thể sau mũi giáo: bỏ qua 6 điểm giáp và gieo Phá Giáp. Miếng chuyên trị trọng kỵ giáp tấm.",
    flavor: "Mũi thép ăn vào tấm ngực giáp với tiếng rít của kim loại bị xé.",
    bands: ["Cận Chiến", "Tầm Xa"], armorPierce: 6, poiseDamage: 16, momentum: 2, cooldown: 2,
    onHit: [{ id: "Phá Giáp", duration: 3 }],
    req: { weaponAny: ["thương", "giáo", "kích", "trường thương"], skillLevel: 6, stat: { "Sức Mạnh": 13 } },
  }),
];

// ============================================================================
// TRỌNG BINH
// ============================================================================
const TRONG_BINH: CombatArt[] = [
  A({
    id: "pha_giap", name: "Phá Giáp", school: "trong-binh", kind: "Trấn Áp", tier: "Nhập Môn",
    type: "debuff", staminaCost: 10, damageMod: -2, hitMod: 0, acMod: 0, critFrom: 20, effect: "Phá Giáp", range: "melee",
    description: "Đập cho giáp móp và đinh tán bung ra: đối thủ mất 3 Phòng Thủ và 1 giáp trong 2 vòng, chồng được 3 tầng.",
    flavor: "Không cần xuyên qua giáp. Chỉ cần biến giáp thành thứ vô dụng.",
    bands: ["Cận Chiến"], poiseDamage: 14,
    onHit: [{ id: "Phá Giáp", stacks: 1, duration: 2 }],
    req: { weaponAny: ["rìu", "chuỳ", "búa", "trọng kiếm", "nặng"] },
  }),
  A({
    id: "bo_thang", name: "Bổ Thẳng", school: "trong-binh", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 13, damageMod: 4, hitMod: -1, acMod: -2, critFrom: 20, range: "melee",
    description: "Nâng vũ khí quá đầu và bổ xuống. Sát thương lớn, đánh nặng vào Thăng Bằng, nhưng hở người suốt đường vung.",
    flavor: "Cả một khoảnh khắc dài để nâng lên, và không có cách nào dừng lại giữa chừng.",
    bands: ["Cận Chiến"], poiseDamage: 20, poiseCost: 10, momentum: 2,
    req: { weaponAny: ["rìu", "chuỳ", "búa", "trọng kiếm", "nặng"] },
  }),
  A({
    id: "pha_khien", name: "Phá Khiên", school: "trong-binh", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 12, damageMod: 0, hitMod: 1, acMod: -1, critFrom: 20, range: "melee",
    description: "Nhắm thẳng vào khiên đối thủ mà bổ. Bổ đôi khiên gỗ, và kẻ mất khiên mất luôn nửa khả năng phòng thủ.",
    flavor: "Gỗ nứt dọc theo thớ, và cánh tay bên dưới tê dại tới tận vai.",
    bands: ["Cận Chiến"], poiseDamage: 24, zoneBias: "Tay",
    onHit: [{ id: "Phá Giáp", stacks: 2, duration: 3, chance: 0.7 }],
    req: { weaponAny: ["rìu", "chuỳ", "búa", "trọng kiếm", "phá khiên"], skillLevel: 3, stat: { "Sức Mạnh": 13 } },
  }),
  A({
    id: "nhat_chem_cuong_no", name: "Nhát Chém Cuồng Nộ", school: "trong-binh", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 16, damageMod: 8, hitMod: 0, acMod: -5, critFrom: 20, effect: "Phá Giáp", range: "melee",
    description: "Vung hết sức bình sinh: +8 sát thương và gieo Phá Giáp, đổi lại −5 Phòng Thủ. Trượt một nhát là mở toang cửa cho đòn phản.",
    flavor: "Tiếng thép rít trong không khí trước khi ai kịp thấy nó đi qua.",
    bands: ["Cận Chiến"], poiseDamage: 26, poiseCost: 16, momentum: 3, armorPierce: 3,
    onHit: [{ id: "Phá Giáp", stacks: 1, duration: 2 }],
    backfire: { chance: 0.25, status: "Mất Thăng Bằng", desc: "vung hụt và mất đà" },
    req: { weaponAny: ["rìu", "chuỳ", "búa", "trọng kiếm", "nặng"], stat: { "Sức Mạnh": 15 }, skillLevel: 5 },
  }),
  A({
    id: "bua_ta_dinh_nui", name: "Búa Tạ Định Núi", school: "trong-binh", kind: "Bí Kỹ", tier: "Tuyệt Kỹ",
    type: "attack", staminaCost: 24, damageMod: 10, hitMod: -2, acMod: -6, critFrom: 19, range: "melee",
    description: "Nhát bổ dùng cả trọng lượng cơ thể rơi xuống. Xuyên 8 giáp, gần như chắc chắn làm đối thủ Choáng nếu trúng đầu.",
    flavor: "Thứ giết người này không cần sắc. Nó chỉ cần đủ nặng.",
    bands: ["Cận Chiến"], armorPierce: 8, poiseDamage: 40, poiseCost: 22, momentum: 3, cooldown: 4,
    onHit: [{ id: "Choáng", chance: 0.5, save: { stat: "Thể Chất", dc: 15 } }],
    backfire: { chance: 0.3, status: "Mất Thăng Bằng", desc: "cả người theo đà búa lao về trước" },
    req: { weaponAny: ["rìu", "chuỳ", "búa", "trọng kiếm", "nặng"], stat: { "Sức Mạnh": 16 }, skillLevel: 8 },
  }),
];

// ============================================================================
// XẠ THUẬT
// ============================================================================
const XA_THUAT: CombatArt[] = [
  A({
    id: "ban_ten", name: "Bắn Tên", school: "xa-thuat", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 5, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, range: "ranged",
    description: "Một mũi tên nhắm thẳng. Rẻ và đều — miếng nuôi trận của mọi cung thủ.",
    flavor: "Rút, đặt, kéo, thả. Bốn nhịp lặp lại tới khi hết ống tên.",
    bands: ["Tầm Xa"], momentum: 1,
    req: { weaponAny: ["cung", "nỏ"] },
  }),
  A({
    id: "ban_tia", name: "Bắn Tỉa", school: "xa-thuat", kind: "Đòn Đánh", tier: "Thành Thạo",
    type: "attack", staminaCost: 12, damageMod: 4, hitMod: 1, acMod: 0, critFrom: 19, range: "ranged",
    description: "Ngắm lâu hơn để lấy chỗ hiểm: +4 sát thương và ngưỡng chí mạng 19.",
    flavor: "Thở ra một nửa, giữ lại, rồi thả dây đúng khoảng lặng giữa hai nhịp tim.",
    bands: ["Tầm Xa"], poiseDamage: 6, momentum: 1, zoneBias: "Thân",
    req: { weaponAny: ["cung", "nỏ"], skillLevel: 3, stat: { "Tinh Tường": 12 } },
  }),
  A({
    id: "ban_chan_buoc", name: "Bắn Chặn Bước", school: "xa-thuat", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 9, damageMod: -2, hitMod: 1, acMod: 0, critFrom: 20, range: "ranged",
    description: "Ghim mũi tên vào đùi kẻ đang lao tới. Ít sát thương nhưng chặn đối thủ rút ngắn cự ly ở vòng sau.",
    flavor: "Không cần hạ hắn. Chỉ cần hắn không tới được chỗ mình.",
    bands: ["Tầm Xa"], damageDice: "1d6", poiseDamage: 12, zoneBias: "Chân",
    onHit: [{ id: "Chảy Máu", stacks: 1, duration: 3, chance: 0.5 }],
    req: { weaponAny: ["cung", "nỏ"], skillLevel: 3 },
  }),
  A({
    id: "mua_mui_ten", name: "Mưa Mũi Tên", school: "xa-thuat", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 15, damageMod: 6, hitMod: -2, acMod: 0, critFrom: 20, range: "ranged",
    description: "Bắn ba mũi trước khi mũi đầu tiên chạm đất. Độ chính xác giảm nhưng tổng sát thương khủng khiếp.",
    flavor: "Người Dorne bảo đó không phải bắn cung. Đó là làm mưa.",
    bands: ["Tầm Xa"], hits: 3, damageDice: "1d6", momentum: 2, cooldown: 2,
    req: { weaponAny: ["cung"], skillLevel: 6, stat: { "Tinh Tường": 14 } },
  }),
  A({
    id: "mui_ten_dinh_menh", name: "Mũi Tên Định Mệnh", school: "xa-thuat", kind: "Bí Kỹ", tier: "Tuyệt Kỹ",
    type: "attack", staminaCost: 20, damageMod: 5, hitMod: 4, acMod: -2, critFrom: 17, range: "ranged",
    description: "Một mũi duy nhất, nhắm vào khe mắt mũ giáp. Xuyên 5 giáp, ngưỡng chí mạng 17, tự nhắm vùng đầu.",
    flavor: "Cả chiến trường thu lại còn một khe hở rộng bằng hai đốt ngón tay.",
    bands: ["Tầm Xa"], armorPierce: 5, momentum: 3, cooldown: 3, zoneBias: "Đầu",
    req: { weaponAny: ["cung", "nỏ"], skillLevel: 8, stat: { "Tinh Tường": 16 } },
  }),
];

// ============================================================================
// BÁC THỦ (tay không / vật lộn)
// ============================================================================
const BAC_THU: CombatArt[] = [
  A({
    id: "thoi_son", name: "Thoi Sơn", school: "bac-thu", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 5, damageMod: 0, hitMod: 1, acMod: 0, critFrom: 20, range: "melee",
    description: "Đấm thẳng vào mặt. Sát thương thấp nhưng cực rẻ và luôn dùng được, kể cả khi tay trắng.",
    flavor: "Nắm đấm không bao giờ tuột khỏi tay như thanh kiếm.",
    bands: ["Áp Sát"], damageDice: "1d4", poiseDamage: 10, momentum: 1, zoneBias: "Đầu",
  }),
  A({
    id: "vat_nga", name: "Vật Ngã", school: "bac-thu", kind: "Trấn Áp", tier: "Nhập Môn",
    type: "debuff", staminaCost: 9, damageMod: -3, hitMod: 0, acMod: -1, critFrom: 20, range: "melee",
    description: "Ôm ngang hông và quật xuống. Gieo Bị Ghì: đối thủ không rút lui được và mất 3 Phòng Thủ.",
    flavor: "Thép chẳng giúp gì khi lưng đã chạm đất và có kẻ ngồi lên ngực.",
    bands: ["Áp Sát"], damageDice: "1d4", poiseDamage: 26,
    onHit: [{ id: "Bị Ghì", duration: 2, save: { stat: "Sức Mạnh", dc: 13 } }],
  }),
  A({
    id: "ap_sat", name: "Áp Sát", school: "bac-thu", kind: "Cơ Động", tier: "Nhập Môn",
    type: "buff", staminaCost: 7, damageMod: 0, hitMod: 0, acMod: -1, critFrom: 20, effect: "Lao Tới", range: "any",
    description: "Xông vào trong tầm vũ khí đối thủ, kéo trận đấu về cự ly Áp Sát — nơi giáo dài và cung tên thành củi khô.",
    flavor: "Chỗ an toàn nhất trước một cây giáo là đứng sát vào ngực người cầm nó.",
    bands: ["Cận Chiến", "Tầm Xa"], poiseCost: 6,
  }),
  A({
    id: "be_khop", name: "Bẻ Khớp", school: "bac-thu", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 12, damageMod: 0, hitMod: 1, acMod: 0, critFrom: 19, range: "melee",
    description: "Khoá và bẻ ngược khớp tay cầm vũ khí. Có cơ hội gãy tay — đối thủ mất 3 đánh trúng và 3 sát thương tới hết trận.",
    flavor: "Một tiếng rắc rất khẽ, và thanh kiếm rơi xuống đất.",
    bands: ["Áp Sát"], damageDice: "1d6", zoneBias: "Tay",
    onHit: [{ id: "Gãy Tay Cầm Vũ Khí", chance: 0.4, save: { stat: "Sức Mạnh", dc: 14 } }],
    req: { skillLevel: 4 },
  }),
  A({
    id: "khoa_co", name: "Khoá Cổ", school: "bac-thu", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 16, damageMod: 3, hitMod: 0, acMod: -2, critFrom: 18, range: "melee",
    description: "Khoá cánh tay quanh cổ và siết. Bỏ qua toàn bộ giáp, và có thể làm đối thủ ngất tại chỗ.",
    flavor: "Không có tấm giáp nào che được khí quản.",
    bands: ["Áp Sát"], damageDice: "1d6", armorPierce: 99, poiseDamage: 20, cooldown: 2,
    onHit: [{ id: "Choáng", chance: 0.4, save: { stat: "Thể Chất", dc: 15 } }],
    req: { skillLevel: 6, stat: { "Sức Mạnh": 14 } },
  }),
];

// ============================================================================
// KỴ CHIẾN
// ============================================================================
const KY_CHIEN: CombatArt[] = [
  A({
    id: "xung_phong", name: "Xung Phong", school: "ky-chien", kind: "Bí Kỹ", tier: "Nhập Môn",
    type: "attack", staminaCost: 14, damageMod: 7, hitMod: 1, acMod: -2, critFrom: 19, range: "melee",
    description: "Thúc ngựa lao tới với mũi thương chúc xuống. Sát thương khổng lồ ở nhát đầu, nhưng chỉ dùng được từ Tầm Xa và phải chờ vòng sau mới lặp lại được.",
    flavor: "Không phải cánh tay đâm mũi thương. Là cả con ngựa.",
    bands: ["Tầm Xa"], poiseDamage: 34, momentum: 3, cooldown: 2, effect: "Lao Tới",
    req: { mounted: true },
  }),
  A({
    id: "chem_luot", name: "Chém Lướt", school: "ky-chien", kind: "Đòn Đánh", tier: "Thành Thạo",
    type: "attack", staminaCost: 9, damageMod: 2, hitMod: 1, acMod: 2, critFrom: 20, range: "melee",
    description: "Chém một nhát rồi cho ngựa chạy qua. Vừa ra đòn vừa giữ được Phòng Thủ nhờ đà di chuyển.",
    flavor: "Đi qua, để lại một vệt đỏ, và đã ở ngoài tầm với trước khi đối thủ quay người.",
    bands: ["Cận Chiến"], poiseDamage: 10, momentum: 1,
    req: { mounted: true, skillLevel: 3 },
  }),
  A({
    id: "vong_ky", name: "Vòng Kỵ", school: "ky-chien", kind: "Cơ Động", tier: "Thành Thạo",
    type: "buff", staminaCost: 8, damageMod: 0, hitMod: 0, acMod: 3, critFrom: 20, effect: "Rút Lui", range: "any",
    description: "Cho ngựa vòng rộng ra ngoài tầm với: +3 Phòng Thủ và về lại Tầm Xa để chuẩn bị một cú xung phong nữa.",
    flavor: "Kỵ binh không đứng lại đánh. Kỵ binh đi vòng, rồi quay lại.",
    bands: ["Áp Sát", "Cận Chiến"],
    req: { mounted: true, skillLevel: 3 },
  }),
  A({
    id: "dap_vo_ngua", name: "Vó Ngựa Chà Nát", school: "ky-chien", kind: "Trấn Áp", tier: "Cao Thủ",
    type: "debuff", staminaCost: 13, damageMod: 2, hitMod: -1, acMod: -1, critFrom: 20, range: "melee",
    description: "Điều ngựa dựng lên và giẫm xuống kẻ đã ngã. Sát thương nặng vào Thăng Bằng, cực mạnh khi đối thủ đang Mất Thăng Bằng.",
    flavor: "Tám trăm cân xuống trên một tấm giáp ngực — âm thanh ấy không giống bất cứ thứ gì khác.",
    bands: ["Áp Sát", "Cận Chiến"], poiseDamage: 30, damageDice: "1d8", zoneBias: "Thân",
    req: { mounted: true, skillLevel: 6 },
  }),
];

// ============================================================================
// ÁM THUẬT
// ============================================================================
const AM_THUAT: CombatArt[] = [
  A({
    id: "nem_cat", name: "Ném Cát", school: "am-thuat", kind: "Trấn Áp", tier: "Nhập Môn",
    type: "debuff", staminaCost: 5, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Mù Lòa", range: "any",
    description: "Hất một nắm cát hoặc bụi vào mắt. Đối thủ được kiểm định Tinh Tường để tránh; dính thì −4 đánh trúng một vòng.",
    flavor: "Danh dự là thứ xa xỉ của kẻ đã thắng.",
    bands: ["Áp Sát", "Cận Chiến"],
    onHit: [{ id: "Mù Lòa", duration: 1, save: { stat: "Tinh Tường", dc: 15 } }],
  }),
  A({
    id: "nham_chi_mang", name: "Nhắm Chí Mạng", school: "am-thuat", kind: "Đòn Đánh", tier: "Nhập Môn",
    type: "attack", staminaCost: 15, damageMod: 0, hitMod: -5, acMod: 0, critFrom: 19, range: "melee",
    description: "Bỏ qua mọi chỗ dễ đánh để tìm đúng một khe hở chí mạng: rất khó trúng, nhưng ngưỡng chí mạng hạ xuống 19 và xuyên 3 giáp.",
    flavor: "Kiên nhẫn chờ đúng nửa nhịp thở mà tấm giáp nách hé ra.",
    bands: ["Áp Sát", "Cận Chiến"], armorPierce: 3, momentum: 2,
  }),
  A({
    id: "dao_tam_doc", name: "Dao Tẩm Độc", school: "am-thuat", kind: "Trấn Áp", tier: "Thành Thạo",
    type: "debuff", staminaCost: 8, damageMod: -1, hitMod: 1, acMod: 0, critFrom: 19, range: "melee",
    description: "Một vết cắt nông là đủ. Gieo Trúng Độc: 3 HP và 2 Thể Lực mỗi vòng, chồng tới 3 tầng, giáp không đỡ được.",
    flavor: "Không cần vết thương sâu. Chỉ cần vết thương hở.",
    bands: ["Áp Sát", "Cận Chiến"], damageDice: "1d4", armorPierce: 2,
    onHit: [{ id: "Trúng Độc", stacks: 1, duration: 6, save: { stat: "Thể Chất", dc: 14 } }],
    req: { skillLevel: 3, talent: ["poisoner", "Độc Dược"] },
  }),
  A({
    id: "dam_len", name: "Đâm Lén", school: "am-thuat", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 14, damageMod: 4, hitMod: 2, acMod: -1, critFrom: 18, range: "melee",
    description: "Đòn chỉ dùng được khi đối thủ đang Mù Lòa, Choáng hoặc Mất Thăng Bằng — khi đó nhân đôi sát thương và bỏ qua toàn bộ giáp.",
    flavor: "Chờ tới đúng khoảnh khắc hắn không nhìn thấy gì. Rồi mới ra tay.",
    bands: ["Áp Sát", "Cận Chiến"], armorPierce: 99, momentum: 2, cooldown: 2, zoneBias: "Thân",
    req: { skillLevel: 6, stat: { "Nhanh Nhẹn": 13 } },
  }),
];

// ============================================================================
// DÃ CHIẾN (văn hoá)
// ============================================================================
const DA_CHIEN: CombatArt[] = [
  A({
    id: "gam_thet", name: "Gầm Thét", school: "da-chien", kind: "Trấn Áp", tier: "Nhập Môn",
    type: "debuff", staminaCost: 6, damageMod: 0, hitMod: 0, acMod: -1, critFrom: 20, range: "any",
    description: "Tiếng gầm chiến trận. Đối thủ kiểm định Trí Tuệ, thất bại thì dính Khiếp Sợ: −2 đánh trúng và −2 sát thương.",
    flavor: "Âm thanh ấy có trước ngôn ngữ, và cơ thể người ta vẫn còn nhớ nó.",
    bands: ["Áp Sát", "Cận Chiến", "Tầm Xa"],
    onHit: [{ id: "Khiếp Sợ", stacks: 1, duration: 3, save: { stat: "Trí Tuệ", dc: 13 } }],
    req: { culture: ["Ironborn", "Người Sắt", "Free Folk", "Man Tộc", "Dothraki", "Bắc"] },
  }),
  A({
    id: "cuong_chien", name: "Cuồng Chiến", school: "da-chien", kind: "Thế Thủ", tier: "Thành Thạo",
    type: "buff", staminaCost: 12, damageMod: 0, hitMod: 0, acMod: -2, critFrom: 20, range: "any",
    description: "Thả cho cơn giận chiếm lấy: +2 sát thương mỗi tầng Cuồng Nộ (tới 3 tầng), đổi lại −2 Phòng Thủ mỗi tầng. Càng bị thương càng lên tầng nhanh.",
    flavor: "Đau không còn là tín hiệu dừng lại. Đau trở thành nhiên liệu.",
    bands: ["Áp Sát", "Cận Chiến"],
    onSelf: [{ id: "Cuồng Nộ", stacks: 1, duration: 4 }],
    req: { culture: ["Ironborn", "Người Sắt", "Free Folk", "Man Tộc", "Dothraki", "Bắc"], talent: ["berserker", "Cuồng Chiến"] },
  }),
  A({
    id: "don_dau_bua", name: "Đòn Đầu Búa", school: "da-chien", kind: "Đòn Đánh", tier: "Thành Thạo",
    type: "attack", staminaCost: 11, damageMod: 3, hitMod: 0, acMod: -2, critFrom: 19, range: "melee",
    description: "Húc đầu, cắn, thúc cùi chỏ — mọi thứ không có trong sách dạy kiếm. Rất mạnh ở cự ly Áp Sát.",
    flavor: "Hiệp sĩ gọi đó là bẩn thỉu. Người Sắt gọi đó là thứ Ba tuần trước.",
    bands: ["Áp Sát"], poiseDamage: 22, momentum: 2, damageDice: "1d8", zoneBias: "Đầu",
    onHit: [{ id: "Chảy Máu", stacks: 1, duration: 3, chance: 0.5 }],
    req: { culture: ["Ironborn", "Người Sắt", "Free Folk", "Man Tộc", "Dothraki"] },
  }),
  A({
    id: "arakh_xoay", name: "Arakh Xoay", school: "da-chien", kind: "Bí Kỹ", tier: "Cao Thủ",
    type: "attack", staminaCost: 15, damageMod: 4, hitMod: 1, acMod: -2, critFrom: 18, range: "melee",
    description: "Lưỡi arakh cong móc vào chỗ giáp hở rồi kéo ngược. Hai nhát, mỗi nhát có thể gieo Chảy Máu.",
    flavor: "Lưỡi cong không đâm. Nó móc, và nó kéo.",
    bands: ["Cận Chiến"], hits: 2, damageDice: "1d6", momentum: 2,
    onHit: [{ id: "Chảy Máu", stacks: 1, duration: 4, chance: 0.6 }],
    req: { culture: ["Dothraki"], skillLevel: 5 },
  }),
];

// ============================================================================
// HUYẾT THUẬT (huyết mạch / dị thuật)
// ============================================================================
const HUYET_THUAT: CombatArt[] = [
  A({
    id: "khe_lua", name: "Khè Lửa", school: "huyet-thuat", kind: "Thế Thủ", tier: "Cao Thủ",
    type: "buff", staminaCost: 20, damageMod: 0, hitMod: 0, acMod: 0, critFrom: 20, effect: "Cơn Thịnh Nộ Rồng", range: "any",
    description: "Đánh thức huyết mạch Valyria: +5 sát thương và +1 đánh trúng trong 3 vòng. Tốn Thể Lực khủng khiếp.",
    flavor: "Hơi nóng bốc lên từ da thịt như từ mặt đá phơi nắng cả ngày.",
    bands: ["Áp Sát", "Cận Chiến", "Tầm Xa"],
    onSelf: [{ id: "Cơn Thịnh Nộ Rồng", duration: 3 }],
    req: { bloodline: ["Valyria", "Targaryen"] },
  }),
  A({
    id: "mau_tien_nhan_bung", name: "Máu Tiền Nhân Trỗi Dậy", school: "huyet-thuat", kind: "Hồi Sức", tier: "Thành Thạo",
    type: "heal", staminaCost: 0, damageMod: 0, hitMod: 0, acMod: 2, critFrom: 20, range: "any",
    description: "Sức sống của First Men: hồi 22 Thể Lực và 10 HP, gỡ sạch Kiệt Sức. Mỗi trận chỉ dùng được một lần.",
    flavor: "Có thứ gì đó rất cũ trong dòng máu ấy, và nó chưa từng học cách bỏ cuộc.",
    bands: ["Áp Sát", "Cận Chiến", "Tầm Xa"], recoverStamina: 22, healHp: 10, cooldown: 99,
    req: { bloodline: ["Tiền Nhân", "First Men"] },
  }),
  A({
    id: "hoi_tho_bang", name: "Hơi Thở Băng", school: "huyet-thuat", kind: "Trấn Áp", tier: "Cao Thủ",
    type: "debuff", staminaCost: 16, damageMod: 0, hitMod: 1, acMod: 0, critFrom: 20, range: "any",
    description: "Cái lạnh của Trường Dạ tràn qua chiến trường: gieo Tê Cóng 2 tầng, đối thủ mất chính xác và không giữ nổi Thăng Bằng.",
    flavor: "Sương giá bò lên lưỡi kiếm, và hơi thở đóng thành băng ngay trước miệng.",
    bands: ["Cận Chiến", "Tầm Xa"], armorPierce: 99,
    onHit: [{ id: "Tê Cóng", stacks: 2, duration: 5, save: { stat: "Thể Chất", dc: 15 } }],
    req: { talent: ["greenseer", "warg", "Chiêm Mộng", "Nhập Hồn Thú"], bloodline: ["Tiền Nhân", "First Men", "Stark"] },
  }),
  A({
    id: "bong_lua_rhllor", name: "Bóng Lửa R'hllor", school: "huyet-thuat", kind: "Bí Kỹ", tier: "Tuyệt Kỹ",
    type: "attack", staminaCost: 26, damageMod: 9, hitMod: 2, acMod: -2, critFrom: 19, range: "any",
    description: "Gọi lửa của Thần Ánh Sáng. Bỏ qua toàn bộ giáp, gieo Bỏng 2 tầng — nhưng có thể quay lại đốt chính người gọi.",
    flavor: "Đêm tối và đầy nỗi kinh hoàng, nhưng ngọn lửa thì không hỏi ai là chủ nó.",
    bands: ["Cận Chiến", "Tầm Xa"], armorPierce: 99, momentum: 3, cooldown: 4,
    onHit: [{ id: "Bỏng", stacks: 2, duration: 3 }],
    backfire: { chance: 0.2, status: "Bỏng", desc: "ngọn lửa liếm ngược về phía người gọi" },
    req: { talent: ["rhllor-chosen", "Thuật Lửa"] },
  }),
];

// ============================================================================
// TỔNG HỢP
// ============================================================================

export const COMBAT_ARTS: CombatArt[] = [
  ...PHO_THONG, ...KIEM_KHIEN, ...SONG_KIEM, ...TRUONG_THUONG, ...TRONG_BINH,
  ...XA_THUAT, ...BAC_THU, ...KY_CHIEN, ...AM_THUAT, ...DA_CHIEN, ...HUYET_THUAT,
];

export const ARTS_BY_ID: Record<string, CombatArt> =
  Object.fromEntries(COMBAT_ARTS.map((a) => [a.id, a]));

export const ARTS_BY_SCHOOL: Record<ArtSchoolId, CombatArt[]> = COMBAT_ARTS.reduce((acc, a) => {
  (acc[a.school] ||= []).push(a);
  return acc;
}, {} as Record<ArtSchoolId, CombatArt[]>);

export const ARTS_BY_KIND: Record<ArtKind, CombatArt[]> = COMBAT_ARTS.reduce((acc, a) => {
  (acc[a.kind] ||= []).push(a);
  return acc;
}, {} as Record<ArtKind, CombatArt[]>);

/** Dải cự ly dùng được của một chiêu (suy từ `range` nếu chiêu không khai rõ). */
export function artBands(art: CombatArt): DuelBand[] {
  if (art.bands && art.bands.length > 0) return art.bands;
  if (art.range === "ranged") return ["Tầm Xa"];
  if (art.range === "melee") return ["Áp Sát", "Cận Chiến"];
  return [...DUEL_BANDS];
}

export function artUsableAt(art: CombatArt, band: DuelBand): boolean {
  return artBands(art).includes(band);
}

// ── ĐIỀU KIỆN MỞ KHOÁ ───────────────────────────────────────────────────────

/** Hồ sơ một đấu sĩ để xét chiêu nào mở được — dựng từ StatData hoặc từ attrs AI. */
export interface ArtHolder {
  /** Kỹ Năng: tên tiếng Việt → cấp (khớp state["Kỹ Năng"]). */
  skills: Record<string, number>;
  /** Chỉ Số Cốt Lõi: tên → giá trị. */
  stats: Partial<Record<CoreStat, number>>;
  /** đặc tính + tên vũ khí chính, đã hạ chữ thường. */
  weaponWords: string[];
  hasShield: boolean;
  /** đang cầm vũ khí ở tay phụ. */
  hasOffhand: boolean;
  heavyArmor: boolean;
  bloodline: string;
  origin: string;
  culture: string;
  /** id và/hoặc tên thiên phú. */
  talents: string[];
  mounted: boolean;
}

export function emptyHolder(): ArtHolder {
  return {
    skills: {}, stats: {}, weaponWords: [], hasShield: false, hasOffhand: false, heavyArmor: false,
    bloodline: "", origin: "", culture: "", talents: [], mounted: false,
  };
}

function matchesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

function wordHit(words: string[], needles: string[]): boolean {
  return words.some((w) => needles.some((n) => w.includes(n.toLowerCase())));
}

/** Cấp kỹ năng của trường phái một chiêu thuộc về (trường phái không gắn kỹ năng → 10). */
export function schoolLevel(holder: ArtHolder, school: ArtSchoolId): number {
  const name = ART_SCHOOLS[school].skillName;
  if (!name) return 10;
  return holder.skills[name] ?? 0;
}

export interface ArtGateResult {
  ok: boolean;
  /** lý do chưa mở được — hiện thẳng trên UI để người chơi biết phải luyện gì. */
  reasons: string[];
}

/** Xét một chiêu có mở được cho hồ sơ này không, kèm lý do nếu chưa. */
export function checkArt(art: CombatArt, holder: ArtHolder): ArtGateResult {
  const reasons: string[] = [];
  const req = art.req ?? {};

  const needLevel = req.skillLevel ?? TIER_MIN_LEVEL[art.tier];
  const schoolName = ART_SCHOOLS[art.school].skillName;
  if (schoolName && needLevel > 0) {
    const have = schoolLevel(holder, art.school);
    if (have < needLevel) reasons.push(`${schoolName} cấp ${needLevel} (đang ${have})`);
  }

  for (const [stat, min] of Object.entries(req.stat ?? {})) {
    const have = holder.stats[stat as CoreStat] ?? 0;
    if (have < (min as number)) reasons.push(`${stat} ${min} (đang ${have})`);
  }

  if (req.weaponAny && !wordHit(holder.weaponWords, req.weaponAny)) {
    reasons.push(`vũ khí phù hợp: ${req.weaponAny.join(" / ")}`);
  }
  if (req.weaponNone && wordHit(holder.weaponWords, req.weaponNone)) {
    reasons.push(`không dùng được khi mang ${req.weaponNone.join(" / ")}`);
  }
  if (req.shield && !holder.hasShield) reasons.push("phải mang khiên");
  if (req.offhand && !holder.hasOffhand) reasons.push("phải cầm vũ khí ở tay phụ");
  if (req.noHeavyArmor && holder.heavyArmor) reasons.push("không mặc được giáp nặng");
  if (req.mounted && !holder.mounted) reasons.push("phải đang trên lưng ngựa");

  if (req.bloodline && !matchesAny(holder.bloodline, req.bloodline)) {
    reasons.push(`huyết mạch ${req.bloodline.join(" / ")}`);
  }
  if (req.origin && req.talent) {
    // xuất thân HOẶC thiên phú đều mở được (học ở Braavos, hoặc có thầy dạy riêng)
    const okOrigin = matchesAny(holder.origin, req.origin);
    const okTalent = holder.talents.some((t) => matchesAny(t, req.talent!));
    if (!okOrigin && !okTalent) {
      reasons.push(`xuất thân ${req.origin.join(" / ")} hoặc thiên phú ${req.talent.join(" / ")}`);
    }
  } else {
    if (req.origin && !matchesAny(holder.origin, req.origin)) {
      reasons.push(`xuất thân ${req.origin.join(" / ")}`);
    }
    if (req.talent && !holder.talents.some((t) => matchesAny(t, req.talent!))) {
      reasons.push(`thiên phú ${req.talent.join(" / ")}`);
    }
  }
  if (req.culture && !matchesAny(holder.culture, req.culture)) {
    reasons.push(`văn hoá ${req.culture.join(" / ")}`);
  }

  return { ok: reasons.length === 0, reasons };
}

/** Toàn bộ chiêu mở được cho hồ sơ này (luôn có ít nhất bộ Phổ Thông). */
export function artsForHolder(holder: ArtHolder): CombatArt[] {
  const out = COMBAT_ARTS.filter((a) => checkArt(a, holder).ok);
  if (out.length === 0) return [...PHO_THONG];
  return out;
}

/** Chiêu chưa mở kèm lý do — cho màn "còn thiếu gì" trong sổ chiêu thức. */
export function lockedArtsForHolder(holder: ArtHolder): { art: CombatArt; reasons: string[] }[] {
  return COMBAT_ARTS
    .map((art) => ({ art, gate: checkArt(art, holder) }))
    .filter((x) => !x.gate.ok)
    .map((x) => ({ art: x.art, reasons: x.gate.reasons }));
}

/** Dòng giới thiệu đầy đủ một chiêu — dùng cho tooltip UI và cho prompt AI. */
export function describeArt(art: CombatArt): string {
  const school = ART_SCHOOLS[art.school];
  const bits: string[] = [`${school.name} · ${art.kind} · ${art.tier}`];
  bits.push(`${art.staminaCost} Thể Lực`);
  bits.push(artBands(art).join("/"));
  if (art.hits && art.hits > 1) bits.push(`${art.hits} nhát`);
  if (art.armorPierce) bits.push(art.armorPierce >= 99 ? "bỏ qua giáp" : `xuyên ${art.armorPierce} giáp`);
  if (art.cooldown) bits.push(art.cooldown >= 99 ? "một lần mỗi trận" : `chờ ${art.cooldown} vòng`);
  return `${art.name} [${bits.join(" · ")}] — ${art.description}`;
}
