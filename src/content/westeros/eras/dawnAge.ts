import type { CanonCharacter } from "../eras";

export const dawnAgeCharacters: CanonCharacter[] = [
  {
    id: "lann-the-clever", name: "Lann Kẻ Trí", house: "Lannister", role: "Kẻ Lừa Đảo Huyền Thoại", tuocVi: "Vua", religion: "Cựu Thần",
    blurb: "Truyền thuyết kể rằng hắn đã lừa dòng dõi Casterly để lấy đi Casterly Rock chỉ bằng trí óc.",
    birthYear: -8050, age: 30, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 16, "Thể Chất": 10, "Trí Tuệ": 20, "Tinh Tường": 18, "Uy Tín": 18 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "stealth": 9, "persuasion": 10, "commerce": 8 },
    equipment: [], items: [{ ten: "Vàng Casterly", soLuong: 100000, moTa: "Khởi đầu của huyền thoại" }], gold: 100000, startingHookIds: [], startHoldings: ["the-westerlands-seat"], startRegions: ["the-westerlands"],
    rivals: ["garth-greenhand"]
  },
  {
    id: "garth-greenhand", name: "Garth Bàn Tay Xanh", house: "Gardener", role: "Vị Thần Của Đất", tuocVi: "Vua", religion: "Cựu Thần",
    blurb: "Tổ tiên của mọi gia tộc lớn ở Reach. Đi tới đâu, cây cỏ tốt tươi tới đó.",
    birthYear: -8080, age: 60, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 10, "Thể Chất": 18, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 20 },
    talentIds: ["beloved", "giant-frame"],
    skills: { "animal-handling": 10, "weather-endurance": 8, "persuasion": 9 },
    equipment: [{ slot: "Vật Phẩm Đặc Biệt", ten: "Vương miện hoa lá", phamChat: "Vô Giá", thuocTinh: { "Tôn Trọng": 10 }, moTa: "Được đan từ dây leo" }], items: [], gold: 10000, startingHookIds: [], startHoldings: ["the-reach-seat"], startRegions: ["the-reach"],
    rivals: ["lann-the-clever", "durran-godsgrief"]
  },
  {
    id: "durran-godsgrief", name: "Durran Than Thở Trời", house: "Durrandon", role: "Người Xây Storm's End", tuocVi: "Vua", religion: "Cựu Thần",
    blurb: "Kẻ dám yêu con gái thần Gió và Biển, và xây dựng Storm's End để thách thức cơn thịnh nộ của họ.",
    birthYear: -8060, age: 40, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 11, "Thể Chất": 20, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 16 },
    talentIds: ["hot-tempered", "warrior-blood", "giant-frame"],
    skills: { "command": 9, "weather-endurance": 10, "intimidation": 9, "sword-shield": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa Vua Bão", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 8 }, moTa: "Đập tan cơn bão" }], items: [], gold: 5000, startingHookIds: [], startHoldings: ["the-stormlands-seat"], startRegions: ["the-stormlands"],
    spouse: "elenei",
    allies: ["brandon-builder"]
  },
  {
    id: "grey-king", name: "Vua Xám", house: "Greyiron", role: "Vua Đảo Sắt Đâu Tiên", tuocVi: "Vua", religion: "Thần Chết Chìm",
    blurb: "Giết rồng biển Nagga, lấy xương làm ngai. Tóc, râu và mắt đều xám màu biển động.",
    birthYear: -8100, age: 80, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 12, "Thể Chất": 19, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 17 },
    talentIds: ["warrior-blood"],
    skills: { "sailing": 10, "axe-mace": 9, "weather-endurance": 9 },
    equipment: [{ slot: "Vật Phẩm Đặc Biệt", ten: "Vương miện gỗ lũa", phamChat: "Vô Giá", thuocTinh: { "Tôn Trọng": 10 }, moTa: "Vương miện của Đảo Sắt" }], items: [], gold: 2000, startingHookIds: [], startHoldings: ["the-iron-islands-seat"], startRegions: ["the-iron-islands"]
  },
  {
    id: "symeon-star-eyes", name: "Symeon Mắt Sao", house: "Không Nhà", role: "Hiệp Sĩ Mù", tuocVi: "Hiệp Sĩ", religion: "Cựu Thần",
    blurb: "Một hiệp sĩ huyền thoại mù lòa, đặt hai viên ngọc sapphire vào hốc mắt và sử dụng trường thương múa với hai đầu sắc bén.",
    birthYear: -8040, age: 35, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 20, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 5, "Uy Tín": 14 },
    talentIds: ["born-swordsman", "duelist"],
    skills: { "sword-shield": 10, "brawling": 8, "cunning": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Thương hai đầu", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Xoay tít như cối xay" }], items: [], gold: 0, startingHookIds: []
  }
];
