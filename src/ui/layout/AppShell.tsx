/**
 * Khung app: routing màn hình (Main Menu 8.1 → New Game 8.3 → Game 6.1) +
 * top bar + modal Cài đặt (6 tab) + Prompt Inspector + Save/Load (M15) + Audio (M16).
 */
import { useEffect, useState } from "react";
import { GameScreen } from "./GameScreen";
import { MainMenu } from "../menu/MainMenu";
import { NewGameFlow } from "../menu/NewGameFlow";
import { ConnectionPanel } from "../panels/ConnectionPanel";
import { PromptPanel } from "../panels/PromptPanel";
import { LorePanel } from "../panels/LorePanel";
import { GameplaySettings } from "../panels/GameplaySettings";
import { ExtraModelPanel } from "../panels/ExtraModelPanel";
import { DataSettings } from "../panels/DataSettings";
import { AudioSettings } from "../panels/AudioSettings";
import { SaveLoadPanel } from "../panels/SaveLoadPanel";
import { PromptInspector } from "../panels/PromptInspector";
import { Modal } from "../components/Modal";
import { useT } from "../../i18n";
import { useChatStore } from "../../state/chatStore";
import { useConnectionStore } from "../../state/connectionStore";
import { usePresetStore } from "../../state/presetStore";
import { useLoreStore } from "../../state/loreStore";
import { useUiStore } from "../../state/uiStore";
import { registerBuiltinMacros } from "../../prompt/macros";
import { registerConstructionLoop } from "../../territory/construction";
import { registerArmyLoop } from "../../strategy/army";
import { registerSiegeLoop } from "../../strategy/war";
import { registerBetrayalLoop } from "../../strategy/betrayal";
import { registerCourtLoop } from "../../strategy/court";
import { registerSuccessionLoop } from "../../strategy/succession";
import { registerIntelligenceLoop } from "../../strategy/intrigue";
import { registerEconomyLoop } from "../../economy/economyEngine";
import { registerDiseaseLoop } from "../../character/diseaseEngine";
import { registerOffscreenLoop } from "../../npc/offscreenSim";
import { warmupTokenizer } from "../../prompt/tokenizer";
import { initAudioEngine } from "../../audio/audioEngine";
import { WorldNewsFab } from "../components/WorldNewsFab";
import { WorkflowSettings } from "../menu/WorkflowSettings";
import { IconBroom, IconCrossedSwords, IconInspect, IconSettings, IconBook } from "../icons";

type SettingsTab = "connection" | "extra" | "prompt" | "lore" | "gameplay" | "data" | "audio" | "workflow";
type SaveLoadMode = "save" | "load" | null;

