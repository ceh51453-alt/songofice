import { describe, expect, it } from "vitest";
import { TerritorySchema } from "../mvu/schema";
import { makeHolding } from "./territoryEngine";
import { applyDemography, projectDemography } from "./population";

function holding(population = 10_000) {
  return TerritorySchema.parse(makeHolding({ danSo: population, regionId: "the-reach" }));
}

describe("sổ hộ tịch lãnh địa", () => {
  it("đất đủ nhà, thức ăn và việc làm sẽ hút thêm dân", () => {
    const h = holding();
    h["Nhà Ở Sẵn Có"] = 20_000;
    h["Lòng Dân"] = 90;
    h["Công Trình"]["Doanh Trại Lớn"] = {
      "Loại": "Doanh Trại", "Cấp Độ": 40, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Tọa Độ X": 600, "Tọa Độ Y": 600, "Kích Thước": 16,
      "Điểm Tài Nguyên": "", "Nhân Lực": {}, "Vận Hành": 1,
    };

    const result = projectDemography(h, { foodStock: 10_000, foodNeed: 100, loyalty: 90 });
    expect(result.immigrants).toBeGreaterThan(0);
    expect(result.netChange).toBeGreaterThan(0);
  });

  it("đói kém, chật chội và bất mãn làm dân rời đi", () => {
    const h = holding();
    h["Nhà Ở Sẵn Có"] = 4_000;
    h["Lòng Dân"] = 10;
    h["Khủng Hoảng"] = [{ "Loại": "Nạn Đói", "Mức Độ": "Nghiêm Trọng", "Tháng Kéo Dài": 3 }];

    const result = projectDemography(h, { foodStock: 0, foodNeed: 200, loyalty: 10 });
    expect(result.deathRate).toBeGreaterThan(result.birthRate);
    expect(result.emigrants).toBeGreaterThan(0);
    expect(result.netChange).toBeLessThan(0);
  });

  it("ghi đủ tỷ lệ và số người vào state sau khi chốt sổ", () => {
    const h = holding(2_000);
    const result = applyDemography(h, { foodStock: 2_000, foodNeed: 100, loyalty: 70 });
    expect(h["Nhân Khẩu"]?.["Sinh"]).toBe(result.births);
    expect(h["Nhân Khẩu"]?.["Biến Động Ròng"]).toBe(result.netChange);
  });
});
