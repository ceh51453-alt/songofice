import { useState } from "react";
import { Modal } from "../../components/Modal";
import { useMvuStore } from "../../../state/mvuStore";
import { BodyVisualizer } from "./BodyVisualizer";
import { applyPatch } from "../../../mvu/patchEngine";
import { recomputeDerived } from "../../../mvu/effects";
import type { EquipItem, StatData } from "../../../mvu/schema";
import { getActiveSetBonuses, repairEquipment, enhanceEquipment, getEnhanceRequirement, EQUIPMENT_SETS } from "../../../character/equipmentEngine";
import { IconSpark, IconShield, IconHammer, IconSpark as IconStar, IconCrossedSwords, IconCrown, IconLayers } from "../../icons";
import { formatCurrencyShort } from "../../../economy/currency";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EQUIPMENT_SLOTS = [
  "Vũ Khí Chính",
  "Vũ Khí Phụ",
  "Mũ/Nón",
  "Giáp Thân",
  "Khiên",
  "Vật Phẩm Đặc Biệt"
] as const;

type SlotType = typeof EQUIPMENT_SLOTS[number];

export function EquipmentModal({ open, onClose }: Props) {
  const stat = useMvuStore((s) => s.stat);
  const equipped = (stat["Trang Bị Đang Mặc"] || {}) as StatData["Trang Bị Đang Mặc"];
  const currentGold = stat["Thông Tin Nhân Vật"]?.["Ngân Khố"] || 0;

  const [selectedSlot, setSelectedSlot] = useState<SlotType | null>(null);
  const [activeTab, setActiveTab] = useState<"equipped" | "sets" | "inventory">("equipped");
  const [messageToast, setMessageToast] = useState<{ text: string; type: 'success'|'error'|'warning'|'fatal' } | null>(null);

  const showToast = (text: string, type: 'success'|'error'|'warning'|'fatal' = 'success') => {
    setMessageToast({ text, type });
    setTimeout(() => setMessageToast(null), 4000);
  };

  // Calculate active sets & bonuses
  const { activeSets, totalBonusStats: setBonusStats } = getActiveSetBonuses(equipped);

  // Calculate Total Stat Bonuses from all equipped items + Set Bonuses
  const totalStats: Record<string, number> = { ...setBonusStats };
  Object.values(equipped).forEach((item) => {
    if (item && item["Thuộc Tính"]) {
      Object.entries(item["Thuộc Tính"]).forEach(([k, v]) => {
        totalStats[k] = (totalStats[k] || 0) + v;
      });
    }
  });

  const handleUnequip = (slot: keyof typeof equipped) => {
    const st = applyPatch(stat, []).state;
    const rawItem = st["Trang Bị Đang Mặc"][slot] as EquipItem | undefined;
    if (rawItem && rawItem["Tên"]) {
      const item = rawItem;
      delete st["Trang Bị Đang Mặc"][slot];
      
      // Đưa đồ đã tháo vào Kho Vũ Khí để giữ nguyên chỉ số cường hoá và phẩm chất
      if (!st["Kho Vũ Khí"]) st["Kho Vũ Khí"] = [];
      st["Kho Vũ Khí"].push(item);
      const itemName = item["Tên"];

      recomputeDerived(st);
      useMvuStore.setState({ stat: st });
      showToast(`Đã tháo ${itemName}.`, 'success');
    }
  };

  const handleEquipFromInventory = (itemIndex: number, targetSlot?: SlotType) => {
    const st = applyPatch(stat, []).state;
    if (!st["Kho Vũ Khí"] || !st["Kho Vũ Khí"][itemIndex]) return;

    const equipData = st["Kho Vũ Khí"][itemIndex];
    const itemName = equipData["Tên"];
    
    const slotToUse = targetSlot || (equipData.VisualClass === "heavy-armor" ? "Giáp Thân" :
                                    equipData.VisualClass === "helmet" || equipData.VisualClass === "crown" ? "Mũ/Nón" :
                                    equipData.VisualClass === "shield" ? "Khiên" :
                                    equipData.VisualClass === "dagger" ? "Vũ Khí Phụ" : "Vũ Khí Chính");

    const existing = st["Trang Bị Đang Mặc"][slotToUse] as EquipItem | undefined;
    if (existing && existing["Tên"]) {
      if (!st["Kho Vũ Khí"]) st["Kho Vũ Khí"] = [];
      st["Kho Vũ Khí"].push(existing);
    }

    // Remove from stash
    st["Kho Vũ Khí"].splice(itemIndex, 1);

    st["Trang Bị Đang Mặc"][slotToUse] = equipData;
    recomputeDerived(st);
    useMvuStore.setState({ stat: st });
    showToast(`Đã mặc ${itemName} vào ${slotToUse}.`, 'success');
  };

  const handleRepair = (slot: keyof typeof equipped) => {
    const st = applyPatch(stat, []).state;
    const res = repairEquipment(st, slot);
    if (res.success) {
      useMvuStore.setState({ stat: st });
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleEnhance = (slot: keyof typeof equipped) => {
    const st = applyPatch(stat, []).state;
    const res = enhanceEquipment(st, slot);
    useMvuStore.setState({ stat: st });
    
    if (res.resultType === 'success') {
      showToast(res.message, 'success');
    } else if (res.resultType === 'fail_safe') {
      showToast(res.message, 'warning');
    } else if (res.resultType === 'fail_downgrade') {
      showToast(res.message, 'error');
    } else if (res.resultType === 'fail_broken') {
      showToast(res.message, 'fatal');
    } else {
      showToast(res.message, 'error'); // insufficient_funds
    }
  };

  const stash = (stat["Kho Vũ Khí"] || []) as EquipItem[];
  const equippableInventoryItems = stash.map((item, index) => ({
    name: item["Tên"],
    count: 1,
    desc: item["Mô Tả"],
    equipData: item,
    index: index
  }));

  return (
    <Modal open={open} onClose={onClose} title="Trang Bị" widthClass="max-w-5xl">
      {/* Notification Toast */}
      {messageToast && (
        <div className={`mb-3 p-3 rounded text-xs text-center font-bold ${
          messageToast.type === 'success' ? "bg-emerald-900/80 text-emerald-200 border border-emerald-500" : 
          messageToast.type === 'warning' ? "bg-orange-900/80 text-orange-200 border border-orange-500" :
          messageToast.type === 'fatal' ? "bg-red-950 text-red-400 border-2 border-red-500 animate-pulse" :
          "bg-red-900/80 text-red-200 border border-red-500"
        }`}>
          {messageToast.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Visualizer & Stat Summary */}
        <div className="flex-shrink-0 w-full md:w-80 flex flex-col items-center bg-black/30 rounded-lg p-4 border border-[var(--glass-border)]">
          <h3 className="font-display text-sm tracking-widest text-[var(--accent-text)] mb-2 flex items-center gap-1.5">
            <IconSpark size={16} /> HÌNH THÁI CƠ THỂ
          </h3>
          <p className="text-[11px] text-[var(--text-faint)] text-center mb-2">
            Màu sắc & đồ họa thay đổi theo trang bị.
          </p>

          <div className="scale-125 my-6">
            <BodyVisualizer 
              body={stat["Cơ Thể"] || {}} 
            />
          </div>

          {/* Stat Summary */}
          <div className="w-full mt-4 pt-4 border-t border-[var(--glass-border)] space-y-2">
            <h4 className="font-display text-xs tracking-wider text-[var(--text-soft)] flex items-center justify-between">
              <span className="flex items-center gap-1"><IconShield size={14} color="var(--accent-text)" /> TỔNG THUỘC TÍNH</span>
              <span className="text-[10px] text-amber-400 font-mono">Vàng: {currentGold}</span>
            </h4>
            {Object.keys(totalStats).length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                {Object.entries(totalStats).map(([k, v]) => (
                  <div key={k} className="bg-white/5 border border-white/10 px-2 py-1 rounded flex justify-between">
                    <span className="text-[var(--text-muted)] truncate text-[11px]">{k}</span>
                    <span className={`font-mono font-bold text-[11px] ${v >= 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
                      {v > 0 ? `+${v}` : v}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-faint)] italic">Chưa có thuộc tính nào từ trang bị.</p>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="flex-grow flex flex-col gap-4 min-w-0">
          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--glass-border)] gap-2 pb-1">
            <button
              onClick={() => setActiveTab("equipped")}
              className={`px-3 py-1.5 rounded-t text-xs font-display tracking-wider transition-colors ${
                activeTab === "equipped" ? "bg-[var(--accent-soft)] text-[var(--accent-text)] border-b-2 border-[var(--accent)] font-bold" : "text-[var(--text-muted)] hover:text-slate-200"
              }`}
            >
              Trang Bị & Tiệm Rèn
            </button>
            <button
              onClick={() => setActiveTab("sets")}
              className={`px-3 py-1.5 rounded-t text-xs font-display tracking-wider transition-colors ${
                activeTab === "sets" ? "bg-[var(--accent-soft)] text-[var(--accent-text)] border-b-2 border-[var(--accent)] font-bold" : "text-[var(--text-muted)] hover:text-slate-200"
              }`}
            >
              Bộ Trang Bị ({activeSets.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-t text-xs font-display tracking-wider transition-colors ${
                activeTab === "inventory" ? "bg-[var(--accent-soft)] text-[var(--accent-text)] border-b-2 border-[var(--accent)] font-bold" : "text-[var(--text-muted)] hover:text-slate-200"
              }`}
            >
              Kho Vũ Khí ({equippableInventoryItems.length})
            </button>
          </div>

          {/* TAB 1: EQUIPPED SLOTS & FORGE */}
          {activeTab === "equipped" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EQUIPMENT_SLOTS.map((slot) => {
                  const rawItem = equipped[slot as keyof typeof equipped] as EquipItem | undefined;
                  const item = rawItem && rawItem["Tên"] ? rawItem : undefined;
                  const isSelected = selectedSlot === slot;
                  const dur = item?.["Độ Bền"] ?? 100;
                  const level = item?.["Cấp Cường Hóa"] ?? 0;

                  return (
                    <div
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`transition-all bg-black/40 border rounded-md p-3 flex flex-col gap-2 cursor-pointer ${
                        isSelected ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--glass-border)] hover:border-slate-500"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                        <span>{slot}</span>
                        {item && (
                          <div className="flex gap-1 items-center">
                            {level > 0 && <span className="text-[10px] bg-amber-900/60 text-amber-200 px-1.5 py-0.2 rounded font-bold">+{level}</span>}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-[var(--accent-text)] border border-[var(--accent-border)]">
                              {item["Phẩm Chất"]}
                            </span>
                          </div>
                        )}
                      </div>

                      {item ? (
                        <div className="flex flex-col gap-2">
                          <div className="font-semibold text-sm text-[var(--text-soft)] truncate">{item["Tên"]}</div>
                          
                          {/* Attributes & Durability */}
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item["Thuộc Tính"] || {}).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-sm text-slate-200">
                                {k}: {v > 0 ? `+${v}` : v}
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[var(--text-faint)] pt-1 border-t border-white/5">
                            <span>Độ bền: <b className={dur < 40 ? "text-red-400" : "text-emerald-400"}>{dur}/100</b></span>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1.5">
                              {dur < 100 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRepair(slot as keyof typeof equipped); }}
                                  className="bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                                >
                                  <IconHammer size={10} /> Sửa
                                </button>
                              )}
                              {level < 5 && dur > 0 && (
                                <div className="group relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEnhance(slot as keyof typeof equipped); }}
                                    className="bg-amber-950/60 hover:bg-amber-800/80 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                                  >
                                    <IconStar size={10} /> +1
                                  </button>
                                  {/* Tooltip Enhance */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-44 p-2.5 bg-black/95 border border-amber-500/50 rounded shadow-xl text-[10px] z-10 pointer-events-none">
                                    {(() => {
                                       const req = getEnhanceRequirement(level, item["Phẩm Chất"] === "Thép Valyria" || item["Phẩm Chất"] === "Huyền Thoại");
                                       return (
                                         <div className="space-y-1.5 font-sans">
                                           <div className="text-amber-400 font-bold border-b border-white/10 pb-1 text-center text-[11px]">Cường Hóa Lên +{level + 1}</div>
                                           <div className="flex justify-between items-center"><span className="text-slate-400">Tỉ lệ thành công:</span> <span className="font-bold text-white">{Math.round(req.successRate * 100)}%</span></div>
                                           <div className="flex justify-between items-center text-yellow-300"><span>Vàng yêu cầu:</span> <span>{formatCurrencyShort(req.goldCost)}</span></div>
                                           <div className="flex justify-between items-center text-slate-300"><span>{req.materialName}:</span> <span>{req.materialCost}</span></div>
                                           <div className="mt-1 pt-1.5 border-t border-white/10 text-red-400 italic text-center">
                                             {level >= 3 ? "Thất bại: Có thể TỤT CẤP hoặc VỠ!" : level >= 2 ? "Thất bại: Có thể TỤT CẤP!" : "Thất bại: Chỉ mất nguyên liệu."}
                                           </div>
                                         </div>
                                       );
                                    })()}
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUnequip(slot as keyof typeof equipped); }}
                                className="text-[var(--danger)] hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 px-1.5 py-0.5 rounded transition-colors"
                              >
                                Tháo
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-[var(--text-faint)] opacity-40 bg-black/20 rounded border border-dashed border-[var(--glass-border)] hover:opacity-80 transition-opacity">
                          <div className="mb-2">
                            {slot === "Vũ Khí Chính" ? <IconCrossedSwords size={24} /> :
                             slot === "Vũ Khí Phụ" ? <IconShield size={24} /> :
                             slot === "Mũ/Nón" ? <IconCrown size={24} /> :
                             slot === "Giáp Thân" ? <IconLayers size={24} /> :
                             slot === "Khiên" ? <IconShield size={24} /> :
                             <IconSpark size={24} />}
                          </div>
                          <span className="text-[11px] italic">+ Nhấn để trang bị</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SET BONUSES */}
          {activeTab === "sets" && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <h4 className="text-xs font-display text-[var(--accent-text)] tracking-wider mb-2">DANH SÁCH BỘ TRANG BỊ & KÍCH HOẠT</h4>
              {EQUIPMENT_SETS.map((setDef) => {
                const activeInfo = activeSets.find((s) => s.setDef.id === setDef.id);
                const count = activeInfo ? activeInfo.count : 0;
                return (
                  <div key={setDef.id} className={`p-3 rounded-md border ${
                    count >= 2 ? "bg-amber-950/20 border-amber-500/40" : "bg-black/30 border-[var(--glass-border)] opacity-70"
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-[var(--text-soft)]">{setDef.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${count >= 2 ? "bg-amber-500 text-black font-bold" : "bg-white/10 text-slate-400"}`}>
                        Kích hoạt: {count}/4
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-faint)] mb-2 italic">{setDef.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2">
                      <div className={`p-1.5 rounded ${count >= 2 ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-200" : "bg-black/20 text-slate-500"}`}>
                        <b>Hiệu ứng (2 món):</b>
                        <p>{setDef.narrativeEffect2}</p>
                      </div>
                      <div className={`p-1.5 rounded ${count >= 4 ? "bg-amber-950/40 border border-amber-500/30 text-amber-200" : "bg-black/20 text-slate-500"}`}>
                        <b>Hiệu ứng (4 món):</b>
                        <p>{setDef.narrativeEffect4}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: INVENTORY ITEMS */}
          {activeTab === "inventory" && (
            <div className="space-y-3">
              {equippableInventoryItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {equippableInventoryItems.map((invItem) => (
                    <div
                      key={invItem.index + "-" + invItem.name}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", invItem.index.toString())}
                      className="cursor-grab active:cursor-grabbing bg-black/30 border border-[var(--glass-border)] rounded p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-semibold text-[var(--text-soft)] truncate">
                          {invItem.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-faint)] truncate">{invItem.desc || invItem.equipData["Phẩm Chất"]}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(invItem.equipData["Thuộc Tính"] || {}).map(([k, v]) => (
                            <span key={k} className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded">
                              {k}: {v > 0 ? `+${v}` : v}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEquipFromInventory(invItem.index, selectedSlot || undefined)}
                        className="shrink-0 bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] border border-[var(--accent-border)] text-xs font-medium px-3 py-1.5 rounded transition-colors"
                      >
                        Mặc Vào
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-black/20 rounded border border-dashed border-[var(--glass-border)] text-center text-xs text-[var(--text-faint)]">
                  Không tìm thấy trang bị nào có thể mặc trong túi đồ hiện tại.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
