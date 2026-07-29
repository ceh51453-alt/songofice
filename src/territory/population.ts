/**
 * population — DÂN CƯ, VIỆC LÀM VÀ THẤT NGHIỆP (M18).
 *
 * Trước đây dân số chỉ là một con số để nhân ra thuế, và cơ cấu nghề là một
 * bảng tỉ lệ cứng. Giờ nó là một hệ có TRẦN thật:
 *
 *   • Mỗi công trình mở ra một số CHỖ LÀM VIỆC theo nghề (`jobs`). Nông trại giữ
 *     nông dân, lò rèn giữ thợ rèn, mỏ giữ thợ mỏ.
 *   • Mỗi công trình nhà ở mở ra một số CHỖ Ở (`housing`). Dân vượt trần chỗ ở
 *     thành VÔ GIA CƯ — mất lòng dân, dễ sinh dịch bệnh.
 *   • Dân trong tuổi lao động được xếp vào các chỗ làm; chỗ đã kín mà người vẫn
 *     còn thì phần dư là THẤT NGHIỆP.
 *   • Sản lượng của một công trình nhân thẳng với TỈ LỆ LẤP ĐẦY của nó. Một
 *     nông trại chỉ có nửa số nông dân thì chỉ ra nửa số thóc — không còn
 *     chuyện xây xong là tự sinh ra tài nguyên từ hư không.
 *
 * Toàn bộ là hàm thuần trên một lãnh địa; construction.ts gọi lúc chốt sổ tháng.
 */
import type { StatData, JobKey } from "../mvu/schema";
import { JOB_KEYS } from "../mvu/schema";
import { BUILDING_CATALOG, LABOUR_LIST, type LabourKey } from "../content/westeros/buildings";
import { combineDecrees } from "../content/westeros/decrees";

type Holding = StatData["Lãnh Địa"][string];
type Building = Holding["Công Trình"][string];

/** Tỉ lệ dân trong tuổi lao động (trẻ con, người già, tật bệnh không tính). */
export const WORKFORCE_SHARE = 0.55;

/** Chỗ ở tối thiểu của một nơi vừa mới lập (lều trại, nhà tạm ven thành). */
export const BASE_HOUSING = 900;

/**
 * Tỉ lệ dân đã có nhà sẵn lúc lãnh địa xuất hiện. Một thị trấn 20 000 người
 * hiển nhiên đã có 20 000 chỗ ngủ — không thể coi họ là vô gia cư chỉ vì người
 * chơi chưa bấm nút xây. Nhưng 5% còn lại là dân ngụ cư chen chúc, và con số
 * này ĐỨNG YÊN từ đó: muốn dân đông thêm thì phải dựng nhà mới.
 */
export const ORGANIC_HOUSING_SHARE = 0.95;

/** Nhà cửa có sẵn của một lãnh địa (ghim một lần, không lớn theo dân số). */
export function organicHousing(holding: Holding): number {
  const stored = holding["Nhà Ở Sẵn Có"] ?? 0;
  if (stored > 0) return stored;
  return Math.max(BASE_HOUSING, Math.round((holding["Dân Số"] ?? 0) * ORGANIC_HOUSING_SHARE));
}

/**
 * Nghề "TỰ DO" — tồn tại sẵn trong dân mà không cần công trình nào cấp chỗ: tá
 * điền cày ruộng công, dân phu vác thuê, thợ đá thợ mộc làm nghề, lái buôn rong.
 * Nhóm Dân Phu/Thợ Đá/Thợ Mộc/Thợ Rèn/Kỹ Sư chính là nguồn NHÂN LỰC CÔNG TRƯỜNG.
 *
 * Tỉ lệ tính trên LỰC LƯỢNG LAO ĐỘNG. Tổng cộng khoảng 71%, nên một lãnh địa
 * chưa xây gì có sẵn ~29% thất nghiệp — đó là áp lực buộc lãnh chúa phải dựng
 * công trình để dân có việc, và cũng là trần cho việc "xây thêm là hết thất
 * nghiệp".
 */
