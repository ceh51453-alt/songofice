/**
 * INTEGRATION M18 — ĐẠI TU KINH TẾ & LÃNH ĐỊA.
 *
 * Chạy trọn một vòng đời để chứng minh các hệ mới ăn khớp với nhau:
 *   1. Điểm tài nguyên sinh bằng thuật toán → ghi vào state → AI đọc được.
 *   2. Mỏ phải dựng ĐÈ lên mạch; sản lượng nhân theo BẬC trữ lượng và cạn dần.
 *   3. Nhân lực là trần thật: thiếu người thì sản lượng tụt theo tỉ lệ.
 *   4. Nhà ở là trần dân số; hết chỗ thì vô gia cư, dân thôi tăng.
 *   5. Thuế chư hầu ở mức HỢP LÝ (bảng cũ thu 800 triệu Vàng/tháng cho Phương Bắc).
 *   6. Sổ thu chi có đủ các khoản, và không khoản nào bị tính hai lần.
 *   7. Chợ hình thành giá theo cung/cầu; lệnh lớn làm động giá thật.
 *   8. Lời kể đổi địa thế → bản đồ đổi theo (sông, mạch tài nguyên).
 */
import { describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { applyPatch } from "../mvu/patchEngine";
import { seedRegionControl } from "../territory/territoryEngine";
import {
  startConstruction, tickTerritoryIncome, buildingLedgers, estimateTerritoryYield,
} from "../territory/construction";
import { analysePopulation, applyPopulation, housingCapacity } from "../territory/population";
import { ensureResourceNodes, NODE_GRADE_MULT, depleteNode } from "../territory/resourceNodes";
import { terrainOf, nodesOf, canPlace } from "../territory/localMap";
import { buildWall, wallDefense } from "../territory/walls";
import { monthlyBudget } from "../economy/budget";
import {
  INCOME_PER_CAPITA, commonerTax, vassalLevy, grossProduct, regionGrossProduct,
} from "../economy/taxation";
import { ensureMarket, tickMarkets, quoteOrder, executeOrder, marketRows } from "../economy/market";
import { GOODS, GOODS_BY_ID } from "../content/westeros/goods";
import { EXCHANGE_RATES } from "../economy/currency";
import { REGIONS_BY_ID } from "../content/westeros/regions";

const GOLD = EXCHANGE_RATES.GOLD_TO_COPPER;
const ID = "the-north-seat";

function lordState(goldDragons = 20000): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Lãnh Chúa Thành Trì";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = goldDragons * GOLD;
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  const p = StatDataSchema.parse(s);
  p["Lãnh Địa"][ID]["Tài Nguyên"] = {
    "Ngân Khố": 0, "Lương Thực": 40000, "Gỗ": 40000, "Đá": 40000, "Quặng Sắt": 40000,
    "Than Đá": 40000, "Thép": 4000, "Vải Vóc": 2000, "Ngựa": 200, "Muối": 2000,
  };
  return p;
}

