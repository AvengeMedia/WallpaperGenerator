import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePatternTile } from "@/hooks/use-pattern-tile";
import { layerPath, layerTransform } from "@/lib/layer";
import { patternUrl } from "@/lib/patterns";
import { normDeg } from "@/lib/utils";
import { selectActive, useWallpaper, wallpaper, wallpaperStore } from "@/store/wallpaper";
import { ui } from "@/store/ui";
import { LayerShape } from "./layer-shape";

interface StageProps {
  scale: number;
}

const DRAG_THRESHOLD = 5;
const layerIdOf = (target: EventTarget | null) =>
  (target as Element | null)?.closest?.("[data-id]")?.getAttribute("data-id") ?? null;

export function Stage({ scale }: StageProps) {
  const { layers, canvas, pattern, patternOpacity, patternScale } = useWallpaper((s) => ({
    layers: s.layers,
    canvas: s.canvas,
    pattern: s.prefs.pattern,
    patternOpacity: s.prefs.opacity,
    patternScale: s.prefs.patternScale,
  }));
  const active = useWallpaper(selectActive);
  const tile = usePatternTile(pattern);
  const svgRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef(scale);
  useLayoutEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      const id = layerIdOf(e.target) ?? wallpaperStore.state.activeId;
      if (!id) return;
      e.preventDefault();
      wallpaper.select(id);
      const l = selectActive(wallpaperStore.state);
      if (!l) return;
      const delta = e.deltaY || e.deltaX;
      if (e.shiftKey) {
        const step = e.ctrlKey || e.metaKey ? 0.002 : 0.01;
        wallpaper.patchActive({ rot: normDeg(l.rot + delta * step) });
        return;
      }
      wallpaper.resizeActive(l.size * Math.exp(-delta * 0.001));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur();
    const id = layerIdOf(e.target);
    if (!id) {
      wallpaper.select(null);
      return;
    }
    e.preventDefault();
    wallpaper.select(id);
    const start = selectActive(wallpaperStore.state);
    if (!start) return;
    const origin = { x: e.clientX, y: e.clientY, lx: start.x, ly: start.y };
    let moved = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - origin.x;
      const dy = ev.clientY - origin.y;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      moved = true;
      wallpaper.patchActive(
        { x: origin.lx + dx / scaleRef.current, y: origin.ly + dy / scaleRef.current },
        true,
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) wallpaper.patchActive({});
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onContextMenu = (e: ReactPointerEvent<SVGSVGElement>) => {
    const id = layerIdOf(e.target);
    if (!id) return;
    e.preventDefault();
    wallpaper.select(id);
    ui.setTab("shape");
  };

  const src = patternUrl(pattern);
  const stageStyle = {
    width: canvas.w,
    height: canvas.h,
    transform: `translate(-50%, -50%) scale(${scale})`,
    "--pattern": src ? `url("${src}")` : "none",
    "--pattern-size": tile ? `${tile[0] * patternScale}px ${tile[1] * patternScale}px` : "auto",
  } as CSSProperties;

  return (
    <div className="absolute top-1/2 left-1/2 origin-center bg-surface" style={stageStyle}>
      <div
        aria-hidden
        className="absolute inset-0 pattern-mask"
        style={{ opacity: patternOpacity }}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvas.w} ${canvas.h}`}
        width={canvas.w}
        height={canvas.h}
        className="absolute top-0 left-0 touch-none overflow-visible select-none"
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
      >
        {layers.map((l, i) => (
          <LayerShape key={l.id} layer={l} index={i} below={layers.slice(0, i)} />
        ))}
        {active && (
          <path
            d={layerPath(active)}
            transform={layerTransform(active)}
            vectorEffect="non-scaling-stroke"
            fill="none"
            stroke="var(--md-sys-color-on-surface)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            className="pointer-events-none"
          />
        )}
      </svg>
    </div>
  );
}
