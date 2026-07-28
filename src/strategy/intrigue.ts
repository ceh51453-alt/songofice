/**
 * intrigue (14.1-14.4) — chính trị & mưu đồ: engine giữ số ÍT nhưng đủ cơ chế.
 * - Tình Báo (14.1): cài điệp viên (tốn Vàng), tickIntelligence thu tin theo Độ
 *   Sâu (seeded) + Bị Nghi Ngờ tăng → bị bắt ở 100; Đại Điệp Viên (13.1) giảm
 *   "Bị Cài Điệp Viên" + tăng hiệu quả ("little birds" của Varys).
 * - Âm Mưu (14.2): startPlot/advancePlot (Tiến Độ đua Độ Bại Lộ theo Trí Tuệ +
 *   Mưu Lược + số đồng mưu + Vàng đầu tư) → resolvePlot qua resolveCheck (5bis).
 * - Hành động lẻ (14.3): ám sát/tống tiền qua resolveCheck opposed — engine roll,
 *   AI kể; Đại Thất Bại = sát thủ lộ → hậu quả ngoại giao.
 * - Con Tin (14.4): tiền chuộc (Vàng) / trao đổi / hành quyết (tụt danh tiếng +
 *   đẩy Nhà đối phương vào Thù Địch) / đổi cách đối xử.
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener } from "../mvu/effects";
import { formatDateShort } from "../mvu/calendar";
import { clamp } from "../mvu/helpers";
import { makeRng, eventSeed } from "../probability/rng";
import { resolveCheck, type CheckActor, type CheckResult } from "../probability/resolveCheck";
import { isSuccess } from "../probability/grades";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { findNpc, isSeatFilled, courtInvolved, playerIsRulingLord } from "./court";
import { improveHouseAttitudeOps } from "./succession";

// ── Helpers chung ─────────────────────────────────────────────────────────────
/** CheckActor người chơi từ Chỉ Số Cốt Lõi + Kỹ Năng (5bis.2). */
export function playerActor(state: StatData): CheckActor {
  const skills: Record<string, number> = {};
  for (const [k, v] of Object.entries(state["Kỹ Năng"])) skills[k] = v["Cấp"];
  return { stats: { ...state["Chỉ Số Cốt Lõi"] }, skills };
}

function npcGroup(state: StatData, name: string): "NPC Chính" | "Thành Viên Gia Tộc" | null {
  if (state["Mối Quan Hệ"]["NPC Chính"][name]) return "NPC Chính";
  if (state["Mối Quan Hệ"]["Thành Viên Gia Tộc"][name]) return "Thành Viên Gia Tộc";
  return null;
}

/** Năng Lực Đại Điệp Viên (13.1) — 0 nếu ghế khuyết. */
export function whisperAbility(state: StatData): number {
  const seat = state["Triều Đình"]["Tiểu Hội Đồng"]["Đại Điệp Viên"];
  return isSeatFilled(seat) ? seat["Năng Lực"] : 0;
}

/** Đặt Thái Độ 1 Nhà về mức cụ thể (key = houseId/schemaName). */
function setHouseAttitudeOps(house: string, attitude: string): PatchOp[] {
  if (!house) return [];
  const schemaName = HOUSES_BY_ID[house]?.schemaName ?? house;
  return [{ op: "replace", path: `stat_data.Thái Độ Các Nhà.${schemaName}.Thái Độ`, value: attitude }];
}

/** Icon Mưu Đồ hiện khi có điệp viên/âm mưu/con tin, hoặc đã dính líu triều chính (14.5). */
export function intrigueAvailable(state: StatData): boolean {
  if (Object.keys(state["Tình Báo"]["Điệp Viên"]).length > 0) return true;
  if (Object.keys(state["Âm Mưu"]).length > 0) return true;
  if (Object.keys(state["Tù Binh"]).length > 0) return true;
  if (Object.keys(state["Tình Báo"]["Tin Tình Báo Đã Biết"]).length > 0) return true;
  return courtInvolved(state) || playerIsRulingLord(state);
}

