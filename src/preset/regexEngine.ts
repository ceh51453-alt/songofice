import type { ApiChatMessage } from "../types/connection";
import type { STRegexScript } from "./presetSchema";
import { createLogger } from "../lib/log";

const log = createLogger("regexEngine");

/**
 * Phân tích cú pháp chuỗi Regex kiểu SillyTavern: "/pattern/flags"
 */
export function compileRegex(regexString: string): RegExp | null {
  try {
    const match = regexString.match(/^\/(.+)\/([a-z]*)$/is);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
    // Nếu không bọc trong /.../ thì coi như chuỗi thường nhưng parse thành Regex
    return new RegExp(regexString, "gi");
  } catch (err) {
    log.warn(`Lỗi biên dịch regex: ${regexString}`, err);
    return null;
  }
}

/**
 * Khớp placement của SillyTavern.
 * 0: System (hoặc marker)
 * 1: User
 * 2: Assistant
 */
function roleMatchesPlacement(role: ApiChatMessage["role"], placement: number[]): boolean {
  if (!placement || placement.length === 0) return true; // không chỉ định => áp dụng mọi nơi
  
  const roleMap: Record<ApiChatMessage["role"], number> = {
    system: 0,
    user: 1,
    assistant: 2,
  };
  return placement.includes(roleMap[role]);
}

/**
 * Áp dụng Regex Scripts lên danh sách tin nhắn.
 * 
 * @param messages Lịch sử tin nhắn
 * @param scripts Danh sách regex scripts từ Preset
 * @param isForUI Nếu true, chỉ áp dụng các regex có markdownOnly=true hoặc KHÔNG có promptOnly. Nếu false (gửi API), chỉ áp dụng regex KHÔNG có markdownOnly.
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

  // Lọc scripts theo ngữ cảnh (UI vs API)
  const activeScripts = scripts.filter(s => {
    if (s.disabled) return false;
    if (isForUI) {
      // Ở UI: bỏ qua những cái promptOnly
      return !s.promptOnly;
    } else {
      // Ở API: bỏ qua những cái markdownOnly
      return !s.markdownOnly;
    }
  });

  if (activeScripts.length === 0) return result;

  // Compile regex trước để tối ưu
  const compiledScripts = activeScripts.map(s => ({
    ...s,
    regex: compileRegex(s.findRegex),
  })).filter(s => s.regex !== null);

  // Depth trong SillyTavern đếm ngược từ tin mới nhất.
  // result = [tin 0, tin 1, ..., tin N] (tin N là mới nhất)
  // Depth của tin N là 0, của tin 0 là N.
  for (let i = 0; i < result.length; i++) {
    const msg = result[i];
    const depth = result.length - 1 - i;

    for (const script of compiledScripts) {
      // Kiểm tra placement
      if (!roleMatchesPlacement(msg.role, script.placement)) continue;

      // Kiểm tra depth
      if (script.minDepth !== null && script.minDepth !== undefined && depth < script.minDepth) continue;
      if (script.maxDepth !== null && script.maxDepth !== undefined && depth > script.maxDepth) continue;

      // Thực thi Regex
      try {
        // Reset lastIndex đề phòng flag g
        script.regex!.lastIndex = 0;
        // Chú ý: replace với string trong JS có thể dùng $1, $2 bình thường
        // Tuy nhiên SillyTavern có escape một số thứ, nhưng replaceString của nó tương thích JS cơ bản.
        // Hỗ trợ tag sandwich (dòng text có xuống dòng): 
        // regex replacement sẽ xử lý bằng regex gốc của JS.
        msg.content = msg.content.replace(script.regex!, script.replaceString);
      } catch (err) {
        log.warn(`Lỗi khi chạy regex script [${script.scriptName}]:`, err);
      }
    }
  }

  return result;
}
