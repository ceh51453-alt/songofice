import type { EquipItem } from "../../../mvu/schema";

interface Props {
  item: EquipItem;
  className?: string;
  style?: React.CSSProperties;
}

export function EquipmentTooltip({ item, className = "", style }: Props) {
  const dur = item["Độ Bền"] ?? 100;
  const level = item["Cấp Cường Hóa"] ?? 0;
  const isValyrian = item["Phẩm Chất"] === "Thép Valyria" || item["Phẩm Chất"] === "Huyền Thoại";

  return (
    <div 
      className={`absolute z-50 w-56 p-3 bg-black/95 border rounded shadow-2xl pointer-events-none backdrop-blur-sm ${
        isValyrian ? "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-slate-700 shadow-black/80"
      } ${className}`}
      style={style}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-semibold text-sm leading-tight ${isValyrian ? "text-amber-400" : "text-slate-100"}`}>
          {item["Tên"]} {level > 0 && <span className="text-amber-200 ml-1">+{level}</span>}
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
          isValyrian ? "bg-amber-900/60 text-amber-200 border-amber-500/50" : "bg-white/10 text-slate-300 border-white/20"
        }`}>
          {item["Phẩm Chất"]}
        </span>
      </div>
      
      {item["Bộ Trang Bị"] && (
        <div className="text-[10px] text-emerald-400 font-medium mb-2 italic">
          Thuộc Bộ: {item["Bộ Trang Bị"]}
        </div>
      )}

      {item["Mô Tả"] && (
        <div className="text-[11px] text-slate-400 mb-2 leading-relaxed">
          {item["Mô Tả"]}
        </div>
      )}

      <div className="space-y-1 mt-2 pt-2 border-t border-white/10">
        {Object.entries(item["Thuộc Tính"] || {}).length > 0 ? (
          Object.entries(item["Thuộc Tính"]).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-slate-300">{k}</span>
              <span className={v > 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>
                {v > 0 ? `+${v}` : v}
              </span>
            </div>
          ))
        ) : (
          <div className="text-[11px] text-slate-500 italic">Không có thuộc tính</div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Độ bền</span>
          <span className={dur < 30 ? "text-red-400" : "text-slate-300"}>{dur}/100</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${dur > 60 ? "bg-emerald-500" : dur > 30 ? "bg-amber-500" : "bg-red-500"}`} 
            style={{ width: `${dur}%` }}
          />
        </div>
      </div>
    </div>
  );
}
