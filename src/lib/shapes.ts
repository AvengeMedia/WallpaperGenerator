import { MaterialShapes, roundedPolygonToPath } from "material-shapes-ts";

export interface LibraryShape {
  name: string;
  d: string;
}

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

export const randomBlob = () => {
  const n = 8 + Math.floor(Math.random() * 8);
  const jitter = ((Math.PI * 2) / n) * 0.7;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * jitter;
    const r = 0.15 + Math.random() * 0.35;
    return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r];
  });
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
};

const SAFE_PATH = /^[MCLZ0-9eE.,\s+-]+$/;

export const isSafeBlobPath = (d: unknown): d is string =>
  typeof d === "string" && d.length < 4000 && SAFE_PATH.test(d);
