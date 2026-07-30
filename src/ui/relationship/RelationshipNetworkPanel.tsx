/**
 * RelationshipNetworkPanel — Mạng Lưới Quan Hệ Nhân Vật & Gia Tộc.
 * 
 * Hiển thị sơ đồ mạng lưới lực/quỹ đạo (Orbital Force Graph) biểu diễn mối quan hệ
 * giữa Người Chơi, các NPC Chính, Thành Viên Gia Tộc, và các Đại Gia Tộc Westeros.
 * Hỗ trợ zoom/pan, kéo thả node, lọc theo phe/thái độ, và xem inspector chi tiết.
 */
import { useState, useMemo, useRef, useCallback } from "react";
import { useMvuStore } from "../../state/mvuStore";
import { HOUSE_ID_BY_SCHEMA } from "../../territory/territoryEngine";
import { houseColor } from "../../content/westeros/houseColors";
import { affinityStage, type Npc } from "../../mvu/npcSchema";
import { GlassButton } from "../components/GlassButton";
import { GlassSelect } from "../components/GlassSelect";
import { TradeDialog } from "../economy/TradeDialog";
import { TALENTS_BY_ID } from "../../content/westeros/talents";
import { getRelationshipEdges, getRelationshipPeople, relationTone, relationshipCounterparty } from "./relationshipData";
import {
  IconX, IconUsers, IconCrown, IconAlert,
  IconCrossedSwords, IconRefresh, IconSearch,
} from "../icons";

interface NodeData {
  id: string;
  name: string;
  type: "player" | "family" | "npc" | "house";
  house?: string;
  role?: string;
  affinity: number; // -100 to 100
  trust: number; // -100 to 100
  relationStage?: string;
  relationTypes?: string[];
  betrayalRisk?: boolean;
  intimacy?: boolean;
  relationshipTone?: LinkData["type"];
  npcData?: Npc;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LinkData {
  source: string;
  target: string;
  type: "alliance" | "family" | "enemy" | "intimate" | "duty" | "neutral" | "house";
  strength: number; // 0 to 1
  label?: string;
}

const RELATIONSHIP_CLUSTERS: Array<{
  type: Exclude<LinkData["type"], "house">;
  label: string;
  x: number;
  y: number;
  height?: number;
  labelOffset?: number;
}> = [
  { type: "family", label: "Gia đình", x: 250, y: 130 },
  { type: "alliance", label: "Đồng minh", x: 600, y: 125 },
  { type: "duty", label: "Ràng buộc", x: 950, y: 130 },
  { type: "intimate", label: "Thân mật", x: 250, y: 435 },
  { type: "neutral", label: "Chưa chạm mặt", x: 600, y: 405, height: 300, labelOffset: -125 },
  { type: "enemy", label: "Đối địch", x: 950, y: 425 },
];

function relationshipCluster(node: NodeData): Exclude<LinkData["type"], "house"> {
  if (node.relationTypes?.includes("Chưa Chạm Mặt")) return "neutral";
  const tone = node.relationshipTone ?? relationTone(node.relationTypes?.join(" · ") || "", node.affinity);
  return tone === "house" ? "neutral" : tone;
}

/** Xếp người cùng loại quan hệ thành cụm cố định thay cho quỹ đạo quanh người chơi. */
function placeRelationshipClusters(nodes: NodeData[]) {
  for (const cluster of RELATIONSHIP_CLUSTERS) {
    const members = nodes.filter((node) => node.type !== "player" && relationshipCluster(node) === cluster.type);
    const columns = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(members.length))));
    const rows = Math.ceil(members.length / columns);

    members.forEach((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      node.x = cluster.x + (column - (columns - 1) / 2) * 72;
      node.y = cluster.y + (row - (rows - 1) / 2) * 52;
    });
  }
}

function graphLabel(name: string): string {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name;
}

