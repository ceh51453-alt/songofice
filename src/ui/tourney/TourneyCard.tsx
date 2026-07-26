/**
 * TourneyCard — Card inline trong dòng chat khi AI phát thẻ <tourney>.
 * Hiển thị thông tin đại hội + nút tham gia.
 */
import { useTourneyStore } from "../../state/tourneyStore";
import { useChatStore } from "../../state/chatStore";
import {
  TOURNEY_EVENTS,
  CANON_TOURNEYS,
  type TourneyEventType,
} from "../../content/westeros/tourneyData";
import { IconTrophy, IconLance, IconSword, IconBow, IconHorse, IconBanner } from "./TourneyIcons";
import { useT } from "../../i18n";

const EVENT_ICONS: Record<TourneyEventType, React.ReactNode> = {
  joust: <IconLance size={13} />,
  melee: <IconSword size={13} />,
  archery: <IconBow size={13} />,
  "horse-race": <IconHorse size={13} />,
  "sword-duel": <IconSword size={13} />,
};

const SIGNIFICANCE_COLORS: Record<string, string> = {
  minor: "var(--text-faint)",
  major: "var(--accent-text)",
  legendary: "#c5a03f",
};

export function TourneyCard({ content, attrs }: { content: string; attrs: Record<string, string> }) {
    const t = useT();
  const openTourney = useTourneyStore((s) => s.openTourney);
  const openCustom = useTourneyStore((s) => s.openCustomTourney);
  const busy = useChatStore((s) => s.status !== "idle");
  const phase = useTourneyStore((s) => s.phase);

  const tourneyId = attrs["tourney-id"] ?? "";
  const location = attrs.location ?? "Trường Đấu";
  const alreadyActive = phase !== "idle";

  // Tìm đại hội canon
  const canon = CANON_TOURNEYS.find((t) => t.id === tourneyId);

  const handleJoin = () => {
    if (canon) {
      openTourney(tourneyId);
    } else {
      // Custom tourney
      const name = attrs.name ?? "Đại Hội Đấu";
      const evts: TourneyEventType[] = ["joust", "melee", "archery", "sword-duel"];
      openCustom(name, location, evts);
    }
  };

  return (
    <div className="glass anim-in my-2 border-[rgba(197,160,63,0.35)] bg-[linear-gradient(160deg,rgba(197,160,63,0.06),rgba(160,120,40,0.02))] px-4 py-3">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 border-b border-[var(--glass-border)] pb-2">
        <IconTrophy size={16} color={canon ? SIGNIFICANCE_COLORS[canon.significance] : "var(--accent-text)"} />
        <span className="font-display text-[13px] tracking-widest" style={{ color: canon ? SIGNIFICANCE_COLORS[canon.significance] : "var(--accent-text)" }}>
          {(canon?.name ?? attrs.name ?? "ĐẠI HỘI ĐẤU").toUpperCase()}
        </span>
        {canon && (
          <span className="ml-auto rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase"
            style={{ color: SIGNIFICANCE_COLORS[canon.significance], background: `${SIGNIFICANCE_COLORS[canon.significance]}15` }}>
            {canon.significance === "legendary" ? "Huyền Thoại" : canon.significance === "major" ? "Lớn" : "Nhỏ"}
          </span>
        )}
      </div>

      {/* Mô tả */}
      <p className="mb-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-muted)]">
        {content}
      </p>

      {/* Thông tin */}
      {canon && (
        <div className="mb-3 space-y-1 text-[12px] text-[var(--text-faint)]">
          <div className="flex items-center gap-2">
            <IconBanner size={12} />
            <span>{t("ui.dia_diem")} <span className="text-[var(--text-soft)]">{canon.location}</span></span>
            <span className="mx-1">·</span>
            <span>{t("ui.to_chuc")} <span className="text-[var(--text-soft)]">{canon.hostHouse}</span></span>
          </div>
          {canon.notableParticipants.length > 0 && (
            <div className="text-[11px]">
              
                                        {t("ui.doi_thu_dang_gom")} <span className="text-[var(--text-soft)]">{canon.notableParticipants.slice(0, 5).join(", ")}</span>
              {canon.notableParticipants.length > 5 && <span className="text-[var(--text-faint)]">{t("ui.va")} {canon.notableParticipants.length - 5}  {t("ui.nguoi_khac")}</span>}
            </div>
          )}
        </div>
      )}

      {/* Nội dung thi */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(canon?.events ?? ["joust", "melee", "archery", "sword-duel"]).map((e) => {
          const info = TOURNEY_EVENTS[e as TourneyEventType];
          return (
            <span key={e} className="flex items-center gap-1 rounded-sm border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">
              {EVENT_ICONS[e as TourneyEventType]}
              {info.name}
            </span>
          );
        })}
      </div>

      {/* Sự kiện lore */}
      {canon?.loreEvents && canon.loreEvents.length > 0 && (
        <div className="mb-3 rounded-md border border-[rgba(197,160,63,0.15)] bg-[rgba(197,160,63,0.04)] px-3 py-2">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-[rgba(197,160,63,0.5)]">
            Lore
          </span>
          {canon.loreEvents.map((e, i) => (
            <p key={i} className="text-[11px] italic text-[var(--text-faint)]">
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Nút tham gia */}
      <button
        disabled={busy || alreadyActive}
        onClick={handleJoin}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[rgba(197,160,63,0.4)] bg-[rgba(197,160,63,0.08)] px-4 py-2.5 text-[14px] font-medium text-[#c5a03f] transition-all hover:brightness-125 disabled:opacity-40 active:scale-[0.98]"
      >
        <IconTrophy size={16} />
        
                      {t("ui.tham_gia_dai_hoi")}
                    </button>

      {alreadyActive && (
        <p className="mt-2 text-[11.5px] italic text-[var(--warn)]">{t("ui.dang_tham_gia_dai_hoi")}</p>
      )}
    </div>
  );
}
