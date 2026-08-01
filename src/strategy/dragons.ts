/**
 * dragons (M19) — RỒNG LÀ MỘT BINH CHỦNG RIÊNG, không nằm trong biên chế bộ binh.
 *
 * Trước đây rồng bị nhét vào "Biên Chế Quân Sự" như một đơn vị 1 quân, trong khi
 * bảng "Rồng" đầy đủ (chỉ số, kỹ năng, kỵ sĩ, hảo cảm) lại nằm chỗ khác — nên
 * tab Rồng trong bảng Quân Sự trống trơn còn thanh trạng thái thì có rồng.
 * File này chốt lại: `stat_data.Rồng` là NGUỒN CHÂN LÝ DUY NHẤT; mọi nơi khác
 * đọc qua đây.
 *
 * Rồng lớn theo tuổi, ăn theo kích cỡ, đói thì bất trị, bị thương thì mất phần
 * lớn sức mạnh và cần nhiều tháng nằm ổ. Cỗ máy giữ số; AI kể chuyện.
 */
import type { StatData, Dragon, DragonSize } from "../mvu/schema";
import { DRAGON_SIZE_HP, DRAGON_SIZES, DRAGON_STATS } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { calcMapDistance } from "./army";
import { playerHouseId } from "../territory/territoryEngine";
import { absoluteDay } from "../mvu/calendar";

/** Một mối liên kết cực sâu mới cho phép cưỡi rồng. */
export const DRAGON_TAMING_THRESHOLD = 95;
/** Mỗi cảnh cảm hóa là một diễn biến riêng, không thể spam trong cùng một khoảng thời gian. */
export const DRAGON_TAMING_COOLDOWN_DAYS = 14;
export const MIN_TAMING_NARRATIVE_LENGTH = 80;

export const DRAGON_TAMING_METHODS = ["feeding", "patience", "rescue", "ritual"] as const;
export type DragonTamingMethod = (typeof DRAGON_TAMING_METHODS)[number];

export interface DragonTamingContext {
  /** Diễn biến thật sự dẫn tới lần thử này; AI không được tự kể sẵn kết quả. */
  narrative?: string;
  /** Cách tiếp cận được chọn cho diễn biến. */
  method?: string;
}

/** Rồng càng lớn, già và hung dữ càng khó để tạo liên kết. */
export function dragonTamingDifficulty(d: Dragon): number {
  const sizePenalty: Record<DragonSize, number> = {
    "Mới Nở": -12, "Ấu Long": -7, "Non": 0, "Trưởng Thành": 16,
    "Cổ Long": 24, "Khổng Lồ (Balerion-class)": 30,
  };
  const size = sizePenalty[d["Kích Cỡ"]] ?? 0;
  const age = Math.min(20, Math.floor((d["Tuổi"] ?? 1) / 8));
  const traits = d["Đặc Tính"] ?? [];
  const temperament = (traits.includes("Hung Dữ") ? 12 : 0)
    + (traits.includes("Khát Máu") ? 16 : 0)
    + (traits.includes("Bất Trị") ? 22 : 0)
    - (traits.includes("Hiền Hòa") ? 10 : 0)
    - (traits.includes("Trung Thành") ? 6 : 0);
  return Math.max(35, 55 + size + age + temperament);
}

/** Trừ người xuyên không, mỗi người chỉ có thể gắn bó với đúng một con rồng. */
export function canRiderTameDragon(state: StatData, riderName: string, excludingDragonKey?: string): { ok: boolean; error?: string } {
  if (state["Cài Đặt Ván"]["Đặc Quyền Đa Kỵ Sĩ"]) return { ok: true };
  const alreadyRides = Object.entries(state["Rồng"] ?? {}).some(([key, dragon]) =>
    key !== excludingDragonKey && dragon["Kỵ Sĩ"] === riderName && dragon["Trạng Thái Thu Phục"] === "Đã Có Chủ",
  );
  return alreadyRides
    ? { ok: false, error: `${riderName} đã có rồng. Chỉ Người Xuyên Không mới được thuần phục nhiều hơn một con.` }
    : { ok: true };
}

/**
 * Thử cảm hoá một con rồng hoang. Đây là một cảnh có điều kiện, thời gian chờ và
 * xác suất riêng; lời kể chỉ tạo cơ hội, không được quyết định kết quả hay kỵ sĩ.
 */
