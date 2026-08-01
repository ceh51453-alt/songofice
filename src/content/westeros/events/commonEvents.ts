/**
 * commonEvents.ts — Kho ~30 sự kiện ngẫu nhiên cơ bản (17.1).
 * Phân theo ngành: kinh tế, quân sự, chính trị, xã hội, mưu đồ.
 * Điều kiện + trọng số động làm sự kiện hợp bối cảnh.
 */
import type { GameEvent } from "../../../event/eventTypes";

export const COMMON_EVENTS: GameEvent[] = [
  // ── KINH TẾ ──
  {
    id: "famine-approaching",
    title: "Nạn Đói Rình Rập",
    weight: 8,
    conditions: [
      { type: "has_holding" },
      { type: "stat_lte", path: "Lãnh Địa", value: undefined }, // có lãnh địa
    ],
    narrativeTag: "event_popup",
    description: "Mùa màng thất bát, kho lương dần cạn. Dân chúng bắt đầu hoang mang.",
    cooldownDays: 30,
    choices: [
      {
        label: "Mở kho phát lương cho dân",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -200 },
        ],
        narrativeHint: "Người mở kho, dân mừng rỡ — lòng dân tăng, vàng mất.",
      },
      {
        label: "Than thở và không làm gì",
        outcomePatch: [],
        narrativeHint: "Người ngoảnh mặt, dân oán thán.",
      },
    ],
  },
  {
    id: "merchant-caravan",
    title: "Đoàn Thương Nhân Đi Qua",
    weight: 12,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Một đoàn thương nhân đường xa ghé qua lãnh địa người, mang theo hàng hoá từ những bến cảng xa lạ.",
    cooldownDays: 15,
    choices: [
      {
        label: "Hoan nghênh và thu thuế",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: 150 },
        ],
        narrativeHint: "Vàng vào túi, thương nhân hài lòng.",
      },
      {
        label: "Cướp hàng hoá của họ",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: 400 },
        ],
        narrativeHint: "Giàu thêm nhưng danh tiếng xấu đi. Kẻ khác sẽ biết.",
      },
    ],
  },
  {
    id: "bountiful-harvest",
    title: "Mùa Màng Bội Thu",
    weight: 10,
    conditions: [
      { type: "has_holding" },
      { type: "season", value: "Thu" },
    ],
    narrativeTag: "event_popup",
    description: "Mùa thu năm nay bội thu khác thường. Kho lúa đầy ắp, dân chúng ấm túi.",
    cooldownDays: 50,
    choices: [
      {
        label: "Tổ chức lễ hội mừng",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -100 },
        ],
        narrativeHint: "Lễ hội vui vẻ, lòng dân cao, nhưng tốn kém.",
      },
      {
        label: "Tích trữ cho mùa đông",
        outcomePatch: [],
        narrativeHint: "Kho lúa căng cứng, tiêu dư. Khoảng lặng.",
      },
    ],
  },
  {
    id: "pirate-raid",
    title: "Cướp Biển Tấn Công",
    weight: 7,
    conditions: [{ type: "has_holding" }, { type: "coastal" }],
    scope: { coastalOnly: true },
    narrativeTag: "raven_scroll",
    description: "Một đội thuyền cướp biển đột kích bờ biển lãnh địa người; cờ hiệu của chúng bị che kín.",
    cooldownDays: 25,
    choices: [
      {
        label: "Dẫn quân chống trả",
        outcomePatch: [],
        check: { checkId: "command", dc: 12, failPatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -300 },
        ] },
        narrativeHint: "Thành công: đánh tan cướp. Thất bại: bị cướp mất vàng.",
      },
      {
        label: "Đóng cửa và chờ cướp đi",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -200 },
        ],
        narrativeHint: "Cướp biển vơ vàng ra đi. Dân thở phào nhưng thất vọng.",
      },
    ],
  },

  // ── QUÂN SỰ ──
  {
    id: "hedge-knight-arrives",
    title: "Hiệp Sĩ Lang Thang Xin Gia Nhập",
    weight: 14,
    conditions: [],
    scope: { continentIds: ["westeros"] },
    narrativeTag: "event_popup",
    description: "Một hiệp sĩ lang thang phong trần xin được phụng sự người.",
    cooldownDays: 20,
    choices: [
      {
        label: "Chấp nhận",
        outcomePatch: [],
        narrativeHint: "Thêm một kiếm sĩ dưới trướng — có thể là tài sản, có thể là phiền phức.",
      },
      {
        label: "Từ chối",
        outcomePatch: [],
        narrativeHint: "Người ta bỏ đi. Ai biết người ấy sẽ ở đâu.",
      },
    ],
  },
  {
    id: "deserters-spotted",
    title: "Lính Đào Ngũ",
    weight: 9,
    conditions: [{ type: "at_war" }],
    narrativeTag: "event_popup",
    description: "Một nhóm lính đào ngũ bị bắt gần lãnh địa. Chúng khai là từ quân địch chạy sang.",
    cooldownDays: 15,
    choices: [
      {
        label: "Xử tử theo luật",
        outcomePatch: [],
        narrativeHint: "Luật là luật. Người khác sẽ nghĩ lại trước khi chạy.",
      },
      {
        label: "Tha và tuyển mộ",
        outcomePatch: [],
        check: { checkId: "persuade", dc: 10, failPatch: [] },
        narrativeHint: "Thành công: thêm quân. Thất bại: chúng chạy mất.",
      },
    ],
  },
  {
    id: "arms-shipment",
    title: "Chuyến Hàng Vũ Khí",
    weight: 8,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "raven_scroll",
    description: "Một thương nhân bí mật đề nghị bán vũ khí với giá rẻ — nhưng xuất xứ đáng ngờ.",
    cooldownDays: 20,
    choices: [
      {
        label: "Mua",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -250 },
        ],
        narrativeHint: "Vũ khí nhập kho. Nhưng ai bán, và tại sao rẻ thế?",
      },
      {
        label: "Từ chối và điều tra",
        outcomePatch: [],
        check: { checkId: "investigate", dc: 14, failPatch: [] },
        narrativeHint: "Có thể phát hiện âm mưu đằng sau.",
      },
    ],
  },

  // ── CHÍNH TRỊ ──
  {
    id: "diplomatic-envoy",
    title: "Đại Sứ Đến Thăm",
    weight: 11,
    conditions: [],
    narrativeTag: "event_popup",
    description: "Một đại sứ từ thế lực lân cận ghé thăm, mang theo đề nghị liên minh.",
    cooldownDays: 20,
    choices: [
      {
        label: "Tiếp đón trọng thể",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -50 },
        ],
        narrativeHint: "Ấn tượng tốt. Cửa mối quan hệ mới hé.",
      },
      {
        label: "Từ chối tiếp",
        outcomePatch: [],
        narrativeHint: "Đại sứ ra đi. Có thể là sai lầm.",
      },
    ],
  },
  {
    id: "plot-discovered",
    title: "Phát Hiện Âm Mưu",
    weight: 7,
    conditions: [{ type: "has_spy" }],
    narrativeTag: "event_popup",
    description: "Điệp viên của người phát hiện một âm mưu chống lại người từ bên trong triều đình.",
    cooldownDays: 25,
    choices: [
      {
        label: "Bắt giữ kẻ chủ mưu",
        outcomePatch: [],
        check: { checkId: "sneak", dc: 14, failPatch: [] },
        narrativeHint: "Thành công: kẻ phản bội bị bắt. Thất bại: chúng trốn mất.",
      },
      {
        label: "Theo dõi thêm",
        outcomePatch: [],
        narrativeHint: "Biết thêm, nhưng rủi ro cũng tăng.",
      },
    ],
  },
  {
    id: "petition-from-smallfolk",
    title: "Thỉnh Nguyện Từ Dân Chúng",
    weight: 13,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Dân chúng gửi đơn thỉnh nguyện: họ muốn giảm thuế và xây giếng nước mới.",
    cooldownDays: 15,
    choices: [
      {
        label: "Chấp nhận — giảm thuế",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -100 },
        ],
        narrativeHint: "Dân vui. Vàng giảm nhưng lòng dân tăng.",
      },
      {
        label: "Từ chối — giữ nguyên thuế",
        outcomePatch: [],
        narrativeHint: "Thực dụng nhưng vô tâm. Dân sẽ nhớ.",
      },
    ],
  },

  // ── XÃ HỘI ──
  {
    id: "festival-celebration",
    title: "Lễ Hội Mừng",
    weight: 10,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Dân chúng tổ chức lễ hội truyền thống. Họ mời người tham dự.",
    cooldownDays: 30,
    choices: [
      {
        label: "Tham dự và tài trợ",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -150 },
        ],
        narrativeHint: "Nhân dân hoan hô. Danh tiếng tăng.",
      },
      {
        label: "Bỏ qua",
        outcomePatch: [],
        narrativeHint: "Lễ hội vẫn diễn ra. Nhưng thiếu sự hiện diện của chúa.",
      },
    ],
  },
  {
    id: "plague-outbreak",
    title: "Dịch Bệnh Bùng Phát",
    weight: 5,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Dịch bệnh lan tràn trong lãnh địa. Dân chúng lo sợ.",
    cooldownDays: 40,
    choices: [
      {
        label: "Cách ly và chữa trị",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -300 },
        ],
        narrativeHint: "Tốn kém nhưng cứu nhiều mạng.",
      },
      {
        label: "Để mặc và hy vọng",
        outcomePatch: [],
        narrativeHint: "Dân chết, lòng dân suy giảm trầm trọng.",
      },
    ],
  },
  {
    id: "harsh-winter",
    title: "Mùa Đông Khắc Nghiệt",
    weight: 8,
    conditions: [
      { type: "season", value: "Đông" },
      { type: "has_holding" },
    ],
    narrativeTag: "event_popup",
    description: "Tuyết rơi dày bất thường. Đường sá đóng băng, lương thực cạn kiệt.",
    cooldownDays: 30,
    choices: [
      {
        label: "Mở kho lương và sưởi ấm cho dân",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -200 },
        ],
        narrativeHint: "Dân sống sót qua đông. Nhưng kho gần cạn.",
      },
      {
        label: "Bắt dân tự xoay xở",
        outcomePatch: [],
        narrativeHint: "Nhiều người chết rét. Lòng dân sụt giảm.",
      },
    ],
  },
  {
    id: "earthquake",
    title: "Động Đất",
    weight: 3,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Mặt đất rung chuyển. Tường thành nứt, nhà cửa sụp đổ.",
    cooldownDays: 60,
    choices: [
      {
        label: "Tái thiết khẩn cấp",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -400 },
        ],
        narrativeHint: "Tái thiết tốn kém nhưng cần thiết.",
      },
      {
        label: "Chỉ sửa những thứ cần thiết nhất",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -150 },
        ],
        narrativeHint: "Tiết kiệm nhưng tường thành vẫn yếu.",
      },
    ],
  },

  // ── MƯU ĐỒ ──
  {
    id: "poisoning-attempt",
    title: "Ám Sát Bằng Độc Dược",
    weight: 4,
    conditions: [],
    narrativeTag: "event_popup",
    description: "Người hầu mang cho người chén rượu — nhưng có gì đó lạ. Mùi vị khác thường.",
    cooldownDays: 30,
    choices: [
      {
        label: "Dừng lại và điều tra",
        outcomePatch: [],
        check: { checkId: "investigate", dc: 14, failPatch: [
          { op: "delta", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -15 },
        ] },
        narrativeHint: "Thành công: phát hiện độc, bắt kẻ âm mưu. Thất bại: uống phải độc nhẹ.",
      },
      {
        label: "Uống — không nghi ngờ gì",
        outcomePatch: [
          { op: "delta", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -25 },
        ],
        narrativeHint: "Bụng nóng rần, đau đầu. Ai đó muốn người chết.",
      },
    ],
  },
  {
    id: "false-accusation",
    title: "Vu Khống",
    weight: 6,
    conditions: [],
    narrativeTag: "raven_scroll",
    description: "Tin đồn xấu về người lan truyền khắp vùng — ai đó đang bôi nhọ danh dự người.",
    cooldownDays: 25,
    choices: [
      {
        label: "Công khai bác bỏ",
        outcomePatch: [],
        check: { checkId: "persuade", dc: 12, failPatch: [] },
        narrativeHint: "Thành công: danh tiếng phục hồi. Thất bại: tin đồn vẫn lan.",
      },
      {
        label: "Truy tìm kẻ đứng sau",
        outcomePatch: [],
        check: { checkId: "investigate", dc: 16, failPatch: [] },
        narrativeHint: "Thành công: biết kẻ thù. Thất bại: mù tịt.",
      },
    ],
  },
  {
    id: "rebellion-stirring",
    title: "Mầm Mống Nổi Loạn",
    weight: 5,
    conditions: [{ type: "has_holding" }],
    narrativeTag: "event_popup",
    description: "Một nhóm dân bất mãn đang tụ tập và kích động nổi loạn.",
    cooldownDays: 30,
    choices: [
      {
        label: "Đàn áp bằng lực lượng",
        outcomePatch: [],
        narrativeHint: "Loạn dẹp, nhưng bạo lực để lại vết thương.",
      },
      {
        label: "Đàm phán và nhượng bộ",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -100 },
        ],
        check: { checkId: "persuade", dc: 12, failPatch: [] },
        narrativeHint: "Thành công: dân bỏ vũ khí. Thất bại: đàm phán thất bại.",
      },
    ],
  },
  {
    id: "mysterious-stranger",
    title: "Kẻ Lạ Mặt",
    weight: 9,
    conditions: [],
    narrativeTag: "event_popup",
    description: "Một kẻ lạ mặt xin gặp riêng người. Kẻ ấy mang theo tin tức quan trọng — hoặc một cái bẫy.",
    cooldownDays: 20,
    choices: [
      {
        label: "Gặp riêng",
        outcomePatch: [],
        narrativeHint: "Ai biết — có thể là cơ hội, có thể là bẫy.",
      },
      {
        label: "Từ chối và đuổi đi",
        outcomePatch: [],
        narrativeHint: "An toàn. Nhưng bỏ lỡ điều gì?",
      },
    ],
  },
  {
    id: "old-debt-called",
    title: "Món Nợ Cũ",
    weight: 7,
    conditions: [{ type: "stat_gte", path: "Thông Tin Nhân Vật.Ngân Khố", value: 500 }],
    narrativeTag: "raven_scroll",
    description: "Một chi nhánh dòng đến đòi trả món nợ cha ông để lại. Pháp lý vững chắc.",
    cooldownDays: 30,
    choices: [
      {
        label: "Trả nợ",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -300 },
        ],
        narrativeHint: "Một Lannister luôn trả nợ. Người cũng vậy.",
      },
      {
        label: "Từ chối trả",
        outcomePatch: [],
        narrativeHint: "Giữ vàng nhưng mất uy tín. Kẻ cho nợ sẽ nhớ.",
      },
    ],
  },
  {
    id: "tourney-invitation",
    title: "Mời Tham Dự Giải Đấu",
    weight: 10,
    conditions: [],
    scope: { continentIds: ["westeros"] },
    narrativeTag: "raven_scroll",
    description: "Tin đến: một giải đấu thương lớn đang được tổ chức. Người được mời tham dự.",
    cooldownDays: 35,
    choices: [
      {
        label: "Tham dự",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -100 },
        ],
        narrativeHint: "Cơ hội chứng tỏ bản thân và gặp gỡ quyền quý.",
      },
      {
        label: "Bỏ qua",
        outcomePatch: [],
        narrativeHint: "Có những việc quan trọng hơn giải đấu.",
      },
    ],
  },
  {
    id: "raven-from-citadel",
    title: "Thư Từ Citadel",
    weight: 8,
    conditions: [],
    scope: { continentIds: ["westeros"] },
    narrativeTag: "raven_scroll",
    description: "Chim ưng từ Citadel mang tin: một Maester mới sẽ được cử đến phục vụ người.",
    cooldownDays: 40,
    choices: [
      {
        label: "Chào đón",
        outcomePatch: [],
        narrativeHint: "Maester mang theo tri thức — và có thể là cả tai mắt Citadel.",
      },
      {
        label: "Từ chối — ta đã có Maester",
        outcomePatch: [],
        narrativeHint: "Citadel sẽ ghi nhận sự từ chối.",
      },
    ],
  },
  {
    id: "wildfire-cache",
    title: "Phát Hiện Kho Lửa Xanh",
    weight: 3,
    conditions: [{ type: "has_holding" }],
    scope: { continentIds: ["westeros"], regionIds: ["the-crownlands", "kings-landing"] },
    narrativeTag: "event_popup",
    description: "Thợ xây phát hiện một kho lửa xanh cũ dưới tầng hầm lãnh địa.",
    cooldownDays: 60,
    choices: [
      {
        label: "Cẩn thận di chuyển và lưu trữ",
        outcomePatch: [],
        check: { checkId: "command", dc: 16, failPatch: [
          { op: "delta", path: "stat_data.Chỉ Số Sinh Tồn.HP", value: -20 },
        ] },
        narrativeHint: "Thành công: vũ khí bí mật. Thất bại: nổ — thiêu hại.",
      },
      {
        label: "Tiêu huỷ",
        outcomePatch: [],
        narrativeHint: "An toàn. Nhưng mất cơ hội.",
      },
    ],
  },
  {
    id: "religious-conflict",
    title: "Xung Đột Tôn Giáo",
    weight: 6,
    conditions: [{ type: "has_holding" }],
    scope: { continentIds: ["westeros"] },
    narrativeTag: "event_popup",
    description: "Người theo đạo Bảy và người thờ Cây Thần cũ bất hoà. Bạo lực sắp bùng nổ.",
    cooldownDays: 30,
    choices: [
      {
        label: "Trung phạt — không thiên vị bên nào",
        outcomePatch: [],
        narrativeHint: "Công bằng nhưng không bên nào hài lòng.",
      },
      {
        label: "Ủng hộ bên mạnh hơn",
        outcomePatch: [],
        narrativeHint: "Một bên vui, một bên căm thù.",
      },
    ],
  },
  {
    id: "bastard-child-claim",
    title: "Con Hoang Đòi Thừa Kế",
    weight: 4,
    conditions: [],
    narrativeTag: "event_popup",
    description: "Một kẻ tự xưng là con hoang của dòng tộc người xuất hiện, đòi được thừa nhận.",
    cooldownDays: 40,
    choices: [
      {
        label: "Thừa nhận",
        outcomePatch: [],
        narrativeHint: "Thêm một thành viên gia tộc — với mọi phức tạp kèm theo.",
      },
      {
        label: "Từ chối và đuổi đi",
        outcomePatch: [],
        narrativeHint: "Kẻ ấy sẽ quay lại. Chúng luôn quay lại.",
      },
    ],
  },
  {
    id: "dragon-sighting",
    title: "Rồng Xuất Hiện",
    weight: 2,
    conditions: [
      { type: "era", value: "aegon-conquest" },
    ],
    narrativeTag: "event_popup",
    description: "Một con rồng bay qua bầu trời lãnh địa người. Dân chúng kinh hoàng.",
    cooldownDays: 50,
    choices: [
      {
        label: "Trấn an dân chúng",
        outcomePatch: [],
        narrativeHint: "Rồng là công cụ chinh phục. Tốt hơn là không làm địch.",
      },
      {
        label: "Chuẩn bị phòng thủ",
        outcomePatch: [
          { op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -200 },
        ],
        narrativeHint: "Phòng thủ trước rồng? Dũng cảm — hoặc điên.",
      },
    ],
  },
  {
    id: "night-watch-recruiter",
    title: "Night's Watch Tuyển Quân",
    weight: 8,
    conditions: [],
    scope: { continentIds: ["westeros"] },
    narrativeTag: "event_popup",
    description: "Một anh em của Night's Watch đến xin người giao tù nhân hoặc tình nguyện cho Tường Thành.",
    cooldownDays: 25,
    choices: [
      {
        label: "Giao tù nhân",
        outcomePatch: [],
        narrativeHint: "Trốn thấy bớt một phiền phức.",
      },
      {
        label: "Từ chối",
        outcomePatch: [],
        narrativeHint: "Night's Watch dần cạn. Nhưng người giữ tù nhân.",
      },
    ],
  },
  // ── ESSOS & THẾ GIỚI RỘNG LỚN ──
  {
    id: "free-city-council-intrigue",
    title: "Âm Mưu Trong Hội Đồng Thành Phố",
    weight: 9,
    conditions: [],
    scope: { continentIds: ["essos"], regionIds: ["braavos", "pentos", "lorath", "norvos", "qohor", "volantis", "myr", "tyrosh", "lys"] },
    narrativeTag: "event_popup",
    description: "Các magister đang đổi phe trước một phiên bỏ phiếu quyết định; mỗi lời hứa đều có một cái giá.",
    cooldownDays: 25,
    choices: [
      { label: "Mua lá phiếu quyết định", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -250 }], narrativeHint: "Vàng mở được cánh cửa hội đồng, nhưng cũng để lại dấu vết." },
      { label: "Đưa bí mật ra mặc cả", outcomePatch: [], check: { checkId: "persuade", dc: 14, failPatch: [] }, narrativeHint: "Một bí mật đúng lúc có thể đáng giá hơn cả kho bạc." },
    ],
  },
  {
    id: "khalasar-on-horizon",
    title: "Khalasar Ngoài Chân Trời",
    weight: 8,
    conditions: [],
    scope: { continentIds: ["essos"], regionIds: ["dothraki-sea", "vaes-dothrak", "lhazar", "sarnor"] },
    narrativeTag: "raven_scroll",
    description: "Bụi ngựa phủ kín chân trời: một khalasar đang tiến về các đồng cỏ và làng mạc quanh người.",
    cooldownDays: 24,
    choices: [
      { label: "Mang lễ vật ra thương lượng", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -180 }], narrativeHint: "Lễ vật có thể đổi lấy đường đi an toàn — nếu khal chấp nhận." },
      { label: "Chuẩn bị chiến đấu", outcomePatch: [], check: { checkId: "command", dc: 15, failPatch: [] }, narrativeHint: "Kỵ binh Dothraki thử lòng mọi bức tường và mọi chỉ huy." },
    ],
  },
  {
    id: "slave-city-uprising",
    title: "Xiềng Xích Bị Bẻ Gãy",
    weight: 6,
    conditions: [{ type: "has_holding" }],
    scope: { continentIds: ["essos"], regionIds: ["astapor", "yunkai", "meereen", "new-ghis", "slavers-bay"] },
    narrativeTag: "event_popup",
    description: "Một cuộc nổi dậy nổ ra giữa đêm; tiếng xích gãy và chuông báo động vang khắp phố.",
    cooldownDays: 35,
    choices: [
      { label: "Mở cổng và bảo vệ người nổi dậy", outcomePatch: [], check: { checkId: "command", dc: 15, failPatch: [] }, narrativeHint: "Một trật tự cũ sụp đổ, nhưng trật tự mới chưa kịp sinh ra." },
      { label: "Giữ thành trung lập", outcomePatch: [], narrativeHint: "Đóng cổng giúp sống sót qua đêm, không giúp tránh phán xét ngày mai." },
    ],
  },
  {
    id: "iron-bank-auditor",
    title: "Sứ Giả Ngân Hàng Sắt",
    weight: 7,
    conditions: [{ type: "stat_gte", path: "Thông Tin Nhân Vật.Ngân Khố", value: 300 }],
    narrativeTag: "raven_scroll",
    description: "Một viên chức Braavos mang sổ da dê tới, đề nghị tín dụng — cùng những điều khoản không bao giờ quên.",
    cooldownDays: 40,
    choices: [
      { label: "Mở đàm phán", outcomePatch: [], check: { checkId: "persuade", dc: 13, failPatch: [] }, narrativeHint: "Ngân hàng không thiên vị, chỉ tính toán." },
      { label: "Từ chối khoản vay", outcomePatch: [], narrativeHint: "Không có món nợ mới, cũng không có số vàng mới." },
    ],
  },
  {
    id: "red-priest-prophecy",
    title: "Lời Tiên Tri Trong Ngọn Lửa",
    weight: 6,
    conditions: [],
    scope: { continentIds: ["essos"] },
    narrativeTag: "event_popup",
    description: "Một tư tế đỏ tuyên bố đã thấy tên người trong lửa và yêu cầu một cuộc gặp kín.",
    cooldownDays: 35,
    choices: [
      { label: "Nhìn vào ngọn lửa", outcomePatch: [], check: { checkId: "investigate", dc: 14, failPatch: [] }, narrativeHint: "Ngọn lửa có thể hé lộ tương lai, hoặc chỉ phản chiếu điều người muốn thấy." },
      { label: "Đuổi tư tế đi", outcomePatch: [], narrativeHint: "Lời tiên tri vẫn sống trong lời đồn dù người từ chối nghe." },
    ],
  },
  {
    id: "jade-sea-caravan",
    title: "Đoàn Hàng Từ Biển Ngọc",
    weight: 10,
    conditions: [],
    scope: { continentIds: ["essos", "ulthos"] },
    narrativeTag: "event_popup",
    description: "Lụa Yi Ti, hổ phách, gia vị và những câu chuyện về phía đông xa xôi được bày dưới các mái lều sặc sỡ.",
    cooldownDays: 22,
    choices: [
      { label: "Mua quyền ưu tiên", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -120 }], narrativeHint: "Hàng quý đổi chủ trước khi tới chợ công khai." },
      { label: "Thu thập tin tức thay vì hàng", outcomePatch: [], check: { checkId: "investigate", dc: 11, failPatch: [] }, narrativeHint: "Thương nhân đường dài biết các cuộc chiến trước cả quạ đưa thư." },
    ],
  },
  {
    id: "summer-islander-swan-ship",
    title: "Thiên Nga Thuyền Cập Bến",
    weight: 9,
    conditions: [{ type: "coastal" }],
    scope: { continentIds: ["summer-isles", "westeros", "sothoryos"], coastalOnly: true },
    narrativeTag: "event_popup",
    description: "Một thiên nga thuyền từ Quần Đảo Mùa Hè cập bến, chở cung gỗ vàng, rượu ngọt và tin tức đại dương.",
    cooldownDays: 30,
    choices: [
      { label: "Mở hội chợ ở cảng", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: 140 }], narrativeHint: "Bến cảng đầy âm nhạc, hàng hoá và thuế chợ." },
      { label: "Thuê họ dẫn đường biển", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -100 }], narrativeHint: "Những hoa tiêu này đọc gió và sao như maester đọc sách." },
    ],
  },
  {
    id: "basilisk-corsairs",
    title: "Hải Tặc Quần Đảo Basilisk",
    weight: 8,
    conditions: [{ type: "coastal" }],
    scope: { continentIds: ["sothoryos", "summer-isles"], coastalOnly: true },
    narrativeTag: "raven_scroll",
    description: "Khói đen bốc lên ngoài khơi; những chiến thuyền hải tặc đang săn người và hàng hoá dọc bờ biển.",
    cooldownDays: 28,
    choices: [
      { label: "Tổ chức truy kích", outcomePatch: [], check: { checkId: "command", dc: 15, failPatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -220 }] }, narrativeHint: "Thắng sẽ làm sạch tuyến biển; thua sẽ mất cả tàu lẫn vàng." },
      { label: "Mua đường an toàn", outcomePatch: [{ op: "delta", path: "stat_data.Thông Tin Nhân Vật.Ngân Khố", value: -160 }], narrativeHint: "Hải tặc giữ lời cho tới khi có kẻ trả giá cao hơn." },
    ],
  },
];
