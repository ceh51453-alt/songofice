/**
 * tableRegistry (Dual Engine) — Mapping giữa StatData (Zod) và SQL tables.
 * Mỗi TableDef mô tả 1 "bảng ảo" tương ứng 1 phần StatData:
 *  - tableName: tên bảng SQL (snake_case)
 *  - statPath: đường path trong StatData
 *  - type: "single" (1 hàng) | "record" (dynamic rows, key = tên) | "array" (append-only)
 *  - columns: định nghĩa cột
 *  - ddl: CREATE TABLE cho AI prompt
 *  - note + examples: hướng dẫn cho AI
 *
 * Bảng được generate từ Zod schema — KHÔNG hardcode data, chỉ hardcode structure.
 */

export interface ColumnDef {
  /** Tên cột SQL (snake_case). */
  sqlName: string;
  /** Tên field tiếng Việt trong StatData. */
  statKey: string;
  /** Kiểu SQL cho DDL. */
  sqlType: string;
  /** Có phải PRIMARY KEY / NOT NULL không. */
  constraint?: string;
  /** Mô tả ngắn cho AI (comment trong DDL). */
  comment?: string;
}

export interface TableDef {
  tableName: string;
  statPath: string;
  type: "single" | "record" | "array";
  columns: ColumnDef[];
  ddl: string;
  note: string;
  examples: {
    insert?: string;
    update?: string;
    delete?: string;
  };
}

// ── Bảng #0: Thế Giới ──
const theGioi: TableDef = {
  tableName: "the_gioi",
  statPath: "Thế Giới",
  type: "single",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY", comment: "Số Hàng (luôn = 1)" },
    { sqlName: "vi_tri", statKey: "Vị Trí", sqlType: "TEXT NOT NULL", comment: "Vị trí hiện tại" },
    { sqlName: "nam", statKey: "Năm", sqlType: "INTEGER NOT NULL", comment: "Năm AC" },
    { sqlName: "ngay", statKey: "Ngày", sqlType: "INTEGER NOT NULL", comment: "Ngày trong năm (1-360)" },
    { sqlName: "mua", statKey: "Mùa", sqlType: "TEXT NOT NULL", comment: "Xuân/Hạ/Thu/Đông" },
    { sqlName: "thoi_tiet", statKey: "Thời Tiết", sqlType: "TEXT", comment: "Thời tiết hiện tại" },
  ],
  ddl: `CREATE TABLE the_gioi (
  row_id INTEGER PRIMARY KEY, -- Số Hàng (luôn = 1)
  vi_tri TEXT NOT NULL, -- Vị trí hiện tại
  nam INTEGER NOT NULL, -- Năm AC
  ngay INTEGER NOT NULL, -- Ngày trong năm (1-360)
  mua TEXT NOT NULL CHECK(mua IN ('Xuân','Hạ','Thu','Đông')), -- Mùa
  thoi_tiet TEXT -- Thời tiết hiện tại
);`,
  note: "Bảng này chỉ có 1 hàng. Cập nhật vị trí khi nhân vật di chuyển, cập nhật thời gian mỗi lượt.",
  examples: {
    update: `UPDATE the_gioi SET vi_tri = 'King''s Landing', ngay = ngay + 3, thoi_tiet = 'Mưa phùn' WHERE row_id = 1;`,
  },
};

