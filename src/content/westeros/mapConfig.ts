// content/westeros/mapConfig.ts
// ============================================================================
// CẤU HÌNH BẢN ĐỒ (9.6.2) — "cắm ảnh vào là chạy". Trong lúc chưa có ảnh thật,
// dùng placeholder (nền gradient trầm + phác thảo SVG bờ biển). Thay ảnh thật:
// đặt file vào assetUrl + cập nhật width/height ở đây — KHÔNG sửa code engine.
// ============================================================================
import { MAP_W, MAP_H } from "./regions";

export interface MapConfig {
  /** Kích thước ảnh gốc (px) — mọi toạ độ polygon/marker tính theo hệ này. */
  width: number;
  height: number;
  /** URL ảnh nền; null = dùng placeholder SVG dựng sẵn (9.1). */
  assetUrl: string | null;
  /** Giới hạn zoom cho pan/zoom (9.4). */
  minZoom: number;
  maxZoom: number;
}

export const MAP_CONFIG: MapConfig = {
  width: MAP_W,
  height: MAP_H,
  assetUrl: null, // chưa có ảnh thật → placeholder
  // The canvas now contains the known world, not only Westeros.
  minZoom: 0.12,
  maxZoom: 5,
};