// ── Tình báo & điệp viên (14.1) ──────────────────────────────────────────────
export const SPY_RECRUIT_COST = 500;
const SPY_BASE_SUSPICION = 6;
const RISKY_MISSIONS = new Set(["Phá Hoại", "Tung Tin Đồn", "Ám Sát (chuẩn bị)"]);

export interface OpsResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

/** Tuyển 1 điệp viên cài ở mục tiêu (14.1) — tốn Vàng. */
export function recruitSpyOps(state: StatData, alias: string, target: string, cost = SPY_RECRUIT_COST): OpsResult {
  if (!alias.trim()) return { ok: false, error: "Cần bí danh điệp viên", ops: [] };
  if (state["Tình Báo"]["Điệp Viên"][alias]) return { ok: false, error: "Bí danh đã tồn tại", ops: [] };
  if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < cost) return { ok: false, error: "Không đủ Vàng để tuyển", ops: [] };
  return {
    ok: true,
    ops: [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -cost },
      {
        op: "replace", path: `stat_data.Tình Báo.Điệp Viên.${alias}`,
        value: { "Cài Ở": target, "Độ Sâu Thâm Nhập": 10, "Bị Nghi Ngờ": 0, "Nhiệm Vụ": "Thu Thập Tin" },
      },
    ],
  };
}

export function setSpyMissionOps(alias: string, mission: string): PatchOp[] {
  return [{ op: "replace", path: `stat_data.Tình Báo.Điệp Viên.${alias}.Nhiệm Vụ`, value: mission }];
}

/** Rút điệp viên về (an toàn trước khi lộ). */
export function recallSpyOps(alias: string): PatchOp[] {
  return [{ op: "remove", path: `stat_data.Tình Báo.Điệp Viên.${alias}` }];
}

