// content/westeros/talents.ts
// ============================================================================
// NGÂN HÀNG THIÊN PHÚ (Talent Bank) — dữ liệu thuần cho hệ nhân vật (mục 5.1f-C).
// Field "Hiệu Ứng" là CHUỖI MÁY-ĐỌC: "<Chỉ Số><+/-số>, ..." — engine parseEffect (5.1f-C1)
//   tách bằng regex và cộng thẳng vào Chỉ Số Cốt Lõi / Chỉ Số Phái Sinh. AI KHÔNG tự tính.
// Gate theo Era (mảng eras rỗng = mọi Era). Ma thuật cần đúng Era + xuất thân hợp lệ.
// Chỉnh file này = đổi ngân hàng thiên phú, KHÔNG đụng engine.
// ============================================================================

export type TalentCategory =
  | "Chiến Đấu" | "Xã Hội" | "Trí Tuệ" | "Thể Chất"
  | "Ma Thuật" | "Xuất Thân" | "Khiếm Khuyết";

export interface TalentDef {
  id: string;
  name: string;
  category: TalentCategory;
  effect: string;              // chuỗi máy-đọc cho parseEffect (5.1f-C1)
  condition?: string;          // ngữ cảnh áp (mô tả cho AI); engine cộng phần vô điều kiện
  narrative: string;           // màu tường thuật mở ra (đưa vào prompt cho AI)
  cost?: number;               // điểm tạo nhân vật tiêu tốn (khiếm khuyết = âm, HOÀN điểm)
  eras?: string[];             // Era khả dụng (rỗng = mọi Era)
  requires?: string[];         // điều kiện: "origin:kẻ-mang-dòng-máu-cổ", "house:stark", "era-magic"
  hidden?: boolean;            // thiên phú tiềm ẩn, chưa cộng effect cho tới khi "thức tỉnh"
  incompatibleWith?: string[]; // id thiên phú xung khắc (không chọn cùng)
}

// —————————————————————————————————————————————————————————————
// NHÓM CHIẾN ĐẤU
// —————————————————————————————————————————————————————————————
export const COMBAT_TALENTS: TalentDef[] = [
  { id: "warrior-blood", name: "Dòng Máu Chiến Binh", category: "Chiến Đấu",
    effect: "Sức Mạnh+2, Sát Thương Cận+1", cost: 2,
    narrative: "Bản năng chiến đấu chảy trong huyết quản — ngươi đọc trận đánh bằng trực giác." },
  { id: "born-swordsman", name: "Kiếm Sĩ Thiên Bẩm", category: "Chiến Đấu",
    effect: "Sát Thương Cận+2", cost: 2, condition: "khi dùng kiếm",
    narrative: "Ngươi học chiêu thức nhanh hơn người thường; đường kiếm như đã ở sẵn trong tay. (Kỹ năng Kiếm & Khiên khởi điểm +2 cấp — engine áp lúc tạo)" },
  { id: "eagle-archer", name: "Cung Thủ Đại Bàng", category: "Chiến Đấu",
    effect: "Sát Thương Xa+3, Nhanh Nhẹn+1", cost: 3,
    narrative: "Mắt ngươi bắt được mục tiêu người thường không thấy; mũi tên đi theo ý muốn." },
  { id: "berserker", name: "Cuồng Chiến", category: "Chiến Đấu",
    effect: "Sức Mạnh+3, Phòng Thủ-2", cost: 2, condition: "khi HP thấp, càng đau càng mạnh",
    narrative: "Cơn thịnh nộ khiến ngươi quên đau — nhưng cũng quên phòng thủ. Kẻ địch sợ ánh mắt đỏ ngầu ấy." },
  { id: "duelist", name: "Cao Thủ Đấu Tay Đôi", category: "Chiến Đấu",
    effect: "Nhanh Nhẹn+2", cost: 2, condition: "trong đấu tay đôi 1v1 (trial by combat)",
    narrative: "Một-đối-một, ngươi gần như bất bại; ngươi đọc được nhịp thở đối thủ." },
  { id: "commander-instinct", name: "Thiên Phú Thống Soái", category: "Chiến Đấu",
    effect: "Trí Tuệ+1, Uy Tín+1", cost: 3, condition: "khi chỉ huy quân (nối 7.7)",
    narrative: "Ngươi thấy chiến trường như bàn cờ; binh sĩ tin tưởng đi theo mệnh lệnh ngươi. (Kỹ năng Chỉ Huy Quân khởi điểm cao)" },
];

