/**
 * muster (M19) — HIỆU TRIỆU CHƯ HẦU.
 *
 * Đây là thứ phân biệt một lãnh chúa Westeros với một ông tướng hiện đại: quân
 * của ông ta phần lớn KHÔNG PHẢI của ông ta. Ông ta gửi quạ, phất cờ, rồi chờ.
 * Nhà trung thành dốc sạch đinh tráng; nhà bất mãn gửi lấy lệ vài trăm dân binh
 * rách rưới; nhà đang tính chuyện khác thì viện cớ mùa gặt mà ở nhà — và lời từ
 * chối đó là một sự kiện chính trị, không phải một dòng lỗi.
 *
 * Quân tới nơi rồi thì vẫn phải trả về: giữ chư hầu ngoài đồng quá lâu là cách
 * nhanh nhất biến đồng minh thành kẻ thù.
 */
import type { StatData, Vassal, ArmyBranch } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener } from "../mvu/effects";
import { BANNERMEN, bannermenOfRegion, BANNERMEN_BY_ID } from "../content/westeros/bannermen";
import { REGIONS, REGIONS_BY_ID, regionsForRealm } from "../content/world/geography";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { hasPrivilege, titleDefinition } from "../character/roleplay";
import {
  activeBannermen, homeRegionForHouse, playerHouseId, provinceForBannerman, realmControlStatus,
  repairPlayerSovereignty, toHouseId,
} from "../territory/territoryEngine";
import { eventSeed, makeRng } from "../probability/rng";
import { newUnit } from "./army";
import type { TroopTypeAll } from "../content/westeros/troopTypes";
import { feudalModifiers } from "./feudalManagement";
import { regionPopulation } from "../territory/geographyRuntime";

export const VASSAL_BRANCH: ArmyBranch = "Chư Hầu";

const WESTEROS_FEUDAL_REALMS = [...new Set(BANNERMEN.map((bannerman) => bannerman.region))];

function vassalRealmId(vassalId: string, vassal: Vassal): string {
  const canon = BANNERMEN_BY_ID[vassalId];
  if (canon) return canon.region;
  const direct = REGIONS_BY_ID[vassal["Vùng"]];
  return direct?.realmId ?? vassal["Vùng"];
}

/** Các vương quốc mà tước vị cho quyền gửi lời hiệu triệu về mặt pháp lý. */
export function legalMusterRealmIds(state: StatData): string[] {
  const title = titleDefinition(state["Thông Tin Nhân Vật"]["Tước Vị"]);
  const house = playerHouseId(state);
  if (!house || !title.canReceiveVassals) return [];
  if (title.id === "high-king" || title.id === "emperor") return [...WESTEROS_FEUDAL_REALMS];

  // Quốc vương/Thân vương/đại lãnh chúa gọi được toàn vương quốc quê nhà về
  // mặt pháp lý, kể cả những tỉnh trên bản đồ chưa do Nhà mình trực tiếp giữ.
  if (title.rank >= 7) {
    const home = homeRegionForHouse(house);
    if (home?.realmId) return [home.realmId];
  }
  return [];
}

function realmIsEstablished(state: StatData, realmId: string, houseId: string): boolean {
  const capital = REGIONS_BY_ID[realmId] ?? regionsForRealm(realmId)[0];
  if (!capital || !houseId) return false;
  const playerName = (state["Thông Tin Nhân Vật"]["Họ Tên"] ?? "").trim();
  const sovereignty = state["Chủ Quyền Lãnh Thổ"]?.[capital.id];
  // Chỉ snapshot canon yên ổn mới hiểu việc nắm thủ phủ là cả hệ thống chư hầu
  // đã tuyên thệ. Một thủ phủ vừa chiếm không làm cả vương quốc tự động quỳ gối.
  if (!sovereignty
    || (sovereignty["_Ngày Đổi Chủ"] ?? 0) !== 0
    || (sovereignty["Tình Trạng"] ?? "Ổn Định") !== "Ổn Định") return false;
  if (!playerName) return !!sovereignty["Là Của Người Chơi"];
  if ((sovereignty?.["Người Kiểm Soát"] ?? "").trim() === playerName) return true;
  return Object.values(state["Lãnh Địa"] ?? {}).some((holding) => (
    holding["Thuộc Vùng"] === capital.id
    && (holding["Người Kiểm Soát"] ?? "").trim() === playerName
  ));
}