// ── Bảng #1: Nhân Vật Chính ──
const nhanVatChinh: TableDef = {
  tableName: "nhan_vat_chinh",
  statPath: "Thông Tin Nhân Vật",
  type: "single",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ho_ten", statKey: "Họ Tên", sqlType: "TEXT NOT NULL", comment: "Tên nhân vật" },
    { sqlName: "nha", statKey: "Nhà", sqlType: "TEXT NOT NULL", comment: "Gia tộc" },
    { sqlName: "xuat_than", statKey: "Xuất Thân", sqlType: "TEXT", comment: "Nguồn gốc" },
    { sqlName: "cap_do", statKey: "Cấp Độ", sqlType: "INTEGER NOT NULL", comment: "Level" },
    { sqlName: "kinh_nghiem", statKey: "Kinh Nghiệm", sqlType: "INTEGER", comment: "EXP" },
    { sqlName: "vang", statKey: "Ngân Khố", sqlType: "INTEGER", comment: "Ngân khố (Đồng Đỏ; 11.760 Đồng = 1 Rồng Vàng)" },
    { sqlName: "hp", statKey: "HP", sqlType: "INTEGER NOT NULL", comment: "Máu hiện tại" },
    { sqlName: "the_luc", statKey: "Thể Lực", sqlType: "INTEGER NOT NULL", comment: "Thể lực hiện tại" },
  ],
  ddl: `CREATE TABLE nhan_vat_chinh (
  row_id INTEGER PRIMARY KEY, -- Số Hàng (luôn = 1)
  ho_ten TEXT NOT NULL, -- Tên nhân vật
  nha TEXT NOT NULL, -- Gia tộc
  xuat_than TEXT, -- Nguồn gốc
  cap_do INTEGER NOT NULL DEFAULT 1, -- Level
  kinh_nghiem INTEGER DEFAULT 0, -- EXP
  vang INTEGER DEFAULT 0, -- Ngân khố, đơn vị Đồng Đỏ (11.760 = 1 Rồng Vàng)
  hp INTEGER NOT NULL, -- Máu hiện tại
  the_luc INTEGER NOT NULL -- Thể lực hiện tại
);`,
  note: "Bảng này chỉ có 1 hàng. `vang` là Ngân Khố theo Đồng Đỏ (không phải số Rồng Vàng). HP/Thể Lực engine quản lý trần; chỉ cần cập nhật khi bị thương/hồi phục.",
  examples: {
    update: `UPDATE nhan_vat_chinh SET hp = hp - 15, vang = vang + 200 WHERE row_id = 1;`,
  },
};

// ── Bảng #2: Chỉ Số Cốt Lõi ──
const chiSoCotLoi: TableDef = {
  tableName: "chi_so_cot_loi",
  statPath: "Chỉ Số Cốt Lõi",
  type: "single",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "suc_manh", statKey: "Sức Mạnh", sqlType: "INTEGER NOT NULL", comment: "1-20" },
    { sqlName: "nhanh_nhen", statKey: "Nhanh Nhẹn", sqlType: "INTEGER NOT NULL", comment: "1-20" },
    { sqlName: "the_chat", statKey: "Thể Chất", sqlType: "INTEGER NOT NULL", comment: "1-20" },
    { sqlName: "tri_tue", statKey: "Trí Tuệ", sqlType: "INTEGER NOT NULL", comment: "1-20" },
    { sqlName: "tinh_tuong", statKey: "Tinh Tường", sqlType: "INTEGER NOT NULL", comment: "1-20" },
    { sqlName: "uy_tin", statKey: "Uy Tín", sqlType: "INTEGER NOT NULL", comment: "1-20" },
  ],
  ddl: `CREATE TABLE chi_so_cot_loi (
  row_id INTEGER PRIMARY KEY, -- Số Hàng (luôn = 1)
  suc_manh INTEGER NOT NULL CHECK(suc_manh BETWEEN 1 AND 20), -- Sức Mạnh
  nhanh_nhen INTEGER NOT NULL CHECK(nhanh_nhen BETWEEN 1 AND 20), -- Nhanh Nhẹn
  the_chat INTEGER NOT NULL CHECK(the_chat BETWEEN 1 AND 20), -- Thể Chất
  tri_tue INTEGER NOT NULL CHECK(tri_tue BETWEEN 1 AND 20), -- Trí Tuệ
  tinh_tuong INTEGER NOT NULL CHECK(tinh_tuong BETWEEN 1 AND 20), -- Tinh Tường
  uy_tin INTEGER NOT NULL CHECK(uy_tin BETWEEN 1 AND 20) -- Uy Tín
);`,
  note: "Bảng này chỉ có 1 hàng. Thang 1-20. Engine tự tính chỉ số phái sinh từ đây.",
  examples: {
    update: `UPDATE chi_so_cot_loi SET suc_manh = suc_manh + 1 WHERE row_id = 1;`,
  },
};

