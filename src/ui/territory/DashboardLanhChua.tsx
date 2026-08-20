/**
 * DashboardLanhChua — BẢNG QUẢN TRỊ PHONG KIẾN.
 *
 * Phân vai rõ với hệ bản đồ đa tầng để không lẫn chức năng:
 *   - Thành trì: công trình vật lý, quy hoạch và đồn trú.
 *   - Lãnh địa trực thuộc: đất/dân trực tiếp nuôi thành.
 *   - Lãnh thổ: vùng địa lý và chủ quyền.
 *   - Tước địa / chính thể: chư hầu, chính danh và tải hành chính.
 *
 * Chọn được MỌI lãnh địa ngươi quản trị, không chỉ cái đầu tiên như trước.
 */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMvuStore } from "../../state/mvuStore";
import { useUiStore } from "../../state/uiStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { summarizeHolding } from "../../territory/mapAggregate";
import { holdingForNavigation, playerHoldingIds } from "../../territory/territoryEngine";
import { BUILDING_CATALOG } from "../../content/westeros/buildings";
import { formatDuration } from "../../mvu/calendar";
import { demolitionDays } from "../../territory/construction";
import { formatCurrencyShort } from "../../economy/currency";
import { IconX, IconCastle, IconMap, IconBook, IconPopulation, IconCrown, IconScroll } from "../icons";
import { TabStatus } from "./TabStatus";
import { TabDecree } from "./TabDecree";
import { FeudalConceptsTab } from "./FeudalManagementTabs";
import {
  AdvancedDemesneGame,
  AdvancedFeudalDomainGame,
  AdvancedTerritoryGame,
} from "./AdvancedGovernanceGames";

type Tab = "concepts" | "stronghold" | "demesne" | "territory" | "fief" | "realm" | "decree";

