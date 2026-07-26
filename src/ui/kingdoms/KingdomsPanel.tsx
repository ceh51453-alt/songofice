import { useMvuStore } from "../../state/mvuStore";
import { IconShield, IconX, IconCastle, IconUsers, IconCoins } from "../icons";
import { HOUSES_BY_ID } from "../../content/westeros/houses";
import { houseColor } from "../../content/westeros/houseColors";
import { REGIONS } from "../../content/westeros/regions";

interface KingdomsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function KingdomsPanel({ open, onClose }: KingdomsPanelProps) {
  const stat = useMvuStore((s) => s.stat);
  const sovereignty = stat["Chủ Quyền Lãnh Thổ"] || {};
  const military = stat["Biên Chế Quân Sự"] || {};
  const holdings = stat["Lãnh Địa"] || {};

  if (!open) return null;

  // Tính tổng quân đội và tổng dân số theo từng vùng
  const kingdomData = REGIONS.map(k => {
    const sv = sovereignty[k.id];
    const rulerHouseId = sv ? sv["Nhà Kiểm Soát"] : "";
    const rulerHouseName = HOUSES_BY_ID[rulerHouseId]?.name || rulerHouseId || "Chưa Rõ";
    const rulerHouseColor = rulerHouseId ? houseColor(rulerHouseId).base : "#888888";
    
    // Tìm các đạo quân đóng tại vùng này hoặc của nhà này
    let totalArmy = 0;
    Object.values(military).forEach(unit => {
      // Đếm quân đội đóng quân tại vùng này hoặc thuộc nhà cai trị (đơn giản hoá: quân đóng tại vùng)
      if (unit["Lãnh Địa Đồn Trú"] === k.id || unit["Nhà"] === rulerHouseId) {
        totalArmy += Number(unit["Số Lượng"]) || 0;
      }
    });

    // Thống kê thành trì, dân số, tài nguyên
    let totalHoldings = 0;
    let totalPopulation = 0;
    let totalGold = 0;
    let totalFood = 0;

    Object.values(holdings).forEach(holding => {
      if (holding["Thuộc Vùng"] === k.id) {
        totalHoldings += 1;
        totalPopulation += Number(holding["Dân Số"]) || 0;
        totalGold += Number(holding["Tài Nguyên"]?.["Vàng"]) || 0;
        totalFood += Number(holding["Tài Nguyên"]?.["Lương Thực"]) || 0;
      }
    });

    return { 
      ...k, 
      rulerHouseId, 
      rulerHouseName, 
      rulerHouseColor, 
      totalArmy, 
      totalHoldings, 
      totalPopulation, 
      totalGold, 
      totalFood 
    };
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="7 Vương Quốc">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.5)] backdrop-blur-sm" onClick={onClose} />
      <aside className="glass-strong anim-in relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-[var(--glass-border)] sm:w-[450px]">
        <header className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <IconCastle size={20} color="var(--accent-text)" />
            <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">Bảy Vương Quốc</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
            <IconX size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {kingdomData.map((k) => (
            <div key={k.id} className="glass rounded-[var(--radius-md)] p-4 relative overflow-hidden group hover:border-[var(--glass-border-bright)] transition-colors">
              <div className="absolute top-0 left-0 w-1.5 h-full opacity-80" style={{ backgroundColor: k.rulerHouseColor }} />
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display text-[16px] text-[var(--text-soft)]">{k.name}</h3>
                    <div className="text-[12px] mt-0.5 text-[var(--text-muted)]">
                      Lãnh chúa: <span style={{ color: k.rulerHouseColor }} className="font-semibold">{k.rulerHouseName}</span>
                    </div>
                  </div>
                  {k.rulerHouseId && (
                    <div className="shrink-0 w-8 h-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center rounded-sm">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: k.rulerHouseColor }}></div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
                    <IconCastle size={14} className="text-[var(--text-faint)]" />
                    <span><strong className="text-[var(--text-soft)]">{k.totalHoldings}</strong> thành trì</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
                    <IconUsers size={14} className="text-[var(--text-faint)]" />
                    <span><strong className="text-[var(--text-soft)]">{(k.totalPopulation/1000).toFixed(1)}k</strong> dân cư</span>
                  </div>

                  <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
                    <IconShield size={14} className="text-[var(--danger)] opacity-80" />
                    <span><strong className="text-[var(--text-soft)]">{k.totalArmy.toLocaleString("vi-VN")}</strong> quân đội</span>
                  </div>

                  <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
                    <IconCoins size={14} className="text-[var(--accent-text)] opacity-80" />
                    <span><strong className="text-[var(--text-soft)]">{(k.totalGold/1000).toFixed(1)}k</strong> vàng</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
