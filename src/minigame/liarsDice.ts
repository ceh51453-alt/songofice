/**
 * liarsDice — Engine "Xúc Xắc Nói Dối" (Liar's Dice):
 *
 * Mỗi bên tung 5 xúc xắc, giấu kết quả. Lần lượt:
 * - Đặt lệnh (bid): "Có ít nhất X con xúc xắc mặt Y trong tổng 10 con"
 * - Hoặc gọi "NÓI DỐI!" (challenge) — nếu đúng là nói dối → thắng, sai → thua.
 *
 * Đơn giản hoá: 3 rounds. Mỗi round AI đặt 1 bid, người chơi chọn:
 * tin (accept) hoặc gọi dối (challenge).
 */
import { makeRng, type RNG } from "../probability/rng";

export interface LiarsBid {
  count: number; // "có ít nhất count con..."
  face: number;  // "... mặt face"
}

export interface LiarsRound {
  playerDice: number[];
  aiDice: number[];
  aiBid: LiarsBid;
  /** Người chơi chọn challenge hay accept. */
  playerAction: "challenge" | "accept";
  /** Thực tế có bao nhiêu con mặt đó. */
  actualCount: number;
  /** AI có nói dối không. */
  wasLying: boolean;
  winner: "player" | "ai";
}

export interface LiarsDiceState {
  rounds: LiarsRound[];
  currentRound: number;
  /** Xúc xắc ẩn của người chơi round hiện tại. */
  playerDice: number[];
  /** AI bid hiện tại. */
  currentBid: LiarsBid | null;
  /** Xúc xắc AI (ẩn — chỉ reveal khi challenge). */
  aiDice: number[];
  phase: "bidding" | "revealed" | "done";
  result: "win" | "lose" | "draw" | null;
}

function rollFive(rng: RNG): number[] {
  return Array.from({ length: 5 }, () => 1 + Math.floor(rng() * 6));
}

export function createLiarsDice(seed: number): LiarsDiceState {
  const rng = makeRng(seed);
  const playerDice = rollFive(rng);
  const aiDice = rollFive(rng);

  // AI tạo bid dựa trên xúc xắc của nó
  const aiBid = generateAiBid(aiDice, rng);

  return {
    rounds: [],
    currentRound: 0,
    playerDice,
    aiDice,
    currentBid: aiBid,
    phase: "bidding",
    result: null,
  };
}

/** AI tạo bid: 60% trung thực (dựa trên xúc xắc thật), 40% nói dối. */
function generateAiBid(aiDice: number[], rng: RNG): LiarsBid {
  const isLying = rng() < 0.4;

  if (isLying) {
    // Bid cao hơn thực tế
    const face = 1 + Math.floor(rng() * 6);
    const actualCount = aiDice.filter((d) => d === face).length;
    const inflated = actualCount + 2 + Math.floor(rng() * 2); // +2-3
    return { count: Math.min(inflated, 8), face };
  }

  // Bid trung thực: chọn mặt có nhiều nhất
  const counts = [0, 0, 0, 0, 0, 0];
  for (const d of aiDice) counts[d - 1]++;
  const bestFace = counts.indexOf(Math.max(...counts)) + 1;
  const bestCount = counts[bestFace - 1];
  // Thêm 1-2 (đoán người chơi cũng có)
  return { count: bestCount + 1 + Math.floor(rng() * 2), face: bestFace };
}

/** Người chơi challenge hoặc accept. */
export function playLiarsAction(
  state: LiarsDiceState,
  action: "challenge" | "accept",
  nextSeed: number,
): LiarsDiceState {
  if (state.phase !== "bidding" || !state.currentBid) return state;

  const allDice = [...state.playerDice, ...state.aiDice];
  const actualCount = allDice.filter((d) => d === state.currentBid!.face).length;
  const wasLying = actualCount < state.currentBid!.count;

  let winner: "player" | "ai";
  if (action === "challenge") {
    // Challenge: nếu AI nói dối → player thắng, ngược lại → thua
    winner = wasLying ? "player" : "ai";
  } else {
    // Accept: nếu AI nói thật → player thắng (tin đúng), nói dối → thua (bị lừa)
    winner = wasLying ? "ai" : "player";
  }

  const round: LiarsRound = {
    playerDice: state.playerDice,
    aiDice: state.aiDice,
    aiBid: state.currentBid!,
    playerAction: action,
    actualCount,
    wasLying,
    winner,
  };

  const newRounds = [...state.rounds, round];
  const nextRound = state.currentRound + 1;

  if (nextRound >= 3) {
    const playerWins = newRounds.filter((r) => r.winner === "player").length;
    const aiWins = newRounds.filter((r) => r.winner === "ai").length;
    const result: "win" | "lose" | "draw" =
      playerWins > aiWins ? "win" : aiWins > playerWins ? "lose" : "draw";
    return {
      ...state, rounds: newRounds, currentRound: nextRound,
      currentBid: null, phase: "done", result,
    };
  }

  // Round mới
  const rng = makeRng(nextSeed);
  const newPlayerDice = rollFive(rng);
  const newAiDice = rollFive(rng);
  const newBid = generateAiBid(newAiDice, rng);

  return {
    rounds: newRounds,
    currentRound: nextRound,
    playerDice: newPlayerDice,
    aiDice: newAiDice,
    currentBid: newBid,
    phase: "bidding",
    result: null,
  };
}
