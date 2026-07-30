// content/westeros/troopTypes.ts
// ============================================================================
// DANH MỤC BINH CHỦNG (11.2b + M19) — metadata cho mọi loại trong TROOP_TYPES_ALL:
// - class kỵ/bộ/cung (tra bảng địa hình 7.6),
// - counterType (ánh xạ về 1 trong 6 loại nền cho ma trận tương khắc 7.9.2b Lớp 1),
// - CHỈ SỐ CHIẾN ĐẤU chi tiết (cận chiến/xạ kích/xung phong/phòng ngự/giáp/kỷ
//   luật/công thành/tốc độ) — nguồn duy nhất để tính sức chiến đấu một đơn vị,
// - NGẠCH được phép: quân chính quy ăn lương, dân phục dịch, quân chư hầu, lính
//   đánh thuê (M19) — quyết định ai được tuyển loại này và tuyển ở đâu,
// - gate theo Era (Rồng/Voi/Unsullied... chỉ hiện đúng thời — 11.2b),
// - chi phí tuyển + thời gian tập hợp + huấn luyện (11.3),
// - cờ đặc biệt cho rule Lớp 4 (7.9.2b) + sĩ khí Unsullied + phản trắc Lính Đánh Thuê.
// Thêm binh chủng = thêm 1 dòng, engine không đổi.
// ============================================================================
import { TROOP_TYPES, TROOP_TYPES_ALL, ARMY_BRANCHES, type ArmyBranch } from "../../mvu/schema";

export type TroopTypeAll = (typeof TROOP_TYPES_ALL)[number];
export type BaseTroop = (typeof TROOP_TYPES)[number];
export type TroopClass = "kỵ" | "bộ" | "cung";

/** Chỉ số chiến đấu thô của binh chủng — thang 0-100 (M19). */
export interface TroopCombatStats {
  /** đánh giáp lá cà. */
  "Cận Chiến": number;
  /** bắn tầm xa (cung/nỏ/máy bắn đá). */
  "Xạ Kích": number;
  /** sức của cú xung phong đầu tiên (kỵ binh, voi). */
  "Xung Phong": number;
  /** giữ hàng khi bị đánh. */
  "Phòng Ngự": number;
  /** giáp trụ — giảm thương vong, nặng thì chậm. */
  "Giáp Trụ": number;
  /** kỷ luật: giữ đội hình, nghe kèn trống, không vỡ trận khi hoảng. */
  "Kỷ Luật": number;
  /** phá tường, dựng thang, đào hầm. */
  "Công Thành": number;
}

export interface TroopMeta {
  class: TroopClass;
  /** ánh xạ về 1 trong 6 loại nền cho ma trận COUNTER (Lớp 1). */
  counterType: BaseTroop;
  special: boolean; // binh chủng đặc biệt theo vùng/Nhà
  supernatural: boolean; // Rồng / Người Chết / Others (gate Era 7.15)
  /** tuyển được tại Doanh Trại (11.3). Binh chủng đặc biệt/siêu nhiên: false (đến qua cốt truyện). */
  recruitable: boolean;
  /** chi phí tuyển / 100 quân: Vàng + Lương Thực (11.3). */
  costPer100: { "Ngân Khố": number; "Lương Thực": number };
  /** số THÁNG huấn luyện trước khi sẵn sàng chiến đấu (11.3). */
  trainMonths: number;
  /** sĩ khí không sụp (Unsullied — rule Lớp 4). */
  fearless?: boolean;
  /** trung thành theo Vàng — roll đổi phe khi không trả lương (Lính Đánh Thuê 7.7). */
  mercenary?: boolean;

  // ── M19 ──
  /** chỉ số chiến đấu chi tiết (0-100). */
  stats: TroopCombatStats;
  /** hệ số tốc độ hành quân (1.0 = bộ binh thường; kỵ nhanh, công thành ì ạch). */
  speed: number;
  /** số NGÀY gom quân về điểm hẹn trước khi bắt đầu huấn luyện. */
  musterDays: number;
  /** ngạch được phép mang binh chủng này. */
  branches: readonly ArmyBranch[];
  /** mô tả ngắn cho bảng quân sự + cho AI kể đúng chất binh chủng. */
  desc: string;
}

const S = (
  canChien: number, xaKich: number, xungPhong: number, phongNgu: number,
  giapTru: number, kyLuat: number, congThanh: number,
): TroopCombatStats => ({
  "Cận Chiến": canChien, "Xạ Kích": xaKich, "Xung Phong": xungPhong,
  "Phòng Ngự": phongNgu, "Giáp Trụ": giapTru, "Kỷ Luật": kyLuat, "Công Thành": congThanh,
});

