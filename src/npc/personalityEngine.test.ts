import { describe, it, expect } from "vitest";
import {
  shiftPersonality,
  personalityLabel,
  personalityModifier,
  formatPersonalityForPrompt,
} from "./personalityEngine";
import type { Npc } from "../mvu/npcSchema";

function makeNpc(personality: Partial<Npc["Tính Cách"]> = {}): Npc {
  return {
    "Họ Tên": "Test",
    "Chức Vụ": "",
    "Tuổi": 30,
    "Giai Đoạn Đời": "Trưởng Thành",
    "Còn Sống": true,
    "Độ Hảo Cảm": 0,
    "Giai Đoạn Quan Hệ": "Xa Lạ",
    "Loại Quan Hệ": [],
    "Tin Cậy": 0,
    "Đánh Giá": "",
    "Giải Thích": "",
    "Ký Ức": [],
    "Lời Hứa Chưa Giữ": [],
    "Tính Cách": {
      "Trục Thiện-Ác": 0,
      "Trục Can Đảm-Hèn Nhát": 0,
      "Trục Trung Thành-Phản Trắc": 0,
      "Trục Nóng Nảy-Điềm Tĩnh": 0,
      ...personality,
    },
    "Nét Tính Cách": ["kiêu ngạo", "trọng danh dự"],
    "Năng Lực": { "Võ Lực": 30, "Thống Soái": 30, "Trí Mưu": 30, "Ngoại Giao": 30 },
    "Người Thừa Kế": false,
    "Cha/Mẹ": [],
    "Con Cái": [],
    "Anh Chị Em": [],
    "Tình Trạng": "Bình Thường",
    "Giới Tính": "Nam",
    "Cung Bậc Phát Triển": "Từ kiêu ngạo đến khiêm nhường",
  } as Npc;
}

describe("personalityEngine (16.2)", () => {
  describe("shiftPersonality", () => {
    it("betrayal_received → Trung Thành tụt", () => {
      const npc = makeNpc({ "Trục Trung Thành-Phản Trắc": 50 });
      shiftPersonality(npc, "betrayal_received");
      expect(npc["Tính Cách"]["Trục Trung Thành-Phản Trắc"]).toBe(42); // 50 - 8
    });

    it("battle_won → Can Đảm tăng", () => {
      const npc = makeNpc({ "Trục Can Đảm-Hèn Nhát": 20 });
      shiftPersonality(npc, "battle_won");
      expect(npc["Tính Cách"]["Trục Can Đảm-Hèn Nhát"]).toBe(26); // 20 + 6
    });

    it("clamp -100..100", () => {
      const npc = makeNpc({ "Trục Trung Thành-Phản Trắc": -95 });
      shiftPersonality(npc, "betrayal_committed"); // -12
      expect(npc["Tính Cách"]["Trục Trung Thành-Phản Trắc"]).toBe(-100);
    });

    it("magnitude multiplier", () => {
      const npc = makeNpc({ "Trục Can Đảm-Hèn Nhát": 0 });
      shiftPersonality(npc, "battle_won", 2.0); // 6 * 2 = 12
      expect(npc["Tính Cách"]["Trục Can Đảm-Hèn Nhát"]).toBe(12);
    });
  });

  describe("personalityLabel", () => {
    it("value 80 → 'rất can đảm'", () => {
      expect(personalityLabel("Trục Can Đảm-Hèn Nhát", 80)).toBe("rất can đảm");
    });

    it("value -50 → 'khá hèn nhát'", () => {
      expect(personalityLabel("Trục Can Đảm-Hèn Nhát", -50)).toBe("khá hèn nhát");
    });

    it("value 0 → 'trung tính'", () => {
      expect(personalityLabel("Trục Thiện-Ác", 0)).toBe("trung tính");
    });

    it("value 20 → 'hơi thiện lương'", () => {
      expect(personalityLabel("Trục Thiện-Ác", 20)).toBe("hơi thiện lương");
    });
  });

  describe("personalityModifier", () => {
    it("NPC trung thành cao + sự kiện tốt → modifier > 1", () => {
      const npc = makeNpc({ "Trục Trung Thành-Phản Trắc": 80 });
      const mod = personalityModifier(npc, true);
      expect(mod).toBeGreaterThan(1.0);
    });

    it("NPC đa nghi + sự kiện tốt → modifier < 1", () => {
      const npc = makeNpc({ "Trục Trung Thành-Phản Trắc": -60 });
      const mod = personalityModifier(npc, true);
      expect(mod).toBeLessThan(1.0);
    });

    it("modifier clamped 0.4..1.6", () => {
      const npc = makeNpc({ "Trục Trung Thành-Phản Trắc": -100 });
      const mod = personalityModifier(npc, true);
      expect(mod).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe("formatPersonalityForPrompt", () => {
    it("render tính cách + nét + arc", () => {
      const npc = makeNpc({ "Trục Can Đảm-Hèn Nhát": 70 });
      const text = formatPersonalityForPrompt(npc);
      expect(text).toContain("rất can đảm");
      expect(text).toContain("kiêu ngạo");
      expect(text).toContain("khiêm nhường");
    });
  });
});
