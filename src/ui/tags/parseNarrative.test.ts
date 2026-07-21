import { describe, expect, it } from "vitest";
import { parseNarrative, splitTagParts, parseCouncilSession } from "./parseNarrative";

describe("parser thẻ ngữ nghĩa (5.6)", () => {
  it("tách văn thường + thẻ raven_scroll", () => {
    const segs = parseNarrative("Một con quạ đáp xuống.\n<raven_scroll>Maester Aemon | Winter is coming.</raven_scroll>\nNgươi mở thư.");
    expect(segs.map((s) => s.type)).toEqual(["text", "raven_scroll", "text"]);
    expect(segs[1].content).toBe("Maester Aemon | Winter is coming.");
  });

  it("nhiều thẻ trong 1 tin nhắn + event_popup + combat_trigger", () => {
    const segs = parseNarrative(
      "<event_popup>Phản loạn | Dân chúng nổi dậy ở cổng nam.</event_popup>giữa<combat_trigger>Ba tên lính đào ngũ chặn đường</combat_trigger>",
    );
    expect(segs.map((s) => s.type)).toEqual(["event_popup", "text", "combat_trigger"]);
  });

  it("thẻ KHÔNG nhận diện được → giữ nguyên như text (không vỡ UI)", () => {
    const segs = parseNarrative("Văn <thẻ_bịa>nội dung</thẻ_bịa> tiếp.");
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe("text");
    expect(segs[0].content).toContain("<thẻ_bịa>");
  });

  it("thẻ không đóng → coi là text thường", () => {
    const segs = parseNarrative("Bắt đầu <raven_scroll>thư không đóng...");
    expect(segs.every((s) => s.type === "text")).toBe(true);
  });

  it("không phân biệt hoa thường tên thẻ", () => {
    const segs = parseNarrative("<RAVEN_SCROLL>x | y</RAVEN_SCROLL>");
    expect(segs[0].type).toBe("raven_scroll");
  });

  it("splitTagParts: tách 'đầu | thân', thiếu | → toàn bộ là thân", () => {
    expect(splitTagParts("Người gửi | Nội dung")).toEqual({ head: "Người gửi", body: "Nội dung" });
    expect(splitTagParts("chỉ có thân")).toEqual({ head: "", body: "chỉ có thân" });
  });

  it("council_session được nhận diện là thẻ", () => {
    const segs = parseNarrative('<council_session issue="Ngân khố cạn">\n- Tăng thuế — +Vàng\n- Vay Ngân Hàng Sắt — gánh nợ\n</council_session>');
    expect(segs[0].type).toBe("council_session");
    expect(segs[0].attrs.issue).toBe("Ngân khố cạn");
  });
});

describe("parseCouncilSession (13.3)", () => {
  it("gạch đầu dòng + hé lộ hệ quả sau dấu —", () => {
    const c = parseCouncilSession(
      "- Tăng thuế chiến tranh — +Vàng, −Trung Thành\n- Vay Ngân Hàng Sắt — +Vàng ngay, gánh nợ\n- Cắt giảm chi tiêu — −Chi Phí",
      { issue: "Ngân khố cạn kiệt", attendees: "Tyrion, Varys, Pycelle" },
    );
    expect(c.issue).toBe("Ngân khố cạn kiệt");
    expect(c.attendees).toEqual(["Tyrion", "Varys", "Pycelle"]);
    expect(c.choices).toHaveLength(3);
    expect(c.choices[0]).toEqual({ label: "Tăng thuế chiến tranh", hint: "+Vàng, −Trung Thành" });
  });

  it("dòng thường không gạch đầu → gộp thành vấn đề; fallback 2-4 dòng ngắn = lựa chọn", () => {
    const c = parseCouncilSession("Chấp thuận đề nghị\nBác bỏ", {});
    expect(c.choices).toHaveLength(2);
    expect(c.choices[0].label).toBe("Chấp thuận đề nghị");
  });

  it("dòng dẫn nhập trước các lựa chọn → thành issue", () => {
    const c = parseCouncilSession("Bàn về cuộc hôn nhân với Nhà Tyrell.\n- Chấp nhận — liên minh\n- Từ chối — giữ độc lập", {});
    expect(c.issue).toContain("Tyrell");
    expect(c.choices).toHaveLength(2);
  });
});
