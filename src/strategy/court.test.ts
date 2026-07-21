/**
 * Acceptance M10 (13.1-13.2): bổ nhiệm ghế Tiểu Hội Đồng → Năng Lực suy từ NPC
 * theo lĩnh vực chức vụ; Đại Chưởng Ngân Khố Năng Lực cao → hệ số thu Vàng > 1;
 * thẩm quyền bổ nhiệm chỉ khi cai trị; tickCourt đồng bộ Năng Lực từ NPC.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { NpcSchema } from "../mvu/npcSchema";
import { applyPatch } from "../mvu/patchEngine";
import {
  appointOps, dismissOps, treasuryMultiplier, canAppoint, courtInvolved,
  playerIsRulingLord, abilityForPosition, tickCourt, isSeatFilled,
} from "./court";

function stateWith(npcs: Record<string, ReturnType<typeof NpcSchema.parse>>): StatData {
  const s = makeDefaultState();
  s["Mối Quan Hệ"]["NPC Chính"] = npcs;
  return StatDataSchema.parse(s);
}

const tyrion = NpcSchema.parse({ "Họ Tên": "Tyrion Lannister", "Nhà": "Lannister", "Năng Lực": { "Trí Mưu": 90, "Ngoại Giao": 70, "Thống Soái": 45, "Võ Lực": 20 } });
const stannisAdmiral = NpcSchema.parse({ "Họ Tên": "Ser Davos", "Năng Lực": { "Thống Soái": 80, "Trí Mưu": 55 } });

describe("Tiểu Hội Đồng — bổ nhiệm (13.1/13.2)", () => {
  it("appointOps: Năng Lực ghế lấy theo lĩnh vực chức vụ (Ngân Khố → Trí Mưu)", () => {
    const s = stateWith({ "Tyrion Lannister": tyrion });
    const { state } = applyPatch(s, appointOps(s, "Đại Chưởng Ngân Khố", "Tyrion Lannister"));
    const seat = state["Triều Đình"]["Tiểu Hội Đồng"]["Đại Chưởng Ngân Khố"];
    expect(seat["Người Giữ Chức"]).toBe("Tyrion Lannister");
    expect(seat["Năng Lực"]).toBe(90); // Trí Mưu
    expect(state["Triều Đình"]["Có Liên Quan"]).toBe(true);
    expect(isSeatFilled(seat)).toBe(true);
  });

  it("Đô Đốc Hạm Đội → Thống Soái", () => {
    const s = stateWith({ "Ser Davos": stannisAdmiral });
    expect(abilityForPosition(stannisAdmiral, "Đô Đốc Hạm Đội")).toBe(80);
    const { state } = applyPatch(s, appointOps(s, "Đô Đốc Hạm Đội", "Ser Davos"));
    expect(state["Triều Đình"]["Tiểu Hội Đồng"]["Đô Đốc Hạm Đội"]["Năng Lực"]).toBe(80);
  });

  it("dismissOps: ghế về Khuyết + Năng Lực trung tính", () => {
    const s = stateWith({ "Tyrion Lannister": tyrion });
    const appointed = applyPatch(s, appointOps(s, "Bàn Tay Nhà Vua", "Tyrion Lannister")).state;
    const { state } = applyPatch(appointed, dismissOps("Bàn Tay Nhà Vua"));
    const seat = state["Triều Đình"]["Tiểu Hội Đồng"]["Bàn Tay Nhà Vua"];
    expect(seat["Người Giữ Chức"]).toBe("Khuyết");
    expect(isSeatFilled(seat)).toBe(false);
  });
});

describe("Hiệu ứng Năng Lực → thu Vàng (13.1 → 10.3)", () => {
  it("ghế Ngân Khố khuyết = ×1; Năng Lực cao → >1; thấp → <1; clamp", () => {
    const s = stateWith({ "Tyrion Lannister": tyrion });
    expect(treasuryMultiplier(s)).toBe(1); // khuyết

    const high = applyPatch(s, appointOps(s, "Đại Chưởng Ngân Khố", "Tyrion Lannister")).state;
    expect(treasuryMultiplier(high)).toBeGreaterThan(1);

    // Năng Lực rất thấp → dưới 1 nhưng không dưới sàn 0.85
    const badCoin = NpcSchema.parse({ "Họ Tên": "Kẻ Bất Tài", "Năng Lực": { "Trí Mưu": 0 } });
    const s2 = stateWith({ "Kẻ Bất Tài": badCoin });
    const low = applyPatch(s2, appointOps(s2, "Đại Chưởng Ngân Khố", "Kẻ Bất Tài")).state;
    expect(treasuryMultiplier(low)).toBeLessThan(1);
    expect(treasuryMultiplier(low)).toBeGreaterThanOrEqual(0.85);
  });
});

describe("Thẩm quyền + dính líu (13.2/13.5)", () => {
  it("mặc định: không cai trị → không có quyền bổ nhiệm, chưa dính líu triều chính", () => {
    const s = StatDataSchema.parse(makeDefaultState());
    expect(playerIsRulingLord(s)).toBe(false);
    expect(canAppoint(s)).toBe(false);
    expect(courtInvolved(s)).toBe(false);
  });

  it("sở hữu ≥1 vùng → cai trị → có quyền bổ nhiệm + dính líu", () => {
    const s = makeDefaultState();
    (s["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>)["the-north"] = { "Nhà Kiểm Soát": "stark", "Là Của Người Chơi": true };
    const state = StatDataSchema.parse(s);
    expect(playerIsRulingLord(state)).toBe(true);
    expect(canAppoint(state)).toBe(true);
    expect(courtInvolved(state)).toBe(true);
  });

  it("cờ Quyền Bổ Nhiệm do AI đặt cũng cho phép bổ nhiệm dù không cai trị", () => {
    const s = makeDefaultState();
    s["Triều Đình"]["Quyền Bổ Nhiệm"] = true;
    const state = StatDataSchema.parse(s);
    expect(canAppoint(state)).toBe(true);
  });
});

describe("tickCourt — đồng bộ Năng Lực từ NPC", () => {
  it("Năng Lực NPC đổi → tick cập nhật lại ghế", () => {
    const s = stateWith({ "Tyrion Lannister": tyrion });
    const state = applyPatch(s, appointOps(s, "Đại Chưởng Ấn", "Tyrion Lannister")).state;
    // AI kể Tyrion mài giũa tài ngoại giao → Ngoại Giao tăng
    state["Mối Quan Hệ"]["NPC Chính"]["Tyrion Lannister"]["Năng Lực"]["Ngoại Giao"] = 95;
    tickCourt(state);
    expect(state["Triều Đình"]["Tiểu Hội Đồng"]["Đại Chưởng Ấn"]["Năng Lực"]).toBe(95);
  });
});
