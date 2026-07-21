/**
 * Trường tham số model (mục 2.2): slider + ô số đồng bộ hai chiều +
 * nút reset về mặc định + tooltip giải thích ngắn (hover/focus label).
 */
import { IconRefresh } from "../icons";

interface Props {
  label: string;
  tooltip?: string;
  value: number | undefined;
  min: number;
  max: number;
  step: number;
  defaultValue: number | undefined;
  /** undefined = "không gửi tham số này". */
  onChange: (v: number | undefined) => void;
  resetLabel: string;
}

export function SliderField({ label, tooltip, value, min, max, step, defaultValue, onChange, resetLabel }: Props) {
  const current = value ?? defaultValue ?? min;
  const fillPct = ((current - min) / (max - min)) * 100;

  return (
    <div className="space-y-1" title={tooltip}>
      <div className="flex items-center justify-between gap-2">
        <label className="cursor-help text-[13px] text-[var(--text-muted)]">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value ?? ""}
            placeholder={defaultValue !== undefined ? String(defaultValue) : "—"}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            className="w-20 rounded-md border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] px-2 py-1 text-right text-[13px] text-[var(--text-soft)] focus:border-[var(--accent-border)] focus:outline-none"
          />
          <button
            onClick={() => onChange(defaultValue)}
            title={resetLabel}
            aria-label={`${resetLabel}: ${label}`}
            className="rounded p-1 text-[var(--text-faint)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
          >
            <IconRefresh size={13} />
          </button>
        </div>
      </div>
      <input
        type="range"
        className="w-full"
        style={{ ["--fill" as string]: `${fillPct}%` }}
        value={current}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
