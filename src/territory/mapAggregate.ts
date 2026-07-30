/**
 * mapAggregate — ĐỒNG BỘ TỪ DƯỚI LÊN (bottom-up) của hệ bản đồ đa tầng.
 *
 * Tầng 2 và Tầng 3 KHÔNG giữ dữ liệu riêng: chúng là bản RENDER tổng hợp từ
 * Tầng 1 (stat_data."Lãnh Địa") cộng với chủ quyền (stat_data."Chủ Quyền Lãnh
 * Thổ") và danh mục địa danh tĩnh. Xây thêm một Nông Trại ở Tầng 1 → khu dân cư
 * ở Tầng 2 lớn lên, cán cân quyền lực ở Tầng 3 nhích theo, mà không cần một
 * dòng ghi state nào khác.
 *
 * Mọi hàm ở đây là thuần hàm đọc — không phát PatchOp, không mutate.
 */
import type { StatData } from "../mvu/schema";
import { REGIONS, REGIONS_BY_ID } from "../content/westeros/regions";
import { MAP_MARKERS, markersForEra } from "../content/westeros/mapMarkers";
import { RESOURCE_LIST, type ResourceKey } from "../content/westeros/buildings";
import { estimateTerritoryYield } from "./construction";
import { buildingDefense } from "./population";
import { TAX_BRACKETS } from "../economy/taxation";
import { holdingAnchor } from "./localMap";
import { playerHoldingIds, holdingOwnedByPlayer } from "./territoryEngine";

type Holding = StatData["Lãnh Địa"][string];

/** Hạng khu dân cư hiển thị ở Tầng 2 (gom cụm từ chi tiết Tầng 1). */
export type SettlementKind = "Thành Trì" | "Thành Phố" | "Thị Trấn" | "Làng" | "Địa Danh";

export interface Settlement {
  /** id lãnh địa (nếu quản trị được) hoặc id địa danh tĩnh. */
  id: string;
  name: string;
  regionId: string;
  /** px trên ảnh bản đồ thế giới — chung hệ toạ độ cho cả 3 tầng. */
  world: [number, number];
  kind: SettlementKind;
  population: number;
  /** true = có dữ liệu Tầng 1 (mở được bản đồ lãnh địa để xem). */
  managed: boolean;
  /** true = NGƯƠI là chủ thật của thành trì này — điều kiện để được xây. */
  ownedByPlayer: boolean;
  /** vị lãnh chúa đang cai quản (rỗng = chưa ai). */
  lord: string;
  isPlayer: boolean;
  /** trọng trấn của vùng. */
  seat: boolean;
  /** công trình đã hoàn thiện / đang xây (chỉ khu quản trị được). */
  buildings: number;
  underConstruction: number;
  defense: number;
  garrison: number;
  loyalty: number;
  /** thu Vàng ròng mỗi tháng (Đồng Đỏ). */
  goldPerMonth: number;
  foodPerMonth: number;
}

export interface RegionSummary {
  regionId: string;
  name: string;
  controller: string;
  isPlayer: boolean;
  status: string;
  settlements: Settlement[];
  /** số khu dân cư người chơi thật sự quản trị (có dữ liệu Tầng 1). */
  managedCount: number;
  /** dân số vĩ mô của vùng (canon). */
  population: number;
  /** dân số nằm trong các lãnh địa đã quản trị. */
  managedPopulation: number;
  buildings: number;
  underConstruction: number;
  defense: number;
  garrison: number;
  goldPerMonth: number;
  foodPerMonth: number;
}

export interface RealmSummary {
  houseId: string;
  regionIds: string[];
  population: number;
  settlements: number;
  garrison: number;
  defense: number;
  /** điểm quyền lực thô — dùng để so tương quan ở Tầng 3. */
  power: number;
  /** tỉ trọng quyền lực trong toàn Westeros (0-1). */
  share: number;
}

// ── Tầng 1 → 1 khu dân cư ───────────────────────────────────────────────────

function kindFor(holding: Holding, seat: boolean): SettlementKind {
  const hasCastle = Object.values(holding["Công Trình"] ?? {}).some((b) => b["Loại"] === "Lâu Đài" && !b["Đang Xây"] && !b["Đang Phá"]);
  if (hasCastle || seat) return "Thành Trì";
  const pop = holding["Dân Số"] ?? 0;
  if (pop >= 100000) return "Thành Phố";
  if (pop >= 20000) return "Thị Trấn";
  return "Làng";
}

function defenseOf(holding: Holding): number {
  let total = 0;
  for (const b of Object.values(holding["Công Trình"] ?? {})) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    total += buildingDefense(b);
  }
  return total;
}

