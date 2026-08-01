/**
 * eventTypes.ts (17.1) — Interfaces cho hệ thống sự kiện ngẫu nhiên.
 * GameEvent: sự kiện có trọng số + điều kiện + lựa chọn.
 * EventChoice: lựa chọn có patch + skill check tùy chọn.
 * EventCondition: điều kiện lọc pool (stat, season, era, war...).
 */
import type { PatchOp } from "../mvu/patchEngine";

// ── Điều kiện lọc sự kiện ──

export type ConditionType =
  | "stat_gte"       // path >= value
  | "stat_lte"       // path <= value
  | "stat_eq"        // path === value
  | "has_holding"    // có ít nhất 1 lãnh địa
  | "at_war"         // đang chiến tranh với bất kỳ Nhà nào
  | "season"         // mùa hiện tại === value
  | "era"            // eraId === value
  | "continent"      // lục địa hiện tại === value (hoặc nằm trong value[])
  | "region"         // vị trí/tiểu vùng hiện tại === value (hoặc nằm trong value[])
  | "culture"        // văn hoá nhân vật === value (hoặc nằm trong value[])
  | "religion"       // tôn giáo nhân vật === value (hoặc nằm trong value[])
  | "coastal"        // đang ở/đang nắm ít nhất một tiểu vùng ven biển
  | "has_spy"        // có ít nhất 1 điệp viên
  | "no_active_event" // không có sự kiện đang chờ xử lý
  | "custom";        // hàm kiểm tra tùy chỉnh

export interface EventCondition {
  type: ConditionType;
  /** Đường dẫn dot-path vào StatData (cho stat_gte/stat_lte/stat_eq). */
  path?: string;
  /** Giá trị so sánh. */
  value?: unknown;
  /** Hàm kiểm tra tùy chỉnh (chỉ dùng runtime, không serialize). */
  customFn?: (state: unknown) => boolean;
}

// ── Lựa chọn sự kiện ──

export interface EventChoice {
  label: string;
  /** Patch áp vào state khi chọn (hoặc khi check thành công). */
  outcomePatch: PatchOp[];
  /** Skill check tùy chọn — dùng resolveCheck (5bis). */
  check?: {
    checkId: string;
    dc: number;
    /** Patch áp khi thất bại. */
    failPatch?: PatchOp[];
  };
  /** Gợi ý AI tường thuật kết quả. */
  narrativeHint: string;
}

// ── Sự kiện ──

export interface GameEvent {
  id: string;
  title: string;
  /** Trọng số cơ bản — cao = dễ xảy ra hơn. */
  weight: number;
  /** Điều kiện — chỉ đủ mới vào pool. */
  conditions: EventCondition[];
  /**
   * Phạm vi địa lý mềm, tách khỏi các điều kiện chỉ số. ID không phân biệt
   * hoa/thường; mảng rỗng nghĩa là không giới hạn. Dữ liệu cũ không có scope
   * vẫn hoạt động trên toàn thế giới.
   */
  scope?: {
    continentIds?: string[];
    excludeContinentIds?: string[];
    regionIds?: string[];
    cultureIds?: string[];
    religions?: string[];
    coastalOnly?: boolean;
  };
  /** Render qua thẻ ngữ nghĩa nào (mục 5.6). */
  narrativeTag?: "event_popup" | "raven_scroll";
  /** 2-4 lựa chọn phản ứng. */
  choices: EventChoice[];
  /** Cooldown: bao nhiêu NGÀY truyện trước khi event này có thể xảy ra lại. */
  cooldownDays?: number;
  /** Mô tả tình huống — AI dùng để tường thuật sống động. */
  description: string;
}

// ── Trạng thái event engine (lưu runtime, không vào schema) ──

export interface ActiveEvent {
  event: GameEvent;
  /** ngày tuyệt đối lúc sự kiện nổ ra (calendar.absoluteDay). */
  triggeredOnDay: number;
}

export interface EventCooldown {
  eventId: string;
  /** ngày tuyệt đối cooldown hết hạn. */
  expiresOnDay: number;
}
