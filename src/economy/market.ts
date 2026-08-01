/**
 * market — SÀN GIAO DỊCH KHU VỰC (M18).
 *
 * Thay cho "bấm nút Mua x100 với giá cố định", đây là một thị trường thật:
 *
 *   GIÁ KHÔNG DO AI ĐẶT. Mỗi vùng có TỒN KHO, CUNG và CẦU riêng cho từng mặt
 *   hàng. Giá bò về mức cân bằng (giá nền × vùng × mùa × khủng hoảng), nhưng bị
 *   kéo lệch theo số tháng tồn kho còn lại: kho cạn thì giá vọt, kho ứ thì giá
 *   rớt. Mỗi tháng giá chỉ đi được một phần đường về mức cân bằng, nên có xu
 *   hướng và có quán tính — mua đáy bán đỉnh là một trò chơi thật.
 *
 *   LỆNH CỦA NGƯƠI LÀM ĐỘNG GIÁ. Người chơi nhập SỐ LƯỢNG, không bấm nút định
 *   sẵn. Mua càng nhiều so với độ sâu thị trường thì giá trung bình càng đắt
 *   (trượt giá), và giá NIÊM YẾT sau lệnh cũng đội lên thật — vét sạch lúa của
 *   một thị trấn thì cả thị trấn biết. Bán tháo thì ngược lại.
 *
 *   CHỢ LÀNG KHÁC CHỢ VƯƠNG ĐÔ. Thanh khoản và chênh lệch mua/bán suy từ dân số
 *   và số công trình thương mại: chợ nhỏ trượt giá kinh khủng, cảng lớn thì êm.
 */
import type { StatData, Market, MarketGood } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import {
  GOODS, GOODS_BY_ID, GOOD_IDS, basePriceOf, baseDemand,
  regionPriceFactor, seasonPriceFactor, type GoodDef,
} from "../content/westeros/goods";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { BUILDING_CATALOG } from "../content/westeros/buildings";
import { buildingLedgers } from "../territory/construction";
import { makeRng, eventSeed } from "../probability/rng";

/** Bảng cờ thương mại — tra sẵn để không phải nạp cả danh mục công trình. */
const TRADE_FLAG: Record<string, number> = Object.fromEntries(
  Object.entries(BUILDING_CATALOG).map(([k, d]) => [k, d.flags?.trade ?? 0]),
);

/** Số tháng tồn kho được coi là "đủ" — lệch khỏi đây thì giá chạy. */
const TARGET_COVER = 2.5;
/** Mỗi tháng giá chỉ đi được ngần này phần đường về mức cân bằng. */
const PRICE_INERTIA = 0.38;

/**
 * Phần dòng hàng của cả VÙNG thật sự chảy qua CÁI CHỢ người chơi đang đứng.
 *
 * Sổ chợ ghi theo vùng cho gọn, nhưng người ta mua bán ở MỘT phiên chợ chứ
 * không phải mua của cả Phương Bắc cùng lúc. Không có hệ số này thì độ sâu thị
 * trường lớn tới mức không lệnh nào của người chơi động nổi giá — mà "giá biến
 * động theo chính hành vi mua bán" lại là điểm cốt lõi của cả hệ.
 */
const LOCAL_TRADE_SHARE = 0.02;

export type OrderSide = "buy" | "sell";

// ── Khởi tạo & tham số chợ ──────────────────────────────────────────────────

/** Dân số quy ước của một vùng (dùng để suy cung/cầu nền). */
function regionPopulation(state: StatData, regionId: string): number {
  const canon = REGIONS_BY_ID[regionId]?.population ?? 0;
  if (canon > 0) return canon;
  let sum = 0;
  for (const h of Object.values(state["Lãnh Địa"])) {
    if (h["Thuộc Vùng"] === regionId) sum += h["Dân Số"] ?? 0;
  }
  return Math.max(20000, sum);
}

