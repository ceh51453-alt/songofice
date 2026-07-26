/**
 * territoryEngine (9.5) — logic CHỦ QUYỀN VÙNG, tách khỏi store/UI (thuần hàm):
 * - seedRegionControl: nạp bản đồ chủ quyền từ Era lúc initvar (9.6.1).
 * - captureRegionOps: đổi chủ 1 vùng + đồng bộ 2 chiều (9.5.1) — tạo/xoá entry
 *   Lãnh Địa tương ứng. Trả PatchOp[] cho ENGINE áp (được ghi field `_`).
 * - regionFill: suy màu tô runtime theo chế độ (9.5.2) — Chính Trị / Quan Hệ.
 * Bản đồ ĐỌC từ đây, không tự giữ chủ quyền — nguồn chân lý là stat_data.
 */
import type { StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { REGIONS, REGIONS_BY_ID, regionControlForEra, type MapRegion } from "../content/westeros/regions";
import { HOUSES_DATA, HOUSES_BY_ID } from "../content/westeros/houses";
import { houseColor, ATTITUDE_HEAT, PLAYER_HEAT_COLOR, NEUTRAL_COLOR } from "../content/westeros/houseColors";
import { MAP_MARKERS } from "../content/westeros/mapMarkers";

/** schemaName ("Stark") → houseId ("stark"). */
export const HOUSE_ID_BY_SCHEMA: Record<string, string> = Object.fromEntries(
  HOUSES_DATA.map((h) => [h.schemaName, h.id]),
);

export function playerHouseId(state: StatData): string {
  return HOUSE_ID_BY_SCHEMA[state["Thông Tin Nhân Vật"]["Nhà"]] ?? "";
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

/** Kho tài nguyên khởi điểm cho 1 lãnh địa mới (10.1). */
function baseResources(): { Vàng: number; "Lương Thực": number; Gỗ: number; Đá: number; "Quặng Sắt": number } {
  return { "Vàng": 0, "Lương Thực": 3000, "Gỗ": 300, "Đá": 300, "Quặng Sắt": 150 };
}

/** Dựng object Territory (10.1) cho 1 vùng/thành trì — dùng khi tạo/chiếm holding. */
export function makeHolding(opts?: { regionId?: string; terrain?: string; coastal?: boolean; name?: string; danSo?: number; trungThanh?: number; moTa?: string; taiNguyen?: Record<string, number> }): Record<string, unknown> {
  return {
    "Mô Tả": opts?.moTa ?? (opts?.name ? `${opts.name}` : `Thành trì`),
    "Dân Số": opts?.danSo ?? 10000,
    "Trung Thành": opts?.trungThanh ?? 60,
    "Thuộc Vùng": opts?.regionId ?? "",
    "Địa Hình": opts?.terrain,
    "Ven Biển": opts?.coastal ?? false,
    "Tài Nguyên": opts?.taiNguyen ?? baseResources(),
    "Công Trình": {},
    "Khủng Hoảng": [],
  };
}

/**
 * Nạp Chủ Quyền Lãnh Thổ từ Era (9.6.1) — MUTATE state (dùng lúc initvar).
 * createIfMissing: tạo entry Lãnh Địa cho vùng quê nếu người chơi kiểm soát mà
 * chưa có holding (tuyến canon — lãnh chúa). Tuyến wizard chỉ MIGRATE holding
 * gói xuất thân sẵn có (giữ nguyên số lượng holding — 8.5).
 */
export function seedRegionControl(state: StatData, eraId: string, opts?: { createIfMissing?: boolean }): void {
  const control = regionControlForEra(eraId);
  const pHouse = playerHouseId(state);
  const sovereignty = state["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>;

  for (const region of REGIONS) {
    const house = control[region.id] ?? "";
    sovereignty[region.id] = {
      "Nhà Kiểm Soát": house,
      "Tình Trạng": "Ổn Định",
      "Là Của Người Chơi": !!pHouse && house === pHouse,
      "_Đổi Chủ Turn": 0,
    };
  }

  const home = homeRegionForHouse(pHouse);
  const holdings = state["Lãnh Địa"] as Record<string, unknown>;
  const playerControlsHome = home && control[home.id] === pHouse;
  if (!home || !playerControlsHome) return;

  // MIGRATE: Đặt "Thuộc Vùng" cho holding gói xuất thân. Nếu là nhân vật canon, tạo Lãnh Địa cho trọng trấn.
  const genericKeys = Object.keys(holdings);
  if (genericKeys.length > 0) {
    // Nếu có Lãnh địa tổ truyền, thiết lập nó thuộc vùng quê nhà (không đổi key để giữ tính độc lập)
    const src = holdings[genericKeys[0]] as Record<string, unknown>;
    src["Thuộc Vùng"] = home.id;
    if (!src["Địa Hình"]) src["Địa Hình"] = home.terrain;
    if (src["Ven Biển"] === undefined) src["Ven Biển"] = home.coastal;
  } else if (opts?.createIfMissing) {
    // Tạo Lãnh Địa cho trọng trấn (seat) của vùng nếu là canon player
    if (home.seat) {
      const seatMarker = MAP_MARKERS.find((m) => m.name === home.seat);
      const seatId = seatMarker ? seatMarker.id : home.id + "-seat";
      holdings[seatId] = makeHolding({
        regionId: home.id,
        terrain: home.terrain,
        coastal: home.coastal,
        name: home.seat,
        danSo: seatMarker?.population ?? 20000,
      });
    }
  }
}

/**
 * Đổi chủ 1 vùng (9.5.1) — trả PatchOp[] cho ENGINE áp (vây thành 12.2 / đổi
 * phe / thừa kế 13.4). Đồng bộ 2 chiều: cập nhật Chủ Quyền + tạo/xoá Lãnh Địa.
 */
export function captureRegionOps(
  state: StatData,
  regionId: string,
  newHouseId: string,
  turn: number,
): PatchOp[] {
  const region = REGIONS_BY_ID[regionId];
  if (!region) return [];
  const pHouse = playerHouseId(state);
  const isPlayer = !!pHouse && newHouseId === pHouse;
  const wasPlayer = !!state["Chủ Quyền Lãnh Thổ"][regionId]?.["Là Của Người Chơi"];
  const base = `stat_data.Chủ Quyền Lãnh Thổ.${regionId}`;

  const ops: PatchOp[] = [
    { op: "replace", path: `${base}.Nhà Kiểm Soát`, value: newHouseId },
    { op: "replace", path: `${base}.Tình Trạng`, value: "Mới Chiếm" },
    { op: "replace", path: `${base}.Là Của Người Chơi`, value: isPlayer },
    { op: "replace", path: `${base}._Đổi Chủ Turn`, value: turn },
  ];

  // Tìm seat marker ID cho region
  const seatMarker = MAP_MARKERS.find((m) => m.name === region.seat);
  const seatId = seatMarker ? seatMarker.id : region.id + "-seat";

  if (isPlayer && !state["Lãnh Địa"][seatId]) {
    // về tay người chơi → mở quản trị nội bộ thành trì trọng trấn
    ops.push({
      op: "replace", path: `stat_data.Lãnh Địa.${seatId}`,
      value: makeHolding({ 
        regionId: region.id, terrain: region.terrain, coastal: region.coastal, name: region.seat, 
        danSo: seatMarker?.population ?? 20000, trungThanh: 35, moTa: `${region.seat} — vừa chiếm được, dân chưa quy phục` 
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

export type MapMode = "political" | "relationship";

export interface RegionFill {
  color: string;
  /** vùng vô chủ/tranh chấp → sọc 2 màu. */
  striped: boolean;
  isPlayer: boolean;
  status: string;
  house: string;
  /** turn đổi chủ gần nhất (animation "lan chiếm" 9.5.3). */
  changedTurn: number;
}

export function regionController(state: StatData, regionId: string): string {
  return state["Chủ Quyền Lãnh Thổ"][regionId]?.["Nhà Kiểm Soát"] ?? "";
}

/** Màu + kiểu tô 1 vùng theo chế độ hiển thị (9.5.2). */
export function regionFill(state: StatData, regionId: string, mode: MapMode): RegionFill {
  const sov = state["Chủ Quyền Lãnh Thổ"][regionId];
  const house = sov?.["Nhà Kiểm Soát"] ?? "";
  const isPlayer = !!sov?.["Là Của Người Chơi"];
  const status = sov?.["Tình Trạng"] ?? "Ổn Định";
  const changedTurn = sov?.["_Đổi Chủ Turn"] ?? 0;

  if (mode === "relationship") {
    if (isPlayer) {
      return { color: PLAYER_HEAT_COLOR, striped: false, isPlayer, status, house, changedTurn };
    }
    if (!house) {
      return { color: NEUTRAL_COLOR.base, striped: true, isPlayer, status, house, changedTurn };
    }
    const schemaName = HOUSES_BY_ID[house]?.schemaName ?? "";
    const attitude = state["Thái Độ Các Nhà"][schemaName]?.["Thái Độ"] ?? "Cảnh Giác";
    const heat = ATTITUDE_HEAT[attitude] ?? ATTITUDE_HEAT["Cảnh Giác"];
    return { color: heat.color, striped: false, isPlayer, status, house, changedTurn };
  }

  // chính trị: màu bản sắc Nhà kiểm soát
  return {
    color: house ? houseColor(house).base : NEUTRAL_COLOR.base,
    striped: !house,
    isPlayer,
    status,
    house,
    changedTurn,
  };
}

// ── Tính toán Lãnh Địa (V9) ─────────────────────────────────────────────────

export function calculateYield(territory: Record<string, any>, weatherFactor: number, month: number): { Vàng: number; "Lương Thực": number; Gỗ: number; Đá: number; "Quặng Sắt": number } {
  // Mùa factor
  let muaFactor = 1.0;
  if (month >= 1 && month <= 3) muaFactor = 1.0;
  else if (month >= 4 && month <= 6) muaFactor = 1.2;
  else if (month >= 7 && month <= 9) muaFactor = 1.5;
  else muaFactor = 0.2;

  // Lòng dân factor
  const loyalty = typeof territory["Lòng Dân"] === "number" ? territory["Lòng Dân"] : 60;
  let ktFactor = 1.0;
  if (loyalty < 30) ktFactor = 0.7;
  else if (loyalty < 50) ktFactor = 0.9;
  else if (loyalty < 70) ktFactor = 1.0;
  else if (loyalty < 90) ktFactor = 1.15;
  else ktFactor = 1.3;

  // Tính sản lượng cơ bản (stub cho logic quy hoạch chi tiết)
  const danSo = territory["Dân Số Chi Tiết"] || {};
  const nongDan = danSo["Nông Dân"] || (territory["Dân Số"] * 0.5) || 500;
  const thợMỏ = danSo["Thợ Mỏ"] || 50;
  const tiềuPhu = danSo["Tiều Phu"] || 50;
  
  // Nông nghiệp: sl = Nông_dân * 3 * muaFactor * weatherFactor * ktFactor
  const food = Math.floor(nongDan * 3 * muaFactor * weatherFactor * ktFactor);
  
  // Khai thác: giả sử điểm bình thường (10 cân/người)
  const wood = Math.floor(tiềuPhu * 10 * ktFactor);
  const stone = Math.floor(thợMỏ * 5 * ktFactor);
  const iron = Math.floor(thợMỏ * 5 * ktFactor);
  
  // Thương mại (Vàng)
  const thuongNhan = danSo["Thương Nhân"] || 100;
  const gold = Math.floor(thuongNhan * 0.5 * ktFactor);
  
  return { Vàng: gold, "Lương Thực": food, Gỗ: wood, Đá: stone, "Quặng Sắt": iron };
}

export function monthlyTick(state: StatData): PatchOp[] {
  const ops: PatchOp[] = [];
  const month = state["Thế Giới"]["Ngày"] > 30 ? Math.floor(state["Thế Giới"]["Ngày"]/30) + 1 : 1; // Giả sử mỗi tháng 30 ngày
  const weatherFactor = 1.0; // Tạm thời 1.0
  
  const holdings = state["Lãnh Địa"] as Record<string, any>;
  
  for (const [id, holding] of Object.entries(holdings)) {
    const yieldRes = calculateYield(holding, weatherFactor, month);
    
    // Nông nghiệp (Bước 2)
    const currentFood = holding["Tài Nguyên"]["Lương Thực"] || 0;
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${id}.Tài Nguyên.Lương Thực`, value: currentFood + yieldRes["Lương Thực"] });
    
    // Khai thác (Bước 3)
    const currentWood = holding["Tài Nguyên"]["Gỗ"] || 0;
    const currentStone = holding["Tài Nguyên"]["Đá"] || 0;
    const currentIron = holding["Tài Nguyên"]["Quặng Sắt"] || 0;
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${id}.Tài Nguyên.Gỗ`, value: currentWood + yieldRes.Gỗ });
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${id}.Tài Nguyên.Đá`, value: currentStone + yieldRes.Đá });
    ops.push({ op: "replace", path: `stat_data.Lãnh Địa.${id}.Tài Nguyên.Quặng Sắt`, value: currentIron + yieldRes["Quặng Sắt"] });
    
    // Tiêu hao lương quân (Bước 5) - Giả sử 2 bao/lính
    // Tìm quân đồn trú
    let troopsInHolding = 0;
    const units = state["Biên Chế Quân Sự"] || {};
    for (const unit of Object.values(units)) {
        if (unit["Lãnh Địa Đồn Trú"] === id) {
            troopsInHolding += (unit["Số Lượng"] || 0);
        }
    }
    const foodConsumed = troopsInHolding * 2;
    if (foodConsumed > 0) {
        ops.push({ op: "delta", path: `stat_data.Lãnh Địa.${id}.Tài Nguyên.Lương Thực`, value: -foodConsumed });
        // TODO: Sĩ khí giảm nếu thiếu lương thực
    }
    
    // Cập nhật Vàng cho Lãnh Chúa (Bước 8-10)
    // Thực tế vàng đi vào ví nhân vật
    if (holding["Người Kiểm Soát"] === state["Thông Tin Nhân Vật"]["Họ Tên"] || state["Chủ Quyền Lãnh Thổ"][holding["Thuộc Vùng"]]?.["Là Của Người Chơi"]) {
        ops.push({ op: "delta", path: `stat_data.Thông Tin Nhân Vật.Vàng`, value: yieldRes.Vàng });
    }
  }
  
  return ops;
}

export function getBuildableRadius(castleLevel: number): number {
    return 10 + castleLevel * 10; // Cấp 1 -> 20 ô, Cấp 5 -> 60 ô
}

export function placeBuilding(state: StatData, territoryId: string, buildingType: string, x: number, y: number): PatchOp[] {
  const territory = state["Lãnh Địa"][territoryId] as any;
  if (!territory) return [];
  
  // Find Castle level to determine bounds
  let castleLevel = 1;
  const buildings = territory["Công Trình"] || {};
  for (const b of Object.values(buildings)) {
      if ((b as any)["Loại"] === "Lâu Đài") {
          castleLevel = (b as any)["Cấp Độ"] || 1;
          break;
      }
  }

  const radius = getBuildableRadius(castleLevel);
  const centerX = 750;
  const centerY = 750;

  // Basic validation (e.g. check bounds)
  if (Math.abs(x - centerX) > radius || Math.abs(y - centerY) > radius) {
      throw new Error(`Vị trí (${x}, ${y}) vượt quá khu vực quy hoạch (Bán kính: ${radius} ô) của Thành Trì cấp ${castleLevel}.`);
  }
  
  const bId = `${buildingType}_${x}_${y}`;
  if (territory["Công Trình"] && territory["Công Trình"][bId]) {
      throw new Error("Vị trí đã có công trình");
  }
  
  // Create patch op
  return [{
      op: "insert",
      path: `stat_data.Lãnh Địa.${territoryId}.Công Trình.${bId}`,
      value: {
          "Loại": buildingType,
          "Cấp Độ": 1,
          "Đang Xây": true,
          "Turn Còn Lại": 3,
          "Tọa Độ X": x,
          "Tọa Độ Y": y,
          "Kích Thước": 1
      }
  }];
}
