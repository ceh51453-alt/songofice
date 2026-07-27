import { useMvuStore } from "../../state/mvuStore";
import { formatCurrencyShort } from "../../economy/currency";
import { EXCHANGE_RATES } from "../../economy/currency";
import { IconWheat, IconTree, IconStone, IconAnvil, IconCoin } from "./EconomyIcons";
import { IconMap } from "../icons";
import { ITEM_CATALOG } from "../../content/westeros/items";
import { REGIONS_BY_ID } from "../../content/westeros/regions";

const RESOURCE_CONFIG: Record<string, { icon: typeof IconCoin, basePrice: number }> = {
  "Lương Thực": { icon: IconWheat, basePrice: 10 * EXCHANGE_RATES.SILVER_TO_COPPER },
  "Gỗ": { icon: IconTree, basePrice: 15 * EXCHANGE_RATES.SILVER_TO_COPPER },
  "Đá": { icon: IconStone, basePrice: 20 * EXCHANGE_RATES.SILVER_TO_COPPER },
  "Quặng Sắt": { icon: IconAnvil, basePrice: 30 * EXCHANGE_RATES.SILVER_TO_COPPER },
  "Ngựa": { icon: IconCoin, basePrice: 1 * EXCHANGE_RATES.GOLD_TO_COPPER }, // 1 Vàng / con
  "Thép Valyria": { icon: IconCoin, basePrice: 2000 * EXCHANGE_RATES.GOLD_TO_COPPER }, // Cực đắt
};

function getRegionByLocation(location: string): string {
  if (!location) return "the_crownlands";
  if (REGIONS_BY_ID[location]) return location;
  const byName = Object.values(REGIONS_BY_ID).find(r => r.name === location || r.seat === location);
  if (byName) return byName.id;
  return "the_crownlands"; // default
}

