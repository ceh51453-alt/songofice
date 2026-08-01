// content/westeros/cultures.ts
import type { CoreStat } from "./skills";
import { resolveRegionId } from "../world/geography";

export interface CultureDef {
  id: string;
  name: string;
  desc: string;
  /** Geography ids from content/world/geography. */
  continentIds: string[];
  /** Optional finer geographic affinity; an empty list means the whole continent. */
  regionIds?: string[];
  /** Languages are descriptive ids for character generation and AI context. */
  languageIds?: string[];
  statBonus: Partial<Record<CoreStat, number>>;
  defaultReligion?: string;
  reputationBonus?: { vinhDu?: number; nhanTu?: number; uyDung?: number; xaoQuyet?: number };
}

export const CULTURES: CultureDef[] = [
  {
    id: "first-men",
    name: "Tiền Nhân (First Men)",
    desc: "Những người đàn ông đầu tiên đặt chân đến Westeros. Bền bỉ, trọng danh dự và coi trọng lời thề máu.",
    continentIds: ["westeros"], languageIds: ["common-tongue", "old-tongue"],
    statBonus: { "Thể Chất": 1, "Sức Mạnh": 1 },
    defaultReligion: "Cựu Thần",
    reputationBonus: { vinhDu: 5 }
  },
  {
    id: "andals",
    name: "Người Andal (Andals)",
    desc: "Những kẻ chinh phục mang theo đức tin Thất Diện Thần và kỵ sĩ bọc thép.",
    continentIds: ["westeros", "essos"], languageIds: ["common-tongue"],
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 },
    defaultReligion: "Thất Diện Thần",
    reputationBonus: { nhanTu: 5 }
  },
  {
    id: "ironborn",
    name: "Người Quần Đảo Sắt (Ironborn)",
    desc: "Khắc nghiệt như biển khơi, tôn thờ sức mạnh và cướp bóc.",
    continentIds: ["westeros"], regionIds: ["the-iron-islands"], languageIds: ["common-tongue"],
    statBonus: { "Sức Mạnh": 1, "Thể Chất": 1 },
    defaultReligion: "Thần Chết Chìm",
    reputationBonus: { uyDung: 5, vinhDu: -5 }
  },
  {
    id: "valyrian",
    name: "Hậu Duệ Valyria (Valyrian)",
    desc: "Dòng máu của những chúa rồng cổ đại, mang vẻ đẹp ma mị và sự kiêu ngạo.",
    continentIds: ["essos", "westeros"], languageIds: ["high-valyrian"],
    statBonus: { "Uy Tín": 2 },
    reputationBonus: { uyDung: 5 }
  },
  {
    id: "rhoynar",
    name: "Người Rhoynar (Rhoynar)",
    desc: "Những người trốn chạy từ lục địa Essos, định cư tại Dorne, nổi tiếng với sự nhanh nhẹn và bình đẳng giới.",
    continentIds: ["essos", "westeros"], regionIds: ["dorne", "essos-upper-rhoyne", "essos-lower-rhoyne", "essos-sorrows"], languageIds: ["rhoynish", "common-tongue"],
    statBonus: { "Nhanh Nhẹn": 2 },
    defaultReligion: "Thất Diện Thần",
  },
  {
    id: "free-folk",
    name: "Man Tộc (Free Folk)",
    desc: "Từ chối quỳ gối trước bất kỳ vị vua nào, kiên cường sinh tồn ngoài Bức Tường.",
    continentIds: ["westeros"], regionIds: ["beyond-the-wall"], languageIds: ["old-tongue", "common-tongue"],
    statBonus: { "Thể Chất": 2 },
    defaultReligion: "Cựu Thần",
    reputationBonus: { vinhDu: -5, uyDung: 5 }
  },
  {
    id: "braavosi", name: "Người Braavos", continentIds: ["essos"], regionIds: ["essos-braavos"],
    languageIds: ["braavosi-valyrian", "trade-tongue"],
    desc: "Công dân của Thành Phố Tự Do chống chế độ nô lệ, quen biển lạnh, thương mại và những ngõ kênh đầy kiếm khách.",
    statBonus: { "Nhanh Nhẹn": 1, "Tinh Tường": 1 }, defaultReligion: "Đa Diện Thần",
    reputationBonus: { xaoQuyet: 3 },
  },
  {
    id: "pentoshi", name: "Người Pentos", continentIds: ["essos"], regionIds: ["essos-pentos"],
    languageIds: ["pentoshi-valyrian", "trade-tongue"],
    desc: "Một nền văn hóa thương mại giàu có, nơi các magister, đoàn buôn và thế lực ngoại bang cùng tranh ảnh hưởng.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 }, defaultReligion: "Không Tín Ngưỡng",
  },
  {
    id: "myrish", name: "Người Myr", continentIds: ["essos"], regionIds: ["essos-myr"],
    languageIds: ["myrish-valyrian", "trade-tongue"],
    desc: "Nổi tiếng với thợ thủ công, kính viễn vọng, ren và những cỗ nỏ tinh xảo của vùng Đất Tranh Chấp.",
    statBonus: { "Trí Tuệ": 1, "Tinh Tường": 1 }, defaultReligion: "Không Tín Ngưỡng",
  },
  {
    id: "tyroshi", name: "Người Tyrosh", continentIds: ["essos"], regionIds: ["essos-tyrosh"],
    languageIds: ["tyroshi-valyrian", "trade-tongue"],
    desc: "Dân đảo thành Tyrosh chuộng màu sắc rực rỡ, thương mại, lính đánh thuê và chính trị do Archon dẫn dắt.",
    statBonus: { "Uy Tín": 1, "Nhanh Nhẹn": 1 }, defaultReligion: "Không Tín Ngưỡng",
  },
  {
    id: "lysene", name: "Người Lys", continentIds: ["essos"], regionIds: ["essos-lys"],
    languageIds: ["lysene-valyrian", "trade-tongue"],
    desc: "Hậu duệ Valyria ở đảo Lys, nổi danh bởi thương thuyền, nước hoa, dục quán và vẻ đẹp tóc bạc mắt sáng.",
    statBonus: { "Uy Tín": 2 }, defaultReligion: "Quý Bà Than Khóc",
  },
  {
    id: "volantene", name: "Người Volantis", continentIds: ["essos"], regionIds: ["essos-volantis"],
    languageIds: ["volantene-valyrian", "high-valyrian"],
    desc: "Công dân của thành phố Valyria lâu đời nhất, bị chia giữa Cựu Huyết, dân tự do và vô số nô lệ có hình xăm nghề nghiệp.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 }, defaultReligion: "Thần Ánh Sáng (R'hllor)",
  },
  {
    id: "lorathi", name: "Người Lorath", continentIds: ["essos"], regionIds: ["essos-lorath"],
    languageIds: ["lorathi-valyrian", "trade-tongue"],
    desc: "Dân đảo phương bắc kín tiếng, sống giữa mê cung đá cổ và truyền thống của những hội đồng thương nhân.",
    statBonus: { "Tinh Tường": 1, "Trí Tuệ": 1 }, defaultReligion: "Thần Mù Boash",
  },
  {
    id: "norvoshi", name: "Người Norvos", continentIds: ["essos"], regionIds: ["essos-norvos"],
    languageIds: ["norvoshi-valyrian", "trade-tongue"],
    desc: "Một dân tộc đồi núi nghiêm khắc, nơi các Tư Tế Râu cai trị dưới tiếng chuông thành Norvos.",
    statBonus: { "Thể Chất": 1, "Uy Tín": 1 }, defaultReligion: "Thần Vô Danh của Norvos",
  },
  {
    id: "qohorik", name: "Người Qohor", continentIds: ["essos"], regionIds: ["essos-qohor"],
    languageIds: ["qohorik-valyrian", "trade-tongue"],
    desc: "Dân thành rừng Qohor, bậc thầy rèn thép và là tín đồ của Hắc Sơn Dương khát máu.",
    statBonus: { "Trí Tuệ": 1, "Thể Chất": 1 }, defaultReligion: "Hắc Sơn Dương Qohor",
  },
  {
    id: "dothraki", name: "Người Dothraki", continentIds: ["essos"], regionIds: ["essos-western-dothraki-sea", "essos-vaes-dothrak", "essos-central-dothraki-sea", "essos-eastern-dothraki-sea"],
    languageIds: ["dothraki"],
    desc: "Các khalasar du mục của biển cỏ, coi ngựa, sức mạnh và chiến lợi phẩm là nền tảng của địa vị.",
    statBonus: { "Nhanh Nhẹn": 1, "Thể Chất": 1 }, defaultReligion: "Đại Mã Thần",
    reputationBonus: { uyDung: 5 },
  },
  {
    id: "ghiscari", name: "Người Ghiscari", continentIds: ["essos"], regionIds: ["essos-astapor", "essos-yunkai", "essos-meereen", "essos-new-ghis", "essos-ghiscari-hinterland"],
    languageIds: ["ghiscari", "bastard-valyrian"],
    desc: "Hậu duệ Đế chế Ghis cổ, giữ truyền thống harpy, tầng lớp chủ nô và đội hình bộ binh kỷ luật.",
    statBonus: { "Uy Tín": 1, "Tinh Tường": 1 }, defaultReligion: "Harpy của Ghis",
  },
  {
    id: "qartheen", name: "Người Qarth", continentIds: ["essos"], regionIds: ["essos-qarth", "essos-jade-gates"],
    languageIds: ["qartheen", "trade-tongue"],
    desc: "Dân thành Qarth hoa lệ giữa ngã ba thương mại, nổi tiếng bởi nghi lễ cầu kỳ, các hội thương nhân và pháp sư cổ.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 }, defaultReligion: "Không Tín Ngưỡng",
  },
  {
    id: "lhazareen", name: "Người Lhazar", continentIds: ["essos"], regionIds: ["essos-lhazar"],
    languageIds: ["lhazareen"],
    desc: "Dân chăn cừu hiền hòa của Lhazar, gắn bó với cộng đồng, đồng cỏ và Đại Mục Đồng.",
    statBonus: { "Thể Chất": 1, "Uy Tín": 1 }, defaultReligion: "Đại Mục Đồng",
    reputationBonus: { nhanTu: 5 },
  },
  {
    id: "sarnori", name: "Người Sarnor", continentIds: ["essos"], regionIds: ["essos-sarnor"],
    languageIds: ["sarnori"],
    desc: "Tàn dân của những vương quốc Người Cao từng bao phủ thảo nguyên phía tây, nay tập trung quanh Saath.",
    statBonus: { "Sức Mạnh": 1, "Trí Tuệ": 1 }, defaultReligion: "Khác...",
  },
  {
    id: "ibbenese", name: "Người Ibben", continentIds: ["ibben"], regionIds: ["ibben-ib", "ibben-ib-sar"],
    languageIds: ["ibbenese"],
    desc: "Những thủy thủ và thợ săn cá voi lực lưỡng từ các đảo lạnh phương bắc.",
    statBonus: { "Sức Mạnh": 1, "Thể Chất": 1 }, defaultReligion: "Khác...",
  },
  {
    id: "yi-tish", name: "Người Yi Ti", continentIds: ["essos"], regionIds: ["essos-yi-ti-west", "essos-yi-ti-central", "essos-yi-ti-east", "essos-grey-waste"],
    languageIds: ["yi-tish"],
    desc: "Thần dân của các hoàng triều phương đông cổ kính, với quan lại, thành phố lớn và nghi lễ cung đình tinh vi.",
    statBonus: { "Trí Tuệ": 2 }, defaultReligion: "Sư Tử Bóng Đêm và Nữ Nhân Ánh Sáng",
  },
  {
    id: "lengii", name: "Người Leng", continentIds: ["essos"],
    languageIds: ["lengii", "yi-tish"],
    desc: "Cư dân đảo Leng cao lớn, mang truyền thống bản địa hòa trộn với ảnh hưởng đế quốc Yi Ti.",
    statBonus: { "Tinh Tường": 1, "Uy Tín": 1 }, defaultReligion: "Cổ Thần Leng",
  },
  {
    id: "jogos-nhai", name: "Người Jogos Nhai", continentIds: ["essos"], regionIds: ["essos-jogos-nhai"],
    languageIds: ["jogos-nhai"],
    desc: "Các bộ tộc du mục phương đông cưỡi zorse, tổ chức thành những nhóm chiến binh do jhat và moonsinger dẫn dắt.",
    statBonus: { "Nhanh Nhẹn": 2 }, defaultReligion: "Khác...",
  },
  {
    id: "asshaii", name: "Người Asshai", continentIds: ["essos"], regionIds: ["essos-asshai", "essos-shadow-lands"],
    languageIds: ["asshaii", "shadow-tongue"],
    desc: "Cư dân bí ẩn bên rìa Bóng Tối, nơi tri thức huyền thuật được dung thứ nhưng ánh sáng và sự sống đều hiếm hoi.",
    statBonus: { "Trí Tuệ": 1, "Tinh Tường": 1 }, defaultReligion: "Thần Ánh Sáng (R'hllor)",
  },
  {
    id: "summer-islander", name: "Người Quần Đảo Mùa Hè", continentIds: ["summer-isles"], regionIds: ["summer-walano", "summer-jhala", "summer-omboru", "summer-koj"],
    languageIds: ["summer-tongue", "trade-tongue"],
    desc: "Những thủy thủ, thương nhân và cung thủ nổi tiếng từ các đảo nhiệt đới giàu gỗ quý, hoa quả và thiên nga đen.",
    statBonus: { "Nhanh Nhẹn": 1, "Uy Tín": 1 }, defaultReligion: "Các Thần Mùa Hè",
    reputationBonus: { nhanTu: 3 },
  },
  {
    id: "naathi", name: "Người Naath", continentIds: ["sothoryos"], regionIds: ["naath"],
    languageIds: ["naathi"],
    desc: "Dân đảo Naath hòa bình, nổi tiếng bởi âm nhạc, lòng hiếu khách và sự bảo hộ của bướm độc bản địa.",
    statBonus: { "Uy Tín": 1, "Tinh Tường": 1 }, defaultReligion: "Chúa Hòa Hợp",
    reputationBonus: { nhanTu: 8, vinhDu: 2 },
  },
  {
    id: "basilisk-islander", name: "Dân Quần Đảo Basilisk", continentIds: ["sothoryos"], regionIds: ["sothoryos-basilisk-isles"],
    languageIds: ["trade-tongue"],
    desc: "Một cộng đồng pha trộn của thủy thủ, nô lệ trốn thoát, cướp biển và hậu duệ Ghiscari quanh bờ bắc Sothoryos.",
    statBonus: { "Thể Chất": 1, "Tinh Tường": 1 }, defaultReligion: "Khác...",
    reputationBonus: { xaoQuyet: 5 },
  },
  {
    id: "sothoryi", name: "Cư Dân Sothoryos", continentIds: ["sothoryos"], regionIds: ["sothoryos-zamettar", "sothoryos-yeen", "sothoryos-green-hell", "sothoryos-south"],
    languageIds: ["sothoryi"],
    desc: "Tên gọi rộng cho các cộng đồng ít được ngoại giới biết đến trong lục địa rừng rậm, đầm lầy và bệnh dịch.",
    statBonus: { "Thể Chất": 2 }, defaultReligion: "Khác...",
  },
  {
    id: "ulthosi", name: "Cư Dân Ulthos", continentIds: ["ulthos"], regionIds: ["ulthos-west-coast", "ulthos-interior"],
    languageIds: ["ulthosi"],
    desc: "Những cộng đồng gần như chưa được ghi chép ở bờ rừng xa xôi Ulthos; phần lớn tri thức về họ chỉ là lời kể thủy thủ.",
    statBonus: { "Tinh Tường": 1, "Thể Chất": 1 }, defaultReligion: "Khác...",
  }
];

for (const culture of CULTURES) {
  if (culture.regionIds) culture.regionIds = culture.regionIds.map(resolveRegionId);
}

export const CULTURES_BY_ID = Object.fromEntries(CULTURES.map(c => [c.id, c]));

export function culturesForContinent(continentId: string): CultureDef[] {
  return CULTURES.filter((culture) => culture.continentIds.includes(continentId));
}
