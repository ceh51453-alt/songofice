import { describe, expect, it } from "vitest";
import { availableCrises } from "./startingCrises";

describe("starting crisis geography", () => {
  it("offers city-state crises in the Free Cities", () => {
    const crises = availableCrises({
      originId: "braavosi-bravo",
      eraId: "war-of-five-kings",
      continentId: "Essos",
      regionId: "braavos",
    });
    expect(crises.map((crisis) => crisis.id)).toContain("free-city-coup");
    expect(crises.map((crisis) => crisis.id)).not.toContain("five-kings-rise");
  });

  it("keeps Westeros era crises in Westeros", () => {
    const crises = availableCrises({
      originId: "lord-heir",
      eraId: "war-of-five-kings",
      continentId: "Westeros",
      regionId: "the-north",
    });
    expect(crises.map((crisis) => crisis.id)).toContain("five-kings-rise");
    expect(crises.map((crisis) => crisis.id)).not.toContain("free-city-coup");
  });

  it("scopes Sothoryos hazards away from the Summer Isles", () => {
    const sothoryos = availableCrises({
      originId: "explorer",
      eraId: "war-of-five-kings",
      continentId: "Sothoryos",
    });
    const summerIsles = availableCrises({
      originId: "mariner",
      eraId: "war-of-five-kings",
      continentId: "Summer Isles",
    });
    expect(sothoryos.map((crisis) => crisis.id)).toContain("green-fever-expedition");
    expect(summerIsles.map((crisis) => crisis.id)).not.toContain("green-fever-expedition");
  });
});
