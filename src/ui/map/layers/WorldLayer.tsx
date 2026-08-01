/**
 * WorldLayer — TẦNG 3 (Bản Đồ Thế Giới). Bỏ HẾT chi tiết lẻ: không khu dân cư,
 * không quân, không đường bộ. Chỉ còn địa lý mảng, biên giới các thế lực, dải
 * khí hậu và hải trình xuyên lục địa — phục vụ địa chính trị.
 *
 * Biên giới ở đây KHÔNG phải dữ liệu riêng: các vùng cùng một Nhà cai trị được
 * gộp thành một mảng liền (viền trong bị xoá), nên bản đồ thế giới luôn khớp
 * tuyệt đối với chủ quyền mà Tầng 2 đang hiển thị.
 */
import { useMemo } from "react";
import type { StatData } from "../../../mvu/schema";
import { CONTINENTS, MACRO_REGIONS, REGIONS, MAP_W } from "../../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../../content/westeros/houses";
import { houseColor, NEUTRAL_COLOR } from "../../../content/westeros/houseColors";
import { balanceOfPower } from "../../../territory/mapAggregate";
import { CLIMATE_BANDS, SEA_LANES, ROADS, pathD } from "../../../content/westeros/routes";
import { markersForEra } from "../../../content/westeros/mapMarkers";
import {
  MAP_GOLD,
  MAP_INK,
  MAP_LABEL_INK,
  MAP_PARCHMENT,
  naturalBoundaryPath,
  polygonPath,
} from "../mapPresentation";
import { VISUAL_CONTINENT_POLYGONS, VISUAL_REGION_POLYGONS } from "../worldTessellation";

const REGION_PATHS: Record<string, string> = Object.fromEntries(
  REGIONS.map((region) => [region.id, naturalBoundaryPath(VISUAL_REGION_POLYGONS[region.id])]),
);
const REGION_FILL_PATHS: Record<string, string> = Object.fromEntries(
  REGIONS.map((region) => [region.id, polygonPath(VISUAL_REGION_POLYGONS[region.id])]),
);
const CONTINENT_PATHS: Record<string, string> = Object.fromEntries(
  CONTINENTS.map((continent) => [continent.id, naturalBoundaryPath(VISUAL_CONTINENT_POLYGONS[continent.id] ?? [])]),
);

interface Props {
  stat: StatData;
  eraId: string;
  zoom: number;
  showTerritory: boolean;
  onRealmClick: (regionId: string) => void;
}

