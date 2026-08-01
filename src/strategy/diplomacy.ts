/**
 * diplomacy (M20) — NGOẠI GIAO ĐẦY ĐỦ, tách hẳn khỏi bảng Quân Sự.
 *
 * Ba trục KHÁC NHAU mà trước đây bị bóp thành một dòng chữ:
 *   • TRẠNG THÁI PHÁP LÝ  — Hoà Bình / Chiến Tranh / Đình Chiến / Liên Minh /
 *     Thần Phục. Cái này quyết định ai được đánh ai mà không mất mặt.
 *   • THÁI ĐỘ (tình cảm)  — "Thái Độ Các Nhà", họ có THÍCH ta không.
 *   • TIN CẬY             — họ có TIN LỜI ta không. Hai thứ trên có thể tốt mà
 *     cái này vẫn bằng không, nếu ta từng xé giấy.
 *
 * Và thứ đắt nhất: UY TÍN CAM KẾT của chính ta. Xé một tờ hiệp ước thì MỌI Nhà
 * đều bớt tin, không riêng gì Nhà bị xé — đó là lý do Walder Frey được nhớ tên.
 *
 * KHÔNG CÓ NÚT BẤM: mọi thay đổi đi qua thẻ AI (mvuPrompt) → diplomacyStore →
 * đúng các hàm dưới đây. Engine giữ số, AI giữ lời.
 */
import type { StatData, DiploState, Treaty, Grievance } from "../mvu/schema";
import { TREATY_TYPES, DIPLO_STATES } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { absoluteDay, DAYS_PER_YEAR, formatDuration } from "../mvu/calendar";
import { clamp } from "../mvu/helpers";
import { HOUSES_BY_ID } from "../content/westeros/houses";
import { improveHouseAttitudeOps } from "./succession";

export interface DiploResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  /** một câu cho AI kể lại / log. */
  note?: string;
}

const rel = (state: StatData, houseId: string) => state["Quan Hệ Ngoại Giao"]?.[houseId];
const path = (houseId: string, field: string) => `stat_data.Quan Hệ Ngoại Giao.${houseId}.${field}`;

/** Tên thế lực cho lời kể (gia tộc, thành bang, khalasar hay tổ chức). */
export function houseLabel(houseId: string): string {
  return HOUSES_BY_ID[houseId]?.name ?? houseId;
}

/**
 * Bảo đảm có bản ghi quan hệ với Nhà này trước khi ghi field con. Ghi cả object
 * (không ghi field lẻ) để bản ghi không bao giờ thiếu mảng Hiệp Ước/Ân Oán.
 */
function ensureRelationOps(state: StatData, houseId: string): PatchOp[] {
  if (rel(state, houseId)) return [];
  return [{
    op: "replace", path: `stat_data.Quan Hệ Ngoại Giao.${houseId}`,
    value: {
      "Trạng Thái": "Hoà Bình", "War Score": 0, "Tin Cậy": 0,
      "Hiệp Ước": [], "Ân Oán": [], "Ngày Hết Hạn Đình Chiến": 0,
      "_Cống Nạp Tháng": 0, "Ghi Chú": "",
    },
  }];
}

/**
 * Khi một hàm ngoại giao GỌI hàm khác (vd truceOps gọi signTreatyOps), cả hai
 * đều tính ops trên state CŨ nên đều sinh op "dựng bản ghi quan hệ". Op dựng thứ
 * hai sẽ ghi đè sạch những gì op đầu vừa đặt (trạng thái Đình Chiến hoá lại Hoà
 * Bình). Chỉ giữ op dựng ĐẦU TIÊN cho mỗi Nhà.
 */
function dedupeEnsure(ops: PatchOp[]): PatchOp[] {
  const seen = new Set<string>();
  return ops.filter((op) => {
    const isEnsure = op.op === "replace" && /^stat_data\.Quan Hệ Ngoại Giao\.[^.]+$/.test(op.path);
    if (!isEnsure) return true;
    if (seen.has(op.path)) return false;
    seen.add(op.path);
    return true;
  });
}

// ── Trạng thái pháp lý ──────────────────────────────────────────────────────

/**
 * Đổi trạng thái pháp lý. Không phải đổi nào cũng miễn phí: đánh úp trong lúc
 * đang Đình Chiến hay đang Liên Minh là BỘI ƯỚC — mất uy tín với cả thiên hạ.
 */
