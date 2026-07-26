/**
 * VariableUpdateCard (GĐ3) — Collapsible card hiển thị biến đã thay đổi sau mỗi lượt AI.
 * Tham khảo "regex-工作流变量更新美化" của Tavern Helper: dark glassmorphism, fold/unfold,
 * diff view (cũ → mới). Dùng React + CSS vars thay vì regex injection.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";

interface ChangedField {
  path: string;
  label: string;
  oldValue: string;
  newValue: string;
  kind: "delta" | "replace" | "insert" | "remove";
}

/**
 * Parse danh sách path đổi thành ChangedField[].
 * Hiện tại chỉ hiển thị tên path — muốn diff cũ/mới cần snapshot trước đó.
 */
function parseChangedPaths(paths: string[], stateBefore?: Record<string, unknown>): ChangedField[] {
  const stat = useMvuStore.getState().stat;

  return paths.map((path) => {
    const parts = path.replace(/^stat_data\./, "").split(".");
    const label = parts.slice(-2).join(" › ");

    // Lấy giá trị mới từ stat hiện tại
    let current: unknown = stat;
    for (const p of parts) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[p];
      } else {
        current = undefined;
        break;
      }
    }

    // Lấy giá trị cũ từ stateBefore (nếu có)
    let old: unknown = stateBefore;
    if (stateBefore) {
      for (const p of parts) {
        if (old && typeof old === "object") {
          old = (old as Record<string, unknown>)[p];
        } else {
          old = undefined;
          break;
        }
      }
    }

    const newValue = current === undefined ? "—" : typeof current === "object" ? JSON.stringify(current) : String(current);
    const oldValue = old === undefined ? "—" : typeof old === "object" ? JSON.stringify(old) : String(old);

    let kind: ChangedField["kind"] = "replace";
    if (oldValue === "—") kind = "insert";
    else if (newValue === "—") kind = "remove";
    else if (!isNaN(Number(newValue)) && !isNaN(Number(oldValue))) kind = "delta";

    return { path, label, oldValue, newValue, kind };
  });
}

const kindIcons: Record<ChangedField["kind"], string> = {
  delta: "Δ",
  replace: "↻",
  insert: "+",
  remove: "−",
};

const kindColors: Record<ChangedField["kind"], string> = {
  delta: "var(--accent)",
  replace: "var(--text-soft)",
  insert: "#4ade80",
  remove: "#f87171",
};

export function VariableUpdateCard({
  changedPaths,
  stateBefore,
}: {
  changedPaths: string[];
  stateBefore?: Record<string, unknown>;
}) {
  const [expanded, setExpanded] = useState(false);

  if (changedPaths.length === 0) return null;

  const fields = parseChangedPaths(changedPaths, stateBefore);

  return (
    <div
      className="mt-2 overflow-hidden rounded-lg border border-[var(--glass-border)]"
      style={{ background: "var(--glass-bg)" }}
    >
      {/* Header — click to toggle */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--text-soft)] transition-colors hover:bg-[var(--glass-bg-hover)]"
      >
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            animation: expanded ? "none" : "pulse 2s infinite",
          }}
        >
          {changedPaths.length}
        </span>
        <span>Biến thay đổi</span>
        <span className="ml-auto text-[var(--text-faint)]">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Body — collapsible */}
      {expanded && (
        <div className="border-t border-[var(--glass-border)] px-3 py-2 text-[12px]">
          <div className="space-y-1.5">
            {fields.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold"
                  style={{ color: kindColors[f.kind], background: `${kindColors[f.kind]}15` }}
                >
                  {kindIcons[f.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[var(--text-soft)]" title={f.path}>
                    {f.label}
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    {f.kind !== "insert" && (
                      <span className="text-[var(--text-faint)] line-through">{f.oldValue}</span>
                    )}
                    <span style={{ color: kindColors[f.kind] }}>
                      {f.kind === "delta" && !isNaN(Number(f.newValue)) && !isNaN(Number(f.oldValue))
                        ? `${Number(f.newValue) - Number(f.oldValue) >= 0 ? "+" : ""}${Number(f.newValue) - Number(f.oldValue)} → ${f.newValue}`
                        : f.kind === "remove"
                          ? "đã xóa"
                          : f.newValue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
