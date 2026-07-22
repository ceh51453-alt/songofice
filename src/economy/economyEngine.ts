/**
 * economyEngine (15.1-15.4) — turn-advance loop cho kinh tế liên vùng:
 *
 * - tickEconomy: chạy mỗi ngày truyện (registerTurnListener) — xử lý:
 *   1. Thương mại: lợi nhuận tuyến × An Toàn, phong toả cảng = 0
 *   2. Thuế: bảng TAX_TABLE áp Vàng/turn + Δ Trung Thành/turn (× Đại Chưởng Ngân Khố)
 *   3. Iron Bank: trừ lãi mỗi turn; quỵt nợ flag
 *   4. Khủng hoảng: Lương Thực ≤ 0 → nạn đói; Trung Thành < 15 → nổi loạn; Mùa Đông drain
 *
 * Engine giữ số; AI KHÔNG tự quyết. Vàng cộng/trừ vào ngân khố thống nhất
 * (Thông Tin Nhân Vật.Vàng — 15.3 note). Pattern giống tickConstruction/tickArmy.
 */
import type { StatData, TaxLevel } from "../mvu/schema";
import { registerTurnListener } from "../mvu/effects";
import { treasuryMultiplier } from "../strategy/court";
import { clamp } from "../mvu/helpers";
import { makeRng, eventSeed } from "../probability/rng";
import { createLogger } from "../lib/log";
import { hasPrivilege } from "../character/roleplay";
import { REGIONS_BY_ID } from "../content/westeros/regions";

const log = createLogger("economy");

// ── Bảng thuế (15.3) ─────────────────────────────────────────────────────────

export interface TaxEffect {
  /** Hệ số thu Vàng (× baseGold per territory). */
  goldMultiplier: number;
  /** Δ Trung Thành mỗi turn trên toàn bộ lãnh địa. */
  loyaltyPerTurn: number;
}

export const TAX_TABLE: Record<TaxLevel, TaxEffect> = {
  "Miễn Thuế": { goldMultiplier: 0, loyaltyPerTurn: 3 },
  "Nhẹ":       { goldMultiplier: 0.5, loyaltyPerTurn: 1 },
  "Vừa":       { goldMultiplier: 1.0, loyaltyPerTurn: 0 },
  "Nặng":      { goldMultiplier: 1.6, loyaltyPerTurn: -2 },
  "Vắt Kiệt":  { goldMultiplier: 2.2, loyaltyPerTurn: -5 },
};

/** Preview thuế: ước tính thu Vàng/turn và Δ Trung Thành cho 1 mức thuế. */
export function taxPreview(
  state: StatData,
  level: TaxLevel,
): { goldPerTurn: number; loyaltyPerTurn: number } {
  const effect = TAX_TABLE[level];
  const coinMult = treasuryMultiplier(state);
  let baseGold = 0;
  for (const territory of Object.values(state["Lãnh Địa"])) {
    baseGold += Math.round(territory["Dân Số"] * 0.005);
  }

  // Thuế chư hầu vĩ mô
  const canTaxMacro = hasPrivilege(state, "Thu Thuế Toàn Cõi") || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  if (canTaxMacro) {
    for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
      if (sov["Là Của Người Chơi"]) {
        const regionInfo = REGIONS_BY_ID[regionId];
        if (regionInfo) {
          // Thu 200 Vàng cho mỗi 1 triệu dân số
          baseGold += Math.round(regionInfo.population * 200);
        }
      }
    }
  }

  return {
    goldPerTurn: Math.round(baseGold * effect.goldMultiplier * coinMult),
    loyaltyPerTurn: effect.loyaltyPerTurn,
  };
}

// ── Phong toả cảng (nối 7.8) ─────────────────────────────────────────────────

/** Kiểm tra 1 vùng có đang bị phong toả cảng hay không (7.8 → 15.2). */
export function isBlockaded(state: StatData, regionId: string): boolean {
  for (const fleet of Object.values(state["Hạm Đội"])) {
    if (fleet["Đang Phong Toả"] === regionId) return true;
  }
  return false;
}

// ── Tick Thương Mại (15.2) ───────────────────────────────────────────────────

function tickTrade(state: StatData): number {
  let totalProfit = 0;
  for (const route of Object.values(state["Tuyến Thương Mại"])) {
    // biển + cảng đến bị phong toả → lợi nhuận = 0
    if (route["Đường"] === "Biển" && isBlockaded(state, route["Đến"])) {
      continue;
    }

    const safety = route["An Toàn"];
    // an toàn < 30 → risk mất hàng (giảm lợi nhuận thêm)
    const effectiveSafety = safety < 30 ? safety * 0.5 : safety;
    const profit = Math.round(route["Lợi Nhuận/Turn"] * (effectiveSafety / 100));
    totalProfit += profit;
  }
  return totalProfit;
}

// ── Tick Thuế (15.3) ─────────────────────────────────────────────────────────

