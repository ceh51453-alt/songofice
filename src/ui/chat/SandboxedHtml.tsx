/**
 * Khối ```html``` của preset ST → iframe CÁCH LY (sandbox="allow-scripts", KHÔNG
 * allow-same-origin ⇒ origin "null": JS trong đó không đọc được localStorage /
 * IndexedDB của app). Bridge trong stBridge.ts dựng `window.parent` giả nên
 * script preset (thẻ lựa chọn, bảng trạng thái…) chạy y như trong SillyTavern.
 *
 * Nút "chọn" trong khối HTML → postMessage → chatStore.send() của app.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../../state/chatStore";
import { injectBridge, type StChatMessage } from "./stBridge";
import { createLogger } from "../../lib/log";

const log = createLogger("stHtmlBlock");

const MIN_HEIGHT = 90;
const MAX_HEIGHT = 1600;

export function SandboxedHtml({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const idRef = useRef(`stframe-${Math.random().toString(36).slice(2)}`);
  const [height, setHeight] = useState(MIN_HEIGHT * 2);

  const messages = useChatStore((s) => s.messages);
  const send = useChatStore((s) => s.send);
  const busy = useChatStore((s) => s.status !== "idle");
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const srcDoc = useMemo(() => injectBridge(html, idRef.current), [html]);

  /** Lịch sử chat theo hình dạng ST (script preset đọc `.mes` / `.is_user`). */
  const stChat = useMemo<StChatMessage[]>(
    () =>
      messages
        .filter((m) => !m.hidden)
        .map((m) => ({
          is_user: m.role === "user",
          is_system: false,
          name: m.role === "user" ? "You" : "Narrator",
          mes: m.content,
          role: m.role,
          content: m.content,
        })),
    [messages],
  );
  // bắt tay "ready" có thể tới trước lần render kế — đọc lịch sử mới nhất qua ref
  const chatRef = useRef(stChat);
  chatRef.current = stChat;

  /** Đẩy lịch sử sang iframe (an toàn khi gọi thừa — iframe chưa nạp thì bỏ qua). */
  const pushChat = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { __asoiafHost: true, type: "chat", payload: chatRef.current },
      "*",
    );
  }, []);

  // iframe → app
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const win = frameRef.current?.contentWindow;
      if (!win || e.source !== win) return;
      const d = e.data as { __asoiafBridge?: boolean; id?: string; type?: string; payload?: unknown };
      if (!d || d.__asoiafBridge !== true || d.id !== idRef.current) return;

      if (d.type === "ready") {
        // trả lời NGAY bằng dữ liệu mới nhất — không đợi vòng render sau
        pushChat();
        return;
      }
      if (d.type === "height") {
        const h = Number((d.payload as { height?: number })?.height ?? 0);
        if (h > 0) setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(h) + 4)));
        return;
      }
      if (d.type === "scriptError") {
        const p = d.payload as { message?: string; line?: number };
        log.warn(`Script trong khối HTML của preset lỗi: ${p?.message ?? "?"} (dòng ${p?.line ?? "?"})`);
        return;
      }
      if (d.type === "send") {
        const text = String((d.payload as { text?: string })?.text ?? "").trim();
        if (!text) return;
        if (busyRef.current) {
          log.warn("Khối HTML gửi khi AI đang chạy — bỏ qua");
          return;
        }
        void send(text);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send, pushChat]);

  // app → iframe: đẩy lịch sử mỗi khi đổi
  useEffect(() => {
    pushChat();
  }, [stChat, pushChat]);

  return (
    <iframe
      ref={frameRef}
      title="Khối giao diện của preset"
      // KHÔNG thêm allow-same-origin: đó là ranh giới an toàn của khối này.
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      onLoad={pushChat}
      className="anim-in my-2 w-full border-0 bg-transparent"
      style={{ height, colorScheme: "normal" }}
      scrolling="no"
    />
  );
}
