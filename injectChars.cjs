const fs = require('fs');

const robertsRebellionNewChars = `  ,
  {
    id: "elia-martell", name: "Elia Martell", tuocVi: "Vương phi", house: "Martell", role: "Vợ Của Rhaegar", religion: "Thất Diện Thần",
    blurb: "Sức khỏe yếu ớt nhưng mang dòng máu vương giả Dorne. Cô bị giam lỏng ở Red Keep cùng hai con nhỏ.",
    birthYear: 256, age: 26, coreStats: { STR: 4, AGI: 6, END: 5, INT: 14, WIL: 12, CHA: 15 },
    talentIds: ["gentle", "beloved"], skills: { "Chính Trị": 12, "Ngoại Giao": 15 },
    equipment: [], items: [], gold: 1000
  },
  {
    id: "rhaella-targaryen", name: "Rhaella Targaryen", tuocVi: "Vương Hậu", house: "Targaryen", role: "Hoàng Hậu Đau Khổ", religion: "Thất Diện Thần",
    blurb: "Vợ và em gái của Vua Điên. Bà phải chịu đựng sự lạm dụng của chồng trong nhiều năm.",
    birthYear: 245, age: 37, coreStats: { STR: 5, AGI: 6, END: 6, INT: 13, WIL: 18, CHA: 14 },
    talentIds: ["resilient", "gentle"], skills: { "Chính Trị": 10, "Ngoại Giao": 10 },
    equipment: [], items: [], gold: 500
  },
  {
    id: "catelyn-tully", name: "Catelyn Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Ned", religion: "Thất Diện Thần",
    blurb: "Được hứa hôn với Brandon Stark, nhưng sau khi anh chết, cô kết hôn với em trai anh là Ned để củng cố liên minh.",
    birthYear: 264, age: 18, coreStats: { STR: 6, AGI: 8, END: 10, INT: 14, WIL: 16, CHA: 15 },
    talentIds: ["stubborn", "loyal", "dutiful"], skills: { "Chính Trị": 14, "Ngoại Giao": 14, "Quản Lý": 15 },
    equipment: [], items: [], gold: 800
  },
  {
    id: "lysa-tully", name: "Lysa Tully", tuocVi: "Tiểu Thư", house: "Tully", role: "Vợ Của Jon Arryn", religion: "Thất Diện Thần",
    blurb: "Bị ép kết hôn với một người đáng tuổi ông mình để đổi lấy quân đội của Vale.",
    birthYear: 266, age: 16, coreStats: { STR: 5, AGI: 7, END: 6, INT: 12, WIL: 8, CHA: 13 },
    talentIds: ["paranoia", "jealous"], skills: { "Chính Trị": 10 },
    equipment: [], items: [], gold: 800
  },
  {
    id: "roose-bolton-robert", name: "Roose Bolton", tuocVi: "Lãnh Chúa", house: "Bolton", role: "Lãnh Chúa Dreadfort", religion: "Cựu Thần",
    blurb: "Lạnh lùng và điềm tĩnh, Roose tham gia cuộc khởi nghĩa dưới ngọn cờ của nhà Stark.",
    birthYear: 255, age: 27, coreStats: { STR: 13, AGI: 12, END: 14, INT: 16, WIL: 16, CHA: 12 },
    talentIds: ["schemer", "ruthless"], skills: { "Chỉ Huy": 15, "Chiến Lược": 14 },
    equipment: [], items: [], gold: 1000
  },
  {
    id: "jon-connington", name: "Jon Connington", tuocVi: "Lãnh Chúa", house: "Connington", role: "Bàn Tay Của Aerys", religion: "Thất Diện Thần",
    blurb: "Một hiệp sĩ kiêu hãnh và là bạn thân của Rhaegar. Được phong làm Bàn Tay Nhà Vua để tiêu diệt quân khởi nghĩa.",
    birthYear: 260, age: 22, coreStats: { STR: 15, AGI: 14, END: 15, INT: 14, WIL: 14, CHA: 15 },
    talentIds: ["proud", "loyal"], skills: { "Chỉ Huy": 14, "Cận Chiến (Kiếm)": 15 },
    equipment: [], items: [], gold: 1200
  },
  {
    id: "viserys-targaryen", name: "Viserys Targaryen", tuocVi: "Hoàng Tử", house: "Targaryen", role: "Người Kế Vị Chờ Đợi", religion: "Thất Diện Thần",
    blurb: "Con trai thứ của Vua Điên. Khi chiến tranh nổ ra, cậu chỉ là một đứa trẻ sợ hãi, không biết tương lai lưu vong đang chờ đợi.",
    birthYear: 276, age: 6, coreStats: { STR: 4, AGI: 5, END: 4, INT: 10, WIL: 8, CHA: 12 },
    talentIds: ["arrogant", "madness"], skills: { "Thuyết Phục": 6 },
    equipment: [], items: [], gold: 200
  },
  {
    id: "gerold-hightower", name: "Gerold Hightower", tuocVi: "Hiệp Sĩ", house: "Hightower", role: "Bò Trắng", religion: "Thất Diện Thần",
    blurb: "Tư lệnh đội Vệ Vương. To lớn, trung thành tuyệt đối, ông sát cánh cùng Arthur Dayne bảo vệ Tháp Niềm Vui.",
    birthYear: 225, age: 57, coreStats: { STR: 16, AGI: 12, END: 16, INT: 14, WIL: 18, CHA: 14 },
    talentIds: ["giant-frame", "loyal", "veteran"], skills: { "Cận Chiến (Kiếm)": 18, "Chỉ Huy": 16 },
    equipment: [], items: [], gold: 300
  },
  {
    id: "oswell-whent", name: "Oswell Whent", tuocVi: "Hiệp Sĩ", house: "Whent", role: "Hiệp Sĩ Vệ Vương", religion: "Thất Diện Thần",
    blurb: "Nổi bật với chiếc mũ giáp hình con dơi đen. Ông là người thứ ba bảo vệ Tháp Niềm Vui.",
    birthYear: 245, age: 37, coreStats: { STR: 15, AGI: 15, END: 15, INT: 13, WIL: 15, CHA: 12 },
    talentIds: ["loyal"], skills: { "Cận Chiến (Kiếm)": 16 },
    equipment: [], items: [], gold: 200
  },
  {
    id: "richard-lonmouth", name: "Richard Lonmouth", tuocVi: "Hiệp Sĩ", house: "Lonmouth", role: "Hiệp Sĩ Hộp Sọ", religion: "Thất Diện Thần",
    blurb: "Bạn thân và từng là giám mã của Rhaegar Targaryen, có mặt tại giải đấu Harrenhal định mệnh.",
    birthYear: 258, age: 24, coreStats: { STR: 13, AGI: 14, END: 14, INT: 12, WIL: 13, CHA: 14 },
    talentIds: ["loyal"], skills: { "Cận Chiến (Kiếm)": 14 },
    equipment: [], items: [], gold: 400
  }
];
`;

