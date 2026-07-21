/**
 * regionalResources (15.1) — tài nguyên/thiếu hụt đặc trưng từng vùng Westeros.
 * Dữ liệu tĩnh canon ASOIAF — nạp vào \"Kinh Tế Vùng\" lúc initvar (tương tự
 * seedRegionControl). Giá cả khởi điểm dùng BASELINE_PRICE; engine tính giá
 * động mỗi turn theo cung/cầu (economyEngine.ts).
 */

/** Hàng hoá giao dịch được. */
export const GOODS = [
  "Lương Thực", "Gỗ", "Đá", "Quặng Sắt", "Rượu",
  "Gia Vị", "Lông Thú", "Vải", "Muối", "Cá",
] as const;
export type Good = (typeof GOODS)[number];

/** Giá nền 1 đơn vị hàng (Vàng). Vùng dư giảm, vùng thiếu tăng. */
export const BASELINE_PRICE: Record<Good, number> = {
  "Lương Thực": 8,
  "Gỗ": 12,
  "Đá": 10,
  "Quặng Sắt": 18,
  "Rượu": 22,
  "Gia Vị": 30,
  "Lông Thú": 25,
  "Vải": 15,
  "Muối": 14,
  "Cá": 9,
};

export interface RegionalResourceDef {
  surplus: Good[];   // sản vật dư → giá thấp
  deficit: Good[];   // thiếu hụt → giá cao
}

/**
 * 9 vùng canon ASOIAF — surplus/deficit lấy từ lore:
 * - The Reach: vựa lúa lớn nhất, rượu Arbor nổi tiếng
 * - The North: gỗ, lông thú dồi dào; thiếu lương mùa đông
 * - Westerlands: vàng Casterly Rock, quặng sắt; thiếu lương
 * - Dorne: rượu Dornish, gia vị; thiếu gỗ
 * - Iron Islands: sắt; thiếu gần như mọi thứ
 * - Stormlands: gỗ, đá; thiếu gia vị
 * - Riverlands: lương thực, cá; thiếu quặng
 * - The Vale: đá, quặng; thiếu gia vị
 * - Crownlands: trung tâm thương mại; thiếu nguyên liệu
 */
export const REGION_RESOURCES: Record<string, RegionalResourceDef> = {
  "the-north": {
    surplus: ["Gỗ", "Lông Thú"],
    deficit: ["Lương Thực", "Rượu", "Gia Vị"],
  },
  "the-iron-islands": {
    surplus: ["Quặng Sắt"],
    deficit: ["Lương Thực", "Gỗ", "Vải"],
  },
  "the-vale": {
    surplus: ["Đá", "Quặng Sắt"],
    deficit: ["Gia Vị", "Rượu"],
  },
  "the-riverlands": {
    surplus: ["Lương Thực", "Cá"],
    deficit: ["Quặng Sắt", "Lông Thú"],
  },
  "the-westerlands": {
    surplus: ["Quặng Sắt"],
    deficit: ["Lương Thực", "Gỗ"],
  },
  "the-crownlands": {
    surplus: ["Vải"],
    deficit: ["Gỗ", "Quặng Sắt", "Lông Thú"],
  },
  "the-reach": {
    surplus: ["Lương Thực", "Rượu", "Vải"],
    deficit: ["Quặng Sắt", "Lông Thú"],
  },
  "the-stormlands": {
    surplus: ["Gỗ", "Đá"],
    deficit: ["Gia Vị", "Rượu"],
  },
  "dorne": {
    surplus: ["Rượu", "Gia Vị", "Muối"],
    deficit: ["Gỗ", "Lông Thú"],
  },
};

/** Hệ số giá: surplus giảm 40%, deficit tăng 60%. */
export const SURPLUS_MODIFIER = 0.6;
export const DEFICIT_MODIFIER = 1.6;

/** Tính giá 1 hàng tại 1 vùng dựa vào surplus/deficit. */
export function regionPrice(regionId: string, good: Good): number {
  const base = BASELINE_PRICE[good] ?? 10;
  const res = REGION_RESOURCES[regionId];
  if (!res) return base;
  if (res.surplus.includes(good)) return Math.round(base * SURPLUS_MODIFIER);
  if (res.deficit.includes(good)) return Math.round(base * DEFICIT_MODIFIER);
  return base;
}

/** Tạo bảng giá đầy đủ cho 1 vùng. */
export function fullPriceTable(regionId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of GOODS) out[g] = regionPrice(regionId, g);
  return out;
}

/**
 * Tạo dữ liệu Kinh Tế Vùng cho toàn bộ 9 vùng — nạp vào state lúc initvar.
 * Trả Record<regionId, { Sản Vật Chủ Lực, Thiếu Hụt, Giá Cả }>.
 */
export function seedRegionalEconomy(): Record<string, {
  "Sản Vật Chủ Lực": string[];
  "Thiếu Hụt": string[];
  "Giá Cả": Record<string, number>;
}> {
  const out: Record<string, {
    "Sản Vật Chủ Lực": string[];
    "Thiếu Hụt": string[];
    "Giá Cả": Record<string, number>;
  }> = {};

  for (const [regionId, res] of Object.entries(REGION_RESOURCES)) {
    out[regionId] = {
      "Sản Vật Chủ Lực": [...res.surplus],
      "Thiếu Hụt": [...res.deficit],
      "Giá Cả": fullPriceTable(regionId),
    };
  }
  return out;
}
