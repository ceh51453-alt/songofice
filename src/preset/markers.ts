/**
 * 8 marker placeholder hệ thống của preset ST (3.1b.2) — engine gặp identifier
 * marker thì thay bằng nội dung động do app dựng:
 *   worldInfoBefore/After ← lore engine (M3)
 *   charDescription/charPersonality/personaDescription/scenario/dialogueExamples ← character card/persona/Era (M5)
 *   chatHistory ← lịch sử chat theo ngân sách (16bis.5 — M2 dùng budget cutter cơ bản)
 */
export const MARKER_IDS = [
  "worldInfoBefore",
  "worldInfoAfter",
  "charDescription",
  "charPersonality",
  "personaDescription",
  "scenario",
  "dialogueExamples",
  "chatHistory",
] as const;

export type MarkerId = (typeof MARKER_IDS)[number];

export function isMarkerId(id: string): id is MarkerId {
  return (MARKER_IDS as readonly string[]).includes(id);
}

/**
 * Nguồn nội dung động điền vào 7 marker DẠNG TEXT — interface để các hệ sau
 * cắm vào: M3 cắm lore engine (worldInfo*), M5 cắm character card/persona/Era.
 * Riêng marker `chatHistory` đặc biệt (mảng message + ngân sách token) — do
 * buildFromPreset xử lý trực tiếp, không qua interface này.
 */
export interface MarkerSources {
  /** Lore chèn trước/sau char (mục 4) — M2: mặc định rỗng. */
  worldInfoBefore: () => string;
  worldInfoAfter: () => string;
  charDescription: () => string;
  charPersonality: () => string;
  personaDescription: () => string;
  scenario: () => string;
  dialogueExamples: () => string;
}

export function emptyMarkerSources(partial?: Partial<MarkerSources>): MarkerSources {
  return {
    worldInfoBefore: () => "",
    worldInfoAfter: () => "",
    charDescription: () => "",
    charPersonality: () => "",
    personaDescription: () => "",
    scenario: () => "",
    dialogueExamples: () => "",
    ...partial,
  };
}
