import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] px-3 py-2 text-sm text-[var(--text-soft)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-border)] focus:outline-none transition-colors";

export function GlassInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${baseClass} ${className}`} />;
}

export function GlassTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${baseClass} resize-none ${className}`} />;
}
