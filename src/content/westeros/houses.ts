// content/westeros/houses.ts
// ============================================================================
// CÁC NHÀ LỚN (8.7) — data dùng chung mọi Era (Era tham chiếu qua availableHouses).
// themeColor GIẢM BÃO HOÀ theo ràng buộc mỹ thuật (điểm 4 đầu prompt).
// ============================================================================
import { resolveRegionId } from "../world/geography";

export type PoliticalEntityKind = "house" | "polity" | "khalasar" | "company" | "order" | "people";
export type GovernmentKind = "feudal" | "city-state" | "khalasar" | "slave-city" | "monarchy" | "tribal" | "company" | "religious-order" | "institution";

export interface HouseData {
  id: string;
  name: string;
  /** Stable display/state name retained for old saves. */
  schemaName: string;
  sigil: string; // mô tả huy hiệu (SVG vẽ theo ở ui/sigils — M7+)
  words: string;
  seat: string;
  region: string;
  themeColor: { primary: string; secondary: string };
  continentIds: string[];
  regionIds: string[];
  cultureIds: string[];
  kind: PoliticalEntityKind;
  government: GovernmentKind;
  roles: string[];
  /** Optional era/year gate for powers whose historical lifetime is known. */
  availableEras?: string[];
  activeFromYear?: number;
  activeToYear?: number;
}

type HouseSeed = Omit<HouseData, "continentIds" | "regionIds" | "cultureIds" | "kind" | "government" | "roles"> &
  Partial<Pick<HouseData, "continentIds" | "regionIds" | "cultureIds" | "kind" | "government" | "roles">>;

const FEUDAL_ROLES = ["Trực hệ", "Nhánh phụ", "Bề tôi", "Kẻ đánh thuê"];
const CITY_ROLES = ["Magister / Quý tộc", "Công dân", "Thuộc hạ", "Kẻ đánh thuê"];
const KHALASAR_ROLES = ["Khal / Khaleesi", "Huyết Kỵ", "Ko", "Kỵ sĩ"];
const SLAVE_CITY_ROLES = ["Đại Chủ Nô", "Người Tự Do", "Nô Lệ", "Kẻ đánh thuê"];
const MONARCHY_ROLES = ["Hoàng tộc", "Quan lại", "Chư hầu", "Kẻ đánh thuê"];
const TRIBAL_ROLES = ["Thủ lĩnh", "Chiến binh", "Thành viên", "Khách"];
const COMPANY_ROLES = ["Chỉ huy", "Sĩ quan", "Thành viên", "Người theo trại"];
const ORDER_ROLES = ["Lãnh đạo", "Thành viên cấp cao", "Thành viên", "Người liên hệ"];

const WESTEROS_REGION_IDS: Record<string, string[]> = {
  "Phương Bắc": ["the-north"], "Phương Tây": ["the-westerlands"], "Vịnh Xoáy Nước": ["the-crownlands"],
  "Vùng Bão Tố": ["the-stormlands"], "Vùng Bão": ["the-stormlands"], "Quần Đảo Sắt": ["the-iron-islands"],
  "Vùng Reach": ["the-reach"], Reach: ["the-reach"], Dorne: ["dorne"], "Thung Lũng": ["the-vale"],
  "Vùng Sông Nước": ["the-riverlands"], "Vùng Sông": ["the-riverlands"], "Đất Vương Thất": ["the-crownlands"],
  "Quần Đảo Xoáy Nước": ["the-crownlands"], Westeros: [],
};

const ALL_ERA_IDS = [
  "long-night", "aegon-conquest", "dance-of-dragons", "blackfyre-rebellion",
  "dunk-and-egg", "roberts-rebellion", "greyjoy-rebellion", "war-of-five-kings", "winds-of-winter",
];
const POST_LONG_NIGHT_ERA_IDS = ALL_ERA_IDS.filter((eraId) => eraId !== "long-night");
const ANCIENT_WORLD_ENTITY_IDS = new Set([
  "qarth", "lhazar", "sarnor", "yi-ti", "jogos-nhai", "asshai", "ibben",
  "summer-islands", "naath", "basilisk-isles", "gogossos", "ulthos-peoples", "custom",
]);

function rolesForGovernment(government: GovernmentKind): string[] {
  if (government === "city-state") return [...CITY_ROLES];
  if (government === "khalasar") return [...KHALASAR_ROLES];
  if (government === "slave-city") return [...SLAVE_CITY_ROLES];
  if (government === "monarchy") return [...MONARCHY_ROLES];
  if (government === "tribal") return [...TRIBAL_ROLES];
  if (government === "company") return [...COMPANY_ROLES];
  if (government === "religious-order" || government === "institution") return [...ORDER_ROLES];
  return [...FEUDAL_ROLES];
}

