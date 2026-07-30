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
import { DRAGON_SIZE_HP, DRAGON_STATS } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { calcMapDistance } from "./army";
import { playerHouseId } from "../territory/territoryEngine";

/** Ngưỡng TUỔI để rồng lên kích cỡ kế tiếp (7.15 mở rộng). */
export const DRAGON_GROWTH_AGE: Record<DragonSize, number> = {
  "Non": 0,
  "Trưởng Thành": 16,
  "Khổng Lồ (Balerion-class)": 100,
};

/** Sải cánh (mét) theo kích cỡ + tuổi — chỉ để lời kể có thước đo thật. */
export function wingspanOf(d: Dragon): number {
  const base = d["Kích Cỡ"] === "Khổng Lồ (Balerion-class)" ? 40 : d["Kích Cỡ"] === "Trưởng Thành" ? 18 : 4;
  return Math.round(base + Math.min(40, (d["Tuổi"] ?? 1) * 0.25));
}

/** Số gia súc rồng ngốn mỗi tháng. */
export function monthlyRation(d: Dragon): number {
  const base = d["Kích Cỡ"] === "Khổng Lồ (Balerion-class)" ? 90 : d["Kích Cỡ"] === "Trưởng Thành" ? 35 : 8;
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
    "Đặc Tính": [],
    "Đang Bị Xích": false,
    "Nơi Ổ": undefined,
    "Tình Trạng": "Khỏe",
    "_HP": hpMax,
    "_HP Tối Đa": hpMax,
    "Màu Sắc": "Đen",
    "Tuổi": 1,
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
        d["Tình Trạng"] !== "Đang Hồi Phục",
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
  if (age >= DRAGON_GROWTH_AGE["Khổng Lồ (Balerion-class)"]) return "Khổng Lồ (Balerion-class)";
  if (age >= DRAGON_GROWTH_AGE["Trưởng Thành"]) return "Trưởng Thành";
  return "Non";
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
  }
}

export function tickDragonsMonthly(state: StatData): void {
  for (const d of Object.values(state["Rồng"] ?? {})) {
    if (d["_HP"] <= 0) continue;

    // lớn theo tuổi — CHỈ lớn lên, không bao giờ teo lại: một con rồng nguyên
    // tác đã trưởng thành mà bảng ghi tuổi nhỏ thì vẫn là rồng trưởng thành
    const order: DragonSize[] = ["Non", "Trưởng Thành", "Khổng Lồ (Balerion-class)"];
    const size = sizeForAge(d["Tuổi"] ?? 1);
    if (order.indexOf(size) > order.indexOf(d["Kích Cỡ"])) {
      d["Kích Cỡ"] = size;
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
