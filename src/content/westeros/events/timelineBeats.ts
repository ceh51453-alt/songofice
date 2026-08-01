/**
 * timelineBeats.ts (17.3) — Cột mốc lịch sử canon theo Era.
 * Mỗi beat gắn năm cụ thể. Khi game-time chạm năm → engine trigger.
 */
import type { PatchOp } from "../../../mvu/patchEngine";

export interface TimelineBeat {
  id: string;
  eraId: string;
  /** Năm AC xảy ra (After Conquest). */
  year: number;
  title: string;
  description: string;
  /** Phạm vi diễn ra để UI/AI phân biệt lịch sử địa phương và tin thế giới. */
  continentIds?: string[];
  locationIds?: string[];
  factionIds?: string[];
  /** Patch áp tự động khi beat xảy ra (tuỳ chọn). */
  autoPatch?: PatchOp[];
}

// ── ERA 0: ĐÊM TRƯỜNG (~8000 BC) ──
const ERA0_BEATS: TimelineBeat[] = [
  {
    id: "others-appear",
    eraId: "long-night",
    year: -8000,
    title: "Others Xuất Hiện",
    description: "Từ cực Bắc xa xôi, những sinh vật mắt xanh băng giá xuất hiện — giết bất kỳ ai trên đường đi và biến xác chết thành lính.",
  },
  {
    id: "night-descends",
    eraId: "long-night",
    year: -7999,
    title: "Đêm Vĩnh Cửu Buông Xuống",
    description: "Mặt trời biến mất. Mùa đông kéo dài một thế hệ. Nạn đói và cái chết tràn ngập khắp lục địa.",
  },
  {
    id: "pact-with-children",
    eraId: "long-night",
    year: -7998,
    title: "Hiệp Ước Với Trẻ Con Rừng",
    description: "Anh Hùng Cuối Cùng tìm được Trẻ Con Rừng. Họ trao cho ông bí mật — vũ khí bằng dragonglass, và có lẽ... một thứ gì đó hơn thế.",
  },
  {
    id: "battle-for-dawn",
    eraId: "long-night",
    year: -7997,
    title: "Trận Chiến Bình Minh",
    description: "Loài người và Trẻ Con Rừng hợp sức đánh đuổi Others về cực Bắc. Mặt trời mọc lại — nhưng đã mất bao nhiêu mạng người.",
  },
  {
    id: "wall-construction",
    eraId: "long-night",
    year: -7996,
    title: "Xây Dựng Bức Tường",
    description: "Brandon Người Xây dựng Bức Tường — bảy trăm bộ băng, phép thuật và đá — từ biển đến biển, để ngăn Others vĩnh viễn.",
  },
  {
    id: "nights-watch-founded",
    eraId: "long-night",
    year: -7995,
    title: "Thành Lập Tuần Đêm",
    description: "Tuần Đêm (Night's Watch) được thành lập để canh giữ Bức Tường. Lời thề được khắc vào lịch sử: 'Đêm gom về và phiên ta bắt đầu.'",
  },
];

// ── ERA 1: CHINH PHẠT AEGON (1-37 AC) ──
const ERA1_BEATS: TimelineBeat[] = [
  {
    id: "aegon-landing",
    eraId: "aegon-conquest",
    year: 1,
    title: "Aegon Đổ Bộ",
    description: "Aegon Targaryen cùng hai chị gái-vợ đổ bộ tại cửa sông Blackwater, dựng lều và xây pháo đài đất.",
  },
  {
    id: "harrenhal-burns",
    eraId: "aegon-conquest",
    year: 1,
    title: "Harrenhal Cháy",
    description: "Balerion thiêu rụi Harrenhal. Nhà Hoare bị xoá sổ. Harren Đen bỏng tối cháy thành tro trong lâu đài của mình.",
  },
  {
    id: "field-of-fire",
    eraId: "aegon-conquest",
    year: 2,
    title: "Trận Cánh Đồng Lửa",
    description: "Trận chiến duy nhất cả ba con rồng cùng tham gia. Liên quân Gardener-Lannister bị tiêu diệt. Nhà Gardener tuyệt diệt.",
  },
  {
    id: "aegon-coronation",
    eraId: "aegon-conquest",
    year: 2,
    title: "Aegon Đăng Quang",
    description: "Aegon được đại Giáo Chủ làm lễ đăng quang tại Oldtown. Bảy Vương Quốc thống nhất dưới một vương miện.",
  },
  {
    id: "dorne-unbowed",
    eraId: "aegon-conquest",
    year: 4,
    title: "Dorne Không Cúi Đầu",
    description: "Dorne từ chối quy phục. Rhaenys mất tích trên rồng Meraxes ở Hellholt. Cuộc chiến kéo dài.",
  },
  {
    id: "first-dornish-war-ends",
    eraId: "aegon-conquest",
    year: 13,
    title: "Kết Thúc Chiến Tranh Dorne Lần 1",
    description: "Aegon chấp nhận Dorne độc lập sau nhiều năm chiến tranh hao tốn.",
  },
];

