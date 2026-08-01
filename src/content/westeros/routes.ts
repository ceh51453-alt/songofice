// content/westeros/routes.ts
// ============================================================================
// HẠ TẦNG & GIAO THƯƠNG (Tầng 2 & Tầng 3). Toạ độ px ẢNH GỐC — chung hệ với
// regions.ts / mapMarkers.ts, nên zoom qua lại giữa các tầng không lệch.
//   ROADS      — đường quốc lộ nội địa: chỉ hiện ở Tầng 2 (quản lý tầm trung).
//   SEA_LANES  — tuyến hàng hải xuyên lục địa: hiện ở CẢ Tầng 2 và Tầng 3.
//   RIVERS     — sông chính: hiện ở Tầng 2, mờ hơn ở Tầng 3 (địa lý mảng).
//   CLIMATE    — dải khí hậu: chỉ Tầng 3 (phân vùng vĩ mô).
// ============================================================================

export interface MapPath {
  id: string;
  name: string;
  /** đường gãy khúc theo px ảnh gốc. */
  points: [number, number][];
  /** quốc lộ lớn — vẽ đậm hơn và hiện cả ở Tầng 3. */
  main?: boolean;
}

/**
 * Đường quốc lộ — trục hành quân và giao thương nội địa.
 *
 * Các trục CHÍNH chạy hết chiều dài lãnh thổ đúng như nguyên tác: Vương Lộ đi
 * suốt từ Tường Thành (bắc cùng) qua Winterfell, Moat Cailin, Song Thành, Vương
 * Đô rồi xuống tận Bão Tận Địa; Hoa Lộ nối Vương Đô qua Highgarden tới Oldtown.
 * `main: true` = quốc lộ lớn (vẽ đậm, hiện cả ở Tầng 3).
 */
export const ROADS: MapPath[] = [
  {
    id: "kingsroad", name: "Vương Lộ", main: true,
    points: [
      [480, 95], [478, 170], [470, 300], [462, 400], [450, 470], [440, 500],
      [455, 545], [500, 600], [545, 655], [590, 700], [645, 742], [690, 770],
    ],
  },
  {
    id: "roseroad", name: "Hoa Lộ", main: true,
    points: [[690, 770], [620, 800], [540, 820], [440, 830], [420, 900], [390, 965], [320, 1040], [250, 1120]],
  },
  {
    id: "goldroad", name: "Kim Lộ", main: true,
    points: [[690, 770], [600, 768], [520, 760], [445, 738], [380, 715], [275, 690]],
  },
  {
    id: "riverroad", name: "Giang Lộ", main: true,
    points: [[480, 610], [430, 620], [380, 635], [330, 630], [275, 690]],
  },
  {
    id: "highroad", name: "Sơn Lộ (Cổng Máu)", main: true,
    points: [[540, 630], [590, 600], [640, 570], [680, 560], [724, 596], [745, 585]],
  },
  {
    id: "boneway", name: "Cốt Đạo (Dorne)",
    points: [[712, 1000], [755, 1060], [790, 1120], [805, 1180], [810, 1240]],
  },
  {
    id: "oceanroad", name: "Hải Lộ",
    points: [[275, 690], [235, 720], [225, 785], [260, 850], [320, 910], [390, 965]],
  },
  {
    id: "princes-pass", name: "Đèo Vương Tử",
    points: [[440, 830], [500, 900], [570, 1020], [520, 1110], [460, 1190], [400, 1230]],
  },
  {
    id: "causeway", name: "Đường Đắp Cao (Neck)",
    points: [[450, 470], [446, 440], [452, 405], [462, 380]],
  },
  {
    id: "white-harbor-road", name: "Đường Bến Trắng",
    points: [[470, 300], [520, 335], [575, 370], [620, 405], [660, 430]],
  },
  {
    id: "gulltown-road", name: "Đường Gulltown",
    points: [[724, 596], [760, 620], [810, 630], [850, 630]],
  },
  {
    id: "stormlands-road", name: "Đường Vùng Bão",
    points: [[690, 770], [710, 830], [720, 900], [712, 1000]],
  },
  {
    id: "greenblood-road", name: "Đường Lục Huyết Hà",
    points: [[810, 1240], [740, 1270], [635, 1325], [545, 1290]],
  },
  {
    id: "valyrian-coast-road", name: "Valyrian Coast Road", main: true,
    points: [[1320, 535], [1460, 650], [1600, 760], [1660, 920], [1810, 1160], [2000, 1380]],
  },
  {
    id: "rhoyne-road", name: "Rhoyne Road", main: true,
    points: [[1600, 435], [1770, 570], [1810, 720], [1740, 845], [1660, 920]],
  },
  {
    id: "dothraki-road", name: "Dothraki Road", main: true,
    points: [[1800, 480], [2000, 580], [2250, 390], [2470, 620], [2580, 1020], [2790, 1180]],
  },
  {
    id: "slavers-bay-road", name: "Slaver's Bay Road",
    points: [[1660, 920], [1900, 1000], [2110, 1280], [2190, 1190], [2320, 1080], [2390, 970]],
  },
  {
    id: "bone-mountains-road", name: "Bone Mountains Road", main: true,
    points: [[2470, 620], [2690, 650], [2910, 720], [3120, 650], [3320, 720]],
  },
  {
    id: "five-forts-road", name: "Five Forts Road",
    points: [[3120, 650], [3260, 430], [3400, 300]],
  },
];

