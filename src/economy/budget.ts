/**
 * budget — SỔ THU CHI HẰNG THÁNG (M18).
 *
 * Trước đây ngân khố chỉ có bốn dòng: thuế, thương mại, lãi nợ, lương lính.
 * Một lãnh chúa thật thì tiền chảy đi nhiều ngả hơn thế nhiều — và người chơi
 * phải NHÌN THẤY từng ngả, vì đó mới là chỗ để ra quyết định.
 *
 * File này là NGUỒN CHÂN LÝ DUY NHẤT của dòng tiền cấp lãnh thổ: cả engine
 * (economyEngine.tickEconomy) lẫn giao diện (EconomyPanel) đều đọc đúng bảng
 * này, nên con số hiện trên màn hình luôn bằng con số bị trừ thật.
 *
 * Sổ lãnh địa (sản lượng công trình, vật tư, quân lương) nằm ở
 * territory/construction.ts — hai bên không giẫm chân nhau.
 */
import type { StatData } from "../mvu/schema";
import { EXCHANGE_RATES } from "./currency";
import { commonerTax, vassalLevy, liegeDue, type TaxLine } from "./taxation";
import { isBlockaded } from "./blockade";
import { wallUpkeep } from "../territory/walls";
import { buildingLedgers } from "../territory/construction";
import { treasuryMultiplier } from "../strategy/court";
import { troopWage, unitMonthlyWage } from "./wages";

export { troopWage };

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

export type LedgerKind = "income" | "expense";

export interface LedgerLine {
  id: string;
  label: string;
  kind: LedgerKind;
  /** luôn DƯƠNG — dấu nằm ở `kind`. Đơn vị: Đồng Đỏ. */
  amount: number;
  detail: string;
  /** nhóm để UI gộp lại cho dễ đọc. */
  group: "Thuế Khoá" | "Thương Mại" | "Quân Sự" | "Hạ Tầng" | "Triều Chính" | "Tín Dụng";
}

export interface Budget {
  lines: LedgerLine[];
  income: number;
  expense: number;
  net: number;
  /** số tháng nữa thì cạn ngân khố (−1 = đang có lãi). */
  monthsLeft: number;
}

// ── Quân sự ─────────────────────────────────────────────────────────────────

function militaryLines(state: StatData): LedgerLine[] {
  const house = state["Thông Tin Nhân Vật"]["Nhà"];
  let wages = 0;
  let troops = 0;
  let training = 0;
  /** tách riêng khoản khế ước lính đánh thuê — người chơi phải thấy nó ngốn cỡ nào. */
  let sellswordWages = 0;
  let sellswords = 0;

  for (const u of Object.values(state["Biên Chế Quân Sự"] ?? {})) {
    if (house && u["Nhà"] && u["Nhà"] !== house) continue;
    const n = u["Số Lượng"] || 0;
    if (n <= 0) continue;
    const wage = unitMonthlyWage(u);
    if (u["Ngạch"] === "Đánh Thuê") {
      sellswords += n;
      sellswordWages += wage;
    } else {
      troops += n;
      wages += wage;
    }
    // quân đang huấn luyện tốn thêm giáo cụ, thầy dạy, ngựa tập
    if ((u["Ngày Huấn Luyện"] || 0) > 0) training += n * 40;
  }

  let ships = 0;
  for (const f of Object.values(state["Hạm Đội"] ?? {})) {
    if (house && f["Nhà"] !== house) continue;
    ships += f["Số Chiến Thuyền"] || 0;
  }

  const out: LedgerLine[] = [];
  if (wages > 0) {
    out.push({
      id: "exp-wages", label: "Lương Binh Sĩ", kind: "expense", group: "Quân Sự",
      amount: Math.round(wages),
      detail: `${troops.toLocaleString("vi-VN")} quân thường trực`,
    });
  }
  if (sellswordWages > 0) {
    out.push({
      id: "exp-sellswords", label: "Khế Ước Đánh Thuê", kind: "expense", group: "Quân Sự",
      amount: Math.round(sellswordWages),
      detail: `${sellswords.toLocaleString("vi-VN")} lính đánh thuê · trễ lương là trở giáo`,
    });
  }
  if (training > 0) {
    out.push({
      id: "exp-training", label: "Phí Huấn Luyện", kind: "expense", group: "Quân Sự",
      amount: Math.round(training), detail: "giáo cụ, thầy dạy, ngựa tập cho tân binh",
    });
  }
  if (ships > 0) {
    out.push({
      id: "exp-fleet", label: "Bảo Dưỡng Hạm Đội", kind: "expense", group: "Quân Sự",
      amount: Math.round(ships * 18 * G),
      detail: `${ships} chiến thuyền · trám khe, thay buồm, nuôi thuỷ thủ`,
    });
  }
  return out;
}

// ── Hạ tầng ─────────────────────────────────────────────────────────────────

