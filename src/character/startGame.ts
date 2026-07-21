/**
 * startGame (8.6) — pattern "ghi lore trước, đẩy tin nhắn mở, tự trigger AI":
 * người chơi KHÔNG phải gõ tin nhắn đầu tiên.
 */
import type { StatData } from "../mvu/schema";
import type { EraData, StartingHook } from "../content/westeros/eras";
import { buildInitLoreEntry, buildOpeningMessage } from "./characterInit";
import { useMvuStore } from "../state/mvuStore";
import { useLoreStore } from "../state/loreStore";
import { useVariablesStore } from "../state/variablesStore";
import { useChatStore } from "../state/chatStore";
import { createLogger } from "../lib/log";

const log = createLogger("startGame");

export async function startNewGame(
  state: StatData,
  era: EraData,
  hook: StartingHook | null,
  crisisDesc: string | null,
): Promise<void> {
  // 1-2. lore entry khởi tạo (constant, before)
  const lore = useLoreStore.getState();
  lore.clearSessionEntries();
  lore.addSessionEntry(buildInitLoreEntry(state, era, hook, crisisDesc));

  // 5. initvar — nạp state đầy đủ (qua schema validate)
  useVariablesStore.getState().clearChatVars();
  useMvuStore.getState().restoreSnapshot(state);

  // 3-4 + 6. tin nhắn mở đầu + trigger AI ngay
  const chat = useChatStore.getState();
  chat.clearChat();
  log.info("Ván mới bắt đầu", { era: era.id, hook: hook?.id });
  await chat.send(buildOpeningMessage(state, era, hook, crisisDesc));
}
