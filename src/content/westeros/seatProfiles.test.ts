import { describe, expect, it } from "vitest";
import { autoBuildCity, autoBuildWalls } from "../../character/characterInit";
import { seatGatesFor, seatProfileFor } from "./seatProfiles";
import { loreSeatFor } from "./loreSeats";
import { localTerrainMap, terrainAtCell } from "../../territory/localTerrain";
import { makeDefaultState, TerritorySchema } from "../../mvu/schema";
import { makeHolding } from "../../territory/territoryEngine";
import { buildingLedgers } from "../../territory/construction";
import { summarizeHolding } from "../../territory/mapAggregate";
import { occupiedRects, repairAllHoldings } from "../../territory/localMap";
import { buildingDefense } from "../../territory/population";

describe("hồ sơ trọng trấn theo era", () => {
  it("dựng King's Landing nhỏ với Aegonfort ở thời Chinh Phạt", () => {
    const profile = seatProfileFor("kings-landing", "aegon-conquest");
    expect(profile?.population).toBe(12_000);
    expect(profile?.landmarks.map((site) => site.name)).toContain("Aegonfort");
    expect(profile?.landmarks.map((site) => site.name)).not.toContain("Đại Thánh Đường Baelor");
  });

  it("dùng Dragonpit đang hoạt động trong Dance, rồi Đại Thánh Đường và phế tích ở thời truyện", () => {
    const dance = seatProfileFor("kings-landing", "dance-of-dragons");
    const books = seatProfileFor("kings-landing", "war-of-five-kings");
    expect(dance?.landmarks.map((site) => site.name)).toContain("Dragonpit");
    expect(dance?.landmarks.map((site) => site.name)).not.toContain("Đại Thánh Đường Baelor");
    expect(books?.population).toBe(500_000);
    expect(books?.landmarks.map((site) => site.name)).toEqual(expect.arrayContaining([
      "Đại Thánh Đường Baelor", "Tàn tích Dragonpit", "Flea Bottom",
    ]));
  });

  it("đưa kỳ quan và tường không-tròn của thủ đô vào bố cục khởi tạo", () => {
    const city = autoBuildCity(1, "kings-landing", "the-crownlands", "war-of-five-kings");
    expect(city["Đại Thánh Đường Baelor"]?.["Tuỳ Chỉnh"]?.["Nhóm"]).toBe("Tín ngưỡng");
    expect(city["Flea Bottom"]?.["Tuỳ Chỉnh"]?.["Sức Chứa Dân"]).toBe(45_000);
    expect(city["Cảng Blackwater"]?.["Tuỳ Chỉnh"]?.["Sản Xuất"]?.["Ngân Khố"]).toBeGreaterThan(0);
    expect(city["Cảng Blackwater"]?.["Tuỳ Chỉnh"]?.["Nhân Lực"]?.["Thương Nhân"]).toBeGreaterThan(0);

    const walls = autoBuildWalls(1, "kings-landing", "war-of-five-kings");
    expect(walls).toHaveLength(1);
    expect(walls[0]["Điểm"]).toHaveLength(13);
    expect(walls[0]["Điểm"][0]).not.toEqual(walls[0]["Điểm"][3]);
    expect(seatGatesFor("kings-landing")).toHaveLength(7);
  });

  it("đưa hiệu ứng kỳ quan vào sổ kinh tế, việc làm và phòng thủ bản đồ", () => {
    const state = makeDefaultState();
    const holding = TerritorySchema.parse(makeHolding({
      regionId: "the-crownlands", coastal: true, danSo: 500_000, moTa: "King's Landing",
    }));
    state["Lãnh Địa"]["the-crownlands-seat"] = holding;
    holding["Công Trình"] = autoBuildCity(5, "kings-landing", "the-crownlands", "war-of-five-kings");

    const port = buildingLedgers("the-crownlands-seat", holding).find((ledger) => ledger.name === "Cảng Blackwater");
    expect(port?.produce["Ngân Khố"]).toBeGreaterThan(0);
    expect(port?.needByJob["Thương Nhân"]).toBeGreaterThan(0);

    const withRedKeep = summarizeHolding(state, "the-crownlands-seat").defense;
    delete holding["Công Trình"]["Red Keep"];
    const withoutRedKeep = summarizeHolding(state, "the-crownlands-seat").defense;
    expect(withRedKeep - withoutRedKeep).toBe(30);
  });

  it("gắn tối đa ba thị trấn hoặc thành trì phụ vào lãnh địa với công trình vận hành thật", () => {
    const profile = seatProfileFor("kings-landing", "war-of-five-kings");
    expect(profile?.satellites).toHaveLength(3);
    expect(profile?.satellites?.every((site) => site.population > 0)).toBe(true);

    const city = autoBuildCity(5, "kings-landing", "the-crownlands", "war-of-five-kings");
    expect(city["Rosby"]?.["Tuỳ Chỉnh"]?.["Nhóm"]).toBe("Thành trì phụ");
    expect(city["Tháp canh Rosby"]?.["Loại"]).toBe("Tháp Canh");
    expect(city["Nhà ở Hayford"]?.["Loại"]).toBe("Nhà Ở");
  });

  it("gộp Dragonstone vào lâu đài trung tâm và chừa khoảng trống cho mọi silhouette", () => {
    const city = autoBuildCity(4, "dragonstone", "the-crownlands", "war-of-five-kings");
    expect(city["Dragonstone"]?.["Loại"]).toBe("Lâu Đài");
    expect(city["Lâu Đài"]).toBeUndefined();
    expect(buildingDefense(city["Dragonstone"]!)).toBe(22);

    const holding = TerritorySchema.parse(makeHolding({
      regionId: "the-crownlands", coastal: true, danSo: 3_000, moTa: "Dragonstone",
    }));
    holding["Công Trình"] = city;
    const rects = occupiedRects(holding);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlap =
          a.x - a.clearance < b.x + b.size + b.clearance && b.x - b.clearance < a.x + a.size + a.clearance &&
          a.y - a.clearance < b.y + b.size + b.clearance && b.y - b.clearance < a.y + a.size + a.clearance;
        expect(overlap).toBe(false);
      }
    }
  });

  it("sửa save cũ có marker Dragonstone đứng riêng thành một lâu đài duy nhất", () => {
    const state = makeDefaultState();
    const holding = TerritorySchema.parse(makeHolding({
      regionId: "the-crownlands", coastal: true, danSo: 3_000, moTa: "Dragonstone",
    }));
    const city = autoBuildCity(4, "dragonstone", "the-crownlands", "war-of-five-kings");
    const core = city["Dragonstone"]!;
    const { ["Tuỳ Chỉnh"]: _lore, ...plainKeep } = core;
    holding["Công Trình"] = {
      "Lâu Đài": plainKeep,
      "Dragonstone": { ...core, "Loại": "Công Trình Tuỳ Chỉnh" },
    };
    state["Lãnh Địa"]["dragonstone"] = holding;

    repairAllHoldings(state);
    expect(holding["Công Trình"]["Dragonstone"]?.["Loại"]).toBe("Lâu Đài");
    expect(holding["Công Trình"]["Lâu Đài"]).toBeUndefined();
    expect(buildingDefense(holding["Công Trình"]["Dragonstone"]!)).toBe(22);
  });

  it("giữ Winterfell là hai sân tường, thay vì vòng tròn chung", () => {
    const walls = autoBuildWalls(1, "winterfell", "war-of-five-kings");
    expect(walls).toHaveLength(2);
    expect(walls[1]["Tên"]).toBe("Tường Thành Nội");
  });

  it("ghim hai dòng sông của Riverrun vào địa hình thay vì để seed quyết định", () => {
    const lore = loreSeatFor("riverrun");
    if (!lore) throw new Error("Thiếu lore Riverrun");
    const map = localTerrainMap("riverrun", { terrain: lore.terrain, coastal: lore.coastal, lore });
    expect(map.extraRivers).toHaveLength(1);
    expect(terrainAtCell(map, 1_000, 580)).toBe("Sông/Lối Vượt Sông");
    expect(terrainAtCell(map, 470, 650)).toBe("Sông/Lối Vượt Sông");
  });
});
