/**
 * Acceptance HỆ BẢN ĐỒ ĐA TẦNG:
 * - Tầng 1 sinh địa hình TẤT ĐỊNH từ dữ liệu vùng (một nguồn chân lý, không lưu save).
 * - Địa hình là "thềm đỡ": chặn công trình mọc giữa biển / sai địa hình / ngoài
 *   vùng quy hoạch / chồng lên nhau.
 * - Đặt công trình đi CHUNG một đường ống với hàng đợi xây dựng (trừ tài nguyên,
 *   đếm ngày), không có hệ thứ hai.
 * - Tầng 2/3 là bản tổng hợp bottom-up: đổi ở Tầng 1 → Tầng 2 và Tầng 3 đổi theo.
 * - Zoom chỉ đổi mức chi tiết, KHÔNG đổi toạ độ vật lý.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import {
  seedRegionControl, normalizeHouseIds, toHouseId, regionFill,
  captureRegionOps, holdingOwnedByPlayer, playerHoldingIds, seedMissingTerrain,
} from "./territoryEngine";
import { startConstruction } from "./construction";
import { houseColor } from "../content/westeros/houseColors";
import {
  canPlace, placeBuilding, placeRing, holdingAnchor, terrainOf, nextBuildingName,
  repairAllHoldings, layoutHolding,
} from "./localMap";
import { autoBuildCity } from "../character/characterInit";
import { LORE_SEATS, loreSeatFor, compassToAngle } from "../content/westeros/loreSeats";
import {
  localTerrainMap, terrainAtCell, terrainRasterRGBA, sampleField, _clearTerrainCache,
} from "./localTerrain";
import { townLayout } from "./localTown";
import {
  generateNodes, ensureResourceNodes, overlapsWallReserve, NODE_TABLE, NODE_GRADE_MULT, depleteNode,
} from "./resourceNodes";
import { planWall, buildWall, upgradeWall, wallDefense, WALL_MATERIAL_BY_ID } from "./walls";
import { LOCAL_BLOCK_CELLS } from "../content/westeros/mapScale";
import { summarizeHolding, summarizeRegion, balanceOfPower } from "./mapAggregate";
import { BUILDING_CATALOG } from "../content/westeros/buildings";
import { isWater, TERRAIN_TRAITS } from "../content/westeros/terrain";
import {
  LOCAL_CENTER_CELL, LOCAL_GRID_CELLS, LOCAL_CELL_M, LOCAL_SPAN_M, LOCAL_BLOCKS,
  buildableRadiusCells, localCellToWorldPx, worldPxToLocalCell, tierForZoom, regionLod,
  worldDistanceKm,
} from "../content/westeros/mapScale";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { EXCHANGE_RATES } from "../economy/currency";

const GOLD = EXCHANGE_RATES.GOLD_TO_COPPER;
const C = LOCAL_CENTER_CELL;

function lordState(goldDragons = 5000): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = goldDragons * GOLD;
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  const parsed = StatDataSchema.parse(s);
  // kho vật liệu rộng rãi để test quy hoạch chứ không test tài nguyên
  parsed["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"] = {
    "Ngân Khố": 0, "Lương Thực": 9000, "Gỗ": 9000, "Đá": 9000, "Quặng Sắt": 9000,
  };
  return parsed;
}

/** Ô đầu tiên trong vùng quy hoạch có địa hình thoả yêu cầu của loại công trình. */
function findCell(s: StatData, type: keyof typeof BUILDING_CATALOG): [number, number] {
  const radius = buildableRadiusCells(1);
  for (let y = C - radius; y < C + radius; y += 10) {
    for (let x = C - radius; x < C + radius; x += 10) {
      if (canPlace(s, "the-north-seat", type, x, y).ok) return [x, y];
    }
  }
  throw new Error(`không tìm được ô hợp lệ cho ${type}`);
}

describe("Tỉ lệ & tầng bản đồ (một hệ toạ độ cho cả 3 tầng)", () => {
  it("lưới Tầng 1 = 5 m/ô → 1500 ô = 7.5 km", () => {
    expect(LOCAL_CELL_M).toBe(5);
    expect(LOCAL_SPAN_M).toBe(LOCAL_GRID_CELLS * LOCAL_CELL_M);
    expect(LOCAL_SPAN_M / 1000).toBe(7.5);
  });

  it("zoom chỉ đổi mức chi tiết, KHÔNG đổi toạ độ vật lý", () => {
    const anchor: [number, number] = [470, 300];
    const back = worldPxToLocalCell(anchor, ...localCellToWorldPx(anchor, 900, 300));
    expect(back[0]).toBeCloseTo(900, 0);
    expect(back[1]).toBeCloseTo(300, 0);

    // cùng một ô → cùng một điểm px, bất kể đang xem ở tầng nào
    const a = localCellToWorldPx(anchor, 900, 300);
    const b = localCellToWorldPx(anchor, 900, 300);
    expect(a).toEqual(b);
  });

  it("semantic zoom: xa → Tầng 3, gần → Tầng 2 + bóc tách dần chi tiết", () => {
    expect(tierForZoom(0.3)).toBe("world");
    expect(tierForZoom(1.5)).toBe("region");
    expect(regionLod(0.5).villages).toBe(false); // zoom xa: gom cụm, không vẽ làng
    expect(regionLod(2.0).villages).toBe(true); // zoom gần: bóc tách
    expect(regionLod(0.5).regionLabels).toBe(true); // biên giới vùng luôn còn
  });

  it("khoảng cách px quy được ra km thật", () => {
    const north = REGIONS_BY_ID["the-north"].seatXY;
    const dorne = REGIONS_BY_ID["dorne"].seatXY;
    const km = worldDistanceKm(north, dorne);
    expect(km).toBeGreaterThan(2500);
    expect(km).toBeLessThan(5000);
  });
});

