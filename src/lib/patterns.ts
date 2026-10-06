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

export const isPatternId = (v: unknown): v is PatternId => PATTERNS.includes(v as PatternId);

export const patternUrl = (id: PatternId) => (id === "none" ? null : `/patterns/${id}.svg`);

export const patternLabel = (id: PatternId) => (id === "none" ? "None" : id.replace(/-/g, " "));

export const PATTERN_OPACITY = { min: 0.02, max: 0.4, default: 0.1 } as const;
export const PATTERN_SCALE = { min: 0.5, max: 8, default: 1 } as const;

const tileSizes = new Map<string, Promise<[number, number]>>();

export const patternTileSize = (src: string): Promise<[number, number]> => {
  const cached = tileSizes.get(src);
  if (cached) return cached;
  const p = new Promise<[number, number]>((resolve) => {
    const im = new Image();
    im.onload = () => resolve([im.naturalWidth || 100, im.naturalHeight || 100]);
    im.onerror = () => resolve([100, 100]);
    im.src = src;
  });
  tileSizes.set(src, p);
  return p;
};

export const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
