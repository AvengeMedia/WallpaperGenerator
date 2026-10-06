import { FieldLabel } from "@/components/ui/field-label";
import { Segmented } from "@/components/ui/segmented";
import { useWallpaper, wallpaper } from "@/store/wallpaper";

const options = [
  {
    value: "light",
    label: (
      <>
        <span className="material-symbols-rounded">light_mode</span>
        Light
      </>
    ),
  },
  {
    value: "dark",
    label: (
      <>
        <span className="material-symbols-rounded">dark_mode</span>
        Dark
      </>
    ),
  },
] as const;

export function ThemeToggle() {
  const dark = useWallpaper((s) => s.dark);
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel icon={<span className="material-symbols-rounded">brightness_6</span>}>
        Theme
      </FieldLabel>
      <Segmented
        label="Theme"
        value={dark ? "dark" : "light"}
        options={options}
        onChange={(v) => wallpaper.setDark(v === "dark")}
      />
    </div>
  );
}
