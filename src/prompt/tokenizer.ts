/**
 * Đếm token ƯỚC LƯỢNG (mục 1 — "không cần chính xác 100% với mọi model").
 * gpt-tokenizer (o200k) nạp lazy để không phình bundle khởi động;
 * trước khi nạp xong dùng heuristic ~4 ký tự/token.
 */
type CountFn = (text: string) => number;

let realCounter: CountFn | null = null;
let loading: Promise<void> | null = null;

export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  // heuristic thô: tiếng Việt/CJK nặng token hơn — 3.5 ký tự/token cho an toàn
  return Math.ceil(text.length / 3.5);
}

/** Bắt đầu nạp tokenizer thật (gọi 1 lần lúc app mount). */
export function warmupTokenizer(): Promise<void> {
  if (!loading) {
    loading = import("gpt-tokenizer")
      .then((mod) => {
        realCounter = (text) => mod.countTokens(text);
      })
      .catch(() => {
        realCounter = null; // giữ heuristic — không chặn app
      });
  }
  return loading;
}

/** Đếm token: dùng tokenizer thật nếu đã nạp, không thì heuristic. */
export function countTokens(text: string): number {
  if (realCounter) {
    try {
      return realCounter(text);
    } catch {
      return estimateTokens(text);
    }
  }
  return estimateTokens(text);
}

/** true = đang dùng tokenizer thật (Inspector ghi rõ "ước lượng" khi false). */
export function isRealTokenizer(): boolean {
  return realCounter !== null;
}
