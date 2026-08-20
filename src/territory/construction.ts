/**
 * construction (10.3) — cơ chế xây dựng + loop thời gian cho lãnh địa.
 *
 * - startConstruction: kiểm tra tài nguyên + NHÂN LỰC → trừ NGAY → xếp vào hàng
 *   đợi xây. Vàng trừ ngân khố thống nhất; vật tư trừ kho vùng. Trả PatchOp[]
 *   cho ENGINE áp (không qua AI).
 * - registerConstructionLoop: công trường hạ Ngày Xây Còn Lại MỖI NGÀY truyện;
 *   sản lượng + phí duy trì + lòng dân chốt MỖI THÁNG.
 *
 * BA LUẬT SẢN XUẤT (M18) — không còn "xây xong là tự sinh tài nguyên":
 *   1. NHÂN LỰC — sản lượng nhân với tỉ lệ lấp đầy chỗ làm (population.ts).
 *      Nông trại nửa người thì nửa thóc.
 *   2. ĐIỂM TÀI NGUYÊN — mỏ nhân thêm hệ số BẬC trữ lượng của mạch bên dưới,
 *      và mỗi tháng khai thác lại rút bớt trữ lượng đi (resourceNodes.ts).
 *   3. NGUYÊN LIỆU — xưởng thiếu đầu vào thì đứng máy, không sinh ra từ hư không.
 *
 * THUẾ và các khoản thu/chi cấp lãnh thổ KHÔNG nằm ở đây — xem economy/taxation.ts
 * và economy/budget.ts. File này chỉ lo sổ sách của TỪNG lãnh địa.
 */
import type { StatData, ResourceNode, CustomBuilding, JobKey } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import {
  BUILDING_CATALOG, RESOURCE_LIST, LABOUR_LIST, buildingCost, buildingDays, buildingLabour,
  type BuildingType, type ResourceKey, type LabourKey,
} from "../content/westeros/buildings";
import { combineDecrees, DECREE_BY_ID, type CombinedDecreeEffect } from "../content/westeros/decrees";
import { TERRAIN_TRAITS } from "../content/westeros/terrain";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { buildableRadiusCells } from "../content/westeros/mapScale";
import { localTerrainMap } from "./localTerrain";
import { holdingOwnedByPlayer } from "./territoryEngine";
import {
  analysePopulation, applyPopulation, applyDemography, socialMood, buildingLabel,
  type PopulationReport,
} from "./population";
import {
  ensureResourceNodes, nodeById, nodeMultiplier, nodeResourceShare,
  nodeContainsResource, nodeResources, depleteNode, nodeWorkers,
} from "./resourceNodes";
import { EXCHANGE_RATES } from "../economy/currency";
import { TAX_BRACKETS, grossProduct } from "../economy/taxation";
import { clamp } from "../mvu/helpers";
import { demesneEffects, demesneEffectsForHolding } from "../strategy/feudalManagement";

export interface BuildResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

type Holding = StatData["Lãnh Địa"][string];
type Building = Holding["Công Trình"][string];

const RES_KEYS: ResourceKey[] = [...RESOURCE_LIST];

/** Kho rỗng đủ 10 khoá lõi — mọi hàm sản lượng đều bắt đầu từ đây. */
function emptyStock(): Record<ResourceKey, number> {
  return {
    "Ngân Khố": 0, "Lương Thực": 0, "Gỗ": 0, "Đá": 0, "Quặng Sắt": 0,
    "Than Đá": 0, "Thép": 0, "Vải Vóc": 0, "Ngựa": 0, "Muối": 0,
  };
}

function addTo(target: Record<ResourceKey, number>, key: string, amount: number): void {
  target[key] = (target[key] ?? 0) + amount;
}

// ── Nhân lực công trường ────────────────────────────────────────────────────

/** Nhân công đang bị các công trường DỞ DANG giữ chân. */
export function labourInUse(territory: Holding): Record<LabourKey, number> {
  const used: Record<LabourKey, number> = { "Dân Phu": 0, "Thợ Đá": 0, "Thợ Mộc": 0, "Thợ Rèn": 0, "Kỹ Sư": 0 };
  for (const b of Object.values(territory["Công Trình"] ?? {})) {
    if (!b["Đang Xây"]) continue;
    const need = buildingLabour(b["Loại"], b["Cấp Độ"] || 1);
    for (const k of LABOUR_LIST) used[k] += need[k] ?? 0;
  }
  return used;
}

/**
 * Nhân công CÒN RẢNH cho công trường: thợ làm nghề tự do trong dân (đã cộng
 * phần trưng dụng theo pháp lệnh lao dịch), trừ đi số đang nằm trên công trường
 * khác. Hết người thì hết xây, dù kho vàng có đầy.
 */
export function availableLabour(territory: Holding): Record<LabourKey, number> {
  const free = analysePopulation(territory).freelance;
  const used = labourInUse(territory);
  const out: Record<LabourKey, number> = { "Dân Phu": 0, "Thợ Đá": 0, "Thợ Mộc": 0, "Thợ Rèn": 0, "Kỹ Sư": 0 };
  for (const k of LABOUR_LIST) out[k] = Math.max(0, (free[k] ?? 0) - used[k]);
  return out;
}

