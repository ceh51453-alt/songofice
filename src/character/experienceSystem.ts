import type { StatData } from "../mvu/schema";
import type { EffectEvent } from "../mvu/effects";
import { CORE_STATS } from "./characterInit";
import { createLogger } from "../lib/log";

const log = createLogger("character/experienceSystem");

export function getRequiredExpForAttribute(level: number): number {
  return (level + 1) * 100;
}

export function getRequiredExpForSkill(level: number): number {
  return (level + 1) * 100;
}

export function checkAttributeLevelUpConditions(state: StatData, name: string, nextLevel: number): { canLevelUp: boolean; reason?: string } {
  const age = state["Thông Tin Nhân Vật"]["Tuổi"] || 0;
  
  if (nextLevel > 20) return { canLevelUp: false, reason: "Đã đạt giới hạn tối đa (20)." };
  
  if (nextLevel >= 15 && age < 20) {
    return { canLevelUp: false, reason: `Cần đạt 20 tuổi để nâng ${name} lên ${nextLevel}.` };
  }
  
  if (nextLevel >= 18 && age < 30) {
    return { canLevelUp: false, reason: `Cần đạt 30 tuổi để nâng ${name} lên ${nextLevel}.` };
  }
  
  return { canLevelUp: true };
}

export function checkSkillLevelUpConditions(state: StatData, name: string, nextLevel: number, group: string): { canLevelUp: boolean; reason?: string } {
  if (nextLevel > 10) return { canLevelUp: false, reason: "Đã đạt giới hạn tối đa (10)." };
  
  // Xác định chỉ số cốt lõi phụ thuộc tương đối
  let relatedCoreStat = "Sức Mạnh";
  if (group === "Sinh Tồn") relatedCoreStat = "Thể Chất";
  else if (group === "Xã Hội") relatedCoreStat = "Uy Tín";
  else if (group === "Trí Tuệ" || group === "Ma Thuật") relatedCoreStat = "Trí Tuệ";
  else if (group === "Thủ Công") relatedCoreStat = "Tinh Tường";
  else if (group === "Chiến Đấu") {
    // Kỹ năng chiến đấu phụ thuộc Sức Mạnh hoặc Nhanh Nhẹn
    if (name.includes("Cung") || name.includes("Ném") || name.includes("Lén Lút")) {
      relatedCoreStat = "Nhanh Nhẹn";
    }
  }

  const coreStatVal = state["Chỉ Số Cốt Lõi"][relatedCoreStat as keyof typeof state["Chỉ Số Cốt Lõi"]] || 0;

  if (nextLevel >= 8 && coreStatVal < 14) {
    return { canLevelUp: false, reason: `Cần ${relatedCoreStat} >= 14 để nâng ${name} lên ${nextLevel}.` };
  }
  
  if (nextLevel >= 10 && coreStatVal < 18) {
    return { canLevelUp: false, reason: `Cần ${relatedCoreStat} >= 18 để đạt cảnh giới tối cao của ${name}.` };
  }

  return { canLevelUp: true };
}

export function processExperience(state: StatData, events: EffectEvent[]): void {
  // 1. Check Attributes
  const coreExp = state["Kinh Nghiệm Chỉ Số"];
  const coreStats = state["Chỉ Số Cốt Lõi"];
  
  for (const statName of CORE_STATS) {
    const currentLevel = coreStats[statName];
    const currentExp = coreExp[statName];
    
    if (currentExp > 0 && currentLevel < 20) {
      const requiredExp = getRequiredExpForAttribute(currentLevel);
      if (currentExp >= requiredExp) {
        const condition = checkAttributeLevelUpConditions(state, statName, currentLevel + 1);
        if (condition.canLevelUp) {
          // Level up
          coreStats[statName] = currentLevel + 1;
          coreExp[statName] = currentExp - requiredExp;
          events.push({ kind: "stage_up", text: `Đột phá! ${statName} tăng lên ${currentLevel + 1}` });
          log.info(`Level up attribute: ${statName} to ${currentLevel + 1}`);
        } else {
          // Cap experience
          coreExp[statName] = requiredExp - 1;
          // Optionally emit an event if it just hit the cap
          if (currentExp >= requiredExp) {
             log.info(`Cannot level up ${statName} to ${currentLevel + 1}: ${condition.reason}`);
          }
        }
      }
    }
  }

  // 2. Check Skills
  const skills = state["Kỹ Năng"];
  for (const [skillName, skillData] of Object.entries(skills)) {
    if (!skillData) continue;
    const currentLevel = skillData["Cấp"];
    const currentExp = skillData["Kinh Nghiệm"];
    
    if (currentExp > 0 && currentLevel < 10) {
      const requiredExp = getRequiredExpForSkill(currentLevel);
      if (currentExp >= requiredExp) {
        const condition = checkSkillLevelUpConditions(state, skillName, currentLevel + 1, skillData["Nhóm"]);
        if (condition.canLevelUp) {
          skillData["Cấp"] = currentLevel + 1;
          skillData["Kinh Nghiệm"] = currentExp - requiredExp;
          events.push({ kind: "stage_up", text: `Kỹ năng tinh tiến! ${skillName} tăng lên cấp ${currentLevel + 1}` });
          log.info(`Level up skill: ${skillName} to ${currentLevel + 1}`);
        } else {
          skillData["Kinh Nghiệm"] = requiredExp - 1;
          if (currentExp >= requiredExp) {
             log.info(`Cannot level up ${skillName} to ${currentLevel + 1}: ${condition.reason}`);
          }
        }
      }
    }
  }
}
