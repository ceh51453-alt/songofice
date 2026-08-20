import {
  GovernanceProjectSchema,
  makeDefaultRegionGovernance,
  type DemesneFocus,
  type FeudalPriority,
  type GovernanceProject,
  type RegionGovernanceFocus,
  type StatData,
} from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { clamp } from "../mvu/helpers";
import { registerDailyListener, registerMonthlyListener } from "../mvu/effects";
import { absoluteDay } from "../mvu/calendar";
import { EXCHANGE_RATES } from "../economy/currency";
import { hasPrivilege } from "../character/roleplay";
import { playerHoldingIds } from "../territory/territoryEngine";
import { titleDefinition, type TitleDefinition } from "./feudalHierarchy";

const G = EXCHANGE_RATES.GOLD_TO_COPPER;
const ACTIVE_PROJECT_STATES = new Set<GovernanceProject["Trạng Thái"]>(["Đang Chuẩn Bị", "Đang Triển Khai", "Nghiệm Thu", "Đình Trệ"]);

/**
 * Hàng rào thiết kế: không một quyết sách quản trị nào được biến thành nút
 * "bấm là xong" nếu dữ liệu hành động mới vô tình khai báo thời gian quá ngắn.
 * Quy mô càng lớn càng cần một chân trời thi hành tối thiểu dài hơn.
 */
export const MIN_GOVERNANCE_PROJECT_DAYS: Record<GovernanceProject["Phạm Vi"], number> = {
  "Đất Trực Thuộc": 14,
  "Lãnh Thổ": 45,
  "Tước Địa": 30,
  "Vương Quốc": 180,
};

export interface DemesneEffects {
  foodMult: number;
  woodMult: number;
  stoneMult: number;
  oreMult: number;
  goldMult: number;
  horsesPerThousand: number;
  loyaltyPerMonth: number;
  buildSpeed: number;
}

export interface DemesneFocusDefinition {
  id: DemesneFocus;
  label: string;
  description: string;
  allocation: { "Canh Tác": number; "Đồng Cỏ": number; "Lâm Địa": number; "Thôn Ấp": number };
  effects: DemesneEffects;
  summary: string;
}

export type DemesneAllocation = DemesneFocusDefinition["allocation"];

export interface DemesnePlan {
  allocation: DemesneAllocation;
  intensity: number;
  seedReserve: number;
}

export const DEMESNE_FOCUS_DEFINITIONS: Record<DemesneFocus, DemesneFocusDefinition> = {
  "Cân Bằng": {
    id: "Cân Bằng", label: "Cân bằng điền địa",
    description: "Chia đất giữa ruộng, đồng cỏ, rừng và thôn ấp; ít cực đoan, ít biến động.",
    allocation: { "Canh Tác": 40, "Đồng Cỏ": 20, "Lâm Địa": 25, "Thôn Ấp": 15 },
    effects: { foodMult: 1, woodMult: 1, stoneMult: 1, oreMult: 1, goldMult: 1, horsesPerThousand: 0, loyaltyPerMonth: 0, buildSpeed: 0 },
    summary: "Không hệ số đặc biệt",
  },
  "Khuyến Nông": {
    id: "Khuyến Nông", label: "Mở rộng ruộng cày",
    description: "Khai hoang và ưu tiên nông hộ để tăng lương thực, đổi lại thương mại và gỗ giảm.",
    allocation: { "Canh Tác": 60, "Đồng Cỏ": 12, "Lâm Địa": 13, "Thôn Ấp": 15 },
    effects: { foodMult: 1.25, woodMult: 0.86, stoneMult: 1, oreMult: 1, goldMult: 0.92, horsesPerThousand: 0, loyaltyPerMonth: 1, buildSpeed: 0 },
    summary: "+25% lương thực · −14% gỗ · −8% thu nhập · +1 lòng dân/tháng",
  },
  "Chăn Nuôi": {
    id: "Chăn Nuôi", label: "Đồng cỏ & chiến mã",
    description: "Dành đất cho gia súc và ngựa; tăng sức kéo, thực phẩm và nguồn chiến mã nhưng bớt ruộng cày.",
    allocation: { "Canh Tác": 30, "Đồng Cỏ": 42, "Lâm Địa": 18, "Thôn Ấp": 10 },
    effects: { foodMult: 1.08, woodMult: 0.94, stoneMult: 1, oreMult: 1, goldMult: 0.98, horsesPerThousand: 0.35, loyaltyPerMonth: 0, buildSpeed: 0 },
    summary: "+8% lương thực · sinh ngựa mỗi tháng · −6% gỗ",
  },
  "Lâm Nghiệp": {
    id: "Lâm Nghiệp", label: "Giữ rừng khai mộc",
    description: "Mở đội tiều phu có kiểm soát để nuôi công trường và hạm đội, đánh đổi diện tích canh tác.",
    allocation: { "Canh Tác": 24, "Đồng Cỏ": 14, "Lâm Địa": 48, "Thôn Ấp": 14 },
    effects: { foodMult: 0.82, woodMult: 1.5, stoneMult: 1, oreMult: 1, goldMult: 1.02, horsesPerThousand: 0, loyaltyPerMonth: 0, buildSpeed: 0.05 },
    summary: "+50% gỗ · −18% lương thực · công trình nhanh hơn 5%",
  },
  "Đô Thị Hoá": {
    id: "Đô Thị Hoá", label: "Chợ & thôn ấp",
    description: "Dồn đất cho phố chợ, kho bãi và dân cư; tiền về nhanh nhưng phụ thuộc lương thực bên ngoài.",
    allocation: { "Canh Tác": 22, "Đồng Cỏ": 10, "Lâm Địa": 18, "Thôn Ấp": 50 },
    effects: { foodMult: 0.76, woodMult: 0.94, stoneMult: 1, oreMult: 1, goldMult: 1.28, horsesPerThousand: 0, loyaltyPerMonth: -1, buildSpeed: 0.05 },
    summary: "+28% thu nhập · −24% lương thực · −1 lòng dân/tháng",
  },
  "Lao Dịch": {
    id: "Lao Dịch", label: "Trưng dụng đại công trường",
    description: "Ép dân rời ruộng và khai thác vật liệu cho xây dựng; nhanh nhưng tạo bất mãn và thiếu ăn.",
    allocation: { "Canh Tác": 26, "Đồng Cỏ": 10, "Lâm Địa": 34, "Thôn Ấp": 30 },
    effects: { foodMult: 0.78, woodMult: 1.25, stoneMult: 1.25, oreMult: 1.16, goldMult: 0.9, horsesPerThousand: 0, loyaltyPerMonth: -3, buildSpeed: 0.2 },
    summary: "+20% tốc độ xây · +25% gỗ/đá · −22% lương thực · −3 lòng dân/tháng",
  },
};

export function demesneEffects(state: StatData, holdingId: string): DemesneEffects {
  return demesneEffectsForHolding(state["Lãnh Địa"][holdingId]);
}

/** Dùng cho các sổ sản lượng vốn chỉ nhận một bản ghi thành trì. */
export function demesneEffectsForHolding(holding?: StatData["Lãnh Địa"][string]): DemesneEffects {
  const management = holding?.["Quản Trị Lãnh Địa"];
  const allocation = management?.["Phân Bổ Đất"] ?? DEMESNE_FOCUS_DEFINITIONS["Cân Bằng"].allocation;
  const intensity = management?.["Cường Độ Khai Thác"] ?? 50;
  const seedReserve = management?.["Dự Trữ Hạt Giống"] ?? 50;
  const fertility = management?.["Độ Màu Mỡ"] ?? 70;
  const erosion = management?.["Xói Mòn"] ?? 5;
  return demesneEffectsForPlan({ allocation, intensity, seedReserve }, fertility, erosion);
}

/** Xem trước lợi tức và cái giá dài hạn của một kế hoạch mùa vụ. */
export function demesneEffectsForPlan(plan: DemesnePlan, fertility = 70, erosion = 5): DemesneEffects {
  const a = plan.allocation;
  const intensity = clamp(plan.intensity, 0, 100);
  const reserve = clamp(plan.seedReserve, 0, 100);
  const soil = clamp(1 + (fertility - 70) * 0.004 - (erosion - 5) * 0.003, 0.6, 1.15);
  return {
    foodMult: clamp((1 + (a["Canh Tác"] - 40) * 0.012) * (1 + (reserve - 50) * 0.002) * (1 + (intensity - 50) * 0.003) * soil, 0.45, 1.65),
    woodMult: clamp((1 + (a["Lâm Địa"] - 25) * 0.018) * (1 + (intensity - 50) * 0.002), 0.45, 1.75),
    stoneMult: clamp(1 + (intensity - 50) * 0.006 + Math.max(0, a["Lâm Địa"] - 25) * 0.003, 0.65, 1.5),
    oreMult: clamp(1 + (intensity - 50) * 0.005, 0.7, 1.4),
    goldMult: clamp((1 + (a["Thôn Ấp"] - 15) * 0.009) * (1 + (intensity - 50) * 0.002) * (1 - Math.max(0, a["Canh Tác"] - 40) * 0.004), 0.55, 1.55),
    horsesPerThousand: Math.max(0, a["Đồng Cỏ"] - 20) * 0.018,
    loyaltyPerMonth: Math.round((reserve - 50) / 20 - (intensity - 50) / 15),
    buildSpeed: clamp(Math.max(0, intensity - 50) * 0.004 + Math.max(0, a["Thôn Ấp"] - 15) * 0.001, 0, 0.25),
  };
}

