/**
 * rollingSummarization (16bis.2) — Tóm tắt lũy tiến hội thoại cũ:
 * - Kiểm tra ngưỡng token chưa tóm tắt
 * - Sinh prompt cho AI call phụ tóm tắt
 * - Parse kết quả thành ChapterSummary
 * - Gộp summaries cấp 1 thành cấp 2 (hierarchical)
 */
import type { ChapterSummary } from "./chapterSummaryStore";
import type { ApiChatMessage } from "../types/connection";
import { countTokens } from "../prompt/tokenizer";

// ── Constants ────────────────────────────────────────────────────────────────

/** Ngưỡng token chưa tóm tắt trước khi kích hoạt summarization. */
const SUMMARIZE_THRESHOLD = 4000;
/** Số summaries cấp 1 trước khi gộp thành cấp 2. */
const MERGE_THRESHOLD = 5;

// ── Should Summarize ─────────────────────────────────────────────────────────

/**
 * Kiểm tra xem có nên chạy tóm tắt không.
 * @param unsummarizedMessages — tin nhắn chưa được tóm tắt
 */
export function shouldSummarize(unsummarizedMessages: ApiChatMessage[]): boolean {
  const totalTokens = unsummarizedMessages.reduce(
    (sum, msg) => sum + countTokens(msg.content),
    0,
  );
  return totalTokens >= SUMMARIZE_THRESHOLD;
}

// ── Build Summarization Prompt ───────────────────────────────────────────────

/**
 * Sinh prompt cho AI call phụ tóm tắt đoạn hội thoại.
 * AI trả về 5-10 gạch đầu dòng + khối mvu_update nếu có dữ kiện mới.
 */
export function buildSummarizationPrompt(messages: ApiChatMessage[]): string {
  const conversation = messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n\n");

  return `Tóm tắt đoạn truyện sau thành 5-10 gạch đầu dòng. GIỮ:
- Ai xuất hiện (tên NPC đầy đủ)
- Quyết định quan trọng người chơi đã ra
- Thay đổi quan hệ (hảo cảm tăng/giảm, phản bội, kết minh)
- Lời hứa/đe doạ đã nói
- Vật phẩm/thông tin then chốt thu được
- Diễn biến cốt truyện (ai chết, ai bị bắt, chiến tranh bùng nổ...)

BỎ: mô tả rườm rà, đối thoại xã giao, miêu tả cảnh vật dài dòng.
KHÔNG bịa chi tiết không có trong đoạn.
Viết ở thì quá khứ, ngôi thứ ba.

---
${conversation}
---

Trả lời theo format:
## Tóm Tắt
- (gạch đầu dòng 1)
- (gạch đầu dòng 2)
...

## NPC Liên Quan
(danh sách tên NPC đã xuất hiện, phân cách bằng dấu phẩy)`;
}

// ── Parse Response ───────────────────────────────────────────────────────────

/**
 * Parse kết quả tóm tắt từ AI thành ChapterSummary.
 */
export function parseSummaryResponse(
  response: string,
  turnStart: number,
  turnEnd: number,
  year: number,
): ChapterSummary {
  // Extract NPC names
  const npcMatch = response.match(/## NPC Liên Quan\s*\n(.*)/i);
  const npcNames = npcMatch
    ? npcMatch[1].split(",").map((n) => n.trim()).filter(Boolean)
    : [];

  // Extract summary content (everything between ## Tóm Tắt and ## NPC)
  const summaryMatch = response.match(/## Tóm Tắt\s*\n([\s\S]*?)(?=## NPC|$)/i);
  const content = summaryMatch
    ? summaryMatch[1].trim()
    : response.trim(); // fallback: dùng toàn bộ response

  return {
    id: `summary-${turnStart}-${turnEnd}`,
    turnRange: [turnStart, turnEnd],
    year,
    content,
    npcRelated: npcNames,
    level: 1,
    createdAt: Date.now(),
  };
}

// ── Merge (Hierarchical) ────────────────────────────────────────────────────

/**
 * Kiểm tra xem có nên gộp summaries cấp 1 thành cấp 2 không.
 */
export function shouldMerge(summaries: ChapterSummary[]): boolean {
  const level1 = summaries.filter((s) => s.level === 1);
  return level1.length >= MERGE_THRESHOLD;
}

/**
 * Sinh prompt gộp nhiều summaries cấp 1 thành 1 summary cấp 2.
 */
export function buildMergePrompt(summaries: ChapterSummary[]): string {
  const combined = summaries
    .map((s, i) => `### Chương ${i + 1} (Turn ${s.turnRange[0]}-${s.turnRange[1]}, năm ${s.year})\n${s.content}`)
    .join("\n\n");

  return `Gộp các tóm tắt chương sau thành MỘT tóm tắt tổng hợp ngắn gọn (5-8 gạch đầu dòng).
Giữ lại: nhân vật chính, diễn biến lớn, quyết định then chốt, thay đổi quan hệ quan trọng.
Viết ở thì quá khứ, ngôi thứ ba.

${combined}

Trả lời theo format:
## Tóm Tắt Tổng Hợp
- (gạch đầu dòng)
...`;
}

/**
 * Parse kết quả merge thành summary cấp 2.
 */
export function parseMergeResponse(
  response: string,
  sources: ChapterSummary[],
): ChapterSummary {
  const turnStart = Math.min(...sources.map((s) => s.turnRange[0]));
  const turnEnd = Math.max(...sources.map((s) => s.turnRange[1]));
  const year = sources[sources.length - 1].year;
  const allNpcs = [...new Set(sources.flatMap((s) => s.npcRelated))];

  const match = response.match(/## Tóm Tắt Tổng Hợp\s*\n([\s\S]*)/i);
  const content = match ? match[1].trim() : response.trim();

  return {
    id: `summary-L2-${turnStart}-${turnEnd}`,
    turnRange: [turnStart, turnEnd],
    year,
    content,
    npcRelated: allNpcs,
    level: 2,
    createdAt: Date.now(),
  };
}
