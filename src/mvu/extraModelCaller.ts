/**
 * Extra Model Caller — gọi API model phụ để phân tích biến.
 * Tham khảo MagVarUpdate: dùng model phụ (rẻ/nhanh) parse output AI chính,
 * trả PatchOp[] đã qua extractor filter.
 * Reuse hoàn toàn api/client + mvu/extractor hiện có.
 */
import { streamChat } from "../api/client";
import { extractUpdates } from "./extractor";
import { extractSqlUpdates } from "./sqlExtractor";
import { buildExtraModelMessages } from "./extraModelPrompt";
import { useExtraModelStore } from "../state/extraModelStore";
import { useMvuStore } from "../state/mvuStore";
import type { PatchOp } from "./patchEngine";
import type { ConnectionProfile } from "../types/connection";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/extraModel");

export interface ExtraModelResult {
  ops: PatchOp[];
  rejected: { op: PatchOp; reason: string }[];
  error?: string;
}

/**
 * Build một ConnectionProfile tạm từ extraModelStore fields,
 * để truyền vào streamChat / scanModels.
 */
export function buildExtraModelProfile(): ConnectionProfile {
  const s = useExtraModelStore.getState();
  return {
    id: "__extra_model__",
    name: "Extra Model",
    provider: s.provider,
    baseUrl: s.baseUrl,
    apiKeys: s.apiKeys,
    model: s.model,
    scannedModels: s.scannedModels,
    params: {
      temperature: s.temperature,
      top_p: 1,
      max_tokens: s.maxTokens,
      max_context: 32768,
      stop: [],
      stream: false, // extra model dùng non-stream cho đơn giản + nhanh
    },
    maxRetries: s.maxRetries,
    timeoutMs: s.timeoutMs,
    corsProxy: s.corsProxy,
  };
}

/**
 * Gọi extra model để phân tích biến từ output AI chính.
 * Flow: lấy stat_data → build prompt → gọi API → parse response → return ops.
 */
export async function callExtraModel(
  rawAiOutput: string,
  signal?: AbortSignal,
): Promise<ExtraModelResult> {
  const store = useExtraModelStore.getState();
  if (!store.enabled || !store.baseUrl || !store.model) {
    return { ops: [], rejected: [], error: "Extra model chưa được cấu hình" };
  }

  const statData = useMvuStore.getState().stat;
  const messages = buildExtraModelMessages(statData, rawAiOutput);
  const profile = buildExtraModelProfile();

  store.setStatus("running");
  log.info(`Gọi extra model: ${profile.provider} / ${profile.model}`);

  try {
    let fullText = "";
    const result = await streamChat(
      profile,
      messages,
      {
        onText: (t) => { fullText += t; },
      },
      signal,
    );
    fullText = result.text;

    // Parse response qua extractor phù hợp với engine
    const engine = store.stateEngine;
    const extract = engine === "auto-database"
      ? extractSqlUpdates(fullText)
      : extractUpdates(fullText);

    if (!extract.found) {
      log.warn("Extra model không trả khối update");
      store.setStatus("success", undefined, 0);
      return { ops: [], rejected: extract.rejected };
    }

    log.info(`Extra model trả ${extract.ops.length} ops (${extract.rejected.length} bị lọc)`);
    store.setStatus("success", undefined, extract.ops.length);
    return { ops: extract.ops, rejected: extract.rejected };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Extra model lỗi:", msg);
    store.setStatus("error", msg);
    return { ops: [], rejected: [], error: msg };
  }
}

/**
 * Trigger extra model thủ công cho 1 tin nhắn cụ thể.
 * Gọi extra model → áp ops vào mvuStore.
 */
export async function triggerExtraModelForMessage(
  rawText: string,
  signal?: AbortSignal,
): Promise<ExtraModelResult> {
  const result = await callExtraModel(rawText, signal);
  if (result.ops.length > 0) {
    useMvuStore.getState().applyAiOps(result.ops);
    log.info(`Đã áp ${result.ops.length} ops từ extra model`);
  }
  return result;
}
