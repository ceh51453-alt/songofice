/**
 * RegionLayer — TẦNG 2 (Bản Đồ Lãnh Thổ). Bỏ lưới 5 m, gom cụm dữ liệu Tầng 1
 * thành khu dân cư; phục vụ hành chính, điều quân, giao thương.
 *
 * Bộ lọc hiển thị theo zoom (regionLod): zoom xa chỉ còn biên giới + trọng trấn,
 * zoom gần mới bóc tách thị trấn rồi làng mạc — chống rác hình ảnh.
 * Lãnh địa NGƯƠI quản trị luôn hiện (kèm số công trình) và bấm vào là xuống Tầng 1.
 */
import { useMemo } from "react";
import type { StatData } from "../../../mvu/schema";
import { CONTINENTS, MACRO_REGIONS, REGIONS, REGIONS_BY_ID, regionForLocation } from "../../../content/westeros/regions";
import { regionFill, type MapMode } from "../../../territory/territoryEngine";
import { allSettlements, type Settlement } from "../../../territory/mapAggregate";
import { regionLod } from "../../../content/westeros/mapScale";
import { ROADS, RIVERS, SEA_LANES, pathD } from "../../../content/westeros/routes";
import { markersForEra } from "../../../content/westeros/mapMarkers";
import { armyMarkerPosition } from "../../../strategy/army";
import { PLAYER_HEAT_COLOR } from "../../../content/westeros/houseColors";
import {
  MAP_GOLD,
  MAP_INK,
  MAP_LABEL_INK,
  MAP_PARCHMENT,
  naturalBoundaryPath,
  polygonPath,
  polygonCentroid,
} from "../mapPresentation";
import { VISUAL_CONTINENT_POLYGONS, VISUAL_REGION_POLYGONS } from "../worldTessellation";

const REGION_PATHS: Record<string, string> = Object.fromEntries(
  REGIONS.map((region) => [region.id, naturalBoundaryPath(VISUAL_REGION_POLYGONS[region.id])]),
);
const REGION_FILL_PATHS: Record<string, string> = Object.fromEntries(
  REGIONS.map((region) => [region.id, polygonPath(VISUAL_REGION_POLYGONS[region.id])]),
);
const REGION_CENTERS: Record<string, [number, number]> = Object.fromEntries(
  REGIONS.map((region) => [region.id, polygonCentroid(VISUAL_REGION_POLYGONS[region.id])]),
);
const CONTINENT_PATHS: Record<string, string> = Object.fromEntries(
  CONTINENTS.map((continent) => [continent.id, naturalBoundaryPath(VISUAL_CONTINENT_POLYGONS[continent.id] ?? [])]),
);

interface Props {
  stat: StatData;
  mode: MapMode;
  zoom: number;
  today: number;
  eraId: string;
  showTerritory: boolean;
  showMarkers: boolean;
  onRegionClick: (regionId: string) => void;
  onSettlementClick: (s: Settlement) => void;
}