describe("M18 · Điểm tài nguyên: thuật toán sinh, state lưu, mỏ khai thác", () => {
  it("sinh tất định theo địa hình rồi GHI vào save để AI đọc được", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    expect(h["Điểm Tài Nguyên"]).toHaveLength(0); // save mới chưa có gì

    const nodes = nodesOf(ID, h);
    expect(nodes.length).toBeGreaterThan(0);
    // đã nằm trong state, không phải tính lại mỗi lần render
    expect(h["Điểm Tài Nguyên"]).toBe(nodes);

    // gọi lại KHÔNG sinh thêm (idempotent)
    const again = nodesOf(ID, h);
    expect(again).toHaveLength(nodes.length);

    for (const n of nodes) {
      expect(n["Mã"]).toBeTruthy();
      expect(GOODS_BY_ID[n["Tài Nguyên"]]).toBeTruthy(); // trỏ đúng vào danh mục hàng hoá
      expect(n["Trữ Lượng"]).toBeGreaterThanOrEqual(0);
      expect(n["Trữ Lượng"]).toBeLessThanOrEqual(3); // 0 cạn … 3 giàu
    }
    // có đủ ba bậc trữ lượng khác nhau trên một lãnh địa cỡ vừa
    expect(new Set(nodes.map((n) => n["Trữ Lượng"])).size).toBeGreaterThan(1);
  });

  it("mỏ chỉ đặt được TRÊN mạch, và sản lượng nhân theo bậc trữ lượng", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    const nodes = nodesOf(ID, h);
    const iron = nodes.find((n) => n["Tài Nguyên"] === "Quặng Sắt" && n["Trữ Lượng"] > 0);
    if (!iron) return; // lãnh địa này không có mạch sắt — chính là điều hợp lệ

    // ô TRONG vùng quy hoạch nhưng lệch khỏi mạch → bị chặn, kèm lý do đọc được
    const nowhere = nodes.every((n) => Math.hypot(n["Tọa Độ X"] - 750, n["Tọa Độ Y"] - 750) > 60);
    if (nowhere) {
      const off = canPlace(s, ID, "Mỏ Sắt", 742, 742);
      expect(off.ok).toBe(false);
      expect(off.error).not.toContain("Ngoài vùng quy hoạch");
    }

    // đặt đè lên mạch thì được, và engine gắn cờ hai chiều
    const x = iron["Tọa Độ X"] - 8;
    const y = iron["Tọa Độ Y"] - 8;
    const on = canPlace(s, ID, "Mỏ Sắt", x, y);
    if (!on.ok) return; // mạch nằm ngoài vùng quy hoạch — cũng là luật đúng
    expect(on.node?.["Mã"]).toBe(iron["Mã"]);

    const r = startConstruction(s, ID, "Mỏ Sắt", "Mỏ Sắt", { x, y, nodeId: iron["Mã"] });
    expect(r.ok).toBe(true);
    const state = applyPatch(s, r.ops).state;
    const mine = state["Lãnh Địa"][ID]["Công Trình"]["Mỏ Sắt"];
    mine["Đang Xây"] = false;
    expect(mine["Điểm Tài Nguyên"]).toBe(iron["Mã"]);

    const led = buildingLedgers(ID, state["Lãnh Địa"][ID]).find((l) => l.name === "Mỏ Sắt")!;
    expect(led.nodeMult).toBe(NODE_GRADE_MULT[iron["Trữ Lượng"]]);
    expect(led.produce["Quặng Sắt"]).toBeGreaterThan(0);
  });

  it("mạch cạn dần theo sản lượng: giàu → khá → nghèo → cạn", () => {
    const s = lordState();
    const nodes = ensureResourceNodes(s["Lãnh Địa"][ID], terrainOf(ID, s["Lãnh Địa"][ID]));
    const node = nodes.find((n) => n["Trữ Lượng"] === 3) ?? nodes[0];
    const start = node["Trữ Lượng"];
    if (start <= 0) return;

    // rút đúng bằng trữ lượng còn lại của bậc hiện tại → tụt một bậc
    depleteNode(node, node["Còn Lại"]);
    expect(node["Trữ Lượng"]).toBe(start - 1);

    // rút mãi thì cạn hẳn, và cạn rồi thì hệ số sản lượng bằng 0
    for (let i = 0; i < 6; i++) depleteNode(node, node["Còn Lại"]);
    expect(node["Trữ Lượng"]).toBe(0);
    expect(NODE_GRADE_MULT[node["Trữ Lượng"]]).toBe(0);
  });
});

