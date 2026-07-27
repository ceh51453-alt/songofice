export interface ItemConfig {
  id: string;
  name: string;
  type: "Vũ Khí" | "Giáp Trụ" | "Thú Cưỡi" | "Cổ Vật" | "Sách" | "Tài Nguyên";
  costGold: number;
  costIron: number;
  costWood: number;
  costValyrian: number;
  stats: Record<string, number>;
  description: string;
}

export const ITEM_CATALOG: ItemConfig[] = [
  // ── Vũ Khí ──
  {
    id: "Kiếm Ngắn",
    name: "Kiếm Ngắn (Sức Mạnh +1)",
    type: "Vũ Khí",
    costGold: 50, costIron: 20, costWood: 0, costValyrian: 0,
    stats: { "Sức Mạnh": 1 },
    description: "Một thanh kiếm ngắn tiêu chuẩn dành cho lính gác."
  },
  {
    id: "Trường Kiếm",
    name: "Trường Kiếm (Sức Mạnh +2)",
    type: "Vũ Khí",
    costGold: 150, costIron: 50, costWood: 0, costValyrian: 0,
    stats: { "Sức Mạnh": 2 },
    description: "Vũ khí phổ biến nhất của các hiệp sĩ."
  },
  {
    id: "Trọng Kiếm",
    name: "Trọng Kiếm (Sức Mạnh +4, Nhanh Nhẹn -1)",
    type: "Vũ Khí",
    costGold: 400, costIron: 100, costWood: 0, costValyrian: 0,
    stats: { "Sức Mạnh": 4, "Nhanh Nhẹn": -1 },
    description: "Thanh kiếm khổng lồ bằng thép nguyên khối, đòi hỏi sức khỏe để vung."
  },
  {
    id: "Cung Dài",
    name: "Cung Dài (Nhanh Nhẹn +3)",
    type: "Vũ Khí",
    costGold: 100, costIron: 10, costWood: 100, costValyrian: 0,
    stats: { "Nhanh Nhẹn": 3 },
    description: "Cung dài làm từ gỗ cứng, tầm bắn rất xa."
  },
  {
    id: "Nỏ Nhắm",
    name: "Nỏ Nhắm (Tinh Tường +2, Sức Mạnh +1)",
    type: "Vũ Khí",
    costGold: 200, costIron: 30, costWood: 50, costValyrian: 0,
    stats: { "Tinh Tường": 2, "Sức Mạnh": 1 },
    description: "Uy lực mạnh mẽ có thể xuyên thủng giáp dày."
  },

  // ── Giáp Trụ ──
  {
    id: "Giáp Da",
    name: "Giáp Da (Thể Chất +1, Nhanh Nhẹn +1)",
    type: "Giáp Trụ",
    costGold: 100, costIron: 0, costWood: 0, costValyrian: 0,
    stats: { "Thể Chất": 1, "Nhanh Nhẹn": 1 },
    description: "Nhẹ nhàng nhưng bảo vệ cơ bản."
  },
  {
    id: "Giáp Lưới",
    name: "Giáp Lưới (Thể Chất +3)",
    type: "Giáp Trụ",
    costGold: 300, costIron: 60, costWood: 0, costValyrian: 0,
    stats: { "Thể Chất": 3 },
    description: "Được đan từ hàng ngàn vòng sắt nhỏ."
  },
  {
    id: "Giáp Tấm",
    name: "Giáp Tấm (Thể Chất +5, Nhanh Nhẹn -2)",
    type: "Giáp Trụ",
    costGold: 1000, costIron: 150, costWood: 0, costValyrian: 0,
    stats: { "Thể Chất": 5, "Nhanh Nhẹn": -2 },
    description: "Bộ giáp hiệp sĩ kiên cố nhất, nhưng khá cồng kềnh."
  },

  // ── Thú Cưỡi ──
  {
    id: "Ngựa Thường",
    name: "Ngựa Thường (Tăng tốc độ hành quân)",
    type: "Thú Cưỡi",
    costGold: 200, costIron: 0, costWood: 0, costValyrian: 0,
    stats: { "Nhanh Nhẹn": 1 },
    description: "Giúp di chuyển nhanh chóng giữa các thành."
  },
  {
    id: "Ngựa Chiến Bọc Thép",
    name: "Ngựa Chiến Bọc Thép (Thể Chất +2, Sức Mạnh +1)",
    type: "Thú Cưỡi",
    costGold: 800, costIron: 50, costWood: 0, costValyrian: 0,
    stats: { "Thể Chất": 2, "Sức Mạnh": 1 },
    description: "Ngựa được trang bị giáp sắt để càn lướt trong trận."
  },

  // ── Cổ Vật (Artifacts - Yêu cầu Thép Valyria hoặc chỉ bán ở Merchant) ──
  {
    id: "Ice",
    name: "Ice (Sức Mạnh +15, Uy Tín +10)",
    type: "Cổ Vật",
    costGold: 20000, costIron: 0, costWood: 0, costValyrian: 2,
    stats: { "Sức Mạnh": 15, "Uy Tín": 10 },
    description: "Thanh trọng kiếm gia truyền của nhà Stark, làm từ Thép Valyria."
  },
  {
    id: "Longclaw",
    name: "Longclaw (Sức Mạnh +12, Nhanh Nhẹn +5)",
    type: "Cổ Vật",
    costGold: 15000, costIron: 0, costWood: 0, costValyrian: 1,
    stats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 5 },
    description: "Kiếm lai (bastard sword) của nhà Mormont."
  },
  {
    id: "Heartsbane",
    name: "Heartsbane (Sức Mạnh +14, Uy Tín +8)",
    type: "Cổ Vật",
    costGold: 18000, costIron: 0, costWood: 0, costValyrian: 2,
    stats: { "Sức Mạnh": 14, "Uy Tín": 8 },
    description: "Thanh trọng kiếm của nhà Tarly."
  },
];
