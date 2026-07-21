/**
 * timelineEngine.test.ts — Tests cho engine cột mốc lịch sử (17.3).
 */
import { describe, it, expect } from "vitest";
import {
  checkTimelineBeats,
  applyBeat,
  markBeatAltered,
  getUpcomingBeats,
  getPastBeats,
} from "./timelineEngine";
import type { TimelineBeat } from "../content/westeros/events/timelineBeats";
import { makeDefaultState } from "../mvu/schema";

const sampleBeats: TimelineBeat[] = [
  {
    id: "ned-executed",
    eraId: "war-of-five-kings",
    year: 298,
    title: "Ned Stark Bị Xử Tử",
    description: "Joffrey ra lệnh chém đầu Ned Stark.",
  },
  {
    id: "red-wedding",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Đám Cưới Đỏ",
    description: "Robb Stark bị giết tại Twins.",
  },
  {
    id: "battle-of-blackwater",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Trận Blackwater",
    description: "Stannis tấn công King's Landing.",
  },
  {
    id: "purple-wedding",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Đám Cưới Tím",
    description: "Joffrey bị đầu độc.",
  },
];

function makeState(year: number, mode: "Theo Sát Nguyên Tác" | "Diễn Giải Tự Do" = "Theo Sát Nguyên Tác") {
  const s = makeDefaultState();
  s["Thế Giới"]["Năm"] = year;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  s["Cài Đặt Ván"]["Chế Độ Tường Thuật"] = mode;
  return s;
}

describe("timelineEngine (17.3)", () => {
  describe("checkTimelineBeats", () => {
    it("trigger beat khi năm chạm — Theo Sát Nguyên Tác", () => {
      const s = makeState(298);
      const triggered = checkTimelineBeats(s, sampleBeats);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].beat.id).toBe("ned-executed");
      expect(triggered[0].canonical).toBe(true);
    });

    it("trigger nhiều beat khi năm vượt qua", () => {
      const s = makeState(300);
      const triggered = checkTimelineBeats(s, sampleBeats);
      // Tất cả 4 beat đều có year <= 300
      expect(triggered).toHaveLength(4);
    });

    it("không trigger beat đã xảy ra", () => {
      const s = makeState(300);
      s["Cột Mốc Lịch Sử"]["ned-executed"] = {
        "Đã Xảy Ra": true,
        "Bị Thay Đổi": false,
        "Năm Xảy Ra": 298,
      };
      const triggered = checkTimelineBeats(s, sampleBeats);
      expect(triggered).toHaveLength(3); // 4 - 1 đã xảy ra
      expect(triggered.find((t) => t.beat.id === "ned-executed")).toBeUndefined();
    });

    it("Diễn Giải Tự Do: canonical = false", () => {
      const s = makeState(298, "Diễn Giải Tự Do");
      const triggered = checkTimelineBeats(s, sampleBeats);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].canonical).toBe(false);
    });

    it("không trigger beat của era khác", () => {
      const s = makeState(298);
      s["Cài Đặt Ván"]["Thời Kỳ"] = "aegon-conquest";
      const triggered = checkTimelineBeats(s, sampleBeats);
      expect(triggered).toHaveLength(0);
    });

    it("không trigger beat năm chưa tới", () => {
      const s = makeState(250);
      const triggered = checkTimelineBeats(s, sampleBeats);
      expect(triggered).toHaveLength(0);
    });
  });

  describe("applyBeat", () => {
    it("đánh dấu Đã Xảy Ra và ghi nhật ký", () => {
      const s = makeState(298);
      applyBeat(s, sampleBeats[0]);
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Đã Xảy Ra"]).toBe(true);
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Bị Thay Đổi"]).toBe(false);
      expect(s["Nhật Ký"]).toHaveLength(1);
      expect(s["Nhật Ký"][0]["Loại"]).toBe("Cột Mốc");
    });

    it("altered = true khi người chơi thay đổi", () => {
      const s = makeState(298);
      applyBeat(s, sampleBeats[0], true);
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Bị Thay Đổi"]).toBe(true);
      expect(s["Nhật Ký"][0]["Mô Tả"]).toContain("THAY ĐỔI");
    });
  });

  describe("markBeatAltered", () => {
    it("đánh dấu beat đã tồn tại là bị thay đổi", () => {
      const s = makeState(298);
      applyBeat(s, sampleBeats[0]);
      markBeatAltered(s, "ned-executed");
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Bị Thay Đổi"]).toBe(true);
    });

    it("tạo mới entry nếu chưa có", () => {
      const s = makeState(298);
      markBeatAltered(s, "ned-executed");
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Đã Xảy Ra"]).toBe(true);
      expect(s["Cột Mốc Lịch Sử"]["ned-executed"]["Bị Thay Đổi"]).toBe(true);
    });
  });

  describe("getUpcomingBeats", () => {
    it("trả beats chưa xảy ra và năm > hiện tại", () => {
      const s = makeState(298);
      const upcoming = getUpcomingBeats(s, sampleBeats);
      // red-wedding (299), blackwater (299), purple-wedding (300) chưa xảy ra và năm > 298
      expect(upcoming).toHaveLength(3);
      expect(upcoming[0].year).toBe(299);
    });

    it("giới hạn số lượng", () => {
      const s = makeState(298);
      const upcoming = getUpcomingBeats(s, sampleBeats, 2);
      expect(upcoming).toHaveLength(2);
    });

    it("không trả beat đã xảy ra", () => {
      const s = makeState(298);
      s["Cột Mốc Lịch Sử"]["red-wedding"] = {
        "Đã Xảy Ra": true,
        "Bị Thay Đổi": false,
        "Năm Xảy Ra": 299,
      };
      const upcoming = getUpcomingBeats(s, sampleBeats);
      expect(upcoming.find((b) => b.id === "red-wedding")).toBeUndefined();
    });
  });

  describe("getPastBeats", () => {
    it("trả beats đã xảy ra với altered flag", () => {
      const s = makeState(300);
      applyBeat(s, sampleBeats[0]); // ned-executed
      applyBeat(s, sampleBeats[1], true); // red-wedding (altered)

      const past = getPastBeats(s, sampleBeats);
      expect(past).toHaveLength(2);
      expect(past[0].id).toBe("ned-executed");
      expect(past[0].altered).toBe(false);
      expect(past[1].id).toBe("red-wedding");
      expect(past[1].altered).toBe(true);
    });
  });
});
