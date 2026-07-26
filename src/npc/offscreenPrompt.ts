/**
 * offscreenPrompt (GĐ1) — Prompt builder cho offscreen AI model call.
 * Tham khảo CoT (Chain-of-thought) của Tavern Helper "角色筛选" task,
 * nhưng đơn giản hoá: 4 bước thay vì 8, output JSON tương thích PatchOp.
 * Dùng extra model (rẻ/nhanh) để sinh hành động NPC off-screen sáng tạo hơn
 * so với rule-based generateOffscreenAction().
 */
import type { StatData } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";
import type { ApiChatMessage } from "../types/connection";
import type { InteractionCandidate } from "./interactionPreview";

// ── System Prompt ────────────────────────────────────────────────────────────

const OFFSCREEN_SYSTEM_PROMPT = `You are the RECORDER — an invisible, omniscient observer of a Westeros RPG world.
Your job is to simulate what off-screen NPCs are doing WHILE THE PLAYER IS NOT WATCHING.

## Core Principles
- NPCs have their own lives, goals, fears, and daily routines.
- NPCs do NOT revolve around the player — they pursue their OWN goals.
- Events happen whether the player is present or not.
- Respect each NPC's personality axes: Good-Evil, Brave-Cowardly, Loyal-Treacherous, Hot-Calm.
- Respect distance and information: NPCs only know what they could realistically know.
- Allow consequences: past actions leave traces, promises come due, enemies plot revenge.

## Anti-Metagaming
- NPCs CANNOT know information they haven't witnessed or been told about.
- Secret player actions remain SECRET unless there's a realistic information leak.
- Do NOT create "butterfly effect" coincidences just for drama.

## Output Format
You must output a JSON block wrapped in <OffscreenResult> tags:
<OffscreenResult>
{
  "actions": [
    {
      "npcName": "Full NPC name",
      "action": "Detailed description of what the NPC did (2-3 sentences, narrative style)",
      "newsText": "What the player might hear about this (rumor/news, 1 sentence)",
      "stateChanges": [
        { "op": "replace"|"delta", "path": "stat_data.Mối Quan Hệ.NPC Chính.<npc_name>.<field>", "value": <value> }
      ]
    }
  ],
  "interactions": [
    {
      "participants": ["NPC A", "NPC B"],
      "description": "What happened between them (2-3 sentences)",
      "outcome": "Brief outcome"
    }
  ]
}
</OffscreenResult>

## Rules
- "stateChanges" is optional — only include if the NPC's data should update (e.g., location change, mood change).
- Use "delta" for gradual changes (e.g., trust +5), "replace" for position/status changes.
- Do NOT touch fields starting with "_" or "Giai Đoạn" (engine-managed).
- Keep actions CONSISTENT with each NPC's personality and goals.
- If nothing meaningful happens for an NPC, omit them from the output.
- ONLY output the JSON block. No prose outside the tags.`;

// ── User Prompt Builder ──────────────────────────────────────────────────────

/**
 * Render NPC info gọn cho prompt (tên, vị trí, tính cách, mục tiêu, trạng thái).
 */
function renderNpcCompact(name: string, npc: Npc): string {
  const p = npc["Tính Cách"];
  const personality = [
    `Thiện/Ác: ${p["Trục Thiện-Ác"]}`,
    `Can đảm/Nhát: ${p["Trục Can Đảm-Hèn Nhát"]}`,
    `Trung thành/Phản: ${p["Trục Trung Thành-Phản Trắc"]}`,
    `Nóng/Tĩnh: ${p["Trục Nóng Nảy-Điềm Tĩnh"]}`,
  ].join(", ");

  const lines = [
    `### ${name}`,
    `- Nhà: ${npc["Nhà"] ?? "Không rõ"} | Chức vụ: ${npc["Chức Vụ"] || "Không"}`,
    `- Vị trí: ${npc["Vị Trí Hiện Tại"] ?? "Không rõ"} | Tình trạng: ${npc["Tình Trạng"]}`,
    `- Tính cách [${personality}]`,
    `- Nét tính cách: ${npc["Nét Tính Cách"].join(", ") || "Không đặc biệt"}`,
    `- Mục tiêu: "${npc["Mục Tiêu Cá Nhân"] ?? "Không có"}"`,
  ];

  // Ký ức gần nhất (3 gần nhất)
  const recentMemories = npc["Ký Ức"].slice(-3);
  if (recentMemories.length > 0) {
    lines.push(`- Ký ức gần: ${recentMemories.map((m) => `[${m["Cảm Xúc"]}] ${m["Sự Việc"]}`).join(" | ")}`);
  }

  return lines.join("\n");
}

