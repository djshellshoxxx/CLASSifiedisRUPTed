// Browser checks for the account save toggle, browse paging focus, saved-page focus and 390px overflow.
// Start the demo first and set BASE, for example: PORT=4182 node scripts/serve.mjs & BASE=http://localhost:4182/ node scripts/checks/account-browse.mjs
import { BASE, loadPlaywright, createChecker } from './lib.mjs';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const route = (hash) => new URL(hash, BASE).href;
const MOBILE = { width: 390, height: 844 };

const browser = await chromium.launch();
const errors = [];

// Each newPage() gets its own browser context, so localStorage starts empty for every section.
async function freshPage(viewport = MOBILE) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}

const activeIsBody = (page) => page.evaluate(() => document.activeElement === document.body || document.activeElement === null);
const focusInResults = (page) =>
  page.evaluate(() => {
    const region = document.querySelector('.results');
    return Boolean(region && (region === document.activeElement || region.contains(document.activeElement)));
  });
const waitForStatus = (page, text) => page.waitForFunction((t) => document.getElementById('status')?.textContent.includes(t), text, { timeout: 2000 }).then(() => true, () => false);
const savedCountOf = (page) => page.locator('dt:text-is("Saved listings") + dd').textContent();

// (a) Account page: the Save buttons under "Your listings" toggle the saved repository.
{
  const page = await freshPage(MOBILE);
  await page.goto(route('#/account'));
  await page.waitForSelector('#mine-heading');
  const mine = page.locator('[aria-labelledby="mine-heading"]');
  const button = mine.getByRole('button').first();
  const label0 = await button.getAttribute('aria-label');
  const title = label0.replace(/^Save /, '');
  const pressed0 = await button.getAttribute('aria-pressed');
  const count0 = await savedCountOf(page);

  check('account: first own-listing button starts unsaved', label0.startsWith('Save ') && pressed0 === 'false');

  await button.click();
  check('account: press sets aria-pressed to true', (await button.getAttribute('aria-pressed')) === 'true');
  check(`account: press changes label to "Unsave ${title}"`, (await button.getAttribute('aria-label')) === `Unsave ${title}`);
  check('account: button text reads Saved after press', ((await button.textContent()) ?? '').trim() === 'Saved');
  check('account: Saved listings count rises by one', Number(await savedCountOf(page)) === Number(count0) + 1);
  check('account: change is announced through the status region', await waitForStatus(page, `Listing saved: ${title}.`));

  await page.goto(route('#/saved'));
  await page.waitForSelector('h1:text-is("Saved listings")');
  check('saved page lists the listing pressed on account', (await page.locator('.card').filter({ hasText: title }).count()) === 1);

  await page.goto(route('#/account'));
  await page.waitForSelector('#mine-heading');
  const again = mine.getByRole('button').first();
  check('account: saved state persists after reopening account', (await again.getAttribute('aria-pressed')) === 'true');
  await again.click();
  check('account: second press returns aria-pressed to false', (await again.getAttribute('aria-pressed')) === 'false');
  check('account: second press restores the original label', (await again.getAttribute('aria-label')) === label0);
  check('account: second press restores the original count', (await savedCountOf(page)) === count0);
  check('account: unsave is announced', await waitForStatus(page, `Listing removed from saved: ${title}.`));
  await page.close();
}

{
  const page = await freshPage(MOBILE);
  await page.goto(route('#/account'));
  await page.waitForSelector('#mine-heading');
  const button = page.locator('[aria-labelledby="mine-heading"]').getByRole('button').first();
  const label0 = await button.getAttribute('aria-label');
  const count0 = await savedCountOf(page);
  await button.click();
  await button.click();
  check('account: two presses leave aria-pressed unchanged', (await button.getAttribute('aria-pressed')) === 'false');
  check('account: two presses leave the label unchanged', (await button.getAttribute('aria-label')) === label0);
  check('account: two presses leave the count unchanged', (await savedCountOf(page)) === count0);
  await page.goto(route('#/saved'));
  await page.waitForSelector('h1:text-is("Saved listings")');
  check('account: two presses leave saved page empty', (await page.locator('.card').count()) === 0);
  await page.close();
}