/** Có "Học Viện Nhỏ" đã xây xong → giảm thời gian xây (adminSpeedup). */
function adminSpeedup(territory: Holding): number {
  let best = 0;
  for (const b of Object.values(territory["Công Trình"])) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    const flag = BUILDING_CATALOG[b["Loại"]].flags?.adminSpeedup;
    if (flag && flag > best) best = flag;
  }
  return best;
}

/**
 * Khởi công / nâng cấp 1 công trình. name mặc định = loại (xây lại cùng tên =
 * NÂNG CẤP). Truyền `at` khi đặt từ bản đồ Tầng 1 để giữ toạ độ ô lưới, mã điểm
 * tài nguyên bám vào, và đặc tả tuỳ chỉnh — mọi đường xây dựng đều qua đây.
 */
export function startConstruction(
  state: StatData,
  territoryId: string,
  type: BuildingType,
  name?: string,
  at?: { x: number; y: number; nodeId?: string; custom?: CustomBuilding },
): BuildResult {
  const territory = state["Lãnh Địa"][territoryId];
  if (!territory) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };

  // CHỦ QUYỀN THÀNH TRÌ: chỉ người cai quản nơi này mới được động thổ. Đứng
  // trong đất của lãnh chúa khác — dù cùng Nhà, dù cùng vùng — thì không.
  if (!holdingOwnedByPlayer(state, territoryId)) {
    const lord = territory["Người Kiểm Soát"];
    return {
      ok: false,
      error: lord
        ? `${territory["Mô Tả"] || territoryId} do ${lord} cai quản — ngươi không có quyền xây ở đây`
        : `Ngươi không phải chủ của ${territory["Mô Tả"] || territoryId}`,
      ops: [],
    };
  }

  const def = BUILDING_CATALOG[type];
  if (def.requiresCoastal && !territory["Ven Biển"]) {
    return { ok: false, error: `${type} chỉ xây được ở lãnh địa ven biển`, ops: [] };
  }
  if (def.custom && !at?.custom && !territory["Công Trình"][name?.trim() || type]) {
    return { ok: false, error: `${type} cần một bản đặc tả công năng do ngươi soạn`, ops: [] };
  }

  const buildingName = name?.trim() || type;
  const existing = territory["Công Trình"][buildingName];
  if (existing?.["Đang Xây"]) {
    return { ok: false, error: `${buildingName} đang được xây dựng`, ops: [] };
  }
  if (existing?.["Đang Phá"]) {
    return { ok: false, error: `${buildingName} đang được phá dỡ`, ops: [] };
  }
  const nextLevel = existing ? existing["Cấp Độ"] + 1 : 1;

  const cost = customAwareCost(type, nextLevel, at?.custom ?? existing?.["Tuỳ Chỉnh"]);
  const playerGold = state["Thông Tin Nhân Vật"]["Ngân Khố"];
  const stock = territory["Tài Nguyên"];

  // kiểm tra đủ tài nguyên (Vàng ở ngân khố, còn lại ở kho vùng)
  const missing: string[] = [];
  if ((cost["Ngân Khố"] ?? 0) > playerGold) missing.push("Ngân Khố");
  for (const k of Object.keys(cost)) {
    if (k === "Ngân Khố") continue;
    if ((cost[k] ?? 0) > (stock[k] ?? 0)) missing.push(k);
  }
  if (missing.length > 0) {
    return { ok: false, error: `Thiếu tài nguyên: ${missing.join(", ")}`, ops: [] };
  }

  // NHÂN LỰC: công trường giữ người suốt thời gian thi công. Xây song song
  // nhiều thứ thì hết thợ — đây là cái hãm tự nhiên thay cho giới hạn cứng.
  const needLabour = buildingLabour(type, nextLevel);
  const freeLabour = availableLabour(territory);
  const shortLabour = LABOUR_LIST
    .filter((k) => (needLabour[k] ?? 0) > freeLabour[k])
    .map((k) => `${k} (cần ${needLabour[k]}, còn ${freeLabour[k]})`);
  if (shortLabour.length > 0) {
    return { ok: false, error: `Thiếu nhân lực: ${shortLabour.join(", ")}`, ops: [] };
  }

  const decreeEff = combineDecrees(territory["Pháp Lệnh"]);
  const focusEff = demesneEffects(state, territoryId);
  const days = buildingDays(type, nextLevel, Math.min(0.6, adminSpeedup(territory) + decreeEff.buildSpeed + focusEff.buildSpeed));
  const ops: PatchOp[] = [];
  if (cost["Ngân Khố"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -(cost["Ngân Khố"] ?? 0) });
  for (const k of Object.keys(cost)) {
    if (k === "Ngân Khố" || !cost[k]) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: -(cost[k] ?? 0) });
  }
  // NÂNG CẤP thì giữ nguyên chỗ cũ — công trình đã dựng rồi thì không dời đi
  // chỉ vì người chơi bấm vào ô khác; toạ độ mới chỉ dùng khi xây mới.
  const x = existing?.["Tọa Độ X"] ?? at?.x ?? 0;
  const y = existing?.["Tọa Độ Y"] ?? at?.y ?? 0;
  const value: Record<string, unknown> = {
    "Loại": type, "Cấp Độ": nextLevel, "Đang Xây": true, "Ngày Xây Còn Lại": days,
    "Đang Phá": false, "Ngày Phá Còn Lại": 0,
    "Tọa Độ X": x, "Tọa Độ Y": y, "Kích Thước": def.footprint,
    "Điểm Tài Nguyên": at?.nodeId ?? existing?.["Điểm Tài Nguyên"] ?? "",
    "Nhân Lực": {}, "Vận Hành": 0,
  };
  const custom = at?.custom ?? existing?.["Tuỳ Chỉnh"];
  if (custom) value["Tuỳ Chỉnh"] = custom;
  ops.push({
    op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}`,
    value,
  });
  return { ok: true, ops };
}

/**
 * Chi phí một công trình. Công trình TUỲ CHỈNH tính giá theo chính công năng
 * người chơi chọn — muốn sản lượng cao và giữ nhiều người thì phải trả tương
 * xứng, không có bữa trưa miễn phí.
 */
export function customAwareCost(
  type: BuildingType,
  level: number,
  custom?: CustomBuilding,
): Record<string, number> {
  const base = { ...buildingCost(type, level) } as Record<string, number>;
  if (!custom) return base;
  const G = EXCHANGE_RATES.GOLD_TO_COPPER;

  let output = 0;
  for (const [k, v] of Object.entries(custom["Sản Xuất"] ?? {})) {
    output += k === "Ngân Khố" ? (v ?? 0) / G : (v ?? 0);
  }
  let seats = 0;
  for (const v of Object.values(custom["Nhân Lực"] ?? {})) seats += v ?? 0;
  const housing = custom["Sức Chứa Dân"] ?? 0;
  const defense = custom["Phòng Thủ"] ?? 0;

  const extraGold = Math.round((output * 2.2 + seats * 1.6 + housing * 0.28 + defense * 22) * level) * G;
  const extraWood = Math.round((seats * 0.5 + housing * 0.18) * level);
  const extraStone = Math.round((defense * 9 + housing * 0.12 + output * 0.35) * level);

  base["Ngân Khố"] = (base["Ngân Khố"] ?? 0) + extraGold;
  base["Gỗ"] = (base["Gỗ"] ?? 0) + extraWood;
  base["Đá"] = (base["Đá"] ?? 0) + extraStone;
  return base;
}

/** Huỷ công trình đang xây — hoàn 50% tài nguyên (10.4). */
export function cancelConstruction(state: StatData, territoryId: string, buildingName: string): PatchOp[] {
  const b = state["Lãnh Địa"][territoryId]?.["Công Trình"]?.[buildingName];
  if (!b || !b["Đang Xây"]) return [];
  const cost = customAwareCost(b["Loại"], b["Cấp Độ"], b["Tuỳ Chỉnh"]);
  const ops: PatchOp[] = [];
  if (cost["Ngân Khố"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: Math.round((cost["Ngân Khố"] ?? 0) * 0.5) });
  for (const k of Object.keys(cost)) {
    if (k === "Ngân Khố" || !cost[k]) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: Math.round((cost[k] ?? 0) * 0.5) });
  }
  if (b["Cấp Độ"] > 1) {
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Đang Xây`, value: false });
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Ngày Xây Còn Lại`, value: 0 });
  } else {
    ops.push({ op: "remove", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}` });
    const territory = state["Lãnh Địa"][territoryId];
    ops.push({
      op: "replace",
      path: `stat_data.Lãnh Địa.${territoryId}.Điểm Tài Nguyên`,
      value: (territory["Điểm Tài Nguyên"] ?? []).map((node) => {
        const workers = nodeWorkers(node).filter((name) => name !== buildingName);
        return { ...node, "Công Trình": workers[0] ?? "", "Công Trình Khai Thác": workers };
      }),
    });
  }
  return ops;
}