/** Tuyến hàng hải — thương mại xuyên lục địa (Tầng 2 + Tầng 3). */
export const SEA_LANES: MapPath[] = [
  {
    id: "narrow-sea", name: "Tuyến Biển Hẹp",
    points: [[880, 200], [930, 320], [905, 470], [880, 620], [830, 760], [870, 900], [900, 1100], [860, 1290]],
  },
  {
    id: "sunset-sea", name: "Tuyến Biển Hoàng Hôn",
    points: [[130, 180], [90, 380], [60, 560], [110, 760], [150, 980], [200, 1180], [330, 1380]],
  },
  {
    id: "essos-trade", name: "Tuyến Đông Hải (Essos)",
    points: [[690, 770], [980, 690], [1240, 260], [1320, 535], [1360, 880], [1660, 920]],
  },
  {
    id: "summer-sea", name: "Tuyến Nam Hải",
    points: [[250, 1120], [420, 1330], [820, 1700], [1260, 1730], [1620, 1550], [2110, 1280]],
  },
  {
    id: "jade-sea", name: "Jade Sea Route",
    points: [[2110, 1280], [2450, 1350], [2790, 1180], [2910, 720], [3120, 650], [3330, 1080]],
  },
  {
    id: "shivering-sea", name: "Shivering Sea Route",
    points: [[1240, 260], [1510, 215], [1900, 150], [2250, 120], [2800, 190], [3400, 300]],
  },
  {
    id: "sothoryos-passage", name: "Sothoryos Passage",
    points: [[1660, 920], [1770, 1350], [1880, 1480], [1620, 1550], [2180, 1700], [3100, 1680]],
  },
];

/** Sông chính (Tầng 2). */
export const RIVERS: MapPath[] = [
  { id: "trident", name: "Sông Tam Xoa", points: [[330, 460], [420, 520], [480, 610], [570, 650], [660, 680]] },
  { id: "trident-fork", name: "Nhánh Tam Xoa", points: [[430, 490], [460, 550], [480, 610]] },
  { id: "blackwater", name: "Sông Nước Đen", points: [[520, 770], [610, 750], [690, 770]] },
  { id: "mander", name: "Sông Mander", points: [[520, 770], [420, 850], [390, 965], [280, 1030], [180, 1070]] },
  { id: "greenblood", name: "Sông Lục Huyết", points: [[360, 1180], [540, 1280], [720, 1400]] },
  { id: "rhoyne", name: "Rhoyne", points: [[1770, 570], [1810, 720], [1740, 845], [1660, 920]] },
  { id: "sarne", name: "Sarne", points: [[2090, 285], [2020, 390], [2000, 580], [2100, 700]] },
  { id: "skahazadhan", name: "Skahazadhan", points: [[2390, 970], [2350, 1020], [2320, 1080]] },
];

/** Dải khí hậu vĩ mô (Tầng 3) — y1..y2 theo px ảnh gốc. */
export interface ClimateBand {
  id: string;
  name: string;
  y1: number;
  y2: number;
  tint: string;
}

export const CLIMATE_BANDS: ClimateBand[] = [
  { id: "frozen", name: "Vùng Băng Giá", y1: 0, y2: 300, tint: "#8fb6cc" },
  { id: "cold", name: "Ôn Đới Lạnh", y1: 300, y2: 640, tint: "#7fa08d" },
  { id: "temperate", name: "Ôn Hoà", y1: 640, y2: 1000, tint: "#8fa86a" },
  { id: "warm", name: "Cận Nhiệt", y1: 1000, y2: 1200, tint: "#c2a35c" },
  { id: "arid", name: "Khô Hạn", y1: 1200, y2: 1500, tint: "#c98f52" },
  { id: "tropical", name: "Nhiệt Đới", y1: 1500, y2: 2200, tint: "#5f8f62" },
];

export function pathD(points: [number, number][]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  // đường cong mềm qua các điểm (Catmull-Rom rút gọn thành quadratic)
  let d = `M ${first[0]} ${first[1]}`;
  for (let i = 0; i < rest.length; i++) {
    const prev = i === 0 ? first : rest[i - 1];
    const cur = rest[i];
    d += ` Q ${prev[0]} ${prev[1]} ${(prev[0] + cur[0]) / 2} ${(prev[1] + cur[1]) / 2}`;
    if (i === rest.length - 1) d += ` L ${cur[0]} ${cur[1]}`;
  }
  return d;
}
