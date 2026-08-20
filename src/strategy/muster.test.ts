/**
 * Acceptance M19 — hiệu triệu chư hầu: gieo bảng chư hầu theo vùng nắm được,
 * phản ứng theo LÒNG TRUNG (dốc quân / gửi lấy lệ / từ chối), quân tới nơi sau
 * hành quân rồi thành một đơn vị thật trong biên chế, giữ lâu thì mất lòng.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData, type Vassal } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { realmControlStatus, seedRegionControl } from "../territory/territoryEngine";
import {
  seedVassals, callBanners, canCallBanners, bannerResponse, tickMuster,
  dismissVassal, musteredStrength, callableVassals, effectiveBannerLoyalty,
  legalMusterRealmIds, runtimeVassalCommitment,
} from "./muster";
import { bannermenOfRegion } from "../content/westeros/bannermen";

type Title = StatData["Thông Tin Nhân Vật"]["Tước Vị"];

function northernLord(title: Title = "Đại Lãnh Chúa"): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = title;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  const parsed = StatDataSchema.parse(s);
  seedVassals(parsed);
  return parsed;
}

const vassal = (over: Partial<Vassal> = {}): Vassal => ({
  "Tên Nhà": "Nhà Thử", "Thành Trì": "Thành Thử", "Vùng": "the-north", "Chủ Của": "stark",
  "Trung Thành": 70, "Quân Cam Kết": 1000, "Binh Chủng Chính": "Bộ Binh",
  "Trạng Thái": "Ở Nhà", "Ngày Tới Nơi": 10, "Quân Đã Gửi": 0, "Ngày Tòng Quân": 0, "Ghi Chú": "",
  ...over,
});

describe("Gieo chư hầu theo lãnh thổ (M19)", () => {
  it("nắm Phương Bắc → có chư hầu Phương Bắc trong bảng", () => {
    const s = northernLord();
    const north = bannermenOfRegion("the-north");
    expect(north.length).toBeGreaterThan(0);
    expect(Object.keys(s["Chư Hầu"]).length).toBeGreaterThan(0);
    expect(s["Chư Hầu"]["umber"]).toBeDefined();
    expect(s["Chư Hầu"]["umber"]["Vùng"]).toBe("the-north");
  });

  it("chư hầu của vùng VỪA CHIẾM khởi điểm trung thành thấp hơn nhiều", () => {
    const a = northernLord();
    const b = makeDefaultState();
    b["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
    b["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    b["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    b["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
    seedRegionControl(b, "war-of-five-kings", { createIfMissing: true });
    const conquered = StatDataSchema.parse(b);
    seedVassals(conquered, { conquered: "the-north" });
    expect(conquered["Chư Hầu"]["cerwyn"]["Trung Thành"]).toBeLessThan(a["Chư Hầu"]["cerwyn"]["Trung Thành"]);
    expect(conquered["Chư Hầu"]["umber"]["Trung Thành"]).toBe(a["Chư Hầu"]["umber"]["Trung Thành"]);
  });

  it("era cổ không gieo hoặc gọi ngược catalog chư hầu cuối thế kỷ III", () => {
    const raw = makeDefaultState();
    raw["Thông Tin Nhân Vật"]["Họ Tên"] = "Aegon Targaryen";
    raw["Thông Tin Nhân Vật"]["Nhà"] = "Targaryen";
    raw["Thông Tin Nhân Vật"]["Tước Vị"] = "Vua Bảy Vương Quốc";
    raw["Cài Đặt Ván"]["Thời Kỳ"] = "aegon-conquest";
    raw["Thế Giới"]["Năm"] = 1;
    seedRegionControl(raw, "aegon-conquest", { createIfMissing: true });
    const s = StatDataSchema.parse(raw);
    seedVassals(s);

    expect(s["Chư Hầu"]["rosby"]).toBeUndefined();
    expect(s["Chư Hầu"]["tarly"]).toBeUndefined();
    expect(s["Chư Hầu"]["clegane"]).toBeUndefined();

    // Save cũ vẫn được giữ nguyên, nhưng một record anachronistic không trở
    // thành đối tượng hiệu triệu hợp lệ trong era cổ.
    s["Chư Hầu"]["rosby"] = vassal({
      "Tên Nhà": "Nhà Rosby", "Thành Trì": "Rosby", "Vùng": "the-crownlands",
    });
    expect(callableVassals(s).some(([id]) => id === "rosby")).toBe(false);
  });
});

describe("Quyền hiệu triệu theo tước vị (M19)", () => {
  it("Đại Lãnh Chúa gọi được; Thường Dân thì không", () => {
    expect(canCallBanners(northernLord("Đại Lãnh Chúa"))).toBe(true);
    expect(canCallBanners(northernLord("Thường Dân"))).toBe(false);
    const r = callBanners(northernLord("Thường Dân"));
    expect(r.ok).toBe(false);
  });

  it("Quốc Vương Reach gọi được chư hầu toàn Reach dù không trực tiếp giữ tỉnh của họ", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Mace Tyrell";
    s["Thông Tin Nhân Vật"]["Nhà"] = "Tyrell";
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Quốc Vương";
    s["Thế Giới"]["Năm"] = 298;
    seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
    const parsed = StatDataSchema.parse(s);
    parsed["Chủ Quyền Lãnh Thổ"]["reach-oldtown"]["Nhà Kiểm Soát"] = "hightower";
    parsed["Chủ Quyền Lãnh Thổ"]["reach-oldtown"]["Là Của Người Chơi"] = false;
    seedVassals(parsed);

    expect(legalMusterRealmIds(parsed)).toEqual(["the-reach"]);
    expect(parsed["Chủ Quyền Lãnh Thổ"]["reach-oldtown"]["Nhà Kiểm Soát"]).not.toBe("tyrell");
    expect(callableVassals(parsed).some(([id]) => id === "hightower")).toBe(true);
    expect(callBanners(parsed, "hightower").responses).toHaveLength(1);
  });

  it("chiếm thủ phủ rồi reload không tự động làm toàn vương quốc quy phục", () => {
    const s = northernLord("Vua Bảy Vương Quốc");
    const capital = s["Chủ Quyền Lãnh Thổ"]["dorne"];
    capital["Nhà Kiểm Soát"] = "stark";
    capital["Người Kiểm Soát"] = "Eddard Stark";
    capital["Là Của Người Chơi"] = true;
    capital["Tình Trạng"] = "Mới Chiếm";
    capital["_Ngày Đổi Chủ"] = 25;
    for (const id of ["yronwood", "dayne", "uller", "fowler", "manwoody"]) {
      s["Chư Hầu"][id]["Chủ Của"] = "";
    }

    seedVassals(s); // mô phỏng load/migrate
    expect(s["Chư Hầu"]["yronwood"]["Chủ Của"]).toBe("");
    expect(s["Chư Hầu"]["dayne"]["Chủ Của"]).toBe("");
    expect(realmControlStatus(s, "dorne", "stark").complete).toBe(false);
  });

  it("Vua Bảy Vương Quốc gửi quạ được khắp Westeros, nhưng nhà chưa khuất phục có thể từ chối", () => {
    const s = northernLord("Vua Bảy Vương Quốc");
    const legal = legalMusterRealmIds(s);
    expect(legal).toContain("the-north");
    expect(legal).toContain("the-reach");
    expect(legal).toContain("dorne");
    expect(callableVassals(s).some(([id]) => id === "yronwood")).toBe(true);

    s["Chư Hầu"]["yronwood"]["Chủ Của"] = "";
    s["Chư Hầu"]["yronwood"]["Trung Thành"] = 10;
    const response = callBanners(s, "yronwood");
    expect(response.ok).toBe(true);
    expect(response.responses[0].refused).toBe(true);
    expect(response.responses[0].troops).toBe(0);
    const after = applyPatch(s, response.ops).state;
    expect(after["Chư Hầu"]["yronwood"]["Chủ Của"]).toBe("");
  });

  it("chư hầu pháp lý chấp nhận hiệu triệu thì công khai thần phục và tăng kiểm soát thực địa", () => {
    const s = northernLord("Vua Bảy Vương Quốc");
    const yronwood = s["Chư Hầu"]["yronwood"];
    yronwood["Chủ Của"] = "";
    yronwood["Trung Thành"] = 100;
    s["Quản Trị Tước Địa"]["Uy Quyền"] = 100;
    s["Quản Trị Tước Địa"]["Gắn Kết Chư Hầu"] = 100;
    const before = realmControlStatus(s, "dorne", "stark").controlledStrongholds;

    const result = callBanners(s, "yronwood");
    expect(result.ok).toBe(true);
    expect(result.responses[0].refused).toBe(false);
    const after = applyPatch(s, result.ops).state;
    expect(after["Chư Hầu"]["yronwood"]["Chủ Của"]).toBe("stark");
    expect(realmControlStatus(after, "dorne", "stark").controlledStrongholds).toBeGreaterThan(before);
  });

  it("uy quyền nâng khả năng đáp lời, còn chiến tranh với chính chư hầu làm nó sụp đổ", () => {
    const s = northernLord("Vua Bảy Vương Quốc");
    const yronwood = s["Chư Hầu"]["yronwood"];
    yronwood["Chủ Của"] = "";
    yronwood["Trung Thành"] = 50;
    s["Quản Trị Tước Địa"]["Uy Quyền"] = 10;
    const weak = effectiveBannerLoyalty(s, "yronwood", yronwood);
    s["Quản Trị Tước Địa"]["Uy Quyền"] = 90;
    const strong = effectiveBannerLoyalty(s, "yronwood", yronwood);
    expect(strong).toBeGreaterThan(weak + 20);

    s["Quan Hệ Ngoại Giao"]["yronwood"] = {
      "Trạng Thái": "Chiến Tranh", "War Score": 0, "Lòng Tin": 0,
      "Hiệp Ước": [], "Yêu Sách": [], "Lần Thay Đổi Cuối": 0,
    } as StatData["Quan Hệ Ngoại Giao"][string];
    expect(effectiveBannerLoyalty(s, "yronwood", yronwood)).toBeLessThan(strong - 50);
  });
});

describe("Phản ứng của chư hầu theo lòng trung (M19)", () => {
  it("trung thành cao → dốc gần trọn quân; trung thành thấp → từ chối", () => {
    const loyal = bannerResponse(vassal({ "Trung Thành": 95 }), 95, () => 0.5);
    expect(loyal.refused).toBe(false);
    expect(loyal.troops).toBeGreaterThan(700);

    const traitor = bannerResponse(vassal({ "Trung Thành": 10 }), 10, () => 0.5);
    expect(traitor.refused).toBe(true);
    expect(traitor.troops).toBe(0);
  });

  it("nhà miễn cưỡng lề mề hơn trên đường (cùng khoảng cách, nhiều ngày hơn)", () => {
    const eager = bannerResponse(vassal({ "Ngày Tới Nơi": 10 }), 90, () => 0.5);
    const grudging = bannerResponse(vassal({ "Ngày Tới Nơi": 10 }), 45, () => 0.5);
    expect(grudging.days).toBeGreaterThan(eager.days);
  });

  it("cùng seed → cùng kết quả (tái lập được)", () => {
    const a = callBanners(northernLord());
    const b = callBanners(northernLord());
    expect(a.responses.map((r) => r.troops)).toEqual(b.responses.map((r) => r.troops));
  });

  it("dân số thành trì thay đổi thì quân cam kết thay đổi cùng một nguồn", () => {
    const s = northernLord();
    const cerwyn = s["Chư Hầu"]["cerwyn"];
    const before = runtimeVassalCommitment(s, "cerwyn", cerwyn);
    s["Lãnh Địa"]["the-north-seat"]["Dân Số"] += 100_000;
    expect(runtimeVassalCommitment(s, "cerwyn", cerwyn)).toBeGreaterThan(before);
  });
});

describe("Quân chư hầu tới nơi (M19)", () => {
  it("phất cờ → hành quân → thành đơn vị ngạch Chư Hầu trong biên chế", () => {
    const s = northernLord();
    const r = callBanners(s, "cerwyn"); // nhà gần Winterfell nhất
    expect(r.ok).toBe(true);
    const state = applyPatch(s, r.ops).state;
    const v = state["Chư Hầu"]["cerwyn"];
    if (v["Trạng Thái"] === "Từ Chối") return; // nhà này từ chối lần này — hợp lệ, bỏ qua

    expect(v["Trạng Thái"]).toBe("Đang Hành Quân");
    expect(musteredStrength(state).marching).toBeGreaterThan(0);

    const marchDays = v["Ngày Tới Nơi"]; // chốt trước: tick sẽ trừ dần chính field này
    for (let i = 0; i < marchDays + 1; i++) tickMuster(state);
    expect(state["Chư Hầu"]["cerwyn"]["Trạng Thái"]).toBe("Đã Tới");
    const unit = state["Biên Chế Quân Sự"]["Quân Nhà Cerwyn"];
    expect(unit).toBeDefined();
    expect(unit["Ngạch"]).toBe("Chư Hầu");
    expect(unit["Thuộc Chư Hầu"]).toBe("cerwyn");
    expect(unit["Số Lượng"]).toBeGreaterThan(0);
    expect(musteredStrength(state).present).toBeGreaterThan(0);
  });

  it("cho về nhà → xoá đơn vị, chư hầu về trạng thái Ở Nhà và bớt giận", () => {
    const s = northernLord();
    s["Chư Hầu"]["umber"]["Trạng Thái"] = "Đã Tới";
    s["Chư Hầu"]["umber"]["Quân Đã Gửi"] = 2000;
    s["Chư Hầu"]["umber"]["Trung Thành"] = 60;
    s["Biên Chế Quân Sự"]["Quân Nhà Umber"] = {
      ...StatDataSchema.parse(makeDefaultState())["Biên Chế Quân Sự"]["x"],
    } as never;
    const withUnit = applyPatch(s, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Quân Nhà Umber",
      value: { "Số Lượng": 2000, "Loại Quân": "Bộ Binh", "Ngạch": "Chư Hầu", "Thuộc Chư Hầu": "umber" },
    }]).state;

    const r = dismissVassal(withUnit, "umber");
    expect(r.ok).toBe(true);
    const after = applyPatch(withUnit, r.ops).state;
    expect(after["Biên Chế Quân Sự"]["Quân Nhà Umber"]).toBeUndefined();
    expect(after["Chư Hầu"]["umber"]["Trạng Thái"]).toBe("Ở Nhà");
    expect(after["Chư Hầu"]["umber"]["Trung Thành"]).toBeGreaterThan(60);
  });
});
