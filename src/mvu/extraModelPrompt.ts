/**
 * Prompt builder cho Extra Model — tham khảo MagVarUpdate extra_model_task.txt.
 * Extra model nhận: trạng thái hiện tại (compact) + raw output AI chính,
 * và chỉ trả JSON mvu_update HOẶC SQL tableEdit — KHÔNG kể chuyện.
 * Format phụ thuộc vào stateEngine setting.
 */
import type { StatData } from "./schema";
import type { ApiChatMessage } from "../types/connection";
import { renderTablesForAI } from "./tableBridge";
import { useExtraModelStore } from "../state/extraModelStore";

const EXTRA_MODEL_SYSTEM_JSON = `You are a state-analysis engine for a Westeros RPG game.
Your ONLY job is to read the AI narrator's latest reply and determine what game state variables changed.

You receive:
1. The CURRENT game state (JSON)
2. The narrator's LATEST reply text

You must output a SINGLE JSON block with the changes, using this exact format:
<UpdateVariable>
{
  "mvu_update": [
    { "op": "replace"|"delta"|"insert"|"remove", "path": "stat_data.<path>", "value": <value> }
  ]
}
</UpdateVariable>

RULES:
- "replace" = set a value (overwrite or create new). Use for: position changes, title changes, setting favorability to a specific value, adding new NPCs/items.
- "delta" = add/subtract a number (use negative to subtract). Use for: HP loss, gold gain, favorability gradual changes.
- "insert" = append to an array. Use for: new memories, new promises.
- "remove" = delete a field/element. Use for: used up items, NPC leaves.
- Path uses dot notation: "stat_data.Chỉ Số Sinh Tồn.HP", "stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister.Độ Hảo Cảm"
- DO NOT touch fields starting with "_" (engine-only)
- DO NOT touch "Giai Đoạn Quan Hệ" or "Giai Đoạn Đời" (engine-derived labels)
- DO NOT touch "Chủ Quyền Lãnh Thổ" (engine-managed via <territory_change>)
- If NOTHING changed, return: {"mvu_update": []}
- ONLY output the JSON block. NO prose, NO explanation.
- Only update what ACTUALLY changed based on the narrator's text. Do not fabricate changes.`;

const EXTRA_MODEL_SYSTEM_SQL = `You are a state-analysis engine for a Westeros RPG game.
Your ONLY job is to read the AI narrator's latest reply and determine what game database tables changed.

You receive:
1. The CURRENT database tables (DDL + data)
2. The narrator's LATEST reply text

You must output SQL statements in a <tableEdit> block reflecting what changed:
<tableEdit>
UPDATE nhan_vat_chinh SET hp = hp - 15 WHERE row_id = 1;
INSERT INTO tui_do (row_id, ten_vat_pham, so_luong, mo_ta) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM tui_do), 'Kiếm', 1, 'Mô tả');
UPDATE npc_chinh SET do_hao_cam = do_hao_cam + 10 WHERE ho_ten = 'Tyrion Lannister';
</tableEdit>

RULES:
- Only use INSERT INTO / UPDATE / DELETE FROM.
- Each statement ends with semicolon (;).
- UPDATE and DELETE MUST have WHERE clause.
- Use delta expressions for numbers: hp = hp - 10, vang = vang + 200. The 'vang' column is the treasury in copper pennies (11,760 pennies = 1 gold dragon).
- For INSERT, use: (SELECT COALESCE(MAX(row_id),0)+1 FROM table_name) for row_id.
- String values in single quotes. Escape internal quotes with double single-quotes ('').
- DO NOT touch fields starting with "_" (engine-only).
- If NOTHING changed, output empty: <tableEdit></tableEdit>
- ONLY output the SQL block. NO prose, NO explanation.
- Only update what ACTUALLY changed based on the narrator's text. Do not fabricate changes.`;

/**
 * Build messages cho extra model request.
 * Gửi compact state + raw AI output để extra model phân tích.
 */
export function buildExtraModelMessages(
  currentState: StatData,
  aiRawOutput: string,
): ApiChatMessage[] {
  const engine = useExtraModelStore.getState().stateEngine;

  if (engine === "auto-database") {
    const tablesText = renderTablesForAI(currentState);
    return [
      { role: "system", content: EXTRA_MODEL_SYSTEM_SQL },
      {
        role: "user",
        content: `## CURRENT DATABASE STATE\n${tablesText}\n\n## NARRATOR'S LATEST REPLY\n${aiRawOutput}\n\nAnalyze the reply and output the <tableEdit> SQL block.`,
      },
    ];
  }

  // Default: JSON mode
  const compactState = Object.fromEntries(
    Object.entries(currentState).filter(([k]) => !k.startsWith("_")),
  );

  return [
    { role: "system", content: EXTRA_MODEL_SYSTEM_JSON },
    {
      role: "user",
      content: `## CURRENT GAME STATE\n\`\`\`json\n${JSON.stringify(compactState, null, 0)}\n\`\`\`\n\n## NARRATOR'S LATEST REPLY\n${aiRawOutput}\n\nAnalyze the reply and output the mvu_update JSON block.`,
    },
  ];
}