/**
 * Số ngày phá dỡ. Phá nhanh hơn xây rất nhiều, nhưng vẫn đủ lâu để người chơi
 * thấy rõ công trình đang được tháo dỡ và có thể đổi ý trước khi đất được trả lại.
 */
export function demolitionDays(type: BuildingType, level: number): number {
  return Math.max(2, Math.min(14, Math.ceil(buildingDays(type, level) * 0.12)));
}

/** Bắt đầu phá dỡ một công trình hoàn thiện. Không hoàn tài nguyên: phần vật liệu
 * được tháo dỡ đã được tính là hao hụt/thu hồi bởi dân cư trong thời gian phá. */
export function startDemolition(state: StatData, territoryId: string, buildingName: string): BuildResult {
  const territory = state["Lãnh Địa"][territoryId];
  if (!territory) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!holdingOwnedByPlayer(state, territoryId)) {
    return { ok: false, error: "Ngươi không có quyền phá công trình ở đây", ops: [] };
  }
  const building = territory["Công Trình"]?.[buildingName];
  if (!building) return { ok: false, error: "Không tìm thấy công trình", ops: [] };
  if (building["Đang Xây"]) return { ok: false, error: `${buildingName} đang thi công — hãy huỷ công trường trước`, ops: [] };
  if (building["Đang Phá"]) return { ok: false, error: `${buildingName} đang được phá dỡ`, ops: [] };

  return {
    ok: true,
    ops: [
      { op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Đang Phá`, value: true },
      { op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Ngày Phá Còn Lại`, value: demolitionDays(building["Loại"], building["Cấp Độ"] || 1) },
    ],
  };
}