const REGULAR_ONLY: readonly ArmyBranch[] = ["Chính Quy"];
const COMMON_BRANCHES: readonly ArmyBranch[] = ["Chính Quy", "Chư Hầu"];
const LEVY_BRANCHES: readonly ArmyBranch[] = ["Chính Quy", "Phục Dịch", "Chư Hầu"];
const STORY_BRANCHES: readonly ArmyBranch[] = [...ARMY_BRANCHES];

const M = (
  cls: TroopClass, counterType: BaseTroop, vang: number, luong: number, trainMonths: number,
  stats: TroopCombatStats, speed: number, musterDays: number, desc: string,
  opts?: Partial<TroopMeta>,
): TroopMeta => ({
  class: cls, counterType, special: false, supernatural: false, recruitable: false,
  costPer100: { "Ngân Khố": vang, "Lương Thực": luong }, trainMonths,
  stats, speed, musterDays, branches: COMMON_BRANCHES, desc, ...opts,
});

export const TROOP_META: Record<TroopTypeAll, TroopMeta> = {
  // ── binh chủng thường (tuyển được) ──
  "Bộ Binh": M("bộ", "Bộ Binh", 100, 50, 2,
    S(50, 0, 20, 50, 45, 55, 25), 1.0, 10,
    "Thương ngắn, khiên gỗ bọc da, mũ sắt. Xương sống mọi đạo quân Westeros.",
    { recruitable: true, branches: LEVY_BRANCHES }),
  "Trường Thương": M("bộ", "Trường Thương", 120, 50, 2,
    S(45, 0, 10, 72, 40, 62, 15), 0.95, 12,
    "Rừng giáo dài bốn thước. Dựng vách thép chặn kỵ binh, nhưng hở sườn trước cung tên.",
    { recruitable: true, branches: LEVY_BRANCHES }),
  "Kỵ Binh": M("kỵ", "Kỵ Binh", 250, 80, 3,
    S(60, 0, 80, 45, 60, 55, 5), 1.35, 18,
    "Kỵ sĩ giáp xích trên chiến mã. Một cú xung phong đúng lúc bẻ gãy cả cánh quân.",
    { recruitable: true }),
  "Kỵ Binh Nhẹ": M("kỵ", "Kỵ Binh Nhẹ", 180, 60, 2,
    S(40, 20, 55, 30, 25, 45, 5), 1.5, 12,
    "Ngựa nhẹ, giáo ném, cung ngắn. Do thám, cướp lương, truy kích tàn binh.",
    { recruitable: true }),
  "Cung Thủ": M("cung", "Cung Thủ", 150, 40, 2,
    S(20, 62, 0, 25, 20, 45, 30), 1.05, 10,
    "Cung dài. Mưa tên phủ đầu chiến trường, nhưng bị kỵ binh xáp vào là tan.",
    { recruitable: true, branches: LEVY_BRANCHES }),
  "Công Thành": M("bộ", "Công Thành", 400, 30, 3,
    S(10, 40, 0, 20, 20, 50, 95), 0.6, 25,
    "Máy bắn đá, tháp công thành, dùi cui phá cổng. Vô dụng ngoài đồng trống.",
    { recruitable: true, branches: REGULAR_ONLY }),

  // ── binh chủng phong kiến bổ sung (M19) ──
  "Dân Binh": M("bộ", "Bộ Binh", 25, 60, 0,
    S(25, 5, 10, 25, 12, 18, 10), 0.9, 20,
    "Dân cày cầm liềm rèn lại thành giáo, áo độn bông. Đông, rẻ, và tan rất nhanh.",
    { recruitable: true, branches: ["Phục Dịch", "Chư Hầu"] }),
  "Nỏ Thủ": M("cung", "Cung Thủ", 190, 40, 2,
    S(25, 70, 0, 30, 30, 42, 35), 0.95, 12,
    "Nỏ thép xuyên giáp, nạp chậm. Đắt hơn cung dài nhưng dân thường tập một tháng là bắn được.",
    { recruitable: true }),
  "Hiệp Sĩ": M("kỵ", "Kỵ Binh", 600, 120, 4,
    S(80, 0, 95, 60, 85, 60, 10), 1.3, 25,
    "Trọng kỵ giáp tấm, thương gỗ tần bì. Con nhà quyền quý — không mua được bằng vàng suông.",
    { special: true, branches: COMMON_BRANCHES }),
  "Vệ Binh Gia Tộc": M("bộ", "Bộ Binh", 450, 90, 3,
    S(70, 10, 30, 68, 70, 82, 20), 0.95, 6,
    "Thân binh ăn cơm nhà chủ từ nhỏ. Ít người, nhưng chết cũng không rời cờ.",
    { recruitable: true, branches: REGULAR_ONLY }),

  // ── binh chủng đặc biệt (đến qua cốt truyện/liên minh) ──
  "Kỵ Sĩ Dothraki": M("kỵ", "Kỵ Binh Nhẹ", 0, 0, 0,
    S(55, 45, 70, 25, 15, 30, 0), 1.7, 8,
    "Khalasar thảo nguyên: cung ngựa, arakh cong, không giáp. Bão cát trên đồng trống.",
    { special: true, branches: STORY_BRANCHES }),
  "Unsullied": M("bộ", "Trường Thương", 0, 0, 0,
    S(60, 0, 15, 85, 55, 100, 10), 0.95, 5,
    "Nô lệ chiến binh Astapor. Không biết sợ, không phá hàng, không bỏ chạy — kể cả khi nên chạy.",
    { special: true, fearless: true, branches: STORY_BRANCHES }),
  "Người Sắt (Ironborn)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(65, 10, 35, 40, 35, 40, 15), 1.05, 8,
    "Cướp biển Quần Đảo Sắt: rìu, lưới, cuồng nộ đổ bộ. Trên bộ lâu thì đuối.",
    { special: true, branches: STORY_BRANCHES }),
  "Bọn Man Tộc (Free Folk)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(55, 25, 40, 30, 15, 20, 10), 1.15, 15,
    "Dân tự do bên kia Tường: gậy chuỳ, da thú, đánh theo bầy chứ không theo hàng.",
    { special: true, branches: STORY_BRANCHES }),
  "Dân Sơn Cước (Vale Mountain Clans)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(50, 15, 30, 35, 20, 25, 5), 1.1, 12,
    "Bộ tộc Núi Trăng: phục kích khe hẹp, cướp rồi rút. Ra đồng bằng là thành mồi cho kỵ binh.",
    { special: true, branches: STORY_BRANCHES }),
  "Lính Đánh Thuê": M("bộ", "Bộ Binh", 300, 40, 1,
    S(55, 25, 25, 45, 45, 50, 30), 1.05, 3,
    "Khế ước, không phải lời thề. Đánh giỏi khi được trả lương — và chỉ khi đó.",
    { special: true, recruitable: true, mercenary: true, branches: ["Đánh Thuê"] }),
  "Nồi Đất (Braavosi)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(50, 30, 20, 45, 40, 55, 20), 1.0, 5,
    "Vệ binh Braavos: kiếm mảnh, đội hình gọn, được Ngân Hàng Sắt chống lưng.",
    { special: true, branches: STORY_BRANCHES }),

  // ── siêu nhiên (gate Era 7.15) ──
  "Rồng": M("cung", "Kỵ Binh", 0, 0, 0,
    S(90, 100, 80, 70, 80, 40, 100), 4.0, 0,
    "KHÔNG nằm trong biên chế bộ binh — rồng có bảng riêng (xem tab Rồng).",
    { special: true, supernatural: true, branches: STORY_BRANCHES }),
  "Voi Chiến": M("bộ", "Kỵ Binh", 0, 0, 0,
    S(65, 20, 90, 60, 70, 30, 40), 0.85, 20,
    "Voi bọc giáp của Đại Đoàn Vàng. Ngựa sợ mùi voi — nhưng voi hoảng thì giẫm cả quân mình.",
    { special: true, supernatural: false, branches: STORY_BRANCHES }),
  "Người Chết (Wight)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(45, 0, 20, 60, 10, 100, 20), 0.9, 0,
    "Xác sống mắt xanh. Không đau, không mệt, không lùi — chỉ lửa và obsidian mới dừng được.",
    { special: true, supernatural: true, fearless: true, branches: STORY_BRANCHES }),
  "Others (White Walker)": M("bộ", "Bộ Binh", 0, 0, 0,
    S(95, 0, 60, 90, 70, 100, 30), 1.2, 0,
    "Bóng trắng cưỡi ngựa chết, kiếm băng làm thép vỡ vụn. Mỗi tên đáng cả trăm quân.",
    { special: true, supernatural: true, fearless: true, branches: STORY_BRANCHES }),
};

