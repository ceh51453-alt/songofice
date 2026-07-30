/**
 * Huy động M23 — quân phải Ở ĐÚNG CHỖ mới ra trận được, và công trình trong
 * lãnh địa phải đóng góp thật vào chất lượng đám quân đóng ở đó.
 */
import { describe, expect, it } from "vitest";
import {
  mobilizeAt, unitAvailability, homeSupportAt, applyHomeSupport,
  cavalryQualityBonus, battleLocation, describeMobilization,
} from "./mobilization";
import { playerBattleSideDetailed } from "./playerForces";
import { makeDefaultState, MilitaryUnitSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";

function unit(partial: Record<string, unknown> = {}) {
  return MilitaryUnitSchema.parse({ "Số Lượng": 1000, "Lãnh Địa Đồn Trú": "Winterfell", ...partial });
}

function stateWith(units: Record<string, unknown>, holdings: Record<string, unknown> = {}): StatData {
  let s = makeDefaultState();
  s = applyPatch(s, [
    { op: "replace", path: "stat_data.Biên Chế Quân Sự", value: units },
    ...Object.entries(holdings).map(([k, v]) => ({ op: "replace" as const, path: `stat_data.Lãnh Địa.${k}`, value: v })),
  ]).state;
  return s;
}

describe("Chỉ quân CÓ MẶT mới ra trận", () => {
  it("quân đóng nơi khác KHÔNG tham chiến, và nói rõ nó đang ở đâu", () => {
    const s = stateWith({
      "Đội Bắc": unit({ "Lãnh Địa Đồn Trú": "Winterfell" }),
      "Đội Nam": unit({ "Lãnh Địa Đồn Trú": "Casterly Rock", "Số Lượng": 5000 }),
    });
    const r = mobilizeAt(s, "Winterfell");
    expect(r.fielded.map(([n]) => n)).toEqual(["Đội Bắc"]);
    expect(r.fieldedTroops).toBe(1000);
    expect(r.absentTroops).toBe(5000);
    const absent = r.absent.find((a) => a.name === "Đội Nam")!;
    expect(absent.reason).toBe("Đóng Nơi Khác");
    expect(absent.detail).toContain("Casterly Rock");
  });

  it("đang HÀNH QUÂN thì chưa tới là chưa đánh được, kể cả khi đích là chiến trường", () => {
    const s = stateWith({
      "Đội Đang Tới": unit({ "Lãnh Địa Đồn Trú": "Casterly Rock", "Đang Di Chuyển Đến": "Winterfell", "Ngày Hành Quân Còn Lại": 6 }),
    });
    const r = mobilizeAt(s, "Winterfell");
    expect(r.fielded).toHaveLength(0);
    expect(r.absent[0].reason).toBe("Đang Hành Quân");
    expect(r.absent[0].daysLeft).toBe(6);
    expect(r.absent[0].detail).toContain("chính chiến trường này");
  });

  it("hành quân XONG (0 ngày còn lại) thì tính là đã tới nơi", () => {
    const u = unit({ "Lãnh Địa Đồn Trú": "Casterly Rock", "Đang Di Chuyển Đến": "Winterfell", "Ngày Hành Quân Còn Lại": 0 });
    expect(unitAvailability("x", u, "Winterfell").ok).toBe(true);
    expect(unitAvailability("x", u, "Casterly Rock").ok).toBe(false);
  });

  it("đang tập hợp / đang huấn luyện thì không ra trận ở BẤT CỨ đâu", () => {
    const s = stateWith({
      "Mới Gọi": unit({ "Ngày Tập Hợp Còn Lại": 9 }),
      "Lính Mới": unit({ "Ngày Huấn Luyện": 20 }),
    });
    const r = mobilizeAt(s, "Winterfell");
    expect(r.fielded).toHaveLength(0);
    expect(r.absent.map((a) => a.reason).sort()).toEqual(["Đang Huấn Luyện", "Đang Tập Hợp"]);
  });

  it("đơn vị KHÔNG khai nơi đồn trú vẫn đi theo lãnh chúa (save cũ không mất quân)", () => {
    const s = stateWith({ "Bản Bộ": unit({ "Lãnh Địa Đồn Trú": "" }) });
    expect(mobilizeAt(s, "Winterfell").fielded).toHaveLength(1);
  });

  it("describeMobilization nói thẳng vì sao ba vạn quân chỉ ra trận bốn nghìn", () => {
    const s = stateWith({
      "Có Mặt": unit({ "Số Lượng": 4000 }),
      "Xa": unit({ "Số Lượng": 20000, "Lãnh Địa Đồn Trú": "Đâu Đó" }),
      "Đang Luyện": unit({ "Số Lượng": 6000, "Ngày Huấn Luyện": 10 }),
    });
    const text = describeMobilization(mobilizeAt(s, "Winterfell"));
    expect(text).toContain("4.000");
    expect(text).toContain("26.000");
    expect(text).toContain("đóng nơi khác");
  });
});

describe("Công trình và lãnh địa đóng góp THẬT", () => {
  const holdingWith = (buildings: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
    "Dân Số": 5000, "Lòng Dân": 60,
    "Tài Nguyên": { "Lương Thực": 3000 },
    "Công Trình": buildings,
    ...extra,
  });

  it("Doanh Trại nâng huấn luyện, Lò Rèn nâng trang bị, Kho Lương nâng hậu cần", () => {
    const s = stateWith({}, {
      "Winterfell": holdingWith({
        "Trại Lính": { "Loại": "Doanh Trại", "Cấp Độ": 3, "Đang Xây": false },
        "Lò": { "Loại": "Lò Rèn", "Cấp Độ": 2, "Đang Xây": false },
        "Vựa": { "Loại": "Kho Lương", "Cấp Độ": 2, "Đang Xây": false },
      }),
    });
    const sup = homeSupportAt(s, "Winterfell");
    expect(sup.training).toBe(18);   // 6 × cấp 3
    expect(sup.equipment).toBe(10);  // 5 × cấp 2
    expect(sup.logistics).toBeGreaterThanOrEqual(14);
    expect(sup.lines.some((l) => l.includes("Trại Lính"))).toBe(true);
  });

  it("công trình ĐANG XÂY chưa đóng góp gì", () => {
    const s = stateWith({}, {
      "Winterfell": holdingWith({ "Trại Lính": { "Loại": "Doanh Trại", "Cấp Độ": 3, "Đang Xây": true } }),
    });
    expect(homeSupportAt(s, "Winterfell").training).toBe(0);
  });

  it("Ụ Nỏ Bắn Rồng cho ra số ụ nỏ thật — thứ duy nhất hạ rồng từ mặt đất", () => {
    const s = stateWith({}, {
      "Winterfell": holdingWith({ "Ụ Nỏ": { "Loại": "Ụ Nỏ Bắn Rồng", "Cấp Độ": 2, "Đang Xây": false } }),
    });
    const sup = homeSupportAt(s, "Winterfell");
    expect(sup.scorpions).toBe(6); // 3 × cấp 2
    expect(sup.lines.some((l) => l.includes("ụ nỏ bắn rồng"))).toBe(true);
  });

  it("lòng dân và kho lương đổi dấu đúng hướng", () => {
    const loved = stateWith({}, { "Winterfell": holdingWith({}, { "Lòng Dân": 90 }) });
    const hated = stateWith({}, { "Winterfell": holdingWith({}, { "Lòng Dân": 10 }) });
    expect(homeSupportAt(loved, "Winterfell").morale).toBeGreaterThan(0);
    expect(homeSupportAt(hated, "Winterfell").morale).toBeLessThan(0);

    const starving = stateWith({}, {
      "Winterfell": { "Dân Số": 50000, "Lòng Dân": 60, "Tài Nguyên": { "Lương Thực": 10 }, "Công Trình": {} },
    });
    expect(homeSupportAt(starving, "Winterfell").logistics).toBeLessThan(0);
  });

  it("lãnh địa đang BỊ VÂY hoặc NỔI LOẠN kéo quân xuống", () => {
    // kho đầy thì bị vây vẫn chưa âm — điểm là nó THẤP HƠN HẲN lúc yên bình
    const calm = stateWith({}, { "Winterfell": holdingWith({}) });
    const besieged = stateWith({}, { "Winterfell": holdingWith({}, { "Tình Trạng": "Bị Vây" }) });
    const sup = homeSupportAt(besieged, "Winterfell");
    expect(sup.logistics).toBe(homeSupportAt(calm, "Winterfell").logistics - 15);
    expect(sup.morale).toBeLessThan(homeSupportAt(calm, "Winterfell").morale);
    expect(sup.lines.some((l) => l.includes("BỊ VÂY"))).toBe(true);

    const rebel = stateWith({}, { "Winterfell": holdingWith({}, { "Tình Trạng": "Nổi Loạn" }) });
    expect(homeSupportAt(rebel, "Winterfell").morale).toBeLessThan(0);
  });

  it("đánh ngoài đất nhà thì không có hậu thuẫn nào cả", () => {
    const s = stateWith({});
    const sup = homeSupportAt(s, "Đất Địch");
    expect(sup.training).toBe(0);
    expect(sup.scorpions).toBe(0);
    expect(sup.lines).toEqual([]);
  });

  it("applyHomeSupport giữ thang 0-100", () => {
    const boosted = applyHomeSupport(
      { training: 95, equipment: 95, logistics: 95, morale: 95 },
      { ...homeSupportAt(makeDefaultState(), undefined), training: 40, equipment: 40, logistics: 40, morale: 40 },
    );
    expect(boosted.training).toBe(100);
    expect(boosted.morale).toBe(100);
  });

  it("Chuồng Ngựa chỉ nâng chất lượng khi đội hình CÓ kỵ binh", () => {
    const s = stateWith({}, {
      "Winterfell": holdingWith({ "Tàu Ngựa": { "Loại": "Chuồng Ngựa", "Cấp Độ": 4, "Đang Xây": false } }),
    });
    const sup = homeSupportAt(s, "Winterfell");
    expect(cavalryQualityBonus(sup, { "Kỵ Binh": 1 })).toBeGreaterThan(1);
    expect(cavalryQualityBonus(sup, { "Bộ Binh": 1 })).toBe(1);
  });
});

