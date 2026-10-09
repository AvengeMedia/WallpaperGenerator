// only actions that normally trigger an action in the browser are `preventDefault`ed
import { test, expect } from "@playwright/test";
import { ALTGRAPH_STUB, SEED, US, boot, press, snap } from "./keyboard-harness.js";

const setup = async (page) => {
  await page.addInitScript({ content: ALTGRAPH_STUB });
  const cdp = await page.context().newCDPSession(page);
  await boot(page, SEED);
  await press(cdp, US.f6, 200);
  await page.evaluate(() => {
    window.__prevented = null;
    document.addEventListener(
      "keydown",
      (e) => {
        setTimeout(() => {
          window.__prevented = e.defaultPrevented;
        }, 0);
      },
      true,
    );
  });
  return cdp;
};

const prevented = async (page, cdp, key) => {
  await page.evaluate(() => (window.__prevented = null));
  await press(cdp, key, 120);
  return page.evaluate(() => window.__prevented);
};

test("claimed chords swallow the default, plain keys do not", async ({ page }) => {
  const cdp = await setup(page);
  expect(await prevented(page, cdp, { key: "k", code: "KeyK" })).toBe(false);
  expect(await prevented(page, cdp, US.dup)).toBe(true);
  await press(cdp, US.undo, 120);
  expect(await prevented(page, cdp, US.save)).toBe(true);
  await press(cdp, US.esc, 120);
  expect(await prevented(page, cdp, US.f1)).toBe(true);
});

test("Ctrl+Y redoes", async ({ page }) => {
  const cdp = await setup(page);
  const a = await snap(page);
  await press(cdp, US.dup, 120);
  await press(cdp, US.undo, 130);
  await press(cdp, US.redoY, 130);
  expect((await snap(page)).layers).toBe(a.layers + 1);
});
