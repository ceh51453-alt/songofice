/**
 * war (12.1-12.2) — lớp chiến lược: tuyên chiến / War Score + vây thành.
 * - declareWar/makePeace + adjustWarScore: đổi "Quan Hệ Ngoại Giao" (pháp lý
 *   chiến sự — KHÁC "Thái Độ Các Nhà" tình cảm).
 * - startSiege + tickSiege: vùng bị vây drain lương theo ngày; có viện binh →
 *   phá vây; hết lương/quá hạn → thất thủ, đổi chủ (9.5.1 → bản đồ đổi màu).
 * Engine giữ số; captureRegion đồng bộ Lãnh Địa (10.1). AI narrate qua <siege_update>.
 */
import type { StatData } from "../mvu/schema";
import { DiplomacyRelationSchema } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { absoluteDay } from "../mvu/calendar";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { markersForEra } from "../content/westeros/mapMarkers";
import {
  playerHouseId,
  playerOwnsProvince,
  makeHolding,
  provinceControlStatus,
  setStrongholdControlMutate,
  strongholdController,
  strongholdForState,
} from "../territory/territoryEngine";
import { canonicalSettlementPopulation } from "../territory/geographyRuntime";
import { strongholdsForProvince, type StrongholdSite } from "../content/westeros/strongholds";
import { moveArmy } from "./army";

/**
 * Trạng thái pháp lý — M20 chuyển nguồn chân lý sang schema.DIPLO_STATES (thêm
 * Liên Minh / Thần Phục). Alias giữ đây cho code cũ.
 */
export type { DiploState } from "../mvu/schema";

/**
 * Tuyên chiến / đổi trạng thái ngoại giao (12.1). Chỉ ghi TRẠNG THÁI THÔ — hệ
 * quả đầy đủ (bội ước, mất uy tín, ân oán) nằm ở strategy/diplomacy.setDiploStatus,
 * để tuyên chiến qua đường ngoại giao và qua kết quả trận đánh không lệch nhau.
 */
export function setWarStatus(houseId: string, status: string): PatchOp[] {
  return [{ op: "replace", path: `stat_data.Quan Hệ Ngoại Giao.${houseId}.Trạng Thái`, value: status }];
}
export function declareWar(houseId: string): PatchOp[] {
  return setWarStatus(houseId, "Chiến Tranh");
}
export function makePeace(houseId: string): PatchOp[] {
  return setWarStatus(houseId, "Hoà Bình");
}

/** Cộng/trừ War Score với 1 Nhà (12.1) — dương = ta thắng thế. */
export function adjustWarScore(houseId: string, delta: number): PatchOp[] {
  if (!houseId || delta === 0) return [];
  return [{ op: "delta", path: `stat_data.Quan Hệ Ngoại Giao.${houseId}.War Score`, value: delta }];
}

/** War Score cộng theo bậc kết quả trận (12.1) — nối resolveBattle 7.9. */
export function warScoreForOutcome(outcome: string): number {
  const table: Record<string, number> = {
    "Đại Thắng": 20, "Thắng": 12, "Tiểu Thắng": 6, "Giằng Co": 0,
    "Tiểu Bại": -6, "Bại": -12, "Đại Bại": -20,
  };
  return table[outcome] ?? 0;
}

// ── Vây thành (12.2) ─────────────────────────────────────────────────────────
const SIEGE_MAX_DAYS = 600;  // 20 tháng — quá hạn thì quân vây rã
const SIEGE_FOOD_DAYS = 360; // 12 tháng lương thủ chịu được nếu không viện binh
export const SIEGE_SETUP_DAYS = 3; // trinh sát, dựng trại, đào hào và khép vòng vây

export interface SiegeResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

export interface SiegeOrderResult extends SiegeResult {
  marchDays?: number;
  setupDays?: number;
  daysToStart?: number;
}

interface ResolvedSiegeTarget {
  provinceId: string;
  site?: StrongholdSite;
  defender: string;
}