export function setDiploStatus(
  state: StatData,
  houseId: string,
  status: DiploState,
  reason = "",
): DiploResult {
  if (!houseId) return { ok: false, error: "Thiếu houseId", ops: [] };
  if (!DIPLO_STATES.includes(status)) return { ok: false, error: `Trạng thái không hợp lệ: ${status}`, ops: [] };

  const r = rel(state, houseId);
  const before = r?.["Trạng Thái"] ?? "Hoà Bình";
  const ops: PatchOp[] = [...ensureRelationOps(state, houseId)];
  ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: status });

  // đang có ràng buộc mà quay sang đánh → bội ước
  const bound = before === "Đình Chiến" || before === "Liên Minh" || before === "Ta Thần Phục";
  const betrayal = status === "Chiến Tranh" && bound;
  let note = `${houseLabel(houseId)}: ${before} → ${status}`;

  if (betrayal) {
    ops.push(...breakAllTreatiesOps(state, houseId, "Ta"));
    ops.push(...loseCredibilityOps(state, 18));
    ops.push({ op: "replace", path: path(houseId, "Tin Cậy"), value: -100 });
    ops.push(...addGrievanceOps(state, houseId, {
      "Việc": reason || "Ta xé lời thề mà tiến quân",
      "Mức": 85, "Bên Nợ": "Ta Nợ Họ", "_Ngày": absoluteDay(state["Thế Giới"]),
    }));
    note += " (BỘI ƯỚC — cả thiên hạ đều thấy)";
  }

  if (status === "Chiến Tranh") {
    ops.push({ op: "replace", path: path(houseId, "Ngày Hết Hạn Đình Chiến"), value: 0 });
  }
  if (status === "Liên Minh" || status === "Hoà Bình") {
    // ngồi lại được với nhau thì lòng tin nhích lên một chút
    ops.push({ op: "delta", path: path(houseId, "Tin Cậy"), value: status === "Liên Minh" ? 15 : 6 });
    ops.push(...improveHouseAttitudeOps(state, houseId, status === "Liên Minh" ? 2 : 1));
  }
  if (status === "Thần Phục Ta") {
    ops.push({ op: "delta", path: "stat_data.Danh Vọng.Uy Dũng", value: 6 });
  }
  ops.push({ op: "replace", path: "stat_data.Ngoại Giao._Biến Động", value: note });
  return { ok: true, ops: dedupeEnsure(ops), note };
}

/** Đình chiến có KỲ HẠN — hết hạn tự về Hoà Bình hoặc lại đánh nhau. */
export function truceOps(state: StatData, houseId: string, days: number, terms = ""): DiploResult {
  const today = absoluteDay(state["Thế Giới"]);
  const until = today + Math.max(1, Math.round(days));
  const ops: PatchOp[] = [...ensureRelationOps(state, houseId)];
  ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: "Đình Chiến" });
  ops.push({ op: "replace", path: path(houseId, "Ngày Hết Hạn Đình Chiến"), value: until });
  ops.push(...signTreatyOps(state, houseId, {
    "Loại": "Đình Chiến", "Điều Khoản": terms || `Ngừng binh ${formatDuration(days)}`,
    "Ngày Hết Hạn": until, "Cống Nạp Tháng": 0, "Còn Hiệu Lực": true, "Bên Phá": "",
    "_Ngày Ký": today,
  }).ops);
  return {
    ok: true,
    ops: dedupeEnsure(ops),
    note: `Đình chiến với ${houseLabel(houseId)} trong ${formatDuration(days)}`,
  };
}

// ── Hiệp ước ────────────────────────────────────────────────────────────────

/** Ký một hiệp ước (append vào mảng — engine không xoá lịch sử, chỉ hạ cờ hiệu lực). */
export function signTreatyOps(state: StatData, houseId: string, treaty: Treaty): DiploResult {
  if (!houseId) return { ok: false, error: "Thiếu houseId", ops: [] };
  const ops: PatchOp[] = [...ensureRelationOps(state, houseId)];
  ops.push({ op: "insert", path: path(houseId, "Hiệp Ước"), value: treaty });
  // ký được là đã có chút lòng tin
  ops.push({ op: "delta", path: path(houseId, "Tin Cậy"), value: 8 });
  ops.push({ op: "delta", path: "stat_data.Ngoại Giao.Uy Tín Cam Kết", value: 2 });

  // hiệu ứng pháp lý kèm theo loại giấy
  if (treaty["Loại"] === "Liên Minh Quân Sự") {
    ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: "Liên Minh" });
  } else if (treaty["Loại"] === "Hoà Ước") {
    ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: "Hoà Bình" });
    ops.push({ op: "replace", path: path(houseId, "War Score"), value: 0 });
  } else if (treaty["Loại"] === "Thề Trung Thành") {
    ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: "Thần Phục Ta" });
  }
  return {
    ok: true, ops,
    note: `Ký ${treaty["Loại"]} với ${houseLabel(houseId)}${treaty["Cống Nạp Tháng"] ? ` (cống nạp ${treaty["Cống Nạp Tháng"]})` : ""}`,
  };
}

