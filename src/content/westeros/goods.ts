// content/westeros/goods.ts
// ============================================================================
// DANH MỤC HÀNG HOÁ (M18) — mọi thứ mua bán được trong thế giới.
//
// Trước đây chợ chỉ có 6 dòng và giá là một hằng số nhân với hệ số. Bảng này là
// nguồn chân lý DUY NHẤT cho: giá nền, đơn vị đo, độ cồng kềnh (phí vận chuyển),
// hao hụt, mức tiêu thụ đầu người, và vùng nào nổi tiếng làm ra thứ gì.
//
// Ba khái niệm tách bạch:
//   basePrice   — giá "công bằng" khi cung = cầu. Thị trường lệch khỏi đây theo
//                 tồn kho, mùa vụ, khủng hoảng, và chính lệnh người chơi ban.
//   demandPerK  — mỗi 1000 dân ăn/dùng bao nhiêu đơn vị MỖI THÁNG. Đây là cái
//                 sinh ra CẦU thật, nên dân đông = chợ sôi động = giá khác nhau
//                 giữa Vương Đô và một làng chài.
//   bulk        — cồng kềnh. Chở đá đi 1000 dặm thì tiền cước ăn hết lãi; chở
//                 lụa thì không. Đây là lý do tuyến thương mại có ý nghĩa.
//
// Thêm hàng hoá = thêm 1 entry. Engine (economy/market.ts) không cần sửa.
// ============================================================================
import { EXCHANGE_RATES } from "../../economy/currency";

const S = EXCHANGE_RATES.SILVER_TO_COPPER; // 1 Hươu Bạc = 56 Đồng Đỏ
const G = EXCHANGE_RATES.GOLD_TO_COPPER; // 1 Rồng Vàng = 11 760 Đồng Đỏ

/** Nhóm hàng — dùng để xếp bảng chợ và quyết định thuế suất. */
export type GoodCategory =
  | "Lương Thực"
  | "Đồ Uống"
  | "Nguyên Liệu"
  | "Chế Phẩm"
  | "Quân Nhu"
  | "Gia Súc"
  | "Xa Xỉ";

export const GOOD_CATEGORIES: GoodCategory[] = [
  "Lương Thực", "Đồ Uống", "Nguyên Liệu", "Chế Phẩm", "Quân Nhu", "Gia Súc", "Xa Xỉ",
];

export interface GoodDef {
  /** khoá dùng trong kho lãnh địa + sổ chợ. Trùng tên hiển thị cho dễ đọc. */
  id: string;
  category: GoodCategory;
  /** đơn vị đếm — hiện trong UI để người chơi biết "100" là 100 cái gì. */
  unit: string;
  /** giá công bằng (Đồng Đỏ / đơn vị) khi cung vừa đủ cầu. */
  basePrice: number;
  /** độ cồng kềnh 0.2–3 — nhân vào cước vận chuyển của tuyến thương mại. */
  bulk: number;
  /** tỉ lệ hư hao MỖI THÁNG khi nằm trong kho (0 = để được vĩnh viễn). */
  spoil: number;
  /** tiêu thụ mỗi tháng trên 1000 dân. 0 = dân thường không dùng tới. */
  demandPerK: number;
  /** nhu cầu THIẾT YẾU — thiếu là đói/loạn, không phải chỉ mất vui. */
  staple?: boolean;
  /** hàng xa xỉ — cầu tăng vọt theo của cải chứ không theo đầu người. */
  luxury?: boolean;
  /** vùng nổi tiếng sản xuất (giá rẻ hơn tại chỗ, đắt khi đi xa). */
  homeRegions?: string[];
  /** hàng ngoại — chỉ có khi thương đoàn Essos ghé, giá cắt cổ. */
  foreign?: boolean;
  desc: string;
}

/**
 * Danh mục hàng hoá. 10 khoá đầu TRÙNG với kho tài nguyên lãnh địa cũ
 * (RESOURCE_LIST) nên mọi công trình/pháp lệnh sẵn có vẫn chạy nguyên vẹn;
 * phần còn lại là hàng chỉ lưu thông qua chợ và tuyến thương mại.
 */
