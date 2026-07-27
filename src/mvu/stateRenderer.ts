/**
 * stateRenderer (5.7.3) — render Bảng Trạng Thái thành khối TIẾNG VIỆT tự nhiên
 * cho AI đọc (không phải JSON thô). Nhãn chữ đi kèm số (THÂN THIẾT (52)),
 * chi tiết giảm dần theo liên quan. Field `$` AI đọc được (ẩn UI); field `_`
 * hiển thị để AI biết nhưng bị cấm ghi (extractor chặn).
 */
import type { StatData } from "./schema";
import type { Npc } from "./npcSchema";
import { formatPersonalityForPrompt } from "../npc/personalityEngine";
import { renderReputationForAI } from "../npc/reputationEngine";
import { ERAS_BY_ID } from "../content/westeros/eras";
import { getTimelineContext } from "../content/westeros/timeline";
import { getTourneyHint } from "../content/westeros/tourneyData";

const MAX_NPC_RENDERED = 10;

function fmtNpc(name: string, npc: Npc): string {
  const lines: string[] = [];
  const stage = npc["Giai Đoạn Quan Hệ"];
  const parts = [
    `• ${name}${npc["Tuổi"] ? ` (${npc["Tuổi"]} tuổi, ${npc["Giai Đoạn Đời"]})` : ""} — Quan hệ: ${stage} (${npc["Độ Hảo Cảm"]}), Tin Cậy: ${npc["Tin Cậy"]}.`,
  ];
  if (npc["Chức Vụ"]) parts.push(`Chức: ${npc["Chức Vụ"]}.`);
  if (npc["Nhà"]) parts.push(`Nhà ${npc["Nhà"]}.`);
  if (npc["Tình Trạng"] !== "Bình Thường") parts.push(`[${npc["Tình Trạng"]}]`);
  if (!npc["Còn Sống"]) parts.push(`[ĐÃ MẤT${npc["Nguyên Nhân Nếu Mất"] ? ` — ${npc["Nguyên Nhân Nếu Mất"]}` : ""}]`);
  lines.push(parts.join(" "));

  // ký ức nổi bật nhất (trọng số cao nhất)
  const memories = [...npc["Ký Ức"]].sort((a, b) => b["Trọng Số"] - a["Trọng Số"]);
  if (memories.length > 0) {
    const m = memories[0];
    lines.push(`    Ký ức nổi bật: [Turn ${m["Turn"]}] ${m["Sự Việc"]} (${m["Cảm Xúc"]}, trọng số ${m["Trọng Số"]}).`);
  }
  if (npc["Lời Hứa Chưa Giữ"].length > 0) {
    lines.push(`    Lời hứa chưa giữ: ${npc["Lời Hứa Chưa Giữ"].map((p) => `"${p}"`).join("; ")}.`);
  }
  if (npc["$Ghi Chú Ẩn"]) {
    lines.push(`    (Bí mật chỉ ngươi biết: ${npc["$Ghi Chú Ẩn"]})`);
  }
  // tính cách (16.2)
  const personalityText = formatPersonalityForPrompt(npc);
  if (personalityText) lines.push(`    ${personalityText}`);

  // Huyết thống thật sự & Mạng lưới quan hệ (Lore context)
  if (npc["Huyết Thống Thật Sự"]) {
    const ht = npc["Huyết Thống Thật Sự"];
    if (ht["Cha/Mẹ"]?.length > 0) lines.push(`    (Huyết thống thật: Cha/mẹ ruột là ${ht["Cha/Mẹ"].join(", ")})`);
    if (ht["Con Cái"]?.length > 0) lines.push(`    (Huyết thống thật: Có con ruột bí mật là ${ht["Con Cái"].join(", ")})`);
  }
  if (npc["Mạng Lưới Quan Hệ"]) {
    const net = npc["Mạng Lưới Quan Hệ"];
    const entries = Object.entries(net);
    if (entries.length > 0) {
      const netDesc = entries.map(([tgt, info]) => `${tgt} (${info["Công Khai"] ? "Công khai" : "Bí mật"}: ${info["Loại Quan Hệ"]}${info["Chi Tiết"] ? ` - ${info["Chi Tiết"]}` : ""})`).join(" | ");
      lines.push(`    Quan hệ lore: ${netDesc}`);
    }
  }

  // quan hệ thân mật (NPC nữ)
  const intimacy = npc["Quan Hệ Thân Mật"];
  if (intimacy) {
    const parts: string[] = [`Quan hệ thân mật: ${intimacy["Vai Trò"]}`];
    if (intimacy["Số Lần Ân Ái"] > 0) {
      parts.push(`Ân ái ${intimacy["Số Lần Ân Ái"]} lần`);
      if (intimacy["Số Lần Xuất Trong"] > 0) {
        parts.push(`(${intimacy["Số Lần Xuất Trong"]} lần xuất trong)`);
      }
    }
    if (intimacy["Đang Mang Thai"]) {
      parts.push(`ĐANG MANG THAI tháng ${intimacy["Tháng Thai Kỳ"]}`);
    }
    if (intimacy["Số Con Đã Sinh"] > 0) {
      parts.push(`Đã sinh ${intimacy["Số Con Đã Sinh"]} con`);
    }
    if (intimacy["Lần Cuối Ân Ái"]) {
      parts.push(`Lần cuối: ${intimacy["Lần Cuối Ân Ái"]}`);
    }
    lines.push(`    ${parts.join(". ")}.`);
  }

  return lines.join("\n");
}

