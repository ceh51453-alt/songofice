import { describe, expect, it } from "vitest";
import { parsePreset, pickPromptOrder } from "./presetSchema";

describe("parsePreset — validate mềm (3.1b.1)", () => {
  it("preset tối thiểu parse được với prefault", () => {
    const { preset, warnings } = parsePreset({});
    expect(preset.prompts).toEqual([]);
    expect(preset.prompt_order).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("field thiếu trong prompt → prefault, không crash", () => {
    const { preset } = parsePreset({
      prompts: [{ identifier: "main" }],
    });
    expect(preset.prompts[0]).toMatchObject({
      identifier: "main",
      name: "",
      content: "",
      role: "system",
      enabled: true,
      marker: false,
      injection_position: null,
      injection_depth: 4,
      injection_order: 100,
    });
  });

  it("prompt lỗi bị loại TỪNG CÁI kèm cảnh báo — phần hợp lệ vẫn nạp", () => {
    const { preset, warnings } = parsePreset({
      prompts: [
        { identifier: "ok1", content: "a" },
        { name: "thiếu identifier" }, // lỗi
        { identifier: "ok2", content: "b" },
      ],
    });
    expect(preset.prompts.map((p) => p.identifier)).toEqual(["ok1", "ok2"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("thiếu identifier");
  });

  it("field lạ giữ nguyên qua passthrough (round-trip không mất)", () => {
    const raw = {
      prompts: [{ identifier: "x", tool_reasoning_mode: "deep", custom_field: [1, 2] }],
      weird_top_level: { nested: true },
    };
    const { preset } = parsePreset(raw);
    expect((preset.prompts[0] as Record<string, unknown>).tool_reasoning_mode).toBe("deep");
    expect((preset.prompts[0] as Record<string, unknown>).custom_field).toEqual([1, 2]);
    expect((preset as Record<string, unknown>).weird_top_level).toEqual({ nested: true });
  });

  it("sampling được extract kiểu số (coerce)", () => {
    const { preset } = parsePreset({ temperature: "1.1", top_p: 0.9, openai_max_tokens: "65000" });
    expect(preset.temperature).toBe(1.1);
    expect(preset.top_p).toBe(0.9);
    expect(preset.openai_max_tokens).toBe(65000);
  });

  it("không phải object → preset rỗng + cảnh báo, KHÔNG crash", () => {
    expect(parsePreset("chuỗi").warnings.length).toBeGreaterThan(0);
    expect(parsePreset(null).preset.prompts).toEqual([]);
    expect(parsePreset([1, 2]).preset.prompts).toEqual([]);
  });
});

describe("pickPromptOrder", () => {
  it("ưu tiên character_id 100001 (dummy ST), fallback entry đầu", () => {
    const { preset } = parsePreset({
      prompts: [],
      prompt_order: [
        { character_id: 100000, order: [{ identifier: "a", enabled: true }] },
        { character_id: 100001, order: [{ identifier: "b", enabled: true }] },
      ],
    });
    expect(pickPromptOrder(preset).map((o) => o.identifier)).toEqual(["b"]);
  });

  it("không có prompt_order → dùng thứ tự prompts[]", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "p1", enabled: true },
        { identifier: "p2", enabled: false },
      ],
    });
    expect(pickPromptOrder(preset)).toEqual([
      { identifier: "p1", enabled: true },
      { identifier: "p2", enabled: false },
    ]);
  });
});