export const GOODS: GoodDef[] = [
  // ── LƯƠNG THỰC ────────────────────────────────────────────────────────────
  {
    id: "Lương Thực", category: "Lương Thực", unit: "bao", basePrice: 10 * S,
    bulk: 1.6, spoil: 0.02, demandPerK: 260, staple: true,
    homeRegions: ["the-reach", "the-riverlands"],
    desc: "Lúa mạch, yến mạch và bột mì — thứ đứng giữa dân và nạn đói.",
  },
  {
    id: "Cá Khô", category: "Lương Thực", unit: "thùng", basePrice: 8 * S,
    bulk: 1.2, spoil: 0.01, demandPerK: 70, staple: true,
    homeRegions: ["the-iron-islands", "the-north"],
    desc: "Cá muối phơi khô — lương ăn của thuỷ thủ và của mùa đông dài.",
  },
  {
    id: "Thịt Muối", category: "Lương Thực", unit: "thùng", basePrice: 18 * S,
    bulk: 1.1, spoil: 0.015, demandPerK: 45,
    homeRegions: ["the-north", "the-stormlands"],
    desc: "Thịt ướp muối trong thùng gỗ sồi — quân lương đi xa được.",
  },
  {
    id: "Rau Củ", category: "Lương Thực", unit: "giỏ", basePrice: 4 * S,
    bulk: 1.4, spoil: 0.12, demandPerK: 120, staple: true,
    homeRegions: ["the-reach"],
    desc: "Củ cải, hành, đậu — rẻ, nặng, và thối rất nhanh.",
  },
  {
    id: "Trái Cây", category: "Lương Thực", unit: "giỏ", basePrice: 7 * S,
    bulk: 1.3, spoil: 0.18, demandPerK: 40,
    homeRegions: ["dorne", "the-reach"],
    desc: "Cam Dorne, táo Reach, chà là — hàng của mùa hè và của người có tiền.",
  },
  {
    id: "Mật Ong", category: "Lương Thực", unit: "vò", basePrice: 30 * S,
    bulk: 0.7, spoil: 0, demandPerK: 12,
    homeRegions: ["the-reach", "the-riverlands"],
    desc: "Chất ngọt duy nhất đáng kể — cũng là nguyên liệu ủ rượu mật.",
  },
  {
    id: "Muối", category: "Lương Thực", unit: "bao", basePrice: 25 * S,
    bulk: 1.0, spoil: 0, demandPerK: 22, staple: true,
    homeRegions: ["the-iron-islands", "dorne"],
    desc: "Không có muối thì không có mùa đông nào sống nổi.",
  },

  // ── ĐỒ UỐNG ───────────────────────────────────────────────────────────────
  {
    id: "Bia", category: "Đồ Uống", unit: "thùng", basePrice: 5 * S,
    bulk: 1.8, spoil: 0.05, demandPerK: 150,
    homeRegions: ["the-riverlands", "the-westerlands"],
    desc: "Bia lúa mạch nhạt — nước uống hằng ngày, an toàn hơn nước giếng.",
  },
  {
    id: "Rượu Vang", category: "Đồ Uống", unit: "thùng", basePrice: 40 * S,
    bulk: 1.5, spoil: 0, demandPerK: 26,
    homeRegions: ["dorne", "the-reach"],
    desc: "Vang đỏ Dorne và vang trắng Reach — thứ chảy trong mọi bàn tiệc.",
  },
  {
    id: "Rượu Arbor", category: "Đồ Uống", unit: "thùng", basePrice: 3 * G,
    bulk: 1.5, spoil: 0, demandPerK: 2, luxury: true,
    homeRegions: ["the-reach"],
    desc: "Vàng Arbor — rượu của vua chúa, một thùng bằng cả năm công của thợ.",
  },

  // ── NGUYÊN LIỆU THÔ ───────────────────────────────────────────────────────
  {
    id: "Gỗ", category: "Nguyên Liệu", unit: "khối", basePrice: 15 * S,
    bulk: 2.4, spoil: 0, demandPerK: 60,
    homeRegions: ["the-north", "the-riverlands", "the-stormlands"],
    desc: "Gỗ xẻ — nhà cửa, giàn giáo, thân thuyền, và củi đốt mùa đông.",
  },
  {
    id: "Đá", category: "Nguyên Liệu", unit: "khối", basePrice: 20 * S,
    bulk: 3.0, spoil: 0, demandPerK: 14,
    homeRegions: ["the-vale", "the-westerlands"],
    desc: "Đá tảng đục từ mỏ — nặng tới mức chở xa là lỗ.",
  },
  {
    id: "Quặng Sắt", category: "Nguyên Liệu", unit: "tạ", basePrice: 30 * S,
    bulk: 2.6, spoil: 0, demandPerK: 8,
    homeRegions: ["the-westerlands", "the-north"],
    desc: "Quặng thô chưa nấu — vô dụng nếu không có than và lò.",
  },
  {
    id: "Than Đá", category: "Nguyên Liệu", unit: "tạ", basePrice: 22 * S,
    bulk: 2.2, spoil: 0, demandPerK: 30,
    homeRegions: ["the-westerlands", "the-vale"],
    desc: "Vỉa than nuôi lửa lò rèn — không than thì thép chỉ là quặng.",
  },
  {
    id: "Đồng", category: "Nguyên Liệu", unit: "tạ", basePrice: 45 * S,
    bulk: 2.2, spoil: 0, demandPerK: 4,
    homeRegions: ["the-westerlands"],
    desc: "Đồng đỏ — chuông, nồi, và đồng tiền lẻ trong túi dân.",
  },
  {
    id: "Thiếc", category: "Nguyên Liệu", unit: "tạ", basePrice: 52 * S,
    bulk: 2.0, spoil: 0, demandPerK: 2,
    homeRegions: ["the-westerlands"],
    desc: "Pha với đồng thành đồng thau — hiếm hơn người ta tưởng.",
  },
  {
    id: "Len", category: "Nguyên Liệu", unit: "kiện", basePrice: 20 * S,
    bulk: 1.4, spoil: 0.01, demandPerK: 35,
    homeRegions: ["the-north", "the-vale"],
    desc: "Lông cừu chưa xe — nguyên liệu của mọi tấm áo chống rét.",
  },
  {
    id: "Lanh", category: "Nguyên Liệu", unit: "kiện", basePrice: 16 * S,
    bulk: 1.3, spoil: 0.01, demandPerK: 24,
    homeRegions: ["the-riverlands", "the-reach"],
    desc: "Sợi lanh thô — dệt thành vải mặc mùa hè và buồm cho thuyền.",
  },
  {
    id: "Da Thú", category: "Nguyên Liệu", unit: "tấm", basePrice: 26 * S,
    bulk: 1.1, spoil: 0.03, demandPerK: 18,
    homeRegions: ["the-north"],
    desc: "Da sống chưa thuộc — nặng mùi, nhưng là giày và giáp của cả vương quốc.",
  },
  {
    id: "Sáp Ong", category: "Nguyên Liệu", unit: "vò", basePrice: 35 * S,
    bulk: 0.6, spoil: 0, demandPerK: 8,
    homeRegions: ["the-reach"],
    desc: "Nến sáp cho sept và thư phòng — dân nghèo đốt mỡ, quý tộc đốt sáp.",
  },
  {
    id: "Hắc Diện Thạch", category: "Nguyên Liệu", unit: "thùng", basePrice: 6 * G,
    bulk: 0.9, spoil: 0, demandPerK: 0,
    homeRegions: ["the-north"],
    desc: "Thuỷ tinh rồng từ Dragonstone — vô dụng với người, chí mạng với thứ khác.",
  },

  // ── CHẾ PHẨM ──────────────────────────────────────────────────────────────
  {
    id: "Thép", category: "Chế Phẩm", unit: "thỏi", basePrice: 90 * S,
    bulk: 1.6, spoil: 0, demandPerK: 6,
    homeRegions: ["the-westerlands"],
    desc: "Thép rèn thành thỏi — bán được, nhưng đáng giá hơn khi thành lưỡi kiếm.",
  },
  {
    id: "Vải Vóc", category: "Chế Phẩm", unit: "cuộn", basePrice: 45 * S,
    bulk: 0.9, spoil: 0.005, demandPerK: 32,
    homeRegions: ["the-reach", "the-riverlands"],
    desc: "Vải len dệt tay — quân trang, buồm, và áo của người biết đủ.",
  },
  {
    id: "Vải Lanh", category: "Chế Phẩm", unit: "cuộn", basePrice: 30 * S,
    bulk: 0.8, spoil: 0.005, demandPerK: 26,
    homeRegions: ["the-riverlands"],
    desc: "Vải lanh mịn — áo lót, khăn liệm, và băng bó thương binh.",
  },
  {
    id: "Da Thuộc", category: "Chế Phẩm", unit: "tấm", basePrice: 50 * S,
    bulk: 0.9, spoil: 0, demandPerK: 14,
    desc: "Da đã thuộc kỹ — giày, yên ngựa, giáp da cho lính nhẹ.",
  },
  {
    id: "Dây Thừng", category: "Chế Phẩm", unit: "cuộn", basePrice: 24 * S,
    bulk: 1.2, spoil: 0.01, demandPerK: 10,
    homeRegions: ["the-iron-islands"],
    desc: "Thừng gai bện — không có nó thì không có buồm nào kéo lên nổi.",
  },
  {
    id: "Gốm Sứ", category: "Chế Phẩm", unit: "kiện", basePrice: 18 * S,
    bulk: 1.5, spoil: 0.02, demandPerK: 20,
    desc: "Nồi, vại, bình đựng — vỡ suốt nên bán mãi không hết.",
  },
  {
    id: "Thuỷ Tinh", category: "Chế Phẩm", unit: "kiện", basePrice: 70 * S,
    bulk: 1.0, spoil: 0.04, demandPerK: 3,
    desc: "Kính cửa sổ và bình cất — hàng của thành phố, không phải của làng.",
  },
  {
    id: "Giấy Da", category: "Chế Phẩm", unit: "tệp", basePrice: 55 * S,
    bulk: 0.4, spoil: 0, demandPerK: 4,
    desc: "Da bê thuộc mỏng để chép chữ — học viện nào cũng ngốn không biết chán.",
  },
  {
    id: "Dầu Đèn", category: "Chế Phẩm", unit: "vò", basePrice: 32 * S,
    bulk: 1.0, spoil: 0.01, demandPerK: 22,
    desc: "Dầu cá và dầu hạt — ánh sáng của những đêm dài phương Bắc.",
  },
  {
    id: "Thảo Dược", category: "Chế Phẩm", unit: "hộp", basePrice: 60 * S,
    bulk: 0.4, spoil: 0.06, demandPerK: 9,
    desc: "Thuốc học sĩ hái và phơi — thứ đứng giữa vết thương và cái chết.",
  },

  // ── QUÂN NHU ──────────────────────────────────────────────────────────────
  {
    id: "Vũ Khí", category: "Quân Nhu", unit: "bộ", basePrice: 4 * G,
    bulk: 1.2, spoil: 0, demandPerK: 2,
    homeRegions: ["the-westerlands"],
    desc: "Giáo, kiếm, rìu đã rèn xong — trang bị cho một người lính.",
  },
  {
    id: "Giáp Trụ", category: "Quân Nhu", unit: "bộ", basePrice: 8 * G,
    bulk: 1.4, spoil: 0, demandPerK: 1,
    desc: "Giáp xích và mũ trụ — thứ quyết định ai đứng dậy sau trận đánh.",
  },
  {
    id: "Cung Tên", category: "Quân Nhu", unit: "bó", basePrice: 2 * G,
    bulk: 1.0, spoil: 0.01, demandPerK: 1,
    homeRegions: ["the-reach", "dorne"],
    desc: "Cung dài và bó tên — tiêu hao nhanh nhất trong mọi thứ quân nhu.",
  },

  // ── GIA SÚC ───────────────────────────────────────────────────────────────
  {
    id: "Ngựa", category: "Gia Súc", unit: "con", basePrice: 3 * G,
    bulk: 2.0, spoil: 0.005, demandPerK: 3,
    homeRegions: ["dorne", "the-riverlands"],
    desc: "Ngựa cưỡi và ngựa chiến — một con bằng cả gia sản của nông dân.",
  },
  {
    id: "Bò", category: "Gia Súc", unit: "con", basePrice: 90 * S,
    bulk: 2.4, spoil: 0.01, demandPerK: 6,
    homeRegions: ["the-reach", "the-riverlands"],
    desc: "Bò cày và bò thịt — sức kéo của mọi luống cày trong vương quốc.",
  },
  {
    id: "Cừu", category: "Gia Súc", unit: "con", basePrice: 25 * S,
    bulk: 1.4, spoil: 0.01, demandPerK: 14,
    homeRegions: ["the-north", "the-vale"],
    desc: "Cừu cho len, cho sữa, và cuối cùng cho nồi hầm.",
  },
  {
    id: "Lợn", category: "Gia Súc", unit: "con", basePrice: 40 * S,
    bulk: 1.5, spoil: 0.01, demandPerK: 10,
    desc: "Lợn ăn tạp, lớn nhanh — thịt của người thường.",
  },

  // ── XA XỈ & HÀNG NGOẠI ────────────────────────────────────────────────────
  {
    id: "Gia Vị", category: "Xa Xỉ", unit: "hộp", basePrice: 5 * G,
    bulk: 0.3, spoil: 0, demandPerK: 1, luxury: true, foreign: true,
    desc: "Tiêu, quế, nghệ tây từ Quần Đảo Gia Vị — nhẹ như bụi, đắt như vàng.",
  },
  {
    id: "Lụa Myr", category: "Xa Xỉ", unit: "cuộn", basePrice: 12 * G,
    bulk: 0.4, spoil: 0, demandPerK: 0, luxury: true, foreign: true,
    desc: "Lụa dệt bên kia Biển Hẹp — áo cưới của tiểu thư, hối lộ của lãnh chúa.",
  },
  {
    id: "Nhuộm Tím Myr", category: "Xa Xỉ", unit: "vò", basePrice: 20 * G,
    bulk: 0.3, spoil: 0, demandPerK: 0, luxury: true, foreign: true,
    desc: "Thuốc nhuộm tím hoàng gia — một vò đủ nhuộm áo cho cả một triều đình.",
  },
  {
    id: "Thảm Qohor", category: "Xa Xỉ", unit: "tấm", basePrice: 25 * G,
    bulk: 1.0, spoil: 0, demandPerK: 0, luxury: true, foreign: true,
    desc: "Thảm dệt Qohor — trải trên sàn đại sảnh để khách biết chủ giàu tới đâu.",
  },
  {
    id: "Ngọc Trai", category: "Xa Xỉ", unit: "hộp", basePrice: 30 * G,
    bulk: 0.2, spoil: 0, demandPerK: 0, luxury: true, foreign: true,
    desc: "Ngọc trai Biển Ngọc Bích — của hồi môn và của đút lót.",
  },
  {
    id: "Thép Valyria", category: "Xa Xỉ", unit: "thỏi", basePrice: 2000 * G,
    bulk: 0.5, spoil: 0, demandPerK: 0, luxury: true, foreign: true,
    desc: "Thép Valyria — không ai còn rèn được nữa, nên mỗi thỏi là một di vật.",
  },
];

