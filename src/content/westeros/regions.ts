// content/westeros/regions.ts
// ============================================================================
// ĐỊA LÝ CHUẨN WESTEROS (9.6.1) — 9 vùng canon + trọng trấn + gate theo Era.
// "cắm ảnh + chỉnh vùng của bạn là chạy" (9.6.2): toạ độ polygon tính theo px
// ẢNH GỐC (mapConfig.ts). Đây là PLACEHOLDER (vẽ tay) — thay ảnh thật chỉ cần
// cập nhật polygon qua map editor, KHÔNG đụng engine bản đồ.
//
// Nhà kiểm soát KHÔNG hard-code trong render: đọc động từ stat_data."Chủ Quyền
// Lãnh Thổ" (9.5.1). Bảng dưới chỉ là MẶC ĐỊNH lúc initvar theo Era.
// ============================================================================
import type { Terrain } from "../../mvu/schema";

export interface MapRegion {
  id: string; // regionId — khớp "Chủ Quyền Lãnh Thổ"[id] + "Lãnh Địa"[id]
  name: string;
  seat: string; // trọng trấn (castle chính)
  seatXY: [number, number]; // px trên ảnh gốc
  polygonPx: [number, number][]; // viền vùng (px ảnh gốc)
  terrain: Terrain; // địa hình chủ đạo (nối 7.6)
  coastal: boolean; // giáp biển → mở Bến Cảng
  /** Nhà cai trị mặc định ở mốc 298 AC (Chiến Tranh Ngũ Vương) — houseId. */
  defaultHouse: string;
  /** Dân số vĩ mô của toàn vùng (người). */
  population: number;
  /** Dân số của riêng trọng trấn (seat) - ví dụ King's Landing. */
  seatPopulation?: number;
  /** Era mà trọng trấn CHƯA tồn tại (ẩn marker seat). VD King's Landing thời Chinh Phạt. */
  seatHiddenEras?: string[];
}

// Kích thước canvas placeholder (mapConfig.ts giữ nguồn chân lý; nhắc lại ở đây cho tiện).
export const MAP_W = 1000;
export const MAP_H = 1500;

