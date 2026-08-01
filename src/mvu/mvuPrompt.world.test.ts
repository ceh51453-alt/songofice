import { describe, expect, it } from "vitest";
import { REGIONS } from "../content/world/geography";
import { makeDefaultState } from "./schema";
import {
  NARRATIVE_TAGS_PROMPT, VALID_WORLD_REGION_IDS, geographyContextPrompt,
} from "./mvuPrompt";

describe("prompt địa lý thế giới", () => {
  it("sinh regionId từ geography và có vùng Essos", () => {
    const essos = REGIONS.find((region) => region.continentId === "essos")!;
    expect(VALID_WORLD_REGION_IDS).toEqual(REGIONS.map((region) => region.id));
    expect(NARRATIVE_TAGS_PROMPT).toContain(essos.id);
  });

  it("inject lục địa và luật chính thể theo vị trí hiện tại", () => {
    const s = makeDefaultState();
    const essos = REGIONS.find((region) => region.continentId === "essos")!;
    s["Thế Giới"]["Vị Trí"] = essos.id;
    const context = geographyContextPrompt(s);

    expect(context).toContain("Essos");
    expect(context).toContain(`regionId: ${essos.id}`);
    expect(context).toContain("không");
  });
});
