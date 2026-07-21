/**
 * useVariablesStore — hai vùng biến cho macro state ST (3.1b.3):
 * - chatVars: biến preset theo ván chơi. Ở M4 vùng này sẽ được BẮC CẦU sang
 *   MVU store (`stat_data`) — "engine coi biến preset và stat_data là cùng
 *   một store". Giữ interface get/set/add ổn định để M4 chỉ đổi backend.
 * - globalVars: biến toàn cục xuyên chat ({{setglobalvar}}), persist riêng,
 *   KHÔNG thuộc save một ván.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VarValue = string;

interface VariablesState {
  chatVars: Record<string, VarValue>;
  globalVars: Record<string, VarValue>;

  getChat: (key: string) => VarValue;
  setChat: (key: string, value: VarValue) => void;
  addChat: (key: string, delta: VarValue) => void;
  getGlobal: (key: string) => VarValue;
  setGlobal: (key: string, value: VarValue) => void;
  addGlobal: (key: string, delta: VarValue) => void;
  clearChatVars: () => void;
}

/** Cộng kiểu ST: cả hai là số → cộng số; ngược lại nối chuỗi. */
export function addValues(current: VarValue, delta: VarValue): VarValue {
  const a = Number(current);
  const b = Number(delta);
  if (current !== "" && delta !== "" && Number.isFinite(a) && Number.isFinite(b)) {
    return String(a + b);
  }
  if (current === "" && Number.isFinite(b) && delta !== "") return String(b);
  return current + delta;
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set, get) => ({
      chatVars: {},
      globalVars: {},

      getChat: (key) => get().chatVars[key] ?? "",
      setChat: (key, value) => set((s) => ({ chatVars: { ...s.chatVars, [key]: value } })),
      addChat: (key, delta) =>
        set((s) => ({ chatVars: { ...s.chatVars, [key]: addValues(s.chatVars[key] ?? "", delta) } })),

      getGlobal: (key) => get().globalVars[key] ?? "",
      setGlobal: (key, value) => set((s) => ({ globalVars: { ...s.globalVars, [key]: value } })),
      addGlobal: (key, delta) =>
        set((s) => ({ globalVars: { ...s.globalVars, [key]: addValues(s.globalVars[key] ?? "", delta) } })),

      clearChatVars: () => set({ chatVars: {} }),
    }),
    { name: "asoiaf-variables", version: 1 },
  ),
);
