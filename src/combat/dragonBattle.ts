/**
 * TẦNG KHÔNG (M23) — rồng tham chiến THẬT trong đại chiến và vây thành.
 *
 * Trước M23 rồng chỉ là một con số nhân vào chiến lực, cộng đúng một nút bấm
 * "Dracarys!" gây thêm sát thương. Con rồng không có máu, không bao giờ bị
 * thương, không bao giờ chết, và không ai dưới đất làm gì được nó. Cả một lớp
 * đặc trưng nhất của thế giới này rút lại thành một hệ số.
 *
 * File này dựng TẦNG KHÔNG chạy song song với mặt đất:
 *
 *   • Mỗi con rồng ra trận là một thực thể có MÁU, có hồi chiêu hơi lửa, có
 *     ĐỘ CAO do người chơi chọn. Bay thấp thì lửa chính xác và tàn khốc, nhưng
 *     phơi mình cho nỏ bắn rồng; bay cao thì an toàn mà đốt chẳng trúng ai.
 *   • NỎ BẮN RỒNG (scorpion) là câu trả lời của mặt đất. Xây ụ nỏ trong lãnh
 *     địa hoặc mang theo quân công thành thì rồng địch phải trả giá. Meraxes
 *     ngã xuống Hellholt vì đúng một mũi lao như thế.
 *   • Rồng bị thương thì yếu hẳn và có thể bỏ chạy; rồng bị hạ thì KỴ SĨ RƠI —
 *     và đó thường là cái chết của một nhân vật, không chỉ của một con thú.
 *
 * Hàm thuần, tất định theo seed.
 */
import type { Dragon } from "../mvu/schema";
import type { RNG } from "../probability/rng";
import { clamp } from "../mvu/helpers";
import { dragonPower } from "./dragon";
import type { WeatherCondition } from "./battleResolver";

export type DragonAltitude = "Cao" | "Thấp";

export const ALTITUDE_INTRO: Record<DragonAltitude, string> = {
  "Cao": "Bay trên tầm nỏ. Gần như không thể bị bắn trúng, nhưng lửa rơi tản mát và phần lớn liếm vào đất trống.",
  "Thấp": "Sà xuống sát ngọn giáo. Lửa quét đúng hàng quân và tàn khốc gấp bội — đổi lại mọi ụ nỏ trong tầm đều nhắm vào ngươi.",
};

export interface BattleDragon {
  /** khoá trong bảng "Rồng" của state — để ghi thương tích ngược lại sau trận. */
  key: string;
  name: string;
  rider?: string;
  size: Dragon["Kích Cỡ"];
  heads: number;
  specialPower?: Dragon["Năng Lực Đặc Biệt"];
  /** sức chiến đấu quy đổi (combat/dragon.dragonPower). */
  power: number;
  hp: number;
  maxHp: number;
  wounded: boolean;
  /** bị hạ — rơi xuống đất, hết trận. */
  downed: boolean;
  /** đã bỏ chạy khỏi chiến trường. */
  fled: boolean;
  /** số vòng còn phải chờ mới phun được lửa tiếp. */
  breathCooldown: number;
  altitude: DragonAltitude;
}

/** Dựng thực thể chiến đấu từ một con rồng trong state. */
export function makeBattleDragon(key: string, d: Dragon, altitude: DragonAltitude = "Thấp"): BattleDragon {
  return {
    key,
    name: d["Tên"] || key,
    rider: d["Kỵ Sĩ"] || undefined,
    size: d["Kích Cỡ"],
    heads: d["Số Đầu"] ?? 1,
    specialPower: d["Năng Lực Đặc Biệt"],
    power: dragonPower(d),
    hp: d["_HP"],
    maxHp: Math.max(1, d["_HP Tối Đa"]),
    wounded: d["Tình Trạng"] === "Bị Thương",
    downed: d["_HP"] <= 0,
    fled: false,
    breathCooldown: 0,
    altitude,
  };
}

/** Rồng còn bay được và còn đánh được. */
export function dragonActive(d: BattleDragon): boolean {
  return !d.downed && !d.fled && d.hp > 0;
}

/** Sức thật lúc này: bị thương và mất máu đều kéo xuống. */
export function effectivePower(d: BattleDragon): number {
  if (!dragonActive(d)) return 0;
  const hpFrac = Math.max(0.25, d.hp / d.maxHp);
  return d.power * hpFrac * (d.wounded ? 0.55 : 1);
}

