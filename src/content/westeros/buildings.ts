// content/westeros/buildings.ts
// ============================================================================
// DANH MỤC CÔNG TRÌNH (10.2) + bảng chi phí/thời gian (10.3). Data thuần —
// thêm loại công trình = thêm 1 entry (nhớ khai cả trong BUILDING_TYPES của
// schema), KHÔNG đổi cấu trúc. Engine (construction.ts) chỉ đọc bảng này.
//
// Năm thứ một công trình cần khai (M18):
//   cost   — vật tư trả MỘT LẦN lúc khởi công (Vàng trừ ngân khố, còn lại trừ kho)
//   labour — NHÂN LỰC bị công trường chiếm dụng suốt thời gian thi công, trả về
//            khi xong. Không đủ người thì không động thổ được, dù thừa tiền.
//   jobs   — CHỖ LÀM VIỆC khi đã hoạt động: trần nhân lực của công trình. Ruộng
//            giữ bao nhiêu nông dân, lò rèn giữ bao nhiêu thợ — dân thừa mà chỗ
//            làm đã kín thì thành THẤT NGHIỆP. Sản lượng nhân thẳng với tỉ lệ
//            lấp đầy, nên một nông trại thiếu người chỉ ra nửa số thóc.
//   housing— SỨC CHỨA DÂN CƯ. Dân vượt trần chỗ ở = vô gia cư = mất lòng dân.
//   consume/yield/upkeep — nguyên liệu ăn vào, làm ra, và phí duy trì MỖI THÁNG.
// ============================================================================
import type { BUILDING_TYPES, JobKey } from '../../mvu/schema';
import { EXCHANGE_RATES } from '../../economy/currency';
import { turnsToDays } from '../../mvu/calendar';
import type { LocalTerrain } from './terrain';

export type BuildingType = (typeof BUILDING_TYPES)[number];

/** 10 khoá kho LÕI — mọi engine cũ dựa vào đúng danh sách này. */
export const RESOURCE_LIST = [
  "Ngân Khố", "Lương Thực", "Gỗ", "Đá", "Quặng Sắt",
  "Than Đá", "Thép", "Vải Vóc", "Ngựa", "Muối",
] as const;

export type CoreResourceKey = (typeof RESOURCE_LIST)[number];

/**
 * Khoá kho lãnh địa. 10 khoá lõi được gợi ý tự động; ngoài ra CHẤP NHẬN mọi mã
 * hàng hoá trong content/westeros/goods.ts — kho lãnh địa là record mở nên thêm
 * mặt hàng mới không phải sửa một dòng schema nào.
 */
export type ResourceKey = CoreResourceKey | (string & {});

/** Nhân lực công trường — nghề bị chiếm dụng trong lúc thi công. */
export type LabourKey = "Dân Phu" | "Thợ Đá" | "Thợ Mộc" | "Thợ Rèn" | "Kỹ Sư";
export const LABOUR_LIST: LabourKey[] = ["Dân Phu", "Thợ Đá", "Thợ Mộc", "Thợ Rèn", "Kỹ Sư"];

/** Nhóm chức năng — chỉ để xếp bảng chọn công trình cho dễ nhìn. */
export type BuildingCategory =
  | "Hành Chính" | "Dân Cư" | "Lương Thực" | "Khai Thác" | "Chế Tác" | "Thương Mại" | "Đặc Biệt";
export const BUILDING_CATEGORIES: BuildingCategory[] = [
  "Hành Chính", "Dân Cư", "Lương Thực", "Khai Thác", "Chế Tác", "Thương Mại", "Đặc Biệt",
];

export interface BuildingDef {
  type: BuildingType;
  category: BuildingCategory;
  desc: string;
  /** tóm tắt hiệu ứng cho thẻ UI ("+200 Lương Thực/tháng"). */
  effectSummary: string;
  /** chi phí CẤP 1 (cấp n = ×n). Vàng trừ ngân khố người chơi; còn lại trừ kho vùng. */
  cost: Partial<Record<ResourceKey, number>>;
  /** nhân công bị giữ trong suốt thời gian xây (cấp n = ×n). */
  labour?: Partial<Record<LabourKey, number>>;
  /** số THÁNG xây CẤP 1 (cấp n = +50% mỗi cấp). Quy ra ngày qua buildingDays(). */
  buildMonths: number;
  /** thu mỗi THÁNG khi đã xây xong (×Cấp Độ ×tỉ lệ lấp đầy nhân lực). */
  yield?: Partial<Record<ResourceKey, number>>;
  /** nguyên liệu ăn vào mỗi THÁNG để chạy (×Cấp Độ). Thiếu thì xưởng đứng máy. */
  consume?: Partial<Record<ResourceKey, number>>;
  /** phí DUY TRÌ mỗi THÁNG dù có sản xuất hay không (×Cấp Độ). */
  upkeep?: Partial<Record<ResourceKey, number>>;

  // ── Dân cư & việc làm (M18) ──
  /** chỗ làm việc theo nghề (×Cấp Độ) — TRẦN nhân lực của công trình. */
  jobs?: Partial<Record<JobKey, number>>;
  /** sức chứa dân cư (×Cấp Độ) — nâng trần dân số của lãnh địa. */
  housing?: number;

