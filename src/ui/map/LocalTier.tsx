/**
 * LocalTier — TẦNG 1 (Bản Đồ Lãnh Địa), lưới 5 × 5 m.
 *
 * Đây là tầng dữ liệu GỐC: đặt công trình ở đây thì khu dân cư ở Tầng 2 và cán
 * cân quyền lực ở Tầng 3 đổi theo (mapAggregate.ts).
 *
 * Ba công cụ trên cùng một mặt bản đồ:
 *   XEM     — bấm vào công trình để đọc sổ nhân lực và sản lượng thật của nó.
 *   ĐẶT     — chọn loại công trình rồi bấm ô. Mỏ chỉ đặt được trên mạch tài nguyên.
 *   TƯỜNG   — bấm điểm, bấm điểm nữa, bấm tiếp… xong thì Đồng Ý. Chi phí và thời
 *             gian hiện ngay theo cấp và độ dài đã vạch. Tường là dữ liệu riêng
 *             nên nâng cấp Lâu Đài KHÔNG còn xoá mất bức tường cũ.
 *
 * Quan lộ chạy hết bản đồ chứ không dừng ở cổng thành (localTown.throughRoads),
 * và điểm tài nguyên lấy thẳng từ state để AI và bản đồ luôn nói cùng một chuyện.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { useTerritoryStore } from "../../state/territoryStore";
import { formatCurrencyShort } from "../../economy/currency";
import { formatDuration } from "../../mvu/calendar";
import {
  BUILDING_CATALOG, BUILDABLE_LIST, BUILDING_CATEGORIES, LABOUR_LIST,
  buildingDays, buildingLabour, type BuildingType,
} from "../../content/westeros/buildings";
import { availableLabour, buildingLedgers, type BuildingLedger } from "../../territory/construction";
import { analysePopulation } from "../../territory/population";
import { NODE_GRADE_LABEL } from "../../territory/resourceNodes";
import { planWall, WALL_MATERIALS_DEF, wallDefense, type WallPoint } from "../../territory/walls";
import { TERRAIN_TRAITS } from "../../content/westeros/terrain";
import {
  LOCAL_CELL_M, LOCAL_CENTER_CELL, LOCAL_GRID_CELLS, buildableRadiusCells,
} from "../../content/westeros/mapScale";
import { canPlace, castleLevel, buildingAt, terrainOf, loreOf, nodesOf } from "../../territory/localMap";
import { compassToAngle } from "../../content/westeros/loreSeats";
import { terrainAtCell, terrainRasterRGBA, RASTER_RES } from "../../territory/localTerrain";
import { townLayout, type TownLayout } from "../../territory/localTown";
import { holdingOwnedByPlayer } from "../../territory/territoryEngine";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import type { CustomBuilding, WallMaterial } from "../../mvu/schema";
import { IconX, IconAlert } from "../icons";

/** Màu chấm điểm tài nguyên theo loại hàng khai thác được. */
const NODE_COLOR: Record<string, string> = {
  "Gỗ": "#4c7a52",
  "Đá": "#9a958c",
  "Quặng Sắt": "#a98a52",
  "Than Đá": "#4a4642",
  "Đồng": "#b5763f",
  "Thiếc": "#8fa3ad",
  "Muối": "#d8d3c4",
  "Lương Thực": "#b3a55e",
  "Thảo Dược": "#6fa86b",
  "Lanh": "#a8b083",
  "Da Thú": "#9c7a56",
  "Sáp Ong": "#d2ae53",
  "Cá Khô": "#5d97b5",
  "Hắc Diện Thạch": "#6b4f8a",
};
const NODE_FALLBACK = "#8a8a8a";

/** Bảng màu công trình — mái/tường theo công năng, tránh một sắc vàng đều tăm tắp. */
const BUILDING_SKIN: Record<BuildingType, { wall: string; roof: string }> = {
  // hành chính & phòng thủ — đá xám, mái chì
  "Lâu Đài": { wall: "#8d8778", roof: "#5c5f6b" },
  "Tường Thành": { wall: "#8f8a7e", roof: "#6f6a60" },
  "Tháp Canh": { wall: "#8a8578", roof: "#5f6167" },
  "Doanh Trại": { wall: "#7d7565", roof: "#5a534a" },
  "Học Viện Nhỏ": { wall: "#93897a", roof: "#5f6360" },
  "Sept/Rừng Thần": { wall: "#9c968a", roof: "#6c6a74" },
  // lương thực — nâu vàng của rơm rạ và ruộng đồng
  "Nông Trại": { wall: "#8a7a4e", roof: "#6f5f38" },
  "Bến Cá": { wall: "#7d7360", roof: "#4f6068" },
  "Ruộng Muối": { wall: "#a9a494", roof: "#8d8b80" },
  "Kho Lương": { wall: "#8f7d55", roof: "#6a5a39" },
  // khai thác — đất đá thô
  "Xưởng Cưa": { wall: "#84754f", roof: "#5f5637" },
  "Mỏ Đá": { wall: "#8b8681", roof: "#63605c" },
  "Mỏ Sắt": { wall: "#7e7167", roof: "#574e48" },
  "Mỏ Than": { wall: "#5f5a56", roof: "#3d3a38" },
  // chế tác — ám khói và gỗ mới
  "Lò Rèn": { wall: "#7a6a5c", roof: "#4a423d" },
  "Xưởng Dệt": { wall: "#9b8f77", roof: "#726550" },
  "Chuồng Ngựa": { wall: "#8b7a5c", roof: "#655640" },
  "Xưởng Đóng Tàu": { wall: "#87775d", roof: "#55606a" },
  // thương mại — mái vải và cờ hiệu
  "Chợ": { wall: "#9a8461", roof: "#7c5f43" },
  "Bến Cảng": { wall: "#7a6f5e", roof: "#57626d" },
  "Quán Trọ": { wall: "#96825f", roof: "#6d5a3f" },
  // dân cư — mái rơm và tường trát bùn
  "Nhà Ở": { wall: "#9b8a6d", roof: "#8a7442" },
  "Khu Phố Thợ": { wall: "#93825f", roof: "#75603d" },
  // chế tác mở rộng
  "Trại Chăn Nuôi": { wall: "#8b8258", roof: "#6b6440" },
  "Xưởng Thuộc Da": { wall: "#7f7053", roof: "#584c38" },
  "Xưởng Gốm": { wall: "#8e7b62", roof: "#6a5641" },
  "Vườn Nho": { wall: "#6f7a4a", roof: "#58623a" },
  "Nhà Ủ Bia": { wall: "#8d7c56", roof: "#665737" },
  "Xưởng Vũ Khí": { wall: "#7b6f63", roof: "#4c443e" },
  // đặc biệt — vật liệu nặng, màu lạnh
  "Nhà Sàn": { wall: "#7d7355", roof: "#5c5740" },
  "Đê Chắn Sóng": { wall: "#7e8288", roof: "#5c6167" },
  "Pháo Đài Vách Đá": { wall: "#79736c", roof: "#4e4a45" },
  "Cầu Đá": { wall: "#8c8780", roof: "#6a655f" },
  // tuỳ chỉnh — sắc trung tính để tên người chơi đặt là thứ nổi bật
  "Công Trình Tuỳ Chỉnh": { wall: "#8a8a86", roof: "#5f5f5c" },
};

interface View {
  /** px màn hình cho mỗi Ô lưới. */
  scale: number;
  tx: number;
  ty: number;
}

