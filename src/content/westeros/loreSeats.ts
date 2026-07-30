// content/westeros/loreSeats.ts
// ============================================================================
// CÁC TOÀ THÀNH CÓ TÊN TRONG TIỂU THUYẾT — địa thế CỐ ĐỊNH + đường cái theo lore.
//
// Lãnh địa thường thì địa hình được gieo ngẫu nhiên lúc được phong/chiếm (vẫn
// đúng chất của vùng). Nhưng Winterfell không thể mỗi ván một kiểu: những nơi
// người đọc đã thuộc mặt thì phải luôn ra đúng dáng của nó — nên bảng này ghim
// hạt giống, chỉnh tính cách địa thế cho khớp mô tả, và khai báo các con đường
// có tên đi qua thành (Vương Lộ, Hoa Lộ, Kim Lộ...).
//
// Thêm một toà thành = thêm một entry. KHÔNG đụng vào engine sinh địa hình.
// ============================================================================
import type { Terrain } from "../../mvu/schema";
import type { TerrainProfile } from "./terrain";

/** Hướng con đường rời khỏi thành (la bàn, y hướng xuống như trên bản đồ). */
export type Compass = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

const COMPASS_RAD: Record<Compass, number> = {
  N: -Math.PI / 2,
  NE: -Math.PI / 4,
  E: 0,
  SE: Math.PI / 4,
  S: Math.PI / 2,
  SW: (Math.PI * 3) / 4,
  W: Math.PI,
  NW: (-Math.PI * 3) / 4,
};

export function compassToAngle(dir: Compass): number {
  return COMPASS_RAD[dir];
}

export interface LoreRoad {
  /** tên con đường trong tiểu thuyết. */
  name: string;
  dir: Compass;
  /** trục chính của thành (đường rộng nhất). */
  main?: boolean;
}

export interface LoreSeat {
  /** khoá lãnh địa khớp entry này (id lãnh địa hoặc tên hiển thị). */
  ids: string[];
  name: string;
  /** địa hình chủ đạo — ghi đè địa hình của vùng nếu khác. */
  terrain: Terrain;
  /** thành này có giáp nước không (Winterfell nằm sâu trong đất liền). */
  coastal: boolean;
  /** hạt giống CỐ ĐỊNH — ván nào cũng ra đúng địa thế ấy. */
  seed: number;
  /** tinh chỉnh chất đất cho khớp mô tả trong truyện. */
  profile?: Partial<TerrainProfile>;
  /** đường cái có tên đi qua. */
  roads: LoreRoad[];
  /** cấp tường thành dựng sẵn (0 = trần trụi, 2+ = tường đá kiên cố). */
  wallLevel: number;
  /** cấp Lâu Đài tối thiểu theo tầm vóc canon (không hạ cấp người chơi đã nâng). */
  level: number;
  /** một câu nhắc vì sao nơi này ra dáng như vậy — hiện trên bản đồ Tầng 1. */
  note: string;
}

