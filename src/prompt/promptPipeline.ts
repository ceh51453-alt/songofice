/**
 * Pipeline ghép prompt cấp app — cầu nối giữa stores và buildFromPreset:
 * - Lore engine chạy TRƯỚC (trigger + EJS async, mục 4/5.5b) → điền marker
 *   worldInfoBefore/After + injection atDepth.
 * - Có preset active → dựng theo prompt_order (3.1b.4) + merge sampling preset.
 * - Không preset → fallback: lore before/after làm system message + history
 *   cắt theo ngân sách.
 * Dùng bởi chatStore (gửi thật) và Prompt Inspector (dry-run). ASYNC vì EJS.
 */
import type { ApiChatMessage, ConnectionProfile, ModelParams } from "../types/connection";
import { buildFromPreset, injectIntoHistory, type BuildResult, type BlockTrace } from "../preset/buildFromPreset";
import { mergePresetParams } from "../preset/mergeParams";
import { emptyMarkerSources } from "../preset/markers";
import { getLoreForBuild } from "../lorebook/loreProvider";
import { makeEmptyMacroContext, type MacroContext } from "./macroContext";
import { registerBuiltinMacros } from "./macros";
import { useVariablesStore, addValues } from "../state/variablesStore";
import { usePresetStore } from "../state/presetStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore, currentSeedInfo } from "../state/mvuStore";
import { useCombatStore } from "../state/combatStore";
import { renderStateForAI } from "../mvu/stateRenderer";
import { renderTablesForAI } from "../mvu/tableBridge";
import { MVU_UPDATE_PROMPT, NARRATIVE_TAGS_PROMPT, BATTLE_NARRATION_PROMPT, SQL_UPDATE_PROMPT, DICE_ROLL_PROMPT, ANTI_OMNISCIENCE_PROMPT, DRAGON_MECHANICS_PROMPT, FEUDAL_WARFARE_PROMPT, DIPLOMACY_INTRIGUE_PROMPT, WORLD_ENGINE_PROMPT, COT_INSTRUCTION_PROMPT, DEATH_AND_DOOM_PROMPT, geographyContextPrompt } from "../mvu/mvuPrompt";
import { useExtraModelStore } from "../state/extraModelStore";
import { streamRng } from "../probability/rng";
import { countTokens } from "./tokenizer";
import { buildStoryDrivePrompt } from "../event/storyDriveEngine";
import { buildFeudalHierarchyPrompt } from "../strategy/feudalHierarchy";
import { outputLanguageInstruction } from "../i18n";
import { useSettingsStore } from "../state/settingsStore";

/**
 * Bridge biến 2 tầng (3.1b.3 — "biến preset và stat_data là CÙNG MỘT store"):
 * key bắt đầu "stat_data." → đọc/ghi MVU store; còn lại → variables store.
 */
function makeAppMacroContext(history: ApiChatMessage[]): MacroContext {
  registerBuiltinMacros();
  const vars = useVariablesStore.getState();
  const mvu = useMvuStore.getState();
  const { rootSeed, tick } = currentSeedInfo();
  const playerName = mvu.stat["Thông Tin Nhân Vật"]["Họ Tên"];

  const getChat = (key: string): string => {
    if (key.startsWith("stat_data.")) {
      const v = mvu.getByPath(key);
      return v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    }
    return vars.getChat(key);
  };
  const setChat = (key: string, value: string): void => {
    if (key.startsWith("stat_data.")) {
      mvu.setByPath(key, value);
      return;
    }
    vars.setChat(key, value);
  };

  return makeEmptyMacroContext({
    // char/description/scenario... — M5 (character card) sẽ điền
    user: playerName !== "Vô Danh" ? playerName : "Người Chơi",
    lastMessage: history.length > 0 ? history[history.length - 1].content : "",
    lastUserMessage: [...history].reverse().find((m) => m.role === "user")?.content ?? "",
    lastCharMessage: [...history].reverse().find((m) => m.role === "assistant")?.content ?? "",
    // RNG seedable (5bis.1): stream "macro", tái lập theo (seed gốc, turn)
    rng: streamRng(rootSeed, tick, "macro"),
    vars: {
      getChat,
      setChat,
      addChat: (key, delta) => {
        if (key.startsWith("stat_data.")) {
          setChat(key, addValues(getChat(key), delta));
          return;
        }
        vars.addChat(key, delta);
      },
      getGlobal: vars.getGlobal,
      setGlobal: vars.setGlobal,
      addGlobal: vars.addGlobal,
    },
  });
}

