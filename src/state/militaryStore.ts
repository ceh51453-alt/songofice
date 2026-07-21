/**
 * useMilitaryStore — UI quân sự (11.5) + điều phối hành động engine (11.3-12.2).
 * Nguồn chân lý quân/chủ quyền ở mvuStore; store này giữ trạng thái chọn đơn vị
 * + chế độ điều quân, và gọi engine (recruit/move/siege/war) qua applyPatch
 * (engine giữ số — được ghi field `_`, khác đường AI/extractor).
 */
import { create } from "zustand";
import { useMvuStore } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import { recruitUnit, moveArmy } from "../strategy/army";
import { startSiege, declareWar, makePeace, adjustWarScore } from "../strategy/war";
import { amphibiousLandingOps, blockadeOps } from "../combat/naval";
import type { TroopTypeAll } from "../content/westeros/troopTypes";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { createLogger } from "../lib/log";

const log = createLogger("military");

function applyEngineOps(ops: PatchOp[]): void {
  if (ops.length === 0) return;
  const mvu = useMvuStore.getState();
  const { state, warnings } = applyPatch(mvu.stat, ops);
  for (const w of warnings) log.warn(`Engine op: ${w.reason}`);
  useMvuStore.setState({ stat: state });
}

interface MilitaryState {
  /** đơn vị đang chọn (điều quân/vây). */
  selectedUnit: string | null;
  selectUnit: (name: string | null) => void;
  /** chế độ điều quân trên bản đồ (highlight đích). */
  moveMode: boolean;
  setMoveMode: (v: boolean) => void;

  recruit: (territoryId: string, type: TroopTypeAll, count: number, name?: string) => { ok: boolean; error?: string };
  moveUnit: (unitName: string, targetTerritoryId: string) => { ok: boolean; error?: string; turns?: number };
  siege: (unitName: string, targetTerritoryId: string) => { ok: boolean; error?: string };
  setWar: (houseId: string, atWar: boolean) => void;
  bumpWarScore: (houseId: string, delta: number) => void;

  /** Đổ bộ (7.8): hạm đội chở bộ binh → lãnh địa ven biển địch → tạo quân đổ bộ. */
  amphibiousLanding: (fleetName: string, targetTerritoryId: string) => { ok: boolean; error?: string; unit?: string };
  /** Phong toả cảng địch (7.8) — cắt tiếp tế đường biển. */
  blockade: (fleetName: string, targetTerritoryId: string) => { ok: boolean; error?: string };
}

export const useMilitaryStore = create<MilitaryState>()((set) => ({
  selectedUnit: null,
  selectUnit: (selectedUnit) => set({ selectedUnit }),
  moveMode: false,
  setMoveMode: (moveMode) => set({ moveMode }),

  recruit: (territoryId, type, count, name) => {
    const r = recruitUnit(useMvuStore.getState().stat, territoryId, type, count, name);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  moveUnit: (unitName, targetTerritoryId) => {
    const r = moveArmy(useMvuStore.getState().stat, unitName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    set({ moveMode: false, selectedUnit: null });
    return { ok: true, turns: r.turns };
  },

  siege: (unitName, targetTerritoryId) => {
    const r = startSiege(useMvuStore.getState().stat, unitName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    set({ moveMode: false, selectedUnit: null });
    const region = REGIONS_BY_ID[targetTerritoryId];
    useMvuStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { kind: "territory", text: `Ngươi khởi binh vây ${region?.name ?? targetTerritoryId}.` }] }));
    return { ok: true };
  },

  setWar: (houseId, atWar) => applyEngineOps(atWar ? declareWar(houseId) : makePeace(houseId)),
  bumpWarScore: (houseId, delta) => applyEngineOps(adjustWarScore(houseId, delta)),

  amphibiousLanding: (fleetName, targetTerritoryId) => {
    const r = amphibiousLandingOps(useMvuStore.getState().stat, fleetName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    const region = REGIONS_BY_ID[targetTerritoryId];
    useMvuStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { kind: "territory", text: `Quân ngươi đổ bộ lên ${region?.name ?? targetTerritoryId}.` }] }));
    return { ok: true, unit: r.landingUnit };
  },

  blockade: (fleetName, targetTerritoryId) => {
    const r = blockadeOps(useMvuStore.getState().stat, fleetName, targetTerritoryId);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },
}));
