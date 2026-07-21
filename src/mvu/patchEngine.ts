/**
 * Patch engine (5.2/5.3): áp khối mvu_update của AI vào state.
 * 5 op: replace / delta / insert / remove / move.
 * - Op lỗi → log, KHÔNG throw, tiếp tục op khác.
 * - Sau khi áp: safeParse + tự phục hồi bằng prefault (schema là lưới an toàn).
 * - replace với path chưa tồn tại trong z.record = TẠO MỚI (thêm NPC/item).
 */
import { StatDataSchema, type StatData } from "./schema";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/patch");

export interface PatchOp {
  op: "replace" | "delta" | "insert" | "remove" | "move";
  path: string;
  value?: unknown;
  from?: string;
}

export interface PatchWarning {
  op: PatchOp;
  reason: string;
}

/** Chuẩn hoá path: bỏ prefix "stat_data.", tách theo dấu chấm. */
export function parsePath(path: string): string[] {
  const trimmed = path.trim().replace(/^stat_data\./, "");
  if (!trimmed) return [];
  return trimmed.split(".").map((p) => p.trim()).filter(Boolean);
}

function getAtPath(obj: unknown, parts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** set — tự tạo object trung gian nếu thiếu (path mới trong record = tạo mới). */
function setAtPath(obj: Record<string, unknown>, parts: string[], value: unknown): void {
  if (parts.length === 0) throw new Error("path rỗng");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    if (next === null || typeof next !== "object") {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function deleteAtPath(obj: Record<string, unknown>, parts: string[]): boolean {
  if (parts.length === 0) return false;
  const parent = getAtPath(obj, parts.slice(0, -1));
  if (parent === null || typeof parent !== "object") return false;
  const key = parts[parts.length - 1];
  if (Array.isArray(parent)) {
    const idx = Number(key);
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length) return false;
    parent.splice(idx, 1);
    return true;
  }
  if (!(key in (parent as Record<string, unknown>))) return false;
  delete (parent as Record<string, unknown>)[key];
  return true;
}

export interface ApplyPatchResult {
  state: StatData;
  warnings: PatchWarning[];
  /** đường path đã đổi (cho diff/animation UI 6.4). */
  changedPaths: string[];
}

/**
 * Áp danh sách op vào state (trên bản deep-clone — không mutate input),
 * rồi validate + tự phục hồi. KHÔNG BAO GIỜ throw vì dữ liệu AI.
 */
export function applyPatch(state: StatData, ops: PatchOp[]): ApplyPatchResult {
  const draft = structuredClone(state) as unknown as Record<string, unknown>;
  const warnings: PatchWarning[] = [];
  const changedPaths: string[] = [];

  for (const op of ops) {
    try {
      const parts = parsePath(op.path ?? "");
      if (parts.length === 0) {
        warnings.push({ op, reason: "path rỗng/không hợp lệ" });
        continue;
      }
      switch (op.op) {
        case "replace": {
          setAtPath(draft, parts, op.value);
          changedPaths.push(parts.join("."));
          break;
        }
        case "delta": {
          const cur = getAtPath(draft, parts);
          const curNum = typeof cur === "number" ? cur : Number(cur ?? 0);
          const deltaNum = Number(op.value);
          if (!Number.isFinite(deltaNum)) {
            warnings.push({ op, reason: `delta không phải số: ${String(op.value)}` });
            break;
          }
          setAtPath(draft, parts, (Number.isFinite(curNum) ? curNum : 0) + deltaNum);
          changedPaths.push(parts.join("."));
          break;
        }
        case "insert": {
          const arr = getAtPath(draft, parts);
          if (Array.isArray(arr)) {
            arr.push(op.value);
          } else if (arr === undefined) {
            setAtPath(draft, parts, [op.value]); // mảng chưa có → tạo mới
          } else {
            warnings.push({ op, reason: "insert vào path không phải mảng" });
            break;
          }
          changedPaths.push(parts.join("."));
          break;
        }
        case "remove": {
          if (!deleteAtPath(draft, parts)) {
            warnings.push({ op, reason: "remove: path không tồn tại" });
            break;
          }
          changedPaths.push(parts.join("."));
          break;
        }
        case "move": {
          const fromParts = parsePath(op.from ?? "");
          if (fromParts.length === 0) {
            warnings.push({ op, reason: "move thiếu from" });
            break;
          }
          const val = getAtPath(draft, fromParts);
          if (val === undefined) {
            warnings.push({ op, reason: "move: from không tồn tại" });
            break;
          }
          deleteAtPath(draft, fromParts);
          setAtPath(draft, parts, val);
          changedPaths.push(fromParts.join("."), parts.join("."));
          break;
        }
        default:
          warnings.push({ op, reason: `op không hợp lệ: ${String((op as { op?: unknown }).op)}` });
      }
    } catch (e) {
      warnings.push({ op, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  // validate + tự phục hồi (prefault/catch trong schema tự sửa field lỗi)
  const result = StatDataSchema.safeParse(draft);
  if (result.success) {
    for (const w of warnings) log.warn(`Op bị bỏ: ${w.reason}`, w.op);
    return { state: result.data, warnings, changedPaths };
  }

  // hiếm: schema vẫn fail → xoá field lỗi cấp 1 rồi parse lại (mergeWithDefaults)
  log.warn("Schema violation sau patch — tự phục hồi", result.error.issues.slice(0, 3));
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) {
      deleteAtPath(draft, issue.path.map(String).slice(0, 2));
    }
  }
  const retry = StatDataSchema.safeParse(draft);
  if (retry.success) {
    warnings.push({ op: { op: "replace", path: "(schema)" }, reason: "một phần state lỗi đã reset về mặc định" });
    return { state: retry.data, warnings, changedPaths };
  }
  // tuyệt vọng: giữ state cũ, bỏ toàn bộ patch
  warnings.push({ op: { op: "replace", path: "(schema)" }, reason: "patch làm hỏng state — giữ nguyên state cũ" });
  return { state, warnings, changedPaths: [] };
}
