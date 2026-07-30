/**
 * Toast tinh gọn góc màn hình (6.4): sự kiện lan toả từ MVU (chuyển bậc quan hệ,
 * thời gian trôi, sang năm mới) — gom nhóm, tự tắt, không spam.
 */
import { useEffect, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import type { EffectEvent } from "../../mvu/effects";
import { IconCalendar, IconMap, IconUsers, IconShield } from "../icons";

interface ToastItem {
  id: number;
  event: EffectEvent;
}

let toastId = 0;

export function Toasts() {
  const pending = useMvuStore((s) => s.pendingEvents);
  const clearEvents = useMvuStore((s) => s.clearEvents);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (pending.length === 0) return;
    const items = pending.map((event) => ({ id: ++toastId, event }));
    setToasts((cur) => [...cur, ...items].slice(-5));
    clearEvents();
    for (const item of items) {
      setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== item.id)), 4500);
    }
  }, [pending, clearEvents]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-14 z-40 flex w-72 max-w-[85vw] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-strong anim-in flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] ${
            t.event.kind === "stage_down" || t.event.kind === "territory_lost"
              ? "border-[rgba(176,106,95,0.4)]"
              : t.event.kind === "stage_up" || t.event.kind === "territory"
                ? "border-[rgba(125,165,131,0.4)]"
                : ""
          }`}
        >
          {t.event.kind === "stage_up" || t.event.kind === "stage_down" ? (
            <IconUsers size={15} color={t.event.kind === "stage_up" ? "var(--ok)" : "var(--danger)"} />
          ) : t.event.kind === "military" ? (
            <IconShield size={15} color="var(--accent-text)" />
          ) : t.event.kind === "territory" || t.event.kind === "territory_lost" ? (
            <IconMap size={15} color={t.event.kind === "territory" ? "var(--ok)" : "var(--danger)"} />
          ) : (
            <IconCalendar size={15} color="var(--accent-text)" />
          )}
          <span className="text-[var(--text-soft)]">{t.event.text}</span>
        </div>
      ))}
    </div>
  );
}
