/**
 * succession (13.4) — hôn nhân & kế vị của dòng họ người chơi.
 * - successionOrder: dẫn xuất thứ tự kế vị từ Luật Kế Vị + Thành Viên Gia Tộc
 *   còn sống (Trưởng Nam nam-trước-nữ / Dorne bất kể giới / Sắt bầu chọn / Chỉ Định).
 * - reconcile*: đồng bộ Người Thừa Kế Hiện Tại + cờ Thứ Bậc Kế Vị/Người Thừa Kế.
 * - marriageOps: gả/cưới → của hồi môn (Vàng) + nâng Thái Độ Nhà đối tác (→ 12.3).
 * - betrothal propose/accept/reject: hôn ước đang thương lượng.
 * - crisis: người thừa kế mất / luật bầu chọn nhiều ứng viên → cờ khủng hoảng
 *   (13.4, tái dùng chiến tranh 12 khi vỡ ra nội chiến). tickSuccession loop.
 */
import type { StatData } from "../mvu/schema";
import { SUCCESSION_LAWS } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import type { Npc } from "../mvu/npcSchema";
import { registerDailyListener } from "../mvu/effects";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { findNpc } from "./court";

export type SuccessionLaw = (typeof SUCCESSION_LAWS)[number];

interface FamilyMember {
  name: string;
  npc: Npc;
}

/** Thành viên gia tộc còn sống — ứng viên kế vị (13.4). */
export function livingFamily(state: StatData): FamilyMember[] {
  return Object.entries(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"])
    .filter(([, npc]) => npc["Còn Sống"])
    .map(([name, npc]) => ({ name, npc }));
}

export function isLiving(state: StatData, name: string): boolean {
  const npc = findNpc(state, name);
  return !!npc && npc["Còn Sống"];
}

/** Thứ tự kế vị suy theo Luật Kế Vị (13.4). Trả danh sách tên (còn sống). */
export function successionOrder(state: StatData, lawOverride?: SuccessionLaw): string[] {
  const law = lawOverride ?? state["Gia Tộc Học"]["Luật Kế Vị"];
  const fam = livingFamily(state);
  const byAgeDesc = (a: FamilyMember, b: FamilyMember) => b.npc["Tuổi"] - a.npc["Tuổi"];

  if (law === "Chỉ Định") {
    // giữ thứ tự đã đặt; ưu tiên NPC có cờ Người Thừa Kế; thêm ai còn thiếu ở cuối
    const names = fam.map((f) => f.name);
    const existing = state["Gia Tộc Học"]["Thứ Tự Kế Vị"].filter((n) => names.includes(n));
    const rest = names.filter((n) => !existing.includes(n));
    const flagged = rest.filter((n) => state["Mối Quan Hệ"]["Thành Viên Gia Tộc"][n]?.["Người Thừa Kế"]);
    const unflagged = rest.filter((n) => !flagged.includes(n));
    return [...existing, ...flagged, ...unflagged];
  }
  if (law === "Trưởng Tử Bất Kể Giới (Dorne)") {
    return [...fam].sort(byAgeDesc).map((f) => f.name);
  }
  if (law === "Bầu Chọn (Sắt)") {
    // kingsmoot: xếp theo uy dũng (Võ Lực) rồi tuổi — chỉ là danh sách ứng viên
    return [...fam]
      .sort((a, b) => b.npc["Năng Lực"]["Võ Lực"] - a.npc["Năng Lực"]["Võ Lực"] || byAgeDesc(a, b))
      .map((f) => f.name);
  }
  // "Trưởng Nam" (male-preference primogeniture): nam trước nữ, trong giới theo tuổi giảm
  return [...fam]
    .sort((a, b) => {
      const ga = a.npc["Giới Tính"] === "Nam" ? 0 : 1;
      const gb = b.npc["Giới Tính"] === "Nam" ? 0 : 1;
      return ga - gb || byAgeDesc(a, b);
    })
    .map((f) => f.name);
}

/** Ops đồng bộ Người Thừa Kế Hiện Tại + Thứ Tự + cờ NPC theo 1 thứ tự cho trước. */
function orderToOps(order: string[], fam: Record<string, Npc>): PatchOp[] {
  const ops: PatchOp[] = [
    { op: "replace", path: "stat_data.Gia Tộc Học.Thứ Tự Kế Vị", value: order },
    { op: "replace", path: "stat_data.Gia Tộc Học.Người Thừa Kế Hiện Tại", value: order[0] ?? "" },
  ];
  order.forEach((name, i) => {
    if (!fam[name]) return;
    ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.Thành Viên Gia Tộc.${name}.Thứ Bậc Kế Vị`, value: i + 1 });
    ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.Thành Viên Gia Tộc.${name}.Người Thừa Kế`, value: i === 0 });
  });
  return ops;
}

/** Đồng bộ toàn bộ thứ tự kế vị theo luật hiện tại (13.4). */
export function reconcileSuccessionOps(state: StatData): PatchOp[] {
  return orderToOps(successionOrder(state), state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]);
}

