// content/westeros/seatProfiles.ts
// ============================================================================
// Quy mô định cư canon: đây là dữ liệu khởi tạo, không phải "dân số chính xác"
// cho mọi năm. Các mốc có nguồn rõ (đặc biệt King's Landing) được tách theo era;
// các thành còn lại là quy mô tương đối để game không dựng một đại đô thị như một
// pháo đài 2.000 dân, hoặc ngược lại.
// ============================================================================
import type { BuildingType } from "./buildings";
import type { CustomBuilding } from "../../mvu/schema";
import type { WallLine } from "../../mvu/schema";
import { EXCHANGE_RATES } from "../../economy/currency";

export type SeatShape =
  | "capital-three-hills"
  | "double-court"
  | "river-triangle"
  | "hill-garden"
  | "cliff-crescent"
  | "desert-towers"
  | "sea-stacks"
  | "mountain-terrace"
  | "river-twins"
  | "ruined-towers"
  | "harbor-city"
  | "cliff-rock"
  | "volcanic-keep"
  | "five-towers"
  | "fortress";

export interface SeatLandmark {
  name: string;
  function: string;
  group?: string;
  /** Là chính lâu đài đầu não, nên thay thế marker Lâu Đài chung thay vì tạo thêm một toà thứ hai. */
  integralToSeat?: boolean;
  housing?: number;
  defense?: number;
  loyalty?: number;
  /** Sản lượng/tháng khi có đủ người vận hành. Ngân Khố dùng đơn vị Đồng Đỏ. */
  produce?: Record<string, number>;
  consume?: Record<string, number>;
  jobs?: Record<string, number>;
  /** toạ độ góc trên-trái trên lưới 1.500 ô; chỉ dùng cho các thắng cảnh quan trọng. */
  at?: [number, number];
}

/** Một thị trấn hay pháo đài phụ thuộc về cùng lãnh địa của trọng trấn. */
export interface SeatSatellite extends SeatLandmark {
  kind: "Thị Trấn" | "Thành Trì Nhỏ";
  /** Quy mô lore để quy đổi thành chỗ ở/công việc của cả cụm công trình. */
  population: number;
}

export interface SeatGate {
  name: string;
  at: [number, number];
  angle: number;
  main?: boolean;
}

export interface SeatProfile {
  ids: string[];
  population: number;
  level: number;
  wallLevel: number;
  shape: SeatShape;
  landmarks: SeatLandmark[];
  /** Tối đa ba điểm phụ để bản đồ lãnh địa không chỉ có một lâu đài đơn độc. */
  satellites?: SeatSatellite[];
}

export interface EraSeatOverride extends Partial<Omit<SeatProfile, "ids">> {
  eraIds: string[];
}

const landmark = (name: string, functionText: string, at?: [number, number], extra: Partial<SeatLandmark> = {}): SeatLandmark => ({
  name, function: functionText, at, ...extra,
});

const satellite = (
  name: string,
  kind: SeatSatellite["kind"],
  population: number,
  functionText: string,
  at: [number, number],
  extra: Partial<SeatSatellite> = {},
): SeatSatellite => ({ name, kind, population, function: functionText, at, ...extra });

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

