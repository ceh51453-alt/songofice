/**
 * INTEGRATION TEST M4 — chạy TRỌN vòng lặp 5.7.6 qua mạng thật (mock server
 * in-process): send → buildPipeline (prompt 5.4b + state render 5.7.3) →
 * streaming SSE → extractor lọc (5.4c) → applyPatch + lan toả (5.7.4) →
 * reroll rollback (19.1) → swipe. Không cần browser.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { useChatStore } from "../state/chatStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore } from "../state/mvuStore";

const PORT = 8899;

const RESPONSES = [
  `Tên lính đánh thuê vung kiếm, lưỡi thép sượt qua vai ngươi. Ngươi hạ gục hắn, lấy được năm mươi đồng vàng.

<raven_scroll>Maester Luwin | Lãnh chúa, xin ngài về gấp.</raven_scroll>

Ba ngày sau, ngươi về tới Winterfell. Tyrion Lannister đứng chờ ở cổng thành.

<UpdateVariable>
{"mvu_update":[
 {"op":"delta","path":"stat_data.Chỉ Số Sinh Tồn.HP","value":-15},
 {"op":"delta","path":"stat_data.Thông Tin Nhân Vật.Ngân Khố","value":50},
 {"op":"delta","path":"stat_data.Thế Giới.Ngày","value":3},
 {"op":"replace","path":"stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister","value":{"Họ Tên":"Tyrion Lannister","Tuổi":38,"Độ Hảo Cảm":20,"Chức Vụ":"Quân Sư"}},
 {"op":"replace","path":"stat_data._engineMeta._Nhịp","value":999}
]}
</UpdateVariable>`,
  `Ngươi né kịp nhát chém, chỉ trẹo nhẹ cổ chân. Tên lính bỏ chạy.

<UpdateVariable>
{"mvu_update":[
 {"op":"delta","path":"stat_data.Chỉ Số Sinh Tồn.HP","value":-5}
]}
</UpdateVariable>`,
];

let server: http.Server;
let callCount = 0;
let lastRequestBody: { messages: { role: string; content: string }[] } | null = null;

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/v1/chat/completions") {
      let body = "";
      for await (const c of req) body += c;
      lastRequestBody = JSON.parse(body);
      const full = RESPONSES[callCount % 2];
      callCount++;
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      for (let i = 0; i < full.length; i += 200) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: full.slice(i, i + 200) } }] })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((r) => server.listen(PORT, r));

  // cấu hình profile trỏ vào mock
  const conn = useConnectionStore.getState();
  conn.updateProfile(conn.activeProfile().id, {
    baseUrl: `http://127.0.0.1:${PORT}/v1`,
    apiKeys: ["sk-test"],
    model: "westeros-mvu",
  });
  useMvuStore.getState().newGame();
});

afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

describe("Vòng lặp M4 hoàn chỉnh (5.7.6)", () => {
  it("send → prompt chứa lớp app (5.4b + state render) → patch áp đúng + extractor lọc field _", async () => {
    const mvu0 = useMvuStore.getState().stat;
    const hp0 = mvu0["Chỉ Số Sinh Tồn"]["HP"];
    const gold0 = mvu0["Thông Tin Nhân Vật"]["Ngân Khố"];
    const day0 = mvu0["Thế Giới"]["Ngày"];

    await useChatStore.getState().send("Ta rút kiếm nghênh chiến tên lính đánh thuê.");

    // --- prompt gửi đi có lớp app ---
    expect(lastRequestBody).not.toBeNull();
    const sent = lastRequestBody!.messages.map((m) => m.content).join("\n---\n");
    expect(sent).toContain("QUY TẮC CẬP NHẬT BẢNG TRẠNG THÁI"); // 5.4b
    expect(sent).toContain("【TRẠNG THÁI HIỆN TẠI"); // 5.7.3

    // --- state cập nhật đúng qua patch ---
    const stat = useMvuStore.getState().stat;
    expect(stat["Chỉ Số Sinh Tồn"]["HP"]).toBe(hp0 - 15);
    expect(stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(gold0 + 50);
    expect(stat["Thế Giới"]["Ngày"]).toBe(day0 + 3); // AI báo 3 ngày trôi
    const tyrion = stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion Lannister"];
    expect(tyrion["Độ Hảo Cảm"]).toBe(20);
    expect(tyrion["Giai Đoạn Quan Hệ"]).toBe("Quen Biết"); // engine dẫn xuất nhãn (5.1d)

    // --- extractor CHẶN op ghi field _ (AI cố ghi _Nhịp=999) ---
    expect(stat["_engineMeta"]["_Nhịp"]).toBe(1); // 0 + 1 lượt, KHÔNG phải 999

    // --- JSON patch bị ẩn khỏi text hiển thị (5.5), thẻ raven_scroll giữ nguyên cho renderer ---
    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.content).not.toContain("UpdateVariable");
    expect(last.content).not.toContain("mvu_update");
    expect(last.content).toContain("<raven_scroll>");
    expect(last.stateBefore).toBeDefined();
  }, 20000);

  it("reroll: ROLLBACK rồi áp bản mới — không cộng dồn (HP chỉ trừ 1 lần)", async () => {
    const before = useChatStore.getState().messages;
    const snapshotHp = before[before.length - 1].stateBefore!["Chỉ Số Sinh Tồn"]["HP"];
    const snapshotGold = before[before.length - 1].stateBefore!["Thông Tin Nhân Vật"]["Ngân Khố"];

    await useChatStore.getState().reroll();

    const stat = useMvuStore.getState().stat;
    // bản 2: HP -5 so với SNAPSHOT (không phải -15-5), vàng KHÔNG +50, ngày không +3
    expect(stat["Chỉ Số Sinh Tồn"]["HP"]).toBe(snapshotHp - 5);
    expect(stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(snapshotGold);
    expect(stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion Lannister"]).toBeUndefined(); // bản 2 không thêm NPC

    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    expect(last.variants).toHaveLength(2);
    expect(last.activeVariant).toBe(1);
    expect(last.content).toContain("né kịp nhát chém");
  }, 20000);

  it("swipe về bản 1: khôi phục đúng state bản đó (HP -15, vàng +50, có Tyrion)", () => {
    const msgs = useChatStore.getState().messages;
    const last = msgs[msgs.length - 1];
    const snapHp = last.stateBefore!["Chỉ Số Sinh Tồn"]["HP"];
    const snapGold = last.stateBefore!["Thông Tin Nhân Vật"]["Ngân Khố"];

    useChatStore.getState().swipeVariant(-1); // 2 bản: index 1 → 0

    const stat = useMvuStore.getState().stat;
    expect(stat["Chỉ Số Sinh Tồn"]["HP"]).toBe(snapHp - 15);
    expect(stat["Thông Tin Nhân Vật"]["Ngân Khố"]).toBe(snapGold + 50);
    expect(stat["Mối Quan Hệ"]["NPC Chính"]["Tyrion Lannister"]["Độ Hảo Cảm"]).toBe(20);
    expect(useChatStore.getState().messages.at(-1)!.activeVariant).toBe(0);
  });

  it("lượt kế: state mới (sau swipe) được render vào prompt — vòng khép kín 5.7.6", async () => {
    await useChatStore.getState().send("Ta chào Tyrion.");
    const sent = lastRequestBody!.messages.map((m) => m.content).join("\n");
    // khối state render lượt này phải chứa Tyrion với nhãn bậc từ lượt trước
    expect(sent).toContain("Tyrion Lannister");
    expect(sent).toContain("Quen Biết (20)");
    // HISTORY gửi đi là text SẠCH — tin nhắn assistant cũ không còn khối UpdateVariable
    // (prompt 5.4b của app chứa "mvu_update" trong VÍ DỤ định dạng — hợp lệ)
    const assistantMsgs = lastRequestBody!.messages.filter((m) => m.role === "assistant");
    expect(assistantMsgs.length).toBeGreaterThan(0);
    for (const m of assistantMsgs) {
      expect(m.content).not.toContain("UpdateVariable");
    }
  }, 20000);
});
