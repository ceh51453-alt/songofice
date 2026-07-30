/**
 * useIntrigueStore — điều phối hành động mưu đồ (14.1-14.4 + đại tu M20).
 *
 * M20: bảng Mưu Đồ KHÔNG CÒN NÚT BẤM. Mọi việc — cài tai mắt, ghi bí mật, khởi
 * âm mưu, tống tiền, ám sát, xử con tin — đi vào qua THẺ AI (`applyIntrigueTags`)
 * rồi chạy đúng các hàm engine cũ, nên luật không đổi và số vẫn do engine giữ.
 * Các action lẻ giữ nguyên chữ ký để engine/test gọi trực tiếp được.
 *
 * Hành động có rủi ro (ám sát/kích âm mưu/tống tiền) dùng seed cố định từ 5bis.1.
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
  // ── M20 ──
  plantSpyOps, recordSecretOps, noteEnemySpyOps, seizeEnemySpyOps,
  startPlotFullOps, fundPlotOps, setPlotInvestigatorOps, bestSecretAgainst,
  type PlotSeed,
} from "../strategy/intrigue";
import type { IntrigueTagType } from "../ui/tags/parseNarrative";
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

  /** Thẻ mưu đồ do AI phát (M20) — cửa duy nhất từ lời kể vào cỗ máy. */
  applyIntrigueTags: (
    tags: { type: IntrigueTagType; attrs: Record<string, string>; content: string }[],
  ) => string[];
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

  applyIntrigueTags: (tags) => {
    const notes: string[] = [];
    const store = useIntrigueStore.getState();

    for (const tag of tags) {
      const a = tag.attrs;
      const stat = () => useMvuStore.getState().stat;

      switch (tag.type) {
        case "spy": {
          const alias = a.alias || a.name || "";
          const action = (a.action || "plant").toLowerCase();
          if (action === "recall") {
            store.recallSpy(alias);
            notes.push(`Rút ${alias} về`);
          } else if (action === "mission") {
            store.setSpyMission(alias, a.mission || "Thu Thập Tin");
            notes.push(`${alias} đổi việc: ${a.mission}`);
          } else {
            const r = plantSpyOps(stat(), alias, {
              target: a.target, kind: a.kind, mission: a.mission, handler: a.handler,
              cost: a.cost ? Number(a.cost) : undefined,
            });
            if (!r.ok) { notes.push(`Cài tai mắt thất bại: ${r.error}`); break; }
            applyEngineOps(r.ops);
            notes.push(`Cài ${alias} (${a.kind || "Điệp Viên"}) vào ${a.target || "mục tiêu"}`);
          }
          break;
        }

        case "secret": {
          const key = a.topic || a.key || a.about || `Bí mật ${Object.keys(stat()["Tình Báo"]["Bí Mật"]).length + 1}`;
          applyEngineOps(recordSecretOps(stat(), key, {
            about: a.about, topic: a.topic, content: tag.content || a.content,
            weight: a.weight ? Number(a.weight) : undefined,
            credibility: a.credibility ? Number(a.credibility) : undefined,
            source: a.source,
          }));
          notes.push(`Ghi bí mật về ${a.about || "?"}: ${key}`);
          break;
        }

        case "enemy_spy": {
          const key = a.suspect || a.name || a.key || "Kẻ lạ";
          const action = (a.action || "note").toLowerCase();
          if (action === "seize" || action === "arrest") {
            const r = seizeEnemySpyOps(stat(), key);
            if (!r.ok) { notes.push(`Bắt tai mắt địch thất bại: ${r.error}`); break; }
            applyEngineOps(r.ops);
            notes.push(`Bắt ${key}`);
          } else {
            applyEngineOps(noteEnemySpyOps(key, {
              house: a.house, suspect: a.suspect, watching: a.watching,
              evidence: a.evidence ? Number(a.evidence) : undefined, note: tag.content,
            }));
            notes.push(`Nghi vấn: ${key} là tai mắt của ${a.house || "?"}`);
          }
          break;
        }

        case "plot": {
          const name = a.name || a.plot || "";
          const action = (a.action || "start").toLowerCase();
          if (action === "fund") {
            const r = fundPlotOps(stat(), name, Number(a.gold) || 0);
            if (!r.ok) { notes.push(`Rót vốn thất bại: ${r.error}`); break; }
            applyEngineOps(r.ops);
            notes.push(`Rót ${a.gold} vào ${name}`);
          } else if (action === "investigate") {
            applyEngineOps(setPlotInvestigatorOps(name, a.who || a.investigator || "Kẻ giấu mặt"));
            notes.push(`${a.who || "Có kẻ"} đang lần theo ${name}`);
          } else if (action === "resolve" || action === "strike") {
            const r = store.activatePlot(name);
            notes.push(r.ok ? `Ra tay: ${name} → ${r.success ? "thành" : "bại"}` : `Chưa thể ra tay: ${name}`);
          } else {
            applyEngineOps(startPlotFullOps(stat(), name, {
              type: a.type, target: a.target,
              allies: a.allies ? a.allies.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [],
              stake: a.stake, note: tag.content,
            }));
            notes.push(`Khởi âm mưu ${name} (${a.type || "Vu Khống"}) nhắm ${a.target || "?"}`);
          }
          break;
        }

        case "blackmail": {
          const npc = a.target || a.npc || "";
          const secret = a.secret || bestSecretAgainst(stat(), npc)?.[0] || "";
          const r = store.blackmail(npc, secret);
          notes.push(`Tống tiền ${npc}: ${r.success ? "khuất phục" : "không xong"} (${r.grade})`);
          break;
        }

        case "assassination": {
          const npc = a.target || a.npc || "";
          const r = store.assassinate(npc);
          notes.push(`Ám sát ${npc}: ${r.killed ? "hạ được" : r.exposed ? "lộ sát thủ" : "bất thành"}`);
          break;
        }

        case "captive": {
          const name = a.name || a.captive || "";
          const action = (a.action || "treat").toLowerCase();
          if (action === "ransom") { store.ransomCaptive(name); notes.push(`Đòi chuộc ${name}`); }
          else if (action === "exchange") { store.exchangeCaptive(name); notes.push(`Trao đổi ${name}`); }
          else if (action === "execute") { store.executeCaptive(name); notes.push(`Hành quyết ${name}`); }
          else { store.setTreatment(name, a.treatment || "Giam Lỏng"); notes.push(`${name} → ${a.treatment}`); }
          break;
        }
      }
    }
    for (const n of notes) log.info(`Thẻ mưu đồ: ${n}`);
    return notes;
  },
}));
