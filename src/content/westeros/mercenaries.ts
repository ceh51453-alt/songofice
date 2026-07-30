// content/westeros/mercenaries.ts
// ============================================================================
// LÍNH ĐÁNH THUÊ (M19) — vàng mua được quân, nhưng KHÔNG mua được ở mọi nơi.
//
// Muốn thuê thì phải có chợ lính: một bến cảng lớn, một Thành Phố Tự Do, hoặc
// một đoàn đang nhàn rỗi đóng trại gần đó. Đứng giữa rừng phương Bắc mà vung
// vàng thì chỉ có sói tới nhận.
//
// Giá viết theo RỒNG VÀNG; engine quy ra Đồng Đỏ khi ghi vào ngân khố.
// ============================================================================
import type { TroopTypeAll } from "./troopTypes";
import type { MilitaryUnit } from "../../mvu/schema";

export interface MercCompanyData {
  id: string;
  name: string;
  /** quân số điển hình của đoàn. */
  size: number;
  troop: TroopTypeAll;
  quality: MilitaryUnit["Huấn Luyện"];
  /** tiền ký khế ước cho mỗi 100 lính (Rồng Vàng). */
  contractPer100: number;
  /** lương mỗi 100 lính mỗi tháng (Rồng Vàng). */
  wagePer100: number;
  /** chữ tín 0-100 — thấp là loại sẵn sàng trở giáo giữa trận. */
  reliability: number;
  /** khoá chợ lính nơi đoàn hay đóng quân (xem SELLSWORD_HUBS). */
  hubs: string[];
  /** đoàn chỉ tồn tại từ năm này (AC) trở đi. */
  sinceYear?: number;
  /** đoàn tan rã sau năm này (AC). */
  untilYear?: number;
  desc: string;
}

/**
 * CHỢ LÍNH — nơi thuê được quân. `match` là các mảnh chữ dò trong Vị Trí hiện
 * tại của nhân vật; `territories` là regionId/holdingId tương ứng trên bản đồ.
 */
export interface SellswordHub {
  key: string;
  label: string;
  /** dò không phân biệt hoa thường trong stat_data."Thế Giới"."Vị Trí". */
  match: string[];
  /** territoryId khớp trực tiếp (khi người chơi đang quản lãnh địa đó). */
  territories: string[];
}

export const SELLSWORD_HUBS: SellswordHub[] = [
  { key: "braavos", label: "Braavos", match: ["braavos"], territories: [] },
  { key: "pentos", label: "Pentos", match: ["pentos"], territories: [] },
  { key: "myr", label: "Myr", match: ["myr"], territories: [] },
  { key: "tyrosh", label: "Tyrosh", match: ["tyrosh"], territories: [] },
  { key: "lys", label: "Lys", match: ["lys"], territories: [] },
  { key: "volantis", label: "Volantis", match: ["volantis"], territories: [] },
  { key: "essos-slave-bay", label: "Vịnh Nô Lệ", match: ["astapor", "yunkai", "meereen", "vịnh nô lệ"], territories: [] },
  { key: "kings-landing", label: "King's Landing", match: ["king's landing", "kings landing", "vương đô"], territories: ["the-crownlands"] },
  { key: "gulltown", label: "Gulltown", match: ["gulltown"], territories: [] },
  { key: "oldtown", label: "Oldtown", match: ["oldtown"], territories: [] },
  { key: "lannisport", label: "Lannisport", match: ["lannisport"], territories: [] },
  { key: "white-harbor", label: "White Harbor", match: ["white harbor", "bến cảng trắng"], territories: [] },
  { key: "planky-town", label: "Planky Town", match: ["planky town"], territories: [] },
];