/** Dừng phá dỡ trước khi hoàn tất; công trình giữ nguyên cấp và vị trí. */
export function cancelDemolition(state: StatData, territoryId: string, buildingName: string): PatchOp[] {
  const building = state["Lãnh Địa"][territoryId]?.["Công Trình"]?.[buildingName];
  if (!building?.["Đang Phá"]) return [];
  return [
    { op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Đang Phá`, value: false },
    { op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${buildingName}.Ngày Phá Còn Lại`, value: 0 },
  ];
}

/** Cấp Lâu Đài của lãnh địa (quyết định bán kính quy hoạch Tầng 1). */
export function castleLevel(territory: Holding | undefined): number {
  if (!territory) return 0;
  for (const b of Object.values(territory["Công Trình"] ?? {})) {
    if (b["Loại"] === "Lâu Đài") return b["Cấp Độ"] || 1;
  }
  return 1; // trọng trấn mặc định coi như thành cấp 1
}

/** Bán kính quy hoạch thực tế = lâu đài + các công trình khai hoang đang hoạt động. */
export function planningRadiusCells(territory: Holding | undefined): number {
  if (!territory) return buildableRadiusCells(0);
  const bonus = Object.values(territory["Công Trình"] ?? {}).reduce((sum, building) => {
    if (building["Đang Xây"] || building["Đang Phá"]) return sum;
    const perLevel = BUILDING_CATALOG[building["Loại"]]?.flags?.planningRadiusCells ?? 0;
    return sum + perLevel * Math.max(1, building["Cấp Độ"] || 1);
  }, 0);
  return Math.min(buildableRadiusCells(999), buildableRadiusCells(castleLevel(territory)) + bonus);
}

// ── Sản lượng ───────────────────────────────────────────────────────────────

/**
 * Sản lượng ĐẤT ĐAI — tổng hợp BOTTOM-UP từ các khối địa hình Tầng 1 nằm trong
 * vùng quy hoạch. Đây là phần dân tự kiếm được trên đất công (hái lượm, củi,
 * đá lộ thiên), KHÔNG cần công trình nào. Mở rộng lãnh địa = ôm thêm rừng/đồi
 * = sản lượng nền đổi theo, không cần bảng cứng nào cả.
 */
function landYield(territoryId: string, territory: Holding): Record<ResourceKey, number> {
  const out = emptyStock();
  const region = REGIONS_BY_ID[territory["Thuộc Vùng"]] ?? null;
  const hint = territory["Gợi Ý Địa Thế"];
  const map = localTerrainMap(territoryId, {
    terrain: territory["Địa Hình"] ?? region?.terrain,
    coastal: territory["Ven Biển"] ?? region?.coastal,
    seed: territory["Hạt Giống Địa Hình"],
    region,
    hints: hint ? { river: hint["Gần Sông"], sea: hint["Gần Biển"], mountain: hint["Trên Núi"] } : undefined,
  });
  const radiusBlocks = Math.max(1, Math.round(planningRadiusCells(territory) / map.blockCells));
  const mid = Math.floor(map.blocks / 2);
  for (let by = mid - radiusBlocks; by <= mid + radiusBlocks; by++) {
    for (let bx = mid - radiusBlocks; bx <= mid + radiusBlocks; bx++) {
      if (bx < 0 || by < 0 || bx >= map.blocks || by >= map.blocks) continue;
      const y = TERRAIN_TRAITS[map.grid[by * map.blocks + bx]]?.perBlockYield;
      if (!y) continue;
      for (const [k, v] of Object.entries(y)) addTo(out, k, v ?? 0);
    }
  }
  return out;
}

/** Hệ số lòng dân — dân yên thì ruộng tốt, dân loạn thì bỏ hoang. */
function loyaltyFactor(territory: Holding): number {
  const loyalty = territory["Lòng Dân"] ?? territory["Trung Thành"] ?? 60;
  if (loyalty < 30) return 0.7;
  if (loyalty < 50) return 0.9;
  if (loyalty < 70) return 1.0;
  if (loyalty < 90) return 1.15;
  return 1.3;
}

/** Hệ số mùa vụ cho LƯƠNG THỰC (mùa đông tháng 10-12 gần như mất trắng). */
export function seasonFactor(month: number): number {
  if (month >= 4 && month <= 6) return 1.2;
  if (month >= 7 && month <= 9) return 1.5;
  if (month >= 10) return 0.2;
  return 1.0;
}

/**
 * Sản lượng NỀN mỗi THÁNG — đất công + phần dân tự cày cấy quanh nhà. Không
 * bao gồm công trình và KHÔNG bao gồm thuế (thuế nằm ở economy/taxation.ts).
 */
