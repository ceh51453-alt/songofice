/**
 * kingdoms (M21) — BÀN CỜ QUYỀN LỰC CỦA THẾ GIỚI ĐÃ BIẾT.
 *
 * Bảng "7 Vương Quốc" cũ chỉ đếm lại những con số mà Bản Đồ, Quân Sự và Ngoại
 * Giao đều đã hiện — nên nó vô dụng. Cái người chơi thật sự cần khi mở nó là câu
 * trả lời cho ba câu hỏi VĨ MÔ mà không bảng nào khác trả lời được:
 *
 *   1. AI MẠNH HƠN AI — cán cân giữa các thế lực đang nắm đất (đất, người, đinh
 *      tráng gọi được), và ta đứng thứ mấy trong cái hàng đó.
 *   2. CHUYỆN GÌ ĐANG XẢY RA TRÊN LỤC ĐỊA HIỆN TẠI — ai giữ, giữ có chắc không, thành nào
 *      đang bị vây và còn mấy ngày nữa thì đổ, vùng nào vừa đổi chủ.
 *   3. TA ĐỨNG Ở ĐÂU TRONG ĐÓ — chiến tuyến đang mở, cớ hai bên đang giữ, phe
 *      phái của Era chia đôi bàn cờ thế nào.
 *
 * Engine chỉ TỔNG HỢP, không ghi gì. Nguồn chân lý vẫn là "Chủ Quyền Lãnh Thổ"
 * (ai nắm vùng nào — 9.5.1), "Quan Hệ Ngoại Giao" (pháp lý — M20) và dữ liệu
 * lực lượng địa phương. Không con số nào ở đây được lưu vào state.
 */
import type { StatData } from "../mvu/schema";
import {
  CONTINENTS_BY_ID, REGIONS, REGIONS_BY_ID, regionForLocation, factionsForYear,
} from "../content/world/geography";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import {
  BANNERMEN_BY_ID, bannermenOfRegion, regionLevyPotential, type BannermanData,
} from "../content/westeros/bannermen";
import { absoluteDay } from "../mvu/calendar";
import { playerHouseId, toHouseId } from "../territory/territoryEngine";
import { diplomacySummary, type DiploSummary } from "./diplomacy";

/**
 * ĐINH TRÁNG GỌI ĐƯỢC: 1 trên 200 miệng ăn. Phong kiến không có nghĩa vụ quân
 * sự toàn dân — phất cờ giỏi lắm được chừng đó, và mỗi người đi là một luống
 * ruộng bỏ hoang. Neo theo canon: Phương Bắc 4 triệu dân → 20.000 quân.
 */
export const LEVY_RATE = 0.005;

const POLITY_NAMES: Record<string, string> = {
  braavos: "Thành bang Braavos", pentos: "Thành bang Pentos", myr: "Thành bang Myr",
  tyrosh: "Thành bang Tyrosh", lys: "Thành bang Lys", volantis: "Thành bang Volantis",
  lorath: "Thành bang Lorath", norvos: "Thành bang Norvos", qohor: "Thành bang Qohor",
  dothraki: "Các khalasar Dothraki", sarnor: "Sarnor", saath: "Saath",
  astapor: "Thành bang Astapor", yunkai: "Thành bang Yunkai", meereen: "Thành bang Meereen",
  "new-ghis": "Tân Ghis", qarth: "Qarth", lhazar: "Lhazar",
  "yi-ti": "Đế quốc Yi Ti", "jogos-nhai": "Các zhat Jogos Nhai", asshai: "Asshai",
  ibben: "Ibben", "summer-islands": "Quần Đảo Mùa Hè", naath: "Naath",
  "basilisk-isles": "Quần Đảo Basilisk", gogossos: "Gogossos",
};

/** Tên thế lực từ id — phủ Nhà Westeros, chính thể Essos và dữ liệu custom. */
export function powerName(houseId: string): string {
  if (!houseId) return "Vô Chủ";
  const canon = HOUSES_BY_ID[houseId]?.name ?? BANNERMEN_BY_ID[houseId]?.name;
  if (canon) return canon;
  if (POLITY_NAMES[houseId]) return POLITY_NAMES[houseId];
  const pretty = houseId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `Nhà ${pretty}`;
}

