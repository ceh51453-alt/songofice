/**
 * SỔ TRẠNG THÁI CHIẾN ĐẤU (M22) — nguồn dữ liệu DUY NHẤT cho mọi hiệu ứng bám
 * lên một đấu sĩ trong lúc đánh nhau: chảy máu, choáng, mù, phá giáp, cuồng nộ…
 *
 * Trước M22 các hiệu ứng này nằm rải rác dưới dạng `if (buffs["Mù Lòa"])` giữa
 * thân hàm engine — thêm một hiệu ứng là phải sửa engine, và người chơi không
 * bao giờ biết "Phá Giáp" thật ra làm gì. Giờ mỗi trạng thái là MỘT DÒNG DỮ LIỆU
 * có tên, mô tả, số tầng chồng tối đa, thời hạn và các hệ số cộng vào chỉ số.
 * Engine chỉ gọi `statusModifiers()` rồi cộng — không biết tên trạng thái nào cả.
 *
 * Tương thích ngược: id trạng thái CHÍNH LÀ tên tiếng Việt hiển thị, và vẫn lưu
 * trong `Duelist.buffs` (id → số vòng còn lại) như bản cũ, nên UI và save cũ đọc
 * được nguyên vẹn. Số tầng nằm riêng ở `Duelist.stacks`.
 */

export type StatusKind =
  /** vết thương chảy dần: mất máu, mất sức theo vòng. */
  | "Chấn Thương"
  /** suy giảm khả năng: mù, gãy giáp, chóng mặt. */
  | "Suy Nhược"
  /** khống chế: mất lượt, không rút lui được. */
  | "Khống Chế"
  /** tăng cường: buff tự thân hoặc do đồng đội. */
  | "Tăng Cường"
  /** thế trận: tư thế tạm thời trong một vài vòng. */
  | "Thế Trận";

export interface StatusDef {
  id: string;
  name: string;
  kind: StatusKind;
  /** giải thích cơ chế cho người chơi đọc trên UI. */
  desc: string;
  /** một câu tả cho AI kể lại cho có màu. */
  flavor: string;
  /** số tầng chồng tối đa (1 = không chồng). */
  maxStacks: number;
  /** số vòng mặc định khi bị dính. */
  duration: number;

  // ── hệ số cộng vào chỉ số, TÍNH THEO MỖI TẦNG ──
  /** cộng vào chỉ số đánh trúng của người mang. */
  hitMod?: number;
  /** cộng vào Phòng Thủ (AC) của người mang. */
  acMod?: number;
  /** cộng thẳng vào sát thương người mang gây ra. */
  damageMod?: number;
  /** cộng vào Giảm Sát Thương (giáp) của người mang — âm là bị phá giáp. */
  drMod?: number;
  /** hạ ngưỡng chí mạng (critFrom) của người mang xuống. */
  critBonus?: number;
  /** cộng vào Thăng Bằng hồi mỗi vòng. */
  poiseRegenMod?: number;
  /** HP mất mỗi vòng (số dương = mất). */
  hpPerRound?: number;
  /** Thể Lực mất mỗi vòng (số dương = mất). */
  staminaPerRound?: number;
  /** mất lượt hành động hoàn toàn. */
  skipAction?: boolean;
  /** không thể đổi khoảng cách (bị ghì, bị vây). */
  blocksMove?: boolean;
  /** tầng giảm dần mỗi khi bị đánh trúng thay vì theo vòng. */
  fadesOnHit?: boolean;
}

const S = (
  id: string, kind: StatusKind, maxStacks: number, duration: number,
  desc: string, flavor: string, mods: Partial<StatusDef> = {},
): StatusDef => ({ id, name: id, kind, maxStacks, duration, desc, flavor, ...mods });

