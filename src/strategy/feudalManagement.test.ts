import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "../territory/territoryEngine";
import { EXCHANGE_RATES } from "../economy/currency";
import { estimateTerritoryYield } from "../territory/construction";
import { regionGrossProduct } from "../economy/taxation";
import {
  FEUDAL_ACTIONS, MIN_GOVERNANCE_PROJECT_DAYS, REGIONAL_ACTIONS,
  activeGovernanceProjects, availableFeudalActions, changeDemesneFocus, changeDemesnePlan, feudalActionDuration, feudalModifiers,
  governanceProjectEfficiency, previewFeudalAgenda, takeFeudalAction, takeFeudalAgenda, takeRegionalAction,
  tickFeudalGovernance, tickGovernanceProjects,
} from "./feudalManagement";

const GOLD = EXCHANGE_RATES.GOLD_TO_COPPER;

function lord(title = "Đại Lãnh Chúa"): StatData {
  const state = makeDefaultState();
  state["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  state["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  state["Thông Tin Nhân Vật"]["Tước Vị"] = title;
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = 5_000 * GOLD;
  seedRegionControl(state, "war-of-five-kings", { createIfMissing: true });
  return StatDataSchema.parse(state);
}

function finishProjects(state: StatData, maxDays = 2_000): void {
  for (let day = 0; day < maxDays && activeGovernanceProjects(state).length > 0; day++) tickGovernanceProjects(state);
  expect(activeGovernanceProjects(state), "dự án phải hoàn tất trong giới hạn kiểm thử").toHaveLength(0);
}

describe("mini-game đất trực thuộc", () => {
  it("khuyến nông tăng lương nhưng giảm tiền và gỗ", () => {
    const state = lord("Nam Tước");
    const id = Object.keys(state["Lãnh Địa"])[0];
    const before = estimateTerritoryYield(state["Lãnh Địa"][id], id, 5);
    const result = changeDemesneFocus(state, id, "Khuyến Nông");
    expect(result.ok).toBe(true);
    const changed = applyPatch(state, result.ops).state;
    expect(estimateTerritoryYield(changed["Lãnh Địa"][id], id, 5)).toEqual(before);
    expect(activeGovernanceProjects(changed, "Đất Trực Thuộc")).toHaveLength(1);
    finishProjects(changed);
    const after = estimateTerritoryYield(changed["Lãnh Địa"][id], id, 5);

    expect(after["Lương Thực"]).toBeGreaterThan(before["Lương Thực"]);
    expect(after["Gỗ"]).toBeLessThan(before["Gỗ"]);
    expect(after["Ngân Khố"]).toBeLessThan(before["Ngân Khố"]);
    expect(changed["Lãnh Địa"][id]["Quản Trị Lãnh Địa"]["Phân Bổ Đất"]["Canh Tác"]).toBe(60);
  });

  it("mỗi nhịp chỉ đổi trọng tâm một lần", () => {
    const state = lord("Nam Tước");
    const id = Object.keys(state["Lãnh Địa"])[0];
    const first = applyPatch(state, changeDemesneFocus(state, id, "Lâm Nghiệp").ops).state;
    expect(changeDemesneFocus(first, id, "Lao Dịch").ok).toBe(false);
  });

  it("kế hoạch mùa vụ phải chia đúng 100% và khai thác quá mức làm đất thoái hóa", () => {
    const state = lord("Nam Tước");
    const id = Object.keys(state["Lãnh Địa"])[0];
    const invalid = changeDemesnePlan(state, id, {
      allocation: { "Canh Tác": 70, "Đồng Cỏ": 20, "Lâm Địa": 20, "Thôn Ấp": 10 },
      intensity: 90,
      seedReserve: 20,
    });
    expect(invalid.ok).toBe(false);

    const before = state["Lãnh Địa"][id]["Quản Trị Lãnh Địa"];
    const fertility = before["Độ Màu Mỡ"];
    const erosion = before["Xói Mòn"];
    const valid = changeDemesnePlan(state, id, {
      allocation: { "Canh Tác": 70, "Đồng Cỏ": 10, "Lâm Địa": 10, "Thôn Ấp": 10 },
      intensity: 90,
      seedReserve: 20,
    });
    const changed = applyPatch(state, valid.ops).state;
    finishProjects(changed);
    tickFeudalGovernance(changed);
    expect(changed["Lãnh Địa"][id]["Quản Trị Lãnh Địa"]["Độ Màu Mỡ"]).toBeLessThan(fertility);
    expect(changed["Lãnh Địa"][id]["Quản Trị Lãnh Địa"]["Xói Mòn"]).toBeGreaterThan(erosion);
  });
});

describe("mini-game lãnh thổ", () => {
  it("chiến dịch vùng thay đổi chỉ số thật và mỗi vùng chỉ nhận một chiến dịch mỗi nhịp", () => {
    const state = lord("Đại Lãnh Chúa");
    const regionId = Object.entries(state["Chủ Quyền Lãnh Thổ"])
      .find(([, sovereignty]) => sovereignty["Là Của Người Chơi"])?.[0];
    expect(regionId).toBeTruthy();
    const before = state["Chủ Quyền Lãnh Thổ"][regionId!]["Quản Trị"]["Hạ Tầng"];
    const result = takeRegionalAction(state, regionId!, "road-wards");
    expect(result.ok).toBe(true);
    const changed = applyPatch(state, result.ops).state;
    expect(changed["Chủ Quyền Lãnh Thổ"][regionId!]["Quản Trị"]!["Hạ Tầng"]).toBe(before);
    expect(takeRegionalAction(changed, regionId!, "granary-network").ok).toBe(false);
    const grossBefore = regionGrossProduct(changed, regionId!);
    finishProjects(changed);
    expect(changed["Chủ Quyền Lãnh Thổ"][regionId!]["Quản Trị"]["Hạ Tầng"]).toBe(before + 13);
    expect(regionGrossProduct(changed, regionId!)).toBeGreaterThan(grossBefore);
  });
});

describe("mini-game tước địa và chính thể", () => {
  it("mọi cấp quản trị đều có chân trời nhiều ngày và không thể xong sau một nhịp ngày", () => {
    expect(REGIONAL_ACTIONS.every((action) => action.durationDays >= MIN_GOVERNANCE_PROJECT_DAYS["Lãnh Thổ"])).toBe(true);
    expect(FEUDAL_ACTIONS.every((action) => feudalActionDuration(action) >= MIN_GOVERNANCE_PROJECT_DAYS[action.realmOnly ? "Vương Quốc" : "Tước Địa"])).toBe(true);

    const demesne = lord("Nam Tước");
    const holdingId = Object.keys(demesne["Lãnh Địa"])[0];
    const demesneRunning = applyPatch(demesne, changeDemesneFocus(demesne, holdingId, "Khuyến Nông").ops).state;

    const territory = lord("Đại Lãnh Chúa");
    const regionId = Object.entries(territory["Chủ Quyền Lãnh Thổ"]).find(([, sovereignty]) => sovereignty["Là Của Người Chơi"])![0];
    const territoryRunning = applyPatch(territory, takeRegionalAction(territory, regionId, "circuit-judges").ops).state;

    const domain = lord("Đại Lãnh Chúa");
    const domainRunning = applyPatch(domain, takeFeudalAction(domain, "hold-court").ops).state;
    const realm = lord("Quốc Vương");
    const realmRunning = applyPatch(realm, takeFeudalAction(realm, "great-council").ops).state;

    for (const state of [demesneRunning, territoryRunning, domainRunning, realmRunning]) {
      const project = activeGovernanceProjects(state)[0][1];
      expect(project["Ngày Cần"]).toBeGreaterThan(1);
      tickGovernanceProjects(state);
      expect(activeGovernanceProjects(state)).toHaveLength(1);
      expect(project["Ngày Công Đã Tích Lũy"]).toBeLessThan(project["Ngày Cần"]);
    }
  });

  it("quyết sách thay đổi chỉ số, ưu tiên và ngân khố thật", () => {
    const state = lord("Đại Lãnh Chúa");
    const beforeGold = state["Thông Tin Nhân Vật"]["Ngân Khố"];
    const result = takeFeudalAction(state, "audit-vassals");
    expect(result.ok).toBe(true);
    const changed = applyPatch(state, result.ops).state;
    expect(changed["Quản Trị Tước Địa"]["Ưu Tiên"]).toBe("Cân Bằng");
    expect(changed["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeLessThan(beforeGold);
    expect(activeGovernanceProjects(changed, "Tước Địa")).toHaveLength(1);
    finishProjects(changed);
    expect(changed["Quản Trị Tước Địa"]["Ưu Tiên"]).toBe("Tập Quyền");
    expect(changed["Quản Trị Tước Địa"]["Uy Quyền"]).toBe(54);
    expect(changed["Quản Trị Tước Địa"]["Gắn Kết Chư Hầu"]).toBe(43);
    expect(changed["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeLessThan(beforeGold - 80 * GOLD);
    expect(takeFeudalAction(changed, "hold-court").ok).toBe(true);
  });

  it("công tước không có quyết sách toàn cõi; quốc vương thì có", () => {
    expect(availableFeudalActions(lord("Công Tước"), true)).toHaveLength(0);
    expect(availableFeudalActions(lord("Quốc Vương"), true).map((action) => action.id)).toContain("royal-progress");
  });

  it("mặc định cân bằng không làm lệch tô thuế; tập quyền tạo trade-off", () => {
    const state = lord();
    expect(feudalModifiers(state).vassalTaxMult).toBe(1);
    state["Quản Trị Tước Địa"]["Ưu Tiên"] = "Tập Quyền";
    const centralized = feudalModifiers(state);
    expect(centralized.vassalTaxMult).toBeGreaterThan(1);
    expect(centralized.musterLoyaltyBonus).toBeLessThan(0);
  });

  it("quy mô vượt năng lực tạo gánh nặng hành chính theo tháng", () => {
    const state = lord("Nam Tước");
    for (let i = 0; i < 20; i++) {
      state["Chư Hầu"][`v-${i}`] = {
        "Tên Nhà": `Nhà ${i}`, "Thành Trì": `Thành ${i}`, "Vùng": "the-north", "Chủ Của": "stark",
        "Trung Thành": 50, "Quân Cam Kết": 100, "Binh Chủng Chính": "Bộ Binh", "Trạng Thái": "Ở Nhà",
        "Ngày Tới Nơi": 10, "Quân Đã Gửi": 0, "Ngày Tòng Quân": 0, "Ghi Chú": "",
      };
    }
    const before = state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"];
    tickFeudalGovernance(state);
    expect(state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"]).toBeGreaterThan(before);
  });

  it("nghị trình triều chính gộp nhiều quyết sách, tính sức chứa và dịch chuyển quyền lực", () => {
    const state = lord("Quốc Vương");
    const ids = ["royal-progress", "realm-concordat"];
    const preview = previewFeudalAgenda(state, ids);
    expect(preview.actions).toHaveLength(2);
    expect(preview.capacityUsed).toBeLessThanOrEqual(preview.capacityLimit);
    expect(preview.totalCostGold).toBeGreaterThan(0);

    const beforeFaith = state["Quản Trị Tước Địa"]["Trung Tâm Quyền Lực"]["Giáo Quyền"];
    const result = takeFeudalAgenda(state, ids);
    expect(result.ok).toBe(true);
    const changed = applyPatch(state, result.ops).state;
    expect(changed["Quản Trị Tước Địa"]["Chính Danh"]).toBe(state["Quản Trị Tước Địa"]["Chính Danh"]);
    finishProjects(changed);
    expect(changed["Quản Trị Tước Địa"]["Chính Danh"]).toBeGreaterThan(state["Quản Trị Tước Địa"]["Chính Danh"]);
    expect(changed["Quản Trị Tước Địa"]["Trung Tâm Quyền Lực"]["Giáo Quyền"]).toBeGreaterThan(beforeFaith);
  });

  it("dự án thiếu ngân khố sẽ đình trệ thay vì tự hoàn tất theo lượt", () => {
    const state = lord("Quốc Vương");
    const started = takeFeudalAgenda(state, ["royal-census"]);
    const changed = applyPatch(state, started.ops).state;
    const project = activeGovernanceProjects(changed, "Vương Quốc")[0][1];
    const beforeWork = project["Ngày Công Đã Tích Lũy"];
    changed["Thông Tin Nhân Vật"]["Ngân Khố"] = 0;
    tickGovernanceProjects(changed);
    expect(project["Trạng Thái"]).toBe("Đình Trệ");
    expect(project["Ngày Công Đã Tích Lũy"]).toBe(beforeWork);
  });

  it("đại chính sách nhiều năm không thể hoàn tất chỉ sau vài lượt truyện", () => {
    const state = lord("Quốc Vương");
    const authorityBefore = state["Quản Trị Tước Địa"]["Uy Quyền"];
    const changed = applyPatch(state, takeFeudalAgenda(state, ["royal-census"]).ops).state;
    const project = activeGovernanceProjects(changed, "Vương Quốc")[0][1];
    expect(project["Ngày Cần"]).toBe(720);
    for (let day = 0; day < 60; day++) tickGovernanceProjects(changed);
    expect(activeGovernanceProjects(changed, "Vương Quốc")).toHaveLength(1);
    expect(project["Ngày Công Đã Tích Lũy"]).toBeLessThan(project["Ngày Cần"]);
    expect(changed["Quản Trị Tước Địa"]["Uy Quyền"]).toBe(authorityBefore);
  });

  it("hạ tầng, lương thực và bất ổn của vùng thật sự quyết định tốc độ dự án", () => {
    const healthy = lord("Đại Lãnh Chúa");
    const regionId = Object.entries(healthy["Chủ Quyền Lãnh Thổ"]).find(([, sovereignty]) => sovereignty["Là Của Người Chơi"])![0];
    const delayed = StatDataSchema.parse(structuredClone(healthy));
    const healthyProjectState = applyPatch(healthy, takeRegionalAction(healthy, regionId, "road-wards").ops).state;
    const delayedProjectState = applyPatch(delayed, takeRegionalAction(delayed, regionId, "road-wards").ops).state;
    const weakRegion = delayedProjectState["Chủ Quyền Lãnh Thổ"][regionId]["Quản Trị"]!;
    weakRegion["Hạ Tầng"] = 10;
    weakRegion["An Ninh Lương Thực"] = 15;
    weakRegion["Bất Ổn"] = 80;
    const healthyProject = activeGovernanceProjects(healthyProjectState, "Lãnh Thổ")[0][1];
    const delayedProject = activeGovernanceProjects(delayedProjectState, "Lãnh Thổ")[0][1];
    const healthySpeed = governanceProjectEfficiency(healthyProjectState, healthyProject);
    const delayedSpeed = governanceProjectEfficiency(delayedProjectState, delayedProject);
    expect(delayedSpeed.rate).toBeLessThan(healthySpeed.rate);
    expect(delayedSpeed.obstacles).toEqual(expect.arrayContaining(["Đường sá và trạm dịch yếu", "Bất ổn phá rối công vụ", "Thiếu lương nuôi dân phu"]));
  });

  it("dự án đang chạy chiếm bộ máy và làm hụt hiệu suất thu tô trong thời gian thi hành", () => {
    const state = lord("Quốc Vương");
    const before = feudalModifiers(state);
    const changed = applyPatch(state, takeFeudalAgenda(state, ["royal-census"]).ops).state;
    const during = feudalModifiers(changed);
    expect(during.administrationEfficiency).toBeLessThan(before.administrationEfficiency);
    expect(during.vassalTaxMult).toBeLessThan(before.vassalTaxMult);
    expect(during.musterLoyaltyBonus).toBeLessThan(before.musterLoyaltyBonus);
    expect(during.unrestRisk).toBeGreaterThan(before.unrestRisk);
  });

  it("khủng hoảng cấp tước địa thật sự làm bất ổn các lãnh thổ tăng theo tháng", () => {
    const stable = lord("Đại Lãnh Chúa");
    const strained = StatDataSchema.parse(structuredClone(stable));
    const regionId = Object.entries(stable["Chủ Quyền Lãnh Thổ"]).find(([, sovereignty]) => sovereignty["Là Của Người Chơi"])![0];
    const stableRealm = stable["Quản Trị Tước Địa"];
    stableRealm["Chính Danh"] = 90;
    stableRealm["Gắn Kết Chư Hầu"] = 90;
    stableRealm["Gánh Nặng Hành Chính"] = 0;
    stableRealm["Kiệt Quệ Chiến Tranh"] = 0;
    const strainedRealm = strained["Quản Trị Tước Địa"];
    strainedRealm["Chính Danh"] = 10;
    strainedRealm["Gắn Kết Chư Hầu"] = 10;
    strainedRealm["Gánh Nặng Hành Chính"] = 90;
    strainedRealm["Kiệt Quệ Chiến Tranh"] = 80;

    tickFeudalGovernance(stable);
    tickFeudalGovernance(strained);

    expect(strained["Chủ Quyền Lãnh Thổ"][regionId]["Quản Trị"]!["Bất Ổn"])
      .toBeGreaterThan(stable["Chủ Quyền Lãnh Thổ"][regionId]["Quản Trị"]!["Bất Ổn"]);
  });

  it("đại chính sách hoàn tất lan sang lương thực vùng và lòng dân đất trực thuộc", () => {
    const state = lord("Quốc Vương");
    const regionId = Object.entries(state["Chủ Quyền Lãnh Thổ"]).find(([, sovereignty]) => sovereignty["Là Của Người Chơi"])![0];
    const holdingId = Object.keys(state["Lãnh Địa"])[0];
    const foodBefore = state["Chủ Quyền Lãnh Thổ"][regionId]["Quản Trị"]!["An Ninh Lương Thực"];
    const loyaltyBefore = state["Lãnh Địa"][holdingId]["Lòng Dân"];
    const changed = applyPatch(state, takeFeudalAgenda(state, ["relief-realm"]).ops).state;
    finishProjects(changed);
    expect(changed["Chủ Quyền Lãnh Thổ"][regionId]["Quản Trị"]!["An Ninh Lương Thực"]).toBeGreaterThan(foodBefore);
    expect(changed["Lãnh Địa"][holdingId]["Lòng Dân"]).toBeGreaterThan(loyaltyBefore);
  });
});
