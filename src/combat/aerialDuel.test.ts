/**
 * Không chiến M23 — minigame kỵ sĩ cưỡi rồng. Nhiều phe (1v1, 2v2, 1v2v3),
 * ba tầng độ cao, rồng và kỵ sĩ là hai thực thể riêng, gắn bó khoá chiêu.
 */
import { describe, expect, it } from "vitest";
import {
  initAerialDuel, playAerialRound, autoAerialDuel, pickAerialAction,
  makeAerialUnit, usableMoves, isHostile, enemiesOf, describeAerial,
  unitAlive, unitControlled,
  AERIAL_MOVES, MOVES_BY_ID, AIR_LEVELS, AIR_LEVEL_INTRO,
  type AerialUnit, type AerialSetup, type AirLevel,
} from "./aerialDuel";
import { newDragon } from "../strategy/dragons";
import { makeRng } from "../probability/rng";
import type { Dragon } from "../mvu/schema";

function drake(partial: Partial<Dragon> = {}): Dragon {
  return newDragon({
    "Tên": "Rồng", "Kích Cỡ": "Trưởng Thành", "Tình Trạng": "Khỏe",
    "_HP": 1000, "_HP Tối Đa": 1000,
    "Chỉ Số": { "Sức Lửa": 15, "Sức Bay": 14, "Giáp Vảy": 12, "Hung Dữ": 14, "Trung Thành": 15 },
    "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 90,
    ...partial,
  });
}

function unit(id: string, side: string, partial: Partial<AerialUnit> = {}, dragon = drake()): AerialUnit {
  return {
    ...makeAerialUnit({ id, side, dragon, riderName: `Kỵ sĩ ${id}` }),
    ...partial,
  };
}

function duel(units: AerialUnit[], sides: { id: string; name: string; hostileTo?: string[] }[], seed = 42): AerialSetup {
  return { seed, sides, units };
}

describe("Ngân hàng chiêu không chiến", () => {
  it("mọi chiêu có mô tả, chất kể, và thuộc về rồng hoặc kỵ sĩ", () => {
    expect(AERIAL_MOVES.length).toBeGreaterThanOrEqual(12);
    const ids = new Set<string>();
    for (const m of AERIAL_MOVES) {
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
      expect(m.desc.length).toBeGreaterThan(30);
      expect(m.flavor.length).toBeGreaterThan(15);
      expect(["Rồng", "Kỵ Sĩ"]).toContain(m.actor);
    }
    for (const lvl of AIR_LEVELS) expect(AIR_LEVEL_INTRO[lvl].length).toBeGreaterThan(50);
  });

  it("Bổ Nhào CHỈ dùng được khi đang ở tầng cao hơn mục tiêu", () => {
    const high = unit("a", "A", { level: "Tầng Cao" });
    const low = unit("b", "B", { level: "Tầng Thấp" });
    expect(usableMoves(high, low).map((m) => m.id)).toContain("bo_nhao");
    expect(usableMoves(low, high).map((m) => m.id)).not.toContain("bo_nhao");
    expect(usableMoves(unit("c", "C", { level: "Tầng Giữa" }), unit("d", "D", { level: "Tầng Giữa" })).map((m) => m.id))
      .not.toContain("bo_nhao");
  });

  it("chiêu nguy hiểm đòi GẮN BÓ cao — rồng chưa tin thì không làm theo", () => {
    const bonded = unit("a", "A", { bond: 95 });
    const wild = unit("b", "B", { bond: 30 });
    expect(usableMoves(bonded).map((m) => m.id)).toContain("khoa_co_rong");
    expect(usableMoves(wild).map((m) => m.id)).not.toContain("khoa_co_rong");
    expect(usableMoves(wild).map((m) => m.id)).not.toContain("bien_lua");
  });

  it("hết sức bền thì chỉ còn chiêu rẻ", () => {
    const spent = unit("a", "A", { stamina: 3 });
    const moves = usableMoves(spent).map((m) => m.id);
    expect(moves).toContain("lay_hoi_rong");
    expect(moves).not.toContain("khoa_co_rong");
    expect(moves).not.toContain("bo_nhao");
  });

  it("rồng mất kỵ sĩ thì không dùng được chiêu của kỵ sĩ", () => {
    const feral = unit("a", "A", { unhorsed: true });
    expect(unitControlled(feral)).toBe(false);
    expect(usableMoves(feral).some((m) => m.actor === "Kỵ Sĩ")).toBe(false);
  });

  it("không lên cao hơn Tầng Cao và không xuống thấp hơn Tầng Thấp", () => {
    expect(usableMoves(unit("a", "A", { level: "Tầng Cao" })).map((m) => m.id)).not.toContain("vut_len");
    expect(usableMoves(unit("a", "A", { level: "Tầng Thấp" })).map((m) => m.id)).not.toContain("ha_thap");
  });
});

