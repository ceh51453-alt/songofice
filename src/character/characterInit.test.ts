/**
 * Acceptance tests M5: point-buy, gate thiên phú/kỹ năng, canon nạp đủ chỉ số,
 * gói tài sản vào state, phái sinh tự tính, khủng hoảng + tâm phúc, và mọi
 * phán định sau đó đọc đúng chỉ số vừa tạo.
 */
import { describe, expect, it } from "vitest";
import {
  BUDGETS, CORE_STATS, STAT_BASE, buildStateFromCanon, buildStateFromWizard,
  buildInitLoreEntry, buildOpeningMessage, flawRefund, pointBuySpent, resolveCrisisDesc,
  talentSlots, validatePointBuy, npcAffinityOffset, type WizardData,
} from "./characterInit";
import { ERAS_BY_ID } from "../content/westeros/eras";
import { availableTalents } from "../content/westeros/talents";
import { availableSkills } from "../content/westeros/skills";
import { availableCrises } from "../content/westeros/startingCrises";
import { resolveCheck } from "../probability/resolveCheck";
import type { CoreStat } from "../content/westeros/skills";

const MODES = {
  narrativeMode: "Diễn Giải Tự Do" as const,
  scenarioMode: "Người Chơi Là Trung Tâm" as const,
  difficulty: "Cân Bằng" as const,
};

function makeWizard(partial?: Partial<WizardData>): WizardData {
  return {
    eraId: "war-of-five-kings", houseId: "stark", originId: "knight",
    ...MODES,
    name: "Ser Duncan", age: 25,
    continent: "Westeros", culture: "", religion: "", patronGod: "", bloodline: "none", startingLocation: "",
    pointBuy: Object.fromEntries(CORE_STATS.map((s) => [s, STAT_BASE])) as Record<CoreStat, number>,
    talentIds: [], skillAllocations: {},
    dragon: null,
    persona: { ngoaiHinh: "", tinhCach: "", tieuSu: "", mauMat: "", mauToc: "", chieuCao: "" },
    crisisId: null, companionId: null, hookId: "ai-random",
    ...partial,
  };
}

describe("Point-buy (8.5 Bước 2)", () => {
  it("tổng điểm cố định theo Độ Khó; vượt quỹ bị chặn", () => {
    const alloc = { ...makeWizard().pointBuy, "Sức Mạnh": 15, "Thể Chất": 13 }; // 7+5 = 12 điểm
    expect(pointBuySpent(alloc)).toBe(12);
    expect(validatePointBuy(alloc, "Cân Bằng", []).ok).toBe(true);
    const over = { ...alloc, "Uy Tín": 9 }; // 13 điểm > 12
    expect(validatePointBuy(over, "Cân Bằng", []).ok).toBe(false);
    expect(validatePointBuy(over, "Nhàn Hạ", []).ok).toBe(true); // quỹ 16
  });

  it("HẠ chỉ số xuống tối thiểu 6 để lấy thêm điểm", () => {
    const alloc = { ...makeWizard().pointBuy, "Sức Mạnh": 6, "Trí Tuệ": 15, "Tinh Tường": 15 }; // -2 +7 +7 = 12
    const r = validatePointBuy(alloc, "Cân Bằng", []);
    expect(r.ok).toBe(true);
    expect(r.spent).toBe(12);
    // dưới 6 → không hợp lệ
    expect(validatePointBuy({ ...alloc, "Sức Mạnh": 5 }, "Cân Bằng", []).ok).toBe(false);
    // trần 15 lúc tạo
    expect(validatePointBuy({ ...alloc, "Trí Tuệ": 16 }, "Cân Bằng", []).ok).toBe(false);
  });

  it("khiếm khuyết HOÀN điểm point-buy (+|cost|) và +1 slot thiên phú", () => {
    expect(flawRefund(["dwarf"])).toBe(3); // cost -3
    expect(flawRefund(["lame", "ill-reputed"])).toBe(4);
    const alloc = { ...makeWizard().pointBuy, "Trí Tuệ": 15, "Tinh Tường": 15 }; // 14 điểm
    expect(validatePointBuy(alloc, "Cân Bằng", []).ok).toBe(false); // 14 > 12
    expect(validatePointBuy(alloc, "Cân Bằng", ["dwarf"]).ok).toBe(true); // 12+3 = 15
    // slot: Cân Bằng 2 tích cực; nhận 1 flaw → 3
    expect(talentSlots("Cân Bằng", ["warrior-blood", "silver-tongue"]).max).toBe(2);
    expect(talentSlots("Cân Bằng", ["warrior-blood", "silver-tongue", "lame"]).max).toBe(3);
  });

  it("quỹ co giãn theo Độ Khó (8.5)", () => {
    expect(BUDGETS["Nhàn Hạ"].pointBuy).toBeGreaterThan(BUDGETS["Cân Bằng"].pointBuy);
    expect(BUDGETS["Cân Bằng"].pointBuy).toBeGreaterThan(BUDGETS["Chân Thực"].pointBuy);
  });
});

