/**
 * HUY ĐỘNG (M23) — ai thật sự có mặt trên chiến trường, và lãnh địa đứng sau
 * lưng họ đóng góp được gì.
 *
 * Trước M23 hai chuyện này chỉ là con số trang trí:
 *
 *   • Bảng Quân Sự có cột "Lãnh Địa Đồn Trú" và "Đang Di Chuyển Đến", nhưng
 *     `playerBattleSide` gộp TOÀN BỘ biên chế lại thành một khối. Một đạo quân
 *     đóng ở Casterly Rock vẫn "tham chiến" một trận đánh ở Winterfell. Hành
 *     quân trở thành vô nghĩa, và không có lý do gì để chia quân giữ đất.
 *   • Lãnh địa có Doanh Trại, Lò Rèn, Kho Lương, Sept — xây hay không xây thì
 *     quân ra trận vẫn y hệt nhau.
 *
 * File này sửa cả hai. `mobilizeAt()` lọc theo VỊ TRÍ THẬT và trả về cả danh
 * sách đơn vị VẮNG MẶT kèm lý do, để bảng quân sự nói thẳng cho người chơi biết
 * vì sao ba vạn quân trong biên chế mà ra trận chỉ có bốn nghìn.
 * `homeSupportAt()` quy công trình và tình hình lãnh địa thành điểm cộng thật.
 *
 * Hàm thuần — không đọc store, không đụng state.
 */
import type { StatData, MilitaryUnit } from "../mvu/schema";
import { clamp } from "../mvu/helpers";
import { BUILDING_CATALOG } from "../content/westeros/buildings";
import { troopMeta } from "../content/westeros/troopTypes";
import { wallDefense } from "../territory/walls";

type Holding = StatData["Lãnh Địa"][string];

// ── AI CÓ MẶT ───────────────────────────────────────────────────────────────

export type AbsenceReason =
  | "Đang Tập Hợp"
  | "Đang Huấn Luyện"
  | "Đang Hành Quân"
  | "Đóng Nơi Khác"
  | "Đã Tan Rã";

export interface AbsentUnit {
  name: string;
  troops: number;
  reason: AbsenceReason;
  /** câu giải thích đầy đủ cho UI. */
  detail: string;
  /** số ngày nữa thì đơn vị này dùng được / tới nơi. */
  daysLeft?: number;
}

export interface MobilizationReport {
  /** địa điểm giao chiến đang xét. */
  location: string;
  /** đơn vị ra được trận. */
  fielded: [string, MilitaryUnit][];
  /** đơn vị không ra được trận, kèm lý do. */
  absent: AbsentUnit[];
  fieldedTroops: number;
  absentTroops: number;
}

/**
 * Đơn vị này có mặt ở `location` và sẵn sàng đánh không?
 *
 * Luật: đang tập hợp / đang huấn luyện thì chưa dùng được ở bất cứ đâu. Đang
 * hành quân thì đang ở giữa đường — kể cả khi đích đến chính là chiến trường,
 * chưa tới là chưa đánh được. Còn lại thì phải ĐÓNG ĐÚNG chỗ.
 */
export function unitAvailability(
  name: string,
  u: MilitaryUnit,
  location: string,
): { ok: true } | { ok: false; absent: AbsentUnit } {
  const troops = u["Số Lượng"] ?? 0;
  const mk = (reason: AbsenceReason, detail: string, daysLeft?: number) =>
    ({ ok: false as const, absent: { name, troops, reason, detail, daysLeft } });

  if (troops <= 0) return mk("Đã Tan Rã", "Đơn vị không còn người nào.");
  if ((u["Ngày Tập Hợp Còn Lại"] ?? 0) > 0) {
    const d = u["Ngày Tập Hợp Còn Lại"];
    return mk("Đang Tập Hợp", `Còn đang gom quân về điểm hẹn — ${d} ngày nữa mới đủ mặt.`, d);
  }
  if ((u["Ngày Huấn Luyện"] ?? 0) > 0) {
    const d = u["Ngày Huấn Luyện"];
    return mk("Đang Huấn Luyện", `Lính mới còn trong thao trường — ${d} ngày nữa mới ra trận được.`, d);
  }

  const marchingTo = u["Đang Di Chuyển Đến"];
  const daysLeft = u["Ngày Hành Quân Còn Lại"] ?? 0;
  if (marchingTo && daysLeft > 0) {
    const where = marchingTo === location ? "chính chiến trường này" : marchingTo;
    return mk("Đang Hành Quân", `Đang trên đường tới ${where} — còn ${daysLeft} ngày hành quân.`, daysLeft);
  }

  // đã tới nơi nhưng chưa ai cập nhật ô đồn trú → coi như đang ở đích
  const at = (marchingTo && daysLeft <= 0 ? marchingTo : u["Lãnh Địa Đồn Trú"]) || "";
  if (!location) return { ok: true }; // không rõ chiến trường ở đâu → không lọc
  if (at && at !== location) {
    return mk("Đóng Nơi Khác", `Đang đồn trú tại ${at}, không kịp về ${location}.`);
  }
  return { ok: true };
}

