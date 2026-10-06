import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useWallpaper } from "@/store/wallpaper";
import { Stage } from "./stage";

export function Preview() {
  const canvas = useWallpaper((s) => s.canvas);
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <main className="[container-type:size] grid min-w-0 flex-1 place-items-center">
      <div
        ref={ref}
        className="relative overflow-hidden bg-surface shadow-[0_0_0_1px] shadow-on-surface/14"
        style={style}
      >
        <Stage scale={scale} />
      </div>
    </main>
  );
}