// ── ERA 1.5: VŨ ĐIỆU RỒNG (129-131 AC) ──
const ERA1B_BEATS: TimelineBeat[] = [
  {
    id: "aemma-dies-rhaenyra-heir",
    eraId: "dance-of-dragons",
    year: 105,
    title: "Rhaenyra Được Phong Thừa Kế",
    description: "Vương hậu Aemma Arryn chết khi sinh nở. Vua Viserys I tuyên bố con gái Rhaenyra là người thừa kế Ngai Sắt, buộc mọi lãnh chúa phải thề trung thành với nàng.",
  },
  {
    id: "viserys-marries-alicent",
    eraId: "dance-of-dragons",
    year: 109,
    title: "Viserys Cưới Alicent Hightower",
    description: "Vua Viserys I cưới Alicent Hightower — con gái của Cánh Tay Nhà Vua Otto. Triều đình bắt đầu chia phe. Alicent sinh con trai Aegon — mầm mống tranh ngôi được gieo.",
  },
  {
    id: "viserys-dies",
    eraId: "dance-of-dragons",
    year: 129,
    title: "Vua Viserys I Qua Đời",
    description: "Vua Viserys I chết trong giấc ngủ. Alicent Hightower giấu tin và chuẩn bị đội vương miện cho Aegon II.",
  },
  {
    id: "green-coronation-beat",
    eraId: "dance-of-dragons",
    year: 129,
    title: "Aegon II Đăng Quang",
    description: "Aegon II được đội vương miện tại Dragonpit. Rhaenyra ở Dragonstone chưa hay biết cha mình đã chết.",
  },
  {
    id: "blood-and-cheese",
    eraId: "dance-of-dragons",
    year: 129,
    title: "Máu và Phô Mai",
    description: "Daemon thuê hai kẻ sát thủ — Blood và Cheese — đột nhập lâu đài giết con trai Aegon II để trả thù cho cái chết của Lucerys.",
  },
  {
    id: "rooks-rest-battle",
    eraId: "dance-of-dragons",
    year: 129,
    title: "Trận Rook's Rest",
    description: "Rồng chiến rồng lần đầu. Rhaenys và Meleys bị giết bởi Sunfyre và Vhagar. Aegon II bị bỏng nặng.",
  },
  {
    id: "fall-of-kings-landing",
    eraId: "dance-of-dragons",
    year: 130,
    title: "Rhaenyra Chiếm King's Landing",
    description: "Rhaenyra kéo quân vào King's Landing không tốn một giọt máu. Aegon II trốn thoát.",
  },
  {
    id: "gods-eye-duel",
    eraId: "dance-of-dragons",
    year: 130,
    title: "Trận Mắt Thần",
    description: "Daemon trên Caraxes đối đầu Aemond trên Vhagar trên hồ Gods Eye. Cả bốn — hai người, hai rồng — cùng chết.",
  },
  {
    id: "storming-of-dragonpit",
    eraId: "dance-of-dragons",
    year: 130,
    title: "Đám Đông Phá Hố Rồng",
    description: "Dân King's Landing nổi dậy xông vào Dragonpit. Năm con rồng bị giết — giống rồng gần như tuyệt diệt.",
  },
];

