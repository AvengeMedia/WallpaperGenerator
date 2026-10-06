import { Button } from "@/components/ui/button";
import { wallpaper } from "@/store/wallpaper";
import { FormatPicker } from "./format-picker";
import { HuePicker } from "./hue-picker";
import { PatternPicker } from "./pattern-picker";
import { ThemeToggle } from "./theme-toggle";

interface GlobalTabProps {
  hueTrack: string;
  primaryHex: string;
}

export function GlobalTab({ hueTrack, primaryHex }: GlobalTabProps) {
  return (
    <section
      id="panel-global"
      role="tabpanel"
      aria-labelledby="tab-global"
      className="flex animate-fade-up flex-col gap-7"
    >
      <ThemeToggle />
      <FormatPicker />
      <HuePicker track={hueTrack} placeholder={primaryHex} />
      <PatternPicker />
      <div className="flex flex-col gap-2 border-t border-outline-variant pt-6">
        <Button variant="danger" title="Clear everything (R)" onClick={wallpaper.clearAll}>
          <span className="material-symbols-rounded">delete_forever</span>
          Clear everything
        </Button>
      </div>
    </section>
  );
}
