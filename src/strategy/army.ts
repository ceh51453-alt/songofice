/**
 * army (11.3-11.4 + đại tu M19) — cỗ máy quân đội phong kiến.
 *
 * Bốn ngạch quân, bốn luật chơi khác nhau (content/westeros/armyBranches.ts):
 *   • Chính Quy  — cần Doanh Trại + quyền lập quân, ăn lương quanh năm.
 *   • Phục Dịch  — gọi dân cày đi lính ở lãnh địa mình cai quản, có HẠN nghĩa vụ.
 *   • Chư Hầu    — KHÔNG tuyển được ở đây; phất cờ hiệu triệu (strategy/muster.ts).
 *   • Đánh Thuê  — chỉ thuê được nơi ĐANG CÓ đoàn đóng quân (chợ lính).
 *
 * Vòng đời một đơn vị: tập hợp (gom người về điểm hẹn) → huấn luyện → sẵn sàng
 * → hành quân/đánh nhau (ăn lương khô mang theo) → hết hạn nghĩa vụ thì tan.
 *
 * Engine giữ số; AI KHÔNG tự quyết. Trả PatchOp[] cho engine áp.
 */
import type { StatData, MilitaryUnit, ArmyBranch } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { turnsToDays } from "../mvu/calendar";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { recruitableTroopsForEra, type TroopTypeAll, troopMeta, branchAllows } from "../content/westeros/troopTypes";
import { branchMeta } from "../content/westeros/armyBranches";
import { canControlHolding, hasPrivilege } from "../character/roleplay";
import { MORALE_SCORE, moraleEnumFromScore } from "../combat/scales";
import { eventSeed, makeRng } from "../probability/rng";
import { EXCHANGE_RATES } from "../economy/currency";
import { unitMonthlyWage } from "../economy/wages";
import { sellswordHubsAt } from "../content/westeros/mercenaries";

export interface RecruitResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  unitName?: string;
}

/** Số ngày lương khô một đơn vị mang theo được khi rời lãnh địa. */
export const MAX_SUPPLY_DAYS = 30;

// ── Quyền tuyển quân (M19) ──────────────────────────────────────────────────

/** Có Doanh Trại đã xây xong không (11.3). */
export function hasBarracks(state: StatData, territoryId: string): boolean {
  const terr = state["Lãnh Địa"][territoryId];
  return !!terr && Object.values(terr["Công Trình"]).some((b) => b["Loại"] === "Doanh Trại" && !b["Đang Xây"] && !b["Đang Phá"]);
}

/** Người chơi có thẩm quyền lập quân ở lãnh địa này không. */
export function canRaiseTroops(state: StatData, territoryId: string): boolean {
  return canControlHolding(state, territoryId) && hasPrivilege(state, "Lập Quân Đồn Trú");
}

export interface RecruitGate {
  ok: boolean;
  reason?: string;
}

/**
 * Lãnh địa này có tuyển được ngạch đó không, và nếu không thì VÌ SAO — giao
 * diện in thẳng lý do ra thay vì để nút xám câm lặng.
 */
export function canRecruitAt(state: StatData, territoryId: string, branch: ArmyBranch): RecruitGate {
  if (branch === "Đánh Thuê") {
    return hiringHubsFor(state).length > 0
      ? { ok: true }
      : { ok: false, reason: "Quanh đây không có đoàn lính đánh thuê nào đang chào giá" };
  }
  if (branch === "Chư Hầu") {
    return { ok: false, reason: "Quân chư hầu không tuyển được — phải phất cờ hiệu triệu" };
  }
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return { ok: false, reason: "Lãnh địa không tồn tại" };
  if (!canControlHolding(state, territoryId)) return { ok: false, reason: "Ngươi không cai quản lãnh địa này" };
  if (!hasPrivilege(state, "Lập Quân Đồn Trú")) return { ok: false, reason: "Tước vị của ngươi không có quyền lập quân" };
  if (branch === "Chính Quy" && !hasBarracks(state, territoryId)) {
    return { ok: false, reason: "Cần Doanh Trại để nuôi quân chính quy" };
  }
  return { ok: true };
}

/** Mọi lãnh địa tuyển được ngạch này (M19) — giao diện chỉ liệt kê chỗ hợp lệ. */
export function recruitableHoldings(state: StatData, branch: ArmyBranch): string[] {
  return Object.keys(state["Lãnh Địa"]).filter((id) => canRecruitAt(state, id, branch).ok);
}

