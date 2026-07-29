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
import { REGIONS, REGIONS_BY_ID } from "../../../content/westeros/regions";
import { regionFill, type MapMode } from "../../../territory/territoryEngine";
import { allSettlements, type Settlement } from "../../../territory/mapAggregate";
import { regionLod } from "../../../content/westeros/mapScale";
import { ROADS, RIVERS, SEA_LANES, pathD } from "../../../content/westeros/routes";
import { markersForEra } from "../../../content/westeros/mapMarkers";
import { armyMarkerPosition } from "../../../strategy/army";
import { PLAYER_HEAT_COLOR } from "../../../content/westeros/houseColors";

function centroid(poly: [number, number][]): [number, number] {
  let x = 0;
  let y = 0;
  for (const [px, py] of poly) { x += px; y += py; }
  return [x / poly.length, y / poly.length];
}

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

  /** bộ lọc LOD: khu ngươi quản trị không bao giờ bị ẩn. */
  const visible = settlements.filter((s) => {
    if (s.ownedByPlayer || s.managed) return true;
    if (s.seat) return lod.seats;
    if (s.kind === "Thành Phố") return lod.towns;
    if (s.kind === "Thành Trì" || s.kind === "Thị Trấn") return lod.towns;
    return lod.villages;
  });

  return (
    <>
      {/* ---- chủ quyền vùng ---- */}
      {showTerritory &&
        REGIONS.map((r) => {
          const fill = regionFill(stat, r.id, mode);
          const pts = r.polygonPx.map(([x, y]) => `${x},${y}`).join(" ");
          const justChanged = fill.changedDay > 0 && fill.changedDay === today;
          return (
            <g key={r.id}>
              <polygon points={pts} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={4} strokeLinejoin="round" pointerEvents="none" />
              <polygon
                points={pts}
                fill={fill.striped ? "url(#contested)" : fill.color}
                style={{ transition: "fill 700ms ease, fill-opacity 700ms ease, stroke 300ms ease" }}
                fillOpacity={fill.isPlayer ? 0.68 : 0.48}
                stroke={fill.isPlayer ? PLAYER_HEAT_COLOR : "rgba(255,255,255,0.35)"}
                strokeWidth={fill.isPlayer ? 3 : 1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                onClick={() => onRegionClick(r.id)}
                className="cursor-pointer transition-all hover:fill-opacity-80"
              />
              {justChanged && (
                <polygon points={pts} fill="none" stroke={fill.color} strokeWidth={4} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
              )}
              {fill.status === "Bị Vây" && (
                <polygon points={pts} fill="none" stroke="var(--danger)" strokeWidth={3} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
              )}
            </g>
          );
        })}

      {/* ---- sông chính ---- */}
      <g pointerEvents="none" stroke="#2563eb" opacity={0.6} fill="none" strokeLinecap="round">
        {RIVERS.map((r) => (
          <path key={r.id} d={pathD(r.points)} strokeWidth={r.id === "trident-fork" ? 2 : 3} />
        ))}
      </g>

      {/* ---- đường quốc lộ + hải trình ---- */}
      {lod.roads && (
        <g pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* quốc lộ lớn vẽ đậm và liền nét — chúng chạy suốt chiều dài lãnh thổ */}
          {ROADS.map((r) => (
            <g key={r.id}>
              <path d={pathD(r.points)} stroke="rgba(0,0,0,0.45)" strokeWidth={r.main ? 4.6 : 3.4} />
              <path
                d={pathD(r.points)}
                stroke={r.main ? "#dcc79a" : "#c9b489"}
                strokeWidth={r.main ? 2.4 : 1.6}
                strokeDasharray={r.main ? undefined : "9 5"}
                opacity={r.main ? 0.9 : 0.75}
              />
            </g>
          ))}
          {SEA_LANES.map((l) => (
            <path key={l.id} d={pathD(l.points)} stroke="#7fa8c4" strokeWidth={1.3} strokeDasharray="3 8" opacity={0.5} />
          ))}
        </g>
      )}

      {/* ---- tên vùng ---- */}
      {showTerritory && lod.regionLabels &&
        REGIONS.map((r) => {
          const [cx, cy] = centroid(r.polygonPx);
          return (
            <g key={`lbl-${r.id}`} pointerEvents="none">
              <text x={cx} y={cy + 1} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 21, fill: "rgba(0,0,0,0.8)", letterSpacing: "0.06em", fontWeight: "bold" }}>
                {r.name}
              </text>
              <text x={cx} y={cy} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 21, fill: "rgba(245,242,232,0.92)", letterSpacing: "0.06em" }}>
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
              label={lod.settlementLabels || s.managed}
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

      <PlayerMarker loc={stat["Thế Giới"]["Vị Trí"]} />
    </>
  );
}

