/**
 * Matcher keyword cho lorebook (mục 4.2):
 * - Key thường: substring bằng indexOf (nhanh trên text lớn), tuỳ chọn
 *   case-sensitive + whole-word. Whole-word kiểm tra biên bằng ký tự UNICODE
 *   (\p{L}\p{N}_) vì \b của JS chỉ hiểu ASCII — bắt buộc cho tiếng Việt có dấu
 *   ("quan" không được khớp trong "quản").
 * - Key regex kiểu ST: chuỗi dạng "/pattern/flags" (compile 1 lần, cache).
 * - selectiveLogic 4 kiểu (khoá phụ): AND_ANY / NOT_ALL / NOT_ANY / AND_ALL.
 *
 * Hiệu năng: text quét chuẩn bị 1 lần (ScanText), regex key cache module-level
 * — cần thiết vì lorebook thật ~800 entries × nhiều key quét mỗi lượt.
 */
import type { LoreEntry, SelectiveLogic } from "./loreSchema";

export interface MatchGlobals {
  caseSensitive: boolean;
  matchWholeWords: boolean;
}

/** Text quét đã chuẩn bị — tạo 1 lần, dùng cho mọi entry. */
export interface ScanText {
  raw: string;
  lower: string;
}

export function prepareScanText(raw: string): ScanText {
  return { raw, lower: raw.toLowerCase() };
}

const REGEX_KEY = /^\/(.+)\/([a-z]*)$/s;
const regexCache = new Map<string, RegExp | null>();
const WORD_CHAR = /[\p{L}\p{N}_]/u;

function getRegexKey(key: string): RegExp | null | undefined {
  if (!key.startsWith("/")) return undefined;
  let cached = regexCache.get(key);
  if (cached === undefined) {
    const m = REGEX_KEY.exec(key);
    if (!m) return undefined; // không phải dạng /…/flags → key thường
    try {
      cached = new RegExp(m[1], m[2]);
    } catch {
      cached = null; // regex hỏng — cache null để không thử lại
    }
    regexCache.set(key, cached);
  }
  return cached;
}

/** Tìm needle trong haystack với biên từ unicode hai đầu (indexOf loop — nhanh). */
function wholeWordIncludes(haystack: string, needle: string): boolean {
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    const before = i > 0 ? haystack[i - 1] : "";
    const afterIdx = i + needle.length;
    const after = afterIdx < haystack.length ? haystack[afterIdx] : "";
    if ((before === "" || !WORD_CHAR.test(before)) && (after === "" || !WORD_CHAR.test(after))) return true;
    i += 1;
  }
  return false;
}

/** 1 key có khớp trong text không. */
export function keyMatches(key: string, text: ScanText, caseSensitive: boolean, wholeWords: boolean): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;

  const rx = getRegexKey(trimmed);
  if (rx !== undefined) {
    return rx === null ? false : rx.test(text.raw);
  }

  const hay = caseSensitive ? text.raw : text.lower;
  const needle = caseSensitive ? trimmed : trimmed.toLowerCase();
  return wholeWords ? wholeWordIncludes(hay, needle) : hay.includes(needle);
}

export interface EntryMatchResult {
  matched: boolean;
  matchedKeys: string[];
}

/** Khớp 1 entry với scan text: khoá chính (ANY) + khoá phụ theo selectiveLogic. */
export function entryMatches(entry: LoreEntry, scanText: ScanText, globals: MatchGlobals): EntryMatchResult {
  const cs = entry.caseSensitive ?? globals.caseSensitive;
  const ww = entry.matchWholeWords ?? globals.matchWholeWords;

  const matchedKeys = entry.keys.filter((k) => keyMatches(k, scanText, cs, ww));
  if (matchedKeys.length === 0) return { matched: false, matchedKeys: [] };

  // khoá phụ (chỉ khi selective + có secondary keys)
  if (entry.selective && entry.secondaryKeys.length > 0) {
    const secondaryHits = entry.secondaryKeys.filter((k) => keyMatches(k, scanText, cs, ww));
    if (!secondaryLogicOk(entry.selectiveLogic, secondaryHits.length, entry.secondaryKeys.length)) {
      return { matched: false, matchedKeys: [] };
    }
    matchedKeys.push(...secondaryHits);
  }
  return { matched: true, matchedKeys };
}

function secondaryLogicOk(logic: SelectiveLogic, hits: number, total: number): boolean {
  switch (logic) {
    case "AND_ANY":
      return hits > 0; // ít nhất 1 khoá phụ
    case "AND_ALL":
      return hits === total; // đủ mọi khoá phụ
    case "NOT_ANY":
      return hits === 0; // không khoá phụ nào xuất hiện
    case "NOT_ALL":
      return hits < total; // không được đủ hết
  }
}