/** Chợ lính khớp vị trí hiện tại của nhân vật hoặc lãnh địa đang cai quản. */
export function hiringHubsFor(state: StatData): string[] {
  const here = state["Thế Giới"]["Vị Trí"] ?? "";
  const keys = new Set(sellswordHubsAt(here).map((h) => h.key));
  for (const id of Object.keys(state["Lãnh Địa"])) {
    if (!canControlHolding(state, id)) continue;
    for (const h of sellswordHubsAt(REGIONS_BY_ID[id]?.seat ?? "", id)) keys.add(h.key);
  }
  return [...keys];
}

/** Đoàn đánh thuê đang chào giá và còn nán lại (M19). */
export function availableCompanies(state: StatData): [string, StatData["Đội Đánh Thuê"][string]][] {
  return Object.entries(state["Đội Đánh Thuê"] ?? {}).filter(
    ([, c]) => c["Quân Số"] > 0 && c["Ngày Còn Ở Lại"] > 0,
  );
}

// ── Sức tuyển ───────────────────────────────────────────────────────────────

/** Sức tuyển tối đa mỗi THÁNG theo cấp Doanh Trại + Dân Số (11.3). */
export function maxRecruitPerMonth(state: StatData, territoryId: string): number {
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return 0;
  const barracks = terr["Công Trình"]["Doanh Trại"];
  if (!barracks || barracks["Đang Xây"] || barracks["Đang Phá"]) return 0;
  return barracks["Cấp Độ"] * 800 + Math.floor(terr["Dân Số"] / 25);
}

/**
 * Trần tuyển theo NGẠCH (M19). Quân chính quy bị Doanh Trại chặn; quân phục
 * dịch bị chính DÂN SỐ chặn — vét quá tay thì mùa sau không còn ai cày ruộng
 * (tối đa 1/8 số nông dân).
 */
export function recruitCapFor(state: StatData, territoryId: string, branch: ArmyBranch): number {
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return 0;
  if (branch === "Phục Dịch") {
    const farmers = terr["Dân Số Chi Tiết"]["Nông Dân"] || 0;
    const idle = terr["Dân Số Chi Tiết"]["Thất Nghiệp"] || 0;
    return Math.max(0, Math.floor((farmers + idle) / 8));
  }
  return maxRecruitPerMonth(state, territoryId);
}

/** Số NGÀY gom quân về điểm hẹn trước khi bắt đầu huấn luyện (M19). */
export function musterDaysFor(troopType: string, branch: ArmyBranch, count: number): number {
  const base = troopMeta(troopType).musterDays * branchMeta(branch).musterMult;
  // gọi càng đông càng lâu: mỗi 1000 quân cộng thêm 15% thời gian
  return Math.max(1, Math.round(base * (1 + count / 1000 * 0.15)));
}

/** Số NGÀY huấn luyện trước khi ra trận được (M19). */
export function trainDaysFor(troopType: string, branch: ArmyBranch): number {
  const meta = troopMeta(troopType);
  const months = meta.trainMonths * branchMeta(branch).trainMult;
  return Math.max(0, Math.round(turnsToDays(months)));
}

export interface RecruitCost {
  gold: number; // Đồng Đỏ
  food: number;
  population: number;
  musterDays: number;
  trainDays: number;
  serviceDays: number;
}

/** Bảng chi phí cho giao diện in ra TRƯỚC khi người chơi bấm nút (M19). */
export function recruitCost(troopType: string, branch: ArmyBranch, count: number): RecruitCost {
  const meta = troopMeta(troopType);
  const br = branchMeta(branch);
  // costPer100 viết theo RỒNG VÀNG; ngân khố giữ ĐỒNG ĐỎ
  const gold = Math.round((meta.costPer100["Ngân Khố"] * count * br.goldMult) / 100) * EXCHANGE_RATES.GOLD_TO_COPPER;
  return {
    gold,
    food: Math.round((meta.costPer100["Lương Thực"] * count) / 100),
    population: Math.round(count * br.popPerSoldier),
    musterDays: musterDaysFor(troopType, branch, count),
    trainDays: trainDaysFor(troopType, branch),
    serviceDays: br.serviceDays,
  };
}

// ── Tuyển quân (11.3 + M19) ─────────────────────────────────────────────────

export interface RecruitOptions {
  branch?: ArmyBranch;
  unitName?: string;
  commander?: string;
  /** bỏ qua kiểm tra thẩm quyền — dùng cho quân do cốt truyện ban (thẻ AI). */
  storyGranted?: boolean;
}

