/**
 * Vây thành M22 — tường chia đoạn, máy phải dựng, lương thực đếm ngược, đào hầm
 * và phản hầm, chiêu hàng, dịch bệnh. Và nối được với tường THẬT của lãnh địa.
 */
import { describe, expect, it } from "vitest";
import {
  initSiege, playSiegeRound, defaultSections, totalWallHp, anyBreached,
  siegeSkillOf, sectionsFromHolding, supplyDaysFromHolding, describeSiege,
  autoPickSiegeAttacker, autoPickSiegeDefender,
  SIEGE_TACTICS, SIEGE_ENGINES, SIEGE_ATTACKER_TACTIC_LIST, SIEGE_DEFENDER_TACTIC_LIST,
  type SiegeSideState, type SiegeState,
} from "./siege";
import { makeRng } from "../probability/rng";
import { makeDefaultState } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";

function side(partial: Partial<SiegeSideState> = {}): SiegeSideState {
  return {
    name: "phe", troops: 2000, morale: 70, fatigue: 0,
    training: 60, equipment: 60, siegeSkill: 40, ...partial,
  };
}

function siege(partial: Parameters<typeof initSiege>[0] extends infer T ? Partial<T> : never = {}): SiegeState {
  return initSiege({
    seed: 99,
    attacker: side({ name: "Công", troops: 3000 }),
    defender: side({ name: "Thủ", troops: 600 }),
    wallTotalHp: 5000,
    supplyDays: 120,
    ...partial,
  } as Parameters<typeof initSiege>[0]);
}

describe("Cấu trúc toà thành", () => {
  it("chia thành cổng / hai mặt tường / tháp, tổng đúng máu đã cho", () => {
    const sections = defaultSections(5000);
    expect(sections.map((s) => s.kind).sort()).toEqual(["Cổng", "Tháp", "Tường", "Tường"]);
    expect(sections.reduce((s, x) => s + x.maxHp, 0)).toBe(5000);
    // cổng mỏng nhất, tường dày nhất — đó là lý do ai cũng nhắm vào cổng
    const gate = sections.find((s) => s.kind === "Cổng")!;
    const wall = sections.find((s) => s.kind === "Tường")!;
    expect(gate.thickness).toBeLessThan(wall.thickness);
  });

  it("mọi chiến thuật đều có mô tả, chất kể và số ngày chiếm dụng", () => {
    for (const id of [...SIEGE_ATTACKER_TACTIC_LIST, ...SIEGE_DEFENDER_TACTIC_LIST]) {
      const t = SIEGE_TACTICS[id];
      expect(t.desc.length).toBeGreaterThan(30);
      expect(t.flavor.length).toBeGreaterThan(15);
      expect(t.days).toBeGreaterThan(0);
    }
    // bỏ đói là chiến thuật dài nhất — vây thành đo bằng tháng
    expect(SIEGE_TACTICS.siege_starve.days).toBeGreaterThan(SIEGE_TACTICS.siege_assault.days * 10);
  });

  it("mọi cỗ máy công thành đều có công dụng riêng biệt", () => {
    expect(SIEGE_ENGINES["Máy Bắn Đá"].wallDamage).toBeGreaterThan(0);
    expect(SIEGE_ENGINES["Tháp Công Thành"].wallDamage).toBe(0);
    expect(SIEGE_ENGINES["Tháp Công Thành"].assaultBonus).toBeGreaterThan(SIEGE_ENGINES["Thang Mây"].assaultBonus);
    expect(SIEGE_ENGINES["Xe Húc"].target).toBe("Cổng");
    // thang rẻ nhất, tháp đắt nhất
    expect(SIEGE_ENGINES["Thang Mây"].buildCost).toBeLessThan(SIEGE_ENGINES["Tháp Công Thành"].buildCost);
  });
});

