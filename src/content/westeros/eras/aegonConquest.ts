import type { CanonCharacter } from "../eras";

export const aegonConquestCharacters: CanonCharacter[] = [
  {
    id: "loren-lannister",
    name: "Loren Lannister",
    tuocVi: "Quốc Vương",
    house: "Lannister",
    role: "Vua Vùng Đá (King of the Rock)",
    religion: "Thất Diện Thần",
    blurb: "Vua của vùng Westerlands. Ông đã liên minh với vua Mern IX Gardener để tạo ra đội quân lớn nhất lịch sử nhằm chống lại đội quân của Aegon Targaryen. Nhưng liệu vàng và giáo mác có thể cản được lửa rồng?",
    birthYear: -25,
    deathYear: 15,
    age: 25,
    coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 13, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: ["born-leader", "wealthy"],
    skills: { "Chỉ Huy": 10, "Ngoại Giao": 10, "Cận Chiến (Kiếm)": 8 },
    equipment: [],
    items: [{ ten: "Vàng Casterly Rock", soLuong: 1000, moTa: "Số vàng lớn mang theo từ quê nhà." }],
    gold: 50000,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 1500,
      "Đá": 1500,
      "Lương Thực": 6000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Lính Giáo Lannisport", type: "Bộ Binh", size: 27000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Phương Tây", type: "Kỵ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 9000, quality: "Thành Thạo" }
        ],
          startRegions: ["the-westerlands"],
      startHoldings: ["the-westerlands-seat"],
      holdingsLevel: {"the-westerlands-seat": 5},
      baseIncome: 800,
father: "lannister-father-loren",
    spouse: "lannister-wife-loren",
    children: ["lyman-lannister"],
    allies: ["mern-ix-gardener"],
    personalHooks: [
      { id: "field-of-fire", title: "Cánh Đồng Lửa", year: "2 BC", numericYear: -2, desc: "Liên quân hai vị vua đã tập hợp. Trận chiến quyết định sắp diễn ra." }
    ],
    mother: "lannister-wife-loren",
    siblings: [],
    rivals: ["aegon-the-conqueror"]
},
  {
    id: "mern-ix-gardener",
    name: "Mern IX Gardener",
    tuocVi: "Quốc Vương",
    house: "Gardener",
    role: "Vua Vùng Reach (King of the Reach)",
    religion: "Thất Diện Thần",
    blurb: "Vị vua cuối cùng của Nhà Gardener. Ông tự tin vào sức mạnh của hiệp sĩ vùng Reach và đã mang toàn bộ gia tộc mình ra chiến trường để dẹp tan tham vọng của lũ rồng Targaryen.",
    birthYear: -45,
    deathYear: -2,
    age: 45,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 15, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    talentIds: ["born-leader", "arrogant"],
    skills: { "Chỉ Huy": 12, "Cận Chiến (Kiếm)": 10 },
    equipment: [],
    items: [],
    gold: 60000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 500,
      "Đá": 1000,
      "Lương Thực": 5000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 33000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 11000, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 11000, quality: "Thành Thạo" }
        ],
    children: ["edmund-gardener", "gawen-gardener"],
    allies: ["loren-lannister"],
    rivals: ["aegon-the-conqueror"],
    personalHooks: [
      { id: "field-of-fire-mern", title: "Cánh Đồng Lửa", year: "2 BC", numericYear: -2, desc: "Ngươi dẫn đầu kỵ binh hùng hậu nhất Westeros, thề sẽ nghiền nát Aegon." }
    ],
    father: "garth-gardener",
    mother: "",
    spouse: "",
    siblings: ["moryn-gardener"],
      startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat":5},
      baseIncome: 700
},
  {
    id: "sharra-arryn",
    name: "Sharra Arryn",
    tuocVi: "Quốc Vương",
    house: "Arryn",
    role: "Thái hậu Nhiếp chính",
    religion: "Thất Diện Thần",
    blurb: "Thái hậu nhiếp chính của vùng Vale, thay mặt con trai nhỏ tuổi Ronnel cai trị. Một người phụ nữ khôn ngoan, từng đề nghị cưới Aegon để bảo vệ sự độc lập của Vương quốc Núi và Thung Lũng.",
    birthYear: -30,
    age: 30,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 16 },
    talentIds: ["cunning", "diplomat"],
    skills: { "Ngoại Giao": 15, "Thuyết Phục": 12, "Quản Lý": 14 },
    equipment: [],
    items: [],
    gold: 1500,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 750,
      "Đá": 4000,
      "Lương Thực": 4000,
      "Ngựa": 240,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Đội Vệ Binh Cổng Máu", type: "Bộ Binh", size: 6000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Thung Lũng", type: "Kỵ Binh", size: 2000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 2000, quality: "Tinh Nhuệ" }
        ],
    spouse: "arryn-king-sharra",
    children: ["ronnel-arryn", "jonos-arryn"],
    personalHooks: [
      { id: "sharra-proposal", title: "Lời Cầu Hôn Của Thái Hậu", year: "1 BC", numericYear: -1, desc: "Ngươi gửi thư cầu hôn Aegon Targaryen, hy vọng một liên minh thay vì chiến tranh." }
    ],
    father: "",
    mother: "",
    siblings: [],
    allies: [],
    rivals: ["visenya-targaryen"],
      startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat":5},
      baseIncome: 400
},
  {
    id: "ronnel-arryn",
    name: "Ronnel Arryn",
    tuocVi: "Quốc Vương",
    house: "Arryn",
    role: "Vua Cậu Bé",
    religion: "Thất Diện Thần",
    blurb: "Vị vua cuối cùng của xứ Vale, còn được biết đến với cái tên 'Vua Cậu Bé'. Giấc mơ lớn nhất của cậu không phải là trị vì, mà là được cưỡi trên lưng một con rồng.",
    birthYear: -6,
    age: 6,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 10, "Tinh Tường": 9, "Uy Tín": 12 },
    talentIds: ["innocent"],
    skills: { "Cưỡi Ngựa": 5 },
    equipment: [],
    items: [],
    gold: 100,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 750,
      "Đá": 4000,
      "Lương Thực": 4000,
      "Ngựa": 240,
      "Thép Valyria": 0
    }, startingHookIds: [],
    mother: "sharra-arryn",
          startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat": 5},
      baseIncome: 400,
