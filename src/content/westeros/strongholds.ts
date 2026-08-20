/**
 * Danh mục mục tiêu kiểm soát thực địa.
 *
 * Province là đơn vị hành chính; thành trì mới là điểm phải chiếm hoặc buộc chủ
 * thành thần phục. Bảng này ghép ba nguồn mà không lưu dân số/chủ quyền lần hai:
 *   - thủ phủ của từng province;
 *   - lâu đài canon đã có trên bản đồ;
 *   - các cứ điểm chiến lược cấp địa phương để một province không còn là một
 *     mục tiêu duy nhất rồi lập tức đạt 100%.
 *
 * Cứ điểm chiến lược là địa điểm gameplay (không tự nhận là địa danh canon) và
 * được đặt tất định bên trong polygon province. Mỗi province phong kiến ở
 * Westeros có ít nhất bốn đầu mối quyền lực.
 */
import { REGIONS, REGIONS_BY_ID, type MapRegion } from "../world/geography";
import { markersForEra } from "./mapMarkers";

export type StrongholdSource = "seat" | "canon" | "strategic";

export interface StrongholdSite {
  /** ID dùng trong save/engine; ổn định giữa các lần tải. */
  id: string;
  name: string;
  provinceId: string;
  world: [number, number];
  source: StrongholdSource;
  /** Nhà giữ thành theo lore nếu biết; bá quyền hiện tại vẫn nằm trong state. */
  holderHouseId: string;
  /** Dân số ước lượng của riêng cứ điểm, không phải dân số province. */
  population: number;
  description: string;
  markerId?: string;
  wikiSlug?: string;
}

export const MIN_STRONGHOLDS_PER_PROVINCE = 4;

const NIGHT_WATCH_IDS = new Set(["castle-black", "shadow-tower", "eastwatch"]);

/** Những lâu đài phụ có chủ nhà rõ; thủ phủ province lấy chủ từ geography/state. */
const CANON_HOLDER_BY_MARKER: Record<string, string> = {
  dreadfort: "bolton",
  karhold: "karstark",
  "bear-island": "mormont",
  "deepwood-motte": "glover",
  "torrhens-square": "tallhart",
  hornwood: "hornwood",
  harlaw: "harlaw",
  runestone: "royce",
  "hearts-home": "corbray",
  "the-twins": "frey",
  seagard: "mallister",
  "stone-hedge": "bracken",
  "raventree-hall": "blackwood",
  "golden-tooth": "lefford",
  crakehall: "crakehall",
  ashemark: "marbrand",
  faircastle: "farman",
  dragonstone: "targaryen",
  driftmark: "velaryon",
  "claw-isle": "celtigar",
  rosby: "rosby",
  stokeworth: "stokeworth",
  "horn-hill": "tarly",
  bitterbridge: "caswell",
  brightwater: "florent",
  "evenfall-hall": "tarth",
  "griffins-roost": "connington",
  blackhaven: "dondarrion",
  nightsong: "caron",
  yronwood: "yronwood",
  starfall: "dayne",
  lemonwood: "dalt",
  "ghost-hill": "toland",
};

