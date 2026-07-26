/**
 * interactionPreview (GĐ1) — Kiểm tra NPC nào có thể tương tác với nhau off-screen.
 * Tham khảo "角色交互可行性校验规则" của Tavern Helper:
 * khoảng cách vật lý, kênh thông tin, trạng thái + động cơ.
 * Trả danh sách cặp NPC hợp lệ + loại tương tác.
 */
import type { Npc } from "../mvu/npcSchema";
import { createLogger } from "../lib/log";

const log = createLogger("npc/interaction");

// ── Types ────────────────────────────────────────────────────────────────────

export type InteractionType =
  | "face_to_face"     // gặp trực tiếp (cùng vùng)
  | "messenger"        // qua sứ giả / thư (lân cận)
  | "rumor"            // nghe tin đồn (xa)
  | "none";            // không thể tương tác

export interface InteractionCandidate {
  npcA: string;
  npcB: string;
  type: InteractionType;
  reason: string;      // giải thích tại sao có thể tương tác
  priority: number;    // 0-100, ưu tiên cao → nên sim trước
}

// ── Hard Reject (một phiếu phủ quyết) ────────────────────────────────────────

/**
 * Kiểm tra NPC có bị cấm tương tác không (trạng thái bất khả).
 * - Đã chết, bị giam, mất tích → cấm chủ động
 */
function isIncapacitated(npc: Npc): boolean {
  if (!npc["Còn Sống"]) return true;
  const blocked = ["Bị Giam", "Mất Tích"] as const;
  return blocked.includes(npc["Tình Trạng"] as typeof blocked[number]);
}

// ── Khoảng Cách ──────────────────────────────────────────────────────────────

/**
 * Ước lượng khoảng cách giữa 2 NPC dựa trên vị trí text.
 * Đơn giản: cùng string → "cùng vùng"; cùng chứa key region → "lân cận"; khác hẳn → "xa".
 */
function estimateDistance(locA?: string, locB?: string): "same" | "nearby" | "far" | "unknown" {
  if (!locA || !locB) return "unknown";
  const a = locA.toLowerCase().trim();
  const b = locB.toLowerCase().trim();

  if (a === b) return "same";

  // Nhóm vùng: nếu chứa cùng keyword lớn → lân cận
  const regionKeywords = [
    ["king's landing", "vương đô", "red keep", "hồng bảo", "flea bottom"],
    ["winterfell", "bình nguyên đông", "the north", "phương bắc"],
    ["casterly rock", "tây cảnh", "lannisport"],
    ["highgarden", "the reach", "hà vực"],
    ["dorne", "sunspear", "dornish"],
    ["the wall", "castle black", "trường thành"],
    ["essos", "pentos", "braavos", "meereen", "volantis", "qarth"],
    ["iron islands", "pyke", "quần đảo sắt"],
    ["riverlands", "riverrun", "hà giang"],
    ["stormlands", "storm's end", "bão địa"],
    ["the vale", "eyrie", "ưng sào"],
  ];

  for (const group of regionKeywords) {
    const aMatch = group.some((kw) => a.includes(kw));
    const bMatch = group.some((kw) => b.includes(kw));
    if (aMatch && bMatch) return "nearby";
  }

  return "far";
}

// ── Kênh Thông Tin ───────────────────────────────────────────────────────────

/**
 * Kiểm tra 2 NPC có biết nhau không (trực tiếp hoặc qua trung gian).
 * Đơn giản: dựa trên cùng Nhà / có Loại Quan Hệ liên quan / cùng ký ức.
 */
function haveInfoChannel(
  nameA: string, npcA: Npc,
  nameB: string, npcB: Npc,
): boolean {
  // Cùng Nhà → chắc chắn biết nhau
  if (npcA["Nhà"] && npcB["Nhà"] && npcA["Nhà"] === npcB["Nhà"]) return true;

  // Ký ức đề cập tên nhau
  const aKnowsB = npcA["Ký Ức"].some((m) => m["Sự Việc"].includes(nameB));
  const bKnowsA = npcB["Ký Ức"].some((m) => m["Sự Việc"].includes(nameA));
  if (aKnowsB || bKnowsA) return true;

  // Cùng có mối quan hệ thân thiết/thù địch ≥ Quen Biết
  if (Math.abs(npcA["Độ Hảo Cảm"]) >= 15 && Math.abs(npcB["Độ Hảo Cảm"]) >= 15) {
    // Cả hai đều "đáng chú ý" → khả năng biết nhau trong giới quyền lực
    return true;
  }

  return false;
}

// ── Động Cơ ──────────────────────────────────────────────────────────────────

