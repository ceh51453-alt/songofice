/**
 * currency.ts — Xử lý tỷ giá và hiển thị tiền tệ
 * Chuẩn: 1 Rồng Vàng = 210 Hươu Bạc = 11,760 Đồng Đỏ.
 * (1 Hươu Bạc = 56 Đồng Đỏ)
 */

export const EXCHANGE_RATES = {
  GOLD_TO_COPPER: 11760,
  SILVER_TO_COPPER: 56,
  GOLD_TO_SILVER: 210,
};

export interface CurrencyBreakdown {
  gold: number;
  silver: number;
  copper: number;
}

/** Chuyển đổi từ số lượng Đồng Đỏ sang dạng Rồng Vàng / Hươu Bạc / Đồng Đỏ */
export function breakDownPennies(pennies: number): CurrencyBreakdown {
  const isNegative = pennies < 0;
  const absPennies = Math.abs(pennies);
  
  const gold = Math.floor(absPennies / EXCHANGE_RATES.GOLD_TO_COPPER);
  const remainderAfterGold = absPennies % EXCHANGE_RATES.GOLD_TO_COPPER;
  const silver = Math.floor(remainderAfterGold / EXCHANGE_RATES.SILVER_TO_COPPER);
  const copper = remainderAfterGold % EXCHANGE_RATES.SILVER_TO_COPPER;

  return {
    gold: isNegative ? -gold : gold,
    silver: isNegative && gold === 0 ? -silver : silver,
    copper: isNegative && gold === 0 && silver === 0 ? -copper : copper,
  };
}

/** 
 * Hiển thị dạng ngắn (VD: 10 Vàng 12 Bạc) 
 * Chỉ hiển thị 2 đơn vị lớn nhất có giá trị khác 0.
 */
export function formatCurrencyShort(pennies: number): string {
  if (pennies === 0) return "0 Đồng";
  
  const { gold, silver, copper } = breakDownPennies(pennies);
  const parts: string[] = [];
  
  const isNegative = pennies < 0;
  
  if (Math.abs(gold) > 0) parts.push(`${Math.abs(gold)} Rồng`);
  if (Math.abs(silver) > 0) parts.push(`${Math.abs(silver)} Bạc`);
  if (Math.abs(copper) > 0) parts.push(`${Math.abs(copper)} Đồng`);

  // Lấy tối đa 2 đơn vị lớn nhất để tránh quá dài trong UI
  const result = parts.slice(0, 2).join(" ");
  return isNegative ? `-${result}` : result;
}

/**
 * Hiển thị dạng đầy đủ (VD: 10 Rồng Vàng, 12 Hươu Bạc, 5 Đồng Đỏ)
 */
export function formatCurrencyFull(pennies: number): string {
  if (pennies === 0) return "0 Đồng Đỏ";
  
  const { gold, silver, copper } = breakDownPennies(pennies);
  const parts: string[] = [];
  
  const isNegative = pennies < 0;
  
  if (Math.abs(gold) > 0) parts.push(`${Math.abs(gold)} Rồng Vàng`);
  if (Math.abs(silver) > 0) parts.push(`${Math.abs(silver)} Hươu Bạc`);
  if (Math.abs(copper) > 0) parts.push(`${Math.abs(copper)} Đồng Đỏ`);

  const result = parts.join(", ");
  return isNegative ? `-${result}` : result;
}