function tickTax(state: StatData, coinMult: number): number {
  const level = state["Chính Sách Thuế"]["Mức Thuế"];
  const effect = TAX_TABLE[level];
  let taxGold = 0;

  // 1. Thuế trực tiếp từ Lãnh Địa (vi mô)
  for (const territory of Object.values(state["Lãnh Địa"])) {
    const baseGold = Math.round(territory["Dân Số"] * 0.005);
    taxGold += Math.round(baseGold * effect.goldMultiplier);

    // Δ Trung Thành
    territory["Trung Thành"] = clamp(
      territory["Trung Thành"] + effect.loyaltyPerTurn,
      0,
      100,
    );
  }

  // 2. Thuế chư hầu (vĩ mô)
  const canTaxMacro = hasPrivilege(state, "Thu Thuế Toàn Cõi") || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  if (canTaxMacro) {
    for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
      if (sov["Là Của Người Chơi"]) {
        const regionInfo = REGIONS_BY_ID[regionId];
        if (regionInfo) {
          // Thu 200 Vàng cho mỗi 1 triệu dân số
          const macroGold = Math.round(regionInfo.population * 200);
          taxGold += Math.round(macroGold * effect.goldMultiplier);
        }
      }
    }
  }

  return Math.round(taxGold * coinMult);
}

// ── Tick Iron Bank (15.3) ────────────────────────────────────────────────────

function tickIronBank(state: StatData): number {
  const bank = state["Nợ Iron Bank"];
  if (bank["Nợ Gốc"] <= 0 && bank["Turn Còn Lại"] <= 0) return 0;

  if (bank["Đang Quỵt"]) return 0; // đã quỵt, hậu quả xử lý bởi AI

  const interest = bank["Lãi/Turn"];
  bank["Turn Còn Lại"] = Math.max(0, bank["Turn Còn Lại"] - 1);

  // trả hết nợ
  if (bank["Turn Còn Lại"] <= 0 && bank["Nợ Gốc"] > 0) {
    const totalOwed = bank["Nợ Gốc"] + interest;
    if (state["Thông Tin Nhân Vật"]["Vàng"] >= totalOwed) {
      state["Thông Tin Nhân Vật"]["Vàng"] -= totalOwed;
      bank["Nợ Gốc"] = 0;
      bank["Lãi/Turn"] = 0;
      return 0;
    }
    // không đủ trả → quỵt
    bank["Đang Quỵt"] = true;
    return 0;
  }

  return interest; // trừ mỗi turn
}

// ── Tick Khủng Hoảng (15.4) ──────────────────────────────────────────────────

const FAMINE_POP_LOSS_RATE = 0.02;   // 2% dân số mỗi turn nạn đói
const FAMINE_LOYALTY_LOSS = 3;
const REBELLION_POP_RATIO = 0.1;     // 10% dân trở thành quân phản loạn
const WINTER_FOOD_DRAIN = 200;       // lương tiêu thêm mỗi turn mùa đông

