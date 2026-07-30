import { describe, it, expect } from "vitest";
import { selectKeyNpcs, generateOffscreenAction, runOffscreenSim, tickOffscreenNpcEngine, registerOffscreenLoop } from "./offscreenSim";
import { makeDefaultState } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";
import { runCascadeEffects } from "../mvu/effects";
import { DEFAULT_WORKFLOW_TASKS, useWorkflowStore } from "../state/workflowStore";

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

  describe("tickOffscreenNpcEngine", () => {
    it("ghi hoạt động bền vững cho cả NPC có mục tiêu lẫn NPC không được chọn vào output", () => {
      const stat = makeDefaultState();
      stat["Thế Giới"]["Ngày"] = 2;
      stat["Mối Quan Hệ"]["NPC Chính"]["Cersei"] = makeNpc("Chiếm quyền lực", 70);
      stat["Mối Quan Hệ"]["NPC Chính"]["Viên Quản Gia"] = makeNpc(undefined, 0);

      const result = tickOffscreenNpcEngine(stat);

      expect(result.actions.map((action) => action.npcName)).toEqual(expect.arrayContaining(["Cersei", "Viên Quản Gia"]));
      expect(stat["Mối Quan Hệ"]["NPC Chính"]["Cersei"]["_Hoạt Động Ngoài Cảnh"]?.["Số Lần"]).toBe(1);
      expect(stat["Mối Quan Hệ"]["NPC Chính"]["Viên Quản Gia"]["_Hoạt Động Ngoài Cảnh"]?.["Mô Tả"]).toContain("Viên Quản Gia");
      expect(stat["Mối Quan Hệ"]["NPC Chính"]["Cersei"]["Ký Ức"]).toHaveLength(1);
    });

    it("không chạy lặp một NPC hai lần trong cùng ngày và tôn trọng NPC đang cùng scene", () => {
      const stat = makeDefaultState();
      stat["Mối Quan Hệ"]["NPC Chính"]["Vắng Mặt"] = makeNpc("Bảo vệ lãnh địa", 50);
      stat["Mối Quan Hệ"]["NPC Chính"]["Có Mặt"] = makeNpc("Bảo vệ lãnh địa", 50);
      stat["Mối Quan Hệ"]["NPC Chính"]["Có Mặt"]["Vị Trí Hiện Tại"] = stat["Thế Giới"]["Vị Trí"];

      const first = tickOffscreenNpcEngine(stat);
      const second = tickOffscreenNpcEngine(stat);

      expect(first.actions.map((action) => action.npcName)).toContain("Vắng Mặt");
      expect(first.actions.map((action) => action.npcName)).not.toContain("Có Mặt");
      expect(second.actions).toHaveLength(0);
    });

    it("chạy qua daily workflow khi thời gian trôi, không cần NPC xuất hiện trong phản hồi AI", () => {
      useWorkflowStore.setState({
        enabled: true,
        tasks: DEFAULT_WORKFLOW_TASKS.map((task) => ({ ...task })),
      });
      registerOffscreenLoop();
      const prev = makeDefaultState();
      prev["Mối Quan Hệ"]["NPC Chính"]["Người Gác Cổng"] = makeNpc(undefined, 0);
      const next = structuredClone(prev);
      next["Thế Giới"]["Ngày"] += 1;

      const result = runCascadeEffects(prev, next);

      expect(selectKeyNpcs(prev)).toHaveLength(0);
      expect(result.state["Mối Quan Hệ"]["NPC Chính"]["Người Gác Cổng"]["_Hoạt Động Ngoài Cảnh"]?.["Số Lần"]).toBe(1);
    });

    it("tôn trọng công tắc riêng của nhịp sống NPC trong Workflow", () => {
      useWorkflowStore.setState({
        enabled: true,
        tasks: DEFAULT_WORKFLOW_TASKS.map((task) =>
          task.handlerKey === "offscreen-engine" ? { ...task, enabled: false } : { ...task },
        ),
      });
      registerOffscreenLoop();
      const prev = makeDefaultState();
      prev["Mối Quan Hệ"]["NPC Chính"]["Không Chạy"] = makeNpc(undefined, 0);
      const next = structuredClone(prev);
      next["Thế Giới"]["Ngày"] += 1;

      const result = runCascadeEffects(prev, next);

      expect(result.state["Mối Quan Hệ"]["NPC Chính"]["Không Chạy"]["_Hoạt Động Ngoài Cảnh"]).toBeUndefined();
    });
  });
});
