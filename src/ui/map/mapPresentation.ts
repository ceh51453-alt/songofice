/**
 * Shared cartographic presentation helpers.
 *
 * The reference map supplied by the user turns simple control polygons into
 * hand-drawn borders through deterministic midpoint subdivision.  Keeping the
 * seed dependent only on an edge's coordinates means neighbouring polygons
 * continue to share the exact same ink line instead of opening visual cracks.
 */

export type MapPoint = [number, number];

const RECURSION_DEPTH = 3;
const DISPLACEMENT_FACTOR = 0.24;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
}

function pointBefore(a: MapPoint, b: MapPoint): boolean {
  return a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
}

function edgeSeed(a: MapPoint, b: MapPoint): number {
  const [p1, p2] = pointBefore(a, b) ? [a, b] : [b, a];
  return 1 + p1[0] * 13 + p1[1] * 31 + p2[0] * 47 + p2[1] * 61;
}

function subdivide(
  p1: MapPoint,
  p2: MapPoint,
  depth: number,
  seed: number,
  output: MapPoint[],
): void {
  if (depth === 0) {
    output.push(p2);
    return;
  }

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.hypot(dx, dy);
  if (length < 2) {
    output.push(p2);
    return;
  }

  const displacement = (seededRandom(seed) - 0.5) * length * DISPLACEMENT_FACTOR;
  const midpoint: MapPoint = [
    (p1[0] + p2[0]) / 2 + (dy / length) * displacement,
    (p1[1] + p2[1]) / 2 - (dx / length) * displacement,
  ];

  subdivide(p1, midpoint, depth - 1, seed * 1.7, output);
  subdivide(midpoint, p2, depth - 1, seed * 2.3, output);
}

/** Return a stable, hand-drawn version of a closed polygon. */
export function naturalBoundaryPoints(points: MapPoint[]): MapPoint[] {
  if (points.length < 2) return points;
  const detailed: MapPoint[] = [points[0]];

  for (let index = 0; index < points.length; index++) {
    const from = points[index];
    const to = points[(index + 1) % points.length];
    const forward = pointBefore(from, to);
    const start = forward ? from : to;
    const end = forward ? to : from;
    const segment: MapPoint[] = [start];
    subdivide(start, end, RECURSION_DEPTH, edgeSeed(start, end), segment);
    const oriented = forward ? segment : [...segment].reverse();
    detailed.push(...oriented.slice(1));
  }

  return detailed;
}

export function naturalBoundaryPath(points: MapPoint[]): string {
  const detailed = naturalBoundaryPoints(points);
  if (detailed.length < 2) return "";
  return `${detailed.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
}

export function polygonPath(points: MapPoint[]): string {
  if (points.length < 2) return "";
  return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} Z`;
}

/** Monotonic-chain hull used to draw the heavier macro-region ink outline. */
export function convexHull(points: MapPoint[]): MapPoint[] {
  const unique = [...new Map(points.map((point) => [`${point[0]},${point[1]}`, point])).values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 3) return unique;

  const cross = (origin: MapPoint, a: MapPoint, b: MapPoint) =>
    (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
  const lower: MapPoint[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: MapPoint[] = [];
  for (let index = unique.length - 1; index >= 0; index--) {
    const point = unique[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/** Area-weighted polygon centroid, with a safe average fallback. */
export function polygonCentroid(points: MapPoint[]): MapPoint {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index++) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    twiceArea += cross;
    x += (current[0] + next[0]) * cross;
    y += (current[1] + next[1]) * cross;
  }
  if (Math.abs(twiceArea) < 0.001) {
    return [
      points.reduce((sum, point) => sum + point[0], 0) / Math.max(1, points.length),
      points.reduce((sum, point) => sum + point[1], 0) / Math.max(1, points.length),
    ];
  }
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

export const MAP_INK = "#29383d";
export const MAP_LABEL_INK = "#eee8d5";
export const MAP_PARCHMENT = "#202b31";
export const MAP_GOLD = "#d4af37";
