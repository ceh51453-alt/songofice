/**
 * StatDataSchema (mục 5.1 khung + 5.1f hệ nhân vật đầy đủ) — NGUỒN CHÂN LÝ
 * của toàn app. Mọi hệ mở rộng (10-17) cắm thêm field vào schema NÀY.
 * Quy ước prefix: `_` = readonly (chỉ engine ghi), `$` = ẩn UI (AI đọc/ghi được).
 */
import { z } from "zod";
import { safeString, clampedStat, safeInt } from "./helpers";
import { NpcSchema, LIFE_STAGES } from "./npcSchema";

export const HOUSES = [
  "Stark", "Lannister", "Targaryen", "Baratheon", "Greyjoy",
  "Tyrell", "Martell", "Arryn", "Tully", "Không Nhà", "Tùy Chỉnh",
  "Targaryen (Essos)", "Khalasar", "Braavos", "Hội Lính Đánh Thuê", "Ghiscar", "Qarth", "Thành Phố Tự Do"
] as const;

export const SEASONS = ["Xuân", "Hạ", "Thu", "Đông"] as const;

export const RELIGIONS = [
  "Thất Diện Thần", "Cựu Thần", "Thần Ánh Sáng (R'hllor)", 
  "Đa Diện Thần", "Thần Chết Chìm", "Đại Mã Thần", 
  "Không Tín Ngưỡng", "Khác..."
] as const;

export interface BloodlineDef {
  id: string;
  name: string;
  desc: string;
  buffs: Partial<Record<string, number>>;
}

export const BLOODLINES: BloodlineDef[] = [
  { id: "valyrian", name: "Máu Valyria Cổ Đại", desc: "+4 Uy Tín, +2 Trí Tuệ. Ngoại hình Valyria đặc trưng, kháng hỏa, tiềm năng cưỡi rồng.", buffs: { "Uy Tín": 4, "Trí Tuệ": 2 } },
  { id: "first-men", name: "Máu Tiền Nhân", desc: "+4 Thể Chất, +2 Sức Mạnh. Kháng lạnh, sức chịu đựng phi thường, tiềm năng ma thuật xanh.", buffs: { "Thể Chất": 4, "Sức Mạnh": 2 } },
  { id: "andal", name: "Máu Andal", desc: "+4 Trí Tuệ, +2 Tinh Tường. Bản tính hiếu học, nhạy bén với chính trị và tôn giáo.", buffs: { "Trí Tuệ": 4, "Tinh Tường": 2 } },
  { id: "rhoynar", name: "Máu Rhoynar", desc: "+4 Nhanh Nhẹn, +2 Tinh Tường. Nhạy bén, có khả năng đi biển và lẩn trốn xuất sắc.", buffs: { "Nhanh Nhẹn": 4, "Tinh Tường": 2 } },
  { id: "ironborn", name: "Máu Ironborn", desc: "+4 Sức Mạnh, +2 Thể Chất. Bản tính hung bạo, sinh ra để cướp bóc và chiến đấu.", buffs: { "Sức Mạnh": 4, "Thể Chất": 2 } },
  { id: "ghiscari", name: "Máu Ghiscar Cổ", desc: "+4 Tinh Tường, +2 Uy Tín. Khéo léo trong cai trị và chỉ huy kỷ luật thép.", buffs: { "Tinh Tường": 4, "Uy Tín": 2 } },
  { id: "dothraki", name: "Máu Dothraki", desc: "+4 Nhanh Nhẹn, +2 Sức Mạnh. Sức chịu đựng sa mạc và kỹ năng kỵ binh tuyệt hảo.", buffs: { "Nhanh Nhẹn": 4, "Sức Mạnh": 2 } },
  { id: "tall-men", name: "Máu Người Cao (Sarnor)", desc: "+4 Sức Mạnh, +2 Thể Chất. Thể hình cao lớn vượt trội, sức mạnh đáng gờm.", buffs: { "Sức Mạnh": 4, "Thể Chất": 2 } },
  { id: "none", name: "Không Rõ Huyết Mạch", desc: "Không có huyết mạch đặc biệt.", buffs: {} },
];

export interface PatronGodDef {
  id: string;
  name: string;
  desc: string;
  buffs: Partial<Record<string, number>>;
}

export const PATRON_GODS: Record<string, PatronGodDef[]> = {
  "Thất Diện Thần": [
    { id: "the-father", name: "Người Cha (The Father)", desc: "Đại diện cho công lý. +3 Uy Tín, +1 Tinh Tường", buffs: { "Uy Tín": 3, "Tinh Tường": 1 } },
    { id: "the-mother", name: "Người Mẹ (The Mother)", desc: "Đại diện cho từ bi. +3 Uy Tín, +1 Trí Tuệ", buffs: { "Uy Tín": 3, "Trí Tuệ": 1 } },
    { id: "the-warrior", name: "Chiến Binh (The Warrior)", desc: "Đại diện cho sức mạnh. +3 Sức Mạnh, +1 Thể Chất", buffs: { "Sức Mạnh": 3, "Thể Chất": 1 } },
    { id: "the-maiden", name: "Thiếu Nữ (The Maiden)", desc: "Đại diện cho sắc đẹp. +3 Uy Tín, +1 Nhanh Nhẹn", buffs: { "Uy Tín": 3, "Nhanh Nhẹn": 1 } },
    { id: "the-smith", name: "Thợ Rèn (The Smith)", desc: "Đại diện cho lao động. +3 Thể Chất, +1 Sức Mạnh", buffs: { "Thể Chất": 3, "Sức Mạnh": 1 } },
    { id: "the-crone", name: "Bà Lão (The Crone)", desc: "Đại diện cho trí tuệ. +3 Trí Tuệ, +1 Tinh Tường", buffs: { "Trí Tuệ": 3, "Tinh Tường": 1 } },
    { id: "the-stranger", name: "Kẻ Xa Lạ (The Stranger)", desc: "Đại diện cho cái chết. +3 Nhanh Nhẹn, +1 Trí Tuệ", buffs: { "Nhanh Nhẹn": 3, "Trí Tuệ": 1 } },
  ],
  "Cựu Thần": [
    { id: "weirwood", name: "Cây Đước (Weirwood)", desc: "Liên kết với thiên nhiên cổ đại. +2 Thể Chất, +2 Trí Tuệ", buffs: { "Thể Chất": 2, "Trí Tuệ": 2 } },
  ],
  "Thần Ánh Sáng (R'hllor)": [
    { id: "rhllor", name: "Quang Thần (R'hllor)", desc: "Thần của ngọn lửa sinh mệnh. +3 Trí Tuệ, +1 Uy Tín", buffs: { "Trí Tuệ": 3, "Uy Tín": 1 } },
  ],
  "Đa Diện Thần": [
    { id: "many-faced", name: "Thần Đa Diện", desc: "Cái chết là món quà. +3 Nhanh Nhẹn, +1 Tinh Tường", buffs: { "Nhanh Nhẹn": 3, "Tinh Tường": 1 } },
  ],
  "Thần Chết Chìm": [
    { id: "drowned-god", name: "Thần Chết Chìm", desc: "Không bao giờ chết. +3 Sức Mạnh, +1 Thể Chất", buffs: { "Sức Mạnh": 3, "Thể Chất": 1 } },
  ],
  "Đại Mã Thần": [
    { id: "great-stallion", name: "Đại Mã Thần", desc: "Móng guốc nghiền nát thảo nguyên. +3 Sức Mạnh, +1 Nhanh Nhẹn", buffs: { "Sức Mạnh": 3, "Nhanh Nhẹn": 1 } },
  ]
};

// ── Chiến đấu (mục 7) ──

export const TROOP_TYPES = ["Bộ Binh", "Trường Thương", "Kỵ Binh", "Kỵ Binh Nhẹ", "Cung Thủ", "Công Thành"] as const;

/**
 * Danh mục binh chủng ĐẦY ĐỦ (11.2b) — thường + đặc biệt (gated Nhà/vùng) +
 * siêu nhiên (gated Era). Metadata (class/gate/rule Lớp 4) ở content/westeros/
 * troopTypes.ts. Đơn vị dùng 1 loại thuần hoặc trộn qua "Thành Phần".
 */
export const TROOP_TYPES_ALL = [
  ...TROOP_TYPES,
  // ── binh chủng phong kiến bổ sung (M19) ──
  "Dân Binh", "Nỏ Thủ", "Hiệp Sĩ", "Vệ Binh Gia Tộc",
  "Kỵ Sĩ Dothraki", "Unsullied", "Người Sắt (Ironborn)", "Bọn Man Tộc (Free Folk)",
  "Dân Sơn Cước (Vale Mountain Clans)", "Lính Đánh Thuê", "Nồi Đất (Braavosi)",
  "Rồng", "Voi Chiến", "Người Chết (Wight)", "Others (White Walker)",
] as const;

/**
 * NGẠCH QUÂN (M19) — chế độ phong kiến phân quyền: lãnh chúa chỉ nuôi được một
 * nhúm quân ăn lương quanh năm, phần còn lại là dân cày bị gọi đi lính theo
 * nghĩa vụ (có HẠN), là quân của chư hầu kéo tới khi phất cờ hiệu triệu, hoặc
 * là lính đánh thuê chỉ trung thành với túi vàng.
 */
export const ARMY_BRANCHES = ["Chính Quy", "Phục Dịch", "Chư Hầu", "Đánh Thuê"] as const;
export type ArmyBranch = (typeof ARMY_BRANCHES)[number];

// ── Lãnh địa & Công trình (mục 10) ──

export const BUILDING_TYPES = [
  // hành chính & phòng thủ
  "Lâu Đài", "Tường Thành", "Tháp Canh", "Doanh Trại", "Học Viện Nhỏ", "Sept/Rừng Thần",
  // lương thực
  "Nông Trại", "Bến Cá", "Ruộng Muối", "Kho Lương",
  // khai thác nguyên liệu thô
  "Xưởng Cưa", "Mỏ Đá", "Mỏ Sắt", "Mỏ Than",
  // chế tác
  "Lò Rèn", "Xưởng Dệt", "Chuồng Ngựa", "Xưởng Đóng Tàu",
  // thương mại
  "Chợ", "Bến Cảng", "Quán Trọ",
  // ── M18: dân cư (quyết định TRẦN dân số) ──
  "Nhà Ở", "Khu Phố Thợ",
  // ── M18: chế tác mở rộng (chuỗi hàng hoá dài hơn) ──
  "Trại Chăn Nuôi", "Xưởng Thuộc Da", "Xưởng Gốm", "Vườn Nho", "Nhà Ủ Bia", "Xưởng Vũ Khí",
  // ── M18: công trình ĐẶC BIỆT — dựng được lên địa hình vốn cấm xây ──
  "Nhà Sàn", "Đê Chắn Sóng", "Pháo Đài Vách Đá", "Cầu Đá",
  // ── M18: người chơi tự đặt tên và tự chọn công năng ──
  "Công Trình Tuỳ Chỉnh",
] as const;

/** Kho tài nguyên của một lãnh địa. Vàng (Ngân Khố) tính bằng Đồng Đỏ. */
export const RESOURCE_KEYS = [
  "Ngân Khố", "Lương Thực", "Gỗ", "Đá", "Quặng Sắt",
  "Than Đá", "Thép", "Vải Vóc", "Ngựa", "Muối",
] as const;

/**
 * Nghề nghiệp của dân trong lãnh địa. Nhóm SẢN XUẤT nuôi sản lượng hằng tháng;
 * nhóm NHÂN LỰC (Dân Phu / Thợ Đá / Thợ Mộc / Thợ Rèn / Kỹ Sư) bị công trường
 * CHIẾM DỤNG trong lúc thi công và được trả về khi công trình xong.
 */
export const JOB_KEYS = [
  "Nông Dân", "Thợ Thủ Công", "Thợ Mỏ", "Tiều Phu", "Thương Nhân",
  "Dân Phu", "Thợ Đá", "Thợ Mộc", "Thợ Rèn", "Kỹ Sư",
  "Nghề Khác", "Thất Nghiệp",
] as const;
export type JobKey = (typeof JOB_KEYS)[number];

