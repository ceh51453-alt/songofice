/**
 * useExtraModelStore — Connection riêng cho Extra Model (phân tích biến).
 * Tham khảo MagVarUpdate: cho phép dùng model phụ (rẻ/nhanh) chuyên trách
 * trích xuất variable update từ output AI chính.
 * Persist vào localStorage, tách biệt hoàn toàn khỏi main connection.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAdapter } from "../api/providers";
import type { ProviderKind } from "../types/connection";

export type ExtraModelStatus = "idle" | "running" | "success" | "error";
export type StateEngine = "mvu-zod" | "auto-database";

interface ExtraModelState {
  /* ---- cấu hình ---- */
  /** Hệ thống ghi nhớ: MVU Zod (JSON ops) hoặc Auto Database (SQL). */
  stateEngine: StateEngine;
  enabled: boolean;
  /** Tự động gọi extra model khi main model không trả update. */
  autoTrigger: boolean;
  provider: ProviderKind;
  baseUrl: string;
  apiKeys: string[];
  model: string;
  scannedModels: string[];
  /** CORS proxy riêng cho extra model (tách khỏi main). */
  corsProxy: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;

  /* ---- trạng thái runtime (không persist) ---- */
  lastStatus: ExtraModelStatus;
  lastError: string | null;
  /** Số biến đã cập nhật lần gần nhất. */
  lastOpsCount: number;

  /* ---- actions ---- */
  setEnabled: (v: boolean) => void;
  setAutoTrigger: (v: boolean) => void;
  setStateEngine: (engine: StateEngine) => void;
  setProvider: (p: ProviderKind) => void;
  updateField: (patch: Partial<Pick<ExtraModelState,
    "baseUrl" | "apiKeys" | "model" | "corsProxy" |
    "temperature" | "maxTokens" | "timeoutMs" | "maxRetries"
  >>) => void;
  setScannedModels: (models: string[]) => void;
  setStatus: (status: ExtraModelStatus, error?: string, opsCount?: number) => void;
}

export const useExtraModelStore = create<ExtraModelState>()(
  persist(
    (set, get) => ({
      stateEngine: "mvu-zod",
      enabled: false,
      autoTrigger: true,
      provider: "openai",
      baseUrl: "",
      apiKeys: [],
      model: "",
      scannedModels: [],
      corsProxy: "",
      temperature: 0.3,
      maxTokens: 2048,
      timeoutMs: 30_000,
      maxRetries: 2,

      lastStatus: "idle",
      lastError: null,
      lastOpsCount: 0,

      setEnabled: (enabled) => set({ enabled }),
      setAutoTrigger: (autoTrigger) => set({ autoTrigger }),
      setStateEngine: (stateEngine) => set({ stateEngine }),

      setProvider: (provider) => {
        const adapter = getAdapter(provider);
        const oldDefault = getAdapter(get().provider).defaultBaseUrl;
        const baseUrl = !get().baseUrl || get().baseUrl === oldDefault
          ? adapter.defaultBaseUrl
          : get().baseUrl;
        set({ provider, baseUrl, scannedModels: [], model: "" });
      },

      updateField: (patch) => set(patch),
      setScannedModels: (models) => set({ scannedModels: models }),

      setStatus: (lastStatus, lastError, lastOpsCount) =>
        set({
          lastStatus,
          lastError: lastError ?? null,
          lastOpsCount: lastOpsCount ?? (lastStatus === "idle" ? 0 : get().lastOpsCount),
        }),
    }),
    {
      name: "asoiaf-extra-model",
      version: 1,
      partialize: (s) => ({
        stateEngine: s.stateEngine,
        enabled: s.enabled,
        autoTrigger: s.autoTrigger,
        provider: s.provider,
        baseUrl: s.baseUrl,
        apiKeys: s.apiKeys,
        model: s.model,
        scannedModels: s.scannedModels,
        corsProxy: s.corsProxy,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        timeoutMs: s.timeoutMs,
        maxRetries: s.maxRetries,
      }),
    },
  ),
);
