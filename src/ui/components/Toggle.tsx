interface Props {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: Props) {
  return (
    <label
      className={`flex items-center justify-between gap-3 text-[13px] text-[var(--text-muted)] ${disabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
            checked ? "left-[calc(100%-1.1rem)] bg-[var(--accent-text)]" : "left-1 bg-[var(--text-faint)]"
          }`}
        />
      </button>
    </label>
  );
}
