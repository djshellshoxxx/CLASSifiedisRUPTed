// Browser smoke test for the demo journeys. Run `npm start` first, or set BASE.
import { launchBrowser } from './checks/lib.mjs';

const base = process.env.BASE ?? 'http://localhost:4173/';
const browser = await launchBrowser();
const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failures.push(name);
};

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForSelector('.card-grid');
  check(`browse renders cards at ${viewport.width}px`, (await page.locator('.card').count()) > 0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(`no horizontal overflow at ${viewport.width}px`, !overflow);

  await page.getByRole('searchbox').fill('zzz-no-match');
  check('empty state shown for no matches', await page.getByText('No listings match these filters.').isVisible());
  await page.getByRole('button', { name: 'Clear filters' }).click();

  const save = page.getByRole('button', { name: /^Save .*/ }).first();
  await save.click();
  await page.goto(`${base}#/saved`);
  check('saved listing appears on saved page', (await page.locator('.card').count()) === 1);

  await page.goto(`${base}#/sell`);
  await page.getByRole('button', { name: 'Submit (simulated)' }).click();
  check('submit with empty fields shows error summary', await page.getByRole('alert').first().isVisible());

  await page.getByLabel('Title').fill('Test bench');
  await page.getByLabel('Price (EUR)').fill('12.5');
  await page.getByLabel('Category').selectOption('garden');
  await page.getByLabel('Condition').selectOption('good');
  await page.getByLabel('Coarse area').selectOption('Harbour');
  await page.getByRole('button', { name: 'Submit (simulated)' }).click();
  await page.getByText('Simulated: your listing exists only').waitFor({ timeout: 3000 });
  check('valid submit shows simulated confirmation', true);

  await page.goto(`${base}#/barter`);
  check('barter page is read-only with table', await page.getByRole('table').isVisible());

  await page.goto(`${base}#/`);
  await page.getByRole('link', { name: 'Bicycle, city model' }).click();
  const detailSave = page.getByRole('button', { name: 'Save listing' });
  await detailSave.click();
  check('detail save toggles aria-pressed', (await page.getByRole('button', { name: 'Remove from saved' }).getAttribute('aria-pressed')) === 'true');

  await page.goto(`${base}#/`);
  await page.getByRole('button', { name: 'Next' }).click();
  check('pagination moves to page 2', await page.getByRole('navigation', { name: 'Pagination' }).getByText('Page 2 of').isVisible());

  await page.goto(`${base}#/sell`);
  await page.getByLabel('Title').fill('Draft only');
  await page.reload();
  check('draft restored after reload', (await page.getByLabel('Title').inputValue()) === 'Draft only');
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog', { state: 'detached' });
  check('Escape cancels discard dialog, draft kept', (await page.getByLabel('Title').inputValue()) === 'Draft only');
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await page.waitForSelector('dialog', { state: 'detached' });
  check('confirmed discard clears draft', (await page.getByLabel('Title').inputValue()) === '');

  check(`no uncaught page errors at ${viewport.width}px`, errors.length === 0);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`${failures.length} smoke check(s) failed`);
  process.exit(1);
}
console.log('All smoke checks passed');
