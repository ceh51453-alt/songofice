/**
 * Acceptance tests M6: tái lập seed, 7 bậc, fog lật trận cận kề nhưng không
 * lật chênh lệch lớn, 3 độ khó dịch đúng hướng, duel Thế Đứng + valyrian,
 * giao tranh, quân chết vĩnh viễn.
 */
import { describe, expect, it } from "vitest";
import { resolveBattle, gradeBattle, fogRoll, battlePower, type BattleInput, type BattleSideInput } from "./battleResolver";
import { startDuel, runDuelRound, autoDuel, type Duelist, BASIC_SKILLS } from "./duel";
import { resolveSkirmish, type SkirmishSide } from "./skirmish";
import { terrainMultiplier } from "./terrain";
import { aggregateUnits, moraleEnumFromScore, qualityBand } from "./scales";
import { makeRng } from "../probability/rng";
import { makeDefaultState, MilitaryUnitSchema } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";

function side(partial?: Partial<BattleSideInput>): BattleSideInput {
  return {
    name: "test", totalTroops: 5000, morale: 65, training: 65, logistics: 60, equipment: 60,
    troopType: "Bộ Binh", ...partial,
  };
}

function input(partial?: Partial<BattleInput>): BattleInput {
  return { player: side({ name: "ta" }), enemy: side({ name: "địch" }), seed: 42, difficulty: "Cân Bằng", ...partial };
}

