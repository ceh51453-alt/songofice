import { describe, it, expect } from "vitest";
import { initInteractiveBattle, initSiegeBattle, playArmyRound, autoPickArmyTactic } from "./battleEngine";
import type { BattleSideInput } from "./battleResolver";
import { makeRng } from "../probability/rng";

describe("Interactive Battle Engine", () => {
  const p: BattleSideInput = {
    name: "Quân Ta",
    troopType: "Bộ Binh",
    training: 50,
    equipment: 50,
    logistics: 50,
    morale: 80,
    totalTroops: 1000,
    house: "Stark",
  };

  const e: BattleSideInput = {
    name: "Quân Địch",
    troopType: "Kỵ Binh",
    training: 50,
    equipment: 50,
    logistics: 50,
    morale: 80,
    totalTroops: 1000,
    house: "Lannister",
  };

  it("should initialize battle state correctly", () => {
    const state = initInteractiveBattle(p, e, "Đồng Bằng", "Trời Quang", 12345);
    expect(state.player.currentTroops).toBe(1000);
    expect(state.enemy.currentTroops).toBe(1000);
    expect(state.round).toBe(1);
    expect(state.finished).toBe(false);
  });

  it("should calculate casualties when tactics are used", () => {
    let state = initInteractiveBattle(p, e, "Đồng Bằng", "Trời Quang", 12345);
    // Vòng 1: Ta tấn công tổng lực, Địch phòng thủ kiên cường (Địch có lợi thế)
    state = playArmyRound(state, "tan_cong_tong_luc", "phong_thu_kien_cuong");
    
    expect(state.round).toBe(2);
    expect(state.player.currentTroops).toBeLessThan(1000);
    expect(state.enemy.currentTroops).toBeLessThan(1000);
    expect(state.log.length).toBeGreaterThan(2);

    // Kẻ thù phòng thủ kiên cường chống lại Tấn công tổng lực nên thương vong phe ta phải cao hơn phe địch
    const pLoss = 1000 - state.player.currentTroops;
    const eLoss = 1000 - state.enemy.currentTroops;
    expect(pLoss).toBeGreaterThan(eLoss);
  });

  it("should process retreat tactic properly", () => {
    let state = initInteractiveBattle(p, e, "Đồng Bằng", "Trời Quang", 12345);
    state = playArmyRound(state, "rut_lui", "tan_cong_tong_luc");
    
    expect(state.finished).toBe(true);
    expect(state.winner).toBe("enemy");
    
    // Nếu rút lui, phe ta bị tổn thất nhưng không gây sát thương
    const pLoss = 1000 - state.player.currentTroops;
    const eLoss = 1000 - state.enemy.currentTroops;
    expect(pLoss).toBeGreaterThan(0);
    expect(eLoss).toBe(0);
  });

  it("should allow autoPickArmyTactic to choose a valid tactic", () => {
    const rng = makeRng(1);
    const tactic = autoPickArmyTactic(e, "Trời Quang", rng);
    expect(tactic).toBeDefined();
    // E is cavalry, so dot_kich_suon is available
    expect(["tan_cong_tong_luc", "phong_thu_kien_cuong", "dot_kich_suon", "rut_lui"]).toContain(tactic);
  });
});

describe("Siege Minigame", () => {
  const pAttacker: BattleSideInput = {
    name: "Quân Ta (Công)",
    troopType: "Bộ Binh",
    training: 50,
    equipment: 50,
    logistics: 50,
    morale: 80,
    totalTroops: 1000,
    house: "Stark",
    siegeRole: "attacker"
  };

  const eDefender: BattleSideInput = {
    name: "Quân Địch (Thủ)",
    troopType: "Bộ Binh",
    training: 50,
    equipment: 50,
    logistics: 50,
    morale: 80,
    totalTroops: 500,
    house: "Lannister",
    siegeRole: "defender"
  };

  it("should initialize siege battle correctly", () => {
    const state = initSiegeBattle(pAttacker, eDefender, "Thành Trì (thủ)", "Trời Quang", 1, 5000);
    expect(state.isSiege).toBe(true);
    expect(state.wallHp).toBe(5000);
    expect(state.wallBreached).toBe(false);
  });

  it("should damage walls primarily and protect defenders", () => {
    let state = initSiegeBattle(pAttacker, eDefender, "Thành Trì (thủ)", "Trời Quang", 1, 5000);
    
    // Attacker uses Bombard, Defender uses Hold
    state = playArmyRound(state, "siege_bombard", "defend_hold");
    
    // Defender troop loss should be very low
    expect(state.enemy.currentTroops).toBeGreaterThan(480);
    // Wall should take damage
    expect(state.wallHp).toBeLessThan(5000);
  });

  it("should heavily punish assault before breach", () => {
    let state = initSiegeBattle(pAttacker, eDefender, "Thành Trì (thủ)", "Trời Quang", 1, 5000);
    
    // Attacker uses Assault, Defender uses Boiling Oil
    state = playArmyRound(state, "siege_assault", "defend_oil");
    
    // Attacker should take massive damage
    expect(state.player.currentTroops).toBeLessThan(920);
    // Wall shouldn't take damage in this case or minimal
    expect(state.enemy.currentTroops).toBeLessThan(500); // defender takes some
  });

  it("should allow dragon to instantly breach", () => {
    const pDragonAttacker = { ...pAttacker, dragon: { name: "Balerion", isRidden: true, power: 100, loyalty: 20 } };
    let state = initSiegeBattle(pDragonAttacker, eDefender, "Thành Trì (thủ)", "Trời Quang", 1, 5000);

    state = playArmyRound(state, "siege_dracarys", "defend_hold");

    // M22: tường không còn là MỘT thanh máu mà chia thành cổng / mặt tường /
    // tháp. Lửa rồng thiêu rụi cổng gỗ và tháp canh ngay lập tức (đó là chỗ vỡ
    // để tràn vào), còn tường đá thì cháy sém chứ không sập — Harrenhal vẫn
    // đứng sau khi Balerion đi qua.
    expect(state.wallBreached).toBe(true);
    expect(state.wallHp!).toBeLessThan(5000);
    const gate = state.siege!.sections.find((s) => s.kind === "Cổng")!;
    const tower = state.siege!.sections.find((s) => s.kind === "Tháp")!;
    expect(gate.breached).toBe(true);
    expect(gate.hp).toBe(0);
    expect(tower.breached).toBe(true);
    // quân giữ tường bị thiêu và sĩ khí sụp
    expect(state.enemy.currentTroops).toBeLessThan(500);
    expect(state.enemy.currentMorale).toBeLessThan(80);
  });
});
