import { describe, expect, it } from "vitest";
import { getActiveEntries, type TriggerOptions } from "./loreTrigger";
import type { LoreEntry } from "./loreSchema";
import type { ApiChatMessage } from "../types/connection";

let uidCounter = 0;
function makeEntry(partial: Partial<LoreEntry>): LoreEntry {
  return {
    uid: `t#${uidCounter++}`, sourceId: "t", sourceName: "test",
    keys: [], secondaryKeys: [], content: "", comment: "",
    constant: false, selective: true, selectiveLogic: "AND_ANY",
    order: 100, position: "before", depth: 4, role: "system",
    disabled: false, probability: 100,
    excludeRecursion: false, preventRecursion: false, delayUntilRecursion: false,
    scanDepth: null, caseSensitive: null, matchWholeWords: null, ignoreBudget: false,
    ...partial,
  };
}

function msgs(...contents: string[]): ApiChatMessage[] {
  return contents.map((c) => ({ role: "user" as const, content: c }));
}

function makeOpts(partial?: Partial<TriggerOptions>): TriggerOptions {
  return {
    messages: [],
    rng: () => 0.5,
    tokenBudget: 100_000,
    countTokens: (s) => Math.ceil(s.length / 4),
    ...partial,
  };
}

describe("getActiveEntries — trigger cơ bản (4.2)", () => {
  it("constant luôn active dù không khớp keyword", () => {
    const entries = [
      makeEntry({ comment: "TGQ", constant: true, content: "thế giới quan" }),
      makeEntry({ comment: "WF", keys: ["winterfell"], content: "về winterfell" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("không liên quan gì") }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["TGQ"]);
    expect(r.before[0].reason.constant).toBe(true);
  });

  it("selective active theo keyword, đúng vị trí before/after/atDepth", () => {
    const entries = [
      makeEntry({ comment: "B", keys: ["winterfell"], position: "before", order: 10 }),
      makeEntry({ comment: "A", keys: ["winterfell"], position: "after", order: 20 }),
      makeEntry({ comment: "D", keys: ["winterfell"], position: "atDepth", depth: 2, order: 30 }),
      makeEntry({ comment: "X", keys: ["dorne"], position: "before" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("ta về Winterfell") }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["B"]);
    expect(r.after.map((a) => a.entry.comment)).toEqual(["A"]);
    expect(r.atDepth.map((a) => a.entry.comment)).toEqual(["D"]);
  });

  it("scan_depth: entry chỉ quét N tin cuối", () => {
    const entries = [
      makeEntry({ comment: "sâu1", keys: ["rồng"], scanDepth: 1 }),
      makeEntry({ comment: "sâu3", keys: ["rồng"], scanDepth: 3 }),
    ];
    const history = msgs("con rồng bay qua", "trời mưa", "ta đi ngủ");
    const r = getActiveEntries(entries, makeOpts({ messages: history }));
    // "rồng" nằm ở tin cách đây 3 tin — chỉ entry scanDepth 3 thấy
    expect(r.before.map((a) => a.entry.comment)).toEqual(["sâu3"]);
  });

  it("probability roll: trượt thì không active (rng cố định)", () => {
    const entries = [makeEntry({ comment: "P30", keys: ["gió"], probability: 30 })];
    // rng 0.5 → 50 >= 30 → trượt
    expect(getActiveEntries(entries, makeOpts({ messages: msgs("gió bấc") })).before).toHaveLength(0);
    // rng 0.1 → 10 < 30 → trúng
    expect(getActiveEntries(entries, makeOpts({ messages: msgs("gió bấc"), rng: () => 0.1 })).before).toHaveLength(1);
  });

  it("entry disabled bị bỏ qua hoàn toàn", () => {
    const entries = [makeEntry({ comment: "off", keys: ["gió"], disabled: true })];
    expect(getActiveEntries(entries, makeOpts({ messages: msgs("gió") })).before).toHaveLength(0);
  });

  it("kết quả sort theo insertion_order trong mỗi nhóm", () => {
    const entries = [
      makeEntry({ comment: "z", keys: ["gió"], order: 300 }),
      makeEntry({ comment: "a", keys: ["gió"], order: 50 }),
      makeEntry({ comment: "m", keys: ["gió"], order: 150 }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("gió") }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["a", "m", "z"]);
  });
});

describe("getActiveEntries — đệ quy (4.2)", () => {
  it("entry active kéo theo entry khác qua nội dung (đệ quy cấp 1, 2)", () => {
    const entries = [
      makeEntry({ comment: "gốc", keys: ["winterfell"], content: "Winterfell thuộc về Nhà Stark" }),
      makeEntry({ comment: "cấp1", keys: ["nhà stark"], content: "Nhà Stark nuôi sói tuyết" }),
      makeEntry({ comment: "cấp2", keys: ["sói tuyết"], content: "Sói tuyết là linh thú" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("ta về Winterfell") }));
    expect(r.before.map((a) => a.entry.comment).sort()).toEqual(["cấp1", "cấp2", "gốc"]);
    expect(r.before.find((a) => a.entry.comment === "cấp1")?.reason.recursionLevel).toBe(1);
    expect(r.before.find((a) => a.entry.comment === "cấp2")?.reason.recursionLevel).toBe(2);
  });

  it("vòng lặp A↔B không chạy vô hạn (entry đã active không active lại)", () => {
    const entries = [
      makeEntry({ comment: "A", keys: ["alpha"], content: "nhắc tới beta" }),
      makeEntry({ comment: "B", keys: ["beta"], content: "nhắc tới alpha" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("alpha xuất hiện") }));
    expect(r.before.map((a) => a.entry.comment).sort()).toEqual(["A", "B"]);
  });

  it("giới hạn số bước đệ quy (maxRecursionSteps)", () => {
    const entries = [
      makeEntry({ comment: "L0", keys: ["k0"], content: "k1" }),
      makeEntry({ comment: "L1", keys: ["k1"], content: "k2" }),
      makeEntry({ comment: "L2", keys: ["k2"], content: "k3" }),
      makeEntry({ comment: "L3", keys: ["k3"], content: "k4" }),
      makeEntry({ comment: "L4", keys: ["k4"], content: "" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("k0"), maxRecursionSteps: 2 }));
    // pass0: L0; pass1: L1; pass2: L2 — dừng (L3, L4 không vào)
    expect(r.before.map((a) => a.entry.comment).sort()).toEqual(["L0", "L1", "L2"]);
  });

  it("preventRecursion: nội dung entry KHÔNG kích hoạt entry khác", () => {
    const entries = [
      makeEntry({ comment: "gốc", keys: ["winterfell"], content: "Nhà Stark cai trị", preventRecursion: true }),
      makeEntry({ comment: "con", keys: ["nhà stark"], content: "" }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("về winterfell") }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["gốc"]);
  });

  it("excludeRecursion: entry KHÔNG được kích hoạt bởi đệ quy (chỉ text chat)", () => {
    const entries = [
      makeEntry({ comment: "gốc", keys: ["winterfell"], content: "Nhà Stark cai trị" }),
      makeEntry({ comment: "khoá", keys: ["nhà stark"], excludeRecursion: true }),
    ];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("về winterfell") }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["gốc"]);
    // nhưng khớp text chat trực tiếp thì vẫn active
    const r2 = getActiveEntries(entries, makeOpts({ messages: msgs("gặp Nhà Stark ở winterfell") }));
    expect(r2.before.map((a) => a.entry.comment).sort()).toEqual(["gốc", "khoá"]);
  });

  it("delayUntilRecursion: KHÔNG khớp text chat trực tiếp, chỉ active qua đệ quy", () => {
    const entries = [
      makeEntry({ comment: "trễ", keys: ["nhà stark"], delayUntilRecursion: true }),
      makeEntry({ comment: "gốc", keys: ["winterfell"], content: "đất của Nhà Stark" }),
    ];
    // chat nhắc thẳng "nhà stark" nhưng KHÔNG nhắc winterfell → trễ không active
    const r1 = getActiveEntries(entries, makeOpts({ messages: msgs("bàn về nhà stark") }));
    expect(r1.before).toHaveLength(0);
    // chat nhắc winterfell → gốc active → đệ quy kéo trễ vào
    const r2 = getActiveEntries(entries, makeOpts({ messages: msgs("về winterfell") }));
    expect(r2.before.map((a) => a.entry.comment).sort()).toEqual(["gốc", "trễ"]);
  });
});

