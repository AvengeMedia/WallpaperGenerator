import { useEffect, useRef, type RefObject } from "react";
import { focusCanvas } from "@/a11y/focus-zones";

const usable = (element: HTMLElement | null): element is HTMLElement =>
  !!element &&
  element !== document.body &&
  element.isConnected &&
  !element.closest("[inert]") &&
  element.getClientRects().length > 0;

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
    const element = opener.current ?? openerRef?.current ?? null;
    opener.current = null;
    if (usable(element)) element.focus({ preventScroll: true });
    else focusCanvas(undefined, { keepSelection: true });
  }, [open, openerRef]);
}
