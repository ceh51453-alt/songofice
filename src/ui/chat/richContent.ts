/**
 * Tách nội dung tin nhắn AI thành các phần render khác nhau (hỗ trợ preset ST
 * kiểu "regex sinh HTML"):
 *
 *   - ```html ... ```  → khối HTML ĐẦY ĐỦ có <script> → chạy trong iframe cách ly
 *                        (SandboxedHtml) — đây là quy ước của TavernHelper.
 *   - HTML thô lẫn trong văn  → render trong shadow DOM đã lọc (InlineHtml):
 *                        <details>/<style> của "chuỗi tư duy" chạy được mà CSS
 *                        không rò ra ngoài app.
 *   - phần còn lại      → văn thường (giữ nguyên tô tên nhân vật + chân dung).
 */
export type RichPart =
  | { kind: "text"; content: string }
  | { kind: "htmlBlock"; content: string };

/** ```html ... ``` (hoặc ```HTML) — fence bao khối tài liệu HTML tự chạy. */
const HTML_FENCE_RE = /```html\s*\r?\n([\s\S]*?)```/gi;

export function splitRichContent(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const m of text.matchAll(HTML_FENCE_RE)) {
    const before = text.slice(last, m.index);
    if (before.trim()) parts.push({ kind: "text", content: before });
    if (m[1].trim()) parts.push({ kind: "htmlBlock", content: m[1] });
    last = (m.index ?? 0) + m[0].length;
  }
  const rest = text.slice(last);
  if (rest.trim() || parts.length === 0) parts.push({ kind: "text", content: rest });
  return parts;
}

/**
 * Thẻ HTML "trình bày" mà preset hay chèn thẳng vào văn. Cố ý KHÔNG bắt thẻ ngữ
 * nghĩa của app (raven_scroll…) — parseNarrative xử lý chúng trước.
 */
const HTML_TAG_RE =
  /<(?:div|details|summary|span|style|table|thead|tbody|tr|td|th|p|br|hr|img|h[1-6]|ul|ol|li|blockquote|section|article|figure|font|center|b|i|u|s|em|strong|small|sub|sup|code|pre|mark|progress|meter|svg)\b[^>]*>/i;

/** true = đoạn văn có HTML trình bày → nên render qua InlineHtml. */
export function looksLikeHtml(text: string): boolean {
  return HTML_TAG_RE.test(text);
}

/** Bóc text thuần khỏi HTML (dùng để dò tên nhân vật cho thẻ chân dung). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, " ");
}