/**
 * Thanh khoản & chênh lệch mua-bán của một vùng. Chợ, bến cảng, quán trọ của
 * người chơi làm chợ sâu hơn và lái buôn bớt ăn chênh.
 */
export function marketDepthParams(state: StatData, regionId: string): { liquidity: number; spread: number } {
  const pop = regionPopulation(state, regionId);
  let tradeFlags = 0;
  for (const h of Object.values(state["Lãnh Địa"])) {
    if (h["Thuộc Vùng"] !== regionId) continue;
    for (const b of Object.values(h["Công Trình"] ?? {})) {
      if (b["Đang Xây"] || b["Đang Phá"]) continue;
      tradeFlags += (TRADE_FLAG[b["Loại"]] ?? 0) * (b["Cấp Độ"] || 1);
    }
  }
  // dân đông là nền, công trình thương mại là phần cộng thêm
  const liquidity = Math.max(0.08, Math.min(1, Math.log10(Math.max(10, pop)) / 7.4 + tradeFlags * 0.35));
  const spread = Math.max(0.04, Math.min(0.3, 0.2 - liquidity * 0.14));
  return { liquidity, spread: Math.round(spread * 1000) / 1000 };
}

/** Hệ số khủng hoảng theo mặt hàng tại một vùng (nạn đói → lương thực vọt giá). */
function crisisFactor(state: StatData, regionId: string, good: GoodDef): number {
  let f = 1;
  for (const [id, h] of Object.entries(state["Lãnh Địa"])) {
    if (h["Thuộc Vùng"] !== regionId && id !== regionId) continue;
    for (const c of h["Khủng Hoảng"] ?? []) {
      const sev = c["Mức Độ"] === "Thảm Hoạ" ? 1.6 : c["Mức Độ"] === "Nghiêm Trọng" ? 1.3 : 1;
      if (c["Loại"] === "Nạn Đói" && good.staple) f *= 1 + 0.55 * sev;
      if (c["Loại"] === "Mùa Đông Khắc Nghiệt" && good.staple) f *= 1 + 0.3 * sev;
      if (c["Loại"] === "Dịch Bệnh" && good.id === "Thảo Dược") f *= 1 + 0.7 * sev;
      if ((c["Loại"] === "Nổi Loạn" || c["Loại"] === "Cướp Bóc")) {
        if (good.category === "Quân Nhu") f *= 1 + 0.5 * sev;
        if (good.category === "Xa Xỉ") f *= Math.max(0.6, 1 - 0.2 * sev);
      }
    }
  }
  return f;
}

/** Giá CÂN BẰNG (chưa tính khan hiếm tồn kho). */
export function equilibriumPrice(
  state: StatData,
  regionId: string,
  good: GoodDef,
): number {
  const season = state["Thế Giới"]?.["Mùa"] ?? "Hạ";
  const base = basePriceOf(good.id);
  let p = base * regionPriceFactor(good, regionId) * seasonPriceFactor(good, season) * crisisFactor(state, regionId, good);
  // Hàng nhập khẩu chỉ rẻ hơn khi có thương đoàn đường xa đang neo ở cảng.
  // Essos không còn tự coi lụa Myr hay thảm Qohor là "hàng ngoại".
  if (isGoodImportedAt(good, regionId)) {
    const merchant = state["Thị Trường Khu Vực"]?.[regionId]?.["Đang Có Thương Nhân"];
    p *= merchant ? 1.15 : 2.4;
  }
  if (good.relic) p *= 2.2;
  return Math.max(1, Math.round(p));
}

/**
 * CUNG nền mỗi tháng của một vùng: vùng nổi tiếng làm ra thứ đó thì dư, vùng
 * phải nhập thì thiếu. Cộng thêm phần THẶNG DƯ thật từ các lãnh địa người chơi
 * quản trị trong vùng — sản xuất ở Tầng 1 chảy thẳng vào giá chợ ở Tầng 2.
 */