  /** chỉ xây được ở lãnh địa ven biển (10.2). */
  requiresCoastal?: boolean;
  /** cờ hiệu ứng cho engine/UI (phòng thủ, tuyển quân, lòng dân...). */
  flags?: {
    defense?: number;
    recruit?: boolean;
    port?: boolean;
    shipyard?: boolean;
    loyaltyPerMonth?: number;
    adminSpeedup?: number; // giảm % thời gian xây các công trình khác
    /** giảm % hao hụt kho lương mỗi tháng. */
    storage?: number;
    /** +% thu Vàng từ thương mại của cả lãnh địa. */
    trade?: number;
    /** +% sức chứa dân cư toàn lãnh địa (hạ tầng đô thị). */
    housingBonus?: number;
  };

  // ── Quy hoạch Tầng 1 (lưới 5 m) ──
  /** cạnh khuôn viên tính bằng Ô lưới (1 ô = 5 m). */
  footprint: number;
  /** địa hình đặt được (bỏ trống = mọi địa hình xây được). */
  terrain?: LocalTerrain[];
  /**
   * CÔNG TRÌNH ĐẶC BIỆT: dựng được lên địa hình vốn CẤM xây (nhà sàn trên đầm
   * lầy và lòng sông, đê chắn sóng lấn ra biển, pháo đài bám vách núi). Đây là
   * ngoại lệ duy nhất của luật "địa hình là thềm đỡ".
   */
  overrideTerrain?: LocalTerrain[];
  /**
   * BẮT BUỘC dựng ĐÈ lên một điểm tài nguyên loại này. Mỏ sắt không mọc ở nơi
   * không có mạch sắt — sản lượng lấy theo BẬC trữ lượng của điểm bên dưới.
   */
  requiresNode?: string[];
  /** phải kề mặt nước (Bến Cảng, Bến Cá). */
  nearWater?: boolean;
  /** không đặt lên lưới — dựng thành vành đai quanh trọng trấn (di sản, đã thay bằng hệ tường vạch tay). */
  ring?: boolean;
  /** mỗi lãnh địa chỉ được 1 cái (xây lại = nâng cấp). */
  unique?: boolean;
  /** ẩn khỏi bảng chọn — giữ lại để save cũ vẫn đọc được. */
  hidden?: boolean;
  /** người chơi tự đặt TÊN và tự chọn CÔNG NĂNG (đặc tả nằm trong state). */
  custom?: boolean;
}

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