const HOUSE_SEEDS: HouseSeed[] = [
  { id: "stark", name: "Nhà Stark", schemaName: "Stark", sigil: "Sói tuyết xám trên nền trắng",
    words: "Mùa đông đang đến", seat: "Winterfell", region: "Phương Bắc",
    themeColor: { primary: "#7d8a99", secondary: "#3d4a59" } },
  { id: "lannister", name: "Nhà Lannister", schemaName: "Lannister", sigil: "Sư tử vàng trên nền đỏ thẫm",
    words: "Nghe Ta Gầm!", seat: "Casterly Rock", region: "Phương Tây",
    themeColor: { primary: "#a8654f", secondary: "#8f7a45" } },
  { id: "targaryen", name: "Nhà Targaryen", schemaName: "Targaryen", sigil: "Rồng ba đầu đỏ trên nền đen",
    words: "Lửa và Máu", seat: "Dragonstone", region: "Vịnh Xoáy Nước",
    themeColor: { primary: "#9a5a5f", secondary: "#2e2a33" } },
  { id: "baratheon", name: "Nhà Baratheon", schemaName: "Baratheon", sigil: "Hươu đực vương miện đen trên nền vàng",
    words: "Cơn thịnh nộ của ta là vô song", seat: "Storm's End", region: "Vùng Bão Tố",
    themeColor: { primary: "#8f8348", secondary: "#33312a" } },
  { id: "greyjoy", name: "Nhà Greyjoy", schemaName: "Greyjoy", sigil: "Thủy quái vàng trên nền đen",
    words: "Chúng Ta Không Gieo Trồng", seat: "Pyke", region: "Quần Đảo Sắt",
    themeColor: { primary: "#6d7a72", secondary: "#2c3330" } },
  { id: "tyrell", name: "Nhà Tyrell", schemaName: "Tyrell", sigil: "Hoa hồng vàng trên nền xanh cỏ",
    words: "Đang Trỗi Dậy", seat: "Highgarden", region: "Vùng Reach",
    themeColor: { primary: "#7a9070", secondary: "#8f8348" } },
  { id: "martell", name: "Nhà Martell", schemaName: "Martell", sigil: "Mặt trời đỏ bị giáo xuyên",
    words: "Không Khuất Phục, Không Cúi Đầu, Không Đầu Hàng", seat: "Sunspear", region: "Dorne",
    themeColor: { primary: "#a3764a", secondary: "#8a4f43" } },
  { id: "arryn", name: "Nhà Arryn", schemaName: "Arryn", sigil: "Chim ưng trắng và trăng lưỡi liềm trên nền xanh trời",
    words: "Cao Như Danh Dự", seat: "The Eyrie", region: "Thung Lũng",
    themeColor: { primary: "#7b8fa6", secondary: "#48586b" } },
  { id: "tully", name: "Nhà Tully", schemaName: "Tully", sigil: "Cá hồi bạc trên nền lam đỏ",
    words: "Gia Đình, Nghĩa Vụ, Danh Dự", seat: "Riverrun", region: "Vùng Sông Nước",
    themeColor: { primary: "#6b7f94", secondary: "#8a5348" } },
  { id: "velaryon", name: "Nhà Velaryon", schemaName: "Velaryon", sigil: "Ngựa biển bạc trên nền ngọc lục",
    words: "Cũ Hơn Cả Ngôi Sao", seat: "Driftmark", region: "Quần Đảo Xoáy Nước",
    themeColor: { primary: "#3a6a7a", secondary: "#5a9aab" } },
  { id: "blackfyre", name: "Nhà Blackfyre", schemaName: "Blackfyre", sigil: "Rồng ba đầu đen trên nền đỏ",
    words: "Lửa và Máu", seat: "(Lưu Vong)", region: "(Không có)",
    themeColor: { primary: "#3d1a1a", secondary: "#6b3030" } },
  { id: "hightower", name: "Nhà Hightower", schemaName: "Hightower", sigil: "Ngọn tháp lửa trên nền trắng xám",
    words: "Chúng Ta Soi Sáng Con Đường", seat: "Oldtown", region: "Vùng Reach",
    themeColor: { primary: "#6b705c", secondary: "#a5a58d" } },
  { id: "royce", name: "Nhà Royce", schemaName: "Royce", sigil: "Chấm đen trên nền đồng thiếc",
    words: "Ta Luôn Nhớ", seat: "Runestone", region: "Thung Lũng",
    themeColor: { primary: "#594d46", secondary: "#8b7d6b" } },
  { id: "mudd", name: "Nhà Mudd", schemaName: "Mudd", sigil: "Vương miện vàng nạm ngọc trên nền bùn",
    words: "Quá Khứ Không Thể Gột Rửa", seat: "Oldstones", region: "Vùng Sông Nước",
    themeColor: { primary: "#6e5246", secondary: "#9a7b6c" } },
  { id: "casterly", name: "Nhà Casterly", schemaName: "Casterly", sigil: "Vòng tròn mặt trời trên nền vàng",
    words: "Ánh Sáng Đầu Tiên", seat: "Casterly Rock", region: "Phương Tây",
    themeColor: { primary: "#b08d57", secondary: "#d4af37" } },
  { id: "yronwood", name: "Nhà Yronwood", schemaName: "Yronwood", sigil: "Cổng thành rào sắt đen trên nền cát",
    words: "Máu Hoàng Gia", seat: "Yronwood", region: "Dorne",
    themeColor: { primary: "#8c564b", secondary: "#c49c94" } },
  { id: "greyiron", name: "Nhà Greyiron", schemaName: "Greyiron", sigil: "Mỏ neo sắt trên nền xám",
    words: "Vua Của Muôn Nơi Cướp Bóc", seat: "Orkmont", region: "Quần Đảo Sắt",
    themeColor: { primary: "#454545", secondary: "#666666" } },
  { id: "darklyn", name: "Nhà Darklyn", schemaName: "Darklyn", sigil: "Mũi mác đen trên vạch vàng",
    words: "Sự Bảo Vệ Vĩnh Hằng", seat: "Duskendale", region: "Đất Vương Thất",
    themeColor: { primary: "#4b404d", secondary: "#705d73" } },
  { id: "first-men", name: "Các Bộ Tộc Người Đầu Tiên", schemaName: "Người Đầu Tiên", sigil: "Bàn tay máu trên nền đá",
    words: "Máu Của Đất", seat: "Nhiều Nơi", region: "Westeros",
    themeColor: { primary: "#545454", secondary: "#8c8c8c" } },
  { id: "children", name: "Trẻ Con Rừng", schemaName: "Trẻ Con Rừng", sigil: "Cây Lòng Đỏ mặt khóc",
    words: "Bài Ca Của Đất", seat: "Bên Trong Rừng Thẳm", region: "Westeros",
    themeColor: { primary: "#4a5d23", secondary: "#78866b" } },
  { id: "others", name: "Bóng Trắng và Đội Quân Tử Thi", schemaName: "Others", sigil: "Tinh thể băng xanh trên nền đêm",
    words: "Đêm thuộc về chúng ta", seat: "Vùng Đất Luôn Đông", region: "Ngoài Tường Thành",
    themeColor: { primary: "#8bb8c9", secondary: "#1d3442" }, continentIds: ["westeros"], regionIds: ["beyond-the-wall"],
    cultureIds: [], kind: "people", government: "tribal", availableEras: ["long-night", "winds-of-winter"] },
  { id: "bolton", name: "Nhà Bolton", schemaName: "Bolton", sigil: "Người bị lột da màu đỏ trên nền hồng",
    words: "Lưỡi Dao Của Chúng Ta Sắc Bén", seat: "Dreadfort", region: "Phương Bắc",
    themeColor: { primary: "#9f5f62", secondary: "#4b252d" }, continentIds: ["westeros"], regionIds: ["north-dreadfort"],
    cultureIds: ["first-men"], kind: "house", government: "feudal", activeFromYear: -1000 },
  { id: "frey", name: "Nhà Frey", schemaName: "Frey", sigil: "Hai tháp lam trên nền xám",
    words: "Chúng Ta Đứng Vững", seat: "The Twins", region: "Vùng Sông Nước",
    themeColor: { primary: "#5d6d7e", secondary: "#85929e" } },
  { id: "peake", name: "Nhà Peake", schemaName: "Peake", sigil: "Ba tòa tháp đen trên nền cam",
    words: "Cao Ngạo Không Gục Ngã", seat: "Starpike", region: "Vùng Reach",
    themeColor: { primary: "#804000", secondary: "#b36b00" } },
  { id: "bracken", name: "Nhà Bracken", schemaName: "Bracken", sigil: "Ngựa bờm đỏ trên nền nâu",
    words: "Sức Mạnh Dũng Mãnh", seat: "Stone Hedge", region: "Vùng Sông Nước",
    themeColor: { primary: "#8b4513", secondary: "#cd853f" } },
  { id: "targaryen-black", name: "Phe Đen (Rhaenyra)", schemaName: "Targaryen (Phe Đen)", sigil: "Rồng ba đầu đỏ và phần tư Arryn/Velaryon",
    words: "Lửa và Máu", seat: "Dragonstone", region: "Đất Vương Thất",
    themeColor: { primary: "#1c1c1c", secondary: "#3a3a3a" } },
  { id: "targaryen-green", name: "Phe Xanh (Aegon II)", schemaName: "Targaryen (Phe Xanh)", sigil: "Rồng vàng trên nền đen",
    words: "Lửa và Máu", seat: "King's Landing", region: "Đất Vương Thất",
    themeColor: { primary: "#2b4528", secondary: "#4c7347" } },
  // --- Essos Factions ---
  { id: "targaryen-essos", name: "Targaryen (Lưu Vong)", schemaName: "Targaryen (Essos)", sigil: "Rồng ba đầu đỏ trên nền đen",
    words: "Lửa và Máu", seat: "Pentos", region: "Thành Phố Tự Do",
    themeColor: { primary: "#9a5a5f", secondary: "#2e2a33" }, continentIds: ["essos"], regionIds: ["essos-pentos"], cultureIds: ["valyrian", "pentoshi"], kind: "house", government: "feudal", activeFromYear: 283 },
  { id: "dothraki", name: "Khalasar Dothraki", schemaName: "Khalasar", sigil: "Ngựa hoang trên nền cỏ úa",
    words: "Huyết Mạch Trực Thiết", seat: "Vaes Dothrak", region: "Biển Dothraki",
    themeColor: { primary: "#8f6b45", secondary: "#4a331a" }, continentIds: ["essos"], regionIds: ["essos-western-dothraki-sea", "essos-vaes-dothrak", "essos-central-dothraki-sea", "essos-eastern-dothraki-sea"], cultureIds: ["dothraki"], kind: "khalasar", government: "khalasar" },
  { id: "braavos", name: "Thành Bang Braavos", schemaName: "Braavos", sigil: "Khổng tượng Titan trên biển",
    words: "Valar Morghulis", seat: "Braavos", region: "Thành Phố Tự Do",
    themeColor: { primary: "#4a687a", secondary: "#1a2c38" }, continentIds: ["essos"], regionIds: ["essos-braavos"], cultureIds: ["braavosi"], kind: "polity", government: "city-state" },
  { id: "mercenary", name: "Hội Lính Đánh Thuê", schemaName: "Hội Lính Đánh Thuê", sigil: "Đồng tiền vàng và gươm giáo",
    words: "Vàng quyết định tất cả", seat: "Di động", region: "Essos",
    themeColor: { primary: "#8a7d3b", secondary: "#3d3615" }, continentIds: ["essos"], regionIds: [], cultureIds: [], kind: "company", government: "company" },
  { id: "ghiscar", name: "Thành Quốc Ghiscar", schemaName: "Ghiscar", sigil: "Nữ thần Harpy",
    words: "Xiềng xích và Quyền lực", seat: "Astapor/Yunkai/Meereen", region: "Vịnh Nô Lệ",
    themeColor: { primary: "#9e7751", secondary: "#4f351e" }, continentIds: ["essos"], regionIds: ["essos-astapor", "essos-yunkai", "essos-meereen", "essos-new-ghis", "essos-ghiscari-hinterland"], cultureIds: ["ghiscari"], kind: "people", government: "slave-city" },
  { id: "qarth", name: "Thành Quốc Qarth", schemaName: "Qarth", sigil: "Cổng thành nạm ngọc",
    words: "Trung tâm của Thế giới", seat: "Qarth", region: "Eo Biển Ngọc",
    themeColor: { primary: "#69968b", secondary: "#2c4a43" }, continentIds: ["essos"], regionIds: ["essos-qarth", "essos-jade-gates"], cultureIds: ["qartheen"], kind: "polity", government: "city-state" },
  { id: "free-cities", name: "Công Dân Thành Phố Tự Do", schemaName: "Thành Phố Tự Do", sigil: "Đồng xu vàng",
    words: "Tiền bạc mở mọi cánh cửa", seat: "Thành Phố Tự Do", region: "Essos",
    themeColor: { primary: "#8c7e61", secondary: "#363228" }, continentIds: ["essos"], regionIds: ["essos-braavos", "essos-pentos", "essos-myr", "essos-tyrosh", "essos-lys", "essos-volantis", "essos-lorath", "essos-norvos", "essos-qohor"], cultureIds: ["braavosi", "pentoshi", "myrish", "tyroshi", "lysene", "volantene", "lorathi", "norvoshi", "qohorik"], kind: "people", government: "city-state" },

  // Nine Free Cities are separate powers; `free-cities` above remains a legacy umbrella.
  { id: "pentos", name: "Thành Bang Pentos", schemaName: "Pentos", sigil: "Tháp gạch và cổng đồng", words: "Thương mại giữ thành", seat: "Pentos", region: "Thành Phố Tự Do", themeColor: { primary: "#9b7653", secondary: "#4d3323" }, continentIds: ["essos"], regionIds: ["essos-pentos"], cultureIds: ["pentoshi"], kind: "polity", government: "city-state" },
  { id: "myr", name: "Thành Bang Myr", schemaName: "Myr", sigil: "Mắt xanh sau thấu kính", words: "Tinh xảo sinh thịnh vượng", seat: "Myr", region: "Đất Tranh Chấp", themeColor: { primary: "#7c8d78", secondary: "#35453c" }, continentIds: ["essos"], regionIds: ["essos-myr"], cultureIds: ["myrish"], kind: "polity", government: "city-state" },
  { id: "tyrosh", name: "Thành Bang Tyrosh", schemaName: "Tyrosh", sigil: "Tháp đỏ trên biển", words: "Màu sắc, vàng và thép", seat: "Tyrosh", region: "Đất Tranh Chấp", themeColor: { primary: "#8b4f79", secondary: "#3f2440" }, continentIds: ["essos"], regionIds: ["essos-tyrosh"], cultureIds: ["tyroshi"], kind: "polity", government: "city-state" },
  { id: "lys", name: "Thành Bang Lys", schemaName: "Lys", sigil: "Mặt trời bạc trên sóng", words: "Hương thơm che lưỡi dao", seat: "Lys", region: "Đất Tranh Chấp", themeColor: { primary: "#c0a4ad", secondary: "#6b5364" }, continentIds: ["essos"], regionIds: ["essos-lys"], cultureIds: ["lysene", "valyrian"], kind: "polity", government: "city-state" },
  { id: "volantis", name: "Thành Bang Volantis", schemaName: "Volantis", sigil: "Hổ và voi hai bờ Rhoyne", words: "Cổ Huyết không quên", seat: "Volantis", region: "Hạ Rhoyne", themeColor: { primary: "#8c493f", secondary: "#3d2925" }, continentIds: ["essos"], regionIds: ["essos-volantis"], cultureIds: ["volantene", "valyrian"], kind: "polity", government: "city-state" },
  { id: "lorath", name: "Thành Bang Lorath", schemaName: "Lorath", sigil: "Mê cung trắng trên nền xám", words: "Mọi lối đều để lại dấu", seat: "Lorath", region: "Bắc Essos", themeColor: { primary: "#7f8589", secondary: "#30363a" }, continentIds: ["essos"], regionIds: ["essos-lorath"], cultureIds: ["lorathi"], kind: "polity", government: "city-state" },
  { id: "norvos", name: "Thành Bang Norvos", schemaName: "Norvos", sigil: "Ba chiếc chuông đen", words: "Chuông gọi, râu phán", seat: "Norvos", region: "Đồi Norvos", themeColor: { primary: "#725d4b", secondary: "#312a25" }, continentIds: ["essos"], regionIds: ["essos-norvos"], cultureIds: ["norvoshi"], kind: "polity", government: "religious-order" },
  { id: "qohor", name: "Thành Bang Qohor", schemaName: "Qohor", sigil: "Sơn dương đen", words: "Thép nhớ lửa", seat: "Qohor", region: "Rừng Qohor", themeColor: { primary: "#405043", secondary: "#171d18" }, continentIds: ["essos"], regionIds: ["essos-qohor"], cultureIds: ["qohorik"], kind: "polity", government: "city-state" },

  // Ghiscari successor cities.
  { id: "astapor", name: "Astapor", schemaName: "Astapor", sigil: "Harpy đỏ cầm xiềng", words: "Kỷ luật được rèn bằng đau đớn", seat: "Astapor", region: "Vịnh Nô Lệ", themeColor: { primary: "#a14f3c", secondary: "#4a211b" }, continentIds: ["essos"], regionIds: ["essos-astapor"], cultureIds: ["ghiscari"], kind: "polity", government: "slave-city" },
  { id: "yunkai", name: "Yunkai", schemaName: "Yunkai", sigil: "Harpy vàng cầm roi", words: "Khôn ngoan giữ xiềng", seat: "Yunkai", region: "Vịnh Nô Lệ", themeColor: { primary: "#b19145", secondary: "#5b4520" }, continentIds: ["essos"], regionIds: ["essos-yunkai"], cultureIds: ["ghiscari"], kind: "polity", government: "slave-city" },
  { id: "meereen", name: "Meereen", schemaName: "Meereen", sigil: "Harpy đồng trên kim tự tháp", words: "Vĩ đại trên những bậc đá", seat: "Meereen", region: "Vịnh Nô Lệ", themeColor: { primary: "#9a7650", secondary: "#493522" }, continentIds: ["essos"], regionIds: ["essos-meereen"], cultureIds: ["ghiscari"], kind: "polity", government: "slave-city" },
  { id: "new-ghis", name: "Tân Ghis", schemaName: "Tân Ghis", sigil: "Harpy sắt trên nền đỏ", words: "Ghis sống lại", seat: "New Ghis", region: "Vịnh Ghis", themeColor: { primary: "#884a38", secondary: "#38201a" }, continentIds: ["essos"], regionIds: ["essos-new-ghis"], cultureIds: ["ghiscari"], kind: "polity", government: "slave-city" },

  // Further world powers and institutions.
  { id: "lhazar", name: "Các Cộng Đồng Lhazar", schemaName: "Lhazar", sigil: "Cừu trắng trên đồng cỏ", words: "Đại Mục Đồng che chở", seat: "Lhazosh", region: "Lhazar", themeColor: { primary: "#a79b69", secondary: "#514a31" }, continentIds: ["essos"], regionIds: ["essos-lhazar"], cultureIds: ["lhazareen"], kind: "people", government: "tribal" },
  { id: "sarnor", name: "Tàn Dân Sarnor", schemaName: "Sarnor", sigil: "Vương miện bạc trên nền xanh", words: "Người Cao vẫn đứng", seat: "Saath", region: "Sarnor", themeColor: { primary: "#71858d", secondary: "#303d43" }, continentIds: ["essos"], regionIds: ["essos-sarnor"], cultureIds: ["sarnori"], kind: "people", government: "monarchy" },
  { id: "yi-ti", name: "Đế Quốc Yi Ti", schemaName: "Yi Ti", sigil: "Rồng ngọc quanh mặt trời", words: "Hoàng thiên trường cửu", seat: "Yin", region: "Yi Ti", themeColor: { primary: "#a98b43", secondary: "#2e533f" }, continentIds: ["essos"], regionIds: ["essos-yi-ti-west", "essos-yi-ti-central", "essos-yi-ti-east", "essos-grey-waste"], cultureIds: ["yi-tish"], kind: "polity", government: "monarchy" },
  { id: "jogos-nhai", name: "Các Bộ Tộc Jogos Nhai", schemaName: "Jogos Nhai", sigil: "Zorse dưới trăng khuyết", words: "Đồng cỏ không có tường", seat: "Shrinking Sea", region: "Đồng Bằng Jogos Nhai", themeColor: { primary: "#77694a", secondary: "#35301f" }, continentIds: ["essos"], regionIds: ["essos-jogos-nhai"], cultureIds: ["jogos-nhai"], kind: "people", government: "tribal" },
  { id: "asshai", name: "Asshai Bên Bóng Tối", schemaName: "Asshai", sigil: "Mặt nạ đen trước trăng đỏ", words: "Trong bóng tối có tri thức", seat: "Asshai", region: "Vùng Đất Bóng Tối", themeColor: { primary: "#4d3f50", secondary: "#151218" }, continentIds: ["essos"], regionIds: ["essos-asshai", "essos-shadow-lands"], cultureIds: ["asshaii"], kind: "polity", government: "city-state" },
  { id: "ibben", name: "Ibben", schemaName: "Ibben", sigil: "Cá voi đen trên băng", words: "Biển lạnh nuôi người cứng", seat: "Port of Ibben", region: "Ibben", themeColor: { primary: "#526c73", secondary: "#243238" }, continentIds: ["ibben"], regionIds: ["ibben-ib", "ibben-ib-sar"], cultureIds: ["ibbenese"], kind: "polity", government: "city-state" },
  { id: "summer-islands", name: "Các Thân Vương Quần Đảo Mùa Hè", schemaName: "Quần Đảo Mùa Hè", sigil: "Thiên nga đen trên biển ngọc", words: "Gió ấm đưa cánh buồm xa", seat: "Tall Trees Town", region: "Quần Đảo Mùa Hè", themeColor: { primary: "#2f7d72", secondary: "#a1743e" }, continentIds: ["summer-isles"], regionIds: ["summer-walano", "summer-jhala", "summer-omboru", "summer-koj"], cultureIds: ["summer-islander"], kind: "polity", government: "monarchy" },
  { id: "naath", name: "Cộng Đồng Naath", schemaName: "Naath", sigil: "Bướm vàng trên lá xanh", words: "Hòa hợp là sức mạnh", seat: "Butterfly Vale", region: "Naath", themeColor: { primary: "#7e9b55", secondary: "#d1a94c" }, continentIds: ["sothoryos"], regionIds: ["naath"], cultureIds: ["naathi"], kind: "people", government: "tribal" },
  { id: "basilisk-isles", name: "Hải Tặc Quần Đảo Basilisk", schemaName: "Quần Đảo Basilisk", sigil: "Rắn biển quấn xương", words: "Không cờ nào tồn tại lâu", seat: "Gogossos", region: "Quần Đảo Basilisk", themeColor: { primary: "#5e7155", secondary: "#392b25" }, continentIds: ["sothoryos"], regionIds: ["sothoryos-basilisk-isles"], cultureIds: ["basilisk-islander"], kind: "people", government: "tribal" },
  { id: "gogossos", name: "Tàn Tích Gogossos", schemaName: "Gogossos", sigil: "Tháp đen trên sóng độc", words: "Tàn tích vẫn có chủ", seat: "Gogossos", region: "Sothoryos", themeColor: { primary: "#48533f", secondary: "#241e1b" }, continentIds: ["sothoryos"], regionIds: ["sothoryos-basilisk-isles"], cultureIds: ["basilisk-islander"], kind: "polity", government: "tribal" },
  { id: "ulthos-peoples", name: "Các Cộng Đồng Ulthos", schemaName: "Ulthos", sigil: "Tán rừng đen dưới sao", words: "Ngoài rìa hải đồ", seat: "Unknown Harbour", region: "Ulthos", themeColor: { primary: "#334c3f", secondary: "#17221d" }, continentIds: ["ulthos"], regionIds: ["ulthos-west-coast", "ulthos-interior"], cultureIds: ["ulthosi"], kind: "people", government: "tribal" },
  { id: "iron-bank", name: "Ngân Hàng Sắt Braavos", schemaName: "Ngân Hàng Sắt", sigil: "Cánh cửa sắt và đồng tiền", words: "Ngân Hàng Sắt sẽ lấy lại phần của mình", seat: "Braavos", region: "Braavos", themeColor: { primary: "#66737a", secondary: "#262d31" }, continentIds: ["essos"], regionIds: ["essos-braavos"], cultureIds: ["braavosi"], kind: "order", government: "institution" },
  { id: "golden-company", name: "Đại Đội Vàng", schemaName: "Golden Company", sigil: "Sọ vàng trên giáo", words: "Dưới vàng, thép cay đắng", seat: "Di động", region: "Essos", themeColor: { primary: "#a88b3f", secondary: "#3b2e19" }, continentIds: ["essos"], regionIds: [], cultureIds: ["valyrian", "andals"], kind: "company", government: "company", activeFromYear: 212 },

  // ── CHƯƠNG HẦU / GIA TỘC CHÍNH CỦA WESTEROS ──────────────────────────────

  // -- Phương Bắc --
  { id: "karstark", name: "Nhà Karstark", schemaName: "Karstark", sigil: "Mặt trời trắng trên nền đen", words: "Mùa đông sẽ đến", seat: "Karhold", region: "Phương Bắc", themeColor: { primary: "#5a5a5a", secondary: "#2a2a2a" } },
  { id: "umber", name: "Nhà Umber", schemaName: "Umber", sigil: "Người khổng lồ đỏ xiềng xích trên nền cam", words: "Sức mạnh không gục ngã", seat: "Last Hearth", region: "Phương Bắc", themeColor: { primary: "#8b4513", secondary: "#cd6600" } },
  { id: "mormont", name: "Nhà Mormont", schemaName: "Mormont", sigil: "Gấu đen trên nền xanh lá", words: "Nơi đây chúng tôi đứng vững", seat: "Mormont Keep", region: "Phương Bắc", themeColor: { primary: "#2e4e2e", secondary: "#1a3a1a" } },
  { id: "manderly", name: "Nhà Manderly", schemaName: "Manderly", sigil: "Người cá trên nền xanh biển", words: "Người trung thành, trái tim không lay", seat: "White Harbor", region: "Phương Bắc", themeColor: { primary: "#2e6e8e", secondary: "#1a4a5e" } },
  { id: "glover", name: "Nhà Glover", schemaName: "Glover", sigil: "Bàn tay sắt trên nền đỏ thẫm", words: "Không ngại gian nan", seat: "Deepwood Motte", region: "Phương Bắc", themeColor: { primary: "#6e3030", secondary: "#4a1a1a" } },
  { id: "reed", name: "Nhà Reed", schemaName: "Reed", sigil: "Thằn lằn sư tử đen trên nền xám xanh", words: "Chúng tôi canh giữ con đường", seat: "Greywater Watch", region: "Phương Bắc", themeColor: { primary: "#4a5e4a", secondary: "#2e3e2e" } },
  { id: "dustin", name: "Nhà Dustin", schemaName: "Dustin", sigil: "Hai chiếc rìu vàng trên nền đen", words: "Sắc bén và kiên quyết", seat: "Barrowton", region: "Phương Bắc", themeColor: { primary: "#6e5a30", secondary: "#3e3018" } },
  { id: "tallhart", name: "Nhà Tallhart", schemaName: "Tallhart", sigil: "Ba cây lính canh trên nền xanh", words: "Kiêu hãnh và tự do", seat: "Torrhen's Square", region: "Phương Bắc", themeColor: { primary: "#4e6e3e", secondary: "#2e4e2e" } },

  // -- Quần Đảo Sắt --
  { id: "harlaw", name: "Nhà Harlaw", schemaName: "Harlaw", sigil: "Lưỡi hái bạc trên nền đen", words: "Đọc và gặt", seat: "Ten Towers", region: "Quần Đảo Sắt", themeColor: { primary: "#4a4a4a", secondary: "#2a2a2a" } },
  { id: "goodbrother", name: "Nhà Goodbrother", schemaName: "Goodbrother", sigil: "Sừng vàng trên nền đen", words: "Máu của anh em", seat: "Hammerhorn", region: "Quần Đảo Sắt", themeColor: { primary: "#5a4a2a", secondary: "#3a2a1a" } },
  { id: "drumm", name: "Nhà Drumm", schemaName: "Drumm", sigil: "Xương trắng trên nền đỏ máu", words: "Gươm đỏ không rỉ sét", seat: "Old Wyk", region: "Quần Đảo Sắt", themeColor: { primary: "#6e2a2a", secondary: "#4a1a1a" } },
  { id: "blacktyde", name: "Nhà Blacktyde", schemaName: "Blacktyde", sigil: "Sóng xanh trên nền đen", words: "Sóng không ngừng", seat: "Blacktyde Castle", region: "Quần Đảo Sắt", themeColor: { primary: "#2a4a5a", secondary: "#1a2a3a" } },

  // -- Thung Lũng --
  { id: "grafton", name: "Nhà Grafton", schemaName: "Grafton", sigil: "Tháp cháy trên nền vàng", words: "Ngọn lửa thương mại", seat: "Gulltown", region: "Thung Lũng", themeColor: { primary: "#8a7a2a", secondary: "#5a4a1a" } },
  { id: "corbray", name: "Nhà Corbray", schemaName: "Corbray", sigil: "Ba quạ đen trên nền trắng đỏ", words: "Danh dự và thép", seat: "Heart's Home", region: "Thung Lũng", themeColor: { primary: "#6a2a2a", secondary: "#4a1a1a" } },
  { id: "sunderland", name: "Nhà Sunderland", schemaName: "Sunderland", sigil: "Ba tàu trên sóng", words: "Biển là nhà", seat: "Sisterton", region: "Thung Lũng", themeColor: { primary: "#3a5a6a", secondary: "#2a3a4a" } },
  { id: "waynwood", name: "Nhà Waynwood", schemaName: "Waynwood", sigil: "Bánh xe vỡ đen trên nền lục", words: "Không bao giờ đầu hàng", seat: "Ironoaks", region: "Thung Lũng", themeColor: { primary: "#3a5a3a", secondary: "#2a3a2a" } },
  { id: "hunter", name: "Nhà Hunter", schemaName: "Hunter", sigil: "Năm mũi tên nâu trên nền vàng", words: "Tên không bao giờ trượt", seat: "Longbow Hall", region: "Thung Lũng", themeColor: { primary: "#6a5a2a", secondary: "#4a3a1a" } },

  // -- Vùng Sông --
  { id: "mallister", name: "Nhà Mallister", schemaName: "Mallister", sigil: "Đại bàng bạc trên nền tím", words: "Trên cao và xa", seat: "Seagard", region: "Vùng Sông Nước", themeColor: { primary: "#5a3a6a", secondary: "#3a2a4a" } },
  { id: "whent", name: "Nhà Whent", schemaName: "Whent", sigil: "Chín dơi đen trên nền vàng", words: "Đêm không quên", seat: "Harrenhal", region: "Vùng Sông Nước", themeColor: { primary: "#5a5a2a", secondary: "#3a3a1a" } },
  { id: "mooton", name: "Nhà Mooton", schemaName: "Mooton", sigil: "Cá đỏ trên nền trắng", words: "Dưới dòng nước", seat: "Maidenpool", region: "Vùng Sông Nước", themeColor: { primary: "#8a4a3a", secondary: "#5a2a2a" } },
  { id: "blackwood", name: "Nhà Blackwood", schemaName: "Blackwood", sigil: "Cây tâm gỗ đen bao quanh quạ", words: "Xanh vĩnh hằng", seat: "Raventree Hall", region: "Vùng Sông Nước", themeColor: { primary: "#3a3a3a", secondary: "#1a1a1a" } },
  { id: "darry", name: "Nhà Darry", schemaName: "Darry", sigil: "Người cày trên nền nâu", words: "Chúng tôi đứng vững", seat: "Darry", region: "Vùng Sông Nước", themeColor: { primary: "#6a5a3a", secondary: "#4a3a2a" } },

  // -- Vùng Tây --
  { id: "lefford", name: "Nhà Lefford", schemaName: "Lefford", sigil: "Mặt trời vàng trên nền xanh trời", words: "Răng vàng canh gác", seat: "Golden Tooth", region: "Phương Tây", themeColor: { primary: "#4a6a8a", secondary: "#2a4a6a" } },
  { id: "westerling", name: "Nhà Westerling", schemaName: "Westerling", sigil: "Sáu vỏ sò trên nền cát", words: "Danh dự, không phải vàng", seat: "The Crag", region: "Phương Tây", themeColor: { primary: "#8a7a5a", secondary: "#5a5a3a" } },
  { id: "crakehall", name: "Nhà Crakehall", schemaName: "Crakehall", sigil: "Lợn rừng nâu trên nền bạc", words: "Không có kẻ nào dũng mãnh hơn", seat: "Crakehall", region: "Phương Tây", themeColor: { primary: "#5a4a3a", secondary: "#3a2a2a" } },
  { id: "farman", name: "Nhà Farman", schemaName: "Farman", sigil: "Ba tàu trên sóng bạc", words: "Gió ấm đưa ta đi", seat: "Faircastle", region: "Phương Tây", themeColor: { primary: "#3a5a7a", secondary: "#2a3a5a" } },
  { id: "marbrand", name: "Nhà Marbrand", schemaName: "Marbrand", sigil: "Cây lửa cháy trên nền tro", words: "Lửa cháy không tắt", seat: "Ashemark", region: "Phương Tây", themeColor: { primary: "#8a5a2a", secondary: "#5a3a1a" } },

  // -- Đất Vương Thất --
  { id: "celtigar", name: "Nhà Celtigar", schemaName: "Celtigar", sigil: "Cua đỏ trên nền trắng", words: "Biển và máu Valyria", seat: "Claw Isle", region: "Đất Vương Thất", themeColor: { primary: "#8a3a3a", secondary: "#5a2a2a" } },
  { id: "stokeworth", name: "Nhà Stokeworth", schemaName: "Stokeworth", sigil: "Chiếc chuông bạc trên nền xám", words: "Trung thành và vững chãi", seat: "Stokeworth", region: "Đất Vương Thất", themeColor: { primary: "#6a6a6a", secondary: "#4a4a4a" } },
  { id: "rykker", name: "Nhà Rykker", schemaName: "Rykker", sigil: "Hai búa chiến trên nền xanh", words: "Búa nặng tay vững", seat: "Duskendale", region: "Đất Vương Thất", themeColor: { primary: "#3a4a5a", secondary: "#2a3a3a" } },
  { id: "sunglass", name: "Nhà Sunglass", schemaName: "Sunglass", sigil: "Bảy mặt trời trên nền trắng", words: "Ánh sáng trong sáng", seat: "Sweetport Sound", region: "Đất Vương Thất", themeColor: { primary: "#8a8a4a", secondary: "#5a5a2a" } },

  // -- Reach --
  { id: "redwyne", name: "Nhà Redwyne", schemaName: "Redwyne", sigil: "Chùm nho burgundy trên nền xanh", words: "Rượu ngon nhất thế giới", seat: "The Arbor", region: "Vùng Reach", themeColor: { primary: "#6a2a4a", secondary: "#4a1a3a" } },
  { id: "tarly", name: "Nhà Tarly", schemaName: "Tarly", sigil: "Thợ săn đỏ trên nền xanh lá", words: "Ngay Thẳng và Kiên Cường", seat: "Horn Hill", region: "Vùng Reach", themeColor: { primary: "#3a5a2a", secondary: "#2a3a1a" } },
  { id: "rowan", name: "Nhà Rowan", schemaName: "Rowan", sigil: "Cây sồi vàng trên nền trắng", words: "Bền vững như sồi", seat: "Goldengrove", region: "Vùng Reach", themeColor: { primary: "#7a6a2a", secondary: "#5a4a1a" } },
  { id: "oakheart", name: "Nhà Oakheart", schemaName: "Oakheart", sigil: "Ba chiếc lá sồi xanh trên nền vàng", words: "Lá sồi cũng có móng vuốt", seat: "Old Oak", region: "Vùng Reach", themeColor: { primary: "#4a6a2a", secondary: "#2a4a1a" } },
  { id: "florent", name: "Nhà Florent", schemaName: "Florent", sigil: "Đầu cáo đỏ nở hoa", words: "Tai cáo nghe rõ", seat: "Brightwater Keep", region: "Vùng Reach", themeColor: { primary: "#7a4a2a", secondary: "#5a3a1a" } },
  { id: "caswell", name: "Nhà Caswell", schemaName: "Caswell", sigil: "Centaur vàng trên nền trắng", words: "Tốc độ chiến thắng", seat: "Bitterbridge", region: "Vùng Reach", themeColor: { primary: "#6a6a3a", secondary: "#4a4a2a" } },
  { id: "crane", name: "Nhà Crane", schemaName: "Crane", sigil: "Hạc vàng trên nền lam", words: "Vĩnh viễn trong chờ đợi", seat: "Red Lake", region: "Vùng Reach", themeColor: { primary: "#3a5a6a", secondary: "#2a3a4a" } },

  // -- Vùng Bão --
  { id: "connington", name: "Nhà Connington", schemaName: "Connington", sigil: "Hai chim ưng đỏ chiến đấu trên nền trắng", words: "Một cánh tay đỏ", seat: "Griffin's Roost", region: "Vùng Bão", themeColor: { primary: "#7a2a2a", secondary: "#5a1a1a" } },
  { id: "tarth", name: "Nhà Tarth", schemaName: "Tarth", sigil: "Ngôi sao vàng và trăng lưỡi liềm trên nền hồng xanh", words: "Đảo Sapphire", seat: "Evenfall Hall", region: "Vùng Bão", themeColor: { primary: "#3a6a7a", secondary: "#2a4a5a" } },
  { id: "dondarrion", name: "Nhà Dondarrion", schemaName: "Dondarrion", sigil: "Sét tím trên nền đen", words: "Sét không đánh hai lần", seat: "Blackhaven", region: "Vùng Bão", themeColor: { primary: "#4a2a6a", secondary: "#3a1a4a" } },
  { id: "swann", name: "Nhà Swann", schemaName: "Swann", sigil: "Hai thiên nga chiến đấu trắng đen", words: "Đen và trắng, không xám", seat: "Stonehelm", region: "Vùng Bão", themeColor: { primary: "#3a3a3a", secondary: "#5a5a5a" } },
  { id: "penrose", name: "Nhà Penrose", schemaName: "Penrose", sigil: "Hai quill vàng trên nền cam", words: "Viết bằng máu", seat: "Parchments", region: "Vùng Bão", themeColor: { primary: "#6a5a2a", secondary: "#8a7a4a" } },
  { id: "estermont", name: "Nhà Estermont", schemaName: "Estermont", sigil: "Rùa biển xanh trên nền xanh lá", words: "Biển nuôi sống", seat: "Greenstone", region: "Vùng Bão", themeColor: { primary: "#2a5a4a", secondary: "#1a3a3a" } },
  { id: "wylde", name: "Nhà Wylde", schemaName: "Wylde", sigil: "Vương miện xanh bão trên sóng", words: "Sóng gào ta vẫn đứng", seat: "Rain House", region: "Vùng Bão", themeColor: { primary: "#3a4a5a", secondary: "#2a3a4a" } },

  // -- Dorne --
  { id: "dayne", name: "Nhà Dayne", schemaName: "Dayne", sigil: "Ngôi sao rơi bạc trên nền tím", words: "Thanh kiếm Bình Minh", seat: "Starfall", region: "Dorne", themeColor: { primary: "#5a3a6a", secondary: "#3a2a4a" } },
  { id: "fowler", name: "Nhà Fowler", schemaName: "Fowler", sigil: "Chim ưng xanh bắt mồi trên nền bạc", words: "Cho tôi bay", seat: "Skyreach", region: "Dorne", themeColor: { primary: "#4a5a6a", secondary: "#2a3a4a" } },
  { id: "uller", name: "Nhà Uller", schemaName: "Uller", sigil: "Thằn lằn đỏ trên nền vàng", words: "Nửa điên nửa tỉnh", seat: "Hellholt", region: "Dorne", themeColor: { primary: "#8a5a2a", secondary: "#5a3a1a" } },
  { id: "manwoody", name: "Nhà Manwoody", schemaName: "Manwoody", sigil: "Sọ vương miện trên nền đen", words: "Xương không quên", seat: "Kingsgrave", region: "Dorne", themeColor: { primary: "#4a4a3a", secondary: "#2a2a2a" } },
  { id: "blackmont", name: "Nhà Blackmont", schemaName: "Blackmont", sigil: "Kền kền đen trên nền vàng", words: "Sự thật và kiên quyết", seat: "Blackmont", region: "Dorne", themeColor: { primary: "#3a3a2a", secondary: "#1a1a1a" } },
  { id: "toland", name: "Nhà Toland", schemaName: "Toland", sigil: "Rồng cắn đuôi xanh trên nền vàng", words: "Vòng tròn bất tận", seat: "Ghost Hill", region: "Dorne", themeColor: { primary: "#6a6a2a", secondary: "#4a4a1a" } },
  { id: "wyl", name: "Nhà Wyl", schemaName: "Wyl", sigil: "Rắn hổ mang đen trên nền vàng", words: "Nanh độc canh đường", seat: "Wyl", region: "Dorne", themeColor: { primary: "#4a4a2a", secondary: "#2a2a1a" } },

  // -- Nhà Hoare (thời Chinh Phục) --
  { id: "hoare", name: "Nhà Hoare", schemaName: "Hoare", sigil: "Cung trăng bạc trên nền đen", words: "Ngai Sắt và Đá Đen", seat: "Harrenhal", region: "Quần Đảo Sắt", themeColor: { primary: "#42484d", secondary: "#6b737a" }, activeToYear: 1 },

  { id: "custom", name: "Tự Tạo Thế Lực Mới", schemaName: "Tùy Chỉnh", sigil: "Tùy chọn",
    words: "Tùy chọn", seat: "Tùy chọn", region: "Tùy chọn",
    themeColor: { primary: "#a0a0a0", secondary: "#404040" }, continentIds: ["westeros", "essos", "ibben", "sothoryos", "summer-isles", "ulthos"], regionIds: [], cultureIds: [], kind: "polity", government: "feudal" }
];

