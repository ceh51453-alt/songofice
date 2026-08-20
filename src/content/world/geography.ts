import type { Terrain } from "../../mvu/schema";

/**
 * Registry địa lý trung lập cho toàn bộ thế giới đã biết.
 *
 * `MACRO_REGIONS` chỉ phục vụ điều hướng/nhãn/tổng hợp. Chủ quyền, dân số và
 * gameplay luôn chạy trên `REGIONS` (các leaf province) để không đếm trùng.
 */

export type ContinentId =
  | "westeros"
  | "essos"
  | "ibben"
  | "summer-isles"
  | "sothoryos"
  | "ulthos";

export interface ContinentMetadata {
  id: ContinentId;
  name: string;
  description: string;
  labelXY: [number, number];
  bounds: [number, number, number, number];
  playable: boolean;
  tint: string;
}

export interface MacroRegion {
  id: string;
  name: string;
  description: string;
  continentId: ContinentId;
  labelXY: [number, number];
  bounds: [number, number, number, number];
  /** ID vùng cũ dùng để trải controller/history xuống các province con. */
  legacyRegionId?: string;
  defaultHouse: string;
  terrain: Terrain;
  cultureIds: string[];
}

export interface MapRegion {
  id: string;
  name: string;
  description: string;
  continentId: ContinentId;
  /** Macro-region chứa province này. */
  parentId: string;
  /** Nhóm chính trị lịch sử; ở Westeros là một trong 9 ID legacy. */
  realmId: string;
  seat: string;
  seatXY: [number, number];
  polygonPx: [number, number][];
  terrain: Terrain;
  coastal: boolean;
  island?: boolean;
  defaultHouse: string;
  population: number;
  seatPopulation?: number;
  seatHiddenEras?: string[];
  cultureIds: string[];
  /** Nhãn ưu tiên cao hơn được hiện trước khi zoom sâu. */
  labelPriority: number;
  landConnections: string[];
  seaConnections: string[];
  neighbors: string[];
}

/** Compatibility alias for systems that refer to a leaf province as a world region. */
export type WorldRegion = MapRegion;

export const MAP_W = 3600;
export const MAP_H = 2200;

export const CONTINENTS: ContinentMetadata[] = [
  {
    id: "westeros", name: "Westeros",
    description: "Lục địa phía tây, từ Vùng Đất Luôn Đông ở cực bắc tới Dorne ở phương nam.",
    labelXY: [430, 760], bounds: [0, 0, 1000, 1500], playable: true, tint: "#7f8f82",
  },
  {
    id: "essos", name: "Essos",
    description: "Đại lục phương đông của các Thành Phố Tự Do, Biển Dothraki, Ghiscar, Yi Ti và vùng Bóng Tối.",
    labelXY: [2250, 760], bounds: [1050, 60, 3500, 1480], playable: true, tint: "#9a8969",
  },
  {
    id: "ibben", name: "Ibben",
    description: "Quần đảo lạnh và nhiều sương ở Biển Run Rẩy, quê hương của người Ibben.",
    labelXY: [2310, 105], bounds: [2150, 0, 2500, 260], playable: true, tint: "#78929a",
  },
  {
    id: "summer-isles", name: "Quần Đảo Mùa Hè",
    description: "Chuỗi đảo nhiệt đới giàu gỗ quý, rượu và truyền thống hàng hải ở Biển Mùa Hè.",
    labelXY: [1030, 1770], bounds: [650, 1550, 1420, 2050], playable: true, tint: "#638c70",
  },
  {
    id: "sothoryos", name: "Sothoryos",
    description: "Lục địa rừng rậm khổng lồ phía nam, phần lớn vẫn chưa được người phương bắc thám hiểm.",
    labelXY: [2150, 1880], bounds: [1450, 1450, 2850, 2200], playable: true, tint: "#536f4d",
  },
  {
    id: "ulthos", name: "Ulthos",
    description: "Khối đất bí ẩn ngoài rìa đông nam của bản đồ, hầu như không có ghi chép đáng tin cậy.",
    labelXY: [3270, 1840], bounds: [2920, 1420, 3600, 2200], playable: true, tint: "#4f665f",
  },
];

export const CONTINENTS_BY_ID: Record<ContinentId, ContinentMetadata> = Object.fromEntries(
  CONTINENTS.map((continent) => [continent.id, continent]),
) as Record<ContinentId, ContinentMetadata>;

export const MACRO_REGIONS: MacroRegion[] = [
  // Westeros
  { id: "macro-the-north", name: "Phương Bắc", description: "Miền đất rộng từ Eo Cổ tới Tường Thành.", continentId: "westeros", labelXY: [470, 300], bounds: [150, 95, 830, 490], legacyRegionId: "the-north", defaultHouse: "stark", terrain: "Tuyết/Băng Giá", cultureIds: ["first-men", "northmen"] },
  { id: "macro-iron-islands", name: "Quần Đảo Sắt", description: "Các đảo đá khắc nghiệt của Người Sắt.", continentId: "westeros", labelXY: [80, 535], bounds: [15, 455, 150, 610], legacyRegionId: "the-iron-islands", defaultHouse: "greyjoy", terrain: "Đồi Núi", cultureIds: ["ironborn"] },
  { id: "macro-the-vale", name: "Thung Lũng", description: "Thung lũng phì nhiêu nằm sau Dãy Núi Mặt Trăng.", continentId: "westeros", labelXY: [775, 575], bounds: [630, 455, 925, 715], legacyRegionId: "the-vale", defaultHouse: "arryn", terrain: "Hẻm Núi", cultureIds: ["andal"] },
  { id: "macro-riverlands", name: "Vùng Sông", description: "Đồng bằng và bến vượt quanh hệ thống Tam Xoa.", continentId: "westeros", labelXY: [485, 625], bounds: [325, 455, 665, 775], legacyRegionId: "the-riverlands", defaultHouse: "tully", terrain: "Sông/Lối Vượt Sông", cultureIds: ["riverlander", "andal"] },
  { id: "macro-westerlands", name: "Vùng Tây", description: "Miền đồi núi giàu quặng và vàng bên Biển Hoàng Hôn.", continentId: "westeros", labelXY: [265, 690], bounds: [155, 455, 365, 820], legacyRegionId: "the-westerlands", defaultHouse: "lannister", terrain: "Đồi Núi", cultureIds: ["westerlander", "andal"] },
  { id: "macro-crownlands", name: "Đất Vương Thất", description: "Vùng quanh Vịnh Nước Đen và các đảo Valyria phía đông.", continentId: "westeros", labelXY: [700, 775], bounds: [515, 675, 875, 875], legacyRegionId: "the-crownlands", defaultHouse: "baratheon", terrain: "Đồng Bằng", cultureIds: ["crownlander", "andal"] },
  { id: "macro-reach", name: "Reach", description: "Vựa lúa đông dân dọc sông Mander.", continentId: "westeros", labelXY: [390, 970], bounds: [145, 710, 645, 1190], legacyRegionId: "the-reach", defaultHouse: "tyrell", terrain: "Đồng Bằng", cultureIds: ["reachman", "andal"] },
  { id: "macro-stormlands", name: "Vùng Bão", description: "Rừng mưa, vách biển và các biên trấn phương nam.", continentId: "westeros", labelXY: [720, 990], bounds: [565, 830, 885, 1145], legacyRegionId: "the-stormlands", defaultHouse: "baratheon", terrain: "Rừng Rậm", cultureIds: ["stormlander", "andal"] },
  { id: "macro-dorne", name: "Dorne", description: "Bán đảo sa mạc và núi đỏ ở cực nam Westeros.", continentId: "westeros", labelXY: [560, 1300], bounds: [245, 1095, 875, 1450], legacyRegionId: "dorne", defaultHouse: "martell", terrain: "Sa Mạc", cultureIds: ["dornish", "rhoynar"] },
  { id: "macro-beyond-wall", name: "Ngoài Tường Thành", description: "Rừng ma ám, Frostfangs và vùng băng cực bắc.", continentId: "westeros", labelXY: [500, 45], bounds: [120, 0, 850, 100], defaultHouse: "", terrain: "Tuyết/Băng Giá", cultureIds: ["free-folk"] },

  // Essos
  { id: "macro-free-cities", name: "Các Thành Phố Tự Do", description: "Chín thành bang kế thừa những thuộc địa phía tây của Valyria.", continentId: "essos", labelXY: [1420, 520], bounds: [1080, 150, 1850, 1040], defaultHouse: "free-cities", terrain: "Đồng Bằng", cultureIds: ["valyrian", "free-cities"] },
  { id: "macro-disputed-lands", name: "Đất Tranh Chấp", description: "Miền chiến địa giữa Myr, Tyrosh và Lys cùng quần đảo Stepstones.", continentId: "essos", labelXY: [1320, 1110], bounds: [1030, 930, 1660, 1340], defaultHouse: "mercenary", terrain: "Đồi Núi", cultureIds: ["free-cities"] },
  { id: "macro-rhoyne", name: "Lưu Vực Rhoyne", description: "Dải đất, phế tích và thương cảng dọc con sông lớn nhất phía tây Essos.", continentId: "essos", labelXY: [1750, 630], bounds: [1580, 260, 1960, 1060], defaultHouse: "free-cities", terrain: "Sông/Lối Vượt Sông", cultureIds: ["rhoynar", "valyrian"] },
  { id: "macro-dothraki-sea", name: "Biển Dothraki", description: "Thảo nguyên rộng lớn do các khalasar rong ruổi.", continentId: "essos", labelXY: [2200, 570], bounds: [1850, 220, 2600, 1000], defaultHouse: "dothraki", terrain: "Đồng Bằng", cultureIds: ["dothraki"] },
  { id: "macro-ghiscar", name: "Ghiscar và Vịnh Nô Lệ", description: "Các thành kim tự tháp và đồng bằng nóng quanh vịnh Ghiscar.", continentId: "essos", labelXY: [2200, 1190], bounds: [1850, 980, 2590, 1450], defaultHouse: "ghiscar", terrain: "Sa Mạc", cultureIds: ["ghiscari"] },
  { id: "macro-qarth", name: "Qarth và Hoang Mạc Đỏ", description: "Cửa ngõ giữa Biển Dothraki và Eo Biển Ngọc.", continentId: "essos", labelXY: [2700, 1110], bounds: [2480, 800, 2990, 1430], defaultHouse: "qarth", terrain: "Sa Mạc", cultureIds: ["qartheen"] },
  { id: "macro-valyria", name: "Valyria", description: "Bán đảo đổ nát, núi lửa và các thành thuộc địa sống sót sau Doom.", continentId: "essos", labelXY: [1760, 1260], bounds: [1520, 1050, 2000, 1480], defaultHouse: "", terrain: "Đồi Núi", cultureIds: ["valyrian"] },
  { id: "macro-far-east", name: "Viễn Đông", description: "Sarnor, Bone Mountains, Yi Ti, Jogos Nhai và vùng Bóng Tối.", continentId: "essos", labelXY: [3100, 610], bounds: [2480, 100, 3550, 1060], defaultHouse: "", terrain: "Đồng Bằng", cultureIds: ["far-eastern"] },

  // Other continents / archipelagos
  { id: "macro-ibben", name: "Ibben", description: "Ib, Ib Sar và các đảo săn cá voi ở Biển Run Rẩy.", continentId: "ibben", labelXY: [2310, 100], bounds: [2160, 10, 2480, 250], defaultHouse: "ibben", terrain: "Tuyết/Băng Giá", cultureIds: ["ibbenese"] },
  { id: "macro-summer-isles", name: "Quần Đảo Mùa Hè", description: "Các đảo Walano, Jhala, Omboru và Koj.", continentId: "summer-isles", labelXY: [1030, 1750], bounds: [680, 1560, 1400, 2030], defaultHouse: "summer-isles", terrain: "Rừng Rậm", cultureIds: ["summer-islander"] },
  { id: "macro-sothoryos-coast", name: "Bờ Bắc Sothoryos", description: "Basilisk Isles, Zamettar, Yeen và dải rừng ven biển.", continentId: "sothoryos", labelXY: [2050, 1670], bounds: [1450, 1450, 2750, 1880], defaultHouse: "", terrain: "Rừng Rậm", cultureIds: ["sothoryi"] },
  { id: "macro-sothoryos-interior", name: "Nội Địa Sothoryos", description: "Green Hell và miền nam chưa được đo đạc.", continentId: "sothoryos", labelXY: [2200, 2040], bounds: [1600, 1820, 2850, 2200], defaultHouse: "", terrain: "Rừng Rậm", cultureIds: ["sothoryi"] },
  { id: "macro-ulthos", name: "Ulthos", description: "Rừng và bờ biển chưa biết ở đông nam thế giới.", continentId: "ulthos", labelXY: [3270, 1810], bounds: [2940, 1440, 3580, 2180], defaultHouse: "", terrain: "Rừng Rậm", cultureIds: ["unknown"] },
];