export function LocalTier({ holdingId, onExit }: { holdingId: string; onExit?: () => void }) {
  const stat = useMvuStore((s) => s.stat);
  const placeBuild = useTerritoryStore((s) => s.placeBuild);
  const drawWall = useTerritoryStore((s) => s.drawWall);
  const raiseWall = useTerritoryStore((s) => s.raiseWall);
  const razeWall = useTerritoryStore((s) => s.razeWall);
  const holding = stat["Lãnh Địa"][holdingId];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const [view, setView] = useState<View>({ scale: 0.4, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<BuildingType | null>(null);
  const [custom, setCustom] = useState<CustomBuilding | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // ── công cụ vạch tường ──
  const [wallMode, setWallMode] = useState(false);
  const [wallPoints, setWallPoints] = useState<WallPoint[]>([]);
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>("Đá");
  const [wallLevel, setWallLevel] = useState(1);
  const [wallPanel, setWallPanel] = useState(false);

  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);

  const isOwner = holding ? holdingOwnedByPlayer(stat, holdingId) : false;
  const terrain = useMemo(() => terrainOf(holdingId, holding), [holdingId, holding]);
  const nodes = useMemo(() => nodesOf(holdingId, holding), [holdingId, holding]);
  const level = castleLevel(holding);
  const radius = buildableRadiusCells(level);
  const buildings = holding?.["Công Trình"] ?? {};
  const walls = holding?.["Tường Thành"] ?? [];
  const stock = holding?.["Tài Nguyên"] ?? ({} as Record<string, number>);
  const region = REGIONS_BY_ID[holding?.["Thuộc Vùng"] ?? ""];
  const lore = loreOf(holdingId, holding);

  /** sổ dân cư + sổ sản xuất — cùng nguồn với engine chốt sổ tháng. */
  const population = useMemo(() => (holding ? analysePopulation(holding) : null), [holding]);
  const ledgers = useMemo(
    () => (holding ? buildingLedgers(holdingId, holding, population ?? undefined) : []),
    [holdingId, holding, population],
  );
  const ledgerByName = useMemo(() => {
    const map: Record<string, BuildingLedger> = {};
    for (const l of ledgers) map[l.name] = l;
    return map;
  }, [ledgers]);

  /** ảnh nền địa thế — dựng một lần cho mỗi lãnh địa rồi phóng to thu nhỏ. */
  const backdrop = useMemo(() => {
    if (typeof document === "undefined") return null;
    const off = document.createElement("canvas");
    off.width = RASTER_RES;
    off.height = RASTER_RES;
    const octx = off.getContext("2d");
    if (!octx) return null;
    const img = octx.createImageData(RASTER_RES, RASTER_RES);
    img.data.set(terrainRasterRGBA(terrain));
    octx.putImageData(img, 0, 0);
    return off;
  }, [terrain]);

  /** hình hài thành: quan lộ chạy hết bản đồ, trục lộ, ngõ, cầu. */
  const town: TownLayout = useMemo(
    () => townLayout(
      terrain,
      Object.values(buildings).map((b) => ({
        x: b["Tọa Độ X"], y: b["Tọa Độ Y"],
        size: BUILDING_CATALOG[b["Loại"]]?.footprint ?? 1,
        ring: !!BUILDING_CATALOG[b["Loại"]]?.ring,
      })),
      {
        wallRadius: radius * 0.52,
        hasWall: false,
        playerWalls: walls.length > 0,
        loreRoads: lore?.roads.map((r) => ({ name: r.name, angle: compassToAngle(r.dir), main: r.main })),
      },
    ),
    [terrain, buildings, radius, walls.length, lore],
  );

  /** nhân công còn rảnh — quyết định có khởi công được không, ngang với vật tư. */
  const freeLabour = useMemo(
    () => (holding ? availableLabour(holding) : { "Dân Phu": 0, "Thợ Đá": 0, "Thợ Mộc": 0, "Thợ Rèn": 0, "Kỹ Sư": 0 }),
    [holding],
  );

  const hoverCheck = placing && hover ? canPlace(stat, holdingId, placing, hover.x, hover.y) : null;
  const wallPlan = useMemo(
    () => (wallPoints.length >= 2 ? planWall(wallPoints, wallLevel, wallMaterial, terrain) : null),
    [wallPoints, wallLevel, wallMaterial, terrain],
  );

  // ── khung nhìn ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize({ w, h });
      const span = radius * 2.4;
      const scale = Math.min(w / span, h / span);
      setView({ scale, tx: w / 2 - LOCAL_CENTER_CELL * scale, ty: h / 2 - LOCAL_CENTER_CELL * scale });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [holdingId, radius]);

  // ── vẽ ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h } = size;
    const { scale, tx, ty } = view;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#070a0e";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(tx, ty);

    // 1. nền đất — ảnh trường địa hình, để trình duyệt nội suy cho mượt
    if (backdrop) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(backdrop, 0, 0, LOCAL_GRID_CELLS * scale, LOCAL_GRID_CELLS * scale);
    }

    // 2. mặt nước lấp lánh dọc tim sông — gợi dòng chảy chứ không phải vệt tô
    if (terrain.river.length > 1) {
      ctx.strokeStyle = "rgba(150, 200, 230, 0.16)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(terrain.river[0].x * scale, terrain.river[0].y * scale);
      for (let i = 1; i < terrain.river.length - 1; i++) {
        const a = terrain.river[i];
        const b = terrain.river[i + 1];
        ctx.quadraticCurveTo(a.x * scale, a.y * scale, ((a.x + b.x) / 2) * scale, ((a.y + b.y) / 2) * scale);
      }
      ctx.lineWidth = Math.max(1, 3 * scale);
      ctx.stroke();
    }

    // 3. QUAN LỘ — vẽ TRƯỚC lớp tối vùng ngoài quy hoạch, vì đường cái chạy hết
    //    bản đồ chứ không dừng ở ranh giới đất mình
    drawPath(ctx, town.throughRoads.filter((r) => r.main).map((r) => r.points), scale, "rgba(20,17,13,0.32)", Math.max(1.6, 17 * scale));
    drawPath(ctx, town.throughRoads.filter((r) => r.main).map((r) => r.points), scale, "rgba(190,172,136,0.78)", Math.max(1.2, 12 * scale));
    drawPath(ctx, town.throughRoads.filter((r) => !r.main).map((r) => r.points), scale, "rgba(168,152,120,0.55)", Math.max(0.9, 8 * scale));

    // 4. ngoài vùng quy hoạch = đất hoang chưa khai phá, tối đi
    ctx.save();
    ctx.beginPath();
    ctx.rect(-tx, -ty, w, h);
    ctx.arc(LOCAL_CENTER_CELL * scale, LOCAL_CENTER_CELL * scale, radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(4,6,10,0.42)";
    ctx.fill("evenodd");
    ctx.restore();
    ctx.strokeStyle = "rgba(212,175,55,0.32)";
    ctx.setLineDash([12, 9]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(LOCAL_CENTER_CELL * scale, LOCAL_CENTER_CELL * scale, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. ngõ và trục lộ trong thành
    drawPath(ctx, town.lanes, scale, "rgba(150,136,110,0.5)", Math.max(0.7, 4 * scale));
    drawPath(ctx, town.mainRoads, scale, "rgba(24,20,16,0.35)", Math.max(1.4, 15 * scale));
    drawPath(ctx, town.mainRoads, scale, "rgba(186,168,132,0.72)", Math.max(1, 11 * scale));

    // 6. cầu — chỉ ở chỗ đường thật sự vượt sông
    for (const br of town.bridges) {
      ctx.save();
      ctx.translate(br.at[0] * scale, br.at[1] * scale);
      ctx.rotate(br.angle);
      const L = br.span * scale * 1.1;
      const W = br.width * scale;
      ctx.fillStyle = "rgba(140,132,118,0.92)";
      ctx.fillRect(-L / 2, -W / 2, L, W);
      ctx.strokeStyle = "rgba(40,36,30,0.7)";
      ctx.lineWidth = Math.max(0.6, 1.2 * scale);
      ctx.strokeRect(-L / 2, -W / 2, L, W);
      ctx.restore();
    }

    // 7. TƯỜNG THÀNH do người chơi vạch — mỗi tuyến giữ đúng hình đã vẽ, không
    //    bao giờ bị vẽ lại theo bán kính quy hoạch
    for (const wall of walls) {
      const pts = wall["Điểm"];
      if (pts.length < 2) continue;
      const mat = WALL_MATERIALS_DEF.find((m) => m.id === wall["Vật Liệu"]);
      const thick = Math.max(1.6, (5 + wall["Cấp"] * 2.6) * scale);
      const dim = wall["Đang Xây"] ? 0.42 : 0.55 + (wall["Nguyên Vẹn"] / 100) * 0.45;

      ctx.beginPath();
      ctx.moveTo(pts[0].x * scale, pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * scale, pts[i].y * scale);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (wall["Đang Xây"]) ctx.setLineDash([10, 8]);
      ctx.strokeStyle = `rgba(18,16,13,${0.5 * dim})`;
      ctx.lineWidth = thick * 1.4;
      ctx.stroke();
      ctx.strokeStyle = wall["Vật Liệu"] === "Gỗ"
        ? `rgba(150,118,74,${dim})`
        : wall["Vật Liệu"] === "Đá Đen"
          ? `rgba(64,62,66,${dim})`
          : `rgba(150,145,134,${dim})`;
      ctx.lineWidth = thick;
      ctx.stroke();
      ctx.setLineDash([]);

      // tháp canh ở mỗi điểm gãy — dấu hiệu người chơi tự bấm ra chỗ đó
      if (mat && scale > 0.08) {
        ctx.fillStyle = `rgba(178,172,158,${dim})`;
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x * scale, p.y * scale, thick * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 8. tuyến đang vạch dở — nét vàng bám theo con trỏ
    if (wallMode && wallPoints.length > 0) {
      const pts = hover ? [...wallPoints, { x: hover.x, y: hover.y }] : wallPoints;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * scale, pts[0].y * scale);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * scale, pts[i].y * scale);
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = "rgba(255,214,110,0.95)";
      ctx.lineWidth = Math.max(1.6, (4 + wallLevel * 2) * scale);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffd76a";
      for (const p of wallPoints) {
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, Math.max(3, 5 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. tên con đường trong lore, đặt dọc trục lộ phía ngoài cổng
    if (scale > 0.12) {
      for (const gate of town.gates) {
        if (!gate.name) continue;
        const lx = (gate.at[0] + Math.cos(gate.angle) * 150) * scale;
        const ly = (gate.at[1] + Math.sin(gate.angle) * 150) * scale;
        ctx.save();
        ctx.translate(lx, ly);
        let a = gate.angle;
        if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI; // giữ chữ không lộn ngược
        ctx.rotate(a);
        ctx.font = `${gate.main ? 14 : 12}px sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(8,10,14,0.85)";
        ctx.strokeText(gate.name, 0, -6);
        ctx.fillStyle = gate.main ? "#e8d9a8" : "rgba(220,210,186,0.85)";
        ctx.fillText(gate.name, 0, -6);
        ctx.restore();
      }
      ctx.textAlign = "left";
    }

    // 10. ĐIỂM TÀI NGUYÊN — bậc trữ lượng quyết định độ đậm và số vòng
    for (const n of nodes) {
      if (!n["Đã Khám Phá"]) continue;
      const nx = n["Tọa Độ X"] * scale;
      const ny = n["Tọa Độ Y"] * scale;
      if (nx < -tx - 40 || ny < -ty - 40 || nx > w - tx + 40 || ny > h - ty + 40) continue;
      const grade = n["Trữ Lượng"];
      const r = Math.max(2.5, (n["Kích Thước"] * scale) / 2);
      const color = NODE_COLOR[n["Tài Nguyên"]] ?? NODE_FALLBACK;

      ctx.globalAlpha = grade <= 0 ? 0.28 : 0.55 + grade * 0.15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = n["Công Trình"] ? "rgba(255,215,106,0.9)" : "rgba(0,0,0,0.55)";
      ctx.lineWidth = n["Công Trình"] ? 2 : 1;
      ctx.stroke();
      // vòng ngoài đếm bậc: giàu 3 vòng, khá 2, nghèo 1, cạn không vòng nào
      for (let g = 1; g <= grade; g++) {
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, r + g * Math.max(2, 3 * scale), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 11. công trình
    for (const [name, b] of Object.entries(buildings)) {
      const def = BUILDING_CATALOG[b["Loại"]];
      if (!def || def.ring) continue;
      const bs = def.footprint * scale;
      const bx = b["Tọa Độ X"] * scale;
      const by = b["Tọa Độ Y"] * scale;
      if (bx + bs < -tx || by + bs < -ty || bx > w - tx || by > h - ty) continue;

      if (b["Đang Xây"]) {
        const total = Math.max(1, buildingDays(b["Loại"], b["Cấp Độ"] || 1));
        const progress = Math.max(0, Math.min(1, 1 - b["Ngày Xây Còn Lại"] / total));
        drawSite(ctx, bx, by, bs, def.footprint, progress, b["Loại"], scale);
      } else {
        drawBuilding(ctx, bx, by, bs, b["Loại"], b["Tọa Độ X"] + b["Tọa Độ Y"]);
        // thiếu người thì công trình mờ đi và có gạch chéo — nhìn là biết ngay
        const ratio = ledgerByName[name]?.staffing ?? 1;
        if (ratio < 0.95) {
          ctx.save();
          ctx.globalAlpha = 0.25 + (1 - ratio) * 0.35;
          ctx.fillStyle = "#0b0d12";
          ctx.fillRect(bx, by, bs, bs);
          ctx.restore();
        }
      }

      if (selected === name) {
        ctx.strokeStyle = "#ffd76a";
        ctx.lineWidth = Math.max(1.5, 2.5);
        ctx.strokeRect(bx - 2, by - 2, bs + 4, bs + 4);
      }
      if (bs > 40) {
        ctx.fillStyle = "rgba(10,12,16,0.75)";
        ctx.font = `${Math.min(14, Math.max(9, bs * 0.14))}px sans-serif`;
        ctx.fillText(
          b["Tuỳ Chỉnh"]?.["Tên"] || name,
          bx + 3, by + Math.min(14, Math.max(9, bs * 0.14)) + 2,
        );
      }
    }

    // 12. khung đặt công trình
    if (placing && hover) {
      const ps = BUILDING_CATALOG[placing].footprint * scale;
      const ok = hoverCheck?.ok;
      ctx.fillStyle = ok ? "rgba(90,200,120,0.38)" : "rgba(220,90,90,0.38)";
      ctx.fillRect(hover.x * scale, hover.y * scale, ps, ps);
      ctx.strokeStyle = ok ? "rgba(90,220,130,0.95)" : "rgba(235,110,110,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(hover.x * scale, hover.y * scale, ps, ps);
    }

    ctx.restore();
  }, [
    size, view, terrain, backdrop, town, buildings, walls, nodes, selected, placing, hover,
    hoverCheck, radius, wallMode, wallPoints, wallLevel, ledgerByName,
  ]);

  // ── tương tác ──
  const toCell = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.floor((clientX - rect.left - view.tx) / view.scale),
      y: Math.floor((clientY - rect.top - view.ty) / view.scale),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setView((v) => {
        const next = Math.max(0.08, Math.min(6, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
        const k = next / v.scale;
        return { scale: next, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
      });
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  /** Bắt/nhả con trỏ có thể ném lỗi với id lạ — đừng để nó chặn thao tác đặt. */
  const capture = (id: number, on: boolean) => {
    try {
      if (on) canvasRef.current?.setPointerCapture(id);
      else canvasRef.current?.releasePointerCapture(id);
    } catch { /* con trỏ không bắt được thì thôi, kéo/thả vẫn chạy */ }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    capture(e.pointerId, true);
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      if (d.moved) setView((v) => ({ ...v, tx: d.tx + dx, ty: d.ty + dy }));
      return;
    }
    if (!placing && !wallMode) return;
    const cell = toCell(e.clientX, e.clientY);
    if (cell) setHover(cell);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    capture(e.pointerId, false);
    const d = drag.current;
    drag.current = null;
    if (d?.moved) return;

    const cell = toCell(e.clientX, e.clientY);
    if (!cell) return;

    // VẠCH TƯỜNG: mỗi lần bấm là thêm một điểm gãy vào tuyến
    if (wallMode) {
      setWallPoints((p) => [...p, { x: cell.x, y: cell.y }]);
      return;
    }

    if (placing) {
      const r = placeBuild(holdingId, placing, cell.x, cell.y, custom ? { name: custom["Tên"], custom } : undefined);
      if (r.ok) {
        setPlacing(null);
        setCustom(null);
        setHover(null);
        setNotice(null);
      } else {
        setNotice(r.error ?? "Không đặt được ở đây");
      }
      return;
    }
    const found = buildingAt(holding, cell.x, cell.y);
    setSelected(found ? found[0] : null);
  };

  const resetTools = () => {
    setPlacing(null);
    setCustom(null);
    setWallMode(false);
    setWallPoints([]);
    setHover(null);
  };

  const commitWall = () => {
    const r = drawWall(holdingId, wallPoints, { level: wallLevel, material: wallMaterial });
    if (r.ok) {
      setNotice(`Đã khởi công tuyến tường dài ${wallPlan?.meters ?? 0} m.`);
      setWallPoints([]);
      setWallMode(false);
      setHover(null);
    } else {
      setNotice(r.error ?? "Không dựng được tuyến này");
    }
  };

  if (!holding) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] italic text-[var(--text-muted)]">
        Lãnh địa không tồn tại.
      </div>
    );
  }

  const selBuilding = selected ? buildings[selected] : null;
  const selLedger = selected ? ledgerByName[selected] : null;
  const hoverTerrain = hover ? terrainAtCell(terrain, hover.x, hover.y) : null;
  const presentTerrains = Object.entries(TERRAIN_TRAITS).filter(([t]) => terrain.grid.includes(t as never));
  const totalWallDefense = wallDefense(holding);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* thanh tiêu đề */}
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--glass-border)] bg-[rgba(10,13,18,0.6)] px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="font-display truncate text-[15px] tracking-wide text-[var(--text-soft)]">
            {holding["Mô Tả"] || holdingId}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[var(--text-faint)]">
            {region ? `${region.name} · ` : ""}1 ô = {LOCAL_CELL_M} m · quy hoạch bán kính{" "}
            {((radius * LOCAL_CELL_M) / 1000).toFixed(2)} km (Lâu Đài cấp {level})
            {population ? ` · dân ${population.population.toLocaleString("vi-VN")}/${population.housingCapacity.toLocaleString("vi-VN")} chỗ ở` : ""}
          </p>
          {lore && (
            <p className="mt-0.5 truncate text-[11px] italic text-[var(--accent-text)]" title={lore.note}>
              Địa thế theo nguyên tác — {lore.note}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          {isOwner ? (
            <>
              <button
                onClick={() => { resetTools(); setMenuOpen((v) => !v); setWallPanel(false); setNotice(null); }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${menuOpen ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
              >
                Xây công trình
              </button>
              <button
                onClick={() => {
                  resetTools();
                  setMenuOpen(false);
                  setWallPanel(true);
                  setWallMode(true);
                  setNotice("Bấm từng điểm trên bản đồ để vạch tuyến tường, xong thì bấm Đồng Ý.");
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${wallMode ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
              >
                Tường thành
              </button>
            </>
          ) : (
            <span className="flex items-center gap-1.5 rounded-md border border-[rgba(176,106,95,0.4)] bg-[rgba(176,106,95,0.1)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-muted)]">
              <IconAlert size={13} color="var(--danger)" /> Chỉ xem — đất của người khác
            </span>
          )}
          {onExit && (
            <button onClick={onExit} title="Về bản đồ lãnh thổ" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={size.w}
          height={size.h}
          className={`h-full w-full touch-none ${placing || wallMode ? "cursor-crosshair" : "cursor-grab"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { drag.current = null; if (!wallMode) setHover(null); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* chú giải địa hình */}
        <div className="glass-strong absolute bottom-3 left-3 flex max-w-[52%] flex-wrap gap-x-3 gap-y-1 p-2.5">
          {presentTerrains.map(([t, trait]) => (
            <div key={t} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: trait.fill }} />
              {trait.label}
              {!trait.buildable && <span className="text-[var(--text-faint)]">(cần công trình đặc biệt)</span>}
            </div>
          ))}
        </div>

        {/* thước tỉ lệ */}
        <div className="glass absolute bottom-3 right-3 px-2.5 py-1.5 text-[11px] text-[var(--text-muted)]">
          <div className="mb-1 h-[3px] rounded-sm bg-[var(--text-faint)]" style={{ width: 80 }} />
          {Math.round((80 / view.scale) * LOCAL_CELL_M)} m
        </div>

        {/* ── BẢNG VẠCH TƯỜNG ── */}
        {wallPanel && isOwner && (
          <div className="glass-strong anim-in absolute right-3 top-3 w-[300px] rounded-[var(--radius-md)] p-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[12.5px] tracking-wide text-[var(--accent-text)]">VẠCH TƯỜNG THÀNH</span>
              <button
                onClick={() => { setWallPanel(false); setWallMode(false); setWallPoints([]); }}
                className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"
              >
                <IconX size={14} />
              </button>
            </div>

            <p className="mb-2 text-[11px] italic text-[var(--text-faint)]">
              Bấm điểm đầu, rồi điểm tiếp theo, rồi tiếp nữa. Tuyến khép kín (điểm cuối
              gần điểm đầu) cho phòng thủ đầy đủ.
            </p>

            <div className="mb-2">
              <div className="mb-1 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Vật liệu</div>
              <div className="grid grid-cols-2 gap-1">
                {WALL_MATERIALS_DEF.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => { setWallMaterial(mat.id); setWallLevel((l) => Math.min(l, mat.maxLevel)); }}
                    title={mat.desc}
                    className={`rounded px-2 py-1 text-left text-[11px] ${
                      wallMaterial === mat.id
                        ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                        : "bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
                    }`}
                  >
                    {mat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-faint)]">Cấp</span>
              <input
                type="range" min={1} max={WALL_MATERIAL_MAX(wallMaterial)} value={wallLevel}
                onChange={(e) => setWallLevel(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-6 text-right font-mono text-[var(--accent-text)]">{wallLevel}</span>
            </div>

            <div className="mb-2 rounded bg-[rgba(0,0,0,0.28)] p-2">
              <Row label="Số điểm đã bấm" value={String(wallPoints.length)} />
              {wallPlan?.ok ? (
                <>
                  <Row label="Chiều dài" value={`${wallPlan.meters.toLocaleString("vi-VN")} m`} />
                  <Row label="Khép kín" value={wallPlan.closed ? "Có" : "Chưa"} />
                  <Row label="Thời gian" value={`${wallPlan.days} ngày`} />
                  <Row label="Phòng thủ" value={`+${wallPlan.defense}`} />
                  <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                    {Object.entries(wallPlan.cost).map(([k, v]) => {
                      const have = k === "Ngân Khố"
                        ? stat["Thông Tin Nhân Vật"]["Ngân Khố"]
                        : (stock[k] ?? 0);
                      const short = (v ?? 0) > have;
                      return (
                        <span key={k} className={short ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}>
                          {k === "Ngân Khố" ? formatCurrencyShort(v ?? 0) : `${k} ${v}`}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                    {LABOUR_LIST.filter((k) => (wallPlan.labour[k] ?? 0) > 0).map((k) => (
                      <span key={k} className={(wallPlan.labour[k] ?? 0) > freeLabour[k] ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}>
                        {k} {wallPlan.labour[k]}<span className="text-[var(--text-faint)]">/{freeLabour[k]}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] italic text-[var(--text-faint)]">
                  {wallPlan?.error ?? "Chưa đủ điểm để tính chi phí."}
                </p>
              )}
            </div>

            <div className="flex gap-1.5">
              <button
                disabled={!wallPlan?.ok}
                onClick={commitWall}
                className="flex-1 rounded bg-[var(--accent-soft)] px-2 py-1.5 text-[12px] text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
              >
                Đồng ý
              </button>
              <button
                disabled={wallPoints.length === 0}
                onClick={() => setWallPoints((p) => p.slice(0, -1))}
                className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-1.5 text-[12px] text-[var(--text-soft)] disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
              >
                Lùi 1 điểm
              </button>
              <button
                onClick={() => setWallPoints([])}
                className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-1.5 text-[12px] text-[var(--text-soft)] hover:bg-[var(--glass-bg-hover)]"
              >
                Xoá
              </button>
            </div>

            {walls.length > 0 && (
              <div className="mt-3 border-t border-[var(--glass-border)] pt-2">
                <div className="mb-1 flex items-center justify-between text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">
                  <span>Tuyến đã có</span>
                  <span className="text-[var(--accent-text)]">Phòng thủ +{totalWallDefense}</span>
                </div>
                {walls.map((w) => (
                  <div key={w["Mã"]} className="mb-1 flex items-center gap-1.5 text-[11px]">
                    <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">
                      {w["Tên"]} · c{w["Cấp"]} · {Math.round(w["Chiều Dài"] * LOCAL_CELL_M)} m
                      {w["Đang Xây"] ? ` · xây còn ${w["Ngày Xây Còn Lại"]}n` : ""}
                    </span>
                    <button
                      onClick={() => { const r = raiseWall(holdingId, w["Mã"]); if (!r.ok) setNotice(r.error ?? null); }}
                      className="rounded px-1.5 py-0.5 text-[10.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Nâng
                    </button>
                    <button
                      onClick={() => razeWall(holdingId, w["Mã"])}
                      className="rounded px-1.5 py-0.5 text-[10.5px] text-[var(--danger)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Phá
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BẢNG CHỌN CÔNG TRÌNH ── */}
        {menuOpen && isOwner && !customOpen && (
          <div className="glass-strong anim-in absolute right-3 top-3 flex max-h-[80%] w-[300px] flex-col overflow-hidden rounded-[var(--radius-md)]">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-3 py-2">
              <span className="font-display text-[12.5px] tracking-wide text-[var(--accent-text)]">CHỌN CÔNG TRÌNH</span>
              <button onClick={() => setMenuOpen(false)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"><IconX size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
              {BUILDING_CATEGORIES.map((cat) => {
                const defs = BUILDABLE_LIST.filter((d) => d.category === cat);
                if (defs.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="mb-1 px-1 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">{cat}</div>
                    <div className="space-y-1.5">
                      {defs.map((def) => {
                        const cost = def.cost;
                        const shortRes = Object.keys(cost).filter((k) =>
                          k === "Ngân Khố"
                            ? (cost["Ngân Khố"] ?? 0) > stat["Thông Tin Nhân Vật"]["Ngân Khố"]
                            : (cost[k] ?? 0) > (stock[k] ?? 0));
                        const need = buildingLabour(def.type, 1);
                        const shortLab = LABOUR_LIST.filter((k) => (need[k] ?? 0) > freeLabour[k]);
                        const coastBlocked = def.requiresCoastal && !holding["Ven Biển"];
                        const nodeAvailable = !def.requiresNode
                          || nodes.some((n) => def.requiresNode!.includes(n["Tài Nguyên"]) && n["Trữ Lượng"] > 0);
                        const usable = shortRes.length === 0 && shortLab.length === 0 && !coastBlocked && nodeAvailable;
                        return (
                          <button
                            key={def.type}
                            disabled={!usable}
                            onClick={() => {
                              setNotice(null);
                              if (def.custom) { setCustomOpen(true); return; }
                              setMenuOpen(false);
                              setPlacing(def.type);
                              setCustom(null);
                            }}
                            className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors ${
                              usable
                                ? "border-[var(--glass-border)] bg-[rgba(0,0,0,0.25)] hover:border-[var(--accent-text)]"
                                : "cursor-not-allowed border-[rgba(176,106,95,0.3)] bg-[rgba(176,106,95,0.06)] opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[13px] text-[var(--text-soft)]">{def.type}</span>
                              <span className="shrink-0 text-[11px] text-[var(--accent-text)]">{def.buildMonths} tháng</span>
                            </div>
                            <div className="mt-0.5 text-[11px] italic text-[var(--text-faint)]">{def.effectSummary}</div>

                            {/* chỗ làm việc & chỗ ở — thứ quyết định dân có việc hay thất nghiệp */}
                            {(def.jobs || def.housing) && (
                              <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-[var(--ok)]">
                                {Object.entries(def.jobs ?? {}).map(([j, n]) => (
                                  <span key={j}>+{n} chỗ {j}</span>
                                ))}
                                {def.housing ? <span>+{def.housing} chỗ ở</span> : null}
                              </div>
                            )}

                            {/* vật tư */}
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                              {Object.keys(cost).filter((k) => (cost[k] ?? 0) > 0).map((k) => (
                                <span key={k} className={shortRes.includes(k) ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}>
                                  {k === "Ngân Khố" ? formatCurrencyShort(cost[k] ?? 0) : `${k} ${cost[k]}`}
                                </span>
                              ))}
                            </div>

                            {/* nhân lực công trường — thứ hay thiếu hơn cả tiền */}
                            {Object.keys(need).length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px]">
                                {LABOUR_LIST.filter((k) => (need[k] ?? 0) > 0).map((k) => (
                                  <span key={k} className={shortLab.includes(k) ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}>
                                    {k} {need[k]}
                                    <span className="text-[var(--text-faint)]">/{freeLabour[k]}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-1 text-[10.5px] text-[var(--text-faint)]">
                              {`${def.footprint * LOCAL_CELL_M} × ${def.footprint * LOCAL_CELL_M} m`}
                              {def.overrideTerrain ? ` · DỰNG ĐƯỢC trên ${def.overrideTerrain.join(" / ")}` : ""}
                              {def.terrain && !def.overrideTerrain ? ` · cần ${def.terrain.join(" / ")}` : ""}
                              {def.requiresNode ? ` · phải đè lên mạch ${def.requiresNode.join(" / ")}` : ""}
                              {def.nearWater ? " · sát mép nước" : ""}
                              {coastBlocked ? " · lãnh địa không giáp biển" : ""}
                              {!nodeAvailable ? " · lãnh địa chưa tìm ra mạch nào" : ""}
                              {shortRes.length > 0 ? ` · thiếu ${shortRes.join(", ")}` : ""}
                              {shortLab.length > 0 ? ` · thiếu ${shortLab.join(", ")}` : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SOẠN CÔNG TRÌNH TUỲ CHỈNH ── */}
        {customOpen && isOwner && (
          <CustomBuildingEditor
            onCancel={() => setCustomOpen(false)}
            onConfirm={(spec) => {
              setCustomOpen(false);
              setMenuOpen(false);
              setCustom(spec);
              setPlacing("Công Trình Tuỳ Chỉnh");
              setNotice(`Chọn ô đặt "${spec["Tên"]}".`);
            }}
          />
        )}

        {placing && (
          <div className="glass-strong absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[12.5px]">
            <span className="text-[var(--accent-text)]">Chọn ô đặt {custom?.["Tên"] || placing}</span>
            {hoverTerrain && (
              <span className={hoverCheck?.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                {hoverCheck?.ok
                  ? `Đặt được — ${TERRAIN_TRAITS[hoverTerrain].label}${hoverCheck.node ? ` · mạch ${hoverCheck.node["Tài Nguyên"]} (${NODE_GRADE_LABEL[hoverCheck.node["Trữ Lượng"]]})` : ""}`
                  : hoverCheck?.error}
              </span>
            )}
            <button onClick={() => { setPlacing(null); setCustom(null); setHover(null); }} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]">
              Huỷ
            </button>
          </div>
        )}

        {notice && !placing && (
          <div className="glass-strong absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[12.5px] text-[var(--text-soft)]">
            {notice}
            <button onClick={() => setNotice(null)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"><IconX size={13} /></button>
          </div>
        )}

        {/* ── SỔ CỦA MỘT CÔNG TRÌNH: tên · sản xuất · nhân lực · sản lượng ── */}
        {selBuilding && !placing && !wallMode && (
          <div className="glass-strong anim-in absolute left-3 top-3 w-[268px] rounded-[var(--radius-md)] p-3.5 text-[12.5px]">
            <div className="mb-2 flex items-start justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[14px] text-[var(--accent-text)]">
                {selBuilding["Tuỳ Chỉnh"]?.["Tên"] || selected}
              </span>
              <button onClick={() => setSelected(null)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"><IconX size={14} /></button>
            </div>

            <Row label="Loại" value={selBuilding["Loại"]} />
            <Row label="Cấp Độ" value={String(selBuilding["Cấp Độ"])} />

            {selBuilding["Đang Xây"] ? (
              <Row label="Tình trạng" value={`Đang xây — còn ${formatDuration(selBuilding["Ngày Xây Còn Lại"])}`} />
            ) : selLedger ? (
              <>
                {/* SẢN XUẤT: cái gì */}
                <Row
                  label="Sản xuất"
                  value={
                    Object.keys(selLedger.produce).length > 0
                      ? Object.keys(selLedger.produce).join(", ")
                      : "—"
                  }
                />
                {/* NHÂN LỰC: hiện có / tối đa */}
                <Row
                  label="Nhân lực"
                  value={selLedger.needTotal > 0
                    ? `${selLedger.haveTotal}/${selLedger.needTotal} (${Math.round(selLedger.staffing * 100)}%)`
                    : "không cần"}
                />
                {selLedger.needTotal > 0 && (
                  <div className="mt-1 mb-1 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(selLedger.staffing * 100)}%`,
                        backgroundColor: selLedger.staffing > 0.85 ? "var(--ok)" : selLedger.staffing > 0.5 ? "var(--warning)" : "var(--danger)",
                      }}
                    />
                  </div>
                )}
                {Object.entries(selLedger.needByJob).map(([job, want]) => (
                  <div key={job} className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                    <span>{job}</span>
                    <span className="font-mono">{selLedger.haveByJob[job as keyof typeof selLedger.haveByJob] ?? 0}/{want}</span>
                  </div>
                ))}

                {/* SẢN LƯỢNG: bao nhiêu mỗi tháng */}
                <div className="mt-2 border-t border-[var(--glass-border)] pt-1.5">
                  <div className="mb-0.5 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Sản lượng / tháng</div>
                  {Object.keys(selLedger.produce).length === 0 ? (
                    <p className="text-[11px] italic text-[var(--danger)]">
                      {!selLedger.fed ? "Đứng máy — thiếu nguyên liệu đầu vào" : selLedger.staffing <= 0 ? "Đứng máy — không có người làm" : "Không sản xuất"}
                    </p>
                  ) : (
                    Object.entries(selLedger.produce).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11.5px]">
                        <span className="text-[var(--text-muted)]">{k}</span>
                        <span className="font-mono text-[var(--ok)]">
                          +{k === "Ngân Khố" ? formatCurrencyShort(v) : v}
                        </span>
                      </div>
                    ))
                  )}
                  {Object.entries(selLedger.consume).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11.5px]">
                      <span className="text-[var(--text-muted)]">{k}</span>
                      <span className="font-mono text-[var(--danger)]">−{v}</span>
                    </div>
                  ))}
                </div>

                {selLedger.node && (
                  <div className="mt-2 rounded bg-[rgba(0,0,0,0.28)] p-2 text-[11px]">
                    <div className="text-[var(--accent-text)]">
                      Mạch {selLedger.node["Tài Nguyên"]} — {NODE_GRADE_LABEL[selLedger.node["Trữ Lượng"]]}
                    </div>
                    <div className="text-[var(--text-faint)]">
                      Còn {selLedger.node["Còn Lại"].toLocaleString("vi-VN")} đơn vị ở bậc này
                      {" · "}hệ số sản lượng ×{selLedger.nodeMult.toFixed(2)}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            <p className="mt-2 text-[11.5px] italic text-[var(--text-faint)]">
              {selBuilding["Tuỳ Chỉnh"]?.["Công Năng"] || BUILDING_CATALOG[selBuilding["Loại"]]?.effectSummary}
            </p>
          </div>
        )}

        {/* ── TÓM TẮT DÂN CƯ ── */}
        {population && !selBuilding && !menuOpen && !wallPanel && !customOpen && (
          <div className="glass-strong absolute left-3 top-3 w-[240px] rounded-[var(--radius-md)] p-3 text-[12px]">
            <div className="mb-1.5 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Dân cư</div>
            <Row label="Dân số" value={population.population.toLocaleString("vi-VN")} />
            <Row label="Sức chứa chỗ ở" value={population.housingCapacity.toLocaleString("vi-VN")} />
            <Row
              label="Vô gia cư"
              value={population.homeless > 0 ? population.homeless.toLocaleString("vi-VN") : "0"}
            />
            <Row label="Lực lượng lao động" value={population.workforce.toLocaleString("vi-VN")} />
            <Row
              label="Thất nghiệp"
              value={`${population.unemployed.toLocaleString("vi-VN")} (${Math.round(population.unemploymentRate * 100)}%)`}
            />
            {population.unemployed > 0 && (
              <p className="mt-1.5 text-[11px] italic text-[var(--text-faint)]">
                Dân thừa mà chỗ làm đã kín — xây thêm công trình sản xuất để họ có việc.
              </p>
            )}
            {population.homeless > 0 && (
              <p className="mt-1 text-[11px] italic text-[var(--danger)]">
                Thiếu chỗ ở: dựng thêm Nhà Ở hoặc Khu Phố Thợ trước khi dân bỏ đi.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Cấp tối đa mà một vật liệu tường chịu được. */
function WALL_MATERIAL_MAX(material: WallMaterial): number {
  return WALL_MATERIALS_DEF.find((m) => m.id === material)?.maxLevel ?? 4;
}

// ── Soạn công trình tuỳ chỉnh ───────────────────────────────────────────────

const CUSTOM_OUTPUTS = [
  "Lương Thực", "Gỗ", "Đá", "Quặng Sắt", "Than Đá", "Thép", "Vải Vóc", "Ngựa", "Muối",
  "Bia", "Rượu Vang", "Gốm Sứ", "Thảo Dược", "Giấy Da", "Vũ Khí", "Ngân Khố",
];
const CUSTOM_JOBS = [
  "Nông Dân", "Thợ Thủ Công", "Thợ Mỏ", "Tiều Phu", "Thương Nhân", "Thợ Rèn", "Nghề Khác",
];

/**
 * Bảng soạn CÔNG TRÌNH TUỲ CHỈNH: người chơi tự đặt tên, tự mô tả công năng, tự
 * chọn sản xuất cái gì, giữ bao nhiêu người và chứa bao nhiêu dân. Chi phí xây
 * tính thẳng từ những lựa chọn đó, nên không có cách nào chọn "mạnh mà rẻ".
 */
function CustomBuildingEditor({
  onCancel, onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (spec: CustomBuilding) => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [output, setOutput] = useState<string>("Lương Thực");
  const [outputQty, setOutputQty] = useState(60);
  const [job, setJob] = useState<string>("Nghề Khác");
  const [jobQty, setJobQty] = useState(30);
  const [housing, setHousing] = useState(0);
  const [defense, setDefense] = useState(0);

  const valid = name.trim().length >= 2;

  return (
    <div className="glass-strong anim-in absolute right-3 top-3 flex max-h-[86%] w-[310px] flex-col overflow-hidden rounded-[var(--radius-md)] text-[12px]">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-3 py-2">
        <span className="font-display text-[12.5px] tracking-wide text-[var(--accent-text)]">CÔNG TRÌNH TUỲ CHỈNH</span>
        <button onClick={onCancel} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"><IconX size={14} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        <label className="block">
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Tên công trình</span>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Vườn Thuốc Học Sĩ Luwin"
            className="mt-1 w-full rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-[12.5px] text-[var(--text-soft)] outline-none focus:border-[var(--accent-text)]"
          />
        </label>

        <label className="block">
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Công năng (mô tả)</span>
          <textarea
            value={purpose} onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            placeholder="Vườn thuốc và phòng bào chế của học sĩ, cung cấp thảo dược cho cả lãnh địa."
            className="mt-1 w-full resize-none rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-[12px] text-[var(--text-soft)] outline-none focus:border-[var(--accent-text)]"
          />
        </label>

        <div>
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Sản xuất mỗi tháng</span>
          <div className="mt-1 flex gap-1.5">
            <select
              value={output} onChange={(e) => setOutput(e.target.value)}
              className="min-w-0 flex-1 rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-[12px] text-[var(--text-soft)]"
            >
              {CUSTOM_OUTPUTS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input
              type="number" min={0} max={400} value={outputQty}
              onChange={(e) => setOutputQty(Math.max(0, Math.min(400, Number(e.target.value))))}
              className="w-20 rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-right font-mono text-[12px] text-[var(--text-soft)]"
            />
          </div>
        </div>

        <div>
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Chỗ làm việc</span>
          <div className="mt-1 flex gap-1.5">
            <select
              value={job} onChange={(e) => setJob(e.target.value)}
              className="min-w-0 flex-1 rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-[12px] text-[var(--text-soft)]"
            >
              {CUSTOM_JOBS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <input
              type="number" min={0} max={300} value={jobQty}
              onChange={(e) => setJobQty(Math.max(0, Math.min(300, Number(e.target.value))))}
              className="w-20 rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-right font-mono text-[12px] text-[var(--text-soft)]"
            />
          </div>
        </div>

        <label className="block">
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Sức chứa dân cư</span>
          <input
            type="number" min={0} max={600} value={housing}
            onChange={(e) => setHousing(Math.max(0, Math.min(600, Number(e.target.value))))}
            className="mt-1 w-full rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-right font-mono text-[12px] text-[var(--text-soft)]"
          />
        </label>

        <label className="block">
          <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Phòng thủ</span>
          <input
            type="number" min={0} max={25} value={defense}
            onChange={(e) => setDefense(Math.max(0, Math.min(25, Number(e.target.value))))}
            className="mt-1 w-full rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] px-2 py-1.5 text-right font-mono text-[12px] text-[var(--text-soft)]"
          />
        </label>

        <p className="text-[11px] italic text-[var(--text-faint)]">
          Chọn càng nhiều thì xây càng đắt — chi phí tính thẳng từ sản lượng, số chỗ
          làm, sức chứa và phòng thủ ngươi vừa đặt.
        </p>
      </div>

      <div className="flex gap-1.5 border-t border-[var(--glass-border)] p-2">
        <button
          disabled={!valid}
          onClick={() => onConfirm({
            "Tên": name.trim(),
            "Công Năng": purpose.trim() || `Công trình do ${name.trim()} đảm trách.`,
            "Nhóm": "Đặc Biệt",
            "Sản Xuất": outputQty > 0
              ? { [output]: output === "Ngân Khố" ? outputQty * 11760 : outputQty }
              : {},
            "Tiêu Thụ": {},
            "Nhân Lực": jobQty > 0 ? { [job]: jobQty } : {},
            "Sức Chứa Dân": housing,
            "Phòng Thủ": defense,
            "Lòng Dân/Tháng": 0,
          })}
          className="flex-1 rounded bg-[var(--accent-soft)] px-2 py-1.5 text-[12px] text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
        >
          Chọn chỗ đặt
        </button>
        <button onClick={onCancel} className="rounded bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-[12px] text-[var(--text-soft)] hover:bg-[var(--glass-bg-hover)]">
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ── vẽ phụ trợ ──────────────────────────────────────────────────────────────

function drawPath(ctx: CanvasRenderingContext2D, paths: [number, number][][], scale: number, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of paths) {
    if (path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(path[0][0] * scale, path[0][1] * scale);
    for (let i = 1; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      ctx.quadraticCurveTo(a[0] * scale, a[1] * scale, ((a[0] + b[0]) / 2) * scale, ((a[1] + b[1]) / 2) * scale);
    }
    const last = path[path.length - 1];
    ctx.lineTo(last[0] * scale, last[1] * scale);
    ctx.stroke();
  }
}

/** Công trình đã xong — phác dáng theo công năng, không phải ô vuông tô màu. */
function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, type: BuildingType, salt: number): void {
  const skin = BUILDING_SKIN[type] ?? { wall: "#8d8778", roof: "#5c5f6b" };
  ctx.save();
  // bóng đổ nhẹ cho khối nổi lên khỏi mặt đất
  ctx.fillStyle = "rgba(8,10,14,0.35)";
  ctx.fillRect(x + s * 0.04, y + s * 0.06, s, s);

  if (type === "Nông Trại") {
    // ruộng: luống cày chạy chéo, bờ đất bao quanh
    ctx.fillStyle = "#6d6a3c";
    ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = "rgba(60,52,30,0.55)";
    ctx.lineWidth = Math.max(0.5, s * 0.012);
    const rows = 9;
    for (let i = 1; i < rows; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + (s * i) / rows);
      ctx.lineTo(x + s, y + (s * i) / rows - s * 0.06);
      ctx.stroke();
    }
    ctx.strokeStyle = skin.roof;
    ctx.lineWidth = Math.max(0.8, s * 0.03);
    ctx.strokeRect(x, y, s, s);
    ctx.restore();
    return;
  }

  if (type === "Lâu Đài") {
    // pháo đài: sân trong + tháp bốn góc + tháp canh chính
    ctx.fillStyle = skin.wall;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = "rgba(30,32,38,0.35)";
    ctx.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6);
    ctx.fillStyle = skin.roof;
    const t = s * 0.2;
    for (const [ox, oy] of [[0, 0], [s - t, 0], [0, s - t], [s - t, s - t]]) ctx.fillRect(x + ox, y + oy, t, t);
    ctx.fillRect(x + s * 0.38, y + s * 0.34, s * 0.24, s * 0.32);
    ctx.strokeStyle = "rgba(20,20,24,0.7)";
    ctx.lineWidth = Math.max(0.8, s * 0.02);
    ctx.strokeRect(x, y, s, s);
    ctx.restore();
    return;
  }

  // còn lại: cụm nhà nhỏ lệch nhau trong khuôn viên
  ctx.fillStyle = skin.wall;
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = skin.roof;
  const n = type === "Chợ" ? 4 : type === "Doanh Trại" ? 3 : 2;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const jitter = ((salt + i * 7 + j * 13) % 5) / 20;
      const cw = (s / n) * (0.58 + jitter);
      const ch = (s / n) * (0.5 + jitter);
      ctx.fillRect(x + (s / n) * i + (s / n) * 0.15, y + (s / n) * j + (s / n) * 0.18, cw, ch);
    }
  }
  ctx.strokeStyle = "rgba(20,20,24,0.6)";
  ctx.lineWidth = Math.max(0.7, s * 0.02);
  ctx.strokeRect(x, y, s, s);
  ctx.restore();
}

/**
 * CÔNG TRƯỜNG — nhìn là biết ngay khác hẳn nhà đã xong: nền đất bị đào xới,
 * cọc đánh dấu ở góc, giàn giáo quanh phần đã dựng, vật liệu chất đống và xe
 * kéo nằm gần đó. Càng gần hoàn thành thì càng bớt ngổn ngang; vừa khởi công
 * thì gần như chỉ có nền đất trống với mấy cái cọc.
 */
function drawSite(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, s: number,
  footprint: number, progress: number, type: BuildingType, scale: number,
): void {
  ctx.save();

  // 1. nền đất đào xới — mảng nâu rìa lởm chởm, không phải ô vuông
  ctx.fillStyle = "#5a4a35";
  ctx.beginPath();
  const pad = s * 0.06;
  const seg = 14;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const wobble = 1 + (((Math.sin(a * 3 + footprint) + Math.cos(a * 5)) * 0.5) * 0.07);
    const px = x + s / 2 + Math.cos(a) * (s / 2 + pad) * wobble;
    const py = y + s / 2 + Math.sin(a) * (s / 2 + pad) * wobble;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // vệt bánh xe / rãnh đào
  ctx.strokeStyle = "rgba(40,32,22,0.5)";
  ctx.lineWidth = Math.max(0.5, s * 0.015);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + s * (0.1 + i * 0.3), y + s * 0.95);
    ctx.quadraticCurveTo(x + s * (0.3 + i * 0.2), y + s * 0.5, x + s * (0.15 + i * 0.3), y + s * 0.05);
    ctx.stroke();
  }

  // 2. phần đã dựng — dâng từ dưới lên theo tiến độ
  if (progress > 0.05) {
    const skin = BUILDING_SKIN[type] ?? { wall: "#8d8778", roof: "#5c5f6b" };
    const hh = s * 0.82 * progress;
    ctx.fillStyle = skin.wall;
    ctx.globalAlpha = 0.55 + progress * 0.4;
    ctx.fillRect(x + s * 0.09, y + s * 0.9 - hh, s * 0.82, hh);
    ctx.globalAlpha = 1;
  }

  // 3. giàn giáo — dày nhất lúc đang dựng dở, thưa dần khi sắp xong
  const scaff = Math.max(0, 1 - Math.abs(progress - 0.45) * 1.6);
  if (scaff > 0.05 && s > 10) {
    ctx.strokeStyle = `rgba(190,166,120,${0.35 + scaff * 0.45})`;
    ctx.lineWidth = Math.max(0.5, s * 0.016);
    const bays = 4;
    for (let i = 0; i <= bays; i++) {
      const gx = x + s * 0.06 + (s * 0.88 * i) / bays;
      ctx.beginPath();
      ctx.moveTo(gx, y + s * 0.9);
      ctx.lineTo(gx, y + s * 0.9 - s * 0.75 * Math.max(progress, 0.25));
      ctx.stroke();
    }
    for (let i = 1; i <= 2; i++) {
      const gy = y + s * 0.9 - (s * 0.7 * i) / 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.06, gy);
      ctx.lineTo(x + s * 0.94, gy);
      ctx.stroke();
    }
  }

  // 4. cọc đánh dấu bốn góc — luôn có, kể cả khi mới động thổ
  ctx.fillStyle = "#c9b489";
  const st = Math.max(1, s * 0.035);
  for (const [ox, oy] of [[0, 0], [s - st, 0], [0, s - st], [s - st, s - st]]) {
    ctx.fillRect(x + ox, y + oy, st, st * 2.2);
  }

  // 5. vật liệu chất đống — nhiều lúc đầu, vơi dần về cuối
  const piles = Math.max(0, Math.ceil(3 * (1 - progress)));
  for (let i = 0; i < piles; i++) {
    const px = x + s * (0.12 + i * 0.16);
    const py = y + s * 0.14;
    const r = Math.max(1.2, s * 0.06);
    ctx.fillStyle = i % 2 === 0 ? "#7d6a4a" : "#6f6a63"; // gỗ / đá
    ctx.beginPath();
    ctx.moveTo(px - r, py + r);
    ctx.lineTo(px, py - r);
    ctx.lineTo(px + r, py + r);
    ctx.closePath();
    ctx.fill();
  }

  // 6. xe kéo vật liệu — chỉ khi công trường còn mới
  if (progress < 0.4 && s * scale > 0 && s > 14) {
    const cx = x + s * 0.74;
    const cy = y + s * 0.78;
    const cw = s * 0.2;
    const ch = s * 0.1;
    ctx.fillStyle = "#6b5233";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = "#3a2f22";
    const wr = Math.max(0.8, s * 0.028);
    ctx.beginPath(); ctx.arc(cx + cw * 0.2, cy + ch, wr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + cw * 0.8, cy + ch, wr, 0, Math.PI * 2); ctx.fill();
  }

  // 7. viền công trường — nét đứt, phân biệt hẳn với công trình đã xong
  ctx.strokeStyle = "rgba(214,190,130,0.75)";
  ctx.setLineDash([Math.max(2, s * 0.06), Math.max(2, s * 0.05)]);
  ctx.lineWidth = Math.max(0.8, s * 0.022);
  ctx.strokeRect(x, y, s, s);
  ctx.setLineDash([]);
  ctx.restore();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--glass-border)] py-1">
      <span className="text-[var(--text-faint)]">{label}</span>
      <span className="text-[var(--text-soft)]">{value}</span>
    </div>
  );
}
