import type { ApiChatMessage } from "../types/connection";
import type { StatData } from "../mvu/schema";
import { ORIGINS } from "../content/westeros/origins";

/** Các con đường mà cốt truyện có thể tiến triển, không đồng nhất tiến triển với giao tranh. */
export const STORY_CHANNELS = [
  "relationships",
  "politics",
  "intrigue",
  "economy",
  "exploration",
  "survival",
  "mystery",
  "combat",
] as const;

export type StoryChannel = typeof STORY_CHANNELS[number];

export const STORY_CHANNEL_LABELS: Record<StoryChannel, string> = {
  relationships: "quan hệ & lòng trung thành",
  politics: "chính trị & địa vị",
  intrigue: "mưu lược & bí mật",
  economy: "sinh kế & tài nguyên",
  exploration: "khám phá & hành trình",
  survival: "sinh tồn & cái giá phải trả",
  mystery: "tri thức & điều huyền bí",
  combat: "xung đột võ lực",
};

type ChannelWeights = Record<StoryChannel, number>;

export interface OriginStoryProfile {
  originId: string;
  primary: StoryChannel;
  secondary: StoryChannel;
  tertiary?: StoryChannel;
  premise: string;
  dilemma: string;
  weights: ChannelWeights;
}

interface ProfileSeed {
  primary: StoryChannel;
  secondary: StoryChannel;
  tertiary?: StoryChannel;
  premise: string;
  dilemma: string;
}

const BASE_WEIGHTS: ChannelWeights = {
  relationships: 1,
  politics: 0.8,
  intrigue: 0.8,
  economy: 0.75,
  exploration: 0.75,
  survival: 0.75,
  mystery: 0.7,
  // Có mặt trong mọi ván nhưng thấp hơn các con đường tạo diễn biến khác.
  combat: 0.55,
};

/**
 * Mỗi xuất thân có một lời hứa cốt truyện riêng. Trọng số chỉ định hướng;
 * lựa chọn của người chơi và tình thế hiện tại luôn có quyền ưu tiên cao hơn.
 */
