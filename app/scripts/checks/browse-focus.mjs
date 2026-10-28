// Browser checks for focus on the browse page: Save and Unsave keep focus on the same listing's button,
// typing and filter changes keep focus in the form, and Clear filters moves focus into the results region.
// Start the demo first and set BASE, for example: PORT=4186 node scripts/serve.mjs & BASE=http://localhost:4186/ node scripts/checks/browse-focus.mjs
import { BASE, loadPlaywright, createChecker } from './lib.mjs';

const { chromium } = loadPlaywright();
const { check, finish } = createChecker();
const route = (hash) => new URL(hash, BASE).href;

const browser = await chromium.launch();
const errors = [];

// Each page gets its own browser context, so localStorage starts empty for every section.
async function freshPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}

// Describes the focused element as plain data so it can be compared across a redraw.
const focusedInfo = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName ?? null,
      type: el?.getAttribute('type') ?? null,
      name: el?.getAttribute('name') ?? null,
      pressed: el?.getAttribute('aria-pressed') ?? null,
      label: el?.getAttribute('aria-label') ?? null,
      isBody: el === document.body || el === null,
      inResults: Boolean(el && document.querySelector('.results')?.contains(el)),
      isResults: el === document.querySelector('.results'),
    };
  });

const statusText = (page) => page.evaluate(() => document.getElementById('status')?.textContent ?? '');
const waitForStatus = (page, text) =>
  page.waitForFunction((t) => document.getElementById('status')?.textContent.includes(t), text, { timeout: 2000 }).then(() => true, () => false);

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const size = `${viewport.width}px`;

  // (a), (b), (c): Save and Unsave on the first card keep focus on that card's Save button.
  {
    const page = await freshPage(viewport);
    await page.goto(route('#/'));
    await page.waitForSelector('.card-grid');
    const firstCard = page.locator('.card').first();
    const title = (await firstCard.locator('h3 a').textContent())?.trim() ?? '';
    // The button is found by its accessible name, so the same listing is identified after the redraw.
    const saveButton = firstCard.getByRole('button', { name: `Save ${title}`, exact: true });
    check(`browse ${size}: first card starts with Save for "${title}"`, (await saveButton.count()) === 1);

    await saveButton.focus();
    await page.keyboard.press('Enter');
    const afterSave = await focusedInfo(page);
    check(
      `browse ${size}: (a) Enter on Save leaves focus on a button for the same listing`,
      afterSave.tag === 'BUTTON' && afterSave.label === `Unsave ${title}`,
    );
    check(`browse ${size}: (a) focused button has aria-pressed "true"`, afterSave.pressed === 'true');
    check(`browse ${size}: (a) focused button label starts with "Unsave"`, (afterSave.label ?? '').startsWith('Unsave'));
    check(`browse ${size}: (a) focus is not body`, !afterSave.isBody);
    check(`browse ${size}: (c) status region reads "Listing saved: ${title}."`, await waitForStatus(page, `Listing saved: ${title}.`));
    check(`browse ${size}: (c) status text is the saved message`, (await statusText(page)).trim() === `Listing saved: ${title}.`);

    await page.keyboard.press('Enter');
    const afterUnsave = await focusedInfo(page);
    check(
      `browse ${size}: (b) second Enter keeps focus on the same listing's button`,
      afterUnsave.tag === 'BUTTON' && afterUnsave.label === `Save ${title}`,
    );
    check(`browse ${size}: (b) focused button returns to aria-pressed "false"`, afterUnsave.pressed === 'false');
    check(`browse ${size}: (b) focused button label returns to "Save ${title}"`, afterUnsave.label === `Save ${title}`);
    check(`browse ${size}: (b) status region reads "Listing removed from saved: ${title}."`, await waitForStatus(page, `Listing removed from saved: ${title}.`));
    await page.close();
  }

  // (d): typing in the search box does not move focus, and the results still narrow.
  {
    const page = await freshPage(viewport);
    await page.goto(route('#/'));
    await page.waitForSelector('.card-grid');
    const search = page.getByRole('searchbox');
    await search.focus();
    await page.keyboard.type('bicycle');
    const info = await focusedInfo(page);
    check(`browse ${size}: (d) focus stays in the search input while typing`, info.tag === 'INPUT' && info.name === 'query');
    check(`browse ${size}: (d) search narrows results to 1 listing`, ((await page.locator('.results-summary').textContent()) ?? '').includes('1 listing found'));
    await page.close();
  }

  // (e): Clear filters moves focus into the results region, not to body.
  {
    const page = await freshPage(viewport);
    await page.goto(route('#/'));
    await page.waitForSelector('.card-grid');
    await page.getByRole('searchbox').fill('zzz-no-match');
    await page.waitForSelector('.state-empty');
    const clear = page.getByRole('button', { name: 'Clear filters' });
    await clear.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.card-grid');
    check(`browse ${size}: (e) Clear filters restores the full list (18 listings)`, ((await page.locator('.results-summary').textContent()) ?? '').includes('18 listings found'));
    check(`browse ${size}: (e) Clear filters empties the search box`, (await page.getByRole('searchbox').inputValue()) === '');
    const info = await focusedInfo(page);
    check(`browse ${size}: (e) focus after Clear filters is inside the results region`, info.inResults);
    check(`browse ${size}: (e) focus after Clear filters is not body`, !info.isBody);
    await page.close();
  }
}

check('no uncaught page errors during browse focus checks', errors.length === 0);
await browser.close();
finish();