const FREELANCE_SHARE: Partial<Record<JobKey, number>> = {
  "Nông Dân": 0.30,
  "Thợ Thủ Công": 0.05,
  "Thợ Mỏ": 0.02,
  "Tiều Phu": 0.03,
  "Thương Nhân": 0.02,
  "Dân Phu": 0.16,
  "Thợ Đá": 0.032,
  "Thợ Mộc": 0.034,
  "Thợ Rèn": 0.016,
  "Kỹ Sư": 0.003,
  "Nghề Khác": 0.05,
};

export interface JobSlot {
  /** tổng chỗ làm mở ra bởi các công trình. */
  capacity: number;
  /** số người thực sự đang làm. */
  filled: number;
}

/** Sổ nhân lực của một công trình — đúng ba dòng UI cần hiện. */
export interface BuildingStaffing {
  name: string;
  type: string;
  /** tên hiển thị (công trình tuỳ chỉnh dùng tên người chơi đặt). */
  label: string;
  /** cần bao nhiêu người theo từng nghề. */
  need: Partial<Record<JobKey, number>>;
  /** đang có bao nhiêu người theo từng nghề. */
  have: Partial<Record<JobKey, number>>;
  needTotal: number;
  haveTotal: number;
  /** 0–1 — sản lượng nhân thẳng với số này. */
  ratio: number;
}

export interface PopulationReport {
  population: number;
  workforce: number;
  /** chỗ làm & người làm theo từng nghề. */
  jobs: Record<JobKey, JobSlot>;
  /** nhân lực CÔNG TRƯỜNG rảnh rỗi (nghề tự do, chưa bị công trường giữ). */
  freelance: Record<LabourKey, number>;
  housingCapacity: number;
  homeless: number;
  unemployed: number;
  /** tỉ lệ thất nghiệp trên lực lượng lao động (0–1). */
  unemploymentRate: number;
  /** sổ nhân lực từng công trình đã xây xong. */
  staffing: BuildingStaffing[];
  staffingByName: Record<string, BuildingStaffing>;
}

function emptyJobs(): Record<JobKey, number> {
  const out = {} as Record<JobKey, number>;
  for (const k of JOB_KEYS) out[k] = 0;
  return out;
}

/** Đặc tả công năng thực tế của 1 công trình (danh mục, hoặc bản tuỳ chỉnh). */
export function buildingJobs(b: Building): Partial<Record<JobKey, number>> {
  const lvl = Math.max(1, b["Cấp Độ"] || 1);
  const custom = b["Tuỳ Chỉnh"];
  if (custom && Object.keys(custom["Nhân Lực"] ?? {}).length > 0) {
    const out: Partial<Record<JobKey, number>> = {};
    for (const [k, v] of Object.entries(custom["Nhân Lực"])) {
      if (JOB_KEYS.includes(k as JobKey)) out[k as JobKey] = Math.round((v ?? 0) * lvl);
    }
    return out;
  }
  const def = BUILDING_CATALOG[b["Loại"]];
  const out: Partial<Record<JobKey, number>> = {};
  for (const [k, v] of Object.entries(def?.jobs ?? {})) out[k as JobKey] = Math.round((v ?? 0) * lvl);
  return out;
}

/** Sức chứa dân cư của 1 công trình. */
export function buildingHousing(b: Building): number {
  const lvl = Math.max(1, b["Cấp Độ"] || 1);
  const custom = b["Tuỳ Chỉnh"];
  if (custom && (custom["Sức Chứa Dân"] ?? 0) > 0) return Math.round(custom["Sức Chứa Dân"] * lvl);
  return Math.round((BUILDING_CATALOG[b["Loại"]]?.housing ?? 0) * lvl);
}

/** Tên hiển thị của công trình — tuỳ chỉnh thì lấy tên người chơi đặt. */
export function buildingLabel(name: string, b: Building): string {
  return b["Tuỳ Chỉnh"]?.["Tên"]?.trim() || name;
}

/**
 * TRẦN DÂN SỐ: tổng chỗ ở của mọi công trình đã xong + nền, nhân thêm phần
 * thưởng hạ tầng đô thị (khu phố thợ làm nhà cửa chen chúc hơn nhưng chứa
 * được nhiều người hơn).
 */