export const BUILDING_CATALOG: Record<BuildingType, BuildingDef> = {
  // ── HÀNH CHÍNH & PHÒNG THỦ ────────────────────────────────────────────────
  "Lâu Đài": {
    type: "Lâu Đài", category: "Hành Chính",
    desc: "Toà thành chính — phòng thủ, giới hạn quân đồn trú và bán kính quy hoạch.",
    effectSummary: "+Phòng thủ, +600 chỗ ở, +vùng quy hoạch",
    cost: { "Ngân Khố": 800 * G, "Gỗ": 200, "Đá": 400, "Quặng Sắt": 100 }, buildMonths: 8,
    labour: { "Dân Phu": 400, "Thợ Đá": 120, "Thợ Mộc": 60, "Kỹ Sư": 8 },
    jobs: { "Nghề Khác": 90 }, housing: 600,
    upkeep: { "Ngân Khố": 28 * G },
    flags: { defense: 20 },
    footprint: 24, unique: true, // 120 m
  },
  "Tường Thành": {
    type: "Tường Thành", category: "Hành Chính",
    desc: "Luỹ đá vành đai kiểu cũ. Đã thay bằng hệ VẠCH TAY — dùng công cụ Tường Thành trên bản đồ.",
    effectSummary: "(di sản) — hãy vạch tường trên bản đồ lãnh địa",
    cost: { "Ngân Khố": 500 * G, "Đá": 600, "Gỗ": 50 }, buildMonths: 7,
    labour: { "Dân Phu": 500, "Thợ Đá": 200, "Kỹ Sư": 6 },
    upkeep: { "Ngân Khố": 12 * G },
    flags: { defense: 15 },
    footprint: 0, ring: true, unique: true, hidden: true,
  },
  "Tháp Canh": {
    type: "Tháp Canh", category: "Hành Chính",
    desc: "Tháp gác nhìn xa — báo động sớm, chặn cướp bóc lẻ tẻ.",
    effectSummary: "+Phòng thủ nhẹ, cảnh giới sớm",
    cost: { "Ngân Khố": 90 * G, "Đá": 120, "Gỗ": 40 }, buildMonths: 2,
    labour: { "Dân Phu": 60, "Thợ Đá": 20 },
    jobs: { "Nghề Khác": 8 },
    upkeep: { "Ngân Khố": 3 * G },
    flags: { defense: 4 },
    footprint: 6,
  },
  "Doanh Trại": {
    type: "Doanh Trại", category: "Hành Chính",
    desc: "Nơi tuyển mộ và huấn luyện binh sĩ (mục 11).",
    effectSummary: "Mở tuyển quân, +tốc độ tuyển",
    cost: { "Ngân Khố": 400 * G, "Gỗ": 150, "Đá": 100, "Quặng Sắt": 80 }, buildMonths: 5,
    labour: { "Dân Phu": 180, "Thợ Mộc": 40, "Thợ Đá": 30 },
    jobs: { "Nghề Khác": 40 }, housing: 200,
    upkeep: { "Ngân Khố": 14 * G },
    flags: { recruit: true },
    footprint: 16,
  },
  "Học Viện Nhỏ": {
    type: "Học Viện Nhỏ", category: "Hành Chính",
    desc: "Học viện quản lý — học sĩ, thư tín, và bản vẽ công trình.",
    effectSummary: "−20% thời gian xây, +hiệu quả quản lý",
    cost: { "Ngân Khố": 700 * G, "Gỗ": 150, "Đá": 200, "Quặng Sắt": 50 }, buildMonths: 8,
    labour: { "Dân Phu": 150, "Thợ Đá": 50, "Kỹ Sư": 10 },
    jobs: { "Nghề Khác": 14, "Kỹ Sư": 5 }, housing: 60,
    consume: { "Giấy Da": 6 },
    upkeep: { "Ngân Khố": 20 * G },
    flags: { adminSpeedup: 0.2 },
    footprint: 10, unique: true,
  },
  "Sept/Rừng Thần": {
    type: "Sept/Rừng Thần", category: "Hành Chính",
    desc: "Nơi thờ phụng — an lòng dân theo tôn giáo vùng.",
    effectSummary: "+2 Lòng Dân/tháng",
    cost: { "Ngân Khố": 250 * G, "Gỗ": 100, "Đá": 150 }, buildMonths: 4,
    labour: { "Dân Phu": 100, "Thợ Đá": 40, "Thợ Mộc": 20 },
    jobs: { "Nghề Khác": 12 },
    consume: { "Sáp Ong": 4 },
    upkeep: { "Ngân Khố": 6 * G },
    flags: { loyaltyPerMonth: 2 },
    footprint: 10,
  },

  // ── DÂN CƯ (M18) ──────────────────────────────────────────────────────────
  "Nhà Ở": {
    type: "Nhà Ở", category: "Dân Cư",
    desc: "Dãy nhà dân lợp rơm quanh thành — trần dân số của lãnh địa nằm ở đây.",
    effectSummary: "+450 sức chứa dân cư, +1 Lòng Dân/tháng",
    cost: { "Ngân Khố": 70 * G, "Gỗ": 130, "Đá": 40 }, buildMonths: 2,
    labour: { "Dân Phu": 70, "Thợ Mộc": 25 },
    housing: 450,
    upkeep: { "Ngân Khố": 4 * G, "Gỗ": 6 },
    flags: { loyaltyPerMonth: 1 },
    footprint: 18,
  },
  "Khu Phố Thợ": {
    type: "Khu Phố Thợ", category: "Dân Cư",
    desc: "Phố phường của các phường hội — vừa là chỗ ở vừa là xưởng nhỏ.",
    effectSummary: "+300 chỗ ở, +80 chỗ làm thợ thủ công, +40 Gốm Sứ/tháng",
    cost: { "Ngân Khố": 190 * G, "Gỗ": 180, "Đá": 120 }, buildMonths: 4,
    labour: { "Dân Phu": 120, "Thợ Mộc": 40, "Thợ Đá": 25 },
    jobs: { "Thợ Thủ Công": 80, "Thương Nhân": 15 }, housing: 300,
    yield: { "Gốm Sứ": 40, "Ngân Khố": 18 * G },
    upkeep: { "Ngân Khố": 8 * G },
    flags: { trade: 0.05, housingBonus: 0.05 },
    footprint: 20,
  },

  // ── LƯƠNG THỰC ────────────────────────────────────────────────────────────
  "Nông Trại": {
    type: "Nông Trại", category: "Lương Thực",
    desc: "Đồng ruộng nuôi dân và quân. Cần 140 nông dân mới chạy hết công suất.",
    effectSummary: "140 nông dân → +200 Lương Thực, +60 Rau Củ/tháng",
    cost: { "Ngân Khố": 150 * G, "Gỗ": 80, "Đá": 20 }, buildMonths: 3,
    labour: { "Dân Phu": 120, "Thợ Mộc": 10 },
    jobs: { "Nông Dân": 140 }, housing: 60,
    yield: { "Lương Thực": 200, "Rau Củ": 60 },
    upkeep: { "Ngân Khố": 3 * G },
    footprint: 30, terrain: ["Đồng Bằng", "Đầm Lầy"], // 150 m — chỉ trên đất canh tác
  },
  "Bến Cá": {
    type: "Bến Cá", category: "Lương Thực",
    desc: "Bến thuyền chài — lưới cá quanh năm, không phụ thuộc mùa vụ.",
    effectSummary: "50 dân chài → +150 Lương Thực, +90 Cá Khô/tháng",
    cost: { "Ngân Khố": 120 * G, "Gỗ": 140 }, buildMonths: 2,
    labour: { "Dân Phu": 80, "Thợ Mộc": 25 },
    jobs: { "Nông Dân": 50, "Thợ Thủ Công": 12 }, housing: 40,
    yield: { "Lương Thực": 150, "Cá Khô": 90 },
    consume: { "Muối": 12 },
    upkeep: { "Ngân Khố": 3 * G },
    footprint: 12, nearWater: true, requiresCoastal: true,
  },
  "Ruộng Muối": {
    type: "Ruộng Muối", category: "Lương Thực",
    desc: "Ô nước biển phơi nắng lấy muối — thứ giữ thịt qua mùa đông dài.",
    effectSummary: "45 dân → +90 Muối/tháng",
    cost: { "Ngân Khố": 130 * G, "Gỗ": 60, "Đá": 80 }, buildMonths: 3,
    labour: { "Dân Phu": 90 },
    jobs: { "Nông Dân": 45 },
    yield: { "Muối": 90 },
    upkeep: { "Ngân Khố": 2 * G },
    footprint: 18, nearWater: true, requiresCoastal: true,
  },
  "Trại Chăn Nuôi": {
    type: "Trại Chăn Nuôi", category: "Lương Thực",
    desc: "Bãi chăn và chuồng trại — cừu cho len, bò cho sức kéo, lợn cho nồi hầm.",
    effectSummary: "55 nông dân → +40 Len, +14 Cừu, +8 Lợn, +30 Thịt Muối/tháng",
    cost: { "Ngân Khố": 160 * G, "Gỗ": 120, "Đá": 30 }, buildMonths: 3,
    labour: { "Dân Phu": 100, "Thợ Mộc": 20 },
    jobs: { "Nông Dân": 55 }, housing: 40,
    consume: { "Lương Thực": 45 },
    yield: { "Len": 40, "Cừu": 14, "Lợn": 8, "Thịt Muối": 30, "Da Thú": 24 },
    upkeep: { "Ngân Khố": 4 * G },
    footprint: 26, terrain: ["Đồng Bằng", "Đồi Núi", "Tuyết/Băng Giá", "Thành Trì (thủ)"],
  },
  "Vườn Nho": {
    type: "Vườn Nho", category: "Lương Thực",
    desc: "Giàn nho trên sườn đồi nắng — nho ép thành thứ chảy trong mọi bàn tiệc.",
    effectSummary: "60 nông dân → +45 Rượu Vang, +50 Trái Cây/tháng",
    cost: { "Ngân Khố": 210 * G, "Gỗ": 110, "Đá": 60 }, buildMonths: 5,
    labour: { "Dân Phu": 110, "Thợ Mộc": 25 },
    jobs: { "Nông Dân": 60, "Thợ Thủ Công": 15 },
    yield: { "Rượu Vang": 45, "Trái Cây": 50, "Ngân Khố": 15 * G },
    upkeep: { "Ngân Khố": 5 * G },
    footprint: 24, terrain: ["Đồng Bằng", "Đồi Núi", "Sa Mạc"],
  },
  "Kho Lương": {
    type: "Kho Lương", category: "Lương Thực",
    desc: "Vựa lúa xây cao ráo — chuột bọ và ẩm mốc bớt ăn của kho.",
    effectSummary: "−40% hao hụt kho, +30 Lương Thực/tháng",
    cost: { "Ngân Khố": 180 * G, "Gỗ": 200, "Đá": 120 }, buildMonths: 3,
    labour: { "Dân Phu": 110, "Thợ Mộc": 35, "Thợ Đá": 15 },
    jobs: { "Nghề Khác": 18 },
    yield: { "Lương Thực": 30 },
    upkeep: { "Ngân Khố": 4 * G },
    flags: { storage: 0.4 },
    footprint: 12, unique: true,
  },

  // ── KHAI THÁC NGUYÊN LIỆU THÔ ─────────────────────────────────────────────
  // Bốn công trình dưới đây BẮT BUỘC dựng đè lên điểm tài nguyên tương ứng.
  "Xưởng Cưa": {
    type: "Xưởng Cưa", category: "Khai Thác",
    desc: "Trại đốn gỗ và xưởng xẻ — phải dựng ngay trên một khoảnh rừng đã thăm dò.",
    effectSummary: "60 tiều phu + mạch Gỗ → +120 Gỗ/tháng (×bậc trữ lượng)",
    cost: { "Ngân Khố": 110 * G, "Gỗ": 40, "Quặng Sắt": 30 }, buildMonths: 2,
    labour: { "Dân Phu": 90, "Thợ Mộc": 30 },
    jobs: { "Tiều Phu": 60, "Thợ Mộc": 18 }, housing: 30,
    yield: { "Gỗ": 120 },
    upkeep: { "Ngân Khố": 3 * G },
    footprint: 14, terrain: ["Rừng Rậm"], requiresNode: ["Gỗ"],
  },
  "Mỏ Đá": {
    type: "Mỏ Đá", category: "Khai Thác",
    desc: "Công trường đục đá — mở đúng chỗ vỉa đá lộ thiên.",
    effectSummary: "70 thợ mỏ + vỉa Đá → +110 Đá/tháng (×bậc trữ lượng)",
    cost: { "Ngân Khố": 140 * G, "Gỗ": 90, "Quặng Sắt": 40 }, buildMonths: 3,
    labour: { "Dân Phu": 130, "Thợ Đá": 50 },
    jobs: { "Thợ Mỏ": 70, "Thợ Đá": 20 }, housing: 30,
    yield: { "Đá": 110 },
    upkeep: { "Ngân Khố": 4 * G },
    footprint: 16, terrain: ["Đồi Núi", "Hẻm Núi"], requiresNode: ["Đá"],
  },
  "Mỏ Sắt": {
    type: "Mỏ Sắt", category: "Khai Thác",
    desc: "Hầm lò ăn sâu theo mạch quặng — không có mạch thì chỉ đào ra đá vụn.",
    effectSummary: "80 thợ mỏ + mạch Quặng Sắt → +80 Quặng/tháng (×bậc trữ lượng)",
    cost: { "Ngân Khố": 200 * G, "Gỗ": 160, "Đá": 60 }, buildMonths: 4,
    labour: { "Dân Phu": 150, "Thợ Đá": 40, "Kỹ Sư": 3 },
    jobs: { "Thợ Mỏ": 80, "Kỹ Sư": 2 }, housing: 40,
    yield: { "Quặng Sắt": 80 },
    upkeep: { "Ngân Khố": 6 * G, "Gỗ": 10 },
    footprint: 16, terrain: ["Đồi Núi", "Hẻm Núi"], requiresNode: ["Quặng Sắt"],
  },
  "Mỏ Than": {
    type: "Mỏ Than", category: "Khai Thác",
    desc: "Vỉa than nuôi lửa lò rèn — không có than thì thép chỉ là quặng.",
    effectSummary: "85 thợ mỏ + vỉa Than → +100 Than Đá/tháng (×bậc trữ lượng)",
    cost: { "Ngân Khố": 190 * G, "Gỗ": 170, "Đá": 50 }, buildMonths: 4,
    labour: { "Dân Phu": 160, "Thợ Đá": 30, "Kỹ Sư": 3 },
    jobs: { "Thợ Mỏ": 85, "Kỹ Sư": 2 }, housing: 40,
    yield: { "Than Đá": 100 },
    upkeep: { "Ngân Khố": 6 * G, "Gỗ": 10 },
    footprint: 16, terrain: ["Đồi Núi", "Hẻm Núi"], requiresNode: ["Than Đá"],
  },

  // ── CHẾ TÁC ───────────────────────────────────────────────────────────────
  "Lò Rèn": {
    type: "Lò Rèn", category: "Chế Tác",
    desc: "Lò cao và đe búa — nấu quặng với than thành thép. Giữ 26 thợ rèn.",
    effectSummary: "26 thợ rèn · 60 Quặng + 40 Than → +45 Thép/tháng",
    cost: { "Ngân Khố": 260 * G, "Đá": 180, "Gỗ": 80, "Quặng Sắt": 60 }, buildMonths: 4,
    labour: { "Dân Phu": 80, "Thợ Rèn": 45, "Thợ Đá": 20 },
    jobs: { "Thợ Rèn": 26, "Thợ Thủ Công": 30 },
    consume: { "Quặng Sắt": 60, "Than Đá": 40 },
    yield: { "Thép": 45 },
    upkeep: { "Ngân Khố": 8 * G },
    footprint: 12,
  },
  "Xưởng Vũ Khí": {
    type: "Xưởng Vũ Khí", category: "Chế Tác",
    desc: "Xưởng binh khí — thép thỏi ra khỏi đây thành giáo, kiếm và giáp xích.",
    effectSummary: "30 thợ rèn · 30 Thép + 20 Gỗ → +14 Vũ Khí, +5 Giáp Trụ/tháng",
    cost: { "Ngân Khố": 340 * G, "Đá": 150, "Gỗ": 120, "Thép": 40 }, buildMonths: 5,
    labour: { "Dân Phu": 90, "Thợ Rèn": 55, "Thợ Đá": 20 },
    jobs: { "Thợ Rèn": 30, "Thợ Thủ Công": 25 },
    consume: { "Thép": 30, "Gỗ": 20, "Da Thuộc": 8 },
    yield: { "Vũ Khí": 14, "Giáp Trụ": 5, "Cung Tên": 10 },
    upkeep: { "Ngân Khố": 12 * G },
    footprint: 14,
  },
  "Xưởng Dệt": {
    type: "Xưởng Dệt", category: "Chế Tác",
    desc: "Khung cửi và thợ nhuộm — quân trang, buồm, và hàng đem bán.",
    effectSummary: "60 thợ · 45 Len + 25 Lanh → +70 Vải Vóc, +40 Vải Lanh/tháng",
    cost: { "Ngân Khố": 200 * G, "Gỗ": 120, "Đá": 40 }, buildMonths: 3,
    labour: { "Dân Phu": 70, "Thợ Mộc": 20 },
    jobs: { "Thợ Thủ Công": 60 },
    consume: { "Len": 45, "Lanh": 25 },
    yield: { "Vải Vóc": 70, "Vải Lanh": 40, "Ngân Khố": 25 * G },
    upkeep: { "Ngân Khố": 5 * G },
    footprint: 12,
  },
  "Xưởng Thuộc Da": {
    type: "Xưởng Thuộc Da", category: "Chế Tác",
    desc: "Bể thuộc da bốc mùi — bao giờ cũng đặt cuối gió, nhưng ai cũng cần giày.",
    effectSummary: "35 thợ · 50 Da Thú + 10 Muối → +38 Da Thuộc/tháng",
    cost: { "Ngân Khố": 170 * G, "Gỗ": 100, "Đá": 60 }, buildMonths: 3,
    labour: { "Dân Phu": 70, "Thợ Mộc": 15 },
    jobs: { "Thợ Thủ Công": 35 },
    consume: { "Da Thú": 50, "Muối": 10 },
    yield: { "Da Thuộc": 38 },
    upkeep: { "Ngân Khố": 4 * G },
    flags: { loyaltyPerMonth: -1 },
    footprint: 12,
  },
  "Xưởng Gốm": {
    type: "Xưởng Gốm", category: "Chế Tác",
    desc: "Bàn xoay và lò nung — nồi vại vỡ suốt nên bán mãi không hết.",
    effectSummary: "40 thợ · 30 Đá + 20 Gỗ → +60 Gốm Sứ, +12 Thuỷ Tinh/tháng",
    cost: { "Ngân Khố": 150 * G, "Gỗ": 90, "Đá": 90 }, buildMonths: 3,
    labour: { "Dân Phu": 70, "Thợ Đá": 20 },
    jobs: { "Thợ Thủ Công": 40 },
    consume: { "Đá": 30, "Gỗ": 20 },
    yield: { "Gốm Sứ": 60, "Thuỷ Tinh": 12 },
    upkeep: { "Ngân Khố": 4 * G },
    footprint: 12,
  },
  "Nhà Ủ Bia": {
    type: "Nhà Ủ Bia", category: "Chế Tác",
    desc: "Thùng ủ và men lúa mạch — bia là nước uống hằng ngày của cả vương quốc.",
    effectSummary: "25 thợ · 60 Lương Thực → +110 Bia/tháng, +2 Lòng Dân",
    cost: { "Ngân Khố": 140 * G, "Gỗ": 120, "Đá": 50 }, buildMonths: 3,
    labour: { "Dân Phu": 60, "Thợ Mộc": 25 },
    jobs: { "Thợ Thủ Công": 25 },
    consume: { "Lương Thực": 60 },
    yield: { "Bia": 110, "Ngân Khố": 12 * G },
    upkeep: { "Ngân Khố": 3 * G },
    flags: { loyaltyPerMonth: 2 },
    footprint: 12,
  },
  "Chuồng Ngựa": {
    type: "Chuồng Ngựa", category: "Chế Tác",
    desc: "Tàu ngựa và bãi quần — nuôi ngựa chiến cho kỵ binh.",
    effectSummary: "45 dân · 40 Lương Thực → +12 Ngựa/tháng",
    cost: { "Ngân Khố": 220 * G, "Gỗ": 180, "Đá": 40 }, buildMonths: 4,
    labour: { "Dân Phu": 90, "Thợ Mộc": 30 },
    jobs: { "Nghề Khác": 25, "Nông Dân": 20 },
    consume: { "Lương Thực": 40 },
    yield: { "Ngựa": 12 },
    upkeep: { "Ngân Khố": 7 * G },
    footprint: 20, terrain: ["Đồng Bằng", "Thành Trì (thủ)", "Sa Mạc"],
  },
  "Xưởng Đóng Tàu": {
    type: "Xưởng Đóng Tàu", category: "Chế Tác",
    desc: "Ụ tàu và xưởng buồm — đóng và sửa chiến thuyền (7.8).",
    effectSummary: "110 thợ · 90 Gỗ + 20 Vải + 15 Thừng → +40 Vàng/tháng",
    cost: { "Ngân Khố": 420 * G, "Gỗ": 320, "Đá": 100, "Quặng Sắt": 90 }, buildMonths: 6,
    labour: { "Dân Phu": 200, "Thợ Mộc": 90, "Kỹ Sư": 6 },
    jobs: { "Thợ Mộc": 70, "Thợ Thủ Công": 40, "Kỹ Sư": 4 }, housing: 60,
    consume: { "Gỗ": 90, "Vải Vóc": 20, "Dây Thừng": 15 },
    yield: { "Ngân Khố": 40 * G, "Dây Thừng": 20 },
    upkeep: { "Ngân Khố": 16 * G },
    flags: { shipyard: true },
    footprint: 20, nearWater: true, requiresCoastal: true,
  },

  // ── THƯƠNG MẠI ────────────────────────────────────────────────────────────
  "Chợ": {
    type: "Chợ", category: "Thương Mại",
    desc: "Trung tâm mua bán — dòng vàng đều đặn và thanh khoản cho cả vùng.",
    effectSummary: "55 thương nhân → +120 Vàng/tháng, +10% thu thương mại",
    cost: { "Ngân Khố": 300 * G, "Gỗ": 60, "Đá": 40 }, buildMonths: 4,
    labour: { "Dân Phu": 90, "Thợ Mộc": 25 },
    jobs: { "Thương Nhân": 55, "Nghề Khác": 20 },
    yield: { "Ngân Khố": 120 * G },
    upkeep: { "Ngân Khố": 6 * G },
    flags: { trade: 0.1 },
    footprint: 12, terrain: ["Đồng Bằng", "Thành Trì (thủ)", "Sa Mạc"],
  },
  "Bến Cảng": {
    type: "Bến Cảng", category: "Thương Mại",
    desc: "Cảng biển — hạm đội và giao thương (chỉ lãnh địa ven biển).",
    effectSummary: "105 người → +80 Vàng/tháng, +15% thu thương mại",
    cost: { "Ngân Khố": 350 * G, "Gỗ": 250, "Đá": 80 }, buildMonths: 5,
    labour: { "Dân Phu": 180, "Thợ Mộc": 60, "Thợ Đá": 30, "Kỹ Sư": 4 },
    jobs: { "Thương Nhân": 45, "Nghề Khác": 60 }, housing: 80,
    yield: { "Ngân Khố": 80 * G },
    upkeep: { "Ngân Khố": 12 * G },
    requiresCoastal: true, flags: { port: true, trade: 0.15 },
    footprint: 16, nearWater: true,
  },
  "Quán Trọ": {
    type: "Quán Trọ", category: "Thương Mại",
    desc: "Quán trọ bên đường cái — khách thương, tin tức và tiền lẻ.",
    effectSummary: "14 người · 20 Bia → +45 Vàng/tháng, +1 Lòng Dân",
    cost: { "Ngân Khố": 120 * G, "Gỗ": 110, "Đá": 30 }, buildMonths: 2,
    labour: { "Dân Phu": 50, "Thợ Mộc": 20 },
    jobs: { "Nghề Khác": 14 }, housing: 30,
    consume: { "Bia": 20 },
    yield: { "Ngân Khố": 45 * G },
    upkeep: { "Ngân Khố": 2 * G },
    flags: { loyaltyPerMonth: 1, trade: 0.05 },
    footprint: 8,
  },

  // ── ĐẶC BIỆT: dựng lên địa hình vốn cấm xây ───────────────────────────────
  "Nhà Sàn": {
    type: "Nhà Sàn", category: "Đặc Biệt",
    desc: "Nhà dựng trên cọc gỗ đóng sâu xuống bùn — cách duy nhất ở được giữa đầm lầy và mép sông.",
    effectSummary: "Xây ĐƯỢC trên Đầm Lầy & Sông · +220 chỗ ở, +40 Cá Khô/tháng",
    cost: { "Ngân Khố": 130 * G, "Gỗ": 220, "Dây Thừng": 20 }, buildMonths: 3,
    labour: { "Dân Phu": 110, "Thợ Mộc": 60, "Kỹ Sư": 2 },
    jobs: { "Nông Dân": 25, "Thợ Mộc": 10 }, housing: 220,
    yield: { "Cá Khô": 40 },
    upkeep: { "Ngân Khố": 5 * G, "Gỗ": 12 },
    footprint: 14,
    overrideTerrain: ["Đầm Lầy", "Sông/Lối Vượt Sông"],
    terrain: ["Đầm Lầy", "Sông/Lối Vượt Sông"],
  },
  "Đê Chắn Sóng": {
    type: "Đê Chắn Sóng", category: "Đặc Biệt",
    desc: "Kè đá lấn ra biển — chắn sóng cho bến, và biến mặt nước thành đất dùng được.",
    effectSummary: "Xây ĐƯỢC trên mặt Biển · +8 Phòng thủ, +10% thu thương mại",
    cost: { "Ngân Khố": 400 * G, "Đá": 500, "Gỗ": 120 }, buildMonths: 6,
    labour: { "Dân Phu": 260, "Thợ Đá": 110, "Kỹ Sư": 6 },
    jobs: { "Nghề Khác": 20 },
    upkeep: { "Ngân Khố": 14 * G, "Đá": 10 },
    flags: { defense: 8, trade: 0.1 },
    footprint: 20, requiresCoastal: true,
    overrideTerrain: ["Biển"], terrain: ["Biển"],
  },
  "Pháo Đài Vách Đá": {
    type: "Pháo Đài Vách Đá", category: "Đặc Biệt",
    desc: "Công sự đục thẳng vào vách đá — đắt kinh người, nhưng gần như không thể công phá.",
    effectSummary: "Xây ĐƯỢC trên Hẻm Núi · +18 Phòng thủ",
    cost: { "Ngân Khố": 560 * G, "Đá": 420, "Thép": 60, "Gỗ": 100 }, buildMonths: 8,
    labour: { "Dân Phu": 300, "Thợ Đá": 160, "Kỹ Sư": 10 },
    jobs: { "Nghề Khác": 30 }, housing: 80,
    upkeep: { "Ngân Khố": 18 * G },
    flags: { defense: 18 },
    footprint: 14,
    overrideTerrain: ["Hẻm Núi"], terrain: ["Hẻm Núi", "Đồi Núi"],
  },
  "Cầu Đá": {
    type: "Cầu Đá", category: "Đặc Biệt",
    desc: "Cầu đá bắc ngang dòng — nối hai bờ và thu thuế cầu của mọi đoàn xe qua lại.",
    effectSummary: "Xây ĐƯỢC trên Sông · +35 Vàng/tháng, +8% thu thương mại",
    cost: { "Ngân Khố": 260 * G, "Đá": 300, "Gỗ": 90 }, buildMonths: 4,
    labour: { "Dân Phu": 170, "Thợ Đá": 90, "Kỹ Sư": 5 },
    jobs: { "Nghề Khác": 8 },
    yield: { "Ngân Khố": 35 * G },
    upkeep: { "Ngân Khố": 5 * G },
    flags: { trade: 0.08 },
    footprint: 10,
    overrideTerrain: ["Sông/Lối Vượt Sông"], terrain: ["Sông/Lối Vượt Sông"],
  },

  // ── CÔNG TRÌNH TUỲ CHỈNH ──────────────────────────────────────────────────
  "Công Trình Tuỳ Chỉnh": {
    type: "Công Trình Tuỳ Chỉnh", category: "Đặc Biệt",
    desc: "Ngươi tự đặt tên, tự chọn công năng: sản xuất gì, giữ bao nhiêu người, chứa bao nhiêu dân.",
    effectSummary: "Do ngươi định — chi phí tính theo công năng đã chọn",
    cost: { "Ngân Khố": 100 * G, "Gỗ": 60, "Đá": 60 }, buildMonths: 3,
    labour: { "Dân Phu": 80, "Thợ Mộc": 20, "Thợ Đá": 20 },
    upkeep: { "Ngân Khố": 4 * G },
    footprint: 14, custom: true,
  },
};

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDING_CATALOG);
/** Công trình hiện trong bảng chọn (bỏ loại đã thay thế). */
export const BUILDABLE_LIST: BuildingDef[] = BUILDING_LIST.filter((d) => !d.hidden);

