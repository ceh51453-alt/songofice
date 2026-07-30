/**
 * Thư viện icon SVG dùng chung (ràng buộc mỹ thuật điểm 1-2: KHÔNG emoji,
 * mọi icon là SVG line-art mảnh). Mỗi icon là React component nhận
 * size / color / strokeWidth qua prop.
 */
import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
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

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12 20 4l-4 16-4.5-6.5L4 12Z" />
      <path d="m11.5 13.5 4-4" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function IconDuplicate(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 4H6a2 2 0 0 0-2 2v10" />
      <path d="M14 12v4M12 14h4" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.5 17.5 0 0 1-3.2 3.9M6.1 8.3A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1.1 0 2.1-.2 3-.6" />
      <path d="M9.5 9.8a2.8 2.8 0 0 0 4 3.9" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 3v4h-4" />
    </svg>
  );
}

export function IconStop(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
    </svg>
  );
}

export function IconSpinner(props: IconProps) {
  return (
    <svg {...base(props)} className={`anim-spin ${props.className ?? ""}`}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

export function IconBroom(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m14 4 6 6" />
      <path d="M12.5 5.5 18.5 11.5 10 20H4v-6l8.5-8.5Z" />
      <path d="m7 14 3 3" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m14.5 6-6 6 6 6" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

/** Cuộn giấy da — thư từ/quạ đưa tin. */
export function IconScroll(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4h11a2 2 0 0 1 2 2v1h-3" />
      <path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7" />
      <path d="M8 9h7M8 12.5h7M8 16h4.5" />
    </svg>
  );
}

/** Bản đồ. */
export function IconMap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

/** Tháp thành — lãnh địa. */
export function IconCastle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 21V9l-1-1V5h3v2h2V5h2v2h2V5h2v2h2V5h3v3l-1 1v12" />
      <path d="M3 21h18" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  );
}

/** Khiên — quân sự. */
export function IconShield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="M12 3v18" />
    </svg>
  );
}

/** Vương miện — triều đình. */
export function IconCrown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4 8 3.5 4L12 6l4.5 6L20 8v9H4V8Z" />
      <path d="M4 19.5h16" />
    </svg>
  );
}

/** Mặt nạ — mưu đồ. */
export function IconMask(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6c2.5 1 5 1.5 8 1.5S17.5 7 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z" />
      <path d="M8.5 12c.8-.8 2.2-.8 3 0M12.5 12c.8-.8 2.2-.8 3 0" />
      <path d="M9 16.5c1.8 1 4.2 1 6 0" />
    </svg>
  );
}

/** Sách — nhật ký. */
export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5V4Z" />
      <path d="M19 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6V4Z" />
    </svg>
  );
}

/** Đồng xu — vàng/kinh tế. */
export function IconCoins(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5V12c0 1.7 3.1 3 7 3s7-1.3 7-3V6.5" />
      <path d="M5 12v5.5c0 1.7 3.1 3 7 3s7-1.3 7-3V12" />
    </svg>
  );
}

/** Người — quan hệ NPC. */
export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.5-3.5 2.6-5.5 5.5-5.5s5 2 5.5 5.5" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M16 14.5c2.4.2 4 1.9 4.5 4.5" />
    </svg>
  );
}

/** Túi đồ. */
export function IconBackpack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M5 13h14" />
      <path d="M10 13v2h4v-2" />
    </svg>
  );
}

/** Lịch. */
export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </svg>
  );
}

/** Ghim vị trí. */
export function IconPin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </svg>
  );
}

/** Ngôi sao 4 cánh — kỹ năng/thiên phú. */
export function IconSpark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.6 3.9 2.4 6.4 6.5 7-4.1.6-5.9 3.1-6.5 7-.6-3.9-2.4-6.4-6.5-7 4.1-.6 5.9-3.1 6.5-7Z" />
      <path d="M18.5 15.5c.3 1.7 1 2.7 2.5 3-1.5.3-2.2 1.3-2.5 3-.3-1.7-1-2.7-2.5-3 1.5-.3 2.2-1.3 2.5-3Z" />
    </svg>
  );
}

