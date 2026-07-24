import type { CanonCharacter } from "../../../mvu/schema";

export const windsOfWinterCharacters: CanonCharacter[] = [
  {
    id: "tormund-giantsbane", name: "Tormund Giantsbane", house: "Không Nhà", role: "Thủ Lĩnh Du Mục", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Kẻ Đánh Đổ Người Khổng Lồ, thủ lĩnh của dân Tự Do, mồm mép ồn ào và sức mạnh kinh người.",
    birthYear: 250, age: 50, coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 11, "Thể Chất": 16, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 16 },
    talentIds: ["warrior-blood", "beloved", "hot-tempered"],
    skills: { "axe-mace": 9, "brawling": 8, "weather-endurance": 9, "command": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu chiến lớn", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Vũ khí của Tormund" }], items: [], gold: 10
  },
  {
    id: "mance-rayder", name: "Mance Rayder", house: "Không Nhà", role: "Vua Bên Ngoài Bức Tường", tuocVi: "Vua", religion: "Cựu Thần",
    blurb: "Cựu lính Tuần Đêm trở thành vua của dân Tự Do, người đã đoàn kết hàng chục bộ tộc đằng sau Tường.",
    birthYear: 260, age: 40, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 14, "Uy Tín": 18 },
    talentIds: ["commander-instinct", "beloved", "born-swordsman"],
    skills: { "sword-shield": 8, "command": 10, "weather-endurance": 8, "persuasion": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép thường", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Kiếm tốt" }], items: [], gold: 100
  },
  {
    id: "melisandre", name: "Melisandre", house: "Khác", role: "Nữ Tư Tế Đỏ", tuocVi: "Thường Dân", religion: "R'hllor",
    blurb: "Nữ tư tế của R'hllor. Xinh đẹp, thần bí, và tin rằng lửa sẽ thiêu rụi bóng tối.",
    birthYear: 100, age: 200, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 19, "Uy Tín": 17 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "lore": 10, "persuasion": 9, "cunning": 8, "medicine": 6 },
    equipment: [], items: [{ ten: "Hồng ngọc", soLuong: 1, moTa: "Tỏa sáng kỳ ảo" }], gold: 500
  },
  {
    id: "shireen-baratheon", name: "Shireen Baratheon", house: "Baratheon", role: "Công Chúa Đá", tuocVi: "Vương Hậu", religion: "Thất Diện Thần",
    blurb: "Con gái duy nhất của Stannis. Tốt bụng, thông minh, nhưng khuôn mặt bị biến dạng bởi Vảy Xám.",
    birthYear: 289, age: 11, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 5, "Thể Chất": 6, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 12 },
    talentIds: ["learned"],
    skills: { "lore": 6, "court-etiquette": 5 },
    equipment: [], items: [{ ten: "Sách cũ", soLuong: 3, moTa: "Người bạn duy nhất" }], gold: 200
  },
  {
    id: "victarion-greyjoy", name: "Victarion Greyjoy", house: "Greyjoy", role: "Tướng Chỉ Huy Hạm Đội Sắt", tuocVi: "Lãnh Chúa", religion: "Thần Chết Chìm",
    blurb: "Không thông minh, nhưng là chiến binh hung bạo nhất Đảo Sắt, luôn mặc áo giáp nặng trên biển.",
    birthYear: 268, age: 32, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 11, "Thể Chất": 17, "Trí Tuệ": 7, "Tinh Tường": 9, "Uy Tín": 13 },
    talentIds: ["warrior-blood", "hot-tempered"],
    skills: { "axe-mace": 10, "sailing": 9, "command": 7, "intimidation": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu khổng lồ", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Rìu của Kraken" }, { slot: "Giáp Thân", ten: "Giáp tấm Đảo Sắt", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Chìm nghỉm nếu rơi xuống nước" }], items: [], gold: 1000, startArmy: { size: 3000, quality: "Thiện Chiến" }
  },
  {
    id: "doran-martell", name: "Doran Martell", house: "Martell", role: "Hoàng Tử Xứ Dorne", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Mắc bệnh gút, không thể đi lại, nhưng là một người chơi cờ vĩ đại trong trò chơi vương quyền.",
    birthYear: 248, age: 52, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 3, "Thể Chất": 5, "Trí Tuệ": 18, "Tinh Tường": 17, "Uy Tín": 15 },
    talentIds: ["schemer", "learned"],
    skills: { "cunning": 9, "command": 8, "lore": 8, "commerce": 7 },
    equipment: [], items: [], gold: 20000, startHoldings: ["dorne-seat"], startRegions: ["dorne"]
  },
  {
    id: "arianne-martell", name: "Arianne Martell", house: "Martell", role: "Công Chúa Xứ Dorne", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Xinh đẹp, bốc đồng, muốn giành lại quyền lực thực sự cho người Dorne.",
    birthYear: 276, age: 24, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 13, "Tinh Tường": 14, "Uy Tín": 17 },
    talentIds: ["highborn-charm", "hot-tempered"],
    skills: { "persuasion": 8, "cunning": 7, "court-etiquette": 7 },
    equipment: [], items: [], gold: 2000
  },
  {
    id: "petyr-baelish", name: "Petyr Baelish", house: "Baelish", role: "Ngón Út", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Từ một lãnh chúa nhỏ nhoi, hắn đã leo lên nấc thang quyền lực bằng sự dối trá và tiền bạc.",
    birthYear: 268, age: 32, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 9, "Trí Tuệ": 19, "Tinh Tường": 18, "Uy Tín": 16 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "commerce": 10, "persuasion": 9, "gather-rumor": 9 },
    equipment: [], items: [{ ten: "Dao găm thép Valyria", soLuong: 1, moTa: "Nguồn gốc của nội chiến" }], gold: 30000
  },
  {
    id: "varys", name: "Varys", house: "Không Nhà", role: "Nhện Nhện", tuocVi: "Thường Dân", religion: "Khác",
    blurb: "Thái giám cai quản lũ chim nhỏ. Bí ẩn và luôn nói rằng ông phục vụ cho vương quốc.",
    birthYear: 250, age: 50, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 19, "Tinh Tường": 20, "Uy Tín": 14 },
    talentIds: ["schemer", "keen-eye"],
    skills: { "gather-rumor": 10, "cunning": 10, "stealth": 8, "persuasion": 8 },
    equipment: [], items: [{ ten: "Lưới gián điệp", soLuong: 1, moTa: "Khắp mọi nơi" }], gold: 10000
  },
  {
    id: "sandor-clegane", name: "Sandor Clegane", house: "Clegane", role: "Chó Săn", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Khuôn mặt cháy sém do anh trai gây ra. Tàn nhẫn nhưng bên trong vẫn còn le lói một nhân tính bị vùi dập.",
    birthYear: 270, age: 30, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 13, "Thể Chất": 17, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 9 },
    talentIds: ["warrior-blood", "giant-frame"],
    skills: { "sword-shield": 9, "brawling": 8, "war-riding": 7, "intimidation": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép lớn", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Vung bằng một tay" }], items: [], gold: 100
  }
];