export const STATUS_DEFS: Record<string, StatusDef> = {
  // ── CHẤN THƯƠNG ──
  "Chảy Máu": S("Chảy Máu", "Chấn Thương", 5, 4,
    "Mất 2 HP mỗi vòng cho mỗi tầng. Chồng tới 5 tầng — kẻ bị rạch nhiều nhát sẽ kiệt máu mà gục dù chưa trúng đòn chí mạng.",
    "Máu thấm qua lớp áo lót, nhỏ thành vệt trên nền đất.",
    { hpPerRound: 2 }),
  "Trúng Độc": S("Trúng Độc", "Chấn Thương", 3, 6,
    "Mất 3 HP và 2 Thể Lực mỗi vòng cho mỗi tầng. Độc không quan tâm giáp dày mỏng.",
    "Vết cắt tê dại lan ra, mồ hôi lạnh túa trên trán.",
    { hpPerRound: 3, staminaPerRound: 2 }),
  "Bỏng": S("Bỏng", "Chấn Thương", 3, 3,
    "Mất 4 HP mỗi vòng cho mỗi tầng và −1 đánh trúng vì đau rát. Lửa rồng, dầu sôi và lửa hoang đều để lại trạng thái này.",
    "Da phồng rộp, mùi thịt cháy khét bám lấy mũi.",
    { hpPerRound: 4, hitMod: -1 }),
  "Tê Cóng": S("Tê Cóng", "Chấn Thương", 2, 5,
    "−1 đánh trúng và −2 Thăng Bằng hồi mỗi vòng cho mỗi tầng. Ngón tay cứng lại thì cầm kiếm cũng khó.",
    "Bàn tay không còn cảm giác, hơi thở đóng băng trên râu.",
    { hitMod: -1, poiseRegenMod: -2 }),

  // ── SUY NHƯỢC ──
  "Mù Lòa": S("Mù Lòa", "Suy Nhược", 1, 1,
    "−4 đánh trúng khi còn hiệu lực. Cát, máu hay ánh nắng hắt vào mắt đều gây ra được.",
    "Mắt cay xè, thế giới nhoè thành những mảng màu chuyển động.",
    { hitMod: -4 }),
  "Phá Giáp": S("Phá Giáp", "Suy Nhược", 3, 2,
    "−3 Phòng Thủ và −1 Giảm Sát Thương mỗi tầng. Giáp bị bửa ra thì mọi nhát sau đều dễ ăn hơn.",
    "Mảnh giáp vai bật khỏi đinh tán, để hở một khoảng thịt.",
    { acMod: -3, drMod: -1 }),
  "Chóng Mặt": S("Chóng Mặt", "Suy Nhược", 1, 2,
    "−2 đánh trúng, −2 Phòng Thủ. Một cú vào đầu là đủ khiến chân trời nghiêng đi.",
    "Tiếng ù chạy dọc trong sọ, mặt đất chao như boong thuyền.",
    { hitMod: -2, acMod: -2 }),
  "Gãy Tay Cầm Vũ Khí": S("Gãy Tay Cầm Vũ Khí", "Suy Nhược", 1, 99,
    "−3 đánh trúng và −3 sát thương cho tới hết trận. Cánh tay đã gãy thì trận này coi như đánh bằng một tay.",
    "Xương cẳng tay lệch hẳn một góc, vũ khí gần như tuột khỏi tay.",
    { hitMod: -3, damageMod: -3 }),
  "Kiệt Sức": S("Kiệt Sức", "Suy Nhược", 1, 2,
    "−2 đánh trúng, −2 Phòng Thủ, −3 Thăng Bằng hồi mỗi vòng. Dính khi Thể Lực chạm đáy.",
    "Phổi bỏng rát, cánh tay nặng như đeo chì.",
    { hitMod: -2, acMod: -2, poiseRegenMod: -3 }),

  // ── KHỐNG CHẾ ──
  "Choáng": S("Choáng", "Khống Chế", 1, 1,
    "Mất trọn lượt hành động vòng kế. Trạng thái nguy hiểm nhất trong đấu tay đôi.",
    "Cú đánh vào thái dương làm mọi thứ tối sầm trong một nhịp thở.",
    { skipAction: true, acMod: -4 }),
  "Mất Thăng Bằng": S("Mất Thăng Bằng", "Khống Chế", 1, 1,
    "−4 Phòng Thủ và đối thủ dễ chí mạng hơn (−1 ngưỡng). Xảy ra khi thanh Thăng Bằng bị đánh vỡ.",
    "Gót chân trượt, thân người ngả về sau tìm chỗ bấu.",
    { acMod: -4 }),
  "Bị Ghì": S("Bị Ghì", "Khống Chế", 1, 2,
    "Không thể đổi khoảng cách và −3 Phòng Thủ. Chỉ thoát được bằng đòn vật hoặc đợi hết hiệu lực.",
    "Cánh tay đối thủ khoá cứng lấy cổ, mùi mồ hôi và sắt kề sát mặt.",
    { acMod: -3, blocksMove: true }),
  "Khiếp Sợ": S("Khiếp Sợ", "Khống Chế", 2, 3,
    "−2 đánh trúng và −2 sát thương mỗi tầng. Rồng, Others và những kẻ mang danh khét tiếng gây ra được.",
    "Tay run tới mức chuôi kiếm trượt trong lòng bàn tay ướt.",
    { hitMod: -2, damageMod: -2 }),

  // ── TĂNG CƯỜNG ──
  "Cuồng Nộ": S("Cuồng Nộ", "Tăng Cường", 3, 3,
    "+2 sát thương mỗi tầng nhưng −2 Phòng Thủ mỗi tầng. Càng đau càng đánh mạnh, và càng dễ chết.",
    "Máu dồn lên tai, đau đớn biến thành một thứ nhiên liệu.",
    { damageMod: 2, acMod: -2 }),
  "Tập Trung": S("Tập Trung", "Tăng Cường", 2, 2,
    "+2 đánh trúng và −1 ngưỡng chí mạng mỗi tầng. Đổi lấy một vòng không tấn công.",
    "Thế giới thu lại còn đúng một điểm hở trên giáp đối thủ.",
    { hitMod: 2, critBonus: 1 }),
  "Thủ Thế": S("Thủ Thế", "Tăng Cường", 2, 2,
    "+3 Phòng Thủ và +2 Thăng Bằng hồi mỗi vòng cho mỗi tầng.",
    "Khiên nâng ngang mắt, trọng tâm hạ thấp, chờ.",
    { acMod: 3, poiseRegenMod: 2 }),
  "Cơn Thịnh Nộ Rồng": S("Cơn Thịnh Nộ Rồng", "Tăng Cường", 1, 3,
    "+5 sát thương và +1 đánh trúng. Huyết mạch Valyria thức dậy trong máu.",
    "Hơi nóng bốc lên từ da thịt, đồng tử ánh lên sắc đỏ.",
    { damageMod: 5, hitMod: 1 }),
  "second_wind": S("second_wind", "Tăng Cường", 1, 2,
    "+2 đánh trúng — hơi thở thứ hai của kẻ tưởng đã hết sức.",
    "Từ đâu đó sâu trong lồng ngực, một hơi sức mới trào lên.",
    { hitMod: 2 }),
  "Vũ Điệu Nước": S("Vũ Điệu Nước", "Tăng Cường", 1, 2,
    "+2 đánh trúng và +2 Thăng Bằng hồi mỗi vòng. Bộ pháp Braavos không đứng yên bao giờ.",
    "Trọng tâm chảy từ chân này sang chân kia như nước qua đá.",
    { hitMod: 2, poiseRegenMod: 2 }),

  // ── THẾ TRẬN ──
  "Lao Tới": S("Lao Tới", "Thế Trận", 1, 1,
    "Rút ngắn khoảng cách một bậc trong vòng này.",
    "Bước chân dồn nhanh, khoảng trống giữa hai người biến mất.", {}),
  "Rút Lui": S("Rút Lui", "Thế Trận", 1, 1,
    "Kéo giãn khoảng cách một bậc trong vòng này.",
    "Lùi hai bước dài, mũi vũ khí vẫn chĩa về phía trước.", {}),
  "Giữ Tầm": S("Giữ Tầm", "Thế Trận", 1, 1,
    "Chặn đối thủ áp sát trong vòng này — mọi nỗ lực rút ngắn cự ly đều thất bại.",
    "Đuôi giáo chống xuống đất, mũi thép chĩa thẳng vào ngực kẻ muốn bước tới.",
    { poiseRegenMod: 2 }),
};