// ── ERA 1.7: LOẠN BLACKFYRE (195-196 AC) ──
const ERA1C_BEATS: TimelineBeat[] = [
  {
    id: "aegon-iv-legitimizes",
    eraId: "blackfyre-rebellion",
    year: 184,
    title: "Aegon IV Hợp Pháp Hoá Con Hoang",
    description: "Trên giường chết, Vua Aegon IV hợp pháp hoá tất cả con hoang — bao gồm Daemon, Aegor, và Brynden Rivers. Mầm loạn được gieo.",
  },
  {
    id: "daemon-receives-blackfyre",
    eraId: "blackfyre-rebellion",
    year: 182,
    title: "Daemon Nhận Kiếm Blackfyre",
    description: "Aegon IV trao thanh kiếm Blackfyre cho Daemon thay vì thái tử Daeron. Nhiều người coi đây là tín hiệu kế vị thật sự.",
  },
  {
    id: "daemon-declares",
    eraId: "blackfyre-rebellion",
    year: 195,
    title: "Daemon Phất Cờ Nổi Loạn",
    description: "Daemon Blackfyre công khai tuyên bố quyền thừa kế. Hơn nửa các nhà quý tộc ủng hộ — bao gồm cả Aegor 'Bittersweet' Rivers.",
  },
  {
    id: "redgrass-field-battle",
    eraId: "blackfyre-rebellion",
    year: 196,
    title: "Trận Cánh Đồng Cỏ Đỏ",
    description: "Trận chiến đẫm máu nhất kể từ Vũ Điệu Rồng. Daemon Blackfyre bị giết bởi mưa tên của Quạ Máu. Aegor Bittersweet mang kiếm Blackfyre chạy sang Essos.",
  },
  {
    id: "blackfyre-exiled",
    eraId: "blackfyre-rebellion",
    year: 196,
    title: "Tàn Dư Blackfyre Lưu Vong",
    description: "Phe Blackfyre thua trận nhưng không bị diệt. Họ chạy sang Essos, lập đoàn Công Ty Vàng, và mưu kế quay lại... nhiều lần nữa.",
  },
];

// ── ERA 1.8: HIỆP SĨ BẢY VƯƠNG QUỐC / DUNK & EGG (209-233 AC) ──
const ERA1D_BEATS: TimelineBeat[] = [
  {
    id: "ashford-trial-of-seven",
    eraId: "dunk-and-egg",
    year: 209,
    title: "Phiên Xử Bảy Người Tại Ashford",
    description: "Ser Duncan thách thức Hoàng tử Aerion Brightflame — dẫn đến Phiên Xử Bảy Người. Hoàng tử Baelor Phá Thương chết vì vết thương từ chính tay cha mình, Maekar.",
  },
  {
    id: "baelor-breakspear-dies",
    eraId: "dunk-and-egg",
    year: 209,
    title: "Cái Chết Của Baelor Phá Thương",
    description: "Hoàng tử Baelor — người kế vị giỏi nhất Targaryen từng có — chết tại Ashford. Dòng kế vị Targaryen rẽ sang một hướng không ai ngờ.",
  },
  {
    id: "sworn-sword-standoff",
    eraId: "dunk-and-egg",
    year: 211,
    title: "Hiệp Sĩ Thề Nguyện",
    description: "Dunk phục vụ lãnh chúa Standfast và đối đầu với Phu nhân Rohanne Webber trong tranh chấp đất đai — một cuộc chiến nhỏ phản ánh vương quốc lớn.",
  },
  {
    id: "whitewalls-rebellion",
    eraId: "dunk-and-egg",
    year: 212,
    title: "Loạn Blackfyre Lần Hai Tại Whitewalls",
    description: "Daemon II Blackfyre giả danh hiệp sĩ để tổ chức cuộc nổi dậy. Bloodraven phá tan âm mưu; Dunk và Egg vô tình nằm giữa cuộc tranh giành quyền lực.",
  },
  {
    id: "bloodraven-exiled",
    eraId: "dunk-and-egg",
    year: 233,
    title: "Quạ Máu Bị Đày Ra Tường Thành",
    description: "Aegon V (Egg) lên ngôi vua. Một trong những hành động đầu tiên: đày Bloodraven ra Night's Watch. Quạ Máu biến mất sau đó — nhưng không bao giờ thực sự ra đi.",
  },
];

