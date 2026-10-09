import {
  useHotkeys,
  type HotkeyCallback,
  type RegisterableHotkey,
  type UseHotkeyOptions,
} from "@tanstack/react-hotkeys";
import { openShapes } from "@/components/panel/shape-tab";
import { describeShape } from "@/lib/describe";
import { focusCanvas, focusSidebar, sidebarEl } from "@/components/ui/focus";
import { PALETTE } from "@/lib/palette";
import { patternLabel } from "@/lib/patterns";
import { clamp, normDeg, round } from "@/lib/utils";
import { say, sayActive, sayLayerPosition } from "@/hooks/shortcuts/announce";
import { armable } from "@/hooks/shortcuts/arm";
import {
  selectActive,
  selectActiveIndex,
  useWallpaper,
  wallpaper,
  wallpaperStore,
} from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";

const hasActive = () => wallpaperStore.state.activeId !== null;

const step = (e: KeyboardEvent) => (e.shiftKey ? 10 : 1);

const moveBy = (dx: number, dy: number, e: KeyboardEvent) => {
  if (!hasActive()) return;
  const s = step(e);
  wallpaper.moveActiveBy(dx * s, dy * s);
  sayActive();
};

const snap15 = (rot: number, dir: number) =>
  normDeg(dir > 0 ? Math.ceil((rot + 0.01) / 15) * 15 : Math.floor((rot - 0.01) / 15) * 15);

const rotateBy = (dir: number, e: KeyboardEvent) => {
  const active = selectActive(wallpaperStore.state);
  if (!active) return;
  const cur = normDeg(active.rot);
  wallpaper.patchActive({ rot: e.shiftKey ? snap15(cur, dir) : normDeg(cur + dir) });
  sayActive();
};

const resizeBy = (dir: number, e: KeyboardEvent) => {
  const active = selectActive(wallpaperStore.state);
  if (!active) return;
  wallpaper.resizeActive(active.size + dir * step(e));
  sayActive();
};

const opacityBy = (dir: number, e: KeyboardEvent) => {
  const active = selectActive(wallpaperStore.state);
  if (!active) return;
  const next = clamp(
    Math.round(((active.opacity ?? 1) + dir * (e.shiftKey ? 0.1 : 0.01)) * 100),
    10,
    100,
  );
  wallpaper.patchActive({ opacity: next >= 100 ? undefined : next / 100 });
  sayActive();
};

const reorder = (dir: number) => {
  const before = selectActiveIndex(wallpaperStore.state);
  wallpaper.reorderActive(dir);
  sayLayerPosition(before);
};

const deleteActive = () => {
  if (!hasActive()) return;
  wallpaper.deleteActive();
  say("Shape deleted", 150);
};

const stepZone = (dir: 1 | -1, e: KeyboardEvent) => {
  const { layers, activeId } = wallpaperStore.state;
  const i = layers.findIndex((l) => l.id === activeId);
  const next = i < 0 ? (dir > 0 ? 0 : layers.length - 1) : i + dir;
  if (next < 0 || next >= layers.length) {
    if (focusSidebar(dir > 0 ? "start" : "end")) e.preventDefault();
    return;
  }
  e.preventDefault();
  wallpaper.select(layers[next].id);
  say(describeShape(layers[next]), 120);
};

const switchZone = (edge: "start" | "end", canvasFocused: boolean) => {
  if (!canvasFocused || !focusSidebar(edge)) focusCanvas();
};

const leaveCanvas = (bgMode: boolean) => {
  if (bgMode) {
    ui.toggleBgMode(false);
    return;
  }
  if (!sidebarEl()) {
    ui.setPanel("full");
    requestAnimationFrame(() => focusSidebar("start"));
    return;
  }
  focusSidebar("start");
};

const setPatternStrength = (dir: number, e: KeyboardEvent) => {
  wallpaper.setPatternOpacity(wallpaperStore.state.prefs.opacity + dir * (e.shiftKey ? 0.1 : 0.01));
  say(`Pattern strength ${Math.round(wallpaperStore.state.prefs.opacity * 100)}%`);
};

const setPatternSize = (dir: number, e: KeyboardEvent) => {
  wallpaper.setPatternScale(
    wallpaperStore.state.prefs.patternScale + dir * (e.shiftKey ? 0.5 : 0.1),
  );
  say(`Pattern size ${round(wallpaperStore.state.prefs.patternScale, 1)}`);
};

const cyclePattern = (dir: 1 | -1) => {
  wallpaper.cyclePattern(dir);
  say(`Pattern: ${patternLabel(wallpaperStore.state.prefs.pattern)}`, 250);
};

const togglePattern = () => {
  wallpaper.togglePattern();
  ui.announce(
    wallpaperStore.state.prefs.pattern === "none"
      ? "Background pattern off"
      : "Background pattern on",
  );
};

