/**
 * Acceptance M7 (10.3): xây dựng qua hàng đợi turn + cộng hiệu ứng khi xong,
 * tài nguyên lãnh địa cập nhật mỗi turn. "xây 1 công trình chạy qua hàng đợi
 * turn và cộng đúng hiệu ứng khi xong; tài nguyên cập nhật đúng mỗi turn".
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl, captureRegionOps } from "./territoryEngine";
import {
  startConstruction, startDemolition, tickConstruction, tickTerritoryIncome,
  estimateTerritoryYield, demolitionDays, planningRadiusCells,
} from "./construction";
import { monthlyBudget } from "../economy/budget";
import { EXCHANGE_RATES } from "../economy/currency";
import { checkSpot } from "./localMap";
import type { LocalTerrainMap } from "./localTerrain";
import type { ResourceNode } from "../mvu/schema";

/** Ngân Khố lưu dạng Đồng Đỏ (1 Rồng Vàng = 11,760 Đồng Đỏ). */
const GOLD = EXCHANGE_RATES.GOLD_TO_COPPER;

function lordState(goldDragons = 500): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = goldDragons * GOLD; // quy ra Đồng Đỏ
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true }); // → holding the-north-seat (Tuyết, ven biển)
  return StatDataSchema.parse(s);
}

describe("startConstruction (10.3)", () => {
  it("đủ tài nguyên → trừ NGAY + xếp hàng đợi (Đang Xây)", () => {
    const s = lordState(500);
    const woodBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Gỗ"];
    const r = startConstruction(s, "the-north-seat", "Nông Trại");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    // Vàng trừ khỏi ngân khố thống nhất (Nông Trại = 150 Rồng Vàng = 150*GOLD Đồng Đỏ)
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(500 * GOLD - 150 * GOLD);
    // Gỗ trừ khỏi kho vùng
    expect(state["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Gỗ"]).toBe(woodBefore - 80);
    // vào hàng đợi
    const b = state["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"];
    expect(b["Đang Xây"]).toBe(true);
    expect(b["Ngày Xây Còn Lại"]).toBe(90); // 3 tháng × 30 ngày
  });

  it("thiếu tài nguyên → chặn, không tạo công trình", () => {
    const s = lordState(1); // 1 Rồng Vàng = 11,760 Đồng Đỏ — không đủ cho Chợ (300 Rồng Vàng)
    const r = startConstruction(s, "the-north-seat", "Chợ");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Thiếu");
  });

  it("Bến Cảng chỉ xây ở lãnh địa ven biển (10.2)", () => {
    const s = lordState(500);
    // Winterfell ở nội địa; chiếm White Knife mới có một province ven biển.
    const coastal = applyPatch(s, captureRegionOps(s, "north-white-knife", "stark", 1)).state;
    expect(startConstruction(coastal, "white-harbor", "Bến Cảng").ok).toBe(true);
    // chiếm the-riverlands (KHÔNG ven biển) → tạo holding ven biển=false
    const { state } = applyPatch(s, captureRegionOps(s, "the-riverlands", "stark", 1));
    const r = startConstruction(state, "the-riverlands-seat", "Bến Cảng");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("ven biển");
  });

  it("xây lại loại đã có = NÂNG CẤP (cấp tăng, chi phí ×cấp)", () => {
    let s = lordState(900); // đủ cho lv1 + lv2 Nông Trại (150 + 300 = 450 Rồng Vàng)
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Nông Trại").ops).state;
    // hoàn tất tức thì cho test nâng cấp
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;
    const r = startConstruction(s, "the-north-seat", "Nông Trại");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Cấp Độ"]).toBe(2);
  });
});

