/**
 * OffscreenNewsCard (GĐ3) — Card hiển thị tin tức NPC off-screen.
 * Tham khảo Tavern Helper "自动化系统美化" — nhưng dùng React thay vì jQuery inject.
 * Subtle notification card, expandable, icon quạ đưa thư.
 */
import { useState } from "react";
import type { OffscreenAction } from "../../npc/offscreenSim";

export function OffscreenNewsCard({ actions }: { actions: OffscreenAction[] }) {
  const [expanded, setExpanded] = useState(false);

  if (actions.length === 0) return null;

  return (
    <div
      className="mt-2 overflow-hidden rounded-lg border border-[var(--glass-border)]"
      style={{ background: "linear-gradient(135deg, var(--glass-bg) 0%, var(--glass-bg-hover) 100%)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--text-soft)] transition-colors hover:bg-[var(--glass-bg-hover)]"
      >
        <span className="text-base" role="img" aria-label="raven">🐦‍⬛</span>
        <span>Tin từ quạ đưa thư</span>
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {actions.length}
        </span>
        <span className="ml-auto text-[var(--text-faint)]">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-[var(--glass-border)] px-3 py-2 text-[12px]">
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="rounded-md bg-[var(--glass-bg)] p-2">
                <div className="mb-1 text-[13px] font-medium text-[var(--text)]">
                  {a.npcName}
                </div>
                <div className="mb-1 text-[var(--text-muted)] italic">
                  {a.newsText}
                </div>
                <div className="text-[11px] text-[var(--text-faint)]">
                  {a.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
