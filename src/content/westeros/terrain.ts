// content/westeros/terrain.ts
// ============================================================================
// ĐỊA HÌNH THEO VÙNG (dùng chung 3 tầng bản đồ). Địa hình KHÔNG phải trang trí:
// - Tầng 1: là "thềm đỡ" — quyết định ô nào đặt được công trình / mọc được
//   điểm tài nguyên, tránh nhà mọc giữa biển hay mỏ nằm trên đồng lúa.
// - Tầng 2/3: giữ NGUYÊN vùng đó, chỉ gom cụm lại (Rừng Sói, Hẻm Núi...).
// Nguyên tắc: địa hình vi mô là HÌNH CHIẾU của địa hình vĩ mô (region.terrain),
// nên cùng 1 lãnh địa luôn sinh ra cùng 1 bản đồ địa hình — xem territory/localTerrain.ts.
// ============================================================================
import type { Terrain } from "../../mvu/schema";
import type { ResourceKey } from "./buildings";

/** Địa hình Tầng 1 = địa hình chiến thuật (schema) + mặt nước mở. */
export type LocalTerrain = Terrain | "Biển";

export interface TerrainTrait {
  label: string;
  /** màu nền khối địa hình trên bản đồ Tầng 1/2. */
  fill: string;
  /** viền/vân — dùng cho lớp phủ nhẹ. */
  edge: string;
  /** đặt được công trình lên không (mặt nước & vách đá thì không). */
  buildable: boolean;
  /** mặt nước — Bến Cảng phải kề, bộ binh không đi qua. */
  water: boolean;
  /** hệ số chi phí di chuyển (chiến thuật Tầng 1 + hành quân Tầng 2). */
  moveCost: number;
  /** sản lượng nền cộng thêm mỗi tháng cho MỖI KHỐI địa hình loại này. */
  perBlockYield?: Partial<Record<ResourceKey, number>>;
}

export const TERRAIN_TRAITS: Record<LocalTerrain, TerrainTrait> = {
  "Đồng Bằng": {
    label: "Đồng Bằng", fill: "#4a5a3c", edge: "#5d6f4b", buildable: true, water: false, moveCost: 1,
    perBlockYield: { "Lương Thực": 14 },
  },
  "Rừng Rậm": {
    label: "Rừng Rậm", fill: "#2f4436", edge: "#3d5946", buildable: true, water: false, moveCost: 1.6,
    perBlockYield: { "Gỗ": 9 },
  },
  "Đồi Núi": {
    label: "Đồi Núi", fill: "#5a5346", edge: "#6d6455", buildable: true, water: false, moveCost: 1.9,
    perBlockYield: { "Đá": 6, "Quặng Sắt": 4 },
  },
  "Đầm Lầy": {
    label: "Đầm Lầy", fill: "#3d4a3f", edge: "#4b5a4c", buildable: true, water: false, moveCost: 2.2,
    perBlockYield: { "Lương Thực": 3 },
  },
  "Sông/Lối Vượt Sông": {
    label: "Sông", fill: "#2a4658", edge: "#37596e", buildable: false, water: true, moveCost: 3,
  },
  "Tuyết/Băng Giá": {
    label: "Băng Tuyết", fill: "#67707a", edge: "#7c8791", buildable: true, water: false, moveCost: 1.8,
  },
  "Sa Mạc": {
    label: "Sa Mạc", fill: "#7a6a4c", edge: "#8e7c5b", buildable: true, water: false, moveCost: 1.7,
  },
  "Hẻm Núi": {
    label: "Vách Núi", fill: "#4b4640", edge: "#5c5650", buildable: false, water: false, moveCost: 4,
  },
  "Thành Trì (thủ)": {
    label: "Nền Thành", fill: "#565c63", edge: "#6a7178", buildable: true, water: false, moveCost: 1,
  },
  "Biển": {
    label: "Biển", fill: "#1b3345", edge: "#264458", buildable: false, water: true, moveCost: 99,
  },
};

