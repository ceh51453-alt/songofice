/**
 * stateRenderer (5.7.3) — render Bảng Trạng Thái thành khối TIẾNG VIỆT tự nhiên
 * cho AI đọc (không phải JSON thô). Nhãn chữ đi kèm số (THÂN THIẾT (52)),
 * chi tiết giảm dần theo liên quan. Field `$` AI đọc được (ẩn UI); field `_`
 * hiển thị để AI biết nhưng bị cấm ghi (extractor chặn).
 */
import type { StatData } from "./schema";
import { absoluteDay, dayOfYear, formatDate, formatDuration } from "./calendar";
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
    lines.push(`    Ký ức nổi bật: [ngày ${m["Ngày"]}/${m["Tháng"]}${m["Năm"] !== undefined ? `/${m["Năm"]} AC` : ""}] ${m["Sự Việc"]} (${m["Cảm Xúc"]}, trọng số ${m["Trọng Số"]}).`);
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

/**
 * QUÂN ĐỘI (M19) — trước đây khối trạng thái không hề nhắc tới quân, nên AI kể
 * chuyện chiến tranh bằng trí tưởng tượng: bịa ra quân không có, quên mất đám
 * dân phục dịch sắp hết hạn, và không bao giờ biết chư hầu nào đang trên đường.
 * Khối này bịt đúng lỗ đó.
 */
