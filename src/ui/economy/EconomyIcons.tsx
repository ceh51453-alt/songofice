/**
 * Economy SVG icons (M12) — line-art mảnh, CẤM emoji.
 * Sử dụng cùng base pattern và IconProps từ ../icons.
 */
import type { SVGProps } from "react";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

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

/** Đồng xu — Vàng / ngân khố. */
export function IconCoin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M9 10.5c0-.8.7-1.5 1.5-1.5h1.5c1.1 0 2 .7 2 1.5s-.9 1.5-2 1.5h-1c-1.1 0-2 .7-2 1.5s.9 1.5 2 1.5H13.5c.8 0 1.5-.7 1.5-1.5" />
    </svg>
  );
}

/** Lúa mì — Lương Thực. */
export function IconWheat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21V10" />
      <path d="M8 14c2-1 3-3 3-5" />
      <path d="M16 14c-2-1-3-3-3-5" />
      <path d="M7 11c2-.5 3-2 3.5-4" />
      <path d="M17 11c-2-.5-3-2-3.5-4" />
      <path d="M8.5 8c1.5-.5 2.5-1.5 3-3" />
      <path d="M15.5 8c-1.5-.5-2.5-1.5-3-3" />
    </svg>
  );
}

/** Cây — Gỗ. */
export function IconTree(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 22v-6" />
      <path d="M7 16 12 3l5 13H7Z" />
    </svg>
  );
}

/** Đá xếp chồng. */
export function IconStone(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="14" width="14" height="4" rx="1" />
      <rect x="7" y="10" width="10" height="4" rx="1" />
      <rect x="9" y="6" width="6" height="4" rx="1" />
    </svg>
  );
}

/** Búa rèn — Quặng Sắt. */
export function IconAnvil(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 18h10" />
      <path d="M9 18v-4c0-1 .5-2 1.5-2H12" />
      <path d="M15 18v-4c0-1-.5-2-1.5-2H12" />
      <path d="M10 6l2-2 2 2" />
      <path d="M12 6v6" />
    </svg>
  );
}

/** Thuyền buồm — thương mại. */
export function IconShip(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 18l2-6h12l2 6" />
      <path d="M12 4v8" />
      <path d="M12 4c3 1 5 3 5 6H12" />
    </svg>
  );
}

/** Ngân hàng — Iron Bank. */
export function IconBank(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 21h18" />
      <path d="M5 21V10" />
      <path d="M19 21V10" />
      <path d="M9 21v-6" />
      <path d="M15 21v-6" />
      <path d="M12 21v-6" />
      <path d="M3 10l9-7 9 7" />
    </svg>
  );
}

/** Lửa — khủng hoảng. */
export function IconFlame(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21c-4 0-6-3-6-7 0-3 2-5 4-8 1 2 3 3 3 5 .5-.5 1.5-1 2-2 1 2 1.5 4 1.5 5 0 4-2 7-4.5 7Z" />
    </svg>
  );
}

/** Biểu đồ đường — xu hướng. */
export function IconTrend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="3 17 8 12 12 15 21 6" />
      <polyline points="17 6 21 6 21 10" />
    </svg>
  );
}

/** Thuế — đồng xu + mũi tên. */
export function IconTax(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="9" r="5" />
      <path d="M9 7v4" />
      <path d="M7 9h4" />
      <path d="M17 15l3 3-3 3" />
      <path d="M14 18h6" />
    </svg>
  );
}
