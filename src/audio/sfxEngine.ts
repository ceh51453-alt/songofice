/**
 * sfxEngine.ts (M16, 18.3) — Âm thanh hiệu ứng ngắn.
 *
 * SFX tinh tế, âm lượng thấp, tông trầm — vài âm sang trọng.
 * Phát qua HTMLAudioElement (đơn giản, đủ cho SFX ngắn).
 * Khi chưa có file SFX thật, im lặng.
 */
import { useAudioStore } from "./audioStore";
import { createLogger } from "../lib/log";

const log = createLogger("audio/sfx");

/** Tên SFX có sẵn — thêm file mới chỉ cần khai báo src ở đây. */
export type SfxName =
  | "message_send"
  | "modal_open"
  | "battle_win"
  | "battle_lose"
  | "gold_gain"
  | "crisis_alert"
  | "save_done"
  | "turn_advance";

/**
 * Registry SFX — src rỗng = chưa có file, im lặng.
 * Thả file vào content/audio/sfx/ rồi khai báo src ở đây.
 */
const SFX_REGISTRY: Record<SfxName, string> = {
  message_send: "",    // /audio/sfx/quill.mp3
  modal_open: "",      // /audio/sfx/seal.mp3
  battle_win: "",      // /audio/sfx/fanfare.mp3
  battle_lose: "",     // /audio/sfx/defeat.mp3
  gold_gain: "",       // /audio/sfx/coins.mp3
  crisis_alert: "",    // /audio/sfx/horn.mp3
  save_done: "",       // /audio/sfx/ink-stamp.mp3
  turn_advance: "",    // /audio/sfx/page-turn.mp3
};

/** Pool audio elements để phát SFX chồng nhau. */
const pool: HTMLAudioElement[] = [];
const POOL_SIZE = 4;

function getPoolElement(): HTMLAudioElement {
  // Tìm element rảnh
  for (const el of pool) {
    if (el.paused || el.ended) return el;
  }
  // Pool đầy → tạo mới nếu chưa đạt max
  if (pool.length < POOL_SIZE) {
    const el = new Audio();
    pool.push(el);
    return el;
  }
  // Pool đầy hết → dùng lại cái đầu
  return pool[0];
}

/** Phát SFX nếu bật và có file. */
export function playSfx(name: SfxName): void {
  const store = useAudioStore.getState();
  if (!store.sfxEnabled || !store.userInteracted) return;

  const src = SFX_REGISTRY[name];
  if (!src) return; // chưa có file → im lặng

  try {
    const el = getPoolElement();
    el.src = src;
    el.volume = Math.max(0, Math.min(1, store.sfxVolume));
    el.play().catch(() => {
      log.warn(`SFX "${name}" bị trình duyệt chặn`);
    });
  } catch {
    log.warn(`Lỗi phát SFX "${name}"`);
  }
}

/** Kiểm tra SFX nào có file (cho UI). */
export function availableSfx(): SfxName[] {
  return (Object.entries(SFX_REGISTRY) as [SfxName, string][])
    .filter(([, src]) => src.length > 0)
    .map(([name]) => name);
}
