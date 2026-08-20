/**
 * Dữ liệu địa lý đang vận hành của năm tầng bản đồ.
 *
 * `MapRegion.population` là dân số nền của cả tỉnh (gồm thành thị và nông thôn),
 * còn `Lãnh Địa.*.Dân Số` là số đang thay đổi trong ván chơi. Khi một thành trì
 * có dữ liệu runtime, ta THAY phần dân số nền của đúng địa danh đó bằng số
 * runtime thay vì cộng chồng. Nhờ vậy một lần sinh/chết/di cư chỉ được tính một
 * lần ở Lãnh Địa → Lãnh Thổ → Vương Quốc → Thế Giới.
 */
import type { StatData } from "../mvu/schema";
import {
  REGIONS,
  REGIONS_BY_ID,
  type ContinentId,
  type MapRegion,
  resolveRegionId,
} from "../content/westeros/regions";
import { MAP_MARKERS, markersForEra, type MapMarker } from "../content/westeros/mapMarkers";
import { seatProfileFor } from "../content/westeros/seatProfiles";

type Holding = StatData["Lãnh Địa"][string];

function placeKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[’']/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function markerByIdentity(id: string, name: string, regionId?: string, eraId = ""): MapMarker | undefined {
  const wantedId = placeKey(id);
  const wantedName = placeKey(name);
  const markers = eraId ? markersForEra(eraId) : MAP_MARKERS;
  return markers.find((marker) => {
    if (regionId && resolveRegionId(marker.regionId ?? "") !== resolveRegionId(regionId)) return false;
    return placeKey(marker.id) === wantedId
      || (!!wantedName && placeKey(marker.name) === wantedName);
  });
}

/**
 * Dân số canon của một địa danh trước khi ván chơi làm nó thay đổi.
 * Thứ tự ưu tiên cố ý duy nhất cho toàn app:
 * hồ sơ thành theo era → dân số thủ phủ province → marker bản đồ → fallback.
 */
export function canonicalSettlementPopulation(
  id: string,
  name: string,
  regionId: string,
  eraId = "",
  fallback = 0,
): number {
  const region = REGIONS_BY_ID[regionId];
  const marker = markerByIdentity(id, name, regionId, eraId);
  const candidates = [
    id,
    marker?.id,
    region && placeKey(name) === placeKey(region.seat) ? `${region.id}-seat` : undefined,
    region && region.id === region.realmId && placeKey(name) === placeKey(region.seat)
      ? `${region.realmId}-seat`
      : undefined,
  ].filter((candidate): candidate is string => !!candidate);

  for (const candidate of [...new Set(candidates)]) {
    const profile = seatProfileFor(candidate, eraId);
    if (profile) return Math.max(0, Math.round(profile.population));
  }
  if (region && placeKey(name) === placeKey(region.seat) && region.seatPopulation !== undefined) {
    return Math.max(0, Math.round(region.seatPopulation));
  }
  if (marker?.population !== undefined) return Math.max(0, Math.round(marker.population));
  return Math.max(0, Math.round(fallback));
}

function holdingBaselinePopulation(
  holdingId: string,
  holding: Holding,
  region: MapRegion,
  eraId: string,
  claimedPlaces: Set<string>,
): number {
  const name = holding["Mô Tả"] || holdingId;
  const marker = markerByIdentity(holdingId, name, region.id, eraId);
  const isSeat = holdingId === `${region.id}-seat` || placeKey(name) === placeKey(region.seat);
  const identity = marker ? `marker:${marker.id}` : isSeat ? `seat:${region.id}` : "";
  if (identity && claimedPlaces.has(identity)) return 0;
  if (identity) claimedPlaces.add(identity);
  return canonicalSettlementPopulation(
    marker?.id ?? holdingId,
    marker?.name ?? (isSeat ? region.seat : name),
    region.id,
    eraId,
    0,
  );
}

export interface RegionPopulationBreakdown {
  /** Dân số canon của cả province trước biến động của ván. */
  baseline: number;
  /** Tổng dân số runtime của các lãnh địa đã có hồ sơ. */
  managedPopulation: number;
  /** Phần nền tương ứng đã được thay thế bởi hồ sơ runtime. */
  replacedBaseline: number;
  /** Chênh lệch sinh/chết/di cư/xây thêm khu dân cư so với canon. */
  runtimeDelta: number;
  /** Dân số hiện tại dùng chung cho mọi tầng bản đồ. */
  total: number;
}

export function regionPopulationBreakdown(
  state: StatData,
  regionId: string,
  eraId = "",
): RegionPopulationBreakdown {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return { baseline: 0, managedPopulation: 0, replacedBaseline: 0, runtimeDelta: 0, total: 0 };

  const claimedPlaces = new Set<string>();
  let managedPopulation = 0;
  let replacedBaseline = 0;
  for (const [holdingId, holding] of Object.entries(state["Lãnh Địa"])) {
    if (resolveRegionId(holding["Thuộc Vùng"]) !== region.id) continue;
    const population = Math.max(0, Math.round(holding["Dân Số"] ?? 0));
    managedPopulation += population;
    replacedBaseline += holdingBaselinePopulation(holdingId, holding, region, eraId, claimedPlaces);
  }

  const runtimeDelta = managedPopulation - replacedBaseline;
  return {
    baseline: region.population,
    managedPopulation,
    replacedBaseline,
    runtimeDelta,
    total: Math.max(0, Math.round(region.population + runtimeDelta)),
  };
}

export function regionPopulation(state: StatData, regionId: string, eraId = ""): number {
  return regionPopulationBreakdown(state, regionId, eraId).total;
}

export function realmPopulation(state: StatData, realmId: string, eraId = ""): number {
  const wanted = resolveRegionId(realmId);
  return REGIONS
    .filter((region) => resolveRegionId(region.realmId) === wanted)
    .reduce((sum, region) => sum + regionPopulation(state, region.id, eraId), 0);
}

export function worldPopulation(state: StatData, eraId = "", continentId?: ContinentId): number {
  return REGIONS
    .filter((region) => !continentId || region.continentId === continentId)
    .reduce((sum, region) => sum + regionPopulation(state, region.id, eraId), 0);
}