function baseVassal(
  state: StatData,
  name: string,
  seat: string,
  realmId: string,
  levy: number,
  troop: Vassal["Binh Chủng Chính"],
  loyalty: number,
  note: string,
  submitted: boolean,
): Vassal {
  return {
    "Tên Nhà": name,
    "Thành Trì": seat,
    "Vùng": realmId,
    "Chủ Của": submitted ? playerHouseId(state) : "",
    "Trung Thành": submitted ? loyalty : Math.max(12, Math.round(loyalty * 0.55)),
    "Quân Cam Kết": levy,
    "Binh Chủng Chính": troop,
    "Trạng Thái": "Ở Nhà",
    "Ngày Tới Nơi": 0,
    "Quân Đã Gửi": 0,
    "Ngày Tòng Quân": 0,
    "Ghi Chú": submitted ? note : `${note} Có nghĩa vụ pháp lý, nhưng chưa chịu khuất phục trên thực địa.`,
  };
}

/**
 * Danh sách chư hầu pháp lý được dẫn xuất, không cần thêm bảng save mới. Ngoài
 * catalog M19, mỗi thủ phủ tỉnh có Nhà địa phương cũng trở thành một chủ thành.
 */
function legalVassalCandidates(state: StatData): [string, Vassal][] {
  const house = playerHouseId(state);
  const legalRealms = new Set(legalMusterRealmIds(state));
  const candidates = new Map<string, Vassal>();
  for (const bannerman of activeBannermen(state)) {
    if (!legalRealms.has(bannerman.region)) continue;
    const submitted = realmIsEstablished(state, bannerman.region, house);
    candidates.set(bannerman.id, baseVassal(
      state,
      bannerman.name,
      bannerman.seat,
      bannerman.region,
      bannerman.levy,
      bannerman.troop,
      bannerman.loyalty,
      bannerman.note,
      submitted,
    ));
  }

  // Catalog cũ không phủ Dustin, Tallhart, Caswell... nhưng thành của họ vẫn là
  // một phần điều kiện kiểm soát và họ vẫn nhận được quạ của Quốc Vương.
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const catalogIsAnachronistic = (state["Thế Giới"]["Năm"] ?? 298) <= 2
    || eraId === "long-night"
    || eraId === "aegon-conquest";
  for (const region of catalogIsAnachronistic ? [] : REGIONS) {
    if (region.continentId !== "westeros" || !legalRealms.has(region.realmId)) continue;
    const localHouse = toHouseId(region.defaultHouse);
    if (!localHouse || localHouse === house || candidates.has(localHouse) || BANNERMEN_BY_ID[localHouse]) continue;
    const submitted = realmIsEstablished(state, region.realmId, house);
    candidates.set(localHouse, baseVassal(
      state,
      HOUSES_BY_ID[localHouse]?.name ?? `Nhà ${localHouse}`,
      region.seat,
      region.realmId,
      // Lưu mức cam kết theo dân số nền; lúc phất cờ sẽ nhân với dân số runtime.
      Math.max(200, Math.round(region.population * 0.0035)),
      "Bộ Binh",
      55,
      `Giữ ${region.seat}, thủ phủ của ${region.name}.`,
      submitted,
    ));
  }
  return [...candidates.entries()];
}

// ── Gieo hạt ────────────────────────────────────────────────────────────────