export const MACRO_REGIONS_BY_ID: Record<string, MacroRegion> = Object.fromEntries(
  MACRO_REGIONS.map((macro) => [macro.id, macro]),
);

/** Geography-facing aliases collapse regional demonyms into playable culture catalogs. */
const GEOGRAPHY_CULTURE_ALIASES: Record<string, string> = {
  northmen: "first-men",
  andal: "andals",
  riverlander: "first-men",
  westerlander: "andals",
  crownlander: "andals",
  reachman: "andals",
  stormlander: "andals",
  dornish: "andals",
  "free-cities": "valyrian",
  "far-eastern": "yi-tish",
  "mountain-peoples": "yi-tish",
  mossovite: "yi-tish",
  islander: "yi-tish",
  shadowmen: "asshaii",
  unknown: "ulthosi",
};

function normalizeGeographyCultureIds(cultureIds: string[]): string[] {
  return [...new Set(cultureIds.map((id) => GEOGRAPHY_CULTURE_ALIASES[id] ?? id))];
}

const GEOGRAPHY_HOUSE_ALIASES: Record<string, string> = {
  "summer-isles": "summer-islands",
  pirates: "basilisk-isles",
};

function normalizeGeographyHouseId(houseId: string): string {
  return GEOGRAPHY_HOUSE_ALIASES[houseId] ?? houseId;
}

for (const macro of MACRO_REGIONS) {
  macro.defaultHouse = normalizeGeographyHouseId(macro.defaultHouse);
  macro.cultureIds = normalizeGeographyCultureIds(macro.cultureIds);
}

interface RegionOptions {
  description?: string;
  terrain?: Terrain;
  coastal?: boolean;
  island?: boolean;
  defaultHouse?: string;
  cultureIds?: string[];
  realmId?: string;
  seatPopulation?: number;
  seatHiddenEras?: string[];
  labelPriority?: number;
}

function polygonBox(x: number, y: number, width: number, height: number): [number, number][] {
  const notchX = Math.min(18, width * 0.14);
  const notchY = Math.min(14, height * 0.14);
  return [
    [x + notchX, y], [x + width - notchX, y + notchY * 0.25],
    [x + width, y + height * 0.48], [x + width - notchX * 0.55, y + height],
    [x + notchX * 0.6, y + height - notchY * 0.2], [x, y + height * 0.45],
  ];
}

function leaf(
  id: string,
  name: string,
  parentId: string,
  seat: string,
  seatXY: [number, number],
  box: [number, number, number, number],
  population: number,
  options: RegionOptions = {},
): MapRegion {
  const macro = MACRO_REGIONS_BY_ID[parentId];
  if (!macro) throw new Error(`Macro-region không tồn tại: ${parentId}`);
  return {
    id,
    name,
    description: options.description ?? `${name} là một tiểu vùng quanh ${seat}, thuộc ${macro.name}.`,
    continentId: macro.continentId,
    parentId,
    realmId: options.realmId ?? macro.legacyRegionId ?? parentId,
    seat,
    seatXY,
    polygonPx: polygonBox(...box),
    terrain: options.terrain ?? macro.terrain,
    coastal: options.coastal ?? false,
    island: options.island,
    defaultHouse: normalizeGeographyHouseId(options.defaultHouse ?? macro.defaultHouse),
    population,
    seatPopulation: options.seatPopulation,
    seatHiddenEras: options.seatHiddenEras,
    cultureIds: normalizeGeographyCultureIds(options.cultureIds ?? [...macro.cultureIds]),
    labelPriority: options.labelPriority ?? 1,
    landConnections: [],
    seaConnections: [],
    neighbors: [],
  };
}

