import { canvasSize } from "./formats";
import { sanitizeLayer, type Layer } from "./layer";
import { sanitizePrefs, type Prefs } from "./prefs";

const KEY = "wallpaper-layout-v1";

export interface SavedState {
  layers: Layer[];
  prefs: Prefs;
  dark: boolean;
}

const migrateLegacyColors = (raw: Record<string, unknown>) => {
  if (raw.fill === "surface") raw.fill = "primary-container";
  if (raw.overlap === "surface") raw.overlap = "none";
  return raw;
};

export const loadSaved = (): SavedState | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!saved || !Array.isArray(saved.layers)) return null;
    const prefs = sanitizePrefs(saved.prefs);
    const canvas = canvasSize(prefs.format, prefs.orientation, prefs.custom);
    const layers = (saved.layers as unknown[])
      .map((layer) =>
        layer && typeof layer === "object"
          ? sanitizeLayer(migrateLegacyColors(layer as Record<string, unknown>), canvas)
          : null,
      )
      .filter((layer): layer is Layer => layer !== null);
    return { layers, prefs, dark: saved.dark !== false };
  } catch {
    return null;
  }
};

export const persist = (state: SavedState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
};
