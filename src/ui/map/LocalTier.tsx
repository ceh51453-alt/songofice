/**
 * LocalTier — TẦNG 1 (Bản Đồ Thành Trì), lưới 5 × 5 m.
 *
 * Đây là tầng dữ liệu GỐC: đặt công trình ở đây thì khu dân cư ở Tầng 2 và cán
 * cân quyền lực ở Tầng 3 đổi theo (mapAggregate.ts).
 *
 * Bốn công cụ trên cùng một mặt bản đồ:
 *   XEM     — bấm vào công trình để đọc sổ nhân lực và sản lượng thật của nó.
 *   ĐẶT     — chọn loại công trình rồi bấm ô. Mỏ chỉ đặt được trên mạch tài nguyên.
 *   TƯỜNG   — bấm điểm, bấm điểm nữa, bấm tiếp… xong thì Đồng Ý. Chi phí và thời
 *             gian hiện ngay theo cấp và độ dài đã vạch. Tường là dữ liệu riêng
 *             nên nâng cấp Lâu Đài KHÔNG còn xoá mất bức tường cũ.
 *   ĐƯỜNG    — quan lộ/ngõ nhỏ có sẵn; người chơi có thể xoá hoặc tự vạch thêm.
 *
 * Điểm tài nguyên lấy thẳng từ state để AI và bản đồ luôn nói cùng một chuyện.
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
import { availableLabour, buildingLedgers, demolitionDays, planningRadiusCells, type BuildingLedger } from "../../territory/construction";
import { analysePopulation, buildingDefense } from "../../territory/population";
import {
  NODE_GRADE_LABEL, NODE_GRADE_MULT, nodeAreaKm2, nodeCapacity, nodeWorkers,
  nodeContainsResource, nodeResources, pointInResourceCoverage,
  RESOURCE_ZONE_COMPOSITION, RESOURCE_ZONE_TYPES, type ResourceZoneType,
} from "../../territory/resourceNodes";
import { planWall, WALL_MATERIALS_DEF, wallDefense, type WallPoint } from "../../territory/walls";
import { TERRAIN_TRAITS } from "../../content/westeros/terrain";
import {
  LOCAL_CELL_M, LOCAL_CENTER_CELL, LOCAL_GRID_CELLS, buildableRadiusCells,
} from "../../content/westeros/mapScale";
import { canPlace, castleLevel, buildingAt, terrainOf, loreOf, nodesOf } from "../../territory/localMap";
import { compassToAngle } from "../../content/westeros/loreSeats";
import { seatGatesFor, seatProfileFor } from "../../content/westeros/seatProfiles";
import { terrainAtCell, terrainRasterRGBA, RASTER_RES } from "../../territory/localTerrain";
import { townLayout, type TownLayout } from "../../territory/localTown";
import { holdingOwnedByPlayer } from "../../territory/territoryEngine";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import type { CustomBuilding, WallMaterial } from "../../mvu/schema";
import { IconX, IconAlert } from "../icons";

/** Màu chấm điểm tài nguyên theo loại hàng khai thác được. */
const NODE_COLOR: Record<string, string> = {
  "Rừng Rậm": "#3f754d",
  "Khoáng Sản": "#987b57",
  "Sông Hồ": "#4e91b6",
  "Biển Cả": "#326f9f",
};
const NODE_FALLBACK = "#8a8a8a";
const ALL_RESOURCE_NAMES = [...new Set(
  Object.values(RESOURCE_ZONE_COMPOSITION).flatMap((composition) => Object.keys(composition)),
)];

function resourceIcon(resource: string): string {
  if (resource === "Rừng Rậm") return "🌲";
  if (resource === "Khoáng Sản") return "⛰️";
  if (resource === "Sông Hồ") return "≋";
  if (resource === "Biển Cả") return "⚓";
  return "●";
}

