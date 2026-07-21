/**
 * Phân loại lỗi API (mục 2.3):
 * - Lỗi TẠM THỜI (retry): 429, 5xx, timeout, đứt mạng, stream gãy giữa chừng.
 * - Lỗi VĨNH VIỄN (không retry): 400 body sai; 401/403 sai key khi chỉ có 1 key
 *   (nhiều key thì 401/403 vẫn được thử tiếp bằng key khác — rotate).
 */
export type FailKind =
  | "rate_limit" // 429
  | "auth" // 401/403
  | "server" // 5xx
  | "timeout" // quá ngưỡng timeout
  | "network" // fetch thất bại / đứt kết nối
  | "stream_broken" // stream đứt nửa chừng
  | "bad_request" // 4xx còn lại (400, 404, 422...)
  | "aborted" // người dùng chủ động huỷ
  | "unknown";

export class ApiError extends Error {
  readonly kind: FailKind;
  readonly status?: number;
  /** Từ header Retry-After nếu server trả (ms). */
  readonly retryAfterMs?: number;

  constructor(kind: FailKind, message: string, opts?: { status?: number; retryAfterMs?: number; cause?: unknown }) {
    super(message, opts?.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "ApiError";
    this.kind = kind;
    this.status = opts?.status;
    this.retryAfterMs = opts?.retryAfterMs;
  }
}

export function classifyHttpStatus(status: number): FailKind {
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (status >= 500) return "server";
  if (status >= 400) return "bad_request";
  return "unknown";
}

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

/** Lỗi này có được phép thử lại không? (keyCount ảnh hưởng nhóm auth) */
export function isRetryable(kind: FailKind, keyCount: number): boolean {
  switch (kind) {
    case "rate_limit":
    case "server":
    case "timeout":
    case "network":
    case "stream_broken":
      return true;
    case "auth":
      return keyCount > 1; // nhiều key → xoay key thử tiếp; 1 key → báo ngay
    default:
      return false;
  }
}

/** Lỗi thuộc nhóm "do key cụ thể" → xoay sang key kế tiếp trước khi thử lại. */
export function shouldRotateKey(kind: FailKind): boolean {
  return kind === "rate_limit" || kind === "auth";
}

/** Chuyển lỗi bất kỳ (fetch TypeError, AbortError...) về ApiError chuẩn. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof DOMException && err.name === "AbortError") {
    return new ApiError("aborted", "Đã huỷ yêu cầu", { cause: err });
  }
  if (err instanceof TypeError) {
    // fetch ném TypeError khi lỗi mạng HOẶC bị CORS chặn — không phân biệt được từ JS
    return new ApiError("network", "Lỗi mạng hoặc CORS bị chặn — kiểm tra Base URL, thử bật CORS proxy", {
      cause: err,
    });
  }
  const msg = err instanceof Error ? err.message : String(err);
  return new ApiError("unknown", msg, { cause: err });
}

/** Thông điệp thân thiện tiếng Việt cho từng loại lỗi (mục 2.1 Test Connection + 2.3). */
export function friendlyMessage(err: ApiError): string {
  switch (err.kind) {
    case "rate_limit":
      return `429: Máy chủ quá tải / hết hạn mức — thử lại sau hoặc thêm API key khác`;
    case "auth":
      return `${err.status ?? 401}: API key không hợp lệ hoặc không có quyền`;
    case "server":
      return `${err.status ?? 500}: Máy chủ gặp sự cố tạm thời`;
    case "timeout":
      return "Quá thời gian chờ phản hồi (timeout)";
    case "network":
      return "Lỗi mạng hoặc CORS bị chặn — kiểm tra kết nối / Base URL, thử bật CORS proxy";
    case "stream_broken":
      return "Luồng phản hồi bị đứt giữa chừng";
    case "bad_request":
      return `${err.status ?? 400}: Yêu cầu không hợp lệ — ${err.message}`;
    case "aborted":
      return "Đã huỷ";
    default:
      return err.message || "Lỗi không xác định";
  }
}