describe("tickConstruction — loop NGÀY (10.3)", () => {
  it("hạ Ngày Xây Còn Lại qua từng tick ngày → hoàn tất", () => {
    let s = lordState(500);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Nông Trại").ops).state;

    // Nông Trại = 3 tháng = 90 ngày
    tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Ngày Xây Còn Lại"]).toBe(89);
    for (let i = 0; i < 89; i++) tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"]).toBe(false);
  });

  it("phá dỡ là tiến độ theo ngày và chỉ xoá công trình khi hoàn tất", () => {
    let s = lordState(500);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Nông Trại").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;

    const order = startDemolition(s, "the-north-seat", "Nông Trại");
    expect(order.ok).toBe(true);
    s = applyPatch(s, order.ops).state;
    const days = demolitionDays("Nông Trại", 1);
    expect(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Ngày Phá Còn Lại"]).toBe(days);

    for (let i = 0; i < days - 1; i++) tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]).toBeTruthy();
    tickConstruction(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]).toBeUndefined();
  });

  it("trạm khai hoang mở rộng bán kính quy hoạch khi đã hoàn tất", () => {
    let s = lordState(500);
    const before = planningRadiusCells(s["Lãnh Địa"]["the-north-seat"]);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Trạm Khai Hoang").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Trạm Khai Hoang"]["Đang Xây"] = false;
    expect(planningRadiusCells(s["Lãnh Địa"]["the-north-seat"])).toBe(before + 75);
  });

  it("mỏ có thể bám mạch tài nguyên trên vách núi vốn không thể xây bình thường", () => {
    const cliffMap = {
      res: 192,
      kind: new Uint8Array(192 * 192).fill(7), // TERRAIN_ORDER[7] = Hẻm Núi
      dominant: "Hẻm Núi",
    } as LocalTerrainMap;
    const ironNode: ResourceNode = {
      "Mã": "cliff-iron", "Tài Nguyên": "Quặng Sắt", "Trữ Lượng": 2, "Còn Lại": 12_000,
      "Tọa Độ X": 700, "Tọa Độ Y": 700, "Kích Thước": 10, "Đã Khám Phá": true,
      "Công Trình": "", "Mô Tả": "Mạch sắt trong vách núi",
    };

    expect(checkSpot(cliffMap, "Mỏ Sắt", 692, 692, [], 700, [ironNode]).ok).toBe(true);
  });

  it("tickTerritoryIncome: tài nguyên tăng mỗi THÁNG (base + Nông Trại xong)", () => {
    let s = lordState(500);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Nông Trại").ops).state;
    // ép Nông Trại xong ngay
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;

    const foodBefore = s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Lương Thực"];
    tickTerritoryIncome(s);
    expect(s["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Lương Thực"] - foodBefore).toBeGreaterThanOrEqual(200);
  });

  // M18: tick lãnh địa chỉ lo VẬT TƯ; mọi dòng TIỀN (thuế, thu công trình, phí
  // bảo trì) chốt một lần duy nhất ở sổ thu chi — nếu không thì cộng hai lần.
  it("tick lãnh địa KHÔNG tự cộng Vàng — tiền chốt ở sổ thu chi", () => {
    let s = lordState(500);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Chợ").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Chợ"]["Đang Xây"] = false;
    const goldBefore = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    tickTerritoryIncome(s);
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(goldBefore);
  });

  it("Chợ đã xây xong hiện thành một dòng THU trong sổ thu chi", () => {
    let s = lordState(500);
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
    s["Lãnh Địa"]["the-north-seat"]["Người Kiểm Soát"] = "Robb Stark";
    const before = monthlyBudget(s).lines.find((l) => l.id === "inc-holdings");

    s = applyPatch(s, startConstruction(s, "the-north-seat", "Chợ").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Chợ"]["Đang Xây"] = false;

    const after = monthlyBudget(s);
    const shops = after.lines.find((l) => l.id === "inc-holdings");
    expect(shops).toBeTruthy();
    expect(shops!.amount).toBeGreaterThan(before?.amount ?? 0);
    // và thuế thân/địa tô luôn là một dòng thu riêng, đọc được từ sổ
    expect(after.lines.some((l) => l.id === "tax-land" && l.amount > 0)).toBe(true);
  });

  it("estimateTerritoryYield: gộp base + công trình cho UI Tổng Quan", () => {
    let s = lordState(500);
    s = applyPatch(s, startConstruction(s, "the-north-seat", "Nông Trại").ops).state;
    s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;
    const y = estimateTerritoryYield(s["Lãnh Địa"]["the-north-seat"], "the-north-seat");
    expect(y["Lương Thực"]).toBeGreaterThanOrEqual(200);
    // dòng Ngân Khố của một lãnh địa = thuế thu trên đất này + thu công trình
    // − phí bảo trì. Đây là số HIỂN THỊ, không được cộng lại vào ngân khố.
    expect(y["Ngân Khố"]).toBeGreaterThan(0);
  });
});
