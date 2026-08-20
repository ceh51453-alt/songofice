/**
 * MapWorkspace — KHUNG BẢN ĐỒ ĐA TẦNG. Một mặt bản đồ, năm cấp quản trị:
 *
 *   Thế Giới → Vương Quốc → Lãnh Thổ → Lãnh Địa → Thành Trì.
 *
 * Ba tầng vĩ mô DÙNG CHUNG hệ toạ độ px ảnh gốc và khung pan/zoom ở đây — nên
 * zoom chỉ đổi mức chi tiết (semantic zoom), không đổi toạ độ. Hai tầng gắn với
 * thành có lưới riêng nhưng được neo đúng vào khu dân cư (localMap.holdingAnchor).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useMilitaryStore } from "../../state/militaryStore";
import { MAP_W, MAP_H, REGIONS_BY_ID, regionForLocation } from "../../content/westeros/regions";
import { markersForEra } from "../../content/westeros/mapMarkers";
import { MAP_CONFIG } from "../../content/westeros/mapConfig";
import { MAP_TIERS, TIER_HINT, TIER_LABEL, TIER_ZOOM, tierForZoom, worldPxToKm, type MapTier } from "../../content/westeros/mapScale";
import { absoluteDay } from "../../mvu/calendar";
import { deJureRealms, type DeJureRealmSummary, type Settlement } from "../../territory/mapAggregate";
import { factionIdForRegion, holdingForNavigation, type MapMode } from "../../territory/territoryEngine";
import { RegionLayer } from "./layers/RegionLayer";
import { WorldLayer } from "./layers/WorldLayer";
import { RealmLayer } from "./layers/RealmLayer";
import { DemesneTier } from "./DemesneTier";
import { LocalTier } from "./LocalTier";
import { MapLegend, QuestTracker } from "./MapChrome";
import { MapInfoPanel, type MapInfoSelection } from "./MapInfoPanel";
import { useT } from "../../i18n";
import { IconLayers, IconTarget, IconPlus, IconPin } from "../icons";

interface View {
  z: number;
  tx: number;
  ty: number;
}

/** Mức zoom đại diện khi bấm thẳng vào một tầng trên thanh chuyển tầng. */
const TIER_ENTRY_ZOOM: Record<Exclude<MapTier, "demesne" | "local">, number> = {
  world: 0.22,
  realm: 0.48,
  region: 0.92,
};

