/**
 * Trigger engine (mục 4.2/4.3): quét keyword theo scan_depth → kích hoạt entry
 * đúng vị trí/thứ tự, đệ quy có giới hạn, ngân sách token có ưu tiên.
 *
 * Đệ quy: pass 0 khớp text chat; pass 1..N khớp NỘI DUNG các entry vừa active
 * ở pass trước (bỏ entry preventRecursion). Entry excludeRecursion chỉ được
 * kích hoạt ở pass 0; delayUntilRecursion chỉ từ pass 1 trở đi. Entry đã
 * active không active lại (chống vòng lặp).
 *
 * Ngân sách: constant + ignoreBudget giữ trước, rồi entry khớp mạnh (nhiều
 * key) hơn, rồi order nhỏ hơn; vượt ngân sách → cắt + log (4.3).
 */
import type { ApiChatMessage } from "../types/connection";
import type { LoreEntry } from "./loreSchema";
import { entryMatches, prepareScanText, type MatchGlobals, type ScanText } from "./loreMatcher";
import { createLogger } from "../lib/log";

const log = createLogger("lore/trigger");

export interface TriggerOptions {
  /** Lịch sử chat, mới nhất ở cuối. */
  messages: ApiChatMessage[];
  rng: () => number;
  /** scan depth mặc định khi entry không tự khai (ST default 4 tin). */
  globalScanDepth?: number;
  /** số bước đệ quy tối đa (spec gợi ý 3). */
  maxRecursionSteps?: number;
  /** ngân sách token cho toàn bộ lore active. */
  tokenBudget: number;
  countTokens: (text: string) => number;
  globals?: Partial<MatchGlobals>;
  /** Era hiện tại — entry có eraIds không chứa era này sẽ bị lọc. */
  eraId?: string;
  /** Năm game hiện tại — entry có appearYear > yearCutoff sẽ bị ẩn. */
  yearCutoff?: number;
}

export interface ActiveLoreEntry {
  entry: LoreEntry;
  tokens: number;
  /** vì sao active — cho debug panel (4.3). */
  reason: {
    constant: boolean;
    matchedKeys: string[];
    recursionLevel: number;
  };
}

export interface TriggerResult {
  before: ActiveLoreEntry[];
  after: ActiveLoreEntry[];
  atDepth: ActiveLoreEntry[];
  /** entry bị cắt vì ngân sách (debug). */
  dropped: { entry: LoreEntry; tokens: number }[];
  warnings: string[];
  totalTokens: number;
}