/**
 * Gieo bảng chư hầu cho các vùng người chơi nắm (gọi lúc khởi ván và mỗi lần
 * chiếm được vùng mới). Chư hầu của vùng vừa chiếm khởi điểm TRUNG THÀNH THẤP —
 * họ vừa mất chủ cũ, chưa có lý do gì để chết vì chủ mới.
 */
export function seedVassals(state: StatData, opts: { conquered?: string } = {}): void {
  repairPlayerSovereignty(state);
  const house = playerHouseId(state) ?? "";
  const conqueredRegion = opts.conquered ? REGIONS_BY_ID[opts.conquered] : undefined;
  const conqueredProvinceId = conqueredRegion?.id ?? "";

  // Giữ đường tương thích cũ: một lãnh chúa đang nắm thủ phủ đại vùng vẫn có
  // bảng chư hầu dù title alias/save cũ chưa định nghĩa được phạm vi pháp lý.
  const candidates = new Map(legalVassalCandidates(state));
  const currentBannermen = activeBannermen(state);
  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    if (!sov["Là Của Người Chơi"]) continue;
    for (const bannerman of currentBannermen.filter((candidate) => (
      provinceForBannerman(candidate)?.id === regionId
    ))) {
      candidates.set(bannerman.id, baseVassal(
        state, bannerman.name, bannerman.seat, bannerman.region,
        bannerman.levy, bannerman.troop, bannerman.loyalty, bannerman.note, true,
      ));
    }
  }

  for (const [id, candidate] of candidates) {
    const existing = state["Chư Hầu"][id];
    const isConqueredProvinceVassal = !!conqueredProvinceId
      && vassalProvinceId(id, existing ?? candidate) === conqueredProvinceId;
    if (existing) {
      // Nạp save không được tự ý biến một chư hầu phản loạn trở lại thành bề tôi.
      // Chỉ lệnh khuất phục/chinh phục tường minh mới thay đổi Chủ Của.
      if (isConqueredProvinceVassal) {
        existing["Chủ Của"] = house;
        existing["Trung Thành"] = Math.min(existing["Trung Thành"], Math.round(candidate["Trung Thành"] * 0.45));
      }
      continue;
    }
    if (isConqueredProvinceVassal) {
      candidate["Chủ Của"] = house;
      candidate["Trung Thành"] = Math.round(candidate["Trung Thành"] * 0.45);
    }
    state["Chư Hầu"][id] = candidate;
  }
  repairPlayerSovereignty(state);
}

/** Chư hầu thuộc quyền hiệu triệu của người chơi. */
export function callableVassals(state: StatData): [string, Vassal][] {
  const house = playerHouseId(state);
  const legalRealms = new Set(legalMusterRealmIds(state));
  const candidates = new Map(legalVassalCandidates(state));
  const currentBannermanIds = new Set(activeBannermen(state).map((bannerman) => bannerman.id));
  for (const [id, vassal] of Object.entries(state["Chư Hầu"] ?? {})) {
    if (BANNERMEN_BY_ID[id] && !currentBannermanIds.has(id)) continue;
    const realmId = vassalRealmId(id, vassal);
    if (toHouseId(vassal["Chủ Của"]) === house || legalRealms.has(realmId)) {
      candidates.set(id, vassal);
    }
  }
  return [...candidates.entries()];
}

/** Người chơi có quyền phất cờ hiệu triệu không (theo tước vị). */
export function canCallBanners(state: StatData): boolean {
  return (
    hasPrivilege(state, "Triệu Tập Chư Hầu (Toàn Lục Địa)") ||
    hasPrivilege(state, "Triệu Tập Chư Hầu (Vùng)")
  );
}

// ── Phản ứng của chư hầu ────────────────────────────────────────────────────

export interface BannerResponse {
  vassalId: string;
  name: string;
  /** số quân thực sự gửi (0 = từ chối). */
  troops: number;
  /** ngày hành quân tới điểm hẹn. */
  days: number;
  refused: boolean;
  /** lời hồi đáp cho AI kể lại. */
  reply: string;
}

