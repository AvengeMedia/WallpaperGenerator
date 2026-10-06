import { useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useExport } from "@/hooks/use-export";
import { useWallpaper } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";

export function ExportMenu() {
  const open = useUi((s) => s.exportMenuOpen);
  const canvas = useWallpaper((s) => s.canvas);
  const { exportPng, exportJson } = useExport();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) ui.setExportMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      ui.setExportMenuOpen(false);
      trigger.current?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const item = (icon: React.ReactNode, title: string, hint: string, onClick: () => void) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        ui.setExportMenuOpen(false);
        onClick();
      }}
      className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2 text-left text-sm font-medium text-on-surface morph hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary active:rounded-lg active:bg-on-surface/12 [&>svg]:size-[22px] [&>svg]:shrink-0 [&>svg]:text-on-surface-variant"
    >
      {icon}
      <span className="flex flex-col gap-0.5">
        {title}
        <small className="text-xs font-normal text-on-surface-variant">{hint}</small>
      </span>
    </button>
  );

  return (
    <div ref={wrap} className="relative">
      <IconButton
        ref={trigger}
        label="Export"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => ui.setExportMenuOpen(!open)}
      >
        <span className="material-symbols-rounded">download</span>
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+6px)] right-0 z-10 flex w-[212px] animate-fade-up flex-col gap-0.5 rounded-2xl bg-surface-container-high p-2 shadow-[0_2px_6px_rgba(0,0,0,.25),0_8px_24px_rgba(0,0,0,.2)]"
        >
          {item(
            <span className="material-symbols-rounded">image</span>,
            "PNG 2×",
            `${canvas.w * 2} × ${canvas.h * 2}`,
            () => void exportPng(2),
          )}
          {item(
            <span className="material-symbols-rounded">image</span>,
            "PNG 1×",
            `${canvas.w} × ${canvas.h}`,
            () => void exportPng(1),
          )}
          {item(
            <span className="material-symbols-rounded">data_object</span>,
            "JSON layout",
            "Import as a wallpaper in DankMaterialShell",
            exportJson,
          )}
        </div>
      )}
    </div>
  );
}
