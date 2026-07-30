// content/westeros/mapMarkers.ts
// ============================================================================
// ĐỊA DANH TRÊN BẢN ĐỒ (9.2) — thành phố/địa danh phụ + mốc Essos (9.6.1).
// Trọng trấn của 9 vùng dựng động từ regions.ts (seat/seatXY). File này giữ
// các marker bổ sung (thành trì, thành phố lớn, Essos), gắn deep-link wiki (9.4).
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
  /** Dân số của thành trì (để tạo Lãnh Địa nếu người chơi chiếm). */
  population?: number;
  /** Vùng chứa địa danh này (the-north, the-reach...) */
  regionId?: string;
}

export const MAP_MARKERS: MapMarker[] = [
  // ── Mốc chính & Địa danh huyền thoại ──
  { id: "the-wall", name: "Tường Thành", type: "landmark", x: 480, y: 95, wikiSlug: "The_Wall" },
  { id: "castle-black", name: "Castle Black", type: "castle", x: 480, y: 105, wikiSlug: "Castle_Black" },
  { id: "shadow-tower", name: "Tháp Bóng Đêm", type: "castle", x: 320, y: 95, wikiSlug: "Shadow_Tower" },
  { id: "eastwatch", name: "Eastwatch-by-the-Sea", type: "castle", x: 680, y: 95, wikiSlug: "Eastwatch-by-the-Sea" },

  // ── Phương Bắc (The North) ──
  { id: "dreadfort", name: "Dreadfort (Bolton)", type: "castle", x: 590, y: 250, wikiSlug: "Dreadfort", population: 15000, regionId: "the-north" },
  { id: "karhold", name: "Karhold (Karstark)", type: "castle", x: 740, y: 190, wikiSlug: "Karhold", population: 8000, regionId: "the-north" },
  { id: "white-harbor", name: "White Harbor", type: "city", x: 660, y: 430, wikiSlug: "White_Harbor", population: 80000, regionId: "the-north" },
  { id: "bear-island", name: "Đảo Gấu (Mormont)", type: "castle", x: 240, y: 150, wikiSlug: "Bear_Island", regionId: "the-north" },
  { id: "moat-cailin", name: "Moat Cailin (Ải Eo Đất)", type: "castle", x: 450, y: 470, wikiSlug: "Moat_Cailin", regionId: "the-north" },
  { id: "barrowton", name: "Thị Trấn Barrowton", type: "city", x: 350, y: 380, wikiSlug: "Barrowton", regionId: "the-north" },
  { id: "deepwood-motte", name: "Deepwood Motte (Glover)", type: "castle", x: 310, y: 210, wikiSlug: "Deepwood_Motte", regionId: "the-north" },
  { id: "torrhens-square", name: "Torrhen's Square", type: "castle", x: 380, y: 310, wikiSlug: "Torrhen%27s_Square", regionId: "the-north" },
  { id: "winter-town", name: "Thị trấn Mùa Đông", type: "city", x: 468, y: 332, wikiSlug: "Winter_town", population: 6000, regionId: "the-north" },
  { id: "hornwood", name: "Hornwood", type: "castle", x: 625, y: 315, wikiSlug: "Hornwood", population: 5000, regionId: "the-north" },

  // ── Quần Đảo Sắt (Iron Islands) ──
  { id: "harlaw", name: "Harlaw (Mười Tháp)", type: "castle", x: 95, y: 500, wikiSlug: "Harlaw", regionId: "the-iron-islands" },
  { id: "old-wyk", name: "Old Wyk (Cổ Nguyệt Đảo)", type: "landmark", x: 45, y: 485, wikiSlug: "Old_Wyk", regionId: "the-iron-islands" },
  { id: "lordsport", name: "Cảng Lordsport", type: "city", x: 112, y: 554, wikiSlug: "Lordsport", population: 12000, regionId: "the-iron-islands" },
  { id: "pebbleton", name: "Pebbleton", type: "city", x: 135, y: 520, wikiSlug: "Pebbleton", population: 4500, regionId: "the-iron-islands" },

  // ── Thung Lũng Arryn (The Vale) ──
  { id: "gulltown", name: "Cảng Gulltown", type: "city", x: 850, y: 630, wikiSlug: "Gulltown", population: 50000, regionId: "the-vale" },
  { id: "runestone", name: "Runestone (Royce)", type: "castle", x: 830, y: 590, wikiSlug: "Runestone", regionId: "the-vale" },
  { id: "bloody-gate", name: "Cổng Máu", type: "landmark", x: 680, y: 560, wikiSlug: "Bloody_Gate", regionId: "the-vale" },
  { id: "hearts-home", name: "Heart's Home (Corbray)", type: "castle", x: 770, y: 520, wikiSlug: "Heart%27s_Home", regionId: "the-vale" },
  { id: "gates-of-the-moon", name: "Cổng Mặt Trăng", type: "castle", x: 724, y: 596, wikiSlug: "Gates_of_the_Moon", population: 5000, regionId: "the-vale" },
  { id: "wickenden", name: "Wickenden", type: "city", x: 790, y: 665, wikiSlug: "Wickenden", population: 9000, regionId: "the-vale" },

  // ── Vùng Sông (The Riverlands) ──
  { id: "harrenhal", name: "Harrenhal", type: "castle", x: 540, y: 630, wikiSlug: "Harrenhal", regionId: "the-riverlands" },
  { id: "the-twins", name: "Song Sinh (Frey)", type: "castle", x: 440, y: 500, wikiSlug: "The_Twins", regionId: "the-riverlands" },
  { id: "seagard", name: "Seagard (Mallister)", type: "castle", x: 370, y: 520, wikiSlug: "Seagard", regionId: "the-riverlands" },
  { id: "maidenpool", name: "Maidenpool", type: "city", x: 640, y: 650, wikiSlug: "Maidenpool", regionId: "the-riverlands" },
  { id: "stone-hedge", name: "Stone Hedge (Bracken)", type: "castle", x: 490, y: 650, wikiSlug: "Stone_Hedge", regionId: "the-riverlands" },
  { id: "raventree-hall", name: "Raventree Hall (Blackwood)", type: "castle", x: 450, y: 590, wikiSlug: "Raventree_Hall", regionId: "the-riverlands" },
  { id: "fairmarket", name: "Fairmarket", type: "city", x: 355, y: 590, wikiSlug: "Fairmarket", population: 18000, regionId: "the-riverlands" },
  { id: "saltpans", name: "Saltpans", type: "city", x: 670, y: 625, wikiSlug: "Saltpans", population: 10000, regionId: "the-riverlands" },
  { id: "stoney-sept", name: "Stoney Sept", type: "city", x: 410, y: 690, wikiSlug: "Stoney_Sept", population: 8000, regionId: "the-riverlands" },
  { id: "lords-harroways-town", name: "Thị trấn Lord Harroway", type: "city", x: 590, y: 645, wikiSlug: "Lord_Harroway%27s_Town", population: 15000, regionId: "the-riverlands" },

  // ── Vùng Tây (The Westerlands) ──
  { id: "lannisport", name: "Thành Lannisport", type: "city", x: 235, y: 720, wikiSlug: "Lannisport", population: 300000, regionId: "the-westerlands" },
  { id: "golden-tooth", name: "Ải Răng Vàng", type: "castle", x: 330, y: 630, wikiSlug: "Golden_Tooth", regionId: "the-westerlands" },
  { id: "crakehall", name: "Crakehall", type: "castle", x: 230, y: 780, wikiSlug: "Crakehall", regionId: "the-westerlands" },
  { id: "castamere", name: "Phế Tích Castamere", type: "landmark", x: 260, y: 620, wikiSlug: "Castamere", regionId: "the-westerlands" },
  { id: "ashemark", name: "Ashemark (Marbrand)", type: "castle", x: 280, y: 640, wikiSlug: "Ashemark", regionId: "the-westerlands" },
  { id: "faircastle", name: "Faircastle", type: "castle", x: 175, y: 665, wikiSlug: "Faircastle", population: 8000, regionId: "the-westerlands" },
  { id: "silverhill", name: "Silverhill", type: "castle", x: 240, y: 670, wikiSlug: "Silverhill", population: 7000, regionId: "the-westerlands" },

  // ── Đất Vương Thất (The Crownlands) ──
  { id: "dragonstone", name: "Dragonstone", type: "castle", x: 830, y: 745, wikiSlug: "Dragonstone", population: 10000, regionId: "the-crownlands" },
  { id: "duskendale", name: "Duskendale", type: "city", x: 730, y: 710, wikiSlug: "Duskendale", population: 40000, regionId: "the-crownlands" },
  { id: "driftmark", name: "Driftmark (Velaryon)", type: "castle", x: 790, y: 760, wikiSlug: "Driftmark", regionId: "the-crownlands" },
  { id: "claw-isle", name: "Claw Isle (Celtigar)", type: "castle", x: 800, y: 690, wikiSlug: "Claw_Isle", regionId: "the-crownlands" },
  { id: "rosby", name: "Rosby", type: "castle", x: 665, y: 735, wikiSlug: "Rosby", population: 7000, regionId: "the-crownlands" },
  { id: "stokeworth", name: "Stokeworth", type: "castle", x: 650, y: 750, wikiSlug: "Stokeworth", population: 6000, regionId: "the-crownlands" },
  { id: "hayford", name: "Hayford", type: "city", x: 640, y: 790, wikiSlug: "Hayford", population: 5000, regionId: "the-crownlands" },
  { id: "spicetown", name: "Spicetown", type: "city", x: 780, y: 780, wikiSlug: "Spicetown", population: 12000, regionId: "the-crownlands" },

  // ── Reach ──
  { id: "oldtown", name: "Oldtown", type: "city", x: 250, y: 1120, wikiSlug: "Oldtown", population: 500000, regionId: "the-reach" },
  { id: "the-arbor", name: "Đảo Rượu Vang Arbor", type: "city", x: 160, y: 1200, wikiSlug: "The_Arbor", regionId: "the-reach" },
  { id: "horn-hill", name: "Horn Hill (Tarly)", type: "castle", x: 330, y: 1070, wikiSlug: "Horn_Hill", regionId: "the-reach" },
  { id: "bitterbridge", name: "Bitterbridge (Caswell)", type: "castle", x: 440, y: 830, wikiSlug: "Bitterbridge", regionId: "the-reach" },
  { id: "brightwater", name: "Brightwater Keep (Florent)", type: "castle", x: 310, y: 990, wikiSlug: "Brightwater_Keep", regionId: "the-reach" },
  { id: "ashford", name: "Ashford", type: "castle", x: 500, y: 870, wikiSlug: "Ashford", regionId: "the-reach" },
  { id: "tumbleton", name: "Tumbleton", type: "city", x: 475, y: 930, wikiSlug: "Tumbleton", population: 18000, regionId: "the-reach" },
  { id: "honeyholt", name: "Honeyholt", type: "castle", x: 300, y: 1085, wikiSlug: "Honeyholt", population: 6000, regionId: "the-reach" },

  // ── Vùng Bão (The Stormlands) ──
  { id: "evenfall-hall", name: "Đảo Tarth (Evenfall)", type: "castle", x: 830, y: 920, wikiSlug: "Evenfall_Hall", regionId: "the-stormlands" },
  { id: "griffins-roost", name: "Griffin's Roost (Connington)", type: "castle", x: 740, y: 940, wikiSlug: "Griffin%27s_Roost", regionId: "the-stormlands" },
  { id: "blackhaven", name: "Blackhaven (Dondarrion)", type: "castle", x: 610, y: 1040, wikiSlug: "Blackhaven", regionId: "the-stormlands" },
  { id: "nightsong", name: "Nightsong (Caron)", type: "castle", x: 570, y: 1020, wikiSlug: "Nightsong", regionId: "the-stormlands" },
  { id: "weeping-town", name: "Thị trấn Weeping", type: "city", x: 760, y: 1010, wikiSlug: "Weeping_Town", population: 12000, regionId: "the-stormlands" },
  { id: "summerhall", name: "Tàn tích Summerhall", type: "landmark", x: 550, y: 960, wikiSlug: "Summerhall", regionId: "the-stormlands" },

  // ── Dorne ──
  { id: "yronwood", name: "Yronwood", type: "castle", x: 480, y: 1200, wikiSlug: "Yronwood", regionId: "dorne" },
  { id: "starfall", name: "Starfall (Dayne)", type: "castle", x: 320, y: 1280, wikiSlug: "Starfall", regionId: "dorne" },
  { id: "water-gardens", name: "Vườn Nước (Water Gardens)", type: "landmark", x: 600, y: 1340, wikiSlug: "Water_Gardens", regionId: "dorne" },
  { id: "lemonwood", name: "Lemonwood (Dalt)", type: "castle", x: 630, y: 1370, wikiSlug: "Lemonwood", regionId: "dorne" },
  { id: "planky-town", name: "Planky Town", type: "city", x: 635, y: 1325, wikiSlug: "Planky_Town", population: 22000, regionId: "dorne" },
  { id: "godsgrace", name: "Godsgrace", type: "city", x: 545, y: 1235, wikiSlug: "Godsgrace", population: 9000, regionId: "dorne" },
  { id: "ghost-hill", name: "Ghost Hill", type: "castle", x: 700, y: 1305, wikiSlug: "Ghost_Hill", population: 5000, regionId: "dorne" },

  // ── Mốc Essos ──
  { id: "braavos", name: "Braavos", type: "city", x: 950, y: 300, wikiSlug: "Braavos", population: 500000 },
  { id: "pentos", name: "Pentos", type: "city", x: 960, y: 560, wikiSlug: "Pentos", population: 200000 },

  // ── Đêm Trường — địa danh cổ đại ──
  { id: "old-winterfell", name: "Winterfell Cổ Đại", type: "landmark", x: 470, y: 310, onlyEras: ["long-night"], wikiSlug: "Winterfell" },
  { id: "children-grove", name: "Rừng Trẻ Con", type: "landmark", x: 520, y: 200, onlyEras: ["long-night"] },
  { id: "the-fist", name: "Nắm Đấm Người Đầu Tiên", type: "landmark", x: 420, y: 60, onlyEras: ["long-night"], wikiSlug: "Fist_of_the_First_Men" },

  // ── Vũ Điệu Rồng — chiến trường rồng ──
  { id: "rooks-rest", name: "Rook's Rest", type: "landmark", x: 750, y: 720, onlyEras: ["dance-of-dragons"], wikiSlug: "Rook%27s_Rest" },
  { id: "gods-eye", name: "Mắt Thần", type: "landmark", x: 570, y: 680, onlyEras: ["dance-of-dragons"], wikiSlug: "Gods_Eye" },
  { id: "dragonpit", name: "Hố Rồng", type: "landmark", x: 700, y: 760, onlyEras: ["dance-of-dragons"], wikiSlug: "Dragonpit" },

  // ── Loạn Blackfyre — chiến trường ──
  { id: "redgrass-field", name: "Cánh Đồng Cỏ Đỏ", type: "landmark", x: 630, y: 850, onlyEras: ["blackfyre-rebellion"], wikiSlug: "Battle_of_the_Redgrass_Field" },

  // ── Dunk & Egg — địa danh ──
  { id: "ashford-meadow", name: "Ashford Meadow", type: "landmark", x: 500, y: 870, onlyEras: ["dunk-and-egg"], wikiSlug: "Ashford" },
  { id: "whitewalls", name: "Whitewalls", type: "castle", x: 620, y: 700, onlyEras: ["dunk-and-egg"], wikiSlug: "Whitewalls" },
  { id: "pennytree", name: "Pennytree", type: "landmark", x: 560, y: 650, onlyEras: ["dunk-and-egg"] },

  // ── Loạn Greyjoy — cảng bị đốt ──
  { id: "great-wyk", name: "Great Wyk", type: "landmark", x: 120, y: 510, onlyEras: ["greyjoy-rebellion"], wikiSlug: "Great_Wyk" },
  { id: "fair-isle", name: "Fair Isle", type: "landmark", x: 130, y: 650, onlyEras: ["greyjoy-rebellion"], wikiSlug: "Fair_Isle" },
];

export function markersForEra(eraId: string): MapMarker[] {
  return MAP_MARKERS.filter((m) => !m.onlyEras || m.onlyEras.includes(eraId));
}