export function attemptDragonTaming(
  state: StatData,
  dragonKey: string,
  riderName: string,
  context: DragonTamingContext = {},
  roll = Math.random(),
): { ok: boolean; tamed?: boolean; progress?: number; chance?: number; error?: string; ops: PatchOp[] } {
  const dragon = state["Rồng"]?.[dragonKey];
  if (!dragon) return { ok: false, error: "Không tìm thấy rồng", ops: [] };
  if (dragon["_HP"] <= 0) return { ok: false, error: "Rồng đã chết", ops: [] };
  if (dragon["Kỵ Sĩ"] && dragon["Kỵ Sĩ"] !== riderName) return { ok: false, error: `${dragon["Tên"]} đã có kỵ sĩ khác`, ops: [] };

  const narrative = context.narrative?.trim() ?? "";
  if (narrative.length < MIN_TAMING_NARRATIVE_LENGTH) {
    return { ok: false, error: `Cần một diễn biến cảm hóa cụ thể (ít nhất ${MIN_TAMING_NARRATIVE_LENGTH} ký tự), không phải lệnh thuần phục.`, ops: [] };
  }
  if (/\b(đã\s+(?:thuần phục|khuất phục|có chủ)|trở thành kỵ sĩ|became\s+(?:its\s+)?rider)\b/i.test(narrative)) {
    return { ok: false, error: "Diễn biến không được tự khẳng định rồng đã bị thuần phục; kết quả do engine tung xác suất.", ops: [] };
  }
  const method = context.method?.trim().toLowerCase() as DragonTamingMethod | undefined;
  if (!method || !DRAGON_TAMING_METHODS.includes(method)) {
    return { ok: false, error: "Cảnh cảm hóa phải nêu method: feeding, patience, rescue hoặc ritual.", ops: [] };
  }

  const riderCheck = canRiderTameDragon(state, riderName, dragonKey);
  if (!riderCheck.ok) return { ok: false, error: riderCheck.error, ops: [] };

  const bond = dragon["Độ Hảo Cảm"]?.[riderName] ?? 0;
  const tame = dragon["Mức Độ Thuần Hóa"] ?? 0;
  if (dragon["Trạng Thái Thu Phục"] === "Đã Có Chủ" && dragon["Kỵ Sĩ"] === riderName) {
    return { ok: false, error: `${dragon["Tên"]} đã là rồng của ${riderName}`, ops: [] };
  }

  const today = absoluteDay(state["Thế Giới"]);
  const lastAttempt = dragon["_Ngày Cảm Hóa Gần Nhất"] ?? 0;
  const daysSinceAttempt = lastAttempt > 0 ? today - lastAttempt : Number.POSITIVE_INFINITY;
  if (daysSinceAttempt < DRAGON_TAMING_COOLDOWN_DAYS) {
    return {
      ok: false,
      error: `${dragon["Tên"]} cần thời gian lắng dịu thêm ${DRAGON_TAMING_COOLDOWN_DAYS - daysSinceAttempt} ngày trước một diễn biến cảm hóa mới.`,
      ops: [],
    };
  }
  if ((dragon["Độ Đói"] ?? 0) > 40 && method !== "feeding") {
    return { ok: false, error: `${dragon["Tên"]} đang đói và bất trị; diễn biến tiếp theo phải là feeding, không phải cưỡi hay nghi thức.`, ops: [] };
  }
  if (bond < 20 && !["feeding", "patience"].includes(method)) {
    return { ok: false, error: "Khi rồng chưa biết người này, chỉ có feeding hoặc patience mới là bước mở đầu đáng tin.", ops: [] };
  }
  if (dragon["Tình Trạng"] !== "Khỏe" && method !== "rescue") {
    return { ok: false, error: "Rồng đang bị thương hoặc kiệt sức; cần một diễn biến rescue trước khi tìm cách tạo liên kết.", ops: [] };
  }

  const difficulty = dragonTamingDifficulty(dragon);
  const hungerPenalty = Math.max(0, (dragon["Độ Đói"] ?? 0) - 20) / 2;
  const attempts = dragon["Số Lần Cảm Hóa"] ?? 0;
  const methodBonus = method === "feeding" ? 5 : method === "patience" ? 4 : method === "rescue" ? 7 : 2;
  // Xác suất cố tình thấp: diễn biến tốt chỉ giúp một chút, còn mối liên kết dài lâu mới quan trọng.
  const chance = Math.max(3, Math.min(45, Math.round(
    12 - difficulty / 7 + tame / 5 + bond / 4 + Math.min(6, attempts) + methodBonus - hungerPenalty,
  )));
  const normalizedRoll = Math.max(0, Math.min(0.999999, roll));
  const basePath = `stat_data.Rồng.${dragonKey}`;
  const attemptOps: PatchOp[] = [
    { op: "replace", path: `${basePath}.Số Lần Cảm Hóa`, value: attempts + 1 },
    { op: "replace", path: `${basePath}._Ngày Cảm Hóa Gần Nhất`, value: today },
  ];

  if (normalizedRoll * 100 >= chance) {
    return {
      ok: true, tamed: false, progress: tame, chance,
      ops: [
        ...attemptOps,
        { op: "replace", path: `${basePath}.Trạng Thái Thu Phục`, value: "Đang Cảm Hóa" },
        { op: "replace", path: `${basePath}.Mức Độ Thuần Hóa`, value: Math.max(0, tame - 6) },
        { op: "replace", path: `${basePath}.Độ Hảo Cảm.${riderName}`, value: Math.max(0, bond - 8) },
      ],
    };
  }

  const nextTame = Math.min(100, tame + 2 + Math.floor(normalizedRoll * 4) + (method === "rescue" ? 1 : 0));
  const nextBond = Math.min(100, bond + 3 + Math.floor(normalizedRoll * 5) + (method === "patience" ? 1 : 0));
  const tamed = nextTame >= DRAGON_TAMING_THRESHOLD && nextBond >= DRAGON_TAMING_THRESHOLD;
  const ops: PatchOp[] = [
    ...attemptOps,
    { op: "replace", path: `${basePath}.Trạng Thái Thu Phục`, value: tamed ? "Đã Có Chủ" : "Đang Cảm Hóa" },
    { op: "replace", path: `${basePath}.Mức Độ Thuần Hóa`, value: nextTame },
    { op: "replace", path: `${basePath}.Độ Hảo Cảm.${riderName}`, value: nextBond },
  ];
  if (tamed) ops.push({ op: "replace", path: `${basePath}.Kỵ Sĩ`, value: riderName });
  return { ok: true, tamed, progress: nextTame, chance, ops };
}

