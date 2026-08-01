/**
 * regionalResources (15.1) — tài nguyên/thiếu hụt đặc trưng của thế giới đã biết.
 * Dữ liệu tĩnh canon ASOIAF — nạp vào \"Kinh Tế Vùng\" lúc initvar (tương tự
 * seedRegionControl). Giá cả khởi điểm dùng BASELINE_PRICE; engine tính giá
 * động mỗi turn theo cung/cầu (economyEngine.ts).
 */
import { REGIONS } from "../world/geography";

type WorldRegion = (typeof REGIONS)[number];

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
 * Hồ sơ có chủ đích cho các vùng cũ và các chính thể lớn. Resolver bên dưới còn
 * tra parentId/realmId, vì thế một macro/chính thể có thể cấp hồ sơ cho mọi tỉnh
 * con mà không phải sao chép hàng chục object giống nhau.
 *
 * 9 vùng Westeros cũ giữ nguyên đặc trưng để save và cân bằng kinh tế cũ không
 * đột ngột đổi giá:
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
export const RESOURCE_PROFILE_OVERRIDES: Record<string, RegionalResourceDef> = {
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
  // Thành Phố Tự Do và các chính thể Essos lớn.
  braavos: { surplus: ["Cá", "Vải"], deficit: ["Lương Thực", "Gỗ"] },
  pentos: { surplus: ["Rượu", "Vải"], deficit: ["Quặng Sắt", "Lông Thú"] },
  myr: { surplus: ["Vải", "Gia Vị"], deficit: ["Gỗ", "Lông Thú"] },
  tyrosh: { surplus: ["Gia Vị", "Rượu"], deficit: ["Lương Thực", "Gỗ"] },
  lys: { surplus: ["Rượu", "Gia Vị"], deficit: ["Quặng Sắt", "Lông Thú"] },
  volantis: { surplus: ["Lương Thực", "Gia Vị", "Vải"], deficit: ["Lông Thú"] },
  lorath: { surplus: ["Cá", "Muối"], deficit: ["Lương Thực", "Rượu"] },
  norvos: { surplus: ["Gỗ", "Lông Thú"], deficit: ["Cá", "Gia Vị"] },
  qohor: { surplus: ["Gỗ", "Quặng Sắt"], deficit: ["Cá", "Muối"] },
  dothraki: { surplus: ["Lông Thú"], deficit: ["Vải", "Rượu", "Cá"] },
  sarnor: { surplus: ["Lương Thực", "Gỗ"], deficit: ["Muối", "Gia Vị"] },
  saath: { surplus: ["Lương Thực", "Gỗ"], deficit: ["Muối", "Gia Vị"] },
  astapor: { surplus: ["Gia Vị", "Muối"], deficit: ["Gỗ", "Lương Thực"] },
  yunkai: { surplus: ["Gia Vị", "Vải"], deficit: ["Gỗ", "Lông Thú"] },
  meereen: { surplus: ["Lương Thực", "Gia Vị"], deficit: ["Gỗ", "Lông Thú"] },
  "new-ghis": { surplus: ["Muối", "Gia Vị"], deficit: ["Gỗ", "Lông Thú"] },
  qarth: { surplus: ["Gia Vị", "Vải"], deficit: ["Gỗ", "Lương Thực"] },
  lhazar: { surplus: ["Lương Thực", "Lông Thú"], deficit: ["Quặng Sắt", "Muối"] },
  "yi-ti": { surplus: ["Gia Vị", "Vải", "Lương Thực"], deficit: ["Lông Thú"] },
  "jogos-nhai": { surplus: ["Lông Thú"], deficit: ["Vải", "Rượu", "Cá"] },
  asshai: { surplus: ["Gia Vị", "Quặng Sắt"], deficit: ["Lương Thực", "Gỗ"] },
  ibben: { surplus: ["Cá", "Lông Thú"], deficit: ["Gia Vị", "Rượu"] },
  "summer-islands": { surplus: ["Gia Vị", "Gỗ", "Rượu"], deficit: ["Quặng Sắt", "Lông Thú"] },
  naath: { surplus: ["Gia Vị", "Vải"], deficit: ["Quặng Sắt", "Lông Thú"] },
  "basilisk-isles": { surplus: ["Gia Vị", "Gỗ"], deficit: ["Lương Thực", "Vải"] },
  gogossos: { surplus: ["Gia Vị", "Gỗ"], deficit: ["Lương Thực", "Vải"] },
};

