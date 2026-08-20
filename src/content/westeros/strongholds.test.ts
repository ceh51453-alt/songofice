import { describe, expect, it } from "vitest";
import { REGIONS, REGIONS_BY_ID } from "../world/geography";
import {
  MIN_STRONGHOLDS_PER_PROVINCE,
  provinceForStronghold,
  strongholdsForEra,
  strongholdsForProvince,
} from "./strongholds";

describe("Danh mục thành trì kiểm soát thực địa", () => {
  const eraId = "war-of-five-kings";
  const sites = strongholdsForEra(eraId);

  it("mỗi province phong kiến Westeros có ít nhất bốn mục tiêu và một thủ phủ", () => {
    const provinces = REGIONS.filter((region) => region.continentId === "westeros" && region.realmId !== "beyond-wall");
    for (const province of provinces) {
      const local = strongholdsForProvince(province.id, eraId);
      expect(local.length, province.id).toBeGreaterThanOrEqual(MIN_STRONGHOLDS_PER_PROVINCE);
      expect(local.filter((site) => site.source === "seat"), province.id).toHaveLength(1);
    }
  });

  it("id ổn định/duy nhất và mọi thành đều trỏ về một province hợp lệ", () => {
    expect(new Set(sites.map((site) => site.id)).size).toBe(sites.length);
    for (const site of sites) {
      expect(REGIONS_BY_ID[site.provinceId], site.id).toBeDefined();
      expect(provinceForStronghold(site.id, eraId)?.id).toBe(site.provinceId);
      expect(site.population, site.id).toBeGreaterThan(0);
    }
  });

  it("cứ điểm Night's Watch không bị nhập vào graph phong kiến", () => {
    expect(sites.some((site) => site.id.includes("castle-black"))).toBe(false);
    expect(sites.some((site) => site.id.includes("shadow-tower"))).toBe(false);
    expect(sites.some((site) => site.id.includes("eastwatch"))).toBe(false);
  });
});