function renderMilitaryForAI(state: StatData): string[] {
  const lines: string[] = [];
  const house = String(state["Thông Tin Nhân Vật"]["Nhà"] ?? "").toLowerCase();
  const units = Object.entries(state["Biên Chế Quân Sự"] ?? {}).filter(
    ([, u]) => u["Số Lượng"] > 0 && (!u["Nhà"] || !house || String(u["Nhà"]).toLowerCase() === house),
  );

  if (units.length > 0) {
    const total = units.reduce((s, [, u]) => s + u["Số Lượng"], 0);
    const byBranch = new Map<string, number>();
    for (const [, u] of units) byBranch.set(u["Ngạch"], (byBranch.get(u["Ngạch"]) ?? 0) + u["Số Lượng"]);
    lines.push(
      "",
      `Quân đội dưới cờ ngươi: ${total.toLocaleString("vi-VN")} người ` +
        `(${[...byBranch].map(([b, n]) => `${b} ${n.toLocaleString("vi-VN")}`).join(", ")}).`,
    );
    for (const [name, u] of units.slice(0, 10)) {
      const parts = [
        `• ${name}: ${u["Số Lượng"].toLocaleString("vi-VN")} ${u["Loại Quân"]} [${u["Ngạch"]}]`,
        `Sĩ khí ${u["Sĩ Khí"]}, huấn luyện ${u["Huấn Luyện"]} (KN ${u["Kinh Nghiệm"]}/100), trang bị ${u["Trang Bị"]}, hậu cần ${u["Hậu Cần"]}`,
      ];
      if (u["Tướng Chỉ Huy"] && u["Tướng Chỉ Huy"] !== "Tạm Khuyết") parts.push(`Chủ tướng ${u["Tướng Chỉ Huy"]}`);
      if (u["Ngày Tập Hợp Còn Lại"] > 0) parts.push(`ĐANG TẬP HỢP, còn ${formatDuration(u["Ngày Tập Hợp Còn Lại"])} mới tụ đủ`);
      else if (u["Ngày Huấn Luyện"] > 0) parts.push(`đang huấn luyện, còn ${formatDuration(u["Ngày Huấn Luyện"])}`);
      else if (u["Đang Di Chuyển Đến"]) parts.push(`đang hành quân tới ${u["Đang Di Chuyển Đến"]}, còn ${formatDuration(u["Ngày Hành Quân Còn Lại"])}`);
      else parts.push(`đóng tại ${u["Lãnh Địa Đồn Trú"] || "chưa rõ"}`);
      if (u["Thương Binh"] > 0) parts.push(`${u["Thương Binh"].toLocaleString("vi-VN")} thương binh nằm trại`);
      if (u["Hạn Phục Dịch Còn Lại"] > 0) {
        parts.push(
          u["Hạn Phục Dịch Còn Lại"] <= 15
            ? `SẮP HẾT HẠN NGHĨA VỤ (${formatDuration(u["Hạn Phục Dịch Còn Lại"])}) — lính đã nghĩ tới đồng ruộng`
            : `hạn nghĩa vụ còn ${formatDuration(u["Hạn Phục Dịch Còn Lại"])}`,
        );
      }
      if (u["Lương Thực Mang Theo"] <= 5 && !u["Lãnh Địa Đồn Trú"]) parts.push("LƯƠNG KHÔ SẮP CẠN");
      if (u["Ghi Chú"]) parts.push(u["Ghi Chú"]);
      lines.push(parts.join(". ") + ".");
    }
    if (units.length > 10) lines.push(`  … và ${units.length - 10} đơn vị khác.`);
  } else {
    lines.push("", "Quân đội dưới cờ ngươi: KHÔNG CÓ đơn vị nào — đừng kể như thể ngươi đang cầm quân.");
  }

  // chư hầu (M19)
  const vassals = Object.entries(state["Chư Hầu"] ?? {});
  if (vassals.length > 0) {
    const marching = vassals.filter(([, v]) => v["Trạng Thái"] === "Đang Hành Quân");
    const arrived = vassals.filter(([, v]) => v["Trạng Thái"] === "Đã Tới");
    const refused = vassals.filter(([, v]) => v["Trạng Thái"] === "Từ Chối");
    const pledged = vassals.reduce((s, [, v]) => s + v["Quân Cam Kết"], 0);
    lines.push(
      "",
      `Chư hầu (${vassals.length} nhà, tổng cam kết ~${pledged.toLocaleString("vi-VN")} quân): ` +
        vassals
          .slice(0, 8)
          .map(([, v]) => `${v["Tên Nhà"]} (${v["Thành Trì"]}, trung thành ${v["Trung Thành"]}, ${v["Trạng Thái"]})`)
          .join(" · ") + ".",
    );
    if (marching.length > 0) {
      lines.push(
        `  Đang trên đường tới: ${marching.map(([, v]) => `${v["Tên Nhà"]} ${v["Quân Đã Gửi"].toLocaleString("vi-VN")} quân (còn ${formatDuration(v["Ngày Tới Nơi"])})`).join(", ")}.`,
      );
    }
    if (arrived.length > 0) {
      lines.push(
        `  Đã có mặt dưới cờ: ${arrived.map(([, v]) => `${v["Tên Nhà"]} (${v["Ngày Tòng Quân"]} ngày tòng quân)`).join(", ")}. Giữ quá lâu là bào mòn lòng trung.`,
      );
    }
    if (refused.length > 0) {
      lines.push(`  ⚠ TỪ CHỐI hiệu triệu: ${refused.map(([, v]) => v["Tên Nhà"]).join(", ")} — đây là chuyện chính trị, hãy kể cho ra chuyện.`);
    }
  }

  // chợ lính đánh thuê (M19)
  const companies = Object.entries(state["Đội Đánh Thuê"] ?? {}).filter(([, c]) => c["Quân Số"] > 0);
  if (companies.length > 0) {
    lines.push(
      "",
      `Đoàn đánh thuê đang chào giá quanh đây: ` +
        companies
          .map(([, c]) => `${c["Tên Đoàn"]} (${c["Quân Số"].toLocaleString("vi-VN")} ${c["Binh Chủng"]}, ${c["Huấn Luyện"]}, chữ tín ${c["Chữ Tín"]}/100, còn nán ${formatDuration(c["Ngày Còn Ở Lại"])})`)
          .join(" · ") + ".",
    );
  }

  return lines;
}

/**
 * NGOẠI GIAO (M20) — trước đây khối trạng thái chỉ đưa AI một dòng "Các Nhà: X →
 * CẢNH GIÁC", nên AI không thể biết ta đang có hiệp ước gì, đình chiến còn mấy
 * ngày, hay Nhà nào đang giữ cớ để đánh ta. Khối này bịt lỗ đó.
 */