// ── Bảng #3: NPC Chính ──
const npcChinh: TableDef = {
  tableName: "npc_chinh",
  statPath: "Mối Quan Hệ.NPC Chính",
  type: "record",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ho_ten", statKey: "_key", sqlType: "TEXT NOT NULL UNIQUE", comment: "Tên NPC (key)" },
    { sqlName: "nha", statKey: "Nhà", sqlType: "TEXT", comment: "Gia tộc" },
    { sqlName: "chuc_vu", statKey: "Chức Vụ", sqlType: "TEXT", comment: "Vai trò" },
    { sqlName: "do_hao_cam", statKey: "Độ Hảo Cảm", sqlType: "INTEGER NOT NULL DEFAULT 0", comment: "-100 đến 100" },
    { sqlName: "tin_cay", statKey: "Tin Cậy", sqlType: "INTEGER NOT NULL DEFAULT 0", comment: "-100 đến 100" },
    { sqlName: "tuoi", statKey: "Tuổi", sqlType: "INTEGER", comment: "Tuổi hiện tại" },
    { sqlName: "tinh_trang", statKey: "Tình Trạng", sqlType: "TEXT DEFAULT 'Bình Thường'", comment: "Bình Thường/Bị Thương/Bệnh/Bị Giam" },
    { sqlName: "con_song", statKey: "Còn Sống", sqlType: "INTEGER DEFAULT 1", comment: "1=sống, 0=chết" },
  ],
  ddl: `CREATE TABLE npc_chinh (
  row_id INTEGER PRIMARY KEY, -- Số Hàng
  ho_ten TEXT NOT NULL UNIQUE, -- Tên NPC (key định danh)
  nha TEXT, -- Gia tộc
  chuc_vu TEXT, -- Vai trò/Chức vụ
  do_hao_cam INTEGER NOT NULL DEFAULT 0 CHECK(do_hao_cam BETWEEN -100 AND 100), -- Độ Hảo Cảm
  tin_cay INTEGER NOT NULL DEFAULT 0 CHECK(tin_cay BETWEEN -100 AND 100), -- Tin Cậy
  tuoi INTEGER, -- Tuổi
  tinh_trang TEXT DEFAULT 'Bình Thường', -- Tình Trạng
  con_song INTEGER DEFAULT 1 CHECK(con_song IN (0, 1)) -- Còn Sống (1=có, 0=không)
);`,
  note: "Mỗi hàng = 1 NPC. Cập nhật khi quan hệ/trạng thái thay đổi. INSERT khi NPC mới xuất hiện.",
  examples: {
    insert: `INSERT INTO npc_chinh (row_id, ho_ten, nha, chuc_vu, do_hao_cam, tin_cay, tuoi, tinh_trang, con_song) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM npc_chinh), 'Arya Stark', 'Stark', 'Sát Thủ', 65, 40, 18, 'Bình Thường', 1);`,
    update: `UPDATE npc_chinh SET do_hao_cam = do_hao_cam + 10, tin_cay = tin_cay + 5 WHERE ho_ten = 'Tyrion Lannister';`,
    delete: `DELETE FROM npc_chinh WHERE ho_ten = 'Petyr Baelish';`,
  },
};

// ── Bảng #4: Túi Đồ ──
const tuiDo: TableDef = {
  tableName: "tui_do",
  statPath: "Túi Đồ",
  type: "record",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ten_vat_pham", statKey: "_key", sqlType: "TEXT NOT NULL UNIQUE", comment: "Tên vật phẩm (key)" },
    { sqlName: "so_luong", statKey: "Số Lượng", sqlType: "INTEGER NOT NULL DEFAULT 1", comment: "Số lượng" },
    { sqlName: "mo_ta", statKey: "Mô Tả", sqlType: "TEXT", comment: "Mô tả vật phẩm" },
  ],
  ddl: `CREATE TABLE tui_do (
  row_id INTEGER PRIMARY KEY, -- Số Hàng
  ten_vat_pham TEXT NOT NULL UNIQUE, -- Tên Vật Phẩm (key)
  so_luong INTEGER NOT NULL DEFAULT 1 CHECK(so_luong > 0), -- Số Lượng
  mo_ta TEXT -- Mô Tả
);`,
  note: "Mỗi hàng = 1 vật phẩm. INSERT khi nhận mới, UPDATE số lượng khi nhận thêm, DELETE khi dùng hết.",
  examples: {
    insert: `INSERT INTO tui_do (row_id, ten_vat_pham, so_luong, mo_ta) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM tui_do), 'Thư Mật', 1, 'Thư niêm phong mang dấu sói');`,
    update: `UPDATE tui_do SET so_luong = so_luong + 3 WHERE ten_vat_pham = 'Bình Máu';`,
    delete: `DELETE FROM tui_do WHERE ten_vat_pham = 'Chìa Khoá Hầm Ngục';`,
  },
};

