/**
 * Hiệu ứng lan toả sau patch (5.7.4) — engine tự chạy, AI không đụng:
 * 1. Tràn năm: Ngày > 360 → Năm+1 (lịch Westeros 360 ngày — 8.7).
 * 2. Tuổi NPC theo Năm Sinh khi Năm đổi (5.1e) + Giai Đoạn Đời.
 * 3. Nhãn Giai Đoạn Quan Hệ từ Độ Hảo Cảm (5.1d) — vượt ngưỡng = SỰ KIỆN (toast 6.4).
 * 4. Chỉ Số Phái Sinh tính lại từ cốt lõi + cấp + trang bị + thiên phú (5.1f-B/C1).
 * 5. Clamp HP/Thể Lực về trần mới.
 * 6. onTurnAdvance: đăng ký listener theo REGISTRY — mỗi hệ chiến lược (10-17)
 *    cắm vào; tick đúng SỐ NGÀY thời gian truyện đã trôi (6.2 — không phải mỗi tin +1).
 */
import type { StatData } from "./schema";
import { DRAGON_SIZE_HP, type DragonSize } from "./schema";
import { affinityStage, lifeStage, type Npc } from "./npcSchema";
import { clamp } from "./helpers";
import { computeRenown } from "../npc/reputationEngine";
import { decayAllMemories } from "../npc/memoryEngine";
import { humanAgeMod, dragonAgeMod } from "../character/ageSystem";
import { processExperience } from "../character/experienceSystem";
import { createLogger } from "../lib/log";
import { monthlyTick } from "../territory/territoryEngine";
import { applyPatch } from "./patchEngine";

const log = createLogger("mvu/effects");

export const DAYS_PER_YEAR = 360;

// ---------------------------------------------------------------------------
// Parser hiệu ứng thiên phú (5.1f-C1) — chuỗi máy-đọc "Sức Mạnh+2, Tải Trọng+20"
// ---------------------------------------------------------------------------
export interface ParsedEffect {
  key: string;
  delta: number;
}

export function parseEffect(str: string): ParsedEffect[] {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => {
      const m = s.trim().match(/^(.+?)\s*([+-]\d+)%?$/);
      return m ? { key: m[1].trim(), delta: parseInt(m[2], 10) } : null;
    })
    .filter((x): x is ParsedEffect => x !== null);
}

