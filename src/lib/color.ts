export type Rgb = [number, number, number];

const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export const toOklch = ([R, G, B]: Rgb): [number, number, number] => {
  const r = lin(R);
  const g = lin(G);
  const b = lin(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const k = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, k), ((Math.atan2(k, a) * 180) / Math.PI + 360) % 360];
};

export const fromOklch = (L: number, C: number, h: number): Rgb => {
  const rgbAt = (c: number) => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const k = c * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * k) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * k) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * k) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  let c = C;
  let rgb = rgbAt(c);
  for (let i = 0; i < 40 && rgb.some((v) => v < -0.0005 || v > 1.0005); i++) {
    c *= 0.95;
    rgb = rgbAt(c);
  }
  return rgb.map((v) => Math.round(gam(Math.min(1, Math.max(0, v))))) as Rgb;
};

export const hexToRgb = (text: string): Rgb | null => {
  const m = text
    .trim()
    .replace(/^#/, "")
    .match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
};

export const rgbToHex = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

export const rgbCss = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
