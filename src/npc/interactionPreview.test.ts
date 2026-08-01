import { describe, expect, it } from "vitest";
import { estimateDistance } from "./interactionPreview";

describe("interaction geography", () => {
  it("keeps identical places face-to-face", () => {
    expect(estimateDistance("Winterfell", "winterfell")).toBe("same");
  });

  it("does not collapse all of Essos into one nearby group", () => {
    expect(estimateDistance("Braavos", "Meereen")).toBe("far");
    expect(estimateDistance("Braavos", "Qarth")).toBe("far");
  });

  it("treats missing locations as unknown", () => {
    expect(estimateDistance(undefined, "Braavos")).toBe("unknown");
  });
});
