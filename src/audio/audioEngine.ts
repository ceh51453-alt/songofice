/**
 * audioEngine.ts (M16, 18.1-18.2) — Nhạc nền động theo ngữ cảnh.
 *
 * Luồng: deriveMood(stat) → crossfade → playlist shuffle.
 * - Crossfade: fade out cũ + fade in mới, 3 giây
 * - Debounce: chỉ đổi mood nếu khác mood hiện tại
 * - Autoplay policy: play() chỉ gọi sau tương tác đầu tiên
 * - Tab visibility: pause khi ẩn, resume khi hiện
 * - Playlist shuffle: ngẫu nhiên trong nhóm mood, không lặp liền kề
 */
import type { StatData } from "../mvu/schema";
import type { MoodTag, MusicTrack } from "./tracks";
import { tracksByMood } from "./tracks";
import { useAudioStore } from "./audioStore";
import { createLogger } from "../lib/log";

const log = createLogger("audio/engine");

const CROSSFADE_MS = 3000;
const FADE_STEPS = 30; // 30 bước fade

// ── Singleton state ──

let currentMood: MoodTag = "peace";
let currentTrack: MusicTrack | null = null;
let audioA: HTMLAudioElement | null = null;
let audioB: HTMLAudioElement | null = null;
/** Phần tử đang phát (A/B để crossfade). */
let activeEl: "A" | "B" = "A";
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

// ── Mood detection ──

/**
 * Đọc StatData → trả MoodTag phù hợp.
 * Ưu tiên (cao → thấp): war > tragedy > victory > intrigue > winter > court > peace
 */
export function deriveMood(stat: StatData): MoodTag {
  // Đang chiến đấu
  if (stat["Trận Đang Diễn"]?.["_Đang Chiến Đấu"]) return "war";

  // Có vùng bị vây
  const territories = stat["Chủ Quyền Lãnh Thổ"];
  if (territories) {
    for (const region of Object.values(territories)) {
      if (region["Tình Trạng"] === "Bị Vây") return "war";
    }
  }

  // Bi kịch: HP rất thấp, nạn đói, NPC chết gần đây
  const hp = stat["Chỉ Số Sinh Tồn"]?.["HP"] ?? 100;
  const maxHp = stat["Chỉ Số Phái Sinh"]?.["_HP Tối Đa"] ?? 100;
  if (hp > 0 && hp <= maxHp * 0.2) return "tragedy";

  // Kiểm tra nạn đói (Lương Thực vùng = 0)
  const holdings = stat["Lãnh Địa"];
  if (holdings) {
    for (const h of Object.values(holdings)) {
      const food = (h as Record<string, unknown>)["Lương Thực"];
      if (typeof food === "number" && food <= 0) return "tragedy";
    }
  }

  // Vừa thắng trận (nhật ký gần nhất)
  const journal = stat["Nhật Ký"];
  if (journal && journal.length > 0) {
    const last = journal[journal.length - 1];
    if (last["Loại"] === "Chiến Thắng") return "victory";
  }

  // Có âm mưu đang chạy hoặc điệp viên hoạt động
  const spies = stat["Tình Báo"]?.["Điệp Viên"];
  const plots = stat["Âm Mưu"];
  if ((spies && Object.keys(spies).length > 0) || (plots && Object.keys(plots).length > 0)) {
    return "intrigue";
  }

  // Mùa đông
  if (stat["Thế Giới"]?.["Mùa"] === "Đông") return "winter";

  // Có triều đình / tiểu hội đồng
  const court = stat["Triều Đình"];
  if (court?.["Có Liên Quan"]) return "court";

  return "peace";
}

// ── Playback ──

function getActiveAudio(): HTMLAudioElement | null {
  return activeEl === "A" ? audioA : audioB;
}

function getInactiveAudio(): HTMLAudioElement | null {
  return activeEl === "A" ? audioB : audioA;
}

/** Chọn track ngẫu nhiên từ nhóm mood, tránh lặp liền kề. */
function pickTrack(mood: MoodTag): MusicTrack | null {
  const tracks = tracksByMood(mood);
  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];
  // Tránh lặp
  const filtered = currentTrack ? tracks.filter((t) => t.id !== currentTrack!.id) : tracks;
  const pool = filtered.length > 0 ? filtered : tracks;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Crossfade: fade out active → fade in inactive với track mới. */
