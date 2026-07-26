/**
 * DragonDiceGame — UI "Xúc Xắc Rồng": tung 3 xúc xắc, so tổng, best of 3.
 * Animation CSS cho tung xúc xắc.
 */
import { useState } from "react";
import { useTavernStore } from "../../state/tavernStore";
import { IconDice } from "./TavernIcons";
import { useT } from "../../i18n";

function DiceDisplay({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--glass-border-bright)] bg-[linear-gradient(135deg,rgba(25,20,15,0.9),rgba(40,35,28,0.9))] text-2xl font-bold text-[var(--accent-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform ${
        rolling ? "animate-[dice-roll_0.4s_ease-out]" : ""
      }`}
    >
      {value}
    </div>
  );
}

function RoundRow({ round, index }: {
  round: import("../../minigame/dragonDice").DiceRound;
  index: number;
}) {
    const t = useT();
  const won = round.winner === "player";
  const lost = round.winner === "ai";
  return (
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${
      won ? "border-[rgba(125,165,131,0.4)]" : lost ? "border-[rgba(176,106,95,0.4)]" : "border-[var(--glass-border)]"
    }`}>
      <div className="text-[12px]">
        <span className="text-[var(--text-faint)]">{t("ui.luot")} {index + 1}: </span>
        <span className="font-medium text-[var(--text-soft)]">
          [{round.playerDice.join(", ")}] = {round.playerTotal}
        </span>
      </div>
      <span className={`text-[12px] font-medium ${won ? "text-[var(--ok)]" : lost ? "text-[var(--danger)]" : "text-[var(--warn)]"}`}>
        {won ? "Thắng" : lost ? "Thua" : "Hoà"}
      </span>
      <div className="text-right text-[12px]">
        <span className="text-[var(--text-faint)]">{t("ui.doi_thu")} </span>
        <span className="text-[var(--text-muted)]">
          [{round.aiDice.join(", ")}] = {round.aiTotal}
        </span>
      </div>
    </div>
  );
}

export function DragonDiceGame() {
    const t = useT();
  const diceState = useTavernStore((s) => s.diceState);
  const rollDice = useTavernStore((s) => s.rollDice);
  const [rolling, setRolling] = useState(false);

  if (!diceState) return null;

  const { rounds, currentRound, phase } = diceState;
  const isReady = phase === "ready";

  const handleRoll = () => {
    setRolling(true);
    // Delay nhỏ cho animation
    setTimeout(() => {
      rollDice();
      setRolling(false);
    }, 400);
  };

  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Xúc xắc hiện tại */}
      <div className="text-center">
        <p className="mb-3 text-[13px] text-[var(--accent-text)]">
          {isReady
            ? `Lượt ${currentRound + 1}/3 — Nhấn để tung xúc xắc!`
            : "Ván đấu đã kết thúc"}
        </p>

        {lastRound && !rolling && (
          <div className="mb-4 flex items-center justify-center gap-6">
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.nguoi_1")}</span>
              <div className="flex gap-2">
                {lastRound.playerDice.map((d, i) => (
                  <DiceDisplay key={i} value={d} rolling={false} />
                ))}
              </div>
              <span className="mt-1 block text-center text-[14px] font-bold text-[var(--text-soft)]">
                = {lastRound.playerTotal}
              </span>
            </div>
            <span className="text-[16px] font-bold text-[var(--text-faint)]">VS</span>
            <div>
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{t("ui.doi_thu_1")}</span>
              <div className="flex gap-2">
                {lastRound.aiDice.map((d, i) => (
                  <DiceDisplay key={i} value={d} rolling={false} />
                ))}
              </div>
              <span className="mt-1 block text-center text-[14px] font-bold text-[var(--text-muted)]">
                = {lastRound.aiTotal}
              </span>
            </div>
          </div>
        )}

        {rolling && (
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <DiceDisplay key={i} value={Math.ceil(Math.random() * 6)} rolling={true} />
            ))}
          </div>
        )}
      </div>

      {/* Nút tung */}
      {isReady && (
        <button
          onClick={handleRoll}
          disabled={rolling}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-6 py-3 text-[14px] font-medium text-[var(--accent-text)] transition-all hover:brightness-125 disabled:opacity-50 active:scale-[0.96]"
        >
          <IconDice size={18} />
          {rolling ? "Đang tung..." : "Tung Xúc Xắc"}
        </button>
      )}

      {/* Lịch sử */}
      {rounds.length > 0 && (
        <div className="w-full space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.ket_qua")}
                                </span>
          {rounds.map((r, i) => (
            <RoundRow key={i} round={r} index={i} />
          ))}
        </div>
      )}

      {/* CSS cho animation */}
      <style>{`
        @keyframes dice-roll {
          0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
