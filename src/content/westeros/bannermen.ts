// content/westeros/bannermen.ts
// ============================================================================
// CHƯ HẦU THEO VÙNG (M19) — nền của chế độ phong kiến phân quyền.
//
// Lãnh chúa vùng không "sở hữu" đám quân này. Ông ta gửi quạ, phất cờ, rồi CHỜ:
// nhà gần thì mươi ngày tới, nhà xa mất cả tháng; nhà trung thành thì dốc sạch
// đinh tráng, nhà bất mãn gửi lấy lệ vài trăm dân binh rách rưới — hoặc viện cớ
// mùa gặt mà ở nhà.
//
// levy = số đinh tráng nhà đó dốc ra được khi TOÀN TÂM (trung thành 100).
// marchDays = số ngày từ thành trì của họ tới điểm hẹn của lãnh chúa vùng.
// ============================================================================
import type { TroopTypeAll } from "./troopTypes";

export interface BannermanData {
  /** houseId — khoá trong stat_data."Chư Hầu". */
  id: string;
  name: string;
  seat: string;
  /** regionId chư hầu trực thuộc. */
  region: string;
  /** quân dốc ra được khi trung thành tuyệt đối. */
  levy: number;
  /** binh chủng nhà này nổi tiếng. */
  troop: TroopTypeAll;
  /** ngày hành quân từ thành trì của họ tới trọng trấn của vùng. */
  marchDays: number;
  /** trung thành mặc định lúc khởi ván (0-100). */
  loyalty: number;
  /** một dòng lai lịch cho AI kể + hiện trong bảng. */
  note: string;
}