/**
 * Lọc biên chế theo địa điểm giao chiến. Đơn vị KHÔNG khai nơi đồn trú được coi
 * là đi theo lãnh chúa (quân bản bộ), nên vẫn ra trận — nếu không thì save cũ
 * chưa có dữ liệu vị trí sẽ đột nhiên hết sạch quân.
 */
export function mobilizeAt(state: StatData, location: string): MobilizationReport {
  const report: MobilizationReport = {
    location, fielded: [], absent: [], fieldedTroops: 0, absentTroops: 0,
  };
  const units = Object.entries(state["Biên Chế Quân Sự"] ?? {});

  /**
   * Chốt an toàn: nếu chiến trường không phải một lãnh địa có thật VÀ không đơn
   * vị nào đóng ở đó, thì dữ liệu vị trí đang không khớp nhau — lọc tiếp sẽ xoá
   * sạch quân của người chơi. Trong trường hợp đó chỉ áp luật tập hợp/huấn luyện.
   */
  const known = !!state["Lãnh Địa"]?.[location]
    || units.some(([, u]) => u["Lãnh Địa Đồn Trú"] === location || u["Đang Di Chuyển Đến"] === location);
  const effective = known ? location : "";

  for (const [name, u] of units) {
    const check = unitAvailability(name, u, effective);
    if (check.ok) {
      report.fielded.push([name, u]);
      report.fieldedTroops += u["Số Lượng"] ?? 0;
    } else {
      report.absent.push(check.absent);
      report.absentTroops += check.absent.troops;
    }
  }
  report.absent.sort((a, b) => b.troops - a.troops);
  return report;
}

/** Câu tóm tắt một dòng cho bảng quân sự và cho AI kể. */
export function describeMobilization(r: MobilizationReport): string {
  if (r.absent.length === 0) {
    return `Toàn bộ ${r.fieldedTroops.toLocaleString("vi-VN")} quân có mặt tại ${r.location}.`;
  }
  const byReason = new Map<AbsenceReason, number>();
  for (const a of r.absent) byReason.set(a.reason, (byReason.get(a.reason) ?? 0) + a.troops);
  const parts = [...byReason.entries()].map(([k, v]) => `${v.toLocaleString("vi-VN")} ${k.toLowerCase()}`);
  return `Ra trận ${r.fieldedTroops.toLocaleString("vi-VN")} quân; vắng mặt ${r.absentTroops.toLocaleString("vi-VN")} (${parts.join(", ")}).`;
}

// ── LÃNH ĐỊA ĐỨNG SAU LƯNG ──────────────────────────────────────────────────

export interface HomeSupport {
  /** lãnh địa được tính (rỗng = đánh ngoài đất nhà, không có hậu thuẫn). */
  territory: string;
  /** cộng vào thang Huấn Luyện 0-100. */
  training: number;
  /** cộng vào thang Trang Bị 0-100. */
  equipment: number;
  /** cộng vào thang Hậu Cần 0-100. */
  logistics: number;
  /** cộng vào thang Sĩ Khí 0-100. */
  morale: number;
  /** điểm phòng thủ công sự (công trình + tường vạch tay). */
  defense: number;
  /** số ụ nỏ bắn rồng — mỗi ụ một cơ hội hạ rồng mỗi vòng. */
  scorpions: number;
  /** hệ số chất lượng kỵ binh (+0.05 mỗi cấp Chuồng Ngựa). */
  cavalry: number;
  /** tỷ lệ thương binh cứu được thêm sau trận nhờ học sĩ. */
  medic: number;
  /** % giảm nguy cơ bị phục kích. */
  watch: number;
  /** giải thích từng khoản cho UI — người chơi phải thấy tiền xây nhà đi đâu. */
  lines: string[];
}

