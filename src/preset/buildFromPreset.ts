/**
 * buildFromPreset (3.1b.4) — dựng messages[] cuối cùng từ prompt_order:
 * - đi theo thứ tự prompt_order (enabled), render macro TUẦN TỰ (setvar→getvar đúng chiều)
 * - marker → điền nội dung động (3.1b.2); chatHistory → cắt theo ngân sách token
 * - injection_position=1 → chèn XEN vào lịch sử chat ở injection_depth,
 *   nhiều block cùng depth phân giải bằng injection_order
 * - assistant_prefill → message assistant cuối cùng
 * Trả kèm TRACE từng block cho Prompt Inspector (3.4).
 */
import type { ApiChatMessage } from "../types/connection";
import type { STPreset, STPrompt } from "./presetSchema";
import { pickPromptOrder } from "./presetSchema";
import { isMarkerId, type MarkerSources } from "./markers";
import { renderMacros } from "../prompt/macroEngine";
import type { MacroContext } from "../prompt/macroContext";
import { countTokens } from "../prompt/tokenizer";
import { applyRegexScripts } from "./regexEngine";

export interface BlockTrace {
  identifier: string;
  name: string;
  role: ApiChatMessage["role"];
  kind: "prompt" | "marker" | "injection" | "history" | "prefill";
  tokens: number;
  content: string;
  /** null = block bị bỏ (xem skippedReason). */
  messageIndex: number | null;
  skippedReason?: "disabled" | "empty" | "not_found" | "budget";
  injectedAt?: { depth: number; order: number };
}

export interface BuildResult {
  messages: ApiChatMessage[];
  traces: BlockTrace[];
  warnings: string[];
  totalTokens: number;
  historyIncluded: number;
  historyDropped: number;
  /** true nếu tổng vượt maxContext ngay cả sau khi cắt hết history. */
  overBudget: boolean;
}

/** Injection ngoài preset (vd lore entry atDepth — mục 4.2) chèn xen vào history. */
export interface ExtraInjection {
  content: string;
  role: ApiChatMessage["role"];
  depth: number;
  order: number;
  name: string;
}

export interface BuildOptions {
  ctx: MacroContext;
  sources: MarkerSources;
  /** Toàn bộ lịch sử chat (chưa cắt) — mới nhất ở cuối. */
  history: ApiChatMessage[];
  maxContext: number;
  /** Chỗ chừa cho output (max_tokens) khi tính ngân sách. */
  maxOutputTokens: number;
  /** Injection từ hệ khác (lore atDepth...) — trộn cùng injection của preset. */
  extraInjections?: ExtraInjection[];
}

interface SequentialItem {
  kind: "message" | "historyPlaceholder";
  msg?: ApiChatMessage;
  trace: BlockTrace;
}

interface InjectionItem {
  msg: ApiChatMessage;
  depth: number;
  order: number;
  trace: BlockTrace;
}

const MSG_OVERHEAD_TOKENS = 4; // ước lượng overhead vai trò/định dạng mỗi message

