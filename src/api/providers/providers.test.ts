import { describe, expect, it } from "vitest";
import { openaiAdapter } from "./openai";
import { anthropicAdapter } from "./anthropic";
import { googleAdapter } from "./google";
import { DEFAULT_PARAMS, type ApiChatMessage, type ModelParams } from "../../types/connection";

const messages: ApiChatMessage[] = [
  { role: "system", content: "Ngươi là người kể chuyện." },
  { role: "user", content: "Xin chào" },
  { role: "assistant", content: "Chào ngươi" },
  { role: "user", content: "Kể tiếp đi" },
];

const params: ModelParams = { ...DEFAULT_PARAMS, temperature: 0.9, max_tokens: 512, stop: ["\nUser:"] };

describe("openaiAdapter", () => {
  it("build request đúng shape /chat/completions + Bearer", () => {
    const req = openaiAdapter.buildChatRequest({
      baseUrl: "https://api.example.com/v1/",
      apiKey: "sk-test",
      model: "gpt-x",
      messages,
      params,
      stream: true,
    });
    expect(req.url).toBe("https://api.example.com/v1/chat/completions");
    expect(req.headers.Authorization).toBe("Bearer sk-test");
    const body = req.body as Record<string, unknown>;
    expect(body.model).toBe("gpt-x");
    expect(body.messages).toHaveLength(4);
    expect(body.stream).toBe(true);
    expect(body.temperature).toBe(0.9);
    expect(body.max_tokens).toBe(512);
    expect(body.stop).toEqual(["\nUser:"]);
  });

  it("parse stream delta + [DONE]", () => {
    expect(
      openaiAdapter.parseStreamEvent({ event: "", data: '{"choices":[{"delta":{"content":"xin chào"}}]}' }),
    ).toEqual({ text: "xin chào" });
    expect(openaiAdapter.parseStreamEvent({ event: "", data: "[DONE]" })).toEqual({ done: true });
    expect(openaiAdapter.parseStreamEvent({ event: "", data: "json rác{{" })).toBeNull();
  });

  it("parse danh sách models", () => {
    expect(openaiAdapter.parseModelsResponse({ data: [{ id: "b" }, { id: "a" }] })).toEqual(["a", "b"]);
    expect(openaiAdapter.parseModelsResponse({})).toEqual([]);
  });
});

describe("anthropicAdapter", () => {
  it("system tách riêng, x-api-key, max_tokens bắt buộc", () => {
    const req = anthropicAdapter.buildChatRequest({
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: "sk-ant",
      model: "claude-x",
      messages,
      params,
      stream: true,
    });
    expect(req.url).toBe("https://api.anthropic.com/v1/messages");
    expect(req.headers["x-api-key"]).toBe("sk-ant");
    expect(req.headers["anthropic-version"]).toBeTruthy();
    const body = req.body as Record<string, unknown>;
    expect(body.system).toBe("Ngươi là người kể chuyện.");
    expect((body.messages as unknown[]).length).toBe(3); // system đã tách ra
    expect(body.max_tokens).toBe(512);
    expect(body.stop_sequences).toEqual(["\nUser:"]);
  });

  it("parse content_block_delta + message_stop", () => {
    expect(
      anthropicAdapter.parseStreamEvent({
        event: "content_block_delta",
        data: '{"delta":{"type":"text_delta","text":"chào"}}',
      }),
    ).toEqual({ text: "chào" });
    expect(anthropicAdapter.parseStreamEvent({ event: "message_stop", data: "{}" })).toEqual({ done: true });
    expect(anthropicAdapter.parseStreamEvent({ event: "message_start", data: "{}" })).toBeNull();
  });
});

describe("googleAdapter", () => {
  it("contents thay messages, role model, system → systemInstruction, key qua header", () => {
    const req = googleAdapter.buildChatRequest({
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      apiKey: "g-key",
      model: "gemini-x",
      messages,
      params,
      stream: true,
    });
    expect(req.url).toContain("/models/gemini-x:streamGenerateContent?alt=sse");
    expect(req.headers["x-goog-api-key"]).toBe("g-key");
    const body = req.body as {
      contents: { role: string; parts: { text: string }[] }[];
      systemInstruction?: { parts: { text: string }[] };
      generationConfig: Record<string, unknown>;
    };
    expect(body.systemInstruction?.parts[0].text).toBe("Ngươi là người kể chuyện.");
    expect(body.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(body.generationConfig.maxOutputTokens).toBe(512);
  });

  it("parse stream candidates", () => {
    expect(
      googleAdapter.parseStreamEvent({
        event: "",
        data: '{"candidates":[{"content":{"parts":[{"text":"xin chào"}]}}]}',
      }),
    ).toEqual({ text: "xin chào" });
    expect(
      googleAdapter.parseStreamEvent({
        event: "",
        data: '{"candidates":[{"content":{"parts":[{"text":"hết"}]},"finishReason":"STOP"}]}',
      }),
    ).toEqual({ text: "hết", done: true });
  });

  it("parse models bỏ prefix models/", () => {
    expect(googleAdapter.parseModelsResponse({ models: [{ name: "models/gemini-pro" }] })).toEqual(["gemini-pro"]);
  });
});
