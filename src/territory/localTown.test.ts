import { describe, expect, it } from "vitest";
import { loreSeatFor } from "../content/westeros/loreSeats";
import { compassToAngle } from "../content/westeros/loreSeats";
import { terrainAtCell, localTerrainMap } from "./localTerrain";
import { townLayout } from "./localTown";

describe("quan lộ địa phương", () => {
  it("dừng ở mép biển của King's Landing thay vì chạy xuyên Vịnh Blackwater", () => {
    const lore = loreSeatFor("kings-landing");
    if (!lore) throw new Error("Thiếu lore King's Landing");
    const map = localTerrainMap("kings-landing", { terrain: lore.terrain, coastal: lore.coastal, lore });
    const town = townLayout(map, [], {
      wallRadius: 280,
      hasWall: false,
      loreRoads: lore.roads.map((road) => ({ name: road.name, main: road.main, angle: compassToAngle(road.dir) })),
    });

    for (const road of town.throughRoads) {
      for (const [x, y] of road.points) {
        expect(terrainAtCell(map, x, y)).not.toBe("Biển");
      }
    }
  });
});
