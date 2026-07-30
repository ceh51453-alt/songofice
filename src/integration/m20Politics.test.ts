/**
 * Acceptance M20 — NGOẠI GIAO & MƯU ĐỒ chạy HOÀN TOÀN bằng input/output:
 *
 * 1. mọi thẻ AI đi qua đúng luật engine (không có nút bấm nào nữa);
 * 2. bảng trạng thái render lại đủ để AI biết mình đang nắm gì;
 * 3. bí mật có sức nặng thật (đòn bẩy quyết định tống tiền được hay không);
 * 4. âm mưu tự chín theo NGÀY và tự vỡ khi quá nhiều miệng biết chuyện.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { makeDefaultState, StatDataSchema, type StatData } from "../mvu/schema";
import { useMvuStore } from "../state/mvuStore";
import { useDiplomacyStore } from "../state/diplomacyStore";
import { useIntrigueStore } from "../state/intrigueStore";
import { findDiplomacyTags, findIntrigueTags } from "../ui/tags/parseNarrative";
import { renderStateForAI } from "../mvu/stateRenderer";
import { secretLeverage, tickPlots, tickSpyCover, startPlotFullOps } from "../strategy/intrigue";
import { grievanceAgainstUs, casusBelli } from "../strategy/diplomacy";
import { applyPatch } from "../mvu/patchEngine";

function lordState(): StatData {
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Eddard Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 500000;
  s["Chỉ Số Cốt Lõi"]["Trí Tuệ"] = 14;
  return StatDataSchema.parse(s);
}

beforeEach(() => {
  useMvuStore.setState({ stat: lordState(), pendingEvents: [], lastChangedPaths: [] });
});

const stat = () => useMvuStore.getState().stat;

describe("M20 — thẻ NGOẠI GIAO của AI đi qua đúng luật engine", () => {
  it("<diplomacy> đổi trạng thái pháp lý", () => {
    const tags = findDiplomacyTags(
      `<diplomacy house="lannister" status="Chiến Tranh" reason="Chúng bắt giữ em ta">Ngươi xé thư trước mặt sứ giả.</diplomacy>`,
    );
    expect(tags).toHaveLength(1);
    const notes = useDiplomacyStore.getState().applyDiplomacyTags(tags);
    expect(notes[0]).toContain("Chiến Tranh");
    expect(stat()["Quan Hệ Ngoại Giao"]["lannister"]["Trạng Thái"]).toBe("Chiến Tranh");
  });

  it("<diplomacy truce_days> đình chiến có kỳ hạn", () => {
    useDiplomacyStore.getState().applyDiplomacyTags(
      findDiplomacyTags(`<diplomacy house="greyjoy" truce_days="90" terms="ngừng binh tới hết mùa gặt">…</diplomacy>`),
    );
    const r = stat()["Quan Hệ Ngoại Giao"]["greyjoy"];
    expect(r["Trạng Thái"]).toBe("Đình Chiến");
    expect(r["Ngày Hết Hạn Đình Chiến"]).toBeGreaterThan(0);
    expect(r["Hiệp Ước"].some((t) => t["Loại"] === "Đình Chiến")).toBe(true);
  });

  it("<treaty action=sign> ký hiệp ước có cống nạp; <treaty action=break> xé và mất uy tín", () => {
    const store = useDiplomacyStore.getState();
    store.applyDiplomacyTags(findDiplomacyTags(
      `<treaty house="karstark" action="sign" type="Triều Cống" years="10" tribute="8000" terms="mỗi tháng tám ngàn đồng">Lễ ký ở đại điện.</treaty>`,
    ));
    const signed = stat()["Quan Hệ Ngoại Giao"]["karstark"]["Hiệp Ước"][0];
    expect(signed["Loại"]).toBe("Triều Cống");
    expect(signed["Cống Nạp Tháng"]).toBe(8000);

    const credBefore = stat()["Ngoại Giao"]["Uy Tín Cam Kết"];
    store.applyDiplomacyTags(findDiplomacyTags(
      `<treaty house="karstark" action="break" reason="Ta cần đất của chúng">Ngươi ném tờ giấy vào lò.</treaty>`,
    ));
    expect(stat()["Quan Hệ Ngoại Giao"]["karstark"]["Hiệp Ước"][0]["Còn Hiệu Lực"]).toBe(false);
    expect(stat()["Ngoại Giao"]["Uy Tín Cam Kết"]).toBeLessThan(credBefore);
    expect(grievanceAgainstUs(stat(), "karstark")).toBeGreaterThan(0);
  });

  it("<envoy> cử sứ — mất ngày đi đường, không xong ngay", () => {
    useDiplomacyStore.getState().applyDiplomacyTags(findDiplomacyTags(
      `<envoy name="Học sĩ Luwin" house="tully" mission="Cầu Hoà" days="18">Quạ mang thư đi trước.</envoy>`,
    ));
    const e = stat()["Ngoại Giao"]["Sứ Giả"]["Học sĩ Luwin"];
    expect(e["Trạng Thái"]).toBe("Đang Đi");
    expect(e["Ngày Còn Lại"]).toBe(18);
  });

  it("<grievance> ghi cớ đúng chiều", () => {
    const store = useDiplomacyStore.getState();
    store.applyDiplomacyTags(findDiplomacyTags(
      `<grievance house="frey" deed="Huyết hôn: giết khách dưới mái nhà" weight="95" side="them">…</grievance>`,
    ));
    store.applyDiplomacyTags(findDiplomacyTags(
      `<grievance house="bolton" deed="Ta treo cổ sứ giả của chúng" weight="40" side="us">…</grievance>`,
    ));
    expect(casusBelli(stat(), "frey")).toBe(95);
    expect(grievanceAgainstUs(stat(), "bolton")).toBe(40);
  });

  it("<offer> đặt lên bàn rồi nhận — người chơi trả lời bằng LỜI, không có nút", () => {
    const store = useDiplomacyStore.getState();
    store.applyDiplomacyTags(findDiplomacyTags(
      `<offer action="propose" key="tyrell-hon-uoc" house="tyrell" type="Hôn Ước" years="0" deadline_days="30" bearer="Ser Loras">Gả Margaery cho con trai ngươi.</offer>`,
    ));
    expect(stat()["Ngoại Giao"]["Lời Đề Nghị"]["tyrell-hon-uoc"]).toBeDefined();

    store.applyDiplomacyTags(findDiplomacyTags(`<offer action="accept" key="tyrell-hon-uoc">Ngươi nâng chén.</offer>`));
    expect(stat()["Ngoại Giao"]["Lời Đề Nghị"]["tyrell-hon-uoc"]).toBeUndefined();
    expect(stat()["Quan Hệ Ngoại Giao"]["tyrell"]["Hiệp Ước"].some((t) => t["Loại"] === "Hôn Ước")).toBe(true);
  });
});

describe("M20 — thẻ MƯU ĐỒ của AI đi qua đúng luật engine", () => {
  it("<spy action=plant> cài tai mắt có hạng + vỏ bọc, trừ vàng", () => {
    const goldBefore = stat()["Thông Tin Nhân Vật"]["Ngân Khố"];
    const notes = useIntrigueStore.getState().applyIntrigueTags(findIntrigueTags(
      `<spy alias="Con Nhện" action="plant" target="Triều đình Vương Đô" kind="Chim Nhỏ" mission="Thu Thập Tin" handler="Varys">Một đứa bé không lưỡi.</spy>`,
    ));
    expect(notes[0]).toContain("Cài Con Nhện");
    const spy = stat()["Tình Báo"]["Điệp Viên"]["Con Nhện"];
    expect(spy["Hạng"]).toBe("Chim Nhỏ");
    expect(spy["Vỏ Bọc"]).toBe(70);
    expect(spy["Người Điều Khiển"]).toBe("Varys");
    expect(stat()["Thông Tin Nhân Vật"]["Ngân Khố"]).toBeLessThan(goldBefore);
  });

  it("<secret> ghi bí mật — NỘI DUNG do AI viết, đòn bẩy do engine tính", () => {
    useIntrigueStore.getState().applyIntrigueTags(findIntrigueTags(
      `<secret about="Cersei Lannister" topic="loan-luan" weight="95" credibility="80" source="Con Nhện">Các con của Cersei là con của Jaime.</secret>`,
    ));
    const s = stat()["Tình Báo"]["Bí Mật"]["loan-luan"];
    expect(s["Nội Dung"]).toContain("Jaime");
    expect(s["Về Ai"]).toBe("Cersei Lannister");
    expect(secretLeverage(s)).toBeGreaterThan(60);
    // bảng cũ vẫn được đồng bộ để code/lore đọc "Tin Tình Báo Đã Biết" không vỡ
    expect(stat()["Tình Báo"]["Tin Tình Báo Đã Biết"]["loan-luan"]).toContain("Jaime");
  });

  it("bí mật NẶNG dễ tống tiền hơn tin vặt (đòn bẩy hạ độ khó)", () => {
    const store = useIntrigueStore.getState();
    store.applyIntrigueTags(findIntrigueTags(
      `<secret about="Ser X" topic="nang" weight="95" credibility="90">Hắn giết cha mình.</secret>`,
    ));
    store.applyIntrigueTags(findIntrigueTags(
      `<secret about="Ser X" topic="vat" weight="10" credibility="20">Hắn nợ tiền quán rượu.</secret>`,
    ));
    const heavy = secretLeverage(stat()["Tình Báo"]["Bí Mật"]["nang"]);
    const light = secretLeverage(stat()["Tình Báo"]["Bí Mật"]["vat"]);
    expect(heavy).toBeGreaterThan(light * 3);
  });

  it("<enemy_spy> phản gián: bắt khi thiếu chứng cứ là bắt oan", () => {
    const store = useIntrigueStore.getState();
    store.applyIntrigueTags(findIntrigueTags(
      `<enemy_spy suspect="Ả hầu gái" action="note" house="lannister" evidence="20" watching="thư phòng">Ả hay lảng vảng.</enemy_spy>`,
    ));
    expect(stat()["Tình Báo"]["Điệp Viên Địch"]["Ả hầu gái"]).toBeDefined();

    const mercyBefore = stat()["Danh Vọng"]["Nhân Từ"];
    store.applyIntrigueTags(findIntrigueTags(`<enemy_spy suspect="Ả hầu gái" action="seize">Lính kéo ả đi.</enemy_spy>`));
    expect(stat()["Tình Báo"]["Điệp Viên Địch"]["Ả hầu gái"]).toBeUndefined();
    expect(stat()["Danh Vọng"]["Nhân Từ"]).toBeLessThan(mercyBefore); // bắt oan thì mất tiếng
  });

  it("<plot action=start> rồi <plot action=fund> — vốn để lại dấu vết tiền", () => {
    const store = useIntrigueStore.getState();
    store.applyIntrigueTags(findIntrigueTags(
      `<plot name="Đêm Máu" action="start" type="Ám Sát" target="Petyr Baelish" allies="Jory Cassel, Ser Rodrik" stake="Bị coi là kẻ giết người trong đêm">Ngươi thì thầm trong hầm.</plot>`,
    ));
    const p0 = stat()["Âm Mưu"]["Đêm Máu"];
    expect(p0["Giai Đoạn"]).toBe("Ấp Ủ");
    expect(p0["Đồng Mưu"]).toHaveLength(2);
    expect(p0["Hậu Quả Nếu Lộ"]).toContain("giết người");

    const exposureBefore = stat()["Âm Mưu"]["Đêm Máu"]["Độ Bại Lộ"];
    store.applyIntrigueTags(findIntrigueTags(`<plot name="Đêm Máu" action="fund" gold="150000">Túi vàng đổi tay.</plot>`));
    expect(stat()["Âm Mưu"]["Đêm Máu"]["Vốn Đã Bỏ"]).toBe(150000);
    expect(stat()["Âm Mưu"]["Đêm Máu"]["Độ Bại Lộ"]).toBeGreaterThan(exposureBefore);
  });

  it("<plot action=investigate> — có kẻ lần theo dấu thì bại lộ nhảy lên", () => {
    const store = useIntrigueStore.getState();
    store.applyIntrigueTags(findIntrigueTags(`<plot name="Vu Khống" action="start" type="Vu Khống" target="Renly">…</plot>`));
    store.applyIntrigueTags(findIntrigueTags(`<plot name="Vu Khống" action="investigate" who="Varys">Con nhện đã nghe được gì đó.</plot>`));
    const p = stat()["Âm Mưu"]["Vu Khống"];
    expect(p["Kẻ Điều Tra"]).toBe("Varys");
    expect(p["Độ Bại Lộ"]).toBeGreaterThanOrEqual(10);
  });

  it("<captive action=ransom> — cộng vàng, thả người", () => {
    const withCaptive = applyPatch(stat(), [{
      op: "replace", path: "stat_data.Tù Binh.Ser Amory",
      value: { "Họ Tên": "Ser Amory Lorch", "Nhà": "lannister", "Vai Trò": "Tướng", "Giá Chuộc": 20000, "Đối Xử": "Giam Lỏng" },
    }]).state;
    useMvuStore.setState({ stat: withCaptive });

    const goldBefore = stat()["Thông Tin Nhân Vật"]["Ngân Khố"];
    useIntrigueStore.getState().applyIntrigueTags(findIntrigueTags(
      `<captive name="Ser Amory" action="ransom">Vàng của nhà Lannister tới trước bình minh.</captive>`,
    ));
    expect(stat()["Tù Binh"]["Ser Amory"]).toBeUndefined();
    expect(stat()["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(goldBefore + 20000);
  });
});

describe("M20 — âm mưu tự chín và tự vỡ theo NGÀY (không cần nút Đẩy nhanh)", () => {
  it("tiến độ bò lên theo ngày mà không ai bấm gì", () => {
    const s = lordState();
    const next = applyPatch(s, startPlotFullOps(s, "Ván Cờ", { type: "Ly Gián", target: "Renly" })).state;
    expect(next["Âm Mưu"]["Ván Cờ"]["Tiến Độ"]).toBe(0);
    for (let i = 0; i < 20; i++) tickPlots(next);
    expect(next["Âm Mưu"]["Ván Cờ"]["Tiến Độ"]).toBeGreaterThan(0);
    expect(next["Âm Mưu"]["Ván Cờ"]["Giai Đoạn"]).toBeTruthy();
  });

  it("càng nhiều đồng mưu càng nhanh — nhưng càng dễ vỡ", () => {
    const solo = lordState();
    const crowd = lordState();
    const a = applyPatch(solo, startPlotFullOps(solo, "Một Mình", { type: "Ám Sát", target: "X" })).state;
    const b = applyPatch(crowd, startPlotFullOps(crowd, "Cả Đám", {
      type: "Ám Sát", target: "X", allies: ["A", "B", "C", "D", "E"],
    })).state;
    for (let i = 0; i < 30; i++) { tickPlots(a); tickPlots(b); }
    expect(b["Âm Mưu"]["Cả Đám"]["Tiến Độ"]).toBeGreaterThan(a["Âm Mưu"]["Một Mình"]["Tiến Độ"]);
    expect(b["Âm Mưu"]["Cả Đám"]["Độ Bại Lộ"]).toBeGreaterThan(a["Âm Mưu"]["Một Mình"]["Độ Bại Lộ"]);
  });

  it("bại lộ đạt 100 → âm mưu VỠ, ghi cờ cho AI kể phản đòn", () => {
    const s = lordState();
    const next = applyPatch(s, startPlotFullOps(s, "Sẽ Vỡ", {
      type: "Đảo Chính", target: "Nhà Vua", allies: ["A", "B", "C", "D", "E", "F"],
      stake: "Cả nhà ta lên đoạn đầu đài",
    })).state;
    for (let i = 0; i < 400; i++) tickPlots(next);
    expect(next["Âm Mưu"]["Sẽ Vỡ"]).toBeUndefined();
    expect(next["Tình Báo"]["_Âm Mưu Vừa Vỡ"]).toContain("Sẽ Vỡ");
    expect(next["Tình Báo"]["_Âm Mưu Vừa Vỡ"]).toContain("đoạn đầu đài");
  });

  it("vỏ bọc mòn theo việc bẩn; Nằm Vùng thì vá lại", () => {
    const s = lordState();
    const next = applyPatch(s, [
      { op: "replace", path: "stat_data.Tình Báo.Điệp Viên.Kẻ Phá", value: { "Cài Ở": "X", "Nhiệm Vụ": "Phá Hoại", "Vỏ Bọc": 70 } },
      { op: "replace", path: "stat_data.Tình Báo.Điệp Viên.Kẻ Ẩn", value: { "Cài Ở": "X", "Nhiệm Vụ": "Nằm Vùng", "Vỏ Bọc": 70 } },
    ]).state;
    for (let i = 0; i < 20; i++) tickSpyCover(next);
    expect(next["Tình Báo"]["Điệp Viên"]["Kẻ Phá"]["Vỏ Bọc"]).toBeLessThan(70);
    expect(next["Tình Báo"]["Điệp Viên"]["Kẻ Ẩn"]["Vỏ Bọc"]).toBeGreaterThan(70);
  });
});

describe("M20 — AI ĐỌC được bàn cờ chính trị (bảng trạng thái)", () => {
  it("render ngoại giao: trạng thái, hiệp ước, cớ hai bên, uy tín cam kết", () => {
    const store = useDiplomacyStore.getState();
    store.applyDiplomacyTags(findDiplomacyTags(`<diplomacy house="lannister" status="Chiến Tranh" reason="máu chưa trả">…</diplomacy>`));
    store.applyDiplomacyTags(findDiplomacyTags(`<treaty house="tully" action="sign" type="Liên Minh Quân Sự" years="5" terms="cùng chống Lannister">…</treaty>`));
    store.applyDiplomacyTags(findDiplomacyTags(`<grievance house="lannister" deed="Chúng giết cha ta" weight="90" side="them">…</grievance>`));
    store.applyDiplomacyTags(findDiplomacyTags(`<offer action="propose" key="k1" house="martell" type="Hoà Ước" deadline_days="20">Dorne muốn hoà.</offer>`));

    const text = renderStateForAI(stat());
    expect(text).toContain("uy tín cam kết");
    expect(text).toContain("Chiến Tranh");
    expect(text).toContain("Liên Minh Quân Sự");
    expect(text).toContain("TA CÓ CỚ");
    expect(text).toContain("ĐANG CHỜ NGƯỜI CHƠI TRẢ LỜI");
  });

  it("render mưu đồ: vỏ bọc, sổ bí mật, giai đoạn âm mưu, kẻ điều tra", () => {
    const store = useIntrigueStore.getState();
    store.applyIntrigueTags(findIntrigueTags(`<spy alias="Con Nhện" action="plant" target="Vương Đô" kind="Chim Nhỏ">…</spy>`));
    store.applyIntrigueTags(findIntrigueTags(`<secret about="Cersei" topic="bi-mat-lon" weight="90" credibility="85">Con của Jaime.</secret>`));
    store.applyIntrigueTags(findIntrigueTags(`<plot name="Đêm Máu" action="start" type="Ám Sát" target="Baelish" stake="Mất đầu">…</plot>`));
    store.applyIntrigueTags(findIntrigueTags(`<plot name="Đêm Máu" action="investigate" who="Varys">…</plot>`));

    const text = renderStateForAI(stat());
    expect(text).toContain("Tai mắt của ngươi");
    expect(text).toContain("vỏ bọc");
    expect(text).toContain("Sổ bí mật");
    expect(text).toContain("đòn bẩy");
    expect(text).toContain("Âm mưu đang chạy");
    expect(text).toContain("Varys đang lần theo dấu");
  });

  it("bí mật chưa có nội dung → nhắc AI phát thẻ <secret> điền vào", () => {
    const withEmpty = applyPatch(stat(), [{
      op: "replace", path: "stat_data.Tình Báo.Bí Mật.tin-chua-ro",
      value: { "Về Ai": "Ai đó", "Chủ Đề": "tin-chua-ro", "Nội Dung": "", "Sức Nặng": 40, "Độ Tin Cậy": 50 },
    }]).state;
    const text = renderStateForAI(withEmpty);
    expect(text).toContain("NGƯƠI CHƯA VIẾT NỘI DUNG");
  });
});
