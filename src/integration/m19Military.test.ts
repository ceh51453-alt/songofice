/**
 * Acceptance M19 — ĐẠI TU QUÂN SỰ, kiểm tra vòng khép kín INPUT/OUTPUT:
 *
 * 1. AI kể chuyện binh đao bằng THẺ → engine áp đúng luật (không đẻ quân từ hư không);
 * 2. bảng trạng thái render lại cho AI đọc (nếu không, AI vẫn mù về quân của mình);
 * 3. chợ lính chỉ mở ở nơi có chợ;
 * 4. rồng là một nguồn dữ liệu duy nhất cho cả hai bảng.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { useMvuStore } from "../state/mvuStore";
import { useMilitaryStore } from "../state/militaryStore";
import { findMilitaryTags } from "../ui/tags/parseNarrative";
import { renderStateForAI } from "../mvu/stateRenderer";
import { seedRegionControl } from "../territory/territoryEngine";
import { seedVassals } from "../strategy/muster";
import { seedSellswordMarket, addSellswordOffer, tickSellswords } from "../strategy/sellswords";
import { newDragon, playerDragons } from "../strategy/dragons";

function lordState(over: (s: StatData) => void = () => {}): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 5000 * 11760;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  s["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Doanh Trại"] = {
    "Loại": "Doanh Trại", "Cấp Độ": 2, "Đang Xây": false, "Ngày Xây Còn Lại": 0,
    "Tọa Độ X": 0, "Tọa Độ Y": 0, "Kích Thước": 1,
  } as never;
  s["Lãnh Địa"]["the-north-seat"]["Dân Số Chi Tiết"]["Nông Dân"] = 20000;
  const parsed = StatDataSchema.parse(s);
  seedVassals(parsed);
  over(parsed);
  return parsed;
}

beforeEach(() => {
  useMvuStore.setState({ stat: lordState(), pendingEvents: [], lastChangedPaths: [] });
});

describe("M19 — thẻ quân sự của AI đi qua đúng luật engine", () => {
  it("<recruit> tuyển được ở lãnh địa hợp lệ, TRỪ vàng và dân thật", () => {
    const before = useMvuStore.getState().stat;
    const goldBefore = before["Thông Tin Nhân Vật"]["Ngân Khố"];
    const popBefore = before["Lãnh Địa"]["the-north-seat"]["Dân Số"];

    const text = `Lãnh chúa cho gọi lính.
<recruit territory="the-north-seat" type="Bộ Binh" ngach="Chính Quy" count="500" commander="Ser Rodrik">
Tiếng trống dội khắp sân Winterfell.</recruit>`;
    const tags = findMilitaryTags(text);
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toBe("recruit");

    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("Tuyển 500");

    const after = useMvuStore.getState().stat;
    expect(after["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeLessThan(goldBefore);
    expect(after["Lãnh Địa"]["the-north-seat"]["Dân Số"]).toBe(popBefore - 500);
    const unit = Object.values(after["Biên Chế Quân Sự"])[0];
    expect(unit["Số Lượng"]).toBe(500);
    expect(unit["Ngạch"]).toBe("Chính Quy");
    expect(unit["Tướng Chỉ Huy"]).toBe("Ser Rodrik");
    expect(unit["Ngày Tập Hợp Còn Lại"]).toBeGreaterThan(0); // chưa đánh được ngay
  });

  it("<recruit> ở lãnh địa KHÔNG cai quản bị chặn — lời kể không đẻ ra quân", () => {
    const tags = findMilitaryTags(`<recruit territory="dorne" type="Bộ Binh" count="9000">Ta gọi quân Dorne.</recruit>`);
    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("thất bại");
    expect(Object.keys(useMvuStore.getState().stat["Biên Chế Quân Sự"])).toHaveLength(0);
  });

  it("<recruit> vượt sức tuyển của lãnh địa bị chặn", () => {
    const tags = findMilitaryTags(`<recruit territory="the-north-seat" type="Bộ Binh" count="999999">Vét sạch phương Bắc.</recruit>`);
    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("thất bại");
    expect(Object.keys(useMvuStore.getState().stat["Biên Chế Quân Sự"])).toHaveLength(0);
  });

  it("<banner_call> phất cờ → chư hầu hồi đáp (có nhà đi, có nhà từ chối)", () => {
    const tags = findMilitaryTags(`<banner_call region="the-north">Quạ bay khắp phương Bắc.</banner_call>`);
    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("Hiệu triệu");

    const vassals = Object.values(useMvuStore.getState().stat["Chư Hầu"]);
    const answered = vassals.filter((v) => v["Trạng Thái"] !== "Ở Nhà");
    expect(answered.length).toBeGreaterThan(0);
  });

  it("<sellsword_offer> dẫn một đoàn tới → hiện trong chợ lính để người chơi tự quyết", () => {
    const tags = findMilitaryTags(
      `<sellsword_offer company="Đoàn Nhị Tử" location="White Harbor" size="800" quality="Thành Thạo">Gã đoàn trưởng nhổ nước bọt.</sellsword_offer>`,
    );
    useMilitaryStore.getState().applyMilitaryTags(tags);
    const co = useMvuStore.getState().stat["Đội Đánh Thuê"]["Đoàn Nhị Tử"];
    expect(co).toBeDefined();
    expect(co["Quân Số"]).toBe(800);
    expect(co["Tiền Ký Khế Ước"]).toBeGreaterThan(0);
  });

  it("<army_order action=march> điều quân — mất NGÀY, không tới nơi ngay", () => {
    useMvuStore.setState({
      stat: lordState((s) => {
        s["Biên Chế Quân Sự"]["Đại Quân Bắc"] = {
          "Tướng Chỉ Huy": "Robb", "Nhà": "Stark", "Số Lượng": 8000, "Loại Quân": "Bộ Binh",
          "Thành Phần": {}, "Hậu Cần": "Dồi Dào", "Sĩ Khí": "Hăng Hái", "Trang Bị": "Đồng Bộ Chỉnh Tề",
          "Huấn Luyện": "Thành Thạo", "Lãnh Địa Đồn Trú": "the-north-seat", "Ngày Hành Quân Còn Lại": 0,
          "Ngày Huấn Luyện": 0, "Ngạch": "Chính Quy", "Kinh Nghiệm": 40, "Số Trận Đã Đánh": 0,
          "Thương Binh": 0, "Ngày Tập Hợp Còn Lại": 0, "Hạn Phục Dịch Còn Lại": 0,
          "Lương Thực Mang Theo": 30, "Thuộc Chư Hầu": "", "Ghi Chú": "",
        } as never;
      }),
      pendingEvents: [], lastChangedPaths: [],
    });

    const tags = findMilitaryTags(`<army_order unit="Đại Quân Bắc" action="march" target="the-riverlands">Nam tiến.</army_order>`);
    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("hành quân");
    const u = useMvuStore.getState().stat["Biên Chế Quân Sự"]["Đại Quân Bắc"];
    expect(u["Đang Di Chuyển Đến"]).toBe("the-riverlands");
    expect(u["Ngày Hành Quân Còn Lại"]).toBeGreaterThan(0);
  });

  it("<dragon_order action=fly> điều rồng — rồng của ta, không phải đơn vị bộ binh", () => {
    useMvuStore.setState({
      stat: lordState((s) => {
        s["Rồng"]["Balerion"] = newDragon({
          "Tên": "Balerion", "Kích Cỡ": "Khổng Lồ (Balerion-class)", "Kỵ Sĩ": "Eddard Stark",
          "Nhà": "stark", "Trạng Thái Thu Phục": "Đã Có Chủ", "Mức Độ Thuần Hóa": 90,
          "Đồn Trú": "the-north-seat",
        });
      }),
      pendingEvents: [], lastChangedPaths: [],
    });

    const tags = findMilitaryTags(`<dragon_order dragon="Balerion" action="fly" target="the-riverlands">Cánh đen che kín trời.</dragon_order>`);
    const notes = useMilitaryStore.getState().applyMilitaryTags(tags);
    expect(notes[0]).toContain("bay tới");
    const d = useMvuStore.getState().stat["Rồng"]["Balerion"];
    expect(d["Đang Bay Đến"]).toBe("the-riverlands");
    expect(d["Ngày Bay Còn Lại"]).toBeGreaterThan(0);
    // rồng KHÔNG nằm trong biên chế bộ binh
    expect(Object.keys(useMvuStore.getState().stat["Biên Chế Quân Sự"])).toHaveLength(0);
  });
});

describe("M19 — AI ĐỌC được quân của mình (bảng trạng thái)", () => {
  it("render khối quân đội: ngạch, hạn nghĩa vụ, hậu cần, chư hầu", () => {
    const s = lordState((st) => {
      st["Biên Chế Quân Sự"]["Dân Binh Winterfell"] = {
        "Tướng Chỉ Huy": "Tạm Khuyết", "Nhà": "Stark", "Số Lượng": 1200, "Loại Quân": "Dân Binh",
        "Thành Phần": {}, "Hậu Cần": "Cầm Cự Được", "Sĩ Khí": "Dao Động", "Trang Bị": "Thô Sơ",
        "Huấn Luyện": "Rời Rạc", "Lãnh Địa Đồn Trú": "the-north-seat", "Ngày Hành Quân Còn Lại": 0,
        "Ngày Huấn Luyện": 0, "Ngạch": "Phục Dịch", "Kinh Nghiệm": 5, "Số Trận Đã Đánh": 0,
        "Thương Binh": 40, "Ngày Tập Hợp Còn Lại": 0, "Hạn Phục Dịch Còn Lại": 10,
        "Lương Thực Mang Theo": 30, "Thuộc Chư Hầu": "", "Ghi Chú": "",
      } as never;
    });
    const text = renderStateForAI(s);
    expect(text).toContain("Quân đội dưới cờ ngươi");
    expect(text).toContain("Dân Binh Winterfell");
    expect(text).toContain("Phục Dịch");
    expect(text).toContain("SẮP HẾT HẠN NGHĨA VỤ");
    expect(text).toContain("thương binh nằm trại");
    expect(text).toContain("Chư hầu");
  });

  it("không có quân → nói thẳng để AI đừng bịa ra đại quân", () => {
    const text = renderStateForAI(lordState());
    expect(text).toContain("KHÔNG CÓ đơn vị nào");
  });

  it("render rồng kèm vị trí, cơn đói, kinh nghiệm", () => {
    const s = lordState((st) => {
      st["Rồng"]["Balerion"] = newDragon({
        "Tên": "Balerion", "Kích Cỡ": "Khổng Lồ (Balerion-class)", "Kỵ Sĩ": "Eddard Stark",
        "Nhà": "stark", "Đồn Trú": "the-north-seat", "Độ Đói": 85,
      });
    });
    const text = renderStateForAI(s);
    expect(text).toContain("Balerion");
    expect(text).toContain("ĐÓI CỒN CÀO");
    expect(text).toContain("sải cánh");
  });
});

describe("M19 — chợ lính chỉ mở ở nơi có chợ", () => {
  it("đứng giữa phương Bắc: không đoàn nào; ở Braavos: có đoàn chào giá", () => {
    const wilderness = lordState((s) => { s["Thế Giới"]["Vị Trí"] = "Winterfell"; });
    expect(seedSellswordMarket(wilderness)).toBe(0);
    expect(Object.keys(wilderness["Đội Đánh Thuê"])).toHaveLength(0);

    const braavos = lordState((s) => { s["Thế Giới"]["Vị Trí"] = "Braavos"; });
    seedSellswordMarket(braavos);
    expect(Object.keys(braavos["Đội Đánh Thuê"]).length).toBeGreaterThan(0);
  });

  it("đoàn hết hạn nán lại thì nhổ trại — cơ hội thuê không chờ ai", () => {
    const s = lordState();
    addSellswordOffer(s, { company: "Đoàn Vô Danh", location: "Trại ngoài thành", size: "300" });
    expect(s["Đội Đánh Thuê"]["Đoàn Vô Danh"]).toBeDefined();
    for (let i = 0; i < 31; i++) tickSellswords(s);
    expect(s["Đội Đánh Thuê"]["Đoàn Vô Danh"]).toBeUndefined();
  });
});

describe("M19 — rồng: một nguồn dữ liệu cho cả hai bảng", () => {
  it("bảng Quân Sự và thanh trạng thái cùng đọc playerDragons()", () => {
    const s = lordState((st) => {
      st["Rồng"]["Balerion"] = newDragon({
        "Tên": "Balerion", "Kỵ Sĩ": "Eddard Stark", "Nhà": "stark", "Trạng Thái Thu Phục": "Đã Có Chủ",
      });
    });
    const list = playerDragons(s);
    expect(list).toHaveLength(1);
    // và KHÔNG có bản sao nào trong biên chế bộ binh
    expect(Object.values(s["Biên Chế Quân Sự"]).some((u) => u["Loại Quân"] === "Rồng")).toBe(false);
  });
});
