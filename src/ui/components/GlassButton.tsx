import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "danger" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
}

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  default:
    "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-soft)]",
  accent:
    "bg-[var(--accent-soft)] border-[var(--accent-border)] hover:brightness-125 text-[var(--accent-text)]",
  danger: "bg-[var(--danger-soft)] border-[rgba(176,106,95,0.4)] hover:brightness-125 text-[var(--danger)]",
  ghost: "bg-transparent border-transparent hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)]",
};

export function GlassButton({ variant = "default", size = "md", className = "", children, ...rest }: Props) {
  const sizeClass = size === "sm" ? "px-2.5 py-1.5 text-[13px] gap-1.5" : "px-3.5 py-2 text-sm gap-2";
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] border font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none ${sizeClass} ${variantClass[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