const PROFILES: SeatProfile[] = [
  { ids: ["the-north-seat", "winterfell"], population: 15_000, level: 4, wallLevel: 3, shape: "double-court", landmarks: [
    landmark("Rừng Thần Winterfell", "Rừng thiêng và nơi hành lễ của nhà Stark", [500, 680], { group: "Tín ngưỡng", loyalty: 2, jobs: { "Nghề Khác": 24 } }),
    landmark("Suối Nước Nóng", "Nước nóng ngầm sưởi các sân trong mùa đông", [810, 820], { group: "Hạ tầng", housing: 500, loyalty: 1, jobs: { "Thợ Mộc": 18, "Nghề Khác": 36 } }),
  ], satellites: [
    satellite("Winter Town", "Thị Trấn", 6_000, "Thị trấn mùa đông dưới chân thành, sống nhờ chợ và kho lương của Winterfell", [680, 1_105], { produce: { "Lương Thực": 95 }, jobs: { "Nông Dân": 120, "Thương Nhân": 45 } }),
    satellite("Castle Cerwyn", "Thành Trì Nhỏ", 2_500, "Pháo đài chư hầu Cerwyn trên tuyến Vương Lộ", [1_075, 900], { defense: 8, jobs: { "Nghề Khác": 55, "Dân Phu": 45 } }),
  ] },
  { ids: ["the-crownlands-seat", "kings-landing"], population: 500_000, level: 5, wallLevel: 3, shape: "capital-three-hills", landmarks: [
    landmark("Red Keep", "Lâu đài hoàng gia trên Đồi Cao Aegon", [880, 800], { group: "Triều đình", integralToSeat: true, defense: 30, loyalty: 2, jobs: { "Kỹ Sư": 40, "Nghề Khác": 240 } }),
    landmark("Đại Thánh Đường Baelor", "Thánh địa trên Đồi Visenya với bảy tháp", [560, 820], { group: "Tín ngưỡng", loyalty: 6, jobs: { "Thợ Thủ Công": 45, "Nghề Khác": 170 } }),
    landmark("Tàn tích Dragonpit", "Mái vòm đổ nát trên Đồi Rhaenys", [580, 450], { group: "Kỳ quan", defense: 4, loyalty: -1, jobs: { "Thợ Đá": 32, "Nghề Khác": 38 } }),
    landmark("Flea Bottom", "Khu lao động nghèo, ngõ hẹp giữa các ngọn đồi", [690, 620], { group: "Khu dân cư", housing: 45_000, jobs: { "Dân Phu": 1_500, "Thợ Thủ Công": 350 } }),
    landmark("Cảng Blackwater", "Bến tàu, kho hàng và chợ cá của thủ đô", [1020, 980], { group: "Thương mại", housing: 8_000, produce: { "Ngân Khố": 240 * G, "Cá Khô": 80 }, jobs: { "Thương Nhân": 500, "Dân Phu": 600, "Thợ Mộc": 90 } }),
  ], satellites: [
    satellite("Rosby", "Thành Trì Nhỏ", 7_000, "Lâu đài Rosby và làng nông nghiệp trên Vương Lộ phía đông bắc", [1_075, 390], { defense: 8, produce: { "Lương Thực": 130 }, jobs: { "Nông Dân": 150, "Nghề Khác": 65 } }),
    satellite("Stokeworth", "Thành Trì Nhỏ", 6_000, "Thành Stokeworth, chư hầu giữ lối vào thủ đô", [405, 445], { defense: 8, produce: { "Lương Thực": 100 }, jobs: { "Nông Dân": 120, "Nghề Khác": 60 } }),
    satellite("Hayford", "Thị Trấn", 5_000, "Thị trấn trên Hoa Lộ, điểm đổi hàng và quân nhu trước cửa nam", [455, 1_065], { produce: { "Ngân Khố": 22 * G, "Lương Thực": 70 }, jobs: { "Thương Nhân": 55, "Nông Dân": 85 } }),
  ] },
  { ids: ["the-westerlands-seat", "casterly-rock"], population: 8_000, level: 5, wallLevel: 2, shape: "cliff-rock", landmarks: [
    landmark("Mỏ vàng Casterly Rock", "Mạch vàng trong khối đá nhìn ra Biển Hoàng Hôn", [730, 700], { group: "Khai khoáng", defense: 12, produce: { "Ngân Khố": 900 * G }, jobs: { "Thợ Mỏ": 850, "Kỹ Sư": 55, "Dân Phu": 220 } }),
  ], satellites: [
    satellite("Kayce", "Thành Trì Nhỏ", 4_000, "Cảng–pháo đài nhỏ của nhà Kenning trên bờ Biển Hoàng Hôn", [420, 780], { defense: 7, produce: { "Cá Khô": 45, "Ngân Khố": 18 * G }, jobs: { "Thương Nhân": 35, "Dân Phu": 65 } }),
    satellite("Silverhill", "Thành Trì Nhỏ", 7_000, "Thành đồi bạc của Westerlands, giữ đường từ Rock vào nội địa", [1_060, 500], { defense: 9, produce: { "Đá": 45 }, jobs: { "Thợ Đá": 70, "Nghề Khác": 55 } }),
  ] },
  { ids: ["the-vale-seat", "the-eyrie"], population: 2_000, level: 4, wallLevel: 2, shape: "mountain-terrace", landmarks: [
    landmark("Moon Door", "Cổng xử tội nhìn xuống vực", [760, 740], { group: "Phòng thủ", defense: 18, loyalty: 1, jobs: { "Nghề Khác": 90, "Kỹ Sư": 15 } }),
  ], satellites: [
    satellite("Gates of the Moon", "Thành Trì Nhỏ", 5_000, "Pháo đài chân núi, nơi đoàn người dừng trước khi lên Eyrie", [670, 1_080], { defense: 11, produce: { "Lương Thực": 55 }, jobs: { "Nghề Khác": 75, "Dân Phu": 70 } }),
    satellite("Bloody Gate", "Thành Trì Nhỏ", 1_800, "Cổng Máu khống chế lối độc đạo vào Vale", [390, 720], { defense: 14, jobs: { "Nghề Khác": 65, "Kỹ Sư": 18 } }),
  ] },
  { ids: ["the-riverlands-seat", "riverrun"], population: 12_000, level: 3, wallLevel: 2, shape: "river-triangle", landmarks: [
    landmark("Cổng Nước Riverrun", "Cống nước biến hai dòng sông thành hào", [780, 700], { group: "Phòng thủ", defense: 12, jobs: { "Kỹ Sư": 30, "Dân Phu": 70 } }),
  ], satellites: [
    satellite("Fairmarket", "Thị Trấn", 18_000, "Thị trấn chợ bên ngã sông, đầu mối hàng hóa của Riverlands", [380, 760], { produce: { "Ngân Khố": 52 * G, "Lương Thực": 100 }, jobs: { "Thương Nhân": 125, "Nông Dân": 130 } }),
    satellite("Acorn Hall", "Thành Trì Nhỏ", 2_500, "Thành nhỏ của nhà Smallwood, che chở các trại ven sông", [1_050, 870], { defense: 7, produce: { "Lương Thực": 45 }, jobs: { "Nghề Khác": 48, "Nông Dân": 60 } }),
  ] },
  { ids: ["the-reach-seat", "highgarden"], population: 20_000, level: 4, wallLevel: 2, shape: "hill-garden", landmarks: [
    landmark("Vườn Hồng Highgarden", "Vườn bậc thang và triều đình Tyrell", [720, 690], { group: "Kỳ quan", housing: 1_000, loyalty: 4, produce: { "Lương Thực": 240, "Rượu Vang": 55 }, jobs: { "Nông Dân": 240, "Thợ Thủ Công": 85 } }),
  ], satellites: [
    satellite("Bitterbridge", "Thị Trấn", 12_000, "Thị trấn cầu qua Mander, nơi quan lộ và thuyền hàng gặp nhau", [420, 920], { produce: { "Ngân Khố": 42 * G, "Lương Thực": 90 }, jobs: { "Thương Nhân": 90, "Nông Dân": 110 } }),
    satellite("Ashford", "Thành Trì Nhỏ", 5_000, "Thành Ashford bảo vệ đường tiến vào Highgarden", [1_025, 555], { defense: 8, produce: { "Lương Thực": 70 }, jobs: { "Nông Dân": 90, "Nghề Khác": 45 } }),
    satellite("Tumbleton", "Thị Trấn", 18_000, "Thị trấn buôn bán ở thượng nguồn Mander", [1_020, 900], { produce: { "Ngân Khố": 48 * G, "Lương Thực": 115 }, jobs: { "Thương Nhân": 105, "Nông Dân": 130 } }),
  ] },
  { ids: ["the-stormlands-seat", "storms-end"], population: 5_000, level: 5, wallLevel: 3, shape: "cliff-crescent", landmarks: [
    landmark("Tường Vòng Storm's End", "Tường thành liền khối chống gió bão", [700, 700], { group: "Phòng thủ", integralToSeat: true, defense: 36, jobs: { "Kỹ Sư": 35, "Dân Phu": 170 } }),
  ], satellites: [
    satellite("Weeping Town", "Thị Trấn", 12_000, "Thị trấn cảng dưới mưa gió vĩnh cửu của bờ biển Stormlands", [1_035, 905], { produce: { "Cá Khô": 55, "Ngân Khố": 28 * G }, jobs: { "Thương Nhân": 65, "Dân Phu": 90 } }),
    satellite("Griffin's Roost", "Thành Trì Nhỏ", 4_000, "Thành của nhà Connington giữ tuyến ven biển đông", [1_045, 445], { defense: 9, jobs: { "Nghề Khác": 55, "Dân Phu": 55 } }),
    satellite("Rain House", "Thành Trì Nhỏ", 3_000, "Pháo đài ven biển ở vùng mưa, chặn cướp biển và bảo vệ làng chài", [420, 780], { defense: 8, produce: { "Cá Khô": 35 }, jobs: { "Thợ Mộc": 35, "Dân Phu": 55 } }),
  ] },
  { ids: ["dorne-seat", "sunspear"], population: 20_000, level: 4, wallLevel: 2, shape: "desert-towers", landmarks: [
    landmark("Tháp Mặt Trời", "Tháp chính của nhà Martell", [710, 700], { group: "Triều đình", integralToSeat: true, defense: 10, loyalty: 2, jobs: { "Nghề Khác": 130, "Kỹ Sư": 20 } }),
    landmark("Tháp Giáo", "Một trong ba tháp cổ của Sunspear", [570, 590], { group: "Phòng thủ", defense: 6, jobs: { "Nghề Khác": 45 } }),
  ], satellites: [
    satellite("Planky Town", "Thị Trấn", 22_000, "Thị trấn nổi trên Greenblood, đầu mối ghe thuyền của Dorne", [640, 1_060], { produce: { "Ngân Khố": 58 * G, "Cá Khô": 50 }, jobs: { "Thương Nhân": 120, "Dân Phu": 150 } }),
    satellite("Ghost Hill", "Thành Trì Nhỏ", 5_000, "Thành của nhà Toland trấn lối đông bắc Sunspear", [1_045, 570], { defense: 8, produce: { "Muối": 35 }, jobs: { "Nghề Khác": 55, "Nông Dân": 55 } }),
    satellite("Water Gardens", "Thị Trấn", 3_000, "Cung viên và khu định cư ven biển của nhà Martell", [420, 820], { loyalty: 2, produce: { "Lương Thực": 45 }, jobs: { "Nông Dân": 70, "Nghề Khác": 35 } }),
  ] },
  { ids: ["the-iron-islands-seat", "pyke"], population: 4_000, level: 3, wallLevel: 1, shape: "sea-stacks", landmarks: [
    landmark("Cầu Dây Pyke", "Những cầu nối các tháp trên trụ đá", [720, 710], { group: "Hạ tầng", defense: 8, produce: { "Cá Khô": 40 }, jobs: { "Thợ Mộc": 35, "Dân Phu": 55 } }),
  ], satellites: [
    satellite("Lordsport", "Thị Trấn", 12_000, "Thị trấn cảng lớn nhất Pyke, đóng thuyền và tập kết chiến lợi phẩm", [1_020, 865], { produce: { "Ngân Khố": 34 * G, "Cá Khô": 70 }, jobs: { "Thương Nhân": 65, "Thợ Mộc": 80, "Dân Phu": 100 } }),
    satellite("Pebbleton", "Thị Trấn", 4_500, "Thị trấn đá nhỏ trên Great Wyk, bến neo của thuyền dài", [430, 545], { produce: { "Đá": 35, "Cá Khô": 30 }, jobs: { "Thợ Đá": 45, "Dân Phu": 55 } }),
  ] },
  { ids: ["castle-black"], population: 700, level: 2, wallLevel: 0, shape: "fortress", landmarks: [
    landmark("Bức Tường", "Tuyến phòng thủ của Tuần Đêm, không phải tường bao đô thị", [720, 400], { group: "Phòng thủ", defense: 30, loyalty: 1, jobs: { "Nghề Khác": 180, "Kỹ Sư": 35 } }),
  ], satellites: [
    satellite("Mole's Town", "Thị Trấn", 1_200, "Thị trấn ngầm dưới chân Bức Tường, buôn bán với Tuần Đêm", [700, 1_055], { produce: { "Lương Thực": 28, "Ngân Khố": 8 * G }, jobs: { "Nghề Khác": 42, "Nông Dân": 28 } }),
    satellite("Queensgate", "Thành Trì Nhỏ", 500, "Pháo đài bỏ hoang của Tuần Đêm, dùng làm chốt quan sát khi có người trấn giữ", [390, 690], { defense: 7, jobs: { "Nghề Khác": 25, "Kỹ Sư": 8 } }),
  ] },
  { ids: ["the-twins"], population: 3_500, level: 3, wallLevel: 2, shape: "river-twins", landmarks: [
    landmark("Cầu Song Sinh", "Cầu thu phí nối hai lâu đài qua Green Fork", [700, 730], { group: "Thương mại", defense: 10, produce: { "Ngân Khố": 85 * G }, jobs: { "Thương Nhân": 75, "Dân Phu": 100 } }),
  ], satellites: [
    satellite("Sevenstreams", "Thị Trấn", 2_000, "Thị trấn ven ngã sông, chợ lương thực và bến phà của vùng Frey", [390, 900], { produce: { "Lương Thực": 38, "Ngân Khố": 10 * G }, jobs: { "Nông Dân": 55, "Thương Nhân": 20 } }),
    satellite("Oldstones", "Thành Trì Nhỏ", 700, "Phế thành cổ của các Vua Sông, dùng làm chốt quan sát đường qua Trident", [1_070, 470], { defense: 5, loyalty: -1, jobs: { "Nghề Khác": 22, "Thợ Đá": 15 } }),
  ] },
  { ids: ["moat-cailin"], population: 500, level: 2, wallLevel: 1, shape: "ruined-towers", landmarks: [
    landmark("Ba Tháp Đổ Moat Cailin", "Di tích khống chế cổ họng Neck", [700, 700], { group: "Phòng thủ", integralToSeat: true, defense: 8, jobs: { "Nghề Khác": 45, "Kỹ Sư": 12 } }),
  ], satellites: [
    satellite("Greywater Watch", "Thành Trì Nhỏ", 800, "Cứ điểm nổi của nhà Reed trong đầm lầy Neck", [420, 820], { defense: 6, produce: { "Thảo Dược": 30 }, jobs: { "Nghề Khác": 35, "Dân Phu": 25 } }),
  ] },
  { ids: ["oldtown"], population: 200_000, level: 5, wallLevel: 2, shape: "harbor-city", landmarks: [
    landmark("Hightower", "Ngọn hải đăng cổ trên Battle Isle", [930, 650], { group: "Kỳ quan", defense: 14, loyalty: 2, produce: { "Ngân Khố": 150 * G }, jobs: { "Thương Nhân": 240, "Kỹ Sư": 80, "Nghề Khác": 120 } }),
    landmark("The Citadel", "Học viện của các maester", [650, 820], { group: "Học thuật", housing: 1_500, loyalty: 2, jobs: { "Kỹ Sư": 180, "Nghề Khác": 320 } }),
  ], satellites: [
    satellite("Honeyholt", "Thành Trì Nhỏ", 6_000, "Thành của nhà Beesbury giữa những vườn ong và đường Honeywine", [400, 920], { defense: 7, produce: { "Sáp Ong": 40, "Lương Thực": 45 }, jobs: { "Nông Dân": 75, "Thợ Thủ Công": 35 } }),
    satellite("Three Towers", "Thành Trì Nhỏ", 3_000, "Cứ điểm ba tháp của nhà Costayne, canh sông và lối vào Oldtown", [1_040, 480], { defense: 8, jobs: { "Nghề Khác": 48, "Kỹ Sư": 14 } }),
    satellite("Uplands", "Thành Trì Nhỏ", 2_500, "Thành đồi của nhà Mullendore, cung cấp lương thực và ngựa cho Oldtown", [1_040, 900], { defense: 6, produce: { "Lương Thực": 55, "Ngựa": 8 }, jobs: { "Nông Dân": 80, "Nghề Khác": 30 } }),
  ] },
  { ids: ["lannisport"], population: 300_000, level: 4, wallLevel: 2, shape: "harbor-city", landmarks: [
    landmark("Cảng Lannisport", "Thương cảng dưới bóng Casterly Rock", [960, 850], { group: "Thương mại", housing: 9_000, produce: { "Ngân Khố": 320 * G, "Cá Khô": 100 }, jobs: { "Thương Nhân": 650, "Dân Phu": 800, "Thợ Mộc": 130 } }),
  ], satellites: [
    satellite("Faircastle", "Thành Trì Nhỏ", 8_000, "Thành cảng của nhà Farman, canh biển tây và buôn bán cùng Lannisport", [390, 680], { defense: 9, produce: { "Cá Khô": 55, "Ngân Khố": 25 * G }, jobs: { "Thương Nhân": 50, "Thợ Mộc": 55 } }),
    satellite("Kayce", "Thành Trì Nhỏ", 4_000, "Pháo đài nhà Kenning bảo vệ bờ biển phía nam Lannisport", [1_050, 480], { defense: 7, produce: { "Cá Khô": 35 }, jobs: { "Nghề Khác": 45, "Dân Phu": 45 } }),
    satellite("Silverhill", "Thành Trì Nhỏ", 7_000, "Thành đồi khoáng sản và trạm thu hàng vào Lannisport", [1_030, 910], { defense: 8, produce: { "Đá": 40 }, jobs: { "Thợ Đá": 65, "Nghề Khác": 50 } }),
  ] },
  { ids: ["white-harbor"], population: 30_000, level: 4, wallLevel: 2, shape: "harbor-city", landmarks: [
    landmark("Wolf's Den", "Pháo đài cảng cổ của White Harbor", [760, 670], { group: "Phòng thủ", defense: 12, produce: { "Cá Khô": 60 }, jobs: { "Thương Nhân": 100, "Dân Phu": 170, "Kỹ Sư": 25 } }),
  ], satellites: [
    satellite("Ramsgate", "Thị Trấn", 4_000, "Bến chợ ngoài tường White Harbor, nơi xe hàng và thuyền ven sông tập kết", [1_025, 900], { produce: { "Cá Khô": 35, "Ngân Khố": 14 * G }, jobs: { "Thương Nhân": 38, "Dân Phu": 55 } }),
    satellite("Hornwood", "Thành Trì Nhỏ", 5_000, "Thành gỗ của nhà Hornwood, cấp gỗ và lông thú cho cảng", [410, 640], { defense: 7, produce: { "Gỗ": 55, "Da Thú": 30 }, jobs: { "Tiều Phu": 75, "Nghề Khác": 35 } }),
  ] },
  { ids: ["dragonstone"], population: 3_000, level: 4, wallLevel: 2, shape: "volcanic-keep", landmarks: [
    landmark("Dragonstone", "Lâu đài Valyria bằng đá núi lửa", [720, 670], { group: "Kỳ quan", integralToSeat: true, defense: 22, loyalty: 2, produce: { "Đá": 70, "Hắc Diện Thạch": 20 }, jobs: { "Thợ Đá": 130, "Kỹ Sư": 45 } }),
  ], satellites: [
    satellite("Spicetown", "Thị Trấn", 12_000, "Thị trấn cảng của Driftmark, chợ gia vị và bến tàu vùng Vịnh Nước Đen", [1_015, 860], { produce: { "Ngân Khố": 38 * G, "Cá Khô": 45 }, jobs: { "Thương Nhân": 75, "Thợ Mộc": 55, "Dân Phu": 75 } }),
    satellite("Sharp Point", "Thành Trì Nhỏ", 3_000, "Pháo đài Cape Wrath trấn lối thủy vào Blackwater Bay", [420, 560], { defense: 8, produce: { "Cá Khô": 25 }, jobs: { "Nghề Khác": 45, "Dân Phu": 35 } }),
    satellite("Driftmark", "Thành Trì Nhỏ", 8_000, "Cứ điểm Velaryon trên đảo kề Dragonstone, bảo vệ hạm đội", [1_000, 500], { defense: 10, produce: { "Ngân Khố": 24 * G }, jobs: { "Thương Nhân": 45, "Thợ Mộc": 60 } }),
  ] },
  { ids: ["harrenhal"], population: 2_500, level: 4, wallLevel: 2, shape: "five-towers", landmarks: [
    landmark("Năm Tháp Harrenhal", "Phế tích khổng lồ cháy đen bên Hồ Mắt Thần", [700, 680], { group: "Kỳ quan", integralToSeat: true, defense: 16, loyalty: -2, jobs: { "Thợ Đá": 80, "Dân Phu": 120 } }),
  ], satellites: [
    satellite("Lord Harroway's Town", "Thị Trấn", 15_000, "Thị trấn chợ bên Trident, nuôi thuyền bè và hàng hóa cho vùng Hồ Mắt Thần", [1_020, 900], { produce: { "Ngân Khố": 44 * G, "Lương Thực": 80 }, jobs: { "Thương Nhân": 95, "Nông Dân": 105 } }),
    satellite("Maidenpool", "Thị Trấn", 18_000, "Thị trấn cảng có tường thành trên vịnh, điểm nghỉ của thương lộ Riverlands", [420, 760], { defense: 7, produce: { "Ngân Khố": 50 * G, "Cá Khô": 40 }, jobs: { "Thương Nhân": 100, "Dân Phu": 105 } }),
  ] },
];

