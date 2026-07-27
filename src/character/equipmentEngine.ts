import type { StatData, EquipItem } from "../mvu/schema";
import { recomputeDerived } from "../mvu/effects";

export interface EquipmentSetDef {
  id: string;
  name: string;
  description: string;
  piecesRequired2?: Record<string, number>; // Bonus for 2 pieces
  piecesRequired4?: Record<string, number>; // Bonus for 4 pieces
  narrativeEffect2?: string;
  narrativeEffect4?: string;
}

export const EQUIPMENT_SETS: EquipmentSetDef[] = [
  {
    id: "nights_watch",
    name: "Bộ Đội Tuần Đêm",
    description: "Bộ trang bị màu đen kiên cường giúp chống lại cái lạnh và nỗi sợ.",
    piecesRequired2: { "Kháng Lạnh": 10, "Phòng Thủ": 2 },
    piecesRequired4: { "Tinh Tường": 2, "Kháng Lạnh": 25, "Uy Dũng": 3 },
    narrativeEffect2: "Giảm bớt ảnh hưởng của bão tuyết và thời tiết khắc nghiệt.",
    narrativeEffect4: "Tăng sĩ khí khi chiến đấu dưới lá cờ Đội Tuần Đêm."
  },
  {
    id: "stark_knight",
    name: "Bộ Hiệp Sĩ Stark",
    description: "Trang bị kiên cố mang biểu tượng Đại Sói của Nhà Stark.",
    piecesRequired2: { "Phòng Thủ": 4, "Sức Mạnh": 1 },
    piecesRequired4: { "Sát Thương Cận": 5, "Uy Tín": 3, "Thống Soái": 2 },
    narrativeEffect2: "Tăng khả năng chống đỡ đòn đánh trực diện.",
    narrativeEffect4: "Truyền cảm hứng cho quân lính Phương Bắc."
  },
  {
    id: "kingsguard",
    name: "Bộ Vệ Vương Trắng",
    description: "Bộ giáp tuyết trắng cao quý của Bảy Hiệp Sĩ Vệ Vương.",
    piecesRequired2: { "Phòng Thủ": 6, "Uy Tín": 2 },
    piecesRequired4: { "Phòng Thủ": 12, "Uy Tín": 5, "Vinh Dự": 5 },
    narrativeEffect2: "Gợi lên sự tôn kính từ thần dân và quý tộc.",
    narrativeEffect4: "Nhận hiệu ứng Bảo Vệ Quân Vương: giảm 30% sát thương từ đòn chí mạng."
  },
  {
    id: "valyrian_master",
    name: "Bộ Thép Valyria Huyền Thoại",
    description: "Trang bị rèn từ bí thuật Valyria cổ đại, siêu nhẹ và sắc bén tuyệt đối.",
    piecesRequired2: { "Sát Thương Cận": 6, "Nhanh Nhẹn": 2 },
    piecesRequired4: { "Sát Thương Cận": 12, "Xuyên Giáp": 5, "Nhanh Nhẹn": 4 },
    narrativeEffect2: "Tăng tốc độ vung kiếm và phản ứng.",
    narrativeEffect4: "Vũ khí và giáp phát ra ánh sáng tía huyền ảo, áp chế kẻ địch."
  }
];

export const EQUIPMENT_SET_BY_ID: Record<string, EquipmentSetDef> = Object.fromEntries(
  EQUIPMENT_SETS.map((s) => [s.id, s])
);

