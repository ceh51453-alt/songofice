import { describe, expect, it } from "vitest";
import { REGIONS } from "../world/geography";
import {
  GOODS, REGION_RESOURCES, ensureRegionalEconomy, seedRegionalEconomy,
} from "./regionalResources";

describe("tài nguyên vùng trên bản đồ thế giới", () => {
  it("phủ đúng mọi vùng lá, gồm cả Essos", () => {
    const regionIds = REGIONS.map((region) => region.id).sort();
    expect(Object.keys(REGION_RESOURCES).sort()).toEqual(regionIds);
    expect(REGIONS.some((region) => region.continentId === "essos" && REGION_RESOURCES[region.id])).toBe(true);

    for (const region of REGIONS) {
      const profile = REGION_RESOURCES[region.id];
      expect(profile.surplus.length, region.id).toBeGreaterThan(0);
      expect(profile.deficit.length, region.id).toBeGreaterThan(0);
      expect(profile.surplus.some((good) => profile.deficit.includes(good)), region.id).toBe(false);
    }
  });

  it("gieo một thị trường đầy đủ cho mỗi vùng mà không mang/nhân đôi dân số", () => {
    const economy = seedRegionalEconomy();
    expect(Object.keys(economy)).toHaveLength(REGIONS.length);
    for (const market of Object.values(economy)) {
      expect(Object.keys(market["Giá Cả"])).toHaveLength(GOODS.length);
      expect("Dân Số" in market).toBe(false);
    }
  });

  it("repair chỉ thêm vùng thiếu và giữ nguyên mọi giá trị thị trường cũ", () => {
    const first = REGIONS[0].id;
    const oldMarket = {
      "Sản Vật Chủ Lực": ["Vàng custom"],
      "Thiếu Hụt": [],
      "Giá Cả": { "Lương Thực": 999 },
      "Field Mod": { untouched: true },
    };
    const economy: Record<string, unknown> = { [first]: oldMarket, "legacy-market": { value: 7 } };

    expect(ensureRegionalEconomy(economy)).toBe(REGIONS.length - 1);
    expect(economy[first]).toBe(oldMarket);
    expect(economy["legacy-market"]).toEqual({ value: 7 });
    expect(Object.keys(economy)).toHaveLength(REGIONS.length + 1);
  });
});