export const BANNERMEN: BannermanData[] = [
  // ── Phương Bắc ──
  { id: "bolton", name: "Nhà Bolton", seat: "Dreadfort", region: "the-north", levy: 3500, troop: "Bộ Binh", marchDays: 14, loyalty: 45, note: "Da lột trên cờ hồng. Cúi đầu, nhưng chưa bao giờ quên mình từng là vua." },
  { id: "karstark", name: "Nhà Karstark", seat: "Karhold", region: "the-north", levy: 2800, troop: "Bộ Binh", marchDays: 18, loyalty: 75, note: "Cùng huyết thống Stark, xa hơn về phía đông và lạnh hơn về tính khí." },
  { id: "umber", name: "Nhà Umber", seat: "Last Hearth", region: "the-north", levy: 3000, troop: "Bộ Binh", marchDays: 20, loyalty: 80, note: "Người khổng lồ phá xiềng. To tiếng, uống khoẻ, trung thành tới mức bướng." },
  { id: "manderly", name: "Nhà Manderly", seat: "White Harbor", region: "the-north", levy: 4000, troop: "Trường Thương", marchDays: 12, loyalty: 70, note: "Nhà giàu nhất phương Bắc, cảng biển và bạc — quân đông nhưng chậm chân." },
  { id: "mormont", name: "Nhà Mormont", seat: "Bear Island", region: "the-north", levy: 700, troop: "Bộ Binh", marchDays: 22, loyalty: 85, note: "Đảo Gấu: ít người, đàn bà cũng cầm rìu, không ai lùi." },
  { id: "glover", name: "Nhà Glover", seat: "Deepwood Motte", region: "the-north", levy: 1500, troop: "Bộ Binh", marchDays: 13, loyalty: 72, note: "Giữ rừng sói phía tây, quen đánh trong bóng cây." },
  { id: "reed", name: "Nhà Reed", seat: "Greywater Watch", region: "the-north", levy: 900, troop: "Cung Thủ", marchDays: 16, loyalty: 88, note: "Người đầm lầy Neck. Không ai tìm được thành của họ, kể cả bạn." },
  { id: "hornwood", name: "Nhà Hornwood", seat: "Hornwood", region: "the-north", levy: 1200, troop: "Bộ Binh", marchDays: 8, loyalty: 70, note: "Nai đầu đàn giữa rừng, láng giềng sát vách của Dreadfort." },
  { id: "cerwyn", name: "Nhà Cerwyn", seat: "Cerwyn", region: "the-north", levy: 800, troop: "Dân Binh", marchDays: 3, loyalty: 78, note: "Sát Winterfell nhất — quạ chưa đậu cánh họ đã lên đường." },

  // ── Thung Lũng ──
  { id: "royce", name: "Nhà Royce", seat: "Runestone", region: "the-vale", levy: 2500, troop: "Hiệp Sĩ", marchDays: 10, loyalty: 75, note: "Giáp đồng khắc rune của Tiền Nhân, cũ hơn cả nhà Arryn." },
  { id: "corbray", name: "Nhà Corbray", seat: "Heart's Home", region: "the-vale", levy: 1500, troop: "Hiệp Sĩ", marchDays: 9, loyalty: 60, note: "Giữ Lady Forlorn, thanh kiếm Valyria — và một tham vọng tương xứng." },
  { id: "waynwood", name: "Nhà Waynwood", seat: "Ironoaks", region: "the-vale", levy: 1800, troop: "Bộ Binh", marchDays: 8, loyalty: 72, note: "Sồi sắt: chậm nói, chắc lời." },
  { id: "redfort", name: "Nhà Redfort", seat: "Redfort", region: "the-vale", levy: 1600, troop: "Hiệp Sĩ", marchDays: 11, loyalty: 70, note: "Thành đá đỏ chân núi, lò rèn hiệp sĩ của Thung Lũng." },
  { id: "hunter", name: "Nhà Hunter", seat: "Longbow Hall", region: "the-vale", levy: 1400, troop: "Cung Thủ", marchDays: 12, loyalty: 65, note: "Cung dài Thung Lũng, ba người con trai và ba tham vọng." },

  // ── Vùng Sông Nước ──
  { id: "frey", name: "Nhà Frey", seat: "The Twins", region: "the-riverlands", levy: 4000, troop: "Bộ Binh", marchDays: 10, loyalty: 40, note: "Giữ cây cầu, và tính phí mọi thứ đi qua nó — kể cả lòng trung thành." },
  { id: "blackwood", name: "Nhà Blackwood", seat: "Raventree Hall", region: "the-riverlands", levy: 1800, troop: "Cung Thủ", marchDays: 9, loyalty: 78, note: "Thờ Cựu Thần giữa đất Bảy Thần, thù nhà Bracken từ thuở khai thiên." },
  { id: "bracken", name: "Nhà Bracken", seat: "Stone Hedge", region: "the-riverlands", levy: 1700, troop: "Kỵ Binh", marchDays: 9, loyalty: 62, note: "Ngựa đỏ. Ghét nhà Blackwood hơn ghét bất kỳ kẻ thù nào của lãnh chúa." },
  { id: "mallister", name: "Nhà Mallister", seat: "Seagard", region: "the-riverlands", levy: 1500, troop: "Trường Thương", marchDays: 8, loyalty: 80, note: "Đại bàng bạc canh biển, kèn báo cướp biển Sắt treo trên tháp." },
  { id: "piper", name: "Nhà Piper", seat: "Pinkmaiden", region: "the-riverlands", levy: 1000, troop: "Bộ Binh", marchDays: 7, loyalty: 74, note: "Nhỏ, ồn ào, và luôn có mặt khi cờ hiệu phất lên." },
  { id: "darry", name: "Nhà Darry", seat: "Darry", region: "the-riverlands", levy: 900, troop: "Kỵ Binh", marchDays: 6, loyalty: 66, note: "Người cày ruộng của Vương Miện, từng chết vì rồng đỏ." },

  // ── Phương Tây ──
  { id: "clegane", name: "Nhà Clegane", seat: "Clegane's Keep", region: "the-westerlands", levy: 400, troop: "Kỵ Binh", marchDays: 4, loyalty: 65, note: "Ba con chó đen. Nhà mới nổi, nổi bằng bạo lực." },
  { id: "marbrand", name: "Nhà Marbrand", seat: "Ashemark", region: "the-westerlands", levy: 1800, troop: "Kỵ Binh", marchDays: 7, loyalty: 78, note: "Báo lửa. Kỵ binh giỏi nhất phương Tây." },
  { id: "lefford", name: "Nhà Lefford", seat: "Golden Tooth", region: "the-westerlands", levy: 2200, troop: "Bộ Binh", marchDays: 9, loyalty: 74, note: "Khoá cổng phía đông của phương Tây — ai vào cũng phải qua họ." },
  { id: "crakehall", name: "Nhà Crakehall", seat: "Crakehall", region: "the-westerlands", levy: 2000, troop: "Bộ Binh", marchDays: 6, loyalty: 72, note: "Lợn lòi vằn. To xác, ăn khoẻ, đánh bền." },
  { id: "westerling", name: "Nhà Westerling", seat: "The Crag", region: "the-westerlands", levy: 700, troop: "Dân Binh", marchDays: 8, loyalty: 68, note: "Dòng dõi lâu đời, hầu bao rỗng tuếch." },

  // ── Vùng Vương Miện ──
  { id: "rosby", name: "Nhà Rosby", seat: "Rosby", region: "the-crownlands", levy: 700, troop: "Dân Binh", marchDays: 3, loyalty: 65, note: "Sát Vương Đô, nhiều thóc hơn giáo." },
  { id: "stokeworth", name: "Nhà Stokeworth", seat: "Stokeworth", region: "the-crownlands", levy: 800, troop: "Bộ Binh", marchDays: 3, loyalty: 63, note: "Cừu trên cờ. Ngả theo bất cứ ai đang ngồi Ngai Sắt." },
  { id: "massey", name: "Nhà Massey", seat: "Stonedance", region: "the-crownlands", levy: 900, troop: "Bộ Binh", marchDays: 6, loyalty: 70, note: "Bờ vịnh phía nam, gốc gác Targaryen từ thời Chinh Phạt." },
  { id: "celtigar", name: "Nhà Celtigar", seat: "Claw Isle", region: "the-crownlands", levy: 800, troop: "Nỏ Thủ", marchDays: 9, loyalty: 66, note: "Cua đỏ trên đảo, dòng máu Valyria và tính hà tiện nổi tiếng." },
  { id: "velaryon", name: "Nhà Velaryon", seat: "Driftmark", region: "the-crownlands", levy: 2000, troop: "Trường Thương", marchDays: 8, loyalty: 72, note: "Ngựa biển bạc — hạm đội mạnh hơn bộ binh nhiều lần." },

  // ── Vùng Reach ──
  { id: "hightower", name: "Nhà Hightower", seat: "Oldtown", region: "the-reach", levy: 5000, troop: "Trường Thương", marchDays: 18, loyalty: 68, note: "Ngọn tháp lửa. Giàu, cổ, và luôn thắp đèn cho mọi phe cùng lúc." },
  { id: "tarly", name: "Nhà Tarly", seat: "Horn Hill", region: "the-reach", levy: 2500, troop: "Bộ Binh", marchDays: 12, loyalty: 76, note: "Randyll Tarly cầm quân giỏi nhất Reach — và không giấu điều đó." },
  { id: "florent", name: "Nhà Florent", seat: "Brightwater Keep", region: "the-reach", levy: 2000, troop: "Cung Thủ", marchDays: 10, loyalty: 58, note: "Cáo giữa hoa. Vẫn cho rằng Highgarden đáng lẽ là của mình." },
  { id: "redwyne", name: "Nhà Redwyne", seat: "The Arbor", region: "the-reach", levy: 2000, troop: "Bộ Binh", marchDays: 20, loyalty: 74, note: "Rượu vang và hạm đội — hai thứ Westeros đều thèm." },
  { id: "rowan", name: "Nhà Rowan", seat: "Goldengrove", region: "the-reach", levy: 1800, troop: "Kỵ Binh", marchDays: 9, loyalty: 72, note: "Cây vàng trên nền bạc, ruộng trải tới chân trời." },

  // ── Vùng Bão Tố ──
  { id: "tarth", name: "Nhà Tarth", seat: "Evenfall Hall", region: "the-stormlands", levy: 900, troop: "Bộ Binh", marchDays: 12, loyalty: 80, note: "Đảo Sapphire. Nghèo hơn cái tên của nó, danh dự thì không." },
  { id: "dondarrion", name: "Nhà Dondarrion", seat: "Blackhaven", region: "the-stormlands", levy: 1200, troop: "Kỵ Binh", marchDays: 11, loyalty: 76, note: "Tia chớp tím. Canh biên giới Dorne đời này qua đời khác." },
  { id: "selmy", name: "Nhà Selmy", seat: "Harvest Hall", region: "the-stormlands", levy: 800, troop: "Hiệp Sĩ", marchDays: 9, loyalty: 82, note: "Nhà sinh ra Barristan Dũng Cảm — cái bóng đó đủ nặng cho cả dòng họ." },
  { id: "penrose", name: "Nhà Penrose", seat: "Parchments", region: "the-stormlands", levy: 1000, troop: "Bộ Binh", marchDays: 7, loyalty: 74, note: "Bút lông trên nền đỏ, giữ lời hơn giữ mạng." },
  { id: "estermont", name: "Nhà Estermont", seat: "Greenstone", region: "the-stormlands", levy: 700, troop: "Dân Binh", marchDays: 13, loyalty: 70, note: "Đảo nhỏ ngoài khơi, họ hàng bên ngoại của nhà Baratheon." },

  // ── Dorne ──
  { id: "yronwood", name: "Nhà Yronwood", seat: "Yronwood", region: "dorne", levy: 3000, troop: "Trường Thương", marchDays: 14, loyalty: 55, note: "Vua Máu Xưa. Quân đông nhất Dorne, và nhớ rất rõ mình từng đứng trên nhà Martell." },
  { id: "dayne", name: "Nhà Dayne", seat: "Starfall", region: "dorne", levy: 1500, troop: "Hiệp Sĩ", marchDays: 16, loyalty: 78, note: "Sao Rơi và thanh Dawn — kiếm sáng như sương sớm." },
  { id: "uller", name: "Nhà Uller", seat: "Hellholt", region: "dorne", levy: 1200, troop: "Kỵ Binh Nhẹ", marchDays: 12, loyalty: 62, note: "Nửa điên, nửa độc. Cả Dorne đều nói vậy." },
  { id: "fowler", name: "Nhà Fowler", seat: "Skyreach", region: "dorne", levy: 1300, troop: "Cung Thủ", marchDays: 15, loyalty: 70, note: "Diều hâu canh Đèo Hoàng Tử, thấy quân địch trước cả quạ." },
  { id: "manwoody", name: "Nhà Manwoody", seat: "Kingsgrave", region: "dorne", levy: 900, troop: "Kỵ Binh Nhẹ", marchDays: 13, loyalty: 72, note: "Sọ đội vương miện — cái tên nhắc một ông vua từng chết ở đây." },

  // ── Quần Đảo Sắt ──
  { id: "harlaw", name: "Nhà Harlaw", seat: "Ten Towers", region: "the-iron-islands", levy: 1500, troop: "Người Sắt (Ironborn)", marchDays: 6, loyalty: 72, note: "Đảo đông dân nhất, và hiếm hoi có người biết đọc sách." },
  { id: "botley", name: "Nhà Botley", seat: "Lordsport", region: "the-iron-islands", levy: 800, troop: "Người Sắt (Ironborn)", marchDays: 2, loyalty: 68, note: "Giữ cảng dưới chân Pyke, sống bằng thuế bến." },
  { id: "goodbrother", name: "Nhà Goodbrother", seat: "Hammerhorn", region: "the-iron-islands", levy: 1200, troop: "Người Sắt (Ironborn)", marchDays: 5, loyalty: 70, note: "Sừng tù và. Đông con, đông thuyền." },
  { id: "drumm", name: "Nhà Drumm", seat: "Old Wyk", region: "the-iron-islands", levy: 900, troop: "Người Sắt (Ironborn)", marchDays: 7, loyalty: 60, note: "Cựu Lệ. Coi thường mọi thứ đến sau Vua Xám." },
  { id: "greyiron", name: "Nhà Greyiron", seat: "Orkmont", region: "the-iron-islands", levy: 700, troop: "Người Sắt (Ironborn)", marchDays: 8, loyalty: 52, note: "Dòng vua cũ đã mạt, vẫn chưa nuốt trôi điều đó." },
];

const BY_REGION = new Map<string, BannermanData[]>();
for (const b of BANNERMEN) {
  const arr = BY_REGION.get(b.region) ?? [];
  arr.push(b);
  BY_REGION.set(b.region, arr);
}

export const BANNERMEN_BY_ID: Record<string, BannermanData> = Object.fromEntries(
  BANNERMEN.map((b) => [b.id, b]),
);

/** Chư hầu của một vùng (rỗng nếu vùng chưa có bảng chư hầu). */
export function bannermenOfRegion(regionId: string): BannermanData[] {
  return BY_REGION.get(regionId) ?? [];
}

/** Tổng quân chư hầu một vùng dốc ra được nếu ai cũng toàn tâm. */
export function regionLevyPotential(regionId: string): number {
  return bannermenOfRegion(regionId).reduce((s, b) => s + b.levy, 0);
}
