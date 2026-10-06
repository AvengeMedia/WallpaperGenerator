import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ComponentProps<"button"> {
  label: string;
  tonal?: boolean;
  size?: "sm" | "md";
}

export function IconButton({
  label,
  tonal,
  size = "md",
  className,
  onClick,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={rest.title ?? label}
      aria-label={label}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick?.(e);
      }}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center border-0 p-0 focus-ring morph active:rounded-lg disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-6",
        size === "sm" ? "size-8 rounded-[50%] [&_svg]:size-5" : "size-10 rounded-[50%]",
        tonal
          ? "rounded-[14px] bg-primary-container text-on-primary-container hover:state-layer-8 active:rounded-[10px]"
          : "bg-transparent text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface active:bg-on-surface/12",
        className,
      )}
      {...rest}
    />
  );
}
