import { describe, expect, it } from "vitest";
import { mergeLorebooks, parseLorebook } from "./loreSchema";

describe("parseLorebook — 2 định dạng (4.1/4.3)", () => {
  it("ST world_info: entries object keyed by uid, field số", () => {
    const raw = {
      name: "Test Book",
      entries: {
        "0": {
          uid: 0, key: ["winterfell"], keysecondary: ["stark"], content: "nội dung",
          comment: "WF", constant: false, selective: true, selectiveLogic: 3,
          order: 42, position: 4, depth: 7, role: 2, disable: false,
          probability: 80, useProbability: true, excludeRecursion: true,
          preventRecursion: true, delayUntilRecursion: false, scanDepth: 2,
          caseSensitive: true, matchWholeWords: false, ignoreBudget: true,
        },
      },
    };
    const { name, entries, warnings } = parseLorebook(raw, "src1", "fallback");
    expect(name).toBe("Test Book");
    expect(warnings).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      uid: "src1#0", keys: ["winterfell"], secondaryKeys: ["stark"],
      selectiveLogic: "AND_ALL", order: 42, position: "atDepth", depth: 7,
      role: "assistant", probability: 80, excludeRecursion: true,
      preventRecursion: true, scanDepth: 2, caseSensitive: true, ignoreBudget: true,
    });
  });

  it("useProbability=false → probability coi như 100", () => {
    const { entries } = parseLorebook(
      { entries: { "0": { key: ["x"], probability: 25, useProbability: false } } },
      "s", "n",
    );
    expect(entries[0].probability).toBe(100);
  });

  it("position số map đúng: 0 before, 1 after, 2/3 → after, 4 atDepth", () => {
    const { entries } = parseLorebook(
      {
        entries: {
          "0": { key: ["a"], position: 0 }, "1": { key: ["b"], position: 1 },
          "2": { key: ["c"], position: 2 }, "3": { key: ["d"], position: 4 },
        },
      },
      "s", "n",
    );
    expect(entries.map((e) => e.position)).toEqual(["before", "after", "after", "atDepth"]);
  });

  it("character_book: entries array, field chữ (spec 4.1)", () => {
    const raw = {
      entries: [
        {
          keys: ["Winterfell", "Ngôi nhà Stark"], secondary_keys: ["lãnh chúa"],
          content: "Winterfell là lâu đài chính...", comment: "Winterfell - địa danh",
          insertion_order: 100, position: "before_char", constant: false,
          selective: true, selectiveLogic: "AND", case_sensitive: false,
          probability: 100, scan_depth: 4, enabled: true,
        },
        { keys: ["Dorne"], content: "x", position: "after_char", enabled: false },
      ],
    };
    const { entries, warnings } = parseLorebook(raw, "cb", "book");
    expect(warnings).toEqual([]);
    expect(entries[0]).toMatchObject({
      keys: ["Winterfell", "Ngôi nhà Stark"], secondaryKeys: ["lãnh chúa"],
      selectiveLogic: "AND_ANY", order: 100, position: "before", disabled: false,
    });
    expect(entries[1]).toMatchObject({ position: "after", disabled: true });
  });

  it("character card V2 bọc trong data.character_book vẫn parse được", () => {
    const raw = { data: { character_book: { name: "CB", entries: [{ keys: ["a"], content: "c" }] } } };
    const { name, entries } = parseLorebook(raw, "s", "fb");
    expect(name).toBe("CB");
    expect(entries).toHaveLength(1);
  });

  it("entry lỗi bị loại từng cái + cảnh báo, phần còn lại nạp bình thường", () => {
    const raw = { entries: { "0": { key: ["ok"] }, "1": { key: "không phải mảng — lỗi" } } };
    const { entries, warnings } = parseLorebook(raw, "s", "n");
    expect(entries).toHaveLength(1);
    expect(warnings).toHaveLength(1);
  });

  it("không có entries → lorebook rỗng + cảnh báo, không crash", () => {
    expect(parseLorebook({ foo: 1 }, "s", "n").warnings.length).toBeGreaterThan(0);
    expect(parseLorebook(null, "s", "n").entries).toEqual([]);
    expect(parseLorebook("chuỗi", "s", "n").entries).toEqual([]);
  });
});

describe("mergeLorebooks — gộp nhiều nguồn (4.3)", () => {
  it("nối entry từ nhiều nguồn, log khoá trùng giữa các nguồn", () => {
    const a = parseLorebook({ entries: { "0": { key: ["winterfell"], order: 10 } } }, "a", "Nguồn A");
    const b = parseLorebook({ entries: { "0": { key: ["Winterfell", "dorne"], order: 5 } } }, "b", "Nguồn B");
    const { entries, conflicts } = mergeLorebooks([a, b]);
    expect(entries).toHaveLength(2);
    expect(conflicts.some((c) => c.includes("winterfell") || c.includes("Winterfell"))).toBe(true);
    // phân giải cuối theo insertion_order khi ghép prompt (đã test ở loreTrigger sort)
  });
});