let robFile = fs.readFileSync('src/content/westeros/eras/robertsRebellion.ts', 'utf8');
robFile = robFile.replace('];', robertsRebellionNewChars);
fs.writeFileSync('src/content/westeros/eras/robertsRebellion.ts', robFile);

const danceOfDragonsNewChars = `  ,
  {
    id: "baela-targaryen", name: "Baela Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Cưỡi Rồng", religion: "Thất Diện Thần",
    blurb: "Con gái của Daemon. Bướng bỉnh, hoang dại, giống cha mình y hệt. Cô cưỡi con rồng Moondancer.",
    birthYear: 116, age: 13, coreStats: { STR: 9, AGI: 15, END: 11, INT: 12, WIL: 16, CHA: 14 },
    talentIds: ["brave", "hot-tempered"], skills: { "Cưỡi Rồng": 12, "Cận Chiến (Kiếm)": 8 },
    equipment: [], items: [], gold: 500,
    dragon: { name: "Moondancer", color: "Xanh lá nhạt", size: "Nhỏ", age: 10, description: "Con rồng nhỏ nhưng bay cực kỳ nhanh", stats: { HP: 100, STR: 6, AGI: 22, INT: 12, WIL: 16 }, skills: { "Bay Lượn": 18, "Lửa Rồng": 8 } }
  },
  {
    id: "rhaena-targaryen", name: "Rhaena Targaryen", tuocVi: "Công Chúa", house: "Targaryen", role: "Cô Gái Dịu Dàng", religion: "Thất Diện Thần",
    blurb: "Em gái sinh đôi của Baela. Dịu dàng, thích múa và quần áo đẹp hơn là kiếm thuật.",
    birthYear: 116, age: 13, coreStats: { STR: 6, AGI: 10, END: 8, INT: 14, WIL: 12, CHA: 16 },
    talentIds: ["gentle", "charming"], skills: { "Chính Trị": 10, "Ngoại Giao": 12 },
    equipment: [], items: [], gold: 500
  },
  {
    id: "harwin-strong", name: "Harwin Strong", tuocVi: "Hiệp Sĩ", house: "Strong", role: "Người Mẻ Cốt", religion: "Cựu Thần",
    blurb: "Người đàn ông mạnh nhất Bảy Vương Quốc, Đội trưởng Đội Gác Thành, và được cho là cha ruột của các con trai Rhaenyra.",
    birthYear: 90, deathYear: 120, age: 30, coreStats: { STR: 20, AGI: 11, END: 18, INT: 9, WIL: 15, CHA: 14 },
    talentIds: ["giant-frame", "strong"], skills: { "Cận Chiến (Kiếm)": 18, "Chỉ Huy": 12 },
    equipment: [], items: [], gold: 800
  },
  {
    id: "mysaria", name: "Mysaria", tuocVi: "Thường Dân", house: "Khác", role: "Sâu Trắng", religion: "Khác",
    blurb: "Cựu kỹ nữ đến từ Lys, trở thành người tình của Daemon và là bậc thầy gián điệp của Rhaenyra.",
    birthYear: 88, age: 41, coreStats: { STR: 5, AGI: 12, END: 8, INT: 18, WIL: 16, CHA: 18 },
    talentIds: ["schemer", "seductive"], skills: { "Tình Báo": 18, "Lừa Lọc": 16, "Quyến Rũ": 18 },
    equipment: [], items: [], gold: 2000
  },
  {
    id: "tyland-lannister", name: "Tyland Lannister", tuocVi: "Hiệp Sĩ", house: "Lannister", role: "Quản Lý Ngân Khố", religion: "Thất Diện Thần",
    blurb: "Phục vụ phe Xanh, đã nhanh tay phân tán ngân khố hoàng gia trước khi Rhaenyra chiếm được vương đô.",
    birthYear: 90, age: 39, coreStats: { STR: 10, AGI: 10, END: 12, INT: 17, WIL: 16, CHA: 13 },
    talentIds: ["schemer", "loyal"], skills: { "Tài Chính": 18, "Chính Trị": 15 },
    equipment: [], items: [], gold: 10000
  },
  {
    id: "jason-lannister", name: "Jason Lannister", tuocVi: "Lãnh Chúa", house: "Lannister", role: "Lãnh Chúa Casterly Rock", religion: "Thất Diện Thần",
    blurb: "Anh trai sinh đôi của Tyland, lãnh chúa giàu có, kiêu ngạo. Dẫn dắt quân đội Tây chiến đấu cho vua Aegon II.",
    birthYear: 90, age: 39, coreStats: { STR: 12, AGI: 11, END: 12, INT: 13, WIL: 12, CHA: 15 },
    talentIds: ["proud", "wealthy"], skills: { "Chỉ Huy": 14, "Tài Chính": 15 },
    equipment: [], items: [], gold: 30000, startArmy: { size: 10000, quality: "Thiện Chiến" }
  },
  {
    id: "ulf-white", name: "Ulf Trắng", tuocVi: "Thường Dân", house: "Khác", role: "Kẻ Nát Rượu", religion: "Thất Diện Thần",
    blurb: "Một kỵ sĩ hạt giống, nát rượu và tham lam, cưỡi con rồng Silverwing.",
    birthYear: 90, age: 39, coreStats: { STR: 14, AGI: 9, END: 13, INT: 6, WIL: 7, CHA: 10 },
    talentIds: ["drunkard", "treacherous"], skills: { "Cưỡi Rồng": 10 },
    equipment: [], items: [], gold: 10,
    dragon: { name: "Silverwing", color: "Bạc", size: "Lớn", age: 93, description: "Rồng hiền hòa", stats: { HP: 280, STR: 18, AGI: 15, INT: 14, WIL: 14 }, skills: { "Lửa Rồng": 14, "Bay Lượn": 14 } }
  },
  {
    id: "orwyle", name: "Orwyle", tuocVi: "Thường Dân", house: "Khác", role: "Đại Maester", religion: "Thất Diện Thần",
    blurb: "Đại Maester của Tiểu Hội Đồng, theo phe Xanh.",
    birthYear: 70, age: 59, coreStats: { STR: 5, AGI: 6, END: 8, INT: 18, WIL: 12, CHA: 10 },
    talentIds: ["learned"], skills: { "Y Thuật": 18, "Lịch Sử": 18, "Học Thuật": 18 },
    equipment: [], items: [], gold: 100
  },
  {
    id: "jasper-wylde", name: "Jasper Wylde", tuocVi: "Lãnh Chúa", house: "Wylde", role: "Gậy Sắt", religion: "Thất Diện Thần",
    blurb: "Quan quản pháp của Vua Viserys, vô cùng cứng nhắc về luật lệ. Ông theo phe Xanh vì luật truyền ngôi cho con trai trưởng.",
    birthYear: 75, age: 54, coreStats: { STR: 9, AGI: 8, END: 12, INT: 16, WIL: 18, CHA: 11 },
    talentIds: ["strict", "just"], skills: { "Luật Pháp": 18, "Chính Trị": 14 },
    equipment: [], items: [], gold: 1000
  },
  {
    id: "sabitha-frey", name: "Sabitha Frey", tuocVi: "Tiểu Thư", house: "Frey", role: "Nữ Tướng", religion: "Thất Diện Thần",
    blurb: "Vợ của lãnh chúa Frey, thích chiến tranh hơn thêu thùa, dẫn dắt quân Frey chiến đấu cho phe Đen.",
    birthYear: 100, age: 29, coreStats: { STR: 13, AGI: 14, END: 15, INT: 12, WIL: 15, CHA: 11 },
    talentIds: ["warrior-blood", "ruthless"], skills: { "Chỉ Huy": 14, "Cận Chiến (Kiếm)": 14 },
    equipment: [], items: [], gold: 800
  }
];
`;
let danceFile = fs.readFileSync('src/content/westeros/eras/danceOfDragons.ts', 'utf8');
danceFile = danceFile.replace('];', danceOfDragonsNewChars);
fs.writeFileSync('src/content/westeros/eras/danceOfDragons.ts', danceFile);