function normalized(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function feudalProvince(region: MapRegion): boolean {
  return region.continentId === "westeros" && region.realmId !== "beyond-wall";
}

function eraSeatName(region: MapRegion, eraId: string): string {
  if (!region.seatHiddenEras?.includes(eraId)) return region.seat;
  if (region.id === "the-crownlands" && eraId === "aegon-conquest") return "Aegon's Fort";
  return `Cứ điểm cổ ${region.name}`;
}

function boundsOf(region: MapRegion): { minX: number; maxX: number; minY: number; maxY: number } {
  const xs = region.polygonPx.map(([x]) => x);
  const ys = region.polygonPx.map(([, y]) => y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}

function strategicNames(region: MapRegion): string[] {
  const short = region.name.replace(/^Đất\s+/i, "");
  if (region.island) return [`Hải Thành ${short}`, `Đồn Eo Biển ${short}`, `Tháp Hải Đăng ${short}`];
  if (region.coastal) return [`Hải Pháo Đài ${short}`, `Đồn Cửa Biển ${short}`, `Thành Lũy ${short}`];
  if (region.terrain === "Hẻm Núi" || region.terrain === "Đồi Núi") {
    return [`Ải Bắc ${short}`, `Tháp Đá ${short}`, `Đồn Đường Núi ${short}`];
  }
  if (region.terrain === "Sông/Lối Vượt Sông" || region.terrain === "Đầm Lầy") {
    return [`Thành Cầu ${short}`, `Đồn Bến Vượt ${short}`, `Tháp Canh ${short}`];
  }
  if (region.terrain === "Rừng Rậm") return [`Đồn Rìa Rừng ${short}`, `Tháp Canh ${short}`, `Thành Lũy ${short}`];
  return [`Đồn Bắc ${short}`, `Tháp Canh ${short}`, `Thành Lũy ${short}`];
}

function strategicPoint(region: MapRegion, slot: number): [number, number] {
  const b = boundsOf(region);
  const width = Math.max(12, b.maxX - b.minX);
  const height = Math.max(12, b.maxY - b.minY);
  const placements: Array<[number, number]> = [
    [0.28, 0.32], [0.72, 0.36], [0.5, 0.73], [0.23, 0.7], [0.78, 0.7],
  ];
  const [rx, ry] = placements[slot % placements.length];
  return [b.minX + width * rx, b.minY + height * ry];
}

function seatSite(region: MapRegion, eraId: string): StrongholdSite {
  const name = eraSeatName(region, eraId);
  return {
    id: `seat:${region.id}`,
    name,
    provinceId: region.id,
    world: region.seatXY,
    source: "seat",
    holderHouseId: region.defaultHouse,
    population: Math.max(400, Math.round(region.seatPopulation ?? region.population * 0.012)),
    description: `Thủ phủ hành chính của ${region.name}; chiếm nơi này đổi chủ quyền province nhưng chưa khuất phục các thành còn lại.`,
  };
}

const CACHE = new Map<string, StrongholdSite[]>();

/** Toàn bộ mục tiêu thành trì đang tồn tại trong era. */
export function strongholdsForEra(eraId = ""): StrongholdSite[] {
  const key = eraId || "__default__";
  const cached = CACHE.get(key);
  if (cached) return cached;

  const markers = markersForEra(eraId).filter((marker) => marker.type === "castle" && !NIGHT_WATCH_IDS.has(marker.id));
  const result: StrongholdSite[] = [];

  for (const region of REGIONS.filter(feudalProvince)) {
    const sites: StrongholdSite[] = [seatSite(region, eraId)];
    const names = new Set([normalized(sites[0].name), normalized(region.seat)]);

    for (const marker of markers) {
      if (marker.regionId !== region.id) continue;
      const markerName = normalized(marker.name);
      if (names.has(markerName) || markerName === normalized(region.seat)) continue;
      sites.push({
        id: `castle:${marker.id}`,
        name: marker.name,
        provinceId: region.id,
        world: [marker.x, marker.y],
        source: "canon",
        holderHouseId: CANON_HOLDER_BY_MARKER[marker.id] ?? "",
        population: Math.max(300, Math.round(marker.population ?? region.population * 0.0025)),
        description: `Lâu đài canon trong ${region.name}; phải bị chiếm hoặc chủ thành phải thần phục.`,
        markerId: marker.id,
        wikiSlug: marker.wikiSlug,
      });
      names.add(markerName);
    }

    const generatedNames = strategicNames(region);
    let slot = 0;
    while (sites.length < MIN_STRONGHOLDS_PER_PROVINCE) {
      const name = generatedNames[slot % generatedNames.length];
      sites.push({
        id: `fort:${region.id}:${slot + 1}`,
        name,
        provinceId: region.id,
        world: strategicPoint(region, slot),
        source: "strategic",
        holderHouseId: "",
        population: Math.max(180, Math.round(region.population * (0.0012 + slot * 0.00025))),
        description: `Cứ điểm chiến lược địa phương của ${region.name}; đây là địa điểm gameplay, không tự nhận là địa danh canon.`,
      });
      slot += 1;
    }
    result.push(...sites);
  }

  const frozen = result.map((site) => Object.freeze(site));
  CACHE.set(key, frozen);
  return frozen;
}

export function strongholdsForProvince(provinceId: string, eraId = ""): StrongholdSite[] {
  return strongholdsForEra(eraId).filter((site) => site.provinceId === provinceId);
}

export function strongholdById(id: string, eraId = ""): StrongholdSite | undefined {
  return strongholdsForEra(eraId).find((site) => site.id === id);
}

export function provinceForStronghold(id: string, eraId = ""): MapRegion | undefined {
  const site = strongholdById(id, eraId);
  return site ? REGIONS_BY_ID[site.provinceId] : undefined;
}
