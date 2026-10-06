import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface RadioContextValue<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
}

const RadioContext = createContext<RadioContextValue | null>(null);

interface RadioGroupProps<T extends string> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  value: T;
  onChange: (value: T) => void;
  label: string;
}

const keyDelta: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

const moveFocus = (e: KeyboardEvent<HTMLDivElement>) => {
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  const i = items.indexOf((e.target as HTMLElement).closest('[role="radio"]') as HTMLButtonElement);
  if (i < 0) return;
  let n: number | undefined;
  if (e.key in keyDelta) n = (i + keyDelta[e.key] + items.length) % items.length;
  else if (e.key === "Home") n = 0;
  else if (e.key === "End") n = items.length - 1;
  if (n === undefined) return;
  e.preventDefault();
  e.stopPropagation();
  items[n].focus();
  items[n].click();
};

export function RadioGroup<T extends string>({
  value,
  onChange,
  label,
  children,
  ...rest
}: RadioGroupProps<T>) {
  return (
    <RadioContext.Provider value={{ value, onChange: onChange as (v: string) => void }}>
      <div role="radiogroup" aria-label={label} onKeyDown={moveFocus} {...rest}>
        {children}
      </div>
    </RadioContext.Provider>
  );
}

interface RadioItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function RadioItem({ value, className, onClick, ...rest }: RadioItemProps) {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("RadioItem must be inside RadioGroup");
  const checked = ctx.value === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={checked ? 0 : -1}
      data-checked={checked || undefined}
      onClick={(e) => {
        ctx.onChange(value);
        onClick?.(e);
      }}
      className={cn("cursor-pointer", className)}
      {...rest}
    />
  );
}
