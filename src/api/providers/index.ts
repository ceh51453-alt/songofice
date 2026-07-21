import type { ProviderKind } from "../../types/connection";
import type { ProviderAdapter } from "./types";
import { openaiAdapter } from "./openai";
import { anthropicAdapter } from "./anthropic";
import { googleAdapter } from "./google";

/** "custom" = OpenAI-compatible với label riêng (endpoint tự host, proxy...). */
const customAdapter: ProviderAdapter = {
  ...openaiAdapter,
  kind: "custom",
  label: "Custom (OpenAI-compatible)",
  defaultBaseUrl: "",
};

const registry: Record<ProviderKind, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  custom: customAdapter,
};

export function getAdapter(kind: ProviderKind): ProviderAdapter {
  return registry[kind];
}

export const ALL_PROVIDERS: ProviderAdapter[] = Object.values(registry);
