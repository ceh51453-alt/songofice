/**
 * useCourtStore — UI Triều Đình (13.5) + điều phối hành động engine (13.1-13.4).
 * Nguồn chân lý (Tiểu Hội Đồng / Gia Tộc Học) ở mvuStore; store này giữ trạng
 * thái chọn ghế + modal bổ nhiệm, và gọi engine (court/succession) qua applyPatch
 * (engine giữ số — được ghi field `_`, khác đường AI/extractor).
 */
import { create } from "zustand";
import { useMvuStore } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import type { CourtPosition } from "../mvu/schema";
import { appointOps, dismissOps } from "../strategy/court";
import {
  marriageOps, proposeBetrothalOps, acceptBetrothalOps, rejectBetrothalOps,
  setSuccessionLawOps, designateHeirOps, reconcileSuccessionOps,
  type SuccessionLaw, type BetrothalInput, type MarriageOpts,
} from "../strategy/succession";
import { createLogger } from "../lib/log";

const log = createLogger("court");

function applyEngineOps(ops: PatchOp[]): void {
  if (ops.length === 0) return;
  const mvu = useMvuStore.getState();
  const { state, warnings } = applyPatch(mvu.stat, ops);
  for (const w of warnings) log.warn(`Engine op: ${w.reason}`);
  useMvuStore.setState({ stat: state });
}

function pushToast(text: string): void {
  useMvuStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { kind: "territory", text }] }));
}

interface CourtState {
  /** ghế đang mở thẻ chi tiết (13.5); null = đóng. */
  selectedSeat: CourtPosition | null;
  selectSeat: (p: CourtPosition | null) => void;
  /** ghế đang mở modal bổ nhiệm. */
  appointFor: CourtPosition | null;
  openAppoint: (p: CourtPosition | null) => void;

  appoint: (position: CourtPosition, npcName: string) => void;
  dismiss: (position: CourtPosition) => void;

  setSuccessionLaw: (law: SuccessionLaw) => void;
  designateHeir: (name: string) => void;
  reconcileHeir: () => void;

  marry: (spouseName: string, opts: MarriageOpts) => void;
  proposeBetrothal: (id: string, b: BetrothalInput) => void;
  acceptBetrothal: (id: string) => { ok: boolean };
  rejectBetrothal: (id: string) => void;
}

export const useCourtStore = create<CourtState>()((set) => ({
  selectedSeat: null,
  selectSeat: (selectedSeat) => set({ selectedSeat }),
  appointFor: null,
  openAppoint: (appointFor) => set({ appointFor }),

  appoint: (position, npcName) => {
    applyEngineOps(appointOps(useMvuStore.getState().stat, position, npcName));
    set({ appointFor: null, selectedSeat: null });
    pushToast(`${npcName} được bổ nhiệm làm ${position}.`);
  },

  dismiss: (position) => {
    applyEngineOps(dismissOps(position));
    set({ selectedSeat: null });
    pushToast(`Đã bãi chức ${position}.`);
  },

  setSuccessionLaw: (law) => applyEngineOps(setSuccessionLawOps(useMvuStore.getState().stat, law)),

  designateHeir: (name) => {
    applyEngineOps(designateHeirOps(useMvuStore.getState().stat, name));
    pushToast(`${name} được chỉ định làm người thừa kế.`);
  },

  reconcileHeir: () => applyEngineOps(reconcileSuccessionOps(useMvuStore.getState().stat)),

  marry: (spouseName, opts) => {
    applyEngineOps(marriageOps(useMvuStore.getState().stat, spouseName, opts));
    pushToast(`Hôn lễ với ${spouseName} đã định.`);
  },

  proposeBetrothal: (id, b) => applyEngineOps(proposeBetrothalOps(id, b)),

  acceptBetrothal: (id) => {
    const ops = acceptBetrothalOps(useMvuStore.getState().stat, id);
    if (ops.length === 0) return { ok: false };
    applyEngineOps(ops);
    pushToast("Ngươi chấp nhận hôn ước — liên minh mới hình thành.");
    return { ok: true };
  },

  rejectBetrothal: (id) => {
    applyEngineOps(rejectBetrothalOps(id));
    pushToast("Ngươi khước từ lời cầu hôn.");
  },
}));