/** Tỷ lệ huy động ước lượng theo mô hình xã hội, không áp một levy phong kiến toàn cầu. */
export function mobilizationRateForRegion(regionId: string): number {
  const region = REGIONS_BY_ID[regionId];
  if (!region || region.continentId === "westeros") return LEVY_RATE;
  const polity = `${region.realmId} ${region.parentId} ${region.id}`;
  if (/dothraki|jogos-nhai/.test(polity)) return 0.018;
  if (/astapor|yunkai|meereen|new-ghis|ghiscar/.test(polity)) return 0.01;
  if (/braavos|pentos|myr|tyrosh|lys|volantis|lorath|norvos|qohor|qarth/.test(polity)) return 0.007;
  return 0.006;
}

/** Quân lực một vùng có thể huy động trong mô hình chính trị địa phương. */
export function regionLevy(regionId: string): number {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return 0;
  return Math.round(region.population * mobilizationRateForRegion(regionId));
}

// ── Vây thành ────────────────────────────────────────────────────────────────

export interface SiegeView {
  besiegerId: string;
  besiegerName: string;
  /** ta là bên VÂY (không phải bên thủ). */
  ours: boolean;
  daysIn: number;
  /** ngày nữa là hết lương → thành thất thủ. */
  daysToFall: number;
  /** ngày nữa là quân vây hết hạn → rã vây, thành giữ được. */
  daysToRaise: number;
  /** cái nào tới trước thì cái đó xảy ra. */
  outcome: "Thất Thủ" | "Rã Vây";
  /** 0..1 — đã đi được bao nhiêu phần đường tới kết cục đó. */
  progress: number;
}

function siegeView(sov: StatData["Chủ Quyền Lãnh Thổ"][string], pHouse: string): SiegeView | undefined {
  const vay = sov["_Vây"];
  if (!vay) return undefined;
  const daysIn = Math.max(0, vay["Ngày Đã Vây"]);
  const daysToFall = Math.max(0, vay["Lương Còn"]);
  const daysToRaise = Math.max(0, vay["Ngày Vây Tối Đa"] - daysIn);
  const fallsFirst = daysToFall <= daysToRaise;
  const left = fallsFirst ? daysToFall : daysToRaise;
  const besiegerId = toHouseId(vay["Phe Vây"]);
  return {
    besiegerId,
    besiegerName: powerName(besiegerId),
    ours: !!pHouse && besiegerId === pHouse,
    daysIn,
    daysToFall,
    daysToRaise,
    outcome: fallsFirst ? "Thất Thủ" : "Rã Vây",
    progress: daysIn + left > 0 ? daysIn / (daysIn + left) : 0,
  };
}

// ── Các vùng trên lục địa hiện tại ──────────────────────────────────────────

export interface RegionCard {
  id: string;
  name: string;
  continentId: string;
  continentName: string;
  realmId: string;
  seat: string;
  terrain: string;
  coastal: boolean;
  /** houseId đang nắm vùng ("" = vô chủ / đang tranh chấp). */
  holderId: string;
  holderName: string;
  /** tên vị lãnh chúa đang giữ (nếu state có ghi). */
  lord: string;
  status: string;
  isPlayer: boolean;
  population: number;
  /** lực lượng vùng có thể huy động (ước lượng theo dân số/chính thể). */
  levy: number;
  /** tổng quân các lực lượng địa phương ĐÃ BIẾT MẶT cam kết dốc ra. */
  knownLevy: number;
  bannermen: BannermanData[];
  /** quân của TA đang đóng tại vùng này. */
  ourTroops: number;
  siege?: SiegeView;
  /** vùng vừa đổi chủ cách đây bao nhiêu ngày (null = chưa từng / không rõ). */
  changedDaysAgo: number | null;
  /** quan hệ pháp lý của ta với chủ vùng (rỗng nếu vùng của ta hoặc vô chủ). */
  relation?: DiploSummary;
}

// ── Cán cân quyền lực ────────────────────────────────────────────────────────

export interface PowerCard {
  houseId: string;
  name: string;
  isPlayer: boolean;
  /** các vùng đang nắm. */
  regionIds: string[];
  regionNames: string[];
  population: number;
  /** tỉ trọng dân số trong phạm vi lục địa đang xem (0..1). */
  populationShare: number;
  levy: number;
  knownLevy: number;
  /** thái độ Nhà này với ta (tình cảm — "Thái Độ Các Nhà"). */
  attitude: string;
  /** quan hệ pháp lý với ta (M20). */
  relation?: DiploSummary;
  /** phe của Nhà này trong Era hiện tại (rỗng nếu Era không chia phe). */
  faction: string;
}

