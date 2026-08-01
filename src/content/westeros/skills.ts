// content/westeros/skills.ts
// ============================================================================
// NGÂN HÀNG KỸ NĂNG (Skill Bank) — dữ liệu thuần cho hệ nhân vật (mục 5.1f-D).
// Mỗi kỹ năng: cấp 0-10 (0 chưa biết, 10 bậc thầy), thuộc 1 trong 6 nhóm.
// "primaryStat" = chỉ số cốt lõi mặc định khi kiểm định kỹ năng này (khớp checkMap 5bis.2b).
// "magic:true" = chỉ mở khi có thiên phú ma thuật tương ứng + Era bật (7.15).
// Chỉnh file này = đổi danh mục kỹ năng, KHÔNG đụng engine.
// ============================================================================

export type SkillGroup =
  | "Chiến Đấu" | "Sinh Tồn" | "Xã Hội" | "Trí Tuệ" | "Thủ Công" | "Ma Thuật";

export type CoreStat =
  | "Sức Mạnh" | "Nhanh Nhẹn" | "Thể Chất" | "Trí Tuệ" | "Tinh Tường" | "Uy Tín";

export interface SkillDef {
  id: string;
  name: string;
  group: SkillGroup;
  primaryStat: CoreStat;     // chỉ số dùng khi check kỹ năng này (nối resolveCheck 5bis.2)
  desc: string;
  magic?: boolean;           // cần thiên phú ma thuật + Era
  requiresTalent?: string;   // id thiên phú bắt buộc (cho kỹ năng ma thuật)
}

