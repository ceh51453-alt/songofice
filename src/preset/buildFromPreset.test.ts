import { beforeAll, describe, expect, it } from "vitest";
import { buildFromPreset, type BuildOptions } from "./buildFromPreset";
import { parsePreset } from "./presetSchema";
import { emptyMarkerSources } from "./markers";
import { registerBuiltinMacros } from "../prompt/macros";
import { makeEmptyMacroContext, type MacroContext } from "../prompt/macroContext";
import { addValues } from "../state/variablesStore";
import type { ApiChatMessage } from "../types/connection";

beforeAll(() => registerBuiltinMacros());

function makeCtx(): MacroContext & { chatVars: Map<string, string> } {
  const chatVars = new Map<string, string>();
  const ctx = makeEmptyMacroContext({
    char: "GM",
    user: "Người Chơi",
    rng: () => 0.5,
    vars: {
      getChat: (k) => chatVars.get(k) ?? "",
      setChat: (k, v) => void chatVars.set(k, v),
      addChat: (k, v) => void chatVars.set(k, addValues(chatVars.get(k) ?? "", v)),
      getGlobal: () => "",
      setGlobal: () => {},
      addGlobal: () => {},
    },
  });
  return Object.assign(ctx, { chatVars });
}

function makeOpts(partial?: Partial<BuildOptions>): BuildOptions {
  return {
    ctx: makeCtx(),
    sources: emptyMarkerSources(),
    history: [],
    maxContext: 100_000,
    maxOutputTokens: 1000,
    ...partial,
  };
}

const HISTORY: ApiChatMessage[] = [
  { role: "user", content: "tin 1" },
  { role: "assistant", content: "tin 2" },
  { role: "user", content: "tin 3" },
  { role: "assistant", content: "tin 4" },
  { role: "user", content: "tin 5" },
];

describe("buildFromPreset — thứ tự & marker (3.1b.2/3.1b.4)", () => {
  it("ghép đúng thứ tự prompt_order; prompt_order là tầng quyết định bật/tắt (như ST)", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "a", content: "Block A", role: "system" },
        { identifier: "b", content: "Block B (enabled=false trên prompts — ST vẫn nạp)", role: "system", enabled: false },
        { identifier: "c", content: "Block C", role: "user" },
        { identifier: "d", content: "Block D (tắt trong order)", role: "system" },
      ],
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: "c", enabled: true }, // đảo thứ tự so với prompts[]
            { identifier: "b", enabled: true },
            { identifier: "a", enabled: true },
            { identifier: "d", enabled: false },
          ],
        },
      ],
    });
    const r = buildFromPreset(preset, makeOpts());
    expect(r.messages.map((m) => m.content)).toEqual([
      "Block C",
      "Block B (enabled=false trên prompts — ST vẫn nạp)",
      "Block A",
    ]);
    expect(r.messages.map((m) => m.role)).toEqual(["user", "system", "system"]);
    expect(r.traces.find((t) => t.identifier === "b")?.skippedReason).toBeUndefined();
    // chỉ prompt_order tắt mới bỏ block
    expect(r.traces.find((t) => t.identifier === "d")?.skippedReason).toBe("disabled");
  });

  it("8 marker: 7 marker text điền từ sources, chatHistory chèn lịch sử ĐÚNG VỊ TRÍ", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "main", content: "Luật chung", role: "system" },
        { identifier: "worldInfoBefore", marker: true },
        { identifier: "charDescription", marker: true },
        { identifier: "charPersonality", marker: true },
        { identifier: "personaDescription", marker: true },
        { identifier: "scenario", marker: true },
        { identifier: "worldInfoAfter", marker: true },
        { identifier: "dialogueExamples", marker: true },
        { identifier: "chatHistory", marker: true },
        { identifier: "post", content: "Nhắc cuối", role: "system" },
      ],
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: "main", enabled: true },
            { identifier: "worldInfoBefore", enabled: true },
            { identifier: "charDescription", enabled: true },
            { identifier: "charPersonality", enabled: true },
            { identifier: "personaDescription", enabled: true },
            { identifier: "scenario", enabled: true },
            { identifier: "worldInfoAfter", enabled: true },
            { identifier: "dialogueExamples", enabled: true },
            { identifier: "chatHistory", enabled: true },
            { identifier: "post", enabled: true },
          ],
        },
      ],
    });
    const r = buildFromPreset(
      preset,
      makeOpts({
        history: HISTORY,
        sources: emptyMarkerSources({
          worldInfoBefore: () => "LORE TRƯỚC",
          worldInfoAfter: () => "LORE SAU",
          charDescription: () => "MÔ TẢ {{char}}",
          charPersonality: () => "TÍNH CÁCH",
          personaDescription: () => "PERSONA",
          scenario: () => "BỐI CẢNH",
          dialogueExamples: () => "VÍ DỤ",
        }),
      }),
    );
    expect(r.messages.map((m) => m.content)).toEqual([
      "Luật chung",
      "LORE TRƯỚC",
      "MÔ TẢ GM", // macro render cả trong nội dung marker
      "TÍNH CÁCH",
      "PERSONA",
      "BỐI CẢNH",
      "LORE SAU",
      "VÍ DỤ",
      ...HISTORY.map((h) => h.content),
      "Nhắc cuối",
    ]);
  });

  it("marker rỗng → bỏ qua (không tạo message rỗng)", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "worldInfoBefore", marker: true },
        { identifier: "x", content: "còn lại" },
      ],
      prompt_order: [
        { character_id: 100001, order: [{ identifier: "worldInfoBefore", enabled: true }, { identifier: "x", enabled: true }] },
      ],
    });
    const r = buildFromPreset(preset, makeOpts());
    expect(r.messages.map((m) => m.content)).toEqual(["còn lại"]);
    expect(r.traces.find((t) => t.identifier === "worldInfoBefore")?.skippedReason).toBe("empty");
  });

  it("macro setvar ở block TRƯỚC được getvar block SAU đọc — theo prompt_order", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "init", content: "{{setvar::chế độ::Chiến Tranh}}{{trim}}" },
        { identifier: "use", content: "Chế độ hiện tại: {{getvar::chế độ}}" },
      ],
      prompt_order: [
        { character_id: 100001, order: [{ identifier: "init", enabled: true }, { identifier: "use", enabled: true }] },
      ],
    });
    const r = buildFromPreset(preset, makeOpts());
    // block init render ra rỗng (chỉ setvar) → bị bỏ; block use đọc được biến
    expect(r.messages.map((m) => m.content)).toEqual(["Chế độ hiện tại: Chiến Tranh"]);
  });
});