/** Ngưỡng TUỔI để rồng lên kích cỡ kế tiếp (7.15 mở rộng). */
export const DRAGON_GROWTH_AGE: Record<DragonSize, number> = {
  "Mới Nở": 0,
  "Ấu Long": 2,
  "Non": 6,
  "Trưởng Thành": 16,
  "Cổ Long": 60,
  "Khổng Lồ (Balerion-class)": 100,
};

/** Sải cánh (mét) theo kích cỡ + tuổi — chỉ để lời kể có thước đo thật. */
export function wingspanOf(d: Dragon): number {
  const base: Record<DragonSize, number> = {
    "Mới Nở": 1, "Ấu Long": 2, "Non": 5, "Trưởng Thành": 18,
    "Cổ Long": 30, "Khổng Lồ (Balerion-class)": 42,
  };
  return Math.round((base[d["Kích Cỡ"]] ?? 5) + Math.min(36, (d["Tuổi"] ?? 1) * 0.18));
}

/** Số gia súc rồng ngốn mỗi tháng. */
export function monthlyRation(d: Dragon): number {
  const ration: Record<DragonSize, number> = {
    "Mới Nở": 2, "Ấu Long": 4, "Non": 8, "Trưởng Thành": 35,
    "Cổ Long": 62, "Khổng Lồ (Balerion-class)": 90,
  };
  const base = ration[d["Kích Cỡ"]] ?? 8;
  return Math.round(base * (1 + (d["Chỉ Số"]?.["Hung Dữ"] ?? 5) / 40));
}