function baseProduction(territoryId: string, territory: Holding, month = 1): Record<ResourceKey, number> {
  const pop = territory["Dân Số"];
  const land = landYield(territoryId, territory);
  const kt = loyaltyFactor(territory);
  const eff = combineDecrees(territory["Pháp Lệnh"]);
  const focusEff = demesneEffectsForHolding(territory);

  const out = emptyStock();
  out["Lương Thực"] = Math.round(
    (Math.round(pop * 0.008) + land["Lương Thực"]) * seasonFactor(month) * kt * eff.foodMult * focusEff.foodMult,
  );
  out["Gỗ"] = Math.round((8 + land["Gỗ"]) * kt * eff.miningMult * focusEff.woodMult);
  out["Đá"] = Math.round((5 + land["Đá"]) * kt * eff.miningMult * focusEff.stoneMult);
  out["Quặng Sắt"] = Math.round((2 + land["Quặng Sắt"]) * kt * eff.miningMult * focusEff.oreMult);
  out["Ngựa"] = Math.round((pop / 1000) * focusEff.horsesPerThousand);
  return out;
}

/** Tổng hệ số +% thu thương mại từ các công trình đã hoạt động (chợ/cảng/quán). */
function tradeFlagBonus(territory: Holding): number {
  let bonus = 0;
  for (const b of Object.values(territory["Công Trình"] ?? {})) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    bonus += (BUILDING_CATALOG[b["Loại"]]?.flags?.trade ?? 0) * (b["Cấp Độ"] || 1);
  }
  return bonus;
}

/** Hao hụt kho mỗi tháng (chuột bọ, ẩm mốc) — Kho Lương làm giảm. */
function spoilRate(territory: Holding): number {
  let reduce = 0;
  for (const b of Object.values(territory["Công Trình"] ?? {})) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    reduce = Math.max(reduce, BUILDING_CATALOG[b["Loại"]]?.flags?.storage ?? 0);
  }
  return 0.015 * (1 - reduce);
}

/** Quân đồn trú tại lãnh địa này ăn hết bao nhiêu lương mỗi tháng (2 bao/lính). */
export function garrisonUpkeep(state: StatData, territoryId: string): number {
  let troops = 0;
  for (const u of Object.values(state["Biên Chế Quân Sự"] ?? {})) {
    if (u["Lãnh Địa Đồn Trú"] === territoryId) troops += u["Số Lượng"] || 0;
  }
  return troops * 2;
}

/** Đặc tả sản xuất hiệu dụng của 1 công trình (danh mục hoặc bản tuỳ chỉnh). */
/** Đặc tả tuỳ chỉnh chỉ tính là CÓ khi thật sự có nội dung. */
function customSpecOf(b: Building): CustomBuilding | null {
  const c = b["Tuỳ Chỉnh"];
  if (!c) return null;
  const hasContent = !!c["Tên"]
    || Object.keys(c["Sản Xuất"] ?? {}).length > 0
    || Object.keys(c["Nhân Lực"] ?? {}).length > 0
    || (c["Sức Chứa Dân"] ?? 0) > 0;
  return hasContent ? c : null;
}

function outputSpec(b: Building): {
  produce: Record<string, number>;
  consume: Record<string, number>;
  upkeep: Record<string, number>;
  loyalty: number;
} {
  const def = BUILDING_CATALOG[b["Loại"]];
  const custom = customSpecOf(b);
  if (custom) {
    return {
      produce: { ...(custom["Sản Xuất"] ?? {}) },
      consume: { ...(custom["Tiêu Thụ"] ?? {}) },
      upkeep: { ...(def?.upkeep ?? {}) } as Record<string, number>,
      loyalty: custom["Lòng Dân/Tháng"] ?? 0,
    };
  }
  return {
    produce: { ...(def?.yield ?? {}) } as Record<string, number>,
    consume: { ...(def?.consume ?? {}) } as Record<string, number>,
    upkeep: { ...(def?.upkeep ?? {}) } as Record<string, number>,
    loyalty: def?.flags?.loyaltyPerMonth ?? 0,
  };
}

/** Sổ sản xuất một tháng của 1 công trình — dùng chung cho ước lượng và chốt sổ. */
export interface BuildingLedger {
  name: string;
  label: string;
  type: BuildingType;
  level: number;
  /** 0–1 tỉ lệ nhân lực. */
  staffing: number;
  /** hệ số điểm tài nguyên (1 nếu không bám mạch nào). */
  nodeMult: number;
  node: ResourceNode | null;
  /** có đủ nguyên liệu đầu vào để chạy không. */
  fed: boolean;
  produce: Record<string, number>;
  consume: Record<string, number>;
  upkeep: Record<string, number>;
  loyalty: number;
  /** cần bao nhiêu người / đang có bao nhiêu người. */
  needTotal: number;
  haveTotal: number;
  needByJob: Partial<Record<JobKey, number>>;
  haveByJob: Partial<Record<JobKey, number>>;
}

/**
 * Sổ sản xuất của MỌI công trình đã xây xong. Đây là hàm mà cả bảng quản trị,
 * bản đồ Tầng 1 và tick tháng đều đọc — nên con số hiện trên màn hình luôn
 * đúng bằng con số thật sự vào kho.
 */