export interface FactionCard {
  name: string;
  houseIds: string[];
  /** houseId dùng để tra màu phe (regions.FACTION_COLORS_MAP). */
  colorHouseId: string;
  population: number;
  levy: number;
  regions: number;
  /** ta có đứng trong phe này không. */
  ours: boolean;
}

export interface KingdomsBoard {
  today: number;
  year: number;
  playerHouseId: string;
  playerHouseName: string;
  /** Lục địa theo vị trí hiện tại; rỗng nghĩa là đang xem toàn thế giới. */
  scopeContinentId: string;
  scopeContinentName: string;
  scopeLabel: string;
  /** số vùng lá trong phạm vi và toàn thế giới — không hard-code 9. */
  scopeRegionCount: number;
  worldRegionCount: number;
  /** tổng dân số trong phạm vi đang xem — mẫu số của mọi tỉ trọng. */
  totalPopulation: number;
  worldPopulation: number;
  /** quân TA thực có trong biên chế (khác hẳn tiềm lực). */
  playerArmy: number;
  regions: RegionCard[];
  /** thế lực đang nắm đất, mạnh trước yếu sau. */
  powers: PowerCard[];
  /** ta đứng thứ mấy trong hàng đó (null = ta không nắm đất). */
  playerRank: number | null;
  factions: FactionCard[];
  /** các Nhà đang ở trạng thái Chiến Tranh với ta. */
  wars: DiploSummary[];
  /** mọi vùng đang bị vây trong phạm vi hiện tại. */
  sieges: RegionCard[];
  /** vùng không yên: Nổi Loạn / Đang Tranh Chấp / Mới Chiếm. */
  unrest: RegionCard[];
}

const UNREST_STATUS = new Set(["Nổi Loạn", "Đang Tranh Chấp", "Mới Chiếm"]);

/**
 * Quân của ta đóng tại từng vùng. Quy ước biên chế (army.ts): đơn vị KHÔNG ghi
 * "Nhà" là quân nhà ta; ghi Nhà khác thì là quân người khác.
 */
function ourTroopsByRegion(state: StatData): { byRegion: Map<string, number>; total: number } {
  const house = state["Thông Tin Nhân Vật"]["Nhà"];
  const byRegion = new Map<string, number>();
  let total = 0;
  for (const unit of Object.values(state["Biên Chế Quân Sự"] ?? {})) {
    const count = Number(unit["Số Lượng"]) || 0;
    if (count <= 0) continue;
    if (house && unit["Nhà"] && unit["Nhà"] !== house) continue;
    total += count;
    const at = unit["Lãnh Địa Đồn Trú"];
    if (at) byRegion.set(at, (byRegion.get(at) ?? 0) + count);
  }
  return { byRegion, total };
}

