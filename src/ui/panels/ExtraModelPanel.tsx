/**
 * Panel cài đặt Extra Model — connection riêng cho model phụ phân tích biến.
 * Tham khảo ConnectionPanel nhưng đơn giản hơn: 1 connection (không profiles),
 * có toggle bật/tắt + auto trigger, proxy riêng, quét model, test connection.
 */
import { useState } from "react";
import { useExtraModelStore } from "../../state/extraModelStore";
import { scanModels, testConnection, type TestResult } from "../../api/client";
import { friendlyMessage, toApiError } from "../../api/errors";
import { getAdapter, ALL_PROVIDERS } from "../../api/providers";
import { buildExtraModelProfile } from "../../mvu/extraModelCaller";
import type { ProviderKind } from "../../types/connection";
import { useT } from "../../i18n";
import { GlassButton } from "../components/GlassButton";
import { GlassInput, GlassTextarea } from "../components/GlassInput";
import { GlassSelect } from "../components/GlassSelect";
import { SliderField } from "../components/SliderField";
import { Toggle } from "../components/Toggle";
import { ModelPicker } from "./ModelPicker";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconSpinner,
  IconZap,
} from "../icons";

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="font-display mb-2 mt-5 border-b border-[var(--glass-border)] pb-1.5 text-[15px] tracking-wide text-[var(--accent-text)] first:mt-0">
      {children}
    </h3>
  );
}

