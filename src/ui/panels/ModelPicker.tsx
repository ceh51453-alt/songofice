/**
 * Combobox model (mục 2.1): ô nhập có filter + danh sách model đã quét.
 * Gõ tự do vẫn được (endpoint local không cần scan).
 */
import { useMemo, useRef, useState } from "react";
import { useT } from "../../i18n";
import { IconSearch } from "../icons";

interface Props {
  value: string;
  models: string[];
  onChange: (model: string) => void;
}

export function ModelPicker({ value, models, onChange }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [models, query]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="relative">
        <IconSearch size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <input
          value={open ? query : value}
          placeholder={value || t("conn.searchModel")}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              onChange(query.trim());
              setOpen(false);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.22)] py-2 pl-8 pr-3 text-sm text-[var(--text-soft)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent-border)] focus:outline-none"
          aria-label={t("conn.model")}
        />
      </div>
      {open && (
        <div className="glass-strong absolute z-20 mt-1 max-h-56 w-full overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[13px] text-[var(--text-faint)]">{t("conn.noModels")}</div>
          ) : (
            filtered.map((m) => (
              <button
                key={m}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--glass-bg-hover)] ${
                  m === value ? "text-[var(--accent-text)]" : "text-[var(--text-soft)]"
                }`}
              >
                {m}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
