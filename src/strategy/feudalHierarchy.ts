import type { StatData } from "../mvu/schema";
import { playerHoldingIds } from "../territory/territoryEngine";

/**
 * Từ điển phân cấp phong kiến dùng chung cho quyền hạn, UI và engine quản trị.
 *
 * Ba lớp tuyệt đối không được nhập làm một:
 * - Thành trì: một địa điểm/công trình phòng thủ vật lý.
 * - Lãnh địa trực thuộc (demesne): đất và dân do chủ nhân trực tiếp khai thác.
 * - Tước địa (fief/polity): thẩm quyền pháp lý trên một hay nhiều lãnh thổ,
 *   thường chứa đất trực thuộc lẫn đất do chư hầu tự quản.
 */

export type FeudalJurisdiction =
  | "Không Có Đất"
  | "Lãnh Địa Hiệp Sĩ"
  | "Nam Tước Địa"
  | "Tử Tước Địa"
  | "Bá Quốc"
  | "Hầu Quốc"
  | "Công Quốc"
  | "Thân Vương Quốc"
  | "Vương Quốc"
  | "Liên Vương Quốc"
  | "Đế Quốc";

export type GovernanceTier = "unlanded" | "stronghold" | "demesne" | "territory" | "fief" | "realm" | "empire";

export interface TitleDefinition {
  id: string;
  title: string;
  feminineTitle?: string;
  rank: number;
  jurisdiction: FeudalJurisdiction;
  governanceTier: GovernanceTier;
  canHoldStronghold: boolean;
  canManageDemesne: boolean;
  canGovernTerritory: boolean;
  canReceiveVassals: boolean;
  canGrantTitles: boolean;
  sovereign: boolean;
  description: string;
}

export const TITLE_DEFINITIONS: TitleDefinition[] = [
  {
    id: "commoner", title: "Thường Dân", rank: 0, jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Không có tước vị hay thẩm quyền phong kiến; tài sản cá nhân không tự biến thành lãnh địa.",
  },
  {
    id: "knight", title: "Hiệp Sĩ", rank: 1, jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Tước hiệu cá nhân và địa vị quân sự; hiệp sĩ không mặc nhiên có đất hay quyền xét xử.",
  },
  {
    id: "landed-knight", title: "Hiệp Sĩ Phong Địa", rank: 2, jurisdiction: "Lãnh Địa Hiệp Sĩ", governanceTier: "demesne",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Giữ một trang viên hoặc thành nhỏ trực tiếp, vẫn phụ thuộc lãnh chúa cấp trên.",
  },
  {
    id: "baron", title: "Nam Tước", feminineTitle: "Nữ Nam Tước", rank: 3, jurisdiction: "Nam Tước Địa", governanceTier: "fief",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: false, sovereign: false,
    description: "Lãnh chúa có tước địa nhỏ, quyền tòa án và địa tô địa phương; thường trực tiếp giữ thành chính.",
  },
  {
    id: "viscount", title: "Tử Tước", feminineTitle: "Nữ Tử Tước", rank: 4, jurisdiction: "Tử Tước Địa", governanceTier: "fief",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: false, sovereign: false,
    description: "Tước địa trung gian, có thể giám sát nhiều nam tước địa hoặc một đơn vị hành chính lớn hơn.",
  },
  {
    id: "count", title: "Bá Tước", feminineTitle: "Nữ Bá Tước", rank: 5, jurisdiction: "Bá Quốc", governanceTier: "fief",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: false,
    description: "Cai quản bá quốc gồm nhiều lãnh địa và thành trì, phần lớn thông qua chư hầu và quan lại.",
  },
  {
    id: "marquess", title: "Hầu Tước", feminineTitle: "Nữ Hầu Tước", rank: 6, jurisdiction: "Hầu Quốc", governanceTier: "fief",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: false,
    description: "Cai quản hầu quốc hoặc vùng biên (march), có trách nhiệm quân sự và phòng thủ biên giới cao hơn.",
  },
  {
    id: "duke", title: "Công Tước", feminineTitle: "Nữ Công Tước", rank: 7, jurisdiction: "Công Quốc", governanceTier: "fief",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: false,
    description: "Đứng đầu công quốc rộng gồm nhiều bá quốc/hầu quốc; cai trị chủ yếu qua tầng chư hầu.",
  },
  {
    id: "prince", title: "Thân Vương", feminineTitle: "Nữ Thân Vương", rank: 8, jurisdiction: "Thân Vương Quốc", governanceTier: "realm",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: true,
    description: "Người cai trị một thân vương quốc có chủ quyền hoặc bán chủ quyền; khác vương tử chỉ mang huyết thống hoàng gia.",
  },
  {
    id: "king", title: "Quốc Vương", feminineTitle: "Nữ Vương", rank: 9, jurisdiction: "Vương Quốc", governanceTier: "realm",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: true,
    description: "Nguyên thủ một vương quốc; ban luật toàn cõi và điều phối đại chư hầu, nhưng không trực tiếp sở hữu mọi thành của họ.",
  },
  {
    id: "high-king", title: "Vua Bảy Vương Quốc", rank: 10, jurisdiction: "Liên Vương Quốc", governanceTier: "realm",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: true,
    description: "Vương quyền đứng trên nhiều vương quốc lịch sử; quyền tối cao vẫn vận hành qua các đại chư hầu.",
  },
  {
    id: "emperor", title: "Hoàng Đế", feminineTitle: "Nữ Hoàng Đế", rank: 11, jurisdiction: "Đế Quốc", governanceTier: "empire",
    canHoldStronghold: true, canManageDemesne: true, canGovernTerritory: true,
    canReceiveVassals: true, canGrantTitles: true, sovereign: true,
    description: "Đứng đầu đế quốc gồm nhiều vương quốc hoặc chính thể; trọng tâm là cân bằng các vương quyền lệ thuộc.",
  },
];

