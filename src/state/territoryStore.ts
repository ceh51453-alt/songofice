/**
 * useTerritoryStore — trạng thái UI bản đồ + hành động chủ quyền/xây dựng (9-10).
 * Nguồn chân lý CHỦ QUYỀN nằm ở mvuStore (stat_data); store này chỉ giữ:
 * - chế độ tô màu (Chính Trị / Quan Hệ — 9.5.2) + layer toggle,
 * - vùng đang chọn (mở Territory Panel),
 * và điều phối hành động engine (captureRegion 9.5.1, startBuild 10.3) qua
 * applyPatch (engine giữ số, được ghi field `_` — khác đường AI/extractor).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMvuStore, currentDay } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import { captureRegionOps, playerHouseId, type MapMode } from "../territory/territoryEngine";
import {
  startConstruction, cancelConstruction, startDemolition, cancelDemolition,
  issueDecree as issueDecreeOps, revokeDecree as revokeDecreeOps,
} from "../territory/construction";
import { placeBuilding, placeRing, terrainOf } from "../territory/localMap";
import { buildWall, upgradeWall, demolishWall, type WallPoint } from "../territory/walls";
import {
  buildRoad, freezeAutoRoads as freezeAutoRoadsOps, removeRoad, removeAutoRoad, restoreAutoRoads,
  type RoadPoint,
} from "../territory/roads";
import { executeOrder, type OrderSide } from "../economy/market";
import type { CustomBuilding, DemesneFocus, RoadLine, WallMaterial } from "../mvu/schema";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { BUILDING_CATALOG, type BuildingType } from "../content/westeros/buildings";
import type { MapTier } from "../content/westeros/mapScale";
import { createLogger } from "../lib/log";
import {
  cancelGovernanceProject, changeDemesneFocus, changeDemesnePlan, takeFeudalAction, takeFeudalAgenda, takeRegionalAction,
  type DemesnePlan,
} from "../strategy/feudalManagement";

const log = createLogger("territory");

/** Engine áp ops (được ghi `_`) + đẩy toast (6.4) tuỳ chọn. */
function applyEngineOps(ops: PatchOp[]): void {
  if (ops.length === 0) return;
  const mvu = useMvuStore.getState();
  const { state, warnings } = applyPatch(mvu.stat, ops);
  for (const w of warnings) log.warn(`Engine op: ${w.reason}`);
  useMvuStore.setState({ stat: state });
}

function pushToast(kind: "territory" | "territory_lost", text: string): void {
  useMvuStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { kind, text }] }));
}

interface TerritoryState {
  mode: MapMode;
  setMode: (m: MapMode) => void;
  toggleMode: () => void;

  /** layer hiển thị (9.3). */
  showMarkers: boolean;
  showTerritory: boolean;
  toggleLayer: (layer: "markers" | "territory") => void;

  /** vùng đang mở panel (10.4); null = đóng. */
  selectedRegionId: string | null;
  selectRegion: (id: string | null) => void;

  // ── Hệ bản đồ đa tầng ──
  /** tầng bản đồ đang xem. world/realm/region chia theo zoom; hai tầng cuối chọn theo thành. */
  tier: MapTier;
  /** thành trì làm tâm cho cả Lãnh Địa lẫn Thành Trì. */
  focusHoldingId: string | null;
  setTier: (tier: MapTier) => void;
  /** vào đất trực thuộc quanh một thành (từ khu dân cư trên Lãnh Thổ). */
  enterDemesne: (holdingId: string) => void;
  /** từ Lãnh Địa đi sâu vào bản đồ quy hoạch Thành Trì. */
  enterLocal: (holdingId: string) => void;
  /** rời Thành Trì về Lãnh Địa. */
  exitLocal: () => void;
  /** rời Lãnh Địa về Lãnh Thổ. */
  exitDemesne: () => void;

  /** Đặt công trình lên ô lưới Tầng 1 — kiểm quy hoạch rồi mới trừ tài nguyên. */
  placeBuild: (
    territoryId: string, type: BuildingType, x: number, y: number,
    opts?: { name?: string; custom?: CustomBuilding },
  ) => { ok: boolean; error?: string };

  /**
   * Dựng một TUYẾN TƯỜNG THÀNH do người chơi tự vạch điểm (M18). Chi phí và
   * thời gian tính theo cấp + độ dài thật của tuyến.
   */
  drawWall: (
    territoryId: string, points: WallPoint[],
    opts?: { level?: number; material?: WallMaterial; name?: string },
  ) => { ok: boolean; error?: string };
  /** Nâng cấp một tuyến tường sẵn có — chỉ trả phần chênh, không xây lại. */
  raiseWall: (territoryId: string, wallId: string) => { ok: boolean; error?: string };
  /** Phá bỏ một tuyến tường (thu hồi 30% đá). */
  razeWall: (territoryId: string, wallId: string) => void;

