

import React, { useEffect, useRef, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { formatCurrencyShort, EXCHANGE_RATES } from "../../economy/currency";

export const BUILDING_TEMPLATES = [
  { id: "farm", type: "Nông Trại", size: 1, cost: { "Ngân Khố": 100 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 200, "Đá": 0 }, turns: 2, desc: "+ Sản lượng Lương Thực" },
  { id: "market", type: "Chợ", size: 2, cost: { "Ngân Khố": 500 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 300, "Đá": 100 }, turns: 3, desc: "+ Vàng từ Thương Nhân" },
  { id: "barracks", type: "Trại Lính", size: 2, cost: { "Ngân Khố": 300 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 400, "Đá": 200 }, turns: 4, desc: "Tuyển quân nhanh hơn" },
  { id: "forge", type: "Lò Rèn", size: 1, cost: { "Ngân Khố": 200 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 100, "Đá": 300 }, turns: 2, desc: "+ Vũ khí / Áo giáp" },
  { id: "lumber", type: "Xưởng Gỗ", size: 1, cost: { "Ngân Khố": 100 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 50, "Đá": 0 }, turns: 1, desc: "+ Sản lượng Gỗ" },
  { id: "mine", type: "Mỏ Đá/Sắt", size: 2, cost: { "Ngân Khố": 400 * EXCHANGE_RATES.GOLD_TO_COPPER, "Gỗ": 400, "Đá": 0 }, turns: 3, desc: "+ Sản lượng Đá & Sắt" }
];

export function TabMapGrid({ territoryId, holding, isOwner }: { territoryId: string, holding: any, isOwner?: boolean }) {
  const setByPath = useMvuStore(s => s.setByPath);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: -14600, y: -14700 }); // (400 - 750*20), (300 - 750*20)
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const dragInfoRef = useRef<{
	  startX: number; startY: number;
	  startOffsetX: number; startOffsetY: number;
	  moved: boolean;
	} | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  
  // Xây Dựng
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [placementMode, setPlacementMode] = useState<any | null>(null); // template if placing
  const [hoverGrid, setHoverGrid] = useState<{x: number, y: number} | null>(null);

  const buildings = holding["Công Trình"] || {};
  const walls = holding["Tường Thành"] || [];
  const resources = holding["Tài Nguyên"] || {};
  
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

    // Draw Walls
    if (walls && Array.isArray(walls) && walls.length > 0) {
      ctx.strokeStyle = "#8a8a8a"; // Stone color
      ctx.lineWidth = Math.max(2, gridSize * 0.2);
      ctx.beginPath();
      for (const w of walls) {
        if (typeof w.x1 === 'number' && typeof w.y1 === 'number') {
           ctx.moveTo(w.x1 * gridSize, w.y1 * gridSize);
           ctx.lineTo(w.x2 * gridSize, w.y2 * gridSize);
        }
      }
      ctx.stroke();
    }

    // Draw Buildings
    for (const [, b] of Object.entries(buildings)) {
      const bx = (b as any)["Tọa Độ X"] || 0;
      const by = (b as any)["Tọa Độ Y"] || 0;
      const size = (b as any)["Kích Thước"] || 1;

      // Only draw if in viewport
      if (bx + size >= startCol && bx <= endCol && by + size >= startRow && by <= endRow) {
        // Highlight if selected
        if (selectedBuilding && selectedBuilding === b) {
            ctx.fillStyle = "rgba(255, 215, 0, 0.7)"; // Brighter gold for selected
        } else {
            ctx.fillStyle = "rgba(212, 175, 55, 0.5)"; // Gold for building
        }
        
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

    // Draw Placement Hover
    if (placementMode && hoverGrid) {
        const size = placementMode.size;
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
        ctx.fillRect(hoverGrid.x * gridSize, hoverGrid.y * gridSize, size * gridSize, size * gridSize);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(hoverGrid.x * gridSize, hoverGrid.y * gridSize, size * gridSize, size * gridSize);
    }

    ctx.restore();

  }, [buildings, walls, zoom, offset, selectedBuilding, placementMode, hoverGrid]);

	// Quy đổi toạ độ chuột (CSS px hiển thị) sang toạ độ vẽ nội bộ của canvas
	// (bắt buộc vì canvas width/height=800x600 nhưng bị className w-full h-full kéo giãn)
	const getCanvasPoint = (clientX: number, clientY: number) => {
	  const canvas = canvasRef.current;
	  if (!canvas) return null;
	  const rect = canvas.getBoundingClientRect();
	  const scaleX = canvas.width / rect.width;
	  const scaleY = canvas.height / rect.height;
	  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY, scaleX, scaleY };
	};

	  const handleWheel = (e: React.WheelEvent) => {
	  e.preventDefault();
	  const point = getCanvasPoint(e.clientX, e.clientY);
	  if (!point) return;

	  if (e.ctrlKey) {
		// Zoom quanh vị trí con trỏ — điểm đang trỏ tới đứng yên khi zoom
		const oldZoom = zoom;
		const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.01));
		if (newZoom === oldZoom) return;

		const mapX = (point.x - offset.x) / oldZoom;
		const mapY = (point.y - offset.y) / oldZoom;

		setZoom(newZoom);
		setOffset({
		  x: point.x - mapX * newZoom,
		  y: point.y - mapY * newZoom,
		});
	  } else {
		// Pan bằng scroll/trackpad — quy đổi theo scale để tốc độ khớp chuyển động thật
		setOffset(o => ({ x: o.x - e.deltaX * point.scaleX, y: o.y - e.deltaY * point.scaleY }));
	  }
	};

	const handlePointerDown = (e: React.PointerEvent) => {
	  const canvas = canvasRef.current;
	  if (canvas) canvas.setPointerCapture(e.pointerId);

	  dragInfoRef.current = {
		startX: e.clientX,
		startY: e.clientY,
		startOffsetX: offset.x,
		startOffsetY: offset.y,
		moved: false,
	  };
	  // Không cho kéo-thả pan khi đang đặt công trình — tránh đặt nhầm vị trí
	  if (!placementMode) setIsPanning(true);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
	  // ── Chế độ đặt công trình: chỉ cập nhật ô hover, KHÔNG kéo bản đồ ──
	  if (placementMode) {
		const point = getCanvasPoint(e.clientX, e.clientY);
		if (!point) return;
		const mapX = point.x - offset.x;
		const mapY = point.y - offset.y;
		const gridSize = 20 * zoom;
		setHoverGrid({ x: Math.floor(mapX / gridSize), y: Math.floor(mapY / gridSize) });
		return;
	  }

	  // ── Chế độ tương tác thường: kéo chuột để pan bản đồ ──
	  const drag = dragInfoRef.current;
	  if (!drag) return;

	  const dx = e.clientX - drag.startX;
	  const dy = e.clientY - drag.startY;
	  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;

	  if (drag.moved) {
		const point = getCanvasPoint(drag.startX, drag.startY);
		if (!point) return;
		setOffset({
		  x: drag.startOffsetX + dx * point.scaleX,
		  y: drag.startOffsetY + dy * point.scaleY,
		});
	  }
	};

	const handlePointerUp = (e: React.PointerEvent) => {
	  const canvas = canvasRef.current;
	  if (canvas) canvas.releasePointerCapture(e.pointerId);
	  setIsPanning(false);

	  const drag = dragInfoRef.current;
	  dragInfoRef.current = null;

	  // Nếu vừa kéo bản đồ (đủ ngưỡng di chuyển) thì không tính là click
	  if (drag?.moved && !placementMode) return;

	  const point = getCanvasPoint(e.clientX, e.clientY);
	  if (!point) return;

	  const mapX = point.x - offset.x;
	  const mapY = point.y - offset.y;
	  const gridSize = 20 * zoom;
	  const gridX = Math.floor(mapX / gridSize);
	  const gridY = Math.floor(mapY / gridSize);

	  if (placementMode) {
		// Xác nhận đặt công trình
		// TODO: Check bounds and overlap
		const newBuildingId = "B_" + Date.now();
		const newBuilding = {
		  "Loại": placementMode.type,
		  "Cấp Độ": 1,
		  "Tọa Độ X": gridX,
		  "Tọa Độ Y": gridY,
		  "Kích Thước": placementMode.size,
		  "Đang Xây": true,
		  "Turn Còn Lại": placementMode.turns,
		};

		const cost = placementMode.cost;
		const currentGold = resources["Ngân Khố"] || 0;
		const currentWood = resources["Gỗ"] || 0;
		const currentStone = resources["Đá"] || 0;

		setByPath(`Lãnh Địa.${territoryId}.Tài Nguyên.Ngân Khố`, currentGold - (cost["Ngân Khố"] || 0));
		setByPath(`Lãnh Địa.${territoryId}.Tài Nguyên.Gỗ`, currentWood - (cost["Gỗ"] || 0));
		setByPath(`Lãnh Địa.${territoryId}.Tài Nguyên.Đá`, currentStone - (cost["Đá"] || 0));
		setByPath(`Lãnh Địa.${territoryId}.Công Trình.${newBuildingId}`, newBuilding);

		setPlacementMode(null);
		setHoverGrid(null);
		return;
	  }

	  // Chế độ thường: chọn công trình theo vị trí click
	  let found = null;
	  for (const [, b] of Object.entries(buildings)) {
		const bx = (b as any)["Tọa Độ X"] || 0;
		const by = (b as any)["Tọa Độ Y"] || 0;
		const size = (b as any)["Kích Thước"] || 1;
		if (gridX >= bx && gridX < bx + size && gridY >= by && gridY < by + size) {
		  found = b;
		  break;
		}
	  }
	  setSelectedBuilding(found);
	};

	const handlePointerLeave = () => {
	  dragInfoRef.current = null;
	  setIsPanning(false);
	  setHoverGrid(null);
	};

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
        <div>
          <h2 className="text-white font-bold tracking-widest text-sm uppercase">Quy Hoạch Lãnh Địa</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">Lưới 1500x1500. Bán kính xây dựng: {buildableRadius} ô (Cấp {castleLevel}). Dùng Scroll để di chuyển, Ctrl+Scroll để Zoom.</p>
        </div>
        <div className="flex gap-2">
          {/* Construction toolbar could go here */}
          {isOwner && (
              <button 
                onClick={() => {
                    if (placementMode) {
                        setPlacementMode(null);
                        setHoverGrid(null);
                    } else {
                        setShowBuildMenu(!showBuildMenu);
                    }
                }}
                className={`px-3 py-1.5 text-white text-xs font-bold rounded hover:bg-opacity-80 ${placementMode ? 'bg-red-600' : 'bg-[var(--accent)]'}`}
              >
                {placementMode ? "HỦY ĐẶT" : "+ XÂY CÔNG TRÌNH"}
              </button>
          )}
        </div>
      </div>

      {showBuildMenu && (
        <div className="absolute top-16 right-4 w-72 bg-[#11141a] border border-[#D4AF37]/50 rounded-lg shadow-2xl z-20 overflow-hidden animate-fade-in flex flex-col max-h-[70vh]">
            <div className="bg-[#D4AF37]/20 p-3 border-b border-[#D4AF37]/30 flex justify-between items-center">
                <h3 className="text-[#D4AF37] font-bold">CHỌN CÔNG TRÌNH</h3>
                <button onClick={() => setShowBuildMenu(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 space-y-2">
                {BUILDING_TEMPLATES.map(tpl => {
                    const canAfford = (resources["Ngân Khố"] || 0) >= (tpl.cost["Ngân Khố"] || 0) &&
                                      (resources["Gỗ"] || 0) >= (tpl.cost["Gỗ"] || 0) &&
                                      (resources["Đá"] || 0) >= (tpl.cost["Đá"] || 0);
                    return (
                        <div key={tpl.id} className={`p-3 rounded border ${canAfford ? 'border-white/10 hover:border-[#D4AF37]/50 bg-black/40 cursor-pointer' : 'border-red-900/30 bg-red-900/10 opacity-50 cursor-not-allowed'}`}
                            onClick={() => {
                                if (canAfford) {
                                    setPlacementMode(tpl);
                                    setShowBuildMenu(false);
                                }
                            }}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-white">{tpl.type}</span>
                                <span className="text-xs text-[#D4AF37]">{tpl.turns} lượt</span>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mb-2 italic">{tpl.desc}</div>
                            <div className="flex gap-3 text-xs">
                                {tpl.cost["Ngân Khố"] > 0 && <span className={((resources["Ngân Khố"] || 0) < tpl.cost["Ngân Khố"]) ? "text-red-400" : "text-yellow-400"}>🪙 {formatCurrencyShort(tpl.cost["Ngân Khố"])}</span>}
                                {tpl.cost["Gỗ"] > 0 && <span className={((resources["Gỗ"] || 0) < tpl.cost["Gỗ"]) ? "text-red-400" : "text-green-400"}>🪵 {tpl.cost["Gỗ"]}</span>}
                                {tpl.cost["Đá"] > 0 && <span className={((resources["Đá"] || 0) < tpl.cost["Đá"]) ? "text-red-400" : "text-gray-400"}>🪨 {tpl.cost["Đá"]}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {placementMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(212,175,55,0.5)] z-20 animate-pulse">
              Click vào ô trống trên lưới để đặt {placementMode.type}
          </div>
      )}

		  <div className={`flex-1 bg-black/50 border border-white/10 rounded-lg overflow-hidden relative ${ placementMode ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}>
			  <canvas 
				ref={canvasRef} 
				width={800} 
				height={600} 
				className="w-full h-full touch-none"
				onWheel={handleWheel}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerLeave}
				onPointerCancel={handlePointerLeave}
			/>
        
        {/* Detail Modal overlay */}
        {selectedBuilding && !placementMode && (
            <div className="absolute top-4 left-4 bg-[#11141a] border border-[#D4AF37]/30 p-4 rounded-lg shadow-2xl w-64 text-sm z-10 animate-fade-in">
                <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-3">
                    <h3 className="font-bold text-[#D4AF37] text-base">{selectedBuilding["Loại"]}</h3>
                    <button 
                        onClick={() => setSelectedBuilding(null)}
                        className="text-white/50 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                <div className="space-y-2 text-white/80">
                    <div className="flex justify-between">
                        <span>Cấp Độ:</span>
                        <span className="font-bold">{selectedBuilding["Cấp Độ"]}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tọa Độ:</span>
                        <span>({selectedBuilding["Tọa Độ X"]}, {selectedBuilding["Tọa Độ Y"]})</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kích Thước:</span>
                        <span>{selectedBuilding["Kích Thước"]}x{selectedBuilding["Kích Thước"]}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tình Trạng:</span>
                        <span className={selectedBuilding["Đang Xây"] ? "text-yellow-500" : "text-green-500"}>
                            {selectedBuilding["Đang Xây"] ? `Đang Xây (${selectedBuilding["Turn Còn Lại"]} turn)` : "Hoạt Động"}
                        </span>
                    </div>
                </div>
                {!selectedBuilding["Đang Xây"] && (
                    <button 
                        onClick={() => window.alert("Tính năng Nâng Cấp đang được phát triển!")}
                        className="w-full mt-4 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#D4AF37] rounded font-bold transition-colors border border-[#D4AF37]/50"
                    >
                        Nâng Cấp
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
