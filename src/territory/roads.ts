/** Đường đi trên bản đồ Tầng 1 — gồm tuyến người chơi vạch và tuyến tự sinh có thể ẩn/xoá. */
import type { RoadLine, StatData } from "../mvu/schema";
import type { PatchOp } from "../mvu/patchEngine";
import { LOCAL_GRID_CELLS } from "../content/westeros/mapScale";
import { holdingOwnedByPlayer } from "./territoryEngine";

export interface RoadPoint { x: number; y: number }

export interface RoadResult {
  ok: boolean;
  error?: string;
  ops: PatchOp[];
  road?: RoadLine;
}

export function roadLength(points: RoadPoint[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return total;
}

export function buildRoad(
  state: StatData,
  territoryId: string,
  points: RoadPoint[],
  opts?: { name?: string; width?: number; kind?: "Đường Nhỏ" | "Đường Lớn" },
): RoadResult {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding) return { ok: false, error: "Lãnh địa không tồn tại", ops: [] };
  if (!holdingOwnedByPlayer(state, territoryId)) {
    return { ok: false, error: "Ngươi không có quyền mở đường ở đây", ops: [] };
  }
  if (points.length < 2) return { ok: false, error: "Cần ít nhất hai điểm để mở đường", ops: [] };
  if (points.some((point) => point.x < 0 || point.y < 0 || point.x > LOCAL_GRID_CELLS || point.y > LOCAL_GRID_CELLS)) {
    return { ok: false, error: "Tuyến đường vượt khỏi lưới lãnh địa", ops: [] };
  }
  if (roadLength(points) < 4) return { ok: false, error: "Tuyến đường quá ngắn", ops: [] };

  const road: RoadLine = {
    "Mã": `road-${Date.now().toString(36)}-${holding["Đường Đi"].length.toString(36)}`,
    "Tên": opts?.name?.trim() || `Đường ${holding["Đường Đi"].length + 1}`,
    "Loại": opts?.kind ?? "Đường Lớn",
    "Điểm": points.map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) })),
    "Bề Rộng": Math.max(1, Math.min(3, Math.round(opts?.width ?? 1))),
  };
  return {
    ok: true,
    road,
    ops: [{
      op: "replace",
      path: `stat_data.Lãnh Địa.${territoryId}.Đường Đi`,
      value: [...holding["Đường Đi"], road],
    }],
  };
}

/**
 * Chụp mạng đường tự sinh hiện tại đúng một lần. Những lần gọi sau là no-op nên
 * công trình mới không thể làm phát sinh thêm quan lộ/ngõ.
 */
export function freezeAutoRoads(state: StatData, territoryId: string, roads: RoadLine[]): PatchOp[] {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding || holding["Đường Tự Động Cố Định"] !== undefined) return [];
  return [{
    op: "replace",
    path: `stat_data.Lãnh Địa.${territoryId}.Đường Tự Động Cố Định`,
    value: roads,
  }];
}

export function removeRoad(state: StatData, territoryId: string, roadId: string): PatchOp[] {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding || !holdingOwnedByPlayer(state, territoryId)) return [];
  return [{
    op: "replace",
    path: `stat_data.Lãnh Địa.${territoryId}.Đường Đi`,
    value: holding["Đường Đi"].filter((road) => road["Mã"] !== roadId),
  }];
}

export function removeAutoRoad(state: StatData, territoryId: string, roadId: string): PatchOp[] {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding || !holdingOwnedByPlayer(state, territoryId) || !roadId) return [];
  return [{
    op: "replace",
    path: `stat_data.Lãnh Địa.${territoryId}.Đường Tự Động Đã Xoá`,
    value: [...new Set([...(holding["Đường Tự Động Đã Xoá"] ?? []), roadId])],
  }];
}

export function restoreAutoRoads(state: StatData, territoryId: string): PatchOp[] {
  const holding = state["Lãnh Địa"][territoryId];
  if (!holding || !holdingOwnedByPlayer(state, territoryId)) return [];
  return [{
    op: "replace",
    path: `stat_data.Lãnh Địa.${territoryId}.Đường Tự Động Đã Xoá`,
    value: [],
  }];
}