  /** Vạch và xoá đường thủ công trên Tầng 1; engine không tự nối công trình. */
  drawRoad: (
    territoryId: string, points: RoadPoint[], opts?: { name?: string; width?: number; kind?: "Đường Nhỏ" | "Đường Lớn" },
  ) => { ok: boolean; error?: string };
  freezeAutoRoads: (territoryId: string, roads: RoadLine[]) => void;
  razeRoad: (territoryId: string, roadId: string) => void;
  razeAutoRoad: (territoryId: string, roadId: string) => void;
  restoreAutoRoads: (territoryId: string) => void;

  /** Đặt lệnh mua/bán trên sàn giao dịch của một vùng. */
  tradeOrder: (
    regionId: string, goodId: string, quantity: number, side: OrderSide,
    destination?: { holdingId?: string },
  ) => { ok: boolean; error?: string };

  /**
   * Đổi chủ 1 vùng (9.5.1) — engine giữ, bản đồ reactive đổi màu + toast.
   * Dùng bởi thẻ <territory_change> của AI (chatStore) + vây thành (M8/M12).
   */
  captureRegion: (regionId: string, newHouseId: string) => void;

  /** Khởi công (10.3) — trả lỗi nếu thiếu tài nguyên/điều kiện. */
  startBuild: (territoryId: string, type: BuildingType, name?: string) => { ok: boolean; error?: string };
  /** Huỷ công trình đang xây (hoàn 50%). */
  cancelBuild: (territoryId: string, buildingName: string) => void;
  /** Bắt đầu phá dỡ công trình đã hoàn thiện; đất chỉ trống lại sau vài ngày. */
  demolishBuild: (territoryId: string, buildingName: string) => { ok: boolean; error?: string };
  /** Dừng một lệnh phá dỡ khi công trình chưa bị xoá. */
  cancelDemolish: (territoryId: string, buildingName: string) => void;

  /** Ban 1 pháp lệnh trong danh mục (10.4) — trả phí + engine áp hệ số mỗi tháng. */
  issueDecree: (territoryId: string, decreeId: string) => { ok: boolean; error?: string };
  /** Bãi bỏ pháp lệnh — hệ số ngưng áp. */
  revokeDecree: (territoryId: string, decreeId: string) => void;

  /** Giải quyết 1 thỉnh nguyện Dân Tình (10.4) — áp delta Lòng Dân / Vàng. */
  resolvePetition: (territoryId: string, loyaltyDelta: number, goldDelta: number) => void;

  /** Chọn cách dùng đất trực thuộc quanh một thành trì. */
  setDemesneFocus: (territoryId: string, focus: DemesneFocus) => { ok: boolean; error?: string };
  /** Chốt toàn bộ kế hoạch mùa vụ thay vì chỉ dùng một preset. */
  setDemesnePlan: (territoryId: string, plan: DemesnePlan) => { ok: boolean; error?: string };
  /** Mở một chiến dịch hành chính tại đúng một lãnh thổ. */
  takeRegionalDecision: (regionId: string, actionId: string) => { ok: boolean; error?: string };
  /** Thi hành một quyết sách ở cấp tước địa hoặc chính thể. */
  takeFeudalDecision: (actionId: string) => { ok: boolean; error?: string };
  /** Chốt một phiên triều chính gồm nhiều quyết sách trong sức chứa bộ máy. */
  takeFeudalAgenda: (actionIds: string[]) => { ok: boolean; error?: string };
  /** Hủy một dự án đang triển khai; kinh phí đã chi không được hoàn lại. */
  cancelGovernanceProject: (projectId: string) => { ok: boolean; error?: string };
}