export const HOUSES_DATA: HouseData[] = HOUSE_SEEDS.map((seed) => {
  const kind = seed.kind ?? (seed.id === "first-men" || seed.id === "children" ? "people" : "house");
  const government = seed.government ?? (kind === "people" ? "tribal" : "feudal");
  return {
    ...seed,
    continentIds: seed.continentIds ?? ["westeros"],
    regionIds: (seed.regionIds ?? WESTEROS_REGION_IDS[seed.region] ?? []).map(resolveRegionId),
    cultureIds: seed.cultureIds ?? [],
    kind,
    government,
    roles: seed.roles ? [...seed.roles] : rolesForGovernment(government),
    availableEras: seed.availableEras
      ?? (seed.continentIds?.some((continentId) => continentId !== "westeros")
        ? (ANCIENT_WORLD_ENTITY_IDS.has(seed.id) ? [...ALL_ERA_IDS] : [...POST_LONG_NIGHT_ERA_IDS])
        : undefined),
  };
});

export const HOUSES_BY_ID: Record<string, HouseData> = Object.fromEntries(HOUSES_DATA.map((h) => [h.id, h]));

export function housesForContinent(
  continentId: string,
  opts: { eraId?: string; year?: number } = {},
): HouseData[] {
  return HOUSES_DATA.filter((house) => {
    if (!house.continentIds.includes(continentId)) return false;
    if (opts.eraId && house.availableEras?.length && !house.availableEras.includes(opts.eraId)) return false;
    if (opts.year !== undefined && house.activeFromYear !== undefined && opts.year < house.activeFromYear) return false;
    if (opts.year !== undefined && house.activeToYear !== undefined && opts.year > house.activeToYear) return false;
    return true;
  });
}

export function rolesForHouse(houseId: string | null | undefined): string[] {
  return houseId && HOUSES_BY_ID[houseId] ? [...HOUSES_BY_ID[houseId].roles] : [...FEUDAL_ROLES];
}

/** Địa danh chính (8.7) — cho lore mặc định + bản đồ M7. */
export const MAJOR_LOCATIONS = [
  "Winterfell", "King's Landing", "The Wall", "Dragonstone", "Casterly Rock",
  "Highgarden", "Sunspear", "The Eyrie", "Riverrun", "Pyke", "Storm's End",
  "Braavos", "White Harbor", "Oldtown",
  "Pentos", "Volantis", "Meereen", "Qarth", "Vaes Dothrak",
] as const;