export const GOODS_BY_ID: Record<string, GoodDef> = Object.fromEntries(GOODS.map((g) => [g.id, g]));
export const GOOD_IDS: string[] = GOODS.map((g) => g.id);

/** Hàng hoá theo nhóm — dựng bảng chợ. */
export function goodsInCategory(cat: GoodCategory): GoodDef[] {
  return GOODS.filter((g) => g.category === cat);
}

export function goodDef(id: string): GoodDef | undefined {
  return GOODS_BY_ID[id];
}

/** Giá nền của một mặt hàng (Đồng Đỏ). Hàng lạ → coi như 10 Hươu Bạc. */
export function basePriceOf(id: string): number {
  return GOODS_BY_ID[id]?.basePrice ?? 10 * S;
}

/**
 * CẦU nền của một khu dân cư: dân số × mức tiêu thụ đầu người. Hàng xa xỉ
 * không tính theo đầu dân mà theo tầng lớp có tiền (ước bằng 2% dân số).
 */
export function baseDemand(good: GoodDef, population: number): number {
  if (population <= 0) return 0;
  const heads = good.luxury ? population * 0.02 : population;
  return (heads / 1000) * good.demandPerK;
}

/**
 * Hệ số giá theo VÙNG: nơi làm ra thì rẻ, nơi phải chở tới thì đắt theo độ
 * cồng kềnh. Đây là thứ khiến buôn đường dài có lãi thật.
 */
export function regionPriceFactor(good: GoodDef, regionId: string): number {
  if (!good.homeRegions || good.homeRegions.length === 0) return 1;
  if (good.homeRegions.includes(regionId)) return 1 - Math.min(0.34, 0.1 + good.bulk * 0.06);
  return 1 + Math.min(0.55, 0.08 + good.bulk * 0.11);
}

/** Hệ số giá theo MÙA — mùa đông thì lương thực và củi lửa lên giá. */
export function seasonPriceFactor(good: GoodDef, season: string): number {
  const winter = season === "Đông";
  const summer = season === "Hạ";
  if (winter) {
    if (good.staple) return 1.55;
    if (good.id === "Gỗ" || good.id === "Than Đá" || good.id === "Len" || good.id === "Dầu Đèn") return 1.4;
    if (good.category === "Xa Xỉ") return 0.92;
    return 1.12;
  }
  if (summer) {
    if (good.staple) return 0.82;
    if (good.category === "Xa Xỉ") return 1.1;
    return 0.96;
  }
  return 1;
}