function crossfade(track: MusicTrack): void {
  const store = useAudioStore.getState();
  const targetVol = store.musicVolume;

  const outEl = getActiveAudio();
  const inEl = getInactiveAudio();
  if (!inEl) return;

  // Chuẩn bị track mới
  inEl.src = track.src;
  inEl.volume = 0;
  inEl.loop = false;

  const playPromise = inEl.play();
  if (playPromise) {
    playPromise.catch(() => {
      log.warn("Trình duyệt chặn play — chờ tương tác đầu tiên");
    });
  }

  // Fade
  if (fadeTimer) clearInterval(fadeTimer);
  const stepMs = CROSSFADE_MS / FADE_STEPS;
  let step = 0;

  fadeTimer = setInterval(() => {
    step++;
    const progress = step / FADE_STEPS;

    if (outEl) {
      outEl.volume = Math.max(0, targetVol * (1 - progress));
    }
    inEl.volume = Math.min(targetVol, targetVol * progress);

    if (step >= FADE_STEPS) {
      clearInterval(fadeTimer!);
      fadeTimer = null;
      if (outEl) {
        outEl.pause();
        outEl.src = "";
      }
      activeEl = activeEl === "A" ? "B" : "A";
    }
  }, stepMs);

  currentTrack = track;
  log.info(`Crossfade → "${track.title}" (${track.mood})`);
}

/** Phát track tiếp theo khi track hiện tại kết thúc. */
function onTrackEnded(): void {
  const store = useAudioStore.getState();
  if (!store.musicEnabled) return;
  const track = pickTrack(currentMood);
  if (track) crossfade(track);
}

// ── Public API ──

/** Khởi tạo engine — gọi 1 lần khi mount. */
export function initAudioEngine(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;

  audioA = new Audio();
  audioB = new Audio();
  audioA.addEventListener("ended", onTrackEnded);
  audioB.addEventListener("ended", onTrackEnded);

  // Tab visibility
  document.addEventListener("visibilitychange", () => {
    const active = getActiveAudio();
    if (!active || !currentTrack) return;
    const store = useAudioStore.getState();
    if (!store.musicEnabled) return;

    if (document.hidden) {
      active.pause();
    } else {
      active.play().catch(() => {});
    }
  });

  initialized = true;
  log.info("Audio engine khởi tạo");
}

/** Cập nhật mood từ state — gọi mỗi khi stat đổi. */
export function updateMood(stat: StatData): void {
  const store = useAudioStore.getState();
  if (!store.musicEnabled || !store.userInteracted) return;
  if (!initialized) initAudioEngine();

  const mood = store.audioMode === "adaptive" ? deriveMood(stat) : "peace";

  if (mood === currentMood && currentTrack) return; // debounce — cùng mood, đang phát → bỏ qua

  currentMood = mood;
  const track = pickTrack(mood);
  if (!track) return; // không có track cho mood này

  crossfade(track);
}

/** Cập nhật âm lượng realtime (khi kéo slider). */
export function setEngineVolume(vol: number): void {
  const active = getActiveAudio();
  if (active && currentTrack) {
    active.volume = Math.max(0, Math.min(1, vol));
  }
}

/** Dừng phát nhạc. */
export function stopMusic(): void {
  if (audioA) { audioA.pause(); audioA.src = ""; }
  if (audioB) { audioB.pause(); audioB.src = ""; }
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  currentTrack = null;
  log.info("Dừng nhạc");
}

/** Bắt đầu phát theo mood hiện tại (sau khi bật lại). */
export function resumeMusic(): void {
  const store = useAudioStore.getState();
  if (!store.musicEnabled || !store.userInteracted) return;
  if (!initialized) initAudioEngine();

  const track = pickTrack(currentMood);
  if (!track) return;
  crossfade(track);
}

/** Trả mood hiện tại — UI hiển thị. */
export function getCurrentMood(): MoodTag {
  return currentMood;
}

/** Trả track đang phát — UI hiển thị tên. */
export function getCurrentTrack(): MusicTrack | null {
  return currentTrack;
}

/** Label tiếng Việt cho mood. */
export const MOOD_LABELS: Record<MoodTag, string> = {
  peace: "Yên bình",
  court: "Triều đình",
  intrigue: "Mưu đồ",
  war: "Chiến tranh",
  tragedy: "Bi kịch",
  winter: "Mùa đông",
  victory: "Vinh quang",
};
