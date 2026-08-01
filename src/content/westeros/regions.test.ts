import { describe, expect, it } from "vitest";
import {
  CONTINENTS,
  MACRO_REGIONS,
  MACRO_REGIONS_BY_ID,
  REGIONS,
  REGIONS_BY_ID,
  areLandConnected,
  areSeaConnected,
  regionControlForEra,
  regionsForContinent,
  regionsForMacro,
  resolveRegionId,
  seatVisible,
} from "./regions";
import { CULTURES_BY_ID } from "./cultures";
import { HOUSES_BY_ID } from "./houses";

const LEGACY_REGION_IDS = [
  "the-north", "the-iron-islands", "the-vale", "the-riverlands", "the-westerlands",
  "the-crownlands", "the-reach", "the-stormlands", "dorne",
] as const;

describe("registry địa lý thế giới", () => {
  it("chia nhỏ Westeros và phủ đủ các lục địa chính", () => {
    expect(CONTINENTS.map((continent) => continent.id)).toEqual(expect.arrayContaining([
      "westeros", "essos", "ibben", "summer-isles", "sothoryos", "ulthos",
    ]));
    expect(regionsForContinent("westeros").length).toBeGreaterThanOrEqual(45);
    expect(regionsForContinent("essos").length).toBeGreaterThanOrEqual(30);
    expect(REGIONS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(REGIONS.map((region) => region.id)).size).toBe(REGIONS.length);
  });

  it("giữ chín id cũ làm tỉnh thủ phủ và aggregate macro không đếm trùng", () => {
    expect(REGIONS_BY_ID["the-north"].seat).toBe("Winterfell");
    expect(REGIONS_BY_ID.dorne.seat).toBe("Sunspear");

    const expectedPopulation: Record<string, number> = {
      "the-north": 4_000_000, "the-iron-islands": 1_500_000, "the-vale": 4_000_000,
      "the-riverlands": 5_500_000, "the-westerlands": 5_000_000,
      "the-crownlands": 2_000_000, "the-reach": 12_000_000,
      "the-stormlands": 2_500_000, dorne: 1_800_000,
    };
    for (const legacyId of LEGACY_REGION_IDS) {
      const macro = MACRO_REGIONS.find((entry) => entry.legacyRegionId === legacyId);
      expect(macro).toBeDefined();
      const children = regionsForMacro(macro!.id);
      expect(children.length).toBeGreaterThan(1);
      expect(children.reduce((sum, region) => sum + region.population, 0)).toBe(expectedPopulation[legacyId]);
    }
  });

  it("mọi leaf có parent hợp lệ và liên kết đất/biển đối xứng", () => {
    for (const region of REGIONS) {
      expect(MACRO_REGIONS_BY_ID[region.parentId]).toBeDefined();
      expect(region.polygonPx.length).toBeGreaterThanOrEqual(3);
      expect(region.population).toBeGreaterThanOrEqual(0);
      expect(region.landConnections.length + region.seaConnections.length).toBeGreaterThan(0);
      for (const neighborId of region.landConnections) {
        expect(REGIONS_BY_ID[neighborId]).toBeDefined();
        expect(areLandConnected(neighborId, region.id)).toBe(true);
      }
      for (const neighborId of region.seaConnections) {
        expect(REGIONS_BY_ID[neighborId]).toBeDefined();
        expect(areSeaConnected(neighborId, region.id)).toBe(true);
      }
    }
  });

  it("canonical id Essos khớp content và vẫn resolve alias draft", () => {
    for (const id of ["braavos", "pentos", "meereen", "qarth", "valyria", "yi-ti", "asshai", "naath", "ibben"]) {
      expect(REGIONS_BY_ID[id]).toBeDefined();
    }
    expect(resolveRegionId("essos-braavos")).toBe("braavos");
    expect(resolveRegionId("sothoryos-basilisk-isles")).toBe("basilisk-isles");
  });

  it("mọi thế lực và văn hóa địa lý đều tồn tại trong catalog nhân vật", () => {
    for (const macro of MACRO_REGIONS) {
      if (macro.defaultHouse) expect(HOUSES_BY_ID[macro.defaultHouse], `macro ${macro.id}: ${macro.defaultHouse}`).toBeDefined();
      for (const cultureId of macro.cultureIds) {
        expect(CULTURES_BY_ID[cultureId], `macro ${macro.id}: ${cultureId}`).toBeDefined();
      }
    }
    for (const region of REGIONS) {
      if (region.defaultHouse) expect(HOUSES_BY_ID[region.defaultHouse], `${region.id}: ${region.defaultHouse}`).toBeDefined();
      for (const cultureId of region.cultureIds) {
        expect(CULTURES_BY_ID[cultureId], `${region.id}: ${cultureId}`).toBeDefined();
      }
    }
  });
});

describe("chủ quyền và trọng trấn theo thời kỳ", () => {
  it("trải controller lịch sử xuống mọi tỉnh con Westeros", () => {
    const aegon = regionControlForEra("aegon-conquest");
    for (const region of regionsForMacro("macro-the-north")) expect(aegon[region.id]).toBe("stark");
    for (const region of regionsForMacro("macro-reach")) expect(aegon[region.id]).toBe("gardener");
    for (const region of regionsForMacro("macro-stormlands")) expect(aegon[region.id]).toBe("durrandon");
    for (const region of regionsForMacro("macro-crownlands")) expect(aegon[region.id]).toBe("");
  });

  it("Crownlands đổi triều đại, còn King's Landing ẩn trước khi tồn tại", () => {
    expect(regionControlForEra("war-of-five-kings")["the-crownlands"]).toBe("baratheon");
    expect(regionControlForEra("roberts-rebellion")["the-crownlands"]).toBe("targaryen");
    expect(seatVisible(REGIONS_BY_ID["the-crownlands"], "aegon-conquest")).toBe(false);
    expect(seatVisible(REGIONS_BY_ID["the-crownlands"], "war-of-five-kings")).toBe(true);
  });
});