/** Đơn vị mới toanh theo ngạch — nơi duy nhất dựng object MilitaryUnit. */
export function newUnit(
  troopType: TroopTypeAll,
  count: number,
  branch: ArmyBranch,
  fields: Partial<MilitaryUnit> = {},
): MilitaryUnit {
  const meta = troopMeta(troopType);
  const br = branchMeta(branch);
  return {
    "Tướng Chỉ Huy": "Tạm Khuyết",
    "Nhà": "",
    "Số Lượng": count,
    "Loại Quân": troopType,
    "Thành Phần": {},
    "Hậu Cần": "Cầm Cự Được",
    "Sĩ Khí": br.startMorale,
    "Trang Bị": br.startEquipment,
    "Huấn Luyện": meta.special && branch !== "Phục Dịch" ? "Thành Thạo" : br.startTraining,
    "Lãnh Địa Đồn Trú": "",
    "Đang Di Chuyển Đến": undefined,
    "Ngày Hành Quân Còn Lại": 0,
    "Ngày Huấn Luyện": 0,
    "Ngạch": branch,
    "Kinh Nghiệm": 0,
    "Số Trận Đã Đánh": 0,
    "Thương Binh": 0,
    "Ngày Tập Hợp Còn Lại": 0,
    "Hạn Phục Dịch Còn Lại": br.serviceDays,
    "Lương Thực Mang Theo": MAX_SUPPLY_DAYS,
    "Thuộc Chư Hầu": "",
    "Ghi Chú": "",
    ...fields,
  } as MilitaryUnit;
}

/** Tên đơn vị không đụng hàng (thêm hậu tố II, III... nếu trùng). */
function uniqueUnitName(state: StatData, base: string): string {
  if (!state["Biên Chế Quân Sự"][base]) return base;
  const suffix = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  for (const s of suffix) {
    const name = `${base} ${s}`;
    if (!state["Biên Chế Quân Sự"][name]) return name;
  }
  return `${base} ${Date.now() % 10000}`;
}

/**
 * Tuyển 1 đơn vị tại lãnh địa (11.3 + M19). Trả ops trừ tài nguyên + tạo đơn vị
 * đang TẬP HỢP (chưa đánh được). Đây cũng là cửa duy nhất cho thẻ <recruit> của
 * AI đi vào — luật giống hệt, để lời kể không đẻ ra quân từ hư không.
 */
export function recruitUnit(
  state: StatData,
  territoryId: string,
  troopType: TroopTypeAll,
  count: number,
  opts: RecruitOptions | string = {},
): RecruitResult {
  // tương thích chữ ký cũ recruitUnit(state, id, type, count, unitName)
  const o: RecruitOptions = typeof opts === "string" ? { unitName: opts } : opts;
  const branch: ArmyBranch = o.branch ?? "Chính Quy";

  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!o.storyGranted) {
    const gate = canRecruitAt(state, territoryId, branch);
    if (!gate.ok) return { ok: false, error: gate.reason, ops: [] };
  }
  if (!branchAllows(troopType, branch)) {
    return { ok: false, error: `${troopType} không thuộc ngạch ${branch}`, ops: [] };
  }

  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  if (!o.storyGranted && !recruitableTroopsForEra(eraId).includes(troopType)) {
    return { ok: false, error: `${troopType} không tuyển được ở thời kỳ này`, ops: [] };
  }
  if (count <= 0) return { ok: false, error: "Số lượng không hợp lệ", ops: [] };
  const cap = recruitCapFor(state, territoryId, branch);
  if (!o.storyGranted && count > cap) {
    return { ok: false, error: `Vượt sức tuyển của lãnh địa (tối đa ${cap.toLocaleString("vi-VN")})`, ops: [] };
  }

  const cost = recruitCost(troopType, branch, count);
  if (cost.gold > state["Thông Tin Nhân Vật"]["Ngân Khố"]) return { ok: false, error: "Thiếu Vàng", ops: [] };
  if (cost.food > terr["Tài Nguyên"]["Lương Thực"]) return { ok: false, error: "Thiếu Lương Thực", ops: [] };
  const farmers = terr["Dân Số Chi Tiết"]["Nông Dân"] || 0;
  if (cost.population > farmers) return { ok: false, error: "Thiếu Nông Dân để gọi lính", ops: [] };

  const label = branch === "Phục Dịch" ? "Dân Binh" : troopType;
  const name = uniqueUnitName(
    state,
    o.unitName?.trim() || `${label} ${REGIONS_BY_ID[territoryId]?.name ?? territoryId}`,
  );

  const ops: PatchOp[] = [];
  if (cost.gold > 0) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -cost.gold });
  if (cost.food > 0) ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.Lương Thực`, value: -cost.food });
  if (cost.population > 0) {
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Dân Số`, value: -cost.population });
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Dân Số Chi Tiết.Nông Dân`, value: -cost.population });
  }
  ops.push({
    op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}`,
    value: newUnit(troopType, count, branch, {
      "Tướng Chỉ Huy": o.commander?.trim() || "Tạm Khuyết",
      "Nhà": state["Thông Tin Nhân Vật"]["Nhà"] ?? "",
      "Lãnh Địa Đồn Trú": territoryId,
      "Ngày Tập Hợp Còn Lại": cost.musterDays,
      "Ngày Huấn Luyện": cost.trainDays,
    }),
  });
  return { ok: true, ops, unitName: name };
}

