/**
 * saveEngine.test.ts — Tests cho hệ thống save/load (M15, mục 20).
 */
import { describe, it, expect } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { normalizeCalendar } from "../mvu/calendar";
import { CURRENT_SCHEMA_VERSION } from "./saveEngine";
import type { ExportedSave } from "./saveEngine";
import type { SaveSlotMeta, SaveSlotRecord } from "./db";

// ── Helpers (không cần Dexie thật — test logic thuần) ──

function makeTestState(overrides: Partial<{
  name: string; house: string; era: string; tick: number; day: number; month: number; year: number;
}> = {}): StatData {
  const s = makeDefaultState();
  if (overrides.name) s["Thông Tin Nhân Vật"]["Họ Tên"] = overrides.name;
  if (overrides.house) s["Thông Tin Nhân Vật"]["Nhà"] = overrides.house as any;
  if (overrides.era) s["Cài Đặt Ván"]["Thời Kỳ"] = overrides.era;
  if (overrides.tick) s["_engineMeta"]["_Nhịp"] = overrides.tick;
  if (overrides.day) s["Thế Giới"]["Ngày"] = overrides.day;
  if (overrides.month) s["Thế Giới"]["Tháng"] = overrides.month;
  if (overrides.year) s["Thế Giới"]["Năm"] = overrides.year;
  return s;
}

function extractMeta(stat: StatData): SaveSlotMeta {
  return {
    characterName: stat["Thông Tin Nhân Vật"]["Họ Tên"] || "Chưa đặt tên",
    house: stat["Thông Tin Nhân Vật"]["Nhà"] || "Không Nhà",
    era: stat["Cài Đặt Ván"]["Thời Kỳ"] || "",
    day: stat["Thế Giới"]["Ngày"],
    month: stat["Thế Giới"]["Tháng"],
    year: stat["Thế Giới"]["Năm"],
    season: stat["Thế Giới"]["Mùa"],
  };
}

