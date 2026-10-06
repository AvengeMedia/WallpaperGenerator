import type { Size } from "./formats";
import { hasOverlap, layerPath, type Layer } from "./layer";
import type { PaletteColor } from "./palette";
import { loadImage, patternUrl, type PatternId } from "./patterns";
import { rgbCss } from "./color";
import type { TokenMap } from "./theme";

export interface RenderOptions {
  layers: Layer[];
  canvas: Size;
  tokens: TokenMap;
  pattern: PatternId;
  patternOpacity: number;
  patternScale: number;
  scale: number;
  withPattern: boolean;
}

const colorOf = (tokens: TokenMap, name: PaletteColor) =>
  name === "black" ? "rgb(0 0 0)" : rgbCss(tokens[name]);

const placeLayer = (c: CanvasRenderingContext2D, l: Layer, scale: number) => {
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.translate(l.x, l.y);
  c.scale(l.size, l.size);
  c.translate(0.5, 0.5);
  c.rotate((l.rot * Math.PI) / 180);
  c.translate(-0.5, -0.5);
};

const drawPattern = async (
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  W: number,
  H: number,
) => {
  const src = patternUrl(o.pattern);
  if (!src) return;
  const im = await loadImage(src);
  if (!im) return;
  const tw = Math.max(1, Math.round((im.naturalWidth || 100) * o.scale * o.patternScale));
  const th = Math.max(1, Math.round((im.naturalHeight || 100) * o.scale * o.patternScale));
  const tile = document.createElement("canvas");
  tile.width = tw;
  tile.height = th;
  const t = tile.getContext("2d")!;
  t.drawImage(im, 0, 0, tw, th);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = colorOf(o.tokens, "primary");
  t.fillRect(0, 0, tw, th);
  ctx.save();
  ctx.globalAlpha = o.patternOpacity;
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
};

export const renderToCanvas = async (o: RenderOptions): Promise<HTMLCanvasElement> => {
  const W = o.canvas.w * o.scale;
  const H = o.canvas.h * o.scale;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = rgbCss(o.tokens.surface);
  ctx.fillRect(0, 0, W, H);
  if (o.withPattern) await drawPattern(ctx, o, W, H);

  const paths = o.layers.map((l) => new Path2D(layerPath(l)));
  let scratch: HTMLCanvasElement | null = null;
  o.layers.forEach((l, i) => {
    if (!hasOverlap(l, i)) {
      placeLayer(ctx, l, o.scale);
      ctx.fillStyle = colorOf(o.tokens, l.fill);
      ctx.globalAlpha = l.opacity ?? 1;
      ctx.fill(paths[i]);
      ctx.globalAlpha = 1;
      return;
    }
    if (!scratch) {
      scratch = document.createElement("canvas");
      scratch.width = W;
      scratch.height = H;
    }
    const lc = scratch.getContext("2d")!;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = "source-over";
    lc.clearRect(0, 0, W, H);
    placeLayer(lc, l, o.scale);
    lc.fillStyle = colorOf(o.tokens, l.fill);
    lc.fill(paths[i]);
    lc.globalCompositeOperation = "source-atop";
    lc.fillStyle = colorOf(o.tokens, l.overlap as PaletteColor);
    for (let k = 0; k < i; k++) {
      placeLayer(lc, o.layers[k], o.scale);
      lc.fill(paths[k]);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = l.opacity ?? 1;
    ctx.drawImage(scratch, 0, 0);
    ctx.globalAlpha = 1;
  });
  return cv;
};

export const canvasToBlob = (cv: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    try {
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error("empty"))), "image/png");
    } catch (err) {
      reject(err);
    }
  });
