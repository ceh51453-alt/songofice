/**
 * EJS engine cho lorebook động (mục 5.5b — BẮT BUỘC):
 * - getvar(path, { defaults }) đọc biến state (M3: variables store; M4: nối
 *   thẳng MVU stat_data qua cùng interface — path "stat_data.X.Y" đã hỗ trợ).
 * - getwi(bookId|null, name) nạp nội dung 1 entry khác theo comment/tên,
 *   render EJS đệ quy có giới hạn — cho entry "điều phối" chọn entry con.
 * - Cú pháp EJS đầy đủ (<%_ if _%>, <%= %>, <%- %>), async/await.
 * - Entry lỗi cú pháp KHÔNG làm sập prompt: log + bỏ entry đó, chạy tiếp.
 */
// ejs v6: Vite resolve field "browser" (ejs.min.js) cho web, node dùng lib ESM
import ejs from "ejs";
import type { LoreEntry } from "./loreSchema";
import { createLogger } from "../lib/log";

const log = createLogger("lore/ejs");

export interface EjsBridge {
  /** Đọc biến state theo path (vd "stat_data.Lãnh_Địa.Cư_dân.Lòng_dân"). */
  getvar: (path: string, opts?: { defaults?: unknown }) => unknown;
  /** Tìm entry theo tên/comment (trong mọi nguồn đang bật) — cho getwi. */
  findEntry: (name: string) => LoreEntry | undefined;
}

const MAX_GETWI_DEPTH = 4;

/**
 * Render nội dung 1 entry qua EJS. Trả chuỗi kết quả; lỗi → cảnh báo + "" .
 * Entry không chứa "<%" trả nguyên văn (nhanh, không compile).
 */
export async function renderLoreContent(
  content: string,
  bridge: EjsBridge,
  warnings: string[],
  entryLabel: string,
  depth = 0,
): Promise<string> {
  if (!content.includes("<%")) return content;
  if (depth > MAX_GETWI_DEPTH) {
    warnings.push(`getwi vượt độ sâu ${MAX_GETWI_DEPTH} tại "${entryLabel}" — dừng đệ quy`);
    return "";
  }

  const locals = {
    getvar: (path: string, opts?: { defaults?: unknown }) => bridge.getvar(path, opts),
    // getwi(bookId|null, name) — bookId bỏ qua (đã gộp mọi nguồn), name = comment/tên entry
    getwi: async (_book: unknown, name?: string): Promise<string> => {
      const entryName = typeof name === "string" && name ? name : typeof _book === "string" ? _book : "";
      if (!entryName) return "";
      const target = bridge.findEntry(entryName);
      if (!target) {
        warnings.push(`getwi: không tìm thấy entry "${entryName}" (gọi từ "${entryLabel}")`);
        return "";
      }
      return renderLoreContent(target.content, bridge, warnings, target.comment || entryName, depth + 1);
    },
  };

  try {
    return await ejs.render(content, locals, { async: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`Entry EJS lỗi "${entryLabel}": ${msg.split("\n")[0]} — bỏ entry này`);
    log.warn(`EJS lỗi tại "${entryLabel}"`, msg);
    return "";
  }
}
