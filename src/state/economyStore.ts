/**
 * economyStore (M12) — Zustand store cho UI Kinh Tế:
 * - Panel mở/đóng
 * - Lịch sử Vàng qua các turn (cho sparkline)
 * - Action thay đổi thuế, mở/đóng panel
 */
import { create } from "zustand";
import type { StatData } from "../mvu/schema";
import { estimateNetIncome, turnsUntilBankrupt, isInDebt } from "../economy/economyEngine";

interface GoldHistoryEntry {
  turn: number;
  gold: number;
}

interface EconomyState {
  panelOpen: boolean;
  goldHistory: GoldHistoryEntry[];
  maxHistoryLength: number;
  /** GĐ4: xu hướng kinh tế toàn Westeros (không chỉ player). */
  worldEconomicTrend: "rising" | "stable" | "declining" | "crisis";

  // actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Ghi snapshot Vàng vào history (gọi mỗi turn trong UI). */
  recordGold: (turn: number, gold: number) => void;
  clearHistory: () => void;
  /** GĐ4: cập nhật xu hướng kinh tế thế giới. */
  setWorldTrend: (trend: "rising" | "stable" | "declining" | "crisis") => void;
}

export const useEconomyStore = create<EconomyState>()((set) => ({
  panelOpen: false,
  goldHistory: [],
  maxHistoryLength: 30,
  worldEconomicTrend: "stable",

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  recordGold: (turn, gold) =>
    set((s) => {
      // tránh ghi trùng turn
      if (s.goldHistory.length > 0 && s.goldHistory[s.goldHistory.length - 1].turn === turn) {
        return s;
      }
      const history = [...s.goldHistory, { turn, gold }];
      if (history.length > s.maxHistoryLength) history.shift();
      return { goldHistory: history };
    }),

  clearHistory: () => set({ goldHistory: [] }),

  setWorldTrend: (trend) => set({ worldEconomicTrend: trend }),
}));

// ── Derived selectors (pure functions, đọc từ mvuStore.stat) ──

/** Sparkline data: mảng Vàng từ history. */
export function goldSparklineData(store: EconomyState): number[] {
  return store.goldHistory.map((h) => h.gold);
}

/** Summary cho UI header. */
export function economySummary(stat: StatData) {
  const income = estimateNetIncome(stat);
  return {
    gold: stat["Thông Tin Nhân Vật"]["Vàng"],
    ...income,
    turnsLeft: turnsUntilBankrupt(stat),
    inDebt: isInDebt(stat),
    taxLevel: stat["Chính Sách Thuế"]["Mức Thuế"],
    tradeRouteCount: Object.keys(stat["Tuyến Thương Mại"]).length,
    crisisCount: Object.values(stat["Lãnh Địa"]).reduce(
      (sum, t) => sum + (t["Khủng Hoảng"]?.length ?? 0), 0,
    ),
  };
}
