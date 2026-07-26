/**
 * LiarsDiceGame — UI "Xúc Xắc Nói Dối":
 * Hiển thị xúc xắc người chơi, bid của AI, nút Challenge / Accept.
 */
import { useTavernStore } from "../../state/tavernStore";
import { IconLiar, IconDice } from "./TavernIcons";
import { useT } from "../../i18n";

function DiceRow({ dice, hidden = false, label }: { dice: number[]; hidden?: boolean; label: string }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{label}</span>
      <div className="flex gap-2">
        {dice.map((d, i) => (
          <div
            key={i}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--glass-border-bright)] bg-[rgba(20,17,14,0.85)] text-lg font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{ color: hidden ? "var(--text-faint)" : "var(--text-soft)" }}
          >
            {hidden ? "?" : d}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiarsDiceGame() {
    const t = useT();
  const liarsState = useTavernStore((s) => s.liarsState);
  const liarsAction = useTavernStore((s) => s.liarsAction);

  if (!liarsState) return null;

  const { rounds, currentRound, playerDice, currentBid, aiDice, phase } = liarsState;
  const isBidding = phase === "bidding";
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-[13px] text-[var(--accent-text)]">
        {isBidding
          ? `Lượt ${currentRound + 1}/3 — Đối thủ đặt cược...`
          : "Ván đấu kết thúc"}
      </p>

      {/* Xúc xắc người chơi */}
      {isBidding && (
        <div className="space-y-4">
          <DiceRow dice={playerDice} label={t("ui.xuc_xac_cua_nguoi")} />
          <DiceRow dice={aiDice} hidden label={t("ui.xuc_xac_doi_thu")} />
        </div>
      )}

      {/* AI Bid */}
      {isBidding && currentBid && (
        <div className="glass w-full max-w-xs border-[var(--accent-border)] px-4 py-3 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-[12px] text-[var(--text-faint)]">
            <IconLiar size={14} />
            <span>{t("ui.doi_thu_tuyen_bo")}</span>
          </div>
          <p className="font-display text-lg text-[var(--accent-text)]">
            
                                  {t("ui.co_it_nhat")} <span className="text-[var(--text-soft)]">{currentBid.count}</span>  {t("ui.con_mat")} <span className="text-[var(--text-soft)]">{currentBid.face}</span>"
          </p>
          <p className="mt-2 text-[11px] text-[var(--text-faint)]">
            
                                  {t("ui.trong_tong_10_xuc_xac_5_cua_ng")}
                                </p>
        </div>
      )}

      {/* Nút hành động */}
      {isBidding && (
        <div className="flex gap-3">
          <button
            onClick={() => liarsAction("challenge")}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(176,106,95,0.5)] bg-[rgba(176,106,95,0.1)] px-5 py-2.5 text-[14px] font-medium text-[var(--danger)] transition-all hover:brightness-125 active:scale-[0.96]"
          >
            
                                  {t("ui.noi_doi")}
                                </button>
          <button
            onClick={() => liarsAction("accept")}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgba(125,165,131,0.5)] bg-[rgba(125,165,131,0.1)] px-5 py-2.5 text-[14px] font-medium text-[var(--ok)] transition-all hover:brightness-125 active:scale-[0.96]"
          >
            TIN!
          </button>
        </div>
      )}

      {/* Lịch sử */}
      {rounds.length > 0 && (
        <div className="w-full space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-faint)]">
            
                                  {t("ui.lich_su")}
                                </span>
          {rounds.map((r, i) => {
            const won = r.winner === "player";
            return (
              <div
                key={i}
                className={`rounded-md border px-3 py-2 text-[12px] ${
                  won ? "border-[rgba(125,165,131,0.4)]" : "border-[rgba(176,106,95,0.4)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-faint)]">
                    
                                                {t("ui.luot")} {i + 1}: "{r.aiBid.count}  {t("ui.con_mat")} {r.aiBid.face}"
                  </span>
                  <span className={won ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                    {won ? "Thắng" : "Thua"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[var(--text-faint)]">
                  {r.playerAction === "challenge" ? "Ngươi gọi DỐI" : "Ngươi TIN"}  {t("ui.thuc_te")} {r.actualCount}  {t("ui.con_mat")} {r.aiBid.face} — 
                  {r.wasLying ? "Hắn NÓI DỐI" : "Hắn NÓI THẬT"}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--text-faint)]">
                  
                                          {t("ui.nguoi_2")}{r.playerDice.join(",")}{t("ui.han")}{r.aiDice.join(",")}]
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
