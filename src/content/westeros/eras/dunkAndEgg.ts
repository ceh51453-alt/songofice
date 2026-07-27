import type { CanonCharacter } from "../eras";

export const dunkAndEggCharacters: CanonCharacter[] = [
  {
    id: "aerion-brightflame",
    name: "Aerion Brightflame",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Kẻ Điên Hào Nhoáng",
    religion: "Thất Diện Thần",
    blurb: "Aerion rực rỡ, độc ác và điên rồ. Hắn tự coi mình là rồng mang hình dáng con người. Lòng kiêu ngạo của hắn đã gây ra bi kịch tại Ashford.",
    birthYear: 192,
    deathYear: 232,
    age: 17,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 8, "Uy Tín": 15 },
    talentIds: ["arrogant", "madness", "handsome"],
    skills: { "Thương Kỵ": 14, "Cận Chiến (Kiếm)": 12, "Lãnh Đạo": 10 },
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường Thương Bạc", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Thương chiến được trang trí lộng lẫy" },
      { slot: "Giáp Thân", ten: "Giáp Rồng Lửa Ngọn", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 8, "Uy Tín": 2 }, moTa: "Giáp tinh xảo sơn màu ngọn lửa" }
    ],
    items: [{ ten: "Lọ Cháy Hoang", soLuong: 1, moTa: "Chất lỏng xanh lục nguy hiểm" }],
    gold: 5000, startingHookIds: [],
    father: "maekar-i-targaryen", mother: "dyanna-dayne",
    spouse: "daenora-targaryen",
    children: ["maegor-targaryen"],
    siblings: ["daeron-the-drunken", "aemon-targaryen", "aegon-v-targaryen"],
    allies: [],
    rivals: ["duncan-the-tall"],
    startArmies: [
          { name: "Lính Kích Đỉnh Aegon", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Thành Thạo" }
        ],
    personalHooks: [
      { id: "aerion-ashford", title: "Thử Thách Bằng Chiến Đấu", year: "209 AC", numericYear: 209, desc: "Một tên hiệp sĩ lang thang dám đánh ngươi. Ngươi đòi quyền Xét Xử Bằng Bảy Người để trừng phạt hắn." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "daeron-the-drunken",
    name: "Daeron Mập Mạp",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Say Xỉn",
    religion: "Thất Diện Thần",
    blurb: "Anh trai của Aerion. Daeron thường xuyên say xỉn và ghét việc trở thành hiệp sĩ. Nhưng đằng sau vẻ hèn nhát đó là những giấc mơ tiên tri đầy ám ảnh.",
    birthYear: 190,
    deathYear: 228,
    age: 19,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 6, "Uy Tín": 10 },
    talentIds: ["prophetic", "depressed"],
    skills: { "Ma Thuật (Tiên Tri)": 15 },
    equipment: [],
    items: [{ ten: "Bầu rượu vang Arbor", soLuong: 10, moTa: "Rượu ngon để quên đi ác mộng." }],
    gold: 2000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "maekar-i-targaryen", mother: "dyanna-dayne",
    spouse: "kiera-tyrosh",
    children: ["vaella-targaryen"],
    siblings: ["aerion-brightflame", "aemon-targaryen", "aegon-v-targaryen"],
    allies: [],
    rivals: [],
    startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 29, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 8, quality: "Mới Lập Đội" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 1, quality: "Mới Lập Đội" }
        ],
    personalHooks: [
      { id: "daeron-dream", title: "Giấc Mơ Rồng Chết", year: "209 AC", numericYear: 209, desc: "Ngươi mơ thấy một con rồng khổng lồ ngã xuống một hiệp sĩ cao lớn. Giấc mơ đó ám ảnh ngươi đến mức ngươi trốn khỏi giải đấu." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "rohanne-webber",
    name: "Rohanne Webber",
    tuocVi: "Đại Lãnh Chúa",
    house: "Webber",
    role: "Góa Phụ Đỏ",
    religion: "Thất Diện Thần",
    blurb: "Nữ lãnh chúa xinh đẹp và nguy hiểm của Coldmoat. Bị đồn là giết bốn người chồng trước, nhưng thực ra cô là một phụ nữ thông minh đang cố bảo vệ đất đai của mình.",
    birthYear: 184,
    deathYear: 230,
    age: 26,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 16 },
    talentIds: ["cunning", "seductive", "stubborn"],
    skills: { "Quản Lý": 14, "Thuyết Phục": 15, "Bắn Cung": 12 },
    equipment: [{ slot: "Vũ Khí Phụ", ten: "Cung ngắn", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Xa": 5 }, moTa: "Cung dệt bằng tơ nhện" }],
    items: [{ ten: "Mạng che mặt Góa Phụ Đỏ", soLuong: 1, moTa: "Che đậy nhan sắc và âm mưu" }],
    gold: 15000,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 250,
      "Đá": 500,
      "Lương Thực": 2500,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "wymar-webber",
    mother: "",
    spouse: "eustace-osgrey", // Hoặc gerold-lannister
    children: ["tywald-lannister", "tion-lannister", "tytos-lannister", "jason-lannister"],
    siblings: [],
    allies: ["duncan-the-tall"],
    rivals: [],
    startArmies: [
          { name: "Lính Nhện Độc", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Standfast", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vực", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
    personalHooks: [
      { id: "red-widow", title: "Tranh Chấp Đất Đai", year: "211 AC", numericYear: 211, desc: "Lão Eustace Osgrey đang phàn nàn về dòng suối bị chặn. Ngươi phải giải quyết lão già gàn dở này." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "eustace-osgrey",
    name: "Eustace Osgrey",
    tuocVi: "Đại Lãnh Chúa",
    house: "Osgrey",
    role: "Sư Tử Già",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa nghèo khó của Standfast, từng ủng hộ Blackfyre. Ông sống trong quá khứ huy hoàng của gia tộc và căm ghét Nữ Góa Phụ Đỏ.",
    birthYear: 155,
    age: 56,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 7, "Thể Chất": 8, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 10 },
    talentIds: ["proud", "stubborn", "veteran"],
    skills: { "Chỉ Huy": 12, "Lịch Sử": 15 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Thanh gươm cũ rỉ", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Di vật từ trận Cánh Đồng Cỏ Đỏ" }],
    items: [{ ten: "Huy hiệu Sư Tử Trắng", soLuong: 1, moTa: "Sự kiêu hãnh cuối cùng của Osgrey" }],
    gold: 50,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 250,
      "Đá": 500,
      "Lương Thực": 2500,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "",
    mother: "",
    spouse: "rohanne-webber",
    children: [], // Edwyn, Harrold, Addam đã chết
    siblings: [],
    allies: ["duncan-the-tall"],
    rivals: ["rohanne-webber"],
    startArmies: [
          { name: "Dân Binh Osgrey", type: "Bộ Binh", size: 70, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Osgrey", type: "Cung Thủ", size: 30, quality: "Mới Lập Đội" }
        ], // Chỉ có vài lính tráng và dân thường
    personalHooks: [
      { id: "eustace-pride", title: "Lòng Tự Hào Của Sư Tử Đốm", year: "211 AC", numericYear: 211, desc: "Nhà Webber đã chặn dòng suối. Dù chỉ có vài nông dân, ngươi vẫn muốn chiến đấu vì danh dự." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "daemon-ii-blackfyre",
    name: "Daemon II Blackfyre",
    tuocVi: "Thường Dân",
    house: "Blackfyre",
    role: "John the Fiddler",
    religion: "Thất Diện Thần",
    blurb: "Con trai thứ ba của Daemon Blackfyre. Hắn đóng giả thành hiệp sĩ giang hồ 'John the Fiddler' để âm mưu một cuộc nổi dậy mới tại Whitewalls.",
    birthYear: 188,
    deathYear: 212,
    age: 24,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 13, "Tinh Tường": 10, "Uy Tín": 16 },
    talentIds: ["handsome", "prophetic"],
    skills: { "Thương Kỵ": 12, "Âm Nhạc": 15, "Thuyết Phục": 14 },
    equipment: [{ slot: "Vũ Khí Phụ", ten: "Đàn Vĩ Cầm", phamChat: "Thường", thuocTinh: { "Tôn Trọng": 1 }, moTa: "Dụng cụ che giấu thân phận" }],
    items: [{ ten: "Quả trứng rồng", soLuong: 1, moTa: "Trứng rồng hóa thạch tuyệt đẹp" }],
    gold: 2000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daemon-blackfyre", mother: "rohanne-tyrosh",
    spouse: "",
    children: [],
    siblings: ["aegon-blackfyre", "aemon-blackfyre", "haegon-blackfyre", "aenys-blackfyre"],
    allies: ["bittersteel"],
    rivals: ["bloodraven-hand"],
    startArmies: [
          { name: "Lính Kích Rồng Đen", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Rồng Đen", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ], // Phải dựa vào phản quân
    personalHooks: [
      { id: "daemon-whitewalls", title: "Giấc Mơ Trứng Rồng", year: "212 AC", numericYear: 212, desc: "Ngươi mơ thấy một con rồng nở từ quả trứng tại Whitewalls. Cuộc nổi dậy thứ hai đang nhen nhóm." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
}
];
