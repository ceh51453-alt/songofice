/**
 * TavernIcons — SVG icons cho hệ thống mini-game quán rượu.
 * Tuân thủ ANTI-EMOJI POLICY: chỉ dùng SVG, không emoji.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Icon lá bài (Kings Game). */
export function IconCards({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="12" height="16" rx="2" />
      <rect x="9" y="2" width="12" height="16" rx="2" />
      <path d="M15 6l-3 4 3 4" />
    </svg>
  );
}

/** Icon xúc xắc (Dragon Dice). */
export function IconDice({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1" fill={color} />
      <circle cx="15.5" cy="8.5" r="1" fill={color} />
      <circle cx="12" cy="12" r="1" fill={color} />
      <circle cx="8.5" cy="15.5" r="1" fill={color} />
      <circle cx="15.5" cy="15.5" r="1" fill={color} />
    </svg>
  );
}

/** Icon cốc (Shell Game). */
export function IconCup({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2h8l-1 12H9L8 2z" />
      <ellipse cx="12" cy="14" rx="4" ry="1.5" />
      <path d="M10 14v4" />
      <path d="M14 14v4" />
      <path d="M8 18h8" />
      <path d="M7 20h10" />
    </svg>
  );
}

/** Icon phần thưởng. */
export function IconReward({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M9 9.5c0-1.1 1.3-2 3-2s3 .9 3 2c0 1.5-3 2-3 3.5" />
      <circle cx="12" cy="16" r="0.5" fill={color} />
    </svg>
  );
}

/** Icon quán rượu. */
export function IconTavern({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2h8l2 4H6l2-4z" />
      <path d="M6 6v2a6 6 0 0 0 12 0V6" />
      <path d="M12 14v4" />
      <path d="M8 18h8" />
    </svg>
  );
}

/** Icon cánh tay/cơ bắp (Arm Wrestle). */
export function IconArm({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 12l3-5c.5-.8 1.5-1 2.3-.5l1.7 1c.8.5 1.7.3 2.2-.3L19 4" />
      <path d="M7 12c-1.5 0-3 1-3 3s1.5 3 3 3h3" />
      <path d="M19 4c1 0 2 .5 2 2s-1 2-2 2h-3" />
      <path d="M10 18h4c1 0 2-.5 2-1.5S15 15 14 15h-4" />
    </svg>
  );
}

/** Icon mặt nạ/dối trá (Liar's Dice). */
export function IconLiar({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
      <path d="M8 9h.01" />
      <path d="M16 9h.01" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9l-1-1" />
      <path d="M15 9l1-1" />
    </svg>
  );
}

/** Icon đồng xu (Coin Flip). */
export function IconCoin({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M9 8.5c0-1 1.3-1.5 3-1.5s3 .5 3 1.5-1.3 1.5-3 2-3 1-3 2 1.3 1.5 3 1.5 3-.5 3-1.5" />
    </svg>
  );
}
