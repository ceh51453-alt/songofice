import { MAP_H, MAP_W, REGIONS } from "../world/geography";

/** Project world-canvas points into the legacy Leaflet latitude/longitude view. */
function canvasToLatLng([x, y]: [number, number]): [number, number] {
  const lat = 82 - (y / MAP_H) * 164;
  const lng = -166 + (x / MAP_W) * 296;
  return [Math.max(-82, Math.min(82, lat)), Math.max(-179, Math.min(179, lng))];
}

export const REGION_COORDINATES: Record<string, [number, number]> = Object.fromEntries(
  REGIONS.map((region) => [region.id, canvasToLatLng(region.seatXY)]),
);

// Keep the nine hand-calibrated Westeros positions exactly compatible.
Object.assign(REGION_COORDINATES, {
  // Toạ độ chính xác từ bản đồ Quartermaester
  "the-north": [66.05, -123.22],
  "the-iron-islands": [29.99, -153.28],
  "the-vale": [31.35, -102.66],
  "the-riverlands": [25.17, -118.13],
  "the-westerlands": [6.23, -151.26],  // Toạ độ từ user (Casterly Rock)
  "the-crownlands": [1.23, -106.17],   // Toạ độ từ user
  "the-reach": [-23.89, -138.87],        // Toạ độ từ user
  "the-stormlands": [-16.38, -91.23], 
  "dorne": [-43.71, -84.20],          
} satisfies Record<string, [number, number]>);
