import { fromOklch, rgbCss, toOklch, type Rgb } from "./color";

export const TOKENS = [
  "primary",
  "primary-container",
  "secondary",
  "secondary-container",
  "tertiary",
  "tertiary-container",
  "surface",
  "on-surface",
  "inverse-primary",
] as const;

export type Token = (typeof TOKENS)[number];
export type TokenMap = Record<Token, Rgb>;

const DARK: TokenMap = {
  primary: [177, 209, 138],
  "primary-container": [53, 78, 22],
  secondary: [191, 203, 173],
  "secondary-container": [64, 74, 51],
  tertiary: [160, 208, 203],
  "tertiary-container": [31, 78, 75],
  surface: [18, 20, 14],
  "on-surface": [226, 227, 216],
  "inverse-primary": [76, 102, 43],
};

const LIGHT: TokenMap = {
  primary: [76, 102, 43],
  "primary-container": [205, 237, 163],
  secondary: [88, 98, 73],
  "secondary-container": [220, 231, 200],
  tertiary: [56, 102, 99],
  "tertiary-container": [188, 236, 231],
  surface: [249, 250, 239],
  "on-surface": [26, 28, 22],
  "inverse-primary": [177, 209, 138],
};

const TERTIARY_SHIFT = 30;

export const BASE_HUE = toOklch(DARK.primary)[2];

export const baseTokens = (dark: boolean): TokenMap => (dark ? DARK : LIGHT);

export const shiftedTokens = (dark: boolean, hue: number): TokenMap => {
  const base = baseTokens(dark);
  const baseHue = BASE_HUE + hue;
  const tokenMap = {} as TokenMap;
  for (const name of TOKENS) {
    const [lightness, chroma] = toOklch(base[name]);
    const hueValue = (baseHue + (name.startsWith("tertiary") ? TERTIARY_SHIFT : 0)) % 360;
    tokenMap[name] = fromOklch(lightness, chroma, hueValue);
  }
  return tokenMap;
};

export const tokenCssVar = (name: Token | "black") => `--md-sys-color-${name}`;

export const hueGradient = (dark: boolean) => {
  const [lightness, chroma] = toOklch(baseTokens(dark).primary);
  const stops: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const hueValue = i * 10;
    stops.push(`${rgbCss(fromOklch(lightness, chroma, hueValue))} ${(hueValue / 3.6).toFixed(2)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
};
