/**
 * tourneyData — Dữ liệu đại hội đấu (Tournament) theo lore ASOIAF.
 *
 * Bao gồm:
 * - Danh sách đại hội lớn theo lịch sử (canon)
 * - 5 nội dung thi đấu: Giáo Mã (Joust), Cận Chiến (Melee), Bắn Cung (Archery),
 *   Đua Ngựa (Horse Race), Đấu Kiếm (Sword Duel)
 * - Hệ thống giải thưởng, danh dự, hạng thi đấu
 *
 * Đại hội diễn ra theo mốc lịch sử:
 * - Trước khi bắt đầu (dựa trên năm trong game), engine kiểm tra
 * - AI kể narrative, phát thẻ <tourney> khi phù hợp
 * - Người chơi chọn tham gia nội dung nào
 */

// ═══════════════════════════════════════════════════════════════
//  LOẠI NỘI DUNG THI ĐẤU
// ═══════════════════════════════════════════════════════════════

export type TourneyEventType =
  | "joust"       // Giáo Mã — thương đấu trên ngựa
  | "melee"       // Cận Chiến — đại loạn đấu tay đôi/nhóm
  | "archery"     // Bắn Cung — thi bắn mục tiêu
  | "horse-race"  // Đua Ngựa — tốc độ thuần tuý
  | "sword-duel"; // Đấu Kiếm — 1v1 kiếm thuật

export interface TourneyEventInfo {
  name: string;
  desc: string;
  /** Chỉ số cốt lõi ảnh hưởng kết quả. */
  primaryStat: string;
  secondaryStat: string;
  /** Kỹ năng liên quan (nếu có). */
  relevantSkill?: string;
  /** Số vòng thi. */
  rounds: number;
  /** Thưởng Vàng cơ bản cho nhất. */
  goldPrize: number;
  /** Thưởng Uy Dũng. */
  gloryReward: number;
}

export const TOURNEY_EVENTS: Record<TourneyEventType, TourneyEventInfo> = {
  joust: {
    name: "Giáo Mã",
    desc: "Thương đấu trên ngựa — hai kỵ sĩ phi thẳng vào nhau, cố hạ đối thủ khỏi yên. Vinh dự tối cao của đại hội.",
    primaryStat: "Sức Mạnh",
    secondaryStat: "Nhanh Nhẹn",
    relevantSkill: "lance-horse",
    rounds: 4,   // 4 vòng: vòng loại → tứ kết → bán kết → chung kết
    goldPrize: 500,
    gloryReward: 15,
  },
  melee: {
    name: "Cận Chiến Đại Loạn",
    desc: "Hàng chục kỵ sĩ giao tranh cùng lúc — kẻ đứng cuối cùng thắng. Thô bạo, hỗn loạn, nhưng vinh quang.",
    primaryStat: "Thể Chất",
    secondaryStat: "Sức Mạnh",
    relevantSkill: "sword-shield",
    rounds: 3,   // 3 pha: mở đầu → hỗn chiến → chung kết
    goldPrize: 300,
    gloryReward: 10,
  },
  archery: {
    name: "Bắn Cung",
    desc: "Thi bắn trúng bia từ khoảng cách xa dần — chính xác tuyệt đối hoặc bị loại.",
    primaryStat: "Tinh Tường",
    secondaryStat: "Nhanh Nhẹn",
    relevantSkill: "bow",
    rounds: 3,   // 3 khoảng cách: 50m → 80m → 100m
    goldPrize: 150,
    gloryReward: 5,
  },
  "horse-race": {
    name: "Đua Ngựa",
    desc: "Cuộc đua ngựa quanh trường đấu — tốc độ, chiến thuật đường đua, và đôi khi cả thủ đoạn.",
    primaryStat: "Nhanh Nhẹn",
    secondaryStat: "Tinh Tường",
    relevantSkill: "riding",
    rounds: 1,   // 1 cuộc đua duy nhất
    goldPrize: 200,
    gloryReward: 5,
  },
  "sword-duel": {
    name: "Đấu Kiếm",
    desc: "Đấu kiếm 1v1 theo luật danh dự — 3 ván, kẻ thắng 2 giành chiến thắng.",
    primaryStat: "Nhanh Nhẹn",
    secondaryStat: "Sức Mạnh",
    relevantSkill: "sword-shield",
    rounds: 3,   // best of 3
    goldPrize: 200,
    gloryReward: 8,
  },
};

