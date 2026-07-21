/**
 * CodexIcons — SVG icons cho Codex panel: sổ sách, cuộn giấy, khiên, mặt nạ, chìa khóa.
 * Không dùng emoji (ANTI-EMOJI POLICY).
 */
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Sổ sách (Codex / Nhân Vật). */
export function IconCodex({ size = 18, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h4" />
    </svg>
  );
}

/** Cuộn giấy (Biên Niên Sử / Timeline). */
export function IconScroll({ size = 18, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M12 7h4" />
      <path d="M12 11h4" />
    </svg>
  );
}

/** Lá chắn (Thế Lực / Houses). */
export function IconShield({ size = 18, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/** Mặt nạ (Âm Mưu / Việc Dở Dang). */
export function IconMask({ size = 18, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3C7 3 3 7 3 12h18c0-5-4-9-9-9z" />
      <circle cx="9" cy="10" r="1" fill={color} />
      <circle cx="15" cy="10" r="1" fill={color} />
      <path d="M9 15c1.5 1 4.5 1 6 0" />
    </svg>
  );
}

/** Chìa khóa (Bí Mật). */
export function IconKey({ size = 18, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="15" r="5" />
      <path d="M11.6 11.4L17 6" />
      <path d="M17 6h4" />
      <path d="M17 6v4" />
    </svg>
  );
}
