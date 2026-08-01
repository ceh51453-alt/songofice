/**
 * Presentation-only world tessellation.
 *
 * The content registry stores compact control polygons and accurate seat
 * anchors. For display we turn those anchors into a continent-wide Voronoi
 * atlas. Every mainland province therefore
 * shares the exact same edge with its neighbour, so fills never leave gaps or
 * overlap. Islands intentionally retain their detached source polygons.
 */
import { CONTINENTS, REGIONS, REGIONS_BY_ID } from "../../content/world/geography";
import { convexHull, type MapPoint } from "./mapPresentation";

interface Site {
  id: string;
  point: MapPoint;
}

/**
 * Hand-authored coast controls following the published geography of the known
 * world.  They are deliberately concave: a convex hull made Westeros, Essos
 * and Sothoryos look like balloons and swallowed their bays and peninsulas.
 * Province cells are clipped to these coastlines, so these points are also the
 * single source of truth for every coastal border.
 */
const COASTLINES: Partial<Record<string, MapPoint[]>> = {
  westeros: [
    [92, 0], [210, 5], [330, 0], [455, 9], [580, 0], [710, 8], [822, 0],
    [872, 38], [842, 82], [806, 116], [826, 166], [792, 214], [812, 270],
    [778, 328], [802, 382], [762, 438], [815, 474], [900, 482], [918, 524],
    [902, 568], [916, 612], [900, 654], [858, 674], [822, 662], [782, 696],
    [792, 718], [748, 742], [754, 770], [792, 800], [808, 820], [830, 858], [870, 900],
    [860, 958], [888, 1016], [850, 1068], [818, 1112], [842, 1160], [884, 1204],
    [900, 1260], [872, 1328], [822, 1384], [742, 1428], [650, 1458], [548, 1470],
    [452, 1462], [360, 1442], [282, 1408], [232, 1360], [210, 1300], [226, 1238],
    [194, 1182], [166, 1120], [176, 1058], [142, 1004], [124, 932], [142, 866],
    [132, 802], [150, 740], [164, 680], [174, 620], [196, 574], [254, 550],
    [334, 536], [374, 506], [350, 474], [302, 448], [244, 426], [210, 382],
    [194, 322], [174, 270], [182, 214], [150, 160], [136, 104], [112, 58],
  ],
  essos: [
    [1240, 300], [1260, 250], [1300, 210], [1340, 174], [1420, 178], [1510, 140],
    [1610, 122], [1710, 142], [1810, 112], [1910, 126], [2010, 100], [2110, 126],
    [2200, 150], [2290, 142], [2380, 174], [2470, 164], [2560, 132], [2660, 118],
    [2760, 136], [2860, 118], [2960, 144], [3060, 130], [3160, 152], [3260, 138],
    [3360, 160], [3460, 148], [3550, 174], [3600, 210], [3600, 1160], [3530, 1142],
    [3470, 1110], [3420, 1078], [3370, 1112], [3320, 1136], [3260, 1110],
    [3200, 1070], [3150, 1030], [3090, 996], [3040, 944], [3000, 894], [2960, 842],
    [2910, 820], [2860, 856], [2820, 914], [2780, 970], [2740, 1030], [2760, 1090],
    [2840, 1110], [2910, 1160], [2940, 1230], [2920, 1300], [2960, 1360],
    [2910, 1418], [2870, 1450], [2790, 1442], [2710, 1408], [2630, 1372],
    [2550, 1348], [2470, 1370], [2390, 1408], [2310, 1430], [2240, 1402],
    [2170, 1372], [2110, 1408], [2040, 1450], [1960, 1462], [1890, 1432],
    [1840, 1398], [1800, 1430], [1760, 1464], [1710, 1440], [1680, 1388],
    [1640, 1334], [1590, 1290], [1540, 1236], [1490, 1176], [1430, 1128],
    [1380, 1068], [1320, 1018], [1270, 958], [1230, 894], [1190, 830],
    [1280, 758], [1260, 690], [1270, 624], [1248, 560], [1260, 500],
    [1238, 438], [1252, 372], [1234, 328],
  ],
  sothoryos: [
    [1730, 1580], [1800, 1550], [1900, 1562], [1990, 1548], [2080, 1568],
    [2170, 1554], [2260, 1578], [2360, 1590], [2440, 1618], [2510, 1650],
    [2570, 1680], [2610, 1730], [2650, 1790], [2670, 1850], [2690, 1910],
    [2720, 1980], [2760, 2050], [2790, 2110], [2810, 2160], [2818, 2200],
    [2020, 2200], [2010, 2150], [1980, 2090], [1996, 2030], [1966, 1970],
    [1940, 1910], [1900, 1850], [1870, 1790], [1830, 1740], [1798, 1680],
    [1760, 1620], [1720, 1570],
  ],
  ulthos: [
    [3040, 1530], [3100, 1490], [3180, 1480], [3260, 1470], [3340, 1492],
    [3440, 1438], [3540, 1470], [3600, 1500], [3600, 2200], [3280, 2200],
    [3260, 2160], [3230, 2110], [3190, 2060], [3150, 2000], [3110, 1950],
    [3110, 1900], [3080, 1838], [3060, 1780], [3040, 1710], [3030, 1640],
    [3042, 1570],
  ],
};