// ═══════════════════════════════════════════════════════════════
//  ĐẠI HỘI ĐẤU CANON (lịch sử ASOIAF)
// ═══════════════════════════════════════════════════════════════

export interface CanonTourney {
  id: string;
  name: string;
  /** Năm AC diễn ra. */
  year: number;
  /** Ngày trong năm (lịch 360 ngày) — khoảng thời gian bắt đầu. */
  dayStart: number;
  /** Thời lượng (ngày). */
  duration: number;
  /** Vị trí tổ chức. */
  location: string;
  /** Nhà tổ chức. */
  hostHouse: string;
  /** Nhân vật nổi bật tham gia. */
  notableParticipants: string[];
  /** Mô tả sự kiện. */
  desc: string;
  /** Loại nội dung thi đấu có trong đại hội. */
  events: TourneyEventType[];
  /** Hệ số thưởng (đại hội lớn thưởng nhiều hơn). */
  prizeMultiplier: number;
  /** Tầm quan trọng lore. */
  significance: "minor" | "major" | "legendary";
  /** Sự kiện lore đặc biệt xảy ra tại đại hội. */
  loreEvents?: string[];
}

/**
 * Đại hội đấu canon — sắp xếp theo năm.
 * Chỉ bao gồm đại hội có ghi chép trong sách.
 */
