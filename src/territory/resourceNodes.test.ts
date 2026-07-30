import { describe, expect, it } from "vitest";
import { TerritorySchema } from "../mvu/schema";
import { makeHolding } from "./territoryEngine";
import { localTerrainMap } from "./localTerrain";
import { ensureResourceNodes, generateNodes, overlapsKeepReserve, overlapsWallReserve, RESOURCE_NODE_LIMIT } from "./resourceNodes";

describe("điểm tài nguyên tránh lõi thành", () => {
  const map = localTerrainMap("resource-clearance", { terrain: "Đồi Núi", seed: 717 });

  it("không gieo điểm tài nguyên mới vào sân thành", () => {
    const nodes = generateNodes(map);
    expect(nodes).toHaveLength(200);
    expect(nodes.every((n) => !overlapsKeepReserve(n["Tọa Độ X"], n["Tọa Độ Y"], n["Kích Thước"]))).toBe(true);
    expect(nodes.length).toBeLessThanOrEqual(RESOURCE_NODE_LIMIT);
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
    expect(south).toBeGreaterThan(65);
  });

  it("bổ sung lại mạch nền cho save từng bị giới hạn 18 điểm", () => {
    const baseline = generateNodes(map);
    expect(baseline.length).toBeGreaterThan(18);
    const holding = TerritorySchema.parse(makeHolding({ danSo: 8_000, regionId: "the-westerlands" }));
    holding["Điểm Tài Nguyên"] = baseline.slice(0, 18);

    const repaired = ensureResourceNodes(holding, map);
    expect(repaired).toHaveLength(200);
    expect(repaired.every((node) => !overlapsKeepReserve(node["Tọa Độ X"], node["Tọa Độ Y"], node["Kích Thước"]))).toBe(true);
  });

  it("dời mạch trong dữ liệu cũ ra ngoài thành thay vì để chồng lấn", () => {
    const holding = TerritorySchema.parse(makeHolding({ danSo: 8_000, regionId: "the-westerlands" }));
    holding["Điểm Tài Nguyên"] = [{
      "Mã": "legacy-core", "Tài Nguyên": "Quặng Sắt", "Trữ Lượng": 2, "Còn Lại": 12_000,
      "Tọa Độ X": 750, "Tọa Độ Y": 750, "Kích Thước": 12,
      "Đã Khám Phá": true, "Công Trình": "", "Mô Tả": "Mạch cũ",
    }];

    const repaired = ensureResourceNodes(holding, map);
    expect(overlapsKeepReserve(repaired[0]["Tọa Độ X"], repaired[0]["Tọa Độ Y"], repaired[0]["Kích Thước"])).toBe(false);
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
    expect(overlapsWallReserve(holding["Tường Thành"], node["Tọa Độ X"], node["Tọa Độ Y"], node["Kích Thước"])).toBe(false);
  });
});
