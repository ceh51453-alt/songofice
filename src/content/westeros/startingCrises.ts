// content/westeros/startingCrises.ts
// ============================================================================
// NGÂN HÀNG KHỦNG HOẢNG KHỞI ĐẦU (8.5b) — móc kịch tính gắn nhân vật lúc mở màn.
// Wizard lọc theo origins + eras + houses (rỗng = mọi). desc đưa vào lore khởi
// tạo + tin nhắn mở đầu để AI khai triển ngay lượt đầu.
// ============================================================================

export interface StartingCrisis {
  id: string;
  title: string;
  desc: string;
  origins: string[]; // rỗng = mọi xuất thân
  eras?: string[];
  houses?: string[];
  tags: string[];
  initialStateHint?: string;
}

export const STARTING_CRISES: StartingCrisis[] = [
  // ── A. Lãnh Chúa / Quý Tộc ──
  { id: "restless-vassals", title: "Chư Hầu Bất Mãn",
    desc: "Các gia tộc chư hầu phản đối vì thuế nặng và nghĩa vụ quân dịch; vài kẻ đã ngừng nộp cống và bàn tán chuyện ly khai.",
    origins: ["lord-heir", "minor-noble"], tags: ["chính trị", "gia tộc"],
    initialStateHint: "trung thành lãnh địa thấp" },
  { id: "empty-granary", title: "Kho Lương Cạn Trước Đông",
    desc: "Mùa đông đang tới mà kho dự trữ chỉ đủ nửa mùa; dân bắt đầu hoảng, nạn đói lấp ló sau những cánh đồng trơ gốc rạ.",
    origins: ["lord-heir", "minor-noble"], tags: ["sinh tồn", "tài chính"],
    initialStateHint: "lương thực cạn" },
  { id: "succession-dispute", title: "Tranh Chấp Kế Vị",
    desc: "Cha ngươi vừa mất, một người họ hàng cũng tuyên bố quyền thừa kế lãnh địa; chư hầu bắt đầu chia phe.",
    origins: ["lord-heir"], tags: ["gia tộc", "chính trị"] },
  { id: "hostile-neighbor", title: "Cường Địch Áp Biên",
    desc: "Một lãnh chúa láng giềng mạnh hơn đang tập binh sát biên giới, viện cớ tranh chấp một dải đất cũ.",
    origins: ["lord-heir", "minor-noble"], tags: ["quân sự"] },
  { id: "iron-bank-debt", title: "Nợ Sắt Ngân Hàng",
    desc: "Ngươi nợ Ngân Hàng Sắt Braavos một khoản lớn; hạn trả sắp tới, và Ngân Hàng Sắt luôn đòi được phần của mình.",
    origins: ["lord-heir", "minor-noble", "merchant"], tags: ["tài chính"] },
  { id: "plague", title: "Dịch Bệnh Lan Tràn",
    desc: "Một chứng bệnh bùng phát trong lãnh địa, dân chết dần từng ngày; phải chọn phong toả hay liều mở cửa cứu chữa.",
    origins: ["lord-heir", "minor-noble", "maester-novice"], tags: ["sinh tồn"] },
  { id: "traitor-within", title: "Phản Thần Trong Nhà",
    desc: "Một cận thần tin cẩn đang âm thầm bán tin cho kẻ địch; ngươi mới chỉ ngờ ngợ qua vài chi tiết không khớp.",
    origins: ["lord-heir", "minor-noble"], tags: ["chính trị", "mưu đồ"] },
  // ── B. Hiệp Sĩ / Lính Đánh Thuê ──
  { id: "blood-debt", title: "Nợ Máu Truy Đuổi",
    desc: "Ngươi lỡ giết người của một lãnh chúa quyền thế trong một cuộc đấu; sát thủ và thợ săn tiền thưởng đang lần theo dấu ngươi.",
    origins: ["knight", "sellsword", "spy-assassin"], tags: ["sinh tồn", "chính trị"] },
  { id: "betrayed-by-lord", title: "Chủ Cũ Phản Bội",
    desc: "Lãnh chúa ngươi phụng sự vừa quỵt tiền công và vu tội cho ngươi để phủi trách nhiệm; ngươi đang bị truy nã oan.",
    origins: ["knight", "sellsword"], tags: ["chính trị", "tài chính"] },
  { id: "fateful-tourney", title: "Giải Đấu Định Mệnh",
    desc: "Một giải đấu thương lớn sắp mở, giải thưởng đủ đổi đời — nhưng đối thủ toàn danh tướng, và có kẻ đã đặt cược vào thất bại của ngươi.",
    origins: ["knight"], tags: ["quân sự"] },
  { id: "band-dissolving", title: "Đội Quân Tan Rã",
    desc: "Đoàn lính đánh thuê của ngươi vừa thua trận và hết tiền; quân sắp ly tán nếu không tìm được hợp đồng mới trong vài ngày.",
    origins: ["sellsword"], tags: ["quân sự", "tài chính"] },
  // ── C. Con Hoang / Xuất Thân Thấp ──
  { id: "cast-out", title: "Bị Đuổi Khỏi Nhà",
    desc: "Cha ngươi vừa mất; người thừa kế đích tôn muốn tống ngươi khỏi lâu đài trước khi ngươi kịp tranh chấp bất cứ thứ gì. Ngươi có vài ngày.",
    origins: ["bastard", "commoner"], tags: ["gia tộc"] },
  { id: "identity-suspected", title: "Thân Phận Bị Nghi",
    desc: "Có kẻ bắt đầu nghi ngờ dòng máu và quá khứ thật của ngươi — điều ngươi giấu kín bấy lâu có thể bị phanh phui.",
    origins: ["bastard", "spy-assassin", "old-blood"], tags: ["chính trị", "mưu đồ"] },
  { id: "underworld-debt", title: "Món Nợ Xã Hội Đen",
    desc: "Ngươi mắc nợ một băng nhóm ở thành thị; chúng không đòi tiền nữa — chúng đòi ngươi làm một việc bẩn để trừ nợ.",
    origins: ["commoner", "bastard", "sellsword"], tags: ["tài chính", "sinh tồn"] },
  { id: "patrons-eye", title: "Cơ Hội Đổi Đời",
    desc: "Một quý nhân bất ngờ để mắt tới ngươi và hứa cất nhắc — nhưng cái giá và động cơ thật của ông ta còn nằm trong bóng tối.",
    origins: ["commoner", "bastard"], tags: ["chính trị"] },
  // ── D. Maester ──
  { id: "dangerous-secret", title: "Bí Mật Nguy Hiểm",
    desc: "Ngươi tình cờ phát hiện một bí mật động trời trong đống thư từ cũ; chỉ riêng việc biết nó đã khiến ngươi thành mục tiêu.",
    origins: ["maester-novice", "spy-assassin"], tags: ["mưu đồ", "siêu nhiên"] },
  { id: "poison-accusation", title: "Bị Vu Đầu Độc",
    desc: "Lãnh chúa ngươi phục vụ đột ngột ngã bệnh rồi qua đời; ngươi — người coi thuốc — là kẻ đầu tiên bị nghi hạ độc.",
    origins: ["maester-novice"], tags: ["chính trị"] },
  { id: "forbidden-knowledge", title: "Tri Thức Cấm",
    desc: "Ngươi theo đuổi một nhánh học vấn bị Học Viện và Đức Tin cấm đoán; có người đã để ý, và lời cảnh cáo đầu tiên đã tới.",
    origins: ["maester-novice", "old-blood"], tags: ["siêu nhiên", "chính trị"] },
  // ── E. Điệp Viên / Sát Thủ ──
  { id: "impossible-contract", title: "Hợp Đồng Bất Khả",
    desc: "Ngươi bị ép nhận một hợp đồng ám sát gần như bất khả thi; từ chối cũng là chết, chỉ khác cách chết.",
    origins: ["spy-assassin"], tags: ["mưu đồ", "sinh tồn"] },
  { id: "cover-blown", title: "Vỏ Bọc Sắp Lộ",
    desc: "Thân phận giả của ngươi trong gia tộc mục tiêu sắp bị bóc trần; phải hành động ngay, hoặc biến mất mãi mãi.",
    origins: ["spy-assassin"], tags: ["mưu đồ"] },
  { id: "hunted-by-order", title: "Bị Chính Tổ Chức Truy Sát",
    desc: "Ngươi biết quá nhiều, hoặc đã cãi lệnh; hội của ngươi nay muốn diệt khẩu — và họ giỏi việc đó hơn ai hết.",
    origins: ["spy-assassin"], tags: ["mưu đồ", "sinh tồn"] },
  // ── F. Thương Nhân ──
  { id: "smuggling-accusation", title: "Bị Vu Buôn Lậu",
    desc: "Một đối thủ vu cho ngươi tội buôn lậu; quan quân sắp tới khám kho, cần chạy chọt hoặc chứng minh trong sạch trước khi quá muộn.",
    origins: ["merchant"], tags: ["tài chính", "chính trị"] },
  { id: "caravan-lost", title: "Đoàn Hàng Bị Cướp",
    desc: "Chuyến hàng lớn nhất đời ngươi — gần cả gia sản — vừa bị cướp sạch; ngươi đứng bên bờ phá sản.",
    origins: ["merchant"], tags: ["tài chính"] },
  { id: "monopoly-threatened", title: "Độc Quyền Bị Đe Doạ",
    desc: "Một thế lực lớn muốn nuốt tuyến thương mại của ngươi — trước bằng giá rẻ, giờ bằng những 'tai nạn' trên đường hàng.",
    origins: ["merchant"], tags: ["tài chính", "chính trị"] },
  // ── Theo Thời Kỳ ──
  // Đêm Trường
  { id: "darkness-rises", title: "Bóng Tối Trỗi Dậy",
    desc: "Others và đội quân người chết đang tiến từ cực Bắc. Mỗi làng mạc bị huỷ, mỗi xác chết lại đứng dậy gia nhập chúng. Phải chạy, hoặc chiến đấu.",
    origins: [], eras: ["long-night"], tags: ["sinh tồn", "siêu nhiên"] },
  { id: "eternal-winter", title: "Mùa Đông Vĩnh Cửu",
    desc: "Kho lương đã cạn từ lâu. Tuyết cao quá đầu người. Dân chúng ăn rễ cây và da thú — chẳng bao lâu nữa, họ sẽ ăn nhau.",
    origins: [], eras: ["long-night"], tags: ["sinh tồn"] },
  { id: "children-vanishing", title: "Trẻ Con Rừng Biến Mất",
    desc: "Đồng minh duy nhất có thể giúp chống Others — Trẻ Con Rừng — đang rút sâu vào rừng và biến mất. Phải tìm họ trước khi quá muộn.",
    origins: [], eras: ["long-night"], tags: ["siêu nhiên"] },
  // Chinh Phạt Aegon
  { id: "dragons-from-sea", title: "Rồng Đến Từ Biển",
    desc: "Tin dữ lan khắp vùng: ba con rồng Targaryen đã đổ bộ. Vua của vùng ngươi phải chọn quy hàng hay kháng cự — và ngươi ở giữa lựa chọn đó.",
    origins: [], eras: ["aegon-conquest"], tags: ["quân sự", "chính trị"] },
  { id: "kings-summons", title: "Vua Triệu Tập Cần Vương",
    desc: "Lãnh chúa ngươi phụng sự vừa nhận lệnh triệu tập ra trận chống quân xâm lược Targaryen — và ngươi phải đi cùng.",
    origins: [], eras: ["aegon-conquest"], tags: ["quân sự"] },
  // Vũ Điệu Rồng
  { id: "choose-dragon-side", title: "Chọn Phe Rồng",
    desc: "Nội chiến Targaryen chia đôi vương quốc. Phe Đen (Rhaenyra) hay phe Xanh (Aegon II)? Mỗi bên đều có rồng — và không bên nào tha thứ kẻ lừng khừng.",
    origins: [], eras: ["dance-of-dragons"], tags: ["chính trị", "quân sự"] },
  { id: "dragons-overhead", title: "Rồng Lượn Trên Đầu",
    desc: "Rồng chiến rồng trên bầu trời. Lửa rơi xuống thành phố, lâu đài, và đồng ruộng. Mọi kế hoạch đều vô nghĩa khi một con rồng quyết định đốt vùng ngươi.",
    origins: [], eras: ["dance-of-dragons"], tags: ["quân sự", "sinh tồn"] },
  { id: "dragonseeds-call", title: "Tiếng Gọi Hạt Giống Rồng",
    desc: "Rhaenyra tuyển 'hạt giống rồng' — những ai mang dòng máu Valyria có thể cưỡi rồng. Liệu ngươi dám thử — hay cháy trong lửa?",
    origins: ["bastard", "old-blood"], eras: ["dance-of-dragons"], tags: ["siêu nhiên", "chính trị"] },
  // Loạn Blackfyre
  { id: "black-sword-calls", title: "Kiếm Đen Gọi Mời",
    desc: "Daemon Blackfyre giương cao thanh Blackfyre — kiếm vua. Hơn nửa vương quốc coi ông ta mới là vua thật. Ngươi phải chọn: dòng máu chính thống hay ý chí của thanh kiếm?",
    origins: [], eras: ["blackfyre-rebellion"], tags: ["chính trị"] },
  { id: "true-blood-question", title: "Dòng Máu Chính Thống",
    desc: "Daemon mang dòng máu Targaryen thật sự — trong khi Daeron II bị đồn là con của Aemon Hiệp Sĩ Rồng. Sự thật nào, và có quan trọng không?",
    origins: [], eras: ["blackfyre-rebellion"], tags: ["chính trị", "mưu đồ"] },
  { id: "ravens-blood-arrow", title: "Mưa Tên Của Quạ Máu",
    desc: "Brynden Rivers — Quạ Máu — đang xây mạng lưới gián điệp. Ai là mắt, ai là tai? Ngươi cảm thấy mình đang bị theo dõi.",
    origins: ["spy-assassin", "lord-heir", "minor-noble"], eras: ["blackfyre-rebellion"], tags: ["mưu đồ"] },
  // Dunk & Egg
  { id: "tourney-challenge", title: "Thách Đấu Tại Giải Đấu",
    desc: "Một hiệp sĩ kiêu ngạo xúc phạm danh dự ngươi trước đám đông. Từ chối là mất mặt; chấp nhận là đặt cược mạng sống. Ngươi chọn gì?",
    origins: [], eras: ["dunk-and-egg"], tags: ["quân sự"] },
  { id: "suspicious-squire", title: "Giám Mã Đáng Ngờ",
    desc: "Cậu bé giám mã của ngươi giấu giếm thân phận. Tóc bạc dưới mũ trùm, cử chỉ quý tộc dù miệng nói là thường dân. Cậu ta là ai — và ai đang tìm cậu ta?",
    origins: [], eras: ["dunk-and-egg"], tags: ["mưu đồ"] },
  { id: "blackfyre-whispers", title: "Tiếng Thì Thầm Blackfyre",
    desc: "Ở quán trọ, có kẻ hỏi ngươi nghĩ gì về 'vị vua thật sự'. Phe Blackfyre vẫn còn ẩn náu — và đang chiêu mộ. Ngươi theo hay tố giác?",
    origins: [], eras: ["dunk-and-egg"], tags: ["chính trị", "mưu đồ"] },
  // Loạn Robert
  { id: "rebellion-begins", title: "Cuộc Nổi Dậy Đã Bắt Đầu",
    desc: "Robert Baratheon phất cờ chống Vua Điên. Mọi nhà đều phải chọn phe: trung thành với triều Targaryen, hay theo phiến quân.",
    origins: [], eras: ["roberts-rebellion"], tags: ["quân sự", "chính trị"] },
  { id: "mad-king-paranoia", title: "Vua Điên Nghi Kỵ",
    desc: "Sự hoang tưởng của Aerys II ngày một nặng; ai ở gần triều đình đều có thể là kẻ phản nghịch tiếp theo trong mắt ông ta — kể cả ngươi.",
    origins: [], eras: ["roberts-rebellion"], tags: ["chính trị", "sinh tồn"] },
  // Loạn Greyjoy
  { id: "squid-rises", title: "Thủy Quái Nổi Dậy",
    desc: "Balon Greyjoy xưng vương và đốt Lannisport. Người Sắt đột kích bờ biển phía Tây — nếu ngươi ở gần, ngươi phải chống trả hoặc chạy.",
    origins: [], eras: ["greyjoy-rebellion"], tags: ["quân sự", "sinh tồn"] },
  { id: "iron-fleet-approach", title: "Hạm Đội Sắt Áp Sát",
    desc: "Hạm đội cướp biển Greyjoy đang tiến về bờ biển vùng ngươi. Đốt cảng, cướp phụ nữ, giết đàn ông — đó là 'giá sắt'.",
    origins: [], eras: ["greyjoy-rebellion"], tags: ["quân sự"] },
  { id: "kings-call-to-arms", title: "Vua Triệu Tập Dẹp Loạn",
    desc: "Vua Robert ra lệnh triệu tập toàn vương quốc đánh Greyjoy. Ngươi phải gia nhập — hoặc giải thích tại sao không.",
    origins: [], eras: ["greyjoy-rebellion"], tags: ["quân sự", "chính trị"] },
  // Chiến Tranh Ngũ Vương
  { id: "five-kings-rise", title: "Năm Vị Vua Xưng Đế",
    desc: "Bảy Phủ tan thành loạn chiến; lãnh địa và lòng trung của ngươi bị giằng xé giữa các phe đang xưng vương khắp nơi.",
    origins: [], eras: ["war-of-five-kings"], tags: ["quân sự", "chính trị"] },
  { id: "army-approaching", title: "Đại Quân Áp Sát",
    desc: "Một trong năm đạo quân đang tiến về vùng của ngươi; khói đốt làng đã thấy được từ tường thành.",
    origins: [], eras: ["war-of-five-kings"], tags: ["quân sự", "sinh tồn"] },
];

/** Lọc khủng hoảng khớp hồ sơ (8.5b) — wizard hiện 4-6 mục + "yên bình" + "AI tự gieo". */
export function availableCrises(opts: { originId: string; eraId: string; houseId?: string }): StartingCrisis[] {
  return STARTING_CRISES.filter((c) => {
    if (c.origins.length > 0 && !c.origins.includes(opts.originId)) return false;
    if (c.eras && c.eras.length > 0 && !c.eras.includes(opts.eraId)) return false;
    if (c.houses && c.houses.length > 0 && (!opts.houseId || !c.houses.includes(opts.houseId))) return false;
    return true;
  });
}
