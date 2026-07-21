import { describe, expect, it } from "vitest";
import { entryMatches, keyMatches as keyMatchesRaw, prepareScanText } from "./loreMatcher";
import type { LoreEntry } from "./loreSchema";

/** wrapper giữ chữ ký cũ cho test dễ đọc. */
const keyMatches = (key: string, text: string, cs: boolean, ww: boolean) =>
  keyMatchesRaw(key, prepareScanText(text), cs, ww);

function makeEntry(partial: Partial<LoreEntry>): LoreEntry {
  return {
    uid: "t#1", sourceId: "t", sourceName: "test",
    keys: [], secondaryKeys: [], content: "", comment: "",
    constant: false, selective: true, selectiveLogic: "AND_ANY",
    order: 100, position: "before", depth: 4, role: "system",
    disabled: false, probability: 100,
    excludeRecursion: false, preventRecursion: false, delayUntilRecursion: false,
    scanDepth: null, caseSensitive: null, matchWholeWords: null, ignoreBudget: false,
    ...partial,
  };
}

const GLOBALS = { caseSensitive: false, matchWholeWords: false };

describe("keyMatches", () => {
  it("substring không phân biệt hoa thường (mặc định)", () => {
    expect(keyMatches("winterfell", "Ngươi tới WINTERFELL lúc chiều", false, false)).toBe(true);
    expect(keyMatches("Winterfell", "không có gì ở đây", false, false)).toBe(false);
  });

  it("case-sensitive khi bật", () => {
    expect(keyMatches("Stark", "nhà stark phương bắc", true, false)).toBe(false);
    expect(keyMatches("Stark", "nhà Stark phương bắc", true, false)).toBe(true);
  });

  it("whole-word với biên UNICODE — tiếng Việt có dấu không khớp nhầm", () => {
    // "quan" KHÔNG được khớp trong "quản lý" (ả là chữ cái unicode)
    expect(keyMatches("quan", "hắn lo việc quản lý", false, true)).toBe(false);
    expect(keyMatches("quan", "một vị quan trong triều", false, true)).toBe(true);
    // biên với chữ thường ASCII
    expect(keyMatches("sói", "tiếng sói tru", false, true)).toBe(true);
    expect(keyMatches("essos", "tới essosia", false, true)).toBe(false);
  });

  it("key regex kiểu ST /pattern/flags", () => {
    expect(keyMatches("/winter(fell)?/i", "WinterFELL đây rồi", false, false)).toBe(true);
    expect(keyMatches("/^bắt đầu/", "bắt đầu hành trình", false, false)).toBe(true);
    expect(keyMatches("/[regex hỏng/", "text", false, false)).toBe(false); // không crash
  });
});

describe("entryMatches — selectiveLogic 4 kiểu", () => {
  const text = prepareScanText("Jon Snow rời Winterfell lên Trường Thành cùng Sam");

  it("khoá chính: ANY — 1 key khớp là đủ", () => {
    const e = makeEntry({ keys: ["Winterfell", "King's Landing"] });
    const r = entryMatches(e, text, GLOBALS);
    expect(r.matched).toBe(true);
    expect(r.matchedKeys).toEqual(["Winterfell"]);
  });

  it("AND_ANY: chính + ít nhất 1 khoá phụ", () => {
    const e = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon", "Arya"], selectiveLogic: "AND_ANY" });
    expect(entryMatches(e, text, GLOBALS).matched).toBe(true);
    const e2 = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Arya", "Bran"], selectiveLogic: "AND_ANY" });
    expect(entryMatches(e2, text, GLOBALS).matched).toBe(false);
  });

  it("AND_ALL: chính + đủ MỌI khoá phụ", () => {
    const ok = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon", "Sam"], selectiveLogic: "AND_ALL" });
    expect(entryMatches(ok, text, GLOBALS).matched).toBe(true);
    const fail = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon", "Arya"], selectiveLogic: "AND_ALL" });
    expect(entryMatches(fail, text, GLOBALS).matched).toBe(false);
  });

  it("NOT_ANY: chính + KHÔNG khoá phụ nào có mặt", () => {
    const ok = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Cersei", "Tywin"], selectiveLogic: "NOT_ANY" });
    expect(entryMatches(ok, text, GLOBALS).matched).toBe(true);
    const fail = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon"], selectiveLogic: "NOT_ANY" });
    expect(entryMatches(fail, text, GLOBALS).matched).toBe(false);
  });

  it("NOT_ALL: chính + không được ĐỦ HẾT khoá phụ", () => {
    const ok = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon", "Arya"], selectiveLogic: "NOT_ALL" });
    expect(entryMatches(ok, text, GLOBALS).matched).toBe(true); // chỉ Jon có mặt → chưa đủ hết
    const fail = makeEntry({ keys: ["Winterfell"], secondaryKeys: ["Jon", "Sam"], selectiveLogic: "NOT_ALL" });
    expect(entryMatches(fail, text, GLOBALS).matched).toBe(false); // đủ cả 2 → loại
  });

  it("không khớp khoá chính → thua luôn, bất kể khoá phụ", () => {
    const e = makeEntry({ keys: ["Dorne"], secondaryKeys: ["Jon"], selectiveLogic: "AND_ANY" });
    expect(entryMatches(e, text, GLOBALS).matched).toBe(false);
  });
});