export const SKILLS: SkillDef[] = [
  // ——— NHÓM CHIẾN ĐẤU ———
  { id: "sword-shield", name: "Kiếm & Khiên", group: "Chiến Đấu", primaryStat: "Sức Mạnh",
    desc: "Chiến đấu với kiếm một tay và khiên — thế trận thủ công cân bằng, phổ biến nhất Westeros." },
  { id: "dual-wield", name: "Song Kiếm", group: "Chiến Đấu", primaryStat: "Nhanh Nhẹn",
    desc: "Đánh hai vũ khí cùng lúc — sát thương cao, phòng thủ kém, đòi khéo léo." },
  { id: "polearm", name: "Trường Thương", group: "Chiến Đấu", primaryStat: "Sức Mạnh",
    desc: "Giáo dài, kích — tầm với xa, khắc kỵ binh (nối binh chủng 11.2b)." },
  { id: "axe-mace", name: "Rìu & Chuỳ", group: "Chiến Đấu", primaryStat: "Sức Mạnh",
    desc: "Vũ khí nặng phá giáp — sát thương lớn, chậm." },
  { id: "bow-crossbow", name: "Cung & Nỏ", group: "Chiến Đấu", primaryStat: "Nhanh Nhẹn",
    desc: "Bắn tầm xa — cung dài (Dorne giỏi) hoặc nỏ nặng." },
  { id: "unarmed", name: "Chiến Đấu Tay Không", group: "Chiến Đấu", primaryStat: "Sức Mạnh",
    desc: "Đấm, vật, khoá — khi mất vũ khí hoặc trong đám đông." },
  { id: "war-riding", name: "Cưỡi Ngựa Chiến", group: "Chiến Đấu", primaryStat: "Nhanh Nhẹn",
    desc: "Chiến đấu trên lưng ngựa — xung phong, đấu thương, cơ động chiến trường." },
  { id: "command", name: "Chỉ Huy Quân", group: "Chiến Đấu", primaryStat: "Trí Tuệ",
    desc: "Điều binh khiển tướng — nối Thống Soái tướng lĩnh (7.7) và inspire_troops (5bis.2b)." },

  // ——— NHÓM SINH TỒN ———
  { id: "tracking", name: "Lần Theo Dấu Vết", group: "Sinh Tồn", primaryStat: "Tinh Tường",
    desc: "Đọc dấu chân, dấu vết — truy tìm người/thú, tránh bị phục kích." },
  { id: "hunting", name: "Săn Bắn", group: "Sinh Tồn", primaryStat: "Tinh Tường",
    desc: "Săn thú kiếm ăn — quan trọng khi hành quân dài, lương cạn." },
  { id: "stealth", name: "Ẩn Nấp", group: "Sinh Tồn", primaryStat: "Nhanh Nhẹn",
    desc: "Đi không tiếng động, trốn khỏi tầm mắt — nền của trộm, do thám, ám sát." },
  { id: "climbing", name: "Leo Trèo", group: "Sinh Tồn", primaryStat: "Sức Mạnh",
    desc: "Trèo vách, tường thành, cây — mở lối đi kẻ khác không ngờ." },
  { id: "weather-endurance", name: "Chịu Đựng Thời Tiết", group: "Sinh Tồn", primaryStat: "Thể Chất",
    desc: "Sống sót trong rét, bão, nắng gắt — cực quan trọng Era Đông/phương Bắc/Trường Dạ." },
  { id: "first-aid", name: "Sơ Cứu", group: "Sinh Tồn", primaryStat: "Trí Tuệ",
    desc: "Băng bó, cầm máu tại chỗ — hồi HP nhẹ ngoài chiến trường." },

  // ——— NHÓM XÃ HỘI ———
  { id: "persuasion", name: "Thuyết Phục", group: "Xã Hội", primaryStat: "Uy Tín",
    desc: "Lay chuyển ai đó bằng lý lẽ và sức hút — check `persuade` (5bis.2b)." },
  { id: "intimidation", name: "Hù Doạ", group: "Xã Hội", primaryStat: "Uy Tín",
    desc: "Ép buộc bằng uy thế và sợ hãi — check `intimidate`." },
  { id: "deception", name: "Lừa Gạt", group: "Xã Hội", primaryStat: "Uy Tín",
    desc: "Nói dối trơn tru, che giấu ý đồ — opposed vs Tinh Tường đối phương." },
  { id: "negotiation", name: "Đàm Phán", group: "Xã Hội", primaryStat: "Uy Tín",
    desc: "Mặc cả điều khoản, thoả thuận — ảnh hưởng giá cả, hiệp ước (nối 12/15)." },
  { id: "court-etiquette", name: "Nghi Thức Cung Đình", group: "Xã Hội", primaryStat: "Uy Tín",
    desc: "Ứng xử đúng lễ nơi triều đình — sai một bước là mất mặt, mất Hảo Cảm quý tộc." },
  { id: "gather-rumor", name: "Thu Thập Tin Đồn", group: "Xã Hội", primaryStat: "Tinh Tường",
    desc: "Moi tin nơi quán xá, chợ búa — cũng dùng để nhận nói dối (detect_lie) và đọc vị (sense_motive)." },

  // ——— NHÓM TRÍ TUỆ ———
  { id: "cunning", name: "Mưu Lược", group: "Trí Tuệ", primaryStat: "Trí Tuệ",
    desc: "Bày mưu, gài bẫy chính trị — nối âm mưu (14), check `scheme`." },
  { id: "lore", name: "Học Vấn", group: "Trí Tuệ", primaryStat: "Trí Tuệ",
    desc: "Sử, luật, gia phả — nhớ tri thức mở thông tin ẩn (recall_lore). Khoá nếu Mù Chữ." },
  { id: "maester-medicine", name: "Y Thuật Maester", group: "Trí Tuệ", primaryStat: "Trí Tuệ",
    desc: "Chẩn và chữa bệnh, thuốc thang — đối phó dịch bệnh (khủng hoảng 8.5b)." },
  { id: "languages", name: "Ngôn Ngữ", group: "Trí Tuệ", primaryStat: "Trí Tuệ",
    desc: "Đọc/nói tiếng lạ — Valyrian, tiếng Man Tộc, thổ ngữ Essos." },
  { id: "cartography", name: "Đọc Bản Đồ & Địa Hình", group: "Trí Tuệ", primaryStat: "Tinh Tường",
    desc: "Đọc thế đất, chọn bãi chiến — cho lợi thế địa hình combat (7.6), check `read_terrain`." },

  // ——— NHÓM THỦ CÔNG ———
  { id: "smithing", name: "Rèn Đúc", group: "Thủ Công", primaryStat: "Sức Mạnh",
    desc: "Rèn vũ khí, giáp — chất lượng đồ ra theo bậc kết quả kiểm định." },
  { id: "cooking", name: "Nấu Ăn", group: "Thủ Công", primaryStat: "Tinh Tường",
    desc: "Nấu tiệc, khẩu phần hành quân — tiệc ngon tăng Hảo Cảm khách dự." },
  { id: "trading", name: "Buôn Bán", group: "Thủ Công", primaryStat: "Uy Tín",
    desc: "Buôn bán kiếm lời, định giá — nối tuyến thương mại (15), check `trade`/`appraise`." },
  { id: "construction", name: "Xây Dựng", group: "Thủ Công", primaryStat: "Trí Tuệ",
    desc: "Chỉ đạo xây công trình — giảm thời gian/chi phí xây (nối lãnh địa 10)." },

  // ——— NHÓM MA THUẬT (gated) ———
  { id: "warging", name: "Nhập Hồn Thú", group: "Ma Thuật", primaryStat: "Tinh Tường",
    desc: "Trườn tâm trí vào thú, nhìn qua mắt chúng — do thám.", magic: true, requiresTalent: "warg" },
  { id: "greensight", name: "Chiêm Mộng", group: "Ma Thuật", primaryStat: "Tinh Tường",
    desc: "Thấy điềm qua giấc mơ xanh — mơ hồ nhưng đúng.", magic: true, requiresTalent: "greenseer" },
  { id: "fire-magic", name: "Thuật Lửa", group: "Ma Thuật", primaryStat: "Trí Tuệ",
    desc: "Phép của R'hllor — bóng lửa, ảo ảnh, hiếm khi cả hồi sinh. Tốn Pháp Lực.", magic: true, requiresTalent: "rhllor-chosen" },
  { id: "poison-craft", name: "Độc Dược", group: "Ma Thuật", primaryStat: "Trí Tuệ",
    desc: "Pha chế và dùng độc — nối ám sát (14.3). (Không cần thiên phú, nhưng bị Đức Tin/luật cấm)" },
  { id: "faceless-art", name: "Nghệ Thuật Vô Diện", group: "Ma Thuật", primaryStat: "Nhanh Nhẹn",
    desc: "Đổi mặt, đội lốt người khác — cực hiếm, nghệ thuật của Faceless Men.", magic: true },
];