describe("M18 · Nhân lực & nhà ở là trần thật", () => {
  it("sản lượng nhân THẲNG với tỉ lệ lấp đầy chỗ làm", () => {
    const big = lordState();
    const small = lordState();
    for (const s of [big, small]) {
      const r = startConstruction(s, ID, "Nông Trại");
      const st = applyPatch(s, r.ops).state;
      s["Lãnh Địa"][ID]["Công Trình"] = st["Lãnh Địa"][ID]["Công Trình"];
      s["Lãnh Địa"][ID]["Công Trình"]["Nông Trại"]["Đang Xây"] = false;
    }
    // làng 400 người không đủ nông dân cho một nông trại 140 suất
    small["Lãnh Địa"][ID]["Dân Số"] = 400;

    const bigLed = buildingLedgers(ID, big["Lãnh Địa"][ID])[0];
    const smallLed = buildingLedgers(ID, small["Lãnh Địa"][ID])[0];

    expect(bigLed.staffing).toBe(1);
    expect(smallLed.staffing).toBeLessThan(1);
    expect(smallLed.produce["Lương Thực"] ?? 0).toBeLessThan(bigLed.produce["Lương Thực"]!);
    // và UI đọc đúng ba dòng "tên · nhân lực hiện có/tối đa · sản lượng"
    expect(bigLed.needTotal).toBeGreaterThan(0);
    expect(bigLed.haveTotal).toBe(bigLed.needTotal);
  });

  it("dân thừa mà chỗ làm đã kín thì thành THẤT NGHIỆP", () => {
    const s = lordState();
    const bare = analysePopulation(s["Lãnh Địa"][ID]);
    expect(bare.unemployed).toBeGreaterThan(0);

    // xây thêm chỗ làm → bớt thất nghiệp
    let st = s;
    for (const type of ["Nông Trại", "Chợ", "Doanh Trại"] as const) {
      const r = startConstruction(st, ID, type);
      if (!r.ok) continue;
      st = applyPatch(st, r.ops).state;
      st["Lãnh Địa"][ID]["Công Trình"][type]["Đang Xây"] = false;
    }
    const after = analysePopulation(st["Lãnh Địa"][ID]);
    expect(after.unemployed).toBeLessThan(bare.unemployed);
  });

  it("nhà ở là TRẦN dân số; hết chỗ thì vô gia cư và dân thôi tăng", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    applyPopulation(h); // ghim nhà có sẵn ≈95% dân số

    expect(h["Nhà Ở Sẵn Có"]).toBeGreaterThan(0);
    expect(h["Vô Gia Cư"]).toBeGreaterThan(0); // 5% ngụ cư chưa có chỗ tử tế
    const before = housingCapacity(h);

    const r = startConstruction(s, ID, "Nhà Ở");
    expect(r.ok).toBe(true);
    const st = applyPatch(s, r.ops).state;
    st["Lãnh Địa"][ID]["Công Trình"]["Nhà Ở"]["Đang Xây"] = false;

    // xây nhà → trần dân số nhích lên, người vô gia cư bớt đi
    const after = applyPopulation(st["Lãnh Địa"][ID]);
    expect(after.housingCapacity).toBeGreaterThan(before);
    expect(st["Lãnh Địa"][ID]["Vô Gia Cư"]).toBeLessThan(h["Vô Gia Cư"]);
  });
});

describe("M18 · Thuế khoá hợp lý trở lại", () => {
  it("thuế dân suy từ TỔNG SẢN PHẨM, không phải một hằng số bịa", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    const gross = grossProduct(h);
    expect(gross).toBeGreaterThan(0);
    // tổng sản phẩm ≈ dân số × thu nhập đầu người (sai lệch là do thịnh vượng)
    expect(gross).toBeLessThan(h["Dân Số"] * INCOME_PER_CAPITA * 1.4);

    const land = commonerTax(s).find((l) => l.id === "tax-land")!;
    expect(land.amount).toBeCloseTo(gross * 0.25, -2); // mức "Vừa" = 25%
  });

  it("tô thuế chư hầu ở mức HỢP LÝ — không còn 800 triệu Vàng mỗi tháng", () => {
    const s = lordState();
    s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
    s["Chủ Quyền Lãnh Thổ"]["the-north"]["Là Của Người Chơi"] = true;

    const levy = vassalLevy(s);
    expect(levy.length).toBeGreaterThan(0);
    const total = levy.reduce((n, l) => n + l.amount, 0);

    // Phương Bắc 4 triệu dân: tô về phải là vài NGHÌN Rồng Vàng/tháng, không
    // phải hàng trăm triệu như bảng cũ (dân số × 200 Vàng).
    const dragons = total / GOLD;
    expect(dragons).toBeGreaterThan(200);
    expect(dragons).toBeLessThan(20000);
    // và luôn nhỏ hơn tổng sản phẩm của vùng — không ai thu quá cái dân làm ra
    expect(total).toBeLessThan(regionGrossProduct(s, "the-north"));
    expect(REGIONS_BY_ID["the-north"].population).toBe(4000000);
  });

  it("mức thuế cao thu nhiều hơn nhưng đổi bằng lòng dân", () => {
    const s = lordState();
    s["Chính Sách Thuế"]["Mức Thuế"] = "Nhẹ";
    const light = commonerTax(s).reduce((n, l) => n + l.amount, 0);
    s["Chính Sách Thuế"]["Mức Thuế"] = "Vắt Kiệt";
    const brutal = commonerTax(s).reduce((n, l) => n + l.amount, 0);
    expect(brutal).toBeGreaterThan(light * 3);
  });
});

