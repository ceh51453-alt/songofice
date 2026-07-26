
import { useMvuStore } from "../../state/mvuStore";
import { IconShield, IconX } from "../icons";

interface KingdomsPanelProps {
  open: boolean;
  onClose: () => void;
}

const KINGDOMS = [
  { id: "the-north", name: "Phương Bắc" },
  { id: "the-vale", name: "Xứ Vale" },
  { id: "the-riverlands", name: "Riverlands" },
  { id: "the-westerlands", name: "Westerlands" },
  { id: "the-iron-islands", name: "Đảo Sắt" },
  { id: "the-crownlands", name: "Vương Đô" },
  { id: "the-stormlands", name: "Stormlands" },
  { id: "the-reach", name: "The Reach" },
  { id: "dorne", name: "Dorne" },
];

export function KingdomsPanel({ open, onClose }: KingdomsPanelProps) {
  const stat = useMvuStore((s) => s.stat);
  const sovereignty = stat["Chủ Quyền Lãnh Thổ"] || {};
  const military = stat["Biên Chế Quân Sự"] || {};

  if (!open) return null;

  // Tính tổng quân đội và tổng dân số theo từng vùng
  const kingdomData = KINGDOMS.map(k => {
    const sv = sovereignty[k.id];
    const rulerHouse = sv ? sv["Nhà Kiểm Soát"] : "Không Rõ";
    const rulerName = sv ? sv["Người Kiểm Soát"] : "Không Rõ";
    
    // Tìm các đạo quân đóng tại vùng này hoặc của nhà này
    let totalArmy = 0;
    Object.values(military).forEach(unit => {
      // Tạm tính quân thuộc nhà rulerHouse (sẽ cần logic map chuẩn hơn trong game)
      if (unit["Nhà"] === rulerHouse) {
        totalArmy += unit["Số Lượng"];
      }
    });

    return { ...k, rulerHouse, rulerName, totalArmy };
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="7 Vương Quốc">
      <div className="absolute inset-0 bg-[rgba(5,7,10,0.4)]" onClick={onClose} />
      <div className="glass-panel relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[var(--glass-border)] sm:w-96">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--glass-border)] bg-[rgba(10,13,18,0.6)] px-4">
          <h2 className="font-display text-[18px] tracking-wide text-[var(--text-soft)]">7 Vương Quốc</h2>
          <button onClick={onClose} aria-label="Đóng" className="p-1 text-[var(--text-muted)] hover:text-[var(--text-faint)]">
            <IconX size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {kingdomData.map((k) => (
            <div key={k.id} className="glass-panel p-3 border border-[var(--glass-border)] rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-display text-lg text-[var(--accent-text)]">{k.name}</h3>
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{k.rulerHouse}</span>
              </div>
              <div className="text-sm text-[var(--text-soft)] mb-3">
                Lãnh Chúa / Người Cai Trị: <span className="text-[var(--text-faint)]">{k.rulerName}</span>
              </div>
              
              <div className="flex gap-4 border-t border-[var(--glass-border)] pt-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <IconShield size={14} className="text-[var(--color-combat)]" />
                  <span>{k.totalArmy.toLocaleString("vi-VN")} lính</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