export interface ManagementResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
}

export function activeGovernanceProjects(state: StatData, scope?: GovernanceProject["Phạm Vi"]): [string, GovernanceProject][] {
  return Object.entries(state["Dự Án Quản Trị"]).filter(([, project]) =>
    ACTIVE_PROJECT_STATES.has(project["Trạng Thái"]) && (!scope || project["Phạm Vi"] === scope));
}

export function governanceProjectProgress(project: GovernanceProject): number {
  return clamp(project["Ngày Công Đã Tích Lũy"] / Math.max(1, project["Ngày Cần"]) * 100, 0, 100);
}

export function governanceProjectDaysRemaining(project: GovernanceProject): number {
  return Math.max(0, Math.ceil((project["Ngày Cần"] - project["Ngày Công Đã Tích Lũy"]) / Math.max(0.1, project["Hiệu Suất Gần Nhất"] / 100)));
}

export function activeGovernanceLoad(state: StatData): number {
  return activeGovernanceProjects(state).reduce((sum, [, project]) => sum + project["Tải Hành Chính"], 0);
}

function projectId(state: StatData, scope: GovernanceProject["Phạm Vi"], target: string): string {
  const base = `du-an-${absoluteDay(state["Thế Giới"])}-${scope}-${target || "toan-coi"}`
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-");
  let id = base;
  let suffix = 2;
  while (state["Dự Án Quản Trị"][id]) id = `${base}-${suffix++}`;
  return id;
}

function startGovernanceProject(state: StatData, project: GovernanceProject): ManagementResult {
  const scheduledProject: GovernanceProject = {
    ...project,
    "Ngày Cần": Math.max(project["Ngày Cần"], MIN_GOVERNANCE_PROJECT_DAYS[project["Phạm Vi"]]),
  };
  const upfront = Math.min(scheduledProject["Kinh Phí (Đồng Đỏ)"], Math.ceil(scheduledProject["Kinh Phí (Đồng Đỏ)"] * 0.15));
  if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < upfront) {
    return { ok: false, error: `Cần ít nhất ${Math.ceil(upfront / G).toLocaleString("vi-VN")} Rồng Vàng để khởi động`, ops: [] };
  }
  const id = projectId(state, scheduledProject["Phạm Vi"], scheduledProject["Mục Tiêu"]);
  return {
    ok: true,
    ops: [
      ...(upfront > 0 ? [{ op: "delta" as const, path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -upfront }] : []),
      { op: "replace", path: `stat_data.Dự Án Quản Trị.${id}`, value: { ...scheduledProject, "Đã Chi (Đồng Đỏ)": upfront } },
    ],
  };
}

function makeGovernanceProject(input: Partial<GovernanceProject> & Pick<GovernanceProject, "Tên" | "Phạm Vi" | "Mục Tiêu" | "Hành Động">): GovernanceProject {
  return GovernanceProjectSchema.parse(input);
}

function hasActiveProject(state: StatData, scope: GovernanceProject["Phạm Vi"], target: string): boolean {
  return activeGovernanceProjects(state, scope).some(([, project]) => project["Mục Tiêu"] === target);
}

function resultLabels(changes: Record<string, number | undefined>): string[] {
  return Object.entries(changes).map(([metric, value]) => `${metric} ${(value ?? 0) >= 0 ? "+" : ""}${value ?? 0}`);
}

/** Mô tả ngắn các hiệu ứng lan sang hệ thống khác để UI không giấu trade-off. */
export function governanceActionConnections(actionId: string): string[] {
  const connections: Record<string, string[]> = {
    "inspect-demesne": ["Lòng dân đất trực thuộc +2", "Độ màu mỡ +1"],
    "hold-court": ["Trật tự mọi lãnh thổ +2", "Bất ổn mọi lãnh thổ -2"],
    "audit-vassals": ["Hội nhập mọi lãnh thổ +2"],
    "grant-concessions": ["Chấp nhận văn hóa vùng +4", "Bất ổn vùng -2"],
    "fortify-march": ["Phủ sóng phòng thủ vùng +6", "Tăng tốc và thiện chí quân dịch"],
    "grant-charter": ["Hạ tầng mọi lãnh thổ +3", "Nâng nền thuế và thương mại"],
    "cadastre": ["Hội nhập vùng +5", "Hạ tầng vùng +2", "Chấp nhận văn hóa -2"],
    "estates-diet": ["Chấp nhận văn hóa vùng +3", "Bất ổn vùng -2"],
    "endow-hospices": ["An ninh lương thực vùng +3", "Lòng dân đất trực thuộc +2"],
    "host-vassal-heirs": ["Trung thành từng chư hầu +5", "Quân dịch đáng tin cậy hơn"],
    "royal-progress": ["Trật tự vùng +3", "Chấp nhận văn hóa +4", "Bất ổn -3"],
    "great-council": ["Hội nhập vùng +3", "Chấp nhận văn hóa +3", "Bất ổn -2"],
    "relief-realm": ["An ninh lương thực vùng +14", "Bất ổn vùng -10", "Lòng dân đất trực thuộc +4"],
    "royal-census": ["Hội nhập vùng +9", "Hạ tầng vùng +3", "Chấp nhận văn hóa -3"],
    "codify-realm-law": ["Trật tự vùng +7", "Hội nhập vùng +5", "Chấp nhận văn hóa -3"],
    "frontier-command": ["Phủ sóng phòng thủ vùng +12", "Hạ tầng vùng +3", "Quân dịch tới nhanh hơn"],
    "crown-credit": ["Hạ tầng vùng +5", "Hội nhập vùng +2", "Nâng nền thuế và thương mại"],
    "realm-concordat": ["Chấp nhận văn hóa vùng +7", "Bất ổn vùng -5"],
  };
  return connections[actionId] ?? [];
}

function governanceAgendaConnections(actionIds: string[]): string[] {
  return [...new Set(actionIds.flatMap(governanceActionConnections))];
}

export function changeDemesneFocus(state: StatData, holdingId: string, focus: DemesneFocus): ManagementResult {
  const definition = DEMESNE_FOCUS_DEFINITIONS[focus];
  return changeDemesnePlan(state, holdingId, {
    allocation: definition.allocation,
    intensity: focus === "Lao Dịch" ? 85 : state["Lãnh Địa"][holdingId]?.["Quản Trị Lãnh Địa"]?.["Cường Độ Khai Thác"] ?? 50,
    seedReserve: focus === "Khuyến Nông" ? 65 : state["Lãnh Địa"][holdingId]?.["Quản Trị Lãnh Địa"]?.["Dự Trữ Hạt Giống"] ?? 50,
  }, focus);
}