export function troopMeta(type: string): TroopMeta {
  return TROOP_META[type as TroopTypeAll] ?? TROOP_META["Bộ Binh"];
}
export function troopClassOf(type: string): TroopClass {
  return troopMeta(type).class;
}
export function counterTypeOf(type: string): BaseTroop {
  return troopMeta(type).counterType;
}

// ── Sức chiến đấu quy đổi (M19) ────────────────────────────────────────────

/**
 * "Giá trị chiến đấu" của MỘT người lính loại này, thang ~10-100. Dùng để so
 * sánh binh chủng trong bảng quân sự và làm hệ số chất lượng khi ước tính chiến
 * lực — KHÔNG thay ma trận tương khắc 7.9.2b (cái đó lo chuyện khắc chế).
 */
export function troopPower(type: string): number {
  const s = troopMeta(type).stats;
  const offense = Math.max(s["Cận Chiến"], s["Xạ Kích"]) + s["Xung Phong"] * 0.45;
  const defense = s["Phòng Ngự"] * 0.6 + s["Giáp Trụ"] * 0.5;
  return Math.round((offense + defense) * (0.65 + s["Kỷ Luật"] / 285));
}

/** Sức chiến đấu của binh chủng mạnh nhất làm mốc — chuẩn hoá về 0-1. */
const MAX_TROOP_POWER = Math.max(...TROOP_TYPES_ALL.filter((t) => t !== "Rồng").map((t) => troopPower(t)));

