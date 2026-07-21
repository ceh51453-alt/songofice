/**
 * Màn hình chat: lịch sử + streaming + retry banner + reroll/swipe (19.1)
 * + thẻ ngữ nghĩa render inline (5.6) + Action Deck (6.3).
 */
import { useEffect, useRef } from "react";
import { useChatStore, type UiChatMessage } from "../../state/chatStore";
import { useExtraModelStore } from "../../state/extraModelStore";
import { useUiStore } from "../../state/uiStore";
import { useT } from "../../i18n";
import { GlassButton } from "../components/GlassButton";
import { NarrativeContent } from "../tags/NarrativeSegments";
import { ActionDeck } from "../layout/ActionDeck";
import {
  IconAlert, IconChevronLeft, IconChevronRight, IconRefresh, IconSend, IconSpinner, IconStop, IconZap,
} from "../icons";

function Bubble({ role, children, stopped }: { role: "user" | "assistant"; children: React.ReactNode; stopped?: boolean }) {
  const t = useT();
  return (
    <div className={`anim-in flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`glass max-w-[92%] px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[80%] ${
          role === "user" ? "border-[var(--accent-border)] bg-[var(--accent-soft)] whitespace-pre-wrap" : "bg-[var(--glass-bg)]"
        }`}
      >
        {children}
        {stopped && <div className="mt-1 text-[12px] italic text-[var(--text-faint)]">{t("chat.stoppedNote")}</div>}
      </div>
    </div>
  );
}

/** Thanh điều khiển reroll/swipe dưới tin nhắn AI cuối (19.1). */
function VariantControls({ msg }: { msg: UiChatMessage }) {
  const t = useT();
  const { reroll, swipeVariant, status } = useChatStore();
  const busy = status !== "idle";
  const count = msg.variants?.length ?? 1;
  const active = (msg.activeVariant ?? 0) + 1;

  return (
    <div className="mt-1 flex items-center gap-1.5 pl-1">
      {count > 1 && (
        <>
          <button
            onClick={() => swipeVariant(-1)}
            disabled={busy}
            aria-label={t("chat.prevVariant")}
            className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)] disabled:opacity-30"
          >
            <IconChevronLeft size={14} />
          </button>
          <span className="font-mono text-[11px] text-[var(--text-faint)]">
            {active}/{count}
          </span>
          <button
            onClick={() => swipeVariant(1)}
            disabled={busy}
            aria-label={t("chat.nextVariant")}
            className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)] disabled:opacity-30"
          >
            <IconChevronRight size={14} />
          </button>
        </>
      )}
      <button
        onClick={() => void reroll()}
        disabled={busy}
        title={t("chat.reroll")}
        className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--accent-text)] disabled:opacity-30"
      >
        <IconRefresh size={12} /> {t("chat.reroll")}
      </button>
      <ExtraModelButton msg={msg} />
    </div>
  );
}

/** Nút "Phân tích biến" — chỉ hiện khi extra model bật. */
function ExtraModelButton({ msg }: { msg: UiChatMessage }) {
  const t = useT();
  const extraEnabled = useExtraModelStore((s) => s.enabled);
  const extraStatus = useExtraModelStore((s) => s.lastStatus);
  const triggerExtra = useChatStore((s) => s.triggerExtraForMessage);
  const busy = useChatStore((s) => s.status) !== "idle";

  if (!extraEnabled) return null;

  return (
    <button
      onClick={() => void triggerExtra(msg.id)}
      disabled={busy || extraStatus === "running"}
      title={t("extra.analyzeBtn")}
      className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--accent-text)] disabled:opacity-30"
    >
      {extraStatus === "running" ? <IconSpinner size={12} /> : <IconZap size={12} />}
      {t("extra.analyzeBtn")}
    </button>
  );
}

export function ChatScreen() {
  const t = useT();
  const { messages, status, draft, draftReasoning, retryInfo, error, send, retryLast, cancel } = useChatStore();
  const input = useUiStore((s) => s.composerText);
  const setInput = useUiStore((s) => s.setComposerText);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const busy = status !== "idle";
  const lastAssistantIdx = messages.length > 0 && messages[messages.length - 1].role === "assistant" ? messages.length - 1 : -1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, draft, retryInfo, error]);

  async function handleSend() {
    const text = input;
    if (!text.trim() || busy) return;
    setInput("");
    await send(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ---- Danh sách tin nhắn ---- */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.length === 0 && !busy && (
            <div className="glass mx-auto mt-[10vh] max-w-md px-6 py-8 text-center">
              <h2 className="font-display mb-2 text-xl tracking-wide text-[var(--accent-text)]">{t("chat.emptyTitle")}</h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{t("chat.emptyBody")}</p>
            </div>
          )}

          {messages.map((m, i) => {
            if (m.hidden) return null; // tin hệ thống — AI thấy, người chơi không (6.2)
            const variant = m.variants?.[m.activeVariant ?? 0];
            return (
              <div key={m.id}>
                <Bubble role={m.role} stopped={variant?.stopped}>
                  {m.role === "assistant" ? <NarrativeContent text={m.content} /> : m.content}
                </Bubble>
                {i === lastAssistantIdx && m.variants && <VariantControls msg={m} />}
              </div>
            );
          })}

          {/* Tin nhắn đang stream */}
          {busy && (draft || draftReasoning) && (
            <Bubble role="assistant">
              {draftReasoning && (
                <div className="mb-2 border-l-2 border-[var(--glass-border-bright)] pl-2 text-[13px] italic text-[var(--text-faint)]">
                  {draftReasoning}
                </div>
              )}
              <span className="whitespace-pre-wrap">{draft}</span>
              <span className="anim-pulse ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[var(--accent-text)]" />
            </Bubble>
          )}

          {status === "waiting" && !draft && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-[var(--text-faint)]">
              <IconSpinner size={14} /> {t("chat.waiting")}
            </div>
          )}

          {status === "retrying" && retryInfo && (
            <div className="glass anim-in flex items-center justify-between gap-3 border-[rgba(194,164,104,0.35)] bg-[var(--warn-soft)] px-4 py-2.5">
              <span className="flex items-center gap-2 text-[13px] text-[var(--warn)]">
                <IconSpinner size={14} />
                {t("chat.retrying", { n: retryInfo.attempt, total: retryInfo.maxRetries })}
                <span className="hidden text-[var(--text-faint)] sm:inline">— {retryInfo.reason}</span>
              </span>
              <GlassButton size="sm" variant="ghost" onClick={cancel}>
                {t("chat.cancel")}
              </GlassButton>
            </div>
          )}

          {error && (
            <div className="glass anim-in flex flex-wrap items-center justify-between gap-3 border-[rgba(176,106,95,0.4)] bg-[var(--danger-soft)] px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--danger)]">
                <IconAlert size={15} className="shrink-0" />
                <span className="break-words">{error}</span>
              </span>
              <GlassButton size="sm" variant="danger" onClick={() => void retryLast()}>
                <IconRefresh size={13} /> {t("chat.retry")}
              </GlassButton>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ---- Action Deck (6.3) ---- */}
      <div className="border-t border-[var(--glass-border)] bg-[rgba(10,13,18,0.35)] backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <ActionDeck />
        </div>

        {/* ---- Ô nhập ---- */}
        <div className="px-3 pb-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              rows={Math.min(5, Math.max(1, input.split("\n").length))}
              placeholder={t("chat.placeholder")}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              className="max-h-40 flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] px-3.5 py-2.5 text-[15px] text-[var(--text-soft)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-border)] focus:outline-none"
            />
            {busy ? (
              <GlassButton variant="danger" onClick={cancel} className="h-[42px]" title={t("chat.stop")}>
                <IconStop size={16} />
                <span className="hidden sm:inline">{t("chat.stop")}</span>
              </GlassButton>
            ) : (
              <GlassButton
                variant="accent"
                onClick={() => void handleSend()}
                disabled={!input.trim()}
                className="h-[42px]"
                title={t("chat.send")}
              >
                <IconSend size={16} />
                <span className="hidden sm:inline">{t("chat.send")}</span>
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
