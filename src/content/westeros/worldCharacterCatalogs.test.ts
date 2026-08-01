import { describe, expect, it } from "vitest";
import { REGIONS, REGIONS_BY_ID, resolveRegionId } from "../world/geography";
import { makeDefaultState, StatDataSchema } from "../../mvu/schema";
import { CULTURES, culturesForContinent } from "./cultures";
import { HOUSES_BY_ID, HOUSES_DATA, housesForContinent } from "./houses";
import { ORIGINS, originsForContinent } from "./origins";
import { STARTING_SKILLS_BY_ORIGIN } from "./skills";

describe("catalog nhân vật toàn thế giới", () => {
  it("mọi metadata vùng đều trỏ tới leaf province có thật", () => {
    for (const culture of CULTURES) {
      for (const regionId of culture.regionIds ?? []) {
        expect(REGIONS_BY_ID[regionId], `culture ${culture.id} → ${regionId}`).toBeDefined();
        expect(regionId, `culture ${culture.id} dùng alias`).toBe(resolveRegionId(regionId));
        expect(culture.continentIds, `culture ${culture.id} sai lục địa tại ${regionId}`).toContain(REGIONS_BY_ID[regionId].continentId);
      }
    }
    for (const faction of HOUSES_DATA) {
      for (const regionId of faction.regionIds) {
        expect(REGIONS_BY_ID[regionId], `faction ${faction.id} → ${regionId}`).toBeDefined();
        expect(regionId, `faction ${faction.id} dùng alias`).toBe(resolveRegionId(regionId));
        expect(faction.continentIds, `faction ${faction.id} sai lục địa tại ${regionId}`).toContain(REGIONS_BY_ID[regionId].continentId);
      }
    }
    for (const origin of ORIGINS) {
      for (const regionId of origin.regionIds ?? []) {
        expect(REGIONS_BY_ID[regionId], `origin ${origin.id} → ${regionId}`).toBeDefined();
        expect(regionId, `origin ${origin.id} dùng alias`).toBe(resolveRegionId(regionId));
        expect(origin.continentIds, `origin ${origin.id} sai lục địa tại ${regionId}`).toContain(REGIONS_BY_ID[regionId].continentId);
      }
    }
  });

  it("mỗi lục địa có văn hóa, thế lực và xuất thân riêng để wizard lọc", () => {
    for (const continentId of ["westeros", "essos", "ibben", "summer-isles", "sothoryos", "ulthos"]) {
      expect(culturesForContinent(continentId).length, `${continentId}: culture`).toBeGreaterThan(0);
      expect(housesForContinent(continentId).length, `${continentId}: faction`).toBeGreaterThan(0);
      expect(originsForContinent(continentId).length, `${continentId}: origin`).toBeGreaterThan(0);
    }
  });

  it("mọi controller mặc định của bản đồ có hồ sơ thế lực", () => {
    for (const region of REGIONS) {
      if (!region.defaultHouse) continue;
      expect(HOUSES_BY_ID[region.defaultHouse], `${region.id} → ${region.defaultHouse}`).toBeDefined();
    }
  });

  it("mọi xuất thân có gói kỹ năng khai báo rõ ràng", () => {
    for (const origin of ORIGINS) {
      expect(Object.prototype.hasOwnProperty.call(STARTING_SKILLS_BY_ORIGIN, origin.id), origin.id).toBe(true);
    }
  });

  it("lọc thế lực theo niên đại, không đưa phe hiện đại vào Đêm Trường", () => {
    const ancientEssos = housesForContinent("essos", { eraId: "long-night", year: -8000 });
    expect(ancientEssos.some((house) => house.id === "qarth")).toBe(true);
    expect(ancientEssos.some((house) => house.id === "braavos")).toBe(false);
    expect(ancientEssos.some((house) => house.id === "golden-company")).toBe(false);

    expect(housesForContinent("essos", { eraId: "aegon-conquest", year: -2 }).some((house) => house.id === "golden-company")).toBe(false);
    expect(housesForContinent("essos", { eraId: "war-of-five-kings", year: 298 }).some((house) => house.id === "golden-company")).toBe(true);
  });

  it("schema giữ nguyên thế lực và lục địa mới thay vì ép về Westeros/Không Nhà", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Nhà"] = "Volantis";
    state["Thông Tin Nhân Vật"]["Lục Địa"] = "essos";
    state["Thông Tin Nhân Vật"]["Tước Vị"] = "Triarch";
    const parsed = StatDataSchema.parse(state);
    expect(parsed["Thông Tin Nhân Vật"]).toMatchObject({
      "Nhà": "Volantis",
      "Lục Địa": "essos",
      "Tước Vị": "Triarch",
    });
  });
});