const ORIGIN_PROFILE_SEEDS: Record<string, ProfileSeed> = {
  "lord-heir": {
    primary: "politics", secondary: "relationships", tertiary: "economy",
    premise: "quyền thừa kế kéo theo chư hầu, dân chúng và những món nợ của gia tộc",
    dilemma: "giữ quyền lực hay giữ lòng người khi hai điều không còn đi cùng nhau",
  },
  "minor-noble": {
    primary: "politics", secondary: "economy", tertiary: "relationships",
    premise: "một tước vị đủ mở cửa triều đình nhưng chưa đủ khiến ai thật sự kính sợ",
    dilemma: "leo cao bằng bảo trợ và hôn ước hay bảo vệ phần độc lập ít ỏi",
  },
  knight: {
    primary: "relationships", secondary: "combat", tertiary: "politics",
    premise: "lời thề, thanh danh và người mà thanh kiếm đã hứa bảo vệ",
    dilemma: "vâng lệnh hay làm điều danh dự khi mệnh lệnh trở nên ô nhục",
  },
  sellsword: {
    primary: "economy", secondary: "relationships", tertiary: "intrigue",
    premise: "mỗi hợp đồng mua được lưỡi kiếm nhưng không nhất thiết mua được lòng trung thành",
    dilemma: "giữ chữ tín với chủ thuê hay sống sót khi tiền và đạo lý rẽ đôi",
  },
  "maester-novice": {
    primary: "mystery", secondary: "relationships", tertiary: "politics",
    premise: "tri thức chữa được người cũng có thể làm lung lay quyền lực của kẻ cai trị",
    dilemma: "phụng sự vô tư hay dùng điều mình biết để can thiệp vào vận mệnh người khác",
  },
  merchant: {
    primary: "economy", secondary: "politics", tertiary: "relationships",
    premise: "thương lộ, con nợ và tham vọng mua một chỗ đứng mà dòng máu không ban cho",
    dilemma: "tích lũy lợi nhuận hay đánh đổi của cải lấy ảnh hưởng và sự chính danh",
  },
  commoner: {
    primary: "survival", secondary: "relationships", tertiary: "economy",
    premise: "một người vô danh phải dựng tương lai từ lao động, cộng đồng và cơ hội hiếm hoi",
    dilemma: "vươn lên một mình hay bảo vệ những người vẫn còn mắc kẹt ở đáy",
  },
  bastard: {
    primary: "relationships", secondary: "politics", tertiary: "intrigue",
    premise: "khát vọng được thừa nhận luôn va vào luật thừa kế và định kiến huyết thống",
    dilemma: "tìm một gia đình thật sự hay giành lấy cái tên từng khước từ mình",
  },
  "spy-assassin": {
    primary: "intrigue", secondary: "relationships", tertiary: "mystery",
    premise: "bí mật tạo quyền lực nhưng mỗi vỏ bọc lại bào mòn con người thật",
    dilemma: "hoàn thành nhiệm vụ hay cứu người đã đặt niềm tin vào một thân phận giả",
  },
  "old-blood": {
    primary: "mystery", secondary: "survival", tertiary: "relationships",
    premise: "huyết mạch cổ thức tỉnh qua điềm báo, di vật và những kẻ muốn sở hữu nó",
    dilemma: "đón nhận di sản phi nhân hay giữ lấy phần người của chính mình",
  },
  "dothraki-rider": {
    primary: "relationships", secondary: "exploration", tertiary: "combat",
    premise: "địa vị trong khalasar được định bằng tự do, gia đình và khả năng dẫn người qua biển cỏ",
    dilemma: "đi theo sức mạnh của đoàn người hay tự chọn con đường trái với tục lệ",
  },
  "braavosi-bravo": {
    primary: "relationships", secondary: "combat", tertiary: "intrigue",
    premise: "danh tiếng trên đường phố Braavos vừa là áo giáp vừa là lời thách đấu",
    dilemma: "bảo vệ niềm kiêu hãnh công dân hay nhận ra lúc nào danh dự chỉ là chiếc bẫy",
  },
  "magister-heir": {
    primary: "intrigue", secondary: "economy", tertiary: "politics",
    premise: "gia sản, hội đồng thành bang và những liên minh được viết bằng hôn nhân lẫn nợ",
    dilemma: "kế thừa bàn cờ của gia đình hay phá luật để xây quyền lực của riêng mình",
  },
  "ironborn-raider": {
    primary: "exploration", secondary: "economy", tertiary: "relationships",
    premise: "biển, chiến lợi phẩm và danh dự của thủy thủ đoàn kéo ra ngoài khuôn phép đất liền",
    dilemma: "sống theo Cổ Đạo hay tìm một cách cai trị không chỉ dựa vào cướp bóc",
  },
  "wildling-hunter": {
    primary: "survival", secondary: "exploration", tertiary: "relationships",
    premise: "đất hoang không tha thứ, nhưng những lời thề của người tự do cũng không dễ bẻ gãy",
    dilemma: "giữ tự do tuyệt đối hay liên kết với người khác để cùng sống qua hiểm họa",
  },
  "red-priest": {
    primary: "mystery", secondary: "relationships", tertiary: "politics",
    premise: "đức tin ban điềm báo và ảnh hưởng, đồng thời đòi một cái giá ngày càng cụ thể",
    dilemma: "tin vào thị kiến hay vào sinh mạng của những người đang đứng trước mặt",
  },
  "noble-ward": {
    primary: "relationships", secondary: "intrigue", tertiary: "politics",
    premise: "một mái nhà vừa nuôi dưỡng vừa giam giữ, nơi tình thân và giá trị con tin nhập nhằng",
    dilemma: "trung thành với gia đình sinh ra mình hay với gia đình đã nuôi lớn mình",
  },
  "prince-princess": {
    primary: "politics", secondary: "relationships", tertiary: "intrigue",
    premise: "mọi tình bạn, hôn ước và sai lầm cá nhân đều có thể trở thành việc của vương quốc",
    dilemma: "làm người mà mình muốn hay biểu tượng mà ngai vàng cần",
  },
  "distant-relative": {
    primary: "intrigue", secondary: "politics", tertiary: "relationships",
    premise: "đứng đủ gần quyền kế vị để bị lợi dụng nhưng đủ xa để dễ bị bỏ quên",
    dilemma: "chấp nhận vai phụ an toàn hay bước vào cuộc chơi có thể nuốt chửng mình",
  },
  "royal-bastard": {
    primary: "politics", secondary: "relationships", tertiary: "intrigue",
    premise: "dòng máu vương giả không hợp pháp biến sự tồn tại thành một tuyên bố chính trị",
    dilemma: "đòi quyền được sinh ra cùng mình hay từ chối trở thành lá cờ cho kẻ khác",
  },
  "sworn-sword": {
    primary: "relationships", secondary: "intrigue", tertiary: "combat",
    premise: "sự thân cận với chủ nhân khiến người cầm kiếm nghe và thấy những điều nguy hiểm",
    dilemma: "trung thành với một con người hay với ý nghĩa cao nhất của lời thề",
  },
  "time-traveler": {
    primary: "mystery", secondary: "politics", tertiary: "relationships",
    premise: "kiến thức lạc thời có thể cứu người, phá lịch sử hoặc khiến người sở hữu bị săn đuổi",
    dilemma: "can thiệp để đổi tương lai hay chấp nhận giới hạn của hiểu biết không còn chắc đúng",
  },
  "free-city-artisan": {
    primary: "economy", secondary: "relationships", tertiary: "mystery",
    premise: "tay nghề tạo danh tiếng, phường hội, học trò và những đối thủ muốn chiếm bí quyết",
    dilemma: "giữ nghệ thuật nguyên vẹn hay biến nó thành hàng hóa để đổi lấy tự do",
  },
  "iron-bank-envoy": {
    primary: "economy", secondary: "politics", tertiary: "intrigue",
    premise: "mỗi khoản vay là đòn bẩy làm thay đổi chiến tranh và người ngồi trên ngai",
    dilemma: "thu hồi món nợ đúng luật hay tính đến hậu quả mà sổ cái không ghi",
  },
  "unsullied-veteran": {
    primary: "relationships", secondary: "survival", tertiary: "politics",
    premise: "tự do mới buộc một cựu nô binh phải tự định nghĩa gia đình, mục đích và mệnh lệnh",
    dilemma: "bám vào kỷ luật từng cứu mạng hay học cách tự lựa chọn dù có thể sai",
  },
  freedperson: {
    primary: "relationships", secondary: "economy", tertiary: "politics",
    premise: "tự do trên danh nghĩa cần được biến thành sinh kế, cộng đồng và quyền tự quyết thật",
    dilemma: "xây một đời riêng hay quay lại giải phóng những người chưa thoát được",
  },
  "ghiscari-noble": {
    primary: "politics", secondary: "intrigue", tertiary: "economy",
    premise: "đặc quyền cũ lung lay trước trật tự mới và ký ức của những người từng bị trị",
    dilemma: "giữ di sản gia tộc hay từ bỏ nền móng bất công đã tạo ra nó",
  },
  "qartheen-pureborn": {
    primary: "economy", secondary: "intrigue", tertiary: "politics",
    premise: "lụa, hội buôn và nghi lễ che giấu một cuộc cạnh tranh quyền lực không kém phần tàn nhẫn",
    dilemma: "tuân theo vẻ ngoài thanh nhã hay phơi bày giao dịch bẩn đang chống đỡ địa vị",
  },
  "lhazareen-healer": {
    primary: "survival", secondary: "relationships", tertiary: "mystery",
    premise: "việc chữa lành gắn số phận người thầy thuốc với cộng đồng thường xuyên bị kẻ mạnh chà đạp",
    dilemma: "giữ lời thề cứu mọi người hay chọn ai được sống khi nguồn lực cạn kiệt",
  },
  "sellsword-officer": {
    primary: "economy", secondary: "politics", tertiary: "relationships",
    premise: "một đại đội sống bằng hợp đồng, sĩ khí và niềm tin rằng người chỉ huy sẽ không bán rẻ họ",
    dilemma: "nhận chiến dịch béo bở hay giữ quân đoàn khỏi cuộc chiến không đáng chết",
  },
  shadowbinder: {
    primary: "mystery", secondary: "intrigue", tertiary: "survival",
    premise: "tri thức bóng tối mở những cánh cửa mà mỗi lần bước qua đều để lại một món nợ",
    dilemma: "dùng quyền năng để đạt mục đích hay dừng lại trước khi cái giá nuốt mất bản thân",
  },
  "yi-ti-courtier": {
    primary: "politics", secondary: "intrigue", tertiary: "relationships",
    premise: "điển lễ, con dấu và phe phái triều đình quyết định số phận trước khi gươm được rút",
    dilemma: "giữ phép tắc để duy trì trật tự hay phá lệ nhằm ngăn một bất công lớn hơn",
  },
  "jogos-nhai-rider": {
    primary: "exploration", secondary: "relationships", tertiary: "survival",
    premise: "đồng bằng, jhat và lời chỉ dẫn của moonsinger nối hành trình với nghĩa vụ bộ tộc",
    dilemma: "theo con đường tổ tiên vạch ra hay dẫn người mình yêu tới một chân trời mới",
  },
  "ibbenese-whaler": {
    primary: "survival", secondary: "economy", tertiary: "relationships",
    premise: "một chuyến săn dài đặt miếng ăn, danh dự thủy đoàn và sự tàn nhẫn của biển lên cùng bàn cân",
    dilemma: "theo đuổi con mồi cứu cả mùa đông hay quay về trước khi biển lấy thêm mạng",
  },
  "summer-isles-archer": {
    primary: "exploration", secondary: "relationships", tertiary: "politics",
    premise: "những con tàu thiên nga mang theo thương mại, sứ mệnh bảo hộ và ràng buộc quê đảo",
    dilemma: "mở mình với thế giới rộng lớn hay giữ an toàn cho truyền thống đang bị nhòm ngó",
  },
  "naathi-healer": {
    primary: "relationships", secondary: "survival", tertiary: "politics",
    premise: "lòng bất bạo động bị thử thách bởi những kẻ coi sự hiền hòa là yếu đuối",
    dilemma: "giữ nguyên nguyên tắc hòa bình hay thay đổi cách bảo vệ người vô tội",
  },
  "basilisk-pirate": {
    primary: "intrigue", secondary: "survival", tertiary: "economy",
    premise: "thủy thủ đoàn, chiến lợi phẩm và những cảng độc địa khiến liên minh đổi theo từng con nước",
    dilemma: "phản bội trước để sống hay đặt cược vào lòng tin giữa những kẻ không đáng tin",
  },
  "sothoryi-guide": {
    primary: "exploration", secondary: "survival", tertiary: "mystery",
    premise: "rừng sâu, bệnh khí và di tích thất lạc biến kiến thức đường đi thành quyền lực",
    dilemma: "dẫn người ngoài tới điều họ tìm kiếm hay bảo vệ vùng đất khỏi lòng tham của họ",
  },
  "ulthos-wanderer": {
    primary: "mystery", secondary: "exploration", tertiary: "relationships",
    premise: "ký ức về bờ rừng chưa ai vẽ bản đồ khiến mọi nơi đặt chân tới đều vừa lạ vừa quen",
    dilemma: "tìm đường trở về hay chấp nhận dựng căn tính mới giữa những người không hiểu mình",
  },
  "rhoynar-river-sailor": {
    primary: "exploration", secondary: "mystery", tertiary: "relationships",
    premise: "dòng sông nối các bến bí mật với di sản Rhoynar đã mất và những cộng đồng còn lưu lạc",
    dilemma: "đi theo dòng nước để sống tự do hay dừng lại phục hồi một quê hương chỉ còn trong chuyện kể",
  },
};