/** Lớp prompt riêng của app (3.1b.5) — ghép CÙNG pipeline, KHÔNG sửa preset người dùng. */
/** Khối system thực sự được ghép trước mỗi yêu cầu tới AI. */
export function appLayerMessages(history: ApiChatMessage[] = []): ApiChatMessage[] {
  const stat = useMvuStore.getState().stat;
  const engine = useExtraModelStore.getState().stateEngine;
  const updatePrompt = engine === "auto-database" ? SQL_UPDATE_PROMPT : MVU_UPDATE_PROMPT;
  const narrativeState = renderStateForAI(stat);
  const stateBlock = engine === "auto-database"
    ? `${renderTablesForAI(stat)}

【BỐI CẢNH CHIẾN LƯỢC CHỈ ĐỌC — VẪN LÀ SỰ THẬT HIỆN TẠI】
Khối này bổ sung quân sự, tài chính, lãnh địa, ngoại giao, mưu đồ và ký ức NPC cho lời kể. Chỉ dùng SQL với các bảng có DDL ở trên; các hệ không có bảng SQL được cập nhật bằng thẻ engine tương ứng, không tự bịa tên bảng.

${narrativeState}`
    : narrativeState;

  // GĐ2: Inject offscreen news vào world engine prompt
  const offscreenNews = (stat["Thế Giới"] as Record<string, unknown>)["_Tin Nóng Off-screen"] as string | undefined;
  const worldPrompt = WORLD_ENGINE_PROMPT.replace(
    "{{offscreenNews}}",
    offscreenNews ? `**Tin Off-screen:** ${offscreenNews}` : "_Không có tin off-screen mới._",
  );

  const msgs: ApiChatMessage[] = [
    { role: "system", content: outputLanguageInstruction(useSettingsStore.getState().language) },
    { role: "system", content: updatePrompt },
    { role: "system", content: NARRATIVE_TAGS_PROMPT },
    { role: "system", content: DICE_ROLL_PROMPT },
    { role: "system", content: ANTI_OMNISCIENCE_PROMPT },
    { role: "system", content: DRAGON_MECHANICS_PROMPT },
    { role: "system", content: buildFeudalHierarchyPrompt(stat) },
    { role: "system", content: `${geographyContextPrompt(stat)}\n\n${FEUDAL_WARFARE_PROMPT}` }, // M19: luật quân sự theo chính thể
    { role: "system", content: DIPLOMACY_INTRIGUE_PROMPT }, // M20: ngoại giao & bóng tối
    { role: "system", content: buildStoryDrivePrompt(stat, history) }, // nhịp cốt truyện cân bằng theo xuất thân
    { role: "system", content: worldPrompt },           // GĐ2: World Background Engine
    { role: "system", content: COT_INSTRUCTION_PROMPT }, // GĐ2: CoT 4-bước
    { role: "system", content: DEATH_AND_DOOM_PROMPT }, // Hệ thống Tử vong
    { role: "system", content: stateBlock },
  ];
  // trận vừa phân giải xong → bút pháp 7.11 + khối báo cáo engine điền (7.10)
  const reportBlock = useCombatStore.getState().reportBlock;
  if (reportBlock) {
    msgs.push({ role: "system", content: `${BATTLE_NARRATION_PROMPT}\n\n## KHỐI BÁO CÁO ĐÃ CHỐT (chèn nguyên văn):\n${reportBlock}` });
  }
  return msgs;
}

export interface PipelineResult extends BuildResult {
  /** Params sau khi merge sampling preset (nếu có). */
  params: ModelParams;
  usingPreset: boolean;
  presetName: string | null;
}

/** Fallback không preset: lore bọc quanh + history cắt theo max_context (3.3 bước 4). */
function buildBare(
  params: ModelParams,
  lore: { before: string; after: string; injected: ApiChatMessage[] },
): BuildResult {
  const traces: BlockTrace[] = [];
  const head: ApiChatMessage[] = [];
  if (lore.before.trim()) head.push({ role: "system", content: lore.before });
  if (lore.after.trim()) head.push({ role: "system", content: lore.after });
  const headTokens = head.reduce((s, m) => s + countTokens(m.content) + 4, 0);

  const budgetMax = params.max_context - params.max_tokens - headTokens;
  const included: ApiChatMessage[] = [];
  let used = 0;
  let dropped = 0;
  for (let i = lore.injected.length - 1; i >= 0; i--) {
    const cost = countTokens(lore.injected[i].content) + 4;
    if (used + cost <= budgetMax || included.length === 0) {
      included.unshift(lore.injected[i]);
      used += cost;
    } else {
      dropped = i + 1;
      break;
    }
  }
  const warnings = dropped > 0 ? [`Ngân sách context: đã cắt ${dropped} tin nhắn cũ nhất`] : [];
  if (head.length > 0) {
    traces.push({
      identifier: "lore", name: "Lore (không preset)", role: "system", kind: "marker",
      tokens: headTokens, content: [lore.before, lore.after].filter(Boolean).join("\n---\n"), messageIndex: 0,
    });
  }
  traces.push({
    identifier: "chatHistory", name: "Chat History (không preset)", role: "system", kind: "history",
    tokens: used, content: `${included.length} tin nhắn (bỏ ${dropped})`, messageIndex: head.length,
  });
  return {
    messages: [...head, ...included],
    traces,
    warnings,
    totalTokens: headTokens + used,
    historyIncluded: included.length,
    historyDropped: dropped,
    overBudget: used > budgetMax,
  };
}

