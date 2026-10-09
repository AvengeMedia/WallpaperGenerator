import { createStore, shallow } from "@tanstack/store";
import { useSelector } from "@tanstack/react-store";
import { canvasSize, clampPx, type FormatId, type Orientation, type Size } from "@/lib/formats";
import {
  newLayerId,
  rescaleLayers,
  resizeAroundCenter,
  type Layer,
  type ShapeSpec,
} from "@/lib/layer";
import type { LayoutFile } from "@/lib/layout-file";
import {
  OVERLAP_OPTIONS,
  PALETTE,
  randomFill,
  randomOverlap,
  type OverlapColor,
  type PaletteColor,
} from "@/lib/palette";
import { DEFAULT_PATTERN, PATTERNS, type PatternId } from "@/lib/patterns";
import { clampOpacity, clampScale, defaultPrefs, type Prefs } from "@/lib/prefs";
import { isBlob, randomBlob, randomShapeIndex, shapeIndex, SHAPES } from "@/lib/shapes";
import { loadSaved, persist } from "@/lib/storage";
import { normDeg, pickRandom, rnd } from "@/lib/utils";

export type LayerDirection = number;

export interface FormatPatch {
  format?: FormatId;
  orientation?: Orientation;
  custom?: Size;
}

export interface WallpaperState {
  layers: Layer[];
  prefs: Prefs;
  canvas: Size;
  dark: boolean;
  activeId: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

type Snapshot = Pick<WallpaperState, "layers" | "prefs">;

const HISTORY_LIMIT = 100;
const BURST_MS = 600;

const defaultLayers = (): Layer[] => [
  {
    id: newLayerId(),
    type: "shape",
    shape: shapeIndex("flower", 28),
    size: 560,
    x: -120,
    y: -170,
    rot: 0,
    fill: "tertiary-container",
    overlap: "primary-container",
  },
  {
    id: newLayerId(),
    type: "shape",
    shape: shapeIndex("circle", 0),
    size: 1100,
    x: 1000,
    y: 380,
    rot: 0,
    fill: "primary",
    overlap: "secondary-container",
  },
  {
    id: newLayerId(),
    type: "shape",
    shape: shapeIndex("burst", 24),
    size: 620,
    x: 650,
    y: 230,
    rot: 18,
    fill: "tertiary",
    overlap: "primary-container",
  },
];

const initialState = (): WallpaperState => {
  const saved = loadSaved();
  const prefs = saved?.prefs ?? defaultPrefs();
  return {
    layers: saved?.layers ?? defaultLayers(),
    prefs,
    canvas: canvasSize(prefs.format, prefs.orientation, prefs.custom),
    dark: saved?.dark ?? true,
    activeId: null,
    canUndo: false,
    canRedo: false,
  };
};

const withCanvas = (prefs: Prefs) => ({
  prefs,
  canvas: canvasSize(prefs.format, prefs.orientation, prefs.custom),
});

const randomSize = (canvas: Size) =>
  Math.round(rnd(400, 860) * (Math.min(canvas.w, canvas.h) / 1080));

/* How many percent a shape may hang over the canvas edge */
const BLEED = 0.35;

/** Where a `size`-wide box lands at random along one axis of the canvas.
 * The axis is extended by `BLEED` to allow shapes hanging off the canvas. */
const randomAxis = (extent: number, size: number) =>
  extent > size ? rnd(-BLEED * size, extent - size + BLEED * size) : (extent - size) / 2;

const randomPlacement = (canvas: Size, spec: ShapeSpec): Layer => {
  const size = randomSize(canvas);
  const fill = randomFill();
  return {
    id: newLayerId(),
    ...spec,
    size,
    x: Math.round(canvas.w / 2 - size / 2),
    y: Math.round(canvas.h / 2 - size / 2),
    rot: 0,
    fill,
    overlap: randomOverlap(fill),
  };
};

const surpriseLayers = (canvas: Size): Layer[] => {
  const count = 2 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, (_, i) => {
    const size = randomSize(canvas);
    const fill = randomFill();
    const spec: ShapeSpec =
      Math.random() < 0.25
        ? { type: "blob", ...randomBlob() }
        : { type: "shape", shape: Math.floor(Math.random() * SHAPES.length) };
    return {
      id: newLayerId(),
      ...spec,
      size,
      x: Math.round(randomAxis(canvas.w, size)),
      y: Math.round(randomAxis(canvas.h, size)),
      rot: Math.round(rnd(0, 360)),
      fill,
      overlap: i > 0 && Math.random() < 0.75 ? randomOverlap(fill) : "none",
    };
  });
};

