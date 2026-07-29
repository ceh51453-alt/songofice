/**
 * taxation — THUẾ KHOÁ (M18), viết lại từ đầu.
 *
 * Bảng cũ có hai chỗ vô lý:
 *   • Thuế dân là `Dân Số × 0.005` Rồng Vàng — một con số bịa, không dính gì
 *     tới việc dân làm ra bao nhiêu của cải.
 *   • Thuế chư hầu là `dân số vùng × 200 Rồng Vàng`. Với Phương Bắc 4 triệu dân,
 *     đó là 800 TRIỆU Rồng Vàng mỗi tháng — nhiều hơn toàn bộ của cải Westeros
 *     cộng lại. Đây là thứ làm hỏng cả nền kinh tế.
 *
 * Mô hình mới đi từ dưới lên, đúng cách một nền phong kiến vận hành:
 *
 *   1. TỔNG SẢN PHẨM. Mỗi đầu dân làm ra chừng ấy của cải một tháng
 *      (INCOME_PER_CAPITA), nhân với mức thịnh vượng của nơi đó (lòng dân,
 *      khủng hoảng, việc làm).
 *   2. THUẾ DÂN. Lãnh chúa thu một TỈ LỆ PHẦN TRĂM của tổng sản phẩm trong
 *      chính lãnh địa mình, theo mức thuế đã đặt. Cộng thuế chợ, thuế bến,
 *      thuế cầu đường — thứ chỉ có khi ngươi đã xây ra chúng.
 *   3. TÔ THUẾ CHƯ HẦU. Ngươi KHÔNG thu thuế trực tiếp từ dân của bannerman.
 *      Bannerman thu, giữ phần lớn, rồi nộp lên một phần nhỏ. Vua lại nhận từ
 *      Đại Lãnh Chúa một phần nhỏ hơn nữa. Lòng trung thành thấp thì tô về
 *      chậm, và thù địch thì không về đồng nào.
 *   4. CỐNG NẠP BỀ TRÊN. Chính ngươi cũng phải nộp lên cho lãnh chúa của mình —
 *      trừ khi ngươi đã là Vua. Đây là khoản chi mà bảng cũ quên mất.
 */
import type { StatData, TaxLevel } from "../mvu/schema";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { BUILDING_CATALOG } from "../content/westeros/buildings";
import { hasPrivilege } from "../character/roleplay";
import { analysePopulation } from "../territory/population";

/**
 * Của cải một đầu dân làm ra mỗi THÁNG, tính bằng Đồng Đỏ (220 ≈ 4 Hươu Bạc).
 * Đây là con số NEO của cả nền kinh tế, chọn sao cho: một lãnh chúa 15 000 dân
 * thu thuế mức Vừa được chừng 70 Rồng Vàng/tháng — đủ nuôi thành trì và dành ra
 * được một Nông Trại (150 Vàng) sau vài tháng, chứ không phải vài ngày.
 * Mẫu số đã tính cả trẻ con, người già và người tàn tật.
 */
export const INCOME_PER_CAPITA = 220;

export interface TaxBracket {
  level: TaxLevel;
  /** phần trăm tổng sản phẩm mà lãnh chúa lấy đi. */
  rate: number;
  /** Δ Lòng Dân mỗi tháng. */
  loyaltyPerMonth: number;
  desc: string;
}

/**
 * Thang thuế. Con số tham chiếu lịch sử: tô thuế phong kiến rơi vào 10–30% sản
 * lượng; trên 40% là mức chỉ giữ được bằng bạo lực.
 */
export const TAX_BRACKETS: Record<TaxLevel, TaxBracket> = {
  "Miễn Thuế": { level: "Miễn Thuế", rate: 0, loyaltyPerMonth: 3, desc: "Kho thuế đóng cửa. Dân nhớ ơn, ngân khố nhớ tiếc." },
  "Nhẹ": { level: "Nhẹ", rate: 0.12, loyaltyPerMonth: 1, desc: "Một phần tám hoa lợi — mức của lãnh chúa muốn được thương." },
  "Vừa": { level: "Vừa", rate: 0.25, loyaltyPerMonth: 0, desc: "Một phần tư — mức thường thấy khắp Bảy Phụ Quốc." },
  "Nặng": { level: "Nặng", rate: 0.4, loyaltyPerMonth: -2, desc: "Hai phần năm. Người ta bắt đầu giấu lúa dưới sàn." },
  "Vắt Kiệt": { level: "Vắt Kiệt", rate: 0.6, loyaltyPerMonth: -5, desc: "Ba phần năm. Đây là cách các cuộc nổi loạn bắt đầu." },
};