describe("Battle Resolver (7.9)", () => {
  it("CÙNG SEED → CÙNG KẾT QUẢ (điều kiện bắt buộc — reroll không đổi kết quả)", () => {
    const a = resolveBattle(input());
    const b = resolveBattle(input());
    expect(a.outcome).toBe(b.outcome);
    expect(a.casualtiesPlayer).toBe(b.casualtiesPlayer);
    expect(a.casualtiesEnemy).toBe(b.casualtiesEnemy);
    expect(a.fog).toEqual(b.fog);
    expect(a.keyEvent).toBe(b.keyEvent);
    // seed khác → thường khác (fog khác)
    const c = resolveBattle(input({ seed: 999 }));
    expect(c.fog.dice).not.toEqual(a.fog.dice);
  });

  it("thang 7 bậc theo tỷ lệ (7.9.4)", () => {
    expect(gradeBattle(2.5)).toBe("Đại Thắng");
    expect(gradeBattle(1.6)).toBe("Thắng");
    expect(gradeBattle(1.3)).toBe("Tiểu Thắng");
    expect(gradeBattle(1.0)).toBe("Giằng Co");
    expect(gradeBattle(0.7)).toBe("Tiểu Bại");
    expect(gradeBattle(0.4)).toBe("Bại");
    expect(gradeBattle(0.2)).toBe("Đại Bại");
  });

  it("fog 2D6 LẬT được trận cận kề nhưng KHÔNG lật nổi chênh lệch lớn (7.9.3/7.9.4)", () => {
    // trận cận kề: tỷ lệ 1.22 (Tiểu Thắng) + đại ách vận -25 → 0.97 Giằng Co
    expect(gradeBattle(1.22 - 0.25)).toBe("Giằng Co");
    // chênh lệch lớn: 3.0 + -25 → 2.75 vẫn Đại Thắng
    expect(gradeBattle(3.0 - 0.25)).toBe("Đại Thắng");
    // fog map đúng bảng
    for (let seed = 0; seed < 50; seed++) {
      const f = fogRoll(makeRng(seed), "Trời Quang");
      const sum = f.dice[0] + f.dice[1];
      expect(sum).toBeGreaterThanOrEqual(2);
      expect(sum).toBeLessThanOrEqual(12);
      expect([-25, -12, -5, 0, 5, 12, 25]).toContain(f.mod);
    }
  });

  it("chiến lực: quân đông chất lượng kém KHÔNG auto thắng quân tinh nhuệ có tướng giỏi", () => {
    const mob = side({ totalTroops: 8000, morale: 40, training: 25, logistics: 30, equipment: 30 });
    const elite = side({
      totalTroops: 3000, morale: 85, training: 85, logistics: 85, equipment: 85,
      general: { name: "Danh tướng", command: 90, cunning: 80, traits: [] },
    });
    const pMob = battlePower(mob, elite, undefined, "Trời Quang");
    const pElite = battlePower(elite, mob, undefined, "Trời Quang");
    // 8000 ô hợp vs 3000 tinh nhuệ: tinh nhuệ phải gần ngang hoặc hơn
    expect(pElite / pMob).toBeGreaterThan(0.85);
  });

  it("địa hình đổi kết quả đúng hướng (7.6): kỵ binh mạnh đồng bằng, yếu đầm lầy", () => {
    expect(terrainMultiplier("Kỵ Binh", "Đồng Bằng")).toBe(1.3);
    expect(terrainMultiplier("Kỵ Binh", "Đầm Lầy")).toBe(0.4);
    expect(terrainMultiplier("Cung Thủ", "Hẻm Núi")).toBe(1.4);
    // Nhà quen địa hình miễn PHẠT: Stark trên tuyết
    expect(terrainMultiplier("Bộ Binh", "Tuyết/Băng Giá")).toBe(0.85);
    expect(terrainMultiplier("Bộ Binh", "Tuyết/Băng Giá", "Stark")).toBe(1.0);
    // không cộng thưởng quá 1.0
    expect(terrainMultiplier("Kỵ Binh", "Đồng Bằng", "Stark")).toBe(1.3);
  });

  it("ĐỘ KHÓ dịch kết quả đúng hướng với cùng seed (7.9.6)", () => {
    const base = input({ seed: 7 });
    const balanced = resolveBattle({ ...base, difficulty: "Cân Bằng" });
    const easy = resolveBattle({ ...base, difficulty: "Nhàn Hạ" });
    const ORDER = ["Đại Bại", "Bại", "Tiểu Bại", "Giằng Co", "Tiểu Thắng", "Thắng", "Đại Thắng"];
    // Nhàn Hạ: địch suy yếu + nâng 1 bậc → kết quả KHÔNG tệ hơn
    expect(ORDER.indexOf(easy.outcome)).toBeGreaterThan(ORDER.indexOf(balanced.outcome));
    // Chân Thực: làm tròn tỷ lệ xuống → không tốt hơn Cân Bằng
    const hard = resolveBattle({ ...base, difficulty: "Chân Thực" });
    expect(ORDER.indexOf(hard.outcome)).toBeLessThanOrEqual(ORDER.indexOf(balanced.outcome));
    // thương vong Nhàn Hạ = cận dưới
    expect(easy.casualtyPctPlayer).toBeLessThanOrEqual(balanced.casualtyPctPlayer);
  });

  it("thương vong trong khoảng 7.9.5 + sĩ khí map lại enum + tướng bên bại có số phận", () => {
    const crush = resolveBattle(
      input({
        player: side({ totalTroops: 10000, morale: 85, training: 85, logistics: 85, equipment: 85, general: { name: "Ta", command: 90, cunning: 80, traits: [] } }),
        enemy: side({ totalTroops: 1500, morale: 40, training: 25, logistics: 30, equipment: 30, general: { name: "Tướng địch", command: 40, cunning: 30, traits: ["Táo Bạo"] } }),
        seed: 3,
      }),
    );
    expect(crush.outcome).toBe("Đại Thắng");
    expect(crush.casualtyPctPlayer).toBeLessThanOrEqual(3);
    expect(crush.casualtyPctEnemy).toBeGreaterThanOrEqual(25);
    expect(crush.casualtiesPlayer).toBeGreaterThanOrEqual(1);
    expect(crush.generalFate?.side).toBe("enemy");
    expect(["tử trận", "bị bắt", "thoát được"]).toContain(crush.generalFate!.fate);
    expect(["Hăng Hái", "Ổn Định", "Dao Động", "Sắp Binh Biến"]).toContain(crush.newMoraleEnemy);
  });

  it("gộp nhiều đơn vị: trung bình gia quyền theo Số Lượng (7.9.1)", () => {
    const big = MilitaryUnitSchema.parse({ "Số Lượng": 5000, "Sĩ Khí": "Hăng Hái", "Huấn Luyện": "Tinh Nhuệ" });
    const small = MilitaryUnitSchema.parse({ "Số Lượng": 500, "Sĩ Khí": "Sắp Binh Biến", "Huấn Luyện": "Rời Rạc" });
    const agg = aggregateUnits([big, small]);
    expect(agg.totalTroops).toBe(5500);
    expect(agg.morale).toBeGreaterThan(75); // đơn vị lớn kéo trung bình
    expect(qualityBand(agg.training)).toBe("Tinh Nhuệ");
    expect(moraleEnumFromScore(agg.morale)).toBe("Hăng Hái");
  });

  it("QUÂN CHẾT LÀ CHẾT: trừ vĩnh viễn, đơn vị về 0 bị xoá (7.9.5)", () => {
    let s = makeDefaultState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Biên Chế Quân Sự.Vệ binh", value: { "Số Lượng": 100 } },
    ]).state;
    // trừ 40
    s = applyPatch(s, [{ op: "replace", path: "stat_data.Biên Chế Quân Sự.Vệ binh.Số Lượng", value: 60 }]).state;
    expect(s["Biên Chế Quân Sự"]["Vệ binh"]["Số Lượng"]).toBe(60);
    // về 0 → xoá
    s = applyPatch(s, [{ op: "remove", path: "stat_data.Biên Chế Quân Sự.Vệ binh" }]).state;
    expect(s["Biên Chế Quân Sự"]["Vệ binh"]).toBeUndefined();
  });
});

