// Ripple model after use-ripple by Jonathan Asplund (ISC) — see
// https://github.com/asplunds/use-ripple and LICENSE-ISC-use-ripple in the repo root.
import { useCallback, useEffect, useLayoutEffect, useRef, type Ref } from "react";
import { cn } from "@/lib/utils";

export interface RippleOptions<T extends HTMLElement = HTMLElement> {
  /** Time the circle takes to expand, and again to fade out. Defaults to 600ms. */
  duration?: number;
  /** The component's own ref, when it forwards one — assigned alongside the hook's. */
  ref?: Ref<T>;
}

const DEFAULT_DURATION = 600;
/** `duration` multiplier after which a ripple fades anyway, so a release event that
 *  never arrives (pointer dragged out of the window, tab hidden) can't strand one. */
const FAILSAFE_FACTOR = 4;
/** Added to `duration` when scheduling removal, to absorb animation jank. */
const REMOVE_MARGIN = 50;

/** Every class here must stay a literal — Tailwind scans this file for candidates. */
const CIRCLE =
  "absolute rounded-full bg-[image:radial-gradient(closest-side,currentColor_92%,transparent)] " +
  "opacity-10 pointer-events-none -translate-x-1/2 -translate-y-1/2 scale-0 " +
  "transition duration-(--ripple-duration) ease-effect";

/** The host has to be a containing block and clip the circle. */
const applyHostClasses = (host: HTMLElement) => {
  // Only worth adding when the host is static: an absolutely positioned host is
  // already a containing block, and moving it would undo how it was placed.
  const position =
    !host.classList.contains("relative") && getComputedStyle(host).position === "static"
      ? "relative"
      : "";
  const next = cn(host.className, position, "overflow-hidden");
  if (next !== host.className) host.className = next;
};

/** Assign a caller-supplied ref the way React would, returning its detach. */
const assignRef = <T extends HTMLElement>(external: Ref<T> | null | undefined, node: T | null) => {
  if (typeof external === "function") {
    const cleanup = external(node);
    return typeof cleanup === "function" ? cleanup : () => external(null);
  }
  if (external) {
    external.current = node;
    return () => {
      external.current = null;
    };
  }
  return () => {};
};

const spawnCircle = (
  host: HTMLElement,
  ev: PointerEvent,
  duration: number,
  live: Set<() => void>,
) => {
  // Primary button only; some browsers still deliver events to disabled controls.
  if (ev.button !== 0 || host.matches(":disabled")) return;

  const { left, top, width, height } = host.getBoundingClientRect();
  const x = ev.clientX - left;
  const y = ev.clientY - top;
  // Diameter that lets the circle reach the farthest corner of the host.
  const reach = 2 * Math.hypot(Math.max(x, width - x), Math.max(y, height - y));

  const circle = document.createElement("span");
  circle.className = CIRCLE;
  circle.setAttribute("aria-hidden", "true");
  circle.style.cssText =
    `left:${x}px; top:${y}px; width:${reach}px; height:${reach}px; ` +
    `--ripple-duration:${duration}ms`;
  host.appendChild(circle);

  let removal: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    clearTimeout(failSafe);
    clearTimeout(removal);
    circle.remove();
    live.delete(stop);
  };
  const release = (up?: PointerEvent) => {
    // Another finger lifting must not cancel this ripple.
    if (up && up.pointerId !== ev.pointerId) return;
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    clearTimeout(failSafe);
    circle.classList.replace("opacity-10", "opacity-0");
    removal = setTimeout(stop, duration + REMOVE_MARGIN);
  };
  const failSafe = setTimeout(() => release(), duration * FAILSAFE_FACTOR);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  live.add(stop);

  // Force a style pass so the grow transition starts from scale(0).
  void circle.offsetWidth;
  circle.classList.replace("scale-0", "scale-100");
};

export function useRipple<T extends HTMLElement = HTMLButtonElement>({
  duration = DEFAULT_DURATION,
  ref,
}: RippleOptions<T> = {}) {
  const hosts = useRef(new Map<T, () => void>());
  const live = useRef(new Set<() => void>());

  // Ripples outlive the press, so unmounting may happen while one is in flight.
  useEffect(() => {
    const pending = live.current;
    return () => {
      for (const stop of pending) stop();
      pending.clear();
    };
  }, []);

  // React rewrites `className` wholesale when the prop changes (Tabs swaps its text
  // colour), which would drop the classes we added — so re-apply after every render.
  useLayoutEffect(() => {
    for (const host of hosts.current.keys()) applyHostClasses(host);
  });

  return useCallback(
    (node: T | null) => {
      // React 19 runs the cleanup returned below instead of passing null, so this
      // only fires for a detach that arrives without one.
      if (!node) {
        for (const [host, dispose] of hosts.current)
          if (!host.isConnected) {
            dispose();
            hosts.current.delete(host);
          }
        return;
      }

      hosts.current.get(node)?.(); // ref identity changed: drop the previous registration
      applyHostClasses(node);
      const spawn = (ev: PointerEvent) => spawnCircle(node, ev, duration, live.current);
      node.addEventListener("pointerdown", spawn);
      const dispose = () => {
        node.removeEventListener("pointerdown", spawn);
        hosts.current.delete(node);
      };
      hosts.current.set(node, dispose);
      const detachExternal = assignRef(ref, node);
      return () => {
        dispose();
        detachExternal();
      };
    },
    [duration, ref],
  );
}