/**
 * Tước xưng huyết thống, hôn phối và chức vụ triều đình không phải tước đất.
 * Giữ riêng khỏi thang phong kiến để UI không xếp Vương Hậu hay Bàn Tay Nhà
 * Vua như một nấc giữa Hiệp Sĩ và Nam Tước, nhưng vẫn hiển thị đúng danh xưng.
 */
const NON_LANDED_STYLES: TitleDefinition[] = [
  {
    id: "royal-consort", title: "Vương Hậu / Vương Phu", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Danh xưng hôn phối với quân chủ; không tự tạo quyền sở hữu đất, quân hay chư hầu.",
  },
  {
    id: "royal-blood", title: "Vương Tử / Công Chúa", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Địa vị huyết thống hoàng gia; chỉ có quyền cai trị khi giữ thêm một tước địa hợp pháp.",
  },
  {
    id: "heir", title: "Người Thừa Kế", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Đứng trong hàng kế vị nhưng chưa phải người giữ tước; đất và quyền vẫn thuộc chủ hiện tại.",
  },
  {
    id: "regent", title: "Nhiếp Chính", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Một chức vụ được ủy quyền thay quân chủ; không biến tài sản của quân chủ thành sở hữu cá nhân.",
  },
  {
    id: "noble-style", title: "Phu Nhân / Tiểu Thư", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Kính xưng quý tộc hoặc hôn phối; quyền đất đai phải đến từ một tước địa riêng.",
  },
  {
    id: "court-office", title: "Chức Vụ Triều Đình", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Quyền công vụ trong triều đình, tách biệt hoàn toàn với tước đất và tài sản trực thuộc.",
  },
  {
    id: "former-holder", title: "Cố Lãnh Chúa", rank: 0,
    jurisdiction: "Không Có Đất", governanceTier: "unlanded",
    canHoldStronghold: false, canManageDemesne: false, canGovernTerritory: false,
    canReceiveVassals: false, canGrantTitles: false, sovereign: false,
    description: "Danh xưng hồi cố; người đã mất hoặc thôi giữ tước không còn quyền quản trị hiện hành.",
  },
];

const BY_ID = Object.fromEntries(
  [...TITLE_DEFINITIONS, ...NON_LANDED_STYLES].map((definition) => [definition.id, definition]),
);

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase("vi").normalize("NFC").replace(/[–—]/g, "-").replace(/\s+/g, " ");
}

