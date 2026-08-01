import { describe, expect, it } from "vitest";
import { MAP_MARKERS } from "./mapMarkers";
import { LORE_SEATS } from "./loreSeats";
import { REGIONS_BY_ID } from "./regions";
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

  it("mọi marker trỏ tới leaf hợp lệ và các đại vùng Westeros vẫn có đô thị", () => {
    for (const marker of MAP_MARKERS) {
      expect(marker.regionId, marker.id).toBeTruthy();
      expect(REGIONS_BY_ID[marker.regionId!], marker.id).toBeDefined();
    }
    for (const realmId of ["the-north", "the-iron-islands", "the-vale", "the-riverlands", "the-westerlands", "the-crownlands", "the-reach", "the-stormlands", "dorne"]) {
      expect(MAP_MARKERS.some((marker) => marker.type === "city" && REGIONS_BY_ID[marker.regionId!]?.realmId === realmId)).toBe(true);
    }
    expect(MAP_MARKERS.find((marker) => marker.id === "dreadfort")?.regionId).toBe("north-dreadfort");
    expect(MAP_MARKERS.find((marker) => marker.id === "white-harbor")?.regionId).toBe("north-white-knife");
    expect(MAP_MARKERS.find((marker) => marker.id === "gulltown")?.regionId).toBe("vale-gulltown");
  });

  it("các trung tâm Essos và tuyến đường xuyên lục địa đã có trên bản đồ", () => {
    for (const id of ["braavos", "pentos", "volantis", "meereen", "qarth", "yi-ti", "asshai"]) {
      expect(MAP_MARKERS.find((marker) => marker.id === id)?.regionId).toBe(id);
    }
    expect(ROADS.find((road) => road.id === "dothraki-road")?.main).toBe(true);
    expect(ROADS.find((road) => road.id === "bone-mountains-road")?.points.length).toBeGreaterThan(3);
  });
});
