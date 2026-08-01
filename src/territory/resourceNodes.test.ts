import { describe, expect, it } from "vitest";
import { ResourceNodeSchema, TerritorySchema } from "../mvu/schema";
import { makeHolding } from "./territoryEngine";
import { localTerrainMap, terrainAtCell } from "./localTerrain";
import { BUILDABLE_LIST } from "../content/westeros/buildings";
import {
  bestNodeFor, ensureResourceNodes, generateNodes, nodeAreaKm2, nodeCapacity, nodeWorkers,
  nodeContainsResource, overlapsKeepReserve, overlapsWallReserve, RESOURCE_NODE_LIMIT,
  partitionResourceCoverages, RESOURCE_ZONE_COMPOSITION, RESOURCE_ZONE_TYPES,
} from "./resourceNodes";

describe("điểm tài nguyên tránh lõi thành", () => {
  const map = localTerrainMap("resource-clearance", { terrain: "Đồi Núi", seed: 717 });

  it("không gieo điểm tài nguyên mới vào sân thành", () => {
    const nodes = generateNodes(map);
    expect(nodes.length).toBeGreaterThan(20);
    expect(nodes.every((n) => n["Vùng Bao Phủ"].every((p) => !overlapsKeepReserve(p.x, p.y, 5)))).toBe(true);
    expect(nodes.length).toBeLessThanOrEqual(RESOURCE_NODE_LIMIT);
  });

  it("chỉ dùng bốn vùng chính và mọi bảng thành phần đều đủ 100%", () => {
    const nodes = generateNodes(map);
    expect(nodes.every((node) => RESOURCE_ZONE_TYPES.includes(node["Tài Nguyên"] as typeof RESOURCE_ZONE_TYPES[number]))).toBe(true);
    for (const composition of Object.values(RESOURCE_ZONE_COMPOSITION)) {
      expect(Object.values(composition).reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 8);
    }
    const minerals = nodes.find((node) => node["Tài Nguyên"] === "Khoáng Sản");
    expect(minerals).toBeTruthy();
    expect(nodeContainsResource(minerals!, "Quặng Sắt")).toBe(true);
    expect(nodeContainsResource(minerals!, "Hắc Diện Thạch")).toBe(true);
  });

  it("mọi sản vật đều có ít nhất một công trình khai thác tương ứng", () => {
    for (const composition of Object.values(RESOURCE_ZONE_COMPOSITION)) {
      for (const resource of Object.keys(composition)) {
        const extractors = BUILDABLE_LIST.filter((building) => building.requiresNode?.includes(resource));
        expect(extractors.length, `thiếu công trình cho ${resource}`).toBeGreaterThan(0);
      }
    }
  });

  it("tâm vùng tài nguyên luôn nằm trên đúng loại địa hình", () => {
    const nodes = generateNodes(map);
    const allowed = {
      "Rừng Rậm": ["Rừng Rậm"],
      "Khoáng Sản": ["Đồi Núi", "Hẻm Núi", "Sa Mạc", "Tuyết/Băng Giá"],
      "Sông Hồ": ["Sông/Lối Vượt Sông", "Đầm Lầy"],
      "Biển Cả": ["Biển"],
    } as const;
    for (const node of nodes) {
      const terrain = terrainAtCell(map, node["Tọa Độ X"], node["Tọa Độ Y"]);
      expect(allowed[node["Tài Nguyên"] as keyof typeof allowed]).toContain(terrain);
    }
  });

  it("cắt hai vùng chồng nhau thành hai miền riêng có khe ở giữa", () => {
    const makeZone = (id: string, x: number) => ResourceNodeSchema.parse({
      "Mã": id, "Tài Nguyên": "Khoáng Sản", "Trữ Lượng": 3, "Còn Lại": 70_000,
      "Tọa Độ X": x, "Tọa Độ Y": 100, "Kích Thước": 120,
      "Vùng Bao Phủ": [{ x: 40, y: 40 }, { x: 200, y: 40 }, { x: 200, y: 160 }, { x: 40, y: 160 }],
      "Đã Khám Phá": true, "Công Trình": "", "Mô Tả": "Vùng thử nghiệm",
    });
    const [left, right] = partitionResourceCoverages([makeZone("left", 100), makeZone("right", 140)], 8);
    expect(Math.max(...left["Vùng Bao Phủ"].map((point) => point.x))).toBeLessThanOrEqual(116);
    expect(Math.min(...right["Vùng Bao Phủ"].map((point) => point.x))).toBeGreaterThanOrEqual(124);
  });

  it("lấy mẫu đều bốn phía thành thay vì cắt các hàng ở phía bắc", () => {
    const nodes = generateNodes(map);
    const byQuarter = [0, 0, 0, 0];
    for (const node of nodes) {
      const east = node["Tọa Độ X"] >= 750 ? 1 : 0;
      const south = node["Tọa Độ Y"] >= 750 ? 1 : 0;
      byQuarter[south * 2 + east]++;
    }
    const north = byQuarter[0] + byQuarter[1];
    const south = byQuarter[2] + byQuarter[3];
    expect(Math.abs(north - south)).toBeLessThan(55);
    expect(south).toBeGreaterThan(20);
  });

  it("bổ sung lại mạch nền cho save từng bị giới hạn 18 điểm", () => {
    const baseline = generateNodes(map);
    expect(baseline.length).toBeGreaterThan(18);
    const holding = TerritorySchema.parse(makeHolding({ danSo: 8_000, regionId: "the-westerlands" }));
    holding["Điểm Tài Nguyên"] = baseline.slice(0, 18);

    const repaired = ensureResourceNodes(holding, map);
    expect(repaired).toHaveLength(baseline.length);
    expect(repaired.every((node) => node["Vùng Bao Phủ"].every((p) => !overlapsKeepReserve(p.x, p.y, 5)))).toBe(true);
  });

  it("dời mạch trong dữ liệu cũ ra ngoài thành thay vì để chồng lấn", () => {
    const holding = TerritorySchema.parse(makeHolding({ danSo: 8_000, regionId: "the-westerlands" }));
    holding["Điểm Tài Nguyên"] = [{
      "Mã": "legacy-core", "Tài Nguyên": "Quặng Sắt", "Trữ Lượng": 2, "Còn Lại": 12_000,
      "Tọa Độ X": 750, "Tọa Độ Y": 750, "Kích Thước": 12,
      "Đã Khám Phá": true, "Công Trình": "", "Mô Tả": "Mạch cũ",
    }];

    const repaired = ensureResourceNodes(holding, map);
    expect(overlapsKeepReserve(repaired[0]["Tọa Độ X"], repaired[0]["Tọa Độ Y"], 10)).toBe(false);
    expect(repaired[0]["Vùng Bao Phủ"].every((p) => !overlapsKeepReserve(p.x, p.y, 5))).toBe(true);
  });

  it("dời mạch cũ ra khỏi cả thân lẫn góc tường thành", () => {
    const holding = TerritorySchema.parse(makeHolding({ danSo: 8_000, regionId: "the-westerlands" }));
    holding["Tường Thành"] = [{
      "Mã": "wall-test", "Tên": "Tường phía đông", "Cấp": 3, "Vật Liệu": "Đá",
      "Điểm": [{ x: 900, y: 1_000 }, { x: 1_100, y: 1_000 }], "Chiều Dài": 200,
      "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Nguyên Vẹn": 100,
    }];
    holding["Điểm Tài Nguyên"] = [{
      "Mã": "legacy-wall", "Tài Nguyên": "Đá", "Trữ Lượng": 2, "Còn Lại": 12_000,
      "Tọa Độ X": 1_020, "Tọa Độ Y": 1_000, "Kích Thước": 12,
      "Đã Khám Phá": true, "Công Trình": "", "Mô Tả": "Mạch cũ nằm trên tường",
    }];

    const repaired = ensureResourceNodes(holding, map);
    const node = repaired[0];
    expect(overlapsWallReserve(holding["Tường Thành"], node["Tọa Độ X"], node["Tọa Độ Y"], 10)).toBe(false);
    expect(node["Vùng Bao Phủ"].every((p) => !overlapsWallReserve(holding["Tường Thành"], p.x, p.y, 5))).toBe(true);
  });

  it("cấp trữ lượng quyết định diện tích và số công trình tối đa", () => {
    const nodes = generateNodes(map);
    const rich = nodes.find((node) => node["Trữ Lượng"] === 3);
    const poor = nodes.find((node) => node["Trữ Lượng"] === 1);
    expect(rich).toBeTruthy();
    expect(poor).toBeTruthy();
    expect(nodeCapacity(rich!)).toBe(3);
    expect(nodeCapacity(poor!)).toBe(1);
    expect(nodeAreaKm2(rich!)).toBeGreaterThan(nodeAreaKm2(poor!));
    expect(nodeWorkers(rich!)).toEqual([]);
  });

  it("vùng giàu cho ba công trình cùng khai thác nhưng chặn công trình thứ tư", () => {
    const node = ResourceNodeSchema.parse({
      "Mã": "rich-zone", "Tài Nguyên": "Quặng Sắt", "Trữ Lượng": 3, "Còn Lại": 70_000,
      "Tọa Độ X": 100, "Tọa Độ Y": 100, "Kích Thước": 80,
      "Vùng Bao Phủ": [{ x: 20, y: 20 }, { x: 180, y: 20 }, { x: 180, y: 180 }, { x: 20, y: 180 }],
      "Đã Khám Phá": true, "Công Trình": "Mỏ Sắt 1",
      "Công Trình Khai Thác": ["Mỏ Sắt 1", "Mỏ Sắt 2"], "Mô Tả": "Vùng sắt giàu",
    });
    expect(bestNodeFor([node], ["Quặng Sắt"], 80, 80, 12)?.["Mã"]).toBe("rich-zone");
    node["Công Trình Khai Thác"].push("Mỏ Sắt 3");
    expect(bestNodeFor([node], ["Quặng Sắt"], 80, 80, 12)).toBeNull();
  });
});
