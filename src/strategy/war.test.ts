/**
 * Acceptance M8 (12.1-12.2): tuyên chiến + War Score sau trận, vây thành chạy
 * hết turn → đổi chủ (test CÓ viện binh và KHÔNG viện binh).
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl, regionController } from "../territory/territoryEngine";
import { declareWar, adjustWarScore, warScoreForOutcome, startSiege, tickSiege } from "./war";

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
      value: { "Số Lượng": 8000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-north" },
    }]).state;
    const siege = startSiege(state, "Đại quân Bắc", "the-riverlands");
    expect(siege.ok).toBe(true);
    state = applyPatch(state, siege.ops).state;
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Bị Vây");

    // chạy turn tới khi hết lương (SIEGE_FOOD_TURNS=12)
    for (let i = 0; i < 13; i++) tickSiege(state);
    expect(regionController(state, "the-riverlands")).toBe("stark"); // thất thủ → về tay ta
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(true);
    expect(state["Lãnh Địa"]["the-riverlands"]).toBeDefined(); // mở quản trị (10.1)
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
        value: { "Phe Vây": "lannister", "Đơn Vị Vây": "Quân Lannister", "Turn Đã Vây": 5, "Lương Còn": 2, "Turn Tối Đa": 20 },
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
});