export const CANON_TOURNEYS: CanonTourney[] = [
  // ── Thời Jaehaerys I ──
  {
    id: "maidenville-tourney-98",
    name: "Đại Hội Đấu Maidenpool",
    year: 98,
    dayStart: 120,
    duration: 5,
    location: "Maidenpool",
    hostHouse: "Mooton",
    notableParticipants: ["Jaehaerys I", "Baelon Targaryen"],
    desc: "Đại hội kỷ niệm 50 năm trị vì của Vua Jaehaerys — thời kỳ hoà bình thịnh vượng.",
    events: ["joust", "melee", "archery"],
    prizeMultiplier: 1.5,
    significance: "major",
  },

  // ── Thời Aegon III (sau Dance of Dragons) ──
  {
    id: "kings-landing-tourney-136",
    name: "Đại Hội Đấu King's Landing (Hậu Chiến)",
    year: 136,
    dayStart: 90,
    duration: 7,
    location: "King's Landing",
    hostHouse: "Targaryen",
    notableParticipants: ["Aegon III"],
    desc: "Đại hội đầu tiên sau Vũ Điệu Rồng — nhằm hàn gắn vết thương vương quốc.",
    events: ["joust", "melee", "archery", "horse-race"],
    prizeMultiplier: 2.0,
    significance: "major",
  },

  // ── Thời Daeron I ──
  {
    id: "oldtown-tourney-158",
    name: "Đại Hội Đấu Oldtown",
    year: 158,
    dayStart: 180,
    duration: 5,
    location: "Oldtown",
    hostHouse: "Hightower",
    notableParticipants: ["Daeron I"],
    desc: "Đại hội tại Oldtown kỷ niệm chinh phạt Dorne — trước khi Dorne phản công.",
    events: ["joust", "melee", "sword-duel"],
    prizeMultiplier: 1.5,
    significance: "major",
  },

  // ── Ashford Tourney (Dunk & Egg) ──
  {
    id: "ashford-tourney-209",
    name: "Đại Hội Đấu Ashford Meadow",
    year: 209,
    dayStart: 100,
    duration: 5,
    location: "Ashford Meadow",
    hostHouse: "Ashford",
    notableParticipants: ["Baelor Breakspear", "Maekar Targaryen", "Dunk", "Aerion Brightflame", "Lyonel Baratheon"],
    desc: "Đại hội đấu nơi Ser Duncan the Tall trở thành huyền thoại — và Hoàng Tử Baelor ngã xuống trong phiên xử bằng quyết đấu.",
    events: ["joust", "melee"],
    prizeMultiplier: 2.0,
    significance: "legendary",
    loreEvents: [
      "Aerion Brightflame tấn công Dunk tại lều",
      "Xét xử bằng quyết đấu bảy (Trial of Seven)",
      "Hoàng Tử Baelor Breakspear tử trận",
    ],
  },

  // ── Whitewalls Tourney (Second Blackfyre Rebellion) ──
  {
    id: "whitewalls-tourney-212",
    name: "Đại Hội Đấu Whitewalls",
    year: 212,
    dayStart: 150,
    duration: 3,
    location: "Whitewalls",
    hostHouse: "Butterwell",
    notableParticipants: ["Dunk", "Egg", "Daemon II Blackfyre", "Bloodraven"],
    desc: "Đại hội đấu bề ngoài để kỷ niệm hôn lễ — thực chất là bình phong cho âm mưu Blackfyre lần 2.",
    events: ["joust", "melee"],
    prizeMultiplier: 1.5,
    significance: "legendary",
    loreEvents: [
      "Quả trứng rồng bí ẩn là giải thưởng chính",
      "Daemon II Blackfyre bại lộ và bị bắt",
      "Bloodraven đập tan âm mưu Blackfyre",
    ],
  },

  // ── Tourney thời Maekar I ──
  {
    id: "stonehedge-tourney-222",
    name: "Đại Hội Đấu Stonehedge",
    year: 222,
    dayStart: 200,
    duration: 4,
    location: "Stonehedge",
    hostHouse: "Bracken",
    notableParticipants: ["Aemon Targaryen", "Dunk"],
    desc: "Đại hội đấu thường niên — nơi Ser Duncan tiếp tục ghi danh.",
    events: ["joust", "melee", "archery", "sword-duel"],
    prizeMultiplier: 1.0,
    significance: "minor",
  },

  // ── Tourney at Harrenhal (TRỌNG TÂM) ──
  {
    id: "harrenhal-tourney-281",
    name: "Đại Hội Đấu Harrenhal",
    year: 281,
    dayStart: 60,
    duration: 10,
    location: "Harrenhal",
    hostHouse: "Whent",
    notableParticipants: [
      "Rhaegar Targaryen", "Robert Baratheon", "Ned Stark", "Lyanna Stark",
      "Jaime Lannister", "Barristan Selmy", "Arthur Dayne", "Brandon Stark",
      "Howland Reed", "Ashara Dayne", "Elia Martell",
    ],
    desc: "Đại hội đấu lớn nhất trong lịch sử Westeros. Hoàng Tử Rhaegar trao vòng hoa Nữ Hoàng Tình Yêu và Sắc Đẹp cho Lyanna Stark thay vì vợ mình — gieo mầm cho cuộc nổi loạn sẽ lật đổ triều Targaryen.",
    events: ["joust", "melee", "archery", "horse-race", "sword-duel"],
    prizeMultiplier: 3.0,
    significance: "legendary",
    loreEvents: [
      "Hiệp Sĩ Cây Sậu Cười bí ẩn (Knight of the Laughing Tree)",
      "Rhaegar trao vòng hoa cho Lyanna thay vì Elia",
      "Jaime Lannister 15 tuổi gia nhập Ngự Lâm Quân",
      "Vua Điên Aerys xuất hiện ngoài công chúng",
    ],
  },

  // ── Hand's Tourney (thời Robert) ──
  {
    id: "hands-tourney-298",
    name: "Đại Hội Đấu Bàn Tay",
    year: 298,
    dayStart: 180,
    duration: 7,
    location: "King's Landing",
    hostHouse: "Baratheon",
    notableParticipants: [
      "Gregor Clegane", "Sandor Clegane", "Jaime Lannister", "Loras Tyrell",
      "Barristan Selmy", "Thoros of Myr", "Anguy",
    ],
    desc: "Đại hội đấu kỷ niệm Ned Stark được bổ nhiệm Bàn Tay Nhà Vua. Chi phí khổng lồ — 90.000 rồng vàng cho giải nhất Giáo Mã.",
    events: ["joust", "melee", "archery", "horse-race"],
    prizeMultiplier: 2.5,
    significance: "legendary",
    loreEvents: [
      "Ser Hugh of the Vale chết bởi thương của Gregor Clegane",
      "Loras Tyrell hạ Gregor Clegane bằng chiến thuật ngựa cái",
      "Sandor Clegane chặn cơn thịnh nộ của Gregor",
      "Anguy thắng nội dung Bắn Cung",
    ],
  },

  // ── Tourney at Joffrey's Name Day ──
  {
    id: "joffrey-nameday-tourney-299",
    name: "Đại Hội Đấu Ngày Sinh Joffrey",
    year: 299,
    dayStart: 40,
    duration: 3,
    location: "King's Landing",
    hostHouse: "Baratheon",
    notableParticipants: ["Dontos Hollard", "Sandor Clegane"],
    desc: "Đại hội nhỏ kỷ niệm ngày sinh của Vua Joffrey — nơi Ser Dontos Hollard xuất hiện say rượu và suýt bị xử tử.",
    events: ["joust", "melee"],
    prizeMultiplier: 1.0,
    significance: "minor",
    loreEvents: [
      "Dontos Hollard say rượu, bị Joffrey doạ xử tử",
      "Sansa xin tha mạng cho Dontos",
    ],
  },

  // ── Tourney at King Tommen's Wedding ──
  {
    id: "tommen-wedding-tourney-300",
    name: "Đại Hội Đấu Hôn Lễ Hoàng Gia",
    year: 300,
    dayStart: 100,
    duration: 5,
    location: "King's Landing",
    hostHouse: "Baratheon",
    notableParticipants: ["Loras Tyrell", "Garlan Tyrell"],
    desc: "Đại hội đấu nhân hôn lễ của Vua Tommen và Margaery Tyrell.",
    events: ["joust", "melee", "archery"],
    prizeMultiplier: 2.0,
    significance: "major",
  },
];

