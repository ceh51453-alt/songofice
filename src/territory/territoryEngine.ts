/**
 * territoryEngine (9.5) — logic CHỦ QUYỀN VÙNG, tách khỏi store/UI (thuần hàm):
 * - seedRegionControl: nạp bản đồ chủ quyền từ Era lúc initvar (9.6.1).
 * - captureRegionOps: đổi chủ 1 vùng + đồng bộ 2 chiều (9.5.1) — tạo/xoá entry
 *   Lãnh Địa tương ứng. Trả PatchOp[] cho ENGINE áp (được ghi field `_`).
 * - regionFill: suy màu tô runtime theo chế độ (9.5.2) — Chính Trị / Quan Hệ.
 * Bản đồ ĐỌC từ đây, không tự giữ chủ quyền — nguồn chân lý là stat_data.
 */
import { makeDefaultRegionGovernance, type StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import {
  REGIONS, REGIONS_BY_ID, MACRO_REGIONS_BY_ID, regionControlForYear,
  factionsForYear, FACTION_COLORS_MAP, REGION_ID_ALIASES, regionsForRealm, regionForLocation,
} from "../content/world/geography";
import { HOUSES_DATA, HOUSES_BY_ID } from "../content/westeros/houses";
import { BANNERMEN, BANNERMEN_BY_ID, type BannermanData } from "../content/westeros/bannermen";
import { houseColor, ATTITUDE_HEAT, PLAYER_HEAT_COLOR, NEUTRAL_COLOR } from "../content/westeros/houseColors";
import { MAP_MARKERS, markersForEra } from "../content/westeros/mapMarkers";
import { eventSeed } from "../probability/rng";
import { loreSeatFor } from "../content/westeros/loreSeats";
import { defaultJobSplit } from "../content/westeros/buildings";
import { canonicalSettlementPopulation } from "./geographyRuntime";
import {
  strongholdById,
  strongholdsForEra,
  strongholdsForProvince,
  type StrongholdSite,
} from "../content/westeros/strongholds";

type MapRegion = (typeof REGIONS)[number];

/** schemaName ("Stark") → houseId ("stark"). */
export const HOUSE_ID_BY_SCHEMA: Record<string, string> = Object.fromEntries(
  HOUSES_DATA.map((h) => [h.schemaName, h.id]),
);

export function playerHouseId(state: StatData): string {
  return HOUSE_ID_BY_SCHEMA[state["Thông Tin Nhân Vật"]["Nhà"]] ?? "";
}

function canonicalRegionId(regionId: string): string {
  return REGION_ID_ALIASES[regionId] ?? regionId;
}

/** Quyền trực tiếp là của một con người, không tự truyền cho mọi thành viên cùng Nhà. */
export function playerOwnsProvince(state: StatData, regionId: string): boolean {
  const playerName = (state["Thông Tin Nhân Vật"]["Họ Tên"] ?? "").trim();
  if (!playerName) return false;
  const wantedRegion = canonicalRegionId(regionId);
  const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[wantedRegion]
    ?? state["Chủ Quyền Lãnh Thổ"]?.[regionId];
  if ((sovereignty?.["Người Kiểm Soát"] ?? "").trim() === playerName) return true;
  return Object.values(state["Lãnh Địa"] ?? {}).some((holding) => (
    (holding["Người Kiểm Soát"] ?? "").trim() === playerName
    && canonicalRegionId(holding["Thuộc Vùng"] ?? "") === wantedRegion
  ));
}

/**
 * Chốt cờ chủ quyền trực tiếp và cache kiểm soát hoàn toàn từ graph thành trì.
 *
 * seedRegionControl tính cờ này NGAY LÚC gieo, nhưng ở luồng nhân vật nguyên tác
 * thì Nhà của nhân vật chưa được ghi vào state ở thời điểm đó — nên MỌI vùng đều
 * bị gắn cờ false, và hệ quả là `playerIsRulingLord` luôn sai: rail Triều Đình
 * và Mưu Đồ bị khoá vĩnh viễn dù đang đóng vai một đại lãnh chúa. Gọi hàm này ở
 * CUỐI init (và lúc migrate save) để cờ khớp với thực tế bàn cờ.
 */
export function repairPlayerSovereignty(state: StatData): number {
  const playerName = (state["Thông Tin Nhân Vật"]["Họ Tên"] ?? "").trim();
  // Trong lúc wizard chưa chốt tên, chưa đủ dữ kiện để sửa một save đang dựng dở.
  if (!playerName) return 0;
  let fixed = 0;
  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    const owns = playerOwnsProvince(state, regionId);
    if (sov["Là Của Người Chơi"] !== owns) {
      sov["Là Của Người Chơi"] = owns;
      fixed++;
    }
    const holder = toHouseId(String(sov["Nhà Kiểm Soát"] ?? ""));
    const complete = !!holder && provinceControlStatus(state, regionId, holder).complete;
    const hasFullControlCache = Object.prototype.hasOwnProperty.call(sov, "Kiểm Soát Hoàn Toàn");
    // Save cũ không có cache thì giữ nguyên byte dữ liệu cũ; UI/engine vẫn dẫn
    // xuất live. Save mới đã có field thì tiếp tục duy trì nó.
    if (hasFullControlCache && sov["Kiểm Soát Hoàn Toàn"] !== complete) {
      sov["Kiểm Soát Hoàn Toàn"] = complete;
      fixed++;
    }
  }
  return fixed;
}

/**
 * Chuẩn hoá tên Nhà về houseId (khoá của HOUSES_BY_ID / bảng màu).
 * Dữ liệu cốt truyện hay ghi schemaName ("Lannister") vào chỗ đòi houseId
 * ("lannister") — khi đó bản đồ tra không ra Nhà và tô thành "vô chủ".
 */
export function toHouseId(name: string): string {
  if (!name) return "";
  if (HOUSES_BY_ID[name]) return name;
  const bySchema = HOUSE_ID_BY_SCHEMA[name];
  if (bySchema) return bySchema;
  const lower = name.toLowerCase().replace(/\s+/g, "-");
  return HOUSES_BY_ID[lower] ? lower : name;
}

/**
 * Sửa mọi chỗ ghi tên Nhà sai dạng trong state (chủ quyền + lãnh địa). MUTATE.
 * Chỉ đổi ĐỊNH DẠNG khoá, không đụng tới ai làm chủ cái gì.
 */
