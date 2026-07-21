/**
 * tableBridge (Dual Engine) — cầu nối 2 chiều giữa StatData ↔ SQL tables.
 * 1. renderTablesForAI: StatData → DDL + data rows (cho AI prompt)
 * 2. sqlToPatchOps: ParsedSQL → PatchOp[] (chuyển SQL output thành patch)
 */
import type { StatData } from "./schema";
import type { PatchOp } from "./patchEngine";
import type { ParsedSQL, ParsedInsert, ParsedUpdate, ParsedDelete, SqlValue } from "./sqlParser";
import { findTable, DEFAULT_TABLE_REGISTRY, type TableDef, type ColumnDef } from "./tableRegistry";
import { createLogger } from "../lib/log";

const log = createLogger("mvu/tableBridge");

// ═══════════════════════════════════════════════════════════════════════
// 1. StatData → SQL tables text (cho prompt)
// ═══════════════════════════════════════════════════════════════════════

/** Đọc giá trị từ StatData theo path phân tách bởi dấu chấm. */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** Format SQL value cho text: string → 'string', number → number, null → NULL. */
function fmtSqlVal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Render 1 bảng single-row thành current data text. */
function renderSingle(table: TableDef, state: StatData): string {
  const obj = getNestedValue(state, table.statPath) as Record<string, unknown> | undefined;
  if (!obj) return "-- (Chưa có dữ liệu)";

  const cols = table.columns.filter((c) => c.statKey !== "_rowId");
  const vals = cols.map((c) => {
    // Bảng nhan_vat_chinh gộp từ nhiều path
    if (table.tableName === "nhan_vat_chinh") {
      if (c.statKey === "HP") return fmtSqlVal((state["Chỉ Số Sinh Tồn"] as Record<string, unknown>)["HP"]);
      if (c.statKey === "Thể Lực") return fmtSqlVal((state["Chỉ Số Sinh Tồn"] as Record<string, unknown>)["Thể Lực"]);
    }
    return fmtSqlVal(obj[c.statKey]);
  });

  return `-- Dữ liệu hiện tại:\n-- row_id | ${cols.map((c) => c.sqlName).join(" | ")}\n-- 1 | ${vals.join(" | ")}`;
}

/** Render 1 bảng record (dynamic rows) thành current data text. */
function renderRecord(table: TableDef, state: StatData): string {
  const obj = getNestedValue(state, table.statPath) as Record<string, Record<string, unknown>> | undefined;
  if (!obj || Object.keys(obj).length === 0) return "-- (Chưa có dữ liệu)";

  const cols = table.columns.filter((c) => c.statKey !== "_rowId");
  const lines: string[] = [`-- Dữ liệu hiện tại (${Object.keys(obj).length} hàng):`];
  lines.push(`-- row_id | ${cols.map((c) => c.sqlName).join(" | ")}`);

  let rowId = 1;
  for (const [key, record] of Object.entries(obj)) {
    const vals = cols.map((c) => {
      if (c.statKey === "_key") return fmtSqlVal(key);
      const val = record[c.statKey];
      return fmtSqlVal(val);
    });
    lines.push(`-- ${rowId} | ${vals.join(" | ")}`);
    rowId++;
  }
  return lines.join("\n");
}

/**
 * Render toàn bộ bảng thành text cho AI prompt.
 * Bao gồm: DDL + Note + Current Data + Examples.
 */
