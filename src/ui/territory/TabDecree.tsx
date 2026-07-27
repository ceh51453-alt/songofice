import { useState } from "react";
import { IconBook } from "../icons";
import { useMvuStore } from "../../state/mvuStore";
import { formatCurrencyShort, EXCHANGE_RATES } from "../../economy/currency";
import { getTitleLevel } from "../../character/roleplay";

export const DECREE_TEMPLATES = [
  { id: "tax_winter", name: "Thuế Đặc Biệt", type: "Thuế", effectDesc: "+50% Vàng, -10 Lòng Dân", costGold: 0 * EXCHANGE_RATES.GOLD_TO_COPPER, costFood: 0, reqLevel: 1 },
  { id: "conscription", name: "Lệnh Kêu Gọi Nhập Ngũ", type: "Luật", effectDesc: "Tăng tuyển quân, -15 Lòng Dân", costGold: 0 * EXCHANGE_RATES.GOLD_TO_COPPER, costFood: 0, reqLevel: 2 },
  { id: "festival", name: "Lễ Hội Lớn", type: "Phúc lợi", effectDesc: "+20 Lòng Dân, -500 Vàng, -1000 Lương Thực", costGold: 500 * EXCHANGE_RATES.GOLD_TO_COPPER, costFood: 1000, reqLevel: 1 },
  { id: "agriculture", name: "Khuyến Nông", type: "Phúc lợi", effectDesc: "+20% Sản lượng Lương Thực, -200 Vàng", costGold: 200 * EXCHANGE_RATES.GOLD_TO_COPPER, costFood: 0, reqLevel: 1 },
  { id: "kings_peace", name: "Hòa Bình Lục Địa", type: "Luật", effectDesc: "Chấm dứt mọi cuộc chiến nội bộ, +100 Lòng Dân Toàn Cõi", costGold: 2000 * EXCHANGE_RATES.GOLD_TO_COPPER, costFood: 5000, reqLevel: 3 },
];