interface BindOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

const bind = (
  hotkey: RegisterableHotkey,
  callback: HotkeyCallback,
  { preventDefault = true, enabled, ignoreInputs }: BindOptions = {},
) => {
  const options: UseHotkeyOptions = { preventDefault };
  if (enabled !== undefined) options.enabled = enabled;
  if (ignoreInputs !== undefined) options.ignoreInputs = ignoreInputs;
  return { hotkey, callback, options };
};

// only active when pressed without modifier
const plain = (run: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
  if (!e.altKey && !e.ctrlKey && !e.metaKey) run(e);
};

// some commands should not fire again on holding them
const once = (run: () => void) => (e: KeyboardEvent) => {
  if (!e.repeat) run();
};

export const useShortcuts = () => {
  const { picking, sheetOpen, dialogOpen, exportMenuOpen, bgMode, canvasFocused } = useUi((s) => ({
    picking: s.picker !== null,
    sheetOpen: s.sheet !== null,
    dialogOpen: s.shortcutsOpen,
    exportMenuOpen: s.exportMenuOpen,
    bgMode: s.bgMode,
    canvasFocused: s.canvasFocused,
  }));
  const active = useWallpaper((s) => s.activeId !== null);

  const modal = picking || sheetOpen || dialogOpen;
  const overlay = modal || exportMenuOpen;
  const live = !overlay;
  const onCanvas = canvasFocused && live;
  const shapeKeys = live && active && !bgMode;
  const bgKeys = live && bgMode;

  useHotkeys(
    [
      bind("Mod+Z", wallpaper.undo, { enabled: !modal, ignoreInputs: true }),
      bind("Mod+Shift+Z", wallpaper.redo, { enabled: !modal, ignoreInputs: true }),
      bind("Mod+Y", wallpaper.redo, { enabled: !modal, ignoreInputs: true }),
      bind("Mod+S", () => ui.setExportMenuOpen(!exportMenuOpen), {
        enabled: !modal,
        ignoreInputs: true,
      }),
      bind("?", () => ui.setShortcutsOpen(true), { enabled: !dialogOpen }),
      bind("F1", () => ui.setShortcutsOpen(true), { enabled: !dialogOpen }),
      bind("F6", () => switchZone("start", canvasFocused), {
        enabled: !overlay,
        ignoreInputs: false,
      }),
      bind("Shift+F6", () => switchZone("end", canvasFocused), {
        enabled: !overlay,
        ignoreInputs: false,
      }),
      bind("N", () => openShapes("add"), { enabled: !overlay }),
    ],
    { conflictBehavior: "allow" },
  );

  useHotkeys(
    [
      bind("Tab", (e) => stepZone(1, e), { enabled: onCanvas, preventDefault: false }),
      bind("Shift+Tab", (e) => stepZone(-1, e), { enabled: onCanvas, preventDefault: false }),
      bind("Escape", () => leaveCanvas(bgMode), { enabled: onCanvas }),

      bind("Delete", deleteActive, { enabled: shapeKeys }),
      bind("Backspace", deleteActive, { enabled: shapeKeys }),
      bind(
        "Mod+D",
        () => {
          if (!hasActive()) return;
          wallpaper.duplicateActive();
          sayActive(150);
        },
        { enabled: shapeKeys, ignoreInputs: true },
      ),

      ...(
        [
          ["ArrowUp", 0, -1],
          ["[KeyW]", 0, -1],
          ["ArrowDown", 0, 1],
          ["[KeyS]", 0, 1],
          ["ArrowLeft", -1, 0],
          ["[KeyA]", -1, 0],
          ["ArrowRight", 1, 0],
          ["[KeyD]", 1, 0],
        ] as const
      ).flatMap(([key, dx, dy]) => [
        bind(
          key as RegisterableHotkey,
          plain((e) => moveBy(dx, dy, e)),
          { enabled: shapeKeys },
        ),
        bind(
          `Shift+${key}` as RegisterableHotkey,
          plain((e) => moveBy(dx, dy, e)),
          { enabled: shapeKeys },
        ),
      ]),

      ...(
        [
          [",", -1],
          [".", 1],
          ["[KeyQ]", -1],
          ["[KeyE]", 1],
        ] as const
      ).flatMap(([key, dir]) => [
        bind(
          key as RegisterableHotkey,
          plain((e) => rotateBy(dir, e)),
          { enabled: shapeKeys },
        ),
        bind(
          `Shift+${key}` as RegisterableHotkey,
          plain((e) => rotateBy(dir, e)),
          { enabled: shapeKeys },
        ),
      ]),

      bind("R", (e) => resizeBy(1, e), { enabled: shapeKeys }),
      bind("Shift+R", (e) => resizeBy(1, e), { enabled: shapeKeys }),
      bind("F", (e) => resizeBy(-1, e), { enabled: shapeKeys }),
      bind("Shift+F", (e) => resizeBy(-1, e), { enabled: shapeKeys }),

      bind("T", (e) => opacityBy(1, e), { enabled: shapeKeys }),
      bind("Shift+T", (e) => opacityBy(1, e), { enabled: shapeKeys }),
      bind("G", (e) => opacityBy(-1, e), { enabled: shapeKeys }),
      bind("Shift+G", (e) => opacityBy(-1, e), { enabled: shapeKeys }),

      ...PALETTE.map((fill, i) =>
        bind(
          `[Digit${i + 1}]` as RegisterableHotkey,
          plain(() => {
            wallpaper.setActiveFill(fill);
            sayActive(150);
          }),
          { enabled: shapeKeys },
        ),
      ),

      ...PALETTE.map((fill, i) =>
        bind(
          `Shift+[Digit${i + 1}]` as RegisterableHotkey,
          plain(() => {
            wallpaper.setActiveOverlap(fill);
            sayActive(150);
          }),
          { enabled: shapeKeys },
        ),
      ),
      bind(
        "Shift+[Digit0]",
        plain(() => {
          wallpaper.setActiveOverlap("none");
          sayActive(150);
        }),
        { enabled: shapeKeys },
      ),
      bind(
        "C",
        () => {
          wallpaper.cycleActiveFill(1);
          sayActive(150);
        },
        { enabled: shapeKeys },
      ),
      bind(
        "Shift+C",
        () => {
          wallpaper.cycleActiveFill(-1);
          sayActive(150);
        },
        { enabled: shapeKeys },
      ),

      bind("U", () => reorder(1), { enabled: shapeKeys }),
      bind("Shift+U", () => reorder(Infinity), { enabled: shapeKeys }),
      bind("J", () => reorder(-1), { enabled: shapeKeys }),
      bind("Shift+J", () => reorder(-Infinity), { enabled: shapeKeys }),

      bind(
        "M",
        once(() => {
          if (!hasActive()) return;
          wallpaper.shuffleActive();
          sayActive(150);
        }),
        { enabled: shapeKeys },
      ),
      bind("X", (e) => armable(e, "x", "Clear everything? Press X again", wallpaper.clearAll), {
        enabled: live,
      }),
      bind("I", (e) => armable(e, "i", "Surprise me? Press I again", wallpaper.surprise), {
        enabled: live,
      }),

      bind(
        "B",
        once(() => ui.toggleBgMode(!bgMode)),
        { enabled: live },
      ),
      bind("Shift+B", once(togglePattern), { enabled: live }),
      bind("P", once(ui.cyclePanel), { enabled: live }),
      bind("ArrowUp", () => cyclePattern(-1), { enabled: bgKeys }),
      bind("Shift+ArrowUp", () => cyclePattern(-1), { enabled: bgKeys }),
      bind("ArrowDown", () => cyclePattern(1), { enabled: bgKeys }),
      bind("Shift+ArrowDown", () => cyclePattern(1), { enabled: bgKeys }),
      bind("ArrowLeft", (e) => setPatternStrength(-1, e), { enabled: bgKeys }),
      bind("Shift+ArrowLeft", (e) => setPatternStrength(-1, e), { enabled: bgKeys }),
      bind("ArrowRight", (e) => setPatternStrength(1, e), { enabled: bgKeys }),
      bind("Shift+ArrowRight", (e) => setPatternStrength(1, e), { enabled: bgKeys }),
      bind("T", (e) => setPatternStrength(1, e), { enabled: bgKeys }),
      bind("Shift+T", (e) => setPatternStrength(1, e), { enabled: bgKeys }),
      bind("G", (e) => setPatternStrength(-1, e), { enabled: bgKeys }),
      bind("Shift+G", (e) => setPatternStrength(-1, e), { enabled: bgKeys }),
      bind("R", (e) => setPatternSize(1, e), { enabled: bgKeys }),
      bind("Shift+R", (e) => setPatternSize(1, e), { enabled: bgKeys }),
      bind("F", (e) => setPatternSize(-1, e), { enabled: bgKeys }),
      bind("Shift+F", (e) => setPatternSize(-1, e), { enabled: bgKeys }),
    ],
    { conflictBehavior: "allow" },
  );

  useHotkeys(
    [
      bind("Escape", ui.closePicker, { enabled: picking }),
      bind("N", ui.closePicker, { enabled: picking }),
      bind("Escape", ui.closeSheet, { enabled: sheetOpen }),
      bind("N", ui.closeSheet, { enabled: sheetOpen }),
    ],
    { ignoreInputs: true, conflictBehavior: "allow" },
  );
};
