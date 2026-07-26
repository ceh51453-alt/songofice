/**
 * tourneyEngine — Engine thi đấu đại hội.
 *
 * 5 nội dung: Joust, Melee, Archery, Horse Race, Sword Duel.
 * Mỗi nội dung có cơ chế riêng, dùng chỉ số nhân vật (stat) + RNG.
 * AI NPC opponents có skill level cố định.
 */
import { makeRng, type RNG } from "../probability/rng";
import {
  TOURNEY_EVENTS,
  GENERIC_TOURNEY_NPCS,
  getAliveNPCs,
  getNPCsForTourney,
  type TourneyEventType,
  type TourneyNPC,
  type CanonTourney,
} from "../content/westeros/tourneyData";

// ═══════════════════════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface PlayerStats {
  sucManh: number;     // Sức Mạnh (1-20)
  nhanhNhen: number;   // Nhanh Nhẹn (1-20)
  theChat: number;     // Thể Chất (1-20)
  triTue: number;      // Trí Tuệ (1-20)
  tinhTuong: number;   // Tinh Tường (1-20)
  uyTin: number;       // Uy Tín (1-20)
  /** Cấp kỹ năng liên quan (0-10). */
  skillLevel: number;
}

export interface TourneyMatchResult {
  roundNum: number;
  opponentName: string;
  opponentTitle: string;
  playerScore: number;
  opponentScore: number;
  winner: "player" | "opponent" | "draw";
  narration: string;
}

export interface TourneyEventState {
  type: TourneyEventType;
  matches: TourneyMatchResult[];
  currentRound: number;
  totalRounds: number;
  eliminated: boolean;
  /** Vị trí cuối cùng (1 = nhất). */
  finalPlace: number | null;
  phase: "ready" | "fighting" | "done";
}

export interface TourneyState {
  /** ID đại hội canon (hoặc "custom"). */
  tourneyId: string;
  tourneyName: string;
  location: string;
  /** Năm AC của đại hội (dùng để lọc NPC). */
  gameYear: number;
  /** Nội dung đã đăng ký thi. */
  registeredEvents: TourneyEventType[];
  /** Nội dung đang thi. */
  activeEvent: TourneyEventState | null;
  /** Kết quả các nội dung đã thi xong. */
  completedEvents: TourneyEventState[];
  /** Tổng Vàng thưởng. */
  totalGoldWon: number;
  /** Tổng Uy Dũng thưởng. */
  totalGloryWon: number;
  /** Hệ số thưởng (từ đại hội). */
  prizeMultiplier: number;
  phase: "menu" | "competing" | "results" | "done";
}

// ═══════════════════════════════════════════════════════════════
//  ENGINE — tạo state, thi đấu từng vòng
// ═══════════════════════════════════════════════════════════════

export function createTourneyState(
  tourney: CanonTourney | { id: string; name: string; location: string; events: TourneyEventType[]; prizeMultiplier: number; year?: number },
  gameYear?: number,
): TourneyState {
  return {
    tourneyId: tourney.id,
    tourneyName: tourney.name,
    location: tourney.location,
    gameYear: ("year" in tourney && tourney.year) ? tourney.year : (gameYear ?? 298),
    registeredEvents: [],
    activeEvent: null,
    completedEvents: [],
    totalGoldWon: 0,
    totalGloryWon: 0,
    prizeMultiplier: tourney.prizeMultiplier,
    phase: "menu",
  };
}

/** Đăng ký thi nội dung. */
export function registerEvent(state: TourneyState, eventType: TourneyEventType): TourneyState {
  if (state.registeredEvents.includes(eventType)) return state;
  return { ...state, registeredEvents: [...state.registeredEvents, eventType] };
}

/** Bắt đầu thi 1 nội dung. */
export function startEvent(state: TourneyState, eventType: TourneyEventType): TourneyState {
  const info = TOURNEY_EVENTS[eventType];
  const eventState: TourneyEventState = {
    type: eventType,
    matches: [],
    currentRound: 0,
    totalRounds: info.rounds,
    eliminated: false,
    finalPlace: null,
    phase: "ready",
  };
  return { ...state, activeEvent: eventState, phase: "competing" };
}

/** Fallback NPC khi không có ai sống ở era này. */
const FALLBACK_NPC: TourneyNPC = {
  name: "Kỵ sĩ vô danh",
  house: "Không Nhà",
  skill: 50,
  title: "Chiến binh không tên",
  birthYear: -9999,
  deathYear: null,
};

