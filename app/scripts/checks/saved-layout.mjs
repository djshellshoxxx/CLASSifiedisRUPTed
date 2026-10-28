// Layout checks for the saved page with populated cards. layout.mjs only sees the empty saved state, so this file seeds
// saved listings through the app's own storage key and checks overflow and touch targets on the cards.
// Start the demo first (`PORT=4173 npm start`), then run `BASE=http://localhost:4173/ node scripts/checks/saved-layout.mjs`.
import { BASE, loadPlaywright, createChecker } from './lib.mjs';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const root = BASE.endsWith('/') ? BASE : `${BASE}/`;
const ROUTE = '#/saved';
const SAVED_KEY = 'classrup.saved';
const SEEDED_IDS = ['demo-001', 'demo-002', 'demo-003'];
const WIDTHS = [320, 390, 768, 1280];

const browser = await chromium.launch();

// Saved state lives in localStorage per origin. Seed it from the home route, then move to the saved route. The saved view reads storage on each render.
async function openSavedWithItems(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(root);
  await page.waitForSelector('#main > *');
  await page.evaluate(([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)), [SAVED_KEY, SEEDED_IDS]);
  await page.goto(`${root}${ROUTE}`);
  await page.waitForSelector('main .card-grid');
  return { page, context };
}

try {
  for (const width of WIDTHS) {
    const { page, context } = await openSavedWithItems(width);

    // (a) The seed took effect, so the overflow and touch checks below run on populated cards.
    const cardCount = await page.locator('main article.card').count();
    check(`(a) saved page shows ${SEEDED_IDS.length} seeded cards at ${width}px (found ${cardCount})`, cardCount === SEEDED_IDS.length);

    // (b) No page-level horizontal overflow with populated cards.
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    check(
      `(b) no horizontal overflow on ${ROUTE} with populated cards at ${width}px (scrollWidth ${metrics.scrollWidth}, innerWidth ${metrics.innerWidth})`,
      metrics.scrollWidth <= metrics.innerWidth,
    );

    // (c) Touch targets on the populated page at the phone width: card links and Unsave buttons are at least 24x24 CSS px.
    if (width === 390) {
      const result = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll('main a, main button')].filter((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0;
        });
        const small = nodes
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter((box) => box.w < 24 || box.h < 24);
        return { total: nodes.length, small };
      });
      const names = result.small.map((box) => `"${box.label}" ${box.w}x${box.h}`).join('; ');
      check(
        `(c) touch targets at least 24x24 on populated ${ROUTE} at 390px (${result.total} controls${names ? `; too small: ${names}` : ''})`,
        result.total > 0 && result.small.length === 0,
      );
    }

    await context.close();
  }
} finally {
  await browser.close();
}

finish();
