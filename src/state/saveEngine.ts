/**
 * saveEngine.ts (M15, mục 20) — Lưu/tải/xuất/nhập ván chơi.
 *
 * Luồng save:  mvuStore.stat + chatStore.messages → serialize → Dexie saveSlots
 * Luồng load:  Dexie saveSlots → parse + validate Zod → restoreSnapshot + messages
 * Export:      SaveSlot → JSON Blob → download file
 * Import:      File JSON → validate → ghi Dexie → trả slotId
 *
 * Migration: save cũ thiếu field → merge với makeDefaultState() (prefault).
 * Autosave: slot đặc biệt tên "_autosave", ghi đè mỗi lần.
 */
import { db, type SaveSlotRecord, type SaveSlotMeta } from "./db";
import { useMvuStore } from "./mvuStore";
import { useChatStore, type UiChatMessage } from "./chatStore";
import { StatDataSchema, makeDefaultState, type StatData } from "../mvu/schema";
import { normalizeCalendar } from "../mvu/calendar";
import { normalizeHouseIds } from "../territory/territoryEngine";
import { repairAllHoldings } from "../territory/localMap";
import { genId } from "../lib/id";
import { createLogger } from "../lib/log";

const log = createLogger("state/saveEngine");

/** Phiên bản schema hiện tại — bump khi StatData đổi cấu trúc. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Giới hạn save slot (tránh phình DB). */
export const MAX_SAVE_SLOTS = 20;

const AUTOSAVE_NAME = "_autosave";

// ── Helpers ──

/** Trích metadata từ state hiện tại — hiển thị nhanh trên card. */
function extractMeta(stat: StatData): SaveSlotMeta {
  return {
    characterName: stat["Thông Tin Nhân Vật"]["Họ Tên"] || "Vô Danh",
    house: stat["Thông Tin Nhân Vật"]["Nhà"] || "Không Nhà",
    era: stat["Cài Đặt Ván"]["Thời Kỳ"] || "",
    day: stat["Thế Giới"]["Ngày"],
    month: stat["Thế Giới"]["Tháng"],
    year: stat["Thế Giới"]["Năm"],
    season: stat["Thế Giới"]["Mùa"],
  };
}

/**
 * Migration: merge save cũ thiếu field với default state (prefault), rồi chuẩn
 * hoá lịch — save cũ lưu Ngày = 1-360 trong năm và chưa có Tháng, normalizeCalendar
 * tách lại đúng (Ngày 250 → tháng 9 ngày 10) — và chuẩn hoá dữ liệu bản đồ.
 */
function migrateMapData(state: StatData): void {
  // khoá Nhà đúng định dạng (save cũ ghi "Lannister" thay vì "lannister")
  normalizeHouseIds(state);
  // bố cục Tầng 1: save cũ đặt công trình theo hệ lưới trước đây (mọi thứ dồn
  // quanh ô 750, kích thước 1-2 ô) — dời về ô hợp lệ theo khuôn viên & địa hình
  const moved = repairAllHoldings(state);
  if (moved > 0) log.info(`Migration: bố trí lại ${moved} công trình theo lưới lãnh địa 5 m`);
}

function migrateState(raw: unknown): StatData {
  const defaults = makeDefaultState();

  // Parse qua Zod — nếu thành công, trả luôn
  const result = StatDataSchema.safeParse(raw);
  if (result.success) {
    normalizeCalendar(result.data["Thế Giới"]);
    migrateMapData(result.data);
    return result.data;
  }

  // Nếu Zod thất bại, thử merge thủ công: overlay raw lên default
  if (raw && typeof raw === "object") {
    const merged = deepMerge(defaults, raw as Record<string, unknown>);
    const retry = StatDataSchema.safeParse(merged);
    if (retry.success) {
      normalizeCalendar(retry.data["Thế Giới"]);
      migrateMapData(retry.data);
      log.info("Migration: merge thành công save cũ với default state");
      return retry.data;
    }
  }

  log.warn("Migration: không thể parse save — dùng state mặc định");
  return defaults;
}

/** Deep merge — overlay source lên target, giữ nguyên field target nếu source undefined. */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (sv !== null && typeof sv === "object" && !Array.isArray(sv) &&
        tv !== null && typeof tv === "object" && !Array.isArray(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>);
    } else if (sv !== undefined) {
      result[key] = sv;
    }
  }
  return result;
}

// ── Core API ──

/** Lưu ván vào slot mới hoặc ghi đè slot có sẵn. */
export async function saveGame(slotName: string, overwriteId?: string): Promise<string> {
  const stat = useMvuStore.getState().stat;
  const messages = useChatStore.getState().messages;

  // Kiểm tra giới hạn slot (trừ autosave và overwrite)
  if (!overwriteId && slotName !== AUTOSAVE_NAME) {
    const count = await db.saveSlots.count();
    if (count >= MAX_SAVE_SLOTS) {
      throw new Error(`Đã đạt giới hạn ${MAX_SAVE_SLOTS} save slot. Hãy xoá bớt trước khi lưu mới.`);
    }
  }

  const now = Date.now();
  const id = overwriteId || genId();
  const record: SaveSlotRecord = {
    id,
    slotName,
    mvuStateJson: JSON.stringify(stat),
    messagesJson: JSON.stringify(messages.map(stripStateBefore)),
    meta: extractMeta(stat),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: overwriteId ? (await db.saveSlots.get(overwriteId))?.createdAt ?? now : now,
    updatedAt: now,
  };

  await db.saveSlots.put(record);
  log.info(`Đã lưu: "${slotName}" (id=${id})`);
  return id;
}

