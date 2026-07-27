import { useMvuStore } from "../../state/mvuStore";
import { EXCHANGE_RATES } from "../../economy/currency";
import { IconAnvil } from "./EconomyIcons";
import type { EquipItem } from "../../mvu/schema";
import { ITEM_CATALOG, ItemConfig } from "../../content/westeros/items";
import { useState } from "react";

export function ForgeTab() {
  const stat = useMvuStore((s) => s.stat);
  const setByPath = useMvuStore((s) => s.setByPath);
  
  const inventory = stat["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"] || {};
  const gold = stat["Thông Tin Nhân Vật"]["Ngân Khố"] || 0;
  const stash = stat["Kho Vũ Khí"] || [];
  const [activeTab, setActiveTab] = useState<"Vũ Khí" | "Giáp Trụ" | "Thú Cưỡi">("Vũ Khí");

  const handleForge = (weapon: ItemConfig) => {
    const costCopper = weapon.costGold * EXCHANGE_RATES.GOLD_TO_COPPER;
    
    if (gold < costCopper) {
      alert("Không đủ Vàng (Ngân khố)!");
      return;
    }
    
    if (weapon.costIron > 0 && (inventory["Quặng Sắt"] || 0) < weapon.costIron) {
      alert("Không đủ Quặng Sắt!");
      return;
    }

    if (weapon.costWood > 0 && (inventory["Gỗ"] || 0) < weapon.costWood) {
      alert("Không đủ Gỗ!");
      return;
    }

    if (weapon.costValyrian && (inventory["Thép Valyria"] || 0) < weapon.costValyrian) {
      alert("Không đủ Thép Valyria!");
      return;
    }

    // Trừ tài nguyên
    setByPath("stat_data.Thông Tin Nhân Vật.Ngân Khố", gold - costCopper);

    if (weapon.costIron > 0) {
      setByPath(
        "stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.Quặng Sắt",
        (inventory["Quặng Sắt"] || 0) - weapon.costIron
      );
    }

    if (weapon.costWood > 0) {
      setByPath(
        "stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.Gỗ",
        (inventory["Gỗ"] || 0) - weapon.costWood
      );
    }

    if (weapon.costValyrian) {
      setByPath(
        "stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.Thép Valyria",
        (inventory["Thép Valyria"] || 0) - weapon.costValyrian
      );
    }

    // Xác suất phẩm chất
    const rand = Math.random();
    let quality = "Thường";
    if (weapon.costValyrian) quality = "Huyền Thoại"; // Thép Valyria luôn ra Huyền thoại
    else if (rand > 0.95) quality = "Huyền Thoại";
    else if (rand > 0.8) quality = "Thượng Hạng";
    else if (rand > 0.5) quality = "Tinh Xảo";

    const newItem: EquipItem = {
      "Tên": `${weapon.name} [${quality}]`,
      "Phẩm Chất": quality as any,
      "Chất Liệu": weapon.costValyrian ? "Thép Valyria" : "Thép Thường",
      "Người Rèn": "Lò Rèn Gia Tộc",
      "Thuộc Tính": weapon.stats,
      "Đặc Tính": [],
      "Mô Tả": weapon.description,
      "Độ Bền": 100
    };

    setByPath("stat_data.Kho Vũ Khí", [...stash, newItem]);
    
    alert(`Rèn thành công: ${weapon.id} (Phẩm chất: ${quality})`);
  };

  const handleEquip = (item: EquipItem) => {
    setByPath("stat_data.Trang Bị.Vũ Khí Chính", item);
    alert(`Đã trang bị ${item["Tên"]}`);
  };

  return (
    <div className="space-y-4">
      {/* Lò Rèn */}
      <section className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-[var(--glass-border)] pb-2">
          <div className="flex items-center gap-2">
            <IconAnvil size={18} color="var(--accent-text)" />
            <h3 className="text-[13px] font-semibold tracking-wide text-[var(--accent-text)]">
              XƯỞNG CHẾ TẠO
            </h3>
          </div>
          <div className="flex space-x-2">
            {['Vũ Khí', 'Giáp Trụ', 'Thú Cưỡi'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-2 py-1 text-[11px] font-medium transition-colors ${activeTab === tab ? 'bg-[var(--accent-text)] text-black rounded' : 'text-[var(--text-muted)] hover:text-[var(--text-soft)]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {ITEM_CATALOG.filter(w => w.type === activeTab).map((w) => (
            <div key={w.id} className="flex justify-between items-center p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)]">
              <div>
                <p className="text-[13px] font-medium text-[var(--text-soft)]">{w.name}</p>
                <div className="flex gap-3 text-[11px] text-[var(--text-faint)] mt-1">
                  <span>Vàng: {w.costGold}</span>
                  {w.costIron > 0 && <span>Sắt: {w.costIron}</span>}
                  {w.costWood > 0 && <span>Gỗ: {w.costWood}</span>}
                  {w.costValyrian > 0 && <span className="text-[var(--danger)]">Thép Valyria: {w.costValyrian}</span>}
                </div>
              </div>
              <button 
                onClick={() => handleForge(w)}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 rounded text-[12px] font-medium transition-all shadow-lg whitespace-nowrap ml-4"
              >
                Chế Tạo
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Kho Vũ Khí */}
      <section className="glass-panel rounded-xl p-4">
        <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-[var(--accent-text)]">
          KHO VŨ KHÍ ({stash.length})
        </h3>
        {stash.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)] italic">Chưa có vũ khí nào.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {stash.map((item, idx) => (
              <div key={idx} className="p-2 rounded bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] flex justify-between items-center">
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-soft)]">
                    {item["Tên"]} 
                    <span className={`ml-2 text-[10px] px-1 py-0.5 rounded ${
                      item["Phẩm Chất"] === "Huyền Thoại" || item["Phẩm Chất"] === "Thép Valyria" ? "bg-[var(--danger)] text-white" : 
                      item["Phẩm Chất"] === "Thượng Hạng" ? "bg-purple-900 text-purple-200" : "bg-gray-800 text-gray-400"
                    }`}>
                      {item["Phẩm Chất"]}
                    </span>
                  </p>
                  <p className="text-[10px] text-[var(--text-faint)] mt-0.5">
                    {Object.entries(item["Thuộc Tính"]).map(([k, v]) => `${k}: ${v > 0 ? '+'+v : v}`).join(" | ")}
                  </p>
                </div>
                <button 
                  onClick={() => handleEquip(item)}
                  className="px-2 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded text-[11px] transition-colors ml-2"
                >
                  Trang Bị
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