/**
 * Dựng messages + params cho một lần gọi AI (hoặc dry-run cho Inspector).
 * Side-effect duy nhất: macro setvar ghi biến (đúng thiết kế 3.1b.3).
 */
export async function buildPipeline(history: ApiChatMessage[]): Promise<PipelineResult> {
  const profile: ConnectionProfile = useConnectionStore.getState().activeProfile();
  const presetState = usePresetStore.getState();
  const preset = presetState.activePreset;
  const params = preset ? mergePresetParams(profile.params, preset) : profile.params;

  // ---- Lore engine (mục 4): trigger + EJS — chạy trước khi ghép prompt ----
  const lore = await getLoreForBuild(history, params.max_context);

  // lớp engine của app: luật cập nhật bảng (5.4b) + thẻ (5.6) + STATE render (5.7.3)
  // + báo cáo trận (7.10/7.11) nếu vừa phân giải
  const APP_LAYER_LABELS = [
    ["(app) output_language", "Ngôn ngữ đầu ra"],
    ["(app) mvu_update", "Luật cập nhật bảng (5.4b)"],
    ["(app) narrative_tags", "Thẻ ngữ nghĩa (5.6)"],
    ["(app) dice_roll", "Luật gieo xúc xắc"],
    ["(app) anti_omniscience", "Chống toàn tri (5.8)"],
    ["(app) dragon_mechanics", "Cơ chế rồng"],
    ["(app) feudal_hierarchy", "Phân cấp phong kiến"],
    ["(app) polity_warfare", "Địa lý & luật quân sự theo chính thể (M19)"],
    ["(app) diplomacy_intrigue", "Luật ngoại giao & mưu đồ (M20)"],
    ["(app) story_drive", "Động lực cốt truyện theo xuất thân"],
    ["(app) world_engine", "Thế Giới Sống (GĐ2)"],
    ["(app) cot_instruction", "Suy Luận CoT (GĐ2)"],
    ["(app) death_doom", "Hệ Thống Tử Vong"],
    ["(app) state_render", "Bảng Trạng Thái render (5.7.3)"],
    ["(app) battle_report", "Báo cáo trận + bút pháp (7.10/7.11)"],
  ];
  const appLayer = appLayerMessages(history);
  const appTraces: BlockTrace[] = appLayer.map((m, i) => ({
    identifier: APP_LAYER_LABELS[i]?.[0] ?? `(app) block_${i}`,
    name: APP_LAYER_LABELS[i]?.[1] ?? `Khối app ${i}`,
    role: "system", kind: "prompt", tokens: countTokens(m.content), content: m.content, messageIndex: i,
  }));
  const appTokens = appTraces.reduce((s, t) => s + t.tokens, 0);

  if (!preset) {
    const injected = injectIntoHistory(history, lore.depthInjections);
    const bare = buildBare(
      { ...params, max_context: Math.max(params.max_tokens + 1, params.max_context - appTokens) },
      { before: lore.before, after: lore.after, injected },
    );
    bare.warnings.push(...lore.warnings);
    const messages = [...appLayer, ...bare.messages];
    bare.traces.forEach((t) => {
      if (t.messageIndex !== null) t.messageIndex += appLayer.length;
    });
    return {
      ...bare,
      messages,
      traces: [...appTraces, ...bare.traces],
      totalTokens: bare.totalTokens + appTraces.reduce((s, t) => s + t.tokens, 0),
      params,
      usingPreset: false,
      presetName: null,
    };
  }

  const ctx = makeAppMacroContext(history);
  const result = buildFromPreset(preset, {
    ctx,
    sources: emptyMarkerSources({
      worldInfoBefore: () => lore.before,
      worldInfoAfter: () => lore.after,
      // charDescription/persona/scenario... — M5 (character card) cắm vào đây
    }),
    history,
    maxContext: params.max_context - appTokens, // chừa chỗ cho lớp app
    maxOutputTokens: params.max_tokens,
    extraInjections: lore.depthInjections,
  });
  result.warnings.push(...lore.warnings);
  const messages = [...appLayer, ...result.messages];
  result.traces.forEach((t) => {
    if (t.messageIndex !== null) t.messageIndex += appLayer.length;
  });
  const activeRecord = presetState.records.find((r) => r.id === presetState.activePresetId);
  return {
    ...result,
    messages,
    traces: [...appTraces, ...result.traces],
    totalTokens: result.totalTokens + appTokens,
    params,
    usingPreset: true,
    presetName: activeRecord?.name ?? "(preset)",
  };
}