describe("Gate thiên phú + kỹ năng (8.5 Bước 3-4)", () => {
  it("thiên phú ma thuật chỉ hiện khi Era có phép + Nhà/xuất thân hợp lệ", () => {
    // Loạn Robert: KHÔNG có phép → không thiên phú ma thuật nào
    const rebellion = availableTalents({ eraId: "roberts-rebellion", eraHasMagic: false, originId: "knight", houseId: "stark" });
    expect(rebellion.some((t) => t.category === "Ma Thuật")).toBe(false);
    // Ngũ Vương + Targaryen → có Máu Rồng... nhưng eras của dragon-blood không gồm war-of-five-kings (chỉ -late)
    const wofk = availableTalents({ eraId: "war-of-five-kings", eraHasMagic: true, originId: "old-blood", houseId: "stark" });
    expect(wofk.some((t) => t.id === "warg")).toBe(true); // warg mở cho era này
    expect(wofk.some((t) => t.id === "dragon-blood")).toBe(false); // Stark không phải Targaryen
    // Chinh Phạt Aegon + Targaryen → Máu Rồng mở
    const aegon = availableTalents({ eraId: "aegon-conquest", eraHasMagic: true, originId: "lord-heir", houseId: "targaryen" });
    expect(aegon.some((t) => t.id === "dragon-blood")).toBe(true);
    // thiên phú Stark-only gate đúng
    expect(aegon.some((t) => t.id === "lord-of-north")).toBe(false);
  });

  it("kỹ năng Ma Thuật chỉ mở khi đã chọn thiên phú tương ứng", () => {
    const noTalent = availableSkills({ eraHasMagic: true, chosenTalentIds: [] });
    expect(noTalent.some((s) => s.id === "warging")).toBe(false);
    expect(noTalent.some((s) => s.id === "poison-craft")).toBe(true); // độc dược không đòi thiên phú
    const withWarg = availableSkills({ eraHasMagic: true, chosenTalentIds: ["warg"] });
    expect(withWarg.some((s) => s.id === "warging")).toBe(true);
    // Era không phép → kỹ năng magic:true đóng; Độc Dược vẫn mở (bank: không phải phép thật)
    const noMagic = availableSkills({ eraHasMagic: false, chosenTalentIds: ["warg"] });
    expect(noMagic.some((s) => s.magic)).toBe(false);
    expect(noMagic.some((s) => s.id === "poison-craft")).toBe(true);
  });
});

