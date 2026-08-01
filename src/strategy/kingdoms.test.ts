/**
 * Acceptance M21 — BÀN CỜ QUYỀN LỰC: cán cân đọc từ chủ quyền vùng (không phải
 * từ một bảng riêng), xếp hạng theo đinh tráng, vây thành nói được còn mấy ngày
 * và ai sẽ thắng, phe phái theo Era, và bảng KHÔNG ghi gì vào state.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { absoluteDay } from "../mvu/calendar";
import { REGIONS, REGIONS_BY_ID } from "../content/world/geography";
import { kingdomsBoard, powerName, regionLevy, mobilizationRateForRegion } from "./kingdoms";

/** Một lãnh chúa Stark nắm Phương Bắc; Lannister nắm Vùng Tây + Đất Vương Thất. */
function board(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thế Giới"]["Năm"] = 298;
  s["Chủ Quyền Lãnh Thổ"] = {
    "the-north": { "Nhà Kiểm Soát": "stark", "Người Kiểm Soát": "Eddard Stark", "Tình Trạng": "Ổn Định", "Là Của Người Chơi": true, "_Ngày Đổi Chủ": 0 },
    "the-westerlands": { "Nhà Kiểm Soát": "lannister", "Người Kiểm Soát": "Tywin Lannister", "Tình Trạng": "Ổn Định", "Là Của Người Chơi": false, "_Ngày Đổi Chủ": 0 },
    "the-crownlands": { "Nhà Kiểm Soát": "lannister", "Người Kiểm Soát": "", "Tình Trạng": "Ổn Định", "Là Của Người Chơi": false, "_Ngày Đổi Chủ": 0 },
    "the-riverlands": { "Nhà Kiểm Soát": "", "Người Kiểm Soát": "", "Tình Trạng": "Đang Tranh Chấp", "Là Của Người Chơi": false, "_Ngày Đổi Chủ": 0 },
  } as StatData["Chủ Quyền Lãnh Thổ"];
  return StatDataSchema.parse(s);
}

describe("Tên thế lực", () => {
  it("phủ cả Nhà canon, chư hầu, và Nhà cổ không có trong bảng lớn", () => {
    expect(powerName("stark")).toBe("Nhà Stark");
    expect(powerName("bolton")).toBe("Nhà Bolton"); // chỉ có trong bảng chư hầu
    expect(powerName("targaryen-black")).toBe("Phe Đen (Rhaenyra)"); // canon giữ tên phe
    // Nhà cổ chỉ xuất hiện ở bảng chủ quyền theo năm (Chinh Phạt) — vẫn phải đọc được
    expect(powerName("gardener")).toBe("Nhà Gardener");
    expect(powerName("durrandon")).toBe("Nhà Durrandon");
    expect(powerName("house-quen-lang")).toBe("Nhà House Quen Lang");
    expect(powerName("")).toBe("Vô Chủ");
  });
});

describe("Đinh tráng gọi được", () => {
  it("neo theo dân số của province lá, không nhân lại dân số macro", () => {
    expect(regionLevy("the-north")).toBe(
      Math.round(REGIONS_BY_ID["the-north"].population * mobilizationRateForRegion("the-north")),
    );
  });

  it("vùng không tồn tại thì bằng 0, không nổ", () => {
    expect(regionLevy("essos")).toBe(0);
  });
});

describe("Cán cân quyền lực", () => {
  it("gom vùng theo Nhà kiểm soát và xếp mạnh trước yếu sau", () => {
    const b = kingdomsBoard(board());
    // Tây 5tr + Vương Thất 2tr = 7tr > Bắc 4tr
    expect(b.powers.map((p) => p.houseId)).toEqual(["lannister", "stark"]);
    expect(b.powers[0].regionIds).toEqual(["the-westerlands", "the-crownlands"]);
    expect(b.powers[0].levy).toBe(regionLevy("the-westerlands") + regionLevy("the-crownlands"));
  });

  it("vùng VÔ CHỦ không tạo ra một thế lực", () => {
    const b = kingdomsBoard(board());
    expect(b.powers.some((p) => p.houseId === "")).toBe(false);
    expect(b.regions.find((r) => r.id === "the-riverlands")?.holderName).toBe("Vô Chủ");
  });

  it("biết ta là ai và ta đứng thứ mấy", () => {
    const b = kingdomsBoard(board());
    expect(b.playerHouseId).toBe("stark");
    expect(b.playerRank).toBe(2);
    const me = b.powers.find((p) => p.isPlayer);
    expect(me?.populationShare).toBeCloseTo(REGIONS_BY_ID["the-north"].population / b.totalPopulation, 5);
  });

  it("ta không nắm đất thì không có hạng — bàn cờ là của người khác", () => {
    const s = board();
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Nhà Kiểm Soát"] = "bolton";
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"] = false;
    const b = kingdomsBoard(s);
    expect(b.playerRank).toBeNull();
    expect(b.powers.some((p) => p.isPlayer)).toBe(false);
  });
});