// ── Bảng #5: Kỹ Năng ──
const kyNang: TableDef = {
  tableName: "ky_nang",
  statPath: "Kỹ Năng",
  type: "record",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ten_ky_nang", statKey: "_key", sqlType: "TEXT NOT NULL UNIQUE", comment: "Tên kỹ năng (key)" },
    { sqlName: "cap", statKey: "Cấp", sqlType: "INTEGER NOT NULL DEFAULT 0", comment: "Cấp 0-10" },
    { sqlName: "kinh_nghiem", statKey: "Kinh Nghiệm", sqlType: "INTEGER DEFAULT 0", comment: "EXP kỹ năng 0-100" },
    { sqlName: "nhom", statKey: "Nhóm", sqlType: "TEXT", comment: "Chiến Đấu/Sinh Tồn/Xã Hội/Trí Tuệ/Thủ Công/Ma Thuật" },
  ],
  ddl: `CREATE TABLE ky_nang (
  row_id INTEGER PRIMARY KEY,
  ten_ky_nang TEXT NOT NULL UNIQUE, -- Tên Kỹ Năng (key)
  cap INTEGER NOT NULL DEFAULT 0 CHECK(cap BETWEEN 0 AND 10), -- Cấp
  kinh_nghiem INTEGER DEFAULT 0 CHECK(kinh_nghiem BETWEEN 0 AND 100), -- EXP kỹ năng
  nhom TEXT CHECK(nhom IN ('Chiến Đấu','Sinh Tồn','Xã Hội','Trí Tuệ','Thủ Công','Ma Thuật'))
);`,
  note: "Mỗi hàng = 1 kỹ năng. INSERT khi học kỹ năng mới, UPDATE cấp/EXP khi rèn luyện.",
  examples: {
    insert: `INSERT INTO ky_nang (row_id, ten_ky_nang, cap, kinh_nghiem, nhom) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM ky_nang), 'Kiếm Pháp', 3, 45, 'Chiến Đấu');`,
    update: `UPDATE ky_nang SET kinh_nghiem = kinh_nghiem + 15 WHERE ten_ky_nang = 'Ngoại Giao';`,
  },
};

// ── Bảng #6: Thái Độ Các Nhà ──
const thaiDoCacNha: TableDef = {
  tableName: "thai_do_cac_nha",
  statPath: "Thái Độ Các Nhà",
  type: "record",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ten_nha", statKey: "_key", sqlType: "TEXT NOT NULL UNIQUE", comment: "Tên Nhà (key)" },
    { sqlName: "thai_do", statKey: "Thái Độ", sqlType: "TEXT NOT NULL DEFAULT 'Cảnh Giác'", comment: "Tín Nhiệm/Ủng Hộ/Cảnh Giác/Dao Động/Bất Mãn/Địch Ý/Thù Địch" },
    { sqlName: "mo_ta", statKey: "Mô Tả", sqlType: "TEXT", comment: "Mô tả quan hệ" },
  ],
  ddl: `CREATE TABLE thai_do_cac_nha (
  row_id INTEGER PRIMARY KEY,
  ten_nha TEXT NOT NULL UNIQUE, -- Tên Nhà (key)
  thai_do TEXT NOT NULL DEFAULT 'Cảnh Giác' CHECK(thai_do IN ('Tín Nhiệm','Ủng Hộ','Cảnh Giác','Dao Động','Bất Mãn','Địch Ý','Thù Địch')),
  mo_ta TEXT
);`,
  note: "Mỗi hàng = 1 Nhà. Cập nhật khi quan hệ ngoại giao thay đổi.",
  examples: {
    update: `UPDATE thai_do_cac_nha SET thai_do = 'Ủng Hộ', mo_ta = 'Liên minh vững chắc sau trận Blackwater' WHERE ten_nha = 'Tyrell';`,
  },
};