// ── Thuê lính đánh thuê (M19) ───────────────────────────────────────────────

/**
 * Ký khế ước với một đoàn đang chào giá. Khác tuyển quân ở chỗ: không cần đất,
 * không cần dân, không cần huấn luyện — chỉ cần vàng, và một niềm tin nhất định
 * vào chữ tín của đám người đó.
 */
export function hireMercenaries(
  state: StatData,
  companyKey: string,
  count: number,
  stationTerritoryId?: string,
): RecruitResult {
  const co = state["Đội Đánh Thuê"]?.[companyKey];
  if (!co) return { ok: false, error: "Không có đoàn nào tên vậy quanh đây", ops: [] };
  if (co["Ngày Còn Ở Lại"] <= 0) return { ok: false, error: `${co["Tên Đoàn"]} đã nhổ trại đi nơi khác`, ops: [] };
  if (count <= 0) return { ok: false, error: "Số lượng không hợp lệ", ops: [] };
  if (count > co["Quân Số"]) return { ok: false, error: `${co["Tên Đoàn"]} chỉ còn ${co["Quân Số"].toLocaleString("vi-VN")} tay giáo`, ops: [] };

  const upfront = Math.round((co["Tiền Ký Khế Ước"] * count) / Math.max(1, co["Quân Số"]));
  if (upfront > state["Thông Tin Nhân Vật"]["Ngân Khố"]) {
    return { ok: false, error: "Không đủ vàng đặt cọc khế ước", ops: [] };
  }

  const station = stationTerritoryId
    || Object.keys(state["Lãnh Địa"]).find((id) => canControlHolding(state, id))
    || "";
  const name = uniqueUnitName(state, co["Tên Đoàn"]);
  const troop = co["Binh Chủng"] as TroopTypeAll;

  const ops: PatchOp[] = [
    { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -upfront },
    {
      op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}`,
      value: newUnit(troop, count, "Đánh Thuê", {
        "Tướng Chỉ Huy": co["Tên Đoàn"],
        "Nhà": state["Thông Tin Nhân Vật"]["Nhà"] ?? "",
        "Huấn Luyện": co["Huấn Luyện"],
        "Lãnh Địa Đồn Trú": station,
        "Ngày Tập Hợp Còn Lại": musterDaysFor(troop, "Đánh Thuê", count),
        "Ghi Chú": co["Mô Tả"],
      }),
    },
    { op: "delta", path: `stat_data.Đội Đánh Thuê.${companyKey}.Quân Số`, value: -count },
  ];
  return { ok: true, ops, unitName: name };
}

// ── Giải ngũ & gia hạn nghĩa vụ (M19) ───────────────────────────────────────

/** Cho quân về nhà: dân phục dịch trả lại ruộng, chư hầu về thành của họ. */
export function disbandUnit(state: StatData, unitName: string): { ok: boolean; error?: string; ops: PatchOp[] } {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị", ops: [] };
  const br = branchMeta(unit["Ngạch"]);
  if (!br.dismissible) return { ok: false, error: "Ngạch quân này không giải ngũ được", ops: [] };

  const ops: PatchOp[] = [{ op: "remove", path: `stat_data.Biên Chế Quân Sự.${unitName}` }];
  const home = unit["Lãnh Địa Đồn Trú"];
  const back = Math.round(unit["Số Lượng"] * br.popPerSoldier);
  if (back > 0 && state["Lãnh Địa"][home]) {
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${home}.Dân Số`, value: back });
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${home}.Dân Số Chi Tiết.Nông Dân`, value: back });
    // cho lính về đúng kỳ hạn thì dân biết ơn
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${home}.Trung Thành`, value: 2 });
  }
  if (unit["Thuộc Chư Hầu"] && state["Chư Hầu"]?.[unit["Thuộc Chư Hầu"]]) {
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${unit["Thuộc Chư Hầu"]}.Trạng Thái`, value: "Ở Nhà" });
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${unit["Thuộc Chư Hầu"]}.Quân Đã Gửi`, value: 0 });
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${unit["Thuộc Chư Hầu"]}.Ngày Tòng Quân`, value: 0 });
    ops.push({ op: "delta", path: `stat_data.Chư Hầu.${unit["Thuộc Chư Hầu"]}.Trung Thành`, value: 3 });
  }
  return { ok: true, ops };
}

/**
 * Gia hạn nghĩa vụ quân dịch: giữ dân cày ngoài đồng thêm một kỳ nữa. Tốn vàng
 * (bồi thường mùa màng) và bào lòng dân — đúng cái giá lịch sử của việc bắt
 * nông dân bỏ vụ.
 */
export function extendService(state: StatData, unitName: string, days = 60): { ok: boolean; error?: string; ops: PatchOp[] } {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị", ops: [] };
  if (unit["Hạn Phục Dịch Còn Lại"] <= 0 && branchMeta(unit["Ngạch"]).serviceDays === 0) {
    return { ok: false, error: "Đơn vị này không có hạn nghĩa vụ", ops: [] };
  }
  const gold = Math.round(unit["Số Lượng"] * 0.4) * EXCHANGE_RATES.GOLD_TO_COPPER;
  if (gold > state["Thông Tin Nhân Vật"]["Ngân Khố"]) return { ok: false, error: "Không đủ vàng bồi thường mùa màng", ops: [] };

  const home = unit["Lãnh Địa Đồn Trú"];
  const ops: PatchOp[] = [
    { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -gold },
    { op: "delta", path: `stat_data.Biên Chế Quân Sự.${unitName}.Hạn Phục Dịch Còn Lại`, value: days },
  ];
  if (state["Lãnh Địa"][home]) {
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${home}.Trung Thành`, value: -5 });
  }
  return { ok: true, ops };
}