describe("buildFromPreset — injection_position=1 (depth injection)", () => {
  function presetWithInjections() {
    return parsePreset({
      prompts: [
        { identifier: "sys", content: "Hệ thống", role: "system" },
        { identifier: "chatHistory", marker: true },
        { identifier: "inj0", content: "JB cuối", role: "system", injection_position: 1, injection_depth: 0, injection_order: 100 },
        { identifier: "inj2", content: "Nhắc depth 2", role: "user", injection_position: 1, injection_depth: 2, injection_order: 100 },
      ],
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: "sys", enabled: true },
            { identifier: "chatHistory", enabled: true },
            { identifier: "inj0", enabled: true },
            { identifier: "inj2", enabled: true },
          ],
        },
      ],
    }).preset;
  }

  it("chèn đúng độ sâu: depth 0 = sau tin cuối, depth 2 = trước 2 tin cuối", () => {
    const r = buildFromPreset(presetWithInjections(), makeOpts({ history: HISTORY }));
    expect(r.messages.map((m) => m.content)).toEqual([
      "Hệ thống",
      "tin 1",
      "tin 2",
      "tin 3",
      "Nhắc depth 2", // trước 2 tin cuối
      "tin 4",
      "tin 5",
      "JB cuối", // depth 0 — sau tin cuối
    ]);
  });

  it("nhiều block cùng depth → phân giải theo injection_order tăng dần", () => {
    const { preset } = parsePreset({
      prompts: [
        { identifier: "chatHistory", marker: true },
        { identifier: "b", content: "THỨ HAI", injection_position: 1, injection_depth: 1, injection_order: 200 },
        { identifier: "a", content: "THỨ NHẤT", injection_position: 1, injection_depth: 1, injection_order: 50 },
      ],
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: "chatHistory", enabled: true },
            { identifier: "b", enabled: true },
            { identifier: "a", enabled: true },
          ],
        },
      ],
    });
    const r = buildFromPreset(preset, makeOpts({ history: HISTORY.slice(0, 2) }));
    expect(r.messages.map((m) => m.content)).toEqual(["tin 1", "THỨ NHẤT", "THỨ HAI", "tin 2"]);
  });

  it("depth lớn hơn số tin nhắn → chèn lên ĐẦU history", () => {
    const r = buildFromPreset(presetWithInjections(), makeOpts({ history: HISTORY.slice(0, 1) }));
    // inj2 depth 2 > 1 tin → đầu history
    expect(r.messages.map((m) => m.content)).toEqual(["Hệ thống", "Nhắc depth 2", "tin 1", "JB cuối"]);
  });
});

