const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const canvasEl = () => document.querySelector<HTMLElement>("[data-canvas]");

export const sidebarEl = () => document.querySelector<HTMLElement>("aside[data-panel]");

const isTabStop = (element: HTMLElement) =>
  element.offsetParent !== null && !element.closest("[inert]");

export const focusablesOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isTabStop);

const tryFocus = (element: HTMLElement | undefined | null) => {
  if (!element) return false;
  element.focus({ preventScroll: true });
  return document.activeElement === element;
};

export const focusCanvas = () => tryFocus(canvasEl());

export const focusSidebar = (edge: "start" | "end" = "start") => {
  const bar = sidebarEl();
  if (!bar) return false;
  const items = focusablesOf(bar);
  const order = edge === "start" ? items : [...items].reverse();
  for (const target of order) if (tryFocus(target)) return true;
  return false;
};

export const isFirstFocusable = (element: Element | null, root: HTMLElement) =>
  focusablesOf(root)[0] === element;
