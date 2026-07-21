/**
 * INTEGRATION TEST M6 — LUỒNG 2 LƯỢT (6.2/7.12) qua mock server HTTP thật:
 * Lượt N: AI kể tới giao chiến → phát <combat_trigger> → engine mở trận,
 *   phân giải bằng seed, áp state NGAY (quân chết vĩnh viễn, HP/EXP).
 * Lượt N+1: prompt chứa bút pháp 7.11 + khối <battle_report> engine điền sẵn
 *   → AI tường thuật KHỚP kết quả đã chốt.
 * Verify: AI KHÔNG tự quyết thắng bại; reroll không đổi kết quả trận.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import http from "node:http";
import { useChatStore } from "../state/chatStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore } from "../state/mvuStore";
import { useCombatStore } from "../state/combatStore";
import { applyPatch } from "../mvu/patchEngine";

const PORT = 8897;
let server: http.Server;
let lastRequestBody: { messages: { role: string; content: string }[] } | null = null;
let responseQueue: string[] = [];

/** Lượt N: AI kể tới trận, phát thẻ với ước lượng địch — KHÔNG tự kể kết quả. */
const AI_TRIGGER = `Đội quân Lannister dàn trận bên kia triền đồi, giáo dựng như rừng thép. Ngươi siết dây cương, gió bấc quất vào mặt.

<combat_trigger scale="Đại Chiến" terrain="Đồi Núi" enemy="Quân Lannister" enemy_size="7500" enemy_quality="Mới Lập Đội" enemy_general="Ser Amory" enemy_general_command="45">Hai đại quân giáp mặt trên triền đồi phía nam</combat_trigger>

<UpdateVariable>{"mvu_update":[]}</UpdateVariable>`;

/** Lượt N+1: AI tường thuật — chèn nguyên văn báo cáo + văn xuôi 3 nhịp. */
const AI_NARRATION = `<battle_report outcome="ENGINE_FILLS" scale="Đại Chiến" terrain="Đồi Núi">
(khối do engine cung cấp)
</battle_report>

Tù và rúc lên trong sương sớm. Hàng giáo Nhà Stark dựng thành bức tường thép trên triền dốc, chờ đợi. Rồi kỵ binh Lannister lao lên — và vỡ tan trên những mũi giáo.

Chiều xuống. Cờ rách bay lất phất, tiếng rên của thương binh vọng khắp sườn đồi.

<UpdateVariable>{"mvu_update":[{"op":"delta","path":"stat_data.Thế Giới.Ngày","value":1}]}</UpdateVariable>`;

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/v1/chat/completions") {
      let body = "";
      for await (const c of req) body += c;
      lastRequestBody = JSON.parse(body);
      const full = responseQueue.shift() ?? "(hết kịch bản)";
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

beforeEach(() => {
  useChatStore.getState().clearChat();
  useCombatStore.getState().clearReport();
  useMvuStore.getState().newGame();
  // trang bị quân cho người chơi (Đại Chiến cần Biên Chế Quân Sự)
  const { state } = applyPatch(useMvuStore.getState().stat, [
    { op: "replace", path: "stat_data.Thông Tin Nhân Vật.Họ Tên", value: "Robb Stark" },
    { op: "replace", path: "stat_data.Thông Tin Nhân Vật.Nhà", value: "Stark" },
    {
      op: "replace", path: "stat_data.Biên Chế Quân Sự.Bộ binh phương Bắc",
      value: { "Số Lượng": 6000, "Loại Quân": "Trường Thương", "Sĩ Khí": "Hăng Hái", "Huấn Luyện": "Thành Thạo", "Trang Bị": "Đồng Bộ Chỉnh Tề", "Hậu Cần": "Dồi Dào" },
    },
    {
      op: "replace", path: "stat_data.Tướng Lĩnh.Greatjon Umber",
      value: { "Chỉ Số Thống Soái": 75, "Chỉ Số Võ Lực": 85, "Chỉ Số Trí Mưu": 40, "Trung Thành": 80 },
    },
  ]);
  useMvuStore.setState({ stat: state });
});

