/**
 * NpcSchema ĐẦY ĐỦ (mục 5.1b — hợp nhất mọi field NPC): định danh/chân dung,
 * tuổi tác động, hảo cảm + giai đoạn, Tin Cậy tách riêng, ký ức, tính cách
 * 4 trục, năng lực tướng, gia tộc/kế vị, trạng thái. NPC là trái tim roleplay.
 * Nhãn bậc ("Giai Đoạn Quan Hệ"/"Giai Đoạn Đời") do ENGINE dẫn xuất (5.1d/5.1e)
 * — extractor chặn AI tự ghi.
 */
import { z } from "zod";
import { safeString, clampedStat, safeInt } from "./helpers";

export const LIFE_STAGES = ["Ấu Nhi", "Thiếu Niên", "Thiếu Niên Lớn", "Trưởng Thành", "Trung Niên", "Lão Niên"] as const;

export const RELATION_STAGES = [
  "Tử Thù",
  "Thù Địch",
  "Ác Cảm",
  "Xa Lạ",
  "Quen Biết",
  "Thân Thiết",
  "Tri Kỷ",
  "Sống Chết Có Nhau",
] as const;

export const INTIMACY_ROLES = [
  "Người Tình",
  "Người Yêu",
  "Hôn Thê",
  "Vợ",
  "Thiếp",
  "Tình Nhân Bí Mật",
] as const;

export const NpcMemorySchema = z
  .object({
    "Ngày": safeInt(1, 1),
    "Tháng": safeInt(1, 1),
    "Năm": z.coerce.number().int().optional(),
    "Sự Việc": safeString().prefault(""),
    "Cảm Xúc": z
      .enum(["Biết Ơn", "Oán Hận", "Ngưỡng Mộ", "Sợ Hãi", "Khinh Thường", "Yêu Mến", "Ghen Tị", "Trung Lập"])
      .catch("Trung Lập")
      .prefault("Trung Lập"),
    "Trọng Số": clampedStat(0, 100, 50),
  })
  .prefault({});

/**
 * Dấu vết engine cho nhịp sống ngoài cảnh. Đây không phải "ký ức quan trọng"
 * (ký ức vẫn do memoryEngine chọn lọc), mà là bằng chứng bền vững rằng NPC đã
 * tiếp tục làm việc ngay cả khi không được render trong phản hồi của AI.
 */
const OffscreenActivitySchema = z
  .object({
    "Ngày Tuyệt Đối": safeInt(0),
    "Mô Tả": safeString().prefault(""),
    "Số Lần": safeInt(0),
  })
  .prefault({});

/** Schema quan hệ thân mật — chỉ áp dụng cho NPC nữ có quan hệ tình cảm/thân xác với người chơi. */
const NpcIntimacyBase = z
  .object({
    "Vai Trò": z.enum(INTIMACY_ROLES).catch("Người Tình").prefault("Người Tình"),

    // ── THỐNG KÊ ÂN ÁI ──
    "Số Lần Ân Ái": safeInt(0),
    "Số Lần Xuất Trong": safeInt(0),
    "Lần Cuối Ân Ái": safeString().optional(),

    // ── TÌNH TRẠNG MANG THAI ──
    "Đang Mang Thai": z.boolean().catch(false).prefault(false),
    "Tháng Thai Kỳ": clampedStat(0, 9, 0),
    "Số Con Đã Sinh": safeInt(0),
  });

/**
 * Bản có prefault để dùng độc lập. KHÔNG dùng cho field "Quan Hệ Thân Mật":
 * `.prefault({}).optional()` gán quan hệ thân mật RỖNG cho MỌI NPC, khiến
 * stateRenderer báo với AI rằng ai cũng là "Người Tình" của người chơi.
 */
export const NpcIntimacySchema = NpcIntimacyBase.prefault({});

/** Chi tiết quan hệ giữa NPC này với một NPC khác */
export const NpcRelationshipSchema = z
  .object({
    "Loại Quan Hệ": z.enum([
      "Cha/Mẹ", "Con Cái", "Anh Chị Em", "Vợ/Chồng", "Hôn Ước", "Tình Nhân",
      "Đồng Minh", "Kẻ Thù", "Cấp Trên", "Thuộc Hạ", "Bằng Hữu", "Đối Thủ",
      "Ân Nhân", "Con Nợ", "Thầy", "Trò", "Khác"
    ]).catch("Khác").prefault("Khác"),
    "Độ Hảo Cảm": clampedStat(-100, 100, 0),
    "Độ Tin Cậy": clampedStat(-100, 100, 0),
    "Công Khai": z.boolean().catch(true).prefault(true), // Nếu false => Bí mật (chỉ người chơi/người trong cuộc biết)
    "Chi Tiết": safeString().optional(), // Lý do, tiểu sử tóm tắt (vd: "Đã cùng nhau chiến đấu tại Whispering Wood")
  })
  .prefault({});