export function housingCapacity(holding: Holding): number {
  let total = organicHousing(holding);
  let bonus = 0;
  for (const b of Object.values(holding["Công Trình"] ?? {})) {
    if (b["Đang Xây"]) continue;
    total += buildingHousing(b);
    bonus += (BUILDING_CATALOG[b["Loại"]]?.flags?.housingBonus ?? 0) * (b["Cấp Độ"] || 1);
  }
  return Math.round(total * (1 + Math.min(0.5, bonus)));
}

/**
 * Phân bổ dân cư vào các chỗ làm việc và tính ra toàn bộ sổ nhân lực.
 *
 * Thứ tự ưu tiên khi thiếu người: công trình xây trước (theo thứ tự trong state)
 * được lấp đầy trước. Nhờ vậy người chơi kiểm soát được — muốn ưu tiên khác thì
 * dỡ bớt công trình thừa, chứ không phải bốc thăm mỗi tháng.
 */
export function analysePopulation(holding: Holding): PopulationReport {
  const population = Math.max(0, holding["Dân Số"] ?? 0);
  const workforce = Math.floor(population * WORKFORCE_SHARE);
  const eff = combineDecrees(holding["Pháp Lệnh"]);

  const jobs = {} as Record<JobKey, JobSlot>;
  for (const k of JOB_KEYS) jobs[k] = { capacity: 0, filled: 0 };

  // 1. nghề tự do — tồn tại không cần công trình, là nguồn nhân lực công trường
  const freelanceCount = emptyJobs();
  for (const [k, share] of Object.entries(FREELANCE_SHARE)) {
    freelanceCount[k as JobKey] = Math.floor(workforce * (share ?? 0));
  }
  // pháp lệnh lao dịch/trưng tập kéo thêm người vào các nghề công trường
  if (eff.corveeShare > 0) {
    freelanceCount["Dân Phu"] += Math.floor(workforce * eff.corveeShare);
  }
  if (eff.craftLevyShare > 0) {
    const levied = Math.floor(workforce * 0.08 * eff.craftLevyShare);
    freelanceCount["Thợ Đá"] += Math.floor(levied * 0.5);
    freelanceCount["Thợ Mộc"] += Math.ceil(levied * 0.5);
  }

  let freelanceTotal = 0;
  for (const k of JOB_KEYS) freelanceTotal += freelanceCount[k];
  // không thể có nhiều thợ tự do hơn cả lực lượng lao động
  if (freelanceTotal > workforce) {
    const scale = workforce / freelanceTotal;
    for (const k of JOB_KEYS) freelanceCount[k] = Math.floor(freelanceCount[k] * scale);
    freelanceTotal = workforce;
  }

  // 2. chỗ làm cố định do công trình mở ra
  const done: [string, Building][] = Object.entries(holding["Công Trình"] ?? {})
    .filter(([, b]) => !b["Đang Xây"]);
  for (const [, b] of done) {
    for (const [k, v] of Object.entries(buildingJobs(b))) {
      jobs[k as JobKey].capacity += v ?? 0;
    }
  }

  // 3. xếp người vào chỗ. Ngân sách người còn lại sau khi trừ nghề tự do.
  let pool = Math.max(0, workforce - freelanceTotal);
  const staffing: BuildingStaffing[] = [];
  const staffingByName: Record<string, BuildingStaffing> = {};

  for (const [name, b] of done) {
    const need = buildingJobs(b);
    const have: Partial<Record<JobKey, number>> = {};
    let needTotal = 0;
    let haveTotal = 0;
    let ratio = 1;

    for (const [k, wanted] of Object.entries(need)) {
      const want = wanted ?? 0;
      if (want <= 0) continue;
      needTotal += want;
      const given = Math.min(want, pool);
      pool -= given;
      have[k as JobKey] = given;
      haveTotal += given;
      jobs[k as JobKey].filled += given;
      ratio = Math.min(ratio, want > 0 ? given / want : 1);
    }
    if (needTotal === 0) ratio = 1; // công trình không cần người (kho, cầu, tường)

    const entry: BuildingStaffing = {
      name, type: b["Loại"], label: buildingLabel(name, b),
      need, have, needTotal, haveTotal, ratio,
    };
    staffing.push(entry);
    staffingByName[name] = entry;
  }

  // 4. tổng kết
  for (const k of JOB_KEYS) {
    if (freelanceCount[k] > 0) {
      jobs[k].capacity += freelanceCount[k];
      jobs[k].filled += freelanceCount[k];
    }
  }
  const unemployed = pool;
  jobs["Thất Nghiệp"] = { capacity: unemployed, filled: unemployed };

  const capacity = housingCapacity(holding);
  const homeless = Math.max(0, population - capacity);

  const freelance = {} as Record<LabourKey, number>;
  for (const k of LABOUR_LIST) freelance[k] = freelanceCount[k];

  return {
    population, workforce, jobs, freelance,
    housingCapacity: capacity, homeless, unemployed,
    unemploymentRate: workforce > 0 ? unemployed / workforce : 0,
    staffing, staffingByName,
  };
}

