import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const password = 'correct horse local alpha 2026';
async function create(page: Page, name: string) {
  await page.goto('/');
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(password);
  await page.getByRole('button', { name: 'Create a new vault' }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
  return (await page.locator('#principal').textContent())!;
}
async function unlock(page: Page, name: string) {
  await page.locator('[name="vault"]').fill(name);
  await page.locator('[name="passphrase"]').fill(password);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toHaveText(/Vault unlocked/);
}
async function listing(page: Page, title: string, amount = '12500') {
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Description', { exact: true }).fill('A locally persisted item, available for an explicit exchange.');
  await page.getByLabel('Declared value').fill(amount);
  await page.getByLabel('Allow this listing').check();
  await page.getByRole('button', { name: 'Save local draft' }).click();
  await expect(page.locator('#listings').getByRole('heading', { name: title, exact: true })).toBeVisible();
}

test('real persisted identity/listing and isolated peer signed-file exchange', async ({ browser, page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const alice = await create(page, 'alice');
  // This minor-unit amount would lose a cent if converted to a JavaScript number.
  const amount = '900719925474099301';
  const display = /Declared value: CAD\s*9,007,199,254,740,993\.01/;
  await listing(page, '<img src=x onerror=alert(1)> Guitar', amount);
  await expect(page.locator('#listings')).toContainText(display, { timeout: 4000 });
  const published = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Publish signed file' }).click();
  const download = await published;
  const downloadedPath = await download.path();
  if (!downloadedPath) throw new Error('Signed-file download has no readable path');
  const signed = await readFile(downloadedPath, 'utf8');
  await expect(page.locator('#listings')).toContainText('published');
  expect(await page.locator('#listings img').count()).toBe(0);
  await page.reload();
  await expect(page.locator('#access')).toBeVisible();
  await unlock(page, 'alice');
  expect(await page.locator('#principal').textContent()).toBe(alice);
  await expect(page.locator('#listings')).toContainText('Guitar');

  const peerContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const peer = await peerContext.newPage();
    const bob = await create(peer, 'bob');
    expect(bob).not.toBe(alice);
    await expect(peer.locator('#listings')).toContainText('No listings yet');
    await peer.locator('#peer-file').setInputFiles({ name: 'alice-listing.json', mimeType: 'application/json', buffer: Buffer.from(signed) });
    await expect(peer.locator('#peers')).toContainText('Guitar');
    await expect(peer.locator('#peers')).toContainText(display);
    await expect(peer.locator('#status')).toContainText('verified and retained');
    // Repeat the exact same upload; the file input must reset and processing must stay idempotent.
    await peer.locator('#peer-file').setInputFiles({ name: 'alice-listing.json', mimeType: 'application/json', buffer: Buffer.from(signed) });
    await expect(peer.locator('#peers article')).toHaveCount(1);
    const tampered = JSON.parse(signed) as { payload: { title: string } };
    tampered.payload.title = 'Attacker replacement';
    await peer.locator('#peer-file').setInputFiles({ name: 'tampered.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) });
    await expect(peer.locator('#error')).toBeVisible();
    await expect(peer.locator('#peers')).not.toContainText('Attacker replacement');
    await peer.reload();
    await unlock(peer, 'bob');
    await expect(peer.locator('#peers')).toContainText('Guitar');
    await peer.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await peerContext.setOffline(true);
    await expect(peer.locator('#network')).toContainText('Offline');
    await listing(peer, 'Offline table');
    await expect(peer.locator('#listings')).toContainText('Offline table');
    await peer.reload();
    await unlock(peer, 'bob');
    await expect(peer.locator('#network')).toContainText('Offline');
    await peerContext.setOffline(false);
    await expect(peer.locator('#listings')).toContainText('Offline table');
  } finally { await peerContext.close(); }
  expect(errors).toEqual([]);
});

test('wrong passphrase fails without destroying saved records; lock clears private form text', async ({ page }) => {
  await create(page, 'local');
  await listing(page, 'Retained chair');
  await page.getByLabel('Title', { exact: true }).fill('Unsubmitted private text');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('');
  await page.locator('[name="passphrase"]').fill('incorrect passphrase here');
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#error')).toContainText(/Incorrect passphrase|damaged/);
  await expect(page.locator('#workspace')).toBeHidden();
  await unlock(page, 'local');
  await expect(page.locator('#listings')).toContainText('Retained chair');
});

test('encrypted backup restores listings and identity into a new empty vault', async ({ page }) => {
  const principal = await create(page, 'source');
  await listing(page, 'Backup-only lamp');
  await page.locator('#backup-password').fill(password);
  const pending = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name: 'Download encrypted backup' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Backup download has no path');
  const backup = await readFile(path);
  expect(backup.toString()).not.toContain('Backup-only lamp');
  expect(backup.toString()).not.toContain(password);
  await expect(page.locator('#backup-password')).toHaveValue('');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await page.locator('#access details summary').click();
  await page.locator('[name="restore-name"]').fill('restored');
  await page.locator('[name="restore-password"]').fill(password);
  await page.locator('#restore-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup });
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Backup restored');
  expect(await page.locator('#principal').textContent()).toBe(principal);
  await expect(page.locator('#listings')).toContainText('Backup-only lamp');
  await page.reload();
  await unlock(page, 'restored');
  await expect(page.locator('#listings')).toContainText('Backup-only lamp');
});

test('concurrent tabs cannot both acquire a vault writer', async ({ page, context }) => {
  await create(page, 'shared');
  const second = await context.newPage();
  await second.goto('/');
  await second.locator('[name="vault"]').fill('shared');
  await second.locator('[name="passphrase"]').fill(password);
  await second.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(second.locator('#error')).toBeVisible();
  await expect(second.locator('#workspace')).toBeHidden();
  await listing(page, 'First writer remains valid');
  await page.getByRole('button', { name: 'Lock vault' }).click();
  await unlock(second, 'shared');
  await expect(second.locator('#listings')).toContainText('First writer remains valid');
});

test('mobile layout stays within viewport and exposes keyboard error feedback', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await create(page, 'mobile');
  await listing(page, 'Long title for a neighbourhood listing which wraps on a small mobile screen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const buttons = await page.getByRole('button').all();
  for (const button of buttons) {
    if (!await button.isVisible()) continue;
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: testInfo.outputPath('mobile390.png'), fullPage: true });
  await page.locator('#backup-password').fill('wrong passphrase for backup');
  await page.getByRole('button', { name: 'Download encrypted backup' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#error')).toBeFocused();
});

async function downloadedAction(page: Page, name: string): Promise<Buffer> {
  const pending = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name, exact: true }).click();
  let downloaded;
  try { downloaded = await pending; }
  catch (error) { throw new Error(`${name}: download failed; visible error: ${await page.locator('#error').textContent()}`, { cause: error }); }
  const file = await downloaded.path();
  if (!file) throw new Error(`Missing download for ${name}`);
  await expect(page.locator('#error')).toBeHidden();
  return readFile(file);
}
async function importBarter(page: Page, buffer: Buffer) {
  await page.getByLabel('Import a signed want, proposal, consent, reservation or withdrawal JSON file', { exact: true }).setInputFiles({ name: 'statement.json', mimeType: 'application/json', buffer });
  await expect(page.locator('#status')).toHaveText('Signed statement verified and saved locally.');
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Refresh barter records', exact: true })).toBeEnabled();
}
for (const count of [2, 3, 4]) {
  test(`${count} isolated principals explicitly agree to a real signed barter cycle and retain it after restart`, async ({ browser }) => {
    test.setTimeout(180000);
    const contexts = await Promise.all(Array.from({ length: count }, () => browser.newContext({ baseURL: 'http://127.0.0.1:4173' })));
    try {
      const pages = await Promise.all(contexts.map(context => context.newPage()));
      const start = Date.now();
      const listings: Buffer[] = [];
      for (const [i, page] of pages.entries()) {
        await page.clock.setFixedTime(new Date(start));
        await create(page, `party${i}`);
        await listing(page, `Cycle item ${i}`);
        listings.push(await downloadedAction(page, 'Publish signed file'));
      }
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of listings.entries()) {
          if (i === j) continue;
          await page.locator('#peer-file').setInputFiles({ name: `listing${j}.json`, mimeType: 'application/json', buffer });
          await expect(page.locator('#status')).toHaveText('Peer statement verified and retained locally.');
          await expect(page.getByRole('button', { name: 'Refresh barter records', exact: true })).toBeEnabled();
        }
        await page.getByLabel('Include unfamiliar signing identities', { exact: false }).check();
      }
      const wants: Buffer[] = [];
      for (const [i, page] of pages.entries()) {
        const own = JSON.parse(listings[i]!.toString()) as { cid: string };
        const requested = JSON.parse(listings[(i + 1) % count]!.toString()) as { cid: string };
        await page.getByLabel('I offer my published item').selectOption(own.cid);
        await page.getByLabel('I want this retained peer item').selectOption(requested.cid);
        wants.push(await downloadedAction(page, 'Sign and download this want'));
      }
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of wants.entries()) if (i !== j) await importBarter(page, buffer);
        // Virtual browser Date, explicitly advanced across the specification's aging interval.
        await page.clock.setFixedTime(new Date(start + 16 * 60000));
      }
      const coordinator = pages[0]!;
      await coordinator.getByRole('button', { name: 'Discover compatible cycles', exact: true }).click();
      // UX-2: dynamic matching results must be announced by an accessible live status, not only added visually.
      await expect(coordinator.locator('section[aria-label="Local barter coordination"] [role="status"]')).toContainText('matching suggestions');
      await expect(coordinator.getByRole('heading', { name: `${count}-party cycle`, exact: true })).toBeVisible();
      const proposal = await downloadedAction(coordinator, 'Propose this exact cycle');
      for (const page of pages.slice(1)) await importBarter(page, proposal);
      const reservations: Buffer[] = [];
      for (const page of pages) reservations.push(await downloadedAction(page, 'Reserve my item and download signed claim'));
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of reservations.entries()) if (i !== j) await importBarter(page, buffer);
        await expect(page.getByRole('heading', { name: /Proposal .* · proposed/ })).toBeVisible();
      }
      const consents: Buffer[] = [];
      for (const page of pages) consents.push(await downloadedAction(page, 'I consent to this exact proposal'));
      for (const [i, page] of pages.entries()) {
        for (const [j, buffer] of consents.entries()) if (i !== j) await importBarter(page, buffer);
        await expect(page.getByRole('heading', { name: /Proposal .* · committed/ })).toBeVisible();
        await page.reload();
        await unlock(page, `party${i}`);
        await expect(page.getByRole('heading', { name: /Proposal .* · committed/ })).toBeVisible();
      }
      if (count === 2) {
        const withdrawal = await downloadedAction(coordinator, 'Withdraw from this proposal');
        await importBarter(pages[1]!, withdrawal);
        for (const page of pages) {
          await expect(page.getByRole('heading', { name: /Proposal .* · cancelled/ })).toHaveCount(1);
          await expect(page.getByRole('button', { name: 'Release local hold', exact: true })).toHaveCount(0);
          await page.getByLabel('Include unfamiliar signing identities', { exact: false }).check();
        }
        // A fresh proposal receives no consent; advance the explicit virtual clock past its deadline.
        await coordinator.getByRole('button', { name: 'Discover compatible cycles', exact: true }).click();
        const unanswered = await downloadedAction(coordinator, 'Propose this exact cycle');
        await importBarter(pages[1]!, unanswered);
        for (const page of pages) {
          await page.clock.setFixedTime(new Date(start + 78 * 60000));
          await page.getByRole('button', { name: 'Refresh barter records', exact: true }).click();
          await expect(page.getByRole('heading', { name: /Proposal .* · cancelled/ })).toHaveCount(2);
          await expect(page.getByRole('heading', { name: /Proposal .* · proposed/ })).toHaveCount(0);
          await expect(page.locator('#barter')).toContainText('consent_timeout');
        }
      }
    } finally { await Promise.all(contexts.map(context => context.close())); }
  });
}
