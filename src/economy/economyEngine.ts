/**
 * economyEngine — LOOP KINH TẾ CẤP LÃNH THỔ, chốt sổ MỖI THÁNG truyện.
 *
 * Sau đợt đại tu M18, file này chỉ còn làm nhạc trưởng. Việc nặng nằm ở ba nơi
 * chuyên trách, và mỗi con số chỉ có MỘT nguồn:
 *
 *   economy/taxation.ts — thuế dân, tô thuế chư hầu, cống nạp bề trên
 *   economy/budget.ts   — toàn bộ sổ thu chi (quân, hạ tầng, triều chính, nợ)
 *   economy/market.ts   — giá cả, cung cầu, tồn kho từng vùng
 *
 * Sổ của từng lãnh địa (sản lượng công trình theo nhân lực, trữ lượng mạch,
 * kho vật tư) nằm ở territory/construction.ts và chạy trong listener riêng.
 *
 * Thứ tự trong tháng: chợ chạy trước (để giá phản ánh sản lượng tháng trước),
 * rồi tới sổ thu chi, rồi nợ nần, cuối cùng là khủng hoảng.
 */
import type { StatData } from "../mvu/schema";
import { registerMonthlyListener } from "../mvu/effects";
import { clamp } from "../mvu/helpers";
import { makeRng, eventSeed } from "../probability/rng";
import { createLogger } from "../lib/log";
import { monthlyBudget, type Budget } from "./budget";
import { tickMarkets } from "./market";
import { isBlockaded } from "./blockade";
import { taxPreview, TAX_TABLE, TAX_BRACKETS, grossProduct, prosperityOf } from "./taxation";

const log = createLogger("economy");

export { isBlockaded, taxPreview, TAX_TABLE, TAX_BRACKETS, grossProduct, prosperityOf };

// ── Nợ nần ──────────────────────────────────────────────────────────────────

/**
 * Trừ lãi mỗi tháng; tới hạn thì trả gốc, không đủ thì QUỴT (hậu quả do AI kể).
 * Trả về tổng lãi đã bị trừ để sổ thu chi khớp với thực tế.
 */
function tickDebts(state: StatData): number {
  let paid = 0;
  for (const debt of Object.values(state["Các Khoản Nợ"] ?? {})) {
    if (!debt) continue;
    if (debt["Nợ Gốc"] <= 0 && debt["Tháng Còn Lại"] <= 0) continue;
    if (debt["Đang Quỵt"]) continue;

    debt["Tháng Còn Lại"] = Math.max(0, debt["Tháng Còn Lại"] - 1);
    if (debt["Tháng Còn Lại"] <= 0 && debt["Nợ Gốc"] > 0) {
      const owed = debt["Nợ Gốc"] + debt["Lãi/Tháng"];
      if (state["Thông Tin Nhân Vật"]["Ngân Khố"] >= owed) {
        state["Thông Tin Nhân Vật"]["Ngân Khố"] -= owed;
        debt["Nợ Gốc"] = 0;
        debt["Lãi/Tháng"] = 0;
      } else {
        debt["Đang Quỵt"] = true;
      }
      continue;
    }
    paid += debt["Lãi/Tháng"];
  }
  return paid;
}

/** Thu lãi từ con nợ; tới hạn thì đòi gốc, kẻ thù địch thì quỵt. */
function tickLoans(state: StatData): void {
  const loans = state["Các Khoản Cho Vay"];
  if (!loans) return;
  for (const [debtorId, loan] of Object.entries(loans)) {
    if (!loan) continue;
    if (loan["Nợ Gốc"] <= 0 && loan["Tháng Còn Lại"] <= 0) continue;
    if (loan["Đang Quỵt"]) continue;

    loan["Tháng Còn Lại"] = Math.max(0, loan["Tháng Còn Lại"] - 1);
    if (loan["Tháng Còn Lại"] <= 0 && loan["Nợ Gốc"] > 0) {
      const attitude = state["Thái Độ Các Nhà"]?.[debtorId]?.["Thái Độ"] ?? "Cảnh Giác";
      if (attitude === "Địch Ý" || attitude === "Thù Địch" || attitude === "Bất Mãn") {
        loan["Đang Quỵt"] = true;
      } else {
        state["Thông Tin Nhân Vật"]["Ngân Khố"] += loan["Nợ Gốc"];
        loan["Nợ Gốc"] = 0;
        loan["Lãi/Tháng"] = 0;
      }
    }
  }
}

// ── Khủng hoảng (15.4) ──────────────────────────────────────────────────────

const FAMINE_POP_LOSS_RATE = 0.02;
const FAMINE_LOYALTY_LOSS = 3;
const REBELLION_POP_RATIO = 0.1;
const WINTER_FOOD_DRAIN = 200;