/** Calculate active set bonuses based on currently equipped items */
export function getActiveSetBonuses(equipped: StatData["Trang Bị Đang Mặc"]): {
  activeSets: { setDef: EquipmentSetDef; count: number; activeTier: 2 | 4 }[];
  totalBonusStats: Record<string, number>;
} {
  const setCounts: Record<string, number> = {};

  Object.values(equipped).forEach((item) => {
    if (item && item["Bộ Trang Bị"]) {
      const setId = item["Bộ Trang Bị"];
      setCounts[setId] = (setCounts[setId] || 0) + 1;
    }
  });

  const activeSets: { setDef: EquipmentSetDef; count: number; activeTier: 2 | 4 }[] = [];
  const totalBonusStats: Record<string, number> = {};

  Object.entries(setCounts).forEach(([setId, count]) => {
    const setDef = EQUIPMENT_SET_BY_ID[setId];
    if (!setDef) return;

    if (count >= 4 && setDef.piecesRequired4) {
      activeSets.push({ setDef, count, activeTier: 4 });
      Object.entries(setDef.piecesRequired4).forEach(([k, v]) => {
        totalBonusStats[k] = (totalBonusStats[k] || 0) + v;
      });
      // Also apply tier 2 bonus
      if (setDef.piecesRequired2) {
        Object.entries(setDef.piecesRequired2).forEach(([k, v]) => {
          totalBonusStats[k] = (totalBonusStats[k] || 0) + v;
        });
      }
    } else if (count >= 2 && setDef.piecesRequired2) {
      activeSets.push({ setDef, count, activeTier: 2 });
      Object.entries(setDef.piecesRequired2).forEach(([k, v]) => {
        totalBonusStats[k] = (totalBonusStats[k] || 0) + v;
      });
    }
  });

  return { activeSets, totalBonusStats };
}

/** Repair equipment item durability back to max (100) */
export function repairEquipment(
  state: StatData,
  slot: keyof StatData["Trang Bị Đang Mặc"]
): { success: boolean; goldCost: number; message: string } {
  const item = state["Trang Bị Đang Mặc"][slot] as EquipItem | undefined;
  if (!item) return { success: false, goldCost: 0, message: "Không có trang bị ở vị trí này." };

  const currentDur = item["Độ Bền"] ?? 100;
  if (currentDur >= 100) return { success: false, goldCost: 0, message: "Trang bị vẫn còn nguyên vẹn." };

  const missingDur = 100 - currentDur;
  const goldCost = Math.max(5, Math.floor(missingDur * 0.5));

  const currentGold = state["Thông Tin Nhân Vật"]["Ngân Khố"] || 0;
  if (currentGold < goldCost) {
    return { success: false, goldCost, message: `Không đủ vàng để sửa chữa (Cần ${goldCost} vàng).` };
  }

  // Deduct gold and restore durability
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = currentGold - goldCost;
  item["Độ Bền"] = 100;
  recomputeDerived(state);

  return { success: true, goldCost, message: `Đã sửa chữa ${item["Tên"]} thành công!` };
}

export interface EnhanceRequirement {
  successRate: number;
  goldCost: number;
  materialName: keyof StatData["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"];
  materialCost: number;
}

export function getEnhanceRequirement(currentLevel: number, isValyrian: boolean): EnhanceRequirement {
  const levelIndex = Math.min(Math.max(currentLevel, 0), 4);
  const successRates = [0.90, 0.75, 0.50, 0.30, 0.15]; 
  const goldCosts = [200, 500, 1500, 4000, 10000];
  const matCosts = [1, 2, 4, 8, 15];
  
  return {
    successRate: successRates[levelIndex],
    goldCost: goldCosts[levelIndex],
    materialName: isValyrian ? "Thép Valyria" : "Quặng Sắt",
    materialCost: matCosts[levelIndex]
  };
}

export type EnhanceResultType = 'success' | 'fail_safe' | 'fail_downgrade' | 'fail_broken' | 'insufficient_funds';