function ownHoldings(state: StatData): [string, StatData["Lãnh Địa"][string]][] {
  const name = state["Thông Tin Nhân Vật"]["Họ Tên"];
  const house = state["Thông Tin Nhân Vật"]["Nhà"];
  return Object.entries(state["Lãnh Địa"]).filter(([id, h]) =>
    h["Người Kiểm Soát"] === name
    || (!!house && h["Nhà Kiểm Soát"] === house)
    || state["Chủ Quyền Lãnh Thổ"][h["Thuộc Vùng"] || id]?.["Là Của Người Chơi"] === true);
}

function infrastructureLines(state: StatData): LedgerLine[] {
  let buildings = 0;
  let count = 0;
  let walls = 0;
  let wallCount = 0;

  for (const [id, h] of ownHoldings(state)) {
    for (const led of buildingLedgers(id, h)) {
      const up = led.upkeep["Ngân Khố"] ?? 0;
      if (up > 0) { buildings += up; count++; }
    }
    walls += wallUpkeep(h);
    wallCount += (h["Tường Thành"] ?? []).filter((w) => !w["Đang Xây"]).length;
  }

  const out: LedgerLine[] = [];
  if (buildings > 0) {
    out.push({
      id: "exp-buildings", label: "Bảo Trì Công Trình", kind: "expense", group: "Hạ Tầng",
      amount: Math.round(buildings),
      detail: `${count} công trình · lợp lại mái, thay dầm, trả công quản lý`,
    });
  }
  if (walls > 0) {
    out.push({
      id: "exp-walls", label: "Bảo Trì Tường & Đường", kind: "expense", group: "Hạ Tầng",
      amount: Math.round(walls),
      detail: `${wallCount} tuyến tường · vá vữa, sửa mặt đường, lính gác cổng`,
    });
  }
  return out;
}

// ── Triều chính ─────────────────────────────────────────────────────────────

/** Bậc tước vị → quy mô gia thần phải nuôi. */
const COURT_SCALE: Record<string, number> = {
  "Thường Dân": 0,
  "Hiệp Sĩ": 0.4,
  "Người Thừa Kế": 0.6,
  "Tiểu Thư": 0.6,
  "Lãnh Chúa Thành Trì": 1,
  "Lãnh Chúa": 1.6,
  "Đại Lãnh Chúa": 3.2,
  "Quốc Vương": 5,
  "Vua": 7,
  "Vua Bảy Vương Quốc": 9,
  "Hoàng Đế": 10,
};

function courtLines(state: StatData): LedgerLine[] {
  const title = state["Thông Tin Nhân Vật"]["Tước Vị"];
  const scale = COURT_SCALE[title] ?? 1;
  if (scale <= 0) return [];

  // số ghế trong triều đã bổ nhiệm — mỗi vị đại thần là một khoản bổng lộc
  const seats = state["Triều Đình"]?.["Tiểu Hội Đồng"] ?? {};
  const council = Object.values(seats).filter(
    (seat) => !!seat?.["Người Giữ Chức"] && seat["Người Giữ Chức"] !== "Khuyết",
  ).length;

  const household = Math.round((90 + council * 40) * scale * G / 10);
  const feast = Math.round(38 * scale * G / 10);
  const spies = Object.keys(state["Tình Báo"]?.["Điệp Viên"] ?? {}).length;

  const out: LedgerLine[] = [
    {
      id: "exp-household", label: "Bổng Lộc Gia Thần", kind: "expense", group: "Triều Chính",
      amount: household,
      detail: `${title} · học sĩ, quản gia, đội vệ binh${council > 0 ? `, ${council} đại thần` : ""}`,
    },
    {
      id: "exp-feast", label: "Yến Tiệc & Nghi Lễ", kind: "expense", group: "Triều Chính",
      amount: feast, detail: "tiếp khách, lễ tiết, quà cáp giữ thể diện dòng họ",
    },
  ];
  if (spies > 0) {
    out.push({
      id: "exp-spies", label: "Mật Vụ & Do Thám", kind: "expense", group: "Triều Chính",
      amount: Math.round(spies * 22 * G),
      detail: `${spies} đầu mối tình báo đang nuôi`,
    });
  }
  return out;
}

// ── Thương mại & tín dụng ───────────────────────────────────────────────────

function tradeLines(state: StatData): LedgerLine[] {
  let profit = 0;
  let blocked = 0;
  let active = 0;

  for (const route of Object.values(state["Tuyến Thương Mại"] ?? {})) {
    if (route["Đường"] === "Biển" && isBlockaded(state, route["Đến"])) { blocked++; continue; }
    const safety = route["An Toàn"];
    const effective = safety < 30 ? safety * 0.5 : safety;
    profit += route["Lợi Nhuận/Tháng"] * (effective / 100);
    active++;
  }

  const out: LedgerLine[] = [];
  if (profit > 0) {
    out.push({
      id: "inc-trade", label: "Lợi Nhuận Tuyến Buôn", kind: "income", group: "Thương Mại",
      amount: Math.round(profit),
      detail: `${active} tuyến đang chạy${blocked > 0 ? ` · ${blocked} tuyến bị phong toả` : ""}`,
    });
  }
  return out;
}