/**
 * Ghi kết quả phân bổ vào state ("Dân Số Chi Tiết", "Sức Chứa Dân Cư",
 * "Vô Gia Cư", và tỉ lệ vận hành của từng công trình). MUTATE — gọi trong tick
 * tháng, trước khi tính sản lượng.
 */
export function applyPopulation(holding: Holding): PopulationReport {
  // ghim nhà có sẵn ngay lần chốt sổ đầu tiên, rồi không đụng tới nữa
  if (!holding["Nhà Ở Sẵn Có"]) holding["Nhà Ở Sẵn Có"] = organicHousing(holding);
  const report = analysePopulation(holding);
  const detail = holding["Dân Số Chi Tiết"];
  for (const k of JOB_KEYS) {
    (detail as Record<string, number>)[k] = report.jobs[k].filled;
  }
  detail["Thất Nghiệp"] = report.unemployed;
  holding["Sức Chứa Dân Cư"] = report.housingCapacity;
  holding["Vô Gia Cư"] = report.homeless;

  for (const [name, b] of Object.entries(holding["Công Trình"] ?? {})) {
    const s = report.staffingByName[name];
    if (!s) continue;
    b["Vận Hành"] = Math.round(s.ratio * 1000) / 1000;
    b["Nhân Lực"] = Object.fromEntries(
      Object.entries(s.have).filter(([, v]) => (v ?? 0) > 0),
    ) as Record<string, number>;
  }
  return report;
}

/**
 * Δ Lòng Dân mỗi tháng do tình hình dân cư: thất nghiệp cao và vô gia cư đều
 * bào mòn lòng dân; công ăn việc làm đầy đủ thì ngược lại.
 */
export function socialMood(report: PopulationReport): number {
  let delta = 0;
  const u = report.unemploymentRate;
  if (u > 0.35) delta -= 4;
  else if (u > 0.22) delta -= 2;
  else if (u > 0.12) delta -= 1;
  else if (u < 0.05) delta += 1;

  if (report.population > 0) {
    const homelessRate = report.homeless / report.population;
    if (homelessRate > 0.25) delta -= 5;
    else if (homelessRate > 0.1) delta -= 3;
    else if (homelessRate > 0.02) delta -= 1;
  }
  return delta;
}

/**
 * Tăng trưởng dân số MỖI THÁNG. Dân chỉ đẻ thêm khi còn chỗ ở và còn cái ăn;
 * chật chội thì người ta bỏ đi nơi khác chứ không sinh thêm.
 */
export function populationGrowth(
  holding: Holding,
  opts: { foodStock: number; foodNeed: number; loyalty: number },
): number {
  const pop = holding["Dân Số"] ?? 0;
  if (pop <= 0) return 0;
  const capacity = holding["Sức Chứa Dân Cư"] || housingCapacity(holding);

  // đói là thứ đầu tiên giết tăng trưởng
  const fed = opts.foodNeed <= 0 ? 1 : Math.min(1, opts.foodStock / opts.foodNeed);
  if (fed < 0.6) return -Math.round(pop * 0.03 * (1 - fed));

  const room = Math.max(0, 1 - pop / Math.max(1, capacity));
  const mood = (opts.loyalty - 45) / 100; // -0.45 .. +0.55
  const rate = 0.006 * room + mood * 0.004;
  return Math.round(pop * rate);
}
