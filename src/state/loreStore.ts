/**
 * useLoreStore — quản lý NGUỒN lore (4.3, KHÔNG phải editor):
 * - Nguồn runtime: người dùng import file (Dexie bảng lorebooks, bật/tắt được).
 * - Nguồn bundled: file JSON thả vào src/content/westeros/lore/ được đóng gói
 *   sẵn khi build (import.meta.glob) — "thả đúng chỗ, không sửa code engine".
 * Bản parse cache trong memory; entry gộp mọi nguồn bật qua mergedEntries().
 */
import { create } from "zustand";
import { db, type LorebookRecord } from "./db";
import { genId } from "../lib/id";
import { mergeLorebooks, parseLorebook, type LoreEntry, type ParsedLorebook } from "../lorebook/loreSchema";
import { classifyAtLoad } from "../lorebook/eraClassifier";
import { createLogger } from "../lib/log";

const log = createLogger("loreStore");

// ---- nguồn bundled: content/westeros/lore/*.json (lazy — không block load) ----
const bundledFiles = import.meta.glob("../content/westeros/lore/*.json", {
  eager: false,
  import: "default",
}) as Record<string, () => Promise<unknown>>;

let bundledCache: ParsedLorebook[] | null = null;

async function loadBundled(): Promise<ParsedLorebook[]> {
  if (bundledCache) return bundledCache;
  const entries = Object.entries(bundledFiles);
  if (entries.length === 0) { bundledCache = []; return []; }
  const results: ParsedLorebook[] = [];
  for (const [path, loader] of entries) {
    try {
      const raw = await loader();
      const name = path.split("/").pop()?.replace(/\.json$/i, "") ?? "bundled";
      results.push(parseLorebook(raw, `bundled:${name}`, `[đóng gói] ${name}`));
    } catch (e) {
      log.warn(`Lỗi nạp bundled lore "${path}"`, e);
    }
  }
  bundledCache = results;
  return results;
}

interface LoreState {
  records: LorebookRecord[];
  /** cache bản parse theo record id (memory). */
  parsedCache: Map<string, ParsedLorebook>;
  bundled: ParsedLorebook[];
  /** entry runtime của VÁN hiện tại (lore khởi tạo nhân vật 8.6...) — persist localStorage. */
  sessionEntries: LoreEntry[];
  /** cảnh báo parse + conflict gần nhất (hiện ở tab Lore). */
  warnings: string[];

  refresh: () => Promise<void>;
  importFile: (fileName: string, jsonText: string) => Promise<{ entryCount: number; warnings: string[] }>;
  remove: (id: string) => Promise<void>;
  setEnabled: (id: string, enabled: boolean) => Promise<void>;
  /** Thêm entry runtime cho ván (constant lore khởi tạo — 8.6 bước 2). */
  addSessionEntry: (entry: LoreEntry) => void;
  clearSessionEntries: () => void;
  /** Toàn bộ entry từ mọi nguồn đang bật (bundled + runtime + session). */
  mergedEntries: () => LoreEntry[];
}

const SESSION_LORE_KEY = "asoiaf-session-lore";

function loadSessionEntries(): LoreEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(SESSION_LORE_KEY);
    return raw ? (JSON.parse(raw) as LoreEntry[]) : [];
  } catch {
    return [];
  }
}

export const useLoreStore = create<LoreState>()((set, get) => ({
  records: [],
  parsedCache: new Map(),
  bundled: [],
  sessionEntries: loadSessionEntries(),
  warnings: [],

  refresh: async () => {
    // Nạp bundled lore (lazy, chỉ load lần đầu)
    const bundled = await loadBundled();
    const records = await db.lorebooks.orderBy("name").toArray();
    const cache = new Map<string, ParsedLorebook>();
    const warnings: string[] = [];
    for (const r of records) {
      try {
        const parsed = parseLorebook(JSON.parse(r.rawJson), r.id, r.name);
        cache.set(r.id, parsed);
        warnings.push(...parsed.warnings.map((w) => `[${r.name}] ${w}`));
      } catch (e) {
        warnings.push(`[${r.name}] JSON hỏng: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    set({ records, parsedCache: cache, bundled, warnings });
  },

  importFile: async (fileName, jsonText) => {
    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`File không phải JSON hợp lệ: ${e instanceof Error ? e.message : String(e)}`);
    }
    const id = genId("lore");
    const name = fileName.replace(/\.json$/i, "").trim() || "Lorebook";
    const parsed = parseLorebook(raw, id, name);
    const record: LorebookRecord = {
      id,
      name,
      rawJson: jsonText,
      entryCount: parsed.entries.length,
      enabled: true,
      importedAt: Date.now(),
    };
    await db.lorebooks.put(record);
    const cache = new Map(get().parsedCache);
    cache.set(id, parsed);
    set({
      records: [...get().records.filter((r) => r.id !== id), record].sort((a, b) => a.name.localeCompare(b.name)),
      parsedCache: cache,
      warnings: [...get().warnings, ...parsed.warnings.map((w) => `[${name}] ${w}`)],
    });
    log.info(`Import lorebook "${name}": ${parsed.entries.length} entries, ${parsed.warnings.length} cảnh báo`);
    return { entryCount: parsed.entries.length, warnings: parsed.warnings };
  },

  remove: async (id) => {
    await db.lorebooks.delete(id);
    const cache = new Map(get().parsedCache);
    cache.delete(id);
    set({ records: get().records.filter((r) => r.id !== id), parsedCache: cache });
  },

  setEnabled: async (id, enabled) => {
    await db.lorebooks.update(id, { enabled });
    set({ records: get().records.map((r) => (r.id === id ? { ...r, enabled } : r)) });
  },

  addSessionEntry: (entry) => {
    const sessionEntries = [...get().sessionEntries.filter((e) => e.uid !== entry.uid), entry];
    set({ sessionEntries });
    try {
      globalThis.localStorage?.setItem(SESSION_LORE_KEY, JSON.stringify(sessionEntries));
    } catch {
      /* quota — bỏ qua */
    }
  },

  clearSessionEntries: () => {
    set({ sessionEntries: [] });
    try {
      globalThis.localStorage?.removeItem(SESSION_LORE_KEY);
    } catch {
      /* noop */
    }
  },

  mergedEntries: () => {
    const { records, parsedCache, bundled, sessionEntries } = get();
    const books: ParsedLorebook[] = [
      ...bundled,
      ...records.filter((r) => r.enabled).map((r) => parsedCache.get(r.id)).filter((p): p is ParsedLorebook => !!p),
    ];
    const { entries, conflicts } = mergeLorebooks(books);
    if (conflicts.length > 0) log.debug(`${conflicts.length} khoá trùng giữa các nguồn lore`, conflicts.slice(0, 10));
    return classifyAtLoad([...sessionEntries, ...entries]);
  },
}));
