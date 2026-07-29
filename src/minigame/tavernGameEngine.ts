/**
 * tavernGameEngine V2 — Orchestrator chung cho hệ thống mini-game quán rượu.
 * 6 trò chơi: Kings Game, Dragon Dice, Shell Game, Arm Wrestle, Liar's Dice, Coin Flip.
 */

import { EXCHANGE_RATES } from "../economy/currency";

export type TavernGameType =
  | "kings-game"
  | "dragon-dice"
  | "shell-game"
  | "arm-wrestle"
  | "liars-dice"
  | "coin-flip";

export interface TavernReward {
  gold: number;
  item?: { name: string; desc: string };
}

/**
 * Bảng mức cược viết theo RỒNG VÀNG cho dễ đọc rồi nhân GOLD_TO_COPPER — ngân
 * khố giữ ĐỒNG ĐỎ, nếu để số thô thì cược tối đa 200 Đồng ≈ 3 Hươu Bạc.
 */
export const GAME_INFO: Record<TavernGameType, {
  name: string;
  desc: string;
  minBet: number;
  maxBet: number;
  defaultBet: number;
  /** Độ phức tạp (hiển thị UI). */
  complexity: "easy" | "medium" | "hard";
  /** Mô tả ngắn cơ chế. */
  mechanic: string;
}> = {
  "kings-game": {
    name: "Cuộc Chiến Vương Giả",
    desc: "Đánh bài chiến thuật 5 lượt — 40 lá, combo Nhà, đặc tính đặc biệt.",
    minBet: 20 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 200 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 50 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "hard",
    mechanic: "Chiến thuật",
  },
  "dragon-dice": {
    name: "Xúc Xắc Rồng",
    desc: "Tung 3 xúc xắc, so tổng với đối thủ. Best of 3.",
    minBet: 10 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 100 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 20 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "easy",
    mechanic: "May rủi",
  },
  "shell-game": {
    name: "Đoán Cốc",
    desc: "Đoán vật phẩm giấu dưới cốc nào — đoán đúng 2/3 thì thắng.",
    minBet: 10 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 100 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 15 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "easy",
    mechanic: "Quan sát",
  },
  "arm-wrestle": {
    name: "Vật Tay",
    desc: "Nhấn nút nhanh nhất có thể trong 3 giây! Best of 3.",
    minBet: 15 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 150 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 30 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "medium",
    mechanic: "Phản xạ",
  },
  "liars-dice": {
    name: "Xúc Xắc Nói Dối",
    desc: "Đối thủ đặt cược — ngươi phải đoán xem hắn nói thật hay dối?",
    minBet: 15 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 150 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 25 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "medium",
    mechanic: "Tâm lý",
  },
  "coin-flip": {
    name: "Đồng Xu Vận Mệnh",
    desc: "5 vòng đoán xu, mỗi vòng khó hơn nhưng thưởng gấp đôi. Dừng sớm hoặc tất tay!",
    minBet: 10 * EXCHANGE_RATES.GOLD_TO_COPPER,
    maxBet: 100 * EXCHANGE_RATES.GOLD_TO_COPPER,
    defaultBet: 15 * EXCHANGE_RATES.GOLD_TO_COPPER,
    complexity: "medium",
    mechanic: "Rủi ro",
  },
};

/** Tính phần thưởng khi thắng. */
export function calculateReward(
  gameType: TavernGameType,
  bet: number,
  _playerGold: number,
  /** Hệ số nhân bổ sung (coin flip multiplier). */
  extraMultiplier = 1,
): TavernReward {
  const baseMultiplier: Record<TavernGameType, number> = {
    "kings-game": 2.5,
    "dragon-dice": 2.0,
    "shell-game": 2.0,
    "arm-wrestle": 2.2,
    "liars-dice": 2.3,
    "coin-flip": 1.5, // thấp hơn vì có extraMultiplier
  };

  const multiplier = baseMultiplier[gameType] * extraMultiplier;
  const gold = Math.round(bet * multiplier);

  // Drop rate theo loại game
  const itemChance: Record<TavernGameType, number> = {
    "kings-game": 0.18,
    "dragon-dice": 0.05,
    "shell-game": 0.05,
    "arm-wrestle": 0.08,
    "liars-dice": 0.10,
    "coin-flip": 0.12,
  };

  const hasItem = Math.random() < itemChance[gameType];

  const items = [
    { name: "Rượu Arbor Vàng", desc: "Chai rượu vàng Arbor thượng hạng. +5 Uy Tín tạm thời." },
    { name: "Xúc Xắc May Mắn", desc: "Bộ xúc xắc xương rồng — đem lại may mắn kỳ lạ." },
    { name: "Bản Đồ Kho Báu", desc: "Mảnh bản đồ rách nát chỉ đến kho báu bí ẩn." },
    { name: "Nhẫn Bạc Braavos", desc: "Chiếc nhẫn bạc từ thành phố tự do — có vẻ giá trị." },
    { name: "Lá Bài Valyria", desc: "Lá bài cổ khắc hình rồng ba đầu — vật phẩm sưu tầm." },
    { name: "Vòng Tay Sắt Cũ", desc: "Vòng tay sắt đen từ quần đảo Iron Islands — tượng trưng sức mạnh." },
    { name: "Đoản Kiếm Dorne", desc: "Lưỡi kiếm ngắn tẩm dầu độc — vũ khí yêu thích của thích khách." },
    { name: "Khiên Gỗ Weirwood", desc: "Khiên nhỏ đẽo từ gỗ thần — phát sáng dưới ánh trăng." },
    { name: "Thư Bí Mật", desc: "Cuộn giấy bịt kín bằng sáp đỏ — không ai biết nội dung." },
    { name: "Chìa Khóa Hầm Mộ", desc: "Chìa khóa sắt gỉ — mở cánh cửa nào đó dưới lòng đất." },
  ];

  return {
    gold,
    item: hasItem ? items[Math.floor(Math.random() * items.length)] : undefined,
  };
}

/** Tính Vàng mất khi thua. */
export function calculateLoss(bet: number): number {
  return bet;
}

/** Complexity badge color. */
export const COMPLEXITY_COLORS: Record<string, string> = {
  easy: "var(--ok)",
  medium: "var(--warn)",
  hard: "var(--danger)",
};
