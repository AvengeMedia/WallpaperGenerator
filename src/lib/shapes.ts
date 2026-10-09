import { MaterialShapes, roundedPolygonToPath } from "material-shapes-ts";
import { BlobLayer, ShapeSpec } from "./layer";

export interface LibraryShape {
  name: string;
  d: string;
}

export const BLOB_MIN_EDGES = 3;
export const BLOB_MAX_EDGES = 15;
export const SHAPES: readonly LibraryShape[] = MaterialShapes.all().map((s) => ({
  name: s.name,
  d: roundedPolygonToPath(s.polygon).toSvgPathData(),
}));

export const shapeIndex = (name: string, fallback: number) => {
  const i = SHAPES.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
  return i >= 0 ? i : fallback;
};

export const isShapeIndex = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < SHAPES.length;

export const prettyName = (name: string) =>
  name.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/(.+) (\d+)(.+)/, "$2-$3 $1");

export const randomShapeIndex = (avoid?: number) => {
  if (SHAPES.length < 2) return 0;
  let i: number;
  do i = Math.floor(Math.random() * SHAPES.length);
  while (i === avoid);
  return i;
};

const f = (v: number) => +v.toFixed(4);

export const SMOOTHNESS = [
  { roundness: 0 },
  { roundness: 0.3 },
  { roundness: 0.55 },
  { roundness: 0.8 },
  { roundness: 0.9 },
] as const;

export type SmoothnessIndex = 0 | 1 | 2 | 3 | 4;

const TENSION = 1 / 6;
const MAX_HANDLE_RATIO = 0.5;

const clampVec = (vx: number, vy: number, maxLen: number): [number, number] => {
  const len = Math.hypot(vx, vy);
  if (len === 0 || len <= maxLen) return [vx, vy];
  const s = maxLen / len;
  return [vx * s, vy * s];
};

type Point = { x: number; y: number };

// pulls points towards a circle
const roundPoints = (points: Point[], t: number): Point[] => {
  if (t === 0) return points;
  const n = points.length;
  const polar = points.map((p) => ({
    a: Math.atan2(p.y - 0.5, p.x - 0.5),
    r: Math.hypot(p.x - 0.5, p.y - 0.5),
  }));
  const meanR = polar.reduce((sum, p) => sum + p.r, 0) / n;

  return polar.map(({ a, r }, i) => {
    const ideal = (i / n) * Math.PI * 2;
    let delta = a - ideal;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    const na = ideal + delta * (1 - t);
    const nr = r + (meanR - r) * t;
    return { x: 0.5 + Math.cos(na) * nr, y: 0.5 + Math.sin(na) * nr };
  });
};

export const createBlobPath = (
  rawPoints: Exclude<ShapeSpec["points"], undefined>,
  smoothness: SmoothnessIndex,
) => {
  const points = roundPoints(rawPoints, SMOOTHNESS[smoothness].roundness);
  const n = points.length;
  let d = `M${f(points[0].x)} ${f(points[0].y)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const maxLen = Math.hypot(p2.x - p1.x, p2.y - p1.y) * MAX_HANDLE_RATIO;

    const [h1x, h1y] = clampVec((p2.x - p0.x) * TENSION, (p2.y - p0.y) * TENSION, maxLen);
    const [h2x, h2y] = clampVec((p3.x - p1.x) * TENSION, (p3.y - p1.y) * TENSION, maxLen);

    d += `C${f(p1.x + h1x)} ${f(p1.y + h1y)} ${f(p2.x - h2x)} ${f(p2.y - h2y)} ${f(p2.x)} ${f(p2.y)}`;
  }

  return d + "Z";
};

export const createBlob = (pointCount: number, smoothness: SmoothnessIndex) => {
  const jitter = ((Math.PI * 2) / pointCount) * 0.7;
  const points: ShapeSpec["points"] = Array.from({ length: pointCount }, (_, i) => {
    const a = (i / pointCount) * Math.PI * 2 + (Math.random() - 0.5) * jitter;
    const r = 0.15 + Math.random() * 0.35;
    return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r };
  });
  const d = createBlobPath(points, smoothness);
  return { points, smoothness, d };
};
export const randomBlob = () => {
  const pointCount =
    BLOB_MIN_EDGES + Math.floor(Math.random() * (BLOB_MAX_EDGES - BLOB_MIN_EDGES + 1));
  const smoothness = Math.floor(Math.random() * 5) as SmoothnessIndex;

  return createBlob(pointCount, smoothness);
};

export const isBlob = <T extends { type: ShapeSpec["type"] }>(shape: T): shape is T & BlobLayer =>
  shape.type === "blob";

const SAFE_PATH = /^[MCLZ0-9eE.,\s+-]+$/;

export const isSafeBlobPath = (d: unknown): d is string =>
  typeof d === "string" && d.length < 4000 && SAFE_PATH.test(d);
