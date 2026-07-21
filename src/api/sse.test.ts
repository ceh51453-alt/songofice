import { describe, expect, it } from "vitest";
import { SseParser } from "./sse";

describe("SseParser — parser SSE incremental", () => {
  it("parse event data đơn giản kiểu OpenAI", () => {
    const p = new SseParser();
    const events = p.push('data: {"a":1}\n\n');
    expect(events).toEqual([{ event: "", data: '{"a":1}' }]);
  });

  it("parse event có tên kiểu Anthropic", () => {
    const p = new SseParser();
    const events = p.push('event: content_block_delta\ndata: {"delta":{"text":"hi"}}\n\n');
    expect(events).toEqual([{ event: "content_block_delta", data: '{"delta":{"text":"hi"}}' }]);
  });

  it("chunk bị cắt giữa chừng — chờ đủ mới nhả event", () => {
    const p = new SseParser();
    expect(p.push('data: {"a"')).toEqual([]);
    expect(p.hasPartial()).toBe(true);
    const events = p.push(':1}\n\ndata: [DONE]\n\n');
    expect(events).toEqual([
      { event: "", data: '{"a":1}' },
      { event: "", data: "[DONE]" },
    ]);
    expect(p.hasPartial()).toBe(false);
  });

  it("nhiều event trong 1 chunk", () => {
    const p = new SseParser();
    const events = p.push("data: 1\n\ndata: 2\n\ndata: 3\n\n");
    expect(events.map((e) => e.data)).toEqual(["1", "2", "3"]);
  });

  it("chuẩn hoá CRLF", () => {
    const p = new SseParser();
    const events = p.push("data: x\r\n\r\n");
    expect(events).toEqual([{ event: "", data: "x" }]);
  });

  it("data nhiều dòng được nối bằng \\n", () => {
    const p = new SseParser();
    const events = p.push("data: dòng 1\ndata: dòng 2\n\n");
    expect(events).toEqual([{ event: "", data: "dòng 1\ndòng 2" }]);
  });

  it("bỏ qua comment và field lạ", () => {
    const p = new SseParser();
    const events = p.push(": keep-alive\nretry: 3000\ndata: ok\n\n");
    expect(events).toEqual([{ event: "", data: "ok" }]);
  });
});