/** Chi phí xây/nâng lên CẤP `level` (tuyến tính theo cấp — 10.3). */
export function buildingCost(type: BuildingType, level: number): Partial<Record<ResourceKey, number>> {
  const base = BUILDING_CATALOG[type].cost;
  const out: Partial<Record<ResourceKey, number>> = {};
  for (const [k, v] of Object.entries(base)) out[k as ResourceKey] = Math.round((v ?? 0) * level);
  return out;
}

/** Nhân lực công trường cần cho CẤP `level`. */
export function buildingLabour(type: BuildingType, level: number): Partial<Record<LabourKey, number>> {
  const base = BUILDING_CATALOG[type].labour ?? {};
  const out: Partial<Record<LabourKey, number>> = {};
  for (const [k, v] of Object.entries(base)) out[k as LabourKey] = Math.round((v ?? 0) * level);
  return out;
}

/** Số NGÀY xây lên CẤP `level` (mỗi cấp thêm 50% thời gian nền). */
export function buildingDays(type: BuildingType, level: number, adminSpeedup = 0): number {
  const baseMonths = BUILDING_CATALOG[type].buildMonths * (1 + (level - 1) * 0.5);
  return Math.max(1, Math.round(turnsToDays(baseMonths) * (1 - adminSpeedup)));
}