/** Vật mang trạng thái — trùng hình dạng với Duelist nên engine truyền thẳng. */
export interface StatusCarrier {
  buffs?: Record<string, number>;
  stacks?: Record<string, number>;
  wounds?: string[];
}

/** Tổng hợp mọi hệ số đang bám lên một người — engine chỉ cần gọi hàm này. */
export interface StatusModifiers {
  hit: number;
  ac: number;
  damage: number;
  dr: number;
  critBonus: number;
  poiseRegen: number;
  skipAction: boolean;
  blocksMove: boolean;
}

const ZERO: StatusModifiers = {
  hit: 0, ac: 0, damage: 0, dr: 0, critBonus: 0, poiseRegen: 0,
  skipAction: false, blocksMove: false,
};

export function statusDef(id: string): StatusDef | undefined {
  return STATUS_DEFS[id];
}

/** Số tầng đang mang của một trạng thái (0 = không dính). */
export function statusStacks(t: StatusCarrier, id: string): number {
  if (!t.buffs?.[id] || t.buffs[id] <= 0) {
    // vết thương giải phẫu (Cơ Thể) có thể đẩy tên trạng thái vào `wounds`
    return t.wounds?.includes(id) && STATUS_DEFS[id] ? 1 : 0;
  }
  return Math.max(1, t.stacks?.[id] ?? 1);
}

