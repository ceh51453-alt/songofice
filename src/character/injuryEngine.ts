import type { StatData } from "../mvu/schema";
import { WOUND_TYPES } from "../mvu/schema";

type BodyData = StatData["Cơ Thể"];
type WoundType = typeof WOUND_TYPES[number];

export const INJURY_SEVERITY: Record<string, { multiplier: number, fatalThreshold: number, symptoms: WoundType[] }> = {
  "Đầu": { multiplier: 3.0, fatalThreshold: 0, symptoms: ["Hôn Mê", "Mù Loà", "Xuất Huyết"] },
  "Cổ": { multiplier: 4.0, fatalThreshold: 0, symptoms: ["Khó Thở", "Xuất Huyết", "Mất Huyết Áp"] },
  "Ngực": { multiplier: 1.5, fatalThreshold: 0, symptoms: ["Khó Thở", "Gãy Xương", "Xuất Huyết"] },
  "Bụng": { multiplier: 1.5, fatalThreshold: 0, symptoms: ["Nhiễm Trùng", "Xuất Huyết"] },
  "Vai Trái": { multiplier: 1.0, fatalThreshold: -50, symptoms: ["Gãy Xương", "Tàn Phế"] },
  "Vai Phải": { multiplier: 1.0, fatalThreshold: -50, symptoms: ["Gãy Xương", "Tàn Phế"] },
  "Sườn Trái": { multiplier: 1.2, fatalThreshold: -20, symptoms: ["Gãy Xương", "Khó Thở"] },
  "Sườn Phải": { multiplier: 1.2, fatalThreshold: -20, symptoms: ["Gãy Xương", "Khó Thở"] },
  "Bắp Tay Trái": { multiplier: 0.8, fatalThreshold: -100, symptoms: ["Xuất Huyết", "Đứt Lìa"] },
  "Bắp Tay Phải": { multiplier: 0.8, fatalThreshold: -100, symptoms: ["Xuất Huyết", "Đứt Lìa"] },
  "Cẳng Tay Trái": { multiplier: 0.7, fatalThreshold: -100, symptoms: ["Gãy Xương", "Đứt Lìa"] },
  "Cẳng Tay Phải": { multiplier: 0.7, fatalThreshold: -100, symptoms: ["Gãy Xương", "Đứt Lìa"] },
  "Bàn Tay Trái": { multiplier: 0.5, fatalThreshold: -150, symptoms: ["Tàn Phế", "Đứt Lìa"] },
  "Bàn Tay Phải": { multiplier: 0.5, fatalThreshold: -150, symptoms: ["Tàn Phế", "Đứt Lìa"] },
  "Đùi Trái": { multiplier: 1.0, fatalThreshold: -80, symptoms: ["Xuất Huyết", "Mất Huyết Áp"] },
  "Đùi Phải": { multiplier: 1.0, fatalThreshold: -80, symptoms: ["Xuất Huyết", "Mất Huyết Áp"] },
  "Đầu Gối Trái": { multiplier: 0.8, fatalThreshold: -100, symptoms: ["Gãy Xương", "Tàn Phế"] },
  "Đầu Gối Phải": { multiplier: 0.8, fatalThreshold: -100, symptoms: ["Gãy Xương", "Tàn Phế"] },
  "Bắp Chân Trái": { multiplier: 0.7, fatalThreshold: -100, symptoms: ["Xuất Huyết"] },
  "Bắp Chân Phải": { multiplier: 0.7, fatalThreshold: -100, symptoms: ["Xuất Huyết"] },
  "Bàn Chân Trái": { multiplier: 0.5, fatalThreshold: -150, symptoms: ["Tàn Phế", "Gãy Xương"] },
  "Bàn Chân Phải": { multiplier: 0.5, fatalThreshold: -150, symptoms: ["Tàn Phế", "Gãy Xương"] },
};