/** Quân đồn trú tính cho 1 lãnh địa — chấp nhận cả khoá vùng lẫn khoá lãnh địa. */
function garrisonOf(state: StatData, keys: string[]): number {
  let total = 0;
  for (const u of Object.values(state["Biên Chế Quân Sự"] ?? {})) {
    if ((u["Số Lượng"] || 0) <= 0) continue;
    if (keys.includes(u["Lãnh Địa Đồn Trú"])) total += u["Số Lượng"];
  }
  return total;
}

/** Gom 1 lãnh địa Tầng 1 thành 1 điểm khu dân cư của Tầng 2. */
export function summarizeHolding(state: StatData, holdingId: string): Settlement {
  const holding = state["Lãnh Địa"][holdingId];
  const regionId = holding?.["Thuộc Vùng"] ?? "";
  const region = REGIONS_BY_ID[regionId] ?? null;
  const seat = !!region && (holdingId === `${region.id}-seat` || holding?.["Mô Tả"] === region.seat);
  const buildings = Object.values(holding?.["Công Trình"] ?? {});
  const yieldPerMonth = estimateTerritoryYield(
    holding, holdingId, state["Thế Giới"]?.["Tháng"] ?? 1,
    TAX_BRACKETS[state["Chính Sách Thuế"]?.["Mức Thuế"] ?? "Vừa"].rate,
  );
  const marker = MAP_MARKERS.find((m) => m.id === holdingId);

  return {
    id: holdingId,
    name: holding?.["Mô Tả"] || marker?.name || (seat && region ? region.seat : holdingId),
    regionId,
    world: holdingAnchor(holdingId, holding, region),
    kind: kindFor(holding, seat),
    population: holding?.["Dân Số"] ?? 0,
    managed: true,
    ownedByPlayer: holdingOwnedByPlayer(state, holdingId),
    lord: holding?.["Người Kiểm Soát"] ?? "",
    isPlayer: !!state["Chủ Quyền Lãnh Thổ"][regionId]?.["Là Của Người Chơi"]
      || holding?.["Người Kiểm Soát"] === state["Thông Tin Nhân Vật"]["Họ Tên"],
    seat,
    buildings: buildings.filter((b) => !b["Đang Xây"] && !b["Đang Phá"]).length,
    underConstruction: buildings.filter((b) => b["Đang Xây"] || b["Đang Phá"]).length,
    defense: defenseOf(holding),
    garrison: garrisonOf(state, [holdingId, regionId]),
    loyalty: holding?.["Lòng Dân"] ?? holding?.["Trung Thành"] ?? 0,
    goldPerMonth: yieldPerMonth["Ngân Khố"],
    foodPerMonth: yieldPerMonth["Lương Thực"],
  };
}

/** Địa danh tĩnh (chưa quản trị) → điểm Tầng 2 chỉ để nhìn. */
function markerSettlement(m: { id: string; name: string; type: string; x: number; y: number; population?: number; regionId?: string }): Settlement {
  const pop = m.population ?? 0;
  const kind: SettlementKind =
    m.type === "landmark" ? "Địa Danh"
      : m.type === "castle" ? "Thành Trì"
        : pop >= 100000 ? "Thành Phố"
          : pop >= 20000 ? "Thị Trấn" : "Làng";
  return {
    id: m.id, name: m.name, regionId: m.regionId ?? "", world: [m.x, m.y], kind,
    population: pop, managed: false, ownedByPlayer: false, lord: "", isPlayer: false, seat: false,
    buildings: 0, underConstruction: 0, defense: 0, garrison: 0, loyalty: 0,
    goldPerMonth: 0, foodPerMonth: 0,
  };
}

/**
 * Toàn bộ khu dân cư hiển thị ở Tầng 2: lãnh địa đã quản trị (dữ liệu thật từ
 * Tầng 1) + trọng trấn 9 vùng + địa danh tĩnh của Era. Lãnh địa quản trị GHI ĐÈ
 * địa danh trùng tên/id — không bao giờ vẽ hai chấm cho cùng một chỗ.
 */
export function allSettlements(state: StatData, eraId = ""): Settlement[] {
  const out: Settlement[] = [];
  const taken = new Set<string>();

  for (const id of Object.keys(state["Lãnh Địa"])) {
    const s = summarizeHolding(state, id);
    out.push(s);
    taken.add(s.id);
    taken.add(s.name);
  }

  for (const region of REGIONS) {
    const seatId = `${region.id}-seat`;
    if (taken.has(seatId) || taken.has(region.seat)) continue;
    const sov = state["Chủ Quyền Lãnh Thổ"][region.id];
    out.push({
      id: seatId, name: region.seat, regionId: region.id, world: region.seatXY,
      kind: "Thành Trì", population: region.seatPopulation ?? 0, managed: false,
      ownedByPlayer: false, lord: "", isPlayer: !!sov?.["Là Của Người Chơi"], seat: true,
      buildings: 0, underConstruction: 0, defense: 0,
      garrison: garrisonOf(state, [region.id]), loyalty: 0, goldPerMonth: 0, foodPerMonth: 0,
    });
    taken.add(seatId);
    taken.add(region.seat);
  }

  for (const m of markersForEra(eraId)) {
    if (taken.has(m.id) || taken.has(m.name)) continue;
    out.push(markerSettlement(m));
    taken.add(m.id);
  }
  return out;
}