export function getActiveEntries(entries: LoreEntry[], opts: TriggerOptions): TriggerResult {
  const globalScanDepth = opts.globalScanDepth ?? 4;
  const maxRecursion = opts.maxRecursionSteps ?? 3;
  const globals: MatchGlobals = { caseSensitive: false, matchWholeWords: false, ...opts.globals };
  const warnings: string[] = [];

  const enabled = entries.filter((e) => !e.disabled);

  // ── Era + year filter (chống toàn tri) ──
  const eraFiltered = enabled.filter((e) => {
    // Entry có eraIds → chỉ active nếu era hiện tại nằm trong danh sách
    if (opts.eraId && e.eraIds && e.eraIds.length > 0) {
      if (!e.eraIds.includes(opts.eraId)) return false;
    }
    // Entry có appearYear → chỉ active nếu game year >= appearYear
    if (opts.yearCutoff !== undefined && e.appearYear !== undefined) {
      if (opts.yearCutoff < e.appearYear) return false;
    }
    return true;
  });
  // cache scan text theo depth (join N tin cuối) — chuẩn bị 1 lần cho mọi entry
  const scanCache = new Map<number, ScanText>();
  const chatScanText = (depth: number): ScanText => {
    const d = Math.max(1, depth);
    let cached = scanCache.get(d);
    if (cached === undefined) {
      cached = prepareScanText(opts.messages.slice(-d).map((m) => m.content).join("\n"));
      scanCache.set(d, cached);
    }
    return cached;
  };

  const active = new Map<string, ActiveLoreEntry>(); // uid → active
  let frontier: LoreEntry[] = []; // entry active ở pass hiện tại (nguồn text đệ quy pass sau)

  // ---- pass 0: constant + khớp text chat ----
  for (const e of eraFiltered.slice().sort((a, b) => a.order - b.order)) {
    if (e.constant) {
      active.set(e.uid, { entry: e, tokens: 0, reason: { constant: true, matchedKeys: [], recursionLevel: 0 } });
      frontier.push(e);
      continue;
    }
    if (e.keys.length === 0 || e.delayUntilRecursion) continue;
    const m = entryMatches(e, chatScanText(e.scanDepth ?? globalScanDepth), globals);
    if (!m.matched) continue;
    if (e.probability < 100 && opts.rng() * 100 >= e.probability) continue; // roll trượt
    active.set(e.uid, { entry: e, tokens: 0, reason: { constant: false, matchedKeys: m.matchedKeys, recursionLevel: 0 } });
    frontier.push(e);
  }

  // ---- pass 1..N: đệ quy trên nội dung entry vừa active ----
  // Giới hạn kích thước text đệ quy (lorebook thật có thể kích hoạt hàng trăm
  // entry liên kết chằng chịt → text hàng MB làm treo quét). Key lore hầu như
  // luôn nằm ở phần đầu nội dung nên cắt mỗi entry + tổng là an toàn thực tế.
  const PER_ENTRY_CAP = 2_000;
  const TOTAL_CAP = 150_000;
  for (let level = 1; level <= maxRecursion && frontier.length > 0; level++) {
    let joined = "";
    for (const e of frontier) {
      if (e.preventRecursion) continue;
      joined += e.content.slice(0, PER_ENTRY_CAP) + "\n";
      if (joined.length >= TOTAL_CAP) break;
    }
    const recursionText = prepareScanText(joined.slice(0, TOTAL_CAP));
    if (!recursionText.raw.trim()) break;
    const next: LoreEntry[] = [];
    for (const e of eraFiltered) {
      if (active.has(e.uid)) continue; // chống vòng lặp: không active lại
      if (e.constant || e.keys.length === 0) continue;
      if (e.excludeRecursion) continue; // không được kích hoạt bởi đệ quy
      const m = entryMatches(e, recursionText, globals);
      if (!m.matched) continue;
      if (e.probability < 100 && opts.rng() * 100 >= e.probability) continue;
      active.set(e.uid, { entry: e, tokens: 0, reason: { constant: false, matchedKeys: m.matchedKeys, recursionLevel: level } });
      next.push(e);
    }
    frontier = next;
  }

  // ---- ngân sách token có ưu tiên (4.3) ----
  const all = [...active.values()];
  for (const a of all) a.tokens = opts.countTokens(a.entry.content);

  const prioritized = all.slice().sort((a, b) => {
    const pa = a.entry.constant || a.entry.ignoreBudget ? 0 : 1;
    const pb = b.entry.constant || b.entry.ignoreBudget ? 0 : 1;
    if (pa !== pb) return pa - pb; // constant/ignoreBudget trước
    if (a.reason.matchedKeys.length !== b.reason.matchedKeys.length)
      return b.reason.matchedKeys.length - a.reason.matchedKeys.length; // khớp mạnh trước
    return a.entry.order - b.entry.order;
  });

  const kept = new Set<string>();
  const dropped: { entry: LoreEntry; tokens: number }[] = [];
  let used = 0;
  for (const a of prioritized) {
    if (a.entry.constant || a.entry.ignoreBudget || used + a.tokens <= opts.tokenBudget) {
      kept.add(a.entry.uid);
      used += a.tokens;
    } else {
      dropped.push({ entry: a.entry, tokens: a.tokens });
    }
  }
  if (dropped.length > 0) {
    warnings.push(`Ngân sách lore (${opts.tokenBudget} token): cắt ${dropped.length} entry yếu (giữ ${kept.size})`);
    log.warn(`Cắt ${dropped.length} lore entry vì ngân sách`, dropped.map((d) => d.entry.comment || d.entry.uid));
  }

  // ---- gom theo vị trí, sort theo insertion_order ----
  const final = all.filter((a) => kept.has(a.entry.uid)).sort((a, b) => a.entry.order - b.entry.order);
  return {
    before: final.filter((a) => a.entry.position === "before"),
    after: final.filter((a) => a.entry.position === "after"),
    atDepth: final.filter((a) => a.entry.position === "atDepth"),
    dropped,
    warnings,
    totalTokens: used,
  };
}