export function buildingLedgers(
  _territoryId: string,
  territory: Holding,
  report?: PopulationReport,
): BuildingLedger[] {
  const pop = report ?? analysePopulation(territory);
  const nodes = territory["Điểm Tài Nguyên"] ?? [];
  const stock = territory["Tài Nguyên"];
  const eff = combineDecrees(territory["Pháp Lệnh"]);
  const tradeMult = eff.tradeMult * (1 + tradeFlagBonus(territory));
  const out: BuildingLedger[] = [];

  for (const [name, b] of Object.entries(territory["Công Trình"] ?? {})) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    const def = BUILDING_CATALOG[b["Loại"]];
    if (!def) continue;
    const lvl = b["Cấp Độ"] || 1;
    const spec = outputSpec(b);
    const staff = pop.staffingByName[name];
    const staffing = staff ? staff.ratio : 1;
    const levelFactor = b["Tuỳ Chỉnh"]?.["Nhân Theo Cấp"] === false ? 1 : lvl;
    const node = nodeById(nodes, b["Điểm Tài Nguyên"]);
    const nMult = def.requiresNode
      ? nodeMultiplier(node) * (def.harvestRate ? 1 : nodeResourceShare(node, def.requiresNode))
      : 1;

    // nguyên liệu đầu vào phải đủ cho phần thật sự chạy được
    const scale = staffing * nMult;
    const consume: Record<string, number> = {};
    for (const [k, v] of Object.entries(spec.consume)) {
      consume[k] = Math.round((v ?? 0) * levelFactor * Math.min(1, Math.max(0, scale)));
    }
    const fed = Object.entries(consume).every(([k, v]) =>
      k === "Ngân Khố" ? true : (stock[k] ?? 0) >= v);

    const produce: Record<string, number> = {};
    if (fed && scale > 0) {
      const mining = def.requiresNode ? eff.miningMult : 1;
      for (const [k, v] of Object.entries(spec.produce)) {
        const amount = (v ?? 0) * levelFactor * scale * mining;
        produce[k] = Math.round(k === "Ngân Khố" ? amount * tradeMult : amount);
      }
      if (def.harvestRate && node) {
        for (const [resource, share] of Object.entries(nodeResources(node))) {
          const amount = def.harvestRate * share * levelFactor * scale * mining;
          produce[resource] = (produce[resource] ?? 0) + Math.round(amount);
        }
      }
    }

    const upkeep: Record<string, number> = {};
    for (const [k, v] of Object.entries(spec.upkeep)) upkeep[k] = Math.round((v ?? 0) * lvl);

    out.push({
      name, label: buildingLabel(name, b), type: b["Loại"], level: lvl,
      staffing, nodeMult: nMult, node, fed,
      produce, consume: fed ? consume : {}, upkeep,
      loyalty: spec.loyalty * levelFactor,
      needTotal: staff?.needTotal ?? 0,
      haveTotal: staff?.haveTotal ?? 0,
      needByJob: staff?.need ?? {},
      haveByJob: staff?.have ?? {},
    });
  }
  return out;
}

/**
 * Ước lượng thu ±/tháng của 1 lãnh địa — CHO HIỂN THỊ.
 *
 * Dòng "Ngân Khố" ở đây là phần đóng góp COIN của lãnh địa vào ngân khố: thuế
 * thu trên chính đất này, cộng thu từ công trình sinh lợi, trừ phí bảo trì.
 * Con số này KHÔNG được cộng lại vào ngân khố ở tick tháng (chỗ đó do
 * economy/budget.ts lo) — nếu không sẽ tính hai lần.
 */
export function estimateTerritoryYield(
  territory: Holding,
  territoryId = "",
  month = 1,
  taxRate = TAX_BRACKETS["Vừa"].rate,
): Record<ResourceKey, number> & { "Lòng Dân": number } {
  const base = baseProduction(territoryId, territory, month);
  const eff = combineDecrees(territory["Pháp Lệnh"]);
  const focusEff = demesneEffectsForHolding(territory);
  const report = analysePopulation(territory);
  const out: Record<ResourceKey, number> & { "Lòng Dân": number } = {
    ...base,
    "Lòng Dân": eff.loyaltyPerMonth + focusEff.loyaltyPerMonth + socialMood(report),
  };
  // thuế thu trên đất này — phần chính của dòng tiền một lãnh địa mang lại
  out["Ngân Khố"] += Math.round(grossProduct(territory) * taxRate * eff.taxMult * focusEff.goldMult);

  for (const led of buildingLedgers(territoryId, territory, report)) {
    for (const [k, v] of Object.entries(led.consume)) addTo(out, k, -v);
    for (const [k, v] of Object.entries(led.produce)) addTo(out, k, v);
    for (const [k, v] of Object.entries(led.upkeep)) addTo(out, k, -v);
    out["Lòng Dân"] += led.loyalty;
  }

  // hao hụt kho + chi phí duy trì pháp lệnh
  out["Lương Thực"] -= Math.round((territory["Tài Nguyên"]["Lương Thực"] ?? 0) * spoilRate(territory));
  for (const [k, v] of Object.entries(eff.upkeep)) addTo(out, k, -(v ?? 0));
  return out;
}

