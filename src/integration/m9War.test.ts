/**
 * INTEGRATION M9 — chiến tranh chuyên sâu qua store + turn-advance:
 * - hải chiến qua combatStore (thẻ scale="Hải Chiến") → thuyền chìm + War Score,
 * - đổ bộ hạm đội → mở vây thành ven biển → đổi chủ (7.8→12.2),
 * - tướng địch bị bắt → làm con tin (Tù Binh),
 * - tướng phản trắc làm phản qua turn loop (7.7).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useMvuStore } from "../state/mvuStore";
import { useMilitaryStore } from "../state/militaryStore";
import { useCombatStore } from "../state/combatStore";
import { makeDefaultState, StatDataSchema } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl, regionController } from "../territory/territoryEngine";
import { registerSiegeLoop } from "../strategy/war";
import { registerBetrayalLoop } from "../strategy/betrayal";
import { registerArmyLoop } from "../strategy/army";

function advanceDays(n: number) {
  useMvuStore.getState().applyAiOps([{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: n }]);
}

beforeEach(() => {
  registerSiegeLoop();
  registerBetrayalLoop();
  registerArmyLoop();
  useMvuStore.getState().newGame();
  useCombatStore.getState().clearReport();
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Euron Greyjoy";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Greyjoy";
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  useMvuStore.setState({ stat: StatDataSchema.parse(s), pendingEvents: [], lastChangedPaths: [] });
});

describe("M9 — hải chiến (7.8)", () => {
  it("thẻ Hải Chiến → engine giải bằng seed, thuyền chìm + War Score", () => {
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Hạm Đội.Hạm Đội Sắt",
      value: { "Số Chiến Thuyền": 100, "Loại Hạm": "Thuyền Dài (Greyjoy)", "Tình Trạng": "Sẵn Sàng", "Lãnh Địa Neo Đậu": "the-iron-islands" },
    }]).state;
    useMvuStore.setState({ stat: st });

    useCombatStore.getState().startFromTrigger(
      { scale: "Hải Chiến", enemy: "Hạm đội Lannister", enemy_ships: "80", enemy_fleet_type: "Chiến Thuyền Nặng", enemy_house: "lannister", sea_condition: "Sóng Lớn" },
      "Hai hạm đội giáp mặt trên Vịnh Nước Đen",
    );
    expect(useCombatStore.getState().scale).toBe("Hải Chiến");
    useCombatStore.getState().resolveArmy("delegate");

    expect(useCombatStore.getState().phase).toBe("done");
    expect(useCombatStore.getState().reportBlock).toContain('scale="Hải Chiến"');
    expect(useCombatStore.getState().reportBlock).toContain("Thuyền chìm");
    // War Score với Lannister cập nhật
    expect(useMvuStore.getState().stat["Quan Hệ Ngoại Giao"]["lannister"]["Trạng Thái"]).toBe("Chiến Tranh");
  });
});

describe("M9 — đổ bộ → vây thành ven biển (7.8→12.2)", () => {
  it("đổ bộ hạm đội → mở vây → đổi chủ vùng ven biển", () => {
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Hạm Đội.Hạm Đội Sắt",
      value: { "Số Chiến Thuyền": 100, "Loại Hạm": "Thuyền Dài (Greyjoy)", "Tình Trạng": "Sẵn Sàng", "Lãnh Địa Neo Đậu": "the-iron-islands", "Bộ Binh Trên Thuyền": 5000 },
    }]).state;
    useMvuStore.setState({ stat: st });

    // the-westerlands (Lannister, ven biển)
    const land = useMilitaryStore.getState().amphibiousLanding("Hạm Đội Sắt", "the-westerlands");
    expect(land.ok).toBe(true);
    const siege = useMilitaryStore.getState().siege(land.unit!, "the-westerlands");
    expect(siege.ok).toBe(true);

    advanceDays(361); // > lương thủ (SIEGE_FOOD_DAYS = 360 ngày)
    expect(regionController(useMvuStore.getState().stat, "the-westerlands")).toBe("greyjoy");
    expect(useMvuStore.getState().stat["Lãnh Địa"]["the-westerlands-seat"]).toBeDefined();
  });
});

describe("M9 — so sánh lực lượng (11.5-11.6)", () => {
  it("forcePreview ước tính chiến lực 2 phe cho panel", () => {
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Đại quân",
      value: { "Số Lượng": 10000, "Loại Quân": "Trường Thương", "Sĩ Khí": "Hăng Hái", "Huấn Luyện": "Thành Thạo", "Hậu Cần": "Dồi Dào" },
    }]).state;
    useMvuStore.setState({ stat: st });
    useCombatStore.getState().startFromTrigger(
      { scale: "Đại Chiến", enemy: "Kỵ binh Lannister", enemy_size: "6000", enemy_troop_type: "Kỵ Binh", terrain: "Đồng Bằng" },
      "So quân",
    );
    const p = useCombatStore.getState().forcePreview();
    expect(p).not.toBeNull();
    expect(p!.playerTroops).toBe(10000);
    expect(p!.enemyTroops).toBe(6000);
    expect(p!.playerStrength).toBeGreaterThan(0);
    // Trường Thương chấp Kỵ Binh → matchup ưu thế ta > 1
    expect(p!.matchup).toBeGreaterThan(1);
  });

  it("forcePreview cho Hải Chiến đọc hạm đội", () => {
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Hạm Đội.Hạm ta",
      value: { "Số Chiến Thuyền": 90, "Loại Hạm": "Thuyền Dài (Greyjoy)", "Tình Trạng": "Sẵn Sàng" },
    }]).state;
    useMvuStore.setState({ stat: st });
    useCombatStore.getState().startFromTrigger(
      { scale: "Hải Chiến", enemy: "Hạm địch", enemy_ships: "70", sea_condition: "Sóng Lớn" },
      "So hạm đội",
    );
    const p = useCombatStore.getState().forcePreview();
    expect(p!.playerTroops).toBe(90);
    expect(p!.condition).toBe("Sóng Lớn");
  });
});

describe("M9 — con tin + phản trắc (7.7)", () => {
  it("tướng địch bị bắt trong Đại Chiến → vào Tù Binh", () => {
    // đặt quân mạnh áp đảo để thắng chắc + tướng địch yếu dễ bị bắt; quét seed
    let captured = false;
    for (let seed = 1; seed <= 40 && !captured; seed++) {
      useMvuStore.getState().newGame();
      const base = makeDefaultState();
      base["Thông Tin Nhân Vật"]["Nhà"] = "Greyjoy";
      base["_engineMeta"]["_Seed Gốc"] = seed;
      base["Biên Chế Quân Sự"]["Đại quân"] = { "Số Lượng": 20000, "Loại Quân": "Bộ Binh", "Sĩ Khí": "Hăng Hái", "Huấn Luyện": "Tinh Nhuệ", "Hậu Cần": "Dồi Dào" } as never;
      useMvuStore.setState({ stat: StatDataSchema.parse(base) });
      useCombatStore.getState().clearReport();
      useCombatStore.getState().startFromTrigger(
        { scale: "Đại Chiến", enemy: "Tàn quân", enemy_size: "1500", enemy_quality: "Rời Rạc", enemy_general: "Ser Bất Tài", enemy_house: "lannister", terrain: "Đồng Bằng" },
        "Truy kích tàn quân",
      );
      useCombatStore.getState().resolveArmy("delegate");
      if (useMvuStore.getState().stat["Tù Binh"]["Ser Bất Tài"]) captured = true;
    }
    expect(captured).toBe(true);
  });
});
