import { useHotkeys, type HotkeyCallback, type RegisterableHotkey } from "@tanstack/react-hotkeys";
import { openShapes } from "@/components/panel/shape-tab";
import { useExport } from "@/hooks/use-export";
import { PALETTE } from "@/lib/palette";
import { wallpaper, wallpaperStore } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";

const isRange = (e: KeyboardEvent) =>
  e.target instanceof HTMLInputElement && e.target.type === "range";
const hasActive = () => wallpaperStore.state.activeId !== null;

export const useShortcuts = () => {
  const { picking, sheetOpen, dialogOpen, panel } = useUi((s) => ({
    picking: s.picker !== null,
    sheetOpen: s.sheet !== null,
    dialogOpen: s.shortcutsOpen,
    panel: s.panel,
  }));
  const { exportPng } = useExport();

  const overlayOpen = picking || sheetOpen || dialogOpen;
  const editing = !overlayOpen;

  const bind = (
    hotkey: RegisterableHotkey,
    callback: HotkeyCallback,
    enabled = editing,
    preventDefault = true,
  ) => ({
    hotkey,
    callback,
    options: { enabled, preventDefault },
  });

  const withActive =
    (fn: () => void): HotkeyCallback =>
    () =>
      hasActive() && fn();

  useHotkeys(
    [
      bind("Mod+Z", wallpaper.undo, !sheetOpen && !dialogOpen),
      bind("Mod+Shift+Z", wallpaper.redo, !sheetOpen && !dialogOpen),
      bind("Mod+Y", wallpaper.redo, !sheetOpen && !dialogOpen),
      bind("?", () => ui.setShortcutsOpen(true), !dialogOpen),

      bind("Escape", ui.closePicker, picking),
      bind("N", ui.closePicker, picking),
      bind("Escape", ui.closeSheet, sheetOpen),
      bind("N", ui.closeSheet, sheetOpen),

      bind(
        "Enter",
        (e) => {
          if (e.target instanceof HTMLButtonElement) return;
          wallpaper.setDark(!wallpaperStore.state.dark);
        },
        editing,
        false,
      ),
      bind("[", () => wallpaper.stepActive(-1)),
      bind("]", () => wallpaper.stepActive(1)),
      bind(
        "ArrowUp",
        (e) => !isRange(e) && hasActive() && wallpaper.reorderActive(1),
        editing,
        false,
      ),
      bind(
        "Shift+ArrowUp",
        withActive(() => wallpaper.reorderActive(Infinity)),
      ),
      bind(
        "PageUp",
        withActive(() => wallpaper.reorderActive(1)),
      ),
      bind(
        "ArrowDown",
        (e) => !isRange(e) && hasActive() && wallpaper.reorderActive(-1),
        editing,
        false,
      ),
      bind(
        "Shift+ArrowDown",
        withActive(() => wallpaper.reorderActive(-Infinity)),
      ),
      bind(
        "PageDown",
        withActive(() => wallpaper.reorderActive(-1)),
      ),
      bind("Escape", () => wallpaper.select(null)),
      bind("N", () => openShapes("add")),
      bind("Delete", withActive(wallpaper.deleteActive)),
      bind("Backspace", withActive(wallpaper.deleteActive)),
      bind("M", withActive(wallpaper.shuffleActive)),
      bind("C", withActive(wallpaper.cycleActiveFill)),
      bind(
        "O",
        withActive(() => wallpaper.cycleActiveOverlap(1)),
      ),
      bind(
        "Shift+O",
        withActive(() => wallpaper.cycleActiveOverlap(-1)),
      ),
      bind("R", wallpaper.clearAll),
      bind("P", () => wallpaper.cyclePattern(1)),
      bind("Shift+P", () => wallpaper.cyclePattern(-1)),
      bind("=", () => wallpaper.setPatternOpacity(wallpaperStore.state.prefs.opacity + 0.02)),
      bind("+", () => wallpaper.setPatternOpacity(wallpaperStore.state.prefs.opacity + 0.02)),
      bind("-", () => wallpaper.setPatternOpacity(wallpaperStore.state.prefs.opacity - 0.02)),
      ...PALETTE.map((fill, i) =>
        bind(
          `${i + 1}` as RegisterableHotkey,
          withActive(() => wallpaper.setActiveFill(fill)),
        ),
      ),
      bind(
        "0",
        withActive(() => wallpaper.patchActive({ rot: 0 })),
      ),
      bind(",", () => wallpaper.setPatternScale(wallpaperStore.state.prefs.patternScale / 1.15)),
      bind("<", () => wallpaper.setPatternScale(wallpaperStore.state.prefs.patternScale / 1.15)),
      bind(".", () => wallpaper.setPatternScale(wallpaperStore.state.prefs.patternScale * 1.15)),
      bind(">", () => wallpaper.setPatternScale(wallpaperStore.state.prefs.patternScale * 1.15)),
      bind("Z", wallpaper.undo),
      bind("Y", wallpaper.redo),
      bind("U", wallpaper.surprise),
      bind("B", wallpaper.addBlob),
      bind("S", () => (panel === "hidden" ? ui.toggleHidden() : ui.toggleMini())),
      bind("Shift+S", () => {
        ui.toggleHidden();
        if (panel !== "hidden") ui.showToast("Panel hidden. Press Shift+S to bring it back.", 2500);
      }),
      bind("E", () => void exportPng(2)),
      bind("Shift+E", () => void exportPng(1)),
    ],
    { ignoreInputs: true },
  );
};
