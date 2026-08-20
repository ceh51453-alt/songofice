/**
 * Game Screen (6.1) — layout hybrid:
 * PC ≥1024px: 3 cột [left rail dọc | chat/bản đồ giữa | status panel phải].
 * Mobile <1024px: 1 cột + bottom nav (chat / bản đồ / trạng thái).
 * Left rail mở dần theo milestone: M7 bật Bản Đồ + Lãnh Địa; các hệ khác
 * (quân sự/triều đình/mưu đồ/nhật ký) còn DISABLED tới milestone tương ứng.
 * M16: AudioPlayer + mood sync hook.
 */
import { useState, useEffect } from "react";
import { ChatScreen } from "../chat/ChatScreen";
import { MapWorkspace } from "../map/MapWorkspace";
import { DashboardLanhChua } from "../territory/DashboardLanhChua";
import { TerritoryPanel } from "../territory/TerritoryPanel";
import { MilitaryPanel } from "../military/MilitaryPanel";
import { CourtPanel } from "../court/CourtPanel";
import { DynastyPanel } from "../court/DynastyPanel";
import { IntriguePanel } from "../intrigue/IntriguePanel";
import { DiplomacyPanel } from "../diplomacy/DiplomacyPanel";
import { EconomyPanel } from "../economy/EconomyPanel";
import { CodexPanel } from "../codex/CodexPanel";
import { JournalPanel } from "../journal/JournalPanel";
import { IconCodex } from "../codex/CodexIcons";
import { StatusPanel } from "../panels/status/StatusPanel";
import { CombatPanel } from "../combat/CombatPanel";
import { RelationshipNetworkPanel } from "../relationship/RelationshipNetworkPanel";
import { KingdomsPanel } from "../kingdoms/KingdomsPanel";
import { Toasts } from "./Toasts";
import { useUiStore } from "../../state/uiStore";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { useEconomyStore } from "../../state/economyStore";
import { courtInvolved } from "../../strategy/court";
import { intrigueAvailable } from "../../strategy/intrigue";
import { diplomacyAvailable } from "../../strategy/diplomacy";
import { useT } from "../../i18n";
import {
  IconBanner, IconBook, IconCastle, IconChevronRight, IconCrown, IconMap, IconMask, IconScroll, IconSend, IconShield, IconUsers, IconX, IconSkull
} from "../icons";
import { IconCoin } from "../economy/EconomyIcons";
import { AudioPlayer } from "../audio/AudioPlayer";
import { updateMood } from "../../audio/audioEngine";
import { useAudioStore } from "../../audio/audioStore";

