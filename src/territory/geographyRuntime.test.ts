import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { seedRegionControl } from "./territoryEngine";
import { MAP_TIERS, tierForZoom } from "../content/westeros/mapScale";
import { REGIONS } from "../content/westeros/regions";
import {
  canonicalSettlementPopulation,
  realmPopulation,
  regionPopulation,
  regionPopulationBreakdown,
  worldPopulation,
} from "./geographyRuntime";
import { holdingTerrain } from "./terrainProjection";
import { terrainOf } from "./localMap";

function northState(): StatData {
  const raw = makeDefaultState();
  raw["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  raw["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  seedRegionControl(raw, "war-of-five-kings", { createIfMissing: true });
  return StatDataSchema.parse(raw);
}

describe("phân cấp bản đồ năm tầng", () => {
  it("đặt đúng hai lớp Vương Quốc và Lãnh Địa giữa các lớp cũ", () => {
    expect(MAP_TIERS).toEqual(["world", "realm", "region", "demesne", "local"]);
    expect(tierForZoom(0.2)).toBe("world");
    expect(tierForZoom(0.48)).toBe("realm");
    expect(tierForZoom(1.1)).toBe("region");
  });
});

describe("sổ dân số dùng chung cho mọi tầng", () => {
  it("Riverrun, Oldtown, White Harbor và Dragonstone chỉ có một con số canon", () => {
    expect(canonicalSettlementPopulation("the-riverlands-seat", "Riverrun", "the-riverlands", "war-of-five-kings")).toBe(12_000);
    expect(canonicalSettlementPopulation("oldtown", "Oldtown", "reach-oldtown", "war-of-five-kings")).toBe(200_000);
    expect(canonicalSettlementPopulation("white-harbor", "White Harbor", "north-white-knife", "war-of-five-kings")).toBe(30_000);
    expect(canonicalSettlementPopulation("dragonstone", "Dragonstone", "crownlands-dragonstone", "war-of-five-kings")).toBe(3_000);
  });

  it("một biến động ở thành trì truyền lên lãnh thổ đúng một lần", () => {
    const state = northState();
    const before = regionPopulation(state, "the-north", "war-of-five-kings");
    state["Lãnh Địa"]["the-north-seat"]["Dân Số"] += 1_000;
    const after = regionPopulation(state, "the-north", "war-of-five-kings");
    expect(after - before).toBe(1_000);
    expect(regionPopulationBreakdown(state, "the-north", "war-of-five-kings").runtimeDelta).not.toBeNaN();
  });

  it("mở marker tĩnh thành hồ sơ runtime không cộng dân số lần thứ hai", () => {
    const state = northState();
    const regionId = "north-white-knife";
    const before = regionPopulation(state, regionId, "war-of-five-kings");
    const population = canonicalSettlementPopulation("white-harbor", "White Harbor", regionId, "war-of-five-kings");
    state["Lãnh Địa"]["white-harbor"] = {
      ...state["Lãnh Địa"]["the-north-seat"],
      "Mô Tả": "White Harbor",
      "Thuộc Vùng": regionId,
      "Dân Số": population,
    };
    expect(population).toBeGreaterThan(0);
    expect(regionPopulation(state, regionId, "war-of-five-kings")).toBe(before);
  });

  it("vương quốc và thế giới chỉ cộng các lãnh thổ con", () => {
    const state = northState();
    const north = REGIONS.filter((region) => region.realmId === "the-north")
      .reduce((sum, region) => sum + regionPopulation(state, region.id, "war-of-five-kings"), 0);
    expect(realmPopulation(state, "the-north", "war-of-five-kings")).toBe(north);
    expect(worldPopulation(state, "war-of-five-kings", "westeros")).toBe(
      REGIONS.filter((region) => region.continentId === "westeros")
        .reduce((sum, region) => sum + regionPopulation(state, region.id, "war-of-five-kings"), 0),
    );
  });
});

describe("địa hình hiển thị và địa hình engine là một nguồn", () => {
  it("tầng Lãnh Địa đọc đúng dominant terrain mà engine xây dựng dùng", () => {
    const state = northState();
    const holding = state["Lãnh Địa"]["the-north-seat"];
    expect(holdingTerrain("the-north-seat", holding)).toBe(terrainOf("the-north-seat", holding).dominant);
  });
});
