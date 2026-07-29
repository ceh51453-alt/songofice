/**
 * DashboardLanhChua — BẢNG QUẢN TRỊ LÃNH ĐỊA (hành chính, không phải bản đồ).
 *
 * Phân vai rõ với hệ bản đồ đa tầng để không lẫn chức năng:
 *   - Ở ĐÂY  : con số và quyết sách — dân cư, kho tàng, công trường, pháp lệnh.
 *   - Tầng 1 : không gian — đặt công trình lên lưới 5 m (nút "Bản đồ lãnh địa").
 *   - Tầng 2 : quan hệ vùng — chủ quyền, khu dân cư, điều quân (TerritoryPanel).
 *
 * Chọn được MỌI lãnh địa ngươi quản trị, không chỉ cái đầu tiên như trước.
 */
import React, { useEffect, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useUiStore } from "../../state/uiStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { playerHoldingIds, summarizeHolding } from "../../territory/mapAggregate";
import { BUILDING_CATALOG } from "../../content/westeros/buildings";
import { formatDuration } from "../../mvu/calendar";
import { formatCurrencyShort } from "../../economy/currency";
import { IconX, IconCastle, IconMap, IconBook, IconPopulation } from "../icons";
import { TabStatus } from "./TabStatus";
import { TabDecree } from "./TabDecree";

type Tab = "status" | "works" | "decree";

export function DashboardLanhChua() {
  const stat = useMvuStore((s) => s.stat);
  const open = useUiStore((s) => s.territoryDashboardOpen);
  const setOpen = useUiStore((s) => s.setTerritoryDashboardOpen);
  const setGameView = useUiStore((s) => s.setGameView);
  const enterLocal = useTerritoryStore((s) => s.enterLocal);
  const [tab, setTab] = useState<Tab>("status");
  const [holdingId, setHoldingId] = useState<string | null>(null);

  const mine = playerHoldingIds(stat);
  const activeId = holdingId && mine.includes(holdingId) ? holdingId : mine[0] ?? null;

  useEffect(() => {
    if (open && activeId && holdingId !== activeId) setHoldingId(activeId);
  }, [open, activeId, holdingId]);

  if (!open) return null;
  if (!activeId) {
    return (
      <Shell onClose={() => setOpen(false)} title="Lãnh Địa" subtitle="Ngươi chưa quản trị nơi nào">
        <div className="flex h-full items-center justify-center text-[13px] italic text-[var(--text-muted)]">
          Chưa có lãnh địa nào thuộc quyền cai quản của ngươi.
        </div>
      </Shell>
    );
  }

  const holding = stat["Lãnh Địa"][activeId];
  const region = REGIONS_BY_ID[holding["Thuộc Vùng"]];
  const sov = stat["Chủ Quyền Lãnh Thổ"][holding["Thuộc Vùng"]];
  const controller = HOUSES_BY_ID[sov?.["Nhà Kiểm Soát"] ?? ""];
  const col = houseColor(sov?.["Nhà Kiểm Soát"] ?? "");
  const summary = summarizeHolding(stat, activeId);

  const goLocalMap = () => {
    setOpen(false);
    setGameView("map");
    enterLocal(activeId);
  };

  return (
    <Shell
      onClose={() => setOpen(false)}
      title={holding["Mô Tả"] || activeId}
      subtitle={`${region ? region.name : "Không rõ vùng"} · ${summary.kind} · ${controller ? controller.name : "Vô Chủ"}`}
      accent={col.base}
      right={
        mine.length > 1 ? (
          <select
            value={activeId}
            onChange={(e) => setHoldingId(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[rgba(0,0,0,0.35)] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)] [&>option]:bg-[#141821]"
          >
            {mine.map((id) => (
              <option key={id} value={id}>{stat["Lãnh Địa"][id]["Mô Tả"] || id}</option>
            ))}
          </select>
        ) : null
      }
    >
      <div className="flex h-full min-h-0">
        <aside className="flex w-56 flex-none flex-col gap-2 border-r border-[var(--glass-border)] bg-[rgba(0,0,0,0.2)] p-3">
          <TabButton active={tab === "status"} onClick={() => setTab("status")} icon={<IconPopulation size={17} />} label="DÂN & KHO" />
          <TabButton active={tab === "works"} onClick={() => setTab("works")} icon={<IconCastle size={17} />} label="CÔNG TRƯỜNG" />
          <TabButton active={tab === "decree"} onClick={() => setTab("decree")} icon={<IconBook size={17} />} label="PHÁP LỆNH" />
          <div className="mt-auto">
            <button
              onClick={goLocalMap}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--accent-soft)] px-3 py-2.5 text-[12.5px] text-[var(--accent-text)] transition-colors hover:bg-[var(--glass-bg-hover)]"
            >
              <IconMap size={17} /> BẢN ĐỒ LÃNH ĐỊA
            </button>
            <p className="mt-1.5 px-1 text-[10.5px] leading-snug text-[var(--text-faint)]">
              Quy hoạch trên lưới 5 m ở Tầng 1 của bản đồ.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[rgba(0,0,0,0.25)] p-5">
          {tab === "status" && <TabStatus territoryId={activeId} holding={holding} isOwner />}
          {tab === "works" && <WorksTab territoryId={activeId} holding={holding} />}
          {tab === "decree" && <TabDecree territoryId={activeId} holding={holding} isOwner />}
        </main>
      </div>
    </Shell>
  );
}

function Shell({
  title, subtitle, accent, right, children, onClose,
}: {
  title: string; subtitle: string; accent?: string; right?: React.ReactNode;
  children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,7,10,0.7)] p-4 backdrop-blur-sm" role="dialog">
      <div className="glass flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[rgba(10,13,20,0.92)] shadow-2xl">
        <header
          className="flex flex-none items-center justify-between gap-4 border-b border-[var(--glass-border)] px-5 py-3.5"
          style={{ background: `linear-gradient(90deg, ${accent ?? "transparent"}22, transparent)` }}
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

/** Công trường — hàng đợi xây dựng của lãnh địa (đối chiếu với vị trí trên Tầng 1). */
function WorksTab({ territoryId, holding }: { territoryId: string; holding: ReturnType<typeof useMvuStore.getState>["stat"]["Lãnh Địa"][string] }) {
  const cancelBuild = useTerritoryStore((s) => s.cancelBuild);
  const entries = Object.entries(holding["Công Trình"] ?? {});
  const building = entries.filter(([, b]) => b["Đang Xây"]);
  const done = entries.filter(([, b]) => !b["Đang Xây"]);

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
      className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-[12.5px] tracking-widest transition-colors ${
        active ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
      }`}
    >
      {icon} {label}
    </button>
  );
}
