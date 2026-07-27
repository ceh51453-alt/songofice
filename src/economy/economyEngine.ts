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
import { EXCHANGE_RATES } from "./currency";
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
  const canTaxAll = hasPrivilege(state, "Thu Thuế Toàn Cõi");
  const canTaxMacro = canTaxAll || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  
  if (canTaxMacro) {
    for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
      // Vua 7 Vương Quốc thu thuế toàn cõi, Quốc Vương/Đại Lãnh Chúa chỉ thu vùng của mình
      if (canTaxAll || sov["Là Của Người Chơi"]) {
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
  const canTaxAll = hasPrivilege(state, "Thu Thuế Toàn Cõi");
  const canTaxMacro = canTaxAll || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  
  if (canTaxMacro) {
    for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
      if (canTaxAll || sov["Là Của Người Chơi"]) {
        const regionInfo = REGIONS_BY_ID[regionId];
        if (regionInfo) {
          // Thu 200 Vàng cho mỗi 1 triệu dân số
          const macroGold = Math.round(regionInfo.population * 200);
          taxGold += Math.round(macroGold * effect.goldMultiplier);
        }
      }
    }
  }

  return Math.round(taxGold * coinMult * EXCHANGE_RATES.GOLD_TO_COPPER);
}

// ── Tick Iron Bank (15.3) ────────────────────────────────────────────────────

