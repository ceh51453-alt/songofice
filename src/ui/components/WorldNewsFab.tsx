/**
 * WorldNewsFab (GĐ4) — Floating Action Button hiển thị tin tức thế giới.
 * Tham khảo "悬浮球前端" (floating ball frontend) của addon-mvu Tavern Helper.
 * Glassmorphism FAB + overlay panel với tin tức timeline.
 */
import { useWorldNewsStore, type WorldHeadline, type EconomicBrief } from "../../state/worldNewsStore";
import { fromAbsoluteDay, formatDateShort } from "../../mvu/calendar";

const trendIcon: Record<EconomicBrief["trend"], string> = {
  rising: "/\\",
  stable: "--",
  declining: "\\/",
  crisis: "!!",
};

const trendLabel: Record<EconomicBrief["trend"], string> = {
  rising: "Tăng trưởng",
  stable: "Ổn định",
  declining: "Suy giảm",
  crisis: "Khủng hoảng",
};

const sourceLabel: Record<WorldHeadline["source"], string> = {
  offscreen: "Quạ đưa thư",
  ai: "Tường thuật",
  event: "Sự kiện",
  player: "Người chơi",
};

function HeadlineItem({ headline }: { headline: WorldHeadline }) {
  return (
    <div className="rounded-md bg-[var(--glass-bg)] p-2.5 transition-colors hover:bg-[var(--glass-bg-hover)]">
      <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--text-faint)]">
        <span>{formatDateShort(fromAbsoluteDay(headline.day))}</span>
        <span>·</span>
        <span>{sourceLabel[headline.source]}</span>
        {headline.region && (
          <>
            <span>·</span>
            <span>{headline.region}</span>
          </>
        )}
      </div>
      <div className="text-[13px] leading-relaxed text-[var(--text)]">{headline.text}</div>
    </div>
  );
}

function NewsPanel() {
  const { headlines, economicBrief, markAllRead, closeFab } = useWorldNewsStore();

  return (
    <div
      className="glass-strong anim-in fixed bottom-20 right-4 z-50 flex max-h-[70vh] w-[340px] flex-col overflow-hidden rounded-xl shadow-xl sm:w-[380px]"
      style={{ border: "1px solid var(--glass-border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
        <h3 className="font-display text-[15px] font-semibold text-[var(--text)]">
          Tin Tức Thế Giới
        </h3>
        <div className="flex gap-1.5">
          <button
            onClick={markAllRead}
            className="rounded-md px-2 py-1 text-[11px] text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
          >
            Đã đọc hết
          </button>
          <button
            onClick={closeFab}
            className="rounded-md px-2 py-1 text-[13px] text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)]"
          >
            ×
          </button>
        </div>
      </div>

      {/* Economic Brief */}
      <div className="border-b border-[var(--glass-border)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px]">
          <span>{trendIcon[economicBrief.trend]}</span>
          <span className="font-medium text-[var(--text)]">Kinh tế: {trendLabel[economicBrief.trend]}</span>
        </div>
        <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">{economicBrief.description}</div>
      </div>

      {/* Headlines */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {headlines.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--text-faint)]">
            Chưa có tin tức nào.
          </div>
        ) : (
          <div className="space-y-2">
            {headlines.map((h) => (
              <HeadlineItem key={h.id} headline={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorldNewsFab() {
  const { fabOpen, toggleFab, unreadCount } = useWorldNewsStore();

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={toggleFab}
        className="glass-strong fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          border: "1px solid var(--glass-border)",
          background: fabOpen ? "var(--accent-soft)" : "var(--glass-bg)",
        }}
        aria-label="Tin tức thế giới"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        {/* Badge */}
        {unreadCount > 0 && !fabOpen && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--danger, #ef4444)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {fabOpen && <NewsPanel />}
    </>
  );
}