/** Đổi luật kế vị + tính lại thứ tự theo luật mới. */
export function setSuccessionLawOps(state: StatData, law: SuccessionLaw): PatchOp[] {
  const order = successionOrder(state, law);
  const currentGold = state["Thông Tin Nhân Vật"]?.["Ngân Khố"] ?? 0;
  return [
    { op: "replace", path: "stat_data.Gia Tộc Học.Luật Kế Vị", value: law },
    { op: "replace", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: Math.max(0, currentGold - 5880000) },
    ...orderToOps(order, state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];
}

/** Chỉ định 1 người thừa kế cụ thể (chuyển sang luật Chỉ Định) + gỡ cờ khủng hoảng. */
export function designateHeirOps(state: StatData, heirName: string): PatchOp[] {
  const fam = state["Mối Quan Hệ"]["Thành Viên Gia Tộc"];
  if (!fam[heirName] || !fam[heirName]["Còn Sống"]) return [];
  const others = Object.keys(fam).filter((n) => n !== heirName && fam[n]["Còn Sống"]);
  const order = [heirName, ...others];
  return [
    { op: "replace", path: "stat_data.Gia Tộc Học.Luật Kế Vị", value: "Chỉ Định" },
    { op: "replace", path: "stat_data.Gia Tộc Học._Khủng Hoảng Kế Vị", value: false },
    ...orderToOps(order, fam),
  ];
}

// ── Hôn nhân (13.4) ──────────────────────────────────────────────────────────
const ATTITUDE_LADDER = ["Thù Địch", "Địch Ý", "Bất Mãn", "Dao Động", "Cảnh Giác", "Ủng Hộ", "Tín Nhiệm"] as const;

/** Đổi Thái Độ 1 Nhà đi `steps` bậc (dương = nâng, âm = hạ). Key = houseId/schemaName. */
export function improveHouseAttitudeOps(state: StatData, houseId: string, steps = 2): PatchOp[] {
  const schemaName = HOUSES_BY_ID[houseId]?.schemaName ?? houseId;
  const cur = state["Thái Độ Các Nhà"][schemaName]?.["Thái Độ"] ?? "Cảnh Giác";
  const idx = ATTITUDE_LADDER.indexOf(cur as (typeof ATTITUDE_LADDER)[number]);
  const nextIdx = Math.max(0, Math.min(ATTITUDE_LADDER.length - 1, (idx < 0 ? 4 : idx) + steps));
  return [{ op: "replace", path: `stat_data.Thái Độ Các Nhà.${schemaName}.Thái Độ`, value: ATTITUDE_LADDER[nextIdx] }];
}

export interface MarriageOpts {
  partner: string; // nhãn phối ngẫu (người chơi, hoặc đối tác ngoài)
  partnerHouse?: string; // houseId Nhà đối tác → nâng Thái Độ
  dowry?: number;
  dowryOutgoing?: boolean; // true = ta trả của hồi môn; false = ta nhận
  asSpouseOfPlayer?: boolean; // spouseName là phối ngẫu của chính người chơi
  createIfMissing?: boolean; // tạo NPC phối ngẫu nếu chưa có (nhà cầu hôn đem người tới)
}

/**
 * Kết hôn spouseName với opts.partner (13.4). Của hồi môn = Vàng chuyển giao;
 * nâng Thái Độ Nhà đối tác (mở đường xin viện binh 12.3). Trả PatchOp[].
 */
export function marriageOps(state: StatData, spouseName: string, opts: MarriageOpts): PatchOp[] {
  const ops: PatchOp[] = [];
  const existingFam = state["Mối Quan Hệ"]["Thành Viên Gia Tộc"][spouseName];
  const npc = state["Mối Quan Hệ"]["NPC Chính"][spouseName] ?? existingFam;
  const group = existingFam ? "Thành Viên Gia Tộc" : "NPC Chính";
  const base = `stat_data.Mối Quan Hệ.${group}.${spouseName}`;
  const partnerSchema = opts.partnerHouse ? HOUSES_BY_ID[opts.partnerHouse]?.schemaName ?? opts.partnerHouse : undefined;

  if (!npc && opts.createIfMissing) {
    ops.push({
      op: "replace",
      path: base,
      value: {
        "Họ Tên": spouseName,
        ...(partnerSchema ? { "Nhà": partnerSchema } : {}),
        "Còn Sống": true,
        "Độ Hảo Cảm": opts.asSpouseOfPlayer ? 30 : 10,
        "Loại Quan Hệ": [opts.asSpouseOfPlayer ? "Vợ/Chồng" : "Người Thân"],
        "Đã Kết Hôn Với": opts.partner,
      },
    });
  } else if (npc) {
    ops.push({ op: "replace", path: `${base}.Đã Kết Hôn Với`, value: opts.partner });
    if (opts.asSpouseOfPlayer) {
      const rel = npc["Loại Quan Hệ"] ?? [];
      if (!rel.includes("Vợ/Chồng")) {
        ops.push({ op: "replace", path: `${base}.Loại Quan Hệ`, value: [...rel.filter((r) => r !== "Hôn Ước"), "Vợ/Chồng"] });
      }
      ops.push({ op: "delta", path: `${base}.Độ Hảo Cảm`, value: 15 });
    }
  }

  if (opts.dowry && opts.dowry > 0) {
    ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: opts.dowryOutgoing ? -opts.dowry : opts.dowry });
  }
  if (opts.partnerHouse) ops.push(...improveHouseAttitudeOps(state, opts.partnerHouse));
  return ops;
}