const WESTEROS_REGIONS: MapRegion[] = [
  // Phương Bắc — giữ `the-north` làm province thủ phủ tương thích save cũ.
  leaf("the-north", "Đất Winterfell", "macro-the-north", "Winterfell", [470, 300], [400, 250, 145, 125], 650_000, { coastal: false, seatPopulation: 15_000, seatHiddenEras: ["long-night"], labelPriority: 5 }),
  leaf("north-wolfswood", "Wolfswood", "macro-the-north", "Deepwood Motte", [315, 220], [245, 150, 150, 155], 350_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "glover" }),
  leaf("north-barrowlands", "Barrowlands", "macro-the-north", "Barrowton", [350, 385], [285, 330, 155, 125], 450_000, { coastal: true, terrain: "Đồng Bằng", defaultHouse: "dustin" }),
  leaf("north-white-knife", "White Knife", "macro-the-north", "White Harbor", [660, 430], [555, 350, 150, 125], 650_000, { coastal: true, terrain: "Sông/Lối Vượt Sông", seatPopulation: 80_000, labelPriority: 3, defaultHouse: "manderly" }),
  leaf("north-dreadfort", "Đất Dreadfort", "macro-the-north", "Dreadfort", [590, 250], [540, 185, 135, 145], 450_000, { defaultHouse: "bolton" }),
  leaf("north-karhold", "Karhold", "macro-the-north", "Karhold", [735, 190], [675, 120, 125, 145], 300_000, { defaultHouse: "karstark" }),
  leaf("north-last-hearth", "Last Hearth", "macro-the-north", "Last Hearth", [650, 120], [540, 95, 135, 95], 250_000, { defaultHouse: "umber" }),
  leaf("north-neck", "Eo Cổ", "macro-the-north", "Greywater Watch", [455, 455], [395, 410, 125, 80], 250_000, { terrain: "Đầm Lầy", coastal: true, labelPriority: 3, defaultHouse: "reed" }),
  leaf("north-bear-island", "Đảo Gấu", "macro-the-north", "Mormont Keep", [225, 165], [180, 105, 90, 115], 120_000, { coastal: true, island: true, defaultHouse: "mormont" }),
  leaf("north-skagos", "Skagos", "macro-the-north", "Kingshouse", [800, 185], [770, 105, 90, 145], 180_000, { coastal: true, island: true, terrain: "Đồi Núi" }),
  leaf("north-stony-shore", "Bờ Đá", "macro-the-north", "Torrhen's Square", [370, 310], [205, 255, 160, 145], 350_000, { coastal: true, defaultHouse: "tallhart" }),

  // Quần Đảo Sắt
  leaf("the-iron-islands", "Pyke", "macro-iron-islands", "Pyke", [75, 545], [45, 520, 60, 70], 300_000, { coastal: true, island: true, seatPopulation: 10_000, labelPriority: 5 }),
  leaf("iron-harlaw", "Harlaw", "macro-iron-islands", "Ten Towers", [112, 500], [85, 465, 65, 60], 350_000, { coastal: true, island: true, defaultHouse: "harlaw" }),
  leaf("iron-great-wyk", "Great Wyk", "macro-iron-islands", "Hammerhorn", [48, 490], [18, 455, 60, 60], 300_000, { coastal: true, island: true, defaultHouse: "goodbrother" }),
  leaf("iron-old-wyk", "Old Wyk", "macro-iron-islands", "Nagga's Hill", [38, 555], [18, 530, 45, 55], 150_000, { coastal: true, island: true, defaultHouse: "drumm" }),
  leaf("iron-orkmont", "Orkmont", "macro-iron-islands", "Orkmont", [92, 585], [62, 565, 55, 45], 160_000, { coastal: true, island: true }),
  leaf("iron-saltcliffe", "Saltcliffe", "macro-iron-islands", "Saltcliffe", [130, 552], [110, 525, 40, 55], 120_000, { coastal: true, island: true }),
  leaf("iron-blacktyde", "Blacktyde", "macro-iron-islands", "Blacktyde Castle", [25, 510], [10, 490, 38, 50], 120_000, { coastal: true, island: true, defaultHouse: "blacktyde" }),

  // Vale
  leaf("the-vale", "Thung Lũng Arryn", "macro-the-vale", "The Eyrie", [745, 585], [685, 520, 125, 125], 900_000, { coastal: false, seatPopulation: 10_000, labelPriority: 5 }),
  leaf("vale-gulltown", "Bờ Gulltown", "macro-the-vale", "Gulltown", [850, 630], [790, 575, 125, 120], 850_000, { coastal: true, terrain: "Đồng Bằng", seatPopulation: 50_000, labelPriority: 3, defaultHouse: "grafton" }),
  leaf("vale-fingers", "The Fingers", "macro-the-vale", "The Drearfort", [865, 505], [805, 455, 115, 120], 450_000, { coastal: true, terrain: "Đồi Núi" }),
  leaf("vale-snakewood", "Snakewood", "macro-the-vale", "Heart's Home", [770, 515], [720, 455, 90, 100], 650_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "corbray" }),
  leaf("vale-mountains", "Dãy Núi Mặt Trăng", "macro-the-vale", "Cổng Máu", [675, 560], [625, 485, 85, 145], 700_000, { terrain: "Hẻm Núi" }),
  leaf("vale-sisters", "Ba Chị Em", "macro-the-vale", "Sisterton", [900, 450], [860, 420, 80, 65], 450_000, { coastal: true, island: true, defaultHouse: "sunderland" }),

  // Riverlands
  leaf("the-riverlands", "Đất Riverrun", "macro-riverlands", "Riverrun", [480, 610], [420, 565, 120, 110], 750_000, { seatPopulation: 20_000, labelPriority: 5 }),
  leaf("riverlands-twins", "Green Fork và Song Thành", "macro-riverlands", "The Twins", [440, 500], [365, 465, 125, 95], 650_000, { defaultHouse: "frey" }),
  leaf("riverlands-seagard", "Bờ Seagard", "macro-riverlands", "Seagard", [365, 535], [315, 500, 90, 120], 600_000, { coastal: true, defaultHouse: "mallister" }),
  leaf("riverlands-trident", "Tam Xoa", "macro-riverlands", "Lord Harroway's Town", [575, 615], [520, 530, 120, 115], 900_000),
  leaf("riverlands-gods-eye", "Gods Eye", "macro-riverlands", "Harrenhal", [550, 680], [500, 630, 115, 120], 750_000, { defaultHouse: "whent" }),
  leaf("riverlands-maidenpool", "Bờ Maidenpool", "macro-riverlands", "Maidenpool", [635, 650], [610, 585, 75, 120], 700_000, { coastal: true, defaultHouse: "mooton" }),
  leaf("riverlands-blackwood", "Blackwood Vale", "macro-riverlands", "Raventree Hall", [420, 670], [350, 600, 100, 120], 600_000, { terrain: "Rừng Rậm", defaultHouse: "blackwood" }),
  leaf("riverlands-bracken", "Đất Bracken", "macro-riverlands", "Stone Hedge", [475, 705], [440, 675, 90, 95], 550_000, { terrain: "Đồng Bằng", defaultHouse: "bracken" }),

  // Westerlands
  leaf("the-westerlands", "Casterly Rock và Lannisport", "macro-westerlands", "Casterly Rock", [275, 690], [210, 640, 115, 130], 1_100_000, { coastal: true, seatPopulation: 50_000, labelPriority: 5 }),
  leaf("westerlands-golden-tooth", "Golden Tooth", "macro-westerlands", "Golden Tooth", [330, 630], [300, 570, 70, 110], 700_000, { terrain: "Hẻm Núi", defaultHouse: "lefford" }),
  leaf("westerlands-castamere", "Đồi Castamere", "macro-westerlands", "Castamere", [260, 605], [220, 545, 90, 105], 700_000),
  leaf("westerlands-crakehall", "Crakehall", "macro-westerlands", "Crakehall", [230, 785], [180, 730, 105, 90], 900_000, { coastal: true, defaultHouse: "crakehall" }),
  leaf("westerlands-fair-isle", "Fair Isle", "macro-westerlands", "Faircastle", [165, 665], [135, 625, 65, 85], 500_000, { coastal: true, island: true, defaultHouse: "farman" }),
  leaf("westerlands-north-coast", "Bờ Tây Bắc", "macro-westerlands", "The Crag", [190, 590], [155, 500, 85, 140], 1_100_000, { coastal: true, defaultHouse: "westerling" }),

  // Crownlands
  leaf("the-crownlands", "Vương Đô và Nước Đen", "macro-crownlands", "King's Landing", [690, 770], [625, 730, 120, 100], 650_000, { coastal: true, seatPopulation: 500_000, seatHiddenEras: ["aegon-conquest", "long-night"], labelPriority: 5 }),
  leaf("crownlands-duskendale", "Duskendale", "macro-crownlands", "Duskendale", [735, 700], [680, 665, 105, 75], 350_000, { coastal: true, defaultHouse: "rykker" }),
  leaf("crownlands-crackclaw", "Crackclaw Point", "macro-crownlands", "Dyre Den", [790, 670], [760, 625, 95, 100], 250_000, { coastal: true, terrain: "Đồi Núi", defaultHouse: "celtigar" }),
  leaf("crownlands-dragonstone", "Dragonstone", "macro-crownlands", "Dragonstone", [835, 750], [805, 720, 65, 75], 250_000, { coastal: true, island: true, terrain: "Đồi Núi" }),
  leaf("crownlands-driftmark", "Driftmark và Claw Isle", "macro-crownlands", "High Tide", [790, 770], [755, 735, 70, 75], 250_000, { coastal: true, island: true, defaultHouse: "velaryon" }),
  leaf("crownlands-kingswood", "Kingswood", "macro-crownlands", "Hayford", [650, 825], [590, 790, 105, 85], 250_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "stokeworth" }),

  // Reach
  leaf("the-reach", "Highgarden và Hạ Mander", "macro-reach", "Highgarden", [390, 965], [325, 910, 125, 120], 1_900_000, { coastal: false, seatPopulation: 80_000, labelPriority: 5 }),
  leaf("reach-oldtown", "Oldtown và Honeywine", "macro-reach", "Oldtown", [250, 1120], [195, 1050, 120, 125], 1_800_000, { coastal: true, seatPopulation: 500_000, labelPriority: 4 }),
  leaf("reach-arbor", "The Arbor", "macro-reach", "Ryamsport", [145, 1200], [105, 1145, 95, 115], 800_000, { coastal: true, island: true, defaultHouse: "redwyne" }),
  leaf("reach-shield-islands", "Shield Islands", "macro-reach", "Lord Hewett's Town", [145, 1010], [105, 955, 80, 100], 600_000, { coastal: true, island: true }),
  leaf("reach-bitterbridge", "Bitterbridge", "macro-reach", "Bitterbridge", [440, 835], [375, 790, 115, 100], 1_300_000, { defaultHouse: "caswell" }),
  leaf("reach-tumbleton", "Tumbleton", "macro-reach", "Tumbleton", [495, 910], [445, 850, 105, 115], 1_200_000),
  leaf("reach-horn-hill", "Horn Hill và Biên Dorne", "macro-reach", "Horn Hill", [330, 1070], [280, 1010, 105, 125], 1_300_000, { terrain: "Đồi Núi", defaultHouse: "tarly" }),
  leaf("reach-western", "Tây Reach", "macro-reach", "Goldengrove", [260, 900], [175, 820, 150, 160], 1_600_000, { coastal: true, defaultHouse: "rowan" }),
  leaf("reach-upper-mander", "Thượng Mander", "macro-reach", "Ashford", [520, 1030], [450, 980, 135, 130], 1_500_000),

  // Stormlands
  leaf("the-stormlands", "Storm's End", "macro-stormlands", "Storm's End", [712, 1000], [665, 945, 105, 115], 500_000, { coastal: true, seatPopulation: 15_000, labelPriority: 5 }),
  leaf("stormlands-rainwood", "Rainwood", "macro-stormlands", "Griffin's Roost", [760, 945], [720, 870, 105, 120], 450_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "connington" }),
  leaf("stormlands-cape-wrath", "Cape Wrath", "macro-stormlands", "Weeping Town", [805, 1030], [755, 990, 105, 110], 400_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "wylde" }),
  leaf("stormlands-tarth", "Tarth", "macro-stormlands", "Evenfall Hall", [850, 910], [820, 865, 65, 95], 250_000, { coastal: true, island: true, defaultHouse: "tarth" }),
  leaf("stormlands-dornish-marches", "Biên Địa Dorne", "macro-stormlands", "Blackhaven", [615, 1050], [565, 990, 110, 120], 500_000, { terrain: "Đồi Núi", defaultHouse: "dondarrion" }),
  leaf("stormlands-kingswood", "Đông Kingswood", "macro-stormlands", "Parchments", [675, 875], [615, 830, 105, 105], 400_000, { coastal: true, terrain: "Rừng Rậm", defaultHouse: "penrose" }),

  // Dorne
  leaf("dorne", "Sunspear", "macro-dorne", "Sunspear", [545, 1290], [500, 1240, 105, 105], 400_000, { coastal: true, seatPopulation: 30_000, labelPriority: 5 }),
  leaf("dorne-greenblood", "Greenblood", "macro-dorne", "Planky Town", [635, 1325], [575, 1280, 120, 95], 300_000, { coastal: true, terrain: "Sông/Lối Vượt Sông" }),
  leaf("dorne-yronwood", "Yronwood", "macro-dorne", "Yronwood", [500, 1195], [450, 1140, 105, 110], 250_000, { terrain: "Hẻm Núi", defaultHouse: "yronwood" }),
  leaf("dorne-boneway", "Boneway", "macro-dorne", "Wyl", [730, 1160], [675, 1105, 115, 120], 180_000, { terrain: "Hẻm Núi", defaultHouse: "wyl" }),
  leaf("dorne-princes-pass", "Prince's Pass", "macro-dorne", "Skyreach", [430, 1200], [375, 1140, 105, 120], 180_000, { terrain: "Hẻm Núi", defaultHouse: "fowler" }),
  leaf("dorne-red-mountains", "Dãy Núi Đỏ", "macro-dorne", "Kingsgrave", [560, 1140], [515, 1090, 105, 115], 180_000, { terrain: "Đồi Núi", defaultHouse: "manwoody" }),
  leaf("dorne-starfall", "Torrentine và Starfall", "macro-dorne", "Starfall", [320, 1280], [255, 1215, 135, 125], 180_000, { coastal: true, terrain: "Sông/Lối Vượt Sông", defaultHouse: "dayne" }),
  leaf("dorne-hellholt", "Sa Mạc Hellholt", "macro-dorne", "Hellholt", [430, 1360], [350, 1320, 145, 105], 130_000, { terrain: "Sa Mạc", defaultHouse: "uller" }),

  // Ngoài Tường Thành
  leaf("beyond-haunted-forest", "Rừng Ma Ám", "macro-beyond-wall", "Craster's Keep", [500, 55], [370, 25, 230, 70], 170_000, { terrain: "Rừng Rậm", realmId: "beyond-wall", labelPriority: 3 }),
  leaf("beyond-frostfangs", "Frostfangs", "macro-beyond-wall", "Thenn Valley", [300, 45], [180, 5, 210, 80], 120_000, { terrain: "Hẻm Núi", realmId: "beyond-wall" }),
  leaf("beyond-hardhome", "Bờ Hardhome", "macro-beyond-wall", "Hardhome", [735, 60], [600, 20, 190, 75], 130_000, { coastal: true, realmId: "beyond-wall" }),
  leaf("beyond-lands-always-winter", "Vùng Đất Luôn Đông", "macro-beyond-wall", "Heart of Winter", [500, 8], [360, 0, 290, 35], 20_000, { terrain: "Tuyết/Băng Giá", defaultHouse: "others", realmId: "beyond-wall", labelPriority: 2 }),
  leaf("beyond-ice-bay", "Vịnh Băng", "macro-beyond-wall", "Frozen Shore", [145, 65], [70, 20, 125, 75], 60_000, { coastal: true, realmId: "beyond-wall" }),
];

