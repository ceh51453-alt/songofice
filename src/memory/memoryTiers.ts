/**
 * memoryTiers (16bis.1 + 16bis.5) — Hệ thống 4 tầng trí nhớ + phân bổ ngân sách context.
 *
 * T1: State (bắt buộc, không bao giờ cắt)
 * T2: Ký ức bền (NPC memories + lời hứa — chọn lọc theo liên quan)
 * T3: Tóm tắt hồi cố (rolling summaries — 1-2 bản gần/liên quan nhất)
 * T4: Chat thô gần đây (cắt từ cũ nhất khi hết budget)
 *
 * Ngân sách ưu tiên cứng: T1 > T2 > Lore > T3 > T4.
 */
import type { ApiChatMessage } from "../types/connection";
import { countTokens } from "../prompt/tokenizer";

export interface ContextBudgetInput {
  totalBudget: number;          // max_context - max_tokens
  stateBlock: string;           // T1: rendered state
  systemPrompts: string[];      // system directives (MVU rules, tags, etc.)
  memoryBlock: string;          // T2: ký ức bền formatted
  loreMessages: ApiChatMessage[]; // lore before/after + injected
  summaries: string[];          // T3: chapter summaries
  chatHistory: ApiChatMessage[]; // T4: raw chat newest-first
}

export interface ContextBudgetResult {
  /** Messages to include in prompt, ordered. */
  messages: ApiChatMessage[];
  /** Token usage breakdown. */
  usage: {
    system: number;
    state: number;
    memory: number;
    lore: number;
    summaries: number;
    chat: number;
    total: number;
  };
  /** Number of chat messages dropped. */
  chatDropped: number;
  /** Warnings about budget overflow. */
  warnings: string[];
}

/**
 * Phân bổ ngân sách context theo thứ tự ưu tiên cứng (16bis.5).
 * Từ trên xuống: system+state bắt buộc → memory → lore → summaries → chat thô.
 */
export function buildContextBudget(input: ContextBudgetInput): ContextBudgetResult {
  const warnings: string[] = [];
  const messages: ApiChatMessage[] = [];
  let remaining = input.totalBudget;

  const usage = { system: 0, state: 0, memory: 0, lore: 0, summaries: 0, chat: 0, total: 0 };

  // Helper: tính token + 4 (overhead per message)
  const cost = (text: string) => countTokens(text) + 4;

  // ── 1. [BẮT BUỘC] System prompts ──
  for (const sp of input.systemPrompts) {
    const c = cost(sp);
    messages.push({ role: "system", content: sp });
    usage.system += c;
    remaining -= c;
  }

  // ── 2. [BẮT BUỘC] State block (T1) ──
  const stateCost = cost(input.stateBlock);
  messages.push({ role: "system", content: input.stateBlock });
  usage.state = stateCost;
  remaining -= stateCost;

  if (remaining < 0) {
    warnings.push("NGUY HIỂM: State + System đã vượt ngân sách context");
  }

  // ── 3. [CAO] Ký ức bền (T2) ──
  if (input.memoryBlock && remaining > 0) {
    const memCost = cost(input.memoryBlock);
    if (memCost <= remaining) {
      messages.push({ role: "system", content: input.memoryBlock });
      usage.memory = memCost;
      remaining -= memCost;
    } else {
      // Truncate nếu quá lớn — vẫn chèn phần đầu
      const truncated = input.memoryBlock.slice(0, Math.floor(remaining * 3)); // rough char estimate
      const truncCost = cost(truncated);
      messages.push({ role: "system", content: truncated });
      usage.memory = truncCost;
      remaining -= truncCost;
      warnings.push("Ký ức bền bị cắt bớt do ngân sách hạn chế");
    }
  }

  // ── 4. [CAO] Lore ──
  for (const loreMsg of input.loreMessages) {
    if (remaining <= 0) break;
    const loreCost = cost(loreMsg.content);
    if (loreCost <= remaining) {
      messages.push(loreMsg);
      usage.lore += loreCost;
      remaining -= loreCost;
    }
  }

  // ── 5. [TRUNG] Tóm tắt hồi cố (T3) ──
  for (const summary of input.summaries.slice(0, 2)) { // tối đa 2 bản gần nhất
    if (remaining <= 0) break;
    const sumCost = cost(summary);
    if (sumCost <= remaining) {
      messages.push({ role: "system", content: `[Tóm tắt chương trước]\n${summary}` });
      usage.summaries += sumCost;
      remaining -= sumCost;
    }
  }

  // ── 6. [THẤP] Chat thô (T4) — nhồi từ mới nhất, cắt cũ ──
  let chatDropped = 0;
  const chatIncluded: ApiChatMessage[] = [];
  // chatHistory is newest-first; include from newest
  for (const msg of input.chatHistory) {
    if (remaining <= 0) break;
    const chatCost = cost(msg.content);
    if (chatCost <= remaining || chatIncluded.length === 0) {
      chatIncluded.unshift(msg); // restore chronological order
      usage.chat += chatCost;
      remaining -= chatCost;
    } else {
      chatDropped++;
    }
  }
  chatDropped += Math.max(0, input.chatHistory.length - chatIncluded.length - chatDropped);
  messages.push(...chatIncluded);

  usage.total = usage.system + usage.state + usage.memory + usage.lore + usage.summaries + usage.chat;

  return { messages, usage, chatDropped, warnings };
}
