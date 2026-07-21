/**
 * Acceptance M9 (7.8): hải chiến tái lập bằng seed, tương khắc loại hạm + điều
 * kiện biển đúng hướng, đổ bộ mở vây thành ven biển, phong toả cảng.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "../territory/territoryEngine";
import {
  resolveNaval, fleetMatchup, amphibiousLandingOps, blockadeOps, isPortBlockaded,
  type FleetSideInput,
} from "./naval";

const fleet = (partial?: Partial<FleetSideInput>): FleetSideInput => ({
  name: "Hạm ta", ships: 100, type: "Chiến Thuyền Nặng", status: "Sẵn Sàng", ...partial,
});

describe("Hải chiến (7.8)", () => {
  it("CÙNG SEED → CÙNG KẾT QUẢ (tái lập)", () => {
    const input = { playerFleet: fleet(), enemyFleet: fleet({ name: "Hạm địch" }), condition: "Biển Lặng" as const, seed: 42, difficulty: "Cân Bằng" as const };
    const a = resolveNaval(input);
    const b = resolveNaval(input);
    expect(a.outcome).toBe(b.outcome);
    expect(a.shipsLostPlayer).toBe(b.shipsLostPlayer);
    expect(a.shipsLostEnemy).toBe(b.shipsLostEnemy);
  });

  it("Thuyền Dài Greyjoy mạnh hơn khi Sóng Lớn; Hoả Công vô dụng khi Sóng Lớn", () => {
    const longship = fleet({ type: "Thuyền Dài (Greyjoy)" });
    const heavy = fleet({ type: "Chiến Thuyền Nặng" });
    const fire = fleet({ type: "Hạm Đội Hoả Công" });
    // Thuyền Dài vs Nặng: Sóng Lớn > Biển Lặng
    expect(fleetMatchup(longship, heavy, "Sóng Lớn")).toBeGreaterThan(fleetMatchup(longship, heavy, "Biển Lặng"));
    // Hoả Công: Biển Lặng (cụm đứng yên) > Sóng Lớn
    expect(fleetMatchup(fire, heavy, "Biển Lặng")).toBeGreaterThan(fleetMatchup(fire, heavy, "Sóng Lớn"));
    // Hoả Công khắc Chiến Thuyền Nặng (cụm lớn) — kiểu Blackwater
    expect(fleetMatchup(fire, heavy, "Biển Lặng")).toBeGreaterThan(1.0);
  });

  it("Bão gây thương vong ngẫu nhiên thêm cho CẢ 2 phe", () => {
    const calm = resolveNaval({ playerFleet: fleet(), enemyFleet: fleet(), condition: "Biển Lặng", seed: 7, difficulty: "Cân Bằng" });
    const storm = resolveNaval({ playerFleet: fleet(), enemyFleet: fleet(), condition: "Bão", seed: 7, difficulty: "Cân Bằng" });
    expect(storm.shipsLostPlayer + storm.shipsLostEnemy).toBeGreaterThan(calm.shipsLostPlayer + calm.shipsLostEnemy);
  });
});

function coastalLord(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Nhà"] = "Greyjoy";
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  s["Hạm Đội"]["Hạm Đội Sắt"] = {
    "Đô Đốc": "Victarion", "Số Chiến Thuyền": 100, "Loại Hạm": "Thuyền Dài (Greyjoy)",
    "Tình Trạng": "Sẵn Sàng", "Lãnh Địa Neo Đậu": "the-iron-islands", "Bộ Binh Trên Thuyền": 3000,
  } as never;
  return StatDataSchema.parse(s);
}

describe("Đổ bộ + phong toả (7.8)", () => {
  it("đổ bộ hạm đội chở quân → tạo quân đổ bộ tại lãnh địa ven biển địch", () => {
    const s = coastalLord();
    // the-riverlands KHÔNG ven biển → chặn; the-westerlands ven biển (Lannister)
    expect(amphibiousLandingOps(s, "Hạm Đội Sắt", "the-riverlands").ok).toBe(false);
    const r = amphibiousLandingOps(s, "Hạm Đội Sắt", "the-westerlands");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Biên Chế Quân Sự"][r.landingUnit!]["Số Lượng"]).toBe(3000);
    expect(state["Biên Chế Quân Sự"][r.landingUnit!]["Lãnh Địa Đồn Trú"]).toBe("the-westerlands");
    expect(state["Hạm Đội"]["Hạm Đội Sắt"]["Bộ Binh Trên Thuyền"]).toBe(0); // đã đổ hết
  });

  it("phong toả cảng địch → cờ Đang Phong Toả + isPortBlockaded", () => {
    const s = coastalLord();
    const r = blockadeOps(s, "Hạm Đội Sắt", "the-westerlands");
    expect(r.ok).toBe(true);
    const { state } = applyPatch(s, r.ops);
    expect(state["Hạm Đội"]["Hạm Đội Sắt"]["Đang Phong Toả"]).toBe("the-westerlands");
    expect(isPortBlockaded(state, "the-westerlands")).toBe(true);
    expect(isPortBlockaded(state, "the-north")).toBe(false);
  });
});
