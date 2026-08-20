/**
 * Acceptance M7 (9.5): chủ quyền động + đồng bộ 2 chiều + tô màu 2 chế độ.
 * "chiếm 1 vùng → polygon đổi màu + state Chủ Quyền cập nhật đồng bộ; toggle
 * Quan Hệ → nhuộm theo Thái Độ; đổi ảnh/màu qua data KHÔNG cần sửa engine".
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { rejectReason } from "../mvu/extractor";
import {
  seedRegionControl, captureRegionOps, regionFill, regionController, playerHouseId,
  playerOwnsProvince, repairPlayerSovereignty, repairRegionControl, provinceControlStatus,
  realmControlStatus, makeHolding,
} from "./territoryEngine";
import { houseColor, PLAYER_HEAT_COLOR, ATTITUDE_HEAT } from "../content/westeros/houseColors";
import { REGIONS, regionsForRealm } from "../content/world/geography";
import { seedVassals } from "../strategy/muster";

function starkPlayer(era = "war-of-five-kings") {
  const eraYears: Record<string, number> = { "aegon-conquest": 1, "war-of-five-kings": 298, "roberts-rebellion": 282 };
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thế Giới"]["Năm"] = eraYears[era] ?? 298;
  seedRegionControl(s, era, { createIfMissing: true });
  return s;
}

describe("seedRegionControl (9.6.1) + đồng bộ", () => {
  it("nạp chủ quyền từ Era; vùng của Nhà người chơi = Là Của Người Chơi", () => {
    const s = starkPlayer();
    expect(playerHouseId(s)).toBe("stark");
    expect(regionController(s, "the-north")).toBe("stark");
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(true);
    // vùng Nhà khác không phải của người chơi
    expect(regionController(s, "the-riverlands")).toBe("tully");
    expect(s["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(false);
    // canon lãnh chúa → mở holding vùng quê tại trọng trấn
    expect(s["Lãnh Địa"]["the-north-seat"]).toBeDefined();
    expect(s["Lãnh Địa"]["the-north-seat"]["Địa Hình"]).toBe("Tuyết/Băng Giá");
  });

  it("wizard: MIGRATE holding gói xuất thân, thêm Thuộc Vùng thay vì đè key, KHÔNG tăng số holding", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    (s["Lãnh Địa"] as Record<string, unknown>)["Lãnh địa tổ truyền"] = { "Mô Tả": "cũ", "Dân Số": 8000, "Trung Thành": 60 };
    seedRegionControl(s, "war-of-five-kings", { createIfMissing: false });
    expect(Object.keys(s["Lãnh Địa"])).toHaveLength(1); // vẫn 1 (đã migrate thuộc tính)
    expect(s["Lãnh Địa"]["the-north-seat"]).toBeUndefined();
    expect(s["Lãnh Địa"]["Lãnh địa tổ truyền"]).toBeDefined();
    expect((s["Lãnh Địa"]["Lãnh địa tổ truyền"] as any)["Thuộc Vùng"]).toBe("the-north");
  });

  it("fresh-seed: claim leaf mang id legacy chỉ thuộc đúng leaf đó", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Nhà"] = "Lannister";
    s["Chủ Quyền Lãnh Thổ"]["the-north"] = {
      "Nhà Kiểm Soát": "lannister",
      "Người Kiểm Soát": "Tywin Lannister",
      "Tình Trạng": "Mới Chiếm",
      "Là Của Người Chơi": true,
      "_Ngày Đổi Chủ": 1234,
    };
    const sibling = REGIONS.find((region) => region.parentId === "macro-the-north" && region.id !== "the-north")!;

    seedRegionControl(s, "war-of-five-kings", { createIfMissing: false });

    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Nhà Kiểm Soát"]).toBe("lannister");
    expect(s["Chủ Quyền Lãnh Thổ"][sibling.id]["Nhà Kiểm Soát"]).not.toBe("lannister");
    expect(s["Chủ Quyền Lãnh Thổ"][sibling.id]["Là Của Người Chơi"]).toBe(false);
  });

  it("legacy-migration: save 9 vùng giữ entry cũ và trải chủ xuống các leaf trong macro", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    s["Chủ Quyền Lãnh Thổ"]["the-north"] = {
      "Nhà Kiểm Soát": "bolton",
      "Người Kiểm Soát": "Roose Bolton",
      "Tình Trạng": "Mới Chiếm",
      "Là Của Người Chơi": false,
      "_Ngày Đổi Chủ": 1234,
    };
    const before = structuredClone(s["Chủ Quyền Lãnh Thổ"]["the-north"]);
    const sibling = REGIONS.find((region) => region.parentId === "macro-the-north" && region.id !== "the-north")!;
    const essos = REGIONS.find((region) => region.continentId === "essos")!;

    expect(repairRegionControl(s, { mode: "legacy-migration" })).toBe(REGIONS.length - 1);
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]).toMatchObject(before);
    expect(s["Chủ Quyền Lãnh Thổ"][sibling.id]).toMatchObject(before);
    expect(Object.keys(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Bá Quyền Thành Trì"] ?? {}).length).toBeGreaterThan(1);
    expect(s["Chủ Quyền Lãnh Thổ"][sibling.id]).not.toBe(s["Chủ Quyền Lãnh Thổ"]["the-north"]);
    expect(s["Chủ Quyền Lãnh Thổ"][essos.id]).toBeDefined();
  });

  it("không kéo holding/vùng hợp lệ do wizard chọn về quê Nhà", () => {
    const s = makeDefaultState();
    const chosen = REGIONS.find((region) => region.continentId === "essos")!;
    s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    s["Chủ Quyền Lãnh Thổ"][chosen.id] = {
      "Nhà Kiểm Soát": "stark", "Người Kiểm Soát": "Arya Stark",
      "Tình Trạng": "Ổn Định", "Là Của Người Chơi": true, "_Ngày Đổi Chủ": 0,
    };
    s["Lãnh Địa"]["custom-holding"] = {
      "Mô Tả": "Cơ nghiệp mới", "Dân Số": 2000, "Trung Thành": 70,
      "Thuộc Vùng": chosen.id, "Tài Nguyên": {}, "Công Trình": {}, "Khủng Hoảng": [],
    } as any;

    seedRegionControl(s, "war-of-five-kings", { createIfMissing: false });
    expect(s["Chủ Quyền Lãnh Thổ"][chosen.id]["Nhà Kiểm Soát"]).toBe("stark");
    expect(s["Lãnh Địa"]["custom-holding"]["Thuộc Vùng"]).toBe(chosen.id);
  });

  it("migration đưa lâu đài canon từ đại vùng cũ về đúng province lá", () => {
    const s = makeDefaultState();
    s["Lãnh Địa"]["dreadfort"] = makeHolding({
      regionId: "the-north", name: "Dreadfort (Bolton)", lord: "Roose Bolton",
    }) as StatData["Lãnh Địa"][string];
    repairRegionControl(s, { mode: "legacy-migration" });
    expect(s["Lãnh Địa"]["dreadfort"]["Thuộc Vùng"]).toBe("north-dreadfort");
  });

  it("người cùng Nhà nhưng không trực tiếp giữ đất không được nhận chủ quyền của gia chủ", () => {
    const s = makeDefaultState();
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Arya Stark";
    s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Thường Dân";
    seedRegionControl(s, "war-of-five-kings", { createIfMissing: false });
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Người Kiểm Soát"] = "Eddard Stark";
    repairPlayerSovereignty(s);
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(false);

    s["Lãnh Địa"]["arya-holding"] = makeHolding({
      regionId: "the-north", name: "Cơ nghiệp của Arya", lord: "Arya Stark",
    }) as StatData["Lãnh Địa"][string];
    repairPlayerSovereignty(s);
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(true);
  });
});

describe("Tô màu 2 chế độ (9.5.2)", () => {
  it("thế lực thế giới có màu riêng và id mod nhận fallback ổn định", () => {
    expect(houseColor("braavos")).not.toEqual(houseColor(""));
    expect(houseColor("polity-from-a-mod")).toEqual(houseColor("polity-from-a-mod"));
    expect(houseColor("polity-from-a-mod")).not.toEqual(houseColor(""));
  });

  it("Chính Trị: vùng tô màu Nhà kiểm soát; vô chủ → sọc", () => {
    const s = starkPlayer("long-night"); // beyond-the-wall vô chủ ở Era này
    expect(regionFill(s, "the-north", "political").color).toBe(houseColor("stark").base);
    const beyond = regionFill(s, "beyond-the-wall", "political");
    expect(beyond.striped).toBe(true); // vô chủ → sọc 2 màu
  });

  it("Quan Hệ: lãnh thổ ta nổi bật; heatmap theo Thái Độ Nhà kiểm soát", () => {
    const s = starkPlayer();
    // vùng ta → vàng kim
    expect(regionFill(s, "the-north", "relationship").color).toBe(PLAYER_HEAT_COLOR);
    // đặt Lannister THÙ ĐỊCH → vùng Tây đỏ đậm
    const { state } = applyPatch(s, [
      { op: "replace", path: "stat_data.Thái Độ Các Nhà.Lannister", value: { "Thái Độ": "Thù Địch", "Mô Tả": "" } },
    ]);
    expect(regionFill(state, "the-westerlands", "relationship").color).toBe(ATTITUDE_HEAT["Thù Địch"].color);
    // Nhà chưa có Thái Độ → trung lập (Cảnh Giác)
    expect(regionFill(state, "the-vale", "relationship").color).toBe(ATTITUDE_HEAT["Cảnh Giác"].color);
  });

  it("snapshot canon ổn định của AI tô đặc dù save không lưu graph chư hầu AI", () => {
    const s = starkPlayer();
    const west = regionFill(s, "the-westerlands", "political");
    expect(west.isPlayer).toBe(false);
    expect(west.fullControl).toBe(true);
    expect(west.controlRatio).toBe(1);
    expect(west.striped).toBe(false);
  });
});

describe("captureRegion đồng bộ 2 chiều (9.5.1)", () => {
  it("chiếm vùng cho người chơi → đổi chủ + tạo Lãnh Địa + đánh dấu turn (animation)", () => {
    const s = starkPlayer();
    const ops = captureRegionOps(s, "the-riverlands", "stark", 7);
    const { state } = applyPatch(s, ops);
    expect(regionController(state, "the-riverlands")).toBe("stark");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(true);
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Người Kiểm Soát"]).toBe("Eddard Stark");
    expect(playerOwnsProvince(state, "the-riverlands")).toBe(true);
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["_Ngày Đổi Chủ"]).toBe(7);
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Mới Chiếm");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Kiểm Soát Hoàn Toàn"]).toBe(false);
    // mở quản trị nội bộ thành trì trọng trấn (10.1)
    expect(state["Lãnh Địa"]["the-riverlands-seat"]).toBeDefined();
    expect(state["Lãnh Địa"]["the-riverlands-seat"]["Dân Số"]).toBe(12_000);
    // bản đồ Chính Trị đổi sang màu Stark
    expect(regionFill(state, "the-riverlands", "political").color).toBe(houseColor("stark").base);
    expect(regionFill(state, "the-riverlands", "political").striped).toBe(true);
  });

  it("mất vùng của người chơi → xoá entry Lãnh Địa trọng trấn tương ứng (10.1)", () => {
    const s = starkPlayer();
    expect(s["Lãnh Địa"]["the-north-seat"]).toBeDefined();
    const ops = captureRegionOps(s, "the-north", "bolton", 12);
    const { state } = applyPatch(s, ops);
    expect(regionController(state, "the-north")).toBe("bolton");
    expect(state["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"]).toBe(false);
    expect(state["Chủ Quyền Lãnh Thổ"]["the-north"]["Người Kiểm Soát"]).toBe("");
    expect(playerOwnsProvince(state, "the-north")).toBe(false);
    expect(state["Lãnh Địa"]["the-north-seat"]).toBeUndefined(); // quản trị đóng
  });
});

describe("Kiểm soát thực địa theo thành trì và chư hầu", () => {
  it("giữ thủ phủ đại vùng chưa đủ; mất sự thần phục của một chủ thành làm cả cõi chưa hoàn toàn", () => {
    const s = starkPlayer();
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    seedVassals(s);
    const unalignedCastles = realmControlStatus(s, "the-north").unsecuredStrongholds
      .filter((stronghold) => !stronghold.vassalId);
    for (const stronghold of unalignedCastles) {
      s["Lãnh Địa"][`occupied-${stronghold.id}`] = makeHolding({
        regionId: stronghold.provinceId,
        name: stronghold.name,
        lord: "Eddard Stark",
      }) as StatData["Lãnh Địa"][string];
    }
    expect(realmControlStatus(s, "the-north").complete).toBe(true);

    s["Chư Hầu"]["bolton"]["Chủ Của"] = "";
    const control = realmControlStatus(s, "the-north");
    expect(control.complete).toBe(false);
    expect(control.controlRatio).toBeLessThan(1);
    expect(control.unsecuredStrongholds.some((stronghold) => stronghold.vassalId === "bolton")).toBe(true);
  });

  it("chiếm trực tiếp mọi tỉnh/thủ phủ cũng cho kiểm soát hoàn toàn dù chư hầu không thần phục", () => {
    const s = starkPlayer();
    s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    seedVassals(s);
    for (const region of regionsForRealm("the-north")) {
      s["Chủ Quyền Lãnh Thổ"][region.id]["Nhà Kiểm Soát"] = "stark";
      s["Chủ Quyền Lãnh Thổ"][region.id]["Là Của Người Chơi"] = true;
    }
    for (const vassal of Object.values(s["Chư Hầu"])) vassal["Chủ Của"] = "";

    const beforeOccupation = realmControlStatus(s, "the-north");
    expect(beforeOccupation.complete).toBe(false);
    for (const stronghold of beforeOccupation.unsecuredStrongholds) {
      s["Lãnh Địa"][`occupied-${stronghold.id}`] = makeHolding({
        regionId: stronghold.provinceId,
        name: stronghold.name,
        lord: "Eddard Stark",
      }) as StatData["Lãnh Địa"][string];
    }

    const control = realmControlStatus(s, "the-north");
    expect(control.complete).toBe(true);
    expect(control.directlyHeldStrongholds).toBe(control.totalStrongholds);
    expect(provinceControlStatus(s, "north-dreadfort").complete).toBe(true);
    repairPlayerSovereignty(s);
    expect(s["Chủ Quyền Lãnh Thổ"]["the-north"]["Kiểm Soát Hoàn Toàn"]).toBe(true);
  });

  it("castle phong kiến là mục tiêu; cứ điểm Night's Watch, city và landmark không bị nhập nhầm", () => {
    const s = starkPlayer();
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    seedVassals(s);
    const control = provinceControlStatus(s, "the-north");
    expect(control.strongholds.some((stronghold) => stronghold.id === "castle:castle-black")).toBe(false);
    expect(control.strongholds.some((stronghold) => stronghold.id === "castle:the-wall")).toBe(false);
    expect(control.strongholds.some((stronghold) => stronghold.id === "castle:winter-town")).toBe(false);
  });

  it("công sự không có lãnh chúa riêng đi theo quyền kiểm soát tỉnh nên graph có thể hoàn tất", () => {
    const s = starkPlayer();
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    seedVassals(s);
    const neck = provinceControlStatus(s, "north-neck");
    const moat = neck.strongholds.find((stronghold) => stronghold.id === "castle:moat-cailin");
    expect(moat?.controlled).toBe(true);
    expect(moat?.kind).toBe("Qua Chư Hầu");
  });
});

describe("Extractor chặn AI ghi thẳng Chủ Quyền (9.5.1)", () => {
  it("op AI ghi Chủ Quyền Lãnh Thổ bị lọc — engine giữ số", () => {
    expect(rejectReason({ op: "replace", path: "stat_data.Chủ Quyền Lãnh Thổ.the-north.Nhà Kiểm Soát", value: "lannister" })).toBeTruthy();
    // field _ vẫn bị chặn
    expect(rejectReason({ op: "replace", path: "stat_data.Chủ Quyền Lãnh Thổ.the-north._Ngày Đổi Chủ", value: 5 })).toBeTruthy();
    // ghi Lãnh Địa nội bộ (Dân Số) thì cho phép
    expect(rejectReason({ op: "delta", path: "stat_data.Lãnh Địa.the-north-seat.Dân Số", value: -100 })).toBeNull();
  });
});
