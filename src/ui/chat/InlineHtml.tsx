/**
 * Render HTML thô do regex script của preset sinh ra (vd hộp "chuỗi tư duy"
 * <details> + <style>) — an toàn theo hai lớp:
 *   1. DOMPurify lọc script/handler/thẻ nguy hiểm (giữ <style>, <details>).
 *   2. SHADOW DOM: CSS của preset không rò ra làm vỡ giao diện app, và CSS app
 *      không đè lên preset. Không cần viết lại selector.
 */
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

/** Thẻ trình bày ST hay dùng mà DOMPurify chặn mặc định. */
const ADD_TAGS = ["style", "details", "summary", "marquee"];

export function sanitizeInlineHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS,
    // <iframe>/<script>/<object> chỉ được phép qua khối ```html (chạy cách ly)
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "link", "base", "meta"],
    FORBID_ATTR: ["formaction", "srcdoc"],
    ALLOW_DATA_ATTR: true,
  });
}

export function InlineHtml({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });
    }
    const root = shadowRef.current;
    // reset tối thiểu: kế thừa màu/phông của app rồi để CSS preset đè lên
    root.innerHTML =
      `<style>:host{display:block}*{box-sizing:border-box}` +
      `a{color:var(--accent-text,#b08d57)}</style>` +
      sanitizeInlineHtml(html);
  }, [html]);

  return <div ref={hostRef} className="anim-in my-1" />;
}
