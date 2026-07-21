/**
 * eraClassifier.ts — Auto-classify lorebook entries by era.
 * Dựa trên keyword/tên nhân vật → gán eraIds[] + appearYear.
 * Entries global (worldview, meta, magic system, geography) giữ eraIds = undefined.
 *
 * Hệ thống 2 tầng:
 *  1. GLOBAL_PATTERNS: comment/key khớp → entry global (mọi era).
 *  2. ERA_CHARACTER_MAP: tên nhân vật/keyword → era + appearYear.
 *
 * Nếu entry không khớp pattern nào → giữ nguyên (global mặc định).
 */
import type { LoreEntry } from "./loreSchema";

// ── Patterns cho entries GLOBAL (hiện mọi era) ──
const GLOBAL_PATTERNS = [
  /^th[eếê] gi[oớ]i/i,
  /^meta/i,
  /^h[eệ] th[oố]ng/i,
  /^quy t[aắ]c/i,
  /worldview/i,
  /^setup/i,
  /geography|đ[iị]a lý/i,
  /magic.*system|phép thuật/i,
  /religion|t[oô]n giáo/i,
  /currency|ti[eề]n t[eệ]/i,
  /culture|v[aă]n h[oó]a/i,
  /^westeros$/i,
  /^essos$/i,
  /^b[oố]i c[aả]nh/i,
];

/** Nhân vật/keyword → {eras, appearYear?}. Một nhân vật có thể thuộc nhiều era. */
interface EraTag {
  eras: string[];
  appearYear?: number;
}

