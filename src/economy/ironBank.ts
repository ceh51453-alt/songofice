/**
 * ironBank (15.3) — vay/trả/quỵt Iron Bank of Braavos.
 * "The Iron Bank will have its due" — quỵt nợ → Iron Bank tài trợ kẻ thù.
 * Trả PatchOp[] cho engine áp.
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";

/** Lãi suất mặc định: 5% gốc mỗi turn. */
const DEFAULT_INTEREST_RATE = 0.05;
const DEFAULT_TERM_TURNS = 60; // ~2 tháng truyện

export interface BorrowResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

/**
 * Vay từ Iron Bank. Nhận Vàng ngay, trả lãi mỗi turn, trả gốc khi hết hạn.
 * Chỉ vay được khi chưa nợ hoặc đã trả hết nợ trước.
 */
export function borrowFromIronBank(
  state: StatData,
  amount: number,
  interestRate = DEFAULT_INTEREST_RATE,
  termTurns = DEFAULT_TERM_TURNS,
): BorrowResult {
  if (amount <= 0) return { ok: false, error: "Số tiền vay phải > 0", ops: [] };
  const bankDebt = state["Các Khoản Nợ"]["Iron Bank"];
  if (bankDebt && bankDebt["Nợ Gốc"] > 0) {
    return { ok: false, error: "Phải trả hết nợ cũ trước khi vay tiếp", ops: [] };
  }
  if (bankDebt && bankDebt["Đang Quỵt"]) {
    return { ok: false, error: "Iron Bank từ chối — ngươi đã quỵt nợ trước đó", ops: [] };
  }

  const interestPerTurn = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: amount },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank", value: {
        "Nợ Gốc": amount,
        "Lãi/Turn": interestPerTurn,
        "Turn Còn Lại": termTurns,
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

  const totalOwed = bank["Nợ Gốc"] + bank["Lãi/Turn"] * Math.min(5, bank["Turn Còn Lại"]); // phạt lãi 5 turn sớm
  if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < totalOwed) {
    return { ok: false, error: `Cần ${totalOwed} Ngân Khố để trả nợ (gốc + phạt lãi sớm)`, ops: [] };
  }

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -totalOwed },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank", value: {
        "Nợ Gốc": 0,
        "Lãi/Turn": 0,
        "Turn Còn Lại": 0,
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
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank.Lãi/Turn", value: 0 },
      { op: "replace", path: "stat_data.Các Khoản Nợ.Iron Bank.Turn Còn Lại", value: 0 },
    ],
  };
}

// ── MỞ RỘNG (Giai đoạn 2): Đa Chủ Nợ / Cho Vay ────────────────────────────────

export function borrowMoney(
  state: StatData,
  creditorId: string,
  amount: number,
  interestRate = 0.05,
  termTurns = 60
): BorrowResult {
  if (amount <= 0) return { ok: false, error: "Số tiền vay phải > 0", ops: [] };
  const existingDebt = state["Các Khoản Nợ"][creditorId];
  if (existingDebt && existingDebt["Nợ Gốc"] > 0) {
    return { ok: false, error: "Phải trả hết nợ cũ cho chủ nợ này trước khi vay tiếp", ops: [] };
  }
  if (existingDebt && existingDebt["Đang Quỵt"]) {
    return { ok: false, error: "Chủ nợ từ chối — bạn đã quỵt nợ trước đó", ops: [] };
  }

  const interestPerTurn = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: amount },
      { op: "replace", path: `stat_data.Các Khoản Nợ.${creditorId}`, value: {
        "Nợ Gốc": amount,
        "Lãi/Turn": interestPerTurn,
        "Turn Còn Lại": termTurns,
        "Đang Quỵt": false,
      }},
    ],
  };
}

export function lendMoney(
  state: StatData,
  debtorId: string,
  amount: number,
  termTurns = 60
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

  const interestPerTurn = Math.max(1, Math.round(amount * interestRate));

  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -amount },
      { op: "replace", path: `stat_data.Các Khoản Cho Vay.${debtorId}`, value: {
        "Nợ Gốc": amount,
        "Lãi/Turn": interestPerTurn,
        "Turn Còn Lại": termTurns,
        "Đang Quỵt": false,
      }},
    ],
  };
}
