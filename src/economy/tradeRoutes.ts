/**
 * tradeRoutes (15.2) — tạo/huỷ tuyến thương mại + ước lợi nhuận + gợi ý.
 * Trả PatchOp[] cho engine áp (pattern giống construction/army).
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { calcMapDistance, distanceToDays, findRegionPath } from "../strategy/army";
import { DAYS_PER_MONTH } from "../mvu/calendar";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import {
  GOODS, BASELINE_PRICE, regionPrice, type Good,
} from "../content/westeros/regionalResources";
import { EXCHANGE_RATES } from "./currency";

export interface TradeResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  routeName?: string;
  estimatedProfit?: number;
}

/**
 * Tính lợi nhuận dự kiến khi vận chuyển `goods` từ `fromId` → `toId`.
 * Lợi nhuận = Σ (giá bán − giá mua) mỗi hàng, chia cho số THÁNG vận chuyển.
 */
export function estimateProfit(
  state: StatData,
  fromId: string,
  toId: string,
  goods: Good[],
  routeType: "Bộ" | "Biển" | "Sông" = "Bộ",
): number {
  if (goods.length === 0) return 0;
  let totalMargin = 0;
  for (const good of goods) {
    const buyPrice = state["Kinh Tế Vùng"][fromId]?.["Giá Cả"][good] ?? regionPrice(fromId, good);
    const sellPrice = state["Kinh Tế Vùng"][toId]?.["Giá Cả"][good] ?? regionPrice(toId, good);
    totalMargin += Math.max(0, sellPrice - buyPrice);
  }
  // chia cho thời gian đi đường → lợi nhuận/tháng (vận chuyển mất thời gian)
  const dist = calcMapDistance(fromId, toId, routeType === "Bộ" ? "land" : "direct");
  if (!Number.isFinite(dist)) return 0;
  const months = Math.max(1, distanceToDays(dist) / DAYS_PER_MONTH);
  return Math.round(totalMargin / months * 10 * EXCHANGE_RATES.GOLD_TO_COPPER); // ×10 vì mỗi tuyến chở lô lớn, quy ra Đồng Đỏ
}

/**
 * Mở 1 tuyến thương mại mới (15.2). Tính lợi nhuận tự động từ chênh giá.
 */
export function createTradeRoute(
  state: StatData,
  fromId: string,
  toId: string,
  goods: Good[],
  routeType?: "Bộ" | "Biển" | "Sông",
): TradeResult {
  if (!REGIONS_BY_ID[fromId]) return { ok: false, error: "Vùng xuất phát không hợp lệ", ops: [] };
  if (!REGIONS_BY_ID[toId]) return { ok: false, error: "Vùng đích không hợp lệ", ops: [] };
  if (fromId === toId) return { ok: false, error: "Không thể mở tuyến nội vùng", ops: [] };
  if (goods.length === 0) return { ok: false, error: "Chọn ít nhất 1 hàng hoá", ops: [] };

  // biển: cần cả 2 vùng ven biển
  const type = routeType ?? (REGIONS_BY_ID[fromId]?.coastal && REGIONS_BY_ID[toId]?.coastal ? "Biển" : "Bộ");
  if (type === "Biển" && (!REGIONS_BY_ID[fromId]?.coastal || !REGIONS_BY_ID[toId]?.coastal)) {
    return { ok: false, error: "Tuyến biển cần cả 2 vùng ven biển", ops: [] };
  }
  if (type === "Bộ" && !findRegionPath(fromId, toId, "land")) {
    return { ok: false, error: "Không có hành lang đường bộ liên tục giữa hai vùng; hãy chọn tuyến biển qua cảng", ops: [] };
  }

  const profit = estimateProfit(state, fromId, toId, goods, type);
  const fromName = REGIONS_BY_ID[fromId]?.name ?? fromId;
  const toName = REGIONS_BY_ID[toId]?.name ?? toId;
  const routeName = `${fromName} → ${toName}`;

  // kiểm tra trùng theo endpoint, không phụ thuộc tên hiển thị cũ sau migration
  if (state["Tuyến Thương Mại"][routeName] || Object.values(state["Tuyến Thương Mại"]).some(
    (route) => route["Từ"] === fromId && route["Đến"] === toId,
  )) {
    return { ok: false, error: "Tuyến này đã tồn tại", ops: [] };
  }

  return {
    ok: true,
    routeName,
    estimatedProfit: profit,
    ops: [{
      op: "replace",
      path: `stat_data.Tuyến Thương Mại.${routeName}`,
      value: {
        "Từ": fromId,
        "Đến": toId,
        "Hàng Hoá": [...goods],
        "Lợi Nhuận/Tháng": profit,
        "Đường": type,
        "An Toàn": 80,
      },
    }],
  };
}

/** Đóng 1 tuyến thương mại. */
export function cancelTradeRoute(routeName: string): PatchOp[] {
  return [{ op: "remove", path: `stat_data.Tuyến Thương Mại.${routeName}` }];
}

/** Gợi ý cơ hội thương mại: cặp vùng có chênh giá lớn nhất (15.5 UI). */
export function suggestOpportunities(
  state: StatData,
  maxResults = 5,
): { from: string; to: string; good: Good; profit: number }[] {
  const results: { from: string; to: string; good: Good; profit: number }[] = [];
  const regionIds = Object.keys(state["Kinh Tế Vùng"]);

  for (const from of regionIds) {
    for (const to of regionIds) {
      if (from === to) continue;
      for (const good of GOODS) {
        const buyPrice = state["Kinh Tế Vùng"][from]?.["Giá Cả"][good] ?? BASELINE_PRICE[good];
        const sellPrice = state["Kinh Tế Vùng"][to]?.["Giá Cả"][good] ?? BASELINE_PRICE[good];
        const margin = sellPrice - buyPrice;
        if (margin > 0) {
          results.push({ from, to, good, profit: margin });
        }
      }
    }
  }

  results.sort((a, b) => b.profit - a.profit);
  return results.slice(0, maxResults);
}
