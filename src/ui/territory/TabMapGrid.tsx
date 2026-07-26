

import React, { useEffect, useRef, useState } from "react";

export function TabMapGrid({ holding }: { territoryId: string, holding: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const buildings = holding["Công Trình"] || {};
  
  let castleLevel = 1;
  for (const b of Object.values(buildings)) {
      if ((b as any)["Loại"] === "Lâu Đài") {
          castleLevel = (b as any)["Cấp Độ"] || 1;
          break;
      }
  }
  const buildableRadius = 10 + castleLevel * 10;
  const centerCol = 750;
  const centerRow = 750;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Fill outer background (darker for out of bounds)
    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    const gridSize = 20 * zoom;

    // Draw Buildable Area Highlight
    const startX = (centerCol - buildableRadius) * gridSize;
    const startY = (centerRow - buildableRadius) * gridSize;
    const boxSize = (buildableRadius * 2 + 1) * gridSize;
    
    ctx.fillStyle = "rgba(17, 20, 26, 1)"; // Lighter for buildable area
    ctx.fillRect(startX, startY, boxSize, boxSize);
    
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, boxSize, boxSize);

    // Grid properties
    const gridCols = 1500;
    const gridRows = 1500;

    // Draw Grid (Optimization: only draw visible lines)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    
    const startCol = Math.max(0, Math.floor(-offset.x / gridSize));
    const endCol = Math.min(gridCols, Math.ceil((width - offset.x) / gridSize));
    const startRow = Math.max(0, Math.floor(-offset.y / gridSize));
    const endRow = Math.min(gridRows, Math.ceil((height - offset.y) / gridSize));

    ctx.beginPath();
    for (let x = startCol; x <= endCol; x++) {
      ctx.moveTo(x * gridSize, startRow * gridSize);
      ctx.lineTo(x * gridSize, endRow * gridSize);
    }
    for (let y = startRow; y <= endRow; y++) {
      ctx.moveTo(startCol * gridSize, y * gridSize);
      ctx.lineTo(endCol * gridSize, y * gridSize);
    }
    ctx.stroke();

    // Draw Buildings
    for (const [, b] of Object.entries(buildings)) {
      const bx = (b as any)["Tọa Độ X"] || 0;
      const by = (b as any)["Tọa Độ Y"] || 0;
      const size = (b as any)["Kích Thước"] || 1;

      // Only draw if in viewport
      if (bx + size >= startCol && bx <= endCol && by + size >= startRow && by <= endRow) {
        ctx.fillStyle = "rgba(212, 175, 55, 0.5)"; // Gold for building
        ctx.fillRect(bx * gridSize, by * gridSize, size * gridSize, size * gridSize);
        
        ctx.strokeStyle = "#D4AF37";
        ctx.strokeRect(bx * gridSize, by * gridSize, size * gridSize, size * gridSize);

        // Label
        if (gridSize > 15) {
          ctx.fillStyle = "white";
          ctx.font = `${Math.max(10, gridSize * 0.4)}px sans-serif`;
          ctx.fillText((b as any)["Loại"].substring(0, 3), bx * gridSize + 2, by * gridSize + gridSize / 2);
        }
      }
    }

    ctx.restore();

  }, [buildings, zoom, offset]);

  // Pan handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
        const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.01));
        setZoom(newZoom);
    } else {
        setOffset({ x: offset.x - e.deltaX, y: offset.y - e.deltaY });
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
        <div>
          <h2 className="text-white font-bold tracking-widest text-sm uppercase">Quy Hoạch Lãnh Địa</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Lưới 1500x1500. Bán kính xây dựng: {buildableRadius} ô (Cấp {castleLevel}). Dùng Scroll để di chuyển, Ctrl+Scroll để Zoom.</p>
        </div>
        <div className="flex gap-2">
          {/* Construction toolbar could go here */}
          <button className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded hover:bg-opacity-80">
            + XÂY CÔNG TRÌNH
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black/50 border border-white/10 rounded-lg overflow-hidden relative cursor-grab">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full"
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
}