export function isGoodHomeAt(good: GoodDef, regionId: string): boolean {
  const region = REGIONS_BY_ID[regionId] as (typeof REGIONS_BY_ID[string] & {
    parentId?: string;
    realmId?: string;
    continentId?: string;
  }) | undefined;
  const geographyIds = [
    regionId,
    region?.parentId,
    region?.parentId?.replace(/^macro-/, ""),
    region?.realmId,
    region?.continentId,
  ].filter(Boolean) as string[];
  return !!good.homeRegions?.some((id) => geographyIds.includes(id));
}

export function isGoodImportedAt(good: GoodDef, regionId: string): boolean {
  if (isGoodHomeAt(good, regionId)) return false;
  const region = REGIONS_BY_ID[regionId] as (typeof REGIONS_BY_ID[string] & { continentId?: string }) | undefined;
  const continentId = region?.continentId ?? (region ? "westeros" : "");
  if (good.originContinentIds?.length) return !good.originContinentIds.includes(continentId);
  return !!good.foreign;
}

function regionalSupply(state: StatData, regionId: string, good: GoodDef, demand: number): number {
  const home = isGoodHomeAt(good, regionId);
  const imported = isGoodImportedAt(good, regionId);
  let supply = demand * (good.relic ? 0.02 : home ? 1.3 : imported ? 0.25 : 0.86);

  // thặng dư thật từ các lãnh địa trong vùng — sản xuất Tầng 1 chảy thẳng vào
  // giá chợ Tầng 2. Xây thêm nông trại là giá lúa ở vùng đó hạ xuống.
  for (const [id, h] of Object.entries(state["Lãnh Địa"])) {
    if (h["Thuộc Vùng"] !== regionId) continue;
    for (const led of buildingLedgers(id, h)) {
      const produced = led.produce[good.id] ?? 0;
      if (produced > 0) supply += produced * 0.6;
    }
  }
  return Math.round(supply);
}

function emptyGood(price: number, supply: number, demand: number): MarketGood {
  return {
    "Giá": price,
    "Tồn Kho": Math.round(demand * TARGET_COVER),
    "Cung/Tháng": supply,
    "Cầu/Tháng": demand,
    "Biến Động": 0,
    "Giá Trước": price,
  };
}

/**
 * Bảo đảm chợ của một vùng đã có đủ mọi mặt hàng. Idempotent — gọi bao nhiêu
 * lần cũng được. MUTATE state.
 */
export function ensureMarket(state: StatData, regionId: string): Market {
  const markets = state["Thị Trường Khu Vực"];
  const pop = regionPopulation(state, regionId);
  const params = marketDepthParams(state, regionId);

  let m = markets[regionId];
  if (!m) {
    m = {
      "Hàng Hoá": {},
      "Thanh Khoản": params.liquidity,
      "Chênh Lệch": params.spread,
      "Đang Có Thương Nhân": false,
      "Tin Đồn": "Chợ họp như mọi ngày.",
      "_Ngày Cập Nhật": 0,
    };
    markets[regionId] = m;
  }
  m["Thanh Khoản"] = params.liquidity;
  m["Chênh Lệch"] = params.spread;

  for (const good of GOODS) {
    if (m["Hàng Hoá"][good.id]) continue;
    const demand = Math.max(1, Math.round(baseDemand(good, pop)));
    const supply = regionalSupply(state, regionId, good, demand);
    m["Hàng Hoá"][good.id] = emptyGood(equilibriumPrice(state, regionId, good), supply, demand);
  }
  return m;
}

/** Chợ tại vùng đang đứng (khởi tạo nếu chưa có). */
export function marketOf(state: StatData, regionId: string): Market {
  return ensureMarket(state, regionId);
}

// ── Chốt sổ chợ mỗi tháng ───────────────────────────────────────────────────

/**
 * Một tháng trôi qua trên mọi sàn: cung vào kho, cầu rút khỏi kho, rồi giá chạy
 * theo số tháng tồn kho còn lại. MUTATE state.
 */