// ── ERA 2: LOẠN ROBERT (280-283 AC) ──
const ERA2_BEATS: TimelineBeat[] = [
  {
    id: "tourney-harrenhal",
    eraId: "roberts-rebellion",
    year: 281,
    title: "Giải Đấu Harrenhal",
    description: "Giải đấu lớn nhất trong lịch sử. Rhaegar Targaryen tặng vòng hoa cho Lyanna Stark thay vì vợ mình.",
  },
  {
    id: "lyanna-disappears",
    eraId: "roberts-rebellion",
    year: 282,
    title: "Lyanna Mất Tích",
    description: "Rhaegar Targaryen 'bắt cóc' Lyanna Stark (hoặc hai người cùng bỏ trốn). Đây là ngòi lửa của cuộc chiến.",
  },
  {
    id: "brandon-rickard-die",
    eraId: "roberts-rebellion",
    year: 282,
    title: "Brandon và Rickard Stark Bị Giết",
    description: "Điên Vương Aerys hành quyết Rickard và Brandon Stark tại King's Landing. Máu lửa nổi lên.",
  },
  {
    id: "battle-of-bells",
    eraId: "roberts-rebellion",
    year: 282,
    title: "Trận Chiến Chuông",
    description: "Robert ẩn náu tại Stoney Sept. Jon Connington tìm kiếm vô vọng. Ned cứu Robert.",
  },
  {
    id: "battle-of-trident",
    eraId: "roberts-rebellion",
    year: 283,
    title: "Trận Sông Trident",
    description: "Robert giết Rhaegar trong trận chiến tay đôi giữa dòng sông. Ngọc ruby tung toé từ giáp Rhaegar.",
  },
  {
    id: "sack-of-kings-landing",
    eraId: "roberts-rebellion",
    year: 283,
    title: "Cướp Phá King's Landing",
    description: "Tywin Lannister phản bội Aerys. Jaime giết Điên Vương. Nhà Targaryen suy tàn.",
  },
  {
    id: "tower-of-joy",
    eraId: "roberts-rebellion",
    year: 283,
    title: "Tháp Niềm Vui",
    description: "Ned Stark tìm thấy Lyanna đang hấp hối tại Tháp Niềm Vui. Lời hứa bí mật.",
  },
];

// ── ERA 2.5: LOẠN GREYJOY (289 AC) ──
const ERA2B_BEATS: TimelineBeat[] = [
  {
    id: "balon-crowns-himself",
    eraId: "greyjoy-rebellion",
    year: 289,
    title: "Balon Đội Vương Miện",
    description: "Balon Greyjoy tự xưng Vua Quần Đảo Sắt và đập tan mọi liên minh với đất liền.",
  },
  {
    id: "raid-on-lannisport",
    eraId: "greyjoy-rebellion",
    year: 289,
    title: "Đột Kích Lannisport",
    description: "Hạm đội Greyjoy do Euron và Victarion chỉ huy đốt cháy cảng Lannisport. Toàn bộ tàu chiến Lannister bốc cháy trong đêm.",
  },
  {
    id: "battle-of-fair-isle",
    eraId: "greyjoy-rebellion",
    year: 289,
    title: "Trận Fair Isle",
    description: "Stannis Baratheon đánh tan hạm đội Sắt ngoài khơi Fair Isle. Quyền kiểm soát biển chuyển về tay triều đình.",
  },
  {
    id: "siege-of-pyke",
    eraId: "greyjoy-rebellion",
    year: 289,
    title: "Bao Vây Pyke",
    description: "Robert, Ned, và liên quân đổ bộ lên Pyke. Jorah Mormont là người đầu tiên phá tường. Theon trở thành con tin.",
  },
  {
    id: "balon-bends-knee",
    eraId: "greyjoy-rebellion",
    year: 289,
    title: "Balon Quỳ Gối",
    description: "Pyke thất thủ. Balon Greyjoy quỳ trước Robert Baratheon. Theon — chín tuổi — bị mang đi Winterfell làm con tin.",
  },
];

// ── ERA 3: CHIẾN TRANH NGŨ VƯƠNG (298-303 AC) ──
const ERA3_BEATS: TimelineBeat[] = [
  {
    id: "ned-arrives-kl",
    eraId: "war-of-five-kings",
    year: 298,
    title: "Ned Stark Tới King's Landing",
    description: "Ned nhận chức Bàn Tay Nhà Vua theo lời mời của Robert. Bắt đầu điều tra cái chết của Jon Arryn.",
  },
  {
    id: "robert-dies",
    eraId: "war-of-five-kings",
    year: 298,
    title: "Robert Baratheon Chết",
    description: "Nhà Vua Robert chết sau vụ tai nạn săn heo. Joffrey lên ngôi.",
  },
  {
    id: "ned-executed",
    eraId: "war-of-five-kings",
    year: 298,
    title: "Ned Stark Bị Xử Tử",
    description: "Joffrey ra lệnh chém đầu Ned Stark tại Baelor. Miền Bắc nổi loạn. Robb Stark được tôn làm Vua Phương Bắc.",
  },
  {
    id: "battle-of-blackwater",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Trận Blackwater",
    description: "Stannis tấn công King's Landing. Tyrion dùng lửa xanh thiêu hạm đội. Tywin và Tyrell đến cứu, đánh bại Stannis.",
  },
  {
    id: "red-wedding",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Đám Cưới Đỏ",
    description: "Walder Frey và Roose Bolton phản bội. Robb Stark, Catelyn, và quân Bắc bị tàn sát tại Twins. Vương Quốc Phương Bắc sụp đổ.",
  },
  {
    id: "purple-wedding",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Đám Cưới Tím",
    description: "Joffrey bị đầu độc tại lễ cưới với Margaery. Tyrion bị buộc tội. Olenna Tyrell và Littlefinger là thủ phạm.",
  },
  {
    id: "tyrion-kills-tywin",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Tyrion Giết Tywin",
    description: "Tyrion giết cha mình Tywin Lannister bằng nỏ trước khi trốn khỏi King's Landing cùng Varys.",
  },
  {
    id: "jon-snow-dies",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Jon Snow Chết (và Sống Lại?)",
    description: "Jon Snow bị anh em Night's Watch đâm chết vì tội phản bội. 'For the Watch.'",
  },
  {
    id: "daenerys-sails",
    eraId: "war-of-five-kings",
    year: 302,
    title: "Daenerys Đông Quân",
    description: "Daenerys Targaryen rời Essos với hạm đội, ba con rồng, Unsullied và Dothraki. Hướng về Westeros.",
  },
];

