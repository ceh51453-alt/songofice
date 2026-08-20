import { describe, expect, it } from "vitest";
import { translateLegacyZh } from "./LegacyUiTranslator";

describe("legacy Vietnamese UI compatibility", () => {
  it("translates complete legacy menu sentences", () => {
    expect(translateLegacyZh("Chọn Thời Kỳ, dựng nhân vật, bước vào loạn thế")).toBe(
      "选择时代、创建角色，踏入乱世",
    );
  });

  it("translates dynamic labels while preserving values and whitespace", () => {
    expect(translateLegacyZh("  Ngân Khố: 1.250 Vàng  ")).toBe("  国库: 1.250 黄金  ");
    expect(translateLegacyZh("Nhà Stark · 2 Lãnh thổ")).toBe("家族 Stark · 2 领土");
  });

  it("does not alter text without Vietnamese UI terms", () => {
    expect(translateLegacyZh("Winterfell · 298 AC")).toBe("Winterfell · 298 AC");
  });
});