describe("Độ cao là trục quyết định", () => {
  it("Vút Lên đổi tầng thật", () => {
    let s = initAerialDuel(duel([unit("a", "A", { level: "Tầng Thấp" }), unit("b", "B")], [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }]));
    s = playAerialRound(s, [{ unitId: "a", moveId: "vut_len" }]);
    expect(s.units.find((u) => u.id === "a")!.level).toBe("Tầng Giữa");
  });

  it("bổ nhào từ trên cao mạnh hơn hẳn vuốt cào ngang tầm", () => {
    const dmgOf = (moveId: string, myLevel: AirLevel) => {
      let s = initAerialDuel(duel(
        [unit("a", "A", { level: myLevel }), unit("b", "B", { level: "Tầng Thấp" })],
        [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 7,
      ));
      s = playAerialRound(s, [{ unitId: "a", moveId, targetId: "b" }]);
      return 1000 - s.units.find((u) => u.id === "b")!.dragonHp;
    };
    expect(dmgOf("bo_nhao", "Tầng Cao")).toBeGreaterThan(dmgOf("vuot_cao", "Tầng Thấp"));
  });

  it("bay Tầng Cao bào sức bền, bay thấp thì hồi", () => {
    let s = initAerialDuel(duel(
      [unit("a", "A", { level: "Tầng Cao", stamina: 80 }), unit("b", "B", { level: "Tầng Thấp", stamina: 80 })],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }],
    ));
    s = playAerialRound(s, []);
    const a = s.units.find((u) => u.id === "a")!;
    const b = s.units.find((u) => u.id === "b")!;
    expect(a.stamina).toBeLessThan(b.stamina);
  });
});

