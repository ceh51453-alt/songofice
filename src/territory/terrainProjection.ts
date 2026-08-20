/** Cầu nối địa hình dùng chung giữa UI Lãnh Địa và engine xây dựng Thành Trì. */
import type { StatData, Terrain } from "../mvu/schema";
import type { LocalTerrain } from "../content/westeros/terrain";
import { terrainOf } from "./localMap";

type Holding = StatData["Lãnh Địa"][string];

/** Địa hình hiển thị của một thành trì luôn là đúng bản mà engine xây dựng dùng. */
export function holdingTerrain(holdingId: string, holding: Holding | undefined): Terrain {
  return terrainOf(holdingId, holding).dominant;
}

export interface TerrainShare {
  terrain: LocalTerrain;
  cells: number;
  share: number;
}

/** Phân bố 25×25 của tầng Lãnh Địa, lấy thẳng từ terrainOf — không dựng bảng khác. */
export function holdingTerrainDistribution(holdingId: string, holding: Holding | undefined): TerrainShare[] {
  const map = terrainOf(holdingId, holding);
  const counts = new Map<LocalTerrain, number>();
  for (const terrain of map.grid) counts.set(terrain, (counts.get(terrain) ?? 0) + 1);
  return [...counts.entries()]
    .map(([terrain, cells]) => ({ terrain, cells, share: cells / map.grid.length }))
    .sort((a, b) => b.cells - a.cells);
}

