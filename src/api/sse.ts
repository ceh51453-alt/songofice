/**
 * SSE parser thủ công trên fetch + ReadableStream (mục 1 — linh hoạt hơn EventSource
 * vì cần header tuỳ chỉnh + POST body).
 *
 * Nhận diện format chuẩn text/event-stream:
 *   event: <tên>\n
 *   data: <payload>\n\n
 * OpenAI chỉ dùng `data:`; Anthropic dùng cả `event:` + `data:`.
 */
import { ApiError } from "./errors";

export interface SseEvent {
  event: string; // "" nếu không có dòng event:
  data: string;
}

/** Parser incremental: nạp từng chunk text, nhả ra các event hoàn chỉnh. */
export class SseParser {
  private buffer = "";

  /** Nạp chunk mới, trả về các event đã hoàn chỉnh trong buffer. */
  push(chunk: string): SseEvent[] {
    this.buffer += chunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const events: SseEvent[] = [];
    let sepIndex: number;
    while ((sepIndex = this.buffer.indexOf("\n\n")) !== -1) {
      const raw = this.buffer.slice(0, sepIndex);
      this.buffer = this.buffer.slice(sepIndex + 2);
      const evt = parseEventBlock(raw);
      if (evt) events.push(evt);
    }
    return events;
  }

  /** Còn dữ liệu dở dang trong buffer không (stream gãy giữa event)? */
  hasPartial(): boolean {
    return this.buffer.trim().length > 0;
  }
}

function parseEventBlock(raw: string): SseEvent | null {
  let event = "";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    // dòng ":" comment hoặc field khác — bỏ qua
  }
  if (dataLines.length === 0 && !event) return null;
  return { event, data: dataLines.join("\n") };
}

/**
 * Đọc body stream của một Response, gọi onEvent với từng SSE event.
 * - `idleTimeoutMs`: không nhận được chunk nào trong khoảng này → ném stream_broken (mục 2.3).
 * - Huỷ qua signal → ném aborted.
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (evt: SseEvent) => void,
  opts: { idleTimeoutMs: number; signal?: AbortSignal },
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();

  try {
    for (;;) {
      if (opts.signal?.aborted) throw new ApiError("aborted", "Đã huỷ");

      const result = await raceIdle(reader.read(), opts.idleTimeoutMs, opts.signal);
      if (result === "idle") {
        throw new ApiError("stream_broken", `Không nhận được dữ liệu trong ${Math.round(opts.idleTimeoutMs / 1000)}s — coi như stream đứt`);
      }
      if (result === "aborted") throw new ApiError("aborted", "Đã huỷ");
      const { done, value } = result;
      if (done) break;
      for (const evt of parser.push(decoder.decode(value, { stream: true }))) {
        onEvent(evt);
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* stream có thể đã đóng */
    }
  }
}

async function raceIdle<T>(p: Promise<T>, idleMs: number, signal?: AbortSignal): Promise<T | "idle" | "aborted"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    return await new Promise<T | "idle" | "aborted">((resolve, reject) => {
      timer = setTimeout(() => resolve("idle"), idleMs);
      if (signal) {
        onAbort = () => resolve("aborted");
        signal.addEventListener("abort", onAbort, { once: true });
      }
      p.then(resolve, reject);
    });
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
  }
}
