import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp, cn } from "@/lib/utils";

interface SliderProps {
  id?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  track?: string;
  label?: string;
  className?: string;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLElement>) => void;
}

const GAP = 6;

export function Slider({
  id,
  value,
  min,
  max,
  step,
  onChange,
  onReset,
  track,
  label,
  className,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: SliderProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const pointerFocus = useRef(false);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const f = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const x = f * width;
  const activeWidth = Math.max(0, x - GAP);
  const inactiveLeft = Math.min(width, x + GAP);

  const seek = useCallback(
    (clientX: number) => {
      const rect = wrap.current?.getBoundingClientRect();
      if (!rect?.width) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const stepped = min + Math.round((ratio * (max - min)) / step) * step;
      onChange(clamp(stepped, min, max));
    },
    [min, max, step, onChange],
  );

  const endPress = (e: React.PointerEvent<HTMLElement>, cancelled = false) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    setPressed(false);
    onPointerUp?.(e);
    if (cancelled) onPointerCancel?.(e);
  };

  useEffect(() => {
    wrap.current?.style.setProperty("--w", `${width}px`);
  }, [width]);

  return (
    <div
      ref={wrap}
      onPointerDown={(e) => {
        pointerFocus.current = true;
        setFocused(false);
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setPressed(true);
        input.current?.focus();
        seek(e.clientX);
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        if (pressed) seek(e.clientX);
      }}
      onPointerUp={(e) => endPress(e)}
      onPointerCancel={(e) => endPress(e, true)}
      onDoubleClick={onReset}
      className={cn(
        "relative h-10 w-full shrink-0 cursor-pointer touch-pan-y select-none",
        className,
      )}
      style={track ? ({ "--track": track } as React.CSSProperties) : undefined}
    >
      <input
        ref={input}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(+e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Home") {
            e.preventDefault();
            onChange(min);
            return;
          }
          if (e.key === "End") {
            e.preventDefault();
            onChange(max);
            return;
          }
          const dir =
            e.key === "ArrowLeft" || e.key === "ArrowDown"
              ? -1
              : e.key === "ArrowRight" || e.key === "ArrowUp"
                ? 1
                : 0;
          if (!e.shiftKey || !dir) return;
          e.preventDefault();
          onChange(clamp(+(value + dir * step * 10).toFixed(4), min, max));
        }}
        className="pointer-events-none absolute inset-0 m-0 h-full w-full appearance-none opacity-0"
        onFocus={() => setFocused(!pointerFocus.current)}
        onBlur={() => {
          pointerFocus.current = false;
          setFocused(false);
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-2.5 left-0 h-5 rounded-l-lg rounded-r-sm bg-[image:var(--track,linear-gradient(var(--color-primary),var(--color-primary)))] bg-[length:var(--w)_100%] bg-no-repeat"
        style={{ width: activeWidth }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-2.5 right-0 h-5 rounded-l-sm rounded-r-lg bg-[image:var(--track,linear-gradient(var(--color-on-surface),var(--color-on-surface)))] bg-[length:var(--w)_100%] bg-no-repeat [&:not([data-track])]:opacity-22"
        data-track={track || undefined}
        style={{ left: inactiveLeft, backgroundPosition: `${-inactiveLeft}px 0` }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0.5 z-1 -ml-0.5 h-9 w-1 rounded-sm shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-surface)_80%,transparent)]",
          track ? "bg-on-surface" : "bg-primary",
          (pressed || focused) && "-ml-px w-0.5",
          focused && "outline-2 outline-offset-1 outline-primary",
        )}
        style={{ left: x }}
      />
    </div>
  );
}