function makeWeights(seed: ProfileSeed): ChannelWeights {
  const weights = { ...BASE_WEIGHTS };
  weights[seed.primary] += 1.35;
  weights[seed.secondary] += 0.8;
  if (seed.tertiary) weights[seed.tertiary] += 0.35;
  // Ngay cả xuất thân võ lực cũng không được biến chiến đấu thành con đường duy nhất.
  weights.combat = Math.min(weights.combat, 1.55);
  return weights;
}

export const ORIGIN_STORY_PROFILES: Record<string, OriginStoryProfile> = Object.fromEntries(
  Object.entries(ORIGIN_PROFILE_SEEDS).map(([originId, seed]) => [originId, {
    originId,
    ...seed,
    weights: makeWeights(seed),
  }]),
);

const KEYWORDS: Record<StoryChannel, readonly string[]> = {
  relationships: ["hảo cảm", "tin cậy", "gia đình", "tình bạn", "tình yêu", "lời thề", "trung thành", "tha thứ", "phản bội", "hôn nhân"],
  politics: ["triều đình", "hội đồng", "ngai", "chư hầu", "kế vị", "sứ giả", "liên minh", "ngoại giao", "sắc lệnh", "lãnh chúa"],
  intrigue: ["âm mưu", "bí mật", "gián điệp", "điệp viên", "tống tiền", "đầu độc", "theo dõi", "bằng chứng", "nghi phạm", "mật thư"],
  economy: ["vàng", "ngân khố", "thương nhân", "hợp đồng", "buôn bán", "hàng hóa", "nợ", "thuế", "lương thực", "mùa màng"],
  exploration: ["hành trình", "lên đường", "bản đồ", "di tích", "bờ biển", "khu rừng", "con đường", "vùng đất", "khám phá", "thám hiểm"],
  survival: ["đói", "khát", "bão", "bệnh", "vết thương", "trú ẩn", "sống sót", "kiệt sức", "thuốc", "mùa đông"],
  mystery: ["điềm báo", "giấc mơ", "cổ ngữ", "ma thuật", "huyết mạch", "nghi lễ", "lời tiên tri", "di vật", "học giả", "bí ẩn"],
  combat: ["<combat_trigger", "giao chiến", "trận chiến", "đấu kiếm", "rút kiếm", "tấn công", "xung phong", "máu đổ", "chém", "giết"],
};

