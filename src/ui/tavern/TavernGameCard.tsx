/**
 * TavernGameCard — Card inline trong dòng chat V2.
 * Hiển thị 6 trò chơi với complexity badges.
 */
import { useTavernStore } from "../../state/tavernStore";
import { useMvuStore } from "../../state/mvuStore";
import { useChatStore } from "../../state/chatStore";
import { GAME_INFO, COMPLEXITY_COLORS, type TavernGameType } from "../../minigame/tavernGameEngine";
import { IconDice, IconCards, IconCup, IconArm, IconLiar, IconCoin } from "./TavernIcons";
import { useT } from "../../i18n";

const GAME_ICONS: Record<TavernGameType, React.ReactNode> = {
  "kings-game": <IconCards size={15} />,
  "dragon-dice": <IconDice size={15} />,
  "shell-game": <IconCup size={15} />,
  "arm-wrestle": <IconArm size={15} />,
  "liars-dice": <IconLiar size={15} />,
  "coin-flip": <IconCoin size={15} />,
};

export function TavernGameCard({ content, attrs }: { content: string; attrs: Record<string, string> }) {
    const t = useT();
  const openMenu = useTavernStore((s) => s.openMenu);
  const busy = useChatStore((s) => s.status !== "idle");
  const gold = useMvuStore((s) => s.stat["Thông Tin Nhân Vật"]["Vàng"]);
  const phase = useTavernStore((s) => s.phase);

  const opponent = attrs.opponent ?? "Kẻ lạ mặt";
  const tavern = attrs.tavern ?? "Quán rượu";
  const alreadyPlaying = phase !== "idle";

  return (
    <div className="glass anim-in my-2 border-[rgba(194,164,104,0.35)] bg-[linear-gradient(160deg,rgba(194,164,104,0.08),rgba(140,100,60,0.03))] px-4 py-3">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2 border-b border-[var(--glass-border)] pb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8l2 4H6l2-4z" />
          <path d="M6 6v2a6 6 0 0 0 12 0V6" />
          <path d="M12 14v4" />
          <path d="M8 18h8" />
        </svg>
        <span className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">
          {tavern.toUpperCase()}
        </span>
        <span className="ml-auto text-[11px] text-[var(--text-faint)]">
          {gold}  {t("ui.vang_1")}
                          </span>
      </div>

      {/* Mô tả */}
      <p className="mb-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-muted)]">
        {content}
      </p>

      {/* Đối thủ */}
      <div className="mb-3 flex items-center gap-2 text-[12px] text-[var(--text-faint)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
        <span>{t("ui.doi_thu")} <span className="text-[var(--text-soft)]">{opponent}</span></span>
      </div>

      {/* Nút vào quán (mở menu đầy đủ) */}
      <button
        disabled={busy || alreadyPlaying}
        onClick={() => openMenu(opponent, tavern)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2.5 text-[14px] font-medium text-[var(--accent-text)] transition-all hover:brightness-125 disabled:opacity-40 active:scale-[0.98]"
      >
        <IconDice size={16} />
        
                      {t("ui.vao_choi")}{Object.keys(GAME_INFO).length}  {t("ui.tro")}
                    </button>

      {/* Preview 6 trò */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(Object.keys(GAME_INFO) as TavernGameType[]).map((type) => {
          const info = GAME_INFO[type];
          return (
            <span
              key={type}
              className="flex items-center gap-1 rounded-sm border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]"
            >
              {GAME_ICONS[type]}
              {info.name}
              <span
                className="ml-0.5 h-1.5 w-1.5 rounded-full"
                style={{ background: COMPLEXITY_COLORS[info.complexity] }}
              />
            </span>
          );
        })}
      </div>

      {alreadyPlaying && (
        <p className="mt-2 text-[11.5px] italic text-[var(--warn)]">{t("ui.dang_trong_van_choi")}</p>
      )}
    </div>
  );
}