/**
 * Dính một trạng thái. Nếu đã có thì cộng tầng (tới trần) và LẤY thời hạn dài
 * hơn — đánh thêm một nhát vào vết thương cũ không được rút ngắn thời gian rỉ máu.
 * Trả về true nếu có thay đổi thật (để engine ghi log).
 */
export function applyStatus(
  t: StatusCarrier,
  id: string,
  opts: { stacks?: number; duration?: number } = {},
): boolean {
  const def = STATUS_DEFS[id];
  if (!def) return false;
  t.buffs ??= {};
  t.stacks ??= {};

  const addStacks = Math.max(1, opts.stacks ?? 1);
  const dur = Math.max(1, opts.duration ?? def.duration);
  const had = (t.buffs[id] ?? 0) > 0;
  const cur = had ? Math.max(1, t.stacks[id] ?? 1) : 0;
  const next = Math.min(def.maxStacks, cur + addStacks);

  t.buffs[id] = Math.max(t.buffs[id] ?? 0, dur);
  t.stacks[id] = next;
  return !had || next > cur;
}

/** Gỡ sạch một trạng thái (thuốc giải, băng bó, hết trận). */
export function clearStatus(t: StatusCarrier, id: string): void {
  if (t.buffs) delete t.buffs[id];
  if (t.stacks) delete t.stacks[id];
  if (t.wounds) t.wounds = t.wounds.filter((w) => w !== id);
}

