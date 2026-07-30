/**
 * Acceptance M20 — NGOẠI GIAO: ba trục tách biệt (pháp lý / tình cảm / lòng tin),
 * uy tín cam kết là tài sản chung (xé giấy là mọi Nhà đều bớt tin), hiệp ước có
 * kỳ hạn, ân oán là CỚ, cống nạp chảy vào ngân khố mỗi tháng.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { absoluteDay, DAYS_PER_YEAR } from "../mvu/calendar";
import {
  setDiploStatus, truceOps, signTreatyOps, treatyFromAttrs, breakTreatyOps,
  addGrievanceOps, casusBelli, grievanceAgainstUs, sendEnvoyOps,
  addOfferOps, acceptOfferOps, rejectOfferOps,
  tickDiplomacyDaily, tickDiplomacyMonthly, monthlyTribute, diplomacySummary,
  diplomacyAvailable,
} from "./diplomacy";

function lord(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 100000;
  return StatDataSchema.parse(s);
}

/** Áp ops rồi trả state mới (đường engine). */
function apply(s: StatData, ops: Parameters<typeof applyPatch>[1]): StatData {
  return applyPatch(s, ops).state;
}

describe("Trạng thái pháp lý (M20)", () => {
  it("tuyên chiến từ Hoà Bình: đổi trạng thái, KHÔNG mất uy tín", () => {
    const s = lord();
    const before = s["Ngoại Giao"]["Uy Tín Cam Kết"];
    const r = setDiploStatus(s, "lannister", "Chiến Tranh", "Chúng bắt con ta");
    expect(r.ok).toBe(true);
    const next = apply(s, r.ops);
    expect(next["Quan Hệ Ngoại Giao"]["lannister"]["Trạng Thái"]).toBe("Chiến Tranh");
    expect(next["Ngoại Giao"]["Uy Tín Cam Kết"]).toBe(before);
  });

  it("BỘI ƯỚC — đánh úp khi đang Liên Minh: mất uy tín, lòng tin về -100, ta mắc nợ máu", () => {
    let s = lord();
    s = apply(s, setDiploStatus(s, "frey", "Liên Minh").ops);
    const credBefore = s["Ngoại Giao"]["Uy Tín Cam Kết"];

    s = apply(s, setDiploStatus(s, "frey", "Chiến Tranh", "Ta trở giáo giữa tiệc").ops);
    expect(s["Ngoại Giao"]["Uy Tín Cam Kết"]).toBeLessThan(credBefore);
    expect(s["Quan Hệ Ngoại Giao"]["frey"]["Tin Cậy"]).toBe(-100);
    expect(grievanceAgainstUs(s, "frey")).toBeGreaterThan(50);
    expect(s["Danh Vọng"]["Vinh Dự"]).toBeLessThan(0);
  });

  it("bội ước hạ lòng tin của MỌI Nhà khác, không riêng Nhà bị xé", () => {
    let s = lord();
    s = apply(s, setDiploStatus(s, "tyrell", "Hoà Bình").ops);
    s = apply(s, setDiploStatus(s, "martell", "Hoà Bình").ops);
    const tyrellBefore = s["Quan Hệ Ngoại Giao"]["tyrell"]["Tin Cậy"];

    s = apply(s, setDiploStatus(s, "frey", "Liên Minh").ops);
    s = apply(s, setDiploStatus(s, "frey", "Chiến Tranh", "trở giáo").ops);
    expect(s["Quan Hệ Ngoại Giao"]["tyrell"]["Tin Cậy"]).toBeLessThan(tyrellBefore);
  });

  it("đình chiến có KỲ HẠN; hết hạn tự về Hoà Bình", () => {
    let s = lord();
    s = apply(s, setDiploStatus(s, "greyjoy", "Chiến Tranh").ops);
    s = apply(s, truceOps(s, "greyjoy", 3, "ngừng binh ba ngày").ops);
    expect(s["Quan Hệ Ngoại Giao"]["greyjoy"]["Trạng Thái"]).toBe("Đình Chiến");
    expect(s["Quan Hệ Ngoại Giao"]["greyjoy"]["Ngày Hết Hạn Đình Chiến"]).toBeGreaterThan(absoluteDay(s["Thế Giới"]));

    for (let i = 0; i < 4; i++) {
      s["Thế Giới"]["Ngày"] += 1;
      tickDiplomacyDaily(s);
    }
    expect(s["Quan Hệ Ngoại Giao"]["greyjoy"]["Trạng Thái"]).toBe("Hoà Bình");
    expect(s["Quan Hệ Ngoại Giao"]["greyjoy"]["Ngày Hết Hạn Đình Chiến"]).toBe(0);
  });
});