// —————————————————————————————————————————————————————————————
// NHÓM THỂ CHẤT
// —————————————————————————————————————————————————————————————
export const PHYSICAL_TALENTS: TalentDef[] = [
  { id: "catlike", name: "Thân Thủ Mèo Rừng", category: "Thể Chất",
    effect: "Nhanh Nhẹn+2, Phòng Thủ+2", cost: 3,
    narrative: "Ngươi né đòn theo bản năng, leo trèo như không, ngã cao mà không hề hấn." },
  { id: "giant-frame", name: "Sức Vóc Khổng Lồ", category: "Thể Chất",
    effect: "Sức Mạnh+3, Tải Trọng+20, Nhanh Nhẹn-1", cost: 2,
    narrative: "Vóc dáng ngươi khiến kẻ khác chùn bước; ngươi uy hiếp chỉ bằng cách đứng đó — nhưng nặng nề." },
  { id: "iron-constitution", name: "Thể Trạng Sắt", category: "Thể Chất",
    effect: "Thể Chất+2, Chống Chịu+15", cost: 3,
    narrative: "Độc, rét, bệnh tật khó quật ngã ngươi; ngươi chịu đựng cực hạn mà người khác đã gục." },
  { id: "fleet-footed", name: "Chân Chạy Như Bay", category: "Thể Chất",
    effect: "Nhanh Nhẹn+2", cost: 2, condition: "khi chạy trốn/truy đuổi",
    narrative: "Ít ai đuổi kịp ngươi; ngươi luôn giành được lối thoát." },
  { id: "tireless", name: "Sức Bền Vô Tận", category: "Thể Chất",
    effect: "Thể Lực Tối Đa+20, Thể Chất+1", cost: 2,
    narrative: "Ngươi hành quân ngày dài không mệt; trong trận kéo dài, ngươi trụ lâu hơn mọi người." },
];

// —————————————————————————————————————————————————————————————
// NHÓM XÃ HỘI
// —————————————————————————————————————————————————————————————
export const SOCIAL_TALENTS: TalentDef[] = [
  { id: "silver-tongue", name: "Lưỡi Bạc", category: "Xã Hội",
    effect: "Uy Tín+3", cost: 3, condition: "khi thuyết phục/đàm phán",
    narrative: "Lời ngươi nói lay chuyển đám đông; kẻ thù cũng phải dừng lại mà nghe." },
  { id: "highborn-charm", name: "Duyên Quý Nhân", category: "Xã Hội",
    effect: "Uy Tín+1", cost: 2,
    narrative: "Người lạ dễ sinh thiện cảm với ngươi. (NPC khởi đầu +10 Hảo Cảm — engine áp)" },
  { id: "intimidating", name: "Uy Thế Áp Đảo", category: "Xã Hội",
    effect: "Uy Tín+2", cost: 2, condition: "khi hù doạ",
    narrative: "Ánh mắt ngươi khiến kẻ yếu bóng vía khuất phục; ngươi không cần rút kiếm cũng khiến người ta run." },
  { id: "master-liar", name: "Bậc Thầy Dối Trá", category: "Xã Hội",
    effect: "Uy Tín+2, Tinh Tường+1", cost: 3, condition: "khi lừa gạt/che giấu",
    narrative: "Ngươi nói dối không chớp mắt; ngay cả người tinh khôn cũng khó bắt bài." },
  { id: "beloved", name: "Được Dân Yêu Mến", category: "Xã Hội",
    effect: "Uy Tín+1", cost: 2, condition: "với dân thường và binh sĩ",
    narrative: "Thường dân và lính tráng quý mến ngươi; lòng trung của họ bền hơn." },
];

