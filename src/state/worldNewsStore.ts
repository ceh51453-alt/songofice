/**
 * worldNewsStore (GĐ4) — Zustand store quản lý tin tức thế giới.
 * Tham khảo "addon-mvu" (世界时局与经济简报变量脚本) của Tavern Helper.
 * Tự động tích lũy tin tức sau mỗi lượt AI (hook vào mvuStore events).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorldHeadline {
  id: string;
  /** ngày tuyệt đối trong game (calendar.absoluteDay). */
  day: number;
  text: string;          // nội dung tin
  source: "offscreen" | "ai" | "event" | "player";
  region?: string;       // vùng liên quan
  createdAt: number;
}

export interface EconomicBrief {
  trend: "rising" | "stable" | "declining" | "crisis";
  description: string;
  lastUpdated: number;
}

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  factions: string[];    // các phe liên quan
  /** ngày tuyệt đối trong game (calendar.absoluteDay). */
  day: number;
}

interface WorldNewsState {
  headlines: WorldHeadline[];
  economicBrief: EconomicBrief;
  politicalEvents: PoliticalEvent[];
  unreadCount: number;
  maxHeadlines: number;
  fabOpen: boolean;

  // actions
  addHeadline: (headline: Omit<WorldHeadline, "id" | "createdAt">) => void;
  addPoliticalEvent: (event: Omit<PoliticalEvent, "id">) => void;
  updateEconomicBrief: (brief: Partial<EconomicBrief>) => void;
  markAllRead: () => void;
  toggleFab: () => void;
  openFab: () => void;
  closeFab: () => void;
  clearOldNews: (keepDays: number) => void;
}

let headlineId = 0;
let eventId = 0;

export const useWorldNewsStore = create<WorldNewsState>()(
  persist(
    (set) => ({
      headlines: [],
      economicBrief: { trend: "stable", description: "Kinh tế ổn định.", lastUpdated: Date.now() },
      politicalEvents: [],
      unreadCount: 0,
      maxHeadlines: 50,
      fabOpen: false,

      addHeadline: (h) =>
        set((s) => {
          const headline: WorldHeadline = {
            ...h,
            id: `news-${++headlineId}`,
            createdAt: Date.now(),
          };
          const headlines = [headline, ...s.headlines].slice(0, s.maxHeadlines);
          return { headlines, unreadCount: s.unreadCount + 1 };
        }),

      addPoliticalEvent: (e) =>
        set((s) => {
          const event: PoliticalEvent = { ...e, id: `evt-${++eventId}` };
          return { politicalEvents: [event, ...s.politicalEvents].slice(0, 20) };
        }),

      updateEconomicBrief: (brief) =>
        set((s) => ({
          economicBrief: { ...s.economicBrief, ...brief, lastUpdated: Date.now() },
        })),

      markAllRead: () => set({ unreadCount: 0 }),

      toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
      openFab: () => set({ fabOpen: true }),
      closeFab: () => set({ fabOpen: false }),

      clearOldNews: (keepDays) =>
        set((s) => {
          const latestDay = Math.max(...s.headlines.map((h) => h.day), 0);
          return {
            headlines: s.headlines.filter((h) => latestDay - h.day <= keepDays),
          };
        }),
    }),
    {
      name: "asoiaf-world-news",
      version: 1,
      partialize: (s) => ({
        headlines: s.headlines,
        economicBrief: s.economicBrief,
        politicalEvents: s.politicalEvents,
      }),
    },
  ),
);