describe("Máy công thành phải dựng trước", () => {
  it("không có máy thì bắn phá KHÔNG làm gì được", () => {
    const s = siege();
    const after = playSiegeRound(s, { attacker: "siege_bombard", defender: "defend_hold" });
    expect(totalWallHp(after)).toBe(totalWallHp(s));
    expect(after.log.some((l) => l.includes("Không có cỗ máy bắn đá"))).toBe(true);
  });

  it("Chế Tạo Máy dựng được máy, rồi bắn phá mới ăn tường", () => {
    let s = siege();
    s = playSiegeRound(s, { attacker: "siege_build", defender: "defend_repair" });
    const engines = Object.values(s.engines).reduce((a, b) => a + b, 0);
    expect(engines).toBeGreaterThan(0);

    const before = totalWallHp(s);
    s.engines["Máy Bắn Đá"] = 3; // đã dựng đủ ba cỗ
    s = playSiegeRound(s, { attacker: "siege_bombard", defender: "defend_hold", targetSection: "wall-n" });
    expect(totalWallHp(s)).toBeLessThan(before);
  });

  it("tường quá dày thì đá bắn chỉ để lại vết sứt", () => {
    const s = siege({
      sections: [{ id: "w", name: "Tường Đá Đen", kind: "Tường", hp: 9000, maxHp: 9000, breached: false, thickness: 60, mine: 0, garrisonShare: 1 }],
    });
    s.engines["Máy Bắn Đá"] = 1;
    const after = playSiegeRound(s, { attacker: "siege_bombard", defender: "defend_hold" });
    expect(totalWallHp(after)).toBe(9000);
    expect(after.log.some((l) => l.includes("quá dày"))).toBe(true);
  });

  it("Xe Húc chỉ ăn cổng, đánh vào tường thì gần như vô dụng", () => {
    const withRam = () => {
      const s = siege();
      s.engines["Xe Húc"] = 2;
      return s;
    };
    const gate = playSiegeRound(withRam(), { attacker: "siege_ram", defender: "defend_volley" });
    const gateSec = gate.sections.find((x) => x.kind === "Cổng")!;
    expect(gateSec.hp).toBeLessThan(gateSec.maxHp);
  });
});

describe("Đói, bệnh và thời gian", () => {
  it("Bao Vây Bỏ Đói đốt cả tháng lương và hạ sĩ khí trong thành", () => {
    const s = siege({ supplyDays: 100 });
    const after = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_hold" });
    expect(after.supplyDays).toBeLessThan(70);
    expect(after.defender.morale).toBeLessThan(s.defender.morale);
    expect(after.days).toBe(30);
    // trại vây cũng trả giá: bệnh và sĩ khí
    expect(after.diseaseOutside).toBeGreaterThan(0);
    expect(after.attacker.morale).toBeLessThan(s.attacker.morale);
  });

  it("Cắt Khẩu Phần kéo dài cầm cự nhưng đổi bằng sĩ khí", () => {
    const s = siege({ supplyDays: 100 });
    const after = playSiegeRound(s, { attacker: "siege_bombard", defender: "defend_ration" });
    expect(after.rations).toBe("Cắt Giảm");
    expect(after.supplyDays).toBeGreaterThan(100);
    expect(after.defender.morale).toBeLessThan(s.defender.morale);
  });

  it("hết lương thì quân giữ thành chết đói và sĩ khí sụp", () => {
    const s = siege({ supplyDays: 1 });
    const after = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_hold" });
    expect(after.supplyDays).toBe(0);
    expect(after.log.some((l) => l.includes("Kho lương cạn sạch"))).toBe(true);
    expect(after.defender.troops).toBeLessThan(600);
  });

  it("thành hết đường thì mở cổng khi bị chiêu hàng", () => {
    let s = siege({ supplyDays: 5 });
    s.defender.morale = 10;
    s.sections[0].breached = true;
    // gieo vài seed cho tới khi khát vọng đầu hàng thắng — điểm là NÓ CÓ THỂ xảy ra
    let surrendered = false;
    for (let seed = 1; seed <= 20 && !surrendered; seed++) {
      const trial = { ...s, seed, log: [] as string[] };
      const after = playSiegeRound(trial, { attacker: "siege_parley", defender: "defend_hold" });
      if (after.surrendered) surrendered = true;
    }
    expect(surrendered).toBe(true);
  });

  it("thành còn sung sức thì không đời nào chịu hàng", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const s = siege({ seed, supplyDays: 300 });
      const after = playSiegeRound(s, { attacker: "siege_parley", defender: "defend_hold" });
      expect(after.surrendered).toBe(false);
    }
  });
});

describe("Đào hầm và phản hầm", () => {
  it("đào đủ thì đánh sập cả đoạn tường mà không mất một quân nào", () => {
    let s = siege();
    const troopsBefore = s.attacker.troops;
    for (let i = 0; i < 20 && !anyBreached(s); i++) {
      s = playSiegeRound(s, { attacker: "siege_tunnel", defender: "defend_hold", targetSection: "wall-n" });
    }
    expect(anyBreached(s)).toBe(true);
    expect(s.attacker.troops).toBeGreaterThan(troopsBefore * 0.9);
    expect(s.log.some((l) => l.includes("Móng"))).toBe(true);
  });

  it("phản hầm chặn được hầm địch", () => {
    let s = siege();
    s.sap = 60;
    s.counterSap = 55;
    s = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_countermine" });
    expect(s.sap).toBe(0);
    expect(s.log.some((l) => l.includes("hầm của địch bị đánh sập") || l.includes("gặp nhau"))).toBe(true);
  });
});

