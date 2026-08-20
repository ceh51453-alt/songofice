/**
 * i18n tự viết, tối thiểu (mục 1): VI/EN/ZH-CN, file JSON theo namespace.
 * t("chat.retrying", { n: 2, total: 5 }) — tra key lồng nhau + nội suy {placeholder}.
 */
import viCommon from "./locales/vi/common.json";
import enCommon from "./locales/en/common.json";
import zhCnCommon from "./locales/zh-CN/common.json";
import { useSettingsStore, type Language } from "../state/settingsStore";

type Dict = { [key: string]: string | Dict };

const bundles: Record<Language, Dict> = {
  vi: viCommon as Dict,
  en: enCommon as Dict,
  "zh-CN": zhCnCommon as Dict,
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

/** Chỉ thị ngôn ngữ cho nội dung truyện do AI tạo, tách biệt với nhãn giao diện. */
export function outputLanguageInstruction(lang: Language): string {
  switch (lang) {
    case "zh-CN":
      return "【输出语言】必须使用简体中文书写全部叙事、对话、选项和可见标签。专有名词可保留原文，并在首次出现时给出中文译名。不要输出越南语。";
    case "en":
      return "[OUTPUT LANGUAGE] Write all narration, dialogue, choices, and visible labels in English. Proper nouns may retain their canonical spelling. Do not answer in Vietnamese.";
    case "vi":
      return "【NGÔN NGỮ ĐẦU RA】Viết toàn bộ lời kể, hội thoại, lựa chọn và nhãn hiển thị bằng tiếng Việt.";
  }
}

/** Hook dùng trong component — re-render khi đổi ngôn ngữ. */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const language = useSettingsStore((s) => s.language);
  return (key, vars) => translate(language, key, vars);
}
