/**
 * Acceptance M8 (7.9.2b): ma trận binh chủng cho hệ số ĐÚNG HƯỚNG (test được):
 * giáo dài chấp kỵ binh, kỵ binh đè cung thủ trên đồng bằng, quân ô hợp đông
 * KHÔNG auto thắng quân tinh nhuệ ít, rule Lớp 4 binh chủng đặc biệt.
 */
import { describe, expect, it } from "vitest";
import { troopMatchup, fearlessMoraleFloor, compositionFromUnits, type MatchupSide } from "./troopMatchup";
import { MilitaryUnitSchema } from "../mvu/schema";

const side = (comp: Record<string, number>, training = 65, house?: string): MatchupSide => ({ composition: comp, training, house });

describe("Ma trận ưuKhuyếtBinhChủng (7.9.2b)", () => {
  it("Trường Thương CHẤP Kỵ Binh (tường giáo chặn ngựa)", () => {
    const spearVsCav = troopMatchup(side({ "Trường Thương": 1 }), side({ "Kỵ Binh": 1 }));
    const cavVsSpear = troopMatchup(side({ "Kỵ Binh": 1 }), side({ "Trường Thương": 1 }));
    expect(spearVsCav).toBeGreaterThan(1.0);
    expect(cavVsSpear).toBeLessThan(1.0);
    expect(spearVsCav).toBeGreaterThan(cavVsSpear);
  });

  it("Kỵ Binh ĐÈ Cung Thủ trên Đồng Bằng", () => {
    const cavVsArcher = troopMatchup(side({ "Kỵ Binh": 1 }), side({ "Cung Thủ": 1 }), { terrain: "Đồng Bằng" });
    expect(cavVsArcher).toBeGreaterThan(1.2);
    // cùng cặp nhưng Đầm Lầy → kỵ mất ưu thế
    const cavSwamp = troopMatchup(side({ "Kỵ Binh": 1 }), side({ "Cung Thủ": 1 }), { terrain: "Đầm Lầy" });
    expect(cavSwamp).toBeLessThan(cavVsArcher);
  });

  it("quân ô hợp KHÔNG auto thắng: chênh huấn luyện bóp hệ số khắc chế (Lớp 3)", () => {
    // cùng binh chủng, ta Rời Rạc (25) vs địch Tinh Nhuệ (85) → matchup < 1
    const rabble = troopMatchup(side({ "Bộ Binh": 1 }, 25), side({ "Bộ Binh": 1 }, 85));
    expect(rabble).toBeLessThan(1.0);
    // cùng huấn luyện → ~1.0
    const even = troopMatchup(side({ "Bộ Binh": 1 }, 65), side({ "Bộ Binh": 1 }, 65));
    expect(even).toBeCloseTo(1.0, 1);
  });

  it("clamp 0.7–1.3 (không bao giờ vượt biên)", () => {
    const extreme = troopMatchup(side({ "Kỵ Binh": 1 }, 90), side({ "Cung Thủ": 1 }, 20), { terrain: "Đồng Bằng" });
    expect(extreme).toBeLessThanOrEqual(1.3);
    const worst = troopMatchup(side({ "Cung Thủ": 1 }, 20), side({ "Kỵ Binh": 1 }, 90), { terrain: "Đồng Bằng" });
    expect(worst).toBeGreaterThanOrEqual(0.7);
  });

  it("phe hỗn hợp: gia quyền theo thành phần", () => {
    // 70% Trường Thương + 30% Cung vs 100% Kỵ → ưu thế nhờ giáo
    const mixed = troopMatchup(side({ "Trường Thương": 0.7, "Cung Thủ": 0.3 }), side({ "Kỵ Binh": 1 }));
    expect(mixed).toBeGreaterThan(1.0);
  });
});

describe("Rule Lớp 4 binh chủng đặc biệt (11.2b)", () => {
  it("Dothraki mạnh Đồng Bằng, VÔ DỤNG công thành", () => {
    const plains = troopMatchup(side({ "Kỵ Sĩ Dothraki": 1 }), side({ "Bộ Binh": 1 }), { terrain: "Đồng Bằng" });
    const siege = troopMatchup(side({ "Kỵ Sĩ Dothraki": 1 }), side({ "Bộ Binh": 1 }), { terrain: "Đồng Bằng", siege: true });
    expect(plains).toBeGreaterThan(siege); // công thành bóp Dothraki
  });

  it("Voi Chiến phá Kỵ Binh (ngựa sợ voi) — bonus riêng khi địch chủ yếu kỵ", () => {
    // Voi gặp Kỵ được +12% (Lớp 4) so với Kỵ Binh thường gặp Kỵ (không bonus)
    const voiVsCav = troopMatchup(side({ "Voi Chiến": 1 }), side({ "Kỵ Binh": 1 }));
    const cavVsCav = troopMatchup(side({ "Kỵ Binh": 1 }), side({ "Kỵ Binh": 1 }));
    expect(voiVsCav).toBeGreaterThan(cavVsCav);
  });

  it("Unsullied KHÔNG sụp sĩ khí (sàn Ổn Định)", () => {
    const unsullied = [MilitaryUnitSchema.parse({ "Số Lượng": 1000, "Loại Quân": "Unsullied", "Sĩ Khí": "Sắp Binh Biến" })];
    const normal = [MilitaryUnitSchema.parse({ "Số Lượng": 1000, "Loại Quân": "Bộ Binh", "Sĩ Khí": "Sắp Binh Biến" })];
    expect(fearlessMoraleFloor(unsullied, 15)).toBe(50); // nâng sàn
    expect(fearlessMoraleFloor(normal, 15)).toBe(15); // thường thì sụp
  });
});

describe("compositionFromUnits", () => {
  it("gộp nhiều đơn vị theo Số Lượng", () => {
    const units = [
      MilitaryUnitSchema.parse({ "Số Lượng": 6000, "Loại Quân": "Bộ Binh" }),
      MilitaryUnitSchema.parse({ "Số Lượng": 4000, "Loại Quân": "Kỵ Binh" }),
    ];
    const comp = compositionFromUnits(units);
    expect(comp["Bộ Binh"]).toBeCloseTo(0.6, 2);
    expect(comp["Kỵ Binh"]).toBeCloseTo(0.4, 2);
  });
});
