// content/westeros/eras.ts
// ============================================================================
// DỮ LIỆU THỜI KỲ (Era — 8.2) + roster canon ĐỦ CHỈ SỐ theo schema 5.1f (8.4b).
// Thêm Era mới = thêm 1 entry, không đụng engine. Lore sâu do người dùng nạp
// qua lorebook riêng (non-goals) — seed chỉ đủ chạy demo.
// ============================================================================
import type { CoreStat } from "./skills";
import type { EquipGrant } from "./origins";
import type { DragonStat, DragonSize, CourtPosition } from "../../mvu/schema";
import { dawnAgeCharacters } from "./eras/dawnAge";
import { aegonConquestCharacters } from "./eras/aegonConquest";
import { danceOfDragonsCharacters } from "./eras/danceOfDragons";
import { blackfyreRebellionCharacters } from "./eras/blackfyreRebellion";
import { dunkAndEggCharacters } from "./eras/dunkAndEgg";
import { robertsRebellionCharacters } from "./eras/robertsRebellion";
import { warOfFiveKingsCharacters } from "./eras/warOfFiveKings";
import { windsOfWinterCharacters } from "./eras/windsOfWinter";


export interface StartingHook {
  id: string;
  title: string;
  year: string;
  desc: string;
  mode?: "Theo Sát Nguyên Tác" | "Diễn Giải Tự Do";
  /** Năm AC dạng số — nếu không có, parse từ `year` string. */
  numericYear?: number;
}

/** Trang bị canon — cho phép cả phẩm chất KHÔNG mua được lúc tạo (Thép Valyria/Vô Giá — 8.4b). */
export interface CanonEquipGrant {
  slot: EquipGrant["slot"];
  ten: string;
  phamChat: "Thô Kệch" | "Thường" | "Tinh Xảo" | "Thượng Hạng" | "Thép Valyria" | "Vô Giá";
  thuocTinh: Record<string, number>;
  dacTinh?: string[];
  moTa: string;
}

export interface CanonCharacter {
  id: string;
  name: string;
  tuocVi: string;
  /** schemaName của Nhà (khớp enum HOUSES trong schema). */
  house: string;
  role: string;
  religion: string;
  blurb: string;
  birthYear?: number;
  age: number;
  coreStats: Record<CoreStat, number>;
  năngLực?: {
    "Võ Lực": number;
    "Thống Soái": number;
    "Trí Mưu": number;
    "Ngoại Giao": number;
  };
  /** id thiên phú từ ngân hàng talents.ts. */
  talentIds: string[];
  /** {skillId: cấp}. */
  skills: Record<string, number>;
  equipment: CanonEquipGrant[];
  items: { ten: string; soLuong: number; moTa: string }[];
  gold: number;
  startingHookIds: string[];
  /** Hook riêng cho nhân vật (không phải hook chung của era). */
  personalHooks?: StartingHook[];
  /** Năm chết (AC) — dùng để giới hạn year slider. */
  deathYear?: number;
  /** Mã (seatId) các thành trì nhân vật cai trị ngay từ đầu (vd: "the-north-seat") */
  startHoldings?: string[];
  /** Mã (regionId) các vương quốc nhân vật kiểm soát vĩ mô (vd: "the-north") */
  startRegions?: string[];
  /** Quân đội thường trực (nếu có) đóng tại thành trì đầu tiên */
  startArmy?: { size: number; quality: "Tinh Nhuệ" | "Thành Thạo" | "Mới Lập Đội" | "Rời Rạc" };
  /** Quân đội tuỳ chỉnh chuẩn lore (nếu có) */
  startArmies?: { name: string; type: string; size: number; quality: "Tinh Nhuệ" | "Thành Thạo" | "Mới Lập Đội" | "Rời Rạc" }[];
  /** Hạm đội tuỳ chỉnh chuẩn lore (nếu có) */
  startFleets?: { name: string; type: string; size: number; quality: "Tinh Nhuệ" | "Thành Thạo" | "Mới Lập Đội" | "Rời Rạc" }[];
  /** Rồng canon — chỉ cho nhân vật sở hữu rồng thật (không phải trứng). */
  dragon?: {
    name: string;
    color: string;
    size: DragonSize;
    age: number;
    description: string;
    stats: Record<DragonStat, number>;
    skills: Record<string, number>;
  };
  /** Chức vụ trong triều đình (nếu có). */
  courtPosition?: CourtPosition;
  /** Lãnh chúa/Vua mà nhân vật này phục vụ (dùng id của CanonCharacter). */
  liege?: string;
  // ── LORE MỞ RỘNG (Gia phả, Kinh tế, Thành trì) ──
  father?: string;
  mother?: string;
  spouse?: string;
  children?: string[];
  siblings?: string[];
  allies?: string[];
  rivals?: string[];
  
  /** Thông tin chi tiết mô tả mạng lưới quan hệ (bổ sung cho các mảng ở trên) */
  relationshipDetails?: Record<string, { type?: string; detail: string; trust?: number; affinity?: number }>;
  
  /** Bí mật huyết thống thật sự (dùng cho các trường hợp như con cái của Cersei/Jaime hoặc Jon Snow) */
  secretBiologicalFather?: string;
  secretBiologicalMother?: string;

  /** Cấp độ thành trì ban đầu (VD: { "winterfell": 5 }) */
  holdingsLevel?: Record<string, number>;
  /** Thu nhập Vàng cơ bản mỗi turn */
  baseIncome?: number;
  /** Tài nguyên gia tộc ban đầu (Gỗ, Quặng Sắt, Lương Thực, Ngựa, Thép Valyria) */
  startResources?: Record<string, number>;
  /** Các khoản nợ ban đầu (VD: Nợ Iron Bank) */
  startDebts?: Record<string, { amount: number; interest: number; duration: number }>;
}

export interface EraData {
  id: string;
  name: string;
  yearRange: string;
  startYear: number;
  startSeason: "Xuân" | "Hạ" | "Thu" | "Đông";
  startLocation: string;
  blurb: string;
  /** id Nhà (houses.ts) đang tồn tại/có vai trò trong Era. */
  availableHouses: string[];
  /** Era có ma thuật/rồng — gate thiên phú + kỹ năng ma thuật (5.1f). */
  hasMagic: boolean;
  canonCharacters: CanonCharacter[];
  startingHooks: StartingHook[];
  /** Bối cảnh ẩn dành riêng cho AI hiểu rõ gia phả, mối quan hệ phức tạp theo đúng lore */
  loreNotes?: string;
}