export const LORE_SEATS: LoreSeat[] = [
  {
    ids: ["the-north-seat", "winterfell"], name: "Winterfell",
    terrain: "Tuyết/Băng Giá", coastal: false, seed: 0x57494e54,
    // nằm sâu trong đất liền, rìa Rừng Sói, suối nước nóng chảy dưới nền thành
    profile: { forest: 0.4, riverChance: 1, relief: 0.85, elevBias: 0.0, cliffs: false },
    roads: [
      { name: "Vương Lộ (về Tường Thành)", dir: "N", main: true },
      { name: "Vương Lộ (về phương Nam)", dir: "S" },
      { name: "Đường Bến Trắng", dir: "SE" },
    ],
    wallLevel: 3, level: 4, // hai lớp tường đá với hào ở giữa
    note: "Hai lớp tường đá, suối nước nóng dưới nền, Rừng Sói phía tây.",
  },
  {
    ids: ["the-crownlands-seat", "kings-landing"], name: "King's Landing",
    terrain: "Đồng Bằng", coastal: true, seed: 0x4b494e47,
    // ba ngọn đồi bên bờ Huyết Hà Nước Đen, mở ra Vịnh Nước Đen
    profile: { relief: 1.05, elevBias: 0.04, forest: -0.1, riverChance: 1, cliffs: false },
    roads: [
      { name: "Vương Lộ", dir: "N", main: true },
      { name: "Hoa Lộ", dir: "SW" },
      { name: "Kim Lộ", dir: "W" },
    ],
    wallLevel: 3, level: 5, // tường thành bảy cổng
    note: "Ba ngọn đồi bên sông Nước Đen, tường thành bảy cổng, mở ra vịnh.",
  },
  {
    ids: ["the-westerlands-seat", "casterly-rock"], name: "Casterly Rock",
    terrain: "Đồi Núi", coastal: true, seed: 0x434153,
    // khối đá khổng lồ dựng ngay trên Biển Hoàng Hôn
    profile: { relief: 1.45, elevBias: 0.22, cliffs: true, forest: 0.08 },
    roads: [
      { name: "Kim Lộ", dir: "E", main: true },
      { name: "Hải Lộ", dir: "S" },
      { name: "Giang Lộ", dir: "NE" },
    ],
    wallLevel: 2, level: 5,
    note: "Khối đá khổng lồ đục rỗng, chân đá cắm thẳng xuống Biển Hoàng Hôn.",
  },
  {
    ids: ["the-vale-seat", "the-eyrie"], name: "The Eyrie",
    terrain: "Hẻm Núi", coastal: false, seed: 0x45595245,
    // treo trên vai Mũi Giáo Khổng Lồ, đường lên là bậc đá hiểm
    profile: { relief: 1.6, elevBias: 0.3, cliffs: true, forest: 0.05, riverChance: 0.3 },
    roads: [{ name: "Sơn Lộ (xuống Cổng Máu)", dir: "SW", main: true }],
    wallLevel: 2, level: 4,
    note: "Treo trên vách Mũi Giáo Khổng Lồ — chỉ một lối lên qua Cổng Máu.",
  },
  {
    ids: ["the-riverlands-seat", "riverrun"], name: "Riverrun",
    terrain: "Sông/Lối Vượt Sông", coastal: false, seed: 0x52495645,
    // toà thành hình tam giác kẹp giữa Sông Đá Lăn và Nhánh Đỏ
    profile: { riverChance: 1, wet: 0.22, relief: 0.6, elevBias: -0.12, forest: 0.2 },
    roads: [
      { name: "Giang Lộ (về Vùng Tây)", dir: "SW", main: true },
      { name: "Đường Song Sinh", dir: "NE" },
      { name: "Đường Ngã Ba Sông", dir: "SE" },
    ],
    wallLevel: 2, level: 3,
    note: "Kẹp giữa hai dòng sông — mở cống là hào nước bao kín ba mặt.",
  },
  {
    ids: ["the-reach-seat", "highgarden"], name: "Highgarden",
    terrain: "Đồng Bằng", coastal: false, seed: 0x48494748,
    // đồi thoai thoải bên sông Mander, ruộng vườn trải khắp
    profile: { relief: 0.7, elevBias: -0.02, forest: 0.24, riverChance: 1 },
    roads: [
      { name: "Hoa Lộ (về Vương Đô)", dir: "NE", main: true },
      { name: "Hoa Lộ (về Oldtown)", dir: "SW" },
      { name: "Hải Lộ", dir: "NW" },
    ],
    wallLevel: 2, level: 4,
    note: "Ba lớp tường bao quanh đồi bên sông Mander, vườn tược khắp nơi.",
  },
  {
    ids: ["the-stormlands-seat", "storms-end"], name: "Storm's End",
    terrain: "Rừng Rậm", coastal: true, seed: 0x53544f52,
    // tường cong khổng lồ đứng trên vách đá Vịnh Đắm Thuyền, sát Rừng Mưa
    profile: { relief: 1.15, elevBias: 0.1, cliffs: true, forest: 0.45, wet: 0.14 },
    roads: [
      { name: "Đường Vũ Bão (về Vương Đô)", dir: "NW", main: true },
      { name: "Cốt Đạo (xuống Dorne)", dir: "SW" },
    ],
    wallLevel: 3, level: 5, // tường dày nhất Westeros
    note: "Tường cong liền khối trên vách Vịnh Đắm Thuyền, lưng tựa Rừng Mưa.",
  },
  {
    ids: ["dorne-seat", "sunspear"], name: "Sunspear",
    terrain: "Sa Mạc", coastal: true, seed: 0x53554e53,
    // thành cát ba tháp bên cửa Lục Huyết Hà
    profile: { relief: 0.75, elevBias: -0.04, cliffs: false, forest: -0.32, riverChance: 1 },
    roads: [
      { name: "Đường Lục Huyết Hà", dir: "W", main: true },
      { name: "Cốt Đạo (lên Vùng Bão)", dir: "NW" },
    ],
    wallLevel: 2, level: 4,
    note: "Ba tháp bên cửa Lục Huyết Hà, phố Bóng Râm bám ngoài tường.",
  },
  {
    ids: ["the-iron-islands-seat", "pyke"], name: "Pyke",
    terrain: "Đồi Núi", coastal: true, seed: 0x50594b45,
    // các tháp đứng trên trụ đá giữa biển, cầu dây nối nhau
    profile: { relief: 1.5, elevBias: 0.18, cliffs: true, forest: -0.2, riverChance: 0 },
    roads: [{ name: "Đường Bến Chúa", dir: "E", main: true }],
    wallLevel: 1, level: 3,
    note: "Tháp dựng trên trụ đá giữa sóng, nối nhau bằng cầu dây.",
  },
  {
    ids: ["castle-black"], name: "Castle Black",
    terrain: "Tuyết/Băng Giá", coastal: false, seed: 0x424c4143,
    // dưới chân Tường Thành, không có tường bao — chỉ có Tường
    profile: { relief: 0.9, elevBias: 0.05, cliffs: false, forest: 0.3, riverChance: 0.2 },
    roads: [{ name: "Vương Lộ (xuống phương Nam)", dir: "S", main: true }],
    wallLevel: 0, level: 2,
    note: "Không tường bao — chỗ dựa duy nhất là Tường Thành phía bắc.",
  },
  {
    ids: ["the-twins"], name: "Song Sinh",
    terrain: "Sông/Lối Vượt Sông", coastal: false, seed: 0x54574e53,
    // hai toà thành hai bờ Sông Xanh, nối bằng cầu — trạm thu lộ phí
    profile: { riverChance: 1, wet: 0.26, relief: 0.55, elevBias: -0.14 },
    roads: [
      { name: "Vương Lộ (bờ bắc)", dir: "N", main: true },
      { name: "Vương Lộ (bờ nam)", dir: "S" },
    ],
    wallLevel: 2, level: 3,
    note: "Hai toà thành hai bờ Sông Xanh, chiếc cầu là lối vượt sông duy nhất.",
  },
  {
    ids: ["moat-cailin"], name: "Moat Cailin",
    terrain: "Đầm Lầy", coastal: false, seed: 0x4d4f4154,
    // ba tháp đổ nát giữa Đầm Lầy — cổ họng của phương Bắc
    profile: { wet: 0.5, relief: 0.4, elevBias: -0.2, forest: 0.1, riverChance: 1 },
    roads: [{ name: "Vương Lộ (qua Ải Eo Đất)", dir: "N", main: true }],
    wallLevel: 1, level: 2,
    note: "Ba tháp đổ giữa đầm lầy — đạo quân nào lên Bắc cũng phải qua đây.",
  },
  {
    ids: ["oldtown"], name: "Oldtown",
    terrain: "Đồng Bằng", coastal: true, seed: 0x4f4c4454,
    // thành phố cổ nhất, cửa sông Mật, Tháp Cao đứng trên đảo đá
    profile: { relief: 0.8, elevBias: 0.0, forest: 0.05, riverChance: 1 },
    roads: [
      { name: "Hoa Lộ (lên Highgarden)", dir: "NE", main: true },
      { name: "Đường Ven Biển", dir: "W" },
    ],
    wallLevel: 2, level: 5,
    note: "Thành phố cổ nhất Westeros bên cửa sông Mật, Tháp Cao soi biển.",
  },
  {
    ids: ["lannisport"], name: "Lannisport",
    terrain: "Đồng Bằng", coastal: true, seed: 0x4c414e4e,
    roads: [
      { name: "Hải Lộ (xuống Reach)", dir: "S", main: true },
      { name: "Kim Lộ", dir: "E" },
    ],
    profile: { relief: 0.8, forest: 0.08 },
    wallLevel: 2, level: 4,
    note: "Hải cảng sầm uất dưới bóng Casterly Rock.",
  },
  {
    ids: ["white-harbor"], name: "White Harbor",
    terrain: "Đồng Bằng", coastal: true, seed: 0x57484252,
    profile: { relief: 0.8, forest: 0.18, riverChance: 1 },
    roads: [{ name: "Đường Bến Trắng (lên Winterfell)", dir: "NW", main: true }],
    wallLevel: 2, level: 4,
    note: "Cảng lớn duy nhất của phương Bắc, bên cửa Sông Trắng.",
  },
  {
    ids: ["dragonstone"], name: "Dragonstone",
    terrain: "Đồi Núi", coastal: true, seed: 0x44524147,
    // đảo núi lửa, thành đá đen tạc hình rồng
    profile: { relief: 1.4, elevBias: 0.2, cliffs: true, forest: -0.15, riverChance: 0 },
    roads: [{ name: "Đường Bến Cảng", dir: "SE", main: true }],
    wallLevel: 2, level: 4,
    note: "Đảo núi lửa, tường đá đen tạc hình rồng, quanh năm mù khói.",
  },
  {
    ids: ["dreadfort"], name: "Dreadfort",
    terrain: "Tuyết/Băng Giá", coastal: false, seed: 0x44524541,
    profile: { relief: 0.95, forest: 0.3, riverChance: 1, cliffs: false },
    roads: [{ name: "Đường Sông Khóc", dir: "SW", main: true }],
    wallLevel: 2, level: 3,
    note: "Thành đá xám bên Sông Khóc, tường dày và ngục sâu.",
  },
  {
    ids: ["karhold"], name: "Karhold",
    terrain: "Tuyết/Băng Giá", coastal: false, seed: 0x4b415248,
    profile: { relief: 0.95, forest: 0.22, riverChance: 0.5, cliffs: false },
    roads: [{ name: "Đường Karhold", dir: "SW", main: true }],
    wallLevel: 2, level: 3,
    note: "Pháo đài Karstark ở đông bắc Phương Bắc, giữa đất lạnh và rừng thưa.",
  },
  {
    ids: ["deepwood-motte"], name: "Deepwood Motte",
    terrain: "Rừng Rậm", coastal: false, seed: 0x44455057,
    profile: { forest: 0.58, relief: 0.78, wet: 0.08, riverChance: 0.4 },
    roads: [{ name: "Đường Rừng Sâu", dir: "SE", main: true }],
    wallLevel: 2, level: 3,
    note: "Thành lũy nhà Glover, chìm trong rừng sâu phía tây Phương Bắc.",
  },
  {
    ids: ["harrenhal"], name: "Harrenhal",
    terrain: "Đồng Bằng", coastal: false, seed: 0x48415252,
    profile: { relief: 0.88, elevBias: 0.02, forest: 0.12, riverChance: 1, wet: 0.12 },
    roads: [{ name: "Giang Lộ", dir: "W", main: true }],
    wallLevel: 2, level: 4,
    note: "Lâu đài khổng lồ cháy đen bên Hồ Mắt Thần, quá rộng để một nhà nhỏ giữ kín.",
  },
  {
    ids: ["seagard"], name: "Seagard",
    terrain: "Đồng Bằng", coastal: true, seed: 0x53454752,
    profile: { relief: 0.7, forest: 0.1, riverChance: 0.45, wet: 0.1 },
    roads: [{ name: "Giang Lộ (về Riverrun)", dir: "SE", main: true }],
    wallLevel: 2, level: 3,
    note: "Pháo đài Mallister ở bờ Hoàng Hôn, tháp canh hướng ra biển để báo động Người Sắt.",
  },
  {
    ids: ["golden-tooth"], name: "Golden Tooth",
    terrain: "Hẻm Núi", coastal: false, seed: 0x474f4c44,
    profile: { relief: 1.45, elevBias: 0.18, cliffs: true, forest: 0.16, riverChance: 0.25 },
    roads: [{ name: "Giang Lộ", dir: "E", main: true }],
    wallLevel: 2, level: 3,
    note: "Cửa ngõ núi hiểm của Vùng Tây, giữ Giang Lộ khi nó vượt biên Riverlands.",
  },
  {
    ids: ["gulltown"], name: "Gulltown",
    terrain: "Đồng Bằng", coastal: true, seed: 0x47554c4c,
    profile: { relief: 0.72, forest: 0.12, riverChance: 0.55, wet: 0.08 },
    roads: [{ name: "Đường Gulltown", dir: "NW", main: true }],
    wallLevel: 2, level: 4,
    note: "Hải cảng có tường bao lớn nhất Vale, cửa ngõ thương mại trên Biển Hẹp.",
  },
  {
    ids: ["horn-hill"], name: "Horn Hill",
    terrain: "Đồi Núi", coastal: false, seed: 0x484f524e,
    profile: { relief: 1.15, elevBias: 0.1, forest: 0.3, riverChance: 0.35 },
    roads: [{ name: "Đường Marches", dir: "NE", main: true }],
    wallLevel: 2, level: 3,
    note: "Cứ địa Tarly trên các gò đồi Reach, hướng về những con đèo Dornish Marches.",
  },
  {
    ids: ["evenfall-hall"], name: "Evenfall Hall",
    terrain: "Đồi Núi", coastal: true, seed: 0x4556454e,
    profile: { relief: 1.1, elevBias: 0.12, cliffs: true, forest: 0.25, riverChance: 0.15 },
    roads: [{ name: "Đường Tarth", dir: "NW", main: true }],
    wallLevel: 2, level: 3,
    note: "Thành Tarth trên vách đá đảo, trông xuống vịnh và đường biển về Vùng Bão.",
  },
  {
    ids: ["yronwood"], name: "Yronwood",
    terrain: "Hẻm Núi", coastal: false, seed: 0x59524f4e,
    profile: { relief: 1.35, elevBias: 0.16, cliffs: true, forest: -0.08, riverChance: 0.42 },
    roads: [{ name: "Đường Đá", dir: "NW", main: true }],
    wallLevel: 2, level: 3,
    note: "Pháo đài cổ nhà Yronwood ở chân Dãy Núi Đỏ, trấn lối vào đông Dorne.",
  },
  {
    ids: ["starfall"], name: "Starfall",
    terrain: "Đồi Núi", coastal: true, seed: 0x53544152,
    profile: { relief: 1.05, elevBias: 0.08, cliffs: true, forest: -0.1, riverChance: 1 },
    roads: [{ name: "Đường Torentine", dir: "NE", main: true }],
    wallLevel: 2, level: 3,
    note: "Ghế nhà Dayne bên cửa sông Torentine, nơi núi đá Dorne gặp biển mùa hạ.",
  },
];

const BY_KEY = new Map<string, LoreSeat>();
for (const seat of LORE_SEATS) {
  for (const id of seat.ids) BY_KEY.set(id.toLowerCase(), seat);
  BY_KEY.set(seat.name.toLowerCase(), seat);
}

/** Tra toà thành trong lore theo id lãnh địa hoặc tên hiển thị. */
export function loreSeatFor(holdingId: string, displayName?: string): LoreSeat | null {
  return BY_KEY.get(holdingId.toLowerCase()) ?? (displayName ? BY_KEY.get(displayName.toLowerCase()) ?? null : null);
}
