/**
 * Tab Settings > Prompt (3.1b.5 / mục 21): nhập preset ST, chọn preset active,
 * xuất round-trip, xoá. Không phải editor — chỉnh preset vẫn làm ở ST gốc.
 */
import { useRef, useState } from "react";
import { usePresetStore, regexScriptKey } from "../../state/presetStore";
import { useT } from "../../i18n";
import { GlassButton } from "../components/GlassButton";
import { IconAlert, IconCheck, IconSpinner, IconTrash } from "../icons";

function downloadJson(name: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Bật/tắt regex script của preset đang dùng. Preset ST hay tắt sẵn các script
 * sinh HTML (hộp chuỗi tư duy, thẻ lựa chọn) — bật ở đây là chạy được, file gốc
 * không bị sửa nên export vẫn round-trip.
 */
function RegexScriptList() {
  const preset = usePresetStore((s) => s.activePreset);
  const toggle = usePresetStore((s) => s.toggleRegexScript);
  const scripts = preset?.extensions?.regex_scripts ?? [];
  if (scripts.length === 0) return null;

  return (
    <div className="glass px-3.5 py-3">
      <p className="mb-2 text-[13px] font-medium text-[var(--text-soft)]">
        Regex script của preset
        <span className="ml-1.5 text-[12px] font-normal text-[var(--text-faint)]">({scripts.length})</span>
      </p>
      <ul className="space-y-1">
        {scripts.map((s, i) => {
          const key = regexScriptKey(s, i);
          const on = !s.disabled;
          const scope = [s.markdownOnly && "hiển thị", s.promptOnly && "gửi AI"].filter(Boolean).join(" + ") || "cả hai";
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--glass-bg-hover)]">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent-text)]"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] ${on ? "text-[var(--text-soft)]" : "text-[var(--text-faint)]"}`}>
                    {s.scriptName}
                  </span>
                  <span className="text-[11.5px] text-[var(--text-faint)]">{scope}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--text-faint)]">
        Script sinh HTML chạy trong khung cách ly — không đọc được API key hay dữ liệu lưu của app.
      </p>
    </div>
  );
}

export function PromptPanel() {
  const t = useT();
  const store = usePresetStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      for (const file of Array.from(files)) {
        const text = await file.text();
        await store.importFile(file.name, text);
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      {/* ---- Import ---- */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <GlassButton variant="accent" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <IconSpinner size={15} /> : null}
          {importing ? t("prompt.importing") : t("prompt.importPreset")}
        </GlassButton>
        {importError && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--danger)]">
            <IconAlert size={14} /> {importError}
          </p>
        )}
      </div>

      {/* ---- Danh sách preset ---- */}
      {store.records.length === 0 ? (
        <p className="text-[13px] text-[var(--text-faint)]">{t("prompt.noPresets")}</p>
      ) : (
        <div className="space-y-2">
          {/* lựa chọn "không preset" */}
          <button
            onClick={() => void store.setActive(null)}
            className={`glass flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--glass-bg-hover)] ${
              store.activePresetId === null ? "border-[var(--accent-border)]" : ""
            }`}
          >
            <span className="text-[var(--text-muted)]">{t("prompt.noPreset")}</span>
            {store.activePresetId === null && <IconCheck size={15} color="var(--accent-text)" />}
          </button>

          {store.records.map((r) => {
            const active = store.activePresetId === r.id;
            return (
              <div
                key={r.id}
                className={`glass flex items-center gap-2 px-3.5 py-2.5 ${active ? "border-[var(--accent-border)]" : ""}`}
              >
                <button
                  onClick={() => void store.setActive(r.id)}
                  className="min-w-0 flex-1 text-left"
                  title={t("prompt.usePreset")}
                >
                  <span className={`block truncate text-sm ${active ? "text-[var(--accent-text)]" : "text-[var(--text-soft)]"}`}>
                    {r.name}
                  </span>
                  <span className="text-[12px] text-[var(--text-faint)]">
                    {t("prompt.promptCount", { n: r.promptCount })}
                    {active ? ` · ${t("prompt.active")}` : ""}
                  </span>
                </button>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void store.exportRaw(r.id).then((res) => {
                      if (res) downloadJson(res.name, res.json);
                    });
                  }}
                >
                  {t("prompt.export")}
                </GlassButton>
                <GlassButton size="sm" variant="danger" onClick={() => void store.remove(r.id)} title={t("prompt.delete")}>
                  <IconTrash size={13} />
                </GlassButton>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Regex script của preset active ---- */}
      <RegexScriptList />

      {/* ---- Cảnh báo parse của preset active ---- */}
      {store.activeWarnings.length > 0 && (
        <div className="glass border-[rgba(194,164,104,0.35)] bg-[var(--warn-soft)] px-3.5 py-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-[var(--warn)]">
            <IconAlert size={14} /> {t("prompt.warnings")}
          </p>
          <ul className="max-h-32 space-y-0.5 overflow-y-auto text-[12px] text-[var(--text-muted)]">
            {store.activeWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