// ── HƠI LỬA ─────────────────────────────────────────────────────────────────

/** Số vòng phải chờ giữa hai lần khạc lửa — rồng càng lớn càng lâu nạp. */
const BREATH_COOLDOWN: Record<Dragon["Kích Cỡ"], number> = {
  "Mới Nở": 1,
  "Ấu Long": 1,
  "Non": 1,
  "Trưởng Thành": 2,
  "Cổ Long": 2,
  "Khổng Lồ (Balerion-class)": 2,
};

const WEATHER_FIRE: Record<WeatherCondition, number> = {
  "Trời Quang": 1.0,
  "Sương Mù": 0.7,
  "Mưa Lớn": 0.55,
  "Bão Tuyết": 0.45,
};

export interface DragonStrike {
  dragon: string;
  /** sát thương quy ra số quân bị thiêu (hoặc điểm phá tường khi vây thành). */
  damage: number;
  /** sĩ khí đối phương mất. */
  moraleShock: number;
  log: string;
  /** chiêu không ra được (còn nạp lửa / bay quá cao). */
  fizzled?: boolean;
}

/**
 * Một con rồng khạc lửa vào mục tiêu dưới đất.
 *
 * `targetScale` là quy mô mục tiêu (số quân của cánh bị đốt, hoặc máu đoạn
 * tường). Sát thương tính theo SỨC RỒNG chứ không theo quân số của phe sở hữu —
 * một con Vhagar không cần đạo quân nào đứng sau lưng.
 */
export function dragonBreath(
  rng: RNG,
  d: BattleDragon,
  weather: WeatherCondition,
  opts: { vsWall?: boolean } = {},
): DragonStrike {
  if (!dragonActive(d)) {
    return { dragon: d.name, damage: 0, moraleShock: 0, fizzled: true, log: `${d.name} không còn bay được.` };
  }
  if (d.breathCooldown > 0) {
    return {
      dragon: d.name, damage: 0, moraleShock: 0, fizzled: true,
      log: `${d.name} còn đang nạp lửa (${d.breathCooldown} vòng nữa).`,
    };
  }

  const altF = d.altitude === "Thấp" ? 1.0 : 0.4;
  const wx = WEATHER_FIRE[weather] ?? 1;
  const roll = 0.8 + rng() * 0.4;
  const specialF = d.specialPower === "Băng Diệm" && (weather === "Bão Tuyết" || weather === "Mưa Lớn") ? 1.45
    : d.specialPower === "Lôi Tức" && weather === "Mưa Lớn" ? 1.35
      : d.specialPower === "Độc Vụ" && !opts.vsWall ? 1.12
        : d.specialPower === "Hỏa Ngục" && opts.vsWall ? 1.25
          : 1;
  const base = effectivePower(d) * 900 * altF * wx * roll * specialF;
  // tường đá không cháy như hàng quân — lửa rồng phá cổng và tháp, không phá đá
  const damage = Math.round(opts.vsWall ? base * 0.45 : base);
  const moraleShock = Math.round((d.altitude === "Thấp" ? 22 : 9) * (0.6 + effectivePower(d)) *
    (d.specialPower === "Long Uy" ? 1.5 : d.specialPower === "Ảnh Diệm" ? 1.25 : 1));

  d.breathCooldown = BREATH_COOLDOWN[d.size] ?? 2;

  return {
    dragon: d.name,
    damage,
    moraleShock,
    log: d.altitude === "Thấp"
      ? `🔥 ${d.name}${d.heads > 1 ? ` đồng loạt há ${d.heads} miệng` : ""} sà xuống sát ngọn giáo và quét ${d.specialPower ? `hơi thở ${d.specialPower}` : "một vệt lửa"} dọc hàng quân — ${damage} người gục xuống.`
      : `🔥 ${d.name} thả ${d.specialPower ? `hơi thở ${d.specialPower}` : "lửa"} từ trên cao; phần lớn rơi vào đất trống, ${damage} người trúng.`,
  };
}

// ── NỎ BẮN RỒNG ─────────────────────────────────────────────────────────────

