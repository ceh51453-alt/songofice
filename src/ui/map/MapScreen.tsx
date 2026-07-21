/**
 * MapScreen (mục 9) — bản đồ tương tác tự viết (SVG, không Leaflet — ràng buộc
 * mỹ thuật "SVG hết"). Base placeholder (gradient trầm + phác thảo bờ biển),
 * territory layer 2 chế độ (Chính Trị / Quan Hệ — 9.5.2) đọc động từ state,
 * marker layer (trọng trấn + Essos), pan/zoom (chuột + pinch — 9.4). Chiếm vùng
 * → polygon đổi màu với transition + pulse "lan chiếm" (9.5.3).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useMilitaryStore } from "../../state/militaryStore";
import { armyMarkerPosition } from "../../strategy/army";
import { REGIONS, REGIONS_BY_ID, MAP_W, MAP_H, seatVisible } from "../../content/westeros/regions";
import { markersForEra } from "../../content/westeros/mapMarkers";
import { MAP_CONFIG } from "../../content/westeros/mapConfig";
import { regionFill } from "../../territory/territoryEngine";
import { HOUSE_COLORS, ATTITUDE_HEAT, PLAYER_HEAT_COLOR } from "../../content/westeros/houseColors";
import { useT } from "../../i18n";
import { IconLayers, IconTarget, IconPlus } from "../icons";

function centroid(poly: [number, number][]): [number, number] {
  const n = poly.length;
  let x = 0;
  let y = 0;
  for (const [px, py] of poly) { x += px; y += py; }
  return [x / n, y / n];
}

interface View {
  z: number;
  tx: number;
  ty: number;
}

export function MapScreen() {
  const t = useT();
  const stat = useMvuStore((s) => s.stat);
  const mode = useTerritoryStore((s) => s.mode);
  const toggleMode = useTerritoryStore((s) => s.toggleMode);
  const showMarkers = useTerritoryStore((s) => s.showMarkers);
  const showTerritory = useTerritoryStore((s) => s.showTerritory);
  const toggleLayer = useTerritoryStore((s) => s.toggleLayer);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const moveMode = useMilitaryStore((s) => s.moveMode);
  const selectedUnit = useMilitaryStore((s) => s.selectedUnit);
  const moveUnit = useMilitaryStore((s) => s.moveUnit);
  const setMoveMode = useMilitaryStore((s) => s.setMoveMode);
  const units = stat["Biên Chế Quân Sự"];

  /** click 1 vùng: nếu đang điều quân → hành quân tới; không thì mở panel lãnh địa. */
  const onRegionClick = (regionId: string) => {
    if (moveMode && selectedUnit) {
      moveUnit(selectedUnit, regionId);
      return;
    }
    selectRegion(regionId);
  };

  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const currentTurn = stat["_engineMeta"]["turnCount"];
  const playerLoc = stat["Thế Giới"]["Vị Trí"];

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>({ z: 0.5, tx: 0, ty: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragMoved = useRef(0);
  const pinchDist = useRef(0);

  const fitView = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    const z = Math.min(w / MAP_W, h / MAP_H) * 0.95;
    setView({ z, tx: (w - MAP_W * z) / 2, ty: (h - MAP_H * z) / 2 });
  }, []);

  useEffect(() => {
    fitView();
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => fitView());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitView]);

  const clampZoom = (z: number) => Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, z));

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => {
      const z = clampZoom(v.z * factor);
      const k = z / v.z;
      return { z, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragMoved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect && pinchDist.current > 0) {
        zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, dist / pinchDist.current);
      }
      pinchDist.current = dist;
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    dragMoved.current += Math.abs(dx) + Math.abs(dy);
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
  };

  const markers = markersForEra(eraId);
  const seatMarkers = REGIONS.filter((r) => seatVisible(r, eraId));

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[var(--bg-base)]">
      {/* ---- canvas pan/zoom ---- */}
      <div
        ref={wrapRef}
        className="absolute inset-0 touch-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: "grab" }}
      >
        <div style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.z})`, transformOrigin: "0 0", width: MAP_W, height: MAP_H }}>
          <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: "block" }}>
            <defs>
              <radialGradient id="sea" cx="50%" cy="35%" r="80%">
                <stop offset="0%" stopColor="#12202b" />
                <stop offset="100%" stopColor="#0a1016" />
              </radialGradient>
              <pattern id="contested" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="14" height="14" fill="#4a4a4a" />
                <rect width="7" height="14" fill="#5f5f5f" />
              </pattern>
              <filter id="softshadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* base: biển + phác thảo bờ (placeholder — thay ảnh thật: đổi mapConfig) */}
            <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#sea)" />
            {MAP_CONFIG.assetUrl && (
              <image href={MAP_CONFIG.assetUrl} x="0" y="0" width={MAP_W} height={MAP_H} preserveAspectRatio="xMidYMid slice" />
            )}

            {/* territory layer (9.5.2) */}
            {showTerritory &&
              REGIONS.map((r) => {
                const fill = regionFill(stat, r.id, mode);
                const pts = r.polygonPx.map(([x, y]) => `${x},${y}`).join(" ");
                const justChanged = fill.changedTurn > 0 && fill.changedTurn === currentTurn;
                return (
                  <g key={r.id}>
                    <polygon
                      points={pts}
                      fill={fill.striped ? "url(#contested)" : fill.color}
                      style={{ transition: "fill 700ms ease, fill-opacity 700ms ease" }}
                      fillOpacity={fill.isPlayer ? 0.62 : 0.44}
                      stroke={fill.isPlayer ? PLAYER_HEAT_COLOR : "rgba(255,255,255,0.22)"}
                      strokeWidth={fill.isPlayer ? 2.5 : 1.2}
                      onClick={() => {
                        if (dragMoved.current < 6) onRegionClick(r.id);
                      }}
                      className="cursor-pointer"
                    />
                    {/* pulse "lan chiếm" khi vừa đổi chủ (9.5.3) */}
                    {justChanged && (
                      <polygon points={pts} fill="none" stroke={fill.color} strokeWidth={4} className="anim-pulse" pointerEvents="none" />
                    )}
                    {/* nhấp nháy khi bị vây (9.5.3) */}
                    {fill.status === "Bị Vây" && (
                      <polygon points={pts} fill="none" stroke="var(--danger)" strokeWidth={3} className="anim-pulse" pointerEvents="none" />
                    )}
                  </g>
                );
              })}

            {/* tên vùng */}
            {showTerritory &&
              REGIONS.map((r) => {
                const [cx, cy] = centroid(r.polygonPx);
                return (
                  <text
                    key={`lbl-${r.id}`}
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{ fontFamily: "var(--font-display)", fontSize: 22, fill: "rgba(240,238,230,0.82)", letterSpacing: "0.04em" }}
                  >
                    {r.name}
                  </text>
                );
              })}

            {/* marker layer (9.3) — trọng trấn + Essos */}
            {showMarkers && (
              <g>
                {seatMarkers.map((r) => (
                  <MarkerGlyph key={`seat-${r.id}`} x={r.seatXY[0]} y={r.seatXY[1]} label={r.seat} kind="castle" />
                ))}
                {markers.map((m) => (
                  <MarkerGlyph key={m.id} x={m.x} y={m.y} label={m.name} kind={m.type === "landmark" ? "landmark" : "city"} />
                ))}
              </g>
            )}

            {/* path layer + army marker (11.4) — đơn vị quân đang đóng/hành quân */}
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

            {/* vị trí nhân vật chính (đồng bộ Thế Giới.Vị Trí) */}
            <PlayerMarker loc={playerLoc} />
          </svg>
        </div>
      </div>

      {/* ---- control góc (9.4) ---- */}
      <div className="glass-strong absolute right-3 top-3 z-10 flex flex-col gap-1.5 p-2">
        <button
          onClick={toggleMode}
          title={mode === "political" ? t("map.modePolitical") : t("map.modeRelationship")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-[var(--text-soft)] transition-colors hover:bg-[var(--glass-bg-hover)]"
        >
          <IconLayers size={15} color="var(--accent-text)" />
          {mode === "political" ? t("map.modePolitical") : t("map.modeRelationship")}
        </button>
        <div className="my-0.5 h-px bg-[var(--glass-border)]" />
        <LayerToggle label={t("map.layerTerritory")} on={showTerritory} onClick={() => toggleLayer("territory")} />
        <LayerToggle label={t("map.layerMarkers")} on={showMarkers} onClick={() => toggleLayer("markers")} />
      </div>

      <div className="glass-strong absolute bottom-3 right-3 z-10 flex flex-col gap-1 p-1.5">
        <button onClick={() => zoomAt(200, 200, 1.25)} title={t("map.zoomIn")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]">
          <IconPlus size={16} />
        </button>
        <button onClick={() => zoomAt(200, 200, 1 / 1.25)} title={t("map.zoomOut")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]">
          <span className="flex h-4 w-4 items-center justify-center text-[16px] leading-none">−</span>
        </button>
        <button onClick={fitView} title={t("map.recenter")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]">
          <IconTarget size={16} />
        </button>
      </div>

      {/* ---- băng điều quân (11.5) ---- */}
      {moveMode && selectedUnit && (
        <div className="glass-strong absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[12.5px]">
          <span className="text-[var(--accent-text)]">{t("map.moveHint", { unit: selectedUnit })}</span>
          <button onClick={() => setMoveMode(false)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]">
            {t("map.cancelMove")}
          </button>
        </div>
      )}

      {/* ---- legend ---- */}
      <MapLegend mode={mode} stat={stat} />
    </div>
  );
}

function LayerToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--glass-bg-hover)] ${on ? "text-[var(--text-soft)]" : "text-[var(--text-faint)]"}`}
    >
      <span className={`h-2 w-2 rounded-full ${on ? "bg-[var(--ok)]" : "bg-[var(--text-faint)]"}`} />
      {label}
    </button>
  );
}