const KINGSLANDING_ERAS: EraSeatOverride[] = [
  { eraIds: ["long-night"], population: 400, level: 1, wallLevel: 0, shape: "fortress", landmarks: [] },
  { eraIds: ["aegon-conquest"], population: 12_000, level: 2, wallLevel: 1, shape: "capital-three-hills", landmarks: [
    landmark("Aegonfort", "Pháo đài đất và gỗ trên Đồi Cao Aegon", [880, 800], { group: "Triều đình", integralToSeat: true, defense: 10, loyalty: 1, jobs: { "Nghề Khác": 80, "Kỹ Sư": 12 } }),
    landmark("Bến Blackwater", "Bến sông của thị trấn đang lớn lên", [1000, 950], { group: "Thương mại", housing: 1_000, produce: { "Ngân Khố": 35 * G, "Cá Khô": 25 }, jobs: { "Thương Nhân": 75, "Dân Phu": 90 } }),
  ] },
  { eraIds: ["dance-of-dragons"], population: 300_000, level: 5, wallLevel: 3, shape: "capital-three-hills", landmarks: [
    landmark("Red Keep", "Lâu đài hoàng gia trên Đồi Cao Aegon", [880, 800], { group: "Triều đình", integralToSeat: true, defense: 30, loyalty: 2, jobs: { "Kỹ Sư": 40, "Nghề Khác": 240 } }),
    landmark("Dragonpit", "Đại chuồng đá cho rồng trên Đồi Rhaenys", [580, 450], { group: "Kỳ quan", defense: 14, loyalty: 2, jobs: { "Kỹ Sư": 70, "Nghề Khác": 160 } }),
    landmark("Thánh đường Visenya", "Thánh đường trước thời Baelor", [560, 820], { group: "Tín ngưỡng", loyalty: 3, jobs: { "Thợ Thủ Công": 30, "Nghề Khác": 100 } }),
    landmark("Cảng Blackwater", "Bến tàu, kho hàng và chợ cá của thủ đô", [1020, 980], { group: "Thương mại", housing: 6_000, produce: { "Ngân Khố": 180 * G, "Cá Khô": 70 }, jobs: { "Thương Nhân": 420, "Dân Phu": 500, "Thợ Mộc": 75 } }),
  ] },
  { eraIds: ["blackfyre-rebellion", "dunk-and-egg", "roberts-rebellion", "greyjoy-rebellion", "war-of-five-kings", "winds-of-winter"], population: 500_000, level: 5, wallLevel: 3, shape: "capital-three-hills", landmarks: PROFILES[1].landmarks },
];

