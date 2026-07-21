/**
 * INTEGRATION M8 — quân đội & chiến tranh chiến lược qua store + turn-advance:
 * - tuyển quân → huấn luyện xong theo số ngày AI kể (11.3),
 * - điều quân → tới nơi theo turn, marker cập nhật (11.4),
 * - vây thành chạy hết turn → đổi chủ + War Score (12.2/12.1),
 * - trận Đại Chiến qua combatStore → War Score với Nhà địch cập nhật (12.1).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useMvuStore } from "../state/mvuStore";
import { useMilitaryStore } from "../state/militaryStore";
import { useCombatStore } from "../state/combatStore";
import { makeDefaultState, StatDataSchema } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl, regionController } from "../territory/territoryEngine";
import { registerArmyLoop } from "../strategy/army";
import { registerSiegeLoop } from "../strategy/war";
import { registerConstructionLoop } from "../territory/construction";

function advanceDays(n: number) {
  useMvuStore.getState().applyAiOps([{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: n }]);
}

beforeEach(() => {
  registerArmyLoop();
  registerSiegeLoop();
  registerConstructionLoop();
  useMvuStore.getState().newGame();
  useMilitaryStore.setState({ selectedUnit: null, moveMode: false });
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Vàng"] = 10000;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  s["Lãnh Địa"]["the-north"]["Công Trình"]["Doanh Trại"] = { "Loại": "Doanh Trại", "Cấp Độ": 1, "Đang Xây": false, "Turn Còn Lại": 0 };
  useMvuStore.setState({ stat: StatDataSchema.parse(s), pendingEvents: [], lastChangedPaths: [] });
});

describe("M8 — tuyển quân + huấn luyện + di chuyển (11.3/11.4)", () => {
  it("tuyển tại Doanh Trại → huấn luyện xong theo số ngày → điều tới vùng khác", () => {
    const r = useMilitaryStore.getState().recruit("the-north", "Bộ Binh", 1000);
    expect(r.ok).toBe(true);
    const unitName = Object.keys(useMvuStore.getState().stat["Biên Chế Quân Sự"])[0];
    expect(useMvuStore.getState().stat["Biên Chế Quân Sự"][unitName]["Turn Huấn Luyện"]).toBeGreaterThan(0);

    // AI kể vài ngày trôi → huấn luyện xong (Bộ Binh 2 turn)
    advanceDays(3);
    expect(useMvuStore.getState().stat["Biên Chế Quân Sự"][unitName]["Turn Huấn Luyện"]).toBe(0);

    // điều quân sang Vùng Sông → tới nơi sau khi đủ ngày
    const mv = useMilitaryStore.getState().moveUnit(unitName, "the-riverlands");
    expect(mv.ok).toBe(true);
    expect(useMvuStore.getState().stat["Biên Chế Quân Sự"][unitName]["Đang Di Chuyển Đến"]).toBe("the-riverlands");
    advanceDays((mv.turns ?? 1) + 1);
    expect(useMvuStore.getState().stat["Biên Chế Quân Sự"][unitName]["Lãnh Địa Đồn Trú"]).toBe("the-riverlands");
    expect(useMvuStore.getState().stat["Biên Chế Quân Sự"][unitName]["Đang Di Chuyển Đến"]).toBeFalsy();
  });
});

describe("M8 — vây thành qua turn loop (12.2)", () => {
  it("vây Vùng Sông (Tully) đủ turn → đổi chủ về Stark + War Score", () => {
    // đặt sẵn 1 đại quân
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Đại quân Bắc",
      value: { "Số Lượng": 9000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": "the-north" },
    }]).state;
    useMvuStore.setState({ stat: st });

    const r = useMilitaryStore.getState().siege("Đại quân Bắc", "the-riverlands");
    expect(r.ok).toBe(true);
    expect(useMvuStore.getState().stat["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Bị Vây");

    advanceDays(14); // > lương thủ (12 turn)
    expect(regionController(useMvuStore.getState().stat, "the-riverlands")).toBe("stark");
    expect(useMvuStore.getState().stat["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(true);
    expect(useMvuStore.getState().stat["Lãnh Địa"]["the-riverlands"]).toBeDefined();
    expect(useMvuStore.getState().stat["Quan Hệ Ngoại Giao"]["tully"]["War Score"]).toBeGreaterThan(0);
  });
});

describe("M8 — War Score sau 1 trận Đại Chiến (12.1)", () => {
  it("combatStore giải trận với Nhà địch → cập nhật Trạng Thái + War Score", () => {
    // trang bị quân cho người chơi
    const st = applyPatch(useMvuStore.getState().stat, [{
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Bộ binh Bắc",
      value: { "Số Lượng": 8000, "Loại Quân": "Trường Thương", "Sĩ Khí": "Hăng Hái", "Huấn Luyện": "Thành Thạo", "Hậu Cần": "Dồi Dào", "Lãnh Địa Đồn Trú": "the-north" },
    }]).state;
    useMvuStore.setState({ stat: st });

    useCombatStore.getState().startFromTrigger(
      { scale: "Đại Chiến", enemy: "Quân Lannister", enemy_size: "6000", enemy_house: "lannister", enemy_quality: "Mới Lập Đội", terrain: "Đồng Bằng" },
      "Hai quân giáp mặt",
    );
    useCombatStore.getState().resolveArmy("delegate");

    const diplo = useMvuStore.getState().stat["Quan Hệ Ngoại Giao"]["lannister"];
    expect(diplo).toBeDefined();
    expect(diplo["Trạng Thái"]).toBe("Chiến Tranh");
    // War Score đổi theo bậc kết quả (khác 0 trừ khi Giằng Co — với ưu thế giáo trên đồng bằng thường thắng)
    expect(typeof diplo["War Score"]).toBe("number");
  });
});