export function RegionLayer({
  stat, mode, zoom, today, eraId, showTerritory, showMarkers, onRegionClick, onSettlementClick,
}: Props) {
  const lod = regionLod(zoom);
  const settlements = useMemo(() => allSettlements(stat, eraId), [stat, eraId]);
  const units = stat["Biên Chế Quân Sự"];
  const minLabelPriority = zoom < 0.75 ? 5 : zoom < 1.05 ? 4 : zoom < 1.45 ? 3 : 1;

  /** bộ lọc LOD: khu ngươi quản trị không bao giờ bị ẩn. */
  const visible = settlements.filter((s) => {
    if (s.ownedByPlayer || s.managed) return true;
    if (s.strategicStronghold) return zoom >= 1.32;
    if (s.seat) return lod.seats;
    if (s.kind === "Thành Phố") return lod.towns;
    if (s.kind === "Thành Trì" || s.kind === "Thị Trấn") return lod.towns;
    return lod.villages;
  });
  const labelledSettlementIds = selectSettlementLabels(visible, lod.settlementLabels, zoom);

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

      {/* ---- chủ quyền vùng ---- */}
      {showTerritory &&
        REGIONS.map((r) => {
          const fill = regionFill(stat, r.id, mode);
          const path = REGION_PATHS[r.id];
          const fillPath = REGION_FILL_PATHS[r.id];
          const justChanged = fill.changedDay > 0 && fill.changedDay === today;
          return (
            <g key={r.id}>
              <path
                d={fillPath}
                fill={`color-mix(in srgb, ${fill.color} 68%, #1d2b2d)`}
                style={{ transition: "fill 700ms ease, fill-opacity 700ms ease, stroke 300ms ease" }}
                fillOpacity={fill.isPlayer ? 0.96 : 0.9}
                onClick={() => onRegionClick(r.id)}
                className="cursor-pointer transition-all hover:brightness-110"
              />
              {fill.striped && (
                <path
                  d={fillPath}
                  fill="url(#contested)"
                  fillOpacity={0.82}
                  pointerEvents="none"
                />
              )}
              <path
                d={path} fill="none"
                stroke={fill.isPlayer ? "#b6c7ca" : "#7f9398"}
                strokeWidth={fill.isPlayer ? 1.8 : 0.9}
                strokeOpacity={fill.isPlayer ? 0.88 : 0.58}
                strokeLinejoin="round" strokeLinecap="round" pointerEvents="none"
              />
              {justChanged && (
                <path d={path} fill="none" stroke={fill.color} strokeWidth={4} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
              )}
              {fill.status === "Bị Vây" && (
                <path d={path} fill="none" stroke="var(--danger)" strokeWidth={3} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
              )}
            </g>
          );
        })}

      {/* ---- sông chính ---- */}
      <g pointerEvents="none" fill="none" strokeLinecap="round">
        {RIVERS.map((r) => (
          <g key={r.id}>
            <path d={pathD(r.points)} stroke="rgba(66,80,75,0.42)" strokeWidth={r.id === "trident-fork" ? 4 : 5} />
            <path d={pathD(r.points)} stroke="#668f96" strokeWidth={r.id === "trident-fork" ? 1.8 : 2.4} opacity={0.82} />
          </g>
        ))}
      </g>

      {/* ---- đường quốc lộ + hải trình ---- */}
      {lod.roads && (
        <g pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* quốc lộ lớn vẽ đậm và liền nét — chúng chạy suốt chiều dài lãnh thổ */}
          {ROADS.map((r) => (
            <g key={r.id}>
              <path
                d={pathD(r.points)}
                stroke={r.main ? "#91a0a1" : "#738487"}
                strokeWidth={r.main ? 1.7 : 1.1}
                strokeDasharray={r.main ? undefined : "9 5"}
                opacity={r.main ? 0.92 : 0.78}
              />
            </g>
          ))}
          {SEA_LANES.map((l) => (
            <path key={l.id} d={pathD(l.points)} stroke="#6f9295" strokeWidth={1.4} strokeDasharray="3 9" opacity={0.6} />
          ))}
        </g>
      )}

      {/* ---- tên vùng ---- */}
      {showTerritory && zoom >= 0.72 && zoom < 0.95 && (
        <g pointerEvents="none">
          {MACRO_REGIONS.map((macro) => (
            <text
              key={`macro-lbl-${macro.id}`}
              x={macro.labelXY[0]} y={macro.labelXY[1]}
              textAnchor="middle"
              paintOrder="stroke"
              stroke={MAP_PARCHMENT} strokeWidth={8} strokeOpacity={0.72}
              style={{ fontFamily: "var(--font-display)", fontSize: 30, fill: MAP_LABEL_INK, letterSpacing: "0.12em", fontWeight: "bold" }}
            >
              {macro.name}
            </text>
          ))}
        </g>
      )}
      {showTerritory && lod.regionLabels && zoom >= 0.95 && zoom < 1.35 &&
        REGIONS.filter((r) => r.labelPriority >= minLabelPriority).map((r) => {
          const [cx, cy] = REGION_CENTERS[r.id];
          const fontSize = r.labelPriority >= 5 ? 21 : r.labelPriority >= 3 ? 17 : 14;
          return (
            <g key={`lbl-${r.id}`} pointerEvents="none" filter="url(#inkLabelShadow)">
              <text
                x={cx} y={cy} textAnchor="middle" paintOrder="stroke"
                stroke={MAP_PARCHMENT} strokeWidth={4.5} strokeOpacity={0.78}
                style={{ fontFamily: "var(--font-display)", fontSize, fill: MAP_LABEL_INK, letterSpacing: "0.055em", fontWeight: "bold" }}
              >
                {r.name}
              </text>
            </g>
          );
        })}

      {/* ---- khu dân cư (gom cụm từ Tầng 1) ---- */}
      {showMarkers && (
        <g>
          {visible.map((s) => (
            <SettlementGlyph
              key={s.id}
              s={s}
              label={labelledSettlementIds.has(s.id)}
              detail={zoom >= 1.8}
              onClick={() => onSettlementClick(s)}
            />
          ))}
        </g>
      )}

      {/* ---- quân đang đóng / hành quân ---- */}
      {showMarkers &&
        Object.entries(units).map(([name, u]) => {
          if (u["Số Lượng"] <= 0) return null;
          const pos = armyMarkerPosition(u);
          if (!pos) return null;
          const from = REGIONS_BY_ID[u["Lãnh Địa Đồn Trú"]];
          const to = u["Đang Di Chuyển Đến"] ? REGIONS_BY_ID[u["Đang Di Chuyển Đến"]] : null;
          return (
            <g key={`army-${name}`} pointerEvents="none">
              {from && to && (
                <line
                  x1={from.seatXY[0]} y1={from.seatXY[1]} x2={to.seatXY[0]} y2={to.seatXY[1]}
                  stroke="var(--accent-text)" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.6}
                />
              )}
              <g transform={`translate(${pos[0]}, ${pos[1]})`}>
                <circle r={7} fill="#1a1e26" stroke="var(--accent-text)" strokeWidth={1.6} />
                <path d="M-3 2 L0 -4 L3 2 M-3 -1 h6" stroke="var(--accent-text)" strokeWidth={1.2} fill="none" />
              </g>
            </g>
          );
        })}

      <PlayerMarker loc={stat["Thế Giới"]["Vị Trí"]} eraId={eraId} />
    </>
  );
}

