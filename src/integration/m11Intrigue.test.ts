/**
 * INTEGRATION M11 — chính trị & mưu đồ qua store + turn-advance:
 * - lãnh chúa → mở được Mưu Đồ (14.5),
 * - tuyển điệp viên → advanceDays: thu tin + Bị Nghi Ngờ tăng (14.1),
 * - điệp viên nghi ngờ cao → advanceDays đủ → bị bắt (14.1),
 * - âm mưu: khởi động → đẩy nhanh → Tiến Độ 100 → kích hoạt (14.2),
 * - con tin: đòi tiền chuộc → +Vàng + thả (14.4).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useMvuStore } from "../state/mvuStore";
import { useIntrigueStore } from "../state/intrigueStore";
import { makeDefaultState, StatDataSchema } from "../mvu/schema";
import { seedRegionControl } from "../territory/territoryEngine";
import { registerIntelligenceLoop, intrigueAvailable } from "../strategy/intrigue";

function advanceDays(n: number) {
  for (let i = 0; i < n; i++) useMvuStore.getState().applyAiOps([{ op: "delta", path: "stat_data.Thế Giới.Ngày", value: 1 }]);
}

beforeEach(() => {
  registerIntelligenceLoop();
  useMvuStore.getState().newGame();
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Petyr Baelish";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Không Nhà";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 5000;
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  // cho người chơi 1 vùng để mở được Mưu Đồ
  (s["Chủ Quyền Lãnh Thổ"] as Record<string, unknown>)["the-vale"] = { "Nhà Kiểm Soát": "arryn", "Là Của Người Chơi": true };
  useMvuStore.setState({ stat: StatDataSchema.parse(s), pendingEvents: [], lastChangedPaths: [] });
});

describe("M11 — mở Mưu Đồ + tình báo (14.1/14.5)", () => {
  it("cai trị → intrigueAvailable; tuyển điệp viên → thu tin + nghi ngờ tăng qua turn", () => {
    expect(intrigueAvailable(useMvuStore.getState().stat)).toBe(true);

    const r = useIntrigueStore.getState().recruitSpy("Con Nhện", "Lannister");
    expect(r.ok).toBe(true);
    expect(useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(4500);

    // đào sâu thâm nhập để thu tin ổn định, không bị bắt sớm
    const s = useMvuStore.getState().stat;
    s["Tình Báo"]["Điệp Viên"]["Con Nhện"]["Độ Sâu Thâm Nhập"] = 90;
    useMvuStore.setState({ stat: s });

    const susBefore = useMvuStore.getState().stat["Tình Báo"]["Điệp Viên"]["Con Nhện"]["Bị Nghi Ngờ"];
    advanceDays(15);
    const spy = useMvuStore.getState().stat["Tình Báo"]["Điệp Viên"]["Con Nhện"];
    expect(spy).toBeDefined();
    expect(spy["Bị Nghi Ngờ"]).toBeGreaterThan(susBefore);
    expect(Object.keys(useMvuStore.getState().stat["Tình Báo"]["Tin Tình Báo Đã Biết"]).length).toBeGreaterThan(0);
  });

  it("điệp viên nghi ngờ cao + nhiệm vụ rủi ro → advanceDays → bị bắt", () => {
    useIntrigueStore.getState().recruitSpy("Kẻ Vụng", "Tyrell");
    const s = useMvuStore.getState().stat;
    s["Tình Báo"]["Điệp Viên"]["Kẻ Vụng"]["Bị Nghi Ngờ"] = 90;
    s["Tình Báo"]["Điệp Viên"]["Kẻ Vụng"]["Nhiệm Vụ"] = "Phá Hoại";
    useMvuStore.setState({ stat: s });

    advanceDays(5);
    expect(useMvuStore.getState().stat["Tình Báo"]["Điệp Viên"]["Kẻ Vụng"]).toBeUndefined();
    expect(useMvuStore.getState().stat["Tình Báo"]["_Điệp Viên Vừa Lộ"]).toBe("Kẻ Vụng");
  });
});

describe("M11 — âm mưu (14.2)", () => {
  it("khởi động → đẩy nhanh nhiều lượt → Tiến Độ 100 → kích hoạt được", () => {
    const store = useIntrigueStore.getState();
    store.startPlot("Ván Cờ", { "Loại": "Vu Khống", "Mục Tiêu": "Cersei", "Đồng Mưu": [] });
    expect(useMvuStore.getState().stat["Âm Mưu"]["Ván Cờ"]).toBeDefined();

    for (let i = 0; i < 25 && useMvuStore.getState().stat["Âm Mưu"]["Ván Cờ"]["Tiến Độ"] < 100; i++) {
      store.advancePlot("Ván Cờ", 0);
    }
    expect(useMvuStore.getState().stat["Âm Mưu"]["Ván Cờ"]["Tiến Độ"]).toBe(100);

    const res = store.activatePlot("Ván Cờ");
    expect(res.ok).toBe(true);
    expect(useMvuStore.getState().stat["Âm Mưu"]["Ván Cờ"]).toBeUndefined(); // xoá sau kích hoạt
  });
});

describe("M11 — con tin (14.4)", () => {
  it("đòi tiền chuộc → +Vàng + thả", () => {
    const s = useMvuStore.getState().stat;
    s["Tù Binh"]["Ser Amory"] = { "Họ Tên": "Ser Amory Lorch", "Nhà": "Lannister", "Vai Trò": "Tướng", "Bị Bắt Bởi": "arryn", "Giá Chuộc": 2000, "Đối Xử": "Giam Lỏng", "_Ngày Bắt": 3 };
    useMvuStore.setState({ stat: s });

    const goldBefore = useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Ngân Khố"];
    useIntrigueStore.getState().ransomCaptive("Ser Amory");
    expect(useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(goldBefore + 2000);
    expect(useMvuStore.getState().stat["Tù Binh"]["Ser Amory"]).toBeUndefined();
  });
});
