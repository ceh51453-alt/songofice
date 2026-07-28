/**
 * war (12.1-12.2) — lớp chiến lược: tuyên chiến / War Score + vây thành.
 * - declareWar/makePeace + adjustWarScore: đổi "Quan Hệ Ngoại Giao" (pháp lý
 *   chiến sự — KHÁC "Thái Độ Các Nhà" tình cảm).
 * - startSiege + tickSiege: vùng bị vây drain lương theo ngày; có viện binh →
 *   phá vây; hết lương/quá hạn → thất thủ, đổi chủ (9.5.1 → bản đồ đổi màu).
 * Engine giữ số; captureRegion đồng bộ Lãnh Địa (10.1). AI narrate qua <siege_update>.
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { absoluteDay } from "../mvu/calendar";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { MAP_MARKERS } from "../content/westeros/mapMarkers";
import { playerHouseId, makeHolding } from "../territory/territoryEngine";

export type DiploState = "Hoà Bình" | "Chiến Tranh" | "Đình Chiến";

/** Tuyên chiến / đổi trạng thái ngoại giao (12.1). Trả ops cho engine áp. */
export function setWarStatus(houseId: string, status: DiploState): PatchOp[] {
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

export interface SiegeResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

/**
 * Mở vây 1 vùng bằng 1 đơn vị người chơi (12.2). Ghi trạng thái vây vào Chủ
 * Quyền Lãnh Thổ (phủ MỌI vùng, kể cả của địch không có entry Lãnh Địa).
 */
export function startSiege(state: StatData, unitName: string, targetTerritoryId: string): SiegeResult {
  const unit = state["Biên Chế Quân Sự"][unitName];
  if (!unit) return { ok: false, error: "Không tìm thấy đơn vị vây", ops: [] };
  const sov = state["Chủ Quyền Lãnh Thổ"][targetTerritoryId];
  if (!sov) return { ok: false, error: "Vùng không tồn tại", ops: [] };
  const pHouse = playerHouseId(state);
  if (sov["Nhà Kiểm Soát"] === pHouse) return { ok: false, error: "Không thể vây lãnh thổ của chính mình", ops: [] };

  const base = `stat_data.Chủ Quyền Lãnh Thổ.${targetTerritoryId}`;
  return {
    ok: true,
    ops: [
      { op: "replace", path: `${base}.Tình Trạng`, value: "Bị Vây" },
      {
        op: "replace", path: `${base}._Vây`,
        value: { "Phe Vây": pHouse, "Đơn Vị Vây": unitName, "Ngày Đã Vây": 0, "Lương Còn": SIEGE_FOOD_DAYS, "Ngày Vây Tối Đa": SIEGE_MAX_DAYS },
      },
      // quân vây tới đóng tại vùng bị vây
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Lãnh Địa Đồn Trú`, value: targetTerritoryId },
      { op: "replace", path: `stat_data.Biên Chế Quân Sự.${unitName}.Đang Di Chuyển Đến`, value: "" },
    ],
  };
}

/** Đổi chủ 1 vùng (mutate — dùng trong loop vây thành). */
function captureRegionMutate(state: StatData, regionId: string, newHouseId: string, capturedOnDay: number): void {
  const region = REGIONS_BY_ID[regionId];
  const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
  if (!region || !sov) return;
  const pHouse = playerHouseId(state);
  const isPlayer = !!pHouse && newHouseId === pHouse;
  const wasPlayer = sov["Là Của Người Chơi"];
  sov["Nhà Kiểm Soát"] = newHouseId;
  sov["Tình Trạng"] = "Mới Chiếm";
  sov["Là Của Người Chơi"] = isPlayer;
  sov["_Ngày Đổi Chủ"] = capturedOnDay;
  sov["_Vây"] = undefined;
  
  const seatMarker = MAP_MARKERS.find((m) => m.name === region.seat);
  const seatId = seatMarker ? seatMarker.id : region.id + "-seat";

  const holdings = state["Lãnh Địa"] as Record<string, unknown>;
  if (isPlayer && !holdings[seatId]) {
    holdings[seatId] = makeHolding({
      regionId: region.id,
      terrain: region.terrain,
      coastal: region.coastal,
      name: region.seat,
      danSo: seatMarker?.population ?? 20000,
      trungThanh: 35, 
      moTa: `${region.seat} — vừa chiếm được, dân chưa quy phục` 
    });
  } else if (!isPlayer && wasPlayer && holdings[seatId]) {
    delete holdings[seatId];
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
      const defender = sov["Nhà Kiểm Soát"];
      captureRegionMutate(state, regionId, besieger, today);
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
  const diplo = state["Quan Hệ Ngoại Giao"] as Record<string, { "Trạng Thái": DiploState; "War Score": number }>;
  if (!diplo[houseId]) diplo[houseId] = { "Trạng Thái": "Chiến Tranh", "War Score": 0 };
  diplo[houseId]["War Score"] = Math.max(-100, Math.min(100, diplo[houseId]["War Score"] + delta));
}

/** 1 tick THÁNG vây thành: hao mòn kho lương + lòng dân của vùng bị vây. */
export function tickSiegeAttrition(state: StatData): void {
  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    if (sov["Tình Trạng"] !== "Bị Vây" || !sov["_Vây"]) continue;
    const region = REGIONS_BY_ID[regionId];
    if (!region) continue;
    const seatMarker = MAP_MARKERS.find((m) => m.name === region.seat);
    const seatId = seatMarker ? seatMarker.id : region.id + "-seat";

    // vùng bị vây là holding người chơi → drain lương + lòng dân
    const holding = state["Lãnh Địa"][seatId];
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
  registerMonthlyListener("siege-attrition", tickSiegeAttrition);
  registered = true;
}
