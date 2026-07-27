/**
 * eventEngine.test.ts — Tests cho engine sự kiện ngẫu nhiên (17.1).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateCondition,
  evaluateConditions,
  buildEventPool,
  rollForEvent,
  applyEventChoice,
  resetEventEngine,
} from "./eventEngine";
import type { GameEvent, EventCondition } from "./eventTypes";
import { makeDefaultState } from "../mvu/schema";

function makeState(overrides: Record<string, unknown> = {}) {
  const s = makeDefaultState();
  // Áp overrides
  if (overrides.gold !== undefined) s["Thông Tin Nhân Vật"]["Ngân Khố"] = overrides.gold as number;
  if (overrides.seed !== undefined) s["_engineMeta"]["_Seed Gốc"] = overrides.seed as number;
  if (overrides.turn !== undefined) s["_engineMeta"]["turnCount"] = overrides.turn as number;
  if (overrides.season !== undefined) s["Thế Giới"]["Mùa"] = overrides.season as "Xuân" | "Hạ" | "Thu" | "Đông";
  if (overrides.era !== undefined) {
    s["Cài Đặt Ván"]["Thời Kỳ"] = overrides.era as string;
  }
  if (overrides.holding) {
    s["Lãnh Địa"]["test-region"] = {} as any;
  }
  if (overrides.atWar) {
    s["Quan Hệ Ngoại Giao"]["Lannister"] = { "Trạng Thái": "Chiến Tranh", "War Score": 0 };
  }
  if (overrides.hasSpy) {
    s["Tình Báo"]["Điệp Viên"]["spy-1"] = {} as any;
  }
  return s;
}

const sampleEvent: GameEvent = {
  id: "test-event-1",
  title: "Test Event",
  weight: 10,
  conditions: [],
  description: "Test description",
  choices: [
    {
      label: "Choice A",
      outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: 100 }],
      narrativeHint: "Gold +100",
    },
    {
      label: "Choice B",
      outcomePatch: [],
      narrativeHint: "Nothing",
    },
  ],
};

const eventWithCheck: GameEvent = {
  id: "test-event-check",
  title: "Check Event",
  weight: 10,
  conditions: [],
  description: "Event with skill check",
  choices: [
    {
      label: "Try persuade",
      outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: 200 }],
      check: {
        checkId: "persuade",
        dc: 10,
        failPatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: -100 }],
      },
      narrativeHint: "Persuasion check",
    },
  ],
};

describe("eventEngine (17.1)", () => {
  beforeEach(() => resetEventEngine());

  describe("evaluateCondition", () => {
    it("stat_gte: true khi đủ", () => {
      const s = makeState({ gold: 500 });
      expect(evaluateCondition({ type: "stat_gte", path: "Thông Tin Nhân Vật.Vàng", value: 300 }, s)).toBe(true);
    });

    it("stat_gte: false khi thiếu", () => {
      const s = makeState({ gold: 100 });
      expect(evaluateCondition({ type: "stat_gte", path: "Thông Tin Nhân Vật.Vàng", value: 300 }, s)).toBe(false);
    });

    it("stat_lte: đúng", () => {
      const s = makeState({ gold: 50 });
      expect(evaluateCondition({ type: "stat_lte", path: "Thông Tin Nhân Vật.Vàng", value: 100 }, s)).toBe(true);
    });

    it("has_holding: false khi không có", () => {
      const s = makeState();
      expect(evaluateCondition({ type: "has_holding" }, s)).toBe(false);
    });

    it("has_holding: true khi có", () => {
      const s = makeState({ holding: true });
      expect(evaluateCondition({ type: "has_holding" }, s)).toBe(true);
    });

    it("at_war: true khi đang chiến tranh", () => {
      const s = makeState({ atWar: true });
      expect(evaluateCondition({ type: "at_war" }, s)).toBe(true);
    });

    it("at_war: false khi hoà bình", () => {
      const s = makeState();
      expect(evaluateCondition({ type: "at_war" }, s)).toBe(false);
    });

    it("season: true khi khớp", () => {
      const s = makeState({ season: "Đông" });
      expect(evaluateCondition({ type: "season", value: "Đông" }, s)).toBe(true);
    });

    it("season: false khi không khớp", () => {
      const s = makeState({ season: "Hạ" });
      expect(evaluateCondition({ type: "season", value: "Đông" }, s)).toBe(false);
    });

    it("has_spy: true khi có điệp viên", () => {
      const s = makeState({ hasSpy: true });
      expect(evaluateCondition({ type: "has_spy" }, s)).toBe(true);
    });
  });

  describe("evaluateConditions", () => {
    it("trả true khi tất cả điều kiện đúng", () => {
      const s = makeState({ gold: 500, holding: true });
      const conds: EventCondition[] = [
        { type: "has_holding" },
        { type: "stat_gte", path: "Thông Tin Nhân Vật.Vàng", value: 200 },
      ];
      expect(evaluateConditions(conds, s)).toBe(true);
    });

    it("trả false khi 1 điều kiện sai", () => {
      const s = makeState({ gold: 50, holding: true });
      const conds: EventCondition[] = [
        { type: "has_holding" },
        { type: "stat_gte", path: "Thông Tin Nhân Vật.Vàng", value: 200 },
      ];
      expect(evaluateConditions(conds, s)).toBe(false);
    });

    it("rỗng điều kiện = luôn true", () => {
      const s = makeState();
      expect(evaluateConditions([], s)).toBe(true);
    });
  });

  describe("buildEventPool", () => {
    it("lọc event không đủ điều kiện", () => {
      const warEvent: GameEvent = {
        ...sampleEvent,
        id: "war-only",
        conditions: [{ type: "at_war" }],
      };
      const s = makeState(); // hoà bình
      const pool = buildEventPool([sampleEvent, warEvent], s);
      expect(pool).toHaveLength(1);
      expect(pool[0].id).toBe("test-event-1");
    });

    it("giữ event đủ điều kiện", () => {
      const warEvent: GameEvent = {
        ...sampleEvent,
        id: "war-only",
        conditions: [{ type: "at_war" }],
      };
      const s = makeState({ atWar: true });
      const pool = buildEventPool([sampleEvent, warEvent], s);
      expect(pool).toHaveLength(2);
    });
  });

  describe("rollForEvent", () => {
    it("cùng seed cho cùng kết quả", () => {
      const s = makeState({ seed: 42, turn: 10 });
      resetEventEngine();
      const r1 = rollForEvent([sampleEvent], s);
      resetEventEngine();
      const r2 = rollForEvent([sampleEvent], s);
      // Cùng seed → cùng outcome (hoặc cả 2 null hoặc cả 2 có event)
      expect(r1?.id).toBe(r2?.id);
    });
  });

  describe("applyEventChoice", () => {
    it("trả patch khi không có check", () => {
      const s = makeState({ seed: 42, turn: 1 });
      const result = applyEventChoice(sampleEvent.choices[0], s);
      expect(result.patches).toHaveLength(1);
      expect(result.patches[0].op).toBe("delta");
      expect(result.checkResult).toBeUndefined();
    });

    it("trả checkResult khi có check", () => {
      const s = makeState({ seed: 42, turn: 1 });
      const result = applyEventChoice(eventWithCheck.choices[0], s);
      expect(result.checkResult).toBeDefined();
      expect(result.checkResult!.grade).toBeDefined();
      expect(typeof result.checkResult!.roll).toBe("number");
      expect(typeof result.checkResult!.success).toBe("boolean");
    });

    it("thành công trả outcomePatch, thất bại trả failPatch", () => {
      const s = makeState({ seed: 42, turn: 1 });
      const result = applyEventChoice(eventWithCheck.choices[0], s);
      if (result.checkResult!.success) {
        expect(result.patches[0].value).toBe(200);
      } else {
        expect(result.patches[0].value).toBe(-100);
      }
    });
  });
});