describe("Nối vào phe chiến đấu", () => {
  it("playerBattleSideDetailed chỉ gộp quân tại chỗ và cộng hậu thuẫn lãnh địa", () => {
    const s = stateWith(
      {
        "Tại Chỗ": unit({ "Số Lượng": 2000, "Huấn Luyện": "Mới Lập Đội" }),
        "Ở Xa": unit({ "Số Lượng": 20000, "Lãnh Địa Đồn Trú": "Nơi Khác" }),
      },
      {
        "Winterfell": {
          "Dân Số": 5000, "Lòng Dân": 90, "Tài Nguyên": { "Lương Thực": 4000 },
          "Công Trình": { "Trại Lính": { "Loại": "Doanh Trại", "Cấp Độ": 5, "Đang Xây": false } },
        },
      },
    );
    const r = playerBattleSideDetailed(s, { location: "Winterfell" });
    expect(r.side.totalTroops).toBe(2000);
    expect(r.mobilization.absentTroops).toBe(20000);
    // Doanh Trại cấp 5 = +30 huấn luyện so với thang gốc của "Mới Lập Đội" (45)
    expect(r.side.training).toBeGreaterThan(45);
    expect(r.support.training).toBe(30);
  });

  it("không có quân tại chỗ → còn đội hộ vệ đi theo lãnh chúa", () => {
    const s = stateWith(
      { "Ở Xa": unit({ "Lãnh Địa Đồn Trú": "Nơi Khác" }) },
      { "Winterfell": { "Dân Số": 100 } }, // chiến trường phải là lãnh địa CÓ THẬT
    );
    const r = playerBattleSideDetailed(s, { location: "Winterfell" });
    expect(r.side.totalTroops).toBe(50);
  });

  it("CHỐT AN TOÀN: chiến trường không khớp lãnh địa nào thì KHÔNG lọc sạch quân", () => {
    // "Vị Trí" là tên nơi còn đơn vị lưu MÃ lãnh địa — nếu hai bên lệch nhau mà
    // engine vẫn lọc thì người chơi ra trận với con số không.
    const s = stateWith({ "Đại Quân": unit({ "Số Lượng": 30000, "Lãnh Địa Đồn Trú": "the-westerlands-seat" }) });
    const r = mobilizeAt(s, "Một Nơi Không Có Thật");
    expect(r.fieldedTroops).toBe(30000);
    expect(r.absent).toHaveLength(0);
  });

  it("battleLocation quy TÊN nơi về MÃ lãnh địa qua trường Mô Tả", () => {
    const s = stateWith({}, {
      "the-north-seat": { "Dân Số": 1000, "Mô Tả": "Winterfell" },
      "the-westerlands-seat": { "Dân Số": 1000, "Mô Tả": "Casterly Rock" },
    });
    expect(battleLocation(s, { location: "Winterfell" })).toBe("the-north-seat");
    expect(battleLocation(s, { location: "Casterly Rock" })).toBe("the-westerlands-seat");
    expect(battleLocation(s, { location: "the-north-seat" })).toBe("the-north-seat");
    // AI khai một nơi không có trong bảng → rơi về vị trí hiện tại của nhân vật
    expect(battleLocation(s, { location: "Nơi Lạ" })).toBe("the-north-seat");
    // và nếu cả vị trí hiện tại cũng không khớp gì thì trả rỗng (không lọc)
    const nowhere = stateWith({}, { "x-seat": { "Dân Số": 1, "Mô Tả": "Một Nơi Khác" } });
    expect(battleLocation(nowhere, {})).toBe("");
  });

  it("battleLocation ưu tiên nơi AI chỉ đích danh, rồi tới vị trí hiện tại", () => {
    const s = stateWith({}, { "Winterfell": { "Dân Số": 1 }, "Riverrun": { "Dân Số": 1 } });
    expect(battleLocation(s, { location: "Riverrun" })).toBe("Riverrun");
    expect(battleLocation(s, {})).toBe(s["Thế Giới"]["Vị Trí"]);
  });
});