export function ExtraModelPanel() {
  const t = useT();
  const store = useExtraModelStore();
  const adapter = getAdapter(store.provider);

  const [showKeys, setShowKeys] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  async function handleScan() {
    setScanning(true);
    setScanError("");
    try {
      const profile = buildExtraModelProfile();
      const models = await scanModels(profile);
      store.setScannedModels(models);
      if (models.length > 0 && !store.model) store.updateField({ model: models[0] });
    } catch (err) {
      setScanError(friendlyMessage(toApiError(err)));
    } finally {
      setScanning(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const profile = buildExtraModelProfile();
    const result = await testConnection(profile);
    setTestResult(result);
    setTesting(false);
  }

  return (
    <div className="space-y-3">
      {/* ---- Header + Enable toggle ---- */}
      <div className="flex items-center gap-2.5">
        <IconZap size={18} color="var(--accent-text)" />
        <h2 className="font-display text-[16px] tracking-wide text-[var(--accent-text)]">
          {t("extra.title")}
        </h2>
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
        {t("extra.desc")}
      </p>

      <div className="space-y-2">
        {/* ---- Engine selector ---- */}
        <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 space-y-2">
          <h3 className="font-display text-[13px] tracking-wide text-[var(--accent-text)]">
            {t("extra.engineTitle")}
          </h3>
          <label className="flex items-start gap-2.5 cursor-pointer rounded-md border border-transparent p-2 transition-colors hover:bg-[var(--glass-hover)]">
            <input
              type="radio"
              name="stateEngine"
              value="mvu-zod"
              checked={store.stateEngine === "mvu-zod"}
              onChange={() => store.setStateEngine("mvu-zod")}
              className="mt-0.5 accent-[var(--accent-text)]"
            />
            <div>
              <span className="text-[13px] font-medium text-[var(--text-main)]">{t("extra.engineMvuZod")}</span>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{t("extra.engineMvuZodDesc")}</p>
            </div>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer rounded-md border border-transparent p-2 transition-colors hover:bg-[var(--glass-hover)]">
            <input
              type="radio"
              name="stateEngine"
              value="auto-database"
              checked={store.stateEngine === "auto-database"}
              onChange={() => store.setStateEngine("auto-database")}
              className="mt-0.5 accent-[var(--accent-text)]"
            />
            <div>
              <span className="text-[13px] font-medium text-[var(--text-main)]">{t("extra.engineAutoDb")}</span>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{t("extra.engineAutoDbDesc")}</p>
            </div>
          </label>
          <p className="text-[11px] text-[var(--text-muted)] opacity-70 pl-1">
            {t("extra.engineNote")}
          </p>
        </div>

        <Toggle
          label={t("extra.enabled")}
          checked={store.enabled}
          onChange={store.setEnabled}
        />
        <Toggle
          label={t("extra.autoTrigger")}
          checked={store.autoTrigger}
          onChange={store.setAutoTrigger}
        />
      </div>

      {/* ---- Kết nối ---- */}
      <SectionTitle>{t("conn.title")}</SectionTitle>
      <label className="block text-[13px] text-[var(--text-muted)]">
        {t("conn.provider")}
        <GlassSelect
          className="mt-1"
          value={store.provider}
          onChange={(e) => store.setProvider(e.target.value as ProviderKind)}
        >
          {ALL_PROVIDERS.map((p) => (
            <option key={p.kind} value={p.kind}>
              {p.label}
            </option>
          ))}
        </GlassSelect>
      </label>
      <label className="block text-[13px] text-[var(--text-muted)]">
        {t("conn.baseUrl")}
        <GlassInput
          className="mt-1"
          value={store.baseUrl}
          placeholder={adapter.defaultBaseUrl || "https://..."}
          onChange={(e) => store.updateField({ baseUrl: e.target.value.trim() })}
          spellCheck={false}
        />
      </label>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[13px] text-[var(--text-muted)]" htmlFor="extra-api-keys">
            {t("conn.apiKeys")}
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setShowKeys((v) => !v)}
              title={showKeys ? t("conn.hideKeys") : t("conn.showKeys")}
              className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              {showKeys ? <IconEyeOff size={15} /> : <IconEye size={15} />}
            </button>
            <button
              onClick={() => void navigator.clipboard.writeText(store.apiKeys.join("\n"))}
              title={t("conn.copyKeys")}
              className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconCopy size={15} />
            </button>
          </div>
        </div>
        <GlassTextarea
          id="extra-api-keys"
          rows={2}
          className={`mt-1 font-mono text-[13px] ${showKeys ? "" : "[-webkit-text-security:disc]"}`}
          style={showKeys ? {} : ({ WebkitTextSecurity: "disc" } as React.CSSProperties)}
          value={store.apiKeys.join("\n")}
          onChange={(e) => store.updateField({ apiKeys: e.target.value.split("\n") })}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <label className="block text-[13px] text-[var(--text-muted)]">
        {t("conn.corsProxy")}
        <GlassInput
          className="mt-1"
          value={store.corsProxy}
          placeholder="https://proxy.example/?url="
          onChange={(e) => store.updateField({ corsProxy: e.target.value.trim() })}
          spellCheck={false}
        />
        {store.corsProxy && (
          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--warn)]">
            <IconAlert size={13} /> {t("conn.corsProxyWarn")}
          </span>
        )}
      </label>

      {/* ---- Model ---- */}
      <SectionTitle>{t("conn.model")}</SectionTitle>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <ModelPicker
            value={store.model}
            models={store.scannedModels}
            onChange={(model) => store.updateField({ model })}
          />
        </div>
        <GlassButton onClick={() => void handleScan()} disabled={scanning || !store.baseUrl}>
          {scanning ? <IconSpinner size={15} /> : null}
          {scanning ? t("conn.scanning") : t("conn.scanModels")}
        </GlassButton>
      </div>
      {scanError && (
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--danger)]">
          <IconAlert size={14} /> {scanError}
        </p>
      )}
      <div className="flex items-center gap-3">
        <GlassButton
          variant="accent"
          onClick={() => void handleTest()}
          disabled={testing || !store.baseUrl || !store.model}
        >
          {testing ? <IconSpinner size={15} /> : null}
          {testing ? t("conn.testing") : t("conn.testConnection")}
        </GlassButton>
        {testResult && (
          <span
            className={`flex items-center gap-1.5 text-[13px] ${testResult.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}
          >
            {testResult.ok ? <IconCheck size={14} /> : <IconAlert size={14} />}
            {testResult.message}
          </span>
        )}
      </div>

      {/* ---- Tham số ---- */}
      <SectionTitle>{t("conn.params")}</SectionTitle>
      <div className="space-y-3">
        <SliderField
          label="temperature"
          value={store.temperature}
          min={0}
          max={2}
          step={0.01}
          defaultValue={0.3}
          onChange={(v) => store.updateField({ temperature: v ?? 0.3 })}
          resetLabel={t("conn.reset")}
        />
        <SliderField
          label="max_tokens"
          value={store.maxTokens}
          min={64}
          max={8192}
          step={64}
          defaultValue={2048}
          onChange={(v) => store.updateField({ maxTokens: Math.max(64, Math.round(v ?? 2048)) })}
          resetLabel={t("conn.reset")}
        />
        <SliderField
          label={t("conn.timeout")}
          value={Math.round(store.timeoutMs / 1000)}
          min={10}
          max={120}
          step={5}
          defaultValue={30}
          onChange={(v) => store.updateField({ timeoutMs: Math.max(10, v ?? 30) * 1000 })}
          resetLabel={t("conn.reset")}
        />
        <SliderField
          label={t("conn.maxRetries")}
          value={store.maxRetries}
          min={1}
          max={5}
          step={1}
          defaultValue={2}
          onChange={(v) => store.updateField({ maxRetries: Math.min(5, Math.max(1, Math.round(v ?? 2))) })}
          resetLabel={t("conn.reset")}
        />
      </div>

      {/* ---- Status ---- */}
      {store.lastStatus !== "idle" && (
        <div className={`mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] ${
          store.lastStatus === "running" ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" :
          store.lastStatus === "success" ? "bg-[rgba(125,165,131,0.15)] text-[var(--ok)]" :
          "bg-[var(--danger-soft)] text-[var(--danger)]"
        }`}>
          {store.lastStatus === "running" && <IconSpinner size={14} />}
          {store.lastStatus === "success" && <IconCheck size={14} />}
          {store.lastStatus === "error" && <IconAlert size={14} />}
          <span>
            {store.lastStatus === "running" ? t("extra.analyzing") :
             store.lastStatus === "success" ? (store.lastOpsCount > 0
               ? t("extra.success", { n: store.lastOpsCount })
               : t("extra.noChanges")) :
             `${t("extra.error")}: ${store.lastError}`}
          </span>
        </div>
      )}
    </div>
  );
}
