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
import { REGIONS, REGIONS_BY_ID, regionControlForYear, factionsForYear, FACTION_COLORS_MAP, type MapRegion } from "../content/westeros/regions";
import { HOUSES_DATA, HOUSES_BY_ID } from "../content/westeros/houses";
import { houseColor, ATTITUDE_HEAT, PLAYER_HEAT_COLOR, NEUTRAL_COLOR } from "../content/westeros/houseColors";
import { MAP_MARKERS } from "../content/westeros/mapMarkers";
import { eventSeed } from "../probability/rng";
import { loreSeatFor } from "../content/westeros/loreSeats";
import { defaultJobSplit } from "../content/westeros/buildings";

/** schemaName ("Stark") → houseId ("stark"). */
export const HOUSE_ID_BY_SCHEMA: Record<string, string> = Object.fromEntries(
  HOUSES_DATA.map((h) => [h.schemaName, h.id]),
);

export function playerHouseId(state: StatData): string {
  return HOUSE_ID_BY_SCHEMA[state["Thông Tin Nhân Vật"]["Nhà"]] ?? "";
}

/**
 * Chốt lại cờ "Là Của Người Chơi" từ Nhà Kiểm Soát (M20).
 *
 * seedRegionControl tính cờ này NGAY LÚC gieo, nhưng ở luồng nhân vật nguyên tác
 * thì Nhà của nhân vật chưa được ghi vào state ở thời điểm đó — nên MỌI vùng đều
 * bị gắn cờ false, và hệ quả là `playerIsRulingLord` luôn sai: rail Triều Đình
 * và Mưu Đồ bị khoá vĩnh viễn dù đang đóng vai một đại lãnh chúa. Gọi hàm này ở
 * CUỐI init (và lúc migrate save) để cờ khớp với thực tế bàn cờ.
 */
export function repairPlayerSovereignty(state: StatData): number {
  const pHouse = playerHouseId(state);
  if (!pHouse) return 0;
  let fixed = 0;
  for (const sov of Object.values(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    const owns = String(sov["Nhà Kiểm Soát"] ?? "").toLowerCase() === pHouse;
    if (sov["Là Của Người Chơi"] !== owns) {
      sov["Là Của Người Chơi"] = owns;
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
  for (const sov of Object.values(state["Chủ Quyền Lãnh Thổ"])) {
    sov["Nhà Kiểm Soát"] = toHouseId(sov["Nhà Kiểm Soát"]);
  }
  for (const holding of Object.values(state["Lãnh Địa"])) {
    holding["Nhà Kiểm Soát"] = toHouseId(holding["Nhà Kiểm Soát"]);
  }
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
export function seedRegionControl(state: StatData, _eraId: string, opts?: { createIfMissing?: boolean }): void {
  const currentYear = state["Thế Giới"]["Năm"] ?? 298;
  const control = regionControlForYear(currentYear);
  const pHouse = playerHouseId(state);
  const sovereignty = state["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>;

  for (const region of REGIONS) {
    const house = control[region.id] ?? "";
    sovereignty[region.id] = {
      "Nhà Kiểm Soát": house,
      "Tình Trạng": "Ổn Định",
      "Là Của Người Chơi": !!pHouse && house === pHouse,
      "_Ngày Đổi Chủ": 0,
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
        lord: state["Thông Tin Nhân Vật"]["Họ Tên"],
        terrainSeed: newTerrainSeed(state, seatId, 0),
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
  capturedOnDay: number,
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
    { op: "replace", path: `${base}._Ngày Đổi Chủ`, value: capturedOnDay },
  ];

  // Tìm seat marker ID cho region
  const seatMarker = MAP_MARKERS.find((m) => m.name === region.seat);
  const seatId = seatMarker ? seatMarker.id : region.id + "-seat";

  if (isPlayer && !state["Lãnh Địa"][seatId]) {
    // về tay người chơi → mở quản trị nội bộ thành trì trọng trấn, GIEO địa thế mới
    ops.push({
      op: "replace", path: `stat_data.Lãnh Địa.${seatId}`,
      value: makeHolding({
        regionId: region.id, terrain: region.terrain, coastal: region.coastal, name: region.seat,
        danSo: seatMarker?.population ?? 20000, trungThanh: 35,
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
  /** ngày tuyệt đối đổi chủ gần nhất (animation "lan chiếm" 9.5.3). */
  changedDay: number;
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
  const changedDay = sov?.["_Ngày Đổi Chủ"] ?? 0;

  if (mode === "relationship") {
    if (isPlayer) {
      return { color: PLAYER_HEAT_COLOR, striped: false, isPlayer, status, house, changedDay };
    }
    if (!house) {
      return { color: NEUTRAL_COLOR.base, striped: true, isPlayer, status, house, changedDay };
    }
    const schemaName = HOUSES_BY_ID[house]?.schemaName ?? "";
    const attitude = state["Thái Độ Các Nhà"][schemaName]?.["Thái Độ"] ?? "Cảnh Giác";
    const heat = ATTITUDE_HEAT[attitude] ?? ATTITUDE_HEAT["Cảnh Giác"];
    return { color: heat.color, striped: false, isPlayer, status, house, changedDay };
  }

  if (mode === "faction") {
    const currentYear = state["Thế Giới"]["Năm"] ?? 298;
    const eraFactions = factionsForYear(currentYear);
    if (eraFactions) {
      // Find which faction the house belongs to
      let foundFaction = null;
      for (const [factionName, houses] of Object.entries(eraFactions)) {
        if (houses.includes(house)) {
          foundFaction = factionName;
          break;
        }
      }
      
      if (foundFaction) {
        // Use a generic logic to color by faction based on its name or specific house color
        const factionColorId = FACTION_COLORS_MAP[foundFaction] ?? house;
        return {
          color: factionColorId ? houseColor(factionColorId).base : NEUTRAL_COLOR.base,
          striped: false,
          isPlayer,
          status,
          house, // still keep the house for UI tooltips
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
        changedDay,
      };
    }
  }

  // chính trị: màu bản sắc Nhà kiểm soát
  return {
    color: house ? houseColor(house).base : NEUTRAL_COLOR.base,
    striped: !house,
    isPlayer,
    status,
    house,
    changedDay,
  };
}

// ── Tính toán Lãnh Địa ──────────────────────────────────────────────────────
// CHỐT SỔ THÁNG nằm ở construction.tickTerritoryIncome (listener "territory-income").
// KHÔNG thêm vòng thu nhập thứ hai ở đây: trước kia monthlyTick() chạy song song
// với listener đó nên mỗi tháng lãnh địa được cộng thu nhập HAI LẦN.
// Quy hoạch/đặt công trình Tầng 1: xem territory/localMap.ts.
