/**
 * ArmWrestleGame — UI "Vật Tay": nhấn nút nhanh nhất có thể trong 3 giây.
 * Thanh lực hiển thị realtime. Best of 3.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTavernStore } from "../../state/tavernStore";
import { IconArm } from "./TavernIcons";
import { useT } from "../../i18n";

const ROUND_DURATION = 3000; // 3 giây

function ForceBar({ force, maxForce, color, label }: { force: number; maxForce: number; color: string; label: string }) {
  const pct = Math.min(100, (force / maxForce) * 100);
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-faint)]">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{force}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.3)]">
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ArmWrestleGame() {
    const t = useT();
  const armState = useTavernStore((s) => s.armState);
  const startRound = useTavernStore((s) => s.startArmRound);
  const armTap = useTavernStore((s) => s.armTap);
  const finishRound = useTavernStore((s) => s.finishArmRound);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer cho round
  useEffect(() => {
    if (!armState?.roundActive) return;

    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, ROUND_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishRound();
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [armState?.roundActive, armState?.currentRound, finishRound]);

  const handleTap = useCallback(() => {
    armTap();
  }, [armTap]);

  if (!armState) return null;

  const { rounds, currentRound, currentForce, roundActive, phase } = armState;
  const isReady = phase === "ready";
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-[13px] text-[var(--accent-text)]">
        {isReady
          ? `Lượt ${currentRound + 1}/3 — Sẵn sàng?`
          : roundActive
            ? "Nhấn nhanh nhất có thể!"
            : "Ván đấu kết thúc"}
      </p>

      {/* Thanh lực (khi đang active) */}
      {roundActive && (
        <div className="w-full max-w-xs space-y-3">
          <ForceBar force={currentForce} maxForce={25} color="var(--ok)" label={t("ui.luc_nguoi")} />
          <div className="text-center">
            <span className="font-mono text-2xl font-bold text-[var(--accent-text)]">
              {(timeLeft / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/* Nút nhấn */}
      {roundActive && (
        <button
          onPointerDown={handleTap}
          className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] shadow-[0_0_24px_rgba(194,164,104,0.2)] transition-transform active:scale-90"
        >
          <IconArm size={36} />
        </button>
      )}

      {/* Nút bắt đầu */}
      {isReady && (
        <button
          onClick={startRound}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--accent-border)] bg-[var(--accent-soft)] px-6 py-3 text-[14px] font-medium text-[var(--accent-text)] transition-all hover:brightness-125 active:scale-[0.96]"
        >
          <IconArm size={18} />
          {currentRound === 0 ? "Bắt Đầu!" : "Lượt Tiếp!"}
        </button>
      )}

      {/* Kết quả từng round */}
      {rounds.length > 0 && (
        <div className="w-full max-w-xs space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.ket_qua")}
                                </span>
          {rounds.map((r, i) => {
            const won = r.winner === "player";
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-[12px] ${
                  won ? "border-[rgba(125,165,131,0.4)]" : "border-[rgba(176,106,95,0.4)]"
                }`}
              >
                <span className="text-[var(--text-faint)]">
                  
                                          {t("ui.luot")} {i + 1}: {r.playerForce} vs {r.aiForce}
                </span>
                <span className={won ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                  {won ? "Thắng" : r.winner === "draw" ? "Hoà" : "Thua"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
