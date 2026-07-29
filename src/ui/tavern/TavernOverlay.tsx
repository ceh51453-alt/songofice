/**
 * TavernOverlay V2 — Container overlay cho 6 mini-game quán rượu.
 * Menu chọn trò + bet slider + routing giữa 6 game boards.
 */
import { useState } from "react";
import { useTavernStore } from "../../state/tavernStore";
import { useMvuStore } from "../../state/mvuStore";
import { GAME_INFO, COMPLEXITY_COLORS, type TavernGameType } from "../../minigame/tavernGameEngine";
import { KingsGameBoard } from "./KingsGameBoard";
import { DragonDiceGame } from "./DragonDiceGame";
import { ShellGameBoard } from "./ShellGameBoard";
import { ArmWrestleGame } from "./ArmWrestleGame";
import { LiarsDiceGame } from "./LiarsDiceGame";
import { CoinFlipGame } from "./CoinFlipGame";
import { GameResultOverlay } from "./GameResultOverlay";
import { IconCards, IconDice, IconCup, IconTavern, IconArm, IconLiar, IconCoin } from "./TavernIcons";
import { IconX } from "../icons";
import { useT } from "../../i18n";
import { formatCurrencyShort } from "../../economy/currency";

const GAME_ICONS: Record<TavernGameType, React.ReactNode> = {
  "kings-game": <IconCards size={20} />,
  "dragon-dice": <IconDice size={20} />,
  "shell-game": <IconCup size={20} />,
  "arm-wrestle": <IconArm size={20} />,
  "liars-dice": <IconLiar size={20} />,
  "coin-flip": <IconCoin size={20} />,
};