const BY_ID = new Map<string, SeatProfile>();
for (const profile of PROFILES) for (const id of profile.ids) BY_ID.set(id, profile);

/** Hồ sơ base, sau đó ghi đè bằng mốc era khi có. */
export function seatProfileFor(holdingId: string, eraId?: string): SeatProfile | null {
  const base = BY_ID.get(holdingId.toLowerCase());
  if (!base) return null;
  const override = base.ids.includes("kings-landing") || base.ids.includes("the-crownlands-seat")
    ? KINGSLANDING_ERAS.find((entry) => !!eraId && entry.eraIds.includes(eraId))
    : undefined;
  return override ? { ...base, ...override, ids: base.ids } : base;
}

export interface SeatPlanItem {
  type: BuildingType;
  count: number;
  level?: number;
  name?: string;
  custom?: CustomBuilding;
  at?: [number, number];
  /** Công trình tên riêng do lore sinh ra; migration sẽ bổ sung nếu save cũ thiếu. */
  lore?: boolean;
}

function landmarkCustom(site: SeatLandmark): CustomBuilding {
  return {
    "Tên": site.name,
    "Công Năng": site.function,
    "Nhóm": site.group ?? "Kỳ quan",
    "Sản Xuất": site.produce ?? {}, "Tiêu Thụ": site.consume ?? {}, "Nhân Lực": site.jobs ?? {},
    "Sức Chứa Dân": site.housing ?? 0,
    "Phòng Thủ": site.defense ?? 0,
    "Nhân Theo Cấp": false,
    "Lòng Dân/Tháng": site.loyalty ?? 0,
  };
}

