import { useState } from "react";
import type { BodyPartSchema } from "../../../mvu/schema";
import { z } from "zod";

type BodyPart = z.infer<typeof BodyPartSchema>;

interface Props {
  body: Record<string, BodyPart>;
  onClick?: () => void;
  className?: string;
}

export function BodyVisualizer({ body, onClick, className = "" }: Props) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getPart = (name: string) => body[name] || { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"], "Thời Gian Lành Còn (giây)": 0 };

  const getFill = (partData: BodyPart) => {
    const hp = partData["Tình Trạng"];
    const ailments = partData["Triệu Chứng"] || [];
    if (hp <= 0 || ailments.includes("Đứt Lìa") || ailments.includes("Tàn Phế") || ailments.includes("Mất Huyết Áp")) return "#0f172a"; // bg-slate-900 (Black/dead)
    if (ailments.includes("Hoại Tử")) return "#4c1d95"; // deep purple
    if (ailments.includes("Nhiễm Trùng")) return "#166534"; // toxic green
    if (ailments.includes("Xuất Huyết")) return "#991b1b"; // deep red
    if (hp <= 20) return "#b91c1c"; // red-700
    if (hp <= 50) return "#c2410c"; // orange-700
    if (hp <= 80) return "#b45309"; // amber-700
    return "#1e293b"; // base anatomical blue (slate-800)
  };



  const renderPart = (
    name: string,
    basePath: string,
  ) => {
    const data = getPart(name);
    const fill = getFill(data);

    return (
      <path 
        d={basePath} 
        fill={fill} 
        stroke="#94a3b8" 
        strokeWidth="1.5"
        strokeLinejoin="round"
        onClick={(e) => {
          e.stopPropagation();
          setTooltipPos({ x: e.clientX, y: e.clientY });
          setSelectedPart(name);
        }}
        className="cursor-pointer transition-colors duration-300 hover:brightness-150 drop-shadow-md"
      />
    );
  };

  const selectedData = selectedPart ? getPart(selectedPart) : null;
  
  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (secs <= 0) return "0s";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div 
      className={`relative ${className}`} 
      onClick={() => {
        setSelectedPart(null);
        if (onClick) onClick();
      }}
      style={{ width: "200px", height: "400px", margin: "0 auto" }}
    >
      <svg viewBox="0 0 200 400" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.1)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0)" />
          </radialGradient>
        </defs>

        <rect x="-50" y="-50" width="300" height="500" fill="url(#glow)" pointerEvents="none" />

        {/* Head */}
        {renderPart("Đầu", "M 85 20 C 85 5, 115 5, 115 20 C 115 40, 105 50, 100 50 C 95 50, 85 40, 85 20 Z")}
        
        {/* Cổ (Neck) */}
        {renderPart("Cổ", "M 92 48 L 108 48 L 110 65 C 105 68, 95 68, 90 65 Z")}
        
        {/* Ngực (Chest) */}
        {renderPart("Ngực", "M 75 75 C 90 70, 110 70, 125 75 L 120 120 C 105 125, 95 125, 80 120 Z")}
        
        {/* Sườn (Ribs/Flanks) */}
        {renderPart("Sườn Trái", "M 65 75 C 70 73, 72 74, 75 75 L 80 120 L 75 140 C 65 115, 62 90, 65 75 Z")}
        {renderPart("Sườn Phải", "M 135 75 C 130 73, 128 74, 125 75 L 120 120 L 125 140 C 135 115, 138 90, 135 75 Z")}
        
        {/* Bụng (Abdomen) */}
        {renderPart("Bụng", "M 80 120 C 95 125, 105 125, 120 120 L 115 170 C 105 175, 95 175, 85 170 Z")}
        
        {/* Vai (Shoulders) */}
        {renderPart("Vai Trái", "M 90 65 L 65 75 C 50 80, 45 95, 50 110 L 65 105 Z")}
        {renderPart("Vai Phải", "M 110 65 L 135 75 C 150 80, 155 95, 150 110 L 135 105 Z")}

        {/* Bắp Tay (Upper Arm) */}
        {renderPart("Bắp Tay Trái", "M 50 110 L 65 105 L 55 160 C 50 162, 45 160, 40 155 Z")}
        {renderPart("Bắp Tay Phải", "M 150 110 L 135 105 L 145 160 C 150 162, 155 160, 160 155 Z")}

        {/* Cẳng Tay (Forearm) */}
        {renderPart("Cẳng Tay Trái", "M 40 155 L 55 160 C 50 190, 48 210, 45 220 L 32 215 C 34 200, 36 170, 40 155 Z")}
        {renderPart("Cẳng Tay Phải", "M 160 155 L 145 160 C 150 190, 152 210, 155 220 L 168 215 C 166 200, 164 170, 160 155 Z")}

        {/* Bàn Tay (Hand) */}
        {renderPart("Bàn Tay Trái", "M 32 215 L 45 220 L 40 250 L 25 245 Z")}
        {renderPart("Bàn Tay Phải", "M 168 215 L 155 220 L 160 250 L 175 245 Z")}

        {/* Đùi (Thigh) */}
        {renderPart("Đùi Trái", "M 85 170 C 90 172, 95 172, 100 175 C 95 210, 92 240, 90 260 L 70 255 C 75 220, 80 190, 85 170 Z")}
        {renderPart("Đùi Phải", "M 115 170 C 110 172, 105 172, 100 175 C 105 210, 108 240, 110 260 L 130 255 C 125 220, 120 190, 115 170 Z")}

        {/* Đầu Gối (Knee) */}
        {renderPart("Đầu Gối Trái", "M 70 255 L 90 260 C 90 270, 88 275, 88 280 L 68 275 C 68 270, 70 265, 70 255 Z")}
        {renderPart("Đầu Gối Phải", "M 130 255 L 110 260 C 110 270, 112 275, 112 280 L 132 275 C 132 270, 130 265, 130 255 Z")}

        {/* Bắp Chân (Calf) */}
        {renderPart("Bắp Chân Trái", "M 68 275 L 88 280 C 85 310, 82 330, 80 350 L 65 350 C 65 320, 66 300, 68 275 Z")}
        {renderPart("Bắp Chân Phải", "M 132 275 L 112 280 C 115 310, 118 330, 120 350 L 135 350 C 135 320, 134 300, 132 275 Z")}

        {/* Bàn Chân (Foot) */}
        {renderPart("Bàn Chân Trái", "M 65 350 L 80 350 L 75 380 L 55 380 Z")}
        {renderPart("Bàn Chân Phải", "M 135 350 L 120 350 L 125 380 L 145 380 Z")}
      </svg>

      {/* Tooltip */}
      {selectedPart && selectedData && (
        <div 
          className="fixed z-50 bg-[#0f172a]/95 border border-[var(--glass-border)] rounded-md p-3 shadow-2xl backdrop-blur-md min-w-[180px]"
          style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-2">
            <h4 className="font-display font-bold text-sm text-[var(--accent-text)] uppercase tracking-widest">{selectedPart}</h4>
            <button 
              className="text-slate-400 hover:text-white"
              onClick={() => {
                setSelectedPart(null);
              }}
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-muted)]">Tình Trạng:</span>
              <span className={`font-bold ${selectedData["Tình Trạng"] > 50 ? "text-emerald-400" : "text-red-400"}`}>
                {selectedData["Tình Trạng"].toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-muted)]">Triệu Chứng:</span>
              <span className="text-[var(--text-soft)]">{selectedData["Triệu Chứng"].join(", ")}</span>
            </div>

            {(selectedData["Thời Gian Lành Còn (giây)"] || 0) > 0 && (
              <div className="flex justify-between gap-4 mt-2 pt-2 border-t border-white/10">
                <span className="text-amber-400">Đang Hồi Phục:</span>
                <span className="text-amber-200 font-mono">{formatTime(selectedData["Thời Gian Lành Còn (giây)"]!)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
