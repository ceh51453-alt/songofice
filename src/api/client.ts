/**
 * Client cấp cao: ghép provider adapter + SSE parser + auto-retry.
 * Mọi lời gọi AI trong app đi qua đây.
 */
import type { ApiChatMessage, ConnectionProfile } from "../types/connection";
import { getAdapter } from "./providers";
import type { StreamDelta } from "./providers/types";
import { readSseStream } from "./sse";
import { ApiError, classifyHttpStatus, friendlyMessage, parseRetryAfter, toApiError } from "./errors";
import { withRetry, type RetryAttemptInfo } from "./retry";
import { createLogger, maskKey } from "../lib/log";

const log = createLogger("api/client");

/** Áp CORS proxy (prefix) nếu profile bật (mục 2.1). */
function applyProxy(url: string, proxy: string): string {
  const p = proxy.trim();
  if (!p) return url;
  return p.endsWith("=") || p.endsWith("/") ? p + encodeURIComponent(url) : `${p.replace(/\/+$/, "")}/${url}`;
}

function keysOf(profile: ConnectionProfile): string[] {
  const keys = profile.apiKeys.map((k) => k.trim()).filter(Boolean);
  return keys.length > 0 ? keys : [""]; // endpoint local không cần key vẫn chạy
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  outerSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("timeout", "TimeoutError")), timeoutMs);
  const onOuterAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onOuterAbort, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (outerSignal?.aborted) throw new ApiError("aborted", "Đã huỷ");
    if (controller.signal.aborted) throw new ApiError("timeout", `Không có phản hồi sau ${Math.round(timeoutMs / 1000)}s`);
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onOuterAbort);
  }
}

/** Đọc lỗi HTTP → ApiError có phân loại + Retry-After + message server nếu có. */
async function httpError(res: Response): Promise<ApiError> {
  const kind = classifyHttpStatus(res.status);
  let serverMsg = "";
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
      serverMsg =
        (typeof json.error === "object" ? json.error?.message : typeof json.error === "string" ? json.error : undefined) ??
        json.message ??
        text.slice(0, 300);
    } catch {
      serverMsg = text.slice(0, 300);
    }
  } catch {
    /* body không đọc được */
  }
  return new ApiError(kind, serverMsg || `HTTP ${res.status}`, {
    status: res.status,
    retryAfterMs: parseRetryAfter(res.headers.get("Retry-After")),
  });
}

// ---------------------------------------------------------------------------

export interface StreamCallbacks {
  /** Text mới được stream về. */
  onText?: (text: string) => void;
  /** Text reasoning/thinking (nếu model hỗ trợ). */
  onReasoning?: (text: string) => void;
  /** Đang thử lại — UI hiện "Đang thử lại (n/N)". Cũng được gọi khi bắt đầu retry để reset draft. */
  onRetry?: (info: RetryAttemptInfo) => void;
}

export interface StreamResult {
  text: string;
  reasoning: string;
}

/**
 * Gọi chat completion (stream hoặc không) với auto-retry đầy đủ (mục 2.3).
 * Stream gãy giữa chừng → retry lại TỪ ĐẦU (draft cũ bị reset qua onRetry).
 */