/**
 * Uy tín của lãnh chúa đẩy chư hầu về phía "vâng lệnh" — Uy Dũng và Vinh Dự
 * đáng giá đúng bằng vài trăm tay giáo.
 */
function prestigeBonus(state: StatData): number {
  const fame = state["Danh Vọng"];
  const charisma = state["Chỉ Số Cốt Lõi"]["Uy Tín"] ?? 10;
  return (fame["Uy Dũng"] + fame["Vinh Dự"]) / 20 + (charisma - 10) * 1.5;
}

function vassalProvinceId(vassalId: string, vassal: Vassal): string {
  const canon = BANNERMEN_BY_ID[vassalId];
  if (canon) return provinceForBannerman(canon)?.id ?? canon.region;
  const direct = REGIONS_BY_ID[vassal["Vùng"]];
  if (direct && direct.defaultHouse === vassalId) return direct.id;
  return regionsForRealm(vassal["Vùng"]).find((region) => region.defaultHouse === vassalId)?.id
    ?? direct?.id
    ?? vassal["Vùng"];
}

/** Quân cam kết co giãn cùng dân số tỉnh, tránh bảng quân sự dùng số canon cũ. */
export function runtimeVassalCommitment(state: StatData, vassalId: string, vassal: Vassal): number {
  const provinceId = vassalProvinceId(vassalId, vassal);
  const province = REGIONS_BY_ID[provinceId];
  if (!province || province.population <= 0) return Math.max(0, vassal["Quân Cam Kết"] || 0);
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const currentPopulation = regionPopulation(state, provinceId, eraId);
  return Math.max(0, Math.round((vassal["Quân Cam Kết"] || 0) * currentPopulation / province.population));
}

/**
 * Lòng trung hiệu dụng khi nhận quạ. Ngoài lòng trung cá nhân, vương quyền,
 * gắn kết toàn cõi, mức kiểm soát thực địa và chiến tranh đều có trọng lượng.
 */
export function effectiveBannerLoyalty(state: StatData, vassalId: string, vassal: Vassal): number {
  const house = playerHouseId(state);
  const feudal = state["Quản Trị Tước Địa"];
  const realmId = vassalRealmId(vassalId, vassal);
  const control = realmControlStatus(state, realmId, house);
  const provinceId = vassalProvinceId(vassalId, vassal);
  const regionalGovernance = state["Chủ Quyền Lãnh Thổ"]?.[provinceId]?.["Quản Trị"]
    ?? state["Chủ Quyền Lãnh Thổ"]?.[realmId]?.["Quản Trị"];
  const readinessBonus = regionalGovernance
    ? (regionalGovernance["Phủ Sóng Phòng Thủ"] - 35) * 0.08
      + (regionalGovernance["Trật Tự"] - 60) * 0.03
      - Math.max(0, regionalGovernance["Bất Ổn"] - 35) * 0.08
    : 0;
  const submitted = !!house && toHouseId(vassal["Chủ Của"]) === house;
  const authorityBonus = (feudal["Uy Quyền"] - 50) * 0.3;
  const cohesionBonus = (feudal["Gắn Kết Chư Hầu"] - 50) * 0.12;
  const controlBonus = control.complete ? 8 : (control.controlRatio - 0.5) * 12;
  const legalButUnsubdued = submitted ? 6 : -28;
  const relations = state["Quan Hệ Ngoại Giao"] ?? {};
  const warWithThisVassal = relations[vassalId]?.["Trạng Thái"] === "Chiến Tranh";
  const realmAtWar = Object.values(relations).some((relation) => relation["Trạng Thái"] === "Chiến Tranh");
  const warModifier = warWithThisVassal ? -60 : realmAtWar ? 7 : 0;
  return vassal["Trung Thành"]
    + prestigeBonus(state)
    + feudalModifiers(state).musterLoyaltyBonus
    + readinessBonus
    + authorityBonus
    + cohesionBonus
    + controlBonus
    + legalButUnsubdued
    + warModifier;
}

