/**
 * muster (M19) — HIỆU TRIỆU CHƯ HẦU.
 *
 * Đây là thứ phân biệt một lãnh chúa Westeros với một ông tướng hiện đại: quân
 * của ông ta phần lớn KHÔNG PHẢI của ông ta. Ông ta gửi quạ, phất cờ, rồi chờ.
 * Nhà trung thành dốc sạch đinh tráng; nhà bất mãn gửi lấy lệ vài trăm dân binh
 * rách rưới; nhà đang tính chuyện khác thì viện cớ mùa gặt mà ở nhà — và lời từ
 * chối đó là một sự kiện chính trị, không phải một dòng lỗi.
 *
 * Quân tới nơi rồi thì vẫn phải trả về: giữ chư hầu ngoài đồng quá lâu là cách
 * nhanh nhất biến đồng minh thành kẻ thù.
 */
import type { StatData, Vassal, ArmyBranch } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { registerDailyListener } from "../mvu/effects";
import { BANNERMEN, bannermenOfRegion, BANNERMEN_BY_ID } from "../content/westeros/bannermen";
import { REGIONS_BY_ID } from "../content/westeros/regions";
import { hasPrivilege } from "../character/roleplay";
import { playerHouseId } from "../territory/territoryEngine";
import { eventSeed, makeRng } from "../probability/rng";
import { newUnit } from "./army";
import type { TroopTypeAll } from "../content/westeros/troopTypes";

export const VASSAL_BRANCH: ArmyBranch = "Chư Hầu";

// ── Gieo hạt ────────────────────────────────────────────────────────────────

/**
 * Gieo bảng chư hầu cho các vùng người chơi nắm (gọi lúc khởi ván và mỗi lần
 * chiếm được vùng mới). Chư hầu của vùng vừa chiếm khởi điểm TRUNG THÀNH THẤP —
 * họ vừa mất chủ cũ, chưa có lý do gì để chết vì chủ mới.
 */
export function seedVassals(state: StatData, opts: { conquered?: string } = {}): void {
  const house = playerHouseId(state) ?? "";
  for (const [regionId, sov] of Object.entries(state["Chủ Quyền Lãnh Thổ"] ?? {})) {
    if (!sov["Là Của Người Chơi"] && sov["Nhà Kiểm Soát"] !== house) continue;
    for (const b of bannermenOfRegion(regionId)) {
      const existing = state["Chư Hầu"][b.id];
      if (existing) {
        existing["Chủ Của"] = house;
        continue;
      }
      state["Chư Hầu"][b.id] = {
        "Tên Nhà": b.name,
        "Thành Trì": b.seat,
        "Vùng": b.region,
        "Chủ Của": house,
        "Trung Thành": opts.conquered === regionId ? Math.round(b.loyalty * 0.45) : b.loyalty,
        "Quân Cam Kết": b.levy,
        "Binh Chủng Chính": b.troop,
        "Trạng Thái": "Ở Nhà",
        "Ngày Tới Nơi": 0,
        "Quân Đã Gửi": 0,
        "Ngày Tòng Quân": 0,
        "Ghi Chú": b.note,
      };
    }
  }
}

/** Chư hầu thuộc quyền hiệu triệu của người chơi. */
export function callableVassals(state: StatData): [string, Vassal][] {
  return Object.entries(state["Chư Hầu"] ?? {});
}

/** Người chơi có quyền phất cờ hiệu triệu không (theo tước vị). */
export function canCallBanners(state: StatData): boolean {
  return (
    hasPrivilege(state, "Triệu Tập Chư Hầu (Toàn Lục Địa)") ||
    hasPrivilege(state, "Triệu Tập Chư Hầu (Vùng)")
  );
}

// ── Phản ứng của chư hầu ────────────────────────────────────────────────────

export interface BannerResponse {
  vassalId: string;
  name: string;
  /** số quân thực sự gửi (0 = từ chối). */
  troops: number;
  /** ngày hành quân tới điểm hẹn. */
  days: number;
  refused: boolean;
  /** lời hồi đáp cho AI kể lại. */
  reply: string;
}

/**
 * Uy tín của lãnh chúa đẩy chư hầu về phía "vâng lệnh" — Uy Dũng và Vinh Dự
 * đáng giá đúng bằng vài trăm tay giáo.
 */
function prestigeBonus(state: StatData): number {
  const fame = state["Danh Vọng"];
  const charisma = state["Chỉ Số Cốt Lõi"]["Uy Tín"] ?? 10;
  return (fame["Uy Dũng"] + fame["Vinh Dự"]) / 20 + (charisma - 10) * 1.5;
}

