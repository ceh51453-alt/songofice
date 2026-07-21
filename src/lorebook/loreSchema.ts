/**
 * Parse lorebook người dùng cung cấp (mục 4.1/4.3) — hỗ trợ 2 định dạng:
 *  1. ST world_info:      { entries: { "<uid>": {...} }, name? }   (field: key, keysecondary, order, position SỐ...)
 *  2. character_book/4.1: { entries: [ {...} ] }                    (field: keys, secondary_keys, insertion_order, position CHỮ...)
 * Chuẩn hoá về LoreEntry nội bộ. FAIL MỀM: entry lỗi bị loại từng cái + cảnh báo.
 */
import { z } from "zod";

/** Logic khoá phụ (ST selectiveLogic số → tên). */
export type SelectiveLogic = "AND_ANY" | "NOT_ALL" | "NOT_ANY" | "AND_ALL";

export type LorePosition = "before" | "after" | "atDepth";

export interface LoreEntry {
  /** uid nội bộ duy nhất toàn cục: `${sourceId}#${uid gốc}`. */
  uid: string;
  sourceId: string;
  sourceName: string;
  keys: string[];
  secondaryKeys: string[];
  content: string;
  comment: string;
  constant: boolean;
  selective: boolean;
  selectiveLogic: SelectiveLogic;
  /** insertion_order — thứ tự chèn vào prompt (tăng dần). */
  order: number;
  position: LorePosition;
  /** chỉ dùng khi position = atDepth. */
  depth: number;
  role: "system" | "user" | "assistant";
  disabled: boolean;
  /** 0-100; useProbability=false → 100. */
  probability: number;
  /** Không được kích hoạt BỞI đệ quy (chỉ khớp text chat thật). */
  excludeRecursion: boolean;
  /** Nội dung entry này KHÔNG kích hoạt entry khác. */
  preventRecursion: boolean;
  /** CHỈ kích hoạt trong bước đệ quy (không khớp text chat trực tiếp). */
  delayUntilRecursion: boolean;
  /** null = dùng scan depth toàn cục. */
  scanDepth: number | null;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  /** Bỏ qua ngân sách token (ST ignoreBudget). */
  ignoreBudget: boolean;
  /** Era mà entry thuộc về — undefined/[] = global (hiện mọi era). */
  eraIds?: string[];
  /** Năm AC mà nhân vật/sự kiện "xuất hiện" — entry ẩn nếu game year < appearYear. */
  appearYear?: number;
}

const bool = (def: boolean) => z.coerce.boolean().prefault(def);
const numOrNull = z.union([z.coerce.number(), z.null()]).prefault(null);
const boolOrNull = z.union([z.boolean(), z.null()]).prefault(null);

/** Entry định dạng ST world_info (field như file thật). */
const StWorldInfoEntrySchema = z
  .object({
    uid: z.coerce.number().optional(),
    key: z.array(z.coerce.string()).prefault([]),
    keysecondary: z.array(z.coerce.string()).prefault([]),
    content: z.coerce.string().prefault(""),
    comment: z.coerce.string().prefault(""),
    constant: bool(false),
    selective: bool(true),
    selectiveLogic: z.coerce.number().prefault(0),
    order: z.coerce.number().prefault(100),
    position: z.coerce.number().prefault(0), // 0 before, 1 after, 2/3 AN (map→after), 4 atDepth
    depth: z.coerce.number().prefault(4),
    role: z.union([z.coerce.number(), z.null()]).prefault(0), // 0 system, 1 user, 2 assistant
    disable: bool(false),
    probability: z.coerce.number().prefault(100),
    useProbability: bool(true),
    excludeRecursion: bool(false),
    preventRecursion: bool(false),
    delayUntilRecursion: z.union([z.boolean(), z.coerce.number()]).prefault(false), // ST cho phép số (level)
    scanDepth: numOrNull,
    caseSensitive: boolOrNull,
    matchWholeWords: boolOrNull,
    ignoreBudget: bool(false),
  })
  .passthrough();