/** Cụm thị trấn/pháo đài có marker riêng và ba công trình thực sự vận hành. */
function satelliteConstructionPlan(site: SeatSatellite): SeatPlanItem[] {
  const [x, y] = site.at ?? [750, 750];
  const town = site.kind === "Thị Trấn";
  const level = site.population >= 10_000 ? 2 : 1;
  const custom: CustomBuilding = {
    ...landmarkCustom(site),
    "Công Năng": `${site.function} Quy mô lore khoảng ${site.population.toLocaleString("vi-VN")} dân.`,
    "Nhóm": town ? "Thị trấn phụ" : "Thành trì phụ",
    "Sản Xuất": site.produce ?? (town ? { "Lương Thực": 35 } : { "Lương Thực": 20 }),
    "Nhân Lực": site.jobs ?? (town
      ? { "Nông Dân": Math.max(25, Math.round(site.population * 0.025)), "Nghề Khác": Math.max(18, Math.round(site.population * 0.012)) }
      : { "Nghề Khác": Math.max(20, Math.round(site.population * 0.02)), "Dân Phu": Math.max(15, Math.round(site.population * 0.015)) }),
    "Sức Chứa Dân": site.housing ?? Math.round(site.population * (town ? 0.34 : 0.22)),
    "Phòng Thủ": site.defense ?? (town ? 0 : 6),
  };
  const supporting: Array<{ type: BuildingType; label: string; at: [number, number] }> = town
    ? [
      { type: "Nhà Ở", label: "Nhà ở", at: [x + 55, y + 35] },
      { type: "Chợ", label: "Chợ", at: [x - 60, y + 46] },
      { type: "Nông Trại", label: "Nông trại", at: [x - 12, y - 82] },
    ]
    : [
      { type: "Tháp Canh", label: "Tháp canh", at: [x + 52, y - 46] },
      { type: "Doanh Trại", label: "Doanh trại", at: [x - 72, y + 46] },
      { type: "Kho Lương", label: "Kho lương", at: [x + 52, y + 58] },
    ];
  return [
    { type: "Công Trình Tuỳ Chỉnh", count: 1, level: 1, name: site.name, at: [x, y], custom, lore: true },
    ...supporting.map((building) => ({
      type: building.type, count: 1, level, name: `${building.label} ${site.name}`, at: building.at, lore: true,
    })),
  ];
}