/** Rồng mới — nơi duy nhất dựng object Dragon để không chỗ nào thiếu field. */
export function newDragon(fields: Partial<Dragon> = {}): Dragon {
  const size = (fields["Kích Cỡ"] ?? "Non") as DragonSize;
  const stats = {
    "Sức Lửa": 5, "Sức Bay": 5, "Giáp Vảy": 3, "Hung Dữ": 5, "Trung Thành": 3,
    ...(fields["Chỉ Số"] ?? {}),
  };
  const hpMax = DRAGON_SIZE_HP[size] + stats["Giáp Vảy"] * 20;
  const d: Dragon = {
    "Tên": "Rồng Vô Danh",
    "Kích Cỡ": size,
    "Kỵ Sĩ": undefined,
    "Độ Hảo Cảm": {},
    "Mức Độ Thuần Hóa": 0,
    "Trạng Thái Thu Phục": "Hoang Dã",
    "Số Lần Cảm Hóa": 0,
    "_Ngày Cảm Hóa Gần Nhất": 0,
    "Đặc Tính": [],
    "Đang Bị Xích": false,
    "Nơi Ổ": undefined,
    "Tình Trạng": "Khỏe",
    "_HP": hpMax,
    "_HP Tối Đa": hpMax,
    "Màu Sắc": "Đen",
    "Tuổi": 1,
    "Số Đầu": 1,
    "Năng Lực Đặc Biệt": undefined,
    "Chỉ Số": stats,
    "Kỹ Năng": {},
    "Mô Tả": "",
    "Nhà": "",
    "Đồn Trú": "",
    "Đang Bay Đến": undefined,
    "Ngày Bay Còn Lại": 0,
    "Kinh Nghiệm": 0,
    "Số Trận": 0,
    "_Sải Cánh": 4,
    "Độ Đói": 20,
    "_Khẩu Phần Tháng": 10,
    "Vết Thương": [],
    "Ngày Hồi Phục Còn Lại": 0,
    "Sẵn Sàng Chiến Đấu": true,
    ...fields,
  } as Dragon;
  d["Chỉ Số"] = stats;
  d["_Sải Cánh"] = wingspanOf(d);
  d["_Khẩu Phần Tháng"] = monthlyRation(d);
  return d;
}

// ── Truy vấn (nguồn chân lý duy nhất) ───────────────────────────────────────

/** Rồng thuộc phe người chơi — dùng cho CẢ bảng Quân Sự lẫn thanh trạng thái. */
export function playerDragons(state: StatData): [string, Dragon][] {
  const house = String(playerHouseId(state) ?? "").toLowerCase();
  const player = state["Thông Tin Nhân Vật"]["Họ Tên"];
  return Object.entries(state["Rồng"] ?? {}).filter(([, d]) => {
    if (d["Nhà"] && house && String(d["Nhà"]).toLowerCase() === house) return true;
    if (d["Kỵ Sĩ"] && d["Kỵ Sĩ"] === player) return true;
    // rồng chưa gán phe nhưng đã có chủ và đang ở trong bảng của ta
    return !d["Nhà"] && d["Trạng Thái Thu Phục"] === "Đã Có Chủ";
  });
}

/** Rồng ra trận được KÈM KHOÁ trong bảng "Rồng" — để ghi thương tích ngược sau trận (M23). */
export function battleReadyDragonEntries(state: StatData): [string, Dragon][] {
  return playerDragons(state).filter(
    ([, d]) =>
      d["_HP"] > 0 &&
      d["Sẵn Sàng Chiến Đấu"] !== false &&
      !d["Đang Bị Xích"] &&
      d["Ngày Hồi Phục Còn Lại"] <= 0 &&
      d["Tình Trạng"] !== "Đang Hồi Phục" &&
      d["Kích Cỡ"] !== "Mới Nở" && d["Kích Cỡ"] !== "Ấu Long",
  );
}

/** Rồng ra trận được: còn sống, khoẻ, không xích, không nằm ổ dưỡng thương. */
export function battleReadyDragons(state: StatData): Dragon[] {
  return playerDragons(state)
    .map(([, d]) => d)
    .filter(
      (d) =>
        d["_HP"] > 0 &&
        d["Sẵn Sàng Chiến Đấu"] !== false &&
        !d["Đang Bị Xích"] &&
        d["Ngày Hồi Phục Còn Lại"] <= 0 &&
        d["Tình Trạng"] !== "Đang Hồi Phục" &&
        d["Kích Cỡ"] !== "Mới Nở" && d["Kích Cỡ"] !== "Ấu Long",
    );
}

/** Tổng quan cho bảng quân sự: bao nhiêu con, bao nhiêu con ra trận được. */
export function dragonSummary(state: StatData): { total: number; ready: number; wounded: number } {
  const all = playerDragons(state).map(([, d]) => d);
  return {
    total: all.length,
    ready: battleReadyDragons(state).length,
    wounded: all.filter((d) => d["Tình Trạng"] !== "Khỏe" || (d["Vết Thương"]?.length ?? 0) > 0).length,
  };
}

