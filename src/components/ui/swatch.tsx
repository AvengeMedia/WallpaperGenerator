import { RadioItem } from "./radio-group";
import { cssColor, type PaletteColor } from "@/lib/palette";

interface SwatchProps {
  color: PaletteColor;
}

export function Swatch({ color }: SwatchProps) {
  return (
    <RadioItem
      value={color}
      aria-label={color.replace("-", " ")}
      className="size-[30px] rounded-full border-0 p-0 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-on-surface)_25%,transparent)] focus-ring transition-[outline-offset] duration-300 ease-spring data-checked:outline-3 data-checked:outline-offset-2 data-checked:outline-primary"
      style={{ background: cssColor(color) }}
    />
  );
}
