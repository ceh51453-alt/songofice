import type { CanonCharacter } from "../eras";

export const warOfFiveKingsCharacters: CanonCharacter[] = [
  {
    id: "tywin-lannister", name: "Tywin Lannister", house: "Lannister", role: "Lãnh Chúa Casterly Rock", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Khét tiếng tàn nhẫn, giàu nhất Bảy Vương Quốc. Người thực sự nắm giữ quyền lực của Ngai Sắt từ phía sau.",
    birthYear: 242, age: 56, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 18, "Tinh Tường": 17, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 55, "Thống Soái": 90, "Trí Mưu": 90, "Ngoại Giao": 85 },
    talentIds: ["schemer", "commander-instinct"],
    skills: { "command": 9, "cunning": 8, "commerce": 8, "intimidation": 9 },
    equipment: [], items: [{ ten: "Vàng Lannister", soLuong: 50000, moTa: "Sự giàu có vô tận" }], gold: 100000,
    startResources: {
      "Gỗ": 250,
      "Quặng Sắt": 750,
      "Đá": 750,
      "Lương Thực": 3000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Bộ Binh Casterly Rock", type: "Bộ Binh", size: 21000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Vùng Đồi", type: "Kỵ Binh", size: 7000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 7000, quality: "Tinh Nhuệ" }
        ],
    father: "tytos-lannister",
    mother: "jeyne-marbrand",
    spouse: "joanna-lannister",
    children: ["jaime-lannister", "cersei-lannister", "tyrion-lannister"],
    siblings: ["kevan-lannister", "tygett-lannister", "gerion-lannister", "genna-lannister"],
    allies: ["aerys-ii", "robert-baratheon"],
    rivals: ["aerys-ii", "robb-stark"],
      startRegions: ["the-westerlands"],
      startHoldings: ["the-westerlands-seat"],
      holdingsLevel: {"the-westerlands-seat":5},
      baseIncome: 800
},
  {
    id: "jaime-lannister", name: "Jaime Lannister", house: "Lannister", role: "Kẻ Sát Vương", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Hiệp sĩ Vệ Vương giỏi nhất vương quốc, đẹp trai, kiêu ngạo, nhưng mang danh Sát Vương cả đời.",
    birthYear: 266, age: 32, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 17, "Thể Chất": 14, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 75, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["born-swordsman", "duelist", "highborn-charm"],
    skills: { "sword-shield": 10, "war-riding": 8, "command": 6, "brawling": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép mạ vàng", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Tuyệt phẩm kiếm thuật" }, { slot: "Giáp Thân", ten: "Giáp Trắng Vệ Vương", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp Vệ Vương" }],
    items: [], gold: 1000,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Bộ Binh Casterly Rock", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ],
    father: "tywin-lannister",
    mother: "joanna-lannister",
    spouse: "cersei-lannister", 
    children: [], // Về mặt công khai, anh không có con hợp pháp
    siblings: ["cersei-lannister", "tyrion-lannister"],
    allies: ["cersei-lannister"],
    rivals: ["eddard-stark", "brienne-tarth"],
    secretBiologicalFather: "",
    secretBiologicalMother: "",
    relationshipDetails: {
      "cersei-lannister": { type: "Người Tình", trust: 100, affinity: 100, detail: "Chị gái sinh đôi, đồng thời là người tình bí mật cả đời của Jaime." },
      "tyrion-lannister": { type: "Anh Em", trust: 80, affinity: 90, detail: "Người duy nhất trong gia đình Lannister thực sự đối xử tốt với Tyrion." },
      "joffrey-baratheon": { type: "Con Cái (Bí mật)", trust: 10, affinity: 20, detail: "Con trai ruột với Cersei, nhưng công khai là con của Robert Baratheon." },
      "myrcella-baratheon": { type: "Con Cái (Bí mật)", trust: 50, affinity: 50, detail: "Con gái ruột với Cersei." },
      "tommen-baratheon": { type: "Con Cái (Bí mật)", trust: 50, affinity: 50, detail: "Con trai ruột với Cersei." },
      "robert-baratheon": { type: "Kẻ Thù", trust: -80, affinity: -80, detail: "Vua hiện tại, người kết hôn với Cersei. Jaime khinh thường ông." },
    },
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  // Đã xóa tyrion-lannister bị trùng lặp với eras.ts
  {
    id: "arya-stark", name: "Arya Stark", house: "Stark", role: "Sói Hoang", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Cô con gái út bướng bỉnh nhà Stark, yêu kiếm thuật hơn thêu thùa, ghét sự giả dối của triều đình.",
    birthYear: 289, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 14, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 9 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 45, "Trí Mưu": 60, "Ngoại Giao": 75 },
    talentIds: ["keen-eye"],
    skills: { "brawling": 3, "stealth": 5, "hunting": 3 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kim", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Thanh kiếm nhỏ do Jon Snow tặng" }], items: [], gold: 10,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "eddard-stark",
    mother: "catelyn-tully",
    siblings: ["robb-stark", "sansa-stark", "bran-stark", "rickon-stark", "jon-snow"],
    allies: ["sandor-clegane", "jaqen-hghar"],
    rivals: ["cersei-lannister", "joffrey-baratheon"],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
},
  {
    id: "sansa-stark", name: "Sansa Stark", house: "Stark", role: "Tiểu Thư Mơ Mộng", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Ưa chuộng bài ca và hiệp sĩ, hoàn hảo cho một cuộc hôn nhân chính trị, nhưng sự ngây thơ sắp bị thử thách.",
    birthYear: 286, age: 12, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 11, "Tinh Tường": 13, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 80, "Trí Mưu": 55, "Ngoại Giao": 65 },
    talentIds: ["highborn-charm"],
    skills: { "court-etiquette": 6, "persuasion": 4, "lore": 4 },
    equipment: [], items: [], gold: 100,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "eddard-stark",
    mother: "catelyn-tully",
    spouse: "tyrion-lannister",
    siblings: ["robb-stark", "arya-stark", "bran-stark", "rickon-stark", "jon-snow"],
    allies: ["petyr-baelish"],
    rivals: ["cersei-lannister", "joffrey-baratheon", "ramsay-snow"],
    children: [],
    startArmies: [
          { name: "Lính Cầm Giáo Lạnh", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Winterfell", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
},
  {
    id: "bran-stark", name: "Bran Stark", house: "Stark", role: "Sói Cụt Chân", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Mê leo trèo cho đến khi bị ngã, giờ chỉ còn sức mạnh tâm linh dẫn dắt.",
    birthYear: 290, age: 8, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 3, "Thể Chất": 6, "Trí Tuệ": 14, "Tinh Tường": 17, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 15, "Thống Soái": 50, "Trí Mưu": 70, "Ngoại Giao": 85 },
    talentIds: ["warg"],
    skills: { "lore": 5, "animal-handling": 6 },
    equipment: [], items: [], gold: 50,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "eddard-stark",
    mother: "catelyn-tully",
    siblings: ["robb-stark", "sansa-stark", "arya-stark", "rickon-stark", "jon-snow"],
    allies: ["meera-reed", "jojen-reed", "bloodraven"],
    rivals: ["night-king"],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Lính Cầm Giáo Lạnh", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
},
  {
    id: "theon-greyjoy", name: "Theon Greyjoy", house: "Greyjoy", role: "Con Tin Sắt", tuocVi: "Thường Dân", religion: "Thần Chết Chìm",
    blurb: "Con tin sống cùng nhà Stark, khao khát được công nhận, ngạo mạn nhưng đầy mặc cảm.",
    birthYear: 279, age: 19, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 13, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 55, "Trí Mưu": 50, "Ngoại Giao": 65 },
    talentIds: ["hot-tempered"],
    skills: { "archery": 8, "sailing": 6, "sword-shield": 5 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Cung Dài Đảo Sắt", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Xa": 5 }, moTa: "Bắn xa rất tốt" }], items: [], gold: 500,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "balon-greyjoy",
    mother: "alannys-harlaw",
    siblings: ["asha-greyjoy"],
    allies: ["robb-stark"],
    rivals: ["ramsay-snow"],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Lính Rìu Pyke", type: "Bộ Binh", size: 60, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 15, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 1, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "asha-greyjoy", name: "Asha Greyjoy", house: "Greyjoy", role: "Nữ Tướng Đảo Sắt", tuocVi: "Hiệp Sĩ", religion: "Thần Chết Chìm",
    blurb: "Chiến binh kiêu hãnh của Quần Đảo Sắt, người được Balon coi trọng hơn cậu em trai Theon.",
    birthYear: 275, age: 23, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 65 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "sailing": 8, "axe-mace": 7, "command": 7, "intimidation": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu chiến", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Rìu của Kraken" }], items: [], gold: 800,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 125,
      "Đá": 150,
      "Lương Thực": 200,
      "Ngựa": 2,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 1200, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 300, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 10, quality: "Thành Thạo" }
        ],
    father: "balon-greyjoy",
    mother: "alannys-harlaw",
    siblings: ["theon-greyjoy"],
    allies: [],
    rivals: ["euron-greyjoy"],
    spouse: "",
    children: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "euron-greyjoy", name: "Euron Greyjoy", house: "Greyjoy", role: "Mắt Quạ", tuocVi: "Quốc Vương", religion: "Thần Chết Chìm",
    blurb: "Độc ác, điên rồ, dùng phép thuật hắc ám và dong buồm trên tàu Im Lặng với thủy thủ đoàn bị cắt lưỡi.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 17, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 80, "Trí Mưu": 80, "Ngoại Giao": 85 },
    talentIds: ["schemer", "warrior-blood"],
    skills: { "sailing": 10, "cunning": 9, "command": 8, "intimidation": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép Valyria", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian"], moTa: "Tước đoạt từ phương đông" }], items: [], gold: 10000,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 1250,
      "Đá": 1500,
      "Lương Thực": 2000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 750, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 25, quality: "Tinh Nhuệ" }
        ],
    father: "quellon-greyjoy",
    siblings: ["balon-greyjoy", "victarion-greyjoy", "aeron-greyjoy"],
    rivals: ["asha-greyjoy", "victarion-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
    allies: [],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "margaery-tyrell", name: "Margaery Tyrell", house: "Tyrell", role: "Hoa Hồng Mưu Mô", tuocVi: "Vương Hậu", religion: "Thất Diện Thần",
    blurb: "Xinh đẹp và khôn ngoan, được bà nội Olenna huấn luyện để nắm lấy quyền lực qua hôn nhân.",
    birthYear: 283, age: 15, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 15, "Uy Tín": 19 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 95, "Trí Mưu": 75, "Ngoại Giao": 75 },
    talentIds: ["highborn-charm", "silver-tongue", "beloved"],
    skills: { "persuasion": 9, "court-etiquette": 9, "cunning": 7 },
    equipment: [], items: [], gold: 5000,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "mace-tyrell",
    mother: "alerie-hightower",
    spouse: "renly-baratheon",
    siblings: ["willas-tyrell", "garlan-tyrell", "loras-tyrell"],
    allies: ["olenna-tyrell"],
    rivals: ["cersei-lannister"],
    children: [],
    startArmies: [
          { name: "Bộ Binh Vùng Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "olenna-tyrell", name: "Olenna Tyrell", house: "Tyrell", role: "Nữ Hoàng Gai", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Trí óc sắc bén, lời lẽ cay độc, người phụ nữ quyền lực nhất nắm giữ tài sản nhà Tyrell.",
    birthYear: 228, age: 70, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 5, "Thể Chất": 6, "Trí Tuệ": 18, "Tinh Tường": 19, "Uy Tín": 17 },
    năngLực: { "Võ Lực": 15, "Thống Soái": 85, "Trí Mưu": 90, "Ngoại Giao": 95 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "court-etiquette": 9, "persuasion": 8, "gather-rumor": 9 },
    equipment: [], items: [{ ten: "Mạng lưới gián điệp", soLuong: 1, moTa: "Nhà Tyrell biết tất cả" }], gold: 20000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 125,
      "Đá": 500,
      "Lương Thực": 10000,
      "Ngựa": 150,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "luthor-tyrell",
    children: ["mace-tyrell"],
    allies: ["margaery-tyrell"],
    rivals: ["tywin-lannister", "cersei-lannister"],
    father: "",
    mother: "",
    siblings: [],
    startArmies: [
          { name: "Lính Giáo Hoa Hồng", type: "Bộ Binh", size: 24000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Hạng Nặng Xứ Reach", type: "Kỵ Binh", size: 8000, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 8000, quality: "Thành Thạo" }
        ],
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "roose-bolton", name: "Roose Bolton", house: "Bolton", role: "Lãnh Chúa Đỉa", tuocVi: "Lãnh Chúa Thành Trì", religion: "Cựu Thần",
    blurb: "Giọng nói mềm mỏng, hành động tàn độc. Sẵn sàng lột da cả những đồng minh nếu có lợi.",
    birthYear: 255, age: 43, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 13 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 65, "Trí Mưu": 80, "Ngoại Giao": 75 },
    talentIds: ["schemer"],
    skills: { "cunning": 8, "command": 7, "intimidation": 9, "sword-shield": 6 },
    equipment: [], items: [], gold: 15000,
    startResources: {
      "Gỗ": 600,
      "Quặng Sắt": 120,
      "Đá": 240,
      "Lương Thực": 800,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Bộ Binh Dreadfort", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Bóng Tối", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Độc Dreadfort", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
    spouse: "walda-frey",
    children: ["domeric-bolton", "ramsay-snow"],
    allies: ["walder-frey", "tywin-lannister"],
    rivals: ["robb-stark", "stannis-baratheon"],
    father: "",
    mother: "",
    siblings: [],
      startRegions: [],
      startHoldings: ["dreadfort"],
      holdingsLevel: {"dreadfort":4},
      baseIncome: 200
},
  {
    id: "ramsay-snow", name: "Ramsay Snow", house: "Bolton", role: "Con Hoang Bolton", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Bạo chúa tâm thần, thích hành hạ người khác, nuôi chó săn để truy sát con người.",
    birthYear: 276, age: 22, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 13, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["hot-tempered", "warrior-blood"],
    skills: { "intimidation": 9, "brawling": 8, "hunting": 8, "sword-shield": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Cung săn", phamChat: "Thường", thuocTinh: { "Sát Thương Xa": 4 }, moTa: "Dùng để săn người" }], items: [], gold: 200,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Bộ Binh Dreadfort", type: "Bộ Binh", size: 350, quality: "Thành Thạo" },
          { name: "Cung Thủ Độc Dreadfort", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
    father: "roose-bolton",
    allies: ["roose-bolton"],
    rivals: ["jon-snow", "theon-greyjoy"],
    mother: "",
    spouse: "sansa-stark",
    children: [],
    siblings: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "brienne-tarth", name: "Brienne xứ Tarth", house: "Tarth", role: "Nữ Hiệp Sĩ", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "To lớn, không xinh đẹp, nhưng trung thành tuyệt đối và là một trong những kiếm sĩ giỏi nhất.",
    birthYear: 280, age: 18, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 17, "Trí Tuệ": 10, "Tinh Tường": 11, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 55, "Trí Mưu": 50, "Ngoại Giao": 55 },
    talentIds: ["giant-frame", "born-swordsman"],
    skills: { "sword-shield": 9, "war-riding": 6, "brawling": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép thường", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Một thanh kiếm xuất sắc" }, { slot: "Giáp Thân", ten: "Giáp xanh lam", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 4 }, moTa: "Giáp đặc trưng" }], items: [], gold: 200,
    startResources: {
      "Gỗ": 200,
      "Quặng Sắt": 60,
      "Đá": 150,
      "Lương Thực": 550,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "selwyn-tarth",
    allies: ["catelyn-tully", "jaime-lannister", "renly-baratheon"],
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    rivals: ["stannis-baratheon"],
    startArmies: [
          { name: "Bộ Binh Đảo Tarth", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Biển", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 15
},
  {
    id: "davos-seaworth", name: "Davos Seaworth", house: "Seaworth", role: "Hiệp Sĩ Hành Tây", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Từ một kẻ buôn lậu trở thành Cánh Tay Phải trung thành nhất của Stannis Baratheon.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 65, "Ngoại Giao": 75 },
    talentIds: ["beloved"],
    skills: { "sailing": 9, "commerce": 7, "persuasion": 8, "cunning": 6 },
    equipment: [], items: [{ ten: "Đốt ngón tay may mắn", soLuong: 1, moTa: "Bị Stannis chặt" }], gold: 500,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 50,
      "Đá": 100,
      "Lương Thực": 500,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Thủy Thủ Hành Tây", type: "Bộ Binh", size: 70, quality: "Thành Thạo" },
          { name: "Cung Thủ Hành Tây", type: "Cung Thủ", size: 30, quality: "Thành Thạo" }
        ],
    spouse: "marya-seaworth",
    children: ["dale-seaworth", "allard-seaworth", "matthos-seaworth", "maric-seaworth", "devan-seaworth", "stannis-seaworth", "steffon-seaworth"],
    allies: ["stannis-baratheon"],
    rivals: ["melisandre"],
    father: "",
    mother: "",
    siblings: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 50
},
  {
    id: "balon-greyjoy", name: "Balon Greyjoy", house: "Greyjoy", role: "Vua Quần Đảo Sắt", tuocVi: "Quốc Vương", religion: "Thần Chết Chìm",
    blurb: "Lần thứ hai xưng vương, lần này đánh vào Phương Bắc yếu ớt thay vì Lannisport.",
    birthYear: 256, age: 42, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 12, "Tinh Tường": 11, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 55 },
    talentIds: ["warrior-blood", "hot-tempered"],
    skills: { "axe-mace": 6, "command": 7, "sailing": 7 },
    equipment: [], items: [], gold: 3000,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 1250,
      "Đá": 1500,
      "Lương Thực": 2000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Lính Rìu Pyke", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 2250, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 75, quality: "Thành Thạo" }
        ],
    father: "quellon-greyjoy",
    spouse: "alannys-harlaw",
    children: ["rodrik-greyjoy", "maron-greyjoy", "asha-greyjoy", "theon-greyjoy"],
    siblings: ["euron-greyjoy", "victarion-greyjoy", "aeron-greyjoy"],
    rivals: ["robert-baratheon", "eddard-stark", "robb-stark"],
    mother: "",
    allies: [],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "catelyn-tully", name: "Catelyn Stark", house: "Tully", role: "Phu Nhân Winterfell", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Gia đình, Bổn phận, Danh dự. Catelyn sẽ làm mọi thứ để bảo vệ những đứa con của mình.",
    birthYear: 264, age: 34, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 35, "Thống Soái": 80, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["highborn-charm"],
    skills: { "persuasion": 8, "court-etiquette": 7, "lore": 6 },
    equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "hoster-tully", mother: "minisa-whent",
    spouse: "eddard-stark",
    children: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark"],
    siblings: ["lysa-tully", "edmure-tully"],
    allies: ["brynden-tully"],
    rivals: ["cersei-lannister", "jaime-lannister", "walder-frey"],
    startArmies: [
          { name: "Dân Binh Riverlands", type: "Bộ Binh", size: 168, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 72, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "rickon-stark", name: "Rickon Stark", house: "Stark", role: "Sói Út", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Con út nhà Stark, hoang dã và không kiểm soát.",
    birthYear: 295, age: 3, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 5, "Trí Tuệ": 5, "Tinh Tường": 8, "Uy Tín": 6 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 30, "Trí Mưu": 25, "Ngoại Giao": 40 },
    talentIds: ["warg"], skills: { "animal-handling": 4 },
    equipment: [], items: [], gold: 10,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "eddard-stark", mother: "catelyn-tully",
    siblings: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "jon-snow"],
    allies: ["osha"],
    spouse: "",
    children: [],
    rivals: ["ramsay-snow"],
    startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lysa-tully", name: "Lysa Arryn", house: "Tully", role: "Phu Nhân Eyrie", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Hoang tưởng và ích kỷ, cô giữ chặt con trai ở The Eyrie, từ chối tham gia cuộc chiến.",
    birthYear: 266, age: 32, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 7, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 55, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["master-liar"], skills: { "deception": 7, "persuasion": 6 },
    equipment: [], items: [], gold: 5000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 200,
      "Đá": 500,
      "Lương Thực": 5000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Vệ Binh Sông Xanh", type: "Bộ Binh", size: 18000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sông Nhánh", type: "Kỵ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nước", type: "Cung Thủ", size: 6000, quality: "Thành Thạo" }
        ],
    father: "hoster-tully", mother: "minisa-whent",
    spouse: "jon-arryn",
    children: ["robert-arryn"],
    siblings: ["catelyn-tully", "edmure-tully"],
    allies: ["petyr-baelish"],
    rivals: ["catelyn-tully"],
      startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat":5},
      baseIncome: 450
},
  {
    id: "edmure-tully", name: "Edmure Tully", house: "Tully", role: "Người Thừa Kế Riverrun", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Dũng cảm nhưng bốc đồng, muốn tự chứng tỏ khả năng lãnh đạo nhưng hay mắc sai lầm.",
    birthYear: 267, age: 31, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: ["beloved"], skills: { "command": 6, "sword-shield": 6, "war-riding": 6 },
    equipment: [], items: [], gold: 2000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 200,
      "Đá": 500,
      "Lương Thực": 5000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Lính Giáo Vùng Trident", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Riverrun", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ],
    father: "hoster-tully", mother: "minisa-whent",
    siblings: ["catelyn-tully", "lysa-tully"],
    allies: ["robb-stark", "brynden-tully"],
    rivals: ["jaime-lannister", "tywin-lannister"],
    spouse: "",
    children: [],
      startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat":5},
      baseIncome: 450
},
  {
    id: "brynden-tully", name: "Brynden Tully", house: "Tully", role: "Cá Đen", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Chiến binh huyền thoại của Riverrun, tư lệnh tiền phương cho Robb Stark.",
    birthYear: 242, age: 56, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 13, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 80 },
    talentIds: ["commander-instinct", "warrior-blood"], skills: { "command": 9, "sword-shield": 8, "war-riding": 8 },
    equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 40,
      "Đá": 100,
      "Lương Thực": 1000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Vệ Binh Sông Xanh", type: "Bộ Binh", size: 350, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Nước", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
    siblings: ["hoster-tully"],
    allies: ["robb-stark", "catelyn-tully"],
    rivals: ["jaime-lannister", "walder-frey"],
    father: "hoster-tully-senior",
    mother: "",
    spouse: "",
    children: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "mace-tyrell", name: "Mace Tyrell", house: "Tyrell", role: "Lãnh Chúa Highgarden", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Lãnh chúa mập mạp của Highgarden, tham danh vọng nhưng để mẹ Olenna quyết định thực sự.",
    birthYear: 256, age: 42, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 8, "Thể Chất": 13, "Trí Tuệ": 11, "Tinh Tường": 10, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 70, "Trí Mưu": 55, "Ngoại Giao": 50 },
    talentIds: ["highborn-charm"], skills: { "command": 5, "court-etiquette": 7 },
    equipment: [], items: [], gold: 80000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 125,
      "Đá": 500,
      "Lương Thực": 10000,
      "Ngựa": 150,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Vệ Binh Mùa Hè", type: "Bộ Binh", size: 42000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Hạng Nặng Xứ Reach", type: "Kỵ Binh", size: 14000, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 14000, quality: "Thành Thạo" }
        ],
    father: "luthor-tyrell", mother: "olenna-redwyne",
    spouse: "alerie-hightower",
    children: ["willas-tyrell", "garlan-tyrell", "loras-tyrell", "margaery-tyrell"],
    allies: ["randyll-tarly", "tywin-lannister"],
    siblings: [],
    rivals: ["stannis-baratheon"],
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "loras-tyrell", name: "Loras Tyrell", house: "Tyrell", role: "Hiệp Sĩ Hoa", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Hiệp sĩ hào hoa nhất Bảy Vương Quốc, người tình bí mật của Renly Baratheon.",
    birthYear: 282, age: 16, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 16, "Thể Chất": 14, "Trí Tuệ": 11, "Tinh Tường": 12, "Uy Tín": 17 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 85, "Trí Mưu": 55, "Ngoại Giao": 60 },
    talentIds: ["born-swordsman", "duelist", "beloved"], skills: { "sword-shield": 8, "war-riding": 9, "court-etiquette": 7 },
    equipment: [{ slot: "Giáp Thân", ten: "Giáp Hoa", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp nạm ngọc" }], items: [], gold: 2000,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 25,
      "Đá": 100,
      "Lương Thực": 2000,
      "Ngựa": 30,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "mace-tyrell", mother: "alerie-hightower",
    siblings: ["willas-tyrell", "garlan-tyrell", "margaery-tyrell"],
    allies: ["renly-baratheon", "margaery-tyrell"],
    rivals: [],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Vệ Binh Mùa Hè", type: "Bộ Binh", size: 560, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 240, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "victarion-greyjoy", name: "Victarion Greyjoy", house: "Greyjoy", role: "Tư Lệnh Hạm Đội Sắt", tuocVi: "Thường Dân", religion: "Thần Chết Chìm",
    blurb: "Chiến binh tàn bạo trên biển, không có trí thông minh chính trị nhưng trung thành và vô cùng đáng sợ.",
    birthYear: 268, age: 30, coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 8, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 85, "Thống Soái": 60, "Trí Mưu": 40, "Ngoại Giao": 50 },
    talentIds: ["warrior-blood", "giant-frame"], skills: { "sailing": 9, "axe-mace": 9, "command": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu lớn của Victarion", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Vũ khí tử thần trên tàu chiến" }], items: [], gold: 1000,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 4800, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 1200, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 40, quality: "Tinh Nhuệ" }
        ],
    father: "quellon-greyjoy",
    siblings: ["balon-greyjoy", "euron-greyjoy", "aeron-greyjoy"],
    allies: [],
    rivals: ["euron-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 100
},
  {
    id: "aeron-greyjoy", name: "Aeron Greyjoy", house: "Greyjoy", role: "Tóc Ướt", tuocVi: "Thường Dân", religion: "Thần Chết Chìm",
    blurb: "Tu sĩ cuồng tín của Thần Chết Chìm, uống nước biển và ban phước bằng cách dìm nước.",
    birthYear: 269, age: 29, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 11, "Tinh Tường": 15, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 55, "Thống Soái": 70, "Trí Mưu": 55, "Ngoại Giao": 75 },
    talentIds: ["beloved"], skills: { "lore": 6, "persuasion": 8, "sailing": 6 },
    equipment: [], items: [], gold: 50,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "quellon-greyjoy",
    siblings: ["balon-greyjoy", "euron-greyjoy", "victarion-greyjoy"],
    allies: ["victarion-greyjoy"],
    rivals: ["euron-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
    startArmies: [
          { name: "Bộ Binh Thiết Quần Đảo", type: "Bộ Binh", size: 60, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 15, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 1, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "kevan-lannister", name: "Kevan Lannister", house: "Lannister", role: "Cánh Tay Phải Của Tywin", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Đáng tin cậy, vững vàng và luôn đứng trong cái bóng của người anh trai vĩ đại Tywin Lannister.",
    birthYear: 244, age: 54, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 9, "Thể Chất": 11, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 70, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["learned", "commander-instinct"], skills: { "command": 7, "commerce": 6, "court-etiquette": 7 },
    equipment: [], items: [], gold: 10000,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Bộ Binh Casterly Rock", type: "Bộ Binh", size: 3000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 1000, quality: "Thành Thạo" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 1000, quality: "Thành Thạo" }
        ],
    father: "tytos-lannister", mother: "jeyne-marbrand",
    spouse: "dorna-swyft",
    children: ["lancel-lannister", "willem-lannister", "martyn-lannister", "janei-lannister"],
    siblings: ["tywin-lannister", "genna-lannister", "tygett-lannister", "gerion-lannister"],
    allies: ["tywin-lannister"],
    rivals: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lancel-lannister", name: "Lancel Lannister", house: "Lannister", role: "Hiệp Sĩ Trẻ", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    blurb: "Cháu trai của Tywin, người rót rượu cho Vua Robert, giờ đã thành hiệp sĩ và là người tình bí mật của Cersei.",
    birthYear: 282, age: 16, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 10, "Thể Chất": 9, "Trí Tuệ": 8, "Tinh Tường": 9, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 45, "Thống Soái": 60, "Trí Mưu": 40, "Ngoại Giao": 45 },
    talentIds: ["highborn-charm"], skills: { "sword-shield": 4, "war-riding": 4, "court-etiquette": 5 },
    equipment: [{ slot: "Giáp Thân", ten: "Giáp Lannister", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 4 }, moTa: "Áo giáp đắt tiền" }], items: [], gold: 1000,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "kevan-lannister", mother: "dorna-swyft",
    siblings: ["willem-lannister", "martyn-lannister", "janei-lannister"],
    allies: ["cersei-lannister", "tywin-lannister"],
    rivals: ["tyrion-lannister"],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Đội Trọng Bộ Binh Lannister", type: "Bộ Binh", size: 350, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "selyse-florent", name: "Selyse Florent", house: "Baratheon", role: "Vương Hậu Của Stannis", tuocVi: "Vương Hậu", religion: "Thần Ánh Sáng (R'hllor)",
    blurb: "Lạnh nhạt và sùng đạo, Selyse đã từ bỏ Thất Diện Thần để theo Thần Ánh Sáng của Melisandre.",
    birthYear: 265, age: 33, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 5, "Trí Tuệ": 11, "Tinh Tường": 9, "Uy Tín": 8 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 40, "Trí Mưu": 55, "Ngoại Giao": 45 },
    talentIds: [], skills: { "court-etiquette": 5, "lore": 6 },
    equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 40,
      "Quặng Sắt": 12,
      "Đá": 30,
      "Lương Thực": 110,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "stannis-baratheon",
    children: ["shireen-baratheon"],
    allies: ["melisandre"],
    rivals: ["renly-baratheon"],
    father: "",
    mother: "",
    siblings: [],
    startArmies: [
          { name: "Đội Tiên Phong Búa Sét", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 450, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 15, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "shireen-baratheon", name: "Shireen Baratheon", house: "Baratheon", role: "Công Chúa Nhỏ", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Cô con gái duy nhất của Stannis, khuôn mặt bị sẹo do bệnh Vảy Xám, nhưng rất thông minh và tốt bụng.",
    birthYear: 289, age: 9, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 9 },
    năngLực: { "Võ Lực": 15, "Thống Soái": 45, "Trí Mưu": 60, "Ngoại Giao": 50 },
    talentIds: ["learned"], skills: { "lore": 6, "languages": 4 },
    equipment: [], items: [{ ten: "Sách truyện cổ", soLuong: 5, moTa: "Shireen rất thích đọc sách" }], gold: 50,
    startResources: {
      "Gỗ": 40,
      "Quặng Sắt": 12,
      "Đá": 30,
      "Lương Thực": 110,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "stannis-baratheon", mother: "selyse-florent",
    allies: ["davos-seaworth", "stannis-baratheon"],
    spouse: "",
    children: [],
    siblings: [],
    rivals: [],
    startArmies: [
          { name: "Đội Tiên Phong Búa Sét", type: "Bộ Binh", size: 180, quality: "Thành Thạo" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 45, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 1, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "melisandre", name: "Melisandre", house: "Không Nhà", role: "Nữ Tư Tế Đỏ", tuocVi: "Thường Dân", religion: "Thần Ánh Sáng (R'hllor)",
    blurb: "Bóng ma từ Asshai, nữ tư tế của Thần Ánh Sáng. Xinh đẹp, nguy hiểm và mang theo phép thuật bóng tối.",
    birthYear: 0, age: 400, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 14, "Trí Tuệ": 17, "Tinh Tường": 18, "Uy Tín": 19 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 95, "Trí Mưu": 85, "Ngoại Giao": 90 },
    talentIds: ["master-liar", "schemer"], skills: { "persuasion": 9, "lore": 10, "deception": 9, "intimidation": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Hồng ngọc cổ", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, dacTinh: ["phép thuật"], moTa: "Viên đá phát sáng trên cổ" }], items: [], gold: 1000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["stannis-baratheon"],
    rivals: ["davos-seaworth"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Bộ Binh Ánh Sáng", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Lửa", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 50
}
];
