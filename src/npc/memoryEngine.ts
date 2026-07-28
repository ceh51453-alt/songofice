/**
 * memoryEngine (16.1) — Quản lý ký ức NPC:
 * - Chọn lọc ký ức trọng số cao nhất để inject vào prompt
 * - Phai dần ký ức cũ (sự kiện nhỏ giảm, sự kiện lớn gần vĩnh viễn)
 * - Thêm ký ức mới, deduplicate
 * - Render ký ức thành block text cho prompt
 */
import type { Npc } from "../mvu/npcSchema";
import type { StatData } from "../mvu/schema";

type NpcMemory = Npc["Ký Ức"][number];

// ── Constants ────────────────────────────────────────────────────────────────

/** Ngưỡng trọng số mà ký ức KHÔNG phai (sự kiện lớn: phản bội, cứu mạng). */
const PERMANENT_THRESHOLD = 80;
/** Trọng số giảm mỗi NGÀY truyện cho ký ức dưới ngưỡng. */
const DECAY_PER_DAY = 0.5;
/** Trọng số tối thiểu trước khi bị loại bỏ hoàn toàn. */
const MIN_WEIGHT_BEFORE_PURGE = 5;
/** Số ký ức tối đa giữ trên mỗi NPC (tránh phình). */
const MAX_MEMORIES = 20;
/** Số ký ức inject vào prompt cho NPC đang trong cảnh. */
const INJECT_COUNT_ACTIVE = 5;
/** Số ký ức inject cho NPC ngoài cảnh. */
const INJECT_COUNT_PASSIVE = 2;

// ── Select ───────────────────────────────────────────────────────────────────

/** Chọn ký ức trọng số cao nhất, giới hạn số lượng. */
export function selectRelevantMemories(npc: Npc, isActive: boolean): NpcMemory[] {
  const limit = isActive ? INJECT_COUNT_ACTIVE : INJECT_COUNT_PASSIVE;
  return [...npc["Ký Ức"]]
    .sort((a, b) => b["Trọng Số"] - a["Trọng Số"])
    .slice(0, limit);
}

// ── Decay ────────────────────────────────────────────────────────────────────

/**
 * Phai ký ức NPC theo số NGÀY truyện đã trôi. Mutate trực tiếp.
 * - Ký ức >= PERMANENT_THRESHOLD (80): không phai
 * - Ký ức < 80: giảm DECAY_PER_DAY × daysPassed
 * - Ký ức < MIN_WEIGHT_BEFORE_PURGE (5): xoá khỏi mảng
 */
export function decayMemories(npc: Npc, daysPassed: number): void {
  if (daysPassed <= 0 || npc["Ký Ức"].length === 0) return;

  for (const mem of npc["Ký Ức"]) {
    if (mem["Trọng Số"] < PERMANENT_THRESHOLD) {
      mem["Trọng Số"] = Math.max(0, mem["Trọng Số"] - DECAY_PER_DAY * daysPassed);
    }
  }
  // Purge ký ức quá yếu
  npc["Ký Ức"] = npc["Ký Ức"].filter((m) => m["Trọng Số"] >= MIN_WEIGHT_BEFORE_PURGE);
}

/**
 * Phai ký ức cho TẤT CẢ NPC. Gọi từ effects cascade theo số ngày đã trôi.
 */
export function decayAllMemories(state: StatData, daysPassed: number): void {
  if (daysPassed <= 0) return;
  const allNpcs = [
    ...Object.values(state["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.values(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];
  for (const npc of allNpcs) {
    decayMemories(npc, daysPassed);
  }
}

// ── Add ──────────────────────────────────────────────────────────────────────

interface AddMemoryInput {
  day: number;
  month: number;
  year?: number;
  event: string;
  emotion: NpcMemory["Cảm Xúc"];
  weight: number;
}

/**
 * Thêm ký ức mới cho NPC. Deduplicate nếu cùng Sự Việc (cập nhật trọng số nếu cao hơn).
 * Enforce MAX_MEMORIES bằng cách cắt ký ức trọng số thấp nhất.
 */
export function addMemory(npc: Npc, input: AddMemoryInput): void {
  // Deduplicate: cùng sự việc → cập nhật
  const existing = npc["Ký Ức"].find((m) => m["Sự Việc"] === input.event);
  if (existing) {
    existing["Trọng Số"] = Math.max(existing["Trọng Số"], input.weight);
    existing["Cảm Xúc"] = input.emotion;
    existing["Ngày"] = input.day;
    existing["Tháng"] = input.month;
    if (input.year !== undefined) existing["Năm"] = input.year;
    return;
  }

  npc["Ký Ức"].push({
    "Ngày": input.day,
    "Tháng": input.month,
    "Năm": input.year,
    "Sự Việc": input.event,
    "Cảm Xúc": input.emotion,
    "Trọng Số": Math.min(100, Math.max(0, input.weight)),
  });

  // Enforce cap
  if (npc["Ký Ức"].length > MAX_MEMORIES) {
    npc["Ký Ức"].sort((a, b) => b["Trọng Số"] - a["Trọng Số"]);
    npc["Ký Ức"] = npc["Ký Ức"].slice(0, MAX_MEMORIES);
  }
}

// ── Format for Prompt ────────────────────────────────────────────────────────

/**
 * Render ký ức chọn lọc của nhiều NPC thành block text cho prompt.
 * @param activeNpcNames — tên NPC đang xuất hiện trong cảnh (inject nhiều hơn).
 */
export function formatMemoriesForPrompt(
  stat: StatData,
  activeNpcNames: string[] = [],
): string {
  const lines: string[] = [];
  const activeSet = new Set(activeNpcNames);

  const allNpcs: [string, Npc][] = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];

  for (const [name, npc] of allNpcs) {
    const isActive = activeSet.has(name);
    const memories = selectRelevantMemories(npc, isActive);
    if (memories.length === 0) continue;

    lines.push(`[Ký ức ${name}]`);
    for (const m of memories) {
      const when = m["Năm"] !== undefined
        ? `ngày ${m["Ngày"]}/${m["Tháng"]}/${m["Năm"]} AC`
        : `ngày ${m["Ngày"]} tháng ${m["Tháng"]}`;
      lines.push(`  - [${when}] ${m["Sự Việc"]} (${m["Cảm Xúc"]}, trọng số ${m["Trọng Số"]})`);
    }
    if (npc["Lời Hứa Chưa Giữ"].length > 0) {
      lines.push(`  Lời hứa: ${npc["Lời Hứa Chưa Giữ"].map((p) => `"${p}"`).join("; ")}`);
    }
  }

  return lines.length > 0 ? lines.join("\n") : "";
}
