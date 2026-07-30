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
  /** AI phụ hay engine xác định; UI giải thích đúng cách task này chạy. */
  mode?: "ai" | "engine";
  /** Task theo lượt chat hay tự chạy khi thời gian truyện đi qua một ngày. */
  trigger?: WorkflowTrigger;
}

export type WorkflowTrigger = "per_turn" | "daily";

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
  moveTask: (id: string, direction: -1 | 1) => void;
  restoreDefaults: () => void;
  setStatus: (status: WorkflowStatus, taskId?: string, error?: string) => void;
  recordResult: (result: WorkflowRunResult) => void;
  clearResults: () => void;
}

let taskIdCounter = 0;

/** Task mặc định khi khởi tạo lần đầu. */
export const DEFAULT_WORKFLOW_TASKS: WorkflowTask[] = [
  {
    id: "wf-offscreen-engine",
    name: "Nhịp sống NPC ngoài cảnh",
    description: "Mỗi ngày truyện, NPC vắng mặt tiếp tục hoạt động và lưu dấu vết dù không xuất hiện trong phản hồi",
    enabled: true,
    stage: 1,
    handlerKey: "offscreen-engine",
    mode: "engine",
    trigger: "daily",
  },
  {
    id: "wf-offscreen",
    name: "Tường thuật NPC nổi bật",
    description: "Dùng AI phụ làm giàu các diễn biến NPC quan trọng sau lượt chat; không quyết định nhịp sống nền",
    enabled: true,
    stage: 2,
    handlerKey: "offscreen-sim",
    mode: "ai",
    trigger: "per_turn",
  },
  {
    id: "wf-world-news",
    name: "Sinh Tin Tức Thế Giới",
    description: "Tóm tắt biến động thị trường thành tin tức thế giới",
    enabled: true,
    stage: 3,
    handlerKey: "world-news",
    mode: "engine",
    trigger: "per_turn",
  },
];

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      enabled: true,
      tasks: DEFAULT_WORKFLOW_TASKS.map((task) => ({ ...task })),
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
          tasks: normalizeTaskStages(
            s.tasks
              .map((t) => (t.id === id ? { ...t, stage: newStage } : t))
              .sort((a, b) => a.stage - b.stage),
          ),
        })),

      moveTask: (id, direction) =>
        set((s) => {
          const tasks = [...s.tasks].sort((a, b) => a.stage - b.stage);
          const from = tasks.findIndex((task) => task.id === id);
          const to = from + direction;
          if (from < 0 || to < 0 || to >= tasks.length) return {};
          [tasks[from], tasks[to]] = [tasks[to], tasks[from]];
          return { tasks: normalizeTaskStages(tasks) };
        }),

      restoreDefaults: () => set({
        tasks: DEFAULT_WORKFLOW_TASKS.map((task) => ({ ...task })),
        status: "idle",
        currentTaskId: null,
        error: null,
      }),

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
      version: 3,
      migrate: (persisted, version) => {
        const old = persisted as Partial<WorkflowState>;
        if (version >= 3) return old as WorkflowState;
        const oldTasks = old.tasks ?? [];
        const tasks: WorkflowTask[] = DEFAULT_WORKFLOW_TASKS.map((defaults) => {
          const saved = oldTasks.find((task) => task.id === defaults.id);
          // Các task lõi luôn giữ handler/mode/trigger an toàn của bản mới;
          // chỉ giữ lựa chọn bật/tắt và thứ tự mà người chơi đã cá nhân hoá.
          return { ...defaults, ...saved, handlerKey: defaults.handlerKey, mode: defaults.mode, trigger: defaults.trigger };
        });
        for (const task of oldTasks) {
          if (!tasks.some((known) => known.id === task.id)) tasks.push(task);
        }
        return { ...old, tasks: normalizeTaskStages(tasks.sort((a, b) => a.stage - b.stage)) } as WorkflowState;
      },
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
export function getActiveWorkflowTasks(trigger: WorkflowTrigger = "per_turn"): WorkflowTask[] {
  const { enabled, tasks } = useWorkflowStore.getState();
  if (!enabled) return [];
  return tasks
    .filter((task) => task.enabled && (task.trigger ?? "per_turn") === trigger)
    .sort((a, b) => a.stage - b.stage);
}

/** Kiểm tra một handler lõi có đang được Workflow cho phép chạy hay không. */
export function isWorkflowHandlerEnabled(handlerKey: string, trigger?: WorkflowTrigger): boolean {
  const { enabled, tasks } = useWorkflowStore.getState();
  return enabled && tasks.some((task) =>
    task.enabled && task.handlerKey === handlerKey && (trigger === undefined || (task.trigger ?? "per_turn") === trigger),
  );
}

/** Số thứ tự luôn liên tiếp, kể cả khi khôi phục save cũ có stage trùng nhau. */
function normalizeTaskStages(tasks: WorkflowTask[]): WorkflowTask[] {
  return tasks.map((task, index) => ({ ...task, stage: index + 1 }));
}
