import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { seedRegionControl } from "../territory/territoryEngine";
import { regionPopulation } from "../territory/geographyRuntime";
import { marketDepthParams } from "./market";
import { INCOME_PER_CAPITA, prosperityOf, regionGrossProduct } from "./taxation";

const REGION_ID = "the-north";
const ERA_ID = "war-of-five-kings";

function northernState(): StatData {
  const raw = makeDefaultState();
  raw["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  raw["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  raw["Cài Đặt Ván"]["Thời Kỳ"] = ERA_ID;
  seedRegionControl(raw, ERA_ID, { createIfMissing: true });
  return StatDataSchema.parse(raw);
}

describe("consumer kinh tế dùng chung sổ dân số runtime", () => {
  it("biến động dân số thành trì làm thay đổi độ sâu thị trường", () => {
    const state = northernState();
    const holding = state["Lãnh Địa"]["the-north-seat"];
    const before = marketDepthParams(state, REGION_ID);

    holding["Dân Số"] += 2_000_000;
    const after = marketDepthParams(state, REGION_ID);

    expect(after.liquidity).toBeGreaterThan(before.liquidity);
    expect(after.spread).toBeLessThan(before.spread);
  });

  it("tổng sản phẩm vùng nhân với dân số runtime, không nhân bảng canon tĩnh", () => {
    const state = northernState();
    const holding = state["Lãnh Địa"]["the-north-seat"];
    holding["Dân Số"] += 123_456;
    // Bỏ hệ số quản trị khỏi phép thử này để cô lập đúng nguồn dân số.
    delete state["Chủ Quyền Lãnh Thổ"][REGION_ID]["Quản Trị"];

    const population = regionPopulation(state, REGION_ID, ERA_ID);
    const expected = Math.round(population * INCOME_PER_CAPITA * prosperityOf(holding));

    expect(regionGrossProduct(state, REGION_ID)).toBe(expected);
  });
});