father: "arryn-king-sharra",
    siblings: ["jonos-arryn"],
    personalHooks: [
      { id: "ronnel-dragon", title: "Ước Mơ Cưỡi Rồng", year: "1 AC", numericYear: 1, desc: "Visenya Targaryen đã bay đến Eyrie. Ngươi có thể thấy con rồng Vhagar vĩ đại ngoài sân." }
    ],
    spouse: "",
    children: [],
    allies: ["aegon-the-conqueror"],
    rivals: ["jonos-arryn"],
    startArmies: [
          { name: "Chiến Binh Vùng Núi", type: "Bộ Binh", size: 10800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Thung Lũng", type: "Kỵ Binh", size: 3600, quality: "Thành Thạo" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 3600, quality: "Thành Thạo" }
        ]
},
  {
    id: "edmyn-tully",
    name: "Edmyn Tully",
    tuocVi: "Quốc Vương",
    house: "Tully",
    role: "Lãnh Chúa Riverrun",
    religion: "Thất Diện Thần",
    blurb: "Vị Lãnh chúa Riverrun đầu tiên đứng lên chống lại Harren the Black và tuyên bố trung thành với Aegon Targaryen. Người mở đường cho sự cai trị của Nhà Tully tại Riverlands.",
    birthYear: -40,
    age: 40,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: ["pragmatic", "born-leader"],
    skills: { "Chỉ Huy": 12, "Ngoại Giao": 10, "Cận Chiến (Kiếm)": 10 },
    equipment: [],
    items: [],
    gold: 1200,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 400,
      "Đá": 1000,
      "Lương Thực": 10000,
      "Ngựa": 200,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Vệ Binh Sông Xanh", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sông Nhánh", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nước", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ],
          startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat": 5},
      baseIncome: 450,
children: ["tully-son-edmyn"],
    allies: ["aegon-the-conqueror"],
    rivals: ["harren-the-black"],
    personalHooks: [
      { id: "edmyn-rebellion", title: "Khởi Nghĩa Riverlands", year: "2 BC", numericYear: -2, desc: "Harren the Black quá tàn bạo. Đã đến lúc Riverlands tìm một vị vua mới." }
    ],
    father: "",
    mother: "",
    spouse: "",
    siblings: []
},
  {
    id: "vickon-greyjoy",
    name: "Vickon Greyjoy",
    tuocVi: "Quốc Vương",
    house: "Greyjoy",
    role: "Lãnh Chúa Quần Đảo Sắt",
    religion: "Thần Chết Chìm",
    blurb: "Sau khi gia tộc Hoare bị tiêu diệt tại Harrenhal, quần đảo Sắt chìm trong hỗn loạn. Vickon Greyjoy là người được các chúa đảo bầu lên để dẫn dắt họ trong kỷ nguyên mới.",
    birthYear: -35,
    age: 35,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 12 },
    talentIds: ["ironborn", "resilient"],
    skills: { "Hàng Hải": 15, "Cận Chiến (Rìu)": 12, "Chỉ Huy": 10 },
    equipment: [],
    items: [],
    gold: 800,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 1250,
      "Đá": 1500,
      "Lương Thực": 2000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 3000, quality: "Thành Thạo" },
          { name: "Người Ném Lao Quần Đảo", type: "Cung Thủ", size: 750, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 25, quality: "Thành Thạo" }
        ],
    children: ["goren-greyjoy"],
    personalHooks: [
      { id: "vickon-election", title: "Cuộc Bầu Cử Quần Đảo", year: "2 AC", numericYear: 2, desc: "Vua Harren đã chết. Lãnh chúa Quần Đảo Sắt cần một người đứng đầu, và Aegon cho phép họ tự chọn." }
    ],
    father: "",
    mother: "",
    spouse: "",
    siblings: [],
    allies: ["aegon-the-conqueror"],
    rivals: [],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 250
},
  {
    id: "meria-martell",
    name: "Meria Martell",
    tuocVi: "Quốc Vương",
    house: "Martell",
    role: "Cóc Vàng Xứ Dorne",
    religion: "Thất Diện Thần",
    blurb: "Nữ vương 80 tuổi, mù loà và hói đầu của Dorne. Bà kiên quyết không quỳ gối trước Aegon, tuyên bố: 'Unbowed, Unbent, Unbroken'. Bất chấp rồng, Dorne sẽ không bao giờ đầu hàng.",
    birthYear: -80,
    deathYear: 13,
    age: 80,
    coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 5, "Thể Chất": 10, "Trí Tuệ": 18, "Tinh Tường": 20, "Uy Tín": 16 },
    talentIds: ["stubborn", "strategic-mind"],
    skills: { "Ngoại Giao": 15, "Chiến Lược": 18, "Lịch Sử": 15 },
    equipment: [],
    items: [],
    gold: 2500,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 500,
      "Đá": 1200,
      "Lương Thực": 3500,
      "Ngựa": 600,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Đội Tiên Phong Xứ Dorne", type: "Bộ Binh", size: 6000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 2000, quality: "Tinh Nhuệ" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 2000, quality: "Tinh Nhuệ" }
        ],
    children: ["nymor-martell"],
    rivals: ["aegon-the-conqueror", "rhaenys-targaryen"],
    personalHooks: [
      { id: "meria-defiance", title: "Cóc Vàng Thách Thức", year: "1 BC", numericYear: -1, desc: "Rhaenys Targaryen đến Sunspear trên lưng rồng Meraxes. Ngươi chuẩn bị gửi cho ả một lời từ chối thẳng thừng." }
    ],
    father: "",
    mother: "",
    spouse: "",
    siblings: [],
    allies: [],
      startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat":5},
      baseIncome: 400
},
  {
    id: "nymor-martell",
    name: "Nymor Martell",
    tuocVi: "Quốc Vương",
    house: "Martell",
    role: "Người Kế Vị Dorne",
    religion: "Thất Diện Thần",
    blurb: "Con trai của Meria Martell. Sau nhiều năm chiến tranh đẫm máu với Aegon, ông quyết định tìm kiếm hòa bình để cứu lấy xứ Dorne đang rỉ máu.",
    birthYear: -40,
    deathYear: 35,
    age: 40,
    coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: ["diplomat", "peace-maker"],
    skills: { "Ngoại Giao": 16, "Chính Trị": 14 },
    equipment: [],
    items: [],
    gold: 1500,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 500,
      "Đá": 1200,
      "Lương Thực": 3500,
      "Ngựa": 600,
      "Thép Valyria": 0
    }, startingHookIds: [],
    personalHooks: [
      { id: "nymor-peace", title: "Lá Thư Hòa Bình", year: "13 AC", numericYear: 13, desc: "Mẹ ngươi đã mất. Đã đến lúc chấm dứt cuộc chiến đẫm máu này bằng một lá thư bí mật gửi cho Aegon." }
    ],
    father: "",
    mother: "meria-martell",
    spouse: "",
    children: ["deria-martell"],
    siblings: [],
    allies: [],
    rivals: ["aegon-the-conqueror"],
    startArmies: [
          { name: "Chiến Binh Mật Thủy", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sa Mạc", type: "Kỵ Binh", size: 3000, quality: "Thành Thạo" },
          { name: "Cung Thủ Tẩm Độc", type: "Cung Thủ", size: 3000, quality: "Thành Thạo" }
        ],
      startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat":5},
      baseIncome: 400
},
  {
    id: "deria-martell",
    name: "Deria Martell",
    tuocVi: "Lãnh Chúa",
    house: "Martell",
    role: "Đại Sứ Hòa Bình",
    religion: "Thất Diện Thần",
    blurb: "Con gái của Nymor Martell, người được giao nhiệm vụ mang lá thư bí mật của cha đến King's Landing để đàm phán hòa bình với Aegon Targaryen.",
    birthYear: -15,
    age: 15,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 16 },
    talentIds: ["brave", "persuasive"],
    skills: { "Ngoại Giao": 14, "Can Đảm": 12 },
    equipment: [],
    items: [],
    gold: 500,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 100,
      "Đá": 240,
      "Lương Thực": 700,
      "Ngựa": 120,
      "Thép Valyria": 0
    }, startingHookIds: [],
          startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat": 5},
      baseIncome: 450,
