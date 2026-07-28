/**
 * ironBank (15.3) — vay/trả/quỵt Iron Bank of Braavos.
 * "The Iron Bank will have its due" — quỵt nợ → Iron Bank tài trợ kẻ thù.
 * Trả PatchOp[] cho engine áp.
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";

/** Lãi suất mặc định: 5% gốc mỗi THÁNG. */
const DEFAULT_INTEREST_RATE = 0.05;
/** Kỳ hạn mặc định: 24 tháng (2 năm truyện). */
const DEFAULT_TERM_MONTHS = 24;

export interface BorrowResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

/**
 * Vay từ Iron Bank. Nhận Vàng ngay, trả lãi mỗi tháng, trả gốc khi hết hạn.
 * Chỉ vay được khi chưa nợ hoặc đã trả hết nợ trước.
 */
export function borrowFromIronBank(
  state: StatData,
  amount: number,
  interestRate = DEFAULT_INTEREST_RATE,
  termMonths = DEFAULT_TERM_MONTHS,
): BorrowResult {
  if (amount <= 0) return { ok: false, error: "Số tiền vay phải > 0", ops: [] };
  const bankDebt = state["Các Khoản Nợ"]["Iron Bank"];
  if (bankDebt && bankDebt["Nợ Gốc"] > 0) {
    return { ok: false, error: "Phải trả hết nợ cũ trước khi vay tiếp", ops: [] };
  }
  if (bankDebt && bankDebt["Đang Quỵt"]) {
    return { ok: false, error: "Iron Bank từ chối — ngươi đã quỵt nợ trước đó", ops: [] };
  }

  const interestPerMonth = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: amount },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank", value: {
        "Nợ Gốc": amount,
        "Lãi/Tháng": interestPerMonth,
        "Tháng Còn Lại": termMonths,
        "Đang Quỵt": false,
      }},
    ],
  };
}

/** Trả nợ Iron Bank sớm (toàn bộ gốc + lãi còn lại). */
export function repayIronBank(state: StatData): BorrowResult {
  const bank = state["Các Khoản Nợ"]["Iron Bank"];
  if (!bank || bank["Nợ Gốc"] <= 0) return { ok: false, error: "Không có nợ để trả", ops: [] };
  if (bank["Đang Quỵt"]) return { ok: false, error: "Đã quỵt nợ — không thể trả lại", ops: [] };

  const totalOwed = bank["Nợ Gốc"] + bank["Lãi/Tháng"] * Math.min(5, bank["Tháng Còn Lại"]); // phạt lãi 5 tháng sớm
  if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < totalOwed) {
    return { ok: false, error: `Cần ${totalOwed} Ngân Khố để trả nợ (gốc + phạt lãi sớm)`, ops: [] };
  }

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -totalOwed },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank", value: {
        "Nợ Gốc": 0,
        "Lãi/Tháng": 0,
        "Tháng Còn Lại": 0,
        "Đang Quỵt": false,
      }},
    ],
  };
}

/**
 * Chủ động quỵt nợ. Flag "Đang Quỵt" → Iron Bank tài trợ kẻ thù
 * (AI tường thuật hậu quả; có thể tăng War Score cho địch).
 */
export function defaultOnDebt(state: StatData): BorrowResult {
  const bank = state["Các Khoản Nợ"]["Iron Bank"];
  if (!bank || bank["Nợ Gốc"] <= 0) return { ok: false, error: "Không có nợ để quỵt", ops: [] };

  return {
    ok: true,
    ops: [
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank.Đang Quỵt", value: true },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank.Lãi/Tháng", value: 0 },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank.Tháng Còn Lại", value: 0 },
    ],
  };
}

// ── MỞ RỘNG (Giai đoạn 2): Đa Chủ Nợ / Cho Vay ────────────────────────────────

export function borrowMoney(
  state: StatData,
  creditorId: string,
  amount: number,
  interestRate = 0.05,
  termMonths = DEFAULT_TERM_MONTHS
): BorrowResult {
  if (amount <= 0) return { ok: false, error: "Số tiền vay phải > 0", ops: [] };
  const existingDebt = state["Các Khoản Nợ"][creditorId];
  if (existingDebt && existingDebt["Nợ Gốc"] > 0) {
    return { ok: false, error: "Phải trả hết nợ cũ cho chủ nợ này trước khi vay tiếp", ops: [] };
  }
  if (existingDebt && existingDebt["Đang Quỵt"]) {
    return { ok: false, error: "Chủ nợ từ chối — bạn đã quỵt nợ trước đó", ops: [] };
  }

  const interestPerMonth = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: amount },
      { op: "replace", path: `stat_data.Các Khoản Nợ.${creditorId}`, value: {
        "Nợ Gốc": amount,
        "Lãi/Tháng": interestPerMonth,
        "Tháng Còn Lại": termMonths,
        "Đang Quỵt": false,
      }},
    ],
  };
}

export function lendMoney(
  state: StatData,
  debtorId: string,
  amount: number,
  termMonths = DEFAULT_TERM_MONTHS
): BorrowResult {
  if (amount <= 0) return { ok: false, error: "Số tiền cho vay phải > 0", ops: [] };
  if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < amount) {
    return { ok: false, error: "Không đủ Ngân Khố để cho vay", ops: [] };
  }

  // Calculate dynamic interest rate based on debtor's region crises
  // Actually, we only have house IDs here. Let's find the region of this house if possible.
  // We can just look at their primary holding in "Lãnh Địa".
  let hasCrisis = false;
  for (const territory of Object.values(state["Lãnh Địa"] || {})) {
    if (territory["Nhà Kiểm Soát"] === debtorId && territory["Khủng Hoảng"] && territory["Khủng Hoảng"].length > 0) {
      hasCrisis = true;
      break;
    }
  }

  // Dynamic interest: 5% normally, 15% if in crisis
  const interestRate = hasCrisis ? 0.15 : 0.05;

  const interestPerMonth = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -amount },
      { op: "replace", path: `stat_data.Các Khoản Cho Vay.${debtorId}`, value: {
        "Nợ Gốc": amount,
        "Lãi/Tháng": interestPerMonth,
        "Tháng Còn Lại": termMonths,
        "Đang Quỵt": false,
      }},
    ],
  };
}