function renderDiplomacyForAI(state: StatData): string[] {
  const lines: string[] = [];
  const dip = state["Ngoại Giao"];
  const rels = Object.entries(state["Quan Hệ Ngoại Giao"] ?? {});
  const today = absoluteDay(state["Thế Giới"]);

  if (rels.length > 0) {
    lines.push("", `Ngoại giao — uy tín cam kết của ngươi: ${dip["Uy Tín Cam Kết"]}/100 ` +
      `(${dip["Uy Tín Cam Kết"] >= 70 ? "lời ngươi đáng giá" : dip["Uy Tín Cam Kết"] >= 40 ? "người ta còn dè dặt" : "KHÔNG AI TIN LỜI NGƯƠI NỮA"}).`);
    for (const [houseId, r] of rels) {
      const parts = [`• ${houseId}: ${r["Trạng Thái"]}`];
      if (r["Trạng Thái"] === "Chiến Tranh") parts.push(`War Score ${r["War Score"] > 0 ? "+" : ""}${r["War Score"]}`);
      parts.push(`lòng tin ${r["Tin Cậy"]}`);
      if (r["Ngày Hết Hạn Đình Chiến"] > 0) {
        const left = r["Ngày Hết Hạn Đình Chiến"] - today;
        parts.push(left > 0 ? `đình chiến còn ${formatDuration(left)}` : "ĐÌNH CHIẾN VỪA HẾT HẠN");
      }
      const active = r["Hiệp Ước"].filter((t) => t["Còn Hiệu Lực"]);
      if (active.length > 0) {
        parts.push(`hiệp ước: ${active.map((t) => t["Loại"] + (t["Điều Khoản"] ? ` (${t["Điều Khoản"]})` : "")).join(", ")}`);
      }
      const broken = r["Hiệp Ước"].filter((t) => !t["Còn Hiệu Lực"] && t["Bên Phá"]);
      if (broken.length > 0) parts.push(`đã bị xé: ${broken.map((t) => `${t["Loại"]} (bởi ${t["Bên Phá"]})`).join(", ")}`);
      if (r["_Cống Nạp Tháng"] !== 0) {
        parts.push(r["_Cống Nạp Tháng"] > 0 ? `họ cống ta ${r["_Cống Nạp Tháng"]}/tháng` : `ta cống họ ${-r["_Cống Nạp Tháng"]}/tháng`);
      }
      const ours = r["Ân Oán"].filter((g) => g["Bên Nợ"] === "Họ Nợ Ta");
      const theirs = r["Ân Oán"].filter((g) => g["Bên Nợ"] === "Ta Nợ Họ");
      if (ours.length > 0) parts.push(`TA CÓ CỚ (${ours.reduce((s, g) => s + g["Mức"], 0)}): ${ours.slice(0, 3).map((g) => g["Việc"]).join("; ")}`);
      if (theirs.length > 0) parts.push(`HỌ CÓ CỚ (${theirs.reduce((s, g) => s + g["Mức"], 0)}): ${theirs.slice(0, 3).map((g) => g["Việc"]).join("; ")}`);
      if (r["Ghi Chú"]) parts.push(r["Ghi Chú"]);
      lines.push(parts.join(" · ") + ".");
    }
  }

  const envoys = Object.entries(dip["Sứ Giả"] ?? {}).filter(([, e]) => e["Trạng Thái"] !== "Đã Về");
  if (envoys.length > 0) {
    lines.push(`Sứ giả đang đi: ${envoys.map(([n, e]) => `${n} → ${e["Tới Nhà"]} (${e["Nhiệm Vụ"]}, ${e["Trạng Thái"]}, còn ${formatDuration(e["Ngày Còn Lại"])})`).join(" · ")}.`);
  }
  const offers = Object.entries(dip["Lời Đề Nghị"] ?? {});
  if (offers.length > 0) {
    lines.push(
      "Lời đề nghị ĐANG CHỜ NGƯỜI CHƠI TRẢ LỜI (họ trả lời bằng lời trong cuộc chơi, không có nút bấm):",
      ...offers.map(([k, o]) => {
        const left = o["Ngày Hết Hạn Trả Lời"] - today;
        return `  • [${k}] ${o["Từ Nhà"]} đề nghị ${o["Loại"]}: ${o["Điều Khoản"] || "(chưa rõ điều khoản)"}` +
          (o["Cống Nạp Tháng"] ? `, cống nạp ${o["Cống Nạp Tháng"]}/tháng` : "") +
          (o["Số Năm"] ? `, ${o["Số Năm"]} năm` : "") +
          (left > 0 ? ` — còn ${formatDuration(left)} để trả lời` : " — SẮP HẾT HẠN");
      }),
    );
  }
  if (dip["_Biến Động"]) {
    lines.push(`⚠ BIẾN ĐỘNG NGOẠI GIAO: ${dip["_Biến Động"]} — hãy tường thuật việc này.`);
  }
  return lines;
}

