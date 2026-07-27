import { useState } from "react";
import { Modal } from "../components/Modal";
import { useMvuStore } from "../../state/mvuStore";
import { getMoney, executeTrade } from "../../economy/commerce";
import { formatCurrencyFull, formatCurrencyShort } from "../../economy/currency";
import { GlassButton } from "../components/GlassButton";

interface Props {
  open: boolean;
  onClose: () => void;
  npcId: string;
}

export function TradeDialog({ open, onClose, npcId }: Props) {
  const stat = useMvuStore(s => s.stat);
  const npc = stat["Mối Quan Hệ"]["NPC Chính"][npcId];

  // Local state for the trade offer
  const [giveMoney, setGiveMoney] = useState(0); // Player -> NPC
  const [askMoney, setAskMoney] = useState(0);   // NPC -> Player

  const [giveItems, setGiveItems] = useState<Record<string, number>>({});
  const [askItems, setAskItems] = useState<Record<string, number>>({});

  if (!npc) return null;

  const playerMoney = getMoney(stat, "Player");
  const npcMoney = getMoney(stat, npcId);
  const playerInv = stat["Túi Đồ"] || {};
  const npcInv = npc["Túi Đồ"] || {};

  const handleTrade = () => {
    // Tạm thời chỉ hỗ trợ trao đổi tiền tệ và coi như NPC tự động đồng ý nếu Hảo Cảm > 0
    if ((askMoney > 0 || Object.keys(askItems).length > 0) && npc["Độ Hảo Cảm"] < 50) {
      window.alert(`${npc["Họ Tên"]} từ chối giao dịch: Hảo cảm chưa đủ cao!`);
      return;
    }

    const netMoney = giveMoney - askMoney; 

    // Kiểm tra số dư
    if (netMoney > 0 && playerMoney < netMoney) {
      window.alert("Bạn không đủ tiền!");
      return;
    }
    if (netMoney < 0 && npcMoney < -netMoney) {
      window.alert(`${npc["Họ Tên"]} không đủ tiền!`);
      return;
    }

    // Build items transfer array
    const itemsTransfer: { id: string, amount: number, from: "Player" | "Npc", desc?: string }[] = [];
    
    for (const [id, qty] of Object.entries(giveItems)) {
      if (qty > 0) itemsTransfer.push({ id, amount: qty, from: "Player", desc: playerInv[id]?.["Mô Tả"] });
    }
    for (const [id, qty] of Object.entries(askItems)) {
      if (qty > 0) itemsTransfer.push({ id, amount: qty, from: "Npc", desc: npcInv[id]?.["Mô Tả"] });
    }

    const statCopy = JSON.parse(JSON.stringify(useMvuStore.getState().stat));
    const success = executeTrade(statCopy, npcId, itemsTransfer, netMoney);
    
    if (success) {
      useMvuStore.setState({ stat: statCopy });
      window.alert("Giao dịch thành công!");
      onClose();
    } else {
      window.alert("Giao dịch thất bại! Có lỗi xảy ra hoặc vật phẩm không tồn tại.");
    }
  };

  const setItemQty = (type: "give" | "ask", id: string, val: number, max: number) => {
    const safeVal = Math.max(0, Math.min(val, max));
    if (type === "give") {
      setGiveItems(prev => ({ ...prev, [id]: safeVal }));
    } else {
      setAskItems(prev => ({ ...prev, [id]: safeVal }));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Giao Dịch với ${npc["Họ Tên"]}`} widthClass="max-w-2xl">
      <div className="space-y-6 text-[13px] text-[var(--text-soft)]">
        
        <div className="grid grid-cols-2 gap-6">
          {/* Cột Player */}
          <div className="glass-panel p-4 rounded-xl space-y-4">
            <h3 className="font-bold text-[var(--text-bright)] text-[14px]">Bạn</h3>
            <div>
              <span className="text-[var(--text-faint)]">Ngân Khố: </span>
              <span className="font-mono text-[var(--ok)]">{formatCurrencyFull(playerMoney)}</span>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[12px] text-[var(--text-faint)]">Tặng Tiền (Đồng):</label>
              <input 
                type="number" 
                min={0}
                max={playerMoney}
                step={56}
                value={giveMoney}
                onChange={e => {
                  setGiveMoney(Number(e.target.value));
                  setAskMoney(0);
                }}
                className="w-full bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded px-2 py-1 outline-none font-mono"
              />
              {giveMoney > 0 && <p className="text-[11px] text-[var(--warning)]">{formatCurrencyShort(giveMoney)}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
              <label className="block text-[12px] text-[var(--text-faint)]">Tặng Vật Phẩm:</label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {Object.entries(playerInv).length === 0 && (
                  <p className="text-[11px] text-[var(--text-muted)] italic">Túi đồ trống</p>
                )}
                {Object.entries(playerInv).map(([id, data]) => {
                  const qty = giveItems[id] || 0;
                  return (
                    <div key={id} className="flex items-center justify-between bg-[rgba(0,0,0,0.2)] p-1.5 rounded border border-[var(--glass-border)]">
                      <div className="truncate flex-1 pr-2">
                        <span className="text-[var(--text-bright)]">{id}</span>
                        <span className="text-[10px] ml-1 text-[var(--text-muted)]">(Có {data["Số Lượng"]})</span>
                      </div>
                      <input 
                        type="number"
                        min={0}
                        max={data["Số Lượng"]}
                        value={qty}
                        onChange={e => setItemQty("give", id, Number(e.target.value), data["Số Lượng"])}
                        className="w-16 bg-[var(--glass-bg-hover)] text-right border border-[var(--glass-border)] rounded px-1 outline-none font-mono"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cột NPC */}
          <div className="glass-panel p-4 rounded-xl space-y-4">
            <h3 className="font-bold text-[var(--text-bright)] text-[14px]">{npc["Họ Tên"]}</h3>
            <div>
              <span className="text-[var(--text-faint)]">Ngân Khố: </span>
              <span className="font-mono text-[var(--ok)]">{formatCurrencyFull(npcMoney)}</span>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] text-[var(--text-faint)]">Yêu Cầu Tiền (Đồng):</label>
              <input 
                type="number" 
                min={0}
                max={npcMoney}
                step={56}
                value={askMoney}
                onChange={e => {
                  setAskMoney(Number(e.target.value));
                  setGiveMoney(0);
                }}
                className="w-full bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded px-2 py-1 outline-none font-mono"
              />
              {askMoney > 0 && <p className="text-[11px] text-[var(--warning)]">{formatCurrencyShort(askMoney)}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
              <label className="block text-[12px] text-[var(--text-faint)]">Yêu Cầu Vật Phẩm:</label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {Object.entries(npcInv).length === 0 && (
                  <p className="text-[11px] text-[var(--text-muted)] italic">Túi đồ trống</p>
                )}
                {Object.entries(npcInv).map(([id, data]) => {
                  const qty = askItems[id] || 0;
                  return (
                    <div key={id} className="flex items-center justify-between bg-[rgba(0,0,0,0.2)] p-1.5 rounded border border-[var(--glass-border)]">
                      <div className="truncate flex-1 pr-2">
                        <span className="text-[var(--text-bright)]">{id}</span>
                        <span className="text-[10px] ml-1 text-[var(--text-muted)]">(Có {data["Số Lượng"]})</span>
                      </div>
                      <input 
                        type="number"
                        min={0}
                        max={data["Số Lượng"]}
                        value={qty}
                        onChange={e => setItemQty("ask", id, Number(e.target.value), data["Số Lượng"])}
                        className="w-16 bg-[var(--glass-bg-hover)] text-right border border-[var(--glass-border)] rounded px-1 outline-none font-mono"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--glass-border)]">
          <GlassButton onClick={onClose} variant="ghost">Hủy</GlassButton>
          <GlassButton onClick={handleTrade} variant="accent">Thỏa Thuận</GlassButton>
        </div>
      </div>
    </Modal>
  );
}