export async function streamChat(
  profile: ConnectionProfile,
  messages: ApiChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const adapter = getAdapter(profile.provider);
  const keys = keysOf(profile);

  return withRetry(
    async ({ keyIndex, signal: attemptSignal }) => {
      const apiKey = keys[keyIndex];
      log.debug(`Gọi ${adapter.label} model=${profile.model} key=${maskKey(apiKey)}`);
      const req = adapter.buildChatRequest({
        baseUrl: profile.baseUrl,
        apiKey,
        model: profile.model,
        messages,
        params: profile.params,
        stream: profile.params.stream,
      });
      const url = applyProxy(req.url, profile.corsProxy);

      const res = await fetchWithTimeout(
        url,
        { method: "POST", headers: req.headers, body: JSON.stringify(req.body) },
        profile.timeoutMs,
        attemptSignal,
      );
      if (!res.ok) throw await httpError(res);

      if (!profile.params.stream) {
        const json: unknown = await res.json();
        const text = adapter.parseCompletion(json);
        if (text) callbacks.onText?.(text);
        return { text, reasoning: "" };
      }

      if (!res.body) throw new ApiError("stream_broken", "Server không trả stream body");

      let text = "";
      let reasoning = "";
      let sawDone = false;
      await readSseStream(
        res.body,
        (evt) => {
          const delta: StreamDelta | null = adapter.parseStreamEvent(evt);
          if (!delta) return;
          if (delta.text) {
            text += delta.text;
            callbacks.onText?.(delta.text);
          }
          if (delta.reasoning) {
            reasoning += delta.reasoning;
            callbacks.onReasoning?.(delta.reasoning);
          }
          if (delta.done) sawDone = true;
        },
        { idleTimeoutMs: profile.timeoutMs, signal: attemptSignal },
      );

      // Stream đóng mà chưa nhận được tín hiệu kết thúc VÀ chưa có chữ nào → coi là gãy
      if (!sawDone && text.length === 0 && reasoning.length === 0) {
        throw new ApiError("stream_broken", "Stream đóng mà không nhận được nội dung");
      }
      return { text, reasoning };
    },
    {
      maxRetries: profile.maxRetries,
      keyCount: keys.length,
      signal,
      keysForLog: keys,
      onAttempt: (info) => callbacks.onRetry?.(info),
    },
  );
}

// ---------------------------------------------------------------------------

/** Quét danh sách model từ endpoint (mục 2.1 — nút "Scan Models"). */
export async function scanModels(profile: ConnectionProfile, signal?: AbortSignal): Promise<string[]> {
  const adapter = getAdapter(profile.provider);
  const keys = keysOf(profile);

  return withRetry(
    async ({ keyIndex, signal: attemptSignal }) => {
      const req = adapter.buildModelsRequest(profile.baseUrl, keys[keyIndex]);
      const url = applyProxy(req.url, profile.corsProxy);
      const res = await fetchWithTimeout(url, { headers: req.headers }, profile.timeoutMs, attemptSignal);
      if (!res.ok) throw await httpError(res);
      const json: unknown = await res.json();
      const models = adapter.parseModelsResponse(json);
      log.info(`Quét được ${models.length} model`);
      return models;
    },
    { maxRetries: Math.min(profile.maxRetries, 3), keyCount: keys.length, signal, keysForLog: keys },
  );
}

export interface TestResult {
  ok: boolean;
  latencyMs?: number;
  message: string;
}

/** Test Connection (mục 2.1): request nhỏ "ping", đo latency, báo lỗi rõ ràng. */
export async function testConnection(profile: ConnectionProfile, signal?: AbortSignal): Promise<TestResult> {
  const adapter = getAdapter(profile.provider);
  const keys = keysOf(profile);
  const started = performance.now();
  try {
    const req = adapter.buildChatRequest({
      baseUrl: profile.baseUrl,
      apiKey: keys[0],
      model: profile.model,
      messages: [{ role: "user", content: "ping" }],
      params: { ...profile.params, max_tokens: 5, stop: [] },
      stream: false,
    });
    const url = applyProxy(req.url, profile.corsProxy);
    const res = await fetchWithTimeout(
      url,
      { method: "POST", headers: req.headers, body: JSON.stringify(req.body) },
      profile.timeoutMs,
      signal,
    );
    if (!res.ok) throw await httpError(res);
    await res.json();
    const latencyMs = Math.round(performance.now() - started);
    return { ok: true, latencyMs, message: `Kết nối thành công — ${latencyMs}ms` };
  } catch (err) {
    const apiErr = toApiError(err);
    return { ok: false, message: friendlyMessage(apiErr) };
  }
}
