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
  const { layers, canvas, pattern, patternOpacity, patternScale } = useWallpaper((state) => ({
    layers: state.layers,
    canvas: state.canvas,
    pattern: state.prefs.pattern,
    patternOpacity: state.prefs.opacity,
    patternScale: state.prefs.patternScale,
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
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const activeLayer = selectActive(wallpaperStore.state);
      if (!activeLayer) return;
      const delta = event.deltaY || event.deltaX;
      if (event.shiftKey) {
        const step = event.ctrlKey || event.metaKey ? 0.002 : 0.01;
        wallpaper.patchActive({ rot: normDeg(activeLayer.rot + delta * step) });
        return;
      }
      const { canvas } = wallpaperStore.state;
      const stepPx = Math.min(canvas.width, canvas.height) / 100;

      wallpaper.resizeActive(
        event.ctrlKey || event.metaKey
          ? activeLayer.size + Math.sign(-delta) * stepPx
          : activeLayer.size * Math.exp(-delta * 0.001),
      );
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur();
    const id = layerIdOf(event.target);
    if (!id) {
      wallpaper.select(null);
      return;
    }
    event.preventDefault();
    wallpaper.select(id);
    const start = selectActive(wallpaperStore.state);
    if (!start) return;
    const origin = { x: event.clientX, y: event.clientY, lx: start.x, ly: start.y };
    let moved = false;

    const move = (pointerEvent: PointerEvent) => {
      const deltaX = pointerEvent.clientX - origin.x;
      const deltaY = pointerEvent.clientY - origin.y;
      if (!moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
      moved = true;
      wallpaper.patchActive(
        { x: origin.lx + deltaX / scaleRef.current, y: origin.ly + deltaY / scaleRef.current },
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

  const onContextMenu = (event: ReactPointerEvent<SVGSVGElement>) => {
    const id = layerIdOf(event.target);
    if (!id) return;
    event.preventDefault();
    wallpaper.select(id);
    ui.setTab("shape");
  };

  const src = patternUrl(pattern);
  const stageStyle = {
    width: canvas.width,
    height: canvas.height,
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
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        width={canvas.width}
        height={canvas.height}
        className="absolute top-0 left-0 touch-none overflow-visible select-none"
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
      >
        {layers.map((layer, index) => (
          <LayerShape key={layer.id} layer={layer} index={index} below={layers.slice(0, index)} />
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
