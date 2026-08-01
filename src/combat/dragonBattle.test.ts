/**
 * Tầng không M23 — rồng là thực thể có máu, có hồi lửa, có độ cao; nỏ bắn rồng
 * là câu trả lời thật của mặt đất; và cả hai đều ghi được vào trận đại chiến
 * lẫn cuộc vây thành.
 */
import { describe, expect, it } from "vitest";
import {
  makeBattleDragon, dragonBreath, scorpionVolley, airClash, tickDragons,
  dragonActive, effectivePower, describeAir, ALTITUDE_INTRO,
  type BattleDragon,
} from "./dragonBattle";
import { initInteractiveBattle, playArmyRound, initSiegeBattle } from "./battleEngine";
import { newDragon } from "../strategy/dragons";
import { makeRng } from "../probability/rng";
import type { BattleSideInput } from "./battleResolver";
import type { Dragon } from "../mvu/schema";

function drake(partial: Partial<Dragon> = {}): Dragon {
  return newDragon({
    "Tên": "Balerion", "Kích Cỡ": "Trưởng Thành", "Tình Trạng": "Khỏe",
    "_HP": 1000, "_HP Tối Đa": 1000, "Kỵ Sĩ": "Kỵ sĩ",
    "Chỉ Số": { "Sức Lửa": 16, "Sức Bay": 14, "Giáp Vảy": 12, "Hung Dữ": 15, "Trung Thành": 16 },
    "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 90,
    ...partial,
  });
}

function bd(partial: Partial<BattleDragon> = {}): BattleDragon {
  return { ...makeBattleDragon("d1", drake()), ...partial };
}

function army(partial: Partial<BattleSideInput> = {}): BattleSideInput {
  return {
    name: "Quân", troopType: "Bộ Binh", training: 60, equipment: 60,
    logistics: 60, morale: 80, totalTroops: 9000, ...partial,
  };
}

describe("Rồng là thực thể, không phải hệ số", () => {
  it("mỗi con có máu, hồi chiêu lửa và độ cao riêng", () => {
    const d = makeBattleDragon("balerion", drake());
    expect(d.hp).toBe(1000);
    expect(d.maxHp).toBe(1000);
    expect(d.breathCooldown).toBe(0);
    expect(dragonActive(d)).toBe(true);
    for (const alt of ["Cao", "Thấp"] as const) {
      expect(ALTITUDE_INTRO[alt].length).toBeGreaterThan(40);
    }
  });

  it("khạc lửa xong phải NẠP LẠI, không phun liên tục được", () => {
    const d = bd();
    const first = dragonBreath(makeRng(1), d, "Trời Quang");
    expect(first.fizzled).toBeFalsy();
    expect(first.damage).toBeGreaterThan(0);
    expect(d.breathCooldown).toBeGreaterThan(0);

    const second = dragonBreath(makeRng(1), d, "Trời Quang");
    expect(second.fizzled).toBe(true);
    expect(second.damage).toBe(0);

    tickDragons([d]);
    tickDragons([d]);
    expect(d.breathCooldown).toBe(0);
  });

  it("bay THẤP đốt mạnh hơn hẳn bay CAO", () => {
    const low = dragonBreath(makeRng(7), bd({ altitude: "Thấp" }), "Trời Quang");
    const high = dragonBreath(makeRng(7), bd({ altitude: "Cao" }), "Trời Quang");
    expect(low.damage).toBeGreaterThan(high.damage * 2);
    expect(low.moraleShock).toBeGreaterThan(high.moraleShock);
  });

  it("mưa bão dập lửa rồng", () => {
    const clear = dragonBreath(makeRng(3), bd(), "Trời Quang");
    const storm = dragonBreath(makeRng(3), bd(), "Bão Tuyết");
    expect(storm.damage).toBeLessThan(clear.damage);
  });

  it("năng lực huyết mạch tạo hiệu ứng chiến đấu riêng", () => {
    const normalSnow = dragonBreath(makeRng(3), bd(), "Bão Tuyết");
    const frostSnow = dragonBreath(makeRng(3), bd({ specialPower: "Băng Diệm" }), "Bão Tuyết");
    expect(frostSnow.damage).toBeGreaterThan(normalSnow.damage);

    const normalRoar = dragonBreath(makeRng(9), bd(), "Trời Quang");
    const dreadRoar = dragonBreath(makeRng(9), bd({ specialPower: "Long Uy" }), "Trời Quang");
    expect(dreadRoar.moraleShock).toBeGreaterThan(normalRoar.moraleShock);
  });

  it("rồng bị thương và mất máu thì yếu hẳn", () => {
    const healthy = bd();
    const hurt = bd({ hp: 300, wounded: true });
    expect(effectivePower(hurt)).toBeLessThan(effectivePower(healthy) * 0.5);
    expect(effectivePower(bd({ downed: true }))).toBe(0);
  });
});

