import { isOverlapColor, isPaletteColor, type OverlapColor, type PaletteColor } from "./palette";
import { isSafeBlobPath, isShapeIndex, prettyName, SHAPES } from "./shapes";
import type { Size } from "./formats";
import { clamp, normDeg } from "./utils";

export type ShapeSpec = { shape: number; d?: undefined } | { d: string; shape?: undefined };

export interface Layer {
  id: string;
  shape?: number;
  d?: string;
  size: number;
  x: number;
  y: number;
  rot: number;
  fill: PaletteColor;
  overlap: OverlapColor;
  opacity?: number;
}

export const LAYER_SIZE_PCT = { min: 5, max: 400 } as const;

let nextId = 0;
export const newLayerId = () => `l${Date.now().toString(36)}${(nextId++).toString(36)}`;

export const layerPath = (l: Pick<Layer, "shape" | "d">) => l.d ?? SHAPES[l.shape ?? 0].d;

export const layerName = (l: Pick<Layer, "shape" | "d">) =>
  l.d !== undefined ? "Blob" : prettyName(SHAPES[l.shape ?? 0].name);

export const layerTransform = (l: Layer) =>
  `translate(${l.x} ${l.y}) scale(${l.size}) rotate(${l.rot} 0.5 0.5)`;

export const hasOverlap = (l: Layer, index: number) => index > 0 && l.overlap !== "none";

const layerSizeBounds = (canvas: Size) => {
  const m = Math.min(canvas.w, canvas.h);
  return { min: (LAYER_SIZE_PCT.min / 100) * m, max: (LAYER_SIZE_PCT.max / 100) * m };
};

export const clampLayerSize = (size: number, canvas: Size) => {
  const { min, max } = layerSizeBounds(canvas);
  return clamp(size, min, max);
};

export const resizeAroundCenter = (l: Layer, size: number, canvas: Size): Layer => {
  const cx = l.x + l.size / 2;
  const cy = l.y + l.size / 2;
  const next = clampLayerSize(size, canvas);
  return { ...l, size: next, x: cx - next / 2, y: cy - next / 2 };
};

export const rescaleLayers = (layers: Layer[], from: Size, to: Size): Layer[] => {
  if (from.w === to.w && from.h === to.h) return layers;
  const k = Math.sqrt((to.w * to.h) / (from.w * from.h));
  return layers.map((l) => {
    const cx = ((l.x + l.size / 2) * to.w) / from.w;
    const cy = ((l.y + l.size / 2) * to.h) / from.h;
    const size = Math.round(l.size * k);
    return { ...l, size, x: Math.round(cx - size / 2), y: Math.round(cy - size / 2) };
  });
};

export const sanitizeLayer = (raw: unknown, canvas: Size): Layer | null => {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const hasBlob = l.d !== undefined;
  if (hasBlob ? !isSafeBlobPath(l.d) : !isShapeIndex(l.shape)) return null;
  if (![l.size, l.x, l.y, l.rot].every((v) => Number.isFinite(v))) return null;
  const size = clampLayerSize(l.size as number, canvas);
  if (!isPaletteColor(l.fill)) return null;
  if (l.overlap !== undefined && !isOverlapColor(l.overlap)) return null;
  const opacity = l.opacity;
  if (
    opacity !== undefined &&
    !(Number.isFinite(opacity) && (opacity as number) >= 0.05 && (opacity as number) <= 1)
  )
    return null;
  const cx = (l.x as number) + (l.size as number) / 2;
  const cy = (l.y as number) + (l.size as number) / 2;
  return {
    id: typeof l.id === "string" ? l.id : newLayerId(),
    ...(hasBlob ? { d: l.d as string } : { shape: l.shape as number }),
    size,
    x: cx - size / 2,
    y: cy - size / 2,
    rot: normDeg(l.rot as number),
    fill: l.fill,
    overlap: (l.overlap as OverlapColor | undefined) ?? "primary-container",
    ...(opacity !== undefined ? { opacity: opacity as number } : {}),
  };
};
