import { useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/icon-button";
import type { ShapeSpec } from "@/lib/layer";
import { selectActive, useWallpaper, wallpaper, wallpaperStore } from "@/store/wallpaper";
import { ui, useUi, type PickMode } from "@/store/ui";
import { ShapeGrid } from "./shape-grid";

export const pickShape = (mode: PickMode, spec: ShapeSpec) => {
  if (mode === "replace" && wallpaperStore.state.activeId) wallpaper.replaceActiveShape(spec);
  else wallpaper.addLayer(spec);
};

export function ShapePicker() {
  const mode = useUi((s) => s.picker);
  const active = useWallpaper(selectActive);
  const back = useRef<HTMLButtonElement>(null);
  const open = mode !== null;

  useEffect(() => {
    if (open) back.current?.focus({ preventScroll: true });
  }, [open]);

  const replacing = mode === "replace" && active !== null;

  return (
    <section
      aria-label="Shape picker"
      inert={!open}
      data-open={open}
      className="absolute inset-0 flex flex-col bg-surface-container transition-[transform,visibility] group-data-[panel=mini]/panel:hidden data-[open=false]:invisible data-[open=false]:translate-x-full data-[open=false]:duration-300 data-[open=false]:ease-emphasized-accelerate data-[open=true]:duration-450 data-[open=true]:ease-emphasized"
    >
      <div className="flex items-center gap-2 border-b border-outline-variant px-1 pb-2">
        <IconButton ref={back} label="Back (Esc)" onClick={ui.closePicker}>
          <span className="material-symbols-rounded">arrow_back</span>
        </IconButton>
        <span className="text-base font-semibold whitespace-nowrap">
          {replacing ? "Change shape" : "Add shape"}
        </span>
      </div>
      {open && (
        <ShapeGrid
          className="min-h-0 flex-1 grid-cols-4 px-1 pt-3 pb-1"
          currentShape={replacing ? active?.shape : undefined}
          onPick={(spec) => pickShape(mode, spec)}
        />
      )}
    </section>
  );
}
