import type { CanonCharacter } from "../eras";

export const robertsRebellionCharacters: CanonCharacter[] = [
  {
    id: "eddard-stark",
    name: "Eddard Stark",
    tuocVi: "Đại Lãnh Chúa",
    house: "Stark",
    role: "Lãnh Chúa Winterfell",
    religion: "Cựu Thần",
    blurb: "Ned chưa bao giờ mong muốn làm Lãnh chúa. Nhưng cái chết thảm khốc của cha và anh trai đã buộc anh phải lãnh đạo phương Bắc, kết hôn với Catelyn Tully, và cùng người bạn thân Robert Baratheon lật đổ vương triều Targaryen.",
    birthYear: 263,
    age: 19,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 13, "Tinh Tường": 18, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 60, "Trí Mưu": 65, "Ngoại Giao": 90 },
    talentIds: ["warrior-blood", "commander-instinct", "beloved"],
    skills: { "command": 8, "sword-shield": 7, "war-riding": 6 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 30 }, moTa: "Thanh trọng kiếm thép Valyria của Nhà Stark." }],
    items: [],
    gold: 8000,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 300,
      "Đá": 600,
      "Lương Thực": 2000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
      { name: "Đội Tiên Phong Phương Bắc", type: "Kỵ Binh Nhẹ", size: 3000, quality: "Thành Thạo" },
      { name: "Trung Quân Winterfell", type: "Bộ Binh", size: 17000, quality: "Thành Thạo" },
      { name: "Cấm Vệ Mùa Đông", type: "Bộ Binh", size: 5000, quality: "Tinh Nhuệ" }
    ],
          startRegions: ["the-north"],
      startHoldings: ["the-north-seat"],
      holdingsLevel: {"the-north-seat": 5},
      baseIncome: 400,
father: "rickard-stark",
    mother: "lyarra-stark",
    spouse: "catelyn-tully",
    siblings: ["brandon-stark-rebel", "lyanna-stark", "benjen-stark"],
    allies: ["robert-baratheon", "jon-arryn", "hoster-tully"],
    rivals: ["aerys-ii", "tywin-lannister"],
    personalHooks: [
      { id: "ned-south", title: "Hành Trình Xuống Nam", year: "282 AC", numericYear: 282, desc: "Ngươi vượt núi trở về Winterfell để kêu gọi chư hầu, chuẩn bị cho một cuộc chiến không thể tránh khỏi." },
      { id: "tower-of-joy", title: "Tháp Niềm Vui", year: "283 AC", numericYear: 283, desc: "Chiến tranh đã kết thúc, nhưng em gái Lyanna của ngươi vẫn mất tích. Ngươi cùng 6 người bạn tìm đến dải núi Đỏ xứ Dorne." }
    ],
    children: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark", "jon-snow"],
    relationshipDetails: {
      "robert-baratheon": { type: "Bằng Hữu", trust: 100, affinity: 100, detail: "Anh em kết nghĩa từ thời còn ở Eyrie, cùng nhau chia ngọt sẻ bùi." },
      "catelyn-tully": { type: "Vợ", trust: 90, affinity: 80, detail: "Kết hôn vì nghĩa vụ thay anh trai, nhưng dần nảy sinh tình yêu sâu đậm." },
      "jon-snow": { type: "Con Cái", trust: 100, affinity: 100, detail: "Nuôi nấng như con ruột để bảo vệ lời hứa với Lyanna, dù phải mang tiếng xấu là có con hoang." },
      "lyanna-stark": { type: "Anh Chị Em", trust: 100, affinity: 100, detail: "Cô em gái yêu quý, người mà Ned đã hứa sẽ bảo vệ đứa con của cô bằng mọi giá." }
    },
},
  {
    id: "jon-arryn",
    name: "Jon Arryn",
    tuocVi: "Đại Lãnh Chúa",
    house: "Arryn",
    role: "Lãnh Chúa Eyrie",
    religion: "Thất Diện Thần",
    blurb: "Người cha nuôi của Robert và Ned. Thay vì giao nộp những đứa con nuôi của mình cho Vua Điên, Jon Arryn đã phất cờ khởi nghĩa, châm ngòi cho cuộc chiến định hình lại Westeros.",
    birthYear: 217,
    age: 65,
    coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 8, "Thể Chất": 12, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 80, "Ngoại Giao": 80 },
    talentIds: ["warrior-blood", "silver-tongue", "keen-eye"],
    skills: { "cunning": 8, "command": 8, "persuasion": 9 },
    equipment: [],
    items: [],
    gold: 3000,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 375,
      "Đá": 2000,
      "Lương Thực": 2000,
      "Ngựa": 120,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Bộ Binh Eyrie", type: "Bộ Binh", size: 12000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Thung Lũng", type: "Kỵ Binh", size: 4000, quality: "Thành Thạo" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 4000, quality: "Thành Thạo" }
        ],
          startRegions: ["the-vale"],
      startHoldings: ["the-vale-seat"],
      holdingsLevel: {"the-vale-seat": 5},
      baseIncome: 400,
father: "jasper-arryn",
    spouse: "lysa-tully",
    allies: ["eddard-stark", "robert-baratheon"],
    rivals: ["aerys-ii"],
    relationshipDetails: {
      "eddard-stark": { type: "Con Nuôi", trust: 100, affinity: 100, detail: "Ned lớn lên ở Eyrie dưới sự dạy dỗ của Jon. Ông coi Ned như con đẻ." },
      "robert-baratheon": { type: "Con Nuôi", trust: 100, affinity: 90, detail: "Robert lớn lên cùng Ned ở Eyrie. Jon yêu thương Robert nhưng lo lắng về tính nóng nảy của cậu." },
      "aerys-ii": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Aerys đòi đầu của hai đứa con nuôi. Jon không bao giờ tha thứ được cho điều đó." }
    },
    personalHooks: [
      { id: "arryn-defiance", title: "Khước Từ Lệnh Vua", year: "282 AC", numericYear: 282, desc: "Aerys đòi đầu của Robert và Ned. Ngươi triệu tập các lãnh chúa Vale, thề sẽ bảo vệ những đứa con nuôi của mình." }
    ],
    mother: "",
    children: ["robert-arryn"],
    siblings: [],
},
  {
    id: "hoster-tully",
    name: "Hoster Tully",
    tuocVi: "Đại Lãnh Chúa",
    house: "Tully",
    role: "Lãnh Chúa Riverrun",
    religion: "Thất Diện Thần",
    blurb: "Một chính trị gia thực dụng. Hoster Tully chỉ tham gia phe khởi nghĩa sau khi đảm bảo được liên minh hôn nhân kép: Catelyn cho Ned Stark và Lysa cho Jon Arryn.",
    birthYear: 238,
    age: 44,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 13, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["strategist", "silver-tongue", "schemer"],
    skills: { "cunning": 8, "court-etiquette": 8, "persuasion": 7 },
    equipment: [],
    items: [],
    gold: 2500,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 200,
      "Đá": 500,
      "Lương Thực": 5000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Dân Binh Riverlands", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sông Nhánh", type: "Kỵ Binh", size: 3000, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 3000, quality: "Thành Thạo" }
        ],
          startRegions: ["the-riverlands"],
      startHoldings: ["the-riverlands-seat"],
      holdingsLevel: {"the-riverlands-seat": 5},
      baseIncome: 450,
spouse: "minisa-whent",
    children: ["catelyn-tully", "lysa-tully", "edmure-tully"],
    allies: ["eddard-stark", "jon-arryn"],
    rivals: ["aerys-ii"],
    relationshipDetails: {
      "eddard-stark": { type: "Đồng Minh", trust: 80, affinity: 70, detail: "Hôn nhân chính trị: Hoster gả Catelyn cho Ned để đổi lấy liên minh. Thực dụng nhưng hiệu quả." },
      "jon-arryn": { type: "Đồng Minh", trust: 80, affinity: 60, detail: "Jon Arryn cưới Lysa để có Riverlands. Hoster biết tuổi tác chênh lệch nhưng chấp nhận." }
    },
    personalHooks: [
      { id: "tully-alliance", title: "Cái Giá Của Liên Minh", year: "282 AC", numericYear: 282, desc: "Quân khởi nghĩa cần Riverlands để vượt sông. Ngươi ra điều kiện: Ned và Jon phải cưới con gái của ngươi." }
    ],
    father: "",
    mother: "",
    siblings: ["brynden-tully"],
},
  {
    id: "tywin-lannister",
    name: "Tywin Lannister",
    tuocVi: "Đại Lãnh Chúa",
    house: "Lannister",
    role: "Sư Tử Già",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa quyền lực và giàu có bậc nhất. Sau nhiều năm làm Bàn Tay cho Aerys, Tywin đã từ chức vì bị xúc phạm. Ông đóng cửa Casterly Rock chờ xem phe nào có khả năng chiến thắng cao hơn.",
    birthYear: 242,
    age: 40,
    coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 18, "Tinh Tường": 20, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 80, "Trí Mưu": 90, "Ngoại Giao": 100 },
    talentIds: ["schemer", "strategist", "berserker", "merchant-fortune"],
    skills: { "cunning": 9, "court-etiquette": 10, "command": 8, "trading": 10 },
    equipment: [],
    items: [],
    gold: 100000,
    startResources: {
      "Gỗ": 250,
      "Quặng Sắt": 750,
      "Đá": 750,
      "Lương Thực": 3000,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
      { name: "Sư Tử Casterly Rock", type: "Bộ Binh", size: 25000, quality: "Tinh Nhuệ" },
      { name: "Kỵ Binh Tiên Phong", type: "Kỵ Binh", size: 10000, quality: "Tinh Nhuệ" }
    ],
          startRegions: ["the-westerlands"],
      startHoldings: ["the-westerlands-seat"],
      holdingsLevel: {"the-westerlands-seat": 5},
      baseIncome: 800,
