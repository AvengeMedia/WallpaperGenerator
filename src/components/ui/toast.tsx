import { useUi } from "@/store/ui";

export function Toast() {
  const toast = useUi((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed top-6 left-1/2 z-30 max-w-[min(90vw,640px)] -translate-x-1/2 rounded-2xl border border-on-surface/18 bg-surface/92 px-[18px] py-3 text-center text-sm leading-normal text-on-surface"
    >
      {toast.message}
    </div>
  );
}
