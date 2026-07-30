/**
 * Đấu tay đôi M22 — bốn trục mới phải thật sự đổi cách trận đấu diễn ra:
 * cự ly ba dải, Thăng Bằng, Thế Chủ Động, nhắm bộ phận; cộng với trạng thái
 * chồng tầng, mặt sân, hồi chiêu và AI biết chọn nước đi.
 */
import { describe, expect, it } from "vitest";
import {
  startDuel, runDuelRound, autoDuel, pickDuelAction, usableArts,
  maxPoiseOf, describeDuelist, BASIC_SKILLS, BASIC_PASSIVES,
  type Duelist,
} from "./duel";
import { ARTS_BY_ID } from "../content/westeros/combatArts";
import { statusStacks, applyStatus, statusModifiers, tickStatuses, STATUS_DEFS } from "./statusEffects";
import { makeRng } from "../probability/rng";
import { INJURY_SEVERITY } from "../character/injuryEngine";

function fullBody(): Record<string, any> {
  const body: Record<string, any> = {};
  for (const part of Object.keys(INJURY_SEVERITY)) {
    body[part] = { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 };
  }
  return body;
}

function fighter(partial: Partial<Duelist> = {}): Duelist {
  return {
    name: "A", hp: 120, maxHp: 120, armorClass: 14, attackMod: 5, damageBonus: 3,
    weaponDice: "1d8", damageReduction: 2, agilityMod: 2, stamina: 100, maxStamina: 100,
    strength: 12, intellect: 12, perception: 12, endurance: 12,
    skills: Object.values(BASIC_SKILLS), inventory: [], body: fullBody(), equipped: {},
    ...partial,
  };
}

const art = (id: string) => ARTS_BY_ID[id];

describe("Cự ly ba dải", () => {
  it("Lao Tới / Rút Lui đi TỪNG BẬC chứ không nhảy thẳng", () => {
    let st = startDuel(fighter({ name: "Ta", skills: [art("lao_toi"), art("rut_lui")] }), fighter({ name: "Địch", skills: [art("phong_thu")] }), 5);
    expect(st.distance).toBe("Cận Chiến");
    st = runDuelRound(st, { type: "skill", skillId: "lao_toi" }, { type: "skill", skillId: "phong_thu" }, 5).state;
    expect(st.distance).toBe("Áp Sát");
    st = runDuelRound(st, { type: "skill", skillId: "rut_lui" }, { type: "skill", skillId: "phong_thu" }, 5).state;
    expect(st.distance).toBe("Cận Chiến");
    st = runDuelRound(st, { type: "skill", skillId: "rut_lui" }, { type: "skill", skillId: "phong_thu" }, 5).state;
    expect(st.distance).toBe("Tầm Xa");
  });

  it("chiêu ngoài tầm thì phí lượt, có cờ outOfRange rõ ràng", () => {
    const st = startDuel(
      fighter({ name: "Ta", skills: [art("ban_ten")] }),
      fighter({ name: "Địch", skills: [art("phong_thu")] }),
      11, { distance: "Cận Chiến" },
    );
    const { events } = runDuelRound(st, { type: "skill", skillId: "ban_ten" }, { type: "skill", skillId: "phong_thu" }, 11);
    const ev = events.find((e) => e.attacker === "Ta")!;
    expect(ev.outOfRange).toBe(true);
    expect(ev.damage).toBe(0);
  });

  it("Giữ Tầm chặn được đối thủ áp sát", () => {
    const spearman = fighter({ name: "Thương", skills: [art("giu_tam")] });
    const rusher = fighter({ name: "Xông", skills: [art("lao_toi")] });
    let st = startDuel(rusher, spearman, 21, { distance: "Tầm Xa" });
    // thương thủ dựng giáo TRƯỚC, nên phải để hắn đi trước một vòng rồi mới thử áp sát
    st = runDuelRound(st, { type: "skill", skillId: "lao_toi" }, { type: "skill", skillId: "giu_tam" }, 21).state;
    const held = st.log.some((l) => l.includes("giữ tầm")) || st.distance === "Tầm Xa";
    expect(held).toBe(true);
  });

  it("Sàn Hẹp không cho lùi ra Tầm Xa", () => {
    let st = startDuel(
      fighter({ name: "Ta", skills: [art("rut_lui")] }),
      fighter({ name: "Địch", skills: [art("phong_thu")] }),
      7, { ground: "Sàn Hẹp" },
    );
    st = runDuelRound(st, { type: "skill", skillId: "rut_lui" }, { type: "skill", skillId: "phong_thu" }, 7).state;
    expect(st.distance).toBe("Cận Chiến");
  });
});