export function buildFromPreset(preset: STPreset, opts: BuildOptions): BuildResult {
  const { ctx, sources, history, maxContext, maxOutputTokens } = opts;
  const warnings: string[] = [];
  const traces: BlockTrace[] = [];
  const byId = new Map<string, STPrompt>(preset.prompts.map((p) => [p.identifier, p]));

  const sequential: SequentialItem[] = [];
  const injections: InjectionItem[] = [];
  let sawHistoryMarker = false;

  // injection ngoài preset (lore atDepth...) — trace riêng, trộn khi splice
  for (const x of opts.extraInjections ?? []) {
    if (!x.content.trim()) continue;
    const trace: BlockTrace = {
      identifier: `(extra) ${x.name}`, name: x.name, role: x.role, kind: "injection",
      tokens: countTokens(x.content), content: x.content, messageIndex: null,
      injectedAt: { depth: x.depth, order: x.order },
    };
    injections.push({ msg: { role: x.role, content: x.content }, depth: x.depth, order: x.order, trace });
    traces.push(trace);
  }

  // ---- Pha A: đi theo prompt_order, render tuần tự ----
  for (const o of pickPromptOrder(preset)) {
    const block = byId.get(o.identifier);
    if (!block) {
      traces.push({
        identifier: o.identifier, name: "(không tìm thấy)", role: "system", kind: "prompt",
        tokens: 0, content: "", messageIndex: null, skippedReason: "not_found",
      });
      warnings.push(`prompt_order tham chiếu identifier không tồn tại: ${o.identifier}`);
      continue;
    }
    if (!o.enabled || !block.enabled) {
      traces.push({
        identifier: block.identifier, name: block.name, role: block.role, kind: block.marker ? "marker" : "prompt",
        tokens: 0, content: "", messageIndex: null, skippedReason: "disabled",
      });
      continue;
    }

    // -- Marker (3.1b.2) --
    if (block.marker || isMarkerId(block.identifier)) {
      if (block.identifier === "chatHistory") {
        sawHistoryMarker = true;
        sequential.push({
          kind: "historyPlaceholder",
          trace: {
            identifier: "chatHistory", name: block.name || "Chat History", role: "system", kind: "history",
            tokens: 0, content: "", messageIndex: null,
          },
        });
        continue;
      }
      if (isMarkerId(block.identifier)) {
        const text = renderMacros(sources[block.identifier as keyof MarkerSources](), ctx);
        pushOrSkip(sequential, traces, block, text, "marker");
        continue;
      }
      // marker=true nhưng identifier lạ → coi như prompt thường content rỗng
      warnings.push(`Marker không nhận diện được: ${block.identifier} — bỏ qua`);
      traces.push({
        identifier: block.identifier, name: block.name, role: block.role, kind: "marker",
        tokens: 0, content: "", messageIndex: null, skippedReason: "not_found",
      });
      continue;
    }

    // -- Prompt thường: render macro theo đúng thứ tự block (3.1b.3) --
    const rendered = renderMacros(block.content, ctx);
    if (block.injection_position === 1) {
      if (rendered.trim()) {
        const trace: BlockTrace = {
          identifier: block.identifier, name: block.name, role: block.role, kind: "injection",
          tokens: countTokens(rendered), content: rendered, messageIndex: null,
          injectedAt: { depth: block.injection_depth, order: block.injection_order },
        };
        injections.push({ msg: { role: block.role, content: rendered }, depth: block.injection_depth, order: block.injection_order, trace });
        traces.push(trace);
      } else {
        traces.push({
          identifier: block.identifier, name: block.name, role: block.role, kind: "injection",
          tokens: 0, content: "", messageIndex: null, skippedReason: "empty",
        });
      }
      continue;
    }
    pushOrSkip(sequential, traces, block, rendered, "prompt");
  }

  // ---- Pha B: ngân sách token cho history ----
  const fixedTokens =
    sequential.reduce((sum, it) => sum + (it.msg ? countTokens(it.msg.content) + MSG_OVERHEAD_TOKENS : 0), 0) +
    injections.reduce((sum, it) => sum + it.trace.tokens + MSG_OVERHEAD_TOKENS, 0);
  const prefillText = preset.assistant_prefill ?? "";
  const prefillTokens = prefillText.trim() ? countTokens(prefillText) + MSG_OVERHEAD_TOKENS : 0;

  let budget = maxContext - maxOutputTokens - fixedTokens - prefillTokens;
  const included: ApiChatMessage[] = [];
  let dropped = 0;
  
  // Áp dụng Regex Scripts của preset (nếu có) vào lịch sử chat
  let workingHistory = history;
  if (preset.extensions?.regex_scripts && preset.extensions.regex_scripts.length > 0) {
    workingHistory = applyRegexScripts(history, preset.extensions.regex_scripts, false);
  }

  for (let i = workingHistory.length - 1; i >= 0; i--) {
    const cost = countTokens(workingHistory[i].content) + MSG_OVERHEAD_TOKENS;
    if (cost <= budget || included.length === 0) {
      // luôn giữ ít nhất tin nhắn mới nhất (kể cả khi vượt — cảnh báo bên dưới)
      included.unshift(workingHistory[i]);
      budget -= cost;
    } else {
      dropped = i + 1;
      break;
    }
  }
  const overBudget = budget < 0;
  if (dropped > 0) {
    warnings.push(`Ngân sách context: đã cắt ${dropped} tin nhắn cũ nhất (giữ ${included.length})`);
  }
  if (overBudget) {
    warnings.push("VƯỢT ngân sách context ngay cả sau khi cắt history — giảm prompt hoặc tăng max context");
  }

  // ---- Pha C: ráp messages cuối — chèn injection vào history theo depth ----
  const historyWithInjections = spliceInjections(included, injections);
  if (!sawHistoryMarker && (included.length > 0 || injections.length > 0)) {
    warnings.push("Preset không có marker chatHistory — lịch sử chat được nối vào CUỐI prompt");
  }

  const messages: ApiChatMessage[] = [];
  const assign = (msg: ApiChatMessage, trace: BlockTrace) => {
    trace.messageIndex = messages.length;
    messages.push(msg);
  };

  for (const item of sequential) {
    if (item.kind === "historyPlaceholder") {
      let histTokens = 0;
      for (const h of historyWithInjections) {
        if (h.trace) {
          assign(h.msg, h.trace);
        } else {
          histTokens += countTokens(h.msg.content) + MSG_OVERHEAD_TOKENS;
          messages.push(h.msg);
        }
      }
      item.trace.tokens = histTokens;
      item.trace.content = `${included.length} tin nhắn (bỏ ${dropped} tin cũ)`;
      item.trace.messageIndex = messages.length - historyWithInjections.length;
      continue;
    }
    if (item.msg) assign(item.msg, item.trace);
  }
  if (!sawHistoryMarker) {
    for (const h of historyWithInjections) {
      if (h.trace) assign(h.msg, h.trace);
      else messages.push(h.msg);
    }
  }

  // ---- assistant_prefill (3.1b.4) ----
  if (prefillText.trim()) {
    const trace: BlockTrace = {
      identifier: "(assistant_prefill)", name: "Assistant Prefill", role: "assistant", kind: "prefill",
      tokens: countTokens(prefillText), content: prefillText, messageIndex: messages.length,
    };
    messages.push({ role: "assistant", content: prefillText });
    traces.push(trace);
  }

  warnings.push(...ctx.warnings);
  const totalTokens = messages.reduce((s, m) => s + countTokens(m.content) + MSG_OVERHEAD_TOKENS, 0);

  return {
    messages,
    traces,
    warnings,
    totalTokens,
    historyIncluded: included.length,
    historyDropped: dropped,
    overBudget: overBudget || totalTokens > maxContext,
  };
}

