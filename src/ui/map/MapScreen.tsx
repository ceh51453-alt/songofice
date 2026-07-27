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
import { REGIONS, REGIONS_BY_ID, MAP_W, MAP_H, seatVisible, factionsForYear, FACTION_COLORS_MAP } from "../../content/westeros/regions";
import { markersForEra } from "../../content/westeros/mapMarkers";
import { MAP_CONFIG } from "../../content/westeros/mapConfig";
import { regionFill } from "../../territory/territoryEngine";
import { HOUSE_COLORS, ATTITUDE_HEAT, PLAYER_HEAT_COLOR } from "../../content/westeros/houseColors";
import { useT } from "../../i18n";
import { IconLayers, IconTarget, IconPlus, IconPin, IconCheck, IconChevronDown } from "../icons";

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
  const setMode = useTerritoryStore((s) => s.setMode);
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
  const playerName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const quests = stat["Nhiệm Vụ"];
  const [questOpen, setQuestOpen] = useState(true);

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

  /** Center bản đồ vào vị trí nhân vật chính. */
  const centerOnPlayer = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const seat = REGIONS.find((r) => r.seat === playerLoc);
    const marker = markersForEra("").find((m) => m.name === playerLoc);
    const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
    if (!xy) return;
    const { clientWidth: w, clientHeight: h } = el;
    const z = Math.max(view.z, 1.2); // zoom vào ít nhất 1.2x
    setView({ z, tx: w / 2 - xy[0] * z, ty: h / 2 - xy[1] * z });
  }, [playerLoc, view.z]);

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

  const dragStartPos = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    // DO NOT use setPointerCapture, it prevents child SVGs from receiving clicks
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragStartPos.current = { x: e.clientX, y: e.clientY };
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
    const totalDx = e.clientX - dragStartPos.current.x;
    const totalDy = e.clientY - dragStartPos.current.y;
    dragMoved.current = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
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

            {/* Lớp Sông Ngòi Chân Thực (Major Westeros Rivers) */}
            <g pointerEvents="none" stroke="#2563eb" opacity={0.65} fill="none" strokeLinecap="round">
              {/* Sông Trident (Vùng Sông) */}
              <path d="M 330 460 Q 420 520 480 610 T 660 680" strokeWidth={3} />
              <path d="M 430 490 Q 460 550 480 610" strokeWidth={2} />
              {/* Sông Blackwater Rush (Đất Vương Thất) */}
              <path d="M 520 770 Q 610 750 690 770" strokeWidth={2.5} />
              {/* Sông Mander (Reach) */}
              <path d="M 520 770 Q 420 850 390 965 T 180 1070" strokeWidth={3} />
              {/* Sông Greenblood (Dorne) */}
              <path d="M 360 1180 Q 540 1280 720 1400" strokeWidth={2.5} />
            </g>

            {/* territory layer (9.5.2) */}
            {showTerritory &&
              REGIONS.map((r) => {
                const fill = regionFill(stat, r.id, mode);
                const pts = r.polygonPx.map(([x, y]) => `${x},${y}`).join(" ");
                const justChanged = fill.changedTurn > 0 && fill.changedTurn === currentTurn;
                return (
                  <g key={r.id}>
                    {/* Shadow / Coastline Glow border */}
                    <polygon
                      points={pts}
                      fill="none"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth={4}
                      strokeLinejoin="round"
                      pointerEvents="none"
                    />
                    <polygon
                      points={pts}
                      fill={fill.striped ? "url(#contested)" : fill.color}
                      style={{ transition: "fill 700ms ease, fill-opacity 700ms ease, stroke 300ms ease" }}
                      fillOpacity={fill.isPlayer ? 0.68 : 0.48}
                      stroke={fill.isPlayer ? PLAYER_HEAT_COLOR : "rgba(255,255,255,0.35)"}
                      strokeWidth={fill.isPlayer ? 3 : 1.6}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      onClick={() => {
                        if (dragMoved.current < 15) onRegionClick(r.id);
                      }}
                      className="cursor-pointer hover:fill-opacity-80 transition-all"
                    />
                    {/* pulse "lan chiếm" khi vừa đổi chủ (9.5.3) */}
                    {justChanged && (
                      <polygon points={pts} fill="none" stroke={fill.color} strokeWidth={4} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
                    )}
                    {/* nhấp nháy khi bị vây (9.5.3) */}
                    {fill.status === "Bị Vây" && (
                      <polygon points={pts} fill="none" stroke="var(--danger)" strokeWidth={3} strokeLinejoin="round" className="anim-pulse" pointerEvents="none" />
                    )}
                  </g>
                );
              })}

            {/* tên vùng */}
            {showTerritory &&
              REGIONS.map((r) => {
                const [cx, cy] = centroid(r.polygonPx);
                return (
                  <g key={`lbl-${r.id}`} pointerEvents="none">
                    <text
                      x={cx}
                      y={cy + 1}
                      textAnchor="middle"
                      style={{ fontFamily: "var(--font-display)", fontSize: 21, fill: "rgba(0,0,0,0.8)", letterSpacing: "0.06em", fontWeight: "bold" }}
                    >
                      {r.name}
                    </text>
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      style={{ fontFamily: "var(--font-display)", fontSize: 21, fill: "rgba(245,242,232,0.92)", letterSpacing: "0.06em" }}
                    >
                      {r.name}
                    </text>
                  </g>
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
            <PlayerMarker loc={playerLoc} name={playerName} />
          </svg>
        </div>
      </div>

      {/* ---- control góc (9.4) ---- */}
      <div className="glass-strong absolute right-3 top-3 z-10 flex flex-col gap-1.5 p-2">
        <button
          onClick={() => {
            if (mode === "political") setMode("relationship");
            else if (mode === "relationship") setMode("faction");
            else setMode("political");
          }}
          title={mode === "political" ? t("map.modePolitical") : mode === "relationship" ? t("map.modeRelationship") : t("map.faction")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-[var(--text-soft)] transition-colors hover:bg-[var(--glass-bg-hover)]"
        >
          <IconLayers size={15} color="var(--accent-text)" />
          {mode === "political" ? t("map.modePolitical") : mode === "relationship" ? t("map.modeRelationship") : t("map.faction")}
        </button>
        <div className="my-0.5 h-px bg-[var(--glass-border)]" />
        <LayerToggle label={t("map.layerTerritory")} on={showTerritory} onClick={() => toggleLayer("territory")} />
        <LayerToggle label={t("map.faction")} on={mode === "faction"} onClick={() => setMode("faction")} />
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
        <div className="my-0.5 h-px bg-[var(--glass-border)]" />
        <button
          onClick={centerOnPlayer}
          title={t("map.goToPlayer")}
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--accent-text)]"
        >
          <IconPin size={16} />
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

      {/* ---- Quest Tracker (thanh nhiệm vụ) ---- */}
      <QuestTracker quests={quests} open={questOpen} onToggle={() => setQuestOpen((v) => !v)} />

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

function PlayerMarker({ loc, name }: { loc: string; name: string }) {
  const [hover, setHover] = useState(false);
  // khớp Vị Trí với trọng trấn/địa danh cùng tên
  const seat = REGIONS.find((r) => r.seat === loc);
  const marker = markersForEra("").find((m) => m.name === loc);
  const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
  if (!xy) return null;
  const [px, py] = xy;
  return (
    <g
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Glow hào quang bên dưới */}
      <circle cx={px} cy={py} r={20} fill={PLAYER_HEAT_COLOR} opacity={0.12} className="anim-pulse" />
      <circle cx={px} cy={py} r={12} fill={PLAYER_HEAT_COLOR} opacity={0.2} className="anim-pulse" />
      {/* Ghim chính */}
      <circle cx={px} cy={py - 18} r={10} fill="#1a1e26" stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} />
      <circle cx={px} cy={py - 18} r={4} fill={PLAYER_HEAT_COLOR} />
      <path d={`M${px} ${py - 8} v8`} stroke={PLAYER_HEAT_COLOR} strokeWidth={2.5} />
      {/* Nhấp nháy vòng ngoài */}
      <circle cx={px} cy={py - 18} r={14} fill="none" stroke={PLAYER_HEAT_COLOR} strokeWidth={1.5} opacity={0.5} className="anim-pulse" />
      {/* Tooltip khi hover */}
      {hover && (
        <g pointerEvents="none">
          <rect
            x={px + 16} y={py - 36}
            width={Math.max(name.length, loc.length) * 8.5 + 24} height={38}
            rx={6} ry={6}
            fill="rgba(10,13,18,0.92)" stroke="rgba(255,255,255,0.15)" strokeWidth={1}
          />
          <text x={px + 28} y={py - 20} style={{ fontFamily: "var(--font-display)", fontSize: 13, fill: PLAYER_HEAT_COLOR, fontWeight: "bold" }}>
            {name}
          </text>
          <text x={px + 28} y={py - 7} style={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "rgba(230,228,220,0.7)" }}>
            📍 {loc}
          </text>
        </g>
      )}
    </g>
  );
}

