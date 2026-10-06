import { isFormatId, type FormatId, type Orientation, type Size } from "./formats";
import {
  DEFAULT_PATTERN,
  isPatternId,
  PATTERN_OPACITY,
  PATTERN_SCALE,
  type PatternId,
} from "./patterns";
import { clamp, normDeg } from "./utils";

export interface Prefs {
  pattern: PatternId;
  opacity: number;
  hue: number;
  patternScale: number;
  format: FormatId;
  orientation: Orientation;
  custom: Size;
}

export const defaultPrefs = (): Prefs => ({
  pattern: DEFAULT_PATTERN,
  opacity: PATTERN_OPACITY.default,
  hue: 0,
  patternScale: PATTERN_SCALE.default,
  format: "16:9",
  orientation: "landscape",
  custom: { w: 1920, h: 1080 },
});

export const clampOpacity = (v: number) => clamp(v, PATTERN_OPACITY.min, PATTERN_OPACITY.max);
export const clampScale = (v: number) => clamp(+v.toFixed(2), PATTERN_SCALE.min, PATTERN_SCALE.max);

const migratePattern = (p: unknown): PatternId => {
  if (p === "none") return "none";
  if (typeof p !== "string") return DEFAULT_PATTERN;
  const id = p.replace(/^.*\//, "").replace(/\.svg$/, "");
  return isPatternId(id) ? id : DEFAULT_PATTERN;
};

export const sanitizePrefs = (raw: unknown): Prefs => {
  const prefs = defaultPrefs();
  if (!raw || typeof raw !== "object") return prefs;
  const sp = raw as Record<string, unknown>;
  prefs.pattern = migratePattern(sp.pattern);
  if (typeof sp.opacity === "number" && Number.isFinite(sp.opacity))
    prefs.opacity = clampOpacity(sp.opacity);
  if (typeof sp.hue === "number" && Number.isFinite(sp.hue)) prefs.hue = normDeg(sp.hue);
  if (typeof sp.patternScale === "number" && Number.isFinite(sp.patternScale))
    prefs.patternScale = clampScale(sp.patternScale);
  if (isFormatId(sp.format)) prefs.format = sp.format;
  else if (sp.format === "9:16") {
    prefs.format = "16:9";
    prefs.orientation = "portrait";
  } else if (sp.format === "9:20") {
    prefs.format = "custom";
    prefs.custom = { w: 1080, h: 2400 };
  }
  if (sp.orientation === "portrait") prefs.orientation = "portrait";
  const custom = sp.custom as Partial<Size> | undefined;
  if (custom && Number.isFinite(custom.w) && Number.isFinite(custom.h))
    prefs.custom = { w: custom.w!, h: custom.h! };
  return prefs;
};
