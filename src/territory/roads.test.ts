import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "./territoryEngine";
import { buildRoad, freezeAutoRoads, removeAutoRoad, removeRoad, restoreAutoRoads, roadLength } from "./roads";

function lordState() {
  const state = makeDefaultState();
  state["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  seedRegionControl(state, "war-of-five-kings", { createIfMissing: true });
  return StatDataSchema.parse(state);
}

describe("đường đi thủ công", () => {
  it("chỉ lưu tuyến do người chơi tự vạch và giữ nguyên các điểm gãy", () => {
    const state = lordState();
    const points = [{ x: 400, y: 500 }, { x: 520, y: 560 }, { x: 680, y: 530 }];
    const result = buildRoad(state, "the-north-seat", points, { name: "Đường Mỏ", width: 2 });
    expect(result.ok).toBe(true);
    const next = applyPatch(state, result.ops).state;
    const road = next["Lãnh Địa"]["the-north-seat"]["Đường Đi"][0];
    expect(road["Tên"]).toBe("Đường Mỏ");
    expect(road["Loại"]).toBe("Đường Lớn");
    expect(road["Điểm"]).toEqual(points);
    expect(road["Bề Rộng"]).toBe(2);
    expect(roadLength(points)).toBeGreaterThan(280);
  });

  it("cho phép xây đường nhỏ với nét riêng thay vì luôn thành đường lớn", () => {
    const state = lordState();
    const result = buildRoad(state, "the-north-seat", [{ x: 400, y: 500 }, { x: 520, y: 560 }], {
      kind: "Đường Nhỏ",
      width: 1,
    });
    expect(result.ok).toBe(true);
    const next = applyPatch(state, result.ops).state;
    expect(next["Lãnh Địa"]["the-north-seat"]["Đường Đi"][0]["Loại"]).toBe("Đường Nhỏ");
  });

  it("người chơi có thể xoá tuyến thủ công", () => {
    let state = lordState();
    const built = buildRoad(state, "the-north-seat", [{ x: 300, y: 300 }, { x: 600, y: 600 }]);
    state = applyPatch(state, built.ops).state;
    const id = state["Lãnh Địa"]["the-north-seat"]["Đường Đi"][0]["Mã"];
    state = applyPatch(state, removeRoad(state, "the-north-seat", id)).state;
    expect(state["Lãnh Địa"]["the-north-seat"]["Đường Đi"]).toEqual([]);
  });

  it("ghi nhớ tuyến tự động đã xoá và có thể khôi phục tất cả", () => {
    let state = lordState();
    state = applyPatch(state, removeAutoRoad(state, "the-north-seat", "auto-main-0-test")).state;
    expect(state["Lãnh Địa"]["the-north-seat"]["Đường Tự Động Đã Xoá"]).toEqual(["auto-main-0-test"]);
    state = applyPatch(state, restoreAutoRoads(state, "the-north-seat")).state;
    expect(state["Lãnh Địa"]["the-north-seat"]["Đường Tự Động Đã Xoá"]).toEqual([]);
  });

  it("đóng băng mạng đường hiện tại và không thêm tuyến khi công trình mới xuất hiện", () => {
    let state = lordState();
    const currentRoads = [{
      "Mã": "auto-main-0-current",
      "Tên": "Quan lộ hiện tại",
      "Loại": "Đường Lớn" as const,
      "Điểm": [{ x: 100, y: 200 }, { x: 800, y: 200 }],
      "Bề Rộng": 3,
    }];
    state = applyPatch(state, freezeAutoRoads(state, "the-north-seat", currentRoads)).state;
    expect(state["Lãnh Địa"]["the-north-seat"]["Đường Tự Động Cố Định"]).toEqual(currentRoads);

    const roadForNewBuilding = [{
      "Mã": "auto-lane-new-building",
      "Tên": "Ngõ tới công trình mới",
      "Loại": "Đường Nhỏ" as const,
      "Điểm": [{ x: 300, y: 300 }, { x: 350, y: 350 }],
      "Bề Rộng": 1,
    }];
    expect(freezeAutoRoads(state, "the-north-seat", roadForNewBuilding)).toEqual([]);
    expect(state["Lãnh Địa"]["the-north-seat"]["Đường Tự Động Cố Định"]).toEqual(currentRoads);
  });
});
