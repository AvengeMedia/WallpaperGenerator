import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/globals.css";
import { App } from "@/components/app";
import { selectActive, selectActiveIndex, wallpaperStore } from "@/store/wallpaper";

// Read-only snapshot for the keyboard regression suite. The sidebar is not
// mounted in mini/hidden panel modes, so tests read shape state here instead.
if (import.meta.env.DEV) {
  Object.defineProperty(window, "__editor", {
    configurable: true,
    value: () => {
      const state = wallpaperStore.state;
      const active = selectActive(state);
      return {
        activeId: state.activeId,
        index: selectActiveIndex(state),
        layers: state.layers.length,
        fill: active?.fill ?? null,
        overlap: active?.overlap ?? null,
        opacity: active?.opacity === undefined ? 100 : Math.round(active.opacity * 100),
        x: active?.x ?? null,
        y: active?.y ?? null,
        size: active?.size ?? null,
        rot: active?.rot ?? null,
      };
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
