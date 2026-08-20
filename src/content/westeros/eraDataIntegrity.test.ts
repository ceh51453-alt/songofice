import { describe, expect, it } from "vitest";
import { REGIONS_BY_ID, regionControlForEra } from "../world/geography";
import { BANNERMEN } from "./bannermen";
import { ERAS, type CanonCharacter } from "./eras";
import {
  HOUSES_BY_ID,
  HOUSES_DATA,
  NON_HOUSE_AFFILIATIONS,
  resolveHouseId,
} from "./houses";
import { MAP_MARKERS } from "./mapMarkers";

const MARKER_IDS = new Set(MAP_MARKERS.map((marker) => marker.id));
const CHARACTER_IDS = new Set(ERAS.flatMap((era) => era.canonCharacters.map((character) => character.id)));
const OBSOLETE_CHARACTER_ALIASES = new Set([
  "aegon-the-conqueror",
  "aegon-ii-targaryen",
  "daeron-ii-targaryen",
  "brynden-rivers",
  "aegor-rivers",
]);

function validHoldingId(holdingId: string): boolean {
  if (MARKER_IDS.has(holdingId)) return true;
  if (!holdingId.endsWith("-seat")) return false;
  return Boolean(REGIONS_BY_ID[holdingId.slice(0, -"-seat".length)]);
}

function characterRefs(character: CanonCharacter): string[] {
  return [
    character.father,
    character.mother,
    character.spouse,
    character.liege,
    character.secretBiologicalFather,
    character.secretBiologicalMother,
    ...(character.children ?? []),
    ...(character.siblings ?? []),
    ...(character.allies ?? []),
    ...(character.rivals ?? []),
    ...Object.keys(character.relationshipDetails ?? {}),
  ].filter((value): value is string => Boolean(value?.trim()));
}

/**
 * Một số gia phả nhắc người đã chết hoặc chưa được chọn làm nhân vật dựng sẵn.
 * Các tham chiếu lịch sử đó vẫn hợp lệ nếu là một slug đọc được (có thể chỉ
 * là một tên thần thoại như `elenei`). Alias kỹ thuật sai đã biết được chặn
 * riêng bằng `OBSOLETE_CHARACTER_ALIASES`.
 */
function readableHistoricalRef(ref: string): boolean {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(ref);
}

describe("tính toàn vẹn dữ liệu theo thời kỳ", () => {
  it("giữ id và schemaName gia tộc duy nhất", () => {
    expect(new Set(HOUSES_DATA.map((house) => house.id)).size).toBe(HOUSES_DATA.length);
    expect(new Set(HOUSES_DATA.map((house) => house.schemaName)).size).toBe(HOUSES_DATA.length);
  });

  it("phân giải mọi gia tộc được chọn, hồ sơ nhân vật và chư hầu", () => {
    for (const era of ERAS) {
      for (const houseId of era.availableHouses) {
        expect(HOUSES_BY_ID[houseId], `${era.id}.availableHouses → ${houseId}`).toBeDefined();
      }
      for (const character of era.canonCharacters) {
        if (NON_HOUSE_AFFILIATIONS.has(character.house)) continue;
        const houseId = resolveHouseId(character.house);
        expect(houseId, `${era.id}.${character.id}.house → ${character.house}`).toBeDefined();
        expect(HOUSES_BY_ID[houseId ?? ""]).toBeDefined();
      }
    }

    for (const bannerman of BANNERMEN) {
      expect(HOUSES_BY_ID[bannerman.id], `bannerman → ${bannerman.id}`).toBeDefined();
    }
  });

  it("mọi controller của từng era dùng houseId chuẩn hoặc để trống có chủ ý", () => {
    for (const era of ERAS) {
      const control = regionControlForEra(era.id);
      expect(Object.keys(control).length, `${era.id} phải phủ mọi leaf region`).toBeGreaterThan(0);
      for (const [regionId, controller] of Object.entries(control)) {
        expect(REGIONS_BY_ID[regionId], `${era.id}.controller region → ${regionId}`).toBeDefined();
        if (!controller) continue;
        expect(HOUSES_BY_ID[controller], `${era.id}.${regionId} → ${controller}`).toBeDefined();
      }
    }
  });

  it("mọi thành trì và vùng khởi đầu đều trỏ tới dữ liệu bản đồ", () => {
    for (const era of ERAS) {
      for (const character of era.canonCharacters) {
        for (const holdingId of character.startHoldings ?? []) {
          expect(validHoldingId(holdingId), `${era.id}.${character.id}.startHoldings → ${holdingId}`).toBe(true);
        }
        for (const holdingId of Object.keys(character.holdingsLevel ?? {})) {
          expect(validHoldingId(holdingId), `${era.id}.${character.id}.holdingsLevel → ${holdingId}`).toBe(true);
        }
        for (const regionId of character.startRegions ?? []) {
          expect(REGIONS_BY_ID[regionId], `${era.id}.${character.id}.startRegions → ${regionId}`).toBeDefined();
        }
      }
    }
  });

  it("quan hệ dùng id canon hoặc tham chiếu lịch sử đọc được, không dùng alias cũ", () => {
    for (const era of ERAS) {
      for (const character of era.canonCharacters) {
        for (const ref of characterRefs(character)) {
          expect(OBSOLETE_CHARACTER_ALIASES.has(ref), `${era.id}.${character.id} → alias cũ ${ref}`).toBe(false);
          expect(
            CHARACTER_IDS.has(ref) || readableHistoricalRef(ref),
            `${era.id}.${character.id} → ref không đọc được ${ref}`,
          ).toBe(true);
        }
      }
    }
  });
});