/** Dựng Treaty từ thuộc tính thẻ AI (số năm → ngày hết hạn tuyệt đối). */
export function treatyFromAttrs(
  state: StatData,
  attrs: { type?: string; terms?: string; years?: string; tribute?: string },
): Treaty {
  const today = absoluteDay(state["Thế Giới"]);
  const years = Number(attrs.years) || 0;
  const type = (TREATY_TYPES as readonly string[]).includes(attrs.type ?? "")
    ? (attrs.type as Treaty["Loại"])
    : "Hoà Ước";
  return {
    "Loại": type,
    "Điều Khoản": attrs.terms ?? "",
    "Ngày Hết Hạn": years > 0 ? today + Math.round(years * DAYS_PER_YEAR) : 0,
    "Cống Nạp Tháng": Math.round(Number(attrs.tribute) || 0),
    "Còn Hiệu Lực": true,
    "Bên Phá": "",
    "_Ngày Ký": today,
  };
}

/** Hạ cờ hiệu lực MỌI hiệp ước với một Nhà (dùng khi bội ước / tuyên chiến). */
function breakAllTreatiesOps(state: StatData, houseId: string, by: "Ta" | "Họ"): PatchOp[] {
  const r = rel(state, houseId);
  if (!r) return [];
  const ops: PatchOp[] = [];
  r["Hiệp Ước"].forEach((t, i) => {
    if (!t["Còn Hiệu Lực"]) return;
    ops.push({ op: "replace", path: path(houseId, `Hiệp Ước.${i}.Còn Hiệu Lực`), value: false });
    ops.push({ op: "replace", path: path(houseId, `Hiệp Ước.${i}.Bên Phá`), value: by });
  });
  return ops;
}

/**
 * XÉ HIỆP ƯỚC — hành động đắt nhất trong ngoại giao. Nhà bị xé thành thù, và
 * mọi Nhà khác đều hạ lòng tin vào ta (uy tín cam kết là tài sản chung).
 */
export function breakTreatyOps(state: StatData, houseId: string, reason = "", treatyType?: string): DiploResult {
  const r = rel(state, houseId);
  if (!r) return { ok: false, error: `Chưa có quan hệ với ${houseId}`, ops: [] };
  const idx = r["Hiệp Ước"].findIndex(
    (t) => t["Còn Hiệu Lực"] && (!treatyType || t["Loại"] === treatyType),
  );
  if (idx < 0) return { ok: false, error: "Không có hiệp ước nào còn hiệu lực để xé", ops: [] };

  const t = r["Hiệp Ước"][idx];
  const today = absoluteDay(state["Thế Giới"]);
  const ops: PatchOp[] = [
    { op: "replace", path: path(houseId, `Hiệp Ước.${idx}.Còn Hiệu Lực`), value: false },
    { op: "replace", path: path(houseId, `Hiệp Ước.${idx}.Bên Phá`), value: "Ta" },
    { op: "replace", path: path(houseId, "Tin Cậy"), value: -80 },
  ];
  ops.push(...addGrievanceOps(state, houseId, {
    "Việc": reason || `Ta xé ${t["Loại"]}`, "Mức": 70, "Bên Nợ": "Ta Nợ Họ", "_Ngày": today,
  }));
  ops.push(...loseCredibilityOps(state, 14));
  if (t["Loại"] === "Liên Minh Quân Sự" || t["Loại"] === "Đình Chiến") {
    ops.push({ op: "replace", path: path(houseId, "Trạng Thái"), value: "Hoà Bình" });
  }
  const note = `Ta xé ${t["Loại"]} với ${houseLabel(houseId)} — thiên hạ sẽ nhớ.`;
  ops.push({ op: "replace", path: "stat_data.Ngoại Giao._Biến Động", value: note });
  return { ok: true, ops: dedupeEnsure(ops), note };
}