/**
 * Render danh sách cặp tương tác đã lọc.
 */
function renderInteractions(interactions: InteractionCandidate[]): string {
  if (interactions.length === 0) return "Không có cặp NPC nào đủ điều kiện tương tác.";

  return interactions
    .map((c, i) => `${i + 1}. **${c.npcA} ↔ ${c.npcB}** [${c.type}] — ${c.reason} (ưu tiên: ${c.priority})`)
    .join("\n");
}

/**
 * Build messages cho offscreen AI model call.
 */
export function buildOffscreenMessages(
  stat: StatData,
  selectedNpcs: [string, Npc][],
  interactions: InteractionCandidate[],
  daysPassed: number,
): ApiChatMessage[] {
  // Lấy context thế giới gọn
  const world = stat["Thế Giới"];
  const worldContext = [
    `## Bối Cảnh Thế Giới`,
    `- Mùa: ${world["Mùa"]} | Năm: ${world["Năm"]} AC`,
    `- Thời tiết: ${world["Thời Tiết"]}`,
    `- Vị trí người chơi: ${world["Vị Trí"]}`,
  ].join("\n");

  // Render NPCs
  const npcsBlock = selectedNpcs.map(([name, npc]) => renderNpcCompact(name, npc)).join("\n\n");

  // Render interaction candidates
  const interactionsBlock = renderInteractions(interactions);

  const userContent = `${worldContext}

## Thời Gian Trôi Qua
${daysPassed} ngày truyện đã trôi qua kể từ lần sim trước.

## NPC Cần Sim (đang Off-screen)
${npcsBlock}

## Cặp NPC Có Thể Tương Tác
${interactionsBlock}

## Chỉ Dẫn Suy Nghĩ
Trước khi output, hãy suy luận (trong <think> nếu model hỗ trợ):
1. Trong ${daysPassed} ngày qua, mỗi NPC đang làm gì theo mục tiêu và tính cách?
2. Có cặp NPC nào tương tác không? Loại tương tác phù hợp?
3. Hành động có thay đổi state không? (vị trí, tình trạng, hảo cảm)
4. Kiểm tra anti-metagaming: NPC có biết thông tin này hợp lý không?

Bây giờ hãy output <OffscreenResult> JSON.`;

  return [
    { role: "system", content: OFFSCREEN_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}

// ── Result Parser ────────────────────────────────────────────────────────────

export interface OffscreenAiAction {
  npcName: string;
  action: string;
  newsText: string;
  stateChanges?: { op: string; path: string; value: unknown }[];
}

export interface OffscreenAiInteraction {
  participants: string[];
  description: string;
  outcome: string;
}

export interface OffscreenAiResult {
  actions: OffscreenAiAction[];
  interactions: OffscreenAiInteraction[];
  found: boolean;
}

/**
 * Parse response từ offscreen AI model.
 */
export function parseOffscreenResult(text: string): OffscreenAiResult {
  const empty: OffscreenAiResult = { actions: [], interactions: [], found: false };

  const match = text.match(/<OffscreenResult>\s*([\s\S]*?)\s*<\/OffscreenResult>/i);
  if (!match) return empty;

  try {
    const parsed = JSON.parse(match[1]);
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
      found: true,
    };
  } catch {
    return empty;
  }
}
