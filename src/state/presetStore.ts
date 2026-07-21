/**
 * usePresetStore — quản lý preset ST đã import (3.1b.5):
 * danh sách (metadata từ Dexie), preset active (id persist localStorage),
 * bản parse của preset active cache trong memory.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PresetRecord } from "./db";
import type { STPreset } from "../preset/presetSchema";
import { importPresetJson, listPresets, loadPreset, deletePreset, exportPresetRaw } from "../preset/importExport";
import { createLogger } from "../lib/log";

const log = createLogger("presetStore");

interface PresetState {
  /** metadata các preset trong Dexie (nạp qua refresh()). */
  records: PresetRecord[];
  /** id preset đang active — null = không dùng preset (chat trần). */
  activePresetId: string | null;
  /** bản parse của preset active (không persist — parse lại từ Dexie khi load). */
  activePreset: STPreset | null;
  /** cảnh báo parse của preset active (hiện ở Prompt panel + Inspector). */
  activeWarnings: string[];

  refresh: () => Promise<void>;
  importFile: (fileName: string, jsonText: string) => Promise<{ warnings: string[] }>;
  setActive: (id: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  exportRaw: (id: string) => Promise<{ name: string; json: string } | null>;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      records: [],
      activePresetId: null,
      activePreset: null,
      activeWarnings: [],

      refresh: async () => {
        const records = await listPresets();
        set({ records });
        // nạp lại bản parse của preset active (sau reload trang)
        const { activePresetId, activePreset } = get();
        if (activePresetId && !activePreset) {
          const loaded = await loadPreset(activePresetId);
          if (loaded) {
            set({ activePreset: loaded.parsed, activeWarnings: loaded.warnings });
          } else {
            log.warn(`Preset active ${activePresetId} không còn trong DB — bỏ chọn`);
            set({ activePresetId: null, activePreset: null, activeWarnings: [] });
          }
        }
      },

      importFile: async (fileName, jsonText) => {
        const { record, parsed, warnings } = await importPresetJson(fileName, jsonText);
        set({
          records: [...get().records.filter((r) => r.id !== record.id), record].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
          // preset vừa import tự động thành active (hành vi tiện nhất)
          activePresetId: record.id,
          activePreset: parsed,
          activeWarnings: warnings,
        });
        return { warnings };
      },

      setActive: async (id) => {
        if (id === null) {
          set({ activePresetId: null, activePreset: null, activeWarnings: [] });
          return;
        }
        const loaded = await loadPreset(id);
        if (!loaded) {
          log.warn(`Không nạp được preset ${id}`);
          return;
        }
        set({ activePresetId: id, activePreset: loaded.parsed, activeWarnings: loaded.warnings });
      },

      remove: async (id) => {
        await deletePreset(id);
        const wasActive = get().activePresetId === id;
        set({
          records: get().records.filter((r) => r.id !== id),
          ...(wasActive ? { activePresetId: null, activePreset: null, activeWarnings: [] } : {}),
        });
      },

      exportRaw: (id) => exportPresetRaw(id),
    }),
    {
      name: "asoiaf-preset",
      version: 1,
      // chỉ persist id active — records/parse nạp lại từ Dexie
      partialize: (s) => ({ activePresetId: s.activePresetId }),
    },
  ),
);