/**
 * Mất uy tín cam kết: trừ vào sổ chung VÀ hạ lòng tin của MỌI Nhà đang có quan
 * hệ. Đây là cơ chế bắt buộc để ngoại giao có sức nặng thật.
 */
function loseCredibilityOps(state: StatData, amount: number): PatchOp[] {
  const ops: PatchOp[] = [
    { op: "delta", path: "stat_data.Ngoại Giao.Uy Tín Cam Kết", value: -amount },
    { op: "delta", path: "stat_data.Danh Vọng.Vinh Dự", value: -Math.round(amount / 2) },
    { op: "delta", path: "stat_data.Danh Vọng.Xảo Quyệt", value: Math.round(amount / 3) },
  ];
  for (const other of Object.keys(state["Quan Hệ Ngoại Giao"] ?? {})) {
    ops.push({ op: "delta", path: path(other, "Tin Cậy"), value: -Math.round(amount / 2) });
  }
  return ops;
}

// ── Ân oán (casus belli) ────────────────────────────────────────────────────

export function addGrievanceOps(state: StatData, houseId: string, g: Grievance): PatchOp[] {
  const ops: PatchOp[] = [...ensureRelationOps(state, houseId)];
  ops.push({ op: "insert", path: path(houseId, "Ân Oán"), value: g });
  return ops;
}

/** Ta có CỚ để đánh Nhà này không (tổng ân oán họ nợ ta ≥ 50)? */
export function casusBelli(state: StatData, houseId: string): number {
  const r = rel(state, houseId);
  if (!r) return 0;
  return r["Ân Oán"].filter((g) => g["Bên Nợ"] === "Họ Nợ Ta").reduce((s, g) => s + g["Mức"], 0);
}

/** Họ có cớ đánh ta không — dùng để AI biết khi nào một Nhà sẽ trở mặt. */
export function grievanceAgainstUs(state: StatData, houseId: string): number {
  const r = rel(state, houseId);
  if (!r) return 0;
  return r["Ân Oán"].filter((g) => g["Bên Nợ"] === "Ta Nợ Họ").reduce((s, g) => s + g["Mức"], 0);
}

// ── Sứ giả ──────────────────────────────────────────────────────────────────

export function sendEnvoyOps(
  state: StatData,
  name: string,
  houseId: string,
  mission: string,
  days = 20,
): DiploResult {
  if (!name.trim()) return { ok: false, error: "Sứ giả cần có tên", ops: [] };
  const ops: PatchOp[] = [...ensureRelationOps(state, houseId)];
  ops.push({
    op: "replace", path: `stat_data.Ngoại Giao.Sứ Giả.${name}`,
    value: {
      "Tên": name, "Tới Nhà": houseId, "Nhiệm Vụ": mission,
      "Trạng Thái": "Đang Đi", "Ngày Còn Lại": Math.max(1, Math.round(days)), "Kết Quả": "",
    },
  });
  return { ok: true, ops, note: `${name} lên đường tới ${houseLabel(houseId)}: ${mission}` };
}

// ── Lời đề nghị đang chờ ta trả lời ─────────────────────────────────────────

/**
 * AI đặt một lời đề nghị lên bàn. Người chơi KHÔNG bấm nút — họ nói ra ý mình
 * trong cuộc chơi, AI kể diễn biến rồi phát thẻ `<treaty>` (nhận) hoặc để lời
 * đề nghị hết hạn (từ chối).
 */
export function addOfferOps(
  state: StatData,
  key: string,
  offer: {
    house: string; type?: string; terms?: string; tribute?: string; years?: string;
    deadlineDays?: string; bearer?: string;
  },
): DiploResult {
  if (!offer.house) return { ok: false, error: "Lời đề nghị cần biết từ thế lực nào", ops: [] };
  const today = absoluteDay(state["Thế Giới"]);
  const deadline = Number(offer.deadlineDays) || 30;
  const type = (TREATY_TYPES as readonly string[]).includes(offer.type ?? "") ? offer.type : "Hoà Ước";
  const ops: PatchOp[] = [...ensureRelationOps(state, offer.house)];
  ops.push({
    op: "replace", path: `stat_data.Ngoại Giao.Lời Đề Nghị.${key}`,
    value: {
      "Từ Nhà": offer.house, "Loại": type, "Điều Khoản": offer.terms ?? "",
      "Cống Nạp Tháng": Math.round(Number(offer.tribute) || 0),
      "Số Năm": Math.round(Number(offer.years) || 0),
      "Ngày Hết Hạn Trả Lời": today + Math.max(1, Math.round(deadline)),
      "Ai Mang Tới": offer.bearer ?? "", "Ghi Chú": "",
    },
  });
  return { ok: true, ops, note: `${houseLabel(offer.house)} đặt lên bàn một ${type}` };
}