/** Trạng thái chủ quyền 1 vùng trên bản đồ (9.5.1). */
export const REGION_STATUS = ["Ổn Định", "Đang Tranh Chấp", "Bị Vây", "Mới Chiếm", "Nổi Loạn"] as const;

// ── Kinh tế & Thương mại nâng cao (mục 15 — M12) ──

/** Mức thuế (15.3) — bảng đánh đổi Vàng ↔ Trung Thành. */
export const TAX_LEVELS = ["Miễn Thuế", "Nhẹ", "Vừa", "Nặng", "Vắt Kiệt"] as const;
export type TaxLevel = (typeof TAX_LEVELS)[number];

/** Loại đường thương mại (15.2). */
export const TRADE_ROUTE_TYPES = ["Bộ", "Biển", "Sông"] as const;

/** Loại khủng hoảng (15.4). */
export const CRISIS_TYPES = ["Nạn Đói", "Dịch Bệnh", "Nổi Loạn", "Mùa Đông Khắc Nghiệt", "Cướp Bóc"] as const;
export const CRISIS_SEVERITY = ["Chớm", "Nghiêm Trọng", "Thảm Hoạ"] as const;

/** Kinh tế 1 vùng (15.1) — sản vật, thiếu hụt, giá cả động. */
export const RegionalEconomySchema = z
  .object({
    "Sản Vật Chủ Lực": z.array(safeString()).catch([]).prefault([]),
    "Thiếu Hụt": z.array(safeString()).catch([]).prefault([]),
    "Giá Cả": z.record(safeString(), z.coerce.number().catch(10)).catch({}).prefault({}),
  })
  .prefault({});
export type RegionalEconomy = z.infer<typeof RegionalEconomySchema>;

/** 1 tuyến thương mại (15.2). */
export const TradeRouteSchema = z
  .object({
    "Từ": safeString().prefault(""),
    "Đến": safeString().prefault(""),
    "Hàng Hoá": z.array(safeString()).catch([]).prefault([]),
    "Lợi Nhuận/Tháng": safeInt(0),
    "Đường": z.enum(TRADE_ROUTE_TYPES).catch("Bộ").prefault("Bộ"),
    "An Toàn": clampedStat(0, 100, 80),
  })
  .prefault({});
export type TradeRoute = z.infer<typeof TradeRouteSchema>;

/** Chính sách thuế (15.3). */
export const TaxPolicySchema = z
  .object({
    "Mức Thuế": z.enum(TAX_LEVELS).catch("Vừa").prefault("Vừa"),
  })
  .prefault({});
export type TaxPolicy = z.infer<typeof TaxPolicySchema>;

/** Nợ và Cho Vay (15.3). */
export const DebtSchema = z
  .object({
    "Nợ Gốc": safeInt(0),
    "Lãi/Tháng": safeInt(0),
    "Tháng Còn Lại": safeInt(0),
    "Đang Quỵt": z.boolean().catch(false).prefault(false),
  })
  .prefault({});
export type Debt = z.infer<typeof DebtSchema>;

/** Khủng hoảng đang diễn ra tại 1 lãnh địa (15.4). */
export const CrisisSchema = z
  .object({
    "Loại": z.enum(CRISIS_TYPES).catch("Nạn Đói").prefault("Nạn Đói"),
    "Mức Độ": z.enum(CRISIS_SEVERITY).catch("Chớm").prefault("Chớm"),
    "Tháng Kéo Dài": safeInt(0),
  })
  .prefault({});
export type Crisis = z.infer<typeof CrisisSchema>;

/**
 * SỔ CHỢ của một mặt hàng tại một vùng (M18). Giá KHÔNG phải hằng số nhân hệ
 * số nữa: nó hình thành từ tồn kho + cung + cầu, và mọi lệnh mua bán của người
 * chơi đều để lại dấu trên đó (mua nhiều thì giá đội lên).
 */
export const MarketGoodSchema = z
  .object({
    "Giá": safeInt(0), // Đồng Đỏ / đơn vị
    "Tồn Kho": safeInt(0),
    "Cung/Tháng": safeInt(0),
    "Cầu/Tháng": safeInt(0),
    /** % đổi giá so với tháng trước (âm = rớt giá). */
    "Biến Động": z.coerce.number().catch(0).prefault(0),
    /** giá tháng trước — để vẽ mũi tên xu hướng. */
    "Giá Trước": safeInt(0),
  })
  .prefault({});
export type MarketGood = z.infer<typeof MarketGoodSchema>;

/** Chợ của một vùng (15.1 mở rộng M18). */
export const MarketSchema = z
  .object({
    "Hàng Hoá": z.record(safeString(), MarketGoodSchema).catch({}).prefault({}),
    /**
     * Thanh khoản 0.1–1: chợ lớn thì mua bán lô lớn cũng ít trượt giá, chợ làng
     * thì mua vài trăm bao lúa là đội giá ngay.
     */
    "Thanh Khoản": z.coerce.number().min(0.05).max(1).catch(0.4).prefault(0.4),
    /** chênh lệch mua/bán (0.08 = lái buôn ăn 8%). */
    "Chênh Lệch": z.coerce.number().min(0).max(0.5).catch(0.12).prefault(0.12),
    "Đang Có Thương Nhân": z.boolean().catch(false).prefault(false),
    "Tin Đồn": safeString().prefault("Không có biến động lớn trên thị trường."),
    /** ngày tuyệt đối lần chốt sổ gần nhất — chống tick trùng. */
    "_Ngày Cập Nhật": safeInt(0),
  })
  .prefault({});
export type Market = z.infer<typeof MarketSchema>;

export const TerrainSchema = z.enum([
  "Đồng Bằng", "Rừng Rậm", "Đồi Núi", "Đầm Lầy", "Sông/Lối Vượt Sông",
  "Tuyết/Băng Giá", "Sa Mạc", "Thành Trì (thủ)", "Hẻm Núi",
]);
export type Terrain = z.infer<typeof TerrainSchema>;

export const CombatScaleSchema = z
  .enum(["Đấu Tay Đôi", "Giao Tranh", "Đại Chiến", "Vây Thành", "Hải Chiến"])
  .catch("Đấu Tay Đôi")
  .prefault("Đấu Tay Đôi");
export type CombatScale = z.infer<typeof CombatScaleSchema>;