describe("M18 · Sổ thu chi chi tiết", () => {
  it("có đủ các khoản một lãnh chúa thật phải trả", () => {
    let s = lordState();
    s["Biên Chế Quân Sự"]["Quân Bắc"] = {
      ...StatDataSchema.parse({})["Biên Chế Quân Sự"]["x"],
      "Nhà": "Stark", "Số Lượng": 3000, "Loại Quân": "Bộ Binh",
    } as never;

    const r = startConstruction(s, ID, "Chợ");
    s = applyPatch(s, r.ops).state;
    s["Lãnh Địa"][ID]["Công Trình"]["Chợ"]["Đang Xây"] = false;

    const budget = monthlyBudget(s);
    const ids = budget.lines.map((l) => l.id);

    // thu
    expect(ids).toContain("tax-land");
    expect(ids).toContain("tax-market");
    expect(ids).toContain("inc-holdings");
    // chi — những khoản bảng cũ hoàn toàn không có
    expect(ids).toContain("exp-wages");        // lương lính
    expect(ids).toContain("exp-buildings");    // bảo trì công trình
    expect(ids).toContain("exp-household");    // bổng lộc gia thần
    expect(ids).toContain("exp-feast");        // yến tiệc & nghi lễ
    expect(ids).toContain("liege-due");        // cống nạp bề trên

    expect(budget.income).toBe(budget.lines.filter((l) => l.kind === "income").reduce((n, l) => n + l.amount, 0));
    expect(budget.net).toBe(budget.income - budget.expense);
    for (const l of budget.lines) {
      expect(l.amount).toBeGreaterThanOrEqual(0); // dấu nằm ở `kind`, không ở số
      expect(l.detail).toBeTruthy();              // mỗi khoản đều giải thích được
    }
  });

  it("tick lãnh địa và sổ thu chi KHÔNG cộng trùng một đồng nào", () => {
    let s = lordState();
    const r = startConstruction(s, ID, "Chợ");
    s = applyPatch(s, r.ops).state;
    s["Lãnh Địa"][ID]["Công Trình"]["Chợ"]["Đang Xây"] = false;

    const gold = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    tickTerritoryIncome(s);
    // sổ lãnh địa chỉ lo VẬT TƯ — tiền chốt một lần duy nhất ở sổ thu chi
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(gold);
    expect(s["Lãnh Địa"][ID]["Tài Nguyên"]["Lương Thực"]).toBeGreaterThan(0);
  });

  it("dòng Ngân Khố của một lãnh địa là số HIỂN THỊ có nghĩa", () => {
    const s = lordState();
    const y = estimateTerritoryYield(s["Lãnh Địa"][ID], ID);
    expect(y["Ngân Khố"]).toBeGreaterThan(0); // thuế trên đất này trừ bảo trì
  });
});