export function TabDecree({ territoryId, holding, isOwner }: { territoryId: string, holding: any, isOwner?: boolean }) {
  const setByPath = useMvuStore(s => s.setByPath);
  const playerTuocVi = useMvuStore(s => s.stat["Thông Tin Nhân Vật"]["Tước Vị"] || "Thường Dân");
  const pLevel = getTitleLevel(playerTuocVi);
  const decrees = holding["Pháp Lệnh"] || {};
  const resources = holding["Tài Nguyên"] || {};
  const [showModal, setShowModal] = useState(false);

  const issueDecree = (tpl: any) => {
      const currentGold = resources["Ngân Khố"] || 0;
      const currentFood = resources["Lương Thực"] || 0;
      
      if (currentGold < tpl.costGold || currentFood < tpl.costFood) return;
      
      setByPath(`Lãnh Địa.${territoryId}.Tài Nguyên.Ngân Khố`, currentGold - tpl.costGold);
      setByPath(`Lãnh Địa.${territoryId}.Tài Nguyên.Lương Thực`, currentFood - tpl.costFood);
      
      const newDecree = {
          "Tên": tpl.name,
          "Loại": tpl.type,
          "Trạng Thái": "Đang hiệu lực",
          "Hiệu Ứng": tpl.effectDesc
      };
      
      setByPath(`Lãnh Địa.${territoryId}.Pháp Lệnh.${tpl.id}`, newDecree);
      setShowModal(false);
  };

  const revokeDecree = (id: string) => {
      const currentDecree = decrees[id];
      if (currentDecree) {
          setByPath(`Lãnh Địa.${territoryId}.Pháp Lệnh.${id}.Trạng Thái`, "Đình trệ");
      }
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-white font-bold tracking-widest text-sm uppercase flex items-center gap-2">
            <IconBook size={18} /> QUẢN LÝ PHÁP LỆNH
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Ban hành các chính sách để điều chỉnh thuế, luật pháp và phúc lợi.</p>
        </div>
        {isOwner && (
            <button 
              onClick={() => setShowModal(!showModal)}
              className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-lg hover:bg-opacity-80 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              {showModal ? "ĐÓNG" : "+ BAN HÀNH MỚI"}
            </button>
        )}
      </div>

      {showModal && isOwner && (
          <div className="absolute top-20 right-4 w-80 bg-[#11141a] border border-[#D4AF37]/50 rounded-lg shadow-2xl z-20 animate-fade-in p-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-[#D4AF37] font-bold border-b border-[#D4AF37]/30 pb-2 mb-3">DANH SÁCH PHÁP LỆNH</h3>
              <div className="space-y-3">
                  {DECREE_TEMPLATES.map(tpl => {
                      const isActive = decrees[tpl.id] && decrees[tpl.id]["Trạng Thái"] === "Đang hiệu lực";
                      const canAfford = (resources["Ngân Khố"] || 0) >= tpl.costGold && (resources["Lương Thực"] || 0) >= tpl.costFood;
                      const hasPrivilege = pLevel >= tpl.reqLevel;
                      
                      if (isActive) return null; // Hide already active ones
                      
                      return (
                          <div key={tpl.id} className={`p-3 rounded border ${canAfford && hasPrivilege ? 'border-white/10 hover:border-[#D4AF37]/50 bg-black/40 cursor-pointer' : 'border-red-900/30 bg-red-900/10 opacity-50 cursor-not-allowed'}`}
                              onClick={() => { if (canAfford && hasPrivilege) issueDecree(tpl); }}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-white flex items-center gap-2">
                                    {tpl.name}
                                    {!hasPrivilege && <span className="text-[10px] bg-red-900/50 text-red-200 px-1 py-0.5 rounded">Vượt quyền</span>}
                                  </span>
                                  <span className="text-[10px] uppercase text-[var(--text-muted)] px-1 py-0.5 bg-white/10 rounded">{tpl.type}</span>
                              </div>
                              <div className="text-xs text-[var(--text-muted)] italic mb-2">{tpl.effectDesc}</div>
                              {(tpl.costGold > 0 || tpl.costFood > 0) && (
                                  <div className="flex gap-3 text-xs">
                                      {tpl.costGold > 0 && <span className={(resources["Ngân Khố"] || 0) < tpl.costGold ? "text-red-400" : "text-yellow-400"}>🪙 {formatCurrencyShort(tpl.costGold)}</span>}
                                      {tpl.costFood > 0 && <span className={(resources["Lương Thực"] || 0) < tpl.costFood ? "text-red-400" : "text-yellow-200"}>🌾 {tpl.costFood}</span>}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-max overflow-y-auto pr-2">
        {Object.entries(decrees).length === 0 ? (
           <div className="col-span-2 text-center py-10 text-[var(--text-muted)] italic bg-black/20 rounded-xl border border-white/5">
              Chưa có pháp lệnh nào được ban hành tại lãnh địa này.
           </div>
        ) : (
          Object.entries(decrees).map(([id, decree]) => (
            <DecreeCard key={id} decree={decree} isOwner={isOwner} onRevoke={() => revokeDecree(id)} />
          ))
        )}
      </div>
    </div>
  );
}

function DecreeCard({ decree, isOwner, onRevoke }: { decree: any, isOwner?: boolean, onRevoke: () => void }) {
  const isActive = decree["Trạng Thái"] === "Đang hiệu lực";
  
  return (
    <div className={`glass rounded-xl p-5 border ${isActive ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5' : 'border-white/5 bg-black/20'} flex flex-col gap-3 relative overflow-hidden`}>
      {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]" />}
      
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-0.5 rounded bg-white/5 inline-block mb-2">
            {decree["Loại"]}
          </span>
          <h3 className="text-white font-bold text-lg">{decree["Tên"]}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${isActive ? 'bg-[var(--ok)]/20 text-[var(--ok)]' : 'bg-white/10 text-[var(--text-muted)]'}`}>
          {decree["Trạng Thái"]}
        </span>
      </div>
      
      <p className="text-sm text-[var(--text-faint)] italic border-l-2 border-[var(--text-muted)]/30 pl-3 py-1">
        {decree["Hiệu Ứng"]}
      </p>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
        <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">
          {isActive ? "Đang áp dụng" : "Đã hủy"}
        </span>
        
        {isActive && isOwner && (
            <button 
                onClick={onRevoke}
                className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-900/20 px-3 py-1 rounded"
            >
                Hủy bỏ
            </button>
        )}
      </div>
    </div>
  );
}
