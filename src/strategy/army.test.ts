/**
 * Acceptance M8 (11.2b/11.3/11.4/7.7): gate binh chủng theo Era, tuyển tại Doanh
 * Trại, di chuyển cập nhật vị trí theo turn, Lính Đánh Thuê roll đổi phe.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "../territory/territoryEngine";
import { availableTroopsForEra, recruitableTroopsForEra } from "../content/westeros/troopTypes";
import {
  recruitUnit, hasBarracks, moveArmy, tickArmy, armyMarkerPosition, calcMapDistance,
  distanceToTurns, checkSellswordDefection, sellswordWage,
} from "./army";

function lordWithBarracks(gold = 5000): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = gold;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true }); // → holding the-north-seat
  s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Doanh Trại"] = { "Loại": "Doanh Trại", "Cấp Độ": 1, "Đang Xây": false, "Turn Còn Lại": 0, "Tọa Độ X": 0, "Tọa Độ Y": 0, "Kích Thước": 1 };
  return StatDataSchema.parse(s);
}

describe("Gate binh chủng theo Era (11.2b)", () => {
  it("Rồng không ở Loạn Robert; Voi không trước Vũ Điệu Rồng (Aegon)", () => {
    expect(availableTroopsForEra("aegon-conquest")).toContain("Rồng");
    expect(availableTroopsForEra("aegon-conquest")).not.toContain("Voi Chiến");
    expect(availableTroopsForEra("roberts-rebellion")).not.toContain("Rồng");
    expect(availableTroopsForEra("roberts-rebellion")).toContain("Voi Chiến");
    // Unsullied chỉ từ AGOT (Ngũ Vương)
    expect(availableTroopsForEra("roberts-rebellion")).not.toContain("Unsullied");
    expect(availableTroopsForEra("war-of-five-kings")).toContain("Unsullied");
  });

  it("recruitable = binh chủng thường + Lính Đánh Thuê, giao với Era", () => {
    const rec = recruitableTroopsForEra("war-of-five-kings");
    expect(rec).toContain("Bộ Binh");
    expect(rec).toContain("Lính Đánh Thuê");
    expect(rec).not.toContain("Rồng"); // siêu nhiên không tuyển ở Doanh Trại
    expect(rec).not.toContain("Unsullied"); // đặc biệt, đến qua cốt truyện
  });
});

describe("Tuyển quân (11.3)", () => {
  it("tuyển tại lãnh địa có Doanh Trại → trừ Vàng/Lương + đơn vị đang huấn luyện", () => {
    const s = lordWithBarracks(5000);
    expect(hasBarracks(s, "the-north-seat")).toBe(true);
    const foodBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Lương Thực"];
    const r = recruitUnit(s, "the-north-seat", "Bộ Binh", 500);
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(5000 - 500); // 100/100 quân
    expect(state["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Lương Thực"]).toBe(foodBefore - 250);
    const unit = state["Biên Chế Quân Sự"][r.unitName!];
    expect(unit["Số Lượng"]).toBe(500);
    expect(unit["Turn Huấn Luyện"]).toBeGreaterThan(0); // chưa chiến đấu được
    expect(unit["Lãnh Địa Đồn Trú"]).toBe("the-north-seat");
  });

  it("không có Doanh Trại → chặn; binh chủng ngoài Era → chặn", () => {
    const s = lordWithBarracks();
    delete s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Doanh Trại"];
    expect(recruitUnit(s, "the-north-seat", "Bộ Binh", 100).ok).toBe(false);
    const s2 = lordWithBarracks();
    expect(recruitUnit(s2, "the-north-seat", "Rồng", 1).ok).toBe(false); // Rồng không tuyển được
  });

  it("vượt sức tuyển/turn → chặn", () => {
    const s = lordWithBarracks(999999);
    const cap = 1 * 800 + Math.floor(s["Lãnh Địa"]["the-north-seat"]["Dân Số"] / 25);
    expect(recruitUnit(s, "the-north-seat", "Bộ Binh", cap + 1).ok).toBe(false);
    expect(recruitUnit(s, "the-north-seat", "Bộ Binh", cap).ok).toBe(true);
  });
});

describe("Di chuyển trên bản đồ (11.4)", () => {
  it("moveArmy đặt đích + số turn theo khoảng cách px; tick cập nhật vị trí", () => {
    const s = lordWithBarracks();
    // đặt 1 đơn vị đóng ở the-north-seat
    const { state } = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Bộ binh Bắc",
      value: { "Số Lượng": 3000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-north-seat" },
    }]);
    const r = moveArmy(state, "Bộ binh Bắc", "the-riverlands");
    expect(r.ok).toBe(true);
    expect(r.turns).toBeGreaterThanOrEqual(1);
    const moved = applyPatch(state, r.ops).state;
    expect(moved["Biên Chế Quân Sự"]["Bộ binh Bắc"]["Đang Di Chuyển Đến"]).toBe("the-riverlands");

    // marker ở giữa đường khi mới đi 1 phần
    const midPos = armyMarkerPosition(moved["Biên Chế Quân Sự"]["Bộ binh Bắc"]);
    expect(midPos).not.toBeNull();

    // tick đủ số turn → tới nơi
    for (let i = 0; i < (r.turns ?? 0); i++) tickArmy(moved);
    expect(moved["Biên Chế Quân Sự"]["Bộ binh Bắc"]["Lãnh Địa Đồn Trú"]).toBe("the-riverlands");
    expect(moved["Biên Chế Quân Sự"]["Bộ binh Bắc"]["Đang Di Chuyển Đến"]).toBeFalsy();
  });

  it("distanceToTurns ≥ 1; calcMapDistance đối xứng", () => {
    expect(distanceToTurns(0)).toBe(1);
    expect(calcMapDistance("the-north", "dorne")).toBeCloseTo(calcMapDistance("dorne", "the-north"), 5);
  });
});

describe("Lính Đánh Thuê phản trắc (7.7)", () => {
  it("checkSellswordDefection: rng thấp → đổi phe, rng cao → ở lại", () => {
    expect(checkSellswordDefection(() => 0, 65)).toBe(true); // chắc chắn đổi
    expect(checkSellswordDefection(() => 0.99, 85)).toBe(false); // ở lại
    // sĩ khí thấp → xác suất cao hơn
    expect(checkSellswordDefection(() => 0.75, 10)).toBe(true);
  });

  it("wage chỉ tính cho Lính Đánh Thuê", () => {
    expect(sellswordWage({ "Số Lượng": 100, "Loại Quân": "Lính Đánh Thuê" } as never)).toBe(300);
    expect(sellswordWage({ "Số Lượng": 100, "Loại Quân": "Bộ Binh" } as never)).toBe(0);
  });

  it("tickArmy: hết Vàng trả lương → Lính Đánh Thuê roll rời bỏ", () => {
    const s = lordWithBarracks(0); // không đủ Vàng
    const { state } = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Golden Company",
      value: { "Số Lượng": 2000, "Loại Quân": "Lính Đánh Thuê", "Sĩ Khí": "Dao Động", "Lãnh Địa Đồn Trú": "the-north" },
    }]);
    // seed cố định → tái lập; chạy nhiều lần sẽ có lúc rời bỏ. Kiểm tra không crash + logic chạy.
    const before = state["Biên Chế Quân Sự"]["Golden Company"];
    expect(before).toBeDefined();
    tickArmy(state);
    // hoặc đã rời (bị xoá) hoặc còn — nhưng KHÔNG bị trừ lương (vì không đủ tiền)
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(0);
  });
});