export const MERC_COMPANIES: MercCompanyData[] = [
  {
    id: "golden-company", name: "Đại Đoàn Vàng", size: 10000, troop: "Lính Đánh Thuê", quality: "Tinh Nhuệ",
    contractPer100: 900, wagePer100: 260, reliability: 95,
    hubs: ["volantis", "myr", "pentos", "tyrosh"], sinceYear: 212,
    desc: "Mười ngàn quân, cả voi chiến. \"Chưa từng bội ước\" — và giá tiền phản ánh đúng điều đó.",
  },
  {
    id: "second-sons", name: "Đoàn Nhị Tử", size: 2000, troop: "Lính Đánh Thuê", quality: "Thành Thạo",
    contractPer100: 420, wagePer100: 150, reliability: 45,
    hubs: ["pentos", "myr", "essos-slave-bay", "volantis"],
    desc: "Con thứ, con hoang, con bị đuổi khỏi nhà. Đổi phe khi bên kia trả cao hơn.",
  },
  {
    id: "stormcrows", name: "Đoàn Quạ Bão", size: 1500, troop: "Kỵ Binh Nhẹ", quality: "Thành Thạo",
    contractPer100: 460, wagePer100: 165, reliability: 50,
    hubs: ["pentos", "myr", "essos-slave-bay"],
    desc: "Ba thủ lĩnh cùng cầm quyền, nên mọi quyết định đều phải bỏ phiếu — kể cả chuyện phản bội.",
  },
  {
    id: "windblown", name: "Đoàn Gió Cuốn", size: 2000, troop: "Lính Đánh Thuê", quality: "Thành Thạo",
    contractPer100: 440, wagePer100: 155, reliability: 40,
    hubs: ["volantis", "essos-slave-bay"], sinceYear: 250,
    desc: "Quân của Hoàng Tử Rách Rưới. Nhận vàng của cả hai phe là chuyện thường ngày.",
  },
  {
    id: "cat-company", name: "Đoàn Mèo", size: 3000, troop: "Lính Đánh Thuê", quality: "Thành Thạo",
    contractPer100: 400, wagePer100: 145, reliability: 55,
    hubs: ["myr", "volantis", "tyrosh"],
    desc: "Ba ngàn quân dưới lá cờ mèo vằn, nổi tiếng vì lì đòn hơn vì tài trí.",
  },
  {
    id: "long-lances", name: "Đoàn Trường Thương", size: 800, troop: "Kỵ Binh", quality: "Thành Thạo",
    contractPer100: 520, wagePer100: 190, reliability: 60,
    hubs: ["pentos", "lys", "myr"],
    desc: "Kỵ binh thương dài, ít quân nhưng mở đường rất tốt.",
  },
  {
    id: "brave-companions", name: "Đoàn Dũng Sĩ", size: 300, troop: "Lính Đánh Thuê", quality: "Mới Lập Đội",
    contractPer100: 260, wagePer100: 120, reliability: 10,
    hubs: ["kings-landing", "myr", "pentos"], sinceYear: 280,
    desc: "Người ta gọi chúng là Phường Kịch Máu. Cắt tay, xẻo mũi, và trở giáo ngay khi ngửi thấy mùi thua.",
  },
  {
    id: "hedge-knights", name: "Hiệp Sĩ Lang Bạt", size: 200, troop: "Hiệp Sĩ", quality: "Thành Thạo",
    contractPer100: 700, wagePer100: 210, reliability: 65,
    hubs: ["kings-landing", "oldtown", "gulltown", "lannisport", "white-harbor"],
    desc: "Hiệp sĩ không đất, giáp móp và một con ngựa. Rẻ hơn chư hầu, danh dự thì hên xui.",
  },
  {
    id: "free-lances", name: "Đám Giáo Tự Do", size: 600, troop: "Lính Đánh Thuê", quality: "Mới Lập Đội",
    contractPer100: 220, wagePer100: 110, reliability: 35,
    hubs: ["kings-landing", "gulltown", "oldtown", "lannisport", "white-harbor", "planky-town"],
    desc: "Lính giải ngũ, cướp hoàn lương, con thứ hết tiền. Có bao nhiêu vàng thuê được bấy nhiêu giáo.",
  },
  {
    id: "iron-shields", name: "Đoàn Khiên Sắt", size: 1000, troop: "Bộ Binh", quality: "Thành Thạo",
    contractPer100: 380, wagePer100: 140, reliability: 70,
    hubs: ["braavos", "pentos"],
    desc: "Bộ binh Braavos giải ngũ, đội hình khiên chặt như tường đá.",
  },
];

export const MERC_BY_ID: Record<string, MercCompanyData> = Object.fromEntries(
  MERC_COMPANIES.map((m) => [m.id, m]),
);

/** Chợ lính khớp với vị trí hiện tại (tên địa danh) hoặc lãnh địa đang đứng. */
export function sellswordHubsAt(location: string, territoryId?: string): SellswordHub[] {
  const loc = (location ?? "").toLowerCase();
  return SELLSWORD_HUBS.filter(
    (h) =>
      (territoryId ? h.territories.includes(territoryId) : false) ||
      (loc ? h.match.some((m) => loc.includes(m)) : false),
  );
}

/** Các đoàn có thể xuất hiện ở chợ lính này vào năm đó. */
export function companiesAtHub(hubKey: string, year: number): MercCompanyData[] {
  return MERC_COMPANIES.filter(
    (c) =>
      c.hubs.includes(hubKey) &&
      (c.sinceYear === undefined || year >= c.sinceYear) &&
      (c.untilYear === undefined || year <= c.untilYear),
  );
}