// ── Di chuyển (11.4) ─────────────────────────────────────────────────────────
const PX_PER_MONTH = 260; // quãng đường 1 tháng hành quân (px ảnh gốc)

/** Khoảng cách 2 vùng theo px trọng trấn (9.2) → dùng quy ra số ngày hành quân. */
export function calcMapDistance(fromId: string, toId: string): number {
  const a = REGIONS_BY_ID[fromId];
  const b = REGIONS_BY_ID[toId];
  if (!a || !b) return 3;
  return Math.hypot(a.seatXY[0] - b.seatXY[0], a.seatXY[1] - b.seatXY[1]);
}

export function distanceToDays(px: number): number {
  return Math.max(1, turnsToDays(px / PX_PER_MONTH));
}

/** Ngày hành quân của MỘT đơn vị — binh chủng chậm thì đi lâu (M19). */
export function marchDaysFor(unit: MilitaryUnit, fromId: string, toId: string): number {
  const base = distanceToDays(calcMapDistance(fromId, toId));
  const speed = troopMeta(unit["Loại Quân"]).speed || 1;
  // hậu cần kiệt quệ thì lê lết
  const logi = unit["Hậu Cần"] === "Cực Kỳ Thiếu Thốn" ? 1.3 : unit["Hậu Cần"] === "Dồi Dào" ? 0.95 : 1;
  return Math.max(1, Math.round((base / speed) * logi));
}

export interface MoveResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  days?: number;
}

export function moveArmy(state: StatData, unitName: string, targetTerritoryId: string): MoveResult {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị", ops: [] };
  if (unit["Ngày Tập Hợp Còn Lại"] > 0) return { ok: false, error: "Đơn vị chưa tập hợp xong", ops: [] };
  if (unit["Ngày Huấn Luyện"] > 0) return { ok: false, error: "Đơn vị đang huấn luyện", ops: [] };
  if (!REGIONS_BY_ID[targetTerritoryId]) return { ok: false, error: "Đích không hợp lệ", ops: [] };
  const from = unit["Lãnh Địa Đồn Trú"] || (unit["Đang Di Chuyển Đến"] ?? "");
  if (from === targetTerritoryId && !unit["Đang Di Chuyển Đến"]) return { ok: false, error: "Đơn vị đã ở đó", ops: [] };
  const days = marchDaysFor(unit, from, targetTerritoryId);
  return {
    ok: true, days,
    ops: [
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Đang Di Chuyển Đến`, value: targetTerritoryId },
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Ngày Hành Quân Còn Lại`, value: days },
    ],
  };
}

