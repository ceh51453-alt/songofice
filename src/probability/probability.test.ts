import { describe, expect, it } from "vitest";
import { makeRng, eventSeed, streamRng, rollDiceNotation } from "./rng";
import { gradeResult } from "./grades";
import { weightedPick } from "./weightedPick";
import { resolveCheck, opposedDc, type CheckActor } from "./resolveCheck";
import { CHECK_MAP, findCheck } from "./checkMap";

describe("RNG seedable (5bis.1)", () => {
  it("cùng seed → cùng chuỗi số (tái lập)", () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it("seed khác → chuỗi khác", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toBe(b());
  });

  it("eventSeed ổn định theo (root, turn, label)", () => {
    expect(eventSeed(42, 7, "combat")).toBe(eventSeed(42, 7, "combat"));
    expect(eventSeed(42, 7, "combat")).not.toBe(eventSeed(42, 7, "social"));
    expect(eventSeed(42, 7, "combat")).not.toBe(eventSeed(42, 8, "combat"));
  });

  it("STREAMS tách biệt: reroll stream này KHÔNG đổi kết quả stream kia", () => {
    // stream social cho cùng kết quả bất kể stream combat được gọi bao nhiêu lần
    const social1 = streamRng(42, 7, "social")();
    const combatRng = streamRng(42, 7, "combat");
    combatRng(); combatRng(); combatRng(); // "reroll trận đánh"
    const social2 = streamRng(42, 7, "social")();
    expect(social2).toBe(social1);
  });

  it("rollDiceNotation tái lập theo seed", () => {
    expect(rollDiceNotation("3d6+2", makeRng(99))).toBe(rollDiceNotation("3d6+2", makeRng(99)));
  });
});

describe("gradeResult (5bis.4) — 5 bậc", () => {
  it("phân bậc theo khoảng cách roll vs target", () => {
    expect(gradeResult(30, 70)).toBe("Đại Thành Công"); // roll ≤ target-30
    expect(gradeResult(60, 70)).toBe("Thành Công");
    expect(gradeResult(80, 70)).toBe("Thành Công Nửa Vời"); // target < roll ≤ target+15
    expect(gradeResult(90, 70)).toBe("Thất Bại"); // target+15 < roll < target+30
    expect(gradeResult(95, 60)).toBe("Đại Thất Bại"); // roll ≥ target+30
  });

  it("roll ≤5 LUÔN Đại Thành Công dù target thấp", () => {
    expect(gradeResult(5, 5)).toBe("Đại Thành Công");
    expect(gradeResult(3, 10)).toBe("Đại Thành Công");
  });

  it("roll ≥96 LUÔN Đại Thất Bại dù target cao", () => {
    expect(gradeResult(96, 95)).toBe("Đại Thất Bại");
    expect(gradeResult(99, 95)).toBe("Đại Thất Bại");
  });
});

