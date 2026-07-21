/** Loại provider hỗ trợ (mục 2.1). "custom" hành xử như OpenAI-compatible. */
export type ProviderKind = "openai" | "anthropic" | "google" | "custom";

/** Tham số sampling của model (mục 2.2) — undefined = không gửi. */
export interface ModelParams {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  top_a?: number;
  typical_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  max_tokens: number;
  /** Ngân sách context (token) — dùng cắt lịch sử chat ở milestone sau. */
  max_context: number;
  seed?: number;
  stop: string[];
  stream: boolean;
  /** reasoning/thinking — chỉ gửi nếu provider hỗ trợ. */
  reasoning?: boolean;
}

/** Một Connection Profile độc lập hoàn toàn (mục 2.2). */
export interface ConnectionProfile {
  id: string;
  name: string;
  provider: ProviderKind;
  baseUrl: string;
  /** Nhiều key — round-robin khi 429/401 (mục 2.1/2.3). */
  apiKeys: string[];
  model: string;
  /** Danh sách model đã quét được lần gần nhất. */
  scannedModels: string[];
  params: ModelParams;
  /** Số lần thử lại khi gọi thất bại, 3–10, mặc định 3 (mục 2.3). */
  maxRetries: number;
  /** Timeout mỗi request / khoảng lặng tối đa giữa 2 chunk stream (ms). */
  timeoutMs: number;
  /** CORS proxy tuỳ chọn — prefix trước URL đích (mục 1/23). */
  corsProxy: string;
}

export const DEFAULT_PARAMS: ModelParams = {
  temperature: 1,
  top_p: 1,
  max_tokens: 2048,
  max_context: 32768,
  stop: [],
  stream: true,
};

export function makeDefaultProfile(id: string, name: string): ConnectionProfile {
  return {
    id,
    name,
    provider: "openai",
    baseUrl: "",
    apiKeys: [],
    model: "",
    scannedModels: [],
    params: { ...DEFAULT_PARAMS, stop: [] },
    maxRetries: 3,
    timeoutMs: 60_000,
    corsProxy: "",
  };
}

/** Tin nhắn gửi lên API (khác ChatMessage lưu trong store — sẽ tách khi có MVU). */
export interface ApiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
