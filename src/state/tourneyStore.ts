/**
 * useTourneyStore — State quản lý đại hội đấu (Tournament).
 * Kết nối mvuStore để đọc chỉ số nhân vật và áp phần thưởng.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMvuStore } from "./mvuStore";
import {
  createTourneyState,
  registerEvent,
  startEvent,
  playTourneyRound,
  finishEvent,
  
  type TourneyState,
  type PlayerStats,
} from "../minigame/tourneyEngine";
import {
  
  CANON_TOURNEYS,
  type TourneyEventType,
  
} from "../content/westeros/tourneyData";
import { createLogger } from "../lib/log";
import { EXCHANGE_RATES } from "../economy/currency";

const log = createLogger("tourney");

export type TourneyPhase = "idle" | "active";

export interface TourneyHistoryEntry {
  tourneyId: string;
  tourneyName: string;
  events: { type: TourneyEventType; place: number | null }[];
  totalGold: number;
  totalGlory: number;
  timestamp: number;
}

interface TourneyStoreState {
  phase: TourneyPhase;
  tourneyState: TourneyState | null;
  history: TourneyHistoryEntry[];

  // ── Actions ──
  openTourney: (tourneyId: string) => void;
  openCustomTourney: (name: string, location: string, events: TourneyEventType[]) => void;
  registerForEvent: (eventType: TourneyEventType) => void;
  startCompeting: (eventType: TourneyEventType) => void;
  fight: () => void;
  nextEvent: () => void;
  claimRewards: () => void;
  exitTourney: () => void;
}

function nextSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ^ Date.now()) >>> 0;
}

/** Lấy chỉ số nhân vật từ mvuStore. */
function getPlayerStats(): PlayerStats {
  const stat = useMvuStore.getState().stat;
  const core = stat["Chỉ Số Cốt Lõi"];
  const skills = stat["Kỹ Năng"];

  // Tìm skill level cao nhất trong nhóm Chiến Đấu
  let maxSkill = 0;
  for (const [, sk] of Object.entries(skills)) {
    if (sk["Nhóm"] === "Chiến Đấu" && sk["Cấp"] > maxSkill) {
      maxSkill = sk["Cấp"];
    }
  }

  return {
    sucManh: core["Sức Mạnh"],
    nhanhNhen: core["Nhanh Nhẹn"],
    theChat: core["Thể Chất"],
    triTue: core["Trí Tuệ"],
    tinhTuong: core["Tinh Tường"],
    uyTin: core["Uy Tín"],
    skillLevel: maxSkill,
  };
}

export const useTourneyStore = create<TourneyStoreState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      tourneyState: null,
      history: [],

      openTourney: (tourneyId) => {
        const tourney = CANON_TOURNEYS.find((t) => t.id === tourneyId);
        if (!tourney) {
          log.warn(`Không tìm thấy đại hội: ${tourneyId}`);
          return;
        }
        const state = createTourneyState(tourney);
        set({ phase: "active", tourneyState: state });
        log.info(`Mở đại hội: ${tourney.name} tại ${tourney.location}`);
      },

      openCustomTourney: (name, location, events) => {
        const gameYear = useMvuStore.getState().stat["Thế Giới"]["Năm"] ?? 298;
        const state = createTourneyState({
          id: "custom-" + Date.now(),
          name,
          location,
          events,
          prizeMultiplier: 1.0,
        }, gameYear);
        set({ phase: "active", tourneyState: state });
        log.info(`Mở đại hội tùy chỉnh: ${name} (năm ${gameYear} AC)`);
      },

      registerForEvent: (eventType) => {
        const { tourneyState } = get();
        if (!tourneyState) return;
        set({ tourneyState: registerEvent(tourneyState, eventType) });
      },

      startCompeting: (eventType) => {
        const { tourneyState } = get();
        if (!tourneyState) return;
        set({ tourneyState: startEvent(tourneyState, eventType) });
      },

      fight: () => {
        const { tourneyState } = get();
        if (!tourneyState?.activeEvent) return;

        const playerStats = getPlayerStats();
        const canon = CANON_TOURNEYS.find((t) => t.id === tourneyState.tourneyId) ?? null;
        const newState = playTourneyRound(tourneyState, playerStats, nextSeed(), canon);
        set({ tourneyState: newState });
      },

      nextEvent: () => {
        const { tourneyState } = get();
        if (!tourneyState) return;
        set({ tourneyState: finishEvent(tourneyState) });
      },

      claimRewards: () => {
        const { tourneyState } = get();
        if (!tourneyState) return;

        const stat = useMvuStore.getState().stat;

        // Áp vàng
        if (tourneyState.totalGoldWon > 0) {
          // goldPrize trong tourneyData viết theo RỒNG VÀNG
          stat["Thông Tin Nhân Vật"]["Ngân Khố"] += tourneyState.totalGoldWon * EXCHANGE_RATES.GOLD_TO_COPPER;
        }

        // Áp Uy Dũng
        if (tourneyState.totalGloryWon > 0) {
          stat["Danh Vọng"]["Uy Dũng"] = Math.min(
            100,
            (stat["Danh Vọng"]["Uy Dũng"] ?? 0) + tourneyState.totalGloryWon,
          );
        }

        // Ghi lịch sử
        const entry: TourneyHistoryEntry = {
          tourneyId: tourneyState.tourneyId,
          tourneyName: tourneyState.tourneyName,
          events: tourneyState.completedEvents.map((e) => ({
            type: e.type,
            place: e.finalPlace,
          })),
          totalGold: tourneyState.totalGoldWon,
          totalGlory: tourneyState.totalGloryWon,
          timestamp: Date.now(),
        };

        log.info(`Đại hội ${tourneyState.tourneyName} kết thúc: +${tourneyState.totalGoldWon} Vàng, +${tourneyState.totalGloryWon} Uy Dũng`);

        set({
          phase: "idle",
          tourneyState: null,
          history: [...get().history, entry],
        });
      },

      exitTourney: () => {
        set({ phase: "idle", tourneyState: null });
      },
    }),
    {
      name: "asoiaf-tourney-v1",
      version: 1,
      partialize: (s) => ({ history: s.history }),
    },
  ),
);