describe("Luồng 2 lượt chiến đấu (6.2/7.12)", () => {
  it("LƯỢT N: AI phát combat_trigger → engine mở trận + cố định seed, chưa phân giải", async () => {
    responseQueue = [AI_TRIGGER];
    await useChatStore.getState().send("Ta dàn quân nghênh chiến.");

    const combat = useCombatStore.getState();
    expect(combat.phase).toBe("awaiting-choice"); // ≥ Giao Tranh → hỏi Tự Chỉ Huy/Giao Cho Tướng
    expect(combat.scale).toBe("Đại Chiến");
    expect(combat.terrain).toBe("Đồi Núi");
    expect(combat.attrs.enemy_size).toBe("7500");
    expect(combat.battleSeed).toBeGreaterThan(0);

    // "Trận Đang Diễn" dựng đúng, seed ghi vào state (field _ do ENGINE ghi)
    const stat = useMvuStore.getState().stat;
    expect(stat["Trận Đang Diễn"]["_Đang Chiến Đấu"]).toBe(true);
    expect(stat["Trận Đang Diễn"]["Quy Mô"]).toBe("Đại Chiến");
    expect(stat["Trận Đang Diễn"]["_Seed"]).toBe(combat.battleSeed);
    // chưa phân giải → chưa có báo cáo
    expect(combat.reportBlock).toBeNull();
  }, 20000);

  it("ENGINE GIỮ SỐ: phân giải bằng seed → quân chết trừ VĨNH VIỄN + báo cáo engine điền", async () => {
    responseQueue = [AI_TRIGGER];
    await useChatStore.getState().send("Ta dàn quân nghênh chiến.");

    const troopsBefore = useMvuStore.getState().stat["Biên Chế Quân Sự"]["Bộ binh phương Bắc"]["Số Lượng"];
    useCombatStore.getState().resolveArmy("delegate"); // Giao Cho Tướng → auto-resolve 7.9

    const combat = useCombatStore.getState();
    expect(combat.phase).toBe("done");
    expect(combat.resultOutcome).toBeTruthy();

    // quân chết là chết — trừ vĩnh viễn khỏi Số Lượng
    const troopsAfter = useMvuStore.getState().stat["Biên Chế Quân Sự"]["Bộ binh phương Bắc"]["Số Lượng"];
    expect(troopsAfter).toBeLessThan(troopsBefore);

    // trận đóng lại, log engine ghi (có xúc xắc — minh bạch)
    const stat = useMvuStore.getState().stat;
    expect(stat["Trận Đang Diễn"]["_Đang Chiến Đấu"]).toBe(false);
    expect(stat["Trận Đang Diễn"]["_Log"].some((l) => l.includes("Xúc xắc 2D6"))).toBe(true);

    // báo cáo do ENGINE điền, chứa số đã chốt (7.10)
    expect(combat.reportBlock).toContain("<battle_report");
    expect(combat.reportBlock).toContain(`outcome="${combat.resultOutcome}"`);
    expect(combat.reportBlock).toContain("Xúc xắc: 2D6=");
    expect(combat.reportBlock).toContain("Thương vong:");
  }, 20000);

  it("LƯỢT N+1: prompt chứa bút pháp 7.11 + khối báo cáo → AI tường thuật khớp kết quả", async () => {
    responseQueue = [AI_TRIGGER, AI_NARRATION];
    await useChatStore.getState().send("Ta dàn quân nghênh chiến.");
    useCombatStore.getState().resolveArmy("delegate");
    const outcome = useCombatStore.getState().resultOutcome!;

    // người chơi bấm "Nghe tường thuật" → gửi tin ẩn
    await useChatStore.getState().send("(Trận đánh đã được phân giải — hãy tường thuật.)", { hidden: true });

    const sent = lastRequestBody!.messages.map((m) => m.content).join("\n---\n");
    expect(sent).toContain("TƯỜNG THUẬT TRẬN ĐÁNH"); // bút pháp 7.11
    expect(sent).toContain("BÀY TRẬN & XUẤT QUÂN");
    expect(sent).toContain("<battle_report"); // khối engine điền sẵn
    expect(sent).toContain(`outcome="${outcome}"`);
    expect(sent).toContain("KHỐI BÁO CÁO ĐÃ CHỐT");

    // tin ẩn không hiện với người chơi nhưng AI thấy trong history
    const msgs = useChatStore.getState().messages;
    expect(msgs.find((m) => m.hidden)).toBeDefined();
    expect(msgs[msgs.length - 1].content).toContain("Tù và rúc lên");
  }, 20000);

  it("TÁI LẬP: cùng trận + cùng seed → phân giải lại cho KẾT QUẢ Y HỆT (reroll không đổi số)", async () => {
    responseQueue = [AI_TRIGGER];
    await useChatStore.getState().send("Ta dàn quân nghênh chiến.");
    const seed = useCombatStore.getState().battleSeed;
    const snapshot = useMvuStore.getState().getSnapshot();

    useCombatStore.getState().resolveArmy("delegate");
    const first = { outcome: useCombatStore.getState().resultOutcome, report: useCombatStore.getState().reportBlock };

    // rollback state + phân giải lại CÙNG seed (mô phỏng reroll lượt)
    useMvuStore.getState().restoreSnapshot(snapshot);
    useCombatStore.setState({ phase: "awaiting-choice", battleSeed: seed });
    useCombatStore.getState().resolveArmy("delegate");
    const second = { outcome: useCombatStore.getState().resultOutcome, report: useCombatStore.getState().reportBlock };

    expect(second.outcome).toBe(first.outcome);
    expect(second.report).toBe(first.report);
  }, 20000);

  it("ĐỘ KHÓ đổi kết quả đúng hướng trên CÙNG trận (7.9.6)", async () => {
    responseQueue = [AI_TRIGGER];
    await useChatStore.getState().send("Ta dàn quân nghênh chiến.");
    const seed = useCombatStore.getState().battleSeed;
    const snapshot = useMvuStore.getState().getSnapshot();

    const runWith = (difficulty: "Nhàn Hạ" | "Cân Bằng" | "Chân Thực") => {
      useMvuStore.getState().restoreSnapshot(snapshot);
      const { state } = applyPatch(useMvuStore.getState().stat, [
        { op: "replace", path: "stat_data.Cài Đặt Ván.Độ Khó Chiến Đấu", value: difficulty },
      ]);
      useMvuStore.setState({ stat: state });
      useCombatStore.setState({ phase: "awaiting-choice", battleSeed: seed });
      useCombatStore.getState().resolveArmy("delegate");
      return useCombatStore.getState().resultOutcome!;
    };

    const ORDER = ["Đại Bại", "Bại", "Tiểu Bại", "Giằng Co", "Tiểu Thắng", "Thắng", "Đại Thắng"];
    const easy = runWith("Nhàn Hạ");
    const balanced = runWith("Cân Bằng");
    const hard = runWith("Chân Thực");
    expect(ORDER.indexOf(easy)).toBeGreaterThan(ORDER.indexOf(balanced));
    expect(ORDER.indexOf(hard)).toBeLessThanOrEqual(ORDER.indexOf(balanced));
  }, 20000);

  it("ĐẤU TAY ĐÔI: mở duel tương tác, đánh theo vòng, áp HP/EXP vào state", async () => {
    responseQueue = [
      `Gã lính đánh thuê rút kiếm lao tới.

<combat_trigger scale="Đấu Tay Đôi" enemy="Lính đánh thuê" enemy_hp="35" enemy_ac="12" enemy_atk="3" enemy_dmg="1d6">Ẩu đả trong quán trọ</combat_trigger>

<UpdateVariable>{"mvu_update":[]}</UpdateVariable>`,
    ];
    await useChatStore.getState().send("Ta rút kiếm.");

    const combat = useCombatStore.getState();
    expect(combat.phase).toBe("duel");
    expect(combat.duelState).not.toBeNull();
    expect(combat.duelState!.b.name).toBe("Lính đánh thuê");
    expect(combat.duelState!.b.hp).toBe(35);
    expect(combat.duelState!.a.name).toBe("Robb Stark"); // duelist dựng từ state người chơi

    const expBefore = useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Kinh Nghiệm"];
    useCombatStore.getState().autoResolveDuel();

    expect(useCombatStore.getState().phase).toBe("done");
    expect(useCombatStore.getState().reportBlock).toContain('scale="Đấu Tay Đôi"');
    const stat = useMvuStore.getState().stat;
    expect(stat["Trận Đang Diễn"]["_Đang Chiến Đấu"]).toBe(false);
    if (useCombatStore.getState().resultOutcome === "Thắng") {
      expect(stat["Thông Tin Nhân Vật"]["Kinh Nghiệm"]).toBe(expBefore + 50);
    }
  }, 20000);
});