describe("Thăng Bằng", () => {
  it("đòn phá thăng bằng đánh sập thanh này và gieo Mất Thăng Bằng", () => {
    // Quét Chân: 32 điểm thăng bằng mỗi nhát, đủ để hạ một người thăng bằng thấp
    const sweeper = fighter({ name: "Thương", attackMod: 20, skills: [art("quet_chan")] });
    const victim = fighter({ name: "Nạn Nhân", armorClass: 5, agilityMod: -2, strength: 8, maxPoise: 30 });
    const st = startDuel(sweeper, victim, 3);
    const { state, events } = runDuelRound(st, { type: "skill", skillId: "quet_chan" }, { type: "skill", skillId: "tan_cong_thuong" }, 3);
    const ev = events.find((e) => e.attacker === "Thương")!;
    expect(ev.hit).toBe(true);
    expect(ev.staggered).toBe(true);
    expect(statusStacks(state.b, "Mất Thăng Bằng")).toBe(1);
  });

  it("Mất Thăng Bằng hạ Phòng Thủ 4 điểm", () => {
    const d = fighter();
    expect(statusModifiers(d).ac).toBe(0);
    applyStatus(d, "Mất Thăng Bằng", {});
    expect(statusModifiers(d).ac).toBe(-4);
  });

  it("thăng bằng hồi mỗi vòng, nhưng mặt sân xấu thì hồi chậm hơn", () => {
    const mk = (ground: "Bằng Phẳng" | "Bùn Lầy") => {
      const a = fighter({ name: "Ta", poise: 10, maxPoise: 100, skills: [art("tan_cong_thuong")] });
      const b = fighter({ name: "Địch", skills: [art("tan_cong_thuong")] });
      const st = startDuel(a, b, 9, { ground });
      // startDuel đặt lại thăng bằng đầy — hạ tay xuống rồi mới chạy vòng
      st.a.poise = 10;
      return runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "tan_cong_thuong" }, 9).state.a.poise!;
    };
    expect(mk("Bằng Phẳng")).toBeGreaterThan(mk("Bùn Lầy"));
  });

  it("Phòng Thủ lấy lại thăng bằng (poiseCost âm)", () => {
    const a = fighter({ name: "Ta", maxPoise: 100, skills: [art("phong_thu")] });
    const st = startDuel(a, fighter({ name: "Địch", skills: [art("phong_thu")] }), 13);
    st.a.poise = 20;
    const next = runDuelRound(st, { type: "skill", skillId: "phong_thu" }, { type: "skill", skillId: "phong_thu" }, 13).state;
    expect(next.a.poise!).toBeGreaterThan(35); // +8 hồi vòng, +20 từ chiêu
  });
});

describe("Nhắm bộ phận", () => {
  it("nhắm đầu khó trúng hơn nhắm thân với cùng seed", () => {
    const roll = (zone: "Đầu" | "Thân") => {
      const st = startDuel(fighter({ name: "Ta" }), fighter({ name: "Địch" }), 42);
      const { events } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong", zone }, { type: "skill", skillId: "phong_thu" }, 42);
      return events.find((e) => e.attacker === "Ta")!;
    };
    const head = roll("Đầu");
    const body = roll("Thân");
    expect(head.natRoll).toBe(body.natRoll); // cùng seed, cùng xúc xắc
    expect(head.toHit).toBeLessThan(body.toHit); // nhưng đầu khó trúng hơn
    expect(head.zone).toBe("Đầu");
  });

  it("nhắm đâu thì trúng đúng vùng đó trên cơ thể", () => {
    const st = startDuel(fighter({ name: "Ta", attackMod: 25 }), fighter({ name: "Địch", armorClass: 2 }), 8);
    const { events } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong", zone: "Chân" }, { type: "skill", skillId: "phong_thu" }, 8);
    const ev = events.find((e) => e.attacker === "Ta")!;
    expect(ev.hit).toBe(true);
    expect(ev.hitBodyPart).toMatch(/Đùi|Đầu Gối|Bắp Chân/);
  });

  it("giáp theo VÙNG: đánh vào tay ăn hơn bổ vào ngực giáp tấm", () => {
    const dmgAt = (zone: "Thân" | "Tay") => {
      const armored = fighter({
        name: "Giáp Tấm", armorClass: 2, damageReduction: 0,
        armorZones: { "Thân": 12, "Tay": 1 },
      });
      const st = startDuel(fighter({ name: "Ta", attackMod: 25, damageBonus: 8 }), armored, 17);
      const { events } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong", zone }, { type: "skill", skillId: "phong_thu" }, 17);
      return events.find((e) => e.attacker === "Ta")!.damage;
    };
    expect(dmgAt("Tay")).toBeGreaterThan(dmgAt("Thân"));
  });
});

