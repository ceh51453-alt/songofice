import type { EquipItem } from "../../mvu/schema";

export interface LoreEquipmentDef {
  id: string;
  name: string;
  slot: "Vũ Khí Chính" | "Vũ Khí Phụ" | "Giáp Thân" | "Áo Choàng" | "Vật Phẩm Đặc Biệt";
  /** Chi phí khi chọn lúc tạo nhân vật. Tính bằng điểm point-buy. */
  pointCost?: number;
  /** Chi phí bằng vàng. Nếu không có pointCost, sẽ trừ vàng. */
  goldCost?: number;
  /** Yêu cầu điều kiện (vd: Nhà Stark) */
  requiredHouseId?: string;
  /** Trang bị thực tế được add vào State */
  itemData: EquipItem;
}

export const LORE_EQUIPMENT: LoreEquipmentDef[] = [
  {
    id: "ice",
    name: "Ice (Băng Kiếm)",
    slot: "Vũ Khí Chính",
    pointCost: 3,
    requiredHouseId: "stark",
    itemData: {
      "Tên": "Ice",
      "Phẩm Chất": "Thép Valyria",
      "Chất Liệu": "Thép Valyria",
      "Người Rèn": "Valyria Cổ Đại",
      "Thuộc Tính": { "Sát Thương Cận": 8, "Sát Thương Diện Rộng": 2 },
      "Đặc Tính": ["valyrian", "trọng kiếm", "gia truyền"],
      "Mô Tả": "Thanh trọng kiếm khổng lồ bằng thép Valyria của Nhà Stark, sẫm màu như khói.",
    },
  },
  {
    id: "longclaw",
    name: "Longclaw (Móng Vuốt Dài)",
    slot: "Vũ Khí Chính",
    pointCost: 2,
    requiredHouseId: "mormont", // Can also be acquired by Jon Snow, but for origin restricted it's Mormont
    itemData: {
      "Tên": "Longclaw",
      "Phẩm Chất": "Thép Valyria",
      "Chất Liệu": "Thép Valyria",
      "Người Rèn": "Valyria Cổ Đại",
      "Thuộc Tính": { "Sát Thương Cận": 6, "Nhanh Nhẹn": 1 },
      "Đặc Tính": ["valyrian", "kiếm lai", "gia truyền"],
      "Mô Tả": "Kiếm lai có chuôi hình gấu của Nhà Mormont, sắc bén phi thường.",
    },
  },
  {
    id: "heartsbane",
    name: "Heartsbane (Độc Tâm)",
    slot: "Vũ Khí Chính",
    pointCost: 3,
    requiredHouseId: "tarly",
    itemData: {
      "Tên": "Heartsbane",
      "Phẩm Chất": "Thép Valyria",
      "Chất Liệu": "Thép Valyria",
      "Người Rèn": "Valyria Cổ Đại",
      "Thuộc Tính": { "Sát Thương Cận": 7, "Xuyên Giáp": 3 },
      "Đặc Tính": ["valyrian", "trọng kiếm", "gia truyền"],
      "Mô Tả": "Bảo kiếm Thép Valyria của nhà Tarly, biểu tượng của sức mạnh quân sự.",
    },
  },
  {
    id: "dawn",
    name: "Dawn (Bình Minh)",
    slot: "Vũ Khí Chính",
    pointCost: 4, // Cực hiếm
    requiredHouseId: "dayne",
    itemData: {
      "Tên": "Dawn",
      "Phẩm Chất": "Huyền Thoại",
      "Chất Liệu": "Thiên Thạch",
      "Người Rèn": "Không Rõ",
      "Thuộc Tính": { "Sát Thương Cận": 9, "Nhanh Nhẹn": 2, "Uy Tín": 3 },
      "Đặc Tính": ["huyền thoại", "kiếm sao băng", "thanh tẩy"],
      "Mô Tả": "Thanh kiếm huyền thoại rèn từ trái tim ngôi sao sa, chỉ dành cho Kiếm Sĩ Buổi Sáng.",
    },
  },
  {
    id: "robert_warhammer",
    name: "Búa Chiến Của Robert",
    slot: "Vũ Khí Chính",
    pointCost: 2,
    requiredHouseId: "baratheon",
    itemData: {
      "Tên": "Búa Chiến Baratheon",
      "Phẩm Chất": "Huyền Thoại",
      "Chất Liệu": "Thép Đen",
      "Người Rèn": "Donal Noye",
      "Thuộc Tính": { "Sát Thương Cận": 10, "Phá Giáp": 5, "Nhanh Nhẹn": -2 },
      "Đặc Tính": ["huyền thoại", "búa chiến", "nặng", "phá khiên"],
      "Mô Tả": "Cây búa khổng lồ từng đập nát lồng ngực Rhaegar Targaryen, quá nặng với người thường.",
    },
  },
  {
    id: "mountain_armor",
    name: "Giáp Quỷ (The Mountain)",
    slot: "Giáp Thân",
    goldCost: 3000,
    itemData: {
      "Tên": "Trọng Giáp Của Gregor",
      "Phẩm Chất": "Độc Nhất",
      "Chất Liệu": "Thép Dày",
      "Người Rèn": "Thợ rèn Lannisport",
      "Thuộc Tính": { "Phòng Thủ": 10, "Sức Mạnh": 1, "Nhanh Nhẹn": -4 },
      "Đặc Tính": ["độc nhất", "trọng giáp", "quá khổ", "giảm sát thương"],
      "Mô Tả": "Bộ giáp dày đến mức chỉ kẻ mang sức mạnh phi thường mới mặc nổi.",
    },
  },
  {
    id: "crown_of_winter",
    name: "Vương Miện Mùa Đông",
    slot: "Vật Phẩm Đặc Biệt",
    pointCost: 2,
    requiredHouseId: "stark",
    itemData: {
      "Tên": "Vương Miện Vua Phương Bắc",
      "Phẩm Chất": "Huyền Thoại",
      "Chất Liệu": "Đồng Điếu & Sắt",
      "Người Rèn": "Không Rõ",
      "Thuộc Tính": { "Uy Tín": 5, "Thống Soái": 2 },
      "Đặc Tính": ["huyền thoại", "vương miện", "tượng trưng"],
      "Mô Tả": "Vòng tròn bằng đồng điểm những thanh gươm sắt nhỏ, vương miện của Vua Phương Bắc cổ đại.",
    },
  }
];

export const LORE_EQUIPMENT_BY_ID: Record<string, LoreEquipmentDef> = Object.fromEntries(
  LORE_EQUIPMENT.map((e) => [e.id, e])
);