// ═══════════════════════════════════════════════════════════════
//  DANH SÁCH ĐỐI THỦ NPC (thi đấu) — có năm sinh/năm mất theo lore
// ═══════════════════════════════════════════════════════════════

export interface TourneyNPC {
  name: string;
  house: string;
  /** Chỉ số tổng hợp (sức mạnh thi đấu). */
  skill: number;
  /** Tên gọi / mô tả ngắn. */
  title: string;
  /** Năm sinh AC (số âm = trước AC). */
  birthYear: number;
  /** Năm mất AC (null = còn sống / chưa biết). */
  deathYear: number | null;
  /** Tuổi tối thiểu để thi đấu (mặc định 15). */
  minAge?: number;
  /** Nếu true, chỉ xuất hiện trong đại hội canon đã liệt kê (không random vào). */
  canonOnly?: boolean;
}

/**
 * NPCs theo lore — mỗi người có birthYear/deathYear.
 * Engine sẽ lọc: chỉ chọn NPC đã sinh VÀ chưa chết tại năm đại hội.
 * 
 * Giai đoạn bao phủ:
 * - Thời Jaehaerys I (≈50-103 AC)
 * - Thời Dunk & Egg (≈200-233 AC)
 * - Thời tiền-Nổi Loạn (≈260-281 AC)
 * - Thời Robert Trị Vì (≈283-298 AC)
 * - Thời Chiến Tranh Năm Vua (≈298-300 AC)
 */
