/**
 * Render các đoạn thẻ ngữ nghĩa (5.6) — mỗi loại 1 component kính mờ riêng.
 * M4: raven_scroll, event_popup, combat_trigger (placeholder chờ engine M6);
 * các thẻ khác render dạng card chung.
 *
 * Ngoài thẻ của app, nội dung do preset ST sinh ra cũng được render:
 *   ```html … ```  → SandboxedHtml (iframe cách ly, script preset chạy được)
 *   HTML thô       → InlineHtml (shadow DOM, đã lọc DOMPurify)
 */
import { parseNarrative, parseCouncilSession, splitTagParts, type NarrativeSegment } from "./parseNarrative";
import { splitRichContent, looksLikeHtml, htmlToPlainText } from "../chat/richContent";
import { InlineHtml } from "../chat/InlineHtml";
import { SandboxedHtml } from "../chat/SandboxedHtml";
import { IconAlert, IconCrossedSwords, IconCrown, IconMap, IconScroll, IconUsers } from "../icons";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { useChatStore } from "../../state/chatStore";
import { useMvuStore } from "../../state/mvuStore";
import { getPortraitForCharacter, SORTED_CHARS, CHAR_REGEX } from "./characterPortraits";
function RavenScroll({ content }: { content: string }) {
  const { head, body } = splitTagParts(content);
  return (
    <div className="glass anim-in my-2 border-[var(--accent-border)] bg-[linear-gradient(160deg,rgba(176,141,87,0.10),rgba(176,141,87,0.03))] px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5">
        <IconScroll size={16} color="var(--accent-text)" />
        <span className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">
          {head || "QUẠ ĐƯA TIN"}
        </span>
      </div>
      <p className="font-display whitespace-pre-wrap text-[14.5px] italic leading-relaxed text-[var(--text-soft)]">{body}</p>
    </div>
  );
}

function EventPopup({ content }: { content: string }) {
  const { head, body } = splitTagParts(content);
  return (
    <div className="glass anim-in my-2 border-[rgba(176,106,95,0.45)] bg-[linear-gradient(160deg,rgba(176,106,95,0.12),rgba(176,106,95,0.03))] px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <IconAlert size={16} color="var(--danger)" />
        <span className="font-display text-[13px] tracking-widest text-[var(--danger)]">{head || "BIẾN CỐ"}</span>
      </div>
      <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--text-soft)]">{body}</p>
    </div>
  );
}

function CombatTrigger({ content }: { content: string }) {
  return (
    <div className="glass anim-in my-2 border-[var(--glass-border-bright)] px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <IconCrossedSwords size={16} color="var(--warn)" />
        <span className="font-display text-[13px] tracking-widest text-[var(--warn)]">GIAO CHIẾN</span>
      </div>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-muted)]">{content}</p>
      <p className="mt-1.5 text-[12px] italic text-[var(--text-faint)]">Cỗ máy đang phân giải trận này…</p>
    </div>
  );
}

/** Thẻ đổi chủ vùng (9.5.1) — bản đồ đã tự đổi màu, đây là báo tin trong dòng kể. */
function TerritoryChangeCard({ content, attrs }: { content: string; attrs: Record<string, string> }) {
  const region = REGIONS_BY_ID[attrs.region ?? ""];
  const house = HOUSES_BY_ID[(attrs.house ?? "").toLowerCase()];
  const col = houseColor((attrs.house ?? "").toLowerCase());
  return (
    <div className="glass anim-in my-2 px-4 py-3" style={{ borderColor: col.base }}>
      <div className="mb-1.5 flex items-center gap-2">
        <IconMap size={16} color={col.light} />
        <span className="font-display text-[13px] tracking-widest" style={{ color: col.light }}>
          ĐỔI CHỦ LÃNH THỔ{region ? ` · ${region.name.toUpperCase()}` : ""}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-muted)]">{content}</p>
      <p className="mt-1.5 text-[12px] italic text-[var(--text-faint)]">
        {house ? `${house.name} tiếp quản` : "Vùng trở nên vô chủ"} — bản đồ đã cập nhật.
      </p>
    </div>
  );
}

