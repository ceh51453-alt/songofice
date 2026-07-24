import type { CanonCharacter } from "../eras";

export const dunkAndEggCharacters: CanonCharacter[] = [
  {
    id: "aerion-brightflame",
    name: "Aerion Brightflame",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Kẻ Điên Hào Nhoáng",
    religion: "Thất Diện Thần",
    blurb: "Aerion rực rỡ, độc ác và điên rồ. Hắn tự coi mình là rồng mang hình dáng con người. Lòng kiêu ngạo của hắn đã gây ra bi kịch tại Ashford.",
    birthYear: 192,
    deathYear: 232,
    age: 17,
    coreStats: { STR: 12, AGI: 14, END: 10, INT: 10, WIL: 8, CHA: 15 },
    talentIds: ["arrogant", "madness", "handsome"],
    skills: { "Thương Kỵ": 14, "Cận Chiến (Kiếm)": 12 },
    equipment: [],
    items: [],
    gold: 500,
    startingHookIds: [],
    personalHooks: [
      { id: "aerion-ashford", title: "Thử Thách Bằng Chiến Đấu", year: "209 AC", numericYear: 209, desc: "Một tên hiệp sĩ lang thang dám đánh ngươi. Ngươi đòi quyền Xét Xử Bằng Bảy Người để trừng phạt hắn." }
    ]
  },
  {
    id: "daeron-the-drunken",
    name: "Daeron Mập Mạp",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Say Xỉn",
    religion: "Thất Diện Thần",
    blurb: "Anh trai của Aerion. Daeron thường xuyên say xỉn và ghét việc trở thành hiệp sĩ. Nhưng đằng sau vẻ hèn nhát đó là những giấc mơ tiên tri đầy ám ảnh.",
    birthYear: 190,
    deathYear: 228,
    age: 19,
    coreStats: { STR: 8, AGI: 6, END: 8, INT: 14, WIL: 6, CHA: 10 },
    talentIds: ["prophetic", "depressed"],
    skills: { "Ma Thuật (Tiên Tri)": 15 },
    equipment: [],
    items: [{ ten: "Bầu rượu", soLuong: 5, moTa: "Rượu vang chua." }],
    gold: 200,
    startingHookIds: [],
    personalHooks: [
      { id: "daeron-dream", title: "Giấc Mơ Rồng Chết", year: "209 AC", numericYear: 209, desc: "Ngươi mơ thấy một con rồng khổng lồ ngã xuống một hiệp sĩ cao lớn. Giấc mơ đó ám ảnh ngươi đến mức ngươi trốn khỏi giải đấu." }
    ]
  },
  {
    id: "rohanne-webber",
    name: "Rohanne Webber",
    tuocVi: "Lãnh Chúa",
    house: "Webber",
    role: "Góa Phụ Đỏ",
    religion: "Thất Diện Thần",
    blurb: "Nữ lãnh chúa xinh đẹp và nguy hiểm của Coldmoat. Bị đồn là giết bốn người chồng trước, nhưng thực ra cô là một phụ nữ thông minh đang cố bảo vệ đất đai của mình.",
    birthYear: 184,
    deathYear: 230,
    age: 26,
    coreStats: { STR: 6, AGI: 12, END: 10, INT: 15, WIL: 16, CHA: 16 },
    talentIds: ["cunning", "seductive", "stubborn"],
    skills: { "Quản Lý": 14, "Thuyết Phục": 15, "Bắn Cung": 12 },
    equipment: [],
    items: [],
    gold: 1200,
    startingHookIds: [],
    startHoldings: ["coldmoat"],
    startRegions: [],
    personalHooks: [
      { id: "red-widow", title: "Tranh Chấp Đất Đai", year: "211 AC", numericYear: 211, desc: "Lão Eustace Osgrey đang phàn nàn về dòng suối bị chặn. Ngươi phải giải quyết lão già gàn dở này." }
    ]
  },
  {
    id: "eustace-osgrey",
    name: "Eustace Osgrey",
    tuocVi: "Hiệp Sĩ",
    house: "Osgrey",
    role: "Sư Tử Già",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa nghèo khó của Standfast, từng ủng hộ Blackfyre. Ông sống trong quá khứ huy hoàng của gia tộc và căm ghét Nữ Góa Phụ Đỏ.",
    birthYear: 155,
    age: 56,
    coreStats: { STR: 8, AGI: 7, END: 8, INT: 12, WIL: 14, CHA: 10 },
    talentIds: ["proud", "stubborn", "veteran"],
    skills: { "Chỉ Huy": 12, "Lịch Sử": 15 },
    equipment: [],
    items: [],
    gold: 50,
    startingHookIds: [],
    startHoldings: ["standfast"],
    startRegions: [],
    personalHooks: [
      { id: "eustace-pride", title: "Lòng Tự Hào Của Sư Tử Đốm", year: "211 AC", numericYear: 211, desc: "Nhà Webber đã chặn dòng suối. Dù chỉ có vài nông dân, ngươi vẫn muốn chiến đấu vì danh dự." }
    ]
  },
  {
    id: "daemon-ii-blackfyre",
    name: "Daemon II Blackfyre",
    tuocVi: "Thường Dân",
    house: "Blackfyre",
    role: "John the Fiddler",
    religion: "Thất Diện Thần",
    blurb: "Con trai thứ ba của Daemon Blackfyre. Hắn đóng giả thành hiệp sĩ giang hồ 'John the Fiddler' để âm mưu một cuộc nổi dậy mới tại Whitewalls.",
    birthYear: 188,
    deathYear: 212,
    age: 24,
    coreStats: { STR: 12, AGI: 14, END: 12, INT: 13, WIL: 10, CHA: 16 },
    talentIds: ["handsome", "prophetic"],
    skills: { "Thương Kỵ": 12, "Âm Nhạc": 15, "Thuyết Phục": 14 },
    equipment: [],
    items: [],
    gold: 300,
    startingHookIds: ["whitewalls-conspiracy"],
    personalHooks: [
      { id: "daemon-whitewalls", title: "Giấc Mơ Trứng Rồng", year: "212 AC", numericYear: 212, desc: "Ngươi mơ thấy một con rồng nở từ quả trứng tại Whitewalls. Cuộc nổi dậy thứ hai đang nhen nhóm." }
    ]
  }
];
