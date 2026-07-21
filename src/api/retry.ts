/**
 * Engine auto-retry (mục 2.3):
 * - Số lần thử lại cấu hình được 3–10 (mặc định 3).
 * - Exponential backoff + jitter (~1s, 2s, 4s...), tôn trọng Retry-After.
 * - Lỗi 429/401 + nhiều key → xoay key round-robin trước mỗi lần thử.
 * - Không retry lỗi vĩnh viễn (400; 401/403 khi chỉ 1 key).
 * - Huỷ được giữa chừng (AbortSignal) — kể cả trong lúc đang chờ backoff.
 */
import { ApiError, isRetryable, shouldRotateKey, toApiError } from "./errors";
import { createLogger, maskKey } from "../lib/log";

const log = createLogger("api/retry");

export interface RetryAttemptInfo {
  /** Lần thử lại thứ mấy (1-based, không tính lần gọi đầu). */
  attempt: number;
  maxRetries: number;
  /** Sẽ chờ bao lâu trước lần thử này (ms). */
  delayMs: number;
  /** Lỗi gây ra lần thử lại này. */
  error: ApiError;
  /** Index key sẽ dùng cho lần thử này. */
  keyIndex: number;
}

export interface RetryOptions {
  maxRetries: number;
  /** Số key khả dụng (>=1). Key rỗng vẫn tính là 1 "slot" để chạy request không cần key. */
  keyCount: number;
  /** Index key bắt đầu. */
  startKeyIndex?: number;
  signal?: AbortSignal;
  onAttempt?: (info: RetryAttemptInfo) => void;
  /** Cho test: thay hàm sleep. */
  sleepFn?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Cho test: thay random jitter (trả 0..1). */
  jitterFn?: () => number;
  /** Các key để log (đã mask). */
  keysForLog?: string[];
}

export interface AttemptContext {
  keyIndex: number;
  /** 0 = lần gọi đầu, 1.. = các lần thử lại. */
  attempt: number;
  signal?: AbortSignal;
}

export function backoffDelay(attempt: number, jitter: number): number {
  // attempt 1 → ~1s, 2 → ~2s, 3 → ~4s... trần 30s, cộng jitter 0–400ms
  const base = Math.min(1000 * 2 ** (attempt - 1), 30_000);
  return base + Math.floor(jitter * 400);
}

export function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError("aborted", "Đã huỷ"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(t);
      reject(new ApiError("aborted", "Đã huỷ"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Chạy `fn` với auto-retry. `fn` nhận keyIndex hiện tại và phải ném ApiError khi lỗi.
 * Trả kết quả của lần gọi thành công đầu tiên; ném ApiError cuối cùng khi hết lượt.
 */
export async function withRetry<T>(fn: (ctx: AttemptContext) => Promise<T>, opts: RetryOptions): Promise<T> {
  const { maxRetries, keyCount, signal, onAttempt } = opts;
  const sleep = opts.sleepFn ?? defaultSleep;
  const jitter = opts.jitterFn ?? Math.random;
  let keyIndex = opts.startKeyIndex ?? 0;

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new ApiError("aborted", "Đã huỷ");

    if (attempt > 0 && lastError) {
      // Xoay key nếu lỗi thuộc nhóm theo-key và có nhiều key
      if (shouldRotateKey(lastError.kind) && keyCount > 1) {
        keyIndex = (keyIndex + 1) % keyCount;
        log.info(`Xoay sang key #${keyIndex + 1}${opts.keysForLog?.[keyIndex] ? ` (${maskKey(opts.keysForLog[keyIndex])})` : ""}`);
      }
      const delayMs = lastError.retryAfterMs !== undefined ? Math.max(lastError.retryAfterMs, 0) : backoffDelay(attempt, jitter());
      onAttempt?.({ attempt, maxRetries, delayMs, error: lastError, keyIndex });
      log.info(`Thử lại lần ${attempt}/${maxRetries} sau ${delayMs}ms (lỗi: ${lastError.kind})`);
      await sleep(delayMs, signal);
    }

    try {
      return await fn({ keyIndex, attempt, signal });
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.kind === "aborted") throw apiErr; // huỷ chủ động — dừng ngay, không retry
      lastError = apiErr;
      if (!isRetryable(apiErr.kind, keyCount)) {
        log.warn(`Lỗi vĩnh viễn (${apiErr.kind}) — không thử lại`, apiErr.message);
        throw apiErr;
      }
      // vòng lặp tiếp tục nếu còn lượt
    }
  }

  log.warn(`Đã thử ${maxRetries + 1} lần vẫn lỗi — dừng`, lastError?.message);
  throw lastError ?? new ApiError("unknown", "Thất bại không rõ nguyên nhân");
}
