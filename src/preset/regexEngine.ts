import type { ApiChatMessage } from "../types/connection";
import type { STRegexScript } from "./presetSchema";
import { createLogger } from "../lib/log";

const log = createLogger("regexEngine");

/** Cờ regex JS hợp lệ — dùng để phân biệt "/pat/flags" với chuỗi có dấu / bên trong. */
const VALID_FLAGS = /^[dgimsuvy]*$/;

/**
 * Biên dịch chuỗi Regex kiểu SillyTavern — BÁM SÁT `regexFromString` của ST:
 *   "/pattern/flags" → new RegExp(pattern, flags)
 *   chuỗi trần       → new RegExp(chuỗi) KHÔNG cờ
 *
 * Quan trọng: KHÔNG tự thêm "gi" cho chuỗi trần. Preset ST thật dùng mẫu neo
 * kiểu `^([\s\S]*)$` không bọc dấu /; thêm cờ ngầm sẽ đổi ngữ nghĩa (global +
 * bỏ phân biệt hoa thường) so với SillyTavern gốc.
 */
export function compileRegex(regexString: string): RegExp | null {
  if (!regexString) return null;
  const match = regexString.match(/^\/([\s\S]+)\/([a-z]*)$/i);
  if (match && VALID_FLAGS.test(match[2])) {
    try {
      return new RegExp(match[1], match[2]);
    } catch {
      // pattern hỏng khi tách theo /.../ → thử coi cả chuỗi là pattern (như ST)
    }
  }
  try {
    return new RegExp(regexString);
  } catch (err) {
    log.warn(`Lỗi biên dịch regex: ${regexString}`, err);
    return null;
  }
}

/**
 * Khớp placement của SillyTavern.
 * 1: User input · 2: AI output. (0 = khối system của preset — ST không có
 * placement này nên script preset không bao giờ chạm vào khối system.)
 *
 * placement RỖNG = script không chạy ở đâu cả (ST dùng `placement.includes`),
 * KHÔNG phải "chạy mọi nơi".
 */
function roleMatchesPlacement(role: ApiChatMessage["role"], placement: number[]): boolean {
  if (!placement || placement.length === 0) return false;

  const roleMap: Record<ApiChatMessage["role"], number> = {
    system: 0,
    user: 1,
    assistant: 2,
  };
  return placement.includes(roleMap[role]);
}

/**
 * Ngữ cảnh nào thì script chạy — BÁM SÁT ST `getRegexedString`:
 *   markdownOnly && đang hiển thị     → chạy
 *   promptOnly   && đang gửi API      → chạy
 *   không cờ nào                      → chạy cả hai
 * Cả HAI cờ cùng bật = chạy cả hai (trước đây bị lọc ngược nên script kiểu này
 * chết ở mọi nơi — vd "Dọn dẹp thẻ chung" của preset Myriad Stars).
 */
function scriptAppliesTo(s: STRegexScript, isForUI: boolean): boolean {
  if (s.disabled) return false;
  if (s.markdownOnly && isForUI) return true;
  if (s.promptOnly && !isForUI) return true;
  return !s.markdownOnly && !s.promptOnly;
}

/*
 * KHÔNG unescape "\\n"/"\\r"/"\\t" trong replaceString.
 * JSON đã giải mã escape khi parse file, nên xuống dòng thật đã là xuống dòng.
 * Đổi tiếp sẽ PHÁ nội dung: replaceString của preset thường nhúng cả mã JS
 * (khối ```html```), trong đó "/\\r?\\n/" là regex literal — biến thành ký tự
 * xuống dòng thật sẽ thành "Invalid regular expression: missing /" và cả script
 * của preset chết. SillyTavern cũng không unescape.
 */

/**
 * Dựng chuỗi thay thế cho một lần khớp: hỗ trợ `{{match}}`, `$&`, `$1..$99`
 * và `trimStrings` (ST cắt các chuỗi này KHỎI phần bắt được trước khi chèn).
 */