/** Entry định dạng character_book / spec 4.1 (field chữ). */
const CharacterBookEntrySchema = z
  .object({
    id: z.coerce.number().optional(),
    keys: z.array(z.coerce.string()).prefault([]),
    secondary_keys: z.array(z.coerce.string()).prefault([]),
    content: z.coerce.string().prefault(""),
    comment: z.coerce.string().prefault(""),
    constant: bool(false),
    selective: bool(true),
    selectiveLogic: z.union([z.coerce.number(), z.enum(["AND", "AND_ANY", "NOT_ALL", "NOT_ANY", "AND_ALL", "OR"])]).prefault(0),
    insertion_order: z.coerce.number().prefault(100),
    position: z.enum(["before_char", "after_char", "at_depth", "before", "after"]).prefault("before_char"),
    depth: z.coerce.number().prefault(4),
    enabled: bool(true),
    probability: z.coerce.number().prefault(100),
    case_sensitive: boolOrNull,
    excludeRecursion: bool(false),
    preventRecursion: bool(false),
    scan_depth: numOrNull,
  })
  .passthrough();

function mapLogic(v: number | string): SelectiveLogic {
  if (typeof v === "string") {
    if (v === "AND" || v === "AND_ANY" || v === "OR") return "AND_ANY";
    return (["NOT_ALL", "NOT_ANY", "AND_ALL"] as const).find((x) => x === v) ?? "AND_ANY";
  }
  return ([0, 1, 2, 3].includes(v) ? (["AND_ANY", "NOT_ALL", "NOT_ANY", "AND_ALL"] as const)[v] : "AND_ANY");
}

function mapStPosition(p: number): LorePosition {
  if (p === 4) return "atDepth";
  if (p === 0) return "before";
  return "after"; // 1 after; 2/3 (authors note) không có AN riêng → gộp after
}

function mapRole(r: number | null): "system" | "user" | "assistant" {
  return r === 1 ? "user" : r === 2 ? "assistant" : "system";
}

export interface ParsedLorebook {
  name: string;
  entries: LoreEntry[];
  warnings: string[];
}

