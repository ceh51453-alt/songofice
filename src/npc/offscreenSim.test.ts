import { describe, it, expect } from "vitest";
import { selectKeyNpcs, generateOffscreenAction, runOffscreenSim } from "./offscreenSim";
import { makeDefaultState } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";

function makeNpc(goal?: string, affinity = 0): Npc {
  return {
    "Họ Tên": "Test NPC",
    "Chức Vụ": "Lãnh chúa",
    "Tuổi": 35,
    "Giai Đoạn Đời": "Trưởng Thành",
    "Còn Sống": true,
    "Độ Hảo Cảm": affinity,
    "Giai Đoạn Quan Hệ": "Xa Lạ",
    "Loại Quan Hệ": [],
    "Tin Cậy": 0,
    "Đánh Giá": "",
    "Giải Thích": "",
    "Ký Ức": [],
    "Lời Hứa Chưa Giữ": [],
    "Sự Kiện Đã Tham Gia": [],
    "Căng Thẳng": 0,
    "Tiền Tài": 0,
    "Vị Trí Hiện Tại": "king_s_landing",
    "Tính Cách": {
      "Trục Thiện-Ác": -30,
      "Trục Can Đảm-Hèn Nhát": 40,
      "Trục Trung Thành-Phản Trắc": 0,
      "Trục Nóng Nảy-Điềm Tĩnh": 0,
    },
    "Nét Tính Cách": [],
    "Năng Lực": { "Võ Lực": 50, "Thống Soái": 60, "Trí Mưu": 70, "Ngoại Giao": 40 },
    "Người Thừa Kế": false,
    "Cha/Mẹ": [],
    "Con Cái": [],
    "Anh Chị Em": [],
    "Tình Trạng": "Bình Thường",
    "Mục Tiêu Cá Nhân": goal,
    "Giới Tính": "Nam",
  } as unknown as Npc;
}

describe("offscreenSim (16.3)", () => {
  describe("selectKeyNpcs", () => {
    it("chọn NPC có Mục Tiêu + còn sống", () => {
      const stat = makeDefaultState();
      stat["Mối Quan Hệ"]["NPC Chính"]["Cersei"] = makeNpc("Chiếm ngai sắt", 60);
      stat["Mối Quan Hệ"]["NPC Chính"]["Random"] = makeNpc(undefined, 10); // no goal
      const selected = selectKeyNpcs(stat);
      expect(selected).toHaveLength(1);
      expect(selected[0][0]).toBe("Cersei");
    });

    it("tối đa 5 NPC", () => {
      const stat = makeDefaultState();
      for (let i = 0; i < 8; i++) {
        stat["Mối Quan Hệ"]["NPC Chính"][`NPC${i}`] = makeNpc(`Mục tiêu ${i}`, i * 20);
      }
      const selected = selectKeyNpcs(stat);
      expect(selected.length).toBeLessThanOrEqual(5);
    });
  });

  describe("generateOffscreenAction", () => {
    it("NPC có mục tiêu quyền lực → sinh hành động liên minh/tuyên bố", () => {
      const npc = makeNpc("Chiếm quyền lực tại Vương Đô");
      const result = generateOffscreenAction("Cersei", npc);
      expect(result).not.toBeNull();
      expect(result!.npcName).toBe("Cersei");
      expect(result!.newsText.length).toBeGreaterThan(0);
    });

    it("NPC không có mục tiêu → null", () => {
      const npc = makeNpc(undefined);
      const result = generateOffscreenAction("Nobody", npc);
      expect(result).toBeNull();
    });

    it("NPC có mục tiêu trả thù → sinh tin tức", () => {
      const npc = makeNpc("Trả thù cho gia tộc");
      const result = generateOffscreenAction("Arya", npc);
      expect(result).not.toBeNull();
      expect(result!.newsText).toContain("Arya");
    });
  });

  describe("runOffscreenSim", () => {
    it("trả về actions cho NPC có mục tiêu", () => {
      const stat = makeDefaultState();
      stat["Mối Quan Hệ"]["NPC Chính"]["Tywin"] = makeNpc("Chiếm quyền lực", 70);
      const actions = runOffscreenSim(stat);
      expect(actions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
