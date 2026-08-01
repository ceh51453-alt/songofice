import { describe, expect, it } from "vitest";
import { regionForLocation } from "./geography";
import { findRegionPath } from "../../strategy/army";
import { recruitableTroopsForBranch } from "../westeros/troopTypes";
import { goodDef } from "../westeros/goods";
import { isGoodImportedAt } from "../../economy/market";

describe("world geography integrations", () => {
  it("does not let a land army march across the Narrow Sea", () => {
    const kingsLanding = regionForLocation("King's Landing");
    const pentos = regionForLocation("Pentos");
    expect(kingsLanding).toBeTruthy();
    expect(pentos).toBeTruthy();
    expect(findRegionPath(kingsLanding!.id, pentos!.id, "land")).toBeNull();
    expect(kingsLanding!.seaConnections).toContain(pentos!.id);
  });

  it("offers regional troops only where their people can raise them", () => {
    const braavos = regionForLocation("Braavos")!;
    const vaesDothrak = regionForLocation("Vaes Dothrak")!;
    const braavosi = recruitableTroopsForBranch("war-of-five-kings", "Chính Quy", {
      regionId: braavos.id,
      cultureId: "braavosi",
    });
    const dothraki = recruitableTroopsForBranch("war-of-five-kings", "Chính Quy", {
      regionId: vaesDothrak.id,
      cultureId: "dothraki",
    });
    expect(braavosi).toContain("Nồi Đất (Braavosi)");
    expect(braavosi).not.toContain("Kỵ Sĩ Dothraki");
    expect(dothraki).toContain("Kỵ Sĩ Dothraki");
  });

  it("prices Myrish goods as local in Myr and imported in Westeros", () => {
    const silk = goodDef("Lụa Myr")!;
    const myr = regionForLocation("Myr")!;
    const winterfell = regionForLocation("Winterfell")!;
    expect(isGoodImportedAt(silk, myr.id)).toBe(false);
    expect(isGoodImportedAt(silk, winterfell.id)).toBe(true);
  });
});
