/**
 * sellswords (M19) — CHỢ LÍNH ĐÁNH THUÊ.
 *
 * Vàng chỉ mua được quân ở nơi có quân để bán. Bảng "Đội Đánh Thuê" là danh
 * sách các đoàn ĐANG chào giá quanh chỗ nhân vật đứng: engine gieo theo bến
 * cảng/Thành Phố Tự Do và năm hiện tại, còn AI có thể dẫn thêm một đoàn tới
 * bằng thẻ <sellsword_offer> khi lời kể cần.
 *
 * Đoàn nào cũng chỉ nán lại một thời gian rồi nhổ trại đi tìm khế ước khác —
 * cơ hội thuê là có hạn, không phải cửa hàng mở mãi.
 */
import type { StatData, MercenaryCompany } from "../mvu/schema";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { EXCHANGE_RATES } from "../economy/currency";
import { companiesAtHub, sellswordHubsAt, MERC_BY_ID, type MercCompanyData } from "../content/westeros/mercenaries";
import { eventSeed, makeRng } from "../probability/rng";
import type { TroopTypeAll } from "../content/westeros/troopTypes";

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

/** Dựng một dòng chào giá từ dữ liệu đoàn (giá viết Rồng Vàng → lưu Đồng Đỏ). */
export function offerFromCompany(
  data: MercCompanyData,
  where: string,
  size: number,
  stayDays: number,
): MercenaryCompany {
  return {
    "Tên Đoàn": data.name,
    "Đang Ở": where,
    "Quân Số": size,
    "Binh Chủng": data.troop as TroopTypeAll,
    "Huấn Luyện": data.quality,
    "Tiền Ký Khế Ước": Math.round((data.contractPer100 * size) / 100) * G,
    "Lương Tháng Mỗi 100": data.wagePer100 * G,
    "Chữ Tín": data.reliability,
    "Ngày Còn Ở Lại": stayDays,
    "Mô Tả": data.desc,
  };
}

/**
 * Gieo chợ lính theo vị trí hiện tại. Gọi lúc khởi ván và mỗi khi nhân vật tới
 * một nơi mới — đoàn nào đã có trong bảng thì giữ nguyên (không làm mới hạn ở
 * lại, tránh chợ "bất tử").
 */
export function seedSellswordMarket(state: StatData): number {
  const world = state["Thế Giới"];
  const hubs = sellswordHubsAt(world["Vị Trí"] ?? "");
  if (hubs.length === 0) return 0;

  const seed = state["_engineMeta"]["_Seed Gốc"];
  const tick = state["_engineMeta"]["_Nhịp"];
  let added = 0;
  for (const hub of hubs) {
    for (const data of companiesAtHub(hub.key, world["Năm"] ?? 300)) {
      if (state["Đội Đánh Thuê"][data.name]) continue;
      const rng = makeRng(eventSeed(seed, tick, `merc-${hub.key}-${data.id}`));
      // đoàn lớn hiếm khi rảnh cả đoàn: chỉ một phần đang tìm khế ước
      if (rng() > 0.65) continue;
      const size = Math.max(100, Math.round(data.size * (0.3 + rng() * 0.7)));
      const stay = 20 + Math.round(rng() * 40);
      state["Đội Đánh Thuê"][data.name] = offerFromCompany(data, hub.label, size, stay);
      added++;
    }
  }
  return added;
}

/** AI dẫn một đoàn tới bằng thẻ <sellsword_offer> — engine vẫn chốt giá. */
export function addSellswordOffer(
  state: StatData,
  attrs: { company?: string; location?: string; size?: string; quality?: string; price?: string; troop?: string; desc?: string },
): MercenaryCompany | null {
  const name = (attrs.company ?? "").trim();
  if (!name) return null;
  const size = Math.max(1, Math.round(Number(attrs.size) || 500));
  const known = Object.values(MERC_BY_ID).find((m) => m.name === name || m.id === name);
  const where = (attrs.location ?? state["Thế Giới"]["Vị Trí"] ?? "").trim();

  if (known) {
    const offer = offerFromCompany(known, where, Math.min(size, known.size), 30);
    state["Đội Đánh Thuê"][known.name] = offer;
    return offer;
  }
  // đoàn do AI bịa ra: định giá theo mặt bằng lính đánh thuê thường
  const goldPer100 = Math.max(120, Math.round(Number(attrs.price) || 300));
  const offer: MercenaryCompany = {
    "Tên Đoàn": name,
    "Đang Ở": where,
    "Quân Số": size,
    "Binh Chủng": (attrs.troop as TroopTypeAll) || "Lính Đánh Thuê",
    "Huấn Luyện": (attrs.quality as MercenaryCompany["Huấn Luyện"]) || "Thành Thạo",
    "Tiền Ký Khế Ước": Math.round((goldPer100 * size) / 100) * G,
    "Lương Tháng Mỗi 100": Math.round(goldPer100 * 0.45) * G,
    "Chữ Tín": 45,
    "Ngày Còn Ở Lại": 30,
    "Mô Tả": attrs.desc ?? "",
  };
  state["Đội Đánh Thuê"][name] = offer;
  return offer;
}

/** Đoàn hết kiên nhẫn thì nhổ trại — cơ hội thuê không chờ ai. */
export function tickSellswords(state: StatData): void {
  for (const [name, co] of Object.entries(state["Đội Đánh Thuê"] ?? {})) {
    co["Ngày Còn Ở Lại"] = Math.max(0, (co["Ngày Còn Ở Lại"] || 0) - 1);
    if (co["Ngày Còn Ở Lại"] <= 0 || co["Quân Số"] <= 0) {
      delete state["Đội Đánh Thuê"][name];
    }
  }
}

let registered = false;
export function registerSellswordLoop(): void {
  if (registered) return;
  registerDailyListener("sellswords", tickSellswords);
  // mỗi tháng chợ lính đổi mặt: đoàn cũ nhổ trại, đoàn mới ghé qua — nhịp THÁNG
  // chứ không phải ngày, để cơ hội thuê là một sự kiện chứ không phải cửa hàng.
  registerMonthlyListener("sellswords-market", (state) => {
    seedSellswordMarket(state);
  });
  registered = true;
}
