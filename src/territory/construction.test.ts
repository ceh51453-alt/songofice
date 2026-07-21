/**
 * Acceptance M7 (10.3): xây dựng qua hàng đợi turn + cộng hiệu ứng khi xong,
 * tài nguyên lãnh địa cập nhật mỗi turn. "xây 1 công trình chạy qua hàng đợi
 * turn và cộng đúng hiệu ứng khi xong; tài nguyên cập nhật đúng mỗi turn".
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl, captureRegionOps } from "./territoryEngine";
import { startConstruction, tickConstruction, estimateTerritoryYield } from "./construction";

function lordState(gold = 5000): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Vàng"] = gold;
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true }); // → holding the-north (Tuyết, ven biển)
  return StatDataSchema.parse(s);
}

describe("startConstruction (10.3)", () => {
  it("đủ tài nguyên → trừ NGAY + xếp hàng đợi (Đang Xây)", () => {
    const s = lordState(5000);
    const woodBefore = s["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Gỗ"];
    const r = startConstruction(s, "the-north", "Nông Trại");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    // Vàng trừ khỏi ngân khố thống nhất (15 note)
    expect(state["Thông Tin Nhân Vật"]["Vàng"]).toBe(5000 - 150);
    // Gỗ trừ khỏi kho vùng
    expect(state["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Gỗ"]).toBe(woodBefore - 80);
    // vào hàng đợi
    const b = state["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"];
    expect(b["Đang Xây"]).toBe(true);
    expect(b["Turn Còn Lại"]).toBe(3);
  });

  it("thiếu tài nguyên → chặn, không tạo công trình", () => {
    const s = lordState(10); // không đủ Vàng
    const r = startConstruction(s, "the-north", "Chợ");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Thiếu");
  });

  it("Bến Cảng chỉ xây ở lãnh địa ven biển (10.2)", () => {
    const s = lordState(5000);
    // the-north ven biển → ok
    expect(startConstruction(s, "the-north", "Bến Cảng").ok).toBe(true);
    // chiếm the-riverlands (KHÔNG ven biển) → tạo holding ven biển=false
    const { state } = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 1));
    const r = startConstruction(state, "the-riverlands", "Bến Cảng");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("ven biển");
  });

  it("xây lại loại đã có = NÂNG CẤP (cấp tăng, chi phí ×cấp)", () => {
    let s = lordState(9000);
    s = applyPatch(s, startConstruction(s, "the-north", "Nông Trại").ops).state;
    // hoàn tất tức thì cho test nâng cấp
    s["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;
    const r = startConstruction(s, "the-north", "Nông Trại");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"]["Cấp Độ"]).toBe(2);
  });
});

describe("tickConstruction — turn-advance loop (10.3)", () => {
  it("hạ Turn Còn Lại qua từng tick → hoàn tất → cộng thu", () => {
    let s = lordState(5000);
    s = applyPatch(s, startConstruction(s, "the-north", "Nông Trại").ops).state;
    const foodStart = s["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Lương Thực"];

    // tick 3 lần → hoàn tất
    tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"]["Turn Còn Lại"]).toBe(2);
    tickConstruction(s);
    tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"]["Đang Xây"]).toBe(false);

    // tài nguyên tăng mỗi turn (base + sau khi xong thêm 200 Lương Thực/turn)
    expect(s["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Lương Thực"]).toBeGreaterThan(foodStart);
    // 1 tick nữa: Nông Trại đã xong → +≥200 lương thực
    const foodBefore = s["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Lương Thực"];
    tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north"]["Tài Nguyên"]["Lương Thực"] - foodBefore).toBeGreaterThanOrEqual(200);
  });

  it("thu Vàng vào ngân khố thống nhất mỗi turn (Chợ + thuế nền)", () => {
    let s = lordState(5000);
    s = applyPatch(s, startConstruction(s, "the-north", "Chợ").ops).state;
    // ép Chợ xong ngay
    s["Lãnh Địa"]["the-north"]["Công Trình"]["Chợ"]["Đang Xây"] = false;
    const goldBefore = s["Thông Tin Nhân Vật"]["Vàng"];
    tickConstruction(s);
    // Chợ +120 + thuế nền dương → ngân khố tăng
    expect(s["Thông Tin Nhân Vật"]["Vàng"]).toBeGreaterThan(goldBefore + 120 - 1);
  });

  it("estimateTerritoryYield: gộp base + công trình cho UI Tổng Quan", () => {
    let s = lordState(5000);
    s = applyPatch(s, startConstruction(s, "the-north", "Nông Trại").ops).state;
    s["Lãnh Địa"]["the-north"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;
    const y = estimateTerritoryYield(s["Lãnh Địa"]["the-north"]);
    expect(y["Lương Thực"]).toBeGreaterThanOrEqual(200);
    expect(y["Vàng"]).toBeGreaterThan(0);
  });
});
