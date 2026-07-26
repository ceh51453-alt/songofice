import type { CanonCharacter } from "../eras";

export const robertsRebellionCharacters: CanonCharacter[] = [
  {
    id: "eddard-stark",
    name: "Eddard Stark",
    tuocVi: "Lãnh Chúa",
    house: "Stark",
    role: "Lãnh Chúa Winterfell",
    religion: "Cựu Thần",
    blurb: "Ned chưa bao giờ mong muốn làm Lãnh chúa. Nhưng cái chết thảm khốc của cha và anh trai đã buộc anh phải lãnh đạo phương Bắc, kết hôn với Catelyn Tully, và cùng người bạn thân Robert Baratheon lật đổ vương triều Targaryen.",
    birthYear: 263,
    age: 19,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 13, "Tinh Tường": 18, "Uy Tín": 12 },
    talentIds: ["honorable", "born-leader", "loyal"],
    skills: { "Chỉ Huy": 15, "Cận Chiến (Kiếm)": 14, "Cưỡi Ngựa": 12 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 30 }, moTa: "Thanh trọng kiếm thép Valyria của Nhà Stark." }],
    items: [],
    gold: 2000, startingHookIds: [],
    startHoldings: ["winterfell"],
    holdingsLevel: { "winterfell": 5 },
    baseIncome: 300,
    startRegions: ["the-north"],
    startArmy: { size: 25000, quality: "Thành Thạo" },
    father: "rickard-stark",
    mother: "lyarra-stark",
    spouse: "catelyn-tully",
    siblings: ["brandon-stark-rebel", "lyanna-stark", "benjen-stark"],
    allies: ["jon-arryn", "robert-baratheon", "hoster-tully"],
    rivals: ["aerys-ii", "rhaegar-targaryen"],
    personalHooks: [
      { id: "ned-south", title: "Hành Trình Xuống Nam", year: "282 AC", numericYear: 282, desc: "Ngươi vượt núi trở về Winterfell để kêu gọi chư hầu, chuẩn bị cho một cuộc chiến không thể tránh khỏi." },
      { id: "tower-of-joy", title: "Tháp Niềm Vui", year: "283 AC", numericYear: 283, desc: "Chiến tranh đã kết thúc, nhưng em gái Lyanna của ngươi vẫn mất tích. Ngươi cùng 6 người bạn tìm đến dải núi Đỏ xứ Dorne." }
    ]
  },
  {
    id: "jon-arryn",
    name: "Jon Arryn",
    tuocVi: "Lãnh Chúa",
    house: "Arryn",
    role: "Lãnh Chúa Eyrie",
    religion: "Thất Diện Thần",
    blurb: "Người cha nuôi của Robert và Ned. Thay vì giao nộp những đứa con nuôi của mình cho Vua Điên, Jon Arryn đã phất cờ khởi nghĩa, châm ngòi cho cuộc chiến định hình lại Westeros.",
    birthYear: 217,
    age: 65,
    coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 8, "Thể Chất": 12, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 15 },
    talentIds: ["honorable", "diplomat", "veteran"],
    skills: { "Chính Trị": 16, "Chỉ Huy": 15, "Ngoại Giao": 18 },
    equipment: [],
    items: [],
    gold: 3000, startingHookIds: [],
    startHoldings: ["the-eyrie"],
    holdingsLevel: { "the-eyrie": 5 },
    baseIncome: 300,
    startRegions: ["the-vale"],
    startArmy: { size: 20000, quality: "Thành Thạo" },
    father: "jasper-arryn",
    spouse: "lysa-tully",
    allies: ["eddard-stark", "robert-baratheon", "hoster-tully"],
    rivals: ["aerys-ii"],
    personalHooks: [
      { id: "arryn-defiance", title: "Khước Từ Lệnh Vua", year: "282 AC", numericYear: 282, desc: "Aerys đòi đầu của Robert và Ned. Ngươi triệu tập các lãnh chúa Vale, thề sẽ bảo vệ những đứa con nuôi của mình." }
    ]
  },
  {
    id: "hoster-tully",
    name: "Hoster Tully",
    tuocVi: "Lãnh Chúa",
    house: "Tully",
    role: "Lãnh Chúa Riverrun",
    religion: "Thất Diện Thần",
    blurb: "Một chính trị gia thực dụng. Hoster Tully chỉ tham gia phe khởi nghĩa sau khi đảm bảo được liên minh hôn nhân kép: Catelyn cho Ned Stark và Lysa cho Jon Arryn.",
    birthYear: 238,
    age: 44,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 13, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    talentIds: ["pragmatic", "diplomat", "ambitious"],
    skills: { "Chính Trị": 15, "Quản Lý": 16, "Ngoại Giao": 14 },
    equipment: [],
    items: [],
    gold: 2500, startingHookIds: [],
    startHoldings: ["riverrun"],
    holdingsLevel: { "riverrun": 5 },
    baseIncome: 350,
    startRegions: ["the-riverlands"],
    startArmy: { size: 15000, quality: "Thành Thạo" },
    spouse: "minisa-whent",
    children: ["catelyn-tully", "lysa-tully", "edmure-tully"],
    allies: ["jon-arryn", "eddard-stark"],
    rivals: ["aerys-ii"],
    personalHooks: [
      { id: "tully-alliance", title: "Cái Giá Của Liên Minh", year: "282 AC", numericYear: 282, desc: "Quân khởi nghĩa cần Riverlands để vượt sông. Ngươi ra điều kiện: Ned và Jon phải cưới con gái của ngươi." }
    ]
  },
  {
    id: "tywin-lannister",
    name: "Tywin Lannister",
    tuocVi: "Lãnh Chúa",
    house: "Lannister",
    role: "Sư Tử Già",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa quyền lực và giàu có bậc nhất. Sau nhiều năm làm Bàn Tay cho Aerys, Tywin đã từ chức vì bị xúc phạm. Ông đóng cửa Casterly Rock chờ xem phe nào có khả năng chiến thắng cao hơn.",
    birthYear: 242,
    age: 40,
    coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 18, "Tinh Tường": 20, "Uy Tín": 16 },
    talentIds: ["cunning", "strategic-mind", "ruthless", "wealthy"],
    skills: { "Chính Trị": 18, "Quản Lý": 20, "Chỉ Huy": 16, "Tài Chính": 20 },
    equipment: [],
    items: [],
    gold: 15000, startingHookIds: [],
    startHoldings: ["casterly-rock"],
    holdingsLevel: { "casterly-rock": 5 },
    baseIncome: 500,
    startRegions: ["the-westerlands"],
    startArmy: { size: 30000, quality: "Tinh Nhuệ" },
    father: "tytos-lannister",
    spouse: "joanna-lannister",
    children: ["jaime-lannister", "cersei-lannister", "tyrion-lannister"],
    rivals: ["aerys-ii"],
    personalHooks: [
      { id: "tywin-wait", title: "Sư Tử Chờ Đợi", year: "282 AC", numericYear: 282, desc: "Ngươi không vội tham chiến. Hãy để những kẻ khác làm suy yếu nhau, nhà Lannister sẽ luôn theo phe chiến thắng." }
    ]
  },
  {
    id: "rhaegar-targaryen",
    name: "Rhaegar Targaryen",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Bạc",
    religion: "Thất Diện Thần",
    blurb: "Đẹp trai, sầu muộn và ám ảnh với những lời tiên tri. Việc anh bắt cóc (hay bỏ trốn cùng) Lyanna Stark đã châm ngòi cho sự sụp đổ của gia tộc Targaryen.",
    birthYear: 259,
    deathYear: 283,
    age: 23,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 16, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 14, "Uy Tín": 18 },
    talentIds: ["handsome", "chivalrous", "mystic", "prophetic"],
    skills: { "Cận Chiến (Kiếm)": 16, "Âm Nhạc": 18, "Thương Kỵ": 18, "Lịch Sử": 15 },
    equipment: [],
    items: [{ ten: "Đàn Hạc Bạc", soLuong: 1, moTa: "Cây đàn hạc có dây bằng bạc." }],
    gold: 2000, startingHookIds: [],
    startHoldings: ["the-crownlands-seat"],
    startRegions: [],
    startArmy: { size: 40000, quality: "Thành Thạo" },
    father: "aerys-ii",
    mother: "rhaella-targaryen",
    spouse: "elia-martell",
    siblings: ["viserys-targaryen", "daenerys-targaryen"],
    children: ["rhaenys-targaryen-daughter", "aegon-targaryen-son"],
    allies: ["arthur-dayne", "jon-connington"],
    rivals: ["robert-baratheon"],
    personalHooks: [
      { id: "rhaegar-trident", title: "Trận Trident", year: "283 AC", numericYear: 283, desc: "Đội quân khởi nghĩa đang ở bờ bắc sông Trident. Ngươi dẫn 4 vạn quân vượt sông để đè bẹp Robert Baratheon." }
    ]
  },
  {
    id: "aerys-ii",
    name: "Aerys II Targaryen",
    tuocVi: "Vua Bảy Vương Quốc",
    house: "Targaryen",
    role: "Vua Điên",
    religion: "Thất Diện Thần",
    blurb: "Sự hoang tưởng đã ăn mòn tâm trí Aerys. Ông tìm thấy niềm vui duy nhất trong việc thiêu sống những kẻ ông cho là phản bội. 'Đốt hết bọn chúng!'",
    birthYear: 244,
    deathYear: 283,
    age: 38,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 12, "Tinh Tường": 6, "Uy Tín": 10 },
    talentIds: ["madness", "cruel", "paranoia"],
    skills: { "Chính Trị": 8, "Lửa Rồng": 10 },
    equipment: [],
    items: [{ ten: "Lửa Hoang", soLuong: 100, moTa: "Những hũ chất lỏng cháy xanh rực." }],
    gold: 10000, startingHookIds: [],
    startHoldings: ["kings-landing"],
    holdingsLevel: { "kings-landing": 5 },
    baseIncome: 500,
    startRegions: ["the-crownlands"],
    startArmy: { size: 10000, quality: "Mới Lập Đội" },
    spouse: "rhaella-targaryen",
    children: ["rhaegar-targaryen", "viserys-targaryen", "daenerys-targaryen"],
    rivals: ["robert-baratheon", "eddard-stark", "jon-arryn", "tywin-lannister"],
    personalHooks: [
      { id: "burn-them-all", title: "Đốt Hết Bọn Chúng", year: "283 AC", numericYear: 283, desc: "Quân Lannister đang cướp bóc thành phố. Kẻ thù ở ngay trong nhà. Ngươi ra lệnh kích nổ Lửa Hoang được giấu khắp thành." }
    ]
  },
  {
    id: "jaime-lannister",
    name: "Jaime Lannister",
    tuocVi: "Hiệp Sĩ",
    house: "Lannister",
    role: "Sư Tử Trẻ",
    religion: "Thất Diện Thần",
    blurb: "Thành viên trẻ nhất từng được phong vào đội Vệ Vương, nhưng bị Aerys giữ lại làm con tin. Jaime sẽ phải đưa ra một quyết định tàn khốc giữa lời thề và gia đình.",
    birthYear: 266,
    age: 16,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 18, "Thể Chất": 15, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 18 },
    talentIds: ["handsome", "prodigy", "arrogant", "chivalrous"],
    skills: { "Cận Chiến (Kiếm)": 18, "Thương Kỵ": 16, "Cưỡi Ngựa": 15 },
    equipment: [],
    items: [],
    gold: 500, startingHookIds: [],
    father: "tywin-lannister",
    mother: "joanna-lannister",
    siblings: ["cersei-lannister", "tyrion-lannister"],
    personalHooks: [
      { id: "kingslayer", title: "Kẻ Thí Vua", year: "283 AC", numericYear: 283, desc: "Aerys ra lệnh đốt cháy thành phố. Ngươi, một Vệ Vương, đứng trước lựa chọn lớn nhất đời mình." }
    ]
  },
  {
    id: "barristan-selmy",
    name: "Barristan Selmy",
    tuocVi: "Hiệp Sĩ",
    house: "Selmy",
    role: "Barristan Cực Đảm",
    religion: "Thất Diện Thần",
    blurb: "Một trong những hiệp sĩ sống vĩ đại nhất, nổi tiếng với sự dũng cảm và lòng trung thành tuyệt đối với ngai vàng.",
    birthYear: 237,
    age: 45,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 16, "Thể Chất": 18, "Trí Tuệ": 12, "Tinh Tường": 18, "Uy Tín": 15 },
    talentIds: ["honorable", "chivalrous", "veteran", "loyal"],
    skills: { "Cận Chiến (Kiếm)": 20, "Thương Kỵ": 18, "Chỉ Huy": 15 },
    equipment: [],
    items: [],
    gold: 200, startingHookIds: [],
    personalHooks: [
      { id: "barristan-trident", title: "Chiến Đấu Vì Vương Triều", year: "283 AC", numericYear: 283, desc: "Ngươi sát cánh cùng Hoàng tử Rhaegar tại sông Trident, quyết tử bảo vệ gia tộc Targaryen." }
    ]
  },
  {
    id: "arthur-dayne",
    name: "Arthur Dayne",
    tuocVi: "Hiệp Sĩ",
    house: "Dayne",
    role: "Thanh Kiếm Buổi Sáng",
    religion: "Thất Diện Thần",
    blurb: "Hiệp sĩ vĩ đại nhất của thời đại, mang thanh kiếm bình minh Dawn. Anh bảo vệ Tháp Niềm Vui theo lệnh của người bạn thân Rhaegar.",
    birthYear: 255,
    deathYear: 283,
    age: 27,
    coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 18, "Thể Chất": 18, "Trí Tuệ": 14, "Tinh Tường": 18, "Uy Tín": 16 },
    talentIds: ["prodigy", "honorable", "chivalrous"],
    skills: { "Cận Chiến (Kiếm)": 20, "Cưỡi Ngựa": 16 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Dawn", phamChat: "Vô Giá", thuocTinh: { "Sát Thương": 35 }, moTa: "Thanh kiếm rèn từ tâm một ngôi sao băng, không kém gì Thép Valyria." }],
    items: [],
    gold: 300, startingHookIds: [],
    personalHooks: [
      { id: "tower-defense", title: "Bảo Vệ Tháp Niềm Vui", year: "283 AC", numericYear: 283, desc: "Chỉ còn ba Vệ Vương đứng trước Tháp Niềm Vui, đối mặt với bảy người phương Bắc." }
    ]
  },
  {
    id: "mace-tyrell",
    name: "Mace Tyrell",
    tuocVi: "Lãnh Chúa",
    house: "Tyrell",
    role: "Lãnh Chúa Highgarden",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa của Reach. Một người thích vinh quang nhưng không có nhiều tài năng quân sự. Ông ta vây hãm Storm's End và mở tiệc suốt ngày đêm.",
    birthYear: 256,
    age: 26,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 14 },
    talentIds: ["wealthy", "proud"],
    skills: { "Chính Trị": 14, "Ngoại Giao": 15 },
    equipment: [],
    items: [],
    gold: 10000, startingHookIds: [],
    startHoldings: ["highgarden"],
    holdingsLevel: { "highgarden": 5 },
    baseIncome: 500,
    startRegions: ["the-reach"],
    startArmy: { size: 60000, quality: "Thành Thạo" },
    father: "luthor-tyrell",
    mother: "olenna-redwyne",
    spouse: "alerie-hightower",
    children: ["willas-tyrell", "garlan-tyrell", "loras-tyrell", "margaery-tyrell"],
    allies: ["rhaegar-targaryen", "aerys-ii"],
    personalHooks: [
      { id: "mace-siege", title: "Vây Hãm Storm's End", year: "282 AC", numericYear: 282, desc: "Quân đội của Reach rất lớn. Việc vây hãm lâu đài chỉ là vấn đề thời gian." }
    ]
  },
  {
    id: "randyll-tarly",
    name: "Randyll Tarly",
    tuocVi: "Lãnh Chúa",
    house: "Tarly",
    role: "Chỉ Huy Tiên Phong",
    religion: "Thất Diện Thần",
    blurb: "Người chỉ huy quân sự xuất sắc nhất của Reach. Randyll là người duy nhất đã đánh bại Robert Baratheon trong suốt cuộc chiến tại trận Ashford.",
    birthYear: 244,
    age: 38,
    coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 14, "Thể Chất": 16, "Trí Tuệ": 15, "Tinh Tường": 18, "Uy Tín": 12 },
    talentIds: ["strict", "fearsome-warrior", "strategic-mind"],
    skills: { "Chỉ Huy": 18, "Cận Chiến (Kiếm)": 16, "Chiến Lược": 18 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Heartsbane", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 25 }, moTa: "Thanh trọng kiếm Thép Valyria của Nhà Tarly." }],
    items: [],
    gold: 800, startingHookIds: [],
    personalHooks: [
      { id: "tarly-ashford", title: "Trận Ashford", year: "282 AC", numericYear: 282, desc: "Ngươi dẫn đội tiên phong phe Trung Quân giáp mặt Robert Baratheon." }
    ]
  },
  {
    id: "doran-martell",
    name: "Doran Martell",
    tuocVi: "Vương Thân",
    house: "Martell",
    role: "Người Cai Trị Dorne",
    religion: "Thất Diện Thần",
    blurb: "Một người đàn ông cẩn trọng và điềm đạm. Doran không muốn can dự vào cuộc chiến, nhưng Aerys đang giữ em gái Elia của ông làm con tin.",
    birthYear: 247,
    age: 35,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 15 },
    talentIds: ["cautious", "strategic-mind", "crippled"],
    skills: { "Chính Trị": 18, "Ngoại Giao": 16, "Kế Hoạch": 18 },
    equipment: [],
    items: [],
    gold: 3000, startingHookIds: [],
    startHoldings: ["sunspear"],
    holdingsLevel: { "sunspear": 5 },
    baseIncome: 300,
    startRegions: ["dorne"],
    startArmy: { size: 10000, quality: "Thành Thạo" },
    siblings: ["elia-martell", "oberyn-martell"],
    spouse: "mellario-of-norvos",
    children: ["arianne-martell", "quentyn-martell", "trystane-martell"],
    personalHooks: [
      { id: "doran-waiting", title: "Gửi Quân Miễn Cưỡng", year: "283 AC", numericYear: 283, desc: "Dù tức giận vì Rhaegar phản bội Elia, ngươi vẫn phải gửi 1 vạn lính giáo Dorne lên chiến đấu." }
    ]
  },
  {
    id: "oberyn-martell",
    name: "Oberyn Martell",
    tuocVi: "Vương Thân",
    house: "Martell",
    role: "Rắn Hổ Mang Đỏ",
    religion: "Thất Diện Thần",
    blurb: "Nổi loạn, nguy hiểm và đam mê. Oberyn là một chiến binh giỏi độc dược, luôn khao khát trả thù cho em gái Elia nếu có mệnh hệ gì.",
    birthYear: 258,
    age: 24,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 18, "Thể Chất": 15, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 16 },
    talentIds: ["agile", "poisoner", "vengeful", "fearsome-warrior"],
    skills: { "Cận Chiến (Giáo)": 18, "Độc Dược": 18, "Quyến Rũ": 15 },
    equipment: [],
    items: [{ ten: "Độc Manticore", soLuong: 1, moTa: "Chất độc chết người." }],
    gold: 1000, startingHookIds: [],
    personalHooks: []
  },
  {
    id: "balon-greyjoy",
    name: "Balon Greyjoy",
    tuocVi: "Lãnh Chúa",
    house: "Greyjoy",
    role: "Người Thừa Kế Pyke",
    religion: "Thần Chết Chìm",
    blurb: "Gia tộc Greyjoy đứng ngoài cuộc chiến phần lớn thời gian, cho đến khi kết quả đã an bài. Balon ôm ấp mộng tưởng phục hưng Luật Lệ Cũ (Old Way).",
    birthYear: 255,
    age: 27,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 16, "Uy Tín": 12 },
    talentIds: ["ironborn", "stubborn", "proud"],
    skills: { "Hàng Hải": 16, "Cướp Bóc": 15, "Cận Chiến (Rìu)": 12 },
    equipment: [],
    items: [],
    gold: 500, startingHookIds: [],
    startHoldings: ["pyke"],
    holdingsLevel: { "pyke": 5 },
    baseIncome: 250,
    startRegions: ["the-iron-islands"],
    startArmy: { size: 10000, quality: "Thành Thạo" },
    father: "quellon-greyjoy",
    spouse: "alannys-harlaw",
    children: ["rodrik-greyjoy", "maron-greyjoy", "asha-greyjoy", "theon-greyjoy"],
    siblings: ["euron-greyjoy", "victarion-greyjoy", "aeron-greyjoy"],
    personalHooks: []
  },
  {
    id: "stannis-baratheon",
    name: "Stannis Baratheon",
    tuocVi: "Lãnh Chúa",
    house: "Baratheon",
    role: "Chỉ Huy Storm's End",
    religion: "Thất Diện Thần",
    blurb: "Cứng nhắc, công bằng và không có tình thương. Stannis đã chịu đựng vòng vây của quân Tyrell tại Storm's End suốt hơn một năm, phải ăn thịt chuột và đế giày.",
    birthYear: 264,
    age: 18,
    coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 10, "Thể Chất": 18, "Trí Tuệ": 14, "Tinh Tường": 20, "Uy Tín": 8 },
    talentIds: ["stubborn", "just", "resilient"],
    skills: { "Chỉ Huy": 16, "Sinh Tồn": 15, "Chiến Lược": 15 },
    equipment: [],
    items: [],
    gold: 100, startingHookIds: [],
    father: "steffon-baratheon",
    mother: "cassana-estermont",
    spouse: "selyse-florent",
    siblings: ["robert-baratheon", "renly-baratheon"],
    personalHooks: [
      { id: "stannis-siege", title: "Cơn Đói Tại Storm's End", year: "283 AC", numericYear: 283, desc: "Ngươi đã vây hãm suốt một năm. Lương thực đã cạn. Liệu ngươi sẽ đầu hàng hay chết đói?" }
    ]
  },
  {
    id: "renly-baratheon",
    name: "Renly Baratheon",
    tuocVi: "Lãnh Chúa",
    house: "Baratheon",
    role: "Cậu Bé Storm's End",
    religion: "Thất Diện Thần",
    blurb: "Em út của Robert và Stannis. Trong suốt cuộc chiến, Renly chỉ là một cậu bé trải qua cơn đói khát khủng khiếp tại lâu đài Storm's End.",
    birthYear: 277,
    age: 5,
    coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 10, "Tinh Tường": 8, "Uy Tín": 14 },
    talentIds: ["handsome", "innocent"],
    skills: { "Thuyết Phục": 8 },
    equipment: [],
    items: [],
    gold: 0, startingHookIds: [],
    father: "steffon-baratheon",
    mother: "cassana-estermont",
    siblings: ["robert-baratheon", "stannis-baratheon"],
    personalHooks: []
  },
  {
    id: "elia-martell", name: "Elia Martell", tuocVi: "Vương phi", house: "Martell", role: "Vợ Của Rhaegar", religion: "Thất Diện Thần",
    blurb: "Sức khỏe yếu ớt nhưng mang dòng máu vương giả Dorne. Cô bị giam lỏng ở Red Keep cùng hai con nhỏ.",
    birthYear: 256, age: 26, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 5, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 15 },
    talentIds: ["gentle", "beloved"], skills: { "Chính Trị": 12, "Ngoại Giao": 15 },
    equipment: [], items: [], gold: 1000, startingHookIds: [],
    spouse: "rhaegar-targaryen",
    children: ["rhaenys-targaryen-daughter", "aegon-targaryen-son"],
    siblings: ["doran-martell", "oberyn-martell"]
  },
  {
    id: "rhaella-targaryen", name: "Rhaella Targaryen", tuocVi: "Vương Hậu", house: "Targaryen", role: "Hoàng Hậu Đau Khổ", religion: "Thất Diện Thần",
    blurb: "Vợ và em gái của Vua Điên. Bà phải chịu đựng sự lạm dụng của chồng trong nhiều năm.",
    birthYear: 245, age: 37, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 13, "Tinh Tường": 18, "Uy Tín": 14 },
    talentIds: ["resilient", "gentle"], skills: { "Chính Trị": 10, "Ngoại Giao": 10 },
    equipment: [], items: [], gold: 500, startingHookIds: [],
    spouse: "aerys-ii",
    children: ["rhaegar-targaryen", "viserys-targaryen", "daenerys-targaryen"]
  },
  {
    id: "catelyn-tully", name: "Catelyn Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Ned", religion: "Thất Diện Thần",
    blurb: "Được hứa hôn với Brandon Stark, nhưng sau khi anh chết, cô kết hôn với em trai anh là Ned để củng cố liên minh.",
    birthYear: 264, age: 18, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 15 },
    talentIds: ["stubborn", "loyal", "dutiful"], skills: { "Chính Trị": 14, "Ngoại Giao": 14, "Quản Lý": 15 },
    equipment: [], items: [], gold: 800, startingHookIds: [],
    father: "hoster-tully",
    mother: "minisa-whent",
    spouse: "eddard-stark",
    siblings: ["lysa-tully", "edmure-tully"]
  },
  {
    id: "lysa-tully", name: "Lysa Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Jon Arryn", religion: "Thất Diện Thần",
    blurb: "Bị ép kết hôn với một người đáng tuổi ông mình để đổi lấy quân đội của Vale.",
    birthYear: 266, age: 16, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 7, "Thể Chất": 6, "Trí Tuệ": 12, "Tinh Tường": 8, "Uy Tín": 13 },
    talentIds: ["paranoia", "jealous"], skills: { "Chính Trị": 10 },
    equipment: [], items: [], gold: 800, startingHookIds: [],
    father: "hoster-tully",
    mother: "minisa-whent",
    spouse: "jon-arryn",
    siblings: ["catelyn-tully", "edmure-tully"]
  },
  {
    id: "roose-bolton-robert", name: "Roose Bolton", tuocVi: "Lãnh Chúa", house: "Bolton", role: "Lãnh Chúa Dreadfort", religion: "Cựu Thần",
    blurb: "Lạnh lùng và điềm tĩnh, Roose tham gia cuộc khởi nghĩa dưới ngọn cờ của nhà Stark.",
    birthYear: 255, age: 27, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 12 },
    talentIds: ["schemer", "ruthless"], skills: { "Chỉ Huy": 15, "Chiến Lược": 14 },
    equipment: [], items: [], gold: 1000, startingHookIds: []
  },
  {
    id: "jon-connington", name: "Jon Connington", tuocVi: "Lãnh Chúa", house: "Connington", role: "Bàn Tay Của Aerys", religion: "Thất Diện Thần",
    blurb: "Một hiệp sĩ kiêu hãnh và là bạn thân của Rhaegar. Được phong làm Bàn Tay Nhà Vua để tiêu diệt quân khởi nghĩa.",
    birthYear: 260, age: 22, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: ["proud", "loyal"], skills: { "Chỉ Huy": 14, "Cận Chiến (Kiếm)": 15 },
    equipment: [], items: [], gold: 1200, startingHookIds: []
  },
  {
    id: "viserys-targaryen", name: "Viserys Targaryen", tuocVi: "Hoàng Tử", house: "Targaryen", role: "Người Kế Vị Chờ Đợi", religion: "Thất Diện Thần",
    blurb: "Con trai thứ của Vua Điên. Khi chiến tranh nổ ra, cậu chỉ là một đứa trẻ sợ hãi, không biết tương lai lưu vong đang chờ đợi.",
    birthYear: 276, age: 6, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 5, "Thể Chất": 4, "Trí Tuệ": 10, "Tinh Tường": 8, "Uy Tín": 12 },
    talentIds: ["arrogant", "madness"], skills: { "Thuyết Phục": 6 },
    equipment: [], items: [], gold: 200, startingHookIds: []
  },
  {
    id: "gerold-hightower", name: "Gerold Hightower", tuocVi: "Hiệp Sĩ", house: "Hightower", role: "Bò Trắng", religion: "Thất Diện Thần",
    blurb: "Tư lệnh đội Vệ Vương. To lớn, trung thành tuyệt đối, ông sát cánh cùng Arthur Dayne bảo vệ Tháp Niềm Vui.",
    birthYear: 225, age: 57, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 14, "Tinh Tường": 18, "Uy Tín": 14 },
    talentIds: ["giant-frame", "loyal", "veteran"], skills: { "Cận Chiến (Kiếm)": 18, "Chỉ Huy": 16 },
    equipment: [], items: [], gold: 300, startingHookIds: []
  },
  {
    id: "oswell-whent", name: "Oswell Whent", tuocVi: "Hiệp Sĩ", house: "Whent", role: "Hiệp Sĩ Vệ Vương", religion: "Thất Diện Thần",
    blurb: "Nổi bật với chiếc mũ giáp hình con dơi đen. Ông là người thứ ba bảo vệ Tháp Niềm Vui.",
    birthYear: 245, age: 37, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 12 },
    talentIds: ["loyal"], skills: { "Cận Chiến (Kiếm)": 16 },
    equipment: [], items: [], gold: 200, startingHookIds: []
  },
  {
    id: "richard-lonmouth", name: "Richard Lonmouth", tuocVi: "Hiệp Sĩ", house: "Lonmouth", role: "Hiệp Sĩ Hộp Sọ", religion: "Thất Diện Thần",
    blurb: "Bạn thân và từng là giám mã của Rhaegar Targaryen, có mặt tại giải đấu Harrenhal định mệnh.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    talentIds: ["loyal"], skills: { "Cận Chiến (Kiếm)": 14 },
    equipment: [], items: [], gold: 400, startingHookIds: []
  },
  {
    id: "robert-baratheon", name: "Robert Baratheon", tuocVi: "Lãnh Chúa", house: "Baratheon", role: "Chúa Tể Bão Tố", religion: "Thất Diện Thần", blurb: "Người chỉ huy cuộc khởi nghĩa mang tên mình, cao lớn, hung bạo và khao khát trả thù cho Lyanna.",
    birthYear: 262, age: 20, coreStats: { "Sức Mạnh": 20, "Nhanh Nhẹn": 14, "Thể Chất": 18, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 18 },
    talentIds: ["fearsome-warrior", "beloved", "hot-tempered"], skills: { "Cận Chiến (Rìu)": 20, "Chỉ Huy": 16 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa chiến của Robert", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương": 25 }, moTa: "Cây búa chiến khổng lồ mà chỉ Robert mới vung nổi." }],
    items: [], gold: 1500, startingHookIds: [], startHoldings: ["the-stormlands-seat"], holdingsLevel: { "the-stormlands-seat": 5 }, baseIncome: 400, startRegions: ["the-stormlands"], startArmy: { size: 25000, quality: "Thành Thạo" },
    father: "steffon-baratheon", mother: "cassana-estermont", siblings: ["stannis-baratheon", "renly-baratheon"], allies: ["eddard-stark", "jon-arryn"], rivals: ["rhaegar-targaryen", "aerys-ii"]
  },
  {
    id: "steffon-baratheon", name: "Steffon Baratheon", tuocVi: "Cố Lãnh Chúa", house: "Baratheon", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Robert, Stannis, và Renly. Chết trong bão biển tại Vịnh Đắm Tàu.",
    birthYear: 246, deathYear: 278, age: 32, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 14 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "cassana-estermont"
  },
  {
    id: "cassana-estermont", name: "Cassana Estermont", tuocVi: "Tiểu Thư", house: "Estermont", role: "Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ của Steffon Baratheon. Cùng tử nạn với chồng trên tàu Windproud.",
    birthYear: 248, deathYear: 278, age: 30, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "steffon-baratheon"
  },
  {
    id: "selyse-florent", name: "Selyse Florent", tuocVi: "Tiểu Thư", house: "Florent", role: "Vợ Của Stannis", religion: "Thất Diện Thần", blurb: "Vợ của Stannis Baratheon, lạnh nhạt và có phần khắc khổ.",
    birthYear: 265, age: 17, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "stannis-baratheon"
  },
  {
    id: "rickard-stark", name: "Rickard Stark", tuocVi: "Cố Lãnh Chúa", house: "Stark", role: "Cố Lãnh Chúa", religion: "Cựu Thần", blurb: "Bị Vua Aerys thiêu sống bằng Lửa Hoang trong bộ giáp của mình.",
    birthYear: 235, deathYear: 282, age: 47, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "lyarra-stark"
  },
  {
    id: "lyarra-stark", name: "Lyarra Stark", tuocVi: "Phu Nhân", house: "Stark", role: "Cố Phu Nhân", religion: "Cựu Thần", blurb: "Mẹ của Brandon, Ned, Lyanna, và Benjen.",
    birthYear: 240, deathYear: 279, age: 39, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "rickard-stark"
  },
  {
    id: "brandon-stark-rebel", name: "Brandon Stark", tuocVi: "Người Thừa Kế", house: "Stark", role: "Người Thừa Kế Đã Chết", religion: "Cựu Thần", blurb: "Sói hoang. Bị thắt cổ đến chết khi cố cứu cha mình.",
    birthYear: 262, deathYear: 282, age: 20, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 15, "Thể Chất": 16, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 14 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark"
  },
  {
    id: "lyanna-stark", name: "Lyanna Stark", tuocVi: "Tiểu Thư", house: "Stark", role: "Sói Nữ", religion: "Cựu Thần", blurb: "Em gái Ned, vị hôn thê của Robert. Nguyên nhân của cuộc khởi nghĩa.",
    birthYear: 266, deathYear: 283, age: 16, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 16, "Thể Chất": 12, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 16 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark"
  },
  {
    id: "benjen-stark", name: "Benjen Stark", tuocVi: "Thường Dân", house: "Stark", role: "Em Út", religion: "Cựu Thần", blurb: "Sói nhỏ nhất nhà Stark, ở lại Winterfell trong thời chiến.",
    birthYear: 267, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark"
  },
  {
    id: "jasper-arryn", name: "Jasper Arryn", tuocVi: "Cố Lãnh Chúa", house: "Arryn", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Jon Arryn.",
    birthYear: 195, deathYear: 260, age: 65, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: []
  },
  {
    id: "minisa-whent", name: "Minisa Whent", tuocVi: "Tiểu Thư", house: "Whent", role: "Cố Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ quá cố của Hoster Tully, mẹ của Catelyn, Lysa, Edmure.",
    birthYear: 242, deathYear: 275, age: 33, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "hoster-tully"
  },
  {
    id: "edmure-tully", name: "Edmure Tully", tuocVi: "Người Thừa Kế", house: "Tully", role: "Người Thừa Kế Riverrun", religion: "Thất Diện Thần", blurb: "Con trai duy nhất của Hoster Tully, em trai của Catelyn và Lysa.",
    birthYear: 267, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 12, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 14 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "hoster-tully", mother: "minisa-whent"
  },
  {
    id: "tytos-lannister", name: "Tytos Lannister", tuocVi: "Cố Lãnh Chúa", house: "Lannister", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Tywin. Lãnh chúa yếu kém đã làm suy giảm uy tín của nhà Lannister.",
    birthYear: 220, deathYear: 267, age: 47, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: []
  },
  {
    id: "joanna-lannister", name: "Joanna Lannister", tuocVi: "Phu Nhân", house: "Lannister", role: "Cố Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ của Tywin. Qua đời khi sinh Tyrion.",
    birthYear: 246, deathYear: 273, age: 27, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "tywin-lannister"
  },
  {
    id: "cersei-lannister", name: "Cersei Lannister", tuocVi: "Tiểu Thư", house: "Lannister", role: "Tiểu Thư Casterly Rock", religion: "Thất Diện Thần", blurb: "Chị sinh đôi của Jaime. Xinh đẹp, đầy tham vọng và kiêu hãnh.",
    birthYear: 266, age: 16, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 18 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 1000, startingHookIds: [], father: "tywin-lannister", mother: "joanna-lannister", siblings: ["jaime-lannister", "tyrion-lannister"]
  },
  {
    id: "tyrion-lannister", name: "Tyrion Lannister", tuocVi: "Người Lùn", house: "Lannister", role: "Quỷ Lùn", religion: "Thất Diện Thần", blurb: "Con trai út của Tywin. Bị cha căm ghét vì hình hài và việc cái chết của mẹ.",
    birthYear: 273, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 6, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 500, startingHookIds: [], father: "tywin-lannister", mother: "joanna-lannister", siblings: ["jaime-lannister", "cersei-lannister"]
  },
  {
    id: "luthor-tyrell", name: "Luthor Tyrell", tuocVi: "Cố Lãnh Chúa", house: "Tyrell", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Mace Tyrell, vô tình lao xuống vách đá trong một cuộc đi săn.",
    birthYear: 230, deathYear: 280, age: 50, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "olenna-redwyne"
  },
  {
    id: "olenna-redwyne", name: "Olenna Redwyne", tuocVi: "Phu Nhân", house: "Tyrell", role: "Nữ Hoàng Gai", religion: "Thất Diện Thần", blurb: "Mẹ của Mace Tyrell. Người thực sự điều hành nhà Tyrell với trí tuệ sắc sảo.",
    birthYear: 228, age: 54, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 18, "Uy Tín": 16 },
    talentIds: ["schemer", "cunning"], skills: { "Chính Trị": 18, "Ngoại Giao": 15 }, equipment: [], items: [], gold: 1000, startingHookIds: [], spouse: "luthor-tyrell"
  },
  {
    id: "alerie-hightower", name: "Alerie Hightower", tuocVi: "Phu Nhân", house: "Tyrell", role: "Vợ Của Mace", religion: "Thất Diện Thần", blurb: "Vợ của Mace Tyrell.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 14 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "mace-tyrell"
  },
  {
    id: "willas-tyrell", name: "Willas Tyrell", tuocVi: "Người Thừa Kế", house: "Tyrell", role: "Người Thừa Kế Highgarden", religion: "Thất Diện Thần", blurb: "Con trai trưởng của Mace. Cậu bé chăm học, hiền lành.",
    birthYear: 275, age: 7, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower"
  },
  {
    id: "garlan-tyrell", name: "Garlan Tyrell", tuocVi: "Hiệp Sĩ", house: "Tyrell", role: "Con Trai Thứ", religion: "Thất Diện Thần", blurb: "Con trai thứ hai của Mace.",
    birthYear: 277, age: 5, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower"
  },
  {
    id: "loras-tyrell", name: "Loras Tyrell", tuocVi: "Thường Dân", house: "Tyrell", role: "Hiệp Sĩ Hoa", religion: "Thất Diện Thần", blurb: "Con trai thứ ba, hiện chỉ là một em bé.",
    birthYear: 282, age: 0, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower"
  },
  {
    id: "margaery-tyrell", name: "Margaery Tyrell", tuocVi: "Tiểu Thư", house: "Tyrell", role: "Con Gái Mace", religion: "Thất Diện Thần", blurb: "Con gái út của nhà Tyrell, mới ra đời.",
    birthYear: 283, age: 0, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower"
  },
  {
    id: "quellon-greyjoy", name: "Quellon Greyjoy", tuocVi: "Lãnh Chúa", house: "Greyjoy", role: "Lãnh Chúa Quần Đảo Sắt", religion: "Thần Chết Chìm", blurb: "Cha của Balon. Lãnh chúa sáng suốt đã cố gắng hòa nhập Quần Đảo Sắt với đất liền. Chết trong trận chiến Mander cuối cuộc nổi loạn.",
    birthYear: 225, deathYear: 283, age: 58, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    talentIds: ["wise", "peacemaker"], skills: { "Hàng Hải": 18, "Chính Trị": 14 }, equipment: [], items: [], gold: 1000, startingHookIds: []
  },
  {
    id: "euron-greyjoy", name: "Euron Greyjoy", tuocVi: "Thuyền Trưởng", house: "Greyjoy", role: "Mắt Quạ", religion: "Thần Chết Chìm", blurb: "Em trai tàn nhẫn của Balon.",
    birthYear: 256, age: 26, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 15 },
    talentIds: ["ruthless", "cunning", "mystic"], skills: { "Hàng Hải": 18, "Phép Thuật": 10 }, equipment: [], items: [], gold: 500, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "victarion-greyjoy", "aeron-greyjoy"]
  },
  {
    id: "victarion-greyjoy", name: "Victarion Greyjoy", tuocVi: "Thuyền Trưởng", house: "Greyjoy", role: "Tướng Tiên Phong", religion: "Thần Chết Chìm", blurb: "Chiến binh mạnh mẽ và trung thành, em trai Balon.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 18, "Trí Tuệ": 8, "Tinh Tường": 10, "Uy Tín": 12 },
    talentIds: ["fearsome-warrior", "loyal", "stubborn"], skills: { "Cận Chiến (Rìu)": 18, "Hàng Hải": 15 }, equipment: [], items: [], gold: 200, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "euron-greyjoy", "aeron-greyjoy"]
  },
  {
    id: "aeron-greyjoy", name: "Aeron Greyjoy", tuocVi: "Thường Dân", house: "Greyjoy", role: "Em Út Quellon", religion: "Thần Chết Chìm", blurb: "Em út của Balon, trong thời gian này còn trẻ và nông nổi.",
    birthYear: 269, age: 13, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "euron-greyjoy", "victarion-greyjoy"]
  },
  {
    id: "alannys-harlaw", name: "Alannys Harlaw", tuocVi: "Phu Nhân", house: "Greyjoy", role: "Vợ Của Balon", religion: "Thần Chết Chìm", blurb: "Vợ của Balon Greyjoy.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "balon-greyjoy"
  },
  {
    id: "rodrik-greyjoy", name: "Rodrik Greyjoy", tuocVi: "Người Thừa Kế", house: "Greyjoy", role: "Con Cả Balon", religion: "Thần Chết Chìm", blurb: "Con trai trưởng của Balon.",
    birthYear: 275, age: 7, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 8, "Tinh Tường": 8, "Uy Tín": 8 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw"
  },
  {
    id: "maron-greyjoy", name: "Maron Greyjoy", tuocVi: "Con Trai Thứ", house: "Greyjoy", role: "Con Trai Thứ Balon", religion: "Thần Chết Chìm", blurb: "Con trai thứ hai của Balon.",
    birthYear: 277, age: 5, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 6, "Tinh Tường": 6, "Uy Tín": 6 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw"
  },
  {
    id: "asha-greyjoy", name: "Asha Greyjoy", tuocVi: "Tiểu Thư", house: "Greyjoy", role: "Con Gái Balon", religion: "Thần Chết Chìm", blurb: "Con gái của Balon, mới tập bò.",
    birthYear: 279, age: 3, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw"
  },
  {
    id: "theon-greyjoy", name: "Theon Greyjoy", tuocVi: "Con Út", house: "Greyjoy", role: "Con Út Balon", religion: "Thần Chết Chìm", blurb: "Con trai út của Balon.",
    birthYear: 281, age: 1, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 2, "Thể Chất": 2, "Trí Tuệ": 2, "Tinh Tường": 2, "Uy Tín": 2 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw"
  },
  {
    id: "rhaenys-targaryen-daughter", name: "Rhaenys Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Con Gái Rhaegar", religion: "Thất Diện Thần", blurb: "Con gái của Rhaegar và Elia, thích ôm chú mèo đen Balerion.",
    birthYear: 280, deathYear: 283, age: 2, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 4, "Thể Chất": 2, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 6 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "rhaegar-targaryen", mother: "elia-martell"
  },
  {
    id: "aegon-targaryen-son", name: "Aegon Targaryen (Trẻ sơ sinh)", tuocVi: "Hoàng Tử", house: "Targaryen", role: "Con Trai Rhaegar", religion: "Thất Diện Thần", blurb: "Con trai mới sinh của Rhaegar và Elia.",
    birthYear: 282, deathYear: 283, age: 0, coreStats: { "Sức Mạnh": 1, "Nhanh Nhẹn": 1, "Thể Chất": 1, "Trí Tuệ": 1, "Tinh Tường": 1, "Uy Tín": 4 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "rhaegar-targaryen", mother: "elia-martell"
  },
  {
    id: "mellario-of-norvos", name: "Mellario", tuocVi: "Phu Nhân", house: "Martell", role: "Vợ Của Doran", religion: "Thần Râu", blurb: "Vợ của Doran Martell, đến từ Norvos.",
    birthYear: 250, age: 32, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], spouse: "doran-martell"
  },
  {
    id: "arianne-martell", name: "Arianne Martell", tuocVi: "Người Thừa Kế", house: "Martell", role: "Con Gái Doran", religion: "Thất Diện Thần", blurb: "Con gái lớn của Doran.",
    birthYear: 276, age: 6, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos"
  },
  {
    id: "quentyn-martell", name: "Quentyn Martell", tuocVi: "Vương Tôn", house: "Martell", role: "Con Trai Doran", religion: "Thất Diện Thần", blurb: "Con trai trưởng của Doran.",
    birthYear: 281, age: 1, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 2, "Thể Chất": 2, "Trí Tuệ": 2, "Tinh Tường": 2, "Uy Tín": 2 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos"
  },
  {
    id: "trystane-martell", name: "Trystane Martell", tuocVi: "Vương Tôn", house: "Martell", role: "Con Út Doran", religion: "Thất Diện Thần", blurb: "Con trai út của Doran.",
    birthYear: 283, age: 0, coreStats: { "Sức Mạnh": 1, "Nhanh Nhẹn": 1, "Thể Chất": 1, "Trí Tuệ": 1, "Tinh Tường": 1, "Uy Tín": 1 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos"
  }
];