describe("Duel 1v1 (7.1/7.2/7.14)", () => {
  function duelist(partial?: Partial<Duelist>): Duelist {
    return {
      name: "A", hp: 100, maxHp: 100, armorClass: 14, attackMod: 5, damageBonus: 3,
      weaponDice: "1d8", damageReduction: 3, agilityMod: 2, stamina: 100, maxStamina: 100,
      strength: 10, intellect: 10, perception: 10,
      skills: Object.values(BASIC_SKILLS), inventory: [], body: {}, equipped: {},
      ...partial,
    };
  }

  it("cùng seed → cùng diễn biến trọn trận (tái lập)", () => {
    const r1 = autoDuel(duelist({ name: "Ta" }), duelist({ name: "Địch", attackMod: 3 }), 77);
    const r2 = autoDuel(duelist({ name: "Ta" }), duelist({ name: "Địch", attackMod: 3 }), 77);
    expect(r1.winner).toBe(r2.winner);
    expect(r1.rounds).toBe(r2.rounds);
    expect(r1.log).toEqual(r2.log);
  });

  it("Thế Đứng ảnh hưởng đúng: Phòng Thủ +AC, Tấn Công Liều −AC (7.14)", () => {
    const a = duelist({ name: "Ta" });
    const b = duelist({ name: "Địch" });
    let st = startDuel(a, b, 5);
    const { events } = runDuelRound(st, { type: "skill", skillId: "danh_lieu" }, { type: "skill", skillId: "phong_thu" }, 5);
    const atkEvent = events.find((e) => e.attacker === "Ta");
    if (atkEvent) {
      expect(atkEvent.targetAc).toBe(14 + 3); // địch Phòng Thủ +3
    }
    const defEvent = events.find((e) => e.attacker === "Địch");
    if (defEvent) {
      expect(defEvent.targetAc).toBe(14 - 3); // ta Tấn Công Liều −3 AC
    }
  });

  it("thép Valyria bỏ qua phần lớn damageReduction (7.14)", () => {
    // Giáp dày DR 20: vũ khí thường trừ đủ 20; valyrian chỉ chịu 25% (5).
    // Cùng seed + cùng đòn → khác biệt DUY NHẤT là cờ valyrian.
    const tank = () => duelist({ name: "Giáp Trụ", armorClass: 5, damageReduction: 20, hp: 200, maxHp: 200 });
    const dmgOf = (valyrianOrObsidian: boolean) => {
      const attacker = duelist({ name: "Ta", damageBonus: 5, valyrianOrObsidian });
      const st = startDuel(attacker, tank(), 11);
      const { events } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "tan_cong_thuong" }, 11);
      return events.find((e) => e.attacker === "Ta" && e.hit)?.damage ?? 0;
    };
    const dmgNormal = dmgOf(false);
    const dmgValyrian = dmgOf(true);
    expect(dmgNormal).toBeGreaterThan(0); // có trúng (AC 5 rất dễ trúng)
    expect(dmgValyrian).toBeGreaterThan(dmgNormal); // xuyên giáp rõ rệt
    expect(dmgNormal).toBe(1); // giáp dày chặn gần hết đòn thường (sàn 1)

    // Hệ quả thực chiến: kẻ giáp dày (DR 20) mà vũ khí thường gần như không xuyên nổi
    // → valyrian hạ được, đao thép thường thì bó tay (cùng seed, chỉ khác vật liệu).
    const armored = () => duelist({ name: "Giáp Trụ", armorClass: 5, damageReduction: 20, hp: 200, maxHp: 200 });
    const valyrianDuel = autoDuel(duelist({ name: "Valyria", damageBonus: 5, valyrianOrObsidian: true }), armored(), 11, 80);
    const normalDuel = autoDuel(duelist({ name: "Thường", damageBonus: 5 }), armored(), 11, 80);
    expect(valyrianDuel.winner).toBe("Valyria");
    expect(normalDuel.winner).toBe("Giáp Trụ");
  });

  it("hết Thể Lực → ép về Cân Bằng + đòn yếu", () => {
    const tired = duelist({ name: "Mệt", stamina: 0 });
    let st = startDuel(tired, duelist({ name: "Khoẻ" }), 9);
    const { events } = runDuelRound(st, { type: "skill", skillId: "danh_lieu" }, { type: "skill", skillId: "tan_cong_thuong" }, 9);
    const ev = events.find((e) => e.attacker === "Mệt");
    if (ev) {
      expect(ev.actionUsed).toBe("Tấn Công Thường"); // bị ép
      expect(ev.exhausted).toBe(true);
    }
  });

  it("trận kết thúc khi 1 bên gục; winner đúng", () => {
    const strong = duelist({ name: "Mạnh", attackMod: 10, damageBonus: 8 });
    const weak = duelist({ name: "Yếu", hp: 30, maxHp: 30, armorClass: 8, attackMod: 0 });
    const r = autoDuel(strong, weak, 21);
    expect(r.winner).toBe("Mạnh");
    expect(r.rounds).toBeLessThan(10);
  });
});