/** 1 tick NGÀY tình báo (14.1): thu tin + tăng nghi ngờ + bị bắt ở ngưỡng. MUTATE state. */
export function tickIntelligence(state: StatData): void {
  const tick = state["_engineMeta"]["_Nhịp"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  const master = whisperAbility(state);
  const intel = state["Tình Báo"];

  // Đại Điệp Viên giảm mức bị địch cài mỗi ngày (little birds)
  if (master > 0) intel["Bị Cài Điệp Viên"] = clamp(intel["Bị Cài Điệp Viên"] - Math.round(master / 20), 0, 100);

  for (const [name, spy] of Object.entries(intel["Điệp Viên"])) {
    const depth = spy["Độ Sâu Thâm Nhập"];
    const mission = spy["Nhiệm Vụ"];

    if (mission === "Nằm Vùng") {
      // ẩn mình: hạ nghi ngờ, đào sâu thâm nhập, không gửi tin
      spy["Bị Nghi Ngờ"] = clamp(spy["Bị Nghi Ngờ"] - 4, 0, 100);
      spy["Độ Sâu Thâm Nhập"] = clamp(depth + 2, 0, 100);
      continue;
    }

    if (mission === "Thu Thập Tin") {
      const rng = makeRng(eventSeed(rootSeed, tick, `intel:${name}`));
      const chance = 0.25 + depth / 200 + master / 400;
      if (rng() < chance) {
        const key = `Tin từ ${spy["Cài Ở"] || name} (${formatDateShort(state["Thế Giới"])})`;
        if (!intel["Tin Tình Báo Đã Biết"][key]) {
          intel["Tin Tình Báo Đã Biết"][key] = `Điệp viên ${name} thu được tin tức từ ${spy["Cài Ở"] || "mục tiêu"}.`;
        }
      }
      spy["Độ Sâu Thâm Nhập"] = clamp(depth + 1, 0, 100);
    }

    // nghi ngờ tăng (thâm nhập sâu + Đại Điệp Viên bảo trợ → chậm lộ; nhiệm vụ rủi ro → nhanh lộ)
    const riskBonus = RISKY_MISSIONS.has(mission) ? 6 : 0;
    const inc = Math.max(1, SPY_BASE_SUSPICION - Math.round(depth / 12) + riskBonus - Math.round(master / 30));
    spy["Bị Nghi Ngờ"] = clamp(spy["Bị Nghi Ngờ"] + inc, 0, 100);

    if (spy["Bị Nghi Ngờ"] >= 100) {
      delete intel["Điệp Viên"][name];
      intel["_Điệp Viên Vừa Lộ"] = name; // AI tường thuật bị bắt (14.1)
    }
  }
}

// ── Âm mưu (14.2) ─────────────────────────────────────────────────────────────
export const PLOT_EXPOSURE_THRESHOLD = 70;

export interface PlotSeed {
  "Loại": string;
  "Mục Tiêu": string;
  "Đồng Mưu": string[];
}

export function startPlotOps(name: string, seed: PlotSeed): PatchOp[] {
  return [{
    op: "replace", path: `stat_data.Âm Mưu.${name}`,
    value: { "Loại": seed["Loại"], "Mục Tiêu": seed["Mục Tiêu"], "Tiến Độ": 0, "Đồng Mưu": seed["Đồng Mưu"], "Độ Bại Lộ": 0 },
  }];
}

export interface AdvancePlotResult {
  ops: PatchOp[];
  progress: number;
  exposure: number;
  /** vừa vượt ngưỡng bại lộ lượt này → mục tiêu phản đòn (14.2). */
  exposed: boolean;
}

/** Đẩy 1 âm mưu (14.2): Tiến Độ + theo Trí Tuệ+Mưu Lược+đồng mưu+Vàng; Độ Bại Lộ + theo đồng mưu. */
export function advancePlotOps(state: StatData, name: string, resourcesInvested = 0): AdvancePlotResult {
  const plot = state["Âm Mưu"][name];
  if (!plot) return { ops: [], progress: 0, exposure: 0, exposed: false };

  const intellect = state["Chỉ Số Cốt Lõi"]["Trí Tuệ"];
  const scheme = state["Kỹ Năng"]["Mưu Lược"]?.["Cấp"] ?? 0;
  const allies = plot["Đồng Mưu"].length;
  // đồng mưu bất mãn (Hảo Cảm < 0) đẩy Độ Bại Lộ (bài học phản bội)
  const disloyal = plot["Đồng Mưu"].filter((n) => (findNpc(state, n)?.["Độ Hảo Cảm"] ?? 0) < 0).length;

  const progressGain = Math.max(2, Math.round(5 + (intellect - 8) * 0.8 + scheme * 2 + allies * 3 + resourcesInvested / 200));
  const exposureGain = Math.round(3 + allies * 2 + disloyal * 5 + resourcesInvested / 400);

  const newProgress = clamp(plot["Tiến Độ"] + progressGain, 0, 100);
  const newExposure = clamp(plot["Độ Bại Lộ"] + exposureGain, 0, 100);
  const exposed = newExposure >= PLOT_EXPOSURE_THRESHOLD && plot["Độ Bại Lộ"] < PLOT_EXPOSURE_THRESHOLD;

  const ops: PatchOp[] = [
    { op: "replace", path: `stat_data.Âm Mưu.${name}.Tiến Độ`, value: newProgress },
    { op: "replace", path: `stat_data.Âm Mưu.${name}.Độ Bại Lộ`, value: newExposure },
  ];
  if (resourcesInvested > 0) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -resourcesInvested });
  return { ops, progress: newProgress, exposure: newExposure, exposed };
}

export interface PlotResolveResult {
  ops: PatchOp[];
  result: CheckResult;
  success: boolean;
}

/**
 * Kích hoạt 1 âm mưu khi Tiến Độ đạt 100 (14.2) — resolveCheck "scheme"
 * (Trí Tuệ + Mưu Lược) vs phòng bị mục tiêu. Xoá âm mưu; thành/bại có hệ quả cơ học.
 */
