// Low-level helpers for the keyboard suite.
//
// Keys are injected through Playwright's CDP session so a test can pair any
// `key` with any `code` (required to simulate non-US layouts). The high-level
// page.keyboard API derives `code` from `key` using a US mapping, so it cannot
// express those combinations.

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VK = {
  Tab: 0x09,
  Escape: 0x1b,
  Enter: 0x0d,
  Backspace: 0x08,
  Delete: 0x2e,
  ArrowLeft: 0x25,
  ArrowUp: 0x26,
  ArrowRight: 0x27,
  ArrowDown: 0x28,
  Home: 0x24,
  End: 0x23,
  F1: 0x70,
  F6: 0x75,
};

// Chrome's built-in editing commands read the virtual key code. On most
// layouts that follows the produced character (AZERTY `q` is VK_Q even though
// it sits on KeyA), and punctuation still reports the key's OEM code.
const CODE_VK = {
  Backquote: 0xc0,
  Minus: 0xbd,
  Equal: 0xbb,
  BracketLeft: 0xdb,
  BracketRight: 0xdd,
  Backslash: 0xdc,
  Semicolon: 0xba,
  Quote: 0xde,
  Comma: 0xbc,
  Period: 0xbe,
  Slash: 0xbf,
  IntlBackslash: 0xe2,
  Space: 0x20,
  NumpadAdd: 0x6b,
  NumpadSubtract: 0x6d,
  NumpadMultiply: 0x6a,
  NumpadDivide: 0x6f,
  NumpadDecimal: 0x6e,
  NumpadEnter: 0x0d,
};

const vkFor = (key, code) => {
  if (key in VK) return VK[key];
  if (/^[a-z]$/i.test(key)) return key.toUpperCase().charCodeAt(0);
  if (code && CODE_VK[code] !== undefined) return CODE_VK[code];
  const m = /^(?:Key([A-Z])|Digit([0-9]))$/i.exec(code ?? "");
  return m ? (m[1] ?? m[2]).toUpperCase().charCodeAt(0) : 0;
};

// Real browsers report the uppercase form of a letter when Shift is held.
const literal = (k) => (k.shift && /^[a-z]$/.test(k.key) ? { ...k, key: k.key.toUpperCase() } : k);

async function keyEvent(cdp, type, raw) {
  const k = literal(raw);
  const modifiers = (k.alt ? 1 : 0) | (k.ctrl ? 2 : 0) | (k.meta ? 4 : 0) | (k.shift ? 8 : 0);
  // CDP only inserts a character when keyDown carries `text`; without it a test
  // cannot type into an input. Command chords must not insert.
  const auto = type === "keyDown" && k.key.length === 1 && !k.ctrl && !k.meta ? k.key : undefined;
  const text = k.text !== undefined ? k.text : auto;
  await cdp.send("Input.dispatchKeyEvent", {
    type,
    key: k.key,
    code: k.code ?? "",
    windowsVirtualKeyCode: k.vw ?? vkFor(k.key, k.code),
    modifiers,
    autoRepeat: Boolean(k.repeat),
    ...(text === undefined || text === null ? {} : { text }),
  });
}

export const keydown = (cdp, k) => keyEvent(cdp, "keyDown", k);
export const keyup = (cdp, k) => keyEvent(cdp, "keyUp", k);

export async function press(cdp, k, gap = 70) {
  await keydown(cdp, k);
  await sleep(25);
  await keyup(cdp, k);
  await sleep(gap);
}

// Press and hold, emitting `repeat: true` keydowns like a real held key.
export async function hold(cdp, k, repeats = 3, gap = 60) {
  await keydown(cdp, k);
  for (let i = 0; i < repeats; i++) {
    await sleep(gap);
    await keyEvent(cdp, "keyDown", { ...k, repeat: true });
  }
  await keyup(cdp, k);
  await sleep(gap);
}

const MOD = {
  shift: { key: "Shift", code: "ShiftLeft", flag: "shift" },
  ctrl: { key: "Control", code: "ControlLeft", flag: "ctrl" },
  alt: { key: "Alt", code: "AltLeft", flag: "alt" },
  meta: { key: "Meta", code: "MetaLeft", flag: "meta" },
};

// Sends the modifiers as their own keydown/keyup events like a real chord,
// instead of only setting the modifier bitmask on the main key.
export async function chord(cdp, mods, k, gap = 70) {
  const held = mods.map((m) => (typeof m === "string" ? MOD[m] : m));
  for (const m of held) await keydown(cdp, { ...m, [m.flag]: true });
  await press(cdp, { ...k, ...Object.fromEntries(held.map((m) => [m.flag, true])) }, 0);
  for (const m of [...held].reverse()) await keyup(cdp, { ...m, [m.flag]: true });
  await sleep(gap);
}

