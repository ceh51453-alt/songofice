/**
 * Cầu nối SillyTavern cho khối ```html``` của preset (chạy trong iframe cách ly).
 *
 * Vì sao cần: script trong khối HTML của preset ST gọi thẳng
 *   window.parent.SillyTavern.getContext()   → đọc lịch sử chat, gọi generate()
 *   window.parent.document.getElementById('send_textarea' | 'send_but')
 * Đó là DOM/API của SillyTavern — app này không có.
 *
 * Cách làm: iframe chạy với sandbox="allow-scripts" (KHÔNG allow-same-origin) nên
 * origin của nó là "null" — JS trong đó KHÔNG đọc được localStorage/IndexedDB của
 * app (nơi giữ API key và save). Bridge dựng sẵn `window.parent` GIẢ ngay trong
 * iframe: có `document` trỏ về DOM của chính iframe (đã cắm sẵn #send_textarea +
 * #send_but) và `SillyTavern.getContext()` trả context mô phỏng. Mọi hành động ra
 * ngoài đi qua postMessage để app tự quyết.
 *
 * `window.top` KHÔNG ghi đè được (LegacyUnforgeable) — không sao, script preset
 * luôn thử `window.parent` trước và bọc try/catch.
 */

/** Đánh dấu message: iframe → app. */
export const BRIDGE_MSG = "__asoiafBridge";
/** Đánh dấu message: app → iframe. */
export const HOST_MSG = "__asoiafHost";

/** Một message trong lịch sử, theo hình dạng ST (`is_user` / `mes`). */
export interface StChatMessage {
  is_user: boolean;
  is_system: boolean;
  name: string;
  mes: string;
  role: "user" | "assistant" | "system";
  content: string;
}

