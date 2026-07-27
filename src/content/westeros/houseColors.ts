// content/westeros/houseColors.ts
// ============================================================================
// BẢNG MÀU NHÀ (9.5.4) — màu huy hiệu canon nhưng GIẢM BÃO HOÀ cho hợp tông
// trầm ít bão hoà của app (ràng buộc mỹ thuật điểm 4). Đổi màu 1 Nhà = sửa 1
// dòng ở đây, KHÔNG đụng engine bản đồ. Dùng cho cả bản đồ (9.5) + theme UI (6).
// ============================================================================

export interface HouseColor {
  base: string;
  light: string;
  label: string;
}

/** houseId (khớp houses.ts) → màu. "vô-chủ" cho vùng vô chủ/tranh chấp. */
export const HOUSE_COLORS: Record<string, HouseColor> = {
  stark: { base: "#5b6670", light: "#8a97a3", label: "Xám Sói" },
  lannister: { base: "#9c2b2b", light: "#c85a5a", label: "Đỏ Son" },
  targaryen: { base: "#5a2230", light: "#8b1e1e", label: "Đen Đỏ Rồng" },
  baratheon: { base: "#b8912e", light: "#e0be5c", label: "Vàng Hươu" },
  tyrell: { base: "#3f7a3f", light: "#6fae6f", label: "Xanh Reach" },
  martell: { base: "#c56a1c", light: "#e5964a", label: "Cam Dorne" },
  greyjoy: { base: "#3a4d55", light: "#61818d", label: "Xám Kraken" },
  arryn: { base: "#4a6fa5", light: "#7c9fd4", label: "Lam Ưng" },
  tully: { base: "#5a7a8c", light: "#89aec1", label: "Lam Bạc Cá Hồi" },
  gardener: { base: "#4a7250", light: "#78a880", label: "Xanh Gardener" }, // vua Reach thời tiền-Tyrell (Chinh Phạt)
  durrandon: { base: "#8a7a3a", light: "#c0ad63", label: "Vàng Bão Cổ" }, // vua Bão trước Baratheon
  hoare: { base: "#42484d", light: "#6b737a", label: "Đen Sắt" }, // vua Quần Đảo Sắt thời Chinh Phạt
  bolton: { base: "#7a5a5a", light: "#a88585", label: "Hồng Máu" },
  blackfyre: { base: "#3d1a1a", light: "#6b3030", label: "Đen Đỏ Blackfyre" }, // nhà Blackfyre (Loạn Blackfyre)
  velaryon: { base: "#3a6a7a", light: "#6a9ab0", label: "Xanh Bạc Biển" }, // nhà Velaryon (Vũ Điệu Rồng)
  others: { base: "#4a8aa0", light: "#7ac0d8", label: "Xanh Băng Giá" }, // Others (Đêm Trường)
  hightower: { base: "#6b705c", light: "#a5a58d", label: "Xám Lục Tháp" },
  royce: { base: "#594d46", light: "#8b7d6b", label: "Đồng Thiếc Cổ" },
  mudd: { base: "#6e5246", light: "#9a7b6c", label: "Nâu Bùn" },
  casterly: { base: "#b08d57", light: "#d4af37", label: "Vàng Cổ" },
  yronwood: { base: "#8c564b", light: "#c49c94", label: "Cát Đỏ" },
  greyiron: { base: "#454545", light: "#666666", label: "Sắt Gỉ" },
  darklyn: { base: "#4b404d", light: "#705d73", label: "Đen Vàng" },
  "first-men": { base: "#545454", light: "#8c8c8c", label: "Đá Cổ" },
  children: { base: "#4a5d23", light: "#78866b", label: "Lá Úa" },
  frey: { base: "#5d6d7e", light: "#85929e", label: "Xám Cầu" },
  peake: { base: "#804000", light: "#b36b00", label: "Cam Nâu" },
  bracken: { base: "#8b4513", light: "#cd853f", label: "Nâu Thẫm" },
  "targaryen-black": { base: "#3d1010", light: "#5a1818", label: "Phe Đen" }, // Đỏ đen đặc trưng thay vì đen tuyền
  "targaryen-green": { base: "#1e592f", light: "#2e7d32", label: "Phe Xanh" }, // Xanh lá nổi bật thay vì xanh tối
  "vô-chủ": { base: "#4a4a4a", light: "#707070", label: "Vô Chủ / Tranh Chấp" },
};

export const NEUTRAL_COLOR: HouseColor = HOUSE_COLORS["vô-chủ"];

export function houseColor(houseId: string): HouseColor {
  return HOUSE_COLORS[houseId] ?? NEUTRAL_COLOR;
}

// ── Heatmap Quan Hệ (9.5.2) — chế độ tô theo Thái Độ của Nhà kiểm soát vùng
// ĐỐI VỚI người chơi. Xanh→đỏ, giảm bão hoà. Khoá khớp enum "Thái Độ Các Nhà". ──
export const ATTITUDE_HEAT: Record<string, { color: string; label: string }> = {
  "Tín Nhiệm": { color: "#3f7a55", label: "Đồng minh thân" },
  "Ủng Hộ": { color: "#5f9a6a", label: "Thân thiện" },
  "Cảnh Giác": { color: "#5f6b70", label: "Trung lập" },
  "Dao Động": { color: "#a89a52", label: "Lung lay" },
  "Bất Mãn": { color: "#b57f3a", label: "Khó chịu" },
  "Địch Ý": { color: "#a85a4a", label: "Thù nghịch" },
  "Thù Địch": { color: "#9c2b2b", label: "Kẻ thù" },
};

/** Màu vàng kim nổi bật cho lãnh thổ của người chơi ở chế độ Quan Hệ. */
export const PLAYER_HEAT_COLOR = "#c9a94e";
