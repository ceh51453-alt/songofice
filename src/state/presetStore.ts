/**
 * usePresetStore — quản lý preset ST đã import (3.1b.5):
 * danh sách (metadata từ Dexie), preset active (id persist localStorage),
 * bản parse của preset active cache trong memory.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PresetRecord } from "./db";
import type { STPreset, STRegexScript } from "../preset/presetSchema";
import { importPresetJson, listPresets, loadPreset, deletePreset, exportPresetRaw } from "../preset/importExport";
import { mergePresetParams } from "../preset/mergeParams";
import { useConnectionStore } from "./connectionStore";
import { createLogger } from "../lib/log";

const log = createLogger("presetStore");

/** Khoá ổn định cho 1 regex script (id của ST, thiếu thì rơi về vị trí). */
export function regexScriptKey(script: STRegexScript, index: number): string {
  return script.id ?? `#${index}`;
}

/**
 * Áp bật/tắt regex script do người chơi chọn lên bản parse (3.1b.5b).
 * Preset ST hay tắt sẵn các script sinh HTML; app cho bật lại mà KHÔNG sửa file
 * gốc — rawJson trong Dexie giữ nguyên nên export vẫn round-trip.
 */
export function applyRegexOverrides(preset: STPreset, overrides: Record<string, boolean> | undefined): STPreset {
  const scripts = preset.extensions?.regex_scripts;
  if (!overrides || !scripts || scripts.length === 0) return preset;
  const patched = scripts.map((s, i) => {
    const want = overrides[regexScriptKey(s, i)];
    return want === undefined || want === !s.disabled ? s : { ...s, disabled: !want };
  });
  return { ...preset, extensions: { ...preset.extensions, regex_scripts: patched } };
}

interface PresetState {
  /** metadata các preset trong Dexie (nạp qua refresh()). */
  records: PresetRecord[];
  /** id preset đang active — null = không dùng preset (chat trần). */
  activePresetId: string | null;
  /** bản parse của preset active (không persist — parse lại từ Dexie khi load). */
  activePreset: STPreset | null;
  /** cảnh báo parse của preset active (hiện ở Prompt panel + Inspector). */
  activeWarnings: string[];
  /** bật/tắt regex script theo preset: presetId → khoá script → bật. */
  regexOverrides: Record<string, Record<string, boolean>>;

  refresh: () => Promise<void>;
  importFile: (fileName: string, jsonText: string) => Promise<{ warnings: string[] }>;
  setActive: (id: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  exportRaw: (id: string) => Promise<{ name: string; json: string } | null>;
  /** Bật/tắt 1 regex script của preset đang active (không sửa file gốc). */
  toggleRegexScript: (key: string, enabled: boolean) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      records: [],
      activePresetId: null,
      activePreset: null,
      activeWarnings: [],
      regexOverrides: {},

      refresh: async () => {
        const records = await listPresets();
        set({ records });
        // nạp lại bản parse của preset active (sau reload trang)
        const { activePresetId, activePreset, regexOverrides } = get();
        if (activePresetId && !activePreset) {
          const loaded = await loadPreset(activePresetId);
          if (loaded) {
            set({
              activePreset: applyRegexOverrides(loaded.parsed, regexOverrides[activePresetId]),
              activeWarnings: loaded.warnings,
            });
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
          activePreset: applyRegexOverrides(parsed, get().regexOverrides[record.id]),
          activeWarnings: warnings,
        });
        
        // Cập nhật tham số sang connection profile hiện tại
        const connStore = useConnectionStore.getState();
        const profile = connStore.activeProfile();
        if (profile) {
          connStore.updateParams(profile.id, mergePresetParams(profile.params, parsed));
        }
        
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
        set({
          activePresetId: id,
          activePreset: applyRegexOverrides(loaded.parsed, get().regexOverrides[id]),
          activeWarnings: loaded.warnings,
        });

        // Cập nhật tham số sang connection profile hiện tại
        const connStore = useConnectionStore.getState();
        const profile = connStore.activeProfile();
        if (profile) {
          connStore.updateParams(profile.id, mergePresetParams(profile.params, loaded.parsed));
        }
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

      toggleRegexScript: (key, enabled) => {
        const { activePresetId, activePreset, regexOverrides } = get();
        if (!activePresetId || !activePreset) return;
        const next = {
          ...regexOverrides,
          [activePresetId]: { ...(regexOverrides[activePresetId] ?? {}), [key]: enabled },
        };
        set({
          regexOverrides: next,
          activePreset: applyRegexOverrides(activePreset, next[activePresetId]),
        });
      },
    }),
    {
      name: "asoiaf-preset",
      version: 2,
      // chỉ persist id active + override regex — records/parse nạp lại từ Dexie
      partialize: (s) => ({ activePresetId: s.activePresetId, regexOverrides: s.regexOverrides }),
    },
  ),
);
