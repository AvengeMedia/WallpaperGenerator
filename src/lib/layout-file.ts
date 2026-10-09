import type { Size } from "./formats";
import { newLayerId, sanitizeLayer, type Layer } from "./layer";
import { isPaletteColor, OVERLAP_OPTIONS, PALETTE, type OverlapColor } from "./palette";
import { isPatternId, type PatternId } from "./patterns";
import {
  BLOB_MAX_EDGES,
  BLOB_MIN_EDGES,
  createBlobPath,
  isBlob,
  SHAPES,
  SMOOTHNESS,
  type SmoothnessIndex,
} from "./shapes";
import { camel, lowerFirst, normDeg, round } from "./utils";
import { clampOpacity } from "./prefs";

export interface LayoutFile {
  layers: Layer[];
  pattern?: PatternId;
  strength?: number;
  skipped: number;
}

export const serializeLayout = (
  layers: Layer[],
  canvas: Size,
  pattern: PatternId,
  strength: number,
) => {
  const m = Math.min(canvas.w, canvas.h);
  const rows = layers.map((l, i) => {
    const o: Record<string, unknown> = {};
    if (isBlob(l)) {
      o.shape = "blob";
      o.path = l.d;
      o.points = l.points.map((p) => ({ x: round(p.x, 4), y: round(p.y, 4) }));
      o.smoothness = l.smoothness;
    } else {
      o.shape = lowerFirst(SHAPES[l.shape ?? 0].name);
    }
    o.x = round((l.x + l.size / 2) / canvas.w);
    o.y = round((l.y + l.size / 2) / canvas.h);
    o.size = round(l.size / m);
    const rot = normDeg(l.rot);
    o.rotation = round(rot > 180 ? rot - 360 : rot, 1);
    o.fill = camel(l.fill);
    if (i > 0 && l.overlap !== "none") o.overlap = camel(l.overlap);
    if (l.opacity !== undefined) o.opacity = round(l.opacity, 2);
    return "    " + JSON.stringify(o);
  });
  const layersText = rows.length ? `[\n${rows.join(",\n")}\n  ]` : "[]";
  return `{\n  "layers": ${layersText},\n  "pattern": ${JSON.stringify(pattern)},\n  "strength": ${round(strength, 2)}\n}\n`;
};

export type ParseResult = { ok: true; layout: LayoutFile } | { ok: false; error: string };

const isSmoothness = (v: unknown): v is SmoothnessIndex =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < SMOOTHNESS.length;

const isPoints = (v: unknown): v is { x: number; y: number }[] =>
  Array.isArray(v) &&
  v.length >= BLOB_MIN_EDGES &&
  v.length <= BLOB_MAX_EDGES &&
  v.every((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

const blobFields = (r: Record<string, unknown>) => {
  const smoothness = isSmoothness(r.smoothness) ? r.smoothness : 0;
  if (isPoints(r.points)) {
    return { points: r.points, smoothness, d: createBlobPath(r.points, smoothness) };
  }
  return { d: r.path };
};

export const parseLayout = (text: string, canvas: Size): ParseResult => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  if (!data || typeof data !== "object" || !Array.isArray((data as { layers?: unknown }).layers)) {
    return { ok: false, error: "No layout found in that file." };
  }
  const file = data as { layers: unknown[]; pattern?: unknown; strength?: unknown };
  const m = Math.min(canvas.w, canvas.h);
  const layers: Layer[] = [];
  for (const raw of file.layers) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const size = Number(r.size) * m;
    const candidate: Record<string, unknown> = {
      id: newLayerId(),
      size,
      x: Number(r.x) * canvas.w - size / 2,
      y: Number(r.y) * canvas.h - size / 2,
      rot: normDeg(Number(r.rotation) || 0),
      fill: PALETTE.find((c) => camel(c) === r.fill),
      overlap: OVERLAP_OPTIONS.find((c) => camel(c) === r.overlap) ?? ("none" as OverlapColor),
    };
    if (r.shape === "blob") Object.assign(candidate, blobFields(r));
    else candidate.shape = SHAPES.findIndex((sh) => lowerFirst(sh.name) === r.shape);
    if (r.opacity !== undefined) candidate.opacity = r.opacity;
    if (!isPaletteColor(candidate.fill)) continue;
    const layer = sanitizeLayer(candidate, canvas);
    if (layer) layers.push(layer);
  }
  if (!layers.length && file.layers.length) {
    return { ok: false, error: "None of the shapes in that file could be read." };
  }
  const layout: LayoutFile = { layers, skipped: file.layers.length - layers.length };
  if (isPatternId(file.pattern)) layout.pattern = file.pattern;
  if (typeof file.strength === "number" && Number.isFinite(file.strength))
    layout.strength = clampOpacity(file.strength);
  return { ok: true, layout };
};

export const installLink = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `dms://wallpaper/install/${base64}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
