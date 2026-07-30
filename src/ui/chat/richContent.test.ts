/**
 * Tách nội dung giàu của tin nhắn AI: khối ```html``` (chạy iframe cách ly) vs
 * HTML thô (shadow DOM) vs văn thường.
 */
import { describe, expect, it } from "vitest";
import { splitRichContent, looksLikeHtml, htmlToPlainText } from "./richContent";
import { injectBridge } from "./stBridge";

describe("splitRichContent", () => {
  it("tách khối ```html``` ra khỏi văn xung quanh", () => {
    const parts = splitRichContent("Trước\n```html\n<div>A</div>\n```\nSau");
    expect(parts.map((p) => p.kind)).toEqual(["text", "htmlBlock", "text"]);
    expect(parts[1].content.trim()).toBe("<div>A</div>");
    expect(parts[0].content).toContain("Trước");
    expect(parts[2].content).toContain("Sau");
  });

  it("nhiều khối html trong một tin", () => {
    const parts = splitRichContent("```html\n<i>1</i>\n```\ngiữa\n```html\n<i>2</i>\n```");
    expect(parts.filter((p) => p.kind === "htmlBlock")).toHaveLength(2);
  });

  it("không có fence → đúng một phần text", () => {
    const parts = splitRichContent("chỉ là văn thường");
    expect(parts).toEqual([{ kind: "text", content: "chỉ là văn thường" }]);
  });

  it("chuỗi rỗng vẫn trả 1 phần (không vỡ render)", () => {
    expect(splitRichContent("")).toHaveLength(1);
  });
});

describe("looksLikeHtml", () => {
  it("bắt HTML trình bày của preset", () => {
    expect(looksLikeHtml('<div style="x"><details><summary>a</summary></details></div>')).toBe(true);
    expect(looksLikeHtml("<style>.a{color:red}</style>")).toBe(true);
  });

  it("không bắt văn thường hay thẻ ngữ nghĩa của app", () => {
    expect(looksLikeHtml("Nàng nói: 5 < 7 và 9 > 2")).toBe(false);
    expect(looksLikeHtml("<raven_scroll>tin</raven_scroll>")).toBe(false);
  });
});

describe("htmlToPlainText", () => {
  it("bóc thẻ, style, script và giải mã entity cơ bản", () => {
    const plain = htmlToPlainText('<style>.a{}</style><div>Eddard <b>Stark</b> &amp; con</div>');
    expect(plain).not.toContain("<");
    expect(plain).toContain("Eddard");
    expect(plain).toContain("Stark");
    expect(plain).toContain("&");
  });
});

describe("injectBridge", () => {
  it("chèn bridge NGAY SAU <head> — trước script của preset", () => {
    const out = injectBridge("<!DOCTYPE html><html><head><title>t</title></head><body><script>x()<\/script></body></html>", "f1");
    expect(out.indexOf("__asoiafBridge")).toBeGreaterThan(out.indexOf("<head>"));
    expect(out.indexOf("__asoiafBridge")).toBeLessThan(out.indexOf("<title>"));
    expect(out).toContain('"f1"');
  });

  it("không có <head> thì chèn sau <body>", () => {
    const out = injectBridge("<body><p>a</p></body>", "f2");
    expect(out.indexOf("__asoiafBridge")).toBeGreaterThan(out.indexOf("<body>"));
    expect(out.indexOf("__asoiafBridge")).toBeLessThan(out.indexOf("<p>"));
  });

  it("mảnh HTML trần thì đặt lên đầu", () => {
    expect(injectBridge("<div>a</div>", "f3").startsWith("<script>")).toBe(true);
  });

  it("mỗi iframe có FRAME_ID riêng (message không lẫn giữa các khối)", () => {
    expect(injectBridge("<div/>", "aaa")).toContain('"aaa"');
    expect(injectBridge("<div/>", "bbb")).not.toContain('"aaa"');
  });
});