function GameMenu() {
    const t = useT();
  const startGame = useTavernStore((s) => s.startGame);
  const opponent = useTavernStore((s) => s.opponent);
  const tavernName = useTavernStore((s) => s.tavernName);
  const gold = useMvuStore((s) => s.stat["Thông Tin Nhân Vật"]["Ngân Khố"]);
  const history = useTavernStore((s) => s.history);
  const [selectedGame, setSelectedGame] = useState<TavernGameType | null>(null);
  const [betAmount, setBetAmount] = useState(0);

  const handleSelectGame = (type: TavernGameType) => {
    setSelectedGame(type);
    setBetAmount(GAME_INFO[type].defaultBet);
  };

  const handleStart = () => {
    if (!selectedGame) return;
    startGame(selectedGame, betAmount);
  };

  const selectedInfo = selectedGame ? GAME_INFO[selectedGame] : null;

  // Stats nhanh
  const totalGames = history.length;
  const totalWins = history.filter((h) => h.result === "win").length;

  return (
    <div className="flex flex-col gap-5 px-1">
      {/* Header */}
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <IconTavern size={20} color="var(--accent-text)" />
          <h3 className="font-display text-lg tracking-wider text-[var(--accent-text)]">
            {tavernName}
          </h3>
        </div>
        <p className="text-[12px] text-[var(--text-faint)]">
          
                            {t("ui.doi_thu")} <span className="text-[var(--text-soft)]">{opponent}</span>
          <span className="mx-2">·</span>
          
                            {t("ui.vang_4")} <span className="text-[var(--accent-text)]">{gold}</span>
          {totalGames > 0 && (
            <>
              <span className="mx-2">·</span>
              
                                        {t("ui.thang")} <span className="text-[var(--ok)]">{totalWins}/{totalGames}</span>
            </>
          )}
        </p>
      </div>

      {/* Grid trò chơi */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
          
                            {t("ui.chon_tro_choi")}{Object.keys(GAME_INFO).length}  {t("ui.tro")}
                          </span>
        {(Object.keys(GAME_INFO) as TavernGameType[]).map((type) => {
          const info = GAME_INFO[type];
          const isSelected = selectedGame === type;
          const canAfford = gold >= info.minBet;
          return (
            <button
              key={type}
              disabled={!canAfford}
              onClick={() => handleSelectGame(type)}
              className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
                  : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-bg-hover)]"
              } disabled:opacity-40`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                isSelected ? "border-[var(--accent-border)] text-[var(--accent-text)]" : "border-[var(--glass-border)] text-[var(--text-muted)]"
              }`}>
                {GAME_ICONS[type]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-medium ${isSelected ? "text-[var(--accent-text)]" : "text-[var(--text-soft)]"}`}>
                    {info.name}
                  </span>
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase"
                    style={{ color: COMPLEXITY_COLORS[info.complexity], background: `${COMPLEXITY_COLORS[info.complexity]}15` }}
                  >
                    {info.complexity === "easy" ? "Dễ" : info.complexity === "medium" ? "Vừa" : "Khó"}
                  </span>
                  <span className="text-[9px] text-[var(--text-faint)]">
                    {info.mechanic}
                  </span>
                </div>
                <span className="block text-[11.5px] text-[var(--text-faint)]">
                  {info.desc}
                </span>
              </div>
              <span className="shrink-0 text-[11px] text-[var(--text-faint)]">
                {info.minBet}-{info.maxBet}
              </span>
            </button>
          );
        })}
      </div>

      {/* Đặt cược */}
      {selectedInfo && (
        <div className="glass border-[var(--accent-border)] px-4 py-3">
          <label className="mb-2 block text-[12px] font-medium text-[var(--text-faint)]">
            
                                  {t("ui.dat_cuoc_vang")}
                                </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={selectedInfo.minBet}
              max={Math.min(selectedInfo.maxBet, gold)}
              step={5}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="h-1.5 flex-1 appearance-none rounded-full bg-[var(--glass-border)] accent-[var(--accent-text)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-text)]"
            />
            <span className="w-14 text-right font-mono text-[16px] font-bold text-[var(--accent-text)]">
              {betAmount}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-[var(--text-faint)]">
            <span>{t("ui.toi_thieu")} {selectedInfo.minBet}</span>
            <span>{t("ui.toi_da")} {Math.min(selectedInfo.maxBet, gold)}</span>
          </div>
        </div>
      )}

      {/* Nút bắt đầu */}
      {selectedGame && (
        <button
          onClick={handleStart}
          disabled={betAmount < (selectedInfo?.minBet ?? 0)}
          className="mx-auto flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-8 py-3 text-[15px] font-medium text-[var(--accent-text)] transition-all hover:brightness-125 disabled:opacity-40 active:scale-[0.96]"
        >
          {GAME_ICONS[selectedGame]}
          
                            {t("ui.bat_dau")}{betAmount}  {t("ui.vang_3")}
                          </button>
      )}
    </div>
  );
}

export function TavernOverlay() {
    const t = useT();
  const phase = useTavernStore((s) => s.phase);
  const activeGame = useTavernStore((s) => s.activeGame);
  const exitTavern = useTavernStore((s) => s.exitTavern);
  const bet = useTavernStore((s) => s.bet);

  if (phase === "idle") return null;

  const gameName = activeGame ? GAME_INFO[activeGame].name : "";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch" role="dialog" aria-modal="true" aria-label="Mini-Game Quán Rượu">
      <div
        className="absolute inset-0 bg-[rgba(5,7,10,0.7)] backdrop-blur-[4px]"
        onClick={() => { if (phase === "menu" || phase === "result") exitTavern(); }}
      />

      <div className="glass-strong anim-in relative mx-auto my-4 flex w-full max-w-lg flex-col overflow-hidden sm:my-8 sm:rounded-xl max-sm:rounded-none max-sm:border-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            {activeGame ? GAME_ICONS[activeGame] : <IconTavern size={18} color="var(--accent-text)" />}
            <h2 className="font-display text-[15px] tracking-wider text-[var(--text-soft)]">
              {phase === "menu" ? "Chọn Trò Chơi" : gameName}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {phase === "playing" && (
              <span className="text-[11px] text-[var(--text-faint)]">
                
                                              {t("ui.cuoc")} <span className="text-[var(--accent-text)]">{formatCurrencyShort(bet)}</span>
              </span>
            )}
            <button
              onClick={exitTavern}
              aria-label="Đóng"
              className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {phase === "menu" && <GameMenu />}
          {phase === "playing" && activeGame === "kings-game" && <KingsGameBoard />}
          {phase === "playing" && activeGame === "dragon-dice" && <DragonDiceGame />}
          {phase === "playing" && activeGame === "shell-game" && <ShellGameBoard />}
          {phase === "playing" && activeGame === "arm-wrestle" && <ArmWrestleGame />}
          {phase === "playing" && activeGame === "liars-dice" && <LiarsDiceGame />}
          {phase === "playing" && activeGame === "coin-flip" && <CoinFlipGame />}
          {phase === "result" && <GameResultOverlay />}
        </div>
      </div>
    </div>
  );
}
