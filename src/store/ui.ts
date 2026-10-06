import { createStore, shallow } from "@tanstack/store";
import { useSelector } from "@tanstack/react-store";
import { wallpaperStore } from "./wallpaper";

export type PanelMode = "full" | "mini" | "hidden";
export type PickMode = "add" | "replace";
export type Tab = "global" | "shape";

interface Toast {
  id: number;
  message: string;
}

export interface UiState {
  panel: PanelMode;
  tab: Tab;
  picker: PickMode | null;
  sheet: PickMode | null;
  shortcutsOpen: boolean;
  exportMenuOpen: boolean;
  toast: Toast | null;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastId = 0;

export const uiStore = createStore<UiState, ReturnType<typeof uiActions>>(
  {
    panel: "full",
    tab: "global",
    picker: null,
    sheet: null,
    shortcutsOpen: false,
    exportMenuOpen: false,
    toast: null,
  },
  (store) => uiActions(store),
);

function uiActions({
  setState,
  get,
}: {
  setState: (fn: (prev: UiState) => UiState) => void;
  get: () => UiState;
}) {
  const patch = (partial: Partial<UiState>) => setState((prev) => ({ ...prev, ...partial }));

  const setPanel = (panel: PanelMode) =>
    patch({ panel, picker: panel === "full" ? get().picker : null, exportMenuOpen: false });

  const showToast = (message: string, ms = 3000) => {
    clearTimeout(toastTimer);
    patch({ toast: { id: ++toastId, message } });
    toastTimer = setTimeout(() => patch({ toast: null }), ms);
  };

  return {
    panelHidden: () => get().panel === "hidden",
    setPanel,
    toggleMini: () => setPanel(get().panel === "mini" ? "full" : "mini"),
    toggleHidden: () => setPanel(get().panel === "hidden" ? "full" : "hidden"),
    setTab: (tab: Tab) => patch({ tab }),
    openPicker: (mode: PickMode) => patch({ picker: mode, panel: "full" }),
    closePicker: () => patch({ picker: null }),
    openSheet: (mode: PickMode) => patch({ sheet: mode }),
    closeSheet: () => patch({ sheet: null }),
    setShortcutsOpen: (shortcutsOpen: boolean) => patch({ shortcutsOpen }),
    setExportMenuOpen: (exportMenuOpen: boolean) => patch({ exportMenuOpen }),

    showToast,
  };
}

export const ui = uiStore.actions;

export const useUi = <T>(selector: (s: UiState) => T) =>
  useSelector(uiStore, selector, { compare: shallow });

let shownFor: string | null = null;
wallpaperStore.subscribe(({ activeId }) => {
  if (activeId === shownFor) return;
  shownFor = activeId;
  if (activeId) ui.setTab("shape");
});