export function DashboardLanhChua() {
  const stat = useMvuStore((s) => s.stat);
  const open = useUiStore((s) => s.territoryDashboardOpen);
  const setOpen = useUiStore((s) => s.setTerritoryDashboardOpen);
  const setGameView = useUiStore((s) => s.setGameView);
  const enterLocal = useTerritoryStore((s) => s.enterLocal);
  const focusHoldingId = useTerritoryStore((s) => s.focusHoldingId);
  const selectedRegionId = useTerritoryStore((s) => s.selectedRegionId);
  const [tab, setTab] = useState<Tab>("concepts");
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const mine = playerHoldingIds(stat);
  const contextualId = holdingForNavigation(stat, { focusHoldingId, selectedRegionId, ownedOnly: true });
  const activeId = holdingId && mine.includes(holdingId) ? holdingId : contextualId;

  useEffect(() => {
    if (open && activeId && holdingId !== activeId) setHoldingId(activeId);
  }, [open, activeId, holdingId]);

  useEffect(() => {
    if (!open) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [open]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  if (!open) return null;

  const holding = activeId ? stat["Lãnh Địa"][activeId] : undefined;
  const region = holding ? REGIONS_BY_ID[holding["Thuộc Vùng"]] : undefined;
  const sov = holding ? stat["Chủ Quyền Lãnh Thổ"][holding["Thuộc Vùng"]] : undefined;
  const controller = HOUSES_BY_ID[sov?.["Nhà Kiểm Soát"] ?? ""];
  const col = houseColor(sov?.["Nhà Kiểm Soát"] ?? "");
  const summary = activeId ? summarizeHolding(stat, activeId) : null;

  const goLocalMap = () => {
    setOpen(false);
    setGameView("map");
    if (activeId) enterLocal(activeId);
  };

  return createPortal(
    <Shell
      onClose={() => setOpen(false)}
      title="Quản Trị Phong Kiến"
      subtitle={holding && summary ? `${holding["Mô Tả"] || activeId} · ${region ? region.name : "Không rõ vùng"} · ${summary.kind} · ${controller ? controller.name : "Vô Chủ"}` : "Phân biệt thành trì, đất trực thuộc, lãnh thổ, tước địa và chính thể"}
      accent={col.base}
      right={
        mine.length > 0 ? (
          <select
            value={activeId ?? ""}
            onChange={(e) => setHoldingId(e.target.value)}
            className="max-w-48 rounded-[var(--radius-sm)] border border-[#3a4351] bg-[#090e15] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)] [&>option]:bg-[#141821]"
          >
            {mine.map((id) => (
              <option key={id} value={id}>{stat["Lãnh Địa"][id]["Mô Tả"] || id}</option>
            ))}
          </select>
        ) : null
      }
    >
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="flex w-full flex-none gap-1.5 overflow-x-auto border-b border-[#303846] bg-[#0a1017] p-2.5 lg:w-64 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3">
          <TabButton active={tab === "concepts"} onClick={() => setTab("concepts")} icon={<IconBook size={17} />} label="PHÂN CẤP" />
          <TabButton active={tab === "stronghold"} onClick={() => setTab("stronghold")} icon={<IconCastle size={17} />} label="THÀNH TRÌ" />
          <TabButton active={tab === "demesne"} onClick={() => setTab("demesne")} icon={<IconPopulation size={17} />} label="ĐẤT TRỰC THUỘC" />
          <TabButton active={tab === "territory"} onClick={() => setTab("territory")} icon={<IconMap size={17} />} label="LÃNH THỔ" />
          <TabButton active={tab === "fief"} onClick={() => setTab("fief")} icon={<IconScroll size={17} />} label="TƯỚC ĐỊA" />
          <TabButton active={tab === "realm"} onClick={() => setTab("realm")} icon={<IconCrown size={17} />} label="VƯƠNG QUỐC / ĐẾ QUỐC" />
          <TabButton active={tab === "decree"} onClick={() => setTab("decree")} icon={<IconBook size={17} />} label="PHÁP LỆNH" />
          {activeId && <div className="ml-auto flex-none lg:ml-0 lg:mt-auto lg:pt-3">
            <button
              onClick={goLocalMap}
              className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--accent-soft)] px-3 py-2.5 text-[12.5px] text-[var(--accent-text)] transition-colors hover:bg-[#171e28]"
            >
              <IconMap size={17} /> BẢN ĐỒ THÀNH TRÌ
            </button>
            <p className="mt-1.5 hidden px-1 text-[10.5px] leading-snug text-[var(--text-faint)] lg:block">
              Quy hoạch trên lưới 5 m ở Tầng 1 của bản đồ.
            </p>
          </div>}
        </aside>

        <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#0d131b] p-4 sm:p-5 lg:p-7">
          {tab === "concepts" && <FeudalConceptsTab />}
          {tab === "stronghold" && activeId && holding && <div className="space-y-7"><TabStatus territoryId={activeId} holding={holding} isOwner /><WorksTab territoryId={activeId} holding={holding} /></div>}
          {tab === "stronghold" && (!activeId || !holding) && <NoStronghold />}
          {tab === "demesne" && <AdvancedDemesneGame territoryId={activeId} holding={holding} />}
          {tab === "territory" && <AdvancedTerritoryGame />}
          {tab === "fief" && <AdvancedFeudalDomainGame realmOnly={false} />}
          {tab === "realm" && <AdvancedFeudalDomainGame realmOnly />}
          {tab === "decree" && activeId && holding && <TabDecree territoryId={activeId} holding={holding} isOwner />}
          {tab === "decree" && (!activeId || !holding) && <NoStronghold />}
        </main>
      </div>
    </Shell>,
    document.body,
  );
}

function NoStronghold() {
  return <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-[var(--glass-border)] px-6 text-center text-[13px] italic text-[var(--text-muted)]">Ngươi chưa trực tiếp sở hữu thành trì nào để dùng chức năng này.</div>;
}

function Shell({
  title, subtitle, accent, right, children, onClose,
}: {
  title: string; subtitle: string; accent?: string; right?: React.ReactNode;
  children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,4,7,0.88)] p-2 backdrop-blur-md sm:p-3" role="dialog">
      <div className="flex h-[calc(100dvh-16px)] w-full max-w-[1600px] flex-col overflow-hidden rounded-xl border border-[#303846] bg-[#0b1017] shadow-[0_28px_90px_rgba(0,0,0,0.75)] sm:h-[calc(100dvh-24px)]">
        <header
          className="flex flex-none items-center justify-between gap-4 border-b border-[#303846] bg-[#101721] px-4 py-3.5 sm:px-5"
          style={{ boxShadow: `inset 4px 0 0 ${accent ?? "transparent"}` }}
        >
          <div className="min-w-0">
            <h1 className="font-display truncate text-[19px] tracking-wide text-[var(--text-soft)]">{title}</h1>
            <p className="mt-0.5 truncate text-[12px] text-[var(--text-faint)]">{subtitle}</p>
          </div>
          <div className="flex flex-none items-center gap-2">
            {right}
            <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg-hover)]">
              <IconX size={20} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

