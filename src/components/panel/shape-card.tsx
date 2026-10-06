import { cn } from "@/lib/utils";

interface ShapeCardProps {
  d: string;
  name: string;
  current?: boolean;
  onPick: (shiftKey: boolean) => void;
}

export function ShapeCard({ d, name, current, onPick }: ShapeCardProps) {
  return (
    <button
      type="button"
      aria-label={name}
      title={name}
      onClick={(e) => onPick(e.shiftKey)}
      className={cn(
        "group/card relative flex cursor-pointer items-center justify-center rounded-2xl border-0 bg-transparent px-0 py-2 morph hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:rounded-[10px]",
        current && "rounded-[28px] bg-primary-container",
      )}
    >
      <svg viewBox="0 0 1 1" aria-hidden className="size-14 shrink-0 overflow-visible">
        <path
          d={d}
          className={cn(
            "transition-[fill] duration-200 ease-effect group-hover/card:fill-primary",
            current ? "fill-on-primary-container" : "fill-on-surface/40",
          )}
        />
      </svg>
    </button>
  );
}
