/**
 * Panel Cài đặt > Kết nối (mục 2): profiles, provider preset, multi-key,
 * scan models, test connection, tham số model (slider + số), retry 3-10 + timeout.
 */
import { useState } from "react";
import { useConnectionStore } from "../../state/connectionStore";
import { useSettingsStore } from "../../state/settingsStore";
import { scanModels, testConnection, type TestResult } from "../../api/client";
import { friendlyMessage, toApiError } from "../../api/errors";
import { getAdapter, ALL_PROVIDERS } from "../../api/providers";
import type { ModelParams, ProviderKind } from "../../types/connection";
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
  IconDuplicate,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconSpinner,
  IconTrash,
} from "../icons";

interface SliderDef {
  key: keyof ModelParams;
  min: number;
  max: number;
  step: number;
  def: number | undefined;
}

const SLIDER_DEFS: SliderDef[] = [
  { key: "temperature", min: 0, max: 2, step: 0.01, def: 1 },
  { key: "top_p", min: 0, max: 1, step: 0.01, def: 1 },
  { key: "top_k", min: 0, max: 100, step: 1, def: undefined },
  { key: "min_p", min: 0, max: 1, step: 0.01, def: undefined },
  { key: "top_a", min: 0, max: 1, step: 0.01, def: undefined },
  { key: "typical_p", min: 0, max: 1, step: 0.01, def: undefined },
  { key: "frequency_penalty", min: -2, max: 2, step: 0.01, def: undefined },
  { key: "presence_penalty", min: -2, max: 2, step: 0.01, def: undefined },
  { key: "repetition_penalty", min: 1, max: 2, step: 0.01, def: undefined },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="font-display mb-2 mt-5 border-b border-[var(--glass-border)] pb-1.5 text-[15px] tracking-wide text-[var(--accent-text)] first:mt-0">
      {children}
    </h3>
  );
}