const signatureOf = ({ layers, prefs }: Snapshot) => {
  const shapes = layers.map((l) => (l.shape ?? "") + (l.d ? "b" + l.d.length : "")).join(",");
  return `${layers.length}|${shapes}|${prefs.pattern}|${prefs.format}|${prefs.orientation}`;
};

const snapshotOf = ({ layers, prefs }: Snapshot) => JSON.stringify({ layers, prefs });

export const wallpaperStore = createStore(initialState(), ({ setState, get }) => {
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  let lastPattern: PatternId | null = null;
  let lastSnap = snapshotOf(get());
  let lastSig = signatureOf(get());
  let lastChange = 0;
  let restoring = false;

  const patch = (partial: Partial<WallpaperState>) => setState((prev) => ({ ...prev, ...partial }));

  const historyFlags = () =>
    patch({ canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });

  const track = () => {
    if (restoring) return;
    const cur = snapshotOf(get());
    if (cur === lastSnap) return;
    const now = performance.now();
    const sig = signatureOf(get());
    if (now - lastChange > BURST_MS || sig !== lastSig) {
      undoStack.push(lastSnap);
      if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    }
    lastChange = now;
    lastSig = sig;
    lastSnap = cur;
    redoStack.length = 0;
    historyFlags();
  };

  const rememberPattern = () => {
    const { pattern } = get().prefs;
    if (pattern !== "none") lastPattern = pattern;
  };

  const commit = (partial: Partial<WallpaperState>) => {
    patch(partial);
    rememberPattern();
    track();
  };

  const active = () => {
    const { layers, activeId } = get();
    return layers.find((l) => l.id === activeId) ?? null;
  };

  const updateActive = (fn: (l: Layer) => Layer, transient = false) => {
    const l = active();
    if (!l) return;
    const next = fn(l);
    const layers = get().layers.map((x) => (x.id === l.id ? next : x));
    if (transient) patch({ layers });
    else commit({ layers });
  };

  const restore = (raw: string) => {
    const snap = JSON.parse(raw) as Snapshot;
    restoring = true;
    try {
      patch({ layers: snap.layers, ...withCanvas(snap.prefs), activeId: null });
    } finally {
      restoring = false;
    }
    lastSnap = snapshotOf(get());
    lastSig = signatureOf(get());
    lastChange = 0;
    rememberPattern();
    historyFlags();
  };

  const replaceActiveShape = (spec: ShapeSpec) =>
    updateActive((l) => {
      const next: Layer = { ...l, ...spec };
      if (isBlob(spec)) {
        delete next.shape;
      } else {
        delete next.d;
        delete next.points;
        delete next.smoothness;
      }
      return next;
    });

  const addLayer = (spec: ShapeSpec) => {
    const layer = randomPlacement(get().canvas, spec);
    commit({ layers: [...get().layers, layer], activeId: layer.id });
  };

  const setPattern = (pattern: PatternId) => commit({ prefs: { ...get().prefs, pattern } });

  return {
    select: (id: string | null) => patch({ activeId: id }),

    stepActive: (dir: 1 | -1) => {
      const { layers, activeId } = get();
      if (!layers.length) return;
      const i = layers.findIndex((l) => l.id === activeId);
      const next =
        i < 0 ? (dir < 0 ? layers.length - 1 : 0) : (i + dir + layers.length) % layers.length;
      patch({ activeId: layers[next].id });
    },

    addLayer,
    replaceActiveShape,

    duplicateActive: () => {
      const { layers, activeId } = get();
      const i = layers.findIndex((l) => l.id === activeId);
      if (i < 0) return;
      const src = layers[i];
      const copy: Layer = { ...src, id: newLayerId(), x: src.x + 16, y: src.y + 16 };
      const next = [...layers];
      next.splice(i + 1, 0, copy);
      commit({ layers: next, activeId: copy.id });
    },

    shuffleActive: () => {
      const l = active();
      if (!l) return;
      replaceActiveShape(
        isBlob(l)
          ? { type: "blob", ...randomBlob() }
          : { type: "shape", shape: randomShapeIndex(l.shape) },
      );
    },

    patchActive: (fields: Partial<Omit<Layer, "id">>, transient = false) =>
      updateActive((l) => ({ ...l, ...fields }), transient),

    moveActiveBy: (dx: number, dy: number, transient = false) =>
      updateActive((l) => ({ ...l, x: l.x + dx, y: l.y + dy }), transient),

    resizeActive: (size: number) => updateActive((l) => resizeAroundCenter(l, size, get().canvas)),

    setActiveFill: (fill: PaletteColor) => updateActive((l) => ({ ...l, fill })),

    cycleActiveFill: (dir: 1 | -1 = 1) =>
      updateActive((l) => ({
        ...l,
        fill: PALETTE[(PALETTE.indexOf(l.fill) + dir + PALETTE.length) % PALETTE.length],
      })),

    setActiveOverlap: (overlap: OverlapColor) => updateActive((l) => ({ ...l, overlap })),

    cycleActiveOverlap: (dir: 1 | -1) =>
      updateActive((l) => {
        const i = OVERLAP_OPTIONS.indexOf(l.overlap);
        return {
          ...l,
          overlap: OVERLAP_OPTIONS[(i + dir + OVERLAP_OPTIONS.length) % OVERLAP_OPTIONS.length],
        };
      }),

    reorderActive: (dir: LayerDirection) => {
      const { layers, activeId } = get();
      const i = layers.findIndex((l) => l.id === activeId);
      if (i < 0) return;
      const j =
        dir === Infinity
          ? layers.length - 1
          : dir === -Infinity
            ? 0
            : Math.min(layers.length - 1, Math.max(0, i + dir));
      if (j === i) return;
      const next = [...layers];
      const [l] = next.splice(i, 1);
      next.splice(j, 0, l);
      commit({ layers: next });
    },

    deleteActive: () => {
      const { layers, activeId } = get();
      if (!activeId) return;
      commit({ layers: layers.filter((l) => l.id !== activeId), activeId: null });
    },

    clearAll: () =>
      commit({ layers: [], activeId: null, prefs: { ...get().prefs, pattern: "none" } }),

    setDark: (dark: boolean) => patch({ dark }),

    setHue: (hue: number) => commit({ prefs: { ...get().prefs, hue: normDeg(hue) } }),

    setPattern,

    togglePattern: () => {
      const { pattern } = get().prefs;
      setPattern(pattern === "none" ? (lastPattern ?? DEFAULT_PATTERN) : "none");
    },

    cyclePattern: (dir: 1 | -1) => {
      const i = PATTERNS.indexOf(get().prefs.pattern);
      setPattern(PATTERNS[(i + dir + PATTERNS.length) % PATTERNS.length]);
    },

    setPatternOpacity: (opacity: number) =>
      commit({ prefs: { ...get().prefs, opacity: clampOpacity(opacity) } }),

    setPatternScale: (scale: number) =>
      commit({ prefs: { ...get().prefs, patternScale: clampScale(scale) } }),

    setFormat: (fields: FormatPatch) => {
      const { prefs, canvas, layers } = get();
      const next: Prefs = { ...prefs, ...fields };
      if (fields.custom) next.custom = { w: clampPx(fields.custom.w), h: clampPx(fields.custom.h) };
      if (next.format === "custom" && prefs.format !== "custom" && !fields.custom)
        next.custom = { ...canvas };
      const nextCanvas = withCanvas(next);
      commit({ ...nextCanvas, layers: rescaleLayers(layers, canvas, nextCanvas.canvas) });
    },

    importLayout: (layout: LayoutFile) => {
      const prefs = { ...get().prefs };
      if (layout.pattern) prefs.pattern = layout.pattern;
      if (layout.strength !== undefined) prefs.opacity = layout.strength;
      commit({ layers: layout.layers, activeId: null, prefs });
    },

    surprise: () => {
      const { prefs, canvas } = get();
      commit({
        prefs: {
          ...prefs,
          hue: Math.floor(Math.random() * 360),
          pattern: pickRandom(PATTERNS),
          opacity: +rnd(0.06, 0.25).toFixed(2),
        },
        layers: surpriseLayers(canvas),
        activeId: null,
      });
    },

    undo: () => {
      if (!undoStack.length) return;
      redoStack.push(snapshotOf(get()));
      restore(undoStack.pop()!);
    },

    redo: () => {
      if (!redoStack.length) return;
      undoStack.push(snapshotOf(get()));
      restore(redoStack.pop()!);
    },
  };
});

export const wallpaper = wallpaperStore.actions;

export const useWallpaper = <T>(selector: (s: WallpaperState) => T) =>
  useSelector(wallpaperStore, selector, { compare: shallow });

export const selectActive = (s: WallpaperState) =>
  s.layers.find((l) => l.id === s.activeId) ?? null;
export const selectActiveIndex = (s: WallpaperState) =>
  s.layers.findIndex((l) => l.id === s.activeId);

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let lastPersisted: Snapshot & { dark: boolean } = wallpaperStore.state;
wallpaperStore.subscribe((state) => {
  const changed =
    state.layers !== lastPersisted.layers ||
    state.prefs !== lastPersisted.prefs ||
    state.dark !== lastPersisted.dark;
  if (!changed) return;
  lastPersisted = state;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(
    () => persist({ layers: state.layers, prefs: state.prefs, dark: state.dark }),
    250,
  );
});
