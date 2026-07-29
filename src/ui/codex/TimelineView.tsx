/**
 * TimelineView — Biên Niên Sử dọc cho Codex.
 * Hiển thị chapter summaries theo năm, với đường timeline dọc.
 */
import type { ChapterSummary } from "../../memory/chapterSummaryStore";

interface TimelineViewProps {
  summaries: ChapterSummary[];
}

export function TimelineView({ summaries }: TimelineViewProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 h-12 w-12 rounded-full border border-dashed border-[var(--glass-border)] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Chưa có sự kiện nào được ghi lại</p>
        <p className="mt-1 text-[11px] text-[var(--text-faint)]">Biên niên sử sẽ tự động cập nhật khi truyện tiến triển</p>
      </div>
    );
  }

  // Sort by turnRange start, newest first
  const sorted = [...summaries].sort((a, b) => b.turnRange[1] - a.turnRange[1]);

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-px bg-[var(--glass-border)]" />

      {sorted.map((summary) => (
        <div key={summary.id} className="relative mb-4 last:mb-0">
          {/* Dot */}
          <div
            className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--accent-text)] bg-[var(--glass-bg)]"
          />

          {/* Content */}
          <div className="glass-panel rounded-lg border border-[var(--glass-border)] p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[11px]">
              <span className="font-mono text-[var(--accent-text)]">
                Nam {summary.year} AC
              </span>
              <span className="text-[var(--text-faint)]">
                Turn {summary.turnRange[0]}-{summary.turnRange[1]}
              </span>
              {summary.level > 1 && (
                <span className="rounded bg-[var(--accent-text)]/10 px-1.5 py-0.5 text-[10px] text-[var(--accent-text)]">
                  Tom tat cap {summary.level}
                </span>
              )}
            </div>

            {/* Summary content as bullet points */}
            <div className="text-[12px] text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
              {summary.content}
            </div>

            {/* Related NPCs */}
            {summary.npcRelated.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {summary.npcRelated.map((npc) => (
                  <span
                    key={npc}
                    className="rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[10px] text-[var(--text-faint)]"
                  >
                    {npc}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
