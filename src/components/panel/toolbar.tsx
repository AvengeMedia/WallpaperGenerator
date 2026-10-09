import { useRef } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useDropImport } from "@/hooks/use-import";
import { ariaKeyshortcuts, keyLabel } from "@/lib/shortcut-keys";
import { useWallpaper, wallpaper } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";
import { ExportMenu } from "./export-menu";

export function Toolbar() {
  const { canUndo, canRedo } = useWallpaper((s) => ({ canUndo: s.canUndo, canRedo: s.canRedo }));
  const panel = useUi((s) => s.panel);
  const fileInput = useRef<HTMLInputElement>(null);
  const onFilePicked = useDropImport();

  return (
    <div className="flex items-center gap-1 px-2 pb-2 group-data-[panel=mini]/panel:flex-col group-data-[panel=mini]/panel:gap-2 group-data-[panel=mini]/panel:px-0 group-data-[panel=mini]/panel:pb-0 max-md:group-data-[panel=mini]/panel:flex-row max-md:group-data-[panel=mini]/panel:justify-center">
      <IconButton
        label={panel === "full" ? `Minimize the panel (${keyLabel("P")})` : "Expand the panel"}
        aria-keyshortcuts={ariaKeyshortcuts("P")}
        variant="text"
        aria-expanded={panel === "full"}
        onClick={ui.toggleMini}
      >
        {panel === "full" ? (
          <span className="material-symbols-rounded">menu_open</span>
        ) : (
          <span className="material-symbols-rounded">menu</span>
        )}
      </IconButton>
      <IconButton
        label="Keyboard shortcuts (?)"
        aria-keyshortcuts={ariaKeyshortcuts("F1")}
        variant="text"
        onClick={() => ui.setShortcutsOpen(true)}
      >
        <span className="material-symbols-rounded">keyboard_alt</span>
      </IconButton>
      <span className="flex-1 group-data-[panel=mini]/panel:hidden" />
      <div className="contents group-data-[panel=mini]/panel:hidden">
        <IconButton
          label="Import a layout from JSON (or drop the file onto the page)"
          variant="text"
          onClick={() => fileInput.current?.click()}
        >
          <span className="material-symbols-rounded">upload</span>
        </IconButton>
      </div>
      <ExportMenu align={panel === "mini" ? "start" : "end"} />
      <IconButton
        label={`Undo (${keyLabel("Mod+Z")})`}
        aria-keyshortcuts={ariaKeyshortcuts("Mod+Z")}
        variant="text"
        disabled={!canUndo}
        onClick={wallpaper.undo}
      >
        <span className="material-symbols-rounded">undo</span>
      </IconButton>
      <IconButton
        label={`Redo (${keyLabel("Mod+Shift+Z")})`}
        aria-keyshortcuts={ariaKeyshortcuts("Mod+Shift+Z")}
        variant="text"
        disabled={!canRedo}
        onClick={wallpaper.redo}
      >
        <span className="material-symbols-rounded">redo</span>
      </IconButton>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => onFilePicked(e.currentTarget)}
      />
    </div>
  );
}
