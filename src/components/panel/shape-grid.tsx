import { useState } from "react";
import type { ShapeSpec } from "@/lib/layer";
import { prettyName, randomBlob, SHAPES } from "@/lib/shapes";
import { cn } from "@/lib/utils";
import { ShapeCard } from "./shape-card";

interface ShapeGridProps {
  currentShape?: number;
  onPick: (spec: ShapeSpec, shiftKey: boolean) => void;
  className?: string;
}

export function ShapeGrid({ currentShape, onPick, className }: ShapeGridProps) {
  const [blob, setBlob] = useState(randomBlob);

  return (
    <div
      className={cn(
        "scrollbar-hidden grid content-start gap-1 overflow-y-auto overscroll-contain",
        className,
      )}
    >
      <ShapeCard
        d={blob}
        name="Random blob"
        onPick={(shift) => {
          onPick({ d: blob }, shift);
          setBlob(randomBlob());
        }}
      />
      {SHAPES.map((s, i) => (
        <ShapeCard
          key={s.name}
          d={s.d}
          name={prettyName(s.name)}
          current={currentShape === i}
          onPick={(shift) => onPick({ shape: i }, shift)}
        />
      ))}
    </div>
  );
}