/** Tổng hợp toàn bộ bàn cờ trong một lần đọc state. KHÔNG ghi gì vào state. */
export function kingdomsBoard(state: StatData): KingdomsBoard {
  const today = absoluteDay(state["Thế Giới"]);
  const year = state["Thế Giới"]["Năm"];
  const pHouse = playerHouseId(state);
  const sovereignty = state["Chủ Quyền Lãnh Thổ"] ?? {};
  const relations = new Map(diplomacySummary(state).map((r) => [r.houseId, r]));
  const { byRegion, total: playerArmy } = ourTroopsByRegion(state);

  // Bàn cờ mặc định theo lục địa nơi người chơi đang đứng. Nếu vị trí tự do
  // chưa ánh xạ được, hiển thị toàn thế giới và nói rõ phạm vi đó trong UI.
  const currentRegion = regionForLocation(state["Thế Giới"]["Vị Trí"]);
  const scopeContinentId = currentRegion?.continentId ?? "";
  const scopeContinentName = scopeContinentId
    ? CONTINENTS_BY_ID[scopeContinentId]?.name ?? scopeContinentId
    : "Toàn thế giới";
  const scopeRegions = scopeContinentId
    ? REGIONS.filter((region) => region.continentId === scopeContinentId)
    : REGIONS;

  // phe phái của Era (nếu năm này bàn cờ đang chia phe)
  const rawFactions = scopeContinentId && scopeContinentId !== "westeros"
    ? {}
    : factionsForYear(year) ?? {};
  const factionOf = new Map<string, string>();
  for (const [faction, houseIds] of Object.entries(rawFactions)) {
    for (const id of houseIds) factionOf.set(id, faction);
  }

  const regions: RegionCard[] = scopeRegions.map((region) => {
    const sov = sovereignty[region.id];
    const holderId = toHouseId(String(sov?.["Nhà Kiểm Soát"] ?? ""));
    const changedOn = Number(sov?.["_Ngày Đổi Chủ"]) || 0;
    const bannermen = bannermenOfRegion(region.id);
    const isPlayer = !!sov?.["Là Của Người Chơi"] || (!!pHouse && holderId === pHouse);
    return {
      id: region.id,
      name: region.name,
      continentId: region.continentId,
      continentName: CONTINENTS_BY_ID[region.continentId]?.name ?? region.continentId,
      realmId: region.realmId,
      seat: region.seat,
      terrain: region.terrain,
      coastal: region.coastal,
      holderId,
      holderName: powerName(holderId),
      lord: String(sov?.["Người Kiểm Soát"] ?? ""),
      status: String(sov?.["Tình Trạng"] ?? "Ổn Định"),
      isPlayer,
      population: region.population,
      levy: regionLevy(region.id),
      knownLevy: regionLevyPotential(region.id),
      bannermen,
      ourTroops: byRegion.get(region.id) ?? 0,
      siege: sov?.["Tình Trạng"] === "Bị Vây" ? siegeView(sov, pHouse) : undefined,
      changedDaysAgo: changedOn > 0 ? Math.max(0, today - changedOn) : null,
      relation: !isPlayer && holderId ? relations.get(holderId) : undefined,
    };
  });

  const totalPopulation = scopeRegions.reduce((s, r) => s + r.population, 0);
  const worldPopulation = REGIONS.reduce((s, r) => s + r.population, 0);

  // gom vùng theo thế lực nắm đất — vô chủ không phải một thế lực
  const grouped = new Map<string, RegionCard[]>();
  for (const r of regions) {
    if (!r.holderId) continue;
    const arr = grouped.get(r.holderId) ?? [];
    arr.push(r);
    grouped.set(r.holderId, arr);
  }

  const powers: PowerCard[] = [...grouped.entries()]
    .map(([houseId, held]) => {
      const schemaName = HOUSES_BY_ID[houseId]?.schemaName ?? houseId;
      const population = held.reduce((s, r) => s + r.population, 0);
      return {
        houseId,
        name: powerName(houseId),
        isPlayer: !!pHouse && houseId === pHouse,
        regionIds: held.map((r) => r.id),
        regionNames: held.map((r) => r.name),
        population,
        populationShare: totalPopulation > 0 ? population / totalPopulation : 0,
        levy: held.reduce((s, r) => s + r.levy, 0),
        knownLevy: held.reduce((s, r) => s + r.knownLevy, 0),
        attitude: state["Thái Độ Các Nhà"]?.[schemaName]?.["Thái Độ"] ?? "",
        relation: relations.get(houseId),
        faction: factionOf.get(houseId) ?? "",
      };
    })
    // mạnh trước yếu sau: quân huy động là thước đo, số vùng phá thế hoà
    .sort((a, b) => b.levy - a.levy || b.regionIds.length - a.regionIds.length);

  const playerIndex = powers.findIndex((p) => p.isPlayer);

  const factions: FactionCard[] = Object.entries(rawFactions).map(([name, houseIds]) => {
    const mine = powers.filter((p) => houseIds.includes(p.houseId));
    return {
      name,
      houseIds,
      colorHouseId: houseIds[0] ?? "",
      population: mine.reduce((s, p) => s + p.population, 0),
      levy: mine.reduce((s, p) => s + p.levy, 0),
      regions: mine.reduce((s, p) => s + p.regionIds.length, 0),
      ours: !!pHouse && houseIds.includes(pHouse),
    };
  });

  return {
    today,
    year,
    playerHouseId: pHouse,
    playerHouseName: pHouse ? powerName(pHouse) : "",
    scopeContinentId,
    scopeContinentName,
    scopeLabel: scopeContinentId ? `Lục địa ${scopeContinentName}` : "Toàn thế giới đã biết",
    scopeRegionCount: scopeRegions.length,
    worldRegionCount: REGIONS.length,
    totalPopulation,
    worldPopulation,
    playerArmy,
    regions,
    powers,
    playerRank: playerIndex >= 0 ? playerIndex + 1 : null,
    factions,
    wars: [...relations.values()].filter((r) => r.status === "Chiến Tranh"),
    sieges: regions.filter((r) => !!r.siege),
    unrest: regions.filter((r) => !r.siege && UNREST_STATUS.has(r.status)),
  };
}
