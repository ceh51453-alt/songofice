import { afterEach, describe, expect, it } from "vitest";
import { appLayerMessages } from "./promptPipeline";
import { makeDefaultState } from "../mvu/schema";
import { useMvuStore } from "../state/mvuStore";
import { useExtraModelStore } from "../state/extraModelStore";
import { EXCHANGE_RATES } from "../economy/currency";
import { renderTablesForAI, sqlToPatchOps } from "../mvu/tableBridge";
import { parseSqlStatements } from "../mvu/sqlParser";

function stateWithTreasuryAndArmy() {
  const state = makeDefaultState();
  state["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = 5 * EXCHANGE_RATES.GOLD_TO_COPPER;
  state["Biên Chế Quân Sự"]["Vệ Binh Winterfell"] = {
    "Nhà": "Stark", "Số Lượng": 600, "Loại Quân": "Bộ Binh", "Ngạch": "Chính Quy",
    "Sĩ Khí": "Tốt", "Huấn Luyện": "Cơ Bản", "Kinh Nghiệm": 20, "Trang Bị": "Đủ Dùng",
    "Hậu Cần": "Đủ Dùng", "Lãnh Địa Đồn Trú": "the-north-seat", "Ngày Hành Quân Còn Lại": 0,
    "Ngày Huấn Luyện": 0, "Ngày Tập Hợp Còn Lại": 0, "Hạn Phục Dịch Còn Lại": 0,
    "Lương Thực Mang Theo": 30, "Thương Binh": 0,
  } as never;
  return state;
}

afterEach(() => {
  useExtraModelStore.setState({ stateEngine: "mvu-zod" });
  useMvuStore.setState({ stat: makeDefaultState() });
});

describe("AI state injection", () => {
  it("đưa quân đội và ngân khố theo đúng đơn vị vào prompt MVU mặc định", () => {
    useMvuStore.setState({ stat: stateWithTreasuryAndArmy() });
    useExtraModelStore.setState({ stateEngine: "mvu-zod" });

    const stateBlock = appLayerMessages().at(-1)?.content ?? "";

    expect(stateBlock).toContain("Quân đội dưới cờ ngươi: 600 người");
    expect(stateBlock).toContain("Vệ Binh Winterfell");
    expect(stateBlock).toContain("Ngân khố 5 Rồng Vàng");
    expect(stateBlock).toContain("Dự toán tháng này");
  });

  it("chế độ SQL vẫn nhận toàn bộ bối cảnh chiến lược, không chỉ các bảng SQL", () => {
    useMvuStore.setState({ stat: stateWithTreasuryAndArmy() });
    useExtraModelStore.setState({ stateEngine: "auto-database" });

    const stateBlock = appLayerMessages().at(-1)?.content ?? "";

    expect(stateBlock).toContain("CREATE TABLE nhan_vat_chinh");
    expect(stateBlock).toContain("BỐI CẢNH CHIẾN LƯỢC CHỈ ĐỌC");
    expect(stateBlock).toContain("Quân đội dưới cờ ngươi: 600 người");
    expect(stateBlock).toContain("Ngân khố 5 Rồng Vàng");
  });

  it("cột SQL vang đọc và ghi đúng vào Ngân Khố thay vì một trường không tồn tại", () => {
    const state = stateWithTreasuryAndArmy();
    const rendered = renderTablesForAI(state);
    const parsed = parseSqlStatements("UPDATE nhan_vat_chinh SET vang = vang + 11760 WHERE row_id = 1;");
    const ops = sqlToPatchOps(parsed[0], state);

    expect(rendered).toContain("58800");
    expect(ops).toEqual([
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: 11760 },
    ]);
  });

  it("đọc state mới nhất ở lượt sau thay vì phụ thuộc lịch sử chat cũ", () => {
    useMvuStore.setState({ stat: stateWithTreasuryAndArmy() });
    useMvuStore.getState().applyAiOps([
      { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: EXCHANGE_RATES.GOLD_TO_COPPER },
      { op: "replace", path: "stat_data.Biên Chế Quân Sự.Vệ Binh Winterfell.Số Lượng", value: 450 },
    ]);

    const stateBlock = appLayerMessages().at(-1)?.content ?? "";

    expect(stateBlock).toContain("Ngân khố 6 Rồng Vàng");
    expect(stateBlock).toContain("Quân đội dưới cờ ngươi: 450 người");
  });

  it("chèn engine thúc đẩy cốt truyện theo xuất thân vào mọi lượt kể", () => {
    const state = makeDefaultState();
    state["Cài Đặt Ván"]["_ID Xuất Thân"] = ["merchant"];
    state["Thông Tin Nhân Vật"]["Xuất Thân"] = "Thương Nhân Giàu";
    useMvuStore.setState({ stat: state });

    const storyBlock = appLayerMessages().find((message) => message.content.includes("ENGINE THÚC ĐẨY CỐT TRUYỆN"));
    expect(storyBlock?.content).toContain("sinh kế & tài nguyên");
    expect(storyBlock?.content).toContain("không đồng nghĩa “bắt đầu đánh nhau”");
  });

  it("chèn luật phân cấp để AI không nhập thành trì với lãnh thổ", () => {
    const block = appLayerMessages().find((message) => message.content.includes("PHÂN CẤP PHONG KIẾN"));
    expect(block?.content).toContain("Thành trì");
    expect(block?.content).toContain("Lãnh địa trực thuộc");
    expect(block?.content).toContain("Lãnh thổ");
    expect(block?.content).toContain("không tự động biến thành trì của chư hầu");
  });
});
