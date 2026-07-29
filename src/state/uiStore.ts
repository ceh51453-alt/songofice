/** useUiStore — trạng thái UI tạm (không persist): màn hình, composer, bottom-sheet. */
import { create } from "zustand";

export type AppScreen = "menu" | "newgame" | "game";
/**
 * Khung nhìn trong game (6.1): chat trung tâm hoặc BẢN ĐỒ. Bản đồ chỉ có MỘT
 * khung nhìn duy nhất (MapWorkspace); chọn Thế Giới / Lãnh Thổ / Lãnh Địa là
 * chuyện của tầng bản đồ (territoryStore.tier), không phải của điều hướng.
 */
export type GameView = "chat" | "map";

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
  /** Lãnh chúa dashboard modal (toàn màn hình). */
  territoryDashboardOpen: boolean;
  setTerritoryDashboardOpen: (v: boolean) => void;
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
  territoryDashboardOpen: false,
  setTerritoryDashboardOpen: (territoryDashboardOpen) => set({ territoryDashboardOpen }),
}));