interface RailItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function GameScreen() {
  const t = useT();
  const [statusCollapsed, setStatusCollapsed] = useState(false);
  const [militaryOpen, setMilitaryOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [dynastyOpen, setDynastyOpen] = useState(false);
  const [intrigueOpen, setIntrigueOpen] = useState(false);
  const [diplomacyOpen, setDiplomacyOpen] = useState(false);
  const courtActive = useMvuStore((s) => courtInvolved(s.stat));
  const intrigueActive = useMvuStore((s) => intrigueAvailable(s.stat));
  const diplomacyActive = useMvuStore((s) => diplomacyAvailable(s.stat));
  const hasHoldings = useMvuStore((s) => Object.keys(s.stat["Lãnh Địa"]).length > 0);
  const toggleEconomy = useEconomyStore((s) => s.togglePanel);
  const economyOpen = useEconomyStore((s) => s.panelOpen);
  const [codexOpen, setCodexOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [kingdomsOpen, setKingdomsOpen] = useState(false);
  const sheetOpen = useUiStore((s) => s.statusSheetOpen);
  const setSheetOpen = useUiStore((s) => s.setStatusSheetOpen);
  const territoryDashboardOpen = useUiStore((s) => s.territoryDashboardOpen);
  const setTerritoryDashboardOpen = useUiStore((s) => s.setTerritoryDashboardOpen);
  const gameView = useUiStore((s) => s.gameView);
  const setGameView = useUiStore((s) => s.setGameView);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const stat = useMvuStore((s) => s.stat);
  const userInteracted = useAudioStore((s) => s.userInteracted);
  const isDead = stat["Thông Tin Nhân Vật"]["Đã Chết"];
  const deathCause = stat["Thông Tin Nhân Vật"]["Nguyên Nhân Cái Chết"];

  // M16: đồng bộ mood nhạc với state mỗi khi stat đổi
  useEffect(() => {
    if (userInteracted) updateMood(stat);
  }, [stat, userInteracted]);

  /** Mở bảng phân cấp và quản trị phong kiến; vẫn xem được khi chưa có đất. */
  const openTerritory = () => {
    setTerritoryDashboardOpen(true);
  };

  const railItems: RailItem[] = [
    { key: "chat", label: t("game.navChat"), icon: <IconSend size={18} />, enabled: true, active: gameView === "chat", onClick: () => setGameView("chat") },
    { key: "map", label: "Bản Đồ (5 cấp địa lý)", icon: <IconMap size={18} />, enabled: true, active: gameView === "map", onClick: () => { setGameView("map"); selectRegion(null); } },
    { key: "territory", label: t("game.navTerritory"), icon: <IconCastle size={18} />, enabled: true, active: territoryDashboardOpen, onClick: openTerritory },
    { key: "military", label: t("game.navMilitary"), icon: <IconShield size={18} />, enabled: true, active: militaryOpen, onClick: () => setMilitaryOpen(true) },
    { key: "diplomacy", label: "Ngoại Giao", icon: <IconScroll size={18} />, enabled: diplomacyActive, active: diplomacyOpen, onClick: () => setDiplomacyOpen(true) },
    { key: "economy", label: "Kinh Tế", icon: <IconCoin size={18} />, enabled: hasHoldings, active: economyOpen, onClick: toggleEconomy },
    { key: "court", label: t("game.navCourt"), icon: <IconCrown size={18} />, enabled: courtActive, active: courtOpen, onClick: () => setCourtOpen(true) },
    { key: "dynasty", label: "Gia Tộc", icon: <IconUsers size={18} />, enabled: true, active: dynastyOpen, onClick: () => setDynastyOpen(true) },
    { key: "intrigue", label: t("game.navIntrigue"), icon: <IconMask size={18} />, enabled: intrigueActive, active: intrigueOpen, onClick: () => setIntrigueOpen(true) },
    { key: "kingdoms", label: "Bàn Cờ Thế Giới (cán cân quyền lực)", icon: <IconBanner size={18} />, enabled: true, active: kingdomsOpen, onClick: () => setKingdomsOpen(true) },
    { key: "relationship", label: "Quan Hệ", icon: <IconUsers size={18} />, enabled: true, active: relationshipOpen, onClick: () => setRelationshipOpen(true) },
    { key: "codex", label: "So Tay", icon: <IconCodex size={18} />, enabled: true, active: codexOpen, onClick: () => setCodexOpen(true) },
    { key: "journal", label: t("game.navJournal"), icon: <IconBook size={18} />, enabled: true, active: journalOpen, onClick: () => setJournalOpen(true) },
  ];

  return (
    <div className="flex h-full min-h-0">
      <Toasts />
      <CombatPanel />
      <TerritoryPanel />
      <DashboardLanhChua />
      <MilitaryPanel open={militaryOpen} onClose={() => setMilitaryOpen(false)} />
      <CourtPanel open={courtOpen} onClose={() => setCourtOpen(false)} />
      <DynastyPanel open={dynastyOpen} onClose={() => setDynastyOpen(false)} />
      <IntriguePanel open={intrigueOpen} onClose={() => setIntrigueOpen(false)} />
      <DiplomacyPanel open={diplomacyOpen} onClose={() => setDiplomacyOpen(false)} />
      <EconomyPanel />
      <KingdomsPanel open={kingdomsOpen} onClose={() => setKingdomsOpen(false)} />
      <RelationshipNetworkPanel open={relationshipOpen} onClose={() => setRelationshipOpen(false)} />
      <CodexPanel open={codexOpen} onClose={() => setCodexOpen(false)} />
      {journalOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="ml-auto h-full w-full max-w-md border-l border-[var(--glass-border)]">
            <div className="flex h-10 items-center justify-end px-3 border-b border-[var(--glass-border)] bg-[rgba(10,13,18,0.6)]">
              <button onClick={() => setJournalOpen(false)} className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)]" aria-label="Đóng">
                <IconX size={16} />
              </button>
            </div>
            <div style={{ height: "calc(100% - 40px)" }}>
              <JournalPanel />
            </div>
          </div>
        </div>
      )}

      {/* ---- LEFT RAIL (PC) ---- */}
      <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-[var(--glass-border)] bg-[rgba(10,13,18,0.4)] py-3 backdrop-blur-xl lg:flex">
        {railItems.map((item) => (
          <button
            key={item.key}
            disabled={!item.enabled}
            onClick={item.onClick}
            title={item.enabled ? item.label : `${item.label} — ${t("game.comingSoon")}`}
            aria-label={item.label}
            className={`rounded-lg p-2.5 transition-colors ${
              item.active
                ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "text-[var(--text-faint)] hover:bg-[var(--glass-bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent"
            }`}
          >
            {item.icon}
          </button>
        ))}
      </nav>

      {/* ---- CHAT / BẢN ĐỒ (giữa) ---- */}
      <main className="min-h-0 min-w-0 flex-1">
        {gameView === "map" ? <MapWorkspace /> : <ChatScreen />}
      </main>