export const ERAS: EraData[] = [
  // ──────────────────────────────────────────────────────────────
  {
    id: "long-night",
    name: "Đêm Trường",
    yearRange: "~8000 trước AC",
    startYear: -8000,
    startSeason: "Đông",
    startLocation: "Winterfell",
    blurb: "Mùa đông kéo dài một thế hệ. Bóng tối tràn ngập từ cực Bắc — kèm theo lũ Others và đội quân người chết. Loài người chỉ còn một cách: đứng lên, hoặc diệt vong.",
    availableHouses: ["stark"],
    hasMagic: true,
    canonCharacters: [
      ...dawnAgeCharacters,
      {
        id: "last-hero", name: "Anh Hùng Cuối Cùng", house: "Stark", role: "Kẻ Tìm Kiếm", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Người đàn ông cầm kiếm đi vào bóng tối — một mình, với mười hai người bạn, một con chó, và một thanh kiếm. Tất cả sẽ chết, trừ ông.",
        birthYear: -8035, age: 35, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 13, "Thể Chất": 16, "Trí Tuệ": 11, "Tinh Tường": 14, "Uy Tín": 13 },
        talentIds: ["warrior-blood", "lord-of-north"],
        skills: { "sword-shield": 7, "weather-endurance": 8, "hunting": 6, "command": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm sắt cổ", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 4 }, moTa: "Kiếm rèn bởi thợ Người Đầu Tiên" },
          { slot: "Khiên", ten: "Áo lông gấu", phamChat: "Thường", thuocTinh: { "Chống Chịu": 4 }, moTa: "Chống đại hàn" },
        ],
        items: [{ ten: "Đuốc dragonglass", soLuong: 3, moTa: "Vũ khí duy nhất giết được Others" }],
        gold: 50, startHoldings: [],
        startRegions: [],
        startingHookIds: ["darkness-falls", "seek-the-children"],
        allies: ["leaf-cotf"],
        rivals: ["night-king"],
      },
      {
        id: "brandon-builder", name: "Brandon Người Xây", house: "Stark", role: "Kiến Trúc Sư Huyền Thoại", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Người đã xây Winterfell và Bức Tường — hay ít nhất, truyền thuyết kể như vậy. Sự thật có lẽ kỳ lạ hơn.",
        birthYear: -8040, age: 40, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 10, "Thể Chất": 14, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 16 },
        talentIds: ["learned", "commander-instinct"],
        skills: { "command": 8, "lore": 7, "court-etiquette": 4, "weather-endurance": 5 },
        equipment: [],
        items: [{ ten: "Bản thiết kế Bức Tường", soLuong: 1, moTa: "Phác thảo công trình chặn Others" }],
        gold: 200, startHoldings: ["the-north-seat"],
        startRegions: ["the-north"],
        startArmies: [
          { name: "Cấm Vệ Sói Băng", type: "Bộ Binh", size: 350, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startingHookIds: ["build-the-wall"],
        allies: ["last-hero", "leaf-cotf"],
      },
      {
        id: "night-king", name: "Dạ Vương", house: "Khác", role: "Thủ Lĩnh Bóng Trắng", tuocVi: "Thường Dân", religion: "Cựu Thần",
        blurb: "Kẻ mang cái lạnh vĩnh cửu. Không ai biết hắn đến từ đâu, chỉ biết khi hắn xuất hiện, ánh sáng tắt lịm.",
        birthYear: -8500, age: 500, coreStats: { "Sức Mạnh": 18, "Nhanh Nhẹn": 14, "Thể Chất": 20, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 18 },
        talentIds: ["learned", "commander-instinct"],
        skills: { "sword-shield": 10, "command": 10, "weather-endurance": 10, "lore": 8 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm băng", phamChat: "Vô Giá", thuocTinh: { "Sát Thương Cận": 10 }, dacTinh: ["phép thuật"], moTa: "Thanh kiếm làm từ băng ma thuật, đánh vỡ thép thường" },
        ],
        items: [],
        gold: 0, startingHookIds: ["march-of-the-dead"],
        rivals: ["last-hero", "leaf-cotf", "brandon-builder"],
      },
      {
        id: "leaf-cotf", name: "Lá", house: "Trẻ Con Rừng", role: "Lục Tiên Ký", tuocVi: "Thường Dân", religion: "Cựu Thần",
        blurb: "Một trong những Trẻ Con Rừng cuối cùng, mang sức mạnh của cây cối và đất đai để chống lại bóng tối.",
        birthYear: -8200, age: 200, coreStats: { "Sức Mạnh": 5, "Nhanh Nhẹn": 16, "Thể Chất": 8, "Trí Tuệ": 16, "Tinh Tường": 18, "Uy Tín": 12 },
        talentIds: ["learned"],
        skills: { "lore": 9, "stealth": 8, "hunting": 7, "medicine": 8 },
        equipment: [],
        items: [{ ten: "Đuốc dragonglass", soLuong: 5, moTa: "Lưỡi dao rèn từ đá vỏ chai" }],
        gold: 0, startingHookIds: ["seek-the-children"],
        allies: ["last-hero", "brandon-builder"],
        rivals: ["night-king"],
      },
    ],
    startingHooks: [
      { id: "darkness-falls", title: "Bóng Tối Buông Xuống", year: "~8000 BC", desc: "Mùa đông đã kéo dài hơn bất kỳ ai còn nhớ. Tuyết phủ tới nóc nhà, đêm không bao giờ tàn. Từ cực Bắc, những bóng mắt xanh đang tiến lại." },
      { id: "seek-the-children", title: "Tìm Kiếm Trẻ Con Rừng", year: "~8000 BC", desc: "Truyền thuyết kể rằng Trẻ Con Rừng biết cách chống Others. Ngươi phải tìm họ — xuyên qua mùa đông, xuyên qua bầy người chết." },
      { id: "build-the-wall", title: "Xây Bức Tường", year: "~8000 BC", desc: "Others đã bị đẩy lùi — nhưng chúng sẽ quay lại. Phải dựng một bức tường khổng lồ bằng băng và ma thuật, từ biển đến biển, để ngăn chúng mãi mãi." },
      { id: "march-of-the-dead", title: "Cuộc Hành Quân Của Người Chết", year: "~8000 BC", desc: "Ngươi thức tỉnh trong băng giá vĩnh cửu. Loài người mềm yếu, nóng bỏng và đầy tội lỗi. Đã đến lúc mang sự tĩnh lặng bao trùm thế giới." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "aegon-conquest",
    name: "Cuộc Chinh Phạt Của Aegon",
    yearRange: "2 BC – 1 AC",
    startYear: 1,
    startSeason: "Hạ",
    startLocation: "Dragonstone",
    blurb: "Ba con rồng đổ bộ lên bờ Westeros. Bảy Vương Quốc còn là bảy vương quốc thật — và Aegon Targaryen định biến chúng thành một.",
    availableHouses: ["targaryen", "stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell", "arryn", "tully"],
    hasMagic: true,
    loreNotes: "Gia phả Nhà Targaryen: Aegon là em trai của Visenya và anh trai của Rhaenys. Aegon cưới cả hai chị em của mình. Orys Baratheon được đồn là anh em cùng cha khác mẹ của Aegon. Harren Hoare là vị vua tàn bạo của Vùng Sông và Đảo Sắt. Các thành viên Nhà Targaryen rất gắn kết nhưng cũng có sự cạnh tranh ngầm giữa Visenya và Rhaenys.",
    canonCharacters: [
      ...aegonConquestCharacters,
      {
        id: "aegon-targaryen", name: "Aegon Targaryen", house: "Targaryen", role: "Kẻ Chinh Phạt", tuocVi: "Vua Bảy Vương Quốc", religion: "Thất Diện Thần",
        blurb: "Chúa rồng của Dragonstone, người cưỡi Balerion Hắc Vong — kẻ sắp bẻ cong cả lục địa.",
        birthYear: -26, age: 27, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 17 },
        talentIds: ["dragon-blood", "commander-instinct"],
        skills: { "sword-shield": 7, "command": 8, "war-riding": 5, "court-etiquette": 4 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Blackfyre", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Bảo kiếm thép Valyria của dòng Targaryen" },
          { slot: "Giáp Thân", ten: "Giáp vảy đen", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp rèn kiểu Valyria" },
        ],
        items: [],
        gold: 8000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Vệ Binh Rồng", type: "Bộ Binh", size: 960, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 240, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 8, quality: "Tinh Nhuệ" }
        ],
        holdingsLevel: { "dragonstone": 5 },
        baseIncome: 500,
        father: "aerion-targaryen",
        mother: "valaena-velaryon",
        spouse: "visenya-targaryen",
        siblings: ["visenya-targaryen", "rhaenys-targaryen", "orys-baratheon"],
        allies: ["rhaenys-targaryen", "orys-baratheon"],
        rivals: ["harren-the-black", "argilac-durrandon", "mern-ix-gardener"],
        startingHookIds: ["landing-at-blackwater", "council-of-conquest"],
        dragon: {
          name: "Balerion", color: "Đen", size: "Khổng Lồ (Balerion-class)",
          age: 114, description: "Hắc Vong — con rồng lớn nhất từng bay. Bóng của nó che tối cả thành phố, lửa đen đủ nung chảy thép.",
          stats: { "Sức Lửa": 20, "Sức Bay": 14, "Giáp Vảy": 20, "Hung Dữ": 18, "Trung Thành": 16 },
          skills: { "Phun Lửa": 10, "Bổ Nhào": 8, "Gầm Hống": 9, "Chiến Đấu Trên Không": 7, "Lượn Gió": 6 },
        },
      },
      {
        id: "visenya-targaryen", name: "Visenya Targaryen", house: "Targaryen", role: "Nữ Vương Chiến Binh", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Chị cả cưỡi Vhagar — thanh Dark Sister trong tay, sắc như lời nói của bà.",
        birthYear: -28, age: 29, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 15, "Thể Chất": 13, "Trí Tuệ": 14, "Tinh Tường": 15, "Uy Tín": 14 },
        talentIds: ["dragon-blood", "duelist"],
        skills: { "sword-shield": 8, "dual-wield": 6, "command": 6, "cunning": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Dark Sister", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 7 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Kiếm mảnh thép Valyria — dành cho tay kiếm thực thụ" },
        ],
        items: [],
        gold: 5000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 600, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Tinh Nhuệ" }
        ],
        holdingsLevel: { "dragonstone": 5 },
        baseIncome: 400,
        father: "aerion-targaryen",
        mother: "valaena-velaryon",
        spouse: "aegon-targaryen",
        siblings: ["aegon-targaryen", "rhaenys-targaryen", "orys-baratheon"],
        allies: ["orys-baratheon"],
        startingHookIds: ["landing-at-blackwater"],
        dragon: {
          name: "Vhagar", color: "Đồng", size: "Trưởng Thành",
          age: 52, description: "Chiến long dữ dằn — nhỏ hơn Balerion nhưng hung hãn hơn. Lửa của Vhagar nung chảy cổng thành Harrenhal.",
          stats: { "Sức Lửa": 17, "Sức Bay": 15, "Giáp Vảy": 15, "Hung Dữ": 18, "Trung Thành": 14 },
          skills: { "Phun Lửa": 9, "Chiến Đấu Trên Không": 8, "Bổ Nhào": 7, "Gầm Hống": 7, "Lượn Gió": 6 },
        },
      },
      {
        id: "rhaenys-targaryen", name: "Rhaenys Targaryen", house: "Targaryen", role: "Nữ Vương Tự Do", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Em út cưỡi Meraxes — yêu thơ ca, bay nhanh hơn gió, và không sợ gì cả.",
        birthYear: -24, age: 25, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 15, "Thể Chất": 11, "Trí Tuệ": 13, "Tinh Tường": 14, "Uy Tín": 16 },
        talentIds: ["dragon-blood", "silver-tongue"],
        skills: { "war-riding": 6, "persuasion": 6, "court-etiquette": 5, "languages": 4 },
        equipment: [],
        items: [],
        gold: 5000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 600, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Tinh Nhuệ" }
        ],
        holdingsLevel: { "dragonstone": 5 },
        baseIncome: 400,
        father: "aerion-targaryen",
        mother: "valaena-velaryon",
        spouse: "aegon-targaryen",
        siblings: ["aegon-targaryen", "visenya-targaryen", "orys-baratheon"],
        allies: ["orys-baratheon"],
        startingHookIds: ["landing-at-blackwater", "council-of-conquest"],
        dragon: {
          name: "Meraxes", color: "Bạc", size: "Trưởng Thành",
          age: 52, description: "Nhanh nhất trong ba con rồng — vảy bạc lấp lánh, bay như mũi tên. Sẽ ngã xuống Dorne.",
          stats: { "Sức Lửa": 14, "Sức Bay": 19, "Giáp Vảy": 13, "Hung Dữ": 12, "Trung Thành": 16 },
          skills: { "Lượn Gió": 9, "Bổ Nhào": 8, "Phun Lửa": 7, "Chiến Đấu Trên Không": 6, "Gầm Hống": 5 },
        },
      },
      {
        id: "orys-baratheon", name: "Orys Baratheon", house: "Baratheon", role: "Cánh Tay Trái", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Bạn thân, và là người anh em cùng cha khác mẹ tin đồn của Aegon. Một chiến binh hung bạo và tướng quân trung thành.",
        birthYear: -2, age: 29, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 11, "Thể Chất": 15, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 13 },
        talentIds: ["warrior-blood", "commander-instinct"],
        skills: { "axe-mace": 8, "command": 7, "brawling": 6, "war-riding": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Búa chiến", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Vũ khí hạng nặng" },
          { slot: "Giáp Thân", ten: "Giáp tấm thép", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp tốt của tướng quân" },
        ],
        items: [],
        gold: 1500, startHoldings: [],
        startRegions: [],
        startArmies: [
          { name: "Đội Tiên Phong Búa Sét", type: "Bộ Binh", size: 300, quality: "Thành Thạo" },
          { name: "Đội Nỏ Vùng Bão", type: "Cung Thủ", size: 75, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 2, quality: "Thành Thạo" }
        ],
        father: "aerion-targaryen",
        siblings: ["aegon-targaryen", "visenya-targaryen", "rhaenys-targaryen"],
        allies: ["aegon-targaryen"],
        startingHookIds: ["council-of-conquest"],
        courtPosition: "Bàn Tay Nhà Vua",
        liege: "aegon-targaryen",
      },
      {
        id: "harren-the-black", name: "Harren Hoare", house: "Hoare", role: "Vua Quần Đảo Và Các Dòng Sông", tuocVi: "Vua", religion: "Thần Chết Chìm",
        blurb: "Harren Đen — bạo chúa tàn nhẫn vừa hoàn thành lâu đài khổng lồ nhất lịch sử, tin rằng đá có thể cản được rồng.",
        birthYear: -60, age: 87, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 8, "Thể Chất": 11, "Trí Tuệ": 10, "Tinh Tường": 12, "Uy Tín": 16 },
        talentIds: ["hot-tempered", "lord-of-north"],
        skills: { "command": 8, "intimidation": 9, "sword-shield": 5 },
        equipment: [],
        items: [{ ten: "Vàng bóc lột", soLuong: 100, moTa: "Của cải lấy từ Riverlands" }],
        gold: 15000, startHoldings: ["harrenhal"],
        startRegions: ["the-riverlands","the-iron-islands"],
        startArmies: [
          { name: "Bộ Binh Lãnh Địa", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Địa Phương", type: "Kỵ Binh", size: 3000, quality: "Thành Thạo" },
          { name: "Cung Thủ Địa Phương", type: "Cung Thủ", size: 3000, quality: "Thành Thạo" }
        ],
        holdingsLevel: { "harrenhal": 5 },
        baseIncome: 600,
        children: ["hoare-son-harren"],
        rivals: ["aegon-targaryen", "edmyn-tully"],
        startingHookIds: ["harrenhal-defiance"],
      },
      {
        id: "torrhen-stark", name: "Torrhen Stark", house: "Stark", role: "Vua Phương Bắc", tuocVi: "Vua", religion: "Cựu Thần",
        blurb: "Torrhen Stark, người sẽ mang danh 'Vua Quỳ Gối' để cứu hàng vạn lính Bắc khỏi lửa rồng.",
        birthYear: -30, age: 57, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 11, "Thể Chất": 14, "Trí Tuệ": 14, "Tinh Tường": 15, "Uy Tín": 15 },
        talentIds: ["lord-of-north", "beloved"],
        skills: { "command": 8, "lore": 6, "weather-endurance": 7, "sword-shield": 6 },
        equipment: [],
        items: [{ ten: "Vương miện mùa đông", soLuong: 1, moTa: "Sắp phải giao nộp" }],
        gold: 4000, startHoldings: ["the-north-seat"],
        startRegions: ["the-north"],
        startArmies: [
          { name: "Quân Đoàn Rừng Sói", type: "Bộ Binh", size: 18000, quality: "Mới Lập Đội" },
          { name: "Kỵ Binh Tiên Phong Phương Bắc", type: "Kỵ Binh", size: 6000, quality: "Mới Lập Đội" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 6000, quality: "Mới Lập Đội" }
        ],
        holdingsLevel: { "the-north-seat": 5 },
        baseIncome: 300,
        siblings: ["brandon-snow"],
        children: ["stark-son-torrhen"],
        allies: ["brandon-snow"],
        startingHookIds: ["march-south"],
      },
      {
        id: "argilac-durrandon", name: "Argilac Kiêu Ngạo", house: "Durrandon", role: "Vua Bão", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Vua Bão cuối cùng, kiêu ngạo đến mức chặt tay sứ giả của Aegon. Già nhưng vẫn vô cùng nguy hiểm.",
        birthYear: -50, age: 77, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 9, "Thể Chất": 12, "Trí Tuệ": 11, "Tinh Tường": 13, "Uy Tín": 14 },
        talentIds: ["warrior-blood", "hot-tempered"],
        skills: { "sword-shield": 8, "command": 7, "intimidation": 7 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm Vua Bão", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Kiếm của gia tộc Durrandon" },
        ],
        items: [],
        gold: 6000, startHoldings: ["the-stormlands-seat"],
        startRegions: ["the-stormlands"],
        startArmies: [
          { name: "Vệ Binh Nhà Gia Chuẩn", type: "Bộ Binh", size: 7200, quality: "Thành Thạo" },
          { name: "Kỵ Binh Địa Phương", type: "Kỵ Binh", size: 2400, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nông Dân", type: "Cung Thủ", size: 2400, quality: "Thành Thạo" }
        ],
        holdingsLevel: { "the-stormlands-seat": 5 },
        baseIncome: 350,
        children: ["argella-durrandon"],
        rivals: ["orys-baratheon", "aegon-targaryen"],
        startingHookIds: ["storm-king-defiance"],
      },
    ],
    startingHooks: [
      { id: "landing-at-blackwater", title: "Đổ Bộ Cửa Sông Blackwater", year: "1 AC", numericYear: 1, desc: "Hạm đội Targaryen vừa cập bờ nơi cửa sông Blackwater. Ba con rồng lượn trên trời. Các vua Westeros bắt đầu tập hợp quân." },
      { id: "council-of-conquest", title: "Hội Nghị Trước Chinh Phạt", year: "2 BC", numericYear: -2, desc: "Trên bàn đá Dragonstone, tấm bản đồ Westeros trải rộng. Phải quyết: đánh đâu trước, dụ ai hàng, đốt ai làm gương." },
      { id: "harrenhal-defiance", title: "Cố Thủ Harrenhal", year: "1 AC", numericYear: 1, desc: "Bọn nhãi ranh Targaryen đòi ngươi quỳ gối. Nhưng ngươi có Harrenhal - pháo đài bằng đá đen kiên cố nhất thế giới. Đá không cháy, ngươi tự nhủ." },
      { id: "march-south", title: "Nam Tiến Lục Địch", year: "1 AC", numericYear: 1, desc: "Ba vạn quân phương Bắc đang rầm rập tiến qua Neck. Ngươi định nghiền nát bọn ngoại bang Targaryen, cho đến khi thấy ba con rồng bay lượn ở phương trời nam." },
      { id: "storm-king-defiance", title: "Sự Kiêu Ngạo Của Vua Bão", year: "1 AC", numericYear: 1, desc: "Một gã con hoang được Aegon cử đến đòi lấy con gái ngươi. Ngươi đã chặt tay hắn và gửi trả về. Giờ Orys Baratheon đang dẫn quân tới Storm's End." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "dance-of-dragons",
    name: "Vũ Điệu Rồng",
    yearRange: "105 – 131 AC",
    startYear: 105,
    startSeason: "Hạ",
    startLocation: "Dragonstone",
    blurb: "Vua Viserys I chết. Hai phe Targaryen tranh ngôi — Đen và Xanh. Rồng chiến rồng trên bầu trời Westeros, và khi tàn cuộc, giống rồng gần như tuyệt diệt.",
    availableHouses: ["targaryen", "velaryon", "stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell", "arryn", "tully"],
    hasMagic: true,
    canonCharacters: [
      ...danceOfDragonsCharacters,
      {
        id: "rhaenyra-targaryen", name: "Rhaenyra Targaryen", house: "Targaryen", role: "Nữ Vương Đen", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Con gái trưởng của Viserys I, được cha chọn làm người kế vị — nhưng dì ghẻ và em cùng cha khác mẹ nghĩ khác.",
        birthYear: 97, age: 33, coreStats: { "Sức Mạnh": 8, "Nhanh Nhẹn": 10, "Thể Chất": 11, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 16 },
        talentIds: ["dragon-blood", "highborn-charm"],
        skills: { "command": 6, "court-etiquette": 7, "persuasion": 6, "war-riding": 5 },
        equipment: [],
        items: [],
        gold: 6000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 1200, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 300, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 10, quality: "Thành Thạo" }
        ],
        startingHookIds: ["throne-stolen", "black-council"],
        father: "viserys-i-targaryen", mother: "aemma-arryn",
        spouse: "daemon-targaryen",
        children: ["jacaerys-velaryon", "lucerys-velaryon", "joffrey-velaryon", "aegon-iii", "viserys-ii-targaryen"],
        siblings: ["aegon-ii", "helaena-targaryen", "aemond-targaryen", "daeron-targaryen"],
        allies: ["daemon-targaryen", "corlys-velaryon", "jacaerys-velaryon"],
        rivals: ["aegon-ii", "alicent-hightower"],
        dragon: {
          name: "Syrax", color: "Vàng", size: "Trưởng Thành",
          age: 20, description: "Rồng cái vàng của Rhaenyra — trung thành và dữ dằn. Được đặt tên theo nữ thần Valyria cổ.",
          stats: { "Sức Lửa": 14, "Sức Bay": 13, "Giáp Vảy": 12, "Hung Dữ": 13, "Trung Thành": 17 },
          skills: { "Phun Lửa": 7, "Lượn Gió": 6, "Gầm Hống": 6, "Bổ Nhào": 5, "Chiến Đấu Trên Không": 4 },
        },
      },
      {
        id: "daemon-targaryen", name: "Daemon Targaryen", house: "Targaryen", role: "Hoàng Tử Lưu Manh", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Em trai vua, tay kiếm cự phách, cưỡi Caraxes — người đàn ông nguy hiểm nhất Westeros, và cũng là phu quân của Rhaenyra.",
        birthYear: 81, age: 49, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 15, "Thể Chất": 13, "Trí Tuệ": 13, "Tinh Tường": 14, "Uy Tín": 15 },
        talentIds: ["dragon-blood", "duelist", "hot-tempered"],
        skills: { "sword-shield": 9, "war-riding": 7, "command": 7, "cunning": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Dark Sister", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 7 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Kiếm mảnh Valyria — giờ thuộc về Daemon" },
          { slot: "Giáp Thân", ten: "Giáp đen Targaryen", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp hoàng tộc đen tuyền" },
        ],
        items: [],
        gold: 5000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Lính Kích Đỉnh Aegon", type: "Bộ Binh", size: 600, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["black-council"],
        father: "baelon-targaryen", mother: "alyssa-targaryen",
        spouse: "rhaenyra-targaryen",
        children: ["baela-targaryen", "rhaena-targaryen", "aegon-iii", "viserys-ii-targaryen"],
        siblings: ["viserys-i-targaryen"],
        allies: ["rhaenyra-targaryen", "corlys-velaryon", "mysaria"],
        rivals: ["otto-hightower", "aemond-targaryen"],
        dragon: {
          name: "Caraxes", color: "Đỏ", size: "Trưởng Thành",
          age: 55, description: "Sâu Máu — gầy, dài, đỏ như máu. Nhanh và hung hãn bất thường. Đã chiến đấu vô số trận.",
          stats: { "Sức Lửa": 16, "Sức Bay": 17, "Giáp Vảy": 11, "Hung Dữ": 19, "Trung Thành": 15 },
          skills: { "Chiến Đấu Trên Không": 10, "Phun Lửa": 8, "Bổ Nhào": 8, "Gầm Hống": 7, "Lượn Gió": 7 },
        },
      },
      {
        id: "aegon-ii", name: "Aegon II Targaryen", house: "Targaryen", role: "Vua Xanh", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Con trai thứ của Viserys, được mẹ Alicent và Otto Hightower đẩy lên ngôi — mặc di nguyện của cha.",
        birthYear: 107, age: 23, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 11, "Thể Chất": 12, "Trí Tuệ": 10, "Tinh Tường": 10, "Uy Tín": 14 },
        talentIds: ["dragon-blood", "hot-tempered"],
        skills: { "sword-shield": 5, "war-riding": 5, "court-etiquette": 4, "command": 4 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Blackfyre", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Kiếm vua — biểu tượng chính thống" },
        ],
        items: [],
        gold: 7000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands"],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 2400, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 20, quality: "Thành Thạo" }
        ],
        startingHookIds: ["green-coronation"],
        father: "viserys-i-targaryen", mother: "alicent-hightower",
        spouse: "helaena-targaryen",
        children: ["jaehaerys-targaryen", "jaehaera-targaryen", "maelour-targaryen"],
        siblings: ["rhaenyra-targaryen", "helaena-targaryen", "aemond-targaryen", "daeron-targaryen"],
        allies: ["alicent-hightower", "criston-cole", "aemond-targaryen"],
        rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
        dragon: {
          name: "Sunfyre", color: "Vàng Kem", size: "Trưởng Thành",
          age: 18, description: "Ánh Dương — con rồng đẹp nhất từng bay. Vảy vàng rực rỡ, cánh như bình minh. Nhưng đẹp không có nghĩa là yếu.",
          stats: { "Sức Lửa": 15, "Sức Bay": 14, "Giáp Vảy": 13, "Hung Dữ": 14, "Trung Thành": 18 },
          skills: { "Phun Lửa": 7, "Lượn Gió": 7, "Chiến Đấu Trên Không": 6, "Bổ Nhào": 5, "Gầm Hống": 5 },
        },
      },
      {
        id: "aemond-targaryen", name: "Aemond Targaryen", house: "Targaryen", role: "Hiệp Sĩ Một Mắt", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
        blurb: "Con trai thứ hai của Alicent. Đã mất một con mắt để đổi lấy Vhagar — con rồng lớn nhất thế giới còn sống.",
        birthYear: 110, age: 20, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 14, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 10, "Uy Tín": 11 },
        talentIds: ["dragon-blood", "warrior-blood", "hot-tempered"],
        skills: { "sword-shield": 8, "war-riding": 6, "command": 6, "intimidation": 7 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm thép dài", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Kiếm tốt rèn cho hoàng tử" },
        ],
        items: [],
        gold: 3000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 1200, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 300, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 10, quality: "Thành Thạo" }
        ],
        startingHookIds: ["green-coronation"],
        father: "viserys-i-targaryen", mother: "alicent-hightower",
        spouse: "alys-rivers",
        siblings: ["rhaenyra-targaryen", "aegon-ii", "helaena-targaryen", "daeron-targaryen"],
        allies: ["aegon-ii", "criston-cole", "alys-rivers"],
        rivals: ["lucerys-velaryon", "daemon-targaryen"],
        dragon: {
          name: "Vhagar", color: "Đồng", size: "Khổng Lồ (Balerion-class)",
          age: 181, description: "Con rồng già cỗi và lớn nhất còn sót lại từ thời Aegon Chinh Phạt. Một ngọn núi có cánh.",
          stats: { "Sức Lửa": 20, "Sức Bay": 10, "Giáp Vảy": 20, "Hung Dữ": 19, "Trung Thành": 14 },
          skills: { "Phun Lửa": 10, "Bổ Nhào": 8, "Gầm Hống": 9, "Chiến Đấu Trên Không": 8, "Lượn Gió": 4 },
        },
      },
      {
        id: "corlys-velaryon", name: "Corlys Velaryon", house: "Velaryon", role: "Rắn Biển", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
        blurb: "Chúa tể biển khơi, người giàu nhất Westeros, chỉ huy hạm đội khổng lồ nhất lịch sử lục địa.",
        birthYear: 53, age: 77, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 9, "Thể Chất": 13, "Trí Tuệ": 16, "Tinh Tường": 16, "Uy Tín": 17 },
        talentIds: ["learned", "beloved"],
        skills: { "command": 9, "sailing": 10, "commerce": 9, "lore": 7 },
        equipment: [
          { slot: "Giáp Thân", ten: "Áo choàng nhung biển", phamChat: "Thượng Hạng", thuocTinh: { "Chống Chịu": 3 }, moTa: "Trang phục đắt tiền của Rắn Biển" },
        ],
        items: [{ ten: "Vàng Velaryon", soLuong: 50000, moTa: "Tài sản kết xù từ những chuyến hải hành viễn đông" }],
        gold: 50000, startHoldings: ["driftmark"],
        startRegions: [],
        startArmies: [
          { name: "Dân Binh Địa Phương", type: "Bộ Binh", size: 3000, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Nông Dân", type: "Cung Thủ", size: 750, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Driftmark", type: "Chiến Thuyền Nặng", size: 25, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["black-council"],
        spouse: "rhaenys-targaryen",
        children: ["laenor-velaryon", "laena-velaryon"],
        allies: ["rhaenyra-targaryen", "rhaenys-targaryen"],
      },
      {
        id: "criston-cole", name: "Criston Cole", house: "Cole", role: "Người Tạo Vua", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Tư lệnh Vệ Vương, từng là hiệp sĩ được Rhaenyra ưu ái nhất — giờ là kẻ thù nguy hiểm nhất của nàng.",
        birthYear: 82, age: 48, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 15, "Thể Chất": 15, "Trí Tuệ": 11, "Tinh Tường": 13, "Uy Tín": 12 },
        talentIds: ["duelist", "warrior-blood"],
        skills: { "sword-shield": 9, "axe-mace": 8, "command": 7, "court-etiquette": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Chuỗi chùy tinh xảo", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Vũ khí đã đánh gãy xương bao kẻ thách thức" },
          { slot: "Giáp Thân", ten: "Giáp Trắng Vệ Vương", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp thép nạm vàng trắng" },
        ],
        items: [],
        gold: 200, startArmies: [
          { name: "Dân Binh Địa Phương", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Kỵ Sĩ Nhánh Trưởng", type: "Kỵ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nông Dân", type: "Cung Thủ", size: 600, quality: "Thành Thạo" }
        ],
        startRegions: [],
        startingHookIds: ["green-coronation"],
        allies: ["alicent-hightower", "aegon-ii", "aemond-targaryen"],
        rivals: ["rhaenyra-targaryen", "harwin-strong"],
      },
      {
        id: "alicent-hightower", name: "Alicent Hightower", house: "Hightower", role: "Thái Hậu Xanh", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
        blurb: "Con gái Cánh Tay Phải, vợ thứ của Viserys. Nàng thề sẽ đưa huyết mạch mình lên ngai vàng bằng mọi giá.",
        birthYear: 88, age: 42, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 15, "Tinh Tường": 16, "Uy Tín": 15 },
        talentIds: ["silver-tongue", "highborn-charm"],
        skills: { "court-etiquette": 9, "persuasion": 8, "cunning": 7, "medicine": 5 },
        equipment: [],
        items: [{ ten: "Dấu ấn Hightower", soLuong: 1, moTa: "Biểu tượng quyền lực gia tộc Hightower" }],
        gold: 4000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startingHookIds: ["green-coronation"],
        father: "otto-hightower",
        spouse: "viserys-i-targaryen",
        children: ["aegon-ii", "helaena-targaryen", "aemond-targaryen", "daeron-targaryen"],
        allies: ["otto-hightower", "criston-cole", "larys-strong"],
        rivals: ["rhaenyra-targaryen", "daemon-targaryen"],
      },
    ],
    startingHooks: [
      { id: "heir-proclaimed", title: "Người Thừa Kế Được Công Bố", year: "105 AC", numericYear: 105, desc: "Vua Viserys I công bố Rhaenyra là người thừa kế Ngai Sắt — phá vỡ tiền lệ truyền ngôi cho nam. Triều đình chia rẽ, phe cánh bắt đầu hình thành trong bóng tối." },
      { id: "green-queen-rises", title: "Vương Hậu Mới Bước Lên", year: "109 AC", numericYear: 109, desc: "Viserys I cưới Alicent Hightower. Nàng sinh con trai — Aegon. Otto Hightower thì thầm rằng vương miện phải thuộc về con trai, không phải con gái. Cuộc đấu tranh bắt đầu." },
      { id: "throne-stolen", title: "Ngai Vàng Bị Cướp", year: "129 AC", numericYear: 129, desc: "Vua Viserys vừa qua đời. Alicent Hightower giấu tin, và Otto Hightower đã đội vương miện cho Aegon II trước khi ngươi kịp biết cha mình đã chết." },
      { id: "black-council", title: "Hội Đồng Đen Tại Dragonstone", year: "129 AC", numericYear: 129, desc: "Tin dữ truyền tới Dragonstone: ngôi vị đã bị cướp. Ngươi phải lập hội đồng chiến tranh — chọn đồng minh, điều rồng, và phản công." },
      { id: "green-coronation", title: "Đăng Quang Vội Vàng", year: "129 AC", numericYear: 129, desc: "Vương miện trên đầu ngươi chưa ấm chỗ, và chị gái cùng cha đã tuyên bố chiến tranh. Cả vương quốc phải chọn phe." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "blackfyre-rebellion",
    name: "Loạn Blackfyre",
    yearRange: "195 – 196 AC",
    startYear: 195,
    startSeason: "Hạ",
    startLocation: "King's Landing",
    blurb: "Daemon Blackfyre — con hoang được hợp pháp hoá của Aegon IV — nổi dậy chống Daeron II với thanh kiếm Blackfyre trong tay. Dòng máu rồng lại một lần nữa tự xé chính mình.",
    availableHouses: ["targaryen", "blackfyre", "stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell", "arryn", "tully"],
    hasMagic: false,
    canonCharacters: [
      ...blackfyreRebellionCharacters,
      {
        id: "daemon-blackfyre", name: "Daemon Blackfyre", house: "Blackfyre", role: "Rồng Đen Nổi Loạn", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
        blurb: "Đẹp trai, tay kiếm xuất chúng, cầm thanh kiếm Blackfyre do chính vua cha ban — và tin rằng mình mới là vua thật.",
        birthYear: 170, age: 25, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 14, "Thể Chất": 15, "Trí Tuệ": 11, "Tinh Tường": 11, "Uy Tín": 16 },
        talentIds: ["warrior-blood", "born-swordsman", "beloved"],
        skills: { "sword-shield": 9, "war-riding": 7, "command": 7, "court-etiquette": 3 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Blackfyre", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Bảo kiếm Valyria — biểu tượng vương quyền mà cha trao cho con hoang" },
          { slot: "Giáp Thân", ten: "Giáp đen đỏ", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp chiến mang huy hiệu rồng đen đỏ" },
        ],
        items: [],
        gold: 4000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Dân Binh Địa Phương", type: "Bộ Binh", size: 6000, quality: "Tinh Nhuệ" },
          { name: "Kỵ Binh Địa Phương", type: "Kỵ Binh", size: 2000, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Địa Phương", type: "Cung Thủ", size: 2000, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["black-banner-rises"],
        father: "aegon-iv-targaryen", mother: "daena-targaryen",
        spouse: "rohanne-tyrosh",
        children: ["aegon-blackfyre", "aemon-blackfyre", "daemon-ii-blackfyre", "haegon-blackfyre", "aenys-blackfyre"],
        siblings: ["daeron-ii", "bloodraven", "bittersteel", "shiera-seastar"],
        allies: ["bittersteel", "quentyn-ball"],
        rivals: ["daeron-ii", "bloodraven", "baelor-breakspear"],
      },
      {
        id: "daeron-ii", name: "Daeron II Targaryen", house: "Targaryen", role: "Vua Hiền", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Daeron Hiền Vương — ông kết nạp Dorne bằng hôn nhân thay vì chiến tranh, nhưng giờ đối mặt với sự phản bội từ dòng máu của chính mình.",
        birthYear: 153, age: 42, coreStats: { "Sức Mạnh": 9, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 15 },
        talentIds: ["learned", "silver-tongue"],
        skills: { "persuasion": 7, "court-etiquette": 8, "lore": 7, "command": 5 },
        equipment: [],
        items: [{ ten: "Vương miện Targaryen", soLuong: 1, moTa: "Vương miện vàng Valyria" }],
        gold: 8000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands","the-north","the-vale","the-westerlands","the-reach","the-stormlands","dorne","the-riverlands","the-iron-islands"],
        startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 12000, quality: "Thành Thạo" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 3000, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 100, quality: "Thành Thạo" }
        ],
        startingHookIds: ["bastard-rebellion"],
        father: "aegon-iv-targaryen", mother: "naerys-targaryen",
        spouse: "myriah-martell",
        children: ["baelor-breakspear", "aerys-i-targaryen", "rhaegel-targaryen", "maekar-i-targaryen"],
        siblings: ["daemon-blackfyre", "bloodraven", "bittersteel"],
        allies: ["baelor-breakspear", "bloodraven", "leo-tyrell"],
        rivals: ["daemon-blackfyre", "bittersteel"],
      },
      {
        id: "bloodraven", name: "Brynden Rivers (Quạ Máu)", house: "Targaryen", role: "Mắt Ngàn Mắt", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Con hoang mắt đỏ bạch tạng của Aegon IV — tay cung thần sầu, mạng lưới gián điệp khắp vương quốc, và có lẽ... còn hơn thế.",
        birthYear: 175, age: 20, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 14, "Thể Chất": 11, "Trí Tuệ": 16, "Tinh Tường": 17, "Uy Tín": 12 },
        talentIds: ["keen-eye", "schemer", "warg"],
        skills: { "archery": 9, "cunning": 7, "gather-rumor": 7, "lore": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Cung dài huyết mộc", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Xa": 7 }, moTa: "Cung được chạm rune cổ" },
        ],
        items: [{ ten: "Quạ đưa tin", soLuong: 3, moTa: "Mắt và tai khắp bảy vương quốc" }],
        gold: 2000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Quân Đoàn Rồng Lửa", type: "Bộ Binh", size: 600, quality: "Tinh Nhuệ" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 150, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["bastard-rebellion"],
        father: "aegon-iv-targaryen", mother: "mylessa-blackwood",
        siblings: ["daeron-ii", "daemon-blackfyre", "bittersteel", "shiera-seastar"],
        allies: ["daeron-ii", "shiera-seastar"],
        rivals: ["bittersteel", "daemon-blackfyre"],
      },
      {
        id: "bittersteel", name: "Aegor Rivers (Thép Đắng)", house: "Bracken", role: "Kiếm Sĩ Mang Thù", tuocVi: "Thường Dân", religion: "Thất Diện Thần",
        blurb: "Con hoang của Aegon IV và Barba Bracken. Căm hận Bloodraven đến tận xương tuỷ. Sẽ là người sáng lập Hội Binh Vàng sau này.",
        birthYear: 172, age: 23, coreStats: { "Sức Mạnh": 15, "Nhanh Nhẹn": 13, "Thể Chất": 16, "Trí Tuệ": 11, "Tinh Tường": 12, "Uy Tín": 13 },
        talentIds: ["warrior-blood", "hot-tempered"],
        skills: { "sword-shield": 8, "command": 7, "war-riding": 6, "intimidation": 6 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm thép dài", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Thanh kiếm tàn nhẫn như chủ nhân của nó" },
        ],
        items: [],
        gold: 1500, startHoldings: [],
        startRegions: [],
        startArmies: [
          { name: "Bộ Binh Lãnh Địa", type: "Bộ Binh", size: 1200, quality: "Thành Thạo" },
          { name: "Kỵ Binh Địa Phương", type: "Kỵ Binh", size: 400, quality: "Thành Thạo" },
          { name: "Đội Bắn Nỏ Nông Dân", type: "Cung Thủ", size: 400, quality: "Thành Thạo" }
        ],
        startingHookIds: ["bastard-rebellion"],
        father: "aegon-iv-targaryen", mother: "barba-bracken",
        spouse: "calla-blackfyre",
        siblings: ["daeron-ii", "daemon-blackfyre", "bloodraven", "shiera-seastar"],
        allies: ["daemon-blackfyre", "otho-bracken"],
        rivals: ["bloodraven", "daeron-ii", "shiera-seastar"],
      },
    ],
    startingHooks: [
      { id: "black-banner-rises", title: "Cờ Đen Phất Lên", year: "195 AC", numericYear: 195, desc: "Daemon Blackfyre công khai tuyên bố quyền thừa kế. Hơn nửa vương quốc ủng hộ — dòng máu chính thống bị thách thức bằng chính thanh kiếm mang tên vương triều." },
      { id: "bastard-rebellion", title: "Cuộc Loạn Con Hoang", year: "196 AC", numericYear: 196, desc: "Đại quân Blackfyre đang tiến về phía nam. Ngươi phải tập hợp lực lượng trung thành, đối mặt tại Redgrass Field — trận đánh sẽ quyết định số phận vương triều." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "dunk-and-egg",
    name: "Hiệp Sĩ Bảy Vương Quốc (Dunk & Egg)",
    yearRange: "209 – 233 AC",
    startYear: 209,
    startSeason: "Hạ",
    startLocation: "Ashford",
    blurb: "Thời kỳ thanh bình mong manh sau Loạn Blackfyre. Một hiệp sĩ lang thang cao lớn và cậu bé cạo đầu đi khắp Bảy Vương Quốc — chưa ai biết cậu bé ấy sẽ trở thành vị vua vĩ đại nhất chưa từng ngồi đủ lâu trên ngai.",
    availableHouses: ["targaryen", "stark", "lannister", "baratheon", "greyjoy", "tyrell", "martell", "arryn", "tully"],
    hasMagic: false,
    canonCharacters: [
      ...dunkAndEggCharacters,
      {
        id: "duncan-the-tall", name: "Ser Duncan Cao Lớn", house: "Không Nhà", role: "Hiệp Sĩ Giang Hồ", tuocVi: "Hiệp Sĩ", religion: "Thất Diện Thần",
        blurb: "Cao gần bảy bộ, con mồ côi Flea Bottom, cựu giám mã của Hiệp Sĩ Giang Hồ già Arlan xứ Pennytree. Không gia huy, không dòng họ — chỉ có thanh kiếm và lời thề.",
        birthYear: 192, age: 17, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 11, "Thể Chất": 16, "Trí Tuệ": 9, "Tinh Tường": 11, "Uy Tín": 10 },
        talentIds: ["giant-frame", "warrior-blood", "beloved"],
        skills: { "sword-shield": 6, "war-riding": 4, "weather-endurance": 4, "hunting": 3 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm của Ser Arlan", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 4 }, moTa: "Kiếm thép thường — di vật duy nhất của thầy" },
          { slot: "Giáp Thân", ten: "Giáp bạc sơn lại", phamChat: "Thường", thuocTinh: { "Phòng Thủ": 3 }, moTa: "Giáp cũ đã sơn lại nhiều lần — trông như mới nếu nhìn từ xa" },
        ],
        items: [
          { ten: "Ngựa chiến Mưa Bão", soLuong: 1, moTa: "Con ngựa chiến duy nhất — già nhưng trung thành" },
          { ten: "Khiên vẽ cây sồi", soLuong: 1, moTa: "Khiên với hình cây sồi vàng trên nền xanh" },
        ],
        gold: 30, startingHookIds: ["ashford-tourney", "wander-the-reach"],
        allies: ["aegon-egg"],
        rivals: ["aerion-brightflame"],
      },
      {
        id: "aegon-egg", name: "Aegon \"Egg\" Targaryen", house: "Targaryen", role: "Giám Mã Bí Mật", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Con trai út của Hoàng tử Maekar, cạo đầu để giấu tóc bạc Targaryen. Theo Dunk lang thang như giám mã thường dân — nhưng dòng máu rồng chảy trong huyết quản.",
        birthYear: 199, age: 10, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 9 },
        talentIds: ["learned", "keen-eye"],
        skills: { "lore": 4, "languages": 3, "court-etiquette": 3, "hunting": 2 },
        equipment: [],
        items: [
          { ten: "Sách lịch sử", soLuong: 2, moTa: "Sách về các vua Targaryen — đọc đi đọc lại" },
        ],
        gold: 15, startHoldings: ["targaryen-seat"],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 600, quality: "Mới Lập Đội" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 150, quality: "Mới Lập Đội" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 5, quality: "Mới Lập Đội" }
        ],
        startingHookIds: ["ashford-tourney", "wander-the-reach"],
        father: "maekar-i-targaryen", mother: "dyanna-dayne",
        spouse: "betha-blackwood",
        children: ["duncan-targaryen-small", "jaehaerys-ii-targaryen", "shaera-targaryen", "daeron-targaryen-gay", "rhaelle-targaryen"],
        siblings: ["daeron-the-drunken", "aerion-brightflame", "aemon-targaryen", "daella-targaryen", "rhae-targaryen"],
        allies: ["duncan-the-tall"],
        rivals: ["aerion-brightflame"],
      },
      {
        id: "bloodraven-hand", name: "Brynden Rivers (Quạ Máu)", house: "Targaryen", role: "Bàn Tay Nhà Vua", tuocVi: "Vua", religion: "Cựu Thần",
        blurb: "Con hoang bạch tạng mắt đỏ, giờ là Bàn Tay Nhà Vua của Aerys I. Mạng lưới gián điệp dày đặc, quyền lực tuyệt đối — và ai đó đang thì thầm rằng ông ta dùng ma thuật.",
        birthYear: 175, age: 34, coreStats: { "Sức Mạnh": 10, "Nhanh Nhẹn": 13, "Thể Chất": 11, "Trí Tuệ": 17, "Tinh Tường": 18, "Uy Tín": 14 },
        talentIds: ["keen-eye", "schemer", "warg"],
        skills: { "archery": 9, "cunning": 8, "gather-rumor": 8, "lore": 6, "command": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Cung dài huyết mộc", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Xa": 7 }, moTa: "Cung được chạm rune cổ — bắn trúng từ khoảng cách phi thường" },
        ],
        items: [
          { ten: "Quạ đưa tin", soLuong: 5, moTa: "Mắt và tai khắp bảy vương quốc" },
          { ten: "Dark Sister", soLuong: 1, moTa: "Kiếm thép Valyria — giấu trong phòng riêng" },
        ],
        gold: 5000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands"],
        startArmies: [
          { name: "Vệ Binh Rồng", type: "Bộ Binh", size: 1800, quality: "Thành Thạo" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 450, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 15, quality: "Thành Thạo" }
        ],
        startingHookIds: ["whitewalls-conspiracy"],
        father: "aegon-iv-targaryen", mother: "mylessa-blackwood",
        allies: ["aerys-i-targaryen"],
        rivals: ["bittersteel", "daemon-ii-blackfyre"],
      },
    ],
    startingHooks: [
      { id: "ashford-tourney", title: "Giải Đấu Ashford", year: "209 AC", numericYear: 209, desc: "Giải đấu lớn tại Ashford Meadow — nơi hiệp sĩ khắp vương quốc tụ về tranh tài. Cơ hội lập danh, nhưng cũng đầy nguy hiểm khi dòng máu hoàng gia xen vào." },
      { id: "wander-the-reach", title: "Lang Thang Xứ Reach", year: "210 AC", numericYear: 210, desc: "Ngươi lang thang trên những con đường bụi bặm của Reach — tìm giải đấu, tìm việc, tìm danh dự. Một hiệp sĩ lang thang không có lãnh chúa nào che chở." },
      { id: "whitewalls-conspiracy", title: "Âm Mưu Whitewalls", year: "212 AC", numericYear: 212, desc: "Tin tình báo: phe Blackfyre đang mưu tính cuộc nổi dậy thứ hai, núp dưới vỏ bọc giải đấu tại lâu đài Whitewalls. Phải phá tan âm mưu — hoặc lợi dụng nó.", mode: "Theo Sát Nguyên Tác" },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "roberts-rebellion",
    name: "Loạn Robert",
    yearRange: "282 – 283 AC",
    startYear: 282,
    startSeason: "Xuân",
    startLocation: "The Eyrie",
    blurb: "Lyanna Stark bị mang đi. Brandon và Rickard Stark chết dưới tay Vua Điên. Robert Baratheon phất cờ — cả vương quốc rẽ đôi.",
    availableHouses: ["stark", "baratheon", "targaryen", "lannister", "arryn", "tully", "tyrell", "martell", "greyjoy"],
    hasMagic: false,
    canonCharacters: [
      ...robertsRebellionCharacters,
      {
        id: "robert-baratheon", name: "Robert Baratheon", house: "Baratheon", role: "Thủ Lĩnh Phiến Quân", tuocVi: "Vua Bảy Vương Quốc", religion: "Thất Diện Thần",
        blurb: "Chiếc búa chiến trong tay, cơn thịnh nộ trong tim — Robert của Storm's End đòi lại người mình yêu bằng chiến tranh.",
        birthYear: 262, age: 20, coreStats: { "Sức Mạnh": 17, "Nhanh Nhẹn": 12, "Thể Chất": 16, "Trí Tuệ": 9, "Tinh Tường": 10, "Uy Tín": 15 },
        talentIds: ["giant-frame", "warrior-blood", "beloved"],
        skills: { "axe-mace": 8, "war-riding": 6, "command": 6, "hunting": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Búa chiến Robert", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Búa chiến khổng lồ ít ai vung nổi" },
          { slot: "Giáp Thân", ten: "Giáp phiến hươu vàng", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp trận nhà Baratheon" },
        ],
        items: [],
        gold: 3000, startHoldings: ["the-stormlands-seat"],
        startRegions: ["the-stormlands"],
        startArmies: [
          { name: "Bộ Binh Bão Tố", type: "Bộ Binh", size: 9000, quality: "Thành Thạo" },
          { name: "Cung Thủ Rừng Marcher", type: "Cung Thủ", size: 2250, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 75, quality: "Thành Thạo" }
        ],
        startingHookIds: ["call-to-banners", "battle-of-bells"],
      },
      {
        id: "eddard-stark-young", name: "Eddard Stark", house: "Stark", role: "Sói Trẻ Phương Bắc", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Người con thứ bỗng thành Lãnh chúa Winterfell sau cái chết của cha và anh — trầm lặng, và không lùi bước.",
        birthYear: 263, age: 19, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 12, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 12 },
        talentIds: ["lord-of-north", "warrior-blood"],
        skills: { "sword-shield": 6, "command": 6, "weather-endurance": 4, "lore": 3 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Đại kiếm thép Valyria của Nhà Stark" },
          { slot: "Khiên", ten: "Áo choàng lông sói", phamChat: "Thường", thuocTinh: { "Chống Chịu": 3 }, moTa: "Chống rét phương Bắc" },
        ],
        items: [],
        gold: 2000, startHoldings: ["the-north-seat"],
        startRegions: ["the-north"],
        startArmies: [
          { name: "Lính Cầm Giáo Lạnh", type: "Bộ Binh", size: 10800, quality: "Thành Thạo" },
          { name: "Đội Kỵ Sĩ Sói", type: "Kỵ Binh", size: 3600, quality: "Thành Thạo" },
          { name: "Cung Thủ Vùng Tuyết", type: "Cung Thủ", size: 3600, quality: "Thành Thạo" }
        ],
        startingHookIds: ["call-to-banners", "tower-of-joy"],
      },
      {
        id: "rhaegar-targaryen", name: "Rhaegar Targaryen", house: "Targaryen", role: "Thái Tử Bạc", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Hoàng tử tài hoa nhất thế hệ — cây đàn hạc trong tay này, ngọn thương trong tay kia, và một điềm tiên tri trong đầu.",
        birthYear: 259, age: 23, coreStats: { "Sức Mạnh": 13, "Nhanh Nhẹn": 14, "Thể Chất": 12, "Trí Tuệ": 15, "Tinh Tường": 13, "Uy Tín": 16 },
        talentIds: ["silver-tongue", "duelist", "learned"],
        skills: { "sword-shield": 7, "war-riding": 7, "lore": 6, "persuasion": 5 },
        equipment: [
          { slot: "Giáp Thân", ten: "Giáp đen hồng ngọc", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Giáp đen khảm hồng ngọc hình rồng ba đầu" },
        ],
        items: [{ ten: "Đàn hạc bạc", soLuong: 1, moTa: "Tiếng đàn khiến thiếu nữ rơi lệ" }],
        gold: 4000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Lính Kích Đỉnh Aegon", type: "Bộ Binh", size: 24000, quality: "Mới Lập Đội" },
          { name: "Đội Bắn Nỏ Bến Vua", type: "Cung Thủ", size: 6000, quality: "Mới Lập Đội" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 200, quality: "Mới Lập Đội" }
        ],
        startingHookIds: ["trident-gathering"],
      },
      {
        id: "aerys-ii", name: "Aerys II Targaryen", house: "Targaryen", role: "Vua Điên", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Sự hoang tưởng và tàn ác đã thiêu rụi trí óc ông — giờ ông muốn thiêu rụi cả vương quốc bằng ngọn lửa xanh.",
        birthYear: 244, age: 38, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 8, "Thể Chất": 6, "Trí Tuệ": 13, "Tinh Tường": 7, "Uy Tín": 16 },
        talentIds: ["schemer"],
        skills: { "intimidation": 9, "command": 6, "lore": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Chất lỏng ma thuật", phamChat: "Thường", thuocTinh: { "Sát Thương Xa": 10 }, dacTinh: ["phép thuật"], moTa: "Wildfire — ngọn lửa không thể dập tắt" },
        ],
        items: [],
        gold: 20000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands","the-reach","dorne"],
        startArmies: [
          { name: "Vệ Binh Rồng", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" },
          { name: "Cung Thủ Vương Đô", type: "Cung Thủ", size: 1500, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Đô Đốc", type: "Chiến Thuyền Nặng", size: 50, quality: "Thành Thạo" }
        ],
        startingHookIds: ["call-to-banners"],
      },
      {
        id: "tywin-lannister-rebellion", name: "Tywin Lannister", house: "Lannister", role: "Sư Tử Đợi Chờ", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Lãnh chúa Casterly Rock. Đã từ bỏ chức Bàn Tay Nhà Vua. Giờ ông ngồi chờ ở hòn đá của mình, xem ai sẽ là người chiến thắng trước khi ra đòn quyết định.",
        birthYear: 242, age: 40, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 17, "Tinh Tường": 15, "Uy Tín": 16 },
        talentIds: ["learned", "schemer"],
        skills: { "command": 9, "cunning": 8, "commerce": 8, "intimidation": 8 },
        equipment: [
          { slot: "Giáp Thân", ten: "Giáp mạ vàng rực", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp nặng mạ vàng của nhà Lannister" },
        ],
        items: [{ ten: "Sổ nợ của ngai sắt", soLuong: 1, moTa: "Ghi chép các khoản tiền vương triều nợ" }],
        gold: 30000, startHoldings: ["the-westerlands-seat"],
        startRegions: ["the-westerlands"],
        startArmies: [
          { name: "Lính Giáo Lannisport", type: "Bộ Binh", size: 7200, quality: "Tinh Nhuệ" },
          { name: "Kỵ Sĩ Phương Tây", type: "Kỵ Binh", size: 2400, quality: "Tinh Nhuệ" },
          { name: "Đội Bắn Nỏ Lannister", type: "Cung Thủ", size: 2400, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["call-to-banners"],
      },
    ],
    startingHooks: [
      { id: "call-to-banners", title: "Hiệu Triệu Chư Hầu", year: "282 AC", numericYear: 282, desc: "Tin dữ từ King's Landing: Vua Điên đòi đầu ngươi. Jon Arryn từ chối giao nộp và phất cờ hiệu triệu — chiến tranh bắt đầu." },
      { id: "battle-of-bells", title: "Trận Chuông Ngân", year: "283 AC", numericYear: 283, desc: "Ngươi bị thương, trốn trong thị trấn Stoney Sept. Quân triều đình lùng từng căn nhà. Chuông nhà thờ bắt đầu đổ." },
      { id: "tower-of-joy", title: "Tháp Niềm Vui", year: "283 AC", numericYear: 283, desc: "Chiến tranh gần tàn. Ngươi cùng sáu người bạn phi về phía dãy núi Đỏ Dorne — nơi em gái ngươi được canh giữ bởi ba Ngự Lâm Quân giỏi nhất." },
      { id: "trident-gathering", title: "Đại Quân Tụ Về Trident", year: "283 AC", numericYear: 283, desc: "Hai đại quân đang tiến về khúc cạn sông Trident. Trận đánh định đoạt vương triều sắp bắt đầu." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "greyjoy-rebellion",
    name: "Loạn Greyjoy",
    yearRange: "289 AC",
    startYear: 289,
    startSeason: "Hạ",
    startLocation: "Pyke",
    blurb: "Sáu năm sau Loạn Robert, Balon Greyjoy xưng Vua Quần Đảo Sắt và đốt cháy hạm đội Lannister tại Lannisport. Robert Baratheon tập hợp chư hầu lần nữa — lần này đánh xuống biển.",
    availableHouses: ["greyjoy", "stark", "lannister", "baratheon", "arryn", "tully", "tyrell", "martell", "targaryen"],
    hasMagic: false,
    canonCharacters: [
      ...warOfFiveKingsCharacters,
      {
        id: "balon-greyjoy", name: "Balon Greyjoy", house: "Greyjoy", role: "Vua Quần Đảo Sắt", tuocVi: "Đại Lãnh Chúa", religion: "Thần Chết Chìm",
        blurb: "Con trai Quellon, Lãnh chúa Pyke — tin rằng người Sắt phải cai trị bằng giá sắt, không phải vàng. Và thời khắc đã đến.",
        birthYear: 256, age: 33, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 12, "Thể Chất": 15, "Trí Tuệ": 11, "Tinh Tường": 11, "Uy Tín": 14 },
        talentIds: ["warrior-blood", "hot-tempered"],
        skills: { "axe-mace": 7, "command": 6, "war-riding": 4, "weather-endurance": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Rìu chiến Greyjoy", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Rìu nặng của Người Sắt" },
          { slot: "Giáp Thân", ten: "Giáp xích Người Sắt", phamChat: "Tinh Xảo", thuocTinh: { "Phòng Thủ": 4 }, moTa: "Giáp xích bọc da — nhẹ khi lội nước" },
        ],
        items: [],
        gold: 3000, startHoldings: ["the-iron-islands-seat"],
        startRegions: ["the-iron-islands"],
        startArmies: [
          { name: "Đội Đột Kích Pyke", type: "Người Sắt (Ironborn)", size: 20000, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Thiết Quần Đảo", type: "Thuyền Dài (Greyjoy)", size: 300, quality: "Thành Thạo" }
        ],
        startingHookIds: ["iron-price", "burn-lannisport"],
      },
      {
        id: "robert-baratheon-king", name: "Robert Baratheon", house: "Baratheon", role: "Vua Bảy Vương Quốc", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Sáu năm trên ngai sắt chưa làm Robert béo phì — nhưng sắp rồi. Giờ thì gã còn đủ sức vung búa và dẹp loạn Greyjoy.",
        birthYear: 262, age: 27, coreStats: { "Sức Mạnh": 16, "Nhanh Nhẹn": 11, "Thể Chất": 15, "Trí Tuệ": 9, "Tinh Tường": 10, "Uy Tín": 16 },
        talentIds: ["giant-frame", "warrior-blood", "beloved"],
        skills: { "axe-mace": 8, "war-riding": 6, "command": 7, "hunting": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Búa chiến Robert", phamChat: "Thượng Hạng", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Búa chiến đã đập nát hồng ngọc trên ngực Rhaegar" },
        ],
        items: [],
        gold: 8000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands","the-north","the-vale","the-westerlands","the-reach","the-stormlands","dorne","the-riverlands"],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 25000, quality: "Thành Thạo" },
          { name: "Cấm Vệ Hoàng Gia", type: "Kỵ Binh", size: 5000, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["crush-the-squid"],
      },
      {
        id: "theon-greyjoy-child", name: "Theon Greyjoy", house: "Greyjoy", role: "Con Tin Tương Lai", tuocVi: "Lãnh Chúa", religion: "Thần Chết Chìm",
        blurb: "Cậu bé chín tuổi, con út của Balon — chưa biết rằng nếu cha thua, cậu sẽ bị mang đi làm con tin ở Winterfell.",
        birthYear: 280, age: 9, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 8, "Trí Tuệ": 9, "Tinh Tường": 8, "Uy Tín": 8 },
        talentIds: [],
        skills: { "archery": 2, "hunting": 2 },
        equipment: [],
        items: [],
        gold: 0, startHoldings: ["the-iron-islands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Chiến Binh Đảo Muối", type: "Bộ Binh", size: 600, quality: "Thành Thạo" },
          { name: "Cung Thủ Người Sắt", type: "Cung Thủ", size: 150, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Người Sắt", type: "Thuyền Dài (Greyjoy)", size: 5, quality: "Thành Thạo" }
        ],
        startingHookIds: ["iron-price"],
      },
      {
        id: "euron-greyjoy", name: "Euron Greyjoy", house: "Greyjoy", role: "Mắt Quạ", tuocVi: "Lãnh Chúa", religion: "Thần Chết Chìm",
        blurb: "Kẻ điên rồ và xảo quyệt nhất trong những người anh em của Balon. Cưỡi con tàu Silence với thủy thủ đoàn bị cắt lưỡi.",
        birthYear: 260, age: 29, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 16, "Tinh Tường": 15, "Uy Tín": 15 },
        talentIds: ["schemer", "master-liar"],
        skills: { "sailing": 9, "cunning": 8, "intimidation": 9, "lore": 6 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Kiếm thép Valyria (tin đồn)", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Thanh kiếm chém không lưu vết" },
        ],
        items: [{ ten: "Kèn ma thuật", soLuong: 1, moTa: "Chiếc kèn có thể trói buộc rồng" }],
        gold: 10000, startHoldings: ["the-iron-islands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Băng Cướp Biển Silence", type: "Người Sắt (Ironborn)", size: 1000, quality: "Tinh Nhuệ" }
        ],
        startFleets: [
          { name: "Hạm Đội Sự Im Lặng", type: "Thuyền Dài (Greyjoy)", size: 1, quality: "Tinh Nhuệ" }
        ],
        startingHookIds: ["iron-price"],
      },
    ],
    startingHooks: [
      { id: "iron-price", title: "Giá Sắt", year: "289 AC", numericYear: 289, desc: "Balon Greyjoy đội vương miện bằng cá sấu biển và tuyên bố Quần Đảo Sắt độc lập. Người Sắt không mua — Người Sắt trả giá sắt." },
      { id: "burn-lannisport", title: "Đốt Lannisport", year: "289 AC", numericYear: 289, desc: "Hạm đội Greyjoy đột kích Lannisport, đốt rụi cảng và tàu chiến Lannister. Tywin Lannister nổi giận — và Robert Baratheon đang tập hợp cả vương quốc để đáp trả." },
      { id: "crush-the-squid", title: "Nghiền Nát Thủy Quái", year: "289 AC", numericYear: 289, desc: "Tin báo: Greyjoy đốt Lannisport và xưng vương. Ngươi triệu tập chư hầu — Ned Stark, Tywin Lannister, Stannis Baratheon — để tấn công thẳng vào Pyke." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "war-of-five-kings",
    name: "Chiến Tranh Ngũ Vương",
    yearRange: "298 – 300 AC",
    startYear: 298,
    startSeason: "Thu",
    startLocation: "Winterfell",
    blurb: "Vua Robert chết. Năm vị vua xưng đế. Mùa hè dài nhất lịch sử sắp tàn — và ở phương Bắc xa, thứ gì đó lạnh lẽo đang thức dậy.",
    availableHouses: ["stark", "lannister", "baratheon", "targaryen", "greyjoy", "tyrell", "martell", "arryn", "tully"],
    hasMagic: true,
    canonCharacters: [
      ...warOfFiveKingsCharacters,
      {
        id: "eddard-stark", name: "Eddard Stark", house: "Stark", role: "Lãnh Chúa Winterfell", tuocVi: "Đại Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Mười lăm năm thái bình cai trị phương Bắc — cho tới khi người bạn cũ phi ngựa tới cổng thành với một lời đề nghị chết người.",
        birthYear: 263, age: 35, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 11, "Thể Chất": 14, "Trí Tuệ": 12, "Tinh Tường": 15, "Uy Tín": 13 },
        talentIds: ["lord-of-north", "born-swordsman", "beloved"],
        skills: { "sword-shield": 7, "command": 8, "court-etiquette": 3, "lore": 5, "weather-endurance": 4 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Ice", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian", "gia truyền"], moTa: "Đại kiếm thép Valyria của Nhà Stark — người tuyên án phải tự vung kiếm" },
          { slot: "Khiên", ten: "Áo choàng lông sói", phamChat: "Tinh Xảo", thuocTinh: { "Chống Chịu": 3 }, moTa: "Chống rét phương Bắc" },
        ],
        items: [{ ten: "Ấn tín Lãnh chúa Winterfell", soLuong: 1, moTa: "Quyền cai trị phương Bắc" }],
        gold: 5000, startHoldings: ["the-north-seat"],
        startRegions: ["the-north"],
        startArmies: [
          { name: "Cấm Vệ Mùa Đông", type: "Bộ Binh", size: 5000, quality: "Tinh Nhuệ" },
          { name: "Đội Tiên Phong Phương Bắc", type: "Kỵ Binh Nhẹ", size: 3000, quality: "Thành Thạo" },
          { name: "Trung Quân Winterfell", type: "Bộ Binh", size: 12000, quality: "Thành Thạo" }
        ],
        holdingsLevel: { "the-north-seat": 5 },
        baseIncome: 300,
        father: "rickard-stark",
        mother: "lyarra-stark",
        spouse: "catelyn-tully",
        siblings: ["brandon-stark-rebel", "lyanna-stark", "benjen-stark"],
        children: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark", "jon-snow"],
        allies: ["robert-baratheon", "jon-arryn"],
        rivals: ["cersei-lannister", "tywin-lannister"],
        startingHookIds: ["kings-arrival", "hand-of-king"],
      },
      {
        id: "tyrion-lannister", name: "Tyrion Lannister", house: "Lannister", role: "Quỷ Lùn Nhà Lannister", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Cha khinh, chị ghét, cả vương quốc cười nhạo — nhưng trong cái đầu ấy là bộ óc sắc nhất Westeros. Ta uống, và ta biết nhiều thứ.",
        birthYear: 273, age: 25, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 17, "Tinh Tường": 16, "Uy Tín": 12 },
        talentIds: ["dwarf", "schemer", "silver-tongue", "perfect-memory"],
        skills: { "cunning": 7, "persuasion": 6, "negotiation": 6, "lore": 7, "gather-rumor": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Dao găm", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 2 }, moTa: "Nhỏ — như chủ nhân" },
        ],
        items: [{ ten: "Túi vàng Lannister", soLuong: 1, moTa: "Một Lannister luôn trả nợ" }, { ten: "Sách hiếm", soLuong: 2, moTa: "Tri thức là vũ khí của kẻ yếu" }],
        gold: 6000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Đội Sơn Cước (Mountain Clans)", type: "Bộ Binh", size: 2000, quality: "Mới Lập Đội" }
        ],
        father: "tywin-lannister",
        mother: "joanna-lannister",
        spouse: "sansa-stark",
        siblings: ["jaime-lannister", "cersei-lannister"],
        allies: ["bronn"],
        startingHookIds: ["kings-arrival", "journey-to-wall"],
      },
      {
        id: "daenerys-targaryen", name: "Daenerys Targaryen", house: "Targaryen", role: "Công Chúa Lưu Vong", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Đứa con cuối cùng của triều đại bị lật đổ, sống lưu vong bên kia Biển Hẹp — sắp bị gả bán cho một khal người Dothraki.",
        birthYear: 284, age: 14, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 10, "Thể Chất": 11, "Trí Tuệ": 12, "Tinh Tường": 13, "Uy Tín": 15 },
        talentIds: ["dragon-blood", "silver-tongue"],
        skills: { "persuasion": 4, "languages": 4, "court-etiquette": 3 },
        equipment: [],
        items: [{ ten: "Ba quả trứng rồng hoá thạch", soLuong: 1, moTa: "Quà cưới — đá quý, hay còn hơn thế?" }],
        gold: 100, startHoldings: [],
        startRegions: [],
        startArmies: [
          { name: "Huyết Kỵ Dothraki", type: "Kỵ Binh Nhẹ", size: 100, quality: "Mới Lập Đội" }
        ],
        father: "aerys-ii",
        mother: "rhaella-targaryen",
        spouse: "khal-drogo",
        siblings: ["rhaegar-targaryen", "viserys-targaryen"],
        startingHookIds: ["dothraki-wedding"],
      },
      {
        id: "jon-snow", name: "Jon Snow", house: "Stark", role: "Con Hoang Của Winterfell", tuocVi: "Thường Dân", religion: "Cựu Thần",
        blurb: "Snow — cái họ theo cậu từ lúc sinh. Ở Winterfell không có chỗ cho cậu; Tường Thành thì luôn nhận tất cả.",
        birthYear: 283, age: 15, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 13, "Thể Chất": 12, "Trí Tuệ": 11, "Tinh Tường": 12, "Uy Tín": 10 },
        talentIds: ["born-swordsman", "warg", "ill-reputed"],
        skills: { "sword-shield": 5, "war-riding": 3, "hunting": 3, "weather-endurance": 3 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Trường kiếm tập luyện", phamChat: "Thường", thuocTinh: { "Sát Thương Cận": 3 }, moTa: "Kiếm thép thường — Longclaw còn chưa tới" },
          { slot: "Khiên", ten: "Áo choàng lông sói", phamChat: "Thường", thuocTinh: { "Chống Chịu": 3 }, moTa: "Chống rét" },
        ],
        items: [{ ten: "Sói tuyết Ghost", soLuong: 1, moTa: "Con sói trắng câm lặng — luôn ở gần" }],
        gold: 50, startHoldings: ["castle-black"],
        startRegions: [],
        startArmies: [
          { name: "Người Giữ Tường Thành", type: "Bộ Binh", size: 300, quality: "Thành Thạo" }
        ],
        father: "eddard-stark",
        siblings: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark"],
        startingHookIds: ["journey-to-wall", "kings-arrival"],
      },
      {
        id: "cersei-lannister", name: "Cersei Lannister", house: "Lannister", role: "Vương Hậu", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Hoa hồng vàng của Casterly Rock, vợ của vị vua nát rượu — và người giữ bí mật có thể thiêu rụi cả vương triều.",
        birthYear: 273, age: 25, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 9, "Thể Chất": 10, "Trí Tuệ": 13, "Tinh Tường": 12, "Uy Tín": 16 },
        talentIds: ["master-liar", "highborn-charm", "hot-tempered"],
        skills: { "deception": 6, "court-etiquette": 7, "cunning": 5, "persuasion": 5 },
        equipment: [],
        items: [{ ten: "Trang sức hoàng gia", soLuong: 1, moTa: "Biểu tượng địa vị Vương Hậu" }],
        gold: 8000, startHoldings: ["the-crownlands-seat"],
        startRegions: [],
        startArmies: [
          { name: "Lính Gác Vương Đô (Gold Cloaks)", type: "Bộ Binh", size: 6000, quality: "Thành Thạo" }
        ],
        father: "tywin-lannister",
        mother: "joanna-lannister",
        spouse: "robert-baratheon",
        siblings: ["jaime-lannister", "tyrion-lannister"],
        children: ["joffrey-baratheon", "myrcella-baratheon", "tommen-baratheon"],
        rivals: ["eddard-stark", "stannis-baratheon", "margaery-tyrell"],
        startingHookIds: ["kings-arrival"],
      },
      {
        id: "robb-stark", name: "Robb Stark", house: "Stark", role: "Sói Trẻ", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Con cả của Ned Stark. Sau cái chết của cha, cậu được phong làm Vua Phương Bắc. Bất bại trên chiến trường, nhưng chiến tranh không chỉ có gươm đao.",
        birthYear: 283, age: 15, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 12, "Tinh Tường": 14, "Uy Tín": 16 },
        talentIds: ["lord-of-north", "beloved", "commander-instinct"],
        skills: { "command": 7, "sword-shield": 6, "war-riding": 6 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Trường kiếm", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 5 }, moTa: "Kiếm của Lãnh chúa Winterfell" },
        ],
        items: [{ ten: "Sói Grey Wind", soLuong: 1, moTa: "Sói tuyết dữ tợn luôn bên cạnh Sói Trẻ" }],
        gold: 4000, startHoldings: ["the-north-seat"],
        startRegions: ["the-north","the-riverlands"],
        startArmies: [
          { name: "Kỵ Binh Sói", type: "Kỵ Binh Nhẹ", size: 4000, quality: "Tinh Nhuệ" },
          { name: "Đội Tiên Phong Karstark", type: "Trường Thương", size: 6000, quality: "Thành Thạo" },
          { name: "Trung Quân Umber", type: "Bộ Binh", size: 10000, quality: "Thành Thạo" }
        ],
        father: "eddard-stark",
        mother: "catelyn-tully",
        spouse: "talisa-maegyr",
        siblings: ["sansa-stark", "arya-stark", "bran-stark", "rickon-stark", "jon-snow"],
        allies: ["edmure-tully", "greatjon-umber"],
        rivals: ["joffrey-baratheon", "tywin-lannister"],
        startingHookIds: ["hand-of-king"],
      },
      {
        id: "stannis-baratheon", name: "Stannis Baratheon", house: "Baratheon", role: "Vua Đích Thực", tuocVi: "Đại Lãnh Chúa", religion: "Thần Ánh Sáng (R'hllor)",
        blurb: "Em trai của Robert. Một con người được rèn từ sắt: cứng rắn, vô tình và không bao giờ uốn cong. Ông tin ngôi vị là quyền của mình.",
        birthYear: 264, age: 34, coreStats: { "Sức Mạnh": 14, "Nhanh Nhẹn": 10, "Thể Chất": 15, "Trí Tuệ": 14, "Tinh Tường": 13, "Uy Tín": 9 },
        talentIds: ["commander-instinct"],
        skills: { "command": 9, "sailing": 7, "sword-shield": 6, "lore": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Lightbringer (Giả)", phamChat: "Tinh Xảo", thuocTinh: { "Sát Thương Cận": 6 }, moTa: "Kiếm sáng rực nhưng không tỏa nhiệt" },
        ],
        items: [],
        gold: 2000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Lính Giáo Đảo Rồng", type: "Trường Thương", size: 3000, quality: "Thành Thạo" },
          { name: "Kỵ Binh Florent", type: "Kỵ Binh", size: 2000, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Dragonstone", type: "Chiến Thuyền Nặng", size: 160, quality: "Tinh Nhuệ" }
        ],
        father: "steffon-baratheon",
        mother: "cassana-estermont",
        spouse: "selyse-florent",
        children: ["shireen-baratheon"],
        siblings: ["robert-baratheon", "renly-baratheon"],
        allies: ["davos-seaworth", "melisandre"],
        rivals: ["renly-baratheon", "joffrey-baratheon"],
        startingHookIds: ["dragonstone-fleet"],
      },
      {
        id: "renly-baratheon", name: "Renly Baratheon", house: "Baratheon", role: "Vua Ở Highgarden", tuocVi: "Đại Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Em út nhà Baratheon, đẹp trai, quyến rũ và được lòng dân chúng. Anh ta mặc áo giáp xanh và tự xưng vương dù không có quyền kế vị.",
        birthYear: 277, age: 21, coreStats: { "Sức Mạnh": 11, "Nhanh Nhẹn": 12, "Thể Chất": 12, "Trí Tuệ": 11, "Tinh Tường": 11, "Uy Tín": 18 },
        talentIds: ["beloved", "highborn-charm", "silver-tongue"],
        skills: { "persuasion": 8, "court-etiquette": 7, "command": 5 },
        equipment: [
          { slot: "Giáp Thân", ten: "Giáp xanh rừng", phamChat: "Thượng Hạng", thuocTinh: { "Phòng Thủ": 5 }, moTa: "Áo giáp tráng men xanh lá tuyệt đẹp" },
        ],
        items: [],
        gold: 15000, startHoldings: ["the-stormlands-seat"],
        startRegions: ["the-stormlands","the-reach"],
        startArmies: [
          { name: "Vạn Quân Highgarden", type: "Bộ Binh", size: 70000, quality: "Mới Lập Đội" },
          { name: "Kỵ Sĩ Mùa Hè", type: "Kỵ Binh", size: 20000, quality: "Thành Thạo" },
          { name: "Đội Cung Xứ Reach", type: "Bộ Binh", size: 10000, quality: "Thành Thạo" }
        ],
        father: "steffon-baratheon",
        mother: "cassana-estermont",
        spouse: "margaery-tyrell",
        siblings: ["robert-baratheon", "stannis-baratheon"],
        allies: ["loras-tyrell", "mace-tyrell"],
        rivals: ["stannis-baratheon"],
        startingHookIds: ["highgarden-alliance"],
      },
      {
        id: "joffrey-baratheon", name: "Joffrey Baratheon", house: "Baratheon", role: "Vua Bé Con", tuocVi: "Vua", religion: "Thất Diện Thần",
        blurb: "Tàn nhẫn, kiêu ngạo và hèn nhát. Dù mang tên Baratheon, cậu lại có mái tóc vàng của nhà Lannister.",
        birthYear: 286, age: 12, coreStats: { "Sức Mạnh": 6, "Nhanh Nhẹn": 9, "Thể Chất": 7, "Trí Tuệ": 8, "Tinh Tường": 7, "Uy Tín": 9 },
        talentIds: ["hot-tempered"],
        skills: { "intimidation": 5, "archery": 4 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Widow's Wail", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 7 }, moTa: "Kiếm thép Valyria mới rèn" },
        ],
        items: [{ ten: "Vương miện Ngai Sắt", soLuong: 1, moTa: "Vương miện hoàng kim" }],
        gold: 50000, startHoldings: ["the-crownlands-seat"],
        startRegions: ["the-crownlands","the-westerlands"],
        startArmies: [
          { name: "Vương Quân King's Landing", type: "Bộ Binh", size: 10000, quality: "Thành Thạo" },
          { name: "Cấm Vệ Hoàng Gia", type: "Kỵ Binh", size: 5000, quality: "Tinh Nhuệ" }
        ],
        father: "robert-baratheon",
        mother: "cersei-lannister",
        spouse: "margaery-tyrell",
        siblings: ["myrcella-baratheon", "tommen-baratheon"],
        rivals: ["robb-stark", "stannis-baratheon", "renly-baratheon"],
        startingHookIds: ["boy-king-crowned"],
      },
    ],
    startingHooks: [
      { id: "kings-arrival", title: "Ngự Giá Tới Winterfell", year: "298 AC", numericYear: 298, desc: "Đoàn ngự giá ba trăm người của Vua Robert đang tiến vào cổng Winterfell. Jon Arryn — Bàn Tay Nhà Vua — vừa chết đột ngột, và nhà vua cần một người thay thế." },
      { id: "hand-of-king", title: "Bàn Tay Nhà Vua", year: "298 AC", numericYear: 298, desc: "Ngươi đã nhận chức Bàn Tay và đang trên đường nam tiến về King's Landing — nơi vợ ngươi tin rằng nhà Lannister đã ám sát người tiền nhiệm.", mode: "Theo Sát Nguyên Tác" },
      { id: "journey-to-wall", title: "Đường Lên Tường Thành", year: "298 AC", numericYear: 298, desc: "Đoàn người ngược lên phương Bắc về Tường Thành — bức tường băng bảy trăm bộ và những lời thề trọn đời của Tuần Đêm." },
        { id: "dothraki-wedding", title: "Hôn Lễ Dothraki", year: "298 AC", numericYear: 298, desc: "Bên kia Biển Hẹp, trong thành Pentos, hôn lễ của ngươi với Khal Drogo đang được chuẩn bị. Anh trai ngươi muốn đổi ngươi lấy một đạo quân." },
      { id: "dragonstone-fleet", title: "Hạm Đội Dragonstone", year: "298 AC", numericYear: 298, desc: "Ngươi biết rõ Joffrey là con hoang. Ngươi đã rời thủ đô, rút về đảo Rồng, rèn gươm, sắm thuyền. Ngai Sắt là của ngươi theo huyết thống." },
      { id: "highgarden-alliance", title: "Liên Minh Highgarden", year: "298 AC", numericYear: 298, desc: "Dân chúng yêu ngươi, nhà Tyrell ủng hộ ngươi với mười vạn quân, và chiếc vương miện thật vừa vặn trên đầu ngươi. Luật lệ chẳng là gì nếu ngươi có sức mạnh." },
      { id: "boy-king-crowned", title: "Tiểu Vương Đăng Cơ", year: "298 AC", numericYear: 298, desc: "Vua cha đã chết vì lợn rừng. Giờ đây, Ngai Sắt là của ngươi. Mọi kẻ cản đường đều là kẻ phản nghịch cần phải bị chặt đầu." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "winds-of-winter",
    name: "Những Cơn Gió Mùa Đông",
    yearRange: "300 AC – Hiện tại",
    startYear: 300,
    startSeason: "Đông",
    startLocation: "Winterfell",
    blurb: "Mùa đông đã đến. Phương Bắc trỗi dậy chống lại Bolton. Bảy Vương Quốc kiệt quệ, và ở một nơi rất xa, nữ hoàng rồng mang theo lửa và máu tiến về phía Tây.",
    availableHouses: ["stark", "lannister", "baratheon", "targaryen", "greyjoy", "tyrell", "martell", "arryn", "tully", "bolton"],
    hasMagic: true,
    canonCharacters: [
      ...windsOfWinterCharacters,
      {
        id: "jon-snow-resurrected", name: "Jon Snow", house: "Stark", role: "Sói Trắng", tuocVi: "Lãnh Chúa", religion: "Cựu Thần",
        blurb: "Bị phản bội và ám sát bởi chính người của mình, cậu được đưa về từ cõi chết. Tuần Đêm đã ở lại phía sau, phía trước là Winterfell.",
        birthYear: 283, age: 17, coreStats: { "Sức Mạnh": 12, "Nhanh Nhẹn": 13, "Thể Chất": 13, "Trí Tuệ": 11, "Tinh Tường": 14, "Uy Tín": 15 },
        talentIds: ["born-swordsman", "warg", "commander-instinct"],
        skills: { "sword-shield": 8, "command": 7, "weather-endurance": 7, "intimidation": 5 },
        equipment: [
          { slot: "Vũ Khí Chính", ten: "Longclaw", phamChat: "Thép Valyria", thuocTinh: { "Sát Thương Cận": 8 }, dacTinh: ["valyrian"], moTa: "Kiếm móng sói thép Valyria" },
        ],
        items: [{ ten: "Sói trắng Ghost", soLuong: 1, moTa: "Con sói luôn theo chân chủ" }],
        gold: 100, startHoldings: ["the-north-seat"],
        startRegions: [],
        startArmies: [
          { name: "Dân Du Mục (Wildlings)", type: "Bộ Binh", size: 2000, quality: "Thành Thạo" },
          { name: "Người Phương Bắc Còn Sót", type: "Kỵ Binh Nhẹ", size: 500, quality: "Thành Thạo" }
        ],
        father: "rhaegar-targaryen", mother: "lyanna-stark",
        siblings: ["robb-stark", "sansa-stark", "arya-stark", "bran-stark", "rickon-stark"],
        allies: ["tormund-giantsbane", "melisandre", "sansa-stark", "davos-seaworth"],
        rivals: ["ramsay-bolton", "cersei-lannister", "night-king"],
        startingHookIds: ["battle-of-bastards"],
      },
      {
        id: "daenerys-targaryen-queen", name: "Daenerys Targaryen", house: "Targaryen", role: "Mẹ Rồng", tuocVi: "Lãnh Chúa", religion: "Thất Diện Thần",
        blurb: "Không còn là cô gái sợ hãi. Nàng là Người Phá Xiềng Xích, cưỡi trên lưng con rồng lớn nhất, dẫn dắt đội quân khổng lồ tiến về Westeros.",
        birthYear: 284, age: 16, coreStats: { "Sức Mạnh": 7, "Nhanh Nhẹn": 10, "Thể Chất": 12, "Trí Tuệ": 14, "Tinh Tường": 15, "Uy Tín": 18 },
        talentIds: ["dragon-blood", "beloved", "silver-tongue"],
        skills: { "command": 8, "persuasion": 8, "languages": 6, "war-riding": 6 },
        equipment: [],
        items: [],
        gold: 100000, startHoldings: ["dragonstone"],
        startRegions: [],
        startArmies: [
          { name: "Unsullied", type: "Trường Thương", size: 8000, quality: "Tinh Nhuệ" },
          { name: "Huyết Kỵ Dothraki", type: "Kỵ Binh Nhẹ", size: 50000, quality: "Thành Thạo" }
        ],
        startFleets: [
          { name: "Hạm Đội Sắt Của Mẹ Rồng", type: "Thuyền Dài (Greyjoy)", size: 100, quality: "Thành Thạo" }
        ],
        father: "aerys-ii-targaryen", mother: "rhaella-targaryen",
        siblings: ["rhaegar-targaryen", "viserys-targaryen"],
        allies: ["tyrion-lannister", "varys", "olenna-tyrell", "ellaria-sand"],
        rivals: ["cersei-lannister", "euron-greyjoy"],
        startingHookIds: ["dragon-queen-sails"],
        dragon: {
          name: "Drogon", color: "Đen Đỏ", size: "Trưởng Thành",
          age: 2, description: "Bóng Dực bay lượn. To lớn, tàn nhẫn và hung bạo nhất trong ba con rồng.",
          stats: { "Sức Lửa": 16, "Sức Bay": 15, "Giáp Vảy": 14, "Hung Dữ": 18, "Trung Thành": 17 },
          skills: { "Phun Lửa": 9, "Bổ Nhào": 7, "Gầm Hống": 8, "Chiến Đấu Trên Không": 6, "Lượn Gió": 6 },
        },
      }
    ],
    startingHooks: [
      { id: "battle-of-bastards", title: "Trận Chiến Của Những Đứa Con Hoang", year: "300 AC", numericYear: 300, desc: "Bolton giữ Winterfell. Ngươi mang tàn quân Wildling và gia tộc phương Bắc đến để đoạt lại nhà. Trận chiến sinh tử sắp diễn ra." },
      { id: "dragon-queen-sails", title: "Nữ Hoàng Rồng Khởi Hành", year: "300 AC", numericYear: 300, desc: "Hạm đội khổng lồ nhổ neo. Sau bao năm lưu vong, cuối cùng ngươi cũng mang ngọn lửa của Targaryen trở về Bảy Vương Quốc." },
    ],
  },
  // ──────────────────────────────────────────────────────────────
  {
    id: "sandbox",
    name: "Tự Do / Sandbox",
    yearRange: "tuỳ chọn",
    startYear: 298,
    startSeason: "Hạ",
    startLocation: "Winterfell",
    blurb: "Không mốc thời gian cố định, không nhân vật canon — ngươi tự định nghĩa bối cảnh qua lorebook riêng và trí tưởng tượng.",
    availableHouses: ["stark", "lannister", "targaryen", "baratheon", "greyjoy", "tyrell", "martell", "arryn", "tully", "velaryon", "blackfyre"],
    hasMagic: true,
    canonCharacters: [],
    startingHooks: [
      { id: "sandbox-free", title: "Trang Giấy Trắng", year: "—", desc: "Ngươi bắt đầu ở nơi mình chọn, với câu chuyện của riêng mình. AI sẽ dệt thế giới quanh những gì ngươi kể." },
    ],
  },
];

export const ERAS_BY_ID: Record<string, EraData> = Object.fromEntries(ERAS.map((e) => [e.id, e]));

/** Parse năm AC từ hook — ưu tiên numericYear, fallback parse string "105 AC" → 105. */
export function parseHookYear(hook: StartingHook | null | undefined, fallback: number): number {
  if (!hook) return fallback;
  if (hook.numericYear !== undefined) return hook.numericYear;
  const m = hook.year.match(/(-?\d+)/);
  return m ? parseInt(m[1], 10) : fallback;
}