/** Bảng cũ giữ lại cho code/preset còn tham chiếu — suy thẳng từ thang mới. */
export const TAX_TABLE: Record<TaxLevel, { goldMultiplier: number; loyaltyPerMonth: number }> =
  Object.fromEntries(
    Object.entries(TAX_BRACKETS).map(([k, v]) => [k, {
      goldMultiplier: v.rate / TAX_BRACKETS["Vừa"].rate,
      loyaltyPerMonth: v.loyaltyPerMonth,
    }]),
  ) as Record<TaxLevel, { goldMultiplier: number; loyaltyPerMonth: number }>;

// ── Tỉ lệ trong chuỗi phong kiến ────────────────────────────────────────────

/**
 * Phần tổng sản phẩm của một VÙNG mà Đại Lãnh Chúa nhận được từ bannerman.
 * Chỉ 2.5%: bannerman thu thuế của dân mình, giữ gần hết để nuôi quân và thành
 * của họ, phần nộp lên là tượng trưng cho nghĩa vụ phong kiến chứ không phải
 * một cái vòi hút của cải. Đây là chỗ bảng cũ sai nặng nhất (nó thu 200 Rồng
 * Vàng trên mỗi ĐẦU DÂN của cả vùng, tức 800 triệu Vàng/tháng cho Phương Bắc).
 */
export const GREAT_LORD_LEVY = 0.025;
/** Phần Vua nhận từ mỗi vùng — qua tay Đại Lãnh Chúa nên mỏng hơn nữa. */
export const CROWN_LEVY = 0.018;
/** Phần TỔNG THU của ngươi phải nộp lên cho lãnh chúa bề trên. */
export const LIEGE_DUE = 0.12;

// ── Thịnh vượng ─────────────────────────────────────────────────────────────

/**
 * Hệ số thịnh vượng của một lãnh địa: dân yên và có việc thì làm ra nhiều của
 * cải hơn; loạn lạc, đói kém, thất nghiệp thì ngược lại.
 */
export function prosperityOf(holding: StatData["Lãnh Địa"][string]): number {
  const loyalty = holding["Lòng Dân"] ?? holding["Trung Thành"] ?? 60;
  let f = 0.55 + (loyalty / 100) * 0.75; // 0.55 .. 1.30

  const report = analysePopulation(holding);
  f *= 1 - Math.min(0.35, report.unemploymentRate * 0.6);
  if (report.population > 0) {
    f *= 1 - Math.min(0.25, (report.homeless / report.population) * 0.5);
  }

  for (const c of holding["Khủng Hoảng"] ?? []) {
    const sev = c["Mức Độ"] === "Thảm Hoạ" ? 0.45 : c["Mức Độ"] === "Nghiêm Trọng" ? 0.28 : 0.14;
    f *= 1 - sev;
  }
  return Math.max(0.15, f);
}

/** Tổng sản phẩm mỗi tháng của một lãnh địa (Đồng Đỏ). */
export function grossProduct(holding: StatData["Lãnh Địa"][string]): number {
  return Math.round((holding["Dân Số"] ?? 0) * INCOME_PER_CAPITA * prosperityOf(holding));
}

/** Tổng sản phẩm mỗi tháng của cả một VÙNG (dân số canon × mức thịnh vượng TB). */
export function regionGrossProduct(state: StatData, regionId: string): number {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return 0;
  // lấy mức thịnh vượng trung bình của những lãnh địa ta biết trong vùng, mặc
  // định 0.85 cho phần còn lại (đất của bannerman ta không quản trực tiếp)
  const inRegion = Object.values(state["Lãnh Địa"]).filter((h) => h["Thuộc Vùng"] === regionId);
  const avg = inRegion.length > 0
    ? inRegion.reduce((s, h) => s + prosperityOf(h), 0) / inRegion.length
    : 0.85;
  return Math.round(region.population * INCOME_PER_CAPITA * avg);
}

