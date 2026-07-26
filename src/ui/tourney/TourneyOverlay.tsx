/**
 * TourneyOverlay — Container overlay cho đại hội đấu.
 * Menu đăng ký nội dung → thi đấu từng vòng → kết quả.
 */
import { useTourneyStore } from "../../state/tourneyStore";
import { TOURNEY_EVENTS, CANON_TOURNEYS, type TourneyEventType } from "../../content/westeros/tourneyData";
import type { TourneyMatchResult } from "../../minigame/tourneyEngine";
import { IconTrophy, IconLance, IconSword, IconBow, IconHorse } from "./TourneyIcons";
import { IconX } from "../icons";
import { useT } from "../../i18n";

const EVENT_ICONS: Record<TourneyEventType, React.ReactNode> = {
  joust: <IconLance size={18} />,
  melee: <IconSword size={18} />,
  archery: <IconBow size={18} />,
  "horse-race": <IconHorse size={18} />,
  "sword-duel": <IconSword size={18} />,
};

const PLACE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Nhất", color: "#c5a03f" },
  2: { label: "Nhì", color: "#a8a8a8" },
  3: { label: "Ba", color: "#b87333" },
};

function EventRegistration() {
    const t = useT();
  const tourneyState = useTourneyStore((s) => s.tourneyState);
  const registerForEvent = useTourneyStore((s) => s.registerForEvent);
  const startCompeting = useTourneyStore((s) => s.startCompeting);

  if (!tourneyState) return null;

  const canon = CANON_TOURNEYS.find((t) => t.id === tourneyState.tourneyId);
  const availableEvents = canon?.events ?? ["joust", "melee", "archery", "sword-duel"];
  const completedTypes = tourneyState.completedEvents.map((e) => e.type);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-display text-lg tracking-wider text-[#c5a03f]">
          {tourneyState.tourneyName}
        </h3>
        <p className="text-[12px] text-[var(--text-faint)]">
          {tourneyState.location}
          {tourneyState.totalGoldWon > 0 && (
            <span className="ml-2 text-[var(--accent-text)]">+{tourneyState.totalGoldWon}  {t("ui.vang_1")}</span>
          )}
        </p>
      </div>

      {/* Danh sách nội dung */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
          
                            {t("ui.noi_dung_thi_dau")}
                          </span>
        {availableEvents.map((type) => {
          const info = TOURNEY_EVENTS[type as TourneyEventType];
          const completed = completedTypes.includes(type as TourneyEventType);
          const completedEvent = tourneyState.completedEvents.find((e) => e.type === type);
          const isRegistered = tourneyState.registeredEvents.includes(type as TourneyEventType);
          const place = completedEvent?.finalPlace;
          const placeInfo = place ? PLACE_LABELS[place] : null;

          return (
            <div
              key={type}
              className={`flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${
                completed
                  ? "border-[rgba(125,165,131,0.3)] bg-[rgba(125,165,131,0.05)]"
                  : isRegistered
                    ? "border-[rgba(197,160,63,0.3)] bg-[rgba(197,160,63,0.05)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                completed ? "border-[rgba(125,165,131,0.4)] text-[var(--ok)]" : "border-[var(--glass-border)] text-[var(--text-muted)]"
              }`}>
                {EVENT_ICONS[type as TourneyEventType]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[var(--text-soft)]">{info.name}</span>
                  {placeInfo && (
                    <span className="rounded-sm px-1.5 py-0.5 text-[9px] font-bold" style={{ color: placeInfo.color }}>
                      {placeInfo.label}
                    </span>
                  )}
                </div>
                <span className="block text-[11px] text-[var(--text-faint)]">{info.desc}</span>
                <span className="block text-[10px] text-[var(--text-faint)]">
                  {info.primaryStat} + {info.secondaryStat} · {info.rounds}  {t("ui.vong_1")} {Math.round(info.goldPrize * (tourneyState?.prizeMultiplier ?? 1))}  {t("ui.vang_1")}
                                          </span>
              </div>
              {!completed && (
                <div className="flex shrink-0 gap-1.5">
                  {!isRegistered ? (
                    <button
                      onClick={() => registerForEvent(type as TourneyEventType)}
                      className="rounded-md border border-[var(--glass-border-bright)] bg-[var(--glass-bg)] px-3 py-1.5 text-[12px] text-[var(--text-soft)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.96]"
                    >
                      
                                                        {t("ui.dang_ky")}
                                                      </button>
                  ) : (
                    <button
                      onClick={() => startCompeting(type as TourneyEventType)}
                      className="rounded-md border border-[rgba(197,160,63,0.4)] bg-[rgba(197,160,63,0.08)] px-3 py-1.5 text-[12px] font-medium text-[#c5a03f] transition-all hover:brightness-125 active:scale-[0.96]"
                    >
                      
                                                            {t("ui.thi_dau")}
                                                          </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetingView() {
    const t = useT();
  const tourneyState = useTourneyStore((s) => s.tourneyState);
  const fight = useTourneyStore((s) => s.fight);
  const nextEvent = useTourneyStore((s) => s.nextEvent);

  if (!tourneyState?.activeEvent) return null;

  const event = tourneyState.activeEvent;
  const info = TOURNEY_EVENTS[event.type];
  const isDone = event.phase === "done";
  const place = event.finalPlace;
  const placeInfo = place ? PLACE_LABELS[place] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 text-center">
        {EVENT_ICONS[event.type]}
        <h3 className="font-display text-lg tracking-wider text-[var(--accent-text)]">
          {info.name}
        </h3>
      </div>

      {/* Vòng hiện tại */}
      {!isDone && (
        <div className="text-center">
          <span className="text-[13px] text-[var(--accent-text)]">
            
                                  {t("ui.vong")} {event.currentRound + 1}/{event.totalRounds}
          </span>
        </div>
      )}

      {/* Kết quả vòng */}
      {isDone && place && (
        <div className="text-center">
          <span className="font-display text-3xl" style={{ color: placeInfo?.color ?? "var(--text-soft)" }}>
            {placeInfo?.label ?? `Hạng ${place}`}
          </span>
          <p className="mt-1 text-[12px] text-[var(--text-faint)]">
            {place === 1 ? "Vinh quang tuyệt đối!" : place <= 3 ? "Thành tích đáng khen!" : "Lần sau sẽ hơn!"}
          </p>
        </div>
      )}

      {/* Lịch sử trận đấu */}
      {event.matches.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.lich_su_1")}{event.matches.length}/{event.totalRounds})
          </span>
          {event.matches.map((m, i) => (
            <MatchCard key={i} match={m} index={i} />
          ))}
        </div>
      )}

      {/* Nút hành động */}
      {!isDone && (
        <button
          onClick={fight}
          className="mx-auto flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(197,160,63,0.4)] bg-[rgba(197,160,63,0.08)] px-8 py-3 text-[15px] font-medium text-[#c5a03f] transition-all hover:brightness-125 active:scale-[0.96]"
        >
          {EVENT_ICONS[event.type]}
          
                            {t("ui.chien_dau")}
                          </button>
      )}

      {isDone && (
        <button
          onClick={nextEvent}
          className="mx-auto rounded-[var(--radius-md)] border border-[var(--glass-border-bright)] bg-[var(--glass-bg)] px-6 py-2.5 text-[14px] text-[var(--text-soft)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.96]"
        >
          
                            {t("ui.tiep_tuc")}
                          </button>
      )}
    </div>
  );
}

function MatchCard({ match, index }: { match: TourneyMatchResult; index: number }) {
    const t = useT();
  const won = match.winner === "player";
  const draw = match.winner === "draw";
  return (
    <div className={`glass rounded-md border px-3 py-2 ${
      won ? "border-[rgba(125,165,131,0.4)]" : draw ? "border-[var(--glass-border)]" : "border-[rgba(176,106,95,0.4)]"
    }`}>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-faint)]">
          
                            {t("ui.vong")} {index + 1}: vs {match.opponentName}
        </span>
        <span className={won ? "text-[var(--ok)]" : draw ? "text-[var(--warn)]" : "text-[var(--danger)]"}>
          {won ? "Thắng" : draw ? "Hoà" : "Thua"}
        </span>
      </div>
      <p className="text-[10px] italic text-[var(--text-faint)]">{match.narration}</p>
      <div className="mt-1 flex gap-3 text-[10px] text-[var(--text-faint)]">
        <span>{t("ui.nguoi_choi")} {match.playerScore}</span>
        <span>{match.opponentName}: {match.opponentScore}</span>
      </div>
    </div>
  );
}

function TourneyResults() {
    const t = useT();
  const tourneyState = useTourneyStore((s) => s.tourneyState);
  const claimRewards = useTourneyStore((s) => s.claimRewards);

  if (!tourneyState) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <IconTrophy size={40} color="#c5a03f" />
      <h3 className="font-display text-xl tracking-wider text-[#c5a03f]">
        
                      {t("ui.ket_thuc_dai_hoi")}
                    </h3>

      {/* Kết quả từng nội dung */}
      <div className="w-full space-y-2">
        {tourneyState.completedEvents.map((event, i) => {
          const info = TOURNEY_EVENTS[event.type];
          const place = event.finalPlace;
          const placeInfo = place ? PLACE_LABELS[place] : null;
          return (
            <div key={i} className="flex items-center justify-between rounded-md border border-[var(--glass-border)] px-3 py-2">
              <div className="flex items-center gap-2">
                {EVENT_ICONS[event.type]}
                <span className="text-[13px] text-[var(--text-soft)]">{info.name}</span>
              </div>
              <span className="text-[13px] font-bold" style={{ color: placeInfo?.color ?? "var(--text-faint)" }}>
                {placeInfo?.label ?? `Hạng ${place}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tổng thưởng */}
      <div className="glass w-full border-[rgba(197,160,63,0.3)] px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-6">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.vang_1")}</span>
            <span className="block font-display text-xl text-[var(--accent-text)]">+{tourneyState.totalGoldWon}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.uy_dung")}</span>
            <span className="block font-display text-xl text-[#c5a03f]">+{tourneyState.totalGloryWon}</span>
          </div>
        </div>
      </div>

      <button
        onClick={claimRewards}
        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(197,160,63,0.4)] bg-[rgba(197,160,63,0.08)] px-8 py-3 text-[15px] font-medium text-[#c5a03f] transition-all hover:brightness-125 active:scale-[0.96]"
      >
        <IconTrophy size={18} />
        
                      {t("ui.nhan_thuong")}
                    </button>
    </div>
  );
}

export function TourneyOverlay() {
  const phase = useTourneyStore((s) => s.phase);
  const tourneyState = useTourneyStore((s) => s.tourneyState);
  const exitTourney = useTourneyStore((s) => s.exitTourney);

  if (phase === "idle" || !tourneyState) return null;

  const tourneyPhase = tourneyState.phase;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch" role="dialog" aria-modal="true" aria-label="Đại Hội Đấu">
      <div
        className="absolute inset-0 bg-[rgba(5,7,10,0.7)] backdrop-blur-[4px]"
        onClick={() => { if (tourneyPhase === "menu" || tourneyPhase === "done") exitTourney(); }}
      />

      <div className="glass-strong anim-in relative mx-auto my-4 flex w-full max-w-lg flex-col overflow-hidden sm:my-8 sm:rounded-xl max-sm:rounded-none max-sm:border-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <IconTrophy size={18} color="#c5a03f" />
            <h2 className="font-display text-[15px] tracking-wider text-[var(--text-soft)]">
              {tourneyState.tourneyName}
            </h2>
          </div>
          <button
            onClick={exitTourney}
            aria-label="Đóng"
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tourneyPhase === "menu" && <EventRegistration />}
          {(tourneyPhase === "competing" || tourneyPhase === "results") && tourneyState.activeEvent && <CompetingView />}
          {tourneyPhase === "done" && <TourneyResults />}
          {tourneyPhase === "results" && !tourneyState.activeEvent && <TourneyResults />}
        </div>
      </div>
    </div>
  );
}
