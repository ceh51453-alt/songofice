/**
 * Đại chiến M22 — ba cánh quân, hậu bị, Điểm Chỉ Huy, các giai đoạn trận đánh,
 * hiệu ứng dây chuyền khi một cánh vỡ, và truy kích.
 */
import { describe, expect, it } from "vitest";
import {
  initInteractiveBattle, playArmyRound, autoPickArmyTactic, availableTactics,
  describeBattle, ARMY_TACTICS, BATTLE_PHASES, SECTOR_IDS, SECTOR_FACING, SECTOR_INTRO,
  type InteractiveBattleState,
} from "./battleEngine";
import type { BattleSideInput } from "./battleResolver";
import { makeRng } from "../probability/rng";

function army(partial: Partial<BattleSideInput> = {}): BattleSideInput {
  return {
    name: "Quân", troopType: "Bộ Binh", training: 60, equipment: 60,
    logistics: 60, morale: 80, totalTroops: 6000, ...partial,
  };
}

function start(p?: Partial<BattleSideInput>, e?: Partial<BattleSideInput>, seed = 555): InteractiveBattleState {
  return initInteractiveBattle(army({ name: "Ta", ...p }), army({ name: "Địch", ...e }), "Đồng Bằng", "Trời Quang", seed);
}

describe("Dàn trận ba cánh", () => {
  it("quân chia ra ba cánh + hậu bị, tổng khớp quân số ban đầu", () => {
    const s = start();
    const front = SECTOR_IDS.reduce((sum, id) => sum + s.player.sectors[id].troops, 0);
    expect(front + s.player.reserve).toBeCloseTo(6000, -2);
    expect(s.player.reserve).toBeGreaterThan(0);
    expect(s.player.currentTroops).toBe(6000);
    for (const id of SECTOR_IDS) {
      expect(SECTOR_INTRO[id].length).toBeGreaterThan(30);
      expect(s.player.sectors[id].cohesion).toBeGreaterThan(0);
      expect(s.player.sectors[id].fatigue).toBe(0);
    }
  });

  it("kỵ binh dạt ra cánh, binh chủng giữ hàng vào trung quân", () => {
    const s = start({ composition: { "Kỵ Binh": 0.3, "Trường Thương": 0.7 }, troopType: "Trường Thương" });
    expect(s.player.sectors["Cánh Trái"].troopType).toBe("Kỵ Binh");
    expect(s.player.sectors["Trung Quân"].troopType).toBe("Trường Thương");
  });

  it("cánh trái của ta đối đầu cánh phải của địch", () => {
    expect(SECTOR_FACING["Cánh Trái"]).toBe("Cánh Phải");
    expect(SECTOR_FACING["Cánh Phải"]).toBe("Cánh Trái");
    expect(SECTOR_FACING["Trung Quân"]).toBe("Trung Quân");
  });

  it("Điểm Chỉ Huy theo năng lực tướng: tướng giỏi ra được nhiều mệnh lệnh hơn", () => {
    const weak = start({ general: { name: "Kém", command: 20, cunning: 20, traits: [] } });
    const strong = start({ general: { name: "Giỏi", command: 95, cunning: 90, traits: [] } });
    expect(strong.player.commandPoints).toBeGreaterThan(weak.player.commandPoints);
  });
});

