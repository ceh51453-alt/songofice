/**
 * INTEGRATION TEST M5 — trọn luồng 8.6: wizard → buildState → startNewGame
 * (lore khởi tạo + tin mở đầu + TỰ trigger AI, người chơi không gõ gì) qua
 * mock server HTTP thật. Verify prompt chứa bối cảnh + state render nhân vật mới.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { useChatStore } from "../state/chatStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore } from "../state/mvuStore";
import { useLoreStore } from "../state/loreStore";
import { buildStateFromWizard, resolveCrisisDesc, CORE_STATS, STAT_BASE } from "../character/characterInit";
import { startNewGame } from "../character/startGame";
import { ERAS_BY_ID } from "../content/westeros/eras";
import type { CoreStat } from "../content/westeros/skills";

const PORT = 8898;
let server: http.Server;
let lastRequestBody: { messages: { role: string; content: string }[] } | null = null;

const AI_OPENING = `Đại sảnh Winterfell chìm trong ánh nến. Ngươi — Lãnh chúa trẻ vừa kế vị — nhìn xuống cuộn sổ kho lương mà quản gia vừa dâng lên, những con số lạnh hơn cả gió bấc ngoài tường thành.

<UpdateVariable>{"mvu_update":[]}</UpdateVariable>`;

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/v1/chat/completions") {
      let body = "";
      for await (const c of req) body += c;
      lastRequestBody = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      for (let i = 0; i < AI_OPENING.length; i += 200) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: AI_OPENING.slice(i, i + 200) } }] })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((r) => server.listen(PORT, r));
  const conn = useConnectionStore.getState();
  conn.updateProfile(conn.activeProfile().id, {
    baseUrl: `http://127.0.0.1:${PORT}/v1`,
    apiKeys: ["sk-test"],
    model: "mock",
  });
});

afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

describe("Luồng New Game hoàn chỉnh (8.6/8.6b)", () => {
  it("startNewGame: initvar + lore khởi tạo + tin mở đầu + AI tự kể — không cần người chơi gõ", async () => {
    const era = ERAS_BY_ID["war-of-five-kings"];
    const state = buildStateFromWizard({
      eraId: era.id, houseId: "stark", originId: "lord-heir",
      narrativeMode: "Theo Sát Nguyên Tác", scenarioMode: "Người Chơi Là Bối Cảnh", difficulty: "Cân Bằng",
      name: "Torrhen Snow", age: 25,
      continent: "Westeros", culture: "", religion: "", patronGod: "", bloodline: "none", startingLocation: "",
      pointBuy: { ...Object.fromEntries(CORE_STATS.map((s) => [s, STAT_BASE])), "Uy Tín": 12 } as Record<CoreStat, number>,
      talentIds: ["warrior-blood"], skillAllocations: { "persuasion": 2 },
      dragon: null,
      persona: { ngoaiHinh: "Cao gầy, mắt xám", tinhCach: "Trầm lặng, quyết đoán", tieuSu: "Kế vị sau cái chết đột ngột của cha", mauMat: "", mauToc: "", chieuCao: "" },
      crisisId: "empty-granary", companionId: "cunning-advisor", hookId: "kings-arrival",
    });
    const hook = era.startingHooks.find((h) => h.id === "kings-arrival")!;

    await startNewGame(state, era, hook, resolveCrisisDesc("empty-granary"));

    // ---- initvar nạp đủ (Status Panel đọc được ngay) ----
    const stat = useMvuStore.getState().stat;
    expect(stat["Thông Tin Nhân Vật"]["Họ Tên"]).toBe("Torrhen Snow");
    expect(stat["Thông Tin Nhân Vật"]["Vàng"]).toBe(5000);
    expect(Object.keys(stat["Lãnh Địa"])).toHaveLength(1);
    expect(stat["Mối Quan Hệ"]["NPC Chính"]["Quân Sư Lọc Lõi"]).toBeDefined();
    expect(stat["Thế Giới"]["Năm"]).toBe(298);
    expect(stat["Cài Đặt Ván"]["Hướng Kịch Bản"]).toBe("Người Chơi Là Bối Cảnh");

    // ---- lore khởi tạo là session entry constant ----
    const session = useLoreStore.getState().sessionEntries;
    expect(session).toHaveLength(1);
    expect(session[0].constant).toBe(true);

    // ---- tin mở đầu do HỆ THỐNG đẩy + AI đã trả lời ----
    const msgs = useChatStore.getState().messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("user");
    expect(msgs[0].content).toContain("[Bắt đầu ván chơi]");
    expect(msgs[1].role).toBe("assistant");
    expect(msgs[1].content).toContain("Đại sảnh Winterfell");

    // ---- prompt gửi AI chứa: lore khởi tạo + state render nhân vật mới + 2 trục chế độ ----
    const sent = lastRequestBody!.messages.map((m) => m.content).join("\n---\n");
    expect(sent).toContain("Bối cảnh ván chơi"); // lore entry khởi tạo (constant, ignoreBudget)
    expect(sent).toContain("KHỦNG HOẢNG HIỆN TẠI");
    expect(sent).toContain("Torrhen Snow"); // state render (5.7.3)
    expect(sent).toContain("Người Chơi Là Bối Cảnh"); // hướng kịch bản vào system prompt
    expect(sent).toContain("Quân Sư Lọc Lõi"); // tâm phúc trong khối NPC
  }, 20000);
});
