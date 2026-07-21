/**
 * useConnectionStore — quản lý Connection Profiles (mục 2.1/2.2):
 * tạo/lưu/đổi tên/xoá/nhân bản, mỗi profile độc lập hoàn toàn.
 * Persist vào localStorage (settings nhỏ — mục 1).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "../lib/id";
import { getAdapter } from "../api/providers";
import {
  makeDefaultProfile,
  type ConnectionProfile,
  type ModelParams,
  type ProviderKind,
} from "../types/connection";

interface ConnectionState {
  profiles: ConnectionProfile[];
  activeProfileId: string;

  activeProfile: () => ConnectionProfile;
  createProfile: (name?: string) => string;
  duplicateProfile: (id: string) => string;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, patch: Partial<Omit<ConnectionProfile, "id" | "params">>) => void;
  updateParams: (id: string, patch: Partial<ModelParams>) => void;
  setProvider: (id: string, provider: ProviderKind) => void;
}

function firstProfile(): ConnectionProfile {
  return makeDefaultProfile(genId("prof"), "Mặc định");
}

const initial = firstProfile();

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      profiles: [initial],
      activeProfileId: initial.id,

      activeProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
      },

      createProfile: (name) => {
        const p = makeDefaultProfile(genId("prof"), name ?? `Profile ${get().profiles.length + 1}`);
        set((s) => ({ profiles: [...s.profiles, p], activeProfileId: p.id }));
        return p.id;
      },

      duplicateProfile: (id) => {
        const src = get().profiles.find((p) => p.id === id);
        const copy: ConnectionProfile = src
          ? structuredClone(src)
          : makeDefaultProfile(genId("prof"), "Bản sao");
        copy.id = genId("prof");
        copy.name = `${copy.name} (bản sao)`;
        set((s) => ({ profiles: [...s.profiles, copy], activeProfileId: copy.id }));
        return copy.id;
      },

      deleteProfile: (id) => {
        set((s) => {
          let profiles = s.profiles.filter((p) => p.id !== id);
          if (profiles.length === 0) profiles = [firstProfile()];
          const activeProfileId = s.activeProfileId === id ? profiles[0].id : s.activeProfileId;
          return { profiles, activeProfileId };
        });
      },

      renameProfile: (id, name) => {
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)) }));
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      updateProfile: (id, patch) => {
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      },

      updateParams: (id, patch) => {
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, params: { ...p.params, ...patch } } : p)),
        }));
      },

      setProvider: (id, provider) => {
        const adapter = getAdapter(provider);
        set((s) => ({
          profiles: s.profiles.map((p) => {
            if (p.id !== id) return p;
            // đổi provider: gợi ý base URL mặc định nếu đang trống hoặc là default của provider cũ
            const oldDefault = getAdapter(p.provider).defaultBaseUrl;
            const baseUrl = !p.baseUrl || p.baseUrl === oldDefault ? adapter.defaultBaseUrl : p.baseUrl;
            return { ...p, provider, baseUrl, scannedModels: [], model: "" };
          }),
        }));
      },
    }),
    { name: "asoiaf-connection", version: 1 },
  ),
);