describe("Quân của ta trên bàn cờ", () => {
  it("đếm quân nhà ta theo vùng đồn trú, bỏ quân của Nhà khác", () => {
    const s = board();
    s["Biên Chế Quân Sự"] = {
      "Quân Winterfell": { "Số Lượng": 3000, "Lãnh Địa Đồn Trú": "the-north", "Nhà": "" },
      "Quân Riverrun": { "Số Lượng": 1500, "Lãnh Địa Đồn Trú": "the-riverlands", "Nhà": "Stark" },
      "Quân Tywin": { "Số Lượng": 9000, "Lãnh Địa Đồn Trú": "the-westerlands", "Nhà": "Lannister" },
    } as unknown as StatData["Biên Chế Quân Sự"];
    const parsed = StatDataSchema.parse(s);
    const b = kingdomsBoard(parsed);
    expect(b.playerArmy).toBe(4500);
    expect(b.regions.find((r) => r.id === "the-north")?.ourTroops).toBe(3000);
    expect(b.regions.find((r) => r.id === "the-riverlands")?.ourTroops).toBe(1500);
    expect(b.regions.find((r) => r.id === "the-westerlands")?.ourTroops).toBe(0);
  });
});

describe("Vây thành", () => {
  function besieged(foodLeft: number, daysIn: number, maxDays = 600): StatData {
    const s = board();
    const sov = s["Chủ Quyền Lãnh Thổ"]["the-westerlands"];
    sov["Tình Trạng"] = "Bị Vây";
    sov["_Vây"] = {
      "Phe Vây": "stark", "Đơn Vị Vây": "Quân Winterfell",
      "Ngày Đã Vây": daysIn, "Lương Còn": foodLeft, "Ngày Vây Tối Đa": maxDays,
    };
    return StatDataSchema.parse(s);
  }

  it("hết lương trước hạn vây → thành THẤT THỦ, đếm đúng ngày còn lại", () => {
    const b = kingdomsBoard(besieged(40, 320));
    const r = b.regions.find((x) => x.id === "the-westerlands")!;
    expect(r.siege?.outcome).toBe("Thất Thủ");
    expect(r.siege?.daysToFall).toBe(40);
    expect(r.siege?.ours).toBe(true);
    expect(r.siege?.besiegerName).toBe("Nhà Stark");
    expect(b.sieges).toHaveLength(1);
  });

  it("quân vây hết hạn trước khi thành hết lương → RÃ VÂY", () => {
    const b = kingdomsBoard(besieged(300, 580));
    const r = b.regions.find((x) => x.id === "the-westerlands")!;
    expect(r.siege?.outcome).toBe("Rã Vây");
    expect(r.siege?.daysToRaise).toBe(20);
  });

  it("tiến độ vây bò từ 0 tới 1 và không tràn", () => {
    expect(kingdomsBoard(besieged(360, 0)).sieges[0].siege!.progress).toBe(0);
    const late = kingdomsBoard(besieged(0, 360)).sieges[0].siege!.progress;
    expect(late).toBe(1);
  });

  it("vùng bị vây không bị đếm hai lần vào danh sách vùng không yên", () => {
    const b = kingdomsBoard(besieged(40, 320));
    expect(b.unrest.some((r) => r.id === "the-westerlands")).toBe(false);
    expect(b.unrest.map((r) => r.id)).toContain("the-riverlands"); // Đang Tranh Chấp
  });
});

describe("Phe phái theo Era", () => {
  it("năm Chiến Tranh Ngũ Vương chia phe và biết phe nào có ta", () => {
    const b = kingdomsBoard(board());
    const names = b.factions.map((f) => f.name);
    expect(names).toContain("Phe Ngai Sắt");
    expect(names).toContain("Phe Phương Bắc");
    expect(b.factions.find((f) => f.name === "Phe Phương Bắc")?.ours).toBe(true);
    expect(b.factions.find((f) => f.name === "Phe Ngai Sắt")?.levy).toBe(
      regionLevy("the-westerlands") + regionLevy("the-crownlands"),
    );
    expect(b.powers.find((p) => p.houseId === "stark")?.faction).toBe("Phe Phương Bắc");
  });

  it("năm thái bình thì không chia phe", () => {
    const s = board();
    s["Thế Giới"]["Năm"] = 250;
    expect(kingdomsBoard(s).factions).toHaveLength(0);
  });
});

describe("Bàn cờ chỉ ĐỌC", () => {
  it("gọi bảng không đổi một byte nào của state", () => {
    const s = board();
    const before = JSON.stringify(s);
    kingdomsBoard(s);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("state trắng dùng số vùng động của lục địa hiện tại, không hard-code 9", () => {
    const s = StatDataSchema.parse(makeDefaultState());
    const b = kingdomsBoard(s);
    const expected = REGIONS.filter((region) => region.continentId === b.scopeContinentId);
    expect(b.regions).toHaveLength(expected.length);
    expect(b.scopeRegionCount).toBe(expected.length);
    expect(b.worldRegionCount).toBe(REGIONS.length);
    expect(b.powers).toHaveLength(0);
    expect(b.playerRank).toBeNull();
    expect(b.today).toBe(absoluteDay(s["Thế Giới"]));
  });

  it("chuyển phạm vi sang Essos theo vị trí người chơi", () => {
    const s = StatDataSchema.parse(makeDefaultState());
    const essos = REGIONS.find((region) => region.continentId === "essos")!;
    s["Thế Giới"]["Vị Trí"] = essos.id;
    s["Chủ Quyền Lãnh Thổ"][essos.id] = {
      "Nhà Kiểm Soát": essos.defaultHouse, "Người Kiểm Soát": "",
      "Tình Trạng": "Ổn Định", "Là Của Người Chơi": false, "_Ngày Đổi Chủ": 0,
    };
    const b = kingdomsBoard(s);
    expect(b.scopeContinentId).toBe("essos");
    expect(b.scopeContinentName).toBe("Essos");
    expect(b.regions.every((region) => region.continentId === "essos")).toBe(true);
    expect(b.scopeRegionCount).toBe(REGIONS.filter((region) => region.continentId === "essos").length);
  });
});
