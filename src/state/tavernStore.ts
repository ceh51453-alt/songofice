/**
 * useTavernStore V2 — State quản lý 6 mini-game quán rượu.
 * Persist lịch sử. Kết nối mvuStore để áp phần thưởng.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMvuStore } from "./mvuStore";
import { createKingsGame, playKingsRound, type KingsGameState } from "../minigame/kingsGame";
import { createDragonDice, rollDragonDice, type DragonDiceState } from "../minigame/dragonDice";
import { createShellGame, pickShellCup, type ShellGameState } from "../minigame/shellGame";
import {
  createArmWrestle, startArmRound, addForce, finishArmRound,
  type ArmWrestleState,
} from "../minigame/armWrestle";
import {
  createLiarsDice, playLiarsAction,
  type LiarsDiceState,
} from "../minigame/liarsDice";
import {
  createCoinFlip, playCoinGuess, cashOut,
  type CoinFlipState, type CoinSide,
} from "../minigame/coinFlip";
import {
  type TavernGameType,
  type TavernReward,
  GAME_INFO,
  calculateReward,
  calculateLoss,
} from "../minigame/tavernGameEngine";
import { createLogger } from "../lib/log";

const log = createLogger("tavern");

export type TavernPhase = "idle" | "menu" | "playing" | "result";

export interface GameHistoryEntry {
  type: TavernGameType;
  result: "win" | "lose" | "draw";
  bet: number;
  goldChange: number;
  timestamp: number;
}

interface TavernState {
  phase: TavernPhase;
  activeGame: TavernGameType | null;
  bet: number;
  opponent: string;
  tavernName: string;
  // ── Game states ──
  kingsState: KingsGameState | null;
  diceState: DragonDiceState | null;
  shellState: ShellGameState | null;
  armState: ArmWrestleState | null;
  liarsState: LiarsDiceState | null;
  coinState: CoinFlipState | null;
  reward: TavernReward | null;
  history: GameHistoryEntry[];
  gameSeed: number;

  // ── Actions ──
  openMenu: (opponent: string, tavernName: string) => void;
  startGame: (type: TavernGameType, bet: number) => void;
  // Kings Game
  playCard: (cardId: string) => void;
  // Dragon Dice
  rollDice: () => void;
  // Shell Game
  pickCup: (cupIndex: number) => void;
  // Arm Wrestle
  startArmRound: () => void;
  armTap: () => void;
  finishArmRound: () => void;
  // Liar's Dice
  liarsAction: (action: "challenge" | "accept") => void;
  // Coin Flip
  coinGuess: (guess: CoinSide | CoinSide[] | number) => void;
  coinCashOut: () => void;
  // General
  claimReward: () => void;
  exitTavern: () => void;
}

function nextSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ^ Date.now()) >>> 0;
}

function clearAllStates(): Partial<TavernState> {
  return {
    kingsState: null, diceState: null, shellState: null,
    armState: null, liarsState: null, coinState: null,
  };
}

export const useTavernStore = create<TavernState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      activeGame: null,
      bet: 0,
      opponent: "",
      tavernName: "",
      kingsState: null,
      diceState: null,
      shellState: null,
      armState: null,
      liarsState: null,
      coinState: null,
      reward: null,
      history: [],
      gameSeed: 0,

      openMenu: (opponent, tavernName) => {
        set({
          phase: "menu", opponent, tavernName, activeGame: null,
          ...clearAllStates(), reward: null,
        });
      },

      startGame: (type, bet) => {
        const gold = useMvuStore.getState().stat["Thông Tin Nhân Vật"]["Vàng"];
        const info = GAME_INFO[type];
        const effectiveBet = Math.min(bet, gold, info.maxBet);
        if (effectiveBet < info.minBet) {
          log.warn("Không đủ Vàng để đặt cược");
          return;
        }

        const seed = nextSeed();
        const base = {
          phase: "playing" as const,
          activeGame: type,
          bet: effectiveBet,
          gameSeed: seed,
          reward: null,
          ...clearAllStates(),
        };

        switch (type) {
          case "kings-game":
            set({ ...base, kingsState: createKingsGame(seed) });
            break;
          case "dragon-dice":
            set({ ...base, diceState: createDragonDice() });
            break;
          case "shell-game":
            set({ ...base, shellState: createShellGame(seed) });
            break;
          case "arm-wrestle":
            set({ ...base, armState: createArmWrestle(seed) });
            break;
          case "liars-dice":
            set({ ...base, liarsState: createLiarsDice(seed) });
            break;
          case "coin-flip":
            set({ ...base, coinState: createCoinFlip() });
            break;
        }
        log.info(`Bắt đầu ${info.name} — cược ${effectiveBet} Vàng`);
      },

      // ── Kings Game ──
      playCard: (cardId) => {
        const { kingsState } = get();
        if (!kingsState || kingsState.phase !== "picking") return;
        const newState = playKingsRound(kingsState, cardId, nextSeed());
        set({ kingsState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get);
        }
      },

      // ── Dragon Dice ──
      rollDice: () => {
        const { diceState } = get();
        if (!diceState || diceState.phase === "done") return;
        const newState = rollDragonDice(diceState, nextSeed());
        set({ diceState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get);
        }
      },

      // ── Shell Game ──
      pickCup: (cupIndex) => {
        const { shellState } = get();
        if (!shellState || shellState.phase !== "picking") return;
        const newState = pickShellCup(shellState, cupIndex, nextSeed());
        set({ shellState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get);
        }
      },

      // ── Arm Wrestle ──
      startArmRound: () => {
        const { armState } = get();
        if (!armState) return;
        set({ armState: startArmRound(armState) });
      },

      armTap: () => {
        const { armState } = get();
        if (!armState || !armState.roundActive) return;
        set({ armState: addForce(armState) });
      },

      finishArmRound: () => {
        const { armState } = get();
        if (!armState || !armState.roundActive) return;
        const newState = finishArmRound(armState, nextSeed());
        set({ armState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get);
        }
      },

      // ── Liar's Dice ──
      liarsAction: (action) => {
        const { liarsState } = get();
        if (!liarsState || liarsState.phase !== "bidding") return;
        const newState = playLiarsAction(liarsState, action, nextSeed());
        set({ liarsState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get);
        }
      },

      // ── Coin Flip ──
      coinGuess: (guess) => {
        const { coinState } = get();
        if (!coinState || coinState.phase !== "guessing") return;
        const newState = playCoinGuess(coinState, guess, nextSeed());
        set({ coinState: newState });
        if (newState.phase === "done") {
          const s = get();
          finishGame(s.activeGame!, newState.result!, s.bet, set, get, newState.currentMultiplier);
        }
      },

      coinCashOut: () => {
        const { coinState } = get();
        if (!coinState || coinState.phase !== "guessing") return;
        const newState = cashOut(coinState);
        set({ coinState: newState });
        if (newState.phase === "cashed-out") {
          const s = get();
          finishGame(s.activeGame!, "win", s.bet, set, get, newState.currentMultiplier);
        }
      },

      // ── General ──
      claimReward: () => {
        const { reward } = get();
        const stat = useMvuStore.getState().stat;
        if (reward) {
          stat["Thông Tin Nhân Vật"]["Vàng"] += reward.gold;
          if (reward.item) {
            stat["Túi Đồ"][reward.item.name] = {
              "Số Lượng": 1,
              "Mô Tả": reward.item.desc,
            };
          }
          log.info(`Nhận thưởng: +${reward.gold} Vàng${reward.item ? ` + ${reward.item.name}` : ""}`);
        }
        set({ phase: "idle", activeGame: null, ...clearAllStates(), reward: null });
      },

      exitTavern: () => {
        set({ phase: "idle", activeGame: null, ...clearAllStates(), reward: null });
      },
    }),
    {
      name: "asoiaf-tavern-m2",
      version: 2,
      partialize: (s) => ({ history: s.history }),
    },
  ),
);

function finishGame(
  type: TavernGameType,
  result: "win" | "lose" | "draw",
  bet: number,
  set: (partial: Partial<TavernState>) => void,
  get: () => TavernState,
  extraMultiplier = 1,
): void {
  const stat = useMvuStore.getState().stat;
  let goldChange = 0;
  let reward: TavernReward | null = null;

  if (result === "win") {
    reward = calculateReward(type, bet, stat["Thông Tin Nhân Vật"]["Vàng"], extraMultiplier);
    goldChange = reward.gold;
  } else if (result === "lose") {
    const loss = calculateLoss(bet);
    stat["Thông Tin Nhân Vật"]["Vàng"] = Math.max(0, stat["Thông Tin Nhân Vật"]["Vàng"] - loss);
    goldChange = -loss;
  }

  const entry: GameHistoryEntry = {
    type, result, bet, goldChange, timestamp: Date.now(),
  };

  set({
    phase: "result",
    reward,
    history: [...get().history, entry],
  });

  log.info(`Game ${GAME_INFO[type].name}: ${result} — ${goldChange > 0 ? "+" : ""}${goldChange} Vàng`);
}
