/**
 * sqlParser (Dual Engine) — regex-based SQL parser nhẹ.
 * Parse INSERT / UPDATE / DELETE statements từ AI output thành ParsedSQL.
 * KHÔNG dùng SQLite WASM — chỉ cần regex đủ cho RPG state management.
 *
 * Hỗ trợ:
 * - INSERT INTO t (col1, col2) VALUES ('v1', 'v2'), (N, 'v3');
 * - UPDATE t SET col1 = 'new', col2 = col2 + 5 WHERE col3 = 'match';
 * - DELETE FROM t WHERE col = 'match';
 * - Giá trị: string (nháy đơn), số, NULL, biểu thức delta (col ± N)
 * - Escape nháy đơn ('') bên trong string
 */
import { createLogger } from "../lib/log";

const log = createLogger("mvu/sqlParser");

// ── Parsed types ──

export type SqlOpType = "insert" | "update" | "delete";

export interface SqlValue {
  /** Giá trị thuần (string | number | null). */
  raw: string | number | null;
  /** Nếu là biểu thức delta (ví dụ: quantity + 3), lưu delta number. */
  delta?: number;
  /** Tên cột tham chiếu trong biểu thức delta (ví dụ: "quantity" trong quantity + 3). */
  deltaRef?: string;
}

export interface ParsedInsert {
  op: "insert";
  table: string;
  columns: string[];
  /** Nhiều hàng (multi-row insert). */
  rows: SqlValue[][];
}

export interface ParsedUpdate {
  op: "update";
  table: string;
  /** SET clauses: column → value. */
  set: Map<string, SqlValue>;
  /** WHERE clauses: column → value (chỉ hỗ trợ AND + = đơn giản). */
  where: Map<string, SqlValue>;
}

export interface ParsedDelete {
  op: "delete";
  table: string;
  where: Map<string, SqlValue>;
}

export type ParsedSQL = ParsedInsert | ParsedUpdate | ParsedDelete;

// ── Helpers ──