const BRIDGE_SOURCE = `
(function () {
  var FRAME_ID = "__FRAME_ID__";
  var realParent = window.parent;

  function post(type, payload) {
    try { realParent.postMessage({ __asoiafBridge: true, id: FRAME_ID, type: type, payload: payload }, "*"); } catch (e) {}
  }

  /* Script của preset lỗi thì báo ra app thay vì chết im lặng. */
  window.addEventListener("error", function (ev) {
    post("scriptError", { message: String(ev.message), line: ev.lineno || 0 });
  });

  /* ---- localStorage giả: origin "null" nên bản thật ném SecurityError ---- */
  var memStore = (function () {
    var m = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; },
      key: function (i) { return Object.keys(m)[i] || null; },
      get length() { return Object.keys(m).length; }
    };
  })();
  try { Object.defineProperty(window, "localStorage", { value: memStore, configurable: true, writable: true }); } catch (e) {}

  /* ---- DOM giả của ST: ô soạn tin + nút gửi ----
     PHẢI đợi có <body>: bridge chạy trong <head> nên document.body còn null;
     nhét node thẳng vào <html> lúc parser đang dở <head> sẽ phá luồng parse của
     tài liệu (script cuối body không chạy, sự kiện load không tới đúng chỗ). */
  function mountHolder() {
    if (!document.body) return;
    if (document.getElementById("send_textarea")) return;
    var holder = document.createElement("div");
    holder.id = "__asoiaf_st_holder";
    holder.setAttribute("style", "position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none");
    var ta = document.createElement("textarea");
    ta.id = "send_textarea";
    var btn = document.createElement("button");
    btn.id = "send_but";
    btn.type = "button";
    btn.addEventListener("click", function () { submit(ta.value); });
    holder.appendChild(ta);
    holder.appendChild(btn);
    document.body.appendChild(holder);
  }

  var chat = [];
  var settings = {};
  var listeners = {};

  function submit(text) {
    var t = String(text == null ? "" : text).trim();
    if (!t) return;
    post("send", { text: t });
    var ta = document.getElementById("send_textarea");
    if (ta) ta.value = "";
  }

  function emit(ev) {
    var arr = listeners[ev];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) { try { arr[i](); } catch (e) {} }
  }

  var eventSource = {
    on: function (ev, cb) { (listeners[ev] = listeners[ev] || []).push(cb); },
    once: function (ev, cb) {
      var wrap = function () { eventSource.off(ev, wrap); cb(); };
      eventSource.on(ev, wrap);
    },
    off: function (ev, cb) {
      var arr = listeners[ev]; if (!arr) return;
      var i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1);
    },
    removeListener: function (ev, cb) { eventSource.off(ev, cb); },
    emit: function (ev) { emit(ev); }
  };

  var context = {
    chat: chat,
    messages: chat,
    eventSource: eventSource,
    eventTypes: {
      MESSAGE_RENDERED: "messageRendered",
      CHAT_CHANGED: "chatChanged",
      MESSAGE_RECEIVED: "messageReceived"
    },
    extensionSettings: settings,
    saveSettingsDebounced: function () { post("saveSettings", settings); },
    generate: function () {
      var ta = document.getElementById("send_textarea");
      submit(ta ? ta.value : "");
    },
    sendSystemMessage: function () {},
    getContext: function () { return context; }
  };

  var SillyTavernShim = { getContext: function () { return context; } };

  var fakeDoc = {
    getElementById: function (id) { return document.getElementById(id); },
    querySelector: function (s) { try { return document.querySelector(s); } catch (e) { return null; } },
    querySelectorAll: function (s) { try { return document.querySelectorAll(s); } catch (e) { return []; } },
    createElement: function (t) { return document.createElement(t); },
    addEventListener: function () {},
    removeEventListener: function () {},
    get body() { return document.body; },
    get documentElement() { return document.documentElement; }
  };

  var fakeParent = {
    __ASOIAF_BRIDGE__: true,
    document: fakeDoc,
    SillyTavern: SillyTavernShim,
    localStorage: memStore,
    postMessage: function (m, o) { try { realParent.postMessage(m, o || "*"); } catch (e) {} },
    addEventListener: function () {},
    removeEventListener: function () {}
  };
  try {
    Object.defineProperty(window, "parent", { value: fakeParent, configurable: true, writable: true });
  } catch (e) {}
  window.SillyTavern = SillyTavernShim;
  window.__ASOIAF_BRIDGE__ = true;

  /* ---- app → iframe: đồng bộ lịch sử chat ---- */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.__asoiafHost !== true) return;
    if (d.type === "chat") {
      chat.length = 0;
      var list = d.payload || [];
      for (var i = 0; i < list.length; i++) chat.push(list[i]);
      emit("messageRendered");
      emit("chatChanged");
      emit("messageReceived");
    }
  });

  /* ---- báo chiều cao để app co giãn iframe ----
     KHÔNG chỉ dựa vào scrollHeight: iframe đặt scrolling="no" nên viewport kẹp
     scrollHeight bằng chiều cao khung ⇒ nội dung tràn sẽ bị cắt vĩnh viễn.
     Đo mép dưới thật của các phần tử (layout vẫn tính dù bị clip). */
  var lastH = 0;
  function measure() {
    var b = document.body;
    if (!b) return 0;
    var max = 0;
    for (var i = 0; i < b.children.length; i++) {
      var el = b.children[i];
      if (el.id === "__asoiaf_st_holder") continue;
      var r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom > max) max = r.bottom;
    }
    try {
      var cs = getComputedStyle(b);
      max += (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.marginBottom) || 0);
    } catch (e) {}
    return Math.ceil(Math.max(max, b.scrollHeight || 0));
  }
  function reportHeight() {
    var h = measure();
    if (h && Math.abs(h - lastH) > 2) { lastH = h; post("height", { height: h }); }
  }
  if (window.ResizeObserver) {
    try {
      var ro = new ResizeObserver(reportHeight);
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    } catch (e) {}
  }
  if (window.MutationObserver) {
    try {
      new MutationObserver(reportHeight).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true, attributes: true
      });
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountHolder(); reportHeight(); });
  }
  window.addEventListener("load", function () { mountHolder(); reportHeight(); });

  /* "ready" là bắt tay MỘT CHIỀU: nếu app gắn listener sau khi iframe đã nạp thì
     gói đầu tiên mất luôn. Phát lại đều khi lịch sử vẫn rỗng (chat rỗng thật thì
     chỉ tốn 1 message mỗi 600ms, không đáng kể). */
  setInterval(function () {
    mountHolder();
    reportHeight();
    if (chat.length === 0) post("ready", {});
  }, 600);

  post("ready", {});
})();
`;

/**
 * Chèn bridge vào TRƯỚC script của preset. Khối ```html``` thường là tài liệu
 * đầy đủ (<!DOCTYPE html><head>…) nên chèn ngay sau <head>, thiếu thì sau <body>,
 * thiếu nữa thì đặt lên đầu.
 */
export function injectBridge(html: string, frameId: string): string {
  const tag = `<script>${BRIDGE_SOURCE.replace("__FRAME_ID__", frameId)}</script>`;
  const head = html.match(/<head[^>]*>/i);
  if (head?.index !== undefined) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + tag + html.slice(at);
  }
  const body = html.match(/<body[^>]*>/i);
  if (body?.index !== undefined) {
    const at = body.index + body[0].length;
    return html.slice(0, at) + tag + html.slice(at);
  }
  return tag + html;
}