export const snap = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector("[data-canvas]");
    const outline = canvas?.querySelector("svg path[stroke-dasharray]");
    const t = outline?.getAttribute("transform") ?? "";
    const n = String.raw`-?\d+(?:\.\d+)?(?:e-?\d+)?`;
    const m = t.match(
      new RegExp(String.raw`translate\((${n}) (${n})\) scale\((${n})\)(?: rotate\((${n}))?`),
    );
    const checked = (label) =>
      [...document.querySelectorAll(`[role="radiogroup"][aria-label="${label}"] [role="radio"]`)]
        .find((r) => r.getAttribute("aria-checked") === "true")
        ?.getAttribute("aria-label") ?? null;
    const el = document.querySelector("#panel-shape span[aria-live]");
    const sm = el?.textContent.match(/Shape (\d+) of (\d+)/);
    // The sidebar is unmounted in mini/hidden modes; fall back to app state.
    const editor = typeof window.__editor === "function" ? window.__editor() : null;
    const sel = editor && editor.index >= 0 ? editor : null;
    const pretty = (c) => c.replace("-", " ");
    const opacityEl = document.querySelector("#sm-opacity");
    const opacity = opacityEl ? +opacityEl.value : NaN;
    const sheetEl = document.querySelector('[role="dialog"][aria-label="Shapes"]');
    return {
      x: m ? +m[1] : (sel?.x ?? null),
      y: m ? +m[2] : (sel?.y ?? null),
      size: m ? +m[3] : (sel?.size ?? null),
      rot: m ? +m[4] : (sel?.rot ?? null),
      d: outline?.getAttribute("d") ?? null,
      outline: !!outline,
      fill: checked("Color") ?? (sel ? pretty(sel.fill) : null),
      overlap:
        checked("Overlap color") ??
        (sel ? (sel.overlap === "none" ? "No overlap color" : pretty(sel.overlap)) : null),
      opacity: Number.isNaN(opacity) ? (sel?.opacity ?? NaN) : opacity,
      idx: sel ? sel.index : sm ? +sm[1] - 1 : null,
      count: sel ? sel.layers : sm ? +sm[2] : null,
      layers: canvas?.querySelectorAll("svg [data-id]").length ?? 0,
      live: document.querySelector('[role="status"][aria-live]')?.textContent ?? "",
      toast: document.querySelector('[role="status"]:not([aria-live])')?.textContent ?? null,
      panel: document.querySelector("aside[data-panel]")?.dataset.panel ?? null,
      dialog: document.querySelector("dialog")?.open ?? false,
      sheet: !!(sheetEl && !sheetEl.inert),
      bg: !!document.querySelector("main > div[aria-hidden]"),
      pattern: checked("Background pattern"),
      canvasFocused: !!document.activeElement?.closest?.("[data-canvas]"),
      active: document.activeElement?.getAttribute?.("aria-label") ?? null,
      activeTag: document.activeElement?.tagName ?? null,
      activeText: (document.activeElement?.textContent ?? "").trim().slice(0, 24),
      exportOpen: !!document.querySelector('[role="menu"]'),
      exportPanel: !!document.querySelector('aside [aria-haspopup="menu"]'),
      exportCanvas: !!document.querySelector('main [aria-haspopup="menu"]'),
      exportMenuInView: (() => {
        const menu = document.querySelector('[role="menu"]');
        if (!menu) return null;
        const r = menu.getBoundingClientRect();
        return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      })(),
      exportInBody: document.querySelector('[role="menu"]')?.parentElement === document.body,
      exportBeforeUndo: (() => {
        const trigger = document.querySelector('aside [aria-haspopup="menu"]');
        const undo = document.querySelector('aside button[aria-label^="Undo"]');
        return !!(
          trigger &&
          undo &&
          trigger.compareDocumentPosition(undo) & Node.DOCUMENT_POSITION_FOLLOWING
        );
      })(),
    };
  });

// --- Deterministic state -----------------------------------------------------

export const LAYER = (i, over = {}) => ({
  id: `seed${i}`,
  shape: i % 3,
  size: 600,
  x: 100 + i * 300,
  y: 100 + i * 150,
  rot: 0,
  fill: "primary",
  overlap: "none",
  ...over,
});

