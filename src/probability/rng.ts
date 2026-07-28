/**
 * Lõi RNG có hạt giống (5bis.1) — TOÀN APP dùng lõi này cho mọi thứ ảnh hưởng
 * state, không bao giờ Math.random() trực tiếp. Cùng seed → cùng kết quả →
 * reroll/undo không đổi kết quả đã chốt, test tái lập được.
 *
 * - makeRng: PRNG mulberry32 (tự viết, không dependency).
 * - eventSeed: seed dẫn xuất từ (seed gốc + turn + nhãn stream) bằng hash
 *   cyrb53 — mỗi hệ ("combat", "social", "event", "lore"...) một stream riêng,
 *   roll của hệ này không "ăn" chuỗi ngẫu nhiên của hệ kia (5bis.1 Streams).
 */
export type RNG = () => number; // trả 0..1

/** PRNG mulberry32 — nhanh, chất lượng đủ cho game, seedable 32-bit. */
export function makeRng(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash chuỗi ổn định cyrb53 → số nguyên 53-bit (dùng 32 bit thấp cho seed). */
export function hashSeed(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Seed theo sự kiện (5bis.1): dẫn xuất từ (seed gốc ván + nhịp lượt + nhãn).
 * Mỗi roll độc lập nhưng tái lập; reroll cùng lượt cho cùng chuỗi roll.
 */
export function eventSeed(rootSeed: number, tick: number, label: string): number {
  return hashSeed(`${rootSeed}:${tick}:${label}`) >>> 0;
}

/** RNG cho 1 stream cụ thể của lượt hiện tại — cách gọi chuẩn toàn app. */
export function streamRng(rootSeed: number, tick: number, label: string): RNG {
  return makeRng(eventSeed(rootSeed, tick, label));
}

/** Sinh seed gốc ván mới (lúc tạo nhân vật) — từ thời gian + entropy trình duyệt. */
export function newRootSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ^ Date.now()) >>> 0;
}

/** Gieo xúc xắc "XdY+Z" bằng RNG chỉ định (dùng chung với macro {{roll}}). */
export function rollDiceNotation(notation: string, rng: RNG): number {
  const m = notation.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) throw new Error(`Ký hiệu xúc xắc không hợp lệ: "${notation}"`);
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  let total = mod;
  for (let i = 0; i < count; i++) total += 1 + Math.floor(rng() * sides);
  return total;
}