export function tickMarkets(state: StatData): void {
  const tick = state["_engineMeta"]?.["_Nhịp"] ?? 0;
  const rootSeed = state["_engineMeta"]?.["_Seed Gốc"] ?? 0;

  const regionIds = new Set<string>([
    ...Object.keys(REGIONS_BY_ID),
    ...Object.keys(state["Thị Trường Khu Vực"] ?? {}),
  ]);

  for (const regionId of regionIds) {
    const m = ensureMarket(state, regionId);
    const pop = regionPopulation(state, regionId);
    const rng = makeRng(eventSeed(rootSeed, tick, `market-${regionId}`));

    // thương đoàn Essos ghé rồi lại nhổ neo
    if (m["Đang Có Thương Nhân"]) {
      if (rng() < 0.34) {
        m["Đang Có Thương Nhân"] = false;
        m["Tin Đồn"] = "Thương đoàn đã nhổ neo rời đi, hàng ngoại lại khan.";
      }
    } else if (rng() < 0.12) {
      m["Đang Có Thương Nhân"] = true;
      m["Tin Đồn"] = "Một thương đoàn từ bên kia Biển Hẹp vừa cập bến — hàng lạ tràn chợ.";
    }

    let biggestMove = 0;
    let headline = "";

    for (const good of GOODS) {
      const row = m["Hàng Hoá"][good.id];
      if (!row) continue;

      const demand = Math.max(1, Math.round(baseDemand(good, pop)));
      const supply = regionalSupply(state, regionId, good, demand);
      row["Cầu/Tháng"] = demand;
      row["Cung/Tháng"] = supply;

      // dòng hàng vào/ra kho, cộng hư hao
      let stock = row["Tồn Kho"] + supply - demand;
      stock = Math.max(0, Math.round(stock * (1 - good.spoil)));
      // kho không phình vô hạn: dư quá 8 tháng cầu thì lái buôn chở đi nơi khác
      stock = Math.min(stock, Math.round(demand * 8));
      row["Tồn Kho"] = stock;

      // giá: cân bằng × khan hiếm, rồi bò về từ từ + nhiễu chợ búa
      const eq = equilibriumPrice(state, regionId, good);
      const cover = stock / demand;
      const scarcity = Math.max(0.35, Math.min(4, Math.pow(TARGET_COVER / Math.max(0.15, cover), 0.55)));
      const target = eq * scarcity;
      const noise = 1 + (rng() - 0.5) * 0.06;
      const prev = row["Giá"] > 0 ? row["Giá"] : eq;
      const next = Math.max(1, Math.round((prev + (target - prev) * PRICE_INERTIA) * noise));

      row["Giá Trước"] = prev;
      row["Giá"] = next;
      row["Biến Động"] = prev > 0 ? Math.round(((next - prev) / prev) * 1000) / 10 : 0;

      if (Math.abs(row["Biến Động"]) > Math.abs(biggestMove)) {
        biggestMove = row["Biến Động"];
        headline = good.id;
      }
    }

    if (headline && Math.abs(biggestMove) >= 8 && !m["Đang Có Thương Nhân"]) {
      m["Tin Đồn"] = biggestMove > 0
        ? `${headline} tăng ${biggestMove.toFixed(1)}% — người ta bắt đầu tích trữ.`
        : `${headline} rớt ${Math.abs(biggestMove).toFixed(1)}% — hàng về nhiều quá, lái buôn than lỗ.`;
    }
    m["_Ngày Cập Nhật"] = state["_engineMeta"]?.["_Nhịp"] ?? 0;
  }
}

// ── Báo giá & khớp lệnh ─────────────────────────────────────────────────────

