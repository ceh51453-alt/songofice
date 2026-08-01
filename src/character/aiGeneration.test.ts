import { describe, expect, it } from "vitest";
import { sanitizeCanonCharacter, sanitizeWizardPatch } from "./aiGeneration";
import { CORE_STATS, type WizardData } from "./characterInit";

const current = {
  eraId: "war-of-five-kings",
  continent: "essos",
  culture: "ghiscari",
  houseId: null,
  originId: "commoner",
  originIds: ["commoner"],
  startingLocation: "",
} as WizardData;

describe("kiểm định dữ liệu do AI tạo", () => {
  it("loại ID không thuộc catalog/lục địa hiện tại", () => {
    const patch = sanitizeWizardPatch({
      culture: "first-men",
      houseId: "stark",
      originId: "wildling-hunter",
      startingLocation: "the-north",
      pointBuy: { "Sức Mạnh": 99, "Mưu Lược": 12 },
    }, current);
    expect(patch).not.toHaveProperty("culture");
    expect(patch).not.toHaveProperty("houseId");
    expect(patch).not.toHaveProperty("originId");
    expect(patch).not.toHaveProperty("startingLocation");
    expect(patch.pointBuy).toEqual({ "Sức Mạnh": 20 });
  });

  it("giữ ID Essos hợp lệ và bổ sung phạm vi cho xuất thân tùy chỉnh", () => {
    const patch = sanitizeWizardPatch({
      houseId: "meereen",
      culture: "ghiscari",
      originId: "custom",
      customOrigin: { name: "Người giữ cổng" },
    }, current);
    expect(patch).toMatchObject({
      houseId: "meereen",
      culture: "ghiscari",
      originId: "custom",
      customOrigin: { id: "custom", continentIds: ["essos"] },
    });
  });

  it("canon AI chỉ còn sáu chỉ số và kỹ năng hợp lệ", () => {
    const character = sanitizeCanonCharacter({
      id: "custom-ai-test",
      name: "Test",
      house: "Nhà Không Tồn Tại",
      coreStats: { "Sức Mạnh": 12, "Mưu Lược": 19 },
      skills: { command: 3, "khong-ton-tai": 9 },
    });
    expect(Object.keys(character.coreStats)).toEqual(CORE_STATS);
    expect(character.coreStats["Sức Mạnh"]).toBe(12);
    expect(character.house).toBe("Không Nhà");
    expect(character.skills).toEqual({ command: 3 });
  });
});