/** Nhận một lời đề nghị → thành hiệp ước thật. */
export function acceptOfferOps(state: StatData, key: string): DiploResult {
  const offer = state["Ngoại Giao"]["Lời Đề Nghị"]?.[key];
  if (!offer) return { ok: false, error: `Không có lời đề nghị "${key}"`, ops: [] };
  const treaty = treatyFromAttrs(state, {
    type: offer["Loại"], terms: offer["Điều Khoản"],
    years: String(offer["Số Năm"]), tribute: String(offer["Cống Nạp Tháng"]),
  });
  const signed = signTreatyOps(state, offer["Từ Nhà"], treaty);
  return {
    ok: true,
    ops: dedupeEnsure([...signed.ops, { op: "remove", path: `stat_data.Ngoại Giao.Lời Đề Nghị.${key}` }]),
    note: signed.note,
  };
}

/** Từ chối thẳng — mất mặt người ta, lòng tin không đổi nhưng thái độ xấu đi. */
export function rejectOfferOps(state: StatData, key: string, harsh = false): DiploResult {
  const offer = state["Ngoại Giao"]["Lời Đề Nghị"]?.[key];
  if (!offer) return { ok: false, error: `Không có lời đề nghị "${key}"`, ops: [] };
  const ops: PatchOp[] = [{ op: "remove", path: `stat_data.Ngoại Giao.Lời Đề Nghị.${key}` }];
  if (harsh) {
    ops.push(...improveHouseAttitudeOps(state, offer["Từ Nhà"], -1));
    ops.push(...addGrievanceOps(state, offer["Từ Nhà"], {
      "Việc": "Ta bác bỏ lời đề nghị ngay trước mặt sứ giả",
      "Mức": 15, "Bên Nợ": "Ta Nợ Họ", "_Ngày": absoluteDay(state["Thế Giới"]),
    }));
  }
  return { ok: true, ops, note: `Ta từ chối ${offer["Loại"]} của ${houseLabel(offer["Từ Nhà"])}` };
}

// ── Tick: hiệp ước hết hạn, sứ giả về, cống nạp ─────────────────────────────

/** Cống nạp ròng mỗi tháng từ các hiệp ước còn hiệu lực (Đồng Đỏ). */
export function monthlyTribute(state: StatData): number {
  let total = 0;
  for (const r of Object.values(state["Quan Hệ Ngoại Giao"] ?? {})) {
    for (const t of r["Hiệp Ước"]) {
      if (t["Còn Hiệu Lực"]) total += t["Cống Nạp Tháng"] || 0;
    }
  }
  return total;
}