/** Một chư hầu đáp lời thế nào — thuần, seed cố định để test tái lập được. */
export function bannerResponse(
  vassal: Vassal,
  effectiveLoyalty: number,
  rng: () => number,
): { troops: number; days: number; refused: boolean; reply: string } {
  const marchDays = Math.max(1, vassal["Ngày Tới Nơi"] || 0);
  const loyal = Math.max(0, Math.min(100, effectiveLoyalty));
  const roll = rng();

  if (vassal["Quân Cam Kết"] <= 0) {
    return {
      troops: 0, days: 0, refused: true,
      reply: `${vassal["Tên Nhà"]} báo rằng ${vassal["Thành Trì"]} không còn đủ đinh tráng để xuất quân.`,
    };
  }

  if (loyal < 25 || (loyal < 40 && roll < 0.45)) {
    return {
      troops: 0, days: 0, refused: true,
      reply: `${vassal["Tên Nhà"]} viện cớ mùa gặt và bệnh tật, không một tay giáo nào rời ${vassal["Thành Trì"]}.`,
    };
  }
  // tỷ lệ quân gửi: trung thành 100 → gần trọn; 40 → non nửa
  const share = 0.25 + (loyal / 100) * 0.75 * (0.85 + roll * 0.3);
  const troops = Math.max(1, Math.round(vassal["Quân Cam Kết"] * Math.min(1, share)));
  // nhà miễn cưỡng thì lề mề trên đường
  const drag = loyal >= 70 ? 1 : loyal >= 50 ? 1.25 : 1.6;
  const days = Math.max(1, Math.round(marchDays * drag));
  const reply =
    loyal >= 80
      ? `${vassal["Tên Nhà"]} dốc ${troops.toLocaleString("vi-VN")} quân, cờ hiệu rời ${vassal["Thành Trì"]} ngay trong đêm.`
      : loyal >= 50
        ? `${vassal["Tên Nhà"]} hứa gửi ${troops.toLocaleString("vi-VN")} quân, nhưng sẽ mất ít lâu để tập hợp.`
        : `${vassal["Tên Nhà"]} miễn cưỡng vét được ${troops.toLocaleString("vi-VN")} người, phần lớn là dân binh.`;
  return { troops, days, refused: false, reply };
}

export interface CallBannersResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  responses: BannerResponse[];
}

/**
 * Phất cờ hiệu triệu. `scope` là regionId (gọi cả vùng) hoặc vassalId (gọi
 * riêng một nhà); bỏ trống = gọi toàn bộ chư hầu đang thần phục.
 */
