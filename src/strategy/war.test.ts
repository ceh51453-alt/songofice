/**
 * Acceptance M8 (12.1-12.2): tuyên chiến + War Score sau trận, vây thành chạy
 * hết turn → đổi chủ (test CÓ viện binh và KHÔNG viện binh).
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import {
  provinceControlStatus,
  seedRegionControl,
  regionController,
  strongholdController,
} from "../territory/territoryEngine";
import { canonicalSettlementPopulation } from "../territory/geographyRuntime";
import { strongholdsForProvince } from "../content/westeros/strongholds";
import {
  declareWar,
  adjustWarScore,
  warScoreForOutcome,
  startSiege,
  orderSiege,
  tickSiege,
  tickSiegeOrders,
  SIEGE_SETUP_DAYS,
} from "./war";
import { tickArmy } from "./army";

function starkLord(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  return StatDataSchema.parse(s);
}

describe("Tuyên chiến & War Score (12.1)", () => {
  it("declareWar đổi Trạng Thái; adjustWarScore cộng đúng", () => {
    const s = starkLord();
    let state = applyPatch(s, declareWar("lannister")).state;
    expect(state["Quan Hệ Ngoại Giao"]["lannister"]["Trạng Thái"]).toBe("Chiến Tranh");
    state = applyPatch(state, adjustWarScore("lannister", 12)).state;
    expect(state["Quan Hệ Ngoại Giao"]["lannister"]["War Score"]).toBe(12);
    // clamp trần 100
    state = applyPatch(state, adjustWarScore("lannister", 200)).state;
    expect(state["Quan Hệ Ngoại Giao"]["lannister"]["War Score"]).toBe(100);
  });

  it("warScoreForOutcome: thắng dương, bại âm", () => {
    expect(warScoreForOutcome("Đại Thắng")).toBeGreaterThan(0);
    expect(warScoreForOutcome("Bại")).toBeLessThan(0);
    expect(warScoreForOutcome("Giằng Co")).toBe(0);
  });
});

describe("Vây thành (12.2)", () => {
  it("KHÔNG viện binh: vây hết lương → vùng đổi chủ về phe vây + mở quản trị", () => {
    const s = starkLord();
    // quân người chơi mở vây Vùng Sông (Tully)
    let state = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Đại quân Bắc",
      value: { "Số Lượng": 8000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-riverlands" },
    }]).state;
    const siege = startSiege(state, "Đại quân Bắc", "the-riverlands");
    expect(siege.ok).toBe(true);
    state = applyPatch(state, siege.ops).state;
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Bị Vây");

    // chạy tới khi hết lương (SIEGE_FOOD_DAYS = 360 ngày = 12 tháng)
    for (let i = 0; i < 361; i++) tickSiege(state);
    expect(regionController(state, "the-riverlands")).toBe("stark"); // Stark là phe vây
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(true);
    expect(state["Lãnh Địa"]["the-riverlands-seat"]).toBeDefined(); // mở quản lý thành trì
    expect(state["Lãnh Địa"]["the-riverlands-seat"]["Dân Số"]).toBe(
      canonicalSettlementPopulation(
        "the-riverlands-seat",
        "Riverrun",
        "the-riverlands",
        "war-of-five-kings",
        20_000,
      ),
    );
    // War Score với Nhà thủ (Tully) tăng cho ta
    expect(state["Quan Hệ Ngoại Giao"]["tully"]["War Score"]).toBeGreaterThan(0);
  });

  it("CÓ viện binh: quân thủ tới vùng bị vây → phá vây, KHÔNG đổi chủ", () => {
    const s = starkLord();
    // giả lập ĐỊCH (lannister) vây Phương Bắc của người chơi
    let state = applyPatch(s, [
      { op: "replace", path: "stat_data.Chủ Quyền Lãnh Thổ.the-north.Tình Trạng", value: "Bị Vây" },
      {
        op: "replace", path: "stat_data.Chủ Quyền Lãnh Thổ.the-north._Vây",
        value: { "Phe Vây": "lannister", "Đơn Vị Vây": "Quân Lannister", "Ngày Đã Vây": 5, "Lương Còn": 2, "Ngày Vây Tối Đa": 20 },
      },
      // viện binh của ta đóng tại Phương Bắc
      {
        op: "replace", path: "stat_data.Biên Chế Quân Sự.Viện binh Bắc",
        value: { "Số Lượng": 5000, "Loại Quân": "Kỵ Binh", "Lãnh Địa Đồn Trú": "the-north" },
      },
    ]).state;

    tickSiege(state);
    // viện binh phá vây → về Ổn Định, KHÔNG mất Phương Bắc
    expect(state["Chủ Quyền Lãnh Thổ"]["the-north"]["Tình Trạng"]).toBe("Ổn Định");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-north"]["_Vây"]).toBeUndefined();
    expect(regionController(state, "the-north")).toBe("stark");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(true);
  });

  it("không thể tự vây lãnh thổ của mình", () => {
    const s = starkLord();
    const state = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Quân ta",
      value: { "Số Lượng": 1000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-north" },
    }]).state;
    expect(startSiege(state, "Quân ta", "the-north").ok).toBe(false);
  });

  it("ra lệnh từ xa: phải hành quân rồi dựng trại đủ ngày, không bật vây tức thời", () => {
    const s = starkLord();
    let state = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Đại quân hành vây",
      value: {
        "Số Lượng": 6000,
        "Loại Quân": "Bộ Binh",
        "Lãnh Địa Đồn Trú": "the-north",
        "Ngày Tập Hợp Còn Lại": 0,
        "Ngày Huấn Luyện": 0,
        "Lương Thực Mang Theo": 90,
      },
    }]).state;

    const order = orderSiege(state, "Đại quân hành vây", "the-riverlands");
    expect(order.ok).toBe(true);
    expect(order.marchDays).toBeGreaterThan(0);
    expect(order.setupDays).toBe(SIEGE_SETUP_DAYS);
    state = applyPatch(state, order.ops).state;
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["_Vây"]).toBeUndefined();
    expect(state["Biên Chế Quân Sự"]["Đại quân hành vây"]["Lệnh Vây Khi Đến"]).toBeTruthy();

    for (let day = 0; day < (order.daysToStart ?? 1) - 1; day += 1) {
      tickArmy(state);
      tickSiegeOrders(state);
    }
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["_Vây"]).toBeUndefined();
    tickArmy(state);
    tickSiegeOrders(state);
    expect(state["Biên Chế Quân Sự"]["Đại quân hành vây"]["Lãnh Địa Đồn Trú"]).toBe("the-riverlands");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Bị Vây");
  });

  it("vây một thành phụ chỉ đổi chủ thành đó, không lật cả province và sống qua save", () => {
    const s = starkLord();
    const target = strongholdsForProvince("the-riverlands", "war-of-five-kings")
      .find((site) => site.source === "strategic")!;
    let state = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Quân vây Trident",
      value: { "Số Lượng": 2200, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-riverlands" },
    }]).state;

    const siege = startSiege(state, "Quân vây Trident", target.id);
    expect(siege.ok).toBe(true);
    state = applyPatch(state, siege.ops).state;
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["_Vây"]?.["Thành Trì Mục Tiêu"]).toBe(target.id);
    for (let day = 0; day < 361; day += 1) tickSiege(state);

    expect(regionController(state, "the-riverlands")).toBe("tully");
    expect(strongholdController(state, target.id)).toBe("stark");
    expect(state["Lãnh Địa"][target.id]).toBeDefined();
    expect(provinceControlStatus(state, "the-riverlands", "tully").complete).toBe(false);

    const reloaded = StatDataSchema.parse(structuredClone(state));
    expect(strongholdController(reloaded, target.id)).toBe("stark");
    expect(reloaded["Lãnh Địa"][target.id]).toBeDefined();
  });
});