describe("Thế Chủ Động và trạng thái", () => {
  it("trúng thì dồn thế, trượt thì mất thế", () => {
    const st = startDuel(fighter({ name: "Ta", attackMod: 25 }), fighter({ name: "Địch", armorClass: 2 }), 6);
    const { state } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "phong_thu" }, 6);
    expect(state.a.momentum!).toBeGreaterThan(0);

    const miss = startDuel(fighter({ name: "Ta", attackMod: -30 }), fighter({ name: "Địch", armorClass: 40 }), 6);
    const r2 = runDuelRound(miss, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "phong_thu" }, 6);
    expect(r2.state.a.momentum!).toBeLessThan(0);
  });

  it("Chảy Máu chồng tầng và rút máu mỗi vòng theo số tầng", () => {
    const d = fighter();
    applyStatus(d, "Chảy Máu", { stacks: 1 });
    expect(tickStatuses(d, "A").hpLoss).toBe(2);
    applyStatus(d, "Chảy Máu", { stacks: 2 });
    expect(statusStacks(d, "Chảy Máu")).toBe(3);
    expect(tickStatuses(d, "A").hpLoss).toBe(6);
  });

  it("trạng thái hết hạn thì tự gỡ, cờ nội bộ của engine KHÔNG bị đếm ngược", () => {
    const d = fighter({ buffs: { ROUND_AC_MOD: 3, second_wind_used: 99 } });
    applyStatus(d, "Mù Lòa", { duration: 1 });
    tickStatuses(d, "A");
    expect(d.buffs!["Mù Lòa"]).toBeUndefined();
    expect(d.buffs!["ROUND_AC_MOD"]).toBe(3);
    expect(d.buffs!["second_wind_used"]).toBe(99);
  });

  it("Choáng làm mất trọn lượt", () => {
    const stunned = fighter({ name: "Choáng Váng", attackMod: 25 });
    const st = startDuel(stunned, fighter({ name: "Địch" }), 4);
    applyStatus(st.a, "Choáng", { duration: 2 });
    const { state, events } = runDuelRound(st, { type: "skill", skillId: "tan_cong_thuong" }, { type: "skill", skillId: "phong_thu" }, 4);
    expect(events.some((e) => e.attacker === "Choáng Váng")).toBe(false);
    expect(state.log.some((l) => l.includes("mất lượt"))).toBe(true);
  });

  it("mọi trạng thái trong sổ đều có mô tả cho người chơi đọc", () => {
    for (const def of Object.values(STATUS_DEFS)) {
      expect(def.desc.length, `${def.id} thiếu mô tả`).toBeGreaterThan(20);
      expect(def.flavor.length).toBeGreaterThan(10);
      expect(def.maxStacks).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Hồi chiêu, kiệt sức và bị động mới", () => {
  it("chiêu có cooldown không dùng lại được ngay", () => {
    const a = fighter({ name: "Ta", skills: [art("mua_mui_ten"), art("ban_ten")], stamina: 200, maxStamina: 200 });
    let st = startDuel(a, fighter({ name: "Địch" }), 31, { distance: "Tầm Xa" });
    st = runDuelRound(st, { type: "skill", skillId: "mua_mui_ten" }, { type: "skill", skillId: "phong_thu" }, 31).state;
    expect(st.a.cooldowns!["mua_mui_ten"]).toBeGreaterThan(0);
    expect(usableArts(st.a, "Tầm Xa").map((x) => x.id)).not.toContain("mua_mui_ten");
  });

  it("cạn Thể Lực là dính Kiệt Sức thật, không chỉ là một cờ boolean", () => {
    const tired = fighter({ name: "Mệt", stamina: 0 });
    const st = startDuel(tired, fighter({ name: "Khoẻ" }), 15);
    const { state } = runDuelRound(st, { type: "skill", skillId: "danh_lieu" }, { type: "skill", skillId: "phong_thu" }, 15);
    expect(statusStacks(state.a, "Kiệt Sức")).toBe(1);
  });

  it("Chân Như Đá nâng trần thăng bằng", () => {
    const plain = fighter();
    const stone = fighter({ passives: [BASIC_PASSIVES["chan_nhu_da"]] });
    expect(maxPoiseOf(stone)).toBe(maxPoiseOf(plain) + 25);
  });

  it("Lấy Hơi đổi một vòng lấy Thể Lực", () => {
    const a = fighter({ name: "Ta", stamina: 10, skills: [art("lay_hoi")] });
    const st = startDuel(a, fighter({ name: "Địch" }), 19);
    const next = runDuelRound(st, { type: "skill", skillId: "lay_hoi" }, { type: "skill", skillId: "phong_thu" }, 19).state;
    expect(next.a.stamina).toBeGreaterThan(20);
  });
});

describe("Tính tất định và AI", () => {
  it("CÙNG SEED → CÙNG DIỄN BIẾN, kể cả khi có vết thương giải phẫu", () => {
    const mk = () => autoDuel(fighter({ name: "Ta" }), fighter({ name: "Địch", attackMod: 4 }), 4242, 40);
    const a = mk();
    const b = mk();
    expect(a.winner).toBe(b.winner);
    expect(a.rounds).toBe(b.rounds);
    expect(a.log).toEqual(b.log);
  });

  it("AI không chọn chiêu ngoài tầm hay chiêu không đủ Thể Lực", () => {
    const rng = makeRng(88);
    const archer = fighter({ name: "Cung", stamina: 6, skills: Object.values(BASIC_SKILLS) });
    for (let i = 0; i < 30; i++) {
      const action = pickDuelAction(archer, fighter({ name: "X" }), "Cận Chiến", rng);
      if (action.type !== "skill") continue;
      const chosen = archer.skills.find((s) => s.id === action.skillId);
      if (!chosen) continue;
      expect(chosen.staminaCost).toBeLessThanOrEqual(archer.stamina);
      expect(chosen.range).not.toBe("ranged");
    }
  });

  it("AI sắp chết thì biết uống thuốc thay vì lao vào", () => {
    const dying = fighter({ name: "Sắp Chết", hp: 10, inventory: ["Bình Máu"] });
    const action = pickDuelAction(dying, fighter({ name: "X" }), "Cận Chiến", makeRng(1));
    expect(action).toEqual({ type: "item", itemId: "Bình Máu" });
  });

  it("cung thủ bị áp sát thì tìm đường giãn ra", () => {
    const archer = fighter({
      name: "Cung", temperament: "Thận Trọng",
      skills: [art("ban_ten"), art("ban_tia"), art("rut_lui"), art("tan_cong_thuong")],
    });
    let retreats = 0;
    const rng = makeRng(3);
    for (let i = 0; i < 20; i++) {
      const a = pickDuelAction(archer, fighter({ name: "X" }), "Cận Chiến", rng);
      if (a.type === "skill" && a.skillId === "rut_lui") retreats++;
    }
    expect(retreats).toBeGreaterThan(10);
  });

  it("Băng Gạc gỡ được Chảy Máu", () => {
    const a = fighter({ name: "Ta", inventory: ["Băng Gạc"] });
    const st = startDuel(a, fighter({ name: "Địch" }), 27);
    applyStatus(st.a, "Chảy Máu", { stacks: 3 });
    const next = runDuelRound(st, { type: "item", itemId: "Băng Gạc" }, { type: "skill", skillId: "phong_thu" }, 27).state;
    expect(statusStacks(next.a, "Chảy Máu")).toBe(0);
  });

  it("describeDuelist tóm tắt đủ cho AI kể", () => {
    const d = fighter({ name: "Ser Test" });
    applyStatus(d, "Chảy Máu", { stacks: 2 });
    const text = describeDuelist(d);
    expect(text).toContain("Ser Test");
    expect(text).toContain("Thăng Bằng");
    expect(text).toContain("Chảy Máu ×2");
  });
});
