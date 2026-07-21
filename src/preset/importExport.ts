/**
 * Import / Export preset ST (3.1b.5):
 * - Import: đọc JSON → parse mềm → lưu Dexie (giữ rawJson nguyên văn).
 * - Export round-trip: trả về ĐÚNG JSON gốc đã lưu — mọi field lạ còn nguyên,
 *   mở lại được ở SillyTavern gốc.
 */
import { db, type PresetRecord } from "../state/db";
import { genId } from "../lib/id";
import { parsePreset, type ParsedPresetResult, type STPreset } from "./presetSchema";
import { createLogger } from "../lib/log";

const log = createLogger("preset");

export interface ImportedPreset {
  record: PresetRecord;
  parsed: STPreset;
  warnings: string[];
}

export async function importPresetJson(fileName: string, jsonText: string): Promise<ImportedPreset> {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`File không phải JSON hợp lệ: ${e instanceof Error ? e.message : String(e)}`);
  }

  const { preset, warnings }: ParsedPresetResult = parsePreset(raw);
  const name = fileName.replace(/\.json$/i, "").trim() || "Preset không tên";

  const record: PresetRecord = {
    id: genId("preset"),
    name,
    rawJson: jsonText,
    promptCount: preset.prompts.length,
    importedAt: Date.now(),
  };
  await db.presets.put(record);
  log.info(`Import preset "${name}": ${preset.prompts.length} prompts, ${warnings.length} cảnh báo`);
  warnings.forEach((w) => log.warn(w));

  return { record, parsed: preset, warnings };
}

/** Nạp + parse 1 preset từ Dexie (parse lại từ rawJson — không lưu bản parse để tránh lệch). */
export async function loadPreset(id: string): Promise<ImportedPreset | null> {
  const record = await db.presets.get(id);
  if (!record) return null;
  const { preset, warnings } = parsePreset(JSON.parse(record.rawJson));
  return { record, parsed: preset, warnings };
}

export async function listPresets(): Promise<PresetRecord[]> {
  return db.presets.orderBy("name").toArray();
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

/** Round-trip export: trả nguyên văn JSON gốc (3.1b.5). */
export async function exportPresetRaw(id: string): Promise<{ name: string; json: string } | null> {
  const record = await db.presets.get(id);
  if (!record) return null;
  return { name: record.name, json: record.rawJson };
}