export const REGIONS: MapRegion[] = [
  {
    id: "the-north", name: "Phương Bắc", seat: "Winterfell", seatXY: [470, 300],
    polygonPx: [
      [200, 95], [380, 95], [520, 95], [760, 95], [785, 160], [740, 220],
      [820, 270], [790, 340], [830, 390], [740, 440], [640, 480], [530, 490],
      [420, 485], [330, 460], [280, 480], [220, 440], [170, 430], [210, 360],
      [150, 310], [230, 270], [180, 210], [260, 160]
    ],
    terrain: "Tuyết/Băng Giá", coastal: true, defaultHouse: "stark", population: 4000000, seatPopulation: 15000,
    seatHiddenEras: ["long-night"],
  },
  {
    id: "the-iron-islands", name: "Quần Đảo Sắt", seat: "Pyke", seatXY: [75, 545],
    polygonPx: [
      [30, 480], [70, 470], [110, 490], [115, 530], [105, 575], [70, 595],
      [35, 580], [20, 530]
    ],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "greyjoy", population: 1500000, seatPopulation: 10000,
    seatHiddenEras: ["long-night"],
  },
  {
    id: "the-vale", name: "Thung Lũng Arryn", seat: "The Eyrie", seatXY: [745, 585],
    polygonPx: [
      [640, 480], [655, 540], [630, 610], [660, 680], [740, 715], [820, 690],
      [880, 660], [850, 620], [890, 580], [920, 530], [880, 490], [810, 465],
      [720, 455]
    ],
    terrain: "Hẻm Núi", coastal: true, defaultHouse: "arryn", population: 4000000, seatPopulation: 10000,
  },
  {
    id: "the-riverlands", name: "Vùng Sông", seat: "Riverrun", seatXY: [480, 610],
    polygonPx: [
      [330, 460], [420, 485], [530, 490], [640, 480], [655, 540], [630, 610],
      [660, 680], [590, 730], [520, 770], [430, 750], [360, 715], [330, 650],
      [340, 560]
    ],
    terrain: "Sông/Lối Vượt Sông", coastal: false, defaultHouse: "tully", population: 5500000, seatPopulation: 20000,
  },
  {
    id: "the-westerlands", name: "Vùng Tây", seat: "Casterly Rock", seatXY: [275, 690],
    polygonPx: [
      [330, 460], [340, 560], [330, 650], [360, 715], [320, 770], [270, 810],
      [200, 790], [180, 730], [190, 650], [180, 600], [210, 550], [240, 545]
    ],
    terrain: "Đồi Núi", coastal: true, defaultHouse: "lannister", population: 5000000, seatPopulation: 50000,
  },
  {
    id: "the-crownlands", name: "Đất Vương Thất", seat: "King's Landing", seatXY: [690, 770],
    polygonPx: [
      [520, 770], [590, 730], [660, 680], [740, 715], [820, 690], [870, 740],
      [840, 800], [790, 840], [720, 870], [640, 840], [590, 780]
    ],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "baratheon", population: 2000000, seatPopulation: 500000,
    seatHiddenEras: ["aegon-conquest", "long-night"],
  },
  {
    id: "the-reach", name: "Reach", seat: "Highgarden", seatXY: [390, 965],
    polygonPx: [
      [270, 810], [320, 770], [360, 715], [430, 750], [520, 770], [590, 780],
      [640, 840], [570, 860], [610, 940], [570, 1010], [590, 1100], [480, 1140],
      [360, 1180], [250, 1160], [180, 1070], [210, 960], [150, 880], [160, 790]
    ],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "tyrell", population: 12000000, seatPopulation: 80000,
  },
  {
    id: "the-stormlands", name: "Vùng Bão", seat: "Storm's End", seatXY: [712, 1000],
    polygonPx: [
      [640, 840], [720, 870], [790, 840], [850, 880], [880, 950], [840, 1030],
      [770, 1100], [670, 1140], [590, 1100], [570, 1010], [610, 940], [570, 860]
    ],
    terrain: "Rừng Rậm", coastal: true, defaultHouse: "baratheon", population: 2500000, seatPopulation: 15000,
  },
  {
    id: "dorne", name: "Dorne", seat: "Sunspear", seatXY: [545, 1290],
    polygonPx: [
      [250, 1160], [360, 1180], [480, 1140], [590, 1100], [670, 1140], [770, 1100],
      [830, 1160], [870, 1240], [810, 1330], [720, 1400], [580, 1440], [440, 1410],
      [330, 1350], [280, 1260]
    ],
    terrain: "Sa Mạc", coastal: true, defaultHouse: "martell", population: 1800000, seatPopulation: 30000,
  },
];

export const REGIONS_BY_ID: Record<string, MapRegion> = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

/** Bảng mặc định 298 AC (Chiến Tranh Ngũ Vương) — dùng làm nền cho các Era khác. */
const DEFAULT_298: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.id, r.defaultHouse]));

/**
 * Nhà cai trị mỗi vùng theo TỪNG Era (9.6.1) — điểm "đúng tiểu thuyết".
 * Chỉ khai KHÁC biệt so với bảng 298; phần còn lại kế thừa DEFAULT_298.
 * "" = vô chủ / đang tranh chấp. Sửa file này = đổi bản đồ, KHÔNG đụng engine.
 */
/** Màu đại diện cho từng Phe (khi render MapMode = "faction"). Ánh xạ tên phe -> mã nhà chứa màu. */
export const FACTION_COLORS_MAP: Record<string, string> = {
  "Phe Đen": "targaryen-black",
  "Phe Xanh": "targaryen-green",
  "Targaryen Vương Thất": "targaryen",
  "Phe Blackfyre": "blackfyre",
  "Phe Khởi Nghĩa": "baratheon",
  "Phe Ngai Sắt": "lannister",
  "Phe Phương Bắc": "stark",
  "Phe Stannis": "baratheon",
  "Phe Renly": "tyrell", // Hoặc nhà Tyrell hậu thuẫn
  "Phe Đảo Sắt": "greyjoy"
};

