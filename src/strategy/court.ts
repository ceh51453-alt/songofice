/**
 * court (13.1-13.2) — Tiểu Hội Đồng: bổ nhiệm/miễn nhiệm + hiệu ứng năng lực.
 * - appointOps/dismissOps: đổi người giữ 1 ghế; Năng Lực lấy từ khối "Năng Lực"
 *   của NPC theo lĩnh vực chức vụ (13.1) — engine giữ số, AI tường thuật.
 * - treasuryMultiplier: Đại Chưởng Ngân Khố Năng Lực cao → +% thu Vàng toàn
 *   lãnh thổ (nối tickConstruction 10.3). Ghế khuyết = ×1 (trung tính).
 * - courtInvolved/canAppoint: điều kiện hiện icon Triều Đình (13.5) + thẩm quyền
 *   bổ nhiệm trực tiếp (13.2). tickCourt đồng bộ Năng Lực từ NPC mỗi turn.
 */
import type { StatData } from "../mvu/schema";
import { COURT_POSITIONS, type CourtPosition } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import type { Npc } from "../mvu/npcSchema";
import { registerDailyListener } from "../mvu/effects";

type AbilityKey = keyof Npc["Năng Lực"];

/** Lĩnh vực Năng Lực NPC dùng cho từng chức (13.1). */
export const COURT_FIELD_STAT: Record<CourtPosition, AbilityKey> = {
  "Bàn Tay Nhà Vua": "Trí Mưu",
  "Đại Chưởng Ngân Khố": "Trí Mưu", // Master of Coin (spec 13.1)
  "Đại Chưởng Ấn": "Ngoại Giao", // Master of Laws
  "Đô Đốc Hạm Đội": "Thống Soái", // Master of Ships (spec 13.1)
  "Đại Điệp Viên": "Trí Mưu", // Master of Whisperers
  "Học Sĩ Trưởng": "Trí Mưu", // Grand Maester
  "Tổng Chỉ Huy Ngự Lâm Quân": "Võ Lực",
};

/** Lĩnh vực chức vụ ảnh hưởng — nhãn ngắn cho UI hé lộ hiệu ứng (13.5). */
export const COURT_EFFECT_HINT: Record<CourtPosition, string> = {
  "Bàn Tay Nhà Vua": "điều hành triều chính, tăng hiệu lực mọi quyết sách",
  "Đại Chưởng Ngân Khố": "quản ngân khố — Năng Lực cao thì thu Vàng nhiều hơn",
  "Đại Chưởng Ấn": "thực thi luật pháp, dàn xếp tranh chấp chư hầu",
  "Đô Đốc Hạm Đội": "chỉ huy hải quân, tăng hiệu quả hạm đội",
  "Đại Điệp Viên": "mạng lưới mật thám, giảm nguy cơ bị cài gián điệp",
  "Học Sĩ Trưởng": "cố vấn học vấn, y thuật và thư tín",
  "Tổng Chỉ Huy Ngự Lâm Quân": "thống lĩnh ngự lâm, bảo vệ hoàng thân",
};

const DEFAULT_ABILITY = 30;

/** Tìm 1 NPC theo tên trong cả 2 nhóm quan hệ (5.1b). */
export function findNpc(state: StatData, name: string): Npc | undefined {
  if (!name) return undefined;
  return state["Mối Quan Hệ"]["NPC Chính"][name] ?? state["Mối Quan Hệ"]["Thành Viên Gia Tộc"][name];
}

/** Năng Lực dự kiến của 1 NPC nếu giữ chức này (13.1). */
export function abilityForPosition(npc: Npc | undefined, position: CourtPosition): number {
  if (!npc) return DEFAULT_ABILITY;
  const v = npc["Năng Lực"][COURT_FIELD_STAT[position]];
  return typeof v === "number" ? v : DEFAULT_ABILITY;
}

export function isSeatFilled(seat: { "Người Giữ Chức": string } | undefined): boolean {
  return !!seat && !!seat["Người Giữ Chức"] && seat["Người Giữ Chức"] !== "Khuyết";
}