/** Tổng hệ số của mọi trạng thái đang mang (đã nhân số tầng). */
export function statusModifiers(t: StatusCarrier): StatusModifiers {
  const out: StatusModifiers = { ...ZERO };
  const seen = new Set<string>();

  const consume = (id: string, stacks: number) => {
    const def = STATUS_DEFS[id];
    if (!def || stacks <= 0 || seen.has(id)) return;
    seen.add(id);
    out.hit += (def.hitMod ?? 0) * stacks;
    out.ac += (def.acMod ?? 0) * stacks;
    out.damage += (def.damageMod ?? 0) * stacks;
    out.dr += (def.drMod ?? 0) * stacks;
    out.critBonus += (def.critBonus ?? 0) * stacks;
    out.poiseRegen += (def.poiseRegenMod ?? 0) * stacks;
    if (def.skipAction) out.skipAction = true;
    if (def.blocksMove) out.blocksMove = true;
  };

  for (const [id, remaining] of Object.entries(t.buffs ?? {})) {
    if (remaining > 0) consume(id, Math.max(1, t.stacks?.[id] ?? 1));
  }
  // vết thương giải phẫu cũng là trạng thái nếu trùng tên trong sổ
  for (const w of t.wounds ?? []) consume(w, 1);
  return out;
}

export interface StatusTick {
  hpLoss: number;
  staminaLoss: number;
  /** dòng log mô tả những gì trạng thái vừa gây ra. */
  lines: string[];
  /** trạng thái vừa hết hạn trong vòng này. */
  expired: string[];
}

/**
 * Đầu mỗi vòng: trạng thái gây sát thương theo thời gian, rồi tụt một vòng thời
 * hạn. Trả về tổng mất mát để engine tự trừ (hàm này KHÔNG đụng vào HP để phần
 * gọi còn kiểm soát được thứ tự chết).
 */
export function tickStatuses(t: StatusCarrier, name: string): StatusTick {
  const out: StatusTick = { hpLoss: 0, staminaLoss: 0, lines: [], expired: [] };
  if (!t.buffs) return out;

  // vết thương giải phẫu (Cơ Thể) trùng tên trong sổ cũng rỉ máu như trạng thái
  const bleeding = new Set<string>(Object.keys(t.buffs).filter((id) => t.buffs![id] > 0));
  for (const w of t.wounds ?? []) if (STATUS_DEFS[w]) bleeding.add(w);

  for (const id of bleeding) {
    const def = STATUS_DEFS[id];
    if (!def) continue;
    const stacks = Math.max(1, t.stacks?.[id] ?? 1);
    const hp = (def.hpPerRound ?? 0) * stacks;
    const st = (def.staminaPerRound ?? 0) * stacks;
    if (hp > 0) {
      out.hpLoss += hp;
      out.lines.push(`${name} mất ${hp} HP vì ${def.name}${stacks > 1 ? ` (${stacks} tầng)` : ""}`);
    }
    if (st > 0) {
      out.staminaLoss += st;
      out.lines.push(`${name} mất ${st} Thể Lực vì ${def.name}`);
    }
  }

  for (const id of Object.keys(t.buffs)) {
    // `buffs` còn chứa cờ nội bộ của engine (ROUND_AC_MOD, second_wind_used…).
    // Chỉ những khoá CÓ trong sổ trạng thái mới đếm ngược thời hạn.
    if (!STATUS_DEFS[id]) continue;
    if (t.buffs[id] > 0) {
      t.buffs[id]--;
      if (t.buffs[id] <= 0) {
        out.expired.push(id);
        delete t.buffs[id];
        if (t.stacks) delete t.stacks[id];
      }
    }
  }
  return out;
}

/** Dòng giới thiệu một trạng thái cho UI/tooltip. */
export function describeStatus(id: string): string {
  const def = STATUS_DEFS[id];
  if (!def) return id;
  return `${def.name} — ${def.desc}`;
}

/** Danh sách trạng thái theo loại, cho màn giới thiệu cơ chế. */
export const STATUS_BY_KIND: Record<StatusKind, StatusDef[]> = Object.values(STATUS_DEFS).reduce(
  (acc, s) => {
    (acc[s.kind] ||= []).push(s);
    return acc;
  },
  {} as Record<StatusKind, StatusDef[]>,
);