describe("Rồng và kỵ sĩ là HAI thực thể", () => {
  it("nỏ yên ngựa giết được người mà không giết được rồng", () => {
    let s = initAerialDuel(duel([unit("a", "A"), unit("b", "B", { riderHp: 30 })], [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 3));
    const hpBefore = s.units.find((u) => u.id === "b")!.dragonHp;
    s = playAerialRound(s, [{ unitId: "a", moveId: "ban_no", targetId: "b" }]);
    const b = s.units.find((u) => u.id === "b")!;
    expect(b.dragonHp).toBe(hpBefore); // vảy không thủng
    expect(b.riderHp).toBeLessThan(30);
  });

  it("kỵ sĩ chết thì rồng hoá hoang và mất gắn bó", () => {
    let s = initAerialDuel(duel([unit("a", "A"), unit("b", "B", { riderHp: 5 })], [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 3));
    s = playAerialRound(s, [{ unitId: "a", moveId: "ban_no", targetId: "b" }]);
    const b = s.units.find((u) => u.id === "b")!;
    expect(b.riderHp).toBe(0);
    expect(b.unhorsed).toBe(true);
    expect(unitControlled(b)).toBe(false);
    expect(s.ridersDead.length).toBeGreaterThan(0);
  });

  it("Quật Đuôi hất được kỵ sĩ khỏi yên, Cột Dây chặn được điều đó", () => {
    const unhorsedCount = (secured: boolean) => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        let s = initAerialDuel(duel(
          [unit("a", "A"), unit("b", "B", { bond: 50 })],
          [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], seed,
        ));
        if (secured) s = playAerialRound(s, [{ unitId: "b", moveId: "cot_day" }]);
        s = playAerialRound(s, [{ unitId: "a", moveId: "quat_duoi", targetId: "b" }]);
        if (s.units.find((u) => u.id === "b")!.unhorsed) n++;
      }
      return n;
    };
    expect(unhorsedCount(false)).toBeGreaterThan(0);
    expect(unhorsedCount(true)).toBeLessThan(unhorsedCount(false));
  });

  it("rồng gục thì kỵ sĩ thường rơi theo", () => {
    let s = initAerialDuel(duel(
      [unit("a", "A"), unit("b", "B", { dragonHp: 20 })],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 9,
    ));
    s = playAerialRound(s, [{ unitId: "a", moveId: "bo_nhao", targetId: "b" }, { unitId: "b", moveId: "ha_thap" }]);
    const b = s.units.find((u) => u.id === "b")!;
    expect(b.downed).toBe(true);
    expect(unitAlive(b)).toBe(false);
  });
});

describe("Nhiều phe", () => {
  it("1v1: kết thúc khi một phe không còn con nào bay được", () => {
    const s = autoAerialDuel(duel(
      [unit("a", "A"), unit("b", "B", { dragonHp: 120 })],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 21,
    ));
    expect(s.finished).toBe(true);
    expect(s.winner).toBeTruthy();
  });

  it("2v2: đồng minh KHÔNG đánh nhau", () => {
    const setup = duel(
      [unit("a1", "A"), unit("a2", "A"), unit("b1", "B"), unit("b2", "B")],
      [{ id: "A", name: "Phe Đen" }, { id: "B", name: "Phe Xanh" }], 15,
    );
    const s = initAerialDuel(setup);
    const a1 = s.units[0];
    expect(isHostile(s, a1, s.units[1])).toBe(false);
    expect(isHostile(s, a1, s.units[2])).toBe(true);
    expect(enemiesOf(s, a1).map((u) => u.id).sort()).toEqual(["b1", "b2"]);

    const done = autoAerialDuel(setup, 40);
    expect(done.finished).toBe(true);
    expect(["A", "B"]).toContain(done.winner);
  });

  it("1v2v3: hỗn chiến ba phe, ai cũng là địch của ai", () => {
    const setup = duel(
      [
        unit("x1", "X"),
        unit("y1", "Y"), unit("y2", "Y"),
        unit("z1", "Z"), unit("z2", "Z"), unit("z3", "Z"),
      ],
      [{ id: "X", name: "Phe Một" }, { id: "Y", name: "Phe Hai" }, { id: "Z", name: "Phe Ba" }], 77,
    );
    const s = initAerialDuel(setup);
    expect(enemiesOf(s, s.units[0])).toHaveLength(5);
    expect(enemiesOf(s, s.units[3]).map((u) => u.side).every((x) => x !== "Z")).toBe(true);

    const done = autoAerialDuel(setup, 60);
    expect(done.finished).toBe(true);
    // phe đông nhất thường thắng, nhưng test chỉ đòi trận KẾT THÚC sạch sẽ
    expect(["X", "Y", "Z", null]).toContain(done.winner);
    expect(done.log.length).toBeGreaterThan(10);
  });

  it("liên minh: hai phe cùng chĩa vào phe thứ ba", () => {
    const setup = duel(
      [unit("x1", "X"), unit("y1", "Y"), unit("z1", "Z")],
      [
        { id: "X", name: "Một", hostileTo: ["Z"] },
        { id: "Y", name: "Hai", hostileTo: ["Z"] },
        { id: "Z", name: "Ba" },
      ], 5,
    );
    const s = initAerialDuel(setup);
    // X và Y không đánh nhau dù khác phe
    expect(isHostile(s, s.units[0], s.units[1])).toBe(false);
    expect(isHostile(s, s.units[0], s.units[2])).toBe(true);
    // Z không khai hostileTo → địch với tất cả
    expect(enemiesOf(s, s.units[2])).toHaveLength(2);
  });

  it("Biển Lửa quét TRÚNG CẢ đồng minh đứng cùng tầng", () => {
    let s = initAerialDuel(duel(
      [
        unit("a1", "A", { level: "Tầng Giữa", bond: 95 }),
        unit("a2", "A", { level: "Tầng Giữa" }),
        unit("b1", "B", { level: "Tầng Giữa" }),
      ],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }], 4,
    ));
    s = playAerialRound(s, [{ unitId: "a1", moveId: "bien_lua" }]);
    expect(s.units.find((u) => u.id === "a2")!.dragonHp).toBeLessThan(1000);
    expect(s.units.find((u) => u.id === "b1")!.dragonHp).toBeLessThan(1000);
  });
});