export function changeDemesnePlan(
  state: StatData,
  holdingId: string,
  plan: DemesnePlan,
  namedFocus?: DemesneFocus,
): ManagementResult {
  const holding = state["Lãnh Địa"][holdingId];
  if (!holding) return { ok: false, error: "Không tìm thấy thành trì và lãnh địa trực thuộc", ops: [] };
  if (!playerHoldingIds(state).includes(holdingId)) return { ok: false, error: "Đây không phải đất trực thuộc do ngươi quản lý", ops: [] };
  if (!hasPrivilege(state, "Quản Trị Lãnh Địa Trực Thuộc")) {
    return { ok: false, error: "Tước vị hiện tại không có quyền điều hành lãnh địa", ops: [] };
  }
  if (hasActiveProject(state, "Đất Trực Thuộc", holdingId)) {
    return { ok: false, error: "Điền địa này đang chuyển đổi theo một kế hoạch khác", ops: [] };
  }
  const values = Object.values(plan.allocation);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    return { ok: false, error: "Mỗi loại đất phải nằm trong khoảng 0–100%", ops: [] };
  }
  if (Math.round(values.reduce((sum, value) => sum + value, 0)) !== 100) {
    return { ok: false, error: "Tổng quỹ đất phải đúng 100%", ops: [] };
  }
  if (plan.intensity < 0 || plan.intensity > 100 || plan.seedReserve < 0 || plan.seedReserve > 100) {
    return { ok: false, error: "Cường độ và dự trữ phải nằm trong khoảng 0–100", ops: [] };
  }
  const focus = namedFocus ?? inferDemesneFocus(plan);
  const current = holding["Quản Trị Lãnh Địa"];
  const landChange = Object.keys(plan.allocation).reduce((sum, key) =>
    sum + Math.abs(plan.allocation[key as keyof DemesneAllocation] - current["Phân Bổ Đất"][key as keyof DemesneAllocation]), 0) / 2;
  const policyChange = Math.abs(plan.intensity - current["Cường Độ Khai Thác"])
    + Math.abs(plan.seedReserve - current["Dự Trữ Hạt Giống"]);
  const durationDays = clamp(Math.round(14 + landChange * 0.9 + policyChange * 0.35), 14, 90);
  const costGold = Math.round(12 + landChange * 1.1 + policyChange * 0.35);
  const effects = demesneEffectsForPlan(plan, current["Độ Màu Mỡ"], current["Xói Mòn"]);
  return startGovernanceProject(state, makeGovernanceProject({
    "Tên": `Chuyển đổi điền địa: ${DEMESNE_FOCUS_DEFINITIONS[focus].label}`,
    "Phạm Vi": "Đất Trực Thuộc",
    "Mục Tiêu": holdingId,
    "Hành Động": [focus],
    "Ngày Khởi Công": absoluteDay(state["Thế Giới"]),
    "Ngày Cần": durationDays,
    "Kinh Phí (Đồng Đỏ)": costGold * G,
    "Tải Hành Chính": durationDays >= 60 ? 2 : 1,
    "Kết Quả Dự Kiến": [`Lương ${Math.round((effects.foodMult - 1) * 100)}%`, `Gỗ ${Math.round((effects.woodMult - 1) * 100)}%`, `Thu nhập ${Math.round((effects.goldMult - 1) * 100)}%`],
    "Phân Bổ Mục Tiêu": plan.allocation,
    "Cường Độ Mục Tiêu": Math.round(plan.intensity),
    "Dự Trữ Mục Tiêu": Math.round(plan.seedReserve),
    "Trọng Tâm Mục Tiêu": focus,
  }));
}

function inferDemesneFocus(plan: DemesnePlan): DemesneFocus {
  if (plan.intensity >= 75) return "Lao Dịch";
  const a = plan.allocation;
  const biggest = Object.entries(a).sort((left, right) => right[1] - left[1])[0]?.[0];
  if (biggest === "Canh Tác") return "Khuyến Nông";
  if (biggest === "Đồng Cỏ") return "Chăn Nuôi";
  if (biggest === "Lâm Địa") return "Lâm Nghiệp";
  if (biggest === "Thôn Ấp") return "Đô Thị Hoá";
  return "Cân Bằng";
}

export interface FeudalModifiers {
  vassalTaxMult: number;
  musterLoyaltyBonus: number;
  unrestRisk: number;
  administrationEfficiency: number;
}

export function feudalModifiers(state: StatData): FeudalModifiers {
  const governance = state["Quản Trị Tước Địa"];
  const priority = governance["Ưu Tiên"];
  const priorityTax = priority === "Tập Quyền" ? 0.12 : priority === "Nhượng Bộ Chư Hầu" ? -0.1 : 0;
  const priorityMuster = priority === "Nhượng Bộ Chư Hầu" ? 8 : priority === "Tập Quyền" ? -5 : priority === "Biên Phòng" ? 4 : 0;
  const authority = governance["Uy Quyền"];
  const legitimacy = governance["Chính Danh"];
  const cohesion = governance["Gắn Kết Chư Hầu"];
  const burden = governance["Gánh Nặng Hành Chính"];
  const exhaustion = governance["Kiệt Quệ Chiến Tranh"];
  const centers = governance["Trung Tâm Quyền Lực"];
  const projectLoad = activeGovernanceLoad(state);
  return {
    vassalTaxMult: clamp(1 + (authority - 45) * 0.006 + (legitimacy - 55) * 0.002 + (centers["Vương Quyền"] - 35) * 0.002 + priorityTax - projectLoad * 0.004, 0.6, 1.4),
    // Một bộ máy đang ôm quá nhiều dự án cũng phản hồi lệnh quân dịch chậm và
    // dễ làm chư hầu viện cớ nghĩa vụ chưa rõ. Đây là tác động tạm thời: khi
    // nghiệm thu xong, tải dự án biến mất và thành quả mới bắt đầu phát huy.
    musterLoyaltyBonus: (cohesion - 50) * 0.25 + (legitimacy - 55) * 0.1
      + (centers["Chư Hầu"] - 35) * 0.12 + priorityMuster - projectLoad * 0.15,
    unrestRisk: clamp((100 - legitimacy) * 0.25 + burden * 0.45 + exhaustion * 0.25 + projectLoad * 0.5 - cohesion * 0.2 - (centers["Giáo Quyền"] - 20) * 0.08, 0, 100),
    administrationEfficiency: clamp(1 - burden / 160 + authority / 300 + (centers["Đô Thị"] - 20) / 500 - projectLoad / 80, 0.45, 1.25),
  };
}

export interface FeudalSnapshot {
  title: TitleDefinition;
  directHoldingIds: string[];
  controlledRegionIds: string[];
  vassalCount: number;
  administrativeCapacity: number;
  calculatedBurden: number;
  modifiers: FeudalModifiers;
}

export function feudalSnapshot(state: StatData): FeudalSnapshot {
  const title = titleDefinition(state["Thông Tin Nhân Vật"]["Tước Vị"]);
  const directHoldingIds = playerHoldingIds(state);
  const controlledRegionIds = Object.entries(state["Chủ Quyền Lãnh Thổ"])
    .filter(([, sovereignty]) => sovereignty["Là Của Người Chơi"])
    .map(([id]) => id);
  const vassalCount = Object.keys(state["Chư Hầu"]).length;
  const administrativeCapacity = 8 + title.rank * 8 + Math.max(0, state["Chỉ Số Cốt Lõi"]["Trí Tuệ"] - 8) * 2;
  const rawLoad = directHoldingIds.length * 5 + controlledRegionIds.length * 8 + vassalCount * 4
    + activeGovernanceLoad(state) * 5;
  const calculatedBurden = clamp(Math.round(rawLoad - administrativeCapacity + 15), 0, 100);
  return { title, directHoldingIds, controlledRegionIds, vassalCount, administrativeCapacity, calculatedBurden, modifiers: feudalModifiers(state) };
}

export type RegionGovernanceMetric =
  | "Trật Tự" | "Hội Nhập" | "Hạ Tầng" | "An Ninh Lương Thực"
  | "Phủ Sóng Phòng Thủ" | "Chấp Nhận Văn Hoá" | "Bất Ổn";

export interface RegionalActionDefinition {
  id: string;
  label: string;
  category: "An Dân" | "Hành Chính" | "Kinh Tế" | "Quân Sự";
  description: string;
  focus: RegionGovernanceFocus;
  costGold: number;
  durationDays: number;
  changes: Partial<Record<RegionGovernanceMetric, number>>;
  realmChanges?: Partial<Record<"Chính Danh" | "Uy Quyền" | "Gánh Nặng Hành Chính" | "An Ninh Biên Giới", number>>;
}

