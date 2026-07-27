// content/westeros/houses.ts
// ============================================================================
// CÁC NHÀ LỚN (8.7) — data dùng chung mọi Era (Era tham chiếu qua availableHouses).
// themeColor GIẢM BÃO HOÀ theo ràng buộc mỹ thuật (điểm 4 đầu prompt).
// ============================================================================

export interface HouseData {
  id: string;
  name: string;
  /** id enum trong StatDataSchema.HOUSES. */
  schemaName: string;
  sigil: string; // mô tả huy hiệu (SVG vẽ theo ở ui/sigils — M7+)
  words: string;
  seat: string;
  region: string;
  themeColor: { primary: string; secondary: string };
}

export const HOUSES_DATA: HouseData[] = [
  { id: "stark", name: "Nhà Stark", schemaName: "Stark", sigil: "Sói tuyết xám trên nền trắng",
    words: "Mùa đông đang đến", seat: "Winterfell", region: "Phương Bắc",
    themeColor: { primary: "#7d8a99", secondary: "#3d4a59" } },
  { id: "lannister", name: "Nhà Lannister", schemaName: "Lannister", sigil: "Sư tử vàng trên nền đỏ thẫm",
    words: "Nghe Ta Gầm!", seat: "Casterly Rock", region: "Phương Tây",
    themeColor: { primary: "#a8654f", secondary: "#8f7a45" } },
  { id: "targaryen", name: "Nhà Targaryen", schemaName: "Targaryen", sigil: "Rồng ba đầu đỏ trên nền đen",
    words: "Lửa và Máu", seat: "Dragonstone", region: "Vịnh Xoáy Nước",
    themeColor: { primary: "#9a5a5f", secondary: "#2e2a33" } },
  { id: "baratheon", name: "Nhà Baratheon", schemaName: "Baratheon", sigil: "Hươu đực vương miện đen trên nền vàng",
    words: "Cơn thịnh nộ của ta là vô song", seat: "Storm's End", region: "Vùng Bão Tố",
    themeColor: { primary: "#8f8348", secondary: "#33312a" } },
  { id: "greyjoy", name: "Nhà Greyjoy", schemaName: "Greyjoy", sigil: "Thủy quái vàng trên nền đen",
    words: "Chúng Ta Không Gieo Trồng", seat: "Pyke", region: "Quần Đảo Sắt",
    themeColor: { primary: "#6d7a72", secondary: "#2c3330" } },
  { id: "tyrell", name: "Nhà Tyrell", schemaName: "Tyrell", sigil: "Hoa hồng vàng trên nền xanh cỏ",
    words: "Đang Trỗi Dậy", seat: "Highgarden", region: "Vùng Reach",
    themeColor: { primary: "#7a9070", secondary: "#8f8348" } },
  { id: "martell", name: "Nhà Martell", schemaName: "Martell", sigil: "Mặt trời đỏ bị giáo xuyên",
    words: "Không Khuất Phục, Không Cúi Đầu, Không Đầu Hàng", seat: "Sunspear", region: "Dorne",
    themeColor: { primary: "#a3764a", secondary: "#8a4f43" } },
  { id: "arryn", name: "Nhà Arryn", schemaName: "Arryn", sigil: "Chim ưng trắng và trăng lưỡi liềm trên nền xanh trời",
    words: "Cao Như Danh Dự", seat: "The Eyrie", region: "Thung Lũng",
    themeColor: { primary: "#7b8fa6", secondary: "#48586b" } },
  { id: "tully", name: "Nhà Tully", schemaName: "Tully", sigil: "Cá hồi bạc trên nền lam đỏ",
    words: "Gia Đình, Nghĩa Vụ, Danh Dự", seat: "Riverrun", region: "Vùng Sông Nước",
    themeColor: { primary: "#6b7f94", secondary: "#8a5348" } },
  { id: "velaryon", name: "Nhà Velaryon", schemaName: "Velaryon", sigil: "Ngựa biển bạc trên nền ngọc lục",
    words: "Cũ Hơn Cả Ngôi Sao", seat: "Driftmark", region: "Quần Đảo Xoáy Nước",
    themeColor: { primary: "#3a6a7a", secondary: "#5a9aab" } },
  { id: "blackfyre", name: "Nhà Blackfyre", schemaName: "Blackfyre", sigil: "Rồng ba đầu đen trên nền đỏ",
    words: "Lửa và Máu", seat: "(Lưu Vong)", region: "(Không có)",
    themeColor: { primary: "#3d1a1a", secondary: "#6b3030" } },
  { id: "hightower", name: "Nhà Hightower", schemaName: "Hightower", sigil: "Ngọn tháp lửa trên nền trắng xám",
    words: "Chúng Ta Soi Sáng Con Đường", seat: "Oldtown", region: "Vùng Reach",
    themeColor: { primary: "#6b705c", secondary: "#a5a58d" } },
  { id: "royce", name: "Nhà Royce", schemaName: "Royce", sigil: "Chấm đen trên nền đồng thiếc",
    words: "Ta Luôn Nhớ", seat: "Runestone", region: "Thung Lũng",
    themeColor: { primary: "#594d46", secondary: "#8b7d6b" } },
  { id: "mudd", name: "Nhà Mudd", schemaName: "Mudd", sigil: "Vương miện vàng nạm ngọc trên nền bùn",
    words: "Quá Khứ Không Thể Gột Rửa", seat: "Oldstones", region: "Vùng Sông Nước",
    themeColor: { primary: "#6e5246", secondary: "#9a7b6c" } },
  { id: "casterly", name: "Nhà Casterly", schemaName: "Casterly", sigil: "Vòng tròn mặt trời trên nền vàng",
    words: "Ánh Sáng Đầu Tiên", seat: "Casterly Rock", region: "Phương Tây",
    themeColor: { primary: "#b08d57", secondary: "#d4af37" } },
  { id: "yronwood", name: "Nhà Yronwood", schemaName: "Yronwood", sigil: "Cổng thành rào sắt đen trên nền cát",
    words: "Máu Hoàng Gia", seat: "Yronwood", region: "Dorne",
    themeColor: { primary: "#8c564b", secondary: "#c49c94" } },
  { id: "greyiron", name: "Nhà Greyiron", schemaName: "Greyiron", sigil: "Mỏ neo sắt trên nền xám",
    words: "Vua Của Muôn Nơi Cướp Bóc", seat: "Orkmont", region: "Quần Đảo Sắt",
    themeColor: { primary: "#454545", secondary: "#666666" } },
  { id: "darklyn", name: "Nhà Darklyn", schemaName: "Darklyn", sigil: "Mũi mác đen trên vạch vàng",
    words: "Sự Bảo Vệ Vĩnh Hằng", seat: "Duskendale", region: "Đất Vương Thất",
    themeColor: { primary: "#4b404d", secondary: "#705d73" } },
  { id: "first-men", name: "Các Bộ Tộc Người Đầu Tiên", schemaName: "Người Đầu Tiên", sigil: "Bàn tay máu trên nền đá",
    words: "Máu Của Đất", seat: "Nhiều Nơi", region: "Westeros",
    themeColor: { primary: "#545454", secondary: "#8c8c8c" } },
  { id: "children", name: "Trẻ Con Rừng", schemaName: "Trẻ Con Rừng", sigil: "Cây Lòng Đỏ mặt khóc",
    words: "Bài Ca Của Đất", seat: "Bên Trong Rừng Thẳm", region: "Westeros",
    themeColor: { primary: "#4a5d23", secondary: "#78866b" } },
  { id: "frey", name: "Nhà Frey", schemaName: "Frey", sigil: "Hai tháp lam trên nền xám",
    words: "Chúng Ta Đứng Vững", seat: "The Twins", region: "Vùng Sông Nước",
    themeColor: { primary: "#5d6d7e", secondary: "#85929e" } },
  { id: "peake", name: "Nhà Peake", schemaName: "Peake", sigil: "Ba tòa tháp đen trên nền cam",
    words: "Cao Ngạo Không Gục Ngã", seat: "Starpike", region: "Vùng Reach",
    themeColor: { primary: "#804000", secondary: "#b36b00" } },
  { id: "bracken", name: "Nhà Bracken", schemaName: "Bracken", sigil: "Ngựa bờm đỏ trên nền nâu",
    words: "Sức Mạnh Dũng Mãnh", seat: "Stone Hedge", region: "Vùng Sông Nước",
    themeColor: { primary: "#8b4513", secondary: "#cd853f" } },
  { id: "targaryen-black", name: "Phe Đen (Rhaenyra)", schemaName: "Targaryen (Phe Đen)", sigil: "Rồng ba đầu đỏ và phần tư Arryn/Velaryon",
    words: "Lửa và Máu", seat: "Dragonstone", region: "Đất Vương Thất",
    themeColor: { primary: "#1c1c1c", secondary: "#3a3a3a" } },
  { id: "targaryen-green", name: "Phe Xanh (Aegon II)", schemaName: "Targaryen (Phe Xanh)", sigil: "Rồng vàng trên nền đen",
    words: "Lửa và Máu", seat: "King's Landing", region: "Đất Vương Thất",
    themeColor: { primary: "#2b4528", secondary: "#4c7347" } },
  // --- Essos Factions ---
  { id: "targaryen-essos", name: "Targaryen (Lưu Vong)", schemaName: "Targaryen (Essos)", sigil: "Rồng ba đầu đỏ trên nền đen",
    words: "Lửa và Máu", seat: "Pentos", region: "Thành Phố Tự Do",
    themeColor: { primary: "#9a5a5f", secondary: "#2e2a33" } },
  { id: "dothraki", name: "Khalasar Dothraki", schemaName: "Khalasar", sigil: "Ngựa hoang trên nền cỏ úa",
    words: "Huyết Mạch Trực Thiết", seat: "Vaes Dothrak", region: "Biển Dothraki",
    themeColor: { primary: "#8f6b45", secondary: "#4a331a" } },
  { id: "braavos", name: "Thành Bang Braavos", schemaName: "Braavos", sigil: "Khổng tượng Titan trên biển",
    words: "Valar Morghulis", seat: "Braavos", region: "Thành Phố Tự Do",
    themeColor: { primary: "#4a687a", secondary: "#1a2c38" } },
  { id: "mercenary", name: "Hội Lính Đánh Thuê", schemaName: "Hội Lính Đánh Thuê", sigil: "Đồng tiền vàng và gươm giáo",
    words: "Vàng quyết định tất cả", seat: "Di động", region: "Essos",
    themeColor: { primary: "#8a7d3b", secondary: "#3d3615" } },
  { id: "ghiscar", name: "Thành Quốc Ghiscar", schemaName: "Ghiscar", sigil: "Nữ thần Harpy",
    words: "Xiềng xích và Quyền lực", seat: "Astapor/Yunkai/Meereen", region: "Vịnh Nô Lệ",
    themeColor: { primary: "#9e7751", secondary: "#4f351e" } },
  { id: "qarth", name: "Thành Quốc Qarth", schemaName: "Qarth", sigil: "Cổng thành nạm ngọc",
    words: "Trung tâm của Thế giới", seat: "Qarth", region: "Eo Biển Ngọc",
    themeColor: { primary: "#69968b", secondary: "#2c4a43" } },
  { id: "free-cities", name: "Công Dân Thành Phố Tự Do", schemaName: "Thành Phố Tự Do", sigil: "Đồng xu vàng",
    words: "Tiền bạc mở mọi cánh cửa", seat: "Thành Phố Tự Do", region: "Essos",
    themeColor: { primary: "#8c7e61", secondary: "#363228" } },
  { id: "custom", name: "Tự Tạo Thế Lực Mới", schemaName: "Tùy Chỉnh", sigil: "Tùy chọn",
    words: "Tùy chọn", seat: "Tùy chọn", region: "Tùy chọn",
    themeColor: { primary: "#a0a0a0", secondary: "#404040" } }
];

export const HOUSES_BY_ID: Record<string, HouseData> = Object.fromEntries(HOUSES_DATA.map((h) => [h.id, h]));

/** Địa danh chính (8.7) — cho lore mặc định + bản đồ M7. */
export const MAJOR_LOCATIONS = [
  "Winterfell", "King's Landing", "The Wall", "Dragonstone", "Casterly Rock",
  "Highgarden", "Sunspear", "The Eyrie", "Riverrun", "Pyke", "Storm's End",
  "Braavos", "White Harbor", "Oldtown",
  "Pentos", "Volantis", "Meereen", "Qarth", "Vaes Dothrak",
] as const;
