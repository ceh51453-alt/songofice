/**
 * shellGame — Engine "Đoán Cốc": AI giấu vật phẩm dưới 1 trong 3 cốc.
 * 3 lượt đoán, đoán đúng 2/3 thì thắng. RNG seed-based.
 */
import { makeRng } from "../probability/rng";

export interface ShellRound {
  /** Cốc nào giấu vật (0-2). */
  hiddenCup: number;
  /** Cốc người chơi chọn (0-2). */
  playerPick: number;
  correct: boolean;
}

export interface ShellGameState {
  rounds: ShellRound[];
  currentRound: number;
  /** Cốc giấu vật hiện tại (ẩn — chỉ reveal sau khi chọn). */
  currentHidden: number;
  phase: "picking" | "reveal" | "done";
  result: "win" | "lose" | null;
}

/** Khởi tạo game Đoán Cốc. */
export function createShellGame(seed: number): ShellGameState {
  const rng = makeRng(seed);
  return {
    rounds: [],
    currentRound: 0,
    currentHidden: Math.floor(rng() * 3),
    phase: "picking",
    result: null,
  };
}

/** Người chơi chọn cốc → reveal → chuyển lượt. */
export function pickShellCup(
  state: ShellGameState,
  cupIndex: number,
  nextSeed: number,
): ShellGameState {
  if (state.phase !== "picking" || state.currentRound >= 3) return state;
  if (cupIndex < 0 || cupIndex > 2) return state;

  const correct = cupIndex === state.currentHidden;
  const round: ShellRound = {
    hiddenCup: state.currentHidden,
    playerPick: cupIndex,
    correct,
  };
  const newRounds = [...state.rounds, round];
  const nextRound = state.currentRound + 1;

  // Sau 3 lượt → kết quả (đoán đúng ≥ 2/3 thì thắng)
  if (nextRound >= 3) {
    const correctCount = newRounds.filter((r) => r.correct).length;
    const result: "win" | "lose" = correctCount >= 2 ? "win" : "lose";
    return {
      rounds: newRounds,
      currentRound: nextRound,
      currentHidden: state.currentHidden,
      phase: "done",
      result,
    };
  }

  // Round mới: đổi vị trí giấu
  const rng = makeRng(nextSeed);
  return {
    rounds: newRounds,
    currentRound: nextRound,
    currentHidden: Math.floor(rng() * 3),
    phase: "picking",
    result: null,
  };
}