export const REGIONAL_ACTIONS: RegionalActionDefinition[] = [
  { id: "circuit-judges", label: "Cử quan tòa lưu động", category: "An Dân", focus: "Bình Ổn", costGold: 110, durationDays: 60,
    description: "Giải quyết án tồn và tranh chấp ruộng đất tận địa phương; dân thấy luật pháp hiện diện ngoài thành chính.",
    changes: { "Trật Tự": 9, "Hội Nhập": 3, "Bất Ổn": -7 }, realmChanges: { "Chính Danh": 2, "Gánh Nặng Hành Chính": 2 } },
  { id: "regional-census", label: "Lập địa bạ và hộ tịch", category: "Hành Chính", focus: "Hội Nhập", costGold: 170, durationDays: 150,
    description: "Đo đất, ghi hộ và thống nhất nghĩa vụ; tăng khả năng thu thuế nhưng phơi bày sự can thiệp của trung ương.",
    changes: { "Hội Nhập": 11, "Hạ Tầng": 2, "Chấp Nhận Văn Hoá": -3 }, realmChanges: { "Uy Quyền": 3, "Gánh Nặng Hành Chính": 3 } },
  { id: "road-wards", label: "Tu sửa quan lộ và cầu", category: "Kinh Tế", focus: "Hạ Tầng", costGold: 260, durationDays: 240,
    description: "Mở nút thắt giao thông để thuế, lương và quân đi nhanh hơn; hiệu quả tăng dần theo thời gian.",
    changes: { "Hạ Tầng": 13, "An Ninh Lương Thực": 3, "Trật Tự": 2 }, realmChanges: { "Gánh Nặng Hành Chính": 2 } },
  { id: "granary-network", label: "Dựng mạng kho vùng", category: "Kinh Tế", focus: "Lương Thảo", costGold: 230, durationDays: 180,
    description: "Mua thóc lúc rẻ, chia kho và đặt người trông coi; chống đói và giúp đại quân không vét sạch làng mạc.",
    changes: { "An Ninh Lương Thực": 14, "Trật Tự": 3, "Bất Ổn": -3 }, realmChanges: { "Chính Danh": 2 } },
  { id: "watchtowers", label: "Lập chuỗi tháp hiệu", category: "Quân Sự", focus: "Phòng Thủ", costGold: 280, durationDays: 210,
    description: "Tháp lửa, kỵ trạm và đội tuần biên tạo cảnh báo sớm thay vì chờ địch tới chân thành.",
    changes: { "Phủ Sóng Phòng Thủ": 15, "Hạ Tầng": 3 }, realmChanges: { "An Ninh Biên Giới": 4, "Gánh Nặng Hành Chính": 2 } },
  { id: "local-compacts", label: "Công nhận lệ tục địa phương", category: "An Dân", focus: "Hội Nhập", costGold: 90, durationDays: 75,
    description: "Giữ các quyền tục vô hại để người địa phương chấp nhận người cai trị mới; đổi lại quá trình chuẩn hóa chậm hơn.",
    changes: { "Chấp Nhận Văn Hoá": 12, "Bất Ổn": -8, "Hội Nhập": -2 }, realmChanges: { "Chính Danh": 3, "Uy Quyền": -2 } },
  { id: "martial-pacification", label: "Thiết quân luật có mục tiêu", category: "Quân Sự", focus: "Bình Ổn", costGold: 190, durationDays: 90,
    description: "Đánh vào ổ nổi loạn và giữ các điểm then chốt. Trật tự đến nhanh nhưng vết thương văn hóa còn lâu.",
    changes: { "Trật Tự": 16, "Phủ Sóng Phòng Thủ": 6, "Bất Ổn": -10, "Chấp Nhận Văn Hoá": -9 }, realmChanges: { "Uy Quyền": 4, "Chính Danh": -3 } },
];

export function takeRegionalAction(state: StatData, regionId: string, actionId: string): ManagementResult {
  const sovereignty = state["Chủ Quyền Lãnh Thổ"][regionId];
  const action = REGIONAL_ACTIONS.find((candidate) => candidate.id === actionId);
  if (!sovereignty || !action) return { ok: false, error: "Không tìm thấy vùng hoặc chiến dịch", ops: [] };
  if (!sovereignty["Là Của Người Chơi"] || !hasPrivilege(state, "Quản Lý Vùng")) {
    return { ok: false, error: "Ngươi không có thẩm quyền cai quản lãnh thổ này", ops: [] };
  }
  if (hasActiveProject(state, "Lãnh Thổ", regionId)) {
    return { ok: false, error: "Lãnh thổ này đang triển khai một chiến dịch khác", ops: [] };
  }
  const scale = 1 + Math.max(0, feudalSnapshot(state).controlledRegionIds.length - 1) * 0.04;
  const costGold = Math.round(action.costGold * scale);
  return startGovernanceProject(state, makeGovernanceProject({
    "Tên": action.label,
    "Phạm Vi": "Lãnh Thổ",
    "Mục Tiêu": regionId,
    "Hành Động": [action.id],
    "Ngày Khởi Công": absoluteDay(state["Thế Giới"]),
    "Ngày Cần": action.durationDays,
    "Kinh Phí (Đồng Đỏ)": costGold * G,
    "Tải Hành Chính": action.category === "Quân Sự" || action.category === "Hành Chính" ? 3 : 2,
    "Kết Quả Dự Kiến": [...resultLabels(action.changes), ...resultLabels(action.realmChanges ?? {})],
  }));
}

export interface FeudalActionDefinition {
  id: string;
  label: string;
  description: string;
  minRank: number;
  realmOnly?: boolean;
  costGold: number;
  durationDays?: number;
  priority?: FeudalPriority;
  changes: Partial<Record<"Chính Danh" | "Uy Quyền" | "Gắn Kết Chư Hầu" | "An Ninh Biên Giới" | "Gánh Nặng Hành Chính" | "Kiệt Quệ Chiến Tranh", number>>;
}

export const FEUDAL_ACTIONS: FeudalActionDefinition[] = [
  {
    id: "inspect-demesne", label: "Tuần du đất trực thuộc", minRank: 2, costGold: 60,
    description: "Nghe quản gia, nông hộ và đội tuần tra; giảm khoảng cách giữa chủ đất với đời sống thật.",
    changes: { "Chính Danh": 4, "Gánh Nặng Hành Chính": -5 },
  },
  {
    id: "hold-court", label: "Mở phiên thỉnh nguyện", minRank: 3, costGold: 120,
    description: "Xét tranh chấp và nghe dân/chư hầu; tốn nghi lễ nhưng bồi đắp chính danh.",
    changes: { "Chính Danh": 7, "Gắn Kết Chư Hầu": 3, "Gánh Nặng Hành Chính": -2 },
  },
  {
    id: "audit-vassals", label: "Kiểm kê nghĩa vụ chư hầu", minRank: 3, costGold: 80, priority: "Tập Quyền",
    description: "Siết sổ địa tô và quân dịch. Thuận cho uy quyền, dễ làm chư hầu bất mãn.",
    changes: { "Uy Quyền": 9, "Gắn Kết Chư Hầu": -7, "Gánh Nặng Hành Chính": 4 },
  },
  {
    id: "grant-concessions", label: "Xác nhận đặc quyền cũ", minRank: 3, costGold: 160, priority: "Nhượng Bộ Chư Hầu",
    description: "Đổi bớt quyền trung ương lấy sự hợp tác tự nguyện của các lãnh chúa dưới quyền.",
    changes: { "Uy Quyền": -6, "Gắn Kết Chư Hầu": 11, "Chính Danh": 3 },
  },
  {
    id: "fortify-march", label: "Củng cố biên phòng", minRank: 5, costGold: 220, priority: "Biên Phòng",
    description: "Dồn người, trạm gác và tiếp vận tới vùng biên; đặc biệt đúng chức năng của một Hầu quốc.",
    changes: { "An Ninh Biên Giới": 13, "Gánh Nặng Hành Chính": 4, "Kiệt Quệ Chiến Tranh": -2 },
  },
  {
    id: "grant-charter", label: "Ban đặc quyền chợ", minRank: 4, costGold: 240, priority: "Thương Mại",
    description: "Chuẩn hóa thuế chợ, cân đo và đường thương mại; tăng chính danh đô thị nhưng làm địa chủ dè chừng.",
    changes: { "Chính Danh": 5, "Gắn Kết Chư Hầu": -2, "Gánh Nặng Hành Chính": 2 },
  },
  {
    id: "cadastre", label: "Đại địa bạ tước địa", minRank: 4, costGold: 310, durationDays: 240, priority: "Tập Quyền",
    description: "Đo lại đất, nguồn nước và nghĩa vụ của từng phong địa để triều chính biết mình thực sự cai quản cái gì.",
    changes: { "Uy Quyền": 7, "Gánh Nặng Hành Chính": -7, "Gắn Kết Chư Hầu": -4 },
  },
  {
    id: "estates-diet", label: "Triệu tập hội nghị đẳng cấp", minRank: 5, costGold: 360, durationDays: 90, priority: "Cân Bằng",
    description: "Cho chư hầu, giáo sĩ và thị trấn tranh luận ngân sách trước khi chủ tọa chốt nghị trình chung.",
    changes: { "Chính Danh": 6, "Gắn Kết Chư Hầu": 7, "Uy Quyền": -2, "Gánh Nặng Hành Chính": -3 },
  },
  {
    id: "endow-hospices", label: "Bảo trợ nhà tế bần", minRank: 3, costGold: 210, priority: "Phúc Lợi",
    description: "Giao giáo đoàn vận hành nhà trọ, cứu tế và chữa bệnh; đổi ngân khố lấy mạng lưới phúc lợi có uy tín.",
    changes: { "Chính Danh": 8, "Kiệt Quệ Chiến Tranh": -3, "Uy Quyền": -1 },
  },
  {
    id: "host-vassal-heirs", label: "Nuôi dạy người thừa kế chư hầu", minRank: 5, costGold: 260,
    description: "Mời con cháu các nhà về triều học tập: vừa tạo quan hệ chung, vừa là con tin mềm nếu chính trị xấu đi.",
    changes: { "Gắn Kết Chư Hầu": 8, "Uy Quyền": 4, "Gánh Nặng Hành Chính": 2 },
  },
  {
    id: "royal-progress", label: "Ngự giá tuần du", minRank: 8, realmOnly: true, costGold: 480, durationDays: 240,
    description: "Mang triều đình đi qua các vùng để quyền lực vương thất hiện diện bằng người thật và phán quyết thật.",
    changes: { "Chính Danh": 10, "Gắn Kết Chư Hầu": 5, "Gánh Nặng Hành Chính": -4 },
  },
  {
    id: "great-council", label: "Triệu tập đại hội đồng", minRank: 9, realmOnly: true, costGold: 700, durationDays: 180, priority: "Cân Bằng",
    description: "Đưa đại chư hầu vào cùng một quyết định; giảm khủng hoảng chính danh nhưng phải chia sẻ tiếng nói.",
    changes: { "Chính Danh": 13, "Uy Quyền": -4, "Gắn Kết Chư Hầu": 9, "Gánh Nặng Hành Chính": -3 },
  },
  {
    id: "relief-realm", label: "Cứu tế toàn cõi", minRank: 8, realmOnly: true, costGold: 850, durationDays: 360, priority: "Phúc Lợi",
    description: "Dùng kho vương thất cứu vùng kiệt quệ; tốn kém lớn nhưng đổi thành lòng dân và sự ổn định.",
    changes: { "Chính Danh": 12, "Gắn Kết Chư Hầu": 4, "Kiệt Quệ Chiến Tranh": -10 },
  },
  {
    id: "royal-census", label: "Tổng điều tra vương quốc", minRank: 9, realmOnly: true, costGold: 920, durationDays: 720, priority: "Tập Quyền",
    description: "Lập sổ đất, hộ, cảng, mỏ và nghĩa vụ trên toàn cõi; dự án nhiều năm làm vương quyền nhìn xuyên tầng chư hầu.",
    changes: { "Uy Quyền": 12, "Gánh Nặng Hành Chính": -10, "Gắn Kết Chư Hầu": -6 },
  },
  {
    id: "codify-realm-law", label: "Pháp điển hóa luật toàn cõi", minRank: 9, realmOnly: true, costGold: 780, durationDays: 540, priority: "Cân Bằng",
    description: "Hợp nhất án lệ, lệ tục và sắc lệnh thành chuẩn chung; tăng chính danh nhưng buộc đặc quyền địa phương phải nhường bước.",
    changes: { "Chính Danh": 11, "Uy Quyền": 8, "Gắn Kết Chư Hầu": -5, "Gánh Nặng Hành Chính": -4 },
  },
  {
    id: "frontier-command", label: "Lập đại bản doanh biên cương", minRank: 8, realmOnly: true, costGold: 980, durationDays: 450, priority: "Biên Phòng",
    description: "Trao ngân sách, kho và quyền điều quân liên vùng cho một bộ chỉ huy thường trực ở biên giới.",
    changes: { "An Ninh Biên Giới": 18, "Uy Quyền": 5, "Gánh Nặng Hành Chính": 6, "Kiệt Quệ Chiến Tranh": -3 },
  },
  {
    id: "crown-credit", label: "Thiết lập tín dụng vương thất", minRank: 9, realmOnly: true, costGold: 640, durationDays: 360, priority: "Thương Mại",
    description: "Bảo chứng thương phiếu và chuẩn hóa nợ công để huy động vốn đô thị; giàu hơn nhưng đô thị có tiếng nói lớn hơn.",
    changes: { "Uy Quyền": 5, "Chính Danh": 4, "Gắn Kết Chư Hầu": -3, "Gánh Nặng Hành Chính": 3 },
  },
  {
    id: "realm-concordat", label: "Đàm phán giáo ước toàn cõi", minRank: 8, realmOnly: true, costGold: 720, durationDays: 420,
    description: "Phân định thuế, tòa án và quyền bổ nhiệm với giáo quyền để tránh hai hệ thống luật giằng co dân chúng.",
    changes: { "Chính Danh": 10, "Uy Quyền": -3, "Gắn Kết Chư Hầu": 3, "Gánh Nặng Hành Chính": -5 },
  },
];