// ── Điều rồng bay (M19) ─────────────────────────────────────────────────────

/** Rồng bay nhanh gấp bốn lần kỵ binh — nhưng vẫn mất ngày, không phải tức thì. */
export function dragonFlightDays(fromId: string, toId: string): number {
  const px = calcMapDistance(fromId, toId);
  return Math.max(1, Math.round(px / 900));
}

export function flyDragon(state: StatData, dragonKey: string, targetTerritoryId: string): { ok: boolean; error?: string; ops: PatchOp[]; days?: number } {
  const d = state["Rồng"]?.[dragonKey];
  if (!d) return { ok: false, error: "Không tìm thấy rồng", ops: [] };
  if (d["_HP"] <= 0) return { ok: false, error: "Rồng đã chết", ops: [] };
  if (d["Đang Bị Xích"]) return { ok: false, error: `${d["Tên"]} đang bị xích trong hầm`, ops: [] };
  if (d["Ngày Hồi Phục Còn Lại"] > 0) return { ok: false, error: `${d["Tên"]} còn đang dưỡng thương`, ops: [] };
  if (!REGIONS_BY_ID[targetTerritoryId]) return { ok: false, error: "Đích đến không hợp lệ", ops: [] };
  const days = dragonFlightDays(d["Đồn Trú"] || "", targetTerritoryId);
  return {
    ok: true, days,
    ops: [
      { op: "replace", path: `stat_data.Rồng.${dragonKey}.Đang Bay Đến`, value: targetTerritoryId },
      { op: "replace", path: `stat_data.Rồng.${dragonKey}.Ngày Bay Còn Lại`, value: days },
    ],
  };
}

/** Cho rồng ăn từ kho lãnh địa — no thì dễ bảo, đói thì tự đi săn (và săn gì thì tuỳ). */
export function feedDragon(state: StatData, dragonKey: string, territoryId: string): { ok: boolean; error?: string; ops: PatchOp[] } {
  const d = state["Rồng"]?.[dragonKey];
  if (!d) return { ok: false, error: "Không tìm thấy rồng", ops: [] };
  const terr = state["Lãnh Địa"][territoryId];
  if (!terr) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  const need = monthlyRation(d);
  const food = terr["Tài Nguyên"]["Lương Thực"] ?? 0;
  if (food < need) return { ok: false, error: `Cần ${need} phần lương thực, kho chỉ còn ${food}`, ops: [] };
  const rider = d["Kỵ Sĩ"];
  const ops: PatchOp[] = [
    { op: "delta", path: `stat_data.Lãnh Địa.${territoryId}.Tài Nguyên.Lương Thực`, value: -need },
    { op: "replace", path: `stat_data.Rồng.${dragonKey}.Độ Đói`, value: 0 },
  ];
  if (rider) {
    ops.push({ op: "delta", path: `stat_data.Rồng.${dragonKey}.Độ Hảo Cảm.${rider}`, value: 2 });
  }
  return { ok: true, ops };
}

// ── Vòng đời (tick) ─────────────────────────────────────────────────────────

/** Kích cỡ đúng theo tuổi — rồng nuôi tốt thì lớn, không ai "nâng cấp" bằng nút bấm. */
export function sizeForAge(age: number): DragonSize {
  for (let i = DRAGON_SIZES.length - 1; i >= 0; i -= 1) {
    const size = DRAGON_SIZES[i];
    if (age >= DRAGON_GROWTH_AGE[size]) return size;
  }
  return "Mới Nở";
}

