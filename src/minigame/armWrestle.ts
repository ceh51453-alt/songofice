/**
 * armWrestle — Engine "Vật Tay":
 * Nhấn nút liên tục trong thời gian giới hạn (lực) vs AI.
 * Mỗi vòng 3 giây, người chơi nhấn càng nhanh → lực càng cao.
 * Best of 3 rounds. AI có lực ngẫu nhiên theo độ khó.
 */
import { makeRng } from "../probability/rng";

export interface ArmWrestleRound {
  playerForce: number;
  aiForce: number;
  winner: "player" | "ai" | "draw";
}

export interface ArmWrestleState {
  rounds: ArmWrestleRound[];
  currentRound: number;
  /** Lực người chơi tích luỹ trong round hiện tại. */
  currentForce: number;
  /** Round đang active? */
  roundActive: boolean;
  /** Thời gian bắt đầu round (ms). */
  roundStartTime: number;
  phase: "ready" | "active" | "done";
  result: "win" | "lose" | "draw" | null;
  /** Độ khó AI (1-3). */
  difficulty: number;
}

export function createArmWrestle(seed: number): ArmWrestleState {
  return {
    rounds: [],
    currentRound: 0,
    currentForce: 0,
    roundActive: false,
    roundStartTime: 0,
    phase: "ready",
    result: null,
    difficulty: 2,
  };
}

/** Bắt đầu 1 round — người chơi bắt đầu nhấn nút. */
export function startArmRound(state: ArmWrestleState): ArmWrestleState {
  if (state.phase === "done" || state.currentRound >= 3) return state;
  return {
    ...state,
    currentForce: 0,
    roundActive: true,
    roundStartTime: Date.now(),
    phase: "active",
  };
}

/** Người chơi nhấn nút → +1 lực. */
export function addForce(state: ArmWrestleState): ArmWrestleState {
  if (!state.roundActive) return state;
  return { ...state, currentForce: state.currentForce + 1 };
}

/** Kết thúc round (hết thời gian 3 giây) → so lực với AI. */
export function finishArmRound(state: ArmWrestleState, seed: number): ArmWrestleState {
  if (!state.roundActive) return state;

  const rng = makeRng(seed);
  // AI lực: base 8-15 tuỳ difficulty + random
  const aiBase = 6 + state.difficulty * 3;
  const aiForce = aiBase + Math.floor(rng() * 6);
  const playerForce = state.currentForce;

  const winner: "player" | "ai" | "draw" =
    playerForce > aiForce ? "player" : aiForce > playerForce ? "ai" : "draw";

  const round: ArmWrestleRound = { playerForce, aiForce, winner };
  const newRounds = [...state.rounds, round];
  const nextRound = state.currentRound + 1;

  if (nextRound >= 3) {
    const playerWins = newRounds.filter((r) => r.winner === "player").length;
    const aiWins = newRounds.filter((r) => r.winner === "ai").length;
    const result: "win" | "lose" | "draw" =
      playerWins > aiWins ? "win" : aiWins > playerWins ? "lose" : "draw";
    return {
      ...state, rounds: newRounds, currentRound: nextRound,
      currentForce: 0, roundActive: false, roundStartTime: 0,
      phase: "done", result,
    };
  }

  return {
    ...state, rounds: newRounds, currentRound: nextRound,
    currentForce: 0, roundActive: false, roundStartTime: 0,
    phase: "ready", result: null,
  };
}
