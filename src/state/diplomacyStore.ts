/**
 * useDiplomacyStore (M20) — cửa duy nhất từ lời kể vào cỗ máy ngoại giao.
 *
 * Bảng Ngoại Giao KHÔNG CÓ NÚT BẤM: người chơi nói ra ý mình trong cuộc chơi,
 * AI kể diễn biến rồi phát thẻ (`<diplomacy>`, `<treaty>`, `<envoy>`,
 * `<grievance>`, `<offer>`) — thẻ chạy qua đúng các hàm engine ở
 * strategy/diplomacy, nên luật ngoại giao không thể bị lời kể lách qua.
 */
import { create } from "zustand";
import { useMvuStore } from "./mvuStore";
import { applyPatch, type PatchOp } from "../mvu/patchEngine";
import {
  setDiploStatus, truceOps, signTreatyOps, treatyFromAttrs, breakTreatyOps,
  addGrievanceOps, sendEnvoyOps, addOfferOps, acceptOfferOps, rejectOfferOps,
  houseLabel,
} from "../strategy/diplomacy";
import { absoluteDay } from "../mvu/calendar";
import type { DiploState } from "../mvu/schema";
import type { DiplomacyTagType } from "../ui/tags/parseNarrative";
import { createLogger } from "../lib/log";

const log = createLogger("diplomacy");

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

interface DiplomacyState {
  setStatus: (houseId: string, status: DiploState, reason?: string) => { ok: boolean; error?: string };
  truce: (houseId: string, days: number, terms?: string) => { ok: boolean; error?: string };
  signTreaty: (houseId: string, attrs: { type?: string; terms?: string; years?: string; tribute?: string }) => { ok: boolean; error?: string };
  breakTreaty: (houseId: string, reason?: string, type?: string) => { ok: boolean; error?: string };
  addGrievance: (houseId: string, deed: string, weight: number, ours: boolean) => void;
  sendEnvoy: (name: string, houseId: string, mission: string, days?: number) => { ok: boolean; error?: string };
  addOffer: (key: string, offer: Parameters<typeof addOfferOps>[2]) => { ok: boolean; error?: string };
  acceptOffer: (key: string) => { ok: boolean; error?: string };
  rejectOffer: (key: string, harsh?: boolean) => { ok: boolean; error?: string };

  /** Thẻ ngoại giao do AI phát. */
  applyDiplomacyTags: (
    tags: { type: DiplomacyTagType; attrs: Record<string, string>; content: string }[],
  ) => string[];
}

export const useDiplomacyStore = create<DiplomacyState>()(() => ({
  setStatus: (houseId, status, reason) => {
    const r = setDiploStatus(useMvuStore.getState().stat, houseId, status, reason);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  truce: (houseId, days, terms) => {
    const r = truceOps(useMvuStore.getState().stat, houseId, days, terms);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  signTreaty: (houseId, attrs) => {
    const stat = useMvuStore.getState().stat;
    const r = signTreatyOps(stat, houseId, treatyFromAttrs(stat, attrs));
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  breakTreaty: (houseId, reason, type) => {
    const r = breakTreatyOps(useMvuStore.getState().stat, houseId, reason, type);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  addGrievance: (houseId, deed, weight, ours) => {
    const stat = useMvuStore.getState().stat;
    applyEngineOps(addGrievanceOps(stat, houseId, {
      "Việc": deed,
      "Mức": Math.max(0, Math.min(100, Math.round(weight))),
      "Bên Nợ": ours ? "Họ Nợ Ta" : "Ta Nợ Họ",
      "_Ngày": absoluteDay(stat["Thế Giới"]),
    }));
  },

  sendEnvoy: (name, houseId, mission, days) => {
    const r = sendEnvoyOps(useMvuStore.getState().stat, name, houseId, mission, days);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  addOffer: (key, offer) => {
    const r = addOfferOps(useMvuStore.getState().stat, key, offer);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  acceptOffer: (key) => {
    const r = acceptOfferOps(useMvuStore.getState().stat, key);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    if (r.note) pushToast(r.note);
    return { ok: true };
  },

  rejectOffer: (key, harsh) => {
    const r = rejectOfferOps(useMvuStore.getState().stat, key, harsh);
    if (!r.ok) return { ok: false, error: r.error };
    applyEngineOps(r.ops);
    return { ok: true };
  },

  applyDiplomacyTags: (tags) => {
    const notes: string[] = [];
    const store = useDiplomacyStore.getState();

    for (const tag of tags) {
      const a = tag.attrs;
      const house = (a.house || a.with || "").toLowerCase();

      switch (tag.type) {
        case "diplomacy": {
          const status = (a.status || a.state || "") as DiploState;
          if (a.truce_days) {
            const r = store.truce(house, Number(a.truce_days) || 30, a.terms || tag.content);
            notes.push(r.ok ? `Đình chiến với ${houseLabel(house)}` : `Đình chiến thất bại: ${r.error}`);
            break;
          }
          const r = store.setStatus(house, status, a.reason || tag.content);
          notes.push(r.ok ? `${houseLabel(house)} → ${status}` : `Đổi trạng thái thất bại: ${r.error}`);
          break;
        }

        case "treaty": {
          const action = (a.action || "sign").toLowerCase();
          if (action === "break") {
            const r = store.breakTreaty(house, a.reason || tag.content, a.type);
            notes.push(r.ok ? `Xé hiệp ước với ${houseLabel(house)}` : `Xé hiệp ước thất bại: ${r.error}`);
          } else {
            const r = store.signTreaty(house, { type: a.type, terms: a.terms || tag.content, years: a.years, tribute: a.tribute });
            notes.push(r.ok ? `Ký ${a.type || "Hoà Ước"} với ${houseLabel(house)}` : `Ký hiệp ước thất bại: ${r.error}`);
          }
          break;
        }

        case "envoy": {
          const name = a.name || a.envoy || "Sứ giả";
          const r = store.sendEnvoy(name, house, a.mission || "Thăm Dò", Number(a.days) || 20);
          notes.push(r.ok ? `${name} đi sứ tới ${houseLabel(house)}` : `Cử sứ thất bại: ${r.error}`);
          break;
        }

        case "grievance": {
          const ours = (a.side || a.owed || "them").toLowerCase() !== "us";
          store.addGrievance(house, a.deed || tag.content || "Việc chưa rõ", Number(a.weight) || 20, ours);
          notes.push(`Ân oán với ${houseLabel(house)}: ${a.deed || "(ghi vào sổ)"}`);
          break;
        }

        case "offer": {
          const action = (a.action || "propose").toLowerCase();
          const key = a.key || `${house}-${a.type || "hoa-uoc"}`;
          if (action === "accept") {
            const r = store.acceptOffer(key);
            notes.push(r.ok ? `Nhận lời đề nghị ${key}` : `Nhận lời thất bại: ${r.error}`);
          } else if (action === "reject") {
            const r = store.rejectOffer(key, a.harsh === "true");
            notes.push(r.ok ? `Từ chối ${key}` : `Từ chối thất bại: ${r.error}`);
          } else {
            const r = store.addOffer(key, {
              house, type: a.type, terms: a.terms || tag.content, tribute: a.tribute,
              years: a.years, deadlineDays: a.deadline_days, bearer: a.bearer,
            });
            notes.push(r.ok ? `${houseLabel(house)} đề nghị ${a.type || "Hoà Ước"}` : `Đề nghị thất bại: ${r.error}`);
          }
          break;
        }
      }
    }
    for (const n of notes) log.info(`Thẻ ngoại giao: ${n}`);
    return notes;
  },
}));
