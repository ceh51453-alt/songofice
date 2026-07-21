/**
 * Adapter OpenAI-compatible (mục 2.1): /chat/completions, Bearer auth,
 * SSE dạng `data: {...}` + `data: [DONE]`.
 * Nhiều endpoint tương thích (OpenRouter, llama.cpp, Together...) hỗ trợ thêm
 * top_k/min_p/repetition_penalty — nên vẫn khai báo hỗ trợ, gửi khi được đặt.
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
  "min_p",
  "top_a",
  "typical_p",
  "frequency_penalty",
  "presence_penalty",
  "repetition_penalty",
  "max_tokens",
  "max_context",
  "seed",
  "stop",
  "stream",
]);

export const openaiAdapter: ProviderAdapter = {
  kind: "openai",
  label: "OpenAI-compatible",
  supportedParams,
  supportsReasoning: false,
  defaultBaseUrl: "https://api.openai.com/v1",

  buildChatRequest({ baseUrl, apiKey, model, messages, params, stream }: BuildRequestInput): BuiltRequest {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream,
    };
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.top_p !== undefined) body.top_p = params.top_p;
    if (params.top_k !== undefined) body.top_k = params.top_k;
    if (params.min_p !== undefined) body.min_p = params.min_p;
    if (params.top_a !== undefined) body.top_a = params.top_a;
    if (params.typical_p !== undefined) body.typical_p = params.typical_p;
    if (params.frequency_penalty !== undefined) body.frequency_penalty = params.frequency_penalty;
    if (params.presence_penalty !== undefined) body.presence_penalty = params.presence_penalty;
    if (params.repetition_penalty !== undefined) body.repetition_penalty = params.repetition_penalty;
    if (params.seed !== undefined) body.seed = params.seed;
    if (params.stop.length > 0) body.stop = params.stop;
    body.max_tokens = params.max_tokens;

    return {
      url: joinUrl(baseUrl, "/chat/completions"),
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body,
    };
  },

  parseStreamEvent(evt: SseEvent): StreamDelta | null {
    if (evt.data === "[DONE]") return { done: true };
    let json: unknown;
    try {
      json = JSON.parse(evt.data);
    } catch {
      return null; // chunk rác — bỏ qua, không crash
    }
    const obj = json as { choices?: { delta?: { content?: string; reasoning_content?: string }; finish_reason?: string | null }[] };
    const choice = obj.choices?.[0];
    if (!choice) return null;
    const delta: StreamDelta = {};
    if (choice.delta?.content) delta.text = choice.delta.content;
    if (choice.delta?.reasoning_content) delta.reasoning = choice.delta.reasoning_content;
    if (choice.finish_reason) delta.done = true;
    return delta.text || delta.reasoning || delta.done ? delta : null;
  },

  parseCompletion(json: unknown): string {
    const obj = json as { choices?: { message?: { content?: string } }[] };
    return obj.choices?.[0]?.message?.content ?? "";
  },

  buildModelsRequest(baseUrl: string, apiKey: string) {
    const headers: Record<string, string> = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return { url: joinUrl(baseUrl, "/models"), headers };
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