function tickCrises(state: StatData): void {
  const season = state["Thế Giới"]["Mùa"];
  const turn = state["_engineMeta"]["turnCount"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];

  for (const [regionId, territory] of Object.entries(state["Lãnh Địa"])) {
    const food = territory["Tài Nguyên"]["Lương Thực"];
    const loyalty = territory["Trung Thành"];
    const crises = territory["Khủng Hoảng"] ?? [];

    // ── Nạn đói: Lương Thực ≤ 0 ──
    if (food <= 0) {
      const existing = crises.find((c) => c["Loại"] === "Nạn Đói");
      if (existing) {
        existing["Turn Kéo Dài"] += 1;
        if (existing["Turn Kéo Dài"] > 10) existing["Mức Độ"] = "Thảm Hoạ";
        else if (existing["Turn Kéo Dài"] > 5) existing["Mức Độ"] = "Nghiêm Trọng";
      } else {
        crises.push({ "Loại": "Nạn Đói", "Mức Độ": "Chớm", "Turn Kéo Dài": 1 });
      }
      // dân chết dần
      territory["Dân Số"] = Math.max(100, Math.round(territory["Dân Số"] * (1 - FAMINE_POP_LOSS_RATE)));
      territory["Trung Thành"] = clamp(territory["Trung Thành"] - FAMINE_LOYALTY_LOSS, 0, 100);
    } else {
      // có lương → xoá nạn đói nếu đang có
      const idx = crises.findIndex((c) => c["Loại"] === "Nạn Đói");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Mùa Đông khắc nghiệt: drain kho lương ──
    if (season === "Đông") {
      territory["Tài Nguyên"]["Lương Thực"] = Math.max(0, food - WINTER_FOOD_DRAIN);
      const winterCrisis = crises.find((c) => c["Loại"] === "Mùa Đông Khắc Nghiệt");
      if (food < WINTER_FOOD_DRAIN * 3) {
        if (winterCrisis) {
          winterCrisis["Turn Kéo Dài"] += 1;
        } else {
          crises.push({ "Loại": "Mùa Đông Khắc Nghiệt", "Mức Độ": "Chớm", "Turn Kéo Dài": 1 });
        }
      }
    } else {
      // hết đông → xoá
      const idx = crises.findIndex((c) => c["Loại"] === "Mùa Đông Khắc Nghiệt");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Nổi loạn: Trung Thành < 15 ──
    if (loyalty < 15) {
      const existing = crises.find((c) => c["Loại"] === "Nổi Loạn");
      if (!existing) {
        const rng = makeRng(eventSeed(rootSeed, turn, `rebel-${regionId}`));
        if (rng() < 0.6) {
          crises.push({ "Loại": "Nổi Loạn", "Mức Độ": "Chớm", "Turn Kéo Dài": 1 });
          // chuyển phần dân thành "quân phản loạn" (giảm dân số; quân phản loạn xử lý bởi AI)
          const rebels = Math.round(territory["Dân Số"] * REBELLION_POP_RATIO);
          territory["Dân Số"] = Math.max(100, territory["Dân Số"] - rebels);
        }
      } else {
        existing["Turn Kéo Dài"] += 1;
        if (existing["Turn Kéo Dài"] > 5) existing["Mức Độ"] = "Nghiêm Trọng";
      }
    } else if (loyalty >= 30) {
      // đủ yên ổn → dẹp loạn
      const idx = crises.findIndex((c) => c["Loại"] === "Nổi Loạn");
      if (idx >= 0) crises.splice(idx, 1);
    }

    // ── Dịch bệnh tick (đơn giản — chi tiết mở rộng sau) ──
    const plague = crises.find((c) => c["Loại"] === "Dịch Bệnh");
    if (plague) {
      plague["Turn Kéo Dài"] += 1;
      territory["Dân Số"] = Math.max(100, Math.round(territory["Dân Số"] * 0.99));
      // tự hết sau ~20 turn
      if (plague["Turn Kéo Dài"] > 20) {
        const idx = crises.indexOf(plague);
        if (idx >= 0) crises.splice(idx, 1);
      }
    }

    territory["Khủng Hoảng"] = crises;
  }
}

// ── Main tick ────────────────────────────────────────────────────────────────

/**
 * 1 tick kinh tế (1 ngày truyện). MUTATE state — chạy trong turn-advance
 * registry (effects.ts). Thứ tự: thương mại → thuế → Iron Bank → khủng hoảng.
 */
export function tickEconomy(state: StatData): void {
  const coinMult = treasuryMultiplier(state);

  // 1. thương mại
  const tradeProfit = tickTrade(state);

  // 2. thuế
  const taxGold = tickTax(state, coinMult);

  // 3. Iron Bank
  const interest = tickIronBank(state);

  // 4. tổng vàng vào ngân khố thống nhất
  state["Thông Tin Nhân Vật"]["Vàng"] = Math.max(
    0,
    state["Thông Tin Nhân Vật"]["Vàng"] + tradeProfit + taxGold - interest,
  );

  // 5. khủng hoảng
  tickCrises(state);
}

// ── Đăng ký vào turn-advance loop ────────────────────────────────────────────

let registered = false;
export function registerEconomyLoop(): void {
  if (registered) return;
  registerTurnListener("economy", tickEconomy);
  registered = true;
  log.info("Economy loop registered");
}

// ── Tiện ích cho UI / store ──────────────────────────────────────────────────

/** Tính tổng thu/chi kinh tế ước lượng per turn — cho sparkline & bảng tổng quan. */
export function estimateNetIncome(state: StatData): {
  tradeIncome: number;
  taxIncome: number;
  ironBankExpense: number;
  net: number;
} {
  const coinMult = treasuryMultiplier(state);
  let tradeIncome = 0;
  for (const route of Object.values(state["Tuyến Thương Mại"])) {
    if (route["Đường"] === "Biển" && isBlockaded(state, route["Đến"])) continue;
    tradeIncome += Math.round(route["Lợi Nhuận/Turn"] * (route["An Toàn"] / 100));
  }

  const level = state["Chính Sách Thuế"]["Mức Thuế"];
  const effect = TAX_TABLE[level];
  let baseGold = 0;
  for (const territory of Object.values(state["Lãnh Địa"])) {
    baseGold += Math.round(territory["Dân Số"] * 0.005);
  }
  const taxIncome = Math.round(baseGold * effect.goldMultiplier * coinMult);

  const ironBankExpense = state["Nợ Iron Bank"]["Lãi/Turn"];

  return {
    tradeIncome,
    taxIncome,
    ironBankExpense,
    net: tradeIncome + taxIncome - ironBankExpense,
  };
}

/** Số turn trước khi cạn ngân khố (−1 nếu đang lời hoặc 0 Vàng). */
export function turnsUntilBankrupt(state: StatData): number {
  const { net } = estimateNetIncome(state);
  if (net >= 0) return -1;
  const gold = state["Thông Tin Nhân Vật"]["Vàng"];
  if (gold <= 0) return 0;
  return Math.ceil(gold / Math.abs(net));
}

/** Có đang nợ Iron Bank hay không. */
export function isInDebt(state: StatData): boolean {
  return state["Nợ Iron Bank"]["Nợ Gốc"] > 0 || state["Nợ Iron Bank"]["Đang Quỵt"];
}