const ESSOS_REGIONS: MapRegion[] = [
  // Chín Thành Phố Tự Do
  leaf("essos-braavos", "Braavos", "macro-free-cities", "Braavos", [1240, 260], [1160, 170, 145, 150], 1_200_000, { coastal: true, island: true, defaultHouse: "braavos", seatPopulation: 500_000, labelPriority: 5, description: "Thành bang đầm phá của Titan, Ngân Hàng Sắt và truyền thống chống nô lệ." }),
  leaf("essos-pentos", "Pentos", "macro-free-cities", "Pentos", [1320, 535], [1240, 455, 160, 155], 900_000, { coastal: true, seatPopulation: 200_000, labelPriority: 4 }),
  leaf("essos-lorath", "Lorath", "macro-free-cities", "Lorath", [1510, 215], [1440, 145, 135, 130], 260_000, { coastal: true, island: true, labelPriority: 3 }),
  leaf("essos-norvos", "Norvos", "macro-free-cities", "Norvos", [1600, 435], [1515, 330, 165, 185], 620_000, { terrain: "Đồi Núi", labelPriority: 4 }),
  leaf("essos-qohor", "Qohor", "macro-free-cities", "Qohor", [1800, 480], [1690, 365, 175, 190], 580_000, { terrain: "Rừng Rậm", labelPriority: 4 }),
  leaf("essos-volantis", "Volantis", "macro-free-cities", "Volantis", [1660, 920], [1570, 820, 180, 170], 1_500_000, { coastal: true, seatPopulation: 800_000, labelPriority: 5 }),
  leaf("essos-myr", "Myr", "macro-free-cities", "Myr", [1360, 880], [1280, 785, 155, 150], 850_000, { coastal: true, labelPriority: 4 }),
  leaf("essos-tyrosh", "Tyrosh", "macro-free-cities", "Tyrosh", [1160, 1020], [1090, 945, 130, 130], 700_000, { coastal: true, island: true, labelPriority: 4 }),
  leaf("essos-lys", "Lys", "macro-free-cities", "Lys", [1390, 1110], [1320, 1040, 135, 125], 650_000, { coastal: true, island: true, labelPriority: 4 }),

  // Đất tranh chấp / Stepstones
  leaf("essos-disputed-lands", "Đất Tranh Chấp", "macro-disputed-lands", "The Flatlands", [1460, 970], [1380, 900, 180, 140], 420_000, { defaultHouse: "mercenary", labelPriority: 3 }),
  leaf("essos-stepstones", "Stepstones", "macro-disputed-lands", "Bloodstone", [1090, 1230], [990, 1120, 220, 190], 180_000, { coastal: true, island: true, defaultHouse: "mercenary", terrain: "Đồi Núi", labelPriority: 3 }),

  // Rhoyne
  leaf("essos-upper-rhoyne", "Thượng Rhoyne", "macro-rhoyne", "Ghoyan Drohe", [1770, 570], [1660, 500, 185, 180], 480_000, { terrain: "Sông/Lối Vượt Sông", labelPriority: 3 }),
  leaf("essos-sorrows", "The Sorrows", "macro-rhoyne", "Chroyane", [1810, 720], [1690, 650, 200, 165], 140_000, { terrain: "Đầm Lầy", defaultHouse: "", labelPriority: 3 }),
  leaf("essos-lower-rhoyne", "Hạ Rhoyne", "macro-rhoyne", "Selhorys", [1740, 845], [1630, 785, 210, 170], 720_000, { terrain: "Sông/Lối Vượt Sông", labelPriority: 4 }),

  // Biển Dothraki
  leaf("essos-western-dothraki-sea", "Tây Biển Dothraki", "macro-dothraki-sea", "Vaes Khewo", [2000, 580], [1870, 450, 240, 230], 620_000, { defaultHouse: "dothraki", labelPriority: 3 }),
  leaf("essos-vaes-dothrak", "Vaes Dothrak", "macro-dothraki-sea", "Vaes Dothrak", [2250, 390], [2130, 280, 230, 210], 420_000, { defaultHouse: "dothraki", seatPopulation: 80_000, labelPriority: 5 }),
  leaf("essos-central-dothraki-sea", "Trung Tâm Biển Dothraki", "macro-dothraki-sea", "Mother of Mountains", [2270, 640], [2100, 500, 290, 240], 560_000, { defaultHouse: "dothraki", labelPriority: 3 }),
  leaf("essos-eastern-dothraki-sea", "Đông Biển Dothraki", "macro-dothraki-sea", "Vaes Jini", [2470, 620], [2360, 470, 220, 240], 440_000, { defaultHouse: "dothraki", labelPriority: 3 }),
  leaf("essos-sarnor", "Sarnor Hoang Phế", "macro-dothraki-sea", "Saath", [2090, 285], [1910, 210, 230, 190], 280_000, { defaultHouse: "dothraki", terrain: "Đồng Bằng", labelPriority: 3 }),

  // Ghiscar / Vịnh Nô Lệ
  leaf("essos-astapor", "Astapor", "macro-ghiscar", "Astapor", [2110, 1280], [2015, 1200, 160, 145], 620_000, { coastal: true, defaultHouse: "ghiscar", seatPopulation: 180_000, labelPriority: 4 }),
  leaf("essos-yunkai", "Yunkai", "macro-ghiscar", "Yunkai", [2190, 1190], [2115, 1110, 150, 140], 560_000, { coastal: true, defaultHouse: "ghiscar", seatPopulation: 140_000, labelPriority: 4 }),
  leaf("essos-meereen", "Meereen", "macro-ghiscar", "Meereen", [2320, 1080], [2230, 990, 170, 160], 900_000, { coastal: true, defaultHouse: "ghiscar", seatPopulation: 300_000, labelPriority: 5 }),
  leaf("essos-new-ghis", "New Ghis", "macro-ghiscar", "New Ghis", [2290, 1390], [2200, 1320, 170, 110], 480_000, { coastal: true, island: true, defaultHouse: "ghiscar", labelPriority: 3 }),
  leaf("essos-lhazar", "Lhazar", "macro-ghiscar", "Lhazosh", [2390, 970], [2290, 880, 195, 145], 640_000, { defaultHouse: "", terrain: "Đồng Bằng", cultureIds: ["lhazareen"], labelPriority: 3 }),
  leaf("essos-ghiscari-hinterland", "Nội Địa Ghiscar", "macro-ghiscar", "Old Ghis", [2000, 1380], [1870, 1280, 230, 150], 350_000, { coastal: true, defaultHouse: "ghiscar", terrain: "Sa Mạc" }),

  // Qarth / Red Waste
  leaf("essos-red-waste", "Hoang Mạc Đỏ", "macro-qarth", "Vaes Tolorro", [2580, 1020], [2460, 890, 250, 230], 90_000, { defaultHouse: "", terrain: "Sa Mạc", labelPriority: 3 }),
  leaf("essos-qarth", "Qarth", "macro-qarth", "Qarth", [2790, 1180], [2690, 1080, 190, 180], 1_100_000, { coastal: true, defaultHouse: "qarth", seatPopulation: 400_000, labelPriority: 5 }),
  leaf("essos-jade-gates", "Eo Biển Ngọc", "macro-qarth", "Qarkash", [2890, 1330], [2780, 1240, 210, 160], 260_000, { coastal: true, defaultHouse: "qarth", terrain: "Đồi Núi", labelPriority: 3 }),

  // Valyria và thuộc địa sống sót
  leaf("essos-doom-valyria", "Doom of Valyria", "macro-valyria", "Valyria", [1770, 1350], [1640, 1240, 235, 190], 5_000, { coastal: true, defaultHouse: "", terrain: "Đồi Núi", labelPriority: 5, description: "Bán đảo núi lửa bị Doom xé nát, nơi biển bốc khói và những phế tích vẫn còn chết chóc." }),
  leaf("essos-mantarys", "Mantarys", "macro-valyria", "Mantarys", [1900, 1160], [1810, 1080, 165, 150], 220_000, { defaultHouse: "free-cities", terrain: "Sa Mạc", labelPriority: 3 }),
  leaf("essos-elyria", "Elyria và Tolos", "macro-valyria", "Elyria", [1950, 1370], [1870, 1290, 150, 130], 280_000, { coastal: true, island: true, defaultHouse: "free-cities", labelPriority: 3 }),

  // Viễn Đông
  leaf("essos-bone-mountains", "Bone Mountains", "macro-far-east", "Kayakayanaya", [2690, 650], [2570, 390, 210, 470], 480_000, { terrain: "Hẻm Núi", defaultHouse: "", cultureIds: ["mountain-peoples"], labelPriority: 4 }),
  leaf("essos-yi-ti-west", "Tây Yi Ti", "macro-far-east", "Yin", [2910, 720], [2800, 590, 220, 220], 2_100_000, { coastal: true, defaultHouse: "yi-ti", cultureIds: ["yi-tish"], labelPriority: 4 }),
  leaf("essos-yi-ti-central", "Trung Yi Ti", "macro-far-east", "Si Qo", [3120, 650], [3010, 500, 220, 250], 2_600_000, { defaultHouse: "yi-ti", cultureIds: ["yi-tish"], labelPriority: 5 }),
  leaf("essos-yi-ti-east", "Đông Yi Ti", "macro-far-east", "Jinqi", [3320, 720], [3230, 560, 210, 250], 1_800_000, { coastal: true, defaultHouse: "yi-ti", cultureIds: ["yi-tish"], labelPriority: 4 }),
  leaf("essos-jogos-nhai", "Đồng Bằng Jogos Nhai", "macro-far-east", "Shrinking Sea", [3050, 310], [2800, 190, 390, 250], 700_000, { defaultHouse: "jogos-nhai", cultureIds: ["jogos-nhai"], labelPriority: 4 }),
  leaf("essos-mossovy", "Mossovy", "macro-far-east", "Eastern Forest", [3400, 300], [3260, 110, 260, 320], 350_000, { terrain: "Rừng Rậm", defaultHouse: "", cultureIds: ["mossovite"], labelPriority: 3 }),
  leaf("essos-thousand-islands", "Thousand Islands", "macro-far-east", "Nefer", [3500, 650], [3420, 490, 170, 320], 240_000, { coastal: true, island: true, defaultHouse: "", cultureIds: ["islander"], labelPriority: 3 }),
  leaf("essos-asshai", "Asshai-by-the-Shadow", "macro-far-east", "Asshai", [3330, 1080], [3210, 970, 230, 180], 500_000, { coastal: true, defaultHouse: "asshai", cultureIds: ["shadowmen"], terrain: "Sa Mạc", labelPriority: 5 }),
  leaf("essos-shadow-lands", "Shadow Lands", "macro-far-east", "Stygai", [3480, 1000], [3390, 820, 190, 310], 80_000, { defaultHouse: "asshai", cultureIds: ["shadowmen"], terrain: "Đồi Núi", labelPriority: 3 }),
  leaf("essos-grey-waste", "Grey Waste", "macro-far-east", "Five Forts", [3260, 430], [3170, 300, 180, 220], 140_000, { defaultHouse: "yi-ti", terrain: "Sa Mạc", cultureIds: ["yi-tish"], labelPriority: 3 }),
];

