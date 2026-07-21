/**
 * Acceptance M7 (9.6.1): 9 vùng canon + gate Nhà cai trị theo Era + ẩn trọng
 * trấn chưa tồn tại. "9 vùng canon hiện đúng Nhà cai trị theo Era".
 */
import { describe, expect, it } from "vitest";
import { REGIONS, REGIONS_BY_ID, regionControlForEra, seatVisible } from "./regions";

describe("Seed 9 vùng Westeros (9.6.1)", () => {
  it("đủ 9 vùng canon với trọng trấn", () => {
    expect(REGIONS).toHaveLength(9);
    expect(REGIONS_BY_ID["the-north"].seat).toBe("Winterfell");
    expect(REGIONS_BY_ID["dorne"].seat).toBe("Sunspear");
    // mọi vùng có polygon vẽ được
    for (const r of REGIONS) expect(r.polygonPx.length).toBeGreaterThanOrEqual(3);
  });

  it("Crownlands: Baratheon ở Ngũ Vương, Targaryen ở Loạn Robert", () => {
    expect(regionControlForEra("war-of-five-kings")["the-crownlands"]).toBe("baratheon");
    expect(regionControlForEra("roberts-rebellion")["the-crownlands"]).toBe("targaryen");
  });

  it("Chinh Phạt Aegon: Crownlands vô chủ (chưa có King's Landing), 7 vương quốc riêng", () => {
    const aegon = regionControlForEra("aegon-conquest");
    expect(aegon["the-crownlands"]).toBe(""); // vô chủ — Aegon đang đổ bộ
    expect(aegon["the-reach"]).toBe("gardener"); // Gardener thay Tyrell
    expect(aegon["the-stormlands"]).toBe("durrandon"); // Vua Bão thay Baratheon
    expect(aegon["the-riverlands"]).toBe("hoare"); // Harren Đen nắm cả Sông + Đảo Sắt
    expect(aegon["the-iron-islands"]).toBe("hoare");
    // trọng trấn King's Landing bị ẩn ở Era này
    expect(seatVisible(REGIONS_BY_ID["the-crownlands"], "aegon-conquest")).toBe(false);
    expect(seatVisible(REGIONS_BY_ID["the-crownlands"], "war-of-five-kings")).toBe(true);
  });

  it("các vùng ổn định giữ Nhà mặc định qua các Era", () => {
    for (const era of ["war-of-five-kings", "roberts-rebellion", "aegon-conquest"]) {
      expect(regionControlForEra(era)["the-north"]).toBe("stark");
      expect(regionControlForEra(era)["the-westerlands"]).toBe("lannister");
    }
  });
});
