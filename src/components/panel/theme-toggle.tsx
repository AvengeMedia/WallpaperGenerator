import { FieldLabel } from "@/components/ui/field-label";
import { Segmented, SegmentedProps } from "@/components/ui/segmented";
import { useWallpaper, wallpaper } from "@/store/wallpaper";
import { BrightnessSix, DarkMode, LightMode } from "material-symbols/rounded";
import {
  DarkMode as DarkModeFilled,
  LightMode as LightModeFilled,
} from "material-symbols/rounded/filled";

const options = [
  {
    value: "light",
    icon: (selected) => (selected ? <LightModeFilled /> : <LightMode />),
    label: "Light",
  },
  {
    value: "dark",
    icon: (selected) => (selected ? <DarkModeFilled /> : <DarkMode />),
    label: "Dark",
  },
] as const satisfies SegmentedProps<"light" | "dark">["options"];

export function ThemeToggle() {
  const dark = useWallpaper((state) => state.dark);
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel icon={<BrightnessSix />}>Theme</FieldLabel>
      <Segmented
        label="Theme"
        value={dark ? "dark" : "light"}
        options={options}
        onChange={(value) => wallpaper.setDark(value === "dark")}
      />
    </div>
  );
}