export function WorldLayer({ stat, eraId, zoom, showTerritory, onRealmClick }: Props) {
  const realms = useMemo(() => balanceOfPower(stat, eraId), [stat, eraId]);
  /** mốc lục địa còn giữ ở Tầng 3: chỉ những địa danh khổng lồ (Tường Thành, thành Essos). */
  const landmarks = useMemo(
    () => markersForEra(eraId).filter((m) => m.type === "landmark" || (m.population ?? 0) >= 200000),
    [eraId],
  );

  return (
    <>
      <g pointerEvents="none" stroke={MAP_INK} strokeWidth={5.5} strokeLinejoin="round">
        {CONTINENTS.map((continent) => CONTINENT_PATHS[continent.id] ? (
          <path
            key={`landmass-${continent.id}`}
            d={CONTINENT_PATHS[continent.id]}
            fill={`color-mix(in srgb, ${continent.tint} 58%, #16252b)`}
            fillOpacity={0.98}
            stroke="#60737a"
            strokeOpacity={0.72}
          />
        ) : null)}
      </g>

      {/* ---- dải khí hậu ---- */}
      <g pointerEvents="none">
        {CLIMATE_BANDS.map((b) => (
          <g key={b.id}>
            <rect x={0} y={b.y1} width={MAP_W} height={b.y2 - b.y1} fill={b.tint} opacity={0.035} />
            <line x1={0} y1={b.y1} x2={MAP_W} y2={b.y1} stroke="#8b7650" strokeWidth={1} opacity={0.22} strokeDasharray="12 10" />
            <text x={40} y={b.y1 + 30} paintOrder="stroke" stroke={MAP_PARCHMENT} strokeWidth={3} style={{ fontFamily: "var(--font-body)", fontSize: 17, fill: MAP_LABEL_INK, opacity: 0.56, letterSpacing: "0.18em" }}>
              {b.name.toUpperCase()}
            </text>
          </g>
        ))}
      </g>

      {/* ---- địa lý mảng: lục địa gộp theo thế lực ---- */}
      {showTerritory &&
        REGIONS.map((r) => {
          const sov = stat["Chủ Quyền Lãnh Thổ"][r.id];
          const house = sov?.["Nhà Kiểm Soát"] ?? "";
          const col = house ? houseColor(house) : NEUTRAL_COLOR;
          return (
            <g key={r.id}>
              <path
                d={REGION_FILL_PATHS[r.id]}
                fill={`color-mix(in srgb, ${col.base} 68%, #1d2b2d)`}
                fillOpacity={sov?.["Là Của Người Chơi"] ? 0.96 : 0.9}
                onClick={() => onRealmClick(r.id)}
                className="cursor-pointer transition-all hover:brightness-110"
                style={{ transition: "fill 700ms ease" }}
              />
              <path
                d={REGION_PATHS[r.id]} fill="none" pointerEvents="none"
                stroke="#7f9398" strokeWidth={0.9} strokeOpacity={0.58} strokeLinejoin="round"
              />
            </g>
          );
        })}

      {/* ---- hải trình xuyên lục địa ---- */}
      <g pointerEvents="none" fill="none" strokeLinecap="round">
        {/* Tầng 3 chỉ giữ QUỐC LỘ lớn — trục xuyên lục địa, bỏ đường nhánh */}
        {ROADS.filter((r) => r.main).map((r) => (
          <path
            key={r.id} d={pathD(r.points)} fill="none"
            stroke="#9d7d49"
            strokeWidth={1.6} opacity={0.56}
          />
        ))}
        {SEA_LANES.map((l) => (
          <g key={l.id}>
            <path d={pathD(l.points)} stroke="#688b8f" strokeWidth={1.6} strokeDasharray="4 10" opacity={0.62} />
            <text style={{ fontFamily: "var(--font-body)", fontSize: 13, fill: "#58777a" }}>
              <textPath href={`#lane-${l.id}`} startOffset="30%">{l.name}</textPath>
            </text>
            <path id={`lane-${l.id}`} d={pathD(l.points)} fill="none" stroke="none" />
          </g>
        ))}
      </g>

      {/* ---- nhãn địa lý trung lập: châu lục và đại vùng ---- */}
      <g pointerEvents="none">
        {zoom < 0.36 && CONTINENTS.map((continent) => (
          <g key={`continent-${continent.id}`}>
            <text
              x={continent.labelXY[0]} y={continent.labelXY[1]}
              textAnchor="middle"
              paintOrder="stroke"
              stroke={MAP_PARCHMENT} strokeWidth={8} strokeOpacity={0.72}
              filter="url(#inkLabelShadow)"
              style={{ fontFamily: "var(--font-display)", fontSize: 58, fill: MAP_LABEL_INK, letterSpacing: "0.28em", fontWeight: "bold" }}
            >
              {continent.name.toUpperCase()}
            </text>
          </g>
        ))}
        {zoom >= 0.36 && zoom < 0.48 && MACRO_REGIONS.map((macro) => (
          <text
            key={`macro-${macro.id}`}
            x={macro.labelXY[0]} y={macro.labelXY[1] + 22}
            textAnchor="middle"
            paintOrder="stroke"
            stroke={MAP_PARCHMENT} strokeWidth={4.5} strokeOpacity={0.68}
            style={{ fontFamily: "var(--font-display)", fontSize: 21, fill: MAP_LABEL_INK, letterSpacing: "0.09em", fontWeight: 700 }}
          >
            {macro.name}
          </text>
        ))}
      </g>

      {/* ---- tên thế lực trên mảng lãnh thổ ---- */}
      {showTerritory && zoom >= 0.48 &&
        realms.filter((realm) => realm.share >= 0.045).map((realm) => {
          const anchor = realmAnchor(realm.regionIds);
          if (!anchor) return null;
          const label = HOUSES_BY_ID[realm.houseId]?.name ?? realm.houseId;
          const isPlayer = realm.regionIds.some((id) => stat["Chủ Quyền Lãnh Thổ"][id]?.["Là Của Người Chơi"]);
          return (
            <g key={`realm-${realm.houseId}`} pointerEvents="none" filter="url(#inkLabelShadow)">
              <text
                x={anchor[0]} y={anchor[1]} textAnchor="middle" paintOrder="stroke"
                stroke={MAP_PARCHMENT} strokeWidth={4.5} strokeOpacity={0.76}
                style={{ fontFamily: "var(--font-display)", fontSize: 23, fill: isPlayer ? "#76581b" : MAP_LABEL_INK, letterSpacing: "0.12em", fontWeight: "bold" }}
              >
                {label}
              </text>
            </g>
          );
        })}

      {/* ---- mốc lục địa ---- */}
      <g pointerEvents="none">
        {landmarks.map((m) => (
          <g key={`lm-${m.id}`}>
            <circle cx={m.x} cy={m.y} r={7} fill={MAP_GOLD} stroke={MAP_INK} strokeWidth={1.4} />
            <circle cx={m.x} cy={m.y} r={2.2} fill={MAP_INK} opacity={0.7} />
            <text x={m.x + 13} y={m.y + 6} paintOrder="stroke" stroke={MAP_PARCHMENT} strokeWidth={4} style={{ fontFamily: "var(--font-body)", fontSize: 15, fill: MAP_LABEL_INK, fontWeight: 700 }}>{m.name}</text>
          </g>
        ))}
      </g>
    </>
  );
}

/** Diện tích đa giác (shoelace) — dùng để chọn vùng "lớn nhất" của một thế lực. */
function polygonArea(p: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

/** Tên thế lực đặt giữa vùng lớn nhất nó nắm. */
function realmAnchor(regionIds: string[]): [number, number] | null {
  let best: { area: number; xy: [number, number] } | null = null;
  for (const id of regionIds) {
    const region = REGIONS.find((r) => r.id === id);
    if (!region) continue;
    const p = region.polygonPx;
    const area = polygonArea(p);
    if (best && area <= best.area) continue;
    best = {
      area,
      xy: [p.reduce((n, q) => n + q[0], 0) / p.length, p.reduce((n, q) => n + q[1], 0) / p.length],
    };
  }
  return best?.xy ?? null;
}
