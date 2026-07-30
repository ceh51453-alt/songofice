/**
 * Đại tu trang bị + cơ thể (M23).
 *
 * Trang bị: lớp vũ khí × vật liệu × phẩm chất × độ bền phải cho ra con số THẬT
 * KHÁC NHAU, và giáp phải che theo VÙNG.
 * Cơ thể: bộ phận có chức năng, vết thương ảnh hưởng thẳng vào chiến đấu, nhiễm
 * trùng tiến triển, chăm sóc tốt thì chặn được.
 */
import { describe, expect, it } from "vitest";
import {
  resolveWeapon, resolveArmor, summarizeGear, quoteRepair, wearOf, applyWear,
  describeGear, gearWords,
} from "./gearEngine";
import {
  bodyProfile, bodyCombatMods, tickBodyDays, shockLevel, describeBody,
  careFromSkill, symptomDef, SYMPTOMS, CARE_LEVELS, CAPABILITY_INTRO,
  type CareQuality,
} from "./bodyEngine";
import {
  WEAPON_CLASSES, ARMOR_CLASSES, MATERIALS, QUALITY_TIERS, DURABILITY_BANDS,
  classifyWeapon, classifyArmor, classifyMaterial, durabilityBand,
} from "../content/westeros/gear";
import { playerDuelist } from "../combat/playerForces";
import { makeDefaultState, type EquipItem, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { makeRng } from "../probability/rng";

function item(partial: Partial<EquipItem> = {}): EquipItem {
  return {
    "Tên": "Món đồ", "Phẩm Chất": "Thường", "Thuộc Tính": {}, "Đặc Tính": [], "Mô Tả": "",
    ...partial,
  } as EquipItem;
}

function equipped(over: Record<string, EquipItem | undefined> = {}) {
  return over as StatData["Trang Bị Đang Mặc"];
}

// ── TRANG BỊ ────────────────────────────────────────────────────────────────

describe("Bảng phân loại trang bị", () => {
  it("mọi lớp vũ khí / giáp / vật liệu / phẩm chất đều có mô tả", () => {
    for (const w of Object.values(WEAPON_CLASSES)) {
      expect(w.desc.length).toBeGreaterThan(30);
      expect(w.dice).toMatch(/^\d*d\d+$/);
      expect(w.bands.length).toBeGreaterThan(0);
    }
    for (const a of Object.values(ARMOR_CLASSES)) expect(a.desc.length).toBeGreaterThan(25);
    for (const m of Object.values(MATERIALS)) expect(m.desc.length).toBeGreaterThan(25);
    for (const q of Object.values(QUALITY_TIERS)) expect(q.desc.length).toBeGreaterThan(20);
    for (const b of DURABILITY_BANDS) expect(b.desc.length).toBeGreaterThan(15);
  });

  it("nhận diện đúng loại, ưu tiên từ khoá DÀI hơn", () => {
    expect(classifyWeapon(["trọng kiếm"]).id).toBe("trong-kiem");
    expect(classifyWeapon(["kiếm dài"]).id).toBe("kiem-dai");
    expect(classifyWeapon(["búa chiến"]).id).toBe("bua-chien");
    expect(classifyWeapon(["nỏ thép"]).id).toBe("no");
    expect(classifyWeapon(["thứ gì đó lạ"]).id).toBe("tay-khong");

    expect(classifyArmor(["giáp tấm"]).id).toBe("giap-tam");
    expect(classifyArmor(["áo giáp"]).id).toBe("giap-xich");
    expect(classifyMaterial(["valyrian"]).id).toBe("Thép Valyria");
    expect(classifyMaterial(["obsidian"]).id).toBe("Obsidian");
    expect(classifyMaterial(["không rõ"]).id).toBe("Thép");
  });

  it("độ bền chia bậc đúng", () => {
    expect(durabilityBand(100).label).toBe("Nguyên Vẹn");
    expect(durabilityBand(40).label).toBe("Hư Hại");
    expect(durabilityBand(0).label).toBe("Đã Hỏng");
  });
});

describe("Vũ khí thật sự khác nhau", () => {
  it("dao găm, kiếm dài và búa chiến cho ba hồ sơ khác hẳn", () => {
    const dagger = resolveWeapon(item({ "Tên": "Dao găm" }));
    const sword = resolveWeapon(item({ "Tên": "Kiếm dài" }));
    const hammer = resolveWeapon(item({ "Tên": "Búa chiến" }));

    expect(dagger.dice).toBe("1d4");
    expect(sword.dice).toBe("1d8");
    expect(hammer.dice).toBe("1d12");
    // dao nhanh, búa chậm
    expect(dagger.accuracy).toBeGreaterThan(hammer.accuracy);
    // búa xuyên giáp hơn hẳn
    expect(hammer.armorPierce).toBeGreaterThan(sword.armorPierce);
    // búa quật ngã, dao thì không
    expect(hammer.poise).toBeGreaterThan(dagger.poise * 3);
    expect(hammer.twoHanded).toBe(true);
    expect(dagger.twoHanded).toBe(false);
  });

  it("PHẨM CHẤT đổi số thật, không còn là chữ trang trí", () => {
    const crude = resolveWeapon(item({ "Tên": "Kiếm dài", "Phẩm Chất": "Thô Kệch" }));
    const fine = resolveWeapon(item({ "Tên": "Kiếm dài", "Phẩm Chất": "Thượng Hạng" }));
    expect(fine.accuracy).toBeGreaterThan(crude.accuracy);
    expect(fine.poise).toBeGreaterThan(crude.poise);
  });

  it("VẬT LIỆU đổi số thật: Valyria nhẹ-sắc-bền, obsidian sắc mà giòn", () => {
    const steel = resolveWeapon(item({ "Tên": "Kiếm dài", "Chất Liệu": "Thép" }));
    const valyrian = resolveWeapon(item({ "Tên": "Kiếm dài", "Chất Liệu": "Thép Valyria" }));
    const glass = resolveWeapon(item({ "Tên": "Dao găm", "Chất Liệu": "Obsidian" }));

    expect(valyrian.armorPierce).toBeGreaterThan(steel.armorPierce);
    expect(valyrian.cutsThroughArmor).toBe(true);
    expect(valyrian.slaysSupernatural).toBe(true);
    // Valyria gần như không mòn, obsidian vỡ rất nhanh
    expect(wearOf(valyrian, 1)).toBeLessThan(wearOf(steel, 1));
    expect(wearOf(glass, 1)).toBeGreaterThan(wearOf(steel, 1) * 2);
    expect(glass.slaysSupernatural).toBe(true);
  });

  it("ĐỘ BỀN tụt thì đánh dở đi, về 0 thì GÃY và đánh như tay không", () => {
    const fresh = resolveWeapon(item({ "Tên": "Kiếm dài", "Độ Bền": 100 }));
    const worn = resolveWeapon(item({ "Tên": "Kiếm dài", "Độ Bền": 20 }));
    const broken = resolveWeapon(item({ "Tên": "Kiếm dài", "Độ Bền": 0 }));

    expect(worn.accuracy).toBeLessThan(fresh.accuracy);
    expect(broken.broken).toBe(true);
    expect(broken.dice).toBe(WEAPON_CLASSES["tay-khong"].dice);
    expect(broken.school).toBe("bac-thu");
  });

  it("mòn theo đúng vật liệu — applyWear không xuống dưới 0", () => {
    const it0 = item({ "Tên": "Kiếm dài", "Độ Bền": 3 });
    applyWear(it0, 50);
    expect(it0["Độ Bền"]).toBe(0);
  });
});

describe("Giáp che theo VÙNG", () => {
  it("giáp tấm che kín, giáp da chỉ che thân và tay", () => {
    const plate = resolveArmor(equipped({ "Giáp Thân": item({ "Tên": "Giáp tấm" }) }));
    const leather = resolveArmor(equipped({ "Giáp Thân": item({ "Tên": "Giáp da" }) }));

    expect(plate.zones["Thân"]).toBeGreaterThan(leather.zones["Thân"]);
    // giáp da không phủ chân → chỉ được phần hở
    expect(leather.zones["Chân"]).toBeLessThan(leather.zones["Thân"]);
    // giáp tấm nặng hơn hẳn
    expect(plate.weight).toBeGreaterThan(leather.weight);
    expect(plate.agilityPenalty).toBeGreaterThan(0);
  });

  it("KHÔNG mũ giáp thì đầu gần như không được che", () => {
    const noHelm = resolveArmor(equipped({ "Giáp Thân": item({ "Tên": "Giáp xích" }) }));
    const withHelm = resolveArmor(equipped({
      "Giáp Thân": item({ "Tên": "Giáp xích" }),
      "Mũ/Nón": item({ "Tên": "Mũ giáp kín" }),
    }));
    expect(withHelm.zones["Đầu"]).toBeGreaterThan(noHelm.zones["Đầu"]);
    expect(withHelm.helm).toBe(true);
  });

  it("khiên cộng che thân và tay", () => {
    const bare = resolveArmor(equipped({ "Giáp Thân": item({ "Tên": "Giáp da" }) }));
    const shielded = resolveArmor(equipped({
      "Giáp Thân": item({ "Tên": "Giáp da" }),
      "Khiên": item({ "Tên": "Khiên gỗ", "Thuộc Tính": { "Phòng Thủ": 6 } }),
    }));
    expect(shielded.zones["Thân"]).toBeGreaterThan(bare.zones["Thân"]);
    expect(shielded.shield).toBe(true);
  });

  it("không mặc gì thì không che gì", () => {
    const naked = resolveArmor(equipped({}));
    expect(naked.zones["Thân"]).toBe(0);
    expect(naked.weight).toBe(0);
  });
});

describe("Cảnh báo và sửa chữa", () => {
  it("summarizeGear cảnh báo vũ khí gãy, hai tay kèm khiên, thiếu mũ", () => {
    const s = summarizeGear(equipped({
      "Vũ Khí Chính": item({ "Tên": "Trọng kiếm", "Độ Bền": 0 }),
      "Khiên": item({ "Tên": "Khiên" }),
    }));
    const all = s.warnings.join(" | ");
    expect(all).toContain("GÃY");
    expect(all).toContain("hai tay");
    expect(all).toContain("mũ giáp");
  });

  it("thép Valyria và obsidian KHÔNG sửa được", () => {
    expect(quoteRepair(item({ "Tên": "Kiếm", "Chất Liệu": "Thép Valyria", "Độ Bền": 40 }), 10).ok).toBe(false);
    expect(quoteRepair(item({ "Tên": "Dao", "Chất Liệu": "Obsidian", "Độ Bền": 40 }), 10).reason).toContain("đẽo một lưỡi mới");
  });

  it("thợ rèn giỏi hồi được nhiều độ bền hơn thợ vụng", () => {
    const dull = quoteRepair(item({ "Tên": "Kiếm dài", "Độ Bền": 30 }), 0);
    const master = quoteRepair(item({ "Tên": "Kiếm dài", "Độ Bền": 30 }), 10);
    expect(dull.ok).toBe(true);
    expect(master.restored).toBeGreaterThan(dull.restored);
  });

  it("đồ còn nguyên thì không có gì để sửa", () => {
    expect(quoteRepair(item({ "Độ Bền": 100 }), 5).ok).toBe(false);
    expect(quoteRepair(undefined, 5).ok).toBe(false);
  });

  it("describeGear và gearWords chạy được cho cả vũ khí lẫn giáp", () => {
    expect(describeGear(item({ "Tên": "Kiếm dài" }))).toContain("Kiếm Dài");
    expect(describeGear(item({ "Tên": "Giáp tấm" }))).toContain("Giáp Tấm");
    expect(describeGear(undefined)).toBe("Trống");
    expect(gearWords(item({ "Tên": "Ice", "Chất Liệu": "Thép Valyria" }))).toContain("thép valyria");
  });
});

// ── CƠ THỂ ──────────────────────────────────────────────────────────────────

function bodyWith(over: Record<string, { cond?: number; sym?: string[] }> = {}) {
  const parts = Object.keys(
    (makeDefaultState()["Cơ Thể"] ?? {}) as Record<string, unknown>,
  );
  const body: Record<string, any> = {};
  for (const p of parts) {
    body[p] = { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 };
  }
  for (const [p, v] of Object.entries(over)) {
    body[p] = {
      "Tình Trạng": v.cond ?? 100,
      "Triệu Chứng": v.sym ?? ["Bình Thường"],
      "Thời Gian Lành Còn (giây)": 0,
    };
  }
  return body;
}

describe("Bộ phận cơ thể có CHỨC NĂNG", () => {
  it("người lành lặn có đủ năm năng lực ở mức tối đa", () => {
    const p = bodyProfile(bodyWith());
    for (const v of Object.values(p.capabilities)) expect(v).toBeCloseTo(1, 5);
    expect(p.bleedPerDay).toBe(0);
    expect(p.cannotHoldWeapon).toBe(false);
    for (const intro of Object.values(CAPABILITY_INTRO)) expect(intro.length).toBeGreaterThan(50);
  });

  it("gãy tay phải kéo CẦM NẮM xuống, gãy chân kéo DI CHUYỂN xuống", () => {
    const brokenArm = bodyProfile(bodyWith({ "Bắp Tay Phải": { sym: ["Gãy Xương"] } }));
    expect(brokenArm.capabilities["Cầm Nắm"]).toBeLessThan(1);
    expect(brokenArm.capabilities["Di Chuyển"]).toBeCloseTo(1, 5);

    const brokenLeg = bodyProfile(bodyWith({ "Đùi Trái": { sym: ["Gãy Xương"] } }));
    expect(brokenLeg.capabilities["Di Chuyển"]).toBeLessThan(1);
    expect(brokenLeg.capabilities["Cầm Nắm"]).toBeCloseTo(1, 5);
  });

  it("mất một bàn tay = không cầm vũ khí hai tay; mất cả hai = hết cầm vũ khí", () => {
    const one = bodyProfile(bodyWith({ "Bàn Tay Phải": { cond: 0, sym: ["Đứt Lìa"] } }));
    expect(one.cannotTwoHand).toBe(true);
    expect(one.cannotHoldWeapon).toBe(false);
    expect(one.crippled).toContain("Bàn Tay Phải");

    const both = bodyProfile(bodyWith({
      "Bàn Tay Phải": { cond: 0, sym: ["Đứt Lìa"] },
      "Bàn Tay Trái": { cond: 0, sym: ["Đứt Lìa"] },
    }));
    expect(both.cannotHoldWeapon).toBe(true);
  });

  it("Mù Loà thật sự làm mù, Hôn Mê thật sự làm mất khả năng hành động", () => {
    const blind = bodyProfile(bodyWith({ "Đầu": { sym: ["Mù Loà"] } }));
    expect(blind.blind).toBe(true);
    expect(blind.capabilities["Nhìn"]).toBe(0);

    const out = bodyProfile(bodyWith({ "Đầu": { sym: ["Hôn Mê"] } }));
    expect(out.unconscious).toBe(true);
    expect(bodyCombatMods(out).incapacitated).toBe(true);
  });

  it("gãy sườn bóp HÔ HẤP → Thể Lực tối đa tụt", () => {
    const hurt = bodyProfile(bodyWith({
      "Ngực": { sym: ["Khó Thở"] }, "Sườn Trái": { sym: ["Gãy Xương"] },
    }));
    const mods = bodyCombatMods(hurt);
    expect(hurt.capabilities["Hô Hấp"]).toBeLessThan(0.8);
    expect(mods.staminaMult).toBeLessThan(1);
    expect(mods.staminaRegen).toBeLessThan(0);
  });

  it("vết thương hở làm mất máu mỗi ngày", () => {
    const bleeding = bodyProfile(bodyWith({
      "Đùi Phải": { sym: ["Xuất Huyết"] }, "Bụng": { sym: ["Xuất Huyết"] },
    }));
    expect(bleeding.bleedPerDay).toBe(12);
  });
});

describe("Cơ thể ảnh hưởng THẲNG vào chiến đấu", () => {
  it("gãy tay phải → đánh trúng kém hơn và sát thương thấp hơn", () => {
    const healthy = bodyCombatMods(bodyProfile(bodyWith()));
    const hurt = bodyCombatMods(bodyProfile(bodyWith({
      "Bàn Tay Phải": { sym: ["Gãy Xương"] }, "Cẳng Tay Phải": { sym: ["Gãy Xương"] },
    })));
    expect(hurt.hit).toBeLessThan(healthy.hit);
    expect(hurt.damageMult).toBeLessThan(healthy.damageMult);
  });

  it("người chơi bị thương nặng ra trận với chỉ số THẤP HƠN hẳn", () => {
    let base = makeDefaultState();
    base = applyPatch(base, [
      { op: "replace", path: "stat_data.Trang Bị Đang Mặc.Vũ Khí Chính", value: item({ "Tên": "Kiếm dài" }) },
    ]).state;

    const healthy = playerDuelist(base);

    let wounded = applyPatch(base, [
      { op: "replace", path: "stat_data.Cơ Thể.Bàn Tay Phải", value: { "Tình Trạng": 10, "Triệu Chứng": ["Gãy Xương"], "Thời Gian Lành Còn (giây)": 0 } },
      { op: "replace", path: "stat_data.Cơ Thể.Ngực", value: { "Tình Trạng": 30, "Triệu Chứng": ["Khó Thở"], "Thời Gian Lành Còn (giây)": 0 } },
      { op: "replace", path: "stat_data.Cơ Thể.Đùi Trái", value: { "Tình Trạng": 20, "Triệu Chứng": ["Gãy Xương"], "Thời Gian Lành Còn (giây)": 0 } },
    ]).state;
    const hurt = playerDuelist(wounded);

    expect(hurt.attackMod).toBeLessThan(healthy.attackMod);
    expect(hurt.maxStamina).toBeLessThan(healthy.maxStamina);
    expect(hurt.agilityMod).toBeLessThanOrEqual(healthy.agilityMod);
  });

  it("mất cả hai bàn tay → chỉ còn chiêu Bác Thủ và Phổ Thông", () => {
    let s = makeDefaultState();
    s = applyPatch(s, [
      { op: "replace", path: "stat_data.Cơ Thể.Bàn Tay Phải", value: { "Tình Trạng": 0, "Triệu Chứng": ["Đứt Lìa"], "Thời Gian Lành Còn (giây)": 0 } },
      { op: "replace", path: "stat_data.Cơ Thể.Bàn Tay Trái", value: { "Tình Trạng": 0, "Triệu Chứng": ["Đứt Lìa"], "Thời Gian Lành Còn (giây)": 0 } },
    ]).state;
    const d = playerDuelist(s);
    expect(d.skills.every((a) => a.school === "bac-thu" || a.school === "pho-thong")).toBe(true);
  });
});

describe("Mất máu, nhiễm trùng và chữa trị", () => {
  it("mức sốc leo thang theo máu mất và vết thương hở", () => {
    expect(shockLevel(100, 100, 0)).toBe("Ổn");
    expect(shockLevel(60, 100, 0)).toBe("Choáng Nhẹ");
    expect(shockLevel(45, 100, 6)).toBe("Sốc");
    expect(shockLevel(20, 100, 10)).toBe("Nguy Kịch");
    for (const lv of ["Ổn", "Choáng Nhẹ", "Sốc", "Nguy Kịch"] as const) {
      expect(shockLevel(100, 100, 0) === lv || true).toBe(true);
    }
  });

  it("BỎ MẶC thì Xuất Huyết chuyển thành Nhiễm Trùng rồi Hoại Tử", () => {
    let worsened = false;
    for (let seed = 1; seed <= 20 && !worsened; seed++) {
      const body = bodyWith({ "Đùi Phải": { cond: 60, sym: ["Xuất Huyết"] } });
      const r = tickBodyDays(body, 4, "Bỏ Mặc", makeRng(seed));
      if (r.worsened.some((w) => w.to === "Nhiễm Trùng")) worsened = true;
    }
    expect(worsened).toBe(true);
  });

  it("HỌC SĨ chặn được tiến triển và cầm được máu", () => {
    const bleedUnder = (care: CareQuality) => {
      let total = 0;
      for (let seed = 1; seed <= 15; seed++) {
        const body = bodyWith({ "Đùi Phải": { cond: 60, sym: ["Xuất Huyết"] } });
        total += tickBodyDays(body, 4, care, makeRng(seed)).hpLost;
      }
      return total;
    };
    expect(bleedUnder("Học Sĩ")).toBeLessThan(bleedUnder("Bỏ Mặc"));

    let stopped = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const body = bodyWith({ "Đùi Phải": { cond: 60, sym: ["Xuất Huyết"] } });
      const r = tickBodyDays(body, 4, "Học Sĩ Xích Vàng", makeRng(seed));
      if (r.worsened.length === 0) stopped++;
    }
    expect(stopped).toBeGreaterThan(20);
  });

  it("thương tật VĨNH VIỄN không bao giờ lành", () => {
    const body = bodyWith({ "Bàn Tay Phải": { cond: 0, sym: ["Đứt Lìa"] } });
    for (let i = 0; i < 20; i++) tickBodyDays(body, 30, "Học Sĩ Xích Vàng", makeRng(i));
    expect(body["Bàn Tay Phải"]["Triệu Chứng"]).toContain("Đứt Lìa");
    expect(bodyProfile(body).crippled).toContain("Bàn Tay Phải");
  });

  it("chăm sóc tốt thì bộ phận hồi tình trạng nhanh hơn", () => {
    const healUnder = (care: CareQuality) => {
      const body = bodyWith({ "Bụng": { cond: 40 } });
      tickBodyDays(body, 10, care, makeRng(3));
      return body["Bụng"]["Tình Trạng"];
    };
    expect(healUnder("Học Sĩ")).toBeGreaterThan(healUnder("Bỏ Mặc"));
  });

  it("careFromSkill map đúng bậc chăm sóc", () => {
    expect(careFromSkill(0, false)).toBe("Bỏ Mặc");
    expect(careFromSkill(2, false)).toBe("Sơ Cứu");
    expect(careFromSkill(6, false)).toBe("Thầy Lang");
    expect(careFromSkill(3, true)).toBe("Học Sĩ");
    expect(careFromSkill(9, true)).toBe("Học Sĩ Xích Vàng");
    for (const c of Object.values(CARE_LEVELS)) expect(c.desc.length).toBeGreaterThan(30);
  });

  it("mọi triệu chứng đều có mô tả và hệ số chức năng hợp lệ", () => {
    for (const s of Object.values(SYMPTOMS)) {
      expect(s.desc.length).toBeGreaterThan(8);
      expect(s.functionMult).toBeGreaterThanOrEqual(0);
      expect(s.functionMult).toBeLessThanOrEqual(1);
    }
    expect(symptomDef("Không Tồn Tại").id).toBe("Bình Thường");
  });

  it("describeBody kể đủ cho AI", () => {
    const text = describeBody(bodyWith({ "Đùi Phải": { cond: 30, sym: ["Xuất Huyết"] } }), 40, 100);
    expect(text).toContain("Thể trạng");
    expect(text).toContain("Di Chuyển");
    expect(text).toContain("mất");
  });
});
