// Browser checks for the read-only barter page: the trade-offers scroll region is a focusable, named region.
// Start the demo first (`PORT=4185 node scripts/serve.mjs`), then run `BASE=http://localhost:4185/ node scripts/checks/barter.mjs`.
import { BASE, loadPlaywright, createChecker } from './lib.mjs';
import { BARTER_OFFERS } from '../../src/data/fixtures.js';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const root = BASE.endsWith('/') ? BASE : `${BASE}/`;
const ROUTE = '#/barter';
const REGION_NAME = 'Trade offers';
const MAX_TABS = 6;

const browser = await chromium.launch();

async function open(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${root}${ROUTE}`);
  await page.waitForSelector('main table');
  return { page, context };
}

try {
  // (a) No horizontal overflow on the page itself at narrow widths.
  for (const width of [320, 390]) {
    const { page, context } = await open(width);
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    check(
      `(a) no page-level horizontal overflow on ${ROUTE} at ${width}px (scrollWidth ${metrics.scrollWidth}, innerWidth ${metrics.innerWidth})`,
      metrics.scrollWidth <= metrics.innerWidth,
    );
    await context.close();
  }

  // (b)-(d) Keyboard reach, focus outline and keyboard scrolling of the region at 320px.
  {
    const { page, context } = await open(320);
    // The outer <section aria-labelledby> is also a region with this name but is not focusable, so target the focusable wrapper.
    const region = page.getByRole('region', { name: REGION_NAME }).and(page.locator('[tabindex="0"]'));
    check('(b) exactly one focusable region named "Trade offers" exists on the barter page', (await region.count()) === 1);

    // Move focus to <main> the way the app does on render, so the next Tab starts from the header area.
    await page.waitForFunction(() => document.activeElement?.id === 'main');
    let reached = false;
    let tabs = 0;
    for (; tabs < MAX_TABS && !reached; tabs += 1) {
      await page.keyboard.press('Tab');
      reached = await region.evaluate((el) => el === document.activeElement).catch(() => false);
    }
    check(`(b) region named "Trade offers" with role region receives focus by Tab (reached after ${tabs} Tab press(es), limit ${MAX_TABS})`, reached);

    if (reached) {
      const style = await region.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, focusVisible: el.matches(':focus-visible'), tabindex: el.getAttribute('tabindex') };
      });
      const widthPx = Number.parseFloat(style.outlineWidth);
      check(`(c) focused region has a visible outline (outline-style ${style.outlineStyle}, outline-width ${style.outlineWidth}, :focus-visible ${style.focusVisible})`, style.outlineStyle !== 'none' && widthPx > 0);

      const before = await region.evaluate((el) => ({ scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
      const overflows = before.scrollWidth > before.clientWidth;
      if (!overflows) {
        console.log(`    table is not wider than the region at 320px (scrollWidth ${before.scrollWidth}, clientWidth ${before.clientWidth})`);
      }
      await page.keyboard.press('ArrowRight');
      // Chromium animates keyboard scrolling, so poll for the new position instead of reading it immediately.
      await page
        .waitForFunction((start) => document.activeElement?.scrollLeft > start, before.scrollLeft, { timeout: 3000 })
        .catch(() => {});
      const after = await region.evaluate((el) => ({ scrollLeft: el.scrollLeft }));
      check(
        `(d) ArrowRight scrolls the focused region horizontally at 320px (scrollLeft ${before.scrollLeft} -> ${after.scrollLeft}, scrollWidth ${before.scrollWidth}, clientWidth ${before.clientWidth})`,
        overflows && after.scrollLeft > before.scrollLeft,
      );
    } else {
      check('(c) focused region has a visible outline', false);
      check('(d) ArrowRight scrolls the focused region horizontally at 320px', false);
    }
    await context.close();
  }

  // (e) Column headings and offer rows are still in the DOM.
  {
    const { page, context } = await open(1280);
    const info = await page.evaluate(() => ({
      headings: [...document.querySelectorAll('main table thead th')].map((th) => th.textContent.trim()),
      rows: document.querySelectorAll('main table tbody tr').length,
      caption: document.querySelector('main table caption')?.textContent.trim() ?? null,
    }));
    const headingsOk = ['Offered', 'Wanted', 'Status'].every((text) => info.headings.includes(text)) && info.headings.length === 3;
    check(`(e) column headings present (${info.headings.join(', ') || 'none'})`, headingsOk);
    check(`(e) offer rows present (${info.rows} of ${BARTER_OFFERS.length} fixture offers)`, info.rows === BARTER_OFFERS.length && info.rows > 0);
    check(`(e) table caption unchanged ("${info.caption}")`, info.caption === 'Demo trade offers, read-only');
    await context.close();
  }

  // (f) At 1280px the region needs no horizontal scroll.
  {
    const { page, context } = await open(1280);
    const metrics = await page.getByRole('region', { name: REGION_NAME }).and(page.locator('[tabindex="0"]')).evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    check(`(f) region does not need horizontal scroll at 1280px (scrollWidth ${metrics.scrollWidth}, clientWidth ${metrics.clientWidth})`, metrics.scrollWidth <= metrics.clientWidth);
    await context.close();
  }
} finally {
  await browser.close();
}

finish();
