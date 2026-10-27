// Browser checks for the create-listing page: error summary links, summary focus, price errors, double submit, discard.
// Start the demo first (`npm start`, or set BASE), then run this file directly or through `npm run check:browser`.
import { BASE, createChecker, loadPlaywright } from './lib.mjs';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const browser = await chromium.launch();

const VALID_FIELDS = { title: 'Test bench', price: '12.5', category: 'garden', condition: 'good', region: 'Harbour' };

// Each journey gets its own browser context so drafts saved in one check cannot leak into another.
async function openEditor(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${BASE}#/sell`);
  await page.waitForSelector('.editor');
  return { context, page, pageErrors };
}

async function listingCount(page) {
  await page.waitForSelector('.results-summary');
  const text = await page.locator('.results-summary').innerText();
  const match = text.match(/(\d+) listings? found/);
  return match ? Number(match[1]) : Number.NaN;
}

try {
  // (a) Error summary links focus their field without changing the route, at phone and desktop widths.
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const label = `${viewport.width}px`;
    const { context, page, pageErrors } = await openEditor(viewport);

    await page.getByRole('button', { name: 'Submit (simulated)' }).click();
    const summary = page.locator('.error-summary');
    check(`error summary is visible after empty submit at ${label}`, await summary.isVisible());
    const links = summary.locator('a');
    check(`error summary holds at least two links at ${label}`, (await links.count()) >= 2);
    check(`error summary takes focus after a failed submit at ${label}`, await summary.evaluate((node) => node === document.activeElement));

    const first = links.first();
    const targetId = (await first.getAttribute('href')).split('/').pop();
    await first.click();
    // A hash change, if one happened, renders the router's not-found page a moment later. Let it settle before reading the page.
    await page.waitForTimeout(300);

    check(`clicking an error link leaves the hash at #/sell at ${label}`, (await page.evaluate(() => location.hash)) === '#/sell');
    check(`clicking an error link does not show the not-found page at ${label}`, !(await page.locator('body').innerText()).includes('That page does not exist'));
    check(`clicking an error link focuses its field (#${targetId}) at ${label}`, (await page.evaluate(() => document.activeElement?.id)) === targetId);
    const inView = await page.evaluate((id) => {
      const node = document.getElementById(id);
      if (!node) return false;
      const box = node.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= window.innerHeight;
    }, targetId);
    check(`clicking an error link scrolls its field into view at ${label}`, inView);
    // Middle-click opens the link in a new tab. That tab must land on the sell page, not on the not-found page.
    const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }), first.click({ button: 'middle' })]);
    await popup.waitForLoadState('domcontentloaded');
    await popup.waitForSelector('.editor', { timeout: 5000 }).catch(() => {});
    check(`middle-click on an error link opens the sell page at ${label}`, popup.url().includes('#/sell/') && (await popup.locator('.editor').count()) === 1);
    check(`middle-click on an error link does not show the not-found page at ${label}`, !(await popup.locator('body').innerText()).includes('That page does not exist'));
    await popup.close();
    check(`no uncaught page errors at ${label}`, pageErrors.length === 0);
    await context.close();
  }

  // (b) A non-numeric price shows an error, and a valid price clears it.
  {
    const { context, page, pageErrors } = await openEditor({ width: 1280, height: 800 });
    const price = page.getByLabel('Price (EUR)');
    const priceError = page.locator('#price-error');
    await price.fill('abc');
    await page.getByRole('button', { name: 'Submit (simulated)' }).click();
    check('non-numeric price shows a price error', (await priceError.isVisible()) && (await priceError.textContent()).trim().length > 0);
    check('price field is marked aria-invalid', (await price.getAttribute('aria-invalid')) === 'true');
    await price.fill('12');
    check('typing a valid price clears the price error', !(await priceError.isVisible()));
    check('price field is no longer aria-invalid', (await price.getAttribute('aria-invalid')) === null);
    check('no uncaught page errors during price check', pageErrors.length === 0);
    await context.close();
  }

  // (c) A double-click on Submit creates exactly one listing.
  {
    const { context, page, pageErrors } = await openEditor({ width: 1280, height: 800 });
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await page.goto(`${BASE}#/`);
    const before = await listingCount(page);
    await nav.getByRole('link', { name: 'Sell' }).click();

    await page.getByLabel('Title').fill(VALID_FIELDS.title);
    await page.getByLabel('Price (EUR)').fill(VALID_FIELDS.price);
    await page.getByLabel('Category').selectOption(VALID_FIELDS.category);
    await page.getByLabel('Condition').selectOption(VALID_FIELDS.condition);
    await page.getByLabel('Coarse area').selectOption(VALID_FIELDS.region);
    await page.getByRole('button', { name: 'Submit (simulated)' }).dblclick();
    await page.getByText('Simulated: your listing exists only').waitFor({ timeout: 3000 });

    await nav.getByRole('link', { name: 'Browse' }).click();
    const after = await listingCount(page);
    check(`double-click on Submit adds exactly one listing (${before} -> ${after})`, Number.isFinite(before) && after === before + 1);
    check('no uncaught page errors during double-submit check', pageErrors.length === 0);
    await context.close();
  }

  // (d) Escape on the discard dialog keeps the typed title.
  {
    const { context, page, pageErrors } = await openEditor({ width: 1280, height: 800 });
    await page.getByLabel('Title').fill('Keep this title');
    await page.getByRole('button', { name: 'Discard draft' }).click();
    await page.waitForSelector('dialog');
    await page.keyboard.press('Escape');
    await page.waitForSelector('dialog', { state: 'detached' });
    check('Escape on discard dialog keeps the title text', (await page.getByLabel('Title').inputValue()) === 'Keep this title');
    check('no uncaught page errors during discard check', pageErrors.length === 0);
    await context.close();
  }
} finally {
  await browser.close();
}

finish();
