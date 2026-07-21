/** useSettingsStore — cài đặt UI + gameplay, persist localStorage. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setVerbose } from "../lib/log";

export type ThemeMode = "dark" | "light";
export type Language = "vi" | "en";

interface SettingsState {
  theme: ThemeMode;
  language: Language;
  verboseLogging: boolean;
  /** Tự động lưu mỗi N lượt (0 = tắt). */
  autoSaveInterval: number;
  /** Cho phép AI viết nội dung 18+. */
  nsfw: boolean;
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: Language) => void;
  setVerboseLogging: (v: boolean) => void;
  setAutoSaveInterval: (n: number) => void;
  setNsfw: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "vi",
      verboseLogging: false,
      autoSaveInterval: 5,
      nsfw: false,
      setTheme: (theme) => {
        document.documentElement.dataset.theme = theme;
        set({ theme });
      },
      setLanguage: (language) => set({ language }),
      setVerboseLogging: (verboseLogging) => {
        setVerbose(verboseLogging);
        set({ verboseLogging });
      },
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      setNsfw: (nsfw) => set({ nsfw }),
    }),
    {
      name: "asoiaf-settings",
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dataset.theme = state.theme;
          setVerbose(state.verboseLogging);
        }
      },
    },
  ),
);