/**
 * 1 tick NGÀY (10.3): hạ tiến độ công trường. MUTATE state (chạy trong
 * runCascadeEffects, state đã qua schema).
 */
export function tickConstruction(state: StatData): void {
  for (const territory of Object.values(state["Lãnh Địa"])) {
    for (const [name, b] of Object.entries(territory["Công Trình"])) {
      if (b["Đang Xây"]) {
        b["Ngày Xây Còn Lại"] = Math.max(0, b["Ngày Xây Còn Lại"] - 1);
        if (b["Ngày Xây Còn Lại"] <= 0) b["Đang Xây"] = false;
      }
      if (b["Đang Phá"]) {
        b["Ngày Phá Còn Lại"] = Math.max(0, (b["Ngày Phá Còn Lại"] ?? 0) - 1);
        if ((b["Ngày Phá Còn Lại"] ?? 0) <= 0) {
          const node = (territory["Điểm Tài Nguyên"] ?? []).find((n) => n["Mã"] === b["Điểm Tài Nguyên"]);
          if (node) {
            const workers = nodeWorkers(node).filter((worker) => worker !== name);
            node["Công Trình Khai Thác"] = workers;
            node["Công Trình"] = workers[0] ?? "";
          }
          delete territory["Công Trình"][name];
        }
      }
    }
    for (const w of territory["Tường Thành"] ?? []) {
      if (w["Đang Xây"]) {
        w["Ngày Xây Còn Lại"] = Math.max(0, w["Ngày Xây Còn Lại"] - 1);
        if (w["Ngày Xây Còn Lại"] <= 0) w["Đang Xây"] = false;
      }
    }
  }
}

/**
 * 1 tick THÁNG: phân bổ dân cư → sản lượng đất + công trình (theo nhân lực và
 * trữ lượng mạch) → phí duy trì → quân lương → lòng dân → tăng trưởng dân số.
 * ĐÂY LÀ NƠI DUY NHẤT chốt sổ lãnh địa; mọi tầng bản đồ chỉ đọc lại kết quả.
 */
export function tickTerritoryIncome(state: StatData): void {
  const month = state["Thế Giới"]?.["Tháng"] ?? 1;

  for (const [territoryId, territory] of Object.entries(state["Lãnh Địa"])) {
    // 0. bảo đảm bản đồ mỏ đã nằm trong state, rồi xếp dân vào chỗ làm
    ensureResourceNodes(territory, localTerrainMap(territoryId, {
      terrain: territory["Địa Hình"] ?? REGIONS_BY_ID[territory["Thuộc Vùng"]]?.terrain,
      coastal: territory["Ven Biển"] ?? REGIONS_BY_ID[territory["Thuộc Vùng"]]?.coastal,
      seed: territory["Hạt Giống Địa Hình"],
      region: REGIONS_BY_ID[territory["Thuộc Vùng"]] ?? null,
      hints: territory["Gợi Ý Địa Thế"]
        ? {
          river: territory["Gợi Ý Địa Thế"]["Gần Sông"],
          sea: territory["Gợi Ý Địa Thế"]["Gần Biển"],
          mountain: territory["Gợi Ý Địa Thế"]["Trên Núi"],
        }
        : undefined,
    }));
    const report = applyPopulation(territory);

    let loyaltyGain = 0;
    const stock = territory["Tài Nguyên"];

    // 1. sản lượng nền (đất công Tầng 1 + dân tự cày cấy)
    const base = baseProduction(territoryId, territory, month);
    for (const k of RES_KEYS) {
      if (k === "Ngân Khố") continue;
      stock[k] = (stock[k] ?? 0) + (base[k] ?? 0);
    }

    const eff: CombinedDecreeEffect = combineDecrees(territory["Pháp Lệnh"]);
    loyaltyGain += eff.loyaltyPerMonth + demesneEffectsForHolding(territory).loyaltyPerMonth + socialMood(report);

    // 2. công trình — sản lượng theo NHÂN LỰC × TRỮ LƯỢNG MẠCH, và mạch cạn dần
    for (const led of buildingLedgers(territoryId, territory, report)) {
      // Ngân Khố của công trình do economy/budget.ts chốt — ở đây chỉ vật tư,
      // nếu không thì một đồng bị cộng vào ngân khố hai lần mỗi tháng.
      for (const [k, v] of Object.entries(led.consume)) {
        if (k === "Ngân Khố") continue;
        stock[k] = Math.max(0, (stock[k] ?? 0) - v);
      }
      let extracted = 0;
      for (const [k, v] of Object.entries(led.produce)) {
        if (k === "Ngân Khố") continue;
        stock[k] = (stock[k] ?? 0) + v;
        if (led.node && nodeContainsResource(led.node, k)) extracted += v;
      }
      for (const [k, v] of Object.entries(led.upkeep)) {
        if (k === "Ngân Khố") continue;
        stock[k] = Math.max(0, (stock[k] ?? 0) - v);
      }
      if (led.node && extracted > 0) depleteNode(led.node, extracted);
      loyaltyGain += led.loyalty;
    }

    // 3. quân lương: quân đồn trú ăn vào kho vùng; khẩu phần thời chiến bớt
    //    được một phần; thiếu ăn thì dân mất lòng
    const upkeep = Math.round(garrisonUpkeep(state, territoryId) * (1 - eff.rationing));
    const foodNeed = upkeep + Math.round(territory["Dân Số"] * 0.006);
    if (upkeep > 0) {
      if (stock["Lương Thực"] >= upkeep) stock["Lương Thực"] -= upkeep;
      else { stock["Lương Thực"] = 0; loyaltyGain -= 5; }
    }

    // 4. hao hụt kho + chi phí duy trì pháp lệnh
    stock["Lương Thực"] = Math.max(0, stock["Lương Thực"] - Math.round(stock["Lương Thực"] * spoilRate(territory)));
    for (const [k, v] of Object.entries(eff.upkeep)) {
      if (k === "Ngân Khố") continue;
      stock[k] = Math.max(0, (stock[k] ?? 0) - (v ?? 0));
    }

    // 5. chốt lòng dân rồi mới tính tăng trưởng dân số theo tình hình mới
    territory["Trung Thành"] = clamp(territory["Trung Thành"] + loyaltyGain, 0, 100);
    territory["Lòng Dân"] = clamp(territory["Lòng Dân"] + loyaltyGain, 0, 100);
    const demography = applyDemography(territory, {
      foodStock: stock["Lương Thực"],
      foodNeed,
      loyalty: territory["Lòng Dân"],
    });
    territory["Dân Số"] = Math.max(50, territory["Dân Số"] + demography.netChange);
  }
}