export function renderTablesForAI(state: StatData): string {
  const sections: string[] = [];

  sections.push("【CƠ SỞ DỮ LIỆU TRẠNG THÁI — sử dụng SQL để cập nhật】");
  sections.push("");

  for (const table of DEFAULT_TABLE_REGISTRY) {
    sections.push(`── Bảng: ${table.tableName} ──`);
    sections.push(table.ddl);
    sections.push(`-- Note: ${table.note}`);

    // Current data
    if (table.type === "single") {
      sections.push(renderSingle(table, state));
    } else if (table.type === "record") {
      sections.push(renderRecord(table, state));
    }
    sections.push("");
  }

  // Hướng dẫn format output
  sections.push(`── HƯỚNG DẪN CẬP NHẬT ──
Sau mỗi lượt kể chuyện, xuất các câu SQL trong thẻ <tableEdit>:
<tableEdit>
UPDATE nhan_vat_chinh SET hp = hp - 10 WHERE row_id = 1;
INSERT INTO tui_do (row_id, ten_vat_pham, so_luong, mo_ta) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM tui_do), 'Kiếm Valyria', 1, 'Kiếm thép Valyria cổ');
</tableEdit>

Quy tắc:
- Chỉ dùng INSERT INTO / UPDATE / DELETE FROM.
- Mỗi câu kết thúc bằng dấu chấm phẩy.
- UPDATE/DELETE BẮT BUỘC có WHERE.
- Dùng biểu thức delta khi thay đổi số (ví dụ: hp = hp - 10, vang = vang + 200).
- KHÔNG đụng các trường bắt đầu bằng dấu "_" (engine quản lý).
- Nếu KHÔNG CÓ thay đổi, KHÔNG cần xuất thẻ <tableEdit>.`);

  return sections.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════
// 2. ParsedSQL → PatchOp[] (SQL output → state patches)
// ═══════════════════════════════════════════════════════════════════════

/** Resolve giá trị SqlValue thành giá trị thuần. */
function resolveValue(sv: SqlValue): unknown {
  if (sv.delta !== undefined) return undefined; // delta xử lý riêng
  return sv.raw;
}

/** Tìm column def theo sqlName. */
function findCol(table: TableDef, sqlName: string): ColumnDef | undefined {
  return table.columns.find((c) => c.sqlName.toLowerCase() === sqlName.toLowerCase());
}

/** Tìm key (tên record) từ WHERE clause cho bảng record. */
function findRecordKey(table: TableDef, where: Map<string, SqlValue>, state: StatData): string | null {
  // Tìm cột _key (ho_ten, ten_vat_pham, ten_ky_nang, ...)
  const keyCol = table.columns.find((c) => c.statKey === "_key");
  if (!keyCol) return null;

  const whereVal = where.get(keyCol.sqlName);
  if (whereVal && typeof whereVal.raw === "string") return whereVal.raw;

  // Fallback: tìm bằng row_id
  const rowIdVal = where.get("row_id");
  if (rowIdVal && typeof rowIdVal.raw === "number") {
    const obj = getNestedValue(state, table.statPath) as Record<string, unknown> | undefined;
    if (!obj) return null;
    const keys = Object.keys(obj);
    const idx = (rowIdVal.raw as number) - 1;
    return idx >= 0 && idx < keys.length ? keys[idx] : null;
  }

  return null;
}

/**
 * Chuyển 1 ParsedSQL → PatchOp[].
 * Cần state hiện tại để resolve WHERE → key cho record tables.
 */
export function sqlToPatchOps(parsed: ParsedSQL, state: StatData): PatchOp[] {
  const table = findTable(parsed.table);
  if (!table) {
    log.warn(`Bảng không tồn tại: ${parsed.table}`);
    return [];
  }

  switch (parsed.op) {
    case "insert":
      return insertToPatchOps(parsed, table, state);
    case "update":
      return updateToPatchOps(parsed, table, state);
    case "delete":
      return deleteToPatchOps(parsed, table, state);
  }
}

function insertToPatchOps(parsed: ParsedInsert, table: TableDef, _state: StatData): PatchOp[] {
  const ops: PatchOp[] = [];

  for (const row of parsed.rows) {
    if (table.type === "single") {
      // Single table INSERT → replace individual fields
      for (let i = 0; i < parsed.columns.length; i++) {
        const col = findCol(table, parsed.columns[i]);
        if (!col || col.statKey === "_rowId") continue;
        const val = row[i] ? resolveValue(row[i]) : null;
        if (val !== undefined) {
          ops.push({ op: "replace", path: `stat_data.${table.statPath}.${col.statKey}`, value: val });
        }
      }
    } else {
      // Record table INSERT → create new entry
      const keyCol = table.columns.find((c) => c.statKey === "_key");
      if (!keyCol) continue;
      const keyIdx = parsed.columns.findIndex((c) => c.toLowerCase() === keyCol.sqlName.toLowerCase());
      if (keyIdx === -1 || !row[keyIdx]) continue;
      const key = String(row[keyIdx].raw);

      // Build entry object
      const entry: Record<string, unknown> = {};
      for (let i = 0; i < parsed.columns.length; i++) {
        const col = findCol(table, parsed.columns[i]);
        if (!col || col.statKey === "_rowId" || col.statKey === "_key") continue;
        const val = row[i] ? resolveValue(row[i]) : null;
        if (val !== undefined && val !== null) {
          // Boolean conversion cho con_song
          if (col.statKey === "Còn Sống") {
            entry[col.statKey] = val === 1 || val === "1" || val === true;
          } else {
            entry[col.statKey] = val;
          }
        }
      }

      ops.push({ op: "replace", path: `stat_data.${table.statPath}.${key}`, value: entry });
    }
  }

  return ops;
}

function updateToPatchOps(parsed: ParsedUpdate, table: TableDef, state: StatData): PatchOp[] {
  const ops: PatchOp[] = [];

  if (table.type === "single") {
    // Single table UPDATE → replace/delta individual fields
    for (const [sqlCol, sv] of parsed.set) {
      const col = findCol(table, sqlCol);
      if (!col || col.statKey === "_rowId") continue;

      // Xử lý path đặc biệt cho nhan_vat_chinh (gộp nhiều StatData paths)
      let basePath: string;
      if (table.tableName === "nhan_vat_chinh" && (col.statKey === "HP" || col.statKey === "Thể Lực")) {
        basePath = `stat_data.Chỉ Số Sinh Tồn.${col.statKey}`;
      } else {
        basePath = `stat_data.${table.statPath}.${col.statKey}`;
      }

      if (sv.delta !== undefined) {
        ops.push({ op: "delta", path: basePath, value: sv.delta });
      } else {
        const val = resolveValue(sv);
        if (val !== undefined) {
          ops.push({ op: "replace", path: basePath, value: val });
        }
      }
    }
  } else {
    // Record table UPDATE → find key from WHERE → update fields
    const key = findRecordKey(table, parsed.where, state);
    if (!key) {
      log.warn(`Không tìm được key cho UPDATE ${table.tableName}`);
      return [];
    }

    for (const [sqlCol, sv] of parsed.set) {
      const col = findCol(table, sqlCol);
      if (!col || col.statKey === "_rowId" || col.statKey === "_key") continue;

      const path = `stat_data.${table.statPath}.${key}.${col.statKey}`;
      if (sv.delta !== undefined) {
        ops.push({ op: "delta", path, value: sv.delta });
      } else {
        let val = resolveValue(sv);
        if (val !== undefined) {
          // Boolean conversion
          if (col.statKey === "Còn Sống") {
            val = val === 1 || val === "1" || val === true;
          }
          ops.push({ op: "replace", path, value: val });
        }
      }
    }
  }

  return ops;
}

function deleteToPatchOps(parsed: ParsedDelete, table: TableDef, state: StatData): PatchOp[] {
  if (table.type === "single") {
    log.warn("Không thể DELETE bảng single-row:", table.tableName);
    return [];
  }

  const key = findRecordKey(table, parsed.where, state);
  if (!key) {
    log.warn(`Không tìm được key cho DELETE ${table.tableName}`);
    return [];
  }

  return [{ op: "remove", path: `stat_data.${table.statPath}.${key}` }];
}
