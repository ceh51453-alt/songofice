/**
 * Extractor (5.4c) — trích khối cập nhật từ phản hồi AI + LỌC AN TOÀN:
 * - Bắt cả <UpdateVariable>{...}</UpdateVariable> lẫn khối {"mvu_update":[...]} trần.
 * - Parse bằng JSON.parse có xử lý lỗi (KHÔNG regex mong manh cho nội dung).
 * - Lọc: bỏ op ghi field prefix "_" (readonly engine), bỏ op ghi nhãn bậc
 *   (Giai Đoạn Quan Hệ/Đời — engine dẫn xuất), bỏ op ghi field engine sở hữu.
 * Triết lý 2 lớp: prompt 5.4b làm AI ghi đúng ~hầu hết; extractor chặn hậu quả
 * khi AI ghi sai — không tin AI tuyệt đối.
 */
import type { PatchOp } from "./patchEngine";
import { parsePath } from "./patchEngine";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/extract");

export interface ExtractResult {
  ops: PatchOp[];
  /** op bị lọc bỏ + lý do (debug). */
  rejected: { op: PatchOp; reason: string }[];
  /** text hiển thị = raw đã cắt các khối kỹ thuật (5.5). */
  displayText: string;
  /** có tìm thấy khối cập nhật nào không. */
  found: boolean;
}

const UPDATE_TAG_RE = /<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/gi;

/** Nhãn bậc engine dẫn xuất — AI không được set (5.1d/5.1e). */
const DERIVED_LABEL_FIELDS = ["Giai Đoạn Quan Hệ", "Giai Đoạn Đời"];

function isValidOp(o: unknown): o is PatchOp {
  if (typeof o !== "object" || o === null) return false;
  const op = o as Record<string, unknown>;
  return (
    typeof op.op === "string" &&
    ["replace", "delta", "insert", "remove", "move"].includes(op.op) &&
    typeof op.path === "string"
  );
}

/** Lọc an toàn 1 op — trả lý do loại nếu vi phạm. */
export function rejectReason(op: PatchOp): string | null {
  const parts = parsePath(op.path);
  if (parts.length === 0) return "path rỗng";
  // field prefix _ ở BẤT KỲ cấp nào (kể cả _engineMeta._Seed Gốc)
  if (parts.some((p) => p.startsWith("_"))) return `path chạm field readonly "_": ${op.path}`;
  const last = parts[parts.length - 1];
  if (DERIVED_LABEL_FIELDS.includes(last)) return `nhãn bậc do engine dẫn xuất: ${last}`;
  if (parts[0] === "Cài Đặt Ván" && last === "Đặc Quyền Đa Kỵ Sĩ") {
    return "đặc quyền đa kỵ sĩ chỉ được xác lập khi tạo nhân vật với xuất thân Người Xuyên Không";
  }
  // AI chỉ được KỂ một diễn biến cảm hóa và phát <dragon_order action="tame">.
  // Các trường quyết định quyền sở hữu/liên kết tuyệt đối không nhận cập nhật trực tiếp.
  const dragonTamingFields = new Set([
    "Kỵ Sĩ", "Mức Độ Thuần Hóa", "Trạng Thái Thu Phục", "Độ Hảo Cảm", "Số Lần Cảm Hóa", "_Ngày Cảm Hóa Gần Nhất",
  ]);
  if (parts[0] === "Rồng" && (parts.length <= 2 || dragonTamingFields.has(last))) {
    return "AI không được điều khiển việc thuần rồng trực tiếp; phải kể diễn biến và dùng <dragon_order action=\"tame\"> để engine tung xác suất";
  }
  // Chủ quyền vùng do ENGINE giữ (vây thành/ngoại giao) — AI đổi chủ qua thẻ
  // <territory_change>, không ghi thẳng vào bảng (9.5.1).
  if (parts[0] === "Chủ Quyền Lãnh Thổ") return "chủ quyền vùng do engine giữ (dùng <territory_change>)";
  if (op.op === "move" && op.from) {
    const fromParts = parsePath(op.from);
    if (fromParts.some((p) => p.startsWith("_"))) return `from chạm field readonly "_": ${op.from}`;
  }
  return null;
}

/** Tìm khối {"mvu_update": [...]} trần (không thẻ bọc) bằng cân bằng ngoặc. */
function findBareBlocks(text: string): { start: number; end: number; json: string }[] {
  const blocks: { start: number; end: number; json: string }[] = [];
  const marker = /"mvu_update"\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text))) {
    // lùi tìm dấu { mở khối chứa marker
    let start = text.lastIndexOf("{", m.index);
    if (start === -1) continue;
    // tiến tìm } cân bằng
    let depth = 0;
    let end = -1;
    let inStr = false;
    let esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) continue;
    blocks.push({ start, end: end + 1, json: text.slice(start, end + 1) });
    marker.lastIndex = end;
  }
  return blocks;
}

export function extractUpdates(rawText: string): ExtractResult {
  const ops: PatchOp[] = [];
  const rejected: { op: PatchOp; reason: string }[] = [];
  let found = false;
  let display = rawText;

  const tryParse = (json: string): void => {
    try {
      const parsed = JSON.parse(json) as { mvu_update?: unknown };
      if (!Array.isArray(parsed.mvu_update)) return;
      found = true;
      for (const raw of parsed.mvu_update) {
        if (!isValidOp(raw)) {
          log.warn("Op sai cấu trúc — bỏ", raw);
          continue;
        }
        const reason = rejectReason(raw);
        if (reason) {
          rejected.push({ op: raw, reason });
          log.warn(`Op bị lọc: ${reason}`);
        } else {
          ops.push(raw);
        }
      }
    } catch (e) {
      log.warn("Khối cập nhật JSON hỏng — bỏ qua", e instanceof Error ? e.message : e);
    }
  };

  // 1) các khối <UpdateVariable>...</UpdateVariable>
  const tagged = [...rawText.matchAll(UPDATE_TAG_RE)];
  for (const m of tagged) tryParse(m[1]);
  display = display.replace(UPDATE_TAG_RE, "");

  // 2) khối {"mvu_update": ...} trần (chỉ tìm trên phần còn lại sau khi cắt thẻ)
  const bare = findBareBlocks(display);
  for (const b of bare) tryParse(b.json);
  // cắt khỏi display (từ cuối lên để không lệch index)
  for (const b of bare.reverse()) {
    display = display.slice(0, b.start) + display.slice(b.end);
  }

  // dọn ``` bọc quanh khối đã cắt (AI hay bọc JSON trong code fence)
  display = display.replace(/```(?:json)?\s*```/g, "").replace(/\n{3,}/g, "\n\n").trim();

  return { ops, rejected, displayText: display, found };
}
