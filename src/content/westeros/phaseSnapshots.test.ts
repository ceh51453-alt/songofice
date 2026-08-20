import { describe, expect, it } from "vitest";
import {
  ERAS_BY_ID,
  activeCanonCharacters,
  resolveCanonCharacterSnapshot,
  type CanonCharacter,
} from "./eras";

const ERA = ERAS_BY_ID["war-of-five-kings"]!;
const EARLY_PHASES = ["kings-arrival", "hand-of-king", "journey-to-wall", "dothraki-wedding"] as const;
const WAR_PHASES = ["dragonstone-fleet", "highgarden-alliance", "boy-king-crowned"] as const;

function roster(phaseId: string): Map<string, CanonCharacter> {
  return new Map(activeCanonCharacters(ERA, 298, phaseId).map((character) => [character.id, character]));
}

function isHolder(character: CanonCharacter): boolean {
  if (character.legalStatus !== undefined) return character.legalStatus === "holder";
  return Boolean(character.startHoldings?.length || character.startRegions?.length);
}

describe("snapshot pháp quyền Chiến Tranh Ngũ Vương", () => {
  it.each(EARLY_PHASES)("%s giữ Robert và Ned là holder; Robb/Joffrey chỉ là heir", (phaseId) => {
    const characters = roster(phaseId);
    expect(characters.get("robert-baratheon")).toMatchObject({
      tuocVi: "Vua Bảy Vương Quốc",
      legalStatus: "holder",
      startHoldings: ["the-crownlands-seat"],
      startRegions: ["the-crownlands"],
    });
    expect(characters.get("eddard-stark")).toMatchObject({
      legalStatus: "holder",
      startHoldings: ["the-north-seat"],
      startRegions: ["the-north"],
    });
    expect(characters.get("robb-stark")).toMatchObject({ legalStatus: "heir", startHoldings: [], startRegions: [] });
    expect(characters.get("joffrey-baratheon")).toMatchObject({ legalStatus: "heir", startHoldings: [], startRegions: [] });
  });

  it.each(WAR_PHASES)("%s chuyển sang snapshot sau cái chết của Robert và Ned", (phaseId) => {
    const characters = roster(phaseId);
    expect(characters.has("robert-baratheon")).toBe(false);
    expect(characters.has("eddard-stark")).toBe(false);
    expect(characters.get("joffrey-baratheon")).toMatchObject({
      tuocVi: "Vua Bảy Vương Quốc",
      legalStatus: "holder",
      startHoldings: ["the-crownlands-seat"],
      startRegions: ["the-crownlands"],
    });
    expect(characters.get("robb-stark")).toMatchObject({
      tuocVi: "Quốc Vương",
      legalStatus: "holder",
      startHoldings: ["the-north-seat"],
      startRegions: ["the-north", "the-riverlands"],
    });
    expect(characters.get("stannis-baratheon")).toMatchObject({ tuocVi: "Quốc Vương", claimRegionIds: ["the-crownlands"] });
    expect(characters.get("renly-baratheon")).toMatchObject({ tuocVi: "Quốc Vương", claimRegionIds: ["the-crownlands"] });
    expect(characters.get("euron-greyjoy")).toMatchObject({ tuocVi: "Lãnh Chúa", legalStatus: "unlanded", startHoldings: [] });
  });

  it("mỗi snapshot chỉ có một holder cho mỗi thành và mỗi vùng", () => {
    for (const hook of ERA.startingHooks) {
      const holders = activeCanonCharacters(ERA, hook.numericYear ?? 298, hook.id).filter(isHolder);
      const seats = new Map<string, string>();
      const regions = new Map<string, string>();
      for (const character of holders) {
        for (const seatId of character.startHoldings ?? []) {
          expect(seats.get(seatId), `${hook.id}: ${seatId} bị cả ${seats.get(seatId)} và ${character.id} giữ`).toBeUndefined();
          seats.set(seatId, character.id);
        }
        for (const regionId of character.startRegions ?? []) {
          expect(regions.get(regionId), `${hook.id}: ${regionId} bị cả ${regions.get(regionId)} và ${character.id} giữ`).toBeUndefined();
          regions.set(regionId, character.id);
        }
      }
    }
  });

  it("resolver không mutate hồ sơ gốc", () => {
    const robb = ERA.canonCharacters.find((character) => character.id === "robb-stark")!;
    const snapshot = resolveCanonCharacterSnapshot(robb, "boy-king-crowned");
    snapshot.startRegions?.push("the-vale");
    expect(robb.startRegions).toEqual([]);
    expect(robb.phaseOverrides?.["boy-king-crowned"]?.startRegions).toEqual(["the-north", "the-riverlands"]);
  });
});
