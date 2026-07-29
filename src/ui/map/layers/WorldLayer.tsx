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
import { REGIONS, MAP_W } from "../../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../../content/westeros/houses";
import { houseColor, NEUTRAL_COLOR, PLAYER_HEAT_COLOR } from "../../../content/westeros/houseColors";
import { balanceOfPower } from "../../../territory/mapAggregate";
import { CLIMATE_BANDS, SEA_LANES, ROADS, pathD } from "../../../content/westeros/routes";
import { markersForEra } from "../../../content/westeros/mapMarkers";

interface Props {
  stat: StatData;
  eraId: string;
  showTerritory: boolean;
  onRealmClick: (regionId: string) => void;
}

export function WorldLayer({ stat, eraId, showTerritory, onRealmClick }: Props) {
  const realms = useMemo(() => balanceOfPower(stat, eraId), [stat, eraId]);
  /** mốc lục địa còn giữ ở Tầng 3: chỉ những địa danh khổng lồ (Tường Thành, thành Essos). */
  const landmarks = useMemo(
    () => markersForEra(eraId).filter((m) => m.type === "landmark" || (m.population ?? 0) >= 200000),
    [eraId],
  );

  return (
    <>
      {/* ---- dải khí hậu ---- */}
      <g pointerEvents="none">
        {CLIMATE_BANDS.map((b) => (
          <g key={b.id}>
            <rect x={0} y={b.y1} width={MAP_W} height={b.y2 - b.y1} fill={b.tint} opacity={0.07} />
            <line x1={0} y1={b.y1} x2={MAP_W} y2={b.y1} stroke={b.tint} strokeWidth={1} opacity={0.22} strokeDasharray="12 10" />
            <text x={16} y={b.y1 + 26} style={{ fontFamily: "var(--font-body)", fontSize: 17, fill: b.tint, opacity: 0.5, letterSpacing: "0.18em" }}>
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
          const pts = r.polygonPx.map(([x, y]) => `${x},${y}`).join(" ");
          return (
            <polygon
              key={r.id}
              points={pts}
              fill={col.base}
              fillOpacity={sov?.["Là Của Người Chơi"] ? 0.8 : 0.6}
              // viền TRÙNG màu nền → các vùng cùng một Nhà dính liền thành một mảng
              stroke={col.base}
              strokeWidth={3}
              strokeLinejoin="round"
              onClick={() => onRealmClick(r.id)}
              className="cursor-pointer"
              style={{ transition: "fill 700ms ease" }}
            />
          );
        })}

      {/* ---- viền bờ biển lục địa ---- */}
      <g pointerEvents="none" fill="none" stroke="rgba(8,12,18,0.55)" strokeWidth={2.5} strokeLinejoin="round">
        {REGIONS.map((r) => (
          <polygon key={`coast-${r.id}`} points={r.polygonPx.map(([x, y]) => `${x},${y}`).join(" ")} />
        ))}
      </g>

      {/* ---- hải trình xuyên lục địa ---- */}
      <g pointerEvents="none" fill="none" strokeLinecap="round">
        {/* Tầng 3 chỉ giữ QUỐC LỘ lớn — trục xuyên lục địa, bỏ đường nhánh */}
        {ROADS.filter((r) => r.main).map((r) => (
          <path
            key={r.id} d={pathD(r.points)} fill="none"
            stroke="#b9a47c"
            strokeWidth={1.4} opacity={0.42}
          />
        ))}
        {SEA_LANES.map((l) => (
          <g key={l.id}>
            <path d={pathD(l.points)} stroke="#7fa8c4" strokeWidth={1.6} strokeDasharray="4 10" opacity={0.55} />
            <text style={{ fontFamily: "var(--font-body)", fontSize: 13, fill: "rgba(127,168,196,0.7)" }}>
              <textPath href={`#lane-${l.id}`} startOffset="30%">{l.name}</textPath>
            </text>
            <path id={`lane-${l.id}`} d={pathD(l.points)} fill="none" stroke="none" />
          </g>
        ))}
      </g>

      {/* ---- tên thế lực trên mảng lãnh thổ ---- */}
      {showTerritory &&
        realms.map((realm) => {
          const anchor = realmAnchor(realm.regionIds);
          if (!anchor) return null;
          const label = HOUSES_BY_ID[realm.houseId]?.name ?? realm.houseId;
          const isPlayer = realm.regionIds.some((id) => stat["Chủ Quyền Lãnh Thổ"][id]?.["Là Của Người Chơi"]);
          return (
            <g key={`realm-${realm.houseId}`} pointerEvents="none">
              <text x={anchor[0]} y={anchor[1] + 1} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 26, fill: "rgba(0,0,0,0.75)", letterSpacing: "0.14em", fontWeight: "bold" }}>
                {label}
              </text>
              <text x={anchor[0]} y={anchor[1]} textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 26, fill: isPlayer ? PLAYER_HEAT_COLOR : "rgba(245,242,232,0.94)", letterSpacing: "0.14em" }}>
                {label}
              </text>
              <text x={anchor[0]} y={anchor[1] + 22} textAnchor="middle" style={{ fontFamily: "var(--font-body)", fontSize: 14, fill: "rgba(230,228,220,0.6)" }}>
                {Math.round(realm.share * 100)}% cán cân · {(realm.population / 1e6).toFixed(1)} triệu dân
              </text>
            </g>
          );
        })}

      {/* ---- mốc lục địa ---- */}
      <g pointerEvents="none">
        {landmarks.map((m) => (
          <g key={`lm-${m.id}`}>
            <path d={`M${m.x} ${m.y - 9} L${m.x + 8} ${m.y + 7} L${m.x - 8} ${m.y + 7} Z`} fill="#c8d2da" stroke="#0a0d12" strokeWidth={0.9} />
            <text x={m.x + 13} y={m.y + 6} style={{ fontFamily: "var(--font-body)", fontSize: 15, fill: "rgba(230,228,220,0.85)" }}>{m.name}</text>
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