const OTHER_REGIONS: MapRegion[] = [
  // Ibben
  leaf("ibben-ib", "Ib", "macro-ibben", "Port of Ibben", [2250, 120], [2160, 45, 175, 150], 520_000, { coastal: true, island: true, defaultHouse: "ibben", seatPopulation: 100_000, labelPriority: 5 }),
  leaf("ibben-ib-sar", "Ib Sar", "macro-ibben", "Ib Sar", [2420, 150], [2335, 75, 150, 135], 180_000, { coastal: true, island: true, defaultHouse: "ibben", labelPriority: 3 }),

  // Summer Isles
  leaf("summer-walano", "Walano", "macro-summer-isles", "Lotus Port", [820, 1700], [690, 1600, 235, 190], 420_000, { coastal: true, island: true, defaultHouse: "summer-isles", labelPriority: 4 }),
  leaf("summer-jhala", "Jhala", "macro-summer-isles", "Tall Trees Town", [1050, 1800], [925, 1690, 240, 210], 380_000, { coastal: true, island: true, defaultHouse: "summer-isles", terrain: "Rừng Rậm", labelPriority: 4 }),
  leaf("summer-omboru", "Omboru", "macro-summer-isles", "Omboru", [1260, 1730], [1165, 1640, 190, 170], 260_000, { coastal: true, island: true, defaultHouse: "summer-isles", labelPriority: 3 }),
  leaf("summer-koj", "Koj", "macro-summer-isles", "Koj", [1140, 1960], [1030, 1880, 210, 135], 180_000, { coastal: true, island: true, defaultHouse: "summer-isles", labelPriority: 3 }),

  // Naath lies between the Summer Isles and the north-western coast of Sothoryos.
  leaf("naath", "Naath", "macro-sothoryos-coast", "Butterfly Vale", [1430, 1730], [1360, 1640, 135, 175], 160_000, { coastal: true, island: true, defaultHouse: "naath", cultureIds: ["naathi"], realmId: "naath", labelPriority: 4 }),

  // Sothoryos
  leaf("sothoryos-basilisk-isles", "Basilisk Isles", "macro-sothoryos-coast", "Gogossos", [1620, 1550], [1480, 1460, 260, 180], 110_000, { coastal: true, island: true, defaultHouse: "pirates", labelPriority: 4 }),
  leaf("sothoryos-zamettar", "Zamettar", "macro-sothoryos-coast", "Zamettar", [1880, 1640], [1740, 1500, 270, 230], 90_000, { coastal: true, defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 3 }),
  leaf("sothoryos-yeen", "Yeen", "macro-sothoryos-coast", "Yeen", [2180, 1700], [2010, 1510, 340, 300], 20_000, { coastal: true, defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 4 }),
  leaf("sothoryos-green-hell", "Green Hell", "macro-sothoryos-interior", "Uncharted Basin", [2200, 1960], [1760, 1810, 780, 360], 15_000, { defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 3 }),
  leaf("sothoryos-south", "Nam Sothoryos", "macro-sothoryos-interior", "Uncharted South", [2650, 2070], [2500, 1870, 330, 320], 5_000, { coastal: true, defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 2 }),

  // Ulthos
  leaf("ulthos-west-coast", "Bờ Tây Ulthos", "macro-ulthos", "Unknown Harbour", [3100, 1680], [2950, 1450, 300, 430], 20_000, { coastal: true, defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 3 }),
  leaf("ulthos-interior", "Nội Địa Ulthos", "macro-ulthos", "Unmapped Interior", [3390, 1920], [3240, 1580, 340, 560], 5_000, { coastal: true, defaultHouse: "", terrain: "Rừng Rậm", labelPriority: 2 }),
];

/**
 * Canonical gameplay ids shared by character origins, factions, events and
 * geography. Prefixed draft ids remain resolvable so experimental saves and
 * content made during the world-map expansion do not silently break.
 */
export const REGION_ID_ALIASES: Record<string, string> = {
  "essos-braavos": "braavos", "essos-pentos": "pentos", "essos-lorath": "lorath",
  "essos-norvos": "norvos", "essos-qohor": "qohor", "essos-volantis": "volantis",
  "essos-myr": "myr", "essos-tyrosh": "tyrosh", "essos-lys": "lys",
  "essos-central-dothraki-sea": "dothraki-sea", "essos-vaes-dothrak": "vaes-dothrak",
  "essos-astapor": "astapor", "essos-yunkai": "yunkai", "essos-meereen": "meereen",
  "essos-new-ghis": "new-ghis", "essos-lhazar": "lhazar", "essos-qarth": "qarth",
  "essos-doom-valyria": "valyria", "essos-yi-ti-central": "yi-ti",
  "essos-jogos-nhai": "jogos-nhai", "essos-asshai": "asshai",
  "essos-shadow-lands": "shadow-lands",
  "essos-sarnor": "sarnor", "ibben-ib": "ibben",
  "sothoryos-basilisk-isles": "basilisk-isles",
  "ulthos-west-coast": "ulthos-coast",
  "beyond-haunted-forest": "beyond-the-wall",
  "summer-jhala": "summer-islands",
  "gogossos": "basilisk-isles",
  "sothoryos-interior": "sothoryos-green-hell",
  "rhoyne": "essos-lower-rhoyne",
};

export function resolveRegionId(regionId: string): string {
  return REGION_ID_ALIASES[regionId] ?? regionId;
}

const ALL_REGIONS = [...WESTEROS_REGIONS, ...ESSOS_REGIONS, ...OTHER_REGIONS];
for (const region of ALL_REGIONS) {
  if (region.continentId === "summer-isles") region.realmId = "summer-islands";
  if (region.continentId === "ibben") region.realmId = "ibben";
  if (region.continentId === "sothoryos" && region.id !== "naath") region.realmId = "sothoryos";
  if (region.continentId === "ulthos") region.realmId = "ulthos";
  region.id = resolveRegionId(region.id);
}

function connect(aId: string, bId: string, mode: "land" | "sea"): void {
  const a = ALL_REGIONS.find((region) => region.id === resolveRegionId(aId));
  const b = ALL_REGIONS.find((region) => region.id === resolveRegionId(bId));
  if (!a || !b || a.id === b.id) return;
  const aList = mode === "land" ? a.landConnections : a.seaConnections;
  const bList = mode === "land" ? b.landConnections : b.seaConnections;
  if (!aList.includes(b.id)) aList.push(b.id);
  if (!bList.includes(a.id)) bList.push(a.id);
}

// Nối tự động các province gần nhau trong cùng macro. Đảo chỉ nối bằng biển.
for (const macro of MACRO_REGIONS) {
  const children = ALL_REGIONS.filter((region) => region.parentId === macro.id);
  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const a = children[i];
      const b = children[j];
      const distance = Math.hypot(a.seatXY[0] - b.seatXY[0], a.seatXY[1] - b.seatXY[1]);
      if (distance > 230) continue;
      connect(a.id, b.id, a.island || b.island ? "sea" : "land");
    }
  }
  // Không để một leaf bị cô lập vì hình học placeholder thưa.
  for (const child of children) {
    if (child.landConnections.length + child.seaConnections.length > 0 || children.length < 2) continue;
    const nearest = children
      .filter((candidate) => candidate.id !== child.id)
      .sort((a, b) => Math.hypot(a.seatXY[0] - child.seatXY[0], a.seatXY[1] - child.seatXY[1]) - Math.hypot(b.seatXY[0] - child.seatXY[0], b.seatXY[1] - child.seatXY[1]))[0];
    if (nearest) connect(child.id, nearest.id, child.island || nearest.island ? "sea" : "land");
  }
}