const TITLE_ALIASES: Record<string, string> = {
  "thường dân": "commoner",
  "hiệp sĩ": "knight",
  "kiếm sĩ": "knight",
  "hiệp sĩ phong địa": "landed-knight",
  "landed knight": "landed-knight",
  "lãnh chúa thành trì": "landed-knight",
  "nam tước": "baron",
  "lãnh chúa": "baron",
  "tiểu lãnh chúa": "baron",
  "minor lord": "baron",
  "tử tước": "viscount",
  "bá tước": "count",
  "earl": "count",
  "hầu tước": "marquess",
  "margrave": "marquess",
  "công tước": "duke",
  "đại lãnh chúa": "duke",
  "lord paramount": "duke",
  "thân vương": "prince",
  "nữ thân vương": "prince",
  "prince regnant": "prince",
  "quốc vương": "king",
  "vua": "king",
  "nữ vương": "king",
  "vua bảy vương quốc": "high-king",
  "vua phương bắc": "king",
  "king in the north": "king",
  "hoàng đế": "emperor",
  "nữ hoàng đế": "emperor",
  // Chức vụ, hôn phối hoặc huyết thống: giữ đúng danh xưng nhưng không cấp đất.
  "vương hậu": "royal-consort",
  "hoàng hậu": "royal-consort",
  "nữ hoàng": "royal-consort",
  "vương phu": "royal-consort",
  "vương phi": "royal-consort",
  "vương tử": "royal-blood",
  "vương nữ": "royal-blood",
  "công chúa": "royal-blood",
  "hoàng tử": "royal-blood",
  "vương thân": "royal-blood",
  "vương tôn": "royal-blood",
  "vương tử / vương nữ": "royal-blood",
  "người thừa kế": "heir",
  "nhiếp chính": "regent",
  "phu nhân": "noble-style",
  "tiểu thư": "noble-style",
  "bàn tay nhà vua": "court-office",
  "tể tướng": "court-office",
  "cố lãnh chúa": "former-holder",
};

/** Tra tước vị, chấp nhận alias Westeros/save cũ mà không nâng quyền vô cớ. */
export function titleDefinition(title: string): TitleDefinition {
  const normalized = normalizeTitle(title || "Thường Dân");
  const exactId = TITLE_ALIASES[normalized];
  if (exactId) return BY_ID[exactId];

  // Dữ liệu canon hay thêm địa danh sau tước vị ("Lord of Winterfell").
  if (/nhiếp chính|queen regent|prince regent|\bregent\b/.test(normalized)) return BY_ID.regent;
  if (/vương hậu|hoàng hậu|queen consort|vương phu|vương phi/.test(normalized)) return BY_ID["royal-consort"];
  if (/vương tử|vương nữ|công chúa|hoàng tử|vương thân|vương tôn|prince of the blood|princess/.test(normalized)) return BY_ID["royal-blood"];
  if (/người thừa kế|heir apparent|heir presumptive/.test(normalized)) return BY_ID.heir;
  if (/bàn tay nhà vua|hand of the king|tể tướng/.test(normalized)) return BY_ID["court-office"];
  if (/hoàng đế|emperor/.test(normalized)) return BY_ID.emperor;
  if (/vua bảy vương quốc|king of the andals|high king/.test(normalized)) return BY_ID["high-king"];
  if (/quốc vương|\bvua\b|\bking\b|queen regnant/.test(normalized)) return BY_ID.king;
  if (/thân vương|prince regnant|ruling prince/.test(normalized)) return BY_ID.prince;
  if (/công tước|đại lãnh chúa|lord paramount|\bduke\b/.test(normalized)) return BY_ID.duke;
  if (/hầu tước|marquess|margrave/.test(normalized)) return BY_ID.marquess;
  if (/bá tước|\bearl\b|\bcount\b/.test(normalized)) return BY_ID.count;
  if (/tử tước|viscount/.test(normalized)) return BY_ID.viscount;
  if (/nam tước|\bbaron\b|\blord of\b|lãnh chúa/.test(normalized)) return BY_ID.baron;
  if (/phong địa|landed knight/.test(normalized)) return BY_ID["landed-knight"];
  if (/hiệp sĩ|\bknight\b/.test(normalized)) return BY_ID.knight;
  return BY_ID.commoner;
}

export function getTitleRank(title: string): number {
  return titleDefinition(title).rank;
}

