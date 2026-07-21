/**
 * Test EJS engine (5.5b): getvar đọc đúng state, if-else chọn đúng nhánh
 * (bộ điều khiển đa giai đoạn theo 1 chỉ số), getwi nạp đúng entry con,
 * entry lỗi cú pháp không sập, async hoạt động.
 */
import { describe, expect, it } from "vitest";
import { renderLoreContent, type EjsBridge } from "./ejsEngine";
import type { LoreEntry } from "./loreSchema";

function makeEntry(comment: string, content: string): LoreEntry {
  return {
    uid: `t#${comment}`, sourceId: "t", sourceName: "test",
    keys: [], secondaryKeys: [], content, comment,
    constant: false, selective: true, selectiveLogic: "AND_ANY",
    order: 100, position: "before", depth: 4, role: "system",
    disabled: false, probability: 100,
    excludeRecursion: false, preventRecursion: false, delayUntilRecursion: false,
    scanDepth: null, caseSensitive: null, matchWholeWords: null, ignoreBudget: false,
  };
}

function makeBridge(vars: Record<string, unknown>, entries: LoreEntry[] = []): EjsBridge {
  return {
    getvar: (path, opts) => (path in vars ? vars[path] : opts?.defaults),
    findEntry: (name) => entries.find((e) => e.comment === name),
  };
}

describe("EJS engine (5.5b)", () => {
  it("nội dung không có <% trả nguyên văn (không compile)", async () => {
    const out = await renderLoreContent("văn thường có {{macro}} và <b>tag</b>", makeBridge({}), [], "t");
    expect(out).toBe("văn thường có {{macro}} và <b>tag</b>");
  });

  it("getvar đọc đúng giá trị state + defaults khi thiếu", async () => {
    const bridge = makeBridge({ "stat_data.Lãnh_Địa.Cư_dân.Lòng_dân": 72 });
    const out = await renderLoreContent(
      "Lòng dân: <%= getvar('stat_data.Lãnh_Địa.Cư_dân.Lòng_dân', { defaults: 50 }) %>/<%= getvar('không.có', { defaults: 50 }) %>",
      bridge, [], "t",
    );
    expect(out).toBe("Lòng dân: 72/50");
  });

  it("BỘ ĐIỀU KHIỂN ĐA GIAI ĐOẠN theo 1 chỉ số — đúng nguyên mẫu card Đại Lãnh Chúa", async () => {
    const stages = [
      makeEntry("Giai_đoạn_01_Hỗn_loạn", "Dân chúng nổi loạn khắp nơi."),
      makeEntry("Giai_đoạn_03_Bình_yên", "Làng mạc yên ổn làm ăn."),
      makeEntry("Giai_đoạn_05_Thái_bình", "Thái bình thịnh trị."),
    ];
    const controller = `<%_
if (typeof morale === 'undefined') var morale = getvar('stat_data.Lãnh_Địa.Cư_dân.Lòng_dân', { defaults: 50 });
_%>
<%_ if (morale >= 0 && morale <= 29) { _%>
<%- await getwi(null, 'Giai_đoạn_01_Hỗn_loạn') %>
<%_ } else if (morale >= 50 && morale <= 69) { _%>
<%- await getwi(null, 'Giai_đoạn_03_Bình_yên') %>
<%_ } else { _%>
<%- await getwi(null, 'Giai_đoạn_05_Thái_bình') %>
<%_ } _%>`;

    const low = await renderLoreContent(controller, makeBridge({ "stat_data.Lãnh_Địa.Cư_dân.Lòng_dân": 15 }, stages), [], "ctl");
    expect(low.trim()).toBe("Dân chúng nổi loạn khắp nơi.");

    const mid = await renderLoreContent(controller, makeBridge({ "stat_data.Lãnh_Địa.Cư_dân.Lòng_dân": 55 }, stages), [], "ctl");
    expect(mid.trim()).toBe("Làng mạc yên ổn làm ăn.");

    const high = await renderLoreContent(controller, makeBridge({ "stat_data.Lãnh_Địa.Cư_dân.Lòng_dân": 95 }, stages), [], "ctl");
    expect(high.trim()).toBe("Thái bình thịnh trị.");
  });

  it("kích hoạt theo năm trong game (ví dụ 2 của 5.5b)", async () => {
    const stages = [makeEntry("Sự_kiện_Chiến_Tranh_Ngũ_Vương", "Ngũ Vương tranh đoạt Ngai Sắt.")];
    const tpl = `<%_ var currentYear = getvar('stat_data.Thế Giới.Năm', { defaults: 0 }); _%>
<%_ if (currentYear >= 298 && currentYear <= 300) { _%>
<%- await getwi(null, 'Sự_kiện_Chiến_Tranh_Ngũ_Vương') %>
<%_ } _%>`;
    expect((await renderLoreContent(tpl, makeBridge({ "stat_data.Thế Giới.Năm": 299 }, stages), [], "t")).trim()).toBe(
      "Ngũ Vương tranh đoạt Ngai Sắt.",
    );
    expect((await renderLoreContent(tpl, makeBridge({ "stat_data.Thế Giới.Năm": 290 }, stages), [], "t")).trim()).toBe("");
  });

  it("getwi lồng nhau (entry con chứa EJS) render đệ quy, có giới hạn độ sâu", async () => {
    const child = makeEntry("con", "Cấp 2: <%= getvar('x', { defaults: 'X' }) %>");
    const out = await renderLoreContent("Cấp 1 → <%- await getwi(null, 'con') %>", makeBridge({ x: "OK" }, [child]), [], "t");
    expect(out).toBe("Cấp 1 → Cấp 2: OK");

    // tự gọi chính mình → dừng ở MAX_GETWI_DEPTH, có cảnh báo, không treo
    const loop = makeEntry("loop", "vòng <%- await getwi(null, 'loop') %>");
    const warnings: string[] = [];
    const out2 = await renderLoreContent(loop.content, makeBridge({}, [loop]), warnings, "loop");
    expect(out2).toContain("vòng");
    expect(warnings.some((w) => w.includes("độ sâu"))).toBe(true);
  });

  it("getwi entry không tồn tại → cảnh báo + chuỗi rỗng, không crash", async () => {
    const warnings: string[] = [];
    const out = await renderLoreContent("<%- await getwi(null, 'ma') %>sau", makeBridge({}), warnings, "t");
    expect(out).toBe("sau");
    expect(warnings.some((w) => w.includes('"ma"'))).toBe(true);
  });

  it("entry EJS LỖI CÚ PHÁP không sập prompt — cảnh báo + bỏ entry", async () => {
    const warnings: string[] = [];
    const out = await renderLoreContent("<%_ if (x { _%>hỏng<%_ } _%>", makeBridge({}), warnings, "hỏng");
    expect(out).toBe("");
    expect(warnings.some((w) => w.includes('"hỏng"'))).toBe(true);
  });

  it("lỗi RUNTIME trong template cũng bị bắt — không throw ra ngoài", async () => {
    const warnings: string[] = [];
    const out = await renderLoreContent("<%= biến_chưa_khai_báo.field %>", makeBridge({}), warnings, "rt");
    expect(out).toBe("");
    expect(warnings.length).toBe(1);
  });
});
