/**
 * Zod schema validate preset ST Chat Completion khi import (mục 3.1b.1).
 * Nguyên tắc: FAIL MỀM — field thiếu → prefault; field lạ → passthrough
 * (giữ nguyên để round-trip export không mất); preset lỗi một phần → nạp
 * phần hợp lệ + cảnh báo, KHÔNG crash.
 */
import { z } from "zod";

import { z } from "zod";

export const STRegexScriptSchema = z
  .object({
    id: z.string().optional(),
    scriptName: z.string().prefault("Regex Script"),
    disabled: z.boolean().prefault(false),
    findRegex: z.string().prefault(""),
    replaceString: z.string().prefault(""),
    placement: z.array(z.coerce.number().int()).prefault([]),
    minDepth: z.number().nullable().optional(),
    maxDepth: z.number().nullable().optional(),
    markdownOnly: z.boolean().prefault(false),
    promptOnly: z.boolean().prefault(false),
  })
  .passthrough();

export const STPromptSchema = z
  .object({
    identifier: z.string(), // UUID hoặc tên marker ("main", "chatHistory"...)
    name: z.string().prefault(""),
    content: z.string().prefault(""), // chứa macro {{...}}
    role: z.enum(["system", "user", "assistant"]).prefault("system"),
    enabled: z.boolean().prefault(true),
    marker: z.boolean().prefault(false), // TRUE = placeholder hệ thống (3.1b.2)
    system_prompt: z.boolean().prefault(false),
    injection_position: z
      .union([z.literal(0), z.literal(1), z.null()])
      .prefault(null),
    injection_depth: z.coerce.number().int().prefault(4),
    injection_order: z.coerce.number().int().prefault(100),
    forbid_overrides: z.boolean().prefault(false),
  })
  .passthrough(); // giữ field lạ để round-trip export không mất

export const STPromptOrderEntrySchema = z
  .object({
    character_id: z.coerce.number().optional(),
    order: z
      .array(
        z
          .object({
            identifier: z.string(),
            enabled: z.boolean().prefault(true),
          })
          .passthrough(),
      )
      .prefault([]),
  })
  .passthrough();

export const STPresetSchema = z
  .object({
    prompts: z.array(STPromptSchema).prefault([]),
    prompt_order: z.array(STPromptOrderEntrySchema).prefault([]),
    // tham số sampling (map sang cấu hình API mục 2):
    temperature: z.coerce.number().optional(),
    top_p: z.coerce.number().optional(),
    top_k: z.coerce.number().optional(),
    frequency_penalty: z.coerce.number().optional(),
    presence_penalty: z.coerce.number().optional(),
    min_p: z.coerce.number().optional(),
    top_a: z.coerce.number().optional(),
    repetition_penalty: z.coerce.number().optional(),
    openai_max_tokens: z.coerce.number().optional(),
    openai_max_context: z.coerce.number().optional(),
    assistant_prefill: z.string().optional(),
    wi_format: z.string().optional(),
    scenario_format: z.string().optional(),
    personality_format: z.string().optional(),
    extensions: z
      .object({
        regex_scripts: z.array(STRegexScriptSchema).prefault([]),
      })
      .passthrough()
      .optional(),
    // ... field khác giữ qua passthrough
  })
  .passthrough();

export type STRegexScript = z.infer<typeof STRegexScriptSchema>;

export type STPrompt = z.infer<typeof STPromptSchema>;
export type STPreset = z.infer<typeof STPresetSchema>;

/** Kết quả import: preset đã parse + cảnh báo (không bao giờ throw vì dữ liệu). */
export interface ParsedPresetResult {
  preset: STPreset;
  warnings: string[];
}

/**
 * Parse mềm: prompt lỗi bị loại từng cái (có cảnh báo) thay vì hỏng cả preset.
 */
export function parsePreset(raw: unknown): ParsedPresetResult {
  const warnings: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      preset: STPresetSchema.parse({}),
      warnings: ["File không phải object JSON hợp lệ — preset rỗng được tạo"],
    };
  }

  const obj = { ...(raw as Record<string, unknown>) };

  // Lọc mềm từng prompt trước khi parse tổng
  if (Array.isArray(obj.prompts)) {
    const kept: unknown[] = [];
    (obj.prompts as unknown[]).forEach((p, i) => {
      const r = STPromptSchema.safeParse(p);
      if (r.success) kept.push(r.data);
      else {
        const name =
          typeof p === "object" && p !== null && "name" in p ? String((p as { name?: unknown }).name) : `#${i}`;
        warnings.push(`Bỏ qua prompt lỗi "${name}": ${r.error.issues[0]?.message ?? "không rõ"}`);
      }
    });
    obj.prompts = kept;
  }

  const result = STPresetSchema.safeParse(obj);
  if (result.success) return { preset: result.data, warnings };

  // safeParse tổng thất bại (hiếm — vd prompt_order sai kiểu): vá field hỏng rồi thử lại
  warnings.push(`Preset có field cấu trúc lỗi: ${result.error.issues[0]?.path.join(".") ?? "?"} — dùng giá trị mặc định`);
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) delete obj[String(issue.path[0])];
  }
  const retry = STPresetSchema.safeParse(obj);
  if (retry.success) return { preset: retry.data, warnings };

  warnings.push("Không thể phục hồi cấu trúc preset — chỉ giữ prompts hợp lệ");
  return {
    preset: STPresetSchema.parse({ prompts: obj.prompts ?? [] }),
    warnings,
  };
}

/**
 * Chọn entry prompt_order đang dùng: ST lưu theo character_id, dummy 100001
 * là "nhân vật mặc định" trong preset chia sẻ — ưu tiên nó, fallback entry đầu.
 */
export function pickPromptOrder(preset: STPreset): { identifier: string; enabled: boolean }[] {
  const entries = preset.prompt_order;
  if (entries.length === 0) {
    // không có prompt_order → dùng thứ tự prompts[] như ST fallback
    return preset.prompts.map((p) => ({ identifier: p.identifier, enabled: p.enabled }));
  }
  const chosen = entries.find((e) => e.character_id === 100001) ?? entries[0];
  return chosen.order.map((o) => ({ identifier: o.identifier, enabled: o.enabled }));
}