/**
 * Phiên họp Tiểu Hội Đồng / họp gia tộc (13.3) — bàn tròn + người dự + 2-3 nút
 * quyết định (kèm hé lộ hệ quả). Bấm → gửi quyết định vào chat, AI kể diễn biến.
 */
function CouncilSessionCard({ content, attrs }: { content: string; attrs: Record<string, string> }) {
  const send = useChatStore((s) => s.send);
  const busy = useChatStore((s) => s.status !== "idle");
  const { issue, attendees, intro, choices } = parseCouncilSession(content, attrs);

  return (
    <div className="glass anim-in my-2 border-[var(--accent-border)] bg-[linear-gradient(160deg,rgba(176,141,87,0.09),rgba(176,141,87,0.02))] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 border-b border-[var(--glass-border)] pb-1.5">
        <IconCrown size={16} color="var(--accent-text)" />
        <span className="font-display text-[13px] tracking-widest text-[var(--accent-text)]">PHIÊN HỌP TIỂU HỘI ĐỒNG</span>
      </div>

      {attendees.length > 0 && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--text-faint)]">
          <IconUsers size={13} />
          <span className="truncate">{attendees.join(" · ")}</span>
        </div>
      )}

      <p className="text-[14px] font-medium leading-relaxed text-[var(--text-soft)]">{issue}</p>
      {intro && <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-muted)]">{intro}</p>}

      {choices.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {choices.map((c, i) => (
            <button
              key={i}
              disabled={busy}
              onClick={() => void send(`Trong phiên họp Tiểu Hội Đồng, ta quyết định: "${c.label}".`)}
              className="group flex w-full flex-col gap-0.5 rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-left transition-all hover:border-[var(--accent-border)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-40"
            >
              <span className="text-[13.5px] text-[var(--text-soft)] group-hover:text-[var(--accent-text)]">{c.label}</span>
              {c.hint && <span className="text-[11.5px] italic text-[var(--text-faint)]">{c.hint}</span>}
            </button>
          ))}
        </div>
      )}
      {choices.length === 0 && (
        <p className="mt-1.5 text-[11.5px] italic text-[var(--text-faint)]">Nêu ý kiến của ngươi trong ô nhập bên dưới.</p>
      )}
    </div>
  );
}

function GenericTagCard({ type, content }: { type: string; content: string }) {
  return (
    <div className="glass anim-in my-2 px-4 py-3">
      <span className="font-display mb-1 block text-[12px] uppercase tracking-widest text-[var(--text-faint)]">{type}</span>
      <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--text-soft)]">{content}</p>
    </div>
  );
}

