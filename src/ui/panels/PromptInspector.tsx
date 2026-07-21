/**
 * Prompt Inspector (mục 3.4): dry-run pipeline trên history hiện tại —
 * (a) raw messages[] cuối cùng, (b) token count từng block + tổng,
 * (c) cảnh báo vượt max context, (d) nút Copy raw payload,
 * kèm: marker điền gì, block nào bị injection_depth chèn vào đâu, macro lạ.
 */
import { useEffect, useMemo, useState } from "react";
import { buildPipeline, type PipelineResult } from "../../prompt/promptPipeline";
import { isRealTokenizer } from "../../prompt/tokenizer";
import { getLastLoreDebug } from "../../lorebook/loreProvider";
import { useChatStore } from "../../state/chatStore";
import { useSettingsStore } from "../../state/settingsStore";
import { useT } from "../../i18n";
import { GlassButton } from "../components/GlassButton";
import type { BlockTrace } from "../../preset/buildFromPreset";
import { IconAlert, IconCheck, IconCopy, IconSpinner } from "../icons";

function kindLabel(t: (k: string, v?: Record<string, string | number>) => string, trace: BlockTrace): string {
  switch (trace.kind) {
    case "marker":
      return t("prompt.kindMarker");
    case "injection":
      return t("prompt.kindInjection", { depth: trace.injectedAt?.depth ?? 0 });
    case "prefill":
      return t("prompt.kindPrefill");
    case "history":
      return t("prompt.kindHistory");
    default:
      return "";
  }
}

function skipLabel(t: (k: string) => string, reason: NonNullable<BlockTrace["skippedReason"]>): string {
  switch (reason) {
    case "disabled":
      return t("prompt.skipDisabled");
    case "empty":
      return t("prompt.skipEmpty");
    default:
      return t("prompt.skipNotFound");
  }
}

