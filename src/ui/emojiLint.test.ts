/**
 * emojiLint.test.ts (M16, mục 24) — Quét emoji Unicode trong UI code.
 *
 * Ràng buộc mỹ thuật: KHÔNG emoji trong app. Mọi icon là SVG.
 * Test này fail nếu tìm thấy emoji trong .tsx files.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

/**
 * Regex bắt các dải emoji phổ biến (Emoji_Presentation characters).
 * Không bắt ký tự tiếng Việt hoặc ký tự kỹ thuật thông thường.
 */
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA9F}\u{1FAD0}-\u{1FAFF}]/u;

/** Thu thập đệ quy tất cả .tsx files trong thư mục. */
function collectTsxFiles(dir: string): string[] {
  const result: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return result;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const s = statSync(full);
      if (s.isDirectory()) {
        // Bỏ qua node_modules, .git, dist
        if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
        result.push(...collectTsxFiles(full));
      } else if (extname(entry) === ".tsx") {
        result.push(full);
      }
    } catch {
      // Bỏ qua file không đọc được
    }
  }
  return result;
}

describe("Kiểm tra mỹ thuật (M16)", () => {
  it("không có emoji trong .tsx files", () => {
    const srcDir = join(__dirname, "..");
    const files = collectTsxFiles(srcDir);
    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (EMOJI_REGEX.test(lines[i])) {
            violations.push({
              file: file.replace(srcDir, "src"),
              line: i + 1,
              content: lines[i].trim().substring(0, 80),
            });
          }
        }
      } catch {
        // Bỏ qua file không đọc được
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line} — ${v.content}`)
        .join("\n");
      expect.fail(
        `Tìm thấy ${violations.length} emoji trong UI code (ràng buộc mỹ thuật cấm emoji):\n${report}`,
      );
    }
  });
});
