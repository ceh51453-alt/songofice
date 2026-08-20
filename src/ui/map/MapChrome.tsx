/**
 * MapChrome — các mảnh giao diện phủ lên bản đồ, dùng chung cho mọi tầng:
 * chú giải (đổi theo chế độ tô màu) và thanh nhiệm vụ.
 */
import type { StatData } from "../../mvu/schema";
import { HOUSE_COLORS, ATTITUDE_HEAT, PLAYER_HEAT_COLOR, houseColor } from "../../content/westeros/houseColors";
import { balanceOfPower, deJureRealms, factionMapSummaries } from "../../territory/mapAggregate";
import { fromAbsoluteDay, formatDateShort } from "../../mvu/calendar";
import type { MapMode } from "../../territory/territoryEngine";
import type { MapTier } from "../../content/westeros/mapScale";
import { IconPin, IconCheck, IconChevronDown } from "../icons";

export function MapLegend({
  mode,
  tier,
  stat,
  onSelectFaction,
}: {
  mode: MapMode;
  tier: MapTier;
  stat: StatData;
  onSelectFaction?: (factionId: string) => void;
}) {
  // Chú giải theo chế độ phải được ưu tiên ở mọi cấp zoom. Trước đây hai tầng
  // Thế Giới/Vương Quốc return sớm khiến chế độ Phe Phái không có chú giải.
  if (mode === "relationship") {
    const items = [
      { id: "player", color: PLAYER_HEAT_COLOR, label: "Lãnh thổ ta" },
      ...Object.entries(ATTITUDE_HEAT).map(([k, v]) => ({ id: `attitude:${k}`, color: v.color, label: `${k} · ${v.label}` })),
    ];
    return <LegendBox items={items} />;
  }

  if (mode === "faction") {
    const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
    const factions = factionMapSummaries(stat, eraId);
    return (
      <LegendBox
        items={factions.map((faction) => ({
          id: faction.factionId,
          color: faction.colorHouseId ? houseColor(faction.colorHouseId).base : "#657174",
          label: `${faction.name} · ${faction.regionIds.length} vùng · ${Math.round(faction.controlRatio * 100)}%`,
          onClick: onSelectFaction ? () => onSelectFaction(faction.factionId) : undefined,
        }))}
      />
    );
  }

  // Tầng Thế Giới nói chuyện quyền lực, không nói chuyện từng Nhà chư hầu.
  if (tier === "world") {
    const realms = balanceOfPower(stat).slice(0, 6);
    return (
      <LegendBox
        items={realms.map((r) => ({
          color: HOUSE_COLORS[r.houseId]?.base ?? "#4a4a4a",
          label: `${HOUSE_COLORS[r.houseId]?.label ?? r.houseId} · ${Math.round(r.share * 100)}%`,
        }))}
      />
    );
  }

  if (tier === "realm") {
    const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
    const realms = deJureRealms(stat, eraId).slice(0, 9);
    return (
      <LegendBox
        items={realms.map((realm) => ({
          color: HOUSE_COLORS[realm.controller]?.base ?? "#657174",
          label: `${realm.name} · ${realm.controlledStrongholds}/${realm.totalStrongholds} thành`,
        }))}
      />
    );
  }

  const present = new Set(Object.values(stat["Chủ Quyền Lãnh Thổ"]).map((s) => s["Nhà Kiểm Soát"]).filter(Boolean));
  const items = [...present].map((h) => ({ id: h, color: HOUSE_COLORS[h]?.base ?? "#4a4a4a", label: HOUSE_COLORS[h]?.label ?? h }));
  return <LegendBox items={items} />;
}

interface LegendItem {
  id?: string;
  color: string;
  label: string;
  onClick?: () => void;
}

function LegendBox({ items }: { items: LegendItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="glass-strong absolute bottom-3 left-3 z-10 flex max-h-[32vh] max-w-[48vw] flex-wrap gap-x-3 gap-y-1 overflow-y-auto p-2.5">
      {items.map((it) => it.onClick ? (
        <button
          key={it.id ?? it.label}
          type="button"
          onClick={it.onClick}
          className="flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
        >
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </button>
      ) : (
        <div key={it.id ?? it.label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

const QUEST_TYPE_COLORS: Record<string, string> = {
  "Cốt Truyện Chính": "var(--accent-text)",
  "Phụ": "var(--text-muted)",
  "Gia Tộc": "#d4a853",
  "Chính Trị": "#6ea8d4",
  "Quân Sự": "#c76c6c",
};

export function QuestTracker({
  quests, open, onToggle,
}: {
  quests: StatData["Nhiệm Vụ"];
  open: boolean;
  onToggle: () => void;
}) {
  const activeQuests = Object.entries(quests).filter(([, q]) => q["Trạng Thái"] === "Đang Làm");
  if (activeQuests.length === 0) return null;

  return (
    <div className="glass-strong absolute left-3 top-3 z-10 flex max-h-[60vh] w-[260px] flex-col overflow-hidden sm:w-[300px]">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--glass-bg-hover)]">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[var(--accent-text)]">
          <IconPin size={13} />
          Nhiệm Vụ
          <span className="ml-1 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--accent-text)]">
            {activeQuests.length}
          </span>
        </span>
        <IconChevronDown size={14} className={`text-[var(--text-faint)] transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto border-t border-[var(--glass-border)] px-3 pb-2 pt-1.5">
          {activeQuests.map(([id, q], idx) => {
            const done = q["Mục Tiêu"].filter((o) => o["Xong"]).length;
            const total = q["Mục Tiêu"].length;
            const progress = total > 0 ? (done / total) * 100 : 0;
            const typeColor = QUEST_TYPE_COLORS[q["Loại"]] ?? "var(--text-muted)";

            return (
              <div key={id} className={idx > 0 ? "mt-2.5 border-t border-[var(--glass-border)] pt-2" : ""}>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[12.5px] font-medium leading-tight text-[var(--text-soft)]">{q["Tiêu Đề"] || id}</span>
                  <span className="shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: typeColor, background: "rgba(255,255,255,0.06)" }}>
                    {q["Loại"]}
                  </span>
                </div>
                {q["Mô Tả"] && <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-faint)]">{q["Mô Tả"]}</p>}
                {total > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: typeColor }} />
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-faint)]">{done}/{total}</span>
                  </div>
                )}
                <div className="mt-1.5 space-y-0.5">
                  {q["Mục Tiêu"].map((obj, oi) => (
                    <div key={oi} className={`flex items-start gap-1.5 text-[11px] leading-snug ${obj["Xong"] ? "text-[var(--text-faint)] line-through" : "text-[var(--text-muted)]"}`}>
                      {obj["Xong"] ? (
                        <IconCheck size={11} className="mt-0.5 shrink-0 text-[var(--ok)]" />
                      ) : (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full border border-[var(--text-faint)]" />
                      )}
                      {obj["Mô Tả"]}
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-faint)]">
                  {q["Phần Thưởng"] && <span>[+] {q["Phần Thưởng"]}</span>}
                  {q["Hạn Chót Ngày"] && <span className="text-[var(--warn)]">hạn {formatDateShort(fromAbsoluteDay(q["Hạn Chót Ngày"]))}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
