/**
 * Adapter Anthropic (mục 2.1): /messages, header x-api-key + anthropic-version,
 * bắt buộc max_tokens, system TÁCH RIÊNG ngoài mảng messages,
 * SSE dạng event-stream có tên event (content_block_delta...).
 */
import type { ModelParams } from "../../types/connection";
import type { BuildRequestInput, BuiltRequest, ProviderAdapter, StreamDelta } from "./types";
import type { SseEvent } from "../sse";

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, "") + path;
}

const supportedParams = new Set<keyof ModelParams>([
  "temperature",
  "top_p",
  "top_k",
  "max_tokens",
  "max_context",
  "stop",
  "stream",
  "reasoning",
]);

export const anthropicAdapter: ProviderAdapter = {
  kind: "anthropic",
  label: "Anthropic-compatible",
  supportedParams,
  supportsReasoning: true,
  defaultBaseUrl: "https://api.anthropic.com/v1",

  buildChatRequest({ baseUrl, apiKey, model, messages, params, stream }: BuildRequestInput): BuiltRequest {
    // system tách riêng, gộp các system message liên tiếp
    const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
    const rest = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const body: Record<string, unknown> = {
      model,
      messages: rest,
      max_tokens: params.max_tokens, // Anthropic bắt buộc
      stream,
    };
    if (systemParts.length > 0) body.system = systemParts.join("\n\n");
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.top_p !== undefined) body.top_p = params.top_p;
    if (params.top_k !== undefined) body.top_k = params.top_k;
    if (params.stop.length > 0) body.stop_sequences = params.stop;
    if (params.reasoning) {
      body.thinking = { type: "enabled", budget_tokens: Math.min(Math.floor(params.max_tokens / 2), 16_000) };
    }

    return {
      url: joinUrl(baseUrl, "/messages"),
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        // cho phép gọi thẳng từ browser (chính sách CORS của Anthropic)
        "anthropic-dangerous-direct-browser-access": "true",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body,
    };
  },

  parseStreamEvent(evt: SseEvent): StreamDelta | null {
    if (evt.event === "message_stop") return { done: true };
    if (evt.event !== "content_block_delta") return null;
    let json: unknown;
    try {
      json = JSON.parse(evt.data);
    } catch {
      return null;
    }
    const obj = json as { delta?: { type?: string; text?: string; thinking?: string } };
    if (obj.delta?.type === "text_delta" && obj.delta.text) return { text: obj.delta.text };
    if (obj.delta?.type === "thinking_delta" && obj.delta.thinking) return { reasoning: obj.delta.thinking };
    return null;
  },

  parseCompletion(json: unknown): string {
    const obj = json as { content?: { type?: string; text?: string }[] };
    if (!Array.isArray(obj.content)) return "";
    return obj.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
  },

  buildModelsRequest(baseUrl: string, apiKey: string) {
    return {
      url: joinUrl(baseUrl, "/models?limit=100"),
      headers: {
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
    };
  },

  parseModelsResponse(json: unknown): string[] {
    const obj = json as { data?: { id?: string }[] };
    if (!Array.isArray(obj.data)) return [];
    return obj.data
      .map((m) => m.id ?? "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  },
};
