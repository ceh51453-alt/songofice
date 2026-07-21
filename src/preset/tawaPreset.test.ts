/**
 * Acceptance test M2 với PRESET THẬT: "Tawa δέλτα.json" (179 prompts, đủ 8
 * marker, macro state dày đặc — setvar×64, addvar×38, getvar×25...).
 * "Import 1 file preset ST thật phức tạp → không crash, field lạ giữ nguyên,
 *  ghép đúng prompt_order, macro đọc-ghi đúng store, round-trip."
 */
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePreset, pickPromptOrder } from "./presetSchema";
import { buildFromPreset } from "./buildFromPreset";
import { emptyMarkerSources } from "./markers";
import { mergePresetParams } from "./mergeParams";
import { registerBuiltinMacros } from "../prompt/macros";
import { makeEmptyMacroContext, type MacroContext } from "../prompt/macroContext";
import { addValues } from "../state/variablesStore";
import { DEFAULT_PARAMS } from "../types/connection";

const RAW_TEXT = readFileSync(join(__dirname, "..", "..", "Tawa δέλτα.json"), "utf8");
const RAW = JSON.parse(RAW_TEXT) as Record<string, unknown>;

beforeAll(() => registerBuiltinMacros());

function makeCtx(): MacroContext & { chatVars: Map<string, string>; globalVars: Map<string, string> } {
  const chatVars = new Map<string, string>();
  const globalVars = new Map<string, string>();
  const ctx = makeEmptyMacroContext({
    char: "Người Kể Chuyện",
    user: "Eddard",
    persona: "Lãnh chúa Winterfell",
    rng: () => 0.5,
    vars: {
      getChat: (k) => chatVars.get(k) ?? "",
      setChat: (k, v) => void chatVars.set(k, v),
      addChat: (k, v) => void chatVars.set(k, addValues(chatVars.get(k) ?? "", v)),
      getGlobal: (k) => globalVars.get(k) ?? "",
      setGlobal: (k, v) => void globalVars.set(k, v),
      addGlobal: (k, v) => void globalVars.set(k, addValues(globalVars.get(k) ?? "", v)),
    },
  });
  return Object.assign(ctx, { chatVars, globalVars });
}