export const GENERIC_TOURNEY_NPCS: TourneyNPC[] = [
  // ────────────────── Thời Jaehaerys I (≈50-103 AC) ──────────────────
  { name: "Ser Ryam Redwyne", house: "Redwyne", skill: 88, title: "Chỉ Huy Ngự Lâm Quân", birthYear: 30, deathYear: 105 },
  { name: "Ser Clement Crabb", house: "Crabb", skill: 55, title: "Kỵ Sĩ Già Cỗi", birthYear: 40, deathYear: 110 },
  { name: "Hoàng Tử Baelon", house: "Targaryen", skill: 78, title: "Xuân Thu Hoàng Tử", birthYear: 57, deathYear: 101 },
  { name: "Hoàng Tử Aemon", house: "Targaryen", skill: 82, title: "Hiệp Sĩ Rồng", birthYear: 55, deathYear: 92 },
  { name: "Ser Lorence Roxton", house: "Roxton", skill: 60, title: "Kỵ Sĩ Xứ Reach", birthYear: 55, deathYear: 130 },

  // ────────────────── Thời Aegon III / Sau Vũ Điệu Rồng (≈130-160 AC) ──────────────────
  { name: "Ser Alyn Velaryon", house: "Velaryon", skill: 70, title: "Sói Biển", birthYear: 115, deathYear: 171 },
  { name: "Ser Marston Waters", house: "Waters", skill: 65, title: "Ngự Lâm Quân", birthYear: 110, deathYear: 153 },
  { name: "Ser Gareth Long", house: "Long", skill: 52, title: "Kỵ Sĩ Hoàng Gia", birthYear: 112, deathYear: 165 },

  // ────────────────── Thời Dunk & Egg (≈200-233 AC) ──────────────────
  { name: "Ser Duncan Cao Lớn", house: "Không Nhà", skill: 72, title: "Dunk Xứ Flea Bottom", birthYear: 192, deathYear: 259 },
  { name: "Hoàng Tử Baelor Kiêu Dũng", house: "Targaryen", skill: 85, title: "Bàn Tay Nhà Vua", birthYear: 170, deathYear: 209, canonOnly: true },
  { name: "Hoàng Tử Maekar", house: "Targaryen", skill: 75, title: "Hoàng Tử Búa Chiến", birthYear: 176, deathYear: 233 },
  { name: "Aerion Brightflame", house: "Targaryen", skill: 68, title: "Ngọn Lửa Rực Rỡ", birthYear: 191, deathYear: 232 },
  { name: "Ser Lyonel Baratheon", house: "Baratheon", skill: 80, title: "Sư Tử Cười", birthYear: 180, deathYear: 240 },
  { name: "Ser Steffon Fossoway", house: "Fossoway", skill: 58, title: "Kỵ Sĩ Táo Xanh", birthYear: 185, deathYear: 250 },
  { name: "Ser Humfrey Hardyng", house: "Hardyng", skill: 55, title: "Kỵ Sĩ Xứ Vale", birthYear: 188, deathYear: 230 },
  { name: "Ser Robyn Rhysling", house: "Rhysling", skill: 50, title: "Kỵ Sĩ Mù", birthYear: 185, deathYear: 240 },
  { name: "Ser Uthor Underleaf", house: "Underleaf", skill: 62, title: "Bóng Cái Lá", birthYear: 180, deathYear: 250 },

  // ────────────────── Thời Tiền-Nổi Loạn (≈260-281 AC) ──────────────────
  { name: "Hoàng Tử Rhaegar", house: "Targaryen", skill: 80, title: "Hoàng Tử Bạc", birthYear: 259, deathYear: 283 },
  { name: "Ser Arthur Dayne", house: "Dayne", skill: 92, title: "Kiếm Sáng Rạng Đông", birthYear: 255, deathYear: 283 },
  { name: "Ser Barristan Selmy", house: "Selmy", skill: 88, title: "Barristan Kiêu Dũng", birthYear: 236, deathYear: null },
  { name: "Robert Baratheon", house: "Baratheon", skill: 82, title: "Búa Chiến Bão Tố", birthYear: 262, deathYear: 298 },
  { name: "Ser Jaime Lannister", house: "Lannister", skill: 85, title: "Giết Vua", birthYear: 266, deathYear: null, minAge: 15 },
  { name: "Ser Oswell Whent", house: "Whent", skill: 72, title: "Ngự Lâm Quân Dơi", birthYear: 248, deathYear: 283 },
  { name: "Ser Gerold Hightower", house: "Hightower", skill: 78, title: "Bò Trắng", birthYear: 230, deathYear: 283 },
  { name: "Ser Jonothor Darry", house: "Darry", skill: 65, title: "Ngự Lâm Quân", birthYear: 240, deathYear: 283 },
  { name: "Ser Lewyn Martell", house: "Martell", skill: 70, title: "Hoàng Tử Ngự Lâm", birthYear: 235, deathYear: 283 },
  { name: "Brandon Stark", house: "Stark", skill: 72, title: "Sói Hoang", birthYear: 262, deathYear: 282, minAge: 15 },
  { name: "Ser Richard Lonmouth", house: "Lonmouth", skill: 60, title: "Hiệp Sĩ Đầu Lâu", birthYear: 258, deathYear: null },

  // ────────────────── Thời Robert Trị Vì + Chiến Tranh Năm Vua (≈283-300 AC) ──────────────────
  { name: "Gregor Clegane", house: "Clegane", skill: 78, title: "Ngọn Núi", birthYear: 265, deathYear: 300 },
  { name: "Sandor Clegane", house: "Clegane", skill: 75, title: "Chó Săn", birthYear: 271, deathYear: null },
  { name: "Ser Loras Tyrell", house: "Tyrell", skill: 72, title: "Hiệp Sĩ Hoa Hồng", birthYear: 282, deathYear: null, minAge: 15 },
  { name: "Ser Garlan Tyrell", house: "Tyrell", skill: 70, title: "Kiếm Sĩ Vườn Hoa", birthYear: 277, deathYear: null },
  { name: "Thoros of Myr", house: "R'hllor", skill: 64, title: "Tư Tế Đỏ", birthYear: 262, deathYear: null },
  { name: "Ser Beric Dondarrion", house: "Dondarrion", skill: 60, title: "Sấm Sét", birthYear: 276, deathYear: 300 },
  { name: "Ser Jorah Mormont", house: "Mormont", skill: 63, title: "Kỵ Sĩ Lưu Đày", birthYear: 254, deathYear: null },
  { name: "Ser Brienne of Tarth", house: "Tarth", skill: 65, title: "Thiếu Nữ Xứ Tarth", birthYear: 280, deathYear: null, minAge: 16 },
  { name: "Bronn", house: "Không Nhà", skill: 67, title: "Lính Đánh Thuê", birthYear: 264, deathYear: null },
  { name: "Ser Arys Oakheart", house: "Oakheart", skill: 60, title: "Ngự Lâm Quân", birthYear: 270, deathYear: 300 },
  { name: "Ser Lothor Brune", house: "Brune", skill: 58, title: "Người Lính Trung Thành", birthYear: 268, deathYear: null },
  { name: "Ser Rodrik Cassel", house: "Stark", skill: 55, title: "Kỵ Sĩ Già Cỗi", birthYear: 245, deathYear: 299 },
  { name: "Ser Hyle Hunt", house: "Hunt", skill: 50, title: "Kỵ Sĩ Tầm Thường", birthYear: 275, deathYear: null },
  { name: "Ser Tallad", house: "Không Nhà", skill: 45, title: "Kỵ Sĩ Trẻ", birthYear: 278, deathYear: null },
  { name: "Ser Mandon Moore", house: "Moore", skill: 62, title: "Ngự Lâm Quân", birthYear: 260, deathYear: 299 },
  { name: "Ser Preston Greenfield", house: "Greenfield", skill: 55, title: "Ngự Lâm Quân", birthYear: 252, deathYear: 299 },
  { name: "Ser Meryn Trant", house: "Trant", skill: 50, title: "Ngự Lâm Quân", birthYear: 260, deathYear: null },
  { name: "Anguy", house: "Không Nhà", skill: 58, title: "Xạ Thủ Dornish Marches", birthYear: 276, deathYear: null },
  { name: "Ser Dontos Hollard", house: "Hollard", skill: 40, title: "Kỵ Sĩ Say Rượu", birthYear: 265, deathYear: 300 },
  { name: "Ser Rolland Storm", house: "Baratheon", skill: 62, title: "Kỵ Sĩ Bão Tố", birthYear: 270, deathYear: null },
  { name: "Yohn Royce", house: "Royce", skill: 68, title: "Đồng Thau Yohn", birthYear: 250, deathYear: null },
  { name: "Ser Vardis Egen", house: "Egen", skill: 58, title: "Đội Trưởng Cận Vệ", birthYear: 255, deathYear: 298 },
  { name: "Ser Lyn Corbray", house: "Corbray", skill: 70, title: "Kẻ Mang Lady Forlorn", birthYear: 260, deathYear: null },
];