function tickIronBank(state: StatData): number {
  const bank = state["Các Khoản Nợ"]?.["Iron Bank"];
  if (!bank || (bank["Nợ Gốc"] <= 0 && bank["Turn Còn Lại"] <= 0)) return 0;

  if (bank["Đang Quỵt"]) return 0; // đã quỵt, hậu quả xử lý bởi AI

  const interest = bank["Lãi/Turn"];
  bank["Turn Còn Lại"] = Math.max(0, bank["Turn Còn Lại"] - 1);

  // trả hết nợ
  if (bank["Turn Còn Lại"] <= 0 && bank["Nợ Gốc"] > 0) {
    const totalOwed = bank["Nợ Gốc"] + interest;
    if (state["Thông Tin Nhân Vật"]["Ngân Khố"] >= totalOwed) {
      state["Thông Tin Nhân Vật"]["Ngân Khố"] -= totalOwed;
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

// ── Tick Cho Vay (Player as Creditor) ──────────────────────────────────────────

function tickLoans(state: StatData): number {
  let totalInterest = 0;
  const loans = state["Các Khoản Cho Vay"];
  if (!loans) return 0;
  
  for (const [debtorId, loan] of Object.entries(loans)) {
    if (loan["Nợ Gốc"] <= 0 && loan["Turn Còn Lại"] <= 0) continue;
    if (loan["Đang Quỵt"]) continue;

    const interest = loan["Lãi/Turn"];
    loan["Turn Còn Lại"] = Math.max(0, loan["Turn Còn Lại"] - 1);
    
    totalInterest += interest;

    if (loan["Turn Còn Lại"] <= 0 && loan["Nợ Gốc"] > 0) {
      const attitude = state["Thái Độ Các Nhà"]?.[debtorId]?.["Thái Độ"] || "Cảnh Giác";
      if (attitude === "Địch Ý" || attitude === "Thù Địch") {
        loan["Đang Quỵt"] = true;
        loan["Đang Quỵt"] = true;
      } else {
        totalInterest += loan["Nợ Gốc"];
        loan["Nợ Gốc"] = 0;
        loan["Lãi/Turn"] = 0;
      }
    }
  }
  return totalInterest;
}

// ── Tick Thị Trường (Market & Merchants) ──────────────────────────────────

function tickMarket(state: StatData): void {
  const season = state["Thế Giới"]["Mùa"];
  const isWinter = season === "Đông";
  const markets = state["Thị Trường Khu Vực"];
  if (!markets) return;

  for (const regionId of Object.keys(REGIONS_BY_ID)) {
    if (!markets[regionId]) {
      markets[regionId] = { 
        "Hệ Số Giá": {
          "Gỗ": 1, "Đá": 1, "Quặng Sắt": 1, "Lương Thực": 1, "Ngựa": 1, "Thép Valyria": 1
        },
        "Đang Có Thương Nhân": false, 
        "Tin Đồn": "Thị trường ổn định." 
      };
    }
    const m = markets[regionId];

    // Base multipliers
    let woodMult = 1, stoneMult = 1, ironMult = 1, foodMult = 1, horseMult = 1;

    switch (regionId) {
      case "the_north": woodMult = 0.7; foodMult = 1.2; break;
      case "the_reach": foodMult = 0.6; break;
      case "dorne": foodMult = 1.5; horseMult = 0.8; woodMult = 1.3; break;
      case "the_westerlands": ironMult = 0.7; foodMult = 1.1; break;
      case "the_vale": stoneMult = 0.8; foodMult = 1.1; break;
      case "the_stormlands": woodMult = 0.8; break;
      case "iron_islands": ironMult = 0.8; foodMult = 1.5; woodMult = 1.5; break;
    }

    if (isWinter) {
      foodMult += 1.5;
      woodMult += 0.5;
    }

    // Crises impact
    const territory = state["Lãnh Địa"][regionId];
    if (territory && territory["Khủng Hoảng"]) {
      for (const crisis of territory["Khủng Hoảng"]) {
        if (crisis["Loại"] === "Nạn Đói") foodMult += 2.0;
        if (crisis["Loại"] === "Cướp Bóc" || crisis["Loại"] === "Nổi Loạn") { ironMult += 0.8; foodMult += 0.5; horseMult += 0.5; }
        if (crisis["Loại"] === "Dịch Bệnh") { foodMult -= 0.2; }
      }
    }

    m["Hệ Số Giá"]["Lương Thực"] = foodMult * (0.9 + Math.random() * 0.2);
    m["Hệ Số Giá"]["Gỗ"] = woodMult * (0.9 + Math.random() * 0.2);
    m["Hệ Số Giá"]["Đá"] = stoneMult * (0.9 + Math.random() * 0.2);
    m["Hệ Số Giá"]["Quặng Sắt"] = ironMult * (0.9 + Math.random() * 0.2);
    m["Hệ Số Giá"]["Ngựa"] = horseMult * (0.9 + Math.random() * 0.2);
    m["Hệ Số Giá"]["Thép Valyria"] = 1.0;

    if (!m["Đang Có Thương Nhân"]) {
      if (Math.random() < 0.1) {
        m["Đang Có Thương Nhân"] = true;
        m["Tin Đồn"] = "Một thương đoàn ngoại quốc đang ghé thăm vùng này.";
      } else {
        m["Tin Đồn"] = "Thị trường địa phương hoạt động bình thường.";
      }
    } else {
      if (Math.random() < 0.2) {
        m["Đang Có Thương Nhân"] = false;
        m["Tin Đồn"] = "Thương đoàn đã nhổ neo rời đi.";
      }
    }
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

  // 1.5 thị trường
  tickMarket(state);

  // 2. thuế
  const taxGold = tickTax(state, coinMult);

  // 3. Iron Bank
  const interest = tickIronBank(state);

  // 3.5 Các khoản cho vay
  const loanIncome = tickLoans(state);

  // 3.8 Chi phí quân sự
  const playerHouse = state["Thông Tin Nhân Vật"]["Nhà"];
  let totalTroops = 0;
  for (const unit of Object.values(state["Biên Chế Quân Sự"] || {})) {
    if (unit["Nhà"] === playerHouse) {
      totalTroops += unit["Số Lượng"] || 0;
    }
  }
  const militaryUpkeep = totalTroops * 112;

  // 4. tổng vàng vào ngân khố thống nhất
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = Math.max(
    0,
    state["Thông Tin Nhân Vật"]["Ngân Khố"] + tradeProfit + taxGold + loanIncome - interest - militaryUpkeep,
  );

  // 4.5 micro-economy (NPC income)
  tickMicroEconomy(state);

  // 5. khủng hoảng
  tickCrises(state);
}

function tickMicroEconomy(state: StatData): void {
  const npcs = state["Mối Quan Hệ"]["NPC Chính"] || {};
  for (const id in npcs) {
    const npc = npcs[id];
    if (!npc) continue;
    // NPC gain some base pennies per turn (e.g. 560 pennies = 10 silver)
    let income = 560;
    // If they have a role, they gain more
    if (npc["Chức Vụ"] && npc["Chức Vụ"] !== "") {
      income += 2240; // ~40 silver
    }
    if (npc["Nhà"] && npc["Nhà"] !== "") {
      income += 1120; // ~20 silver if they belong to a noble house
    }
    npc["Ngân Khố"] = (npc["Ngân Khố"] || 0) + income;
  }
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
  microTaxIncome: number;
  macroTaxIncome: number;
  ironBankExpense: number;
  loanIncome: number;
  militaryUpkeep: number;
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
  
  // 1. Thuế vi mô (Lãnh Địa)
  let baseGold = 0;
  const playerName = state["Thông Tin Nhân Vật"]["Họ Tên"];
  const playerHouse = state["Thông Tin Nhân Vật"]["Nhà"];
  
  for (const territory of Object.values(state["Lãnh Địa"])) {
    if (territory["Người Kiểm Soát"] === playerName || territory["Nhà Kiểm Soát"] === playerHouse) {
      baseGold += Math.round(territory["Dân Số"] * 0.005);
    }
  }
  const microTaxIncome = Math.round(baseGold * effect.goldMultiplier * coinMult * EXCHANGE_RATES.GOLD_TO_COPPER);

  // 2. Thuế vĩ mô (Chư hầu)
  let macroGold = 0;
  const canTaxAll = hasPrivilege(state, "Thu Thuế Toàn Cõi");
  const canTaxMacro = canTaxAll || hasPrivilege(state, "Thu Thuế Chư Hầu (Vùng)");
  
  if (canTaxMacro) {
    for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
      if (canTaxAll || sov["Là Của Người Chơi"]) {
        const regionInfo = REGIONS_BY_ID[regionId];
        if (regionInfo) {
          macroGold += Math.round(regionInfo.population * 200);
        }
      }
    }
  }
  const macroTaxIncome = Math.round(macroGold * effect.goldMultiplier * coinMult * EXCHANGE_RATES.GOLD_TO_COPPER);
  const taxIncome = microTaxIncome + macroTaxIncome;

  const ironBankExpense = state["Các Khoản Nợ"]?.["Iron Bank"]?.["Lãi/Turn"] ?? 0;

  let loanIncome = 0;
  const loans = state["Các Khoản Cho Vay"];
  if (loans) {
    for (const loan of Object.values(loans)) {
      if (!loan["Đang Quỵt"] && (loan["Turn Còn Lại"] > 0 || loan["Nợ Gốc"] > 0)) {
        loanIncome += loan["Lãi/Turn"];
      }
    }
  }

  // 3. Chi phí quân sự (Lương lính)
  let totalTroops = 0;
  for (const unit of Object.values(state["Biên Chế Quân Sự"] || {})) {
    if (unit["Nhà"] === playerHouse) {
      totalTroops += unit["Số Lượng"] || 0;
    }
  }
  // Mặc định: 112 Đồng Đỏ cho mỗi lính mỗi tháng
  const militaryUpkeep = totalTroops * 112;

  return {
    tradeIncome,
    taxIncome,
    microTaxIncome,
    macroTaxIncome,
    ironBankExpense,
    loanIncome,
    militaryUpkeep,
    net: tradeIncome + taxIncome + loanIncome - ironBankExpense - militaryUpkeep,
  };
}

/** Số turn trước khi cạn ngân khố (−1 nếu đang lời hoặc 0 Vàng). */
export function turnsUntilBankrupt(state: StatData): number {
  const { net } = estimateNetIncome(state);
  if (net >= 0) return -1;
  const gold = state["Thông Tin Nhân Vật"]["Ngân Khố"];
  if (gold <= 0) return 0;
  return Math.ceil(gold / Math.abs(net));
}

/** Có đang nợ Iron Bank hay không. */
export function isInDebt(state: StatData): boolean {
  const bank = state["Các Khoản Nợ"]?.["Iron Bank"];
  if (!bank) return false;
  return bank["Nợ Gốc"] > 0 || bank["Đang Quỵt"];
}