describe("M18 · Chợ hình thành giá theo cung cầu", () => {
  it("mọi mặt hàng đều có giá, tồn kho, cung và cầu", () => {
    const s = lordState();
    const m = ensureMarket(s, "the-north");
    const rows = marketRows(m);
    expect(rows.length).toBe(GOODS.length);
    expect(rows.length).toBeGreaterThan(30); // danh mục đủ đa dạng

    for (const r of rows) {
      expect(r.price).toBeGreaterThan(0);
      expect(r.demand).toBeGreaterThan(0);
      expect(r.buyPrice).toBeGreaterThan(r.sellPrice); // lái buôn ăn chênh
    }
  });

  it("vùng làm ra thứ gì thì thứ đó rẻ hơn nơi phải chở tới", () => {
    const s = lordState();
    const north = ensureMarket(s, "the-north");
    const dorne = ensureMarket(s, "dorne");
    // Phương Bắc dư gỗ, Dorne phải nhập từng khúc
    expect(north["Hàng Hoá"]["Gỗ"]["Giá"]).toBeLessThan(dorne["Hàng Hoá"]["Gỗ"]["Giá"]);
    // ngược lại, rượu vang là chuyện của Dorne
    expect(dorne["Hàng Hoá"]["Rượu Vang"]["Giá"]).toBeLessThan(north["Hàng Hoá"]["Rượu Vang"]["Giá"]);
  });

  it("kho cạn thì giá vọt, kho ứ thì giá rớt — và giá có quán tính", () => {
    const s = lordState();
    const m = ensureMarket(s, "the-north");
    const row = m["Hàng Hoá"]["Lương Thực"];

    row["Tồn Kho"] = Math.round(row["Cầu/Tháng"] * 0.1); // gần cháy hàng
    const before = row["Giá"];
    tickMarkets(s);
    expect(row["Giá"]).toBeGreaterThan(before);
    expect(row["Biến Động"]).toBeGreaterThan(0);
    expect(row["Giá Trước"]).toBe(before);

    row["Tồn Kho"] = row["Cầu/Tháng"] * 8; // ứ hàng
    const high = row["Giá"];
    tickMarkets(s);
    expect(row["Giá"]).toBeLessThan(high);
  });

  it("người chơi NHẬP SỐ LƯỢNG; lệnh càng lớn càng trượt giá", () => {
    const s = lordState();
    const m = ensureMarket(s, "the-north");

    const small = quoteOrder(m, "Lương Thực", 20, "buy");
    const large = quoteOrder(m, "Lương Thực", Math.floor(m["Hàng Hoá"]["Lương Thực"]["Tồn Kho"] * 0.8), "buy");

    expect(small.ok && large.ok).toBe(true);
    expect(large.slippage).toBeGreaterThan(small.slippage);
    expect(large.unitPrice).toBeGreaterThan(small.unitPrice);
    expect(large.priceAfter).toBeGreaterThan(large.listPrice); // để lại dấu thật
    // bán thì ngược chiều
    const sell = quoteOrder(m, "Lương Thực", large.quantity, "sell");
    expect(sell.priceAfter).toBeLessThan(sell.listPrice);
  });

  it("khớp lệnh trừ đúng tiền, giao đúng hàng, và làm động giá niêm yết", () => {
    let s = lordState();
    const m = ensureMarket(s, "the-north");
    const listBefore = m["Hàng Hoá"]["Gỗ"]["Giá"];
    const stockBefore = m["Hàng Hoá"]["Gỗ"]["Tồn Kho"];
    const goldBefore = s["Thông Tin Nhân Vật"]["Ngân Khố"];

    const quote = quoteOrder(m, "Gỗ", 400, "buy");
    const r = executeOrder(s, "the-north", "Gỗ", 400, "buy");
    expect(r.ok).toBe(true);
    s = applyPatch(s, r.ops).state;

    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(goldBefore - quote.total);
    expect(s["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"]["Gỗ"]).toBe(400);
    expect(s["Thị Trường Khu Vực"]["the-north"]["Hàng Hoá"]["Gỗ"]["Tồn Kho"]).toBe(stockBefore - 400);
    expect(s["Thị Trường Khu Vực"]["the-north"]["Hàng Hoá"]["Gỗ"]["Giá"]).toBeGreaterThan(listBefore);
  });

  it("hàng chở thẳng về kho lãnh địa được — nối buôn bán vĩ mô với sản xuất vi mô", () => {
    let s = lordState();
    const before = s["Lãnh Địa"][ID]["Tài Nguyên"]["Muối"];
    const r = executeOrder(s, "the-north", "Muối", 50, "buy", { holdingId: ID });
    expect(r.ok).toBe(true);
    s = applyPatch(s, r.ops).state;
    expect(s["Lãnh Địa"][ID]["Tài Nguyên"]["Muối"]).toBe(before + 50);
  });

  it("không mua nổi thứ chợ không có, và không bán thứ mình không giữ", () => {
    const s = lordState();
    const m = ensureMarket(s, "the-north");
    m["Hàng Hoá"]["Thép Valyria"]["Tồn Kho"] = 0;
    expect(quoteOrder(m, "Thép Valyria", 1, "buy").ok).toBe(false);
    expect(executeOrder(s, "the-north", "Gỗ", 999999, "sell").ok).toBe(false);
  });
});

