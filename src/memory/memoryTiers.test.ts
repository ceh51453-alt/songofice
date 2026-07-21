import { describe, it, expect } from "vitest";
import { buildContextBudget, type ContextBudgetInput } from "./memoryTiers";
import {
  shouldSummarize,
  buildSummarizationPrompt,
  parseSummaryResponse,
  shouldMerge,
  parseMergeResponse,
} from "./rollingSummarization";
import type { ChapterSummary } from "./chapterSummaryStore";

// ── memoryTiers ──────────────────────────────────────────────────────────────

describe("memoryTiers (16bis.1/16bis.5)", () => {
  function makeInput(overrides: Partial<ContextBudgetInput> = {}): ContextBudgetInput {
    return {
      totalBudget: 8000,
      stateBlock: "State block content here",
      systemPrompts: ["System prompt 1"],
      memoryBlock: "Memory block content",
      loreMessages: [{ role: "system", content: "Lore entry" }],
      summaries: ["Summary of chapter 1"],
      chatHistory: Array.from({ length: 10 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `Message ${i}: ${"x".repeat(100)}`,
      })),
      ...overrides,
    };
  }

  it("state và system luôn được include", () => {
    const result = buildContextBudget(makeInput());
    expect(result.usage.state).toBeGreaterThan(0);
    expect(result.usage.system).toBeGreaterThan(0);
  });

  it("memory uu tien hon chat tho", () => {
    // Use very long chat messages so budget gets exhausted
    const longChat = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Message ${i}: ${"x".repeat(2000)}`,
    }));
    const result = buildContextBudget(makeInput({
      totalBudget: 2000,
      chatHistory: longChat,
    }));
    // With 2000 budget and 10 messages of ~2000 chars each, most chat must be dropped
    expect(result.chatDropped).toBeGreaterThan(0);
    // But state is always included
    expect(result.usage.state).toBeGreaterThan(0);
  });

  it("budget lớn → không cắt gì", () => {
    const result = buildContextBudget(makeInput({ totalBudget: 100000 }));
    expect(result.chatDropped).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("budget 0 → cảnh báo", () => {
    const result = buildContextBudget(makeInput({ totalBudget: 0 }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ── rollingSummarization ─────────────────────────────────────────────────────

describe("rollingSummarization (16bis.2)", () => {
  describe("shouldSummarize", () => {
    it("dưới ngưỡng → false", () => {
      const msgs = [{ role: "user" as const, content: "Hello" }];
      expect(shouldSummarize(msgs)).toBe(false);
    });

    it("trên ngưỡng → true", () => {
      const longContent = "x".repeat(20000);
      const msgs = [{ role: "user" as const, content: longContent }];
      expect(shouldSummarize(msgs)).toBe(true);
    });
  });

  describe("buildSummarizationPrompt", () => {
    it("sinh prompt chứa nội dung hội thoại", () => {
      const msgs = [
        { role: "user" as const, content: "Tôi muốn gặp Tyrion" },
        { role: "assistant" as const, content: "Tyrion đang ở thư viện" },
      ];
      const prompt = buildSummarizationPrompt(msgs);
      expect(prompt).toContain("Tyrion");
      expect(prompt).toContain("Tóm tắt");
    });
  });

  describe("parseSummaryResponse", () => {
    it("parse format chuẩn", () => {
      const response = `## Tóm Tắt
- Người chơi gặp Tyrion tại thư viện.
- Tyrion đồng ý làm quân sư.

## NPC Liên Quan
Tyrion Lannister, Bronn`;

      const summary = parseSummaryResponse(response, 1, 10, 298);
      expect(summary.content).toContain("Tyrion");
      expect(summary.npcRelated).toContain("Tyrion Lannister");
      expect(summary.npcRelated).toContain("Bronn");
      expect(summary.turnRange).toEqual([1, 10]);
      expect(summary.level).toBe(1);
    });

    it("fallback khi format không chuẩn", () => {
      const response = "Người chơi gặp Tyrion và Bronn.";
      const summary = parseSummaryResponse(response, 5, 15, 299);
      expect(summary.content).toContain("Tyrion");
      expect(summary.npcRelated).toHaveLength(0); // no ## NPC section
    });
  });

  describe("shouldMerge", () => {
    it("dưới 5 summaries cấp 1 → false", () => {
      const summaries: ChapterSummary[] = [
        { id: "1", turnRange: [1, 5], year: 298, content: "...", npcRelated: [], level: 1, createdAt: 0 },
      ];
      expect(shouldMerge(summaries)).toBe(false);
    });

    it(">= 5 summaries cấp 1 → true", () => {
      const summaries: ChapterSummary[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`, turnRange: [i * 5, (i + 1) * 5] as [number, number], year: 298, content: "...", npcRelated: [], level: 1, createdAt: 0,
      }));
      expect(shouldMerge(summaries)).toBe(true);
    });
  });

  describe("parseMergeResponse", () => {
    it("parse merge response thành summary cấp 2", () => {
      const sources: ChapterSummary[] = [
        { id: "a", turnRange: [1, 10], year: 298, content: "...", npcRelated: ["Tyrion"], level: 1, createdAt: 0 },
        { id: "b", turnRange: [11, 20], year: 299, content: "...", npcRelated: ["Cersei"], level: 1, createdAt: 0 },
      ];
      const response = `## Tóm Tắt Tổng Hợp
- Tyrion và Cersei xung đột.`;
      const merged = parseMergeResponse(response, sources);
      expect(merged.level).toBe(2);
      expect(merged.turnRange).toEqual([1, 20]);
      expect(merged.npcRelated).toContain("Tyrion");
      expect(merged.npcRelated).toContain("Cersei");
    });
  });
});
