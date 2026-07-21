import { describe, it, expect } from "vitest";
import {
  renownTier,
  computeRenownScore,
  houseReputationPreference,
  npcReactionModifier,
  renderReputationForAI,
} from "./reputationEngine";
import { makeDefaultState } from "../mvu/schema";

describe("reputationEngine (16.4)", () => {
  describe("renownTier", () => {
    it("score 0 → Vô Danh Tiểu Tốt (tier 0)", () => {
      const info = renownTier(0);
      expect(info.tier).toBe(0);
      expect(info.label).toBe("Vô Danh Tiểu Tốt");
    });

    it("score 150+ → Huyền Thoại Sống (tier 5)", () => {
      const info = renownTier(200);
      expect(info.tier).toBe(5);
      expect(info.label).toBe("Huyền Thoại Sống");
    });

    it("score 60..99 → Lừng Danh Một Cõi (tier 3)", () => {
      const info = renownTier(75);
      expect(info.tier).toBe(3);
    });

    it("score -10..-29 → Bi Giem Pha (tier -1)", () => {
      const info = renownTier(-20);
      expect(info.tier).toBe(-1);
    });

    it("score < -150 → Lưu Xú Muôn Đời (tier -5)", () => {
      const info = renownTier(-200);
      expect(info.tier).toBe(-5);
      expect(info.label).toBe("Lưu Xú Muôn Đời");
    });
  });

  describe("computeRenownScore", () => {
    it("default state → score near 0 + bonus cấp", () => {
      const stat = makeDefaultState();
      const score = computeRenownScore(stat);
      // default: all axes 0, level 1, no territories → 0 + 0*5 + 1*2 = 2
      expect(score).toBe(2);
    });

    it("high reputation axes → high score", () => {
      const stat = makeDefaultState();
      stat["Danh Vọng"]["Vinh Dự"] = 80;
      stat["Danh Vọng"]["Nhân Từ"] = 60;
      stat["Danh Vọng"]["Uy Dũng"] = 70;
      stat["Danh Vọng"]["Xảo Quyệt"] = 40;
      const score = computeRenownScore(stat);
      // avg = (80+60+70+40)/4 = 62.5, + 0 territories + 2 (level 1) = 64.5
      expect(score).toBeCloseTo(64.5, 0);
    });
  });

  describe("houseReputationPreference", () => {
    it("Stark trọng Vinh Dự", () => {
      const pref = houseReputationPreference("Stark");
      expect(pref.primary).toBe("Vinh Dự");
    });

    it("Lannister trọng Xảo Quyệt", () => {
      const pref = houseReputationPreference("Lannister");
      expect(pref.primary).toBe("Xảo Quyệt");
    });

    it("unknown house → default preference", () => {
      const pref = houseReputationPreference("Nhà Nhỏ Nào Đó");
      expect(pref.primary).toBe("Vinh Dự");
    });
  });

  describe("npcReactionModifier", () => {
    it("Stark NPC + high Vinh Dự → positive modifier", () => {
      const mod = npcReactionModifier("Stark", {
        "Vinh Dự": 80, "Nhân Từ": 50, "Uy Dũng": 30, "Xảo Quyệt": 10,
      });
      expect(mod).toBeGreaterThan(0);
    });

    it("Stark NPC + high Xảo Quyệt but low Vinh Dự → negative modifier", () => {
      const mod = npcReactionModifier("Stark", {
        "Vinh Dự": -60, "Nhân Từ": -40, "Uy Dũng": 10, "Xảo Quyệt": 80,
      });
      expect(mod).toBeLessThan(0);
    });

    it("modifier clamped to -20..+20", () => {
      const mod = npcReactionModifier("Lannister", {
        "Vinh Dự": 100, "Nhân Từ": 100, "Uy Dũng": 100, "Xảo Quyệt": 100,
      });
      expect(mod).toBeLessThanOrEqual(20);
      expect(mod).toBeGreaterThanOrEqual(-20);
    });
  });

  describe("renderReputationForAI", () => {
    it("renders readable text with label", () => {
      const stat = makeDefaultState();
      stat["Danh Vọng"]["Uy Dũng"] = 50;
      const text = renderReputationForAI(stat);
      expect(text).toContain("Uy Dũng 50");
      expect(text).toContain("Bậc:");
    });
  });
});
