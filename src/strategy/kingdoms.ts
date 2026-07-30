/**
 * kingdoms (M21) — BÀN CỜ QUYỀN LỰC WESTEROS.
 *
 * Bảng "7 Vương Quốc" cũ chỉ đếm lại những con số mà Bản Đồ, Quân Sự và Ngoại
 * Giao đều đã hiện — nên nó vô dụng. Cái người chơi thật sự cần khi mở nó là câu
 * trả lời cho ba câu hỏi VĨ MÔ mà không bảng nào khác trả lời được:
 *
 *   1. AI MẠNH HƠN AI — cán cân giữa các thế lực đang nắm đất (đất, người, đinh
 *      tráng gọi được), và ta đứng thứ mấy trong cái hàng đó.
 *   2. CHUYỆN GÌ ĐANG XẢY RA Ở CHÍN VÙNG — ai giữ, giữ có chắc không, thành nào
 *      đang bị vây và còn mấy ngày nữa thì đổ, vùng nào vừa đổi chủ.
 *   3. TA ĐỨNG Ở ĐÂU TRONG ĐÓ — chiến tuyến đang mở, cớ hai bên đang giữ, phe
 *      phái của Era chia đôi bàn cờ thế nào.
 *
 * Engine chỉ TỔNG HỢP, không ghi gì. Nguồn chân lý vẫn là "Chủ Quyền Lãnh Thổ"
 * (ai nắm vùng nào — 9.5.1), "Quan Hệ Ngoại Giao" (pháp lý — M20) và bảng chư
 * hầu tĩnh (M19). Không con số nào ở đây được lưu vào state.
 */
import type { StatData } from "../mvu/schema";
import { REGIONS, REGIONS_BY_ID, factionsForYear } from "../content/westeros/regions";
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

/** Tên thế lực từ houseId — phủ cả Nhà cổ (gardener/durrandon/hoare) và chư hầu. */
export function powerName(houseId: string): string {
  if (!houseId) return "Vô Chủ";
  const canon = HOUSES_BY_ID[houseId]?.name ?? BANNERMEN_BY_ID[houseId]?.name;
  if (canon) return canon;
  const pretty = houseId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `Nhà ${pretty}`;
}

/** Đinh tráng một vùng gọi được nếu chủ vùng phất cờ và ai cũng nghe. */
export function regionLevy(regionId: string): number {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return 0;
  return Math.round(region.population * LEVY_RATE);
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

// ── Chín vùng ────────────────────────────────────────────────────────────────

export interface RegionCard {
  id: string;
  name: string;
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
  /** đinh tráng vùng gọi được (ước lượng theo dân số). */
  levy: number;
  /** tổng quân các chư hầu ĐÃ BIẾT MẶT của vùng cam kết dốc ra. */
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
  /** tỉ trọng dân số trên tổng Westeros (0..1) — thước đo thật của quyền lực. */
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
  /** tổng dân số chín vùng — mẫu số của mọi tỉ trọng. */
  totalPopulation: number;
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
  /** mọi vùng đang bị vây trên toàn Westeros. */
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

  // phe phái của Era (nếu năm này bàn cờ đang chia phe)
  const rawFactions = factionsForYear(year) ?? {};
  const factionOf = new Map<string, string>();
  for (const [faction, houseIds] of Object.entries(rawFactions)) {
    for (const id of houseIds) factionOf.set(id, faction);
  }

  const regions: RegionCard[] = REGIONS.map((region) => {
    const sov = sovereignty[region.id];
    const holderId = toHouseId(String(sov?.["Nhà Kiểm Soát"] ?? ""));
    const changedOn = Number(sov?.["_Ngày Đổi Chủ"]) || 0;
    const bannermen = bannermenOfRegion(region.id);
    const isPlayer = !!sov?.["Là Của Người Chơi"] || (!!pHouse && holderId === pHouse);
    return {
      id: region.id,
      name: region.name,
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

  const totalPopulation = REGIONS.reduce((s, r) => s + r.population, 0);

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
    // mạnh trước yếu sau: đinh tráng là thước đo, số vùng phá thế hoà
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
    totalPopulation,
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