/**
 * Lọc NPCs còn sống tại một năm cụ thể.
 * - Đã sinh (birthYear ≤ gameYear)
 * - Chưa chết (deathYear === null HOẶC deathYear ≥ gameYear)
 * - Đủ tuổi thi đấu (gameYear - birthYear ≥ minAge, mặc định 15)
 */
export function getAliveNPCs(gameYear: number): TourneyNPC[] {
  return GENERIC_TOURNEY_NPCS.filter((npc) => {
    const minAge = npc.minAge ?? 15;
    const age = gameYear - npc.birthYear;
    if (age < minAge) return false; // chưa đủ tuổi
    if (npc.deathYear !== null && gameYear > npc.deathYear) return false; // đã chết
    return true;
  });
}

/**
 * Lấy NPCs phù hợp cho một đại hội canon cụ thể.
 * Ưu tiên: notableParticipants (nếu còn sống) + NPCs sống cùng thời.
 * NPC có canonOnly = true chỉ xuất hiện nếu nằm trong notableParticipants.
 */
export function getNPCsForTourney(tourney: CanonTourney): TourneyNPC[] {
  const alive = getAliveNPCs(tourney.year);
  const notableNames = new Set(tourney.notableParticipants);

  // Lọc bỏ canonOnly NPCs không nằm trong danh sách notable
  return alive.filter((npc) => {
    if (npc.canonOnly && !notableNames.has(npc.name)) return false;
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
//  HELPER — tìm đại hội theo năm game
// ═══════════════════════════════════════════════════════════════

/** Tìm các đại hội đang diễn ra hoặc sắp diễn ra. */
export function findUpcomingTourneys(
  year: number,
  day: number,
  range = 30,
): CanonTourney[] {
  return CANON_TOURNEYS.filter((t) => {
    if (t.year !== year) return false;
    const dayDiff = t.dayStart - day;
    return dayDiff >= -t.duration && dayDiff <= range;
  });
}

/** Tìm đại hội đang diễn ra. */
export function findActiveTourney(year: number, day: number): CanonTourney | null {
  return CANON_TOURNEYS.find((t) =>
    t.year === year && day >= t.dayStart && day <= t.dayStart + t.duration,
  ) ?? null;
}

/** Kiểm tra đại hội sắp diễn ra (dùng cho AI prompt injection). */
export function getTourneyHint(year: number, day: number): string | null {
  const upcoming = findUpcomingTourneys(year, day, 30);
  if (upcoming.length === 0) return null;

  return upcoming.map((t) => {
    const daysUntil = t.dayStart - day;
    if (daysUntil > 0) {
      return `[SAU ${daysUntil} NGÀY] ${t.name} tại ${t.location} (${t.events.map((e) => TOURNEY_EVENTS[e].name).join(", ")})`;
    }
    return `[ĐANG DIỄN RA] ${t.name} tại ${t.location}`;
  }).join("\n");
}
