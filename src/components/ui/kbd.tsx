import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "min-w-[26px] rounded-lg bg-on-surface/12 px-2 py-[3px] text-center font-mono text-xs leading-normal font-medium shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-on-surface)_22%,transparent)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
