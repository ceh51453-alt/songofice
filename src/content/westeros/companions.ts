// content/westeros/companions.ts
// ============================================================================
// TÂM PHÚC KHỞI ĐẦU (wizard Bước 8, mục 8.5) — nguyên mẫu NPC đồng hành.
// Engine tạo NPC theo NpcSchema (5.1b) với Hảo Cảm/Tin Cậy cao + năng lực khớp.
// ============================================================================

export interface CompanionArchetype {
  id: string;
  name: string;
  desc: string;
  chucVu: string;
  haoCam: number; // Thân Thiết/Tri Kỷ (5.1d)
  tinCay: number;
  loaiQuanHe: ("Thuộc Hạ" | "Bằng Hữu" | "Thầy" | "Đồng Minh")[];
  nangLuc: { voLuc: number; thongSoai: number; triMuu: number; ngoaiGiao: number };
  netTinhCach: string[];
  tuoi: number;
}

export const COMPANIONS: CompanionArchetype[] = [
  { id: "loyal-guard", name: "Vệ Sĩ Trung Thành", chucVu: "Vệ sĩ",
    desc: "Một tay kiếm dày dạn thề bảo vệ ngươi bằng mạng sống — ít lời, chắc đòn.",
    haoCam: 55, tinCay: 70, loaiQuanHe: ["Thuộc Hạ"],
    nangLuc: { voLuc: 65, thongSoai: 30, triMuu: 25, ngoaiGiao: 15 },
    netTinhCach: ["trung thành", "ít nói", "cảnh giác"], tuoi: 38 },
  { id: "cunning-advisor", name: "Quân Sư Lọc Lõi", chucVu: "Quân sư",
    desc: "Bộ óc mưu lược từng phục vụ nhiều chủ — giờ chọn ngươi, vì lý do của riêng lão.",
    haoCam: 45, tinCay: 55, loaiQuanHe: ["Thuộc Hạ", "Thầy"],
    nangLuc: { voLuc: 10, thongSoai: 40, triMuu: 70, ngoaiGiao: 60 },
    netTinhCach: ["mưu mô", "kín đáo", "thực dụng"], tuoi: 55 },
  { id: "childhood-friend", name: "Bạn Nối Khố", chucVu: "Bằng hữu",
    desc: "Lớn lên cùng ngươi từ thuở chăn trâu bắn sáo — người duy nhất dám nói thật vào mặt ngươi.",
    haoCam: 70, tinCay: 75, loaiQuanHe: ["Bằng Hữu"],
    nangLuc: { voLuc: 40, thongSoai: 25, triMuu: 35, ngoaiGiao: 35 },
    netTinhCach: ["thẳng thắn", "hài hước", "gan dạ"], tuoi: 24 },
  { id: "sworn-knight", name: "Hiệp Sĩ Thề Trung", chucVu: "Hiệp sĩ hộ vệ",
    desc: "Một hiệp sĩ mang nợ ân nghĩa với gia tộc ngươi, thề phụng sự tới chết — danh dự là hơi thở của nàng/chàng.",
    haoCam: 50, tinCay: 80, loaiQuanHe: ["Thuộc Hạ"],
    nangLuc: { voLuc: 70, thongSoai: 45, triMuu: 30, ngoaiGiao: 30 },
    netTinhCach: ["trọng danh dự", "cứng nhắc", "quả cảm"], tuoi: 30 },
  { id: "sly-handmaid", name: "Hầu Cận Tinh Ranh", chucVu: "Hầu cận",
    desc: "Bề ngoài chỉ là kẻ hầu — nhưng tai nàng nghe được mọi lời thì thầm trong sảnh, và miệng nàng kín như mộ.",
    haoCam: 50, tinCay: 60, loaiQuanHe: ["Thuộc Hạ"],
    nangLuc: { voLuc: 10, thongSoai: 10, triMuu: 55, ngoaiGiao: 50 },
    netTinhCach: ["tinh ranh", "kín miệng", "quan sát"], tuoi: 26 },
  { id: "mystic-guide", name: "Đạo Sĩ Bí Ẩn", chucVu: "Cố vấn tâm linh",
    desc: "Một kẻ lập dị thấu hiểu những thế lực siêu nhiên. Người đời gọi họ là kẻ điên, nhưng ngươi thấy được sự uyên bác.",
    haoCam: 40, tinCay: 45, loaiQuanHe: ["Thầy", "Thuộc Hạ"],
    nangLuc: { voLuc: 15, thongSoai: 15, triMuu: 75, ngoaiGiao: 45 },
    netTinhCach: ["lập dị", "tâm linh", "bí ẩn"], tuoi: 60 },
  { id: "exiled-noble", name: "Quý Tộc Lưu Vong", chucVu: "Bằng hữu",
    desc: "Từng ở trên đỉnh cao danh vọng nhưng giờ tay trắng. Đi theo ngươi mong chờ ngày phục hận.",
    haoCam: 50, tinCay: 50, loaiQuanHe: ["Bằng Hữu", "Đồng Minh"],
    nangLuc: { voLuc: 45, thongSoai: 50, triMuu: 40, ngoaiGiao: 65 },
    netTinhCach: ["kiêu ngạo", "tham vọng", "thù dai"], tuoi: 32 },
  { id: "master-assassin", name: "Sát Thủ Bóng Đêm", chucVu: "Sát thủ",
    desc: "Một lưỡi dao giấu trong bóng tối. Ngươi không biết rõ thân thế thực sự của kẻ này, nhưng cái giá phải trả là sự bảo vệ tuyệt đối.",
    haoCam: 30, tinCay: 40, loaiQuanHe: ["Thuộc Hạ"],
    nangLuc: { voLuc: 80, thongSoai: 10, triMuu: 60, ngoaiGiao: 10 },
    netTinhCach: ["tàn nhẫn", "cô độc", "im lặng"], tuoi: 28 },
  { id: "loyal-maester", name: "Học Sĩ Tận Tụy", chucVu: "Học sĩ",
    desc: "Một học sĩ già được Citadel phái đến hoặc tự nguyện phục vụ. Nguồn kiến thức vô tận của ngươi.",
    haoCam: 60, tinCay: 85, loaiQuanHe: ["Thuộc Hạ"],
    nangLuc: { voLuc: 5, thongSoai: 10, triMuu: 80, ngoaiGiao: 50 },
    netTinhCach: ["thông thái", "ôn hòa", "cẩn trọng"], tuoi: 65 },
  { id: "mercenary-captain", name: "Đội Trưởng Đánh Thuê", chucVu: "Tướng lĩnh",
    desc: "Một chiến binh từng trải quen mùi máu và tiền. Ban đầu đi theo vì tiền, nhưng giờ đã có chút tôn trọng dành cho ngươi.",
    haoCam: 40, tinCay: 50, loaiQuanHe: ["Thuộc Hạ", "Đồng Minh"],
    nangLuc: { voLuc: 65, thongSoai: 65, triMuu: 35, ngoaiGiao: 25 },
    netTinhCach: ["thực dụng", "thô lỗ", "dũng cảm"], tuoi: 40 },
];

export const COMPANIONS_BY_ID: Record<string, CompanionArchetype> = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));
