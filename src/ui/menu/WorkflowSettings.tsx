/**
 * WorkflowSettings (GĐ5) — UI quản lý workflow tasks.
 * Bật/tắt từng task, sắp xếp thứ tự, xem kết quả chạy gần nhất.
 * Nằm trong menu Settings.
 */
import { useWorkflowStore, type WorkflowTask, type WorkflowRunResult } from "../../state/workflowStore";

function TaskRow({ task }: { task: WorkflowTask }) {
  const { toggleTask, removeTask } = useWorkflowStore();

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] px-3 py-2.5 transition-colors hover:bg-[var(--glass-bg-hover)]"
      style={{ opacity: task.enabled ? 1 : 0.5 }}
    >
      {/* Stage badge */}
      <span
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        {task.stage}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[var(--text)]">{task.name}</div>
        <div className="truncate text-[11px] text-[var(--text-faint)]">{task.description}</div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => toggleTask(task.id)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          task.enabled ? "bg-[var(--accent)]" : "bg-[var(--glass-border)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            task.enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>

      {/* Delete */}
      {!task.id.startsWith("wf-offscreen") && !task.id.startsWith("wf-world-news") && (
        <button
          onClick={() => removeTask(task.id)}
          className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--danger)]"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function ResultRow({ result }: { result: WorkflowRunResult }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: result.status === "success" ? "#4ade80" : "#f87171" }}
      />
      <span className="flex-1 text-[var(--text-soft)]">{result.taskName}</span>
      <span className="text-[var(--text-faint)]">{result.durationMs}ms</span>
    </div>
  );
}

export function WorkflowSettings() {
  const { enabled, toggleEnabled, tasks, lastRunResults, status, currentTaskId, error, clearResults } =
    useWorkflowStore();

  const sortedTasks = [...tasks].sort((a, b) => a.stage - b.stage);

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] font-medium text-[var(--text)]">Workflow Pipeline</div>
          <div className="text-[12px] text-[var(--text-faint)]">
            Chạy AI tasks phụ sau mỗi lượt (dùng Extra Model)
          </div>
        </div>
        <button
          onClick={toggleEnabled}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-[var(--accent)]" : "bg-[var(--glass-border)]"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Task list */}
      {enabled && (
        <div className="space-y-2">
          <div className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
            Tasks (theo thứ tự)
          </div>
          {sortedTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Status */}
      {status === "running" && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[13px] text-[var(--accent)]">
          <span className="animate-spin">⚙️</span>
          Đang chạy: {tasks.find((t) => t.id === currentTaskId)?.name ?? "..."}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {/* Recent results */}
      {lastRunResults.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
              Kết quả gần nhất
            </span>
            <button
              onClick={clearResults}
              className="text-[11px] text-[var(--text-faint)] hover:text-[var(--text-soft)]"
            >
              Xóa
            </button>
          </div>
          {lastRunResults.map((r, i) => (
            <ResultRow key={i} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}
