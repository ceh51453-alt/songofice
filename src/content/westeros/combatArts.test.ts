/**
 * Ngân hàng chiêu thức (M22): mỗi chiêu thuộc đúng một trường phái/loại/bậc,
 * và điều kiện mở khoá phải NỐI THẬT vào kỹ năng, chỉ số, vũ khí, huyết mạch —
 * chứ không phải ai cũng có sẵn mọi chiêu như bản trước.
 */
import { describe, expect, it } from "vitest";
import {
  COMBAT_ARTS, ARTS_BY_ID, ARTS_BY_SCHOOL, ART_SCHOOLS, ART_KIND_INTRO,
  TIER_MIN_LEVEL, AIM_ZONES, DUEL_BANDS,
  artsForHolder, lockedArtsForHolder, checkArt, artBands, artUsableAt,
  describeArt, emptyHolder, schoolLevel,
  type ArtHolder,
} from "./combatArts";
import { SKILLS_BY_ID } from "./skills";
import { STATUS_DEFS } from "../../combat/statusEffects";

function holder(partial: Partial<ArtHolder> = {}): ArtHolder {
  return { ...emptyHolder(), ...partial };
}

describe("Ngân hàng chiêu thức (M22)", () => {
  it("mọi chiêu có id duy nhất và đủ ba trục phân loại", () => {
    const ids = new Set<string>();
    for (const art of COMBAT_ARTS) {
      expect(ids.has(art.id), `id trùng: ${art.id}`).toBe(false);
      ids.add(art.id);
      expect(ART_SCHOOLS[art.school], `${art.id} thiếu trường phái`).toBeTruthy();
      expect(ART_KIND_INTRO[art.kind], `${art.id} thiếu loại đòn`).toBeTruthy();
      expect(TIER_MIN_LEVEL[art.tier]).toBeGreaterThanOrEqual(0);
      expect(art.description.length).toBeGreaterThan(20);
      expect(art.flavor.length).toBeGreaterThan(10);
    }
    // đủ "nhiều loài": ít nhất 10 trường phái và 30 chiêu
    expect(Object.keys(ARTS_BY_SCHOOL).length).toBeGreaterThanOrEqual(10);
    expect(COMBAT_ARTS.length).toBeGreaterThanOrEqual(30);
  });

  it("trường phái buộc vào một kỹ năng CÓ THẬT trong skills.ts", () => {
    const skillNames = new Set(Object.values(SKILLS_BY_ID).map((s) => s.name));
    for (const school of Object.values(ART_SCHOOLS)) {
      if (!school.skillName) continue; // Phổ Thông / Dã Chiến / Huyết Thuật không đòi kỹ năng
      expect(skillNames.has(school.skillName), `${school.id} trỏ tới kỹ năng không tồn tại: ${school.skillName}`).toBe(true);
    }
  });

  it("trạng thái mà chiêu gieo ra đều CÓ THẬT trong sổ trạng thái", () => {
    for (const art of COMBAT_ARTS) {
      for (const s of [...(art.onHit ?? []), ...(art.onSelf ?? [])]) {
        expect(STATUS_DEFS[s.id], `${art.id} gieo trạng thái lạ: ${s.id}`).toBeTruthy();
      }
      if (art.backfire) expect(STATUS_DEFS[art.backfire.status]).toBeTruthy();
    }
  });

  it("dải cự ly suy đúng từ range khi chiêu không khai rõ", () => {
    expect(artBands(ARTS_BY_ID["ban_ten"])).toEqual(["Tầm Xa"]);
    expect(artUsableAt(ARTS_BY_ID["ban_ten"], "Cận Chiến")).toBe(false);
    // giáo dài vô dụng khi bị ôm sát
    expect(artUsableAt(ARTS_BY_ID["dam_xuyen"], "Áp Sát")).toBe(false);
    expect(artUsableAt(ARTS_BY_ID["dam_xuyen"], "Tầm Xa")).toBe(true);
    // đòn vật chỉ dùng được khi đã áp sát
    expect(artUsableAt(ARTS_BY_ID["vat_nga"], "Áp Sát")).toBe(true);
    expect(artUsableAt(ARTS_BY_ID["vat_nga"], "Cận Chiến")).toBe(false);
    for (const b of DUEL_BANDS) {
      expect(artUsableAt(ARTS_BY_ID["phong_thu"], b)).toBe(true);
    }
  });

  it("người tay trắng chưa học gì vẫn có bộ Phổ Thông, KHÔNG có tuyệt kỹ", () => {
    const arts = artsForHolder(holder());
    const ids = arts.map((a) => a.id);
    expect(ids).toContain("tan_cong_thuong");
    expect(ids).toContain("phong_thu");
    expect(ids).toContain("lay_hoi");
    // chưa cầm kiếm thì không có chiêu kiếm, chưa luyện thì không có tuyệt kỹ
    expect(ids).not.toContain("gat_kiem");
    expect(ids).not.toContain("nhat_kiem_thanh_danh");
    expect(ids).not.toContain("mua_mui_ten");
    expect(arts.every((a) => a.tier !== "Tuyệt Kỹ")).toBe(true);
  });

  it("ĐỔI VŨ KHÍ LÀ ĐỔI BỘ CHIÊU — cùng một người, khác thứ cầm trong tay", () => {
    const base = { skills: { "Kiếm & Khiên": 6, "Rìu & Chuỳ": 6, "Cung & Nỏ": 6, "Song Kiếm": 6 }, stats: { "Sức Mạnh": 16, "Tinh Tường": 16, "Nhanh Nhẹn": 14 } };
    const swordman = artsForHolder(holder({ ...base, weaponWords: ["kiếm dài"], hasShield: true })).map((a) => a.id);
    const axeman = artsForHolder(holder({ ...base, weaponWords: ["rìu chiến", "nặng"] })).map((a) => a.id);
    const archer = artsForHolder(holder({ ...base, weaponWords: ["cung dài"] })).map((a) => a.id);

    expect(swordman).toContain("gat_kiem");
    expect(swordman).toContain("thuc_khien"); // có khiên mới thúc khiên được
    expect(swordman).not.toContain("bo_thang");

    expect(axeman).toContain("bo_thang");
    expect(axeman).toContain("pha_giap");
    expect(axeman).not.toContain("gat_kiem");
    expect(axeman).not.toContain("thuc_khien"); // không mang khiên

    expect(archer).toContain("ban_tia");
    expect(archer).toContain("mua_mui_ten");
    expect(archer).not.toContain("bo_thang");
  });

  it("chiêu Song Kiếm đòi CẦM HAI VŨ KHÍ, không phải chỉ 'không mang khiên'", () => {
    const trained = { skills: { "Song Kiếm": 6 }, weaponWords: ["kiếm dài"], stats: { "Nhanh Nhẹn": 15 } };
    // một tay kiếm một tay không → không phải song kiếm
    const oneHanded = artsForHolder(holder(trained)).map((a) => a.id);
    expect(oneHanded).not.toContain("loat_chem_doi");
    // cầm thêm vũ khí tay phụ mới ra được bộ song kiếm
    const dual = artsForHolder(holder({ ...trained, hasOffhand: true })).map((a) => a.id);
    expect(dual).toContain("loat_chem_doi");
    expect(dual).toContain("cat_gan");
    // cầm hai vũ khí nhưng chưa học ngày nào cũng không đánh song kiếm được
    const untrained = artsForHolder(holder({ weaponWords: ["kiếm dài"], hasOffhand: true })).map((a) => a.id);
    expect(untrained).not.toContain("loat_chem_doi");
  });

  it("BẬC khoá theo cấp kỹ năng: luyện thêm thì mở thêm", () => {
    const weapon = { weaponWords: ["kiếm dài"], stats: { "Nhanh Nhẹn": 14 } };
    const novice = artsForHolder(holder({ ...weapon, skills: { "Kiếm & Khiên": 1 } })).map((a) => a.id);
    const veteran = artsForHolder(holder({ ...weapon, skills: { "Kiếm & Khiên": 6 } })).map((a) => a.id);
    const master = artsForHolder(holder({ ...weapon, skills: { "Kiếm & Khiên": 9 } })).map((a) => a.id);

    expect(novice).toContain("gat_kiem");
    expect(novice).not.toContain("don_chem_ngang");
    expect(veteran).toContain("don_chem_ngang");
    expect(veteran).toContain("phan_kiem");
    expect(veteran).not.toContain("nhat_kiem_thanh_danh");
    expect(master).toContain("nhat_kiem_thanh_danh");
  });

  it("chỉ số cốt lõi cũng là một cửa: sức yếu thì không vung nổi búa tạ", () => {
    const w = { skills: { "Rìu & Chuỳ": 9 }, weaponWords: ["búa chiến", "nặng"] };
    const weak = artsForHolder(holder({ ...w, stats: { "Sức Mạnh": 11 } })).map((a) => a.id);
    const strong = artsForHolder(holder({ ...w, stats: { "Sức Mạnh": 17 } })).map((a) => a.id);
    expect(weak).not.toContain("bua_ta_dinh_nui");
    expect(strong).toContain("bua_ta_dinh_nui");
  });

  it("huyết mạch / văn hoá / thiên phú mở những chiêu vàng không mua được", () => {
    const valyrian = artsForHolder(holder({ bloodline: "Máu Valyria" })).map((a) => a.id);
    expect(valyrian).toContain("khe_lua");
    expect(artsForHolder(holder({ bloodline: "Không Rõ Huyết Mạch" })).map((a) => a.id)).not.toContain("khe_lua");

    const firstMen = artsForHolder(holder({ bloodline: "Máu Tiền Nhân" })).map((a) => a.id);
    expect(firstMen).toContain("mau_tien_nhan_bung");

    const ironborn = artsForHolder(holder({ culture: "Ironborn" })).map((a) => a.id);
    expect(ironborn).toContain("gam_thet");
    expect(ironborn).toContain("don_dau_bua");
    expect(artsForHolder(holder({ culture: "Reach" })).map((a) => a.id)).not.toContain("gam_thet");

    const priest = artsForHolder(holder({ talents: ["rhllor-chosen"] })).map((a) => a.id);
    expect(priest).toContain("bong_lua_rhllor");
  });

  it("giáp nặng khoá Vũ Điệu Nước, và Braavos HOẶC thiên phú đều mở được", () => {
    const base = { skills: { "Song Kiếm": 6 }, weaponWords: ["kiếm mảnh"], hasOffhand: true };
    const braavosi = checkArt(ARTS_BY_ID["vu_dieu_nuoc"], holder({ ...base, origin: "Braavos" }));
    expect(braavosi.ok).toBe(true);
    const talented = checkArt(ARTS_BY_ID["vu_dieu_nuoc"], holder({ ...base, talents: ["Vũ Điệu Nước"] }));
    expect(talented.ok).toBe(true);
    const armoured = checkArt(ARTS_BY_ID["vu_dieu_nuoc"], holder({ ...base, origin: "Braavos", heavyArmor: true }));
    expect(armoured.ok).toBe(false);
    expect(armoured.reasons.join(" ")).toContain("giáp nặng");
  });

  it("chiêu Kỵ Chiến chỉ mở khi đang trên lưng ngựa", () => {
    const onFoot = artsForHolder(holder({ skills: { "Cưỡi Ngựa Chiến": 8 } })).map((a) => a.id);
    const mounted = artsForHolder(holder({ skills: { "Cưỡi Ngựa Chiến": 8 }, mounted: true })).map((a) => a.id);
    expect(onFoot).not.toContain("xung_phong");
    expect(mounted).toContain("xung_phong");
    expect(mounted).toContain("vong_ky");
  });

  it("chiêu chưa mở trả về LÝ DO cụ thể để người chơi biết phải luyện gì", () => {
    const locked = lockedArtsForHolder(holder({ weaponWords: ["kiếm"] }));
    const masterStroke = locked.find((x) => x.art.id === "nhat_kiem_thanh_danh");
    expect(masterStroke).toBeTruthy();
    expect(masterStroke!.reasons.some((r) => r.includes("Kiếm & Khiên cấp 8"))).toBe(true);
    expect(masterStroke!.reasons.some((r) => r.includes("Nhanh Nhẹn"))).toBe(true);
  });

  it("schoolLevel đọc đúng cấp kỹ năng, trường phái không gắn kỹ năng thì không khoá", () => {
    const h = holder({ skills: { "Kiếm & Khiên": 4 } });
    expect(schoolLevel(h, "kiem-khien")).toBe(4);
    expect(schoolLevel(h, "trong-binh")).toBe(0);
    expect(schoolLevel(h, "pho-thong")).toBe(10);
  });

  it("vùng nhắm: nhắm đầu khó hơn nhắm thân, và mọi bộ phận đều hợp lệ", () => {
    expect(AIM_ZONES["Đầu"].hitMod).toBeLessThan(AIM_ZONES["Thân"].hitMod);
    expect(AIM_ZONES["Tay"].hitMod).toBeLessThan(0);
    for (const zone of Object.values(AIM_ZONES)) {
      expect(zone.parts.length).toBeGreaterThan(0);
      expect(zone.desc.length).toBeGreaterThan(20);
    }
    // nhắm tay phải trúng đúng tay cầm vũ khí
    expect(AIM_ZONES["Tay"].parts.every((p) => p.includes("Phải"))).toBe(true);
  });

  it("describeArt gói đủ thông tin cho tooltip", () => {
    const text = describeArt(ARTS_BY_ID["mua_mui_ten"]);
    expect(text).toContain("Xạ Thuật");
    expect(text).toContain("Thể Lực");
    expect(text).toContain("3 nhát");
  });
});