/** Cảnh báo nguy cơ phản trắc (13.5). */
function isBetrayalRisk(npc?: Npc): boolean {
  if (!npc) return false;
  return (
    (npc["Tính Cách"]?.["Trục Trung Thành-Phản Trắc"] ?? 0) <= -20 ||
    (npc["Độ Hảo Cảm"] ?? 0) < -10 ||
    (npc["Nét Tính Cách"] ?? []).some((t) => /phản|xảo|bội/i.test(t))
  );
}

/** Màu cho mối quan hệ */
function getLinkColor(type: LinkData["type"]) {
  switch (type) {
    case "intimate": return "#ec4899"; // Pink
    case "alliance": return "#10b981"; // Emerald
    case "family": return "#f59e0b"; // Amber/Gold
    case "enemy": return "#ef4444"; // Red/Crimson
    case "duty": return "#38bdf8"; // Sky / chain of command
    case "house": return "#6366f1"; // Indigo
    default: return "#4b5563"; // Muted Slate
  }
}

export function RelationshipNetworkPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stat = useMvuStore((s) => s.stat);

  // Filters & State
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterHouse, setFilterHouse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tradeTargetId, setTradeTargetId] = useState<string | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Canvas ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Raw NPC extraction
  const mainNpcs = stat["Mối Quan Hệ"]?.["NPC Chính"] ?? {};
  const familyNpcs = stat["Mối Quan Hệ"]?.["Thành Viên Gia Tộc"] ?? {};
  const playerInfo = stat["Thông Tin Nhân Vật"];
  const playerName = playerInfo?.["Họ Tên"] || "Chủ Nhân";
  const playerHouse = playerInfo?.["Nhà"] || "Stark";
  const relationshipEdges = useMemo(
    () => getRelationshipEdges(getRelationshipPeople(stat), playerName),
    [stat, playerName],
  );

  // Build Graph Nodes & Links
  const { nodes, links, houseList } = useMemo(() => {
    const nodeList: NodeData[] = [];
    const linkList: LinkData[] = [];
    const housesSet = new Set<string>();

    // Người chơi là điểm tham chiếu ở bên trái; các cụm quan hệ nằm ở phần còn lại
    // của khung để sơ đồ không còn là một bánh xe xoay quanh người chơi.
    nodeList.push({
      id: "player",
      name: playerName,
      type: "player",
      house: playerHouse,
      role: "Lãnh Chúa / Người Chơi",
      affinity: 100,
      trust: 100,
      x: 85,
      y: 300,
      vx: 0,
      vy: 0,
    });
    if (playerHouse) housesSet.add(playerHouse);

    // Collect all NPCs
    const allNpcEntries: [string, Npc, "family" | "npc"][] = [
      ...Object.entries(familyNpcs).map(([n, npc]) => [n, npc, "family"] as [string, Npc, "family"]),
      ...Object.entries(mainNpcs).map(([n, npc]) => [n, npc, "npc"] as [string, Npc, "npc"]),
    ];
    const playerEdgeByNodeId = new Map(
      relationshipEdges
        .filter((edge) => edge.sourceId === "player" && edge.targetId)
        .map((edge) => [edge.targetId!, edge]),
    );

    allNpcEntries.forEach(([name, npc, category]) => {
      const house = npc["Nhà"] || "Vô Danh";
      if (house && house !== "Vô Danh") housesSet.add(house);

      const nodeId = `npc_${name}`;
      const playerEdge = playerEdgeByNodeId.get(nodeId);
      const affinity = playerEdge?.affinity ?? npc["Độ Hảo Cảm"] ?? 0;
      const trust = playerEdge?.trust ?? npc["Tin Cậy"] ?? 0;
      const relationTypes = playerEdge?.label
        ? playerEdge.label.split(" · ")
        : Array.isArray(npc["Loại Quan Hệ"])
          ? npc["Loại Quan Hệ"]
          : typeof npc["Loại Quan Hệ"] === "string" ? [npc["Loại Quan Hệ"]] : [];
      const stage = relationTypes.includes("Chưa Chạm Mặt")
        ? "Chưa Chạm Mặt"
        : affinityStage(affinity);
      const intimacy = !!npc["Quan Hệ Thân Mật"] || relationTypes.some((type) => /tình nhân|người tình|thiếp|người yêu/i.test(type));
      const betrayal = isBetrayalRisk(npc);
      const playerRelationTone = playerEdge?.tone ?? relationTone(relationTypes.join(" · "), affinity);
      nodeList.push({
        id: nodeId,
        name,
        type: category,
        house,
        role: npc["Chức Vụ"] || (category === "family" ? "Gia Tộc" : "NPC"),
        affinity,
        trust,
        relationStage: stage,
        relationTypes,
        betrayalRisk: betrayal,
        intimacy,
        relationshipTone: playerRelationTone,
        npcData: npc,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });

      // Không vẽ dây nối cho người chưa từng chạm mặt: chúng vẫn nằm trong cụm
      // riêng, nhưng không tạo một mạng hình tia giả tạo từ người chơi.
      if (playerEdge?.label !== "Chưa Chạm Mặt") {
        linkList.push({
          source: "player",
          target: nodeId,
          type: playerRelationTone,
          strength: Math.min(1, Math.abs(affinity) / 100 + 0.3),
          label: playerEdge?.label || stage,
        });
      }
    });

    placeRelationshipClusters(nodeList);

    // Liên kết NPC-NPC được hợp nhất từ mạng NPC, gia phả, hôn nhân và hôn ước.
    // Nhờ vậy sơ đồ không bỏ sót những quan hệ chỉ được ghi ở hồ sơ nhân vật.
    for (const edge of relationshipEdges) {
      if (edge.sourceId === "player" || !edge.targetId || edge.sourceId === edge.targetId) continue;
      if (!nodeList.some((node) => node.id === edge.sourceId || node.id === edge.targetId)) continue;
      const exists = linkList.some((link) =>
        (link.source === edge.sourceId && link.target === edge.targetId)
        || (link.source === edge.targetId && link.target === edge.sourceId),
      );
      if (exists) continue;
      linkList.push({
        source: edge.sourceId,
        target: edge.targetId,
        type: relationTone(edge.label, edge.affinity),
        strength: Math.min(1, Math.abs(edge.affinity) / 100 + 0.2),
        label: `${edge.label}${edge.isPublic ? "" : " · Bí mật"}`,
      });
    }

    return {
      nodes: nodeList,
      links: linkList,
      houseList: Array.from(housesSet),
    };
  }, [mainNpcs, familyNpcs, playerName, playerHouse, relationshipEdges]);

  // Node position map (for dragged positions)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Filtered Nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type === "player") return true;

      // Group Filter
      if (filterGroup === "allies" && n.affinity < 15 && !["Sống Chết Có Nhau", "Tri Kỷ", "Thân Thiết"].includes(n.relationStage || "")) return false;
      if (filterGroup === "enemies" && n.affinity > -10 && !n.betrayalRisk) return false;
      if (filterGroup === "family" && n.type !== "family" && !n.relationTypes?.includes("Người Thân")) return false;
      if (filterGroup === "intimate" && !n.intimacy) return false;
      if (filterGroup === "betrayal" && !n.betrayalRisk) return false;

      // House Filter
      if (filterHouse !== "all" && n.house !== filterHouse) return false;

      // Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return n.name.toLowerCase().includes(q) || (n.house && n.house.toLowerCase().includes(q));
      }

      return true;
    });
  }, [nodes, filterGroup, filterHouse, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered Links
  const filteredLinks = useMemo(() => {
    return links.filter((l) => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target));
  }, [links, filteredNodeIds]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let allies = 0;
    let enemies = 0;
    let family = 0;
    let betrayal = 0;

    nodes.forEach((n) => {
      if (n.type === "player") return;
      if (n.affinity >= 15) allies++;
      if (n.affinity <= -15) enemies++;
      if (n.type === "family") family++;
      if (n.betrayalRisk) betrayal++;
    });

    return { total: nodes.length - 1, allies, enemies, family, betrayal };
  }, [nodes]);

  // Selected Node Data
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);
  const selectedRelationships = useMemo(() => selectedNode
    ? relationshipEdges.filter((edge) => edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id)
    : [], [selectedNode, relationshipEdges]);

  // Mouse Handlers for Pan & Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).id === "graph-bg") {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingNodeId && dragOffset) {
      const container = containerRef.current;
      if (!container) return;
      
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const rawX = (clientX - rect.left - pan.x) / zoom;
        const rawY = (clientY - rect.top - pan.y) / zoom;

        setNodePositions((prev) => ({
          ...prev,
          [draggingNodeId]: { x: rawX - dragOffset.x, y: rawY - dragOffset.y },
        }));
      });
    }
  }, [isPanning, startPan, draggingNodeId, dragOffset, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPanning(false);
    setDraggingNodeId(null);
    setDragOffset(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  }, []);

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodePositions({});
    setSelectedNodeId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[rgba(6,9,14,0.85)] backdrop-blur-xl animate-fade-in">
      <div className="relative flex h-[94vh] w-[96vw] max-w-7xl flex-col overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[rgba(12,16,23,0.92)] shadow-2xl">
        
        {/* ---- HEADER BAR ---- */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] bg-[rgba(18,24,35,0.7)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(16,185,129,0.15)] text-[#10b981] border border-[rgba(16,185,129,0.3)]">
              <IconUsers size={20} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--text-bright)] tracking-wide">
                Mạng Lưới Quan Hệ & Trung Thành
              </h2>
              <p className="text-[11px] text-[var(--text-faint)]">
                Theo dõi tương tác, mức độ tin cậy và ân oán với {metrics.total} nhân vật Westeros
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.1)] px-2.5 py-1 text-[11px] font-medium text-[#10b981]">
              Đồng Minh: {metrics.allies}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.1)] px-2.5 py-1 text-[11px] font-medium text-[#f59e0b]">
              <IconCrown size={12} /> Gia Tộc: {metrics.family}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] px-2.5 py-1 text-[11px] font-medium text-[#ef4444]">
              <IconCrossedSwords size={12} /> Kẻ Thù: {metrics.enemies}
            </span>
            {metrics.betrayal > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.15)] px-2.5 py-1 text-[11px] font-medium text-[#f43f5e] animate-pulse">
                <IconAlert size={12} /> Nguy Cơ Phản: {metrics.betrayal}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-bright)]"
            aria-label="Đóng"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ---- FILTER CONTROLS BAR ---- */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] bg-[rgba(10,13,19,0.5)] px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Group Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] p-1">
              {[
                { id: "all", label: "Tất Cả" },
                { id: "allies", label: "Đồng Minh" },
                { id: "family", label: "Gia Tộc" },
                { id: "intimate", label: "Ái Thân" },
                { id: "enemies", label: "Thù Địch" },
                { id: "betrayal", label: "Nguy Cơ Phản" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterGroup(tab.id)}
                  className={`rounded-md px-2.5 py-1 transition text-[11px] font-medium ${
                    filterGroup === tab.id
                      ? "bg-[var(--primary-color)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-bright)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* House Select */}
            <div className="w-36">
              <GlassSelect
                value={filterHouse}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterHouse(e.target.value)}
              >
                <option value="all">Mọi Gia Tộc</option>
                {houseList.map((h) => (
                  <option key={h} value={h}>Nhà {h}</option>
                ))}
              </GlassSelect>
            </div>
          </div>

          {/* Search & Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <IconSearch size={14} className="absolute left-2.5 text-[var(--text-faint)] pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên nhân vật..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.4)] pl-8 pr-3 py-1 text-xs text-[var(--text-bright)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--primary-color)]"
              />
            </div>

            <GlassButton onClick={handleResetView} title="Căn lại vị trí & Thu phóng">
              <IconRefresh size={14} /> Reset
            </GlassButton>
          </div>
        </div>

        {/* Danh bạ luôn hiện: sơ đồ tốt để nhìn tổng thể, nhưng danh bạ giúp
            người chơi biết ngay đang có ai và vai trò của họ. */}
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-[var(--glass-border)] bg-[rgba(7,10,15,0.45)] px-4 py-2">
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Danh bạ</span>
          {filteredNodes.filter((node) => node.type !== "player").map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition-colors ${
                selectedNodeId === node.id
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                  : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--glass-border-bright)] hover:text-[var(--text-soft)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${node.type === "family" ? "bg-amber-300" : node.affinity < -15 ? "bg-red-400" : "bg-emerald-400"}`} />
              {node.name}
              <span className="text-[var(--text-faint)]">· {node.role}</span>
            </button>
          ))}
          {filteredNodes.length === 1 && <span className="text-[11px] italic text-[var(--text-faint)]">Chưa có nhân vật phù hợp.</span>}
        </div>

        {/* ---- CANVAS & INSPECTOR BODY ---- */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          
          {/* SVG NETWORK GRAPH CANVAS */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="relative h-full w-full cursor-grab active:cursor-grabbing select-none overflow-hidden bg-radial from-[rgba(18,24,36,0.6)] to-[rgba(6,9,14,0.95)]"
          >
            <svg
              id="graph-bg"
              className="h-full w-full"
              viewBox="0 0 1200 600"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Vùng gom cụm: cùng loại quan hệ luôn có một vị trí rõ ràng. */}
                {RELATIONSHIP_CLUSTERS.map((cluster) => {
                  const color = getLinkColor(cluster.type);
                  const height = cluster.height ?? 176;
                  return (
                    <g key={cluster.type} className="pointer-events-none">
                      <rect
                        x={cluster.x - 164}
                        y={cluster.y - height / 2}
                        width={328}
                        height={height}
                        rx={18}
                        fill={`${color}08`}
                        stroke={`${color}30`}
                        strokeDasharray="5 6"
                      />
                      <text
                        x={cluster.x}
                        y={cluster.y + (cluster.labelOffset ?? -68)}
                        textAnchor="middle"
                        fill={`${color}bb`}
                        fontSize={10}
                        fontWeight="600"
                        className="uppercase tracking-wider"
                      >
                        {cluster.label}
                      </text>
                    </g>
                  );
                })}

                {/* LINKS / EDGES */}
                {filteredLinks.map((link, idx) => {
                  const srcNode = filteredNodes.find((n) => n.id === link.source);
                  const tgtNode = filteredNodes.find((n) => n.id === link.target);
                  if (!srcNode || !tgtNode) return null;

                  const srcPos = nodePositions[srcNode.id] || { x: srcNode.x, y: srcNode.y };
                  const tgtPos = nodePositions[tgtNode.id] || { x: tgtNode.x, y: tgtNode.y };

                  const color = getLinkColor(link.type);
                  const isSelected = selectedNodeId === srcNode.id || selectedNodeId === tgtNode.id;

                  return (
                    <g key={`link_${idx}`}>
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        stroke={color}
                        strokeWidth={isSelected ? 2.5 : Math.max(1, link.strength * 2)}
                        strokeOpacity={isSelected ? 0.9 : link.type === "enemy" ? 0.28 : 0.18}
                        strokeDasharray={link.type === "enemy" ? "4 4" : undefined}
                      />
                    </g>
                  );
                })}

                {/* NODES */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                  const isPlayer = node.type === "player";
                  const isSelected = selectedNodeId === node.id;
                  const houseId = node.house ? HOUSE_ID_BY_SCHEMA[node.house] ?? node.house.toLowerCase() : "";
                  const col = houseColor(houseId);

                  // Size & Radius
                  const radius = isPlayer ? 24 : node.intimacy || node.type === "family" ? 20 : 16;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingNodeId(node.id);
                        const container = containerRef.current;
                        if (container) {
                          const rect = container.getBoundingClientRect();
                          const mouseX = (e.clientX - rect.left - pan.x) / zoom;
                          const mouseY = (e.clientY - rect.top - pan.y) / zoom;
                          setDragOffset({ x: mouseX - pos.x, y: mouseY - pos.y });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <g className="transition-transform duration-150 hover:scale-110">
                        {/* Active/Selected Ring Glow */}
                        {isSelected && (
                          <circle
                            r={radius + 6}
                            fill="none"
                            stroke={col.base}
                            strokeWidth={2}
                            className="animate-ping opacity-75"
                          />
                        )}

                        {/* Betrayal Warning Pulse Ring */}
                        {node.betrayalRisk && !isPlayer && (
                          <circle
                            r={radius + 4}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                          />
                        )}

                        {/* Node Body Circle */}
                        <circle
                          r={radius}
                          fill={isPlayer ? "rgba(16,185,129,0.3)" : `${col.base}33`}
                          stroke={isPlayer ? "#10b981" : col.base}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          className="shadow-lg"
                        />

                        {/* Node Label Initial */}
                        <text
                          textAnchor="middle"
                          dy="0.35em"
                          fill={col.light || "#ffffff"}
                          fontSize={isPlayer ? 14 : 12}
                          fontWeight="bold"
                          className="pointer-events-none font-display"
                        >
                          {isPlayer ? "P" : node.name.charAt(0).toUpperCase()}
                        </text>

                        {/* Name Badge Label underneath */}
                        <g transform={`translate(0, ${radius + 14})`}>
                          <title>{node.name}</title>
                          <rect
                            x={-Math.min(graphLabel(node.name).length * 3.5 + 6, 48)}
                            y={-9}
                            width={Math.min(graphLabel(node.name).length * 7 + 12, 96)}
                            height={16}
                            rx={8}
                            fill="rgba(10,14,20,0.85)"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={0.5}
                          />
                          <text
                            textAnchor="middle"
                            fill="rgba(240,230,210,0.9)"
                            fontSize={10}
                            className="pointer-events-none"
                          >
                            {graphLabel(node.name)}
                          </text>
                        </g>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* ---- FLOATING INSPECTOR SIDEBAR ---- */}
          {selectedNode && (
            <div className="absolute right-3 top-3 bottom-3 w-80 max-w-[90vw] overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[rgba(12,16,24,0.95)] p-4 shadow-2xl backdrop-blur-2xl animate-slide-in">
              <div className="flex items-start justify-between border-b border-[var(--glass-border)] pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold border shadow-md"
                    style={{
                      backgroundColor: `${houseColor(selectedNode.house ? HOUSE_ID_BY_SCHEMA[selectedNode.house] || selectedNode.house : "").base}33`,
                      borderColor: houseColor(selectedNode.house ? HOUSE_ID_BY_SCHEMA[selectedNode.house] || selectedNode.house : "").base,
                      color: houseColor(selectedNode.house ? HOUSE_ID_BY_SCHEMA[selectedNode.house] || selectedNode.house : "").light,
                    }}
                  >
                    {selectedNode.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--text-bright)]">
                      {selectedNode.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {selectedNode.house ? `Nhà ${selectedNode.house}` : "Vô Danh"}
                      {selectedNode.role ? ` · ${selectedNode.role}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="rounded p-1 text-[var(--text-faint)] hover:text-[var(--text-bright)]"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Status Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {selectedNode.relationStage && (
                  <span className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-bright)] border border-[var(--glass-border)]">
                    {selectedNode.relationStage}
                  </span>
                )}
                {selectedNode.intimacy && (
                  <span className="rounded bg-[rgba(236,72,153,0.15)] px-2 py-0.5 text-[11px] font-medium text-[#ec4899] border border-[rgba(236,72,153,0.3)]">
                    Ái Thân
                  </span>
                )}
                {selectedNode.betrayalRisk && (
                  <span className="rounded bg-[rgba(239,68,68,0.2)] px-2 py-0.5 text-[11px] font-medium text-[#ef4444] border border-[rgba(239,68,68,0.4)] animate-pulse">
                    Nguy Cơ Phản Trắc
                  </span>
                )}
              </div>

              {/* Stat Progress Bars */}
              {selectedNode.type !== "player" && (
                <div className="mt-4 space-y-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] p-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">Độ Hảo Cảm</span>
                      <span className={selectedNode.affinity >= 0 ? "text-[#10b981] font-semibold" : "text-[#ef4444] font-semibold"}>
                        {selectedNode.affinity > 0 ? `+${selectedNode.affinity}` : selectedNode.affinity} / 100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (selectedNode.affinity + 100) / 2))}%`,
                          backgroundColor: selectedNode.affinity >= 0 ? "#10b981" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">Tin Cậy</span>
                      <span className="text-[#3b82f6] font-semibold">
                        {selectedNode.trust} / 100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
                      <div
                        className="h-full bg-[#3b82f6] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, (selectedNode.trust + 100) / 2))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type !== "player" && selectedRelationships.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                    Liên Kết & Vai Vế
                  </h4>
                  <div className="space-y-1.5">
                    {selectedRelationships.map((edge) => {
                      const counterparty = relationshipCounterparty(edge, selectedNode.id, playerName);
                      const targetId = edge.sourceId === selectedNode.id
                        ? edge.targetId
                        : edge.sourceId !== "player" ? edge.sourceId : undefined;
                      const color = getLinkColor(edge.tone);
                      return (
                        <div key={edge.id} className="rounded-md border border-[var(--glass-border)] bg-[rgba(0,0,0,0.2)] px-2.5 py-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {targetId ? (
                              <button
                                type="button"
                                onClick={() => setSelectedNodeId(targetId)}
                                className="font-medium text-[var(--text-soft)] hover:text-[var(--accent-text)]"
                              >
                                {counterparty}
                              </button>
                            ) : <span className="font-medium text-[var(--text-soft)]">{counterparty}</span>}
                            <span className="rounded border px-1.5 py-0.5 text-[9px]" style={{ color, borderColor: `${color}66`, backgroundColor: `${color}18` }}>
                              {edge.label}
                            </span>
                            {!edge.isPublic && <span className="text-[9px] text-red-300">Bí mật</span>}
                            {edge.inferred && <span className="text-[9px] text-[var(--text-faint)]">gia phả</span>}
                          </div>
                          {(edge.detail || edge.affinity !== 0 || edge.trust !== 0) && (
                            <p className="mt-1 leading-relaxed text-[var(--text-faint)]">
                              {edge.detail || `Hảo cảm ${edge.affinity >= 0 ? "+" : ""}${edge.affinity} · Tin cậy ${edge.trust >= 0 ? "+" : ""}${edge.trust}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personality Traits & Details */}
              {selectedNode.npcData && (
                <div className="mt-4 space-y-3">
                  {selectedNode.npcData["Nét Tính Cách"]?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">
                        Nét Tính Cách
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.npcData["Nét Tính Cách"].map((trait, i) => (
                          <span key={i} className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-xs text-[var(--text-muted)] border border-[rgba(255,255,255,0.08)]">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intimacy Details if present */}
                  {selectedNode.npcData["Quan Hệ Thân Mật"] && (() => {
                    const intimacy = selectedNode.npcData["Quan Hệ Thân Mật"];
                    const isSpouse = ["Vợ", "Hôn Thê"].includes(intimacy["Vai Trò"]);
                    if (!isSpouse && (intimacy["Số Lần Ân Ái"] ?? 0) === 0) return null;
                    
                    return (
                      <div className="rounded-lg border border-[rgba(236,72,153,0.3)] bg-[rgba(236,72,153,0.08)] p-2.5 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-[#ec4899] font-medium">
                          Thông Tin Ân Ái
                        </div>
                        <p className="text-[var(--text-muted)]">
                          Vai Trò: <span className="text-[var(--text-bright)]">{intimacy["Vai Trò"]}</span>
                        </p>
                        {intimacy["Số Lần Ân Ái"] > 0 && (
                          <p className="text-[var(--text-muted)]">
                            Số Lần Ân Ái: <span className="text-[var(--text-bright)]">{intimacy["Số Lần Ân Ái"]}</span>
                          </p>
                        )}
                        {intimacy["Đang Mang Thai"] && (
                          <p className="text-[#f43f5e] font-semibold">
                            [Mang Thai] (Tháng {intimacy["Tháng Thai Kỳ"] ?? 1})
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Memory Logs */}
                  {selectedNode.npcData["Ký Ức"]?.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">
                        Ký Ức Gần Đây
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedNode.npcData["Ký Ức"].slice(-3).map((mem, i) => (
                          <div key={i} className="rounded bg-[rgba(0,0,0,0.3)] p-2 text-xs border border-[var(--glass-border)]">
                            <div className="flex justify-between text-[10px] text-[var(--text-faint)] mb-0.5">
                              <span>Ngày {mem["Ngày"]}/{mem["Tháng"]}{mem["Năm"] !== undefined ? `/${mem["Năm"]} AC` : ""}</span>
                              <span className="text-[#10b981]">{mem["Cảm Xúc"]}</span>
                            </div>
                            <p className="text-[var(--text-muted)] leading-relaxed">
                              {mem["Sự Việc"]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}



                  {/* Chỉ Số Cốt Lõi (RPG Stats) */}
                  {selectedNode.npcData["Chỉ Số Cốt Lõi"] && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                         Chỉ Số Cá Nhân
                      </h4>
                      <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-[11px] mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Sức Mạnh</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Sức Mạnh"] ?? 10}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Nhanh Nhẹn</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Nhanh Nhẹn"] ?? 10}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Thể Chất</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Thể Chất"] ?? 10}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Trí Tuệ</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Trí Tuệ"] ?? 10}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Tinh Tường</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Tinh Tường"] ?? 10}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-muted)]">Uy Tín</span>
                          <span className="font-semibold text-[var(--text-bright)]">{selectedNode.npcData["Chỉ Số Cốt Lõi"]["Uy Tín"] ?? 10}</span>
                        </div>
                      </div>
                      
                      {/* Thiên Phú */}
                      {selectedNode.npcData["Thiên Phú"] && selectedNode.npcData["Thiên Phú"].length > 0 && (
                        <div className="text-[11px] text-[var(--text-muted)] mb-2">
                          {selectedNode.npcData["Thiên Phú"].map((tId: string) => {
                            const t = TALENTS_BY_ID[tId];
                            return t ? t.name : tId;
                          }).join(" · ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Kỹ Năng */}
                  {selectedNode.npcData["Kỹ Năng"] && Object.keys(selectedNode.npcData["Kỹ Năng"]).length > 0 && (
                    <div className="border-t border-[var(--glass-border)] pt-2">
                      <h4 className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider mb-1.5">
                        Kỹ Năng
                      </h4>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {Object.entries(selectedNode.npcData["Kỹ Năng"]).map(([k, v]) => (
                          <span key={k} className="rounded bg-[var(--glass-border)]/20 px-1.5 py-0.5 text-[var(--text-muted)] border border-[var(--glass-border)]">
                            {k}: <span className="font-medium text-[var(--text-bright)]">{v as number}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {tradeTargetId && (
        <TradeDialog
          open={!!tradeTargetId}
          onClose={() => setTradeTargetId(null)}
          npcId={tradeTargetId}
        />
      )}
    </div>
  );
}