export function applyDamage(body: BodyData, partName: string, rawAmount: number, forceSymptom?: WoundType): { 
  died: boolean, 
  actualDamage: number,
  newSymptoms: WoundType[]
} {
  const part = body[partName];
  if (!part) return { died: false, actualDamage: 0, newSymptoms: [] };

  const severity = INJURY_SEVERITY[partName] || { multiplier: 1.0, fatalThreshold: -50, symptoms: ["Xuất Huyết"] };
  const actualDamage = Math.round(rawAmount * severity.multiplier);

  part["Tình Trạng"] -= actualDamage;

  let died = false;
  if (part["Tình Trạng"] <= severity.fatalThreshold) {
    died = true; // Lethal damage to this body part
  }

  // Determine symptoms based on damage
  const newSymptoms: WoundType[] = [];
  if (forceSymptom && !part["Triệu Chứng"].includes(forceSymptom)) {
    newSymptoms.push(forceSymptom);
  }

  if (part["Tình Trạng"] < 50 && Math.random() < 0.5) {
    const randomSymptom = severity.symptoms[Math.floor(Math.random() * severity.symptoms.length)];
    if (!part["Triệu Chứng"].includes(randomSymptom)) {
      newSymptoms.push(randomSymptom);
    }
  }

  if (newSymptoms.length > 0) {
    part["Triệu Chứng"] = Array.from(new Set([...part["Triệu Chứng"].filter(s => s !== "Bình Thường"), ...newSymptoms])) as WoundType[];
  }

  // Set healing time based on severity (1 point of damage = 60 seconds of healing as a baseline)
  // Severe symptoms add more time
  const symptomPenalty = newSymptoms.length * 3600; // 1 hour per new symptom
  part["Thời Gian Lành Còn (giây)"] = (part["Thời Gian Lành Còn (giây)"] || 0) + (actualDamage * 60) + symptomPenalty;

  return { died, actualDamage, newSymptoms };
}

// Tick healing process. Should be called periodically (e.g., every second of game time)
export function tickHealing(body: BodyData, deltaTimeSeconds: number) {
  for (const key in body) {
    const part = body[key];
    if (!part) continue;

    if (part["Thời Gian Lành Còn (giây)"] && part["Thời Gian Lành Còn (giây)"] > 0) {
      const healedTime = Math.min(part["Thời Gian Lành Còn (giây)"], deltaTimeSeconds);
      part["Thời Gian Lành Còn (giây)"] = Math.max(0, part["Thời Gian Lành Còn (giây)"] - deltaTimeSeconds);
      
      // Gradually restore condition based on remaining time
      if (part["Tình Trạng"] < 100) {
        // Healing rate: 1 point per 60 seconds
        const healAmount = healedTime / 60;
        part["Tình Trạng"] = Math.min(100, part["Tình Trạng"] + healAmount);
      }

      if (part["Thời Gian Lành Còn (giây)"] === 0) {
        // Fully healed, clear temporary symptoms
        const permanentSymptoms = ["Tàn Phế", "Đứt Lìa", "Mù Loà"];
        part["Triệu Chứng"] = part["Triệu Chứng"].filter(s => permanentSymptoms.includes(s));
        if (part["Triệu Chứng"].length === 0) {
          part["Triệu Chứng"] = ["Bình Thường"];
        }
      }
    }
  }
}

export function startRealtimeHealingLoop(getStat: () => StatData, setStat: (stat: StatData) => void) {
  return setInterval(() => {
    const stat = getStat();
    // Only heal if the player is alive
    if (stat["Chỉ Số Sinh Tồn"]["HP"] <= 0) return;
    
    // Create a shallow copy and pass the body to tickHealing
    // We modify in place then set state to trigger re-render
    const newBody = JSON.parse(JSON.stringify(stat["Cơ Thể"])) as BodyData;
    let hasChanges = false;
    
    for (const key in newBody) {
      if (newBody[key] && (newBody[key]["Thời Gian Lành Còn (giây)"] || 0) > 0) {
        hasChanges = true;
        break;
      }
    }

    if (hasChanges) {
      tickHealing(newBody, 1); // 1 second real-time
      setStat({ ...stat, "Cơ Thể": newBody });
    }
  }, 1000);
}