// ── Hôn ước đang thương lượng (13.4) ─────────────────────────────────────────
export interface BetrothalInput {
  "Đối Tượng": string;
  "Nhà Đối Tác": string; // houseId
  "Của Hồi Môn": number;
  "Chi Trả": "Ta Trả" | "Ta Nhận";
  "Lợi Ích Chính Trị": string;
}

export function proposeBetrothalOps(id: string, b: BetrothalInput): PatchOp[] {
  return [{ op: "replace", path: `stat_data.Gia Tộc Học.Hôn Ước Đang Thương Lượng.${id}`, value: b }];
}

export function rejectBetrothalOps(id: string): PatchOp[] {
  return [{ op: "remove", path: `stat_data.Gia Tộc Học.Hôn Ước Đang Thương Lượng.${id}` }];
}

/**
 * Chấp nhận hôn ước: người chơi cưới "Đối Tượng" (tạo NPC nếu chưa có) + xoá đề
 * nghị khỏi hàng thương lượng. Của hồi môn + Thái Độ Nhà đối tác áp ngay (13.4).
 */
export function acceptBetrothalOps(state: StatData, id: string): PatchOp[] {
  const b = state["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"][id];
  if (!b) return [];
  const spouse = b["Đối Tượng"];
  return [
    ...marriageOps(state, spouse, {
      partner: state["Thông Tin Nhân Vật"]["Họ Tên"],
      partnerHouse: b["Nhà Đối Tác"] || undefined,
      dowry: b["Của Hồi Môn"],
      dowryOutgoing: b["Chi Trả"] === "Ta Trả",
      asSpouseOfPlayer: true,
      createIfMissing: true,
    }),
    { op: "remove", path: `stat_data.Gia Tộc Học.Hôn Ước Đang Thương Lượng.${id}` },
  ];
}

// ── Khủng hoảng kế vị (13.4) ─────────────────────────────────────────────────
export interface SuccessionCrisis {
  inCrisis: boolean;
  reason: string;
  claimants: string[];
}

/** Phát hiện khủng hoảng thừa kế: heir mất / tuyệt tự / luật bầu chọn tranh giành. */
export function successionCrisisInfo(state: StatData): SuccessionCrisis {
  const gia = state["Gia Tộc Học"];
  const heir = gia["Người Thừa Kế Hiện Tại"];
  const order = successionOrder(state);
  if (heir && !isLiving(state, heir)) {
    return { inCrisis: true, reason: `Người thừa kế ${heir} đã mất — ngôi vị bỏ trống, các chi họ tranh giành.`, claimants: order.slice(0, 3) };
  }
  if (order.length === 0 && !!heir) {
    return { inCrisis: true, reason: "Tuyệt tự — dòng họ không còn người thừa kế hợp pháp.", claimants: [] };
  }
  if (gia["Luật Kế Vị"] === "Bầu Chọn (Sắt)" && order.length >= 2) {
    return { inCrisis: true, reason: "Luật bầu chọn (kingsmoot) — nhiều ứng viên cùng ra tranh ngôi.", claimants: order.slice(0, 3) };
  }
  return { inCrisis: false, reason: "", claimants: [] };
}

/**
 * 1 tick kế vị: tính lại thứ tự + cờ NPC; phát hiện khủng hoảng → bật cờ STICKY
 * (chỉ tắt khi người chơi giải quyết — designateHeir). MUTATE state.
 */
export function tickSuccession(state: StatData): void {
  const gia = state["Gia Tộc Học"];
  const hasLine =
    !!gia["Người Thừa Kế Hiện Tại"] ||
    gia["Thứ Tự Kế Vị"].length > 0 ||
    Object.keys(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]).length > 0;
  if (!hasLine) return;

  // phát hiện khủng hoảng TRƯỚC khi tính lại (dựa trên heir hiện tại)
  const crisis = successionCrisisInfo(state);

  const order = successionOrder(state);
  gia["Thứ Tự Kế Vị"] = order;
  gia["Người Thừa Kế Hiện Tại"] = order[0] ?? "";
  const fam = state["Mối Quan Hệ"]["Thành Viên Gia Tộc"];
  order.forEach((name, i) => {
    if (!fam[name]) return;
    fam[name]["Thứ Bậc Kế Vị"] = i + 1;
    fam[name]["Người Thừa Kế"] = i === 0;
  });

  if (crisis.inCrisis) gia["_Khủng Hoảng Kế Vị"] = true;
}

let registered = false;
export function registerSuccessionLoop(): void {
  if (registered) return;
  registerDailyListener("succession", tickSuccession);
  registered = true;
}