export function resolvePlot(state: StatData, name: string, seed: number): PlotResolveResult | null {
  const plot = state["Âm Mưu"][name];
  if (!plot || plot["Tiến Độ"] < 100) return null;

  const target = findNpc(state, plot["Mục Tiêu"]);
  const guard = target ? Math.round((target["Năng Lực"]["Trí Mưu"] + target["Năng Lực"]["Võ Lực"]) / 2) : 40;
  const dc = clamp(25 + Math.round(guard / 3), 15, 80);
  const result = resolveCheck({ checkId: "scheme", actor: playerActor(state), difficulty: dc, seed });
  const success = isSuccess(result.grade);

  const ops: PatchOp[] = [{ op: "remove", path: `stat_data.Âm Mưu.${name}` }];
  const group = npcGroup(state, plot["Mục Tiêu"]);
  if (success) {
    // ám sát/đầu độc → mục tiêu chết; loại khác → AI tường thuật hệ quả chính trị
    if ((plot["Loại"] === "Ám Sát" || plot["Loại"] === "Đầu Độc") && group) {
      ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.${group}.${plot["Mục Tiêu"]}.Còn Sống`, value: false });
      ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.${group}.${plot["Mục Tiêu"]}.Nguyên Nhân Nếu Mất`, value: `Âm mưu: ${name}` });
    }
  } else {
    // thất bại → mục tiêu phản đòn: Nhà mục tiêu (nếu rõ) trở nên thù địch
    const house = target?.["Nhà"];
    if (house) ops.push(...setHouseAttitudeOps(house, "Thù Địch"));
  }
  return { ops, result, success };
}

// ── Hành động lẻ (14.3) ───────────────────────────────────────────────────────
/** Có điệp viên "Ám Sát (chuẩn bị)" cài ở Nhà mục tiêu → bonus ám sát. */
function hasPreparedAssassin(state: StatData, targetHouse?: string): boolean {
  return Object.values(state["Tình Báo"]["Điệp Viên"]).some(
    (s) => s["Nhiệm Vụ"] === "Ám Sát (chuẩn bị)" && (!targetHouse || s["Cài Ở"].includes(targetHouse)),
  );
}

export interface HitResult {
  ops: PatchOp[];
  result: CheckResult;
  killed: boolean;
  /** Đại Thất Bại — sát thủ bị bắt, lộ danh tính (14.3). */
  exposed: boolean;
}

/**
 * Ám sát 1 NPC (14.3) — resolveCheck opposed (Nhanh Nhẹn + Ẩn Nấp vs phòng bị).
 * Cần điệp viên chuẩn bị (bonus) hoặc chịu phạt. Engine roll, AI kể.
 */