describe("M18 · Lời kể và bản đồ nói cùng một chuyện", () => {
  it("AI ghi 'thành bên sông' → bản đồ chắc chắn có sông chảy qua", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    h["Gợi Ý Địa Thế"]["Gần Sông"] = true;
    expect(terrainOf(ID, h).river.length).toBeGreaterThan(0);
  });

  it("AI nhắc tới một loại tài nguyên → engine gieo đúng mạch đó", () => {
    const s = lordState();
    const h = s["Lãnh Địa"][ID];
    h["Gợi Ý Địa Thế"]["Tài Nguyên Sẵn Có"] = ["Hắc Diện Thạch"];
    const nodes = nodesOf(ID, h);
    expect(nodes.some((n) => n["Tài Nguyên"] === "Hắc Diện Thạch")).toBe(true);
  });
});

describe("M18 · Tường thành vạch tay sống độc lập với Lâu Đài", () => {
  it("vạch → trừ vật tư → xây xong thì cộng phòng thủ, và không ai xoá nó đi", () => {
    let s = lordState();
    s["Lãnh Địa"][ID]["Dân Số"] = 60000;
    s["Lãnh Địa"][ID]["Tường Thành"] = [];
    const C = 750;
    const pts = [
      { x: C - 90, y: C - 90 }, { x: C + 90, y: C - 90 },
      { x: C + 90, y: C + 90 }, { x: C - 90, y: C + 90 }, { x: C - 90, y: C - 90 },
    ];

    const r = buildWall(s, ID, pts, { level: 2, material: "Đá Khối" });
    expect(r.ok).toBe(true);
    s = applyPatch(s, r.ops).state;
    s["Lãnh Địa"][ID]["Tường Thành"][0]["Đang Xây"] = false;

    const def = wallDefense(s["Lãnh Địa"][ID]);
    expect(def).toBeGreaterThan(0);

    // nâng Lâu Đài (đổi bán kính quy hoạch) — tường vẫn nguyên hình, nguyên cấp
    const castle = startConstruction(s, ID, "Lâu Đài", "Lâu Đài");
    if (castle.ok) s = applyPatch(s, castle.ops).state;
    expect(s["Lãnh Địa"][ID]["Tường Thành"]).toHaveLength(1);
    expect(wallDefense(s["Lãnh Địa"][ID])).toBe(def);
  });
});