/** Bảng màu công trình — mái/tường theo công năng, tránh một sắc vàng đều tăm tắp. */
const BUILDING_SKIN: Record<BuildingType, { wall: string; roof: string }> = {
  // hành chính & phòng thủ — đá xám, mái chì
  "Lâu Đài": { wall: "#8d8778", roof: "#5c5f6b" },
  "Tường Thành": { wall: "#8f8a7e", roof: "#6f6a60" },
  "Tháp Canh": { wall: "#8a8578", roof: "#5f6167" },
  "Ụ Nỏ Bắn Rồng": { wall: "#7a7060", roof: "#4a4e58" },
  "Doanh Trại": { wall: "#7d7565", roof: "#5a534a" },
  "Học Viện Nhỏ": { wall: "#93897a", roof: "#5f6360" },
  "Sept/Rừng Thần": { wall: "#9c968a", roof: "#6c6a74" },
  "Trạm Khai Hoang": { wall: "#887b61", roof: "#5d5142" },
  "Cột Mốc Biên Cương": { wall: "#82775f", roof: "#4f4b43" },
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
  "Ruộng Bậc Thang": { wall: "#857a5d", roof: "#6e6544" },
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
  const startBuild = useTerritoryStore((s) => s.startBuild);
  const demolishBuild = useTerritoryStore((s) => s.demolishBuild);
  const cancelDemolish = useTerritoryStore((s) => s.cancelDemolish);
  const drawWall = useTerritoryStore((s) => s.drawWall);
  const raiseWall = useTerritoryStore((s) => s.raiseWall);
  const razeWall = useTerritoryStore((s) => s.razeWall);
  const drawRoad = useTerritoryStore((s) => s.drawRoad);
  const razeRoad = useTerritoryStore((s) => s.razeRoad);
  const freezeAutoRoads = useTerritoryStore((s) => s.freezeAutoRoads);
  const razeAutoRoad = useTerritoryStore((s) => s.razeAutoRoad);
  const restoreAutoRoads = useTerritoryStore((s) => s.restoreAutoRoads);
  const holding = stat["Lãnh Địa"][holdingId];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const [view, setView] = useState<View>({ scale: 0.4, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [placing, setPlacing] = useState<BuildingType | null>(null);
  const [custom, setCustom] = useState<CustomBuilding | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resourcePanel, setResourcePanel] = useState(false);
  const [showResourceCoverage, setShowResourceCoverage] = useState(true);
  const [showResourceIcons, setShowResourceIcons] = useState(true);
  const [visibleResourceZones, setVisibleResourceZones] = useState<ResourceZoneType[]>([...RESOURCE_ZONE_TYPES]);
  const [visibleResourceTypes, setVisibleResourceTypes] = useState<string[]>([...ALL_RESOURCE_NAMES]);

  // ── công cụ vạch tường ──
  const [wallMode, setWallMode] = useState(false);
  const [wallPoints, setWallPoints] = useState<WallPoint[]>([]);
  const [wallMaterial, setWallMaterial] = useState<WallMaterial>("Đá");
  const [wallLevel, setWallLevel] = useState(1);
  const [wallPanel, setWallPanel] = useState(false);
  // ── công cụ vạch đường thủ công ──
  const [roadMode, setRoadMode] = useState(false);
  const [roadPoints, setRoadPoints] = useState<WallPoint[]>([]);
  const [roadKind, setRoadKind] = useState<"Đường Nhỏ" | "Đường Lớn">("Đường Nhỏ");
  const [roadWidth, setRoadWidth] = useState(1);
  const [roadPanel, setRoadPanel] = useState(false);

  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);

  const isOwner = holding ? holdingOwnedByPlayer(stat, holdingId) : false;
  const terrain = useMemo(() => terrainOf(holdingId, holding), [holdingId, holding]);
  const nodes = useMemo(() => nodesOf(holdingId, holding), [holdingId, holding]);
  const level = castleLevel(holding);
  const radius = planningRadiusCells(holding);
  const expansionRadius = Math.max(0, radius - buildableRadiusCells(level));
  const buildings = holding?.["Công Trình"] ?? {};
  const walls = holding?.["Tường Thành"] ?? [];
  const roads = holding?.["Đường Đi"] ?? [];
  const frozenAutoRoads = holding?.["Đường Tự Động Cố Định"];
  const deletedAutoRoads = holding?.["Đường Tự Động Đã Xoá"] ?? [];
  const stock = holding?.["Tài Nguyên"] ?? ({} as Record<string, number>);
  const demography = holding?.["Nhân Khẩu"];
  const region = REGIONS_BY_ID[holding?.["Thuộc Vùng"] ?? ""];
  const lore = loreOf(holdingId, holding);
  const eraId = stat["Cài Đặt Ván"]["Thời Kỳ"];
  const seatProfile = seatProfileFor(holdingId, eraId);
  const visibleResourceNodes = useMemo(() => nodes.filter((node) => (
    visibleResourceZones.includes(node["Tài Nguyên"] as ResourceZoneType)
    && Object.keys(nodeResources(node)).some((resource) => visibleResourceTypes.includes(resource))
  )), [nodes, visibleResourceTypes, visibleResourceZones]);

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
        fixedGates: seatGatesFor(holdingId),
      },
    ),
    [terrain, buildings, radius, walls.length, lore, holdingId],
  );

  const generatedAutomaticRoads = useMemo(() => [
    ...town.throughRoads.map((road, index) => ({
      id: autoRoadId("main", index, road.points),
      label: road.name || (road.main ? `Quan lộ ${index + 1}` : `Đường lớn ${index + 1}`),
      main: road.main,
      kind: "Quan lộ" as const,
      points: road.points,
    })),
    ...town.lanes.map((points, index) => ({
      id: autoRoadId("lane", index, points),
      label: `Ngõ nhỏ ${index + 1}`,
      main: false,
      kind: "Ngõ nhỏ" as const,
      points,
    })),
  ], [town]);

  const automaticRoads = useMemo(() => frozenAutoRoads !== undefined
    ? frozenAutoRoads.map((road) => ({
      id: road["Mã"],
      label: road["Tên"],
      main: road["Loại"] === "Đường Lớn" && road["Bề Rộng"] >= 3,
      kind: road["Loại"] === "Đường Nhỏ" ? "Ngõ nhỏ" as const : "Quan lộ" as const,
      points: road["Điểm"].map((point) => [point.x, point.y] as [number, number]),
    }))
    : generatedAutomaticRoads,
  [frozenAutoRoads, generatedAutomaticRoads]);

  // Chụp lại đúng mạng đường đang có. Sau lần này, công trình mới không còn
  // làm townLayout bổ sung đường vào dữ liệu hiển thị.
  useEffect(() => {
    if (!holding || frozenAutoRoads !== undefined) return;
    freezeAutoRoads(holdingId, generatedAutomaticRoads.map((road) => ({
      "Mã": road.id,
      "Tên": road.label,
      "Loại": road.kind === "Ngõ nhỏ" ? "Đường Nhỏ" : "Đường Lớn",
      "Điểm": road.points.map(([x, y]) => ({ x: Math.round(x), y: Math.round(y) })),
      "Bề Rộng": road.kind === "Ngõ nhỏ" ? 1 : road.main ? 3 : 2,
    })));
  }, [freezeAutoRoads, frozenAutoRoads, generatedAutomaticRoads, holding, holdingId]);

  const visibleAutomaticRoads = useMemo(
    () => automaticRoads.filter((road) => !deletedAutoRoads.includes(road.id)),
    [automaticRoads, deletedAutoRoads],
  );
  const visibleThroughRoads = visibleAutomaticRoads.filter((road) => road.kind === "Quan lộ");
  const visibleLanes = visibleAutomaticRoads.filter((road) => road.kind === "Ngõ nhỏ");

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
    for (const river of [terrain.river, ...(terrain.extraRivers ?? [])]) {
      if (river.length < 2) continue;
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

    // 3. QUAN LỘ — chạy xuyên bản đồ nên được vẽ trước lớp tối ngoài quy hoạch.
    drawPath(ctx, visibleThroughRoads.filter((road) => road.main).map((road) => road.points), scale, "rgba(20,17,13,0.32)", Math.max(1.6, 17 * scale));
    drawPath(ctx, visibleThroughRoads.filter((road) => road.main).map((road) => road.points), scale, "rgba(190,172,136,0.78)", Math.max(1.2, 12 * scale));
    drawPath(ctx, visibleThroughRoads.filter((road) => !road.main).map((road) => road.points), scale, "rgba(168,152,120,0.55)", Math.max(0.9, 8 * scale));

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

    // 5. NGÕ NHỎ trong thành.
    drawPath(ctx, visibleLanes.map((road) => road.points), scale, "rgba(150,136,110,0.5)", Math.max(0.7, 4 * scale));

    // 6. CẦU — chỉ giữ cầu còn nằm trên ít nhất một tuyến đang hiện.
    const activePaths = visibleAutomaticRoads.map((road) => road.points);
    for (const br of town.bridges) {
      if (!activePaths.some((path) => distanceToPolyline(br.at, path) <= Math.max(10, br.width))) continue;
      ctx.save();
      ctx.translate(br.at[0] * scale, br.at[1] * scale);
      ctx.rotate(br.angle);
      const length = br.span * scale * 1.1;
      const width = br.width * scale;
      ctx.fillStyle = "rgba(140,132,118,0.92)";
      ctx.fillRect(-length / 2, -width / 2, length, width);
      ctx.strokeStyle = "rgba(40,36,30,0.7)";
      ctx.lineWidth = Math.max(0.6, 1.2 * scale);
      ctx.strokeRect(-length / 2, -width / 2, length, width);
      ctx.restore();
    }

    // ĐƯỜNG THỦ CÔNG — vẽ các tuyến người chơi đã xác nhận.
    for (const road of roads) {
      const path = road["Điểm"].map((point) => [point.x, point.y] as [number, number]);
      const small = road["Loại"] === "Đường Nhỏ";
      const outerWidth = small ? 2.2 + road["Bề Rộng"] * 1.5 : 8 + road["Bề Rộng"] * 5;
      const innerWidth = small ? 1.2 + road["Bề Rộng"] : 5 + road["Bề Rộng"] * 4;
      drawPath(ctx, [path], scale, "rgba(25,20,15,0.42)", Math.max(small ? 0.9 : 1.8, outerWidth * scale));
      drawPath(ctx, [path], scale, small ? "rgba(156,140,111,0.76)" : "rgba(185,164,124,0.82)", Math.max(small ? 0.65 : 1.2, innerWidth * scale));
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

    // Cổng canon là một phần của hình thành, không chỉ là tên đặt trên đường.
    // Với King's Landing, bảy cổng bám đúng tường thành và không bị suy ra từ
    // một vòng tròn bán kính chung.
    if (seatProfile && town.gates.length > 0) {
      for (const gate of town.gates) drawCityGate(ctx, gate.at[0] * scale, gate.at[1] * scale, gate.angle, scale, gate.main);
    }

    // tuyến tường đang vạch dở — nét vàng bám theo con trỏ
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

    // tuyến đường đang vạch dở — màu đất sáng, tách khỏi tường thành.
    if (roadMode && roadPoints.length > 0) {
      const pts = hover ? [...roadPoints, { x: hover.x, y: hover.y }] : roadPoints;
      drawPath(
        ctx,
        [pts.map((point) => [point.x, point.y] as [number, number])],
        scale,
        "rgba(231,194,126,0.95)",
        roadKind === "Đường Nhỏ"
          ? Math.max(0.8, (1.5 + roadWidth) * scale)
          : Math.max(1.4, (5 + roadWidth * 4) * scale),
      );
    }

    // Tên quan lộ và đường thủ công đặt dọc theo chính tuyến.
    if (scale > 0.1) {
      for (const road of visibleThroughRoads) {
        if (!road.label || road.label.startsWith("Quan lộ ") || road.label.startsWith("Đường lớn ")) continue;
        const spot = pointAlong(road.points, radius * 1.25);
        if (!spot) continue;
        const [px, py, ang] = spot;
        ctx.save();
        ctx.translate(px * scale, py * scale);
        let angle = ang;
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
        ctx.rotate(angle);
        ctx.font = `${road.main ? 14 : 12}px sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(8,10,14,0.9)";
        ctx.strokeText(road.label, 0, -Math.max(7, 9 * scale));
        ctx.fillStyle = road.main ? "#e8d9a8" : "rgba(220,210,186,0.85)";
        ctx.fillText(road.label, 0, -Math.max(7, 9 * scale));
        ctx.restore();
      }
      for (const road of roads) {
        const path = road["Điểm"].map((point) => [point.x, point.y] as [number, number]);
        const spot = pointAlong(path, Math.max(20, pathLength(path) * 0.42));
        if (!spot) continue;
        const [px, py, ang] = spot;
        ctx.save();
        ctx.translate(px * scale, py * scale);
        let a = ang;
        if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI; // giữ chữ không lộn ngược
        ctx.rotate(a);
        ctx.font = `${11 + road["Bề Rộng"]}px sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(8,10,14,0.9)";
        ctx.strokeText(road["Tên"], 0, -Math.max(7, 9 * scale));
        ctx.fillStyle = "rgba(232,216,180,0.9)";
        ctx.fillText(road["Tên"], 0, -Math.max(7, 9 * scale));
        ctx.restore();
      }
      ctx.textAlign = "left";
    }

    // 10. VÙNG TÀI NGUYÊN — đa giác bám địa mạo, không còn vòng tròn phình lấn
    for (const n of visibleResourceNodes) {
      if (!n["Đã Khám Phá"]) continue;
      const nx = n["Tọa Độ X"] * scale;
      const ny = n["Tọa Độ Y"] * scale;
      const margin = n["Kích Thước"] * scale + 40;
      if (nx < -tx - margin || ny < -ty - margin || nx > w - tx + margin || ny > h - ty + margin) continue;
      const grade = n["Trữ Lượng"];
      const color = NODE_COLOR[n["Tài Nguyên"]] ?? NODE_FALLBACK;
      const coverage = n["Vùng Bao Phủ"] ?? [];

      const picked = selectedNode === n["Mã"];
      const workers = nodeWorkers(n);
      if (showResourceCoverage) {
        ctx.globalAlpha = grade <= 0 ? 0.14 : 0.14 + grade * 0.08;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (coverage.length >= 3) {
          ctx.moveTo(coverage[0].x * scale, coverage[0].y * scale);
          for (let i = 1; i < coverage.length; i++) ctx.lineTo(coverage[i].x * scale, coverage[i].y * scale);
          ctx.closePath();
        } else {
          ctx.arc(nx, ny, Math.max(2.5, n["Kích Thước"] * scale), 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = picked
          ? "#ffd76a"
          : workers.length > 0 ? "rgba(255,215,106,0.82)" : color;
        ctx.lineWidth = picked ? 3 : workers.length > 0 ? 1.8 : 1;
        ctx.setLineDash(picked ? [] : [Math.max(3, 10 * scale), Math.max(2, 7 * scale)]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // icon neo ở tâm giúp nhận dạng loại tài nguyên nhưng không che địa hình.
      if (showResourceIcons && scale > 0.12) {
        ctx.globalAlpha = grade <= 0 ? 0.4 : 0.88;
        ctx.fillStyle = "rgba(8,10,14,0.72)";
        ctx.beginPath();
        ctx.arc(nx, ny, Math.max(7, 11 * scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = `${Math.max(9, 13 * scale)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(resourceIcon(n["Tài Nguyên"]), nx, ny + 0.5);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
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

      const landmarkName = b["Tuỳ Chỉnh"]?.["Tên"] || "";
      const landmarkGroup = b["Tuỳ Chỉnh"]?.["Nhóm"] || "";
      const visualSize = landmarkName ? bs * 2.45 : bs;
      const visualX = bx - (visualSize - bs) / 2;
      const visualY = by - (visualSize - bs) / 2;
      if (b["Đang Xây"]) {
        const total = Math.max(1, buildingDays(b["Loại"], b["Cấp Độ"] || 1));
        const progress = Math.max(0, Math.min(1, 1 - b["Ngày Xây Còn Lại"] / total));
        drawSite(ctx, bx, by, bs, def.footprint, progress, b["Loại"], scale);
      } else if (b["Đang Phá"]) {
        const total = Math.max(1, demolitionDays(b["Loại"], b["Cấp Độ"] || 1));
        const progress = Math.max(0, Math.min(1, (b["Ngày Phá Còn Lại"] ?? 0) / total));
        drawSite(ctx, bx, by, bs, def.footprint, progress, b["Loại"], scale);
      } else {
        if (landmarkName) drawLandmark(ctx, landmarkName, visualX, visualY, visualSize, landmarkGroup);
        else drawBuildingIcon(ctx, bx, by, bs, b["Loại"]);
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
      if (visualSize > 40) {
        ctx.fillStyle = "rgba(10,12,16,0.75)";
        ctx.font = `${Math.min(14, Math.max(9, bs * 0.14))}px sans-serif`;
        ctx.fillText(
          b["Tuỳ Chỉnh"]?.["Tên"] || name,
          visualX + 3, visualY + Math.min(14, Math.max(9, visualSize * 0.14)) + 2,
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
    size, view, terrain, backdrop, town, buildings, walls, roads, visibleResourceNodes, selected, selectedNode,
    visibleAutomaticRoads, visibleThroughRoads, visibleLanes,
    placing, hover, hoverCheck, radius, wallMode, wallPoints, wallLevel, roadMode, roadPoints, roadKind, roadWidth, ledgerByName,
    showResourceCoverage, showResourceIcons,
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
    if (!placing && !wallMode && !roadMode) return;
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
    if (roadMode) {
      setRoadPoints((points) => [...points, { x: cell.x, y: cell.y }]);
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
    if (found) {
      setSelected(found[0]);
      setSelectedNode(null);
      return;
    }
    // không trúng công trình thì thử tới ĐIỂM TÀI NGUYÊN — vùng bấm nới rộng
    // theo mức zoom để ở tỉ lệ nhỏ vẫn chạm được cái chấm
    const grab = Math.max(10, 14 / Math.max(0.05, view.scale));
    let best: string | null = null;
    let bestD = Infinity;
    for (const n of visibleResourceNodes) {
      if (!n["Đã Khám Phá"]) continue;
      const d = Math.hypot(n["Tọa Độ X"] - cell.x, n["Tọa Độ Y"] - cell.y);
      if ((pointInResourceCoverage(n, cell.x, cell.y) || d <= grab) && d < bestD) { bestD = d; best = n["Mã"]; }
    }
    setSelected(null);
    setSelectedNode(best);
  };

  const resetTools = () => {
    setSelectedNode(null);
    setPlacing(null);
    setCustom(null);
    setWallMode(false);
    setWallPoints([]);
    setRoadMode(false);
    setRoadPoints([]);
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

  const commitRoad = () => {
    const result = drawRoad(holdingId, roadPoints, { width: roadWidth, kind: roadKind });
    if (result.ok) {
      setNotice(`Đã mở ${roadKind.toLocaleLowerCase("vi-VN")} dài ${Math.round(roadPolylineLength(roadPoints) * LOCAL_CELL_M).toLocaleString("vi-VN")} m.`);
      setRoadPoints([]);
      setRoadMode(false);
      setRoadPanel(false);
      setHover(null);
    } else {
      setNotice(result.error ?? "Không mở được tuyến đường này");
    }
  };

  if (!holding) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] italic text-[var(--text-muted)]">
        Thành trì không tồn tại.
      </div>
    );
  }

  const selBuilding = selected ? buildings[selected] : null;
  const selLedger = selected ? ledgerByName[selected] : null;
  const selNode = selectedNode ? nodes.find((n) => n["Mã"] === selectedNode) ?? null : null;
  /** công trình nào khai thác được loại tài nguyên đang chọn. */
  const nodeUsers = selNode
    ? BUILDABLE_LIST.filter((d) => d.requiresNode?.some((resource) => nodeContainsResource(selNode, resource)))
    : [];
  const selectedNodeWorkers = selNode ? nodeWorkers(selNode) : [];
  const nodeWorkerLedgers = selectedNodeWorkers.map((name) => ledgerByName[name]).filter(Boolean);
  const hoverTerrain = hover ? terrainAtCell(terrain, hover.x, hover.y) : null;
  const presentTerrains = Object.entries(TERRAIN_TRAITS).filter(([t]) => terrain.grid.includes(t as never));
  const totalWallDefense = wallDefense(holding);
  const specialBuildingDefense = Object.values(buildings)
    .filter((building) => !building["Đang Xây"] && !building["Đang Phá"] && !!building["Tuỳ Chỉnh"])
    .reduce((total, building) => total + buildingDefense(building), 0);

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
            {expansionRadius > 0 ? ` · khai hoang +${((expansionRadius * LOCAL_CELL_M) / 1000).toFixed(2)} km` : ""}
            {population ? ` · dân ${population.population.toLocaleString("vi-VN")}/${population.housingCapacity.toLocaleString("vi-VN")} chỗ ở` : ""}
          </p>
          {lore && (
            <p className="mt-0.5 truncate text-[11px] italic text-[var(--accent-text)]" title={lore.note}>
              Địa thế theo nguyên tác — {lore.note}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            onClick={() => {
              resetTools();
              setMenuOpen(false);
              setWallPanel(false);
              setRoadPanel(false);
              setResourcePanel((open) => !open);
            }}
            className={`rounded-md px-3 py-1.5 text-[12px] ${resourcePanel ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
          >
            Tài nguyên
          </button>
          {isOwner ? (
            <>
              <button
                onClick={() => { resetTools(); setMenuOpen((v) => !v); setWallPanel(false); setRoadPanel(false); setResourcePanel(false); setNotice(null); }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${menuOpen ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
              >
                Xây công trình
              </button>
              <button
                onClick={() => {
                  resetTools();
                  setMenuOpen(false);
                  setRoadPanel(false);
                  setResourcePanel(false);
                  setWallPanel(true);
                  setWallMode(true);
                  setNotice("Bấm từng điểm trên bản đồ để vạch tuyến tường, xong thì bấm Đồng Ý.");
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${wallMode ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
              >
                Tường thành
              </button>
              <button
                onClick={() => {
                  resetTools();
                  setMenuOpen(false);
                  setWallPanel(false);
                  setResourcePanel(false);
                  setRoadPanel(true);
                  setRoadMode(true);
                  setNotice("Bấm từng điểm để tự vạch đường, xong thì bấm Đồng Ý.");
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${roadMode ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)]"} hover:bg-[var(--glass-bg-hover)]`}
              >
                Đường đi
              </button>
            </>
          ) : (
            <span className="flex items-center gap-1.5 rounded-md border border-[rgba(176,106,95,0.4)] bg-[rgba(176,106,95,0.1)] px-2.5 py-1.5 text-[11.5px] text-[var(--text-muted)]">
              <IconAlert size={13} color="var(--danger)" /> Chỉ xem — đất của người khác
            </span>
          )}
          {onExit && (
            <button onClick={onExit} title="Về bản đồ lãnh địa quanh thành" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]">
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
          className={`h-full w-full touch-none ${placing || wallMode || roadMode ? "cursor-crosshair" : "cursor-grab"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => { drag.current = null; if (!wallMode && !roadMode) setHover(null); }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* ── BỘ LỌC VÙNG VÀ SẢN VẬT ── */}
        {resourcePanel && (
          <div className="glass-strong anim-in absolute left-3 top-3 max-h-[calc(100%-24px)] w-[330px] overflow-y-auto rounded-[var(--radius-md)] p-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[12.5px] tracking-wide text-[var(--accent-text)]">HIỂN THỊ TÀI NGUYÊN</span>
              <button onClick={() => setResourcePanel(false)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]">
                <IconX size={14} />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-1.5 rounded bg-[rgba(0,0,0,0.24)] p-2">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-soft)]">
                <input type="checkbox" checked={showResourceCoverage} onChange={(event) => setShowResourceCoverage(event.target.checked)} />
                Vùng bao phủ
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--text-soft)]">
                <input type="checkbox" checked={showResourceIcons} onChange={(event) => setShowResourceIcons(event.target.checked)} />
                Biểu tượng
              </label>
            </div>

            <div className="mb-2 flex gap-1.5">
              <button
                onClick={() => { setVisibleResourceZones([...RESOURCE_ZONE_TYPES]); setVisibleResourceTypes([...ALL_RESOURCE_NAMES]); }}
                className="rounded bg-[var(--accent-soft)] px-2 py-1 text-[10.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
              >
                Chọn tất cả
              </button>
              <button
                onClick={() => { setVisibleResourceZones([]); setVisibleResourceTypes([]); setSelectedNode(null); }}
                className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-1 text-[10.5px] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]"
              >
                Bỏ tất cả
              </button>
            </div>

            {RESOURCE_ZONE_TYPES.map((zone) => {
              const zoneChecked = visibleResourceZones.includes(zone);
              const composition = RESOURCE_ZONE_COMPOSITION[zone];
              const zoneCount = nodes.filter((node) => node["Tài Nguyên"] === zone).length;
              return (
                <div key={zone} className="mb-2 rounded border border-[var(--glass-border)] bg-[rgba(0,0,0,0.18)] p-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={zoneChecked}
                      onChange={() => setVisibleResourceZones((zones) => (
                        zones.includes(zone) ? zones.filter((item) => item !== zone) : [...zones, zone]
                      ))}
                    />
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: NODE_COLOR[zone] ?? NODE_FALLBACK }} />
                    <span className="flex-1 font-medium text-[var(--text-soft)]">{zone}</span>
                    <span className="font-mono text-[10.5px] text-[var(--text-faint)]">{zoneCount} vùng</span>
                  </label>
                  <div className="mt-1.5 space-y-1 border-t border-[var(--glass-border)] pt-1.5">
                    {Object.entries(composition).map(([resource, share]) => {
                      const extractors = BUILDABLE_LIST
                        .filter((definition) => definition.requiresNode?.includes(resource))
                        .map((definition) => definition.type);
                      return (
                        <label key={resource} className="flex cursor-pointer items-start gap-2 text-[10.5px]">
                          <input
                            className="mt-0.5"
                            type="checkbox"
                            checked={visibleResourceTypes.includes(resource)}
                            onChange={() => setVisibleResourceTypes((resources) => (
                              resources.includes(resource)
                                ? resources.filter((item) => item !== resource)
                                : [...resources, resource]
                            ))}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="text-[var(--text-soft)]">{resource}</span>
                            <span className="ml-1 font-mono text-[var(--accent-text)]">{Math.round(share * 100)}%</span>
                            <span className={`block truncate ${extractors.length > 0 ? "text-[var(--text-faint)]" : "text-[var(--danger)]"}`}>
                              {extractors.length > 0 ? `Khai thác: ${extractors.join(" / ")}` : "Chưa có công trình khai thác"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

        {/* ── BẢNG VẠCH ĐƯỜNG THỦ CÔNG ── */}
        {roadPanel && isOwner && (
          <div className="glass-strong anim-in absolute right-3 top-3 max-h-[calc(100%-24px)] w-[300px] overflow-y-auto rounded-[var(--radius-md)] p-3 text-[12px]">
            <div className="mb-2 flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[12.5px] tracking-wide text-[var(--accent-text)]">VẠCH ĐƯỜNG ĐI</span>
              <button
                onClick={() => { setRoadPanel(false); setRoadMode(false); setRoadPoints([]); }}
                className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"
              >
                <IconX size={14} />
              </button>
            </div>
            <p className="mb-2 text-[11px] italic text-[var(--text-faint)]">
              Mạng quan lộ và ngõ hiện tại được giữ cố định. Công trình xây mới sẽ không tự sinh thêm đường.
            </p>
            <div className="mb-2">
              <div className="mb-1 text-[11px] text-[var(--text-faint)]">Loại đường</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(["Đường Nhỏ", "Đường Lớn"] as const).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setRoadKind(kind)}
                    className={`rounded px-2 py-1.5 text-[11.5px] ${roadKind === kind
                      ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                      : "bg-[rgba(255,255,255,0.06)] text-[var(--text-soft)] hover:bg-[var(--glass-bg-hover)]"}`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-faint)]">Cỡ đường</span>
              <input
                type="range" min={1} max={3} value={roadWidth}
                onChange={(event) => setRoadWidth(Number(event.target.value))}
                className="flex-1"
              />
              <span className="w-6 text-right font-mono text-[var(--accent-text)]">{roadWidth}</span>
            </div>
            <div className="mb-2 rounded bg-[rgba(0,0,0,0.28)] p-2">
              <Row label="Số điểm đã bấm" value={String(roadPoints.length)} />
              <Row
                label="Chiều dài"
                value={`${Math.round(roadPolylineLength(roadPoints) * LOCAL_CELL_M).toLocaleString("vi-VN")} m`}
              />
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={roadPoints.length < 2}
                onClick={commitRoad}
                className="flex-1 rounded bg-[var(--accent-soft)] px-2 py-1.5 text-[12px] text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
              >
                Đồng ý
              </button>
              <button
                disabled={roadPoints.length === 0}
                onClick={() => setRoadPoints((points) => points.slice(0, -1))}
                className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-1.5 text-[12px] text-[var(--text-soft)] disabled:opacity-40 hover:bg-[var(--glass-bg-hover)]"
              >
                Lùi 1 điểm
              </button>
            </div>
            {roads.length > 0 && (
              <div className="mt-3 border-t border-[var(--glass-border)] pt-2">
                <div className="mb-1 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Tuyến đã xây</div>
                {roads.map((road) => (
                  <div key={road["Mã"]} className="mb-1 flex items-center gap-1.5 text-[11px]">
                    <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">
                      {road["Loại"]} · {road["Tên"]} · {Math.round(roadPolylineLength(road["Điểm"]) * LOCAL_CELL_M).toLocaleString("vi-VN")} m
                    </span>
                    <button
                      onClick={() => razeRoad(holdingId, road["Mã"])}
                      className="rounded px-1.5 py-0.5 text-[10.5px] text-[var(--danger)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Xoá
                    </button>
                  </div>
                ))}
              </div>
            )}
            {automaticRoads.length > 0 && (
              <div className="mt-3 border-t border-[var(--glass-border)] pt-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Đường có sẵn</span>
                  {deletedAutoRoads.length > 0 && (
                    <button
                      onClick={() => restoreAutoRoads(holdingId)}
                      className="rounded px-1.5 py-0.5 text-[10.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Khôi phục tất cả
                    </button>
                  )}
                </div>
                {automaticRoads.map((road) => {
                  const deleted = deletedAutoRoads.includes(road.id);
                  return (
                    <div key={road.id} className="mb-1 flex items-center gap-1.5 text-[11px]">
                      <span className={`min-w-0 flex-1 truncate ${deleted ? "line-through text-[var(--text-faint)]" : "text-[var(--text-soft)]"}`}>
                        {road.kind} · {road.label} · {Math.round(pathLength(road.points) * LOCAL_CELL_M).toLocaleString("vi-VN")} m
                      </span>
                      {!deleted && (
                        <button
                          onClick={() => razeAutoRoad(holdingId, road.id)}
                          className="rounded px-1.5 py-0.5 text-[10.5px] text-[var(--danger)] hover:bg-[var(--glass-bg-hover)]"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                  <span className="text-[var(--accent-text)]">
                    Tường +{totalWallDefense}{specialBuildingDefense > 0 ? ` · kỳ quan +${specialBuildingDefense}` : ""}
                  </span>
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
                          || nodes.some((n) => def.requiresNode!.some((resource) => nodeContainsResource(n, resource)) && n["Trữ Lượng"] > 0);
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
                              {def.requiresNode ? ` · phải nằm trong vùng có ${def.requiresNode.join(" / ")}` : ""}
                              {def.nearWater ? " · sát mép nước" : ""}
                              {coastBlocked ? " · khu vực thành trì không giáp biển" : ""}
                              {!nodeAvailable ? " · đất trực thuộc chưa tìm ra mạch nào" : ""}
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
        {selBuilding && !selNode && !placing && !wallMode && !roadMode && (
          <div className="glass-strong anim-in absolute left-3 top-3 w-[268px] rounded-[var(--radius-md)] p-3.5 text-[12.5px]">
            <div className="mb-2 flex items-start justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[14px] text-[var(--accent-text)]">
                {selBuilding["Tuỳ Chỉnh"]?.["Tên"] || selected}
              </span>
              <button onClick={() => setSelected(null)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]"><IconX size={14} /></button>
            </div>

            <Row label="Loại" value={selBuilding["Loại"]} />
            <Row label="Cấp Độ" value={String(selBuilding["Cấp Độ"])} />
            {selBuilding["Tuỳ Chỉnh"] && (
              <div className="mt-1 rounded bg-[rgba(0,0,0,0.24)] p-1.5">
                <Row label="Nhóm" value={selBuilding["Tuỳ Chỉnh"]["Nhóm"] || "Đặc biệt"} />
                {(selBuilding["Tuỳ Chỉnh"]["Phòng Thủ"] ?? 0) > 0 && (
                  <Row label="Phòng thủ bản đồ" value={`+${buildingDefense(selBuilding)}`} />
                )}
                {(selBuilding["Tuỳ Chỉnh"]["Sức Chứa Dân"] ?? 0) > 0 && (
                  <Row label="Chỗ ở" value={`+${(selBuilding["Tuỳ Chỉnh"]["Sức Chứa Dân"] ?? 0).toLocaleString("vi-VN")}`} />
                )}
                {(selBuilding["Tuỳ Chỉnh"]["Lòng Dân/Tháng"] ?? 0) !== 0 && (
                  <Row
                    label="Lòng dân / tháng"
                    value={`${(selBuilding["Tuỳ Chỉnh"]["Lòng Dân/Tháng"] ?? 0) > 0 ? "+" : ""}${selBuilding["Tuỳ Chỉnh"]["Lòng Dân/Tháng"]}`}
                  />
                )}
              </div>
            )}

            {selBuilding["Đang Xây"] ? (
              <Row label="Tình trạng" value={`Đang xây — còn ${formatDuration(selBuilding["Ngày Xây Còn Lại"])}`} />
            ) : selBuilding["Đang Phá"] ? (
              <Row label="Tình trạng" value={`Đang phá dỡ — còn ${formatDuration(selBuilding["Ngày Phá Còn Lại"] ?? 0)}`} />
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
                      Vùng {selLedger.node["Tài Nguyên"]} — {NODE_GRADE_LABEL[selLedger.node["Trữ Lượng"]]}
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
            {isOwner && selected && (
              <div className="mt-3 flex gap-2 border-t border-[var(--glass-border)] pt-2.5">
                {selBuilding["Đang Phá"] ? (
                  <button
                    onClick={() => {
                      cancelDemolish(holdingId, selected);
                      setNotice(`Đã dừng phá dỡ ${selected}.`);
                    }}
                    className="flex-1 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-2 py-1.5 text-[11.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
                  >
                    Dừng phá dỡ
                  </button>
                ) : !selBuilding["Đang Xây"] ? (
                  <>
                    <button
                      onClick={() => {
                        const r = startBuild(holdingId, selBuilding["Loại"], selected);
                        setNotice(r.ok ? `Đã nâng cấp ${selected}.` : (r.error ?? "Không thể nâng cấp công trình này"));
                      }}
                      className="flex-1 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-2 py-1.5 text-[11.5px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
                    >
                      Nâng cấp
                    </button>
                    <button
                      onClick={() => {
                        const r = demolishBuild(holdingId, selected);
                        setNotice(r.ok
                          ? `Đã bắt đầu phá dỡ ${selected} (${formatDuration(demolitionDays(selBuilding["Loại"], selBuilding["Cấp Độ"] || 1))}).`
                          : (r.error ?? "Không thể phá dỡ công trình này"));
                      }}
                      className="flex-1 rounded-[var(--radius-sm)] border border-[rgba(176,106,95,0.45)] px-2 py-1.5 text-[11.5px] text-[var(--danger)] hover:bg-[rgba(176,106,95,0.12)]"
                    >
                      Phá dỡ
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ── SỔ MỘT ĐIỂM TÀI NGUYÊN ── */}
        {selNode && !placing && !wallMode && !roadMode && (
          <div className="glass-strong anim-in absolute left-3 top-3 w-[252px] rounded-[var(--radius-md)] p-3.5 text-[12.5px]">
            <div className="mb-2 flex items-start justify-between border-b border-[var(--glass-border)] pb-2">
              <span className="font-display text-[14px] text-[var(--accent-text)]">
                Vùng {selNode["Tài Nguyên"]}
              </span>
              <button onClick={() => setSelectedNode(null)} className="text-[var(--text-faint)] hover:text-[var(--text-soft)]">
                <IconX size={14} />
              </button>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: NODE_COLOR[selNode["Tài Nguyên"]] ?? NODE_FALLBACK }}
              />
              <span className={selNode["Trữ Lượng"] > 0 ? "text-[var(--ok)]" : "text-[var(--danger)]"}>
                {NODE_GRADE_LABEL[selNode["Trữ Lượng"]]}
              </span>
              <span className="text-[var(--text-faint)]">bậc {selNode["Trữ Lượng"]}/3</span>
            </div>

            {/* thanh trữ lượng — nhìn là biết mỏ còn dùng được bao lâu */}
            <div className="mb-2 flex gap-1">
              {[1, 2, 3].map((g) => (
                <div
                  key={g}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background: g <= selNode["Trữ Lượng"]
                      ? (NODE_COLOR[selNode["Tài Nguyên"]] ?? NODE_FALLBACK)
                      : "rgba(255,255,255,0.09)",
                  }}
                />
              ))}
            </div>

            <Row label="Còn lại ở bậc này" value={selNode["Còn Lại"].toLocaleString("vi-VN")} />
            <Row label="Hệ số sản lượng" value={`×${(NODE_GRADE_MULT[selNode["Trữ Lượng"]] ?? 0).toFixed(2)}`} />
            <Row label="Toạ độ ô" value={`(${selNode["Tọa Độ X"]}, ${selNode["Tọa Độ Y"]})`} />
            <Row label="Diện tích vùng" value={`${nodeAreaKm2(selNode).toFixed(2)} km²`} />
            <Row label="Sức chứa khai thác" value={`${selectedNodeWorkers.length}/${nodeCapacity(selNode)} công trình`} />
            <Row label="Địa hình" value={TERRAIN_TRAITS[terrainAtCell(terrain, selNode["Tọa Độ X"], selNode["Tọa Độ Y"])].label} />

            <div className="mt-2 border-t border-[var(--glass-border)] pt-2">
              <div className="mb-1 text-[10.5px] uppercase tracking-widest text-[var(--text-faint)]">Sản vật bên trong</div>
              {Object.entries(nodeResources(selNode))
                .sort((a, b) => b[1] - a[1])
                .map(([resource, share]) => (
                  <div key={resource} className="mb-0.5 flex items-center gap-2 text-[11px]">
                    <span className="min-w-0 flex-1 truncate text-[var(--text-soft)]">{resource}</span>
                    <span className="font-mono text-[var(--accent-text)]">{Math.round(share * 100)}%</span>
                  </div>
                ))}
            </div>

            <div className="mt-2 border-t border-[var(--glass-border)] pt-2">
              {selectedNodeWorkers.length > 0 ? (
                <>
                  <div className="text-[11.5px] text-[var(--text-soft)]">
                    Đang khai thác bởi <span className="text-[var(--accent-text)]">{selectedNodeWorkers.join(", ")}</span>
                  </div>
                  {nodeWorkerLedgers.map((nodeWorker) => (
                    <div key={nodeWorker.name} className="mt-0.5 text-[11px] text-[var(--text-faint)]">
                      Nhân lực {nodeWorker.haveTotal}/{nodeWorker.needTotal}
                      {Object.entries(nodeWorker.produce).map(([k, v]) => (
                        <span key={k} className="ml-1.5 text-[var(--ok)]">+{v} {k}/tháng</span>
                      ))}
                    </div>
                  ))}
                </>
              ) : selNode["Trữ Lượng"] <= 0 ? (
                <p className="text-[11.5px] italic text-[var(--danger)]">
                  Vùng đã cạn — không còn sản vật để thu hoạch.
                </p>
              ) : nodeUsers.length > 0 ? (
                <p className="text-[11.5px] italic text-[var(--text-faint)]">
                  Chưa ai khai thác. Dựng {nodeUsers.map((d) => d.type).join(" hoặc ")} trong vùng này
                  để khai thác.
                </p>
              ) : (
                <p className="text-[11.5px] italic text-[var(--text-faint)]">
                  Chưa có công trình phù hợp với các sản vật trong vùng này.
                </p>
              )}
            </div>

            {isOwner && nodeUsers.length > 0 && selNode["Trữ Lượng"] > 0 && selectedNodeWorkers.length < nodeCapacity(selNode) && (
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setMenuOpen(false);
                  setPlacing(nodeUsers[0].type);
                  setNotice(`Đặt ${nodeUsers[0].type} trong vùng ${selNode["Tài Nguyên"]}.`);
                }}
                className="mt-2 w-full rounded bg-[var(--accent-soft)] px-2 py-1.5 text-[12px] text-[var(--accent-text)] hover:bg-[var(--glass-bg-hover)]"
              >
                Dựng {nodeUsers[0].type} ở đây
              </button>
            )}
          </div>
        )}

        {/* ── TÓM TẮT DÂN CƯ ── */}
        {population && !selBuilding && !selNode && !menuOpen && !wallPanel && !roadPanel && !resourcePanel && !customOpen && (
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
            {demography && (
              <>
                <div className="my-2 border-t border-[rgba(255,255,255,0.10)]" />
                <Row
                  label="Sinh / chết"
                  value={`+${demography["Sinh"].toLocaleString("vi-VN")} / −${demography["Chết"].toLocaleString("vi-VN")}`}
                />
                <Row
                  label="Nhập / xuất cư"
                  value={`+${demography["Gia Nhập"].toLocaleString("vi-VN")} / −${demography["Rời Đi"].toLocaleString("vi-VN")}`}
                />
                <Row
                  label="Biến động tháng"
                  value={`${demography["Biến Động Ròng"] >= 0 ? "+" : ""}${demography["Biến Động Ròng"].toLocaleString("vi-VN")}`}
                />
                <p className="mt-1 text-[10.5px] text-[var(--text-faint)]">
                  Tỷ lệ: sinh {(demography["Tỷ Lệ Sinh"] * 100).toFixed(2)}% · chết {(demography["Tỷ Lệ Chết"] * 100).toFixed(2)}% / tháng
                </p>
              </>
            )}
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
            "Nhân Theo Cấp": true,
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

/**
 * Điểm nằm cách đầu polyline `dist` ô, kèm góc của đoạn chứa nó. Dùng để đặt
 * nhãn NẰM TRÊN con đường thay vì thả nổi bên cạnh.
 */
function pathLength(pts: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return total;
}

/** Mã tuyến ổn định qua các lần mở bản đồ để thao tác xoá được lưu trong save. */
function autoRoadId(kind: "main" | "lane", index: number, pts: [number, number][]): string {
  let hash = 2166136261;
  for (const [x, y] of pts) {
    hash = Math.imul(hash ^ Math.round(x * 10), 16777619);
    hash = Math.imul(hash ^ Math.round(y * 10), 16777619);
  }
  return `auto-${kind}-${index}-${(hash >>> 0).toString(36)}`;
}

function distanceToPolyline(point: [number, number], pts: [number, number][]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0
      ? Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / lenSq))
      : 0;
    best = Math.min(best, Math.hypot(point[0] - (ax + dx * t), point[1] - (ay + dy * t)));
  }
  return best;
}

function roadPolylineLength(pts: WallPoint[]): number {
  return pathLength(pts.map((point) => [point.x, point.y]));
}

function pointAlong(pts: [number, number][], dist: number): [number, number, number] | null {
  let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    if (run + len >= dist) {
      const f = len > 0 ? (dist - run) / len : 0;
      return [ax + (bx - ax) * f, ay + (by - ay) * f, Math.atan2(by - ay, bx - ax)];
    }
    run += len;
  }
  return null;
}

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

/** Cổng thành dạng nhà cổng + hai tháp, xoay theo hướng đường ra ngoài. */
function drawCityGate(
  ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, main: boolean,
): void {
  const s = Math.max(5, (main ? 17 : 13) * scale);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(22,20,17,0.78)";
  ctx.fillRect(-s * 0.75, -s * 0.56, s * 1.5, s * 1.12);
  ctx.fillStyle = main ? "#d6c9a5" : "#aaa193";
  ctx.fillRect(-s * 0.68, -s * 0.5, s * 0.42, s);
  ctx.fillRect(s * 0.26, -s * 0.5, s * 0.42, s);
  ctx.fillStyle = "#443d33";
  ctx.fillRect(-s * 0.18, -s * 0.48, s * 0.36, s * 0.96);
  ctx.restore();
}

/**
 * Các kỳ quan không được vẽ như một ô nhà xám. Đây là silhouette bản đồ,
 * không ảnh hưởng hit-box/quy tắc xây dựng của công trình bên dưới.
 */
function drawLandmark(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, s: number, group = ""): void {
  const key = name.toLowerCase();
  ctx.save();
  ctx.fillStyle = "rgba(8,10,14,0.38)";
  ctx.fillRect(x + s * 0.06, y + s * 0.08, s, s);

  if (group === "Thị trấn phụ") {
    // Một cụm mái nhà, chợ và kho: khác hẳn silhouette của pháo đài/kỳ quan.
    ctx.fillStyle = "#9a835c";
    ctx.fillRect(x + s * 0.14, y + s * 0.51, s * 0.68, s * 0.25);
    ctx.fillStyle = "#75503e";
    for (const [ox, oy] of [[0.11, 0.39], [0.35, 0.30], [0.59, 0.40]]) {
      ctx.beginPath();
      ctx.moveTo(x + s * ox, y + s * (oy + 0.16));
      ctx.lineTo(x + s * (ox + 0.13), y + s * oy);
      ctx.lineTo(x + s * (ox + 0.26), y + s * (oy + 0.16));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#c8a551";
    ctx.fillRect(x + s * 0.42, y + s * 0.57, s * 0.16, s * 0.20);
  } else if (group === "Thành trì phụ") {
    // Cứ điểm chư hầu: thành thấp, tháp góc và cổng chính.
    ctx.fillStyle = "#a69e90";
    ctx.fillRect(x + s * 0.16, y + s * 0.38, s * 0.68, s * 0.42);
    ctx.fillStyle = "#5c5a58";
    for (const [ox, oy] of [[0.10, 0.20], [0.68, 0.20]]) ctx.fillRect(x + s * ox, y + s * oy, s * 0.22, s * 0.42);
    ctx.fillStyle = "#322f2c";
    ctx.fillRect(x + s * 0.43, y + s * 0.60, s * 0.14, s * 0.20);
  } else if (key.includes("red keep") || key.includes("aegonfort")) {
    ctx.fillStyle = key.includes("aegonfort") ? "#8b6d44" : "#a35a4e";
    ctx.fillRect(x + s * 0.12, y + s * 0.30, s * 0.76, s * 0.56);
    ctx.fillStyle = "#4b3030";
    for (const [ox, oy] of [[0.08, 0.12], [0.68, 0.10], [0.12, 0.62], [0.68, 0.62]]) {
      ctx.fillRect(x + s * ox, y + s * oy, s * 0.23, s * 0.31);
    }
    ctx.fillStyle = "#291f1d";
    ctx.fillRect(x + s * 0.42, y + s * 0.58, s * 0.16, s * 0.28);
  } else if (key.includes("baelor") || key.includes("visenya")) {
    ctx.fillStyle = "#ddd4c3";
    ctx.fillRect(x + s * 0.20, y + s * 0.46, s * 0.60, s * 0.35);
    ctx.beginPath();
    ctx.arc(x + s * 0.50, y + s * 0.46, s * 0.23, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#b8d4da";
    for (let i = 0; i < 7; i++) {
      const px = x + s * (0.12 + i * 0.125);
      const h = s * (0.18 + (i % 2) * 0.08);
      ctx.fillRect(px, y + s * 0.46 - h, s * 0.055, h + s * 0.18);
    }
  } else if (key.includes("dragonpit")) {
    ctx.fillStyle = key.includes("tàn tích") ? "#696b67" : "#796c5d";
    ctx.beginPath();
    ctx.arc(x + s * 0.50, y + s * 0.59, s * 0.37, Math.PI, 0);
    ctx.lineTo(x + s * 0.87, y + s * 0.78);
    ctx.lineTo(x + s * 0.13, y + s * 0.78);
    ctx.closePath();
    ctx.fill();
    if (key.includes("tàn tích")) {
      ctx.strokeStyle = "#302f2d";
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(x + s * 0.38, y + s * 0.25);
      ctx.lineTo(x + s * 0.55, y + s * 0.58);
      ctx.lineTo(x + s * 0.48, y + s * 0.74);
      ctx.stroke();
    }
  } else if (key.includes("hightower")) {
    ctx.fillStyle = "#d2c8af";
    ctx.fillRect(x + s * 0.37, y + s * 0.16, s * 0.26, s * 0.66);
    ctx.fillStyle = "#e6d58c";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.32, y + s * 0.16);
    ctx.lineTo(x + s * 0.50, y + s * 0.02);
    ctx.lineTo(x + s * 0.68, y + s * 0.16);
    ctx.closePath();
    ctx.fill();
  } else if (key.includes("cầu") || key.includes("bức tường")) {
    ctx.strokeStyle = "#9a958c";
    ctx.lineWidth = Math.max(2, s * 0.16);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.08, y + s * 0.62);
    ctx.quadraticCurveTo(x + s * 0.50, y + s * 0.22, x + s * 0.92, y + s * 0.62);
    ctx.stroke();
  } else {
    // Kỳ quan/pháo đài khác: tháp trung tâm và các tháp góc để không lẫn với nhà dân.
    ctx.fillStyle = "#a69e90";
    ctx.fillRect(x + s * 0.16, y + s * 0.34, s * 0.68, s * 0.48);
    ctx.fillStyle = "#5c5a58";
    for (const [ox, oy] of [[0.10, 0.18], [0.68, 0.18], [0.39, 0.05]]) ctx.fillRect(x + s * ox, y + s * oy, s * 0.22, s * 0.36);
  }
  ctx.strokeStyle = "rgba(25,24,22,0.78)";
  ctx.lineWidth = Math.max(0.8, s * 0.025);
  ctx.strokeRect(x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.76);
  ctx.restore();
}

/** Icon bản đồ nhất quán, thay khối kiến trúc vuông khó đọc ở mức zoom xa. */
function drawBuildingIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, type: BuildingType): void {
  const skin = BUILDING_SKIN[type] ?? { wall: "#8d8778", roof: "#5c5f6b" };
  const cx = x + s / 2;
  const cy = y + s / 2;
  const radius = Math.max(4, s * 0.46);
  ctx.save();
  ctx.fillStyle = "rgba(6,8,11,0.42)";
  ctx.beginPath();
  ctx.arc(cx + Math.max(1, s * 0.035), cy + Math.max(1, s * 0.045), radius * 1.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.wall;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = skin.roof;
  ctx.lineWidth = Math.max(1, s * 0.045);
  ctx.stroke();
  ctx.fillStyle = "rgba(22,20,18,0.88)";
  ctx.font = `600 ${Math.max(8, s * 0.52)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(buildingMapIcon(type), cx, cy + s * 0.025);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function buildingMapIcon(type: BuildingType): string {
  if (type === "Lâu Đài" || type.includes("Pháo Đài")) return "♜";
  if (type.includes("Nông") || type.includes("Ruộng") || type.includes("Nho")) return "♧";
  if (type.includes("Mỏ") || type === "Xưởng Cưa") return "⚒";
  if (type.includes("Cảng") || type.includes("Bến") || type.includes("Tàu")) return "⚓";
  if (type.includes("Ngựa") || type.includes("Chăn Nuôi")) return "♞";
  if (type.includes("Sept") || type.includes("Học Viện")) return "✦";
  if (type.includes("Doanh Trại") || type.includes("Vũ Khí") || type.includes("Nỏ")) return "⚔";
  if (type.includes("Chợ") || type.includes("Quán")) return "¤";
  if (type.includes("Nhà") || type.includes("Phố")) return "⌂";
  if (type.includes("Kho")) return "▣";
  if (type.includes("Cầu") || type.includes("Đê")) return "⌒";
  if (type.includes("Tháp") || type.includes("Mốc")) return "△";
  return "✥";
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
