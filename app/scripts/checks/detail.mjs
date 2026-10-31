// Browser checks for the listing detail page: Save and Unsave announce the listing title, and the demo messaging button
// announces that nothing was sent. Start the demo first (`PORT=4173 npm start`), then run `BASE=http://localhost:4173/ node scripts/checks/detail.mjs`.
import { BASE, launchBrowser, createChecker } from './lib.mjs';

const { check, finish } = createChecker();
const root = BASE.endsWith('/') ? BASE : `${BASE}/`;
const ROUTE = '#/listing/demo-001';
const MESSAGE_DEMO = 'Demo only: messaging is not implemented, nothing was sent.';

const waitForStatusExact = (page, text) =>
  page.waitForFunction((t) => document.getElementById('status')?.textContent === t, text, { timeout: 2000 }).then(() => true, () => false);

const browser = await launchBrowser();

try {
  // Fresh context so no earlier saved-listing state from another check leaks into this one.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${root}${ROUTE}`);
  await page.waitForSelector('main h1');
  const title = (await page.textContent('main h1')).trim();
  const saveButton = page.getByRole('button', { name: 'Save listing' });

  // (a) Save announces the title through the status region and flips the toggle state.
  await saveButton.click();
  check('(a) Save sets aria-pressed to "true"', (await page.getByRole('button', { name: 'Remove from saved' }).getAttribute('aria-pressed')) === 'true');
  check(`(a) Save announces "Listing saved: ${title}."`, await waitForStatusExact(page, `Listing saved: ${title}.`));

  // (b) Unsave announces the title through the status region and restores the toggle state.
  await page.getByRole('button', { name: 'Remove from saved' }).click();
  check('(b) Unsave sets aria-pressed to "false"', (await page.getByRole('button', { name: 'Save listing' }).getAttribute('aria-pressed')) === 'false');
  check(`(b) Unsave announces "Listing removed from saved: ${title}."`, await waitForStatusExact(page, `Listing removed from saved: ${title}.`));

  // (c) The demo messaging button never sends anything and says so.
  await page.getByRole('button', { name: 'Message seller (demo)' }).click();
  check('(c) "Message seller (demo)" announces that nothing was sent', await waitForStatusExact(page, MESSAGE_DEMO));

  await context.close();
} finally {
  await browser.close();
}

finish();
