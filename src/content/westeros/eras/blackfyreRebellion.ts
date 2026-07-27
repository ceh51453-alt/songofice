import type { CanonCharacter } from "../eras";

export const blackfyreRebellionCharacters: CanonCharacter[] = [
  {
    id: "baelor-breakspear",
    name: "Baelor Breakspear",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Dragonstone",
    religion: "Thất Diện Thần",
    blurb: "Con trai trưởng và là người thừa kế của vua Daeron II. Baelor mang nhiều nét của người mẹ xứ Dorne với mái tóc đen và làn da ngăm. Anh là một chỉ huy lỗi lạc, người đã đập tan quân Blackfyre tại Cánh Đồng Cỏ Đỏ.",
    birthYear: 170,
    deathYear: 209,
    age: 26,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 18 },
    talentIds: ["born-leader", "honorable", "chivalrous"],
    skills: { "Chỉ Huy": 18, "Cận Chiến (Kiếm)": 15, "Cưỡi Ngựa": 14, "Ngoại Giao": 16 },
    equipment: [],
    items: [],
    gold: 2000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daeron-ii-targaryen", mother: "myriah-martell",
    spouse: "jena-dondarrion",
    children: ["valarr-targaryen", "matarys-targaryen"],
    siblings: ["aerys-i-targaryen", "rhaegel-targaryen", "maekar-i-targaryen"],
    allies: ["maekar-i-targaryen"],
    rivals: ["daemon-blackfyre"],
    personalHooks: [
      { id: "baelor-redgrass", title: "Cánh Đồng Cỏ Đỏ", year: "196 AC", numericYear: 196, desc: "Ngươi dẫn đầu đội quân Dorne và Stormlands đánh bọc sườn phiến quân Blackfyre. Chiến thắng hay thảm bại phụ thuộc vào nhát chùy của ngươi." }
    ],
    startArmies: [
          { name: "Vệ Binh Rồng", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 300, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 10, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "maekar-i-targaryen",
    name: "Maekar Targaryen",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Mùa Hè",
    religion: "Thất Diện Thần",
    blurb: "Con trai thứ tư của Daeron II. Khác với người anh Baelor hoàn hảo, Maekar gai góc, khắc nghiệt và mang nhiều mặc cảm. Dù vậy, cái đe của Maekar đã chặn đứng cuộc tiến công của phiến quân.",
    birthYear: 174,
    deathYear: 233,
    age: 22,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 10 },
    talentIds: ["stubborn", "fearsome-warrior", "pragmatic"],
    skills: { "Cận Chiến (Chùy)": 16, "Chỉ Huy": 15 },
    equipment: [],
    items: [],
    gold: 1500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daeron-ii-targaryen", mother: "myriah-martell",
    spouse: "dyanna-dayne",
    children: ["daeron-the-drunken", "aerion-brightflame", "aemon-targaryen", "aegon-v-targaryen", "daella-targaryen", "rhae-targaryen"],
    siblings: ["baelor-breakspear"],
    allies: ["baelor-breakspear"],
    rivals: ["daemon-blackfyre"],
    personalHooks: [
      { id: "maekar-anvil", title: "Cái Đe Của Maekar", year: "196 AC", numericYear: 196, desc: "Bức tường khiên của ngươi phải đứng vững trước cuộc tấn công mãnh liệt của Bittersteel, tạo thành cái đe cho chiếc búa của Baelor đập xuống." }
    ],
    startArmies: [
          { name: "Vệ Binh Rồng", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 300, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 10, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "shiera-seastar",
    name: "Shiera Seastar",
    tuocVi: "Thường Dân",
    house: "Khác",
    role: "Ngôi Sao Biển",
    religion: "Thất Diện Thần",
    blurb: "Đứa con hoang xinh đẹp nhất của vua Aegon IV. Có hai màu mắt khác biệt và vẻ đẹp ma mị, Shiera luôn đứng giữa cuộc tình tay ba với Bloodraven và Bittersteel.",
    birthYear: 178,
    age: 18,
    coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 15, "Uy Tín": 20 },
    talentIds: ["seductive", "mystic", "intelligent"],
    skills: { "Thuyết Phục": 18, "Ma Thuật (Bóng Tối)": 14, "Quyến Rũ": 20 },
    equipment: [],
    items: [{ ten: "Dây Chuyền Sao Biển", soLuong: 1, moTa: "Sợi dây chuyền bạc điểm những viên ngọc bích và ngọc lục bảo." }],
    gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "aegon-iv-targaryen", mother: "serenei-of-lys",
    siblings: ["daemon-blackfyre", "aegor-rivers", "brynden-rivers"],
    allies: ["brynden-rivers"],
    rivals: [],
    personalHooks: [
      { id: "shiera-choice", title: "Lựa Chọn Của Ngôi Sao", year: "196 AC", numericYear: 196, desc: "Cả Bloodraven và Bittersteel đều cầu xin tình yêu của ngươi trước khi họ ra trận để chém giết lẫn nhau." }
    ],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "gwayne-corbray",
    name: "Gwayne Corbray",
    tuocVi: "Hiệp Sĩ",
    house: "Corbray",
    role: "Hiệp Sĩ Vệ Vương",
    religion: "Thất Diện Thần",
    blurb: "Thành viên Vệ Vương, cầm thanh kiếm thép Valyria Lady Forlorn. Cuộc đấu tay đôi giữa ông và Daemon Blackfyre là một trong những trận chiến huyền thoại nhất.",
    birthYear: 165,
    deathYear: 196,
    age: 31,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 16, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 14, "Uy Tín": 12 },
    talentIds: ["loyal", "chivalrous", "fearsome-warrior"],
    skills: { "Cận Chiến (Kiếm)": 18, "Cưỡi Ngựa": 14 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Lady Forlorn", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 25 }, moTa: "Thanh kiếm Thép Valyria của Nhà Corbray." }],
    items: [],
    gold: 50,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 75,
      "Đá": 400,
      "Lương Thực": 400,
      "Ngựa": 24,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daeron-ii", "baelor-breakspear"],
    rivals: ["daemon-blackfyre"],
    personalHooks: [
      { id: "corbray-duel", title: "Cuộc Đấu Huyền Thoại", year: "196 AC", numericYear: 196, desc: "Trực diện với Daemon Blackfyre. Lady Forlorn chạm trán thanh Blackfyre trong tiếng gầm thét của hàng vạn binh lính." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "quentyn-ball",
    name: "Quentyn Ball",
    tuocVi: "Hiệp Sĩ",
    house: "Ball",
    role: "Quả Cầu Lửa",
    religion: "Thất Diện Thần",
    blurb: "Được mệnh danh là 'Fireball'. Bị từ chối vị trí trong Vệ Vương, Quentyn mang mối thù sâu sắc và trở thành một trong những chỉ huy xuất sắc nhất của quân Blackfyre.",
    birthYear: 160,
    deathYear: 196,
    age: 36,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 15, "Thể Chất": 16, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 14 },
    talentIds: ["fearsome-warrior", "vengeful", "ambitious"],
    skills: { "Cận Chiến (Kiếm)": 17, "Chỉ Huy": 15 },
    equipment: [],
    items: [],
    gold: 200,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 50,
      "Đá": 100,
      "Lương Thực": 500,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daemon-blackfyre", "bittersteel"],
    rivals: ["daeron-ii"],
    personalHooks: [
      { id: "fireball-strike", title: "Cơn Phẫn Nộ Của Fireball", year: "196 AC", numericYear: 196, desc: "Ngươi vượt sông Mander, đánh úp quân trung thành và tiêu diệt hoàn toàn gia tộc Lefford." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "robb-reyne",
    name: "Robb Reyne",
    tuocVi: "Hiệp Sĩ",
    house: "Reyne",
    role: "Sư Tử Đỏ",
    religion: "Thất Diện Thần",
    blurb: "Một hiệp sĩ hào hoa và là một trong những tay kiếm xuất sắc nhất thời đại, phục vụ dưới trướng Daemon Blackfyre.",
    birthYear: 168,
    age: 28,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 16, "Thể Chất": 14, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 16 },
    talentIds: ["chivalrous", "arrogant", "handsome"],
    skills: { "Cận Chiến (Kiếm)": 16, "Cưỡi Ngựa": 15 },
    equipment: [],
    items: [],
    gold: 800,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daemon-blackfyre", "bittersteel"],
    rivals: ["daeron-ii", "damon-lannister"],
    personalHooks: [
      { id: "reyne-charge", title: "Tiếng Gầm Sư Tử Đỏ", year: "196 AC", numericYear: 196, desc: "Ngươi dẫn đầu kỵ binh tấn công vào sườn đội hình quân Targaryen." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "leo-tyrell",
    name: "Leo Tyrell",
    tuocVi: "Đại Lãnh Chúa",
    house: "Tyrell",
    role: "Gai Dài",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa Leo 'Longthorn' Tyrell, một hiệp sĩ lừng danh của giải đấu, và là người đã đánh bại phe Blackfyre tại vùng Reach, dù không đến kịp trận Cánh Đồng Cỏ Đỏ.",
    birthYear: 160,
    age: 36,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 14, "Trí Tuệ": 13, "Tinh Tường": 14, "Uy Tín": 16 },
    talentIds: ["chivalrous", "born-leader", "wealthy"],
    skills: { "Thương Kỵ": 18, "Cận Chiến (Kiếm)": 14, "Chỉ Huy": 14 },
    equipment: [],
    items: [],
    gold: 4000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 125,
      "Đá": 500,
      "Lương Thực": 10000,
      "Ngựa": 150,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daeron-ii", "baelor-breakspear"],
    rivals: ["daemon-blackfyre"],
    personalHooks: [
      { id: "longthorn-reach", title: "Bảo Vệ Vùng Reach", year: "196 AC", numericYear: 196, desc: "Trong khi các trận chiến lớn diễn ra ở phía Bắc, ngươi phải dọn dẹp các lãnh chúa phản nghịch ngay trong sân nhà mình." }
    ],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 48000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 16000, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 16000, quality: "Thành Thạo" }
        ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "donnel-arryn",
    name: "Donnel Arryn",
    tuocVi: "Đại Lãnh Chúa",
    house: "Arryn",
    role: "Lãnh Chúa Eyrie",
    religion: "Thất Diện Thần",
    blurb: "Người chỉ huy quân đội tiên phong của Targaryen tại Cánh Đồng Cỏ Đỏ, nhưng hàng ngũ của ông đã bị Daemon Blackfyre đập tan.",
    birthYear: 160,
    deathYear: 209,
    age: 36,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 12, "Thể Chất": 13, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 14 },
    talentIds: ["honorable", "born-leader"],
    skills: { "Chỉ Huy": 14, "Cận Chiến (Kiếm)": 12 },
    equipment: [],
    items: [],
    gold: 1500,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 375,
      "Đá": 2000,
      "Lương Thực": 2000,
      "Ngựa": 120,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daeron-ii", "baelor-breakspear"],
    rivals: ["daemon-blackfyre", "bittersteel"],
    personalHooks: [
      { id: "donnel-vanguard", title: "Tiên Phong Thất Bại", year: "196 AC", numericYear: 196, desc: "Ngươi dẫn quân tiên phong đối mặt với Daemon Blackfyre và thanh gươm của vương triều. Ngươi biết mình không có cơ hội." }
    ],
    startArmies: [
          { name: "Lính Giáo Thung Lũng", type: "Bộ Binh", size: 21000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Thung Lũng", type: "Kỵ Binh", size: 7000, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Thung Lũng", type: "Cung Thủ", size: 7000, quality: "Thành Thạo" }
        ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
      startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat":5},
      baseIncome: 400
},
  {
    id: "damon-lannister",
    name: "Damon Lannister",
    tuocVi: "Đại Lãnh Chúa",
    house: "Lannister",
    role: "Sư Tử Kiêu Hãnh",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa của Casterly Rock, một người đã đứng về phía vua Daeron nhưng bị Fireball đánh bại trong các trận chiến ở Westerlands.",
    birthYear: 155,
    deathYear: 210,
    age: 41,
    coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 11, "Thể Chất": 12, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 15 },
    talentIds: ["wealthy", "arrogant"],
    skills: { "Chỉ Huy": 12, "Quản Lý": 15 },
    equipment: [],
    items: [],
    gold: 5000,
    startResources: {
      "Gỗ": 250,
      "Quặng Sắt": 750,
      "Đá": 750,
      "Lương Thực": 3000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daeron-ii"],
    rivals: ["quentyn-ball", "daemon-blackfyre"],
    personalHooks: [
      { id: "damon-defense", title: "Phòng Thủ Casterly Rock", year: "196 AC", numericYear: 196, desc: "Lực lượng của Fireball đang tàn phá Westerlands. Ngươi phải bảo vệ kho vàng và vinh quang của nhà Lannister." }
    ],
    startArmies: [
          { name: "Vệ Binh Sư Tử Đỏ", type: "Bộ Binh", size: 24000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Vùng Đồi", type: "Kỵ Binh", size: 8000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 8000, quality: "Tinh Nhuệ" }
        ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
      startRegions: ["the-westerlands"],
      startHoldings: ["the-westerlands-seat"],
      holdingsLevel: {"the-westerlands-seat":5},
      baseIncome: 800
},
  {
    id: "otho-bracken",
    name: "Otho Bracken",
    tuocVi: "Hiệp Sĩ",
    house: "Bracken",
    role: "Gã Tàn Bạo",
    religion: "Thất Diện Thần",
    blurb: "Được mệnh danh là 'Otho the Brute'. Hắn đã giết Lãnh chúa Quentyn Blackwood trong một giải đấu, khơi dậy mối thù đẫm máu. Trong cuộc nổi loạn, hắn chiến đấu vì Bittersteel và Blackfyre.",
    birthYear: 170,
    age: 26,
    coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 10, "Thể Chất": 18, "Trí Tuệ": 8, "Tinh Tường": 12, "Uy Tín": 8 },
    talentIds: ["fearsome-warrior", "brutal"],
    skills: { "Cận Chiến (Rìu)": 15, "Cận Chiến (Kiếm)": 14 },
    equipment: [],
    items: [],
    gold: 300,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 40,
      "Đá": 100,
      "Lương Thực": 1000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["bittersteel", "daemon-blackfyre"],
    rivals: ["bloodraven"],
    personalHooks: [
      { id: "bracken-charge", title: "Otho Kẻ Tàn Bạo", year: "196 AC", numericYear: 196, desc: "Ngươi chém giết trên Cánh Đồng Cỏ Đỏ, tìm kiếm những cái đầu của gia tộc Blackwood." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];
