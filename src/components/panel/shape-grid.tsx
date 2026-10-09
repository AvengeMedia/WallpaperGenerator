import { useRef, useState } from "react";
import type { ShapeSpec } from "@/lib/layer";
import { prettyName, randomBlob, SHAPES } from "@/lib/shapes";
import { cn } from "@/lib/utils";
import { ShapeCard } from "./shape-card";

interface ShapeGridProps {
  currentShape?: number;
  onPick: (spec: ShapeSpec, shiftKey: boolean) => void;
  className?: string;
}

const columnCount = (el: HTMLElement) =>
  Math.max(1, getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter(Boolean).length);

export function ShapeGrid({ currentShape, onPick, className }: ShapeGridProps) {
  const [blob, setBlob] = useState(randomBlob);
  const [active, setActive] = useState(currentShape === undefined ? 0 : currentShape + 1);
  const grid = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const last = buttons.length - 1;
    const cols = columnCount(e.currentTarget);
    const next =
      e.key === "ArrowRight"
        ? i + 1
        : e.key === "ArrowLeft"
          ? i - 1
          : e.key === "ArrowDown"
            ? i + cols
            : e.key === "ArrowUp"
              ? i - cols
              : e.key === "Home"
                ? 0
                : e.key === "End"
                  ? last
                  : undefined;
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    const target = Math.max(0, Math.min(last, next));
    setActive(target);
    buttons[target]?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={grid}
      onKeyDown={onKeyDown}
      className={cn(
        "scrollbar-hidden grid content-start gap-1 overflow-y-auto overscroll-contain",
        className,
      )}
    >
      <ShapeCard
        d={blob.d}
        name="Random blob"
        tabIndex={active === 0 ? 0 : -1}
        onFocus={() => setActive(0)}
        onPick={(shift) => {
          onPick({ type: "blob", ...blob }, shift);
          setBlob(randomBlob());
        }}
      />
      {SHAPES.map((s, i) => (
        <ShapeCard
          key={s.name}
          d={s.d}
          name={prettyName(s.name)}
          current={currentShape === i}
          tabIndex={active === i + 1 ? 0 : -1}
          onFocus={() => setActive(i + 1)}
          onPick={(shift) => onPick({ type: "shape", shape: i }, shift)}
        />
      ))}
    </div>
  );
}