let registered = false;
/** Đăng ký loop công trường (ngày) + thu lãnh địa (tháng) — idempotent. */
export function registerConstructionLoop(): void {
  if (registered) return;
  registerDailyListener("construction", tickConstruction);
  registerMonthlyListener("territory-income", tickTerritoryIncome);
  registered = true;
}

// ── Ban hành / bãi bỏ pháp lệnh (10.4) ──────────────────────────────────────

export interface DecreeResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

/**
 * Ban một pháp lệnh trong danh mục. Trả phí một lần rồi ghi vào "Pháp Lệnh" kèm
 * MÃ để engine áp hệ số mỗi tháng — khác hẳn kiểu cũ chỉ lưu một dòng mô tả.
 */
export function issueDecree(state: StatData, territoryId: string, decreeId: string): DecreeResult {
  const territory = state["Lãnh Địa"][territoryId];
  if (!territory) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!holdingOwnedByPlayer(state, territoryId)) {
    return { ok: false, error: "Ngươi không có quyền ban pháp lệnh ở đây", ops: [] };
  }
  const def = DECREE_BY_ID[decreeId];
  if (!def) return { ok: false, error: "Không có pháp lệnh này", ops: [] };
  if (territory["Pháp Lệnh"]?.[decreeId]?.["Trạng Thái"] === "Đang hiệu lực") {
    return { ok: false, error: `${def.name} đang có hiệu lực`, ops: [] };
  }

  const cost = def.cost ?? {};
  const missing: string[] = [];
  if ((cost["Ngân Khố"] ?? 0) > state["Thông Tin Nhân Vật"]["Ngân Khố"]) missing.push("Ngân Khố");
  for (const k of Object.keys(cost)) {
    if (k === "Ngân Khố") continue;
    if ((cost[k] ?? 0) > (territory["Tài Nguyên"][k] ?? 0)) missing.push(k);
  }
  if (missing.length > 0) return { ok: false, error: `Thiếu: ${missing.join(", ")}`, ops: [] };

  const ops: PatchOp[] = [];
  if (cost["Ngân Khố"]) ops.push({ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -(cost["Ngân Khố"] ?? 0) });
  for (const k of Object.keys(cost)) {
    if (k === "Ngân Khố" || !cost[k]) continue;
    ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.${k}`, value: -(cost[k] ?? 0) });
  }
  if (def.instantLoyalty) {
    const now = territory["Lòng Dân"] ?? 60;
    const next = clamp(now + def.instantLoyalty, 0, 100);
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Lòng Dân`, value: next });
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Trung Thành`, value: next });
  }
  ops.push({
    op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Pháp Lệnh.${decreeId}`,
    value: { "Tên": def.name, "Loại": def.kind, "Mã": def.id, "Trạng Thái": "Đang hiệu lực", "Hiệu Ứng": def.summary },
  });
  return { ok: true, ops };
}

/** Bãi bỏ pháp lệnh — hệ số ngưng áp ngay từ tháng sau. */
export function revokeDecree(state: StatData, territoryId: string, decreeId: string): PatchOp[] {
  if (!state["Lãnh Địa"][territoryId]?.["Pháp Lệnh"]?.[decreeId]) return [];
  if (!holdingOwnedByPlayer(state, territoryId)) return [];
  return [{ op: "replace", path: `stat_data.Lãnh Địa.${territoryId}.Pháp Lệnh.${decreeId}.Trạng Thái`, value: "Đã bãi bỏ" }];
}