export interface OrderQuote {
  ok: boolean;
  error?: string;
  goodId: string;
  side: OrderSide;
  /** số lượng thực sự khớp được (có thể nhỏ hơn số đặt). */
  quantity: number;
  /** giá niêm yết trước lệnh. */
  listPrice: number;
  /** giá trung bình thực trả/thực nhận trên mỗi đơn vị. */
  unitPrice: number;
  /** tổng tiền (Đồng Đỏ). */
  total: number;
  /** % trượt giá do lệnh quá lớn so với độ sâu chợ. */
  slippage: number;
  /** giá niêm yết SAU khi lệnh khớp — lệnh lớn để lại dấu thật. */
  priceAfter: number;
  /** số lượng tối đa chợ chịu được ở mức trượt giá hợp lý. */
  maxQuantity: number;
}

/** Độ sâu thị trường cho một mặt hàng — mẫu số của công thức trượt giá. */
function depthOf(m: Market, row: MarketGood): number {
  const flow = (row["Tồn Kho"] + row["Cung/Tháng"] * 0.5) * LOCAL_TRADE_SHARE;
  return Math.max(20, flow * m["Thanh Khoản"]);
}

/**
 * BÁO GIÁ một lệnh trước khi khớp. UI gọi mỗi lần người chơi gõ số lượng, nên
 * cái người chơi thấy đúng bằng cái sẽ bị trừ.
 */
export function quoteOrder(
  m: Market,
  goodId: string,
  quantity: number,
  side: OrderSide,
): OrderQuote {
  const row = m["Hàng Hoá"][goodId];
  const base: OrderQuote = {
    ok: false, goodId, side, quantity: 0, listPrice: row?.["Giá"] ?? 0,
    unitPrice: 0, total: 0, slippage: 0, priceAfter: row?.["Giá"] ?? 0, maxQuantity: 0,
  };
  if (!row) return { ...base, error: "Chợ này không có mặt hàng đó" };

  const depth = depthOf(m, row);
  const maxQty = side === "buy"
    ? Math.max(0, Math.floor(Math.min(row["Tồn Kho"], depth * 2)))
    : Math.max(0, Math.floor(depth * 2));
  base.maxQuantity = maxQty;

  const qty = Math.floor(Math.max(0, quantity));
  if (qty <= 0) return { ...base, error: "Nhập số lượng lớn hơn 0" };
  if (side === "buy" && row["Tồn Kho"] <= 0) {
    return { ...base, error: `Chợ đã hết ${goodId} — phải đợi hàng về` };
  }
  const filled = side === "buy" ? Math.min(qty, row["Tồn Kho"]) : qty;

  // trượt giá: lệnh bằng đúng độ sâu chợ thì đội/dìm giá 100%
  const impact = filled / depth;
  const sign = side === "buy" ? 1 : -1;
  const spread = m["Chênh Lệch"];

  // giá trung bình lấy nửa quãng trượt (khớp dần theo sổ lệnh)
  const avgMult = 1 + sign * impact * 0.5;
  const unit = Math.max(1, Math.round(row["Giá"] * avgMult * (1 + (sign * spread) / 2)));
  const after = Math.max(1, Math.round(row["Giá"] * (1 + sign * impact)));

  return {
    ok: true, goodId, side, quantity: filled,
    listPrice: row["Giá"], unitPrice: unit, total: unit * filled,
    slippage: Math.round(impact * 1000) / 10,
    priceAfter: after, maxQuantity: maxQty,
  };
}

export interface OrderResult {
  ok: boolean;
  error?: string;
  quote?: OrderQuote;
  ops: PatchOp[];
}

/**
 * KHỚP LỆNH. Trả PatchOp[] để store áp — tiền vào/ra ngân khố, hàng vào/ra kho
 * đích, và tồn kho + giá niêm yết của chợ đổi theo đúng lượng vừa giao dịch.
 *
 * `destination` quyết định hàng chảy về đâu: kho gia tộc (mặc định) hay kho của
 * một lãnh địa cụ thể — đây chính là cầu nối giữa buôn bán VĨ MÔ và sản xuất VI MÔ.
 */