describe("Nỏ bắn rồng — câu trả lời của mặt đất", () => {
  it("không có ụ nỏ nào thì rồng bay qua mà không ai chạm nổi", () => {
    const dragons = [bd({ altitude: "Thấp" })];
    const res = scorpionVolley(makeRng(5), 0, dragons, "Trời Quang");
    expect(res.hits).toBe(0);
    expect(dragons[0].hp).toBe(1000);
  });

  it("rồng bay THẤP dễ trúng hơn hẳn rồng bay CAO", () => {
    const hitsAt = (altitude: "Cao" | "Thấp") => {
      let total = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const dragons = [bd({ altitude })];
        total += scorpionVolley(makeRng(seed), 4, dragons, "Trời Quang").hits;
      }
      return total;
    };
    expect(hitsAt("Thấp")).toBeGreaterThan(hitsAt("Cao") * 2);
  });

  it("trúng đủ nhiều thì rồng RƠI, và kỵ sĩ thường rơi theo", () => {
    let downed = 0;
    let ridersLost = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const dragons = [bd({ altitude: "Thấp", hp: 400 })];
      const res = scorpionVolley(makeRng(seed), 8, dragons, "Trời Quang");
      if (res.downed.length > 0) {
        downed++;
        ridersLost += res.ridersLost.length;
      }
    }
    expect(downed).toBeGreaterThan(0);
    expect(ridersLost).toBeGreaterThan(0);
  });

  it("sương mù làm xạ thủ không ngắm nổi", () => {
    const hitsIn = (weather: "Trời Quang" | "Sương Mù") => {
      let total = 0;
      for (let seed = 1; seed <= 40; seed++) {
        total += scorpionVolley(makeRng(seed), 5, [bd({ altitude: "Thấp" })], weather).hits;
      }
      return total;
    };
    expect(hitsIn("Sương Mù")).toBeLessThan(hitsIn("Trời Quang"));
  });

  it("rồng thương nặng có thể bất tuân và bỏ chạy", () => {
    let fled = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const dragons = [bd({ altitude: "Thấp", hp: 260 })];
      scorpionVolley(makeRng(seed), 3, dragons, "Trời Quang");
      if (dragons[0].fled) fled++;
    }
    expect(fled).toBeGreaterThan(0);
  });
});

describe("Rồng đối rồng", () => {
  it("hai bầy rồng đánh nhau và cả hai đều tốn hơi lửa", () => {
    const p = [bd({ name: "Vhagar" })];
    const e = [bd({ name: "Caraxes" })];
    const res = airClash(makeRng(11), p, e);
    expect(res.log.length).toBeGreaterThan(0);
    expect(Math.max(p[0].breathCooldown, e[0].breathCooldown)).toBeGreaterThan(0);
  });

  it("một phe không có rồng thì không có không chiến", () => {
    const res = airClash(makeRng(2), [bd()], []);
    expect(res.log).toEqual([]);
  });

  it("rồng mạnh hơn hẳn thì thắng nhiều hơn thua qua nhiều hiệp quần nhau", () => {
    // một cú cắn không hạ được con rồng — phải quần nhau vài hiệp mới ngã ngũ
    let strongWins = 0;
    let weakWins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeRng(seed);
      const strong = [bd({ name: "Lớn", power: 3 })];
      const weak = [bd({ name: "Nhỏ", power: 0.4, maxHp: 400, hp: 400 })];
      for (let round = 0; round < 8; round++) {
        if (!dragonActive(strong[0]) || !dragonActive(weak[0])) break;
        tickDragons(strong); tickDragons(weak);
        airClash(rng, strong, weak);
      }
      if (weak[0].downed) strongWins++;
      if (strong[0].downed) weakWins++;
    }
    expect(strongWins).toBeGreaterThan(0);
    expect(strongWins).toBeGreaterThan(weakWins);
  });

  it("describeAir kể được cả hai bầy", () => {
    const text = describeAir([bd({ name: "Vhagar" })], [bd({ name: "Caraxes", downed: true })]);
    expect(text).toContain("Vhagar");
    expect(text).toContain("ĐÃ RƠI");
  });
});

