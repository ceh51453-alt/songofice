/**
 * construction (10.3) — cơ chế xây dựng + turn-advance loop cho lãnh địa:
 * - startConstruction: kiểm tra tài nguyên → trừ NGAY → xếp vào hàng đợi xây.
 *   Vàng trừ ngân khố thống nhất (Thông Tin Nhân Vật.Vàng — 15 note); Gỗ/Đá/
 *   Quặng/Lương Thực trừ kho vùng. Trả PatchOp[] cho ENGINE áp (không qua AI).
 * - registerConstructionLoop: 1 tick = 1 ngày truyện (6.2) — hạ Turn Còn Lại,
 *   hoàn tất công trình, cộng thu/chi (10.3). AI KHÔNG giữ số này.
 */
import type { StatData, Terrain } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerTurnListener } from "../mvu/effects";
import {
  BUILDING_CATALOG, buildingCost, buildingTurns, type BuildingType, type ResourceKey,
} from "../content/westeros/buildings";
import { treasuryMultiplier } from "../strategy/court";
import { clamp } from "../mvu/helpers";

export interface BuildResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

const RES_KEYS: ResourceKey[] = ["Vàng", "Lương Thực", "Gỗ", "Đá", "Quặng Sắt"];

/** Có "Học Viện Nhỏ" đã xây xong → giảm thời gian xây (adminSpeedup). */
function adminSpeedup(territory: StatData["Lãnh Địa"][string]): number {
  let best = 0;
  for (const b of Object.values(territory["Công Trình"])) {
    if (b["Đang Xây"]) continue;
    const flag = BUILDING_CATALOG[b["Loại"]].flags?.adminSpeedup;
    if (flag && flag > best) best = flag;
  }
  return best;
}

/**
 * Khởi công / nâng cấp 1 công trình. name mặc định = loại (mỗi loại 1 công
 * trình/lãnh địa; xây lại = nâng cấp). Trả ops trừ tài nguyên + xếp hàng đợi.
 */
export function startConstruction(
  state: StatData,
  territoryId: string,
  type: BuildingType,
  name?: string,
): BuildResult {
  const territory = state["Lãnh Địa"][territoryId];
  if (!territory) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };

  const def = BUILDING_CATALOG[type];
  if (def.requiresCoastal && !territory["Ven Biển"]) {
    return { ok: false, error: `${type} chỉ xây được ở lãnh địa ven biển`, ops: [] };
  }

  const buildingName = name?.trim() || type;
  const existing = territory["Công Trình"][buildingName];
  if (existing?.["Đang Xây"]) {
    return { ok: false, error: `${buildingName} đang được xây dựng`, ops: [] };
  }
  const nextLevel = existing ? existing["Cấp Độ"] + 1 : 1;

  const cost = buildingCost(type, nextLevel);
  const playerGold = state["Thông Tin Nhân Vật"]["Vàng"];
  const stock = territory["Tài Nguyên"];

  // kiểm tra đủ tài nguyên (Vàng ở ngân khố, còn lại ở kho vùng)
  const missing: string[] = [];
  if ((cost["Vàng"] ?? 0) > playerGold) missing.push("Vàng");
  for (const k of RES_KEYS) {
    if (k === "Vàng") continue;
    if ((cost[k] ?? 0) > (stock[k] ?? 0)) missing.push(k);
  }
  if (missing.length > 0) {
    return { ok: false, error: `Thiếu tài nguyên: ${missing.join(", ")}`, ops: [] };
  }

  const turns = buildingTurns(type, nextLevel, adminSpeedup(territory));
  const ops: PatchOp[] = [];
  if (cost["Vàng"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: -cost["Vàng"] });
  for (const k of RES_KEYS) {
    if (k === "Vàng" || !cost[k]) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: -(cost[k] ?? 0) });
  }
  ops.push({
    op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}`,
    value: { "Loại": type, "Cấp Độ": nextLevel, "Đang Xây": true, "Turn Còn Lại": turns },
  });
  return { ok: true, ops };
}

/** Huỷ công trình đang xây — hoàn 50% tài nguyên (10.4). */
export function cancelConstruction(state: StatData, territoryId: string, buildingName: string): PatchOp[] {
  const b = state["Lãnh Địa"][territoryId]?.["Công Trình"]?.[buildingName];
  if (!b || !b["Đang Xây"]) return [];
  const cost = buildingCost(b["Loại"], b["Cấp Độ"]);
  const ops: PatchOp[] = [];
  if (cost["Vàng"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: Math.round((cost["Vàng"] ?? 0) * 0.5) });
  for (const k of RES_KEYS) {
    if (k === "Vàng" || !cost[k]) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: Math.round((cost[k] ?? 0) * 0.5) });
  }
  if (b["Cấp Độ"] > 1) {
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Đang Xây`, value: false });
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Turn Còn Lại`, value: 0 });
  } else {
    ops.push({ op: "remove", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}` });
  }
  return ops;
}

