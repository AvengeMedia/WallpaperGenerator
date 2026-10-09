// Layout-independent keyboard-shortcut regression suite (US / German / AZERTY).
import { test, expect } from "@playwright/test";
import {
  ALTGRAPH_STUB,
  AZ,
  AZ_STUB,
  DE,
  SEED,
  US,
  boot,
  diffInfo,
  press,
  snap,
  sleep,
} from "./keyboard-harness.js";

const totals = { pass: 0, fail: 0 };

const check = (name, ok, info = "") => {
  const line = info ? `${name}   [${info}]` : name;
  totals[ok ? "pass" : "fail"] += 1;
  console.log(`   ${ok ? "PASS" : "FAIL"}  ${line}`);
  expect.soft(ok, line).toBe(true);
};

const expectNothing = async (page, cdp, name, ev) => {
  const a = await snap(page);
  await press(cdp, ev);
  const b = await snap(page);
  check(`dead: ${name}`, diffInfo(a, b) === "no diff", diffInfo(a, b));
};

const step = async (page, cdp, ev, gap) => {
  await press(cdp, ev, gap);
  return snap(page);
};

async function scenario(page, cdp, keys, label) {
  console.log(`\n=== ${label} ===`);

  await press(cdp, keys.f6, 250);
  await press(cdp, keys.tab, 250);
  let s = await snap(page);
  check("setup: canvas focused, shape selected", s.canvasFocused && s.idx === 1, `idx=${s.idx}`);

  for (const [name, ev] of keys.dead) await expectNothing(page, cdp, name, ev);

  let a = await snap(page);
  let b = await step(page, cdp, keys.G);
  check("opacity: G -1", b.opacity === 99, `${a.opacity} -> ${b.opacity}`);
  a = b;
  b = await step(page, cdp, { ...keys.G, shift: true });
  check("opacity: Shift+G -10", b.opacity === 89, `${a.opacity} -> ${b.opacity}`);
  a = b;
  b = await step(page, cdp, { ...keys.T, shift: true });
  check("opacity: Shift+T +10", b.opacity === 99, `${a.opacity} -> ${b.opacity}`);
  a = b;
  b = await step(page, cdp, keys.T);
  check("opacity: T +1", b.opacity === 100, `${a.opacity} -> ${b.opacity}`);

  const noHijack = (x, y) =>
    check(
      "resize: no hijack",
      x.opacity === y.opacity && x.overlap === y.overlap && x.rot === y.rot,
      `op ${x.opacity}->${y.opacity} ovl ${x.overlap}->${y.overlap} rot ${x.rot}->${y.rot}`,
    );
  a = await snap(page);
  b = await step(page, cdp, { ...keys.F, shift: true });
  check(
    "resize: Shift+F -10",
    +(b.size - a.size).toFixed(4) === -10,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );
  noHijack(a, b);
  a = b;
  b = await step(page, cdp, keys.F);
  check("resize: F -1", +(b.size - a.size).toFixed(4) === -1, `Δ${(b.size - a.size).toFixed(4)}`);
  noHijack(a, b);
  a = b;
  b = await step(page, cdp, { ...keys.R, shift: true });
  check(
    "resize: Shift+R +10",
    +(b.size - a.size).toFixed(4) === 10,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );
  noHijack(a, b);
  a = b;
  b = await step(page, cdp, keys.R);
  check("resize: R +1", +(b.size - a.size).toFixed(4) === 1, `Δ${(b.size - a.size).toFixed(4)}`);
  noHijack(a, b);
  a = b;
  b = await step(page, cdp, { ...keys.F, shift: true });
  const coarseDn = +(a.size - b.size).toFixed(4);
  a = b;
  b = await step(page, cdp, keys.F);
  const fineDn = +(a.size - b.size).toFixed(4);
  a = b;
  b = await step(page, cdp, { ...keys.R, shift: true });
  const coarseUp = +(b.size - a.size).toFixed(4);
  a = b;
  b = await step(page, cdp, keys.R);
  const fineUp = +(b.size - a.size).toFixed(4);
  check(
    "resize: coarse = 10x fine",
    coarseDn === 10 && fineDn === 1 && coarseUp === 10 && fineUp === 1,
    `coarse=${coarseDn.toFixed(4)}/${coarseUp.toFixed(4)} fine=${fineDn.toFixed(4)}/${fineUp.toFixed(4)}`,
  );

  a = await snap(page);
  b = await step(page, cdp, keys.shiftDigit(1));
  check(
    "overlap: Shift+1 sets color",
    b.overlap === "primary" && a.overlap !== b.overlap,
    `${a.overlap} -> ${b.overlap}`,
  );
  check(
    "overlap: Shift+1 keeps size",
    +(b.size - a.size).toFixed(4) === 0,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );
  a = b;
  b = await step(page, cdp, keys.shiftDigit(7));
  check(
    "overlap: Shift+7 sets color",
    b.overlap === "inverse primary",
    `${a.overlap} -> ${b.overlap}`,
  );
  check(
    "overlap: Shift+7 keeps size",
    +(b.size - a.size).toFixed(4) === 0,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );
  a = b;
  b = await step(page, cdp, keys.shiftDigit(8));
  check("overlap: Shift+8 sets color", b.overlap === "black", `${a.overlap} -> ${b.overlap}`);
  check(
    "overlap: Shift+8 keeps size",
    +(b.size - a.size).toFixed(4) === 0,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );
  a = b;
  b = await step(page, cdp, keys.shift0);
  check(
    "overlap: Shift+0 clears",
    b.overlap === "No overlap color",
    `${a.overlap} -> ${b.overlap}`,
  );
  check(
    "overlap: Shift+0 keeps size",
    +(b.size - a.size).toFixed(4) === 0,
    `Δ${(b.size - a.size).toFixed(4)}`,
  );

  a = await snap(page);
  b = await step(page, cdp, keys.E);
  check("rotate: E +1", b.rot === (a.rot + 1) % 360, `${a.rot} -> ${b.rot}`);
  a = b;
  b = await step(page, cdp, keys.Q);
  check("rotate: Q -1", b.rot === (a.rot + 359) % 360, `${a.rot} -> ${b.rot}`);
  a = b;
  b = await step(page, cdp, keys.Q);
  check("rotate: wraps 0 to 359", a.rot === 0 && b.rot === 359, `${a.rot} -> ${b.rot}`);
  a = b;
  b = await step(page, cdp, keys.foreign);
  check("rotate: matches by code (KeyQ)", b.rot === (a.rot + 359) % 360, `${a.rot} -> ${b.rot}`);

  a = await snap(page);
  b = await step(page, cdp, keys.A);
  check("move: A x-1", +(b.x - a.x).toFixed(4) === -1, `Δx=${(b.x - a.x).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, { ...keys.A, shift: true });
  check("move: Shift+A x-10", +(b.x - a.x).toFixed(4) === -10, `Δx=${(b.x - a.x).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, keys.D);
  check("move: D x+1", +(b.x - a.x).toFixed(4) === 1, `Δx=${(b.x - a.x).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, keys.S);
  check("move: S y+1", +(b.y - a.y).toFixed(4) === 1, `Δy=${(b.y - a.y).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, keys.W);
  check("move: W y-1", +(b.y - a.y).toFixed(4) === -1, `Δy=${(b.y - a.y).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, keys.left);
  check("move: ArrowLeft x-1", +(b.x - a.x).toFixed(4) === -1, `Δx=${(b.x - a.x).toFixed(4)}`);
  a = b;
  b = await step(page, cdp, { ...keys.right, shift: true });
  check(
    "move: Shift+ArrowRight x+10",
    +(b.x - a.x).toFixed(4) === 10,
    `Δx=${(b.x - a.x).toFixed(4)}`,
  );
  a = b;
  b = await step(page, cdp, { ...keys.up, shift: true });
  check(
    "move: Shift+ArrowUp y-10",
    +(b.y - a.y).toFixed(4) === -10,
    `Δy=${(b.y - a.y).toFixed(4)}`,
  );

  a = await snap(page);
  b = await step(page, cdp, keys.digit(1));
  check("fill: 1", b.fill === "primary", `${a.fill} -> ${b.fill}`);
  a = b;
  b = await step(page, cdp, keys.digit(8));
  check("fill: 8", b.fill === "black", `${a.fill} -> ${b.fill}`);
  a = b;
  b = await step(page, cdp, keys.digit(4));
  check("fill: 4", b.fill === "primary container", `${a.fill} -> ${b.fill}`);
  a = b;
  b = await step(page, cdp, keys.C);
  check(
    "fill: C next",
    b.fill !== a.fill && b.fill === "secondary container",
    `${a.fill} -> ${b.fill}`,
  );
  a = b;
  b = await step(page, cdp, { ...keys.C, shift: true });
  check(
    "fill: Shift+C previous",
    b.fill !== a.fill && b.fill === "primary container",
    `${a.fill} -> ${b.fill}`,
  );

  await sleep(320);
  a = await snap(page);
  b = await step(page, cdp, keys.U, 200);
  check("layer: U forward", a.idx === 1 && b.idx === 2, `${a.idx} -> ${b.idx}`);
  await sleep(420);
  s = await snap(page);
  check("layer: announces Layer 3 of 3", s.live === "Layer 3 of 3", s.live);
  a = b;
  b = await step(page, cdp, keys.J, 200);
  check("layer: J back", a.idx === 2 && b.idx === 1, `${a.idx} -> ${b.idx}`);
  a = b;
  b = await step(page, cdp, { ...keys.U, shift: true }, 200);
  check("layer: Shift+U to front", b.idx === 2, `${a.idx} -> ${b.idx}`);
  a = b;
  b = await step(page, cdp, { ...keys.J, shift: true }, 200);
  check("layer: Shift+J to back", b.idx === 0, `${a.idx} -> ${b.idx}`);
  a = b;
  b = await step(page, cdp, keys.U, 200);
  check("layer: U restores", b.idx === 1, `${a.idx} -> ${b.idx}`);

  a = await snap(page);
  b = await step(page, cdp, keys.dup);
  check("duplicate: Mod+D", b.layers === a.layers + 1, `${a.layers} -> ${b.layers}`);
  a = b;
  b = await step(page, cdp, keys.undo);
  check("undo: Mod+Z", b.layers === a.layers - 1, `${a.layers} -> ${b.layers}`);
  a = b;
  b = await step(page, cdp, keys.redo);
  check("redo: Mod+Shift+Z", b.layers === a.layers + 1, `${a.layers} -> ${b.layers}`);
  a = b;
  b = await step(page, cdp, keys.undo);
  check("undo: back to 3", b.layers === 3, `${a.layers} -> ${b.layers}`);

  b = await step(page, cdp, keys.tab, 150);
  check("delete: Tab re-selects", b.idx === 0, `idx=${b.idx}`);
  a = await snap(page);
  await sleep(250);
  b = await step(page, cdp, keys.del);
  check("delete: Delete", b.layers === a.layers - 1, `${a.layers} -> ${b.layers}`);
  await sleep(420);
  s = await snap(page);
  check("delete: announces Shape deleted", s.live === "Shape deleted", s.live);
  a = b;
  b = await step(page, cdp, keys.undo);
  check("undo: delete restored", b.layers === a.layers + 1, `${a.layers} -> ${b.layers}`);

  await press(cdp, keys.B, 120);
  await sleep(420);
  s = await snap(page);
  check("bg: B on", s.live === "Background pattern mode on", s.live);
  b = await step(page, cdp, keys.R);
  await sleep(420);
  s = await snap(page);
  check("bg: R size up", s.live === "Pattern size 1.1", s.live);
  b = await step(page, cdp, keys.F);
  await sleep(420);
  s = await snap(page);
  check("bg: F size down", s.live === "Pattern size 1", s.live);
  b = await step(page, cdp, { ...keys.F, shift: true });
  await sleep(420);
  s = await snap(page);
  check("bg: Shift+F size -0.5", s.live === "Pattern size 0.5", s.live);
  b = await step(page, cdp, { ...keys.R, shift: true });
  await sleep(420);
  s = await snap(page);
  check("bg: Shift+R size +0.5", s.live === "Pattern size 1", s.live);
  b = await step(page, cdp, { ...keys.T, shift: true });
  await sleep(420);
  s = await snap(page);
  check("bg: Shift+T strength +10", s.live === "Pattern strength 20%", s.live);
  b = await step(page, cdp, keys.T);
  await sleep(420);
  s = await snap(page);
  check("bg: T strength +1", s.live === "Pattern strength 21%", s.live);
  b = await step(page, cdp, { ...keys.G, shift: true });
  await sleep(420);
  s = await snap(page);
  check("bg: Shift+G strength -10", s.live === "Pattern strength 11%", s.live);
  b = await step(page, cdp, keys.G);
  await sleep(420);
  s = await snap(page);
  check("bg: G strength -1", s.live === "Pattern strength 10%", s.live);
  b = await step(page, cdp, keys.right);
  await sleep(420);
  s = await snap(page);
  check("bg: ArrowRight strength +1", s.live === "Pattern strength 11%", s.live);
  b = await step(page, cdp, keys.left);
  await sleep(420);
  s = await snap(page);
  check("bg: ArrowLeft strength -1", s.live === "Pattern strength 10%", s.live);
  b = await step(page, cdp, keys.up);
  await sleep(420);
  s = await snap(page);
  check("bg: ArrowUp pattern", s.live === "Pattern: plus", s.live);
  b = await step(page, cdp, keys.down);
  await sleep(420);
  s = await snap(page);
  check("bg: ArrowDown pattern", s.live === "Pattern: topography", s.live);
  await press(cdp, keys.B, 120);
  await sleep(420);
  s = await snap(page);
  check("bg: B off", s.live === "Background pattern mode off", s.live);

  b = await step(page, cdp, keys.tab, 150);
  check("select: Tab selects", b.idx === 0 && b.outline, `idx=${b.idx} outline=${b.outline}`);
  for (const [from, to] of [
    ["full", "mini"],
    ["mini", "hidden"],
    ["hidden", "full"],
  ]) {
    b = await step(page, cdp, keys.P);
    check(`panel: ${from} to ${to}`, b.panel === (to === "hidden" ? null : to), `panel=${b.panel}`);
    check(`panel: ${from} to ${to} keeps focus`, b.canvasFocused, `focus=${b.canvasFocused}`);
  }

  a = await snap(page);
  b = await step(page, cdp, keys.M, 120);
  check(
    "shape: M reshapes",
    b.d !== a.d,
    `${(a.d ?? "").slice(0, 12)} -> ${(b.d ?? "").slice(0, 12)}`,
  );
  check("shape: M keeps focus", b.canvasFocused, `focus=${b.canvasFocused}`);

  a = await snap(page);
  b = await step(page, cdp, keys.I);
  check("surprise: I arms", b.toast === "Surprise me? Press I again", b.toast);
  check("surprise: I does not run yet", b.layers === a.layers, `${a.layers} -> ${b.layers}`);
  b = await step(page, cdp, keys.I, 120);
  check(
    "surprise: I runs",
    b.idx === null && b.layers >= 2 && b.layers <= 5,
    `layers=${b.layers} idx=${b.idx}`,
  );

  a = await snap(page);
  b = await step(page, cdp, keys.X);
  check("clear: X arms", b.toast === "Clear everything? Press X again", b.toast);
  check("clear: X does not run yet", b.layers === a.layers, `${a.layers} -> ${b.layers}`);
  b = await step(page, cdp, keys.X, 120);
  check("clear: X clears", b.layers === 0 && b.idx === null, `layers=${b.layers}`);

  b = await step(page, cdp, keys.P);
  b = await step(page, cdp, keys.P);
  check("sheet: P hides panel", b.panel === null, `panel=${b.panel}`);
  b = await step(page, cdp, keys.N, 120);
  check("sheet: N opens", !!b.sheet, `sheet=${b.sheet}`);
  b = await step(page, cdp, keys.esc, 150);
  check("sheet: Esc closes", !b.sheet, `sheet=${b.sheet}`);
  b = await step(page, cdp, keys.P);
  check("sheet: P restores panel", b.panel === "full", `panel=${b.panel}`);

  b = await step(page, cdp, keys.cheat, 150);
  check("cheat: opens", b.dialog, `dialog=${b.dialog}`);
  s = await page.evaluate(() => document.querySelector("dialog")?.textContent ?? "");
  check("cheat: move labels localized", s.includes(`or ${keys.moveLabels}`), keys.moveLabels);
  check(
    "cheat: rotate labels localized",
    s.includes(`or ${keys.rotateLabels}, Shift snaps to 15°`),
    keys.rotateLabels,
  );
  check("cheat: shows Shift for 10 pxRF", s.includes("Shift for 10 pxRF"));
  check("cheat: shows Shift for 10%TG", s.includes("Shift for 10%TG"));
  check("cheat: shows reshape M", s.includes("Reshape a blob / random shapeM"));
  check("cheat: shows layer UJ", s.includes("Layer forward / backUJ"));
  check("cheat: shows cycle panel", s.includes("Cycle the panel"));
  check("cheat: shows surprise", s.includes("Surprise me (clear + randomize)"));
  check("cheat: shows clear all", s.includes("Clear everything"));
  check("cheat: undo shows a Ctrl label", s.includes("Ctrl"));
  check(
    "cheat: no foreign labels",
    !s.includes(keys.moveLabels === "W A S D" ? "Z Q S D" : "W A S D"),
  );
  b = await step(page, cdp, keys.esc, 150);
  check("cheat: Esc closes", !b.dialog, `dialog=${b.dialog}`);
  b = await step(page, cdp, keys.f1, 150);
  check("cheat: F1 opens", b.dialog, `dialog=${b.dialog}`);
  b = await step(page, cdp, keys.esc, 150);
  check("cheat: Esc closes (F1)", !b.dialog, `dialog=${b.dialog}`);
}

const LAYOUTS = [
  ["US layout", US, null],
  ["German layout", DE, null],
  ["AZERTY layout", AZ, AZ_STUB],
];

for (const [title, keys, initScript] of LAYOUTS) {
  test(title, async ({ page }) => {
    totals.pass = 0;
    totals.fail = 0;
    await page.addInitScript({ content: ALTGRAPH_STUB });
    if (initScript) await page.addInitScript({ content: initScript });
    const cdp = await page.context().newCDPSession(page);
    await boot(page, SEED);
    await scenario(page, cdp, keys, title);
    console.log(`\n${totals.pass} / ${totals.pass + totals.fail} checks passed`);
  });
}
