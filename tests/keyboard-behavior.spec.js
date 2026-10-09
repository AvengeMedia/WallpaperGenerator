import { test, expect } from "@playwright/test";
import {
  ALTGRAPH_STUB,
  LAYER,
  SEED,
  US,
  boot,
  chord,
  clearLiveLog,
  hold,
  liveLog,
  press,
  sleep,
  snap,
  stateOf,
} from "./keyboard-harness.js";

const setup = async (page, seed = SEED) => {
  await page.addInitScript({ content: ALTGRAPH_STUB });
  const cdp = await page.context().newCDPSession(page);
  await boot(page, seed);
  await press(cdp, US.f6, 200);
  return cdp;
};

test("Shift snaps rotation to 15°", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, { ...US.E, shift: true }, 110);
  expect((await snap(page)).rot).toBe(15);
  await press(cdp, { ...US.E, shift: true }, 110);
  expect((await snap(page)).rot).toBe(30);
  await press(cdp, { ...US.Q, shift: true }, 110);
  expect((await snap(page)).rot).toBe(15);
});

test("rotation wraps in both directions", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.Q, 110);
  expect((await snap(page)).rot).toBe(359);
  await press(cdp, US.E, 110);
  expect((await snap(page)).rot).toBe(0);
});

test("opacity clamps at 100", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0, { opacity: 0.99 })]));
  expect((await snap(page)).opacity).toBe(99);
  await press(cdp, { ...US.T, shift: true }, 110);
  expect((await snap(page)).opacity).toBe(100);
  await press(cdp, { ...US.T, shift: true }, 110);
  expect((await snap(page)).opacity).toBe(100);
});

test("opacity clamps at 10", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0, { opacity: 0.15 })]));
  expect((await snap(page)).opacity).toBe(15);
  await press(cdp, { ...US.G, shift: true }, 110);
  expect((await snap(page)).opacity).toBe(10);
});

test("C wraps the fill palette at both ends", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.digit(8), 110);
  expect((await snap(page)).fill).toBe("black");
  await press(cdp, US.C, 110);
  expect((await snap(page)).fill).toBe("primary");
  await press(cdp, US.digit(1), 110);
  await press(cdp, { ...US.C, shift: true }, 110);
  expect((await snap(page)).fill).toBe("black");
});

test("Ctrl+D duplicates 16px down-right and selects the copy", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await press(cdp, US.dup, 120);
  const b = await snap(page);
  expect(b.layers).toBe(a.layers + 1);
  expect(b.x - a.x).toBe(16);
  expect(b.y - a.y).toBe(16);
  expect(b.idx).toBe(a.idx + 1);
});

test("Backspace deletes like Delete", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await press(cdp, US.backspace, 120);
  expect((await snap(page)).layers).toBe(a.layers - 1);
});

test("held keys auto-repeat movement", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await hold(cdp, US.W, 3);
  const b = await snap(page);
  expect(b.y - a.y).toBeCloseTo(-4, 4);
});

test("held confirm key arms once and never clears", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await hold(cdp, US.X, 4);
  const b = await snap(page);
  expect(b.layers).toBe(a.layers);
  expect(b.toast).toContain("Clear everything");
});

test("undo restores a fill change", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.digit(3), 110);
  expect((await snap(page)).fill).toBe("tertiary");
  await press(cdp, US.undo, 120);
  await press(cdp, US.tab, 130);
  expect((await snap(page)).fill).toBe("primary");
});

test("edits survive a reload", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.digit(2), 110);
  await sleep(400);
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector("[data-canvas]"), null, {
    timeout: 20_000,
  });
  await press(cdp, US.f6, 200);
  expect((await snap(page)).fill).toBe("secondary");
});

test("a real Shift keydown/keyup chord drives the coarse step", async ({ page }) => {
  const cdp = await setup(page);
  await chord(cdp, ["shift"], US.E, 110);
  expect((await snap(page)).rot).toBe(15);
});

