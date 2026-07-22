// content/westeros/cultures.ts
import type { CoreStat } from "./skills";

export interface CultureDef {
  id: string;
  name: string;
  desc: string;
  statBonus: Partial<Record<CoreStat, number>>;
  defaultReligion?: string;
  reputationBonus?: { vinhDu?: number; nhanTu?: number; uyDung?: number; xaoQuyet?: number };
}

export const CULTURES: CultureDef[] = [
  {
    id: "first-men",
    name: "Tiền Nhân (First Men)",
    desc: "Những người đàn ông đầu tiên đặt chân đến Westeros. Bền bỉ, trọng danh dự và coi trọng lời thề máu.",
    statBonus: { "Thể Chất": 1, "Sức Mạnh": 1 },
    defaultReligion: "Cựu Thần",
    reputationBonus: { vinhDu: 5 }
  },
  {
    id: "andals",
    name: "Người Andal (Andals)",
    desc: "Những kẻ chinh phục mang theo đức tin Thất Diện Thần và kỵ sĩ bọc thép.",
    statBonus: { "Uy Tín": 1, "Trí Tuệ": 1 },
    defaultReligion: "Thất Diện Thần",
    reputationBonus: { nhanTu: 5 }
  },
  {
    id: "ironborn",
    name: "Người Quần Đảo Sắt (Ironborn)",
    desc: "Khắc nghiệt như biển khơi, tôn thờ sức mạnh và cướp bóc.",
    statBonus: { "Sức Mạnh": 1, "Thể Chất": 1 },
    defaultReligion: "Thần Chết Chìm",
    reputationBonus: { uyDung: 5, vinhDu: -5 }
  },
  {
    id: "valyrian",
    name: "Hậu Duệ Valyria (Valyrian)",
    desc: "Dòng máu của những chúa rồng cổ đại, mang vẻ đẹp ma mị và sự kiêu ngạo.",
    statBonus: { "Uy Tín": 2 },
    reputationBonus: { uyDung: 5 }
  },
  {
    id: "rhoynar",
    name: "Người Rhoynar (Rhoynar)",
    desc: "Những người trốn chạy từ lục địa Essos, định cư tại Dorne, nổi tiếng với sự nhanh nhẹn và bình đẳng giới.",
    statBonus: { "Nhanh Nhẹn": 2 },
    defaultReligion: "Thất Diện Thần",
  },
  {
    id: "free-folk",
    name: "Man Tộc (Free Folk)",
    desc: "Từ chối quỳ gối trước bất kỳ vị vua nào, kiên cường sinh tồn ngoài Bức Tường.",
    statBonus: { "Thể Chất": 2 },
    defaultReligion: "Cựu Thần",
    reputationBonus: { vinhDu: -5, uyDung: 5 }
  }
];

export const CULTURES_BY_ID = Object.fromEntries(CULTURES.map(c => [c.id, c]));