      {/* ---- STATUS PANEL (phải, PC — thu gọn được) ---- */}
      <aside
        className={`hidden shrink-0 border-l border-[var(--glass-border)] bg-[rgba(10,13,18,0.35)] backdrop-blur-xl transition-all lg:block ${
          statusCollapsed ? "w-9" : "w-72 xl:w-80"
        }`}
      >
        <button
          onClick={() => setStatusCollapsed((v) => !v)}
          title={statusCollapsed ? t("game.expandStatus") : t("game.collapseStatus")}
          aria-label={statusCollapsed ? t("game.expandStatus") : t("game.collapseStatus")}
          className="flex w-full items-center justify-center border-b border-[var(--glass-border)] py-2 text-[var(--text-faint)] hover:text-[var(--text-soft)]"
        >
          <IconChevronRight size={14} className={statusCollapsed ? "rotate-180" : ""} />
        </button>
        {!statusCollapsed && (
          <div className="h-[calc(100%-33px)] overflow-y-auto p-3">
            <StatusPanel />
          </div>
        )}
      </aside>

      {/* ---- BOTTOM NAV (mobile) ---- */}
      <div className="glass-strong fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full px-1.5 py-1 lg:hidden">
        <MobileNavBtn label={t("game.navChat")} icon={<IconSend size={17} />} active={gameView === "chat"} onClick={() => setGameView("chat")} />
        <MobileNavBtn label="Bản Đồ" icon={<IconMap size={17} />} active={gameView === "map"} onClick={() => { setGameView("map"); selectRegion(null); }} />
        <MobileNavBtn label={t("game.navTerritory")} icon={<IconCastle size={17} />} active={territoryDashboardOpen} onClick={openTerritory} />
        <MobileNavBtn label={t("game.navMilitary")} icon={<IconShield size={17} />} active={militaryOpen} onClick={() => setMilitaryOpen(true)} />
        {hasHoldings && <MobileNavBtn label="Kinh Tế" icon={<IconCoin size={17} />} active={economyOpen} onClick={toggleEconomy} />}
        {courtActive && <MobileNavBtn label={t("game.navCourt")} icon={<IconCrown size={17} />} active={courtOpen} onClick={() => setCourtOpen(true)} />}
        <MobileNavBtn label="Gia Tộc" icon={<IconUsers size={17} />} active={dynastyOpen} onClick={() => setDynastyOpen(true)} />
        {diplomacyActive && <MobileNavBtn label="Ngoại Giao" icon={<IconScroll size={17} />} active={diplomacyOpen} onClick={() => setDiplomacyOpen(true)} />}
        {intrigueActive && <MobileNavBtn label={t("game.navIntrigue")} icon={<IconMask size={17} />} active={intrigueOpen} onClick={() => setIntrigueOpen(true)} />}
        <MobileNavBtn label="Bàn Cờ" icon={<IconBanner size={17} />} active={kingdomsOpen} onClick={() => setKingdomsOpen(true)} />
        <MobileNavBtn label="So Tay" icon={<IconCodex size={17} />} active={codexOpen} onClick={() => setCodexOpen(true)} />
        <MobileNavBtn label={t("game.statusTitle")} icon={<IconUsers size={17} />} active={sheetOpen} onClick={() => setSheetOpen(true)} />
      </div>

      {/* ---- STATUS BOTTOM-SHEET (mobile) ---- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label={t("game.statusTitle")}>
          <div className="absolute inset-0 bg-[rgba(5,7,10,0.55)]" onClick={() => setSheetOpen(false)} />
          <div className="glass-strong anim-in absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-[15px] tracking-wide text-[var(--accent-text)]">{t("game.statusTitle")}</span>
              <button onClick={() => setSheetOpen(false)} aria-label={t("conn.close")} className="p-1 text-[var(--text-muted)]">
                <IconX size={18} />
              </button>
            </div>
            <StatusPanel />
          </div>
        </div>
      )}

      {/* ---- Game Over Overlay ---- */}
      {isDead && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 text-red-600">
          <IconSkull size={80} className="mb-4 animate-pulse opacity-80" />
          <h1 className="font-display text-5xl tracking-widest sm:text-7xl">YOU DIED</h1>
          <p className="font-display mt-2 text-xl tracking-widest text-red-500/70">VALAR MORGHULIS</p>
          {deathCause && <p className="mt-6 text-sm text-[var(--text-muted)] max-w-md text-center">Nguyên nhân: {deathCause}</p>}
          <button
            onClick={() => setGameView("chat")} // Tạm thời để nút, hệ thống thực tế có thể load lại save.
            className="mt-12 rounded border border-red-900/50 bg-red-950/30 px-6 py-2 text-red-500 hover:bg-red-900/50 hover:text-red-400 transition-colors"
          >
            Chấp Nhận Số Phận
          </button>
        </div>
      )}

      {/* ---- Audio Player (M16) ---- */}
      <AudioPlayer />
    </div>
  );
}

function MobileNavBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
        active ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text-muted)]"
      }`}
    >
      {icon}
    </button>
  );
}
