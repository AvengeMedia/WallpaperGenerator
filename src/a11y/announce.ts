import { describeLayerPosition, describeShape } from "@/lib/describe";
import { selectActive, selectActiveIndex, wallpaperStore } from "@/store/wallpaper";
import { ui } from "@/store/ui";

let timer: ReturnType<typeof setTimeout> | undefined;
let pending = "";

export const say = (text: string, gap = 350) => {
  pending = text;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (pending) ui.announce(pending);
  }, gap);
};

export const sayActive = (gap?: number) => {
  const active = selectActive(wallpaperStore.state);
  if (active) say(describeShape(active), gap);
};

export const sayLayerPosition = (before: number) => {
  const after = selectActiveIndex(wallpaperStore.state);
  if (after < 0 || after === before) return;
  say(describeLayerPosition(after, wallpaperStore.state.layers.length), 120);
};
