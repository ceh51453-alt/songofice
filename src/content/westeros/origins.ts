// content/westeros/origins.ts
// ============================================================================
// XUẤT THÂN (wizard Bước 1, mục 8.5) — "class nền" có ảnh hưởng CƠ HỌC thật:
// bonus chỉ số + thiên phú tặng + kỹ năng khởi điểm (STARTING_SKILLS_BY_ORIGIN
// trong skills.ts) + GÓI TÀI SẢN ánh xạ thẳng vào state lúc initvar (8.6b).
// ============================================================================
import type { CoreStat } from "./skills";
import { resolveRegionId } from "../world/geography";

export interface AssetPackage {
  vang: number;
  luongThuc: number;
  thuNhapKy: number;
  chiPhiKy: number;
  /** có lãnh địa khởi đầu (mở lối chơi quản trị — nối mục 10). */
  lanhDia?: { ten: string; moTa: string; danSo: number; trungThanh: number };
  moTa: string;
}

export interface EquipGrant {
  slot: "Vũ Khí Chính" | "Vũ Khí Phụ" | "Giáp Thân" | "Khiên" | "Vật Phẩm Đặc Biệt";
  ten: string;
  phamChat: "Thô Kệch" | "Thường" | "Tinh Xảo";
  thuocTinh: Record<string, number>;
  dacTinh?: string[];
  moTa: string;
}

export interface OriginDef {
  id: string;
  name: string;
  desc: string;
  /** Geography ids used to scope this background in the character wizard. */
  continentIds: string[];
  regionIds?: string[];
  cultureIds?: string[];
  /** bonus chỉ số nền — cộng SAU point-buy (8.5 Bước 2). */
  statBonus: Partial<Record<CoreStat, number>>;
  /** điểm point-buy cộng thêm. */
  extraPointBuy: number;
  /** thiên phú TẶNG (id trong talents.ts) — không tốn điểm. */
  giftTalentIds: string[];
  /** trang bị khởi đầu (gói dựng sẵn Bước 5). */
  equipment: EquipGrant[];
  /** vật phẩm túi đồ khởi đầu. */
  items: { ten: string; soLuong: number; moTa: string }[];
  assets: AssetPackage;
  /** danh vọng khởi điểm (16.4, 4 trục ±100). */
  reputation: { vinhDu?: number; nhanTu?: number; uyDung?: number; xaoQuyet?: number };
  ghiChu: string;
  /** Tước vị mặc định khi khởi đầu bằng xuất thân này. */
  tuocVi: string;
}

type OriginSeed = Omit<OriginDef, "continentIds"> & Partial<Pick<OriginDef, "continentIds">>;

function worldOrigin(opts: {
  id: string;
  name: string;
  desc: string;
  continentIds: string[];
  regionIds?: string[];
  cultureIds?: string[];
  statBonus: Partial<Record<CoreStat, number>>;
  talent?: string;
  weapon?: string;
  gold?: number;
  reputation?: OriginDef["reputation"];
  tuocVi?: string;
}): OriginSeed {
  return {
    id: opts.id,
    name: opts.name,
    desc: opts.desc,
    continentIds: opts.continentIds,
    regionIds: opts.regionIds,
    cultureIds: opts.cultureIds,
    statBonus: opts.statBonus,
    extraPointBuy: 0,
    giftTalentIds: opts.talent ? [opts.talent] : [],
    equipment: opts.weapon ? [{
      slot: "Vũ Khí Chính",
      ten: opts.weapon,
      phamChat: "Thường",
      thuocTinh: { "Sát Thương Cận": 2 },
      moTa: `Dụng cụ gắn với thân phận ${opts.name.toLocaleLowerCase("vi")}`,
    }] : [],
    items: [],
    assets: {
      vang: opts.gold ?? 100,
      luongThuc: 40,
      thuNhapKy: 0,
      chiPhiKy: 10,
      moTa: "Tài sản và quan hệ phù hợp với xuất thân địa phương",
    },
    reputation: opts.reputation ?? {},
    ghiChu: `Xuất thân bản địa: ${opts.continentIds.join(", ")}`,
    tuocVi: opts.tuocVi ?? "Thường Dân",
  };
}