// ── Tầng 2: tổng hợp theo VÙNG ──────────────────────────────────────────────

export function summarizeRegion(state: StatData, regionId: string, eraId = ""): RegionSummary {
  const region = REGIONS_BY_ID[regionId];
  const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
  const settlements = allSettlements(state, eraId).filter((s) => s.regionId === regionId);
  // Số liệu tổng hợp chỉ tính đất NGƯƠI làm chủ — thành trì của lãnh chúa khác
  // vẫn hiện trên danh sách nhưng không được cộng vào sổ của mình.
  const managed = settlements.filter((s) => s.ownedByPlayer);

  return {
    regionId,
    name: region?.name ?? regionId,
    controller: sov?.["Nhà Kiểm Soát"] ?? "",
    isPlayer: !!sov?.["Là Của Người Chơi"],
    status: sov?.["Tình Trạng"] ?? "Ổn Định",
    settlements,
    managedCount: managed.length,
    population: region?.population ?? 0,
    managedPopulation: managed.reduce((n, s) => n + s.population, 0),
    buildings: managed.reduce((n, s) => n + s.buildings, 0),
    underConstruction: managed.reduce((n, s) => n + s.underConstruction, 0),
    defense: managed.reduce((n, s) => n + s.defense, 0),
    garrison: garrisonOf(state, [regionId, ...managed.map((s) => s.id)]),
    goldPerMonth: managed.reduce((n, s) => n + s.goldPerMonth, 0),
    foodPerMonth: managed.reduce((n, s) => n + s.foodPerMonth, 0),
  };
}

// ── Tầng 3: cán cân quyền lực theo NHÀ ──────────────────────────────────────

/**
 * Điểm quyền lực của 1 thế lực = dân số vùng nắm giữ + quân thường trực +
 * công sự. Đây là con số Tầng 3 đọc để vẽ tương quan — vẫn quy về dữ liệu
 * Tầng 1/2 chứ không phải bảng cứng.
 */
export function balanceOfPower(state: StatData, eraId = ""): RealmSummary[] {
  const byHouse = new Map<string, RealmSummary>();
  const settlements = allSettlements(state, eraId);

  for (const region of REGIONS) {
    const houseId = state["Chủ Quyền Lãnh Thổ"][region.id]?.["Nhà Kiểm Soát"] ?? "";
    if (!houseId) continue;
    const entry = byHouse.get(houseId) ?? {
      houseId, regionIds: [], population: 0, settlements: 0, garrison: 0, defense: 0, power: 0, share: 0,
    };
    const inRegion = settlements.filter((s) => s.regionId === region.id);
    entry.regionIds.push(region.id);
    entry.population += region.population;
    entry.settlements += inRegion.length;
    entry.garrison += garrisonOf(state, [region.id, ...inRegion.filter((s) => s.managed).map((s) => s.id)]);
    entry.defense += inRegion.reduce((n, s) => n + s.defense, 0);
    byHouse.set(houseId, entry);
  }

  const list = [...byHouse.values()];
  for (const r of list) {
    r.power = Math.round(r.population / 10000 + r.garrison / 100 + r.defense * 2);
  }
  const total = list.reduce((n, r) => n + r.power, 0) || 1;
  for (const r of list) r.share = r.power / total;
  return list.sort((a, b) => b.power - a.power);
}

/**
 * Quy tắc quyền sở hữu nằm ở territoryEngine (dùng chung với engine xây dựng) —
 * re-export cho tiện phía UI, tránh mỗi màn hình tự suy một kiểu.
 */
export { playerHoldingIds, holdingOwnedByPlayer as canManageHolding };

/** Tổng thu/chi mỗi tháng của toàn bộ lãnh địa người chơi (thanh trạng thái). */
export function playerLedger(state: StatData): Record<ResourceKey, number> {
  const out: Record<ResourceKey, number> = Object.fromEntries(
    RESOURCE_LIST.map((k) => [k, 0]),
  ) as Record<ResourceKey, number>;
  const month = state["Thế Giới"]?.["Tháng"] ?? 1;
  const rate = TAX_BRACKETS[state["Chính Sách Thuế"]?.["Mức Thuế"] ?? "Vừa"].rate;
  for (const [id, holding] of Object.entries(state["Lãnh Địa"])) {
    const y = estimateTerritoryYield(holding, id, month, rate);
    for (const k of Object.keys(out) as ResourceKey[]) out[k] += y[k];
  }
  return out;
}