function creditLines(state: StatData): LedgerLine[] {
  const out: LedgerLine[] = [];

  for (const [creditor, debt] of Object.entries(state["Các Khoản Nợ"] ?? {})) {
    if (!debt || debt["Đang Quỵt"]) continue;
    if ((debt["Lãi/Tháng"] ?? 0) <= 0) continue;
    out.push({
      id: `exp-debt-${creditor}`, label: `Lãi Nợ ${creditor}`, kind: "expense", group: "Tín Dụng",
      amount: Math.round(debt["Lãi/Tháng"]),
      detail: `gốc ${Math.round((debt["Nợ Gốc"] ?? 0) / G).toLocaleString("vi-VN")} Rồng Vàng · còn ${debt["Tháng Còn Lại"]} tháng`,
    });
  }

  let lending = 0;
  let debtors = 0;
  for (const loan of Object.values(state["Các Khoản Cho Vay"] ?? {})) {
    if (!loan || loan["Đang Quỵt"]) continue;
    if (loan["Nợ Gốc"] <= 0 && loan["Tháng Còn Lại"] <= 0) continue;
    lending += loan["Lãi/Tháng"] ?? 0;
    debtors++;
  }
  if (lending > 0) {
    out.push({
      id: "inc-lending", label: "Lãi Cho Vay", kind: "income", group: "Tín Dụng",
      amount: Math.round(lending), detail: `${debtors} con nợ đang trả lãi đều`,
    });
  }
  return out;
}

// ── Sản lượng lãnh địa quy ra tiền ──────────────────────────────────────────

function holdingGoldLines(state: StatData): LedgerLine[] {
  let gold = 0;
  let shops = 0;
  // đọc SỔ SẢN XUẤT thật (đã nhân nhân lực, trữ lượng mạch, đủ/thiếu nguyên
  // liệu) chứ không nhân bừa Cấp Độ — con số ở đây bằng đúng cái vào kho.
  for (const [id, h] of ownHoldings(state)) {
    for (const led of buildingLedgers(id, h)) {
      const y = led.produce["Ngân Khố"] ?? 0;
      if (y > 0) { gold += y; shops++; }
    }
  }
  if (gold <= 0) return [];
  return [{
    id: "inc-holdings", label: "Thu Từ Công Trình", kind: "income", group: "Thương Mại",
    amount: Math.round(gold),
    detail: `${shops} công trình sinh lợi · đã tính theo nhân lực thực có`,
  }];
}

// ── Tổng hợp ────────────────────────────────────────────────────────────────

/**
 * SỔ THU CHI đầy đủ của tháng này. Thứ tự tính có ý nghĩa: cống nạp bề trên là
 * phần trăm của TỔNG THU, nên phải cộng hết các khoản thu trước rồi mới tính.
 */
export function monthlyBudget(state: StatData): Budget {
  const coinMult = treasuryMultiplier(state);
  const lines: LedgerLine[] = [];

  const taxToLine = (l: TaxLine, group: LedgerLine["group"]): LedgerLine => ({
    id: l.id, label: l.label, kind: "income", group,
    amount: Math.round(l.amount * coinMult), detail: l.detail,
  });

  for (const l of commonerTax(state)) lines.push(taxToLine(l, "Thuế Khoá"));
  for (const l of vassalLevy(state)) lines.push(taxToLine(l, "Thuế Khoá"));
  lines.push(...holdingGoldLines(state));
  lines.push(...tradeLines(state));
  lines.push(...creditLines(state).filter((l) => l.kind === "income"));

  const grossIncome = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);

  const due = liegeDue(state, grossIncome);
  if (due) {
    lines.push({
      id: due.id, label: due.label, kind: "expense", group: "Thuế Khoá",
      amount: due.amount, detail: due.detail,
    });
  }
  lines.push(...militaryLines(state));
  lines.push(...infrastructureLines(state));
  lines.push(...courtLines(state));
  lines.push(...creditLines(state).filter((l) => l.kind === "expense"));

  const income = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
  const expense = lines.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount, 0);
  const net = income - expense;
  const treasury = state["Thông Tin Nhân Vật"]["Ngân Khố"];

  return {
    lines, income, expense, net,
    monthsLeft: net >= 0 ? -1 : treasury <= 0 ? 0 : Math.ceil(treasury / Math.abs(net)),
  };
}

/** Gộp theo nhóm cho UI hiển thị. */
export function budgetByGroup(budget: Budget): Record<string, LedgerLine[]> {
  const out: Record<string, LedgerLine[]> = {};
  for (const l of budget.lines) {
    (out[l.group] ??= []).push(l);
  }
  return out;
}
