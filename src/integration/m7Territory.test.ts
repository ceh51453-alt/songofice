/**
 * INTEGRATION M7 — Bản đồ + Lãnh địa qua luồng chat thật (mock HTTP):
 * - AI kể vùng đổi chủ → phát <territory_change> → engine đồng bộ chủ quyền
 *   (9.5.1) + tạo Lãnh Địa + toast; bản đồ (regionFill) đổi màu theo.
 * - AI KHÔNG ghi thẳng "Chủ Quyền Lãnh Thổ" (extractor chặn — engine giữ số).
 * - Xây công trình qua hàng đợi + turn-advance loop tick đúng số ngày (10.3).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import http from "node:http";
import { useChatStore } from "../state/chatStore";
import { useConnectionStore } from "../state/connectionStore";
import { useMvuStore } from "../state/mvuStore";
import { useTerritoryStore } from "../state/territoryStore";
import { makeDefaultState, MilitaryUnitSchema, StatDataSchema } from "../mvu/schema";
import { seedRegionControl, regionFill, regionController } from "../territory/territoryEngine";
import { registerConstructionLoop } from "../territory/construction";
import { houseColor } from "../content/westeros/houseColors";
import { registerArmyLoop } from "../strategy/army";
import { registerSiegeLoop } from "../strategy/war";

const PORT = 8896;
let server: http.Server;
let responseQueue: string[] = [];

const AI_CAPTURE = `Đại quân Nhà Stark tràn qua khúc cạn, cờ sói tung bay trên tường thành Riverrun.

<territory_change region="the-riverlands" house="stark">Vùng Sông quy về Phương Bắc sau khi Tully thất thủ</territory_change>

<UpdateVariable>{"mvu_update":[]}</UpdateVariable>`;

const AI_FORGE_CONTROL = `Ta tuyên bố Vùng Tây thuộc về ta!

<UpdateVariable>{"mvu_update":[{"op":"replace","path":"stat_data.Chủ Quyền Lãnh Thổ.the-westerlands.Nhà Kiểm Soát","value":"stark"}]}</UpdateVariable>`;

const AI_TIME_PASSES = `Ba tháng trôi qua trong lúc thợ xây miệt mài dựng vựa lúa mới.

<UpdateVariable>{"mvu_update":[{"op":"delta","path":"stat_data.Thế Giới.Ngày","value":90}]}</UpdateVariable>`;

const AI_SIEGE_MARCH = `Robb hạ lệnh cho Đại quân Bắc nam tiến. Sau nhiều tuần đường trường, quân kỳ sói đã khép kín các ngả quanh Riverrun.

<army_order unit="Đại quân Bắc" action="siege" target="the-riverlands">Hành quân rồi dựng trại vây Riverrun.</army_order>
<siege_update unit="Đại quân Bắc" target="Riverrun" phase="siege" days="45">Quân tới nơi, đào hào, dựng đủ vòng trại rồi bắt đầu siết thành.</siege_update>

<UpdateVariable>{"mvu_update":[{"op":"delta","path":"stat_data.Thế Giới.Ngày","value":45}]}</UpdateVariable>`;

beforeAll(async () => {
  registerConstructionLoop();
  registerArmyLoop();
  registerSiegeLoop();
  server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/v1/chat/completions") {
      for await (const _ of req) { /* drain */ }
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
  useMvuStore.getState().newGame();
  useTerritoryStore.getState().selectRegion(null);
  // Robb Stark cai quản Phương Bắc ở Chiến Tranh Ngũ Vương
  const s = makeDefaultState();
  s["Thông Tin Nhân Vật"]["Họ Tên"] = "Robb Stark";
  s["Thông Tin Nhân Vật"]["Nhà"] = "Stark";
  s["Thông Tin Nhân Vật"]["Tước Vị"] = "Đại Lãnh Chúa";
  s["Thông Tin Nhân Vật"]["Ngân Khố"] = 500 * 11760; // 500 Rồng Vàng ≈ 5,880,000 Đồng Đỏ
  s["Cài Đặt Ván"]["Thời Kỳ"] = "war-of-five-kings";
  seedRegionControl(s, "war-of-five-kings", { createIfMissing: true });
  useMvuStore.setState({ stat: StatDataSchema.parse(s), pendingEvents: [], lastChangedPaths: [] });
});

