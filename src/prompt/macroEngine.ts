/**
 * Macro engine theo REGISTRY PATTERN (mục 3.2) — đăng ký macro mới không sửa
 * core resolver. Hỗ trợ cú pháp ST:
 *   {{name}}  ·  {{name:arg}} (vd roll:d20, random:a,b)  ·  {{name::a::b}}  ·  {{// chú thích}}
 *
 * HAI PHA MATCH mỗi vòng lặp (tương thích preset MVU thật):
 *   1. Innermost-first: token KHÔNG chứa ngoặc nhọn bên trong — cho phép macro
 *      lồng nhau ({{setvar::x::{{roll:d6}}}}) render từ trong ra ngoài.
 *   2. Token macro-đã-biết chứa ngoặc đơn lẻ/nhiều dòng trong GIÁ TRỊ
 *      (vd {{setvar::rule::<json có { }>}}) — match non-greedy tới `}}` đầu
 *      tiên không theo sau bởi `}` (như hành vi regex của ST).
 *
 * - Macro KHÔNG nhận diện được: thử tra biến (scratch → chat → global),
 * - Tên macro không phân biệt hoa thường (như ST).
 */
import type { MacroContext } from "./macroContext";

export type MacroFn = (args: string[], ctx: MacroContext) => string;

const macroRegistry = new Map<string, MacroFn>();

export function registerMacro(name: string, fn: MacroFn): void {
  macroRegistry.set(name.toLowerCase(), fn);
}

export function hasMacro(name: string): boolean {
  return macroRegistry.has(name.toLowerCase());
}

/* Sentinel = ký tự điều khiển (không có trong văn bản thường). Dùng escape
   // để source không chứa ký tự vô hình. */

/** Bọc đoạn giữ-nguyên-văn để không bị quét lại (tránh lặp vô hạn). */
const KEEP_OPEN = "";
const KEEP_CLOSE = "";
/** Sentinel {{trim}} — xử lý sau cùng: nuốt whitespace hai bên. */
export const TRIM_SENTINEL = "TRIM";

/** Pha 1: token không chứa ngoặc nhọn (innermost). Lookbehind bỏ span đã giữ nguyên văn. */
const SIMPLE_RE = /(?<!)\{\{([^{}]*)\}\}/g;
/** Pha 2: macro ĐÃ BIẾT có giá trị chứa ngoặc đơn lẻ/nhiều dòng — non-greedy tới `}}` không theo sau `}`. */
const STATE_RE =
  /(?<!)\{\{((?:setvar|getvar|addvar|incvar|decvar|setglobalvar|getglobalvar|addglobalvar|var|random|roll)\b[^]*?)\}\}(?!\})/gi;

const MAX_PASSES = 10;

interface ParsedToken {
  name: string;
  args: string[];
}

function parseToken(inner: string): ParsedToken | "comment" {
  const trimmed = inner.trim();
  if (trimmed.startsWith("//")) return "comment";
  if (trimmed.includes("::")) {
    const parts = trimmed.split("::");
    return { name: parts[0].trim(), args: parts.slice(1) };
  }
  const colon = trimmed.indexOf(":");
  if (colon !== -1) {
    return { name: trimmed.slice(0, colon).trim(), args: [trimmed.slice(colon + 1)] };
  }
  return { name: trimmed, args: [] };
}

/**
 * Render toàn bộ macro trong text. Macro chạy TUẦN TỰ trái→phải (setvar trước
 * getvar trong cùng block hoạt động tự nhiên — 3.1b.3).
 */
export function renderMacros(text: string, ctx: MacroContext): string {
  if (!text.includes("{{")) return finalize(text);

  const replacer = (_whole: string, inner: string): string => {
    const parsed = parseToken(inner);
    if (parsed === "comment") return ""; // {{// chú thích}} loại khỏi output (3.2)
    const fn = macroRegistry.get(parsed.name.toLowerCase());
    if (!fn) {
      // ST-compatible: {{tên_biến}} là shorthand cho {{getvar::tên_biến}}.
      // Tìm trong scratch → chat vars → global vars.
      const varName = parsed.name.trim();
      const resolved =
        ctx.scratch.get(varName) ??
        ctx.vars.getChat(varName) ??
        ctx.vars.getGlobal(varName) ??
        "";
      // Biến đã set (kể cả rỗng) → trả giá trị, không cảnh báo
      if (ctx.scratch.has(varName) || resolved !== "") return resolved;
      // Biến chưa set — có thể là placeholder trong preset, im lặng trả rỗng
      return "";
    }
    try {
      return fn(parsed.args, ctx);
    } catch (e) {
      ctx.warnings.push(`Macro {{${parsed.name}}} lỗi khi chạy: ${e instanceof Error ? e.message : String(e)}`);
      return "";
    }
  };

  let out = text;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    // Pha 1 — innermost, hỗ trợ lồng nhau
    const afterSimple = out.replace(SIMPLE_RE, replacer);
    let changed = afterSimple !== out;
    out = afterSimple;
    if (!out.includes("{{")) break;

    // Pha 2 — chỉ khi pha 1 hết việc: macro đã biết có giá trị chứa { } đơn lẻ
    if (!changed) {
      const afterState = out.replace(STATE_RE, replacer);
      changed = afterState !== out;
      out = afterState;
    }
    if (!changed || !out.includes("{{")) break;
  }
  return finalize(out);
}

function finalize(text: string): string {
  return (
    text
      // {{trim}}: nuốt whitespace/newline quanh vị trí đặt macro
      .replace(/[\t ]*(?:\r?\n)?[\t ]*TRIM[\t ]*(?:\r?\n)?[\t ]*/g, "")
      // mở bọc các đoạn giữ nguyên văn
      .replaceAll(KEEP_OPEN, "")
      .replaceAll(KEEP_CLOSE, "")
  );
}
