import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components/ui/icon-button";
import { useFocusReturn } from "@/hooks/ui/use-focus-return";
import { useExport } from "@/hooks/use-export";
import { ariaKeyshortcuts, keyLabel } from "@/lib/shortcut-keys";
import { clamp } from "@/lib/utils";
import { useWallpaper } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";

const MENU_WIDTH = 212;
const GAP = 6;
const EDGE = 8;

interface ExportMenuProps {
  trigger?: boolean;
  align?: "start" | "end";
}

export function ExportMenu({ trigger = true, align = "end" }: ExportMenuProps) {
  const open = useUi((s) => s.exportMenuOpen);
  const canvas = useWallpaper((s) => s.canvas);
  const { exportPng, exportJson, installInDms } = useExport();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useFocusReturn(open, trigger ? button : undefined);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = trigger ? button.current : wrap.current;
    if (!anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const height = menu.current?.offsetHeight ?? 0;
      const left = trigger && align === "end" ? r.right - MENU_WIDTH : r.left;
      const top = trigger ? r.bottom + GAP : r.top;
      setPos({
        left: clamp(left, EDGE, window.innerWidth - MENU_WIDTH - EDGE),
        top: clamp(top, EDGE, window.innerHeight - height - EDGE),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, trigger, align]);

  useEffect(() => {
    if (!open || !pos) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (wrap.current?.contains(target) || menu.current?.contains(target)) return;
      ui.setExportMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      ui.setExportMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const moveFocus = (step: number | "first" | "last") => {
    const list = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLElement);
    const n =
      step === "first"
        ? 0
        : step === "last"
          ? list.length - 1
          : (i + step + list.length) % list.length;
    list[n]?.focus({ preventScroll: true });
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") moveFocus(1);
    else if (e.key === "ArrowUp") moveFocus(-1);
    else if (e.key === "Home") moveFocus("first");
    else if (e.key === "End") moveFocus("last");
    else if (e.key === "Tab") ui.setExportMenuOpen(false);
    else return;
    e.preventDefault();
  };

  const item = (icon: React.ReactNode, title: string, hint: string, onClick: () => void) => (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
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
    <div ref={wrap} className={trigger ? "relative" : undefined}>
      {trigger && (
        <IconButton
          ref={button}
          variant="text"
          label={`Export (${keyLabel("Mod+S")})`}
          aria-keyshortcuts={ariaKeyshortcuts("Mod+S")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => ui.setExportMenuOpen(!open)}
        >
          <span className="material-symbols-rounded">download</span>
        </IconButton>
      )}
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            onKeyDown={onMenuKeyDown}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                ui.setExportMenuOpen(false);
            }}
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              visibility: pos ? "visible" : "hidden",
            }}
            className="fixed z-50 flex w-[212px] animate-fade-up flex-col gap-0.5 rounded-2xl bg-surface-container-high p-2 shadow-[0_2px_6px_rgba(0,0,0,.25),0_8px_24px_rgba(0,0,0,.2)]"
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
            {item(
              <span className="material-symbols-rounded">wallpaper</span>,
              "Install in DMS",
              "Opens DankMaterialShell on this machine",
              installInDms,
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
