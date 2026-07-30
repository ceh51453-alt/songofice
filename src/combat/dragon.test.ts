/**
 * Acceptance M9 (7.15): rồng cho hệ số phi đối xứng; rồng Bị Thương/Kiệt Sức
 * mất phần lớn hệ số; đốt cổng thành; rồng-đối-rồng có cửa hạ (xác suất ≠ 0).
 */
import { describe, expect, it } from "vitest";
import { DragonSchema } from "../mvu/schema";
import { dragonSideFactor, dragonBurnsGate, resolveDragonDuel, dragonDuelPower } from "./dragon";
import { makeRng } from "../probability/rng";

/** Rồng CÓ KỴ SĨ — con rồng thật sự ra trận dưới cờ ta (M19). */
const dragon = (size: "Non" | "Trưởng Thành" | "Khổng Lồ (Balerion-class)", status: "Khỏe" | "Bị Thương" | "Kiệt Sức" = "Khỏe") =>
  DragonSchema.parse({
    "Tên": "Balerion", "Kích Cỡ": size, "Tình Trạng": status,
    "Kỵ Sĩ": "Aegon", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 85,
  });

/** Rồng hoang không ai cưỡi — vẫn là rồng, nhưng không đánh giúp ai. */
const wildDragon = (size: "Khổng Lồ (Balerion-class)") =>
  DragonSchema.parse({ "Tên": "Cannibal", "Kích Cỡ": size, "Tình Trạng": "Khỏe" });

describe("Hệ số rồng (7.15)", () => {
  it("không rồng → 1.0; rồng lớn khoẻ → hệ số cao", () => {
    expect(dragonSideFactor([])).toBe(1.0);
    const huge = dragonSideFactor([dragon("Khổng Lồ (Balerion-class)")]);
    expect(huge).toBeGreaterThan(1.5);
    // rồng non yếu hơn rồng khổng lồ
    expect(dragonSideFactor([dragon("Non")])).toBeLessThan(huge);
  });

  it("M19: rồng hoang chưa thuần yếu hơn hẳn rồng có kỵ sĩ (cùng kích cỡ)", () => {
    const ridden = dragonSideFactor([dragon("Khổng Lồ (Balerion-class)")]);
    const wild = dragonSideFactor([wildDragon("Khổng Lồ (Balerion-class)")]);
    expect(wild).toBeLessThan(ridden);
    expect(wild).toBeGreaterThan(1.0); // vẫn là một con rồng
  });

  it("M19: chỉ số rồng đẩy hệ số lên — Sức Lửa 18 mạnh hơn Sức Lửa 5", () => {
    const weak = DragonSchema.parse({
      "Tên": "Yếu", "Kích Cỡ": "Trưởng Thành", "Kỵ Sĩ": "A", "Mức Độ Thuần Hóa": 85,
      "Chỉ Số": { "Sức Lửa": 5, "Sức Bay": 5, "Giáp Vảy": 3, "Hung Dữ": 5, "Trung Thành": 5 },
    });
    const strong = DragonSchema.parse({
      "Tên": "Mạnh", "Kích Cỡ": "Trưởng Thành", "Kỵ Sĩ": "B", "Mức Độ Thuần Hóa": 85,
      "Chỉ Số": { "Sức Lửa": 18, "Sức Bay": 16, "Giáp Vảy": 15, "Hung Dữ": 17, "Trung Thành": 12 },
    });
    expect(dragonSideFactor([strong])).toBeGreaterThan(dragonSideFactor([weak]));
  });

  it("M19: rồng bị xích không cộng chiến lực", () => {
    const chained = DragonSchema.parse({
      "Tên": "Xích", "Kích Cỡ": "Khổng Lồ (Balerion-class)", "Kỵ Sĩ": "A",
      "Mức Độ Thuần Hóa": 85, "Đang Bị Xích": true,
    });
    expect(dragonSideFactor([chained])).toBe(1.0);
    expect(dragonBurnsGate([chained])).toBe(false);
  });

  it("rồng Bị Thương/Kiệt Sức MẤT phần lớn hệ số → cửa cho phe yếu", () => {
    const healthy = dragonSideFactor([dragon("Trưởng Thành", "Khỏe")]);
    const wounded = dragonSideFactor([dragon("Trưởng Thành", "Bị Thương")]);
    const exhausted = dragonSideFactor([dragon("Trưởng Thành", "Kiệt Sức")]);
    expect(wounded).toBeLessThan(healthy);
    expect(exhausted).toBeLessThan(wounded);
  });

  it("rồng khoẻ đủ lớn → đốt cổng thành (bỏ qua tường thành)", () => {
    expect(dragonBurnsGate([dragon("Trưởng Thành", "Khỏe")])).toBe(true);
    expect(dragonBurnsGate([dragon("Non", "Khỏe")])).toBe(false); // rồng non không đốt cổng
    expect(dragonBurnsGate([dragon("Khổng Lồ (Balerion-class)", "Bị Thương")])).toBe(false); // bị thương không đốt
  });
});

describe("Rồng đối rồng (7.15)", () => {
  it("chỉ khi CẢ 2 phe có rồng; xác suất hạ ≠ 0 (cửa bất ngờ)", () => {
    const p = [{ name: "Balerion", power: dragonDuelPower(dragon("Khổng Lồ (Balerion-class)")) }];
    const e = [{ name: "Meraxes", power: dragonDuelPower(dragon("Trưởng Thành")) }];
    // 1 phe không có rồng → không duel
    expect(resolveDragonDuel(makeRng(1), p, []).enemyDown).toHaveLength(0);
    // quét nhiều seed: rồng yếu hơn (Meraxes) đôi khi bị hạ
    let meraxesDownCount = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const r = resolveDragonDuel(makeRng(seed), p, e);
      if (r.enemyDown.includes("Meraxes")) meraxesDownCount++;
    }
    expect(meraxesDownCount).toBeGreaterThan(0); // có cửa hạ (≠ 0)
    expect(meraxesDownCount).toBeLessThan(200); // nhưng không phải luôn luôn
  });

  it("cùng seed → cùng kết quả duel (tái lập)", () => {
    const p = [{ name: "A", power: 1 }];
    const e = [{ name: "B", power: 1 }];
    const a = resolveDragonDuel(makeRng(42), p, e);
    const b = resolveDragonDuel(makeRng(42), p, e);
    expect(a).toEqual(b);
  });
});
