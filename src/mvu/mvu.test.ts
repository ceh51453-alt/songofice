import { describe, expect, it } from "vitest";
import { makeDefaultState } from "./schema";
import { applyPatch, type PatchOp } from "./patchEngine";
import { extractUpdates, rejectReason } from "./extractor";
import { runCascadeEffects, recomputeDerived, parseEffect, registerTurnListener, DAYS_PER_YEAR } from "./effects";
import { affinityStage, lifeStage } from "./npcSchema";
import { renderStateForAI } from "./stateRenderer";

function makeState() {
  const s = makeDefaultState();
  recomputeDerived(s);
  s["Chỉ Số Sinh Tồn"]["HP"] = s["Chỉ Số Phái Sinh"]["_HP Tối Đa"];
  return s;
}

describe("applyPatch — 5 loại op (5.3)", () => {
  it("replace: đổi giá trị + TẠO MỚI key trong record (NPC/item mới)", () => {
    const s = makeState();
    const { state, warnings } = applyPatch(s, [
      { op: "replace", path: "stat_data.Thế Giới.Vị Trí", value: "King's Landing" },
      {
        op: "replace",
        path: "stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister",
        value: { "Họ Tên": "Tyrion Lannister", "Tuổi": 38, "Độ Hảo Cảm": 20, "Chức Vụ": "Quân Sư" },
      },
      { op: "replace", path: "stat_data.Túi Đồ.Kiếm thép Valyria giả", value: { "Số Lượng": 1, "Mô Tả": "Vũ khí quý" } },
    ]);
    expect(warnings).toEqual([]);
    expect(state["Thế Giới"]["Vị Trí"]).toBe("King's Landing");
    const npc = state["Mối Quan Hệ"]["NPC Chính"]["Tyrion Lannister"];
    expect(npc["Độ Hảo Cảm"]).toBe(20);
    expect(npc["Tin Cậy"]).toBe(0); // field thiếu được prefault đầy đủ
    expect(state["Túi Đồ"]["Kiếm thép Valyria giả"]["Số Lượng"]).toBe(1);
  });

  it("delta: cộng/trừ số", () => {
    const s = makeState();
    const gold0 = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    const { state } = applyPatch(s, [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: 50 },
      { op: "delta", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -15 },
    ]);
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(gold0 + 50);
    expect(state["Chỉ Số Sinh Tồn"]["HP"]).toBe(s["Chỉ Số Sinh Tồn"]["HP"] - 15);
  });

  it("insert: thêm vào mảng (ký ức NPC)", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.Bran", value: { "Họ Tên": "Bran" } },
    ]).state;
    const { state } = applyPatch(s, [
      {
        op: "insert",
        path: "stat_data.Mối Quan Hệ.NPC Chính.Bran.Ký Ức",
        value: { "Turn": 3, "Sự Việc": "Ngươi cứu cậu bé khỏi ngã", "Cảm Xúc": "Biết Ơn", "Trọng Số": 80 },
      },
    ]);
    expect(state["Mối Quan Hệ"]["NPC Chính"]["Bran"]["Ký Ức"]).toHaveLength(1);
  });

  it("remove: xoá item; move: chuyển giá trị", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Túi Đồ.Bình thuốc", value: { "Số Lượng": 1, "Mô Tả": "hồi máu" } },
    ]).state;
    s = applyPatch(s, [{ op: "remove", path: "stat_data.Túi Đồ.Bình thuốc" }]).state;
    expect(s["Túi Đồ"]["Bình thuốc"]).toBeUndefined();

    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.Jorah", value: { "Họ Tên": "Jorah" } },
      { op: "move", from: "stat_data.Mối Quan Hệ.NPC Chính.Jorah", path: "stat_data.Mối Quan Hệ.Thành Viên Gia Tộc.Jorah" },
    ]).state;
    expect(s["Mối Quan Hệ"]["NPC Chính"]["Jorah"]).toBeUndefined();
    expect(s["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Jorah"]["Họ Tên"]).toBe("Jorah");
  });

  it("op lỗi KHÔNG crash — log warning, op khác vẫn áp; schema tự phục hồi giá trị rác", () => {
    const s = makeState();
    const { state, warnings } = applyPatch(s, [
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: "không phải số" },
      { op: "remove", path: "stat_data.Không.Tồn.Tại" },
      { op: "replace", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -999 }, // clamp về 0
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: 10 }, // vẫn chạy
    ] as PatchOp[]);
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(state["Chỉ Số Sinh Tồn"]["HP"]).toBe(0);
    expect(state["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(10);
  });

  it("clamp stat: hảo cảm vượt ±100 bị chặn", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.X", value: { "Họ Tên": "X", "Độ Hảo Cảm": 250 } },
    ]).state;
    expect(s["Mối Quan Hệ"]["NPC Chính"]["X"]["Độ Hảo Cảm"]).toBe(100);
  });
});

