import { describe, expect, it } from "vitest";
import { buildStateFromCanon } from "../../character/characterInit";
import { ERAS_BY_ID } from "../../content/westeros/eras";
import { playerHoldings } from "./CharacterPreview";

const MODES = {
  narrativeMode: "Diễn Giải Tự Do" as const,
  scenarioMode: "Người Chơi Là Trung Tâm" as const,
  difficulty: "Cân Bằng" as const,
};

describe("playerHoldings", () => {
  it("chỉ trả về lãnh địa của nhân vật người chơi, không phải toàn bộ thế giới", () => {
    const era = ERAS_BY_ID["aegon-conquest"]!;
    const mern = era.canonCharacters.find((character) => character.id === "mern-ix-gardener")!;
    const state = buildStateFromCanon(mern, era, MODES);

    expect(playerHoldings(state).map(([id]) => id)).toEqual(["the-reach-seat"]);
    expect(Object.keys(state["Lãnh Địa"])).toContain("the-westerlands-seat");
  });
});