export function availableFeudalActions(state: StatData, realmOnly = false): FeudalActionDefinition[] {
  const rank = titleDefinition(state["Thông Tin Nhân Vật"]["Tước Vị"]).rank;
  return FEUDAL_ACTIONS.filter((action) => action.minRank <= rank && (!!action.realmOnly === realmOnly));
}

export function takeFeudalAction(state: StatData, actionId: string): ManagementResult {
  return takeFeudalAgenda(state, [actionId]);
}

export type FeudalActionCategory = "Dân Sinh" | "Hành Chính" | "Chư Hầu" | "Biên Phòng" | "Kinh Tế" | "Đại Chính Sách";

export function feudalActionCategory(action: FeudalActionDefinition): FeudalActionCategory {
  if (action.realmOnly) return "Đại Chính Sách";
  if (action.priority === "Biên Phòng") return "Biên Phòng";
  if (action.priority === "Thương Mại") return "Kinh Tế";
  if (action.priority === "Phúc Lợi" || action.id === "inspect-demesne" || action.id === "hold-court" || action.id === "endow-hospices") return "Dân Sinh";
  if (action.id.includes("vassal") || action.id === "grant-concessions" || action.id === "estates-diet" || action.id === "host-vassal-heirs") return "Chư Hầu";
  return "Hành Chính";
}

export function feudalActionCapacity(action: FeudalActionDefinition): number {
  const magnitude = Object.values(action.changes).reduce((sum, value) => sum + Math.abs(value ?? 0), 0);
  return clamp(Math.ceil(magnitude / 14) + (action.realmOnly ? 1 : 0), 1, 4);
}

export function feudalActionDuration(action: FeudalActionDefinition): number {
  if (action.durationDays) return action.durationDays;
  const magnitude = Object.values(action.changes).reduce((sum, value) => sum + Math.abs(value ?? 0), 0);
  return clamp(Math.round(30 + magnitude * 4 + (action.minRank - 2) * 6), 30, action.realmOnly ? 720 : 240);
}

export function feudalAgendaDuration(actions: FeudalActionDefinition[]): number {
  if (actions.length === 0) return 0;
  const longest = Math.max(...actions.map(feudalActionDuration));
  return Math.round(longest * (1 + Math.max(0, actions.length - 1) * 0.12));
}