/**
 * Tính điểm động cơ tương tác giữa 2 NPC (0-100).
 * Dựa trên: mục tiêu liên quan, quan hệ gia tộc, xung đột lợi ích.
 */
function motivationScore(nameA: string, npcA: Npc, nameB: string, npcB: Npc): number {
  let score = 0;

  // Mục tiêu đề cập đến nhau
  if (npcA["Mục Tiêu Cá Nhân"]?.includes(nameB)) score += 40;
  if (npcB["Mục Tiêu Cá Nhân"]?.includes(nameA)) score += 40;

  // Cùng Nhà → công việc gia tộc
  if (npcA["Nhà"] && npcA["Nhà"] === npcB["Nhà"]) score += 20;

  // Quan hệ gia đình
  if (npcA["Cha/Mẹ"].includes(nameB) || npcB["Cha/Mẹ"].includes(nameA)) score += 30;
  if (npcA["Anh Chị Em"].includes(nameB) || npcB["Anh Chị Em"].includes(nameA)) score += 25;
  if (npcA["Đã Kết Hôn Với"] === nameB || npcB["Đã Kết Hôn Với"] === nameA) score += 35;

  // Mâu thuẫn → xung đột tiềm năng
  const bothHaveGoals = npcA["Mục Tiêu Cá Nhân"] && npcB["Mục Tiêu Cá Nhân"];
  if (bothHaveGoals) {
    const goalOverlap = ["quyền lực", "ngai", "chiếm", "giết", "trả thù"]
      .some((kw) => npcA["Mục Tiêu Cá Nhân"]!.includes(kw) && npcB["Mục Tiêu Cá Nhân"]!.includes(kw));
    if (goalOverlap) score += 25;
  }

  return Math.min(100, score);
}

// ── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Pipeline kiểm tra tương tác: hardReject → khoảng cách → kênh thông tin → động cơ.
 * Trả danh sách cặp hợp lệ, sắp theo priority giảm dần.
 */
export function previewInteractions(
  npcs: [string, Npc][],
  maxPairs = 5,
): InteractionCandidate[] {
  const candidates: InteractionCandidate[] = [];

  for (let i = 0; i < npcs.length; i++) {
    for (let j = i + 1; j < npcs.length; j++) {
      const [nameA, npcA] = npcs[i];
      const [nameB, npcB] = npcs[j];

      // 1. Hard reject
      if (isIncapacitated(npcA)) continue;
      if (isIncapacitated(npcB)) continue;

      // 2. Khoảng cách → loại tương tác
      const dist = estimateDistance(npcA["Vị Trí Hiện Tại"], npcB["Vị Trí Hiện Tại"]);
      let type: InteractionType;
      if (dist === "same") type = "face_to_face";
      else if (dist === "nearby") type = "messenger";
      else if (dist === "far") type = "rumor";
      else type = "face_to_face"; // unknown → giả sử có thể gặp

      // 3. Kênh thông tin
      const hasChannel = haveInfoChannel(nameA, npcA, nameB, npcB);
      if (!hasChannel && type !== "rumor") {
        // Không biết nhau + không xa (nên cũng không nghe tin) → skip
        continue;
      }

      // 4. Động cơ
      const motivation = motivationScore(nameA, npcA, nameB, npcB);
      if (motivation < 10) continue; // quá yếu → bỏ qua

      const reason = buildReason(type, dist, hasChannel, motivation, nameA, nameB);
      candidates.push({ npcA: nameA, npcB: nameB, type, reason, priority: motivation });
    }
  }

  // Sắp xếp theo priority giảm dần
  candidates.sort((a, b) => b.priority - a.priority);
  const result = candidates.slice(0, maxPairs);

  if (result.length > 0) {
    log.info(`Interaction preview: ${result.length} cặp hợp lệ / ${candidates.length} tổng`);
  }

  return result;
}

function buildReason(
  type: InteractionType, _dist: string,
  hasChannel: boolean, motivation: number,
  nameA: string, nameB: string,
): string {
  const parts: string[] = [];
  if (type === "face_to_face") parts.push(`${nameA} và ${nameB} ở cùng vùng`);
  else if (type === "messenger") parts.push(`${nameA} và ${nameB} ở lân cận, có thể gửi sứ giả`);
  else parts.push(`${nameA} và ${nameB} xa nhau, chỉ nghe tin đồn`);

  if (hasChannel) parts.push("đã biết nhau");
  if (motivation >= 40) parts.push("động cơ mạnh");
  else if (motivation >= 20) parts.push("có lý do giao tiếp");

  return parts.join("; ");
}