/** Parse mềm 1 file lorebook (2 định dạng), gắn sourceId/sourceName. */
export function parseLorebook(raw: unknown, sourceId: string, fallbackName: string): ParsedLorebook {
  const warnings: string[] = [];
  const entries: LoreEntry[] = [];

  if (typeof raw !== "object" || raw === null) {
    return { name: fallbackName, entries, warnings: ["File không phải object JSON — lorebook rỗng"] };
  }
  const obj = raw as Record<string, unknown>;
  // character card V2 bọc trong data.character_book
  const book =
    (obj.character_book as Record<string, unknown> | undefined) ??
    ((obj.data as Record<string, unknown> | undefined)?.character_book as Record<string, unknown> | undefined) ??
    obj;
  const name = typeof book.name === "string" && book.name ? book.name : fallbackName;
  const rawEntries = book.entries;

  const pushSt = (e: unknown, fallbackUid: string) => {
    const r = StWorldInfoEntrySchema.safeParse(e);
    if (!r.success) {
      warnings.push(`Bỏ entry lỗi (uid ${fallbackUid}): ${r.error.issues[0]?.message ?? "?"}`);
      return;
    }
    const d = r.data;
    const ext = (d as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
    const eraIds = Array.isArray(ext?.asoiaf_era) ? (ext.asoiaf_era as string[]) : undefined;
    const appearYear = typeof ext?.asoiaf_year_appear === "number" ? ext.asoiaf_year_appear : undefined;
    entries.push({
      uid: `${sourceId}#${d.uid ?? fallbackUid}`,
      sourceId,
      sourceName: name,
      keys: d.key.filter(Boolean),
      secondaryKeys: d.keysecondary.filter(Boolean),
      content: d.content,
      comment: d.comment,
      constant: d.constant,
      selective: d.selective,
      selectiveLogic: mapLogic(d.selectiveLogic),
      order: d.order,
      position: mapStPosition(d.position),
      depth: d.depth,
      role: mapRole(d.role),
      disabled: d.disable,
      probability: d.useProbability ? d.probability : 100,
      excludeRecursion: d.excludeRecursion,
      preventRecursion: d.preventRecursion,
      delayUntilRecursion: Boolean(d.delayUntilRecursion),
      scanDepth: d.scanDepth,
      caseSensitive: d.caseSensitive,
      matchWholeWords: d.matchWholeWords,
      ignoreBudget: d.ignoreBudget,
      eraIds,
      appearYear,
    });
  };

  const pushCb = (e: unknown, fallbackUid: string) => {
    const r = CharacterBookEntrySchema.safeParse(e);
    if (!r.success) {
      warnings.push(`Bỏ entry lỗi (#${fallbackUid}): ${r.error.issues[0]?.message ?? "?"}`);
      return;
    }
    const d = r.data;
    const ext = (d as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
    const eraIds = Array.isArray(ext?.asoiaf_era) ? (ext.asoiaf_era as string[]) : undefined;
    const appearYear = typeof ext?.asoiaf_year_appear === "number" ? ext.asoiaf_year_appear : undefined;
    entries.push({
      uid: `${sourceId}#${d.id ?? fallbackUid}`,
      sourceId,
      sourceName: name,
      keys: d.keys.filter(Boolean),
      secondaryKeys: d.secondary_keys.filter(Boolean),
      content: d.content,
      comment: d.comment,
      constant: d.constant,
      selective: d.selective,
      selectiveLogic: mapLogic(d.selectiveLogic),
      order: d.insertion_order,
      position: d.position === "after_char" || d.position === "after" ? "after" : d.position === "at_depth" ? "atDepth" : "before",
      depth: d.depth,
      role: "system",
      disabled: !d.enabled,
      probability: d.probability,
      excludeRecursion: d.excludeRecursion,
      preventRecursion: d.preventRecursion,
      delayUntilRecursion: false,
      scanDepth: d.scan_depth,
      caseSensitive: d.case_sensitive,
      matchWholeWords: null,
      ignoreBudget: false,
      eraIds,
      appearYear,
    });
  };

  if (Array.isArray(rawEntries)) {
    // định dạng array → nhận diện field để chọn schema (keys vs key)
    rawEntries.forEach((e, i) => {
      const isSt = typeof e === "object" && e !== null && "key" in e && !("keys" in e);
      if (isSt) pushSt(e, String(i));
      else pushCb(e, String(i));
    });
  } else if (typeof rawEntries === "object" && rawEntries !== null) {
    // định dạng ST world_info: object keyed by uid
    for (const [uid, e] of Object.entries(rawEntries)) {
      pushSt(e, uid);
    }
  } else {
    warnings.push("Không tìm thấy trường entries — lorebook rỗng");
  }

  return { name, entries, warnings };
}

/**
 * Gộp nhiều nguồn lore (4.3): nối entry, giữ nguyên order từng entry (đã là
 * insertion_order chuẩn); trùng KHOÁ CHÍNH giữa các nguồn → log để dev biết
 * (xử lý cuối cùng vẫn theo insertion_order khi ghép prompt).
 */
export function mergeLorebooks(books: ParsedLorebook[]): { entries: LoreEntry[]; conflicts: string[] } {
  const entries: LoreEntry[] = [];
  const keyOwner = new Map<string, string>(); // key thường hoá → sourceName đầu tiên
  const conflicts: string[] = [];
  for (const b of books) {
    for (const e of b.entries) {
      entries.push(e);
      for (const k of e.keys) {
        const norm = k.trim().toLowerCase();
        if (!norm) continue;
        const owner = keyOwner.get(norm);
        if (owner === undefined) keyOwner.set(norm, b.name);
        else if (owner !== b.name) conflicts.push(`Khoá "${k}" xuất hiện ở cả "${owner}" và "${b.name}" — phân giải theo insertion_order`);
      }
    }
  }
  return { entries, conflicts };
}
