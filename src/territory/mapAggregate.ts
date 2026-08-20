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
import type { StatData, Terrain } from "../mvu/schema";
import { MACRO_REGIONS, REGIONS, REGIONS_BY_ID } from "../content/westeros/regions";
import { MAP_MARKERS, markersForEra } from "../content/westeros/mapMarkers";
import { strongholdsForEra } from "../content/westeros/strongholds";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { factionsForYear, FACTION_COLORS_MAP } from "../content/world/geography";
import { RESOURCE_LIST, type ResourceKey } from "../content/westeros/buildings";
import { estimateTerritoryYield } from "./construction";
import { buildingDefense } from "./population";
import { TAX_BRACKETS } from "../economy/taxation";
import { holdingAnchor } from "./localMap";
import {
  playerHoldingIds,
  holdingOwnedByPlayer,
  playerHouseId,
  toHouseId,
  factionIdForRegion,
  provinceControlStatus,
  realmControlStatus,
  strongholdController,
  type StrongholdControl,
} from "./territoryEngine";
import {
  canonicalSettlementPopulation,
  regionPopulation,
  regionPopulationBreakdown,
} from "./geographyRuntime";
import { holdingTerrain } from "./terrainProjection";

type Holding = StatData["Lãnh Địa"][string];

/** Hạng khu dân cư hiển thị ở Tầng 2 (gom cụm từ chi tiết Tầng 1). */
export type SettlementKind = "Thành Trì" | "Thành Phố" | "Thị Trấn" | "Làng" | "Địa Danh";

