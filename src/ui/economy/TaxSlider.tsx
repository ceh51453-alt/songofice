/**
 * TaxSlider (15.3) — slider 5 bậc rời rạc cho mức thuế.
 * Kéo tới đâu preview tức thì (Vàng/turn, Δ Trung Thành).
 * Cảnh báo đỏ vùng "Nặng" / "Vắt Kiệt" (risk nổi loạn).
 */
import { useState, useCallback } from "react";
import { TAX_LEVELS, type TaxLevel } from "../../mvu/schema";
import { TAX_TABLE, taxPreview } from "../../economy/economyEngine";
import { useMvuStore } from "../../state/mvuStore";
import { IconTax } from "./EconomyIcons";

interface TaxSliderProps {
  currentLevel: TaxLevel;
  onChangeLevel: (level: TaxLevel) => void;
  disabled?: boolean;
}

const LEVELS = [...TAX_LEVELS];
const LEVEL_LABELS: Record<TaxLevel, string> = {
  "Miễn Thuế": "Miễn",
  "Nhẹ": "Nhẹ",
  "Vừa": "Vừa",
  "Nặng": "Nặng",
  "Vắt Kiệt": "Vắt",
};

const dangerLevels = new Set<TaxLevel>(["Nặng", "Vắt Kiệt"]);

export function TaxSlider({ currentLevel, onChangeLevel, disabled }: TaxSliderProps) {
  const stat = useMvuStore((s) => s.stat);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const currentIdx = LEVELS.indexOf(currentLevel);
  const previewIdx = hoveredIdx ?? currentIdx;
  const previewLevel = LEVELS[previewIdx];
  const preview = taxPreview(stat, previewLevel);
  const effect = TAX_TABLE[previewLevel];
  const isDanger = dangerLevels.has(previewLevel);

  const handleClick = useCallback((idx: number) => {
    onChangeLevel(LEVELS[idx]);
  }, [onChangeLevel]);

  return (
    <div className="glass-panel space-y-3 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <IconTax size={16} color="var(--accent-text)" />
        <span className="text-[13px] font-medium tracking-wide text-[var(--text-soft)]">
          Chính sách thuế
        </span>
      </div>

      {/* 5-step discrete slider */}
      <div className="flex items-end gap-1">
        {LEVELS.map((level, idx) => {
          const isActive = idx === currentIdx;
          const isHovered = idx === previewIdx && hoveredIdx !== null;
          const danger = dangerLevels.has(level);

          return (
            <button
              key={level}
              className={`
                relative flex-1 rounded-md py-2 text-center text-[11px] font-medium
                transition-all duration-200
                ${isActive
                  ? danger
                    ? "bg-[var(--danger)] text-white shadow-sm shadow-[var(--danger)]"
                    : "bg-[var(--accent-soft)] text-[var(--accent-text)] shadow-sm"
                  : isHovered
                    ? "bg-[var(--glass-bg-hover)] text-[var(--text-soft)]"
                    : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onClick={() => { if (!disabled) handleClick(idx); }}
              onMouseEnter={() => { if (!disabled) setHoveredIdx(idx); }}
              onMouseLeave={() => { if (!disabled) setHoveredIdx(null); }}
              disabled={disabled}
              title={level}
            >
              {LEVEL_LABELS[level]}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />
              )}
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className={`
        flex items-center justify-between rounded-lg px-3 py-2 text-[12px]
        transition-colors duration-200
        ${isDanger
          ? "bg-[rgba(248,113,113,0.08)] text-[var(--danger)]"
          : "bg-[var(--glass-bg)] text-[var(--text-muted)]"
        }
      `}>
        <span>
          Vàng/tháng: <b className="font-mono">{preview.goldPerMonth >= 0 ? "+" : ""}{preview.goldPerMonth}</b>
        </span>
        <span>
          Trung Thành: <b className={`font-mono ${effect.loyaltyPerMonth < 0 ? "text-[var(--danger)]" : effect.loyaltyPerMonth > 0 ? "text-[var(--ok)]" : ""}`}>
            {effect.loyaltyPerMonth >= 0 ? "+" : ""}{effect.loyaltyPerMonth}/tháng
          </b>
        </span>
      </div>

      {/* Warning */}
      {isDanger && (
        <p className="text-[11px] leading-relaxed text-[var(--danger)]" style={{ opacity: 0.85 }}>
          Mức thuế này dễ gây nổi loạn tại lãnh địa có Trung Thành thấp.
        </p>
      )}
    </div>
  );
}
