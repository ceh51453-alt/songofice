// content/westeros/origins.ts
// ============================================================================
// XUẤT THÂN (wizard Bước 1, mục 8.5) — "class nền" có ảnh hưởng CƠ HỌC thật:
// bonus chỉ số + thiên phú tặng + kỹ năng khởi điểm (STARTING_SKILLS_BY_ORIGIN
// trong skills.ts) + GÓI TÀI SẢN ánh xạ thẳng vào state lúc initvar (8.6b).
// ============================================================================
import type { CoreStat } from "./skills";

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
  slot: "Vũ Khí Chính" | "Vũ Khí Phụ" | "Giáp Thân" | "Áo Choàng" | "Vật Phẩm Đặc Biệt";
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
}

export const ORIGINS: OriginDef[] = [
  {
    id: "lord-heir", name: "Lãnh Chúa Kế Vị",
    desc: "Ngươi thừa kế một lãnh địa cùng chư hầu — quyền lực thật, và gánh nặng thật.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường kiếm gia truyền", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["gia truyền"], moTa: "Kiếm thép tốt truyền vài đời" },
      { slot: "Áo Choàng", ten: "Áo choàng huy hiệu Nhà", phamChat: "Tinh Xảo", thuocTinh: { "Chống Chịu": 2 }, moTa: "Khoác huy hiệu gia tộc" },
    ],
    items: [{ ten: "Ấn tín lãnh chúa", soLuong: 1, moTa: "Chứng nhận quyền cai trị" }],
    assets: {
      vang: 5000, luongThuc: 20000, thuNhapKy: 2000, chiPhiKy: 1200,
      lanhDia: { ten: "Lãnh địa tổ truyền", moTa: "Toà thành nhỏ cùng làng mạc phụ thuộc, có quân đồn trú", danSo: 8000, trungThanh: 60 },
      moTa: "Lãnh địa + chư hầu: mở ngay lối chơi quản trị/chiến lược — và nhiều kẻ dòm ngó",
    },
    reputation: { vinhDu: 10, uyDung: 5 },
    ghiChu: "Nối lãnh địa (10) + kinh tế (15) ngay từ đầu",
  },
  {
    id: "minor-noble", name: "Quý Tộc Nhỏ",
    desc: "Có tước vị và trang viên nhỏ — đủ để bước vào giới quý tộc, chưa đủ để ai nể sợ.",
    statBonus: { "Uy Tín": 2, "Trí Tuệ": 1 }, extraPointBuy: 0,
    giftTalentIds: ["highborn-charm"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm dài", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Kiếm thép tiêu chuẩn" },
      { slot: "Áo Choàng", ten: "Áo choàng lụa thêu", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Trang phục quý tộc" },
    ],
    items: [],
    assets: { vang: 2000, luongThuc: 5000, thuNhapKy: 500, chiPhiKy: 300, moTa: "Trang viên nhỏ, thu nhập ổn định" },
    reputation: { vinhDu: 5 },
    ghiChu: "Có tước nhỏ, không lãnh địa lớn",
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
  },
  {
    id: "spy-assassin", name: "Điệp Viên / Sát Thủ",
    desc: "Ngươi sống trong bóng tối, nghe điều không ai được nghe, làm điều không ai dám nhận.",
    statBonus: { "Nhanh Nhẹn": 2, "Tinh Tường": 1 }, extraPointBuy: 0,
    giftTalentIds: ["keen-eye"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Dao găm thép tốt", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 3 }, dacTinh: ["giấu được"], moTa: "Nhỏ, sắc, kín đáo" },
      { slot: "Áo Choàng", ten: "Áo choàng ẩn thân", phamChat: "Thường", thuocTinh: {}, dacTinh: ["ẩn nấp"], moTa: "Màu tối, không bắt sáng" },
    ],
    items: [{ ten: "Lọ độc dược", soLuong: 2, moTa: "Chậm mà chắc" }],
    assets: { vang: 200, luongThuc: 30, thuNhapKy: 0, chiPhiKy: 20, moTa: "Đồ nghề của bóng tối" },
    reputation: { xaoQuyet: 10, vinhDu: -5 },
    ghiChu: "Tuyến mưu đồ/ám sát (nối 14)",
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
  },
  {
    id: "braavosi-bravo", name: "Kiếm Khách Bravo",
    desc: "Vũ điệu nước, kiếm mỏng và sự kiêu hãnh của một công dân thành Braavos.",
    statBonus: { "Nhanh Nhẹn": 3 }, extraPointBuy: 0,
    giftTalentIds: ["catlike"],
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Kiếm Braavos", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 4 }, dacTinh: ["xuyên giáp"], moTa: "Mỏng, nhẹ và cực kỳ chết chóc" },
      { slot: "Áo Choàng", ten: "Áo choàng rực rỡ", phamChat: "Tinh Xảo", thuocTinh: {}, moTa: "Chứng minh sự tự tin của một Bravo" },
    ],
    items: [],
    assets: { vang: 200, luongThuc: 50, thuNhapKy: 0, chiPhiKy: 20, moTa: "Không tài sản lớn, chỉ có danh tiếng trên đường phố" },
    reputation: { uyDung: 5, vinhDu: 5 },
    ghiChu: "Né tránh cực tốt, sát thương cao nhưng mỏng manh",
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
      lanhDia: { ten: "Dinh thự Magister", moTa: "Dinh thự sang trọng với đội lính đánh thuê bảo vệ", danSo: 2000, trungThanh: 80 },
      moTa: "Nắm quyền lực tài chính và chính trị tại Essos",
    },
    reputation: { xaoQuyet: 8, uyDung: 2 },
    ghiChu: "Khởi đầu giàu có, thiên về ngoại giao/mưu đồ",
  },
];

export const ORIGINS_BY_ID: Record<string, OriginDef> = Object.fromEntries(ORIGINS.map((o) => [o.id, o]));