/** Khối render đầy đủ cho prompt. */
export function renderStateForAI(state: StatData): string {
  const info = state["Thông Tin Nhân Vật"];
  const vitals = state["Chỉ Số Sinh Tồn"];
  const derived = state["Chỉ Số Phái Sinh"];
  const core = state["Chỉ Số Cốt Lõi"];
  const world = state["Thế Giới"];
  const lines: string[] = [];

  lines.push("【TRẠNG THÁI HIỆN TẠI — đây là sự thật, ưu tiên hơn trí nhớ hội thoại】");

  // Era context block (chống toàn tri)
  const eraId = state["Cài Đặt Ván"]["Thời Kỳ"] ?? "";
  const eraData = ERAS_BY_ID[eraId];
  if (eraData) {
    lines.push(
      `[BỐI CẢNH THỜI KỲ] ${eraData.name} | Năm: ${world["Năm"]} AC | Mùa: ${world["Mùa"]}`,
      getTimelineContext(world["Năm"]),
      `⛔ GIỚI HẠN KIẾN THỨC: Mọi thông tin chỉ hợp lệ tới năm ${world["Năm"]} AC. KHÔNG tham chiếu sự kiện/nhân vật sau mốc này.`,
    );
    // ── Đại hội đấu sắp diễn ra (tourney hint) ──
    const tourneyHint = getTourneyHint(world["Năm"], world["Ngày"]);
    if (tourneyHint) {
      lines.push(
        `[ĐẠI HỘI ĐẤU]\n${tourneyHint}\n→ Khi nhân vật đến gần hoặc nghe tin, dùng thẻ <tourney tourney-id="ID" location="Địa Điểm">mô tả</tourney> để hiển thị thông tin đại hội cho người chơi.`,
      );
    }
  }
  lines.push(
    `Nhân vật: ${info["Họ Tên"]}, ${info["Tuổi"]} tuổi (${info["Giai Đoạn Đời"]}), Nhà ${info["Nhà"]}. Cấp ${info["Cấp Độ"]} (EXP ${info["Kinh Nghiệm"]}). ` +
      `HP ${vitals["HP"]}/${derived["_HP Tối Đa"]}. Thể Lực ${vitals["Thể Lực"]}/${derived["_Thể Lực Tối Đa"]}.` +
      (vitals["Pháp Lực"] > 0 ? ` Pháp Lực ${vitals["Pháp Lực"]}.` : "") +
      ` Vàng ${info["Ngân Khố"].toLocaleString("vi-VN")}.`,
  );
  lines.push(
    `Chỉ số: Sức Mạnh ${core["Sức Mạnh"]} · Nhanh Nhẹn ${core["Nhanh Nhẹn"]} · Thể Chất ${core["Thể Chất"]} · ` +
      `Trí Tuệ ${core["Trí Tuệ"]} · Tinh Tường ${core["Tinh Tường"]} · Uy Tín ${core["Uy Tín"]}.`,
  );
  lines.push(`Vị trí: ${world["Vị Trí"]}. Ngày ${world["Ngày"]}, năm ${world["Năm"]} AC. Mùa: ${world["Mùa"]}. Thời tiết: ${world["Thời Tiết"]}.`);
  lines.push(`Chế độ: ${state["Chế Độ Hiện Tại"]}.`);
  lines.push(renderReputationForAI(state));

  // thiên phú + kỹ năng có cấp
  const talents = Object.entries(state["Thiên Phú"]).filter(([, t]) => !t["Ẩn"]);
  if (talents.length > 0) {
    lines.push(`Thiên phú: ${talents.map(([name, t]) => `${name}${t["Hiệu Ứng"] ? ` (${t["Hiệu Ứng"]})` : ""}`).join(" · ")}.`);
  }
  const skills = Object.entries(state["Kỹ Năng"]).filter(([, s]) => s["Cấp"] > 0);
  if (skills.length > 0) {
    lines.push(`Kỹ năng: ${skills.map(([name, s]) => `${name} cấp ${s["Cấp"]}`).join(" · ")}.`);
  }

  // trang bị đang mặc
  const equipped = Object.entries(state["Trang Bị Đang Mặc"]).filter(([, item]) => item && item["Tên"]);
  if (equipped.length > 0) {
    lines.push(`Trang bị: ${equipped.map(([slot, item]) => `${slot}: ${item!["Tên"]} (${item!["Phẩm Chất"]})`).join(" · ")}.`);
  }

  // túi đồ (gọn)
  const items = Object.entries(state["Túi Đồ"]);
  if (items.length > 0) {
    lines.push(`Túi đồ: ${items.slice(0, 15).map(([name, it]) => `${name}×${it["Số Lượng"]}`).join(", ")}${items.length > 15 ? "…" : ""}.`);
  }

  // rồng (7.15 mở rộng)
  const dragons = Object.entries(state["Rồng"]);
  if (dragons.length > 0) {
    lines.push("", "Rồng:");
    for (const [, drg] of dragons) {
      const stats = drg["Chỉ Số"];
      const drgSkills = Object.entries(drg["Kỹ Năng"]).filter(([, lv]) => lv > 0);
      const affinity = Object.entries(drg["Độ Hảo Cảm"] || {}).map(([n, a]) => `${n}(${a})`).join(", ");
      
      lines.push(
        `• ${drg["Tên"]} (${drg["Kích Cỡ"]}, màu ${drg["Màu Sắc"]}, ${drg["Tuổi"]} tuổi, ${drg["Trạng Thái Thu Phục"]}). ` +
          `HP ${drg["_HP"]}/${drg["_HP Tối Đa"]}. Tình Trạng: ${drg["Tình Trạng"]}. ` +
          (drg["Đang Bị Xích"] ? `ĐANG BỊ XÍCH (${drg["Nơi Ổ"] || "Chưa rõ"}). ` : "") +
          (drg["Kỵ Sĩ"] ? ` Kỵ Sĩ: ${drg["Kỵ Sĩ"]}. ` : ` Mức Độ Thuần Hóa: ${drg["Mức Độ Thuần Hóa"]}/100. `) +
          (affinity ? ` Hảo cảm: ${affinity}. ` : "")
      );
      if (stats) {
        lines.push(
          `  Chỉ số: Sức Lửa ${stats["Sức Lửa"]} · Sức Bay ${stats["Sức Bay"]} · Giáp Vảy ${stats["Giáp Vảy"]} · ` +
            `Hung Dữ ${stats["Hung Dữ"]} · Trung Thành ${stats["Trung Thành"]}.`
        );
      }
      const dTraits = drg["Đặc Tính"] || [];
      if (dTraits.length > 0) {
        lines.push(`  Đặc tính: ${dTraits.join(", ")}`);
      }
      if (drgSkills.length > 0) {
        lines.push(`  Kỹ năng: ${drgSkills.map(([name, lv]) => `${name} cấp ${lv}`).join(" · ")}.`);
      }
      if (drg["Mô Tả"]) {
        lines.push(`  Mô tả: ${drg["Mô Tả"]}`);
      }
    }
  }

  // trứng rồng
  const eggs = Object.entries(state["Trứng Rồng"] || {});
  if (eggs.length > 0) {
    lines.push("", "Trứng rồng:");
    for (const [id, egg] of eggs) {
      lines.push(`• ${egg["Tên"] || id} (Màu: ${egg["Màu Sắc"]}) — Nhiệt độ: ${egg["Nhiệt Độ"]}, Tình trạng: ${egg["Tình Trạng"]}${egg["Chủ Nhân"] ? `, Chủ nhân: ${egg["Chủ Nhân"]}` : ""}. ${egg["Mô Tả"]}`);
    }
  }

  // NPC — ưu tiên |hảo cảm| lớn (quan hệ đậm nhất), tối đa MAX_NPC_RENDERED
  const allNpcs: [string, Npc][] = [
    ...Object.entries(state["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];
  if (allNpcs.length > 0) {
    const sorted = allNpcs.sort((a, b) => Math.abs(b[1]["Độ Hảo Cảm"]) - Math.abs(a[1]["Độ Hảo Cảm"]));
    lines.push("", "NPC quen biết:");
    for (const [name, npc] of sorted.slice(0, MAX_NPC_RENDERED)) lines.push(fmtNpc(name, npc));
    if (sorted.length > MAX_NPC_RENDERED) {
      lines.push(`… và ${sorted.length - MAX_NPC_RENDERED} người khác: ${sorted.slice(MAX_NPC_RENDERED).map(([n]) => n).join(", ")}.`);
    }
  }

  // thái độ các Nhà
  const houses = Object.entries(state["Thái Độ Các Nhà"]);
  if (houses.length > 0) {
    lines.push("", `Các Nhà: ${houses.map(([name, h]) => `${name} → ${h["Thái Độ"].toUpperCase()}`).join(" · ")}.`);
  }

  // chủ quyền lãnh thổ của người chơi (9.5.1) — chỉ liệt kê vùng của ta cho gọn
  const owned = Object.entries(state["Chủ Quyền Lãnh Thổ"]).filter(([, s]) => s["Là Của Người Chơi"]);
  if (owned.length > 0) {
    lines.push(
      "",
      `Lãnh thổ của ngươi: ${owned.map(([id, s]) => `${id}${s["Tình Trạng"] !== "Ổn Định" ? ` [${s["Tình Trạng"]}]` : ""}`).join(", ")}.`,
    );
  }

  // triều đình (13.1) — chỉ render nếu có dính líu (13.5)
  const court = state["Triều Đình"];
  if (court["Có Liên Quan"]) {
    const seats = Object.entries(court["Tiểu Hội Đồng"]).filter(([, s]) => s["Người Giữ Chức"] && s["Người Giữ Chức"] !== "Khuyết");
    lines.push("", `Triều đình${court["Triều Đình Của"] ? ` (${court["Triều Đình Của"]})` : ""}: ${court["Quyền Bổ Nhiệm"] ? "ngươi có quyền bổ nhiệm" : "ngươi chưa có quyền bổ nhiệm trực tiếp"}.`);
    if (seats.length > 0) {
      lines.push(`Tiểu Hội Đồng: ${seats.map(([pos, s]) => `${pos}: ${s["Người Giữ Chức"]} (Năng Lực ${s["Năng Lực"]})`).join(" · ")}.`);
    }
  }

  // kế vị (13.4)
  const gia = state["Gia Tộc Học"];
  if (gia["Người Thừa Kế Hiện Tại"] || gia["Thứ Tự Kế Vị"].length > 0) {
    lines.push(
      `Kế vị (${gia["Luật Kế Vị"]}): người thừa kế ${gia["Người Thừa Kế Hiện Tại"] || "chưa rõ"}` +
        (gia["Thứ Tự Kế Vị"].length > 1 ? `, tiếp theo ${gia["Thứ Tự Kế Vị"].slice(1, 4).join(", ")}` : "") +
        ".",
    );
    if (gia["_Khủng Hoảng Kế Vị"]) lines.push("⚠ ĐANG CÓ KHỦNG HOẢNG KẾ VỊ — tranh chấp thừa kế cần được giải quyết.");
  }
  const betrothals = Object.entries(gia["Hôn Ước Đang Thương Lượng"]);
  if (betrothals.length > 0) {
    lines.push(`Hôn ước đang thương lượng: ${betrothals.map(([, b]) => `${b["Đối Tượng"]} (Nhà ${b["Nhà Đối Tác"]})`).join(", ")}.`);
  }

  // tình báo & mưu đồ (14.1-14.2) — chỉ render khi có hoạt động
  const intel = state["Tình Báo"];
  const spies = Object.entries(intel["Điệp Viên"]);
  if (spies.length > 0) {
    lines.push("", `Điệp viên: ${spies.map(([n, s]) => `${n} (cài ở ${s["Cài Ở"] || "?"}, ${s["Nhiệm Vụ"]}, nghi ngờ ${s["Bị Nghi Ngờ"]})`).join(" · ")}.`);
  }
  if (intel["_Điệp Viên Vừa Lộ"]) {
    lines.push(`⚠ ĐIỆP VIÊN VỪA BỊ LỘ: ${intel["_Điệp Viên Vừa Lộ"]} — hãy tường thuật hắn bị bắt và hệ quả.`);
  }
  const intelKnown = Object.entries(intel["Tin Tình Báo Đã Biết"]);
  if (intelKnown.length > 0) {
    lines.push(`Tin tình báo đã biết: ${intelKnown.slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(" | ")}.`);
  }
  const plots = Object.entries(state["Âm Mưu"]);
  if (plots.length > 0) {
    lines.push(`Âm mưu đang chạy: ${plots.map(([n, p]) => `${n} (${p["Loại"]} nhắm ${p["Mục Tiêu"]}, tiến độ ${p["Tiến Độ"]}/bại lộ ${p["Độ Bại Lộ"]})`).join(" · ")}.`);
  }
  const captives = Object.entries(state["Tù Binh"]);
  if (captives.length > 0) {
    lines.push(`Con tin đang giữ: ${captives.map(([n, c]) => `${c["Họ Tên"] || n} (Nhà ${c["Nhà"] || "?"}, ${c["Đối Xử"]}, chuộc ${c["Giá Chuộc"]})`).join(" · ")}.`);
  }

  // lãnh địa quản lý (10.1) — tài nguyên + công trình đang xây, gọn
  const holdings = Object.entries(state["Lãnh Địa"]);
  if (holdings.length > 0) {
    lines.push("Lãnh địa quản lý:");
    for (const [name, terr] of holdings.slice(0, 6)) {
      const building = Object.entries(terr["Công Trình"]);
      const inProgress = building.filter(([, b]) => b["Đang Xây"]).map(([bn, b]) => `${bn} (còn ${b["Turn Còn Lại"]} turn)`);
      const done = building.filter(([, b]) => !b["Đang Xây"]).map(([bn, b]) => `${bn} c${b["Cấp Độ"]}`);
      const parts = [`• ${name}: Dân ${terr["Dân Số"].toLocaleString("vi-VN")}, Lòng Dân ${terr["Trung Thành"]}`];
      if (done.length > 0) parts.push(`Công trình: ${done.join(", ")}`);
      if (inProgress.length > 0) parts.push(`Đang xây: ${inProgress.join(", ")}`);
      lines.push(`  ${parts.join(". ")}.`);
    }
  }

  // tin tức off-screen (16.3 + GĐ2) — NPC tự chủ + vắng mặt
  const offscreenNews = world["_Tin Nóng Off-screen"];
  if (offscreenNews) {
    lines.push("", `Tin tức ngoài cảnh: ${offscreenNews}`);
  }

  // GĐ2: NPC vắng mặt — vị trí hiện tại + hoạt động gần nhất
  const playerLoc = world["Vị Trí"]?.toString().toLowerCase().trim();
  const absentNpcs: string[] = [];
  for (const [name, npc] of Object.entries(state["Mối Quan Hệ"]["NPC Chính"]) as [string, Npc][]) {
    if (!npc["Còn Sống"]) continue;
    const npcLoc = npc["Vị Trí Hiện Tại"]?.toLowerCase().trim();
    if (!npcLoc || npcLoc === playerLoc) continue; // cùng scene hoặc không rõ → bỏ qua
    const lastMemory = npc["Ký Ức"].length > 0 ? npc["Ký Ức"][npc["Ký Ức"].length - 1] : null;
    const activity = lastMemory ? `, gần nhất: ${lastMemory["Sự Việc"]}` : "";
    absentNpcs.push(`${name}: ${npc["Vị Trí Hiện Tại"]}${npc["Tình Trạng"] !== "Bình Thường" ? ` [${npc["Tình Trạng"]}]` : ""}${activity}`);
  }
  if (absentNpcs.length > 0) {
    lines.push("", "NPC vắng mặt (off-screen):");
    for (const entry of absentNpcs.slice(0, 8)) {
      lines.push(`  • ${entry}`);
    }
  }

  // nhiệm vụ đang làm (17.2) — AI biết để tường thuật phù hợp
  const activeQuests = Object.entries(state["Nhiệm Vụ"]).filter(([, q]) => q["Trạng Thái"] === "Đang Làm");
  if (activeQuests.length > 0) {
    lines.push("", "Nhiệm vụ đang làm:");
    for (const [, q] of activeQuests.slice(0, 5)) {
      const done = q["Mục Tiêu"].filter((o) => o["Xong"]).length;
      const total = q["Mục Tiêu"].length;
      const deadline = q["Hạn Chót Turn"];
      const parts = [`• ${q["Tiêu Đề"]} [${q["Loại"]}] (${done}/${total} mục tiêu)`];
      if (deadline !== undefined) {
        const left = deadline - state["_engineMeta"]["turnCount"];
        parts.push(left > 0 ? `còn ${left} lượt` : "HẾT HẠN!");
      }
      lines.push(`  ${parts.join(" — ")}`);
    }
  }

  // cột mốc sắp tới (17.3) — AI biết sự kiện canon sắp xảy ra
  if (eraId) {
    // Chỉ đọc state đã ghi — không import timelineBeats để giữ renderer thuần
    const allBeats = state["Cột Mốc Lịch Sử"];
    const pastIds = Object.entries(allBeats).filter(([, b]) => b["Đã Xảy Ra"]).map(([id]) => id);
    if (pastIds.length > 0) {
      const alteredIds = Object.entries(allBeats).filter(([, b]) => b["Bị Thay Đổi"]).map(([id]) => id);
      if (alteredIds.length > 0) {
        lines.push("", `Lịch sử đã bị thay đổi: ${alteredIds.join(", ")}`);
      }
    }
  }

  return lines.join("\n");
}