/** MƯU ĐỒ (M20) — tai mắt có vỏ bọc, bí mật có sức nặng, âm mưu có giai đoạn. */
function renderIntrigueForAI(state: StatData): string[] {
  const lines: string[] = [];
  const intel = state["Tình Báo"];

  const spies = Object.entries(intel["Điệp Viên"]);
  if (spies.length > 0) {
    lines.push("", "Tai mắt của ngươi:");
    for (const [n, s] of spies) {
      const risk = s["Bị Nghi Ngờ"] >= 80 ? " ⚠ SẮP BỊ LỘ" : s["Vỏ Bọc"] <= 20 ? " ⚠ vỏ bọc gần như trần trụi" : "";
      lines.push(
        `  • ${n} (${s["Hạng"]}) cài ở ${s["Cài Ở"] || "?"} — ${s["Nhiệm Vụ"]}, thâm nhập ${s["Độ Sâu Thâm Nhập"]}, ` +
          `nghi ngờ ${s["Bị Nghi Ngờ"]}, vỏ bọc ${Math.round(s["Vỏ Bọc"])}` +
          (s["Người Điều Khiển"] ? `, đầu mối qua ${s["Người Điều Khiển"]}` : "") +
          `, đã gửi ${s["Số Tin Đã Gửi"]} tin.${risk}`,
      );
    }
  }
  if (intel["_Điệp Viên Vừa Lộ"]) {
    lines.push(`⚠ ĐIỆP VIÊN VỪA BỊ LỘ: ${intel["_Điệp Viên Vừa Lộ"]} — hãy tường thuật hắn bị bắt và hệ quả.`);
  }
  if (intel["Bị Cài Điệp Viên"] > 0) {
    lines.push(`Sân nhà ngươi bị thâm nhập: ${intel["Bị Cài Điệp Viên"]}/100.`);
  }
  const enemySpies = Object.entries(intel["Điệp Viên Địch"] ?? {});
  if (enemySpies.length > 0) {
    lines.push(
      `Kẻ bị nghi là tai mắt của địch: ${enemySpies.map(([k, e]) => `${k} (của ${e["Của Nhà"] || "?"}, chứng cứ ${e["Chứng Cứ"]}${e["Đang Rình"] ? `, rình ${e["Đang Rình"]}` : ""})`).join(" · ")}.`,
      "  (bắt khi chứng cứ dưới 60 là bắt oan — mất mặt và Nhà kia có cớ oán)",
    );
  }

  const secrets = Object.entries(intel["Bí Mật"] ?? {});
  if (secrets.length > 0) {
    lines.push("Sổ bí mật (đòn bẩy = sức nặng × độ tin):");
    for (const [k, s] of secrets.slice(0, 8)) {
      const flags = [s["Đã Dùng"] ? "đã dùng" : "", s["Đã Lan Ra"] ? "đã lan ra" : ""].filter(Boolean).join(", ");
      lines.push(
        `  • [${k}] về ${s["Về Ai"] || "?"}: ${s["Nội Dung"] || "(NGƯƠI CHƯA VIẾT NỘI DUNG — hãy phát thẻ <secret> điền vào)"}` +
          ` — nặng ${s["Sức Nặng"]}, tin ${s["Độ Tin Cậy"]}${s["Nguồn"] ? `, nguồn ${s["Nguồn"]}` : ""}${flags ? ` [${flags}]` : ""}`,
      );
    }
  }

  const plots = Object.entries(state["Âm Mưu"]);
  if (plots.length > 0) {
    lines.push("Âm mưu đang chạy:");
    for (const [n, p] of plots) {
      lines.push(
        `  • ${n} (${p["Loại"]} nhắm ${p["Mục Tiêu"] || "?"}) — giai đoạn ${p["Giai Đoạn"]}, ` +
          `tiến độ ${Math.round(p["Tiến Độ"])}/bại lộ ${Math.round(p["Độ Bại Lộ"])}` +
          (p["Đồng Mưu"].length > 0 ? `, đồng mưu: ${p["Đồng Mưu"].join(", ")}` : "") +
          (p["Kẻ Điều Tra"] ? `, ⚠ ${p["Kẻ Điều Tra"]} đang lần theo dấu` : "") +
          (p["Hậu Quả Nếu Lộ"] ? `. Nếu vỡ: ${p["Hậu Quả Nếu Lộ"]}` : ""),
      );
    }
  }
  if (intel["_Âm Mưu Vừa Vỡ"]) {
    lines.push(`⚠ ÂM MƯU VỪA VỠ: ${intel["_Âm Mưu Vừa Vỡ"]} — mục tiêu đã biết, hãy kể cảnh phản đòn.`);
  }

  const captives = Object.entries(state["Tù Binh"]);
  if (captives.length > 0) {
    lines.push(`Con tin đang giữ: ${captives.map(([n, c]) => `${c["Họ Tên"] || n} (Nhà ${c["Nhà"] || "?"}, ${c["Đối Xử"]}, chuộc ${c["Giá Chuộc"]})`).join(" · ")}.`);
  }
  return lines;
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
      `[BỐI CẢNH THỜI KỲ] ${eraData.name} | ${formatDate(world)} | Mùa: ${world["Mùa"]}`,
      getTimelineContext(world["Năm"]),
      `⛔ GIỚI HẠN KIẾN THỨC: Mọi thông tin chỉ hợp lệ tới năm ${world["Năm"]} AC. KHÔNG tham chiếu sự kiện/nhân vật sau mốc này.`,
    );
    // ── Đại hội đấu sắp diễn ra (tourney hint) ──
    const tourneyHint = getTourneyHint(world["Năm"], dayOfYear(world));
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
  lines.push(`Vị trí: ${world["Vị Trí"]}. Hôm nay là ${formatDate(world)}. Mùa: ${world["Mùa"]}. Thời tiết: ${world["Thời Tiết"]}.`);
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

  // ── QUÂN ĐỘI (M19) — AI phải BIẾT mình có bao nhiêu quân, ngạch gì, ở đâu,
  // còn bao nhiêu ngày nghĩa vụ, mới kể đúng được chuyện hành quân và chiến trận.
  lines.push(...renderMilitaryForAI(state));

  // rồng (7.15 mở rộng)
  const dragons = Object.entries(state["Rồng"]);
  if (dragons.length > 0) {
    lines.push("", "Rồng:");
    for (const [, drg] of dragons) {
      const stats = drg["Chỉ Số"];
      const drgSkills = Object.entries(drg["Kỹ Năng"]).filter(([, lv]) => lv > 0);
      const affinity = Object.entries(drg["Độ Hảo Cảm"] || {}).map(([n, a]) => `${n}(${a})`).join(", ");
      
      lines.push(
        `• ${drg["Tên"]} (${drg["Kích Cỡ"]}, màu ${drg["Màu Sắc"]}, ${drg["Tuổi"]} tuổi, sải cánh ~${drg["_Sải Cánh"]}m, ${drg["Trạng Thái Thu Phục"]}). ` +
          `HP ${drg["_HP"]}/${drg["_HP Tối Đa"]}. Tình Trạng: ${drg["Tình Trạng"]}. ` +
          (drg["Đang Bị Xích"] ? `ĐANG BỊ XÍCH (${drg["Nơi Ổ"] || "Chưa rõ"}). ` : "") +
          (drg["Kỵ Sĩ"] ? ` Kỵ Sĩ: ${drg["Kỵ Sĩ"]}. ` : ` Mức Độ Thuần Hóa: ${drg["Mức Độ Thuần Hóa"]}/100. `) +
          (affinity ? ` Hảo cảm: ${affinity}. ` : "")
      );
      const drgPlace = drg["Đang Bay Đến"]
        ? `đang bay tới ${drg["Đang Bay Đến"]} (còn ${formatDuration(drg["Ngày Bay Còn Lại"])})`
        : `đậu tại ${drg["Đồn Trú"] || drg["Nơi Ổ"] || "chưa rõ"}`;
      const hungry = drg["Độ Đói"] >= 80 ? "ĐÓI CỒN CÀO (dễ nổi loạn, tự đi săn)"
        : drg["Độ Đói"] >= 50 ? "đang đói" : "no đủ";
      lines.push(
        `  Vị trí: ${drgPlace}. ${hungry} (ăn ~${drg["_Khẩu Phần Tháng"]} phần/tháng). ` +
          `Đã qua ${drg["Số Trận"]} trận (kinh nghiệm ${drg["Kinh Nghiệm"]}/100).` +
          ((drg["Vết Thương"]?.length ?? 0) > 0 ? ` Vết thương: ${drg["Vết Thương"].join(", ")} — còn ${formatDuration(drg["Ngày Hồi Phục Còn Lại"])} mới lành.` : ""),
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

  // ── NGOẠI GIAO (M20) — pháp lý + hiệp ước + ân oán + lòng tin ──
  lines.push(...renderDiplomacyForAI(state));

  // ── MƯU ĐỒ (M20) — tai mắt, vỏ bọc, sổ bí mật, phản gián, âm mưu ──
  lines.push(...renderIntrigueForAI(state));

  // lãnh địa quản lý (10.1) — tài nguyên + công trình đang xây, gọn
  const holdings = Object.entries(state["Lãnh Địa"]);
  if (holdings.length > 0) {
    lines.push("Lãnh địa quản lý:");
    for (const [name, terr] of holdings.slice(0, 6)) {
      const building = Object.entries(terr["Công Trình"]);
      const inProgress = building.filter(([, b]) => b["Đang Xây"]).map(([bn, b]) => `${bn} (còn ${formatDuration(b["Ngày Xây Còn Lại"])})`);
      const demolishing = building.filter(([, b]) => !b["Đang Xây"] && b["Đang Phá"]).map(([bn, b]) => `${bn} (còn ${formatDuration(b["Ngày Phá Còn Lại"] ?? 0)} để phá dỡ)`);
      const done = building.filter(([, b]) => !b["Đang Xây"] && !b["Đang Phá"]).map(([bn, b]) => `${bn} c${b["Cấp Độ"]}`);
      const parts = [`• ${name}: Dân ${terr["Dân Số"].toLocaleString("vi-VN")}, Lòng Dân ${terr["Trung Thành"]}`];

      // DÂN CƯ & VIỆC LÀM — để AI kể đúng cảnh phố xá: thất nghiệp thì có
      // người vạ vật ở cổng chợ, thiếu nhà thì có lều dựng ngoài tường thành.
      const jobless = terr["Dân Số Chi Tiết"]?.["Thất Nghiệp"] ?? 0;
      const homeless = terr["Vô Gia Cư"] ?? 0;
      if (jobless > 0 || homeless > 0) {
        const social: string[] = [];
        if (jobless > 0) social.push(`${jobless.toLocaleString("vi-VN")} người thất nghiệp`);
        if (homeless > 0) social.push(`${homeless.toLocaleString("vi-VN")} người không có chỗ ở`);
        parts.push(social.join(", "));
      }
      if (done.length > 0) parts.push(`Công trình: ${done.join(", ")}`);
      if (inProgress.length > 0) parts.push(`Đang xây: ${inProgress.join(", ")}`);
      if (demolishing.length > 0) parts.push(`Đang phá dỡ: ${demolishing.join(", ")}`);

      // ĐỊA THẾ & TÀI NGUYÊN — bản đồ và lời kể phải khớp nhau. Nếu bảng dưới
      // nói nơi này có mạch sắt giàu thì lời kể được phép nhắc tới nó; nếu lời
      // kể muốn thêm một nguồn tài nguyên mới, hãy ghi vào
      // "Gợi Ý Địa Thế"."Tài Nguyên Sẵn Có" để engine gieo điểm tương ứng.
      const hint = terr["Gợi Ý Địa Thế"];
      const geo: string[] = [];
      if (hint?.["Gần Sông"]) geo.push("bên sông");
      if (hint?.["Gần Biển"] || terr["Ven Biển"]) geo.push("giáp biển");
      if (hint?.["Trên Núi"]) geo.push("dưới chân núi");
      if (terr["Địa Hình"]) geo.push(terr["Địa Hình"].toLowerCase());
      if (geo.length > 0) parts.push(`Địa thế: ${geo.join(", ")}`);

      const nodes = terr["Điểm Tài Nguyên"] ?? [];
      if (nodes.length > 0) {
        const byRes = new Map<string, number>();
        for (const n of nodes) {
          if (!n["Đã Khám Phá"] || n["Trữ Lượng"] <= 0) continue;
          byRes.set(n["Tài Nguyên"], Math.max(byRes.get(n["Tài Nguyên"]) ?? 0, n["Trữ Lượng"]));
        }
        if (byRes.size > 0) {
          const grade = (g: number) => (g >= 3 ? "giàu" : g === 2 ? "khá" : "nghèo");
          parts.push(`Tài nguyên trong đất: ${[...byRes].map(([r, g]) => `${r} (${grade(g)})`).join(", ")}`);
        }
      }

      const walls = (terr["Tường Thành"] ?? []).filter((w) => !w["Đang Xây"]);
      if (walls.length > 0) {
        parts.push(`Tường thành: ${walls.map((w) => `${w["Tên"]} (${w["Vật Liệu"]} cấp ${w["Cấp"]})`).join(", ")}`);
      }
      lines.push(`  ${parts.join(". ")}.`);
    }
  }

  // ── Chợ nơi người chơi đang đứng (M18) ──
  const here = state["Thế Giới"]?.["Vị Trí"] ?? "";
  const market = state["Thị Trường Khu Vực"]?.[here];
  if (market) {
    const moves = Object.entries(market["Hàng Hoá"] ?? {})
      .filter(([, g]) => Math.abs(g["Biến Động"]) >= 5)
      .sort((a, b) => Math.abs(b[1]["Biến Động"]) - Math.abs(a[1]["Biến Động"]))
      .slice(0, 4)
      .map(([id, g]) => `${id} ${g["Biến Động"] > 0 ? "tăng" : "giảm"} ${Math.abs(g["Biến Động"]).toFixed(0)}%`);
    const bits = [market["Tin Đồn"]];
    if (moves.length > 0) bits.push(`Giá cả: ${moves.join(", ")}`);
    if (market["Đang Có Thương Nhân"]) bits.push("Có thương đoàn ngoại quốc đang neo tại đây.");
    lines.push("", `Chợ búa quanh đây: ${bits.join(" ")}`);
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
    const engineActivity = npc["_Hoạt Động Ngoài Cảnh"]?.["Mô Tả"];
    const activity = engineActivity
      ? `, gần nhất: ${engineActivity}`
      : lastMemory ? `, gần nhất: ${lastMemory["Sự Việc"]}` : "";
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
      const deadline = q["Hạn Chót Ngày"];
      const parts = [`• ${q["Tiêu Đề"]} [${q["Loại"]}] (${done}/${total} mục tiêu)`];
      if (deadline !== undefined) {
        const left = deadline - absoluteDay(world);
        parts.push(left > 0 ? `còn ${formatDuration(left)}` : "HẾT HẠN!");
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