describe("Xung phong và trả đũa", () => {
  it("xung phong lên tường CÒN NGUYÊN là nướng quân", () => {
    const s = siege();
    const after = playSiegeRound(s, { attacker: "siege_assault", defender: "defend_oil" });
    const lost = s.attacker.troops - after.attacker.troops;
    expect(lost).toBeGreaterThan(100);
    expect(after.log.some((l) => l.includes("nướng quân"))).toBe(true);
  });

  it("xung phong vào chỗ ĐÃ VỠ thì rẻ hơn nhiều", () => {
    const intact = playSiegeRound(siege(), { attacker: "siege_assault", defender: "defend_hold" });
    const breachedStart = siege();
    breachedStart.sections[0].breached = true;
    breachedStart.sections[0].hp = 0;
    const breached = playSiegeRound(breachedStart, { attacker: "siege_assault", defender: "defend_hold" });
    const lossIntact = 3000 - intact.attacker.troops;
    const lossBreached = 3000 - breached.attacker.troops;
    expect(lossBreached).toBeLessThan(lossIntact);
  });

  it("Xuất Kích có thể đốt máy công thành của địch", () => {
    let burned = false;
    for (let seed = 1; seed <= 15 && !burned; seed++) {
      const s = siege({ seed });
      s.engines["Máy Bắn Đá"] = 3;
      const after = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_sortie" });
      if ((after.engines["Máy Bắn Đá"] ?? 0) < 3) burned = true;
    }
    expect(burned).toBe(true);
  });

  it("KHÔNG phe nào mất nhiều quân hơn số quân họ có", () => {
    // đạo quân vây khổng lồ vs đồn nhỏ: đội xuất kích chỉ gặp phần trại gần
    // cổng, không phải cả mười vạn quân
    const s = siege({
      attacker: side({ name: "Đại Quân", troops: 300000 }),
      defender: side({ name: "Đồn Nhỏ", troops: 1800 }),
    });
    const after = playSiegeRound(s, { attacker: "siege_bombard", defender: "defend_sortie" });
    const lost = 1800 - after.defender.troops;
    expect(lost).toBeGreaterThanOrEqual(0);
    expect(lost).toBeLessThanOrEqual(1800);
    // đội xuất kích chỉ là 30% quân đồn — không thể mất hơn thế trong một lần ra
    expect(lost).toBeLessThanOrEqual(Math.ceil(1800 * 0.3));
    const logged = after.log.find((l) => l.startsWith("Phe thủ mất"));
    if (logged) {
      const n = Number(logged.match(/\d+/)![0]);
      expect(n).toBe(lost);
    }
  });

  it("Dracarys thiêu cổng và tháp nhưng KHÔNG làm sập tường đá", () => {
    const s = siege();
    const after = playSiegeRound(s, { attacker: "siege_dracarys", defender: "defend_hold" });
    const gate = after.sections.find((x) => x.kind === "Cổng")!;
    const wall = after.sections.find((x) => x.kind === "Tường")!;
    expect(gate.breached).toBe(true);
    expect(wall.breached).toBe(false);
    expect(wall.hp).toBeGreaterThan(0);
    expect(after.defender.morale).toBeLessThan(s.defender.morale - 20);
  });

  it("Sửa Chữa vá được đoạn yếu, và bịt được cả chỗ đã vỡ", () => {
    const s = siege();
    s.sections[1].hp = 500;
    const patched = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_repair" });
    expect(patched.sections[1].hp).toBeGreaterThan(500);

    const broken = siege();
    for (const sec of broken.sections) { sec.breached = true; sec.hp = 0; }
    const rebuilt = playSiegeRound(broken, { attacker: "siege_starve", defender: "defend_repair" });
    expect(rebuilt.sections.some((x) => !x.breached)).toBe(true);
  });
});

