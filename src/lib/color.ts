export type Rgb = [number, number, number];

const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export const toOklch = ([R, G, B]: Rgb): [number, number, number] => {
  const r = lin(R);
  const g = lin(G);
  const b = lin(B);
  const lVal = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mVal = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sVal = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * lVal + 0.793617785 * mVal - 0.0040720468 * sVal;
  const aVal = 1.9779984951 * lVal - 2.428592205 * mVal + 0.4505937099 * sVal;
  const kVal = 0.0259040371 * lVal + 0.7827717662 * mVal - 0.808675766 * sVal;
  return [
    lightness,
    Math.hypot(aVal, kVal),
    ((Math.atan2(kVal, aVal) * 180) / Math.PI + 360) % 360,
  ];
};

export const fromOklch = (L: number, C: number, h: number): Rgb => {
  const rgbAt = (chroma: number) => {
    const aVal = chroma * Math.cos((h * Math.PI) / 180);
    const kVal = chroma * Math.sin((h * Math.PI) / 180);
    const lVal = (L + 0.3963377774 * aVal + 0.2158037573 * kVal) ** 3;
    const mVal = (L - 0.1055613458 * aVal - 0.0638541728 * kVal) ** 3;
    const sVal = (L - 0.0894841775 * aVal - 1.291485548 * kVal) ** 3;
    return [
      4.0767416621 * lVal - 3.3077115913 * mVal + 0.2309699292 * sVal,
      -1.2684380046 * lVal + 2.6097574011 * mVal - 0.3413193965 * sVal,
      -0.0041960863 * lVal - 0.7034186147 * mVal + 1.707614701 * sVal,
    ];
  };
  let chroma = C;
  let rgb = rgbAt(chroma);
  for (let i = 0; i < 40 && rgb.some((v) => v < -0.0005 || v > 1.0005); i++) {
    chroma *= 0.95;
    rgb = rgbAt(chroma);
  }
  return rgb.map((v) => Math.round(gam(Math.min(1, Math.max(0, v))))) as Rgb;
};

export const hexToRgb = (text: string): Rgb | null => {
  const m = text
    .trim()
    .replace(/^#/, "")
    .match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb;
};

export const rgbToHex = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

export const rgbCss = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