export function attemptAssassination(state: StatData, targetName: string, seed: number): HitResult {
  const target = findNpc(state, targetName);
  const guard = target ? Math.round((target["Năng Lực"]["Võ Lực"] + target["Năng Lực"]["Trí Mưu"]) / 2) : 40;
  const dc = clamp(30 + Math.round(guard / 3), 20, 85);
  const prepared = hasPreparedAssassin(state, target?.["Nhà"]);
  const result = resolveCheck({
    checkId: "assassinate", actor: playerActor(state), difficulty: dc, circumstance: prepared ? 15 : -10, seed,
  });
  const killed = isSuccess(result.grade);
  const exposed = result.grade === "Đại Thất Bại";

  const ops: PatchOp[] = [];
  const group = npcGroup(state, targetName);
  if (killed && group) {
    ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.${group}.${targetName}.Còn Sống`, value: false });
    ops.push({ op: "replace", path: `stat_data.Mối Quan Hệ.${group}.${targetName}.Nguyên Nhân Nếu Mất`, value: "Bị ám sát" });
  }
  if (exposed && target?.["Nhà"]) {
    ops.push(...setHouseAttitudeOps(target["Nhà"], "Thù Địch")); // lộ danh tính → hậu quả ngoại giao
  }
  return { ops, result, killed, exposed };
}

// ── Tống tiền (14.3) ──────────────────────────────────────────────────────────
/** Có tin tình báo để làm đòn bẩy? (mở lựa chọn tống tiền). */
export function hasIntel(state: StatData): boolean {
  return Object.keys(state["Tình Báo"]["Tin Tình Báo Đã Biết"]).length > 0;
}

export interface BlackmailResult {
  ops: PatchOp[];
  result: CheckResult;
  success: boolean;
}

/**
 * Tống tiền 1 NPC bằng 1 tin tình báo (14.3) — ép làm theo thay vì giết.
 * resolveCheck "blackmail" (Uy Tín + Hù Doạ). Thành công: NPC oán (Hảo Cảm giảm)
 * nhưng khuất phục (AI kể). Tiêu 1 tin tình báo.
 */
export function blackmailOps(state: StatData, npcName: string, intelKey: string, seed: number): BlackmailResult {
  const result = resolveCheck({ checkId: "blackmail", actor: playerActor(state), difficulty: "Thường", seed });
  const success = isSuccess(result.grade);
  const ops: PatchOp[] = [];
  if (intelKey && state["Tình Báo"]["Tin Tình Báo Đã Biết"][intelKey]) {
    ops.push({ op: "remove", path: `stat_data.Tình Báo.Tin Tình Báo Đã Biết.${intelKey}` });
  }
  const group = npcGroup(state, npcName);
  if (group) {
    // bị ép: oán hận (Hảo Cảm giảm) — khuất phục hay liều phản kháng để AI kể theo grade
    ops.push({ op: "delta", path: `stat_data.Mối Quan Hệ.${group}.${npcName}.Độ Hảo Cảm`, value: success ? -8 : -15 });
  }
  return { ops, result, success };
}

// ── Con tin & tù binh (14.4) ──────────────────────────────────────────────────
/** Đòi tiền chuộc: cộng Giá Chuộc vào Vàng, thả con tin, trung hoà quan hệ (14.4). */
export function ransomOps(state: StatData, name: string): PatchOp[] {
  const c = state["Tù Binh"][name];
  if (!c) return [];
  const ops: PatchOp[] = [];
  if (c["Giá Chuộc"] > 0) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: c["Giá Chuộc"] });
  ops.push({ op: "remove", path: `stat_data.Tù Binh.${name}` });
  if (c["Nhà"]) ops.push(...improveHouseAttitudeOps(state, c["Nhà"], 1)); // thả người → dịu 1 bậc
  return ops;
}

/** Trao đổi con tin (không Vàng) — thiện chí, nâng Thái Độ Nhà đối phương 2 bậc (14.4). */
export function exchangeOps(state: StatData, name: string): PatchOp[] {
  const c = state["Tù Binh"][name];
  if (!c) return [];
  const ops: PatchOp[] = [{ op: "remove", path: `stat_data.Tù Binh.${name}` }];
  if (c["Nhà"]) ops.push(...improveHouseAttitudeOps(state, c["Nhà"], 2));
  return ops;
}

/** Hành quyết con tin (14.4) — tụt danh tiếng Nhân Từ + đẩy Nhà đối phương vào Thù Địch vĩnh viễn. */
export function executeOps(state: StatData, name: string): PatchOp[] {
  const c = state["Tù Binh"][name];
  if (!c) return [];
  const ops: PatchOp[] = [
    { op: "remove", path: `stat_data.Tù Binh.${name}` },
    { op: "delta", path: "stat_data.Danh Vọng.Nhân Từ", value: -15 },
    { op: "delta", path: "stat_data.Danh Vọng.Uy Dũng", value: 5 },
  ];
  if (c["Nhà"]) ops.push(...setHouseAttitudeOps(c["Nhà"], "Thù Địch"));
  return ops;
}

/** Đổi cách đối xử con tin (14.4) — Khách Quý dịu quan hệ, Ngục Tối xấu đi. */
export function setTreatmentOps(state: StatData, name: string, treatment: string): PatchOp[] {
  const c = state["Tù Binh"][name];
  if (!c) return [];
  const ops: PatchOp[] = [{ op: "replace", path: `stat_data.Tù Binh.${name}.Đối Xử`, value: treatment }];
  if (c["Nhà"]) {
    if (treatment === "Khách Quý") ops.push(...improveHouseAttitudeOps(state, c["Nhà"], 1));
    else if (treatment === "Ngục Tối") ops.push(...improveHouseAttitudeOps(state, c["Nhà"], -1));
  }
  return ops;
}

let registered = false;
export function registerIntelligenceLoop(): void {
  if (registered) return;
  registerDailyListener("intelligence", tickIntelligence);
  registered = true;
}
