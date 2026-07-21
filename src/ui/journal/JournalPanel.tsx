/**
 * JournalPanel.tsx — Panel chính Journal với 3 tab (17.4):
 * 1. Nhiệm Vụ (sub-tabs: Đang Làm / Hoàn Thành / Thất Bại)
 * 2. Biên Niên Sử (nhật ký tự động)
 * 3. Đồng Thời Gian Canon
 * Glassmorphism, không emoji, SVG icons.
 */
import { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { QuestList } from "./QuestCard";
import { CanonTimeline } from "./CanonTimeline";
import { ScrollIcon, SwordIcon, TimelineIcon } from "./JournalIcons";
import type { StatData } from "../../mvu/schema";

type MainTab = "quests" | "chronicle" | "timeline";
type QuestSubTab = "Đang Làm" | "Hoàn Thành" | "Thất Bại";

const MAIN_TABS: { id: MainTab; label: string; Icon: typeof ScrollIcon }[] = [
  { id: "quests", label: "Nhiệm Vụ", Icon: SwordIcon },
  { id: "chronicle", label: "Biên Niên Sử", Icon: ScrollIcon },
  { id: "timeline", label: "Đồng Thời Gian", Icon: TimelineIcon },
];

const QUEST_SUB_TABS: QuestSubTab[] = ["Đang Làm", "Hoàn Thành", "Thất Bại"];

// ── Biên Niên Sử ──

function ChronicleView({ state }: { state: StatData }) {
  const entries = [...state["Nhật Ký"]].reverse(); // moi nhat truoc

  if (entries.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px 20px",
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.85rem",
      }}>
        Chưa có sự kiện nào được ghi lại.
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
      {entries.map((entry, i) => (
        <div key={i} style={{
          display: "flex",
          gap: "12px",
          padding: "10px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            flexShrink: 0,
            width: "42px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>
              Năm
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              {entry["Năm"]}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: "0.65rem",
              padding: "1px 6px",
              borderRadius: "3px",
              background: getJournalTypeBg(entry["Loại"]),
              color: getJournalTypeColor(entry["Loại"]),
              fontWeight: 500,
              marginRight: "8px",
            }}>
              {entry["Loại"]}
            </span>
            <span style={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.75)",
            }}>
              {entry["Mô Tả"]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getJournalTypeBg(type: string): string {
  const map: Record<string, string> = {
    "Chiến Thắng": "#6dbe6d22",
    "Thất Bại": "#be6d6d22",
    "Liên Minh": "#6d8abe22",
    "Phản Bội": "#be8a6d22",
    "Chiếm Đất": "#6dbe9a22",
    "Mất Đất": "#be6d8a22",
    "Hôn Nhân": "#be6dbe22",
    "Chết": "#6d6d6d22",
    "Sự Kiện": "#c4a26522",
    "Quest": "#8a9bae22",
    "Cột Mốc": "#c4a26522",
    "Khác": "#66666622",
  };
  return map[type] ?? "#66666622";
}

function getJournalTypeColor(type: string): string {
  const map: Record<string, string> = {
    "Chiến Thắng": "#6dbe6d",
    "Thất Bại": "#be6d6d",
    "Liên Minh": "#6d8abe",
    "Phản Bội": "#be8a6d",
    "Chiếm Đất": "#6dbe9a",
    "Mất Đất": "#be6d8a",
    "Hôn Nhân": "#be6dbe",
    "Chết": "#999",
    "Sự Kiện": "#c4a265",
    "Quest": "#8a9bae",
    "Cột Mốc": "#c4a265",
    "Khác": "#888",
  };
  return map[type] ?? "#888";
}

// ── Main Panel ──

export function JournalPanel() {
  const state = useMvuStore((s) => s.stat);
  const [mainTab, setMainTab] = useState<MainTab>("quests");
  const [questSubTab, setQuestSubTab] = useState<QuestSubTab>("Đang Làm");

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "rgba(15,15,20,0.85)",
      backdropFilter: "blur(20px)",
      color: "rgba(255,255,255,0.85)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <h2 style={{
          margin: "0 0 12px 0",
          fontSize: "1rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <ScrollIcon size={18} />
          Nhật Ký
        </h2>

        {/* Main tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {MAIN_TABS.map((tab) => {
            const active = mainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  border: "none",
                  borderRadius: "6px 6px 0 0",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.2s ease",
                }}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {mainTab === "quests" && (
          <>
            {/* Quest sub-tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {QUEST_SUB_TABS.map((sub) => {
                const active = questSubTab === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setQuestSubTab(sub)}
                    style={{
                      padding: "4px 12px",
                      border: `1px solid ${active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "14px",
                      background: active ? "rgba(255,255,255,0.06)" : "transparent",
                      color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
            <QuestList state={state} filter={questSubTab} />
          </>
        )}

        {mainTab === "chronicle" && <ChronicleView state={state} />}

        {mainTab === "timeline" && <CanonTimeline state={state} />}
      </div>
    </div>
  );
}