describe("Giao Tranh (7.13)", () => {
  function sideS(partial?: Partial<SkirmishSide>): SkirmishSide {
    return { name: "x", troops: 10, quality: "Thường", morale: 50, logistics: "Đầy Đủ", troopType: "Bộ Binh", keyFighters: [], ...partial };
  }

  it("cùng seed cùng kết quả; phe mạnh hơn thắng", () => {
    const p = sideS({ name: "ta", troops: 15, quality: "Tinh Nhuệ", keyFighters: [{ name: "Ta", damagePerRound: 12 }] });
    const e = sideS({ name: "địch", troops: 8, quality: "Ô Hợp" });
    const r1 = resolveSkirmish(p, e, "Đánh Thẳng", 33);
    const r2 = resolveSkirmish(p, e, "Đánh Thẳng", 33);
    expect(r1).toEqual(r2);
    expect(r1.winner).toBe("player");
  });

  it("phục kích đánh trước 1 vòng; Mở Đường Tháo Chạy cho kết cục escaped", () => {
    const p = sideS({ name: "ta", troops: 6 });
    const e = sideS({ name: "địch", troops: 20, ambusher: true });
    const r = resolveSkirmish(p, e, "Mở Đường Tháo Chạy", 44);
    expect(r.log.some((l) => l.includes("mai phục"))).toBe(true);
    expect(["escaped", "enemy"]).toContain(r.winner);
  });

  it("Bảo Vệ Nhân Vật Then Chốt: nhân vật không bị thương", () => {
    const p = sideS({ name: "ta", troops: 5, keyFighters: [{ name: "Lãnh chúa", damagePerRound: 10 }] });
    const e = sideS({ name: "địch", troops: 25, quality: "Tinh Nhuệ" });
    const r = resolveSkirmish(p, e, "Bảo Vệ Nhân Vật Then Chốt", 55);
    expect(r.keyFighterInjured).toBeNull();
  });
});

describe("Exclusive Skills & Passives", () => {
  it("Máu Tiền Nhân hồi Thể Lực mỗi round", () => {
    const a: Duelist = { name: "Tiền Nhân", hp: 100, maxHp: 100, armorClass: 10, attackMod: 0, damageBonus: 0, weaponDice: "1d8", damageReduction: 0, agilityMod: 0, strength: 10, intellect: 10, perception: 10, stamina: 10, maxStamina: 20, valyrianOrObsidian: false, traits: [], skills: [BASIC_SKILLS["tan_cong_thuong"]], passives: [{ id: "mau_tien_nhan", name: "Máu Tiền Nhân", description: "" }], inventory: [], body: {}, equipped: {} };
    const b: Duelist = { name: "Thường", hp: 100, maxHp: 100, armorClass: 10, attackMod: 0, damageBonus: 0, weaponDice: "1d8", damageReduction: 0, agilityMod: 0, strength: 10, intellect: 10, perception: 10, stamina: 10, maxStamina: 20, valyrianOrObsidian: false, traits: [], skills: [BASIC_SKILLS["tan_cong_thuong"]], passives: [], inventory: [], body: {}, equipped: {} };
    
    let st = startDuel(a, b, 1);
    expect(st.a.stamina).toBe(10);
    // After round, stamina regenerates 2, but attack cost is 4, so net loss 2 -> 8
    const { state } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "tan_cong_thuong" }, 1);
    expect(state.a.stamina).toBe(11); // Started 10, Tiền Nhân (+2) = 12, cost (-4) = 8, End of Round Recovery (+3) = 11
  });
});
