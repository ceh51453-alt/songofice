/**
 * Số nhảy có animation (6.4): count-up/down lướt + flash màu
 * (xanh khi tăng, đỏ khi giảm) — không đổi cụp một cái.
 */
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, durationMs = 500 }: { value: number; durationMs?: number }) {
  const safeValue = value ?? 0;
  const [shown, setShown] = useState(safeValue);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(safeValue);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prevRef.current;
    if (from === safeValue) return;
    prevRef.current = safeValue;
    setFlash(safeValue > from ? "up" : "down");

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(from + (safeValue - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setTimeout(() => setFlash(null), 400);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [safeValue, durationMs]);

  return (
    <span
      className="transition-colors duration-300"
      style={{ color: flash === "up" ? "var(--ok)" : flash === "down" ? "var(--danger)" : undefined }}
    >
      {(shown ?? 0).toLocaleString("vi-VN")}
    </span>
  );
}
