// Export menu and panel-layout checks. Split out from the functional shortcut
// suite so a layout change to the sidebar cannot cascade through key handling.
import { test, expect } from "@playwright/test";
import { ALTGRAPH_STUB, SEED, US, boot, press, sleep, snap } from "./keyboard-harness.js";

const setup = async (page, keys = US) => {
  await page.addInitScript({ content: ALTGRAPH_STUB });
  const cdp = await page.context().newCDPSession(page);
  await boot(page, SEED);
  await press(cdp, keys.f6, 200);
  return cdp;
};

test.describe("export menu", () => {
  test("full panel: trigger, Mod+S, viewport, focus return", async ({ page }) => {
    const cdp = await setup(page);

    let s = await snap(page);
    expect(s.panel).toBe("full");
    expect(s.exportPanel).toBe(true);
    expect(s.exportCanvas).toBe(false);

    await press(cdp, US.save, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(true);
    expect(s.exportMenuInView).toBe(true);
    expect(s.exportInBody).toBe(true);
    expect(s.activeText).toContain("PNG 2");

    await press(cdp, US.esc, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(false);
    expect(s.active).toBe("Export (Ctrl+S)");
  });

  test("hidden panel: no trigger, Mod+S opens, focus returns to canvas", async ({ page }) => {
    const cdp = await setup(page);

    await press(cdp, US.P, 150);
    await press(cdp, US.P, 150);
    let s = await snap(page);
    expect(s.panel).toBe(null);
    expect(s.exportPanel).toBe(false);
    expect(s.exportCanvas).toBe(false);

    await press(cdp, US.save, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(true);
    expect(s.exportMenuInView).toBe(true);
    expect(s.exportInBody).toBe(true);

    await press(cdp, US.esc, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(false);
    expect(s.canvasFocused).toBe(true);
  });

  test("mini panel: trigger above undo, menu not clipped", async ({ page }) => {
    const cdp = await setup(page);

    await press(cdp, US.P, 150);
    let s = await snap(page);
    expect(s.panel).toBe("mini");
    expect(s.exportPanel).toBe(true);
    expect(s.exportBeforeUndo).toBe(true);

    await press(cdp, US.save, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(true);
    expect(s.exportMenuInView).toBe(true);
    expect(s.exportInBody).toBe(true);

    const right = await page.evaluate(() => {
      const r = document.querySelector('[role="menu"]').getBoundingClientRect();
      return r.right <= innerWidth;
    });
    expect(right).toBe(true);

    await press(cdp, US.esc, 120);
    s = await snap(page);
    expect(s.exportOpen).toBe(false);
  });

  test("menu: arrow keys move between items, Tab closes and returns focus", async ({ page }) => {
    const cdp = await setup(page);
    await press(cdp, US.save, 120);

    expect((await snap(page)).activeText).toContain("PNG 2");

    await press(cdp, US.down, 70);
    expect((await snap(page)).activeText).toContain("PNG 1");

    await press(cdp, US.up, 70);
    await press(cdp, US.up, 70);
    expect((await snap(page)).activeText).toContain("JSON");

    await press(cdp, US.end, 70);
    expect((await snap(page)).activeText).toContain("JSON");
    await press(cdp, US.home, 70);
    expect((await snap(page)).activeText).toContain("PNG 2");

    await press(cdp, US.tab, 90);
    const s = await snap(page);
    expect(s.exportOpen).toBe(false);
    expect(s.active).toBe("Export (Ctrl+S)");
  });

  test("menu: closes when focus is lost", async ({ page }) => {
    const cdp = await setup(page);
    await press(cdp, US.save, 120);
    expect((await snap(page)).exportOpen).toBe(true);

    await page.evaluate(() => document.querySelector("[data-canvas]").focus());
    await sleep(80);
    expect((await snap(page)).exportOpen).toBe(false);
  });
});
