/**
 * offscreenSim (16.3) — Mô phỏng NPC tự chủ khi vắng người chơi.
 * Nhẹ: chỉ 2-3 NPC then chốt, mỗi ~7 ngày truyện, sinh tin tức/biến động.
 * Đăng ký vào registerTurnListener, đếm ngày tích luỹ.
 */
import type { StatData } from "../mvu/schema";
import type { Npc } from "../mvu/npcSchema";
import { registerTurnListener } from "../mvu/effects";
import { createLogger } from "../lib/log";

const log = createLogger("npc/offscreen");

/** Khoảng cách giữa 2 lần sim (ngày truyện). */
const SIM_INTERVAL_DAYS = 7;
/** Số NPC tối đa được sim mỗi lần. */
const MAX_SIM_NPCS = 3;

let dayCounter = 0;

// ── Selection ────────────────────────────────────────────────────────────────

/**
 * Chọn NPC then chốt để sim: có Mục Tiêu Cá Nhân + còn sống.
 * Ưu tiên: NPC có |Hảo Cảm| lớn (quan hệ đậm nhất) + có mục tiêu.
 */
export function selectKeyNpcs(stat: StatData): [string, Npc][] {
  const allNpcs: [string, Npc][] = [
    ...Object.entries(stat["Mối Quan Hệ"]["NPC Chính"]),
    ...Object.entries(stat["Mối Quan Hệ"]["Thành Viên Gia Tộc"]),
  ];

  return allNpcs
    .filter(([, npc]) => npc["Còn Sống"] && npc["Mục Tiêu Cá Nhân"])
    .sort((a, b) => Math.abs(b[1]["Độ Hảo Cảm"]) - Math.abs(a[1]["Độ Hảo Cảm"]))
    .slice(0, MAX_SIM_NPCS);
}

// ── Simulation ───────────────────────────────────────────────────────────────

export interface OffscreenAction {
  npcName: string;
  action: string;    // mô tả hành động
  newsText: string;  // tin tức cho người chơi / AI
}

/**
 * Sinh hành động off-screen cho 1 NPC dựa trên mục tiêu + tính cách.
 * Trả về mô tả text (AI sẽ dùng trong tường thuật), KHÔNG áp patch tự động
 * (để AI tường thuật tự nhiên khi NPC xuất hiện lại hoặc người chơi nghe tin).
 */
export function generateOffscreenAction(name: string, npc: Npc): OffscreenAction | null {
  const goal = npc["Mục Tiêu Cá Nhân"];
  if (!goal) return null;

  // Xác định xu hướng hành động từ tính cách
  const personality = npc["Tính Cách"];
  const isAmbitious = personality["Trục Thiện-Ác"] < 0 || personality["Trục Can Đảm-Hèn Nhát"] > 30;
  const isCautious = personality["Trục Can Đảm-Hèn Nhát"] < -20;
  const isLoyal = personality["Trục Trung Thành-Phản Trắc"] > 30;

  // Sinh hành động theo mục tiêu + tính cách
  let action: string;
  let newsText: string;

  if (goal.includes("quyền lực") || goal.includes("ngai") || goal.includes("chiếm")) {
    if (isAmbitious) {
      action = `${name} âm thầm xây dựng liên minh để thực hiện: "${goal}"`;
      newsText = `Có tin đồn ${name} đang vận động các lãnh chúa ủng hộ mình.`;
    } else if (isCautious) {
      action = `${name} thận trọng thăm dò tình hình liên quan đến: "${goal}"`;
      newsText = `${name} được thấy xuất hiện tại một số hội đàm kín.`;
    } else {
      action = `${name} công khai tuyên bố ý định: "${goal}"`;
      newsText = `${name} đã công khai lập trường về ${goal}.`;
    }
  } else if (goal.includes("trả thù") || goal.includes("tiêu diệt")) {
    action = `${name} lặng lẽ chuẩn bị cho kế hoạch: "${goal}"`;
    newsText = `${name} đã tuyển thêm người, mục đích chưa rõ.`;
  } else if (goal.includes("bảo vệ") || goal.includes("an toàn")) {
    if (isLoyal) {
      action = `${name} tăng cường phòng thủ để: "${goal}"`;
      newsText = `${name} ra lệnh củng cố thành trì.`;
    } else {
      action = `${name} tìm kiếm đồng minh mới để: "${goal}"`;
      newsText = `${name} gửi sứ giả tới nhiều Nhà lớn.`;
    }
  } else {
    // Mục tiêu chung
    action = `${name} tiếp tục theo đuổi: "${goal}"`;
    newsText = `Tin tức về hoạt động của ${name} lan truyền khắp vùng.`;
  }

  return { npcName: name, action, newsText };
}

/**
 * Chạy sim cho tất cả NPC then chốt. Trả về các tin tức sinh ra.
 */
export function runOffscreenSim(stat: StatData): OffscreenAction[] {
  const keyNpcs = selectKeyNpcs(stat);
  const actions: OffscreenAction[] = [];

  for (const [name, npc] of keyNpcs) {
    const result = generateOffscreenAction(name, npc);
    if (result) {
      actions.push(result);
      log.info(`Off-screen: ${result.action}`);
    }
  }

  return actions;
}

// ── Turn Listener ────────────────────────────────────────────────────────────

/** Đăng ký off-screen sim vào turn loop. Chạy mỗi ~7 ngày truyện. */
export function registerOffscreenLoop(): void {
  registerTurnListener("offscreen-sim", (state) => {
    dayCounter++;
    if (dayCounter >= SIM_INTERVAL_DAYS) {
      dayCounter = 0;
      const actions = runOffscreenSim(state);
      // Lưu tin tức vào _offscreenNews (engine-only) để AI/UI đọc
      if (actions.length > 0) {
        const newsBlock = actions.map((a) => a.newsText).join(" ");
        // Ghi vào field tạm trên Thế Giới (AI sẽ đọc và tường thuật)
        (state["Thế Giới"] as Record<string, unknown>)["_Tin Nóng Off-screen"] = newsBlock;
      }
    }
  });
}