export const NpcSchema = z
  .object({
    // ── ĐỊNH DANH & CHÂN DUNG ──
    "Họ Tên": safeString().prefault("Vô Danh"),
    "Biệt Danh": safeString().optional(),
    "Nhà": safeString().optional(), // string, KHÔNG enum — NPC có thể thuộc Nhà nhỏ/Essos/không rõ
    /** Hồ sơ canon hiển thị trong Sổ tay; không thay thế dữ liệu quan hệ với người chơi. */
    "Xuất Thân": safeString().optional(),
    "Văn Hoá": safeString().optional(),
    "Tôn Giáo": safeString().optional(),
    "Lục Địa": safeString().optional(),
    "Lãnh Địa": z.array(safeString()).catch([]).prefault([]),
    "Giới Tính": z.enum(["Nam", "Nữ", "Khác"]).catch("Nam").prefault("Nam"), // dùng cho luật kế vị 13.4
    "Chủng Tộc": safeString().optional(), // Loài (Người, Elf, v.v.)
    "Ngoại Hình": safeString().optional(), // Thân hình, vẻ ngoài
    "Chức Vụ": safeString().prefault(""),
    "Ảnh Chân Dung": safeString().optional(), // khoá tham chiếu Dexie (5.1c), KHÔNG base64
    "Huy Hiệu": safeString().optional(),

    // ── TUỔI TÁC (động theo thời gian truyện — 5.1e) ──
    "Tuổi": safeInt(25),
    "Năm Sinh": z.coerce.number().int().optional(), // nếu có → engine tự tính lại Tuổi khi Năm đổi
    "Giai Đoạn Đời": z.enum(LIFE_STAGES).catch("Trưởng Thành").prefault("Trưởng Thành"), // ENGINE dẫn xuất
    "Còn Sống": z.boolean().catch(true).prefault(true),
    "Nguyên Nhân Nếu Mất": safeString().optional(),

    // ── QUAN HỆ VỚI NGƯỜI CHƠI (5.1d) ──
    "Độ Hảo Cảm": clampedStat(-100, 100, 0),
    "Giai Đoạn Quan Hệ": z.enum(RELATION_STAGES).catch("Xa Lạ").prefault("Xa Lạ"), // ENGINE dẫn xuất từ số
    "Loại Quan Hệ": z
      .array(
        z.enum([
          "Đồng Minh", "Kẻ Thù", "Bằng Hữu", "Cấp Trên", "Thuộc Hạ", "Người Thân",
          "Vợ/Chồng", "Hôn Ước", "Tình Nhân", "Đối Thủ", "Ân Nhân", "Con Nợ", "Thầy", "Trò",
          "Thiếp",
        ]),
      )
      .catch([])
      .prefault([]),
    "Tin Cậy": clampedStat(-100, 100, 0), // TÁCH khỏi Hảo Cảm — "quý mà không tin"
    "Đánh Giá": safeString().prefault(""),
    "Giải Thích": safeString().prefault(""),

    // ── KÝ ỨC (16.1) ──
    "Ký Ức": z.array(NpcMemorySchema).catch([]).prefault([]),
    "Lời Hứa Chưa Giữ": z.array(safeString()).catch([]).prefault([]),

    // ── TÍNH CÁCH (16.2 — 4 trục) ──
    "Tính Cách": z
      .object({
        "Trục Thiện-Ác": clampedStat(-100, 100, 0),
        "Trục Can Đảm-Hèn Nhát": clampedStat(-100, 100, 0),
        "Trục Trung Thành-Phản Trắc": clampedStat(-100, 100, 0),
        "Trục Nóng Nảy-Điềm Tĩnh": clampedStat(-100, 100, 0),
      })
      .prefault({}),
    "Nét Tính Cách": z.array(safeString()).catch([]).prefault([]),
    "Cung Bậc Phát Triển": safeString().optional(),

    // ── NĂNG LỰC (tướng/nhân vật quan trọng — nối 7.7) ──
    "Năng Lực": z
      .object({
        "Võ Lực": clampedStat(0, 100, 30),
        "Thống Soái": clampedStat(0, 100, 30),
        "Trí Mưu": clampedStat(0, 100, 30),
        "Ngoại Giao": clampedStat(0, 100, 30),
      })
      .prefault({}),

    // ── CHỈ SỐ RPG VÀ KỸ NĂNG (Bổ sung để hiển thị chi tiết) ──
    "Chỉ Số Cốt Lõi": z.record(safeString(), safeInt(10)).optional(),
    "Kỹ Năng": z.record(safeString(), safeInt(0)).optional(),
    "Thiên Phú": z.array(safeString()).optional(),
    "Trang Bị Canon": z.array(safeString()).catch([]).prefault([]),

    // ── GIA TỘC / KẾ VỊ (nối 13.4) ──
    "Người Thừa Kế": z.boolean().catch(false).prefault(false),
    "Thứ Bậc Kế Vị": z.coerce.number().int().optional(),
    "Đã Kết Hôn Với": safeString().optional(),
    "Hôn Ước Với": safeString().optional(),
    "Cha/Mẹ": z.array(safeString()).catch([]).prefault([]),
    "Con Cái": z.array(safeString()).catch([]).prefault([]),
    "Anh Chị Em": z.array(safeString()).catch([]).prefault([]),

    // ── TRẠNG THÁI HIỆN TẠI ──
    "Vị Trí Hiện Tại": safeString().optional(),
    "Tình Trạng": z
      .enum(["Bình Thường", "Bị Thương", "Lâm Bệnh", "Bị Giam", "Lưu Vong", "Mất Tích", "Chưa Sinh"])
      .catch("Bình Thường")
      .prefault("Bình Thường"),
    "Mục Tiêu Cá Nhân": safeString().optional(),
    /** Engine cập nhật mỗi ngày truyện khi NPC ở ngoài cảnh. */
    "_Hoạt Động Ngoài Cảnh": OffscreenActivitySchema.optional(),
    "$Ghi Chú Ẩn": safeString().optional(), // $ = AI đọc/ghi được nhưng ẨN khỏi UI (bí mật NPC)
    "$NSFW": safeString().optional(), // Lưu thông tin nhạy cảm, sở thích NSFW dành cho AI

    // ── KINH TẾ (MICRO-ECONOMY) ──
    "Ngân Khố": safeInt(0), // Số tiền của NPC, lưu bằng chuẩn Đồng Đỏ (Pennies)
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

    // ── MẠNG LƯỚI QUAN HỆ (Liên NPC) ──
    "Mạng Lưới Quan Hệ": z.record(safeString(), NpcRelationshipSchema).catch({}).prefault({}),
    
    // ── QUAN HỆ BÍ MẬT (Dành cho AI hiểu góc khuất lore, khác biệt với public) ──
    "Huyết Thống Thật Sự": z.object({
      "Cha/Mẹ": z.array(safeString()).catch([]).prefault([]), // ID của cha mẹ đẻ nếu khác cha mẹ công khai
      "Con Cái": z.array(safeString()).catch([]).prefault([])  // ID của con đẻ nếu chúng được gán cho người khác
    }).optional(),

    // ── QUAN HỆ THÂN MẬT (NPC nữ có quan hệ tình cảm với người chơi) ──
    "Quan Hệ Thân Mật": NpcIntimacyBase.optional(),
  })
  .prefault({});

export type Npc = z.infer<typeof NpcSchema>;

/** Giai đoạn hảo cảm — engine tự suy nhãn từ số (5.1d), AI không set. */
export function affinityStage(v: number): (typeof RELATION_STAGES)[number] {
  if (v <= -70) return "Tử Thù";
  if (v <= -40) return "Thù Địch";
  if (v <= -15) return "Ác Cảm";
  if (v < 15) return "Xa Lạ";
  if (v < 40) return "Quen Biết";
  if (v < 65) return "Thân Thiết";
  if (v < 85) return "Tri Kỷ";
  return "Sống Chết Có Nhau";
}

/** Giai đoạn đời theo tuổi (5.1b/5.1e). */
export function lifeStage(age: number): (typeof LIFE_STAGES)[number] {
  if (age <= 5) return "Ấu Nhi";
  if (age <= 12) return "Thiếu Niên";
  if (age <= 17) return "Thiếu Niên Lớn";
  if (age <= 39) return "Trưởng Thành";
  if (age <= 59) return "Trung Niên";
  return "Lão Niên";
}
