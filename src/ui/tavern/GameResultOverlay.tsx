/**
 * GameResultOverlay — Hiển thị kết quả THẮNG/THUA/HOÀ + phần thưởng.
 * Nút "Nhận Thưởng" / "Chơi Lại" / "Rời Đi".
 */
import { useTavernStore } from "../../state/tavernStore";
import { useMvuStore } from "../../state/mvuStore";
import { GAME_INFO } from "../../minigame/tavernGameEngine";
import { IconReward } from "./TavernIcons";
import { useT } from "../../i18n";

export function GameResultOverlay() {
    const t = useT();
  const phase = useTavernStore((s) => s.phase);
  const activeGame = useTavernStore((s) => s.activeGame);
  const reward = useTavernStore((s) => s.reward);
  const bet = useTavernStore((s) => s.bet);
  const kingsState = useTavernStore((s) => s.kingsState);
  const diceState = useTavernStore((s) => s.diceState);
  const shellState = useTavernStore((s) => s.shellState);
  const claimReward = useTavernStore((s) => s.claimReward);
  const exitTavern = useTavernStore((s) => s.exitTavern);
  const startGame = useTavernStore((s) => s.startGame);
  const gold = useMvuStore((s) => s.stat["Thông Tin Nhân Vật"]["Vàng"]);

  if (phase !== "result" || !activeGame) return null;

  // Xác định kết quả
  const result = activeGame === "kings-game"
    ? kingsState?.result
    : activeGame === "dragon-dice"
      ? diceState?.result
      : shellState?.result;

  const won = result === "win";
  const lost = result === "lose";
  const draw = result === "draw";

  const gameName = GAME_INFO[activeGame].name;
  const info = GAME_INFO[activeGame];
  const canPlayAgain = gold >= info.minBet;

  return (
    <div className="anim-in flex flex-col items-center gap-4 px-4 py-6">
      {/* Kết quả chính */}
      <div className={`rounded-xl border-2 px-8 py-5 text-center ${
        won ? "border-[rgba(125,165,131,0.5)] bg-[rgba(125,165,131,0.08)]" :
        lost ? "border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.08)]" :
        "border-[var(--glass-border-bright)] bg-[var(--glass-bg)]"
      }`}>
        <h3 className={`font-display text-2xl tracking-wider ${
          won ? "text-[var(--ok)]" : lost ? "text-[var(--danger)]" : "text-[var(--warn)]"
        }`}>
          {won ? "CHIẾN THẮNG" : lost ? "BẠI TRẬN" : "HOÀ"}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          {gameName}
        </p>
      </div>

      {/* Phần thưởng */}
      {won && reward && (
        <div className="glass w-full max-w-xs space-y-2 border-[var(--accent-border)] px-4 py-3">
          <div className="flex items-center gap-2 text-[13px]">
            <IconReward size={16} color="var(--accent-text)" />
            <span className="font-display tracking-wider text-[var(--accent-text)]">{t("ui.phan_thuong")}</span>
          </div>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-[var(--text-muted)]">{t("ui.vang_1")}</span>
            <span className="font-bold text-[var(--ok)]">+{reward.gold}</span>
          </div>
          {reward.item && (
            <div className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2">
              <span className="block text-[13px] font-medium text-[var(--accent-text)]">
                {reward.item.name}
              </span>
              <span className="block text-[11px] text-[var(--text-faint)]">
                {reward.item.desc}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Thua */}
      {lost && (
        <div className="glass w-full max-w-xs border-[rgba(176,106,95,0.35)] px-4 py-3 text-center">
          <span className="text-[14px] text-[var(--danger)]">-{bet}  {t("ui.vang_1")}</span>
          <p className="mt-1 text-[11px] text-[var(--text-faint)]">
            
                                  {t("ui.so_vang_da_bi_tru_khoi_tui_ngu")}
                                </p>
        </div>
      )}

      {/* Hoà */}
      {draw && (
        <p className="text-[13px] text-[var(--text-muted)]">
          
                            {t("ui.hoa_khong_mat_vang")}
                          </p>
      )}

      {/* Nút */}
      <div className="flex flex-wrap justify-center gap-2">
        {won ? (
          <button
            onClick={claimReward}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(125,165,131,0.5)] bg-[rgba(125,165,131,0.12)] px-5 py-2.5 text-[14px] font-medium text-[var(--ok)] transition-all hover:brightness-125 active:scale-[0.96]"
          >
            <IconReward size={16} />
            
                                  {t("ui.nhan_thuong")}
                                </button>
        ) : (
          <button
            onClick={exitTavern}
            className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-5 py-2.5 text-[14px] text-[var(--text-muted)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.96]"
          >
            
                                      {t("ui.dong_1")}
                                    </button>
        )}
        {canPlayAgain && (
          <button
            onClick={() => startGame(activeGame, bet)}
            className="rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-5 py-2.5 text-[14px] text-[var(--accent-text)] transition-all hover:brightness-125 active:scale-[0.96]"
          >
            
                                  {t("ui.choi_lai")}{bet}  {t("ui.vang_3")}
                                </button>
        )}
        <button
          onClick={() => { if (won) claimReward(); else exitTavern(); }}
          className="rounded-[var(--radius-md)] border border-transparent px-5 py-2.5 text-[14px] text-[var(--text-faint)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.96]"
        >
          
                            {t("ui.roi_quan")}
                          </button>
      </div>
    </div>
  );
}
