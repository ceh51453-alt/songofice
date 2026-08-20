/**
 * Tầng Vương Quốc: biên de-jure và mức quy phục ở giữa bản đồ thế giới với
 * province hành chính. Tước địa/công quốc/hầu quốc là lớp pháp lý chồng lên
 * tầng này, không bị ép thành một mức zoom riêng.
 */
import { useMemo } from "react";
import type { StatData } from "../../../mvu/schema";
import { CONTINENTS, REGIONS } from "../../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../../content/westeros/houses";
import { deJureRealms } from "../../../territory/mapAggregate";
import { regionFill, type MapMode } from "../../../territory/territoryEngine";
import {
  MAP_GOLD,
  MAP_INK,
  MAP_LABEL_INK,
  MAP_PARCHMENT,
  naturalBoundaryPath,
  polygonPath,
} from "../mapPresentation";
import { VISUAL_CONTINENT_POLYGONS, VISUAL_REGION_POLYGONS } from "../worldTessellation";

const REGION_FILL_PATHS: Record<string, string> = Object.fromEntries(
  REGIONS.map((region) => [region.id, polygonPath(VISUAL_REGION_POLYGONS[region.id])]),
);
const CONTINENT_PATHS: Record<string, string> = Object.fromEntries(
  CONTINENTS.map((continent) => [continent.id, naturalBoundaryPath(VISUAL_CONTINENT_POLYGONS[continent.id] ?? [])]),
);

interface RealmBoundary {
  edge: [[number, number], [number, number]];
  realmIds: string[];
}

/** Chỉ giữ cạnh ngoài realm; biên province bên trong bị bỏ ở tầng này. */
function buildRealmBoundaries(): RealmBoundary[] {
  const edges = new Map<string, RealmBoundary>();
  const pointKey = ([x, y]: [number, number]) => `${x.toFixed(2)},${y.toFixed(2)}`;
  for (const region of REGIONS) {
    const polygon = VISUAL_REGION_POLYGONS[region.id] ?? region.polygonPx;
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      const aKey = pointKey(a);
      const bKey = pointKey(b);
      const key = aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
      const existing = edges.get(key);
      if (existing) existing.realmIds.push(region.realmId);
      else edges.set(key, { edge: [a, b], realmIds: [region.realmId] });
    }
  }
  return [...edges.values()].filter((boundary) =>
    boundary.realmIds.length === 1 || new Set(boundary.realmIds).size > 1,
  );
}

const REALM_BOUNDARIES = buildRealmBoundaries();

interface Props {
  stat: StatData;
  eraId: string;
  mode: MapMode;
  zoom: number;
  showTerritory: boolean;
  onRealmClick: (realmId: string, anchor: [number, number]) => void;
}

function shortPopulation(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString("vi-VN")}k`;
  return value.toLocaleString("vi-VN");
}

export function RealmLayer({ stat, eraId, mode, zoom, showTerritory, onRealmClick }: Props) {
  const realms = useMemo(() => deJureRealms(stat, eraId), [stat, eraId]);
  const labelledRealms = realms.filter((realm) =>
    zoom >= 0.58
      ? realm.population >= 120_000 || realm.totalRegions > 1
      : realm.population >= 500_000 || realm.totalRegions >= 3,
  );

  return (
    <>
      <g pointerEvents="none" stroke={MAP_INK} strokeWidth={5.5} strokeLinejoin="round">
        {CONTINENTS.map((continent) => CONTINENT_PATHS[continent.id] ? (
          <path
            key={`realm-landmass-${continent.id}`}
            d={CONTINENT_PATHS[continent.id]}
            fill={`color-mix(in srgb, ${continent.tint} 58%, #16252b)`}
            fillOpacity={0.98}
            stroke="#60737a"
            strokeOpacity={0.72}
          />
        ) : null)}
      </g>

      {showTerritory && realms.map((realm) => {
        const dominantName = HOUSES_BY_ID[realm.controller]?.name ?? realm.controller;
        return (
          <g
            key={realm.realmId}
            className="cursor-pointer transition-all hover:brightness-110"
            onClick={() => onRealmClick(realm.realmId, realm.anchor)}
          >
            <title>
              {`${realm.name} · ${realm.totalRegions} lãnh thổ · ${realm.controlledStrongholds}/${realm.totalStrongholds} thành nằm trong mạng kiểm soát · ${shortPopulation(realm.population)} dân${dominantName ? ` · thế lực trội: ${dominantName}` : ""}`}
            </title>
            {realm.regionIds.map((regionId) => {
              const fill = regionFill(stat, regionId, mode);
              return (
                <g key={`${realm.realmId}-${regionId}`}>
                  <path
                    d={REGION_FILL_PATHS[regionId]}
                    fill={`color-mix(in srgb, ${fill.color} 64%, #233134)`}
                    fillOpacity={0.9}
                    stroke="none"
                  />
                  {fill.striped && (
                    <path
                      d={REGION_FILL_PATHS[regionId]}
                      fill="url(#contested)"
                      fillOpacity={0.82}
                      stroke="none"
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      <g fill="none" pointerEvents="none" strokeLinejoin="round" strokeLinecap="round">
        {REALM_BOUNDARIES.map((boundary, index) => {
          const playerEdge = boundary.realmIds.some((realmId) => realms.find((realm) => realm.realmId === realmId)?.isPlayerRealm);
          const [[x1, y1], [x2, y2]] = boundary.edge;
          return (
            <path
              key={`realm-boundary-${index}`}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={playerEdge ? MAP_GOLD : "#9aabad"}
              strokeWidth={playerEdge ? 3.5 : 2.3}
              strokeOpacity={playerEdge ? 0.94 : 0.76}
            />
          );
        })}
      </g>

      <g pointerEvents="none">
        {labelledRealms.map((realm) => (
          <g key={`realm-label-${realm.realmId}`} filter="url(#inkLabelShadow)">
            <text
              x={realm.anchor[0]}
              y={realm.anchor[1] - 9}
              textAnchor="middle"
              paintOrder="stroke"
              stroke={MAP_PARCHMENT}
              strokeWidth={6}
              strokeOpacity={0.78}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: realm.totalRegions >= 3 ? 27 : 19,
                fill: MAP_LABEL_INK,
                letterSpacing: "0.08em",
                fontWeight: 800,
              }}
            >
              {realm.name.toUpperCase()}
            </text>
            <text
              x={realm.anchor[0]}
              y={realm.anchor[1] + 18}
              textAnchor="middle"
              paintOrder="stroke"
              stroke={MAP_PARCHMENT}
              strokeWidth={4}
              strokeOpacity={0.75}
              style={{ fontFamily: "var(--font-body)", fontSize: 15, fill: MAP_LABEL_INK, fontWeight: 700 }}
            >
              {realm.controlledStrongholds > 0
                ? `${shortPopulation(realm.population)} dân · ${realm.controlledStrongholds}/${realm.totalStrongholds} thành trong mạng kiểm soát`
                : `${shortPopulation(realm.population)} dân · ${realm.totalRegions} lãnh thổ`}
            </text>
          </g>
        ))}
      </g>
    </>
  );
}
