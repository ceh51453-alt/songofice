import type { ApiChatMessage, ModelParams, ProviderKind } from "../../types/connection";
import type { SseEvent } from "../sse";

/** Kết quả parse 1 SSE event từ stream completion. */
export interface StreamDelta {
  /** Text mới (nếu có). */
  text?: string;
  /** Text thuộc khối reasoning/thinking (hiển thị riêng, không nối vào content). */
  reasoning?: string;
  /** true = stream kết thúc bình thường. */
  done?: boolean;
}

export interface BuildRequestInput {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ApiChatMessage[];
  params: ModelParams;
  stream: boolean;
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Adapter cho mỗi provider (mục 2.1): format body, header auth,
 * cách parse SSE, endpoint scan models, tham số nào được hỗ trợ.
 */
export interface ProviderAdapter {
  kind: ProviderKind;
  label: string;
  /** Tham số trong ModelParams mà provider này gửi được — UI ẩn phần còn lại. */
  supportedParams: ReadonlySet<keyof ModelParams>;
  /** Có hỗ trợ bật reasoning/thinking không (mục 2.2). */
  supportsReasoning: boolean;
  defaultBaseUrl: string;

  buildChatRequest(input: BuildRequestInput): BuiltRequest;
  /** Parse 1 SSE event → delta. Trả null nếu event không mang nội dung. */
  parseStreamEvent(evt: SseEvent): StreamDelta | null;
  /** Lấy full text từ response non-stream. */
  parseCompletion(json: unknown): string;

  buildModelsRequest(baseUrl: string, apiKey: string): { url: string; headers: Record<string, string> };
  parseModelsResponse(json: unknown): string[];
}