describe("Giai đoạn trận đánh", () => {
  it("đi tuần tự Dàn Trận → Xạ Kích → Giao Phong → Hỗn Chiến", () => {
    let s = start();
    expect(s.phase).toBe("Dàn Trận");
    const seen = [s.phase];
    for (let i = 0; i < 4 && !s.finished; i++) {
      s = playArmyRound(s, "phong_thu_kien_cuong", "phong_thu_kien_cuong");
      seen.push(s.phase);
    }
    expect(seen.slice(0, 4)).toEqual(["Dàn Trận", "Xạ Kích", "Giao Phong", "Hỗn Chiến"]);
  });

  it("giai đoạn Dàn Trận ít đổ máu hơn Hỗn Chiến", () => {
    let s = start();
    s = playArmyRound(s, "tan_cong_tong_luc", "tan_cong_tong_luc");
    const deployLoss = 6000 - s.player.currentTroops;
    while (s.phase !== "Hỗn Chiến" && !s.finished) {
      s = playArmyRound(s, "phong_thu_kien_cuong", "phong_thu_kien_cuong");
    }
    const before = s.player.currentTroops;
    s = playArmyRound(s, "tan_cong_tong_luc", "tan_cong_tong_luc");
    const meleeLoss = before - s.player.currentTroops;
    expect(meleeLoss).toBeGreaterThan(deployLoss);
  });

  it("mọi giai đoạn có phần giới thiệu và chỉ số binh chủng đề cao riêng", () => {
    const stats = new Set(Object.values(BATTLE_PHASES).map((p) => p.keyStat));
    expect(stats.size).toBeGreaterThanOrEqual(3);
    for (const p of Object.values(BATTLE_PHASES)) {
      expect(p.intro.length).toBeGreaterThan(40);
      expect(p.damage).toBeGreaterThan(0);
    }
  });

  it("cung thủ mạnh ở Xạ Kích còn kỵ binh mạnh ở Giao Phong", () => {
    // đưa cả hai trận tới đúng giai đoạn rồi so tổn thất gây ra cho địch
    const damageAtPhase = (troop: "Cung Thủ" | "Kỵ Binh", phase: "Xạ Kích" | "Giao Phong") => {
      let s = start({ troopType: troop, composition: { [troop]: 1 } });
      while (s.phase !== phase && !s.finished) s = playArmyRound(s, "phong_thu_kien_cuong", "phong_thu_kien_cuong");
      const before = s.enemy.currentTroops;
      s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong");
      return before - s.enemy.currentTroops;
    };
    expect(damageAtPhase("Cung Thủ", "Xạ Kích")).toBeGreaterThan(damageAtPhase("Kỵ Binh", "Xạ Kích"));
    expect(damageAtPhase("Kỵ Binh", "Giao Phong")).toBeGreaterThan(damageAtPhase("Cung Thủ", "Giao Phong"));
  });
});