function emptySupport(territory = ""): HomeSupport {
  return {
    territory, training: 0, equipment: 0, logistics: 0, morale: 0,
    defense: 0, scorpions: 0, cavalry: 0, medic: 0, watch: 0, lines: [],
  };
}

/**
 * Quy công trình + tình hình lãnh địa thành điểm cộng THẬT cho quân đóng ở đây.
 *
 * Ba nguồn:
 *   1. công trình (cờ `*PerLevel` trong buildings.ts) — nhân theo Cấp Độ, chỉ
 *      tính công trình đã xây XONG;
 *   2. kho lương và ngân khố — quân ăn từ kho của đất mình đứng;
 *   3. lòng dân — dân ghét chủ thì lính cũng chẳng buồn đánh.
 */
export function homeSupportAt(state: StatData, territoryId: string | undefined): HomeSupport {
  if (!territoryId) return emptySupport();
  const holding: Holding | undefined = state["Lãnh Địa"]?.[territoryId];
  if (!holding) return emptySupport();

  const s = emptySupport(territoryId);

  // ── 1. công trình ──
  for (const [bname, b] of Object.entries(holding["Công Trình"] ?? {})) {
    if (b["Đang Xây"] || b["Đang Phá"]) continue;
    const def = BUILDING_CATALOG[b["Loại"]];
    const flags = def?.flags;
    if (!flags) continue;
    const lvl = Math.max(1, b["Cấp Độ"] ?? 1);
    const add = (v: number | undefined) => (v ?? 0) * lvl;

    const t = add(flags.trainingPerLevel);
    const e = add(flags.equipPerLevel);
    const l = add(flags.supplyPerLevel);
    const m = add(flags.moralePerLevel);
    const c = add(flags.cavalryPerLevel);
    const med = add(flags.medicPerLevel);
    const sc = add(flags.scorpionsPerLevel);
    const w = add(flags.watchPerLevel);

    s.training += t; s.equipment += e; s.logistics += l; s.morale += m;
    s.cavalry += c; s.medic += med; s.scorpions += sc; s.watch += w;
    s.defense += (flags.defense ?? 0) * lvl;

    const bits: string[] = [];
    if (t) bits.push(`+${t} huấn luyện`);
    if (e) bits.push(`+${e} trang bị`);
    if (l) bits.push(`+${l} hậu cần`);
    if (m) bits.push(`+${m} sĩ khí`);
    if (sc) bits.push(`${sc} ụ nỏ bắn rồng`);
    if (c) bits.push(`+${Math.round(c * 100)}% chất lượng kỵ binh`);
    if (med) bits.push(`cứu thêm ${Math.round(med * 100)}% thương binh`);
    if (w) bits.push(`+${w}% cảnh giới`);
    if (bits.length > 0) s.lines.push(`${bname} (cấp ${lvl}): ${bits.join(", ")}`);
  }

  // ── 2. tường vạch tay ──
  const walls = wallDefense(holding);
  if (walls > 0) {
    s.defense += walls;
    s.lines.push(`Tường thành: +${walls} phòng thủ`);
  }

  // ── 3. kho lương: quân ăn từ đất mình đứng ──
  const food = holding["Tài Nguyên"]?.["Lương Thực"] ?? 0;
  const mouths = Math.max(1, (holding["Dân Số"] ?? 0) * 0.02);
  const foodMonths = food / Math.max(1, mouths);
  const foodBonus = clamp(Math.round(foodMonths * 1.2) - 6, -20, 18);
  if (foodBonus !== 0) {
    s.logistics += foodBonus;
    s.lines.push(
      foodBonus > 0
        ? `Kho lương đầy: +${foodBonus} hậu cần`
        : `Kho lương cạn: ${foodBonus} hậu cần — lính ra trận với bụng rỗng`,
    );
  }

  // ── 4. lòng dân ──
  const loyalty = holding["Lòng Dân"] ?? holding["Trung Thành"] ?? 50;
  const loyaltyBonus = Math.round((loyalty - 50) / 4);
  if (loyaltyBonus !== 0) {
    s.morale += loyaltyBonus;
    s.lines.push(
      loyaltyBonus > 0
        ? `Lòng dân ${loyalty}: +${loyaltyBonus} sĩ khí`
        : `Lòng dân ${loyalty}: ${loyaltyBonus} sĩ khí — dân oán thì lính rã`,
    );
  }

  // ── 5. tình trạng lãnh địa ──
  const status = holding["Tình Trạng"];
  if (status === "Bị Vây") {
    s.logistics -= 15;
    s.morale -= 8;
    s.lines.push("Lãnh địa đang BỊ VÂY: −15 hậu cần, −8 sĩ khí");
  } else if (status === "Nổi Loạn") {
    s.morale -= 15;
    s.lines.push("Lãnh địa đang NỔI LOẠN: −15 sĩ khí");
  } else if (status === "Mới Chiếm") {
    s.morale -= 6;
    s.lines.push("Đất mới chiếm, dân chưa phục: −6 sĩ khí");
  }

  return s;
}