/**
 * Chọn đối thủ cho vòng — CHỈ chọn NPC còn sống tại năm đại hội.
 * Đại hội canon → dùng getNPCsForTourney (lọc canonOnly).
 * Custom/không xác định → dùng getAliveNPCs.
 * Đã loại những NPC đã đấu vòng trước (tránh trùng).
 */
function pickOpponent(
  eventType: TourneyEventType,
  round: number,
  totalRounds: number,
  tourney: CanonTourney | null,
  rng: RNG,
  gameYear: number,
  alreadyFought: string[],
): TourneyNPC {
  // Lấy pool NPC phù hợp với năm game
  let pool = tourney
    ? getNPCsForTourney(tourney)
    : getAliveNPCs(gameYear);

  // Loại trừ NPC đã đấu vòng trước
  if (alreadyFought.length > 0) {
    const fought = new Set(alreadyFought);
    pool = pool.filter((npc) => !fought.has(npc.name));
  }

  // Fallback nếu pool rỗng
  if (pool.length === 0) return FALLBACK_NPC;

  // Vòng cuối → đối thủ mạnh nhất, vòng đầu → yếu hơn
  const difficultyFactor = (round + 1) / totalRounds; // 0.25 → 1.0

  const sorted = [...pool].sort((a, b) => a.skill - b.skill);
  const targetIdx = Math.floor(difficultyFactor * (sorted.length - 1));
  const range = Math.min(3, Math.floor(sorted.length / 3) + 1);
  const minIdx = Math.max(0, targetIdx - range);
  const maxIdx = Math.min(sorted.length - 1, targetIdx + range);
  const idx = minIdx + Math.floor(rng() * (maxIdx - minIdx + 1));
  return sorted[idx];
}

/** Tính điểm người chơi cho 1 lượt thi. */
function calculatePlayerScore(
  eventType: TourneyEventType,
  stats: PlayerStats,
  rng: RNG,
): number {
  const info = TOURNEY_EVENTS[eventType];
  const primary = getStatValue(stats, info.primaryStat);
  const secondary = getStatValue(stats, info.secondaryStat);
  const skillBonus = stats.skillLevel * 3; // kỹ năng x3

  // Base = primary*4 + secondary*2 + skill*3 + random(0-20)
  const base = primary * 4 + secondary * 2 + skillBonus;
  const randomFactor = Math.floor(rng() * 21);

  return base + randomFactor;
}

/** Tính điểm NPC. */
function calculateOpponentScore(
  npc: TourneyNPC,
  rng: RNG,
): number {
  // NPC skill (0-100) + random(0-20)
  return npc.skill + Math.floor(rng() * 21);
}

function getStatValue(stats: PlayerStats, statName: string): number {
  switch (statName) {
    case "Sức Mạnh": return stats.sucManh;
    case "Nhanh Nhẹn": return stats.nhanhNhen;
    case "Thể Chất": return stats.theChat;
    case "Trí Tuệ": return stats.triTue;
    case "Tinh Tường": return stats.tinhTuong;
    case "Uy Tín": return stats.uyTin;
    default: return 10;
  }
}

/** Tạo narration cho kết quả. */
function generateNarration(
  eventType: TourneyEventType,
  playerWon: boolean,
  opponent: TourneyNPC,
  round: number,
  totalRounds: number,
): string {
  const isFinale = round === totalRounds - 1;
  const info = TOURNEY_EVENTS[eventType];

  switch (eventType) {
    case "joust": {
      if (playerWon) {
        if (isFinale) return `Ngọn thương xuyên thẳng vào khiên ${opponent.name} — hắn bay khỏi yên! Ngươi giành chiến thắng chung cuộc!`;
        return `Ngươi hạ ${opponent.name} (${opponent.title}) khỏi ngựa trong tiếng reo hò!`;
      }
      return `${opponent.name} phi thương trúng ngực ngươi — ngươi lao xuống đất trong tiếng thở dài.`;
    }
    case "melee": {
      if (playerWon) {
        if (isFinale) return `Sau trận hỗn chiến, ngươi đứng vững giữa bãi chiến trường — kẻ cuối cùng đứng vững!`;
        return `Ngươi hạ gục ${opponent.name} bằng một nhát chém dứt khoát!`;
      }
      return `${opponent.name} quật ngươi xuống — ngươi gục ngã trong bụi bẩn.`;
    }
    case "archery": {
      if (playerWon) {
        if (isFinale) return `Mũi tên bay thẳng vào hồng tâm! Ngươi là xạ thủ giỏi nhất đại hội!`;
        return `Mũi tên của ngươi chính xác hơn ${opponent.name}!`;
      }
      return `${opponent.name} bắn trúng hồng tâm — mũi tên ngươi lệch mục tiêu.`;
    }
    case "horse-race": {
      if (playerWon) return `Ngựa ngươi vượt qua vạch đích trước — gió vù vù bên tai!`;
      return `Ngựa ${opponent.name} nhanh hơn — ngươi về sau trong cuộc đua.`;
    }
    case "sword-duel": {
      if (playerWon) {
        if (isFinale) return `Kiếm ngươi chạm vai ${opponent.name} — hắn quỳ gối nhận thua! Đại thắng!`;
        return `Ngươi đánh bại ${opponent.name} trong một trận đấu đầy kịch tính!`;
      }
      return `${opponent.name} nhanh hơn — kiếm hắn dừng lại ở cổ ngươi. Ngươi thua.`;
    }
    default: return playerWon ? "Ngươi thắng!" : "Ngươi thua.";
  }
}