describe("Hiệp ước (M20)", () => {
  it("ký Liên Minh Quân Sự → trạng thái thành Liên Minh + lòng tin tăng", () => {
    const s = lord();
    const treaty = treatyFromAttrs(s, { type: "Liên Minh Quân Sự", terms: "cùng chống nhà Lannister", years: "5" });
    const r = signTreatyOps(s, "tully", treaty);
    expect(r.ok).toBe(true);
    const next = apply(s, r.ops);
    expect(next["Quan Hệ Ngoại Giao"]["tully"]["Trạng Thái"]).toBe("Liên Minh");
    expect(next["Quan Hệ Ngoại Giao"]["tully"]["Tin Cậy"]).toBeGreaterThan(0);
    expect(next["Quan Hệ Ngoại Giao"]["tully"]["Hiệp Ước"]).toHaveLength(1);
    // 5 năm → ngày hết hạn cách hôm nay đúng 5 × 360 ngày
    expect(treaty["Ngày Hết Hạn"] - absoluteDay(s["Thế Giới"])).toBe(5 * DAYS_PER_YEAR);
  });

  it("hiệp ước hết hạn theo lịch → tự hạ cờ hiệu lực", () => {
    let s = lord();
    s = apply(s, signTreatyOps(s, "arryn", treatyFromAttrs(s, { type: "Thông Thương", years: "0", tribute: "0" })).ops);
    // giấy vĩnh viễn thì không hết hạn
    for (let i = 0; i < 5; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    expect(s["Quan Hệ Ngoại Giao"]["arryn"]["Hiệp Ước"][0]["Còn Hiệu Lực"]).toBe(true);

    const short = treatyFromAttrs(s, { type: "Đình Chiến" });
    short["Ngày Hết Hạn"] = absoluteDay(s["Thế Giới"]) + 2;
    s = apply(s, signTreatyOps(s, "arryn", short).ops);
    for (let i = 0; i < 3; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    expect(s["Quan Hệ Ngoại Giao"]["arryn"]["Hiệp Ước"][1]["Còn Hiệu Lực"]).toBe(false);
  });

  it("XÉ hiệp ước: mất uy tín, lòng tin sụp, ta mắc nợ", () => {
    let s = lord();
    s = apply(s, signTreatyOps(s, "bolton", treatyFromAttrs(s, { type: "Không Xâm Phạm" })).ops);
    const credBefore = s["Ngoại Giao"]["Uy Tín Cam Kết"];

    const r = breakTreatyOps(s, "bolton", "Ta cần đất của chúng");
    expect(r.ok).toBe(true);
    s = apply(s, r.ops);
    expect(s["Quan Hệ Ngoại Giao"]["bolton"]["Hiệp Ước"][0]["Còn Hiệu Lực"]).toBe(false);
    expect(s["Quan Hệ Ngoại Giao"]["bolton"]["Hiệp Ước"][0]["Bên Phá"]).toBe("Ta");
    expect(s["Ngoại Giao"]["Uy Tín Cam Kết"]).toBeLessThan(credBefore);
    expect(s["Quan Hệ Ngoại Giao"]["bolton"]["Tin Cậy"]).toBeLessThan(-50);
  });

  it("không có giấy nào còn hiệu lực → không xé được", () => {
    const s = lord();
    expect(breakTreatyOps(s, "bolton").ok).toBe(false);
  });

  it("cống nạp chảy vào ngân khố mỗi THÁNG (dương = họ trả ta)", () => {
    let s = lord();
    s = apply(s, signTreatyOps(s, "karstark", treatyFromAttrs(s, { type: "Triều Cống", tribute: "5000" })).ops);
    expect(monthlyTribute(s)).toBe(5000);
    const before = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    tickDiplomacyMonthly(s);
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(before + 5000);
    expect(s["Quan Hệ Ngoại Giao"]["karstark"]["_Cống Nạp Tháng"]).toBe(5000);
  });

  it("cống nạp âm = TA phải trả họ", () => {
    let s = lord();
    s = apply(s, signTreatyOps(s, "iron-bank", treatyFromAttrs(s, { type: "Triều Cống", tribute: "-3000" })).ops);
    const before = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    tickDiplomacyMonthly(s);
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(before - 3000);
  });
});

describe("Ân oán = CỚ đánh nhau (M20)", () => {
  it("ghi ân oán hai chiều; casusBelli chỉ tính cái HỌ nợ ta", () => {
    let s = lord();
    const today = absoluteDay(s["Thế Giới"]);
    s = apply(s, addGrievanceOps(s, "lannister", { "Việc": "Chúng giết cha ta", "Mức": 90, "Bên Nợ": "Họ Nợ Ta", "_Ngày": today }));
    s = apply(s, addGrievanceOps(s, "lannister", { "Việc": "Ta cướp xe lương của chúng", "Mức": 20, "Bên Nợ": "Ta Nợ Họ", "_Ngày": today }));
    expect(casusBelli(s, "lannister")).toBe(90);
    expect(grievanceAgainstUs(s, "lannister")).toBe(20);
  });

  it("ân oán nhỏ mờ dần theo thời gian; nợ máu nặng thì không mờ hết", () => {
    let s = lord();
    const today = absoluteDay(s["Thế Giới"]);
    s = apply(s, addGrievanceOps(s, "frey", { "Việc": "Chuyện nhỏ", "Mức": 3, "Bên Nợ": "Họ Nợ Ta", "_Ngày": today }));
    s = apply(s, addGrievanceOps(s, "frey", { "Việc": "Huyết hôn", "Mức": 95, "Bên Nợ": "Họ Nợ Ta", "_Ngày": today }));
    for (let i = 0; i < 200; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    const remaining = s["Quan Hệ Ngoại Giao"]["frey"]["Ân Oán"];
    expect(remaining.some((g) => g["Việc"] === "Huyết hôn")).toBe(true);
    expect(remaining.find((g) => g["Việc"] === "Huyết hôn")!["Mức"]).toBeGreaterThanOrEqual(40);
  });
});

describe("Sứ giả & lời đề nghị (M20)", () => {
  it("sứ giả đi mất NGÀY, qua các chặng đi → đàm phán → về", () => {
    let s = lord();
    s = apply(s, sendEnvoyOps(s, "Học sĩ Luwin", "tully", "Cầu Hoà", 2).ops);
    expect(s["Ngoại Giao"]["Sứ Giả"]["Học sĩ Luwin"]["Trạng Thái"]).toBe("Đang Đi");

    for (let i = 0; i < 3; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    expect(s["Ngoại Giao"]["Sứ Giả"]["Học sĩ Luwin"]["Trạng Thái"]).toBe("Đang Đàm Phán");

    for (let i = 0; i < 30; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    expect(s["Ngoại Giao"]["Sứ Giả"]["Học sĩ Luwin"]["Trạng Thái"]).toBe("Đã Về");
  });

  it("lời đề nghị: nhận → thành hiệp ước thật", () => {
    let s = lord();
    s = apply(s, addOfferOps(s, "tyrell-alliance", {
      house: "tyrell", type: "Liên Minh Quân Sự", terms: "gả con gái + hai vạn quân",
      years: "10", deadlineDays: "30", bearer: "Ser Loras",
    }).ops);
    expect(s["Ngoại Giao"]["Lời Đề Nghị"]["tyrell-alliance"]).toBeDefined();

    s = apply(s, acceptOfferOps(s, "tyrell-alliance").ops);
    expect(s["Ngoại Giao"]["Lời Đề Nghị"]["tyrell-alliance"]).toBeUndefined();
    expect(s["Quan Hệ Ngoại Giao"]["tyrell"]["Trạng Thái"]).toBe("Liên Minh");
    expect(s["Quan Hệ Ngoại Giao"]["tyrell"]["Hiệp Ước"][0]["Điều Khoản"]).toContain("hai vạn quân");
  });

  it("im lặng cũng là câu trả lời: hết hạn thì lời đề nghị bị rút", () => {
    let s = lord();
    s = apply(s, addOfferOps(s, "quick", { house: "bolton", type: "Hoà Ước", deadlineDays: "2" }).ops);
    for (let i = 0; i < 3; i++) { s["Thế Giới"]["Ngày"] += 1; tickDiplomacyDaily(s); }
    expect(s["Ngoại Giao"]["Lời Đề Nghị"]["quick"]).toBeUndefined();
  });

  it("từ chối phũ phàng → họ ghi thêm một món nợ", () => {
    let s = lord();
    s = apply(s, addOfferOps(s, "harsh", { house: "bolton", type: "Hoà Ước" }).ops);
    s = apply(s, rejectOfferOps(s, "harsh", true).ops);
    expect(grievanceAgainstUs(s, "bolton")).toBeGreaterThan(0);
  });
});

describe("Tổng quan cho giao diện (M20)", () => {
  it("diplomacySummary gộp đủ 3 trục + cớ hai bên", () => {
    let s = lord();
    s = apply(s, setDiploStatus(s, "lannister", "Chiến Tranh").ops);
    s = apply(s, addGrievanceOps(s, "lannister", {
      "Việc": "Giết cha ta", "Mức": 80, "Bên Nợ": "Họ Nợ Ta", "_Ngày": absoluteDay(s["Thế Giới"]),
    }));
    const rows = diplomacySummary(s);
    const lan = rows.find((r) => r.houseId === "lannister")!;
    expect(lan.status).toBe("Chiến Tranh");
    expect(lan.ourClaim).toBe(80);
    expect(lan.attitude).toBeTruthy();
    expect(diplomacyAvailable(s)).toBe(true);
  });

  it("ván mới chưa có quan hệ nào → bảng ngoại giao chưa cần bật", () => {
    expect(diplomacyAvailable(lord())).toBe(false);
  });
});