function MarkerGlyph({ x, y, label, kind }: { x: number; y: number; label: string; kind: "castle" | "city" | "landmark" }) {
  return (
    <g pointerEvents="none" filter="url(#softshadow)">
      {kind === "castle" ? (
        <path d={`M${x - 9} ${y + 6} v-9 l2-2 2 2 2-2 2 2 2-2 2 2 v9 Z`} fill="#e8e2d2" stroke="#0a0d12" strokeWidth={0.8} />
      ) : kind === "landmark" ? (
        <path d={`M${x} ${y - 8} L${x + 7} ${y + 6} L${x - 7} ${y + 6} Z`} fill="#b9c6d0" stroke="#0a0d12" strokeWidth={0.8} />
      ) : (
        <circle cx={x} cy={y} r={5} fill="#cbb083" stroke="#0a0d12" strokeWidth={0.8} />
      )}
      <text x={x + 12} y={y + 4} style={{ fontFamily: "var(--font-body)", fontSize: 15, fill: "rgba(230,228,220,0.9)" }}>
        {label}
      </text>
    </g>
  );
}

function PlayerMarker({ loc }: { loc: string }) {
  // khớp Vị Trí với trọng trấn/địa danh cùng tên
  const seat = REGIONS.find((r) => r.seat === loc);
  const marker = markersForEra("").find((m) => m.name === loc);
  const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
  if (!xy) return null;
  return (
    <g pointerEvents="none">
      <circle cx={xy[0]} cy={xy[1] - 18} r={9} fill="none" stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} className="anim-pulse" />
      <path d={`M${xy[0]} ${xy[1] - 26} v16`} stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} />
    </g>
  );
}

function MapLegend({ mode, stat }: { mode: "political" | "relationship"; stat: ReturnType<typeof useMvuStore.getState>["stat"] }) {
  if (mode === "relationship") {
    const items = [{ color: PLAYER_HEAT_COLOR, label: "Lãnh thổ ta" }, ...Object.entries(ATTITUDE_HEAT).map(([k, v]) => ({ color: v.color, label: k }))];
    return <LegendBox items={items} />;
  }
  // chính trị: chỉ các Nhà đang hiện diện trên bản đồ
  const present = new Set(Object.values(stat["Chủ Quyền Lãnh Thổ"]).map((s) => s["Nhà Kiểm Soát"]).filter(Boolean));
  const items = [...present].map((h) => ({ color: HOUSE_COLORS[h]?.base ?? "#4a4a4a", label: HOUSE_COLORS[h]?.label ?? h }));
  return <LegendBox items={items} />;
}

function LegendBox({ items }: { items: { color: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="glass-strong absolute bottom-3 left-3 z-10 flex max-w-[45vw] flex-wrap gap-x-3 gap-y-1 p-2.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
