import type { CanonCharacter } from "../eras";

export const aegonConquestCharacters: CanonCharacter[] = [
  {
    id: "loren-lannister",
    origin: "Vua miền Tây, người cai trị Casterly Rock khi Aegon đổ bộ.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình độc lập trong nguồn canon còn lại.",
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
    năngLực: { "Võ Lực": 65, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 70 },
    talentIds: ["commander-instinct", "merchant-fortune"],
    skills: { "command": 10, "persuasion": 10, "sword-shield": 8 },
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
    rivals: ["aegon-the-conqueror"],
    relationshipDetails: {
      "mern-ix-gardener": { type: "Đồng Minh", trust: 80, affinity: 60, detail: "Liên minh chống Aegon. Hai vị vua hợp lực tại Cánh Đồng Lửa, nhưng thất bại thảm khốc." },
      "aegon-the-conqueror": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Loren quỳ gối trước Aegon sau Cánh Đồng Lửa. Lựa chọn giữa tôn nghiêm và sống còn." }
    }
},
  {
    id: "mern-ix-gardener",
    origin: "Vị vua cuối cùng của Nhà Gardener tại Highgarden, tử trận cùng các con ở Cánh Đồng Lửa.", culture: "Người Reach; di sản Người Đầu Tiên", bloodline: "Nhà Gardener", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình độc lập trong nguồn canon còn lại.",
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
    năngLực: { "Võ Lực": 70, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 65 },
    talentIds: ["commander-instinct", "hot-tempered"],
    skills: { "command": 10, "sword-shield": 10 },
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
    relationshipDetails: {
      "loren-lannister": { type: "Đồng Minh", trust: 80, affinity: 60, detail: "Mern liên minh với Loren để nghiền nát Aegon. Ông tự tin vào số lượng vượt trội." },
      "aegon-the-conqueror": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Mern dẫn đầu khối kỵ binh xung phong vào đội hình Aegon. Ông chết trong ngọn lửa rồng cùng toàn bộ gia tộc." }
    },
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
    origin: "Nhiếp chính cho con trai Ronnel, vị Vua Núi và Thung Lũng còn nhỏ tuổi.", culture: "Người Vale", bloodline: "Nhà Arryn gốc Andal", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
    name: "Sharra Arryn",
    tuocVi: "Quốc Vương",
    house: "Arryn",
    role: "Thái hậu Nhiếp chính",
    religion: "Thất Diện Thần",
    blurb: "Thái hậu nhiếp chính của vùng Vale, thay mặt con trai nhỏ tuổi Ronnel cai trị. Một người phụ nữ khôn ngoan, từng đề nghị cưới Aegon để bảo vệ sự độc lập của Vương quốc Núi và Thung Lũng.",
    birthYear: -30,
    age: 30,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 80, "Trí Mưu": 80, "Ngoại Giao": 75 },
    talentIds: ["schemer", "silver-tongue"],
    skills: { "persuasion": 8, "court-etiquette": 7, "cunning": 6 },
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
    relationshipDetails: {
      "ronnel-arryn": { type: "Con", trust: 100, affinity: 100, detail: "Sharra làm mọi thứ để bảo vệ ngai vàng cho Ronnel. Bà sẵn sàng cưới Aegon nếu cần." },
      "aegon-the-conqueror": { type: "Đối Thủ", trust: 10, affinity: 30, detail: "Sharra cầu hôn Aegon nhưng bị từ chối. Visenya bay rồng lên Eyrie và Ronnel đòi cưỡi rồng để đổi lấy sự quỳ gối." }
    },
    rivals: ["visenya-targaryen"],
      startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat":5},
      baseIncome: 400
},
  {
    id: "ronnel-arryn",
    origin: "Vua thiếu niên của Vale, con của Sharra Arryn; vương quốc đầu hàng sau chuyến bay của Visenya tới Eyrie.", culture: "Người Vale", bloodline: "Nhà Arryn gốc Andal", continent: "Westeros",
    appearance: "Một cậu bé; nguồn canon không cho mô tả ngoại hình chi tiết.",
    name: "Ronnel Arryn",
    tuocVi: "Quốc Vương",
    house: "Arryn",
    role: "Vua Cậu Bé",
    religion: "Thất Diện Thần",
    blurb: "Vị vua cuối cùng của xứ Vale, còn được biết đến với cái tên 'Vua Cậu Bé'. Giấc mơ lớn nhất của cậu không phải là trị vì, mà là được cưỡi trên lưng một con rồng.",
    birthYear: -6,
    age: 6,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 10, "Tinh Tường": 9, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 45 },
    talentIds: ["beloved"],
    skills: { "war-riding": 3 },
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
    origin: "Lãnh chúa Riverrun đã quy thuận Aegon và được phong Lord Paramount of the Trident.", culture: "Người Riverlands", bloodline: "Nhà Tully", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
    name: "Edmyn Tully",
    tuocVi: "Quốc Vương",
    house: "Tully",
    role: "Lãnh Chúa Riverrun",
    religion: "Thất Diện Thần",
    blurb: "Vị Lãnh chúa Riverrun đầu tiên đứng lên chống lại Harren the Black và tuyên bố trung thành với Aegon Targaryen. Người mở đường cho sự cai trị của Nhà Tully tại Riverlands.",
    birthYear: -40,
    age: 40,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 13, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 70 },
    talentIds: ["strategist", "commander-instinct"],
    skills: { "command": 8, "persuasion": 7, "sword-shield": 6 },
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
    origin: "Lãnh chúa Greyjoy được các thủ lĩnh Người Sắt bầu làm Lord Reaper of Pyke sau khi Nhà Hoare sụp đổ.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
    name: "Vickon Greyjoy",
    tuocVi: "Quốc Vương",
    house: "Greyjoy",
    role: "Lãnh Chúa Quần Đảo Sắt",
    religion: "Thần Chết Chìm",
    blurb: "Sau khi gia tộc Hoare bị tiêu diệt tại Harrenhal, quần đảo Sắt chìm trong hỗn loạn. Vickon Greyjoy là người được các chúa đảo bầu lên để dẫn dắt họ trong kỷ nguyên mới.",
    birthYear: -35,
    age: 35,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 60, "Trí Mưu": 65, "Ngoại Giao": 75 },
    talentIds: ["warrior-blood", "iron-constitution"],
    skills: { "war-riding": 7, "axe-mace": 8, "command": 6 },
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
    liege: "aegon-the-conqueror",
    relationshipDetails: {
      "aegon-the-conqueror": { type: "Chủ", trust: 80, affinity: 60, detail: "Vickon được Aegon cho phép cai trị Quần Đảo. Ông là lãnh chúa được bầu, trung thành với ngôi sắt." }
    },
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 250
},
  {
    id: "meria-martell",
    origin: "Công chúa cầm quyền của Dorne, lãnh đạo sự kháng cự trước cuộc chinh phạt của Aegon.", culture: "Dornish Rhoynar", bloodline: "Nhà Nymeros Martell", continent: "Westeros",
    appearance: "Nguồn sử mô tả bà già yếu, mù và hói ở cuối đời.",
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
    năngLực: { "Võ Lực": 25, "Thống Soái": 80, "Trí Mưu": 90, "Ngoại Giao": 100 },
    talentIds: ["iron-constitution", "strategist"],
    skills: { "persuasion": 8, "cunning": 9, "lore": 8 },
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
    relationshipDetails: {
      "aegon-the-conqueror": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Meria từ chối quỳ gối dù rồng thiêu đốt khắp Dorne. Bà là người duy nhất khẩu hiệu 'Unbowed, Unbent, Unbroken' đúng nghĩa." },
      "nymor-martell": { type: "Con", trust: 100, affinity: 100, detail: "Nymor kế tục chí hướng của mẹ nhưng chọn đường hòa bình thay vì chiến tranh." }
    },
      startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat":5},
      baseIncome: 400
},
  {
    id: "nymor-martell",
    origin: "Con trai và người kế vị của Meria Martell; về sau thương lượng hoà bình với Aegon I.", culture: "Dornish Rhoynar", bloodline: "Nhà Nymeros Martell", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
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
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["silver-tongue", "learned"],
    skills: { "persuasion": 8, "cunning": 7 },
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
    origin: "Con gái của Nymor Martell, được cử đến King's Landing để dàn xếp hoà bình sau Cuộc Chiến Rồng lần thứ nhất tại Dorne.", culture: "Dornish Rhoynar", bloodline: "Nhà Nymeros Martell", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
    name: "Deria Martell",
    tuocVi: "Lãnh Chúa",
    house: "Martell",
    role: "Đại Sứ Hòa Bình",
    religion: "Thất Diện Thần",
    blurb: "Con gái của Nymor Martell, người được giao nhiệm vụ mang lá thư bí mật của cha đến King's Landing để đàm phán hòa bình với Aegon Targaryen.",
    birthYear: -15,
    age: 15,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 80, "Trí Mưu": 70, "Ngoại Giao": 80 },
    talentIds: ["warrior-blood", "silver-tongue"],
    skills: { "persuasion": 6, "court-etiquette": 5 },
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
    origin: "Lãnh chúa Crow's Nest, người đã chặn Orys Baratheon ở Wyl trong cuộc chiến Dorne đầu tiên.", culture: "Người Bão Tố", bloodline: "Nhà Morrigen", continent: "Westeros",
    appearance: "Không có mô tả ngoại hình canon xác thực.",
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
    năngLực: { "Võ Lực": 75, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 75 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "sword-shield": 8, "command": 6 },
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
    origin: "Nhân vật quan hệ giả lập để biểu thị cha của Loren; tên, niên đại và thân phận riêng không được nguồn canon xác nhận.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -50, deathYear: -1, age: 50, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập để biểu thị vợ của Loren; tên, niên đại và xuất thân riêng không được nguồn canon xác nhận.", culture: "Không xác minh", bloodline: "Không xác minh", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -25, age: 25, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập; nguồn canon không nêu tên một người con Lannister này.", culture: "Người miền Tây", bloodline: "Nhà Lannister", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -5, age: 5, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Hoàng tử Gardener trong dữ liệu giả lập; các tên riêng của con Mern IX không được nguồn canon xác nhận.", culture: "Người Reach", bloodline: "Nhà Gardener", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -25, deathYear: -2, age: 25, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Hoàng tử Gardener trong dữ liệu giả lập; các tên riêng của con Mern IX không được nguồn canon xác nhận.", culture: "Người Reach", bloodline: "Nhà Gardener", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -23, deathYear: -2, age: 23, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Hoàng tử Gardener trong dữ liệu giả lập; các tên riêng của con Mern IX không được nguồn canon xác nhận.", culture: "Người Reach", bloodline: "Nhà Gardener", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -20, deathYear: -2, age: 20, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Hoàng tử Gardener trong dữ liệu giả lập; các tên riêng của con Mern IX không được nguồn canon xác nhận.", culture: "Người Reach", bloodline: "Nhà Gardener", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -18, deathYear: -2, age: 18, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập để biểu thị người chồng đã mất của Sharra; nguồn canon không xác nhận danh tính.", culture: "Người Vale", bloodline: "Nhà Arryn", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -40, deathYear: -6, age: 34, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập; nguồn canon chỉ nêu Ronnel là con của Sharra, không xác nhận người em này.", culture: "Người Vale", bloodline: "Nhà Arryn", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -4, age: 4, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập; người thừa kế cụ thể của Edmyn trong niên đại này không được nguồn canon nêu tên.", culture: "Người Riverlands", bloodline: "Nhà Tully", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -10, age: 10, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Con trai của Vickon Greyjoy, được nêu trong phả hệ Greyjoy.", culture: "Người Sắt", bloodline: "Nhà Greyjoy", continent: "Westeros", appearance: "Không có mô tả ngoại hình canon xác thực.",
    birthYear: -15, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Cha của Aegon, Visenya và Rhaenys; một thành viên Targaryen tại Dragonstone trước Cuộc Chinh Phạt.", culture: "Valyria hậu duệ", bloodline: "Nhà Targaryen", continent: "Westeros", appearance: "Không có mô tả ngoại hình canon xác thực.",
    birthYear: -50, deathYear: -2, age: 48, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Phu nhân của Aerion và mẹ của ba người chinh phạt; mang dòng Velaryon và huyết mạch Targaryen qua mẹ.", culture: "Valyria hậu duệ", bloodline: "Nhà Velaryon và Targaryen", continent: "Westeros", appearance: "Không có mô tả ngoại hình canon xác thực.",
    birthYear: -48, deathYear: -2, age: 46, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Con trai không được nêu tên của Harren Hoare, một trong những người chết trong Harrenhal khi Aegon tấn công.", culture: "Người Sắt", bloodline: "Nhà Hoare", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -30, deathYear: 2, age: 30, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Anh em cùng cha khác mẹ của Torrhen Stark; đã đề nghị dùng cung gỗ weirwood hạ sát rồng của Aegon.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Dòng Stark, mang họ Snow", continent: "Westeros", appearance: "Không có mô tả ngoại hình canon xác thực.",
    birthYear: -28, age: 28, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Nhân vật quan hệ giả lập; Torrhen có hai con trai được kể lại nhưng dữ liệu canon không xác nhận người thừa kế này theo ID hiện tại.", culture: "Người Đầu Tiên vùng Bắc", bloodline: "Nhà Stark", continent: "Westeros", appearance: "Không xác minh.",
    birthYear: -10, age: 10, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
    origin: "Con gái và người thừa kế của Argilac Durrandon; sau thất thủ Storm's End, bà kết hôn với Orys Baratheon.", culture: "Người Bão Tố", bloodline: "Nhà Durrandon", continent: "Westeros", appearance: "Không có mô tả ngoại hình canon xác thực.",
    birthYear: -18, age: 18, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 50 },
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
    relationshipDetails: {
      "argilac-durrandon": { type: "Cha", trust: 100, affinity: 100, detail: "Argilac chết tại trận chiến. Argella mặc áo giáp và thề chiến đấu đến chết nhưng bị quân mình bắt nộp." }
    },
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
