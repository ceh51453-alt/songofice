/**
 * chapterSummaryStore — Zustand persisted store for chapter summaries (T3).
 * Tạm dùng Zustand + localStorage; migrate sang Dexie khi M15 triển khai.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChapterSummary {
  id: string;
  turnRange: [number, number];  // [startTurn, endTurn]
  year: number;                  // năm trong truyện
  content: string;               // nội dung tóm tắt (markdown bullets)
  npcRelated: string[];          // tên NPC xuất hiện trong đoạn
  level: number;                 // 1 = cấp 1 (trực tiếp), 2 = cấp 2 (gộp)
  createdAt: number;             // timestamp
}

export interface ChapterSummaryState {
  summaries: ChapterSummary[];
  /** Thêm summary mới. */
  addSummary: (summary: ChapterSummary) => void;
  /** Cập nhật summary (dùng khi người chơi sửa). */
  updateSummary: (id: string, content: string) => void;
  /** Xoá summary. */
  removeSummary: (id: string) => void;
  /** Lấy summaries gần nhất (level 1 ưu tiên). */
  getRecent: (count?: number) => ChapterSummary[];
  /** Lấy summaries liên quan đến NPC. */
  getByNpc: (npcName: string) => ChapterSummary[];
  /** Lấy tất cả summaries level 1 (chưa gộp). */
  getLevel1: () => ChapterSummary[];
  /** Thay thế nhiều summaries cấp 1 bằng 1 cấp 2 (sau merge). */
  replaceWithMerged: (sourceIds: string[], merged: ChapterSummary) => void;
  /** Reset. */
  clearAll: () => void;
}

export const useChapterSummaryStore = create<ChapterSummaryState>()(
  persist(
    (set, get) => ({
      summaries: [],

      addSummary: (summary) =>
        set((s) => ({ summaries: [...s.summaries, summary] })),

      updateSummary: (id, content) =>
        set((s) => ({
          summaries: s.summaries.map((sum) =>
            sum.id === id ? { ...sum, content } : sum,
          ),
        })),

      removeSummary: (id) =>
        set((s) => ({
          summaries: s.summaries.filter((sum) => sum.id !== id),
        })),

      getRecent: (count = 2) => {
        const all = get().summaries;
        return [...all]
          .sort((a, b) => b.turnRange[1] - a.turnRange[1])
          .slice(0, count);
      },

      getByNpc: (npcName) => {
        return get().summaries.filter((s) =>
          s.npcRelated.some((n) => n.includes(npcName)),
        );
      },

      getLevel1: () => get().summaries.filter((s) => s.level === 1),

      replaceWithMerged: (sourceIds, merged) =>
        set((s) => ({
          summaries: [
            ...s.summaries.filter((sum) => !sourceIds.includes(sum.id)),
            merged,
          ],
        })),

      clearAll: () => set({ summaries: [] }),
    }),
    {
      name: "iceandfire-chapter-summaries",
    },
  ),
);
