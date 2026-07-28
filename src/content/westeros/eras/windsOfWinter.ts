import type { CanonCharacter } from "../eras";

export const windsOfWinterCharacters: CanonCharacter[] = [
  {
    id: "tormund-giantsbane", name: "Tormund Giantsbane", house: "Không Nhà", role: "Thủ Lĩnh Du Mục", tuocVi: "Thường Dân", religion: "Cựu Thần",
    blurb: "Kẻ Đánh Đổ Người Khổng Lồ, thủ lĩnh của dân Tự Do, mồm mép ồn ào và sức mạnh kinh người.",
    birthYear: 250, age: 50, coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 11, "Thể Chất": 16, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 85, "Thống Soái": 80, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["warrior-blood", "beloved", "hot-tempered"],
    skills: { "axe-mace": 9, "unarmed": 8, "weather-endurance": 9, "command": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu chiến lớn", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Vũ khí của Tormund" }], 
    items: [], gold: 50,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["jon-snow", "mance-rayder"],
    father: "",
    mother: "",
    spouse: "",
    children: ["toregg", "torwynd", "dryn", "munda"],
    siblings: [],
    rivals: ["others"],
    liege: "mance-rayder",
    relationshipDetails: {
      "jon-snow": { type: "Bằng Hữu", trust: 90, affinity: 95, detail: "Jon Snow là người duy nhất từ phương Nam được Tormund thật sự kính trọng. Hai người từng chiến đấu cùng nhau chống Bạch Quỉ." },
      "mance-rayder": { type: "Lãnh Đạo", trust: 100, affinity: 100, detail: "Mance là người đã đoàn kết các bộ lạc. Tormund theo ông vì tôn trọng." }
    },
    startArmies: [
          { name: "Tộc Thenn", type: "Bộ Binh", size: 2400, quality: "Mới Lập Đội" },
          { name: "Người Khổng Lồ", type: "Kỵ Binh", size: 800, quality: "Mới Lập Đội" },
          { name: "Dã Nhân Ném Lao", type: "Cung Thủ", size: 800, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 15
},
  {
    id: "mance-rayder", name: "Mance Rayder", house: "Không Nhà", role: "Vua Bên Ngoài Bức Tường", tuocVi: "Vua", religion: "Cựu Thần",
    blurb: "Cựu lính Tuần Đêm trở thành vua của dân Tự Do, người đã đoàn kết hàng chục bộ tộc đằng sau Tường.",
    birthYear: 260, age: 40, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 14, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 90, "Trí Mưu": 80, "Ngoại Giao": 70 },
    talentIds: ["commander-instinct", "beloved", "born-swordsman"],
    skills: { "sword-shield": 8, "command": 10, "weather-endurance": 8, "persuasion": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép thường", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Kiếm tốt" }, { slot: "Giáp Thân", ten: "Áo choàng đen sọc đỏ", phamChat: "Thường", thuocTinh: { "Tôn Trọng": 2 }, moTa: "Ký ức của Tuần Đêm" }], 
    items: [{ ten: "Tù và Joramun (giả)", soLuong: 1, moTa: "Dùng để dọa phương Nam" }], 
    gold: 200,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 500,
      "Đá": 1000,
      "Lương Thực": 5000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "dalla",
    allies: ["tormund-giantsbane", "jon-snow"],
    rivals: ["stannis-baratheon", "others"],
    father: "",
    mother: "",
    children: ["aemon-steelsong"],
    siblings: [],
    startArmies: [
          { name: "Dã Nhân Khóc Lóc", type: "Bộ Binh", size: 60000, quality: "Rời Rạc" },
          { name: "Người Khổng Lồ", type: "Kỵ Binh", size: 20000, quality: "Rời Rạc" },
          { name: "Cung Thủ Dã Nhân", type: "Cung Thủ", size: 20000, quality: "Rời Rạc" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
},
  {
    id: "melisandre", name: "Melisandre", house: "Khác", role: "Nữ Tư Tế Đỏ", tuocVi: "Thường Dân", religion: "R'hllor",
    blurb: "Nữ tư tế của R'hllor. Xinh đẹp, thần bí, và tin rằng lửa sẽ thiêu rụi bóng tối.",
    birthYear: 100, age: 200, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 19, "Uy Tín": 17 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 85, "Trí Mưu": 90, "Ngoại Giao": 95 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "lore": 10, "persuasion": 9, "cunning": 8, "maester-medicine": 6 },
    equipment: [], items: [{ ten: "Hồng ngọc", soLuong: 1, moTa: "Tỏa sáng kỳ ảo che giấu thân phận thật" }], gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["stannis-baratheon"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    rivals: ["davos-seaworth"],
    startArmies: [
          { name: "Bộ Binh Ánh Sáng", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Lửa", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 50
},
  {
    id: "shireen-baratheon", name: "Shireen Baratheon", house: "Baratheon", role: "Công Chúa Đá", tuocVi: "Vương Hậu", religion: "Thất Diện Thần",
    blurb: "Con gái duy nhất của Stannis. Tốt bụng, thông minh, nhưng khuôn mặt bị biến dạng bởi Vảy Xám.",
    birthYear: 289, age: 11, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 5, "Thể Chất": 6, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 60, "Trí Mưu": 70, "Ngoại Giao": 65 },
    talentIds: ["learned"],
    skills: { "lore": 6, "court-etiquette": 5 },
    equipment: [], items: [{ ten: "Sách cũ", soLuong: 3, moTa: "Người bạn duy nhất" }], gold: 200,
    startResources: {
      "Gỗ": 40,
      "Quặng Sắt": 12,
      "Đá": 30,
      "Lương Thực": 110,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "stannis-baratheon", mother: "selyse-florent",
    allies: ["davos-seaworth"],
    spouse: "",
    children: [],
    siblings: [],
    rivals: [],
    startArmies: [
          { name: "Đội Tiên Phong Búa Sét", type: "Bộ Binh", size: 8, quality: "Mới Lập Đội" },
          { name: "Đội Nỏ Vùng Bão", type: "Cung Thủ", size: 5, quality: "Mới Lập Đội" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 1, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "victarion-greyjoy", name: "Victarion Greyjoy", house: "Greyjoy", role: "Tướng Chỉ Huy Hạm Đội Sắt", tuocVi: "Lãnh Chúa", religion: "Thần Chết Chìm",
    blurb: "Không thông minh, nhưng là chiến binh hung bạo nhất Đảo Sắt, luôn mặc áo giáp nặng trên biển.",
    birthYear: 268, age: 32, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 11, "Thể Chất": 17, "Trí Tuệ": 7, "Tinh Tường": 9, "Uy Tín": 13 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 65, "Trí Mưu": 35, "Ngoại Giao": 45 },
    talentIds: ["warrior-blood", "hot-tempered"],
    skills: { "axe-mace": 10, "trading": 9, "command": 7, "intimidation": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Rìu khổng lồ", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Rìu của Kraken" }, { slot: "Giáp Thân", ten: "Giáp tấm Đảo Sắt", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Chìm nghỉm nếu rơi xuống nước" }], 
    items: [], gold: 1000,
    startResources: {
      "Gỗ": 300,
      "Quặng Sắt": 250,
      "Đá": 300,
      "Lương Thực": 400,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], 
    startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Người Ném Lao Quần Đảo", type: "Cung Thủ", size: 450, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 15, quality: "Thành Thạo" }
        ],
    father: "quellon-greyjoy",
    siblings: ["balon-greyjoy", "euron-greyjoy", "aeron-greyjoy"],
    rivals: ["euron-greyjoy"],
    mother: "",
    spouse: "", // Nhiều vợ nhưng đã chết hoặc không có mặt trong game
    children: [],
    allies: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 100
},
  {
    id: "doran-martell", name: "Doran Martell", house: "Martell", role: "Hoàng Tử Xứ Dorne", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Mắc bệnh gút, không thể đi lại, nhưng là một người chơi cờ vĩ đại trong trò chơi vương quyền.",
    birthYear: 248, age: 52, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 3, "Thể Chất": 5, "Trí Tuệ": 18, "Tinh Tường": 17, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 15, "Thống Soái": 75, "Trí Mưu": 90, "Ngoại Giao": 85 },
    talentIds: ["schemer", "learned"],
    skills: { "cunning": 9, "command": 8, "lore": 8, "trading": 7 },
    equipment: [], items: [], gold: 20000,
    startResources: {
      "Gỗ": 250,
      "Quặng Sắt": 250,
      "Đá": 600,
      "Lương Thực": 1750,
      "Ngựa": 300,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "mellario-norvos",
    children: ["arianne-martell", "quentyn-martell", "trystane-martell"],
    siblings: ["oberyn-martell", "elia-martell"],
    allies: [],
    rivals: ["tywin-lannister"],
    startArmies: [
          { name: "Lính Giáo Cát", type: "Bộ Binh", size: 15000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 5000, quality: "Thành Thạo" },
          { name: "Cung Thủ Tẩm Độc", type: "Cung Thủ", size: 5000, quality: "Thành Thạo" }
        ],
    father: "", // Không được nêu tên trong sách
    mother: "",  // Công chúa xứ Dorne vô danh
      startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat":5},
      baseIncome: 400
},
  {
    id: "arianne-martell", name: "Arianne Martell", house: "Martell", role: "Công Chúa Xứ Dorne", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Xinh đẹp, bốc đồng, muốn giành lại quyền lực thực sự cho người Dorne.",
    birthYear: 276, age: 24, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 13, "Tinh Tường": 14, "Uy Tín": 17 },
    năngLực: { "Võ Lực": 35, "Thống Soái": 85, "Trí Mưu": 65, "Ngoại Giao": 70 },
    talentIds: ["highborn-charm", "hot-tempered"],
    skills: { "persuasion": 8, "cunning": 7, "court-etiquette": 7 },
    equipment: [], items: [], gold: 2000,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 100,
      "Đá": 240,
      "Lương Thực": 700,
      "Ngựa": 120,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "doran-martell", mother: "mellario-norvos",
    siblings: ["quentyn-martell", "trystane-martell"],
    allies: ["doran-martell"],
    spouse: "",
    children: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Sunspear", type: "Bộ Binh", size: 600, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Sa Mạc", type: "Kỵ Binh", size: 200, quality: "Tinh Nhuệ" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 200, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "petyr-baelish", name: "Petyr Baelish", house: "Baelish", role: "Ngón Út", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
    blurb: "Từ một lãnh chúa nhỏ nhoi, hắn đã leo lên nấc thang quyền lực bằng sự dối trá và tiền bạc.",
    birthYear: 268, age: 32, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 9, "Trí Tuệ": 19, "Tinh Tường": 18, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 95, "Ngoại Giao": 90 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "trading": 10, "persuasion": 9, "gather-rumor": 9 },
    equipment: [], items: [{ ten: "Dao găm thép Valyria", soLuong: 1, moTa: "Nguồn gốc của nội chiến" }], gold: 50000,
    startResources: {
      "Gỗ": 200,
      "Quặng Sắt": 100,
      "Đá": 200,
      "Lương Thực": 1000,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "lysa-tully",
    allies: ["sansa-stark"],
    rivals: ["varys", "cersei-lannister", "eddard-stark"],
    father: "",
    mother: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Lính Thuê Của Ngón Út", type: "Bộ Binh", size: 6000, quality: "Mới Lập Đội" },
          { name: "Kỵ Sĩ Vale", type: "Kỵ Binh", size: 2000, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vale", type: "Cung Thủ", size: 2000, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: ["harrenhal"],
      holdingsLevel: {"harrenhal":1},
      baseIncome: 500
},
  {
    id: "varys", name: "Varys", house: "Không Nhà", role: "Nhện Nhện", tuocVi: "Thường Dân", religion: "Khác",
    blurb: "Thái giám cai quản lũ chim nhỏ. Bí ẩn và luôn nói rằng ông phục vụ cho vương quốc.",
    birthYear: 250, age: 50, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 19, "Tinh Tường": 20, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 70, "Trí Mưu": 95, "Ngoại Giao": 100 },
    talentIds: ["schemer", "keen-eye"],
    skills: { "gather-rumor": 10, "cunning": 10, "stealth": 8, "persuasion": 8 },
    equipment: [], items: [{ ten: "Lưới gián điệp", soLuong: 1, moTa: "Khắp mọi nơi" }], gold: 15000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["illyrio-mopatis"],
    rivals: ["petyr-baelish"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Lính Đánh Thuê Essos", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Chim Nhỏ (Điệp Viên)", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 200
},
  {
    id: "sandor-clegane", name: "Sandor Clegane", house: "Clegane", role: "Chó Săn", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    blurb: "Khuôn mặt cháy sém do anh trai gây ra. Tàn nhẫn nhưng bên trong vẫn còn le lói một nhân tính bị vùi dập.",
    birthYear: 270, age: 30, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 13, "Thể Chất": 17, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 9 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 45, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["warrior-blood", "giant-frame"],
    skills: { "sword-shield": 9, "unarmed": 8, "war-riding": 7, "intimidation": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Kiếm thép lớn", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Vung bằng một tay" }], items: [], gold: 100,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    siblings: ["gregor-clegane"],
    allies: ["arya-stark", "sansa-stark"],
    rivals: ["gregor-clegane"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    startArmies: [
          { name: "Vệ Binh Chó Săn", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Núi", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
}
];