export function tickDiplomacyDaily(state: StatData): void {
  const today = absoluteDay(state["Thế Giới"]);
  const news: string[] = [];

  for (const [houseId, r] of Object.entries(state["Quan Hệ Ngoại Giao"] ?? {})) {
    // hiệp ước hết hạn
    for (const t of r["Hiệp Ước"]) {
      if (!t["Còn Hiệu Lực"] || t["Ngày Hết Hạn"] <= 0) continue;
      if (today >= t["Ngày Hết Hạn"]) {
        t["Còn Hiệu Lực"] = false;
        news.push(`${t["Loại"]} với ${houseLabel(houseId)} đã hết hạn.`);
      }
    }
    // đình chiến hết hạn → về Hoà Bình (chiến hay không thì để lời kể quyết)
    if (r["Ngày Hết Hạn Đình Chiến"] > 0 && today >= r["Ngày Hết Hạn Đình Chiến"]) {
      r["Ngày Hết Hạn Đình Chiến"] = 0;
      if (r["Trạng Thái"] === "Đình Chiến") {
        r["Trạng Thái"] = "Hoà Bình";
        news.push(`Đình chiến với ${houseLabel(houseId)} hết hạn — gươm lại có thể rút.`);
      }
    }
    // ân oán mờ dần: mỗi 30 ngày bớt 1 điểm, nhưng máu thì không bao giờ về 0
    r["Ân Oán"] = r["Ân Oán"].filter((g) => {
      if (today - g["_Ngày"] > 0 && (today - g["_Ngày"]) % 30 === 0) {
        g["Mức"] = clamp(g["Mức"] - 1, g["Mức"] >= 70 ? 40 : 0, 100);
      }
      return g["Mức"] > 0;
    });
    // lòng tin bò về 0 rất chậm (một điểm mỗi 20 ngày)
    if (today % 20 === 0 && r["Tin Cậy"] !== 0) {
      r["Tin Cậy"] += r["Tin Cậy"] > 0 ? -1 : 1;
    }
  }

  // sứ giả trên đường
  const dip = state["Ngoại Giao"];
  for (const [name, e] of Object.entries(dip["Sứ Giả"] ?? {})) {
    if (e["Trạng Thái"] === "Đã Về" || e["Trạng Thái"] === "Mất Tích") continue;
    e["Ngày Còn Lại"] = Math.max(0, (e["Ngày Còn Lại"] || 0) - 1);
    if (e["Ngày Còn Lại"] > 0) continue;
    if (e["Trạng Thái"] === "Đang Đi") {
      e["Trạng Thái"] = "Đang Đàm Phán";
      e["Ngày Còn Lại"] = 5;
      news.push(`${name} đã tới ${houseLabel(e["Tới Nhà"])} và xin gặp.`);
    } else if (e["Trạng Thái"] === "Đang Đàm Phán") {
      e["Trạng Thái"] = "Đang Về";
      e["Ngày Còn Lại"] = 15;
    } else if (e["Trạng Thái"] === "Đang Về") {
      e["Trạng Thái"] = "Đã Về";
      news.push(`${name} đã về, mang theo câu trả lời của ${houseLabel(e["Tới Nhà"])}.`);
    }
  }

  // lời đề nghị hết hạn trả lời — im lặng cũng là một câu trả lời
  for (const [key, o] of Object.entries(dip["Lời Đề Nghị"] ?? {})) {
    if (o["Ngày Hết Hạn Trả Lời"] > 0 && today >= o["Ngày Hết Hạn Trả Lời"]) {
      delete dip["Lời Đề Nghị"][key];
      news.push(`${houseLabel(o["Từ Nhà"])} không chờ nữa: lời đề nghị ${o["Loại"]} đã rút lại.`);
    }
  }

  // uy tín cam kết hồi rất chậm nếu không xé giấy thêm
  if (today % 60 === 0 && dip["Uy Tín Cam Kết"] < 60) {
    dip["Uy Tín Cam Kết"] = clamp(dip["Uy Tín Cam Kết"] + 1, 0, 100);
  }

  if (news.length > 0) dip["_Biến Động"] = news.join(" ");
}

export function tickDiplomacyMonthly(state: StatData): void {
  // chốt cống nạp từng Nhà + dòng tiền vào ngân khố
  let net = 0;
  for (const r of Object.values(state["Quan Hệ Ngoại Giao"] ?? {})) {
    let per = 0;
    for (const t of r["Hiệp Ước"]) if (t["Còn Hiệu Lực"]) per += t["Cống Nạp Tháng"] || 0;
    r["_Cống Nạp Tháng"] = per;
    net += per;
  }
  if (net !== 0) {
    state["Thông Tin Nhân Vật"]["Ngân Khố"] = Math.max(0, state["Thông Tin Nhân Vật"]["Ngân Khố"] + net);
  }
}

let registered = false;
export function registerDiplomacyLoop(): void {
  if (registered) return;
  registerDailyListener("diplomacy", tickDiplomacyDaily);
  registerMonthlyListener("diplomacy-tribute", tickDiplomacyMonthly);
  registered = true;
}

// ── Tổng quan cho giao diện + cho AI đọc ────────────────────────────────────

export interface DiploSummary {
  houseId: string;
  label: string;
  status: DiploState;
  warScore: number;
  trust: number;
  attitude: string;
  activeTreaties: Treaty[];
  ourClaim: number; // ân oán họ nợ ta
  theirClaim: number; // ân oán ta nợ họ
  tribute: number;
  truceLeft: number; // ngày còn lại của đình chiến
}

