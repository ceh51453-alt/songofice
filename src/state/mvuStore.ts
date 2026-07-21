/**
 * useMvuStore — giữ Bảng Trạng Thái (stat_data, NGUỒN CHÂN LÝ) + luồng ghi:
 * extract ops (đã lọc) → snapshot → applyPatch → hiệu ứng lan toả → events.
 * Path "stat_data.*" từ macro/lore getvar-setvar cũng đọc/ghi qua đây
 * (3.1b.3 — biến preset và stat_data là "cùng một store").
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StatDataSchema, makeDefaultState, type StatData } from "../mvu/schema";
import { applyPatch, parsePath, type PatchOp } from "../mvu/patchEngine";
import { runCascadeEffects, recomputeDerived, type EffectEvent } from "../mvu/effects";
import { newRootSeed } from "../probability/rng";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/store");

export interface AppliedTurn {
  events: EffectEvent[];
  changedPaths: string[];
  daysPassed: number;
}

interface MvuState {
  stat: StatData;
  /** sự kiện lượt gần nhất (toast 6.4) — UI đọc rồi clear. */
  pendingEvents: EffectEvent[];
  /** path đổi lượt gần nhất (highlight panel 6.4). */
  lastChangedPaths: string[];

  /** Ván mới: state mặc định + seed gốc mới (5bis.1). */
  newGame: () => void;
  /** Deep-clone snapshot cho reroll/rollback (5.3). */
  getSnapshot: () => StatData;
  restoreSnapshot: (snapshot: StatData) => void;
  /** Áp ops CỦA AI (đã qua extractor) + hiệu ứng lan toả + tăng turnCount. */
  applyAiOps: (ops: PatchOp[]) => AppliedTurn;
  /** Đọc giá trị theo path (getvar lore/macro). */
  getByPath: (path: string) => unknown;
  /** Ghi 1 giá trị theo path (setvar preset ghi lúc render — 3.1b.3). */
  setByPath: (path: string, value: unknown) => void;
  clearEvents: () => void;
}

function getAt(obj: unknown, parts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function freshState(): StatData {
  const state = makeDefaultState();
  state["_engineMeta"]["_Seed Gốc"] = newRootSeed();
  recomputeDerived(state);
  state["Chỉ Số Sinh Tồn"]["HP"] = state["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  state["Chỉ Số Sinh Tồn"]["Thể Lực"] = state["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"];
  return state;
}

export const useMvuStore = create<MvuState>()(
  persist(
    (set, get) => ({
      stat: freshState(),
      pendingEvents: [],
      lastChangedPaths: [],

      newGame: () => {
        set({ stat: freshState(), pendingEvents: [], lastChangedPaths: [] });
        log.info("Ván mới — state + seed gốc mới");
      },

      getSnapshot: () => structuredClone(get().stat),

      restoreSnapshot: (snapshot) => {
        // validate snapshot qua schema (an toàn khi load save cũ)
        const parsed = StatDataSchema.safeParse(snapshot);
        set({ stat: parsed.success ? parsed.data : get().stat, pendingEvents: [], lastChangedPaths: [] });
      },

      applyAiOps: (ops) => {
        const prev = get().stat;
        const { state: patched, warnings, changedPaths } = applyPatch(prev, ops);
        const { state: cascaded, events, daysPassed } = runCascadeEffects(prev, patched);
        cascaded["_engineMeta"]["turnCount"] += 1;
        for (const w of warnings) log.warn(`Patch warning: ${w.reason}`);
        set({ stat: cascaded, pendingEvents: [...get().pendingEvents, ...events], lastChangedPaths: changedPaths });
        return { events, changedPaths, daysPassed };
      },

      getByPath: (path) => getAt(get().stat, parsePath(path)),

      setByPath: (path, value) => {
        const { state, warnings } = applyPatch(get().stat, [{ op: "replace", path, value }]);
        if (warnings.length > 0) log.warn("setByPath warning", warnings);
        set({ stat: state });
      },

      clearEvents: () => set({ pendingEvents: [] }),
    }),
    { name: "asoiaf-mvu", version: 1, partialize: (s) => ({ stat: s.stat }) },
  ),
);

/** RNG root/turn hiện tại — mọi stream (macro, lore, check) dẫn xuất từ đây. */
export function currentSeedInfo(): { rootSeed: number; turnCount: number } {
  const meta = useMvuStore.getState().stat["_engineMeta"];
  return { rootSeed: meta["_Seed Gốc"], turnCount: meta["turnCount"] };
}
