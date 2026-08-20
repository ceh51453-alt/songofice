import { describe, expect, it } from "vitest";
import { makeDefaultState } from "../mvu/schema";
import { ORIGINS } from "../content/westeros/origins";
import type { ApiChatMessage } from "../types/connection";
import {
  ORIGIN_STORY_PROFILES,
  STORY_CHANNELS,
  buildStoryDrivePrompt,
  decideStoryDrive,
} from "./storyDriveEngine";

function stateFor(originId: string, originName: string) {
  const state = makeDefaultState();
  state["Cài Đặt Ván"]["_ID Xuất Thân"] = [originId];
  state["Thông Tin Nhân Vật"]["Xuất Thân"] = originName;
  return state;
}

function history(...messages: Array<["user" | "assistant", string]>): ApiChatMessage[] {
  return messages.map(([role, content]) => ({ role, content }));
}

describe("story drive theo xuất thân", () => {
  it("mọi xuất thân trong wizard đều có hồ sơ cốt truyện riêng", () => {
    for (const origin of ORIGINS) {
      const profile = ORIGIN_STORY_PROFILES[origin.id];
      expect(profile, origin.id).toBeDefined();
      expect(profile.premise.length, origin.id).toBeGreaterThan(30);
      expect(profile.dilemma.length, origin.id).toBeGreaterThan(30);
      expect(Math.max(...STORY_CHANNELS.map((channel) => profile.weights[channel])), origin.id)
        .toBeGreaterThan(profile.weights.combat);
    }
  });

  it("thương nhân được đẩy bằng kinh tế/chính trị thay vì giao tranh", () => {
    const decision = decideStoryDrive(stateFor("merchant", "Thương Nhân Giàu"), []);
    expect(decision.primary).toBe("economy");
    expect(decision.supporting).toContain("politics");
    expect(decision.scores.economy).toBeGreaterThan(decision.scores.combat);
  });

  it("hạ nhiệt chiến đấu sau hai cảnh võ lực liên tiếp", () => {
    const decision = decideStoryDrive(
      stateFor("knight", "Hiệp Sĩ"),
      history(
        ["assistant", "Hiệp sĩ rút kiếm, giao chiến và chém ngã tên cướp."],
        ["user", "Ta nhìn quanh sân."],
        ["assistant", "Một trận chiến khác nổ ra, máu đổ khi hai phe tấn công."],
        ["user", "Chuyện gì xảy ra tiếp theo?"],
      ),
    );

    expect(decision.combatCooling).toBe(true);
    expect(decision.primary).not.toBe("combat");
    expect(decision.prompt).toContain("KHÔNG tự mở thêm giao tranh");
  });

  it("vẫn tôn trọng khi người chơi chủ động chọn đánh", () => {
    const decision = decideStoryDrive(
      stateFor("knight", "Hiệp Sĩ"),
      history(
        ["assistant", "Hai bên giao chiến và rút kiếm giữa sân."],
        ["assistant", "Trận chiến kéo dài, máu thấm xuống đất."],
        ["user", "Ta rút kiếm tấn công tên phản bội."],
      ),
    );

    expect(decision.explicitIntent).toBe("combat");
    expect(decision.combatCooling).toBe(false);
    expect(decision.primary).toBe("combat");
  });

  it("ghép được hai xuất thân và chỉ dẫn cân bằng vào prompt", () => {
    const state = stateFor("noble-ward", "Con Tin");
    state["Cài Đặt Ván"]["_ID Xuất Thân"] = ["noble-ward", "old-blood"];
    const prompt = buildStoryDrivePrompt(state, []);

    expect(prompt).toContain("Con Tin / Người Được Bảo Hộ");
    expect(prompt).toContain("Kẻ Mang Dòng Máu Cổ");
    expect(prompt).toContain("Thúc đẩy cốt truyện” không đồng nghĩa “bắt đầu đánh nhau”");
  });

  it("save cũ chưa có ID vẫn nhận diện được tên xuất thân", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Xuất Thân"] = "Thương Nhân Giàu";
    const decision = decideStoryDrive(state, []);

    expect(decision.originIds).toEqual(["merchant"]);
    expect(decision.primary).toBe("economy");
  });

  it("không nhận nhầm Con Hoang Quyền Quý thành hai xuất thân ở save cũ", () => {
    const state = makeDefaultState();
    state["Thông Tin Nhân Vật"]["Xuất Thân"] = "Con Hoang Quyền Quý (Great Bastard)";

    expect(decideStoryDrive(state, []).originIds).toEqual(["royal-bastard"]);
  });
});
