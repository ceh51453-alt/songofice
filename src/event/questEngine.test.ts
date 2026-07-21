/**
 * questEngine.test.ts — Tests cho hệ thống quest (17.2).
 */
import { describe, it, expect } from "vitest";
import {
  advanceQuests,
  completeObjective,
  failQuest,
  addQuest,
  addJournalEntry,
  countQuests,
} from "./questEngine";
import { makeDefaultState } from "../mvu/schema";

function makeState(turn = 10) {
  const s = makeDefaultState();
  s["_engineMeta"]["turnCount"] = turn;
  s["Thế Giới"]["Năm"] = 298;
  return s;
}

describe("questEngine (17.2)", () => {
  describe("addQuest", () => {
    it("tạo quest mới với trạng thái Đang Làm", () => {
      const s = makeState();
      addQuest(s, "q1", {
        title: "Tim Needle",
        type: "Phụ",
        objectives: ["Hoi Jaqen", "Tim kiem o Braavos"],
        reward: "Needle +5",
      });
      expect(s["Nhiệm Vụ"]["q1"]).toBeDefined();
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Đang Làm");
      expect(s["Nhiệm Vụ"]["q1"]["Mục Tiêu"]).toHaveLength(2);
      expect(s["Nhiệm Vụ"]["q1"]["Mục Tiêu"][0]["Xong"]).toBe(false);
    });

    it("ghi journal khi tạo quest", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "Tim Needle", type: "Phụ", objectives: ["A"] });
      expect(s["Nhật Ký"]).toHaveLength(1);
      expect(s["Nhật Ký"][0]["Loại"]).toBe("Quest");
    });
  });

  describe("completeObjective", () => {
    it("đánh dấu 1 mục tiêu xong", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "Test", type: "Phụ", objectives: ["A", "B"] });
      completeObjective(s, "q1", 0);
      expect(s["Nhiệm Vụ"]["q1"]["Mục Tiêu"][0]["Xong"]).toBe(true);
      expect(s["Nhiệm Vụ"]["q1"]["Mục Tiêu"][1]["Xong"]).toBe(false);
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Đang Làm");
    });

    it("hoàn thành quest khi tất cả mục tiêu xong", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "Test", type: "Phụ", objectives: ["A", "B"] });
      completeObjective(s, "q1", 0);
      const events = completeObjective(s, "q1", 1);
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Hoàn Thành");
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe("stage_up");
    });

    it("không làm gì nếu quest không đang làm", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "Test", type: "Phụ", objectives: ["A"] });
      s["Nhiệm Vụ"]["q1"]["Trạng Thái"] = "Thất Bại";
      const events = completeObjective(s, "q1", 0);
      expect(events).toHaveLength(0);
    });

    it("không làm gì nếu index ngoài mảng", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "Test", type: "Phụ", objectives: ["A"] });
      const events = completeObjective(s, "q1", 5);
      expect(events).toHaveLength(0);
    });
  });

  describe("advanceQuests", () => {
    it("thất bại quest quá hạn", () => {
      const s = makeState(20);
      addQuest(s, "q1", {
        title: "Het han",
        type: "Phụ",
        objectives: ["A"],
        deadlineTurn: 15,
      });
      s["Nhiệm Vụ"]["q1"]["Trạng Thái"] = "Đang Làm";
      const events = advanceQuests(s);
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Thất Bại");
      expect(events).toHaveLength(1);
    });

    it("không thất bại quest chưa quá hạn", () => {
      const s = makeState(10);
      addQuest(s, "q1", {
        title: "Chua het han",
        type: "Phụ",
        objectives: ["A"],
        deadlineTurn: 50,
      });
      s["Nhiệm Vụ"]["q1"]["Trạng Thái"] = "Đang Làm";
      const events = advanceQuests(s);
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Đang Làm");
      expect(events).toHaveLength(0);
    });

    it("không đụng quest không có deadline", () => {
      const s = makeState(999);
      addQuest(s, "q1", { title: "Vo han", type: "Phụ", objectives: ["A"] });
      s["Nhiệm Vụ"]["q1"]["Trạng Thái"] = "Đang Làm";
      const events = advanceQuests(s);
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Đang Làm");
      expect(events).toHaveLength(0);
    });
  });

  describe("failQuest", () => {
    it("chuyển quest sang Thất Bại", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "That bai", type: "Phụ", objectives: ["A"] });
      s["Nhiệm Vụ"]["q1"]["Trạng Thái"] = "Đang Làm";
      const events = failQuest(s, "q1");
      expect(s["Nhiệm Vụ"]["q1"]["Trạng Thái"]).toBe("Thất Bại");
      expect(events).toHaveLength(1);
    });
  });

  describe("addJournalEntry", () => {
    it("thêm entry vào nhật ký", () => {
      const s = makeState();
      addJournalEntry(s, {
        Turn: 5,
        "Năm": 298,
        "Loại": "Chiến Thắng",
        "Mô Tả": "Thang tran Blackwater",
      });
      expect(s["Nhật Ký"]).toHaveLength(1);
      expect(s["Nhật Ký"][0]["Loại"]).toBe("Chiến Thắng");
    });
  });

  describe("countQuests", () => {
    it("đếm đúng trạng thái", () => {
      const s = makeState();
      addQuest(s, "q1", { title: "A", type: "Phụ", objectives: ["x"] });
      addQuest(s, "q2", { title: "B", type: "Phụ", objectives: ["y"] });
      addQuest(s, "q3", { title: "C", type: "Phụ", objectives: ["z"] });
      s["Nhiệm Vụ"]["q2"]["Trạng Thái"] = "Hoàn Thành";
      s["Nhiệm Vụ"]["q3"]["Trạng Thái"] = "Thất Bại";
      const c = countQuests(s);
      expect(c.active).toBe(1);
      expect(c.completed).toBe(1);
      expect(c.failed).toBe(1);
    });
  });
});
