/**
 * Dexie / IndexedDB (mục 20 — mở rộng dần theo milestone).
 * v1: bảng presets (M2). v2: + lorebooks (M3). v3: + portraits (M13).
 * v4: + saveSlots + chapterSummaries (M15).
 */
import Dexie, { type EntityTable } from "dexie";

export interface PresetRecord {
  id: string;
  name: string;
  /** JSON gốc nguyên văn — nguồn chân lý cho round-trip export (3.1b.5). */
  rawJson: string;
  promptCount: number;
  importedAt: number;
}

export interface LorebookRecord {
  id: string;
  name: string;
  /** JSON gốc nguyên văn (parse lại khi nạp — không lưu bản parse). */
  rawJson: string;
  entryCount: number;
  /** Nguồn đang bật — tắt thì không đưa vào trigger engine. */
  enabled: boolean;
  importedAt: number;
}

export interface PortraitRecord {
  id: string;
  /** ảnh đã resize (5.1c) — Blob, không base64 trong state. */
  blob: Blob;
  createdAt: number;
}

// ── M15: Save/Load (mục 20) ──

/** Metadata tóm lược hiển trên card save slot. */
export interface SaveSlotMeta {
  characterName: string;
  house: string;
  era: string;
  day: number;
  month: number;
  year: number;
  season: string;
}

export interface SaveSlotRecord {
  id: string;
  slotName: string;
  /** JSON string của StatData (snapshot toàn bộ state). */
  mvuStateJson: string;
  /** JSON string của UiChatMessage[] (lịch sử chat). */
  messagesJson: string;
  /** Metadata hiển nhanh, không cần parse JSON. */
  meta: SaveSlotMeta;
  /** Phiên bản schema — dùng để migration khi load save cũ. */
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChapterSummaryRecord {
  id: string;
  chatId: string;
  /** tier 1 = tóm tắt cấp 1, tier 2 = gộp cấp 2 (16bis.2). */
  tier: 1 | 2;
  turnRangeStart: number;
  turnRangeEnd: number;
  yearInStory: number;
  text: string;
  createdAt: number;
}

export const db = new Dexie("asoiaf_rpg_db") as Dexie & {
  presets: EntityTable<PresetRecord, "id">;
  lorebooks: EntityTable<LorebookRecord, "id">;
  portraits: EntityTable<PortraitRecord, "id">;
  saveSlots: EntityTable<SaveSlotRecord, "id">;
  chapterSummaries: EntityTable<ChapterSummaryRecord, "id">;
};

db.version(1).stores({
  presets: "id, name",
});
db.version(2).stores({
  presets: "id, name",
  lorebooks: "id, name",
});
db.version(3).stores({
  presets: "id, name",
  lorebooks: "id, name",
  portraits: "id",
});
db.version(4).stores({
  presets: "id, name",
  lorebooks: "id, name",
  portraits: "id",
  saveSlots: "id, slotName, createdAt, updatedAt",
  chapterSummaries: "id, chatId, turnRangeStart, tier",
});

/** Lưu ảnh chân dung (resize về ≤512px nếu là ảnh lớn — 5.1c). */
export async function savePortrait(id: string, file: Blob): Promise<string> {
  let blob = file;
  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      const max = 512;
      if (bmp.width > max || bmp.height > max) {
        const scale = Math.min(max / bmp.width, max / bmp.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob null"))), "image/webp", 0.85),
        );
      }
      bmp.close();
    }
  } catch {
    /* giữ nguyên file gốc nếu resize thất bại */
  }
  await db.portraits.put({ id, blob, createdAt: Date.now() });
  return id;
}

export async function loadPortraitUrl(id: string): Promise<string | null> {
  const rec = await db.portraits.get(id);
  return rec ? URL.createObjectURL(rec.blob) : null;
}