function resolveSiegeTarget(
  state: StatData,
  targetTerritoryId: string,
): { ok: true; target: ResolvedSiegeTarget } | { ok: false; error: string } {
  const targetSite = strongholdForState(state, targetTerritoryId);
  const provinceId = targetSite?.provinceId ?? targetTerritoryId;
  const sov = state["Chủ Quyền Lãnh Thổ"][provinceId];
  if (!sov || !REGIONS_BY_ID[provinceId]) return { ok: false, error: "Vùng không tồn tại" };
  const pHouse = playerHouseId(state);
  if (!pHouse) return { ok: false, error: "Nhân vật chưa có Nhà để đứng danh nghĩa vây thành" };
  const site = targetSite
    ?? strongholdsForProvince(provinceId, state["Cài Đặt Ván"]["Thời Kỳ"] ?? "")
      .find((candidate) => candidate.source === "seat");
  const defender = site ? strongholdController(state, site.id) : sov["Nhà Kiểm Soát"];
  if (defender === pHouse) return { ok: false, error: "Thành này đã nằm dưới quyền của ngươi" };
  if (sov["_Vây"]) return { ok: false, error: "Trong vùng đã có một cuộc vây thành đang diễn ra" };
  return { ok: true, target: { provinceId, site, defender } };
}

function unitProvince(state: StatData, unitName: string): string {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return "";
  const station = unit["Lãnh Địa Đồn Trú"];
  return REGIONS_BY_ID[station] ? station : state["Lãnh Địa"][station]?.["Thuộc Vùng"] ?? station;
}

/**
 * Ra lệnh vây: nếu quân ở xa thì xếp hành quân trước; tới nơi mới dựng trại trong
 * vài ngày. Trạng thái Bị Vây chỉ xuất hiện sau khi cả hai giai đoạn hoàn tất.
 */
export function orderSiege(state: StatData, unitName: string, targetTerritoryId: string): SiegeOrderResult {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị vây", ops: [] };
  if (unit["Ngày Tập Hợp Còn Lại"] > 0) return { ok: false, error: "Đơn vị chưa tập hợp xong", ops: [] };
  if (unit["Ngày Huấn Luyện"] > 0) return { ok: false, error: "Đơn vị đang huấn luyện", ops: [] };
  if (unit["Đang Di Chuyển Đến"]) return { ok: false, error: "Đơn vị đang thi hành một lệnh hành quân khác", ops: [] };
  if (unit["Lệnh Vây Khi Đến"]) return { ok: false, error: "Đơn vị đã nhận một lệnh vây thành", ops: [] };

  const resolved = resolveSiegeTarget(state, targetTerritoryId);
  if (!resolved.ok) return { ok: false, error: resolved.error, ops: [] };
  const { provinceId, site } = resolved.target;
  const siegeTargetId = site?.id ?? provinceId;
  const unitBase = `stat_data.Biên Chế Quân Sự.${unitName}`;
  const queuedOps: PatchOp[] = [
    { op: "replace", path: `${unitBase}.Lệnh Vây Khi Đến`, value: siegeTargetId },
    { op: "replace", path: `${unitBase}.Ngày Dựng Trại Vây Còn Lại`, value: SIEGE_SETUP_DAYS },
  ];

  if (unitProvince(state, unitName) === provinceId) {
    return {
      ok: true,
      ops: queuedOps,
      marchDays: 0,
      setupDays: SIEGE_SETUP_DAYS,
      daysToStart: SIEGE_SETUP_DAYS,
    };
  }

  const march = moveArmy(state, unitName, provinceId);
  if (!march.ok) return { ok: false, error: march.error, ops: [] };
  const marchDays = march.days ?? 0;
  return {
    ok: true,
    // Ngày quân vừa tới chỉ dùng để hạ trại; ba ngày chuẩn bị bắt đầu từ hôm sau.
    ops: [
      ...march.ops,
      ...queuedOps,
      { op: "replace", path: `${unitBase}.Ngày Dựng Trại Vây Còn Lại`, value: SIEGE_SETUP_DAYS + 1 },
    ],
    marchDays,
    setupDays: SIEGE_SETUP_DAYS,
    daysToStart: marchDays + SIEGE_SETUP_DAYS,
  };
}

/**
 * Mở vây 1 vùng bằng 1 đơn vị người chơi (12.2). Ghi trạng thái vây vào Chủ
 * Quyền Lãnh Thổ (phủ MỌI vùng, kể cả của địch không có entry Lãnh Địa).
 */
