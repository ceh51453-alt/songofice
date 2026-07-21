/**
 * Sampling của preset ST override tham số profile (3.1b.1) — chỉ những field
 * preset có định nghĩa; tham số provider không hỗ trợ sẽ bị adapter bỏ qua.
 */
import type { ModelParams } from "../types/connection";
import type { STPreset } from "./presetSchema";

export function mergePresetParams(params: ModelParams, preset: STPreset): ModelParams {
  const merged = { ...params };
  if (preset.temperature !== undefined) merged.temperature = preset.temperature;
  if (preset.top_p !== undefined) merged.top_p = preset.top_p;
  if (preset.top_k !== undefined) merged.top_k = preset.top_k;
  if (preset.min_p !== undefined) merged.min_p = preset.min_p;
  if (preset.top_a !== undefined) merged.top_a = preset.top_a;
  if (preset.frequency_penalty !== undefined) merged.frequency_penalty = preset.frequency_penalty;
  if (preset.presence_penalty !== undefined) merged.presence_penalty = preset.presence_penalty;
  if (preset.repetition_penalty !== undefined) merged.repetition_penalty = preset.repetition_penalty;
  if (preset.openai_max_tokens !== undefined) merged.max_tokens = preset.openai_max_tokens;
  if (preset.openai_max_context !== undefined) merged.max_context = preset.openai_max_context;
  return merged;
}