// ── Bảng #7: Nhiệm Vụ ──
const nhiemVu: TableDef = {
  tableName: "nhiem_vu",
  statPath: "Nhiệm Vụ",
  type: "record",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "ten_nhiem_vu", statKey: "_key", sqlType: "TEXT NOT NULL UNIQUE", comment: "Tên quest (key)" },
    { sqlName: "tieu_de", statKey: "Tiêu Đề", sqlType: "TEXT NOT NULL", comment: "Tiêu đề hiển thị" },
    { sqlName: "loai", statKey: "Loại", sqlType: "TEXT", comment: "Cốt Truyện Chính/Phụ/Gia Tộc/Chính Trị/Quân Sự" },
    { sqlName: "trang_thai", statKey: "Trạng Thái", sqlType: "TEXT DEFAULT 'Chưa Nhận'", comment: "Chưa Nhận/Đang Làm/Hoàn Thành/Thất Bại" },
    { sqlName: "mo_ta", statKey: "Mô Tả", sqlType: "TEXT", comment: "Mô tả chi tiết" },
    { sqlName: "phan_thuong", statKey: "Phần Thưởng", sqlType: "TEXT", comment: "Phần thưởng" },
  ],
  ddl: `CREATE TABLE nhiem_vu (
  row_id INTEGER PRIMARY KEY,
  ten_nhiem_vu TEXT NOT NULL UNIQUE, -- Tên Quest (key)
  tieu_de TEXT NOT NULL, -- Tiêu đề
  loai TEXT CHECK(loai IN ('Cốt Truyện Chính','Phụ','Gia Tộc','Chính Trị','Quân Sự')),
  trang_thai TEXT DEFAULT 'Chưa Nhận' CHECK(trang_thai IN ('Chưa Nhận','Đang Làm','Hoàn Thành','Thất Bại')),
  mo_ta TEXT,
  phan_thuong TEXT
);`,
  note: "INSERT khi nhận quest mới, UPDATE tiến độ, DELETE khi hoàn thành/thất bại.",
  examples: {
    insert: `INSERT INTO nhiem_vu (row_id, ten_nhiem_vu, tieu_de, loai, trang_thai, mo_ta) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM nhiem_vu), 'giai_cuu_sansa', 'Giải Cứu Sansa', 'Cốt Truyện Chính', 'Đang Làm', 'Tìm cách giải thoát Sansa khỏi King''s Landing');`,
    update: `UPDATE nhiem_vu SET trang_thai = 'Hoàn Thành' WHERE ten_nhiem_vu = 'giai_cuu_sansa';`,
  },
};

// ── Bảng #8: Danh Vọng ──
const danhVong: TableDef = {
  tableName: "danh_vong",
  statPath: "Danh Vọng",
  type: "single",
  columns: [
    { sqlName: "row_id", statKey: "_rowId", sqlType: "INTEGER", constraint: "PRIMARY KEY" },
    { sqlName: "vinh_du", statKey: "Vinh Dự", sqlType: "INTEGER DEFAULT 0", comment: "-100 đến 100" },
    { sqlName: "nhan_tu", statKey: "Nhân Từ", sqlType: "INTEGER DEFAULT 0", comment: "-100 đến 100" },
    { sqlName: "uy_dung", statKey: "Uy Dũng", sqlType: "INTEGER DEFAULT 0", comment: "-100 đến 100" },
    { sqlName: "xao_quyet", statKey: "Xảo Quyệt", sqlType: "INTEGER DEFAULT 0", comment: "-100 đến 100" },
  ],
  ddl: `CREATE TABLE danh_vong (
  row_id INTEGER PRIMARY KEY, -- luôn = 1
  vinh_du INTEGER DEFAULT 0 CHECK(vinh_du BETWEEN -100 AND 100), -- Vinh Dự
  nhan_tu INTEGER DEFAULT 0 CHECK(nhan_tu BETWEEN -100 AND 100), -- Nhân Từ
  uy_dung INTEGER DEFAULT 0 CHECK(uy_dung BETWEEN -100 AND 100), -- Uy Dũng
  xao_quyet INTEGER DEFAULT 0 CHECK(xao_quyet BETWEEN -100 AND 100) -- Xảo Quyệt
);`,
  note: "Bảng này chỉ có 1 hàng. Cập nhật khi hành động ảnh hưởng danh tiếng. Dùng delta (ví dụ +5, -10).",
  examples: {
    update: `UPDATE danh_vong SET vinh_du = vinh_du + 5, uy_dung = uy_dung + 3 WHERE row_id = 1;`,
  },
};

// ── Registry export ──

/** Toàn bộ bảng mặc định. */
export const DEFAULT_TABLE_REGISTRY: readonly TableDef[] = [
  theGioi,
  nhanVatChinh,
  chiSoCotLoi,
  npcChinh,
  tuiDo,
  kyNang,
  thaiDoCacNha,
  nhiemVu,
  danhVong,
] as const;

/** Tìm TableDef theo tên bảng SQL. */
export function findTable(tableName: string): TableDef | undefined {
  return DEFAULT_TABLE_REGISTRY.find(
    (t) => t.tableName.toLowerCase() === tableName.toLowerCase(),
  );
}
