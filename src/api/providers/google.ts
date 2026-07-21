/**
 * Adapter Google Gemini (mục 2.1): dùng `contents` thay vì `messages`,
 * system → systemInstruction, key qua header x-goog-api-key,
 * stream qua :streamGenerateContent?alt=sse (SSE data: {...}).
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
  "seed",
  "stop",
  "stream",
]);

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

export const googleAdapter: ProviderAdapter = {
  kind: "google",
  label: "Google Gemini",
  supportedParams,
  supportsReasoning: false,
  defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",

  buildChatRequest({ baseUrl, apiKey, model, messages, params, stream }: BuildRequestInput): BuiltRequest {
    const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
    const contents: GeminiContent[] = [];
    for (const m of messages) {
      if (m.role === "system") continue;
      const role = m.role === "assistant" ? "model" : "user";
      // Gemini yêu cầu role xen kẽ — gộp message cùng role liền nhau
      const last = contents[contents.length - 1];
      if (last && last.role === role) last.parts.push({ text: m.content });
      else contents.push({ role, parts: [{ text: m.content }] });
    }

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: params.max_tokens,
    };
    if (params.temperature !== undefined) generationConfig.temperature = params.temperature;
    if (params.top_p !== undefined) generationConfig.topP = params.top_p;
    if (params.top_k !== undefined) generationConfig.topK = params.top_k;
    if (params.seed !== undefined) generationConfig.seed = params.seed;
    if (params.stop.length > 0) generationConfig.stopSequences = params.stop;

    const body: Record<string, unknown> = { contents, generationConfig };
    if (systemParts.length > 0) {
      body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
    }

    const verb = stream ? "streamGenerateContent?alt=sse" : "generateContent";
    return {
      url: joinUrl(baseUrl, `/models/${encodeURIComponent(model)}:${verb}`),
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-goog-api-key": apiKey } : {}),
      },
      body,
    };
  },

  parseStreamEvent(evt: SseEvent): StreamDelta | null {
    let json: unknown;
    try {
      json = JSON.parse(evt.data);
    } catch {
      return null;
    }
    const obj = json as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const cand = obj.candidates?.[0];
    if (!cand) return null;
    const text = cand.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const delta: StreamDelta = {};
    if (text) delta.text = text;
    if (cand.finishReason) delta.done = true;
    return delta.text || delta.done ? delta : null;
  },

  parseCompletion(json: unknown): string {
    const obj = json as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return obj.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  },

  buildModelsRequest(baseUrl: string, apiKey: string) {
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-goog-api-key"] = apiKey;
    return { url: joinUrl(baseUrl, "/models?pageSize=200"), headers };
  },

  parseModelsResponse(json: unknown): string[] {
    const obj = json as { models?: { name?: string }[] };
    if (!Array.isArray(obj.models)) return [];
    return obj.models
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  },
};
