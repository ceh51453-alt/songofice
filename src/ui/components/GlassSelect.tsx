import type { SelectHTMLAttributes } from "react";
import { IconChevronDown } from "../icons";

export function GlassSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <div className={`relative ${className}`}>
      <select
        {...rest}
        className="w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] px-3 py-2 pr-8 text-sm text-[var(--text-soft)] focus:border-[var(--accent-border)] focus:outline-none [&>option]:bg-[#141821] [&>option]:text-[var(--text-soft)]"
      >
        {children}
      </select>
      <IconChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
      />
    </div>
  );
}
