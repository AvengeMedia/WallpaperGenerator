import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: readonly TabDef<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}

const INDICATOR_WIDTH = 32;

export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  const list = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const t = el.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (t) setLeft(t.offsetLeft + (t.offsetWidth - INDICATOR_WIDTH) / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    const next = tabs[(n + tabs.length) % tabs.length];
    onChange(next.id);
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[(n + tabs.length) % tabs.length]?.focus();
  };

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className="relative flex justify-between gap-1 border-b border-outline-variant"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-px z-2 h-[3px] rounded-t-[3px] bg-primary transition-[left] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left, width: INDICATOR_WIDTH }}
      />
      {tabs.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative flex h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-t-[20px] border-0 bg-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&_svg]:size-5",
              selected ? "text-primary" : "text-on-surface-variant",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
