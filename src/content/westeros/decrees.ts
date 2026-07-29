// content/westeros/decrees.ts
// ============================================================================
// DANH MỤC PHÁP LỆNH (10.4) — chiếu chỉ lãnh chúa ban ra, có HIỆU LỰC THẬT.
//
// Trước đây pháp lệnh chỉ là một dòng chữ mô tả: ban ra rồi chẳng ảnh hưởng gì
// tới sổ sách. Giờ mỗi pháp lệnh mang một bộ hệ số máy-đọc mà construction.ts
// áp vào lúc chốt sổ hằng tháng — thuế nặng thì tiền lên mà lòng dân xuống,
// lao dịch thì có thêm dân phu mà ruộng bỏ bê.
//
// Nguyên tắc cân bằng: mọi pháp lệnh đều PHẢI đánh đổi. Không có cái nào chỉ
// toàn lợi. Thêm pháp lệnh = thêm 1 entry, engine không cần sửa.
// ============================================================================
import { EXCHANGE_RATES } from "../../economy/currency";
import type { DECREE_KINDS } from "../../mvu/schema";
import type { LabourKey, ResourceKey } from "./buildings";

export type DecreeKind = (typeof DECREE_KINDS)[number];

export interface DecreeEffect {
  /** nhân thu Vàng từ thuế. */
  taxMult?: number;
  /** nhân thu Vàng từ thương mại (chợ, cảng, quán trọ). */
  tradeMult?: number;
  /** nhân sản lượng Lương Thực. */
  foodMult?: number;
  /** nhân sản lượng khai thác thô (Gỗ / Đá / Quặng Sắt / Than Đá). */
  miningMult?: number;
  /** cộng/trừ Lòng Dân mỗi tháng. */
  loyaltyPerMonth?: number;
  /** tỉ lệ Nông Dân bị gọi đi phu — cộng thẳng vào nhân lực Dân Phu khả dụng. */
  corveeShare?: number;
  /** tỉ lệ thợ thủ công bị trưng tập thành thợ đá/thợ mộc. */
  craftLevyShare?: number;
  /** giảm % quân lương phải nuôi (khẩu phần thời chiến). */
  rationing?: number;
  /** giảm % thời gian thi công mọi công trình. */
  buildSpeed?: number;
}

export interface DecreeDef {
  id: string;
  name: string;
  kind: DecreeKind;
  /** mô tả hệ quả cho người chơi đọc. */
  summary: string;
  /** một câu văn để AI kể lại khi chiếu chỉ được đọc trước dân. */
  flavour: string;
  /** chi phí ban hành MỘT LẦN. */
  cost?: Partial<Record<ResourceKey, number>>;
  /** chi phí duy trì MỖI THÁNG. */
  upkeep?: Partial<Record<ResourceKey, number>>;
  /** thay đổi Lòng Dân ngay khi ban hành. */
  instantLoyalty?: number;
  effect: DecreeEffect;
  /** cấp tước tối thiểu mới được ban (getTitleLevel). */
  reqLevel: number;
}

const G = EXCHANGE_RATES.GOLD_TO_COPPER;

