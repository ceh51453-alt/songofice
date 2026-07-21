// content/westeros/mapMarkers.ts
// ============================================================================
// ĐỊA DANH TRÊN BẢN ĐỒ (9.2) — thành phố/địa danh phụ + mốc Essos (9.6.1).
// Trọng trấn của 9 vùng dựng động từ regions.ts (seat/seatXY). File này chỉ giữ
// các marker THÊM (thành phố lớn, Essos), gắn deep-link wiki (9.4). Thêm địa
// danh riêng = thêm 1 dòng ở đây, KHÔNG đụng engine.
// ============================================================================

export interface MapMarker {
  id: string;
  name: string;
  type: "castle" | "city" | "landmark";
  x: number;
  y: number; // px ảnh gốc
  /** slug awoiaf.westeros.org cho nút "tra cứu lore" (9.4). */
  wikiSlug?: string;
  /** chỉ hiện ở các Era này (rỗng = mọi Era). */
  onlyEras?: string[];
}

export const MAP_MARKERS: MapMarker[] = [
  { id: "the-wall", name: "Tường Thành", type: "landmark", x: 480, y: 95, wikiSlug: "The_Wall" },
  { id: "white-harbor", name: "White Harbor", type: "city", x: 660, y: 430, wikiSlug: "White_Harbor" },
  { id: "oldtown", name: "Oldtown", type: "city", x: 250, y: 1120, wikiSlug: "Oldtown" },
  { id: "dragonstone", name: "Dragonstone", type: "castle", x: 830, y: 745, wikiSlug: "Dragonstone" },
  // ── mốc Essos (rìa đông ảnh) — cho tuyến Dany/Essos, tuỳ Era ──
  { id: "braavos", name: "Braavos", type: "city", x: 950, y: 300, wikiSlug: "Braavos" },
  { id: "pentos", name: "Pentos", type: "city", x: 960, y: 560, wikiSlug: "Pentos" },
  // ── Đêm Trường — địa danh cổ đại ──
  { id: "old-winterfell", name: "Winterfell Cổ Đại", type: "landmark", x: 470, y: 310, onlyEras: ["long-night"], wikiSlug: "Winterfell" },
  { id: "children-grove", name: "Rừng Trẻ Con", type: "landmark", x: 520, y: 200, onlyEras: ["long-night"] },
  { id: "the-fist", name: "Nắm Đấm Người Đầu Tiên", type: "landmark", x: 420, y: 60, onlyEras: ["long-night"], wikiSlug: "Fist_of_the_First_Men" },
  // ── Vũ Điệu Rồng — chiến trường rồng ──
  { id: "rooks-rest", name: "Rook's Rest", type: "landmark", x: 750, y: 720, onlyEras: ["dance-of-dragons"], wikiSlug: "Rook%27s_Rest" },
  { id: "gods-eye", name: "Mắt Thần", type: "landmark", x: 570, y: 680, onlyEras: ["dance-of-dragons"], wikiSlug: "Gods_Eye" },
  { id: "dragonpit", name: "Hố Rồng", type: "landmark", x: 700, y: 760, onlyEras: ["dance-of-dragons"], wikiSlug: "Dragonpit" },
  { id: "harrenhal-dance", name: "Harrenhal", type: "castle", x: 540, y: 630, onlyEras: ["dance-of-dragons"], wikiSlug: "Harrenhal" },
  // ── Loạn Blackfyre — chiến trường ──
  { id: "redgrass-field", name: "Cánh Đồng Cỏ Đỏ", type: "landmark", x: 630, y: 850, onlyEras: ["blackfyre-rebellion"], wikiSlug: "Battle_of_the_Redgrass_Field" },
  // ── Dunk & Egg — địa danh ──
  { id: "ashford-meadow", name: "Ashford Meadow", type: "landmark", x: 500, y: 870, onlyEras: ["dunk-and-egg"], wikiSlug: "Ashford" },
  { id: "whitewalls", name: "Whitewalls", type: "castle", x: 620, y: 700, onlyEras: ["dunk-and-egg"], wikiSlug: "Whitewalls" },
  { id: "pennytree", name: "Pennytree", type: "landmark", x: 560, y: 650, onlyEras: ["dunk-and-egg"] },
  // ── Loạn Greyjoy — cảng bị đốt ──
  { id: "lannisport", name: "Lannisport", type: "city", x: 235, y: 720, onlyEras: ["greyjoy-rebellion"], wikiSlug: "Lannisport" },
  { id: "great-wyk", name: "Great Wyk", type: "landmark", x: 140, y: 550, onlyEras: ["greyjoy-rebellion"], wikiSlug: "Great_Wyk" },
  { id: "fair-isle", name: "Fair Isle", type: "landmark", x: 130, y: 650, onlyEras: ["greyjoy-rebellion"], wikiSlug: "Fair_Isle" },
];

export function markersForEra(eraId: string): MapMarker[] {
  return MAP_MARKERS.filter((m) => !m.onlyEras || m.onlyEras.includes(eraId));
}