export function MapWorkspace() {
  const t = useT();
  const stat = useMvuStore((s) => s.stat);
  const mode = useTerritoryStore((s) => s.mode);
  const setMode = useTerritoryStore((s) => s.setMode);
  const showMarkers = useTerritoryStore((s) => s.showMarkers);
  const showTerritory = useTerritoryStore((s) => s.showTerritory);
  const toggleLayer = useTerritoryStore((s) => s.toggleLayer);
  const selectedRegionId = useTerritoryStore((s) => s.selectedRegionId);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const tier = useTerritoryStore((s) => s.tier);
  const setTier = useTerritoryStore((s) => s.setTier);
  const focusHoldingId = useTerritoryStore((s) => s.focusHoldingId);
  const enterDemesne = useTerritoryStore((s) => s.enterDemesne);
  const enterLocal = useTerritoryStore((s) => s.enterLocal);
  const exitLocal = useTerritoryStore((s) => s.exitLocal);
  const exitDemesne = useTerritoryStore((s) => s.exitDemesne);
  const moveMode = useMilitaryStore((s) => s.moveMode);
  const selectedUnit = useMilitaryStore((s) => s.selectedUnit);
  const moveUnit = useMilitaryStore((s) => s.moveUnit);
  const setMoveMode = useMilitaryStore((s) => s.setMoveMode);

  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const today = absoluteDay(stat["Thế Giới"]);
  const playerLoc = stat["Thế Giới"]["Vị Trí"];
  const navigationHoldingId = holdingForNavigation(stat, { focusHoldingId, selectedRegionId });
  const [questOpen, setQuestOpen] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const [mapInfo, setMapInfo] = useState<MapInfoSelection | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>({ z: 0.5, tx: 0, ty: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragMoved = useRef(0);
  const pinchDist = useRef(0);

  /** Hai tầng gắn với thành được chọn tường minh; ba tầng vĩ mô theo semantic zoom. */
  const shownTier: MapTier = (tier === "local" || tier === "demesne") && focusHoldingId
    ? tier
    : tierForZoom(view.z);

  // giữ store khớp với tầng mà zoom đang cho thấy (thanh chuyển tầng sáng đúng ô)
  useEffect(() => {
    if (tier === "local" || tier === "demesne") return;
    if (tier !== shownTier) setTier(shownTier);
  }, [shownTier, tier, setTier]);

  const fitView = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    const z = Math.min(w / MAP_W, h / MAP_H) * 0.95;
    setView({ z, tx: (w - MAP_W * z) / 2, ty: (h - MAP_H * z) / 2 });
  }, []);

  const centerOn = useCallback((xy: [number, number], minZoom: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    setView((v) => {
      const z = Math.max(v.z, minZoom);
      return { z, tx: w / 2 - xy[0] * z, ty: h / 2 - xy[1] * z };
    });
  }, []);

  const centerOnPlayer = useCallback(() => {
    const seat = regionForLocation(playerLoc);
    const marker = markersForEra(eraId).find((m) => m.name === playerLoc);
    const xy: [number, number] | null = seat ? seat.seatXY : marker ? [marker.x, marker.y] : null;
    if (xy) centerOn(xy, 1.2);
  }, [playerLoc, eraId, centerOn]);

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
    dragMoved.current = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
  };

  /** click vùng: đang điều quân thì hành quân, không thì mở bảng lãnh thổ (Tầng 2). */
  const onRegionClick = (regionId: string) => {
    if (dragMoved.current >= 15) return;
    if (moveMode && selectedUnit) {
      moveUnit(selectedUnit, regionId);
      return;
    }
    if (mode === "faction") {
      const houseId = stat["Chủ Quyền Lãnh Thổ"]?.[regionId]?.["Nhà Kiểm Soát"] ?? "";
      setMapInfo({ kind: "faction", id: factionIdForRegion(stat, regionId, houseId) });
      return;
    }
    if (mode === "relationship") {
      const houseId = stat["Chủ Quyền Lãnh Thổ"]?.[regionId]?.["Nhà Kiểm Soát"] ?? "";
      if (houseId) {
        setMapInfo({ kind: "relationship", id: houseId });
        return;
      }
    }
    selectRegion(regionId);
  };

  /** Thế Giới → Vương Quốc: chọn chính thể chứa province vừa bấm. */
  const onWorldClick = (regionId: string) => {
    if (dragMoved.current >= 15) return;
    const region = REGIONS_BY_ID[regionId];
    if (!region) return;
    if (mode === "faction") {
      const houseId = stat["Chủ Quyền Lãnh Thổ"]?.[regionId]?.["Nhà Kiểm Soát"] ?? "";
      setMapInfo({ kind: "faction", id: factionIdForRegion(stat, regionId, houseId) });
      return;
    }
    if (mode === "relationship") {
      const houseId = stat["Chủ Quyền Lãnh Thổ"]?.[regionId]?.["Nhà Kiểm Soát"] ?? "";
      if (houseId) {
        setMapInfo({ kind: "relationship", id: houseId });
        return;
      }
    }
    setTier("realm");
    centerOn(region.seatXY, TIER_ENTRY_ZOOM.realm);
  };

  /** Vương Quốc → Lãnh Thổ: đi vào các province của chính thể đó. */
  const onRealmClick = (_realmId: string, anchor: [number, number]) => {
    if (dragMoved.current >= 15) return;
    if (mode === "faction") {
      const controller = deJureRealms(stat, eraId).find((realm) => realm.realmId === _realmId)?.controller ?? "";
      setMapInfo({ kind: "faction", id: factionIdForRegion(stat, _realmId, controller) });
      return;
    }
    if (mode === "relationship") {
      const controller = deJureRealms(stat, eraId).find((realm) => realm.realmId === _realmId)?.controller ?? "";
      if (controller) {
        setMapInfo({ kind: "relationship", id: controller });
        return;
      }
    }
    setMapInfo({ kind: "realm", id: _realmId });
    centerOn(anchor, Math.max(view.z, TIER_ENTRY_ZOOM.realm));
  };

  const openRealmRegions = (realm: DeJureRealmSummary) => {
    setMapInfo(null);
    setTier("region");
    centerOn(realm.anchor, TIER_ENTRY_ZOOM.region);
  };

  const changeMapMode = (next: MapMode) => {
    setMode(next);
    setMapInfo(null);
    selectRegion(null);
  };

  /** click khu dân cư: vào đất trực thuộc trước, rồi mới đi sâu vào thành trì. */
  const onSettlementClick = (s: Settlement) => {
    if (dragMoved.current >= 15) return;
    if (mode === "relationship") {
      const houseId = stat["Chủ Quyền Lãnh Thổ"]?.[s.regionId]?.["Nhà Kiểm Soát"] ?? "";
      if (houseId) {
        setMapInfo({ kind: "relationship", id: houseId });
        return;
      }
    }
    if (s.managed) {
      enterDemesne(s.id);
      return;
    }
    if (s.kind === "Thành Trì") {
      centerOn(s.world, Math.max(view.z, TIER_ZOOM.localHint));
      selectRegion(s.regionId);
      setHint(`${s.name} là một mục tiêu kiểm soát trong ${REGIONS_BY_ID[s.regionId]?.name ?? s.regionId}.`);
      return;
    }
    centerOn(s.world, Math.max(view.z, TIER_ZOOM.localHint));
    setHint(`${s.name} chưa phải thành trì trực thuộc của ngươi — chưa mở được bản đồ thành trì.`);
  };

  const goTier = (next: MapTier) => {
    if (next === "demesne" || next === "local") {
      if (navigationHoldingId) {
        if (next === "demesne") enterDemesne(navigationHoldingId);
        else enterLocal(navigationHoldingId);
      } else {
        setHint("Không xác định được thành trì theo vị trí hiện tại. Hãy chọn một thành trên bản đồ trước.");
      }
      return;
    }
    setTier(next);
    setView((v) => ({ ...v, z: TIER_ENTRY_ZOOM[next] }));
    // giữ tâm màn hình khi đổi tầng
    const el = wrapRef.current;
    if (el) {
      const { clientWidth: w, clientHeight: h } = el;
      setView((v) => {
        const cx = (w / 2 - v.tx) / v.z;
        const cy = (h / 2 - v.ty) / v.z;
        const z = TIER_ENTRY_ZOOM[next];
        return { z, tx: w / 2 - cx * z, ty: h / 2 - cy * z };
      });
    }
  };

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#17140f]">
      {shownTier === "local" && focusHoldingId ? (
        <LocalTier holdingId={focusHoldingId} onExit={exitLocal} />
      ) : shownTier === "demesne" && focusHoldingId ? (
        <DemesneTier holdingId={focusHoldingId} onExit={exitDemesne} onEnterCastle={() => enterLocal(focusHoldingId)} />
      ) : (
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
                <radialGradient id="parchmentSea" cx="48%" cy="38%" r="82%">
                  <stop offset="0%" stopColor="#315a69" />
                  <stop offset="58%" stopColor="#1d4252" />
                  <stop offset="100%" stopColor="#102c3b" />
                </radialGradient>
                <pattern id="contested" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <rect width="14" height="14" fill="transparent" />
                  <rect width="5" height="14" fill="#e3ecee" fillOpacity="0.28" />
                  <rect x="5" width="2" height="14" fill="#102126" fillOpacity="0.18" />
                </pattern>
                <pattern id="paperGrain" width="92" height="92" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="18" r="1.2" fill="#c8d9dc" opacity="0.07" />
                  <circle cx="67" cy="38" r="0.9" fill="#8fb0b8" opacity="0.08" />
                  <circle cx="40" cy="76" r="1.4" fill="#d8e4e5" opacity="0.05" />
                  <path d="M2 55 Q25 48 48 56 T94 54" fill="none" stroke="#bad1d6" strokeWidth="1" opacity="0.08" />
                </pattern>
                <pattern id="seaEtching" width="120" height="52" patternUnits="userSpaceOnUse">
                  <path d="M0 22 Q15 12 30 22 T60 22 T90 22 T120 22" fill="none" stroke="#8bb4c0" strokeWidth="1.2" opacity="0.2" />
                  <path d="M15 40 Q30 31 45 40 T75 40 T105 40" fill="none" stroke="#6f9daa" strokeWidth="0.8" opacity="0.16" />
                </pattern>
                <filter id="softshadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
                </filter>
                <filter id="inkLabelShadow" x="-25%" y="-30%" width="150%" height="160%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.8" floodColor="#fffdf0" floodOpacity="0.65" />
                </filter>
              </defs>

              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#parchmentSea)" />
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#seaEtching)" opacity={0.42} />
              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#paperGrain)" />
              {MAP_CONFIG.assetUrl && (
                <image href={MAP_CONFIG.assetUrl} x="0" y="0" width={MAP_W} height={MAP_H} preserveAspectRatio="xMidYMid slice" />
              )}

              {shownTier === "world" ? (
                <WorldLayer stat={stat} eraId={eraId} mode={mode} zoom={view.z} showTerritory={showTerritory} onRealmClick={onWorldClick} />
              ) : shownTier === "realm" ? (
                <RealmLayer stat={stat} eraId={eraId} mode={mode} zoom={view.z} showTerritory={showTerritory} onRealmClick={onRealmClick} />
              ) : (
                <RegionLayer
                  stat={stat}
                  mode={mode}
                  zoom={view.z}
                  today={today}
                  eraId={eraId}
                  showTerritory={showTerritory}
                  showMarkers={showMarkers}
                  onRegionClick={onRegionClick}
                  onSettlementClick={onSettlementClick}
                />
              )}

            </svg>
          </div>
        </div>
      )}

      {/* ---- thanh chuyển tầng ---- */}
      <div className="glass-strong absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1 p-1">
        {MAP_TIERS.map((tk) => {
          const active = shownTier === tk;
          const disabled = (tk === "demesne" || tk === "local") && !navigationHoldingId;
          return (
            <button
              key={tk}
              onClick={() => goTier(tk)}
              disabled={disabled}
              title={disabled ? "Chưa có thành trì trực thuộc nào" : TIER_HINT[tk]}
              className={`rounded-md px-3 py-1.5 text-[12px] transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                  : disabled
                    ? "cursor-not-allowed text-[var(--text-faint)] opacity-40"
                    : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
              }`}
            >
              {TIER_LABEL[tk]}
            </button>
          );
        })}
      </div>

      {shownTier !== "local" && shownTier !== "demesne" && (
        <>
          {/* ---- lớp hiển thị ---- */}
          <div className="glass-strong absolute right-3 top-3 z-10 flex w-48 flex-col gap-1.5 p-2">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10.5px] uppercase tracking-wider text-[var(--text-faint)]">
              <IconLayers size={15} color="var(--accent-text)" />
              Chế độ bản đồ
            </div>
            {([
              ["political", t("map.modePolitical")],
              ["relationship", t("map.modeRelationship")],
              ["faction", t("map.faction")],
            ] as [MapMode, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => changeMapMode(id)}
                className={`rounded-md border px-2.5 py-1.5 text-left text-[11.5px] transition-colors ${
                  mode === id
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                    : "border-transparent text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
                }`}
              >
                {label}
              </button>
            ))}
            <div className="my-0.5 h-px bg-[var(--glass-border)]" />
            <LayerToggle label={t("map.layerTerritory")} on={showTerritory} onClick={() => toggleLayer("territory")} />
            <LayerToggle label="Khu dân cư" on={showMarkers} onClick={() => toggleLayer("markers")} />
            <div className="px-2 pt-1 text-[10.5px] text-[var(--text-faint)]">
              1 px ≈ {worldPxToKm(1).toFixed(1)} km · zoom {view.z.toFixed(2)}×
            </div>
          </div>

          {/* ---- điều khiển khung nhìn ---- */}
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
            <button onClick={centerOnPlayer} title={t("map.goToPlayer")} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--accent-text)]">
              <IconPin size={16} />
            </button>
          </div>

          {moveMode && selectedUnit && (
            <div className="glass-strong absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[12.5px]">
              <span className="text-[var(--accent-text)]">{t("map.moveHint", { unit: selectedUnit })}</span>
              <button onClick={() => setMoveMode(false)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]">
                {t("map.cancelMove")}
              </button>
            </div>
          )}

          <QuestTracker quests={stat["Nhiệm Vụ"]} open={questOpen} onToggle={() => setQuestOpen((v) => !v)} />
          <MapLegend
            mode={mode}
            tier={shownTier}
            stat={stat}
            onSelectFaction={(id) => setMapInfo({ kind: "faction", id })}
          />
          {mapInfo && (
            <MapInfoPanel
              stat={stat}
              eraId={eraId}
              selection={mapInfo}
              onClose={() => setMapInfo(null)}
              onOpenRegions={openRealmRegions}
            />
          )}
        </>
      )}

      {hint && (
        <button
          onClick={() => setHint(null)}
          className="glass-strong absolute bottom-16 left-1/2 z-10 -translate-x-1/2 px-4 py-2 text-[12.5px] text-[var(--text-soft)]"
        >
          {hint}
        </button>
      )}
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
