/**
 * coinFlip — Engine "Đồng Xu Vận Mệnh" (Coin Flip Tournament):
 *
 * Không phải tung xu đơn giản — đây là tournament 5 vòng với cơ chế:
 * - Vòng 1-2: Đoán sấp/ngửa đơn giản (1x tiền)
 * - Vòng 3: Đoán 2 xu liên tiếp (2x tiền)
 * - Vòng 4: Đoán 3 xu liên tiếp (4x tiền)
 * - Vòng 5: Đoán đúng tổng sấp/ngửa trong 5 xu (8x tiền)
 *
 * Người chơi có thể dừng sớm (cash out) sau bất kỳ vòng nào.
 * Thua 1 vòng = mất hết.
 */
import { makeRng, type RNG } from "../probability/rng";

export type CoinSide = "heads" | "tails";

export interface CoinRound {
  roundNum: number;
  /** Dự đoán của người chơi. */
  playerGuess: CoinSide | CoinSide[] | number;
  /** Kết quả thật. */
  actual: CoinSide[];
  correct: boolean;
  /** Multiplier nếu thắng. */
  multiplier: number;
}

export interface CoinFlipState {
  rounds: CoinRound[];
  currentRound: number;
  /** Hệ số nhân hiện tại (tích luỹ). */
  currentMultiplier: number;
  phase: "guessing" | "revealed" | "cashed-out" | "done";
  result: "win" | "lose" | null;
  /** Loại câu hỏi vòng hiện tại. */
  roundType: "single" | "double" | "triple" | "count";
}

export function createCoinFlip(): CoinFlipState {
  return {
    rounds: [],
    currentRound: 0,
    currentMultiplier: 1,
    phase: "guessing",
    result: null,
    roundType: "single",
  };
}

function getRoundType(roundNum: number): "single" | "double" | "triple" | "count" {
  if (roundNum <= 1) return "single";
  if (roundNum === 2) return "double";
  if (roundNum === 3) return "triple";
  return "count";
}

function getRoundMultiplier(roundNum: number): number {
  if (roundNum <= 1) return 1;
  if (roundNum === 2) return 2;
  if (roundNum === 3) return 4;
  return 8;
}

/** Tung xu. */
function flipCoins(count: number, rng: RNG): CoinSide[] {
  return Array.from({ length: count }, () => rng() < 0.5 ? "heads" : "tails");
}

/**
 * Đoán cho round hiện tại.
 * - single/double/triple: guess là CoinSide[] (chuỗi đoán)
 * - count: guess là number (đoán tổng "heads" trong 5 xu)
 */
export function playCoinGuess(
  state: CoinFlipState,
  guess: CoinSide | CoinSide[] | number,
  seed: number,
): CoinFlipState {
  if (state.phase !== "guessing" || state.currentRound >= 5) return state;

  const rng = makeRng(seed);
  const roundNum = state.currentRound;
  const roundType = getRoundType(roundNum);
  const multiplier = getRoundMultiplier(roundNum);

  let actual: CoinSide[];
  let correct: boolean;

  switch (roundType) {
    case "single": {
      actual = flipCoins(1, rng);
      correct = actual[0] === guess;
      break;
    }
    case "double": {
      actual = flipCoins(2, rng);
      const guessArr = Array.isArray(guess) ? guess : [guess];
      correct = actual.every((a, i) => a === guessArr[i]);
      break;
    }
    case "triple": {
      actual = flipCoins(3, rng);
      const guessArr = Array.isArray(guess) ? guess : [guess];
      correct = actual.every((a, i) => a === guessArr[i]);
      break;
    }
    case "count": {
      actual = flipCoins(5, rng);
      const headsCount = actual.filter((a) => a === "heads").length;
      correct = headsCount === guess;
      break;
    }
  }

  const round: CoinRound = { roundNum, playerGuess: guess, actual, correct, multiplier };
  const newRounds = [...state.rounds, round];
  const nextRound = state.currentRound + 1;

  if (!correct) {
    // Thua → mất hết
    return {
      ...state, rounds: newRounds, currentRound: nextRound,
      phase: "done", result: "lose", roundType: getRoundType(nextRound),
    };
  }

  const newMultiplier = state.currentMultiplier * multiplier;

  if (nextRound >= 5) {
    // Thắng tất cả 5 vòng!
    return {
      ...state, rounds: newRounds, currentRound: nextRound,
      currentMultiplier: newMultiplier, phase: "done", result: "win",
      roundType: getRoundType(nextRound),
    };
  }

  return {
    ...state, rounds: newRounds, currentRound: nextRound,
    currentMultiplier: newMultiplier, phase: "guessing", result: null,
    roundType: getRoundType(nextRound),
  };
}

/** Cash out — dừng sớm, nhận thưởng theo multiplier hiện tại. */
export function cashOut(state: CoinFlipState): CoinFlipState {
  if (state.phase !== "guessing" || state.currentRound === 0) return state;
  return { ...state, phase: "cashed-out", result: "win" };
}