export const stateOf = (layers, prefs = {}) => ({
  layers,
  prefs: {
    pattern: "topography",
    opacity: 0.1,
    hue: 0,
    patternScale: 1,
    format: "16:9",
    orientation: "landscape",
    custom: { w: 1920, h: 1080 },
    ...prefs,
  },
  dark: true,
});

export const SEED = stateOf([LAYER(0), LAYER(1), LAYER(2)]);

export const STORAGE_KEY = "wallpaper-layout-v1";

export async function boot(page, init = SEED) {
  await page.addInitScript({ content: LIVE_OBSERVER });
  await page.goto("/");
  await page.evaluate(
    ([key, s]) => (s ? localStorage.setItem(key, JSON.stringify(s)) : localStorage.removeItem(key)),
    [STORAGE_KEY, init],
  );
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector("[data-canvas]"), null, {
    timeout: 20_000,
  });
  await sleep(250);
}

// --- Snapshot diffing --------------------------------------------------------

export const STATE = [
  "x",
  "y",
  "size",
  "rot",
  "d",
  "fill",
  "overlap",
  "opacity",
  "idx",
  "layers",
  "panel",
  "bg",
  "pattern",
  "dialog",
  "sheet",
  "toast",
  "live",
];

// `Object.is` keeps NaN stable and distinct from null, which JSON.stringify
// would collapse (screens without a selection are full of both).
const changedFields = (a, b) => STATE.filter((f) => !Object.is(a[f], b[f]));

export const diffInfo = (a, b) =>
  changedFields(a, b)
    .map((f) => `${f} ${a[f]} -> ${b[f]}`)
    .join(" ") || "no diff";

export const onlyChanged = changedFields;

// --- Focus helpers -----------------------------------------------------------

export const focusCanvas = async (page, cdp, keys) => {
  await press(cdp, keys.f6, 120);
  return snap(page);
};

// --- Synthetic events --------------------------------------------------------

// IME composition and dead keys cannot be produced through CDP, so dispatch a
// synthetic KeyboardEvent instead. `isComposing` is settable via the init dict.
export const synthKeys = (page, init) =>
  page.evaluate((opts) => {
    const target = document.activeElement ?? document.body;
    for (const type of ["keydown", "keyup"]) {
      target.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, ...opts }));
    }
  }, init);

// --- Announcements -----------------------------------------------------------

// Records every live-region mutation. A text-only snapshot cannot tell that a
// region re-announced the same string; this observer can.
export const LIVE_OBSERVER = `(() => {
  window.__live = [];
  const install = () => {
    const el = document.querySelector('[role="status"][aria-live]');
    if (!el) return requestAnimationFrame(install);
    new MutationObserver(() => window.__live.push(el.textContent)).observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };
  install();
})();`;

export const liveLog = (page) => page.evaluate(() => window.__live ?? []);

export const clearLiveLog = (page) => page.evaluate(() => (window.__live = []));

// --- Layout maps -------------------------------------------------------------

// Reports AltGraph the way a real Linux/Windows browser does; CDP's modifier
// bitmask has no AltGraph bit, so tests that press AltGr install this first.
export const ALTGRAPH_STUB = `(() => {
  const orig = KeyboardEvent.prototype.getModifierState;
  KeyboardEvent.prototype.getModifierState = function (key) {
    if (key === "AltGraph") return this.altKey && this.ctrlKey;
    return orig.call(this, key);
  };
})();`;

export const AZ_STUB = `(() => {
  const m = new Map([["KeyW","z"],["KeyA","q"],["KeyS","s"],["KeyD","d"],["KeyQ","a"],["KeyE","e"]]);
  Object.defineProperty(navigator, "keyboard", {
    value: { getLayoutMap: () => Promise.resolve(m) },
    configurable: true,
  });
})();`;