/** Vị trí marker quân trên bản đồ theo % tiến trình di chuyển (9.3/11.4). */
export function armyMarkerPosition(unit: StatData["Biên Chế Quân Sự"][string]): [number, number] | null {
  const fromId = unit["Lãnh Địa Đồn Trú"];
  const from = REGIONS_BY_ID[fromId];
  const toId = unit["Đang Di Chuyển Đến"];
  if (!toId) return from ? from.seatXY : null;
  const to = REGIONS_BY_ID[toId];
  if (!from || !to) return to?.seatXY ?? from?.seatXY ?? null;
  const totalDays = Math.max(1, marchDaysFor(unit, fromId, toId));
  const progress = clampFrac(1 - unit["Ngày Hành Quân Còn Lại"] / totalDays);
  return [from.seatXY[0] + (to.seatXY[0] - from.seatXY[0]) * progress, from.seatXY[1] + (to.seatXY[1] - from.seatXY[1]) * progress];
}
function clampFrac(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── Kinh nghiệm trận mạc (M19) ──────────────────────────────────────────────

/** Bậc Huấn Luyện suy từ điểm kinh nghiệm — lính sống sót nhiều trận thì lên tay. */
export function trainingFromExperience(exp: number, base: MilitaryUnit["Huấn Luyện"]): MilitaryUnit["Huấn Luyện"] {
  const rank: MilitaryUnit["Huấn Luyện"][] = ["Rời Rạc", "Mới Lập Đội", "Thành Thạo", "Tinh Nhuệ"];
  const fromExp = exp >= 80 ? 3 : exp >= 45 ? 2 : exp >= 15 ? 1 : 0;
  return rank[Math.max(fromExp, rank.indexOf(base))];
}

/**
 * Thưởng kinh nghiệm sau trận cho các đơn vị tham chiến (combatStore gọi).
 * Thắng được nhiều hơn, nhưng thua mà sống sót cũng dạy được vài điều.
 */
export function awardBattleExperience(state: StatData, unitNames: string[], won: boolean): PatchOp[] {
  const ops: PatchOp[] = [];
  for (const name of unitNames) {
    const unit = state["Biên Chế Quân Sự"][name];
    if (!unit || unit["Số Lượng"] <= 0) continue;
    const gain = Math.round((won ? 12 : 7) * branchMeta(unit["Ngạch"]).expMult);
    const exp = Math.min(100, (unit["Kinh Nghiệm"] || 0) + gain);
    ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Kinh Nghiệm`, value: exp });
    ops.push({ op: "delta", path: `stat_data.Biên Chế Quân Sự.${name}.Số Trận Đã Đánh`, value: 1 });
    const newTrain = trainingFromExperience(exp, unit["Huấn Luyện"]);
    if (newTrain !== unit["Huấn Luyện"]) {
      ops.push({ op: "replace", path: `stat_data.Biên Chế Quân Sự.${name}.Huấn Luyện`, value: newTrain });
    }
  }
  return ops;
}

// ── Lính Đánh Thuê phản trắc (7.7) ──────────────────────────────────────────
export function sellswordWage(unit: StatData["Biên Chế Quân Sự"][string]): number {
  return troopMeta(unit["Loại Quân"]).mercenary || unit["Ngạch"] === "Đánh Thuê"
    ? unitMonthlyWage(unit)
    : 0;
}

/** Roll đổi phe: xác suất cao khi sĩ khí thấp. Seed → tái lập được (test). */
export function checkSellswordDefection(rng: () => number, moraleScore: number): boolean {
  const chance = 0.4 + (1 - moraleScore / 100) * 0.4; // 0.4..0.8
  return rng() < chance;
}

// ── loop NGÀY cho quân (11.4 + M19) ─────────────────────────────────────────

/** Đơn vị đang ở trong lãnh địa của phe ta → được tiếp tế tận kho. */
function isSupplied(state: StatData, unit: MilitaryUnit): boolean {
  if (unit["Đang Di Chuyển Đến"]) return false;
  const terr = state["Lãnh Địa"][unit["Lãnh Địa Đồn Trú"]];
  if (!terr) return false;
  return (terr["Tài Nguyên"]["Lương Thực"] ?? 0) > 0;
}

function moraleShift(unit: MilitaryUnit, delta: number): void {
  const score = MORALE_SCORE[unit["Sĩ Khí"]] + delta;
  unit["Sĩ Khí"] = moraleEnumFromScore(Math.max(0, Math.min(100, score)));
}

export function tickArmy(state: StatData): void {
  for (const [name, unit] of Object.entries(state["Biên Chế Quân Sự"])) {
    if (unit["Số Lượng"] <= 0) continue;

    // 1. TẬP HỢP — quạ bay đi, người từ các thôn lục tục kéo về điểm hẹn
    if ((unit["Ngày Tập Hợp Còn Lại"] || 0) > 0) {
      unit["Ngày Tập Hợp Còn Lại"] = Math.max(0, unit["Ngày Tập Hợp Còn Lại"] - 1);
      continue; // chưa tụ đủ thì chưa luyện, chưa đi đâu được
    }

    // 2. HUẤN LUYỆN
    if (unit["Ngày Huấn Luyện"] > 0) {
      unit["Ngày Huấn Luyện"] = Math.max(0, unit["Ngày Huấn Luyện"] - 1);
      if (unit["Ngày Huấn Luyện"] === 0) {
        unit["Kinh Nghiệm"] = Math.min(100, (unit["Kinh Nghiệm"] || 0) + 10);
        unit["Huấn Luyện"] = trainingFromExperience(unit["Kinh Nghiệm"], unit["Huấn Luyện"]);
      }
    }

    // 3. HÀNH QUÂN
    if (unit["Đang Di Chuyển Đến"]) {
      unit["Ngày Hành Quân Còn Lại"] = Math.max(0, unit["Ngày Hành Quân Còn Lại"] - 1);
      if (unit["Ngày Hành Quân Còn Lại"] <= 0) {
        unit["Lãnh Địa Đồn Trú"] = unit["Đang Di Chuyển Đến"];
        unit["Đang Di Chuyển Đến"] = undefined;
      }
    }

    // 4. HẬU CẦN — đóng ở đất nhà thì no đủ, ra ngoài thì đếm từng bao lương
    if (isSupplied(state, unit)) {
      unit["Lương Thực Mang Theo"] = MAX_SUPPLY_DAYS;
      if (unit["Hậu Cần"] !== "Dồi Dào") unit["Hậu Cần"] = "Dồi Dào";
    } else {
      unit["Lương Thực Mang Theo"] = Math.max(0, (unit["Lương Thực Mang Theo"] || 0) - 1);
      const left = unit["Lương Thực Mang Theo"];
      unit["Hậu Cần"] = left > 12 ? "Dồi Dào" : left > 0 ? "Cầm Cự Được" : "Cực Kỳ Thiếu Thốn";
      if (left === 0) {
        // đói thì lính trốn về, sĩ khí rơi từng ngày
        const desert = Math.max(1, Math.round(unit["Số Lượng"] * 0.005));
        unit["Số Lượng"] = Math.max(0, unit["Số Lượng"] - desert);
        moraleShift(unit, -2);
      }
    }

    // 5. THƯƠNG BINH — có ăn có thuốc thì một phần quay lại hàng ngũ
    if ((unit["Thương Binh"] || 0) > 0) {
      const heal = Math.max(1, Math.round(unit["Thương Binh"] * 0.03));
      const back = unit["Hậu Cần"] === "Cực Kỳ Thiếu Thốn" ? Math.floor(heal / 2) : heal;
      unit["Thương Binh"] = Math.max(0, unit["Thương Binh"] - heal);
      unit["Số Lượng"] += back;
    }

    // 6. HẠN NGHĨA VỤ — hết hạn là dân bỏ về gặt lúa, giữ lại không được
    if ((unit["Hạn Phục Dịch Còn Lại"] || 0) > 0) {
      unit["Hạn Phục Dịch Còn Lại"] -= 1;
      if (unit["Hạn Phục Dịch Còn Lại"] === 0) {
        releaseExpiredUnit(state, name, unit);
      } else if (unit["Hạn Phục Dịch Còn Lại"] < 15) {
        // sắp hết hạn: lính đã nghĩ tới đồng ruộng chứ không tới trận
        moraleShift(unit, -1);
      }
    }

    if (unit["Số Lượng"] <= 0) delete state["Biên Chế Quân Sự"][name];
  }
}

/** Hết hạn nghĩa vụ: quân tan, người về ruộng, lòng dân nhích lên vì được về đúng hẹn. */
function releaseExpiredUnit(state: StatData, name: string, unit: MilitaryUnit): void {
  const br = branchMeta(unit["Ngạch"]);
  const home = state["Lãnh Địa"][unit["Lãnh Địa Đồn Trú"]];
  const back = Math.round(unit["Số Lượng"] * br.popPerSoldier);
  if (home && back > 0) {
    home["Dân Số"] += back;
    home["Dân Số Chi Tiết"]["Nông Dân"] += back;
  }
  if (unit["Thuộc Chư Hầu"]) {
    const v = state["Chư Hầu"]?.[unit["Thuộc Chư Hầu"]];
    if (v) {
      v["Trạng Thái"] = "Ở Nhà";
      v["Quân Đã Gửi"] = 0;
      v["Ngày Tòng Quân"] = 0;
    }
  }
  state["Thế Giới"]["_Tin Nóng Off-screen"] =
    `${name} hết hạn nghĩa vụ, lính rã ngũ về quê.`;
  delete state["Biên Chế Quân Sự"][name];
}

// ── loop THÁNG: quân lương (M19 mở rộng) ────────────────────────────────────

export function tickMercenaryWages(state: StatData): void {
  const tick = state["_engineMeta"]["_Nhịp"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  const house = state["Thông Tin Nhân Vật"]["Nhà"];

  let totalWages = 0;
  const paid: string[] = [];
  const mercenaries: string[] = [];

  for (const [name, unit] of Object.entries(state["Biên Chế Quân Sự"])) {
    if (unit["Số Lượng"] <= 0) continue;
    if (house && unit["Nhà"] && unit["Nhà"] !== house) continue;
    const wage = unitMonthlyWage(unit);
    if (wage <= 0) continue;
    totalWages += wage;
    paid.push(name);
    if (branchMeta(unit["Ngạch"]).canDefect) mercenaries.push(name);
  }

  if (paid.length === 0) return;

  const gold = state["Thông Tin Nhân Vật"]["Ngân Khố"];
  if (gold >= totalWages) {
    state["Thông Tin Nhân Vật"]["Ngân Khố"] = gold - totalWages;
    return;
  }

  // KHÔNG ĐỦ TIỀN TRẢ LƯƠNG — đám đánh thuê roll đổi phe, quân nhà thì mất khí
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = 0;
  for (const name of mercenaries) {
    const unit = state["Biên Chế Quân Sự"][name];
    if (!unit) continue;
    const rng = makeRng(eventSeed(rootSeed, tick, `defect-${name}`));
    if (checkSellswordDefection(rng, MORALE_SCORE[unit["Sĩ Khí"]])) {
      delete state["Biên Chế Quân Sự"][name]; // đội đánh thuê bỏ đi
      state["Thế Giới"]["_Tin Nóng Off-screen"] = `${name} xé khế ước và rời trại — vàng đã cạn.`;
    }
  }
  for (const name of paid) {
    const unit = state["Biên Chế Quân Sự"][name];
    if (!unit) continue;
    moraleShift(unit, -12);
  }
}

/**
 * Cái giá xã hội của việc giữ quân ngoài đồng (M19): ruộng bỏ hoang, đàn bà
 * gánh cày, lòng dân trôi đi từng tháng. Quân chư hầu thì bào lòng trung của
 * chính chư hầu đó.
 */
export function tickMobilizationStrain(state: StatData): void {
  for (const unit of Object.values(state["Biên Chế Quân Sự"])) {
    if (unit["Số Lượng"] <= 0) continue;
    const br = branchMeta(unit["Ngạch"]);
    const terr = state["Lãnh Địa"][unit["Lãnh Địa Đồn Trú"]];
    if (terr && br.loyaltyDrainPer1000 > 0) {
      const drain = (unit["Số Lượng"] / 1000) * br.loyaltyDrainPer1000;
      terr["Trung Thành"] = Math.max(0, Math.round((terr["Trung Thành"] - drain) * 10) / 10);
    }
    const vassalId = unit["Thuộc Chư Hầu"];
    if (vassalId) {
      const v = state["Chư Hầu"]?.[vassalId];
      if (v) {
        v["Ngày Tòng Quân"] = (v["Ngày Tòng Quân"] || 0) + 30;
        // ba tháng đầu là nghĩa vụ; sau đó là ân oán
        if (v["Ngày Tòng Quân"] > 90) v["Trung Thành"] = Math.max(0, v["Trung Thành"] - 3);
      }
    }
  }
}

let registered = false;
export function registerArmyLoop(): void {
  if (registered) return;
  registerDailyListener("army", tickArmy);
  registerMonthlyListener("army-wages", tickMercenaryWages);
  registerMonthlyListener("army-strain", tickMobilizationStrain);
  registered = true;
}
