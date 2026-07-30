import type { CanonCharacter } from "../eras";

export const warOfFiveKingsCharacters: CanonCharacter[] = [
  {
    id: "tywin-lannister", name: "Tywin Lannister", house: "Lannister", role: "Lãnh Chúa Casterly Rock", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    origin: "Con trai Tytos và Jeyne Marbrand, Lãnh chúa Casterly Rock, Warden of the West và từng là Hand of the King.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros", appearance: "Cao, gầy, vai rộng; đầu hói nhưng có tóc mai vàng, mắt xanh lục nhạt và khuôn mặt lạnh lùng.",
    blurb: "Khét tiếng tàn nhẫn, giàu nhất Bảy Vương Quốc. Người thực sự nắm giữ quyền lực của Ngai Sắt từ phía sau.",
    birthYear: 242, age: 56, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 18, "Tinh Tường": 17, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 55, "Thống Soái": 90, "Trí Mưu": 90, "Ngoại Giao": 85 },
    talentIds: ["schemer", "commander-instinct"],
    skills: { "sword-shield": 9, "unarmed": 8, "war-riding": 7, "intimidation": 9 },
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
    origin: "Con trai Tywin và Joanna, em song sinh Cersei; Kingsguard trẻ nhất lịch sử khi được phong, giết Aerys II trong cuộc nổi loạn.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros", appearance: "Cao lớn, đẹp trai, tóc vàng xoăn và mắt xanh lục; ở đầu game vẫn còn cả hai tay.",
    blurb: "Hiệp sĩ Vệ Vương giỏi nhất vương quốc, đẹp trai, kiêu ngạo, nhưng mang danh Sát Vương cả đời.",
    birthYear: 266, age: 32, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 17, "Thể Chất": 14, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 75, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["born-swordsman", "duelist", "highborn-charm"],
    skills: { "sword-shield": 10, "war-riding": 8, "command": 6, "unarmed": 6 },
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
    liege: "joffrey-baratheon",
    courtPosition: "Tổng Chỉ Huy Ngự Lâm Quân",
    secretBiologicalFather: "",
    secretBiologicalMother: "",
    relationshipDetails: {
      "cersei-lannister": { type: "Người Tình", trust: 100, affinity: 100, detail: "Chị gái sinh đôi, đồng thời là người tình bí mật cả đời của Jaime." },
      "tyrion-lannister": { type: "Anh Em", trust: 80, affinity: 90, detail: "Người duy nhất trong gia đình Lannister thực sự đối xử tốt với Tyrion." },
      "joffrey-baratheon": { type: "Con Cái (Bí mật)", trust: 10, affinity: 20, detail: "Con trai ruột với Cersei, nhưng công khai là con của Robert Baratheon." },
      "myrcella-baratheon": { type: "Con Cái (Bí mật)", trust: 50, affinity: 50, detail: "Con gái ruột với Cersei." },
      "tommen-baratheon": { type: "Con Cái (Bí mật)", trust: 50, affinity: 50, detail: "Con trai ruột với Cersei." },
      "robert-baratheon": { type: "Kẻ Thù", trust: -80, affinity: -80, detail: "Vua hiện tại, người kết hôn với Cersei. Jaime khinh thường ông." },
      "brienne-tarth": { type: "Hộ Vệ", trust: 70, affinity: 60, detail: "Người phụ nữ duy nhất khiến Jaime phải nể phục. Cô thay đổi cách nhìn của Jaime về danh dự." }
    },
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  // Đã xóa tyrion-lannister bị trùng lặp với eras.ts
  {
    id: "arya-stark", name: "Arya Stark", house: "Stark", role: "Sói Hoang", tuocVi: "Thường Dân", religion: "Cựu Thần",
    origin: "Con gái thứ của Eddard Stark và Catelyn Tully, lớn lên tại Winterfell trước khi chiến tranh chia cắt gia đình.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Stark và Tully", continent: "Westeros", appearance: "Tóc nâu, mặt dài kiểu Stark và mắt xám; thường bị nhầm là một cậu bé vì dáng mảnh và cách ăn mặc.",
    blurb: "Cô con gái út bướng bỉnh nhà Stark, yêu kiếm thuật hơn thêu thùa, ghét sự giả dối của triều đình.",
    birthYear: 289, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 14, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 9 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 45, "Trí Mưu": 60, "Ngoại Giao": 75 },
    talentIds: ["keen-eye"],
    skills: { "unarmed": 3, "stealth": 5, "hunting": 3 },
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
    liege: "robb-stark",
    relationshipDetails: {
      "eddard-stark": { type: "Cha", trust: 100, affinity: 100, detail: "Cha cô, người dạy Arya rằng mùa đông đang đến và kẻ mạnh phải bảo vệ kẻ yếu." },
      "jon-snow": { type: "Anh Chị Em", trust: 100, affinity: 100, detail: "Anh trai cưng nhất, người tặng cô thanh kiếm Needle. Giống hệt cha." },
      "sandor-clegane": { type: "Hộ Vệ", trust: 40, affinity: 50, detail: "Chó Săn — kẻ thù trở thành người bảo vệ bất đắc dĩ. Arya vừa ghét vừa nể." }
    },
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
    origin: "Con gái cả Eddard Stark và Catelyn Tully, được nuôi dạy để trở thành quý nữ miền Bắc rồi đến King's Landing theo cha.", culture: "Người Đầu Tiên vùng Bắc; giáo dưỡng Riverlands", bloodline: "Nhà Stark và Tully", continent: "Westeros", appearance: "Tóc đỏ nâu dày của nhà Tully, mắt xanh lam và vẻ ngoài được xem là xinh đẹp giống mẹ.",
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
    origin: "Con trai thứ hai Eddard Stark và Catelyn Tully, người thừa kế Winterfell sau Robb trước khi bị Jaime đẩy ngã.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Stark và Tully", continent: "Westeros", appearance: "Cậu bé tóc nâu, mắt nâu xám và dáng người nhỏ; mất khả năng đi lại sau cú ngã ở Winterfell.",
    blurb: "Mê leo trèo cho đến khi bị ngã, giờ chỉ còn sức mạnh tâm linh dẫn dắt.",
    birthYear: 290, age: 8, coreStats: { "Sức Mạnh": 3, "Nhanh Nhẹn": 3, "Thể Chất": 6, "Trí Tuệ": 14, "Tinh Tường": 17, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 15, "Thống Soái": 50, "Trí Mưu": 70, "Ngoại Giao": 85 },
    talentIds: ["warg"],
    skills: { "lore": 5, "hunting": 6 },
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
    origin: "Con trai út còn sống của Balon Greyjoy, bị nuôi tại Winterfell làm con tin sau Cuộc nổi loạn Greyjoy.", culture: "Người Sắt; giáo dưỡng miền Bắc", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Tóc đen, dáng mảnh và nụ cười tự tin; còn nguyên vẹn trước khi bị Ramsay hành hạ.",
    blurb: "Con tin sống cùng nhà Stark, khao khát được công nhận, ngạo mạn nhưng đầy mặc cảm.",
    birthYear: 279, age: 19, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 13, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 55, "Trí Mưu": 50, "Ngoại Giao": 65 },
    talentIds: ["hot-tempered"],
    skills: { "bow-crossbow": 8, "trading": 6, "sword-shield": 5 },
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
    liege: "balon-greyjoy",
    relationshipDetails: {
      "robb-stark": { type: "Anh Em Nuôi", trust: 50, affinity: 60, detail: "Lớn lên cùng Robb nhưng luôn cảm thấy là người ngoài. Theon phản bội Robb để chứng minh mình xứng đáng." },
      "balon-greyjoy": { type: "Cha", trust: 20, affinity: 30, detail: "Balon khinh thường Theon vì sống như người Xanh. Cha con xa cách." },
      "ramsay-snow": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Kẻ tra tấn và bẻ gãy Theon, biến cậu thành Reek." }
    },
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
    origin: "Con gái Balon Greyjoy, thuyền trưởng Black Wind và người có ảnh hưởng lớn trong kế vị Quần Đảo Sắt.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Cao, gầy khỏe, tóc đen ngắn, mắt tối và nụ cười sắc; ăn mặc như một thuyền trưởng hơn là quý nữ.",
    blurb: "Chiến binh kiêu hãnh của Quần Đảo Sắt, người được Balon coi trọng hơn cậu em trai Theon.",
    birthYear: 275, age: 23, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 65 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "trading": 8, "axe-mace": 7, "command": 7, "intimidation": 6 },
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
    liege: "balon-greyjoy",
    relationshipDetails: {
      "balon-greyjoy": { type: "Cha", trust: 90, affinity: 80, detail: "Balon coi Asha là người thừa kế thực sự, không phải Theon." },
      "theon-greyjoy": { type: "Em Trai", trust: 50, affinity: 60, detail: "Asha thương Theon nhưng coi thường sự yếu đuối và mong muốn được công nhận của cậu." },
      "euron-greyjoy": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Euron cướp ngôi vua bằng phép thuật và sự tàn ác. Asha coi chú là mối đe dọa cho toàn bộ Quần Đảo Sắt." }
    },
    spouse: "",
    children: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "euron-greyjoy", name: "Euron Greyjoy", house: "Greyjoy", role: "Mắt Quạ", tuocVi: "Quốc Vương", religion: "Thần Chết Chìm",
    origin: "Em trai Balon Greyjoy, thuyền trưởng Silence và kẻ lưu vong trở về tranh quyền sau cái chết của Balon.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Tóc đen phủ vai, râu sẫm; một mắt xanh biếc còn mắt kia che bằng miếng bịt màu đen.",
    blurb: "Độc ác, điên rồ, dùng phép thuật hắc ám và dong buồm trên tàu Im Lặng với thủy thủ đoàn bị cắt lưỡi.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 17, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 80, "Trí Mưu": 80, "Ngoại Giao": 85 },
    talentIds: ["schemer", "warrior-blood"],
    skills: { "trading": 10, "cunning": 9, "command": 8, "intimidation": 9 },
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
    origin: "Con gái Mace Tyrell và Alerie Hightower, cháu ngoại Olenna Redwyne; được đưa vào các hôn ước hoàng gia của Nhà Tyrell.", culture: "Người Reach", bloodline: "Nhà Tyrell, Hightower và Redwyne", continent: "Westeros", appearance: "Tóc nâu xoăn, mắt nâu ấm và nụ cười cuốn hút; thường được so sánh với một đóa hồng.",
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
    liege: "mace-tyrell",
    relationshipDetails: {
      "olenna-tyrell": { type: "Bà Nội", trust: 100, affinity: 100, detail: "Olenna dạy Margaery nghệ thuật chính trị. Bà cháu như nhau — sắc sảo và nguy hiểm." },
      "cersei-lannister": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Cersei ghen tỵ và sợ hãi sự nổi tiếng của Margaery. Hai người chiến tranh lạnh ngay trong Hồng Bảo Thành." },
      "renly-baratheon": { type: "Chồng Cũ", trust: 60, affinity: 50, detail: "Renly hào hoa nhưng không yêu Margaery. Cô biết điều đó và chấp nhận vì quyền lực." }
    },
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
    origin: "Sinh ra là Olenna Redwyne, vợ quá cố Luthor Tyrell và bà nội của Margaery, người điều hướng chính trị thực tế của Highgarden.", culture: "Người Reach", bloodline: "Nhà Redwyne; kết hôn vào Tyrell", continent: "Westeros", appearance: "Bà lão nhỏ người, tóc bạc, mắt sáng và lưỡi sắc như gai hồng.",
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
    relationshipDetails: {
      "margaery-tyrell": { type: "Cháu Gái", trust: 100, affinity: 100, detail: "Margaery là con cờ chính trị hoàn hảo của Olenna. Bà huấn luyện cháu thành Vương Hậu." },
      "tywin-lannister": { type: "Đối Thủ", trust: 20, affinity: 10, detail: "Hai bộ óc chính trị sắc bén nhất. Olenna đầu độc Joffrey một phần vì Tywin kiểm soát ngai vàng." },
      "cersei-lannister": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Olenna coi Cersei là ngu ngốc và nguy hiểm. Chính Olenna ra tay giết Joffrey." }
    },
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
    origin: "Lãnh chúa Dreadfort, chư hầu Stark; về sau phản bội Robb trong kế hoạch Red Wedding cùng Lannister và Frey.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Bolton", continent: "Westeros", appearance: "Da nhợt nhạt, mắt nhạt gần như không màu và giọng nói nhỏ nhẹ, lạnh lẽo.",
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
    origin: "Con ngoài giá thú của Roose Bolton và vợ một thợ xay; được nuôi ở Dreadfort rồi thừa hưởng tước vị sau phản bội.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Bolton, mang họ Snow trước khi hợp pháp hoá", continent: "Westeros", appearance: "Môi hồng, da hồng mịn, tóc đen nhờn và đôi mắt nhạt, sát gần nhau; vẻ ngoài trái ngược sự tàn bạo.",
    blurb: "Bạo chúa tâm thần, thích hành hạ người khác, nuôi chó săn để truy sát con người.",
    birthYear: 276, age: 22, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 13, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["hot-tempered", "warrior-blood"],
    skills: { "intimidation": 9, "unarmed": 8, "hunting": 8, "sword-shield": 6 },
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
    liege: "roose-bolton",
    relationshipDetails: {
      "roose-bolton": { type: "Cha", trust: 50, affinity: 30, detail: "Roose biết Ramsay nguy hiểm nhưng cần một người thừa kế. Ramsay khát khao được cha công nhận." },
      "theon-greyjoy": { type: "Nạn Nhân", trust: 0, affinity: 0, detail: "Ramsay tra tấn Theon cho đến khi bẻ gãy tinh thần, biến cậu thành Reek." },
      "sansa-stark": { type: "Vợ", trust: 0, affinity: 0, detail: "Cuộc hôn nhân cưỡng ép. Ramsay hành hạ Sansa để khẳng định quyền lực." }
    },
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
    origin: "Con gái duy nhất Selwyn Tarth, Lord of Evenfall Hall; thề bảo vệ Renly rồi Catelyn Stark.", culture: "Người Bão Tố", bloodline: "Nhà Tarth", continent: "Westeros", appearance: "Rất cao, vai rộng, tóc màu rơm, mặt đầy tàn nhang, mũi gãy và mắt xanh; tự nhận mình xấu xí.",
    blurb: "To lớn, không xinh đẹp, nhưng trung thành tuyệt đối và là một trong những kiếm sĩ giỏi nhất.",
    birthYear: 280, age: 18, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 17, "Trí Tuệ": 10, "Tinh Tường": 11, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 55, "Trí Mưu": 50, "Ngoại Giao": 55 },
    talentIds: ["giant-frame", "born-swordsman"],
    skills: { "sword-shield": 9, "war-riding": 6, "unarmed": 7 },
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
    liege: "renly-baratheon",
    relationshipDetails: {
      "renly-baratheon": { type: "Chủ", trust: 100, affinity: 100, detail: "Brienne yêu Renly vì ông là người duy nhất đối xử tốt với cô. Cái chết của Renly là nỗi đau lớn nhất." },
      "jaime-lannister": { type: "Bằng Hữu", trust: 80, affinity: 70, detail: "Jaime giao cho Brienne nhiệm vụ bảo vệ con gái Stark. Hai người dần kính trọng nhau sau hành trình gian khổ." },
      "catelyn-tully": { type: "Chủ", trust: 90, affinity: 85, detail: "Catelyn tin tưởng Brienne hơn hầu hết đàn ông. Brienne thề bảo vệ con gái của Catelyn." }
    },
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
    origin: "Cựu kẻ buôn lậu ở King's Landing, được Stannis phong hiệp sĩ và ban đất sau khi phá vòng vây Storm's End bằng hành tây.", culture: "Người Crownlands", bloodline: "Nhà Seaworth do Stannis lập", continent: "Westeros", appearance: "Người đàn ông bình dị, tóc nâu xám và bàn tay còn bốn đốt ngón bị cắt để trả giá cho quá khứ buôn lậu.",
    blurb: "Từ một kẻ buôn lậu trở thành Cánh Tay Phải trung thành nhất của Stannis Baratheon.",
    birthYear: 260, age: 38, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 65, "Ngoại Giao": 75 },
    talentIds: ["beloved"],
    skills: { "trading": 9, "persuasion": 8, "cunning": 6 },
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
    liege: "stannis-baratheon",
    relationshipDetails: {
      "stannis-baratheon": { type: "Chủ", trust: 100, affinity: 100, detail: "Davos trung thành tuyệt đối với Stannis. Ông là người duy nhất dám nói thật với Stannis." },
      "melisandre": { type: "Đối Thủ", trust: 10, affinity: 10, detail: "Davos không tin phép thuật và sợ ảnh hưởng của Melisandre lên Stannis. Hai người liên tục tranh giành ảnh hưởng." },
      "shireen-baratheon": { type: "Bảo Vệ", trust: 100, affinity: 100, detail: "Davos yêu thương Shireen như con gái. Cô bé dạy ông đọc chữ." }
    },
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
    origin: "Con trai Quellon Greyjoy, Lãnh chúa Pyke đã thất bại trong cuộc nổi loạn năm 289 AC và khởi xướng cuộc chiến mới khi Bảy Vương Quốc suy yếu.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Gầy, tóc đen pha xám, gương mặt khắc khổ và ánh mắt cứng rắn.",
    blurb: "Lần thứ hai xưng vương, lần này đánh vào Phương Bắc yếu ớt thay vì Lannisport.",
    birthYear: 256, age: 42, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 12, "Tinh Tường": 11, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 55 },
    talentIds: ["warrior-blood", "hot-tempered"],
    skills: { "axe-mace": 6, "command": 7, "trading": 7 },
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
    relationshipDetails: {
      "theon-greyjoy": { type: "Con Cái", trust: 10, affinity: 10, detail: "Balon coi Theon là đứa con đã mất, bị đồng hóa bởi người Xanh. Ông từ chối nhìn nhận Theon." },
      "asha-greyjoy": { type: "Con Cái", trust: 90, affinity: 80, detail: "Asha là niềm tự hào của Balon — chiến binh thực sự của Quần Đảo Sắt." },
      "euron-greyjoy": { type: "Em Trai", trust: 10, affinity: 0, detail: "Balon cấm Euron quay về Quần Đảo Sắt. Ông biết Euron nguy hiểm và điên loạn." }
    },
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "catelyn-tully", name: "Catelyn Stark", house: "Tully", role: "Phu Nhân Winterfell", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
    origin: "Con gái Hoster Tully và Minisa Whent, vợ Eddard Stark, mẹ của năm người con hợp pháp nhà Stark.", culture: "Người Riverlands", bloodline: "Nhà Tully và Whent; kết hôn vào Stark", continent: "Westeros", appearance: "Tóc đỏ nâu, mắt xanh lam và vẻ ngoài thanh lịch; các con gái Sansa và Arya lần lượt giống bà và Ned.",
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
    liege: "robb-stark",
    relationshipDetails: {
      "eddard-stark": { type: "Chồng (Đã Mất)", trust: 100, affinity: 100, detail: "Catelyn yêu Ned sâu sắc, mặc dù cuộc hôn nhân bắt đầu từ chính trị. Cái chết của Ned là khoen đau để đời." },
      "robb-stark": { type: "Con Cái", trust: 100, affinity: 100, detail: "Robb là con trai trưởng. Catelyn cố vấn cho Robb nhưng cậu thường không nghe." },
      "jon-snow": { type: "Con Nuôi", trust: 20, affinity: 10, detail: "Catelyn không bao giờ chấp nhận Jon — đứa con hoang nhắc nhở cô về sự không chung thủy của Ned." },
      "petyr-baelish": { type: "Bạn Cũ", trust: 60, affinity: 40, detail: "Petyr yêu Catelyn từ nhỏ. Catelyn coi Petyr như em trai nhưng không biết sự ám ảnh của hắn." }
    },
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
    origin: "Con trai út Eddard Stark và Catelyn Tully, còn rất nhỏ khi chiến tranh phá vỡ gia đình ở Winterfell.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Stark và Tully", continent: "Westeros", appearance: "Cậu bé tóc nâu, mắt nâu; hoang dại và khó kiểm soát hơn các anh chị sau biến cố.",
    blurb: "Con út nhà Stark, hoang dã và không kiểm soát.",
    birthYear: 295, age: 3, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 5, "Trí Tuệ": 5, "Tinh Tường": 8, "Uy Tín": 6 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 30, "Trí Mưu": 25, "Ngoại Giao": 40 },
    talentIds: ["warg"], skills: { "hunting": 4 },
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
    liege: "robb-stark",
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
    origin: "Con gái Hoster Tully và Minisa Whent, góa phụ Jon Arryn, nhiếp chính Vale cho con trai Robert Arryn.", culture: "Người Riverlands; sống tại Vale", bloodline: "Nhà Tully và Whent; kết hôn vào Arryn", continent: "Westeros", appearance: "Tóc đỏ nâu kiểu Tully, mắt xanh nhạt; gương mặt mệt mỏi vì bất an và chăm sóc Robert.",
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
    relationshipDetails: {
      "petyr-baelish": { type: "Người Tình", trust: 100, affinity: 100, detail: "Lysa yêu Petyr điên cuồng từ bé. Cô giết chồng Jon Arryn theo lệnh Petyr mà không hề hay biết mình bị lợi dụng." },
      "catelyn-tully": { type: "Chị Gái", trust: 30, affinity: 20, detail: "Lysa ghen tỵ với Catelyn vì Petyr yêu chị. Mối quan hệ chị em đổ vỡ vì ghen tuông." },
      "robert-arryn": { type: "Con Cái", trust: 100, affinity: 100, detail: "Lysa bảo vệ Robin bằng sự hoang tưởng và tình yêu bệnh hoạn, không cho cậu bé lớn lên." }
    },
      startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat":5},
      baseIncome: 450
},
  {
    id: "edmure-tully", name: "Edmure Tully", house: "Tully", role: "Người Thừa Kế Riverrun", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
    origin: "Con trai duy nhất Hoster Tully, Lord of Riverrun và Lord Paramount of the Trident sau khi cha lâm bệnh qua đời.", culture: "Người Riverlands", bloodline: "Nhà Tully và Whent", continent: "Westeros", appearance: "Tóc đỏ nâu và mắt xanh lam theo dòng Tully; đẹp trai, cởi mở nhưng thiếu kinh nghiệm chiến trường.",
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
    liege: "robb-stark",
    relationshipDetails: {
      "robb-stark": { type: "Chủ", trust: 90, affinity: 80, detail: "Edmure chiến đấu cho Robb nhưng nhiều lần gây rối chiến lược của Robb vì bốc đồng." },
      "brynden-tully": { type: "Chú", trust: 100, affinity: 100, detail: "Cá Đen luôn bảo vệ và hướng dẫn Edmure, mặc dù thường chê Edmure thiếu kiên nhẫn." }
    },
    spouse: "",
    children: [],
      startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat":5},
      baseIncome: 450
},
  {
    id: "brynden-tully", name: "Brynden Tully", house: "Tully", role: "Cá Đen", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    origin: "Em trai Hoster Tully, hiệp sĩ độc thân được gọi là Blackfish và là cố vấn quân sự thân cận của Robb Stark.", culture: "Người Riverlands", bloodline: "Nhà Tully", continent: "Westeros", appearance: "Người đàn ông già nhưng còn rắn rỏi, tóc đỏ pha xám và râu nhọn; mặc giáp đen với biểu tượng cá đen.",
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
    liege: "robb-stark",
    relationshipDetails: {
      "robb-stark": { type: "Chủ", trust: 100, affinity: 90, detail: "Brynden là tư lệnh tiền tuyến của Robb. Ông kính trọng khả năng lãnh đạo của Robb." },
      "catelyn-tully": { type: "Cháu Gái", trust: 100, affinity: 100, detail: "Brynden yêu thương Catelyn như con gái. Ông là người bảo vệ gia đình Tully." },
      "jaime-lannister": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Kẻ Sát Vương bắt cóc và làm nhục gia tộc Tully. Brynden thề sẽ trả thù." }
    },
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
    origin: "Con trai Luthor Tyrell và Olenna Redwyne, Lord of Highgarden và Warden of the South; cha của Margaery và Loras.", culture: "Người Reach", bloodline: "Nhà Tyrell và Redwyne", continent: "Westeros", appearance: "Quý tộc to lớn, tự mãn và ăn mặc xa hoa; nguồn canon không ghi nhận chân dung chi tiết hơn.",
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
    relationshipDetails: {
      "olenna-redwyne": { type: "Mẹ", trust: 100, affinity: 80, detail: "Mace nghĩ mình ra quyết định, nhưng thực ra Olenna điều khiển mọi thứ từ phía sau." },
      "margaery-tyrell": { type: "Con Gái", trust: 100, affinity: 100, detail: "Mace tự hào vì Margaery trở thành Vương Hậu. Ông coi đó là thành tựu lớn nhất." },
      "randyll-tarly": { type: "Đồng Minh", trust: 80, affinity: 70, detail: "Tarly là tướng giỏi nhất của Mace. Mace phụ thuộc vào tài quân sự của ông." }
    },
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "loras-tyrell", name: "Loras Tyrell", house: "Tyrell", role: "Hiệp Sĩ Hoa", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    origin: "Con trai út Mace Tyrell và Alerie Hightower, em trai Margaery; hiệp sĩ nổi tiếng và người tình của Renly Baratheon.", culture: "Người Reach", bloodline: "Nhà Tyrell và Hightower", continent: "Westeros", appearance: "Rất đẹp trai, tóc nâu xoăn, mắt nâu và vóc dáng mảnh của một hiệp sĩ trẻ.",
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
    liege: "mace-tyrell",
    relationshipDetails: {
      "renly-baratheon": { type: "Người Tình", trust: 100, affinity: 100, detail: "Người tình bí mật. Cái chết của Renly khiến Loras vô cùng đau khổ và thề sẽ trả thù." },
      "margaery-tyrell": { type: "Chị Em", trust: 100, affinity: 100, detail: "Em gái yêu quý. Loras bảo vệ Margaery bằng mọi giá." },
      "jaime-lannister": { type: "Đối Thủ", trust: 30, affinity: 40, detail: "Hai kiếm sĩ giỏi nhất vương quốc, kính trọng nhau trên trường đấu." }
    },
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
    origin: "Em trai Balon Greyjoy, Lord Captain of the Iron Fleet và một chiến binh tận trung với tập tục Người Sắt.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Rất to lớn, tóc đen, râu rậm và mắt xám thép; sau trận Fair Isle thường che bàn tay bị thương bằng găng sắt.",
    blurb: "Chiến binh tàn bạo trên biển, không có trí thông minh chính trị nhưng trung thành và vô cùng đáng sợ.",
    birthYear: 268, age: 30, coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 8, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 85, "Thống Soái": 60, "Trí Mưu": 40, "Ngoại Giao": 50 },
    talentIds: ["warrior-blood", "giant-frame"], skills: { "trading": 9, "axe-mace": 9, "command": 7 },
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
    allies: ["balon-greyjoy"],
    rivals: ["euron-greyjoy"],
    liege: "balon-greyjoy",
    relationshipDetails: {
      "balon-greyjoy": { type: "Lãnh Chúa", trust: 100, affinity: 80, detail: "Trung thành tuyệt đối với anh trai Balon. Victarion luôn tuân lệnh mà không hỏi." },
      "euron-greyjoy": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Euron giết vợ cũ của Victarion. Mối thù máu không bao giờ nguôi." }
    },
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
    origin: "Em trai Balon, Euron và Victarion; từng là người ham vui rồi trở thành mục sư tận hiến của Drowned God sau tai nạn đắm tàu.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Gầy cao, tóc đen dài luôn ướt, râu đen và mắt dữ; mặc áo thô, chân trần theo nghi thức tôn giáo.",
    blurb: "Tu sĩ cuồng tín của Thần Chết Chìm, uống nước biển và ban phước bằng cách dìm nước.",
    birthYear: 269, age: 29, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 11, "Tinh Tường": 15, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 55, "Thống Soái": 70, "Trí Mưu": 55, "Ngoại Giao": 75 },
    talentIds: ["beloved"], skills: { "lore": 6, "persuasion": 8, "trading": 6 },
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
    liege: "balon-greyjoy",
    relationshipDetails: {
      "balon-greyjoy": { type: "Anh Trai", trust: 80, affinity: 70, detail: "Aeron tôn thờ anh trai như một vị vua xứng đáng của Quần Đảo Sắt." },
      "euron-greyjoy": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Euron làm những việc khủng khiếp với Aeron khi còn nhỏ. Aeron không bao giờ quên và sợ hãi anh ta." }
    },
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
    origin: "Em trai Tywin Lannister, chồng Dorna Swyft và cha Lancel; chỉ huy, cố vấn trung thành nhất của Tywin.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros", appearance: "Tóc vàng pha bạc, bộ ria vàng và vóc dáng rắn rỏi; gương mặt có nét giống Tywin nhưng mềm hơn.",
    blurb: "Đáng tin cậy, vững vàng và luôn đứng trong cái bóng của người anh trai vĩ đại Tywin Lannister.",
    birthYear: 244, age: 54, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 9, "Thể Chất": 11, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 70, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["learned", "commander-instinct"], skills: { "command": 7, "trading": 6, "court-etiquette": 7 },
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
    liege: "tywin-lannister",
    relationshipDetails: {
      "tywin-lannister": { type: "Anh Trai", trust: 100, affinity: 90, detail: "Kevan luôn là cánh tay phải trung thành nhất của Tywin, không bao giờ tranh giành quyền lực." },
      "cersei-lannister": { type: "Cháu Gái", trust: 40, affinity: 30, detail: "Kevan thấy Cersei kiêu ngạo và thiếu khả năng, nhưng im lặng khi Tywin còn sống." }
    },
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 200
},
  {
    id: "lancel-lannister", name: "Lancel Lannister", house: "Lannister", role: "Hiệp Sĩ Trẻ", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
    origin: "Con trai cả Kevan Lannister và Dorna Swyft, em họ của Cersei, Jaime và Tyrion; hầu cận cho Robert I.", culture: "Người miền Tây", bloodline: "Nhà Lannister và Swyft", continent: "Westeros", appearance: "Chàng trai tóc vàng, còn rất trẻ và mảnh khảnh; gương mặt xanh xao hơn sau trận Blackwater.",
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
    liege: "tywin-lannister",
    relationshipDetails: {
      "cersei-lannister": { type: "Người Tình", trust: 70, affinity: 80, detail: "Cersei dụ dỗ Lancel để hại vua Robert. Lancel đam mê Cersei nhưng sau này hối hận sâu sắc." },
      "robert-baratheon": { type: "Nạn Nhân", trust: 0, affinity: 0, detail: "Lancel rót rượu mạnh cho Robert theo lệnh Cersei, góp phần giết vua." }
    },
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
    origin: "Sinh ra là Selyse Florent, vợ Stannis Baratheon và mẹ Shireen; chuyển sang sùng bái R'hllor dưới ảnh hưởng Melisandre.", culture: "Người Reach", bloodline: "Nhà Florent; kết hôn vào Baratheon", continent: "Westeros", appearance: "Tai to, mắt xanh nhạt, tóc nâu; vẻ mặt nghiêm khắc và hơi gầy gò.",
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
    liege: "stannis-baratheon",
    relationshipDetails: {
      "stannis-baratheon": { type: "Chồng", trust: 60, affinity: 30, detail: "Stannis không yêu Selyse nhưng cần cô là vợ. Selyse chấp nhận vì bổn phận." },
      "melisandre": { type: "Tín Đồ", trust: 100, affinity: 100, detail: "Selyse sùng bái Melisandre và Thần Ánh Sáng, sẵn sàng hy sinh mọi thứ cho đức tin." },
      "shireen-baratheon": { type: "Con Gái", trust: 40, affinity: 30, detail: "Selyse thương Shireen nhưng xấu hổ về bệnh Vảy Xám của con." }
    },
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
    origin: "Con gái duy nhất Stannis Baratheon và Selyse Florent, người thừa kế Dragonstone khi Stannis không có con trai.", culture: "Người Bão Tố", bloodline: "Nhà Baratheon và Florent", continent: "Westeros", appearance: "Cô bé tóc nâu sẫm; nửa mặt và cổ trái bị sẹo xám lồi do greyscale thời thơ ấu.",
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
    liege: "stannis-baratheon",
    relationshipDetails: {
      "stannis-baratheon": { type: "Cha", trust: 80, affinity: 60, detail: "Stannis ít biểu lộ tình cảm nhưng yêu Shireen theo cách riêng." },
      "davos-seaworth": { type: "Bằng Hữu", trust: 100, affinity: 100, detail: "Davos là người bạn thân nhất của Shireen. Cô dạy ông đọc chữ." },
      "melisandre": { type: "Mối Đe Dọa", trust: 0, affinity: 0, detail: "Melisandre nhìn Shireen với ánh mắt kỳ lạ. Máu vua chảy trong huyết quản cô bé." }
    },
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
    origin: "Nữ tư tế đỏ của R'hllor, tự xưng là Melisandre of Asshai và đến Dragonstone để ủng hộ tuyên bố của Stannis.", culture: "Asshai'i", bloodline: "Không xác minh", continent: "Essos", appearance: "Cao, mảnh, tóc đỏ đồng và mắt đỏ; vẻ trẻ trung của bà gắn với vòng cổ ruby ma thuật.",
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
    allies: ["stannis-baratheon", "selyse-florent"],
    rivals: ["davos-seaworth"],
    liege: "stannis-baratheon",
    relationshipDetails: {
      "stannis-baratheon": { type: "Chủ/Khách Hàng", trust: 80, affinity: 60, detail: "Melisandre tin Stannis là Azor Ahai tái sinh. Cô phục vụ ông vì sứ mệnh thiêng liêng." },
      "davos-seaworth": { type: "Đối Thủ", trust: 10, affinity: 10, detail: "Davos không tin phép thuật và coi Melisandre là mối nguy. Hai người liên tục tranh giành ảnh hưởng với Stannis." },
      "selyse-florent": { type: "Tín Đồ", trust: 90, affinity: 70, detail: "Selyse sùng bái Melisandre và Thần Ánh Sáng, nghe theo mọi lời cô." }
    },
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