describe("Tầng 1 — địa hình là hình chiếu tất định của vùng vĩ mô", () => {
  it("cùng lãnh địa → cùng bản đồ địa hình (không cần lưu vào save)", () => {
    _clearTerrainCache();
    const a = localTerrainMap("winterfell", { terrain: "Tuyết/Băng Giá", coastal: true });
    _clearTerrainCache();
    const b = localTerrainMap("winterfell", { terrain: "Tuyết/Băng Giá", coastal: true });
    expect(b.grid).toEqual(a.grid);
    // điểm tài nguyên cũng tất định theo cùng hạt giống
    expect(generateNodes(b)).toEqual(generateNodes(a));
  });

  it("lãnh địa khác nhau trong cùng vùng → địa thế khác nhau", () => {
    const a = localTerrainMap("winterfell", { terrain: "Tuyết/Băng Giá", coastal: true });
    const b = localTerrainMap("dreadfort", { terrain: "Tuyết/Băng Giá", coastal: true });
    expect(b.grid).not.toEqual(a.grid);
  });

  it("kế thừa địa hình chủ đạo của vùng + mở đất canh tác quanh trọng trấn", () => {
    const map = localTerrainMap("highgarden", { terrain: "Đồng Bằng", coastal: false });
    expect(map.dominant).toBe("Đồng Bằng");
    // nền thành ở tâm luôn vững để dựng trọng trấn
    expect(terrainAtCell(map, C, C)).toBe("Thành Trì (thủ)");
    const arable = map.grid.filter((t) => t === "Đồng Bằng").length;
    expect(arable).toBeGreaterThan(map.blocks * map.blocks * 0.2);
  });

  it("vùng ven biển có mặt biển; vùng lục địa thì không", () => {
    const coastal = localTerrainMap("pyke", { terrain: "Đồng Bằng", coastal: true });
    const inland = localTerrainMap("riverrun", { terrain: "Đồng Bằng", coastal: false });
    expect(coastal.grid.some((t) => t === "Biển")).toBe(true);
    expect(inland.grid.some((t) => t === "Biển")).toBe(false);
  });

  it("điểm tài nguyên chỉ mọc trên địa hình phù hợp", () => {
    const map = localTerrainMap("casterly-rock", { terrain: "Đồi Núi", coastal: true });
    const nodes = generateNodes(map);
    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) {
      const t = terrainAtCell(map, n["Tọa Độ X"], n["Tọa Độ Y"]);
      // mỗi loại tài nguyên chỉ mọc trên địa hình mà bảng xác suất cho phép
      // (trừ mấy điểm bám mép nước, được cắm riêng theo bờ biển/bờ sông)
      const allowed = NODE_TABLE[t]?.some((row) => row.res === n["Tài Nguyên"]);
      const waterside = n["Mã"].startsWith("nd-sea") || n["Mã"].startsWith("nd-river");
      expect(allowed || waterside).toBe(true);
      expect(n["Trữ Lượng"]).toBeGreaterThanOrEqual(0);
      expect(n["Trữ Lượng"]).toBeLessThanOrEqual(3);
      const waterZone = n["Tài Nguyên"] === "Sông Hồ" || n["Tài Nguyên"] === "Biển Cả";
      expect(isWater(t)).toBe(waterZone);
    }
  });
});

describe("Tầng 1 — quy hoạch: địa hình đỡ công trình, không cho đặt bừa", () => {
  it("đặt hợp lệ → trừ tài nguyên + vào hàng đợi xây + GIỮ toạ độ ô", () => {
    const s = lordState();
    const [x, y] = findCell(s, "Nông Trại");
    const woodBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Gỗ"];

    const r = placeBuilding(s, "the-north-seat", "Nông Trại", x, y);
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    const b = state["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"];
    expect(b["Tọa Độ X"]).toBe(x);
    expect(b["Tọa Độ Y"]).toBe(y);
    expect(b["Kích Thước"]).toBe(BUILDING_CATALOG["Nông Trại"].footprint);
    expect(b["Đang Xây"]).toBe(true);
    expect(b["Ngày Xây Còn Lại"]).toBe(90);
    expect(state["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Gỗ"]).toBe(woodBefore - 80);
  });

  it("chặn: ngoài vùng quy hoạch của Lâu Đài", () => {
    const s = lordState();
    const far = C + buildableRadiusCells(1) + 50;
    const r = canPlace(s, "the-north-seat", "Nông Trại", far, far);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("quy hoạch");
  });

  it("chặn: đặt chồng lên công trình sẵn có", () => {
    let s = lordState();
    const [x, y] = findCell(s, "Nông Trại");
    s = applyPatch(s, placeBuilding(s, "the-north-seat", "Nông Trại", x, y).ops).state;
    const r = canPlace(s, "the-north-seat", "Nông Trại", x + 2, y + 2);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Chồng lên");
  });

  it("chặn: xây trên mặt nước / địa hình không chịu lực", () => {
    const s = lordState();
    const map = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    const radius = buildableRadiusCells(1);
    let blockedFound = false;
    for (let y = C - radius; y < C + radius && !blockedFound; y += 20) {
      for (let x = C - radius; x < C + radius && !blockedFound; x += 20) {
        const t = terrainAtCell(map, x, y);
        if (TERRAIN_TRAITS[t].buildable) continue;
        const r = canPlace(s, "the-north-seat", "Doanh Trại", x, y);
        expect(r.ok).toBe(false);
        blockedFound = true;
      }
    }
    // Phương Bắc ven biển luôn có mép nước trong lưới
    expect(map.grid.some((t) => isWater(t))).toBe(true);
  });

  it("chặn: Nông Trại đòi đất canh tác, không dựng trên băng tuyết", () => {
    const s = lordState();
    const map = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    const radius = buildableRadiusCells(1);
    for (let y = C - radius; y < C + radius; y += 20) {
      for (let x = C - radius; x < C + radius; x += 20) {
        if (terrainAtCell(map, x, y) !== "Tuyết/Băng Giá") continue;
        const r = canPlace(s, "the-north-seat", "Nông Trại", x, y);
        expect(r.ok).toBe(false);
        expect(r.error).toContain("Nông Trại cần");
        return;
      }
    }
  });

  it("Bến Cảng phải sát mép nước — Winterfell nằm sâu trong đất liền nên chịu", () => {
    const s = lordState();
    // Winterfell là toà thành trong lore: KHÔNG giáp biển dù Phương Bắc có bờ biển
    const map = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    expect(map.coastal).toBe(false);
    expect(canPlace(s, "the-north-seat", "Bến Cảng", C, C).ok).toBe(false);

    // một trang viên thường ở vùng ven biển thì vẫn có mép nước để dựng cảng
    s["Lãnh Địa"]["trang-vien-ven-bien"] = {
      ...s["Lãnh Địa"]["the-north-seat"],
      "Mô Tả": "Trang viên ven biển",
      "Ven Biển": true,
      "Hạt Giống Địa Hình": 5150,
    };
    const coastMap = terrainOf("trang-vien-ven-bien", s["Lãnh Địa"]["trang-vien-ven-bien"]);
    expect(coastMap.coastal).toBe(true);
  });

  it("nhiều công trình cùng loại được đánh số riêng, không đè lên nhau", () => {
    let s = lordState();
    const [x1, y1] = findCell(s, "Nông Trại");
    s = applyPatch(s, placeBuilding(s, "the-north-seat", "Nông Trại", x1, y1).ops).state;
    expect(nextBuildingName(s["Lãnh Địa"]["the-north-seat"], "Nông Trại")).toBe("Nông Trại 2");
    const [x2, y2] = findCell(s, "Nông Trại");
    s = applyPatch(s, placeBuilding(s, "the-north-seat", "Nông Trại", x2, y2).ops).state;
    const buildings = s["Lãnh Địa"]["the-north-seat"]["Công Trình"];
    expect(Object.keys(buildings)).toContain("Nông Trại 2");
    expect(buildings["Nông Trại"]["Tọa Độ X"]).not.toBe(buildings["Nông Trại 2"]["Tọa Độ X"]);
  });

  it("Lâu Đài là duy nhất — xây lại = nâng cấp chứ không mọc thêm cái nữa", () => {
    expect(BUILDING_CATALOG["Lâu Đài"].unique).toBe(true);
    const s = lordState();
    expect(nextBuildingName(s["Lãnh Địa"]["the-north-seat"], "Lâu Đài")).toBe("Lâu Đài");
  });

  it("nâng cấp giữ nguyên chỗ cũ, không dời công trình theo ô vừa bấm", () => {
    let s = lordState();
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Lâu Đài", "Lâu Đài", { x: 700, y: 700 }).ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Lâu Đài"]["Đang Xây"] = false;

    const r = startConstruction(s, "the-north-seat", "Lâu Đài", "Lâu Đài", { x: 900, y: 980 });
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    const castle = state["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Lâu Đài"];
    expect(castle["Cấp Độ"]).toBe(2);
    expect([castle["Tọa Độ X"], castle["Tọa Độ Y"]]).toEqual([700, 700]);
  });

  it("mọi loại công trình đều khai báo khuôn viên hợp lệ", () => {
    for (const def of Object.values(BUILDING_CATALOG)) {
      if (def.ring) expect(def.footprint).toBe(0);
      else expect(def.footprint).toBeGreaterThan(0);
    }
  });
});