// Các hành lang qua ranh macro/lục địa. Danh sách tường minh ngăn hành quân đi
// xuyên biển chỉ vì hai trọng trấn có toạ độ gần nhau.
const LAND_CORRIDORS: [string, string][] = [
  ["north-neck", "riverlands-twins"], ["riverlands-twins", "riverlands-seagard"],
  ["riverlands-trident", "vale-mountains"], ["riverlands-maidenpool", "crownlands-duskendale"],
  ["riverlands-bracken", "westerlands-golden-tooth"], ["westerlands-crakehall", "reach-western"],
  ["riverlands-gods-eye", "the-crownlands"], ["the-crownlands", "crownlands-kingswood"],
  ["crownlands-kingswood", "stormlands-kingswood"], ["stormlands-dornish-marches", "dorne-boneway"],
  ["stormlands-dornish-marches", "reach-horn-hill"], ["reach-horn-hill", "dorne-princes-pass"],
  ["reach-upper-mander", "dorne-red-mountains"], ["beyond-haunted-forest", "the-north"],
  ["essos-pentos", "essos-norvos"], ["essos-norvos", "essos-upper-rhoyne"],
  ["essos-qohor", "essos-western-dothraki-sea"], ["essos-lower-rhoyne", "essos-volantis"],
  ["essos-myr", "essos-disputed-lands"], ["essos-disputed-lands", "essos-lower-rhoyne"],
  ["essos-central-dothraki-sea", "essos-lhazar"], ["essos-lhazar", "essos-meereen"],
  ["essos-eastern-dothraki-sea", "essos-red-waste"], ["essos-red-waste", "essos-qarth"],
  ["essos-ghiscari-hinterland", "essos-mantarys"], ["essos-red-waste", "essos-bone-mountains"],
  ["essos-bone-mountains", "essos-yi-ti-west"], ["essos-yi-ti-west", "essos-yi-ti-central"],
  ["essos-yi-ti-central", "essos-yi-ti-east"], ["essos-yi-ti-central", "essos-jogos-nhai"],
  ["essos-yi-ti-east", "essos-grey-waste"], ["essos-grey-waste", "essos-mossovy"],
  ["essos-yi-ti-east", "essos-asshai"], ["essos-asshai", "essos-shadow-lands"],
  ["sothoryos-zamettar", "sothoryos-yeen"], ["sothoryos-yeen", "sothoryos-green-hell"],
  ["sothoryos-green-hell", "sothoryos-south"], ["ulthos-west-coast", "ulthos-interior"],
];

const SEA_CORRIDORS: [string, string][] = [
  ["the-iron-islands", "westerlands-north-coast"], ["iron-harlaw", "north-stony-shore"],
  ["vale-sisters", "essos-braavos"], ["crownlands-dragonstone", "essos-braavos"],
  ["crownlands-dragonstone", "essos-pentos"], ["the-crownlands", "essos-pentos"],
  ["stormlands-cape-wrath", "essos-stepstones"], ["dorne-greenblood", "essos-stepstones"],
  ["reach-oldtown", "summer-walano"], ["reach-arbor", "summer-walano"],
  ["essos-tyrosh", "essos-stepstones"], ["essos-lys", "essos-stepstones"],
  ["essos-myr", "essos-tyrosh"], ["essos-lys", "essos-disputed-lands"],
  ["essos-volantis", "essos-doom-valyria"], ["essos-doom-valyria", "essos-elyria"],
  ["essos-astapor", "essos-qarth"], ["essos-qarth", "essos-yi-ti-west"],
  ["essos-yi-ti-east", "essos-asshai"], ["essos-thousand-islands", "essos-mossovy"],
  ["ibben-ib", "essos-braavos"], ["ibben-ib", "ibben-ib-sar"],
  ["summer-omboru", "sothoryos-basilisk-isles"], ["sothoryos-basilisk-isles", "essos-new-ghis"],
  ["sothoryos-yeen", "ulthos-west-coast"],
  ["summer-omboru", "naath"], ["naath", "sothoryos-basilisk-isles"],
];

for (const [a, b] of LAND_CORRIDORS) connect(a, b, "land");
for (const [a, b] of SEA_CORRIDORS) connect(a, b, "sea");
for (const region of ALL_REGIONS) region.neighbors = [...new Set([...region.landConnections, ...region.seaConnections])];

export const REGIONS: MapRegion[] = ALL_REGIONS;
const REGIONS_BY_CANONICAL_ID: Record<string, MapRegion> = Object.fromEntries(REGIONS.map((region) => [region.id, region]));
/** Alias-aware lookup whose enumerable keys remain canonical (no duplicate market/army nodes). */
export const REGIONS_BY_ID: Record<string, MapRegion> = new Proxy(REGIONS_BY_CANONICAL_ID, {
  get(target, property, receiver) {
    return typeof property === "string"
      ? target[resolveRegionId(property)]
      : Reflect.get(target, property, receiver);
  },
  has(target, property) {
    return typeof property === "string"
      ? resolveRegionId(property) in target
      : Reflect.has(target, property);
  },
});

