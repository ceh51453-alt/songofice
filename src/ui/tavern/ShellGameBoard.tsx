/**
 * ShellGameBoard — UI "Đoán Cốc": 3 cốc rượu, click chọn, reveal kết quả.
 * Animation tung lên/xuống khi chọn.
 */
import { useState, useEffect } from "react";
import { useTavernStore } from "../../state/tavernStore";
import { IconCup } from "./TavernIcons";
import { useT } from "../../i18n";

function Cup({
  index,
  onClick,
  disabled,
  revealed,
  isHidden,
  isCorrect,
}: {
  index: number;
  onClick: () => void;
  disabled: boolean;
  revealed: boolean;
  isHidden: boolean;
  isCorrect: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex h-28 w-24 flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 active:scale-[0.94] ${
        revealed
          ? isCorrect
            ? "border-[rgba(125,165,131,0.6)] bg-[rgba(125,165,131,0.1)]"
            : isHidden
              ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
              : "border-[rgba(176,106,95,0.4)] bg-[rgba(176,106,95,0.05)]"
          : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--accent-border)] hover:bg-[var(--glass-bg-hover)] hover:shadow-[0_0_16px_rgba(194,164,104,0.12)]"
      } disabled:opacity-50`}
    >
      <IconCup
        size={32}
        color={
          revealed
            ? isCorrect
              ? "var(--ok)"
              : isHidden
                ? "var(--accent-text)"
                : "var(--text-faint)"
            : "var(--text-muted)"
        }
        className={`transition-transform duration-300 ${
          revealed && (isCorrect || isHidden) ? "translate-y-[-8px]" : ""
        } ${!revealed && !disabled ? "group-hover:translate-y-[-4px]" : ""}`}
      />
      {revealed && isHidden && (
        <div className="mt-1 animate-[fade-in_0.3s_ease-out]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-text)" stroke="none">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </div>
      )}
      <span className="mt-2 text-[12px] font-medium text-[var(--text-faint)]">
        {revealed
          ? isCorrect
            ? "Đúng!"
            : isHidden
              ? "Ở đây!"
              : "Sai"
          : `Cốc ${index + 1}`}
      </span>
    </button>
  );
}

export function ShellGameBoard() {
    const t = useT();
  const shellState = useTavernStore((s) => s.shellState);
  const pickCup = useTavernStore((s) => s.pickCup);
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const [showingReveal, setShowingReveal] = useState(false);

  // Reset reveal khi round mới
  useEffect(() => {
    if (shellState && !showingReveal) {
      setRevealIndex(null);
    }
  }, [shellState?.currentRound, showingReveal]);

  if (!shellState) return null;

  const { rounds, currentRound, phase, currentHidden } = shellState;
  const isPicking = phase === "picking" && !showingReveal;
  const correctCount = rounds.filter((r) => r.correct).length;

  const handlePick = (cupIndex: number) => {
    if (!isPicking) return;
    setRevealIndex(cupIndex);
    setShowingReveal(true);

    // Hiển thị kết quả 1.5s rồi chuyển lượt
    setTimeout(() => {
      pickCup(cupIndex);
      setShowingReveal(false);
      setRevealIndex(null);
    }, 1500);
  };

  const isRevealed = showingReveal && revealIndex !== null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Trạng thái */}
      <div className="text-center">
        <p className="mb-1 text-[13px] text-[var(--accent-text)]">
          {phase === "done"
            ? "Ván đấu kết thúc!"
            : showingReveal
              ? revealIndex === currentHidden
                ? "Chính xác!"
                : "Sai rồi!"
              : `Lượt ${currentRound + 1}/3 — Chọn cốc chứa vật phẩm!`}
        </p>
        <p className="text-[11px] text-[var(--text-faint)]">
          
                            {t("ui.doan_dung")} {correctCount}/{rounds.length}  {t("ui.can_2_3")}
                          </p>
      </div>

      {/* 3 cốc */}
      {phase !== "done" && (
        <div className="flex items-center gap-4">
          {[0, 1, 2].map((i) => (
            <Cup
              key={i}
              index={i}
              onClick={() => handlePick(i)}
              disabled={!isPicking}
              revealed={isRevealed}
              isHidden={isRevealed && i === currentHidden}
              isCorrect={isRevealed && i === revealIndex && revealIndex === currentHidden}
            />
          ))}
        </div>
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
                
                                      {t("ui.luot")} {i + 1}{t("ui.chon_coc")} {r.playerPick + 1}{t("ui.vat_o_coc")} {r.hiddenCup + 1}
              </span>
              <span className={r.correct ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                {r.correct ? "Đúng" : "Sai"}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
