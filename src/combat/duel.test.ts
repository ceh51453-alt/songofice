import { describe, it, expect } from "vitest";
import { startDuel, autoDuel, type Duelist, BASIC_SKILLS } from "./duel";

describe("Epic Duel System", () => {
  const theMountain: Duelist = {
    name: "Gregor Clegane",
    hp: 120, maxHp: 120,
    armorClass: 16,
    attackMod: 8,
    damageBonus: 6,
    weaponDice: "2d6",
    damageReduction: 4,
    agilityMod: -2,
    stamina: 30, maxStamina: 30,
    traits: ["brute_force", "second_wind"],
    strength: 18, intellect: 8, perception: 10,
    skills: Object.values(BASIC_SKILLS),
    inventory: [],
    body: {},
    equipped: {}
  };

  const oberyn: Duelist = {
    name: "Oberyn Martell",
    hp: 60, maxHp: 60,
    armorClass: 14,
    attackMod: 9,
    damageBonus: 4,
    weaponDice: "1d8",
    damageReduction: 1,
    agilityMod: 6,
    stamina: 40, maxStamina: 40,
    traits: ["poisoned_blade", "agile_dancer", "riposte"],
    strength: 12, intellect: 14, perception: 16,
    skills: Object.values(BASIC_SKILLS),
    inventory: [],
    body: {},
    equipped: {}
  };

  it("should initialize duel with traits correctly", () => {
    const state = startDuel(theMountain, oberyn, 1234);
    expect(state.a.traits).toContain("brute_force");
    expect(state.b.traits).toContain("poisoned_blade");
    expect(state.a.wounds).toEqual([]);
    expect(state.a.buffs).toEqual({});
  });

  it("should run autoDuel and produce log with dynamic events or fatality", () => {
    const result = autoDuel(theMountain, oberyn, 42); // Seed 42 for reproducible test
    expect(result.log.length).toBeGreaterThan(0);
    expect(result.winner).toBeTruthy();
    console.log("Winner:", result.winner);
    console.log("Log sample:", result.log.slice(0, 5));
    console.log("Last lines:", result.log.slice(-3));
  });
});
