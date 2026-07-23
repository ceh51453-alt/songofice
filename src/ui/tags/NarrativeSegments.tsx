/**
 * Render các đoạn thẻ ngữ nghĩa (5.6) — mỗi loại 1 component kính mờ riêng.
 * M4: raven_scroll, event_popup, combat_trigger (placeholder chờ engine M6);
 * các thẻ khác render dạng card chung. Không emoji — icon SVG.
 */
import { parseNarrative, parseCouncilSession, splitTagParts, type NarrativeSegment } from "./parseNarrative";
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

function CharacterMentionText({ text }: { text: string }) {
  const currentYear = useMvuStore(s => s.stat["Thế Giới"]["Năm"]);
  if (!text) return null;
  const parts = text.split(CHAR_REGEX);
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;
        const lowerPart = part.toLowerCase();
        const matchedChar = SORTED_CHARS.find(c => c.toLowerCase() === lowerPart);
        
        if (matchedChar) {
          const image = getPortraitForCharacter(matchedChar, currentYear);
          return (
            <span key={i} className="group relative inline-block cursor-help font-medium text-[var(--accent-text)] hover:underline decoration-dashed decoration-1 underline-offset-2">
              {part}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-md border border-[var(--accent)] bg-black/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                  <img src={`/portraits/${image}`} alt={matchedChar} className="h-full w-full object-cover" />
                </div>
              </span>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function Segment({ seg }: { seg: NarrativeSegment }) {
  switch (seg.type) {
    case "text":
      return <CharacterMentionText text={seg.content} />;
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

/** Render nội dung 1 tin nhắn AI: văn thường + thẻ inline. */
export function NarrativeContent({ text }: { text: string }) {
  const segments = parseNarrative(text);
  return (
    <>
      {segments.map((seg, i) => (
        <Segment key={i} seg={seg} />
      ))}
    </>
  );
}