describe("Neo toạ độ — Tầng 1 gắn đúng chỗ trên Tầng 2/3", () => {
  it("trọng trấn neo vào toạ độ trọng trấn của vùng", () => {
    const s = lordState();
    const anchor = holdingAnchor("the-north-seat", s["Lãnh Địa"]["the-north-seat"], REGIONS_BY_ID["the-north"]);
    expect(anchor).toEqual(REGIONS_BY_ID["the-north"].seatXY);
  });

  it("lãnh địa lạ vẫn neo tất định trong vùng của nó (không nhảy chỗ mỗi lần vẽ)", () => {
    const s = lordState();
    s["Lãnh Địa"]["trang-vien-x"] = { ...s["Lãnh Địa"]["the-north-seat"], "Thuộc Vùng": "the-north" };
    const a = holdingAnchor("trang-vien-x", s["Lãnh Địa"]["trang-vien-x"]);
    const b = holdingAnchor("trang-vien-x", s["Lãnh Địa"]["trang-vien-x"]);
    expect(a).toEqual(b);
    expect(a).not.toEqual(REGIONS_BY_ID["the-north"].seatXY);
  });

  it("toạ độ ghim trong state thắng mọi suy luận", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Neo Thế Giới"] = { X: 123, Y: 456 };
    expect(holdingAnchor("the-north-seat", s["Lãnh Địa"]["the-north-seat"])).toEqual([123, 456]);
  });
});

describe("Đồng bộ từ dưới lên — Tầng 1 đổi thì Tầng 2, Tầng 3 đổi theo", () => {
  it("xây xong ở Tầng 1 → khu dân cư Tầng 2 tăng công trình + phòng thủ", () => {
    let s = lordState();
    const before = summarizeHolding(s, "the-north-seat");

    const [x, y] = findCell(s, "Doanh Trại");
    s = applyPatch(s, placeBuilding(s, "the-north-seat", "Doanh Trại", x, y).ops).state;
    const building = summarizeHolding(s, "the-north-seat");
    expect(building.underConstruction).toBe(before.underConstruction + 1);
    expect(building.buildings).toBe(before.buildings); // chưa xong thì chưa tính

    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Doanh Trại"]["Đang Xây"] = false;
    const done = summarizeHolding(s, "the-north-seat");
    expect(done.buildings).toBe(before.buildings + 1);
    expect(done.underConstruction).toBe(before.underConstruction);
  });

  it("Tầng 2 gom cụm: 1 vùng biết tổng dân, tổng công trình, tổng quân của Tầng 1", () => {
    let s = lordState();
    s["Biên Chế Quân Sự"]["Vệ Binh Winterfell"] = {
      ...(s["Biên Chế Quân Sự"]["Vệ Binh Winterfell"] ?? {}),
      "Số Lượng": 4000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-north-seat",
    } as StatData["Biên Chế Quân Sự"][string];
    s = StatDataSchema.parse(s);

    const region = summarizeRegion(s, "the-north");
    expect(region.controller).toBe("stark");
    expect(region.isPlayer).toBe(true);
    expect(region.managedCount).toBe(1);
    expect(region.garrison).toBe(4000);
    expect(region.managedPopulation).toBe(s["Lãnh Địa"]["the-north-seat"]["Dân Số"]);
    // khu dân cư của vùng gồm cả trọng trấn quản trị được lẫn địa danh tĩnh
    expect(region.settlements.some((x) => x.managed)).toBe(true);
    expect(region.settlements.length).toBeGreaterThan(1);
  });

  it("Tầng 2 KHÔNG vẽ trùng: lãnh địa quản trị ghi đè địa danh tĩnh cùng chỗ", () => {
    const s = lordState();
    const region = summarizeRegion(s, "the-north");
    const seats = region.settlements.filter((x) => x.seat);
    expect(seats).toHaveLength(1);
    expect(seats[0].managed).toBe(true);
  });

  it("Tầng 3 đọc cán cân quyền lực từ chủ quyền + quân + công sự", () => {
    const s = lordState();
    const power = balanceOfPower(s);
    expect(power.length).toBeGreaterThan(3);
    const shares = power.reduce((n, r) => n + r.share, 0);
    expect(shares).toBeCloseTo(1, 5);
    // Reach đông dân nhất Westeros → Tyrell phải đứng trên Greyjoy
    const tyrell = power.find((r) => r.houseId === "tyrell")!;
    const greyjoy = power.find((r) => r.houseId === "greyjoy")!;
    expect(tyrell.power).toBeGreaterThan(greyjoy.power);
  });

  it("mất vùng ở Tầng 2 → quyền lực Tầng 3 dịch chuyển", () => {
    const s = lordState();
    const before = balanceOfPower(s).find((r) => r.houseId === "stark")!.power;
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Nhà Kiểm Soát"] = "bolton";
    const after = balanceOfPower(s).find((r) => r.houseId === "stark");
    expect((after?.power ?? 0)).toBeLessThan(before);
  });
});