export const useTerritoryStore = create<TerritoryState>()(
  persist(
    (set, get) => ({
      mode: "political",
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === "political" ? "relationship" : get().mode === "relationship" ? "faction" : "political" }),

      showMarkers: true,
      showTerritory: true,
      toggleLayer: (layer) =>
        set(layer === "markers" ? { showMarkers: !get().showMarkers } : { showTerritory: !get().showTerritory }),

      selectedRegionId: null,
      selectRegion: (selectedRegionId) => set({ selectedRegionId }),

      tier: "region",
      focusHoldingId: null,
      setTier: (tier) => set(
        tier === "local" || tier === "demesne"
          ? { tier }
          : { tier, focusHoldingId: null },
      ),
      enterDemesne: (focusHoldingId) => set({ tier: "demesne", focusHoldingId, selectedRegionId: null }),
      enterLocal: (focusHoldingId) => set({ tier: "local", focusHoldingId, selectedRegionId: null }),
      exitLocal: () => set({ tier: "demesne" }),
      exitDemesne: () => set({ tier: "region", focusHoldingId: null }),

      placeBuild: (territoryId, type, x, y, opts) => {
        const stat = useMvuStore.getState().stat;
        const r = BUILDING_CATALOG[type].ring
          ? placeRing(stat, territoryId, type)
          : placeBuilding(stat, territoryId, type, x, y, opts);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      drawWall: (territoryId, points, opts) => {
        const stat = useMvuStore.getState().stat;
        const holding = stat["Lãnh Địa"][territoryId];
        const r = buildWall(stat, territoryId, points, {
          ...opts,
          map: holding ? terrainOf(territoryId, holding) : undefined,
        });
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      raiseWall: (territoryId, wallId) => {
        const stat = useMvuStore.getState().stat;
        const holding = stat["Lãnh Địa"][territoryId];
        const r = upgradeWall(stat, territoryId, wallId, holding ? terrainOf(territoryId, holding) : undefined);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      razeWall: (territoryId, wallId) => {
        applyEngineOps(demolishWall(useMvuStore.getState().stat, territoryId, wallId));
      },

      drawRoad: (territoryId, points, opts) => {
        const result = buildRoad(useMvuStore.getState().stat, territoryId, points, opts);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      freezeAutoRoads: (territoryId, roads) => {
        applyEngineOps(freezeAutoRoadsOps(useMvuStore.getState().stat, territoryId, roads));
      },

      razeRoad: (territoryId, roadId) => {
        applyEngineOps(removeRoad(useMvuStore.getState().stat, territoryId, roadId));
      },

      razeAutoRoad: (territoryId, roadId) => {
        applyEngineOps(removeAutoRoad(useMvuStore.getState().stat, territoryId, roadId));
      },

      restoreAutoRoads: (territoryId) => {
        applyEngineOps(restoreAutoRoads(useMvuStore.getState().stat, territoryId));
      },

      tradeOrder: (regionId, goodId, quantity, side, destination) => {
        const stat = useMvuStore.getState().stat;
        const r = executeOrder(stat, regionId, goodId, quantity, side, destination);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      captureRegion: (regionId, newHouseId) => {
        const region = REGIONS_BY_ID[regionId];
        if (!region) {
          log.warn(`captureRegion: vùng không tồn tại — ${regionId}`);
          return;
        }
        const stat = useMvuStore.getState().stat;
        const pHouse = playerHouseId(stat);
        const before = stat["Chủ Quyền Lãnh Thổ"][regionId]?.["Nhà Kiểm Soát"] ?? "";
        if (before === newHouseId) return; // không đổi → bỏ qua (idempotent reroll)

        applyEngineOps(captureRegionOps(stat, regionId, newHouseId, currentDay()));

        const houseLabel = HOUSES_BY_ID[newHouseId]?.name ?? newHouseId ?? "vô chủ";
        if (!!pHouse && newHouseId === pHouse) {
          pushToast("territory", `Ngươi đã chiếm được ${region.name}!`);
        } else if (before === pHouse && !!pHouse) {
          pushToast("territory_lost", `Ngươi đã mất ${region.name} vào tay ${houseLabel}.`);
        } else {
          pushToast("territory", `${region.name} đổi chủ: ${houseLabel} tiếp quản.`);
        }
        log.info(`Đổi chủ ${regionId}: ${before || "vô chủ"} → ${newHouseId || "vô chủ"}`);
      },

      startBuild: (territoryId, type, name) => {
        const r = startConstruction(useMvuStore.getState().stat, territoryId, type, name);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      cancelBuild: (territoryId, buildingName) => {
        applyEngineOps(cancelConstruction(useMvuStore.getState().stat, territoryId, buildingName));
      },

      demolishBuild: (territoryId, buildingName) => {
        const r = startDemolition(useMvuStore.getState().stat, territoryId, buildingName);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      cancelDemolish: (territoryId, buildingName) => {
        applyEngineOps(cancelDemolition(useMvuStore.getState().stat, territoryId, buildingName));
      },

      issueDecree: (territoryId, decreeId) => {
        const r = issueDecreeOps(useMvuStore.getState().stat, territoryId, decreeId);
        if (!r.ok) return { ok: false, error: r.error };
        applyEngineOps(r.ops);
        return { ok: true };
      },

      revokeDecree: (territoryId, decreeId) => {
        applyEngineOps(revokeDecreeOps(useMvuStore.getState().stat, territoryId, decreeId));
      },

      resolvePetition: (territoryId, loyaltyDelta, goldDelta) => {
        const ops: PatchOp[] = [];
        if (loyaltyDelta) ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Trung Thành`, value: loyaltyDelta });
        if (goldDelta) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: goldDelta });
        applyEngineOps(ops);
      },

      setDemesneFocus: (territoryId, focus) => {
        const result = changeDemesneFocus(useMvuStore.getState().stat, territoryId, focus);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      setDemesnePlan: (territoryId, plan) => {
        const result = changeDemesnePlan(useMvuStore.getState().stat, territoryId, plan);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      takeRegionalDecision: (regionId, actionId) => {
        const result = takeRegionalAction(useMvuStore.getState().stat, regionId, actionId);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      takeFeudalDecision: (actionId) => {
        const result = takeFeudalAction(useMvuStore.getState().stat, actionId);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      takeFeudalAgenda: (actionIds) => {
        const result = takeFeudalAgenda(useMvuStore.getState().stat, actionIds);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },

      cancelGovernanceProject: (projectId) => {
        const result = cancelGovernanceProject(useMvuStore.getState().stat, projectId);
        if (!result.ok) return { ok: false, error: result.error };
        applyEngineOps(result.ops);
        return { ok: true };
      },
    }),
    {
      name: "asoiaf-territory",
      version: 1,
      partialize: (s) => ({ mode: s.mode, showMarkers: s.showMarkers, showTerritory: s.showTerritory, tier: s.tier }),
    },
  ),
);
