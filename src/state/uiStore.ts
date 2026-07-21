/** useUiStore — trạng thái UI tạm (không persist): màn hình, composer, bottom-sheet. */
import { create } from "zustand";

export type AppScreen = "menu" | "newgame" | "game";
/** khung nhìn trong game (6.1): chat trung tâm hoặc bản đồ (mục 9). */
export type GameView = "chat" | "map" | "worldmap";

interface UiState {
  /** màn hình hiện tại — Main Menu là màn đầu tiên (8.1). */
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;
  /** khung nhìn trung tâm khi đang chơi. */
  gameView: GameView;
  setGameView: (v: GameView) => void;
  /** text trong ô nhập chat — Action Deck chèn câu hành động vào đây (6.3). */
  composerText: string;
  setComposerText: (t: string) => void;
  /** status panel bottom-sheet trên mobile. */
  statusSheetOpen: boolean;
  setStatusSheetOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  screen: "menu",
  setScreen: (screen) => set({ screen }),
  gameView: "chat",
  setGameView: (gameView) => set({ gameView }),
  composerText: "",
  setComposerText: (composerText) => set({ composerText }),
  statusSheetOpen: false,
  setStatusSheetOpen: (statusSheetOpen) => set({ statusSheetOpen }),
}));
