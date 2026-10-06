import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { wallpaper } from "@/store/wallpaper";
import { ui, useUi, type Tab } from "@/store/ui";
import { GlobalTab } from "./global-tab";
import { ShapePicker } from "./shape-picker";
import { ShapeTab } from "./shape-tab";
import { Toolbar } from "./toolbar";

const tabs = [
  { id: "global", label: "Global", icon: <span className="material-symbols-rounded">tune</span> },
  { id: "shape", label: "Shape", icon: <span className="material-symbols-rounded">shapes</span> },
] as const satisfies readonly { id: Tab; label: string; icon: React.ReactNode }[];

interface PanelProps {
  hueTrack: string;
  primaryHex: string;
}

export function Panel({ hueTrack, primaryHex }: PanelProps) {
  const { panel, tab, picking } = useUi((s) => ({
    panel: s.panel,
    tab: s.tab,
    picking: s.picker !== null,
  }));
  if (panel === "hidden") return null;
  const mini = panel === "mini";

  return (
    <aside
      data-panel={panel}
      className={cn(
        "group/panel relative flex shrink-0 flex-col overflow-hidden rounded-[28px] bg-surface-container pb-3 text-sm text-on-surface transition-[width,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] max-md:max-h-[48%] max-md:w-auto",
        mini ? "w-[72px] p-2 pb-3" : "w-80 px-2 pt-2",
      )}
    >
      <div
        className={cn("flex min-h-0 flex-1 flex-col max-md:w-auto", mini ? "w-14" : "w-[304px]")}
      >
        <Toolbar />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            inert={picking}
            className={cn(
              "absolute inset-0 flex flex-col transition-[translate,scale,opacity] duration-450 ease-emphasized",
              picking && "-translate-x-[18%] scale-90 opacity-0",
              mini && "hidden",
            )}
          >
            <Tabs tabs={tabs} value={tab} onChange={ui.setTab} label="Settings" />
            <div
              tabIndex={-1}
              className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-2 pt-5 pb-2"
            >
              {tab === "global" ? (
                <GlobalTab hueTrack={hueTrack} primaryHex={primaryHex} />
              ) : (
                <ShapeTab />
              )}
            </div>
            <div className="flex items-center gap-2 px-2 pt-3">
              <SurpriseButton />
              <AddShapeButton mini={false} />
            </div>
          </div>
          <ShapePicker />
        </div>
        {mini && (
          <div className="align-center flex flex-col items-center gap-2">
            <SurpriseButton />
            <AddShapeButton mini />
          </div>
        )}
      </div>
    </aside>
  );
}

function SurpriseButton() {
  return (
    <Button
      variant="tonal"
      className="h-12 w-12 shrink-0 rounded-3xl px-0 py-0 [&_svg]:size-6"
      title="Clears everything and adds random shapes (U)"
      aria-label="Surprise me"
      onClick={wallpaper.surprise}
    >
      <span className="material-symbols-rounded">casino</span>
    </Button>
  );
}

function AddShapeButton({ mini }: { mini: boolean }) {
  const picking = useUi((s) => s.picker !== null);
  return (
    <button
      type="button"
      title="Add a shape (N)"
      aria-label="Add a shape"
      onClick={(e) => {
        e.currentTarget.blur();
        if (picking) ui.closePicker();
        else ui.openPicker("add");
      }}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 border-0 bg-primary text-[15px] font-semibold text-on-primary focus-ring morph [&>svg]:size-6",
        mini
          ? "mx-auto size-12 rounded-[14px] hover:state-layer-8 active:rounded-[10px]"
          : "h-12 w-full rounded-3xl hover:state-layer-8 active:rounded-[14px] active:state-layer-12",
      )}
    >
      <span className="material-symbols-rounded">add</span>
      {!mini && "Add shape"}
    </button>
  );
}