/** Rồng càng to càng dễ trúng — mục tiêu lớn hơn, xoay chậm hơn. */
const SIZE_HIT_BONUS: Record<Dragon["Kích Cỡ"], number> = {
  "Mới Nở": -0.12,
  "Ấu Long": -0.09,
  "Non": -0.06,
  "Trưởng Thành": 0.0,
  "Cổ Long": 0.04,
  "Khổng Lồ (Balerion-class)": 0.07,
};

export interface ScorpionResult {
  hits: number;
  downed: string[];
  wounded: string[];
  /** kỵ sĩ rơi khỏi lưng rồng bị hạ. */
  ridersLost: string[];
  log: string[];
}

/**
 * Loạt nỏ bắn rồng từ mặt đất. Mỗi ụ nỏ bắn một lao mỗi vòng.
 *
 * Xác suất trúng rất thấp khi rồng bay cao (đây là điều khiến rồng gần như bất
 * khả xâm phạm trong lịch sử Westeros), nhưng khi con rồng sà xuống để đốt cho
 * hiệu quả thì cửa trúng mở ra hẳn — và một mũi trúng chỗ hiểm là đủ.
 */
export function scorpionVolley(
  rng: RNG,
  scorpions: number,
  dragons: BattleDragon[],
  weather: WeatherCondition,
): ScorpionResult {
  const res: ScorpionResult = { hits: 0, downed: [], wounded: [], ridersLost: [], log: [] };
  const targets = dragons.filter(dragonActive);
  if (scorpions <= 0 || targets.length === 0) return res;

  // sương mù và bão tuyết làm xạ thủ không ngắm nổi
  const visibility = weather === "Sương Mù" ? 0.5 : weather === "Bão Tuyết" ? 0.6 : weather === "Mưa Lớn" ? 0.8 : 1;

  for (let i = 0; i < scorpions; i++) {
    const target = targets[Math.floor(rng() * targets.length)];
    if (!dragonActive(target)) continue;
    const baseChance = target.altitude === "Thấp" ? 0.22 : 0.05;
    const chance = clamp((baseChance + SIZE_HIT_BONUS[target.size]) * visibility, 0.01, 0.45);
    if (rng() >= chance) continue;

    res.hits++;
    const dmg = Math.round(target.maxHp * (0.12 + rng() * 0.16));
    target.hp = Math.max(0, target.hp - dmg);

    // trúng chỗ hiểm: mắt, họng, khớp cánh
    const vital = rng() < 0.18;
    if (vital || target.hp <= 0) {
      target.hp = 0;
      target.downed = true;
      res.downed.push(target.name);
      res.log.push(
        vital
          ? `🎯 Một mũi lao xuyên qua ${rng() < 0.5 ? "hốc mắt" : "cuống họng"} ${target.name}! Con rồng lộn nhào và rơi xuống như một quả núi.`
          : `${target.name} trúng quá nhiều lao, cánh gập lại và đâm xuống đất.`,
      );
      if (target.rider) {
        // kỵ sĩ hiếm khi sống sót sau một cú rơi từ độ cao ấy
        if (rng() < 0.65) {
          res.ridersLost.push(target.rider);
          res.log.push(`Kỵ sĩ ${target.rider} rơi theo con rồng.`);
        } else {
          res.log.push(`Kỵ sĩ ${target.rider} bằng cách nào đó bò ra khỏi đống vảy còn bốc khói.`);
        }
      }
    } else {
      if (!target.wounded) {
        target.wounded = true;
        res.wounded.push(target.name);
        res.log.push(`Một mũi lao găm vào sườn ${target.name} — con rồng rống lên và mất đà.`);
      } else {
        res.log.push(`${target.name} trúng thêm một mũi lao nữa (còn ${target.hp}/${target.maxHp}).`);
      }
      // rồng bị thương nặng thì bản năng thắng mệnh lệnh
      if (target.hp < target.maxHp * 0.3 && rng() < 0.35) {
        target.fled = true;
        res.log.push(`${target.name} không nghe lời nữa — nó vọt lên và bay mất về phía chân trời.`);
      }
    }
  }
  return res;
}

// ── RỒNG ĐỐI RỒNG TRÊN CHIẾN TRƯỜNG ────────────────────────────────────────

export interface AirClashResult {
  log: string[];
  playerDowned: string[];
  enemyDowned: string[];
}