describe("buildStateFromWizard (8.6b)", () => {
  it("point-buy + bonus xuất thân cộng SAU; parseEffect thiên phú VÔ ĐIỀU KIỆN cộng cốt lõi", () => {
    const s = buildStateFromWizard(
      makeWizard({
        originId: "knight", // +2 Sức Mạnh, +1 Thể Chất
        pointBuy: { ...makeWizard().pointBuy, "Sức Mạnh": 12 },
        talentIds: ["warrior-blood"], // +2 Sức Mạnh (vô điều kiện), Sát Thương Cận+1 (phái sinh)
      }),
    );
    // 12 (point-buy) + 2 (origin) + 2 (talent) = 16
    expect(s["Chỉ Số Cốt Lõi"]["Sức Mạnh"]).toBe(16);
    expect(s["Chỉ Số Cốt Lõi"]["Thể Chất"]).toBe(9);
    // thiên phú CÓ ĐIỀU KIỆN không cộng thẳng (silver-tongue "khi thuyết phục")
    const s2 = buildStateFromWizard(makeWizard({ talentIds: ["silver-tongue"] }));
    expect(s2["Chỉ Số Cốt Lõi"]["Uy Tín"]).toBe(8); // KHÔNG +3
    expect(s2["Thiên Phú"]["Lưỡi Bạc"]).toBeDefined(); // vẫn có trong state cho AI đọc
  });

  it("gói kỹ năng xuất thân + phân bổ + grant thiên phú; nhóm đúng", () => {
    const s = buildStateFromWizard(
      makeWizard({
        originId: "knight", // sword-shield 4, war-riding 3
        talentIds: ["born-swordsman"], // grant sword-shield +2
        skillAllocations: { "stealth": 3 },
      }),
    );
    expect(s["Kỹ Năng"]["Kiếm & Khiên"]["Cấp"]).toBe(6); // 4 + 2
    expect(s["Kỹ Năng"]["Cưỡi Ngựa Chiến"]["Cấp"]).toBe(3);
    expect(s["Kỹ Năng"]["Ẩn Nấp"]).toMatchObject({ "Cấp": 3, "Nhóm": "Sinh Tồn" });
  });

  it("GÓI TÀI SẢN vào state: Lãnh Chúa mở lãnh địa + kinh tế; Thường Dân gần trắng tay", () => {
    const lord = buildStateFromWizard(makeWizard({ originId: "lord-heir" }));
    expect(lord["Thông Tin Nhân Vật"]["Vàng"]).toBe(5000);
    const lordLands = Object.values(lord["Lãnh Địa"]);
    expect(lordLands.length).toBe(1);
    expect(lordLands[0]["Tài Nguyên"]["Lương Thực"]).toBe(20000);
    expect(lord["Danh Vọng"]["Vinh Dự"]).toBe(10);

    const pauper = buildStateFromWizard(makeWizard({ originId: "commoner" }));
    expect(pauper["Thông Tin Nhân Vật"]["Vàng"]).toBe(10);
    expect(Object.keys(pauper["Lãnh Địa"])).toHaveLength(0);
  });

  it("phái sinh tự tính từ cốt lõi + trang bị; HP/Thể Lực = trần (8.6b bước 5)", () => {
    const s = buildStateFromWizard(makeWizard({ originId: "knight" }));
    // knight có giáp xích +4 Phòng Thủ, khiên +3
    const nn = s["Chỉ Số Cốt Lõi"]["Nhanh Nhẹn"];
    expect(s["Chỉ Số Phái Sinh"]["_Phòng Thủ"]).toBe(Math.round(10 + nn / 2) + 3 + 4);
    expect(s["Chỉ Số Sinh Tồn"]["HP"]).toBe(s["Chỉ Số Phái Sinh"]["_HP Tối Đa"]);
    expect(s["Chỉ Số Sinh Tồn"]["Thể Lực"]).toBe(s["Chỉ Số Phái Sinh"]["_Thể Lực Tối Đa"]);
  });

  it("tâm phúc thành NPC với Hảo Cảm cao + offset thiên phú; Cài Đặt Ván lưu 2 trục + era", () => {
    const s = buildStateFromWizard(
      makeWizard({ companionId: "loyal-guard", companionName: "Duncan Trung Thành", talentIds: [], originId: "lord-heir" }),
    );
    // lord-heir tặng highborn-charm → +10 hảo cảm
    const npc = s["Mối Quan Hệ"]["NPC Chính"]["Duncan Trung Thành"];
    expect(npc["Độ Hảo Cảm"]).toBe(65); // 55 + 10
    expect(npc["Tin Cậy"]).toBe(70);
    expect(npcAffinityOffset(["highborn-charm"])).toBe(10);
    expect(npcAffinityOffset(["ill-reputed"])).toBe(-10);
    expect(s["Cài Đặt Ván"]["Thời Kỳ"]).toBe("war-of-five-kings");
    expect(s["Cài Đặt Ván"]["Hướng Kịch Bản"]).toBe("Người Chơi Là Trung Tâm");
    expect(s["Thế Giới"]["Năm"]).toBe(298);
  });

  it("mọi phán định SAU ĐÓ đọc đúng chỉ số vừa tạo (nối resolveCheck 5bis)", () => {
    const s = buildStateFromWizard(
      makeWizard({
        pointBuy: { ...makeWizard().pointBuy, "Uy Tín": 14 },
        originId: "northern-noble",
        startingLocation: "",
        narrativeMode: "Theo Sát Nguyên Tác",
        skillAllocations: { "persuasion": 4 },
      }),
    );
    const actor = {
      stats: s["Chỉ Số Cốt Lõi"],
      skills: Object.fromEntries(Object.entries(s["Kỹ Năng"]).map(([name, sk]) => [name, sk["Cấp"]])),
    };
    const r = resolveCheck({ checkId: "persuade", actor, difficulty: "Thường", seed: 42 });
    // Uy Tín = 14 (point-buy) + 2 (minor-noble) + 1 (quà Duyên Quý Nhân, vô điều kiện) = 17
    // → 50 + (17−10)×3 + Thuyết Phục 4×4 − DC 20 = 67
    expect(s["Chỉ Số Cốt Lõi"]["Uy Tín"]).toBe(17);
    expect(r.target).toBe(67);
  });
});

