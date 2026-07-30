import { describe, expect, it } from "vitest";
import { MAP_MARKERS } from "./mapMarkers";
import { LORE_SEATS } from "./loreSeats";
import { ROADS } from "./routes";

describe("lore bản đồ Westeros", () => {
  it("thành trì canon có cấp và địa hình riêng", () => {
    for (const seat of LORE_SEATS) {
      expect(seat.level).toBeGreaterThanOrEqual(1);
      expect(seat.level).toBeLessThanOrEqual(5);
      expect(seat.roads.filter((road) => road.main)).toHaveLength(1);
    }
  });

  it("Vương Lộ dừng ở King's Landing, còn các tuyến Dorne có đường riêng", () => {
    const kingsroad = ROADS.find((road) => road.id === "kingsroad")!;
    expect(kingsroad.points.at(-1)).toEqual([690, 770]);
    expect(ROADS.find((road) => road.id === "boneway")?.points.at(-1)).toEqual([810, 1240]);
    expect(ROADS.find((road) => road.id === "greenblood-road")).toBeDefined();
  });

  it("mỗi lãnh địa có các thị trấn vệ tinh trên bản đồ", () => {
    const regions = new Set(MAP_MARKERS.filter((marker) => marker.type === "city").map((marker) => marker.regionId));
    for (const regionId of ["the-north", "the-iron-islands", "the-vale", "the-riverlands", "the-westerlands", "the-crownlands", "the-reach", "the-stormlands", "dorne"]) {
      expect(regions.has(regionId)).toBe(true);
    }
  });
});
