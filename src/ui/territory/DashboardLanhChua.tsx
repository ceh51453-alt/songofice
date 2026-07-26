import React, { useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { IconX, IconCastle, IconMap, IconBook, IconPopulation } from "../icons";
import { TabStatus } from "./TabStatus";
import { TabMapGrid } from "./TabMapGrid";
import { TabDecree } from "./TabDecree";

type Tab = "status" | "map" | "decree";

export function DashboardLanhChua() {
  const stat = useMvuStore((s) => s.stat);
  const selectedRegionId = useTerritoryStore((s) => s.selectedRegionId);
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const [tab, setTab] = useState<Tab>("status");

  if (!selectedRegionId) return null;
  const region = REGIONS_BY_ID[selectedRegionId];
  if (!region) return null;

  const sov = stat["Chủ Quyền Lãnh Thổ"][selectedRegionId];
  const controllerId = sov?.["Nhà Kiểm Soát"] ?? "";
  const controller = HOUSES_BY_ID[controllerId];
  const col = houseColor(controllerId);

  // We find the holding that belongs to this region.
  const allHoldings = Object.entries(stat["Lãnh Địa"]).filter(([, h]) => h["Thuộc Vùng"] === selectedRegionId);
  const activeHoldingId = allHoldings.length > 0 ? allHoldings[0][0] : null;
  const holding = activeHoldingId ? stat["Lãnh Địa"][activeHoldingId] : undefined;

  const close = () => selectRegion(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog">
      <div className="glass w-full max-w-7xl h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-[var(--glass-border)] bg-[#0A0D14]/90">
        
        {/* HEADER */}
        <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]" style={{ background: `linear-gradient(90deg, ${col.base}33, transparent)` }}>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded flex items-center justify-center bg-black/40 border border-white/10 shadow-inner">
                <IconCastle size={24} color={col.light} />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-wider text-white uppercase" style={{ textShadow: `0 2px 10px ${col.base}` }}>{region.name}</h1>
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: col.base }}></span> {controller ? controller.name : "Vô Chủ"}</span>
                   <span>· {region.terrain} {region.coastal && "· Ven Biển"}</span>
                   {sov?.["Người Kiểm Soát"] && (
                       <span>
                         · Cai trị bởi: <strong className="text-white">{sov["Người Kiểm Soát"]}</strong>
                         {sov["Người Kiểm Soát"] === stat["Thông Tin Nhân Vật"]["Họ Tên"] && (
                           <span className="ml-1 text-[var(--accent)]">({stat["Thông Tin Nhân Vật"]["Tước Vị"]})</span>
                         )}
                       </span>
                   )}
                </div>
             </div>
          </div>
          <button onClick={close} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <IconX size={24} />
          </button>
        </header>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* SIDEBAR TABS */}
           <aside className="w-64 flex-none border-r border-[var(--glass-border)] bg-black/20 p-4 flex flex-col gap-2">
              <TabButton active={tab === "status"} onClick={() => setTab("status")} icon={<IconPopulation size={18} />} label="LÃNH ĐỊA" />
              <TabButton active={tab === "map"} onClick={() => setTab("map")} icon={<IconMap size={18} />} label="BẢN ĐỒ" />
              <TabButton active={tab === "decree"} onClick={() => setTab("decree")} icon={<IconBook size={18} />} label="PHÁP LỆNH" />
           </aside>

           {/* CONTENT AREA */}
           <main className="flex-1 overflow-y-auto relative bg-black/30 p-6">
              {!holding ? (
                 <div className="h-full flex items-center justify-center text-[var(--text-muted)] italic">
                    Khu vực này chưa có Thành Trì hoặc bạn không có quyền truy cập.
                 </div>
              ) : (
                 <>
                    {tab === "status" && <TabStatus territoryId={activeHoldingId!} holding={holding} />}
                    {tab === "map" && <TabMapGrid territoryId={activeHoldingId!} holding={holding} />}
                    {tab === "decree" && <TabDecree territoryId={activeHoldingId!} holding={holding} />}
                 </>
              )}
           </main>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-widest transition-all ${active ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'}`}
    >
      {icon} {label}
    </button>
  );
}