// ── Thu thuế ────────────────────────────────────────────────────────────────

export interface TaxLine {
  id: string;
  label: string;
  amount: number;
  detail: string;
}

/** Lãnh địa nào thật sự là của người chơi (thu thuế trực tiếp được). */
function ownHoldings(state: StatData): [string, StatData["Lãnh Địa"][string]][] {
  const name = state["Thông Tin Nhân Vật"]["Họ Tên"];
  const house = state["Thông Tin Nhân Vật"]["Nhà"];
  return Object.entries(state["Lãnh Địa"]).filter(([id, h]) =>
    h["Người Kiểm Soát"] === name
    || (!!house && h["Nhà Kiểm Soát"] === house)
    || state["Chủ Quyền Lãnh Thổ"][h["Thuộc Vùng"] || id]?.["Là Của Người Chơi"] === true);
}

/**
 * THUẾ DÂN CHÚNG — thu trực tiếp trên đất mình cai quản. Gồm ba dòng riêng biệt
 * để người chơi thấy tiền đến từ đâu: thuế thân & địa tô, thuế chợ bến, thuế
 * cầu đường.
 */
export function commonerTax(state: StatData): TaxLine[] {
  const level = state["Chính Sách Thuế"]["Mức Thuế"];
  const rate = TAX_BRACKETS[level].rate;
  const holdings = ownHoldings(state);

  let land = 0;
  let market = 0;
  let toll = 0;

  for (const [, h] of holdings) {
    const gross = grossProduct(h);
    land += gross * rate;

    // thuế chợ/bến/quán: chỉ có khi đã xây ra chúng, và tỉ lệ thuận với quy mô
    // sinh hoạt buôn bán của nơi đó chứ không phải một hằng số
    let tradeFlag = 0;
    let bridges = 0;
    for (const b of Object.values(h["Công Trình"] ?? {})) {
      if (b["Đang Xây"]) continue;
      const def = BUILDING_CATALOG[b["Loại"]];
      tradeFlag += (def?.flags?.trade ?? 0) * (b["Cấp Độ"] || 1);
      if (b["Loại"] === "Cầu Đá") bridges += b["Cấp Độ"] || 1;
    }
    market += gross * tradeFlag * 0.55 * Math.max(0.35, rate / 0.25);
    toll += bridges * gross * 0.012;
  }

  return [
    {
      id: "tax-land", label: "Thuế Thân & Địa Tô",
      amount: Math.round(land),
      detail: `${holdings.length} lãnh địa · thuế suất ${(rate * 100).toFixed(0)}% tổng sản phẩm`,
    },
    {
      id: "tax-market", label: "Thuế Chợ & Bến",
      amount: Math.round(market),
      detail: "thu trên chợ, bến cảng, quán trọ đã xây",
    },
    {
      id: "tax-toll", label: "Thuế Cầu Đường",
      amount: Math.round(toll),
      detail: "mãi lộ thu ở cầu đá và trạm gác dọc quan lộ",
    },
  ].filter((l) => l.amount !== 0);
}

/**
 * TÔ THUẾ CHƯ HẦU — chỉ chảy về khi ngươi thật sự đứng trên đầu người khác.
 *
 * • "Thu Thuế Chư Hầu (Vùng)" → nhận GREAT_LORD_LEVY từ những vùng của ngươi.
 * • "Thu Thuế Toàn Cõi" → thêm CROWN_LEVY từ MỌI vùng có chủ trong vương quốc.
 *
 * Mỗi khoản đều nhân với lòng trung thành của vùng và thái độ của Nhà đang giữ
 * vùng đó: chư hầu thù địch thì đừng mong thấy một đồng nào.
 */
