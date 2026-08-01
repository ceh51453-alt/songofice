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
  // Các chính thể và dân tộc ngoài Westeros. Đây là màu nhận diện trên bản đồ,
  // không nhất thiết là màu huy hiệu của một "Nhà" theo nghĩa phong kiến.
  braavos: { base: "#2f6f7e", light: "#6aa6b2", label: "Lam Titan" },
  pentos: { base: "#9a7042", light: "#c5a06f", label: "Đồng Pentos" },
  myr: { base: "#77508b", light: "#a783b7", label: "Tím Myr" },
  tyrosh: { base: "#8b3f6f", light: "#bd72a0", label: "Tía Tyrosh" },
  lys: { base: "#a67b91", light: "#d2afc0", label: "Hồng Lys" },
  volantis: { base: "#7b332f", light: "#b2665f", label: "Đỏ Volantis" },
  lorath: { base: "#61717b", light: "#91a2ab", label: "Xám Lorath" },
  norvos: { base: "#6e5f42", light: "#9f8d68", label: "Đồng Norvos" },
  qohor: { base: "#435f47", light: "#739179", label: "Lục Qohor" },
  dothraki: { base: "#78602f", light: "#aa8d52", label: "Hoàng Thảo Hải" },
  sarnor: { base: "#7b6a3a", light: "#ad985f", label: "Vàng Sarnor" },
  saath: { base: "#626f43", light: "#929f6a", label: "Lục Saath" },
  astapor: { base: "#9a4f3b", light: "#c77d68", label: "Đỏ Astapor" },
  yunkai: { base: "#a08235", light: "#ceb361", label: "Vàng Yunkai" },
  meereen: { base: "#6f4c72", light: "#9f7da2", label: "Tím Meereen" },
  "new-ghis": { base: "#8a5b39", light: "#b88761", label: "Đồng Tân Ghis" },
  ghiscar: { base: "#765038", light: "#a77c5d", label: "Nâu Ghiscari" },
  qarth: { base: "#327e83", light: "#6aafb2", label: "Ngọc Qarth" },
  lhazar: { base: "#7b8a53", light: "#aab77c", label: "Lục Lhazar" },
  "yi-ti": { base: "#9b7a20", light: "#c9a94d", label: "Hoàng Yi Ti" },
  "jogos-nhai": { base: "#80613f", light: "#b18c65", label: "Nâu Jogos Nhai" },
  asshai: { base: "#433b55", light: "#716780", label: "Tím Bóng Tối" },
  ibben: { base: "#53646a", light: "#82949a", label: "Xám Ibben" },
  "summer-islands": { base: "#31755b", light: "#68a388", label: "Lục Đảo Hè" },
  naath: { base: "#8f8441", light: "#bdb269", label: "Vàng Bướm" },
  "basilisk-isles": { base: "#4e6952", light: "#7f987f", label: "Lục Basilisk" },
  gogossos: { base: "#69444d", light: "#986f77", label: "Đỏ Gogossos" },
  "free-cities": { base: "#486c86", light: "#789bb1", label: "Lam Thành Phố Tự Do" },
  "targaryen-essos": { base: "#55202b", light: "#8d4e58", label: "Đỏ Rồng Lưu Vong" },
  mercenary: { base: "#68634d", light: "#989279", label: "Đồng Đánh Thuê" },
  "golden-company": { base: "#92752c", light: "#c1a252", label: "Vàng Hoàng Kim" },
  valyria: { base: "#694147", light: "#9b7278", label: "Đỏ Tro Valyria" },
  "shadow-lands": { base: "#343345", light: "#646278", label: "Tím Vùng Bóng Tối" },
  pirates: { base: "#4f5550", light: "#7d857f", label: "Xám Hải Tặc" },
  "free-folk": { base: "#59645d", light: "#87948b", label: "Xám Dân Tự Do" },
  "night-watch": { base: "#252a2d", light: "#596166", label: "Đen Tuần Đêm" },

  // ── CHƯ HẦU WESTEROS ──────────────────────────────────────────────────
  // Bắc
  karstark: { base: "#4a4a50", light: "#7a7a82", label: "Xám Mặt Trời" },
  umber: { base: "#7a4520", light: "#a87048", label: "Cam Khổng Lồ" },
  mormont: { base: "#2e5030", light: "#5a8a5e", label: "Lục Đảo Gấu" },
  manderly: { base: "#2a6080", light: "#5a90b0", label: "Lam Cá Nhân Ngư" },
  glover: { base: "#5a2828", light: "#8a5555", label: "Đỏ Bàn Tay Sắt" },
  reed: { base: "#405040", light: "#708070", label: "Xám Xanh Đầm Lầy" },
  dustin: { base: "#604820", light: "#907848", label: "Vàng Rìu" },
  tallhart: { base: "#406030", light: "#70a060", label: "Lục Lính Canh" },
  // Quần Đảo Sắt
  harlaw: { base: "#404048", light: "#707078", label: "Xám Lưỡi Hái" },
  goodbrother: { base: "#504020", light: "#806848", label: "Vàng Sừng" },
  drumm: { base: "#602020", light: "#904848", label: "Đỏ Xương" },
  blacktyde: { base: "#204050", light: "#487080", label: "Xanh Sóng Đen" },
  // Thung Lũng
  grafton: { base: "#706020", light: "#a09048", label: "Vàng Tháp" },
  corbray: { base: "#582020", light: "#884848", label: "Đỏ Quạ" },
  sunderland: { base: "#305060", light: "#588090", label: "Lam Ba Chị Em" },
  waynwood: { base: "#305030", light: "#588058", label: "Lục Bánh Xe" },
  hunter: { base: "#585020", light: "#888048", label: "Nâu Mũi Tên" },
  // Vùng Sông
  mallister: { base: "#483060", light: "#785888", label: "Tím Đại Bàng" },
  whent: { base: "#505020", light: "#808048", label: "Vàng Dơi" },
  mooton: { base: "#704030", light: "#a06858", label: "Đỏ Cá" },
  blackwood: { base: "#303030", light: "#606060", label: "Đen Cây Tâm" },
  darry: { base: "#584830", light: "#887858", label: "Nâu Darry" },
  // Vùng Tây
  lefford: { base: "#385878", light: "#6088a8", label: "Lam Răng Vàng" },
  westerling: { base: "#706848", light: "#a09878", label: "Cát Vỏ Sò" },
  crakehall: { base: "#484030", light: "#787058", label: "Nâu Lợn Rừng" },
  farman: { base: "#305068", light: "#588098", label: "Lam Buồm" },
  marbrand: { base: "#704820", light: "#a07848", label: "Cam Lửa" },
  // Đất Vương Thất
  celtigar: { base: "#703030", light: "#a05858", label: "Đỏ Cua" },
  stokeworth: { base: "#585858", light: "#888888", label: "Xám Chuông" },
  rykker: { base: "#304050", light: "#587080", label: "Lam Búa" },
  sunglass: { base: "#707040", light: "#a0a068", label: "Vàng Mặt Trời" },
  // Reach
  redwyne: { base: "#582040", light: "#884868", label: "Tím Nho" },
  tarly: { base: "#305020", light: "#588048", label: "Lục Thợ Săn" },
  rowan: { base: "#605820", light: "#908848", label: "Vàng Sồi" },
  oakheart: { base: "#405820", light: "#688848", label: "Lục Lá Sồi" },
  florent: { base: "#604020", light: "#906848", label: "Cam Cáo" },
  caswell: { base: "#585830", light: "#888858", label: "Vàng Centaur" },
  crane: { base: "#305058", light: "#588088", label: "Lam Hạc" },
  // Vùng Bão
  connington: { base: "#682020", light: "#984848", label: "Đỏ Ưng" },
  tarth: { base: "#306068", light: "#589098", label: "Lam Sapphire" },
  dondarrion: { base: "#402058", light: "#684888", label: "Tím Sét" },
  swann: { base: "#383838", light: "#686868", label: "Đen Trắng Thiên Nga" },
  penrose: { base: "#584820", light: "#887848", label: "Vàng Quill" },
  estermont: { base: "#205048", light: "#488078", label: "Lục Rùa" },
  wylde: { base: "#304048", light: "#587078", label: "Xám Bão" },
  // Dorne
  dayne: { base: "#483060", light: "#785888", label: "Tím Sao Rơi" },
  fowler: { base: "#405060", light: "#688090", label: "Lam Ưng Fowler" },
  uller: { base: "#704820", light: "#a07848", label: "Cam Thằn Lằn" },
  manwoody: { base: "#404038", light: "#706860", label: "Xám Sọ" },
  blackmont: { base: "#303020", light: "#606048", label: "Đen Kền Kền" },
  toland: { base: "#585820", light: "#888848", label: "Vàng Rồng Tròn" },
  wyl: { base: "#404020", light: "#686848", label: "Vàng Rắn" },

  "vô-chủ": { base: "#4a4a4a", light: "#707070", label: "Vô Chủ / Tranh Chấp" },
};

