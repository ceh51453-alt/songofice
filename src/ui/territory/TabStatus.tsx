import React from "react";
import { IconUsers, IconCoins, IconWheat, IconTree, IconMountain } from "../icons";


export function TabStatus({ holding }: { territoryId: string, holding: any, isOwner?: boolean }) {
  const danSo = holding["Dân Số Chi Tiết"] || {};
  const res = holding["Tài Nguyên"] || {};
  const maxDanSo = holding["Dân Số"] || 10000;
  const longDan = holding["Lòng Dân"] || 60;
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-2 gap-6">
        
        {/* BLOCK DÂN CƯ */}
        <div className="glass rounded-xl p-5 border border-white/5 bg-black/20 flex flex-col gap-4">
          <h2 className="text-[var(--text-faint)] text-xs tracking-widest uppercase font-bold border-b border-white/5 pb-2 mb-2 flex items-center gap-2">
            <IconUsers size={16} /> DÂN CƯ
          </h2>
          <div className="flex justify-between items-end">
            <span className="text-3xl font-mono text-white">{maxDanSo.toLocaleString()}</span>
            <span className="text-sm text-[var(--text-muted)]">Tổng Nhân Khẩu</span>
          </div>
          
          <div className="space-y-2 mt-2">
            <Row label="Nông Dân" value={danSo["Nông Dân"] || 0} />
            <Row label="Thợ Thủ Công" value={danSo["Thợ Thủ Công"] || 0} />
            <Row label="Thợ Mỏ / Tiều Phu" value={(danSo["Thợ Mỏ"] || 0) + (danSo["Tiều Phu"] || 0)} />
            <Row label="Thương Nhân" value={danSo["Thương Nhân"] || 0} />
            <Row label="Thất Nghiệp" value={danSo["Thất Nghiệp"] || 0} warning={(danSo["Thất Nghiệp"] || 0) > 100} />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
              <span>Lòng Dân</span>
              <span className={longDan < 30 ? "text-[var(--danger)]" : "text-[var(--ok)]"}>{longDan}/100</span>
            </div>
            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--ok)] transition-all" style={{ width: `${longDan}%`, backgroundColor: longDan < 30 ? 'var(--danger)' : longDan < 60 ? 'var(--warn)' : 'var(--ok)' }} />
            </div>
          </div>
        </div>

        {/* BLOCK KINH TẾ & TÀI NGUYÊN */}
        <div className="glass rounded-xl p-5 border border-white/5 bg-black/20 flex flex-col gap-4">
          <h2 className="text-[var(--text-faint)] text-xs tracking-widest uppercase font-bold border-b border-white/5 pb-2 mb-2 flex items-center gap-2">
            <IconCoins size={16} /> TÀI NGUYÊN
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <ResourceCard icon={<IconWheat size={20} className="text-yellow-500" />} label="Lương Thực" value={res["Lương Thực"] || 0} />
            <ResourceCard icon={<IconTree size={20} className="text-green-500" />} label="Gỗ" value={res["Gỗ"] || 0} />
            <ResourceCard icon={<IconMountain size={20} className="text-gray-400" />} label="Đá" value={res["Đá"] || 0} />
            <ResourceCard icon={<IconMountain size={20} className="text-orange-400" />} label="Quặng Sắt" value={res["Quặng Sắt"] || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ label, value, warning = false }: { label: string, value: number, warning?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-1 last:border-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`font-mono ${warning ? 'text-[var(--danger)] font-bold' : 'text-white'}`}>{value.toLocaleString()}</span>
    </div>
  );
}

function ResourceCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 flex items-center gap-3 border border-white/5">
      <div className="bg-white/5 p-2 rounded-md">{icon}</div>
      <div>
        <div className="text-xs text-[var(--text-muted)]">{label}</div>
        <div className="text-lg font-mono text-white">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

