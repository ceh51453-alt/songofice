/**
 * INTEGRATION M10 — cung đình + hôn nhân/kế vị qua store + turn-advance:
 * - lãnh chúa cai trị → dính líu triều chính + có quyền bổ nhiệm (13.2/13.5),
 * - bổ nhiệm Đại Chưởng Ngân Khố giỏi → hệ số thu Vàng >1, advanceDays tăng Vàng (13.1→10.3),
 * - hôn nhân qua courtStore → của hồi môn + Thái Độ Nhà đối tác (13.4),
 * - hôn ước: chấp nhận → cưới + xoá đề nghị,
 * - kế vị: thêm gia tộc + luật → turn loop suy heir; heir mất → khủng hoảng + heir mới,
 * - council_session parse thành lựa chọn quyết định (13.3).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useMvuStore } from "../state/mvuStore";
import { useCourtStore } from "../state/courtStore";
import { makeDefaultState, StatDataSchema } from "../mvu/schema";
import { NpcSchema } from "../mvu/npcSchema";
import { seedRegionControl } from "../territory/territoryEngine";
import { registerConstructionLoop } from "../territory/construction";
import { registerEconomyLoop } from "../economy/economyEngine";
import { registerCourtLoop, canAppoint, courtInvolved, treasuryMultiplier } from "../strategy/court";
import { registerSuccessionLoop, proposeBetrothalOps } from "../strategy/succession";
import { applyPatch } from "../mvu/patchEngine";
import { parseCouncilSession } from "../ui/tags/parseNarrative";

function advanceDays(n: number) {
  useMvuStore.getState().applyAiOps([{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: n }]);
}

const fm = (name: string, gioi: "Nam" | "Nữ", tuoi: number) =>
  NpcSchema.parse({ "Họ Tên": name, "Giới Tính": gioi, "Tuổi": tuoi, "Còn Sống": true });

beforeEach(() => {
  registerConstructionLoop();
  registerEconomyLoop(); // thuế & hệ số Đại Chưởng Ngân Khố chốt ở sổ thu chi (M18)
  registerCourtLoop();
  registerSuccessionLoop();
  useMvuStore.getState().newGame();
  useCourtStore.setState({ selectedSeat: null, appointFor: null });
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 5000;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  useMvuStore.setState({ stat: StatDataSchema.parse(s), pendingEvents: [], lastChangedPaths: [] });
});

describe("M10 — dính líu + thẩm quyền triều chính (13.2/13.5)", () => {
  it("lãnh chúa cai trị Winterfell → courtInvolved + canAppoint", () => {
    const stat = useMvuStore.getState().stat;
    expect(courtInvolved(stat)).toBe(true);
    expect(canAppoint(stat)).toBe(true);
  });
});

describe("M10 — bổ nhiệm Tiểu Hội Đồng + hiệu ứng thu Vàng (13.1)", () => {
  it("bổ nhiệm Ngân Khố giỏi → hệ số thu Vàng >1 → advanceDays tăng Vàng", () => {
    // thêm NPC tài trí + bổ nhiệm làm Đại Chưởng Ngân Khố
    const s = useMvuStore.getState().stat;
    s["Mối Quan Hệ"]["NPC Chính"]["Petyr Baelish"] = NpcSchema.parse({ "Họ Tên": "Petyr Baelish", "Năng Lực": { "Trí Mưu": 95 } });
    useMvuStore.setState({ stat: s });

    useCourtStore.getState().appoint("Đại Chưởng Ngân Khố", "Petyr Baelish");
    const after = useMvuStore.getState().stat;
    expect(after["Triều Đình"]["Tiểu Hội Đồng"]["Đại Chưởng Ngân Khố"]["Người Giữ Chức"]).toBe("Petyr Baelish");
    expect(after["Triều Đình"]["Có Liên Quan"]).toBe(true);
    expect(treasuryMultiplier(after)).toBeGreaterThan(1);

    const goldBefore = after["Thông Tin Nhân Vật"]["Ngân Khố"];
    advanceDays(31); // sang tháng mới → loop thu lãnh địa cộng Vàng ×hệ số Ngân Khố
    expect(useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeGreaterThan(goldBefore);
  });
});

describe("M10 — hôn nhân & hôn ước (13.4)", () => {
  it("cưới NPC → của hồi môn + quan hệ Vợ/Chồng + nâng Thái Độ", () => {
    const s = useMvuStore.getState().stat;
    s["Thái Độ Các Nhà"]["Tully"] = { "Thái Độ": "Cảnh Giác", "Mô Tả": "" };
    useMvuStore.setState({ stat: s });

    useCourtStore.getState().marry("Catelyn Tully", {
      partner: "Eddard Stark", partnerHouse: "tully", dowry: 1000, dowryOutgoing: false, asSpouseOfPlayer: true, createIfMissing: true,
    });
    const after = useMvuStore.getState().stat;
    expect(after["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(6000);
    expect(after["Mối Quan Hệ"]["NPC Chính"]["Catelyn Tully"]["Loại Quan Hệ"]).toContain("Vợ/Chồng");
    expect(after["Thái Độ Các Nhà"]["Tully"]["Thái Độ"]).not.toBe("Cảnh Giác");
  });

  it("hôn ước: đề nghị → chấp nhận → cưới + xoá đề nghị", () => {
    const st = applyPatch(useMvuStore.getState().stat, proposeBetrothalOps("tyrell", {
      "Đối Tượng": "Margaery Tyrell", "Nhà Đối Tác": "tyrell", "Của Hồi Môn": 0, "Chi Trả": "Ta Nhận", "Lợi Ích Chính Trị": "Liên minh Reach",
    })).state;
    useMvuStore.setState({ stat: st });

    const r = useCourtStore.getState().acceptBetrothal("tyrell");
    expect(r.ok).toBe(true);
    const after = useMvuStore.getState().stat;
    expect(after["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"]["tyrell"]).toBeUndefined();
    expect(after["Mối Quan Hệ"]["NPC Chính"]["Margaery Tyrell"]).toBeDefined();
  });
});

describe("M10 — kế vị qua turn loop + khủng hoảng (13.4)", () => {
  it("thêm gia tộc + luật → advanceDays suy heir; heir mất → khủng hoảng + heir mới", () => {
    const s = useMvuStore.getState().stat;
    s["Mối Quan Hệ"]["Thành Viên Gia Tộc"] = { Robb: fm("Robb", "Nam", 16), Sansa: fm("Sansa", "Nữ", 13), Bran: fm("Bran", "Nam", 10) };
    s["Gia Tộc Học"]["Luật Kế Vị"] = "Trưởng Nam";
    useMvuStore.setState({ stat: s });

    advanceDays(1); // tickSuccession suy thứ tự
    expect(useMvuStore.getState().stat["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Robb");

    // Robb tử trận → advanceDays → khủng hoảng + heir mới (nam kế tiếp)
    const s2 = useMvuStore.getState().stat;
    s2["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Còn Sống"] = false;
    useMvuStore.setState({ stat: s2 });
    advanceDays(1);

    const after = useMvuStore.getState().stat;
    expect(after["Gia Tộc Học"]["_Khủng Hoảng Kế Vị"]).toBe(true);
    expect(after["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Bran");
  });
});

describe("M10 — phiên họp triều (13.3)", () => {
  it("council_session parse thành 2-3 lựa chọn quyết định kèm hé lộ hệ quả", () => {
    const c = parseCouncilSession(
      "- Tăng thuế chiến tranh — +Vàng, −Trung Thành\n- Cắt giảm chi tiêu triều đình — −Uy Tín",
      { issue: "Ngân khố cạn kiệt", attendees: "Tyrion, Varys" },
    );
    expect(c.choices).toHaveLength(2);
    expect(c.choices[0].label).toBe("Tăng thuế chiến tranh");
    expect(c.attendees).toEqual(["Tyrion", "Varys"]);
  });
});