export function tickDragonsDaily(state: StatData): void {
  for (const d of Object.values(state["Rồng"] ?? {})) {
    if (d["_HP"] <= 0) continue;

    // bay tới nơi
    if (d["Đang Bay Đến"]) {
      d["Ngày Bay Còn Lại"] = Math.max(0, (d["Ngày Bay Còn Lại"] || 0) - 1);
      if (d["Ngày Bay Còn Lại"] <= 0) {
        d["Đồn Trú"] = d["Đang Bay Đến"];
        d["Đang Bay Đến"] = undefined;
      }
    }

    // dưỡng thương: rồng lành rất chậm, nhưng lành thì lành hẳn
    if ((d["Ngày Hồi Phục Còn Lại"] || 0) > 0) {
      d["Ngày Hồi Phục Còn Lại"] -= 1;
      d["_HP"] = Math.min(d["_HP Tối Đa"], d["_HP"] + Math.max(1, Math.round(d["_HP Tối Đa"] / 200)));
      if (d["Ngày Hồi Phục Còn Lại"] === 0) {
        d["Tình Trạng"] = "Khỏe";
        d["Vết Thương"] = [];
      } else {
        d["Tình Trạng"] = "Đang Hồi Phục";
      }
    }

    // đói dần: cơn đói là đồng hồ đếm ngược của sự ngoan ngoãn
    d["Độ Đói"] = Math.min(100, (d["Độ Đói"] ?? 0) + 1);
    if (d["Năng Lực Đặc Biệt"] === "Tái Sinh" && d["_HP"] < d["_HP Tối Đa"]) {
      d["_HP"] = Math.min(d["_HP Tối Đa"], d["_HP"] + Math.max(1, Math.round(d["_HP Tối Đa"] / 100)));
    }
  }

  // Trứng chỉ tiến triển khi thực sự được ấp. Quả đã nứt vỏ nở rất nhanh;
  // trứng hóa đá/ngủ yên được bảo toàn cho tới khi diễn biến trong truyện làm
  // thay đổi trạng thái hoặc nhiệt độ.
  for (const [eggKey, egg] of Object.entries(state["Trứng Rồng"] ?? {})) {
    if (egg["Tình Trạng"] !== "Đang Ấp" && egg["Tình Trạng"] !== "Nứt Vỏ") continue;
    const gain = egg["Tình Trạng"] === "Nứt Vỏ" ? 10 : egg["Nhiệt Độ"] === "Nóng Rực" ? 2 : 1;
    egg["Số Ngày Ấp"] = (egg["Số Ngày Ấp"] ?? 0) + 1;
    egg["Tiến Độ Ấp"] = Math.min(100, (egg["Tiến Độ Ấp"] ?? 0) + gain);
    if (egg["Tiến Độ Ấp"] < 100) continue;

    const hatchlingName = egg["Tên"] || eggKey;
    const owner = egg["Chủ Nhân"];
    state["Rồng"][hatchlingName] = newDragon({
      "Tên": hatchlingName,
      "Kích Cỡ": "Mới Nở",
      "Màu Sắc": egg["Màu Sắc"],
      "Tuổi": 0,
      "Số Đầu": egg["Số Đầu Dự Kiến"],
      "Năng Lực Đặc Biệt": egg["Năng Lực Dự Kiến"],
      "Nhà": String(playerHouseId(state) ?? ""),
      "Đồn Trú": egg["Nơi Ấp"] ?? "",
      "Nơi Ổ": egg["Nơi Ấp"] || undefined,
      "Trạng Thái Thu Phục": "Đang Cảm Hóa",
      "Mức Độ Thuần Hóa": owner ? 70 : 0,
      "Độ Hảo Cảm": owner ? { [owner]: 80 } : {},
      "Sẵn Sàng Chiến Đấu": false,
      "Mô Tả": `Vừa nở từ ${eggKey}; còn non nớt và chưa thể cưỡi.`,
    });
    delete state["Trứng Rồng"][eggKey];
    state["Thế Giới"]["_Tin Nóng Off-screen"] =
      `${hatchlingName} đã phá vỏ chào đời — một rồng con ${egg["Số Đầu Dự Kiến"]} đầu màu ${egg["Màu Sắc"]}.`;
  }
}