export interface Settlement {
  /** id lãnh địa (nếu quản trị được) hoặc id địa danh tĩnh. */
  id: string;
  name: string;
  regionId: string;
  /** px trên ảnh bản đồ thế giới — neo chung cho ba tầng vĩ mô của hệ 5 tầng. */
  world: [number, number];
  kind: SettlementKind;
  population: number;
  /** Địa hình engine thực sự dùng cho thành này, không phải nhãn trang trí riêng. */
  terrain: Terrain;
  populationSource: "runtime" | "canon";
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
  /** Cứ điểm gameplay được bổ sung để province có nhiều mục tiêu kiểm soát. */
  strategicStronghold?: boolean;
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
  populationBaseline: number;
  populationDelta: number;
  terrain: Terrain;
  realmId: string;
  controlRatio: number;
  fullControl: boolean;
  controlledStrongholds: number;
  totalStrongholds: number;
  unsecuredStrongholds: StrongholdControl[];
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

/** Một chính thể/de-jure realm ở tầng Vương Quốc, không đồng nghĩa một tước địa cố định. */
export interface DeJureRealmSummary {
  realmId: string;
  name: string;
  regionIds: string[];
  anchor: [number, number];
  population: number;
  settlements: number;
  controller: string;
  controlledRegions: number;
  totalRegions: number;
  /** Chỉ là số province đang theo; điều kiện thành trì/chư hầu được engine kiểm tra sâu hơn. */
  provinceShare: number;
  isPlayerRealm: boolean;
  controlRatio: number;
  fullControl: boolean;
  controlledStrongholds: number;
  totalStrongholds: number;
  unsecuredStrongholds: StrongholdControl[];
}

/** Thông tin có thể mở trực tiếp khi xem lớp bản đồ phe phái. */
export interface FactionMapSummary {
  factionId: string;
  name: string;
  houseIds: string[];
  regionIds: string[];
  colorHouseId: string;
  population: number;
  estimatedLevy: number;
  controlledStrongholds: number;
  totalStrongholds: number;
  controlRatio: number;
  fullyControlledRegions: number;
}

/** Hồ sơ một Nhà khi xem Bản Đồ Quan Hệ — tình cảm và pháp lý không bị trộn lẫn. */
export interface RelationshipMapSummary {
  houseId: string;
  name: string;
  seat: string;
  attitude: string;
  attitudeDescription: string;
  diplomaticStatus: string;
  trust: number;
  warScore: number;
  treatyNames: string[];
  ourClaim: number;
  theirClaim: number;
  regionIds: string[];
  population: number;
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
    terrain: holdingTerrain(holdingId, holding),
    populationSource: "runtime",
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
function markerSettlement(
  m: { id: string; name: string; type: string; x: number; y: number; population?: number; regionId?: string },
  eraId: string,
): Settlement {
  const region = REGIONS_BY_ID[m.regionId ?? ""];
  const pop = canonicalSettlementPopulation(m.id, m.name, m.regionId ?? "", eraId, m.population ?? 0);
  const kind: SettlementKind =
    m.type === "landmark" ? "Địa Danh"
      : m.type === "castle" ? "Thành Trì"
        : pop >= 100000 ? "Thành Phố"
          : pop >= 20000 ? "Thị Trấn" : "Làng";
  return {
    id: m.id, name: m.name, regionId: m.regionId ?? "", world: [m.x, m.y], kind,
    population: pop, terrain: region?.terrain ?? "Đồng Bằng", populationSource: "canon",
    managed: false, ownedByPlayer: false, lord: "", isPlayer: false, seat: false,
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
    if (region.seatHiddenEras?.includes(eraId)) continue;
    const seatId = `${region.id}-seat`;
    if (taken.has(seatId) || taken.has(region.seat)) continue;
    const sov = state["Chủ Quyền Lãnh Thổ"][region.id];
    out.push({
      id: seatId, name: region.seat, regionId: region.id, world: region.seatXY,
      kind: "Thành Trì",
      population: canonicalSettlementPopulation(seatId, region.seat, region.id, eraId, region.seatPopulation ?? 0),
      terrain: region.terrain, populationSource: "canon", managed: false,
      ownedByPlayer: false, lord: "", isPlayer: !!sov?.["Là Của Người Chơi"], seat: true,
      buildings: 0, underConstruction: 0, defense: 0,
      garrison: garrisonOf(state, [region.id]), loyalty: 0, goldPerMonth: 0, foodPerMonth: 0,
    });
    taken.add(seatId);
    taken.add(region.seat);
  }

  for (const m of markersForEra(eraId)) {
    if (taken.has(m.id) || taken.has(m.name)) continue;
    out.push(markerSettlement(m, eraId));
    taken.add(m.id);
  }
  // Cứ điểm chiến lược không nhân đôi lâu đài canon. Chúng chỉ là mục tiêu
  // gameplay và được hiện dần khi zoom gần ở RegionLayer.
  for (const site of strongholdsForEra(eraId).filter((candidate) => candidate.source === "strategic")) {
    if (taken.has(site.id) || taken.has(site.name)) continue;
    const region = REGIONS_BY_ID[site.provinceId];
    const holder = strongholdController(state, site.id);
    out.push({
      id: site.id,
      name: site.name,
      regionId: site.provinceId,
      world: site.world,
      kind: "Thành Trì",
      population: site.population,
      terrain: region?.terrain ?? "Đồng Bằng",
      populationSource: "canon",
      managed: false,
      ownedByPlayer: holder === playerHouseId(state),
      lord: "",
      isPlayer: holder === playerHouseId(state),
      seat: false,
      buildings: 0,
      underConstruction: 0,
      defense: 1,
      garrison: garrisonOf(state, [site.id, site.provinceId]),
      loyalty: 0,
      goldPerMonth: 0,
      foodPerMonth: 0,
      strategicStronghold: true,
    });
    taken.add(site.id);
    taken.add(site.name);
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
  const managed = settlements.filter((s) => s.managed && s.ownedByPlayer);
  const population = regionPopulationBreakdown(state, regionId, eraId);
  // Bảng của một vùng phải mô tả mức kiểm soát của NHÀ đang giữ vùng đó.
  // Nếu luôn truyền Nhà người chơi, một thường dân Stark nhìn Winterfell cũng
  // sẽ thấy như chính mình đang kiểm soát các thành của Nhà Stark.
  const control = provinceControlStatus(state, regionId, sov?.["Nhà Kiểm Soát"] ?? "");
  const fullControl = control.complete;

  return {
    regionId,
    name: region?.name ?? regionId,
    controller: sov?.["Nhà Kiểm Soát"] ?? "",
    isPlayer: !!sov?.["Là Của Người Chơi"],
    status: sov?.["Tình Trạng"] ?? "Ổn Định",
    settlements,
    managedCount: managed.length,
    population: population.total,
    populationBaseline: population.baseline,
    populationDelta: population.runtimeDelta,
    terrain: region?.terrain ?? "Đồng Bằng",
    realmId: region?.realmId ?? regionId,
    controlRatio: fullControl ? 1 : control.controlRatio,
    fullControl,
    controlledStrongholds: fullControl ? control.totalStrongholds : control.controlledStrongholds,
    totalStrongholds: control.totalStrongholds,
    unsecuredStrongholds: fullControl ? [] : control.unsecuredStrongholds,
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
    entry.population += regionPopulation(state, region.id, eraId);
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

/** Tổng hợp tầng Vương Quốc từ các province leaf; không lưu thêm một bản dân số riêng. */
export function deJureRealms(state: StatData, eraId = ""): DeJureRealmSummary[] {
  const groups = new Map<string, typeof REGIONS>();
  const settlementsByRegion = new Map<string, number>();
  for (const settlement of allSettlements(state, eraId)) {
    settlementsByRegion.set(settlement.regionId, (settlementsByRegion.get(settlement.regionId) ?? 0) + 1);
  }
  for (const region of REGIONS) {
    const list = groups.get(region.realmId) ?? [];
    list.push(region);
    groups.set(region.realmId, list);
  }

  return [...groups.entries()].map(([realmId, regions]) => {
    const macro = MACRO_REGIONS.find((candidate) => candidate.legacyRegionId === realmId)
      ?? MACRO_REGIONS.find((candidate) => regions.every((region) => region.parentId === candidate.id));
    const byController = new Map<string, number>();
    let population = 0;
    let settlements = 0;
    let controlledRegions = 0;
    for (const region of regions) {
      const currentPopulation = regionPopulation(state, region.id, eraId);
      population += currentPopulation;
      settlements += settlementsByRegion.get(region.id) ?? 0;
      const sovereignty = state["Chủ Quyền Lãnh Thổ"][region.id];
      const controller = sovereignty?.["Nhà Kiểm Soát"] ?? "";
      if (controller) byController.set(controller, (byController.get(controller) ?? 0) + currentPopulation);
      if (sovereignty?.["Là Của Người Chơi"]) controlledRegions += 1;
    }
    const controller = [...byController.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const totalRegions = regions.length;
    const control = realmControlStatus(state, realmId, controller);
    const player = playerHouseId(state);
    const anchor: [number, number] = macro?.labelXY ?? [
      regions.reduce((sum, region) => sum + region.seatXY[0], 0) / totalRegions,
      regions.reduce((sum, region) => sum + region.seatXY[1], 0) / totalRegions,
    ];
    return {
      realmId,
      name: macro?.name ?? REGIONS_BY_ID[realmId]?.name ?? realmId,
      regionIds: regions.map((region) => region.id),
      anchor,
      population,
      settlements,
      controller,
      controlledRegions,
      totalRegions,
      provinceShare: totalRegions ? controlledRegions / totalRegions : 0,
      isPlayerRealm: !!player && controller === player && control.complete,
      controlRatio: control.controlRatio,
      fullControl: control.complete,
      controlledStrongholds: control.controlledStrongholds,
      totalStrongholds: control.totalStrongholds,
      unsecuredStrongholds: control.unsecuredStrongholds,
    };
  }).sort((a, b) => b.population - a.population);
}

/** ID phe của một Nhà trong snapshot hiện tại; ngoài nội chiến, mỗi Nhà là một thế lực. */
export function factionIdForHouse(state: StatData, houseId: string): string {
  return factionIdForRegion(state, "", houseId);
}

/** Tổng hợp lớp phe phái từ chủ quyền + graph thành trì live, không giữ bảng số riêng. */
export function factionMapSummaries(state: StatData, eraId = ""): FactionMapSummary[] {
  const raw = factionsForYear(state["Thế Giới"]["Năm"] ?? 298);
  const groups = new Map<string, FactionMapSummary>();
  const provinceRatioSums = new Map<string, number>();
  if (raw) {
    for (const [factionId, houseIds] of Object.entries(raw)) {
      const normalizedHouseIds = [...new Set(houseIds.map(toHouseId).filter(Boolean))];
      groups.set(factionId, {
        factionId,
        name: factionId,
        houseIds: normalizedHouseIds,
        regionIds: [],
        colorHouseId: toHouseId(FACTION_COLORS_MAP[factionId] ?? normalizedHouseIds[0] ?? ""),
        population: 0,
        estimatedLevy: 0,
        controlledStrongholds: 0,
        totalStrongholds: 0,
        controlRatio: 0,
        fullyControlledRegions: 0,
      });
    }
  }

  for (const region of REGIONS) {
    const holder = toHouseId(state["Chủ Quyền Lãnh Thổ"]?.[region.id]?.["Nhà Kiểm Soát"] ?? "");
    const factionId = factionIdForRegion(state, region.id, holder);
    let group = groups.get(factionId);
    if (!group) {
      const neutral = factionId === "__neutral__";
      const leaderHouse = factionId.startsWith("house:")
        ? toHouseId(factionId.slice("house:".length))
        : holder;
      group = {
        factionId,
        name: neutral ? "Vô chủ / chưa xác định" : HOUSES_BY_ID[leaderHouse]?.name ?? leaderHouse,
        houseIds: [...new Set([leaderHouse, holder].filter(Boolean))],
        regionIds: [],
        colorHouseId: neutral ? "" : leaderHouse,
        population: 0,
        estimatedLevy: 0,
        controlledStrongholds: 0,
        totalStrongholds: 0,
        controlRatio: 0,
        fullyControlledRegions: 0,
      };
      groups.set(factionId, group);
    } else if (holder && !group.houseIds.includes(holder)) {
      group.houseIds.push(holder);
    }
    const population = regionPopulation(state, region.id, eraId);
    const control = provinceControlStatus(state, region.id, holder);
    group.regionIds.push(region.id);
    group.population += population;
    group.estimatedLevy += Math.round(population * 0.005);
    group.controlledStrongholds += control.controlledStrongholds;
    group.totalStrongholds += control.totalStrongholds;
    provinceRatioSums.set(factionId, (provinceRatioSums.get(factionId) ?? 0) + control.controlRatio);
    if (control.complete) group.fullyControlledRegions += 1;
  }

  for (const group of groups.values()) {
    // Tính theo từng province để vùng chưa có graph thành không biến mất khỏi
    // mẫu số và tạo ra nhãn 100% giả dù trên bản đồ vẫn còn sọc.
    group.controlRatio = group.regionIds.length > 0
      ? (provinceRatioSums.get(group.factionId) ?? 0) / group.regionIds.length
      : 0;
  }
  return [...groups.values()]
    .filter((group) => group.regionIds.length > 0)
    .sort((a, b) => b.population - a.population);
}

/** Tổng hợp hồ sơ bấm-mở của một Nhà trên Bản Đồ Quan Hệ. */
export function relationshipMapSummary(
  state: StatData,
  houseId: string,
  eraId = "",
): RelationshipMapSummary | null {
  const normalizedHouseId = toHouseId(houseId);
  if (!normalizedHouseId) return null;
  const house = HOUSES_BY_ID[normalizedHouseId];
  const schemaName = house?.schemaName ?? houseId;
  const attitude = state["Thái Độ Các Nhà"]?.[schemaName];
  const relation = state["Quan Hệ Ngoại Giao"]?.[normalizedHouseId]
    ?? state["Quan Hệ Ngoại Giao"]?.[houseId];
  const regionIds = REGIONS
    .filter((region) => toHouseId(state["Chủ Quyền Lãnh Thổ"]?.[region.id]?.["Nhà Kiểm Soát"] ?? "") === normalizedHouseId)
    .map((region) => region.id);
  const grievances = relation?.["Ân Oán"] ?? [];

  return {
    houseId: normalizedHouseId,
    name: house?.name ?? normalizedHouseId,
    seat: house?.seat ?? "",
    attitude: attitude?.["Thái Độ"] ?? "Cảnh Giác",
    attitudeDescription: attitude?.["Mô Tả"] ?? "",
    diplomaticStatus: relation?.["Trạng Thái"] ?? "Hoà Bình",
    trust: relation?.["Tin Cậy"] ?? 0,
    warScore: relation?.["War Score"] ?? 0,
    treatyNames: (relation?.["Hiệp Ước"] ?? [])
      .filter((treaty) => treaty["Còn Hiệu Lực"])
      .map((treaty) => treaty["Loại"]),
    ourClaim: grievances
      .filter((grievance) => grievance["Bên Nợ"] === "Họ Nợ Ta")
      .reduce((sum, grievance) => sum + grievance["Mức"], 0),
    theirClaim: grievances
      .filter((grievance) => grievance["Bên Nợ"] === "Ta Nợ Họ")
      .reduce((sum, grievance) => sum + grievance["Mức"], 0),
    regionIds,
    population: regionIds.reduce((sum, regionId) => sum + regionPopulation(state, regionId, eraId), 0),
  };
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