// ── ERA CHARACTER MAP ──
// Key: lowercase keyword. Value: era tag.
const ERA_CHARACTER_MAP: Record<string, EraTag> = {
  // ── Đêm Trường ──
  "anh hùng cuối cùng": { eras: ["long-night"] },
  "last hero": { eras: ["long-night"] },
  "others": { eras: ["long-night", "war-of-five-kings"] },
  "children of the forest": { eras: ["long-night"] },
  "trẻ con rừng": { eras: ["long-night"] },
  "night king": { eras: ["long-night"] },

  // ── Chinh Phạt Aegon ──
  "aegon i": { eras: ["aegon-conquest"] },
  "aegon the conqueror": { eras: ["aegon-conquest"] },
  "aegon chinh phạt": { eras: ["aegon-conquest"] },
  "visenya": { eras: ["aegon-conquest"] },
  "rhaenys targaryen": { eras: ["aegon-conquest", "dance-of-dragons"] },
  "balerion": { eras: ["aegon-conquest", "dance-of-dragons"] },
  "black dread": { eras: ["aegon-conquest"] },
  "meraxes": { eras: ["aegon-conquest"] },
  "vhagar": { eras: ["aegon-conquest", "dance-of-dragons"] },
  "orys baratheon": { eras: ["aegon-conquest"] },
  "harren the black": { eras: ["aegon-conquest"] },
  "harren đen": { eras: ["aegon-conquest"] },
  "torrhen stark": { eras: ["aegon-conquest"] },

  // ── Vũ Điệu Rồng ──
  "rhaenyra": { eras: ["dance-of-dragons"], appearYear: 97 },
  "rhaenyra targaryen": { eras: ["dance-of-dragons"], appearYear: 97 },
  "daemon targaryen": { eras: ["dance-of-dragons"], appearYear: 81 },
  "prince daemon": { eras: ["dance-of-dragons"], appearYear: 81 },
  "viserys i": { eras: ["dance-of-dragons"] },
  "king viserys": { eras: ["dance-of-dragons"] },
  "aegon ii": { eras: ["dance-of-dragons"], appearYear: 107 },
  "aegon ii targaryen": { eras: ["dance-of-dragons"], appearYear: 107 },
  "aemond": { eras: ["dance-of-dragons"], appearYear: 110 },
  "aemond targaryen": { eras: ["dance-of-dragons"], appearYear: 110 },
  "alicent": { eras: ["dance-of-dragons"], appearYear: 88 },
  "alicent hightower": { eras: ["dance-of-dragons"], appearYear: 88 },
  "otto hightower": { eras: ["dance-of-dragons"] },
  "criston cole": { eras: ["dance-of-dragons"] },
  "corlys velaryon": { eras: ["dance-of-dragons"] },
  "rhaenys the queen who never was": { eras: ["dance-of-dragons"] },
  "jacaerys": { eras: ["dance-of-dragons"], appearYear: 114 },
  "lucerys": { eras: ["dance-of-dragons"], appearYear: 115 },
  "joffrey velaryon": { eras: ["dance-of-dragons"], appearYear: 117 },
  "syrax": { eras: ["dance-of-dragons"] },
  "caraxes": { eras: ["dance-of-dragons"] },
  "sunfyre": { eras: ["dance-of-dragons"] },
  "meleys": { eras: ["dance-of-dragons"] },
  "seasmoke": { eras: ["dance-of-dragons"] },
  "vermithor": { eras: ["dance-of-dragons"] },
  "silverwing": { eras: ["dance-of-dragons"] },
  "dreamfyre": { eras: ["dance-of-dragons"] },
  "tessarion": { eras: ["dance-of-dragons"] },
  "blood and cheese": { eras: ["dance-of-dragons"] },
  "máu và phô mai": { eras: ["dance-of-dragons"] },
  "dragonpit": { eras: ["dance-of-dragons", "aegon-conquest"] },
  "aegon iii": { eras: ["dance-of-dragons"], appearYear: 120 },
  "aegon iii targaryen": { eras: ["dance-of-dragons"], appearYear: 120 },
  "helaena": { eras: ["dance-of-dragons"], appearYear: 109 },
  "helaena targaryen": { eras: ["dance-of-dragons"], appearYear: 109 },
  "laena velaryon": { eras: ["dance-of-dragons"] },
  "laenor velaryon": { eras: ["dance-of-dragons"] },
  "mysaria": { eras: ["dance-of-dragons"] },
  "larys strong": { eras: ["dance-of-dragons"] },

  // ── Loạn Blackfyre ──
  "daemon blackfyre": { eras: ["blackfyre-rebellion"], appearYear: 170 },
  "blackfyre": { eras: ["blackfyre-rebellion"] },
  "bloodraven": { eras: ["blackfyre-rebellion", "dunk-and-egg"], appearYear: 175 },
  "brynden rivers": { eras: ["blackfyre-rebellion", "dunk-and-egg"], appearYear: 175 },
  "quạ máu": { eras: ["blackfyre-rebellion", "dunk-and-egg"], appearYear: 175 },
  "bittersteel": { eras: ["blackfyre-rebellion"] },
  "aegor rivers": { eras: ["blackfyre-rebellion"] },
  "daeron ii": { eras: ["blackfyre-rebellion"] },
  "aegon iv": { eras: ["blackfyre-rebellion"] },

  // ── Dunk & Egg ──
  "duncan the tall": { eras: ["dunk-and-egg"], appearYear: 192 },
  "dunk": { eras: ["dunk-and-egg"], appearYear: 192 },
  "ser duncan": { eras: ["dunk-and-egg"], appearYear: 192 },
  "egg": { eras: ["dunk-and-egg"], appearYear: 199 },
  "aegon v": { eras: ["dunk-and-egg"], appearYear: 199 },
  "maekar": { eras: ["dunk-and-egg", "blackfyre-rebellion"] },
  "aerion brightflame": { eras: ["dunk-and-egg"] },

  // ── Loạn Robert ──
  "rhaegar": { eras: ["roberts-rebellion"], appearYear: 259 },
  "rhaegar targaryen": { eras: ["roberts-rebellion"], appearYear: 259 },
  "robert baratheon": { eras: ["roberts-rebellion", "war-of-five-kings"], appearYear: 262 },
  "lyanna stark": { eras: ["roberts-rebellion"], appearYear: 266 },
  "aerys": { eras: ["roberts-rebellion"] },
  "aerys ii": { eras: ["roberts-rebellion"] },
  "mad king": { eras: ["roberts-rebellion"] },
  "vua điên": { eras: ["roberts-rebellion"] },
  "eddard stark": { eras: ["roberts-rebellion", "war-of-five-kings"], appearYear: 263 },
  "ned stark": { eras: ["roberts-rebellion", "war-of-five-kings"], appearYear: 263 },
  "jon arryn": { eras: ["roberts-rebellion", "war-of-five-kings"] },
  "tywin lannister": { eras: ["roberts-rebellion", "war-of-five-kings"] },
  "jaime lannister": { eras: ["roberts-rebellion", "war-of-five-kings"], appearYear: 266 },
  "cersei lannister": { eras: ["roberts-rebellion", "war-of-five-kings"], appearYear: 266 },
  "arthur dayne": { eras: ["roberts-rebellion"] },
  "tower of joy": { eras: ["roberts-rebellion"] },

  // ── War of Five Kings ──
  "joffrey baratheon": { eras: ["war-of-five-kings"], appearYear: 286 },
  "joffrey": { eras: ["war-of-five-kings"], appearYear: 286 },
  "robb stark": { eras: ["war-of-five-kings"], appearYear: 283 },
  "sansa stark": { eras: ["war-of-five-kings"], appearYear: 286 },
  "arya stark": { eras: ["war-of-five-kings"], appearYear: 289 },
  "bran stark": { eras: ["war-of-five-kings"], appearYear: 290 },
  "jon snow": { eras: ["war-of-five-kings"], appearYear: 283 },
  "daenerys": { eras: ["war-of-five-kings"], appearYear: 284 },
  "daenerys targaryen": { eras: ["war-of-five-kings"], appearYear: 284 },
  "tyrion": { eras: ["war-of-five-kings"], appearYear: 273 },
  "tyrion lannister": { eras: ["war-of-five-kings"], appearYear: 273 },
  "stannis": { eras: ["war-of-five-kings"] },
  "stannis baratheon": { eras: ["war-of-five-kings"] },
  "renly": { eras: ["war-of-five-kings"] },
  "renly baratheon": { eras: ["war-of-five-kings"] },
  "petyr baelish": { eras: ["war-of-five-kings"] },
  "littlefinger": { eras: ["war-of-five-kings"] },
  "varys": { eras: ["war-of-five-kings"] },
  "melisandre": { eras: ["war-of-five-kings"] },
  "margaery tyrell": { eras: ["war-of-five-kings"] },
  "olenna tyrell": { eras: ["war-of-five-kings"] },
  "the hound": { eras: ["war-of-five-kings"] },
  "sandor clegane": { eras: ["war-of-five-kings"] },
  "gregor clegane": { eras: ["war-of-five-kings"] },
  "theon greyjoy": { eras: ["war-of-five-kings"] },
  "balon greyjoy": { eras: ["war-of-five-kings"] },
  "euron greyjoy": { eras: ["war-of-five-kings"] },
  "oberyn martell": { eras: ["war-of-five-kings"] },
  "doran martell": { eras: ["war-of-five-kings"] },
  "samwell tarly": { eras: ["war-of-five-kings"] },
  "brienne": { eras: ["war-of-five-kings"] },
  "davos": { eras: ["war-of-five-kings"] },
  "roose bolton": { eras: ["war-of-five-kings"] },
  "ramsay": { eras: ["war-of-five-kings"] },
  "walder frey": { eras: ["war-of-five-kings"] },
  "red wedding": { eras: ["war-of-five-kings"] },
  "đám cưới đỏ": { eras: ["war-of-five-kings"] },
  "drogon": { eras: ["war-of-five-kings"] },
  "rhaegal": { eras: ["war-of-five-kings"] },
  "viserion": { eras: ["war-of-five-kings"] },
  "night's watch": { eras: ["long-night", "war-of-five-kings"] },
  "tuần đêm": { eras: ["long-night", "war-of-five-kings"] },
  "white walkers": { eras: ["long-night", "war-of-five-kings"] },
  "wildlings": { eras: ["war-of-five-kings"] },
  "mance rayder": { eras: ["war-of-five-kings"] },
};

