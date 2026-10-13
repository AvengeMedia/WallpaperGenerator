const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([type="radio"]), input[type="radio"]:checked, select:not([disabled]), textarea:not([disabled]), summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

export const canvasEl = () => document.querySelector<HTMLElement>("[data-canvas]");

export const sidebarEl = () => document.querySelector<HTMLElement>("aside[data-panel]");

const isTabStop = (element: HTMLElement) =>
  !element.closest("[inert], [hidden]") &&
  (typeof element.checkVisibility === "function"
    ? element.checkVisibility({ checkVisibilityCSS: true })
    : element.offsetParent !== null);

export const focusablesOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isTabStop);

export const tryFocus = (element: HTMLElement | undefined | null) => {
  if (!element) return false;
  element.focus({ preventScroll: true });
  return document.activeElement === element;
};

export const isLastFocusable = (element: Element | null, root: HTMLElement) =>
  focusablesOf(root).at(-1) === element;