export function tickDragonsMonthly(state: StatData): void {
  for (const d of Object.values(state["Rồng"] ?? {})) {
    if (d["_HP"] <= 0) continue;

    // lớn theo tuổi — CHỈ lớn lên, không bao giờ teo lại: một con rồng nguyên
    // tác đã trưởng thành mà bảng ghi tuổi nhỏ thì vẫn là rồng trưởng thành
    const order: readonly DragonSize[] = DRAGON_SIZES;
    const size = sizeForAge(d["Tuổi"] ?? 1);
    if (order.indexOf(size) > order.indexOf(d["Kích Cỡ"])) {
      d["Kích Cỡ"] = size;
      if (order.indexOf(size) >= order.indexOf("Non")) d["Sẵn Sàng Chiến Đấu"] = true;
      state["Thế Giới"]["_Tin Nóng Off-screen"] =
        `${d["Tên"]} đã lớn thành ${size} — sải cánh phủ kín sân thành.`;
    }
    d["_Sải Cánh"] = wingspanOf(d);
    d["_Khẩu Phần Tháng"] = monthlyRation(d);

    // ăn ở lãnh địa đang đậu: có kho thì tự trừ, không có thì đói và hoang dã dần
    const terr = state["Lãnh Địa"][d["Đồn Trú"]];
    const need = d["_Khẩu Phần Tháng"];
    if (terr && (terr["Tài Nguyên"]["Lương Thực"] ?? 0) >= need) {
      terr["Tài Nguyên"]["Lương Thực"] -= need;
      d["Độ Đói"] = Math.max(0, d["Độ Đói"] - 40);
    } else {
      d["Độ Đói"] = Math.min(100, d["Độ Đói"] + 25);
      // rồng đói tự đi săn: gia súc của dân, rồi tới dân
      if (d["Độ Đói"] >= 80 && terr) {
        terr["Trung Thành"] = Math.max(0, terr["Trung Thành"] - 4);
        const where = REGIONS_BY_ID[d["Đồn Trú"]]?.name ?? d["Đồn Trú"];
        state["Thế Giới"]["_Tin Nóng Off-screen"] =
          `${d["Tên"]} đói, bay đi săn — nông dân quanh ${where} mất bò mất cừu.`;
      }
    }

    // đói lâu thì quên cả kỵ sĩ
    if (d["Độ Đói"] >= 70) {
      d["Mức Độ Thuần Hóa"] = Math.max(0, d["Mức Độ Thuần Hóa"] - 5);
    }
  }
}

let registered = false;
export function registerDragonLoop(): void {
  if (registered) return;
  registerDailyListener("dragons", tickDragonsDaily);
  registerMonthlyListener("dragons", tickDragonsMonthly);
  registered = true;
}

// ── Di trú dữ liệu cũ (M19) ─────────────────────────────────────────────────

/**
 * Ván cũ nhét rồng vào "Biên Chế Quân Sự" như một đơn vị bộ binh. Gom hết về
 * bảng "Rồng" rồi xoá khỏi biên chế — nếu không, chiến lực sẽ đếm rồng HAI LẦN
 * (một lần qua đơn vị, một lần qua hệ số rồng) và tab Rồng vẫn trống.
 */
export function migrateDragonUnits(state: StatData): number {
  let moved = 0;
  for (const [name, unit] of Object.entries(state["Biên Chế Quân Sự"] ?? {})) {
    if (unit["Loại Quân"] !== "Rồng") continue;
    delete state["Biên Chế Quân Sự"][name];
    moved++;
    const key = unit["Tướng Chỉ Huy"] && state["Rồng"][name] ? name : name;
    if (state["Rồng"][key]) {
      // đã có bản đầy đủ trong bảng Rồng — chỉ bổ sung chỗ đậu/phe
      const d = state["Rồng"][key];
      if (!d["Đồn Trú"]) d["Đồn Trú"] = unit["Lãnh Địa Đồn Trú"] ?? "";
      if (!d["Nhà"]) d["Nhà"] = unit["Nhà"] ?? "";
      continue;
    }
    state["Rồng"][key] = newDragon({
      "Tên": name,
      "Kích Cỡ": "Trưởng Thành",
      "Kỵ Sĩ": unit["Tướng Chỉ Huy"] !== "Tạm Khuyết" ? unit["Tướng Chỉ Huy"] : undefined,
      "Trạng Thái Thu Phục": "Đã Có Chủ",
      "Nhà": unit["Nhà"] ?? "",
      "Đồn Trú": unit["Lãnh Địa Đồn Trú"] ?? "",
      "Tuổi": 30,
    });
  }
  return moved;
}

/** Đồng bộ field engine cho rồng cũ thiếu dữ liệu (save đời trước). */
export function repairDragons(state: StatData): void {
  const house = playerHouseId(state) ?? "";
  for (const d of Object.values(state["Rồng"] ?? {})) {
    if (!d["Chỉ Số"]) {
      d["Chỉ Số"] = Object.fromEntries(DRAGON_STATS.map((s) => [s, 5])) as Dragon["Chỉ Số"];
    }
    if (!d["Nhà"] && d["Trạng Thái Thu Phục"] === "Đã Có Chủ") d["Nhà"] = house;
    if (!d["Đồn Trú"] && d["Nơi Ổ"]) d["Đồn Trú"] = d["Nơi Ổ"];
    d["_Sải Cánh"] = wingspanOf(d);
    d["_Khẩu Phần Tháng"] = monthlyRation(d);
  }
}
