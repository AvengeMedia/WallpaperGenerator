import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRipple } from "@/hooks/ui/use-ripple";
import { cn } from "@/lib/utils";

interface TabDef<T extends string> {
  id: T;
  label: ReactNode | ((selected: boolean, activeTab: T) => ReactNode);
  icon?: ReactNode | ((selected: boolean, activeTab: T) => ReactNode);
}

export interface TabsProps<T extends string> {
  tabs: readonly TabDef<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}

const INDICATOR_WIDTH = 32;

export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  const list = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  const ripple = useRipple();

  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => {
      const selectedTab = element.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (selectedTab)
        setLeft(selectedTab.offsetLeft + (selectedTab.offsetWidth - INDICATOR_WIDTH) / 2);
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [value]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const nextIndexCandidate = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (nextIndexCandidate === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const targetIndex = (nextIndexCandidate + tabs.length) % tabs.length;
    const nextTab = tabs[targetIndex];
    onChange(nextTab.id);
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[targetIndex]?.focus();
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
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            ref={ripple}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative flex h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-t-[20px] border-0 bg-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&_svg]:size-5",
              selected ? "text-primary" : "text-on-surface-variant",
            )}
          >
            {typeof tab.icon === "function" ? tab.icon(selected, value) : tab.icon}
            {typeof tab.label === "function" ? tab.label(selected, value) : tab.label}
          </button>
        );
      })}
    </div>
  );
}