const COMMON = {
  tab: { key: "Tab", code: "Tab" },
  f6: { key: "F6", code: "F6" },
  esc: { key: "Escape", code: "Escape" },
  del: { key: "Delete", code: "Delete" },
  backspace: { key: "Backspace", code: "Backspace" },
  enter: { key: "Enter", code: "Enter" },
  f1: { key: "F1", code: "F1" },
  left: { key: "ArrowLeft", code: "ArrowLeft" },
  right: { key: "ArrowRight", code: "ArrowRight" },
  up: { key: "ArrowUp", code: "ArrowUp" },
  down: { key: "ArrowDown", code: "ArrowDown" },
  home: { key: "Home", code: "Home" },
  end: { key: "End", code: "End" },
  R: { key: "r", code: "KeyR" },
  F: { key: "f", code: "KeyF" },
  T: { key: "t", code: "KeyT" },
  G: { key: "g", code: "KeyG" },
  U: { key: "u", code: "KeyU" },
  J: { key: "j", code: "KeyJ" },
  C: { key: "c", code: "KeyC" },
  B: { key: "b", code: "KeyB" },
  P: { key: "p", code: "KeyP" },
  N: { key: "n", code: "KeyN" },
  I: { key: "i", code: "KeyI" },
  X: { key: "x", code: "KeyX" },
  save: { key: "s", code: "KeyS", ctrl: true },
  dup: { key: "d", code: "KeyD", ctrl: true },
  cheat: { key: "?", code: "Slash", shift: true },
};

export const US = {
  ...COMMON,
  undo: { key: "z", code: "KeyZ", ctrl: true },
  redo: { key: "z", code: "KeyZ", ctrl: true, shift: true },
  redoY: { key: "y", code: "KeyY", ctrl: true },
  W: { key: "w", code: "KeyW" },
  A: { key: "a", code: "KeyA" },
  S: { key: "s", code: "KeyS" },
  D: { key: "d", code: "KeyD" },
  Q: { key: "q", code: "KeyQ" },
  E: { key: "e", code: "KeyE" },
  M: { key: "m", code: "KeyM" },
  digit: (i) => ({ key: String(i), code: `Digit${i}` }),
  shiftDigit: (i) => ({ key: "!@#$%^&*("[i - 1], code: `Digit${i}`, shift: true }),
  shift0: { key: ")", code: "Digit0", shift: true },
  foreign: { key: "a", code: "KeyQ" },
  altgr: null,
  moveLabels: "W A S D",
  rotateLabels: "Q E",
  dead: [
    ["- (ex-resize)", { key: "-", code: "Minus" }],
    ["Shift+= (ex-resize)", { key: "+", code: "Equal", shift: true }],
    ["Shift+] (ex-resize)", { key: "}", code: "BracketRight", shift: true }],
    ["Option+1", { key: "¡", code: "Digit1", alt: true }],
  ],
};

export const DE = {
  ...US,
  undo: { key: "z", code: "KeyY", ctrl: true },
  redo: { key: "z", code: "KeyY", ctrl: true, shift: true },
  redoY: { key: "y", code: "KeyZ", ctrl: true },
  shiftDigit: (i) => ({
    key: ["!", '"', "§", "$", "%", "&", "/", "("][i - 1],
    code: `Digit${i}`,
    shift: true,
  }),
  shift0: { key: "=", code: "Digit0", shift: true },
  cheat: { key: "?", code: "Minus", shift: true },
  altgr: { key: "[", code: "Digit8", ctrl: true, alt: true },
  dead: [
    ["- (ex-resize)", { key: "-", code: "Slash" }],
    ["+ (ex-resize)", { key: "+", code: "BracketRight" }],
    ["Shift++ (ex-resize)", { key: "*", code: "BracketRight", shift: true }],
    ["Shift+_ (ex-shrink)", { key: "_", code: "Slash", shift: true }],
    ["AltGr+8 -> [", { key: "[", code: "Digit8", ctrl: true, alt: true }],
  ],
};

export const AZ = {
  ...US,
  undo: { key: "z", code: "KeyW", ctrl: true },
  redo: { key: "z", code: "KeyW", ctrl: true, shift: true },
  redoY: { key: "y", code: "KeyY", ctrl: true },
  W: { key: "z", code: "KeyW" },
  A: { key: "q", code: "KeyA" },
  Q: { key: "a", code: "KeyQ" },
  digit: (i) => ({ key: ["&", "é", '"', "'", "(", "-", "è", "_"][i - 1], code: `Digit${i}` }),
  shiftDigit: (i) => ({ key: String(i), code: `Digit${i}`, shift: true }),
  shift0: { key: "0", code: "Digit0", shift: true },
  cheat: { key: "?", code: "Comma", shift: true },
  foreign: { key: "w", code: "KeyQ" },
  M: { key: "m", code: "Semicolon" },
  altgr: { key: "\\", code: "Digit8", ctrl: true, alt: true },
  moveLabels: "Z Q S D",
  rotateLabels: "A E",
  dead: [
    ["Shift+= (types +)", { key: "+", code: "Equal", shift: true }],
    ["AltGr+E -> €", { key: "€", code: "KeyE", ctrl: true, alt: true }],
  ],
};
