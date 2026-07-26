/**
 * workflowStore (GĐ5) — Quản lý multi-task workflow pipeline.
 * Tham khảo "工作流助手" (Workflow Assistant) của Tavern Helper.
 * Cho phép chạy nhiều AI task nối tiếp sau mỗi lượt (dùng extra model).
 *
 * Pipeline: AI chính trả lời → extract ops → chạy tuần tự workflow tasks.
 * Mỗi task: build prompt → gọi extra model → xử lý kết quả.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkflowTask {
  id: string;
  name: string;            // VD: "Mô phỏng NPC Off-screen"
  description: string;     // mô tả ngắn cho UI
  enabled: boolean;
  stage: number;           // thứ tự chạy (1, 2, 3...)
  /** key để map tới handler — đăng ký trong workflowHandlers. */
  handlerKey: string;
}

export type WorkflowStatus = "idle" | "running" | "success" | "error";

export interface WorkflowRunResult {
  taskId: string;
  taskName: string;
  status: "success" | "error";
  message: string;
  durationMs: number;
}

interface WorkflowState {
  enabled: boolean;
  tasks: WorkflowTask[];
  status: WorkflowStatus;
  currentTaskId: string | null;
  lastRunResults: WorkflowRunResult[];
  error: string | null;

  // actions
  toggleEnabled: () => void;
  setEnabled: (v: boolean) => void;
  addTask: (task: Omit<WorkflowTask, "id">) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTask: (id: string, newStage: number) => void;
  setStatus: (status: WorkflowStatus, taskId?: string, error?: string) => void;
  recordResult: (result: WorkflowRunResult) => void;
  clearResults: () => void;
}

let taskIdCounter = 0;

/** Task mặc định khi khởi tạo lần đầu. */
const DEFAULT_TASKS: WorkflowTask[] = [
  {
    id: "wf-offscreen",
    name: "Mô phỏng NPC Off-screen",
    description: "Dùng AI sinh hành động cho NPC vắng mặt (GĐ1)",
    enabled: true,
    stage: 1,
    handlerKey: "offscreen-sim",
  },
  {
    id: "wf-world-news",
    name: "Sinh Tin Tức Thế Giới",
    description: "Tạo tin tức và sự kiện chính trị (GĐ4)",
    enabled: false,
    stage: 2,
    handlerKey: "world-news",
  },
];

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      enabled: true,
      tasks: DEFAULT_TASKS,
      status: "idle",
      currentTaskId: null,
      lastRunResults: [],
      error: null,

      toggleEnabled: () => set((s) => ({ enabled: !s.enabled })),
      setEnabled: (v) => set({ enabled: v }),

      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, { ...task, id: `wf-${++taskIdCounter}` }],
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
        })),

      reorderTask: (id, newStage) =>
        set((s) => ({
          tasks: s.tasks
            .map((t) => (t.id === id ? { ...t, stage: newStage } : t))
            .sort((a, b) => a.stage - b.stage),
        })),

      setStatus: (status, taskId, error) =>
        set({ status, currentTaskId: taskId ?? null, error: error ?? null }),

      recordResult: (result) =>
        set((s) => ({
          lastRunResults: [...s.lastRunResults, result].slice(-10), // giữ 10 kết quả gần nhất
        })),

      clearResults: () => set({ lastRunResults: [], error: null }),
    }),
    {
      name: "asoiaf-workflow",
      version: 1,
      partialize: (s) => ({
        enabled: s.enabled,
        tasks: s.tasks,
      }),
    },
  ),
);

/**
 * Lấy danh sách task đang bật, sắp theo stage.
 */
export function getActiveWorkflowTasks(): WorkflowTask[] {
  const { enabled, tasks } = useWorkflowStore.getState();
  if (!enabled) return [];
  return tasks.filter((t) => t.enabled).sort((a, b) => a.stage - b.stage);
}
