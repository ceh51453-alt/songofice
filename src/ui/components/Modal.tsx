/**
 * Modal/Drawer kính mờ tự viết (headless, mục 1): focus trap cơ bản,
 * ESC đóng, click nền đóng. Mobile: full-screen; desktop: hộp giữa màn.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "../icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** max-width desktop, vd "max-w-2xl". */
  widthClass?: string;
}

export function Modal({ open, onClose, title, children, widthClass = "max-w-2xl" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    el?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && el) {
        // focus trap đơn giản
        const focusables = el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.55)] backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={ref}
        className={`glass-strong anim-in relative flex w-full flex-col overflow-hidden sm:h-auto sm:max-h-[88vh] ${widthClass} max-sm:rounded-none max-sm:border-0`}
      >
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3.5">
          <h2 className="font-display text-lg tracking-wide text-[var(--text-soft)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
