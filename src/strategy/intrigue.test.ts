/**
 * Acceptance M11 (14): cài điệp viên → thu tin qua các turn + Bị Nghi Ngờ tăng →
 * bị bắt ở ngưỡng; Đại Điệp Viên giảm Bị Cài Điệp Viên; âm mưu chạy Tiến Độ +
 * Độ Bại Lộ vượt ngưỡng → phản đòn, kích hoạt resolve; tống tiền dùng tin tình
 * báo; con tin đòi chuộc / trao đổi / hành quyết.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { NpcSchema } from "../mvu/npcSchema";
import { applyPatch } from "../mvu/patchEngine";
import {
  recruitSpyOps, tickIntelligence, whisperAbility,
  startPlotOps, advancePlotOps, resolvePlot, PLOT_EXPOSURE_THRESHOLD,
  attemptAssassination, blackmailOps, hasIntel,
  ransomOps, exchangeOps, executeOps, setTreatmentOps,
  intrigueAvailable,
} from "./intrigue";

function baseState(gold = 5000): StatData {
  const s = makeDefaultState();
  s["_engineMeta"]["_Seed Gốc"] = 987654;
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = gold;
  return StatDataSchema.parse(s);
}

describe("Tình báo — điệp viên (14.1)", () => {
  it("recruitSpyOps: tốn Vàng, tạo điệp viên; thiếu Vàng → lỗi", () => {
    const s = baseState(600);
    const r = recruitSpyOps(s, "Con Nhện", "Lannister");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(100);
    expect(state["Tình Báo"]["Điệp Viên"]["Con Nhện"]["Cài Ở"]).toBe("Lannister");

    const poor = baseState(100);
    expect(recruitSpyOps(poor, "X", "Y").ok).toBe(false);
  });

  it("tick: thu được tin qua các turn (Thu Thập Tin, thâm nhập cao)", () => {
    const s = baseState();
    s["Tình Báo"]["Điệp Viên"]["Điệp"] = { "Cài Ở": "Lannister", "Độ Sâu Thâm Nhập": 90, "Bị Nghi Ngờ": 0, "Nhiệm Vụ": "Thu Thập Tin" };
    const state = StatDataSchema.parse(s);
    for (let t = 0; t < 20; t++) {
      state["_engineMeta"]["_Nhịp"] = t;
      tickIntelligence(state);
    }
    expect(Object.keys(state["Tình Báo"]["Tin Tình Báo Đã Biết"]).length).toBeGreaterThan(0);
    // thâm nhập cao → nghi ngờ tăng chậm, chưa bị bắt sau 20 turn
    expect(state["Tình Báo"]["Điệp Viên"]["Điệp"]).toBeDefined();
  });

  it("tick: Bị Nghi Ngờ đạt 100 → điệp viên bị bắt + ghi vừa lộ", () => {
    const s = baseState();
    s["Tình Báo"]["Điệp Viên"]["Kẻ Lộ"] = { "Cài Ở": "Tyrell", "Độ Sâu Thâm Nhập": 5, "Bị Nghi Ngờ": 98, "Nhiệm Vụ": "Phá Hoại" };
    const state = StatDataSchema.parse(s);
    tickIntelligence(state);
    expect(state["Tình Báo"]["Điệp Viên"]["Kẻ Lộ"]).toBeUndefined();
    expect(state["Tình Báo"]["_Điệp Viên Vừa Lộ"]).toBe("Kẻ Lộ");
  });

  it("Nằm Vùng hạ nghi ngờ; Đại Điệp Viên giảm Bị Cài Điệp Viên", () => {
    const s = baseState();
    s["Tình Báo"]["Điệp Viên"]["Ẩn"] = { "Cài Ở": "X", "Độ Sâu Thâm Nhập": 30, "Bị Nghi Ngờ": 40, "Nhiệm Vụ": "Nằm Vùng" };
    s["Tình Báo"]["Bị Cài Điệp Viên"] = 50;
    s["Triều Đình"]["Tiểu Hội Đồng"]["Đại Điệp Viên"] = { "Người Giữ Chức": "Varys", "Năng Lực": 90 };
    const state = StatDataSchema.parse(s);
    expect(whisperAbility(state)).toBe(90);
    tickIntelligence(state);
    expect(state["Tình Báo"]["Điệp Viên"]["Ẩn"]["Bị Nghi Ngờ"]).toBeLessThan(40);
    expect(state["Tình Báo"]["Bị Cài Điệp Viên"]).toBeLessThan(50);
  });
});

describe("Âm mưu (14.2)", () => {
  it("advancePlot: Tiến Độ + Độ Bại Lộ tăng; vượt ngưỡng bại lộ → exposed", () => {
    const s = baseState();
    const withPlot = applyPatch(s, startPlotOps("Đêm Máu", { "Loại": "Ám Sát", "Mục Tiêu": "Joffrey", "Đồng Mưu": [] })).state;
    withPlot["Âm Mưu"]["Đêm Máu"]["Độ Bại Lộ"] = 68;
    const r = advancePlotOps(withPlot, "Đêm Máu", 0);
    expect(r.progress).toBeGreaterThan(0);
    expect(r.exposure).toBeGreaterThanOrEqual(PLOT_EXPOSURE_THRESHOLD);
    expect(r.exposed).toBe(true);
  });

  it("resolvePlot: chỉ khi Tiến Độ 100; xoá âm mưu; Ám Sát thành công → mục tiêu chết, thất bại → Nhà thù địch", () => {
    const s = baseState();
    s["Chỉ Số Cốt Lõi"]["Trí Tuệ"] = 16;
    s["Kỹ Năng"]["Mưu Lược"] = { "Cấp": 8, "Kinh Nghiệm": 0, "Nhóm": "Trí Tuệ" };
    s["Mối Quan Hệ"]["NPC Chính"]["Joffrey"] = NpcSchema.parse({ "Họ Tên": "Joffrey", "Nhà": "Lannister", "Năng Lực": { "Trí Mưu": 20, "Võ Lực": 20 } });
    let state = StatDataSchema.parse(s);
    state = applyPatch(state, startPlotOps("Đêm Máu", { "Loại": "Ám Sát", "Mục Tiêu": "Joffrey", "Đồng Mưu": [] })).state;

    expect(resolvePlot(state, "Đêm Máu", 1)).toBeNull(); // Tiến Độ 0

    state["Âm Mưu"]["Đêm Máu"]["Tiến Độ"] = 100;
    const r = resolvePlot(state, "Đêm Máu", 3)!;
    expect(r).not.toBeNull();
    const { state: next } = applyPatch(state, r.ops);
    expect(next["Âm Mưu"]["Đêm Máu"]).toBeUndefined(); // xoá sau kích hoạt
    if (r.success) {
      expect(next["Mối Quan Hệ"]["NPC Chính"]["Joffrey"]["Còn Sống"]).toBe(false);
    } else {
      expect(next["Thái Độ Các Nhà"]["Lannister"]["Thái Độ"]).toBe("Thù Địch");
    }
  });
});

describe("Hành động lẻ (14.3)", () => {
  it("ám sát: điệp viên chuẩn bị cho hoàn cảnh tốt hơn (target cao hơn)", () => {
    const s = baseState();
    s["Mối Quan Hệ"]["NPC Chính"]["Mục Tiêu"] = NpcSchema.parse({ "Họ Tên": "Mục Tiêu", "Nhà": "Bolton", "Năng Lực": { "Võ Lực": 40, "Trí Mưu": 40 } });
    const bare = StatDataSchema.parse(s);
    const rNoPrep = attemptAssassination(bare, "Mục Tiêu", 42);

    const s2 = StatDataSchema.parse(s);
    s2["Tình Báo"]["Điệp Viên"]["Sát Thủ"] = { "Cài Ở": "Bolton", "Độ Sâu Thâm Nhập": 50, "Bị Nghi Ngờ": 0, "Nhiệm Vụ": "Ám Sát (chuẩn bị)" };
    const rPrep = attemptAssassination(s2, "Mục Tiêu", 42);
    expect(rPrep.result.target).toBeGreaterThan(rNoPrep.result.target);
  });

  it("tống tiền: cần tin tình báo mới mở được; dùng xong tiêu tin + NPC oán", () => {
    const s = baseState();
    s["Mối Quan Hệ"]["NPC Chính"]["Petyr"] = NpcSchema.parse({ "Họ Tên": "Petyr", "Độ Hảo Cảm": 20 });
    const noIntel = StatDataSchema.parse(s);
    expect(hasIntel(noIntel)).toBe(false);

    s["Tình Báo"]["Tin Tình Báo Đã Biết"]["Bí mật Petyr"] = "Hắn phản bội chủ cũ.";
    const state = StatDataSchema.parse(s);
    expect(hasIntel(state)).toBe(true);
    const r = blackmailOps(state, "Petyr", "Bí mật Petyr", 7);
    const { state: next } = applyPatch(state, r.ops);
    expect(next["Tình Báo"]["Tin Tình Báo Đã Biết"]["Bí mật Petyr"]).toBeUndefined();
    expect(next["Mối Quan Hệ"]["NPC Chính"]["Petyr"]["Độ Hảo Cảm"]).toBeLessThan(20);
  });
});

describe("Con tin & tù binh (14.4)", () => {
  function withCaptive(): StatData {
    const s = baseState(1000);
    s["Tù Binh"]["Ser Amory"] = { "Họ Tên": "Ser Amory Lorch", "Nhà": "Lannister", "Vai Trò": "Tướng", "Bị Bắt Bởi": "stark", "Giá Chuộc": 2000, "Đối Xử": "Giam Lỏng", "_Ngày Bắt": 5 };
    s["Thái Độ Các Nhà"]["Lannister"] = { "Thái Độ": "Địch Ý", "Mô Tả": "" };
    return StatDataSchema.parse(s);
  }

  it("đòi tiền chuộc → +Vàng, thả, dịu quan hệ", () => {
    const s = withCaptive();
    const { state } = applyPatch(s, ransomOps(s, "Ser Amory"));
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(3000);
    expect(state["Tù Binh"]["Ser Amory"]).toBeUndefined();
  });

  it("trao đổi → thả không lấy Vàng, nâng quan hệ 2 bậc", () => {
    const s = withCaptive();
    const { state } = applyPatch(s, exchangeOps(s, "Ser Amory"));
    expect(state["Tù Binh"]["Ser Amory"]).toBeUndefined();
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(1000); // không đổi
    expect(state["Thái Độ Các Nhà"]["Lannister"]["Thái Độ"]).not.toBe("Địch Ý");
  });

  it("hành quyết → tụt Nhân Từ + Nhà đối phương Thù Địch", () => {
    const s = withCaptive();
    const { state } = applyPatch(s, executeOps(s, "Ser Amory"));
    expect(state["Tù Binh"]["Ser Amory"]).toBeUndefined();
    expect(state["Danh Vọng"]["Nhân Từ"]).toBeLessThan(0);
    expect(state["Thái Độ Các Nhà"]["Lannister"]["Thái Độ"]).toBe("Thù Địch");
  });

  it("đổi cách đối xử Ngục Tối → xấu quan hệ; Khách Quý → dịu", () => {
    const s = withCaptive();
    const worse = applyPatch(s, setTreatmentOps(s, "Ser Amory", "Ngục Tối")).state;
    expect(worse["Tù Binh"]["Ser Amory"]["Đối Xử"]).toBe("Ngục Tối");
    expect(worse["Thái Độ Các Nhà"]["Lannister"]["Thái Độ"]).toBe("Thù Địch"); // Địch Ý → hạ 1 bậc
  });
});

describe("intrigueAvailable (14.5)", () => {
  it("bật khi có điệp viên/âm mưu/con tin, hoặc cai trị", () => {
    const empty = StatDataSchema.parse(makeDefaultState());
    expect(intrigueAvailable(empty)).toBe(false);

    const s = makeDefaultState();
    (s["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>)["the-north"] = { "Nhà Kiểm Soát": "stark", "Là Của Người Chơi": true };
    expect(intrigueAvailable(StatDataSchema.parse(s))).toBe(true);
  });
});