describe("getActiveEntries — ngân sách token (4.3)", () => {
  it("vượt ngân sách → cắt entry yếu, GIỮ constant + khớp mạnh, có cảnh báo", () => {
    const big = "x".repeat(400); // ~100 token
    const entries = [
      makeEntry({ comment: "const", constant: true, content: big, order: 1 }),
      makeEntry({ comment: "mạnh", keys: ["gió", "bão"], content: big, order: 2 }), // khớp 2 key
      makeEntry({ comment: "yếu", keys: ["gió"], content: big, order: 3 }), // khớp 1 key
    ];
    // budget 250: const (100, giữ bất kể) + mạnh (100) = 200 vừa; yếu (100) → 300 vượt → cắt
    const r = getActiveEntries(
      entries,
      makeOpts({ messages: msgs("gió bão nổi lên"), tokenBudget: 250 }),
    );
    const keptNames = [...r.before].map((a) => a.entry.comment);
    expect(keptNames).toContain("const"); // constant giữ bất kể budget
    expect(keptNames).toContain("mạnh");
    expect(keptNames).not.toContain("yếu");
    expect(r.dropped.map((d) => d.entry.comment)).toEqual(["yếu"]);
    expect(r.warnings.some((w) => w.includes("Ngân sách lore"))).toBe(true);
  });

  it("ignoreBudget giữ lại bất kể ngân sách", () => {
    const big = "x".repeat(4000);
    const entries = [makeEntry({ comment: "vip", keys: ["gió"], content: big, ignoreBudget: true })];
    const r = getActiveEntries(entries, makeOpts({ messages: msgs("gió"), tokenBudget: 10 }));
    expect(r.before.map((a) => a.entry.comment)).toEqual(["vip"]);
    expect(r.dropped).toHaveLength(0);
  });
});
