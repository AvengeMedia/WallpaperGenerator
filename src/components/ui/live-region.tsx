import { useUi } from "@/store/ui";

export function LiveRegion() {
  const live = useUi((s) => s.live);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      <span key={live?.id ?? 0}>{live?.text}</span>
    </div>
  );
}
