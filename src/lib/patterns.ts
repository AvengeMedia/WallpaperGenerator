export const PATTERNS = [
  "none",
  "bank-note",
  "bubbles",
  "endless-clouds",
  "plus",
  "topography",
  "wiggle",
] as const;

export type PatternId = (typeof PATTERNS)[number];

export const DEFAULT_PATTERN: PatternId = "topography";

export const isPatternId = (value: unknown): value is PatternId =>
  PATTERNS.includes(value as PatternId);

export const patternUrl = (id: PatternId) => (id === "none" ? null : `/patterns/${id}.svg`);

export const patternLabel = (id: PatternId) => (id === "none" ? "None" : id.replace(/-/g, " "));

export const PATTERN_OPACITY = { min: 0.02, max: 0.4, default: 0.1 } as const;
export const PATTERN_SCALE = { min: 0.5, max: 8, default: 1 } as const;

const tileSizes = new Map<string, Promise<[number, number]>>();

export const patternTileSize = (src: string): Promise<[number, number]> => {
  const cached = tileSizes.get(src);
  if (cached) return cached;
  const sizePromise = new Promise<[number, number]>((resolve) => {
    const image = new Image();
    image.onload = () => resolve([image.naturalWidth || 100, image.naturalHeight || 100]);
    image.onerror = () => resolve([100, 100]);
    image.src = src;
  });
  tileSizes.set(src, sizePromise);
  return sizePromise;
};

export const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
