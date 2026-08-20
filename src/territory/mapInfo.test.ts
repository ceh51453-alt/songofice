import { describe, expect, it } from "vitest";
import { DiplomacyRelationSchema, makeDefaultState } from "../mvu/schema";
import { factionIdForRegion, seedRegionControl } from "./territoryEngine";
import { deJureRealms, factionIdForHouse, factionMapSummaries, relationshipMapSummary } from "./mapAggregate";

function state() {
  const current = makeDefaultState();
  current["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  current["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  current["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  current["Thế Giới"]["Năm"] = 298;
  seedRegionControl(current, "war-of-five-kings", { createIfMissing: true });
  return current;
}

describe("Hồ sơ bản đồ vương quốc, phe phái và quan hệ", () => {
  it("vương quốc đọc kiểm soát của thế lực trội, không mặc định đọc Nhà người chơi", () => {
    const current = state();
    const west = deJureRealms(current, "war-of-five-kings")
      .find((realm) => realm.realmId === "the-westerlands")!;
    expect(west.controller).toBe("lannister");
    expect(west.controlledStrongholds).toBeGreaterThan(0);
    expect(west.isPlayerRealm).toBe(false);
  });

  it("mỗi vùng ở lớp phe phái được tính đúng một lần và có số thành live", () => {
    const current = state();
    const factions = factionMapSummaries(current, "war-of-five-kings");
    const regionIds = factions.flatMap((faction) => faction.regionIds);
    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(factions.reduce((sum, faction) => sum + faction.totalStrongholds, 0)).toBeGreaterThan(100);
    expect(factionIdForHouse(current, "stark")).not.toBe("__neutral__");
  });

  it("nhận dạng cùng một phe khi save cũ ghi schemaName thay vì houseId", () => {
    const current = state();
    current["Chủ Quyền Lãnh Thổ"]["the-north"]["Nhà Kiểm Soát"] = "Stark";
    expect(factionIdForHouse(current, "Stark")).toBe(factionIdForHouse(current, "stark"));
    const starkFaction = factionIdForHouse(current, "Stark");
    expect(factionMapSummaries(current, "war-of-five-kings")
      .find((faction) => faction.factionId === starkFaction)?.regionIds)
      .toContain("the-north");
  });

  it("không ép một Nhà độc lập vào phe của thủ phủ de-jure", () => {
    const current = state();
    expect(factionIdForRegion(current, "north-dreadfort", "bolton"))
      .toBe("house:bolton");
    expect(factionIdForRegion(current, "north-dreadfort", "bolton"))
      .not.toBe(factionIdForHouse(current, "stark"));
  });

  it("không báo 100% giả khi phe còn province chưa có kiểm soát hoàn toàn", () => {
    const current = state();
    current["Chủ Quyền Lãnh Thổ"]["braavos"]["Nhà Kiểm Soát"] = "";
    const neutral = factionMapSummaries(current, "war-of-five-kings")
      .find((faction) => faction.factionId === "__neutral__")!;
    expect(neutral.fullyControlledRegions).toBeLessThan(neutral.regionIds.length);
    expect(neutral.controlRatio).toBeLessThan(1);
  });

  it("thời Aegon giữ bảy vương quốc thành bảy phe độc lập", () => {
    const current = state();
    current["Thế Giới"]["Năm"] = -2;
    expect(factionIdForRegion(current, "the-north", "stark")).toBe("Vương Quốc Phương Bắc");
    expect(factionIdForRegion(current, "the-vale", "arryn")).toBe("Vương Quốc Núi và Thung Lũng");
    expect(factionIdForRegion(current, "the-north", "stark"))
      .not.toBe(factionIdForRegion(current, "the-vale", "arryn"));
  });

  it("bản đồ quan hệ tách thái độ khỏi trạng thái pháp lý và gom đúng đất của Nhà", () => {
    const current = state();
    current["Thái Độ Các Nhà"]["Lannister"] = { "Thái Độ": "Bất Mãn", "Mô Tả": "Họ không quên món nợ cũ." };
    current["Quan Hệ Ngoại Giao"]["lannister"] = DiplomacyRelationSchema.parse({
      "Trạng Thái": "Liên Minh",
      "Tin Cậy": -32,
      "Hiệp Ước": [{ "Loại": "Liên Minh Quân Sự", "Còn Hiệu Lực": true }],
      "Ân Oán": [{ "Việc": "Món nợ cũ", "Mức": 40, "Bên Nợ": "Họ Nợ Ta" }],
    });

    const summary = relationshipMapSummary(current, "Lannister", "war-of-five-kings")!;
    expect(summary.attitude).toBe("Bất Mãn");
    expect(summary.diplomaticStatus).toBe("Liên Minh");
    expect(summary.trust).toBe(-32);
    expect(summary.treatyNames).toContain("Liên Minh Quân Sự");
    expect(summary.ourClaim).toBe(40);
    expect(summary.regionIds).toContain("the-westerlands");
    expect(summary.population).toBeGreaterThan(0);
  });
});