/** Công trường — hàng đợi xây dựng vật lý của thành trì (đối chiếu với vị trí trên Tầng 1). */
function WorksTab({ territoryId, holding }: { territoryId: string; holding: ReturnType<typeof useMvuStore.getState>["stat"]["Lãnh Địa"][string] }) {
  const cancelBuild = useTerritoryStore((s) => s.cancelBuild);
  const startBuild = useTerritoryStore((s) => s.startBuild);
  const demolishBuild = useTerritoryStore((s) => s.demolishBuild);
  const cancelDemolish = useTerritoryStore((s) => s.cancelDemolish);
  const entries = Object.entries(holding["Công Trình"] ?? {});
  const building = entries.filter(([, b]) => b["Đang Xây"]);
  const demolishing = entries.filter(([, b]) => !b["Đang Xây"] && b["Đang Phá"]);
  const done = entries.filter(([, b]) => !b["Đang Xây"] && !b["Đang Phá"]);

  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Đang thi công</h3>
        {building.length === 0 ? (
          <p className="text-[13px] italic text-[var(--text-muted)]">Không có công trường nào.</p>
        ) : (
          <div className="space-y-2">
            {building.map(([name, b]) => (
              <div key={name} className="glass flex items-center justify-between rounded-[var(--radius-sm)] px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] text-[var(--text-soft)]">{name}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                    Cấp {b["Cấp Độ"]} · còn {formatDuration(b["Ngày Xây Còn Lại"])} · ô ({b["Tọa Độ X"]}, {b["Tọa Độ Y"]})
                  </div>
                </div>
                <button
                  onClick={() => cancelBuild(territoryId, name)}
                  className="shrink-0 rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.45)] px-2.5 py-1.5 text-[11.5px] text-[var(--danger)] hover:bg-[rgba(176,106,95,0.12)]"
                >
                  Huỷ (hoàn 50%)
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Đang phá dỡ</h3>
        {demolishing.length === 0 ? (
          <p className="text-[13px] italic text-[var(--text-muted)]">Không có công trình nào đang bị tháo dỡ.</p>
        ) : (
          <div className="space-y-2">
            {demolishing.map(([name, b]) => (
              <div key={name} className="glass flex items-center justify-between rounded-[var(--radius-sm)] px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] text-[var(--text-soft)]">{name}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
                    Cấp {b["Cấp Độ"]} · còn {formatDuration(b["Ngày Phá Còn Lại"] ?? 0)} · công trình đã ngừng hoạt động
                  </div>
                </div>
                <button
                  onClick={() => cancelDemolish(territoryId, name)}
                  className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--glass-border)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-soft)] hover:bg-[var(--glass-bg-hover)]"
                >
                  Dừng phá
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display mb-2 text-[12px] uppercase tracking-widest text-[var(--text-faint)]">Đã hoàn thiện</h3>
        {done.length === 0 ? (
          <p className="text-[13px] italic text-[var(--text-muted)]">Chưa có công trình nào hoàn thiện.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {done.map(([name, b]) => {
              const def = BUILDING_CATALOG[b["Loại"]];
              return (
                <div key={name} className="glass rounded-[var(--radius-sm)] px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] text-[var(--text-soft)]">{name}</span>
                    <span className="shrink-0 text-[11.5px] text-[var(--accent-text)]">Cấp {b["Cấp Độ"]}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] italic text-[var(--text-faint)]">{def?.effectSummary}</div>
                  {def?.yield?.["Ngân Khố"] ? (
                    <div className="mt-1 text-[11.5px] text-[var(--ok)]">
                      +{formatCurrencyShort((def.yield["Ngân Khố"] ?? 0) * b["Cấp Độ"])}/tháng
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-2 border-t border-[var(--glass-border)] pt-2">
                    <button
                      onClick={() => startBuild(territoryId, b["Loại"], name)}
                      className="rounded px-2 py-1 text-[10.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Nâng cấp
                    </button>
                    <button
                      onClick={() => demolishBuild(territoryId, name)}
                      title={`Phá dỡ trong ${formatDuration(demolitionDays(b["Loại"], b["Cấp Độ"] || 1))}`}
                      className="rounded px-2 py-1 text-[10.5px] text-[var(--danger)] hover:bg-[rgba(176,106,95,0.12)]"
                    >
                      Phá dỡ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-none items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-sm)] border-l-2 px-3 py-2.5 text-[12.5px] tracking-widest transition-colors ${
        active ? "border-l-[var(--accent-text)] bg-[var(--accent-soft)] text-[var(--accent-text)]" : "border-l-transparent text-[var(--text-muted)] hover:bg-[#171e28]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
