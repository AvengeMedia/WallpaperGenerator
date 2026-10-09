import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import { IconButton } from "@/components/ui/icon-button";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Swatch } from "@/components/ui/swatch";
import { layerName, LAYER_SIZE_PCT } from "@/lib/layer";
import { PALETTE, type OverlapColor, type PaletteColor } from "@/lib/palette";
import { ariaKeyshortcuts } from "@/lib/shortcut-keys";
import { normDeg } from "@/lib/utils";
import { selectActive, selectActiveIndex, useWallpaper, wallpaper } from "@/store/wallpaper";
import { ui } from "@/store/ui";

export const openShapes = (mode: "add" | "replace") =>
  ui.panelHidden() ? ui.openSheet(mode) : ui.openPicker(mode);

export function ShapeTab() {
  const active = useWallpaper(selectActive);
  const index = useWallpaper(selectActiveIndex);
  const { count, canvas } = useWallpaper((s) => ({ count: s.layers.length, canvas: s.canvas }));

  if (!active) {
    return (
      <section
        id="panel-shape"
        role="tabpanel"
        aria-labelledby="tab-shape"
        tabIndex={0}
        className="flex animate-fade-up flex-col gap-3 text-center text-on-surface-variant"
      >
        <span>No shape selected. Click one on the wallpaper, or add a new one.</span>
      </section>
    );
  }

  const isBlob = active.d !== undefined;
  const opacity = Math.round((active.opacity ?? 1) * 100);
  const rot = Math.round(normDeg(active.rot)) % 360;
  const size = Math.round((active.size / Math.min(canvas.w, canvas.h)) * 100);

  return (
    <section
      id="panel-shape"
      role="tabpanel"
      aria-labelledby="tab-shape"
      className="flex animate-fade-up flex-col gap-6"
    >
      <div className="-mt-1 -mb-0.5 flex items-center justify-between">
        <IconButton
          label="Previous shape (Shift+Tab)"
          aria-keyshortcuts={ariaKeyshortcuts("Shift+Tab")}
          disabled={count < 2}
          onClick={() => wallpaper.stepActive(-1)}
        >
          <span className="material-symbols-rounded">chevron_left</span>
        </IconButton>
        <span aria-live="polite" className="text-sm font-medium text-on-surface-variant">
          Shape {index + 1} of {count}
        </span>
        <IconButton
          label="Next shape (Tab)"
          aria-keyshortcuts={ariaKeyshortcuts("Tab")}
          disabled={count < 2}
          onClick={() => wallpaper.stepActive(1)}
        >
          <span className="material-symbols-rounded">chevron_right</span>
        </IconButton>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="tonal"
          title="Change shape"
          onClick={() => openShapes("replace")}
          className="inline-flex h-9 gap-1.5 rounded-[18px] px-3 py-0 text-[15px] font-semibold active:rounded-[10px] [&>svg]:size-5"
        >
          <span className="material-symbols-rounded">shapes</span>
          {layerName(active)}
          <span className="material-symbols-rounded">chevron_right</span>
        </Button>
        <IconButton
          variant="tonal"
          size="md"
          label={`${isBlob ? "Reshape blob" : "Random shape"} (M)`}
          aria-keyshortcuts={ariaKeyshortcuts("M")}
          onClick={wallpaper.shuffleActive}
          className="ml-auto rounded-[18px] active:rounded-[10px]"
        >
          <span className="material-symbols-rounded">shuffle</span>
        </IconButton>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          icon={<span className="material-symbols-rounded">format_color_fill</span>}
          title="Fill color: 1–8, C cycles"
        >
          Color
        </FieldLabel>
        <RadioGroup<PaletteColor>
          label="Color"
          value={active.fill}
          onChange={wallpaper.setActiveFill}
          className="flex flex-wrap gap-2"
        >
          {PALETTE.map((c) => (
            <Swatch key={c} color={c} />
          ))}
        </RadioGroup>
      </div>

      {index > 0 && (
        <div className="flex flex-col gap-2">
          <FieldLabel
            icon={<span className="material-symbols-rounded">layers</span>}
            title="Overlap color: Shift+1–8, Shift+0 for none"
          >
            Overlap color
          </FieldLabel>
          <RadioGroup<OverlapColor>
            label="Overlap color"
            value={active.overlap}
            onChange={wallpaper.setActiveOverlap}
            className="flex flex-wrap gap-2"
          >
            <RadioItem
              value="none"
              title="No overlap color (Shift+0)"
              aria-label="No overlap color"
              className="inline-flex size-[30px] items-center justify-center rounded-full border-0 bg-surface-container-high p-0 text-on-surface-variant focus-ring data-checked:outline-3 data-checked:outline-offset-2 data-checked:outline-primary [&>svg]:size-[18px]"
            >
              <span className="material-symbols-rounded">block</span>
            </RadioItem>
            {PALETTE.map((c) => (
              <Swatch key={c} color={c} />
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel
          icon={<span className="material-symbols-rounded">open_in_full</span>}
          htmlFor="sm-size"
          value={`${size}%`}
          title="Size: R and F (Shift for 10 px), or scroll"
        >
          Size
        </FieldLabel>
        <Slider
          id="sm-size"
          min={LAYER_SIZE_PCT.min}
          max={LAYER_SIZE_PCT.max}
          step={1}
          value={size}
          onChange={(v) => wallpaper.resizeActive((v / 100) * Math.min(canvas.w, canvas.h))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          icon={<span className="material-symbols-rounded">opacity</span>}
          htmlFor="sm-opacity"
          value={`${opacity}%`}
          title="Opacity: T and G (Shift for 10%)"
        >
          Opacity
        </FieldLabel>
        <Slider
          id="sm-opacity"
          min={10}
          max={100}
          step={1}
          value={opacity}
          onChange={(v) => wallpaper.patchActive({ opacity: v >= 100 ? undefined : v / 100 })}
          onReset={() => wallpaper.patchActive({ opacity: undefined })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          icon={<span className="material-symbols-rounded">rotate_right</span>}
          htmlFor="sm-rot"
          value={`${rot}°`}
          title="Rotation: , and . or Q and E (Shift snaps to 15°)"
        >
          Rotation
        </FieldLabel>
        <Slider
          id="sm-rot"
          min={0}
          max={359}
          step={1}
          value={rot}
          onChange={(v) => wallpaper.patchActive({ rot: v })}
          onReset={() => wallpaper.patchActive({ rot: 0 })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          icon={<span className="material-symbols-rounded">stacks</span>}
          title="Layer: U forward, J back (Shift jumps to front / back)"
        >
          Layer
        </FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <Button
            title="Send to the back (Shift+J)"
            aria-keyshortcuts={ariaKeyshortcuts("Shift+J")}
            onClick={() => wallpaper.reorderActive(-Infinity)}
          >
            <span className="material-symbols-rounded">flip_to_back</span>
            To back
          </Button>
          <Button
            title="Send backward (J)"
            aria-keyshortcuts={ariaKeyshortcuts("J")}
            onClick={() => wallpaper.reorderActive(-1)}
          >
            <span className="material-symbols-rounded">arrow_downward</span>
            Backward
          </Button>
          <Button
            title="Bring to the front (Shift+U)"
            aria-keyshortcuts={ariaKeyshortcuts("Shift+U")}
            onClick={() => wallpaper.reorderActive(Infinity)}
          >
            <span className="material-symbols-rounded">flip_to_front</span>
            To front
          </Button>
          <Button
            title="Bring forward (U)"
            aria-keyshortcuts={ariaKeyshortcuts("U")}
            onClick={() => wallpaper.reorderActive(1)}
          >
            <span className="material-symbols-rounded">arrow_upward</span>
            Forward
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="tonal"
          title="Duplicate the shape (Ctrl+D)"
          aria-keyshortcuts={ariaKeyshortcuts("Mod+D")}
          onClick={wallpaper.duplicateActive}
        >
          <span className="material-symbols-rounded">content_copy</span>
          Duplicate
        </Button>
        <Button
          variant="danger"
          title="Delete the shape (Delete or Backspace)"
          aria-keyshortcuts={ariaKeyshortcuts("Delete")}
          onClick={wallpaper.deleteActive}
        >
          <span className="material-symbols-rounded">delete</span>
          Delete
        </Button>
      </div>
    </section>
  );
}
