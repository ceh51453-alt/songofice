/**
 * QuestCard.tsx — Component card quest với checklist, progress bar, countdown (17.4).
 * Glassmorphism, không emoji.
 */
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "./JournalIcons";
import type { StatData } from "../../mvu/schema";

interface QuestData {
  id: string;
  title: string;
  type: string;
  status: string;
  objectives: { description: string; done: boolean }[];
  reward: string;
  deadlineTurn?: number;
  description: string;
}

const TYPE_COLORS: Record<string, string> = {
  "Cốt Truyện Chính": "#c4a265",
  "Phụ": "#8a9bae",
  "Gia Tộc": "#7d6b5d",
  "Chính Trị": "#6b7d5d",
  "Quân Sự": "#9b5d5d",
};

function extractQuests(state: StatData): QuestData[] {
  return Object.entries(state["Nhiệm Vụ"]).map(([id, q]) => ({
    id,
    title: q["Tiêu Đề"],
    type: q["Loại"],
    status: q["Trạng Thái"],
    objectives: q["Mục Tiêu"].map((o) => ({
      description: o["Mô Tả"],
      done: o["Xong"],
    })),
    reward: q["Phần Thưởng"],
    deadlineTurn: q["Hạn Chót Turn"],
    description: q["Mô Tả"],
  }));
}

export function QuestCard({ quest, currentTurn }: { quest: QuestData; currentTurn: number }) {
  const doneCount = quest.objectives.filter((o) => o.done).length;
  const totalCount = quest.objectives.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const turnsLeft = quest.deadlineTurn !== undefined ? quest.deadlineTurn - currentTurn : null;
  const urgent = turnsLeft !== null && turnsLeft <= 5;

  const isCompleted = quest.status === "Hoàn Thành";
  const isFailed = quest.status === "Thất Bại";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "14px 16px",
      marginBottom: "10px",
      backdropFilter: "blur(12px)",
      opacity: isCompleted || isFailed ? 0.6 : 1,
      transition: "opacity 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isCompleted && <span style={{ color: "#6dbe6d" }}><CheckCircleIcon size={16} /></span>}
          {isFailed && <span style={{ color: "#be6d6d" }}><XCircleIcon size={16} /></span>}
          <span style={{
            fontWeight: 600,
            fontSize: "0.92rem",
            color: "rgba(255,255,255,0.9)",
            textDecoration: isFailed ? "line-through" : "none",
          }}>
            {quest.title}
          </span>
        </div>
        <span style={{
          fontSize: "0.7rem",
          padding: "2px 8px",
          borderRadius: "4px",
          background: `${TYPE_COLORS[quest.type] ?? "#666"}33`,
          color: TYPE_COLORS[quest.type] ?? "#aaa",
          fontWeight: 500,
        }}>
          {quest.type}
        </span>
      </div>

      {/* Description */}
      {quest.description && (
        <p style={{
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.5)",
          margin: "0 0 10px 0",
          lineHeight: 1.4,
        }}>
          {quest.description}
        </p>
      )}

      {/* Objectives checklist */}
      {quest.objectives.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          {quest.objectives.map((obj, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 0",
              fontSize: "0.82rem",
              color: obj.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)",
              textDecoration: obj.done ? "line-through" : "none",
            }}>
              <span style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                border: `1.5px solid ${obj.done ? "#6dbe6d" : "rgba(255,255,255,0.2)"}`,
                background: obj.done ? "#6dbe6d22" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {obj.done && <CheckCircleIcon size={10} />}
              </span>
              {obj.description}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={{
          height: "3px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "8px",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: isCompleted ? "#6dbe6d" : isFailed ? "#be6d6d" : "#c4a265",
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }} />
        </div>
      )}

      {/* Footer: reward + deadline */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
        {quest.reward && (
          <span style={{ color: "rgba(255,255,255,0.45)" }}>
            Thưởng: {quest.reward}
          </span>
        )}
        {turnsLeft !== null && !isCompleted && !isFailed && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: urgent ? "#e07070" : "rgba(255,255,255,0.45)",
            fontWeight: urgent ? 600 : 400,
          }}>
            <ClockIcon size={12} />
            {turnsLeft > 0 ? `${turnsLeft} lượt` : "Hết hạn!"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Quest List Container ──

export function QuestList({
  state,
  filter,
}: {
  state: StatData;
  filter: "Đang Làm" | "Hoàn Thành" | "Thất Bại";
}) {
  const quests = extractQuests(state).filter((q) => q.status === filter);
  const turn = state["_engineMeta"]["turnCount"];

  if (quests.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px 20px",
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.85rem",
      }}>
        {filter === "Đang Làm" ? "Chưa có nhiệm vụ nào." :
         filter === "Hoàn Thành" ? "Chưa hoàn thành nhiệm vụ nào." :
         "Chưa có nhiệm vụ thất bại."}
      </div>
    );
  }

  return (
    <div>
      {quests.map((q) => (
        <QuestCard key={q.id} quest={q} currentTurn={turn} />
      ))}
    </div>
  );
}
