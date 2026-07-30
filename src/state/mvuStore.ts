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
import { absoluteDay, normalizeCalendar } from "../mvu/calendar";
import { normalizeHouseIds } from "../territory/territoryEngine";
import { repairAllHoldings } from "../territory/localMap";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/store");

export interface AppliedTurn {
  events: EffectEvent[];
  changedPaths: string[];
  daysPassed: number;
  monthsPassed: number;
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
  /** Áp ops CỦA AI (đã qua extractor) + hiệu ứng lan toả + tăng nhịp RNG. */
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

/**
 * Zustand chỉ gọi `migrate` khi tăng version. Vì thế state từng được lưu ở
 * phiên bản thiếu một bảng mới (như Ngoại Giao) phải được ghép với default
 * trước khi giao cho UI; nếu không, một panel có thể đọc vào `undefined` và
 * làm toàn bộ ứng dụng rơi vào ErrorBoundary.
 */
function deepMergeStateDefaults(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (
      value !== null && typeof value === "object" && !Array.isArray(value) &&
      current !== null && typeof current === "object" && !Array.isArray(current)
    ) {
      merged[key] = deepMergeStateDefaults(current as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

function repairPersistedStat(raw: unknown): StatData {
  const defaults = makeDefaultState();
  const merged = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? deepMergeStateDefaults(defaults as unknown as Record<string, unknown>, raw as Record<string, unknown>)
    : defaults;
  const parsed = StatDataSchema.safeParse(merged);
  if (parsed.success) return parsed.data;
  log.warn("Không thể sửa state đã lưu; tạo state mặc định", parsed.error.flatten());
  return defaults;
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
        const { state: cascaded, events, daysPassed, monthsPassed } = runCascadeEffects(prev, patched);
        cascaded["_engineMeta"]["_Nhịp"] += 1;
        for (const w of warnings) log.warn(`Patch warning: ${w.reason}`);
        set({ stat: cascaded, pendingEvents: [...get().pendingEvents, ...events], lastChangedPaths: changedPaths });
        return { events, changedPaths, daysPassed, monthsPassed };
      },

      getByPath: (path) => getAt(get().stat, parsePath(path)),

      setByPath: (path, value) => {
        const { state, warnings } = applyPatch(get().stat, [{ op: "replace", path, value }]);
        if (warnings.length > 0) log.warn("setByPath warning", warnings);
        set({ stat: state });
      },

      clearEvents: () => set({ pendingEvents: [] }),
    }),
    {
      name: "asoiaf-mvu",
      version: 4,
      partialize: (s) => ({ stat: s.stat }),
      /**
       * v1 → v2: ván cũ dùng lịch 1 field (Ngày = 1-360 trong năm, chưa có
       * Tháng) — normalizeCalendar tách lại đúng (Ngày 250 → tháng 9 ngày 10).
       * v2 → v3: bản đồ đa tầng — chuẩn hoá khoá Nhà và dời công trình của hệ
       * lưới cũ về ô hợp lệ trên lưới lãnh địa 5 m.
       * v3 → v4: bù toàn bộ bảng mặc định thiếu trong state đã lưu, gồm Ngoại
       * Giao. Tránh UI đọc `Lời Đề Nghị` từ một state của build cũ.
       */
      migrate: (persisted, version) => {
        const s = persisted as { stat?: unknown } | undefined;
        if (!s?.stat) return { stat: freshState() };
        const stat = repairPersistedStat(s.stat);
        if (version < 2) {
          normalizeCalendar(stat["Thế Giới"]);
          log.info(`Migrate save v${version} → v2: lịch Ngày/Tháng/Năm`);
        }
        if (version < 3) {
          normalizeHouseIds(stat);
          const moved = repairAllHoldings(stat);
          log.info(`Migrate save v${version} → v3: bản đồ đa tầng (dời ${moved} công trình)`);
        }
        if (version < 4) log.info(`Migrate save v${version} → v4: bù bảng state mới`);
        return { stat };
      },
    },
  ),
);

/**
 * RNG root + nhịp hiện tại — mọi stream (macro, lore, check) dẫn xuất từ đây.
 * `tick` là số lượt trả lời, KHÔNG phải thời gian trong game: giữ mỗi lượt một
 * chuỗi RNG riêng kể cả khi thời gian truyện không trôi (5bis.1).
 */
export function currentSeedInfo(): { rootSeed: number; tick: number } {
  const meta = useMvuStore.getState().stat["_engineMeta"];
  return { rootSeed: meta["_Seed Gốc"], tick: meta["_Nhịp"] };
}

/** Ngày tuyệt đối hiện tại — mốc so sánh cho hạn chót, ngày bắt, ngày đổi chủ. */
export function currentDay(): number {
  return absoluteDay(useMvuStore.getState().stat["Thế Giới"]);
}