export function PromptInspector() {
  const t = useT();
  const messages = useChatStore((s) => s.messages);
  const verbose = useSettingsStore((s) => s.verboseLogging);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);

  // Dry-run async (lore EJS) — macro setvar chạy trên biến thật (3.1b.3)
  useEffect(() => {
    let cancelled = false;
    void buildPipeline(messages.map((m) => ({ role: m.role, content: m.content }))).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [messages]);

  const payloadJson = useMemo(() => (result ? JSON.stringify(result.messages, null, 2) : ""), [result]);
  const estimate = !isRealTokenizer();
  const loreDebug = getLastLoreDebug();

  if (!result) {
    return (
      <div className="flex items-center gap-2 py-8 text-[13px] text-[var(--text-faint)]">
        <IconSpinner size={15} /> ...
      </div>
    );
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(payloadJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4 text-[13px]">
      {/* ---- Tóm tắt ---- */}
      <div className="glass space-y-1 px-3.5 py-2.5">
        <p className="text-[var(--text-soft)]">
          {result.usingPreset ? t("prompt.usingPreset", { name: result.presetName ?? "" }) : t("prompt.noPresetActive")}
        </p>
        <p className="text-[var(--text-muted)]">
          {t("prompt.totalTokens")}: <span className="font-mono text-[var(--accent-text)]">{result.totalTokens.toLocaleString()}</span>
          {estimate ? ` (${t("prompt.tokenEstimate")})` : ""} · {t("prompt.historyStat", { kept: result.historyIncluded, dropped: result.historyDropped })}
          {" · "}{result.messages.length} messages
        </p>
        {result.overBudget && (
          <p className="flex items-center gap-1.5 text-[var(--danger)]">
            <IconAlert size={14} /> {t("prompt.overBudget", { max: result.params.max_context.toLocaleString() })}
          </p>
        )}
        {result.usingPreset && (
          <p className="text-[12px] text-[var(--text-faint)]">
            {t("prompt.mergedParams")}: temp {result.params.temperature ?? "—"} · top_p {result.params.top_p ?? "—"} ·
            max_tokens {result.params.max_tokens.toLocaleString()} · max_context {result.params.max_context.toLocaleString()}
          </p>
        )}
      </div>

      {/* ---- Cảnh báo ---- */}
      {result.warnings.length > 0 && (
        <div className="glass max-h-36 overflow-y-auto border-[rgba(194,164,104,0.35)] bg-[var(--warn-soft)] px-3.5 py-2.5">
          <ul className="space-y-0.5 text-[12px] text-[var(--warn)]">
            {[...new Set(result.warnings)].map((w, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <IconAlert size={12} className="mt-0.5 shrink-0" /> <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Debug panel lore ẨN — chỉ hiện khi verbose logging (mục 4.3) ---- */}
      {verbose && loreDebug && (
        <div>
          <h3 className="font-display mb-1.5 text-[14px] tracking-wide text-[var(--accent-text)]">
            {t("lore.debugTitle", { n: loreDebug.activeCount, tokens: loreDebug.totalTokens })}
          </h3>
          <div className="glass max-h-56 overflow-y-auto">
            {loreDebug.entries.map((e, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-1.5 text-[12px] last:border-b-0">
                <span className="w-14 shrink-0 font-mono text-[11px] text-[var(--text-faint)]">{e.position}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">{e.comment}</span>
                <span className="shrink-0 text-[var(--text-muted)]">
                  {e.constant
                    ? t("lore.whyConstant")
                    : e.recursionLevel > 0
                      ? t("lore.whyRecursion", { level: e.recursionLevel, keys: e.matchedKeys.slice(0, 3).join(", ") })
                      : t("lore.whyKeys", { keys: e.matchedKeys.slice(0, 3).join(", ") })}
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[11px] text-[var(--text-muted)]">{e.tokens}</span>
              </div>
            ))}
            {loreDebug.dropped.map((d, i) => (
              <div key={`d${i}`} className="flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-1.5 text-[12px] opacity-45 last:border-b-0">
                <span className="w-14 shrink-0 font-mono text-[11px] text-[var(--danger)]">{t("lore.droppedTag")}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">{d.comment}</span>
                <span className="w-14 shrink-0 text-right font-mono text-[11px] text-[var(--text-muted)]">{d.tokens}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Bảng block ---- */}
      <div>
        <h3 className="font-display mb-1.5 text-[14px] tracking-wide text-[var(--accent-text)]">{t("prompt.blocks")}</h3>
        <div className="glass max-h-72 overflow-y-auto">
          {result.traces.map((tr, i) => (
            <div key={`${tr.identifier}-${i}`} className="border-b border-[var(--glass-border)] last:border-b-0">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[var(--glass-bg-hover)] ${
                  tr.skippedReason ? "opacity-45" : ""
                }`}
              >
                <span className="w-14 shrink-0 font-mono text-[11px] text-[var(--text-faint)]">{tr.role}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">{tr.name || tr.identifier}</span>
                {kindLabel(t, tr) && (
                  <span className="shrink-0 rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] px-1.5 py-px text-[11px] text-[var(--accent-text)]">
                    {kindLabel(t, tr)}
                  </span>
                )}
                {tr.skippedReason ? (
                  <span className="shrink-0 text-[11px] italic text-[var(--text-faint)]">{skipLabel(t, tr.skippedReason)}</span>
                ) : (
                  <span className="w-16 shrink-0 text-right font-mono text-[11px] text-[var(--text-muted)]">
                    {tr.tokens.toLocaleString()}
                  </span>
                )}
              </button>
              {expanded === i && tr.content && (
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {tr.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Payload cuối ---- */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="font-display text-[14px] tracking-wide text-[var(--accent-text)]">{t("prompt.finalPayload")}</h3>
          <GlassButton size="sm" onClick={() => void copyPayload()}>
            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
            {copied ? t("prompt.copied") : t("prompt.copyPayload")}
          </GlassButton>
        </div>
        <pre className="glass max-h-72 overflow-auto whitespace-pre-wrap px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
          {payloadJson}
        </pre>
      </div>
    </div>
  );
}