function selectSettlementLabels(settlements: Settlement[], showLabels: boolean, zoom: number): Set<string> {
  const selected = new Set<string>();
  const boxes: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  const candidates = settlements
    .filter((settlement) => (
      (!settlement.strategicStronghold || zoom >= 1.62)
      && (showLabels || (zoom >= 1 && (settlement.managed || settlement.ownedByPlayer)))
    ))
    .sort((a, b) =>
      Number(b.ownedByPlayer) - Number(a.ownedByPlayer)
      || Number(b.managed) - Number(a.managed)
      || Number(b.seat) - Number(a.seat)
      || b.population - a.population,
    );
  const padding = Math.max(8, 18 / Math.max(zoom, 0.5));

  for (const settlement of candidates) {
    const [x, y] = settlement.world;
    const box = { left: x + 10, right: x + 22 + settlement.name.length * 8, top: y - 12, bottom: y + 9 };
    const collides = boxes.some((placed) =>
      box.left < placed.right + padding
      && box.right + padding > placed.left
      && box.top < placed.bottom + padding
      && box.bottom + padding > placed.top,
    );
    if (collides && !settlement.ownedByPlayer && !settlement.managed) continue;
    selected.add(settlement.id);
    boxes.push(box);
  }
  return selected;
}

/** Ký hiệu khu dân cư — hình dạng theo hạng, viền vàng nếu ngươi quản trị. */
function SettlementGlyph({ s, label, detail, onClick }: { s: Settlement; label: boolean; detail: boolean; onClick: () => void }) {
  const [x, y] = s.world;
  const size = s.kind === "Thành Phố" ? 7 : s.kind === "Thành Trì" ? 6 : s.kind === "Thị Trấn" ? 5 : 4;
  const fill = s.ownedByPlayer ? "#f1cf62" : MAP_GOLD;

  return (
    <g onClick={onClick} className={s.kind === "Thành Trì" || s.managed ? "cursor-pointer" : "cursor-default"} filter="url(#softshadow)">
      {/* vùng bấm rộng hơn hình vẽ để dễ trỏ trên cảm ứng */}
      <circle cx={x} cy={y} r={14} fill="transparent" />
      {/* vòng vàng = thành trì của CHÍNH NGƯƠI, không phải chỉ "có dữ liệu" */}
      {s.ownedByPlayer && <circle cx={x} cy={y} r={size + 5} fill="none" stroke={PLAYER_HEAT_COLOR} strokeWidth={1.4} opacity={0.85} />}
      {s.kind === "Địa Danh" ? (
        <path d={`M${x} ${y - size - 1} L${x + size + 1} ${y + size} L${x - size - 1} ${y + size} Z`} fill={fill} stroke={MAP_INK} strokeWidth={1.2} />
      ) : s.kind === "Thành Trì" ? (
        <path d={`M${x - size - 2} ${y + size} v-${size + 3} l2-2 2 2 2-2 2 2 2-2 2 2 v${size + 3} Z`} fill={fill} stroke={MAP_INK} strokeWidth={1.2} />
      ) : s.kind === "Thành Phố" ? (
        <g>
          <circle cx={x} cy={y} r={size} fill={fill} stroke={MAP_INK} strokeWidth={1.2} />
          <circle cx={x} cy={y} r={size - 3} fill={MAP_INK} opacity={0.45} />
        </g>
      ) : (
        <circle cx={x} cy={y} r={size} fill={fill} stroke={MAP_INK} strokeWidth={1.2} />
      )}
      {label && (
        <text
          x={x + size + 7} y={y + 4} pointerEvents="none" paintOrder="stroke"
          stroke={MAP_PARCHMENT} strokeWidth={3.5} strokeOpacity={0.88}
          style={{ fontFamily: "var(--font-body)", fontSize: 14, fill: MAP_LABEL_INK, fontWeight: 700 }}
        >
          {s.name}
        </text>
      )}
      {detail && s.managed && (
        <text x={x + size + 7} y={y + 18} pointerEvents="none" paintOrder="stroke" stroke={MAP_PARCHMENT} strokeWidth={3} style={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "#795f31" }}>
          {s.buildings} công trình{s.underConstruction > 0 ? ` · ${s.underConstruction} đang xây` : ""}
        </text>
      )}
    </g>
  );
}

function PlayerMarker({ loc, eraId }: { loc: string; eraId: string }) {
  const seat = regionForLocation(loc);
  const marker = markersForEra(eraId).find((m) => m.name === loc);
  const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
  if (!xy) return null;
  const [px, py] = xy;
  return (
    <g pointerEvents="none" filter="url(#softshadow)">
      <circle cx={px} cy={py} r={24} fill="#4f9a57" opacity={0.18} className="anim-pulse" />
      <path
        d={`M${px} ${py} C${px - 12} ${py - 17}, ${px - 10} ${py - 36}, ${px} ${py - 36} C${px + 10} ${py - 36}, ${px + 12} ${py - 17}, ${px} ${py} Z`}
        fill="#4f9a57" stroke="#fffdf1" strokeWidth={2.2}
      />
      <circle cx={px} cy={py - 27} r={4.2} fill="#fffdf1" stroke={MAP_INK} strokeWidth={0.8} />
    </g>
  );
}