function pushOrSkip(
  sequential: SequentialItem[],
  traces: BlockTrace[],
  block: STPrompt,
  rendered: string,
  kind: "prompt" | "marker",
): void {
  if (!rendered.trim()) {
    traces.push({
      identifier: block.identifier, name: block.name, role: block.role, kind,
      tokens: 0, content: "", messageIndex: null, skippedReason: "empty",
    });
    return;
  }
  const trace: BlockTrace = {
    identifier: block.identifier, name: block.name, role: block.role, kind,
    tokens: countTokens(rendered), content: rendered, messageIndex: null,
  };
  traces.push(trace);
  sequential.push({ kind: "message", msg: { role: block.role, content: rendered }, trace });
}

/** Chèn extraInjections vào history trần (chế độ KHÔNG preset). */
export function injectIntoHistory(history: ApiChatMessage[], extras: ExtraInjection[]): ApiChatMessage[] {
  const items: InjectionItem[] = extras
    .filter((x) => x.content.trim())
    .map((x) => ({
      msg: { role: x.role, content: x.content },
      depth: x.depth,
      order: x.order,
      trace: {
        identifier: `(extra) ${x.name}`, name: x.name, role: x.role, kind: "injection" as const,
        tokens: 0, content: x.content, messageIndex: null,
        injectedAt: { depth: x.depth, order: x.order },
      },
    }));
  return spliceInjections(history, items).map((s) => s.msg);
}

interface HistorySlot {
  msg: ApiChatMessage;
  trace?: BlockTrace; // slot là injection thì mang trace của nó
}

/**
 * Chèn injection vào history: depth đếm NGƯỢC từ tin mới nhất
 * (depth 0 = sau tin cuối, depth 4 = trước 4 tin cuối). Cùng depth →
 * xếp theo injection_order tăng dần (trên xuống dưới).
 */
function spliceInjections(history: ApiChatMessage[], injections: InjectionItem[]): HistorySlot[] {
  const slots: HistorySlot[] = history.map((msg) => ({ msg }));
  if (injections.length === 0) return slots;

  // gom theo depth, chèn depth SÂU trước (index nhỏ) để index các depth nông không lệch
  const byDepth = new Map<number, InjectionItem[]>();
  for (const inj of injections) {
    const d = Math.max(0, inj.depth);
    const arr = byDepth.get(d) ?? [];
    arr.push(inj);
    byDepth.set(d, arr);
  }
  const depths = [...byDepth.keys()].sort((a, b) => b - a); // sâu → nông
  for (const d of depths) {
    const group = byDepth.get(d)!.sort((a, b) => a.order - b.order);
    const index = Math.max(0, slots.length - countRealMessages(slots, d));
    slots.splice(index, 0, ...group.map((g) => ({ msg: g.msg, trace: g.trace })));
  }
  return slots;
}

/** Tìm index chèn cho depth d: vị trí sao cho còn đúng d MESSAGE THẬT phía sau. */
function countRealMessages(slots: HistorySlot[], depth: number): number {
  if (depth === 0) return 0;
  let real = 0;
  for (let i = slots.length - 1; i >= 0; i--) {
    if (!slots[i].trace) real++; // chỉ đếm message thật, không đếm injection đã chèn
    if (real === depth) return slots.length - i;
  }
  return slots.length; // depth lớn hơn số tin → chèn đầu
}