export function executeOrder(
  state: StatData,
  regionId: string,
  goodId: string,
  quantity: number,
  side: OrderSide,
  destination?: { holdingId?: string },
): OrderResult {
  const m = marketOf(state, regionId);
  const quote = quoteOrder(m, goodId, quantity, side);
  if (!quote.ok) return { ok: false, error: quote.error, ops: [] };

  const holdingId = destination?.holdingId;
  const owned = holdingId ? state["Lãnh Địa"][holdingId] : undefined;
  if (holdingId && !owned) return { ok: false, error: "Không tìm thấy lãnh địa nhận hàng", ops: [] };

  const held = owned
    ? (owned["Tài Nguyên"][goodId] ?? 0)
    : ((state["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"] as Record<string, number>)[goodId] ?? 0);

  if (side === "buy" && state["Thông Tin Nhân Vật"]["Ngân Khố"] < quote.total) {
    return { ok: false, error: "Ngân khố không đủ trả cho lệnh này", ops: [] };
  }
  if (side === "sell" && held < quote.quantity) {
    return { ok: false, error: `Chỉ còn ${held} ${goodId} trong kho`, ops: [] };
  }

  const goodPath = `stat_data.Thị Trường Khu Vực.${regionId}.Hàng Hoá.${goodId}`;
  const stockPath = owned
    ? `stat_data.Lãnh Địa.${holdingId}.Tài Nguyên.${goodId}`
    : `stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.${goodId}`;
  const sign = side === "buy" ? 1 : -1;

  const ops: PatchOp[] = [
    { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -sign * quote.total },
    { op: "replace", path: stockPath, value: held + sign * quote.quantity },
    { op: "delta", path: `${goodPath}.Tồn Kho`, value: -sign * quote.quantity },
    { op: "replace", path: `${goodPath}.Giá Trước`, value: quote.listPrice },
    { op: "replace", path: `${goodPath}.Giá`, value: quote.priceAfter },
    {
      op: "replace", path: `${goodPath}.Biến Động`,
      value: Math.round(((quote.priceAfter - quote.listPrice) / Math.max(1, quote.listPrice)) * 1000) / 10,
    },
  ];
  return { ok: true, quote, ops };
}

// ── Đọc nhanh cho UI / AI ───────────────────────────────────────────────────

export interface MarketRow {
  good: GoodDef;
  price: number;
  prevPrice: number;
  change: number;
  stock: number;
  supply: number;
  demand: number;
  /** số tháng tồn kho còn lại — dưới 1 là sắp cháy hàng. */
  cover: number;
  buyPrice: number;
  sellPrice: number;
}

/** Bảng chợ đã sắp sẵn cho UI. */
export function marketRows(m: Market): MarketRow[] {
  const spread = m["Chênh Lệch"];
  const out: MarketRow[] = [];
  for (const id of GOOD_IDS) {
    const row = m["Hàng Hoá"][id];
    const good = GOODS_BY_ID[id];
    if (!row || !good) continue;
    out.push({
      good,
      price: row["Giá"],
      prevPrice: row["Giá Trước"],
      change: row["Biến Động"],
      stock: row["Tồn Kho"],
      supply: row["Cung/Tháng"],
      demand: row["Cầu/Tháng"],
      cover: row["Cầu/Tháng"] > 0 ? row["Tồn Kho"] / row["Cầu/Tháng"] : 99,
      buyPrice: Math.round(row["Giá"] * (1 + spread / 2)),
      sellPrice: Math.round(row["Giá"] * (1 - spread / 2)),
    });
  }
  return out;
}

/** Vài dòng tóm tắt biến động cho AI kể — không dump cả bảng vào prompt. */
export function marketHeadlines(m: Market, limit = 4): string[] {
  return marketRows(m)
    .filter((r) => Math.abs(r.change) >= 4 || r.cover < 0.8)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, limit)
    .map((r) => {
      const dir = r.change >= 0 ? "tăng" : "giảm";
      const scarce = r.cover < 0.8 ? ", kho gần cạn" : "";
      return `${r.good.id} ${dir} ${Math.abs(r.change).toFixed(1)}%${scarce}`;
    });
}
