/**
 * Acceptance M19 — hiệu triệu chư hầu: gieo bảng chư hầu theo vùng nắm được,
 * phản ứng theo LÒNG TRUNG (dốc quân / gửi lấy lệ / từ chối), quân tới nơi sau
 * hành quân rồi thành một đơn vị thật trong biên chế, giữ lâu thì mất lòng.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData, type Vassal } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "../territory/territoryEngine";
import {
  seedVassals, callBanners, canCallBanners, bannerResponse, tickMuster,
  dismissVassal, musteredStrength,
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
    b["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    b["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
    seedRegionControl(b, "war-of-five-kings", { createIfMissing: true });
    const conquered = StatDataSchema.parse(b);
    seedVassals(conquered, { conquered: "the-north" });
    expect(conquered["Chư Hầu"]["umber"]["Trung Thành"]).toBeLessThan(a["Chư Hầu"]["umber"]["Trung Thành"]);
  });
});

describe("Quyền hiệu triệu theo tước vị (M19)", () => {
  it("Đại Lãnh Chúa gọi được; Thường Dân thì không", () => {
    expect(canCallBanners(northernLord("Đại Lãnh Chúa"))).toBe(true);
    expect(canCallBanners(northernLord("Thường Dân"))).toBe(false);
    const r = callBanners(northernLord("Thường Dân"));
    expect(r.ok).toBe(false);
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