/** Ký hiệu khu dân cư — hình dạng theo hạng, viền vàng nếu ngươi quản trị. */
function SettlementGlyph({ s, label, detail, onClick }: { s: Settlement; label: boolean; detail: boolean; onClick: () => void }) {
  const [x, y] = s.world;
  const size = s.kind === "Thành Phố" ? 7 : s.kind === "Thành Trì" ? 6 : s.kind === "Thị Trấn" ? 5 : 4;
  const fill = s.ownedByPlayer ? "#e8d9a8" : s.kind === "Địa Danh" ? "#b9c6d0" : s.kind === "Thành Phố" ? "#cbb083" : "#e8e2d2";

  return (
    <g onClick={onClick} className={s.managed ? "cursor-pointer" : "cursor-default"} filter="url(#softshadow)">
      {/* vùng bấm rộng hơn hình vẽ để dễ trỏ trên cảm ứng */}
      <circle cx={x} cy={y} r={14} fill="transparent" />
      {/* vòng vàng = thành trì của CHÍNH NGƯƠI, không phải chỉ "có dữ liệu" */}
      {s.ownedByPlayer && <circle cx={x} cy={y} r={size + 5} fill="none" stroke={PLAYER_HEAT_COLOR} strokeWidth={1.4} opacity={0.85} />}
      {s.kind === "Địa Danh" ? (
        <path d={`M${x} ${y - size - 1} L${x + size + 1} ${y + size} L${x - size - 1} ${y + size} Z`} fill={fill} stroke="#0a0d12" strokeWidth={0.8} />
      ) : s.kind === "Thành Trì" ? (
        <path d={`M${x - size - 2} ${y + size} v-${size + 3} l2-2 2 2 2-2 2 2 2-2 2 2 v${size + 3} Z`} fill={fill} stroke="#0a0d12" strokeWidth={0.8} />
      ) : s.kind === "Thành Phố" ? (
        <g>
          <circle cx={x} cy={y} r={size} fill={fill} stroke="#0a0d12" strokeWidth={0.8} />
          <circle cx={x} cy={y} r={size - 3} fill="#0a0d12" opacity={0.4} />
        </g>
      ) : (
        <circle cx={x} cy={y} r={size} fill={fill} stroke="#0a0d12" strokeWidth={0.8} />
      )}
      {label && (
        <text x={x + size + 7} y={y + 4} pointerEvents="none" style={{ fontFamily: "var(--font-body)", fontSize: 14, fill: "rgba(230,228,220,0.92)" }}>
          {s.name}
        </text>
      )}
      {detail && s.managed && (
        <text x={x + size + 7} y={y + 18} pointerEvents="none" style={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "rgba(212,175,55,0.85)" }}>
          {s.buildings} công trình{s.underConstruction > 0 ? ` · ${s.underConstruction} đang xây` : ""}
        </text>
      )}
    </g>
  );
}

function PlayerMarker({ loc }: { loc: string }) {
  const seat = REGIONS.find((r) => r.seat === loc);
  const marker = markersForEra("").find((m) => m.name === loc);
  const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
  if (!xy) return null;
  const [px, py] = xy;
  return (
    <g pointerEvents="none">
      <circle cx={px} cy={py} r={20} fill={PLAYER_HEAT_COLOR} opacity={0.12} className="anim-pulse" />
      <circle cx={px} cy={py - 18} r={10} fill="#1a1e26" stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} />
      <circle cx={px} cy={py - 18} r={4} fill={PLAYER_HEAT_COLOR} />
      <path d={`M${px} ${py - 8} v8`} stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} />
    </g>
  );
}
