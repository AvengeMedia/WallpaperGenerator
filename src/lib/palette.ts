export const PALETTE = [
  "primary",
  "secondary",
  "tertiary",
  "primary-container",
  "secondary-container",
  "tertiary-container",
  "inverse-primary",
  "black",
] as const;

export type PaletteColor = (typeof PALETTE)[number];
export type OverlapColor = "none" | PaletteColor;

export const OVERLAP_OPTIONS: readonly OverlapColor[] = ["none", ...PALETTE];

export const isPaletteColor = (value: unknown): value is PaletteColor =>
  PALETTE.includes(value as PaletteColor);

export const isOverlapColor = (value: unknown): value is OverlapColor =>
  OVERLAP_OPTIONS.includes(value as OverlapColor);

export const cssColor = (name: PaletteColor) => `var(--md-sys-color-${name})`;

export const randomFill = (): PaletteColor => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export const randomOverlap = (fill: PaletteColor): OverlapColor => {
  const opts = PALETTE.filter((color) => color !== fill && color !== "black");
  return opts[Math.floor(Math.random() * opts.length)];
};
