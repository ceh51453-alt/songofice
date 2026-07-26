/**
 * Parser thẻ ngữ nghĩa (5.6): tách text hiển thị thành các đoạn — văn thường
 * và các thẻ đã biết render bằng component riêng. Hỗ trợ ATTRIBUTES
 * (<combat_trigger scale="Đại Chiến">, <battle_report outcome="Thắng">...).
 * Thẻ KHÔNG nhận diện được → fallback text thường, không vỡ UI.
 */
export const KNOWN_TAGS = ["raven_scroll", "royal_decree", "council_session", "event_popup", "combat_trigger", "battle_report", "siege_update", "territory_change", "tavern_game", "tourney"] as const;

export type NarrativeTagType = (typeof KNOWN_TAGS)[number];

export type NarrativeSegment =
  | { type: "text"; content: string; attrs: Record<string, string> }
  | { type: NarrativeTagType; content: string; attrs: Record<string, string> };

const TAG_RE = new RegExp(`<(${KNOWN_TAGS.join("|")})([^>]*?)(?:>([\\s\\S]*?)</\\1>|/>)`, "gi");
const ATTR_RE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

export function parseTagAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(ATTR_RE)) {
    attrs[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  }
  return attrs;
}

export function parseNarrative(text: string): NarrativeSegment[] {
  const segments: NarrativeSegment[] = [];
  let lastIndex = 0;
  for (const m of text.matchAll(TAG_RE)) {
    const before = text.slice(lastIndex, m.index).trim();
    if (before) segments.push({ type: "text", content: before, attrs: {} });
    segments.push({
      type: m[1].toLowerCase() as NarrativeTagType,
      content: (m[3] || "").trim(),
      attrs: parseTagAttrs(m[2] ?? ""),
    });
    lastIndex = (m.index ?? 0) + m[0].length;
  }
  const rest = text.slice(lastIndex).trim();
  if (rest) segments.push({ type: "text", content: rest, attrs: {} });
  if (segments.length === 0) segments.push({ type: "text", content: text, attrs: {} });
  return segments;
}

/** Tìm thẻ combat_trigger đầu tiên trong text (orchestrator dùng — mục 7.12). */
export function findCombatTrigger(text: string): { attrs: Record<string, string>; content: string } | null {
  for (const seg of parseNarrative(text)) {
    if (seg.type === "combat_trigger") return { attrs: seg.attrs, content: seg.content };
  }
  return null;
}

/** Tìm mọi thẻ <territory_change region="..." house="..."> (9.5.1/9.6.3). */
export function findTerritoryChanges(text: string): { regionId: string; houseId: string; content: string }[] {
  const out: { regionId: string; houseId: string; content: string }[] = [];
  for (const seg of parseNarrative(text)) {
    if (seg.type !== "territory_change") continue;
    const regionId = seg.attrs.region ?? seg.attrs.region_id ?? "";
    const houseId = (seg.attrs.house ?? seg.attrs.new_house ?? "").toLowerCase();
    if (regionId) out.push({ regionId, houseId, content: seg.content });
  }
  return out;
}

/** Tìm thẻ tavern_game đầu tiên (mini-game quán rượu — chỉ xuất hiện khi AI kể ngữ cảnh phù hợp). */
export function findTavernGameTrigger(text: string): { attrs: Record<string, string>; content: string } | null {
  for (const seg of parseNarrative(text)) {
    if (seg.type === "tavern_game") return { attrs: seg.attrs, content: seg.content };
  }
  return null;
}

/** Tìm thẻ tourney đầu tiên (đại hội đấu — xuất hiện khi AI kể về đại hội theo lore). */
export function findTourneyTrigger(text: string): { attrs: Record<string, string>; content: string } | null {
  for (const seg of parseNarrative(text)) {
    if (seg.type === "tourney") return { attrs: seg.attrs, content: seg.content };
  }
  return null;
}

/** Tách "tiêu đề | nội dung" cho thẻ 2 phần (raven_scroll, event_popup). */
export function splitTagParts(content: string): { head: string; body: string } {
  const idx = content.indexOf("|");
  if (idx === -1) return { head: "", body: content.trim() };
  return { head: content.slice(0, idx).trim(), body: content.slice(idx + 1).trim() };
}

/** 1 lựa chọn quyết định trong phiên họp triều (13.3) — nhãn + hé lộ hệ quả. */
export interface CouncilChoice {
  label: string;
  hint: string;
}
export interface CouncilSession {
  issue: string;
  attendees: string[];
  intro: string;
  choices: CouncilChoice[];
}

const CHOICE_LINE = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;
const CHOICE_SEP = /\s[—–|]\s|\s-\s/; // — – | hoặc " - " ngăn nhãn với hé lộ hệ quả

function splitChoice(body: string): CouncilChoice {
  const m = body.search(CHOICE_SEP);
  if (m >= 0) {
    return { label: body.slice(0, m).trim(), hint: body.slice(m).replace(/^\s*[—–|-]\s?/, "").trim() };
  }
  return { label: body.trim(), hint: "" };
}

/**
 * Parse thẻ <council_session issue="..." attendees="A, B"> (13.3):
 * mỗi dòng gạch đầu/đánh số = 1 lựa chọn quyết định (nhãn — hé lộ hệ quả);
 * dòng còn lại gộp thành vấn đề đang bàn. Fallback: 2-4 dòng thường = lựa chọn.
 */
export function parseCouncilSession(content: string, attrs: Record<string, string>): CouncilSession {
  const attendees = (attrs.attendees ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const choices: CouncilChoice[] = [];
  const introLines: string[] = [];
  for (const line of lines) {
    const m = line.match(CHOICE_LINE);
    if (m) choices.push(splitChoice(m[1]));
    else introLines.push(line);
  }
  // không có gạch đầu dòng nhưng ít dòng ngắn → coi mỗi dòng là 1 lựa chọn
  if (choices.length === 0 && lines.length >= 2 && lines.length <= 4 && lines.every((l) => l.length < 120)) {
    return { issue: attrs.issue ?? "Phiên họp Tiểu Hội Đồng", attendees, intro: "", choices: lines.map(splitChoice) };
  }
  const issue = attrs.issue ?? introLines[0] ?? "Phiên họp Tiểu Hội Đồng";
  const intro = attrs.issue ? introLines.join(" ") : introLines.slice(1).join(" ");
  return { issue, attendees, intro, choices };
}