export function enhanceEquipment(
  state: StatData,
  slot: keyof StatData["Trang Bị Đang Mặc"]
): { success: boolean; resultType: EnhanceResultType; goldCost: number; message: string } {
  const item = state["Trang Bị Đang Mặc"][slot] as EquipItem | undefined;
  if (!item) return { success: false, resultType: 'insufficient_funds', goldCost: 0, message: "Không có trang bị ở vị trí này." };

  const currentLevel = item["Cấp Cường Hóa"] ?? 0;
  if (currentLevel >= 5) {
    return { success: false, resultType: 'insufficient_funds', goldCost: 0, message: "Trang bị đã đạt cấp cường hóa tối đa (+5)." };
  }

  const isValyrian = item["Phẩm Chất"] === "Thép Valyria" || item["Phẩm Chất"] === "Huyền Thoại";
  const req = getEnhanceRequirement(currentLevel, isValyrian);

  const currentGold = state["Thông Tin Nhân Vật"]["Ngân Khố"] || 0;
  const currentMat = state["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"]?.[req.materialName] || 0;

  if (currentGold < req.goldCost || currentMat < req.materialCost) {
    return { 
      success: false, 
      resultType: 'insufficient_funds', 
      goldCost: req.goldCost, 
      message: `Không đủ nguyên liệu (Cần ${req.goldCost} vàng và ${req.materialCost} ${req.materialName}).` 
    };
  }

  // Deduct resources
  state["Thông Tin Nhân Vật"]["Ngân Khố"] = currentGold - req.goldCost;
  if (!state["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"]) {
    state["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"] = { "Gỗ": 0, "Đá": 0, "Quặng Sắt": 0, "Lương Thực": 0, "Ngựa": 0, "Thép Valyria": 0 };
  }
  state["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"][req.materialName] = currentMat - req.materialCost;

  // RNG roll
  const roll = Math.random();
  const nextLevel = currentLevel + 1;

  if (roll <= req.successRate) {
    // SUCCESS
    item["Cấp Cường Hóa"] = nextLevel;
    
    // Scale existing attributes by +20% per tier
    const newAttr: Record<string, number> = {};
    Object.entries(item["Thuộc Tính"] || {}).forEach(([k, v]) => {
      // Revert previous scaling first by estimating base (approximate)
      // Actually, since we scale base -> current, applying 1.2x cumulatively is fine but can explode. 
      // Let's just multiply the current value by 1.2
      newAttr[k] = Math.round(v * 1.2) || v + 1;
    });
    item["Thuộc Tính"] = newAttr;

    // Update item name
    const cleanName = item["Tên"].replace(/\s\+\d+$/, "");
    item["Tên"] = `${cleanName} +${nextLevel}`;

    recomputeDerived(state);
    return {
      success: true,
      resultType: 'success',
      goldCost: req.goldCost,
      message: `Cường hóa THÀNH CÔNG! ${cleanName} đã lên cấp +${nextLevel}.`
    };
  } else {
    // FAILURE
    // Determine severity
    const failRoll = Math.random();
    
    if (failRoll < 0.3) {
      // 30% chance for safe fail
      return {
        success: false,
        resultType: 'fail_safe',
        goldCost: req.goldCost,
        message: `Cường hóa THẤT BẠI! Lò rèn quá lửa, nhưng trang bị vẫn nguyên vẹn (Mất tài nguyên).`
      };
    } else if (failRoll < 0.8 && currentLevel > 0) {
      // 50% chance for downgrade (only if > 0)
      item["Cấp Cường Hóa"] = currentLevel - 1;
      
      // Reduce attributes
      const newAttr: Record<string, number> = {};
      Object.entries(item["Thuộc Tính"] || {}).forEach(([k, v]) => {
        newAttr[k] = Math.max(1, Math.round(v / 1.2));
      });
      item["Thuộc Tính"] = newAttr;

      const cleanName = item["Tên"].replace(/\s\+\d+$/, "");
      item["Tên"] = currentLevel - 1 > 0 ? `${cleanName} +${currentLevel - 1}` : cleanName;

      recomputeDerived(state);
      return {
        success: false,
        resultType: 'fail_downgrade',
        goldCost: req.goldCost,
        message: `Cường hóa THẤT BẠI! Búa đập lệch, trang bị bị TỤT CẤP xuống +${currentLevel - 1}!`
      };
    } else {
      // 20% chance (or 70% if level 0) for broken (0 durability)
      item["Độ Bền"] = 0;
      recomputeDerived(state);
      return {
        success: false,
        resultType: 'fail_broken',
        goldCost: req.goldCost,
        message: `Cường hóa THẤT BẠI THẢM HẠI! Vũ khí bị nứt vỡ nghiêm trọng (Độ Bền về 0). Cần phải sửa chữa!`
      };
    }
  }
}