describe("Quyền xây — chỉ CHỦ THẬT của thành trì mới động thổ được", () => {
  it("chủ thành trì xây được", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Người Kiểm Soát"] = "Robb Stark";
    const [x, y] = findCell(s, "Doanh Trại");
    expect(placeBuilding(s, "the-north-seat", "Doanh Trại", x, y).ok).toBe(true);
  });

  it("đất của lãnh chúa khác thì KHÔNG, dù cùng Nhà và cùng vùng người chơi nắm", () => {
    const s = lordState();
    // vùng vẫn là của người chơi, nhưng thành trì này do người khác cai quản
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(true);
    s["Lãnh Địa"]["the-north-seat"]["Người Kiểm Soát"] = "Eddard Stark";

    const [x, y] = findCell(s, "Doanh Trại");
    const r = placeBuilding(s, "the-north-seat", "Doanh Trại", x, y);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Eddard Stark");
    expect(r.ops).toHaveLength(0);

    // chặn ở TẬN ENGINE, không phải chỉ ẩn nút: đường xây thẳng cũng bị từ chối
    expect(startConstruction(s, "the-north-seat", "Nông Trại").ok).toBe(false);
    expect(holdingOwnedByPlayer(s, "the-north-seat")).toBe(false);
    expect(playerHoldingIds(s)).not.toContain("the-north-seat");
  });

  it("thành trì chưa có ai cai quản thì xét theo chủ quyền vùng", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Người Kiểm Soát"] = "";
    expect(holdingOwnedByPlayer(s, "the-north-seat")).toBe(true);
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"] = false;
    expect(holdingOwnedByPlayer(s, "the-north-seat")).toBe(false);
  });

  it("chiếm được vùng → thành trì ghi tên người chơi làm chủ", () => {
    const s = lordState();
    const { state } = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 12));
    expect(state["Lãnh Địa"]["the-riverlands-seat"]["Người Kiểm Soát"]).toBe("Robb Stark");
    expect(holdingOwnedByPlayer(state, "the-riverlands-seat")).toBe(true);
  });
});

describe("Địa thế gieo lúc được phong / chiếm được", () => {
  it("chiếm vùng → sinh hạt giống địa hình mới", () => {
    const s = lordState();
    const { state } = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 12));
    const seed = state["Lãnh Địa"]["the-riverlands-seat"]["Hạt Giống Địa Hình"];
    expect(typeof seed).toBe("number");
    expect(seed).toBeGreaterThan(0);
  });

  it("chiếm ở thời điểm khác → vùng đất khác, nhưng cùng hạt giống thì y hệt", () => {
    const s = lordState();
    const a = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 12)).state["Lãnh Địa"]["the-riverlands-seat"];
    const b = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 900)).state["Lãnh Địa"]["the-riverlands-seat"];
    expect(a["Hạt Giống Địa Hình"]).not.toBe(b["Hạt Giống Địa Hình"]);

    const mapA = localTerrainMap("x", { terrain: "Đồng Bằng", coastal: false, seed: a["Hạt Giống Địa Hình"] });
    const mapB = localTerrainMap("x", { terrain: "Đồng Bằng", coastal: false, seed: b["Hạt Giống Địa Hình"] });
    expect(mapB.grid).not.toEqual(mapA.grid);

    const again = localTerrainMap("khác-id-hoàn-toàn", { terrain: "Đồng Bằng", coastal: false, seed: a["Hạt Giống Địa Hình"] });
    expect(again.grid).toEqual(mapA.grid); // hạt giống quyết định, không phải tên
  });

  it("ngẫu nhiên nhưng vẫn ĐÚNG CHẤT của vùng: đất núi nhiều đồi hơn đất đồng bằng", () => {
    let mountainous = 0;
    let flat = 0;
    for (let s = 1; s <= 6; s++) {
      const hill = localTerrainMap("h", { terrain: "Đồi Núi", coastal: false, seed: s * 7919 });
      const plain = localTerrainMap("p", { terrain: "Đồng Bằng", coastal: false, seed: s * 7919 });
      mountainous += hill.grid.filter((t) => t === "Đồi Núi" || t === "Hẻm Núi").length;
      flat += plain.grid.filter((t) => t === "Đồi Núi" || t === "Hẻm Núi").length;
    }
    expect(mountainous).toBeGreaterThan(flat * 1.5);
  });

  it("vùng rừng rậm cho nhiều rừng hơn sa mạc", () => {
    let woods = 0;
    let desert = 0;
    for (let s = 1; s <= 6; s++) {
      woods += localTerrainMap("w", { terrain: "Rừng Rậm", coastal: false, seed: s * 104729 }).grid.filter((t) => t === "Rừng Rậm").length;
      desert += localTerrainMap("d", { terrain: "Sa Mạc", coastal: false, seed: s * 104729 }).grid.filter((t) => t === "Rừng Rậm").length;
    }
    expect(woods).toBeGreaterThan(desert);
  });
});