// (b) Browse paging moves focus to the results region and announces the page. Filters do not move focus.
for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const size = `${viewport.width}px`;
  const page = await freshPage(viewport);
  await page.goto(route('#/'));
  await page.waitForSelector('.card-grid');
  check(`browse ${size}: 18 listings found`, (await page.locator('.results-summary').textContent())?.includes('18 listings found'));
  check(`browse ${size}: 6 cards on page 1`, (await page.locator('.card').count()) === 6);
  check(`browse ${size}: Page 1 of 3 visible before paging`, await page.locator('.pager').getByText('Page 1 of 3').isVisible());

  await page.getByRole('button', { name: 'Next' }).click();
  check(`browse ${size}: Next shows "Page 2 of 3"`, await page.locator('.pager').getByText('Page 2 of 3').isVisible());
  check(`browse ${size}: focus after Next is inside the results region`, await focusInResults(page));
  check(`browse ${size}: focus after Next is not body`, !(await activeIsBody(page)));
  check(`browse ${size}: Next announces "Page 2 of 3"`, await waitForStatus(page, 'Page 2 of 3'));

  await page.getByRole('button', { name: 'Next' }).click();
  check(`browse ${size}: Next to last page shows "Page 3 of 3"`, await page.locator('.pager').getByText('Page 3 of 3').isVisible());
  check(`browse ${size}: focus on last page stays in results, not body`, (await focusInResults(page)) && !(await activeIsBody(page)));
  check(`browse ${size}: last page has 6 cards (18 listings, 6 per page)`, (await page.locator('.card').count()) === 6);

  await page.getByRole('button', { name: 'Previous' }).click();
  check(`browse ${size}: Previous shows "Page 2 of 3"`, await page.locator('.pager').getByText('Page 2 of 3').isVisible());
  check(`browse ${size}: focus after Previous is inside the results region`, await focusInResults(page));
  check(`browse ${size}: Previous announces "Page 2 of 3"`, await waitForStatus(page, 'Page 2 of 3'));
  await page.close();

  // Typing and filter changes must not move focus away from the control being used.
  const typing = await freshPage(viewport);
  await typing.goto(route('#/'));
  await typing.waitForSelector('.card-grid');
  const search = typing.getByRole('searchbox');
  await search.focus();
  await typing.keyboard.type('bicycle');
  check(`browse ${size}: typing in search keeps focus in the search box`, await search.evaluate((el) => el === document.activeElement));
  check(`browse ${size}: search narrows results`, (await typing.locator('.results-summary').textContent())?.includes('1 listing found'));
  const sort = typing.locator('select[name="sort"]');
  await sort.focus();
  await sort.selectOption('price-asc');
  check(`browse ${size}: changing sort keeps focus on the sort control`, await sort.evaluate((el) => el === document.activeElement));
  await typing.close();
}

// (c) Saved page: unsaving with the keyboard leaves focus on the heading, or on the empty-state link when none are left.
{
  const page = await freshPage(MOBILE);
  await page.goto(route('#/'));
  await page.waitForSelector('.card-grid');
  await page.getByRole('button', { name: 'Save Oak dining table', exact: true }).click();
  await page.getByRole('button', { name: 'Save Bicycle, city model', exact: true }).click();

  await page.goto(route('#/saved'));
  await page.waitForSelector('h1:text-is("Saved listings")');
  const first = page.getByRole('button', { name: 'Unsave Oak dining table', exact: true });
  await first.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.card').length === 1);
  check('saved: one card remains after unsaving the first', (await page.locator('.card').count()) === 1);
  check('saved: focus after unsave is not body', !(await activeIsBody(page)));
  check('saved: focus after unsave lands on the page heading', await page.evaluate(() => document.activeElement?.tagName === 'H1'));

  const last = page.getByRole('button', { name: 'Unsave Bicycle, city model', exact: true });
  await last.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.state-empty');
  check('saved: empty state shown after the last unsave', await page.getByText('Nothing saved yet.').isVisible());
  check('saved: focus after last unsave is not body', !(await activeIsBody(page)));
  check('saved: focus after last unsave lands on the empty-state link', await page.evaluate(() => document.activeElement?.textContent === 'Browse listings'));
  await page.close();
}

// (d) No horizontal overflow at 390px on account, browse and saved, with and without saved items.
{
  const page = await freshPage(MOBILE);
  const overflows = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await page.goto(route('#/account'));
  await page.waitForSelector('#mine-heading');
  check('390px: no horizontal overflow on #/account', !(await overflows()));
  await page.goto(route('#/'));
  await page.waitForSelector('.card-grid');
  check('390px: no horizontal overflow on #/', !(await overflows()));
  await page.goto(route('#/saved'));
  await page.waitForSelector('h1:text-is("Saved listings")');
  check('390px: no horizontal overflow on #/saved (empty)', !(await overflows()));

  await page.goto(route('#/'));
  await page.waitForSelector('.card-grid');
  await page.getByRole('button', { name: 'Save Oak dining table', exact: true }).click();
  await page.goto(route('#/saved'));
  await page.waitForSelector('.card-grid');
  check('390px: no horizontal overflow on #/saved (with items)', !(await overflows()));
  await page.close();
}

check('no uncaught page errors during account and browse checks', errors.length === 0);
await browser.close();
finish();
