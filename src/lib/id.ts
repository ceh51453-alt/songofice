/** Sinh id ngắn, đủ ngẫu nhiên cho client-side (không cần UUID chuẩn). */
export function genId(prefix = ""): string {
  const rand = crypto.getRandomValues(new Uint32Array(2));
  const s = rand[0].toString(36) + rand[1].toString(36) + Date.now().toString(36);
  return prefix ? `${prefix}_${s}` : s;
}