export function startSiege(state: StatData, unitName: string, targetTerritoryId: string): SiegeResult {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị vây", ops: [] };
  const resolved = resolveSiegeTarget(state, targetTerritoryId);
  if (!resolved.ok) return { ok: false, error: resolved.error, ops: [] };
  const { provinceId, site: resolvedSite } = resolved.target;
  const pHouse = playerHouseId(state);
  if (unit["Đang Di Chuyển Đến"] || unitProvince(state, unitName) !== provinceId) {
    return { ok: false, error: "Quân vây chưa tới vùng mục tiêu", ops: [] };
  }
  if (unit["Ngày Dựng Trại Vây Còn Lại"] > 0) {
    return { ok: false, error: "Quân đang dựng trại và khép vòng vây", ops: [] };
  }

  const base = `stat_data.Chủ Quyền Lãnh Thổ.${provinceId}`;
  return {
    ok: true,
    ops: [
      { op: "replace", path: `${base}.Tình Trạng`, value: "Bị Vây" },
      {
        op: "replace", path: `${base}._Vây`,
        value: {
          "Phe Vây": pHouse,
          "Đơn Vị Vây": unitName,
          "Thành Trì Mục Tiêu": resolvedSite?.id,
          "Tên Thành Trì Mục Tiêu": resolvedSite?.name,
          "Ngày Đã Vây": 0,
          "Lương Còn": SIEGE_FOOD_DAYS,
          "Ngày Vây Tối Đa": SIEGE_MAX_DAYS,
        },
      },
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Lệnh Vây Khi Đến`, value: "" },
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Ngày Dựng Trại Vây Còn Lại`, value: 0 },
    ],
  };
}

/**
 * Hoàn tất lệnh vây đã xếp: chờ hành quân xong, đếm đủ ngày dựng trại rồi mới
 * chuyển thành sang "Bị Vây". Hàm mutate để chạy trong vòng lặp thời gian ngày.
 */
export function tickSiegeOrders(state: StatData): void {
  for (const [unitName, unit] of Object.entries(state["Biên Chế Quân Sự"])) {
    const targetId = unit["Lệnh Vây Khi Đến"];
    if (!targetId) continue;
    if (unit["Số Lượng"] <= 0) {
      unit["Lệnh Vây Khi Đến"] = undefined;
      unit["Ngày Dựng Trại Vây Còn Lại"] = 0;
      continue;
    }
    if (unit["Đang Di Chuyển Đến"]) continue;

    const resolved = resolveSiegeTarget(state, targetId);
    if (!resolved.ok) {
      unit["Lệnh Vây Khi Đến"] = undefined;
      unit["Ngày Dựng Trại Vây Còn Lại"] = 0;
      continue;
    }
    if (unitProvince(state, unitName) !== resolved.target.provinceId) {
      unit["Lệnh Vây Khi Đến"] = undefined;
      unit["Ngày Dựng Trại Vây Còn Lại"] = 0;
      continue;
    }

    unit["Ngày Dựng Trại Vây Còn Lại"] = Math.max(0, unit["Ngày Dựng Trại Vây Còn Lại"] - 1);
    if (unit["Ngày Dựng Trại Vây Còn Lại"] > 0) continue;

    const { provinceId, site } = resolved.target;
    const pHouse = playerHouseId(state);
    const sov = state["Chủ Quyền Lãnh Thổ"][provinceId];
    sov["Tình Trạng"] = "Bị Vây";
    sov["_Vây"] = {
      "Phe Vây": pHouse,
      "Đơn Vị Vây": unitName,
      "Thành Trì Mục Tiêu": site?.id,
      "Tên Thành Trì Mục Tiêu": site?.name,
      "Ngày Đã Vây": 0,
      "Lương Còn": SIEGE_FOOD_DAYS,
      "Ngày Vây Tối Đa": SIEGE_MAX_DAYS,
    };
    unit["Lệnh Vây Khi Đến"] = undefined;
  }
}

