import { describe, expect, it } from "vitest";
import { REGIONS, REGIONS_BY_ID } from "../world/geography";
import { MAP_MARKERS } from "./mapMarkers";
import {
  ERAS,
  activeCanonCharacters,
  parseHookYear,
  resolveCanonCharacterSnapshot,
  type CanonCharacter,
} from "./eras";

const HOLDING_IDS = new Set([
  ...MAP_MARKERS.map((marker) => marker.id),
  ...REGIONS.map((region) => `${region.id}-seat`),
]);

function effectiveHolder(character: CanonCharacter): boolean {
  if (character.legalStatus !== undefined) return character.legalStatus === "holder";
  return Boolean(character.startHoldings?.length || character.startRegions?.length);
}

describe("completion audit toàn bộ catalog era/canon", () => {
  it("mọi hook và phase override đều trỏ tới snapshot có thật", () => {
    for (const era of ERAS) {
      const eraHooks = new Set(era.startingHooks.map((hook) => hook.id));
      for (const character of era.canonCharacters) {
        const personalHooks = new Set(character.personalHooks?.map((hook) => hook.id) ?? []);
        for (const hookId of character.startingHookIds) {
          expect(
            eraHooks.has(hookId) || personalHooks.has(hookId),
            `${era.id}.${character.id}.startingHookIds -> ${hookId}`,
          ).toBe(true);
        }
        for (const phaseId of Object.keys(character.phaseOverrides ?? {})) {
          expect(
            eraHooks.has(phaseId) || personalHooks.has(phaseId),
            `${era.id}.${character.id}.phaseOverrides -> ${phaseId}`,
          ).toBe(true);
        }
      }
    }
  });

  it("mọi snapshot dùng id bản đồ hợp lệ và không có hai holder cùng ghế", () => {
    const duplicateHolders: string[] = [];
    for (const era of ERAS) {
      const hooks = era.startingHooks.length > 0 ? era.startingHooks : [undefined];
      for (const hook of hooks) {
        const phaseId = hook?.id;
        const year = parseHookYear(hook, era.startYear);
        const roster = activeCanonCharacters(era, year, phaseId);
        const seatHolders = new Map<string, string>();
        const regionHolders = new Map<string, string>();
        for (const character of roster) {
          for (const holdingId of [...(character.startHoldings ?? []), ...(character.residenceIds ?? [])]) {
            expect(HOLDING_IDS.has(holdingId), `${era.id}.${phaseId}.${character.id} -> holding/residence ${holdingId}`).toBe(true);
          }
          for (const regionId of [...(character.startRegions ?? []), ...(character.claimRegionIds ?? [])]) {
            expect(REGIONS_BY_ID[regionId], `${era.id}.${phaseId}.${character.id} -> region/claim ${regionId}`).toBeDefined();
          }
          if (!effectiveHolder(character)) continue;
          for (const holdingId of character.startHoldings ?? []) {
            const priorHolder = seatHolders.get(holdingId);
            if (priorHolder) duplicateHolders.push(`${era.id}.${phaseId}.${holdingId}: ${priorHolder} / ${character.id}`);
            seatHolders.set(holdingId, character.id);
          }
          for (const regionId of character.startRegions ?? []) {
            const priorHolder = regionHolders.get(regionId);
            if (priorHolder) duplicateHolders.push(`${era.id}.${phaseId}.${regionId}: ${priorHolder} / ${character.id}`);
            regionHolders.set(regionId, character.id);
          }
        }
      }
    }
    expect(duplicateHolders).toEqual([]);
  });

  it("resolver hoàn tất pháp trạng và không cho non-holder mang quyền sở hữu", () => {
    for (const era of ERAS) {
      for (const character of era.canonCharacters) {
        const phases = [undefined, ...era.startingHooks.map((hook) => hook.id)];
        for (const phaseId of phases) {
          const snapshot = resolveCanonCharacterSnapshot(character, phaseId);
          expect(snapshot.legalStatus, `${era.id}.${phaseId ?? "base"}.${character.id} thiếu legalStatus`).toBeDefined();
          expect(snapshot.residenceIds, `${era.id}.${phaseId ?? "base"}.${character.id} thiếu residenceIds`).toBeDefined();
          expect(snapshot.claimRegionIds, `${era.id}.${phaseId ?? "base"}.${character.id} thiếu claimRegionIds`).toBeDefined();
          if (snapshot.legalStatus !== "holder") {
            expect(snapshot.startHoldings ?? [], `${era.id}.${phaseId ?? "base"}.${character.id} non-holder có thành`).toEqual([]);
            expect(snapshot.startRegions ?? [], `${era.id}.${phaseId ?? "base"}.${character.id} non-holder có vùng`).toEqual([]);
          }
        }
      }
    }
  });
});
