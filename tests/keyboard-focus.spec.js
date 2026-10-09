// focusing via tab and F6 through the canvas and the sidebar
import { test, expect } from "@playwright/test";
import { ALTGRAPH_STUB, LAYER, SEED, US, boot, press, snap, stateOf } from "./keyboard-harness.js";

const setup = async (page, seed = SEED) => {
  await page.addInitScript({ content: ALTGRAPH_STUB });
  const cdp = await page.context().newCDPSession(page);
  await boot(page, seed);
  await press(cdp, US.f6, 200);
  return cdp;
};

test("Tab walks the shapes, then leaves at the end", async ({ page }) => {
  const cdp = await setup(page);
  let s = await snap(page);
  expect(s.canvasFocused).toBe(true);
  expect(s.idx).toBe(0);

  await press(cdp, US.tab, 130);
  expect((await snap(page)).idx).toBe(1);
  await press(cdp, US.tab, 130);
  expect((await snap(page)).idx).toBe(2);

  await press(cdp, US.tab, 160);
  s = await snap(page);
  expect(s.canvasFocused).toBe(false);
  expect(s.idx).toBe(2);
});

test("Shift+Tab leaves from the first shape", async ({ page }) => {
  const cdp = await setup(page);
  expect((await snap(page)).idx).toBe(0);
  await press(cdp, { ...US.tab, shift: true }, 160);
  expect((await snap(page)).canvasFocused).toBe(false);
});

test("Escape leaves the canvas without deselecting", async ({ page }) => {
  const cdp = await setup(page);
  expect((await snap(page)).idx).toBe(0);

  await press(cdp, US.esc, 160);
  let s = await snap(page);
  expect(s.canvasFocused).toBe(false);
  expect(s.idx).toBe(0);

  await press(cdp, US.f6, 200);
  s = await snap(page);
  expect(s.canvasFocused).toBe(true);
  expect(s.idx).toBe(0);
});

test("Escape in hidden mode restores the sidebar", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.P, 150);
  await press(cdp, US.P, 150);
  expect((await snap(page)).panel).toBe(null);

  await press(cdp, US.esc, 180);
  const s = await snap(page);
  expect(s.panel).toBe("full");
  expect(s.canvasFocused).toBe(false);
});

test("F6 switches zones both ways", async ({ page }) => {
  const cdp = await setup(page);
  expect((await snap(page)).canvasFocused).toBe(true);
  await press(cdp, US.f6, 200);
  expect((await snap(page)).canvasFocused).toBe(false);
  await press(cdp, US.f6, 200);
  expect((await snap(page)).canvasFocused).toBe(true);
});

test("Tab with no shapes leaves the canvas", async ({ page }) => {
  const cdp = await setup(page, stateOf([]));
  expect((await snap(page)).canvasFocused).toBe(true);
  await press(cdp, US.tab, 160);
  expect((await snap(page)).canvasFocused).toBe(false);
});

test("deleting the last shape keeps focus on the canvas", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0)]));
  await press(cdp, US.del, 140);
  let s = await snap(page);
  expect(s.layers).toBe(0);
  expect(s.canvasFocused).toBe(true);
  await press(cdp, US.tab, 160);
  expect((await snap(page)).canvasFocused).toBe(false);
});

test("single-key shortcuts stay out of sidebar controls", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.f6, 200);
  const before = await snap(page);

  await page.locator("#sm-opacity").focus();
  await press(cdp, US.B, 120);
  await press(cdp, US.digit(3), 120);
  const after = await snap(page);

  expect(after.bg).toBe(false);
  expect(after.fill).toBe(before.fill);
});

test("typing into a number input edits it, not the canvas", async ({ page }) => {
  const cdp = await setup(page, stateOf([LAYER(0)], { format: "custom" }));
  await page.getByRole("tab", { name: /Global/ }).click();
  const width = page.locator('input[aria-label="Width in pixels"]');
  await width.focus();
  const before = await snap(page);

  await press(cdp, US.digit(3), 120);
  await press(cdp, US.B, 120);
  await press(cdp, US.R, 120);
  const after = await snap(page);

  expect(after.fill).toBe(before.fill);
  expect(after.bg).toBe(false);
  expect(after.size).toBe(before.size);
  expect(await width.inputValue()).not.toBe("1920");
});

test("shape picker grid is one tab stop and moves by rows", async ({ page }) => {
  const cdp = await setup(page);
  await press(cdp, US.N, 160);

  const grid = page.locator('section[aria-label="Shape picker"] div.grid');
  await expect(grid).toBeVisible();

  const tabStops = await grid.evaluate(
    (el) => [...el.querySelectorAll("button")].filter((b) => b.tabIndex === 0).length,
  );
  expect(tabStops).toBe(1);

  const labels = await grid
    .locator("button")
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  await grid.locator("button").first().focus();

  await press(cdp, US.down, 120);
  const down = await page.evaluate(
    (names) => names.indexOf(document.activeElement?.getAttribute("aria-label")),
    labels,
  );
  expect(down).toBe(4);

  await press(cdp, US.up, 120);
  const up = await page.evaluate(
    (names) => names.indexOf(document.activeElement?.getAttribute("aria-label")),
    labels,
  );
  expect(up).toBe(0);
});
