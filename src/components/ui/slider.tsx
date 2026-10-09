import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp, cn, decimals } from "@/lib/utils";

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
  ticks?: boolean;
  disabled?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLElement>) => void;
}

const GAP = 6;
const TICK = 4;
const MIN_TICK_SPACING = 8;

const ACTIVE_TRACK = "var(--color-primary)";
const INACTIVE_TRACK = "var(--color-secondary-container)";
const DISABLED_ACTIVE_TRACK = "color-mix(in srgb, var(--color-on-surface) 38%, transparent)";
const DISABLED_INACTIVE_TRACK = "color-mix(in srgb, var(--color-on-surface) 12%, transparent)";

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
  ticks = false,
  disabled = false,
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

  const valueRef = useRef(value);
  valueRef.current = value;

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

  const count = Math.round((max - min) / step);
  const showTicks =
    ticks && count > 0 && Number.isFinite(count) && width / count >= MIN_TICK_SPACING;

  const tickMarks = showTicks
    ? Array.from({ length: count + 1 }, (_, i) => {
        const pos = clamp((i / count) * width, TICK, width - TICK);
        return { pos, active: pos < x };
      }).filter((t) => Math.abs(t.pos - x) >= GAP + TICK / 2)
    : [];

  const seek = useCallback(
    (clientX: number) => {
      const rect = wrap.current?.getBoundingClientRect();
      if (!rect?.width) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const precision = Math.max(decimals(step), decimals(min));
      const raw = min + Math.round((ratio * (max - min)) / step) * step;
      const stepped = clamp(+raw.toFixed(precision), min, max);
      if (stepped !== valueRef.current) onChange(stepped);
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

  const vars = {
    "--active": disabled ? DISABLED_ACTIVE_TRACK : ACTIVE_TRACK,
    "--inactive": disabled ? DISABLED_INACTIVE_TRACK : INACTIVE_TRACK,
    ...(track ? { "--track": track } : null),
  } as React.CSSProperties;

  return (
    <div
      ref={wrap}
      aria-disabled={disabled || undefined}
      onPointerDown={(e) => {
        if (disabled) return;
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
        if (pressed && !disabled) seek(e.clientX);
      }}
      onPointerUp={(e) => {
        if (!disabled) endPress(e);
      }}
      onPointerCancel={(e) => {
        if (!disabled) endPress(e, true);
      }}
      onDoubleClick={disabled ? undefined : onReset}
      className={cn(
        "relative h-10 w-full shrink-0 cursor-pointer touch-pan-y select-none",
        disabled && "cursor-not-allowed",
        disabled && track && "opacity-38",
        className,
      )}
      style={vars}
    >
      <input
        ref={input}
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
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
        className="pointer-events-none absolute top-2.5 left-0 h-5 rounded-l-lg rounded-r-sm bg-[image:var(--track,linear-gradient(var(--active),var(--active)))] bg-[length:var(--w)_100%] bg-no-repeat"
        style={{ width: activeWidth }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-2.5 right-0 h-5 rounded-l-sm rounded-r-lg bg-[image:var(--track,linear-gradient(var(--inactive),var(--inactive)))] bg-[length:var(--w)_100%] bg-no-repeat"
        style={{ left: inactiveLeft, backgroundPosition: `${-inactiveLeft}px 0` }}
      />
      {showTicks && (
        <div aria-hidden className="pointer-events-none absolute top-2.5 left-0 h-5 w-full">
          {tickMarks.map((t, i) => (
            <span
              key={i}
              className={cn(
                "absolute top-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full opacity-80",
                track
                  ? "bg-surface"
                  : t.active
                    ? disabled
                      ? "bg-inverse-on-surface"
                      : "bg-on-primary"
                    : disabled
                      ? "bg-on-surface"
                      : "bg-on-secondary-container",
              )}
              style={{ left: t.pos }}
            />
          ))}
        </div>
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0.5 z-1 -ml-0.5 h-9 w-1 rounded-sm shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-surface)_80%,transparent)]",
          disabled ? "bg-on-surface/38" : track ? "bg-on-surface" : "bg-primary",
          (pressed || focused) && "-ml-px w-0.5",
          focused && "outline-2 outline-offset-1 outline-primary",
        )}
        style={{ left: x }}
      />
    </div>
  );
}
