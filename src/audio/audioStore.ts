/**
 * audioStore.ts (M16, 18.4) — Zustand store cho audio settings.
 * Persist localStorage — bật/tắt nhạc/SFX, âm lượng, chế độ adaptive.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AudioMode = "adaptive" | "fixed";

interface AudioState {
  /** Nhạc nền bật/tắt. */
  musicEnabled: boolean;
  /** SFX bật/tắt. */
  sfxEnabled: boolean;
  /** Âm lượng nhạc 0-1. */
  musicVolume: number;
  /** Âm lượng SFX 0-1. */
  sfxVolume: number;
  /** Chế độ: adaptive (đổi theo ngữ cảnh) hoặc fixed (playlist cố định). */
  audioMode: AudioMode;
  /** Người dùng đã tương tác (autoplay policy). */
  userInteracted: boolean;

  toggleMusic: () => void;
  toggleSfx: () => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAudioMode: (m: AudioMode) => void;
  markInteracted: () => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.4,
      sfxVolume: 0.25,
      audioMode: "adaptive",
      userInteracted: false,

      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleSfx: () => set((s) => ({ sfxEnabled: !s.sfxEnabled })),
      setMusicVolume: (musicVolume) => set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume: Math.max(0, Math.min(1, sfxVolume)) }),
      setAudioMode: (audioMode) => set({ audioMode }),
      markInteracted: () => set({ userInteracted: true }),
    }),
    {
      name: "asoiaf-audio",
      version: 1,
      partialize: (s) => ({
        musicEnabled: s.musicEnabled,
        sfxEnabled: s.sfxEnabled,
        musicVolume: s.musicVolume,
        sfxVolume: s.sfxVolume,
        audioMode: s.audioMode,
        // userInteracted KHÔNG persist — reset mỗi phiên (autoplay policy)
      }),
    },
  ),
);
