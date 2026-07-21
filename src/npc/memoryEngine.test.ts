import { describe, it, expect } from "vitest";
import {
  selectRelevantMemories,
  decayMemories,
  addMemory,
  formatMemoriesForPrompt,
  decayAllMemories,
} from "./memoryEngine";
import { makeDefaultState } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";

function makeNpc(overrides: Partial<Npc> = {}): Npc {
  return {
    "Họ Tên": "Test NPC",
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
    },
    "Nét Tính Cách": [],
    "Năng Lực": { "Võ Lực": 30, "Thống Soái": 30, "Trí Mưu": 30, "Ngoại Giao": 30 },
    "Người Thừa Kế": false,
    "Cha/Mẹ": [],
    "Con Cái": [],
    "Anh Chị Em": [],
    "Tình Trạng": "Bình Thường",
    "Giới Tính": "Nam",
    ...overrides,
  } as Npc;
}

describe("memoryEngine (16.1)", () => {
  describe("selectRelevantMemories", () => {
    it("chọn 5 ký ức trọng số cao nhất cho NPC active", () => {
      const npc = makeNpc({
        "Ký Ức": Array.from({ length: 10 }, (_, i) => ({
          "Turn": i, "Sự Việc": `Sự kiện ${i}`, "Cảm Xúc": "Trung Lập" as const, "Trọng Số": (i + 1) * 10,
        })),
      });
      const selected = selectRelevantMemories(npc, true);
      expect(selected).toHaveLength(5);
      expect(selected[0]["Trọng Số"]).toBe(100); // trọng số cao nhất
    });

    it("chọn 2 ký ức cho NPC passive", () => {
      const npc = makeNpc({
        "Ký Ức": Array.from({ length: 5 }, (_, i) => ({
          "Turn": i, "Sự Việc": `Sự kiện ${i}`, "Cảm Xúc": "Trung Lập" as const, "Trọng Số": 50,
        })),
      });
      const selected = selectRelevantMemories(npc, false);
      expect(selected).toHaveLength(2);
    });
  });

  describe("decayMemories", () => {
    it("giảm trọng số ký ức dưới 80", () => {
      const npc = makeNpc({
        "Ký Ức": [
          { "Turn": 1, "Sự Việc": "Nhỏ", "Cảm Xúc": "Trung Lập", "Trọng Số": 50 },
          { "Turn": 2, "Sự Việc": "Lớn", "Cảm Xúc": "Biết Ơn", "Trọng Số": 90 },
        ],
      });
      decayMemories(npc, 10);
      expect(npc["Ký Ức"][0]["Trọng Số"]).toBe(45); // 50 - 0.5*10
      expect(npc["Ký Ức"][1]["Trọng Số"]).toBe(90); // >= 80 → không phai
    });

    it("xoá ký ức dưới ngưỡng MIN_WEIGHT", () => {
      const npc = makeNpc({
        "Ký Ức": [
          { "Turn": 1, "Sự Việc": "Rất cũ", "Cảm Xúc": "Trung Lập", "Trọng Số": 6 },
        ],
      });
      decayMemories(npc, 10); // 6 - 5 = 1, dưới 5 → xoá
      expect(npc["Ký Ức"]).toHaveLength(0);
    });

    it("turnsPassed <= 0 → không làm gì", () => {
      const npc = makeNpc({
        "Ký Ức": [{ "Turn": 1, "Sự Việc": "Test", "Cảm Xúc": "Trung Lập", "Trọng Số": 50 }],
      });
      decayMemories(npc, 0);
      expect(npc["Ký Ức"][0]["Trọng Số"]).toBe(50);
    });
  });

  describe("addMemory", () => {
    it("thêm ký ức mới", () => {
      const npc = makeNpc();
      addMemory(npc, { turn: 5, event: "Cứu mạng", emotion: "Biết Ơn", weight: 85 });
      expect(npc["Ký Ức"]).toHaveLength(1);
      expect(npc["Ký Ức"][0]["Sự Việc"]).toBe("Cứu mạng");
    });

    it("deduplicate: cùng Sự Việc → cập nhật trọng số", () => {
      const npc = makeNpc({
        "Ký Ức": [{ "Turn": 1, "Sự Việc": "Gặp gỡ", "Cảm Xúc": "Trung Lập", "Trọng Số": 30 }],
      });
      addMemory(npc, { turn: 5, event: "Gặp gỡ", emotion: "Yêu Mến", weight: 60 });
      expect(npc["Ký Ức"]).toHaveLength(1);
      expect(npc["Ký Ức"][0]["Trọng Số"]).toBe(60);
      expect(npc["Ký Ức"][0]["Cảm Xúc"]).toBe("Yêu Mến");
    });

    it("enforce MAX_MEMORIES = 20", () => {
      const npc = makeNpc({
        "Ký Ức": Array.from({ length: 20 }, (_, i) => ({
          "Turn": i, "Sự Việc": `Event ${i}`, "Cảm Xúc": "Trung Lập" as const, "Trọng Số": 50,
        })),
      });
      addMemory(npc, { turn: 99, event: "Mới", emotion: "Ngưỡng Mộ", weight: 90 });
      expect(npc["Ký Ức"].length).toBeLessThanOrEqual(20);
      // ký ức mới (trọng số 90) phải được giữ
      expect(npc["Ký Ức"].some((m) => m["Sự Việc"] === "Mới")).toBe(true);
    });
  });

  describe("decayAllMemories", () => {
    it("phai ký ức tất cả NPC trong state", () => {
      const stat = makeDefaultState();
      const npc = makeNpc({
        "Ký Ức": [{ "Turn": 1, "Sự Việc": "Test", "Cảm Xúc": "Trung Lập", "Trọng Số": 50 }],
      });
      stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion"] = npc;
      decayAllMemories(stat, 10);
      expect(stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion"]["Ký Ức"][0]["Trọng Số"]).toBe(45);
    });
  });

  describe("formatMemoriesForPrompt", () => {
    it("render ký ức + lời hứa thành block text", () => {
      const stat = makeDefaultState();
      stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion"] = makeNpc({
        "Họ Tên": "Tyrion Lannister",
        "Ký Ức": [
          { "Turn": 5, "Năm": 298, "Sự Việc": "Cứu mạng ở Blackwater", "Cảm Xúc": "Biết Ơn", "Trọng Số": 90 },
        ],
        "Lời Hứa Chưa Giữ": ["Trả nợ vàng"],
      });
      const text = formatMemoriesForPrompt(stat, ["Tyrion"]);
      expect(text).toContain("Tyrion");
      expect(text).toContain("Cứu mạng ở Blackwater");
      expect(text).toContain("Trả nợ vàng");
    });
  });
});
