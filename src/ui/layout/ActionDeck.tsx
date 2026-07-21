/**
 * Action Deck (6.3) — dải nút hành động theo NGỮ CẢNH state. Bấm nút → chèn
 * câu hành động vào ô chat (người chơi SỬA ĐƯỢC trước khi gửi — không tự gửi).
 * KHÔNG có nút tua/đẩy thời gian (triết lý 6.2). Nút chỉ hiện khi hợp lệ theo state.
 */
import { useMvuStore } from "../../state/mvuStore";
import { useUiStore } from "../../state/uiStore";
import { useChatStore } from "../../state/chatStore";
import { IconCastle, IconCrossedSwords, IconEye, IconMap, IconPin, IconUsers } from "../icons";

interface DeckAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  sentence: string;
}

export function ActionDeck() {
  const stat = useMvuStore((s) => s.stat);
  const setComposerText = useUiStore((s) => s.setComposerText);
  const busy = useChatStore((s) => s.status !== "idle");

  const npcs = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ].filter(([, n]) => n["Còn Sống"]);
  const location = stat["Thế Giới"]["Vị Trí"];
  const inCombatMode = stat["Chế Độ Hiện Tại"] === "Chế Độ Chiến Tranh";
  const holdings = Object.entries(stat["Lãnh Địa"]);

  const actions: DeckAction[] = [];

  // mặc định (đang đi đường/tự do — 6.3)
  actions.push(
    { key: "observe", label: "Quan sát", icon: <IconEye size={13} />, sentence: `Ta quan sát kỹ xung quanh ${location}.` },
    { key: "move", label: "Di chuyển", icon: <IconMap size={13} />, sentence: "Ta lên đường tới " },
  );

  // có NPC trong danh sách quan hệ → nút xã giao với người gần nhất
  if (npcs.length > 0) {
    const [name, npc] = npcs.sort((a, b) => Math.abs(b[1]["Độ Hảo Cảm"]) - Math.abs(a[1]["Độ Hảo Cảm"]))[0];
    actions.push({
      key: "talk", label: `Trò chuyện (${name.split(" ")[0]})`, icon: <IconUsers size={13} />,
      sentence: `Ta tìm ${name} để trò chuyện.`,
    });
    if (npc["Độ Hảo Cảm"] >= 15) {
      actions.push({ key: "gift", label: "Tặng quà", icon: <IconUsers size={13} />, sentence: `Ta chuẩn bị một món quà cho ${name}.` });
    }
    if (npc["Độ Hảo Cảm"] <= -15) {
      actions.push({ key: "threaten", label: "Uy hiếp", icon: <IconCrossedSwords size={13} />, sentence: `Ta tìm cách gây áp lực lên ${name}.` });
    }
  }

  // ngữ cảnh lãnh địa (6.3/10.4): có lãnh địa quản lý → nút thị sát/cai trị
  if (holdings.length > 0) {
    const [terrName, terr] = holdings[0];
    actions.push({
      key: "inspect-holding", label: "Thị sát lãnh địa", icon: <IconCastle size={13} />,
      sentence: `Ta đi thị sát tình hình ${terrName}, xem xét dân tình và công trình.`,
    });
    if (terr["Trung Thành"] < 40) {
      actions.push({ key: "soothe", label: "An dân", icon: <IconUsers size={13} />, sentence: `Ta tìm cách vỗ về dân chúng đang bất mãn ở ${terrName}.` });
    }
  }

  if (inCombatMode) {
    actions.push({ key: "battle", label: "Xem thế trận", icon: <IconCrossedSwords size={13} />, sentence: "Ta đánh giá thế trận hiện tại." });
  }

  actions.push({ key: "free", label: "Hành động tự do", icon: <IconPin size={13} />, sentence: "" });

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 pb-1.5 pt-2 sm:px-6 [-webkit-overflow-scrolling:touch]">
      {actions.map((a) => (
        <button
          key={a.key}
          disabled={busy}
          onClick={() => {
            setComposerText(a.sentence);
            document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-[12px] text-[var(--text-muted)] transition-all hover:border-[var(--accent-border)] hover:text-[var(--accent-text)] disabled:opacity-40"
        >
          {a.icon} {a.label}
        </button>
      ))}
    </div>
  );
}