export const FEUDAL_GLOSSARY = [
  {
    term: "Thành trì",
    definition: "Một địa điểm phòng thủ vật lý: lâu đài, tường, cổng, kho, doanh trại và quân đồn trú. Thành trì có thể nằm trong lãnh địa nhưng không đồng nghĩa với toàn bộ đất đai.",
  },
  {
    term: "Lãnh địa trực thuộc",
    definition: "Đất, dân và nguồn lợi do chủ nhân quản lý trực tiếp để nuôi gia đình, triều đình nhỏ và thành trì; gồm ruộng, đồng cỏ, rừng và thôn ấp.",
  },
  {
    term: "Lãnh thổ",
    definition: "Khái niệm địa lý–chủ quyền: một vùng đất đang do thế lực nào kiểm soát. Nắm lãnh thổ không cho phép xây trong mọi thành của chư hầu trên đó.",
  },
  {
    term: "Tước địa",
    definition: "Đơn vị thẩm quyền được giữ nhờ tước vị. Nó có thể chứa lãnh địa trực thuộc của người cai trị và nhiều lãnh địa/thành trì do chư hầu tự quản.",
  },
  {
    term: "Nam tước địa → Công quốc",
    definition: "Các cấp tước địa tăng dần: Nam tước địa, Tử tước địa, Bá quốc, Hầu quốc vùng biên và Công quốc. Cấp càng cao càng phải cai trị gián tiếp qua chư hầu.",
  },
  {
    term: "Vương quốc / Đế quốc",
    definition: "Chính thể có chủ quyền. Vương quốc bao gồm nhiều tước địa; đế quốc có thể bao gồm nhiều vương quốc. Vua hay hoàng đế quản lý luật, thuế và chư hầu toàn cõi, không trực tiếp điều hành mọi trang trại hay thành trì.",
  },
] as const;

/** Luật ngữ nghĩa đưa vào lời kể để AI không trao nhầm quyền vì tước vị cao. */
export function buildFeudalHierarchyPrompt(state: StatData): string {
  const title = titleDefinition(state["Thông Tin Nhân Vật"]["Tước Vị"]);
  const direct = playerHoldingIds(state);
  const regions = Object.entries(state["Chủ Quyền Lãnh Thổ"])
    .filter(([, sovereignty]) => sovereignty["Là Của Người Chơi"])
    .map(([id]) => id);
  return `【PHÂN CẤP PHONG KIẾN — QUYỀN SỞ HỮU & QUẢN TRỊ】
Hiện tại: ${title.title}; tước địa tương ứng: ${title.jurisdiction}; bậc ${title.rank}/11.
Thành trì trực thuộc có thể điều hành: ${direct.length > 0 ? direct.join(", ") : "không có"}.
Lãnh thổ có chủ quyền: ${regions.length > 0 ? regions.join(", ") : "không có"}.

LUẬT BẮT BUỘC:
- “Thành trì” là địa điểm/công trình vật lý. Xây, phá, bố trí kho, tường và quân đồn trú chỉ diễn ra tại thành trực thuộc.
- “Lãnh địa trực thuộc” là ruộng, rừng, đồng cỏ, thôn ấp và dân do nhân vật trực tiếp quản lý để nuôi thành. Nó không phải toàn bộ một vùng.
- “Lãnh thổ” là vùng địa lý–chủ quyền. Chiếm vùng không tự động biến thành trì của chư hầu thành tài sản trực thuộc.
- “Tước địa” (${title.jurisdiction}) là phạm vi pháp lý gắn với tước vị; có thể chứa đất trực thuộc lẫn đất chư hầu. Cai trị bằng tòa án, tô thuế, quân dịch và quan hệ chư hầu.
- Vương quốc/đế quốc là chính thể có chủ quyền. Vua/hoàng đế điều phối luật, thuế, ngoại giao và đại chư hầu, KHÔNG trực tiếp xây dựng trong mọi thành của họ.
- Khóa legacy stat_data.Lãnh Địa lưu hồ sơ vi mô “thành trì + đất trực thuộc”; đừng suy diễn tên khóa thành chủ quyền cả vùng.
- Vương tử/vương nữ là huyết thống, không mặc nhiên là Thân Vương cai trị một Thân Vương Quốc.

Khi kể hoặc cập nhật trạng thái, gọi đúng tầng và chỉ trao hành động đúng quyền sở hữu thực tế.`;
}
