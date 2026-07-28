import type { CanonCharacter } from "../eras";

export const danceOfDragonsCharacters: CanonCharacter[] = [
  {
    id: "jacaerys-velaryon",
    name: "Jacaerys Velaryon",
    tuocVi: "Hoàng Tử",
    house: "Velaryon",
    role: "Người Thừa Kế Ngai Sắt",
    religion: "Thất Diện Thần",
    blurb: "Con trai trưởng của Rhaenyra Targaryen. Tuy bị nghi ngờ về dòng máu, Jace lại chứng tỏ mình là một thanh niên dũng cảm, thông minh và có tầm nhìn ngoại giao xuất sắc. Cưỡi trên lưng rồng Vermax, cậu là hy vọng lớn nhất của phe Đen.",
    birthYear: 114,
    deathYear: 130,
    age: 15,
    coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 12, "Thể Chất": 12, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 80, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["commander-instinct", "silver-tongue", "warrior-blood"],
    skills: { "persuasion": 8, "war-riding": 7, "sword-shield": 6 },
    equipment: [],
    items: [],
    gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "laenor-velaryon", mother: "rhaenyra-targaryen",
    spouse: "baela-targaryen",
    siblings: ["lucerys-velaryon", "joffrey-velaryon"],
    allies: ["cregan-stark", "jeyne-arryn"],
    rivals: ["aegon-ii-targaryen"],
    liege: "rhaenyra-targaryen",
    relationshipDetails: {
      "rhaenyra-targaryen": { type: "Mẹ", trust: 100, affinity: 100, detail: "Jace là con trai trưởng của Rhaenyra và là người thừa kế của bà. Cậu sẵn sàng chết vì danh dự của mẹ." },
      "cregan-stark": { type: "Bằng Hữu", trust: 90, affinity: 95, detail: "Jace bay đến Winterfell và ký Hiệp Ước Băng và Lửa với Cregan — khởi đầu một tình bạn huyền thoại." },
      "aegon-ii-targaryen": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Kẻ cướp ngôi của mẹ. Jace khinh thường Aegon vì sự hèn nhát và tham lam." }
    },
    dragon: {
      name: "Vermax", color: "Xanh Lục", size: "Trưởng Thành", age: 14,
      description: "Con rồng trẻ đang độ lớn, bay rất nhanh và hung dữ.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 10, "Bay Lượn": 14, "Săn Mồi": 10 }
    },
    personalHooks: [
      { id: "jace-north", title: "Hành Trình Lên Bắc", year: "129 AC", numericYear: 129, desc: "Mẹ giao cho ngươi nhiệm vụ đến Eyrie, White Harbor và Winterfell để giành sự ủng hộ của lãnh chúa Stark và Arryn." }
    ],
    children: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 480, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 120, quality: "Tinh Nhuệ" }
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
    id: "lucerys-velaryon",
    name: "Lucerys Velaryon",
    tuocVi: "Hoàng Tử",
    house: "Velaryon",
    role: "Sứ Giả Mệnh Yểu",
    religion: "Thất Diện Thần",
    blurb: "Con trai thứ hai của Rhaenyra. Luke là một cậu bé tốt bụng và dũng cảm. Cậu được giao nhiệm vụ bay đến Storm's End để gửi thư cho lãnh chúa Borros Baratheon, một chuyến đi định mệnh.",
    birthYear: 115,
    deathYear: 129,
    age: 14,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "war-riding": 6, "sword-shield": 4 },
    equipment: [],
    items: [],
    gold: 300,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "laenor-velaryon", mother: "rhaenyra-targaryen",
    spouse: "rhaena-targaryen",
    siblings: ["jacaerys-velaryon", "joffrey-velaryon"],
    allies: ["borros-baratheon"],
    rivals: ["aemond-targaryen"],
    dragon: {
      name: "Arrax", color: "Trắng Ngọc Trai", size: "Trưởng Thành", age: 13,
      description: "Con rồng trẻ, nhanh nhẹn nhưng chưa đủ sức chiến đấu với những con rồng khổng lồ.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 8, "Bay Lượn": 16, "Săn Mồi": 8 }
    },
    personalHooks: [
      { id: "luke-storms-end", title: "Bay Tới Storm's End", year: "129 AC", numericYear: 129, desc: "Bầu trời u ám báo hiệu một cơn bão lớn. Ngươi cưỡi Arrax đến lâu đài của Vua Bão với một lá thư mỏng manh." }
    ],
    children: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 480, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 120, quality: "Tinh Nhuệ" }
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
    id: "aegon-iii",
    name: "Aegon III Targaryen",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Cậu Bé U Sầu",
    religion: "Thất Diện Thần",
    blurb: "Con trai của Rhaenyra và Daemon Targaryen. Tuổi thơ bị tàn phá bởi chiến tranh, cậu sẽ lớn lên mang theo một nỗi ám ảnh sâu sắc với rồng và những ký ức đau buồn.",
    birthYear: 120,
    deathYear: 157,
    age: 9,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 10, "Uy Tín": 8 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 40, "Trí Mưu": 70, "Ngoại Giao": 50 },
    talentIds: ["haunted-past", "keen-eye"],
    skills: { "lore": 4 },
    equipment: [],
    items: [],
    gold: 100,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daemon-targaryen", mother: "rhaenyra-targaryen",
    spouse: "jaehaera-targaryen",
    siblings: ["viserys-ii-targaryen"],
    allies: [],
    rivals: [],
    dragon: {
      name: "Stormcloud", color: "Xám Xịt", size: "Non", age: 9,
      description: "Con rồng nhỏ chưa từng được cưỡi.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Bay Lượn": 10 }
    },
    personalHooks: [
      { id: "aegon-gay-abandon", title: "Tháo Chạy Trên Biển", year: "129 AC", numericYear: 129, desc: "Ngươi đang trên tàu Gay Abandon chạy trốn đến Pentos thì bị hạm đội Triarchy tập kích." }
    ],
    children: [],
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
    id: "helaena-targaryen",
    name: "Helaena Targaryen",
    tuocVi: "Vương Hậu",
    house: "Targaryen",
    role: "Nhà Tiên Tri Bi Kịch",
    religion: "Thất Diện Thần",
    blurb: "Vợ và cũng là em gái của Aegon II. Helaena là một người dịu dàng, thường lẩm bẩm những lời tiên tri bí ẩn mà không ai hiểu, cho đến khi quá muộn.",
    birthYear: 109,
    deathYear: 130,
    age: 20,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 15, "Tinh Tường": 12, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 75, "Ngoại Giao": 60 },
    talentIds: ["greenseer", "highborn-charm", "chronic-illness"],
    skills: { "greensight": 8 },
    equipment: [],
    items: [],
    gold: 1000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "viserys-i", mother: "alicent-hightower",
    spouse: "aegon-ii-targaryen",
    children: ["jaehaerys-targaryen", "jaehaera-targaryen", "maelour-targaryen"],
    siblings: ["aegon-ii-targaryen", "aemond-targaryen", "daeron-targaryen"],
    allies: [],
    rivals: ["rhaenyra-targaryen"],
    dragon: {
      name: "Dreamfyre", color: "Xanh Nhạt và Bạc", size: "Trưởng Thành", age: 97,
      description: "Con rồng già dặn, duyên dáng và hiền hòa.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 14, "Bay Lượn": 12 }
    },
    personalHooks: [
      { id: "blood-and-cheese", title: "Máu và Phô Mai", year: "129 AC", numericYear: 129, desc: "Hai kẻ sát thủ đang đứng trong phòng ngươi. Chúng bắt ngươi phải chọn một đứa con để chết." }
    ],
    startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
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
    id: "daeron-targaryen",
    name: "Daeron Targaryen",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Hiền Lành",
    religion: "Thất Diện Thần",
    blurb: "Con trai út của Alicent Hightower. Lớn lên ở Oldtown, Daeron là người duy nhất trong số các con của Alicent có sự điềm đạm và dễ mến, nhưng trên chiến trường, cậu và rồng Tessarion là một thế lực đáng sợ.",
    birthYear: 114,
    deathYear: 130,
    age: 15,
    coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 12, "Thể Chất": 12, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 60 },
    talentIds: ["warrior-blood", "beloved"],
    skills: { "war-riding": 7, "sword-shield": 7, "command": 5 },
    equipment: [],
    items: [],
    gold: 800,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "viserys-i", mother: "alicent-hightower",
    siblings: ["aegon-ii-targaryen", "aemond-targaryen", "helaena-targaryen"],
    allies: ["ormund-hightower"],
    rivals: ["rhaenyra-targaryen"],
    dragon: {
      name: "Tessarion", color: "Xanh Cô-ban và Đồng", size: "Trưởng Thành", age: 10,
      description: "Nữ hoàng Xanh, rực rỡ và nguy hiểm.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 12, "Bay Lượn": 15 }
    },
    personalHooks: [
      { id: "daeron-honeywine", title: "Trận Honeywine", year: "130 AC", numericYear: 130, desc: "Quân Hightower đang bị vây hãm và sắp thua. Ngươi cưỡi Tessarion đến giải cứu họ." }
    ],
    spouse: "",
    children: [],
    startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
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
    id: "otto-hightower",
    name: "Otto Hightower",
    tuocVi: "Hiệp Sĩ",
    house: "Hightower",
    role: "Bàn Tay Nhà Vua",
    religion: "Thất Diện Thần",
    blurb: "Kiến trúc sư của phe Xanh. Một người cực kỳ thông minh, xảo quyệt, và kiên nhẫn. Ông đã lên kế hoạch trong nhiều năm để đưa cháu ngoại mình lên Ngai Sắt.",
    birthYear: 76,
    deathYear: 130,
    age: 53,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 9, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 70, "Trí Mưu": 90, "Ngoại Giao": 80 },
    talentIds: ["schemer", "strategist", "keen-eye"],
    skills: { "cunning": 9, "deception": 8, "persuasion": 8, "lore": 7 },
    equipment: [],
    items: [],
    gold: 3000,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 25,
      "Đá": 100,
      "Lương Thực": 2000,
      "Ngựa": 30,
      "Thép Valyria": 0
    }, startingHookIds: [],
    children: ["alicent-hightower", "gwayne-hightower"],
    allies: ["aegon-ii-targaryen", "larys-strong"],
    rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
    personalHooks: [
      { id: "otto-council", title: "Cuộc Bỏ Phiếu Bí Mật", year: "129 AC", numericYear: 129, desc: "Viserys vừa tắt thở. Ngươi triệu tập Tiểu Hội Đồng để phong vương cho Aegon và nhốt kín mọi kẻ phản đối." }
    ],
    father: "",
    mother: "",
    spouse: "",
    siblings: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 168, quality: "Thành Thạo" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 72, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "larys-strong",
    name: "Larys Strong",
    tuocVi: "Lãnh Chúa Thành Trì",
    house: "Strong",
    role: "Lãnh Chúa Chân Khoèo",
    religion: "Cựu Thần",
    blurb: "Bậc thầy gián điệp của phe Xanh. Không ai biết Larys Strong thực sự muốn gì, nhưng mạng lưới tình báo của hắn giăng khắp King's Landing.",
    birthYear: 90,
    deathYear: 131,
    age: 39,
    coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 4, "Thể Chất": 8, "Trí Tuệ": 19, "Tinh Tường": 18, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 50, "Trí Mưu": 95, "Ngoại Giao": 90 },
    talentIds: ["schemer", "lame", "keen-eye"],
    skills: { "deception": 10, "cunning": 8, "stealth": 6 },
    equipment: [],
    items: [],
    gold: 2000,
    startResources: {
      "Gỗ": 200,
      "Quặng Sắt": 100,
      "Đá": 200,
      "Lương Thực": 1000,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "lyonel-strong",
    siblings: ["harwin-strong"],
    allies: ["otto-hightower", "alicent-hightower"],
    rivals: ["rhaenyra-targaryen"],
    personalHooks: [
      { id: "larys-schemes", title: "Những Lời Thì Thầm", year: "129 AC", numericYear: 129, desc: "Ngươi ở trong bóng tối, thao túng cuộc chiến bằng những lời nói dối và những cái chết bất ngờ." }
    ],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 1200, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ ", type: "Kỵ Binh", size: 400, quality: "Thành Thạo" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 400, quality: "Thành Thạo" }
        ],
    mother: "",
    spouse: "",
    children: [],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "cregan-stark",
    name: "Cregan Stark",
    tuocVi: "Đại Lãnh Chúa",
    house: "Stark",
    role: "Sói Phương Bắc",
    religion: "Cựu Thần",
    blurb: "Lãnh chúa trẻ của Winterfell, khét tiếng tàn bạo nhưng cực kỳ trọng danh dự. Anh đã ký Hiệp ước Băng và Lửa với Jacaerys Velaryon.",
    birthYear: 108,
    deathYear: 157,
    age: 21,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 14, "Thể Chất": 18, "Trí Tuệ": 12, "Tinh Tường": 18, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 80, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 90 },
    talentIds: ["warrior-blood", "born-swordsman", "lord-of-north"],
    skills: { "sword-shield": 9, "command": 8, "war-riding": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 30 }, moTa: "Thanh trọng kiếm khổng lồ bằng thép Valyria của Nhà Stark." }],
    items: [],
    gold: 1500,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 300,
      "Đá": 600,
      "Lương Thực": 2000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "rickon-stark",
    spouse: "arra-norrey",
    children: ["rickon-stark-son"],
    allies: ["jacaerys-velaryon", "rhaenyra-targaryen"],
    rivals: ["aegon-ii-targaryen"],
    relationshipDetails: {
      "jacaerys-velaryon": { type: "Bằng Hữu", trust: 95, affinity: 100, detail: "Hoàng tử Jace bay đến Winterfell trên lưng Vermax. Cregan nể phục sự dũng cảm và ký Hiệp Ước Băng và Lửa." },
      "aegon-ii-targaryen": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Cregan coi Aegon II là kẻ cướp ngôi. Giờ Của Sói — Cregan sẽ phán xét tất cả những kẻ phản bội." }
    },
    personalHooks: [
      { id: "hour-of-the-wolf", title: "Giờ Của Sói", year: "131 AC", numericYear: 131, desc: "Cuộc chiến đã vãn, các vị vua đã chết. Ngươi kéo quân phương Bắc xuống King's Landing để phán xét những kẻ phản bội." }
    ],
    startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 18000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Sói", type: "Kỵ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Winterfell", type: "Cung Thủ", size: 6000, quality: "Thành Thạo" }
        ],
    mother: "",
    siblings: [],
      startRegions: ["the-north"],
      startHoldings: ["the-north-seat"],
      holdingsLevel: {"the-north-seat":5},
      baseIncome: 400
},
  {
    id: "jeyne-arryn",
    name: "Jeyne Arryn",
    tuocVi: "Đại Lãnh Chúa",
    house: "Arryn",
    role: "Nữ Trinh Tượng Thung Lũng",
    religion: "Thất Diện Thần",
    blurb: "Nữ lãnh chúa độc thân của Vale. Bà đứng về phía Rhaenyra vì 'phụ nữ phải bênh vực phụ nữ'.",
    birthYear: 94,
    deathYear: 134,
    age: 35,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 75, "Trí Mưu": 75, "Ngoại Giao": 80 },
    talentIds: ["iron-constitution", "silver-tongue"],
    skills: { "persuasion": 8, "cunning": 7, "court-etiquette": 8 },
    equipment: [],
    items: [],
    gold: 2500,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 375,
      "Đá": 2000,
      "Lương Thực": 2000,
      "Ngựa": 120,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "arnold-arryn",
    allies: ["rhaenyra-targaryen"],
    rivals: ["arnold-arryn", "aegon-ii"],
    personalHooks: [
      { id: "jeyne-choice", title: "Lựa Chọn Của Nữ Trinh", year: "129 AC", numericYear: 129, desc: "Hoàng tử Jacaerys đến xin viện binh. Ngươi sẽ đòi hỏi gì để đổi lấy những thanh kiếm của Vale?" }
    ],
    startArmies: [
          { name: "Lính Giáo Thung Lũng", type: "Bộ Binh", size: 21000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Không Gian", type: "Kỵ Binh", size: 7000, quality: "Thành Thạo" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 7000, quality: "Thành Thạo" }
        ],
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
    id: "borros-baratheon",
    name: "Borros Baratheon",
    tuocVi: "Đại Lãnh Chúa",
    house: "Baratheon",
    role: "Lãnh Chúa Storm's End",
    religion: "Thất Diện Thần",
    blurb: "Một người nóng nảy, kiêu ngạo và không biết chữ. Hắn theo phe Xanh vì Aemond hứa cưới con gái hắn, trong khi Lucerys đến tay không.",
    birthYear: 85,
    deathYear: 131,
    age: 44,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 10, "Thể Chất": 16, "Trí Tuệ": 6, "Tinh Tường": 14, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 80, "Thống Soái": 60, "Trí Mưu": 30, "Ngoại Giao": 70 },
    talentIds: ["hot-tempered", "illiterate", "warrior-blood"],
    skills: { "sword-shield": 8, "command": 6 },
    equipment: [],
    items: [],
    gold: 2000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 300,
      "Đá": 750,
      "Lương Thực": 2750,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "boremund-baratheon",
    spouse: "elenda-caron",
    children: ["cassandra-baratheon", "maris-baratheon", "elinor-baratheon", "floris-baratheon"],
    allies: ["aemond-targaryen", "aegon-ii"],
    rivals: ["rhaenyra-targaryen"],
    personalHooks: [
      { id: "borros-choice", title: "Sứ Giả Hai Mang", year: "129 AC", numericYear: 129, desc: "Hoàng tử Aemond và Lucerys đang gầm gừ nhau trong sảnh đường của ngươi. Ngươi sẽ chọn ai?" }
    ],
    startArmies: [
          { name: "Bộ Binh Bão Tố", type: "Bộ Binh", size: 15000, quality: "Thành Thạo" },
          { name: "Đội Nỏ Vùng Bão", type: "Cung Thủ", size: 3750, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 125, quality: "Thành Thạo" }
        ],
    mother: "",
    siblings: [],
      startRegions: ["the-stormlands"],
      startHoldings: ["the-stormlands-seat"],
      holdingsLevel: {"the-stormlands-seat":5},
      baseIncome: 400
},
  {
    id: "dalton-greyjoy",
    name: "Dalton Greyjoy",
    tuocVi: "Đại Lãnh Chúa",
    house: "Greyjoy",
    role: "Thủy Quái Đỏ",
    religion: "Thần Chết Chìm",
    blurb: "Một hải tặc điên cuồng và khát máu. Dalton Greyjoy lợi dụng cuộc nội chiến để cướp bóc vùng Westerlands cho riêng mình.",
    birthYear: 113,
    deathYear: 133,
    age: 16,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 16, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 14, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 70, "Trí Mưu": 50, "Ngoại Giao": 70 },
    talentIds: ["warrior-blood", "berserker", "giant-frame"],
    skills: { "trading": 9, "sword-shield": 8, "intimidation": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Nightfall", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 20 }, moTa: "Thanh kiếm Thép Valyria cướp được từ một hải tặc." }],
    items: [],
    gold: 3000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 625,
      "Đá": 750,
      "Lương Thực": 1000,
      "Ngựa": 10,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "greyjoy-father",
    allies: ["rhaenyra-targaryen"],
    rivals: ["jason-lannister", "aegon-ii"],
    personalHooks: [
      { id: "red-kraken-rises", title: "Thủy Quái Trỗi Dậy", year: "129 AC", numericYear: 129, desc: "Vương quốc chìm trong chiến tranh. Đây là cơ hội để bầy thiết dân đi cướp bóc khắp các vùng duyên hải." }
    ],
    startArmies: [
          { name: "Chiến Binh Đảo Muối", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Người Ném Lao Quần Đảo", type: "Cung Thủ", size: 2250, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 75, quality: "Thành Thạo" }
        ],
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "alys-rivers",
    name: "Alys Rivers",
    tuocVi: "Thường Dân",
    house: "Strong",
    role: "Phù Thủy Harrenhal",
    religion: "Cựu Thần",
    blurb: "Người phụ nữ bí ẩn, được cho là phù thủy, có khả năng nhìn thấu ảo ảnh. Cô quyến rũ Aemond Targaryen và trở thành người tình của hắn tại Harrenhal.",
    birthYear: 90,
    age: 39,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 16, "Tinh Tường": 18, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 80, "Ngoại Giao": 90 },
    talentIds: ["greenseer", "master-liar"],
    skills: { "greensight": 8, "persuasion": 7, "maester-medicine": 6 },
    equipment: [],
    items: [],
    gold: 50,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "lyonel-strong",
    spouse: "aemond-targaryen",
    allies: ["aemond-targaryen"],
    rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
    personalHooks: [
      { id: "alys-aemond", title: "Phù Thủy Bắt Rồng", year: "130 AC", numericYear: 130, desc: "Aemond Targaryen chiếm Harrenhal. Ngươi dùng sắc đẹp và phép thuật để trói buộc hoàng tử một mắt." }
    ],
    mother: "",
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
    id: "hugh-hammer",
    name: "Hugh Búa Tạ",
    tuocVi: "Thường Dân",
    house: "Khác",
    role: "Kỵ Sĩ Hạt Giống",
    religion: "Thất Diện Thần",
    blurb: "Một người thợ rèn khổng lồ ở Dragonstone có dòng máu Valyria. Hắn thuần phục được con rồng lớn tuổi và hung dữ thứ hai thế giới: Vermithor.",
    birthYear: 95,
    deathYear: 130,
    age: 34,
    coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 9, "Thể Chất": 17, "Trí Tuệ": 7, "Tinh Tường": 10, "Uy Tín": 8 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 40, "Trí Mưu": 35, "Ngoại Giao": 50 },
    talentIds: ["giant-frame", "hot-tempered", "warrior-blood"],
    skills: { "axe-mace": 8, "war-riding": 6, "smithing": 7 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa Tạ", phamChat: "Thường", thuocTinh: { "Sát Thương": 15 }, moTa: "Cây búa khổng lồ của thợ rèn." }],
    items: [],
    gold: 20,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["ulf-white", "aegon-ii"],
    rivals: ["rhaenyra-targaryen", "daemon-targaryen", "addam-velaryon"],
    dragon: {
      name: "Vermithor", color: "Đồng", size: "Khổng Lồ (Balerion-class)", age: 95,
      description: "Cơn thịnh nộ bằng đồng, từng là rồng của vua Jaehaerys I.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 16, "Bay Lượn": 10, "Săn Mồi": 12 }
    },
    personalHooks: [
      { id: "hugh-sowing", title: "Cuộc Gieo Hạt Lửa", year: "129 AC", numericYear: 129, desc: "Phe Đen gọi những hạt giống rồng. Ngươi mang theo chiếc búa thợ rèn, bước vào hang của Vermithor." }
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
    id: "addam-velaryon",
    name: "Addam Velaryon",
    tuocVi: "Hiệp Sĩ",
    house: "Velaryon",
    role: "Hạt Giống Trung Thành",
    religion: "Thất Diện Thần",
    blurb: "Con hoang của Hull, sau được hợp thức hóa thành Velaryon. Cưỡi rồng Seasmoke, Addam trung thành đến hơi thở cuối cùng để bảo vệ danh dự của gia tộc, dù bị Nữ Vương nghi ngờ.",
    birthYear: 114,
    deathYear: 130,
    age: 15,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 18, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 90 },
    talentIds: ["beloved", "warrior-blood"],
    skills: { "war-riding": 7, "trading": 6, "sword-shield": 6 },
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
    father: "corlys-velaryon",
    siblings: ["alyn-velaryon"],
    allies: ["rhaenyra-targaryen", "corlys-velaryon"],
    rivals: ["hugh-hammer", "ulf-white"],
    dragon: {
      name: "Seasmoke", color: "Xám Bạc", size: "Trưởng Thành", age: 29,
      description: "Con rồng nhanh nhẹn từng thuộc về Laenor Velaryon.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 12, "Bay Lượn": 18, "Nhào Lộn": 15 }
    },
    personalHooks: [
      { id: "addam-tumbleton", title: "Trận Tumbleton Thứ Hai", year: "130 AC", numericYear: 130, desc: "Bị nghi ngờ là kẻ phản bội, ngươi tập hợp đội quân Riverlands và cưỡi Seasmoke lao vào trận chiến cuối cùng để chứng minh lòng trung thành." }
    ],
    mother: "",
    spouse: "",
    children: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 48, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 12, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Driftmark", type: "Chiến Thuyền Nặng", size: 1, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "nettles",
    name: "Nettles",
    tuocVi: "Thường Dân",
    house: "Khác",
    role: "Kẻ Đánh Cắp Cừu",
    religion: "Không",
    blurb: "Cô bé thấp bé, da ngăm đen và miệng hôi, không có nét gì của Valyria nhưng lại thuần phục được con rồng hoang dã Sheepstealer bằng cách cho nó ăn cừu mỗi ngày.",
    birthYear: 113,
    age: 16,
    coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 16, "Thể Chất": 14, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 8 },
    năngLực: { "Võ Lực": 35, "Thống Soái": 40, "Trí Mưu": 70, "Ngoại Giao": 80 },
    talentIds: ["schemer", "catlike"],
    skills: { "war-riding": 8, "stealth": 8, "weather-endurance": 8 },
    equipment: [],
    items: [{ ten: "Cừu giết sẵn", soLuong: 2, moTa: "Dùng để cho rồng ăn." }],
    gold: 5,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daemon-targaryen", "rhaenyra-targaryen"],
    rivals: ["aemond-targaryen", "aegon-ii"],
    dragon: {
      name: "Sheepstealer", color: "Nâu Bùn", size: "Trưởng Thành", age: 80,
      description: "Con rồng hoang dã cực kỳ hung dữ và thích ăn thịt cừu chó.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 14, "Bay Lượn": 12, "Săn Mồi": 20 }
    },
    personalHooks: [
      { id: "nettles-tame", title: "Thuần Phục Kẻ Trộm Cừu", year: "129 AC", numericYear: 129, desc: "Ngươi mang những con cừu máu me đến tổ rồng trên ngọn Dragonmont ngày qua ngày." }
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
  ,
  {
    id: "baela-targaryen", name: "Baela Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Cưỡi Rồng", religion: "Thất Diện Thần",
    blurb: "Con gái của Daemon. Bướng bỉnh, hoang dại, giống cha mình y hệt. Cô cưỡi con rồng Moondancer.",
    birthYear: 116, age: 13, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 15, "Thể Chất": 11, "Trí Tuệ": 12, "Tinh Tường": 16, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 45, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 80 },
    talentIds: ["warrior-blood", "hot-tempered"], skills: { "war-riding": 7, "sword-shield": 5 },
    equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daemon-targaryen", mother: "laena-velaryon",
    spouse: "jacaerys-velaryon",
    siblings: ["rhaena-targaryen", "aegon-iii", "viserys-ii-targaryen"],
    allies: ["rhaenyra-targaryen", "corlys-velaryon"],
    rivals: ["aegon-ii"],
    dragon: { name: "Moondancer", color: "Xanh lá nhạt", size: "Non", age: 10, description: "Con rồng nhỏ nhưng bay cực kỳ nhanh", stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }, skills: { "Bay Lượn": 18, "Lửa Rồng": 8 } },
    children: [],
    startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
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
    id: "rhaena-targaryen", name: "Rhaena Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Dịu Dàng", religion: "Thất Diện Thần",
    blurb: "Em gái sinh đôi của Baela. Dịu dàng, thích múa và quần áo đẹp hơn là kiếm thuật.",
    birthYear: 116, age: 13, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 70, "Ngoại Giao": 60 },
    talentIds: ["highborn-charm", "silver-tongue"], skills: { "cunning": 5, "persuasion": 6 },
    equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daemon-targaryen", mother: "laena-velaryon",
    spouse: "lucerys-velaryon",
    siblings: ["baela-targaryen", "aegon-iii", "viserys-ii-targaryen"],
    allies: ["rhaenyra-targaryen", "corlys-velaryon"],
    rivals: ["aegon-ii"],
    children: [],
    startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 1200, quality: "Tinh Nhuệ" },
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
    id: "harwin-strong", name: "Harwin Strong", tuocVi: "Hiệp Sĩ", house: "Strong", role: "Người Mẻ Cốt", religion: "Cựu Thần",
    blurb: "Người đàn ông mạnh nhất Bảy Vương Quốc, Đội trưởng Đội Gác Thành, và được cho là cha ruột của các con trai Rhaenyra.",
    birthYear: 90, deathYear: 120, age: 30, coreStats: { "Sức Mạnh": 20, "Nhanh Nhẹn": 11, "Thể Chất": 18, "Trí Tuệ": 9, "Tinh Tường": 15, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 100, "Thống Soái": 70, "Trí Mưu": 45, "Ngoại Giao": 75 },
    talentIds: ["giant-frame", "warrior-blood"], skills: { "sword-shield": 9, "command": 6 },
    equipment: [], items: [], gold: 800,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 50,
      "Đá": 100,
      "Lương Thực": 500,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "lyonel-strong",
    siblings: ["larys-strong"],
    children: ["jacaerys-velaryon", "lucerys-velaryon", "joffrey-velaryon"],
    allies: ["rhaenyra-targaryen", "viserys-i-targaryen"],
    rivals: ["criston-cole", "aegon-ii"],
    mother: "",
    spouse: "",
    startArmies: [
          { name: "Bộ Binh Harrenhal", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "mysaria", name: "Mysaria", tuocVi: "Thường Dân", house: "Khác", role: "Sâu Trắng", religion: "Khác",
    blurb: "Cựu kỹ nữ đến từ Lys, trở thành người tình của Daemon và là bậc thầy gián điệp của Rhaenyra.",
    birthYear: 88, age: 41, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 12, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 90, "Trí Mưu": 90, "Ngoại Giao": 80 },
    talentIds: ["schemer", "master-liar"], skills: { "gather-rumor": 9, "deception": 8, "persuasion": 9 },
    equipment: [], items: [], gold: 2000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["daemon-targaryen", "rhaenyra-targaryen"],
    rivals: ["larys-strong", "aegon-ii"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Lính Thuê Xứ Essos", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Bóng Tối", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "tyland-lannister", name: "Tyland Lannister", tuocVi: "Hiệp Sĩ", house: "Lannister", role: "Quản Lý Ngân Khố", religion: "Thất Diện Thần",
    blurb: "Phục vụ phe Xanh, đã nhanh tay phân tán ngân khố hoàng gia trước khi Rhaenyra chiếm được vương đô.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 17, "Tinh Tường": 16, "Uy Tín": 13 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 65, "Trí Mưu": 85, "Ngoại Giao": 80 },
    talentIds: ["schemer", "beloved"], skills: { "trading": 9, "cunning": 8 },
    equipment: [], items: [], gold: 10000,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    siblings: ["jason-lannister"],
    allies: ["aegon-ii", "alicent-hightower", "otto-hightower"],
    rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    startArmies: [
          { name: "Bộ Binh Casterly Rock", type: "Bộ Binh", size: 350, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "jason-lannister", name: "Jason Lannister", tuocVi: "Lãnh Chúa", house: "Lannister", role: "Lãnh Chúa Casterly Rock", religion: "Thất Diện Thần",
    blurb: "Anh trai sinh đôi của Tyland, lãnh chúa giàu có, kiêu ngạo. Dẫn dắt quân đội Tây chiến đấu cho vua Aegon II.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 12, "Trí Tuệ": 13, "Tinh Tường": 12, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 75, "Trí Mưu": 65, "Ngoại Giao": 60 },
    talentIds: ["intimidating", "merchant-fortune"], skills: { "command": 7, "trading": 8 },
    equipment: [], items: [], gold: 30000,
    startResources: {
      "Gỗ": 100,
      "Quặng Sắt": 300,
      "Đá": 300,
      "Lương Thực": 1200,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [], startArmies: [
          { name: "Đội Trọng Bộ Binh Lannister", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Vùng Đồi", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Cung Thủ Phương Tây", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ],
    spouse: "johanna-westerling",
    children: ["cerelle-lannister", "tyshara-lannister"],
    siblings: ["tyland-lannister"],
    allies: ["aegon-ii", "alicent-hightower"],
    rivals: ["dalton-greyjoy", "rhaenyra-targaryen"],
    father: "",
    mother: "",
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "ulf-white", name: "Ulf Trắng", tuocVi: "Thường Dân", house: "Khác", role: "Kẻ Nát Rượu", religion: "Thất Diện Thần",
    blurb: "Một kỵ sĩ hạt giống, nát rượu và tham lam, cưỡi con rồng Silverwing.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 9, "Thể Chất": 13, "Trí Tuệ": 6, "Tinh Tường": 7, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 50, "Trí Mưu": 30, "Ngoại Giao": 35 },
    talentIds: ["chronic-illness", "hot-tempered"], skills: { "war-riding": 5 },
    equipment: [], items: [], gold: 10,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["hugh-hammer", "aegon-ii"],
    rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
    dragon: { name: "Silverwing", color: "Bạc", size: "Trưởng Thành", age: 93, description: "Rồng hiền hòa", stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }, skills: { "Lửa Rồng": 14, "Bay Lượn": 14 } },
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Lính Thuê Hạt Giống Rồng", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Thuê", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "orwyle", name: "Orwyle", tuocVi: "Thường Dân", house: "Khác", role: "Đại Maester", religion: "Thất Diện Thần",
    blurb: "Đại Maester của Tiểu Hội Đồng, theo phe Xanh.",
    birthYear: 70, age: 59, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 12, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 50, "Trí Mưu": 90, "Ngoại Giao": 60 },
    talentIds: ["learned"], skills: { "maester-medicine": 9, "lore": 9, "languages": 9 },
    equipment: [], items: [], gold: 100,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["alicent-hightower", "aegon-ii"],
    rivals: ["rhaenyra-targaryen"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Vệ Binh Citadel", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Oldtown", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "jasper-wylde", name: "Jasper Wylde", tuocVi: "Lãnh Chúa", house: "Wylde", role: "Gậy Sắt", religion: "Thất Diện Thần",
    blurb: "Quan quản pháp của Vua Viserys, vô cùng cứng nhắc về luật lệ. Ông theo phe Xanh vì luật truyền ngôi cho con trai trưởng.",
    birthYear: 75, age: 54, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 8, "Thể Chất": 12, "Trí Tuệ": 16, "Tinh Tường": 18, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 45, "Thống Soái": 55, "Trí Mưu": 80, "Ngoại Giao": 90 },
    talentIds: ["keen-eye", "learned"], skills: { "lore": 9, "cunning": 7 },
    equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 200,
      "Quặng Sắt": 100,
      "Đá": 200,
      "Lương Thực": 1000,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    allies: ["aegon-ii", "alicent-hightower"],
    rivals: ["rhaenyra-targaryen"],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Bộ Binh Rain House", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vùng Bão", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "sabitha-frey", name: "Sabitha Frey", tuocVi: "Tiểu Thư", house: "Frey", role: "Nữ Tướng", religion: "Thất Diện Thần",
    blurb: "Vợ của lãnh chúa Frey, thích chiến tranh hơn thêu thùa, dẫn dắt quân Frey chiến đấu cho phe Đen.",
    birthYear: 100, age: 29, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 11 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 55, "Trí Mưu": 60, "Ngoại Giao": 75 },
    talentIds: ["warrior-blood", "berserker"], skills: { "command": 7, "sword-shield": 7 },
    equipment: [], items: [], gold: 800,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "forrest-frey",
    allies: ["rhaenyra-targaryen", "cregan-stark"],
    rivals: ["aegon-ii", "jason-lannister"],
    father: "",
    mother: "",
    children: [],
    siblings: [],
    startArmies: [
          { name: "Bộ Binh Song Thành", type: "Bộ Binh", size: 560, quality: "Mới Lập Đội" },
          { name: "Người Bắn Nỏ Vùng Đầm", type: "Cung Thủ", size: 240, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];