function buildReplacement(template: string, args: unknown[], trims: string[]): string {
  const whole = String(args[0] ?? "");
  // callback replace: (match, p1..pn, offset, string, groups?) — `groups` chỉ
  // có khi regex dùng named group, nên cắt từ cuối thay vì đếm từ đầu.
  const tail = args[args.length - 1];
  const hasNamed = typeof tail === "object" && tail !== null;
  const groups = args.slice(1, args.length - (hasNamed ? 3 : 2));

  const trim = (v: string): string =>
    trims.reduce((acc, t) => (t ? acc.split(t).join("") : acc), v);

  return template
    .replace(/\{\{match\}\}/gi, () => trim(whole))
    .replace(/\$&/g, () => trim(whole))
    .replace(/\$(\d{1,2})/g, (raw, n: string) => {
      const g = groups[Number(n) - 1];
      return g === undefined ? raw : trim(String(g));
    });
}

/** Chạy MỘT script lên một chuỗi (đã qua bộ lọc ngữ cảnh/placement/depth). */
function runScript(text: string, script: STRegexScript): string {
  const regex = compileRegex(script.findRegex);
  if (!regex) return text;
  if (script.substituteRegex) {
    log.warn(`Script "${script.scriptName}" bật substituteRegex — app chưa thay macro trong findRegex`);
  }
  const template = script.replaceString;
  const trims = (script.trimStrings ?? []).filter((t): t is string => typeof t === "string" && t.length > 0);
  if (regex.global) regex.lastIndex = 0;
  return text.replace(regex, (...args: unknown[]) => buildReplacement(template, args, trims));
}

/**
 * Áp dụng Regex Scripts cho một chuỗi văn bản đơn lẻ.
 */
export function applyRegexForSingleMessage(
  content: string,
  role: ApiChatMessage["role"],
  depth: number,
  scripts: STRegexScript[],
  isForUI: boolean
): string {
  if (!scripts || scripts.length === 0) return content;

  const activeScripts = scripts.filter((s) => scriptAppliesTo(s, isForUI));
  if (activeScripts.length === 0) return content;

  let text = content;
  for (const script of activeScripts) {
    if (!roleMatchesPlacement(role, script.placement)) continue;
    if (script.minDepth !== null && script.minDepth !== undefined && depth < script.minDepth) continue;
    if (script.maxDepth !== null && script.maxDepth !== undefined && depth > script.maxDepth) continue;
    text = runScript(text, script);
  }

  return text;
}


/**
 * Áp dụng Regex Scripts lên danh sách tin nhắn.
 *
 * @param messages Lịch sử tin nhắn
 * @param scripts Danh sách regex scripts từ Preset
 * @param isForUI true = đang render ra màn hình (bỏ script promptOnly),
 *                false = đang ghép payload gửi API (bỏ script markdownOnly).
 * @returns Danh sách messages mới (copy content).
 */
export function applyRegexScripts(
  messages: ApiChatMessage[],
  scripts: STRegexScript[],
  isForUI: boolean
): ApiChatMessage[] {
  if (!scripts || scripts.length === 0) return messages;

  // Clone mảng để không sửa trực tiếp object gốc
  const result = messages.map(m => ({ ...m }));

  if (!scripts.some((s) => scriptAppliesTo(s, isForUI))) return result;

  // Depth trong SillyTavern đếm ngược từ tin mới nhất.
  // result = [tin 0, tin 1, ..., tin N] (tin N là mới nhất)
  // Depth của tin N là 0, của tin 0 là N.
  for (let i = 0; i < result.length; i++) {
    const msg = result[i];
    const depth = result.length - 1 - i;

    // Gọi hàm dùng chung
    msg.content = applyRegexForSingleMessage(msg.content, msg.role, depth, scripts, isForUI);
  }

  return result;
}