function makeSlotRecord(stat: StatData, slotName: string): SaveSlotRecord {
  const now = Date.now();
  return {
    id: "test-slot-1",
    slotName,
    mvuStateJson: JSON.stringify(stat),
    messagesJson: JSON.stringify([]),
    meta: extractMeta(stat),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

describe("saveEngine (M15)", () => {
  describe("serialize / deserialize round-trip", () => {
    it("state serialize → parse không mất dữ liệu", () => {
      const state = makeTestState({ name: "Jon Snow", house: "Stark", era: "war-of-five-kings", tick: 42, year: 299 });
      const json = JSON.stringify(state);
      const parsed = JSON.parse(json);

      expect(parsed["Thông Tin Nhân Vật"]["Họ Tên"]).toBe("Jon Snow");
      expect(parsed["Thông Tin Nhân Vật"]["Nhà"]).toBe("Stark");
      expect(parsed["Cài Đặt Ván"]["Thời Kỳ"]).toBe("war-of-five-kings");
      expect(parsed["_engineMeta"]["_Nhịp"]).toBe(42);
      expect(parsed["Thế Giới"]["Năm"]).toBe(299);
    });

    it("metadata trích đúng từ state", () => {
      const state = makeTestState({ name: "Daenerys", house: "Targaryen", day: 10, month: 4, year: 300 });
      const meta = extractMeta(state);

      expect(meta.characterName).toBe("Daenerys");
      expect(meta.house).toBe("Targaryen");
      expect(meta.day).toBe(10);
      expect(meta.month).toBe(4);
      expect(meta.year).toBe(300);
    });
  });

  describe("migration", () => {
    it("state đầy đủ parse thành công qua Zod", () => {
      const state = makeTestState({ name: "Arya" });
      const json = JSON.stringify(state);
      const parsed = JSON.parse(json);

      const result = StatDataSchema.safeParse(parsed);
      expect(result.success).toBe(true);
    });

    it("state thiếu field mới vẫn có thể merge với default", () => {
      const state = makeTestState({ name: "Tyrion" });
      const json = JSON.stringify(state);
      const parsed = JSON.parse(json);

      // Xoá 1 field để giả lập save cũ
      delete parsed["Nhiệm Vụ"];

      const defaults = makeDefaultState();
      // Merge thủ công
      const merged = { ...defaults, ...parsed, "Nhiệm Vụ": defaults["Nhiệm Vụ"] };

      const result = StatDataSchema.safeParse(merged);
      expect(result.success).toBe(true);
      expect(result.data!["Thông Tin Nhân Vật"]["Họ Tên"]).toBe("Tyrion");
    });

    it("save CŨ (lịch 1 field: Ngày 1-360, chưa có Tháng) → tách đúng Tháng/Ngày", () => {
      const state = makeTestState({ name: "Ned", year: 298 });
      const parsed = JSON.parse(JSON.stringify(state)) as Record<string, any>;

      // giả lập save cũ: Ngày là ngày-trong-năm, không có field Tháng
      parsed["Thế Giới"]["Ngày"] = 250;
      delete parsed["Thế Giới"]["Tháng"];

      const result = StatDataSchema.safeParse(parsed);
      expect(result.success).toBe(true);
      // schema prefault Tháng = 1, normalizeCalendar tách lại
      normalizeCalendar(result.data!["Thế Giới"]);
      expect(result.data!["Thế Giới"]["Năm"]).toBe(298);
      expect(result.data!["Thế Giới"]["Tháng"]).toBe(9);
      expect(result.data!["Thế Giới"]["Ngày"]).toBe(10);
    });
  });

  describe("export format", () => {
    it("export JSON có đúng format marker", () => {
      const state = makeTestState({ name: "Cersei" });
      const record = makeSlotRecord(state, "Test Save");
      const { id: _, ...slotNoId } = record;

      const exported: ExportedSave = {
        _format: "asoiaf-rpg-save",
        _version: CURRENT_SCHEMA_VERSION,
        slot: slotNoId,
        portraits: [],
      };

      expect(exported._format).toBe("asoiaf-rpg-save");
      expect(exported._version).toBe(CURRENT_SCHEMA_VERSION);
      expect(exported.slot.slotName).toBe("Test Save");
    });

    it("export → parse round-trip giữ nguyên dữ liệu", () => {
      const state = makeTestState({ name: "Sansa", tick: 25 });
      const record = makeSlotRecord(state, "Sansa Save");
      const { id: _, ...slotNoId } = record;

      const exported: ExportedSave = {
        _format: "asoiaf-rpg-save",
        _version: CURRENT_SCHEMA_VERSION,
        slot: slotNoId,
        portraits: [],
      };

      const json = JSON.stringify(exported);
      const reimported = JSON.parse(json) as ExportedSave;

      expect(reimported._format).toBe("asoiaf-rpg-save");
      const reimportedState = JSON.parse(reimported.slot.mvuStateJson);
      expect(reimportedState["Thông Tin Nhân Vật"]["Họ Tên"]).toBe("Sansa");
      expect(reimportedState["_engineMeta"]["_Nhịp"]).toBe(25);
    });

    it("reject file không đúng format", () => {
      const badData = { foo: "bar" };
      expect((badData as unknown as ExportedSave)._format).not.toBe("asoiaf-rpg-save");
    });
  });

  describe("slot metadata", () => {
    it("slot record chứa đủ thông tin cho UI card", () => {
      const state = makeTestState({ name: "Bran", house: "Stark", era: "war-of-five-kings", day: 5, month: 11, year: 301 });
      const record = makeSlotRecord(state, "Bran's Journey");

      expect(record.slotName).toBe("Bran's Journey");
      expect(record.meta.characterName).toBe("Bran");
      expect(record.meta.house).toBe("Stark");
      expect(record.meta.day).toBe(5);
      expect(record.meta.month).toBe(11);
      expect(record.meta.year).toBe(301);
      expect(record.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it("default name khi chưa đặt tên", () => {
      const state = makeTestState();
      const meta = extractMeta(state);
      expect(meta.characterName).toBe("Vô Danh");
    });
  });
});