export function ConnectionPanel() {
  const t = useT();
  const store = useConnectionStore();
  const settings = useSettingsStore();
  const profile = store.activeProfile();
  const adapter = getAdapter(profile.provider);

  const [showKeys, setShowKeys] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [stopDraft, setStopDraft] = useState("");

  const update = (patch: Parameters<typeof store.updateProfile>[1]) => store.updateProfile(profile.id, patch);
  const updateParams = (patch: Partial<ModelParams>) => store.updateParams(profile.id, patch);

  async function handleScan() {
    setScanning(true);
    setScanError("");
    try {
      const models = await scanModels(profile);
      update({ scannedModels: models });
      if (models.length > 0 && !profile.model) update({ model: models[0] });
    } catch (err) {
      setScanError(friendlyMessage(toApiError(err)));
    } finally {
      setScanning(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(store.activeProfile());
    setTestResult(result);
    setTesting(false);
  }

  return (
    <div className="space-y-3">
      {/* ---- Profile ---- */}
      <SectionTitle>{t("conn.profile")}</SectionTitle>
      <div className="flex flex-wrap items-center gap-2">
        <GlassSelect
          className="min-w-40 flex-1"
          value={profile.id}
          onChange={(e) => store.setActiveProfile(e.target.value)}
          aria-label={t("conn.profile")}
        >
          {store.profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </GlassSelect>
        <GlassButton size="sm" onClick={() => store.createProfile()} title={t("conn.newProfile")}>
          <IconPlus size={14} />
        </GlassButton>
        <GlassButton size="sm" onClick={() => store.duplicateProfile(profile.id)} title={t("conn.duplicate")}>
          <IconDuplicate size={14} />
        </GlassButton>
        <GlassButton
          size="sm"
          variant="danger"
          onClick={() => store.deleteProfile(profile.id)}
          title={t("conn.delete")}
          disabled={store.profiles.length <= 1}
        >
          <IconTrash size={14} />
        </GlassButton>
      </div>
      <GlassInput
        value={profile.name}
        onChange={(e) => store.renameProfile(profile.id, e.target.value)}
        aria-label={t("conn.rename")}
      />

      {/* ---- Kết nối ---- */}
      <SectionTitle>{t("conn.title")}</SectionTitle>
      <label className="block text-[13px] text-[var(--text-muted)]">
        {t("conn.provider")}
        <GlassSelect
          className="mt-1"
          value={profile.provider}
          onChange={(e) => store.setProvider(profile.id, e.target.value as ProviderKind)}
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
          value={profile.baseUrl}
          placeholder={adapter.defaultBaseUrl || "https://..."}
          onChange={(e) => update({ baseUrl: e.target.value.trim() })}
          spellCheck={false}
        />
      </label>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[13px] text-[var(--text-muted)]" htmlFor="api-keys">
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
              onClick={() => void navigator.clipboard.writeText(profile.apiKeys.join("\n"))}
              title={t("conn.copyKeys")}
              className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconCopy size={15} />
            </button>
          </div>
        </div>
        <GlassTextarea
          id="api-keys"
          rows={3}
          className={`mt-1 font-mono text-[13px] ${showKeys ? "" : "[-webkit-text-security:disc]"}`}
          style={showKeys ? {} : ({ WebkitTextSecurity: "disc" } as React.CSSProperties)}
          value={profile.apiKeys.join("\n")}
          onChange={(e) => update({ apiKeys: e.target.value.split("\n") })}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <label className="block text-[13px] text-[var(--text-muted)]">
        {t("conn.corsProxy")}
        <GlassInput
          className="mt-1"
          value={profile.corsProxy}
          placeholder="https://proxy.example/?url="
          onChange={(e) => update({ corsProxy: e.target.value.trim() })}
          spellCheck={false}
        />
        {profile.corsProxy && (
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
            value={profile.model}
            models={profile.scannedModels}
            onChange={(model) => update({ model })}
          />
        </div>
        <GlassButton onClick={() => void handleScan()} disabled={scanning || !profile.baseUrl}>
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
          disabled={testing || !profile.baseUrl || !profile.model}
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

      {/* ---- Retry & timeout (mục 2.3) ---- */}
      <SectionTitle>{t("conn.retrySection")}</SectionTitle>
      <SliderField
        label={t("conn.maxRetries")}
        value={profile.maxRetries}
        min={3}
        max={10}
        step={1}
        defaultValue={3}
        onChange={(v) => update({ maxRetries: Math.min(10, Math.max(3, Math.round(v ?? 3))) })}
        resetLabel={t("conn.reset")}
      />
      <SliderField
        label={t("conn.timeout")}
        value={Math.round(profile.timeoutMs / 1000)}
        min={10}
        max={300}
        step={5}
        defaultValue={60}
        onChange={(v) => update({ timeoutMs: Math.max(10, v ?? 60) * 1000 })}
        resetLabel={t("conn.reset")}
      />

      {/* ---- Tham số model (mục 2.2) ---- */}
      <SectionTitle>{t("conn.params")}</SectionTitle>
      <div className="space-y-3">
        <Toggle
          label={t("conn.streaming")}
          checked={profile.params.stream}
          onChange={(v) => updateParams({ stream: v })}
        />
        {adapter.supportsReasoning && (
          <Toggle
            label={t("conn.reasoning")}
            checked={profile.params.reasoning ?? false}
            onChange={(v) => updateParams({ reasoning: v })}
          />
        )}
        {SLIDER_DEFS.filter((d) => adapter.supportedParams.has(d.key)).map((d) => (
          <SliderField
            key={d.key}
            label={String(d.key)}
            tooltip={t(`params.${String(d.key)}`)}
            value={profile.params[d.key] as number | undefined}
            min={d.min}
            max={d.max}
            step={d.step}
            defaultValue={d.def}
            onChange={(v) => updateParams({ [d.key]: v })}
            resetLabel={t("conn.reset")}
          />
        ))}
        <SliderField
          label="max_tokens"
          tooltip={t("params.max_tokens")}
          value={profile.params.max_tokens}
          min={64}
          max={131072}
          step={64}
          defaultValue={2048}
          onChange={(v) => updateParams({ max_tokens: Math.max(1, Math.round(v ?? 2048)) })}
          resetLabel={t("conn.reset")}
        />
        <SliderField
          label="max context tokens"
          tooltip={t("params.max_context")}
          value={profile.params.max_context}
          min={2048}
          max={2097152}
          step={1024}
          defaultValue={32768}
          onChange={(v) => updateParams({ max_context: Math.max(2048, Math.round(v ?? 32768)) })}
          resetLabel={t("conn.reset")}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="text-[13px] text-[var(--text-muted)]" title={t("params.seed")}>
            seed
          </label>
          <GlassInput
            type="number"
            className="!w-32 text-right"
            value={profile.params.seed ?? ""}
            placeholder="—"
            onChange={(e) => updateParams({ seed: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
        {/* stop sequences */}
        <div>
          <label className="text-[13px] text-[var(--text-muted)]">{t("conn.stopSequences")}</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {profile.params.stop.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="flex items-center gap-1 rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-0.5 font-mono text-[12px] text-[var(--text-soft)]"
              >
                {JSON.stringify(s)}
                <button
                  onClick={() => updateParams({ stop: profile.params.stop.filter((_, j) => j !== i) })}
                  aria-label={`${t("conn.delete")} ${s}`}
                  className="text-[var(--text-faint)] hover:text-[var(--danger)]"
                >
                  <IconTrash size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2">
            <GlassInput
              value={stopDraft}
              onChange={(e) => setStopDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && stopDraft) {
                  updateParams({ stop: [...profile.params.stop, stopDraft] });
                  setStopDraft("");
                }
              }}
              className="font-mono text-[13px]"
              spellCheck={false}
            />
            <GlassButton
              size="sm"
              disabled={!stopDraft}
              onClick={() => {
                updateParams({ stop: [...profile.params.stop, stopDraft] });
                setStopDraft("");
              }}
            >
              {t("conn.addStop")}
            </GlassButton>
          </div>
        </div>
      </div>

      {/* ---- Giao diện & ngôn ngữ ---- */}
      <SectionTitle>{t("conn.settings")}</SectionTitle>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-[var(--text-muted)]">{t("conn.language")}</span>
          <GlassSelect
            className="w-32"
            value={settings.language}
            onChange={(e) => settings.setLanguage(e.target.value as "vi" | "en")}
            aria-label={t("conn.language")}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </GlassSelect>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-[var(--text-muted)]">{t("conn.theme")}</span>
          <GlassSelect
            className="w-32"
            value={settings.theme}
            onChange={(e) => settings.setTheme(e.target.value as "dark" | "light")}
            aria-label={t("conn.theme")}
          >
            <option value="dark">{t("conn.themeDark")}</option>
            <option value="light">{t("conn.themeLight")}</option>
          </GlassSelect>
        </div>
        <Toggle
          label={t("conn.verboseLogging")}
          checked={settings.verboseLogging}
          onChange={settings.setVerboseLogging}
        />
      </div>
    </div>
  );
}
