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

const placeLayer = (canvasCtx: CanvasRenderingContext2D, layer: Layer, scale: number) => {
  canvasCtx.setTransform(scale, 0, 0, scale, 0, 0);
  canvasCtx.translate(layer.x, layer.y);
  canvasCtx.scale(layer.size, layer.size);
  canvasCtx.translate(0.5, 0.5);
  canvasCtx.rotate((layer.rot * Math.PI) / 180);
  canvasCtx.translate(-0.5, -0.5);
};

const drawPattern = async (
  canvasCtx: CanvasRenderingContext2D,
  option: RenderOptions,
  width: number,
  height: number,
) => {
  const src = patternUrl(option.pattern);
  if (!src) return;
  const image = await loadImage(src);
  if (!image) return;
  const tileWidth = Math.max(
    1,
    Math.round((image.naturalWidth || 100) * option.scale * option.patternScale),
  );
  const tileHeight = Math.max(
    1,
    Math.round((image.naturalHeight || 100) * option.scale * option.patternScale),
  );
  const tile = document.createElement("canvas");
  tile.width = tileWidth;
  tile.height = tileHeight;
  const tileContext = tile.getContext("2d")!;
  tileContext.drawImage(image, 0, 0, tileWidth, tileHeight);
  tileContext.globalCompositeOperation = "source-in";
  tileContext.fillStyle = colorOf(option.tokens, "primary");
  tileContext.fillRect(0, 0, tileWidth, tileHeight);
  canvasCtx.save();
  canvasCtx.globalAlpha = option.patternOpacity;
  canvasCtx.fillStyle = canvasCtx.createPattern(tile, "repeat")!;
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.restore();
};

export const renderToCanvas = async (options: RenderOptions): Promise<HTMLCanvasElement> => {
  const canvasWidth = options.canvas.width * options.scale;
  const canvasHeight = options.canvas.height * options.scale;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = rgbCss(options.tokens.surface);
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  if (options.withPattern) await drawPattern(ctx, options, canvasWidth, canvasHeight);

  const paths = options.layers.map((layer) => new Path2D(layerPath(layer)));
  let scratch: HTMLCanvasElement | null = null;
  options.layers.forEach((layer, index) => {
    if (!hasOverlap(layer, index)) {
      placeLayer(ctx, layer, options.scale);
      ctx.fillStyle = colorOf(options.tokens, layer.fill);
      ctx.globalAlpha = layer.opacity ?? 1;
      ctx.fill(paths[index]);
      ctx.globalAlpha = 1;
      return;
    }
    if (!scratch) {
      scratch = document.createElement("canvas");
      scratch.width = canvasWidth;
      scratch.height = canvasHeight;
    }
    const layerContext = scratch.getContext("2d")!;
    layerContext.setTransform(1, 0, 0, 1, 0, 0);
    layerContext.globalCompositeOperation = "source-over";
    layerContext.clearRect(0, 0, canvasWidth, canvasHeight);
    placeLayer(layerContext, layer, options.scale);
    layerContext.fillStyle = colorOf(options.tokens, layer.fill);
    layerContext.fill(paths[index]);
    layerContext.globalCompositeOperation = "source-atop";
    layerContext.fillStyle = colorOf(options.tokens, layer.overlap as PaletteColor);
    for (let layerIndex = 0; layerIndex < index; layerIndex++) {
      placeLayer(layerContext, options.layers[layerIndex], options.scale);
      layerContext.fill(paths[layerIndex]);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = layer.opacity ?? 1;
    ctx.drawImage(scratch, 0, 0);
    ctx.globalAlpha = 1;
  });
  return canvas;
};

export const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("empty"))), "image/png");
    } catch (err) {
      reject(err);
    }
  });
