const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const canvasEl = () => document.querySelector<HTMLElement>("[data-canvas]");

export const sidebarEl = () => document.querySelector<HTMLElement>("aside[data-panel]");

const isTabStop = (el: HTMLElement) => el.offsetParent !== null && !el.closest("[inert]");

export const focusablesOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isTabStop);

const tryFocus = (el: HTMLElement | undefined | null) => {
  if (!el) return false;
  el.focus({ preventScroll: true });
  return document.activeElement === el;
};

export const focusCanvas = () => tryFocus(canvasEl());

export const focusSidebar = (edge: "start" | "end" = "start") => {
  const bar = sidebarEl();
  if (!bar) return false;
  if (edge === "start") {
    const tab = bar.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (tab && isTabStop(tab) && tryFocus(tab)) return true;
  }
  const items = focusablesOf(bar);
  const order = edge === "start" ? items : [...items].reverse();
  for (const target of order) if (tryFocus(target)) return true;
  return false;
};

export const isFirstFocusable = (el: Element | null, root: HTMLElement) =>
  focusablesOf(root)[0] === el;