/** Sản lượng nền mỗi turn theo địa hình + dân số (không cần công trình). */
function baseProduction(territory: StatData["Lãnh Địa"][string]): Record<ResourceKey, number> {
  const pop = territory["Dân Số"];
  const out: Record<ResourceKey, number> = { "Vàng": 0, "Lương Thực": Math.round(pop * 0.01), "Gỗ": 15, "Đá": 12, "Quặng Sắt": 6 };
  const terrain: Terrain | undefined = territory["Địa Hình"];
  if (terrain === "Rừng Rậm") out["Gỗ"] += 20;
  else if (terrain === "Đồi Núi") { out["Đá"] += 15; out["Quặng Sắt"] += 10; }
  else if (terrain === "Đồng Bằng") out["Lương Thực"] += Math.round(pop * 0.01);
  out["Vàng"] += Math.round(pop * 0.005); // thuế cơ bản → ngân khố
  return out;
}

/** Ước lượng thu ±/turn của 1 lãnh địa (base + công trình) — cho UI Tổng Quan (10.4). */
export function estimateTerritoryYield(
  territory: StatData["Lãnh Địa"][string],
): Record<ResourceKey, number> & { "Lòng Dân": number } {
  const base = baseProduction(territory);
  const out: Record<ResourceKey, number> & { "Lòng Dân": number } = { ...base, "Lòng Dân": 0 };
  for (const b of Object.values(territory["Công Trình"])) {
    if (b["Đang Xây"]) continue;
    const def = BUILDING_CATALOG[b["Loại"]];
    if (def.yield) for (const [k, v] of Object.entries(def.yield)) out[k as ResourceKey] += (v ?? 0) * b["Cấp Độ"];
    if (def.flags?.loyaltyPerTurn) out["Lòng Dân"] += def.flags.loyaltyPerTurn * b["Cấp Độ"];
  }
  return out;
}

/**
 * 1 tick turn-advance (10.3): hạ tiến độ xây, cộng thu/chi. MUTATE state (chạy
 * trong runCascadeEffects, state đã qua schema). Vàng vào ngân khố thống nhất.
 */
export function tickConstruction(state: StatData): void {
  // Đại Chưởng Ngân Khố Năng Lực cao → +% thu Vàng toàn lãnh thổ (13.1 → 10.3)
  const coinMult = treasuryMultiplier(state);
  for (const territory of Object.values(state["Lãnh Địa"])) {
    let goldIncome = 0;
    let loyaltyGain = 0;
    const stock = territory["Tài Nguyên"];

    // 1) tiến độ xây dựng
    for (const b of Object.values(territory["Công Trình"])) {
      if (b["Đang Xây"]) {
        b["Turn Còn Lại"] = Math.max(0, b["Turn Còn Lại"] - 1);
        if (b["Turn Còn Lại"] <= 0) b["Đang Xây"] = false;
      }
    }

    // 2) sản lượng nền
    const base = baseProduction(territory);
    stock["Lương Thực"] += base["Lương Thực"];
    stock["Gỗ"] += base["Gỗ"];
    stock["Đá"] += base["Đá"];
    stock["Quặng Sắt"] += base["Quặng Sắt"];
    goldIncome += base["Vàng"];

    // 3) thu từ công trình đã xây xong (×Cấp Độ)
    for (const b of Object.values(territory["Công Trình"])) {
      if (b["Đang Xây"]) continue;
      const def = BUILDING_CATALOG[b["Loại"]];
      if (def.yield) {
        for (const [k, v] of Object.entries(def.yield)) {
          const amount = (v ?? 0) * b["Cấp Độ"];
          if (k === "Vàng") goldIncome += amount;
          else stock[k as Exclude<ResourceKey, "Vàng">] += amount;
        }
      }
      if (def.flags?.loyaltyPerTurn) loyaltyGain += def.flags.loyaltyPerTurn * b["Cấp Độ"];
    }

    // 4) chi phí duy trì quân đồn trú tại lãnh địa (nối 11 — tối thiểu: ăn lương thực)
    // (mở rộng đầy đủ ở M8; M7 giữ khung)

    territory["Trung Thành"] = clamp(territory["Trung Thành"] + loyaltyGain, 0, 100);
    state["Thông Tin Nhân Vật"]["Vàng"] = Math.max(0, state["Thông Tin Nhân Vật"]["Vàng"] + Math.round(goldIncome * coinMult));
  }
}

let registered = false;
/** Đăng ký loop xây dựng/kinh tế vào turn-advance registry (idempotent). */
export function registerConstructionLoop(): void {
  if (registered) return;
  registerTurnListener("construction", tickConstruction);
  registered = true;
}
