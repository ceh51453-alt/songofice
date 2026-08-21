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
    expect(translateLegacyZh("Ngày 1 tháng 1 · Năm 298 AC · Mùa Thu")).toBe(
      "日 1 月 1 · 年 298 AC · 秋季",
    );
    expect(translateLegacyZh("1d6 +18 sát thương · +5 trúng · xuyên 6")).toBe(
      "1d6 +18 伤害 · +5 命中 · 穿透 6",
    );
  });

  it("does not alter text without Vietnamese UI terms", () => {
    expect(translateLegacyZh("Winterfell · 298 AC")).toBe("Winterfell · 298 AC");
  });

  it("translates Workflow task names, descriptions and dynamic aria labels", () => {
    expect(translateLegacyZh("Đưa Nhịp sống NPC ngoài cảnh lên trước")).toBe(
      "将场外 NPC 生活上移",
    );
    expect(translateLegacyZh("Sinh Tin Tức Thế Giới")).toBe("生成世界新闻");
    expect(translateLegacyZh("Mỗi ngày truyện")).toBe("每个剧情日");
  });

  it("translates character creation data without corrupting place names", () => {
    expect(translateLegacyZh("Quần Đảo Mùa Hè")).toBe("盛夏群岛");
    expect(translateLegacyZh("Tiền Nhân (First Men)")).toBe("先民（First Men）");
    expect(translateLegacyZh("Máu Valyria Cổ Đại")).toBe("古瓦雷利亚血脉");
    expect(translateLegacyZh("16 điểm")).toBe("16 点");
  });
});
