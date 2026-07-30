import type { CanonCharacter } from "../eras";

export const dawnAgeCharacters: CanonCharacter[] = [
  {
    id: "lann-the-clever", name: "Lann Kẻ Trí", house: "Lannister", role: "Kẻ Lừa Đảo Huyền Thoại", tuocVi: "Quốc Vương", religion: "Cựu Thần",
    origin: "Anh hùng truyền thuyết được kể là đã dùng mưu mẹo chiếm Casterly Rock và lập nên Nhà Lannister.", culture: "Người Đầu Tiên (truyền thuyết)", bloodline: "Nhà Lannister (truyền thuyết)", continent: "Westeros", appearance: "Không có mô tả canon xác thực; nhân vật chỉ tồn tại trong truyền thuyết Thời Đại Anh Hùng.",
    blurb: "Truyền thuyết kể rằng hắn đã lừa dòng dõi Casterly để lấy đi Casterly Rock chỉ bằng trí óc. Trở thành vị Vua của the Rock.",
    birthYear: -8050, age: 30, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 16, "Thể Chất": 10, "Trí Tuệ": 20, "Tinh Tường": 18, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 90, "Trí Mưu": 100, "Ngoại Giao": 90 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "cunning": 10, "stealth": 9, "persuasion": 10, "trading": 8, "command": 7 },
    equipment: [{ slot: "Vũ Khí Phụ", ten: "Dao găm mạ vàng", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, moTa: "Dao giấu trong tay áo." }], 
    items: [{ ten: "Vàng Casterly", soLuong: 100000, moTa: "Khởi đầu của huyền thoại" }], 
    gold: 150000,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 1500,
      "Đá": 1500,
      "Lương Thực": 6000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    rivals: ["garth-greenhand"],
    startArmies: [
          { name: "Lính Giáo Lannisport", type: "Bộ Binh", size: 18000, quality: "Tinh Nhuệ" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 6000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 6000, quality: "Tinh Nhuệ" }
        ],
    father: "rowan-gold-tree", // Theo một số truyền thuyết
    mother: "",
    spouse: "",
    children: [], // Rất nhiều con nhưng không rõ tên trong game
    siblings: [],
    allies: [],
      startRegions: ["the-westerlands"],
      startHoldings: ["the-westerlands-seat"],
      holdingsLevel: {"the-westerlands-seat":5},
      baseIncome: 800
},
  {
    id: "garth-greenhand", name: "Garth Bàn Tay Xanh", house: "Gardener", role: "Vị Thần Của Đất", tuocVi: "Quốc Vương", religion: "Cựu Thần",
    origin: "Vị tổ truyền thuyết của nhiều nhà quý tộc Reach, gắn với sự trù phú và việc khai phá vùng Reach.", culture: "Người Đầu Tiên (truyền thuyết)", bloodline: "Dòng Gardener (truyền thuyết)", continent: "Westeros", appearance: "Không có mô tả canon xác thực; các truyền thống địa phương kể những phiên bản khác nhau.",
    blurb: "Tổ tiên của mọi gia tộc lớn ở Reach. Đi tới đâu, cây cỏ tốt tươi tới đó, phụ nữ mang thai, vụ mùa bội thu.",
    birthYear: -8080, age: 60, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 10, "Thể Chất": 18, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 20 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 100, "Trí Mưu": 80, "Ngoại Giao": 75 },
    talentIds: ["beloved", "giant-frame"],
    skills: { "hunting": 10, "weather-endurance": 8, "persuasion": 9, "command": 8 },
    equipment: [{ slot: "Vật Phẩm Đặc Biệt", ten: "Vương miện hoa lá", phamChat: "Vô Giá", thuocTinh: { "Tôn Trọng": 15 }, moTa: "Được đan từ dây leo, không bao giờ héo" }], 
    items: [{ ten: "Hạt giống thần kỳ", soLuong: 100, moTa: "Rải xuống là mọc thành rừng" }], 
    gold: 50000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 500,
      "Đá": 1000,
      "Lương Thực": 5000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    rivals: ["lann-the-clever", "durran-godsgrief"],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 36000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 12000, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 12000, quality: "Thành Thạo" }
        ],
    father: "",
    mother: "",
    spouse: "",
    children: ["garth-the-gardener", "rowan-gold-tree"], 
    siblings: [],
    allies: [],
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "durran-godsgrief", name: "Durran Than Thở Trời", house: "Durrandon", role: "Người Xây Storm's End", tuocVi: "Quốc Vương", religion: "Cựu Thần",
    origin: "Vị vua truyền thuyết sáng lập Nhà Durrandon và Storm's End, được kể là đã thách thức thần linh.", culture: "Người Đầu Tiên (truyền thuyết)", bloodline: "Nhà Durrandon (truyền thuyết)", continent: "Westeros", appearance: "Không có mô tả canon xác thực.",
    blurb: "Kẻ dám yêu con gái thần Gió và Biển, và xây dựng Storm's End để thách thức cơn thịnh nộ của họ. Khởi thủy của Vua Bão.",
    birthYear: -8060, age: 40, coreStats: { "Sức Mạnh": 20, "Nhanh Nhẹn": 11, "Thể Chất": 20, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 100, "Thống Soái": 80, "Trí Mưu": 60, "Ngoại Giao": 65 },
    talentIds: ["hot-tempered", "warrior-blood", "giant-frame"],
    skills: { "command": 10, "weather-endurance": 10, "intimidation": 9, "sword-shield": 10 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa Vua Bão", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 10 }, moTa: "Đập tan cơn bão và kẻ thù" }], 
    items: [], 
    gold: 15000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 500,
      "Đá": 1000,
      "Lương Thực": 5000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "elenei",
    allies: ["brandon-builder"],
    startArmies: [
          { name: "Bộ Binh Bão Tố", type: "Bộ Binh", size: 21000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Vùng Bão", type: "Kỵ Binh", size: 7000, quality: "Thành Thạo" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 7000, quality: "Thành Thạo" }
        ],
    father: "",
    mother: "",
    children: ["durran-the-devout"],
    siblings: [],
    rivals: ["sea-god", "wind-goddess"],
      startRegions: ["the-stormlands"],
      startHoldings: ["the-stormlands-seat"],
      holdingsLevel: {"the-stormlands-seat":5},
      baseIncome: 400
},
  {
    id: "grey-king", name: "Vua Xám", house: "Greyiron", role: "Vua Đảo Sắt Đầu Tiên", tuocVi: "Quốc Vương", religion: "Thần Chết Chìm",
    origin: "Vua biển trong truyền thuyết Người Sắt, được kể là đã cưới một nàng tiên cá và thống trị biển cả.", culture: "Người Sắt (truyền thuyết)", bloodline: "Không xác minh", continent: "Westeros", appearance: "Không có mô tả canon xác thực.",
    blurb: "Giết rồng biển Nagga, lấy xương làm ngai. Tóc, râu và mắt đều xám màu biển động. Cai trị Quần Đảo Sắt hơn một ngàn năm.",
    birthYear: -8100, age: 80, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 20, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 19 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 95, "Trí Mưu": 70, "Ngoại Giao": 80 },
    talentIds: ["warrior-blood", "iron-constitution"],
    skills: { "war-riding": 10, "axe-mace": 10, "weather-endurance": 10, "command": 9 },
    equipment: [{ slot: "Vật Phẩm Đặc Biệt", ten: "Vương miện gỗ lũa", phamChat: "Vô Giá", thuocTinh: { "Tôn Trọng": 15 }, moTa: "Vương miện của Đảo Sắt" }], 
    items: [{ ten: "Răng rồng biển Nagga", soLuong: 1, moTa: "To như thanh gươm" }], 
    gold: 8000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 500,
      "Đá": 1000,
      "Lương Thực": 5000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Chiến Binh Đảo Sắt", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Bờ Biển", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Cung Thủ Đảo", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ], // Quân Đảo Sắt không quá đông trên bộ
    father: "",
    mother: "",
    spouse: "mermaid",
    children: [], // Hàng trăm con trai
    siblings: [],
    allies: [],
    rivals: ["nagga-sea-dragon"],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "symeon-star-eyes", name: "Symeon Mắt Sao", house: "Không Nhà", role: "Hiệp Sĩ Mù", tuocVi: "Hiệp Sĩ", religion: "Cựu Thần",
    origin: "Hiệp sĩ truyền thuyết của Thời Đại Anh Hùng, nhân vật trong những bài ca cổ miền Bắc.", culture: "Người Đầu Tiên (truyền thuyết)", bloodline: "Không xác minh", continent: "Westeros", appearance: "Được kể là có đôi mắt ngọc bích thay vì mắt người; không có chứng cứ lịch sử xác thực.",
    blurb: "Một hiệp sĩ huyền thoại mù lòa, đặt hai viên ngọc sapphire vào hốc mắt và sử dụng trường thương múa với hai đầu sắc bén.",
    birthYear: -8040, age: 35, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 20, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 5, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 80, "Thống Soái": 70, "Trí Mưu": 65, "Ngoại Giao": 25 },
    talentIds: ["born-swordsman", "duelist"],
    skills: { "sword-shield": 10, "unarmed": 8, "cunning": 6, "hunting": 5 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Thương hai đầu", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 8 }, moTa: "Xoay tít như cối xay" }, { slot: "Vật Phẩm Đặc Biệt", ten: "Mặt nạ che hốc mắt", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 1 }, moTa: "Che đi viên ngọc sao" }], 
    items: [{ ten: "Ngọc Sapphire", soLuong: 2, moTa: "Thay thế cho đôi mắt" }], 
    gold: 200,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 50,
      "Đá": 100,
      "Lương Thực": 500,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Chiến Binh Mù", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Bóng Tối", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];
