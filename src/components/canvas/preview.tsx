import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ExportMenu } from "@/components/panel/export-menu";
import { useWallpaper, wallpaper, wallpaperStore } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";
import { BgModeBadge } from "./bg-mode-badge";
import { Stage } from "./stage";

export function Preview() {
  const canvas = useWallpaper((s) => s.canvas);
  const hidden = useUi((s) => s.panel === "hidden");
  const ref = useRef<HTMLDivElement>(null);
  const pointerFocus = useRef(false);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () =>
      setScale(Math.max(el.clientWidth / canvas.w, el.clientHeight / canvas.h) || 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.w, canvas.h]);

  const ar = canvas.w / canvas.h;
  const style = {
    "--ar": ar,
    width: `min(100cqw, 100cqh * ${ar})`,
    aspectRatio: ar,
  } as CSSProperties;

  const onPointerDown = () => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    pointerFocus.current = true;
    el.focus({ preventScroll: true });
  };

  const onFocus = () => {
    ui.setCanvasFocused(true);
    if (pointerFocus.current) {
      pointerFocus.current = false;
      return;
    }
    const { layers, activeId: selected } = wallpaperStore.state;
    if (layers.length && !selected) wallpaper.select(layers[0].id);
  };

  return (
    <main className="[container-type:size] relative grid min-w-0 flex-1 place-items-center">
      {hidden && (
        <div className="absolute top-3 left-3">
          <ExportMenu trigger={false} />
        </div>
      )}
      <div
        ref={ref}
        data-canvas
        tabIndex={0}
        role="application"
        aria-label="Wallpaper canvas"
        onFocus={onFocus}
        onBlur={() => ui.setCanvasFocused(false)}
        onPointerDown={onPointerDown}
        className="relative overflow-hidden bg-surface shadow-[0_0_0_1px] shadow-on-surface/14 outline-none"
        style={style}
      >
        <Stage scale={scale} />
      </div>
      <BgModeBadge />
    </main>
  );
}