export function vassalLevy(state: StatData): TaxLine[] {
  const level = state["Chính Sách Thuế"]["Mức Thuế"];
  const rateNorm = TAX_BRACKETS[level].rate / TAX_BRACKETS["Vừa"].rate; // 0 .. 2.4
  const canTaxAll = hasPrivilege(state, "Thu Thuế Toàn Cõi");
  const canTaxOwn = canTaxAll || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  if (!canTaxOwn) return [];

  const playerHouse = state["Thông Tin Nhân Vật"]["Nhà"];
  let ownRegions = 0;
  let bannerRegions = 0;
  let fromOwn = 0;
  let fromRealm = 0;

  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    const region = REGIONS_BY_ID[regionId];
    if (!region) continue;
    const gross = regionGrossProduct(state, regionId);
    const holder = sov["Nhà Kiểm Soát"] ?? "";

    // lòng trung thành của vùng: đất mình thì lấy theo lãnh địa, đất người thì
    // lấy theo thái độ của Nhà đang giữ
    const attitude = state["Thái Độ Các Nhà"]?.[holder]?.["Thái Độ"] ?? "Cảnh Giác";
    const loyalFactor =
      attitude === "Tín Nhiệm" ? 1
        : attitude === "Ủng Hộ" ? 0.85
          : attitude === "Cảnh Giác" ? 0.6
            : attitude === "Dao Động" ? 0.42
              : attitude === "Bất Mãn" ? 0.22
                : attitude === "Địch Ý" ? 0.08 : 0;
    const stable = sov["Tình Trạng"] === "Nổi Loạn" || sov["Tình Trạng"] === "Đang Tranh Chấp" ? 0.25 : 1;

    if (sov["Là Của Người Chơi"] || (!!playerHouse && holder === playerHouse)) {
      ownRegions++;
      fromOwn += gross * GREAT_LORD_LEVY * rateNorm * stable;
    } else if (canTaxAll && holder) {
      bannerRegions++;
      fromRealm += gross * CROWN_LEVY * rateNorm * loyalFactor * stable;
    }
  }

  const out: TaxLine[] = [];
  if (fromOwn > 0) {
    out.push({
      id: "levy-banner", label: "Tô Thuế Chư Hầu",
      amount: Math.round(fromOwn),
      detail: `${ownRegions} vùng dưới quyền · ${(GREAT_LORD_LEVY * 100).toFixed(1)}% tổng sản phẩm vùng`,
    });
  }
  if (fromRealm > 0) {
    out.push({
      id: "levy-crown", label: "Thuế Vương Quyền",
      amount: Math.round(fromRealm),
      detail: `${bannerRegions} vùng nộp lên ngai vàng · giảm theo thái độ từng Nhà`,
    });
  }
  return out;
}

/**
 * CỐNG NẠP BỀ TRÊN — khoản chi mà mọi lãnh chúa không phải Vua đều phải trả.
 * Đây là đối trọng giữ cho tô thuế chư hầu không biến người chơi thành vô địch.
 */
export function liegeDue(state: StatData, grossIncome: number): TaxLine | null {
  const title = state["Thông Tin Nhân Vật"]["Tước Vị"];
  const sovereign = title === "Vua Bảy Vương Quốc" || title === "Vua" || title === "Hoàng Đế";
  if (sovereign || grossIncome <= 0) return null;

  // càng lên cao thì phần phải nộp càng mỏng (nhưng không bao giờ bằng 0)
  const share = title === "Quốc Vương" || title === "Đại Lãnh Chúa" ? LIEGE_DUE * 0.6 : LIEGE_DUE;
  return {
    id: "liege-due", label: "Cống Nạp Bề Trên",
    amount: Math.round(grossIncome * share),
    detail: `${(share * 100).toFixed(0)}% tổng thu nộp lên lãnh chúa của ngươi`,
  };
}

/** Δ Lòng Dân mỗi tháng do mức thuế đang áp. */
export function taxLoyaltyDelta(level: TaxLevel): number {
  return TAX_BRACKETS[level].loyaltyPerMonth;
}

/** Ước tính nhanh tổng thuế/tháng cho thanh trượt thuế trong UI. */
export function taxPreview(
  state: StatData,
  level: TaxLevel,
): { goldPerMonth: number; loyaltyPerMonth: number } {
  const saved = state["Chính Sách Thuế"]["Mức Thuế"];
  state["Chính Sách Thuế"]["Mức Thuế"] = level;
  const total = [...commonerTax(state), ...vassalLevy(state)].reduce((s, l) => s + l.amount, 0);
  state["Chính Sách Thuế"]["Mức Thuế"] = saved;
  return { goldPerMonth: total, loyaltyPerMonth: TAX_BRACKETS[level].loyaltyPerMonth };
}
