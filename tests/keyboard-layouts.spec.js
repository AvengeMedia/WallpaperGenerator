// keyboard-layout-sensitive shortcuts
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
  synthKeys,
} from "./keyboard-harness.js";

const setup = async (page, keys, stub) => {
  await page.addInitScript({ content: ALTGRAPH_STUB });
  if (stub) await page.addInitScript({ content: stub });
  const cdp = await page.context().newCDPSession(page);
  await boot(page, SEED);
  await press(cdp, keys.f6, 200);
  await press(cdp, keys.tab, 200);
  return cdp;
};

for (const [name, keys, stub] of /** @type {[string, typeof DE, string | null][]} */ ([
  ["German", DE, null],
  ["AZERTY", AZ, AZ_STUB],
])) {
  test.describe(`${name} layout`, () => {
    test("move keys act on the physical WASD cluster", async ({ page }) => {
      const cdp = await setup(page, keys, stub);
      const a = await snap(page);
      await press(cdp, keys.W, 110);
      const b = await snap(page);
      expect(b.y - a.y).toBeCloseTo(-1, 4);
      await press(cdp, keys.A, 110);
      const c = await snap(page);
      expect(c.x - b.x).toBeCloseTo(-1, 4);
    });

    test("Ctrl+Z undoes without also moving", async ({ page }) => {
      const cdp = await setup(page, keys, stub);
      const a = await snap(page);
      await press(cdp, keys.W, 110);
      const moved = await snap(page);
      expect(moved.y - a.y).toBeCloseTo(-1, 4);

      await press(cdp, keys.undo, 120);
      await press(cdp, keys.tab, 120);
      await press(cdp, keys.tab, 120);
      const undone = await snap(page);
      expect(undone.y).toBeCloseTo(a.y, 4);
      expect(undone.layers).toBe(a.layers);
    });

    test("digits choose the fill, shifted digits the overlap", async ({ page }) => {
      const cdp = await setup(page, keys, stub);
      await press(cdp, keys.digit(1), 110);
      expect((await snap(page)).fill).toBe("primary");
      await press(cdp, keys.shiftDigit(8), 110);
      expect((await snap(page)).overlap).toBe("black");
    });

    test("? opens the cheat sheet", async ({ page }) => {
      const cdp = await setup(page, keys, stub);
      await press(cdp, keys.cheat, 130);
      expect((await snap(page)).dialog).toBe(true);
      await press(cdp, keys.esc, 130);
      expect((await snap(page)).dialog).toBe(false);
    });
  });
}

test("AZERTY: the comma key cap is the rotate alias, not shuffle", async ({ page }) => {
  const cdp = await setup(page, AZ, AZ_STUB);
  const a = await snap(page);
  await press(cdp, { key: ",", code: "KeyM" }, 120);
  const b = await snap(page);
  expect(b.rot).toBe((a.rot + 359) % 360);
  expect(b.d).toBe(a.d);
});

test("AZERTY: the m letter (Semicolon) reshapes the shape", async ({ page }) => {
  const cdp = await setup(page, AZ, AZ_STUB);
  const a = await snap(page);
  await press(cdp, { key: "m", code: "Semicolon" }, 120);
  const b = await snap(page);
  expect(b.d).not.toBe(a.d);
});

test("dead-key and IME composition events do not trigger shortcuts", async ({ page }) => {
  await setup(page, US, null);
  const a = await snap(page);
  await synthKeys(page, { key: "Dead", code: "Backquote" });
  await synthKeys(page, { key: "Dead", code: "BracketLeft" });
  await synthKeys(page, { key: "Process", code: "KeyR", isComposing: true });
  await synthKeys(page, { key: "Unidentified", code: "KeyB" });
  const b = await snap(page);
  expect(diffInfo(a, b)).toBe("no diff");
});
