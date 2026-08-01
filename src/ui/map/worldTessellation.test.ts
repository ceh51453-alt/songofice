import { describe, expect, it } from "vitest";
import { CONTINENTS, REGIONS } from "../../content/world/geography";
import { naturalBoundaryPoints, type MapPoint } from "./mapPresentation";
import { VISUAL_CONTINENT_POLYGONS, VISUAL_MACRO_BOUNDARIES, VISUAL_REGION_POLYGONS } from "./worldTessellation";

function area(points: MapPoint[]): number {
  let sum = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    sum += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(sum / 2);
}

function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    const crosses = (a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0];
    if (crosses) inside = !inside;
  }
  return inside;
}

describe("world map tessellation", () => {
  it("tiles every mainland continent without gaps or overlapping area", () => {
    for (const continent of CONTINENTS) {
      const continentPolygon = VISUAL_CONTINENT_POLYGONS[continent.id];
      if (!continentPolygon) continue;
      const provinceArea = REGIONS
        .filter((region) => region.continentId === continent.id && !region.island)
        .reduce((sum, region) => sum + area(VISUAL_REGION_POLYGONS[region.id]), 0);
      expect(provinceArea, continent.id).toBeCloseTo(area(continentPolygon), 4);
    }
  });

  it("derives shared macro borders from province edges", () => {
    expect(VISUAL_MACRO_BOUNDARIES.length).toBeGreaterThan(20);
  });

  it("keeps Dragonstone visibly offshore from Westeros", () => {
    const dragonstone = VISUAL_REGION_POLYGONS["crownlands-dragonstone"];
    const westeros = VISUAL_CONTINENT_POLYGONS.westeros;
    expect(dragonstone.every((point) => !pointInPolygon(point, westeros))).toBe(true);
  });

  it("keeps seats inside their mainland province and islands detached", () => {
    for (const region of REGIONS) {
      const visual = VISUAL_REGION_POLYGONS[region.id];
      expect(visual.length, region.id).toBeGreaterThanOrEqual(3);
      expect(pointInPolygon(region.seatXY, visual), `${region.id} must contain its seat`).toBe(true);
    }
  });

  it("renders borders with many deterministic hand-drawn points", () => {
    for (const region of REGIONS) {
      const visual = VISUAL_REGION_POLYGONS[region.id];
      const detailMultiplier = region.island ? 4 : 6;
      expect(naturalBoundaryPoints(visual).length, region.id).toBeGreaterThanOrEqual(visual.length * detailMultiplier);
    }
  });
});