/** Một chư hầu đáp lời thế nào — thuần, seed cố định để test tái lập được. */
export function bannerResponse(
  vassal: Vassal,
  effectiveLoyalty: number,
  rng: () => number,
): { troops: number; days: number; refused: boolean; reply: string } {
  const marchDays = Math.max(1, vassal["Ngày Tới Nơi"] || 0);
  const loyal = Math.max(0, Math.min(100, effectiveLoyalty));
  const roll = rng();

  if (loyal < 25 || (loyal < 40 && roll < 0.45)) {
    return {
      troops: 0, days: 0, refused: true,
      reply: `${vassal["Tên Nhà"]} viện cớ mùa gặt và bệnh tật, không một tay giáo nào rời ${vassal["Thành Trì"]}.`,
    };
  }
  // tỷ lệ quân gửi: trung thành 100 → gần trọn; 40 → non nửa
  const share = 0.25 + (loyal / 100) * 0.75 * (0.85 + roll * 0.3);
  const troops = Math.max(1, Math.round(vassal["Quân Cam Kết"] * Math.min(1, share)));
  // nhà miễn cưỡng thì lề mề trên đường
  const drag = loyal >= 70 ? 1 : loyal >= 50 ? 1.25 : 1.6;
  const days = Math.max(1, Math.round(marchDays * drag));
  const reply =
    loyal >= 80
      ? `${vassal["Tên Nhà"]} dốc ${troops.toLocaleString("vi-VN")} quân, cờ hiệu rời ${vassal["Thành Trì"]} ngay trong đêm.`
      : loyal >= 50
        ? `${vassal["Tên Nhà"]} hứa gửi ${troops.toLocaleString("vi-VN")} quân, nhưng sẽ mất ít lâu để tập hợp.`
        : `${vassal["Tên Nhà"]} miễn cưỡng vét được ${troops.toLocaleString("vi-VN")} người, phần lớn là dân binh.`;
  return { troops, days, refused: false, reply };
}

export interface CallBannersResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  responses: BannerResponse[];
}

/**
 * Phất cờ hiệu triệu. `scope` là regionId (gọi cả vùng) hoặc vassalId (gọi
 * riêng một nhà); bỏ trống = gọi toàn bộ chư hầu đang thần phục.
 */
export function callBanners(state: StatData, scope?: string): CallBannersResult {
  if (!canCallBanners(state)) {
    return { ok: false, error: "Tước vị của ngươi không có quyền hiệu triệu chư hầu", ops: [], responses: [] };
  }
  const tick = state["_engineMeta"]["_Nhịp"];
  const rootSeed = state["_engineMeta"]["_Seed Gốc"];
  const bonus = prestigeBonus(state);
  const atWar = Object.values(state["Quan Hệ Ngoại Giao"] ?? {}).some((d) => d["Trạng Thái"] === "Chiến Tranh");

  const targets = callableVassals(state).filter(([id, v]) => {
    if (!scope) return true;
    return id === scope || v["Vùng"] === scope;
  });
  if (targets.length === 0) {
    return { ok: false, error: "Không có chư hầu nào để hiệu triệu", ops: [], responses: [] };
  }

  const ops: PatchOp[] = [];
  const responses: BannerResponse[] = [];
  for (const [id, v] of targets) {
    if (v["Trạng Thái"] !== "Ở Nhà" && v["Trạng Thái"] !== "Từ Chối") continue; // đã lên đường rồi
    const marchDays = BANNERMEN_BY_ID[id]?.marchDays ?? 10;
    const rng = makeRng(eventSeed(rootSeed, tick, `banner-${id}`));
    // chiến tranh làm chư hầu nghiêm túc hơn — nhưng cũng sợ hơn
    const effective = v["Trung Thành"] + bonus + (atWar ? 5 : 0);
    const res = bannerResponse({ ...v, "Ngày Tới Nơi": marchDays }, effective, rng);
    responses.push({ vassalId: id, name: v["Tên Nhà"], troops: res.troops, days: res.days, refused: res.refused, reply: res.reply });

    if (res.refused) {
      ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Trạng Thái`, value: "Từ Chối" });
      ops.push({ op: "delta", path: `stat_data.Chư Hầu.${id}.Trung Thành`, value: -4 });
      continue;
    }
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Trạng Thái`, value: "Đang Hành Quân" });
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Quân Đã Gửi`, value: res.troops });
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Ngày Tới Nơi`, value: res.days });
    ops.push({ op: "replace", path: `stat_data.Chư Hầu.${id}.Ngày Tòng Quân`, value: 0 });
  }
  if (responses.length === 0) {
    return { ok: false, error: "Chư hầu đã lên đường cả rồi", ops: [], responses: [] };
  }
  return { ok: true, ops, responses };
}

