import { beforeAll, describe, expect, it } from "vitest";
import { renderMacros } from "./macroEngine";
import { registerBuiltinMacros } from "./macros";
import { rollDice } from "./macros/core";
import { makeEmptyMacroContext, type MacroContext } from "./macroContext";
import { addValues } from "../state/variablesStore";

beforeAll(() => registerBuiltinMacros());

/** Context test có variables store giả trong memory. */
function makeCtx(partial?: Partial<MacroContext>): MacroContext & { chatVars: Map<string, string>; globalVars: Map<string, string> } {
  const chatVars = new Map<string, string>();
  const globalVars = new Map<string, string>();
  const ctx = makeEmptyMacroContext({
    char: "Tyrion Lannister",
    user: "Eddard",
    persona: "Lãnh chúa phương Bắc",
    description: "Mô tả thế giới",
    personality: "Trầm lặng",
    scenario: "Triều đình King's Landing",
    mesExamples: "<START>ví dụ",
    lastMessage: "tin nhắn cuối",
    rng: () => 0.5,
    now: new Date(2026, 6, 16, 14, 30),
    vars: {
      getChat: (k) => chatVars.get(k) ?? "",
      setChat: (k, v) => void chatVars.set(k, v),
      addChat: (k, v) => void chatVars.set(k, addValues(chatVars.get(k) ?? "", v)),
      getGlobal: (k) => globalVars.get(k) ?? "",
      setGlobal: (k, v) => void globalVars.set(k, v),
      addGlobal: (k, v) => void globalVars.set(k, addValues(globalVars.get(k) ?? "", v)),
    },
    ...partial,
  });
  return Object.assign(ctx, { chatVars, globalVars });
}

describe("macro cơ bản (mục 3.2)", () => {
  it("char/user/persona/description/personality/scenario/mesExamples/lastMessage", () => {
    const ctx = makeCtx();
    expect(renderMacros("{{char}} gặp {{user}}", ctx)).toBe("Tyrion Lannister gặp Eddard");
    expect(renderMacros("{{persona}}|{{description}}|{{personality}}|{{scenario}}", ctx)).toBe(
      "Lãnh chúa phương Bắc|Mô tả thế giới|Trầm lặng|Triều đình King's Landing",
    );
    expect(renderMacros("{{mesExamples}}", ctx)).toBe("<START>ví dụ");
    expect(renderMacros("{{lastMessage}}", ctx)).toBe("tin nhắn cuối");
  });

  it("tên macro không phân biệt hoa thường (như ST)", () => {
    const ctx = makeCtx();
    expect(renderMacros("{{CHAR}} và {{User}}", ctx)).toBe("Tyrion Lannister và Eddard");
  });

  it("{{newline}} và {{// comment}} bị loại", () => {
    const ctx = makeCtx();
    expect(renderMacros("a{{newline}}b", ctx)).toBe("a\nb");
    expect(renderMacros("a{{// đây là chú thích}}b", ctx)).toBe("ab");
  });

  it("{{trim}} nuốt whitespace/newline quanh nó", () => {
    const ctx = makeCtx();
    expect(renderMacros("dòng 1\n{{trim}}\ndòng 2", ctx)).toBe("dòng 1dòng 2");
    expect(renderMacros("x {{trim}} y", ctx)).toBe("xy");
  });

  it("{{random:a,b,c}} chọn theo rng; hỗ trợ cả {{random::a::b}}", () => {
    const ctx = makeCtx({ rng: () => 0.99 });
    expect(renderMacros("{{random:một,hai,ba}}", ctx)).toBe("ba");
    expect(renderMacros("{{random::alpha::beta}}", ctx)).toBe("beta");
    const ctx0 = makeCtx({ rng: () => 0 });
    expect(renderMacros("{{random:một,hai,ba}}", ctx0)).toBe("một");
  });

  it("{{roll:d20}} dùng rng — tái lập được", () => {
    const ctx = makeCtx({ rng: () => 0.5 });
    expect(renderMacros("{{roll:d20}}", ctx)).toBe("11"); // 1 + floor(0.5*20) = 11
  });

  it("{{time}}/{{date}} render từ ctx.now", () => {
    const ctx = makeCtx();
    expect(renderMacros("{{date}}", ctx)).toContain("2026");
    expect(renderMacros("{{time}}", ctx)).toMatch(/14[:.]30/);
  });

  it("macro KHÔNG đăng ký → thử tra biến (ST shorthand)", () => {
    const ctx = makeCtx();
    // Biến chưa set → trả rỗng, KHÔNG cảnh báo
    const out = renderMacros("giữ {{macro_bịa_đặt}} nguyên", ctx);
    expect(out).toBe("giữ  nguyên");
    expect(ctx.warnings.length).toBe(0);
  });

  it("{{tên_biến}} shorthand = {{getvar::tên_biến}} khi đã setvar trước", () => {
    const ctx = makeCtx();
    renderMacros("{{setvar::format::cổ trang}}", ctx);
    expect(renderMacros("Định dạng: {{format}}", ctx)).toBe("Định dạng: cổ trang");
  });

  it("macro lồng nhau render từ trong ra ngoài", () => {
    const ctx = makeCtx({ rng: () => 0.5 });
    renderMacros("{{setvar::kết quả::{{roll:d20}}}}", ctx);
    expect(ctx.chatVars.get("kết quả")).toBe("11");
  });
});