describe("Mũi nhọn, hậu bị và Điểm Chỉ Huy", () => {
  it("dồn mũi nhọn vào một cánh thì cánh đó chịu nhiều thương vong hơn hẳn", () => {
    const lossAt = (focus: "Cánh Trái" | "Cánh Phải") => {
      const s = start();
      const after = playArmyRound(s, "dot_kich_suon", "phong_thu_kien_cuong", { focus });
      // Cánh Trái của ta đánh Cánh Phải của địch
      return after.enemy.sectors[SECTOR_FACING[focus]].troops;
    };
    // dồn vào cánh trái → cánh phải địch tổn thất nặng hơn cánh trái địch
    const s = start();
    const after = playArmyRound(s, "dot_kich_suon", "phong_thu_kien_cuong", { focus: "Cánh Trái" });
    expect(after.enemy.sectors["Cánh Phải"].troops).toBeLessThan(after.enemy.sectors["Cánh Trái"].troops);
    expect(lossAt("Cánh Trái")).toBeLessThan(6000);
  });

  it("Tung Hậu Bị bù quân, hồi gắn kết và nâng sĩ khí — nhưng chỉ một lần", () => {
    const s = start();
    const reserve = s.player.reserve;
    const before = s.player.sectors["Trung Quân"].troops;
    const after = playArmyRound(s, "tung_hau_bi", "phong_thu_kien_cuong", { focus: "Trung Quân" });
    expect(after.player.reserve).toBe(0);
    expect(after.player.sectors["Trung Quân"].troops).toBeGreaterThan(before + reserve * 0.5);
    expect(after.player.commandPoints).toBeLessThan(s.player.commandPoints);
    // tung lần hai không còn gì để tung
    const again = playArmyRound(after, "tung_hau_bi", "phong_thu_kien_cuong", { focus: "Trung Quân" });
    expect(again.player.reserve).toBe(0);
  });

  it("hết Điểm Chỉ Huy thì mệnh lệnh đặc biệt không ra được", () => {
    let s = start({ general: { name: "Xoàng", command: 10, cunning: 80, traits: [] } });
    expect(s.player.commandPoints).toBe(1);
    s = playArmyRound(s, "danh_boc_hau", "phong_thu_kien_cuong");
    expect(s.player.commandPoints).toBe(0);
    const failed = playArmyRound(s, "danh_boc_hau", "phong_thu_kien_cuong");
    expect(failed.log.some((l) => l.includes("không còn đủ Điểm Chỉ Huy"))).toBe(true);
  });

  it("availableTactics lọc theo điều kiện binh chủng, tướng lĩnh và Điểm Chỉ Huy", () => {
    const infantry = availableTactics(army({ troopType: "Bộ Binh" }), "Trời Quang").map((t) => t.id);
    expect(infantry).toContain("doi_hinh_vong_tron");
    expect(infantry).not.toContain("xung_phong");
    expect(infantry).not.toContain("dracarys");

    const knights = availableTactics(army({ troopType: "Kỵ Binh", training: 80 }), "Trời Quang").map((t) => t.id);
    expect(knights).toContain("xung_phong");
    expect(knights).toContain("dot_kich_suon");

    const rabble = availableTactics(army({ troopType: "Kỵ Binh", training: 30 }), "Trời Quang").map((t) => t.id);
    expect(rabble).not.toContain("xung_phong"); // kỵ binh chưa đủ kỷ luật thì không xung phong nổi

    const archersInRain = availableTactics(army({ troopType: "Cung Thủ" }), "Mưa Lớn").map((t) => t.id);
    expect(archersInRain).not.toContain("mua_mui_ten");
  });

  it("Đội Hình Vòng Tròn khắc chế kỵ binh xung phong", () => {
    const cavalry = { troopType: "Kỵ Binh" as const, training: 80, composition: { "Kỵ Binh": 1 } };
    const openField = playArmyRound(start({ troopType: "Bộ Binh" }, cavalry), "tan_cong_tong_luc", "xung_phong");
    const square = playArmyRound(start({ troopType: "Bộ Binh" }, cavalry), "doi_hinh_vong_tron", "xung_phong");
    expect(6000 - square.player.currentTroops).toBeLessThan(6000 - openField.player.currentTroops);
  });
});

