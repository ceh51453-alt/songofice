/**
 * AudioSettings.tsx (M16, 18.4) — Tab Âm Thanh trong Settings.
 * Bật/tắt riêng Nhạc/SFX, slider âm lượng, toggle adaptive vs fixed.
 */
import { useAudioStore } from "../../audio/audioStore";
import { setEngineVolume, MOOD_LABELS, getCurrentMood } from "../../audio/audioEngine";

const labelStyle: React.CSSProperties = {
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

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "1px solid var(--glass-border)",
        background: value ? "var(--accent-soft)" : "rgba(255,255,255,0.06)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: value ? "var(--accent-text)" : "var(--text-faint)",
          position: "absolute",
          top: 2,
          left: value ? 22 : 2,
          transition: "left 0.2s, background 0.2s",
        }}
      />
    </button>
  );
}

export function AudioSettings() {
  const musicEnabled = useAudioStore((s) => s.musicEnabled);
  const sfxEnabled = useAudioStore((s) => s.sfxEnabled);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const sfxVolume = useAudioStore((s) => s.sfxVolume);
  const audioMode = useAudioStore((s) => s.audioMode);
  const toggleMusic = useAudioStore((s) => s.toggleMusic);
  const toggleSfx = useAudioStore((s) => s.toggleSfx);
  const setMusicVolume = useAudioStore((s) => s.setMusicVolume);
  const setSfxVolume = useAudioStore((s) => s.setSfxVolume);
  const setAudioMode = useAudioStore((s) => s.setAudioMode);

  const currentMood = getCurrentMood();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Nhạc nền */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={labelStyle}>Nhạc nền</div>
            <div style={descStyle}>
              Không khí hiện tại: {MOOD_LABELS[currentMood]}
            </div>
          </div>
          <Toggle value={musicEnabled} onToggle={toggleMusic} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", minWidth: 60 }}>
            Âm lượng
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={musicVolume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setMusicVolume(v);
              setEngineVolume(v);
            }}
            style={{
              flex: 1,
              height: 3,
              accentColor: "var(--accent-text)",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30, textAlign: "right" }}>
            {Math.round(musicVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Chế độ nhạc */}
      <div>
        <div style={labelStyle}>Chế độ nhạc</div>
        <select
          value={audioMode}
          onChange={(e) => setAudioMode(e.target.value as "adaptive" | "fixed")}
          style={selectStyle}
        >
          <option value="adaptive">Theo ngữ cảnh (adaptive)</option>
          <option value="fixed">Playlist cố định</option>
        </select>
        <div style={descStyle}>
          {audioMode === "adaptive"
            ? "Nhạc tự đổi theo tình huống: yên bình, chiến tranh, mưu đồ..."
            : "Phát tuần tự toàn bộ track, không đổi theo ngữ cảnh"}
        </div>
      </div>

      {/* Đường kẻ */}
      <div style={{ borderTop: "1px solid var(--glass-border)" }} />

      {/* SFX */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={labelStyle}>Hiệu ứng âm thanh (SFX)</div>
            <div style={descStyle}>Âm thanh nhẹ khi gửi tin, mở panel, thắng trận...</div>
          </div>
          <Toggle value={sfxEnabled} onToggle={toggleSfx} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", minWidth: 60 }}>
            Âm lượng
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: 3,
              accentColor: "var(--accent-text)",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30, textAlign: "right" }}>
            {Math.round(sfxVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Lưu ý autoplay */}
      <div style={{
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--glass-border)",
        fontSize: "0.75rem",
        color: "rgba(255,255,255,0.3)",
      }}>
        Nhạc chỉ phát sau tương tác đầu tiên (chính sách trình duyệt).
        Thả file nhạc vào thư mục content/audio/ rồi khai báo trong tracks.ts.
      </div>
    </div>
  );
}