/** Đổi chủ 1 vùng (mutate — dùng trong loop vây thành). */
function captureRegionMutate(state: StatData, regionId: string, newHouseId: string, capturedOnDay: number): void {
  const region = REGIONS_BY_ID[regionId];
  const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
  if (!region || !sov) return;
  const pHouse = playerHouseId(state);
  const isPlayer = !!pHouse && newHouseId === pHouse;
  const wasPlayer = playerOwnsProvince(state, regionId);
  sov["Nhà Kiểm Soát"] = newHouseId;
  sov["Người Kiểm Soát"] = isPlayer ? state["Thông Tin Nhân Vật"]["Họ Tên"] : "";
  sov["Tình Trạng"] = "Mới Chiếm";
  sov["Là Của Người Chơi"] = isPlayer;
  sov["_Ngày Đổi Chủ"] = capturedOnDay;
  sov["_Vây"] = undefined;

  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const seatMarker = markersForEra(eraId).find((m) => m.name === region.seat);
  const seatId = seatMarker ? seatMarker.id : region.id + "-seat";
  const seatStronghold = strongholdsForProvince(region.id, eraId).find((site) => site.source === "seat");
  if (seatStronghold) setStrongholdControlMutate(state, seatStronghold.id, newHouseId);

  const holdings = state["Lãnh Địa"] as Record<string, unknown>;
  if (isPlayer && !holdings[seatId]) {
    holdings[seatId] = makeHolding({
      regionId: region.id,
      terrain: region.terrain,
      coastal: region.coastal,
      name: region.seat,
      danSo: canonicalSettlementPopulation(
        seatId,
        region.seat,
        region.id,
        eraId,
        seatMarker?.population ?? 20_000,
      ),
      trungThanh: 35, 
      moTa: `${region.seat} — vừa chiếm được, dân chưa quy phục` 
    });
  } else if (!isPlayer && wasPlayer && holdings[seatId]) {
    delete holdings[seatId];
  }
  sov["Kiểm Soát Hoàn Toàn"] = !!newHouseId
    && provinceControlStatus(state, regionId, newHouseId).complete;
}

function normalized(value: string): string {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function holdingIdForStronghold(state: StatData, site: StrongholdSite): string | undefined {
  if (state["Lãnh Địa"][site.id]) return site.id;
  if (site.markerId && state["Lãnh Địa"][site.markerId]) return site.markerId;
  const wanted = normalized(site.name);
  return Object.entries(state["Lãnh Địa"]).find(([, holding]) => (
    holding["Thuộc Vùng"] === site.provinceId
    && normalized(holding["Mô Tả"] ?? "") === wanted
  ))?.[0];
}

/** Chiếm đúng một thành phụ; province không tự đổi màu/chủ quyền theo thành này. */
function captureStrongholdMutate(
  state: StatData,
  site: StrongholdSite,
  newHouseId: string,
): void {
  const pHouse = playerHouseId(state);
  const isPlayer = !!pHouse && pHouse === newHouseId;
  const existingHoldingId = holdingIdForStronghold(state, site);
  setStrongholdControlMutate(state, site.id, newHouseId);
  if (isPlayer && !existingHoldingId) {
    state["Lãnh Địa"][site.id] = makeHolding({
      regionId: site.provinceId,
      terrain: REGIONS_BY_ID[site.provinceId]?.terrain,
      coastal: REGIONS_BY_ID[site.provinceId]?.coastal,
      name: site.name,
      danSo: site.population,
      trungThanh: 35,
      moTa: `${site.name} — cứ điểm vừa thất thủ, quyền kiểm soát còn mong manh`,
      lord: state["Thông Tin Nhân Vật"]["Họ Tên"],
    }) as StatData["Lãnh Địa"][string];
  } else if (!isPlayer && existingHoldingId) {
    const holding = state["Lãnh Địa"][existingHoldingId];
    if (holding && holding["Người Kiểm Soát"] === state["Thông Tin Nhân Vật"]["Họ Tên"]) {
      delete state["Lãnh Địa"][existingHoldingId];
    }
  }
  const sovereignty = state["Chủ Quyền Lãnh Thổ"][site.provinceId];
  if (sovereignty) {
    sovereignty["Tình Trạng"] = "Mới Chiếm";
    sovereignty["_Vây"] = undefined;
    const provinceHouse = sovereignty["Nhà Kiểm Soát"];
    sovereignty["Kiểm Soát Hoàn Toàn"] = !!provinceHouse
      && provinceControlStatus(state, site.provinceId, provinceHouse).complete;
  }
}

/** 1 tick NGÀY vây thành (12.2): đếm ngày + lương, viện binh phá vây, hết hạn → thất thủ. */
export function tickSiege(state: StatData): void {
  const today = absoluteDay(state["Thế Giới"]);
  const pHouse = playerHouseId(state);

  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    if (sov["Tình Trạng"] !== "Bị Vây" || !sov["_Vây"]) continue;
    const vay = sov["_Vây"];
    vay["Ngày Đã Vây"] += 1;
    vay["Lương Còn"] -= 1;

    const region = REGIONS_BY_ID[regionId];
    if (!region) continue;

    // viện binh: đơn vị của phe THỦ (không phải phe vây) đứng tại vùng → phá vây
    const isPlayerBesieging = vay["Phe Vây"] === pHouse;
    const besiegingUnit = state["Biên Chế Quân Sự"][vay["Đơn Vị Vây"]];
    if (isPlayerBesieging && (
      !besiegingUnit
      || besiegingUnit["Số Lượng"] <= 0
      || !!besiegingUnit["Đang Di Chuyển Đến"]
      || unitProvince(state, vay["Đơn Vị Vây"]) !== regionId
    )) {
      sov["Tình Trạng"] = "Ổn Định";
      sov["_Vây"] = undefined;
      continue;
    }
    let relieved = false;
    if (!isPlayerBesieging) {
      relieved = Object.entries(state["Biên Chế Quân Sự"]).some(
        ([n, u]) => u["Số Lượng"] > 0 && !u["Đang Di Chuyển Đến"] && u["Lãnh Địa Đồn Trú"] === regionId && n !== vay["Đơn Vị Vây"],
      );
    }
    if (relieved) {
      sov["Tình Trạng"] = "Ổn Định";
      sov["_Vây"] = undefined;
      continue;
    }

    // hết lương hoặc quá hạn → thất thủ, đổi chủ sang phe vây (9.5.1)
    if (vay["Lương Còn"] <= 0 || vay["Ngày Đã Vây"] >= vay["Ngày Vây Tối Đa"]) {
      const besieger = vay["Phe Vây"];
      const targetSite = vay["Thành Trì Mục Tiêu"]
        ? strongholdForState(state, vay["Thành Trì Mục Tiêu"])
        : undefined;
      const defender = targetSite ? strongholdController(state, targetSite.id) : sov["Nhà Kiểm Soát"];
      if (targetSite && targetSite.source !== "seat") {
        captureStrongholdMutate(state, targetSite, besieger);
      } else {
        captureRegionMutate(state, regionId, besieger, today);
      }
      // War Score: bên thắng vây +, bên thua −
      if (besieger === pHouse && defender) {
        bumpWarScore(state, defender, 15);
      } else if (defender === pHouse && besieger) {
        bumpWarScore(state, besieger, -15);
      }
    }
  }
}