describe("buildStateFromCanon (8.4b)", () => {
  const era = ERAS_BY_ID["war-of-five-kings"];

  it("Ned có Ice (Thép Valyria, valyrian+gia truyền) + Kiếm/Chỉ Huy cao", () => {
    const ned = era.canonCharacters.find((c) => c.id === "eddard-stark")!;
    const s = buildStateFromCanon(ned, era, MODES);
    const ice = s["Trang Bị Đang Mặc"]["Vũ Khí Chính"]!;
    expect(ice["Tên"]).toBe("Ice");
    expect(ice["Phẩm Chất"]).toBe("Thép Valyria");
    expect(ice["Đặc Tính"]).toContain("valyrian");
    expect(ice["Đặc Tính"]).toContain("gia truyền");
    expect(s["Kỹ Năng"]["Kiếm & Khiên"]["Cấp"]).toBe(7);
    expect(s["Kỹ Năng"]["Chỉ Huy Quân"]["Cấp"]).toBe(8);
    expect(s["Thông Tin Nhân Vật"]["Họ Tên"]).toBe("Eddard Stark");
    expect(s["Thông Tin Nhân Vật"]["Nhà"]).toBe("Stark");
  });

  it("Tyrion: Trí Tuệ cao + khiếm khuyết Lùn; chỉ số canon KHÔNG bị talent cộng đôi", () => {
    const tyrion = era.canonCharacters.find((c) => c.id === "tyrion-lannister")!;
    const s = buildStateFromCanon(tyrion, era, MODES);
    expect(s["Chỉ Số Cốt Lõi"]["Trí Tuệ"]).toBe(17);
    expect(s["Chỉ Số Cốt Lõi"]["Sức Mạnh"]).toBe(6); // đã là số CUỐI — dwarf không trừ thêm
    expect(s["Thiên Phú"]["Thân Hình Nhỏ Bé (Lùn)"]).toBeDefined();
    expect(s["Thiên Phú"]["Mưu Sĩ Lọc Lõi"]).toBeDefined();
  });

  it("roster lọc theo Era: Loạn Robert có Ned trẻ (19 tuổi) khác Ngũ Vương (35)", () => {
    const rebellion = ERAS_BY_ID["roberts-rebellion"];
    const youngNed = rebellion.canonCharacters.find((c) => c.name === "Eddard Stark")!;
    expect(youngNed.age).toBe(19);
    const oldNed = era.canonCharacters.find((c) => c.name === "Eddard Stark")!;
    expect(oldNed.age).toBe(35);
    expect(youngNed.birthYear).toBe(oldNed.birthYear); // cùng Năm Sinh — chỉ khác Era year (5.1e)
  });
});

describe("Khủng hoảng + lore khởi tạo + tin mở đầu (8.5b/8.6)", () => {
  it("lọc khủng hoảng theo xuất thân + Era", () => {
    const lordCrises = availableCrises({ originId: "lord-heir", eraId: "war-of-five-kings" });
    expect(lordCrises.some((c) => c.id === "restless-vassals")).toBe(true);
    expect(lordCrises.some((c) => c.id === "impossible-contract")).toBe(false); // của sát thủ
    expect(lordCrises.some((c) => c.id === "five-kings-rise")).toBe(true); // era chung
    expect(lordCrises.some((c) => c.id === "dragons-from-sea")).toBe(false); // era Aegon
  });

  it("khủng hoảng + hook vào lore entry constant + tin nhắn mở đầu", () => {
    const era = ERAS_BY_ID["war-of-five-kings"];
    const s = buildStateFromWizard(makeWizard({ originId: "lord-heir", crisisId: "empty-granary" }));
    const crisis = resolveCrisisDesc("empty-granary")!;
    const hook = era.startingHooks[0];
    const lore = buildInitLoreEntry(s, era, hook, crisis);
    expect(lore.constant).toBe(true);
    expect(lore.position).toBe("before");
    expect(lore.ignoreBudget).toBe(true);
    expect(lore.content).toContain("KHỦNG HOẢNG");
    expect(lore.content).toContain("kho dự trữ chỉ đủ nửa mùa");
    expect(lore.content).toContain(hook.title);

    const opening = buildOpeningMessage(s, era, hook, crisis);
    expect(opening).toContain("Ser Duncan");
    expect(opening).toContain("kho dự trữ chỉ đủ nửa mùa");
    expect(opening).toContain("mở đầu câu chuyện");
  });

  it("resolveCrisisDesc: null yên bình, ai-random để AI gieo", () => {
    expect(resolveCrisisDesc(null)).toBeNull();
    expect(resolveCrisisDesc("ai-random")).toContain("tự gieo");
  });
});
