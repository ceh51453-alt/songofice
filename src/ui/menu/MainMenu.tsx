/**
 * Main Menu (8.1) — màn hình đầu tiên: Bắt Đầu Mới / Tiếp Tục / Tải Ván / Cài Đặt.
 * "Tiếp Tục" = quay lại ván đang chơi trong phiên.
 * "Tải Ván" = mở SaveLoadPanel mode="load" (M15).
 */
import { useUiStore } from "../../state/uiStore";
import { useChatStore } from "../../state/chatStore";
import { useMvuStore } from "../../state/mvuStore";
import { IconCrossedSwords } from "../icons";

export function MainMenu({
  onOpenSettings,
  onOpenLoadGame,
}: {
  onOpenSettings: () => void;
  onOpenLoadGame: () => void;
}) {
  const setScreen = useUiStore((s) => s.setScreen);
  const hasSession = useChatStore((s) => s.messages.length > 0);
  const stat = useMvuStore((s) => s.stat);
  const sessionName = stat["Thông Tin Nhân Vật"]["Họ Tên"];
  const sessionEra = stat["Cài Đặt Ván"]["Thời Kỳ"];

  const itemClass =
    "glass w-full px-6 py-4 text-left transition-all hover:border-[var(--accent-border)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-35 disabled:pointer-events-none";

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="anim-in w-full max-w-md space-y-8">
        <div className="text-center">
          <IconCrossedSwords size={52} color="var(--accent-text)" strokeWidth={1.1} className="mx-auto mb-4" />
          <h1 className="font-display text-3xl tracking-[0.12em] text-[var(--text-soft)]">A SONG OF ICE AND FIRE</h1>
          <p className="mt-2 text-[13px] tracking-[0.3em] text-[var(--text-faint)]">NHẬP VAI WESTEROS</p>
        </div>

        <div className="space-y-3">
          <button className={itemClass} onClick={() => setScreen("newgame")}>
            <span className="font-display block text-lg tracking-wide text-[var(--accent-text)]">Bắt Đầu Mới</span>
            <span className="text-[13px] text-[var(--text-muted)]">Chọn Thời Kỳ, dựng nhân vật, bước vào loạn thế</span>
          </button>

          <button
            className={itemClass}
            disabled={!hasSession}
            title={hasSession ? undefined : "Chưa có ván nào đang chơi — hãy Bắt Đầu Mới"}
            onClick={() => setScreen("game")}
          >
            <span className="font-display block text-lg tracking-wide text-[var(--text-soft)]">Tiếp Tục</span>
            <span className="text-[13px] text-[var(--text-muted)]">
              {hasSession
                ? `${sessionName}${sessionEra ? ` · ${sessionEra}` : ""} — ván đang chơi`
                : "Chưa có ván nào đang chơi"}
            </span>
          </button>

          <button className={itemClass} onClick={onOpenLoadGame}>
            <span className="font-display block text-lg tracking-wide text-[var(--text-soft)]">Tải Ván</span>
            <span className="text-[13px] text-[var(--text-muted)]">Mở ván đã lưu hoặc nhập file JSON</span>
          </button>

          <button className={itemClass} onClick={onOpenSettings}>
            <span className="font-display block text-lg tracking-wide text-[var(--text-soft)]">Cài Đặt</span>
            <span className="text-[13px] text-[var(--text-muted)]">Kết nối API, preset, lore, gameplay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