/** Bổ nhiệm 1 NPC vào ghế (13.2) — Năng Lực suy từ NPC theo lĩnh vực chức vụ. */
export function appointOps(state: StatData, position: CourtPosition, npcName: string): PatchOp[] {
  const ability = abilityForPosition(findNpc(state, npcName), position);
  const base = `stat_data.Triều Đình.Tiểu Hội Đồng.${position}`;
  return [
    { op: "replace", path: `${base}.Người Giữ Chức`, value: npcName },
    { op: "replace", path: `${base}.Năng Lực`, value: ability },
    { op: "replace", path: "stat_data.Triều Đình.Có Liên Quan", value: true },
  ];
}

/** Miễn nhiệm — ghế về "Khuyết", Năng Lực về mốc trung tính (13.2). */
export function dismissOps(position: CourtPosition): PatchOp[] {
  const base = `stat_data.Triều Đình.Tiểu Hội Đồng.${position}`;
  return [
    { op: "replace", path: `${base}.Người Giữ Chức`, value: "Khuyết" },
    { op: "replace", path: `${base}.Năng Lực`, value: DEFAULT_ABILITY },
  ];
}

/**
 * Hệ số thu Vàng từ Đại Chưởng Ngân Khố (13.1 → 10.3). Ghế khuyết = 1.0.
 * Năng Lực 40 = trung tính; cao hơn +%, thấp hơn −%. Clamp [0.85, 1.35].
 */
export function treasuryMultiplier(state: StatData): number {
  const coin = state["Triều Đình"]["Tiểu Hội Đồng"]["Đại Chưởng Ngân Khố"];
  if (!isSeatFilled(coin)) return 1;
  const mult = 1 + (coin["Năng Lực"] - 40) / 240;
  return Math.max(0.85, Math.min(1.35, mult));
}

/** Người chơi có nắm quyền cai trị (sở hữu ≥1 vùng) → có triều đình riêng. */
export function playerIsRulingLord(state: StatData): boolean {
  return Object.values(state["Chủ Quyền Lãnh Thổ"]).some((s) => s["Là Của Người Chơi"]);
}

/** Có dính líu triều chính → hiện icon Triều Đình (13.5). Ẩn hoàn toàn nếu false. */
export function courtInvolved(state: StatData): boolean {
  const court = state["Triều Đình"];
  if (court["Có Liên Quan"]) return true;
  if (playerIsRulingLord(state)) return true;
  const seats = court["Tiểu Hội Đồng"];
  if (COURT_POSITIONS.some((p) => isSeatFilled(seats[p]))) return true;
  const gia = state["Gia Tộc Học"];
  return !!gia["Người Thừa Kế Hiện Tại"] || gia["Thứ Tự Kế Vị"].length > 0;
}

/** Có thẩm quyền bổ nhiệm trực tiếp (13.2) — vua/lãnh chúa cai trị. Ngược lại chỉ vận động. */
export function canAppoint(state: StatData): boolean {
  return state["Triều Đình"]["Quyền Bổ Nhiệm"] || playerIsRulingLord(state);
}

/** 1 tick triều đình: đồng bộ Năng Lực ghế từ NPC (bắt kịp bổ nhiệm do AI kể). */
export function tickCourt(state: StatData): void {
  const seats = state["Triều Đình"]["Tiểu Hội Đồng"];
  let anyFilled = false;
  for (const pos of COURT_POSITIONS) {
    const seat = seats[pos];
    if (!isSeatFilled(seat)) continue;
    anyFilled = true;
    const npc = findNpc(state, seat["Người Giữ Chức"]);
    if (npc) seat["Năng Lực"] = abilityForPosition(npc, pos);
  }
  if (anyFilled) state["Triều Đình"]["Có Liên Quan"] = true;
}

let registered = false;
export function registerCourtLoop(): void {
  if (registered) return;
  registerDailyListener("court", tickCourt);
  registered = true;
}
