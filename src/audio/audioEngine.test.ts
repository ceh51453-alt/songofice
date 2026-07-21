/**
 * audioEngine.test.ts (M16) — Tests cho deriveMood + track selection.
 */
import { describe, it, expect } from "vitest";
import { deriveMood } from "./audioEngine";
import { makeDefaultState } from "../mvu/schema";
import { tracksByMood, availableMoods } from "./tracks";

function makeState(overrides: Record<string, unknown> = {}) {
  const state = makeDefaultState();
  // Deep-apply overrides
  for (const [key, val] of Object.entries(overrides)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val) && key in state) {
      Object.assign(state[key as keyof typeof state] as Record<string, unknown>, val);
    } else {
      (state as Record<string, unknown>)[key] = val;
    }
  }
  return state;
}

describe("audioEngine (M16)", () => {
  describe("deriveMood", () => {
    it("mặc định → peace", () => {
      const state = makeDefaultState();
      expect(deriveMood(state)).toBe("peace");
    });

    it("đang chiến đấu → war", () => {
      const state = makeState();
      state["Trận Đang Diễn"]["_Đang Chiến Đấu"] = true;
      expect(deriveMood(state)).toBe("war");
    });

    it("mùa đông → winter", () => {
      const state = makeState();
      state["Thế Giới"]["Mùa"] = "Đông";
      expect(deriveMood(state)).toBe("winter");
    });

    it("có điệp viên → intrigue", () => {
      const state = makeState();
      (state["Tình Báo"]["Điệp Viên"] as Record<string, unknown>)["spy1"] = {
        "Mục Tiêu": "Lannister",
        "Tiến Độ": 50,
        "Bị Nghi Ngờ": 10,
        "Trạng Thái": "Hoạt Động",
        "Độ Sâu": "Nông",
      };
      expect(deriveMood(state)).toBe("intrigue");
    });

    it("có âm mưu → intrigue", () => {
      const state = makeState();
      (state["Âm Mưu"] as Record<string, unknown>)["plot1"] = {
        "Loại": "Ám Sát",
        "Mục Tiêu": "Joffrey",
        "Tiến Độ": 30,
        "Độ Bại Lộ": 5,
        "Trạng Thái": "Đang Chạy",
      };
      expect(deriveMood(state)).toBe("intrigue");
    });

    it("HP rất thấp → tragedy", () => {
      const state = makeState();
      state["Chỉ Số Sinh Tồn"]["HP"] = 5;
      state["Chỉ Số Phái Sinh"]["_HP Tối Đa"] = 100;
      expect(deriveMood(state)).toBe("tragedy");
    });

    it("vùng bị vây → war", () => {
      const state = makeState();
      (state["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>)["winterfell"] = {
        "Nhà Kiểm Soát": "Stark",
        "Tình Trạng": "Bị Vây",
        "Là Của Người Chơi": true,
        "_Đổi Chủ Turn": 0,
      };
      expect(deriveMood(state)).toBe("war");
    });

    it("nhật ký gần nhất là Chiến Thắng → victory", () => {
      const state = makeState();
      state["Nhật Ký"] = [
        { "Turn": 1, "Năm": 298, "Loại": "Chiến Thắng", "Mô Tả": "Thắng trận Blackwater" },
      ];
      expect(deriveMood(state)).toBe("victory");
    });

    it("war ưu tiên hơn winter", () => {
      const state = makeState();
      state["Thế Giới"]["Mùa"] = "Đông";
      state["Trận Đang Diễn"]["_Đang Chiến Đấu"] = true;
      expect(deriveMood(state)).toBe("war");
    });

    it("tragedy ưu tiên hơn intrigue", () => {
      const state = makeState();
      state["Chỉ Số Sinh Tồn"]["HP"] = 3;
      state["Chỉ Số Phái Sinh"]["_HP Tối Đa"] = 100;
      (state["Âm Mưu"] as Record<string, unknown>)["plot1"] = {
        "Loại": "Ám Sát", "Mục Tiêu": "X", "Tiến Độ": 10, "Độ Bại Lộ": 0, "Trạng Thái": "Đang Chạy",
      };
      expect(deriveMood(state)).toBe("tragedy");
    });
  });

  describe("track registry", () => {
    it("tracksByMood trả mảng (có thể rỗng khi không có file)", () => {
      const result = tracksByMood("peace");
      expect(Array.isArray(result)).toBe(true);
    });

    it("availableMoods trả mảng", () => {
      const moods = availableMoods();
      expect(Array.isArray(moods)).toBe(true);
    });
  });
});
