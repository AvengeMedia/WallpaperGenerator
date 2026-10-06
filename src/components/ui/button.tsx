import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "tonal" | "secondary" | "danger";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  filled: "bg-primary text-on-primary hover:state-layer-8 active:state-layer-12",
  tonal: "bg-primary-container text-on-primary-container hover:state-layer-8 active:state-layer-12",
  secondary:
    "bg-secondary-container text-on-secondary-container hover:state-layer-8 active:state-layer-12",
  danger:
    "bg-[color-mix(in_srgb,var(--color-error)_22%,var(--color-surface-container))] text-[color-mix(in_srgb,var(--color-error)_55%,var(--color-on-surface))] hover:state-layer-8 active:state-layer-12",
};

export function Button({ variant = "secondary", className, onClick, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onClick?.(e);
      }}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[20px] border-0 px-2.5 py-3 text-[13px] leading-none font-medium focus-ring morph active:rounded-xl [&_svg]:size-5 [&_svg]:shrink-0",
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}
