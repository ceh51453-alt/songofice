/**
 * Acceptance M9 (7.7): tướng "Phản Trắc" + Trung Thành thấp trigger được sự kiện
 * làm phản (mang quân bỏ đi); tướng địch bị bắt → làm con tin (Tù Binh).
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, GeneralSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { checkBetrayal, tickBetrayal, captiveOpsFromGeneral, BETRAY_LOYALTY_THRESHOLD } from "./betrayal";

const traitor = (loyalty: number) => GeneralSchema.parse({ "Chỉ Số Thống Soái": 70, "Đặc Tính": ["Phản Trắc"], "Trung Thành": loyalty });
const loyalGen = GeneralSchema.parse({ "Chỉ Số Thống Soái": 70, "Đặc Tính": ["Được Lính Sùng Bái"], "Trung Thành": -80 });

describe("Phản trắc (7.7)", () => {
  it("checkBetrayal: chỉ khi có Phản Trắc + Trung Thành < ngưỡng", () => {
    // trung thành cao → không phản dù roll thấp
    expect(checkBetrayal(() => 0, traitor(50))).toBe(false);
    // Phản Trắc + trung thành rất thấp + roll thấp → phản
    expect(checkBetrayal(() => 0, traitor(-90))).toBe(true);
    // không có đặc tính Phản Trắc → không bao giờ phản
    expect(checkBetrayal(() => 0, loyalGen)).toBe(false);
    // ngay ngưỡng thì chưa (≥ threshold)
    expect(checkBetrayal(() => 0, traitor(BETRAY_LOYALTY_THRESHOLD))).toBe(false);
    // roll cao → không phản dù đủ điều kiện
    expect(checkBetrayal(() => 0.99, traitor(-100))).toBe(false);
  });

  it("tickBetrayal: tướng phản mang quân bỏ đi (seed cố định → tái lập)", () => {
    const s = makeDefaultState();
    s["_engineMeta"]["_Seed Gốc"] = 12345;
    s["_engineMeta"]["_Nhịp"] = 3;
    (s["Tướng Lĩnh"] as Record<string, unknown>)["Roose Bolton"] = traitor(-95);
    (s["Biên Chế Quân Sự"] as Record<string, unknown>)["Quân Bolton"] = { "Số Lượng": 4000, "Loại Quân": "Bộ Binh", "Tướng Chỉ Huy": "Roose Bolton" };
    (s["Biên Chế Quân Sự"] as Record<string, unknown>)["Quân trung thành"] = { "Số Lượng": 3000, "Loại Quân": "Kỵ Binh", "Tướng Chỉ Huy": "Khác" };
    const state: StatData = StatDataSchema.parse(s);

    // chạy nhiều turn (mỗi turn 1 roll) — với trung thành -95, xác suất ~0.47/turn
    let betrayed = false;
    for (let t = 0; t < 30 && !betrayed; t++) {
      state["_engineMeta"]["_Nhịp"] = t;
      tickBetrayal(state);
      if (!state["Tướng Lĩnh"]["Roose Bolton"]) betrayed = true;
    }
    expect(betrayed).toBe(true);
    // quân do hắn chỉ huy bỏ đi; quân khác còn nguyên
    expect(state["Biên Chế Quân Sự"]["Quân Bolton"]).toBeUndefined();
    expect(state["Biên Chế Quân Sự"]["Quân trung thành"]).toBeDefined();
  });

  it("tướng trung thành cao KHÔNG bao giờ phản qua tickBetrayal", () => {
    const s = makeDefaultState();
    (s["Tướng Lĩnh"] as Record<string, unknown>)["Ser Trung Nghĩa"] = traitor(80); // Phản Trắc nhưng trung thành cao
    const state = StatDataSchema.parse(s);
    for (let t = 0; t < 50; t++) { state["_engineMeta"]["_Nhịp"] = t; tickBetrayal(state); }
    expect(state["Tướng Lĩnh"]["Ser Trung Nghĩa"]).toBeDefined();
  });
});

describe("Con tin (7.7)", () => {
  it("tướng địch bị bắt → tạo Tù Binh với giá chuộc theo Thống Soái", () => {
    const s = StatDataSchema.parse(makeDefaultState());
    const ops = captiveOpsFromGeneral("Ser Amory Lorch", GeneralSchema.parse({ "Chỉ Số Thống Soái": 60 }), "stark", 8);
    const { state } = applyPatch(s, ops);
    const captive = state["Tù Binh"]["Ser Amory Lorch"];
    expect(captive).toBeDefined();
    expect(captive["Bị Bắt Bởi"]).toBe("stark");
    expect(captive["Vai Trò"]).toBe("Tướng");
    expect(captive["Giá Chuộc"]).toBeGreaterThan(0);
    expect(captive["_Ngày Bắt"]).toBe(8);
  });
});