/** Cắt stateBefore khỏi messages khi serialize (quá nặng, khôi phục lại từ MVU state). */
function stripStateBefore(msg: UiChatMessage): UiChatMessage {
  if (!msg.stateBefore) return msg;
  const { stateBefore: _, ...rest } = msg;
  return rest;
}

/** Tải ván từ slot → khôi phục mvuStore + chatStore. */
export async function loadGame(slotId: string): Promise<void> {
  const record = await db.saveSlots.get(slotId);
  if (!record) throw new Error(`Không tìm thấy save slot: ${slotId}`);

  // Parse + migrate state
  const rawState = JSON.parse(record.mvuStateJson);
  const state = migrateState(rawState);

  // Parse messages
  let messages: UiChatMessage[] = [];
  try {
    messages = JSON.parse(record.messagesJson);
  } catch {
    log.warn("Không thể parse messages từ save — dùng chat trống");
  }

  // Khôi phục stores
  useMvuStore.getState().restoreSnapshot(state);
  useChatStore.setState({ messages, status: "idle", error: null, draft: "", draftReasoning: "", retryInfo: null });
  log.info(`Đã tải: "${record.slotName}" (ngày ${record.meta.day}/${record.meta.month}/${record.meta.year} AC)`);
}

/** Xoá slot. */
export async function deleteSlot(slotId: string): Promise<void> {
  await db.saveSlots.delete(slotId);
  log.info(`Đã xoá slot: ${slotId}`);
}

/** Liệt kê tất cả save slots, sắp theo thời gian mới nhất. */
export async function listSlots(): Promise<SaveSlotRecord[]> {
  const all = await db.saveSlots.orderBy("updatedAt").reverse().toArray();
  return all;
}

/** Autosave — ghi đè slot "_autosave". */
export async function autoSave(): Promise<string> {
  const existing = await db.saveSlots.where("slotName").equals(AUTOSAVE_NAME).first();
  return saveGame(AUTOSAVE_NAME, existing?.id);
}

/** Lấy autosave slot nếu có. */
export async function getAutoSave(): Promise<SaveSlotRecord | undefined> {
  return db.saveSlots.where("slotName").equals(AUTOSAVE_NAME).first();
}

// ── Export / Import ──

/** Cấu trúc file export JSON. */
export interface ExportedSave {
  _format: "asoiaf-rpg-save";
  _version: number;
  slot: Omit<SaveSlotRecord, "id">;
  /** Base64 portraits liên quan. */
  portraits: { id: string; base64: string; mimeType: string }[];
}

/** Export 1 save slot → JSON Blob (download). */
export async function exportSave(slotId: string): Promise<Blob> {
  const record = await db.saveSlots.get(slotId);
  if (!record) throw new Error(`Không tìm thấy save slot: ${slotId}`);

  // Thu thập portraits
  const allPortraits = await db.portraits.toArray();
  const portraitExports: ExportedSave["portraits"] = [];
  for (const p of allPortraits) {
    try {
      const buf = await p.blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      portraitExports.push({ id: p.id, base64, mimeType: p.blob.type || "image/webp" });
    } catch {
      log.warn(`Bỏ qua portrait ${p.id} khi export`);
    }
  }

  const { id: _, ...slotNoId } = record;
  const exported: ExportedSave = {
    _format: "asoiaf-rpg-save",
    _version: CURRENT_SCHEMA_VERSION,
    slot: slotNoId,
    portraits: portraitExports,
  };

  return new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
}

/** Import file JSON → validate → ghi DB → trả về slotId. */
export async function importSave(file: File | Blob): Promise<string> {
  const text = await file.text();
  let data: ExportedSave;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File không phải JSON hợp lệ.");
  }

  // Validate format
  if (data._format !== "asoiaf-rpg-save") {
    throw new Error("File không phải save của ASOIAF RPG.");
  }

  // Validate state có parse được không
  const rawState = JSON.parse(data.slot.mvuStateJson);
  migrateState(rawState); // sẽ throw nếu hoàn toàn không hợp lệ — nhưng migrateState trả default thay vì throw

  // Ghi slot
  const id = genId();
  const now = Date.now();
  const record: SaveSlotRecord = {
    id,
    slotName: data.slot.slotName || `Import ${new Date().toLocaleDateString("vi-VN")}`,
    mvuStateJson: data.slot.mvuStateJson,
    messagesJson: data.slot.messagesJson || "[]",
    meta: data.slot.meta,
    schemaVersion: data._version,
    createdAt: now,
    updatedAt: now,
  };
  await db.saveSlots.put(record);

  // Ghi portraits
  for (const p of data.portraits ?? []) {
    try {
      const binary = atob(p.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: p.mimeType });
      await db.portraits.put({ id: p.id, blob, createdAt: now });
    } catch {
      log.warn(`Bỏ qua portrait ${p.id} khi import`);
    }
  }

  log.info(`Import thành công: "${record.slotName}" (id=${id})`);
  return id;
}

/** Xoá toàn bộ dữ liệu — cần xác nhận trước khi gọi! */
export async function clearAllData(): Promise<void> {
  await db.saveSlots.clear();
  await db.chapterSummaries.clear();
  await db.portraits.clear();
  log.info("Đã xoá toàn bộ dữ liệu lưu trữ");
}

/** Ước tính dung lượng DB (bytes). */
export async function estimateDbSize(): Promise<number> {
  let total = 0;
  const slots = await db.saveSlots.toArray();
  for (const s of slots) {
    total += s.mvuStateJson.length + s.messagesJson.length;
  }
  const portraits = await db.portraits.toArray();
  for (const p of portraits) {
    total += p.blob.size;
  }
  return total;
}

/** Tải file xuống trình duyệt. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
