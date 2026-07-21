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
];

export const HOUSES_BY_ID: Record<string, HouseData> = Object.fromEntries(HOUSES_DATA.map((h) => [h.id, h]));

/** Địa danh chính (8.7) — cho lore mặc định + bản đồ M7. */
export const MAJOR_LOCATIONS = [
  "Winterfell", "King's Landing", "The Wall", "Dragonstone", "Casterly Rock",
  "Highgarden", "Sunspear", "The Eyrie", "Riverrun", "Pyke", "Storm's End",
  "Braavos", "White Harbor", "Oldtown",
] as const;
