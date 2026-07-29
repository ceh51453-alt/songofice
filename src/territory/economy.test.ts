/**
 * Acceptance KINH TẾ LÃNH ĐỊA MỞ RỘNG:
 * - Nhân lực (dân phu / thợ đá / kỹ sư) là điều kiện cần ngang với vật tư:
 *   hết thợ là hết khởi công, và thợ được trả về khi công trình xong.
 * - Chuỗi chế tác: xưởng ĂN nguyên liệu để LÀM RA thứ khác, thiếu đầu vào thì
 *   đứng máy chứ không sinh ra từ hư không.
 * - Pháp lệnh có hiệu lực THẬT: hệ số vào thẳng sổ sách hằng tháng, và mọi
 *   pháp lệnh đều phải đánh đổi.
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, RESOURCE_KEYS, JOB_KEYS, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "./territoryEngine";
import {
  startConstruction, tickTerritoryIncome, tickConstruction, estimateTerritoryYield,
  availableLabour, labourInUse, issueDecree, revokeDecree,
} from "./construction";
import {
  BUILDING_CATALOG, BUILDING_LIST, RESOURCE_LIST, LABOUR_LIST,
  buildingLabour, defaultJobSplit, type ResourceKey,
} from "../content/westeros/buildings";
import { DECREE_CATALOG, DECREE_BY_ID, combineDecrees } from "../content/westeros/decrees";
import { EXCHANGE_RATES } from "../economy/currency";

const GOLD = EXCHANGE_RATES.GOLD_TO_COPPER;
const ID = "the-north-seat";

function lordState(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 50000 * GOLD;
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  const parsed = StatDataSchema.parse(s);
  parsed["Lãnh Địa"][ID]["Tài Nguyên"] = {
    "Ngân Khố": 0, "Lương Thực": 20000, "Gỗ": 20000, "Đá": 20000, "Quặng Sắt": 20000,
    "Than Đá": 20000, "Thép": 0, "Vải Vóc": 500, "Ngựa": 0, "Muối": 0,
  };
  return parsed;
}

describe("Danh mục mở rộng — công trình & tài nguyên", () => {
  it("schema và danh mục khớp nhau về tài nguyên/nghề nghiệp", () => {
    expect([...RESOURCE_KEYS]).toEqual(RESOURCE_LIST);
    for (const k of LABOUR_LIST) expect(JOB_KEYS).toContain(k);
  });

  it("mọi công trình khai báo đủ nhóm, khuôn viên và chi phí", () => {
    for (const def of BUILDING_LIST) {
      expect(def.category).toBeTruthy();
      expect(Object.keys(def.cost).length).toBeGreaterThan(0);
      expect(def.buildMonths).toBeGreaterThan(0);
      if (def.ring) expect(def.footprint).toBe(0);
      else expect(def.footprint).toBeGreaterThan(0);
      // có đầu vào thì phải có đầu ra: hoặc là hàng hoá, hoặc là một hiệu ứng
      // thật (sept đốt sáp lấy lòng dân, học viện ngốn giấy da lấy tốc độ xây)
      if (def.consume) expect(def.yield ?? def.flags).toBeTruthy();
    }
  });

  it("có đủ chuỗi khai thác → chế tác cho từng nguyên liệu mới", () => {
    const yields = (k: ResourceKey) => BUILDING_LIST.filter((d) => (d.yield?.[k] ?? 0) > 0);
    for (const k of ["Than Đá", "Thép", "Vải Vóc", "Ngựa", "Muối"] as ResourceKey[]) {
      expect(yields(k).length).toBeGreaterThan(0);
    }
    // Thép chỉ ra từ lò rèn, mà lò rèn phải ăn quặng + than
    const forge = BUILDING_CATALOG["Lò Rèn"];
    expect(forge.consume?.["Quặng Sắt"]).toBeGreaterThan(0);
    expect(forge.consume?.["Than Đá"]).toBeGreaterThan(0);
    expect(forge.yield?.["Thép"]).toBeGreaterThan(0);
  });

  it("cơ cấu nghề mặc định có đủ nhân lực và không vượt dân số", () => {
    const split = defaultJobSplit(10000);
    const total = Object.values(split).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(10000);
    for (const k of LABOUR_LIST) expect(split[k]).toBeGreaterThan(0);
  });
});

describe("Nhân lực công trường", () => {
  it("thiếu thợ thì không khởi công được, dù thừa tiền và vật tư", () => {
    const s = lordState();
    // làng nhỏ không đẻ ra được kỹ sư: nhân lực công trường suy từ DÂN SỐ,
    // không phải từ một ô số người chơi tự điền
    s["Lãnh Địa"][ID]["Dân Số"] = 600;
    expect(availableLabour(s["Lãnh Địa"][ID])["Kỹ Sư"]).toBeLessThan(10);

    const r = startConstruction(s, ID, "Học Viện Nhỏ");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Thiếu nhân lực");
    expect(r.error).toContain("Kỹ Sư");
  });

  it("công trường đang thi công GIỮ người, xong thì trả lại", () => {
    let s = lordState();
    const before = availableLabour(s["Lãnh Địa"][ID])["Dân Phu"];
    const need = buildingLabour("Doanh Trại", 1)["Dân Phu"] ?? 0;

    s = applyPatch(s, startConstruction(s, ID, "Doanh Trại").ops).state;
    expect(labourInUse(s["Lãnh Địa"][ID])["Dân Phu"]).toBe(need);
    expect(availableLabour(s["Lãnh Địa"][ID])["Dân Phu"]).toBe(before - need);

    // chạy hết ngày công → xong → thợ về nhà
    for (let i = 0; i < 200; i++) tickConstruction(s);
    expect(s["Lãnh Địa"][ID]["Công Trình"]["Doanh Trại"]["Đang Xây"]).toBe(false);
    expect(labourInUse(s["Lãnh Địa"][ID])["Dân Phu"]).toBe(0);
    expect(availableLabour(s["Lãnh Địa"][ID])["Dân Phu"]).toBe(before);
  });

  it("xây song song nhiều thứ sẽ cạn thợ", () => {
    let s = lordState();
    // dân số vừa đủ thợ cho MỘT Doanh Trại, không dư nổi một Tháp Canh nữa
    s["Lãnh Địa"][ID]["Dân Số"] = 2400;
    const free = availableLabour(s["Lãnh Địa"][ID])["Dân Phu"];
    expect(free).toBeGreaterThanOrEqual(180);
    expect(free).toBeLessThan(180 + 60);

    const first = startConstruction(s, ID, "Doanh Trại");
    expect(first.ok).toBe(true);
    s = applyPatch(s, first.ops).state;
    const second = startConstruction(s, ID, "Tháp Canh");
    expect(second.ok).toBe(false);
    expect(second.error).toContain("Dân Phu");
  });
});

describe("Chuỗi sản xuất", () => {
  it("Lò Rèn ăn quặng + than để ra thép", () => {
    const forge = BUILDING_CATALOG["Lò Rèn"];
    const withForge = lordState();
    const without = lordState();
    withForge["Lãnh Địa"][ID]["Công Trình"]["Lò Rèn"] = {
      "Loại": "Lò Rèn", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Tọa Độ X": 700, "Tọa Độ Y": 700, "Kích Thước": 12,
    };
    tickTerritoryIncome(withForge);
    tickTerritoryIncome(without);
    const a = withForge["Lãnh Địa"][ID]["Tài Nguyên"];
    const b = without["Lãnh Địa"][ID]["Tài Nguyên"];

    // so với lãnh địa y hệt nhưng không có lò: ra đúng lượng thép, ăn đúng
    // lượng quặng và than (mỏ than không có nên chênh lệch chính là mức tiêu thụ)
    expect(a["Thép"] - b["Thép"]).toBe(forge.yield!["Thép"]);
    expect(b["Quặng Sắt"] - a["Quặng Sắt"]).toBe(forge.consume!["Quặng Sắt"]);
    expect(b["Than Đá"] - a["Than Đá"]).toBe(forge.consume!["Than Đá"]);
  });

  it("hết than thì lò đứng máy — không ra thép, cũng không âm kho", () => {
    const s = lordState();
    s["Lãnh Địa"][ID]["Tài Nguyên"]["Than Đá"] = 0;
    s["Lãnh Địa"][ID]["Công Trình"]["Lò Rèn"] = {
      "Loại": "Lò Rèn", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Tọa Độ X": 700, "Tọa Độ Y": 700, "Kích Thước": 12,
    };
    tickTerritoryIncome(s);
    expect(s["Lãnh Địa"][ID]["Tài Nguyên"]["Thép"]).toBe(0);
    expect(s["Lãnh Địa"][ID]["Tài Nguyên"]["Than Đá"]).toBe(0);
  });

  it("Kho Lương giảm hao hụt kho so với không có", () => {
    const withStore = lordState();
    const without = lordState();
    withStore["Lãnh Địa"][ID]["Công Trình"]["Kho Lương"] = {
      "Loại": "Kho Lương", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Tọa Độ X": 700, "Tọa Độ Y": 700, "Kích Thước": 12,
    };
    tickTerritoryIncome(withStore);
    tickTerritoryIncome(without);
    expect(withStore["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"])
      .toBeGreaterThan(without["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"]);
  });
});

describe("Pháp lệnh có hiệu lực thật", () => {
  it("mọi pháp lệnh đều có đánh đổi, không cái nào chỉ toàn lợi", () => {
    for (const def of DECREE_CATALOG) {
      const e = def.effect;
      const gains =
        (e.taxMult ?? 1) > 1 || (e.tradeMult ?? 1) > 1 || (e.foodMult ?? 1) > 1 ||
        (e.miningMult ?? 1) > 1 || (e.loyaltyPerMonth ?? 0) > 0 ||
        (e.corveeShare ?? 0) > 0 || (e.craftLevyShare ?? 0) > 0 ||
        (e.rationing ?? 0) > 0 || (e.buildSpeed ?? 0) > 0;
      const costs =
        (e.taxMult ?? 1) < 1 || (e.tradeMult ?? 1) < 1 || (e.foodMult ?? 1) < 1 ||
        (e.miningMult ?? 1) < 1 || (e.loyaltyPerMonth ?? 0) < 0 ||
        !!def.cost || !!def.upkeep;
      expect(gains).toBe(true);
      expect(costs).toBe(true);
      expect(def.summary.length).toBeGreaterThan(8);
      expect(def.flavour.length).toBeGreaterThan(15);
    }
  });

  it("ban Thuế Nặng → thu Vàng lên, lòng dân xuống mỗi tháng", () => {
    let s = lordState();
    const goldBefore = estimateTerritoryYield(s["Lãnh Địa"][ID], ID)["Ngân Khố"];

    s = applyPatch(s, issueDecree(s, ID, "thue-nang").ops).state;
    expect(s["Lãnh Địa"][ID]["Pháp Lệnh"]["thue-nang"]["Mã"]).toBe("thue-nang");

    const after = estimateTerritoryYield(s["Lãnh Địa"][ID], ID);
    expect(after["Ngân Khố"]).toBeGreaterThan(goldBefore);
    expect(after["Lòng Dân"]).toBeLessThan(0);

    const loyalty0 = s["Lãnh Địa"][ID]["Lòng Dân"];
    tickTerritoryIncome(s);
    expect(s["Lãnh Địa"][ID]["Lòng Dân"]).toBeLessThan(loyalty0);
  });

  it("Lệnh Lao Dịch cấp thêm dân phu nhưng ruộng kém đi", () => {
    let s = lordState();
    const labour0 = availableLabour(s["Lãnh Địa"][ID])["Dân Phu"];
    const food0 = estimateTerritoryYield(s["Lãnh Địa"][ID], ID)["Lương Thực"];

    s = applyPatch(s, issueDecree(s, ID, "lao-dich").ops).state;
    expect(availableLabour(s["Lãnh Địa"][ID])["Dân Phu"]).toBeGreaterThan(labour0);
    expect(estimateTerritoryYield(s["Lãnh Địa"][ID], ID)["Lương Thực"]).toBeLessThan(food0);
  });

  it("Khẩu Phần Chiến Tranh giảm quân lương phải nuôi", () => {
    const base = lordState();
    const rationed = lordState();
    for (const st of [base, rationed]) {
      st["Biên Chế Quân Sự"]["Vệ Binh"] = {
        ...(st["Biên Chế Quân Sự"]["Vệ Binh"] ?? {}),
        "Số Lượng": 2000, "Loại Quân": "Bộ Binh", "Lãnh Địa Đồn Trú": ID,
      } as StatData["Biên Chế Quân Sự"][string];
    }
    const parsed = StatDataSchema.parse(rationed);
    const r = issueDecree(parsed, ID, "khau-phan");
    const withDecree = applyPatch(parsed, r.ops).state;

    tickTerritoryIncome(base);
    tickTerritoryIncome(withDecree);
    expect(withDecree["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"])
      .toBeGreaterThan(base["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"]);
  });

  it("Công Trường Cấp Tốc rút ngắn ngày thi công", () => {
    const plain = lordState();
    const rushed = applyPatch(lordState(), issueDecree(lordState(), ID, "cong-truong-gap").ops).state;
    const a = applyPatch(plain, startConstruction(plain, ID, "Tháp Canh").ops).state;
    const b = applyPatch(rushed, startConstruction(rushed, ID, "Tháp Canh").ops).state;
    expect(b["Lãnh Địa"][ID]["Công Trình"]["Tháp Canh"]["Ngày Xây Còn Lại"])
      .toBeLessThan(a["Lãnh Địa"][ID]["Công Trình"]["Tháp Canh"]["Ngày Xây Còn Lại"]);
  });

  it("bãi bỏ thì hệ số thôi áp; pháp lệnh ngoài danh mục không có hệ số", () => {
    let s = lordState();
    s = applyPatch(s, issueDecree(s, ID, "thue-nang").ops).state;
    expect(combineDecrees(s["Lãnh Địa"][ID]["Pháp Lệnh"]).taxMult).toBeCloseTo(1.5);

    s = applyPatch(s, revokeDecree(s, ID, "thue-nang")).state;
    expect(combineDecrees(s["Lãnh Địa"][ID]["Pháp Lệnh"]).taxMult).toBe(1);

    // chiếu chỉ do AI nghĩ ra: giữ để kể chuyện, engine không áp gì
    s["Lãnh Địa"][ID]["Pháp Lệnh"]["chieu-la"] = {
      "Tên": "Chiếu Chỉ Lạ", "Loại": "Luật", "Mã": "", "Trạng Thái": "Đang hiệu lực", "Hiệu Ứng": "AI tự nghĩ",
    };
    const eff = combineDecrees(s["Lãnh Địa"][ID]["Pháp Lệnh"]);
    expect(eff.taxMult).toBe(1);
    expect(eff.loyaltyPerMonth).toBe(0);
  });

  it("không phải chủ thì không ban được pháp lệnh", () => {
    const s = lordState();
    s["Lãnh Địa"][ID]["Người Kiểm Soát"] = "Eddard Stark";
    const r = issueDecree(s, ID, "thue-nang");
    expect(r.ok).toBe(false);
    expect(r.ops).toHaveLength(0);
  });

  it("ban trùng pháp lệnh đang hiệu lực thì bị chặn", () => {
    let s = lordState();
    s = applyPatch(s, issueDecree(s, ID, "khuyen-nong").ops).state;
    const again = issueDecree(s, ID, "khuyen-nong");
    expect(again.ok).toBe(false);
    expect(again.error).toContain(DECREE_BY_ID["khuyen-nong"].name);
  });

  it("thiếu chi phí thì không ban được", () => {
    const s = lordState();
    s["Thông Tin Nhân Vật"]["Ngân Khố"] = 0;
    s["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"] = 0;
    const r = issueDecree(s, ID, "le-hoi-mua-gat");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Thiếu");
  });
});
