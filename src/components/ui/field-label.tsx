import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldLabelProps extends HTMLAttributes<HTMLElement> {
  icon: ReactNode;
  htmlFor?: string;
  value?: ReactNode;
}

export function FieldLabel({
  icon,
  htmlFor,
  value,
  children,
  className,
  ...rest
}: FieldLabelProps) {
  const Tag = htmlFor ? "label" : "div";
  return (
    <Tag
      htmlFor={htmlFor}
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium whitespace-nowrap [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-on-surface-variant",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {value !== undefined && <span className="ml-auto text-on-surface-variant">{value}</span>}
    </Tag>
  );
}