/** Cho chư hầu về nhà — trả quân đúng hẹn thì được lòng, giữ lâu thì mất lòng. */
export function dismissVassal(state: StatData, vassalId: string): { ok: boolean; error?: string; ops: PatchOp[] } {
  const v = state["Chư Hầu"]?.[vassalId];
  if (!v) return { ok: false, error: "Không có chư hầu này", ops: [] };
  const ops: PatchOp[] = [
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Trạng Thái`, value: "Ở Nhà" },
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Quân Đã Gửi`, value: 0 },
    { op: "replace", path: `stat_data.Chư Hầu.${vassalId}.Ngày Tòng Quân`, value: 0 },
    { op: "delta", path: `stat_data.Chư Hầu.${vassalId}.Trung Thành`, value: v["Ngày Tòng Quân"] > 120 ? 1 : 4 },
  ];
  for (const [name, u] of Object.entries(state["Biên Chế Quân Sự"])) {
    if (u["Thuộc Chư Hầu"] === vassalId) ops.push({ op: "remove", path: `stat_data.Biên Chế Quân Sự.${name}` });
  }
  return { ok: true, ops };
}

// ── Tick: quân chư hầu tới nơi ──────────────────────────────────────────────

/** Điểm hẹn: trọng trấn của vùng chư hầu, hoặc lãnh địa đầu tiên của người chơi. */
function musterPoint(state: StatData, v: Vassal): string {
  if (state["Lãnh Địa"][v["Vùng"]]) return v["Vùng"];
  const own = Object.keys(state["Lãnh Địa"])[0];
  return own ?? v["Vùng"];
}

export function tickMuster(state: StatData): void {
  const house = playerHouseId(state) ?? "";
  for (const [id, v] of Object.entries(state["Chư Hầu"] ?? {})) {
    if (v["Trạng Thái"] === "Đang Hành Quân") {
      v["Ngày Tới Nơi"] = Math.max(0, (v["Ngày Tới Nơi"] || 0) - 1);
      if (v["Ngày Tới Nơi"] > 0) continue;

      // tới nơi → thành một đơn vị thật trong biên chế
      v["Trạng Thái"] = "Đã Tới";
      const troops = v["Quân Đã Gửi"] || 0;
      if (troops <= 0) continue;
      const unitName = `Quân ${v["Tên Nhà"]}`;
      const station = musterPoint(state, v);
      state["Biên Chế Quân Sự"][unitName] = newUnit(
        v["Binh Chủng Chính"] as TroopTypeAll,
        troops,
        VASSAL_BRANCH,
        {
          "Tướng Chỉ Huy": `Lãnh chúa ${v["Tên Nhà"]}`,
          "Nhà": house,
          "Lãnh Địa Đồn Trú": station,
          "Thuộc Chư Hầu": id,
          "Ghi Chú": v["Ghi Chú"],
          "Sĩ Khí": v["Trung Thành"] >= 70 ? "Hăng Hái" : v["Trung Thành"] >= 45 ? "Ổn Định" : "Dao Động",
        },
      );
      state["Thế Giới"]["_Tin Nóng Off-screen"] =
        `Cờ hiệu nhà ${v["Tên Nhà"]} đã tới ${REGIONS_BY_ID[station]?.name ?? station}: ${troops.toLocaleString("vi-VN")} quân.`;
    } else if (v["Trạng Thái"] === "Đã Tới") {
      v["Ngày Tòng Quân"] = (v["Ngày Tòng Quân"] || 0) + 1;
    }
  }
}

let registered = false;
export function registerMusterLoop(): void {
  if (registered) return;
  registerDailyListener("muster", tickMuster);
  registered = true;
}

/** Tổng quân chư hầu đang có mặt dưới cờ (M19) — bảng quân sự in ra. */
export function musteredStrength(state: StatData): { present: number; pledged: number; marching: number } {
  let present = 0;
  let marching = 0;
  let pledged = 0;
  for (const v of Object.values(state["Chư Hầu"] ?? {})) {
    pledged += v["Quân Cam Kết"] || 0;
    if (v["Trạng Thái"] === "Đã Tới") present += v["Quân Đã Gửi"] || 0;
    if (v["Trạng Thái"] === "Đang Hành Quân") marching += v["Quân Đã Gửi"] || 0;
  }
  return { present, pledged, marching };
}

/** Danh sách chư hầu theo vùng cho giao diện (kể cả nhà chưa gieo vào state). */
export function knownBannermen(regionId: string) {
  return regionId ? bannermenOfRegion(regionId) : BANNERMEN;
}
