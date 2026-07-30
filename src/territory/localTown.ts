/**
 * localTown — HÌNH HÀI CỦA THÀNH TRÌ trên bản đồ Tầng 1.
 *
 * Thành không phải bàn cờ: tường thành méo theo địa thế (bo quanh khúc sông,
 * lùi lại trước vách dốc), vài trục lộ lớn nối cổng vào trung tâm, còn lại là
 * mạng ngõ nhỏ lệch lạc bám theo khu nhà — dáng của một nơi được xây dần qua
 * nhiều đời chứ không quy hoạch một lần. Cầu chỉ mọc ở chỗ đường thật sự cắt
 * sông, không cần đối xứng.
 *
 * Toàn bộ suy ra TẤT ĐỊNH từ hạt giống địa hình + danh sách công trình, nên
 * không tốn một byte nào trong save và không bao giờ lệch với địa hình bên dưới.
 */
import { LOCAL_CENTER_CELL, LOCAL_GRID_CELLS } from "../content/westeros/mapScale";
import { isWater, isBuildable } from "../content/westeros/terrain";
import { terrainAtCell, sampleField, type LocalTerrainMap } from "./localTerrain";

export type Pt = [number, number];

export interface TownGate {
  at: Pt;
  /** góc hướng ra ngoài. */
  angle: number;
  /** cổng chính (đường rộng nhất dẫn vào trung tâm). */
  main: boolean;
  /** tên con đường trong lore đi qua cổng này (thành thường thì bỏ trống). */
  name?: string;
}

/** Con đường có tên đi qua thành — dựng từ bảng lore. */
export interface TownRoadSpec {
  name: string;
  /** góc rời khỏi thành (rad, y hướng xuống như canvas). */
  angle: number;
  main?: boolean;
}

export interface TownBridge {
  at: Pt;
  angle: number;
  /** bề ngang mặt sông tại chỗ bắc cầu (ô). */
  span: number;
  width: number;
}

export interface TownLayout {
  hasWall: boolean;
  /** true = bố cục lấy theo tiểu thuyết chứ không phải sinh ngẫu nhiên. */
  fromLore: boolean;
  /** đa giác khép kín của tường thành (ô lưới). */
  wall: Pt[];
  gates: TownGate[];
  /**
   * QUAN LỘ — con đường không dừng ở cổng thành mà CHẠY HẾT BẢN ĐỒ, từ mép lưới
   * bên này sang mép lưới bên kia, đúng như Vương Lộ hay Hoa Lộ trong nguyên
   * tác. Thành trì chỉ là một điểm nằm trên đường, không phải điểm cuối.
   */
  throughRoads: { name?: string; main: boolean; points: Pt[] }[];
  /** ngõ nhỏ nối khu nhà vào trục chính. */
  lanes: Pt[][];
  bridges: TownBridge[];
}