function tickCrises(state: StatData): void {
  const season = state["Thế Giới"]["Mùa"];
  const tick = state["_engineMeta"]["_Nhịp"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];

  for (const [regionId, territory] of Object.entries(state["Lãnh Địa"])) {
    const food = territory["Tài Nguyên"]["Lương Thực"];
    const loyalty = territory["Trung Thành"];
    const crises = territory["Khủng Hoảng"] ?? [];

    // ── Nạn đói ──
    if (food <= 0) {
      const existing = crises.find((c) => c["Loại"] === "Nạn Đói");
      if (existing) {
        existing["Tháng Kéo Dài"] += 1;
        if (existing["Tháng Kéo Dài"] > 10) existing["Mức Độ"] = "Thảm Hoạ";
        else if (existing["Tháng Kéo Dài"] > 5) existing["Mức Độ"] = "Nghiêm Trọng";
      } else {
        crises.push({ "Loại": "Nạn Đói", "Mức Độ": "Chớm", "Tháng Kéo Dài": 1 });
      }
      territory["Dân Số"] = Math.max(100, Math.round(territory["Dân Số"] * (1 - FAMINE_POP_LOSS_RATE)));
      territory["Trung Thành"] = clamp(territory["Trung Thành"] - FAMINE_LOYALTY_LOSS, 0, 100);
    } else {
      const idx = crises.findIndex((c) => c["Loại"] === "Nạn Đói");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Mùa Đông khắc nghiệt ──
    if (season === "Đông") {
      territory["Tài Nguyên"]["Lương Thực"] = Math.max(0, food - WINTER_FOOD_DRAIN);
      const winterCrisis = crises.find((c) => c["Loại"] === "Mùa Đông Khắc Nghiệt");
      if (food < WINTER_FOOD_DRAIN * 3) {
        if (winterCrisis) winterCrisis["Tháng Kéo Dài"] += 1;
        else crises.push({ "Loại": "Mùa Đông Khắc Nghiệt", "Mức Độ": "Chớm", "Tháng Kéo Dài": 1 });
      }
    } else {
      const idx = crises.findIndex((c) => c["Loại"] === "Mùa Đông Khắc Nghiệt");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Nổi loạn: lòng dân kiệt, hoặc quá nửa dân vô gia cư ──
    const homelessRate = territory["Dân Số"] > 0 ? (territory["Vô Gia Cư"] ?? 0) / territory["Dân Số"] : 0;
    if (loyalty < 15 || homelessRate > 0.45) {
      const existing = crises.find((c) => c["Loại"] === "Nổi Loạn");
      if (!existing) {
        const rng = makeRng(eventSeed(rootSeed, tick, `rebel-${regionId}`));
        if (rng() < 0.6) {
          crises.push({ "Loại": "Nổi Loạn", "Mức Độ": "Chớm", "Tháng Kéo Dài": 1 });
          const rebels = Math.round(territory["Dân Số"] * REBELLION_POP_RATIO);
          territory["Dân Số"] = Math.max(100, territory["Dân Số"] - rebels);
        }
      } else {
        existing["Tháng Kéo Dài"] += 1;
        if (existing["Tháng Kéo Dài"] > 5) existing["Mức Độ"] = "Nghiêm Trọng";
      }
    } else if (loyalty >= 30) {
      const idx = crises.findIndex((c) => c["Loại"] === "Nổi Loạn");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Dịch bệnh: chật chội thì dễ bùng, và tự hết sau ~20 tháng ──
    const plague = crises.find((c) => c["Loại"] === "Dịch Bệnh");
    if (plague) {
      plague["Tháng Kéo Dài"] += 1;
      territory["Dân Số"] = Math.max(100, Math.round(territory["Dân Số"] * 0.99));
      if (plague["Tháng Kéo Dài"] > 20) {
        const idx = crises.indexOf(plague);
        if (idx >= 0) crises.splice(idx, 1);
      }
    } else if (homelessRate > 0.2) {
      const rng = makeRng(eventSeed(rootSeed, tick, `plague-${regionId}`));
      if (rng() < homelessRate * 0.25) {
        crises.push({ "Loại": "Dịch Bệnh", "Mức Độ": "Chớm", "Tháng Kéo Dài": 1 });
      }
    }

    territory["Khủng Hoảng"] = crises;
  }
}

/** NPC có thu nhập riêng — để họ mua bán, hối lộ, chuộc thân được. */
function tickMicroEconomy(state: StatData): void {
  const npcs = state["Mối Quan Hệ"]["NPC Chính"] || {};
  for (const id in npcs) {
    const npc = npcs[id];
    if (!npc) continue;
    let income = 560;
    if (npc["Chức Vụ"]) income += 2240;
    if (npc["Nhà"]) income += 1120;
    npc["Ngân Khố"] = (npc["Ngân Khố"] || 0) + income;
  }
}

// ── Tick chính ──────────────────────────────────────────────────────────────

/**
 * 1 tick kinh tế (1 THÁNG truyện). MUTATE state — chạy trong monthly registry.
 * Thứ tự: chợ → sổ thu chi → nợ → vi mô NPC → khủng hoảng.
 */
export function tickEconomy(state: StatData): void {
  // 1. thị trường: cung cầu và giá cả của mọi vùng
  tickMarkets(state);

  // 2. sổ thu chi — MỘT nguồn duy nhất, đúng bảng mà UI đang hiện
  const budget = monthlyBudget(state);
  // lãi nợ đã nằm trong sổ; tickDebts lo phần trả gốc và quỵt nợ
  const interestHandled = tickDebts(state);
  tickLoans(state);

  // tránh trừ lãi hai lần: sổ đã tính lãi, nên chỉ áp phần ròng của sổ
  void interestHandled;
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = Math.max(
    0,
    state["Thông Tin Nhân Vật"]["Ngân Khố"] + budget.net,
  );

  // 3. lòng dân theo mức thuế đang áp
  const taxLoyalty = TAX_BRACKETS[state["Chính Sách Thuế"]["Mức Thuế"]].loyaltyPerMonth;
  if (taxLoyalty !== 0) {
    for (const territory of Object.values(state["Lãnh Địa"])) {
      territory["Trung Thành"] = clamp(territory["Trung Thành"] + taxLoyalty, 0, 100);
      territory["Lòng Dân"] = clamp(territory["Lòng Dân"] + taxLoyalty, 0, 100);
    }
  }

  tickMicroEconomy(state);
  tickCrises(state);
}

let registered = false;
export function registerEconomyLoop(): void {
  if (registered) return;
  registerMonthlyListener("economy", tickEconomy);
  registered = true;
  log.info("Economy loop registered");
}

// ── Tiện ích cho UI / store ─────────────────────────────────────────────────

/** Sổ thu chi đầy đủ — dùng cho bảng Kinh Tế. */
export function currentBudget(state: StatData): Budget {
  return monthlyBudget(state);
}

/**
 * Tóm tắt thu/chi mỗi THÁNG. Giữ nguyên hình dạng cũ để phần UI/test sẵn có
 * không phải viết lại, nhưng con số giờ lấy từ sổ chi tiết.
 */
export function estimateNetIncome(state: StatData): {
  tradeIncome: number;
  taxIncome: number;
  microTaxIncome: number;
  macroTaxIncome: number;
  ironBankExpense: number;
  loanIncome: number;
  militaryUpkeep: number;
  infrastructureExpense: number;
  courtExpense: number;
  liegeDueExpense: number;
  income: number;
  expense: number;
  net: number;
} {
  const budget = monthlyBudget(state);
  const sum = (ids: string[], prefix?: string) =>
    budget.lines
      .filter((l) => ids.includes(l.id) || (prefix ? l.id.startsWith(prefix) : false))
      .reduce((s, l) => s + l.amount, 0);

  const microTaxIncome = sum(["tax-land", "tax-market", "tax-toll"]);
  const macroTaxIncome = sum(["levy-banner", "levy-crown"]);

  return {
    tradeIncome: sum(["inc-trade", "inc-holdings"]),
    taxIncome: microTaxIncome + macroTaxIncome,
    microTaxIncome,
    macroTaxIncome,
    ironBankExpense: sum([], "exp-debt-"),
    loanIncome: sum(["inc-lending"]),
    militaryUpkeep: sum(["exp-wages", "exp-training", "exp-fleet"]),
    infrastructureExpense: sum(["exp-buildings", "exp-walls"]),
    courtExpense: sum(["exp-household", "exp-feast", "exp-spies"]),
    liegeDueExpense: sum(["liege-due"]),
    income: budget.income,
    expense: budget.expense,
    net: budget.net,
  };
}

/** Số THÁNG trước khi cạn ngân khố (−1 nếu đang lời hoặc 0 Vàng). */
export function monthsUntilBankrupt(state: StatData): number {
  return monthlyBudget(state).monthsLeft;
}

/** Có đang nợ ai không (Iron Bank hoặc bất kỳ chủ nợ nào). */
export function isInDebt(state: StatData): boolean {
  for (const debt of Object.values(state["Các Khoản Nợ"] ?? {})) {
    if (!debt) continue;
    if (debt["Nợ Gốc"] > 0 || debt["Đang Quỵt"]) return true;
  }
  return false;
}