export function AppShell() {
  const t = useT();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("connection");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<SaveLoadMode>(null);
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const clearChat = useChatStore((s) => s.clearChat);
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const profileModel = useConnectionStore((s) => {
    const profs = s.profiles;
    const p = profs.find((p) => p.id === s.activeProfileId) ?? profs[0];
    return p?.model ?? "";
  });
  const refreshPresets = usePresetStore((s) => s.refresh);
  const refreshLore = useLoreStore((s) => s.refresh);
  const activePresetId = usePresetStore((s) => s.activePresetId);
  const presetRecords = usePresetStore((s) => s.records);
  const activePresetName = presetRecords.find((r) => r.id === activePresetId)?.name;

  useEffect(() => {
    registerBuiltinMacros();
    registerConstructionLoop();
    registerArmyLoop();
    registerSiegeLoop();
    registerBetrayalLoop();
    registerCourtLoop();
    registerSuccessionLoop();
    registerIntelligenceLoop();
    registerEconomyLoop();
    registerDiseaseLoop();
    registerOffscreenLoop();
    initAudioEngine();
    void warmupTokenizer();
    void refreshPresets();
    void refreshLore();
  }, [refreshPresets, refreshLore]);

  const tabClass = (tab: SettingsTab) =>
    `px-3 py-1.5 text-[13px] rounded-[var(--radius-sm)] border transition-colors ${
      settingsTab === tab
        ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
        : "border-transparent text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
    }`;

  return (
    <div className="flex h-full flex-col">
      {/* ---- Top bar (chỉ trong game) ---- */}
      {screen === "game" && (
        <header className="z-10 flex items-center justify-between border-b border-[var(--glass-border)] bg-[rgba(10,13,18,0.5)] px-3 py-2.5 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button onClick={() => setScreen("menu")} title="Menu Chính" aria-label="Menu Chính" className="shrink-0">
              <IconCrossedSwords size={22} color="var(--accent-text)" strokeWidth={1.4} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display truncate text-[15px] leading-tight tracking-wider text-[var(--text-soft)] sm:text-base">
                {t("app.title")}
              </h1>
              <p className="truncate text-[11px] leading-tight text-[var(--text-faint)]">
                {t("app.subtitle")}
                {profileModel ? ` · ${profileModel}` : ""}
                {activePresetName ? ` · ${activePresetName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setInspectorOpen(true)}
              title={t("prompt.inspectorOpen")}
              aria-label={t("prompt.inspectorOpen")}
              className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconInspect size={18} />
            </button>
            {hasMessages && (
              <button
                onClick={clearChat}
                title={t("chat.clear")}
                aria-label={t("chat.clear")}
                className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
              >
                <IconBroom size={18} />
              </button>
            )}
            <button
              onClick={() => setSaveLoadMode("save")}
              title="Lưu Ván"
              aria-label="Lưu Ván"
              className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconBook size={18} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              title={t("conn.settings")}
              aria-label={t("conn.settings")}
              className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-soft)]"
            >
              <IconSettings size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ---- Nội dung theo màn hình ---- */}
      <div className="min-h-0 flex-1">
        {screen === "menu" ? (
          <MainMenu onOpenSettings={() => setSettingsOpen(true)} onOpenLoadGame={() => setSaveLoadMode("load")} />
        ) : screen === "newgame" ? (
          <NewGameFlow />
        ) : (
          <GameScreen />
        )}
      </div>

      {/* ---- World News FAB (GĐ4) ---- */}
      {screen === "game" && <WorldNewsFab />}

      {/* ---- Cài đặt (tab) ---- */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t("conn.settings")}>
        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-[var(--glass-border)] pb-3">
          <button className={tabClass("connection")} onClick={() => setSettingsTab("connection")}>
            {t("prompt.tabConnection")}
          </button>
          <button className={tabClass("extra")} onClick={() => setSettingsTab("extra")}>
            {t("extra.tab")}
          </button>
          <button className={tabClass("prompt")} onClick={() => setSettingsTab("prompt")}>
            {t("prompt.tab")}
          </button>
          <button className={tabClass("lore")} onClick={() => setSettingsTab("lore")}>
            {t("lore.tab")}
          </button>
          <button className={tabClass("gameplay")} onClick={() => setSettingsTab("gameplay")}>
            Gameplay
          </button>
          <button className={tabClass("data")} onClick={() => setSettingsTab("data")}>
            Dữ Liệu
          </button>
          <button className={tabClass("audio")} onClick={() => setSettingsTab("audio")}>
            Âm Thanh
          </button>
          <button className={tabClass("workflow")} onClick={() => setSettingsTab("workflow")}>
            Workflow
          </button>
        </div>
        {settingsTab === "connection" ? <ConnectionPanel /> :
         settingsTab === "extra" ? <ExtraModelPanel /> :
         settingsTab === "prompt" ? <PromptPanel /> :
         settingsTab === "lore" ? <LorePanel /> :
         settingsTab === "gameplay" ? <GameplaySettings /> :
         settingsTab === "audio" ? <AudioSettings /> :
         settingsTab === "workflow" ? <WorkflowSettings /> :
         <DataSettings />}
      </Modal>

      {/* ---- Save/Load ---- */}
      <Modal
        open={saveLoadMode !== null}
        onClose={() => setSaveLoadMode(null)}
        title={saveLoadMode === "save" ? "Lưu Ván" : "Tải Ván"}
      >
        {saveLoadMode && (
          <SaveLoadPanel
            mode={saveLoadMode}
            onDone={() => {
              setSaveLoadMode(null);
              if (saveLoadMode === "load") setScreen("game");
            }}
          />
        )}
      </Modal>

      {/* ---- Prompt Inspector ---- */}
      <Modal
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        title={t("prompt.inspector")}
        widthClass="max-w-3xl"
      >
        {inspectorOpen && <PromptInspector />}
      </Modal>
    </div>
  );
}