describe("extractor (5.4c) — lọc an toàn", () => {
  it("trích khối <UpdateVariable> + ẩn khỏi display (5.5)", () => {
    const raw = `Ngươi nhận 50 vàng từ thương nhân.

<UpdateVariable>
{ "mvu_update": [ { "op": "delta", "path": "stat_data.Thông Tin Nhân Vật.Vàng", "value": 50 } ] }
</UpdateVariable>`;
    const r = extractUpdates(raw);
    expect(r.found).toBe(true);
    expect(r.ops).toHaveLength(1);
    expect(r.displayText).toBe("Ngươi nhận 50 vàng từ thương nhân.");
  });

  it("bắt cả khối {\"mvu_update\":...} TRẦN không thẻ", () => {
    const raw = 'Diễn biến...\n{ "mvu_update": [ { "op": "delta", "path": "stat_data.Thế Giới.Ngày", "value": 3 } ] }';
    const r = extractUpdates(raw);
    expect(r.ops).toHaveLength(1);
    expect(r.displayText).toBe("Diễn biến...");
  });

  it("LỌC op ghi field prefix _ (AI cố ghi _Seed Gốc → bị chặn)", () => {
    expect(rejectReason({ op: "replace", path: "stat_data._engineMeta._Seed Gốc", value: 1 })).toContain("readonly");
    expect(rejectReason({ op: "replace", path: "stat_data.Chỉ Số Phái Sinh._HP Tối Đa", value: 9999 })).toContain("readonly");
  });

  it("LỌC op ghi nhãn bậc (engine dẫn xuất)", () => {
    expect(rejectReason({ op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.X.Giai Đoạn Quan Hệ", value: "Tri Kỷ" })).toContain("nhãn bậc");
    expect(rejectReason({ op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.X.Giai Đoạn Đời", value: "Lão Niên" })).toContain("nhãn bậc");
  });

  it("op hợp lệ đi qua; op bị lọc nằm trong rejected", () => {
    const raw = `<UpdateVariable>{"mvu_update":[
      {"op":"delta","path":"stat_data.Chỉ Số Sinh Tồn.HP","value":-10},
      {"op":"replace","path":"stat_data._engineMeta.turnCount","value":999}
    ]}</UpdateVariable>`;
    const r = extractUpdates(raw);
    expect(r.ops).toHaveLength(1);
    expect(r.rejected).toHaveLength(1);
  });

  it("JSON hỏng → bỏ qua khối, không crash", () => {
    const r = extractUpdates("<UpdateVariable>{json hỏng{{</UpdateVariable>văn còn lại");
    expect(r.ops).toEqual([]);
    expect(r.displayText).toBe("văn còn lại");
  });
});

describe("hiệu ứng lan toả (5.7.4)", () => {
  it("affinityStage: ngưỡng đúng 8 bậc (5.1d)", () => {
    expect(affinityStage(-100)).toBe("Tử Thù");
    expect(affinityStage(-70)).toBe("Tử Thù");
    expect(affinityStage(-69)).toBe("Thù Địch");
    expect(affinityStage(-15)).toBe("Ác Cảm");
    expect(affinityStage(0)).toBe("Xa Lạ");
    expect(affinityStage(15)).toBe("Quen Biết");
    expect(affinityStage(40)).toBe("Thân Thiết");
    expect(affinityStage(65)).toBe("Tri Kỷ");
    expect(affinityStage(85)).toBe("Sống Chết Có Nhau");
  });

  it("vượt ngưỡng bậc → SỰ KIỆN chuyển bậc (không đổi lặng lẽ)", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Mối Quan Hệ.NPC Chính.Tyrion", value: { "Họ Tên": "Tyrion", "Độ Hảo Cảm": 38 } },
    ]).state;
    s = runCascadeEffects(makeState(), s).state; // chuẩn hoá nhãn ban đầu (Quen Biết)
    const prev = structuredClone(s);
    const patched = applyPatch(s, [
      { op: "delta", path: "stat_data.Mối Quan Hệ.NPC Chính.Tyrion.Độ Hảo Cảm", value: 5 }, // 38→43: lên Thân Thiết
    ]).state;
    const { state, events } = runCascadeEffects(prev, patched);
    expect(state["Mối Quan Hệ"]["NPC Chính"]["Tyrion"]["Giai Đoạn Quan Hệ"]).toBe("Thân Thiết");
    expect(events.some((e) => e.kind === "stage_up" && e.text.includes("Tyrion"))).toBe(true);
  });

  it("tuổi NPC tự tính lại theo Năm Sinh khi Năm đổi (5.1e) — nhảy 5 năm trẻ con thành thiếu niên", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Mối Quan Hệ.Thành Viên Gia Tộc.Rickon", value: { "Họ Tên": "Rickon", "Năm Sinh": 295, "Tuổi": 3 } },
    ]).state;
    const prev = structuredClone(s);
    const patched = applyPatch(s, [{ op: "delta", path: "stat_data.Thế Giới.Năm", value: 5 }]).state; // 298→303
    const { state } = runCascadeEffects(prev, patched);
    const rickon = state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]["Rickon"];
    expect(rickon["Tuổi"]).toBe(8);
    expect(rickon["Giai Đoạn Đời"]).toBe("Thiếu Niên");
    expect(lifeStage(8)).toBe("Thiếu Niên");
  });

  it("thời gian trôi: AI báo delta Ngày → onTurnAdvance tick ĐÚNG N lần; không trôi → 0 tick (6.2)", () => {
    let ticks = 0;
    registerTurnListener("test-loop", () => {
      ticks += 1;
    });
    const s = makeState();
    // hội thoại ngắn — không có delta Ngày → KHÔNG tick
    const noTime = applyPatch(s, [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Vàng", value: 5 }]).state;
    let r = runCascadeEffects(s, noTime);
    expect(r.daysPassed).toBe(0);
    expect(ticks).toBe(0);
    // "ba ngày sau..." → tick đúng 3 lần
    const withTime = applyPatch(s, [{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: 3 }]).state;
    r = runCascadeEffects(s, withTime);
    expect(r.daysPassed).toBe(3);
    expect(ticks).toBe(3);
  });

  it("tràn năm: Ngày vượt 360 → sang Năm mới", () => {
    const s = makeState();
    s["Thế Giới"]["Ngày"] = 358;
    const patched = applyPatch(s, [{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: 5 }]).state;
    const { state, daysPassed } = runCascadeEffects(s, patched);
    expect(state["Thế Giới"]["Năm"]).toBe(299);
    expect(state["Thế Giới"]["Ngày"]).toBe(3);
    expect(daysPassed).toBe(5);
    expect(DAYS_PER_YEAR).toBe(360);
  });

  it("chỉ số phái sinh tính lại từ cốt lõi + trang bị + thiên phú (5.1f-B/C1)", () => {
    const s = makeState();
    s["Chỉ Số Cốt Lõi"]["Thể Chất"] = 14;
    s["Chỉ Số Cốt Lõi"]["Sức Mạnh"] = 12;
    s["Thiên Phú"]["Dòng Máu Chiến Binh"] = {
      "Loại": "Chiến Đấu", "Mô Tả": "", "Hiệu Ứng": "Sát Thương Cận+1", "Ẩn": false,
    } as never;
    s["Trang Bị Đang Mặc"]["Giáp Thân"] = {
      "Tên": "Giáp da", "Phẩm Chất": "Thường", "Thuộc Tính": { "Phòng Thủ": 3 }, "Đặc Tính": [], "Mô Tả": "",
    } as never;
    recomputeDerived(s);
    expect(s["Chỉ Số Phái Sinh"]["_HP Tối Đa"]).toBe(50 + 14 * 5 + 1 * 5); // 125
    expect(s["Chỉ Số Phái Sinh"]["_Phòng Thủ"]).toBe(10 + 4 + 3); // 10 + NN8/2 + giáp 3
    expect(s["Chỉ Số Phái Sinh"]["_Sát Thương Cận"]).toBe(6 + 1); // SM12/2 + thiên phú
  });

  it("parseEffect (5.1f-C1): chuỗi máy-đọc → cặp key/delta", () => {
    expect(parseEffect("Sức Mạnh+2, Sát Thương Cận+1, Nhanh Nhẹn-1")).toEqual([
      { key: "Sức Mạnh", delta: 2 },
      { key: "Sát Thương Cận", delta: 1 },
      { key: "Nhanh Nhẹn", delta: -1 },
    ]);
    expect(parseEffect("")).toEqual([]);
    expect(parseEffect("rác không định dạng")).toEqual([]);
  });

  it("HP clamp về trần mới khi trang bị/chỉ số đổi", () => {
    const s = makeState();
    s["Chỉ Số Sinh Tồn"]["HP"] = 999;
    recomputeDerived(s);
    expect(s["Chỉ Số Sinh Tồn"]["HP"]).toBe(s["Chỉ Số Phái Sinh"]["_HP Tối Đa"]);
  });
});

describe("stateRenderer (5.7.3)", () => {
  it("render khối tiếng Việt: nhãn kèm số, bí mật $ cho AI, nhắc nguồn chân lý", () => {
    let s = makeState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Thông Tin Nhân Vật.Họ Tên", value: "Eddard Stark" },
      {
        op: "replace",
        path: "stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister",
        value: { "Họ Tên": "Tyrion Lannister", "Tuổi": 38, "Độ Hảo Cảm": 52, "Tin Cậy": 30, "Chức Vụ": "Quân Sư", "$Ghi Chú Ẩn": "đang nợ nhà Iron Bank" },
      },
      { op: "replace", path: "stat_data.Thái Độ Các Nhà.Lannister", value: { "Thái Độ": "Thù Địch", "Mô Tả": "" } },
    ]).state;
    s = runCascadeEffects(makeState(), s).state;
    const out = renderStateForAI(s);
    expect(out).toContain("TRẠNG THÁI HIỆN TẠI");
    expect(out).toContain("Eddard Stark");
    expect(out).toContain("Thân Thiết (52)"); // nhãn chữ kèm số (5.7.3)
    expect(out).toContain("Tin Cậy: 30");
    expect(out).toContain("đang nợ nhà Iron Bank"); // $ hidden-from-UI nhưng AI đọc được
    expect(out).toContain("Lannister → THÙ ĐỊCH");
  });
});