/** Hệ số chất lượng binh chủng 0..1 (Dân Binh ~0.2, Others ~1.0). */
export function troopQualityFactor(type: string): number {
  return troopPower(type) / MAX_TROOP_POWER;
}

/** Binh chủng này có được mang ngạch đó không (M19). */
export function branchAllows(type: string, branch: ArmyBranch): boolean {
  return troopMeta(type).branches.includes(branch);
}

// ── Gate theo Era (11.2b) ────────────────────────────────────────────────────
const BASE6: TroopTypeAll[] = [...TROOP_TYPES];
/** binh chủng phong kiến có mặt ở mọi thời (M19). */
const FEUDAL_EXTRA: TroopTypeAll[] = ["Dân Binh", "Nỏ Thủ", "Hiệp Sĩ", "Vệ Binh Gia Tộc"];
const COMMON_SPECIAL: TroopTypeAll[] = [
  "Kỵ Sĩ Dothraki", "Người Sắt (Ironborn)", "Bọn Man Tộc (Free Folk)",
  "Dân Sơn Cước (Vale Mountain Clans)", "Lính Đánh Thuê", "Nồi Đất (Braavosi)",
];

/** Binh chủng khả dụng mỗi Era. Aegon: có Rồng, chưa Voi/Unsullied. Robert: có
 * Voi (hậu Vũ Điệu), KHÔNG Rồng (tuyệt chủng). Ngũ Vương: + Unsullied, Rồng non
 * chưa chiến đấu (loại). Sandbox: tất cả. */
export const ERA_TROOPS: Record<string, TroopTypeAll[]> = {
  // Đêm Dài: chưa có nỏ thép, chưa có chế độ hiệp sĩ Andal
  "long-night": [...BASE6, "Dân Binh", "Vệ Binh Gia Tộc", "Bọn Man Tộc (Free Folk)", "Người Chết (Wight)", "Others (White Walker)"],
  "aegon-conquest": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Rồng"],
  "dance-of-dragons": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Rồng"],
  "blackfyre-rebellion": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Voi Chiến"],
  "dunk-and-egg": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Voi Chiến"],
  "roberts-rebellion": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Voi Chiến"],
  "greyjoy-rebellion": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Voi Chiến"],
  "war-of-five-kings": [...BASE6, ...FEUDAL_EXTRA, ...COMMON_SPECIAL, "Voi Chiến", "Unsullied"],
  "sandbox": [...TROOP_TYPES_ALL],
};

export function availableTroopsForEra(eraId: string): TroopTypeAll[] {
  return ERA_TROOPS[eraId] ?? [...BASE6, ...FEUDAL_EXTRA];
}

/** Binh chủng TUYỂN được tại Doanh Trại trong Era này (11.3 + gate 11.2b). */
export function recruitableTroopsForEra(eraId: string): TroopTypeAll[] {
  const avail = new Set(availableTroopsForEra(eraId));
  return TROOP_TYPES_ALL.filter((t) => avail.has(t) && TROOP_META[t].recruitable);
}

/** Binh chủng tuyển được trong Era này THEO NGẠCH (M19). */
export function recruitableTroopsForBranch(eraId: string, branch: ArmyBranch): TroopTypeAll[] {
  return recruitableTroopsForEra(eraId).filter((t) => branchAllows(t, branch));
}
