/**
 * tracks.ts (M16, 18.2) — Registry nhạc nền theo mood.
 *
 * Nguồn nhạc: Google Drive streaming (tham khảo từ Đế Quốc La Mã Thần Thánh).
 * Engine đọc runtime, chỉ cần khai báo track + mood ở đây.
 */

export type MoodTag = "peace" | "court" | "intrigue" | "war" | "tragedy" | "winter" | "victory";

export interface MusicTrack {
  id: string;
  title: string;
  /** URL streaming hoặc đường dẫn file local. Rỗng = chưa có nhạc. */
  src: string;
  mood: MoodTag;
}

/** Helper: Google Drive direct stream URL. */
function gdrive(fileId: string): string {
  return `https://docs.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Danh sách nhạc — thêm track mới chỉ cần push vào đây.
 * Engine đọc runtime, không cần sửa code engine.
 *
 * Mapping mood cho thế giới ASOIAF:
 *   peace    — cảnh yên bình, xây dựng, đời thường
 *   court    — triều đình, ngoại giao, mưu lược chính trị
 *   intrigue — âm mưu, đối đầu ngầm, căng thẳng
 *   war      — chiến trận, hành quân, đụng độ
 *   tragedy  — bi kịch, mất mát, đau thương
 *   winter   — mùa đông, White Walkers, lạnh lẽo
 *   victory  — chiến thắng, vinh quang, đăng quang
 */
export const MUSIC_TRACKS: MusicTrack[] = [
  // ── peace — yên bình, xây dựng ──
  { id: "peace-stonemason",     title: "Thợ Đá",              src: gdrive("12EcMyayHbf3"),  mood: "peace" },
  { id: "peace-paradise",       title: "Tìm Kiếm Thiên Đường", src: gdrive("14jxDfx8ru5X"),  mood: "peace" },
  { id: "peace-thine-eyes",     title: "Ngước Mắt Lên",       src: gdrive("17CZzDui90bE"),  mood: "peace" },

  // ── court — triều đình, phát triển, ngoại giao ──
  { id: "court-crescendo",      title: "Thợ Đá Tăng Dần",     src: gdrive("1lueGUnVYmeX"),  mood: "court" },
  { id: "court-yearning",       title: "Nỗi Nhớ Nhung",       src: gdrive("1hz64suggEUo"),  mood: "court" },

  // ── intrigue — âm mưu, đối đầu ──
  { id: "intrigue-duke-death",   title: "Công Tước Tử Thần",   src: gdrive("1dwW3UcbNFdy"),  mood: "intrigue" },

  // ── war — chiến trận, hành quân ──
  { id: "war-cannons",          title: "Đại Bác, Trống Và Thép", src: gdrive("1adLKTWp40Sa"), mood: "war" },
  { id: "war-glory-road",       title: "Đường Tới Vinh Quang",  src: gdrive("13dtlaMXgX81"), mood: "war" },

  // ── tragedy — bi kịch, đau thương ──
  { id: "tragedy-scarlet",      title: "Đỏ Thắm",             src: gdrive("15n07viiHXe2"),  mood: "tragedy" },
  { id: "tragedy-devastation",  title: "Tàn Phá",             src: gdrive("13rjOHXAUuyZ"),  mood: "tragedy" },

  // ── winter — mùa đông, lạnh lẽo ──
  // (Chưa có track riêng — fallback sang peace hoặc tragedy tùy context)

  // ── victory — chiến thắng, đăng quang ──
  { id: "victory-legend",       title: "Trở Thành Huyền Thoại", src: gdrive("1fTmYCHO6KOq"), mood: "victory" },
  { id: "victory-nightfall",    title: "Đêm Xuống Thành Phố",  src: gdrive("1b99iRszyQeC"), mood: "victory" },
];

/** Lọc track theo mood, trả mảng (có thể rỗng). */
export function tracksByMood(mood: MoodTag): MusicTrack[] {
  return MUSIC_TRACKS.filter((t) => t.mood === mood && t.src);
}

/** Tất cả mood có sẵn track. */
export function availableMoods(): MoodTag[] {
  const moods = new Set(MUSIC_TRACKS.filter((t) => t.src).map((t) => t.mood));
  return [...moods];
}