/**
 * Khi cả hai phe có rồng, chúng đánh nhau TRƯỚC khi kịp đốt bộ binh — đó là lý
 * do các trận có rồng hai bên lại ít thương vong dưới đất hơn người ta tưởng.
 */
export function airClash(
  rng: RNG,
  player: BattleDragon[],
  enemy: BattleDragon[],
): AirClashResult {
  const res: AirClashResult = { log: [], playerDowned: [], enemyDowned: [] };
  const a = player.filter(dragonActive);
  const b = enemy.filter(dragonActive);
  if (a.length === 0 || b.length === 0) return res;

  res.log.push("Hai bầy rồng lao vào nhau trên đầu hai đạo quân — cả chiến trường ngửa mặt nhìn lên.");
  const pairs = Math.min(a.length, b.length);
  for (let i = 0; i < pairs; i++) {
    const x = a[i];
    const y = b[i];
    const px = effectivePower(x);
    const py = effectivePower(y);
    const ratio = px / Math.max(0.01, px + py);
    const roll = rng();

    const bite = (winner: BattleDragon, loser: BattleDragon, side: "player" | "enemy") => {
      const dmg = Math.round(loser.maxHp * (0.2 + rng() * 0.3));
      loser.hp = Math.max(0, loser.hp - dmg);
      if (loser.hp <= 0) {
        loser.downed = true;
        (side === "player" ? res.enemyDowned : res.playerDowned).push(loser.name);
        res.log.push(`${winner.name} khoá cổ ${loser.name} giữa không trung; cả hai rơi xoáy xuống và chỉ một con bay lên lại.`);
        if (loser.rider && rng() < 0.7) res.log.push(`Kỵ sĩ ${loser.rider} không kịp thoát.`);
      } else {
        if (!loser.wounded) loser.wounded = true;
        res.log.push(`${winner.name} cắn rách màng cánh ${loser.name} (còn ${loser.hp}/${loser.maxHp}).`);
      }
      // đánh nhau trên không thì cả hai đều tốn hơi
      winner.breathCooldown = Math.max(winner.breathCooldown, 1);
      loser.breathCooldown = Math.max(loser.breathCooldown, 1);
    };

    if (roll < ratio * 0.75) bite(x, y, "player");
    else if (roll > 1 - (1 - ratio) * 0.75) bite(y, x, "enemy");
    else {
      res.log.push(`${x.name} và ${y.name} quần nhau một vòng rồi tách ra, không con nào chiếm được thế trên.`);
      x.breathCooldown = Math.max(x.breathCooldown, 1);
      y.breathCooldown = Math.max(y.breathCooldown, 1);
    }
  }
  return res;
}

/** Đầu mỗi vòng: hạ hồi chiêu hơi lửa. */
export function tickDragons(dragons: BattleDragon[]): void {
  for (const d of dragons) {
    if (d.breathCooldown > 0) d.breathCooldown--;
  }
}

/** Tóm tắt tầng không cho UI và cho AI kể. */
export function describeAir(player: BattleDragon[], enemy: BattleDragon[]): string {
  const line = (list: BattleDragon[], who: string) => {
    if (list.length === 0) return `${who}: không có rồng`;
    return `${who}: ` + list.map((d) => {
      const state = d.downed ? "ĐÃ RƠI" : d.fled ? "bỏ chạy" : `${d.hp}/${d.maxHp}${d.wounded ? " (bị thương)" : ""} · bay ${d.altitude}${d.breathCooldown > 0 ? ` · nạp lửa ${d.breathCooldown}` : ""}`;
      return `${d.name} [${state}]`;
    }).join(", ");
  };
  return [line(player, "Rồng ta"), line(enemy, "Rồng địch")].join("\n");
}

/** Thay đổi cần ghi ngược vào bảng "Rồng" của state sau trận. */
export interface DragonAftermath {
  key: string;
  hp: number;
  status: Dragon["Tình Trạng"];
  dead: boolean;
  riderLost?: string;
}

export function dragonAftermath(dragons: BattleDragon[], ridersLost: string[]): DragonAftermath[] {
  return dragons.map((d) => ({
    key: d.key,
    hp: d.hp,
    status: d.downed ? "Bị Thương" : d.wounded ? "Bị Thương" : d.fled ? "Kiệt Sức" : "Khỏe",
    dead: d.downed,
    riderLost: d.rider && ridersLost.includes(d.rider) ? d.rider : undefined,
  }));
}