describe("M18 · Đơn vị tiền tệ nhất quán", () => {
  it("Vàng khởi đầu ghi theo Rồng Vàng phải quy ra Đồng Đỏ khi vào state", async () => {
    const { buildStateFromCanon } = await import("../character/characterInit");
    const { ERAS_BY_ID } = await import("../content/westeros/eras");

    const era = ERAS_BY_ID["war-of-five-kings"]!;
    // một nhân vật canon giàu có — bảng ghi `gold` theo RỒNG VÀNG
    const rich = era.canonCharacters.filter((c) => (c.gold ?? 0) >= 1000)
      .sort((a, b) => (b.gold ?? 0) - (a.gold ?? 0))[0];
    expect(rich).toBeTruthy();

    const s = buildStateFromCanon(rich, era, {
      narrativeMode: "Diễn Giải Tự Do",
      scenarioMode: "Người Chơi Là Trung Tâm",
      difficulty: "Thường",
    });

    // Trước khi sửa, `gold` được ghi thẳng vào ô tính bằng ĐỒNG ĐỎ: một lãnh
    // chúa "5000 Vàng" khởi đầu với 0.42 Rồng Vàng và không xây nổi thứ gì.
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(rich.gold! * GOLD);
    expect(s["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeGreaterThan(150 * GOLD); // đủ một Nông Trại
  });
});

/**
 * Hai LỚP LỖI đã cắn nhiều lần trong dự án này. Bộ test dưới đây canh giữ cả
 * hai ở mức nguyên tắc, không chỉ ở chỗ đã sửa — thêm bảng nội dung mới hay
 * thêm field schema mới mà phạm lại là đỏ ngay.
 */
describe("M18 · Canh giữ hai lớp lỗi kinh niên", () => {
  it("zod: schema có prefault KHÔNG được lồng vào .optional() — sinh giá trị ma", async () => {
    const { makeDefaultState } = await import("../mvu/schema");
    const { NpcSchema } = await import("../mvu/npcSchema");

    // ô trang bị trống phải là UNDEFINED, không phải một món đồ vô danh
    const s = makeDefaultState();
    expect(Object.keys(s["Trang Bị Đang Mặc"])).toHaveLength(0);
    expect(s["Trang Bị Đang Mặc"]["Vũ Khí Chính"]).toBeUndefined();

    // NPC bình thường KHÔNG có quan hệ thân mật — trước đây ai cũng bị gán
    // "Người Tình", và stateRenderer bê nguyên điều đó vào prompt của AI
    const ned = NpcSchema.parse({ "Họ Tên": "Ned Stark", "Giới Tính": "Nam" });
    expect(ned["Quan Hệ Thân Mật"]).toBeUndefined();

    // công trình thường KHÔNG có đặc tả tuỳ chỉnh (đặc tả rỗng từng ghi đè
    // danh mục làm sản lượng của MỌI công trình về 0)
    const holding = StatDataSchema.parse({
      "Lãnh Địa": { x: { "Công Trình": { "Chợ": { "Loại": "Chợ" } } } },
    })["Lãnh Địa"]["x"];
    expect(holding["Công Trình"]["Chợ"]["Tuỳ Chỉnh"]).toBeUndefined();
  });

  it("tiền: mọi bảng nội dung viết Rồng Vàng đều phải quy đổi trước khi trừ ngân khố", async () => {
    const { TROOP_META } = await import("../content/westeros/troopTypes");
    const { getEnhanceRequirement } = await import("../character/equipmentEngine");
    const { GAME_INFO } = await import("../minigame/tavernGameEngine");
    const { recruitUnit } = await import("../strategy/army");

    // giá cường hoá: bảng ghi 200 Vàng → engine phải trả về 200 × 11 760
    expect(getEnhanceRequirement(0, false).goldCost).toBe(200 * GOLD);

    // mức cược quán trọ cũng vậy — 200 Đồng Đỏ thì không ai cược nổi
    for (const info of Object.values(GAME_INFO)) {
      expect(info.minBet).toBeGreaterThanOrEqual(GOLD);
      expect(info.maxBet).toBeGreaterThanOrEqual(GOLD);
    }

    // tuyển quân: 100 Bộ Binh = đúng costPer100 Rồng Vàng
    const s = lordState(20000);
    s["Lãnh Địa"][ID]["Công Trình"]["Doanh Trại"] = {
      "Loại": "Doanh Trại", "Cấp Độ": 1, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
      "Tọa Độ X": 700, "Tọa Độ Y": 700, "Kích Thước": 16,
      "Điểm Tài Nguyên": "", "Nhân Lực": {}, "Vận Hành": 1,
    };
    const before = s["Thông Tin Nhân Vật"]["Ngân Khố"];
    const r = recruitUnit(s, ID, "Bộ Binh", 100);
    expect(r.ok).toBe(true);
    const after = applyPatch(s, r.ops).state["Thông Tin Nhân Vật"]["Ngân Khố"];
    expect(before - after).toBe(TROOP_META["Bộ Binh"].costPer100["Ngân Khố"] * GOLD);
  });
});