/** Kính soi tài liệu — Prompt Inspector. */
export function IconInspect(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h9l4 4v6" />
      <path d="M14 4v4h4" />
      <path d="M5 4v16h6" />
      <circle cx="15.5" cy="15.5" r="3.2" />
      <path d="m18 18 2.5 2.5" />
      <path d="M8 9h3.5M8 12h2.5" />
    </svg>
  );
}

/** Búa — xây dựng. */
export function IconHammer(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13.5 4.5 19 10l-2.5 2.5-5.5-5.5L13.5 4.5Z" />
      <path d="M11 7 4.5 13.5a2.1 2.1 0 0 0 3 3L14 10" />
    </svg>
  );
}

/** Lớp chồng — toggle chế độ tô màu bản đồ. */
export function IconLayers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

/** Bó lúa — Lương Thực. */
export function IconWheat(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21V9" />
      <path d="M12 9c0-2 1.5-3.5 3-4-.2 2-1 3.5-3 4Z" />
      <path d="M12 9c0-2-1.5-3.5-3-4 .2 2 1 3.5 3 4Z" />
      <path d="M12 14c0-2 1.5-3.5 3-4-.2 2-1 3.5-3 4Z" />
      <path d="M12 14c0-2-1.5-3.5-3-4 .2 2 1 3.5 3 4Z" />
    </svg>
  );
}

/** Cây — Gỗ. */
export function IconTree(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 7 10h3l-3 5h10l-3-5h3L12 3Z" />
      <path d="M12 15v6" />
    </svg>
  );
}

/** Núi — Đá / Quặng. */
export function IconMountain(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 20 6-11 4 6 2-3 6 8H3Z" />
      <path d="m9 9 1.5 2.5" />
    </svg>
  );
}

/** Tâm ngắm — về vị trí hiện tại. */
/** Cờ hiệu treo trên cán — bàn cờ quyền lực các Nhà (Bảy Vương Quốc). */
export function IconBanner(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3v18" />
      <path d="M6 4h12l-2.5 4.5L18 13H6" />
    </svg>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

/** Người dân — dân số. */
export function IconPopulation(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="5" cy="9" r="1.8" />
      <circle cx="19" cy="9" r="1.8" />
    </svg>
  );
}

/** Huy hiệu mặc định — kiếm chéo (chưa gắn Nhà nào, dùng cho header M1). */
export function IconCrossedSwords(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l11 11M4 4v3M4 4h3" />
      <path d="M20 4 9 15M20 4v3M20 4h-3" />
      <path d="m7 17-2.5 2.5M17 17l2.5 2.5" />
      <path d="M9 15l-3 3 1.5 1.5 3-3M15 15l3 3-1.5 1.5-3-3" />
    </svg>
  );
}

/** Rồng — biểu tượng cho tab rồng trong Status Panel. */
export function IconDragon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 18c0-3 2-5 5-6l2-3c1-2 3-3 5-3h2l-1 3c0 1 1 2 2 2v2c-1 1-3 1-4 0l-1 2c-1 2-3 3-5 3H8" />
      <path d="M8 18c-2 0-3-1-3-3" />
      <path d="M13 9l2-4" />
      <path d="M10 12l-3 1" />
    </svg>
  );
}

/** Sét — Extra Model / phân tích biến. */
export function IconZap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  );
}

/** Đầu lâu — Tử vong / Game Over. */
export function IconSkull(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4c4.4 0 8 3 8 6.8 0 1.7-.8 3.2-2 4.4V19c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-3.8c-1.2-1.2-2-2.7-2-4.4C4 7 7.6 4 12 4Z" />
      <path d="M14.5 10.5h-.01" />
      <path d="M9.5 10.5h-.01" />
      <path d="m15 14-1.5 2" />
      <path d="m9 14 1.5 2" />
    </svg>
  );
}