export function normalizeHouseIds(state: StatData): void {
  for (const sov of Object.values(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    sov["Nhà Kiểm Soát"] = toHouseId(sov["Nhà Kiểm Soát"]);
  }
  for (const holding of Object.values(state["Lãnh Địa"])) {
    holding["Nhà Kiểm Soát"] = toHouseId(holding["Nhà Kiểm Soát"]);
  }
}

export type RegionControlRepairMode = "fresh-seed" | "legacy-migration";

export interface RepairRegionControlOptions {
  /**
   * `fresh-seed`: entry có sẵn là claim chính xác của một leaf trong ván mới.
   * `legacy-migration`: entry 9 vùng cũ đại diện cả macro và phải trải xuống các leaf.
   */
  mode: RegionControlRepairMode;
  year?: number;
}

/**
 * Bù các vùng lá còn thiếu mà không ghi đè entry đã có.
 *
 * Chỉ luồng migration được phép hiểu id 9 vùng cũ là cả macro. Ván mới
 * có thể claim đúng leaf mang id legacy (ví dụ `the-north`), nên sao chép claim đó
 * sang các leaf anh em sẽ trao cho người chơi cả miền một cách sai lệch.
 * Alias draft → canonical vẫn là quan hệ một-một và an toàn trong cả hai mode.
 */
export function repairRegionControl(state: StatData, options: RepairRegionControlOptions): number {
  const year = options.year ?? state["Thế Giới"]["Năm"] ?? 298;
  const sovereignty = state["Chủ Quyền Lãnh Thổ"];
  const control = regionControlForYear(year);
  const pHouse = playerHouseId(state);
  let added = 0;

  for (const region of REGIONS) {
    if (Object.prototype.hasOwnProperty.call(sovereignty, region.id)) continue;

    const macro = MACRO_REGIONS_BY_ID[region.parentId];
    const legacyId = macro?.legacyRegionId;
    const aliasId = Object.entries(REGION_ID_ALIASES)
      .find(([alias, canonical]) => canonical === region.id && sovereignty[alias])?.[0];
    const inheritedAlias = aliasId ? sovereignty[aliasId] : undefined;
    const inheritedLegacy = options.mode === "legacy-migration" && legacyId
      ? sovereignty[legacyId]
      : undefined;
    const inherited = inheritedAlias ?? inheritedLegacy;
    if (inherited) {
      sovereignty[region.id] = structuredClone(inherited);
    } else {
      const controller = control[region.id] ?? region.defaultHouse ?? "";
      sovereignty[region.id] = {
        "Nhà Kiểm Soát": controller,
        "Người Kiểm Soát": "",
        "Tình Trạng": "Ổn Định",
        "Là Của Người Chơi": !!pHouse && controller === pHouse,
        "Kiểm Soát Hoàn Toàn": false,
        "Quản Trị": makeDefaultRegionGovernance(),
        "_Ngày Đổi Chủ": 0,
      };
    }
    added++;
  }
  repairCanonicalHoldingRegions(state);
  repairStrongholdControl(state, options.mode);
  return added;
}

/**
 * Save cũ từng gắn lâu đài canon vào 9 đại vùng. Sau khi bản đồ tách province,
 * đưa chúng về leaf của marker/thủ phủ để dân số, thuế, quân và panel không còn
 * tính Dreadfort vào Winterfell (hoặc tương tự). Holding tuỳ chỉnh không bị đụng.
 */
export function repairCanonicalHoldingRegions(state: StatData): number {
  let changed = 0;
  for (const [holdingId, holding] of Object.entries(state["Lãnh Địa"] ?? {})) {
    const marker = MAP_MARKERS.find((candidate) => candidate.id === holdingId);
    const seatProvince = REGIONS.find((region) => `${region.id}-seat` === holdingId);
    const targetRegionId = marker?.regionId ?? seatProvince?.id ?? "";
    if (!targetRegionId || !REGIONS_BY_ID[targetRegionId] || holding["Thuộc Vùng"] === targetRegionId) continue;
    holding["Thuộc Vùng"] = targetRegionId;
    changed++;
  }
  return changed;
}

/**
 * Bù sổ bá quyền từng thành cho ván mới/save cũ.
 *
 * - Snapshot chưa từng đổi chủ: các cứ điểm của province đang nằm trong trật tự
 *   cũ, nên top-level controller được ghi làm bá quyền ban đầu.
 * - Province đã đổi chủ: chỉ thủ phủ đã chắc chắn thất thủ; các thành phụ không
 *   được tự động trao cho chủ mới. Đây là migration quan trọng sửa lỗi 100%.
 * - Entry đã tồn tại tuyệt đối không bị ghi đè, nên vây/đầu hàng sống qua reload.
 */
export function repairStrongholdControl(
  state: StatData,
  mode: RegionControlRepairMode = "legacy-migration",
): number {
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  let changed = 0;
  for (const region of REGIONS) {
    const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[region.id];
    if (!sovereignty) continue;
    const controller = toHouseId(sovereignty["Nhà Kiểm Soát"] ?? "");
    const stable = (sovereignty["_Ngày Đổi Chủ"] ?? 0) === 0
      && (sovereignty["Tình Trạng"] ?? "Ổn Định") === "Ổn Định";
    const existing = sovereignty["Bá Quyền Thành Trì"] ?? {};
    const hadLedger = sovereignty["Bá Quyền Thành Trì"] !== undefined;
    for (const site of strongholdsForProvince(region.id, eraId)) {
      if (Object.prototype.hasOwnProperty.call(existing, site.id)) continue;
      const isSeat = site.source === "seat";
      // Fresh seed dựng trật tự đầu ván. Migration của một province vừa đổi chủ
      // chỉ biết chắc thủ phủ; thành phụ để trống cho chiến tranh/chư hầu quyết định.
      existing[site.id] = controller && (stable || (mode === "fresh-seed" && isSeat) || isSeat)
        ? controller
        : "";
      changed++;
    }
    // Chư hầu canon chưa có marker vẫn là một chủ thành thật. Lưu entry riêng
    // để snapshot ban đầu có bằng chứng kiểm soát, nhưng sau khi province đổi
    // chủ thì không tự ép họ thần phục chủ mới.
    for (const bannerman of activeBannermen(state)) {
      if (provinceForBannerman(bannerman)?.id !== region.id) continue;
      const strongholdId = `vassal:${bannerman.id}`;
      if (Object.prototype.hasOwnProperty.call(existing, strongholdId)) continue;
      existing[strongholdId] = controller && stable ? controller : "";
      changed++;
    }
    if (!hadLedger || sovereignty["Bá Quyền Thành Trì"] !== existing) {
      sovereignty["Bá Quyền Thành Trì"] = existing;
    }
  }
  return changed;
}

/** Tên tương thích cho các luồng migration gọi bước chuẩn hoá world state. */
export function normalizeRegionControl(state: StatData): number {
  const added = repairRegionControl(state, { mode: "legacy-migration" });
  repairPlayerSovereignty(state);
  return added;
}

/** Vùng "quê nhà" của 1 Nhà: khớp trọng trấn (houses.seat === region.seat), fallback Nhà mặc định. */
export function homeRegionForHouse(houseId: string): MapRegion | null {
  if (!houseId) return null;
  const seat = HOUSES_BY_ID[houseId]?.seat;
  return (
    REGIONS.find((r) => seat && r.seat === seat) ??
    REGIONS.find((r) => r.defaultHouse === houseId) ??
    null
  );
}

/**
 * Catalog chư hầu M19 là lát cắt cuối thế kỷ III AC. Ở các era cổ, chỉ dùng
 * một Nhà khi dữ liệu Nhà có mốc tồn tại/era tường minh; không tự mang Rosby,
 * Tarly, Clegane... ngược hàng nghìn năm chỉ vì catalog không ghi niên đại.
 */
function houseActiveInState(state: StatData, houseId: string): boolean {
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const year = state["Thế Giới"]["Năm"] ?? 298;
  const requiresExplicitDating = year <= 2
    || eraId === "long-night"
    || eraId === "aegon-conquest";
  const house = HOUSES_BY_ID[houseId];
  if (!house) return !requiresExplicitDating;
  if (requiresExplicitDating
    && house.activeFromYear === undefined
    && house.activeToYear === undefined
    && !house.availableEras?.includes(eraId)) return false;
  if (house.availableEras?.length && eraId && !house.availableEras.includes(eraId)) return false;
  if (house.activeFromYear !== undefined && year < house.activeFromYear) return false;
  if (house.activeToYear !== undefined && year > house.activeToYear) return false;
  return true;
}

export function activeBannermen(state: StatData): BannermanData[] {
  return BANNERMEN.filter((bannerman) => houseActiveInState(state, bannerman.id));
}

/**
 * AI THẬT SỰ LÀ CHỦ của một thành trì — quy tắc DUY NHẤT, dùng cho cả quyền
 * quản trị lẫn quyền xây dựng.
 *
 * Thứ tự xét quan trọng: nếu thành trì đã ghi rõ người cai quản thì người ĐÓ
 * là chủ, kể cả khi cả vùng thuộc Nhà của người chơi — nếu không, đóng vai một
 * nhân vật canon sẽ xây được cả trên đất của lãnh chúa khác cùng Nhà.
 * Chỉ khi thành trì bỏ trống chủ mới xét tới chủ quyền vùng.
 */
export function holdingOwnedByPlayer(state: StatData, holdingId: string): boolean {
  const holding = state["Lãnh Địa"][holdingId];
  if (!holding) return false;
  const lord = (holding["Người Kiểm Soát"] ?? "").trim();
  const me = (state["Thông Tin Nhân Vật"]["Họ Tên"] ?? "").trim();
  if (lord) return !!me && lord === me;
  return !!state["Chủ Quyền Lãnh Thổ"][holding["Thuộc Vùng"]]?.["Là Của Người Chơi"];
}

/** Danh sách thành trì người chơi được quyền cai quản. */
export function playerHoldingIds(state: StatData): string[] {
  return Object.keys(state["Lãnh Địa"]).filter((id) => holdingOwnedByPlayer(state, id));
}

export interface HoldingNavigationContext {
  /** Thành vừa được mở rõ ràng ở tầng Lãnh Địa/Thành Trì. */
  focusHoldingId?: string | null;
  /** Lãnh thổ người chơi vừa chọn trên bản đồ. */
  selectedRegionId?: string | null;
  /** Chỉ chọn đất người chơi có quyền quản lý (dùng trong bảng quản trị). */
  ownedOnly?: boolean;
}

function normalizedHoldingLabel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Chọn thành trì theo đúng ngữ cảnh điều hướng, thay vì phụ thuộc thứ tự object
 * (trước đây phần tử đầu luôn là Winterfell trong phần lớn ván chơi).
 *
 * Ưu tiên: thành đang xem → lãnh thổ vừa chọn → vị trí hiện tại → đất trực tiếp
 * đầu tiên của người chơi. Không bao giờ tự nhảy tới một thành ngoại quốc bất kỳ.
 */
export function holdingForNavigation(
  state: StatData,
  context: HoldingNavigationContext = {},
): string | null {
  const holdings = state["Lãnh Địa"] ?? {};
  const allIds = Object.keys(holdings);
  const ownedIds = playerHoldingIds(state);
  const allowedIds = context.ownedOnly ? ownedIds : allIds;
  const allowed = new Set(allowedIds);

  if (context.focusHoldingId && allowed.has(context.focusHoldingId)) {
    return context.focusHoldingId;
  }

  const selectedRegionId = context.selectedRegionId
    ? canonicalRegionId(context.selectedRegionId)
    : "";
  if (selectedRegionId) {
    const inSelectedRegion = (id: string) => (
      canonicalRegionId(holdings[id]?.["Thuộc Vùng"] ?? "") === selectedRegionId
    );
    const ownedMatch = ownedIds.find(inSelectedRegion);
    if (ownedMatch) return ownedMatch;
    const visibleMatch = allowedIds.find(inSelectedRegion);
    if (visibleMatch) return visibleMatch;
  }

  const location = state["Thế Giới"]?.["Vị Trí"] ?? "";
  const normalizedLocation = normalizedHoldingLabel(location);
  if (normalizedLocation) {
    const exactLocation = allowedIds.find((id) => (
      normalizedHoldingLabel(id) === normalizedLocation
      || normalizedHoldingLabel(holdings[id]?.["Mô Tả"] ?? "") === normalizedLocation
    ));
    if (exactLocation) return exactLocation;
  }

  const locationRegionId = regionForLocation(location)?.id ?? "";
  if (locationRegionId) {
    const inLocationRegion = (id: string) => (
      canonicalRegionId(holdings[id]?.["Thuộc Vùng"] ?? "") === locationRegionId
    );
    const ownedMatch = ownedIds.find(inLocationRegion);
    if (ownedMatch) return ownedMatch;
    const visibleMatch = allowedIds.find(inLocationRegion);
    if (visibleMatch) return visibleMatch;
  }

  return ownedIds.find((id) => allowed.has(id)) ?? null;
}

// ── Kiểm soát thực địa: tỉnh / vương quốc ──────────────────────────────────

export type StrongholdControlKind = "Trực Tiếp" | "Qua Chư Hầu" | "Chưa Kiểm Soát";

export interface StrongholdControl {
  id: string;
  name: string;
  provinceId: string;
  /** Nhà đang giữ thành theo chủ quyền tỉnh hoặc hồ sơ chư hầu. */
  holderHouseId: string;
  vassalId?: string;
  kind: StrongholdControlKind;
  controlled: boolean;
}

export interface TerritorialControlStatus {
  scopeId: string;
  houseId: string;
  provinceIds: string[];
  strongholds: StrongholdControl[];
  controlledStrongholds: number;
  directlyHeldStrongholds: number;
  subduedStrongholds: number;
  totalStrongholds: number;
  controlRatio: number;
  complete: boolean;
  unsecuredStrongholds: StrongholdControl[];
}

const BANNERMAN_PROVINCE_CACHE = new Map<string, MapRegion | null>();
function normalizedSeat(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Tỉnh lá chứa thành của một chư hầu. Dữ liệu M19 cũ chỉ lưu đại vùng trong
 * `Vùng`; hàm này nối tên thành với bản đồ tỉnh mới và có fallback ổn định.
 */
export function provinceForBannerman(bannerman: BannermanData): MapRegion | null {
  if (BANNERMAN_PROVINCE_CACHE.has(bannerman.id)) {
    return BANNERMAN_PROVINCE_CACHE.get(bannerman.id) ?? null;
  }
  const realm = regionsForRealm(bannerman.region);
  const seat = normalizedSeat(bannerman.seat);
  const exact = realm.find((region) => normalizedSeat(region.seat) === seat);
  if (exact) {
    BANNERMAN_PROVINCE_CACHE.set(bannerman.id, exact);
    return exact;
  }
  const byHouse = realm.find((region) => toHouseId(region.defaultHouse) === bannerman.id);
  if (byHouse) {
    BANNERMAN_PROVINCE_CACHE.set(bannerman.id, byHouse);
    return byHouse;
  }

  const marker = MAP_MARKERS.find((candidate) => {
    const markerName = normalizedSeat(candidate.name);
    return candidate.type !== "landmark"
      && !!candidate.regionId
      && (markerName === seat || markerName.startsWith(`${seat} `));
  });
  const province = marker?.regionId && REGIONS_BY_ID[marker.regionId]
    ? REGIONS_BY_ID[marker.regionId]
    : REGIONS_BY_ID[bannerman.region] ?? realm[0] ?? null;
  BANNERMAN_PROVINCE_CACHE.set(bannerman.id, province);
  return province;
}

function provinceForStoredVassal(state: StatData, vassalId: string): MapRegion | null {
  const canon = BANNERMEN.find((bannerman) => bannerman.id === vassalId);
  if (canon) return provinceForBannerman(canon);
  const vassal = state["Chư Hầu"]?.[vassalId];
  if (!vassal) return null;
  const realm = regionsForRealm(vassal["Vùng"]);
  const seat = normalizedSeat(vassal["Thành Trì"]);
  return realm.find((region) => normalizedSeat(region.seat) === seat)
    ?? REGIONS_BY_ID[vassal["Vùng"]]
    ?? realm[0]
    ?? null;
}

function storedVassalAtStronghold(
  state: StatData,
  provinceId: string,
  strongholdName: string,
  preferredId = "",
): [string, StatData["Chư Hầu"][string]] | undefined {
  if (preferredId && state["Chư Hầu"]?.[preferredId]) return [preferredId, state["Chư Hầu"][preferredId]];
  const wantedSeat = normalizedSeat(strongholdName);
  return Object.entries(state["Chư Hầu"] ?? {}).find(([vassalId, vassal]) => {
    if (normalizedSeat(vassal["Thành Trì"]) !== wantedSeat) return false;
    return provinceForStoredVassal(state, vassalId)?.id === provinceId;
  });
}

function directStrongholdForHouse(
  state: StatData,
  provinceId: string,
  strongholdName: string,
  houseId: string,
): boolean {
  const seat = normalizedSeat(strongholdName);
  return Object.entries(state["Lãnh Địa"] ?? {}).some(([holdingId, holding]) => {
    if (holding["Thuộc Vùng"] !== provinceId) return false;
    const holdingName = normalizedSeat(holding["Mô Tả"] ?? holdingId);
    if (!(holdingName === seat || holdingName.startsWith(`${seat} `))) return false;
    const holdingHouse = toHouseId(holding["Nhà Kiểm Soát"] ?? "");
    if (holdingHouse) return holdingHouse === houseId;
    return houseId === playerHouseId(state) && holdingOwnedByPlayer(state, holdingId);
  });
}

function statusForProvinces(
  state: StatData,
  scopeId: string,
  provinces: MapRegion[],
  houseId: string,
): TerritorialControlStatus {
  const wantedHouse = toHouseId(houseId);
  const strongholds: StrongholdControl[] = [];
  const seenVassals = new Set<string>();
  const seenStrongholds = new Set<string>();
  const currentBannermen = activeBannermen(state);
  const currentBannermanIds = new Set(currentBannermen.map((bannerman) => bannerman.id));
  const provinceIds = new Set(provinces.map((province) => province.id));
  const strongholdKey = (provinceId: string, name: string) => `${provinceId}:${normalizedSeat(name)}`;
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const sites = strongholdsForEra(eraId).filter((site) => provinceIds.has(site.provinceId));

  /** Ghép một site với Nhà/chư hầu giữ nó mà không dựa vào chủ quyền province. */
  const bannermanForSite = (site: StrongholdSite, province: MapRegion): BannermanData | undefined => {
    const siteName = normalizedSeat(site.name);
    return currentBannermen.find((bannerman) => {
      if (provinceForBannerman(bannerman)?.id !== province.id) return false;
      return bannerman.id === site.holderHouseId
        || normalizedSeat(bannerman.seat) === siteName
        || normalizedSeat(HOUSES_BY_ID[bannerman.id]?.seat ?? "") === siteName;
    });
  };

  for (const site of sites) {
    const province = REGIONS_BY_ID[site.provinceId];
    if (!province) continue;
    const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[province.id];
    const provinceHolder = toHouseId(String(sovereignty?.["Nhà Kiểm Soát"] ?? ""));
    const ledgerHouse = toHouseId(sovereignty?.["Bá Quyền Thành Trì"]?.[site.id] ?? "");
    const bannerman = bannermanForSite(site, province);
    const preferredVassalId = bannerman?.id
      || site.holderHouseId
      || (province.defaultHouse !== wantedHouse
        ? toHouseId(province.defaultHouse)
        : "");
    const storedEntry = storedVassalAtStronghold(
      state,
      province.id,
      site.name,
      preferredVassalId,
    );
    const changedSeat = site.source === "seat" && (sovereignty?.["_Ngày Đổi Chủ"] ?? 0) > 0;
    const holderHouseId = changedSeat
      ? ledgerHouse || provinceHolder
      : storedEntry?.[0] || site.holderHouseId || toHouseId(province.defaultHouse) || ledgerHouse || provinceHolder;
    const directlyOccupied = !!wantedHouse && (
      directStrongholdForHouse(state, province.id, site.name, wantedHouse)
      || (!!ledgerHouse && ledgerHouse === wantedHouse && (holderHouseId === wantedHouse || changedSeat))
    );
    const subduedByVassal = !!wantedHouse && !!storedEntry
      && toHouseId(storedEntry[1]["Chủ Của"]) === wantedHouse;
    const subduedByLedger = !!wantedHouse && !storedEntry
      && ledgerHouse === wantedHouse && !directlyOccupied;
    const kind: StrongholdControlKind = directlyOccupied
      ? "Trực Tiếp"
      : (subduedByVassal || subduedByLedger) ? "Qua Chư Hầu" : "Chưa Kiểm Soát";
    strongholds.push({
      id: site.id,
      name: site.name,
      provinceId: province.id,
      holderHouseId,
      vassalId: storedEntry?.[0] || bannerman?.id || (preferredVassalId || undefined),
      kind,
      controlled: kind !== "Chưa Kiểm Soát",
    });
    if (storedEntry?.[0]) seenVassals.add(storedEntry[0]);
    if (bannerman?.id) seenVassals.add(bannerman.id);
    seenStrongholds.add(strongholdKey(province.id, site.name));
  }

  // Một chư hầu canon có thành không đủ dữ liệu toạ độ vẫn là mục tiêu thật.
  for (const bannerman of currentBannermen) {
    if (seenVassals.has(bannerman.id)) continue;
    const province = provinceForBannerman(bannerman);
    if (!province || !provinceIds.has(province.id)) continue;
    const key = strongholdKey(province.id, bannerman.seat);
    if (seenStrongholds.has(key)) continue;
    const vassal = state["Chư Hầu"]?.[bannerman.id];
    const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[province.id];
    const ledgerHouse = toHouseId(sovereignty?.["Bá Quyền Thành Trì"]?.[`vassal:${bannerman.id}`] ?? "");
    const direct = !!wantedHouse && directStrongholdForHouse(state, province.id, bannerman.seat, wantedHouse);
    const subdued = !!wantedHouse && (vassal
      ? toHouseId(vassal["Chủ Của"]) === wantedHouse
      : ledgerHouse === wantedHouse);
    const kind: StrongholdControlKind = direct ? "Trực Tiếp" : subdued ? "Qua Chư Hầu" : "Chưa Kiểm Soát";
    strongholds.push({
      id: `vassal:${bannerman.id}`,
      name: bannerman.seat,
      provinceId: province.id,
      holderHouseId: bannerman.id,
      vassalId: bannerman.id,
      kind,
      controlled: kind !== "Chưa Kiểm Soát",
    });
    seenVassals.add(bannerman.id);
    seenStrongholds.add(key);
  }

  // Chư hầu custom/save cũ không có trong catalog vẫn là một chủ thành thật.
  for (const [vassalId, vassal] of Object.entries(state["Chư Hầu"] ?? {})) {
    if (seenVassals.has(vassalId)) continue;
    // Save cổ có thể chứa snapshot M19 từ một bản trước. Giữ dữ liệu để tương
    // thích save, nhưng không biến Nhà canon chưa tồn tại ở era này thành mục tiêu.
    if (BANNERMEN_BY_ID[vassalId] && !currentBannermanIds.has(vassalId)) continue;
    const province = provinceForStoredVassal(state, vassalId);
    if (!province || !provinceIds.has(province.id)) continue;
    const key = strongholdKey(province.id, vassal["Thành Trì"] || vassal["Tên Nhà"]);
    if (seenStrongholds.has(key)) continue;
    const direct = !!wantedHouse && directStrongholdForHouse(
      state, province.id, vassal["Thành Trì"] || vassal["Tên Nhà"], wantedHouse,
    );
    const subdued = !!wantedHouse && toHouseId(vassal["Chủ Của"]) === wantedHouse;
    const kind: StrongholdControlKind = direct ? "Trực Tiếp" : subdued ? "Qua Chư Hầu" : "Chưa Kiểm Soát";
    strongholds.push({
      id: `vassal:${vassalId}`,
      name: vassal["Thành Trì"] || vassal["Tên Nhà"],
      provinceId: province.id,
      holderHouseId: vassalId,
      vassalId,
      kind,
      controlled: kind !== "Chưa Kiểm Soát",
    });
    seenStrongholds.add(key);
  }

  const controlledStrongholds = strongholds.filter((stronghold) => stronghold.controlled).length;
  const directlyHeldStrongholds = strongholds.filter((stronghold) => stronghold.kind === "Trực Tiếp").length;
  const subduedStrongholds = strongholds.filter((stronghold) => stronghold.kind === "Qua Chư Hầu").length;
  const totalStrongholds = strongholds.length;
  const controlRatio = totalStrongholds > 0 ? controlledStrongholds / totalStrongholds : 0;
  return {
    scopeId,
    houseId: wantedHouse,
    provinceIds: provinces.map((province) => province.id),
    strongholds,
    controlledStrongholds,
    directlyHeldStrongholds,
    subduedStrongholds,
    totalStrongholds,
    controlRatio,
    complete: totalStrongholds > 0 && controlledStrongholds === totalStrongholds,
    unsecuredStrongholds: strongholds.filter((stronghold) => !stronghold.controlled),
  };
}

/** Kiểm soát một tỉnh lá: thành tỉnh và mọi thành phụ nằm trong tỉnh. */
export function provinceControlStatus(
  state: StatData,
  provinceId: string,
  houseId = playerHouseId(state),
): TerritorialControlStatus {
  const province = REGIONS_BY_ID[provinceId];
  return statusForProvinces(state, provinceId, province ? [province] : [], houseId);
}

/**
 * Kiểm soát một chính thể/vương quốc lịch sử. Chỉ hoàn toàn khi TẤT CẢ thủ phủ
 * tỉnh và thành chư hầu đã bị chiếm trực tiếp hoặc chủ thành đã thần phục.
 */
export function realmControlStatus(
  state: StatData,
  realmId: string,
  houseId = playerHouseId(state),
): TerritorialControlStatus {
  return statusForProvinces(state, realmId, regionsForRealm(realmId), houseId);
}

/** Alias phạm vi động: id chính thể ưu tiên cả cõi; id tỉnh thường chỉ xét tỉnh. */
export function regionalControlStatus(
  state: StatData,
  scopeId: string,
  houseId = playerHouseId(state),
): TerritorialControlStatus {
  const realm = regionsForRealm(scopeId);
  return realm.length > 1
    ? statusForProvinces(state, scopeId, realm, houseId)
    : provinceControlStatus(state, scopeId, houseId);
}

export function controlsRegionCompletely(state: StatData, scopeId: string, houseId = playerHouseId(state)): boolean {
  return regionalControlStatus(state, scopeId, houseId).complete;
}

/** Tra cứu một mục tiêu thành trì theo đúng era của ván hiện tại. */
export function strongholdForState(state: StatData, strongholdId: string): StrongholdSite | undefined {
  return strongholdById(strongholdId, state["Cài Đặt Ván"]["Thời Kỳ"] ?? "");
}

/** Nhà đang nắm một thành cụ thể; không suy rộng từ việc chiếm thủ phủ của province. */
export function strongholdController(state: StatData, strongholdId: string): string {
  const site = strongholdForState(state, strongholdId);
  if (!site) return "";
  const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[site.provinceId];
  const ledger = toHouseId(sovereignty?.["Bá Quyền Thành Trì"]?.[site.id] ?? "");
  if (ledger) return ledger;
  return site.source === "seat" ? toHouseId(sovereignty?.["Nhà Kiểm Soát"] ?? "") : "";
}

/**
 * Ghi bá quyền của đúng một thành và làm mới cache kiểm soát province. MUTATE.
 * Hàm không tự đổi chủ quyền province; riêng thủ phủ phải đi qua captureRegion.
 */
export function setStrongholdControlMutate(
  state: StatData,
  strongholdId: string,
  newHouseId: string,
): boolean {
  const site = strongholdForState(state, strongholdId);
  if (!site) return false;
  const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[site.provinceId];
  if (!sovereignty) return false;
  const ledger = sovereignty["Bá Quyền Thành Trì"] ?? {};
  ledger[site.id] = toHouseId(newHouseId);
  sovereignty["Bá Quyền Thành Trì"] = ledger;
  const provinceHouse = toHouseId(sovereignty["Nhà Kiểm Soát"] ?? "");
  sovereignty["Kiểm Soát Hoàn Toàn"] = !!provinceHouse
    && provinceControlStatus(state, site.provinceId, provinceHouse).complete;
  return true;
}

/** Kho tài nguyên khởi điểm cho 1 lãnh địa mới (10.1). */
function baseResources(): Record<string, number> {
  return {
    "Ngân Khố": 0, "Lương Thực": 3000, "Gỗ": 300, "Đá": 300, "Quặng Sắt": 150,
    "Than Đá": 80, "Thép": 40, "Vải Vóc": 60, "Ngựa": 20, "Muối": 100,
  };
}

/** Dựng object Territory (10.1) cho 1 vùng/thành trì — dùng khi tạo/chiếm holding. */
export function makeHolding(opts?: { regionId?: string; terrain?: string; coastal?: boolean; name?: string; danSo?: number; trungThanh?: number; moTa?: string; taiNguyen?: Record<string, number>; lord?: string; terrainSeed?: number }): Record<string, unknown> {
  return {
    "Mô Tả": opts?.moTa ?? (opts?.name ? `${opts.name}` : `Thành trì`),
    "Dân Số": opts?.danSo ?? 10000,
    // Cơ cấu nghề: không có dân phu, thợ đá, kỹ sư thì lãnh địa chẳng khởi công
    // được gì — nhân lực là điều kiện cần ngang với vật tư (10.3).
    "Dân Số Chi Tiết": defaultJobSplit(opts?.danSo ?? 10000),
    "Trung Thành": opts?.trungThanh ?? 60,
    "Người Kiểm Soát": opts?.lord ?? "",
    "Thuộc Vùng": opts?.regionId ?? "",
    "Địa Hình": opts?.terrain,
    "Ven Biển": opts?.coastal ?? false,
    "Hạt Giống Địa Hình": opts?.terrainSeed,
    "Tài Nguyên": opts?.taiNguyen ?? baseResources(),
    "Công Trình": {},
    "Khủng Hoảng": [],
  };
}

/**
 * Hạt giống địa thế cho một lãnh địa vừa về tay ai đó. Dẫn xuất từ seed gốc của
 * ván + ngày + id nên tái lập được (reroll/undo không đổi đất), nhưng mỗi lần
 * chiếm/được phong ở thời điểm khác nhau là một địa thế khác nhau.
 */
export function newTerrainSeed(state: StatData, holdingId: string, day: number): number {
  const root = state["_engineMeta"]?.["_Seed Gốc"] ?? 1;
  return eventSeed(root, day, `terrain:${holdingId}`) >>> 0;
}

/**
 * Gieo địa thế cho những lãnh địa chưa có hạt giống. CHỈ gọi lúc TẠO VÁN — gọi
 * lúc nạp save sẽ làm đất đai của ván cũ biến dạng. MUTATE state.
 */
export function seedMissingTerrain(state: StatData, day = 0): number {
  let n = 0;
  for (const [id, holding] of Object.entries(state["Lãnh Địa"])) {
    // Toà thành có trong tiểu thuyết thì địa thế đã ghim sẵn — không gieo.
    if (loreSeatFor(id, holding["Mô Tả"])) continue;
    if (holding["Hạt Giống Địa Hình"] === undefined) {
      holding["Hạt Giống Địa Hình"] = newTerrainSeed(state, id, day);
      n++;
    }
  }
  return n;
}

/**
 * Nạp Chủ Quyền Lãnh Thổ từ Era (9.6.1) — MUTATE state (dùng lúc initvar).
 * createIfMissing: tạo entry Lãnh Địa cho vùng quê nếu người chơi kiểm soát mà
 * chưa có holding (tuyến canon — lãnh chúa). Tuyến wizard chỉ MIGRATE holding
 * gói xuất thân sẵn có (giữ nguyên số lượng holding — 8.5).
 */
export function seedRegionControl(
  state: StatData,
  _eraId: string,
  opts?: { createIfMissing?: boolean; requirePersonOwnership?: boolean },
): void {
  const currentYear = state["Thế Giới"]["Năm"] ?? 298;
  repairRegionControl(state, { mode: "fresh-seed", year: currentYear });
  const pHouse = playerHouseId(state);
  repairPlayerSovereignty(state);

  const home = homeRegionForHouse(pHouse);
  const holdings = state["Lãnh Địa"] as Record<string, unknown>;
  const playerControlsHome = home &&
    (opts?.requirePersonOwnership
      ? playerOwnsProvince(state, home.id)
      : state["Chủ Quyền Lãnh Thổ"][home.id]?.["Nhà Kiểm Soát"] === pHouse);
  if (!home || !playerControlsHome) return;

  // MIGRATE: Đặt "Thuộc Vùng" cho holding gói xuất thân. Nếu là nhân vật canon, tạo Lãnh Địa cho trọng trấn.
  const genericKeys = Object.keys(holdings);
  if (genericKeys.length > 0) {
    // Nếu holding đã trỏ tới một vùng hợp lệ do wizard/người chơi chọn thì GIỮ
    // nguyên. Chỉ save/gói xuất thân cũ chưa có vị trí mới được bù về vùng quê.
    const src = holdings[genericKeys[0]] as Record<string, unknown>;
    const selectedId = String(src["Thuộc Vùng"] ?? "");
    const selectedRegion = REGIONS_BY_ID[selectedId];
    const holdingRegion = selectedRegion ?? home;
    if (!selectedRegion) src["Thuộc Vùng"] = home.id;
    if (!src["Địa Hình"]) src["Địa Hình"] = holdingRegion.terrain;
    if (src["Ven Biển"] === undefined) src["Ven Biển"] = holdingRegion.coastal;
  } else if (opts?.createIfMissing) {
    // Tạo Lãnh Địa cho trọng trấn (seat) của vùng nếu là canon player
    if (home.seat) {
      const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] || _eraId;
      const seatMarker = markersForEra(eraId).find((m) => normalizedSeat(m.name) === normalizedSeat(home.seat));
      const seatId = seatMarker ? seatMarker.id : home.id + "-seat";
      holdings[seatId] = makeHolding({
        regionId: home.id,
        terrain: home.terrain,
        coastal: home.coastal,
        name: home.seat,
        danSo: canonicalSettlementPopulation(
          seatId,
          home.seat,
          home.id,
          eraId,
          seatMarker?.population ?? 20_000,
        ),
        lord: state["Thông Tin Nhân Vật"]["Họ Tên"],
        terrainSeed: newTerrainSeed(state, seatId, 0),
      });
    }
  }
  // Holding vừa migrate/tạo là bằng chứng quyền PERSON; chốt lại cờ sau nó.
  repairPlayerSovereignty(state);
}

/**
 * Đổi chủ 1 vùng (9.5.1) — trả PatchOp[] cho ENGINE áp (vây thành 12.2 / đổi
 * phe / thừa kế 13.4). Đồng bộ 2 chiều: cập nhật Chủ Quyền + tạo/xoá Lãnh Địa.
 */
export function captureRegionOps(
  state: StatData,
  regionId: string,
  newHouseId: string,
  capturedOnDay: number,
): PatchOp[] {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return [];
  const pHouse = playerHouseId(state);
  const isPlayer = !!pHouse && newHouseId === pHouse;
  const wasPlayer = playerOwnsProvince(state, regionId);
  const base = `stat_data.Chủ Quyền Lãnh Thổ.${regionId}`;
  const conqueredGovernance = {
    ...makeDefaultRegionGovernance(),
    "Trật Tự": 35, "Hội Nhập": 20, "Chấp Nhận Văn Hoá": 30, "Bất Ổn": 55,
  };
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";

  // Tìm seat marker ID cho region trước để mô phỏng đúng trạng thái sau chiếm.
  const seatMarker = markersForEra(eraId).find((m) => normalizedSeat(m.name) === normalizedSeat(region.seat));
  const seatId = seatMarker ? seatMarker.id : region.id + "-seat";
  const seatPopulation = canonicalSettlementPopulation(
    seatId,
    region.seat,
    region.id,
    eraId,
    seatMarker?.population ?? 20_000,
  );
  const projected = structuredClone(state);
  const projectedSovereignty = projected["Chủ Quyền Lãnh Thổ"][regionId];
  const seatStronghold = strongholdsForProvince(region.id, eraId).find((site) => site.source === "seat");
  const nextStrongholdLedger = {
    ...(state["Chủ Quyền Lãnh Thổ"][regionId]?.["Bá Quyền Thành Trì"] ?? {}),
  };
  if (seatStronghold) nextStrongholdLedger[seatStronghold.id] = newHouseId;
  if (projectedSovereignty) {
    projectedSovereignty["Nhà Kiểm Soát"] = newHouseId;
    projectedSovereignty["Người Kiểm Soát"] = isPlayer
      ? state["Thông Tin Nhân Vật"]["Họ Tên"]
      : "";
    projectedSovereignty["Bá Quyền Thành Trì"] = nextStrongholdLedger;
  }
  if (isPlayer && !projected["Lãnh Địa"][seatId]) {
    projected["Lãnh Địa"][seatId] = makeHolding({
      regionId: region.id,
      terrain: region.terrain,
      coastal: region.coastal,
      name: region.seat,
      danSo: seatPopulation,
      lord: state["Thông Tin Nhân Vật"]["Họ Tên"],
    }) as StatData["Lãnh Địa"][string];
  } else if (!isPlayer && wasPlayer && projected["Lãnh Địa"][seatId]) {
    delete projected["Lãnh Địa"][seatId];
  }
  const fullControl = !!newHouseId && provinceControlStatus(projected, regionId, newHouseId).complete;

  const ops: PatchOp[] = [
    { op: "replace", path: `${base}.Nhà Kiểm Soát`, value: newHouseId },
    {
      op: "replace",
      path: `${base}.Người Kiểm Soát`,
      value: isPlayer ? state["Thông Tin Nhân Vật"]["Họ Tên"] : "",
    },
    { op: "replace", path: `${base}.Tình Trạng`, value: "Mới Chiếm" },
    { op: "replace", path: `${base}.Là Của Người Chơi`, value: isPlayer },
    { op: "replace", path: `${base}.Kiểm Soát Hoàn Toàn`, value: fullControl },
    { op: "replace", path: `${base}.Bá Quyền Thành Trì`, value: nextStrongholdLedger },
    { op: "replace", path: `${base}.Quản Trị`, value: conqueredGovernance },
    { op: "replace", path: `${base}._Ngày Đổi Chủ`, value: capturedOnDay },
  ];

  if (isPlayer && !state["Lãnh Địa"][seatId]) {
    // về tay người chơi → mở quản trị nội bộ thành trì trọng trấn, GIEO địa thế mới
    ops.push({
      op: "replace", path: `stat_data.Lãnh Địa.${seatId}`,
      value: makeHolding({
        regionId: region.id, terrain: region.terrain, coastal: region.coastal, name: region.seat,
        danSo: seatPopulation, trungThanh: 35,
        moTa: `${region.seat} — vừa chiếm được, dân chưa quy phục`,
        lord: state["Thông Tin Nhân Vật"]["Họ Tên"],
        terrainSeed: newTerrainSeed(state, seatId, capturedOnDay),
      }),
    });
  } else if (!isPlayer && wasPlayer && state["Lãnh Địa"][seatId]) {
    // mất vùng → đóng quản trị thành trì trọng trấn (nếu người chơi mất vùng)
    // Lưu ý: Nếu người chơi có các thành trì khác trong vùng, chúng vẫn được giữ lại!
    ops.push({ op: "remove", path: `stat_data.Lãnh Địa.${seatId}` });
  }
  return ops;
}

// ── Tô màu runtime (9.5.2) ──────────────────────────────────────────────────

export type MapMode = "political" | "relationship" | "faction";

export interface RegionFill {
  color: string;
  /** vùng vô chủ/tranh chấp → sọc 2 màu. */
  striped: boolean;
  isPlayer: boolean;
  status: string;
  house: string;
  controlRatio: number;
  fullControl: boolean;
  /** ngày tuyệt đối đổi chủ gần nhất (animation "lan chiếm" 9.5.3). */
  changedDay: number;
}

export function regionController(state: StatData, regionId: string): string {
  return toHouseId(state["Chủ Quyền Lãnh Thổ"][regionId]?.["Nhà Kiểm Soát"] ?? "");
}

function explicitFactionForHouse(factions: Record<string, string[]>, houseId: string): string | undefined {
  const normalizedHouse = toHouseId(houseId);
  if (!normalizedHouse) return undefined;
  return Object.entries(factions).find(([, houses]) => (
    houses.some((candidate) => toHouseId(candidate) === normalizedHouse)
  ))?.[0];
}

function liveFactionForHouse(
  state: StatData,
  factions: Record<string, string[]> | null,
  houseId: string,
): string {
  const holder = toHouseId(houseId);
  if (!holder) return "__neutral__";

  const direct = factions ? explicitFactionForHouse(factions, holder) : undefined;
  if (direct) return direct;

  // Chỉ gộp chư hầu khi state có lời thần phục thật. Không suy ngược từ việc
  // cùng nằm trong một Vương quốc de-jure.
  const vassalEntry = state["Chư Hầu"]?.[holder]
    ?? Object.entries(state["Chư Hầu"] ?? {}).find(([id]) => toHouseId(id) === holder)?.[1];
  const liege = toHouseId(vassalEntry?.["Chủ Của"] ?? "");
  if (liege && liege !== holder) {
    return (factions ? explicitFactionForHouse(factions, liege) : undefined) ?? `house:${liege}`;
  }

  const player = playerHouseId(state);
  const relation = state["Quan Hệ Ngoại Giao"]?.[holder]?.["Trạng Thái"];
  if (player && holder !== player && (relation === "Liên Minh" || relation === "Thần Phục Ta")) {
    return (factions ? explicitFactionForHouse(factions, player) : undefined) ?? `house:${player}`;
  }
  if (holder === player) {
    const overlord = Object.entries(state["Quan Hệ Ngoại Giao"] ?? {})
      .find(([, current]) => current["Trạng Thái"] === "Ta Thần Phục")?.[0];
    const overlordId = toHouseId(overlord ?? "");
    if (overlordId) {
      return (factions ? explicitFactionForHouse(factions, overlordId) : undefined) ?? `house:${overlordId}`;
    }
  }

  // Có chủ nhưng chưa có liên kết chính trị: đây là một phe độc lập, không phải
  // "trung lập / chưa rõ" và cũng không tự động thuộc đại vùng de-jure.
  return `house:${holder}`;
}

/** Phe chính trị của province; regionId giữ trong API để UI có một điểm gọi ổn định. */
export function factionIdForRegion(state: StatData, regionId: string, houseId?: string): string {
  const factions = factionsForYear(state["Thế Giới"]["Năm"] ?? 298);
  const holder = toHouseId(houseId ?? regionController(state, regionId));
  return liveFactionForHouse(state, factions, holder);
}

/** Màu + kiểu tô 1 vùng theo chế độ hiển thị (9.5.2). */
export function regionFill(state: StatData, regionId: string, mode: MapMode): RegionFill {
  const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
  const house = toHouseId(sov?.["Nhà Kiểm Soát"] ?? "");
  const isPlayer = !!sov?.["Là Của Người Chơi"];
  const status = sov?.["Tình Trạng"] ?? "Ổn Định";
  const changedDay = sov?.["_Ngày Đổi Chủ"] ?? 0;
  const control = house ? provinceControlStatus(state, regionId, house) : undefined;
  const controlRatio = control?.controlRatio ?? 0;
  const fullControl = control?.complete ?? false;
  const striped = !fullControl;

  if (mode === "relationship") {
    if (isPlayer) {
      return { color: PLAYER_HEAT_COLOR, striped, isPlayer, status, house, controlRatio, fullControl, changedDay };
    }
    if (!house) {
      return { color: NEUTRAL_COLOR.base, striped: true, isPlayer, status, house, controlRatio, fullControl, changedDay };
    }
    const schemaName = HOUSES_BY_ID[house]?.schemaName ?? "";
    const attitude = state["Thái Độ Các Nhà"][schemaName]?.["Thái Độ"] ?? "Cảnh Giác";
    const heat = ATTITUDE_HEAT[attitude] ?? ATTITUDE_HEAT["Cảnh Giác"];
    return { color: heat.color, striped, isPlayer, status, house, controlRatio, fullControl, changedDay };
  }

  if (mode === "faction") {
    const currentYear = state["Thế Giới"]["Năm"] ?? 298;
    const eraFactions = factionsForYear(currentYear);
    if (eraFactions) {
      const foundFaction = factionIdForRegion(state, regionId, house);
      
      if (foundFaction !== "__neutral__") {
        // Use a generic logic to color by faction based on its name or specific house color
        const factionColorId = FACTION_COLORS_MAP[foundFaction] ?? house;
        return {
          color: factionColorId ? houseColor(factionColorId).base : NEUTRAL_COLOR.base,
          striped,
          isPlayer,
          status,
          house, // still keep the house for UI tooltips
          controlRatio,
          fullControl,
          changedDay,
        };
      }
      // Vùng không thuộc phe nào trong thời kỳ nội chiến sẽ có màu trung lập
      return {
        color: NEUTRAL_COLOR.base,
        striped: true, // Sọc hiển thị sự trung lập/không rõ ràng
        isPlayer,
        status,
        house,
        controlRatio,
        fullControl,
        changedDay,
      };
    }
  }

  // chính trị: màu bản sắc Nhà kiểm soát
  return {
    color: house ? houseColor(house).base : NEUTRAL_COLOR.base,
    striped,
    isPlayer,
    status,
    house,
    controlRatio,
    fullControl,
    changedDay,
  };
}

// ── Tính toán Lãnh Địa ──────────────────────────────────────────────────────
// CHỐT SỔ THÁNG nằm ở construction.tickTerritoryIncome (listener "territory-income").
// KHÔNG thêm vòng thu nhập thứ hai ở đây: trước kia monthlyTick() chạy song song
// với listener đó nên mỗi tháng lãnh địa được cộng thu nhập HAI LẦN.
// Quy hoạch/đặt công trình Tầng 1: xem territory/localMap.ts.