/** Tách danh sách cột/giá trị theo dấu phẩy, respect nháy đơn. */
function splitComma(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuote = false;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inQuote) { inQuote = true; current += ch; continue; }
    if (ch === "'" && inQuote) {
      // escape '' → '
      if (i + 1 < str.length && str[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inQuote = false;
      current += ch;
      continue;
    }
    if (inQuote) { current += ch; continue; }
    if (ch === "(") { depth++; current += ch; continue; }
    if (ch === ")") { depth--; current += ch; continue; }
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Parse 1 giá trị SQL → SqlValue. */
function parseValue(raw: string): SqlValue {
  const trimmed = raw.trim();

  // NULL
  if (/^null$/i.test(trimmed)) return { raw: null };

  // String literal 'abc' (với escape '' → ')
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    const inner = trimmed.slice(1, -1).replace(/''/g, "'");
    return { raw: inner };
  }

  // Biểu thức delta: column_name + N hoặc column_name - N
  const deltaMatch = trimmed.match(/^(\w+)\s*([+-])\s*(\d+(?:\.\d+)?)$/);
  if (deltaMatch) {
    const ref = deltaMatch[1];
    const sign = deltaMatch[2] === "-" ? -1 : 1;
    const num = parseFloat(deltaMatch[3]) * sign;
    return { raw: null, delta: num, deltaRef: ref };
  }

  // Subquery: (SELECT MAX(row_id)+1 FROM ...) → bỏ qua, trả null (engine auto-generate)
  if (trimmed.startsWith("(") && /SELECT/i.test(trimmed)) {
    return { raw: null };
  }

  // Number
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") return { raw: num };

  // Fallback: treat as string
  return { raw: trimmed };
}

/** Parse WHERE clause đơn giản: col1 = 'val1' AND col2 = val2 */
function parseWhere(clause: string): Map<string, SqlValue> {
  const result = new Map<string, SqlValue>();
  // split by AND (case-insensitive)
  const conditions = clause.split(/\bAND\b/i);
  for (const cond of conditions) {
    const match = cond.trim().match(/^(\w+)\s*=\s*(.+)$/);
    if (match) {
      result.set(match[1].trim(), parseValue(match[2].trim()));
    }
  }
  return result;
}

// ── Main parsers ──

function parseInsert(sql: string): ParsedInsert | null {
  // INSERT INTO table_name (col1, col2) VALUES (v1, v2), (v3, v4);
  const match = sql.match(
    /^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s+(.+)$/is,
  );
  if (!match) return null;

  const table = match[1].trim();
  const columns = splitComma(match[2]).map((c) => c.trim().replace(/^["'`]|["'`]$/g, ""));

  // Parse multiple value groups: (v1, v2), (v3, v4)
  const valuesStr = match[3].trim();
  const rows: SqlValue[][] = [];
  const groupRe = /\(([^)]*)\)/g;
  let gm: RegExpExecArray | null;
  while ((gm = groupRe.exec(valuesStr))) {
    const vals = splitComma(gm[1]).map(parseValue);
    rows.push(vals);
  }

  if (rows.length === 0) return null;
  return { op: "insert", table, columns, rows };
}

function parseUpdate(sql: string): ParsedUpdate | null {
  // UPDATE table_name SET col1 = 'val', col2 = col2 + 3 WHERE col3 = 'x';
  const match = sql.match(
    /^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/is,
  );
  if (!match) return null;

  const table = match[1].trim();
  const setClauses = splitComma(match[2]);
  const set = new Map<string, SqlValue>();
  for (const clause of setClauses) {
    const eqMatch = clause.match(/^(\w+)\s*=\s*(.+)$/);
    if (eqMatch) {
      set.set(eqMatch[1].trim(), parseValue(eqMatch[2].trim()));
    }
  }

  const where = match[3] ? parseWhere(match[3]) : new Map<string, SqlValue>();
  return { op: "update", table, set, where };
}

function parseDelete(sql: string): ParsedDelete | null {
  // DELETE FROM table_name WHERE col = 'val';
  const match = sql.match(
    /^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/is,
  );
  if (!match) return null;

  const table = match[1].trim();
  const where = parseWhere(match[2]);
  return { op: "delete", table, where };
}

/**
 * Parse 1 SQL statement → ParsedSQL hoặc null nếu không hợp lệ.
 */
export function parseSqlStatement(sql: string): ParsedSQL | null {
  const trimmed = sql.trim().replace(/;$/, "").trim();
  if (!trimmed) return null;

  if (/^INSERT\s+INTO/i.test(trimmed)) return parseInsert(trimmed);
  if (/^UPDATE\s+/i.test(trimmed)) return parseUpdate(trimmed);
  if (/^DELETE\s+FROM/i.test(trimmed)) return parseDelete(trimmed);

  log.warn("SQL không nhận dạng:", trimmed.slice(0, 80));
  return null;
}

/**
 * Parse nhiều SQL statements (split bằng ; hoặc newline).
 * Bỏ qua comment (-- ...) và dòng trống.
 */
export function parseSqlStatements(text: string): ParsedSQL[] {
  const results: ParsedSQL[] = [];

  // Remove comments
  const noComments = text.replace(/--[^\n]*/g, "");

  // Split by ; nhưng respect nháy đơn
  const statements: string[] = [];
  let current = "";
  let inQuote = false;
  for (const ch of noComments) {
    if (ch === "'" && !inQuote) { inQuote = true; current += ch; continue; }
    if (ch === "'" && inQuote) { inQuote = false; current += ch; continue; }
    if (inQuote) { current += ch; continue; }
    if (ch === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());

  for (const stmt of statements) {
    const parsed = parseSqlStatement(stmt);
    if (parsed) results.push(parsed);
  }

  return results;
}
