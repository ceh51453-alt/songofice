/**
 * eventEngine.ts (17.1) — Engine sự kiện ngẫu nhiên có điều kiện + trọng số.
 * Chạy mỗi khi thời gian trôi qua turn listener.
 * - evaluateConditions: kiểm tra điều kiện sự kiện
 * - buildEventPool: lọc pool sự kiện đủ điều kiện
 * - rollForEvent: chọn sự kiện bằng weightedPick + RNG
 * - applyEventChoice: áp patch lựa chọn (có skill check tuỳ chọn)
 */
import type { StatData } from "../mvu/schema";
import type { GameEvent, EventCondition, EventChoice, EventCooldown, ActiveEvent } from "./eventTypes";
import { streamRng } from "../probability/rng";
import { weightedPick } from "../probability/weightedPick";
import { resolveCheck, type CheckInput, type CheckActor } from "../probability/resolveCheck";
import type { PatchOp } from "../mvu/patchEngine";
import { isSuccess } from "../probability/grades";
import type { ResultGrade } from "../probability/grades";
import { absoluteDay } from "../mvu/calendar";
import { createLogger } from "../lib/log";

const log = createLogger("event/eventEngine");

/** Xác suất xảy ra sự kiện mỗi 7 ngày truyện (~15%). */
const EVENT_CHANCE_PER_CHECK = 0.15;
/** Kiểm tra sự kiện mỗi 7 ngày truyện. */
const CHECK_INTERVAL_DAYS = 7;

// ── State runtime (không vào schema — reset khi reload) ──
let cooldowns: EventCooldown[] = [];
let dayAccumulator = 0;
let pendingEvent: ActiveEvent | null = null;

export function getPendingEvent(): ActiveEvent | null {
  return pendingEvent;
}
export function setPendingEvent(ev: ActiveEvent | null): void {
  pendingEvent = ev;
}
export function clearCooldowns(): void {
  cooldowns = [];
  dayAccumulator = 0;
}

// ── Truy vấn state theo dot-path ──

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

// ── Kiểm tra điều kiện ──

export function evaluateCondition(cond: EventCondition, state: StatData): boolean {
  switch (cond.type) {
    case "stat_gte": {
      const v = getByPath(state, cond.path ?? "");
      return typeof v === "number" && v >= (cond.value as number);
    }
    case "stat_lte": {
      const v = getByPath(state, cond.path ?? "");
      return typeof v === "number" && v <= (cond.value as number);
    }
    case "stat_eq": {
      const v = getByPath(state, cond.path ?? "");
      return v === cond.value;
    }
    case "has_holding":
      return Object.keys(state["Lãnh Địa"]).length > 0;
    case "at_war":
      return Object.values(state["Quan Hệ Ngoại Giao"]).some(
        (r) => r["Trạng Thái"] === "Chiến Tranh",
      );
    case "season": {
      return state["Thế Giới"]["Mùa"] === cond.value;
    }
    case "era":
      return state["Cài Đặt Ván"]?.["Thời Kỳ"] === cond.value;
    case "has_spy":
      return Object.keys(state["Tình Báo"]["Điệp Viên"]).length > 0;
    case "no_active_event":
      return pendingEvent === null;
    case "custom":
      return cond.customFn ? cond.customFn(state) : true;
    default:
      return true;
  }
}

export function evaluateConditions(conditions: EventCondition[], state: StatData): boolean {
  return conditions.every((c) => evaluateCondition(c, state));
}

// ── Build pool ──

export function buildEventPool(allEvents: GameEvent[], state: StatData): GameEvent[] {
  const today = absoluteDay(state["Thế Giới"]);

  // Lọc cooldowns hết hạn
  cooldowns = cooldowns.filter((c) => c.expiresOnDay > today);
  const coolingIds = new Set(cooldowns.map((c) => c.eventId));

  return allEvents.filter((e) => {
    if (coolingIds.has(e.id)) return false;
    return evaluateConditions(e.conditions, state);
  });
}

// ── Roll chọn sự kiện ──

export function rollForEvent(
  pool: GameEvent[],
  state: StatData,
): GameEvent | null {
  if (pool.length === 0) return null;

  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  const tick = state["_engineMeta"]["_Nhịp"];
  const rng = streamRng(rootSeed, tick, "event");

  // Roll xác suất có sự kiện không
  if (rng() > EVENT_CHANCE_PER_CHECK) return null;

  // Chọn sự kiện bằng trọng số
  const chosen = weightedPick(
    pool.map((e) => ({ value: e, weight: e.weight })),
    rng,
  );

  if (chosen && chosen.cooldownDays) {
    cooldowns.push({
      eventId: chosen.id,
      expiresOnDay: absoluteDay(state["Thế Giới"]) + chosen.cooldownDays,
    });
  }

  return chosen;
}

// ── Xây dựng CheckActor từ StatData ──

function actorFromState(state: StatData): CheckActor {
  const core = state["Chỉ Số Cốt Lõi"];
  const skills: Record<string, number> = {};
  for (const [id, s] of Object.entries(state["Kỹ Năng"])) {
    skills[id] = s["Cấp"];
  }
  return { stats: core, skills };
}

// ── Áp lựa chọn ──

export interface ChoiceResult {
  patches: PatchOp[];
  checkResult?: {
    grade: ResultGrade;
    roll: number;
    target: number;
    success: boolean;
  };
}

export function applyEventChoice(
  choice: EventChoice,
  state: StatData,
): ChoiceResult {
  if (!choice.check) {
    return { patches: choice.outcomePatch };
  }

  // Có skill check
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  const tick = state["_engineMeta"]["_Nhịp"];
  const seed = rootSeed ^ (tick * 31337);

  const input: CheckInput = {
    checkId: choice.check.checkId,
    actor: actorFromState(state),
    difficulty: choice.check.dc,
    seed,
  };

  const result = resolveCheck(input);
  const success = isSuccess(result.grade);

  return {
    patches: success ? choice.outcomePatch : (choice.check.failPatch ?? []),
    checkResult: {
      grade: result.grade,
      roll: result.roll,
      target: result.target,
      success,
    },
  };
}

// ── Daily listener: tick mỗi ngày, check mỗi CHECK_INTERVAL_DAYS ──

export function eventTick(state: StatData, allEvents: GameEvent[]): ActiveEvent | null {
  dayAccumulator++;
  if (dayAccumulator < CHECK_INTERVAL_DAYS) return null;
  dayAccumulator = 0;

  // Không roll nếu đang có event chưa xử lý
  if (pendingEvent) return null;

  const pool = buildEventPool(allEvents, state);
  const chosen = rollForEvent(pool, state);

  if (chosen) {
    const active: ActiveEvent = {
      event: chosen,
      triggeredOnDay: absoluteDay(state["Thế Giới"]),
    };
    pendingEvent = active;
    log.info(`Sự kiện: ${chosen.title}`);
    return active;
  }

  return null;
}

/** Reset toàn bộ state runtime (khi bắt đầu ván mới). */
export function resetEventEngine(): void {
  cooldowns = [];
  dayAccumulator = 0;
  pendingEvent = null;
}