export const DECREE_CATALOG: DecreeDef[] = [
  // ── THUẾ ──────────────────────────────────────────────────────────────────
  {
    id: "thue-nang", name: "Thuế Nặng", kind: "Thuế",
    summary: "+50% thu thuế · −3 Lòng Dân mỗi tháng",
    flavour: "Người thu thuế gõ cửa từng nhà, sổ sách dày thêm mà tiếng thở dài cũng dày thêm.",
    effect: { taxMult: 1.5, loyaltyPerMonth: -3 },
    reqLevel: 1,
  },
  {
    id: "giam-to", name: "Giảm Tô Thuế", kind: "Thuế",
    summary: "−40% thu thuế · +3 Lòng Dân mỗi tháng",
    flavour: "Chiếu giảm tô được đọc ở sân chợ; lần đầu sau nhiều năm người ta cúi đầu mà không cau mày.",
    effect: { taxMult: 0.6, loyaltyPerMonth: 3 },
    reqLevel: 1,
  },
  {
    id: "mien-thue", name: "Miễn Thuế Một Mùa", kind: "Thuế",
    summary: "Không thu thuế · +6 Lòng Dân mỗi tháng",
    flavour: "Kho thuế đóng cửa suốt mùa — một canh bạc đổi bạc lấy lòng người.",
    instantLoyalty: 5,
    effect: { taxMult: 0, loyaltyPerMonth: 6 },
    reqLevel: 2,
  },

  // ── LAO DỊCH ──────────────────────────────────────────────────────────────
  {
    id: "lao-dich", name: "Lệnh Lao Dịch", kind: "Lao Dịch",
    summary: "15% nông dân thành dân phu · −10% Lương Thực · −4 Lòng Dân mỗi tháng",
    flavour: "Trai tráng bị gọi khỏi đồng ruộng, vác đá thay vì vác lúa.",
    effect: { corveeShare: 0.15, foodMult: 0.9, loyaltyPerMonth: -4 },
    reqLevel: 1,
  },
  {
    id: "trung-tap-tho", name: "Trưng Tập Thợ Lành Nghề", kind: "Lao Dịch",
    summary: "30% thợ thủ công thành thợ đá/thợ mộc · −2 Lòng Dân mỗi tháng",
    flavour: "Lệnh trưng tập dán trước cửa phường thợ: búa và đục nay thuộc về lãnh chúa.",
    cost: { "Ngân Khố": 150 * G },
    effect: { craftLevyShare: 0.3, loyaltyPerMonth: -2 },
    reqLevel: 1,
  },
  {
    id: "cong-truong-gap", name: "Công Trường Cấp Tốc", kind: "Lao Dịch",
    summary: "−25% thời gian thi công · tốn 60 Vàng mỗi tháng · −2 Lòng Dân",
    flavour: "Đuốc cháy suốt đêm trên giàn giáo; thợ thay ca mà tường thì không ngủ.",
    upkeep: { "Ngân Khố": 60 * G },
    effect: { buildSpeed: 0.25, loyaltyPerMonth: -2 },
    reqLevel: 2,
  },

  // ── LUẬT ──────────────────────────────────────────────────────────────────
  {
    id: "khau-phan", name: "Khẩu Phần Chiến Tranh", kind: "Luật",
    summary: "−35% quân lương · −3 Lòng Dân mỗi tháng",
    flavour: "Bánh mì chia nhỏ lại, mỗi suất mỏng đi một phần ba — lính càu nhàu nhưng kho còn.",
    effect: { rationing: 0.35, loyaltyPerMonth: -3 },
    reqLevel: 1,
  },
  {
    id: "dac-cap-khai-mo", name: "Đặc Cấp Khai Mỏ", kind: "Luật",
    summary: "+25% khai thác thô · −2 Lòng Dân mỗi tháng",
    flavour: "Hầm lò đào sâu thêm, ca kíp dài thêm; đá ra nhiều hơn và tai nạn cũng vậy.",
    effect: { miningMult: 1.25, loyaltyPerMonth: -2 },
    reqLevel: 1,
  },

  // ── PHÚC LỢI ──────────────────────────────────────────────────────────────
  {
    id: "mo-kho-cuu-doi", name: "Mở Kho Cứu Đói", kind: "Phúc Lợi",
    summary: "Xuất 1.500 Lương Thực · +10 Lòng Dân ngay · +2 mỗi tháng",
    flavour: "Cửa vựa mở, người xếp hàng tới tận cổng ngoài — hôm nay không ai đói.",
    cost: { "Lương Thực": 1500 },
    instantLoyalty: 10,
    effect: { loyaltyPerMonth: 2 },
    reqLevel: 1,
  },
  {
    id: "le-hoi-mua-gat", name: "Lễ Hội Mùa Gặt", kind: "Phúc Lợi",
    summary: "Tốn 400 Vàng + 800 Lương Thực · +8 Lòng Dân ngay · +1 mỗi tháng",
    flavour: "Thùng rượu lăn ra sân, đàn hạc gảy tới khuya; một đêm quên hết mùa đông đang tới.",
    cost: { "Ngân Khố": 400 * G, "Lương Thực": 800 },
    instantLoyalty: 8,
    effect: { loyaltyPerMonth: 1 },
    reqLevel: 1,
  },

  // ── CHÍNH SÁCH KINH TẾ ────────────────────────────────────────────────────
  {
    id: "khuyen-nong", name: "Khuyến Nông", kind: "Chính sách kinh tế",
    summary: "+20% Lương Thực · tốn 200 Vàng ban đầu",
    flavour: "Học sĩ đi từng làng dạy cách luân canh và ủ phân; mùa sau lúa cao hơn một gang.",
    cost: { "Ngân Khố": 200 * G },
    effect: { foodMult: 1.2 },
    reqLevel: 1,
  },
  {
    id: "dac-quyen-thuong-nhan", name: "Đặc Quyền Thương Nhân", kind: "Chính sách kinh tế",
    summary: "+30% thu thương mại · −1 Lòng Dân mỗi tháng",
    flavour: "Thương đoàn ngoại quốc được miễn lệ phí cầu đường; hàng lạ đầy chợ, tiếng xì xào cũng đầy.",
    cost: { "Ngân Khố": 250 * G },
    effect: { tradeMult: 1.3, loyaltyPerMonth: -1 },
    reqLevel: 2,
  },

  // ── CHÍNH SÁCH QUÂN SỰ ────────────────────────────────────────────────────
  {
    id: "trung-binh", name: "Lệnh Trưng Binh", kind: "Chính sách quân sự",
    summary: "20% nông dân thành dân phu quân dịch · −12% Lương Thực · −5 Lòng Dân mỗi tháng",
    flavour: "Cờ hiệu cắm giữa làng, tên trai tráng được xướng lên từng người một.",
    effect: { corveeShare: 0.2, foodMult: 0.88, loyaltyPerMonth: -5 },
    reqLevel: 2,
  },
];