/**
 * Check if a comment or key set matches GLOBAL patterns.
 * Returns true if this entry should be treated as global (no era filter).
 */
function isGlobalEntry(comment: string, keys: string[]): boolean {
  const text = `${comment} ${keys.join(" ")}`.toLowerCase();
  return GLOBAL_PATTERNS.some((p) => p.test(text));
}

/**
 * Classify a single lore entry by era based on its comment and keys.
 * Returns { eraIds, appearYear } or null if no classification found (→ global).
 */
function classifyEntry(comment: string, keys: string[]): { eraIds: string[]; appearYear?: number } | null {
  if (isGlobalEntry(comment, keys)) return null;

  const allEras = new Set<string>();
  let earliestAppear: number | undefined;

  // Check comment and keys against map
  const allTexts = [comment.toLowerCase(), ...keys.map((k) => k.toLowerCase())];
  for (const text of allTexts) {
    const tag = ERA_CHARACTER_MAP[text];
    if (tag) {
      for (const e of tag.eras) allEras.add(e);
      if (tag.appearYear !== undefined) {
        earliestAppear = earliestAppear === undefined
          ? tag.appearYear
          : Math.min(earliestAppear, tag.appearYear);
      }
    }
  }

  if (allEras.size === 0) return null; // no match → global
  return {
    eraIds: [...allEras],
    ...(earliestAppear !== undefined ? { appearYear: earliestAppear } : {}),
  };
}

/**
 * Auto-classify entries that don't have eraIds yet.
 * Entries already tagged (from extensions) are kept as-is.
 */
export function classifyAtLoad(entries: LoreEntry[]): LoreEntry[] {
  return entries.map((entry) => {
    // Already has era tags → skip
    if (entry.eraIds && entry.eraIds.length > 0) return entry;

    const result = classifyEntry(entry.comment, entry.keys);
    if (!result) return entry; // global → no change

    return {
      ...entry,
      eraIds: result.eraIds,
      ...(result.appearYear !== undefined ? { appearYear: result.appearYear } : {}),
    };
  });
}
