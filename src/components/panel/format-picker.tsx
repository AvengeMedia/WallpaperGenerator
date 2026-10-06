import { FieldLabel } from "@/components/ui/field-label";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Segmented } from "@/components/ui/segmented";
import {
  findFormat,
  FORMATS,
  MAX_PX,
  MIN_PX,
  type FormatId,
  type Orientation,
} from "@/lib/formats";
import { useWallpaper, wallpaper } from "@/store/wallpaper";

const orientations = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
] as const;

const chipClass =
  "morph focus-ring flex h-14 flex-col items-center justify-center gap-1.5 rounded-2xl border-0 bg-surface-container-high text-xs font-medium leading-none text-on-surface hover:bg-[color-mix(in_srgb,var(--color-surface-container-high)_88%,var(--color-on-surface))] active:rounded-[10px] data-checked:rounded-[28px] data-checked:bg-primary-container data-checked:text-on-primary-container";

function ChipIcon({ ratio, portrait }: { ratio: number; portrait: boolean }) {
  const r = portrait ? 1 / ratio : ratio;
  const w = r >= 1 ? 28 : 20 * r;
  const h = r >= 1 ? 28 / r : 20;
  return (
    <i className="block rounded-[3px] border-2 border-current" style={{ width: w, height: h }} />
  );
}

const inputClass =
  "no-spin min-w-0 flex-1 rounded-2xl border border-on-surface/38 bg-transparent px-4 py-2.5 font-[inherit] text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-on-surface focus:border-primary focus:shadow-[0_0_0_1px_var(--color-primary)] focus:outline-none";

export function FormatPicker() {
  const { format, orientation, canvas } = useWallpaper((s) => ({
    format: s.prefs.format,
    orientation: s.prefs.orientation,
    canvas: s.canvas,
  }));
  const preset = findFormat(format);
  const portrait = orientation === "portrait";

  const commitCustom = (w: number, h: number) => wallpaper.setFormat({ custom: { w, h } });

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel icon={<span className="material-symbols-rounded">image_aspect_ratio</span>}>
        Format
      </FieldLabel>
      <RadioGroup<FormatId>
        label="Screen proportions"
        value={format}
        onChange={(f) => wallpaper.setFormat({ format: f })}
        className="grid grid-cols-4 gap-2"
      >
        {FORMATS.map((f) => (
          <RadioItem
            key={f.id}
            value={f.id}
            title={`${f.hint} · ${f.w} × ${f.h}`}
            className={chipClass}
          >
            <ChipIcon ratio={f.w / f.h} portrait={portrait} />
            {f.id}
          </RadioItem>
        ))}
        <RadioItem value="custom" title="Enter your own size" className={chipClass}>
          <i className="block h-5 w-7 rounded-[3px] border-2 border-dashed border-current" />
          Custom
        </RadioItem>
      </RadioGroup>
      {preset ? (
        <Segmented<Orientation>
          label="Orientation"
          value={orientation}
          options={orientations}
          onChange={(o) => wallpaper.setFormat({ orientation: o })}
        />
      ) : (
        <div className="flex items-center gap-2 text-on-surface-variant">
          <input
            key={`w${canvas.w}`}
            type="number"
            min={MIN_PX}
            max={MAX_PX}
            step={1}
            defaultValue={canvas.w}
            aria-label="Width in pixels"
            className={inputClass}
            onBlur={(e) => commitCustom(+e.target.value, canvas.h)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <span aria-hidden>×</span>
          <input
            key={`h${canvas.h}`}
            type="number"
            min={MIN_PX}
            max={MAX_PX}
            step={1}
            defaultValue={canvas.h}
            aria-label="Height in pixels"
            className={inputClass}
            onBlur={(e) => commitCustom(canvas.w, +e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <span aria-hidden>px</span>
        </div>
      )}
      <div className="text-xs text-on-surface-variant">
        {preset ? `${preset.hint} · ` : ""}
        {canvas.w} × {canvas.h} px
      </div>
    </div>
  );
}