export function callBanners(state: StatData, scope?: string): CallBannersResult {
  if (!canCallBanners(state)) {
    return { ok: false, error: "Tước vị của ngươi không có quyền hiệu triệu chư hầu", ops: [], responses: [] };
  }
  const tick = state["_engineMeta"]["_Nhịp"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];

  const targets = callableVassals(state).filter(([id, v]) => {
    if (!scope) return true;
    return id === scope
      || v["Vùng"] === scope
      || vassalRealmId(id, v) === scope
      || vassalProvinceId(id, v) === scope;
  });
  if (targets.length === 0) {
    return { ok: false, error: "Không có chư hầu nào để hiệu triệu", ops: [], responses: [] };
  }

  const ops: PatchOp[] = [];
  const responses: BannerResponse[] = [];
  for (const [id, v] of targets) {
    if (v["Trạng Thái"] !== "Ở Nhà" && v["Trạng Thái"] !== "Từ Chối") continue; // đã lên đường rồi
    const marchDays = BANNERMEN_BY_ID[id]?.marchDays ?? 10;
    const rng = makeRng(eventSeed(rootSeed, tick, `banner-${id}`));
    const provinceId = vassalProvinceId(id, v);
    const regionalGovernance = state["Chủ Quyền Lãnh Thổ"]?.[provinceId]?.["Quản Trị"]
      ?? state["Chủ Quyền Lãnh Thổ"]?.[v["Vùng"]]?.["Quản Trị"];
    const effective = effectiveBannerLoyalty(state, id, v);
    const res = bannerResponse({
      ...v,
      "Quân Cam Kết": runtimeVassalCommitment(state, id, v),
      "Ngày Tới Nơi": marchDays,
    }, effective, rng);
    const dispatchMult = regionalGovernance
      ? Math.max(0.65, Math.min(1.35, 1 - (regionalGovernance["Hạ Tầng"] - 30) * 0.004 - (regionalGovernance["Phủ Sóng Phòng Thủ"] - 35) * 0.002))
      : 1;
    const homeRealm = homeRegionForHouse(playerHouseId(state))?.realmId ?? "";
    const crossRealmMult = homeRealm && vassalRealmId(id, v) !== homeRealm ? 1.45 : 1;
    const arrivalDays = res.refused ? 0 : Math.max(1, Math.round(res.days * dispatchMult * crossRealmMult));
    responses.push({ vassalId: id, name: v["Tên Nhà"], troops: res.troops, days: arrivalDays, refused: res.refused, reply: res.reply });

    const persisted = !!state["Chư Hầu"]?.[id];
    if (res.refused) {
      if (!persisted) {
        ops.push({
          op: "replace",
          path: `stat_data.Chư Hầu.${id}`,
          value: { ...v, "Trạng Thái": "Từ Chối", "Trung Thành": Math.max(0, v["Trung Thành"] - 4) },
        });
      } else {
        ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Trạng Thái`, value: "Từ Chối" });
        ops.push({ op: "delta", path: `stat_data.Chư Hầu.${id}.Trung Thành`, value: -4 });
      }
      continue;
    }
    if (!persisted) {
      ops.push({
        op: "replace",
        path: `stat_data.Chư Hầu.${id}`,
        value: {
          ...v,
          "Chủ Của": playerHouseId(state),
          "Trạng Thái": "Đang Hành Quân",
          "Quân Đã Gửi": res.troops,
          "Ngày Tới Nơi": arrivalDays,
          "Ngày Tòng Quân": 0,
        },
      });
    } else {
      // Một lời hiệu triệu pháp lý được chấp nhận là hành vi tuyên thệ công
      // khai: Nhà này thừa nhận quyền bá chủ và graph thực địa tiến lên.
      if (toHouseId(v["Chủ Của"]) !== playerHouseId(state)) {
        ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Chủ Của`, value: playerHouseId(state) });
      }
      ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Trạng Thái`, value: "Đang Hành Quân" });
      ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Quân Đã Gửi`, value: res.troops });
      ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Ngày Tới Nơi`, value: arrivalDays });
      ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Ngày Tòng Quân`, value: 0 });
    }
  }
  if (responses.length === 0) {
    return { ok: false, error: "Chư hầu đã lên đường cả rồi", ops: [], responses: [] };
  }
  return { ok: true, ops, responses };
}

