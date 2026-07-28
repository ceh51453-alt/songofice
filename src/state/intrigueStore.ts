/**
 * useIntrigueStore — UI Mưu Đồ (14.5) + điều phối hành động engine (14.1-14.4).
 * Nguồn chân lý (Tình Báo/Âm Mưu/Tù Binh) ở mvuStore; store này gọi engine
 * (intrigue) qua applyPatch (engine giữ số — được ghi field `_`). Hành động có
 * rủi ro (ám sát/kích âm mưu/tống tiền) dùng seed cố định từ 5bis.1.
 */
import { create } from "zustand";
import { useMvuStore, currentSeedInfo } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import { eventSeed } from "../probability/rng";
import type { ResultGrade } from "../probability/grades";
import {
  recruitSpyOps, setSpyMissionOps, recallSpyOps,
  startPlotOps, advancePlotOps, resolvePlot,
  attemptAssassination, blackmailOps,
  ransomOps, exchangeOps, executeOps, setTreatmentOps,
  type PlotSeed,
} from "../strategy/intrigue";
import { createLogger } from "../lib/log";

const log = createLogger("intrigue");

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

function actionSeed(label: string): number {
  const { rootSeed, tick } = currentSeedInfo();
  return eventSeed(rootSeed, tick, label);
}

interface IntrigueState {
  recruitSpy: (alias: string, target: string) => { ok: boolean; error?: string };
  setSpyMission: (alias: string, mission: string) => void;
  recallSpy: (alias: string) => void;

  startPlot: (name: string, seed: PlotSeed) => void;
  advancePlot: (name: string, resources: number) => { exposed: boolean; progress: number };
  activatePlot: (name: string) => { ok: boolean; success?: boolean; grade?: ResultGrade };

  assassinate: (targetName: string) => { killed: boolean; exposed: boolean; grade: ResultGrade };
  blackmail: (npcName: string, intelKey: string) => { success: boolean; grade: ResultGrade };

  ransomCaptive: (name: string) => void;
  exchangeCaptive: (name: string) => void;
  executeCaptive: (name: string) => void;
  setTreatment: (name: string, treatment: string) => void;
}

export const useIntrigueStore = create<IntrigueState>()(() => ({
  recruitSpy: (alias, target) => {
    const r = recruitSpyOps(useMvuStore.getState().stat, alias, target);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    pushToast(`Điệp viên "${alias}" đã cài vào ${target || "mục tiêu"}.`);
    return { ok: true };
  },
  setSpyMission: (alias, mission) => applyEngineOps(setSpyMissionOps(alias, mission)),
  recallSpy: (alias) => {
    applyEngineOps(recallSpyOps(alias));
    pushToast(`Đã rút điệp viên "${alias}" về an toàn.`);
  },

  startPlot: (name, seed) => {
    applyEngineOps(startPlotOps(name, seed));
    pushToast(`Âm mưu "${name}" đã khởi động trong bóng tối.`);
  },

  advancePlot: (name, resources) => {
    const r = advancePlotOps(useMvuStore.getState().stat, name, resources);
    applyEngineOps(r.ops);
    if (r.exposed) pushToast(`Âm mưu "${name}" suýt bại lộ — mục tiêu bắt đầu nghi ngờ!`);
    return { exposed: r.exposed, progress: r.progress };
  },

  activatePlot: (name) => {
    const r = resolvePlot(useMvuStore.getState().stat, name, actionSeed(`plot:${name}`));
    if (!r) return { ok: false };
    applyEngineOps(r.ops);
    pushToast(r.success ? `Âm mưu "${name}" thành công!` : `Âm mưu "${name}" thất bại — mục tiêu phản đòn.`);
    return { ok: true, success: r.success, grade: r.result.grade };
  },

  assassinate: (targetName) => {
    const r = attemptAssassination(useMvuStore.getState().stat, targetName, actionSeed(`assassin:${targetName}`));
    applyEngineOps(r.ops);
    pushToast(r.killed ? `${targetName} đã bị hạ sát.` : r.exposed ? `Ám sát ${targetName} thất bại — sát thủ bị lộ!` : `Ám sát ${targetName} bất thành.`);
    return { killed: r.killed, exposed: r.exposed, grade: r.result.grade };
  },

  blackmail: (npcName, intelKey) => {
    const r = blackmailOps(useMvuStore.getState().stat, npcName, intelKey, actionSeed(`blackmail:${npcName}`));
    applyEngineOps(r.ops);
    pushToast(r.success ? `Ngươi khống chế được ${npcName}.` : `${npcName} không chịu khuất phục.`);
    return { success: r.success, grade: r.result.grade };
  },

  ransomCaptive: (name) => {
    applyEngineOps(ransomOps(useMvuStore.getState().stat, name));
    pushToast(`Đã đòi tiền chuộc và thả ${name}.`);
  },
  exchangeCaptive: (name) => {
    applyEngineOps(exchangeOps(useMvuStore.getState().stat, name));
    pushToast(`Đã trao đổi con tin ${name}.`);
  },
  executeCaptive: (name) => {
    applyEngineOps(executeOps(useMvuStore.getState().stat, name));
    pushToast(`Ngươi đã hành quyết ${name} — tiếng dữ đồn xa.`);
  },
  setTreatment: (name, treatment) => applyEngineOps(setTreatmentOps(useMvuStore.getState().stat, name, treatment)),
}));
