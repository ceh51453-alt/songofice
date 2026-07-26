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
    talentIds: ["born-leader", "diplomat", "brave"],
    skills: { "Ngoại Giao": 14, "Cưỡi Rồng": 12, "Cận Chiến (Kiếm)": 10 },
    equipment: [],
    items: [],
    gold: 500, startingHookIds: [],
    dragon: {
      name: "Vermax", color: "Xanh Lục", size: "Trưởng Thành", age: 14,
      description: "Con rồng trẻ đang độ lớn, bay rất nhanh và hung dữ.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 10, "Bay Lượn": 14, "Săn Mồi": 10 }
    },
    personalHooks: [
      { id: "jace-north", title: "Hành Trình Lên Bắc", year: "129 AC", numericYear: 129, desc: "Mẹ giao cho ngươi nhiệm vụ đến Eyrie, White Harbor và Winterfell để giành sự ủng hộ của lãnh chúa Stark và Arryn." }
    ]
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
    talentIds: ["brave", "innocent"],
    skills: { "Cưỡi Rồng": 10, "Cận Chiến (Kiếm)": 6 },
    equipment: [],
    items: [],
    gold: 300, startingHookIds: [],
    dragon: {
      name: "Arrax", color: "Trắng Ngọc Trai", size: "Trưởng Thành", age: 13,
      description: "Con rồng trẻ, nhanh nhẹn nhưng chưa đủ sức chiến đấu với những con rồng khổng lồ.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 8, "Bay Lượn": 16, "Săn Mồi": 8 }
    },
    personalHooks: [
      { id: "luke-storms-end", title: "Bay Tới Storm's End", year: "129 AC", numericYear: 129, desc: "Bầu trời u ám báo hiệu một cơn bão lớn. Ngươi cưỡi Arrax đến lâu đài của Vua Bão với một lá thư mỏng manh." }
    ]
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
    talentIds: ["depressed", "observant"],
    skills: { "Lịch Sử": 5 },
    equipment: [],
    items: [],
    gold: 100, startingHookIds: [],
    dragon: {
      name: "Stormcloud", color: "Xám Xịt", size: "Non", age: 9,
      description: "Con rồng nhỏ chưa từng được cưỡi.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Bay Lượn": 10 }
    },
    personalHooks: [
      { id: "aegon-gay-abandon", title: "Tháo Chạy Trên Biển", year: "129 AC", numericYear: 129, desc: "Ngươi đang trên tàu Gay Abandon chạy trốn đến Pentos thì bị hạm đội Triarchy tập kích." }
    ]
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
    talentIds: ["prophetic", "gentle", "madness"],
    skills: { "Ma Thuật (Tiên Tri)": 15 },
    equipment: [],
    items: [],
    gold: 1000, startingHookIds: [],
    dragon: {
      name: "Dreamfyre", color: "Xanh Nhạt và Bạc", size: "Trưởng Thành", age: 97,
      description: "Con rồng già dặn, duyên dáng và hiền hòa.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 14, "Bay Lượn": 12 }
    },
    personalHooks: [
      { id: "blood-and-cheese", title: "Máu và Phô Mai", year: "129 AC", numericYear: 129, desc: "Hai kẻ sát thủ đang đứng trong phòng ngươi. Chúng bắt ngươi phải chọn một đứa con để chết." }
    ]
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
    talentIds: ["brave", "chivalrous"],
    skills: { "Cưỡi Rồng": 12, "Cận Chiến (Kiếm)": 12, "Chỉ Huy": 8 },
    equipment: [],
    items: [],
    gold: 800, startingHookIds: [],
    dragon: {
      name: "Tessarion", color: "Xanh Cô-ban và Đồng", size: "Trưởng Thành", age: 10,
      description: "Nữ hoàng Xanh, rực rỡ và nguy hiểm.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 12, "Bay Lượn": 15 }
    },
    personalHooks: [
      { id: "daeron-honeywine", title: "Trận Honeywine", year: "130 AC", numericYear: 130, desc: "Quân Hightower đang bị vây hãm và sắp thua. Ngươi cưỡi Tessarion đến giải cứu họ." }
    ]
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
    talentIds: ["cunning", "strategic-mind", "ambitious"],
    skills: { "Chính Trị": 18, "Lừa Lọc": 15, "Ngoại Giao": 16, "Học Thuật": 14 },
    equipment: [],
    items: [],
    gold: 3000, startingHookIds: [],
    startHoldings: [],
    startRegions: [],
    personalHooks: [
      { id: "otto-council", title: "Cuộc Bỏ Phiếu Bí Mật", year: "129 AC", numericYear: 129, desc: "Viserys vừa tắt thở. Ngươi triệu tập Tiểu Hội Đồng để phong vương cho Aegon và nhốt kín mọi kẻ phản đối." }
    ]
  },
  {
    id: "larys-strong",
    name: "Larys Strong",
    tuocVi: "Lãnh Chúa",
    house: "Strong",
    role: "Lãnh Chúa Chân Khoèo",
    religion: "Cựu Thần",
    blurb: "Bậc thầy gián điệp của phe Xanh. Không ai biết Larys Strong thực sự muốn gì, nhưng mạng lưới tình báo của hắn giăng khắp King's Landing.",
    birthYear: 90,
    deathYear: 131,
    age: 39,
    coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 4, "Thể Chất": 8, "Trí Tuệ": 19, "Tinh Tường": 18, "Uy Tín": 10 },
    talentIds: ["cunning", "crippled", "secret-keeper"],
    skills: { "Lừa Lọc": 20, "Chính Trị": 15, "Ám Sát": 10 },
    equipment: [],
    items: [],
    gold: 2000, startingHookIds: [],
    startHoldings: ["harrenhal"],
    startRegions: [],
    personalHooks: [
      { id: "larys-schemes", title: "Những Lời Thì Thầm", year: "129 AC", numericYear: 129, desc: "Ngươi ở trong bóng tối, thao túng cuộc chiến bằng những lời nói dối và những cái chết bất ngờ." }
    ]
  },
  {
    id: "cregan-stark",
    name: "Cregan Stark",
    tuocVi: "Lãnh Chúa",
    house: "Stark",
    role: "Sói Phương Bắc",
    religion: "Cựu Thần",
    blurb: "Lãnh chúa trẻ của Winterfell, khét tiếng tàn bạo nhưng cực kỳ trọng danh dự. Anh đã ký Hiệp ước Băng và Lửa với Jacaerys Velaryon.",
    birthYear: 108,
    deathYear: 157,
    age: 21,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 14, "Thể Chất": 18, "Trí Tuệ": 12, "Tinh Tường": 18, "Uy Tín": 14 },
    talentIds: ["honorable", "fearsome-warrior", "wolfblood"],
    skills: { "Cận Chiến (Kiếm)": 18, "Chỉ Huy": 15, "Cưỡi Ngựa": 14 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 30 }, moTa: "Thanh trọng kiếm khổng lồ bằng thép Valyria của Nhà Stark." }],
    items: [],
    gold: 1500, startingHookIds: [],
    startHoldings: ["winterfell"],
    startRegions: ["the-north"],
    personalHooks: [
      { id: "hour-of-the-wolf", title: "Giờ Của Sói", year: "131 AC", numericYear: 131, desc: "Cuộc chiến đã vãn, các vị vua đã chết. Ngươi kéo quân phương Bắc xuống King's Landing để phán xét những kẻ phản bội." }
    ]
  },
  {
    id: "jeyne-arryn",
    name: "Jeyne Arryn",
    tuocVi: "Lãnh Chúa",
    house: "Arryn",
    role: "Nữ Trinh Tượng Thung Lũng",
    religion: "Thất Diện Thần",
    blurb: "Nữ lãnh chúa độc thân của Vale. Bà đứng về phía Rhaenyra vì 'phụ nữ phải bênh vực phụ nữ'.",
    birthYear: 94,
    deathYear: 134,
    age: 35,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 15 },
    talentIds: ["stubborn", "diplomat"],
    skills: { "Ngoại Giao": 16, "Chính Trị": 14, "Quản Lý": 15 },
    equipment: [],
    items: [],
    gold: 2500, startingHookIds: [],
    startHoldings: ["the-eyrie"],
    startRegions: ["the-vale"],
    personalHooks: [
      { id: "jeyne-choice", title: "Lựa Chọn Của Nữ Trinh", year: "129 AC", numericYear: 129, desc: "Hoàng tử Jacaerys đến xin viện binh. Ngươi sẽ đòi hỏi gì để đổi lấy những thanh kiếm của Vale?" }
    ]
  },
  {
    id: "borros-baratheon",
    name: "Borros Baratheon",
    tuocVi: "Lãnh Chúa",
    house: "Baratheon",
    role: "Lãnh Chúa Storm's End",
    religion: "Thất Diện Thần",
    blurb: "Một người nóng nảy, kiêu ngạo và không biết chữ. Hắn theo phe Xanh vì Aemond hứa cưới con gái hắn, trong khi Lucerys đến tay không.",
    birthYear: 85,
    deathYear: 131,
    age: 44,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 10, "Thể Chất": 16, "Trí Tuệ": 6, "Tinh Tường": 14, "Uy Tín": 12 },
    talentIds: ["arrogant", "illiterate", "fearsome-warrior"],
    skills: { "Cận Chiến (Kiếm)": 15, "Chỉ Huy": 12 },
    equipment: [],
    items: [],
    gold: 2000, startingHookIds: [],
    startHoldings: ["storms-end"],
    startRegions: ["the-stormlands"],
    personalHooks: [
      { id: "borros-choice", title: "Sứ Giả Hai Mang", year: "129 AC", numericYear: 129, desc: "Hoàng tử Aemond và Lucerys đang gầm gừ nhau trong sảnh đường của ngươi. Ngươi sẽ chọn ai?" }
    ]
  },
  {
    id: "dalton-greyjoy",
    name: "Dalton Greyjoy",
    tuocVi: "Lãnh Chúa",
    house: "Greyjoy",
    role: "Thủy Quái Đỏ",
    religion: "Thần Chết Chìm",
    blurb: "Một hải tặc điên cuồng và khát máu. Dalton Greyjoy lợi dụng cuộc nội chiến để cướp bóc vùng Westerlands cho riêng mình.",
    birthYear: 113,
    deathYear: 133,
    age: 16,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 16, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 14, "Uy Tín": 14 },
    talentIds: ["ironborn", "bloodthirsty", "fearsome-warrior"],
    skills: { "Hàng Hải": 18, "Cận Chiến (Kiếm)": 16, "Cướp Bóc": 18 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Nightfall", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 20 }, moTa: "Thanh kiếm Thép Valyria cướp được từ một hải tặc." }],
    items: [],
    gold: 3000, startingHookIds: [],
    startHoldings: ["pyke"],
    startRegions: ["the-iron-islands"],
    personalHooks: [
      { id: "red-kraken-rises", title: "Thủy Quái Trỗi Dậy", year: "129 AC", numericYear: 129, desc: "Vương quốc chìm trong chiến tranh. Đây là cơ hội để bầy thiết dân đi cướp bóc khắp các vùng duyên hải." }
    ]
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
    talentIds: ["mystic", "seductive"],
    skills: { "Ma Thuật (Tiên Tri)": 15, "Thuyết Phục": 14, "Thảo Dược": 12 },
    equipment: [],
    items: [],
    gold: 50, startingHookIds: [],
    startHoldings: [],
    startRegions: [],
    personalHooks: [
      { id: "alys-aemond", title: "Phù Thủy Bắt Rồng", year: "130 AC", numericYear: 130, desc: "Aemond Targaryen chiếm Harrenhal. Ngươi dùng sắc đẹp và phép thuật để trói buộc hoàng tử một mắt." }
    ]
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
    talentIds: ["strong", "arrogant", "ambitious"],
    skills: { "Cận Chiến (Búa)": 15, "Cưỡi Rồng": 10, "Thợ Rèn": 12 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa Tạ", phamChat: "Thường", thuocTinh: { "Sát Thương": 15 }, moTa: "Cây búa khổng lồ của thợ rèn." }],
    items: [],
    gold: 20, startingHookIds: [],
    dragon: {
      name: "Vermithor", color: "Đồng", size: "Khổng Lồ (Balerion-class)", age: 95,
      description: "Cơn thịnh nộ bằng đồng, từng là rồng của vua Jaehaerys I.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 16, "Bay Lượn": 10, "Săn Mồi": 12 }
    },
    personalHooks: [
      { id: "hugh-sowing", title: "Cuộc Gieo Hạt Lửa", year: "129 AC", numericYear: 129, desc: "Phe Đen gọi những hạt giống rồng. Ngươi mang theo chiếc búa thợ rèn, bước vào hang của Vermithor." }
    ]
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
    talentIds: ["loyal", "brave"],
    skills: { "Cưỡi Rồng": 14, "Hàng Hải": 12, "Cận Chiến (Kiếm)": 12 },
    equipment: [],
    items: [],
    gold: 100, startingHookIds: [],
    dragon: {
      name: "Seasmoke", color: "Xám Bạc", size: "Trưởng Thành", age: 29,
      description: "Con rồng nhanh nhẹn từng thuộc về Laenor Velaryon.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 12, "Bay Lượn": 18, "Nhào Lộn": 15 }
    },
    personalHooks: [
      { id: "addam-tumbleton", title: "Trận Tumbleton Thứ Hai", year: "130 AC", numericYear: 130, desc: "Bị nghi ngờ là kẻ phản bội, ngươi tập hợp đội quân Riverlands và cưỡi Seasmoke lao vào trận chiến cuối cùng để chứng minh lòng trung thành." }
    ]
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
    talentIds: ["cunning", "survivor"],
    skills: { "Cưỡi Rồng": 15, "Lén Lút": 16, "Sinh Tồn": 15 },
    equipment: [],
    items: [{ ten: "Cừu giết sẵn", soLuong: 2, moTa: "Dùng để cho rồng ăn." }],
    gold: 5, startingHookIds: [],
    dragon: {
      name: "Sheepstealer", color: "Nâu Bùn", size: "Trưởng Thành", age: 80,
      description: "Con rồng hoang dã cực kỳ hung dữ và thích ăn thịt cừu chó.",
      stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
      skills: { "Lửa Rồng": 14, "Bay Lượn": 12, "Săn Mồi": 20 }
    },
    personalHooks: [
      { id: "nettles-tame", title: "Thuần Phục Kẻ Trộm Cừu", year: "129 AC", numericYear: 129, desc: "Ngươi mang những con cừu máu me đến tổ rồng trên ngọn Dragonmont ngày qua ngày." }
    ]
  }
  ,
  {
    id: "baela-targaryen", name: "Baela Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Cưỡi Rồng", religion: "Thất Diện Thần",
    blurb: "Con gái của Daemon. Bướng bỉnh, hoang dại, giống cha mình y hệt. Cô cưỡi con rồng Moondancer.",
    birthYear: 116, age: 13, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 15, "Thể Chất": 11, "Trí Tuệ": 12, "Tinh Tường": 16, "Uy Tín": 14 },
    talentIds: ["brave", "hot-tempered"], skills: { "Cưỡi Rồng": 12, "Cận Chiến (Kiếm)": 8 },
    equipment: [], items: [], gold: 500, startingHookIds: [],
    dragon: { name: "Moondancer", color: "Xanh lá nhạt", size: "Non", age: 10, description: "Con rồng nhỏ nhưng bay cực kỳ nhanh", stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }, skills: { "Bay Lượn": 18, "Lửa Rồng": 8 } }
  },
  {
    id: "rhaena-targaryen", name: "Rhaena Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Dịu Dàng", religion: "Thất Diện Thần",
    blurb: "Em gái sinh đôi của Baela. Dịu dàng, thích múa và quần áo đẹp hơn là kiếm thuật.",
    birthYear: 116, age: 13, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 16 },
    talentIds: ["gentle", "charming"], skills: { "Chính Trị": 10, "Ngoại Giao": 12 },
    equipment: [], items: [], gold: 500, startingHookIds: []
  },
  {
    id: "harwin-strong", name: "Harwin Strong", tuocVi: "Hiệp Sĩ", house: "Strong", role: "Người Mẻ Cốt", religion: "Cựu Thần",
    blurb: "Người đàn ông mạnh nhất Bảy Vương Quốc, Đội trưởng Đội Gác Thành, và được cho là cha ruột của các con trai Rhaenyra.",
    birthYear: 90, deathYear: 120, age: 30, coreStats: { "Sức Mạnh": 20, "Nhanh Nhẹn": 11, "Thể Chất": 18, "Trí Tuệ": 9, "Tinh Tường": 15, "Uy Tín": 14 },
    talentIds: ["giant-frame", "strong"], skills: { "Cận Chiến (Kiếm)": 18, "Chỉ Huy": 12 },
    equipment: [], items: [], gold: 800, startingHookIds: []
  },
  {
    id: "mysaria", name: "Mysaria", tuocVi: "Thường Dân", house: "Khác", role: "Sâu Trắng", religion: "Khác",
    blurb: "Cựu kỹ nữ đến từ Lys, trở thành người tình của Daemon và là bậc thầy gián điệp của Rhaenyra.",
    birthYear: 88, age: 41, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 12, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 18 },
    talentIds: ["schemer", "seductive"], skills: { "Tình Báo": 18, "Lừa Lọc": 16, "Quyến Rũ": 18 },
    equipment: [], items: [], gold: 2000, startingHookIds: []
  },
  {
    id: "tyland-lannister", name: "Tyland Lannister", tuocVi: "Hiệp Sĩ", house: "Lannister", role: "Quản Lý Ngân Khố", religion: "Thất Diện Thần",
    blurb: "Phục vụ phe Xanh, đã nhanh tay phân tán ngân khố hoàng gia trước khi Rhaenyra chiếm được vương đô.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 17, "Tinh Tường": 16, "Uy Tín": 13 },
    talentIds: ["schemer", "loyal"], skills: { "Tài Chính": 18, "Chính Trị": 15 },
    equipment: [], items: [], gold: 10000, startingHookIds: []
  },
  {
    id: "jason-lannister", name: "Jason Lannister", tuocVi: "Lãnh Chúa", house: "Lannister", role: "Lãnh Chúa Casterly Rock", religion: "Thất Diện Thần",
    blurb: "Anh trai sinh đôi của Tyland, lãnh chúa giàu có, kiêu ngạo. Dẫn dắt quân đội Tây chiến đấu cho vua Aegon II.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 11, "Thể Chất": 12, "Trí Tuệ": 13, "Tinh Tường": 12, "Uy Tín": 15 },
    talentIds: ["proud", "wealthy"], skills: { "Chỉ Huy": 14, "Tài Chính": 15 },
    equipment: [], items: [], gold: 30000, startingHookIds: [], startArmy: { size: 10000, quality: "Thiện Chiến" }
  },
  {
    id: "ulf-white", name: "Ulf Trắng", tuocVi: "Thường Dân", house: "Khác", role: "Kẻ Nát Rượu", religion: "Thất Diện Thần",
    blurb: "Một kỵ sĩ hạt giống, nát rượu và tham lam, cưỡi con rồng Silverwing.",
    birthYear: 90, age: 39, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 9, "Thể Chất": 13, "Trí Tuệ": 6, "Tinh Tường": 7, "Uy Tín": 10 },
    talentIds: ["drunkard", "treacherous"], skills: { "Cưỡi Rồng": 10 },
    equipment: [], items: [], gold: 10, startingHookIds: [],
    dragon: { name: "Silverwing", color: "Bạc", size: "Trưởng Thành", age: 93, description: "Rồng hiền hòa", stats: { "Sức Lửa": 15, "Sức Bay": 18, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 }, skills: { "Lửa Rồng": 14, "Bay Lượn": 14 } }
  },
  {
    id: "orwyle", name: "Orwyle", tuocVi: "Thường Dân", house: "Khác", role: "Đại Maester", religion: "Thất Diện Thần",
    blurb: "Đại Maester của Tiểu Hội Đồng, theo phe Xanh.",
    birthYear: 70, age: 59, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 12, "Uy Tín": 10 },
    talentIds: ["learned"], skills: { "Y Thuật": 18, "Lịch Sử": 18, "Học Thuật": 18 },
    equipment: [], items: [], gold: 100, startingHookIds: []
  },
  {
    id: "jasper-wylde", name: "Jasper Wylde", tuocVi: "Lãnh Chúa", house: "Wylde", role: "Gậy Sắt", religion: "Thất Diện Thần",
    blurb: "Quan quản pháp của Vua Viserys, vô cùng cứng nhắc về luật lệ. Ông theo phe Xanh vì luật truyền ngôi cho con trai trưởng.",
    birthYear: 75, age: 54, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 8, "Thể Chất": 12, "Trí Tuệ": 16, "Tinh Tường": 18, "Uy Tín": 11 },
    talentIds: ["strict", "just"], skills: { "Luật Pháp": 18, "Chính Trị": 14 },
    equipment: [], items: [], gold: 1000, startingHookIds: []
  },
  {
    id: "sabitha-frey", name: "Sabitha Frey", tuocVi: "Tiểu Thư", house: "Frey", role: "Nữ Tướng", religion: "Thất Diện Thần",
    blurb: "Vợ của lãnh chúa Frey, thích chiến tranh hơn thêu thùa, dẫn dắt quân Frey chiến đấu cho phe Đen.",
    birthYear: 100, age: 29, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 11 },
    talentIds: ["warrior-blood", "ruthless"], skills: { "Chỉ Huy": 14, "Cận Chiến (Kiếm)": 14 },
    equipment: [], items: [], gold: 800, startingHookIds: []
  }
];