test("Caps Lock letters match case-insensitively", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, { key: "B", code: "KeyB" }, 140);
  expect((await snap(page)).bg).toBe(true);
});

test("held toggles fire once, not on every auto-repeat", async ({ page }) => {
  const cdp = await setup(page);
  await hold(cdp, US.B, 4);
  expect((await snap(page)).bg).toBe(true);
  await hold(cdp, US.P, 4);
  expect((await snap(page)).panel).toBe("mini");
});

test("held surprise key arms once", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await hold(cdp, US.I, 4);
  const b = await snap(page);
  expect(b.layers).toBe(a.layers);
  expect(b.toast).toContain("Surprise me");
});

test("a held resize collapses into one undo step", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await hold(cdp, US.R, 3);
  const grown = await snap(page);
  expect(grown.size).toBeGreaterThan(a.size);
  await press(cdp, US.undo, 140);
  await press(cdp, US.tab, 140);
  expect((await snap(page)).size).toBeCloseTo(a.size, 4);
});

test("identical announcements are re-announced", async ({ page }) => {
  const cdp = await setup(page);
  await sleep(420);
  await clearLiveLog(page);
  await press(cdp, US.W, 140);
  await sleep(420);
  await press(cdp, US.W, 140);
  await sleep(200);
  const hits = (await liveLog(page)).filter((t) => t && t.includes("fill color"));
  expect(hits.length).toBeGreaterThanOrEqual(2);
  expect(hits[0]).toBe(hits[1]);
});

test("rapid steps announce only the final value", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0, { opacity: 0.5 })]));
  await press(cdp, { ...US.T, shift: true }, 60);
  await press(cdp, US.G, 60);
  await sleep(500);
  expect((await snap(page)).live).toContain("opacity 59%");
});

test("Mod+Z inside a text input stays native", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0)], { format: "custom" }));
  await press(cdp, US.digit(3), 120);
  expect((await snap(page)).fill).toBe("tertiary");

  await page.getByRole("tab", { name: /Global/ }).click();
  await page.locator('input[aria-label="Width in pixels"]').focus();
  await press(cdp, US.undo, 140);

  expect((await snap(page)).fill).toBe("tertiary");
});

test("arming disarms on any other keydown", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);

  await press(cdp, US.X, 90);
  expect((await snap(page)).toast).toContain("Clear everything");

  await press(cdp, US.W, 90);
  await press(cdp, US.X, 90);
  const s = await snap(page);
  expect(s.toast).toContain("Clear everything");
  expect(s.layers).toBe(a.layers);
});

test("shape actions work outside the canvas while a shape is selected", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.f6, 200);
  expect((await snap(page)).canvasFocused).toBe(false);

  const before = await snap(page);
  await page.getByRole("tab", { name: /Global/ }).focus();
  await press(cdp, US.W, 130);

  const after = await snap(page);
  expect(after.canvasFocused).toBe(false);
  expect(after.y).toBe(before.y - 1);
});

test("panel and background shortcuts work with no shape selected", async ({ page }) => {
  const cdp = await setup(page, stateOf([]));
  expect((await snap(page)).layers).toBe(0);

  await press(cdp, US.P, 130);
  expect((await snap(page)).panel).toBe("mini");

  await press(cdp, US.B, 130);
  expect((await snap(page)).bg).toBe(true);
});

test("arrow keys inside sidebar widgets do not move the shape", async ({ page }) => {
  const cdp = await setup(page);
  await page.getByRole("tab", { name: /Shape/ }).click();
  const before = await snap(page);

  await page.getByRole("tab", { name: /Global/ }).focus();
  await press(cdp, US.right, 130);
  expect((await snap(page)).x).toBe(before.x);

  await page.getByRole("radio").first().focus();
  await press(cdp, US.down, 130);
  expect((await snap(page)).y).toBe(before.y);
});
