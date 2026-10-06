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

export const isPaletteColor = (v: unknown): v is PaletteColor =>
  PALETTE.includes(v as PaletteColor);

export const isOverlapColor = (v: unknown): v is OverlapColor =>
  OVERLAP_OPTIONS.includes(v as OverlapColor);

export const cssColor = (name: PaletteColor) => `var(--md-sys-color-${name})`;

export const randomFill = (): PaletteColor => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export const randomOverlap = (fill: PaletteColor): OverlapColor => {
  const opts = PALETTE.filter((c) => c !== fill && c !== "black");
  return opts[Math.floor(Math.random() * opts.length)];
};