export function agendaCapacity(state: StatData): number {
  const snapshot = feudalSnapshot(state);
  return clamp(
    3 + Math.floor(snapshot.title.rank / 2) + Math.floor(snapshot.modifiers.administrationEfficiency * 2)
      - Math.floor(state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"] / 35),
    3, 10,
  );
}

export function availableAgendaCapacity(state: StatData): number {
  return Math.max(0, agendaCapacity(state) - activeGovernanceLoad(state));
}

export function scaledFeudalActionCost(state: StatData, action: FeudalActionDefinition): number {
  const snapshot = feudalSnapshot(state);
  const scale = 1 + Math.max(0, snapshot.title.rank - 3) * 0.12
    + snapshot.controlledRegionIds.length * 0.04 + snapshot.vassalCount * 0.025;
  return Math.round(action.costGold * scale);
}

type GovernanceMetric = keyof FeudalActionDefinition["changes"];

export interface FeudalAgendaPreview {
  actions: FeudalActionDefinition[];
  capacityUsed: number;
  capacityLimit: number;
  totalCostGold: number;
  durationDays: number;
  conflicts: string[];
  combinedChanges: Partial<Record<GovernanceMetric, number>>;
}

export function previewFeudalAgenda(state: StatData, actionIds: string[]): FeudalAgendaPreview {
  const ids = [...new Set(actionIds)];
  const actions = ids.map((id) => FEUDAL_ACTIONS.find((action) => action.id === id)).filter((action): action is FeudalActionDefinition => !!action);
  const priorities = [...new Set(actions.map((action) => action.priority).filter((priority): priority is FeudalPriority => !!priority))];
  const conflicts = priorities.length > 1 ? [`Nghị trình kéo theo ${priorities.length} ưu tiên đối nghịch: ${priorities.join(" / ")}`] : [];
  const combinedChanges: Partial<Record<GovernanceMetric, number>> = {};
  for (const action of actions) {
    for (const [metric, delta] of Object.entries(action.changes)) {
      const key = metric as GovernanceMetric;
      combinedChanges[key] = (combinedChanges[key] ?? 0) + (delta ?? 0);
    }
  }
  if (conflicts.length > 0) combinedChanges["Gánh Nặng Hành Chính"] = (combinedChanges["Gánh Nặng Hành Chính"] ?? 0) + priorities.length * 2;
  return {
    actions,
    capacityUsed: actions.reduce((sum, action) => sum + feudalActionCapacity(action), 0),
    capacityLimit: availableAgendaCapacity(state),
    totalCostGold: actions.reduce((sum, action) => sum + scaledFeudalActionCost(state, action), 0),
    durationDays: feudalAgendaDuration(actions),
    conflicts,
    combinedChanges,
  };
}

export function takeFeudalAgenda(state: StatData, actionIds: string[]): ManagementResult {
  const preview = previewFeudalAgenda(state, actionIds);
  if (preview.actions.length === 0) return { ok: false, error: "Chương trình nghị sự đang trống", ops: [] };
  const snapshot = feudalSnapshot(state);
  if (preview.actions.some((action) => action.minRank > snapshot.title.rank)) return { ok: false, error: "Có quyết sách vượt thẩm quyền tước vị", ops: [] };
  if (preview.actions.some((action) => action.realmOnly && !snapshot.title.sovereign)) return { ok: false, error: "Có đại chính sách đòi hỏi chủ quyền độc lập", ops: [] };
  if (preview.capacityUsed > preview.capacityLimit) return { ok: false, error: `Nghị trình cần ${preview.capacityUsed}, triều chính chỉ xử lý được ${preview.capacityLimit} điểm`, ops: [] };
  const runningActions = new Set(activeGovernanceProjects(state).flatMap(([, project]) => project["Hành Động"]));
  const duplicate = preview.actions.find((action) => runningActions.has(action.id));
  if (duplicate) return { ok: false, error: `“${duplicate.label}” đang được triển khai`, ops: [] };

  const realmProject = preview.actions.some((action) => action.realmOnly);
  return startGovernanceProject(state, makeGovernanceProject({
    "Tên": preview.actions.length === 1 ? preview.actions[0].label : `Nghị trình ${preview.actions.length} quyết sách`,
    "Phạm Vi": realmProject ? "Vương Quốc" : "Tước Địa",
    "Mục Tiêu": realmProject ? snapshot.title.jurisdiction : state["Quản Trị Tước Địa"]["Tên Tước Địa"],
    "Hành Động": preview.actions.map((action) => action.id),
    "Ngày Khởi Công": absoluteDay(state["Thế Giới"]),
    "Ngày Cần": preview.durationDays,
    "Kinh Phí (Đồng Đỏ)": preview.totalCostGold * G,
    "Tải Hành Chính": preview.capacityUsed,
    "Kết Quả Dự Kiến": [...resultLabels(preview.combinedChanges), ...governanceAgendaConnections(actionIds)],
  }));
}

export interface GovernancePressure { id: string; title: string; severity: number; description: string; }

export function governancePressures(state: StatData): GovernancePressure[] {
  const g = state["Quản Trị Tước Địa"];
  const snapshot = feudalSnapshot(state);
  const pressures: GovernancePressure[] = [
    { id: "admin", title: "Bộ máy quá tải", severity: Math.max(g["Gánh Nặng Hành Chính"], snapshot.calculatedBurden), description: "Sắc lệnh chậm, thuế thất thoát và quan lại tự quyết thay trung ương." },
    { id: "vassals", title: "Chư hầu ly tâm", severity: 100 - g["Gắn Kết Chư Hầu"], description: "Các nhà dưới quyền có thể trì hoãn tô thuế, quân dịch hoặc kết bè riêng." },
    { id: "legitimacy", title: "Khủng hoảng chính danh", severity: 100 - g["Chính Danh"], description: "Luật và mệnh lệnh đúng danh nghĩa nhưng thiếu sự thừa nhận ngoài thực địa." },
    { id: "frontier", title: "Biên cương sơ hở", severity: 100 - g["An Ninh Biên Giới"], description: "Tin báo chậm và vùng biên dễ bị cướp phá hoặc xâm nhập." },
    { id: "war", title: "Kiệt quệ chiến tranh", severity: g["Kiệt Quệ Chiến Tranh"], description: "Nhân lực, tín dụng và sự kiên nhẫn của các đẳng cấp đều bị bào mòn." },
  ];
  return pressures.filter((pressure) => pressure.severity >= 25).sort((left, right) => right.severity - left.severity);
}

export function cancelGovernanceProject(state: StatData, projectIdToCancel: string): ManagementResult {
  const project = state["Dự Án Quản Trị"][projectIdToCancel];
  if (!project || !ACTIVE_PROJECT_STATES.has(project["Trạng Thái"])) {
    return { ok: false, error: "Dự án không tồn tại hoặc đã kết thúc", ops: [] };
  }
  return { ok: true, ops: [{ op: "replace", path: `stat_data.Dự Án Quản Trị.${projectIdToCancel}.Trạng Thái`, value: "Đã Hủy" }] };
}

export function governanceProjectEfficiency(state: StatData, project: GovernanceProject): { rate: number; obstacles: string[] } {
  const obstacles: string[] = [];
  const capacity = Math.max(1, agendaCapacity(state));
  const load = Math.max(1, activeGovernanceLoad(state));
  const loadFactor = Math.min(1, capacity / load);
  if (load > capacity) obstacles.push(`Bộ máy quá tải ${load}/${capacity}`);

  let rate = feudalModifiers(state).administrationEfficiency * loadFactor;
  const atWar = Object.values(state["Quan Hệ Ngoại Giao"]).some((relation) => relation["Trạng Thái"] === "Chiến Tranh");
  const martial = project["Hành Động"].some((id) => id === "martial-pacification" || id === "frontier-command" || id === "watchtowers");
  if (atWar && !martial) { rate *= 0.78; obstacles.push("Chiến tranh hút nhân lực và vận tải"); }
  if (state["Quản Trị Tước Địa"]["Kiệt Quệ Chiến Tranh"] >= 60) { rate *= 0.78; obstacles.push("Kiệt quệ chiến tranh"); }

  if (project["Phạm Vi"] === "Lãnh Thổ") {
    const regional = state["Chủ Quyền Lãnh Thổ"][project["Mục Tiêu"]]?.["Quản Trị"] ?? makeDefaultRegionGovernance();
    rate *= (0.72 + regional["Hạ Tầng"] * 0.004) * (0.78 + regional["Trật Tự"] * 0.003);
    rate *= clamp(1 - Math.max(0, regional["Bất Ổn"] - 20) * 0.005, 0.45, 1);
    if (regional["Hạ Tầng"] < 35) obstacles.push("Đường sá và trạm dịch yếu");
    if (regional["Bất Ổn"] >= 55) obstacles.push("Bất ổn phá rối công vụ");
    if (regional["An Ninh Lương Thực"] < 35) { rate *= 0.82; obstacles.push("Thiếu lương nuôi dân phu"); }
  } else if (project["Phạm Vi"] === "Đất Trực Thuộc") {
    const holding = state["Lãnh Địa"][project["Mục Tiêu"]];
    const loyalty = holding?.["Lòng Dân"] ?? holding?.["Trung Thành"] ?? 50;
    rate *= 0.75 + loyalty * 0.005;
    if (loyalty < 40) obstacles.push("Nông hộ chống đối việc đổi đất");
  } else {
    const governance = state["Quản Trị Tước Địa"];
    rate *= 0.72 + (governance["Uy Quyền"] + governance["Gắn Kết Chư Hầu"]) * 0.003;
    if (governance["Gắn Kết Chư Hầu"] < 40) obstacles.push("Chư hầu trì hoãn thi hành");
    if (governance["Gánh Nặng Hành Chính"] >= 65) obstacles.push("Công văn tồn đọng ở trung ương");
  }
  return { rate: clamp(rate, 0.2, 1.5), obstacles };
}

function adjustRegion(state: StatData, regionId: string, changes: Partial<Record<RegionGovernanceMetric, number>>): void {
  const sovereignty = state["Chủ Quyền Lãnh Thổ"][regionId];
  if (!sovereignty) return;
  const governance = sovereignty["Quản Trị"] ?? (sovereignty["Quản Trị"] = makeDefaultRegionGovernance());
  for (const [metric, delta] of Object.entries(changes)) {
    const key = metric as RegionGovernanceMetric;
    governance[key] = clamp(governance[key] + (delta ?? 0), 0, 100);
  }
}

function adjustFeudal(state: StatData, changes: Partial<Record<GovernanceMetric, number>>): void {
  const governance = state["Quản Trị Tước Địa"];
  for (const [metric, delta] of Object.entries(changes)) {
    const key = metric as GovernanceMetric;
    governance[key] = clamp(governance[key] + (delta ?? 0), 0, 100);
  }
}

function ownedRegionIds(state: StatData): string[] {
  return Object.entries(state["Chủ Quyền Lãnh Thổ"]).filter(([, sovereignty]) => sovereignty["Là Của Người Chơi"]).map(([id]) => id);
}

function applyCrossSystemEffects(state: StatData, actionId: string): void {
  const regions = ownedRegionIds(state);
  const holdings = playerHoldingIds(state).map((id) => state["Lãnh Địa"][id]).filter(Boolean);
  const eachRegion = (changes: Partial<Record<RegionGovernanceMetric, number>>) => regions.forEach((id) => adjustRegion(state, id, changes));
  const eachHoldingLoyalty = (delta: number) => holdings.forEach((holding) => {
    holding["Lòng Dân"] = clamp(holding["Lòng Dân"] + delta, 0, 100);
    holding["Trung Thành"] = clamp(holding["Trung Thành"] + delta, 0, 100);
  });

  if (actionId === "inspect-demesne") { eachHoldingLoyalty(2); holdings.forEach((holding) => { holding["Quản Trị Lãnh Địa"]["Độ Màu Mỡ"] = clamp(holding["Quản Trị Lãnh Địa"]["Độ Màu Mỡ"] + 1, 0, 100); }); }
  else if (actionId === "hold-court") eachRegion({ "Trật Tự": 2, "Bất Ổn": -2 });
  else if (actionId === "audit-vassals") eachRegion({ "Hội Nhập": 2 });
  else if (actionId === "grant-concessions") eachRegion({ "Chấp Nhận Văn Hoá": 4, "Bất Ổn": -2 });
  else if (actionId === "fortify-march") eachRegion({ "Phủ Sóng Phòng Thủ": 6 });
  else if (actionId === "grant-charter") eachRegion({ "Hạ Tầng": 3, "Hội Nhập": 1 });
  else if (actionId === "cadastre") eachRegion({ "Hội Nhập": 5, "Hạ Tầng": 2, "Chấp Nhận Văn Hoá": -2 });
  else if (actionId === "estates-diet") eachRegion({ "Chấp Nhận Văn Hoá": 3, "Bất Ổn": -2 });
  else if (actionId === "endow-hospices") { eachRegion({ "An Ninh Lương Thực": 3, "Bất Ổn": -3 }); eachHoldingLoyalty(2); }
  else if (actionId === "host-vassal-heirs") Object.values(state["Chư Hầu"]).forEach((vassal) => { vassal["Trung Thành"] = clamp(vassal["Trung Thành"] + 5, 0, 100); });
  else if (actionId === "royal-progress") eachRegion({ "Trật Tự": 3, "Chấp Nhận Văn Hoá": 4, "Bất Ổn": -3 });
  else if (actionId === "great-council") eachRegion({ "Hội Nhập": 3, "Chấp Nhận Văn Hoá": 3, "Bất Ổn": -2 });
  else if (actionId === "relief-realm") { eachRegion({ "An Ninh Lương Thực": 14, "Trật Tự": 5, "Bất Ổn": -10 }); eachHoldingLoyalty(4); }
  else if (actionId === "royal-census") eachRegion({ "Hội Nhập": 9, "Hạ Tầng": 3, "Chấp Nhận Văn Hoá": -3 });
  else if (actionId === "codify-realm-law") eachRegion({ "Trật Tự": 7, "Hội Nhập": 5, "Chấp Nhận Văn Hoá": -3 });
  else if (actionId === "frontier-command") eachRegion({ "Phủ Sóng Phòng Thủ": 12, "Hạ Tầng": 3 });
  else if (actionId === "crown-credit") eachRegion({ "Hạ Tầng": 5, "Hội Nhập": 2 });
  else if (actionId === "realm-concordat") eachRegion({ "Chấp Nhận Văn Hoá": 7, "Bất Ổn": -5 });
}

function completeGovernanceProject(state: StatData, project: GovernanceProject): void {
  if (project["Phạm Vi"] === "Đất Trực Thuộc") {
    const holding = state["Lãnh Địa"][project["Mục Tiêu"]];
    if (holding && project["Phân Bổ Mục Tiêu"]) {
      const management = holding["Quản Trị Lãnh Địa"];
      management["Phân Bổ Đất"] = project["Phân Bổ Mục Tiêu"];
      management["Cường Độ Khai Thác"] = project["Cường Độ Mục Tiêu"] ?? management["Cường Độ Khai Thác"];
      management["Dự Trữ Hạt Giống"] = project["Dự Trữ Mục Tiêu"] ?? management["Dự Trữ Hạt Giống"];
      management["Trọng Tâm"] = (project["Trọng Tâm Mục Tiêu"] || "Cân Bằng") as DemesneFocus;
      management["_Lượt Đổi Gần Nhất"] = state["_engineMeta"]["_Nhịp"];
    }
    return;
  }

  if (project["Phạm Vi"] === "Lãnh Thổ") {
    const action = REGIONAL_ACTIONS.find((candidate) => candidate.id === project["Hành Động"][0]);
    if (!action) return;
    const sovereignty = state["Chủ Quyền Lãnh Thổ"][project["Mục Tiêu"]];
    if (!sovereignty) return;
    const governance = sovereignty["Quản Trị"] ?? (sovereignty["Quản Trị"] = makeDefaultRegionGovernance());
    governance["Trọng Tâm"] = action.focus;
    governance["_Lượt Chiến Dịch Cuối"] = state["_engineMeta"]["_Nhịp"];
    adjustRegion(state, project["Mục Tiêu"], action.changes);
    adjustFeudal(state, action.realmChanges ?? {});
    return;
  }

  const actions = project["Hành Động"].map((id) => FEUDAL_ACTIONS.find((action) => action.id === id)).filter((action): action is FeudalActionDefinition => !!action);
  const governance = state["Quản Trị Tước Địa"];
  const combined: Partial<Record<GovernanceMetric, number>> = {};
  const priorities = actions.map((action) => action.priority).filter((priority): priority is FeudalPriority => !!priority);
  for (const action of actions) for (const [metric, delta] of Object.entries(action.changes)) {
    const key = metric as GovernanceMetric;
    combined[key] = (combined[key] ?? 0) + (delta ?? 0);
  }
  if (new Set(priorities).size > 1) combined["Gánh Nặng Hành Chính"] = (combined["Gánh Nặng Hành Chính"] ?? 0) + new Set(priorities).size * 2;
  adjustFeudal(state, combined);
  if (priorities[0]) governance["Ưu Tiên"] = priorities[0];
  governance["_Lượt Quyết Sách Cuối"] = state["_engineMeta"]["_Nhịp"];

  const centers = governance["Trung Tâm Quyền Lực"];
  for (const action of actions) {
    if (action.priority === "Tập Quyền") { centers["Vương Quyền"] += 5; centers["Chư Hầu"] -= 3; }
    else if (action.priority === "Nhượng Bộ Chư Hầu") { centers["Chư Hầu"] += 6; centers["Vương Quyền"] -= 3; }
    else if (action.priority === "Thương Mại") centers["Đô Thị"] += 6;
    else if (action.priority === "Phúc Lợi" || action.id === "realm-concordat" || action.id === "endow-hospices") centers["Giáo Quyền"] += 5;
    else if (action.priority === "Biên Phòng") { centers["Vương Quyền"] += 2; centers["Chư Hầu"] += 2; }
    for (const center of Object.keys(centers) as (keyof typeof centers)[]) centers[center] = clamp(centers[center], 0, 100);
    applyCrossSystemEffects(state, action.id);
  }
}

/** Tiến một ngày công vụ: trả ngân sách theo tiến độ thực, chịu mọi nút thắt liên ngành. */
export function tickGovernanceProjects(state: StatData): void {
  for (const [, project] of activeGovernanceProjects(state)) {
    const efficiency = governanceProjectEfficiency(state, project);
    const nextWork = Math.min(project["Ngày Cần"], project["Ngày Công Đã Tích Lũy"] + efficiency.rate);
    const targetPaid = Math.min(project["Kinh Phí (Đồng Đỏ)"], Math.ceil(project["Kinh Phí (Đồng Đỏ)"] * (0.15 + 0.85 * nextWork / Math.max(1, project["Ngày Cần"]))));
    const installment = Math.max(0, targetPaid - project["Đã Chi (Đồng Đỏ)"]);
    if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < installment) {
      project["Trạng Thái"] = "Đình Trệ";
      project["Hiệu Suất Gần Nhất"] = 0;
      project["Trở Ngại"] = [...efficiency.obstacles, "Ngân khố không đủ chi kỳ này"];
      continue;
    }
    state["Thông Tin Nhân Vật"]["Ngân Khố"] -= installment;
    project["Đã Chi (Đồng Đỏ)"] += installment;
    project["Ngày Công Đã Tích Lũy"] = nextWork;
    project["Hiệu Suất Gần Nhất"] = Math.round(efficiency.rate * 100);
    project["Trở Ngại"] = efficiency.obstacles;
    const progress = governanceProjectProgress(project);
    project["Trạng Thái"] = progress < 15 ? "Đang Chuẩn Bị" : progress < 80 ? "Đang Triển Khai" : "Nghiệm Thu";
    if (progress >= 100) {
      const remainder = project["Kinh Phí (Đồng Đỏ)"] - project["Đã Chi (Đồng Đỏ)"];
      if (state["Thông Tin Nhân Vật"]["Ngân Khố"] < remainder) {
        project["Trạng Thái"] = "Đình Trệ";
        project["Trở Ngại"] = ["Chưa thanh toán được quyết toán cuối kỳ"];
        project["Ngày Công Đã Tích Lũy"] = Math.max(0, project["Ngày Cần"] - 0.01);
        continue;
      }
      state["Thông Tin Nhân Vật"]["Ngân Khố"] -= remainder;
      project["Đã Chi (Đồng Đỏ)"] += remainder;
      completeGovernanceProject(state, project);
      project["Trạng Thái"] = "Hoàn Tất";
      project["Hiệu Suất Gần Nhất"] = 100;
      project["Trở Ngại"] = [];
    }
  }
}