const ORIGIN_SEEDS: OriginSeed[] = [
  {
    id: "lord-heir", name: "Lãnh Chúa Kế Vị",
    desc: "Ngươi thừa kế một lãnh địa cùng chư hầu — quyền lực thật, và gánh nặng thật.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường kiếm gia truyền", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["gia truyền"], moTa: "Kiếm thép tốt truyền vài đời" },
      { slot: "Khiên", ten: "Áo choàng huy hiệu Nhà", phamChat: "Tinh Xảo", thuocTinh: { "Chống Chịu": 2 }, moTa: "Khoác huy hiệu gia tộc" },
    ],
    items: [{ ten: "Ấn tín lãnh chúa", soLuong: 1, moTa: "Chứng nhận quyền cai trị" }],
    assets: {
      vang: 5000, luongThuc: 20000, thuNhapKy: 2000, chiPhiKy: 1200,
      lanhDia: { ten: "Lãnh địa tổ truyền", moTa: "Toà thành nhỏ cùng làng mạc phụ thuộc, có quân đồn trú", danSo: 15000, trungThanh: 60 },
      moTa: "Lãnh địa + chư hầu: mở ngay lối chơi quản trị/chiến lược — và nhiều kẻ dòm ngó",
    },
    reputation: { vinhDu: 10, uyDung: 5 },
    ghiChu: "Nối lãnh địa (10) + kinh tế (15) ngay từ đầu",
    tuocVi: "Lãnh Chúa",
  },
  {
    id: "minor-noble", name: "Quý Tộc Nhỏ",
    desc: "Có tước vị và trang viên nhỏ — đủ để bước vào giới quý tộc, chưa đủ để ai nể sợ.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm dài", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Kiếm thép tiêu chuẩn" },
      { slot: "Khiên", ten: "Áo choàng lụa thêu", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Trang phục quý tộc" },
    ],
    items: [],
    assets: { vang: 2000, luongThuc: 5000, thuNhapKy: 500, chiPhiKy: 300, moTa: "Trang viên nhỏ, thu nhập ổn định" },
    reputation: { vinhDu: 5 },
    ghiChu: "Có tước nhỏ, không lãnh địa lớn",
    tuocVi: "Hiệp Sĩ",
  },
  {
    id: "knight", name: "Hiệp Sĩ",
    desc: "Được phong tước hiệp sĩ — sống bằng danh dự, giải đấu và lưỡi kiếm.",
    statBonus: { "Sức Mạnh": 2, "Thể Chất": 1 }, extraPointBuy: 0,
    giftTalentIds: ["born-swordsman"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường kiếm hiệp sĩ", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Kiếm được rèn tốt" },
      { slot: "Vũ Khí Phụ", ten: "Khiên gỗ bọc thép", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 3 }, moTa: "Khiên chiến tiêu chuẩn" },
      { slot: "Giáp Thân", ten: "Giáp xích", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 4 }, moTa: "Giáp xích toàn thân" },
    ],
    items: [{ ten: "Ngựa chiến", soLuong: 1, moTa: "Chiến mã được huấn luyện" }],
    assets: { vang: 300, luongThuc: 100, thuNhapKy: 0, chiPhiKy: 50, moTa: "Ngựa chiến + giáp xích — sống nhờ phò tá và giải đấu" },
    reputation: { vinhDu: 8, uyDung: 5 },
    ghiChu: "Danh dự hiệp sĩ",
    tuocVi: "Hiệp Sĩ",
  },
  {
    id: "sellsword", name: "Lính Đánh Thuê",
    desc: "Kiếm của ngươi thuộc về kẻ trả giá cao nhất — tự do, và không ai che chở.",
    statBonus: { "Nhanh Nhẹn": 2, "Sức Mạnh": 1 }, extraPointBuy: 0,
    giftTalentIds: ["catlike"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm lính đánh thuê", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Đã qua nhiều trận" },
      { slot: "Giáp Thân", ten: "Giáp da cứng", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 2 }, moTa: "Nhẹ và bền" },
    ],
    items: [],
    assets: { vang: 150, luongThuc: 50, thuNhapKy: 0, chiPhiKy: 30, moTa: "Vũ khí cá nhân + chút tiền công còn lại" },
    reputation: { uyDung: 3, xaoQuyet: 3 },
    ghiChu: "Linh hoạt, không ràng buộc trung thành",
    tuocVi: "Thường Dân",
  },
  {
    id: "maester-novice", name: "Học Trò Học Viện",
    desc: "Ngươi rèn trí óc ở Oldtown — vài mắt xích đã rèn xong, con đường tri thức rộng mở.",
    statBonus: { "Trí Tuệ": 3 }, extraPointBuy: 0,
    giftTalentIds: ["schemer"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Dao nhỏ", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 1 }, moTa: "Dao cắt thuốc" },
    ],
    items: [
      { ten: "Túi thuốc Maester", soLuong: 1, moTa: "Dụng cụ và dược liệu y thuật" },
      { ten: "Sách chép tay", soLuong: 3, moTa: "Tri thức sử và y học" },
    ],
    assets: { vang: 100, luongThuc: 30, thuNhapKy: 0, chiPhiKy: 20, moTa: "Túi thuốc + sách — tri thức là tài sản duy nhất" },
    reputation: { nhanTu: 5 },
    ghiChu: "Tri thức uyên bác, yếu chiến đấu",
    tuocVi: "Thường Dân",
  },
  {
    id: "merchant", name: "Thương Nhân Giàu",
    desc: "Vàng chảy qua tay ngươi như nước — nhưng ở Westeros, vàng không mua được dòng máu.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 }, extraPointBuy: 1,
    giftTalentIds: ["merchant-fortune"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Đoản kiếm trang trí", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Đẹp hơn là sắc" },
    ],
    items: [{ ten: "Sổ sách thương vụ", soLuong: 1, moTa: "Mạng lưới buôn bán và con nợ" }],
    assets: { vang: 3000, luongThuc: 500, thuNhapKy: 300, chiPhiKy: 100, moTa: "Vốn buôn lớn + tuyến thương mại nhỏ — không đất, không quân" },
    reputation: { xaoQuyet: 5 },
    ghiChu: "Giàu tiền mặt, yếu vũ lực & danh vọng",
    tuocVi: "Thường Dân",
  },
  {
    id: "commoner", name: "Thường Dân Cùng Khổ",
    desc: "Ngươi sinh ra không có gì — mọi thứ giành được sẽ là của chính ngươi.",
    statBonus: { "Thể Chất": 2 }, extraPointBuy: 1,
    giftTalentIds: [],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Gậy gỗ cứng", phamChat: "Thô Kệch", thuocTinh: { "Sát Thương Cận": 1 }, moTa: "Vũ khí của kẻ không có gì" },
    ],
    items: [],
    assets: { vang: 10, luongThuc: 5, thuNhapKy: 0, chiPhiKy: 5, moTa: "Gần như trắng tay — bắt đầu từ đáy" },
    reputation: {},
    ghiChu: "Tự do định hình từ con số không",
    tuocVi: "Thường Dân",
  },
  {
    id: "bastard", name: "Con Hoang",
    desc: "Snow, Sand, Rivers... — cái họ nhắc ngươi mãi mãi đứng ngoài. Nhưng con hoang thì lì đòn.",
    statBonus: { "Sức Mạnh": 1, "Nhanh Nhẹn": 1 }, extraPointBuy: 0,
    giftTalentIds: ["ill-reputed"], // khiếm khuyết tặng — hoàn điểm theo cost âm
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm cũ", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Ai đó đã bỏ đi, ngươi nhặt lấy" },
    ],
    items: [],
    assets: { vang: 50, luongThuc: 20, thuNhapKy: 0, chiPhiKy: 10, moTa: "Vũ khí thường + chút tiền dằn túi" },
    reputation: { vinhDu: -8 },
    ghiChu: "Bị kỳ thị nhưng bền bỉ (kiểu Jon/Ramsay)",
    tuocVi: "Thường Dân",
  },
  {
    id: "spy-assassin", name: "Điệp Viên / Sát Thủ",
    desc: "Ngươi sống trong bóng tối, nghe điều không ai được nghe, làm điều không ai dám nhận.",
    statBonus: { "Nhanh Nhẹn": 2, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: ["keen-eye"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Dao găm thép tốt", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 3 }, dacTinh: ["giấu được"], moTa: "Nhỏ, sắc, kín đáo" },
      { slot: "Khiên", ten: "Áo choàng ẩn thân", phamChat: "Thường", thuocTinh: {}, dacTinh: ["ẩn nấp"], moTa: "Màu tối, không bắt sáng" },
    ],
    items: [{ ten: "Lọ độc dược", soLuong: 2, moTa: "Chậm mà chắc" }],
    assets: { vang: 200, luongThuc: 30, thuNhapKy: 0, chiPhiKy: 20, moTa: "Đồ nghề của bóng tối" },
    reputation: { xaoQuyet: 10, vinhDu: -5 },
    ghiChu: "Tuyến mưu đồ/ám sát (nối 14)",
    tuocVi: "Thường Dân",
  },
  {
    id: "old-blood", name: "Kẻ Mang Dòng Máu Cổ",
    desc: "Trong huyết quản ngươi ngủ một thứ xưa cũ — giấc mơ kỳ lạ ngày một rõ hơn.",
    statBonus: { "Trí Tuệ": 1, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: [], // thiên phú ma thuật ẨN chọn ở Bước 3 (gate Era+Nhà)
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Dao săn", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Dao đi rừng" },
    ],
    items: [],
    assets: { vang: 50, luongThuc: 20, thuNhapKy: 0, chiPhiKy: 10, moTa: "Ít của cải — sức mạnh thật đang ngủ" },
    reputation: {},
    ghiChu: "Chỉ chọn được thiên phú ma thuật nếu Era cho phép; thức tỉnh dần",
    tuocVi: "Thường Dân",
  },
  {
    id: "dothraki-rider", name: "Kỵ Sĩ Dothraki",
    desc: "Sinh ra trên lưng ngựa, với thanh arakh trong tay và một khát khao chinh phạt vô tận.",
    statBonus: { "Sức Mạnh": 2, "Thể Chất": 1 }, extraPointBuy: 0,
    giftTalentIds: ["born-swordsman"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Thanh Arakh", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 4 }, moTa: "Lưỡi gươm cong sắc lẹm" },
      { slot: "Giáp Thân", ten: "Áo da sờn", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 1 }, moTa: "Kỵ sĩ Dothraki khinh thường áo giáp" },
    ],
    items: [{ ten: "Ngựa Dothraki", soLuong: 1, moTa: "Ngựa chiến cực kỳ bền bỉ" }],
    assets: { vang: 50, luongThuc: 100, thuNhapKy: 0, chiPhiKy: 10, moTa: "Sống bằng cướp bóc và sức mạnh bầy đàn" },
    reputation: { uyDung: 8, xaoQuyet: 2 },
    ghiChu: "Thiên về chiến đấu cơ động và tàn bạo",
    tuocVi: "Thường Dân",
  },
  {
    id: "braavosi-bravo", name: "Kiếm Khách Bravo",
    desc: "Vũ điệu nước, kiếm mỏng và sự kiêu hãnh của một công dân thành Braavos.",
    statBonus: { "Nhanh Nhẹn": 3 }, extraPointBuy: 0,
    giftTalentIds: ["catlike"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm Braavos", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["xuyên giáp"], moTa: "Mỏng, nhẹ và cực kỳ chết chóc" },
      { slot: "Khiên", ten: "Áo choàng rực rỡ", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Chứng minh sự tự tin của một Bravo" },
    ],
    items: [],
    assets: { vang: 200, luongThuc: 50, thuNhapKy: 0, chiPhiKy: 20, moTa: "Không tài sản lớn, chỉ có danh tiếng trên đường phố" },
    reputation: { uyDung: 5, vinhDu: 5 },
    ghiChu: "Né tránh cực tốt, sát thương cao nhưng mỏng manh",
    tuocVi: "Thường Dân",
  },
  {
    id: "magister-heir", name: "Con Cháu Tổng Trấn (Magister)",
    desc: "Lớn lên trong nhung lụa và quyền lực ngầm tại các Thành Phố Tự Do, mưu mô là bạn đồng hành.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["schemer", "merchant-fortune"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Dao găm khảm ngọc", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Vừa là vũ khí vừa là trang sức" },
    ],
    items: [{ ten: "Sổ cái nợ", soLuong: 1, moTa: "Thông tin những kẻ nợ tiền gia tộc" }],
    assets: {
      vang: 8000, luongThuc: 1000, thuNhapKy: 1500, chiPhiKy: 500,
      lanhDia: { ten: "Dinh thự Magister", moTa: "Dinh thự sang trọng với đội lính đánh thuê bảo vệ", danSo: 5000, trungThanh: 80 },
      moTa: "Nắm quyền lực tài chính và chính trị tại Essos",
    },
    reputation: { xaoQuyet: 8, uyDung: 2 },
    ghiChu: "Khởi đầu giàu có, thiên về ngoại giao/mưu đồ",
    tuocVi: "Lãnh Chúa",
  },
  {
    id: "ironborn-raider", name: "Cướp Biển Đảo Sắt (Ironborn)",
    desc: "Ngươi không cày cấy để sống. Ngươi trả 'giá sắt' cho những gì mình muốn. Sóng gió và máu là lẽ sống của ngươi.",
    statBonus: { "Sức Mạnh": 1, "Thể Chất": 2 }, extraPointBuy: 0,
    giftTalentIds: ["warrior-blood"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Rìu chiến Đảo Sắt", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["phá khiên"], moTa: "Thô kệch nhưng chết chóc" },
      { slot: "Giáp Thân", ten: "Giáp da sồi", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 2 }, moTa: "Nhẹ, không sợ chìm khi ngã xuống nước" },
    ],
    items: [],
    assets: { vang: 100, luongThuc: 50, thuNhapKy: 0, chiPhiKy: 10, moTa: "Vũ khí và một chiếc thuyền dài nhỏ (tài sản chung của hội)" },
    reputation: { uyDung: 6, vinhDu: -2 },
    ghiChu: "Phù hợp để dẫn đầu những cuộc cướp bóc ven biển",
    tuocVi: "Thường Dân",
  },
  {
    id: "wildling-hunter", name: "Thợ Săn Man Tộc (Free Folk)",
    desc: "Ngươi sinh ra ở phương Bắc xa xôi, vượt ngoài Bức Tường. Nơi mà tự do có giá bằng cái lạnh cắt da và cái chết luôn chực chờ.",
    statBonus: { "Thể Chất": 2, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: ["keen-eye"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Giáo xương", phamChat: "Thô Kệch", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Làm từ xương dã thú" },
      { slot: "Khiên", ten: "Áo lông thú dày", phamChat: "Thường", thuocTinh: { "Chống Chịu": 3 }, dacTinh: ["chống rét"], moTa: "Bất chấp bão tuyết" },
    ],
    items: [{ ten: "Đá đánh lửa", soLuong: 1, moTa: "Vật sinh tồn quan trọng nhất" }],
    assets: { vang: 0, luongThuc: 10, thuNhapKy: 0, chiPhiKy: 0, moTa: "Không có khái niệm tiền tệ, chỉ có khả năng sinh tồn" },
    reputation: { vinhDu: -5, uyDung: 3 },
    ghiChu: "Xuất sắc trong sinh tồn, kỹ năng chiến đấu hoang dã",
    tuocVi: "Thường Dân",
  },
  {
    id: "red-priest", name: "Tu Sĩ Đỏ (Red Priest)",
    desc: "Lửa sáng trong đêm tối, và màn đêm đầy rẫy nỗi kinh hoàng. Ngươi mang theo đức tin của R'hllor và phép thuật của ngọn lửa.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 2 }, extraPointBuy: 0,
    giftTalentIds: ["schemer"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Quyền trượng hồng ngọc", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 1 }, dacTinh: ["phép thuật"], moTa: "Một món đồ tế lễ và là công cụ tạo lửa" },
      { slot: "Khiên", ten: "Áo choàng đỏ", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Màu áo đặc trưng của người hầu R'hllor" },
    ],
    items: [{ ten: "Bột phép thuật", soLuong: 5, moTa: "Dùng để tạo ảo ảnh ngọn lửa" }],
    assets: { vang: 500, luongThuc: 100, thuNhapKy: 50, chiPhiKy: 20, moTa: "Sự ủng hộ từ các tín đồ" },
    reputation: { xaoQuyet: 5, uyDung: 2 },
    ghiChu: "Phù hợp để kết hợp thiên phú Ma Thuật",
    tuocVi: "Thường Dân",
  },
  {
    id: "noble-ward", name: "Con Tin / Người Được Bảo Hộ (Ward)",
    desc: "Gia tộc ngươi bại trận, hoặc để củng cố liên minh, ngươi phải lớn lên trong thành trì của kẻ khác. Bạn bè cũng có thể là lính canh.",
    statBonus: { "Uy Tín": 1, "Nhanh Nhẹn": 1, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm tập luyện", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Không sắc bén nhưng rèn được kỹ năng" },
      { slot: "Khiên", ten: "Áo choàng quý tộc", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Tuy là con tin nhưng vẫn giữ tước vị" },
    ],
    items: [],
    assets: { vang: 500, luongThuc: 200, thuNhapKy: 50, chiPhiKy: 100, moTa: "Không sở hữu gì, sống phụ thuộc vào chủ thành" },
    reputation: { vinhDu: 3, xaoQuyet: 2 },
    ghiChu: "Dễ bị lôi cuốn vào vòng xoáy chính trị của gia tộc bảo hộ",
    tuocVi: "Hiệp Sĩ",
  },
  {
    id: "prince-princess", name: "Vương Tử / Vương Nữ",
    desc: "Ngươi sinh ra trong dòng máu hoàng gia hoặc đại gia tộc, từ nhỏ đã được định sẵn cho những điều lớn lao — và những mưu đồ cũng lớn lao không kém.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm", "learned"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm nạm ngọc", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["gia truyền"], moTa: "Vũ khí xứng tầm hoàng tộc" },
      { slot: "Khiên", ten: "Áo choàng nhung", phamChat: "Tinh Xảo", thuocTinh: { "Chống Chịu": 1 }, moTa: "Khoác huy hiệu nhánh chính gia tộc" },
    ],
    items: [{ ten: "Dấu triện hoàng gia/đại gia tộc", soLuong: 1, moTa: "Biểu tượng quyền lực nhánh chính" }],
    assets: { vang: 8000, luongThuc: 5000, thuNhapKy: 1000, chiPhiKy: 500, moTa: "Được gia tộc chu cấp hào phóng" },
    reputation: { vinhDu: 10, uyDung: 8 },
    ghiChu: "Lựa chọn hoàn hảo khi bạn đóng vai anh/chị/em của Vua hoặc Lãnh chúa lớn",
    tuocVi: "Đại Lãnh Chúa",
  },
  {
    id: "distant-relative", name: "Họ Hàng Nhánh Phụ",
    desc: "Ngươi mang họ của đại gia tộc, nhưng lại ở một nhánh rất xa. Tiếng thơm thì có hưởng, nhưng quyền lực và của cải thì phải tự mình giành lấy.",
    statBonus: { "Trí Tuệ": 1, "Nhanh Nhẹn": 1 }, extraPointBuy: 1,
    giftTalentIds: ["schemer"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm tiêu chuẩn", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Vũ khí thường nhưng đủ dùng" },
      { slot: "Khiên", ten: "Áo choàng thêu huy hiệu nhỏ", phamChat: "Thường", thuocTinh: {}, moTa: "Huy hiệu nhánh phụ" },
    ],
    items: [],
    assets: { vang: 500, luongThuc: 200, thuNhapKy: 50, chiPhiKy: 30, moTa: "Một điền trang rất nhỏ ở rìa lãnh thổ" },
    reputation: { vinhDu: 3 },
    ghiChu: "Thích hợp khi đóng vai người họ hàng xa của đại gia tộc",
    tuocVi: "Hiệp Sĩ",
  },
  {
    id: "royal-bastard", name: "Con Hoang Quyền Quý (Great Bastard)",
    desc: "Máu hoàng gia hay đại quý tộc chảy trong huyết quản, nhưng danh phận lại không. Ngươi được ăn học tử tế, nhưng luôn bị nhìn bằng ánh mắt ngờ vực.",
    statBonus: { "Sức Mạnh": 1, "Uy Tín": 1, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["ill-reputed", "warrior-blood"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm thép rèn tay", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Món quà từ người cha lãnh chúa" },
      { slot: "Giáp Thân", ten: "Giáp xích tinh luyện", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Món đồ đắt tiền" },
    ],
    items: [],
    assets: { vang: 1000, luongThuc: 500, thuNhapKy: 100, chiPhiKy: 50, moTa: "Được chu cấp một khoản kha khá để giữ im lặng" },
    reputation: { vinhDu: -10, uyDung: 5, xaoQuyet: 5 },
    ghiChu: "Phù hợp để làm con hoang của một nhân vật quyền lực",
    tuocVi: "Thường Dân",
  },
  {
    id: "sworn-sword", name: "Kiếm Sĩ Tuyên Thệ (Sworn Sword)",
    desc: "Ngươi không mang máu mủ nhà họ, nhưng ngươi đã quỳ gối thề trung thành. Mạng sống của ngươi giờ là lá chắn cho họ.",
    statBonus: { "Sức Mạnh": 2, "Thể Chất": 2 }, extraPointBuy: 0,
    giftTalentIds: ["born-swordsman"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường kiếm", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 4 }, moTa: "Luôn được mài sắc" },
      { slot: "Giáp Thân", ten: "Giáp tấm thép", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Đủ để đỡ tên lạc và khiên đao" },
    ],
    items: [],
    assets: { vang: 100, luongThuc: 50, thuNhapKy: 20, chiPhiKy: 10, moTa: "Ăn lương gia tộc, sống trong doanh trại" },
    reputation: { vinhDu: 8, uyDung: 5 },
    ghiChu: "Hoàn hảo cho người chơi chọn làm Cận vệ / Chư hầu",
    tuocVi: "Hiệp Sĩ",
  },
  {
    id: "time-traveler", name: "Người Xuyên Không",
    desc: "Ngươi mang ký ức và trực giác không thuộc về thời đại này. Đây là xuất thân phụ đặc biệt: chỉ người xuyên không mới có thể tạo liên kết với nhiều hơn một con rồng.",
    statBonus: { "Trí Tuệ": 1, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: [],
    equipment: [],
    items: [],
    assets: { vang: 0, luongThuc: 0, thuNhapKy: 0, chiPhiKy: 0, moTa: "Không có tài sản riêng; giá trị nằm ở ký ức khác thời" },
    reputation: {},
    ghiChu: "Nên chọn kèm một xuất thân thông thường. Bật đặc quyền thuần phục nhiều rồng.",
    tuocVi: "Thường Dân",
  },

  // ── Essos: thành bang, đế quốc, thảo nguyên và vùng Bóng Tối ──
  worldOrigin({
    id: "free-city-artisan", name: "Nghệ Nhân Thành Phố Tự Do",
    desc: "Một thợ thủ công lành nghề của Cửu Thành Phố Tự Do, sống nhờ phường hội, bí quyết nghề và các tuyến buôn qua Biển Hẹp.",
    continentIds: ["essos"], cultureIds: ["braavosi", "pentoshi", "myrish", "tyroshi", "lysene", "volantene", "lorathi", "norvoshi", "qohorik"],
    statBonus: { "Trí Tuệ": 2, "Tinh Tường": 1 }, talent: "learned", weapon: "Búa nghề chắc tay", gold: 450,
  }),
  worldOrigin({
    id: "iron-bank-envoy", name: "Sứ Giả Ngân Hàng Sắt",
    desc: "Người mang khế ước và uy tín Braavos đến tận cung điện các vua; con số, bí mật và lời hứa trả nợ là vũ khí của ngươi.",
    continentIds: ["essos"], regionIds: ["braavos"], cultureIds: ["braavosi"],
    statBonus: { "Trí Tuệ": 2, "Uy Tín": 1 }, talent: "merchant-fortune", weapon: "Đoản kiếm Braavos", gold: 2500, reputation: { xaoQuyet: 6 },
  }),
  worldOrigin({
    id: "unsullied-veteran", name: "Cựu Binh Unsullied",
    desc: "Được rèn trong kỷ luật tàn khốc của Astapor rồi giành lại quyền tự quyết, ngươi chiến đấu như một phần của đội hình không thể lay chuyển.",
    continentIds: ["essos"], regionIds: ["astapor", "yunkai", "meereen"], cultureIds: ["ghiscari"],
    statBonus: { "Thể Chất": 2, "Tinh Tường": 1 }, talent: "iron-constitution", weapon: "Giáo Unsullied", reputation: { vinhDu: 6, uyDung: 5 },
  }),
  worldOrigin({
    id: "freedperson", name: "Người Được Giải Phóng",
    desc: "Xiềng xích đã vỡ nhưng quá khứ vẫn đeo bám; ngươi hiểu đường hầm, chợ lao động và giá thật của tự do ở các thành Ghiscari.",
    continentIds: ["essos"], regionIds: ["astapor", "yunkai", "meereen", "volantis"], cultureIds: ["ghiscari", "volantene"],
    statBonus: { "Thể Chất": 1, "Tinh Tường": 2 }, talent: "tireless", weapon: "Dao lao động", gold: 20, reputation: { nhanTu: 4 },
  }),
  worldOrigin({
    id: "ghiscari-noble", name: "Hậu Duệ Đại Chủ Nô Ghiscari",
    desc: "Sinh trong một gia đình kim tự tháp cổ, ngươi được dạy cai trị, mặc cả và điều khiển các phe phái dưới biểu tượng Harpy.",
    continentIds: ["essos"], regionIds: ["astapor", "yunkai", "meereen", "new-ghis"], cultureIds: ["ghiscari"],
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, talent: "schemer", weapon: "Dao găm Harpy", gold: 6000, tuocVi: "Đại Chủ Nô", reputation: { xaoQuyet: 8, vinhDu: -5 },
  }),
  worldOrigin({
    id: "qartheen-pureborn", name: "Pureborn Qarth",
    desc: "Một người thuộc tầng lớp Pureborn giữa Qarth hoa lệ, quen với nghi lễ, hội thương nhân và những cuộc thương lượng được che sau lụa mỏng.",
    continentIds: ["essos"], regionIds: ["qarth"], cultureIds: ["qartheen"],
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, talent: "silver-tongue", weapon: "Dao ngọc Qarth", gold: 5000, tuocVi: "Pureborn", reputation: { xaoQuyet: 5 },
  }),
  worldOrigin({
    id: "lhazareen-healer", name: "Thầy Thuốc Lhazar",
    desc: "Ngươi chữa bệnh cho những cộng đồng chăn cừu hiền hòa, hiểu thảo dược đồng cỏ và biết cách giữ sự sống qua những cuộc cướp phá.",
    continentIds: ["essos"], regionIds: ["lhazar"], cultureIds: ["lhazareen"],
    statBonus: { "Tinh Tường": 2, "Uy Tín": 1 }, talent: "beloved", weapon: "Gậy chăn cừu", gold: 60, reputation: { nhanTu: 10 },
  }),
  worldOrigin({
    id: "sellsword-officer", name: "Sĩ Quan Đại Đội Tự Do",
    desc: "Ngươi đã sống sót đủ nhiều hợp đồng để chỉ huy lính đánh thuê đa ngôn ngữ, đọc chiến trường và nhận ra một chủ thuê sắp quỵt tiền.",
    continentIds: ["essos", "westeros"], cultureIds: [],
    statBonus: { "Sức Mạnh": 1, "Uy Tín": 2 }, talent: "commander-instinct", weapon: "Trường kiếm lính đánh thuê", gold: 700, tuocVi: "Sĩ Quan", reputation: { uyDung: 7, xaoQuyet: 3 },
  }),
  worldOrigin({
    id: "shadowbinder", name: "Kẻ Trói Bóng Asshai",
    desc: "Một học giả huyền thuật từ thành phố dưới bóng đêm; tri thức của ngươi khiến cả thuyền trưởng lẫn tư tế phải dè chừng.",
    continentIds: ["essos"], regionIds: ["asshai", "shadow-lands"], cultureIds: ["asshaii"],
    statBonus: { "Trí Tuệ": 2, "Tinh Tường": 1 }, talent: "rhllor-chosen", weapon: "Dao thủy tinh đen", gold: 300, reputation: { uyDung: 6, xaoQuyet: 5 },
  }),
  worldOrigin({
    id: "yi-ti-courtier", name: "Quan Lại Yi Ti",
    desc: "Được đào luyện bằng điển lễ, thư pháp và luật lệ hoàng triều, ngươi biết một con dấu đúng chỗ có thể thắng cả một đội quân.",
    continentIds: ["essos"], regionIds: ["yi-ti"], cultureIds: ["yi-tish"],
    statBonus: { "Trí Tuệ": 2, "Uy Tín": 1 }, talent: "perfect-memory", weapon: "Kiếm nghi lễ", gold: 1800, tuocVi: "Quan Lại", reputation: { vinhDu: 4, xaoQuyet: 3 },
  }),
  worldOrigin({
    id: "jogos-nhai-rider", name: "Kỵ Sĩ Jogos Nhai",
    desc: "Ngươi trưởng thành trên lưng zorse giữa đồng bằng phương đông, theo jhat và moonsinger qua chiến tranh bộ tộc lẫn mùa khắc nghiệt.",
    continentIds: ["essos"], regionIds: ["jogos-nhai"], cultureIds: ["jogos-nhai"],
    statBonus: { "Nhanh Nhẹn": 2, "Thể Chất": 1 }, talent: "fleet-footed", weapon: "Cung sừng Jogos Nhai", gold: 40, reputation: { uyDung: 6 },
  }),

  // ── Các lục địa và quần đảo ngoài Westeros/Essos ──
  worldOrigin({
    id: "ibbenese-whaler", name: "Thợ Săn Cá Voi Ibben",
    desc: "Thủy thủ xứ lạnh quen những chuyến đi dài trên Biển Rùng Mình, lưỡi lao nặng và kỷ luật của một thủy đoàn săn cá voi.",
    continentIds: ["ibben"], regionIds: ["ibben"], cultureIds: ["ibbenese"],
    statBonus: { "Sức Mạnh": 2, "Thể Chất": 1 }, talent: "iron-constitution", weapon: "Lao săn cá voi", gold: 180, reputation: { uyDung: 4 },
  }),
  worldOrigin({
    id: "summer-isles-archer", name: "Cung Thủ Goldenheart",
    desc: "Một cung thủ kiêm thủy thủ của Quần Đảo Mùa Hè, mang cung gỗ goldenheart và truyền thống bảo vệ những con tàu thiên nga.",
    continentIds: ["summer-isles"], regionIds: ["summer-islands"], cultureIds: ["summer-islander"],
    statBonus: { "Nhanh Nhẹn": 2, "Tinh Tường": 1 }, talent: "eagle-archer", weapon: "Cung goldenheart", gold: 220, reputation: { vinhDu: 6 },
  }),
  worldOrigin({
    id: "naathi-healer", name: "Người Chữa Lành Naath",
    desc: "Một người gìn giữ sự sống từ Đảo Bướm, kiên định với hòa bình dù thế giới bên ngoài luôn thèm muốn dân Naath làm nô lệ.",
    continentIds: ["sothoryos"], regionIds: ["naath"], cultureIds: ["naathi"],
    statBonus: { "Uy Tín": 2, "Tinh Tường": 1 }, talent: "beloved", gold: 40, reputation: { nhanTu: 12, vinhDu: 4 },
  }),
  worldOrigin({
    id: "basilisk-pirate", name: "Hải Tặc Quần Đảo Basilisk",
    desc: "Ngươi sống giữa các vịnh độc, tàn tích và lá cờ đổi chủ liên tục; bản năng sinh tồn quan trọng hơn mọi lời thề trên bờ.",
    continentIds: ["sothoryos"], regionIds: ["basilisk-isles", "gogossos"], cultureIds: ["basilisk-islander"],
    statBonus: { "Nhanh Nhẹn": 1, "Tinh Tường": 2 }, talent: "keen-eye", weapon: "Mã tấu hải tặc", gold: 160, reputation: { uyDung: 5, xaoQuyet: 8, vinhDu: -5 },
  }),
  worldOrigin({
    id: "sothoryi-guide", name: "Người Dẫn Đường Sothoryos",
    desc: "Ngươi biết đọc dòng nước, dấu thú và những vùng khí độc trong rừng sâu nơi hải đồ của người ngoài chỉ là phỏng đoán.",
    continentIds: ["sothoryos"], regionIds: ["sothoryos-interior"], cultureIds: ["sothoryi"],
    statBonus: { "Thể Chất": 2, "Tinh Tường": 1 }, talent: "tireless", weapon: "Giáo săn rừng", gold: 30, reputation: { uyDung: 4 },
  }),
  worldOrigin({
    id: "ulthos-wanderer", name: "Lữ Khách Ulthos",
    desc: "Một trong số rất ít người bước ra từ bờ rừng Ulthos; ngươi hiểu những lối đi mà bản đồ phương tây chưa từng ghi tên.",
    continentIds: ["ulthos"], regionIds: ["ulthos-coast"], cultureIds: ["ulthosi"],
    statBonus: { "Tinh Tường": 2, "Thể Chất": 1 }, talent: "keen-eye", weapon: "Đoản giáo Ulthos", gold: 20, reputation: { uyDung: 3 },
  }),
  worldOrigin({
    id: "rhoynar-river-sailor", name: "Thủy Thủ Rhoyne",
    desc: "Ngươi lớn lên cùng những dòng sông lớn của Essos, thuộc luồng nước, bến bí mật và di sản của các thành Rhoynar đã mất.",
    continentIds: ["essos"], regionIds: ["rhoyne"], cultureIds: ["rhoynar"],
    statBonus: { "Nhanh Nhẹn": 1, "Tinh Tường": 2 }, talent: "catlike", weapon: "Giáo sông", gold: 120, reputation: { vinhDu: 3 },
  }),
];

const ALL_CONTINENT_IDS = ["westeros", "essos", "ibben", "summer-isles", "sothoryos", "ulthos"];
const MULTI_CONTINENT_ORIGIN_IDS = new Set(["sellsword", "merchant", "commoner", "spy-assassin", "old-blood", "red-priest", "time-traveler"]);
const ESSOS_ORIGIN_IDS = new Set(["dothraki-rider", "braavosi-bravo", "magister-heir"]);

export const ORIGINS: OriginDef[] = ORIGIN_SEEDS.map((origin) => ({
  ...origin,
  regionIds: origin.regionIds?.map(resolveRegionId),
  continentIds: origin.continentIds
    ?? (MULTI_CONTINENT_ORIGIN_IDS.has(origin.id) ? [...ALL_CONTINENT_IDS]
      : ESSOS_ORIGIN_IDS.has(origin.id) ? ["essos"] : ["westeros"]),
}));

export const ORIGINS_BY_ID: Record<string, OriginDef> = Object.fromEntries(ORIGINS.map((o) => [o.id, o]));

export function originsForContinent(continentId: string): OriginDef[] {
  return ORIGINS.filter((origin) => origin.continentIds.includes(continentId));
}