interface BuildingRect {
  x: number;
  y: number;
  size: number;
  ring: boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash1(n: number, seed: number): number {
  let h = Math.imul(n | 0, 374761393) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Nhiễu 1 chiều trơn — dùng làm biến thiên bán kính tường theo góc. */
function loopNoise(t: number, seed: number, periods: number): number {
  const p = t * periods;
  const i = Math.floor(p);
  const f = p - i;
  const s = f * f * (3 - 2 * f);
  const a = hash1(((i % periods) + periods) % periods, seed);
  const b = hash1(((i + 1) % periods + periods) % periods, seed);
  return a + (b - a) * s;
}

const cache = new Map<string, TownLayout>();

/**
 * Bố cục thành. `wallRadius` là bán kính danh nghĩa (ô) — thực tế mỗi hướng một
 * khác vì phải né nước và dốc.
 */
export function townLayout(
  map: LocalTerrainMap,
  buildings: BuildingRect[],
  opts: {
    wallRadius: number;
    hasWall: boolean;
    loreRoads?: TownRoadSpec[];
    /** Cổng có vị trí canon (không suy từ vòng tường ngẫu nhiên). */
    fixedGates?: Array<Omit<TownGate, "main"> & { main?: boolean }>;
    /**
     * Người chơi đã tự vạch tường trên bản đồ → KHÔNG sinh vành đai tự động
     * nữa. Đây là chỗ sửa lỗi "nâng cấp Lâu Đài là mất bức tường cũ": tường
     * vạch tay là dữ liệu riêng, bố cục thành không được vẽ đè lên nó.
     */
    playerWalls?: boolean;
  },
): TownLayout {
  const key = `${map.seed}|${Math.round(opts.wallRadius)}|${opts.hasWall ? 1 : 0}|${buildings.length}`
    + `|${(opts.loreRoads ?? []).map((r) => r.name).join(",")}|${(opts.fixedGates ?? []).map((g) => g.name).join(",")}|${opts.playerWalls ? "p" : ""}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const C = LOCAL_CENTER_CELL;
  const rnd = mulberry32(map.seed ^ 0x1f2e3d4c);
  const SEG = 128;

  // ── tường thành: bán kính đổi theo góc, lùi lại khi vấp nước / vách dốc ──
  const radii: number[] = new Array(SEG);
  for (let s = 0; s < SEG; s++) {
    const th = (s / SEG) * Math.PI * 2;
    // méo tự nhiên: hai lớp nhiễu vòng, chu kỳ lệch nhau
    const wob = 0.80 + 0.30 * loopNoise(s / SEG, map.seed + 21, 7) + 0.14 * loopNoise(s / SEG, map.seed + 47, 17);
    let r = opts.wallRadius * wob;

    // dò ra ngoài: gặp nước hoặc vách thì dừng trước đó
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    for (let d = opts.wallRadius * 0.35; d <= r; d += 4) {
      const t = terrainAtCell(map, C + cosT * d, C + sinT * d);
      if (isWater(t) || !isBuildable(t)) { r = Math.max(opts.wallRadius * 0.3, d - 10); break; }
      if (sampleField(map, map.elev, C + cosT * d, C + sinT * d) > 0.72) { r = Math.max(opts.wallRadius * 0.3, d - 8); break; }
    }
    radii[s] = r;
  }
  // Làm trơn vòng quanh → tường méo nhưng liền mạch, không mấu nhọn. Hai lượt
  // trung bình trượt rồi một lượt hạn dốc: chỗ vấp vách đá thì tường lượn vào
  // chứ không gãy khúc.
  let smoothed = radii;
  for (let pass = 0; pass < 2; pass++) {
    const next: number[] = new Array(SEG);
    for (let s = 0; s < SEG; s++) {
      let sum = 0;
      for (let k = -4; k <= 4; k++) sum += smoothed[(s + k + SEG) % SEG];
      next[s] = sum / 9;
    }
    smoothed = next;
  }
  const maxStep = opts.wallRadius * 0.05;
  for (let pass = 0; pass < 3; pass++) {
    for (let s = 0; s < SEG; s++) {
      const prev = smoothed[(s - 1 + SEG) % SEG];
      const d = smoothed[s] - prev;
      if (Math.abs(d) > maxStep) smoothed[s] = prev + Math.sign(d) * maxStep;
    }
  }
  const wall: Pt[] = smoothed.map((r, s) => {
    const th = (s / SEG) * Math.PI * 2;
    return [C + Math.cos(th) * r, C + Math.sin(th) * r] as Pt;
  });

  // ── cổng ──
  // Khoảng cách vòng tròn giữa hai vị trí trên tường.
  const circDist = (a: number, b: number): number => {
    const d = ((a - b) % SEG + SEG) % SEG;
    return Math.min(d, SEG - d);
  };
  const segAt = (angle: number): number => Math.round(((angle / (Math.PI * 2)) * SEG + SEG * 4) % SEG);

  const gates: TownGate[] = [];
  const used: number[] = [];

  if (opts.fixedGates && opts.fixedGates.length > 0) {
    for (const gate of opts.fixedGates) gates.push({ ...gate, main: !!gate.main, at: [...gate.at] as Pt });
  } else if (opts.loreRoads && opts.loreRoads.length > 0) {
    // Toà thành trong tiểu thuyết: cổng mở đúng hướng những con đường có tên.
    for (const road of opts.loreRoads) {
      const s = segAt(road.angle);
      used.push(s);
      const th = (s / SEG) * Math.PI * 2;
      gates.push({
        at: [C + Math.cos(th) * smoothed[s], C + Math.sin(th) * smoothed[s]],
        angle: th, main: !!road.main, name: road.name,
      });
    }
  } else {
    // Thành thường: 3-4 cổng RẢI ĐỀU quanh tường, ưu tiên chỗ tường vươn xa và
    // đất bên ngoài đi được. (Trước đây bộ lọc khoảng cách bị đảo dấu nên mọi
    // cổng dồn về một phía và các trục lộ chồng lên nhau.)
    const gateCount = 3 + (rnd() < 0.5 ? 1 : 0);
    const minGap = SEG / (gateCount + 1);
    for (let g = 0; g < gateCount; g++) {
      let best = -1;
      let bestScore = -Infinity;
      for (let s = 0; s < SEG; s += 2) {
        if (used.some((u) => circDist(s, u) < minGap)) continue;
        const th = (s / SEG) * Math.PI * 2;
        const out = terrainAtCell(map, C + Math.cos(th) * (smoothed[s] + 40), C + Math.sin(th) * (smoothed[s] + 40));
        const score = smoothed[s] + (isBuildable(out) ? 60 : -120) + hash1(s, map.seed + 900) * 30;
        if (score > bestScore) { bestScore = score; best = s; }
      }
      if (best < 0) break;
      used.push(best);
      const th = (best / SEG) * Math.PI * 2;
      gates.push({ at: [C + Math.cos(th) * smoothed[best], C + Math.sin(th) * smoothed[best]], angle: th, main: g === 0 });
    }
  }

  // ── ngõ: cung vòng đứt đoạn + nhánh nối từng khu nhà ra trục chính ──
  const lanes: Pt[][] = [];
  for (const frac of [0.5, 0.78]) {
    const start = rnd() * Math.PI * 2;
    const sweep = (0.5 + rnd() * 0.9) * Math.PI;
    const arc: Pt[] = [];
    for (let i = 0; i <= 18; i++) {
      const th = start + (sweep * i) / 18;
      const s = Math.round(((th / (Math.PI * 2)) * SEG + SEG * 4) % SEG);
      const r = smoothed[s] * frac * (0.92 + 0.16 * loopNoise(i / 18, map.seed + 61, 5));
      arc.push([C + Math.cos(th) * r, C + Math.sin(th) * r]);
    }
    lanes.push(arc);
  }

  // ── QUAN LỘ: kéo dài trục lộ ra tận hai mép lưới ──
  // Con đường có tên trong nguyên tác không kết thúc ở cổng thành — nó đi
  // xuyên qua thành rồi tiếp tục về phía chân trời. Mỗi cổng sinh ra một
  // nhánh chạy tới mép bản đồ, uốn theo địa thế chứ không kẻ thẳng.
  const spanOut = (from: Pt, angle: number, salt: number): Pt[] => {
    const pts: Pt[] = [from];
    let x = from[0];
    let y = from[1];
    let ang = angle;
    const step = 26;
    for (let i = 0; i < 140; i++) {
      // uốn nhẹ theo nhiễu tần thấp; gặp nước hoặc vách thì lách sang bên
      const bend = (loopNoise(i / 40, map.seed + salt, 9) - 0.5) * 0.24;
      const probeX = x + Math.cos(ang) * step * 1.6;
      const probeY = y + Math.sin(ang) * step * 1.6;
      const ahead = terrainAtCell(map, probeX, probeY);
      // Đường bộ phải dừng ở mép biển. Sông vẫn được phép cắt qua vì bước sau
      // sẽ nhận diện đoạn cắt và dựng cầu; biển chỉ dùng cho bến/cảng và hải trình.
      if (ahead === "Biển") break;
      const dodge = !isBuildable(ahead) && !isWater(ahead) ? 0.34 : 0;
      ang += bend * 0.35 + dodge * (hash1(i + salt, map.seed) > 0.5 ? 1 : -1);
      // giữ hướng chung, không cho đường quay ngược lại
      const drift = Math.atan2(Math.sin(ang - angle), Math.cos(ang - angle));
      if (Math.abs(drift) > 0.5) ang = angle + Math.sign(drift) * 0.5;

      x += Math.cos(ang) * step;
      y += Math.sin(ang) * step;
      pts.push([x, y]);
      if (x < -20 || y < -20 || x > LOCAL_GRID_CELLS + 20 || y > LOCAL_GRID_CELLS + 20) break;
    }
    return pts;
  };

  /** Tên mặc định cho thành không có trong tiểu thuyết — gọi theo hướng đi. */
  const compassName = (angle: number): string => {
    const dirs = ["Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc", "Bắc", "Đông Bắc"];
    const idx = Math.round(((angle % (Math.PI * 2)) + Math.PI * 2) / (Math.PI / 4)) % 8;
    return `Đường ${dirs[idx]}`;
  };

  /**
   * QUAN LỘ — MỘT đường liền mạch: trung tâm thành → (hơi vồng) → cổng →
   * (uốn theo địa thế) → mép lưới. Trước đây đoạn trong thành và đoạn ngoài
   * thành là hai polyline riêng, vẽ lệch nhau nên nhìn như con đường cụt nằm
   * chồng lên quan lộ.
   */
  const throughRoads: TownLayout["throughRoads"] = gates.map((gate, gi) => {
    const gateRadius = Math.hypot(gate.at[0] - C, gate.at[1] - C);
    const bow = (hash1(gi, map.seed + 1200) - 0.5) * 0.22; // độ vồng trong thành
    const inner: Pt[] = [];
    const steps = 16;
    for (let i = steps; i >= 0; i--) {
      const f = i / steps; // 1 = trung tâm, 0 = cổng
      const x = gate.at[0] + (C - gate.at[0]) * f;
      const y = gate.at[1] + (C - gate.at[1]) * f;
      // đẩy ngang theo hình sin → cung mềm, hai đầu vẫn khớp trung tâm và cổng
      const push = Math.sin(f * Math.PI) * bow * gateRadius;
      inner.push([x - Math.sin(gate.angle) * push, y + Math.cos(gate.angle) * push]);
    }
    return {
      name: gate.name || (gate.main ? compassName(gate.angle) : undefined),
      main: gate.main,
      // spanOut trả về [cổng, …] nên bỏ điểm đầu để không nhân đôi
      points: [...inner, ...spanOut(gate.at, gate.angle, 300 + gi * 37).slice(1)],
    };
  });

  const roadPts: Pt[] = throughRoads.flatMap((r) => r.points).concat(...lanes);
  for (const b of buildings) {
    if (b.ring) continue;
    const bx = b.x + b.size / 2;
    const by = b.y + b.size / 2;
    let near: Pt = [C, C];
    let bestD = Infinity;
    for (const p of roadPts) {
      const d = (p[0] - bx) ** 2 + (p[1] - by) ** 2;
      if (d < bestD) { bestD = d; near = p; }
    }
    if (bestD > 420 * 420) continue; // quá xa thì thôi, khỏi kéo ngõ xuyên đồng
    const jitter = (hash1(Math.round(bx + by), map.seed + 1700) - 0.5) * 0.35;
    const mx = (bx + near[0]) / 2 - (by - near[1]) * jitter;
    const my = (by + near[1]) / 2 + (bx - near[0]) * jitter;
    lanes.push([[bx, by], [mx, my], near]);
  }

  // ── cầu: đúng chỗ đường cắt qua dòng nước ──
  const bridges: TownBridge[] = [];
  const seen: Pt[] = [];
  for (const road of [...throughRoads.map((r) => r.points), ...lanes]) {
    for (let i = 0; i < road.length - 1; i++) {
      const [ax, ay] = road[i];
      const [bx, by] = road[i + 1];
      const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
      for (let t = 0; t < steps; t++) {
        const f = t / steps;
        const px = ax + (bx - ax) * f;
        const py = ay + (by - ay) * f;
        if (sampleField(map, map.riverF, px, py) < 0.5) continue;
        if (seen.some((p) => Math.hypot(p[0] - px, p[1] - py) < 70)) break;
        // đo bề ngang mặt nước để làm nhịp cầu
        const ang = Math.atan2(by - ay, bx - ax);
        let span = 8;
        for (let d = 4; d < 140; d += 4) {
          const f1 = sampleField(map, map.riverF, px + Math.cos(ang) * d, py + Math.sin(ang) * d);
          const f2 = sampleField(map, map.riverF, px - Math.cos(ang) * d, py - Math.sin(ang) * d);
          span = d * 2;
          if (f1 < 0.35 && f2 < 0.35) break;
        }
        seen.push([px, py]);
        bridges.push({ at: [px, py], angle: ang, span: Math.min(span, 150), width: 14 });
        break;
      }
    }
  }

  const layout: TownLayout = {
    // tường vạch tay thắng: đã có tuyến của người chơi thì không vẽ vành đai tự sinh
    hasWall: opts.hasWall && !opts.playerWalls,
    fromLore: !!opts.loreRoads?.length,
    wall, gates, throughRoads, lanes, bridges,
  };
  cache.set(key, layout);
  if (cache.size > 12) cache.delete(cache.keys().next().value as string);
  return layout;
}

export function _clearTownCache(): void {
  cache.clear();
}
