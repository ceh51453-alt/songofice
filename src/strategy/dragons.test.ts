/**
 * Acceptance M19 — rồng là binh chủng RIÊNG: một nguồn dữ liệu duy nhất
 * (stat_data.Rồng) cho cả bảng Quân Sự lẫn thanh trạng thái, di trú save cũ
 * khỏi biên chế bộ binh, lớn theo tuổi, đói theo tháng, bay mất ngày.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, TerritorySchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import {
  newDragon, playerDragons, battleReadyDragons, dragonSummary, migrateDragonUnits,
  sizeForAge, wingspanOf, monthlyRation, tickDragonsDaily, tickDragonsMonthly, flyDragon,
  feedDragon, dragonFlightDays, attemptDragonTaming, canRiderTameDragon, DRAGON_TAMING_THRESHOLD,
} from "./dragons";
import { seedRegionControl } from "../territory/territoryEngine";

function targaryen(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Aegon Targaryen";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Targaryen";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
  s["Cài Đặt Ván"]["Thời Kỳ"] = "aegon-conquest";
  seedRegionControl(s, "aegon-conquest", { createIfMissing: true });
  const parsed = StatDataSchema.parse(s);
  // bảo đảm có ít nhất một lãnh địa có kho lương để rồng ăn
  if (Object.keys(parsed["Lãnh Địa"]).length === 0) {
    parsed["Lãnh Địa"]["the-crownlands"] = TerritorySchema.parse({ "Nhà Kiểm Soát": "targaryen" });
  }
  return parsed;
}

describe("Rồng tách khỏi biên chế bộ binh (M19)", () => {
  it("thuần phục cần liên kết cao và một kỵ sĩ chỉ có một rồng, trừ Người Xuyên Không", () => {
    const s = targaryen();
    s["Rồng"]["Balerion"] = newDragon({
      "Tên": "Balerion", "Kỵ Sĩ": "Aegon Targaryen", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 95,
    });
    s["Rồng"]["Meraxes"] = newDragon({ "Tên": "Meraxes", "Mức Độ Thuần Hóa": 98, "Độ Hảo Cảm": { "Aegon Targaryen": 98 } });

    expect(canRiderTameDragon(s, "Aegon Targaryen", "Meraxes").ok).toBe(false);
    expect(attemptDragonTaming(s, "Meraxes", "Aegon Targaryen", { narrative: "Aegon kiên nhẫn đặt những con dê trước hang, lùi xa khỏi mùi lửa và quay lại nhiều ngày liền để Meraxes nhận ra giọng nói cùng sự hiện diện của mình.", method: "feeding" }, 0).ok).toBe(false);

    s["Cài Đặt Ván"]["Đặc Quyền Đa Kỵ Sĩ"] = true;
    const attempt = attemptDragonTaming(s, "Meraxes", "Aegon Targaryen", { narrative: "Aegon kiên nhẫn đặt những con dê trước hang, lùi xa khỏi mùi lửa và quay lại nhiều ngày liền để Meraxes nhận ra giọng nói cùng sự hiện diện của mình.", method: "feeding" }, 0);
    expect(attempt.ok).toBe(true);
    expect(attempt.tamed).toBe(true);
    expect(attempt.progress).toBeGreaterThanOrEqual(DRAGON_TAMING_THRESHOLD);
    const claimed = applyPatch(s, attempt.ops).state;
    expect(claimed["Rồng"]["Meraxes"]["Kỵ Sĩ"]).toBe("Aegon Targaryen");
  });

  it("cảm hóa phải có diễn biến, tỉ lệ thấp và thời gian chờ — AI không thể spam lệnh", () => {
    const s = targaryen();
    s["Rồng"]["Silverwing"] = newDragon({
      "Tên": "Silverwing", "Mức Độ Thuần Hóa": 50, "Độ Hảo Cảm": { "Aegon Targaryen": 50 },
    });
    expect(attemptDragonTaming(s, "Silverwing", "Aegon Targaryen", { method: "feeding", narrative: "quá ngắn" }, 0).ok).toBe(false);

    const context = {
      method: "feeding",
      narrative: "Aegon mang dê tươi đến mép hang trong nhiều buổi chiều, luôn để lại khoảng cách an toàn và rút lui khi Silverwing gầm lên, để nó tự chọn lúc đến gần và nhận mùi của chàng.",
    };
    const first = attemptDragonTaming(s, "Silverwing", "Aegon Targaryen", context, 0);
    expect(first.ok).toBe(true);
    expect(first.chance).toBeLessThanOrEqual(45);

    const after = applyPatch(s, first.ops).state;
    expect(attemptDragonTaming(after, "Silverwing", "Aegon Targaryen", context, 0).error).toContain("lắng dịu");
  });

  it("patch trực tiếp không thể gán hai rồng cho cùng một người nếu không có đặc quyền", () => {
    const s = targaryen();
    s["Rồng"]["Balerion"] = newDragon({ "Tên": "Balerion", "Kỵ Sĩ": "Aegon", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 95 });
    s["Rồng"]["Meraxes"] = newDragon({ "Tên": "Meraxes", "Kỵ Sĩ": "Aegon", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 95 });
    const { state, warnings } = applyPatch(s, []);
    expect(state["Rồng"]["Balerion"]["Kỵ Sĩ"]).toBe("Aegon");
    expect(state["Rồng"]["Meraxes"]["Kỵ Sĩ"]).toBeUndefined();
    expect(warnings.some((warning) => warning.reason.includes("chỉ Người Xuyên Không"))).toBe(true);
  });

  it("save cũ nhét rồng vào Biên Chế → migrate về bảng Rồng, không đếm hai lần", () => {
    const s = targaryen();
    const withOld = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Balerion",
      value: {
        "Tướng Chỉ Huy": "Aegon Targaryen", "Nhà": "targaryen", "Số Lượng": 1,
        "Loại Quân": "Rồng", "Lãnh Địa Đồn Trú": "the-crownlands",
      },
    }]).state;

    const moved = migrateDragonUnits(withOld);
    expect(moved).toBe(1);
    expect(withOld["Biên Chế Quân Sự"]["Balerion"]).toBeUndefined();
    expect(withOld["Rồng"]["Balerion"]).toBeDefined();
    expect(withOld["Rồng"]["Balerion"]["Đồn Trú"]).toBe("the-crownlands");
    expect(withOld["Rồng"]["Balerion"]["Kỵ Sĩ"]).toBe("Aegon Targaryen");
  });

  it("bảng Quân Sự và thanh trạng thái đọc CÙNG một danh sách", () => {
    const s = targaryen();
    s["Rồng"]["Balerion"] = newDragon({
      "Tên": "Balerion", "Kích Cỡ": "Khổng Lồ (Balerion-class)", "Kỵ Sĩ": "Aegon Targaryen",
      "Nhà": "targaryen", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 90,
    });
    const list = playerDragons(s);
    expect(list).toHaveLength(1);
    expect(list[0][0]).toBe("Balerion");
    expect(dragonSummary(s)).toEqual({ total: 1, ready: 1, wounded: 0 });
  });

  it("rồng bị xích / đang dưỡng thương không tính là sẵn sàng ra trận", () => {
    const s = targaryen();
    s["Rồng"]["Xích"] = newDragon({ "Tên": "Xích", "Nhà": "targaryen", "Kỵ Sĩ": "A", "Đang Bị Xích": true });
    s["Rồng"]["Thương"] = newDragon({
      "Tên": "Thương", "Nhà": "targaryen", "Kỵ Sĩ": "B",
      "Tình Trạng": "Đang Hồi Phục", "Ngày Hồi Phục Còn Lại": 40, "Vết Thương": ["cánh trái rách"],
    });
    s["Rồng"]["Khoẻ"] = newDragon({ "Tên": "Khoẻ", "Nhà": "targaryen", "Kỵ Sĩ": "C" });
    expect(battleReadyDragons(s).map((d) => d["Tên"])).toEqual(["Khoẻ"]);
    expect(dragonSummary(s).total).toBe(3);
    expect(dragonSummary(s).ready).toBe(1);
  });
});

describe("Vòng đời rồng (M19)", () => {
  it("kích cỡ đi theo TUỔI, không phải nút bấm", () => {
    expect(sizeForAge(0)).toBe("Mới Nở");
    expect(sizeForAge(5)).toBe("Ấu Long");
    expect(sizeForAge(8)).toBe("Non");
    expect(sizeForAge(30)).toBe("Trưởng Thành");
    expect(sizeForAge(75)).toBe("Cổ Long");
    expect(sizeForAge(120)).toBe("Khổng Lồ (Balerion-class)");
  });

  it("rồng lớn thì sải cánh rộng hơn và ăn nhiều hơn", () => {
    const young = newDragon({ "Kích Cỡ": "Non", "Tuổi": 2 });
    const huge = newDragon({ "Kích Cỡ": "Khổng Lồ (Balerion-class)", "Tuổi": 120 });
    expect(wingspanOf(huge)).toBeGreaterThan(wingspanOf(young));
    expect(monthlyRation(huge)).toBeGreaterThan(monthlyRation(young));
  });

  it("trứng nứt vỏ sẽ nở thành rồng con và giữ số đầu cùng năng lực", () => {
    const s = targaryen();
    s["Trứng Rồng"]["Tam Lôi"] = {
      "Tên": "Tam Lôi", "Màu Sắc": "Bạc", "Nhiệt Độ": "Nóng Rực", "Tình Trạng": "Nứt Vỏ",
      "Chủ Nhân": "Aegon Targaryen", "Nơi Ấp": "dragonstone", "Tiến Độ Ấp": 98, "Số Ngày Ấp": 3,
      "Số Đầu Dự Kiến": 3, "Năng Lực Dự Kiến": "Lôi Tức", "Mô Tả": "Vỏ rung lên theo từng nhịp sét.",
    };
    tickDragonsDaily(s);
    expect(s["Trứng Rồng"]["Tam Lôi"]).toBeUndefined();
    expect(s["Rồng"]["Tam Lôi"]).toMatchObject({
      "Kích Cỡ": "Mới Nở", "Số Đầu": 3, "Năng Lực Đặc Biệt": "Lôi Tức", "Sẵn Sàng Chiến Đấu": false,
    });
  });

  it("mỗi tháng rồng ăn từ kho lãnh địa; kho cạn thì đói và quên lời kỵ sĩ", () => {
    const s = targaryen();
    const home = Object.keys(s["Lãnh Địa"])[0];
    s["Rồng"]["Vhagar"] = newDragon({
      "Tên": "Vhagar", "Kích Cỡ": "Trưởng Thành", "Nhà": "targaryen", "Kỵ Sĩ": "A",
      "Đồn Trú": home, "Độ Đói": 60, "Mức Độ Thuần Hóa": 80,
    });
    const need = s["Rồng"]["Vhagar"]["_Khẩu Phần Tháng"];
    s["Lãnh Địa"][home]["Tài Nguyên"]["Lương Thực"] = need + 100;
    tickDragonsMonthly(s);
    expect(s["Rồng"]["Vhagar"]["Độ Đói"]).toBeLessThan(60);
    expect(s["Lãnh Địa"][home]["Tài Nguyên"]["Lương Thực"]).toBe(100);

    // kho cạn → đói tăng, thuần hoá tụt
    s["Lãnh Địa"][home]["Tài Nguyên"]["Lương Thực"] = 0;
    const tameBefore = s["Rồng"]["Vhagar"]["Mức Độ Thuần Hóa"];
    for (let i = 0; i < 4; i++) tickDragonsMonthly(s);
    expect(s["Rồng"]["Vhagar"]["Độ Đói"]).toBeGreaterThan(60);
    expect(s["Rồng"]["Vhagar"]["Mức Độ Thuần Hóa"]).toBeLessThan(tameBefore);
  });

  it("rồng bay mất NGÀY, không dịch chuyển tức thì", () => {
    const s = targaryen();
    s["Rồng"]["Meraxes"] = newDragon({
      "Tên": "Meraxes", "Nhà": "targaryen", "Kỵ Sĩ": "Rhaenys", "Đồn Trú": "the-crownlands",
    });
    expect(dragonFlightDays("the-north", "dorne")).toBeGreaterThan(0);
    const r = flyDragon(s, "Meraxes", "the-north");
    expect(r.ok).toBe(true);
    const state = applyPatch(s, r.ops).state;
    expect(state["Rồng"]["Meraxes"]["Đang Bay Đến"]).toBe("the-north");

    const days = state["Rồng"]["Meraxes"]["Ngày Bay Còn Lại"];
    for (let i = 0; i < days; i++) tickDragonsDaily(state);
    expect(state["Rồng"]["Meraxes"]["Đồn Trú"]).toBe("the-north");
    expect(state["Rồng"]["Meraxes"]["Đang Bay Đến"]).toBeFalsy();
  });

  it("rồng bị xích không bay được", () => {
    const s = targaryen();
    s["Rồng"]["Xích"] = newDragon({ "Tên": "Xích", "Nhà": "targaryen", "Đang Bị Xích": true });
    expect(flyDragon(s, "Xích", "the-north").ok).toBe(false);
  });

  it("cho ăn: trừ lương kho, hết đói, kỵ sĩ được thêm hảo cảm", () => {
    const s = targaryen();
    const home = Object.keys(s["Lãnh Địa"])[0];
    s["Rồng"]["Caraxes"] = newDragon({
      "Tên": "Caraxes", "Nhà": "targaryen", "Kỵ Sĩ": "Daemon", "Đồn Trú": home, "Độ Đói": 90,
    });
    s["Lãnh Địa"][home]["Tài Nguyên"]["Lương Thực"] = 1000;
    const r = feedDragon(s, "Caraxes", home);
    expect(r.ok).toBe(true);
    const state = applyPatch(s, r.ops).state;
    expect(state["Rồng"]["Caraxes"]["Độ Đói"]).toBe(0);
    expect(state["Lãnh Địa"][home]["Tài Nguyên"]["Lương Thực"]).toBeLessThan(1000);
    expect(state["Rồng"]["Caraxes"]["Độ Hảo Cảm"]["Daemon"]).toBeGreaterThan(0);
  });
});