/** Thi đấu 1 vòng. */
export function playTourneyRound(
  state: TourneyState,
  playerStats: PlayerStats,
  seed: number,
  tourneyData?: CanonTourney | null,
): TourneyState {
  if (!state.activeEvent || state.activeEvent.phase === "done") return state;

  const event = state.activeEvent;
  const rng = makeRng(seed);
  const round = event.currentRound;

  // Danh sách đối thủ đã đấu (tránh trùng)
  const alreadyFought = event.matches.map((m) => m.opponentName);

  const opponent = pickOpponent(
    event.type, round, event.totalRounds, tourneyData ?? null, rng,
    state.gameYear, alreadyFought,
  );

  const playerScore = calculatePlayerScore(event.type, playerStats, rng);
  const opponentScore = calculateOpponentScore(opponent, rng);

  const winner: "player" | "opponent" | "draw" =
    playerScore > opponentScore ? "player" : opponentScore > playerScore ? "opponent" : "draw";

  const narration = generateNarration(
    event.type, winner === "player", opponent, round, event.totalRounds,
  );

  const match: TourneyMatchResult = {
    roundNum: round,
    opponentName: opponent.name,
    opponentTitle: opponent.title,
    playerScore,
    opponentScore,
    winner,
    narration,
  };

  const newMatches = [...event.matches, match];
  const nextRound = round + 1;
  const eliminated = winner === "opponent"; // thua = loại (trừ draw)

  let finalPlace: number | null = null;
  let eventDone = false;

  if (eliminated) {
    // Bị loại → vị trí = tổng - vòng hiện tại
    finalPlace = event.totalRounds - round + 1;
    eventDone = true;
  } else if (nextRound >= event.totalRounds) {
    // Thắng hết = nhất
    finalPlace = 1;
    eventDone = true;
  }

  const updatedEvent: TourneyEventState = {
    ...event,
    matches: newMatches,
    currentRound: nextRound,
    eliminated,
    finalPlace,
    phase: eventDone ? "done" : "fighting",
  };

  // Nếu xong → tính thưởng
  if (eventDone) {
    const info = TOURNEY_EVENTS[event.type];
    let goldWon = 0;
    let gloryWon = 0;

    if (finalPlace === 1) {
      goldWon = Math.round(info.goldPrize * state.prizeMultiplier);
      gloryWon = info.gloryReward;
    } else if (finalPlace === 2) {
      goldWon = Math.round(info.goldPrize * state.prizeMultiplier * 0.4);
      gloryWon = Math.round(info.gloryReward * 0.4);
    } else if (finalPlace === 3) {
      goldWon = Math.round(info.goldPrize * state.prizeMultiplier * 0.15);
      gloryWon = Math.round(info.gloryReward * 0.15);
    }

    return {
      ...state,
      activeEvent: updatedEvent,
      completedEvents: [...state.completedEvents, updatedEvent],
      totalGoldWon: state.totalGoldWon + goldWon,
      totalGloryWon: state.totalGloryWon + gloryWon,
      phase: "results",
    };
  }

  return { ...state, activeEvent: updatedEvent };
}

/** Hoàn tất nội dung, quay về menu chọn nội dung tiếp. */
export function finishEvent(state: TourneyState): TourneyState {
  const remaining = state.registeredEvents.filter(
    (e) => !state.completedEvents.some((c) => c.type === e),
  );
  if (remaining.length === 0) {
    return { ...state, activeEvent: null, phase: "done" };
  }
  return { ...state, activeEvent: null, phase: "menu" };
}

/** Kết thúc đại hội. */
export function finishTourney(state: TourneyState): TourneyState {
  return { ...state, phase: "done" };
}
