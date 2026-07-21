/**
 * CanonTimeline.tsx — Trục thời gian dọc cho cột mốc lịch sử canon (17.4).
 * Dot markers: past (sáng) / future (mờ) / altered (vàng).
 * Glassmorphism, không emoji.
 */
import type { StatData } from "../../mvu/schema";
import { ALL_TIMELINE_BEATS } from "../../content/westeros/events/timelineBeats";
import { getUpcomingBeats, getPastBeats } from "../../event/timelineEngine";
import { FlagIcon, StarIcon } from "./JournalIcons";

interface TimelineItem {
  id: string;
  year: number;
  title: string;
  description: string;
  status: "past" | "altered" | "current" | "future";
}

function buildTimelineItems(state: StatData): TimelineItem[] {
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const currentYear = state["Thế Giới"]["Năm"];
  const eraBeats = ALL_TIMELINE_BEATS.filter((b) => b.eraId === eraId);

  const pastBeats = getPastBeats(state, eraBeats);
  const upcoming = getUpcomingBeats(state, eraBeats, 99);

  const items: TimelineItem[] = [];

  // Past beats
  for (const b of pastBeats) {
    items.push({
      id: b.id,
      year: b.yearOccurred,
      title: b.title,
      description: b.description,
      status: b.altered ? "altered" : "past",
    });
  }

  // Current year beats that are triggered but maybe not applied yet
  for (const b of eraBeats) {
    const existing = state["Cột Mốc Lịch Sử"][b.id];
    if (existing?.["Đã Xảy Ra"]) continue;
    if (b.year === currentYear) {
      items.push({
        id: b.id,
        year: b.year,
        title: b.title,
        description: b.description,
        status: "current",
      });
    }
  }

  // Upcoming
  for (const b of upcoming) {
    items.push({
      id: b.id,
      year: b.year,
      title: b.title,
      description: b.description,
      status: "future",
    });
  }

  return items.sort((a, b) => a.year - b.year);
}

const STATUS_STYLES: Record<string, { dotColor: string; textOpacity: number; border?: string }> = {
  past: { dotColor: "#8a9bae", textOpacity: 0.7 },
  altered: { dotColor: "#c4a265", textOpacity: 0.85, border: "1px solid #c4a26544" },
  current: { dotColor: "#6dbe6d", textOpacity: 1, border: "1px solid #6dbe6d44" },
  future: { dotColor: "rgba(255,255,255,0.2)", textOpacity: 0.35 },
};

export function CanonTimeline({ state }: { state: StatData }) {
  const items = buildTimelineItems(state);
  const currentYear = state["Thế Giới"]["Năm"];

  if (items.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px 20px",
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.85rem",
      }}>
        Không có cột mốc lịch sử nào cho thời kỳ này.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingLeft: "28px" }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute",
        left: "10px",
        top: "4px",
        bottom: "4px",
        width: "2px",
        background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      }} />

      {/* Current year marker */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.5)",
      }}>
        <span style={{ color: "#6dbe6d" }}><StarIcon size={14} /></span>
        Năm hiện tại: {currentYear} AC
      </div>

      {items.map((item) => {
        const style = STATUS_STYLES[item.status];
        return (
          <div key={item.id} style={{
            position: "relative",
            marginBottom: "16px",
            paddingLeft: "16px",
          }}>
            {/* Dot */}
            <div style={{
              position: "absolute",
              left: "-22px",
              top: "4px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: style.dotColor,
              boxShadow: item.status === "current" ? `0 0 8px ${style.dotColor}66` : "none",
            }} />

            {/* Content */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: style.border ?? "1px solid rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "10px 12px",
              opacity: style.textOpacity,
              transition: "opacity 0.3s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.9)",
                }}>
                  {item.title}
                </span>
                <span style={{
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <FlagIcon size={11} />
                  {item.year} AC
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.4,
              }}>
                {item.description}
              </p>
              {item.status === "altered" && (
                <span style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "0.68rem",
                  color: "#c4a265",
                  fontWeight: 500,
                }}>
                  LỊCH SỬ ĐÃ BỊ THAY ĐỔI
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