describe("checkMap (5bis.2b)", () => {
  it("tra đúng cặp (chỉ số, kỹ năng): persuade→Uy Tín+Thuyết Phục, sneak→Nhanh Nhẹn+Ẩn Nấp", () => {
    expect(CHECK_MAP.persuade).toMatchObject({ chinh: "Uy Tín", kyNang: "Thuyết Phục" });
    expect(CHECK_MAP.sneak).toMatchObject({ chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp" });
    expect(CHECK_MAP.detect_lie).toMatchObject({ chinh: "Tinh Tường" });
    expect(CHECK_MAP.heal_disease).toMatchObject({ chinh: "Trí Tuệ", kyNang: "Y Thuật Maester" });
  });

  it("findCheck khớp mờ, không thấy → null (fallback không kẹt)", () => {
    expect(findCheck("persuade")?.id).toBe("persuade");
    expect(findCheck("thuyết phục")?.id).toBe("persuade"); // khớp theo label
    expect(findCheck("việc_hoàn_toàn_lạ_xyz")).toBeNull();
  });
});

describe("resolveCheck (5bis.2)", () => {
  const actor: CheckActor = {
    stats: { "Uy Tín": 14, "Nhanh Nhẹn": 8, "Trí Tuệ": 10, "Tinh Tường": 12 },
    skills: { "Thuyết Phục": 4 },
  };

  it("cùng seed → cùng kết quả (tái lập)", () => {
    const a = resolveCheck({ checkId: "persuade", actor, difficulty: "Thường", seed: 777 });
    const b = resolveCheck({ checkId: "persuade", actor, difficulty: "Thường", seed: 777 });
    expect(a.roll).toBe(b.roll);
    expect(a.grade).toBe(b.grade);
    expect(a.target).toBe(b.target);
  });

  it("target đúng công thức: 50 + (14−10)×3 + 4×4 − 20 = 58", () => {
    const r = resolveCheck({ checkId: "persuade", actor, difficulty: "Thường", seed: 1 });
    expect(r.target).toBe(58);
  });

  it("breakdown minh bạch gom đủ nguồn modifier (5bis.5)", () => {
    const r = resolveCheck({
      checkId: "persuade", actor, difficulty: "Khó", seed: 1,
      talentBonus: 3, circumstance: -5, gameDifficultyMod: 5,
    });
    const labels = r.breakdown.map((b) => b.label);
    expect(labels).toContain("nền");
    expect(labels.some((l) => l.includes("Uy Tín"))).toBe(true);
    expect(labels.some((l) => l.includes("Thuyết Phục"))).toBe(true);
    expect(labels).toContain("thiên phú");
    expect(labels).toContain("hoàn cảnh");
    expect(labels).toContain("độ khó ván");
    // tổng breakdown = target (trước clamp)
    const sum = r.breakdown.reduce((s, b) => s + b.value, 0);
    expect(r.target).toBe(Math.min(95, Math.max(5, Math.round(sum))));
  });

  it("kỹ năng CHƯA HỌC (cấp 0) vẫn check được bằng chỉ số trần", () => {
    const r = resolveCheck({ checkId: "heal_disease", actor, difficulty: "Thường", seed: 5 });
    // Trí Tuệ 10 → +0, kỹ năng 0 → +0, DC 20 → target 30
    expect(r.target).toBe(30);
  });

  it("target luôn trong 5..95 (không bao giờ 0%/100%)", () => {
    const god: CheckActor = { stats: { "Uy Tín": 20 }, skills: { "Thuyết Phục": 10 } };
    expect(resolveCheck({ checkId: "persuade", actor: god, difficulty: "Dễ Ợt", seed: 1 }).target).toBe(95);
    const wretch: CheckActor = { stats: { "Uy Tín": 1 }, skills: {} };
    expect(resolveCheck({ checkId: "persuade", actor: wretch, difficulty: "Gần Như Bất Khả", seed: 1 }).target).toBe(5);
  });

  it("OPPOSED check: DC động theo chỉ số + kỹ năng đối phương", () => {
    const liar: CheckActor = { stats: { "Uy Tín": 14 }, skills: { "Lừa Gạt": 5 } };
    const fool: CheckActor = { stats: { "Tinh Tường": 6 }, skills: {} };
    const sage: CheckActor = { stats: { "Tinh Tường": 18 }, skills: { "Thu Thập Tin Đồn": 8 } };
    const vsFool = resolveCheck({ checkId: "deceive", actor: liar, opponent: fool, seed: 1 });
    const vsSage = resolveCheck({ checkId: "deceive", actor: liar, opponent: sage, seed: 1 });
    expect(vsFool.target).toBeGreaterThan(vsSage.target); // lừa kẻ ngờ nghệch dễ hơn nhiều
    const def = CHECK_MAP.deceive;
    expect(opposedDc(def, sage)).toBeGreaterThan(opposedDc(def, fool));
  });

  it("checkId LẠ → fallback chỉ số trần, không throw", () => {
    const r = resolveCheck({ checkId: "nhảy_múa_trên_băng", actor, difficulty: "Thường", seed: 3 });
    expect(r.def).toBeNull();
    expect(r.target).toBeGreaterThanOrEqual(5);
    expect(r.grade).toBeTruthy();
  });
});

describe("weightedPick (5bis.7)", () => {
  it("tôn trọng điều kiện + trọng số", () => {
    const items = [
      { value: "a", weight: 1, condition: () => false },
      { value: "b", weight: 100 },
      { value: "c", weight: 0 },
    ];
    // b chiếm toàn bộ trọng số khả dụng
    for (let i = 0; i < 10; i++) {
      expect(weightedPick(items, makeRng(i))).toBe("b");
    }
  });

  it("trọng số ĐỘNG theo state (hàm)", () => {
    let famine = true;
    const items = [
      { value: "nạn đói", weight: () => (famine ? 90 : 5) },
      { value: "hội mùa", weight: () => (famine ? 10 : 95) },
    ];
    const picksFamine = Array.from({ length: 30 }, (_, i) => weightedPick(items, makeRng(i)));
    expect(picksFamine.filter((p) => p === "nạn đói").length).toBeGreaterThan(20);
    famine = false;
    const picksPlenty = Array.from({ length: 30 }, (_, i) => weightedPick(items, makeRng(i)));
    expect(picksPlenty.filter((p) => p === "hội mùa").length).toBeGreaterThan(20);
  });

  it("pool rỗng sau lọc → null", () => {
    expect(weightedPick([{ value: "x", weight: 1, condition: () => false }], makeRng(1))).toBeNull();
  });
});
