import type { CanonCharacter } from "../eras";

export const dunkAndEggCharacters: CanonCharacter[] = [
  {
    id: "aerion-brightflame",
    origin: "Con trai thứ hai của Maekar I và Dyanna Dayne, hoàng tử Targaryen được gọi là Brightflame.", culture: "Valyria hậu duệ", bloodline: "Nhà Targaryen và Dayne", continent: "Westeros",
    appearance: "Tóc bạc-vàng và mắt tím; nổi tiếng vì vẻ đẹp hoàng gia đi cùng tính khí tàn nhẫn.",
    name: "Aerion Brightflame",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Kẻ Điên Hào Nhoáng",
    religion: "Thất Diện Thần",
    blurb: "Aerion rực rỡ, độc ác và điên rồ. Hắn tự coi mình là rồng mang hình dáng con người. Lòng kiêu ngạo của hắn đã gây ra bi kịch tại Ashford.",
    birthYear: 192,
    deathYear: 232,
    age: 17,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 10, "Trí Tuệ": 10, "Tinh Tường": 8, "Uy Tín": 15 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 75, "Trí Mưu": 50, "Ngoại Giao": 40 },
    talentIds: ["hot-tempered", "chronic-illness", "highborn-charm"],
    skills: { "war-riding": 7, "sword-shield": 6, "command": 5 },
    equipment: [
      { slot: "Vũ Khí Chính", ten: "Trường Thương Bạc", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Thương chiến được trang trí lộng lẫy" },
      { slot: "Giáp Thân", ten: "Giáp Rồng Lửa Ngọn", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 8, "Uy Tín": 2 }, moTa: "Giáp tinh xảo sơn màu ngọn lửa" }
    ],
    items: [{ ten: "Lọ Cháy Hoang", soLuong: 1, moTa: "Chất lỏng xanh lục nguy hiểm" }],
    gold: 5000, startingHookIds: [],
    father: "maekar-i-targaryen", mother: "dyanna-dayne",
    spouse: "daenora-targaryen",
    children: ["maegor-targaryen"],
    siblings: ["daeron-the-drunken", "aemon-targaryen", "aegon-v-targaryen"],
    allies: [],
    rivals: ["duncan-the-tall"],
    liege: "maekar-i-targaryen",
    relationshipDetails: {
      "maekar-i-targaryen": { type: "Cha", trust: 40, affinity: 30, detail: "Maekar ghê tởm sự tàn nhẫn của Aerion nhưng vẫn bao che vì hắn là con ruột." },
      "daeron-the-drunken": { type: "Anh Chị Em", trust: 20, affinity: 10, detail: "Aerion khinh thường anh trai say xỉn hèn nhát, thường xuyên bắt nạt và sỉ nhục Daeron." },
      "duncan-the-tall": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Tên hiệp sĩ lang thang bé nhỏ dám đánh một hoàng tử. Aerion thề sẽ trả thù." }
    },
    startArmies: [
          { name: "Lính Kích Đỉnh Aegon", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Thành Thạo" }
        ],
    personalHooks: [
      { id: "aerion-ashford", title: "Thử Thách Bằng Chiến Đấu", year: "209 AC", numericYear: 209, desc: "Một tên hiệp sĩ lang thang dám đánh ngươi. Ngươi đòi quyền Xét Xử Bằng Bảy Người để trừng phạt hắn." }
    ],
      startResources: {
        "Gỗ": 20,
        "Quặng Sắt": 10,
        "Đá": 20,
        "Lương Thực": 100,
        "Ngựa": 4,
        "Thép Valyria": 0
      },
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "daeron-the-drunken",
    origin: "Con trai cả của Maekar I và Dyanna Dayne, hoàng tử có những giấc mơ tiên tri nhưng chối bỏ nghĩa vụ.", culture: "Valyria hậu duệ", bloodline: "Nhà Targaryen và Dayne", continent: "Westeros",
    appearance: "Tóc bạc-vàng của Targaryen; thường xuất hiện trong tình trạng say xỉn.",
    name: "Daeron Mập Mạp",
    tuocVi: "Hoàng Tử",
    house: "Targaryen",
    role: "Hoàng Tử Say Xỉn",
    religion: "Thất Diện Thần",
    blurb: "Anh trai của Aerion. Daeron thường xuyên say xỉn và ghét việc trở thành hiệp sĩ. Nhưng đằng sau vẻ hèn nhát đó là những giấc mơ tiên tri đầy ám ảnh.",
    birthYear: 190,
    deathYear: 228,
    age: 19,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 6, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 6, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 50, "Trí Mưu": 70, "Ngoại Giao": 30 },
    talentIds: ["greenseer", "haunted-past"],
    skills: { "greensight": 8 },
    equipment: [],
    items: [{ ten: "Bầu rượu vang Arbor", soLuong: 10, moTa: "Rượu ngon để quên đi ác mộng." }],
    gold: 2000,
    startingHookIds: [],
    father: "maekar-i-targaryen", mother: "dyanna-dayne",
    spouse: "kiera-tyrosh",
    children: ["vaella-targaryen"],
    siblings: ["aerion-brightflame", "aemon-targaryen", "aegon-v-targaryen"],
    allies: ["duncan-the-tall"],
    rivals: [],
    liege: "maekar-i-targaryen",
    relationshipDetails: {
      "maekar-i-targaryen": { type: "Cha", trust: 50, affinity: 40, detail: "Maekar thất vọng vì Daeron say xỉn và hèn nhát, nhưng vẫn yêu thương con trai." },
      "aerion-brightflame": { type: "Anh Chị Em", trust: 10, affinity: 5, detail: "Daeron sợ em trai tàn nhẫn, thường xuyên bị Aerion bắt nạt từ nhỏ." },
      "duncan-the-tall": { type: "Bằng Hữu", trust: 80, affinity: 90, detail: "Dunk là người bạn thật sự đầu tiên. Daeron giúp Dunk trong Xét Xử Bằng Bảy vì lương tâm không cho phép ông đứng nhìn." }
    },
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    },
    startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 29, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 8, quality: "Mới Lập Đội" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 1, quality: "Mới Lập Đội" }
        ],
    personalHooks: [
      { id: "daeron-dream", title: "Giấc Mơ Rồng Chết", year: "209 AC", numericYear: 209, desc: "Ngươi mơ thấy một con rồng khổng lồ ngã xuống một hiệp sĩ cao lớn. Giấc mơ đó ám ảnh ngươi đến mức ngươi trốn khỏi giải đấu." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 25
},
  {
    id: "rohanne-webber",
    origin: "Quý nữ Coldmoat, được gọi là Red Widow sau nhiều cuộc hôn nhân và là trung tâm tranh chấp The Sworn Sword.", culture: "Người Reach", bloodline: "Nhà Webber", continent: "Westeros",
    appearance: "Tóc đỏ nổi bật, phong thái sắc sảo; biệt danh Red Widow xuất phát từ tóc và những người chồng đã mất.",
    name: "Rohanne Webber",
    tuocVi: "Đại Lãnh Chúa",
    house: "Webber",
    role: "Góa Phụ Đỏ",
    religion: "Thất Diện Thần",
    blurb: "Nữ lãnh chúa xinh đẹp và nguy hiểm của Coldmoat. Bị đồn là giết bốn người chồng trước, nhưng thực ra cô là một phụ nữ thông minh đang cố bảo vệ đất đai của mình.",
    birthYear: 184,
    deathYear: 230,
    age: 26,
    coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 12, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 30, "Thống Soái": 80, "Trí Mưu": 75, "Ngoại Giao": 80 },
    talentIds: ["schemer", "master-liar", "iron-constitution"],
    skills: { "court-etiquette": 7, "persuasion": 8, "bow-crossbow": 6 },
    equipment: [{ slot: "Vũ Khí Phụ", ten: "Cung ngắn", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Xa": 5 }, moTa: "Cung dệt bằng tơ nhện" }],
    items: [{ ten: "Mạng che mặt Góa Phụ Đỏ", soLuong: 1, moTa: "Che đậy nhan sắc và âm mưu" }],
    gold: 15000,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 250,
      "Đá": 500,
      "Lương Thực": 2500,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "wymar-webber",
    mother: "",
    spouse: "eustace-osgrey",
    children: ["tywald-lannister", "tion-lannister", "tytos-lannister", "jason-lannister"],
    siblings: [],
    allies: ["duncan-the-tall"],
    rivals: ["eustace-osgrey"],
    liege: "leo-tyrell",
    relationshipDetails: {
      "eustace-osgrey": { type: "Chồng/Đối Thủ", trust: 30, affinity: 40, detail: "Tranh chấp đất đai khốc liệt, nhưng cuối cùng kết hôn sau khi Dunk làm trung gian." },
      "duncan-the-tall": { type: "Bằng Hữu", trust: 85, affinity: 80, detail: "Rohanne ngưỡng mộ sự thẳng thắn và can đảm của Dunk. Cô thậm chí hôn tạm biệt ông." },
      "leo-tyrell": { type: "Lãnh Chúa", trust: 60, affinity: 40, detail: "Rohanne là chư hầu trung thành của nhà Tyrell, dù cô tự quyết mọi việc trên lãnh địa." }
    },
    startArmies: [
          { name: "Lính Nhện Độc", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Standfast", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vực", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
    personalHooks: [
      { id: "red-widow", title: "Tranh Chấp Đất Đai", year: "211 AC", numericYear: 211, desc: "Lão Eustace Osgrey đang phàn nàn về dòng suối bị chặn. Ngươi phải giải quyết lão già gàn dở này." }
    ],
      startRegions: ["the-reach"],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 150
},
  {
    id: "eustace-osgrey",
    origin: "Hiệp sĩ già của Standfast, từng chiến đấu cho Daemon Blackfyre trong cuộc nổi loạn đầu tiên.", culture: "Người Reach", bloodline: "Nhà Osgrey", continent: "Westeros",
    appearance: "Một hiệp sĩ lớn tuổi, khập khiễng vì vết thương cũ; không còn dáng dấp thời chiến.",
    name: "Eustace Osgrey",
    tuocVi: "Đại Lãnh Chúa",
    house: "Osgrey",
    role: "Sư Tử Già",
    religion: "Thất Diện Thần",
    blurb: "Lãnh chúa nghèo khó của Standfast, từng ủng hộ Blackfyre. Ông sống trong quá khứ huy hoàng của gia tộc và căm ghét Nữ Góa Phụ Đỏ.",
    birthYear: 155,
    age: 56,
    coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 7, "Thể Chất": 8, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 10 },
    năngLực: { "Võ Lực": 40, "Thống Soái": 50, "Trí Mưu": 60, "Ngoại Giao": 70 },
    talentIds: ["intimidating", "iron-constitution", "keen-eye"],
    skills: { "command": 6, "lore": 8 },
    equipment: [{ slot: "Vũ Khí Chính", ten: "Thanh gươm cũ rỉ", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Di vật từ trận Cánh Đồng Cỏ Đỏ" }],
    items: [{ ten: "Huy hiệu Sư Tử Trắng", soLuong: 1, moTa: "Sự kiêu hãnh cuối cùng của Osgrey" }],
    gold: 50,
    startResources: {
      "Gỗ": 500,
      "Quặng Sắt": 250,
      "Đá": 500,
      "Lương Thực": 2500,
      "Ngựa": 100,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "",
    mother: "",
    spouse: "rohanne-webber",
    children: [],
    siblings: [],
    allies: ["duncan-the-tall"],
    rivals: ["rohanne-webber"],
    liege: "leo-tyrell",
    relationshipDetails: {
      "rohanne-webber": { type: "Vợ/Đối Thủ", trust: 25, affinity: 35, detail: "Ban đầu là kẻ thù truyền kiếp tranh chấp dòng suối Chequy, nhưng cuối cùng kết hôn. Một mối tình kỳ lạ." },
      "duncan-the-tall": { type: "Bằng Hữu", trust: 90, affinity: 85, detail: "Dunk là giám mã trung thành, người duy nhất chịu nghe những câu chuyện xưa cũ về vinh quang đã mất của nhà Osgrey." },
      "daemon-blackfyre": { type: "Cựu Chủ", trust: 0, affinity: 70, detail: "Eustace từng chiến đấu cho phe Blackfyre tại Cánh Đồng Cỏ Đỏ. Ông vẫn giữ thanh kiếm cũ làm kỷ niệm." }
    },
    startArmies: [
          { name: "Dân Binh Osgrey", type: "Bộ Binh", size: 70, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Osgrey", type: "Cung Thủ", size: 30, quality: "Mới Lập Đội" }
        ],
    personalHooks: [
      { id: "eustace-pride", title: "Lòng Tự Hào Của Sư Tử Đốm", year: "211 AC", numericYear: 211, desc: "Nhà Webber đã chặn dòng suối. Dù chỉ có vài nông dân, ngươi vẫn muốn chiến đấu vì danh dự." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 10
},
  {
    id: "daemon-ii-blackfyre",
    origin: "Con trai Daemon I Blackfyre, người tự xưng dẫn đầu Cuộc Nổi Loạn Blackfyre lần hai từ Tyrosh.", culture: "Valyria hậu duệ; lớn lên lưu vong", bloodline: "Nhà Blackfyre", continent: "Essos",
    appearance: "Tóc bạc-vàng và mắt tím của dòng Blackfyre; một chàng trai có dáng vẻ hoàng gia nhưng thiếu bản lĩnh chiến trường.",
    name: "Daemon II Blackfyre",
    tuocVi: "Thường Dân",
    house: "Blackfyre",
    role: "John the Fiddler",
    religion: "Thất Diện Thần",
    blurb: "Con trai thứ ba của Daemon Blackfyre. Hắn đóng giả thành hiệp sĩ giang hồ 'John the Fiddler' để âm mưu một cuộc nổi dậy mới tại Whitewalls.",
    birthYear: 188,
    deathYear: 212,
    age: 24,
    coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 13, "Tinh Tường": 10, "Uy Tín": 16 },
    năngLực: { "Võ Lực": 60, "Thống Soái": 80, "Trí Mưu": 65, "Ngoại Giao": 50 },
    talentIds: ["highborn-charm", "greenseer"],
    skills: { "war-riding": 6, "persuasion": 7, "deception": 7 },
    equipment: [{ slot: "Vũ Khí Phụ", ten: "Đàn Vĩ Cầm", phamChat: "Thường", thuocTinh: { "Tôn Trọng": 1 }, moTa: "Dụng cụ che giấu thân phận" }],
    items: [{ ten: "Quả trứng rồng", soLuong: 1, moTa: "Trứng rồng hóa thạch tuyệt đẹp" }],
    gold: 2000,
    startResources: {
      "Gỗ": 20,
      "Quặng Sắt": 10,
      "Đá": 20,
      "Lương Thực": 100,
      "Ngựa": 4,
      "Thép Valyria": 0
    }, startingHookIds: [],
    father: "daemon-blackfyre", mother: "rohanne-tyrosh",
    spouse: "",
    children: [],
    siblings: ["aegon-blackfyre", "aemon-blackfyre", "haegon-blackfyre", "aenys-blackfyre"],
    allies: ["bittersteel", "gormon-peake"],
    rivals: ["bloodraven-hand", "daeron-ii"],
    liege: "bittersteel",
    relationshipDetails: {
      "bittersteel": { type: "Bằng Hữu", trust: 90, affinity: 80, detail: "Aegor Rivers nuôi dưỡng Daemon từ nhỏ ở Essos, huấn luyện hắn thành chiến binh và đổ đầy hận thù với vương triều." },
      "bloodraven-hand": { type: "Kẻ Thù", trust: 0, affinity: 0, detail: "Bloodraven là Bàn Tay Nhà Vua — kẻ thù số một. Chính hắn đã bắt Daemon tại Whitewalls." },
      "gormon-peake": { type: "Đồng Minh", trust: 70, affinity: 60, detail: "Gormon Peake tổ chức giải đấu Whitewalls chỉ để tập hợp quân Blackfyre cho cuộc nổi dậy thứ hai." }
    },
    startArmies: [
          { name: "Lính Kích Rồng Đen", type: "Bộ Binh", size: 0, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Rồng Đen", type: "Cung Thủ", size: 0, quality: "Mới Lập Đội" }
        ],
    personalHooks: [
      { id: "daemon-whitewalls", title: "Giấc Mơ Trứng Rồng", year: "212 AC", numericYear: 212, desc: "Ngươi mơ thấy một con rồng nở từ quả trứng tại Whitewalls. Cuộc nổi dậy thứ hai đang nhen nhóm." }
    ],
      startRegions: [],
      startHoldings: [],
      holdingsLevel: {},
      baseIncome: 0
}
];
