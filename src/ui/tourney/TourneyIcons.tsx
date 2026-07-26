/**
 * TourneyIcons — SVG icons cho hệ thống đại hội đấu.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Icon giáo mã (lance). */
export function IconLance({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20L14 10" />
      <path d="M14 10l6-6" />
      <path d="M14 10l-2-2" />
      <path d="M20 4l-2 2" />
      <path d="M6 18l-2 2" />
      <circle cx="17" cy="7" r="1.5" />
    </svg>
  );
}

/** Icon kiếm (melee/sword duel). */
export function IconSword({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 3.5L20 9l-6 6-5.5-5.5L14.5 3.5z" />
      <path d="M8.5 9.5L3 15l2 2 6-6" />
      <path d="M3 15l2 2" />
      <path d="M14.5 3.5l1.5-1.5" />
      <path d="M20 9l1.5 1.5" />
    </svg>
  );
}

/** Icon cung tên (archery). */
export function IconBow({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 4c-4 0-8 4-8 8s4 8 8 8" />
      <path d="M10 12L4 18" />
      <path d="M10 12l2-2" />
      <path d="M4 18l2-2" />
    </svg>
  );
}

/** Icon ngựa (horse race). */
export function IconHorse({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 3l-3 3c-1 1-3 1-4 0L8 3" />
      <path d="M8 3v4c0 2 2 4 4 4h2c2 0 4-2 4-4V3" />
      <path d="M10 11v4l-4 6" />
      <path d="M14 11v4l4 6" />
      <path d="M8 15h8" />
    </svg>
  );
}

/** Icon trophy/cup (tournament). */
export function IconTrophy({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2h8v8a4 4 0 0 1-8 0V2z" />
      <path d="M16 4h2a2 2 0 0 1 0 4h-2" />
      <path d="M8 4H6a2 2 0 0 0 0 4h2" />
      <path d="M12 14v4" />
      <path d="M8 18h8" />
      <path d="M7 21h10" />
    </svg>
  );
}

/** Icon shield/banner (tourney banner). */
export function IconBanner({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20" />
      <path d="M4 4h12l-3 4 3 4H4" />
    </svg>
  );
}
