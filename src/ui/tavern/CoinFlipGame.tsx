/**
 * CoinFlipGame — UI "Đồng Xu Vận Mệnh":
 * 5 vòng đoán xu với độ khó tăng dần và multiplier gấp đôi.
 * Cash-out mechanic cho risk/reward.
 */
import { useState } from "react";
import { useTavernStore } from "../../state/tavernStore";
// import { IconCoin } from "./TavernIcons";
import type { CoinSide } from "../../minigame/coinFlip";
import { useT } from "../../i18n";

const ROUND_LABELS = [
  "Đoán 1 xu",
  "Đoán 1 xu",
  "Đoán 2 xu liên tiếp",
  "Đoán 3 xu liên tiếp",
  "Đoán tổng Sấp trong 5 xu",
];

const MULTIPLIERS = ["x1", "x1", "x2", "x4", "x8"];

function CoinDisplay({ side, animate = false }: { side: CoinSide | null; animate?: boolean }) {
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-[13px] font-bold ${
      side === "heads"
        ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
        : side === "tails"
          ? "border-[var(--glass-border-bright)] bg-[rgba(0,0,0,0.3)] text-[var(--text-muted)]"
          : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-faint)]"
    } ${animate ? "animate-[coin-spin_0.5s_ease-out]" : ""}`}>
      {side === "heads" ? "S" : side === "tails" ? "N" : "?"}
    </div>
  );
}

export function CoinFlipGame() {
    const t = useT();
  const coinState = useTavernStore((s) => s.coinState);
  const coinGuess = useTavernStore((s) => s.coinGuess);
  const coinCashOut = useTavernStore((s) => s.coinCashOut);
  const bet = useTavernStore((s) => s.bet);
  const [multiGuess, setMultiGuess] = useState<CoinSide[]>([]);

  if (!coinState) return null;

  const { rounds, currentRound, currentMultiplier, phase, roundType } = coinState;
  const isGuessing = phase === "guessing";
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const potentialWin = Math.round(bet * 1.5 * currentMultiplier);

  const handleSingleGuess = (side: CoinSide) => {
    coinGuess(side);
  };

  const handleMultiGuess = (side: CoinSide) => {
    const needed = roundType === "double" ? 2 : 3;
    const newGuess = [...multiGuess, side];
    setMultiGuess(newGuess);
    if (newGuess.length >= needed) {
      coinGuess(newGuess);
      setMultiGuess([]);
    }
  };

  const handleCountGuess = (count: number) => {
    coinGuess(count);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Trạng thái */}
      <div className="text-center">
        <p className="mb-1 text-[13px] text-[var(--accent-text)]">
          {isGuessing
            ? `Vòng ${currentRound + 1}/5 — ${ROUND_LABELS[currentRound]}`
            : "Ván đấu kết thúc"}
        </p>
        {isGuessing && (
          <div className="flex items-center justify-center gap-4 text-[12px]">
            <span className="text-[var(--text-faint)]">
              
                                        {t("ui.he_so")} <span className="font-bold text-[var(--accent-text)]">{MULTIPLIERS[currentRound]}</span>
            </span>
            <span className="text-[var(--text-faint)]">
              
                                        {t("ui.thuong_hien_tai")} <span className="font-bold text-[var(--ok)]">{potentialWin}  {t("ui.vang_1")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Kết quả lượt trước */}
      {lastRound && (
        <div className="flex items-center gap-2">
          {lastRound.actual.map((side, i) => (
            <CoinDisplay key={i} side={side} animate />
          ))}
          <span className={`ml-2 text-[13px] font-medium ${lastRound.correct ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
            {lastRound.correct ? "Chính xác!" : "Sai rồi!"}
          </span>
        </div>
      )}

      {/* Input đoán */}
      {isGuessing && roundType === "single" && (
        <div className="flex gap-4">
          <button
            onClick={() => handleSingleGuess("heads")}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] transition-all hover:brightness-125 active:scale-[0.94]"
          >
            <span className="text-lg font-bold">S</span>
            <span className="text-[10px]">{t("ui.sap")}</span>
          </button>
          <button
            onClick={() => handleSingleGuess("tails")}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-[var(--glass-border-bright)] bg-[var(--glass-bg)] text-[var(--text-soft)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.94]"
          >
            <span className="text-lg font-bold">N</span>
            <span className="text-[10px]">{t("ui.ngua")}</span>
          </button>
        </div>
      )}

      {isGuessing && (roundType === "double" || roundType === "triple") && (
        <div>
          <p className="mb-2 text-center text-[11px] text-[var(--text-faint)]">
            
                                  {t("ui.chon_lan_luot")}{multiGuess.length}/{roundType === "double" ? 2 : 3}):
            {multiGuess.map((s, i) => (
              <span key={i} className="ml-1 text-[var(--accent-text)]">{s === "heads" ? "S" : "N"}</span>
            ))}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleMultiGuess("heads")}
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] transition-all hover:brightness-125 active:scale-[0.94]"
            >
              S
            </button>
            <button
              onClick={() => handleMultiGuess("tails")}
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[var(--glass-border-bright)] bg-[var(--glass-bg)] text-[var(--text-soft)] transition-all hover:bg-[var(--glass-bg-hover)] active:scale-[0.94]"
            >
              N
            </button>
          </div>
        </div>
      )}

      {isGuessing && roundType === "count" && (
        <div>
          <p className="mb-2 text-center text-[11px] text-[var(--text-faint)]">
            
                                  {t("ui.doan_co_bao_nhieu_con_sap_tron")}
                                </p>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => handleCountGuess(n)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[14px] font-bold text-[var(--text-soft)] transition-all hover:border-[var(--accent-border)] hover:bg-[var(--glass-bg-hover)] active:scale-[0.94]"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cash out */}
      {isGuessing && currentRound > 0 && (
        <button
          onClick={coinCashOut}
          className="rounded-[var(--radius-md)] border border-[rgba(125,165,131,0.5)] bg-[rgba(125,165,131,0.08)] px-5 py-2 text-[13px] text-[var(--ok)] transition-all hover:brightness-125 active:scale-[0.96]"
        >
          
                            {t("ui.dung_som_nhan")} {potentialWin}  {t("ui.vang_1")}
                          </button>
      )}

      {/* Lịch sử */}
      {rounds.length > 0 && (
        <div className="w-full space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.lich_su")}
                                </span>
          {rounds.map((r, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-[12px] ${
                r.correct ? "border-[rgba(125,165,131,0.4)]" : "border-[rgba(176,106,95,0.4)]"
              }`}
            >
              <span className="text-[var(--text-faint)]">
                
                                      {t("ui.vong")} {i + 1} ({MULTIPLIERS[i]}): [{r.actual.map((a) => a === "heads" ? "S" : "N").join(",")}]
              </span>
              <span className={r.correct ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                {r.correct ? "Đúng" : "Sai"}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes coin-spin {
          0% { transform: rotateY(0deg) scale(0.8); }
          50% { transform: rotateY(180deg) scale(1.1); }
          100% { transform: rotateY(360deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