function normalizeLocation(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function regionsForContinent(continentId: ContinentId | string): MapRegion[] {
  return REGIONS.filter((region) => region.continentId === continentId);
}

/** Tra bằng region id, tên province hoặc tên thủ phủ/địa danh bắt đầu. */
export function regionForLocation(location: string): MapRegion | null {
  if (!location) return null;
  const direct = REGIONS_BY_ID[resolveRegionId(location)];
  if (direct) return direct;
  const wanted = normalizeLocation(location);
  return REGIONS.find((region) =>
    normalizeLocation(region.id) === wanted
    || normalizeLocation(region.name) === wanted
    || normalizeLocation(region.seat) === wanted
  ) ?? null;
}

export function macroForRegion(regionOrId: MapRegion | string): MacroRegion | null {
  const region = typeof regionOrId === "string" ? REGIONS_BY_ID[resolveRegionId(regionOrId)] : regionOrId;
  return region ? MACRO_REGIONS_BY_ID[region.parentId] ?? null : null;
}

export function continentForRegion(regionOrId: MapRegion | string): ContinentMetadata | null {
  const region = typeof regionOrId === "string" ? REGIONS_BY_ID[resolveRegionId(regionOrId)] : regionOrId;
  return region ? CONTINENTS_BY_ID[region.continentId] ?? null : null;
}

export function regionsForMacro(macroId: string): MapRegion[] {
  return REGIONS.filter((region) => region.parentId === macroId);
}

export function regionsForRealm(realmId: string): MapRegion[] {
  const wanted = resolveRegionId(realmId);
  return REGIONS.filter((region) => regionMatchesId(region, wanted));
}

/** Match a leaf against exact ids and broader realm/macro/continent scopes. */
export function regionMatchesId(regionOrId: MapRegion | string, candidateId: string): boolean {
  const region = typeof regionOrId === "string" ? REGIONS_BY_ID[resolveRegionId(regionOrId)] : regionOrId;
  if (!region) return false;
  const wanted = resolveRegionId(candidateId);
  const macro = MACRO_REGIONS_BY_ID[region.parentId];
  return [region.id, region.realmId, region.parentId, region.continentId, macro?.legacyRegionId]
    .filter((id): id is string => !!id)
    .some((id) => resolveRegionId(id) === wanted)
    || (wanted === "summer-islands" && region.continentId === "summer-isles");
}

export function areLandConnected(fromId: string, toId: string): boolean {
  const from = resolveRegionId(fromId);
  const to = resolveRegionId(toId);
  return REGIONS_BY_ID[from]?.landConnections.includes(to) ?? false;
}

export function areSeaConnected(fromId: string, toId: string): boolean {
  const from = resolveRegionId(fromId);
  const to = resolveRegionId(toId);
  return REGIONS_BY_ID[from]?.seaConnections.includes(to) ?? false;
}

const DEFAULT_298: Record<string, string> = Object.fromEntries(REGIONS.map((region) => [region.id, region.defaultHouse]));

/**
 * Bảng chủ quyền chi tiết theo leaf province cho từng thời kỳ lịch sử.
 *
 * Key = leaf province id, value = houseId.
 * DEFAULT_298 chứa đúng vassal house tại 298 AC (vd: Karstark ở Karhold, Tarly ở Horn Hill).
 * Mỗi bảng dưới đây chỉ liệt kê các leaf THỰC SỰ KHÁC so với 298 AC baseline.
 */

/** Thời kỳ Đêm Trường (~8000 trước AC) — các vương quốc cổ đại, chưa có hệ thống phong kiến */
const CONTROL_ANCIENT: Record<string, string> = {
  // Bắc — Nhà Stark (Vua Mùa Đông) — trực tiếp cai trị, chưa có hệ thống chư hầu
  "the-north": "stark", "north-wolfswood": "stark", "north-barrowlands": "stark",
  "north-white-knife": "stark", "north-dreadfort": "stark", "north-karhold": "stark",
  "north-last-hearth": "stark", "north-neck": "stark", "north-bear-island": "stark",
  "north-skagos": "stark", "north-stony-shore": "stark",
  // Quần Đảo Sắt — Nhà Greyiron (Vua Sắt trước Andal)
  "the-iron-islands": "greyiron", "iron-harlaw": "greyiron", "iron-great-wyk": "greyiron",
  "iron-old-wyk": "greyiron", "iron-orkmont": "greyiron", "iron-saltcliffe": "greyiron",
  "iron-blacktyde": "greyiron",
  // Thung Lũng — Nhà Royce (Vua Đồng, trước Andal)
  "the-vale": "royce", "vale-gulltown": "royce", "vale-fingers": "royce",
  "vale-snakewood": "royce", "vale-mountains": "royce", "vale-sisters": "royce",
  // Vùng Sông — Nhà Mudd (Vua Sông và Đồi, trước Andal/Storm King)
  "the-riverlands": "mudd", "riverlands-twins": "mudd", "riverlands-seagard": "mudd",
  "riverlands-trident": "mudd", "riverlands-gods-eye": "mudd", "riverlands-maidenpool": "mudd",
  "riverlands-blackwood": "mudd", "riverlands-bracken": "mudd",
  // Vùng Tây — Nhà Casterly (trước Lannister)
  "the-westerlands": "casterly", "westerlands-golden-tooth": "casterly",
  "westerlands-castamere": "casterly", "westerlands-crakehall": "casterly",
  "westerlands-fair-isle": "casterly", "westerlands-north-coast": "casterly",
  // Khu vực trung tâm — Nhà Darklyn (chưa có King's Landing, chưa có Dragonstone)
  "the-crownlands": "darklyn", "crownlands-duskendale": "darklyn",
  "crownlands-crackclaw": "darklyn", "crownlands-dragonstone": "",
  "crownlands-driftmark": "", "crownlands-kingswood": "darklyn",
  // Reach — Nhà Gardener (Vua Reach)
  "the-reach": "gardener", "reach-oldtown": "gardener", "reach-arbor": "gardener",
  "reach-shield-islands": "gardener", "reach-bitterbridge": "gardener",
  "reach-tumbleton": "gardener", "reach-horn-hill": "gardener",
  "reach-western": "gardener", "reach-upper-mander": "gardener",
  // Vùng Bão — Nhà Durrandon (Vua Bão)
  "the-stormlands": "durrandon", "stormlands-rainwood": "durrandon",
  "stormlands-cape-wrath": "durrandon", "stormlands-tarth": "durrandon",
  "stormlands-dornish-marches": "durrandon", "stormlands-kingswood": "durrandon",
  // Dorne — Nhà Yronwood (quyền lực nhất trước Rhoynar đổ bộ ~700 trước AC)
  "dorne": "yronwood", "dorne-greenblood": "yronwood", "dorne-yronwood": "yronwood",
  "dorne-boneway": "yronwood", "dorne-princes-pass": "yronwood",
  "dorne-red-mountains": "yronwood", "dorne-starfall": "yronwood", "dorne-hellholt": "yronwood",
  // Ngoài Tường — không chính quyền
  "beyond-the-wall": "", "beyond-frostfangs": "", "beyond-hardhome": "",
  "beyond-lands-always-winter": "others", "beyond-ice-bay": "",
};

/**
 * Bảy Vương Quốc trước Chinh Phục (~2 BC) — thế giới khi Aegon đổ bộ.
 * 
 * So với Đêm Trường: Andal đã xâm lược, nhiều nhà cổ bị thay thế.
 * Hoare chinh phục cả Quần Đảo Sắt + Vùng Sông.
 * Arryn thay Royce, Lannister thay Casterly, Martell thay Yronwood (sau Nymeria).
 * Targaryen ở Dragonstone, Velaryon ở Driftmark (sau Doom of Valyria).
 */
const CONTROL_PRE_CONQUEST: Record<string, string> = {
  // Bắc — Nhà Stark (Vua Phương Bắc) — vassal vẫn phục vụ nhưng dưới vua chứ không phải lãnh chúa
  "the-north": "stark", "north-wolfswood": "stark", "north-barrowlands": "stark",
  "north-white-knife": "stark", "north-dreadfort": "stark", "north-karhold": "stark",
  "north-last-hearth": "stark", "north-neck": "stark", "north-bear-island": "stark",
  "north-skagos": "stark", "north-stony-shore": "stark",
  // Quần Đảo Sắt — Nhà HOARE (Vua Sắt) — KHÔNG phải Greyjoy
  "the-iron-islands": "hoare", "iron-harlaw": "hoare", "iron-great-wyk": "hoare",
  "iron-old-wyk": "hoare", "iron-orkmont": "hoare", "iron-saltcliffe": "hoare",
  "iron-blacktyde": "hoare",
  // Vùng Sông — Nhà HOARE cai trị (chinh phục từ Storm Kings) — KHÔNG phải Tully
  "the-riverlands": "hoare", "riverlands-twins": "hoare", "riverlands-seagard": "hoare",
  "riverlands-trident": "hoare", "riverlands-gods-eye": "hoare", // Harrenhal đang xây / vừa xong
  "riverlands-maidenpool": "hoare", "riverlands-blackwood": "hoare", "riverlands-bracken": "hoare",
  // Thung Lũng — Nhà ARRYN (Vua Núi và Thung Lũng, thay Royce sau Andal)
  "the-vale": "arryn", "vale-gulltown": "arryn", "vale-fingers": "arryn",
  "vale-snakewood": "arryn", "vale-mountains": "arryn", "vale-sisters": "arryn",
  // Vùng Tây — Nhà LANNISTER (Vua Tảng Đá, thay Casterly từ lâu)
  // default 298 đã là lannister cho macro — chỉ override leaf nếu cần
  "westerlands-golden-tooth": "lannister", "westerlands-castamere": "lannister",
  "westerlands-crakehall": "lannister", "westerlands-fair-isle": "lannister",
  "westerlands-north-coast": "lannister",
  // Khu vực trung tâm — Darklyn kiểm soát, Targaryen ở Dragonstone
  "the-crownlands": "darklyn", "crownlands-duskendale": "darklyn",
  "crownlands-crackclaw": "darklyn", "crownlands-dragonstone": "targaryen",
  "crownlands-driftmark": "velaryon", "crownlands-kingswood": "darklyn",
  // Reach — Nhà GARDENER (Vua Reach) — KHÔNG phải Tyrell
  "the-reach": "gardener", "reach-oldtown": "gardener", "reach-arbor": "gardener",
  "reach-shield-islands": "gardener", "reach-bitterbridge": "gardener",
  "reach-tumbleton": "gardener", "reach-horn-hill": "gardener",
  "reach-western": "gardener", "reach-upper-mander": "gardener",
  // Vùng Bão — Nhà DURRANDON (Vua Bão) — KHÔNG phải Baratheon
  "the-stormlands": "durrandon", "stormlands-rainwood": "durrandon",
  "stormlands-cape-wrath": "durrandon", "stormlands-tarth": "durrandon",
  "stormlands-dornish-marches": "durrandon", "stormlands-kingswood": "durrandon",
  // Dorne — Nhà MARTELL (Thân Vương, sau Nymeria ~700 BC) — KHÔNG phải Yronwood
  "dorne": "martell", "dorne-greenblood": "martell", "dorne-yronwood": "yronwood",
  "dorne-boneway": "martell", "dorne-princes-pass": "martell",
  "dorne-red-mountains": "martell", "dorne-starfall": "martell", "dorne-hellholt": "martell",
  // Ngoài Tường
  "beyond-the-wall": "", "beyond-frostfangs": "", "beyond-hardhome": "",
  "beyond-lands-always-winter": "", "beyond-ice-bay": "",
};

/** Hậu Chinh Phục (1-2 AC) — Aegon đã chinh phục xong, vương quốc mới hình thành */
const CONTROL_CONQUEST: Record<string, string> = {
  // Crownlands — Aegon lập Aegon's Fort (tiền thân Red Keep)
  "the-crownlands": "targaryen", "crownlands-duskendale": "targaryen",
  "crownlands-crackclaw": "targaryen", "crownlands-dragonstone": "targaryen",
  "crownlands-driftmark": "velaryon", "crownlands-kingswood": "targaryen",
  // Riverlands — Harren chết cháy, Tully được phong Lãnh Chúa Tối Cao
  "riverlands-gods-eye": "tully", // Harrenhal cháy rụi, chưa phong chư hầu mới
  // Iron Islands — Hoare diệt vong, Vickon Greyjoy được bầu
  // (default 298 AC greyjoy OK — Greyjoy lên nắm quyền từ đây)
  // Reach — Mern IX Gardener chết ở Field of Fire, Harlan Tyrell đầu hàng → phong
  // (default 298 AC tyrell OK)
  // Stormlands — Argilac Durrandon chết, Orys Baratheon lấy con gái Argella → phong
  // (default 298 AC baratheon OK)
  // Bắc — Torrhen Stark quỳ gối, giữ nguyên quyền cai trị
  // Vale — Sharra Arryn đầu hàng
  // Westerlands — Loren Lannister quỳ gối
  // Dorne — KHÔNG bị chinh phục, Martell vẫn độc lập
  // Ngoài Tường
  "beyond-the-wall": "", "beyond-frostfangs": "", "beyond-hardhome": "",
  "beyond-lands-always-winter": "", "beyond-ice-bay": "",
};

/** Hậu Chinh Phục (3-128 AC) — Targaryen cai trị ổn định */
const CONTROL_POST_CONQUEST: Record<string, string> = {
  // Crownlands — KL thủ đô, Darklyn vẫn giữ Duskendale
  "the-crownlands": "targaryen", "crownlands-duskendale": "darklyn",
  "crownlands-crackclaw": "targaryen", "crownlands-dragonstone": "targaryen",
  "crownlands-driftmark": "velaryon", "crownlands-kingswood": "targaryen",
  // Harrenhal qua tay nhiều nhà
  "riverlands-gods-eye": "tully",
};

/** Vũ Điệu Rồng (129-131 AC) — nội chiến Targaryen */
const CONTROL_DANCE: Record<string, string> = {
  // Crownlands chia phe: KL = Phe Xanh, Dragonstone/Driftmark = Phe Đen
  "the-crownlands": "targaryen-green", "crownlands-duskendale": "targaryen-green",
  "crownlands-crackclaw": "targaryen-black", "crownlands-dragonstone": "targaryen-black",
  "crownlands-driftmark": "targaryen-black", "crownlands-kingswood": "targaryen-green",
  // Reach — Hightower dẫn đầu Phe Xanh, nhiều nhà chia phe
  "reach-oldtown": "hightower",
  "reach-horn-hill": "targaryen-black", // Tarly theo Phe Đen
  "reach-bitterbridge": "targaryen-black", // Caswell theo Phe Đen
  // Riverlands — chiến trường khốc liệt
  "riverlands-bracken": "targaryen-green", // Bracken theo Phe Xanh
  "riverlands-gods-eye": "targaryen-green", // Harrenhal bị tranh giành
  // Stormlands — Borros Baratheon theo Phe Xanh (chưa đổi vassal)
  // Iron Islands — Red Kraken Dalton Greyjoy cướp bóc Westerlands (Phe Đen)
  "westerlands-fair-isle": "greyjoy", // Dalton Greyjoy đốt Fair Isle
  "westerlands-north-coast": "greyjoy", // Red Kraken tấn công bờ biển
};

/** Hậu Vũ Rồng (132-194 AC) — khôi phục, Targaryen tiếp tục */
const CONTROL_POST_DANCE: Record<string, string> = {
  "the-crownlands": "targaryen", "crownlands-duskendale": "darklyn",
  "crownlands-crackclaw": "targaryen", "crownlands-dragonstone": "targaryen",
  "crownlands-driftmark": "velaryon", "crownlands-kingswood": "targaryen",
  "riverlands-gods-eye": "tully",
};

/** Khởi Nghĩa Blackfyre (195-196 AC) — Daemon Blackfyre nổi dậy */
const CONTROL_BLACKFYRE: Record<string, string> = {
  ...CONTROL_POST_DANCE,
  // Bracken theo Blackfyre
  "riverlands-bracken": "blackfyre",
  // Bitterbridge gần chiến trường Redgrass Field
  "reach-bitterbridge": "blackfyre",
  // Connington theo Blackfyre (vùng Rainwood)
  "stormlands-rainwood": "blackfyre",
};

/** Dunk & Egg (209+ AC) — hậu Blackfyre, ổn định */
const CONTROL_DUNK_EGG: Record<string, string> = {
  ...CONTROL_POST_DANCE,
  // Castamere — Nhà Reyne vẫn tồn tại (bị diệt ~261 AC bởi Tywin)
  "westerlands-castamere": "lannister", // Reyne là vassal Lannister
  // Harrenhal — Nhà Lothston rồi Whent
  "riverlands-gods-eye": "whent",
  // Duskendale — Darklyn vẫn giữ (bị diệt ~276 AC, Defiance of Duskendale)
  "crownlands-duskendale": "darklyn",
};

/** Robert's Rebellion (282-283 AC) — Phe nổi dậy vs Vua Điên */
const CONTROL_ROBERTS_REBELLION: Record<string, string> = {
  // Crownlands — Aerys II (Targaryen) giữ King's Landing
  "the-crownlands": "targaryen", "crownlands-duskendale": "targaryen",
  "crownlands-crackclaw": "targaryen", "crownlands-dragonstone": "targaryen",
  "crownlands-driftmark": "targaryen", "crownlands-kingswood": "targaryen",
  // Harrenhal — Whent (cùng phe Robert sau Tourney at Harrenhal)
  "riverlands-gods-eye": "targaryen",
  // Darry trung thành Targaryen
  // Stormlands — Robert phất cờ nổi dậy, nhưng một số vassal chia phe
  // Dorne — Elia Martell → theo Targaryen
};

/** Greyjoy Rebellion (289 AC) — Robert trị vì, Balon nổi dậy bị dẹp */
const CONTROL_GREYJOY_REBELLION: Record<string, string> = {
  // Crownlands — Baratheon cai trị
  "the-crownlands": "baratheon", "crownlands-duskendale": "rykker",
  "crownlands-crackclaw": "baratheon", "crownlands-dragonstone": "baratheon",
  "crownlands-driftmark": "velaryon", "crownlands-kingswood": "stokeworth",
  // Quần Đảo Sắt — Balon nổi dậy rồi thua; Greyjoy giữ quyền nhưng Theon bị lấy
  // Các vùng khác giữ nguyên default 298
};

/** War of Five Kings (298-299 AC) — hỗn loạn đa cực */
const CONTROL_WOFK: Record<string, string> = {
  // Crownlands — Lannister cầm quyền qua Joffrey
  "the-crownlands": "lannister", "crownlands-duskendale": "lannister",
  "crownlands-crackclaw": "lannister", "crownlands-dragonstone": "baratheon", // Stannis
  "crownlands-driftmark": "baratheon", "crownlands-kingswood": "lannister",
  // Bắc — Robb Stark tuyên bố King in the North, nhưng Ironborn xâm chiếm
  "north-wolfswood": "greyjoy", // Asha Greyjoy chiếm Deepwood Motte
  "north-stony-shore": "greyjoy", // Ironborn cướp bóc Stony Shore
  // Vùng Sông — chiến trường, Tully vẫn giữ danh nghĩa
  // Stormlands — Renly rồi Stannis tranh Storm's End
  "stormlands-rainwood": "baratheon", // Connington lưu vong, vẫn Baratheon
  "stormlands-cape-wrath": "baratheon", // Cape Wrath dưới Stannis sau khi Renly chết
};

/** Winds of Winter (300+ AC) — hậu Red Wedding, Bolton/Frey nắm quyền */
const CONTROL_WINDS: Record<string, string> = {
  // Crownlands — Cersei / Lannister kiểm soát chặt
  "the-crownlands": "lannister", "crownlands-duskendale": "lannister",
  "crownlands-crackclaw": "lannister", "crownlands-dragonstone": "baratheon", // Stannis đã đi Bắc
  "crownlands-driftmark": "lannister", "crownlands-kingswood": "lannister",
  // Bắc — Bolton nắm quyền từ Winterfell, nhưng nhiều nhà ngầm phản
  "the-north": "bolton",
  "north-wolfswood": "bolton", // Ironborn rút, Bolton chiếm
  "north-barrowlands": "dustin", // Lady Dustin theo Bolton
  "north-white-knife": "manderly", // Manderly ngầm trung thành Stark
  "north-dreadfort": "bolton",
  "north-karhold": "karstark", // Karstark theo Bolton (Arnolf Karstark)
  "north-last-hearth": "umber", // Umber chia phe (Whoresbane theo Bolton, Crowfood theo Stark)
  "north-neck": "reed", // Reed từ chối Bolton — giữ trung thành Stark
  "north-bear-island": "mormont", // Mormont trung thành tuyệt đối với Stark
  "north-skagos": "stark", // Skagos cô lập (Davos đi tìm Rickon)
  "north-stony-shore": "tallhart", // Tallhart thiệt hại nặng nhưng danh nghĩa theo Bolton
  // Quần Đảo Sắt — Euron Greyjoy chiếm quyền (sau Kingsmoot)
  // Vùng Sông — Frey/Lannister danh nghĩa kiểm soát, kháng cự ngầm
  "the-riverlands": "frey",
  "riverlands-twins": "frey",
  "riverlands-seagard": "mallister", // Mallister bất đắc dĩ khuất phục
  "riverlands-trident": "frey",
  "riverlands-gods-eye": "lannister", // Harrenhal — Littlefinger danh nghĩa, thực tế Lannister
  "riverlands-maidenpool": "frey",
  "riverlands-blackwood": "blackwood", // Blackwood cầm cự kháng cự cuối cùng
  "riverlands-bracken": "bracken", // Bracken theo Lannister/Frey
  // Reach — Tyrell liên minh Lannister, nhưng Euron tấn công
  "reach-shield-islands": "greyjoy", // Euron chiếm Shield Islands
  // Stormlands — fAegon + JonCon đổ bộ, chiếm Griffin's Roost
  "stormlands-rainwood": "connington", // Jon Connington chiếm lại lãnh thổ tổ tiên
  "stormlands-cape-wrath": "connington", // fAegon/Golden Company mở rộng
  // Dorne — Martell vẫn giữ, Arianne đang đàm phán với fAegon
  // Essos — Daenerys chiếm Meereen, Yunkai phản kích
  "meereen": "targaryen-essos",
  "astapor": "", // hỗn loạn
  "yunkai": "ghiscar", // Yunkai tái chiếm
};

/**
 * Tra cứu năm → bảng override thích hợp.
 *
 * Chỉ trả về các entry CẦN GHI ĐÈ so với `DEFAULT_298`. Kết quả cuối cùng
 * của `regionControlForYear()` sẽ merge override lên default.
 */
function overridesForYear(year: number): Record<string, string> {
  if (year < -300) return CONTROL_ANCIENT;      // Đêm Trường / Thời Đại Anh Hùng (~8000+ BC)
  if (year < 1) return CONTROL_PRE_CONQUEST;     // Bảy Vương Quốc trước Aegon (~300 BC – 1 BC)
  if (year <= 2) return CONTROL_CONQUEST;         // Hậu chinh phục (1-2 AC)
  if (year < 129) return CONTROL_POST_CONQUEST;
  if (year <= 131) return CONTROL_DANCE;
  if (year < 195) return CONTROL_POST_DANCE;
  if (year <= 196) return CONTROL_BLACKFYRE;
  if (year < 282) return CONTROL_DUNK_EGG;
  if (year <= 283) return CONTROL_ROBERTS_REBELLION;
  if (year < 298) return CONTROL_GREYJOY_REBELLION;
  if (year < 300) return CONTROL_WOFK;
  return CONTROL_WINDS;
}

/** Bản đồ controller đầy đủ cho mọi leaf province tại một năm. */
export function regionControlForYear(year: number): Record<string, string> {
  const control = { ...DEFAULT_298 };
  const overrides = overridesForYear(year);
  for (const [regionId, house] of Object.entries(overrides)) {
    if (regionId in control) {
      control[regionId] = house;
    }
  }
  return control;
}

export const FACTION_COLORS_MAP: Record<string, string> = {
  "Nhà Targaryen": "targaryen",
  "Vương Quốc Phương Bắc": "stark", "Vương Quốc Núi và Thung Lũng": "arryn",
  "Vương Quốc Đá": "lannister", "Vương Quốc Reach": "gardener",
  "Vương Quốc Bão Tố": "durrandon", "Vương Quốc Sông và Đảo": "hoare",
  "Xứ Dorne": "martell",
  "Phe Đen": "targaryen-black", "Phe Xanh": "targaryen-green",
  "Targaryen Vương Thất": "targaryen", "Phe Blackfyre": "blackfyre",
  "Phe Khởi Nghĩa": "baratheon", "Phe Ngai Sắt": "lannister",
  "Phe Phương Bắc": "stark", "Phe Stannis": "baratheon",
  "Phe Renly": "tyrell", "Phe Đảo Sắt": "greyjoy",
};

export function factionsForYear(year: number): Record<string, string[]> | null {
  if (year >= -2 && year <= 1) return {
    "Nhà Targaryen": ["targaryen", "velaryon"],
    // Trước Chinh Phạt, đây là bảy chính thể độc lập chứ không phải một liên
    // minh thống nhất mang tên "Bảy Vương Quốc".
    "Vương Quốc Phương Bắc": ["stark"],
    "Vương Quốc Núi và Thung Lũng": ["arryn"],
    "Vương Quốc Đá": ["lannister"],
    "Vương Quốc Reach": ["gardener"],
    "Vương Quốc Bão Tố": ["durrandon"],
    "Vương Quốc Sông và Đảo": ["hoare"],
    "Xứ Dorne": ["martell"],
  };
  if (year >= 129 && year <= 131) return {
    "Phe Đen": ["targaryen-black", "stark", "arryn", "tully", "velaryon"],
    "Phe Xanh": ["targaryen-green", "lannister", "baratheon", "hightower"],
  };
  if (year >= 195 && year <= 196) return {
    "Targaryen Vương Thất": ["targaryen", "arryn", "martell", "tully", "lannister", "baratheon", "stark"],
    "Phe Blackfyre": ["blackfyre", "bracken", "yronwood", "peake"],
  };
  if (year >= 282 && year <= 283) return {
    "Phe Khởi Nghĩa": ["baratheon", "stark", "arryn", "tully"],
    "Targaryen Vương Thất": ["targaryen", "tyrell", "martell"],
  };
  if (year >= 298 && year <= 300) return {
    "Phe Ngai Sắt": ["lannister", "tyrell"], "Phe Phương Bắc": ["stark", "tully"],
    "Phe Stannis": ["baratheon"], "Phe Đảo Sắt": ["greyjoy"],
  };
  return null;
}

export function regionControlForEra(eraId: string): Record<string, string> {
  const eraToYear: Record<string, number> = {
    "long-night": -8000, "aegon-conquest": -2, "dance-of-dragons": 129,
    "blackfyre-rebellion": 195, "dunk-and-egg": 209, "roberts-rebellion": 282,
    "greyjoy-rebellion": 289, "war-of-five-kings": 298, "winds-of-winter": 300,
  };
  return regionControlForYear(eraToYear[eraId] ?? 298);
}

export function seatVisible(region: MapRegion, eraId: string): boolean {
  return !(region.seatHiddenEras ?? []).includes(eraId);
}