/** Công trình tượng trưng theo quy mô; không nhét hàng trăm biểu tượng nhà/mỏ vào trong tường thành. */
export function seatConstructionPlan(profile: SeatProfile, coastal: boolean): SeatPlanItem[] {
  const urban = profile.population >= 100_000 ? 5 : profile.population >= 30_000 ? 4 : profile.population >= 10_000 ? 3 : profile.population >= 3_000 ? 2 : 1;
  const seatLandmark = profile.landmarks.find((site) => site.integralToSeat);
  const plan: SeatPlanItem[] = [
    {
      type: "Lâu Đài", count: 1, level: profile.level,
      ...(seatLandmark ? { name: seatLandmark.name, custom: landmarkCustom(seatLandmark), lore: true } : {}),
    },
  ];

  // Điểm lore có tọa độ phải chiếm chỗ trước, để chợ/nhà sinh tự động không
  // đẩy kỳ quan khỏi vị trí đặc trưng của nó.
  for (const site of profile.landmarks) {
    if (site.integralToSeat) continue;
    plan.push({
      type: "Công Trình Tuỳ Chỉnh", count: 1, level: 1, name: site.name, at: site.at, lore: true,
      custom: landmarkCustom(site),
    });
  }
  for (const site of (profile.satellites ?? []).slice(0, 3)) plan.push(...satelliteConstructionPlan(site));

  plan.push(
    { type: "Chợ", count: Math.max(1, urban), level: Math.max(1, profile.level - 1) },
    { type: "Doanh Trại", count: Math.max(1, Math.ceil(urban / 2)), level: Math.max(1, profile.level - 1) },
    { type: "Kho Lương", count: Math.max(1, Math.ceil(urban / 2)), level: Math.max(1, profile.level - 1) },
    { type: "Nhà Ở", count: Math.min(12, 2 + urban * 2), level: Math.max(1, urban - 1) },
    { type: "Khu Phố Thợ", count: Math.max(1, urban), level: Math.max(1, urban - 1) },
  );
  if (profile.population < 30_000) plan.push({ type: "Nông Trại", count: Math.max(1, 4 - urban), level: Math.max(1, profile.level - 2) });
  if (coastal && profile.population >= 3_000) plan.push({ type: "Bến Cảng", count: Math.max(1, Math.ceil(urban / 2)), level: Math.max(1, urban - 1) });
  if (profile.wallLevel > 0) plan.push({ type: "Tường Thành", count: 1, level: profile.wallLevel });
  return plan;
}