describe("M7 — chủ quyền + bản đồ + lãnh địa qua luồng chat", () => {
  it("AI phát <territory_change> → engine đổi chủ + tạo Lãnh Địa + bản đồ đổi màu + toast", async () => {
    responseQueue = [AI_CAPTURE];
    // trước: Vùng Sông của Tully
    expect(regionController(useMvuStore.getState().stat, "the-riverlands")).toBe("tully");

    await useChatStore.getState().send("Ta tiến quân chiếm Riverrun.");

    const stat = useMvuStore.getState().stat;
    expect(regionController(stat, "the-riverlands")).toBe("stark");
    expect(stat["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Là Của Người Chơi"]).toBe(true);
    expect(stat["Lãnh Địa"]["the-riverlands-seat"]).toBeDefined(); // mở quản trị nội bộ
    // bản đồ (regionFill) đổi sang màu Stark (9.5.1)
    expect(regionFill(stat, "the-riverlands", "political").color).toBe(houseColor("stark").base);
    // toast đổi chủ (6.4)
    expect(useMvuStore.getState().pendingEvents.some((e) => e.kind === "territory")).toBe(true);
  }, 20000);

  it("AI KHÔNG tự đổi chủ quyền qua mvu_update — extractor chặn, engine giữ số", async () => {
    responseQueue = [AI_FORGE_CONTROL];
    await useChatStore.getState().send("Ta đòi Vùng Tây.");
    // vẫn của Lannister — AI ghi thẳng bị bỏ qua
    expect(regionController(useMvuStore.getState().stat, "the-westerlands")).toBe("lannister");
  }, 20000);

  it("xây công trình → loop tick đúng số ngày AI kể → hoàn tất + thu tăng", async () => {
    // khởi công Nông Trại (3 tháng = 90 ngày) ở Phương Bắc
    const r = useTerritoryStore.getState().startBuild("the-north-seat", "Nông Trại");
    expect(r.ok).toBe(true);
    expect(useMvuStore.getState().stat["Lãnh Địa"]["the-north-seat"]["Công Trình"]["Nông Trại"]["Đang Xây"]).toBe(true);
    const foodStart = useMvuStore.getState().stat["Lãnh Địa"]["the-north-seat"]["Tài Nguyên"]["Lương Thực"];

    // AI kể "ba tháng trôi qua" → tick 90 ngày + 3 mốc tháng (6.2) → Nông Trại xong
    responseQueue = [AI_TIME_PASSES];
    await useChatStore.getState().send("Ta chờ vựa lúa hoàn thành.");

    const north = useMvuStore.getState().stat["Lãnh Địa"]["the-north-seat"];
    expect(north["Công Trình"]["Nông Trại"]["Đang Xây"]).toBe(false);
    expect(north["Tài Nguyên"]["Lương Thực"]).toBeGreaterThan(foodStart); // sản lượng cộng mỗi tháng
  }, 20000);

  it("AI kể lệnh vây + thời gian trôi → tự hành quân, dựng trại rồi mới mở vây", async () => {
    const stat = structuredClone(useMvuStore.getState().stat);
    stat["Biên Chế Quân Sự"]["Đại quân Bắc"] = MilitaryUnitSchema.parse({
      "Tướng Chỉ Huy": "Robb Stark",
      "Nhà": "Stark",
      "Số Lượng": 8_000,
      "Loại Quân": "Bộ Binh",
      "Lãnh Địa Đồn Trú": "the-north-seat",
      "Ngày Tập Hợp Còn Lại": 0,
      "Ngày Huấn Luyện": 0,
      "Lương Thực Mang Theo": 90,
    });
    useMvuStore.setState({ stat, pendingEvents: [], lastChangedPaths: [] });

    responseQueue = [AI_SIEGE_MARCH];
    await useChatStore.getState().send("Cho Đại quân Bắc tiến xuống vây Riverrun.");

    const after = useMvuStore.getState().stat;
    expect(after["Biên Chế Quân Sự"]["Đại quân Bắc"]["Lãnh Địa Đồn Trú"]).toBe("the-riverlands");
    expect(after["Biên Chế Quân Sự"]["Đại quân Bắc"]["Đang Di Chuyển Đến"]).toBeFalsy();
    expect(after["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["Tình Trạng"]).toBe("Bị Vây");
    expect(after["Chủ Quyền Lãnh Thổ"]["the-riverlands"]["_Vây"]?.["Ngày Đã Vây"]).toBeGreaterThan(0);
  }, 20000);
});