export function MarketTab() {
  const stat = useMvuStore((s) => s.stat);
  const setByPath = useMvuStore((s) => s.setByPath);
  
  const inventory = stat["Thông Tin Nhân Vật"]["Tài Nguyên Gia Tộc"] || {};
  const location = stat["Thế Giới"]["Vị Trí"] || "Vương Đô";
  const currentRegionId = getRegionByLocation(location);
  const currentRegionName = REGIONS_BY_ID[currentRegionId]?.name || location;
  const market = stat["Thị Trường Khu Vực"]?.[currentRegionId];
  const prices = market?.["Hệ Số Giá"] || {};

  const handleBuy = (res: string, amount: number) => {
    const config = RESOURCE_CONFIG[res];
    if (!config) return;
    
    const mult = prices[res as keyof typeof prices] || 1;
    const costCopper = Math.round(config.basePrice * mult * amount);
    
    if (stat["Thông Tin Nhân Vật"]["Ngân Khố"] < costCopper) {
      alert("Không đủ vàng!");
      return;
    }
    
    setByPath(
      "stat_data.Thông Tin Nhân Vật.Ngân Khố",
      stat["Thông Tin Nhân Vật"]["Ngân Khố"] - costCopper
    );
    
    setByPath(
      `stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.${res}`,
      (inventory[res as keyof typeof inventory] || 0) + amount
    );
  };

  const handleSell = (res: string, amount: number) => {
    const currentQty = inventory[res as keyof typeof inventory] || 0;
    if (currentQty < amount) {
      alert("Không đủ tài nguyên để bán!");
      return;
    }

    const config = RESOURCE_CONFIG[res];
    if (!config) return;
    
    const mult = prices[res as keyof typeof prices] || 1;
    // Bán lại thường rẻ hơn 20%
    const earnCopper = Math.round(config.basePrice * mult * amount * 0.8);
    
    setByPath(
      "stat_data.Thông Tin Nhân Vật.Ngân Khố",
      stat["Thông Tin Nhân Vật"]["Ngân Khố"] + earnCopper
    );
    
    setByPath(
      `stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.${res}`,
      currentQty - amount
    );
  };

  const handleBuyArtifact = (item: typeof ITEM_CATALOG[0]) => {
    const costCopper = item.costGold * EXCHANGE_RATES.GOLD_TO_COPPER;
    if (stat["Thông Tin Nhân Vật"]["Ngân Khố"] < costCopper) {
      alert("Không đủ vàng để mua cổ vật!");
      return;
    }
    
    if (item.costValyrian > 0 && (inventory["Thép Valyria"] || 0) < item.costValyrian) {
      alert("Thương nhân yêu cầu thêm Thép Valyria để trao đổi cổ vật này!");
      return;
    }

    setByPath(
      "stat_data.Thông Tin Nhân Vật.Ngân Khố",
      stat["Thông Tin Nhân Vật"]["Ngân Khố"] - costCopper
    );

    if (item.costValyrian > 0) {
      setByPath(
        "stat_data.Thông Tin Nhân Vật.Tài Nguyên Gia Tộc.Thép Valyria",
        (inventory["Thép Valyria"] || 0) - item.costValyrian
      );
    }

    const stash = stat["Kho Vũ Khí"] || [];
    
    const newItem: any = {
      "Tên": item.name,
      "Phẩm Chất": item.costValyrian > 0 ? "Thép Valyria" : "Vô Giá",
      "Chất Liệu": item.costValyrian > 0 ? "Thép Valyria" : "Bí Ẩn",
      "Người Rèn": "Cổ Vật",
      "Thuộc Tính": item.stats,
      "Đặc Tính": [],
      "Mô Tả": item.description,
      "Độ Bền": 100
    };

    setByPath(
      "stat_data.Kho Vũ Khí",
      [...stash, newItem]
    );

    alert(`Đã mua thành công ${item.name}`);
  };

  return (
    <div className="space-y-4">
      {/* Kho Tài Nguyên */}
      <section className="glass-panel rounded-xl p-4">
        <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-[var(--accent-text)]">
          KHO TÀI NGUYÊN GIA TỘC
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(RESOURCE_CONFIG).map(([res, config]) => {
            const Icon = config.icon;
            const qty = inventory[res as keyof typeof inventory] || 0;
            return (
              <div key={res} className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)]">
                <Icon size={16} />
                <div className="flex flex-col">
                  <span className="text-[11px] text-[var(--text-faint)]">{res}</span>
                  <span className="text-[13px] font-mono text-[var(--text-soft)]">{qty.toLocaleString("vi-VN")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sàn Giao Dịch */}
      <section className="glass-panel rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[13px] font-semibold tracking-wide text-[var(--accent-text)] flex items-center gap-1.5">
            <IconMap size={14} /> SÀN GIAO DỊCH: {currentRegionName.toUpperCase()}
          </h3>
          <span className="text-[11px] text-[var(--text-muted)] italic">
            {market?.["Tin Đồn"]}
          </span>
        </div>
        <div className="space-y-2">
          {Object.entries(RESOURCE_CONFIG).map(([res, config]) => {
            const mult = prices[res as keyof typeof prices] || 1;
            const buyPrice = Math.round(config.basePrice * mult);
            const sellPrice = Math.round(config.basePrice * mult * 0.8);
            const Icon = config.icon;

            return (
              <div key={res} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-2 w-1/3">
                  <Icon size={14} color="var(--accent-text)" />
                  <span className="text-[12px] text-[var(--text-soft)]">{res}</span>
                </div>
                
                <div className="flex flex-col items-center w-1/3">
                  <span className="text-[10px] text-[var(--text-faint)]">Giá Mua / Bán</span>
                  <span className="text-[11px] font-mono">
                    <span className="text-[var(--danger)]">{formatCurrencyShort(buyPrice)}</span>
                    <span className="mx-1 text-[var(--text-muted)]">/</span>
                    <span className="text-[var(--ok)]">{formatCurrencyShort(sellPrice)}</span>
                  </span>
                </div>

                <div className="flex gap-2 justify-end w-1/3">
                  <button 
                    className="px-2 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded text-[11px] transition-colors"
                    onClick={() => handleBuy(res, 100)}
                  >
                    Mua x100
                  </button>
                  <button 
                    className="px-2 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded text-[11px] transition-colors"
                    onClick={() => handleSell(res, 100)}
                  >
                    Bán x100
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Thương Nhân Vãng Lai */}
      {market?.["Đang Có Thương Nhân"] && (
        <section className="glass-panel rounded-xl p-4 border border-[var(--warn)] shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[13px] font-semibold tracking-wide text-[var(--warn)] flex items-center gap-2">
              <IconCoin size={16} /> THƯƠNG NHÂN ĐẾN TỪ ESSOS
            </h3>
            <span className="text-[11px] text-[var(--text-faint)] italic">Cơ hội ngàn năm có một!</span>
          </div>
          <div className="space-y-2">
            {ITEM_CATALOG.filter(w => w.type === "Cổ Vật").map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(234,179,8,0.05)] border border-[rgba(234,179,8,0.2)]">
                <div className="flex flex-col w-2/3">
                  <span className="text-[13px] font-medium text-[var(--warn)]">{item.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.description}</span>
                </div>
                <div className="flex items-center gap-4 w-1/3 justify-end">
                  <div className="flex flex-col text-right text-[11px]">
                    <span>{item.costGold} Vàng</span>
                    {item.costValyrian > 0 && <span className="text-[var(--danger)]">{item.costValyrian} Thép Valyria</span>}
                  </div>
                  <button 
                    onClick={() => handleBuyArtifact(item)}
                    className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/50 rounded text-[11px] text-yellow-500 font-medium transition-colors"
                  >
                    Mua
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