export const SKILLS_BY_ID: Record<string, SkillDef> =
  Object.fromEntries(SKILLS.map(s => [s.id, s]));

export const SKILLS_BY_GROUP: Record<SkillGroup, SkillDef[]> = SKILLS.reduce((acc, s) => {
  (acc[s.group] ||= []).push(s); return acc;
}, {} as Record<SkillGroup, SkillDef[]>);

/** Kỹ năng khả dụng ở wizard (Bước 4, mục 8.5): ẩn kỹ năng ma thuật nếu chưa chọn thiên phú tương ứng / Era không có phép. */
export function availableSkills(opts: { eraHasMagic: boolean; chosenTalentIds: string[] }): SkillDef[] {
  return SKILLS.filter(s => {
    if (!s.magic) return true;
    if (!opts.eraHasMagic) return false;
    if (s.requiresTalent) return opts.chosenTalentIds.includes(s.requiresTalent);
    return true; // ma thuật không đòi thiên phú cụ thể (vd poison, faceless) vẫn cần Era phép
  });
}

// GÓI KỸ NĂNG KHỞI ĐIỂM THEO XUẤT THÂN (wizard Bước 1, mục 8.5) — {skillId: cấp cộng thêm}
export const STARTING_SKILLS_BY_ORIGIN: Record<string, Record<string, number>> = {
  "lord-heir":     { "court-etiquette": 3, "command": 3, "lore": 2 },
  "minor-noble":   { "court-etiquette": 3, "lore": 2, "war-riding": 2 },
  "knight":        { "sword-shield": 4, "war-riding": 3 },
  "sellsword":     { "sword-shield": 3, "stealth": 2, "intimidation": 2 },
  "maester-novice":{ "maester-medicine": 4, "lore": 4, "languages": 2 },
  "merchant":      { "trading": 4, "negotiation": 2 },
  "commoner":      { "hunting": 2, "climbing": 2, "smithing": 2 },
  "bastard":       { "sword-shield": 2, "hunting": 2, "stealth": 1 },
  "spy-assassin":  { "stealth": 3, "deception": 3, "poison-craft": 2 },
  "old-blood":     { "lore": 2, "tracking": 2 }, // + kỹ năng ma thuật tuỳ dòng máu (thức tỉnh)
  "dothraki-rider": { "war-riding": 4, "dual-wield": 2, "intimidation": 2 },
  "braavosi-bravo": { "dual-wield": 4, "stealth": 2, "court-etiquette": 1 },
  "magister-heir": { "negotiation": 4, "court-etiquette": 3, "cunning": 2 },
  "ironborn-raider": { "axe-mace": 4, "weather-endurance": 3, "climbing": 1 },
  "wildling-hunter": { "tracking": 4, "hunting": 4, "weather-endurance": 3 },
  "red-priest": { "persuasion": 3, "lore": 3, "fire-magic": 2 },
  "noble-ward": { "court-etiquette": 3, "gather-rumor": 2, "war-riding": 2 },
  "prince-princess": { "court-etiquette": 4, "command": 3, "persuasion": 2 },
  "distant-relative": { "court-etiquette": 2, "deception": 2, "gather-rumor": 2 },
  "royal-bastard": { "sword-shield": 3, "court-etiquette": 2, "intimidation": 2 },
  "sworn-sword": { "sword-shield": 4, "war-riding": 2, "weather-endurance": 1 },
  "time-traveler": {},
  "free-city-artisan": { "smithing": 3, "trading": 2, "languages": 2 },
  "iron-bank-envoy": { "negotiation": 4, "trading": 4, "languages": 3 },
  "unsullied-veteran": { "polearm": 4, "command": 3, "weather-endurance": 3 },
  "freedperson": { "weather-endurance": 3, "gather-rumor": 3, "stealth": 2 },
  "ghiscari-noble": { "court-etiquette": 4, "command": 3, "cunning": 3 },
  "qartheen-pureborn": { "negotiation": 4, "court-etiquette": 3, "deception": 2 },
  "lhazareen-healer": { "first-aid": 4, "cooking": 2, "persuasion": 2 },
  "sellsword-officer": { "command": 4, "sword-shield": 3, "negotiation": 2 },
  "shadowbinder": { "lore": 4, "fire-magic": 3, "poison-craft": 2 },
  "yi-ti-courtier": { "court-etiquette": 4, "lore": 3, "languages": 3 },
  "jogos-nhai-rider": { "war-riding": 4, "bow-crossbow": 3, "tracking": 2 },
  "ibbenese-whaler": { "polearm": 3, "weather-endurance": 4, "cartography": 2 },
  "summer-isles-archer": { "bow-crossbow": 4, "cartography": 3, "weather-endurance": 2 },
  "naathi-healer": { "first-aid": 4, "persuasion": 3, "lore": 2 },
  "basilisk-pirate": { "dual-wield": 3, "cartography": 3, "intimidation": 2 },
  "sothoryi-guide": { "tracking": 4, "hunting": 3, "weather-endurance": 3 },
  "ulthos-wanderer": { "tracking": 4, "cartography": 3, "stealth": 2 },
  "rhoynar-river-sailor": { "cartography": 3, "polearm": 2, "negotiation": 2 },
};
