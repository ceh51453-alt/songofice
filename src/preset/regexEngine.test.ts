/**
 * regexEngine — bám ngữ nghĩa SillyTavern. Các test này khoá đúng những chỗ đã
 * từng sai và làm preset thật chết im lặng.
 */
import { describe, expect, it } from "vitest";
import { compileRegex, applyRegexForSingleMessage } from "./regexEngine";
import { STRegexScriptSchema, type STRegexScript } from "./presetSchema";

function script(partial: Partial<STRegexScript>): STRegexScript {
  return STRegexScriptSchema.parse({ placement: [2], ...partial });
}

describe("compileRegex", () => {
  it('"/pattern/flags" tách đúng pattern và cờ', () => {
    const re = compileRegex("/<a>(.*?)<\\/a>/gsi")!;
    expect(re.source).toBe("<a>(.*?)<\\/a>");
    expect(re.flags.split("").sort().join("")).toBe("gis");
  });

  it("chuỗi TRẦN không tự thêm cờ (ST dùng new RegExp(chuỗi))", () => {
    const re = compileRegex("^([\\s\\S]*)$")!;
    expect(re.flags).toBe("");
    expect(re.global).toBe(false);
    expect(re.ignoreCase).toBe(false);
  });

  it("regex hỏng → null, không ném", () => {
    expect(compileRegex("/(/g")).toBeNull();
  });
});

describe("ngữ cảnh chạy (markdownOnly / promptOnly)", () => {
  const clean = script({ findRegex: "/<x>/g", replaceString: "", markdownOnly: true, promptOnly: true });

  it("bật CẢ HAI cờ → chạy ở hiển thị lẫn API (trước đây chết ở cả hai)", () => {
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [clean], true)).toBe("ab");
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [clean], false)).toBe("ab");
  });

  it("chỉ markdownOnly → chỉ hiển thị; chỉ promptOnly → chỉ API", () => {
    const md = script({ findRegex: "/<x>/g", replaceString: "", markdownOnly: true });
    const pr = script({ findRegex: "/<x>/g", replaceString: "", promptOnly: true });
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [md], true)).toBe("ab");
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [md], false)).toBe("a<x>b");
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [pr], false)).toBe("ab");
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [pr], true)).toBe("a<x>b");
  });

  it("disabled → không chạy", () => {
    const off = script({ findRegex: "/<x>/g", replaceString: "", disabled: true });
    expect(applyRegexForSingleMessage("a<x>b", "assistant", 0, [off], true)).toBe("a<x>b");
  });
});

describe("placement", () => {
  const s = (placement: number[]) => script({ placement, findRegex: "/x/g", replaceString: "Y" });

  it("placement RỖNG = không chạy ở đâu cả (ST: placement.includes)", () => {
    expect(applyRegexForSingleMessage("x", "assistant", 0, [s([])], true)).toBe("x");
    expect(applyRegexForSingleMessage("x", "user", 0, [s([])], true)).toBe("x");
  });

  it("1 = user, 2 = assistant; khối system của preset không bị đụng", () => {
    expect(applyRegexForSingleMessage("x", "user", 0, [s([1])], true)).toBe("Y");
    expect(applyRegexForSingleMessage("x", "assistant", 0, [s([1])], true)).toBe("x");
    expect(applyRegexForSingleMessage("x", "system", 9999, [s([1, 2])], true)).toBe("x");
  });
});

describe("chuỗi thay thế", () => {
  it("KHÔNG unescape \\n/\\r/\\t — mã JS nhúng trong replaceString phải nguyên vẹn", () => {
    // preset thật nhúng cả khối ```html``` có JS; "/\r?\n/" là regex literal.
    // Nếu engine đổi \r \n thành ký tự thật, script preset chết ngay khi nạp:
    // "Uncaught SyntaxError: Invalid regular expression: missing /".
    const s = script({
      findRegex: "/<choice>([\\s\\S]*?)<\\/choice>/g",
      replaceString: "<script>var p = text.split(/\\r?\\n/);<\/script>",
    });
    const out = applyRegexForSingleMessage("<choice>a</choice>", "assistant", 0, [s], true);
    expect(out).toContain("/\\r?\\n/");
    expect(out).not.toMatch(/\/\r?\n\?\n\//);
    expect(out.split("\n")).toHaveLength(1); // không sinh xuống dòng nào
  });

  it("$1 và {{match}} hoạt động, trimStrings cắt khỏi phần bắt được", () => {
    const s = script({
      findRegex: "/<b>(.*?)<\\/b>/g",
      replaceString: "[$1|{{match}}]",
      trimStrings: ["<", ">"],
    });
    expect(applyRegexForSingleMessage("<b>hi</b>", "assistant", 0, [s], true)).toBe("[hi|bhi/b]");
  });

  it("$ không phải nhóm giữ nguyên", () => {
    const s = script({ findRegex: "/x/g", replaceString: "giá $5 và $9" });
    expect(applyRegexForSingleMessage("x", "assistant", 0, [s], true)).toBe("giá $5 và $9");
  });
});

describe("minDepth / maxDepth", () => {
  it("chỉ áp trong khoảng depth chỉ định", () => {
    const s = script({ findRegex: "/x/g", replaceString: "Y", maxDepth: 1 });
    expect(applyRegexForSingleMessage("x", "assistant", 0, [s], true)).toBe("Y");
    expect(applyRegexForSingleMessage("x", "assistant", 1, [s], true)).toBe("Y");
    expect(applyRegexForSingleMessage("x", "assistant", 2, [s], true)).toBe("x");
  });
});