// —————————————————————————————————————————————————————————————
// NHÓM TRÍ TUỆ
// —————————————————————————————————————————————————————————————
export const MIND_TALENTS: TalentDef[] = [
  { id: "schemer", name: "Mưu Sĩ Lọc Lõi", category: "Trí Tuệ",
    effect: "Trí Tuệ+2", cost: 3, condition: "khi bày mưu/gài bẫy",
    narrative: "Ngươi nhìn thấu âm mưu người khác và giăng bẫy tinh vi; vài nước cờ trước đối thủ. (Kỹ năng Mưu Lược khởi điểm +2 cấp)" },
  { id: "perfect-memory", name: "Ký Ức Hoàn Hảo", category: "Trí Tuệ",
    effect: "Trí Tuệ+1", cost: 2,
    narrative: "Ngươi nhớ mọi chi tiết từng gặp — tên, gương mặt, lời hứa, món nợ. (AI luôn nhắc lại chính xác điều ngươi từng biết)" },
  { id: "keen-eye", name: "Con Mắt Tinh Đời", category: "Trí Tuệ",
    effect: "Tinh Tường+3", cost: 3, condition: "khi nhận gian dối/đọc vị người khác",
    narrative: "Ngươi đọc được nói dối qua ánh mắt, cái ngập ngừng; ít ai qua mặt được ngươi." },
  { id: "learned", name: "Học Rộng", category: "Trí Tuệ",
    effect: "Trí Tuệ+2", cost: 2, condition: "về sử, luật, gia phả",
    narrative: "Kiến thức uyên bác của ngươi mở ra những cánh cửa mà kẻ vũ phu không thấy. (Kỹ năng Học Vấn khởi điểm cao)" },
  { id: "strategist", name: "Đầu Óc Chiến Lược", category: "Trí Tuệ",
    effect: "Trí Tuệ+1, Tinh Tường+1", cost: 3, condition: "khi đọc địa hình/lập kế hoạch trận",
    narrative: "Ngươi chọn bãi chiến, đoán nước đi địch; địa lợi thường về phía ngươi." },
];

// —————————————————————————————————————————————————————————————
// NHÓM XUẤT THÂN (gắn hoàn cảnh, một số nối cơ chế riêng)
// —————————————————————————————————————————————————————————————
export const ORIGIN_TALENTS: TalentDef[] = [
  { id: "lord-of-north", name: "Lãnh Chúa Phương Bắc", category: "Xuất Thân",
    effect: "Chống Chịu+10", cost: 2, eras: [], requires: ["house:stark"],
    condition: "trong tuyết và giá rét phương Bắc",
    narrative: "Máu phương Bắc chịu lạnh; dân miền Bắc coi ngươi là người của họ." },
  { id: "merchant-fortune", name: "Thương Cổ Cự Phú", category: "Xuất Thân",
    effect: "Trí Tuệ+1", cost: 2,
    narrative: "Ngươi có con mắt tính toán tiền bạc và mạng lưới buôn bán. (Vốn buôn + tuyến thương mại khởi đầu — nối 15)" },
  { id: "faith-devout", name: "Sùng Đạo", category: "Xuất Thân",
    effect: "Uy Tín+1", cost: 1, condition: "với tín đồ Thất Diện Thần / Đức Tin",
    narrative: "Lòng thành của ngươi được giới tăng lữ và dân mộ đạo tin tưởng." },
];

// —————————————————————————————————————————————————————————————
// NHÓM MA THUẬT (GATE cứng theo Era + xuất thân/dòng máu — nối 7.15, 5.1f-D)
//   hidden:true = tiềm ẩn, effect chỉ áp khi engine "thức tỉnh" qua cốt truyện
// —————————————————————————————————————————————————————————————
export const MAGIC_TALENTS: TalentDef[] = [
  { id: "dragon-blood", name: "Máu Rồng (Targaryen)", category: "Ma Thuật",
    effect: "Chống Chịu+10", cost: 4,
    requires: ["house:targaryen", "era-magic"],
    eras: ["aegon-conquest", "dance-of-dragons", "war-of-five-kings-late"],
    narrative: "Lửa thường khó thiêu ngươi; huyết mạch cổ xưa mở ra tiềm năng thuần phục rồng. (Mở tuyến cưỡi rồng nếu có rồng — 7.15)" },
  { id: "warg", name: "Kẻ Đội Lốt (Warg)", category: "Ma Thuật",
    effect: "Tinh Tường+2", cost: 4, hidden: true,
    requires: ["era-magic"], // thường gate vùng phương Bắc / Free Folk
    eras: ["war-of-five-kings", "long-night", "beyond-the-wall"],
    narrative: "Tâm trí ngươi có thể trườn vào loài thú — sói, quạ, đại bàng — nhìn qua mắt chúng. Ban đầu chỉ là những giấc mơ kỳ lạ. (Do thám qua thú — kỹ năng Nhập Hồn Thú)" },
  { id: "greenseer", name: "Khải Thị (Greenseer)", category: "Ma Thuật",
    effect: "Tinh Tường+2", cost: 4, hidden: true,
    requires: ["era-magic"],
    eras: ["war-of-five-kings", "long-night", "beyond-the-wall"],
    narrative: "Ngươi thấy những giấc mơ xanh — quá khứ, tương lai, điều đang xảy ra nơi xa. Mơ hồ, nhưng đúng. (AI thỉnh thoảng gieo điềm báo)" },
  { id: "rhllor-chosen", name: "Được R'hllor Chọn", category: "Ma Thuật",
    effect: "Uy Tín+1", cost: 3,
    requires: ["era-magic"],
    eras: ["war-of-five-kings", "long-night"],
    narrative: "Ngọn Lửa Đêm Tối ban cho ngươi tia phép hiếm hoi — bóng lửa, đôi khi cả sự sống trở lại. Rất hiếm, và luôn có giá. (Cần Pháp Lực — 5.1f)" },
];

