/**
 * CheckMap (5bis.2b) — bảng ánh xạ Việc → (Chỉ Số, Kỹ Năng). DATA THUẦN,
 * chỉnh được không đụng engine. Tên chỉ số khớp "Chỉ Số Cốt Lõi" (5.1f-A),
 * tên kỹ năng khớp danh mục 5.1f-D.
 */
export type CoreStatName = "Sức Mạnh" | "Nhanh Nhẹn" | "Thể Chất" | "Trí Tuệ" | "Tinh Tường" | "Uy Tín";

export interface CheckDef {
  id: string;
  /** mô tả ngắn cho UI/AI. */
  label: string;
  chinh: CoreStatName;
  kyNang: string;
  /** chỉ số phụ — đóng góp nửa hệ số. */
  phu?: CoreStatName;
  /** opposed: DC động từ (chỉ số + kỹ năng) của ĐỐI PHƯƠNG thay vì DC cố định. */
  opposed?: { chinh: CoreStatName; kyNang: string };
  ghiChu?: string;
}

export const CHECK_MAP: Record<string, CheckDef> = Object.fromEntries(
  (
    [
      // ---- Nhóm Xã Hội ----
      { id: "persuade", label: "Thuyết phục", chinh: "Uy Tín", kyNang: "Thuyết Phục" },
      { id: "intimidate", label: "Hù doạ", chinh: "Uy Tín", kyNang: "Hù Doạ", phu: "Sức Mạnh" },
      { id: "deceive", label: "Lừa gạt", chinh: "Uy Tín", kyNang: "Lừa Gạt", phu: "Tinh Tường", opposed: { chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn" } },
      { id: "negotiate", label: "Đàm phán", chinh: "Uy Tín", kyNang: "Đàm Phán", phu: "Trí Tuệ", opposed: { chinh: "Uy Tín", kyNang: "Đàm Phán" } },
      { id: "court_etiquette", label: "Nghi thức cung đình", chinh: "Uy Tín", kyNang: "Nghi Thức Cung Đình" },
      { id: "gather_rumor", label: "Thu thập tin đồn", chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn" },
      { id: "detect_lie", label: "Nhận ra nói dối", chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn", opposed: { chinh: "Uy Tín", kyNang: "Lừa Gạt" } },
      { id: "inspire_troops", label: "Khích lệ ba quân", chinh: "Uy Tín", kyNang: "Chỉ Huy Quân" },
      { id: "seduce", label: "Quyến rũ", chinh: "Uy Tín", kyNang: "Thuyết Phục", phu: "Nhanh Nhẹn" },
      // ---- Nhóm Lén Lút & Sinh Tồn ----
      { id: "sneak", label: "Ẩn nấp", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp", opposed: { chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn" } },
      { id: "steal", label: "Trộm cắp", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp" },
      { id: "pick_lock", label: "Cạy khoá", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp", phu: "Trí Tuệ" },
      { id: "track", label: "Lần dấu vết", chinh: "Tinh Tường", kyNang: "Lần Theo Dấu Vết" },
      { id: "hunt", label: "Săn bắn", chinh: "Tinh Tường", kyNang: "Săn Bắn", phu: "Nhanh Nhẹn" },
      { id: "climb", label: "Leo trèo", chinh: "Sức Mạnh", kyNang: "Leo Trèo", phu: "Nhanh Nhẹn" },
      { id: "endure_weather", label: "Chịu đựng thời tiết", chinh: "Thể Chất", kyNang: "Chịu Đựng Thời Tiết" },
      { id: "escape", label: "Tẩu thoát", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp", phu: "Thể Chất" },
      { id: "first_aid", label: "Sơ cứu", chinh: "Trí Tuệ", kyNang: "Sơ Cứu" },
      // ---- Nhóm Trí Tuệ & Học Vấn ----
      { id: "scheme", label: "Bày mưu", chinh: "Trí Tuệ", kyNang: "Mưu Lược", phu: "Tinh Tường" },
      { id: "recall_lore", label: "Nhớ tri thức", chinh: "Trí Tuệ", kyNang: "Học Vấn" },
      { id: "heal_disease", label: "Chữa bệnh", chinh: "Trí Tuệ", kyNang: "Y Thuật Maester" },
      { id: "translate", label: "Dịch ngôn ngữ", chinh: "Trí Tuệ", kyNang: "Ngôn Ngữ" },
      { id: "read_terrain", label: "Đọc địa hình", chinh: "Tinh Tường", kyNang: "Đọc Bản Đồ & Địa Hình", phu: "Trí Tuệ" },
      { id: "appraise", label: "Định giá", chinh: "Trí Tuệ", kyNang: "Buôn Bán", phu: "Tinh Tường" },
      { id: "sense_motive", label: "Đọc vị ý đồ", chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn", phu: "Trí Tuệ" },
      // ---- Nhóm Thủ Công & Kinh Tế ----
      { id: "forge", label: "Rèn đúc", chinh: "Sức Mạnh", kyNang: "Rèn Đúc", phu: "Trí Tuệ" },
      { id: "cook", label: "Nấu ăn", chinh: "Tinh Tường", kyNang: "Nấu Ăn" },
      { id: "trade", label: "Buôn bán", chinh: "Uy Tín", kyNang: "Buôn Bán", phu: "Trí Tuệ" },
      { id: "build", label: "Chỉ đạo xây dựng", chinh: "Trí Tuệ", kyNang: "Xây Dựng" },
      // ---- Chiến đấu ngoài trận ----
      { id: "feat_of_strength", label: "Phô diễn sức mạnh", chinh: "Sức Mạnh", kyNang: "Chiến Đấu Tay Không", phu: "Thể Chất" },
      { id: "horsemanship", label: "Cưỡi ngựa khó", chinh: "Nhanh Nhẹn", kyNang: "Cưỡi Ngựa Chiến" },
      { id: "quick_draw", label: "Phản xạ rút vũ khí", chinh: "Nhanh Nhẹn", kyNang: "" },
      { id: "disarm_trap", label: "Gỡ bẫy", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp", phu: "Tinh Tường" },
      // ---- Ma Thuật (gated Era + thiên phú — 5.1f) ----
      { id: "warg", label: "Nhập hồn thú", chinh: "Tinh Tường", kyNang: "Nhập Hồn Thú", phu: "Trí Tuệ" },
      { id: "green_dream", label: "Chiêm mộng", chinh: "Tinh Tường", kyNang: "Chiêm Mộng" },
      { id: "fire_magic", label: "Thuật lửa R'hllor", chinh: "Trí Tuệ", kyNang: "Thuật Lửa", phu: "Uy Tín" },
      { id: "brew_poison", label: "Độc dược", chinh: "Trí Tuệ", kyNang: "Độc Dược", phu: "Tinh Tường" },
      { id: "faceless_art", label: "Nghệ thuật Vô Diện", chinh: "Nhanh Nhẹn", kyNang: "Nghệ Thuật Vô Diện", phu: "Uy Tín" },
      // ---- Mưu đồ (mục 14.3) — opposed vs phòng vệ mục tiêu (Ngự Lâm, nếm thức ăn, cảnh giác) ----
      { id: "assassinate", label: "Ám sát", chinh: "Nhanh Nhẹn", kyNang: "Ẩn Nấp", phu: "Tinh Tường", opposed: { chinh: "Tinh Tường", kyNang: "Thu Thập Tin Đồn" } },
      { id: "blackmail", label: "Tống tiền", chinh: "Uy Tín", kyNang: "Hù Doạ", phu: "Trí Tuệ", opposed: { chinh: "Uy Tín", kyNang: "Nghi Thức Cung Đình" } },
    ] satisfies CheckDef[]
  ).map((d) => [d.id, d]),
);

/**
 * Fallback khi AI nêu checkId lạ (5bis.2b): khớp mờ theo id/label,
 * không thấy → null (caller dùng chỉ số trần không kỹ năng — "không bao giờ kẹt").
 */
export function findCheck(checkId: string): CheckDef | null {
  const direct = CHECK_MAP[checkId];
  if (direct) return direct;
  const lower = checkId.toLowerCase().trim();
  for (const def of Object.values(CHECK_MAP)) {
    if (def.id.includes(lower) || lower.includes(def.id) || def.label.toLowerCase().includes(lower)) return def;
  }
  return null;
}