/** Phe phái theo từng năm (Nội Chiến / Xung Đột) */
export function factionsForYear(year: number): Record<string, string[]> | null {
  if (year >= 129 && year <= 131) {
    return {
      "Phe Đen": ["targaryen-black", "stark", "arryn", "tully", "velaryon"],
      "Phe Xanh": ["targaryen-green", "lannister", "baratheon", "hightower"]
    };
  }
  if (year >= 195 && year <= 196) { // Loạn Blackfyre lần 1
    return {
      "Targaryen Vương Thất": ["targaryen", "arryn", "martell", "tully", "lannister", "baratheon", "stark"],
      "Phe Blackfyre": ["blackfyre", "bracken", "yronwood", "peake"]
    };
  }
  if (year >= 282 && year <= 283) { // Loạn Robert
    return {
      "Phe Khởi Nghĩa": ["baratheon", "stark", "arryn", "tully"],
      "Targaryen Vương Thất": ["targaryen", "tyrell", "martell"]
    };
  }
  if (year >= 298 && year <= 300) { // Chiến tranh Ngũ Vương
    return {
      "Phe Ngai Sắt": ["lannister", "tyrell"],
      "Phe Phương Bắc": ["stark", "tully"],
      "Phe Stannis": ["baratheon"], 
      "Phe Đảo Sắt": ["greyjoy"]
    };
  }
  return null;
}

/** Bản đồ chủ quyền đầy đủ theo Từng Năm. Dựa trên các cột mốc lịch sử chính. */
export function regionControlForYear(year: number): Record<string, string> {
  const control = { ...DEFAULT_298 };
  
  if (year < 1) { // Trước Chinh Phạt (bao gồm Đêm Trường)
    control["the-north"] = "stark";
    control["the-iron-islands"] = "greyiron"; // hoặc hoare sát mốc 1 AC
    control["the-vale"] = "royce"; // sau là Arryn
    control["the-riverlands"] = "mudd"; // sau là Durrandon/Hoare
    control["the-westerlands"] = "casterly"; // sau là Lannister
    control["the-crownlands"] = "darklyn";
    control["the-reach"] = "gardener";
    control["the-stormlands"] = "durrandon";
    control["dorne"] = "yronwood"; // hoặc martell
  } else if (year === 1) { // Chinh Phạt Aegon
    control["the-crownlands"] = "targaryen";
    control["the-riverlands"] = "hoare";
    control["the-iron-islands"] = "hoare";
    control["the-reach"] = "gardener";
    control["the-stormlands"] = "durrandon";
    control["the-westerlands"] = "lannister";
    control["the-vale"] = "arryn";
    control["the-north"] = "stark";
    control["dorne"] = "martell";
  } else if (year > 1 && year < 283) { // Triều đại Targaryen
    control["the-crownlands"] = "targaryen";
    
    // Vũ Điệu Rồng 129 - 131
    if (year >= 129 && year <= 131) {
      control["the-crownlands"] = "targaryen-black"; // Rhaenyra nắm Dragonstone
      control["the-reach"] = "tyrell"; // Hightower (Xanh) là chư hầu
    }
  } else if (year >= 283 && year < 299) { // Triều đại Baratheon (hậu Loạn Robert)
    control["the-crownlands"] = "baratheon";
  } else if (year >= 299) { // Chiến tranh Ngũ Vương & Gió Mùa Đông
    control["the-crownlands"] = "lannister"; // Thực tế Tommen/Cersei
    if (year >= 300) {
      control["the-north"] = "bolton";
      control["the-riverlands"] = "frey";
    }
  }

  return control;
}

/** Tương thích với hệ thống Test và Era cũ. Chuyển đổi Era ID thành năm tương ứng để lấy bản đồ. */
export function regionControlForEra(eraId: string): Record<string, string> {
  const eraToYear: Record<string, number> = {
    "long-night": -8000,
    "aegon-conquest": 1,
    "dance-of-dragons": 129,
    "blackfyre-rebellion": 195,
    "dunk-and-egg": 209,
    "roberts-rebellion": 282,
    "greyjoy-rebellion": 289,
    "war-of-five-kings": 298,
    "winds-of-winter": 300
  };
  const year = eraToYear[eraId] ?? 298;
  return regionControlForYear(year);
}

/** Trọng trấn hiện đúng theo Era (ẩn seat chưa tồn tại — 9.6.1). */
export function seatVisible(region: MapRegion, eraId: string): boolean {
  return !(region.seatHiddenEras ?? []).includes(eraId);
}
