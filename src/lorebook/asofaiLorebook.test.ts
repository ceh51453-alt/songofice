/**
 * Acceptance test M3 với LOREBOOK THẬT: "ASOFAI _ 3107 Create_optimized.json"
 * (796 entries ST world_info, tiếng Việt, 9 constant, 9 atDepth).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLorebook } from "./loreSchema";
import { getActiveEntries } from "./loreTrigger";

const RAW = JSON.parse(readFileSync(join(__dirname, "..", "..", "ASOFAI _ 3107 Create_optimized.json"), "utf8")) as unknown;

const countTokens = (s: string) => Math.ceil(s.length / 4);

describe("Lorebook ASOFAI thật (796 entries)", () => {
  const parsed = parseLorebook(RAW, "asofai", "ASOFAI");

  it("parse đủ 796 entries, không cảnh báo", () => {
    expect(parsed.entries).toHaveLength(796);
    expect(parsed.warnings).toEqual([]);
  });

  it("map đúng vị trí: 306 before / 481 after / 9 atDepth, 9 constant", () => {
    expect(parsed.entries.filter((e) => e.position === "before")).toHaveLength(306);
    expect(parsed.entries.filter((e) => e.position === "after")).toHaveLength(481);
    expect(parsed.entries.filter((e) => e.position === "atDepth")).toHaveLength(9);
    expect(parsed.entries.filter((e) => e.constant)).toHaveLength(9);
  });

  it("trigger với hội thoại nhắc Winterfell → entry liên quan active, constant luôn có", () => {
    const r = getActiveEntries(parsed.entries, {
      messages: [
        { role: "user", content: "Ta là Eddard Stark, lãnh chúa Winterfell." },
        { role: "assistant", content: "Tuyết rơi trên thành Winterfell cổ kính." },
      ],
      rng: () => 0.5,
      tokenBudget: 1_000_000,
      countTokens,
    });
    const total = r.before.length + r.after.length + r.atDepth.length;
    expect(total).toBeGreaterThanOrEqual(9); // ít nhất 9 constant
    // có entry không-constant khớp từ khoá thật
    const matched = [...r.before, ...r.after, ...r.atDepth].filter((a) => !a.reason.constant);
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.some((a) => a.reason.matchedKeys.some((k) => k.toLowerCase().includes("winterfell") || k.toLowerCase().includes("stark")))).toBe(true);
  });

  it("hội thoại không liên quan → chỉ constant active (không tràn lore)", () => {
    const r = getActiveEntries(parsed.entries, {
      messages: [{ role: "user", content: "xyzabc 12345 nothing" }],
      rng: () => 0.5,
      tokenBudget: 1_000_000,
      countTokens,
    });
    const nonConstant = [...r.before, ...r.after, ...r.atDepth].filter((a) => !a.reason.constant);
    expect(nonConstant.length).toBeLessThan(20); // vài entry có key quá chung có thể khớp — nhưng không tràn
    expect([...r.before, ...r.after, ...r.atDepth].filter((a) => a.reason.constant)).toHaveLength(9);
  });

  it("ngân sách nhỏ → cắt bớt entry yếu nhưng constant còn nguyên (test budget với data thật)", () => {
    const r = getActiveEntries(parsed.entries, {
      messages: [
        { role: "user", content: "Eddard Stark cưỡi ngựa từ Winterfell tới King's Landing gặp Robert Baratheon, bàn về Jon Arryn, Lannister, Targaryen và Trường Thành." },
      ],
      rng: () => 0.5,
      tokenBudget: 500,
      countTokens,
    });
    const constants = [...r.before, ...r.after, ...r.atDepth].filter((a) => a.reason.constant);
    expect(constants).toHaveLength(9);
    expect(r.dropped.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => w.includes("Ngân sách lore"))).toBe(true);
  });

  it("hiệu năng: 1 lượt trigger trên 796 entries < 300ms", () => {
    const start = performance.now();
    getActiveEntries(parsed.entries, {
      messages: [{ role: "user", content: "Jon Snow rời Winterfell lên Trường Thành, gặp Sam và các anh em Tuần Đêm." }],
      rng: () => 0.5,
      tokenBudget: 100_000,
      countTokens,
    });
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(300);
  });
});