function MapLegend({ mode, stat }: { mode: "political" | "relationship" | "faction"; stat: ReturnType<typeof useMvuStore.getState>["stat"] }) {
  if (mode === "relationship") {
    const items = [{ color: PLAYER_HEAT_COLOR, label: "Lãnh thổ ta" }, ...Object.entries(ATTITUDE_HEAT).map(([k, v]) => ({ color: v.color, label: k }))];
    return <LegendBox items={items} />;
  }
  if (mode === "faction") {
    const currentYear = stat["Thế Giới"]?.["Năm"] ?? 298;
    const eraFactions = factionsForYear(currentYear);
    if (eraFactions) {
      const items = Object.entries(eraFactions).map(([factionName]) => {
        const colorId = FACTION_COLORS_MAP[factionName];
        return { color: colorId && HOUSE_COLORS[colorId] ? HOUSE_COLORS[colorId].base : "#4a4a4a", label: factionName };
      });
      return <LegendBox items={items} />;
    }
  }

  // chính trị hoặc phe phái nhưng không có dữ liệu phe: chỉ các Nhà đang hiện diện trên bản đồ
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

// ── Quest type → accent color ────────────────────────────────────────────────
const QUEST_TYPE_COLORS: Record<string, string> = {
  "Cốt Truyện Chính": "var(--accent-text)",
  "Phụ": "var(--text-muted)",
  "Gia Tộc": "#d4a853",
  "Chính Trị": "#6ea8d4",
  "Quân Sự": "#c76c6c",
};

interface QuestTrackerProps {
  quests: Record<string, {
    "Tiêu Đề": string;
    "Loại": string;
    "Trạng Thái": string;
    "Mục Tiêu": { "Mô Tả": string; "Xong": boolean }[];
    "Phần Thưởng": string;
    "Hạn Chót Turn"?: number;
    "Mô Tả": string;
  }>;
  open: boolean;
  onToggle: () => void;
}

function QuestTracker({ quests, open, onToggle }: QuestTrackerProps) {
  // Chỉ hiện quest "Đang Làm"
  const activeQuests = Object.entries(quests).filter(([, q]) => q["Trạng Thái"] === "Đang Làm");
  if (activeQuests.length === 0) return null;

  return (
    <div className="glass-strong absolute left-3 top-3 z-10 flex max-h-[60vh] w-[260px] flex-col overflow-hidden sm:w-[300px]">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--glass-bg-hover)]"
      >
        <span className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[var(--accent-text)]">
          <IconPin size={13} />
          Nhiệm Vụ
          <span className="ml-1 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--accent-text)]">
            {activeQuests.length}
          </span>
        </span>
        <IconChevronDown
          size={14}
          className={`text-[var(--text-faint)] transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {/* Body */}
      {open && (
        <div className="flex-1 overflow-y-auto border-t border-[var(--glass-border)] px-3 pb-2 pt-1.5">
          {activeQuests.map(([id, q], idx) => {
            const done = q["Mục Tiêu"].filter((o) => o["Xong"]).length;
            const total = q["Mục Tiêu"].length;
            const progress = total > 0 ? (done / total) * 100 : 0;
            const typeColor = QUEST_TYPE_COLORS[q["Loại"]] ?? "var(--text-muted)";

            return (
              <div key={id} className={idx > 0 ? "mt-2.5 border-t border-[var(--glass-border)] pt-2" : ""}>
                {/* Quest title + type badge */}
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[12.5px] font-medium leading-tight text-[var(--text-soft)]">
                    {q["Tiêu Đề"] || id}
                  </span>
                  <span
                    className="shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: typeColor, background: "rgba(255,255,255,0.06)" }}
                  >
                    {q["Loại"]}
                  </span>
                </div>

                {/* Description */}
                {q["Mô Tả"] && (
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-faint)]">
                    {q["Mô Tả"]}
                  </p>
                )}

                {/* Progress bar */}
                {total > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: typeColor }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-faint)]">{done}/{total}</span>
                  </div>
                )}

                {/* Objectives checklist */}
                <div className="mt-1.5 space-y-0.5">
                  {q["Mục Tiêu"].map((obj, oi) => (
                    <div
                      key={oi}
                      className={`flex items-start gap-1.5 text-[11px] leading-snug ${
                        obj["Xong"] ? "text-[var(--text-faint)] line-through" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {obj["Xong"] ? (
                        <IconCheck size={11} className="mt-0.5 shrink-0 text-[var(--ok)]" />
                      ) : (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full border border-[var(--text-faint)]" />
                      )}
                      {obj["Mô Tả"]}
                    </div>
                  ))}
                </div>

                {/* Reward + deadline */}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-faint)]">
                  {q["Phần Thưởng"] && <span>🎁 {q["Phần Thưởng"]}</span>}
                  {q["Hạn Chót Turn"] && (
                    <span className="text-[var(--warn)]">⏳ Turn {q["Hạn Chót Turn"]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