/** Tuyến Essos chạy song song, để cùng mốc 298–300 AC không chỉ có Westeros. */
const ERA3_ESSOS_BEATS: TimelineBeat[] = [
  {
    id: "dragons-return-essos",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Rồng Trở Lại Thế Giới",
    description: "Ba con rồng của Daenerys nở sau cái chết của Khal Drogo; tin đồn lan theo mọi tuyến buôn từ Biển Dothraki tới các Thành Phố Tự Do.",
    continentIds: ["essos"], locationIds: ["dothraki-sea"], factionIds: ["targaryen-essos", "dothraki"],
  },
  {
    id: "astapor-liberated",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Astapor Bẻ Xiềng",
    description: "Daenerys giành quyền chỉ huy Unsullied, lật đổ các Good Masters và giải phóng nô lệ Astapor, làm rung chuyển nền thương mại của Vịnh Nô Lệ.",
    continentIds: ["essos"], locationIds: ["astapor"], factionIds: ["targaryen-essos", "astapor"],
  },
  {
    id: "yunkai-yields",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Yunkai Mở Cổng",
    description: "Quân Yunkai và các đoàn lính đánh thuê thất bại; những người bị nô dịch rời thành và gọi Daenerys là Mhysa.",
    continentIds: ["essos"], locationIds: ["yunkai"], factionIds: ["targaryen-essos", "yunkai"],
  },
  {
    id: "meereen-falls",
    eraId: "war-of-five-kings",
    year: 299,
    title: "Meereen Thất Thủ",
    description: "Nô lệ nổi dậy từ bên trong khi quân Daenerys công phá cổng; nàng ở lại Đại Kim Tự Tháp để học cách cai trị thay vì lập tức đi về tây.",
    continentIds: ["essos"], locationIds: ["meereen"], factionIds: ["targaryen-essos", "meereen"],
  },
  {
    id: "astapor-second-fall",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Astapor Sụp Đổ Lần Nữa",
    description: "Liên quân Yunkai và New Ghis phá Astapor; người sống sót chạy về phía Meereen trong khi dịch lỵ lan giữa các trại tị nạn.",
    continentIds: ["essos"], locationIds: ["astapor", "meereen"], factionIds: ["astapor", "yunkai", "new-ghis"],
  },
  {
    id: "meereen-blockaded",
    eraId: "war-of-five-kings",
    year: 300,
    title: "Liên Minh Chủ Nô Vây Meereen",
    description: "Yunkai, New Ghis và các đoàn lính đánh thuê siết vòng vây trên bộ lẫn biển; Sons of the Harpy tiếp tục chiến tranh bóng tối trong thành.",
    continentIds: ["essos"], locationIds: ["meereen", "yunkai", "new-ghis"], factionIds: ["meereen", "yunkai", "new-ghis", "mercenary"],
  },
];

/** Toàn bộ cột mốc lịch sử. */
export const ALL_TIMELINE_BEATS: TimelineBeat[] = [
  ...ERA0_BEATS,
  ...ERA1_BEATS,
  ...ERA1B_BEATS,
  ...ERA1C_BEATS,
  ...ERA1D_BEATS,
  ...ERA2_BEATS,
  ...ERA2B_BEATS,
  ...ERA3_BEATS,
  ...ERA3_ESSOS_BEATS,
];

/** Lấy beats theo eraId. */
export function getBeatsByEra(eraId: string): TimelineBeat[] {
  return ALL_TIMELINE_BEATS.filter((b) => b.eraId === eraId);
}
