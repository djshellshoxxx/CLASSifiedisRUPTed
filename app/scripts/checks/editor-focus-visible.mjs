// Browser checks for keyboard-initiated failed submits on the create-listing page: the error summary takes focus and shows
// a visible focus indicator. editor.mjs checks focus with a mouse click, which does not set :focus-visible, so this file uses the keyboard.
// Start the demo first (`PORT=4173 npm start`), then run `BASE=http://localhost:4173/ node scripts/checks/editor-focus-visible.mjs`.
import { BASE, createChecker, launchBrowser } from './lib.mjs';

const { check, finish } = createChecker();
const browser = await launchBrowser();

// The browser's default focus ring is at least 2px wide. A 'none' or zero-width outline counts as invisible.
const MIN_OUTLINE_PX = 2;

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const label = `${viewport.width}px`;
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`${BASE}#/sell`);
    await page.waitForSelector('.editor');

    // Tab-style keyboard submit: focus the submit button and press Enter, as a keyboard user would.
    await page.getByRole('button', { name: 'Submit (simulated)' }).focus();
    await page.keyboard.press('Enter');

    const summary = page.locator('.error-summary');
    await summary.waitFor({ state: 'visible' });

    check(`(a) keyboard submit moves focus to the error summary at ${label}`, await summary.evaluate((node) => node === document.activeElement));
    check(`(b) error summary matches :focus-visible after a keyboard submit at ${label}`, await summary.evaluate((node) => node.matches(':focus-visible')));

    const outline = await summary.evaluate((node) => {
      const cs = getComputedStyle(node);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor };
    });
    check(
      `(c) error summary has a visible focus outline at ${label} (style ${outline.style}, width ${outline.width}px, color ${outline.color})`,
      outline.style !== 'none' && outline.width >= MIN_OUTLINE_PX && outline.color !== 'rgba(0, 0, 0, 0)',
    );

    await context.close();
  }
} finally {
  await browser.close();
}

finish();