export function diplomacySummary(state: StatData): DiploSummary[] {
  const today = absoluteDay(state["Thế Giới"]);
  return Object.entries(state["Quan Hệ Ngoại Giao"] ?? {}).map(([houseId, r]) => {
    const schemaName = HOUSES_BY_ID[houseId]?.schemaName ?? houseId;
    return {
      houseId,
      label: houseLabel(houseId),
      status: r["Trạng Thái"],
      warScore: r["War Score"],
      trust: r["Tin Cậy"],
      attitude: state["Thái Độ Các Nhà"]?.[schemaName]?.["Thái Độ"] ?? "Cảnh Giác",
      activeTreaties: r["Hiệp Ước"].filter((t) => t["Còn Hiệu Lực"]),
      ourClaim: casusBelli(state, houseId),
      theirClaim: grievanceAgainstUs(state, houseId),
      tribute: r["_Cống Nạp Tháng"],
      truceLeft: r["Ngày Hết Hạn Đình Chiến"] > 0 ? Math.max(0, r["Ngày Hết Hạn Đình Chiến"] - today) : 0,
    };
  });
}

/**
 * Bảng ngoại giao có gì để xem chưa (bật icon rail). Một lãnh chúa cai trị thì
 * LUÔN có việc ngoại giao — hắn có láng giềng, và láng giềng có ý riêng.
 */
export function diplomacyAvailable(state: StatData): boolean {
  if (Object.keys(state["Quan Hệ Ngoại Giao"] ?? {}).length > 0) return true;
  if (Object.keys(state["Ngoại Giao"]["Lời Đề Nghị"] ?? {}).length > 0) return true;
  if (Object.keys(state["Ngoại Giao"]["Sứ Giả"] ?? {}).length > 0) return true;
  return Object.keys(state["Thái Độ Các Nhà"] ?? {}).length > 0;
}

/**
 * Gieo bản đồ chính trị lúc khởi ván (M20): mỗi Nhà mà nhân vật đã có THÁI ĐỘ
 * đều được mở một bản ghi quan hệ. Trạng thái pháp lý khởi điểm là Hoà Bình (kể
 * cả với Nhà đang thù — thù chưa phải là chiến tranh); LÒNG TIN thì suy từ thái
 * độ, vì một Nhà đã ghét ta sẵn thì cũng chẳng tin lời ta.
 */
const ATTITUDE_TRUST: Record<string, number> = {
  "Tín Nhiệm": 45, "Ủng Hộ": 30, "Cảnh Giác": 0, "Dao Động": -10,
  "Bất Mãn": -25, "Địch Ý": -45, "Thù Địch": -70,
};

export function seedDiplomacy(state: StatData): number {
  const playerHouse = String(state["Thông Tin Nhân Vật"]["Nhà"] ?? "").toLowerCase();

  /** houseId của mọi thế lực ĐANG NẮM ĐẤT — đó mới là bàn cờ thật. */
  const powers = new Set<string>();
  for (const sov of Object.values(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    const h = String(sov["Nhà Kiểm Soát"] ?? "").toLowerCase();
    if (h) powers.add(h);
  }
  // cộng thêm Nhà mà nhân vật đã có thái độ (có thể là Nhà lưu vong, không nắm đất)
  for (const schemaName of Object.keys(state["Thái Độ Các Nhà"] ?? {})) {
    const id = Object.values(HOUSES_BY_ID).find((h) => h.schemaName === schemaName)?.id ?? schemaName.toLowerCase();
    powers.add(id);
  }

  let added = 0;
  for (const houseId of powers) {
    if (!houseId || houseId === playerHouse) continue;
    if (state["Quan Hệ Ngoại Giao"][houseId]) continue;
    const schemaName = HOUSES_BY_ID[houseId]?.schemaName ?? houseId;
    const att = state["Thái Độ Các Nhà"]?.[schemaName];
    state["Quan Hệ Ngoại Giao"][houseId] = {
      "Trạng Thái": "Hoà Bình",
      "War Score": 0,
      "Tin Cậy": att ? (ATTITUDE_TRUST[att["Thái Độ"]] ?? 0) : 0,
      "Hiệp Ước": [],
      "Ân Oán": [],
      "Ngày Hết Hạn Đình Chiến": 0,
      "_Cống Nạp Tháng": 0,
      "Ghi Chú": att?.["Mô Tả"] ?? "",
    };
    added++;
  }
  return added;
}