/**
 * Áp điểm cộng của lãnh địa vào các thang đã gộp của một phe. Giữ trong 0-100
 * để mọi công thức chiến lực phía sau không bị vỡ thang.
 */
export function applyHomeSupport<T extends { training: number; equipment: number; logistics: number; morale: number }>(
  side: T,
  support: HomeSupport,
): T {
  return {
    ...side,
    training: clamp(side.training + support.training, 0, 100),
    equipment: clamp(side.equipment + support.equipment, 0, 100),
    logistics: clamp(side.logistics + support.logistics, 0, 100),
    morale: clamp(side.morale + support.morale, 0, 100),
  };
}

/** Chất lượng kỵ binh được Chuồng Ngựa nâng lên bao nhiêu (nhân vào troopQuality). */
export function cavalryQualityBonus(support: HomeSupport, composition: Record<string, number>): number {
  const cavShare = Object.entries(composition)
    .filter(([t]) => troopMeta(t).class === "kỵ")
    .reduce((sum, [, v]) => sum + v, 0);
  return 1 + support.cavalry * clamp(cavShare, 0, 1);
}

/**
 * Địa điểm giao chiến: AI khai trước, không thì lấy vị trí hiện tại của nhân
 * vật. Đây là khoá tra vào bảng "Lãnh Địa" nên phải là TÊN lãnh địa.
 */
export function battleLocation(state: StatData, attrs: Record<string, string> = {}): string {
  const holdings = state["Lãnh Địa"] ?? {};

  /**
   * `Thế Giới["Vị Trí"]` là TÊN nơi ("Winterfell") còn `Lãnh Địa Đồn Trú` là MÃ
   * lãnh địa ("the-north-seat"), và tên thật của lãnh địa nằm trong "Mô Tả".
   * Không quy đổi thì mọi so sánh vị trí đều trượt và cả đạo quân biến mất khỏi
   * chiến trường.
   */
  const resolve = (raw: string | undefined): string => {
    if (!raw) return "";
    if (holdings[raw]) return raw;
    const needle = raw.trim().toLowerCase();
    for (const [id, h] of Object.entries(holdings)) {
      const name = String(h["Mô Tả"] ?? "").trim().toLowerCase();
      if (name && (name === needle || name.startsWith(`${needle},`) || name.startsWith(`${needle} `))) return id;
      if (id.toLowerCase() === needle) return id;
    }
    return "";
  };

  for (const key of ["location", "territory", "holding", "siege_target", "place"]) {
    const hit = resolve(attrs[key]);
    if (hit) return hit;
  }
  const here = resolve(state["Thế Giới"]?.["Vị Trí"]);
  if (here) return here;

  // Không quy được về lãnh địa nào (đang ở giữa đường, ở đất địch, hoặc save
  // chưa có dữ liệu vị trí) → trả rỗng để KHÔNG lọc. Thà tính thừa quân còn hơn
  // để người chơi ra trận với con số không vì một chỗ ghép chuỗi bị lệch.
  return "";
}