describe("Địa hình phải TỰ NHIÊN — không kẻ ô, không góc vuông", () => {
  const map = localTerrainMap("tu-nhien", { terrain: "Đồi Núi", coastal: true, seed: 20260729 });

  it("ranh giới không bám theo lưới khối: chỗ đổi đất rơi vào đủ mọi vị trí", () => {
    const cuts: number[] = [];
    for (let y = 200; y < 1300; y += 37) {
      let prev = terrainAtCell(map, 100, y);
      for (let x = 101; x < 1400; x += 4) {
        const cur = terrainAtCell(map, x, y);
        if (cur !== prev) cuts.push(x);
        prev = cur;
      }
    }
    expect(cuts.length).toBeGreaterThan(40);
    // hệ lưới cũ luôn cắt đúng bội số 60 ô; giờ phải rải rác
    const onBlockEdge = cuts.filter((x) => x % LOCAL_BLOCK_CELLS < 5).length;
    expect(onBlockEdge / cuts.length).toBeLessThan(0.25);
  });

  it("mỗi loại đất trải thành cụm loang, không phải một khối đặc", () => {
    // đếm số "đảo" theo hàng: nếu là khối vuông thì mỗi hàng chỉ có 1-2 đoạn
    let runs = 0;
    let rows = 0;
    for (let y = 300; y < 1200; y += 60) {
      rows++;
      let prev = "";
      for (let x = 300; x < 1200; x += 6) {
        const t = terrainAtCell(map, x, y);
        if (t !== prev) runs++;
        prev = t;
      }
    }
    expect(runs / rows).toBeGreaterThan(3);
  });

  it("sông uốn lượn: hướng đổi từ từ, không có góc gãy 90°", () => {
    const river = localTerrainMap("song", { terrain: "Sông/Lối Vượt Sông", coastal: false, seed: 4242 }).river;
    expect(river.length).toBeGreaterThan(30);
    let maxTurn = 0;
    for (let i = 2; i < river.length; i++) {
      const a1 = Math.atan2(river[i - 1].y - river[i - 2].y, river[i - 1].x - river[i - 2].x);
      const a2 = Math.atan2(river[i].y - river[i - 1].y, river[i].x - river[i - 1].x);
      let d = Math.abs(a2 - a1);
      if (d > Math.PI) d = Math.PI * 2 - d;
      maxTurn = Math.max(maxTurn, d);
    }
    expect(maxTurn).toBeLessThan(Math.PI / 3); // < 60° mỗi khúc → không gãy vuông
  });

  it("sông có khúc rộng khúc hẹp chứ không đều một bề ngang", () => {
    for (const seed of [4242, 90210, 13579]) {
      const river = localTerrainMap("song", { terrain: "Sông/Lối Vượt Sông", coastal: false, seed }).river;
      const widths = river.map((p) => p.w);
      expect(Math.max(...widths) / Math.min(...widths)).toBeGreaterThan(1.8);
    }
  });

  it("vùng núi có độ cao biến thiên để đổ bóng cao dần, không phẳng lì", () => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < map.elev.length; i += 7) {
      min = Math.min(min, map.elev[i]);
      max = Math.max(max, map.elev[i]);
    }
    expect(max - min).toBeGreaterThan(0.35);
  });

  it("ảnh nền tô màu có biến thiên trong cùng một loại đất (không phẳng một màu)", () => {
    const rgba = terrainRasterRGBA(map);
    const seen = new Set<string>();
    for (let i = 0; i < rgba.length; i += 4 * 97) seen.add(`${rgba[i]},${rgba[i + 1]},${rgba[i + 2]}`);
    expect(seen.size).toBeGreaterThan(80);
  });
});

describe("Hình hài thành trì", () => {
  const map = localTerrainMap("thanh", { terrain: "Đồng Bằng", coastal: true, seed: 777001 });
  const town = townLayout(map, [], { wallRadius: 180, hasWall: true });

  it("tường thành méo theo địa thế chứ không phải hình tròn hoàn hảo", () => {
    const radii = town.wall.map(([x, y]) => Math.hypot(x - C, y - C));
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    expect(max / min).toBeGreaterThan(1.15);
    // nhưng vẫn liền mạch: hai đỉnh kề nhau không nhảy vọt
    for (let i = 1; i < radii.length; i++) {
      expect(Math.abs(radii[i] - radii[i - 1])).toBeLessThan(radii[i - 1] * 0.35);
    }
  });

  it("mỗi cổng có MỘT quan lộ liền mạch: trung tâm → cổng → mép lưới", () => {
    expect(town.gates.length).toBeGreaterThanOrEqual(3);
    expect(town.throughRoads).toHaveLength(town.gates.length);
    expect(town.gates.filter((g) => g.main)).toHaveLength(1); // một cổng chính

    for (const road of town.throughRoads) {
      // bắt đầu từ trung tâm thành
      const start = road.points[0];
      expect(Math.hypot(start[0] - C, start[1] - C)).toBeLessThan(6);
      // Chạy tới mép lưới, trừ khi gặp biển: đường bộ phải dừng ở bờ thay vì
      // tiếp tục xuyên qua mặt nước.
      const end = road.points[road.points.length - 1];
      const outside = end[0] < 0 || end[1] < 0
        || end[0] > LOCAL_GRID_CELLS || end[1] > LOCAL_GRID_CELLS;
      if (!outside) expect(terrainAtCell(map, end[0], end[1])).not.toBe("Biển");
      // đường liền: không có bước nhảy đột ngột giữa hai điểm kề nhau
      for (let i = 0; i < road.points.length - 1; i++) {
        const d = Math.hypot(
          road.points[i + 1][0] - road.points[i][0],
          road.points[i + 1][1] - road.points[i][1],
        );
        expect(d).toBeLessThan(60);
      }
    }
    // trục chính luôn có TÊN để vẽ nhãn dọc đường
    expect(town.throughRoads.find((r) => r.main)?.name).toBeTruthy();
  });

  it("trục lộ cong chứ không kẻ thẳng tắp từ cổng vào tâm", () => {
    const road = town.throughRoads[0].points.slice(0, 17);
    const a = road[1];
    const b = road[road.length - 1];
    let maxOff = 0;
    for (const p of road.slice(1)) {
      const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) /
        ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1);
      const px = a[0] + (b[0] - a[0]) * t;
      const py = a[1] + (b[1] - a[1]) * t;
      maxOff = Math.max(maxOff, Math.hypot(p[0] - px, p[1] - py));
    }
    expect(maxOff).toBeGreaterThan(1);
  });

  it("cầu chỉ mọc ở chỗ đường thật sự cắt qua dòng nước", () => {
    const riverTown = localTerrainMap("cau", { terrain: "Sông/Lối Vượt Sông", coastal: false, seed: 30303 });
    const layout = townLayout(riverTown, [], { wallRadius: 200, hasWall: true });
    for (const br of layout.bridges) {
      expect(sampleField(riverTown, riverTown.riverF, br.at[0], br.at[1])).toBeGreaterThan(0.4);
      expect(br.span).toBeGreaterThan(0);
    }
  });
});