export function cityPopulationFor(holdingId: string, eraId: string | undefined, fallback: number): number {
  return seatProfileFor(holdingId, eraId)?.population ?? fallback;
}

/** Cổng có vị trí đã biết; hiện ưu tiên thủ đô vì có sơ đồ canon chi tiết. */
export function seatGatesFor(holdingId: string): SeatGate[] | undefined {
  const profile = seatProfileFor(holdingId);
  if (profile?.shape !== "capital-three-hills") return undefined;
  return [
    { name: "Old Gate", at: [560, 330], angle: -2.15 },
    { name: "Dragon Gate — Vương Lộ", at: [760, 320], angle: -Math.PI / 2, main: true },
    { name: "Iron Gate — Rosby Road", at: [910, 390], angle: -0.7 },
    { name: "Gate of the Gods", at: [445, 465], angle: -2.75 },
    { name: "Lion Gate — Kim Lộ", at: [470, 915], angle: 2.65 },
    { name: "King's Gate", at: [625, 1080], angle: 2.05 },
    { name: "Mud Gate — Hoa Lộ", at: [855, 1120], angle: 1.05 },
  ];
}

/** Tường hệ thống của trọng trấn. Chỉ các vòng sinh tự động mới bị migration thay thế. */
export function seatWallsFor(holdingId: string, eraId: string | undefined, level: number): WallLine[] {
  const profile = seatProfileFor(holdingId, eraId);
  const wallLevel = profile?.wallLevel ?? (level >= 2 ? Math.max(1, level - 1) : 0);
  if (wallLevel < 1) return [];
  const c = 750;
  const r = 90 + Math.max(level, profile?.level ?? 1) * 35;
  const closed = (coords: Array<[number, number]>) => {
    const pts = coords.map(([x, y]) => ({ x, y }));
    if (pts.length && (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y)) pts.push({ ...pts[0] });
    return pts;
  };
  const ring = () => Array.from({ length: 13 }, (_, i) => {
    const th = (i / 12) * Math.PI * 2;
    const rr = r * (0.92 + 0.16 * Math.abs(Math.sin(th * 2.5)));
    return { x: Math.round(c + Math.cos(th) * rr), y: Math.round(c + Math.sin(th) * rr) };
  });
  const shape = profile?.shape;
  const loops = shape === "capital-three-hills" ? [closed([
    [445, 465], [560, 330], [760, 320], [910, 390], [1010, 530], [1040, 700], [1130, 835],
    [1050, 1035], [855, 1120], [625, 1080], [470, 915], [405, 680],
  ])]
    : shape === "double-court" ? [
      closed([[470, 450], [760, 400], [1020, 510], [1050, 780], [950, 1030], [660, 1080], [430, 880], [400, 620]]),
      closed([[575, 560], [790, 520], [925, 625], [900, 845], [730, 930], [555, 820]]),
    ]
    : shape === "river-triangle" ? [closed([[470, 520], [1010, 630], [620, 1060]])]
    : shape === "river-twins" ? [
      closed([[435, 570], [635, 540], [670, 800], [450, 830]]),
      closed([[835, 570], [1035, 540], [1050, 830], [830, 800]]),
    ]
    : shape === "harbor-city" ? [closed([[430, 450], [760, 360], [990, 440], [1050, 650], [1015, 980], [790, 1110], [515, 1040], [410, 760]])]
    : shape === "cliff-crescent" ? [closed([[480, 470], [710, 390], [965, 500], [1025, 760], [910, 930], [650, 980], [455, 820]])]
    : shape === "desert-towers" ? [closed([[490, 520], [760, 410], [1010, 560], [980, 900], [720, 1050], [470, 870]])]
    : shape === "five-towers" ? [closed([[410, 460], [690, 360], [1020, 490], [1100, 800], [900, 1080], [580, 1060], [380, 770]])]
    : shape === "cliff-rock" ? [closed([[560, 420], [760, 340], [960, 450], [1040, 640], [960, 860], [700, 990], [490, 790], [470, 570]])]
    : shape === "mountain-terrace" ? [
      closed([[610, 420], [810, 370], [940, 500], [890, 760], [680, 870], [540, 690]]),
      closed([[660, 520], [795, 485], [855, 590], [810, 710], [690, 750], [625, 640]]),
    ]
    : shape === "hill-garden" ? [
      closed([[430, 480], [700, 365], [990, 470], [1050, 760], [870, 1040], [570, 1020], [410, 780]]),
      closed([[560, 550], [740, 485], [900, 570], [900, 755], [755, 875], [570, 790]]),
    ]
    : shape === "sea-stacks" ? [
      closed([[470, 570], [620, 510], [690, 670], [610, 830], [470, 770]]),
      closed([[790, 460], [945, 520], [920, 720], [790, 760], [730, 590]]),
      closed([[930, 800], [1040, 850], [1015, 1010], [875, 985]]),
    ]
    : shape === "ruined-towers" ? [
      closed([[480, 560], [600, 500], [640, 650], [540, 710]]),
      closed([[760, 430], [885, 490], [850, 640], [735, 610]]),
      closed([[875, 770], [1010, 830], [960, 990], [830, 920]]),
    ]
    : shape === "volcanic-keep" ? [closed([[500, 560], [650, 380], [880, 420], [1040, 620], [950, 900], [720, 1040], [500, 860], [430, 690]])]
    : shape === "fortress" ? [closed([[540, 510], [900, 510], [980, 700], [900, 930], [570, 930], [500, 720]])]
    : [ring()];
  return loops.map((points, i) => ({
    "Mã": `wall-${i === 0 ? "keep" : `court-${i}`}`,
    "Tên": i === 0 ? "Tường Thành" : "Tường Thành Nội",
    "Cấp": Math.max(1, Math.min(4, wallLevel)),
    "Vật Liệu": "Đá",
    "Điểm": points,
    "Chiều Dài": Math.round(points.slice(1).reduce((total, p, ix) => total + Math.hypot(p.x - points[ix].x, p.y - points[ix].y), 0)),
    "Đang Xây": false,
    "Ngày Xây Còn Lại": 0,
    "Nguyên Vẹn": 100,
  }));
}