personalHooks: [
      { id: "deria-envoy", title: "Hành Trình Đến King's Landing", year: "13 AC", numericYear: 13, desc: "Ngươi mang theo hộp sọ của rồng Meraxes và một lá thư mật, bước vào ngai vàng để thương lượng với kẻ thù." }
    ],
    father: "nymor-martell",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Đội Tiên Phong Xứ Dorne", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ]
},
  {
    id: "dickon-morrigen",
    name: "Dickon Morrigen",
    tuocVi: "Hiệp Sĩ",
    house: "Khác",
    role: "Hiệp Sĩ Quạ",
    religion: "Thất Diện Thần",
    blurb: "Dickon Morrigen, chỉ huy đội Vệ Binh của vua bão Argilac. Ông nổi tiếng dũng cảm nhưng đã phải bỏ mạng trong trận Last Storm trước quân đội của Orys Baratheon.",
    birthYear: -30,
    deathYear: 0,
    age: 30,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 14, "Thể Chất": 16, "Trí Tuệ": 10, "Tinh Tường": 15, "Uy Tín": 10 },
    talentIds: ["brave", "loyal"],
    skills: { "Cận Chiến (Kiếm)": 14, "Chỉ Huy": 12 },
    equipment: [],
    items: [],
    gold: 100,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 50,
      "Đá": 100,
      "Lương Thực": 500,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    personalHooks: [
      { id: "the-last-storm", title: "Cơn Bão Cuối Cùng", year: "1 BC", numericYear: -1, desc: "Orys Baratheon đang kéo quân tới. Ngươi sẽ tử chiến vì Vua Bão Argilac." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  // ── GIA QUYẾN ĐƯỢC TẠO THEO LORE ──
  {
    id: "lannister-father-loren", name: "Cựu Vương Lannister", tuocVi: "Thường Dân", house: "Lannister", role: "Cựu Vương", religion: "Thất Diện Thần", blurb: "Cha của Loren Lannister.",
    birthYear: -50, deathYear: -1, age: 50, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
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
          { name: "Đội Trọng Bộ Binh Lannister", type: "Bộ Binh", size: 350, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lannister-wife-loren", name: "Vương Hậu Lannister", tuocVi: "Vương Hậu", house: "Lannister", role: "Vương Hậu", religion: "Thất Diện Thần", blurb: "Vợ của Loren Lannister.",
    birthYear: -25, age: 25, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "loren-lannister",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Giáo Lannisport", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lyman-lannister", name: "Lyman Lannister", tuocVi: "Vương Thân", house: "Lannister", role: "Con trai Loren", religion: "Thất Diện Thần", blurb: "Người thừa kế của Loren Lannister.",
    birthYear: -5, age: 5, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "loren-lannister", mother: "lannister-wife-loren",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vệ Binh Sư Tử Đỏ", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "edmund-gardener", name: "Edmund Gardener", tuocVi: "Vương Thân", house: "Gardener", role: "Thái tử", religion: "Thất Diện Thần", blurb: "Con trai trưởng của Mern IX.",
    birthYear: -25, deathYear: -2, age: 25, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mern-ix-gardener",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "gawen-gardener", name: "Gawen Gardener", tuocVi: "Vương Thân", house: "Gardener", role: "Vương Tử", religion: "Thất Diện Thần", blurb: "Con trai thứ của Mern IX.",
    birthYear: -23, deathYear: -2, age: 23, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mern-ix-gardener",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "garth-gardener", name: "Garth Gardener", tuocVi: "Vương Thân", house: "Gardener", role: "Vương Tử", religion: "Thất Diện Thần", blurb: "Con trai của Mern IX.",
    birthYear: -20, deathYear: -2, age: 20, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mern-ix-gardener",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "moryn-gardener", name: "Moryn Gardener", tuocVi: "Vương Thân", house: "Gardener", role: "Vương Tử", religion: "Thất Diện Thần", blurb: "Con trai út của Mern IX.",
    birthYear: -18, deathYear: -2, age: 18, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mern-ix-gardener",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "arryn-king-sharra", name: "Cựu Vương Arryn", tuocVi: "Thường Dân", house: "Arryn", role: "Vua đã mất", religion: "Thất Diện Thần", blurb: "Người chồng đã mất của Sharra Arryn.",
    birthYear: -40, deathYear: -6, age: 34, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 15,
      "Đá": 80,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "sharra-arryn",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Giáo Thung Lũng", type: "Bộ Binh", size: 251, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Thung Lũng", type: "Cung Thủ", size: 109, quality: "Thành Thạo" }
        ],
      startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat":5},
      baseIncome: 400
},
  {
    id: "jonos-arryn", name: "Jonos Arryn", tuocVi: "Vương Thân", house: "Arryn", role: "Vương Tử", religion: "Thất Diện Thần", blurb: "Em trai của Ronnel Arryn.",
    birthYear: -4, age: 4, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 15,
      "Đá": 80,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "arryn-king-sharra", mother: "sharra-arryn",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Đội Vệ Binh Cổng Máu", type: "Bộ Binh", size: 2160, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Thung Lũng", type: "Kỵ Binh", size: 720, quality: "Thành Thạo" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 720, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "tully-son-edmyn", name: "Con trai Edmyn", tuocVi: "Người Thừa Kế", house: "Tully", role: "Người Thừa Kế", religion: "Thất Diện Thần", blurb: "Người kế vị Riverrun.",
    birthYear: -10, age: 10, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "edmyn-tully",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Riverrun", type: "Bộ Binh", size: 1440, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sông Nhánh", type: "Kỵ Binh", size: 480, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nước", type: "Cung Thủ", size: 480, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "goren-greyjoy", name: "Goren Greyjoy", tuocVi: "Người Thừa Kế", house: "Greyjoy", role: "Người Thừa Kế", religion: "Đần Thần (Drowned God)", blurb: "Con trai cả của Vickon Greyjoy.",
    birthYear: -15, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "vickon-greyjoy",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Rìu Pyke", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Ném Lao Quần Đảo", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 5, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},

  {
    id: "aerion-targaryen", name: "Aerion Targaryen", tuocVi: "Lãnh Chúa", house: "Targaryen", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Aegon, Visenya, và Rhaenys.",
    birthYear: -50, deathYear: -2, age: 48, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 200,
      "Quặng Sắt": 100,
      "Đá": 200,
      "Lương Thực": 1000,
      "Ngựa": 40,
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
          { name: "Lính Kích Đỉnh Aegon", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
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
    id: "valaena-velaryon", name: "Valaena Velaryon", tuocVi: "Tiểu Thư", house: "Velaryon", role: "Phu Nhân", religion: "Thất Diện Thần", blurb: "Mẹ của Aegon, Visenya, và Rhaenys.",
    birthYear: -48, deathYear: -2, age: 46, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "aerion-targaryen",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Giáo Biển", type: "Bộ Binh", size: 480, quality: "Tinh Nhuệ" },
          { name: "Thủy Thủ Bắn Nỏ", type: "Cung Thủ", size: 120, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Driftmark", type: "Chiến Thuyền Nặng", size: 4, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "hoare-son-harren", name: "Thái Tử Hoare", tuocVi: "Người Thừa Kế", house: "Hoare", role: "Con trai Harren", religion: "Thần Chết Chìm", blurb: "Người con sẽ chết trong lửa rồng cùng cha.",
    birthYear: -30, deathYear: 2, age: 30, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "harren-the-black",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Chiến Binh Đảo Muối", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Đảo", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "brandon-snow", name: "Brandon Snow", tuocVi: "Thường Dân", house: "Stark", role: "Anh em của Torrhen", religion: "Cựu Thần", blurb: "Con hoang của phương Bắc, đã từng đề xuất ám sát rồng Targaryen.",
    birthYear: -28, age: 28, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], siblings: ["torrhen-stark"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Winterfell", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "stark-son-torrhen", name: "Con trai Torrhen", tuocVi: "Người Thừa Kế", house: "Stark", role: "Người Thừa Kế", religion: "Cựu Thần", blurb: "Con trai của Torrhen Stark, phẫn nộ vì cha phải quỳ gối.",
    birthYear: -10, age: 10, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "torrhen-stark",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Winterfell", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Sói", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "argella-durrandon", name: "Argella Durrandon", tuocVi: "Công Chúa", house: "Durrandon", role: "Nữ Vương Bão", religion: "Thất Diện Thần", blurb: "Con gái của Argilac, người sẽ lấy Orys Baratheon.",
    birthYear: -18, age: 18, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 14 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "argilac-durrandon",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Bão Tố", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];