describe("buildFromPreset — prefill + ngân sách token", () => {
  it("assistant_prefill thành message assistant CUỐI CÙNG", () => {
    const { preset } = parsePreset({
      prompts: [{ identifier: "chatHistory", marker: true }],
      prompt_order: [{ character_id: 100001, order: [{ identifier: "chatHistory", enabled: true }] }],
      assistant_prefill: "<thinking>Ta phải",
    });
    const r = buildFromPreset(preset, makeOpts({ history: HISTORY }));
    const last = r.messages[r.messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.content).toBe("<thinking>Ta phải");
    expect(r.traces.find((t) => t.kind === "prefill")?.messageIndex).toBe(r.messages.length - 1);
  });

  it("cắt history TỪ TIN CŨ NHẤT khi vượt ngân sách, giữ tin mới nhất, có cảnh báo", () => {
    const longMsg = (i: number): ApiChatMessage => ({ role: "user", content: `tin số ${i} ` + "x".repeat(350) });
    const history = [1, 2, 3, 4, 5].map(longMsg); // mỗi tin ~ 100 token (350/3.5)
    const { preset } = parsePreset({
      prompts: [{ identifier: "chatHistory", marker: true }],
      prompt_order: [{ character_id: 100001, order: [{ identifier: "chatHistory", enabled: true }] }],
    });
    // ngân sách: 350 context - 100 output = 250 → vừa ~2 tin
    const r = buildFromPreset(preset, makeOpts({ history, maxContext: 350, maxOutputTokens: 100 }));
    expect(r.historyIncluded).toBe(2);
    expect(r.historyDropped).toBe(3);
    expect(r.messages[0].content).toContain("tin số 4"); // 2 tin MỚI NHẤT được giữ
    expect(r.messages[1].content).toContain("tin số 5");
    expect(r.warnings.some((w) => w.includes("cắt 3 tin nhắn"))).toBe(true);
  });

  it("luôn giữ ít nhất tin mới nhất + cờ overBudget khi vẫn vượt", () => {
    const history: ApiChatMessage[] = [{ role: "user", content: "y".repeat(7000) }]; // ~2000 token
    const { preset } = parsePreset({
      prompts: [{ identifier: "chatHistory", marker: true }],
      prompt_order: [{ character_id: 100001, order: [{ identifier: "chatHistory", enabled: true }] }],
    });
    const r = buildFromPreset(preset, makeOpts({ history, maxContext: 500, maxOutputTokens: 100 }));
    expect(r.historyIncluded).toBe(1);
    expect(r.overBudget).toBe(true);
    expect(r.warnings.some((w) => w.includes("VƯỢT"))).toBe(true);
  });

  it("preset KHÔNG có marker chatHistory → history nối cuối + cảnh báo", () => {
    const { preset } = parsePreset({
      prompts: [{ identifier: "sys", content: "Chỉ có hệ thống" }],
      prompt_order: [{ character_id: 100001, order: [{ identifier: "sys", enabled: true }] }],
    });
    const r = buildFromPreset(preset, makeOpts({ history: HISTORY.slice(0, 2) }));
    expect(r.messages.map((m) => m.content)).toEqual(["Chỉ có hệ thống", "tin 1", "tin 2"]);
    expect(r.warnings.some((w) => w.includes("không có marker chatHistory"))).toBe(true);
  });

  it("prompt_order tham chiếu identifier không tồn tại → cảnh báo, không crash", () => {
    const { preset } = parsePreset({
      prompts: [{ identifier: "sys", content: "OK" }],
      prompt_order: [
        { character_id: 100001, order: [{ identifier: "ma", enabled: true }, { identifier: "sys", enabled: true }] },
      ],
    });
    const r = buildFromPreset(preset, makeOpts());
    expect(r.messages.map((m) => m.content)).toEqual(["OK"]);
    expect(r.warnings.some((w) => w.includes("ma"))).toBe(true);
  });
});
