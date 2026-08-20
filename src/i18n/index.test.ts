import { describe, expect, it } from "vitest";
import viCommon from "./locales/vi/common.json";
import zhCnCommon from "./locales/zh-CN/common.json";
import { outputLanguageInstruction, translate } from "./index";

type JsonValue = string | { [key: string]: JsonValue };

function flattenKeys(value: JsonValue, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("Chinese localization", () => {
  it("contains every key in the Vietnamese source bundle", () => {
    const chineseKeys = new Set(flattenKeys(zhCnCommon));
    expect(flattenKeys(viCommon).filter((key) => !chineseKeys.has(key))).toEqual([]);
  });

  it("translates text and preserves interpolation", () => {
    expect(translate("zh-CN", "conn.language")).toBe("语言");
    expect(translate("zh-CN", "chat.retrying", { n: 2, total: 5 })).toBe(
      "正在重试……（第 2/5 次）",
    );
  });

  it("forces generated story content to use Simplified Chinese", () => {
    const instruction = outputLanguageInstruction("zh-CN");
    expect(instruction).toContain("简体中文");
    expect(instruction).toContain("不要输出越南语");
  });
});