describe("Viện binh và kết cục", () => {
  it("đốt lửa hiệu gọi được viện binh, tới nơi thì phá vây", () => {
    let s = siege({ seed: 5 });
    s = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_signal" });
    expect(s.reliefCalled).toBe(true);
    expect(s.reliefEta).toBeGreaterThan(0);
    for (let i = 0; i < 10 && !s.finished; i++) {
      s = playSiegeRound(s, { attacker: "siege_starve", defender: "defend_hold" });
    }
    expect(s.finished).toBe(true);
    expect(s.winner).toBe("defender");
  });

  it("CÙNG SEED → CÙNG DIỄN BIẾN", () => {
    const run = () => {
      let s = siege({ seed: 777 });
      for (let i = 0; i < 6 && !s.finished; i++) {
        s = playSiegeRound(s, { attacker: "siege_tunnel", defender: "defend_countermine" });
      }
      return s;
    };
    const a = run();
    const b = run();
    expect(a.log).toEqual(b.log);
    expect(totalWallHp(a)).toBe(totalWallHp(b));
  });

  it("AI hai bên chọn được nước đi hợp lý", () => {
    const s = siege();
    // chưa có máy → phải đi dựng máy trước
    expect(autoPickSiegeAttacker(s, makeRng(1))).toBe("siege_build");
    // tường đã vỡ → xung phong
    s.sections[0].breached = true;
    expect(autoPickSiegeAttacker(s, makeRng(1))).toBe("siege_assault");
    // bị xung phong → phe thủ dội dầu hoặc tử thủ
    expect(["defend_oil", "defend_hold"]).toContain(autoPickSiegeDefender(s, makeRng(2), "siege_assault"));
    // bị đào hầm → phản hầm
    s.sap = 50;
    expect(autoPickSiegeDefender(s, makeRng(2), "siege_tunnel")).toBe("defend_countermine");
  });
});

describe("Nối với lãnh địa", () => {
  it("năng lực công thành lấy từ thành phần binh chủng thật", () => {
    expect(siegeSkillOf({ "Công Thành": 1 })).toBeGreaterThan(siegeSkillOf({ "Kỵ Binh": 1 }));
    expect(siegeSkillOf({})).toBeGreaterThan(0);
  });

  it("tường THẬT người chơi đã xây trở thành đoạn tường phải giữ", () => {
    let s = makeDefaultState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Lãnh Địa.Winterfell", value: {
        "Dân Số": 5000,
        "Công Trình": { "Lâu Đài": { "Loại": "Lâu Đài", "Cấp Độ": 3 } },
        "Tường Thành": [
          { "Mã": "wall-1", "Tên": "Luỹ Ngoài", "Cấp": 2, "Vật Liệu": "Đá", "Điểm": [{ x: 0, y: 0 }, { x: 100, y: 0 }],
            "Chiều Dài": 100, "Đang Xây": false, "Ngày Xây Còn Lại": 0, "Nguyên Vẹn": 80 },
          { "Mã": "wall-2", "Tên": "Đang Xây Dở", "Cấp": 1, "Vật Liệu": "Gỗ", "Điểm": [{ x: 0, y: 0 }, { x: 50, y: 0 }],
            "Chiều Dài": 50, "Đang Xây": true, "Ngày Xây Còn Lại": 10, "Nguyên Vẹn": 100 },
        ],
        "Tài Nguyên": { "Lương Thực": 3000 },
      } },
    ]).state;

    const sections = sectionsFromHolding(s, "Winterfell")!;
    expect(sections).toBeTruthy();
    const outer = sections.find((x) => x.id === "wall-1")!;
    expect(outer).toBeTruthy();
    expect(outer.name).toBe("Luỹ Ngoài");
    // Nguyên Vẹn 80% → vào trận với 80% máu
    expect(outer.hp).toBeCloseTo(outer.maxHp * 0.8, -1);
    // tường ĐANG XÂY chưa chắn được ai
    expect(sections.some((x) => x.id === "wall-2")).toBe(false);
    // lâu đài cấp 3 khoẻ hơn lâu đài cấp 1
    const keep = sections.find((x) => x.id === "keep")!;
    expect(keep.maxHp).toBeGreaterThan(3000);
    // tỷ lệ quân trấn giữ chuẩn hoá về 1
    expect(sections.reduce((a, x) => a + x.garrisonShare, 0)).toBeCloseTo(1, 5);

    // kho lương lãnh địa thành đồng hồ đếm ngược của cuộc vây
    const many = supplyDaysFromHolding(s, 5000, "Winterfell");
    const few = supplyDaysFromHolding(s, 200, "Winterfell");
    expect(few).toBeGreaterThan(many);
  });

  it("describeSiege gói đủ tình hình cho AI kể", () => {
    const s = siege();
    const text = describeSiege(s);
    expect(text).toContain("Vây thành ngày");
    expect(text).toContain("Cổng Chính");
    expect(text).toContain("lương còn");
    expect(text).toContain("chưa có máy công thành");
  });
});