// —————————————————————————————————————————————————————————————
// NHÓM KHIẾM KHUYẾT (cost ÂM = HOÀN điểm để dồn chỗ khác — rất ASOIAF)
// —————————————————————————————————————————————————————————————
export const FLAW_TALENTS: TalentDef[] = [
  { id: "lame", name: "Thọt Chân", category: "Khiếm Khuyết",
    effect: "Nhanh Nhẹn-2", cost: -2,
    narrative: "Ngươi bước đi khó nhọc, không thể chạy nhanh; kẻ khác đôi khi coi thường." },
  { id: "dwarf", name: "Thân Hình Nhỏ Bé (Lùn)", category: "Khiếm Khuyết",
    effect: "Sức Mạnh-2", cost: -3,
    narrative: "Thế gian nhìn xuống ngươi theo cả nghĩa đen lẫn nghĩa bóng — nhưng đầu óc ngươi bù lại. (Mở tuyến 'bị coi thường mà mưu lược' kiểu Tyrion)" },
  { id: "ill-reputed", name: "Tiếng Xấu", category: "Khiếm Khuyết",
    effect: "", cost: -2,
    narrative: "Quá khứ đen tối theo đuổi ngươi. (NPC khởi đầu -10 Hảo Cảm — engine áp)" },
  { id: "illiterate", name: "Mù Chữ", category: "Khiếm Khuyết",
    effect: "", cost: -2, condition: "không dùng được kỹ năng Học Vấn",
    narrative: "Ngươi không biết đọc chữ — cánh cửa tri thức đóng lại, xuất thân thấp kém lộ ra." },
  { id: "chronic-illness", name: "Bệnh Kinh Niên", category: "Khiếm Khuyết",
    effect: "Thể Chất-2", cost: -2, condition: "thỉnh thoảng phát bệnh (engine roll theo turn)",
    narrative: "Một chứng bệnh đeo bám ngươi, bùng lên vào lúc tệ nhất — kịch tính sinh tồn." },
  { id: "hot-tempered", name: "Nóng Nảy", category: "Khiếm Khuyết",
    effect: "Tinh Tường-1", cost: -1, condition: "dễ mất bình tĩnh, khó kiềm chế khi bị khiêu khích",
    narrative: "Cơn giận của ngươi bùng nhanh; kẻ mưu mô biết cách lợi dụng điều đó." },
  { id: "haunted-past", name: "Ám Ảnh Quá Khứ", category: "Khiếm Khuyết",
    effect: "", cost: -1, condition: "ác mộng/hồi tưởng ảnh hưởng tâm lý một số tình huống",
    narrative: "Điều ngươi từng chứng kiến không buông tha; đôi khi nó trỗi dậy đúng lúc ngươi cần vững vàng nhất." },
];

// —————————————————————————————————————————————————————————————
// TỔNG HỢP + HELPER
// —————————————————————————————————————————————————————————————
export const ALL_TALENTS: TalentDef[] = [
  ...COMBAT_TALENTS, ...PHYSICAL_TALENTS, ...SOCIAL_TALENTS,
  ...MIND_TALENTS, ...ORIGIN_TALENTS, ...MAGIC_TALENTS, ...FLAW_TALENTS,
];

export const TALENTS_BY_ID: Record<string, TalentDef> =
  Object.fromEntries(ALL_TALENTS.map(t => [t.id, t]));

/** Lọc thiên phú khả dụng cho một Era + xuất thân + Nhà (dùng ở wizard Bước 3, mục 8.5). */
export function availableTalents(opts: {
  eraId: string; eraHasMagic: boolean; originId: string; houseId?: string;
}): TalentDef[] {
  return ALL_TALENTS.filter(t => {
    if (t.eras && t.eras.length && !t.eras.includes(opts.eraId)) return false;
    if (t.requires) {
      for (const req of t.requires) {
        if (req === "era-magic" && !opts.eraHasMagic) return false;
        if (req.startsWith("origin:") && req.slice(7) !== opts.originId) return false;
        if (req.startsWith("house:") && req.slice(6) !== opts.houseId) return false;
      }
    }
    return true;
  });
}