/** Tổng bonus thiên phú (không Ẩn) cho 1 key phái sinh/chỉ số. */
export function talentBonusFor(state: StatData, key: string): number {
  let total = 0;
  for (const talent of Object.values(state["Thiên Phú"])) {
    if (talent["Ẩn"]) continue; // thiên phú tiềm ẩn chưa thức tỉnh không cộng
    for (const eff of parseEffect(talent["Hiệu Ứng"])) {
      if (eff.key === key) total += eff.delta;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Chỉ số phái sinh (5.1f-B) — engine tính, AI không ghi
// ---------------------------------------------------------------------------
function equipBonus(state: StatData, attr: string): number {
  let total = 0;
  for (const item of Object.values(state["Trang Bị Đang Mặc"])) {
    if (!item) continue;
    total += item["Thuộc Tính"][attr] ?? 0;
  }
  return total;
}

export function recomputeDerived(state: StatData): void {
  const core = state["Chỉ Số Cốt Lõi"];
  const level = state["Thông Tin Nhân Vật"]["Cấp Độ"];
  const d = state["Chỉ Số Phái Sinh"];
  d["_HP Tối Đa"] = 50 + core["Thể Chất"] * 5 + level * 5 + talentBonusFor(state, "HP Tối Đa") + equipBonus(state, "HP Tối Đa");
  d["_Thể Lực Tối Đa"] = Math.round(50 + (core["Thể Chất"] + core["Sức Mạnh"]) * 2.5) + talentBonusFor(state, "Thể Lực Tối Đa");
  d["_Phòng Thủ"] = Math.round(10 + core["Nhanh Nhẹn"] / 2) + equipBonus(state, "Phòng Thủ") + talentBonusFor(state, "Phòng Thủ");
  d["_Sát Thương Cận"] = Math.round(core["Sức Mạnh"] / 2) + equipBonus(state, "Sát Thương Cận") + talentBonusFor(state, "Sát Thương Cận");
  d["_Sát Thương Xa"] = Math.round(core["Nhanh Nhẹn"] / 2) + equipBonus(state, "Sát Thương Xa") + talentBonusFor(state, "Sát Thương Xa");
  d["_Tải Trọng"] = core["Sức Mạnh"] * 5 + talentBonusFor(state, "Tải Trọng") + equipBonus(state, "Tải Trọng");
  d["_Chống Chịu"] = Math.round(core["Thể Chất"] / 2) + talentBonusFor(state, "Chống Chịu") + equipBonus(state, "Chống Chịu");
  d["_Kháng Bệnh"] = core["Thể Chất"] * 2 + Math.round(core["Sức Mạnh"] / 2) + talentBonusFor(state, "Kháng Bệnh") + equipBonus(state, "Kháng Bệnh");

  // age modifier cho HP
  const playerAge = state["Thông Tin Nhân Vật"]["Tuổi"] ?? 25;
  const ageMod = humanAgeMod(playerAge);
  const hpBeforeAge = d["_HP Tối Đa"];
  d["_HP Tối Đa"] = Math.max(10, Math.round(hpBeforeAge * (1 + ageMod.hpPercent / 100)));
  // age modifier cho Thể Lực, Phòng Thủ, Sát Thương
  d["_Thể Lực Tối Đa"] = Math.max(10, Math.round(d["_Thể Lực Tối Đa"] * (1 + ageMod.hpPercent / 100)));
  d["_Phòng Thủ"] += ageMod.stats["Nhanh Nhẹn"] > 0 ? Math.round(ageMod.stats["Nhanh Nhẹn"] / 2) : Math.round(ageMod.stats["Nhanh Nhẹn"] / 3);
  d["_Sát Thương Cận"] += Math.round(ageMod.stats["Sức Mạnh"] / 2);
  d["_Sát Thương Xa"] += Math.round(ageMod.stats["Nhanh Nhẹn"] / 2);
  d["_Chống Chịu"] += Math.round(ageMod.stats["Thể Chất"] / 2);
  d["_Tải Trọng"] += ageMod.stats["Sức Mạnh"] * 3;
  d["_Kháng Bệnh"] += Math.round(ageMod.stats["Thể Chất"] * 2);

  // clamp sinh tồn về trần mới
  const vitals = state["Chỉ Số Sinh Tồn"];
  vitals["HP"] = clamp(vitals["HP"], 0, d["_HP Tối Đa"]);
  vitals["Thể Lực"] = clamp(vitals["Thể Lực"], 0, d["_Thể Lực Tối Đa"]);
}

/** Tính lại HP Tối Đa cho tất cả rồng (7.15 mở rộng). */
export function recomputeDragonDerived(state: StatData): void {
  for (const drg of Object.values(state["Rồng"])) {
    const size = drg["Kích Cỡ"] as DragonSize;
    const baseHP = DRAGON_SIZE_HP[size] ?? 200;
    const armorBonus = (drg["Chỉ Số"]?.["Giáp Vảy"] ?? 3) * 20;
    // Dragon age modifier
    const drgAge = drg["Tuổi"] ?? 1;
    const drgAgeMod = dragonAgeMod(drgAge);
    drg["_HP Tối Đa"] = Math.max(50, Math.round((baseHP + armorBonus) * (1 + drgAgeMod.hpPercent / 100)));
    drg["_HP"] = clamp(drg["_HP"], 0, drg["_HP Tối Đa"]);
  }
}

// ---------------------------------------------------------------------------
// onTurnAdvance — registry cho các loop chiến lược (10-17 cắm vào sau)
// ---------------------------------------------------------------------------
export type TurnListener = (state: StatData) => void;
const turnListeners = new Map<string, TurnListener>();

/** Đăng ký loop chiến lược (xây dựng, hành quân, kinh tế...) — 1 tick = 1 ngày truyện. */
export function registerTurnListener(id: string, fn: TurnListener): void {
  turnListeners.set(id, fn);
}

// ---------------------------------------------------------------------------
// Hiệu ứng lan toả tổng — chạy sau MỖI lần applyPatch
// ---------------------------------------------------------------------------
export interface EffectEvent {
  kind: "stage_up" | "stage_down" | "year_change" | "time_passed" | "territory" | "territory_lost" | "renown_change" | "childbirth";
  text: string;
}

export interface CascadeResult {
  state: StatData;
  events: EffectEvent[];
  /** số ngày truyện đã trôi lượt này (0 = hội thoại ngắn, không tick). */
  daysPassed: number;
}

function eachNpc(state: StatData, fn: (name: string, npc: Npc) => void): void {
  for (const [name, npc] of Object.entries(state["Mối Quan Hệ"]["NPC Chính"])) fn(name, npc);
  for (const [name, npc] of Object.entries(state["Mối Quan Hệ"]["Thành Viên Gia Tộc"])) fn(name, npc);
}

const STAGE_ORDER = ["Tử Thù", "Thù Địch", "Ác Cảm", "Xa Lạ", "Quen Biết", "Thân Thiết", "Tri Kỷ", "Sống Chết Có Nhau"];

/**
 * prev = state TRƯỚC patch (để tính delta thời gian + phát hiện vượt ngưỡng);
 * next = state SAU patch (đã qua schema) — hàm mutate bản next rồi trả về.
 */
export function runCascadeEffects(prev: StatData, next: StatData): CascadeResult {
  const events: EffectEvent[] = [];

  // ---- 1. tràn năm + tính số ngày trôi ----
  const world = next["Thế Giới"];
  while (world["Ngày"] > DAYS_PER_YEAR) {
    world["Ngày"] -= DAYS_PER_YEAR;
    world["Năm"] += 1;
  }
  const prevAbs = prev["Thế Giới"]["Năm"] * DAYS_PER_YEAR + prev["Thế Giới"]["Ngày"];
  const nextAbs = world["Năm"] * DAYS_PER_YEAR + world["Ngày"];
  const daysPassed = Math.max(0, nextAbs - prevAbs);
  if (daysPassed > 0) {
    events.push({ kind: "time_passed", text: daysPassed === 1 ? "Một ngày trôi qua" : `${daysPassed} ngày trôi qua` });
    
    // ---- 1.1. Xử lý Bệnh Tật (Nhân vật chính) ----
    if (!next["Bệnh Tật"]) next["Bệnh Tật"] = [];
    const diseaseResistance = next["Chỉ Số Phái Sinh"]["_Kháng Bệnh"] ?? 50;
    const DISEASE_TYPES = ["Cảm Lạnh", "Sốt Mùa Hè", "Sốt Lạnh", "Bệnh Vảy Xám", "Dịch Tả", "Bệnh Kiết Lỵ", "Giang Mai", "Bệnh Lậu", "Bệnh Hoa Liễu", "Thương Hàn", "Bệnh Dại", "Lao Phổi"] as const;
    const DISEASE_SEVERITY = ["Nhẹ", "Nặng", "Nguy Kịch"] as const;

    for (let i = 0; i < daysPassed; i++) {
      // Xác suất nhiễm bệnh mỗi ngày (kháng càng cao tỉ lệ càng thấp, ví dụ kháng 50 -> 1% mỗi ngày)
      const sicknessChance = Math.max(0.1, (100 - diseaseResistance) / 50);
      if (Math.random() * 100 < sicknessChance) {
        const randomDisease = DISEASE_TYPES[Math.floor(Math.random() * DISEASE_TYPES.length)];
        const randomSeverity = DISEASE_SEVERITY[Math.floor(Math.random() * 2)]; // Thường là Nhẹ hoặc Nặng
        
        if (!next["Bệnh Tật"].find(d => d["Tên"] === randomDisease)) {
          next["Bệnh Tật"].push({
            "Tên": randomDisease,
            "Mức Độ": randomSeverity,
            "Ngày Còn Lại": Math.floor(Math.random() * 7) + 3 // 3-9 ngày
          });
          events.push({ kind: "time_passed", text: `⚠️ Bạn đã mắc bệnh: ${randomDisease} (Mức độ: ${randomSeverity})` });
        }
      }

      // Xử lý hậu quả bệnh đang mắc
      for (let j = next["Bệnh Tật"].length - 1; j >= 0; j--) {
        const d = next["Bệnh Tật"][j];
        d["Ngày Còn Lại"] -= 1;
        
        // Gây sát thương mỗi ngày
        if (d["Mức Độ"] === "Nhẹ") {
          next["Chỉ Số Sinh Tồn"]["Thể Lực"] = Math.max(0, next["Chỉ Số Sinh Tồn"]["Thể Lực"] - 5);
        } else if (d["Mức Độ"] === "Nặng") {
          next["Chỉ Số Sinh Tồn"]["HP"] = Math.max(0, next["Chỉ Số Sinh Tồn"]["HP"] - 5);
          next["Chỉ Số Sinh Tồn"]["Thể Lực"] = Math.max(0, next["Chỉ Số Sinh Tồn"]["Thể Lực"] - 10);
        } else if (d["Mức Độ"] === "Nguy Kịch") {
          next["Chỉ Số Sinh Tồn"]["HP"] = Math.max(0, next["Chỉ Số Sinh Tồn"]["HP"] - 15);
        }

        // Tự khỏi khi hết ngày
        if (d["Ngày Còn Lại"] <= 0) {
          events.push({ kind: "time_passed", text: `✨ Bạn đã khỏi bệnh: ${d["Tên"]}` });
          next["Bệnh Tật"].splice(j, 1);
        }
      }
    }
  }

  // ---- 1.5. chốt sổ lãnh địa hàng tháng (30 ngày) ----
  const prevMonthAbs = Math.floor(Math.max(0, prevAbs - 1) / 30);
  const nextMonthAbs = Math.floor(Math.max(0, nextAbs - 1) / 30);
  const monthsPassed = Math.max(0, nextMonthAbs - prevMonthAbs);

  if (monthsPassed > 0) {
    events.push({ kind: "territory", text: `Đã qua ${monthsPassed} tháng, chốt sổ lãnh địa.` });
    
    // Simulate multiple months if needed
    for (let i = 0; i < monthsPassed; i++) {
        const ops = monthlyTick(next);
        const { state: updatedState } = applyPatch(next, ops);
        Object.assign(next, updatedState);
    }
  }

  // ---- 2. tuổi NPC theo Năm Sinh (5.1e) ----
  if (world["Năm"] !== prev["Thế Giới"]["Năm"]) {
    events.push({ kind: "year_change", text: `Năm ${world["Năm"]} AC` });
    // Tuổi NPC theo Năm Sinh (5.1e)
    eachNpc(next, (_name, npc) => {
      if (npc["Năm Sinh"] !== undefined) {
        npc["Tuổi"] = Math.max(0, world["Năm"] - npc["Năm Sinh"]);
      }
    });
    // Tuổi player theo Năm Sinh
    const playerInfo = next["Thông Tin Nhân Vật"];
    if (playerInfo["Năm Sinh"] !== undefined) {
      playerInfo["Tuổi"] = Math.max(0, world["Năm"] - playerInfo["Năm Sinh"]);
    }
    // Tuổi rồng +1 mỗi năm
    for (const drg of Object.values(next["Rồng"])) {
      drg["Tuổi"] = (drg["Tuổi"] ?? 1) + 1;
    }
  }
  // Giai Đoạn Đời luôn dẫn xuất lại từ Tuổi (kể cả khi AI chỉnh Tuổi trực tiếp)
  eachNpc(next, (_name, npc) => {
    npc["Giai Đoạn Đời"] = lifeStage(npc["Tuổi"]);
  });
  // Giai Đoạn Đời player
  const plInfo = next["Thông Tin Nhân Vật"];
  plInfo["Giai Đoạn Đời"] = lifeStage(plInfo["Tuổi"]);

  // ---- 3. giai đoạn hảo cảm + sự kiện vượt ngưỡng (5.1d) ----
  const prevStages = new Map<string, string>();
  eachNpc(prev, (name, npc) => prevStages.set(name, affinityStage(npc["Độ Hảo Cảm"])));
  eachNpc(next, (name, npc) => {
    const stage = affinityStage(npc["Độ Hảo Cảm"]);
    npc["Giai Đoạn Quan Hệ"] = stage;
    const before = prevStages.get(name);
    if (before && before !== stage) {
      const up = STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(before);
      events.push({
        kind: up ? "stage_up" : "stage_down",
        text: `${name}: ${before} → ${stage}`,
      });
    }
  });

  // ---- 4+5. chỉ số phái sinh + clamp sinh tồn ----
  recomputeDerived(next);
  recomputeDragonDerived(next);

  // ---- Kiểm tra tiến trình thăng cấp kinh nghiệm ----
  processExperience(next, events);

  // ---- 4b. Bậc Danh Vọng (16.4) ----
  const prevRenown = prev["Danh Vọng"]["_Bậc Danh Vọng"];
  const renown = computeRenown(next);
  next["Danh Vọng"]["_Bậc Danh Vọng"] = renown.tier;
  next["Danh Vọng"]["_Nhãn Danh Vọng"] = renown.label;
  if (renown.tier !== prevRenown) {
    events.push({ kind: "renown_change", text: `Danh Vọng: ${renown.label}` });
  }

  // ---- 5. phai ký ức NPC (16.1) ----
  if (daysPassed > 0) {
    decayAllMemories(next, daysPassed);
  }

  // ---- 5b. thai kỳ tiến triển (30 ngày = 1 tháng) ----
  if (daysPassed > 0) {
    eachNpc(next, (name, npc) => {
      const intimacy = npc["Quan Hệ Thân Mật"];
      if (!intimacy || !intimacy["Đang Mang Thai"]) return;

      // Tính số tháng thêm dựa trên ngày trôi + ngày tồn đọng từ lần trước
      // Dùng daysPassed / 30 đơn giản: engine tick mỗi patch, 30 ngày = 1 tháng
      const prevMonth = intimacy["Tháng Thai Kỳ"];
      const totalDaysPregnant = prevMonth * 30 + daysPassed;
      const newMonth = Math.min(9, Math.floor(totalDaysPregnant / 30));

      if (newMonth >= 9) {
        // Sinh con!
        intimacy["Đang Mang Thai"] = false;
        intimacy["Tháng Thai Kỳ"] = 0;
        intimacy["Số Con Đã Sinh"] += 1;
        events.push({
          kind: "childbirth",
          text: `${name} đã hạ sinh! (con thứ ${intimacy["Số Con Đã Sinh"]})`,
        });
        log.info(`${name} sinh con thứ ${intimacy["Số Con Đã Sinh"]}`);
      } else if (newMonth > prevMonth) {
        intimacy["Tháng Thai Kỳ"] = newMonth;
      }
    });
  }

  // ---- 6. tick các loop chiến lược đúng số ngày trôi (6.2) ----
  if (daysPassed > 0 && turnListeners.size > 0) {
    for (let i = 0; i < daysPassed; i++) {
      for (const fn of turnListeners.values()) {
        try {
          fn(next);
        } catch (e) {
          log.error("Turn listener lỗi", e);
        }
      }
    }
  }

  return { state: next, events, daysPassed };
}