/** Cho chư hầu về nhà — trả quân đúng hẹn thì được lòng, giữ lâu thì mất lòng. */
export function dismissVassal(state: StatData, vassalId: string): { ok: boolean; error?: string; ops: PatchOp[] } {
  const v = state["Chư Hầu"]?.[vassalId];
  if (!v) return { ok: false, error: "Không có chư hầu này", ops: [] };
  const ops: PatchOp[] = [
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Trạng Thái`, value: "Ở Nhà" },
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Quân Đã Gửi`, value: 0 },
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Ngày Tòng Quân`, value: 0 },
    { op: "delta", path: `stat_data.Chư Hầu.${vassalId}.Trung Thành`, value: v["Ngày Tòng Quân"] > 120 ? 1 : 4 },
  ];
  for (const [name, u] of Object.entries(state["Biên Chế Quân Sự"])) {
    if (u["Thuộc Chư Hầu"] === vassalId) ops.push({ op: "remove", path: `stat_data.Biên Chế Quân Sự.${name}` });
  }
  return { ok: true, ops };
}

// ── Tick: quân chư hầu tới nơi ──────────────────────────────────────────────

/** Điểm hẹn: trọng trấn của vùng chư hầu, hoặc lãnh địa đầu tiên của người chơi. */
function musterPoint(state: StatData, v: Vassal): string {
  if (state["Lãnh Địa"][v["Vùng"]]) return v["Vùng"];
  const own = Object.keys(state["Lãnh Địa"])[0];
  return own ?? v["Vùng"];
}

export function tickMuster(state: StatData): void {
  const house = playerHouseId(state) ?? "";
  for (const [id, v] of Object.entries(state["Chư Hầu"] ?? {})) {
    if (v["Trạng Thái"] === "Đang Hành Quân") {
      v["Ngày Tới Nơi"] = Math.max(0, (v["Ngày Tới Nơi"] || 0) - 1);
      if (v["Ngày Tới Nơi"] > 0) continue;

      // tới nơi → thành một đơn vị thật trong biên chế
      v["Trạng Thái"] = "Đã Tới";
      const troops = v["Quân Đã Gửi"] || 0;
      if (troops <= 0) continue;
      const unitName = `Quân ${v["Tên Nhà"]}`;
      const station = musterPoint(state, v);
      state["Biên Chế Quân Sự"][unitName] = newUnit(
        v["Binh Chủng Chính"] as TroopTypeAll,
        troops,
        VASSAL_BRANCH,
        {
          "Tướng Chỉ Huy": `Lãnh chúa ${v["Tên Nhà"]}`,
          "Nhà": house,
          "Lãnh Địa Đồn Trú": station,
          "Thuộc Chư Hầu": id,
          "Ghi Chú": v["Ghi Chú"],
          "Sĩ Khí": v["Trung Thành"] >= 70 ? "Hăng Hái" : v["Trung Thành"] >= 45 ? "Ổn Định" : "Dao Động",
        },
      );
      state["Thế Giới"]["_Tin Nóng Off-screen"] =
        `Cờ hiệu nhà ${v["Tên Nhà"]} đã tới ${REGIONS_BY_ID[station]?.name ?? station}: ${troops.toLocaleString("vi-VN")} quân.`;
    } else if (v["Trạng Thái"] === "Đã Tới") {
      v["Ngày Tòng Quân"] = (v["Ngày Tòng Quân"] || 0) + 1;
    }
  }
}

let registered = false;
export function registerMusterLoop(): void {
  if (registered) return;
  registerDailyListener("muster", tickMuster);
  registered = true;
}

/** Tổng quân chư hầu đang có mặt dưới cờ (M19) — bảng quân sự in ra. */
export function musteredStrength(state: StatData): { present: number; pledged: number; marching: number } {
  let present = 0;
  let marching = 0;
  let pledged = 0;
  for (const [id, v] of Object.entries(state["Chư Hầu"] ?? {})) {
    pledged += runtimeVassalCommitment(state, id, v);
    if (v["Trạng Thái"] === "Đã Tới") present += v["Quân Đã Gửi"] || 0;
    if (v["Trạng Thái"] === "Đang Hành Quân") marching += v["Quân Đã Gửi"] || 0;
  }
  return { present, pledged, marching };
}

/** Danh sách chư hầu theo vùng cho giao diện (kể cả nhà chưa gieo vào state). */
export function knownBannermen(regionId: string) {
  return regionId ? bannermenOfRegion(regionId) : BANNERMEN;
}
