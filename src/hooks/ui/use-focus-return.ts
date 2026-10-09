import { useEffect, useRef, type RefObject } from "react";
import { focusCanvas } from "@/components/ui/focus";

const usable = (el: HTMLElement | null): el is HTMLElement =>
  !!el &&
  el !== document.body &&
  el.isConnected &&
  !el.closest("[inert]") &&
  el.getClientRects().length > 0;

export function useFocusReturn<T extends HTMLElement>(
  open: boolean,
  openerRef?: RefObject<T | null>,
) {
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      opener.current = openerRef?.current ?? (usable(active) ? active : null);
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const el = opener.current ?? openerRef?.current ?? null;
    opener.current = null;
    if (usable(el)) el.focus({ preventScroll: true });
    else focusCanvas();
  }, [open, openerRef]);
}
