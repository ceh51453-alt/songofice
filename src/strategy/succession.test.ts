/**
 * Acceptance M10 (13.4): thứ tự kế vị suy đúng theo luật (Trưởng Nam nam-trước-nữ /
 * Dorne bất kể giới / Sắt bầu chọn); hôn nhân chuyển của hồi môn + nâng Thái Độ Nhà
 * đối tác + gắn quan hệ Vợ/Chồng; hôn ước chấp nhận/từ chối; khủng hoảng khi heir mất.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { NpcSchema } from "../mvu/npcSchema";
import { applyPatch } from "../mvu/patchEngine";
import {
  successionOrder, reconcileSuccessionOps, setSuccessionLawOps, designateHeirOps,
  marriageOps, proposeBetrothalOps, acceptBetrothalOps, rejectBetrothalOps,
  successionCrisisInfo, tickSuccession,
  setFamilyBranchOps, assignFamilyDutyOps, recommendHeirFromStory,
} from "./succession";

const fm = (name: string, gioi: "Nam" | "Nữ", tuoi: number, vo = 30) =>
  NpcSchema.parse({ "Họ Tên": name, "Giới Tính": gioi, "Tuổi": tuoi, "Còn Sống": true, "Năng Lực": { "Võ Lực": vo } });

function famState(law: StatData["Gia Tộc Học"]["Luật Kế Vị"], order: string[] = []): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Gia Tộc Học"]["Luật Kế Vị"] = law;
  s["Gia Tộc Học"]["Thứ Tự Kế Vị"] = order;
  s["Mối Quan Hệ"]["Thành Viên Gia Tộc"] = {
    Robb: fm("Robb", "Nam", 16, 70),
    Sansa: fm("Sansa", "Nữ", 13, 10),
    Arya: fm("Arya", "Nữ", 11, 40),
    Bran: fm("Bran", "Nam", 10, 20),
  };
  return StatDataSchema.parse(s);
}

describe("Thứ tự kế vị theo luật (13.4)", () => {
  it("Trưởng Nam: nam trước nữ, trong giới theo tuổi giảm", () => {
    expect(successionOrder(famState("Trưởng Nam"))).toEqual(["Robb", "Bran", "Sansa", "Arya"]);
  });
  it("Dorne (Trưởng Tử Bất Kể Giới): thuần theo tuổi giảm", () => {
    expect(successionOrder(famState("Trưởng Tử Bất Kể Giới (Dorne)"))).toEqual(["Robb", "Sansa", "Arya", "Bran"]);
  });
  it("Bầu Chọn (Sắt): xếp theo Võ Lực (kingsmoot)", () => {
    expect(successionOrder(famState("Bầu Chọn (Sắt)"))).toEqual(["Robb", "Arya", "Bran", "Sansa"]);
  });
  it("Chỉ Định: giữ thứ tự đã đặt, thêm phần còn thiếu ở cuối", () => {
    const order = successionOrder(famState("Chỉ Định", ["Bran", "Robb"]));
    expect(order.slice(0, 2)).toEqual(["Bran", "Robb"]);
    expect(order).toHaveLength(4);
  });
});

describe("Đồng bộ heir + đổi luật (13.4)", () => {
  it("giáng dòng phụ loại khỏi kế vị; chỉ định lại sẽ tự nâng dòng chính", () => {
    const s = famState("Trưởng Nam");
    const demoted = applyPatch(s, setFamilyBranchOps(s, "Robb", "Dòng Phụ")).state;
    expect(demoted["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Nhánh Gia Tộc"]).toBe("Dòng Phụ");
    expect(demoted["Gia Tộc Học"]["Thứ Tự Kế Vị"]).not.toContain("Robb");
    const restored = applyPatch(demoted, designateHeirOps(demoted, "Robb")).state;
    expect(restored["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Nhánh Gia Tộc"]).toBe("Dòng Chính");
    expect(restored["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Robb");
  });

  it("ghi nhiệm vụ hậu duệ và gợi ý thừa kế từ diễn biến", () => {
    const s = famState("Trưởng Nam");
    s["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Arya"]["Ký Ức"] = [{
      "Sự Việc": "Arya cứu Winterfell trong một cuộc đột kích",
      "Cảm Xúc": "Ngưỡng Mộ",
      "Trọng Số": 100,
      "Ngày": 1,
      "Tháng": 1,
    }];
    const assigned = applyPatch(s, assignFamilyDutyOps(s, "Arya", "Ra Trận", "The Twins")).state;
    expect(assigned["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Arya"]["Nhiệm Vụ Gia Tộc"]).toBe("Ra Trận");
    expect(assigned["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Arya"]["Mục Tiêu Nhiệm Vụ"]).toBe("The Twins");
    expect(recommendHeirFromStory(s)?.evidence).toContain("Arya cứu Winterfell trong một cuộc đột kích");
  });

  it("reconcile: Người Thừa Kế Hiện Tại + cờ NPC cập nhật", () => {
    const s = famState("Trưởng Nam");
    const { state } = applyPatch(s, reconcileSuccessionOps(s));
    expect(state["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Robb");
    expect(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Người Thừa Kế"]).toBe(true);
    expect(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Thứ Bậc Kế Vị"]).toBe(1);
    expect(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Bran"]["Thứ Bậc Kế Vị"]).toBe(2);
  });

  it("đổi luật sang Dorne → thứ tự tính lại", () => {
    const s = famState("Trưởng Nam");
    const { state } = applyPatch(s, setSuccessionLawOps(s, "Trưởng Tử Bất Kể Giới (Dorne)"));
    expect(state["Gia Tộc Học"]["Luật Kế Vị"]).toBe("Trưởng Tử Bất Kể Giới (Dorne)");
    expect(state["Gia Tộc Học"]["Thứ Tự Kế Vị"]).toEqual(["Robb", "Sansa", "Arya", "Bran"]);
  });

  it("designateHeir: chuyển sang Chỉ Định + heir được chọn lên đầu + gỡ khủng hoảng", () => {
    const s = famState("Trưởng Nam");
    s["Gia Tộc Học"]["_Khủng Hoảng Kế Vị"] = true;
    const { state } = applyPatch(s, designateHeirOps(s, "Arya"));
    expect(state["Gia Tộc Học"]["Luật Kế Vị"]).toBe("Chỉ Định");
    expect(state["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Arya");
    expect(state["Gia Tộc Học"]["_Khủng Hoảng Kế Vị"]).toBe(false);
  });
});

describe("Hôn nhân chính trị (13.4)", () => {
  it("cưới → nhận của hồi môn + quan hệ Vợ/Chồng + nâng Thái Độ Nhà đối tác", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Ngân Khố"] = 5000;
    s["Thái Độ Các Nhà"]["Tyrell"] = { "Thái Độ": "Cảnh Giác", "Mô Tả": "" };
    const state = StatDataSchema.parse(s);
    const ops = marriageOps(state, "Margaery Tyrell", {
      partner: "Eddard", partnerHouse: "tyrell", dowry: 1000, dowryOutgoing: false, asSpouseOfPlayer: true, createIfMissing: true,
    });
    const { state: next } = applyPatch(state, ops);
    expect(next["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(6000);
    const spouse = next["Mối Quan Hệ"]["NPC Chính"]["Margaery Tyrell"];
    expect(spouse["Đã Kết Hôn Với"]).toBe("Eddard");
    expect(spouse["Loại Quan Hệ"]).toContain("Vợ/Chồng");
    expect(next["Thái Độ Các Nhà"]["Tyrell"]["Thái Độ"]).not.toBe("Cảnh Giác");
  });

  it("của hồi môn ta trả → trừ Vàng", () => {
    const s = StatDataSchema.parse({ ...makeDefaultState(), });
    s["Thông Tin Nhân Vật"]["Ngân Khố"] = 2000;
    const ops = marriageOps(s, "Ai Đó", { partner: "Ta", dowry: 800, dowryOutgoing: true, createIfMissing: true });
    const { state } = applyPatch(s, ops);
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(1200);
  });
});

describe("Hôn ước đang thương lượng (13.4)", () => {
  it("đề nghị → chấp nhận: cưới + xoá khỏi hàng thương lượng + nhận hồi môn", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
    s["Thông Tin Nhân Vật"]["Ngân Khố"] = 3000;
    let st = StatDataSchema.parse(s);
    st = applyPatch(st, proposeBetrothalOps("tyrell-offer", {
      "Đối Tượng": "Margaery Tyrell", "Nhà Đối Tác": "tyrell", "Của Hồi Môn": 500, "Chi Trả": "Ta Nhận", "Lợi Ích Chính Trị": "Liên minh Reach",
    })).state;
    expect(st["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"]["tyrell-offer"]).toBeDefined();

    st = applyPatch(st, acceptBetrothalOps(st, "tyrell-offer")).state;
    expect(st["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"]["tyrell-offer"]).toBeUndefined();
    expect(st["Mối Quan Hệ"]["NPC Chính"]["Margaery Tyrell"]).toBeDefined();
    expect(st["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(3500);
  });

  it("từ chối → chỉ xoá khỏi hàng thương lượng", () => {
    const s = StatDataSchema.parse(makeDefaultState());
    let st = applyPatch(s, proposeBetrothalOps("x", { "Đối Tượng": "A", "Nhà Đối Tác": "lannister", "Của Hồi Môn": 0, "Chi Trả": "Ta Nhận", "Lợi Ích Chính Trị": "" })).state;
    st = applyPatch(st, rejectBetrothalOps("x")).state;
    expect(st["Gia Tộc Học"]["Hôn Ước Đang Thương Lượng"]["x"]).toBeUndefined();
  });
});

describe("Khủng hoảng kế vị (13.4)", () => {
  it("người thừa kế mất → cờ khủng hoảng + heir mới được suy ra", () => {
    const s = famState("Trưởng Nam");
    const state = applyPatch(s, reconcileSuccessionOps(s)).state;
    expect(state["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Robb");

    // Robb tử trận
    state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Robb"]["Còn Sống"] = false;
    expect(successionCrisisInfo(state).inCrisis).toBe(true);

    tickSuccession(state);
    expect(state["Gia Tộc Học"]["_Khủng Hoảng Kế Vị"]).toBe(true);
    expect(state["Gia Tộc Học"]["Người Thừa Kế Hiện Tại"]).toBe("Bran"); // nam kế tiếp còn sống
  });

  it("luật Bầu Chọn với ≥2 ứng viên → khủng hoảng (kingsmoot)", () => {
    expect(successionCrisisInfo(famState("Bầu Chọn (Sắt)")).inCrisis).toBe(true);
  });

  it("dòng họ ổn định (Trưởng Nam, heir còn sống) → không khủng hoảng", () => {
    const s = famState("Trưởng Nam");
    const state = applyPatch(s, reconcileSuccessionOps(s)).state;
    expect(successionCrisisInfo(state).inCrisis).toBe(false);
  });
});