describe("rollDice", () => {
  it("parse các dạng d20 / 2d6 / 3d6+2 / d100-10", () => {
    const rng = () => 0.5;
    expect(rollDice("d20", rng)).toBe(11);
    expect(rollDice("2d6", rng)).toBe(8); // (1+3)*2
    expect(rollDice("3d6+2", rng)).toBe(14);
    expect(rollDice("d100-10", rng)).toBe(41);
  });
  it("ném lỗi với ký hiệu sai", () => {
    expect(() => rollDice("abc", () => 0.5)).toThrow();
  });
});

describe("macro state ST — nối variables store (3.1b.3)", () => {
  it("setvar → getvar theo THỨ TỰ trái→phải trong cùng lần render", () => {
    const ctx = makeCtx();
    const out = renderMacros("{{setvar::định dạng::cổ trang}}Định dạng: {{getvar::định dạng}}", ctx);
    expect(out).toBe("Định dạng: cổ trang");
  });

  it("setvar block TRƯỚC được getvar block SAU đọc (thứ tự prompt_order)", () => {
    const ctx = makeCtx();
    renderMacros("{{setvar::ngôn ngữ::tiếng Việt}}", ctx); // block "Khởi tạo biến"
    const out = renderMacros("Trả lời bằng {{getvar::ngôn ngữ}}", ctx); // block sau
    expect(out).toBe("Trả lời bằng tiếng Việt");
  });

  it("addvar cộng số / nối chuỗi đúng kiểu ST", () => {
    const ctx = makeCtx();
    renderMacros("{{setvar::điểm::10}}{{addvar::điểm::5}}", ctx);
    expect(ctx.chatVars.get("điểm")).toBe("15");
    renderMacros("{{setvar::danh sách::a}}{{addvar::danh sách::, b}}", ctx);
    expect(ctx.chatVars.get("danh sách")).toBe("a, b");
  });

  it("incvar/decvar ±1 và trả về giá trị mới", () => {
    const ctx = makeCtx();
    renderMacros("{{setvar::lượt::7}}", ctx);
    expect(renderMacros("{{incvar::lượt}}", ctx)).toBe("8");
    expect(renderMacros("{{decvar::lượt}}", ctx)).toBe("7");
  });

  it("setglobalvar/getglobalvar dùng vùng biến TOÀN CỤC riêng", () => {
    const ctx = makeCtx();
    renderMacros("{{setglobalvar::phiên bản::3.1}}", ctx);
    expect(ctx.globalVars.get("phiên bản")).toBe("3.1");
    expect(ctx.chatVars.has("phiên bản")).toBe(false);
    expect(renderMacros("{{getglobalvar::phiên bản}}", ctx)).toBe("3.1");
  });

  it("{{var::key::value}} ghi scratch — không đụng biến ván; {{var::key}} đọc scratch trước", () => {
    const ctx = makeCtx();
    renderMacros("{{var::tạm::xyz}}", ctx);
    expect(ctx.chatVars.size).toBe(0);
    expect(renderMacros("{{var::tạm}}", ctx)).toBe("xyz");
    // fallback: scratch không có → đọc biến ván
    renderMacros("{{setvar::chỉ ván::abc}}", ctx);
    expect(renderMacros("{{var::chỉ ván}}", ctx)).toBe("abc");
  });

  it("giá trị chứa :: được ghép lại nguyên vẹn", () => {
    const ctx = makeCtx();
    renderMacros("{{setvar::đường dẫn::a::b::c}}", ctx);
    expect(ctx.chatVars.get("đường dẫn")).toBe("a::b::c");
  });
});