function emptyMix(): ChannelWeights {
  return Object.fromEntries(STORY_CHANNELS.map((channel) => [channel, 0])) as ChannelWeights;
}

function normalized(text: string): string {
  return text.toLocaleLowerCase("vi").normalize("NFC");
}

export function classifyStoryText(text: string): ChannelWeights {
  const source = normalized(text);
  const mix = emptyMix();
  for (const channel of STORY_CHANNELS) {
    for (const keyword of KEYWORDS[channel]) {
      if (source.includes(keyword)) mix[channel] += keyword.startsWith("<") ? 2 : 1;
    }
  }
  return mix;
}

function channelSet(text: string): Set<StoryChannel> {
  const mix = classifyStoryText(text);
  return new Set(STORY_CHANNELS.filter((channel) => mix[channel] > 0));
}

function inferOriginIds(state: StatData): string[] {
  const stored = state["Cài Đặt Ván"]["_ID Xuất Thân"];
  if (stored.length > 0) return [...new Set(stored)];

  const display = normalized(state["Thông Tin Nhân Vật"]["Xuất Thân"]);
  const displayParts = display.split(/\s+\+\s+/).map((part) => part.trim()).filter(Boolean);
  const exact = ORIGINS
    .filter((origin) => displayParts.includes(normalized(origin.name)))
    .map((origin) => origin.id);
  if (exact.length > 0) return exact;

  // Fallback cho save rất cũ có thêm chú thích quanh tên; ưu tiên tên dài nhất để
  // "Con Hoang Quyền Quý" không bị nhận nhầm thành cả "Con Hoang".
  const closest = [...ORIGINS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((origin) => display.includes(normalized(origin.name)));
  return closest ? [closest.id] : ["adaptive"];
}

function adaptiveProfile(state: StatData): OriginStoryProfile {
  const info = state["Thông Tin Nhân Vật"];
  const core = state["Chỉ Số Cốt Lõi"];
  const weights = { ...BASE_WEIGHTS };
  weights.relationships += core["Uy Tín"] / 20;
  weights.politics += (Object.keys(state["Lãnh Địa"]).length > 0 ? 0.7 : 0) + core["Uy Tín"] / 40;
  weights.intrigue += (core["Trí Tuệ"] + core["Tinh Tường"]) / 50;
  weights.mystery += core["Trí Tuệ"] / 35;
  weights.exploration += core["Tinh Tường"] / 35;
  weights.survival += core["Thể Chất"] / 40;
  weights.combat += Math.max(core["Sức Mạnh"], core["Nhanh Nhẹn"]) / 55;
  weights.combat = Math.min(weights.combat, 1.35);
  const ranked = [...STORY_CHANNELS].sort((a, b) => weights[b] - weights[a]);
  return {
    originId: "adaptive",
    primary: ranked[0],
    secondary: ranked[1],
    tertiary: ranked[2],
    premise: `thân phận ${info["Xuất Thân"] || "chưa được định danh"} phải tạo dấu ấn bằng năng lực và lựa chọn trong hiện tại`,
    dilemma: "theo đuổi điều bản thân giỏi nhất hay đáp lại điều hoàn cảnh và con người đang cần",
    weights,
  };
}

function profilesForState(state: StatData): OriginStoryProfile[] {
  const adaptive = adaptiveProfile(state);
  return inferOriginIds(state).map((id) => ORIGIN_STORY_PROFILES[id] ?? { ...adaptive, originId: id });
}

function combinedWeights(profiles: OriginStoryProfile[]): ChannelWeights {
  const result = emptyMix();
  for (const channel of STORY_CHANNELS) {
    result[channel] = profiles.reduce((sum, profile) => sum + profile.weights[channel], 0) / profiles.length;
  }
  return result;
}

function recentAssistantMessages(history: ApiChatMessage[]): ApiChatMessage[] {
  return history.filter((message) => message.role === "assistant").slice(-8);
}

function recentMix(history: ApiChatMessage[]): ChannelWeights {
  const result = emptyMix();
  const recent = recentAssistantMessages(history);
  recent.forEach((message, index) => {
    // Cảnh mới ảnh hưởng mạnh hơn cảnh cũ, nhưng không xóa sạch ký ức về nhịp điệu.
    const recency = 0.45 + (index + 1) / Math.max(1, recent.length) * 0.55;
    const classified = classifyStoryText(message.content);
    for (const channel of STORY_CHANNELS) result[channel] += Math.min(2, classified[channel]) * recency;
  });
  return result;
}

function activeQuestPressure(state: StatData, scores: ChannelWeights): void {
  for (const quest of Object.values(state["Nhiệm Vụ"])) {
    if (quest["Trạng Thái"] !== "Đang Làm") continue;
    if (quest["Loại"] === "Gia Tộc") scores.relationships += 0.45;
    if (quest["Loại"] === "Chính Trị") scores.politics += 0.5;
    if (quest["Loại"] === "Quân Sự") {
      scores.politics += 0.35;
      scores.combat += 0.25;
    }
    if (quest["Loại"] === "Cốt Truyện Chính") scores.intrigue += 0.25;
  }
}

function statePressure(state: StatData, scores: ChannelWeights): void {
  const atWar = Object.values(state["Quan Hệ Ngoại Giao"]).some((relation) => relation["Trạng Thái"] === "Chiến Tranh");
  if (atWar) {
    scores.politics += 0.65;
    scores.economy += 0.3;
    scores.relationships += 0.25;
    scores.combat += 0.45;
  }
  if (Object.keys(state["Lãnh Địa"]).length > 0) {
    scores.politics += 0.25;
    scores.economy += 0.35;
  }
  if (Object.keys(state["Tình Báo"]["Điệp Viên"]).length > 0 || Object.keys(state["Âm Mưu"]).length > 0) {
    scores.intrigue += 0.5;
  }
  const vitals = state["Chỉ Số Sinh Tồn"];
  if (vitals["HP"] < 45 || vitals["Đói"] < 35 || vitals["Khát"] < 35) scores.survival += 1.1;
  activeQuestPressure(state, scores);
}

function latestUserIntent(history: ApiChatMessage[]): StoryChannel | null {
  const lastUser = [...history].reverse().find((message) => message.role === "user");
  if (!lastUser) return null;
  const mix = classifyStoryText(lastUser.content);
  const ranked = [...STORY_CHANNELS].sort((a, b) => mix[b] - mix[a]);
  return mix[ranked[0]] > 0 ? ranked[0] : null;
}

function consecutiveCombatScenes(history: ApiChatMessage[]): number {
  let count = 0;
  for (const message of [...recentAssistantMessages(history)].reverse()) {
    if (!channelSet(message.content).has("combat")) break;
    count++;
  }
  return count;
}

export interface StoryDriveDecision {
  originIds: string[];
  primary: StoryChannel;
  supporting: StoryChannel[];
  scores: ChannelWeights;
  recentMix: ChannelWeights;
  combatCooling: boolean;
  explicitIntent: StoryChannel | null;
  profiles: OriginStoryProfile[];
  prompt: string;
}

/** Chọn nhịp kế tiếp theo xuất thân, state và độ lặp của các cảnh gần đây. */
export function decideStoryDrive(state: StatData, history: ApiChatMessage[]): StoryDriveDecision {
  const profiles = profilesForState(state);
  const base = combinedWeights(profiles);
  const recent = recentMix(history);
  const scores = { ...base };

  // Nội dung càng vắng lâu càng được "đói"; nội dung vừa xuất hiện dày bị giảm nhịp.
  for (const channel of STORY_CHANNELS) {
    const target = base[channel] * 0.9;
    scores[channel] += Math.max(0, target - recent[channel]) * 0.5;
    scores[channel] -= recent[channel] * 0.22;
  }
  statePressure(state, scores);

  const explicitIntent = latestUserIntent(history);
  if (explicitIntent) {
    scores[explicitIntent] += 2.8;
    const strongestAlternative = Math.max(
      ...STORY_CHANNELS.filter((channel) => channel !== explicitIntent).map((channel) => scores[channel]),
    );
    // Quyền chủ động rõ ràng của người chơi luôn cao hơn nhịp cân bằng tự động.
    scores[explicitIntent] = Math.max(scores[explicitIntent], strongestAlternative + 0.75);
  }

  const combatCooling = consecutiveCombatScenes(history) >= 2 && explicitIntent !== "combat";
  if (combatCooling) scores.combat = Math.min(scores.combat * 0.15, 0.2);

  const ranked = [...STORY_CHANNELS].sort((a, b) => scores[b] - scores[a]);
  const primary = ranked[0];
  const supporting = ranked.slice(1, 3);
  const originNames = profiles.map((profile) =>
    ORIGINS.find((origin) => origin.id === profile.originId)?.name
      ?? (state["Thông Tin Nhân Vật"]["Xuất Thân"] || profile.originId),
  );
  const profileLines = profiles.map((profile, index) =>
    `- ${originNames[index]}: ${profile.premise}; thế lưỡng nan: ${profile.dilemma}.`,
  );
  const intentLine = explicitIntent
    ? `Ý định vừa nêu của người chơi thuộc hướng ${STORY_CHANNEL_LABELS[explicitIntent]}: ưu tiên đáp lại trực tiếp, không bẻ lái cưỡng ép.`
    : "Người chơi chưa yêu cầu một hướng cụ thể: có thể đưa áp lực hoặc cơ hội mới nhưng phải chừa quyền lựa chọn.";
  const coolingLine = combatCooling
    ? "Hai cảnh gần nhất đã có võ lực: KHÔNG tự mở thêm giao tranh ở lượt này. Hãy cho hậu quả xã hội, chính trị, sinh tồn hoặc vật chất của bạo lực lên tiếng."
    : "Chiến đấu chỉ là một khả năng hậu quả; không tự biến mọi trở ngại thành phục kích hay đấu kiếm.";

  const prompt = `【ENGINE THÚC ĐẨY CỐT TRUYỆN THEO XUẤT THÂN】
Engine chọn nhịp chính: **${STORY_CHANNEL_LABELS[primary]}**.
Hai lớp đan hỗ trợ: ${supporting.map((channel) => STORY_CHANNEL_LABELS[channel]).join(" + ")}.

Hồ sơ động lực:
${profileLines.join("\n")}

${intentLine}
${coolingLine}

Luật triển khai:
1. Làm tình thế TIẾN TRIỂN bằng một thay đổi cụ thể: quan hệ đổi sắc, bí mật lộ thêm, nguồn lực biến động, nghĩa vụ siết lại, địa điểm mở ra hoặc lựa chọn phải trả giá.
2. Gắn nhịp mới với ít nhất một hồ sơ xuất thân ở trên; không dùng biến cố ngẫu nhiên vô can chỉ để tạo kịch tính.
3. Đan hướng chính với ít nhất một lớp hỗ trợ, nhưng không giải quyết thay người chơi và không ép kết quả định sẵn.
4. Cân bằng cảnh căng với cảnh đối thoại, khám phá, quản trị, điều tra, chăm sóc hoặc đời thường có hệ quả. “Thúc đẩy cốt truyện” không đồng nghĩa “bắt đầu đánh nhau”.
5. Nếu đang ở giữa một cảnh hoặc người chơi đã chọn hành động, tiếp nối nhân quả của cảnh đó trước; chỉ dùng gợi ý này để chọn hệ quả và móc nối tiếp theo.`;

  return {
    originIds: profiles.map((profile) => profile.originId),
    primary,
    supporting,
    scores,
    recentMix: recent,
    combatCooling,
    explicitIntent,
    profiles,
    prompt,
  };
}

export function buildStoryDrivePrompt(state: StatData, history: ApiChatMessage[]): string {
  return decideStoryDrive(state, history).prompt;
}
