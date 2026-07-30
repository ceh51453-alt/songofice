// content/westeros/armyBranches.ts
// ============================================================================
// NGẠCH QUÂN (M19) — luật chơi của chế độ quân sự phong kiến.
//
// Một lãnh chúa Westeros KHÔNG có "quân đội quốc gia". Ông ta có:
//   • một nhúm THÂN BINH ăn lương quanh năm (Chính Quy) — đắt, ít, tinh nhuệ;
//   • quyền gọi DÂN CÀY đi lính theo nghĩa vụ (Phục Dịch) — đông, rẻ, tệ, và
//     phải trả về trước mùa gặt nếu không muốn dân đói và lòng dân sụp;
//   • quyền HIỆU TRIỆU CHƯ HẦU (Chư Hầu) — quân của người khác, mượn bằng uy tín
//     chứ không mua bằng vàng, tới chậm và về sớm;
//   • túi vàng để thuê LÍNH ĐÁNH THUÊ (Đánh Thuê) — có mặt ngay, nhưng trung
//     thành đúng bằng lần trả lương gần nhất.
// Mọi con số dưới đây là dữ liệu — engine chỉ đọc, không hardcode.
// ============================================================================
import type { ArmyBranch, MilitaryUnit } from "../../mvu/schema";

export interface BranchMeta {
  /** mô tả ngắn hiện trong bảng quân sự. */
  desc: string;
  /** hệ số nhân vào chi phí tuyển (Vàng). */
  goldMult: number;
  /** hệ số nhân vào lương tháng mỗi lính. */
  wageMult: number;
  /** hệ số nhân vào số NGÀY tập hợp của binh chủng. */
  musterMult: number;
  /** hệ số nhân vào số THÁNG huấn luyện. */
  trainMult: number;
  /** hạn nghĩa vụ tính bằng NGÀY; 0 = vô hạn. */
  serviceDays: number;
  /** bậc huấn luyện lúc mới thành lập. */
  startTraining: MilitaryUnit["Huấn Luyện"];
  /** trang bị lúc mới thành lập. */
  startEquipment: MilitaryUnit["Trang Bị"];
  /** sĩ khí lúc mới thành lập. */
  startMorale: MilitaryUnit["Sĩ Khí"];
  /** rút bao nhiêu người khỏi dân số cho mỗi lính (0 = không đụng dân, vd đánh thuê). */
  popPerSoldier: number;
  /** lòng dân lãnh địa tụt bao nhiêu mỗi tháng trên mỗi 1000 lính đang tòng quân. */
  loyaltyDrainPer1000: number;
  /** hệ số kinh nghiệm thu được sau mỗi trận. */
  expMult: number;
  /** có thể trở giáo khi không được trả lương. */
  canDefect: boolean;
  /** giải ngũ được bằng tay (trả dân về ruộng / cho chư hầu về nhà). */
  dismissible: boolean;
}

export const BRANCH_META: Record<ArmyBranch, BranchMeta> = {
  "Chính Quy": {
    desc: "Thân binh ăn lương quanh năm. Đắt nhất, nhưng là quân duy nhất luôn có mặt.",
    goldMult: 1, wageMult: 1, musterMult: 1, trainMult: 1,
    serviceDays: 0,
    startTraining: "Mới Lập Đội", startEquipment: "Đồng Bộ Chỉnh Tề", startMorale: "Ổn Định",
    popPerSoldier: 1, loyaltyDrainPer1000: 0.4,
    expMult: 1, canDefect: false, dismissible: true,
  },
  "Phục Dịch": {
    desc: "Dân cày bị gọi đi lính theo nghĩa vụ. Gần như không tốn vàng, nhưng ruộng bỏ hoang và hạn nghĩa vụ đếm từng ngày.",
    goldMult: 0.3, wageMult: 0.25, musterMult: 1.8, trainMult: 0.4,
    serviceDays: 90,
    startTraining: "Rời Rạc", startEquipment: "Thô Sơ", startMorale: "Dao Động",
    popPerSoldier: 1, loyaltyDrainPer1000: 3.5,
    expMult: 0.8, canDefect: false, dismissible: true,
  },
  "Chư Hầu": {
    desc: "Quân của chư hầu kéo tới theo lời hiệu triệu. Không tốn vàng nhà ta, nhưng giữ lâu là bào mòn lòng trung.",
    goldMult: 0, wageMult: 0.35, musterMult: 2.2, trainMult: 0,
    serviceDays: 180,
    startTraining: "Thành Thạo", startEquipment: "Đồng Bộ Chỉnh Tề", startMorale: "Ổn Định",
    popPerSoldier: 0, loyaltyDrainPer1000: 0,
    expMult: 1, canDefect: false, dismissible: true,
  },
  "Đánh Thuê": {
    desc: "Khế ước bằng vàng, có mặt ngay. Hết vàng là hết trung thành.",
    goldMult: 1, wageMult: 2.6, musterMult: 0.4, trainMult: 0,
    serviceDays: 0,
    startTraining: "Thành Thạo", startEquipment: "Đồng Bộ Chỉnh Tề", startMorale: "Ổn Định",
    popPerSoldier: 0, loyaltyDrainPer1000: 1.2,
    expMult: 1.2, canDefect: true, dismissible: true,
  },
};

export function branchMeta(branch: string): BranchMeta {
  return BRANCH_META[branch as ArmyBranch] ?? BRANCH_META["Chính Quy"];
}
