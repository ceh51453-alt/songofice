import type { CanonCharacter } from "../../../mvu/schema";

export const warOfFiveKingsCharacters: CanonCharacter[] = [
  {
    id: "tywin-lannister", name: "Tywin Lannister", house: "Lannister", role: "Lãnh Chúa Casterly Rock", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Khét tiếng tàn nhẫn, giàu nhất Bảy Vương Quốc. Người thực sự nắm giữ quyền lực của Ngai Sắt từ phía sau.",
    birthYear: 242, age: 56, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 18, "Tinh Tường": 17, "Uy Tín": 18 },
    talentIds: ["schemer", "commander-instinct"],
    skills: { "command": 9, "cunning": 8, "commerce": 8, "intimidation": 9 },
    equipment: [], items: [{ ten: "Vàng Lannister", soLuong: 50000, moTa: "Sự giàu có vô tận" }], gold: 50000, startArmy: { size: 30000, quality: "Tinh Nhuệ" }, startHoldings: ["the-westerlands-seat"], startRegions: ["the-westerlands"]
  },
  {
    id: "jaime-lannister", name: "Jaime Lannister", house: "Lannister", role: "Kẻ Sát Vương", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Hiệp sĩ Vệ Vương giỏi nhất vương quốc, đẹp trai, kiêu ngạo, nhưng mang danh Sát Vương cả đời.",
    birthYear: 266, age: 32, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 17, "Thể Chất": 14, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 15 },
    talentIds: ["born-swordsman", "duelist", "highborn-charm"],
    skills: { "sword-shield": 10, "war-riding": 8, "command": 6, "brawling": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép mạ vàng", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Tuyệt phẩm kiếm thuật" }, { slot: "Giáp Thân", ten: "Giáp Trắng Vệ Vương", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp Vệ Vương" }],
    items: [], gold: 1000, startArmy: { size: 10000, quality: "Thiện Chiến" }
  },
  {
    id: "tyrion-lannister", name: "Tyrion Lannister", house: "Lannister", role: "Quỷ Lùn", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Bị ruồng bỏ vì cơ thể dị dạng, nhưng lại có bộ óc sắc bén nhất vương quốc.",
    birthYear: 273, age: 25, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 7, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 12 },
    talentIds: ["learned", "silver-tongue", "schemer"],
    skills: { "lore": 9, "persuasion": 9, "cunning": 8, "commerce": 7 },
    equipment: [], items: [{ ten: "Sách cổ", soLuong: 5, moTa: "Bộ sưu tập tri thức" }], gold: 5000
  },
  {
    id: "arya-stark", name: "Arya Stark", house: "Stark", role: "Sói Hoang", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Cô con gái út bướng bỉnh nhà Stark, yêu kiếm thuật hơn thêu thùa, ghét sự giả dối của triều đình.",
    birthYear: 289, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 14, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 9 },
    talentIds: ["keen-eye"],
    skills: { "brawling": 3, "stealth": 5, "hunting": 3 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kim", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Thanh kiếm nhỏ do Jon Snow tặng" }], items: [], gold: 10
  },
  {
    id: "sansa-stark", name: "Sansa Stark", house: "Stark", role: "Tiểu Thư Mơ Mộng", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Ưa chuộng bài ca và hiệp sĩ, hoàn hảo cho một cuộc hôn nhân chính trị, nhưng sự ngây thơ sắp bị thử thách.",
    birthYear: 286, age: 12, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 11, "Tinh Tường": 13, "Uy Tín": 16 },
    talentIds: ["highborn-charm"],
    skills: { "court-etiquette": 6, "persuasion": 4, "lore": 4 },
    equipment: [], items: [], gold: 100
  },
  {
    id: "bran-stark", name: "Bran Stark", house: "Stark", role: "Sói Cụt Chân", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Mê leo trèo cho đến khi bị ngã, giờ chỉ còn sức mạnh tâm linh dẫn dắt.",
    birthYear: 290, age: 8, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 3, "Thể Chất": 6, "Trí Tuệ": 14, "Tinh Tường": 17, "Uy Tín": 10 },
    talentIds: ["warg"],
    skills: { "lore": 5, "animal-handling": 6 },
    equipment: [], items: [], gold: 50
  },
  {
    id: "theon-greyjoy", name: "Theon Greyjoy", house: "Greyjoy", role: "Con Tin Sắt", tuocVi: "Thường Dân", religion: "Thần Chết Chìm",
    blurb: "Con tin sống cùng nhà Stark, khao khát được công nhận, ngạo mạn nhưng đầy mặc cảm.",
    birthYear: 279, age: 19, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 13, "Uy Tín": 11 },
    talentIds: ["hot-tempered"],
    skills: { "archery": 8, "sailing": 6, "sword-shield": 5 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Cung Dài Đảo Sắt", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Xa": 5 }, moTa: "Bắn xa rất tốt" }], items: [], gold: 500
  },
  {
    id: "asha-greyjoy", name: "Asha Greyjoy", house: "Greyjoy", role: "Nữ Tướng Đảo Sắt", tuocVi: "Hiệp Sĩ", religion: "Thần Chết Chìm",
    blurb: "Chiến binh kiêu hãnh của Quần Đảo Sắt, người được Balon coi trọng hơn cậu em trai Theon.",
    birthYear: 275, age: 23, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "sailing": 8, "axe-mace": 7, "command": 7, "intimidation": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu chiến", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Rìu của Kraken" }], items: [], gold: 800, startArmy: { size: 2000, quality: "Thiện Chiến" }
  },
  {
    id: "euron-greyjoy", name: "Euron Greyjoy", house: "Greyjoy", role: "Mắt Quạ", tuocVi: "Vua", religion: "Thần Chết Chìm",
    blurb: "Độc ác, điên rồ, dùng phép thuật hắc ám và dong buồm trên tàu Im Lặng với thủy thủ đoàn bị cắt lưỡi.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 17, "Uy Tín": 16 },
    talentIds: ["schemer", "warrior-blood"],
    skills: { "sailing": 10, "cunning": 9, "command": 8, "intimidation": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép Valyria", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian"], moTa: "Tước đoạt từ phương đông" }], items: [], gold: 10000, startArmy: { size: 5000, quality: "Tinh Nhuệ" }
  },
  {
    id: "margaery-tyrell", name: "Margaery Tyrell", house: "Tyrell", role: "Hoa Hồng Mưu Mô", tuocVi: "Vương Hậu", religion: "Thất Diện Thần",
    blurb: "Xinh đẹp và khôn ngoan, được bà nội Olenna huấn luyện để nắm lấy quyền lực qua hôn nhân.",
    birthYear: 283, age: 15, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 15, "Uy Tín": 19 },
    talentIds: ["highborn-charm", "silver-tongue", "beloved"],
    skills: { "persuasion": 9, "court-etiquette": 9, "cunning": 7 },
    equipment: [], items: [], gold: 5000
  },
  {
    id: "olenna-tyrell", name: "Olenna Tyrell", house: "Tyrell", role: "Nữ Hoàng Gai", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Trí óc sắc bén, lời lẽ cay độc, người phụ nữ quyền lực nhất nắm giữ tài sản nhà Tyrell.",
    birthYear: 228, age: 70, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 5, "Thể Chất": 6, "Trí Tuệ": 18, "Tinh Tường": 19, "Uy Tín": 17 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "court-etiquette": 9, "persuasion": 8, "gather-rumor": 9 },
    equipment: [], items: [{ ten: "Mạng lưới gián điệp", soLuong: 1, moTa: "Nhà Tyrell biết tất cả" }], gold: 20000
  },
  {
    id: "roose-bolton", name: "Roose Bolton", house: "Bolton", role: "Lãnh Chúa Đỉa", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
    blurb: "Giọng nói mềm mỏng, hành động tàn độc. Sẵn sàng lột da cả những đồng minh nếu có lợi.",
    birthYear: 255, age: 43, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 13 },
    talentIds: ["schemer"],
    skills: { "cunning": 8, "command": 7, "intimidation": 9, "sword-shield": 6 },
    equipment: [], items: [], gold: 5000, startArmy: { size: 4000, quality: "Thiện Chiến" }
  },
  {
    id: "ramsay-snow", name: "Ramsay Snow", house: "Bolton", role: "Con Hoang Bolton", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Bạo chúa tâm thần, thích hành hạ người khác, nuôi chó săn để truy sát con người.",
    birthYear: 276, age: 22, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 13, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 10 },
    talentIds: ["hot-tempered", "warrior-blood"],
    skills: { "intimidation": 9, "brawling": 8, "hunting": 8, "sword-shield": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Cung săn", phamChat: "Thường", thuocTinh: { "Sát Thương Xa": 4 }, moTa: "Dùng để săn người" }], items: [], gold: 200, startArmy: { size: 500, quality: "Thiện Chiến" }
  },
  {
    id: "brienne-tarth", name: "Brienne xứ Tarth", house: "Tarth", role: "Nữ Hiệp Sĩ", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "To lớn, không xinh đẹp, nhưng trung thành tuyệt đối và là một trong những kiếm sĩ giỏi nhất.",
    birthYear: 280, age: 18, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 17, "Trí Tuệ": 10, "Tinh Tường": 11, "Uy Tín": 11 },
    talentIds: ["giant-frame", "born-swordsman"],
    skills: { "sword-shield": 9, "war-riding": 6, "brawling": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép thường", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Một thanh kiếm xuất sắc" }, { slot: "Giáp Thân", ten: "Giáp xanh lam", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 4 }, moTa: "Giáp đặc trưng" }], items: [], gold: 200
  },
  {
    id: "davos-seaworth", name: "Davos Seaworth", house: "Seaworth", role: "Hiệp Sĩ Hành Tây", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Từ một kẻ buôn lậu trở thành Cánh Tay Phải trung thành nhất của Stannis Baratheon.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 15 },
    talentIds: ["beloved"],
    skills: { "sailing": 9, "commerce": 7, "persuasion": 8, "cunning": 6 },
    equipment: [], items: [{ ten: "Đốt ngón tay may mắn", soLuong: 1, moTa: "Bị Stannis chặt" }], gold: 500, startArmy: { size: 100, quality: "Thiện Chiến" }
  }
];
