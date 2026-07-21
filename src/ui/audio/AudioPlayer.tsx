/**
 * AudioPlayer.tsx (M16, 18.4) — Player nhỏ gọn kính mờ.
 *
 * Cố định góc dưới phải GameScreen. Thu thành icon nhỏ, bấm mở rộng.
 * Hiển thị: tên track, mood, play/pause, volume, skip.
 */
import { useState, useEffect, useCallback } from "react";
import { useAudioStore } from "../../audio/audioStore";
import {
  getCurrentTrack,
  getCurrentMood,
  stopMusic,
  resumeMusic,
  setEngineVolume,
  MOOD_LABELS,
} from "../../audio/audioEngine";
import { IconMusic, IconPlay, IconPause, IconVolume, IconVolumeOff, IconSkipForward } from "./AudioIcons";

export function AudioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [, forceUpdate] = useState(0);
  const musicEnabled = useAudioStore((s) => s.musicEnabled);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const setMusicVolume = useAudioStore((s) => s.setMusicVolume);
  const toggleMusic = useAudioStore((s) => s.toggleMusic);
  const markInteracted = useAudioStore((s) => s.markInteracted);

  // Refresh track info mỗi 2 giây
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const track = getCurrentTrack();
  const mood = getCurrentMood();

  const handleToggle = useCallback(() => {
    markInteracted();
    if (musicEnabled) {
      stopMusic();
      toggleMusic();
    } else {
      toggleMusic();
      resumeMusic();
    }
  }, [musicEnabled, toggleMusic, markInteracted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setMusicVolume(v);
      setEngineVolume(v);
    },
    [setMusicVolume],
  );

  const handleSkip = useCallback(() => {
    markInteracted();
    resumeMusic();
  }, [markInteracted]);

  // Thu gọn — icon nhỏ
  if (!expanded) {
    return (
      <button
        onClick={() => { setExpanded(true); markInteracted(); }}
        title="Mở trình phát nhạc"
        aria-label="Mở trình phát nhạc"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 40,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(12,15,20,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "50%",
          cursor: "pointer",
          transition: "all 0.2s",
          opacity: 0.7,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
      >
        <IconMusic size={18} color={musicEnabled && track ? "var(--accent-text)" : "var(--text-muted)"} />
      </button>
    );
  }

  // Mở rộng — player kính mờ
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 40,
        width: 240,
        padding: "12px 14px",
        background: "rgba(12,15,20,0.75)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Header — thu gọn */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <IconMusic size={14} color="var(--accent-text)" />
          <span style={{
            fontSize: "0.75rem",
            color: "var(--text-faint)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {MOOD_LABELS[mood]}
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          title="Thu gọn"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.75rem",
            padding: "2px 4px",
          }}
        >
          Thu
        </button>
      </div>

      {/* Track name */}
      <div style={{
        fontSize: "0.8rem",
        color: "var(--text-soft)",
        fontWeight: 500,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {track ? track.title : "Chưa có nhạc"}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Play/Pause */}
        <button
          onClick={handleToggle}
          title={musicEnabled ? "Tắt nhạc" : "Bật nhạc"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--glass-border)",
            borderRadius: "50%",
            cursor: "pointer",
            color: "var(--text-soft)",
          }}
        >
          {musicEnabled ? <IconPause size={12} /> : <IconPlay size={12} />}
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          title="Track tiếp theo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <IconSkipForward size={14} />
        </button>

        {/* Volume icon */}
        <button
          onClick={handleToggle}
          title={musicEnabled ? "Tắt tiếng" : "Bật tiếng"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          {musicEnabled ? <IconVolume size={14} /> : <IconVolumeOff size={14} />}
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={musicVolume}
          onChange={handleVolumeChange}
          title={`Âm lượng: ${Math.round(musicVolume * 100)}%`}
          style={{
            flex: 1,
            height: 3,
            accentColor: "var(--accent-text)",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