/** Đơn vị quân (7.4) — enum vừa tính công thức vừa cho AI tả đúng tình trạng. */
export const MilitaryUnitSchema = z
  .object({
    "Tướng Chỉ Huy": safeString().prefault("Tạm Khuyết"), // khớp key "Tướng Lĩnh" (7.7)
    "Nhà": safeString().prefault(""), // Phe phái sở hữu quân đội
    "Số Lượng": safeInt(0),
    "Loại Quân": z.enum(TROOP_TYPES_ALL).catch("Bộ Binh").prefault("Bộ Binh"), // danh mục đầy đủ (11.2b)
    // thành phần hỗn hợp {loạiQuân: tỷ lệ 0-1}; rỗng = thuần "Loại Quân" (11.1 → ma trận 7.9.2b)
    "Thành Phần": z.record(safeString(), z.coerce.number().min(0).max(1).catch(0)).catch({}).prefault({}),
    "Hậu Cần": z.enum(["Dồi Dào", "Cầm Cự Được", "Cực Kỳ Thiếu Thốn"]).catch("Cầm Cự Được").prefault("Cầm Cự Được"),
    "Sĩ Khí": z.enum(["Hăng Hái", "Ổn Định", "Dao Động", "Sắp Binh Biến"]).catch("Ổn Định").prefault("Ổn Định"),
    "Trang Bị": z.enum(["Trọng Giáp Tinh Nhuệ", "Đồng Bộ Chỉnh Tề", "Thô Sơ"]).catch("Đồng Bộ Chỉnh Tề").prefault("Đồng Bộ Chỉnh Tề"),
    "Huấn Luyện": z.enum(["Tinh Nhuệ", "Thành Thạo", "Mới Lập Đội", "Rời Rạc"]).catch("Mới Lập Đội").prefault("Mới Lập Đội"),
    // vị trí & hành quân trên bản đồ (11.4) — territoryId khớp regionId (mục 9-10)
    "Lãnh Địa Đồn Trú": safeString().prefault(""),
    "Đang Di Chuyển Đến": safeString().optional(), // territoryId đích; rỗng = đứng yên
    "Ngày Hành Quân Còn Lại": safeInt(0),
    "Ngày Huấn Luyện": safeInt(0), // >0 = quân mới tuyển đang huấn luyện, chưa chiến đấu (11.3)

    // ── M19: ngạch quân + đời lính ──
    /** quân ăn lương / dân phục dịch / quân chư hầu gửi tới / lính đánh thuê. */
    "Ngạch": z.enum(ARMY_BRANCHES).catch("Chính Quy").prefault("Chính Quy"),
    /** kinh nghiệm trận mạc 0-100 — engine cộng sau mỗi trận, đẩy bậc Huấn Luyện lên. */
    "Kinh Nghiệm": clampedStat(0, 100, 0),
    "Số Trận Đã Đánh": safeInt(0),
    /** thương binh còn nằm trại — hồi dần về quân số nếu có hậu cần tử tế. */
    "Thương Binh": safeInt(0),
    /** ngày còn lại của kỳ TẬP HỢP (kêu quân về điểm hẹn) — >0 là chưa dùng được. */
    "Ngày Tập Hợp Còn Lại": safeInt(0),
    /**
     * HẠN PHỤC DỊCH: nghĩa vụ quân dịch phong kiến có kỳ hạn. Hết hạn mà còn
     * giữ lính ngoài đồng thì lính bỏ về gặt lúa, lòng dân sụt. 0 = vô hạn
     * (quân chính quy / đánh thuê).
     */
    "Hạn Phục Dịch Còn Lại": safeInt(0),
    /** số ngày lương khô đang mang theo — cạn thì Hậu Cần tụt, sĩ khí theo. */
    "Lương Thực Mang Theo": safeInt(0),
    /** houseId chư hầu đã gửi đám quân này (rỗng = quân nhà ta). */
    "Thuộc Chư Hầu": safeString().prefault(""),
    /** ghi chú tự do cho AI kể (biệt danh đội quân, quân kỳ, lai lịch). */
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type MilitaryUnit = z.infer<typeof MilitaryUnitSchema>;

/** Tướng lĩnh (7.7). */
export const DISEASE_TYPES = ["Cảm Lạnh", "Sốt Mùa Hè", "Sốt Lạnh", "Bệnh Vảy Xám", "Dịch Tả", "Bệnh Kiết Lỵ", "Giang Mai", "Bệnh Lậu", "Bệnh Hoa Liễu", "Thương Hàn", "Bệnh Dại", "Lao Phổi"] as const;
export const DISEASE_SEVERITY = ["Nhẹ", "Nặng", "Nguy Kịch"] as const;

export const CharacterDiseaseSchema = z.object({
  "Tên": z.enum(DISEASE_TYPES).catch("Cảm Lạnh").prefault("Cảm Lạnh"),
  "Mức Độ": z.enum(DISEASE_SEVERITY).catch("Nhẹ").prefault("Nhẹ"),
  "Ngày Còn Lại": safeInt(0),
}).prefault({});
export type CharacterDisease = z.infer<typeof CharacterDiseaseSchema>;

export const GeneralSchema = z
  .object({
    "Chỉ Số Thống Soái": clampedStat(0, 100, 50),
    "Chỉ Số Võ Lực": clampedStat(0, 100, 50),
    "Chỉ Số Trí Mưu": clampedStat(0, 100, 50),
    "Đặc Tính": z
      .array(
        z.enum([
          "Kỵ Binh Đại Sư", "Bậc Thầy Công Thành", "Phòng Thủ Kiên Cường",
          "Táo Bạo", "Thận Trọng", "Được Lính Sùng Bái", "Phản Trắc",
        ]),
      )
      .catch([])
      .prefault([]),
    "Trung Thành": clampedStat(-100, 100, 0),
    "Còn Sống": z.boolean().catch(true).prefault(true),
    "Bị Bắt Bởi": safeString().optional(),
    "Các Loại Bệnh": z.array(CharacterDiseaseSchema).catch([]).prefault([]),
  })
  .prefault({});
export type General = z.infer<typeof GeneralSchema>;

/** Trang bị 1 món (5.1f-E). */
const EquipItemBase = z
  .object({
    "Tên": safeString().prefault(""),
    "Phẩm Chất": z
      .enum(["Thô Kệch", "Thường", "Tinh Xảo", "Thượng Hạng", "Thép Valyria", "Huyền Thoại", "Độc Nhất", "Vô Giá"])
      .catch("Thường")
      .prefault("Thường"),
    "Chất Liệu": safeString().optional(),
    "Người Rèn": safeString().optional(),
    "Thuộc Tính": z.record(safeString(), z.coerce.number().catch(0)).catch({}).prefault({}), // {"Sát Thương Cận":5,"Phòng Thủ":3}
    "Đặc Tính": z.array(safeString()).catch([]).prefault([]), // tag: "valyrian","obsidian","xuyên giáp","gia truyền"
    "Mô Tả": safeString().prefault(""),
    "Độ Bền": clampedStat(0, 100, 100).optional(),
    "Cấp Cường Hóa": safeInt(0, 0).optional(),
    "Bộ Trang Bị": safeString().optional(),
    "VisualClass": safeString().optional(),
    "VisualColor": safeString().optional(),
  });

/**
 * Bản có prefault để dùng độc lập. KHÔNG dùng bản này cho ô trang bị:
 * `.prefault({}).optional()` dựng ra một món đồ RỖNG cho mọi ô, nên nhân vật
 * tay không vẫn "đang mặc" bảy món vô danh — dùng `EquipItemBase.optional()`.
 */
export const EquipItemSchema = EquipItemBase.prefault({});

export type EquipItem = z.infer<typeof EquipItemBase>;

/**
 * ĐIỂM TÀI NGUYÊN trên lưới Tầng 1 (M18). Sinh bằng THUẬT TOÁN xác suất theo
 * địa hình (territory/resourceNodes.ts) rồi GHI VÀO SAVE — nhờ vậy AI đọc được,
 * kể được, và có thể tự thêm điểm mới khi lời kể nhắc tới ("mạch sắt lộ thiên
 * phía đông"). Công trình khai thác phải dựng ĐÈ lên điểm mới ăn được trữ lượng.
 *
 * "Trữ Lượng" là BẬC 0–3: 0 = đã cạn, 1 = nghèo, 2 = khá, 3 = giàu. Khai thác
 * lâu thì tụt bậc — mỏ nào cũng có ngày hết.
 */
export const RESOURCE_NODE_GRADES = [0, 1, 2, 3] as const;

export const ResourceNodeSchema = z
  .object({
    "Mã": safeString().prefault(""),
    /** khoá hàng hoá khai thác được (Quặng Sắt, Gỗ, Đá, Than Đá, Muối…). */
    "Tài Nguyên": safeString().prefault("Gỗ"),
    /** 0 = cạn kiệt · 1 = nghèo · 2 = khá · 3 = giàu. */
    "Trữ Lượng": z.coerce.number().int().min(0).max(3).catch(2).prefault(2),
    /** tổng sản lượng còn rút được ở BẬC hiện tại (tụt bậc khi về 0). */
    "Còn Lại": safeInt(0),
    "Tọa Độ X": safeInt(0),
    "Tọa Độ Y": safeInt(0),
    "Kích Thước": safeInt(8),
    /** chưa khám phá thì không hiện trên bản đồ và không khai thác được. */
    "Đã Khám Phá": z.boolean().catch(true).prefault(true),
    /** tên công trình đang hút điểm này (rỗng = bỏ hoang). */
    "Công Trình": safeString().prefault(""),
    "Mô Tả": safeString().prefault(""),
  })
  .prefault({});
export type ResourceNode = z.infer<typeof ResourceNodeSchema>;

/**
 * MỘT TUYẾN TƯỜNG THÀNH do người chơi tự vạch (M18) — chuỗi điểm nối nhau trên
 * lưới, KHÔNG phải vành đai tự sinh quanh trọng trấn. Nhờ vậy nâng cấp Lâu Đài
 * không còn xoá mất bức tường đã xây: tường là dữ liệu riêng, sống độc lập.
 */
export const WALL_MATERIALS = ["Gỗ", "Đá", "Đá Khối", "Đá Đen"] as const;
export type WallMaterial = (typeof WALL_MATERIALS)[number];

export const WallLineSchema = z
  .object({
    "Mã": safeString().prefault(""),
    "Tên": safeString().prefault(""),
    "Cấp": safeInt(1, 1),
    "Vật Liệu": z.enum(WALL_MATERIALS).catch("Đá").prefault("Đá"),
    /** các điểm gãy khúc theo Ô lưới, theo đúng thứ tự người chơi bấm. */
    "Điểm": z.array(z.object({ x: safeInt(0), y: safeInt(0) })).catch([]).prefault([]),
    /** chiều dài tổng (ô lưới) — engine tính, dùng cho chi phí & phòng thủ. */
    "Chiều Dài": safeInt(0),
    "Đang Xây": z.boolean().catch(false).prefault(false),
    "Ngày Xây Còn Lại": safeInt(0),
    /** 0–100, hư hại do vây thành; 0 = sập. */
    "Nguyên Vẹn": clampedStat(0, 100, 100),
  })
  .prefault({});
export type WallLine = z.infer<typeof WallLineSchema>;

/**
 * ĐẶC TẢ CÔNG TRÌNH TUỲ CHỈNH (M18) — người chơi tự đặt tên và tự chọn công
 * năng. Engine đọc bảng này thay cho danh mục cứng, nên một "Vườn Thuốc Học Sĩ"
 * hay "Xưởng Ủ Rượu Nhà Redwyne" chạy y như công trình có sẵn.
 */
const CustomBuildingBase = z
  .object({
    "Tên": safeString().prefault(""),
    "Công Năng": safeString().prefault(""),
    "Nhóm": safeString().prefault("Chế Tác"),
    /** sản xuất mỗi tháng khi đủ nhân lực (khoá hàng hoá → số lượng). */
    "Sản Xuất": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
    /** nguyên liệu ăn vào mỗi tháng. */
    "Tiêu Thụ": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
    /** chỗ làm việc theo nghề (khoá nghề → số suất). */
    "Nhân Lực": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
    /** sức chứa dân cư (nhà ở). */
    "Sức Chứa Dân": safeInt(0),
    "Phòng Thủ": safeInt(0),
    "Lòng Dân/Tháng": z.coerce.number().catch(0).prefault(0),
  });
/**
 * Bản có prefault để dùng độc lập. TUYỆT ĐỐI không dùng bản này bên trong
 * BuildingSchema: `.prefault({}).optional()` vẫn dựng ra một đặc tả RỖNG cho
 * MỌI công trình, và đặc tả rỗng đó ghi đè danh mục làm sản lượng về 0.
 */
export const CustomBuildingSchema = CustomBuildingBase.prefault({});
export type CustomBuilding = z.infer<typeof CustomBuildingBase>;

/** 1 công trình trong lãnh địa (10.1). */
export const BuildingSchema = z
  .object({
    "Loại": z.enum(BUILDING_TYPES).catch("Nông Trại").prefault("Nông Trại"),
    "Cấp Độ": safeInt(1, 1),
    "Đang Xây": z.boolean().catch(false).prefault(false),
    "Ngày Xây Còn Lại": safeInt(0),
    "Tọa Độ X": safeInt(0),
    "Tọa Độ Y": safeInt(0),
    "Kích Thước": safeInt(1),
    /** mã điểm tài nguyên đang khai thác (rỗng = không bám điểm nào). */
    "Điểm Tài Nguyên": safeString().prefault(""),
    /** nhân lực THỰC SỰ đang làm việc — engine chốt lại mỗi tháng. */
    "Nhân Lực": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
    /** 0–1: tỉ lệ lấp đầy chỗ làm. Sản lượng nhân thẳng với số này. */
    "Vận Hành": z.coerce.number().min(0).max(1).catch(1).prefault(1),
    /** chỉ có ở "Công Trình Tuỳ Chỉnh" — đặc tả do người chơi soạn. */
    "Tuỳ Chỉnh": CustomBuildingBase.optional(),
  })
  .prefault({});
export type Building = z.infer<typeof BuildingSchema>;

export const ExplorationPointSchema = z.object({
  "Loại": z.enum(["Rừng rậm", "Mạch khoáng", "Nguồn nước", "Di tích"]).catch("Rừng rậm").prefault("Rừng rậm"),
  "Kích Thước": safeInt(1),
  "Trạng Thái": z.enum(["An toàn", "Nguy hiểm", "Đang khai thác", "Cạn kiệt", "Đã thám hiểm", "Đang dỡ bỏ", "Đang cải tạo"]).catch("Nguy hiểm").prefault("Nguy hiểm"),
  "Tọa Độ X": safeInt(0),
  "Tọa Độ Y": safeInt(0),
  "Sinh Thái": z.object({
    "Khai Thác": safeInt(0),
    "Phục Hồi": safeInt(0),
    "Nước": safeInt(0)
  }).prefault({})
}).prefault({});
export type ExplorationPoint = z.infer<typeof ExplorationPointSchema>;

export const DECREE_KINDS = [
  "Thuế", "Luật", "Lao Dịch", "Phúc Lợi", "Chính sách kinh tế", "Chính sách quân sự", "Bất biến",
] as const;

export const DecreeSchema = z.object({
  "Trạng Thái": z.enum(["Đang hiệu lực", "Đình trệ", "Đã bãi bỏ"]).catch("Đang hiệu lực").prefault("Đang hiệu lực"),
  "Tên": safeString().prefault(""),
  "Loại": z.enum(DECREE_KINDS).catch("Luật").prefault("Luật"),
  // Mã tra trong DECREE_CATALOG — có mã thì engine áp hiệu ứng thật mỗi tháng,
  // không có thì chỉ là tờ chiếu để AI kể (pháp lệnh do AI nghĩ ra).
  "Mã": safeString().prefault(""),
  "Hiệu Ứng": safeString().optional(),
}).prefault({});
export type Decree = z.infer<typeof DecreeSchema>;

/**
 * Chi tiết NỘI BỘ 1 vùng người chơi quản lý (10.1). KHÔNG lưu "Nhà Kiểm Soát" —
 * ai nắm vùng là nguồn chân lý DUY NHẤT ở "Chủ Quyền Lãnh Thổ" (9.5.1).
 * Giữ 3 field tối thiểu cũ (Mô Tả/Dân Số/Trung Thành) cho gói tài sản 8.5.
 */
export const TerritorySchema = z
  .object({
    "Nhà Kiểm Soát": safeString().prefault(""),
    "Người Kiểm Soát": safeString().prefault(""),
    "Tình Trạng": z.enum(["Ổn Định", "Đang Tranh Chấp", "Bị Vây", "Mới Chiếm", "Nổi Loạn"]).catch("Ổn Định").prefault("Ổn Định"),
    "Mô Tả": safeString().prefault(""),
    "Dân Số": safeInt(1000),
    "Dân Số Chi Tiết": z.object({
      "Nông Dân": safeInt(0),
      "Thợ Thủ Công": safeInt(0),
      "Thợ Mỏ": safeInt(0),
      "Tiều Phu": safeInt(0),
      "Thương Nhân": safeInt(0),
      // ── nhân lực công trường (10.3) — bị chiếm dụng khi đang thi công ──
      "Dân Phu": safeInt(0),
      "Thợ Đá": safeInt(0),
      "Thợ Mộc": safeInt(0),
      "Thợ Rèn": safeInt(0),
      "Kỹ Sư": safeInt(0),
      "Nghề Khác": safeInt(0),
      "Thất Nghiệp": safeInt(0),
    }).prefault({}),
    // ── Sức chứa dân cư (M18) — engine chốt lại mỗi tháng, AI không ghi ──
    /**
     * NHÀ CỬA CÓ SẴN: nhà tranh, nhà trọ, gác xép đã mọc lên qua nhiều đời chứ
     * không do người chơi xây. Ghim MỘT LẦN lúc lãnh địa xuất hiện (≈95% dân số
     * lúc đó) rồi đứng yên — nên dân muốn ĐÔNG THÊM thì phải có nhà mới.
     */
    "Nhà Ở Sẵn Có": safeInt(0),
    /** tổng chỗ ở = nhà có sẵn + công trình nhà ở. Dân vượt trần = vô gia cư. */
    "Sức Chứa Dân Cư": safeInt(0),
    /** số dân không có chỗ ở — kéo lòng dân xuống và mời dịch bệnh tới. */
    "Vô Gia Cư": safeInt(0),
    "Lòng Dân": clampedStat(0, 100, 60),
    "Trung Thành": clampedStat(0, 100, 60), // kept for backwards compatibility
    "Dự Trữ Lương Thực": safeInt(0),
    "Thu Nhập Bình Quân": safeInt(0),
    "Sự Kiện Đặc Biệt": z.array(safeString()).catch([]).prefault([]),
    "Thuộc Vùng": safeString().prefault(""), // regionId mà thành trì này toạ lạc
    // Neo px trên bản đồ THẾ GIỚI (bảo toàn toạ độ giữa 3 tầng — mapScale.ts).
    // Bỏ trống = suy từ địa danh/trọng trấn của vùng (territory/localMap.ts).
    "Neo Thế Giới": z.object({ X: safeInt(0), Y: safeInt(0) }).optional(),
    // Hạt giống sinh địa thế Tầng 1 — gieo LÚC ĐƯỢC PHONG / CHIẾM ĐƯỢC, nên mỗi
    // lần đổi chủ là một vùng đất mới nhưng vẫn đúng chất địa hình của vùng.
    // Bỏ trống = suy từ id (ván cũ giữ nguyên địa thế). Engine giữ, AI không ghi.
    "Hạt Giống Địa Hình": z.coerce.number().int().optional(),
    "Địa Hình": TerrainSchema.optional(),
    "Ven Biển": z.boolean().catch(false).prefault(false),
    // KHO LÃNH ĐỊA. 10 khoá lõi luôn có mặt (mọi engine cũ dựa vào chúng);
    // catchall cho phép chứa thêm bất kỳ hàng hoá nào trong content/goods.ts
    // mà không phải sửa schema mỗi lần thêm một mặt hàng mới.
    "Tài Nguyên": z
      .object({
        "Ngân Khố": safeInt(0),
        "Lương Thực": safeInt(0),
        "Gỗ": safeInt(0),
        "Đá": safeInt(0),
        "Quặng Sắt": safeInt(0),
        // ── nguyên liệu chế tác (thêm ở M17) ──
        "Than Đá": safeInt(0),
        "Thép": safeInt(0),
        "Vải Vóc": safeInt(0),
        "Ngựa": safeInt(0),
        "Muối": safeInt(0),
      })
      .catchall(safeInt(0))
      .prefault({}),
    "Vật Phẩm": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
    "Công Trình": z.record(safeString(), BuildingSchema).catch({}).prefault({}),
    "Điểm Khám Phá": z.array(ExplorationPointSchema).catch([]).prefault([]),
    // Điểm tài nguyên sinh bằng thuật toán rồi GHI LẠI — AI đọc/ghi được (M18).
    "Điểm Tài Nguyên": z.array(ResourceNodeSchema).catch([]).prefault([]),
    "Pháp Lệnh": z.record(safeString(), DecreeSchema).catch({}).prefault({}),
    // Tường thành do người chơi tự vạch — độc lập với cấp Lâu Đài (M18).
    "Tường Thành": z.array(WallLineSchema).catch([]).prefault([]),
    "Đường Đi": z.array(z.object({ x1: safeInt(0), y1: safeInt(0), x2: safeInt(0), y2: safeInt(0) })).catch([]).prefault([]),
    /**
     * GỢI Ý ĐỊA THẾ do lời kể quyết định (M18). Khi input/output của AI nhắc
     * "dựng thành bên sông" hay "vùng này lắm quặng sắt", engine ghi vào đây và
     * bộ sinh địa hình BẮT BUỘC phải chiều theo — bản đồ và lời kể không bao
     * giờ mâu thuẫn nữa.
     */
    "Gợi Ý Địa Thế": z
      .object({
        "Gần Sông": z.boolean().catch(false).prefault(false),
        "Gần Biển": z.boolean().catch(false).prefault(false),
        "Trên Núi": z.boolean().catch(false).prefault(false),
        /** tên hàng hoá chắc chắn phải có điểm tài nguyên tương ứng. */
        "Tài Nguyên Sẵn Có": z.array(safeString()).catch([]).prefault([]),
        "Ghi Chú": safeString().prefault(""),
      })
      .prefault({}),
    // ── Khủng hoảng đang diễn ra (15.4 — M12) ──
    "Khủng Hoảng": z.array(CrisisSchema).catch([]).prefault([]),
  })
  .prefault({});
export type Territory = z.infer<typeof TerritorySchema>;

// ── Hải quân (7.8) ──
export const SEA_CONDITIONS = ["Biển Lặng", "Sóng Lớn", "Sương Mù", "Bão"] as const;
export const FLEET_TYPES = ["Thuyền Dài (Greyjoy)", "Chiến Thuyền Nặng", "Thuyền Buôn Vũ Trang", "Hạm Đội Hoả Công"] as const;

/** 1 hạm đội (7.8) — neo tại lãnh địa có Bến Cảng (10.2). */
export const FleetSchema = z
  .object({
    "Đô Đốc": safeString().prefault("Khuyết"), // có thể là 1 General
    "Nhà": safeString().prefault(""), // Phe phái sở hữu hạm đội
    "Số Chiến Thuyền": safeInt(0),
    "Loại Hạm": z.enum(FLEET_TYPES).catch("Chiến Thuyền Nặng").prefault("Chiến Thuyền Nặng"),
    "Tình Trạng": z.enum(["Sẵn Sàng", "Hư Hại", "Đang Sửa"]).catch("Sẵn Sàng").prefault("Sẵn Sàng"),
    "Lãnh Địa Neo Đậu": safeString().prefault(""), // regionId ven biển có Bến Cảng
    "Bộ Binh Trên Thuyền": safeInt(0), // quân đang chở để đổ bộ (7.8)
    "Đang Phong Toả": safeString().optional(), // regionId cảng địch đang bị phong toả
  })
  .prefault({});
export type Fleet = z.infer<typeof FleetSchema>;

/** Cách đối xử con tin (14.4) — ảnh hưởng quan hệ với Nhà đối phương. */
export const CAPTIVE_TREATMENTS = ["Khách Quý", "Giam Lỏng", "Ngục Tối"] as const;

/** Tù binh / con tin (7.7 + 14.4) — bắt tướng bại trận; tiền chuộc/trao đổi/hành quyết M11. */
export const CaptiveSchema = z
  .object({
    "Họ Tên": safeString().prefault(""),
    "Nhà": safeString().prefault(""),
    "Vai Trò": z.enum(["Tướng", "Lãnh Chúa", "Hoàng Thân", "Khác"]).catch("Tướng").prefault("Tướng"),
    "Bị Bắt Bởi": safeString().prefault(""), // houseId phe giữ (thường là người chơi)
    "Giá Chuộc": safeInt(0),
    "Đối Xử": z.enum(CAPTIVE_TREATMENTS).catch("Giam Lỏng").prefault("Giam Lỏng"), // 14.4
    "_Ngày Bắt": z.coerce.number().int().catch(0).prefault(0), // readonly — ngày tuyệt đối lúc bị bắt (calendar.absoluteDay)
  })
  .prefault({});
export type Captive = z.infer<typeof CaptiveSchema>;

// ── Chính trị & Mưu đồ (mục 14) ──
/** Nhiệm vụ điệp viên (14.1). */
export const SPY_MISSIONS = ["Thu Thập Tin", "Phá Hoại", "Tung Tin Đồn", "Ám Sát (chuẩn bị)", "Nằm Vùng"] as const;
/** Loại âm mưu (14.2). */
export const PLOT_TYPES = ["Đảo Chính", "Ám Sát", "Phế Truất", "Vu Khống", "Ly Gián", "Đầu Độc"] as const;

/** Hạng tai mắt (M20) — quyết định chất lượng tin và mức rủi ro. */
export const SPY_KINDS = ["Điệp Viên", "Chim Nhỏ", "Người Trong Nhà", "Kẻ Mua Được", "Gái Lầu Xanh"] as const;

/** 1 điệp viên đã cài (14.1 + M20). */
export const SpySchema = z
  .object({
    "Cài Ở": safeString().prefault(""), // Nhà/lãnh địa/triều đình mục tiêu
    "Độ Sâu Thâm Nhập": clampedStat(0, 100, 10), // càng cao càng nhiều tin + rủi ro lộ càng thấp
    "Bị Nghi Ngờ": clampedStat(0, 100, 0), // đạt 100 => bị bắt/xử tử
    "Nhiệm Vụ": z.enum(SPY_MISSIONS).catch("Thu Thập Tin").prefault("Thu Thập Tin"),
    // ── M20 ──
    "Hạng": z.enum(SPY_KINDS).catch("Điệp Viên").prefault("Điệp Viên"),
    /** vỏ bọc còn nguyên bao nhiêu phần — mòn dần theo việc làm, 0 là trần trụi. */
    "Vỏ Bọc": clampedStat(0, 100, 70),
    /** ai cầm đầu mối này (NPC) — mất người điều khiển thì mạng lưới rối. */
    "Người Điều Khiển": safeString().prefault(""),
    "Số Tin Đã Gửi": safeInt(0),
    /** ngày tuyệt đối lúc được cài — engine ghi, dùng tính thâm niên. */
    "_Ngày Cài": z.coerce.number().int().catch(0).prefault(0),
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type Spy = z.infer<typeof SpySchema>;

/** Điệp viên ĐỊCH bị phát hiện trong sân nhà (M20 — phản gián). */
export const EnemySpySchema = z
  .object({
    "Của Nhà": safeString().prefault(""),
    "Nghi Là": safeString().prefault(""), // tên/vai người bị nghi
    "Chứng Cứ": clampedStat(0, 100, 10), // đủ chứng cứ mới bắt được mà không mất mặt
    "Đang Rình": safeString().prefault(""), // bí mật/lĩnh vực hắn nhắm tới
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type EnemySpy = z.infer<typeof EnemySpySchema>;

/**
 * BÍ MẬT (M20) — thay cho bảng "tin tình báo" phẳng trước đây. Một bí mật chỉ
 * đáng giá khi biết nó nói về AI, NẶNG cỡ nào, và có ĐỦ TIN để người khác chịu
 * tin. Bí mật đã dùng thì mất giá.
 */
export const SecretSchema = z
  .object({
    "Về Ai": safeString().prefault(""), // NPC hoặc Nhà bị bí mật này nhắm
    "Chủ Đề": safeString().prefault(""),
    "Nội Dung": safeString().prefault(""),
    /** sức nặng 0-100: đủ lớn thì đổi được cả một lời thề. */
    "Sức Nặng": clampedStat(0, 100, 40),
    /** độ tin cậy 0-100: tin vặt của gái lầu xanh khác thư có niêm phong. */
    "Độ Tin Cậy": clampedStat(0, 100, 50),
    "Nguồn": safeString().prefault(""), // điệp viên/ai kể
    "Đã Dùng": z.boolean().catch(false).prefault(false),
    /** đã bị phe khác biết → không còn là đòn bẩy độc quyền. */
    "Đã Lan Ra": z.boolean().catch(false).prefault(false),
    "_Ngày Biết": z.coerce.number().int().catch(0).prefault(0),
  })
  .prefault({});
export type Secret = z.infer<typeof SecretSchema>;

/** Giai đoạn một âm mưu (M20) — âm mưu không phải cái thanh tiến độ suông. */
export const PLOT_PHASES = ["Ấp Ủ", "Chiêu Mộ", "Chuẩn Bị", "Ra Tay", "Che Dấu", "Đã Xong", "Đã Vỡ"] as const;

/** 1 âm mưu đang tiến hành (14.2 + M20). */
export const PlotSchema = z
  .object({
    "Loại": z.enum(PLOT_TYPES).catch("Vu Khống").prefault("Vu Khống"),
    "Mục Tiêu": safeString().prefault(""), // NPC/Nhà bị nhắm
    "Tiến Độ": clampedStat(0, 100, 0), // đủ 100 mới kích hoạt được
    "Đồng Mưu": z.array(safeString()).catch([]).prefault([]), // NPC tham gia; càng nhiều càng nhanh nhưng càng dễ lộ
    "Độ Bại Lộ": clampedStat(0, 100, 0), // đạt ngưỡng => mục tiêu biết trước, phản đòn
    // ── M20 ──
    "Giai Đoạn": z.enum(PLOT_PHASES).catch("Ấp Ủ").prefault("Ấp Ủ"),
    /** Vàng đã rót vào (Đồng Đỏ) — đẩy nhanh nhưng để lại dấu vết tiền. */
    "Vốn Đã Bỏ": safeInt(0),
    /** ai đang lần theo dấu — có tên là mục tiêu đã ngờ. */
    "Kẻ Điều Tra": safeString().prefault(""),
    /** cái giá phải trả nếu vỡ — AI đọc để kể hậu quả cho đúng. */
    "Hậu Quả Nếu Lộ": safeString().prefault(""),
    "_Ngày Bắt Đầu": z.coerce.number().int().catch(0).prefault(0),
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type Plot = z.infer<typeof PlotSchema>;

// ── NGOẠI GIAO (M20) ──

/**
 * Trạng thái PHÁP LÝ giữa hai Nhà — khác "Thái Độ Các Nhà" (tình cảm) và khác
 * "Tin Cậy" (họ có tin lời ta không).
 */
export const DIPLO_STATES = [
  "Hoà Bình", "Chiến Tranh", "Đình Chiến", "Liên Minh", "Thần Phục Ta", "Ta Thần Phục",
] as const;
export type DiploState = (typeof DIPLO_STATES)[number];

/** Loại hiệp ước ký được giữa hai Nhà (M20). */
export const TREATY_TYPES = [
  "Hoà Ước", "Đình Chiến", "Liên Minh Quân Sự", "Không Xâm Phạm",
  "Thông Thương", "Triều Cống", "Hôn Ước", "Thề Trung Thành", "Đổi Con Tin",
] as const;

export const TreatySchema = z
  .object({
    "Loại": z.enum(TREATY_TYPES).catch("Hoà Ước").prefault("Hoà Ước"),
    "Điều Khoản": safeString().prefault(""),
    /** ngày tuyệt đối hết hiệu lực; 0 = vĩnh viễn (tới khi có kẻ phá). */
    "Ngày Hết Hạn": safeInt(0),
    /** cống nạp mỗi tháng (Đồng Đỏ): dương = họ trả ta, âm = ta trả họ. */
    "Cống Nạp Tháng": z.coerce.number().int().catch(0).prefault(0),
    "Còn Hiệu Lực": z.boolean().catch(true).prefault(true),
    /** ai xé giấy: "" = còn nguyên, "Ta" hoặc "Họ". */
    "Bên Phá": safeString().prefault(""),
    "_Ngày Ký": z.coerce.number().int().catch(0).prefault(0),
  })
  .prefault({});
export type Treaty = z.infer<typeof TreatySchema>;

/**
 * ÂN OÁN (casus belli — M20): lý do để tuyên chiến mà không mất mặt, hoặc món nợ
 * người ta ghi để đòi lại. Mờ dần theo thời gian nhưng máu thì không mờ.
 */
export const GrievanceSchema = z
  .object({
    "Việc": safeString().prefault(""),
    /** 0-100: cướp một xe lương khác hẳn giết một lãnh chúa dưới mái nhà mình. */
    "Mức": clampedStat(0, 100, 20),
    /** "Họ Nợ Ta" = ta có cớ đánh họ; "Ta Nợ Họ" = họ có cớ đánh ta. */
    "Bên Nợ": z.enum(["Họ Nợ Ta", "Ta Nợ Họ"]).catch("Họ Nợ Ta").prefault("Họ Nợ Ta"),
    "_Ngày": z.coerce.number().int().catch(0).prefault(0),
  })
  .prefault({});
export type Grievance = z.infer<typeof GrievanceSchema>;

/** Quan hệ ngoại giao đầy đủ với MỘT Nhà (M20). Key = houseId. */
export const DiplomacyRelationSchema = z
  .object({
    "Trạng Thái": z.enum(DIPLO_STATES).catch("Hoà Bình").prefault("Hoà Bình"),
    "War Score": clampedStat(-100, 100, 0),
    /** họ có tin lời ta không — khác hẳn họ có THÍCH ta không. */
    "Tin Cậy": clampedStat(-100, 100, 0),
    "Hiệp Ước": z.array(TreatySchema).catch([]).prefault([]),
    "Ân Oán": z.array(GrievanceSchema).catch([]).prefault([]),
    /** ngày tuyệt đối hết hạn đình chiến (0 = không có). */
    "Ngày Hết Hạn Đình Chiến": safeInt(0),
    /** engine chốt lại mỗi tháng từ các hiệp ước còn hiệu lực (Đồng Đỏ). */
    "_Cống Nạp Tháng": z.coerce.number().int().catch(0).prefault(0),
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type DiplomacyRelation = z.infer<typeof DiplomacyRelationSchema>;

/** Nhiệm vụ sứ giả (M20). */
export const ENVOY_MISSIONS = [
  "Cầu Hoà", "Cầu Hôn", "Đòi Cống Nạp", "Đề Nghị Liên Minh", "Đòi Con Tin",
  "Tuyên Chiến", "Doạ Dẫm", "Thăm Dò", "Xin Lỗi",
] as const;

export const EnvoySchema = z
  .object({
    "Tên": safeString().prefault(""),
    "Tới Nhà": safeString().prefault(""),
    "Nhiệm Vụ": z.enum(ENVOY_MISSIONS).catch("Thăm Dò").prefault("Thăm Dò"),
    "Trạng Thái": z.enum(["Đang Đi", "Đang Đàm Phán", "Đang Về", "Đã Về", "Mất Tích"]).catch("Đang Đi").prefault("Đang Đi"),
    /** số ngày còn lại của chặng hiện tại. */
    "Ngày Còn Lại": safeInt(0),
    "Kết Quả": safeString().prefault(""),
  })
  .prefault({});
export type Envoy = z.infer<typeof EnvoySchema>;

/**
 * LỜI ĐỀ NGHỊ đang chờ ta trả lời (M20). Người chơi KHÔNG bấm nút — họ nói ra
 * trong cuộc chơi, AI kể diễn biến rồi phát thẻ chốt hạ.
 */
export const DiploOfferSchema = z
  .object({
    "Từ Nhà": safeString().prefault(""),
    "Loại": z.enum(TREATY_TYPES).catch("Hoà Ước").prefault("Hoà Ước"),
    "Điều Khoản": safeString().prefault(""),
    "Cống Nạp Tháng": z.coerce.number().int().catch(0).prefault(0),
    /** số năm hiệu lực nếu ký; 0 = vĩnh viễn. */
    "Số Năm": safeInt(0),
    /** ngày tuyệt đối mà lời đề nghị hết hiệu lực (im lặng = từ chối). */
    "Ngày Hết Hạn Trả Lời": safeInt(0),
    "Ai Mang Tới": safeString().prefault(""),
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type DiploOffer = z.infer<typeof DiploOfferSchema>;

// ── Rồng — hệ thống đầy đủ (7.15 mở rộng) ──

/** 5 chỉ số cốt lõi rồng (thang 1-20). */
export const DRAGON_STATS = ["Sức Lửa", "Sức Bay", "Giáp Vảy", "Hung Dữ", "Trung Thành"] as const;
export type DragonStat = (typeof DRAGON_STATS)[number];

/** 5 kỹ năng rồng (cấp 0-10). */
export const DRAGON_SKILLS = ["Phun Lửa", "Lượn Gió", "Bổ Nhào", "Gầm Hống", "Chiến Đấu Trên Không"] as const;
export type DragonSkill = (typeof DRAGON_SKILLS)[number];

/** Kích cỡ rồng — gate HP base + hiệu ứng chiến trường. */
export const DRAGON_SIZES = ["Non", "Trưởng Thành", "Khổng Lồ (Balerion-class)"] as const;
export type DragonSize = (typeof DRAGON_SIZES)[number];

/** HP cơ bản theo kích cỡ (trước bonus Giáp Vảy). */
export const DRAGON_SIZE_HP: Record<DragonSize, number> = {
  "Non": 200,
  "Trưởng Thành": 500,
  "Khổng Lồ (Balerion-class)": 1000,
};


/** Trứng rồng (Hóa đá, đang ấp, chuẩn bị nở) */
export const DragonEggSchema = z
  .object({
    "Tên": safeString().optional(),
    "Màu Sắc": safeString().prefault("Đen Tuyền"),
    "Nhiệt Độ": z.enum(["Nguội Lạnh", "Ấm", "Nóng Rực"]).catch("Nguội Lạnh").prefault("Nguội Lạnh"),
    "Tình Trạng": z.enum(["Hóa Đá", "Đang Ấp", "Nứt Vỏ"]).catch("Hóa Đá").prefault("Hóa Đá"),
    "Chủ Nhân": safeString().optional(),
    "Mô Tả": safeString().prefault("Một quả trứng to bằng đầu người."),
  })
  .prefault({});
export type DragonEgg = z.infer<typeof DragonEggSchema>;

/** Rồng (7.15) — hệ số phi đối xứng, gate theo Era. */
export const DragonSchema = z
  .object({
    "Tên": safeString().prefault(""),
    "Kích Cỡ": z.enum(DRAGON_SIZES).catch("Non").prefault("Non"),
    "Kỵ Sĩ": safeString().optional(),
    "Độ Hảo Cảm": z.record(safeString(), clampedStat(0, 100, 0)).catch({}).prefault({}),
    "Mức Độ Thuần Hóa": clampedStat(0, 100, 0),
    "Trạng Thái Thu Phục": z.enum(["Hoang Dã", "Đang Cảm Hóa", "Đã Có Chủ"]).catch("Hoang Dã").prefault("Hoang Dã"),
    "Đặc Tính": z.array(z.enum(["Hung Dữ", "Hiền Hòa", "Lười Biếng", "Khát Máu", "Trung Thành", "Bất Trị"])).catch([]).prefault([]),
    "Đang Bị Xích": z.boolean().catch(false).prefault(false),
    "Nơi Ổ": safeString().optional(),
    "Tình Trạng": z.enum(["Khỏe", "Bị Thương", "Kiệt Sức", "Đang Hồi Phục"]).catch("Khỏe").prefault("Khỏe"),
    "_HP": clampedStat(0, 2000, 200),
    "_HP Tối Đa": safeInt(200),
    "Màu Sắc": safeString().prefault("Đen"),
    "Tuổi": safeInt(1),
    // ── chỉ số rồng (thang 1-20) ──
    "Chỉ Số": z
      .object({
        "Sức Lửa": clampedStat(1, 20, 5),    // sức mạnh lửa phun
        "Sức Bay": clampedStat(1, 20, 5),     // tốc độ + độ cao bay
        "Giáp Vảy": clampedStat(1, 20, 3),   // phòng ngự + HP bonus
        "Hung Dữ": clampedStat(1, 20, 5),    // sát thương cận chiến (vuốt/nanh)
        "Trung Thành": clampedStat(1, 20, 3), // độ nghe lời kỵ sĩ
      })
      .prefault({}),
    // ── kỹ năng rồng (cấp 0-10) ──
    "Kỹ Năng": z
      .record(
        safeString(),
        clampedStat(0, 10, 0),
      )
      .catch({})
      .prefault({}),
    // mô tả ngắn cho AI tường thuật
    "Mô Tả": safeString().prefault(""),

    // ── M19: rồng là một BINH CHỦNG RIÊNG, không nằm trong biên chế bộ binh ──
    /** houseId phe sở hữu — rỗng = rồng hoang. */
    "Nhà": safeString().prefault(""),
    /** territoryId nơi rồng đang đậu (ổ, sân rồng, hoặc đang theo quân). */
    "Đồn Trú": safeString().prefault(""),
    /** territoryId đích khi rồng đang bay; rỗng = đang đậu. */
    "Đang Bay Đến": safeString().optional(),
    "Ngày Bay Còn Lại": safeInt(0),
    /** kinh nghiệm trận mạc 0-100 — rồng từng đánh nhiều thì né lao, biết chọn hướng gió. */
    "Kinh Nghiệm": clampedStat(0, 100, 0),
    "Số Trận": safeInt(0),
    /** sải cánh (mét) — engine suy từ tuổi/kích cỡ, dùng cho lời kể. */
    "_Sải Cánh": safeInt(3),
    /** cơn đói 0-100 (100 = đói cồn cào) — rồng đói thì bất trị, có khi ăn cả dân. */
    "Độ Đói": clampedStat(0, 100, 20),
    /** số gia súc rồng ngốn mỗi tháng — engine tính theo kích cỡ. */
    "_Khẩu Phần Tháng": safeInt(10),
    /** vết thương đang mang (mũi lao xuyên cánh, vảy nứt...). */
    "Vết Thương": z.array(safeString()).catch([]).prefault([]),
    "Ngày Hồi Phục Còn Lại": safeInt(0),
    /** đang bị kỵ sĩ cưỡi ra trận hay chỉ thả rông quanh ổ. */
    "Sẵn Sàng Chiến Đấu": z.boolean().catch(true).prefault(true),
  })
  .prefault({});
export type Dragon = z.infer<typeof DragonSchema>;

// ── Chư hầu & lính đánh thuê (M19) ──

/** Trạng thái triệu tập của một chư hầu khi lãnh chúa phất cờ. */
export const VASSAL_CALL_STATES = ["Ở Nhà", "Đang Tập Hợp", "Đang Hành Quân", "Đã Tới", "Từ Chối"] as const;

/**
 * CHƯ HẦU (M19) — xương sống của chế độ phong kiến phân quyền: lãnh chúa KHÔNG
 * sở hữu quân của chư hầu, chỉ có quyền HIỆU TRIỆU. Chư hầu trung thành thấp có
 * thể chần chừ, gửi thiếu quân, hoặc thẳng thừng từ chối.
 */
export const VassalSchema = z
  .object({
    "Tên Nhà": safeString().prefault(""),
    "Thành Trì": safeString().prefault(""),
    "Vùng": safeString().prefault(""), // regionId chư hầu trực thuộc
    "Chủ Của": safeString().prefault(""), // houseId lãnh chúa mà nhà này thần phục
    "Trung Thành": clampedStat(0, 100, 60),
    /** số quân nhà này có thể dốc ra khi được hiệu triệu. */
    "Quân Cam Kết": safeInt(0),
    /** binh chủng chủ đạo của nhà này. */
    "Binh Chủng Chính": z.enum(TROOP_TYPES_ALL).catch("Dân Binh").prefault("Dân Binh"),
    "Trạng Thái": z.enum(VASSAL_CALL_STATES).catch("Ở Nhà").prefault("Ở Nhà"),
    /** ngày còn lại tới khi quân chư hầu có mặt ở điểm hẹn. */
    "Ngày Tới Nơi": safeInt(0),
    /** số quân thực sự đã gửi trong lần hiệu triệu này. */
    "Quân Đã Gửi": safeInt(0),
    /** số ngày quân chư hầu đã ở ngoài đồng — càng lâu càng bào mòn trung thành. */
    "Ngày Tòng Quân": safeInt(0),
    "Ghi Chú": safeString().prefault(""),
  })
  .prefault({});
export type Vassal = z.infer<typeof VassalSchema>;

/**
 * ĐỘI ĐÁNH THUÊ đang chào giá (M19) — chỉ thuê được ở nơi ĐANG CÓ đội đóng
 * quân. Engine gieo sẵn theo bến cảng/chợ lính, AI cũng có thể dẫn một đội tới
 * bằng thẻ <sellsword_offer>.
 */
export const MercenaryCompanySchema = z
  .object({
    "Tên Đoàn": safeString().prefault(""),
    /** nơi đang đóng quân: territoryId hoặc tên địa danh (Essos) khớp Vị Trí. */
    "Đang Ở": safeString().prefault(""),
    "Quân Số": safeInt(0),
    "Binh Chủng": z.enum(TROOP_TYPES_ALL).catch("Lính Đánh Thuê").prefault("Lính Đánh Thuê"),
    "Huấn Luyện": z.enum(["Tinh Nhuệ", "Thành Thạo", "Mới Lập Đội", "Rời Rạc"]).catch("Thành Thạo").prefault("Thành Thạo"),
    /** tiền đặt cọc ký khế ước (Đồng Đỏ) cho TOÀN đoàn. */
    "Tiền Ký Khế Ước": safeInt(0),
    /** lương tháng mỗi 100 lính (Đồng Đỏ). */
    "Lương Tháng Mỗi 100": safeInt(0),
    /** danh tiếng giữ lời 0-100 — thấp thì dễ trở giáo giữa trận. */
    "Chữ Tín": clampedStat(0, 100, 50),
    /** số ngày đoàn còn nán lại trước khi nhổ trại đi nơi khác. */
    "Ngày Còn Ở Lại": safeInt(30),
    "Mô Tả": safeString().prefault(""),
  })
  .prefault({});
export type MercenaryCompany = z.infer<typeof MercenaryCompanySchema>;

// ── Cung đình (mục 13) ──
/** 7 chức Tiểu Hội Đồng (13.1). */
export const COURT_POSITIONS = [
  "Bàn Tay Nhà Vua",          // Hand of the King
  "Đại Chưởng Ngân Khố",      // Master of Coin
  "Đại Chưởng Ấn",            // Master of Laws
  "Đô Đốc Hạm Đội",           // Master of Ships
  "Đại Điệp Viên",            // Master of Whisperers
  "Học Sĩ Trưởng",            // Grand Maester
  "Tổng Chỉ Huy Ngự Lâm Quân", // Lord Commander of the Kingsguard
] as const;
export type CourtPosition = (typeof COURT_POSITIONS)[number];

/** Luật kế vị theo Nhà (13.4). */
export const SUCCESSION_LAWS = [
  "Trưởng Nam",                    // male-preference primogeniture (mặc định Westeros)
  "Trưởng Tử Bất Kể Giới (Dorne)", // absolute primogeniture (Dorne)
  "Bầu Chọn (Sắt)",                // kingsmoot elective (Iron Islands)
  "Chỉ Định",                      // designated heir
] as const;

/** 1 ghế Tiểu Hội Đồng (13.1). Năng Lực lấy từ khối "Năng Lực" của NPC giữ chức. */
export const CourtPositionSchema = z
  .object({
    "Người Giữ Chức": safeString().prefault("Khuyết"),
    "Năng Lực": clampedStat(0, 100, 30), // 0-100, engine đồng bộ từ NPC theo lĩnh vực chức vụ
  })
  .prefault({});
export type CourtSeat = z.infer<typeof CourtPositionSchema>;

/** 1 hôn ước đang thương lượng (13.4). */
export const BetrothalSchema = z
  .object({
    "Đối Tượng": safeString().prefault(""),    // tên người được cầu hôn (phía ta)
    "Nhà Đối Tác": safeString().prefault(""),  // houseId Nhà đối tác
    "Của Hồi Môn": safeInt(0),                 // Vàng chuyển giao
    "Chi Trả": z.enum(["Ta Trả", "Ta Nhận"]).catch("Ta Nhận").prefault("Ta Nhận"),
    "Lợi Ích Chính Trị": safeString().prefault(""),
  })
  .prefault({});
export type Betrothal = z.infer<typeof BetrothalSchema>;


export const WOUND_TYPES = ["Bình Thường", "Trầy Xước", "Xuất Huyết", "Gãy Xương", "Nhiễm Độc", "Hoại Tử", "Bỏng", "Đứt Lìa", "Tàn Phế", "Hôn Mê", "Mù Loà", "Nhiễm Trùng", "Khó Thở", "Mất Huyết Áp"] as const;

export const BodyPartSchema = z.object({
  "Tình Trạng": clampedStat(0, 100, 100),
  "Triệu Chứng": z.array(z.enum(WOUND_TYPES)).catch(["Bình Thường"]).prefault(["Bình Thường"]),
  "Thời Gian Lành Còn (giây)": z.number().catch(0).prefault(0)
}).prefault({});


export const StatDataSchema = z
  .object({
    "Chế Độ Hiện Tại": z.enum(["Chế Độ Nhập Vai", "Chế Độ Chiến Tranh"]).catch("Chế Độ Nhập Vai").prefault("Chế Độ Nhập Vai"),

    // chọn lúc New Game (8.3), engine + system prompt đọc
    "Cài Đặt Ván": z
      .object({
        "Chế Độ Tường Thuật": z.enum(["Theo Sát Nguyên Tác", "Diễn Giải Tự Do"]).catch("Diễn Giải Tự Do").prefault("Diễn Giải Tự Do"),
        "Hướng Kịch Bản": z.enum(["Người Chơi Là Trung Tâm", "Người Chơi Là Bối Cảnh"]).catch("Người Chơi Là Trung Tâm").prefault("Người Chơi Là Trung Tâm"),
        "Độ Khó Chiến Đấu": z.enum(["Nhàn Hạ", "Cân Bằng", "Chân Thực"]).catch("Cân Bằng").prefault("Cân Bằng"),
        "Thời Kỳ": safeString().optional(), // id Era (8.2)
        "$Bối Cảnh Ẩn": safeString().prefault(""), // Bộ nhớ ẩn dành riêng cho AI (mối quan hệ, gia phả, bối cảnh phức tạp)
      })
      .prefault({}),

    "Thông Tin Nhân Vật": z
      .object({
        "Họ Tên": safeString().prefault("Vô Danh"),
        "Lục Địa": z.enum(["Westeros", "Essos"]).catch("Westeros").prefault("Westeros"),
        "Văn Hoá": safeString().prefault("First Men"),
        "Tôn Giáo": safeString().prefault("Thất Diện Thần"),
        "Thần Bảo Hộ": safeString().prefault(""),
        "Đức Tin": safeInt(30),
        "Ân Sủng": safeInt(10),
        "Nhà": z.enum(HOUSES).catch("Không Nhà").prefault("Không Nhà"),
        "Huyết Mạch": safeString().prefault("Không Rõ Huyết Mạch"),
        "Tên Gia Tộc Tùy Chỉnh": safeString().optional(),
        "Khẩu Hiệu": safeString().optional(),
        "Ảnh Gia Huy": safeString().optional(),
        "Xuất Thân": safeString().prefault(""),
        "Biệt Danh": safeString().optional(),
        "Ảnh Chân Dung": safeString().optional(), // khoá tham chiếu Dexie (5.1c)
        "Cấp Độ": safeInt(1, 1),
        "Kinh Nghiệm": safeInt(0),
        "Ngân Khố": safeInt(0), // Backend lưu dưới dạng Đồng Đỏ (Copper Pennies)
        "Ngân Khố Essos": z.record(safeString(), safeInt(0)).catch({}).prefault({}),
        // ── TUỔI TÁC (động theo thời gian truyện) ──
        "Tuổi": safeInt(25),
        "Năm Sinh": z.coerce.number().int().optional(),
        "Giai Đoạn Đời": z.enum(LIFE_STAGES).catch("Trưởng Thành").prefault("Trưởng Thành"),
        "Tước Vị": z.enum(["Thường Dân", "Người Thừa Kế", "Hiệp Sĩ", "Lãnh Chúa Thành Trì", "Lãnh Chúa", "Đại Lãnh Chúa", "Quốc Vương", "Vua", "Vua Bảy Vương Quốc", "Hoàng Đế", "Hoàng Tử", "Vương Hậu", "Công Chúa", "Tiểu Thư", "Vương Thân", "Vương phi"]).catch("Thường Dân").prefault("Thường Dân"),
        "Đã Chết": z.boolean().catch(false).prefault(false),
        "Nguyên Nhân Cái Chết": safeString().optional(),
        "Các Loại Bệnh": z.array(CharacterDiseaseSchema).catch([]).prefault([]),
        // Kho hàng riêng của gia tộc — dùng cho rèn đúc và buôn bán. Catchall
        // để chứa được mọi mặt hàng trong content/westeros/goods.ts (M18).
        "Tài Nguyên Gia Tộc": z.object({
          "Gỗ": safeInt(0),
          "Đá": safeInt(0),
          "Quặng Sắt": safeInt(0),
          "Lương Thực": safeInt(0),
          "Ngựa": safeInt(0),
          "Thép Valyria": safeInt(0)
        }).catchall(safeInt(0)).prefault({})
      })
      .prefault({}),

    // persona người chơi tự viết (wizard Bước 6) — AI dùng giữ giọng nhân vật
    "Persona": z
      .object({
        "Ngoại Hình": safeString().prefault(""),
        "Tính Cách": safeString().prefault(""),
        "Tiểu Sử": safeString().prefault(""),
        "Đặc Điểm": z
          .object({
            "Màu Mắt": safeString().prefault(""),
            "Màu Tóc": safeString().prefault(""),
            "Chiều Cao": safeString().prefault(""),
          })
          .prefault({}),
      })
      .prefault({}),

    // danh tiếng đa chiều (16.4 — 4 trục, khởi điểm từ wizard Bước 7; cơ chế đầy đủ M13)
    "Danh Vọng": z
      .object({
        "Vinh Dự": clampedStat(-100, 100, 0),
        "Nhân Từ": clampedStat(-100, 100, 0),
        "Uy Dũng": clampedStat(-100, 100, 0),
        "Xảo Quyệt": clampedStat(-100, 100, 0),
        // engine-derived (reputationEngine.ts → effects.ts)
        "_Bậc Danh Vọng": safeInt(0),          // -5..+5
        "_Nhãn Danh Vọng": safeString().prefault("Vô Danh Tiểu Tốt"),
      })
      .prefault({}),

    // HP/Thể Lực hiện tại — TRẦN thật lấy từ _HP Tối Đa/_Thể Lực Tối Đa (5.1f-B),
    // engine clamp lại trong hiệu ứng lan toả sau mỗi patch
    "Chỉ Số Sinh Tồn": z
      .object({
        "HP": clampedStat(0, 9999, 100),
        "Thể Lực": clampedStat(0, 9999, 100),
        "Pháp Lực": clampedStat(0, 9999, 0), // chỉ >0 nếu thiên phú ma thuật + Era cho phép
        "Đói": clampedStat(0, 100, 100),
        "Khát": clampedStat(0, 100, 100),
        "Lo Âu": clampedStat(0, 100, 0),
      })
      .prefault({}),

    "Cơ Thể": z
      .record(safeString(), BodyPartSchema)
      .catch({})
      .prefault({
        "Đầu": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Cổ": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Vai Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Vai Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Ngực": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bụng": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Sườn Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Sườn Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bắp Tay Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bắp Tay Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Cẳng Tay Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Cẳng Tay Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bàn Tay Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bàn Tay Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Đùi Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Đùi Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Đầu Gối Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Đầu Gối Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bắp Chân Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bắp Chân Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bàn Chân Trái": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 },
        "Bàn Chân Phải": { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 }
      }),
    
    "Bệnh Tật": z.array(CharacterDiseaseSchema).catch([]).prefault([]),

    // ── 6 CHỈ SỐ CỐT LÕI (5.1f-A, thang 1-20) — THAY khối 4-trục rút gọn 5.1 ──
    "Chỉ Số Cốt Lõi": z
      .object({
        "Sức Mạnh": clampedStat(1, 20, 8),
        "Nhanh Nhẹn": clampedStat(1, 20, 8),
        "Thể Chất": clampedStat(1, 20, 8),
        "Trí Tuệ": clampedStat(1, 20, 8),
        "Tinh Tường": clampedStat(1, 20, 8),
        "Uy Tín": clampedStat(1, 20, 8),
      })
      .prefault({}),

    "Kinh Nghiệm Chỉ Số": z
      .object({
        "Sức Mạnh": clampedStat(0, 9999, 0),
        "Nhanh Nhẹn": clampedStat(0, 9999, 0),
        "Thể Chất": clampedStat(0, 9999, 0),
        "Trí Tuệ": clampedStat(0, 9999, 0),
        "Tinh Tường": clampedStat(0, 9999, 0),
        "Uy Tín": clampedStat(0, 9999, 0),
      })
      .prefault({}),

    // ── CHỈ SỐ PHÁI SINH (5.1f-B) — prefix _: engine tự tính, AI không ghi ──
    "Chỉ Số Phái Sinh": z
      .object({
        "_HP Tối Đa": safeInt(100),
        "_Thể Lực Tối Đa": safeInt(100),
        "_Phòng Thủ": safeInt(10),
        "_Sát Thương Cận": safeInt(0),
        "_Sát Thương Xa": safeInt(0),
        "_Tải Trọng": safeInt(50),
        "_Chống Chịu": safeInt(0),
        "_Kháng Bệnh": safeInt(50),
      })
      .prefault({}),

    // ── THIÊN PHÚ (5.1f-C) ──
    "Thiên Phú": z
      .record(
        safeString(),
        z
          .object({
            "Loại": z
              .enum(["Chiến Đấu", "Xã Hội", "Trí Tuệ", "Thể Chất", "Ma Thuật", "Xuất Thân", "Khiếm Khuyết"])
              .catch("Chiến Đấu")
              .prefault("Chiến Đấu"),
            "Mô Tả": safeString().prefault(""),
            "Hiệu Ứng": safeString().prefault(""), // chuỗi máy-đọc "Sức Mạnh+2, Sát Thương Cận+1" (C1)
            "Điều Kiện": safeString().optional(),
            "Ẩn": z.boolean().catch(false).prefault(false),
          })
          .prefault({}),
      )
      .catch({})
      .prefault({}),

    // ── KỸ NĂNG (5.1f-D, cấp 0-10) ──
    "Kỹ Năng": z
      .record(
        safeString(),
        z
          .object({
            "Cấp": clampedStat(0, 10, 0),
            "Kinh Nghiệm": clampedStat(0, 9999, 0),
            "Nhóm": z
              .enum(["Chiến Đấu", "Sinh Tồn", "Xã Hội", "Trí Tuệ", "Thủ Công", "Ma Thuật"])
              .catch("Chiến Đấu")
              .prefault("Chiến Đấu"),
          })
          .prefault({}),
      )
      .catch({})
      .prefault({}),

    // ── TRANG BỊ THEO SLOT (5.1f-E) ──
    "Trang Bị Đang Mặc": z
      .object({
        "Vũ Khí Chính": EquipItemBase.optional(),
        "Vũ Khí Phụ": EquipItemBase.optional(),
        "Giáp Thân": EquipItemBase.optional(),
        "Mũ/Nón": EquipItemBase.optional(),
        "Khiên": EquipItemBase.optional(),
        "Trang Sức": EquipItemBase.optional(),
        "Vật Phẩm Đặc Biệt": EquipItemBase.optional(),
      })
      .prefault({}),

    // ── ĐIỂM THĂNG TIẾN (5.1f-F) ──
    "Điểm Chưa Phân Bổ": z
      .object({
        "Điểm Chỉ Số": safeInt(0),
        "Điểm Kỹ Năng": safeInt(0),
      })
      .prefault({}),

    "Túi Đồ": z
      .record(
        safeString(),
        z
          .object({
            "Số Lượng": safeInt(1),
            "Mô Tả": safeString().prefault(""),
          })
          .prefault({}),
      )
      .catch({})
      .prefault({}),

    "Kho Vũ Khí": z.array(EquipItemSchema).catch([]).prefault([]),

    "Mối Quan Hệ": z
      .object({
        "NPC Chính": z.record(safeString(), NpcSchema).catch({}).prefault({}),
        "Thành Viên Gia Tộc": z.record(safeString(), NpcSchema).catch({}).prefault({}),
      })
      .prefault({}),

    "Thái Độ Các Nhà": z
      .record(
        safeString(),
        z
          .object({
            "Thái Độ": z
              .enum(["Tín Nhiệm", "Ủng Hộ", "Cảnh Giác", "Dao Động", "Bất Mãn", "Địch Ý", "Thù Địch"])
              .catch("Cảnh Giác")
              .prefault("Cảnh Giác"),
            "Mô Tả": safeString().prefault(""),
          })
          .prefault({}),
      )
      .catch({})
      .prefault({}),

    "Thế Giới": z
      .object({
        "Vị Trí": safeString().prefault("Winterfell"),
        "Năm": z.coerce.number().int().catch(298).prefault(298), // 298 AC = mốc AGOT
        // Lịch Westeros: 12 tháng × 30 ngày = 360 ngày/năm (8.7). AI báo delta
        // Ngày/Tháng khi thời gian trôi; engine chuẩn hoá tràn trong hiệu ứng
        // lan toả (Ngày>30 → Tháng+1; Tháng>12 → Năm+1) — xem mvu/calendar.ts.
        "Tháng": safeInt(1, 1),
        "Ngày": safeInt(1, 1),
        "Mùa": z.enum(SEASONS).catch("Hạ").prefault("Hạ"),
        "Thời Tiết": safeString().prefault("Quang đãng"),
        // off-screen sim news (16.3) — engine ghi, AI đọc để tường thuật
        "_Tin Nóng Off-screen": safeString().optional(),
      })
      .prefault({}),

    // ── CHỦ QUYỀN LÃNH THỔ (9.5.1) — NGUỒN CHÂN LÝ ai nắm vùng nào, phủ MỌI
    // vùng (kể cả địch/vô chủ). Bản đồ đọc động từ đây; engine giữ (AI không ghi
    // thẳng — dùng thẻ <territory_change>, extractor chặn). Key = regionId. ──
    "Chủ Quyền Lãnh Thổ": z
      .record(
        safeString(),
        z
          .object({
            "Nhà Kiểm Soát": safeString().prefault(""), // houseId; "" = vô chủ/tranh chấp
            "Người Kiểm Soát": safeString().prefault(""), // Tên vị lãnh chúa hiện tại

            "Tình Trạng": z.enum(REGION_STATUS).catch("Ổn Định").prefault("Ổn Định"),
            "Là Của Người Chơi": z.boolean().catch(false).prefault(false),
            "_Ngày Đổi Chủ": z.coerce.number().int().catch(0).prefault(0), // readonly — ngày tuyệt đối đổi chủ gần nhất (animation + replay 9.3)
            // trạng thái vây thành (12.2) — engine giữ (readonly), chỉ có khi Tình Trạng "Bị Vây"
            "_Vây": z
              .object({
                "Phe Vây": safeString().prefault(""), // houseId phe đang vây
                "Đơn Vị Vây": safeString().prefault(""), // key Biên Chế Quân Sự của quân vây
                "Ngày Đã Vây": z.coerce.number().int().catch(0).prefault(0),
                "Lương Còn": z.coerce.number().int().catch(0).prefault(0),
                "Ngày Vây Tối Đa": z.coerce.number().int().catch(900).prefault(900), // 30 tháng
              })
              .optional(),
          })
          .prefault({}),
      )
      .catch({})
      .prefault({}),

    // ── LÃNH ĐỊA (10.1) — CHI TIẾT NỘI BỘ chỉ vùng người chơi quản lý. Key khớp
    // regionId (hoặc tên tự đặt cho gói xuất thân 8.5). Mở rộng thu/chi ở M12. ──
    "Lãnh Địa": z.record(safeString(), TerritorySchema).catch({}).prefault({}),

    // ── KINH TẾ VÙNG (15.1 — M12) — cung cầu + giá cả động từng vùng. Key = regionId. ──
    "Kinh Tế Vùng": z.record(safeString(), RegionalEconomySchema).catch({}).prefault({}),

    // ── TUYẾN THƯƠNG MẠI (15.2 — M12) — lợi nhuận liên vùng. Key = tên tuyến. ──
    "Tuyến Thương Mại": z.record(safeString(), TradeRouteSchema).catch({}).prefault({}),

    // ── CHÍNH SÁCH THUẾ (15.3 — M12) ──
    "Chính Sách Thuế": TaxPolicySchema,

    // ── KHOẢN NỢ & CHO VAY (15.3 — M12) ──
    "Các Khoản Nợ": z.record(safeString(), DebtSchema).catch({}).prefault({}),
    "Các Khoản Cho Vay": z.record(safeString(), DebtSchema).catch({}).prefault({}),

    // ── QUÂN SỰ (7.4 — M8 mở rộng thêm loại quân/vị trí đồn trú) ──
    "Biên Chế Quân Sự": z.record(safeString(), MilitaryUnitSchema).catch({}).prefault({}),

    // ── CHƯ HẦU (M19) — quân của người khác, chỉ mượn được bằng uy tín. Key = houseId. ──
    "Chư Hầu": z.record(safeString(), VassalSchema).catch({}).prefault({}),

    // ── CHỢ LÍNH ĐÁNH THUÊ (M19) — các đoàn đang chào giá quanh đây. Key = tên đoàn. ──
    "Đội Đánh Thuê": z.record(safeString(), MercenaryCompanySchema).catch({}).prefault({}),

    // ── TƯỚNG LĨNH (7.7) ──
    "Tướng Lĩnh": z.record(safeString(), GeneralSchema).catch({}).prefault({}),

    // ── QUAN HỆ NGOẠI GIAO (12.1 + đại tu M20) — tình trạng PHÁP LÝ + hiệp ước +
    // ân oán + lòng tin, KHÁC "Thái Độ Các Nhà" (tình cảm). Key = houseId.
    // War Score dương = ta thắng thế. ──
    "Quan Hệ Ngoại Giao": z.record(safeString(), DiplomacyRelationSchema).catch({}).prefault({}),

    // ── NGOẠI GIAO — sổ chung (M20): uy tín giữ lời của CHÍNH TA (mọi Nhà đều
    // nhìn vào đó), sứ giả đang trên đường, và những lời đề nghị đang chờ trả lời. ──
    "Ngoại Giao": z
      .object({
        /**
         * UY TÍN CAM KẾT 0-100 — thứ đắt nhất trong ngoại giao trung cổ. Xé một
         * tờ hiệp ước là mọi Nhà khác đều bớt tin, không riêng gì Nhà bị xé.
         */
        "Uy Tín Cam Kết": clampedStat(0, 100, 60),
        "Sứ Giả": z.record(safeString(), EnvoySchema).catch({}).prefault({}),
        "Lời Đề Nghị": z.record(safeString(), DiploOfferSchema).catch({}).prefault({}),
        /** readonly — biến động ngoại giao vừa xảy ra, để AI tường thuật. */
        "_Biến Động": safeString().prefault(""),
      })
      .prefault({}),

    // ── HẠM ĐỘI (7.8) — hải chiến/đổ bộ/phong toả. Key = tên hạm đội. ──
    "Hạm Đội": z.record(safeString(), FleetSchema).catch({}).prefault({}),

    // ── TÙ BINH (7.7) — con tin bắt được sau trận; nối chính trị M11. ──
    "Tù Binh": z.record(safeString(), CaptiveSchema).catch({}).prefault({}),

    // ── RỒNG (7.15) — gate theo Era; hệ số phi đối xứng vào chiến lực. ──
    "Rồng": z.record(safeString(), DragonSchema).catch({}).prefault({}),
    "Trứng Rồng": z.record(safeString(), DragonEggSchema).catch({}).prefault({}),

    // ── CUNG ĐÌNH (13.1) — Tiểu Hội Đồng + thẩm quyền triều chính. Năng Lực người
    // giữ chức ảnh hưởng hiệu quả lĩnh vực (vd Ngân Khố cao → +% thu Vàng 10.3),
    // engine tính. Ẩn UI hoàn toàn nếu "Có Liên Quan" = false (13.5). ──
    "Triều Đình": z
      .object({
        "Có Liên Quan": z.boolean().catch(false).prefault(false), // dính líu triều chính → hiện icon (13.5)
        "Chức Vụ Người Chơi": safeString().prefault(""),          // vai trò người chơi trong triều
        "Quyền Bổ Nhiệm": z.boolean().catch(false).prefault(false), // thẩm quyền bổ nhiệm trực tiếp (13.2)
        "Triều Đình Của": safeString().prefault(""),              // triều đình của Nhà Vua / Lãnh Chúa nào
        "Tiểu Hội Đồng": z
          .object({
            "Bàn Tay Nhà Vua": CourtPositionSchema,
            "Đại Chưởng Ngân Khố": CourtPositionSchema,
            "Đại Chưởng Ấn": CourtPositionSchema,
            "Đô Đốc Hạm Đội": CourtPositionSchema,
            "Đại Điệp Viên": CourtPositionSchema,
            "Học Sĩ Trưởng": CourtPositionSchema,
            "Tổng Chỉ Huy Ngự Lâm Quân": CourtPositionSchema,
          })
          .prefault({}),
      })
      .prefault({}),

    // ── GIA TỘC HỌC (13.4) — hôn nhân & kế vị của dòng họ người chơi. Thứ Tự Kế
    // Vị + Người Thừa Kế do engine dẫn xuất từ Luật Kế Vị + Thành Viên Gia Tộc. ──
    "Gia Tộc Học": z
      .object({
        "Người Thừa Kế Hiện Tại": safeString().prefault(""),        // tên NPC (Thành Viên Gia Tộc)
        "Thứ Tự Kế Vị": z.array(safeString()).catch([]).prefault([]), // danh sách tên theo thứ tự ưu tiên
        "Luật Kế Vị": z.enum(SUCCESSION_LAWS).catch("Trưởng Nam").prefault("Trưởng Nam"),
        "Hôn Ước Đang Thương Lượng": z.record(safeString(), BetrothalSchema).catch({}).prefault({}),
        "_Khủng Hoảng Kế Vị": z.boolean().catch(false).prefault(false), // readonly — engine bật khi tranh chấp thừa kế (13.4)
      })
      .prefault({}),

    // ── TÌNH BÁO (14.1) — mạng lưới điệp viên + tin tình báo. Điệp viên tick mỗi
    // ngày: thu tin theo Độ Sâu, Bị Nghi Ngờ tăng → bị bắt ở 100. Đại Điệp Viên
    // (Tiểu Hội Đồng 13.1) Năng Lực cao → giảm "Bị Cài Điệp Viên" + tăng hiệu quả. ──
    "Tình Báo": z
      .object({
        "Điệp Viên": z.record(safeString(), SpySchema).catch({}).prefault({}),
        "Tin Tình Báo Đã Biết": z.record(safeString(), safeString()).catch({}).prefault({}), // chủ đề → nội dung tin
        "Bị Cài Điệp Viên": clampedStat(0, 100, 0), // mức triều đình mình bị địch thâm nhập
        "_Điệp Viên Vừa Lộ": safeString().prefault(""), // readonly — điệp viên vừa bị bắt (AI tường thuật)
        // ── M20 ──
        /** sổ BÍ MẬT: cái nào nói về ai, nặng cỡ nào, tin được bao nhiêu phần. */
        "Bí Mật": z.record(safeString(), SecretSchema).catch({}).prefault({}),
        /** tai mắt của ĐỊCH bị ta phát hiện — bắt sớm thì mất tin, bắt muộn thì mất bí mật. */
        "Điệp Viên Địch": z.record(safeString(), EnemySpySchema).catch({}).prefault({}),
        /** readonly — âm mưu vừa vỡ, để AI kể phản đòn. */
        "_Âm Mưu Vừa Vỡ": safeString().prefault(""),
      })
      .prefault({}),

    // ── ÂM MƯU (14.2) — plots đang chạy: Tiến Độ đua Độ Bại Lộ. Key = tên âm mưu. ──
    "Âm Mưu": z.record(safeString(), PlotSchema).catch({}).prefault({}),

    // ── TRẬN ĐANG DIỄN (7.12) — công tắc điều phối 3 tầng chiến đấu ──
    "Trận Đang Diễn": z
      .object({
        "_Đang Chiến Đấu": z.boolean().catch(false).prefault(false), // readonly — engine bật/tắt
        "Quy Mô": CombatScaleSchema,
        "_Seed": z.coerce.number().int().catch(0).prefault(0), // readonly — cố định cả trận
        "Địa Hình": TerrainSchema.optional(),
        "Điều Kiện": safeString().optional(), // thời tiết / điều kiện biển
        "Mô Tả": safeString().prefault(""), // bối cảnh từ combat_trigger (AI cung cấp)
        "Phe Ta": z.array(safeString()).catch([]).prefault([]), // key Biên Chế Quân Sự / Tướng Lĩnh
        "Phe Địch": z.array(safeString()).catch([]).prefault([]),
        "_Log": z.array(safeString()).catch([]).prefault([]), // readonly — combat log engine ghi
      })
      .prefault({}),

    // ── SỰ KIỆN & QUEST (17.1-17.4 — M14) ──

    /** Nhiệm Vụ (17.2) — quest do sự kiện/NPC/cốt truyện tạo. Key = questId. */
    "Nhiệm Vụ": z.record(safeString(), z.object({
      "Tiêu Đề": safeString().prefault(""),
      "Loại": z.enum(["Cốt Truyện Chính", "Phụ", "Gia Tộc", "Chính Trị", "Quân Sự"]).catch("Phụ").prefault("Phụ"),
      "Trạng Thái": z.enum(["Chưa Nhận", "Đang Làm", "Hoàn Thành", "Thất Bại"]).catch("Chưa Nhận").prefault("Chưa Nhận"),
      "Mục Tiêu": z.array(z.object({
        "Mô Tả": safeString(),
        "Xong": z.boolean().catch(false).prefault(false),
      })).catch([]).prefault([]),
      "Phần Thưởng": safeString().prefault(""),
      "Hạn Chót Ngày": z.coerce.number().int().optional(), // ngày tuyệt đối (calendar.absoluteDay)
      "Mô Tả": safeString().prefault(""),
    }).prefault({})).catch({}).prefault({}),

    /** Nhật Ký / Biên Niên Sử (17.4) — tự ghi sự kiện lớn. */
    "Nhật Ký": z.array(z.object({
      "Ngày": safeInt(1, 1),
      "Tháng": safeInt(1, 1),
      "Năm": safeInt(0),
      "Loại": z.enum([
        "Chiến Thắng", "Thất Bại", "Liên Minh", "Phản Bội",
        "Chiếm Đất", "Mất Đất", "Hôn Nhân", "Chết",
        "Sự Kiện", "Quest", "Cột Mốc", "Khác",
      ]).catch("Khác").prefault("Khác"),
      "Mô Tả": safeString(),
    })).catch([]).prefault([]),

    /** Cột Mốc Lịch Sử (17.3) — trạng thái beats canon. Key = beatId. */
    "Cột Mốc Lịch Sử": z.record(safeString(), z.object({
      "Đã Xảy Ra": z.boolean().catch(false).prefault(false),
      "Bị Thay Đổi": z.boolean().catch(false).prefault(false),
      "Năm Xảy Ra": safeInt(0),
    }).prefault({})).catch({}).prefault({}),

    "_engineMeta": z
      .object({
        // Nhịp = số lần AI trả lời đã áp. KHÔNG phải đơn vị thời gian trong game
        // (thời gian dùng Thế Giới.Ngày/Tháng/Năm) — chỉ để seed RNG mỗi lượt
        // trả lời sao cho tái lập được khi reroll/rollback (5bis.1).
        "_Nhịp": safeInt(0),
        "_Seed Gốc": z.coerce.number().int().catch(0).prefault(0), // cố định lúc tạo ván (5bis.1)
      })
      .prefault({}),

    "Thị Trường Khu Vực": z.record(safeString(), MarketSchema).catch({}).prefault({}),
  })
  .prefault({});

export type StatData = z.infer<typeof StatDataSchema>;

/** State mặc định đầy đủ (initvar). */
export function makeDefaultState(): StatData {
  return StatDataSchema.parse({});
}
