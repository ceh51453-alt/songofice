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
  /** Era mà trọng trấn CHƯA tồn tại (ẩn marker seat). VD King's Landing thời Chinh Phạt. */
  seatHiddenEras?: string[];
}

// Kích thước canvas placeholder (mapConfig.ts giữ nguồn chân lý; nhắc lại ở đây cho tiện).
export const MAP_W = 1000;
export const MAP_H = 1500;

export const REGIONS: MapRegion[] = [
  {
    id: "the-north", name: "Phương Bắc", seat: "Winterfell", seatXY: [470, 300],
    polygonPx: [[200, 120], [760, 120], [800, 430], [620, 470], [360, 470], [180, 430]],
    terrain: "Tuyết/Băng Giá", coastal: true, defaultHouse: "stark",
    seatHiddenEras: ["long-night"],
  },
  {
    id: "the-iron-islands", name: "Quần Đảo Sắt", seat: "Pyke", seatXY: [165, 575],
    polygonPx: [[110, 520], [220, 515], [235, 615], [120, 625]],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "greyjoy",
    seatHiddenEras: ["long-night"],
  },
  {
    id: "the-vale", name: "Thung Lũng Arryn", seat: "The Eyrie", seatXY: [745, 585],
    polygonPx: [[645, 490], [835, 470], [865, 665], [705, 705], [650, 600]],
    terrain: "Hẻm Núi", coastal: true, defaultHouse: "arryn",
  },
  {
    id: "the-riverlands", name: "Vùng Sông", seat: "Riverrun", seatXY: [480, 610],
    polygonPx: [[360, 500], [630, 490], [662, 650], [560, 762], [400, 720], [330, 600]],
    terrain: "Sông/Lối Vượt Sông", coastal: false, defaultHouse: "tully",
  },
  {
    id: "the-westerlands", name: "Vùng Tây", seat: "Casterly Rock", seatXY: [275, 690],
    polygonPx: [[200, 560], [340, 560], [392, 720], [300, 822], [190, 762], [172, 642]],
    terrain: "Đồi Núi", coastal: true, defaultHouse: "lannister",
  },
  {
    id: "the-crownlands", name: "Đất Vương Thất", seat: "King's Landing", seatXY: [690, 770],
    polygonPx: [[620, 690], [762, 680], [800, 820], [682, 862], [602, 782]],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "baratheon",
    seatHiddenEras: ["aegon-conquest", "long-night"], // Aegon mới đổ bộ, King's Landing chưa xây; Đêm Trường chưa có
  },
  {
    id: "the-reach", name: "Reach", seat: "Highgarden", seatXY: [390, 965],
    polygonPx: [[200, 840], [470, 782], [600, 852], [560, 1080], [360, 1162], [220, 1020]],
    terrain: "Đồng Bằng", coastal: true, defaultHouse: "tyrell",
  },
  {
    id: "the-stormlands", name: "Vùng Bão", seat: "Storm's End", seatXY: [712, 1000],
    polygonPx: [[620, 882], [802, 852], [832, 1082], [680, 1142], [602, 1002]],
    terrain: "Rừng Rậm", coastal: true, defaultHouse: "baratheon",
  },
  {
    id: "dorne", name: "Dorne", seat: "Sunspear", seatXY: [545, 1290],
    polygonPx: [[360, 1182], [682, 1150], [762, 1322], [560, 1422], [360, 1362]],
    terrain: "Sa Mạc", coastal: true, defaultHouse: "martell",
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
export const REGION_CONTROL_OVERRIDES: Record<string, Record<string, string>> = {
  // Đêm Trường (~8000 BC): chưa có nhà nào — chỉ có bộ tộc Người Đầu Tiên.
  "long-night": {
    "the-north": "stark", // Stark thời cổ đại
    "the-iron-islands": "",
    "the-vale": "",
    "the-riverlands": "",
    "the-westerlands": "",
    "the-crownlands": "",
    "the-reach": "",
    "the-stormlands": "",
    "dorne": "",
  },
  // Chinh Phạt Aegon (1 AC): 7 vương quốc độc lập, Targaryen chưa nắm đất liền.
  "aegon-conquest": {
    "the-crownlands": "", // Aegon đang đổ bộ dựng King's Landing — vô chủ
    "the-riverlands": "hoare", // Harren Đen nắm cả Sông + Đảo Sắt
    "the-iron-islands": "hoare",
    "the-reach": "gardener", // Vua Mern Gardener (trước Tyrell)
    "the-stormlands": "durrandon", // Vua Bão Argilac (trước Baratheon)
  },
  // Vũ Điệu Rồng (129 AC): Targaryen nắm Crownlands, nội chiến hai phe.
  "dance-of-dragons": {
    "the-crownlands": "targaryen",
  },
  // Loạn Blackfyre (195 AC): Daeron II nắm Crownlands, Dorne đã gia nhập vương quốc.
  "blackfyre-rebellion": {
    "the-crownlands": "targaryen",
  },
  // Hiệp Sĩ Bảy Vương Quốc (209 AC): Aerys I nắm Crownlands, Bloodraven làm Bàn Tay.
  "dunk-and-egg": {
    "the-crownlands": "targaryen",
  },
  // Loạn Robert (282): Crownlands còn của Targaryen (Aerys II).
  "roberts-rebellion": {
    "the-crownlands": "targaryen",
  },
  // Loạn Greyjoy (289): giống hậu Loạn Robert — Robert nắm Crownlands.
  "greyjoy-rebellion": {
    // dùng bảng mặc định 298 (Robert là vua).
  },
  // Chiến Tranh Ngũ Vương + Sandbox: dùng bảng mặc định 298.
};

/** Bản đồ chủ quyền đầy đủ cho 1 Era (kế thừa mặc định + override). */
export function regionControlForEra(eraId: string): Record<string, string> {
  return { ...DEFAULT_298, ...(REGION_CONTROL_OVERRIDES[eraId] ?? {}) };
}

/** Trọng trấn hiện đúng theo Era (ẩn seat chưa tồn tại — 9.6.1). */
export function seatVisible(region: MapRegion, eraId: string): boolean {
  return !(region.seatHiddenEras ?? []).includes(eraId);
}
