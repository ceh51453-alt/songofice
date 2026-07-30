/**
 * Acceptance test với PRESET THẬT: "Myriad Stars.json" (Minh Nguyệt Thu Thanh)
 * — 182 prompts, 8 regex script trong extensions, macro state dày
 * (addvar×64, setvar×18, getvar×20, trim×70) + {{lastUserMessage}}.
 *
 * Mục tiêu: import → ăn ĐỦ prompt theo prompt_order, macro render hết,
 * regex script chạy đúng ngữ cảnh (UI vs API), không crash, round-trip nguyên vẹn.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePreset, pickPromptOrder } from "./presetSchema";
import { buildFromPreset } from "./buildFromPreset";
import { emptyMarkerSources } from "./markers";
import { mergePresetParams } from "./mergeParams";
import { applyRegexForSingleMessage, compileRegex } from "./regexEngine";
import { registerBuiltinMacros } from "../prompt/macros";
import { makeEmptyMacroContext, type MacroContext } from "../prompt/macroContext";
import { addValues } from "../state/variablesStore";
import { DEFAULT_PARAMS } from "../types/connection";

const RAW_TEXT = readFileSync(join(__dirname, "..", "..", "Myriad Stars.json"), "utf8");
const RAW = JSON.parse(RAW_TEXT) as Record<string, unknown>;

beforeAll(() => registerBuiltinMacros());

function makeCtx(): MacroContext & { chatVars: Map<string, string> } {
  const chatVars = new Map<string, string>();
  const globalVars = new Map<string, string>();
  const ctx = makeEmptyMacroContext({
    char: "Người Kể Chuyện",
    user: "Eddard",
    lastUserMessage: "Ta tiến về phía ngai.",
    lastCharMessage: "Đại sảnh im ắng dưới ánh nến.",
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
  return Object.assign(ctx, { chatVars });
}

const HISTORY = [
  { role: "user" as const, content: "Ta quan sát đại sảnh." },
  { role: "assistant" as const, content: "<content>Đại sảnh im ắng.</content><choice>A. Đi tiếp</choice>" },
  { role: "user" as const, content: "Ta tiến về phía ngai." },
];

function build() {
  return buildFromPreset(parsePreset(RAW).preset, {
    ctx: makeCtx(),
    sources: emptyMarkerSources({
      worldInfoBefore: () => "[LORE TRƯỚC]",
      personaDescription: () => "PERSONA TEST",
    }),
    history: HISTORY,
    maxContext: 200_000,
    maxOutputTokens: 4_000,
  });
}

describe("Preset Myriad Stars (file thật)", () => {
  it("parse không crash, giữ đủ 182 prompts, không cảnh báo", () => {
    const { preset, warnings } = parsePreset(RAW);
    expect(preset.prompts).toHaveLength(182);
    expect(warnings).toEqual([]);
  });

  it("đủ 8 marker hệ thống (3.1b.2)", () => {
    const { preset } = parsePreset(RAW);
    const markers = preset.prompts.filter((p) => p.marker).map((p) => p.identifier).sort();
    expect(markers).toEqual(
      ["charDescription", "charPersonality", "chatHistory", "dialogueExamples",
        "personaDescription", "scenario", "worldInfoAfter", "worldInfoBefore"].sort(),
    );
  });

  it("prompt_order: chọn entry 100001, ăn ĐỦ 75 block bật (kể cả block enabled=false trên object prompt)", () => {
    const { preset } = parsePreset(RAW);
    const order = pickPromptOrder(preset);
    expect(order).toHaveLength(175);
    const on = order.filter((o) => o.enabled);
    expect(on).toHaveLength(75);

    // Block ST bật nhưng object prompt có enabled=false — không được rụng
    const byId = new Map(preset.prompts.map((p) => [p.identifier, p]));
    const legacyOff = on.filter((o) => byId.get(o.identifier)?.enabled === false);
    expect(legacyOff.length).toBeGreaterThan(0);

    const r = build();
    const skipped = new Set(
      r.traces.filter((t) => t.skippedReason === "disabled").map((t) => t.identifier),
    );
    for (const o of legacyOff) expect(skipped.has(o.identifier)).toBe(false);
  });

  it("không tham chiếu identifier lạ (prompt_order khớp prompts)", () => {
    const r = build();
    expect(r.traces.filter((t) => t.skippedReason === "not_found")).toEqual([]);
    expect(r.warnings.filter((w) => w.includes("không tồn tại"))).toEqual([]);
  });

  it("build trọn preset: ra messages, macro state ghi biến, marker được điền", () => {
    const ctx = makeCtx();
    const r = buildFromPreset(parsePreset(RAW).preset, {
      ctx,
      sources: emptyMarkerSources({ worldInfoBefore: () => "[LORE TRƯỚC]", personaDescription: () => "PERSONA TEST" }),
      history: HISTORY,
      maxContext: 200_000,
      maxOutputTokens: 4_000,
    });
    expect(r.messages.length).toBeGreaterThan(20);
    expect(ctx.chatVars.size).toBeGreaterThan(5);
    expect(r.messages.some((m) => m.content.includes("[LORE TRƯỚC]"))).toBe(true);
    expect(r.messages.some((m) => m.content.includes("PERSONA TEST"))).toBe(true);
    expect(r.messages.some((m) => m.content.includes("Eddard"))).toBe(true); // {{user}} ×20
    expect(r.historyIncluded).toBe(3);
  });

  it("không sót lời gọi macro state chưa render trong payload", () => {
    const r = build();
    const leftover = r.messages.filter((m) =>
      /\{\{(setvar|getvar|addvar|incvar|decvar|setglobalvar)::/i.test(m.content),
    );
    expect(leftover).toEqual([]);
  });

  it("{{lastUserMessage}} render thành tin người chơi gần nhất", () => {
    const r = build();
    expect(r.messages.some((m) => m.content.includes("Ta tiến về phía ngai."))).toBe(true);
    expect(r.messages.some((m) => m.content.includes("{{lastUserMessage}}"))).toBe(false);
  });

  it("sampling map đúng vào params (temp 1, top_p 0.9, max_tokens 64000, ctx 2M)", () => {
    const merged = mergePresetParams(DEFAULT_PARAMS, parsePreset(RAW).preset);
    expect(merged.temperature).toBe(1);
    expect(merged.top_p).toBe(0.9);
    expect(merged.max_tokens).toBe(64_000);
    expect(merged.max_context).toBe(2_000_000);
  });

  /* ---- Regex scripts (extensions.regex_scripts) ---- */

  it("nạp đủ 8 regex script, mọi findRegex biên dịch được", () => {
    const scripts = parsePreset(RAW).preset.extensions?.regex_scripts ?? [];
    expect(scripts).toHaveLength(8);
    for (const s of scripts) expect(compileRegex(s.findRegex)).not.toBeNull();
  });

  it('script "Dọn dẹp thẻ chung" (markdownOnly + promptOnly) chạy ở CẢ hiển thị lẫn API', () => {
    const scripts = parsePreset(RAW).preset.extensions?.regex_scripts ?? [];
    const dirty = "<content>Nàng mỉm cười.</content><choice>A. Rời đi</choice>";

    const ui = applyRegexForSingleMessage(dirty, "assistant", 0, scripts, true);
    expect(ui).not.toContain("<content>");
    expect(ui).not.toContain("<choice>");
    expect(ui).toContain("Nàng mỉm cười.");

    const api = applyRegexForSingleMessage(dirty, "assistant", 0, scripts, false);
    expect(api).not.toContain("<content>");
    expect(api).not.toContain("<choice>");
  });

  it('"aether opus regex 1" bọc tin người chơi ĐÚNG MỘT LẦN (chuỗi trần không tự thêm cờ g)', () => {
    const scripts = parsePreset(RAW).preset.extensions?.regex_scripts ?? [];
    const out = applyRegexForSingleMessage("Ta rút kiếm.", "user", 0, scripts, false);
    expect(out.match(/<interactive_input>/g) ?? []).toHaveLength(1);
    expect(out).toContain("Ta rút kiếm.");
  });

  it("script disabled không chạy; placement quyết định vai nào bị áp", () => {
    const scripts = parsePreset(RAW).preset.extensions?.regex_scripts ?? [];
    // 4 script đầu đều disabled → khối thinking giữ nguyên khi hiển thị
    const thinking = "[metacognition]suy tính\n<content>lời kể</content>";
    expect(applyRegexForSingleMessage(thinking, "assistant", 0, scripts, true)).toContain("[metacognition]");
    // placement không chứa 0 (system) → khối prompt của preset không bị đụng
    const sys = "<content>giữ nguyên</content>";
    expect(applyRegexForSingleMessage(sys, "system", 9999, scripts, false)).toBe(sys);
  });

  it("regex chạy trong buildFromPreset: tin AI trong history bị dọn thẻ trước khi gửi API", () => {
    const r = build();
    // (khối prompt của preset vẫn chứa chữ "<choice>" vì đó là hướng dẫn định
    // dạng cho model — chỉ tin trong LỊCH SỬ mới bị regex dọn)
    const aiMsg = r.messages.find((m) => m.content.includes("Đại sảnh im ắng."));
    expect(aiMsg).toBeDefined();
    expect(aiMsg!.content).not.toContain("<choice>");
    expect(aiMsg!.content).not.toContain("<content>");
  });

  it("build 2 lần cho kết quả ổn định", () => {
    expect(build().messages).toEqual(build().messages);
  });

  it("round-trip: JSON gốc parse lại deep-equal chính nó", () => {
    expect(JSON.parse(RAW_TEXT)).toEqual(RAW);
  });
});