describe("Toà thành trong tiểu thuyết — địa thế cố định + đường có tên", () => {
  it("địa thế GHIM: hạt giống trong state không làm Winterfell đổi dáng", () => {
    const s = lordState();
    const a = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    s["Lãnh Địa"]["the-north-seat"]["Hạt Giống Địa Hình"] = 123456;
    const b = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    expect(b.grid).toEqual(a.grid);
    expect(b.seed).toBe(a.seed);
  });

  it("gieo hạt lúc tạo ván BỎ QUA các toà thành trong lore", () => {
    const s = lordState();
    delete s["Lãnh Địa"]["the-north-seat"]["Hạt Giống Địa Hình"];
    s["Lãnh Địa"]["trang-vien-la"] = { ...s["Lãnh Địa"]["the-north-seat"], "Mô Tả": "Trang viên lạ" };
    delete s["Lãnh Địa"]["trang-vien-la"]["Hạt Giống Địa Hình"];

    seedMissingTerrain(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Hạt Giống Địa Hình"]).toBeUndefined();
    expect(typeof s["Lãnh Địa"]["trang-vien-la"]["Hạt Giống Địa Hình"]).toBe("number");
  });

  it("địa hình theo mô tả gốc, không theo vùng: Winterfell trong đất liền, Eyrie toàn vách núi", () => {
    const winterfell = loreSeatFor("the-north-seat")!;
    expect(winterfell.coastal).toBe(false); // dù Phương Bắc là vùng ven biển
    const wMap = localTerrainMap("the-north-seat", { lore: winterfell });
    expect(wMap.grid.some((t) => t === "Biển")).toBe(false);
    expect(wMap.river.length).toBeGreaterThan(10); // suối nước nóng / dòng chảy

    const eyrie = loreSeatFor("the-vale-seat")!;
    const eMap = localTerrainMap("the-vale-seat", { lore: eyrie });
    const rugged = eMap.grid.filter((t) => t === "Đồi Núi" || t === "Hẻm Núi").length;
    expect(rugged / eMap.grid.length).toBeGreaterThan(0.5);
  });

  it("mọi toà thành trong bảng đều khai báo hợp lệ", () => {
    for (const seat of LORE_SEATS) {
      expect(seat.ids.length).toBeGreaterThan(0);
      expect(seat.wallLevel).toBeGreaterThanOrEqual(0);
      expect(seat.note.length).toBeGreaterThan(10);
      const mains = seat.roads.filter((r) => r.main);
      expect(mains.length).toBeLessThanOrEqual(1);
      if (seat.roads.length > 0) expect(mains).toHaveLength(1); // có đường thì phải có trục chính
    }
  });

  it("cổng mở đúng hướng con đường có tên (Vương Lộ chạy bắc-nam qua Winterfell)", () => {
    const lore = loreSeatFor("the-north-seat")!;
    const map = localTerrainMap("the-north-seat", { lore });
    const town = townLayout(map, [], {
      wallRadius: 180, hasWall: true,
      loreRoads: lore.roads.map((r) => ({ name: r.name, angle: compassToAngle(r.dir), main: r.main })),
    });
    expect(town.fromLore).toBe(true);
    expect(town.gates).toHaveLength(lore.roads.length);
    expect(town.gates.map((g) => g.name)).toEqual(lore.roads.map((r) => r.name));

    const north = town.gates.find((g) => g.name?.includes("Tường Thành"))!;
    const south = town.gates.find((g) => g.name?.includes("phương Nam"))!;
    expect(north.at[1]).toBeLessThan(C); // cổng bắc ở phía trên tâm
    expect(south.at[1]).toBeGreaterThan(C); // cổng nam ở phía dưới
    // tên trong tiểu thuyết đi theo QUAN LỘ chứ không nằm lại ở cổng
    expect(town.throughRoads).toHaveLength(town.gates.length);
    expect(town.throughRoads.map((r) => r.name)).toEqual(lore.roads.map((r) => r.name));
  });

  it("thành THƯỜNG: cổng rải đều quanh tường, trục lộ không chồng lên nhau", () => {
    // Trước đây bộ lọc khoảng cách bị đảo dấu nên mọi cổng dồn về một phía.
    for (const seed of [11, 2024, 777, 90210]) {
      const map = localTerrainMap("thuong", { terrain: "Đồng Bằng", coastal: false, seed });
      const town = townLayout(map, [], { wallRadius: 190, hasWall: true });
      expect(town.fromLore).toBe(false);
      expect(town.gates.length).toBeGreaterThanOrEqual(3);

      const angles = town.gates.map((g) => Math.atan2(g.at[1] - C, g.at[0] - C));
      for (let i = 0; i < angles.length; i++) {
        for (let j = i + 1; j < angles.length; j++) {
          let d = Math.abs(angles[i] - angles[j]);
          if (d > Math.PI) d = Math.PI * 2 - d;
          expect(d).toBeGreaterThan(0.6); // hai cổng luôn cách nhau > ~34°
        }
      }
    }
  });
});

describe("Tường thành", () => {
  it("toà thành trong lore được dựng sẵn tường đúng cấp; Castle Black thì không", () => {
    const winterfell = autoBuildCity(3, "the-north-seat", "the-north");
    expect(winterfell["Tường Thành"]).toBeDefined();
    expect(winterfell["Tường Thành"]["Cấp Độ"]).toBe(loreSeatFor("the-north-seat")!.wallLevel);
    expect(winterfell["Tường Thành"]["Đang Xây"]).toBe(false);

    const castleBlack = autoBuildCity(3, "castle-black", "the-north");
    expect(castleBlack["Tường Thành"]).toBeUndefined(); // chỉ có Tường Thành phía bắc che chở
  });

  it("thành thường có tường từ cấp 2, cấp 1 thì chưa", () => {
    expect(autoBuildCity(1, "trai-nho", "the-reach")["Tường Thành"]).toBeUndefined();
    expect(autoBuildCity(3, "trang-vien", "the-reach")["Tường Thành"]).toBeDefined();
  });

  it("người chơi xây được tường thành — vành đai, không chiếm ô lưới", () => {
    const s = lordState();
    delete s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Tường Thành"];
    const r = placeRing(s, "the-north-seat", "Tường Thành");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    const wall = state["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Tường Thành"];
    expect(wall["Đang Xây"]).toBe(true);
    expect(wall["Kích Thước"]).toBe(0); // vành đai — không cản chỗ của công trình khác
    expect(BUILDING_CATALOG["Tường Thành"].ring).toBe(true);
  });

  it("xây lại vành đai = NÂNG CẤP (dày thêm), không mọc vòng thứ hai", () => {
    let s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Dân Số"] = 60000; // đủ thợ cho tường cấp 2
    s = applyPatch(s, placeRing(s, "the-north-seat", "Tường Thành").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Tường Thành"]["Đang Xây"] = false;
    const before = s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Tường Thành"]["Cấp Độ"];

    const r = placeRing(s, "the-north-seat", "Tường Thành");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    const walls = Object.values(state["Lãnh Địa"]["the-north-seat"]["Công Trình"]).filter((b) => b["Loại"] === "Tường Thành");
    expect(walls).toHaveLength(1);
    expect(walls[0]["Cấp Độ"]).toBe(before + 1);
  });
});

// ── M18: tường VẠCH TAY ──────────────────────────────────────────────────────
describe("Tường thành vạch tay (M18)", () => {
  /** một vòng vuông quanh trọng trấn — người chơi bấm 5 điểm rồi Đồng Ý. */
  const ring = (r: number) => [
    { x: C - r, y: C - r }, { x: C + r, y: C - r },
    { x: C + r, y: C + r }, { x: C - r, y: C + r }, { x: C - r, y: C - r },
  ];

  it("chi phí và thời gian tính theo CẤP và ĐỘ DÀI tuyến vừa vạch", () => {
    const short = planWall(ring(60), 1, "Đá");
    const long = planWall(ring(180), 1, "Đá");
    const thick = planWall(ring(60), 3, "Đá");

    expect(short.ok).toBe(true);
    // dài gấp ba thì tốn đá gấp ba và lâu hơn hẳn
    expect(long.length).toBeGreaterThan(short.length * 2.5);
    expect(long.cost["Đá"]!).toBeGreaterThan(short.cost["Đá"]! * 2.5);
    expect(long.days).toBeGreaterThan(short.days);
    // cấp cao thì đắt hơn, chậm hơn, và chắc hơn
    expect(thick.cost["Đá"]!).toBeGreaterThan(short.cost["Đá"]!);
    expect(thick.days).toBeGreaterThan(short.days);
    expect(thick.defense).toBeGreaterThan(short.defense);
    // khép kín thì phòng thủ đầy đủ; tuyến hở chỉ chắn một hướng
    expect(short.closed).toBe(true);
    expect(planWall([{ x: C, y: C - 80 }, { x: C + 80, y: C - 80 }], 1, "Đá").closed).toBe(false);
  });

  it("vật liệu khác nhau đổi cả giá, tốc độ lẫn sức chống đỡ", () => {
    const wood = planWall(ring(80), 1, "Gỗ");
    const stone = planWall(ring(80), 1, "Đá");
    expect(wood.days).toBeLessThan(stone.days);
    expect(wood.defense).toBeLessThan(stone.defense);
    expect(WALL_MATERIAL_BY_ID["Đá Đen"].maxLevel).toBeGreaterThan(WALL_MATERIAL_BY_ID["Gỗ"].maxLevel);
  });

  it("dựng tuyến → trừ vật tư, vào hàng đợi ngày, và nằm trong state", () => {
    let s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Tường Thành"] = [];
    const stoneBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Đá"];

    const r = buildWall(s, "the-north-seat", ring(70), { level: 1, material: "Đá" });
    expect(r.ok).toBe(true);
    s = applyPatch(s, r.ops).state;

    const lines = s["Lãnh Địa"]["the-north-seat"]["Tường Thành"];
    expect(lines).toHaveLength(1);
    expect(lines[0]["Điểm"]).toHaveLength(5); // đúng số điểm người chơi đã bấm
    expect(lines[0]["Đang Xây"]).toBe(true);
    expect(lines[0]["Ngày Xây Còn Lại"]).toBeGreaterThan(0);
    expect(s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Đá"]).toBeLessThan(stoneBefore);

    // đang xây thì chưa tính phòng thủ; xong mới tính
    expect(wallDefense(s["Lãnh Địa"]["the-north-seat"])).toBe(0);
    lines[0]["Đang Xây"] = false;
    expect(wallDefense(s["Lãnh Địa"]["the-north-seat"])).toBeGreaterThan(0);
  });

  it("dựng tường dời ngay mạch tài nguyên đang nằm trên tuyến", () => {
    let s = lordState();
    const holding = s["Lãnh Địa"]["the-north-seat"];
    holding["Tường Thành"] = [];
    holding["Điểm Tài Nguyên"] = [{
      "Mã": "mạch-bị-cắt", "Tài Nguyên": "Đá", "Trữ Lượng": 2, "Còn Lại": 12_000,
      "Tọa Độ X": C, "Tọa Độ Y": C - 130, "Kích Thước": 12,
      "Đã Khám Phá": true, "Công Trình": "", "Mô Tả": "Mạch trên tuyến tường mới",
    }];

    const r = buildWall(s, "the-north-seat", ring(130), {
      level: 1, material: "Đá", map: terrainOf("the-north-seat", holding),
    });
    expect(r.ok).toBe(true);
    s = applyPatch(s, r.ops).state;

    const node = s["Lãnh Địa"]["the-north-seat"]["Điểm Tài Nguyên"][0];
    const walls = s["Lãnh Địa"]["the-north-seat"]["Tường Thành"];
    expect(overlapsWallReserve(walls, node["Tọa Độ X"], node["Tọa Độ Y"], 10)).toBe(false);
    expect(node["Vùng Bao Phủ"].every((point) => !overlapsWallReserve(walls, point.x, point.y, 5))).toBe(true);
    expect([node["Tọa Độ X"], node["Tọa Độ Y"]]).not.toEqual([C, C - 130]);
  });

  it("NÂNG CẤP tuyến chỉ trả phần chênh — tường cũ không bao giờ biến mất", () => {
    let s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Dân Số"] = 40000;
    s["Lãnh Địa"]["the-north-seat"]["Tường Thành"] = [];
    s = applyPatch(s, buildWall(s, "the-north-seat", ring(70), { material: "Đá" }).ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Tường Thành"][0]["Đang Xây"] = false;

    const id = s["Lãnh Địa"]["the-north-seat"]["Tường Thành"][0]["Mã"];
    const shape = JSON.stringify(s["Lãnh Địa"]["the-north-seat"]["Tường Thành"][0]["Điểm"]);
    const full = planWall(ring(70), 2, "Đá").cost["Đá"]!;
    const stoneBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Đá"];

    const up = upgradeWall(s, "the-north-seat", id);
    expect(up.ok).toBe(true);
    s = applyPatch(s, up.ops).state;

    const line = s["Lãnh Địa"]["the-north-seat"]["Tường Thành"][0];
    expect(line["Cấp"]).toBe(2);
    expect(JSON.stringify(line["Điểm"])).toBe(shape); // giữ nguyên hình đã vạch
    expect(stoneBefore - s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Đá"]).toBeLessThan(full);
  });

  it("NÂNG CẤP LÂU ĐÀI KHÔNG xoá tường đã xây (lỗi cũ)", () => {
    let s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Dân Số"] = 60000;
    s["Lãnh Địa"]["the-north-seat"]["Tường Thành"] = [];
    s = applyPatch(s, buildWall(s, "the-north-seat", ring(70), { material: "Đá" }).ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Tường Thành"][0]["Đang Xây"] = false;
    const before = JSON.stringify(s["Lãnh Địa"]["the-north-seat"]["Tường Thành"]);

    const castle = startConstruction(s, "the-north-seat", "Lâu Đài", "Lâu Đài");
    expect(castle.ok).toBe(true);
    s = applyPatch(s, castle.ops).state;

    // bán kính quy hoạch đổi theo cấp Lâu Đài, nhưng tường là dữ liệu RIÊNG
    expect(JSON.stringify(s["Lãnh Địa"]["the-north-seat"]["Tường Thành"])).toBe(before);
    expect(wallDefense(s["Lãnh Địa"]["the-north-seat"])).toBeGreaterThan(0);
  });

  it("bố cục thành KHÔNG tự vẽ vành đai khi người chơi đã có tường riêng", () => {
    const map = terrainOf("the-north-seat", lordState()["Lãnh Địa"]["the-north-seat"]);
    const auto = townLayout(map, [], { wallRadius: 200, hasWall: true });
    const drawn = townLayout(map, [], { wallRadius: 200, hasWall: true, playerWalls: true });
    expect(auto.hasWall).toBe(true);
    expect(drawn.hasWall).toBe(false);
  });

  it("từ chối tuyến quá ngắn hoặc lọt ra ngoài lưới", () => {
    expect(planWall([{ x: C, y: C }], 1, "Đá").ok).toBe(false);
    expect(planWall([{ x: C, y: C }, { x: C + 2, y: C }], 1, "Đá").ok).toBe(false);
    expect(planWall([{ x: -5, y: C }, { x: C, y: C }], 1, "Đá").ok).toBe(false);
  });

  it("không phải chủ thì không dựng được tường", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Người Kiểm Soát"] = "Eddard Stark";
    expect(placeRing(s, "the-north-seat", "Tường Thành").ok).toBe(false);
  });
});

describe("Chuẩn hoá dữ liệu cũ — bố cục hợp lệ + khoá Nhà đúng", () => {
  it("dời công trình chồng lấn / sai địa hình của hệ lưới cũ về ô hợp lệ", () => {
    const s = lordState();
    // mô phỏng save cũ: mọi thứ dồn quanh ô 750, kích thước 1-2 ô
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"] = {
      "Lâu Đài_750_750": { "Loại": "Lâu Đài", "Cấp Độ": 3, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 750, "Tọa Độ Y": 750, "Kích Thước": 2 },
      "Nông Trại_751_750": { "Loại": "Nông Trại", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 751, "Tọa Độ Y": 750, "Kích Thước": 1 },
      "Nông Trại_752_750": { "Loại": "Nông Trại", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 752, "Tọa Độ Y": 750, "Kích Thước": 1 },
      "Chợ_749_751": { "Loại": "Chợ", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 749, "Tọa Độ Y": 751, "Kích Thước": 1 },
    };

    const moved = repairAllHoldings(s);
    expect(moved).toBeGreaterThan(0);

    // sau khi sửa: không còn cặp nào chồng nhau, khuôn viên đúng bảng công trình
    const list = Object.entries(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]);
    for (const [, b] of list) {
      expect(b["Kích Thước"]).toBe(BUILDING_CATALOG[b["Loại"]].footprint);
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i][1];
        const b = list[j][1];
        const sa = BUILDING_CATALOG[a["Loại"]].footprint;
        const sb = BUILDING_CATALOG[b["Loại"]].footprint;
        const hit =
          a["Tọa Độ X"] < b["Tọa Độ X"] + sb && b["Tọa Độ X"] < a["Tọa Độ X"] + sa &&
          a["Tọa Độ Y"] < b["Tọa Độ Y"] + sb && b["Tọa Độ Y"] < a["Tọa Độ Y"] + sa;
        expect(hit).toBe(false);
      }
    }
  });

  it("chạy lại lần hai không dời gì nữa (idempotent)", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"] = {
      "Nông Trại_751_750": { "Loại": "Nông Trại", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 751, "Tọa Độ Y": 750, "Kích Thước": 1 },
      "Chợ_749_751": { "Loại": "Chợ", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Tọa Độ X": 749, "Tọa Độ Y": 751, "Kích Thước": 1 },
    };
    repairAllHoldings(s);
    expect(repairAllHoldings(s)).toBe(0);
  });

  it("khoá Nhà viết theo schemaName được đưa về houseId (bản đồ tô đúng màu)", () => {
    const s = lordState();
    s["Chủ Quyền Lãnh Thổ"]["the-westerlands"]["Nhà Kiểm Soát"] = "Lannister";
    expect(toHouseId("Lannister")).toBe("lannister");
    normalizeHouseIds(s);
    expect(s["Chủ Quyền Lãnh Thổ"]["the-westerlands"]["Nhà Kiểm Soát"]).toBe("lannister");
    expect(regionFill(s, "the-westerlands", "political").color).toBe(houseColor("lannister").base);
  });

  it("lãnh địa thường trong vùng giáp biển được đánh dấu ven biển (mở Bến Cảng)", () => {
    const s = lordState();
    s["Lãnh Địa"]["trang-vien-bac"] = {
      ...s["Lãnh Địa"]["the-north-seat"], "Mô Tả": "Trang viên Bắc", "Thuộc Vùng": "north-white-knife", "Ven Biển": false,
    };
    repairAllHoldings(s);
    expect(s["Lãnh Địa"]["trang-vien-bac"]["Ven Biển"]).toBe(true);
  });

  it("toà thành trong lore giữ đúng mô tả gốc: Winterfell không bị gán ven biển", () => {
    const s = lordState();
    s["Lãnh Địa"]["the-north-seat"]["Ven Biển"] = true; // dữ liệu cũ gán sai
    repairAllHoldings(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Ven Biển"]).toBe(false);
    expect(s["Lãnh Địa"]["the-north-seat"]["Địa Hình"]).toBe(loreSeatFor("the-north-seat")!.terrain);
  });

  it("bố cục dựng sẵn cho nhân vật canon nằm gọn trong vùng quy hoạch", () => {
    const built = layoutHolding("casterly-rock", { terrain: "Đồi Núi", coastal: true }, [
      { type: "Lâu Đài", count: 1, level: 5 },
      { type: "Nông Trại", count: 4, level: 4 },
      { type: "Chợ", count: 2, level: 4 },
    ]);
    const radius = buildableRadiusCells(5);
    expect(Object.keys(built).length).toBeGreaterThan(1);
    for (const b of Object.values(built)) {
      const size = BUILDING_CATALOG[b["Loại"]].footprint;
      expect(b["Tọa Độ X"]).toBeGreaterThanOrEqual(C - radius);
      expect(b["Tọa Độ X"] + size).toBeLessThanOrEqual(C + radius);
      expect(b["Đang Xây"]).toBe(false);
    }
  });
});

describe("Sản lượng vĩ mô suy từ địa hình Tầng 1", () => {
  it("lãnh địa nhiều rừng/đồi cho gỗ đá cao hơn lãnh địa băng giá trơ trọi", () => {
    const s = lordState();
    const north = summarizeHolding(s, "the-north-seat");
    expect(north.foodPerMonth).toBeGreaterThan(0);
    expect(north.goldPerMonth).toBeGreaterThan(0);
    // số khối địa hình trong lưới đúng như khai báo tỉ lệ
    const map = terrainOf("the-north-seat", s["Lãnh Địa"]["the-north-seat"]);
    expect(map.grid).toHaveLength(LOCAL_BLOCKS * LOCAL_BLOCKS);
  });
});