/** Biến động chậm hằng tháng: quy mô vượt khả năng sẽ thật sự tạo gánh nặng. */
export function tickFeudalGovernance(state: StatData): void {
  const governance = state["Quản Trị Tước Địa"];
  const snapshot = feudalSnapshot(state);
  governance["Gánh Nặng Hành Chính"] = clamp(
    Math.round(governance["Gánh Nặng Hành Chính"] * 0.65 + snapshot.calculatedBurden * 0.35), 0, 100,
  );

  const atWar = Object.values(state["Quan Hệ Ngoại Giao"]).some((relation) => relation["Trạng Thái"] === "Chiến Tranh");
  governance["Kiệt Quệ Chiến Tranh"] = clamp(governance["Kiệt Quệ Chiến Tranh"] + (atWar ? 3 : -2), 0, 100);
  const unrest = snapshot.controlledRegionIds.filter((id) => {
    const status = state["Chủ Quyền Lãnh Thổ"][id]?.["Tình Trạng"];
    return status === "Nổi Loạn" || status === "Đang Tranh Chấp";
  }).length;
  governance["Chính Danh"] = clamp(governance["Chính Danh"] - unrest - (governance["Gánh Nặng Hành Chính"] > 70 ? 1 : 0), 0, 100);

  if (governance["Ưu Tiên"] === "Tập Quyền") {
    governance["Uy Quyền"] = clamp(governance["Uy Quyền"] + 1, 0, 100);
    governance["Gắn Kết Chư Hầu"] = clamp(governance["Gắn Kết Chư Hầu"] - 1, 0, 100);
  } else if (governance["Ưu Tiên"] === "Nhượng Bộ Chư Hầu") {
    governance["Gắn Kết Chư Hầu"] = clamp(governance["Gắn Kết Chư Hầu"] + 1, 0, 100);
    governance["Uy Quyền"] = clamp(governance["Uy Quyền"] - 1, 0, 100);
  } else if (governance["Ưu Tiên"] === "Biên Phòng") {
    governance["An Ninh Biên Giới"] = clamp(governance["An Ninh Biên Giới"] + 2, 0, 100);
  }

  tickDemesneStewardship(state);
  tickRegionalGovernance(state);

  const centers = governance["Trung Tâm Quyền Lực"];
  if (governance["Ưu Tiên"] === "Tập Quyền") centers["Vương Quyền"] = clamp(centers["Vương Quyền"] + 1, 0, 100);
  else if (governance["Ưu Tiên"] === "Nhượng Bộ Chư Hầu") centers["Chư Hầu"] = clamp(centers["Chư Hầu"] + 1, 0, 100);
  else if (governance["Ưu Tiên"] === "Thương Mại") centers["Đô Thị"] = clamp(centers["Đô Thị"] + 1, 0, 100);
  else if (governance["Ưu Tiên"] === "Phúc Lợi") centers["Giáo Quyền"] = clamp(centers["Giáo Quyền"] + 1, 0, 100);

  // Một đẳng cấp quá mạnh sẽ biến ưu thế thành sức ép chính trị thật.
  if (centers["Chư Hầu"] > 75) governance["Uy Quyền"] = clamp(governance["Uy Quyền"] - 1, 0, 100);
  if (centers["Vương Quyền"] > 75) governance["Gắn Kết Chư Hầu"] = clamp(governance["Gắn Kết Chư Hầu"] - 1, 0, 100);
  if (centers["Giáo Quyền"] > 75) governance["Uy Quyền"] = clamp(governance["Uy Quyền"] - 1, 0, 100);
  if (centers["Đô Thị"] > 75) governance["Gánh Nặng Hành Chính"] = clamp(governance["Gánh Nặng Hành Chính"] + 1, 0, 100);
}

