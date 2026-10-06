import { useRef } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useDropImport } from "@/hooks/use-import";
import { useWallpaper, wallpaper } from "@/store/wallpaper";
import { ui, useUi } from "@/store/ui";
import { ExportMenu } from "./export-menu";

export function Toolbar() {
  const { canUndo, canRedo } = useWallpaper((s) => ({ canUndo: s.canUndo, canRedo: s.canRedo }));
  const mini = useUi((s) => s.panel === "mini");
  const fileInput = useRef<HTMLInputElement>(null);
  const onFilePicked = useDropImport();

  return (
    <div className="flex items-center gap-1 px-2 pb-2 group-data-[panel=mini]/panel:flex-col group-data-[panel=mini]/panel:gap-2 group-data-[panel=mini]/panel:px-0 group-data-[panel=mini]/panel:pb-0 max-md:group-data-[panel=mini]/panel:flex-row max-md:group-data-[panel=mini]/panel:justify-center">
      <IconButton
        label={mini ? "Expand panel (S)" : "Minimize panel (S)"}
        aria-expanded={!mini}
        onClick={ui.toggleMini}
      >
        {mini ? (
          <span className="material-symbols-rounded">menu</span>
        ) : (
          <span className="material-symbols-rounded">menu_open</span>
        )}
      </IconButton>
      <IconButton label="Keyboard shortcuts (?)" onClick={() => ui.setShortcutsOpen(true)}>
        <span className="material-symbols-rounded">keyboard_alt</span>
      </IconButton>
      <span className="flex-1 group-data-[panel=mini]/panel:hidden" />
      <div className="contents group-data-[panel=mini]/panel:hidden">
        <IconButton
          label="Import a layout from JSON (or drop the file onto the page)"
          onClick={() => fileInput.current?.click()}
        >
          <span className="material-symbols-rounded">upload</span>
        </IconButton>
        <ExportMenu />
      </div>
      <IconButton label="Undo (Z)" disabled={!canUndo} onClick={wallpaper.undo}>
        <span className="material-symbols-rounded">undo</span>
      </IconButton>
      <IconButton label="Redo (Y)" disabled={!canRedo} onClick={wallpaper.redo}>
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