describe("Rồng trong ĐẠI CHIẾN", () => {
  it("Dracarys đốt cánh quân địch thật, không chỉ nhân hệ số", () => {
    const withDragon = army({ dragons: [{ key: "d", dragon: drake() }], dragon: { name: "B", isRidden: true, power: 3, loyalty: 18 } });
    let s = initInteractiveBattle(withDragon, army({ name: "Địch" }), "Đồng Bằng", "Trời Quang", 31);
    expect(s.air.player).toHaveLength(1);

    const before = s.enemy.currentTroops;
    s = playArmyRound(s, "dracarys", "phong_thu_kien_cuong", { focus: "Trung Quân", altitude: "Thấp" });
    expect(s.enemy.currentTroops).toBeLessThan(before);
    expect(s.log.some((l) => l.includes("🔥"))).toBe(true);
  });

  it("địch có ụ nỏ thì rồng ta phải trả giá khi sà thấp", () => {
    let anyHurt = false;
    for (let seed = 1; seed <= 25 && !anyHurt; seed++) {
      let s = initInteractiveBattle(
        army({ dragons: [{ key: "d", dragon: drake() }] }),
        army({ name: "Địch", scorpions: 6 }),
        "Đồng Bằng", "Trời Quang", seed,
      );
      s = playArmyRound(s, "dracarys", "phong_thu_kien_cuong", { altitude: "Thấp" });
      if (s.air.player[0].hp < 1000 || s.air.player[0].downed) anyHurt = true;
    }
    expect(anyHurt).toBe(true);
  });

  it("bay CAO an toàn hơn nhiều so với bay THẤP", () => {
    const damageTaken = (altitude: "Cao" | "Thấp") => {
      let total = 0;
      for (let seed = 1; seed <= 25; seed++) {
        let s = initInteractiveBattle(
          army({ dragons: [{ key: "d", dragon: drake() }] }),
          army({ name: "Địch", scorpions: 6 }),
          "Đồng Bằng", "Trời Quang", seed,
        );
        s = playArmyRound(s, "dracarys", "phong_thu_kien_cuong", { altitude });
        total += 1000 - s.air.player[0].hp;
      }
      return total;
    };
    expect(damageTaken("Cao")).toBeLessThan(damageTaken("Thấp"));
  });

  it("không có rồng thì tầng không rỗng và trận vẫn chạy bình thường", () => {
    let s = initInteractiveBattle(army(), army({ name: "Địch" }), "Đồng Bằng", "Trời Quang", 8);
    expect(s.air.player).toEqual([]);
    s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong");
    expect(s.round).toBe(2);
  });
});

describe("Rồng trong VÂY THÀNH", () => {
  it("rồng phe công đốt cổng, nỏ trên tường bắn trả", () => {
    const attacker = army({
      name: "Công", siegeRole: "attacker", totalTroops: 5000,
      dragons: [{ key: "d", dragon: drake() }],
    });
    const defender = army({ name: "Thủ", siegeRole: "defender", totalTroops: 1200, scorpions: 8 });
    let s = initSiegeBattle(attacker, defender, "Thành Trì (thủ)", "Trời Quang", 5, 6000);
    expect(s.siege!.air.attacker).toHaveLength(1);
    expect(s.siege!.scorpions.defender).toBe(8);

    s = playArmyRound(s, "siege_dracarys", "defend_hold");
    const gate = s.siege!.sections.find((x) => x.kind === "Cổng")!;
    expect(gate.breached).toBe(true);
    // rồng sà xuống đốt cổng thì nỏ trên tường có cửa bắn
    expect(s.log.some((l) => l.includes("Nỏ trên tường") || l.includes("🔥"))).toBe(true);
  });

  it("rồng GIỮ THÀNH đốt được máy công thành của địch", () => {
    let burned = false;
    for (let seed = 1; seed <= 30 && !burned; seed++) {
      const attacker = army({ name: "Công", siegeRole: "attacker", totalTroops: 5000 });
      const defender = army({
        name: "Thủ", siegeRole: "defender", totalTroops: 1200,
        dragons: [{ key: "dd", dragon: drake() }],
      });
      let s = initSiegeBattle(attacker, defender, "Thành Trì (thủ)", "Trời Quang", seed, 6000);
      const before = s.siege!.engines["Máy Bắn Đá"];
      s = playArmyRound(s, "siege_bombard", "defend_hold", { siegeTarget: "gate" });
      if (s.siege!.engines["Máy Bắn Đá"] < before || s.log.some((l) => l.includes("Rồng giữ thành"))) burned = true;
    }
    expect(burned).toBe(true);
  });

  it("CÙNG SEED → CÙNG DIỄN BIẾN kể cả khi có rồng hai bên", () => {
    const run = () => {
      const a = army({ name: "Công", siegeRole: "attacker", totalTroops: 5000, dragons: [{ key: "a", dragon: drake() }] });
      const d = army({ name: "Thủ", siegeRole: "defender", totalTroops: 1200, scorpions: 5, dragons: [{ key: "b", dragon: drake({ "Tên": "Caraxes" }) }] });
      let s = initSiegeBattle(a, d, "Thành Trì (thủ)", "Trời Quang", 909, 6000);
      for (let i = 0; i < 3 && !s.finished; i++) s = playArmyRound(s, "siege_bombard", "defend_volley");
      return s;
    };
    expect(run().log).toEqual(run().log);
  });
});