const CONTINENT_DEFAULTS: Record<string, RegionalResourceDef> = {
  westeros: { surplus: ["Lương Thực", "Gỗ"], deficit: ["Gia Vị"] },
  essos: { surplus: ["Gia Vị", "Vải"], deficit: ["Lông Thú"] },
  ibben: { surplus: ["Cá", "Lông Thú"], deficit: ["Gia Vị", "Rượu"] },
  "summer-isles": { surplus: ["Gia Vị", "Gỗ", "Rượu"], deficit: ["Quặng Sắt", "Lông Thú"] },
  sothoryos: { surplus: ["Gia Vị", "Gỗ"], deficit: ["Lương Thực", "Vải"] },
  ulthos: { surplus: ["Gia Vị", "Gỗ"], deficit: ["Lương Thực", "Quặng Sắt"] },
  islands: { surplus: ["Cá", "Muối"], deficit: ["Quặng Sắt"] },
};

const FALLBACK_PROFILES: RegionalResourceDef[] = [
  { surplus: ["Lương Thực", "Gỗ"], deficit: ["Gia Vị", "Muối"] },
  { surplus: ["Cá", "Muối"], deficit: ["Quặng Sắt", "Lông Thú"] },
  { surplus: ["Gỗ", "Lông Thú"], deficit: ["Rượu", "Gia Vị"] },
  { surplus: ["Đá", "Quặng Sắt"], deficit: ["Lương Thực", "Vải"] },
  { surplus: ["Rượu", "Gia Vị"], deficit: ["Gỗ", "Lông Thú"] },
  { surplus: ["Vải", "Lương Thực"], deficit: ["Đá", "Quặng Sắt"] },
];

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function cloned(profile: RegionalResourceDef): RegionalResourceDef {
  return { surplus: [...profile.surplus], deficit: [...profile.deficit] };
}

/** Hồ sơ đầy đủ cho một leaf: id → parent → realm → continent → fallback ổn định. */
export function regionalResourceFor(region: WorldRegion): RegionalResourceDef {
  for (const key of [region.id, region.parentId, region.realmId]) {
    if (key && RESOURCE_PROFILE_OVERRIDES[key]) return cloned(RESOURCE_PROFILE_OVERRIDES[key]);
  }

  const terrain = String(region.terrain);
  if (terrain.includes("Tuyết") || terrain.includes("Băng")) {
    return { surplus: ["Gỗ", "Lông Thú"], deficit: ["Lương Thực", "Rượu", "Gia Vị"] };
  }
  if (terrain.includes("Sa Mạc")) {
    return { surplus: ["Gia Vị", "Muối"], deficit: ["Lương Thực", "Gỗ"] };
  }
  if (region.coastal) {
    const coastal = CONTINENT_DEFAULTS[region.continentId];
    if (coastal) {
      const profile = cloned(coastal);
      if (!profile.surplus.includes("Cá")) profile.surplus.push("Cá");
      return profile;
    }
  }
  const continent = CONTINENT_DEFAULTS[region.continentId];
  if (continent) return cloned(continent);
  return cloned(FALLBACK_PROFILES[stableHash(region.id) % FALLBACK_PROFILES.length]);
}

/** Mọi vùng lá có đúng một profile; không mang dân số nên không thể nhân đôi tổng dân. */
export const REGION_RESOURCES: Record<string, RegionalResourceDef> = Object.fromEntries(
  REGIONS.map((region) => [region.id, regionalResourceFor(region)]),
);

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
 * Tạo dữ liệu Kinh Tế Vùng cho toàn bộ vùng lá — nạp vào state lúc initvar.
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

/**
 * Bổ sung các vùng mới vào kinh tế của save cũ. Chỉ thêm key còn thiếu; bảng giá
 * đã biến động và mọi field do người chơi sở hữu đều được giữ nguyên từng byte.
 */
export function ensureRegionalEconomy(economy: Record<string, unknown>): number {
  let added = 0;
  for (const region of REGIONS) {
    if (Object.prototype.hasOwnProperty.call(economy, region.id)) continue;
    const res = REGION_RESOURCES[region.id];
    economy[region.id] = {
      "Sản Vật Chủ Lực": [...res.surplus],
      "Thiếu Hụt": [...res.deficit],
      "Giá Cả": fullPriceTable(region.id),
    };
    added++;
  }
  return added;
}