function bumpWarScore(state: StatData, houseId: string, delta: number): void {
  const diplo = state["Quan Hệ Ngoại Giao"];
  if (!diplo[houseId]) {
    diplo[houseId] = DiplomacyRelationSchema.parse({ "Trạng Thái": "Chiến Tranh" });
  }
  diplo[houseId]["War Score"] = Math.max(-100, Math.min(100, diplo[houseId]["War Score"] + delta));
}

/** 1 tick THÁNG vây thành: hao mòn kho lương + lòng dân của vùng bị vây. */
export function tickSiegeAttrition(state: StatData): void {
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    if (sov["Tình Trạng"] !== "Bị Vây" || !sov["_Vây"]) continue;
    const region = REGIONS_BY_ID[regionId];
    if (!region) continue;
    const seatMarker = markersForEra(eraId).find((m) => m.name === region.seat);
    const seatId = seatMarker ? seatMarker.id : region.id + "-seat";

    // vùng bị vây là holding người chơi → drain lương + lòng dân
    const targetSite = sov["_Vây"]?.["Thành Trì Mục Tiêu"]
      ? strongholdForState(state, sov["_Vây"]?.["Thành Trì Mục Tiêu"] ?? "")
      : undefined;
    const targetHoldingId = targetSite ? holdingIdForStronghold(state, targetSite) : undefined;
    const holding = state["Lãnh Địa"][targetHoldingId ?? seatId];
    if (holding) {
      holding["Tài Nguyên"]["Lương Thực"] = Math.max(0, holding["Tài Nguyên"]["Lương Thực"] - 150);
      holding["Trung Thành"] = Math.max(0, holding["Trung Thành"] - 2);
    }
  }
}

let registered = false;
export function registerSiegeLoop(): void {
  if (registered) return;
  registerDailyListener("siege", tickSiege);
  registerDailyListener("siege-orders", tickSiegeOrders);
  registerMonthlyListener("siege-attrition", tickSiegeAttrition);
  registered = true;
}
