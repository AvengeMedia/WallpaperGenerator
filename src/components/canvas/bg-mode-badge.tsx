import { Kbd } from "@/components/ui/kbd";
import { useUi } from "@/store/ui";

const hints: [string[], string][] = [
  [["↑", "↓"], "pattern"],
  [["T", "G"], "strength"],
  [["R", "F"], "size"],
  [["Esc"], "exit"],
];

export function BgModeBadge() {
  const open = useUi((s) => s.bgMode);
  if (!open) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-3 left-1/2 z-10 flex -translate-x-1/2 animate-fade-up items-center gap-2 rounded-full border border-primary/40 bg-surface-container-high py-1.5 pr-3 pl-4 text-sm font-semibold text-on-surface shadow-[0_2px_8px_rgba(0,0,0,.24)] select-none"
    >
      <span className="material-symbols-rounded size-[18px] text-primary">texture</span>
      <span>Background mode</span>
      <span className="flex items-center gap-1.5 border-l border-outline-variant pl-2.5 text-xs font-normal text-on-surface-variant">
        {hints.map(([keys, label]) => (
          <span key={label} className="flex items-center gap-1 whitespace-nowrap">
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}
