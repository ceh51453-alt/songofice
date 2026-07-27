import React, { useState } from "react";
import type { StatData, EquipItem, BodyPartSchema } from "../../../mvu/schema";
import { z } from "zod";
import { EquipmentTooltip } from "./EquipmentTooltip";

type BodyPart = z.infer<typeof BodyPartSchema>;

interface Props {
  body: Record<string, BodyPart>;
  equipped: StatData["Trang Bị Đang Mặc"];
  onClick?: () => void;
  onDropItem?: (slot: keyof StatData["Trang Bị Đang Mặc"], itemName: string) => void;
  className?: string;
}

export function BodyVisualizer({ body, equipped, onClick, onDropItem, className = "" }: Props) {
  const [hoveredSlot, setHoveredSlot] = useState<keyof StatData["Trang Bị Đang Mặc"] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getPart = (name: string) => body[name] || { "Tình Trạng": 100, "Triệu Chứng": ["Bình Thường"] };

  const getFill = (partData: BodyPart) => {
    const hp = partData["Tình Trạng"];
    const ailments = partData["Triệu Chứng"] || [];
    if (hp <= 0 || ailments.includes("Đứt Lìa") || ailments.includes("Tàn Phế")) return "#171717"; // bg-neutral-900
    if (ailments.includes("Hoại Tử")) return "#581c87"; // bg-purple-800
    if (ailments.includes("Nhiễm Độc")) return "#15803d"; // bg-green-700
    if (hp <= 20) return "var(--danger)";
    if (hp <= 50) return "#ea580c"; // bg-orange-600
    if (hp <= 80) return "var(--warn)";
    return "#64748b"; // bg-slate-500
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, slot: keyof StatData["Trang Bị Đang Mặc"]) => {
    e.preventDefault();
    const itemName = e.dataTransfer.getData("text/plain");
    if (itemName && onDropItem) {
      onDropItem(slot, itemName);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const renderPart = (
    name: string,
    slot: keyof StatData["Trang Bị Đang Mặc"],
    basePath: string,
    equipRender?: (item: EquipItem) => React.ReactNode
  ) => {
    const data = getPart(name);
    const rawItem = equipped?.[slot];
    const item = rawItem && rawItem["Tên"] ? rawItem : null;
    const fill = getFill(data);

    const isValyrian = item?.["Phẩm Chất"] === "Thép Valyria" || item?.["Phẩm Chất"] === "Huyền Thoại";
    const filter = isValyrian ? "drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))" : "none";

    return (
      <g
        onMouseEnter={() => item && setHoveredSlot(slot)}
        onMouseLeave={() => setHoveredSlot(null)}
        onMouseMove={handleMouseMove}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, slot)}
        className="cursor-pointer transition-all duration-300 hover:brightness-110"
        style={{ filter }}
      >
        {/* Base Body Part */}
        <path d={basePath} fill={fill} stroke="#334155" strokeWidth="1" />
        
        {/* Equipment Overlay */}
        {item && equipRender && equipRender(item)}
      </g>
    );
  };

  const hoveredItem = hoveredSlot && equipped?.[hoveredSlot]?.["Tên"] ? equipped[hoveredSlot] : null;

  return (
    <div 
      className={`relative ${className}`} 
      onClick={onClick}
      style={{ width: "160px", height: "240px" }} // Default size, can be scaled
    >
      <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-lg overflow-visible">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </radialGradient>
        </defs>

        {/* Head (Mũ/Nón) */}
        {renderPart("Đầu", "Mũ/Nón", "M 50 10 A 12 12 0 1 1 49.9 10", (item) => {
          const c = item.VisualColor || "#94a3b8";
          if (item.VisualClass === "crown") {
            return <path d="M 38 20 L 42 10 L 50 15 L 58 10 L 62 20 Z" fill="#d97706" stroke="#fcd34d" strokeWidth="1" />;
          }
          return <path d="M 37 15 A 13 13 0 0 1 63 15 L 63 22 L 37 22 Z" fill={c} stroke="#475569" strokeWidth="1" />;
        })}

        {/* Torso (Giáp Thân - Ngực & Bụng) */}
        {renderPart("Ngực", "Giáp Thân", "M 35 30 L 65 30 L 60 70 L 40 70 Z", (item) => {
          const c = item.VisualColor || "#cbd5e1";
          return (
            <path 
              d="M 34 29 L 66 29 L 62 72 L 38 72 Z" 
              fill={c} 
              opacity="0.9" 
              stroke="#64748b" 
              strokeWidth="1.5"
            />
          );
        })}

        {/* Left Arm (Vũ Khí Phụ) */}
        {renderPart("Tay Trái", "Vũ Khí Phụ", "M 33 32 L 20 65 L 25 68 L 36 38 Z", (item) => {
          if (item.VisualClass === "dagger") {
            return <path d="M 22 75 L 18 55 L 24 55 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />;
          }
          return null;
        })}

        {/* Shield (Khiên) */}
        {renderPart("Tay Trái", "Khiên", "M 0 0", (item) => {
          const c = item.VisualColor || "#475569";
          if (item.VisualClass === "shield") {
            return <path d="M 12 55 Q 22 45 32 55 L 28 75 Q 22 85 16 75 Z" fill={c} stroke="#94a3b8" strokeWidth="1" />;
          }
          return null;
        })}

        {/* Right Arm (Vũ Khí Chính) */}
        {renderPart("Tay Phải", "Vũ Khí Chính", "M 67 32 L 80 65 L 75 68 L 64 38 Z", (item) => {
          const c = item.VisualColor || "#e2e8f0";
          if (item.VisualClass === "sword" || item.VisualClass === "greatsword") {
            const w = item.VisualClass === "greatsword" ? 6 : 4;
            const l = item.VisualClass === "greatsword" ? 110 : 90;
            return (
              <g transform={`translate(77, 66) rotate(-30)`}>
                <rect x={-w/2} y={-l} width={w} height={l} fill={c} rx="1" />
                <rect x={-w-2} y={-20} width={w*2+4} height={4} fill="#d97706" />
                <rect x={-w/2+1} y={-4} width={w-2} height={12} fill="#78350f" />
              </g>
            );
          }
          if (item.VisualClass === "warhammer") {
            return (
              <g transform={`translate(77, 66) rotate(-30)`}>
                <rect x="-2" y="-60" width="4" height="70" fill="#475569" />
                <rect x="-8" y="-60" width="16" height="12" fill={item.VisualColor || "#334155"} rx="2" />
              </g>
            );
          }
          if (item.VisualClass === "bow") {
             return (
               <path d="M 70 40 Q 90 65 70 90" fill="none" stroke="#78350f" strokeWidth="3" />
             );
          }
          return null;
        })}

        {/* Legs (Vật Phẩm Đặc Biệt / Giày) */}
        {renderPart("Chân Trái", "Vật Phẩm Đặc Biệt", "M 41 72 L 41 120 L 48 120 L 48 72 Z", (item) => {
          return <path d="M 40 100 L 40 122 L 49 122 L 49 100 Z" fill={item.VisualColor || "#1e293b"} opacity="0.9" />;
        })}
        {renderPart("Chân Phải", "Vật Phẩm Đặc Biệt", "M 52 72 L 52 120 L 59 120 L 59 72 Z", (item) => {
          return <path d="M 51 100 L 51 122 L 60 122 L 60 100 Z" fill={item.VisualColor || "#1e293b"} opacity="0.9" />;
        })}
      </svg>

      {/* Portal-like Tooltip rendering */}
      {hoveredItem && (
        <EquipmentTooltip 
          item={hoveredItem} 
          style={{
            position: "fixed",
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            pointerEvents: "none"
          }}
        />
      )}
    </div>
  );
}