father: "tytos-lannister",
    spouse: "joanna-lannister",
    children: ["jaime-lannister", "cersei-lannister", "tyrion-lannister"],
    rivals: ["aerys-ii", "robb-stark"],
    personalHooks: [
      { id: "tywin-wait", title: "Sư Tử Chờ Đợi", year: "282 AC", numericYear: 282, desc: "Ngươi không vội tham chiến. Hãy để những kẻ khác làm suy yếu nhau, nhà Lannister sẽ luôn theo phe chiến thắng." }
    ],
    mother: "",
    siblings: ["kevan-lannister", "tygett-lannister", "gerion-lannister", "genna-lannister"],
    allies: ["aerys-ii", "robert-baratheon"],
    relationshipDetails: {
      "aerys-ii": { type: "Cựu Chủ", trust: 0, affinity: -50, detail: "Tywin phục vụ Aerys 20 năm như Bàn Tay, nhưng Aerys ghen ghét và sỉ nhục ông liên tục. Việc Aerys cưỡng bức Joanna là nỗi hận không bao giờ nguôi." },
      "joanna-lannister": { type: "Vợ (Đã Mất)", trust: 100, affinity: 100, detail: "Joanna là người đàn bà duy nhất Tywin thật sự yêu. Cái chết của cô khi sinh Tyrion đã làm Tywin căm ghét đứa con út." },
      "kevan-lannister": { type: "Em Trai", trust: 100, affinity: 90, detail: "Kevan luôn là cánh tay phải đáng tin cậy nhất, người duy nhất Tywin cho phép làm việc sát cánh." }
    },
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
    năngLực: { "Võ Lực": 75, "Thống Soái": 90, "Trí Mưu": 80, "Ngoại Giao": 70 },
    talentIds: ["highborn-charm", "duelist", "greenseer", "learned"],
    skills: { "sword-shield": 8, "persuasion": 9, "war-riding": 9, "lore": 8 },
    equipment: [],
    items: [{ ten: "Đàn Hạc Bạc", soLuong: 1, moTa: "Cây đàn hạc có dây bằng bạc." }],
    gold: 15000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
      { name: "Kỵ Binh Hoàng Gia", type: "Kỵ Binh", size: 5000, quality: "Tinh Nhuệ" },
      { name: "Trung Quân Đỉnh Aegon", type: "Trường Thương", size: 10000, quality: "Thành Thạo" },
      { name: "Cung Thủ Vương Đô", type: "Bộ Binh", size: 5000, quality: "Thành Thạo" }
    ],
    father: "aerys-ii",
    mother: "rhaella-targaryen",
    spouse: "elia-martell",
    siblings: ["viserys-targaryen", "daenerys-targaryen"],
    children: ["rhaenys-targaryen", "aegon-targaryen"],
    allies: ["arthur-dayne", "jon-connington"],
    rivals: ["robert-baratheon"],
    liege: "aerys-ii",
    relationshipDetails: {
      "lyanna-stark": { type: "Người Tình", trust: 100, affinity: 100, detail: "Tình yêu làm thay đổi lịch sử. Rhaegar tin Lyanna là chìa khóa của lời tiên tri." },
      "aerys-ii": { type: "Cha", trust: 20, affinity: 10, detail: "Rhaegar biết cha mình điên loạn và từng lên kế hoạch lật đổ Aerys tại Harrenhal." },
      "arthur-dayne": { type: "Bằng Hữu", trust: 100, affinity: 100, detail: "Kiếm sĩ vĩ đại nhất, trung thành tuyệt đối. Arthur chết để bảo vệ lời thề với Rhaegar tại Tháp Niềm Vui." },
      "elia-martell": { type: "Vợ", trust: 60, affinity: 50, detail: "Rhaegar yêu thương Elia nhưng ám ảnh với tiên tri đã khiến anh phản bội cô với Lyanna." }
    },
    personalHooks: [
      { id: "rhaegar-trident", title: "Trận Trident", year: "283 AC", numericYear: 283, desc: "Đội quân khởi nghĩa đang ở bờ bắc sông Trident. Ngươi dẫn 4 vạn quân vượt sông để đè bẹp Robert Baratheon." }
    ],
      startRegions: [],
      startHoldings: ["dragonstone"],
      holdingsLevel: {"dragonstone":4},
      baseIncome: 200
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
    năngLực: { "Võ Lực": 40, "Thống Soái": 50, "Trí Mưu": 60, "Ngoại Giao": 30 },
    talentIds: ["chronic-illness", "berserker", "paranoia"],
    skills: { "cunning": 4, "intimidation": 6 },
    equipment: [],
    items: [{ ten: "Lửa Hoang", soLuong: 100, moTa: "Những hũ chất lỏng cháy xanh rực." }],
    gold: 50000,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 750,
      "Đá": 1500,
      "Lương Thực": 7500,
      "Ngựa": 300,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
      { name: "Thành Cấp Vệ Vương Đô", type: "Bộ Binh", size: 35000, quality: "Thành Thạo" },
      { name: "Đội Đỏ Lửa", type: "Bộ Binh", size: 5000, quality: "Tinh Nhuệ" }
    ],
          startRegions: ["the-crownlands"],
      startHoldings: ["the-crownlands-seat"],
      holdingsLevel: {"the-crownlands-seat": 5},
      baseIncome: 600,