/** Nghề nào trong dân số ứng với nhân lực công trường (khớp Dân Số Chi Tiết). */
export function isLabourJob(job: JobKey): job is LabourKey {
  return (LABOUR_LIST as string[]).includes(job);
}

/**
 * Cơ cấu nghề nghiệp NỀN của một lãnh địa theo dân số — chỉ dùng lúc khởi tạo.
 * Từ M18 trở đi con số thật được engine dân cư tính lại mỗi tháng theo CHỖ LÀM
 * VIỆC mà các công trình mở ra (territory/population.ts).
 */
export function defaultJobSplit(pop: number): Record<JobKey, number> {
  const f = (share: number) => Math.max(0, Math.floor(pop * share));
  return {
    "Nông Dân": f(0.42),
    "Thợ Thủ Công": f(0.08),
    "Thợ Mỏ": f(0.06),
    "Tiều Phu": f(0.05),
    "Thương Nhân": f(0.06),
    "Dân Phu": f(0.14),
    "Thợ Đá": f(0.025),
    "Thợ Mộc": f(0.025),
    "Thợ Rèn": f(0.015),
    "Kỹ Sư": Math.max(1, Math.floor(pop * 0.0015)),
    "Nghề Khác": f(0.06),
    "Thất Nghiệp": f(0.05),
  };
}
