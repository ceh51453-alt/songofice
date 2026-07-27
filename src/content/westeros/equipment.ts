import type { EquipItem } from "../../mvu/schema";

export interface LoreEquipmentDef {
  id: string;
  name: string;
  slot: "Vũ Khí Chính" | "Vũ Khí Phụ" | "Giáp Thân" | "Khiên" | "Vật Phẩm Đặc Biệt";
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
      "VisualClass": "greatsword",
      "VisualColor": "#222222"
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
      "VisualClass": "sword",
      "VisualColor": "#eeeeee"
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
      "VisualClass": "greatsword",
      "VisualColor": "#333333"
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
      "VisualClass": "greatsword",
      "VisualColor": "#ffffff"
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
      "VisualClass": "warhammer",
      "VisualColor": "#444444"
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
      "VisualClass": "heavy-armor",
      "VisualColor": "#555555"
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
      "VisualClass": "crown",
      "VisualColor": "#b87333"
    },
  },
  {
    id: "steel_sword",
    name: "Kiếm Thép Thường",
    slot: "Vũ Khí Chính",
    goldCost: 50,
    itemData: {
      "Tên": "Kiếm Thép Thường",
      "Phẩm Chất": "Thường",
      "Chất Liệu": "Thép Thường",
      "Người Rèn": "Thợ Rèn Thường",
      "Thuộc Tính": { "Sát Thương Cận": 4 },
      "Đặc Tính": ["kiếm", "thông dụng"],
      "Mô Tả": "Thanh gươm thép tiêu chuẩn của binh lính Westeros.",
      "VisualClass": "sword",
      "VisualColor": "#cccccc"
    }
  },
  {
    id: "iron_shield",
    name: "Khiên Sắt Cột Tháp",
    slot: "Vũ Khí Phụ",
    goldCost: 40,
    itemData: {
      "Tên": "Khiên Sắt Cột Tháp",
      "Phẩm Chất": "Thường",
      "Chất Liệu": "Sắt & Gỗ",
      "Người Rèn": "Thợ Rèn Thường",
      "Thuộc Tính": { "Phòng Thủ": 3 },
      "Đặc Tính": ["khiên", "chống tên"],
      "Mô Tả": "Khiên gỗ bọc sắt giúp đỡ đòn hiệp sĩ.",
      "VisualClass": "shield",
      "VisualColor": "#777777"
    }
  },
  {
    id: "iron_helmet",
    name: "Mũ Giáp Sắt Hiệp Sĩ",
    slot: "Vật Phẩm Đặc Biệt",
    goldCost: 35,
    itemData: {
      "Tên": "Mũ Giáp Sắt Hiệp Sĩ",
      "Phẩm Chất": "Tinh Xảo",
      "Chất Liệu": "Sắt Tinh Luyện",
      "Người Rèn": "Thợ Rèn Thường",
      "Thuộc Tính": { "Phòng Thủ": 2, "Nhanh Nhẹn": -1 },
      "Đặc Tính": ["mũ giáp", "bảo vệ đầu"],
      "Mô Tả": "Mũ giáp che chắn toàn bộ khuôn mặt.",
      "VisualClass": "helmet",
      "VisualColor": "#888888"
    }
  },
  {
    id: "leather_armor",
    name: "Giáp Da Thú Gia Cố",
    slot: "Giáp Thân",
    goldCost: 60,
    itemData: {
      "Tên": "Giáp Da Thú Gia Cố",
      "Phẩm Chất": "Thường",
      "Chất Liệu": "Da Dày",
      "Người Rèn": "Thợ Thợ Da",
      "Thuộc Tính": { "Phòng Thủ": 4, "Nhanh Nhẹn": 1 },
      "Đặc Tính": ["giáp nhẹ", "linh hoạt"],
      "Mô Tả": "Giáp da nhẹ nhàng phù hợp cho thợ săn và lính trinh sát.",
      "VisualClass": "heavy-armor",
      "VisualColor": "#8B4513"
    }
  },
  {
    id: "black_cloak",
    name: "Áo Choàng Đội Tuần Đêm",
    slot: "Khiên",
    goldCost: 20,
    itemData: {
      "Tên": "Áo Choàng Đội Tuần Đêm",
      "Phẩm Chất": "Thường",
      "Chất Liệu": "Lông Cừu Đen",
      "Người Rèn": "May Mặc Castle Black",
      "Thuộc Tính": { "Phòng Thủ": 1, "Kháng Lạnh": 5 },
      "Đặc Tính": ["áo choàng", "giữ ấm"],
      "Mô Tả": "Áo choàng đen dày giúp chống chọi với cái lạnh phương Bắc.",
      "VisualClass": "cape",
      "VisualColor": "#1a1a1a"
    }
  }
];