spouse: "rhaella-targaryen",
    children: ["rhaegar-targaryen", "viserys-targaryen", "daenerys-targaryen"],
    rivals: ["robert-baratheon", "eddard-stark", "tywin-lannister"],
    personalHooks: [
      { id: "burn-them-all", title: "Đốt Hết Bọn Chúng", year: "283 AC", numericYear: 283, desc: "Quân Lannister đang cướp bóc thành phố. Kẻ thù ở ngay trong nhà. Ngươi ra lệnh kích nổ Lửa Hoang được giấu khắp thành." }
    ],
    father: "jaehaerys-ii-targaryen",
    mother: "",
    siblings: [],
    allies: [],
    relationshipDetails: {
      "rhaegar-targaryen": { type: "Con", trust: 30, affinity: 20, detail: "Aerys nghi ngờ Rhaegar âm mưu lật đổ mình tại giải đấu Harrenhal. Cha con không tin nhau." },
      "tywin-lannister": { type: "Cựu Bàn Tay", trust: 0, affinity: -80, detail: "Aerys ghen ghét Tywin, xúc phạm ông liên tục. Việc lợi dụng Joanna là sự sỉ nhục không tha thứ." },
      "jaime-lannister": { type: "Vệ Vương", trust: 10, affinity: 0, detail: "Aerys giữ Jaime làm con tin để kiểm soát Tywin. Jaime sẽ là người kết thúc đời ông." }
    },
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
    năngLực: { "Võ Lực": 80, "Thống Soái": 90, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: ["highborn-charm", "born-swordsman", "hot-tempered", "duelist"],
    skills: { "sword-shield": 9, "war-riding": 8 },
    equipment: [],
    items: [],
    gold: 500,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 150,
      "Đá": 150,
      "Lương Thực": 600,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "tywin-lannister",
    mother: "joanna-lannister",
    siblings: ["cersei-lannister", "tyrion-lannister"],
    personalHooks: [
      { id: "kingslayer", title: "Kẻ Thí Vua", year: "283 AC", numericYear: 283, desc: "Aerys ra lệnh đốt cháy thành phố. Ngươi, một Vệ Vương, đứng trước lựa chọn lớn nhất đời mình." }
    ],
    spouse: "",
    children: ["joffrey-baratheon", "myrcella-baratheon", "tommen-baratheon"],
    allies: ["cersei-lannister"],
    rivals: ["eddard-stark", "brienne-tarth"],
    liege: "aerys-ii",
    courtPosition: "Vệ Vương",
    relationshipDetails: {
      "aerys-ii": { type: "Vua", trust: 10, affinity: -50, detail: "Jaime chứng kiến Aerys thiêu sống người vô tội và cưỡng bức Rhaella. Lời thề bảo vệ vua trở nên đau đớn." },
      "cersei-lannister": { type: "Chị Em", trust: 90, affinity: 100, detail: "Tình yêu tội lỗi với chị gái sinh đôi. Jaime sẵn sàng làm mọi thứ cho Cersei." },
      "tywin-lannister": { type: "Cha", trust: 50, affinity: 30, detail: "Tywin thất vọng vì Jaime từ chối quyền thừa kế Casterly Rock để làm Vệ Vương." }
    },
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
    năngLực: { "Võ Lực": 80, "Thống Soái": 75, "Trí Mưu": 60, "Ngoại Giao": 90 },
    talentIds: ["warrior-blood", "duelist", "keen-eye", "beloved"],
    skills: { "sword-shield": 10, "war-riding": 9, "command": 8 },
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
    personalHooks: [
      { id: "barristan-trident", title: "Chiến Đấu Vì Vương Triều", year: "283 AC", numericYear: 283, desc: "Ngươi sát cánh cùng Hoàng tử Rhaegar tại sông Trident, quyết tử bảo vệ gia tộc Targaryen." }
    ],
    father: "lyonel-selmy",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: ["rhaegar-targaryen", "daenerys-targaryen"],
    rivals: [],
    liege: "aerys-ii",
    courtPosition: "Vệ Vương",
    relationshipDetails: {
      "rhaegar-targaryen": { type: "Hoàng Tử", trust: 100, affinity: 100, detail: "Barristan kính trọng Rhaegar như một vị vua lý tưởng mà Westeros không bao giờ có được." },
      "aerys-ii": { type: "Vua", trust: 40, affinity: 10, detail: "Barristan phục vụ Aerys dù biết ông ta điên. Lời thề Vệ Vương là tất cả." }
    },
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
    năngLực: { "Võ Lực": 90, "Thống Soái": 80, "Trí Mưu": 70, "Ngoại Giao": 90 },
    talentIds: ["duelist", "born-swordsman"],
    skills: { "sword-shield": 10, "war-riding": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Dawn", phamChat: "Vô Giá", thuocTinh: { "Sát Thương": 35 }, moTa: "Thanh kiếm rèn từ tâm một ngôi sao băng, không kém gì Thép Valyria." }],
    items: [],
    gold: 300,
    startResources: {
      "Gỗ": 50,
      "Quặng Sắt": 50,
      "Đá": 120,
      "Lương Thực": 350,
      "Ngựa": 60,
      "Thép Valyria": 0
    }, startingHookIds: [],
    personalHooks: [
      { id: "tower-defense", title: "Bảo Vệ Tháp Niềm Vui", year: "283 AC", numericYear: 283, desc: "Chỉ còn ba Vệ Vương đứng trước Tháp Niềm Vui, đối mặt với bảy người phương Bắc." }
    ],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: ["ashara-dayne"],
    allies: ["rhaegar-targaryen"],
    rivals: ["eddard-stark"],
    liege: "aerys-ii",
    courtPosition: "Vệ Vương",
    relationshipDetails: {
      "rhaegar-targaryen": { type: "Bằng Hữu", trust: 100, affinity: 100, detail: "Rhaegar là bạn thân nhất của Arthur. Arthur chết để bảo vệ lời thề với Rhaegar tại Tháp Niềm Vui." },
      "eddard-stark": { type: "Kẻ Thù", trust: 20, affinity: 30, detail: "Ned là người danh dự duy nhất ở phe địch. Arthur tôn trọng Ned dù phải chiến đấu với anh." }
    },
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
    id: "mace-tyrell",
    name: "Mace Tyrell",
    tuocVi: "Đại Lãnh Chúa",
    house: "Tyrell",
    role: "Lãnh Chúa Highgarden",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa của Reach. Một người thích vinh quang nhưng không có nhiều tài năng quân sự. Ông ta vây hãm Storm's End và mở tiệc suốt ngày đêm.",
    birthYear: 256,
    age: 26,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 50 },
    talentIds: ["merchant-fortune", "intimidating"],
    skills: { "cunning": 7, "persuasion": 8 },
    equipment: [],
    items: [],
    gold: 80000,
    startResources: {
      "Gỗ": 750,
      "Quặng Sắt": 125,
      "Đá": 500,
      "Lương Thực": 10000,
      "Ngựa": 150,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Vệ Binh Mùa Hè", type: "Bộ Binh", size: 42000, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 14000, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 14000, quality: "Thành Thạo" }
        ],
          startRegions: ["the-reach"],
      startHoldings: ["the-reach-seat"],
      holdingsLevel: {"the-reach-seat": 5},
      baseIncome: 750,
father: "luthor-tyrell",
    mother: "olenna-redwyne",
    spouse: "alerie-hightower",
    children: ["willas-tyrell", "garlan-tyrell", "loras-tyrell", "margaery-tyrell"],
    allies: ["randyll-tarly", "tywin-lannister"],
    personalHooks: [
      { id: "mace-siege", title: "Vây Hãm Storm's End", year: "282 AC", numericYear: 282, desc: "Quân đội của Reach rất lớn. Việc vây hãm lâu đài chỉ là vấn đề thời gian." }
    ],
    siblings: [],
    rivals: ["stannis-baratheon"],
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
    năngLực: { "Võ Lực": 80, "Thống Soái": 60, "Trí Mưu": 75, "Ngoại Giao": 90 },
    talentIds: ["keen-eye", "warrior-blood", "strategist"],
    skills: { "command": 9, "sword-shield": 8, "cunning": 9 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Heartsbane", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương": 25 }, moTa: "Thanh trọng kiếm Thép Valyria của Nhà Tarly." }],
    items: [],
    gold: 800,
    startResources: {
      "Gỗ": 300,
      "Quặng Sắt": 50,
      "Đá": 200,
      "Lương Thực": 4000,
      "Ngựa": 60,
      "Thép Valyria": 0
    }, startingHookIds: [],
    personalHooks: [
      { id: "tarly-ashford", title: "Trận Ashford", year: "282 AC", numericYear: 282, desc: "Ngươi dẫn đội tiên phong phe Trung Quân giáp mặt Robert Baratheon." }
    ],
    father: "",
    mother: "",
    spouse: "melessa-florent",
    children: ["samwell-tarly", "dickon-tarly"],
    siblings: [],
    allies: ["mace-tyrell"],
    rivals: [],
    startArmies: [
          { name: "Dân Binh ", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ ", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "doran-martell",
    name: "Doran Martell",
    tuocVi: "Đại Lãnh Chúa",
    house: "Martell",
    role: "Người Cai Trị Dorne",
    religion: "Thất Diện Thần",
    blurb: "Một người đàn ông cẩn trọng và điềm đạm. Doran không muốn can dự vào cuộc chiến, nhưng Aerys đang giữ em gái Elia của ông làm con tin.",
    birthYear: 247,
    age: 35,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 75, "Trí Mưu": 90, "Ngoại Giao": 80 },
    talentIds: ["strategist", "schemer", "lame"],
    skills: { "cunning": 9, "persuasion": 8, "court-etiquette": 9 },
    equipment: [],
    items: [],
    gold: 3000,
    startResources: {
      "Gỗ": 250,
      "Quặng Sắt": 250,
      "Đá": 600,
      "Lương Thực": 1750,
      "Ngựa": 300,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Bộ Binh Sunspear", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Cát Đỏ", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Cung Thủ Tẩm Độc", type: "Cung Thủ", size: 2000, quality: "Thành Thạo" }
        ],
    siblings: ["oberyn-martell", "elia-martell"],
          startRegions: ["dorne"],
      startHoldings: ["dorne-seat"],
      holdingsLevel: {"dorne-seat": 5},
      baseIncome: 450,
spouse: "mellario-of-norvos",
    children: ["arianne-martell", "quentyn-martell", "trystane-martell"],
    personalHooks: [
      { id: "doran-waiting", title: "Gửi Quân Miễn Cưỡng", year: "283 AC", numericYear: 283, desc: "Dù tức giận vì Rhaegar phản bội Elia, ngươi vẫn phải gửi 1 vạn lính giáo Dorne lên chiến đấu." }
    ],
    father: "",
    mother: "martell-mother-doran",
    allies: [],
    rivals: ["tywin-lannister"],
    relationshipDetails: {
      "elia-martell": { type: "Em Gái", trust: 100, affinity: 100, detail: "Doran yêu thương Elia nhưng không thể cứu cô khỏi Kings Landing. Nỗi đau này ận ức suốt đời." },
      "oberyn-martell": { type: "Em Trai", trust: 90, affinity: 80, detail: "Oberyn nóng nảy nhưng trung thành. Doran kìm giữ Oberyn để đợi thời cơ trả thù." },
      "tywin-lannister": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Tywin ra lệnh giết Elia và con nhỏ của cô. Doran không bao giờ quên và âm thầm lên kế hoạch." }
    },
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
    năngLực: { "Võ Lực": 70, "Thống Soái": 80, "Trí Mưu": 80, "Ngoại Giao": 75 },
    talentIds: ["duelist", "master-liar", "warrior-blood"],
    skills: { "polearm": 9, "cunning": 9, "deception": 8 },
    equipment: [],
    items: [{ ten: "Độc Manticore", soLuong: 1, moTa: "Chất độc chết người." }],
    gold: 1000,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [],
    personalHooks: [],
    father: "",
    mother: "martell-mother-doran",
    spouse: "",
    children: ["sand-snakes"],
    siblings: ["doran-martell", "elia-martell"],
    allies: ["doran-martell"],
    rivals: ["gregor-clegane", "tywin-lannister"],
    liege: "doran-martell",
    relationshipDetails: {
      "elia-martell": { type: "Em Gái", trust: 100, affinity: 100, detail: "Oberyn yêu Elia vô cùng. Anh sống để trả thù cho cô — và sẽ chết vì điều đó." },
      "gregor-clegane": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Con Quỷ Núi đã hiếp dâm và giết Elia. Oberyn không bao giờ nghỉ trả thù." },
      "doran-martell": { type: "Anh Trai", trust: 80, affinity: 70, detail: "Doran cẩn thận, Oberyn liều lĩnh. Hai anh em bổ sung cho nhau." }
    },
    startArmies: [
          { name: "Đội Tiên Phong Xứ Dorne", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "balon-greyjoy",
    name: "Balon Greyjoy",
    tuocVi: "Quốc Vương",
    house: "Greyjoy",
    role: "Người Thừa Kế Pyke",
    religion: "Thần Chết Chìm",
    blurb: "Gia tộc Greyjoy đứng ngoài cuộc chiến phần lớn thời gian, cho đến khi kết quả đã an bài. Balon ôm ấp mộng tưởng phục hưng Luật Lệ Cũ (Old Way).",
    birthYear: 255,
    age: 27,
    coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 16, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 80 },
    talentIds: ["warrior-blood", "iron-constitution", "intimidating"],
    skills: { "trading": 8, "intimidation": 8, "axe-mace": 6 },
    equipment: [],
    items: [],
    gold: 500,
    startResources: {
      "Gỗ": 1500,
      "Quặng Sắt": 1250,
      "Đá": 1500,
      "Lương Thực": 2000,
      "Ngựa": 20,
      "Thép Valyria": 0
    }, startingHookIds: [],
    startArmies: [
          { name: "Lính Rìu Pyke", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Người Ném Lao Quần Đảo", type: "Cung Thủ", size: 1500, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 50, quality: "Thành Thạo" }
        ],
    father: "quellon-greyjoy",
    spouse: "alannys-harlaw",
    children: ["rodrik-greyjoy", "maron-greyjoy", "asha-greyjoy", "theon-greyjoy"],
    siblings: ["euron-greyjoy", "victarion-greyjoy", "aeron-greyjoy"],
    personalHooks: [],
    mother: "",
    allies: [],
    rivals: ["robert-baratheon", "eddard-stark", "robb-stark"],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
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
    năngLực: { "Võ Lực": 75, "Thống Soái": 40, "Trí Mưu": 70, "Ngoại Giao": 100 },
    talentIds: ["iron-constitution", "learned", "strategist"],
    skills: { "command": 8, "weather-endurance": 8, "cunning": 8 },
    equipment: [],
    items: [],
    gold: 5000,
    startResources: {
      "Gỗ": 400,
      "Quặng Sắt": 120,
      "Đá": 300,
      "Lương Thực": 1100,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "steffon-baratheon",
    mother: "cassana-estermont",
    spouse: "selyse-florent",
    siblings: ["robert-baratheon", "renly-baratheon"],
    personalHooks: [
      { id: "stannis-siege", title: "Cơn Đói Tại Storm's End", year: "283 AC", numericYear: 283, desc: "Ngươi đã vây hãm suốt một năm. Lương thực đã cạn. Liệu ngươi sẽ đầu hàng hay chết đói?" }
    ],
    children: ["shireen-baratheon"],
    allies: ["davos-seaworth", "melisandre"],
    rivals: ["renly-baratheon", "joffrey-baratheon", "roose-bolton"],
    liege: "robert-baratheon",
    relationshipDetails: {
      "robert-baratheon": { type: "Anh Trai", trust: 50, affinity: 30, detail: "Stannis hận Robert vì tặng Storm's End cho Renly thay vì mình. Ông không bao giờ thấy được sự công nhận từ anh." },
      "renly-baratheon": { type: "Em Trai", trust: 10, affinity: 10, detail: "Renly cưới nhạo Stannis và tranh ngai vàng. Stannis không tha thứ sự phản bội của máu mủ." },
      "davos-seaworth": { type: "Tâm Phúc", trust: 100, affinity: 90, detail: "Davos cứu Storm's End khỏi nạn đói. Stannis chặt ngón tay ông nhưng cũng phong hiệp sĩ — đó là công lý." }
    },
    startArmies: [
          { name: "Bộ Binh Bão Tố", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 750, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 25, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: ["dragonstone"],
      holdingsLevel: {"dragonstone":4},
      baseIncome: 150
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
    năngLực: { "Võ Lực": 25, "Thống Soái": 70, "Trí Mưu": 50, "Ngoại Giao": 40 },
    talentIds: ["highborn-charm", "beloved"],
    skills: { "persuasion": 4 },
    equipment: [],
    items: [],
    gold: 20000,
    startResources: {
      "Gỗ": 400,
      "Quặng Sắt": 120,
      "Đá": 300,
      "Lương Thực": 1100,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "steffon-baratheon",
    mother: "cassana-estermont",
    siblings: ["robert-baratheon", "stannis-baratheon"],
    personalHooks: [],
    spouse: "margaery-tyrell",
    children: [],
    allies: ["mace-tyrell", "loras-tyrell"],
    rivals: ["stannis-baratheon", "joffrey-baratheon"],
    liege: "robert-baratheon",
    relationshipDetails: {
      "robert-baratheon": { type: "Anh Trai", trust: 60, affinity: 50, detail: "Robert yêu Renly nhưng không quan tâm nhiều. Renly lớn lên trong bóng của hai anh." },
      "stannis-baratheon": { type: "Anh Trai", trust: 20, affinity: 10, detail: "Renly cười nhạo Stannis và tin mình xứng đáng làm vua hơn. Stannis không bao giờ tha thứ." },
      "loras-tyrell": { type: "Người Tình", trust: 100, affinity: 100, detail: "Renly và Loras yêu nhau bí mật. Loras là tình yêu duy nhất của Renly." }
    },
    startArmies: [
          { name: "Lính Kích Storm's End", type: "Bộ Binh", size: 48000, quality: "Thành Thạo" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 12000, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 400, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "elia-martell", name: "Elia Martell", tuocVi: "Vương phi", house: "Martell", role: "Vợ Của Rhaegar", religion: "Thất Diện Thần",
    blurb: "Sức khỏe yếu ớt nhưng mang dòng máu vương giả Dorne. Cô bị giam lỏng ở Red Keep cùng hai con nhỏ.",
    birthYear: 256, age: 26, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 5, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 60 },
    talentIds: ["highborn-charm", "beloved"], skills: { "cunning": 6, "persuasion": 8 },
    equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "rhaegar-targaryen",
    children: ["rhaenys-targaryen-daughter", "aegon-targaryen-son"],
    siblings: ["doran-martell", "oberyn-martell"],
    father: "",
    mother: "martell-mother-doran",
    allies: [],
    rivals: ["gregor-clegane"],
    startArmies: [
          { name: "Chiến Binh Mật Thủy", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "rhaella-targaryen", name: "Rhaella Targaryen", tuocVi: "Vương Hậu", house: "Targaryen", role: "Hoàng Hậu Đau Khổ", religion: "Thất Diện Thần",
    blurb: "Vợ và em gái của Vua Điên. Bà phải chịu đựng sự lạm dụng của chồng trong nhiều năm.",
    birthYear: 245, age: 37, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 13, "Tinh Tường": 18, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 70, "Trí Mưu": 65, "Ngoại Giao": 90 },
    talentIds: ["iron-constitution", "highborn-charm"], skills: { "cunning": 5, "persuasion": 5 },
    equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    spouse: "aerys-ii",
    children: ["rhaegar-targaryen", "viserys-targaryen", "daenerys-targaryen"],
    father: "jaehaerys-ii-targaryen",
    mother: "",
    siblings: [],
    allies: [],
    rivals: [],
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
    id: "catelyn-tully", name: "Catelyn Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Ned", religion: "Thất Diện Thần",
    blurb: "Được hứa hôn với Brandon Stark, nhưng sau khi anh chết, cô kết hôn với em trai anh là Ned để củng cố liên minh.",
    birthYear: 264, age: 18, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 80 },
    talentIds: ["iron-constitution", "beloved", "keen-eye"], skills: { "cunning": 7, "persuasion": 7, "court-etiquette": 8 },
    equipment: [], items: [], gold: 800,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "hoster-tully",
    mother: "minisa-whent",
    spouse: "eddard-stark",
    siblings: ["lysa-tully", "edmure-tully"],
    children: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark"],
    allies: ["brynden-tully"],
    rivals: ["cersei-lannister", "jaime-lannister", "walder-frey"],
    startArmies: [
          { name: "Lính Giáo Vùng Trident", type: "Bộ Binh", size: 1440, quality: "Thành Thạo" },
          { name: "Kỵ Binh Tiên Phong Riverlands", type: "Kỵ Binh", size: 480, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nước", type: "Cung Thủ", size: 480, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lysa-tully", name: "Lysa Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Jon Arryn", religion: "Thất Diện Thần",
    blurb: "Bị ép kết hôn với một người đáng tuổi ông mình để đổi lấy quân đội của Vale.",
    birthYear: 266, age: 16, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 7, "Thể Chất": 6, "Trí Tuệ": 12, "Tinh Tường": 8, "Uy Tín": 13 },
    năngLực: { "Võ Lực": 25, "Thống Soái": 65, "Trí Mưu": 60, "Ngoại Giao": 40 },
    talentIds: ["paranoia", "hot-tempered"], skills: { "cunning": 5 },
    equipment: [], items: [], gold: 800,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "hoster-tully",
    mother: "minisa-whent",
    spouse: "jon-arryn",
    siblings: ["catelyn-tully", "edmure-tully"],
    children: ["robert-arryn"],
    allies: ["petyr-baelish"],
    rivals: ["catelyn-tully"],
    startArmies: [
          { name: "Dân Binh Riverlands", type: "Bộ Binh", size: 1440, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sông Nhánh", type: "Kỵ Binh", size: 480, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 480, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "roose-bolton-robert", name: "Roose Bolton", tuocVi: "Lãnh Chúa Thành Trì", house: "Bolton", role: "Lãnh Chúa Dreadfort", religion: "Cựu Thần",
    blurb: "Lạnh lùng và điềm tĩnh, Roose tham gia cuộc khởi nghĩa dưới ngọn cờ của nhà Stark.",
    birthYear: 255, age: 27, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 60, "Trí Mưu": 80, "Ngoại Giao": 80 },
    talentIds: ["schemer", "berserker"], skills: { "command": 8, "cunning": 7 },
    equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 600,
      "Quặng Sắt": 120,
      "Đá": 240,
      "Lương Thực": 800,
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
          { name: "Bộ Binh Dreadfort", type: "Bộ Binh", size: 489, quality: "Thành Thạo" },
          { name: "Cung Thủ Độc Dreadfort", type: "Cung Thủ", size: 211, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: ["dreadfort"],
      holdingsLevel: {"dreadfort":4},
      baseIncome: 200
},
  {
    id: "jon-connington", name: "Jon Connington", tuocVi: "Lãnh Chúa", house: "Connington", role: "Bàn Tay Của Aerys", religion: "Thất Diện Thần",
    blurb: "Một hiệp sĩ kiêu hãnh và là bạn thân của Rhaegar. Được phong làm Bàn Tay Nhà Vua để tiêu diệt quân khởi nghĩa.",
    birthYear: 260, age: 22, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 70 },
    talentIds: ["intimidating", "beloved"], skills: { "command": 7, "sword-shield": 8 },
    equipment: [], items: [], gold: 1200,
    startResources: {
      "Gỗ": 400,
      "Quặng Sắt": 120,
      "Đá": 300,
      "Lương Thực": 1100,
      "Ngựa": 40,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "",
    mother: "",
    spouse: "",
    children: [],
    siblings: [],
    allies: ["rhaegar-targaryen", "aegon-targaryen-son"],
    rivals: ["robert-baratheon"],
    startArmies: [
          { name: "Bộ Binh Vàng (Golden Company)", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vàng", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "viserys-targaryen", name: "Viserys Targaryen", tuocVi: "Hoàng Tử", house: "Targaryen", role: "Người Kế Vị Chờ Đợi", religion: "Thất Diện Thần",
    blurb: "Con trai thứ của Vua Điên. Khi chiến tranh nổ ra, cậu chỉ là một đứa trẻ sợ hãi, không biết tương lai lưu vong đang chờ đợi.",
    birthYear: 276, age: 6, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 5, "Thể Chất": 4, "Trí Tuệ": 10, "Tinh Tường": 8, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 40 },
    talentIds: ["hot-tempered", "chronic-illness"], skills: { "persuasion": 3 },
    equipment: [], items: [], gold: 200,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "aerys-ii",
    mother: "rhaella-targaryen",
    spouse: "",
    children: [],
    siblings: ["rhaegar-targaryen", "daenerys-targaryen"],
    allies: ["illyrio-mopatis"],
    rivals: ["robert-baratheon", "khal-drogo"],
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
    id: "gerold-hightower", name: "Gerold Hightower", tuocVi: "Hiệp Sĩ", house: "Hightower", role: "Bò Trắng", religion: "Thất Diện Thần",
    blurb: "Tư lệnh đội Vệ Vương. To lớn, trung thành tuyệt đối, ông sát cánh cùng Arthur Dayne bảo vệ Tháp Niềm Vui.",
    birthYear: 225, age: 57, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 14, "Tinh Tường": 18, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 80, "Thống Soái": 70, "Trí Mưu": 70, "Ngoại Giao": 90 },
    talentIds: ["giant-frame", "beloved", "keen-eye"], skills: { "sword-shield": 9, "command": 8 },
    equipment: [], items: [], gold: 300,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 25,
      "Đá": 100,
      "Lương Thực": 2000,
      "Ngựa": 30,
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
          { name: "Vệ Binh Oldtown", type: "Bộ Binh", size: 168, quality: "Thành Thạo" },
          { name: "Cung Thủ Oldtown", type: "Cung Thủ", size: 72, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "oswell-whent", name: "Oswell Whent", tuocVi: "Hiệp Sĩ", house: "Whent", role: "Hiệp Sĩ Vệ Vương", religion: "Thất Diện Thần",
    blurb: "Nổi bật với chiếc mũ giáp hình con dơi đen. Ông là người thứ ba bảo vệ Tháp Niềm Vui.",
    birthYear: 245, age: 37, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 13, "Tinh Tường": 15, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 75, "Thống Soái": 60, "Trí Mưu": 65, "Ngoại Giao": 75 },
    talentIds: ["beloved"], skills: { "sword-shield": 8 },
    equipment: [], items: [], gold: 200,
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
          { name: "Bộ Binh Harrenhal", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Bờ Sông", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "richard-lonmouth", name: "Richard Lonmouth", tuocVi: "Hiệp Sĩ", house: "Lonmouth", role: "Hiệp Sĩ Hộp Sọ", religion: "Thất Diện Thần",
    blurb: "Bạn thân và từng là giám mã của Rhaegar Targaryen, có mặt tại giải đấu Harrenhal định mệnh.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 65, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 65 },
    talentIds: ["beloved"], skills: { "sword-shield": 7 },
    equipment: [], items: [], gold: 400,
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
          { name: "Dân Binh Lonmouth", type: "Bộ Binh", size: 42, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Lonmouth", type: "Cung Thủ", size: 18, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "robert-baratheon", name: "Robert Baratheon", tuocVi: "Đại Lãnh Chúa", house: "Baratheon", role: "Chúa Tể Bão Tố", religion: "Thất Diện Thần", blurb: "Người chỉ huy cuộc khởi nghĩa mang tên mình, cao lớn, hung bạo và khao khát trả thù cho Lyanna.",
    birthYear: 262, age: 20, coreStats: { "Sức Mạnh": 20, "Nhanh Nhẹn": 14, "Thể Chất": 18, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 100, "Thống Soái": 90, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: ["warrior-blood", "beloved", "hot-tempered"], skills: { "axe-mace": 10, "command": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Búa chiến của Robert", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương": 25 }, moTa: "Cây búa chiến khổng lồ mà chỉ Robert mới vung nổi." }],
    items: [], gold: 20000,
    startResources: {
      "Gỗ": 1000,
      "Quặng Sắt": 300,
      "Đá": 750,
      "Lương Thực": 2750,
      "Ngựa": 100,
      "Thép Valyria": 0
    },
    startDebts: {
      "Iron Bank": {
        "amount": 1000000,
        "interest": 5,
        "duration": 100
      }
    }, startingHookIds: [], startArmies: [
          { name: "Lính Giáo Rừng Mưa", type: "Bộ Binh", size: 18000, quality: "Tinh Nhuệ" },
          { name: "Đội Nỏ Vùng Bão", type: "Cung Thủ", size: 4500, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 150, quality: "Tinh Nhuệ" }
        ],
    father: "steffon-baratheon", mother: "cassana-estermont", siblings: ["stannis-baratheon", "renly-baratheon"], allies: ["eddard-stark", "jon-arryn"], rivals: ["rhaegar-targaryen", "aerys-ii"],
    spouse: "cersei-lannister",
    children: ["joffrey-baratheon", "myrcella-baratheon", "tommen-baratheon", "gendry"],
    relationshipDetails: {
      "cersei-lannister": { type: "Vợ", trust: -50, affinity: -30, detail: "Cuộc hôn nhân chính trị. Robert không bao giờ thực sự yêu Cersei, ông luôn nhung nhớ Lyanna." },
      "eddard-stark": { type: "Bằng Hữu", trust: 100, affinity: 100, detail: "Người anh em kết nghĩa thân thiết nhất, lớn lên cùng nhau ở Eyrie." },
      "rhaegar-targaryen": { type: "Kẻ Thù", trust: -100, affinity: -100, detail: "Kẻ đã 'bắt cóc' Lyanna Stark. Robert căm hận Rhaegar đến tận xương tuỷ." },
      "lyanna-stark": { type: "Hôn Ước", trust: 90, affinity: 100, detail: "Người con gái Robert yêu thương nhất, dù thực sự ông chỉ yêu một hình bóng ảo ảnh." },
      "joffrey-baratheon": { type: "Con Cái", trust: 50, affinity: 40, detail: "Robert tin rằng đây là con trai ruột của mình, nhưng lại rất thất vọng về tính cách của đứa trẻ." }
    },
      startRegions: ["the-stormlands"],
      startHoldings: ["the-stormlands-seat"],
      holdingsLevel: {"the-stormlands-seat":5},
      baseIncome: 400
},
  {
    id: "steffon-baratheon", name: "Steffon Baratheon", tuocVi: "Cố Lãnh Chúa", house: "Baratheon", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Robert, Stannis, và Renly. Chết trong bão biển tại Vịnh Đắm Tàu.",
    birthYear: 246, deathYear: 278, age: 32, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 40,
      "Quặng Sắt": 12,
      "Đá": 30,
      "Lương Thực": 110,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "cassana-estermont",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
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
    id: "cassana-estermont", name: "Cassana Estermont", tuocVi: "Tiểu Thư", house: "Estermont", role: "Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ của Steffon Baratheon. Cùng tử nạn với chồng trên tàu Windproud.",
    birthYear: 248, deathYear: 278, age: 30, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "steffon-baratheon",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Đảo Rùa", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Biển", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "selyse-florent", name: "Selyse Florent", tuocVi: "Tiểu Thư", house: "Florent", role: "Vợ Của Stannis", religion: "Thất Diện Thần", blurb: "Vợ của Stannis Baratheon, lạnh nhạt và có phần khắc khổ.",
    birthYear: 265, age: 17, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 50, "Trí Mưu": 60, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "stannis-baratheon",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Xứ Reach", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Reach", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "rickard-stark", name: "Rickard Stark", tuocVi: "Cố Lãnh Chúa", house: "Stark", role: "Cố Lãnh Chúa", religion: "Cựu Thần", blurb: "Bị Vua Aerys thiêu sống bằng Lửa Hoang trong bộ giáp của mình.",
    birthYear: 235, deathYear: 282, age: 47, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 70 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "lyarra-stark",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Sói", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Winterfell", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lyarra-stark", name: "Lyarra Stark", tuocVi: "Phu Nhân", house: "Stark", role: "Cố Phu Nhân", religion: "Cựu Thần", blurb: "Mẹ của Brandon, Ned, Lyanna, và Benjen.",
    birthYear: 240, deathYear: 279, age: 39, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "rickard-stark",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Winterfell", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Tiên Phong Phương Bắc", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "brandon-stark-rebel", name: "Brandon Stark", tuocVi: "Người Thừa Kế", house: "Stark", role: "Người Thừa Kế Đã Chết", religion: "Cựu Thần", blurb: "Sói hoang. Bị thắt cổ đến chết khi cố cứu cha mình.",
    birthYear: 262, deathYear: 282, age: 20, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 15, "Thể Chất": 16, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 80, "Thống Soái": 70, "Trí Mưu": 50, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Dân Binh Phương Bắc", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Sói", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "lyanna-stark", name: "Lyanna Stark", tuocVi: "Tiểu Thư", house: "Stark", role: "Sói Nữ", religion: "Cựu Thần", blurb: "Em gái Ned, vị hôn thê của Robert. Nguyên nhân của cuộc khởi nghĩa.",
    birthYear: 266, deathYear: 283, age: 16, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 16, "Thể Chất": 12, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 80, "Trí Mưu": 60, "Ngoại Giao": 70 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Cấm Vệ Sói Băng", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Phương Bắc", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "benjen-stark", name: "Benjen Stark", tuocVi: "Thường Dân", house: "Stark", role: "Em Út", religion: "Cựu Thần", blurb: "Sói nhỏ nhất nhà Stark, ở lại Winterfell trong thời chiến.",
    birthYear: 267, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 70 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 60,
      "Quặng Sắt": 12,
      "Đá": 24,
      "Lương Thực": 80,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "rickard-stark", mother: "lyarra-stark",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Winterfell", type: "Bộ Binh", size: 210, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 90, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "jasper-arryn", name: "Jasper Arryn", tuocVi: "Cố Lãnh Chúa", house: "Arryn", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Jon Arryn.",
    birthYear: 195, deathYear: 260, age: 65, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 15,
      "Đá": 80,
      "Lương Thực": 80,
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
          { name: "Lính Giáo Thung Lũng", type: "Bộ Binh", size: 2160, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Không Gian", type: "Kỵ Binh", size: 720, quality: "Thành Thạo" },
          { name: "Cung Thủ Eyrie", type: "Cung Thủ", size: 720, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "minisa-whent", name: "Minisa Whent", tuocVi: "Tiểu Thư", house: "Whent", role: "Cố Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ quá cố của Hoster Tully, mẹ của Catelyn, Lysa, Edmure.",
    birthYear: 242, deathYear: 275, age: 33, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "hoster-tully",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Harrenhal", type: "Bộ Binh", size: 420, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Bờ Sông", type: "Cung Thủ", size: 180, quality: "Mới Lập Đội" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "edmure-tully", name: "Edmure Tully", tuocVi: "Người Thừa Kế", house: "Tully", role: "Người Thừa Kế Riverrun", religion: "Thất Diện Thần", blurb: "Con trai duy nhất của Hoster Tully, em trai của Catelyn và Lysa.",
    birthYear: 267, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 12, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 70, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 8,
      "Đá": 20,
      "Lương Thực": 200,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "hoster-tully", mother: "minisa-whent",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vệ Binh Sông Xanh", type: "Bộ Binh", size: 1440, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Riverrun", type: "Kỵ Binh", size: 480, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Sông", type: "Cung Thủ", size: 480, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "tytos-lannister", name: "Tytos Lannister", tuocVi: "Cố Lãnh Chúa", house: "Lannister", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Tywin. Lãnh chúa yếu kém đã làm suy giảm uy tín của nhà Lannister.",
    birthYear: 220, deathYear: 267, age: 47, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
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
          { name: "Lính Giáo Lannisport", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Vùng Đồi", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "joanna-lannister", name: "Joanna Lannister", tuocVi: "Phu Nhân", house: "Lannister", role: "Cố Phu Nhân", religion: "Thất Diện Thần", blurb: "Vợ của Tywin. Qua đời khi sinh Tyrion.",
    birthYear: 246, deathYear: 273, age: 27, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 14, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 75, "Trí Mưu": 70, "Ngoại Giao": 70 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "tywin-lannister",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vệ Binh Sư Tử Đỏ", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Phương Tây", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "cersei-lannister", name: "Cersei Lannister", tuocVi: "Tiểu Thư", house: "Lannister", role: "Tiểu Thư Casterly Rock", religion: "Thất Diện Thần", blurb: "Chị sinh đôi của Jaime. Xinh đẹp, đầy tham vọng và kiêu hãnh.",
    birthYear: 266, age: 16, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 18 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 90, "Trí Mưu": 70, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "tywin-lannister", mother: "joanna-lannister", siblings: ["jaime-lannister", "tyrion-lannister"],
    spouse: "robert-baratheon",
    children: ["joffrey-baratheon", "myrcella-baratheon", "tommen-baratheon"],
    allies: ["jaime-lannister"],
    rivals: ["robert-baratheon", "tyrion-lannister", "margaery-tyrell"],
    relationshipDetails: {
      "jaime-lannister": { type: "Người Tình", trust: 100, affinity: 100, detail: "Người tình bí mật, người duy nhất Cersei thực sự yêu thương ngoài những đứa con." },
      "robert-baratheon": { type: "Vợ/Chồng", trust: -90, affinity: -100, detail: "Chồng công khai. Cersei khinh bỉ và căm thù Robert vì ông ta luôn gọi tên Lyanna trong đêm tân hôn." },
      "tyrion-lannister": { type: "Anh Chị Em", trust: -80, affinity: -90, detail: "Cersei đổ lỗi cho Tyrion về cái chết của mẹ họ, và tin rằng Tyrion là một con quái vật độc ác." },
      "joffrey-baratheon": { type: "Con Cái", trust: 100, affinity: 100, detail: "Đứa con trai vàng ngọc. Dù Joffrey tàn độc, Cersei vẫn mù quáng yêu thương và dung túng." }
    },
    startArmies: [
          { name: "Đội Trọng Bộ Binh Lannister", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Đội Kỵ Binh Hạng Nặng Lannister", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "tyrion-lannister", name: "Tyrion Lannister", tuocVi: "Người Lùn", house: "Lannister", role: "Quỷ Lùn", religion: "Thất Diện Thần", blurb: "Con trai út của Tywin. Bị cha căm ghét vì hình hài và việc cái chết của mẹ.",
    birthYear: 273, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 6, "Trí Tuệ": 18, "Tinh Tường": 16, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 60, "Trí Mưu": 90, "Ngoại Giao": 80 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 30,
      "Đá": 30,
      "Lương Thực": 120,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "tywin-lannister", mother: "joanna-lannister", siblings: ["jaime-lannister", "cersei-lannister"],
    spouse: "sansa-stark",
    children: [],
    allies: ["bronn", "varys"],
    rivals: ["cersei-lannister", "tywin-lannister"],
    startArmies: [
          { name: "Đội Trọng Bộ Binh Lannister", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Vùng Đồi", type: "Kỵ Binh", size: 1000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 1000, quality: "Tinh Nhuệ" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "luthor-tyrell", name: "Luthor Tyrell", tuocVi: "Cố Lãnh Chúa", house: "Tyrell", role: "Cố Lãnh Chúa", religion: "Thất Diện Thần", blurb: "Cha của Mace Tyrell, vô tình lao xuống vách đá trong một cuộc đi săn.",
    birthYear: 230, deathYear: 280, age: 50, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "olenna-redwyne",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Giáo Hoa Hồng", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Hoa", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "olenna-redwyne", name: "Olenna Redwyne", tuocVi: "Phu Nhân", house: "Tyrell", role: "Nữ Hoàng Gai", religion: "Thất Diện Thần", blurb: "Mẹ của Mace Tyrell. Người thực sự điều hành nhà Tyrell với trí tuệ sắc sảo.",
    birthYear: 228, age: 54, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 18, "Tinh Tường": 18, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 90, "Ngoại Giao": 90 },
    talentIds: ["schemer", "master-liar"], skills: { "cunning": 9, "persuasion": 8 }, equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "luthor-tyrell",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Vùng Reach", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Hạng Nặng Xứ Reach", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "alerie-hightower", name: "Alerie Hightower", tuocVi: "Phu Nhân", house: "Tyrell", role: "Vợ Của Mace", religion: "Thất Diện Thần", blurb: "Vợ của Mace Tyrell.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 70, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "mace-tyrell",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "willas-tyrell", name: "Willas Tyrell", tuocVi: "Người Thừa Kế", house: "Tyrell", role: "Người Thừa Kế Highgarden", religion: "Thất Diện Thần", blurb: "Con trai trưởng của Mace. Cậu bé chăm học, hiền lành.",
    birthYear: 275, age: 7, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 12, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 60, "Trí Mưu": 70, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "garlan-tyrell", name: "Garlan Tyrell", tuocVi: "Hiệp Sĩ", house: "Tyrell", role: "Con Trai Thứ", religion: "Thất Diện Thần", blurb: "Con trai thứ hai của Mace.",
    birthYear: 277, age: 5, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 150,
      "Quặng Sắt": 25,
      "Đá": 100,
      "Lương Thực": 2000,
      "Ngựa": 30,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 560, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 240, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "loras-tyrell", name: "Loras Tyrell", tuocVi: "Thường Dân", house: "Tyrell", role: "Hiệp Sĩ Hoa", religion: "Thất Diện Thần", blurb: "Con trai thứ ba, hiện chỉ là một em bé.",
    birthYear: 282, age: 0, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 20, "Trí Mưu": 20, "Ngoại Giao": 20 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower",
    spouse: "",
    children: [],
    siblings: ["willas-tyrell", "garlan-tyrell", "margaery-tyrell"],
    allies: ["renly-baratheon", "margaery-tyrell"],
    rivals: [],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 560, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Vùng Reach", type: "Cung Thủ", size: 240, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "margaery-tyrell", name: "Margaery Tyrell", tuocVi: "Tiểu Thư", house: "Tyrell", role: "Con Gái Mace", religion: "Thất Diện Thần", blurb: "Con gái út của nhà Tyrell, mới ra đời.",
    birthYear: 283, age: 0, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 20, "Trí Mưu": 20, "Ngoại Giao": 20 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 5,
      "Đá": 20,
      "Lương Thực": 400,
      "Ngựa": 6,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "mace-tyrell", mother: "alerie-hightower",
    spouse: "renly-baratheon",
    children: [],
    siblings: ["willas-tyrell", "garlan-tyrell", "loras-tyrell"],
    allies: ["olenna-tyrell"],
    rivals: ["cersei-lannister"],
    startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 4800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 1600, quality: "Thành Thạo" },
          { name: "Cung Thủ Highgarden", type: "Cung Thủ", size: 1600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "quellon-greyjoy", name: "Quellon Greyjoy", tuocVi: "Lãnh Chúa", house: "Greyjoy", role: "Lãnh Chúa Quần Đảo Sắt", religion: "Thần Chết Chìm", blurb: "Cha của Balon. Lãnh chúa sáng suốt đã cố gắng hòa nhập Quần Đảo Sắt với đất liền. Chết trong trận chiến Mander cuối cuộc nổi loạn.",
    birthYear: 225, deathYear: 283, age: 58, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 15, "Tinh Tường": 14, "Uy Tín": 14 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 70, "Trí Mưu": 75, "Ngoại Giao": 70 },
    talentIds: ["learned", "silver-tongue"], skills: { "trading": 9, "cunning": 7 }, equipment: [], items: [], gold: 1000,
    startResources: {
      "Gỗ": 300,
      "Quặng Sắt": 250,
      "Đá": 300,
      "Lương Thực": 400,
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
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
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
    id: "euron-greyjoy", name: "Euron Greyjoy", tuocVi: "Thuyền Trưởng", house: "Greyjoy", role: "Mắt Quạ", religion: "Thần Chết Chìm", blurb: "Em trai tàn nhẫn của Balon.",
    birthYear: 256, age: 26, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 70, "Thống Soái": 75, "Trí Mưu": 80, "Ngoại Giao": 80 },
    talentIds: ["berserker", "schemer", "greenseer"], skills: { "trading": 9, "greensight": 5 }, equipment: [], items: [], gold: 500,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "victarion-greyjoy", "aeron-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
    allies: [],
    rivals: ["asha-greyjoy", "victarion-greyjoy"],
    startArmies: [
          { name: "Bộ Binh Thiết Quần Đảo", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 5, quality: "Thành Thạo" }
        ],
      startRegions: ["the-iron-islands"],
      startHoldings: ["the-iron-islands-seat"],
      holdingsLevel: {"the-iron-islands-seat":5},
      baseIncome: 300
},
  {
    id: "victarion-greyjoy", name: "Victarion Greyjoy", tuocVi: "Thuyền Trưởng", house: "Greyjoy", role: "Tướng Tiên Phong", religion: "Thần Chết Chìm", blurb: "Chiến binh mạnh mẽ và trung thành, em trai Balon.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 12, "Thể Chất": 18, "Trí Tuệ": 8, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 90, "Thống Soái": 60, "Trí Mưu": 40, "Ngoại Giao": 50 },
    talentIds: ["warrior-blood", "beloved", "iron-constitution"], skills: { "axe-mace": 9, "trading": 8 }, equipment: [], items: [], gold: 200,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "euron-greyjoy", "aeron-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
    allies: [],
    rivals: ["euron-greyjoy"],
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
      baseIncome: 100
},
  {
    id: "aeron-greyjoy", name: "Aeron Greyjoy", tuocVi: "Thường Dân", house: "Greyjoy", role: "Em Út Quellon", religion: "Thần Chết Chìm", blurb: "Em út của Balon, trong thời gian này còn trẻ và nông nổi.",
    birthYear: 269, age: 13, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 50, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "quellon-greyjoy", siblings: ["balon-greyjoy", "euron-greyjoy", "victarion-greyjoy"],
    mother: "",
    spouse: "",
    children: [],
    allies: ["victarion-greyjoy"],
    rivals: ["euron-greyjoy"],
    startArmies: [
          { name: "Chiến Binh Đảo Muối", type: "Bộ Binh", size: 60, quality: "Thành Thạo" },
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
    id: "alannys-harlaw", name: "Alannys Harlaw", tuocVi: "Phu Nhân", house: "Greyjoy", role: "Vợ Của Balon", religion: "Thần Chết Chìm", blurb: "Vợ của Balon Greyjoy.",
    birthYear: 258, age: 24, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 10, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 12, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 60 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "balon-greyjoy",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
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
    id: "rodrik-greyjoy", name: "Rodrik Greyjoy", tuocVi: "Người Thừa Kế", house: "Greyjoy", role: "Con Cả Balon", religion: "Thần Chết Chìm", blurb: "Con trai trưởng của Balon.",
    birthYear: 275, age: 7, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 8, "Trí Tuệ": 8, "Tinh Tường": 8, "Uy Tín": 8 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 40, "Trí Mưu": 40, "Ngoại Giao": 40 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
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
    id: "maron-greyjoy", name: "Maron Greyjoy", tuocVi: "Con Trai Thứ", house: "Greyjoy", role: "Con Trai Thứ Balon", religion: "Thần Chết Chìm", blurb: "Con trai thứ hai của Balon.",
    birthYear: 277, age: 5, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 6, "Tinh Tường": 6, "Uy Tín": 6 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 30, "Trí Mưu": 30, "Ngoại Giao": 30 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Thiết Quần Đảo", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
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
    id: "asha-greyjoy", name: "Asha Greyjoy", tuocVi: "Tiểu Thư", house: "Greyjoy", role: "Con Gái Balon", religion: "Thần Chết Chìm", blurb: "Con gái của Balon, mới tập bò.",
    birthYear: 279, age: 3, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 4, "Thể Chất": 4, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 4 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 20, "Trí Mưu": 20, "Ngoại Giao": 20 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw",
    spouse: "",
    children: [],
    siblings: ["theon-greyjoy"],
    allies: [],
    rivals: ["euron-greyjoy"],
    startArmies: [
          { name: "Đội Đột Kích Người Sắt", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
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
    id: "theon-greyjoy", name: "Theon Greyjoy", tuocVi: "Con Út", house: "Greyjoy", role: "Con Út Balon", religion: "Thần Chết Chìm", blurb: "Con trai út của Balon.",
    birthYear: 281, age: 1, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 2, "Thể Chất": 2, "Trí Tuệ": 2, "Tinh Tường": 2, "Uy Tín": 2 },
    năngLực: { "Võ Lực": 10, "Thống Soái": 10, "Trí Mưu": 10, "Ngoại Giao": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 30,
      "Quặng Sắt": 25,
      "Đá": 30,
      "Lương Thực": 40,
      "Ngựa": 0,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "balon-greyjoy", mother: "alannys-harlaw",
    spouse: "",
    children: [],
    siblings: ["asha-greyjoy"],
    allies: ["robb-stark"],
    rivals: ["ramsay-snow"],
    startArmies: [
          { name: "Chiến Binh Đảo Muối", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
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
    id: "rhaenys-targaryen-daughter", name: "Rhaenys Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Con Gái Rhaegar", religion: "Thất Diện Thần", blurb: "Con gái của Rhaegar và Elia, thích ôm chú mèo đen Balerion.",
    birthYear: 280, deathYear: 283, age: 2, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 4, "Thể Chất": 2, "Trí Tuệ": 4, "Tinh Tường": 4, "Uy Tín": 6 },
    năngLực: { "Võ Lực": 10, "Thống Soái": 30, "Trí Mưu": 20, "Ngoại Giao": 20 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "rhaegar-targaryen", mother: "elia-martell",
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
    id: "aegon-targaryen-son", name: "Aegon Targaryen (Trẻ sơ sinh)", tuocVi: "Hoàng Tử", house: "Targaryen", role: "Con Trai Rhaegar", religion: "Thất Diện Thần", blurb: "Con trai mới sinh của Rhaegar và Elia.",
    birthYear: 282, deathYear: 283, age: 0, coreStats: { "Sức Mạnh": 1, "Nhanh Nhẹn": 1, "Thể Chất": 1, "Trí Tuệ": 1, "Tinh Tường": 1, "Uy Tín": 4 },
    năngLực: { "Võ Lực": 5, "Thống Soái": 20, "Trí Mưu": 5, "Ngoại Giao": 5 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "rhaegar-targaryen", mother: "elia-martell",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
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
    id: "mellario-of-norvos", name: "Mellario", tuocVi: "Phu Nhân", house: "Martell", role: "Vợ Của Doran", religion: "Thần Râu", blurb: "Vợ của Doran Martell, đến từ Norvos.",
    birthYear: 250, age: 32, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 8, "Thể Chất": 10, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 60, "Trí Mưu": 60, "Ngoại Giao": 70 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [], spouse: "doran-martell",
    father: "",
    mother: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Chiến Binh Mật Thủy", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Cát Đỏ", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "arianne-martell", name: "Arianne Martell", tuocVi: "Người Thừa Kế", house: "Martell", role: "Con Gái Doran", religion: "Thất Diện Thần", blurb: "Con gái lớn của Doran.",
    birthYear: 276, age: 6, coreStats: { "Sức Mạnh": 4, "Nhanh Nhẹn": 6, "Thể Chất": 6, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 12 },
    năngLực: { "Võ Lực": 20, "Thống Soái": 60, "Trí Mưu": 50, "Ngoại Giao": 50 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Lính Giáo Cát", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Binh Nhẹ Xứ Dorne", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Tẩm Độc", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "quentyn-martell", name: "Quentyn Martell", tuocVi: "Vương Tôn", house: "Martell", role: "Con Trai Doran", religion: "Thất Diện Thần", blurb: "Con trai trưởng của Doran.",
    birthYear: 281, age: 1, coreStats: { "Sức Mạnh": 2, "Nhanh Nhẹn": 2, "Thể Chất": 2, "Trí Tuệ": 2, "Tinh Tường": 2, "Uy Tín": 2 },
    năngLực: { "Võ Lực": 10, "Thống Soái": 10, "Trí Mưu": 10, "Ngoại Giao": 10 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Bộ Binh Sunspear", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Binh Cát Đỏ", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "trystane-martell", name: "Trystane Martell", tuocVi: "Vương Tôn", house: "Martell", role: "Con Út Doran", religion: "Thất Diện Thần", blurb: "Con trai út của Doran.",
    birthYear: 283, age: 0, coreStats: { "Sức Mạnh": 1, "Nhanh Nhẹn": 1, "Thể Chất": 1, "Trí Tuệ": 1, "Tinh Tường": 1, "Uy Tín": 1 },
    năngLực: { "Võ Lực": 5, "Thống Soái": 5, "Trí Mưu": 5, "Ngoại Giao": 5 },
    talentIds: [], skills: {}, equipment: [], items: [], gold: 0,
    startResources: {
      "Gỗ": 10,
      "Quặng Sắt": 10,
      "Đá": 24,
      "Lương Thực": 70,
      "Ngựa": 12,
      "Thép Valyria": 0
    }, startingHookIds: [], father: "doran-martell", mother: "mellario-of-norvos",
    spouse: "",
    children: [],
    siblings: [],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Chiến Binh Mật Thủy", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Sa Mạc", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Người Bắn Nỏ Dorne", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];