function tickDemesneStewardship(state: StatData): void {
  for (const id of playerHoldingIds(state)) {
    const management = state["Lãnh Địa"][id]["Quản Trị Lãnh Địa"];
    const a = management["Phân Bổ Đất"];
    const intensity = management["Cường Độ Khai Thác"];
    const reserve = management["Dự Trữ Hạt Giống"];
    const fertilityDelta = (reserve - 50) / 25 + (a["Lâm Địa"] - 25) / 20
      - Math.max(0, intensity - 55) / 12 - Math.max(0, a["Canh Tác"] - 50) / 25;
    const erosionDelta = Math.max(0, intensity - 55) / 10 + Math.max(0, a["Canh Tác"] - 50) / 18
      - Math.max(0, a["Lâm Địa"] - 25) / 18 - Math.max(0, reserve - 50) / 40;
    management["Độ Màu Mỡ"] = clamp(management["Độ Màu Mỡ"] + fertilityDelta, 0, 100);
    management["Xói Mòn"] = clamp(management["Xói Mòn"] + erosionDelta, 0, 100);
  }
}

function tickRegionalGovernance(state: StatData): void {
  // Biến chỉ số "rủi ro bất ổn" cấp tước địa thành áp lực thật ở từng vùng.
  // Nhờ vậy quá tải dự án, khủng hoảng chính danh và chư hầu ly tâm không còn
  // chỉ là con số trên bảng triều chính.
  const realmUnrestPressure = feudalModifiers(state).unrestRisk;
  for (const [regionId, sovereignty] of Object.entries(state["Chủ Quyền Lãnh Thổ"])) {
    if (!sovereignty["Là Của Người Chơi"]) continue;
    const region = sovereignty["Quản Trị"] ?? (sovereignty["Quản Trị"] = makeDefaultRegionGovernance());
    if (region["Trọng Tâm"] === "Bình Ổn") region["Trật Tự"] = clamp(region["Trật Tự"] + 2, 0, 100);
    else if (region["Trọng Tâm"] === "Hội Nhập") region["Hội Nhập"] = clamp(region["Hội Nhập"] + 2, 0, 100);
    else if (region["Trọng Tâm"] === "Phòng Thủ") region["Phủ Sóng Phòng Thủ"] = clamp(region["Phủ Sóng Phòng Thủ"] + 2, 0, 100);
    else if (region["Trọng Tâm"] === "Hạ Tầng") region["Hạ Tầng"] = clamp(region["Hạ Tầng"] + 2, 0, 100);
    else if (region["Trọng Tâm"] === "Lương Thảo") region["An Ninh Lương Thực"] = clamp(region["An Ninh Lương Thực"] + 2, 0, 100);

    if (sovereignty["Tình Trạng"] === "Mới Chiếm" && region["Hội Nhập"] < 55) region["Chấp Nhận Văn Hoá"] = clamp(region["Chấp Nhận Văn Hoá"] - 1, 0, 100);
    const statusPressure = sovereignty["Tình Trạng"] === "Nổi Loạn" ? 35
      : sovereignty["Tình Trạng"] === "Đang Tranh Chấp" ? 22
        : sovereignty["Tình Trạng"] === "Mới Chiếm" ? 15 : 0;
    const targetUnrest = clamp(
      (100 - region["Trật Tự"]) * 0.35 + (100 - region["Chấp Nhận Văn Hoá"]) * 0.2
        + (100 - region["An Ninh Lương Thực"]) * 0.15 + statusPressure
        + realmUnrestPressure * 0.2,
      0, 100,
    );
    region["Bất Ổn"] = clamp(Math.round(region["Bất Ổn"] * 0.65 + targetUnrest * 0.35), 0, 100);
    if (region["Bất Ổn"] >= 78) sovereignty["Tình Trạng"] = "Nổi Loạn";
    else if ((sovereignty["Tình Trạng"] === "Mới Chiếm" || sovereignty["Tình Trạng"] === "Đang Tranh Chấp")
      && region["Bất Ổn"] < 28 && region["Hội Nhập"] >= 60) sovereignty["Tình Trạng"] = "Ổn Định";

    // Vùng tốt giảm tải trung ương; vùng bất ổn kéo cả triều đình vào chữa cháy.
    if (region["Hạ Tầng"] >= 70 && region["Hội Nhập"] >= 65) {
      state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"] = clamp(state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"] - 0.5, 0, 100);
    } else if (region["Bất Ổn"] >= 65) {
      state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"] = clamp(state["Quản Trị Tước Địa"]["Gánh Nặng Hành Chính"] + 1, 0, 100);
      state["Quản Trị Tước Địa"]["Chính Danh"] = clamp(state["Quản Trị Tước Địa"]["Chính Danh"] - 1, 0, 100);
    }
    void regionId;
  }
}

let registered = false;
export function registerFeudalManagementLoop(): void {
  if (registered) return;
  registerDailyListener("governance-projects", tickGovernanceProjects);
  registerMonthlyListener("feudal-governance", tickFeudalGovernance);
  registered = true;
}
