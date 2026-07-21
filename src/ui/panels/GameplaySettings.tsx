/**
 * GameplaySettings.tsx (M15, mục 21) — Tab Gameplay trong Settings.
 * Đọc/ghi trực tiếp vào mvuStore["Cài Đặt Ván"] + settingsStore.
 * Glassmorphism, không emoji.
 */
import { useMvuStore } from "../../state/mvuStore";
import { useSettingsStore } from "../../state/settingsStore";

const DIFFICULTY_OPTIONS = [
  { value: "Nhàn Hạ", label: "Nhàn Hạ", desc: "DC thấp, quân ta mạnh hơn, kinh tế dễ thở" },
  { value: "Cân Bằng", label: "Cân Bằng", desc: "Mặc định — thách thức vừa phải" },
  { value: "Chân Thực", label: "Chân Thực", desc: "DC cao, thua trận mất nhiều, kinh tế khắc nghiệt" },
] as const;

const NARRATIVE_MODES = [
  { value: "Theo Sát Nguyên Tác", label: "Theo Sát Nguyên Tác", desc: "Cột mốc canon tự động xảy ra" },
  { value: "Diễn Giải Tự Do", label: "Diễn Giải Tự Do", desc: "AI gợi ý cột mốc, người chơi quyết định" },
] as const;

const AUTOSAVE_OPTIONS = [
  { value: 0, label: "Tắt" },
  { value: 5, label: "5 lượt" },
  { value: 10, label: "10 lượt" },
  { value: 20, label: "20 lượt" },
] as const;

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--glass-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-soft)",
  fontSize: "0.85rem",
  outline: "none",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 6,
};

const descStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.35)",
  marginTop: 4,
};

export function GameplaySettings() {
  const stat = useMvuStore((s) => s.stat);
  const setByPath = useMvuStore((s) => s.setByPath);
  const autoSaveInterval = useSettingsStore((s) => s.autoSaveInterval);
  const setAutoSaveInterval = useSettingsStore((s) => s.setAutoSaveInterval);
  const nsfw = useSettingsStore((s) => s.nsfw);
  const setNsfw = useSettingsStore((s) => s.setNsfw);

  const difficulty = stat["Cài Đặt Ván"]["Độ Khó Chiến Đấu"];
  const narrativeMode = stat["Cài Đặt Ván"]["Chế Độ Tường Thuật"];

  const selectedDiff = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty);
  const selectedNarr = NARRATIVE_MODES.find((m) => m.value === narrativeMode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Độ Khó Chiến Đấu */}
      <div>
        <label style={labelStyle}>Độ Khó Chiến Đấu</label>
        <select
          value={difficulty}
          onChange={(e) => setByPath("Cài Đặt Ván.Độ Khó Chiến Đấu", e.target.value)}
          style={selectStyle}
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        {selectedDiff && <div style={descStyle}>{selectedDiff.desc}</div>}
      </div>

      {/* Chế Độ Tường Thuật */}
      <div>
        <label style={labelStyle}>Chế Độ Tường Thuật</label>
        <select
          value={narrativeMode}
          onChange={(e) => setByPath("Cài Đặt Ván.Chế Độ Tường Thuật", e.target.value)}
          style={selectStyle}
        >
          {NARRATIVE_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {selectedNarr && <div style={descStyle}>{selectedNarr.desc}</div>}
      </div>

      {/* Auto-save interval */}
      <div>
        <label style={labelStyle}>Tự Động Lưu</label>
        <select
          value={autoSaveInterval}
          onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
          style={selectStyle}
        >
          {AUTOSAVE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div style={descStyle}>
          {autoSaveInterval > 0
            ? `Tự động lưu mỗi ${autoSaveInterval} lượt`
            : "Không tự động lưu — chỉ lưu thủ công"}
        </div>
      </div>

      {/* NSFW toggle */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: "1px solid var(--glass-border)",
      }}>
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>
            Nội dung người lớn (NSFW)
          </div>
          <div style={descStyle}>Cho phép AI viết nội dung 18+</div>
        </div>
        <button
          onClick={() => setNsfw(!nsfw)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "1px solid var(--glass-border)",
            background: nsfw ? "var(--accent-soft)" : "rgba(255,255,255,0.06)",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: nsfw ? "var(--accent-text)" : "var(--text-faint)",
            position: "absolute",
            top: 2,
            left: nsfw ? 22 : 2,
            transition: "left 0.2s, background 0.2s",
          }} />
        </button>
      </div>

      <div style={{
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--glass-border)",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.3)",
      }}>
        Thời Kỳ không thể đổi giữa ván — tạo ván mới nếu muốn chơi thời kỳ khác.
      </div>
    </div>
  );
}