export const LORE_EQUIPMENT_BY_ID: Record<string, LoreEquipmentDef> = Object.fromEntries(
  LORE_EQUIPMENT.map((e) => [e.id, e])
);

export function inferEquipItem(name: string, desc: string = ""): EquipItem | null {
  // Check exact match in Lore
  const foundLore = LORE_EQUIPMENT.find(e => e.name === name || e.itemData["Tên"] === name);
  if (foundLore) return foundLore.itemData;

  const n = name.toLowerCase();
  if (n.includes("kiếm") || n.includes("gươm") || n.includes("sword")) {
    return {
      "Tên": name,
      "Phẩm Chất": n.includes("valyria") ? "Thép Valyria" : "Thường",
      "Thuộc Tính": { "Sát Thương Cận": 5 },
      "Đặc Tính": ["kiếm"],
      "Mô Tả": desc || "Vũ khí sắc bén.",
      "VisualClass": n.includes("trọng") ? "greatsword" : "sword",
      "VisualColor": n.includes("valyria") ? "#222" : "#ccc"
    };
  }
  if (n.includes("búa") || n.includes("hammer")) {
    return {
      "Tên": name,
      "Phẩm Chất": "Thường",
      "Thuộc Tính": { "Sát Thương Cận": 6, "Phá Giáp": 2 },
      "Đặc Tính": ["búa chiến"],
      "Mô Tả": desc || "Vũ khí đập cực mạnh.",
      "VisualClass": "warhammer",
      "VisualColor": "#555"
    };
  }
  if (n.includes("khiên") || n.includes("shield")) {
    return {
      "Tên": name,
      "Phẩm Chất": "Thường",
      "Thuộc Tính": { "Phòng Thủ": 3 },
      "Đặc Tính": ["khiên"],
      "Mô Tả": desc || "Trang bị chống đỡ.",
      "VisualClass": "shield",
      "VisualColor": "#777"
    };
  }
  if (n.includes("giáp") || n.includes("armor") || n.includes("áo da")) {
    return {
      "Tên": name,
      "Phẩm Chất": "Thường",
      "Thuộc Tính": { "Phòng Thủ": 5 },
      "Đặc Tính": ["áo giáp"],
      "Mô Tả": desc || "Trang bị bảo vệ thân thể.",
      "VisualClass": "heavy-armor",
      "VisualColor": "#666"
    };
  }
  if (n.includes("mũ") || n.includes("nón") || n.includes("vương miện") || n.includes("crown") || n.includes("helm")) {
    return {
      "Tên": name,
      "Phẩm Chất": n.includes("vương miện") ? "Huyền Thoại" : "Thường",
      "Thuộc Tính": { "Phòng Thủ": 2, "Uy Tín": n.includes("vương miện") ? 3 : 0 },
      "Đặc Tính": [n.includes("vương miện") ? "vương miện" : "mũ giáp"],
      "Mô Tả": desc || "Trang bị bảo vệ hoặc trang trí đầu.",
      "VisualClass": n.includes("vương miện") ? "crown" : "helmet",
      "VisualColor": n.includes("vương miện") ? "#ffd700" : "#888"
    };
  }
  if (n.includes("choàng") || n.includes("cloak") || n.includes("cape")) {
    return {
      "Tên": name,
      "Phẩm Chất": "Thường",
      "Thuộc Tính": { "Phòng Thủ": 1 },
      "Đặc Tính": ["áo choàng"],
      "Mô Tả": desc || "Áo choàng quý phái hoặc che mưa gió.",
      "VisualClass": "cape",
      "VisualColor": n.includes("đỏ") ? "#991b1b" : n.includes("đen") ? "#111" : "#4b5563"
    };
  }
  return null;
}


