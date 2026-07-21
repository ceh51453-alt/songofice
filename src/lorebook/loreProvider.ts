/**
 * Cầu nối lore → prompt pipeline (4.3 + 5.7.2): mỗi lượt build,
 * 1) trigger engine chọn entry active theo history,
 * 2) EJS render nội dung (getvar đọc state, getwi nạp entry con),
 * 3) trả text before/after + injection atDepth cho buildFromPreset.
 * Giữ debug info lượt gần nhất cho debug panel ẩn (bật verbose logging).
 */
import type { ApiChatMessage } from "../types/connection";
import { getActiveEntries, type TriggerResult } from "./loreTrigger";
import { renderLoreContent, type EjsBridge } from "./ejsEngine";
import type { LoreEntry } from "./loreSchema";
import { useLoreStore } from "../state/loreStore";
import { useVariablesStore } from "../state/variablesStore";
import { useMvuStore, currentSeedInfo } from "../state/mvuStore";
import { streamRng } from "../probability/rng";
import { countTokens } from "../prompt/tokenizer";

export interface LoreBuildResult {
  before: string;
  after: string;
  /** entry atDepth → chèn xen vào history như injection preset (7.9 của 3.1b.4). */
  depthInjections: { content: string; role: "system" | "user" | "assistant"; depth: number; order: number; name: string }[];
  warnings: string[];
  /** debug cho panel ẩn. */
  debug: LoreDebugInfo | null;
}

export interface LoreDebugInfo {
  activeCount: number;
  totalTokens: number;
  entries: { comment: string; position: string; order: number; constant: boolean; matchedKeys: string[]; recursionLevel: number; tokens: number }[];
  dropped: { comment: string; tokens: number }[];
}

/** Debug info lượt build gần nhất — đọc bởi debug panel (không persist). */
let lastDebug: LoreDebugInfo | null = null;
export function getLastLoreDebug(): LoreDebugInfo | null {
  return lastDebug;
}

/**
 * getvar cho EJS (5.5b + 5.7.2): path "stat_data.*" đọc THẲNG MVU store
 * (nguồn chân lý — "lore đọc được state qua EJS"); key khác đọc biến preset.
 */
function makeGetvar(): EjsBridge["getvar"] {
  const vars = useVariablesStore.getState();
  const mvu = useMvuStore.getState();
  return (path, opts) => {
    if (path.startsWith("stat_data.")) {
      const v = mvu.getByPath(path);
      return v === undefined ? opts?.defaults : v;
    }
    const direct = vars.getChat(path);
    if (direct !== "") return coerce(direct);
    return opts?.defaults;
  };
}

/** Biến lưu dạng string — EJS thường so sánh số, thử ép số khi hợp lệ. */
function coerce(v: string): unknown {
  if (v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return v;
}

export async function getLoreForBuild(history: ApiChatMessage[], maxContext: number): Promise<LoreBuildResult> {
  const entries = useLoreStore.getState().mergedEntries();
  if (entries.length === 0) {
    lastDebug = null;
    return { before: "", after: "", depthInjections: [], warnings: [], debug: null };
  }

  // ngân sách lore: 25% context (4.3 "không vượt X% context budget")
  const tokenBudget = Math.max(1000, Math.floor(maxContext * 0.25));
  const { rootSeed, turnCount } = currentSeedInfo();
  const mvu = useMvuStore.getState();
  const eraId = mvu.stat["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const currentYear = mvu.stat["Thế Giới"]["Năm"];
  const result: TriggerResult = getActiveEntries(entries, {
    messages: history,
    // RNG seedable stream "lore" (5bis.1) — reroll cùng lượt cho cùng entry roll
    rng: streamRng(rootSeed, turnCount, "lore"),
    tokenBudget,
    countTokens,
    eraId: eraId || undefined,
    yearCutoff: currentYear,
  });

  const warnings = [...result.warnings];
  const findEntry = (name: string): LoreEntry | undefined =>
    entries.find((e) => e.comment === name) ?? entries.find((e) => e.comment.includes(name));
  const bridge: EjsBridge = { getvar: makeGetvar(), findEntry };

  // EJS render từng entry active (5.5b) — lỗi 1 entry không sập cả prompt
  const renderGroup = async (group: typeof result.before): Promise<string[]> =>
    Promise.all(group.map((a) => renderLoreContent(a.entry.content, bridge, warnings, a.entry.comment || a.entry.uid)));

  const [beforeTexts, afterTexts, depthTexts] = await Promise.all([
    renderGroup(result.before),
    renderGroup(result.after),
    renderGroup(result.atDepth),
  ]);

  lastDebug = {
    activeCount: result.before.length + result.after.length + result.atDepth.length,
    totalTokens: result.totalTokens,
    entries: [...result.before, ...result.after, ...result.atDepth].map((a) => ({
      comment: a.entry.comment || a.entry.uid,
      position: a.entry.position,
      order: a.entry.order,
      constant: a.reason.constant,
      matchedKeys: a.reason.matchedKeys,
      recursionLevel: a.reason.recursionLevel,
      tokens: a.tokens,
    })),
    dropped: result.dropped.map((d) => ({ comment: d.entry.comment || d.entry.uid, tokens: d.tokens })),
  };

  return {
    before: beforeTexts.filter((t) => t.trim()).join("\n"),
    after: afterTexts.filter((t) => t.trim()).join("\n"),
    depthInjections: result.atDepth
      .map((a, i) => ({
        content: depthTexts[i],
        role: a.entry.role,
        depth: a.entry.depth,
        order: a.entry.order,
        name: a.entry.comment || a.entry.uid,
      }))
      .filter((d) => d.content.trim()),
    warnings,
    debug: lastDebug,
  };
}
