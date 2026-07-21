/**
 * i18n tự viết, tối thiểu (mục 1): VI/EN, file JSON theo namespace.
 * t("chat.retrying", { n: 2, total: 5 }) — tra key lồng nhau + nội suy {placeholder}.
 */
import viCommon from "./locales/vi/common.json";
import enCommon from "./locales/en/common.json";
import { useSettingsStore, type Language } from "../state/settingsStore";

type Dict = { [key: string]: string | Dict };

const bundles: Record<Language, Dict> = {
  vi: viCommon as Dict,
  en: enCommon as Dict,
};

function lookup(dict: Dict, path: string): string | undefined {
  let cur: string | Dict | undefined = dict;
  for (const part of path.split(".")) {
    if (cur === undefined || typeof cur === "string") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(lang: Language, key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(bundles[lang], key) ?? lookup(bundles.vi, key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

/** Hook dùng trong component — re-render khi đổi ngôn ngữ. */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const language = useSettingsStore((s) => s.language);
  return (key, vars) => translate(language, key, vars);
}