/** Địa hình phụ thường gặp bên trong 1 vùng có địa hình chủ đạo cho trước. */
export const SECONDARY_TERRAIN: Record<Terrain, LocalTerrain[]> = {
  "Đồng Bằng": ["Rừng Rậm", "Đồi Núi"],
  "Rừng Rậm": ["Đồi Núi", "Đầm Lầy"],
  "Đồi Núi": ["Rừng Rậm", "Hẻm Núi"],
  "Đầm Lầy": ["Rừng Rậm", "Đồng Bằng"],
  "Sông/Lối Vượt Sông": ["Đồng Bằng", "Rừng Rậm"],
  "Tuyết/Băng Giá": ["Rừng Rậm", "Đồi Núi"],
  "Sa Mạc": ["Đồi Núi", "Hẻm Núi"],
  "Hẻm Núi": ["Đồi Núi", "Rừng Rậm"],
  "Thành Trì (thủ)": ["Đồng Bằng", "Đồi Núi"],
};

/**
 * TÍNH CÁCH ĐỊA THẾ của một vùng vĩ mô — bộ tham số sinh địa hình Tầng 1.
 * Đây là dữ liệu nội dung: sửa bảng này = đổi "chất đất" của cả vùng, KHÔNG
 * phải đụng vào thuật toán sinh (territory/localTerrain.ts).
 */
export interface TerrainProfile {
  /** cộng vào độ cao nền — vùng núi thì cao hơn hẳn. */
  elevBias: number;
  /** biên độ đồi núi. */
  relief: number;
  /** cho phép sinh vách đá (Hẻm Núi) ở lõi cao. */
  cliffs: boolean;
  /** thiên hướng cây cối. */
  forest: number;
  /** thiên hướng đầm lầy / ẩm. */
  wet: number;
  /** khả năng có sông chảy qua. */
  riverChance: number;
}

export const TERRAIN_PROFILE: Record<Terrain, TerrainProfile> = {
  "Đồng Bằng": { elevBias: -0.06, relief: 0.85, cliffs: false, forest: 0.2, wet: 0, riverChance: 0.75 },
  "Rừng Rậm": { elevBias: 0.0, relief: 0.95, cliffs: false, forest: 0.42, wet: 0.08, riverChance: 0.8 },
  "Đồi Núi": { elevBias: 0.16, relief: 1.3, cliffs: true, forest: 0.14, wet: -0.05, riverChance: 0.7 },
  "Hẻm Núi": { elevBias: 0.22, relief: 1.45, cliffs: true, forest: 0.08, wet: -0.05, riverChance: 0.65 },
  "Đầm Lầy": { elevBias: -0.12, relief: 0.6, cliffs: false, forest: 0.2, wet: 0.4, riverChance: 0.95 },
  "Sông/Lối Vượt Sông": { elevBias: -0.1, relief: 0.7, cliffs: false, forest: 0.24, wet: 0.18, riverChance: 1 },
  "Tuyết/Băng Giá": { elevBias: 0.06, relief: 1.1, cliffs: true, forest: 0.22, wet: 0, riverChance: 0.6 },
  "Sa Mạc": { elevBias: 0.04, relief: 1.0, cliffs: true, forest: -0.3, wet: -0.35, riverChance: 0.12 },
  "Thành Trì (thủ)": { elevBias: 0.0, relief: 0.8, cliffs: false, forest: 0.12, wet: 0, riverChance: 0.6 },
};

/**
 * Tỉ lệ ĐẤT CANH TÁC (Đồng Bằng) mở ra quanh trọng trấn, theo địa hình vĩ mô.
 * Vùng khắc nghiệt vẫn có ruộng quanh thành — chỉ ít hơn.
 */
export const ARABLE_SHARE: Record<Terrain, number> = {
  "Đồng Bằng": 0.55,
  "Sông/Lối Vượt Sông": 0.5,
  "Rừng Rậm": 0.3,
  "Đồi Núi": 0.25,
  "Đầm Lầy": 0.2,
  "Tuyết/Băng Giá": 0.2,
  "Hẻm Núi": 0.15,
  "Sa Mạc": 0.12,
  "Thành Trì (thủ)": 0.35,
};

export function terrainTrait(t: LocalTerrain): TerrainTrait {
  return TERRAIN_TRAITS[t] ?? TERRAIN_TRAITS["Đồng Bằng"];
}

export function isWater(t: LocalTerrain): boolean {
  return terrainTrait(t).water;
}

export function isBuildable(t: LocalTerrain): boolean {
  return terrainTrait(t).buildable;
}
