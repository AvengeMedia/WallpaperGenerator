import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { ui, useUi } from "@/store/ui";

interface Row {
  label: ReactNode;
  hint?: string;
  keys: string[];
}

const groups: { title: string; rows: Row[] }[] = [
  {
    title: "General",
    rows: [
      { label: "Show this cheat sheet", keys: ["?"] },
      { label: "Add a shape (open or close the picker)", keys: ["N"] },
      { label: "Add a random blob", keys: ["B"] },
      { label: "Undo", hint: "or Ctrl+Z", keys: ["Z"] },
      { label: "Redo", hint: "or Ctrl+Y", keys: ["Y"] },
      { label: "Export PNG 2× / 1×", hint: "Shift+E for 1×", keys: ["E"] },
      { label: "Surprise me (clear + randomize)", keys: ["U"] },
      { label: "Minimize or expand the panel", keys: ["S"] },
      { label: "Hide or show the panel completely", keys: ["Shift", "S"] },
      { label: "Light / dark theme", keys: ["Enter"] },
      { label: "Clear everything", keys: ["R"] },
    ],
  },
  {
    title: "Selected shape",
    rows: [
      { label: "Previous / next shape", keys: ["[", "]"] },
      { label: "Deselect", keys: ["Esc"] },
      { label: "Delete", hint: "or Backspace", keys: ["Del"] },
      { label: "Reshape blob / random shape", keys: ["M"] },
      { label: "Next color", keys: ["C"] },
      { label: "Pick a palette color", keys: ["1", "–", "8"] },
      { label: "Next overlap color", hint: "Shift+O for previous", keys: ["O"] },
      { label: "Layer forward / back", hint: "Shift for front / back", keys: ["↑", "↓"] },
      { label: "Reset rotation", keys: ["0"] },
      { label: "Resize (on the wallpaper)", keys: ["Scroll"] },
      { label: "Rotate", hint: "add Ctrl for fine", keys: ["Shift", "Scroll"] },
    ],
  },
  {
    title: "Background",
    rows: [
      { label: "Next pattern", hint: "Shift+P for previous", keys: ["P"] },
      { label: "Pattern strength", keys: ["−", "+"] },
      { label: "Pattern size", keys: [",", "."] },
    ],
  },
  {
    title: "Controls",
    rows: [
      { label: "Move between controls", keys: ["Tab"] },
      { label: "Choose inside a group (colors, patterns, formats…)", keys: ["←", "→"] },
      { label: "Adjust a slider", hint: "double-click to reset", keys: ["←", "→"] },
    ],
  },
];

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="shortcuts-title"
      onClose={() => ui.setShortcutsOpen(false)}
      onClick={(e) => e.target === e.currentTarget && ui.setShortcutsOpen(false)}
      className="fixed inset-0 m-auto max-h-[min(82vh,760px)] w-[min(640px,92vw)] overflow-hidden rounded-[28px] border-0 bg-surface-container-high p-0 text-sm text-on-surface open:flex open:animate-dialog-in open:flex-col"
    >
      <div className="flex items-center gap-3 py-4 pr-3 pb-2 pl-6">
        <h2 id="shortcuts-title" className="m-0 flex-1 text-[22px] font-semibold">
          Keyboard shortcuts
        </h2>
        <IconButton label="Close (Esc)" onClick={() => ui.setShortcutsOpen(false)}>
          <span className="material-symbols-rounded">close</span>
        </IconButton>
      </div>
      <div
        tabIndex={-1}
        className="grid grid-cols-2 gap-x-9 gap-y-6 overflow-y-auto px-6 pt-2 pb-6 max-sm:grid-cols-1"
      >
        {groups.map((g) => (
          <section key={g.title}>
            <h3 className="mb-1.5 text-xs font-semibold tracking-[.06em] text-primary uppercase">
              {g.title}
            </h3>
            {g.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-[7px]">
                <span className="leading-[1.35]">
                  {r.label}
                  {r.hint && (
                    <>
                      <br />
                      <small className="text-xs text-on-surface-variant">{r.hint}</small>
                    </>
                  )}
                </span>
                <span className="flex shrink-0 gap-1">
                  {r.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="min-w-[26px] rounded-lg bg-on-surface/12 px-2 py-[3px] text-center font-mono text-xs leading-normal font-medium shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-on-surface)_22%,transparent)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    </dialog>
  );
}
