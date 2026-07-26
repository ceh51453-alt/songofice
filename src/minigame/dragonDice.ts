/**
 * dragonDice — Engine "Xúc Xắc Rồng": tung 3 xúc xắc 6 mặt, so tổng.
 * Best of 3 rounds. RNG seed-based.
 */
import { makeRng, type RNG } from "../probability/rng";

export interface DiceRound {
  playerDice: [number, number, number];
  aiDice: [number, number, number];
  playerTotal: number;
  aiTotal: number;
  winner: "player" | "ai" | "draw";
}

export interface DragonDiceState {
  rounds: DiceRound[];
  currentRound: number;
  phase: "ready" | "rolling" | "done";
  result: "win" | "lose" | "draw" | null;
}

function rollThree(rng: RNG): [number, number, number] {
  return [
    1 + Math.floor(rng() * 6),
    1 + Math.floor(rng() * 6),
    1 + Math.floor(rng() * 6),
  ];
}

/** Khởi tạo game Xúc Xắc Rồng. */
export function createDragonDice(): DragonDiceState {
  return {
    rounds: [],
    currentRound: 0,
    phase: "ready",
    result: null,
  };
}

/** Tung xúc xắc 1 round. */
export function rollDragonDice(
  state: DragonDiceState,
  seed: number,
): DragonDiceState {
  if (state.phase === "done" || state.currentRound >= 3) return state;

  const rng = makeRng(seed);
  const playerDice = rollThree(rng);
  const aiDice = rollThree(rng);
  const playerTotal = playerDice[0] + playerDice[1] + playerDice[2];
  const aiTotal = aiDice[0] + aiDice[1] + aiDice[2];

  const winner: "player" | "ai" | "draw" =
    playerTotal > aiTotal ? "player" : aiTotal > playerTotal ? "ai" : "draw";

  const round: DiceRound = { playerDice, aiDice, playerTotal, aiTotal, winner };
  const newRounds = [...state.rounds, round];
  const nextRound = state.currentRound + 1;

  // Sau 3 rounds → kết quả
  if (nextRound >= 3) {
    const playerWins = newRounds.filter((r) => r.winner === "player").length;
    const aiWins = newRounds.filter((r) => r.winner === "ai").length;
    const result: "win" | "lose" | "draw" =
      playerWins > aiWins ? "win" : aiWins > playerWins ? "lose" : "draw";
    return { rounds: newRounds, currentRound: nextRound, phase: "done", result };
  }

  return { rounds: newRounds, currentRound: nextRound, phase: "ready", result: null };
}
