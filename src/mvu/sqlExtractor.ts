/**
 * sqlExtractor (Dual Engine) — parse thẻ <tableEdit> từ AI output.
 * Tương đương extractor.ts nhưng cho Auto Database SQL mode.
 * Trả ExtractResult (cùng interface) → tương thích 100% với pipeline hiện tại.
 */
import type { PatchOp } from "./patchEngine";
import { rejectReason } from "./extractor";
import { parseSqlStatements } from "./sqlParser";
import { sqlToPatchOps } from "./tableBridge";
import { useMvuStore } from "../state/mvuStore";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/sqlExtract");

export interface SqlExtractResult {
  ops: PatchOp[];
  rejected: { op: PatchOp; reason: string }[];
  displayText: string;
  found: boolean;
}

const TABLE_EDIT_RE = /<tableEdit>([\s\S]*?)<\/tableEdit>/gi;

/**
 * Parse AI output ở chế độ Auto Database.
 * Tìm thẻ <tableEdit>, parse SQL bên trong → PatchOps → filter an toàn.
 */
export function extractSqlUpdates(rawText: string): SqlExtractResult {
  const ops: PatchOp[] = [];
  const rejected: { op: PatchOp; reason: string }[] = [];
  let found = false;
  let display = rawText;

  const state = useMvuStore.getState().stat;

  // Tìm tất cả thẻ <tableEdit>
  const matches = [...rawText.matchAll(TABLE_EDIT_RE)];
  for (const m of matches) {
    const sqlBlock = m[1];
    const parsedStatements = parseSqlStatements(sqlBlock);
    if (parsedStatements.length > 0) found = true;

    for (const stmt of parsedStatements) {
      try {
        const patchOps = sqlToPatchOps(stmt, state);
        for (const op of patchOps) {
          const reason = rejectReason(op);
          if (reason) {
            rejected.push({ op, reason });
            log.warn(`SQL op bị lọc: ${reason}`);
          } else {
            ops.push(op);
          }
        }
      } catch (err) {
        log.warn("SQL → PatchOp lỗi:", err instanceof Error ? err.message : err);
      }
    }
  }

  // Cắt thẻ <tableEdit> khỏi display text
  display = display.replace(TABLE_EDIT_RE, "");
  display = display.replace(/```(?:sql)?\s*```/g, "").replace(/\n{3,}/g, "\n\n").trim();

  if (found) {
    log.info(`Trích ${ops.length} ops từ SQL (${rejected.length} bị lọc)`);
  }

  return { ops, rejected, displayText: display, found };
}