describe("AI và tính tất định", () => {
  it("CÙNG SEED → CÙNG DIỄN BIẾN", () => {
    const mk = () => duel(
      [unit("a", "A"), unit("b", "B"), unit("c", "C")],
      [{ id: "A", name: "Một" }, { id: "B", name: "Hai" }, { id: "C", name: "Ba" }], 1234,
    );
    const x = autoAerialDuel(mk(), 30);
    const y = autoAerialDuel(mk(), 30);
    expect(x.log).toEqual(y.log);
    expect(x.winner).toBe(y.winner);
  });

  it("AI chiếm thế trên khi đang ở dưới", () => {
    const s = initAerialDuel(duel(
      [unit("a", "A", { level: "Tầng Thấp" }), unit("b", "B", { level: "Tầng Cao" })],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }],
    ));
    let climbs = 0;
    const rng = makeRng(2);
    for (let i = 0; i < 20; i++) {
      const act = pickAerialAction(s, s.units[0], rng);
      if (act.moveId === "vut_len") climbs++;
    }
    expect(climbs).toBeGreaterThan(6);
  });

  it("AI không chọn chiêu kỵ sĩ khi rồng đã mất người cưỡi", () => {
    const s = initAerialDuel(duel(
      [unit("a", "A", { unhorsed: true, riderHp: 0 }), unit("b", "B")],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }],
    ));
    const rng = makeRng(6);
    for (let i = 0; i < 20; i++) {
      const act = pickAerialAction(s, s.units[0], rng);
      expect(MOVES_BY_ID[act.moveId].actor).not.toBe("Kỵ Sĩ");
    }
  });

  it("AI sắp chết thì tìm đường hồi và né", () => {
    const s = initAerialDuel(duel(
      [unit("a", "A", { dragonHp: 100 }), unit("b", "B")],
      [{ id: "A", name: "Ta" }, { id: "B", name: "Địch" }],
    ));
    const rng = makeRng(8);
    let defensive = 0;
    for (let i = 0; i < 20; i++) {
      const m = MOVES_BY_ID[pickAerialAction(s, s.units[0], rng).moveId];
      if (m.kind === "Hồi Phục" || m.evade) defensive++;
    }
    expect(defensive).toBeGreaterThan(6);
  });

  it("describeAerial kể được mọi phe", () => {
    const s = initAerialDuel(duel(
      [unit("a", "A"), unit("b", "B")],
      [{ id: "A", name: "Phe Đen" }, { id: "B", name: "Phe Xanh" }],
    ));
    const text = describeAerial(s);
    expect(text).toContain("Phe Đen");
    expect(text).toContain("Phe Xanh");
    expect(text).toContain("Tầng");
  });
});