/** Card tóm tắt trận (7.10): outcome + 2 cột số liệu từ khối engine điền. */
function BattleReportCard({ content, attrs }: { content: string; attrs: Record<string, string> }) {
  const outcome = attrs.outcome ?? "";
  const won = outcome.includes("Thắng");
  const lost = outcome.includes("Bại");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div
      className={`glass anim-in my-2 px-4 py-3 ${
        won ? "border-[rgba(125,165,131,0.45)]" : lost ? "border-[rgba(176,106,95,0.45)]" : "border-[var(--glass-border-bright)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-[var(--glass-border)] pb-1.5">
        <span className="font-display text-[13px] tracking-widest text-[var(--text-faint)]">
          CHIẾN BÁO{attrs.scale ? ` · ${attrs.scale.toUpperCase()}` : ""}{attrs.terrain ? ` · ${attrs.terrain}` : ""}
        </span>
        <span className={`font-display text-[16px] tracking-wider ${won ? "text-[var(--ok)]" : lost ? "text-[var(--danger)]" : "text-[var(--warn)]"}`}>
          {outcome}
        </span>
      </div>
      <div className="space-y-0.5">
        {lines.map((l, i) => {
          const idx = l.indexOf(":");
          if (idx === -1) return <p key={i} className="text-[12.5px] text-[var(--text-muted)]">{l}</p>;
          return (
            <p key={i} className="text-[12.5px]">
              <span className="text-[var(--text-faint)]">{l.slice(0, idx)}:</span>
              <span className="text-[var(--text-soft)]">{l.slice(idx + 1)}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/** Dải chân dung nhân vật được nhắc tới trong đoạn văn. */
function PortraitCards({ chars }: { chars: Array<{ name: string; image: string }> }) {
  if (chars.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-4 justify-center">
      {chars.map(char => (
        <div key={char.name} className="flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 shadow-sm">
          <div className="flex h-[280px] w-[220px] items-center justify-center overflow-hidden rounded-sm bg-black/50">
            <img src={`/portraits/${char.image}`} alt={char.name} className="h-full w-full object-cover" />
          </div>
          <span className="font-display text-[13px] font-medium tracking-wide text-[var(--accent-text)]">{char.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Dò tên nhân vật trong text thuần (dùng cho nhánh HTML — không tô inline được). */
function findMentionedChars(plain: string, year: number): Array<{ name: string; image: string }> {
  const out: Array<{ name: string; image: string }> = [];
  for (const part of plain.split(CHAR_REGEX)) {
    if (!part) continue;
    const matched = SORTED_CHARS.find(c => c.toLowerCase() === part.toLowerCase());
    if (!matched || out.some(o => o.name === matched)) continue;
    const image = getPortraitForCharacter(matched, year);
    if (image) out.push({ name: matched, image });
  }
  return out;
}

/** Đoạn văn có HTML trình bày của preset → shadow DOM + chân dung bên dưới. */
function HtmlText({ html }: { html: string }) {
  const currentYear = useMvuStore(s => s.stat["Thế Giới"]["Năm"]);
  return (
    <>
      <InlineHtml html={html} />
      <PortraitCards chars={findMentionedChars(htmlToPlainText(html), currentYear)} />
    </>
  );
}

function CharacterMentionText({ text }: { text: string }) {
  const currentYear = useMvuStore(s => s.stat["Thế Giới"]["Năm"]);
  if (!text) return null;
  const parts = text.split(CHAR_REGEX);

  const mentionedChars: Array<{ name: string; image: string }> = [];

  const renderedText = (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;
        const lowerPart = part.toLowerCase();
        const matchedChar = SORTED_CHARS.find(c => c.toLowerCase() === lowerPart);

        if (matchedChar) {
          const image = getPortraitForCharacter(matchedChar, currentYear);
          if (image && !mentionedChars.some(c => c.name === matchedChar)) {
            mentionedChars.push({ name: matchedChar, image });
          }
          return (
            <span key={i} className="font-medium text-[var(--accent-text)]">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );

  return (
    <>
      {renderedText}
      <PortraitCards chars={mentionedChars} />
    </>
  );
}

function Segment({ seg }: { seg: NarrativeSegment }) {
  switch (seg.type) {
    case "text":
      return looksLikeHtml(seg.content)
        ? <HtmlText html={seg.content} />
        : <CharacterMentionText text={seg.content} />;
    case "raven_scroll":
      return <RavenScroll content={seg.content} />;
    case "event_popup":
      return <EventPopup content={seg.content} />;
    case "combat_trigger":
      return <CombatTrigger content={seg.content} />;
    case "battle_report":
      return <BattleReportCard content={seg.content} attrs={seg.attrs} />;
    case "territory_change":
      return <TerritoryChangeCard content={seg.content} attrs={seg.attrs} />;
    case "council_session":
      return <CouncilSessionCard content={seg.content} attrs={seg.attrs} />;
    default:
      return <GenericTagCard type={seg.type} content={seg.content} />;
  }
}

/** Thẻ ngữ nghĩa của app + văn/HTML trong một mảnh nội dung. */
function NarrativeParts({ text }: { text: string }) {
  return (
    <>
      {parseNarrative(text).map((seg, i) => (
        <Segment key={i} seg={seg} />
      ))}
    </>
  );
}

/** Render nội dung 1 tin nhắn AI: khối ```html``` cách ly + văn/HTML + thẻ inline. */
export function NarrativeContent({ text }: { text: string }) {
  return (
    <>
      {splitRichContent(text).map((part, i) =>
        part.kind === "htmlBlock" ? (
          <SandboxedHtml key={i} html={part.content} />
        ) : (
          <NarrativeParts key={i} text={part.content} />
        ),
      )}
    </>
  );
}
