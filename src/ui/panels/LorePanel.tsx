/**
 * Tab Settings > Lore (mục 4.3 / 21): NẠP nguồn lore người dùng cung cấp —
 * import file, bật/tắt, xoá. KHÔNG phải editor lorebook (spec cấm đầu tư UI đó).
 */
import { useRef, useState } from "react";
import { useLoreStore } from "../../state/loreStore";
import { useT } from "../../i18n";
import { GlassButton } from "../components/GlassButton";
import { Toggle } from "../components/Toggle";
import { IconAlert, IconSpinner, IconTrash } from "../icons";

export function LorePanel() {
  const t = useT();
  const store = useLoreStore();
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
          {importing ? t("prompt.importing") : t("lore.importLore")}
        </GlassButton>
        <p className="mt-1.5 text-[12px] text-[var(--text-faint)]">{t("lore.importHint")}</p>
        {importError && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--danger)]">
            <IconAlert size={14} /> {importError}
          </p>
        )}
      </div>

      {/* nguồn bundled (content/westeros/lore/) */}
      {store.bundled.map((b) => (
        <div key={b.name} className="glass flex items-center gap-2 px-3.5 py-2.5 opacity-80">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm text-[var(--text-soft)]">{b.name}</span>
            <span className="text-[12px] text-[var(--text-faint)]">{t("lore.entryCount", { n: b.entries.length })}</span>
          </div>
        </div>
      ))}

      {/* nguồn runtime import */}
      {store.records.length === 0 && store.bundled.length === 0 ? (
        <p className="text-[13px] text-[var(--text-faint)]">{t("lore.noSources")}</p>
      ) : (
        store.records.map((r) => (
          <div key={r.id} className={`glass flex items-center gap-3 px-3.5 py-2.5 ${r.enabled ? "" : "opacity-50"}`}>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[var(--text-soft)]">{r.name}</span>
              <span className="text-[12px] text-[var(--text-faint)]">{t("lore.entryCount", { n: r.entryCount })}</span>
            </div>
            <Toggle label="" checked={r.enabled} onChange={(v) => void store.setEnabled(r.id, v)} />
            <GlassButton size="sm" variant="danger" onClick={() => void store.remove(r.id)} title={t("prompt.delete")}>
              <IconTrash size={13} />
            </GlassButton>
          </div>
        ))
      )}

      {store.warnings.length > 0 && (
        <div className="glass border-[rgba(194,164,104,0.35)] bg-[var(--warn-soft)] px-3.5 py-2.5">
          <ul className="max-h-32 space-y-0.5 overflow-y-auto text-[12px] text-[var(--warn)]">
            {store.warnings.slice(0, 20).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