/** Clip a polygon to the half-plane containing `site` and excluding `other`. */
function clipCloserToSite(polygon: MapPoint[], site: MapPoint, other: MapPoint): MapPoint[] {
  if (polygon.length < 3) return [];
  const a = 2 * (other[0] - site[0]);
  const b = 2 * (other[1] - site[1]);
  const c = other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2;
  const inside = (point: MapPoint) => a * point[0] + b * point[1] <= c + 0.0001;
  const output: MapPoint[] = [];

  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);

    if (currentInside) output.push(current);
    if (currentInside === nextInside) continue;

    const dx = next[0] - current[0];
    const dy = next[1] - current[1];
    const denominator = a * dx + b * dy;
    if (Math.abs(denominator) < 1e-9) continue;
    const t = (c - a * current[0] - b * current[1]) / denominator;
    output.push([current[0] + dx * t, current[1] + dy * t]);
  }

  return output;
}

function voronoiCells(sites: Site[], boundary: MapPoint[]): Record<string, MapPoint[]> {
  const cells: Record<string, MapPoint[]> = {};
  for (const site of sites) {
    let cell = [...boundary];
    for (const other of sites) {
      if (other.id === site.id) continue;
      cell = clipCloserToSite(cell, site.point, other.point);
      if (cell.length < 3) break;
    }
    cells[site.id] = cell;
  }
  return cells;
}

function islandShape(points: MapPoint[], id: string, center: MapPoint): MapPoint[] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const template: MapPoint[] = [
    [0.12, 0.08], [0.34, 0.01], [0.53, 0.09], [0.76, 0.03], [0.95, 0.19],
    [0.88, 0.38], [0.99, 0.57], [0.83, 0.78], [0.7, 0.96], [0.47, 0.87],
    [0.28, 0.99], [0.08, 0.82], [0.14, 0.61], [0.01, 0.42], [0.08, 0.23],
  ];
  const scale = id === "essos-stepstones" ? 0.48 : id === "crownlands-dragonstone" ? 0.5 : 0.62;
  return template.map(([x, y], index) => {
    const jitterX = ((((seed + index * 17) % 11) - 5) / 100) * width;
    const jitterY = ((((seed + index * 29) % 9) - 4) / 100) * height;
    const rawX = minX + x * width + jitterX;
    const rawY = minY + y * height + jitterY;
    return [center[0] + (rawX - center[0]) * scale, center[1] + (rawY - center[1]) * scale];
  });
}

function buildAtlas(): {
  regions: Record<string, MapPoint[]>;
  macroBoundaries: [MapPoint, MapPoint][];
  continents: Record<string, MapPoint[]>;
} {
  const regions: Record<string, MapPoint[]> = {};
  const continents: Record<string, MapPoint[]> = {};

  // Islands are deliberately not absorbed into a mainland tessellation.
  for (const region of REGIONS.filter((entry) => entry.island)) {
    regions[region.id] = islandShape(region.polygonPx, region.id, region.seatXY);
  }

  for (const continent of CONTINENTS) {
    const mainland = REGIONS.filter((region) => region.continentId === continent.id && !region.island);
    if (!mainland.length) continue;

    const coastline = COASTLINES[continent.id] ?? convexHull(mainland.flatMap((region) => region.polygonPx));
    continents[continent.id] = coastline;

    const regionSites: Site[] = mainland.map((region) => ({ id: region.id, point: region.seatXY }));
    const regionCells = voronoiCells(regionSites, coastline);
    for (const region of mainland) {
      const cell = regionCells[region.id];
      regions[region.id] = cell?.length >= 3 ? cell : region.polygonPx;
    }
  }

  // Defensive fallback: never lose a province if a future content edit gives
  // it an invalid grouping. This preserves playability while integrity tests
  // point at the malformed registry entry.
  for (const region of REGIONS) {
    if (!regions[region.id]) regions[region.id] = region.polygonPx;
  }

  const edgeMap = new Map<string, { edge: [MapPoint, MapPoint]; regionIds: string[] }>();
  const pointKey = (point: MapPoint) => `${point[0].toFixed(3)},${point[1].toFixed(3)}`;
  for (const region of REGIONS.filter((entry) => !entry.island)) {
    const polygon = regions[region.id];
    for (let index = 0; index < polygon.length; index++) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01) continue;
      const aKey = pointKey(a);
      const bKey = pointKey(b);
      const key = aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
      const existing = edgeMap.get(key);
      if (existing) existing.regionIds.push(region.id);
      else edgeMap.set(key, { edge: [a, b], regionIds: [region.id] });
    }
  }
  const macroBoundaries = [...edgeMap.values()]
    .filter(({ regionIds }) => regionIds.length === 2 && REGIONS_BY_ID[regionIds[0]]?.parentId !== REGIONS_BY_ID[regionIds[1]]?.parentId)
    .map(({ edge }) => edge);

  return { regions, macroBoundaries, continents };
}

const ATLAS = buildAtlas();

export const VISUAL_REGION_POLYGONS = ATLAS.regions;
export const VISUAL_MACRO_BOUNDARIES = ATLAS.macroBoundaries;
export const VISUAL_CONTINENT_POLYGONS = ATLAS.continents;