export const DECREE_BY_ID: Record<string, DecreeDef> = Object.fromEntries(
  DECREE_CATALOG.map((d) => [d.id, d]),
);

/** Gộp hiệu ứng của các pháp lệnh ĐANG HIỆU LỰC thành một bộ hệ số. */
export interface CombinedDecreeEffect {
  taxMult: number;
  tradeMult: number;
  foodMult: number;
  miningMult: number;
  loyaltyPerMonth: number;
  corveeShare: number;
  craftLevyShare: number;
  rationing: number;
  buildSpeed: number;
  upkeep: Partial<Record<ResourceKey, number>>;
}

export function combineDecrees(
  decrees: Record<string, { "Trạng Thái": string; "Mã"?: string }> | undefined,
): CombinedDecreeEffect {
  const out: CombinedDecreeEffect = {
    taxMult: 1, tradeMult: 1, foodMult: 1, miningMult: 1,
    loyaltyPerMonth: 0, corveeShare: 0, craftLevyShare: 0, rationing: 0, buildSpeed: 0,
    upkeep: {},
  };
  for (const [key, entry] of Object.entries(decrees ?? {})) {
    if (entry["Trạng Thái"] !== "Đang hiệu lực") continue;
    const def = DECREE_BY_ID[entry["Mã"] || key];
    if (!def) continue; // pháp lệnh do AI nghĩ ra: chỉ để kể, không có hệ số
    const e = def.effect;
    if (e.taxMult !== undefined) out.taxMult *= e.taxMult;
    if (e.tradeMult !== undefined) out.tradeMult *= e.tradeMult;
    if (e.foodMult !== undefined) out.foodMult *= e.foodMult;
    if (e.miningMult !== undefined) out.miningMult *= e.miningMult;
    out.loyaltyPerMonth += e.loyaltyPerMonth ?? 0;
    out.corveeShare += e.corveeShare ?? 0;
    out.craftLevyShare += e.craftLevyShare ?? 0;
    // các lệnh giảm quân lương / rút ngắn thi công cộng dồn nhưng có trần
    out.rationing = Math.min(0.6, out.rationing + (e.rationing ?? 0));
    out.buildSpeed = Math.min(0.5, out.buildSpeed + (e.buildSpeed ?? 0));
    for (const [k, v] of Object.entries(def.upkeep ?? {})) {
      out.upkeep[k as ResourceKey] = (out.upkeep[k as ResourceKey] ?? 0) + (v ?? 0);
    }
  }
  return out;
}

/** Nhân lực CỘNG THÊM nhờ pháp lệnh lao dịch (không đổi dân số, chỉ trưng dụng). */
export function decreeLabourBonus(
  jobs: Partial<Record<string, number>>,
  eff: CombinedDecreeEffect,
): Partial<Record<LabourKey, number>> {
  const farmers = jobs["Nông Dân"] ?? 0;
  const artisans = jobs["Thợ Thủ Công"] ?? 0;
  const levy = Math.floor(artisans * eff.craftLevyShare);
  return {
    "Dân Phu": Math.floor(farmers * eff.corveeShare),
    "Thợ Đá": Math.floor(levy * 0.5),
    "Thợ Mộc": levy - Math.floor(levy * 0.5),
  };
}