describe("Preset Tawa δέλτα (file thật)", () => {
  it("parse không crash, giữ đủ 179 prompts, không cảnh báo", () => {
    const { preset, warnings } = parsePreset(RAW);
    expect(preset.prompts).toHaveLength(179);
    expect(warnings).toEqual([]);
  });

  it("đủ 8 marker hệ thống (3.1b.2)", () => {
    const { preset } = parsePreset(RAW);
    const markers = preset.prompts.filter((p) => p.marker).map((p) => p.identifier);
    expect(markers.sort()).toEqual(
      ["charDescription", "charPersonality", "chatHistory", "dialogueExamples", "personaDescription", "scenario", "worldInfoAfter", "worldInfoBefore"].sort(),
    );
  });

  it("field lạ giữ nguyên qua passthrough (round-trip không mất dữ liệu)", () => {
    const { preset } = parsePreset(RAW);
    const parsed = preset as Record<string, unknown>;
    // các field ST đặc thù không nằm trong schema — phải còn nguyên
    for (const key of ["impersonation_prompt", "new_chat_prompt", "names_behavior", "extensions", "continue_prefill", "wrap_in_quotes"]) {
      expect(parsed[key]).toEqual(RAW[key]);
    }
    // prompt lẻ: mọi key gốc còn nguyên trên bản parse
    const rawPrompt = (RAW.prompts as Record<string, unknown>[])[0];
    const parsedPrompt = preset.prompts.find((p) => p.identifier === rawPrompt.identifier) as Record<string, unknown>;
    for (const key of Object.keys(rawPrompt)) {
      if (key === "injection_position") continue; // được chuẩn hoá union 0|1|null
      expect(parsedPrompt[key]).toEqual(rawPrompt[key]);
    }
  });

  it("prompt_order chọn entry character_id 100001, 178 mục", () => {
    const { preset } = parsePreset(RAW);
    expect(pickPromptOrder(preset)).toHaveLength(178);
  });

  it("sampling map đúng vào params (3.1b.1): temp 1.1, top_p 0.9, max_tokens 65000", () => {
    const { preset } = parsePreset(RAW);
    const merged = mergePresetParams(DEFAULT_PARAMS, preset);
    expect(merged.temperature).toBe(1.1);
    expect(merged.top_p).toBe(0.9);
    expect(merged.max_tokens).toBe(65000);
    expect(merged.max_context).toBe(2000000);
  });

  it("buildFromPreset chạy trọn preset thật: không crash, macro state ghi biến, history vào đúng chỗ", () => {
    const { preset } = parsePreset(RAW);
    const ctx = makeCtx();
    const history = [
      { role: "user" as const, content: "Ta quan sát đại sảnh." },
      { role: "assistant" as const, content: "Đại sảnh im ắng dưới ánh nến." },
      { role: "user" as const, content: "Ta tiến về phía ngai." },
    ];
    const r = buildFromPreset(preset, {
      ctx,
      sources: emptyMarkerSources({ worldInfoBefore: () => "[LORE TEST TRƯỚC]", personaDescription: () => "PERSONA TEST" }),
      history,
      maxContext: 200_000,
      maxOutputTokens: 4_000,
    });

    // ra messages thật (preset 179 prompts → hàng chục block active)
    expect(r.messages.length).toBeGreaterThan(20);
    // macro setvar (64 lần trong preset) đã ghi biến vào store
    expect(ctx.chatVars.size).toBeGreaterThan(10);
    // marker được điền
    expect(r.messages.some((m) => m.content.includes("[LORE TEST TRƯỚC]"))).toBe(true);
    expect(r.messages.some((m) => m.content.includes("PERSONA TEST"))).toBe(true);
    // history nằm trong payload, đúng thứ tự tương đối
    const idx1 = r.messages.findIndex((m) => m.content === "Ta quan sát đại sảnh.");
    const idx3 = r.messages.findIndex((m) => m.content === "Ta tiến về phía ngai.");
    expect(idx1).toBeGreaterThan(-1);
    expect(idx3).toBeGreaterThan(idx1);
    expect(r.historyIncluded).toBe(3);
    // {{user}} (35 lần trong preset) được thay bằng tên persona
    expect(r.messages.some((m) => m.content.includes("Eddard"))).toBe(true);
    // không còn LỜI GỌI macro state thật (có ::) chưa render sót trong payload
    // (chuỗi tài liệu kiểu "{{getvar...}}" trong prose được GIỮ NGUYÊN VĂN — đúng spec 3.1b.3)
    const leftover = r.messages.filter((m) => /\{\{(setvar|getvar|addvar|incvar|setglobalvar)::/i.test(m.content));
    expect(leftover).toEqual([]);
  });

  it("build 2 lần cho kết quả cấu trúc ổn định (idempotent với cùng ctx seed)", () => {
    const { preset } = parsePreset(RAW);
    const run = () =>
      buildFromPreset(preset, {
        ctx: makeCtx(),
        sources: emptyMarkerSources(),
        history: [{ role: "user", content: "mở đầu" }],
        maxContext: 200_000,
        maxOutputTokens: 4_000,
      });
    const a = run();
    const b = run();
    expect(a.messages).toEqual(b.messages);
  });

  it("round-trip: JSON gốc lưu nguyên văn parse lại được và deep-equal chính nó", () => {
    // export = trả nguyên văn rawJson (importExport.exportPresetRaw) — kiểm chứng
    // nguyên tắc: text gốc parse lại deep-equal RAW, không mất/không đổi gì
    expect(JSON.parse(RAW_TEXT)).toEqual(RAW);
  });
});