describe("Vỡ trận và truy kích", () => {
  it("một cánh vỡ thì các cánh còn lại tụt sĩ khí và hở sườn", () => {
    let s = start();
    // đánh cho cánh phải địch kiệt quệ
    s.enemy.sectors["Cánh Phải"].morale = 14;
    s.enemy.sectors["Cánh Phải"].cohesion = 6;
    const moraleBefore = s.enemy.sectors["Trung Quân"].morale;
    s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong", { focus: "Cánh Trái" });
    expect(s.enemy.sectors["Cánh Phải"].routed).toBe(true);
    expect(s.enemy.sectors["Trung Quân"].morale).toBeLessThan(moraleBefore);
    expect(s.log.some((l) => l.includes("VỠ TRẬN"))).toBe(true);
  });

  it("hai cánh vỡ là cả đạo quân tan, và truy kích lấy thêm mạng", () => {
    let s = start();
    for (const id of ["Cánh Trái", "Cánh Phải"] as const) {
      s.enemy.sectors[id].morale = 5;
      s.enemy.sectors[id].cohesion = 4;
    }
    const before = s.enemy.currentTroops;
    s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong");
    expect(s.finished).toBe(true);
    expect(s.winner).toBe("player");
    expect(s.phase).toBe("Truy Kích");
    expect(s.enemy.currentTroops).toBeLessThan(before * 0.8);
    expect(s.log.some((l) => l.includes("Truy kích"))).toBe(true);
  });

  it("Unsullied không vỡ trận dù sĩ khí chạm đáy", () => {
    // troopType là loại NỀN để tra bảng địa hình; binh chủng thật của từng cánh
    // lấy từ thành phần đội hình
    let s = start({}, { troopType: "Trường Thương", composition: { "Unsullied": 1 } });
    for (const id of SECTOR_IDS) {
      s.enemy.sectors[id].morale = 1;
      s.enemy.sectors[id].cohesion = 1;
    }
    s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong");
    expect(SECTOR_IDS.every((id) => !s.enemy.sectors[id].routed)).toBe(true);
  });

  it("rút lui: không gây được sát thương nhưng vẫn mất quân trên đường rút", () => {
    const s = playArmyRound(start(), "rut_lui", "tan_cong_tong_luc");
    expect(s.finished).toBe(true);
    expect(s.winner).toBe("enemy");
    expect(s.enemy.currentTroops).toBe(6000);
    expect(s.player.currentTroops).toBeLessThan(6000);
  });
});

describe("Mệt mỏi, gắn kết và tính tất định", () => {
  it("đánh lâu thì mệt mỏi tăng và gắn kết rã ra", () => {
    let s = start();
    for (let i = 0; i < 4 && !s.finished; i++) s = playArmyRound(s, "tan_cong_tong_luc", "tan_cong_tong_luc");
    const sec = s.player.sectors["Trung Quân"];
    expect(sec.fatigue).toBeGreaterThan(20);
    expect(sec.cohesion).toBeLessThan(start().player.sectors["Trung Quân"].cohesion);
  });

  it("Phòng Thủ Kiên Cường giữ được gắn kết, Tấn Công Tổng Lực thì không", () => {
    const cohesionAfter = (tactic: "tan_cong_tong_luc" | "phong_thu_kien_cuong") => {
      let s = start();
      for (let i = 0; i < 3 && !s.finished; i++) s = playArmyRound(s, tactic, "phong_thu_kien_cuong");
      return s.player.sectors["Trung Quân"].cohesion;
    };
    expect(cohesionAfter("phong_thu_kien_cuong")).toBeGreaterThan(cohesionAfter("tan_cong_tong_luc"));
  });

  it("CÙNG SEED → CÙNG DIỄN BIẾN trọn trận", () => {
    const run = () => {
      let s = start({}, {}, 24680);
      for (let i = 0; i < 8 && !s.finished; i++) {
        s = playArmyRound(s, "tan_cong_tong_luc", "phong_thu_kien_cuong", { focus: "Cánh Trái" });
      }
      return s;
    };
    const a = run();
    const b = run();
    expect(a.log).toEqual(b.log);
    expect(a.player.currentTroops).toBe(b.player.currentTroops);
    expect(a.winner).toBe(b.winner);
  });

  it("AI chọn chiến thuật hợp lệ và biết tung hậu bị khi sắp vỡ", () => {
    const s = start();
    const tactic = autoPickArmyTactic(s.enemy, "Trời Quang", makeRng(9), false, s);
    expect(Object.keys(ARMY_TACTICS)).toContain(tactic);

    const desperate = start();
    desperate.enemy.currentMorale = 10;
    const rescue = autoPickArmyTactic(desperate.enemy, "Trời Quang", makeRng(3), false, desperate);
    expect(["tung_hau_bi", "rut_lui"]).toContain(rescue);
  });

  it("describeBattle gói đủ tình hình cho AI kể", () => {
    const text = describeBattle(start());
    expect(text).toContain("Giai đoạn");
    expect(text).toContain("Cánh Trái");
    expect(text).toContain("hậu bị");
  });
});
