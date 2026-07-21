/**
 * AudioIcons.tsx (M16, 18.4) — SVG icons cho audio player/settings.
 * Cùng hệ thống icon project (line-art, size/color/strokeWidth).
 */
import type { IconProps } from "../icons";

function base(props: IconProps) {
  const { size = 18, color = "currentColor", strokeWidth = 1.6, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

/** Nốt nhạc. */
export function IconMusic(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/** Play tam giác. */
export function IconPlay(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="5 3 19 12 5 21 5 3" fill={props.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

/** Pause 2 thanh đứng. */
export function IconPause(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill={props.color ?? "currentColor"} stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill={props.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

/** Loa — âm lượng bình thường. */
export function IconVolume(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/** Loa tắt — gạch chéo. */
export function IconVolumeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

/** Skip tiến — nhạc tiếp theo. */
export function IconSkipForward(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="5 4 15 12 5 20 5 4" fill={props.color ?? "currentColor"} stroke="none" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}