export const NEUTRAL_COLOR: HouseColor = HOUSE_COLORS["vô-chủ"];

const GENERATED_COLORS = new Map<string, HouseColor>();

/** Hash FNV-1a nhỏ, ổn định giữa browser/phiên chơi. */
function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Chính thể do mod/save cũ tạo vẫn phải có màu riêng thay vì cùng rơi về xám.
 * HSL giữ độ bão hoà thấp để hợp bảng màu trầm của app; cùng một id luôn cho
 * cùng một màu nên bản đồ không "nhảy màu" giữa các lượt.
 */
function generatedFactionColor(id: string): HouseColor {
  const cached = GENERATED_COLORS.get(id);
  if (cached) return cached;
  const hash = stableHash(id);
  const hue = hash % 360;
  const saturation = 28 + ((hash >>> 9) % 15);
  const baseLightness = 34 + ((hash >>> 17) % 9);
  const color = {
    base: `hsl(${hue} ${saturation}% ${baseLightness}%)`,
    light: `hsl(${hue} ${Math.min(58, saturation + 8)}% ${Math.min(70, baseLightness + 22)}%)`,
    label: `Màu thế lực ${id}`,
  };
  GENERATED_COLORS.set(id, color);
  return color;
}

export function houseColor(houseId: string): HouseColor {
  if (!houseId || houseId === "vô-chủ") return NEUTRAL_COLOR;
  return HOUSE_COLORS[houseId] ?? generatedFactionColor(houseId);
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
